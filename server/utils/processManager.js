import mergeSettings from "./mergeSettings.js";
import createOutDir from "./createOutDir.js";
import processLogFiles from "./processLogFiles.js";
import processJsonFiles from "./processJsonFiles.js";

import path from "path";
import { fileURLToPath } from "url";
import copyFileToOutput from "./copyFileToOutput.js";


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
 *
 * @async
 * @function startProcessManager
 * @param {string} sessionId - Eindeutige ID der aktuellen Sitzung. Wird verwendet, um Pfade für Uploads und Ausgaben zu trennen.
 * @param {Object} data - Konfigurationsobjekt oder Nutzdaten, die für die Pseudonymisierung benötigt werden (z. B. Regeln, Parameter).
 * 
 * @returns {Promise<void>} Diese Funktion gibt nichts zurück, sondern führt den Verarbeitungsprozess asynchron aus.
 * 
 * @throws {Error} Falls einer der Verarbeitungsschritte fehlschlägt (z. B. Verzeichnisanlage, Dateikopie oder Datei-Parsing).
 */
export default async function startProcessManager(sessionId, data)
{   console.log("Starting process manager for session:", sessionId);

    //Setting paths
    console.log("Setting up paths...");
    const uploadDir = path.join(__dirname, '..', "uploads", sessionId);
    const outputDir = path.join(__dirname, '..', "output", sessionId);

    //Creating Directorys for Output
    console.log("Creating directorys...");
    await createOutDir("output");
    await createOutDir(`output/${sessionId}`);

    //Merging Settings for Pseudonymization
    console.log("Merging settings...");
    await mergeSettings(sessionId, data, "json");
    await mergeSettings(sessionId, data, "xml");

    //Copying files to Output Directory
    console.log("Copying Files to Output Directory...")
    await copyFileToOutput(uploadDir, outputDir);

    //Processing Log Files
    console.log("Processing log files...");
    await processLogFiles(outputDir, data);

    console.log("Processing JSON files...");
    await processJsonFiles(uploadDir, outputDir, data);

    console.log("✅ - Process completed");
}