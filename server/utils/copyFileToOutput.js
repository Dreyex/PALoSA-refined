import fsPromises from "fs/promises"; // Use promises version of fs for async/await
import fs from "fs";
import path from "path";
import generateFileName from "./generateFileName.js";

/**
 * Kopiert alle Dateien aus dem `other`-Ordner des Upload-Verzeichnisses in das Output-Verzeichnis,
 * fügt jedem Dateinamen den Suffix `-pseudo` hinzu und loggt wichtige Schritte.
 *
 * @async
 * @function copyFileToOutput
 * @param {string} uploadDir - Pfad zum Session-Upload-Verzeichnis (ohne `"other"`-Suffix).
 * @param {string} outputDir - Pfad zum Session-Output-Verzeichnis.
 * @param {import('winston').Logger} logger - Logger für Ausgabe von Logs und Fehlern.
 *
 * @returns {Promise<void>}
 */
export default async function copyFileToOutput(uploadDir, outputDir, logger) {
    try {
        uploadDir = path.join(uploadDir, "other");

        if (!fs.existsSync(uploadDir)) {
            logger.error(`Upload directory does not exist: ${uploadDir}`);
            return;
        }
        if (!fs.existsSync(outputDir)) {
            logger.error(`Output directory does not exist: ${outputDir}`);
            return;
        }

        const files = await fsPromises.readdir(uploadDir);

        if (files.length === 0) {
            logger.info("No files to copy.");
            return;
        } else {
            for (const file of files) {
                const srcPath = path.join(uploadDir, file);
                const stat = await fsPromises.stat(srcPath);

                if (stat.isFile()) {
                    const newFileName = await generateFileName(file, logger);
                    const destPath = path.join(outputDir, newFileName);
                    await fsPromises.copyFile(srcPath, destPath);
                    logger.info(`File copied: ${file} → ${newFileName}`);
                }
            }
            logger.info(`Copied ${files.length} file(s) to output directory.`);
        }
    } catch (error) {
        logger.error("Error in copyFileToOutput:", { error });
        throw error; // Weiterwerfen, damit Aufrufer reagieren kann
    }
}
