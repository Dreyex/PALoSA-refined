import fs from "fs";
import archiver from "archiver";

/**
 * Erstellt ein ZIP-Archiv aus dem Inhalt eines Verzeichnisses.
 * 
 * Die Funktion nutzt das `archiver`-Modul, um den kompletten Inhalt von `inputPath` 
 * mit maximaler Kompressionsstufe (`zlib.level = 9`) in eine ZIP-Datei zu speichern.
 * Die Funktion gibt ein Promise zurück, das erst aufgelöst wird, wenn das Archiv 
 * vollständig erstellt und geschrieben wurde.
 * 
 * @function zipDir
 * @param {string} inputPath - Pfad zum Eingabeverzeichnis, dessen Inhalt ins ZIP-Archiv geschrieben werden soll.
 * @param {string} outputPath - Zielpfad für das zu erstellende ZIP-Archiv (inkl. Dateiname, z. B. `"backup.zip"`).
 * 
 * @returns {Promise<void>} Ein Promise, das erfüllt wird, wenn das ZIP-Archiv fertiggestellt wurde.
 * 
 * @throws {Error} Falls beim Erstellen des ZIP-Archivs ein Fehler auftritt (z. B. Zugriff verweigert, ungültige Pfade).
 */
export default function zipDir(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
        const output = fs.createWriteStream(outputPath);
        const archive = archiver("zip", { zlib: { level: 9 } });

        output.on("close", () => {
            //console.log(`ZIP Archiv wurde erstellt. Größe: ${archive.pointer()} Bytes`);
            resolve();
        });

        output.on("error", (err) => reject(err));
        archive.on("warning", (err) => {
            if (err.code !== "ENOENT") reject(err);
        });

        archive.on("error", (err) => reject(err));

        archive.pipe(output);

        // Fügt kompletten Ordnerinhalt hinzu
        archive.directory(inputPath, false);

        archive.finalize();
    });
}
