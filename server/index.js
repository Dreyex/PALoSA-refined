import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import fsExtra from "fs-extra";


//Sessions
import session from "express-session";
//Upload
import multer from "multer";
//utils
import startProcessManager from "./utils/processManager.js";

const dir1 = path.join(process.cwd(), "uploads");
const dir2 = path.join(process.cwd(), "output");

// Ensure directories exist and clean them up
if (!fs.existsSync(dir1)) {
    fs.mkdirSync(dir1, { recursive: true });
}
fsExtra.emptyDirSync(dir1);
console.log(`Directory cleaned: ${dir1}`);

if (!fs.existsSync(dir2)) {
    fs.mkdirSync(dir2, { recursive: true });
}
fsExtra.emptyDirSync(dir2);
console.log(`Directory cleaned: ${dir2}`);

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
        cookie: { secure: false }, // Bei HTTPS sollte dies true sein!
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
    // In a real app, you would fetch this from a database
    const dataJson = {
        title: "PALoSA",
        settingTitles: ["Txt & Log", "JSON", "XML", "Regex Suchmuster"],
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
        res.json({ success: true});
    } catch (error) {
        console.error(err);
        res.status(500).json({ error: 'Fehler bei der Verarbeitung' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
