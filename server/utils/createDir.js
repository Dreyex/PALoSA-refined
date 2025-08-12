import fs from "fs";
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
 * 
 * @returns {Promise<void>} Gibt keinen Wert zurück, erstellt jedoch bei Bedarf das Verzeichnis.
 * 
 * @throws {Error} Falls das Erstellen des Verzeichnisses fehlschlägt.
 */
export default async function createDir(dirPath) {
    // dirPath is relative to server/ directory
    const outputDir = path.join(__dirname, '..', dirPath);
    try {
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
    } catch (err) {
        console.error(`Failed to create directory ${outputDir}:`, err);
        throw err;
    }
}
