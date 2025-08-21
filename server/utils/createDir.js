import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Erstellt ein Verzeichnis relativ zum `server/`-Verzeichnis, falls es noch nicht existiert.
 *
 * Die Funktion prüft zuerst, ob der Zielpfad existiert.
 * Falls nicht, wird das Verzeichnis inklusive aller notwendigen Unterordner rekursiv angelegt.
 *
 * @async
 * @function createDir
 * @param {string} dirPath - Relativer Pfad (vom `server/`-Verzeichnis aus) zum gewünschten Ausgabeordner.
 *                          Beispiel: `"output/session123"`.
 * @param {import('winston').Logger} logger - Logger für die Ausgaben im Log
 *
 * @returns {Promise<void>} Gibt keinen Wert zurück, erstellt jedoch bei Bedarf das Verzeichnis.
 *
 * @throws {Error} Falls das Erstellen des Verzeichnisses fehlschlägt.
 */
export default async function createDir(dirPath, logger) {
    const outputDir = path.join(__dirname, "..", dirPath);

    try {
        await fs.mkdir(outputDir, { recursive: true });
        logger?.info(`Directory ensured: ${outputDir}`);
    } catch (err) {
        logger?.error(`Failed to create directory ${outputDir}`, {
            error: err,
        });
        throw err;
    }
}
