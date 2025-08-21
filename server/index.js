import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import fsExtra from "fs-extra";
import cron from "node-cron";
import session from "express-session";
import multer from "multer";
import morgan from "morgan";
import winston from "winston";
import startProcessManager from "./utils/processManager.js";

const SESSION_MAX_AGE_MS = 1000 * 60 * 60; // 1 Stunde

const dirUploads = path.join(process.cwd(), "uploads");
const dirOutput = path.join(process.cwd(), "output");
const dirDownload = path.join(process.cwd(), "download");
const logDir = path.join(process.cwd(), "logs");

const foldersToClean = [dirUploads, dirOutput, dirDownload];

// Ensure directories exist
[dirUploads, dirOutput, dirDownload, logDir].forEach((dir) => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

function cleanOldSessionFolders() {
    const now = Date.now();
    foldersToClean.forEach((folder) => {
        if (fs.existsSync(folder)) {
            fs.readdirSync(folder).forEach((entry) => {
                const entryPath = path.join(folder, entry);
                try {
                    const stats = fs.statSync(entryPath);
                    if (now - stats.mtimeMs > SESSION_MAX_AGE_MS) {
                        fs.rmSync(entryPath, { recursive: true, force: true });
                        console.log(
                            `[${new Date().toISOString()}] Gelöscht: ${entryPath}`
                        );
                    }
                } catch (err) {
                    console.error(
                        `[${new Date().toISOString()}] Fehler beim Löschen von ${entryPath}:`,
                        err
                    );
                }
            });
        }
    });
}

cleanOldSessionFolders();
cron.schedule("0 * * * *", cleanOldSessionFolders);

const app = express();
const PORT = process.env.PORT || 3001;
const isProd = process.env.NODE_ENV === "production";

// Middleware
app.use(cors());
app.use(express.json());

app.use(
    session({
        secret: "dein-geheimes-session-secret",
        resave: false,
        saveUninitialized: true,
        cookie: { secure: isProd, maxAge: SESSION_MAX_AGE_MS },
    })
);

// Setup logging
const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({
            filename: path.join(logDir, "error.log"),
            level: "error",
        }),
        new winston.transports.File({
            filename: path.join(logDir, "combined.log"),
        }),
    ],
});

if (!isProd) {
    // In Dev: log to console as well
    logger.add(
        new winston.transports.Console({ format: winston.format.simple() })
    );
}

// HTTP Request Logging
if (!isProd) {
    // Dev Mode uses morgan to log HTTP requests to console
    app.use(morgan("dev"));
} else {
    // Production logs to file
    const accessLogStream = fs.createWriteStream(
        path.join(logDir, "access.log"),
        { flags: "a" }
    );
    app.use(morgan("combined", { stream: accessLogStream }));
}

// Winston child logger with sessionID context
app.use((req, _res, next) => {
    const sessionId = req.sessionID || "unknown-session";
    req.logger = logger.child({ sessionId });
    next();
});

// Multer storage config depends on session and buttonType query param
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const sessionId = req.session.id;
        const type = req.query.buttonType;
        let folder;

        if (type === "json") folder = "json";
        else if (type === "xml") folder = "xml";
        else folder = "other";

        const dest = path.join("uploads", sessionId, folder);
        fs.mkdirSync(dest, { recursive: true });
        cb(null, dest);
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    },
});

const upload = multer({ storage });


app.get("/api", (req, res) => {
    const sessionId = req.sessionID;
    const dataJson = {
        title: "PALoSA",
        settingTitles: ["Txt & Log", "JSON", "XML", "Regex Suchmuster"],
        sessionId: req.sessionID,
    };
    req.logger.info(`API Root was fetched by User ${sessionId}`);
    res.json(dataJson);
});

// Upload-Route
app.post("/api/upload/:sessionId", upload.array("files"), (req, res) => {
    const sessionId = req.params.sessionId; // Session-ID aus der Session
    req.logger.info(`User ${sessionId} uploaded files`, {
        files: req.files.map((f) => ({
            originalname: f.originalname,
            size: f.size,
        })),
        buttonType: req.body.buttonType,
    });
    res.json({
        success: true,
        path: req.files.path,
        originalname: req.files.originalname,
        buttonType: req.body.buttonType,
    });
});

