import fs from "fs";
import path from "path";
import requestRegex from "./requestRegex.js";
import pseudoContentRegex from "./pseudoContentRegex.js";

/**
 * Verarbeitet und pseudonymisiert Log-Dateien in einem angegebenen Ausgabeverzeichnis.
 *
 * @async
 * @function processLogFiles
 * @param {string} outputDir - Absoluter Pfad zum Ausgabeverzeichnis.
 * @param {Object} settings - Einstellungen für Regex-Auswahl.
 * @param {import('winston').Logger} logger - Logger für Logs und Fehler.
 *
 * @returns {Promise<void>}
 */
export default async function processLogFiles(outputDir, settings, logger) {
    try {
        const patterns = await requestRegex(settings, "log", logger);
        logger.info(
            `Using ${patterns.length} regex patterns for log anonymization`
        );

        const dirents = fs.readdirSync(outputDir, { withFileTypes: true });
        for (const dirent of dirents) {
            if (
                dirent.isFile() &&
                !dirent.name.endsWith(".xml") &&
                !dirent.name.endsWith(".json")
            ) {
                const filePath = path.join(outputDir, dirent.name);
                const fileContent = fs.readFileSync(filePath, "utf-8");
                const updatedContent = await pseudoContentRegex(
                    fileContent,
                    patterns,
                    logger
                );
                fs.writeFileSync(filePath, updatedContent, "utf-8");
                logger.info(`Anonymized log file: ${dirent.name}`);
            }
        }
    } catch (error) {
        logger.error("Error in processLogFiles:", { error });
        throw error; // Weiterwerfen für zentrale Fehlerbehandlung
    }
}
