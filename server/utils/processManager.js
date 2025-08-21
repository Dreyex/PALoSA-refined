import mergeSettings from "./mergeSettings.js";
import createDir from "./createDir.js";
import processLogFiles from "./processLogFiles.js";
import processJsonFiles from "./processJsonFiles.js";

import path from "path";
import { fileURLToPath } from "url";
import copyFileToOutput from "./copyFileToOutput.js";
import zipDir from "./archive.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//TODO: Update after finalization
/**
 * Startet den Process-Manager für den Pseudonymisierungsprozess innerhalb einer gegebenen Session.
 *
 * Diese Funktion führt mehrere aufeinanderfolgende Schritte aus, um hochgeladene Dateien zu verarbeiten
 * und in ein Ausgabeverzeichnis zu übertragen. Der Ablauf umfasst:
 * - Erstellen erforderlicher Ausgabeverzeichnisse
 * - Zusammenführen von Pseudonymisierungs-Einstellungen (JSON und XML)
 * - Kopieren der hochgeladenen Dateien in das Ausgabeverzeichnis
 * - Verarbeitung von Log-Dateien
 * - Verarbeitung von JSON-Dateien mit den übergebenen Einstellungen
 * - Packen der Dateien in ein Archiv für den Download
 *
 * @async
 * @function startProcessManager
 * @param {string} sessionId - Eindeutige ID der aktuellen Sitzung. Wird verwendet, um Pfade für Uploads und Ausgaben zu trennen.
 * @param {Object} data - Konfigurationsobjekt oder Nutzdaten, die für die Pseudonymisierung benötigt werden (z. B. Regeln, Parameter).
 * @param {import('winston').Logger} logger - Logger für die Ausgaben im Log
 *
 * @returns {Promise<void>} Diese Funktion gibt nichts zurück, sondern führt den Verarbeitungsprozess asynchron aus.
 *
 * @throws {Error} Falls einer der Verarbeitungsschritte fehlschlägt (z. B. Verzeichnisanlage, Dateikopie oder Datei-Parsing).
 */
export default async function startProcessManager(sessionId, data, logger) {
    logger.info("▶️ - Starting process manager for session:", sessionId);

    //Setting paths
    logger.info("✒️- Setting up paths...");
    const uploadDir = path.join(__dirname, "..", "uploads", sessionId);
    const outputDir = path.join(__dirname, "..", "output", sessionId);
    const downloadDir = path.join(__dirname, "..", "download", sessionId);

    //Creating Directorys for Output
    logger.info("✒️ - Creating directorys...");
    await createDir("output");
    await createDir(`output/${sessionId}`);
    await createDir("download");
    await createDir(`download/${sessionId}`);

    //Merging Settings for Pseudonymization
    logger.info("✒️ - Merging settings...");
    await mergeSettings(sessionId, data, "json", uploadDir, logger);
    await mergeSettings(sessionId, data, "xml", uploadDir, logger);

    //Copying files to Output Directory
    logger.info("✒️ - Copying Files to Output Directory...");
    await copyFileToOutput(uploadDir, outputDir, logger);

    //Processing Log Files
    logger.info("✒️ - Processing info files...");
    await processLogFiles(outputDir, data, logger);

    logger.info("✒️ - Processing JSON files...");
    await processJsonFiles(uploadDir, outputDir, data, logger);

    logger.info("✒️ - Creating ZIP Archive...");
    const downloadDirZip = path.join(downloadDir, "pseudo-files.zip");
    await zipDir(outputDir, downloadDirZip, logger);

    logger.info("✅ - Process completed");
}
