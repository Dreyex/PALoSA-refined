import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import fsExtra from "fs-extra";
import cron from "node-cron";

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

const foldersToClean = [
    path.join(process.cwd(), "uploads"),
    path.join(process.cwd(), "output"),
    path.join(process.cwd(), "download"),
];

// Ensure directories exist (nur bei Bedarf!)
if (!fs.existsSync(dir1)) fs.mkdirSync(dir1, { recursive: true });
if (!fs.existsSync(dir2)) fs.mkdirSync(dir2, { recursive: true });
if (!fs.existsSync(dir3)) fs.mkdirSync(dir3, { recursive: true });

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
        cookie: { secure: true, maxAge: 1000 * 60 * 60 },
    })
);

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
    const dataJson = {
        title: "PALoSA",
        settingTitles: ["Txt & Log", "JSON", "XML", "Regex Suchmuster"],
        sessionId: req.sessionID,
    };
    res.json(dataJson);
});

// Upload-Route
app.post("/api/upload", upload.array("files"), (req, res) => {
    res.json({
        success: true,
        path: req.files.path,
        originalname: req.files.originalname,
        buttonType: req.body.buttonType,
    });
});

app.post("/api/pseudo", (req, res) => {
    try {
        const settings = req.body;
        startProcessManager(req.sessionID, settings);
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Fehler bei der Verarbeitung" });
    }
});

app.get("/api/download/:sessionId", (req, res) => {
    const sessionId = req.params.sessionId;

    if (typeof sessionId !== "string") {
        // Falls doch Objekt, versuche String daraus zu machen
        sessionId = JSON.stringify(sessionId);
    }
    console.log(sessionId);

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

    // Sende die Datei an den Client
    res.download(zipFilePath, (err) => {
        if (err) {
            console.error("Fehler beim Dateiversand:", err);
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
        if (fs.existsSync(dir1Session)) {
            fsExtra.removeSync(dir1Session);
            console.log(`Directory removed: ${dir1Session}`);
        }
        if (fs.existsSync(dir2Session)) {
            fsExtra.removeSync(dir2Session);
            console.log(`Directory removed: ${dir2Session}`);
        }
        if (fs.existsSync(dir3Session)) {
            fsExtra.removeSync(dir3Session);
            console.log(`Directory removed: ${dir3Session}`);
        }
    } catch (error) {
        return res.status(500).send(`Fehler beim Löschen der Dateien für Session: ${sessionId}`);
    }

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

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
