import path from "path";
import fs from "fs/promises";
import { createFile } from "./createFile.js";

export default async function mergeSettings(sessionId, settings, type) {
    const dirPath = path.join("uploads", sessionId, type);

    try {
        // 1. Finde die einzige Datei im Verzeichnis
        let files;
        let fileName;
        try {
            files = await fs.readdir(dirPath);
            fileName = files[0];
        } catch (err) {
            if (err.code === "ENOENT") {
                const content = `{ "sources": [], "derived": {} }`;
                await createFile(dirPath, "config", "json", content); //erstellt auch die Directory
                fileName = "config.json";
            } else {
                throw err;
            }
        }

        const filePath = path.join(dirPath, fileName);

        // 2. Lese die JSON-Datei
        const fileContent = await fs.readFile(filePath, "utf-8");
        let jsonData = JSON.parse(fileContent);

        // 3. Mappe `type` auf den passenden Key in settings
        const keyMap = {
            json: "jsonSettings",
            xml: "xmlSettings",
            log: "logSettings",
            regex: "regexSettings", // für Vollständigkeit (wird unten sowieso mit gemerged)
        };

        const mainKey = keyMap[type];
        //console.log(mainKey);
        if (!mainKey) {
            throw new Error(`Unbekannter Typ: ${type}`);
        }

        // 4. Hole die settings für Typ und für regex (immer dabei)
        const mainSettings = settings[mainKey] ?? {};
        const regexSettings = settings.regexSettings ?? {};

        // 5. Extrahiere checkedOptions und patterns aus beiden
        const collectArrays = (obj) => ({
            checkedOptions: Array.isArray(obj.checkedOptions)
                ? obj.checkedOptions
                : [],
            patterns: Array.isArray(obj.patterns) ? obj.patterns : [],
        });

        const mainArrays = collectArrays(mainSettings);
        const regexArrays = collectArrays(regexSettings);

        // 6. Sicherstellen, dass jsonData.sources ein Array ist
        if (!Array.isArray(jsonData.sources)) {
            jsonData.sources = [];
        }

        // 7. Merge alle Quellen ohne Duplikate
        const mergedSet = new Set(jsonData.sources);

        [
            ...mainArrays.checkedOptions,
            ...mainArrays.patterns,
            ...regexArrays.checkedOptions,
            ...regexArrays.patterns,
        ].forEach((item) => mergedSet.add(item));

        jsonData.sources = Array.from(mergedSet);

        // 8. Schreibe zurück in die Datei
        await fs.writeFile(
            filePath,
            JSON.stringify(jsonData, null, 2),
            "utf-8"
        );
        
        //9. Datei umbenennen
        const newPath = path.join(dirPath, "config.json");
        await fs.rename(filePath, newPath);

        //console.log( `Settings erfolgreich in Datei ${fileName} im Ordner ${type} für Session ${sessionId} gemerged.`);
    } catch (err) {
        console.error("Fehler bei mergeSettings:", err);
        throw err;
    }
}
