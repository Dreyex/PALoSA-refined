import fsPromises from "fs/promises"; // Use promises version of fs for async/await
import fs from 'fs';
import path from "path";
import generateFileName from "./generateFileName.js";

/**
 * Kopiert alle Dateien aus dem `other`-Ordner des Upload-Verzeichnisses 
 * in das Output-Verzeichnis und fügt jedem Dateinamen den Suffix `"-pseudo"` hinzu.
 * 
 * **Ablauf:**
 * 1. Ergänzt `uploadDir` um den Unterordner `"other"`.
 * 2. Prüft, ob Upload- und Output-Ordner existieren (ansonsten Abbruch mit Logmeldung).
 * 3. Liest alle Dateien aus dem Upload-Unterordner.
 * 4. Für jede Datei:
 *    - Erzeugt einen neuen Dateinamen mit {@link generateFileName}.
 *    - Kopiert die Datei ins Output-Verzeichnis.
 * 5. Verzeichnisse oder leere Inhalte werden übersprungen.
 * 
 * @async
 * @function copyFileToOutput
 * @param {string} uploadDir - Pfad zum Session-Upload-Verzeichnis (ohne `"other"`-Suffix).
 * @param {string} outputDir - Pfad zum Session-Output-Verzeichnis.
 * 
 * @returns {Promise<void>} Kein Rückgabewert – Dateien werden direkt ins Output-Verzeichnis geschrieben.
 */
export default async function copyFileToOutput(uploadDir, outputDir) {
    try {
        uploadDir = path.join(uploadDir, "other");
        // Ensure the output and upload directories exist
        if (!fs.existsSync(uploadDir)) {
            console.error(`Upload directory does not exist: ${uploadDir}`);
            return;
        }
        if (!fs.existsSync(outputDir)) {
            console.error(`Output directory does not exist: ${outputDir}`);
            return;
        }

        // Read all files in the upload directory
        const files = await fsPromises.readdir(uploadDir);

        // If no files are found, log a message and exit
        if (files.length === 0) {
            console.log("No files to copy.");
            return;
        } else { // If files are found, proceed to copy them
            for (const file of files) {
                const srcPath = path.join(uploadDir, file);
                const stat = await fsPromises.stat(srcPath); // Get stats about the entry

                if (stat.isFile()) {
                    // Only process files
                    const newFileName = await generateFileName(file);
                    const destPath = path.join(outputDir, newFileName);
                    await fsPromises.copyFile(srcPath, destPath);
                }
                // If it's not a file (e.g., directory), skip it
            }
        }
    } catch (error) {
        console.error("Error in copyFileToOutput:", error);
    }
}