app.post("/api/pseudo/:sessionId", async (req, res) => {
    const sessionId = req.params.sessionId;
    try {
        const settings = req.body;
        req.logger.info(`User ${sessionId} started pseudonymizing process`);
        await startProcessManager(sessionId, settings, req.logger);
        req.logger.info(`User ${sessionId} finished pseudonymizing process`);
        res.json({ success: true });
    } catch (error) {
        req.logger.error(
            `User ${sessionId} had an error during pseudonymizing process`,
            { error }
        );
        res.status(500).json({ error: "Fehler bei der Verarbeitung" });
    }
});

app.get("/api/download/:sessionId", (req, res) => {
    let sessionId = req.params.sessionId;

    if (typeof sessionId !== "string") {
        // Falls doch Objekt, versuche String daraus zu machen
        sessionId = JSON.stringify(sessionId);
    }
    //console.log(sessionId);

    // Pfad zur ZIP-Datei, z. B. "output/<sessionId>/pseudo-files.zip"
    const zipFilePath = path.join(
        process.cwd(),
        "download",
        sessionId,
        "pseudo-files.zip"
    );

    // Setze den Content-Type für ZIP-Dateien
    res.setHeader("Content-Type", "application/zip");

    // Optional: Content-Disposition, damit der Browser die Datei als Download behandelt
    res.setHeader(
        "Content-Disposition",
        `attachment; filename=pseudo-files.zip`
    );

    // Logging des Download-Vorgangs
    req.logger.info(`User ${sessionId} requested file download`);
    // Sende die Datei an den Client
    res.download(zipFilePath, (err) => {
        if (err) {
            req.logger.error("Fehler beim Dateiversand:", err);
            if (!res.headersSent) {
                res.status(500).send("Fehler beim Herunterladen der Datei.");
            }
        }
    });
});

app.post("/api/clean/:sessionId", (req, res) => {
    const sessionId = req.params.sessionId;
    const dir1Session = path.join(process.cwd(), "uploads", sessionId);
    const dir2Session = path.join(process.cwd(), "output", sessionId);
    const dir3Session = path.join(process.cwd(), "download", sessionId);

    try {
        req.logger.info(`User §{sessionId} started Cleanup`);
        if (fs.existsSync(dir1Session)) {
            fsExtra.removeSync(dir1Session);
            req.logger.info(`Directory removed: ${dir1Session}`);
        }
        if (fs.existsSync(dir2Session)) {
            fsExtra.removeSync(dir2Session);
            req.logger.info(`Directory removed: ${dir2Session}`);
        }
        if (fs.existsSync(dir3Session)) {
            fsExtra.removeSync(dir3Session);
            req.logger.info(`Directory removed: ${dir3Session}`);
        }
        req.logger.info(`User §{sessionId} finished Cleanup`);
    } catch {
        req.logger.error(`User §{sessionId} had an error during Cleanup`);
        return res
            .status(500)
            .send(`Fehler beim Löschen der Dateien für Session: ${sessionId}`);
    }
    req.logger.info(`Session of User §{sessionId} gets destroyed`);
    // Session zerstören
    req.session.destroy((err) => {
        if (err) {
            console.error("Fehler beim Zerstören der Session:", err);
            return res.status(500).send("Fehler beim Zerstören der Session");
        }
        res.json({
            success: true,
            message: "Session und Verzeichnisse erfolgreich gelöscht.",
        });
    });
});

// Production: serve static files (SPA) from client/dist
if (isProd) {
    app.use(express.static(path.join(process.cwd(), "../client/dist")));
    app.get("/*splat", (req, res) => {
        res.sendFile(path.join(process.cwd(), "../client/dist", "index.html"));
    });
}

app.use((err, req, res, next) => {
    logger.error(`Error in ${req.method} ${req.url}: ${err.message}`, {
        stack: err.stack,
    });
    if (!res.headersSent) {
        res.status(500).json({ error: "Interner Serverfehler" });
    } else {
        next(err);
    }
});

app.listen(PORT, () => {
    logger.info("Server started");
    console.log(`Server is running on http://localhost:${PORT}`);
});
