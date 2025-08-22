import path from "path";
import fs from "fs/promises";
import { createFile } from "./createFile.js";

/**
 * Führt die aktuellen Verarbeitungseinstellungen mit einer bestehenden Konfigurationsdatei 
 * (`config.json`) für einen spezifischen Session- und Dateityp zusammen.
 * 
 * Die Funktion:
 * 1. Sucht im Verzeichnis `uploads/<sessionId>/<type>` nach einer vorhandenen Config-Datei.
 *    - Falls diese nicht existiert, wird eine Default-Config `{ "sources": [], "derived": {} }` erstellt.
 * 2. Liest die bestehende Konfiguration und mappt `type` auf den entsprechenden Key innerhalb von `settings`.
 * 3. Extrahiert `checkedOptions` und `patterns` sowohl aus den typenspezifischen Einstellungen 
 *    als auch aus den allgemeinen `regexSettings`.
 * 4. Führt alle Quellen (`sources`) ohne Duplikate in `jsonData.sources` zusammen.
 * 5. Speichert die aktualisierte Config als `config.json` im Zielverzeichnis.
 *
 * Unterstützte `type`-Werte und ihre Zuordnung zu `settings`:
 * - `"json"` → `jsonSettings`
 * - `"xml"` → `xmlSettings`
 * - `"log"` → `logSettings`
 * - `"regex"` → `regexSettings`
 *
 * @async
 * @function mergeSettings
 * @param {string} sessionId - Eindeutige ID der Session, deren Config angepasst werden soll.
 * @param {Object} settings - Die aktuellen Verarbeitungseinstellungen (z. B. aus der UI oder einem Request).
 * @param {Object} [settings.jsonSettings] - Einstellungen für JSON-Dateien (Felder: `checkedOptions`, `patterns`).
 * @param {Object} [settings.xmlSettings] - Einstellungen für XML-Dateien.
 * @param {Object} [settings.logSettings] - Einstellungen für Log-Dateien.
 * @param {Object} [settings.regexSettings] - Globale reguläre Ausdrucksdefinitionen.
 * @param {string} type - Dateityp, dessen Config gemerged werden soll (`"json"`, `"xml"`, `"log"`, `"regex"`).
 * @param {string} [dir] - Optional: Base directory path. Defaults to "server/uploads/sessionId".
 * @param {import('winston').Logger} logger - Logger für die Ausgaben im Log
 * 
 * @returns {Promise<void>} Kein Rückgabewert – die Funktion schreibt die gemergte Config-Datei ins Dateisystem.
 * 
 * @throws {Error} Wenn ein unbekannter `type` übergeben wird, 
 *                 das Lesen/Schreiben der Datei fehlschlägt oder ein anderer unerwarteter Fehler auftritt.
 */
export default async function mergeSettings(sessionId, settings, type, dir = null, logger) {
    // Default directory path if not provided
    const baseDir = dir || path.join("server", "uploads", sessionId);
    const dirPath = path.join(baseDir, type);
    const configPath = path.join(dirPath, `${type}-config.json`);

    logger.info(`starting the process of merging the config.js with input patterns`);
    try {
        // 1. Check if config.json exists, if not create it
        let jsonData;
        try {
            const fileContent = await fs.readFile(configPath, "utf-8");
            jsonData = JSON.parse(fileContent);
        } catch (err) {
            if (err.code === "ENOENT") {
                // Create directory and default config
                const content = `{ "sources": [], "derived": {} }`;
                await createFile(dirPath, "config", "json", content, logger);
                jsonData = { sources: [], derived: {} };
            } else {
                throw err;
            }
        }

        // 2. Mappe `type` auf den passenden Key in settings
        const keyMap = {
            json: "jsonSettings",
            xml: "xmlSettings",
            log: "logSettings",
            regex: "regexSettings",
        };

        const mainKey = keyMap[type];
        if (!mainKey) {
            throw new Error(`Unbekannter Typ: ${type}`);
        }

        // 3. Hole die settings für Typ und für regex (immer dabei)
        const mainSettings = settings[mainKey] ?? {};
        const regexSettings = settings.regexSettings ?? {};

        // 4. Extrahiere checkedOptions und patterns aus beiden
        const collectArrays = (obj) => ({
            checkedOptions: Array.isArray(obj.checkedOptions)
                ? obj.checkedOptions
                : [],
            patterns: Array.isArray(obj.patterns) ? obj.patterns : [],
        });

        const mainArrays = collectArrays(mainSettings);
        const regexArrays = collectArrays(regexSettings);

        // 5. Sicherstellen, dass jsonData.sources ein Array ist
        if (!Array.isArray(jsonData.sources)) {
            jsonData.sources = [];
        }

        // 6. Merge alle Quellen ohne Duplikate
        const mergedSet = new Set(jsonData.sources);

        [
            ...mainArrays.checkedOptions,
            ...mainArrays.patterns,
            ...regexArrays.checkedOptions,
            ...regexArrays.patterns,
        ].forEach((item) => mergedSet.add(item));

        jsonData.sources = Array.from(mergedSet);

        // 7. Schreibe zurück in die config.json Datei
        await fs.writeFile(
            configPath,
            JSON.stringify(jsonData, null, 2),
            "utf-8"
        );
        logger.info(`Merging sucessfully completed`);
        //console.log( `Settings erfolgreich in config.json im Ordner ${type} für Session ${sessionId} gemerged.`);
    } catch (err) {
        logger.error("Error in mergeSettings:", {error: err});
        throw err;
    }
}
