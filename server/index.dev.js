import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import fsExtra from "fs-extra";
import cron from "node-cron";
import morgan from "morgan";
import winston from "winston";

//Sessions
import session from "express-session";
//Upload
import multer from "multer";
//utils
import startProcessManager from "./utils/processManager.js";

const SESSION_MAX_AGE_MS = 1000 * 60 * 60; // 1 Stunde

const dir1 = path.join(process.cwd(), "uploads");
const dir2 = path.join(process.cwd(), "output");
const dir3 = path.join(process.cwd(), "download");
const logDir = path.join(process.cwd(), "logs");

const foldersToClean = [
    path.join(process.cwd(), "uploads"),
    path.join(process.cwd(), "output"),
    path.join(process.cwd(), "download"),
];

// Ensure directories exist (nur bei Bedarf!)
if (!fs.existsSync(dir1)) fs.mkdirSync(dir1, { recursive: true });
if (!fs.existsSync(dir2)) fs.mkdirSync(dir2, { recursive: true });
if (!fs.existsSync(dir3)) fs.mkdirSync(dir3, { recursive: true });
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

//Bereinigen von alten Session Ordnern wenn letzter Zugriff älter als 1h
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

// Initialize app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // To parse JSON bodies

app.use(
    session({
        secret: "dein-geheimes-session-secret", // Setze hier ein sicheres Secret!
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false, maxAge: 1000 * 60 * 60 },
    })
);

// Setup Winston Logger
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

// HTTP Request Logging mit Morgan in Datei
const accessLogStream = fs.createWriteStream(path.join(logDir, "access.log"), {
    flags: "a",
});
app.use(morgan("combined", { stream: accessLogStream }));

//Winston Child Logger mit Sessionid Kontext
app.use((req, _res, next) => {
    const sessionId = req.sessionID || "unknown-session";
    // Erstelle Child-Logger mit sessionId im Kontext
    req.logger = logger.child({ sessionId });
    next();
});

// Multer Speicher-Engine dynamisch nach Button-Auswahl
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const sessionId = req.session.id;
        // Hole buttonType aus req.query (weil es vor Multer-Parsing bereits verfügbar ist)
        const type = req.query.buttonType;
        let folder;
        if (type === "json") {
            folder = "json";
        } else if (type === "xml") {
            folder = "xml";
        } else {
            folder = "other";
        }
        const dest = path.join("uploads", sessionId, folder); // z. B. uploads/SESSIONID/xml
        fs.mkdirSync(dest, { recursive: true });
        cb(null, dest);
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    },
});

// Setup Multer
const upload = multer({ storage });

// A sample API route for portfolio data
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

// Start server
app.listen(PORT, () => {
    logger.info("Server started");
    console.log(`Server is running on http://localhost:${PORT}`);
});
