// createFile.mjs oder mit "type": "module" in package.json z.B. "createFile.js"
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";

/**
 * Erstellt eine neue Datei im angegebenen Verzeichnis und schreibt den übergebenen Inhalt hinein.
 * 
 * Falls das Zielverzeichnis nicht existiert, wird es rekursiv erstellt.  
 * Wenn die Datei bereits vorhanden ist, wird ihr Inhalt überschrieben.
 * 
 * @async
 * @function createFile
 * @param {string} directory - Pfad zum Zielverzeichnis, in dem die Datei erstellt werden soll.
 * @param {string} filename - Name der Datei ohne Dateiendung.
 * @param {string} filetype - Dateiendung (z. B. `"txt"` oder `".txt"`). Falls mit Punkt angegeben, wird dieser entfernt.
 * @param {string} [content=""] - Der Inhalt, der in die Datei geschrieben wird (Standard: leerer String).
 * 
 * @returns {Promise<void>} Gibt keinen Wert zurück. Erstellt oder überschreibt die Datei.
 * 
 * @throws {Error} Falls das Erstellen des Verzeichnisses oder das Schreiben in die Datei fehlschlägt.
 */
export async function createFile(directory, filename, filetype, content = "") {
    // Falls filetype mit Punkt übergeben wird: ".txt" → "txt"
    if (filetype.startsWith(".")) filetype = filetype.slice(1);

    const fullPath = join(directory, `${filename}.${filetype}`);

    // Verzeichnis (rekursiv) erstellen, falls nicht existent
    await mkdir(directory, { recursive: true });

    // Datei schreiben (überschreibt, falls existiert)
    await writeFile(fullPath, content);
    //console.log(`Datei erstellt: ${fullPath}`);
}

