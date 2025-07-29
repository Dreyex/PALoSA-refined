// createFile.mjs oder mit "type": "module" in package.json z.B. "createFile.js"
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";

/**
 * Erstellt eine Datei mit gewünschtem Typ, Namen und Pfad.
 * @param {string} directory - Zielverzeichnis.
 * @param {string} filename - Dateiname ohne Erweiterung.
 * @param {string} filetype - Dateityp/Erweiterung (z.B. 'txt', 'json' ...).
 * @param {string} [content] - (Optional) Dateiinhalt.
 */
export async function createFile(directory, filename, filetype, content = "") {
    // Falls filetype mit Punkt übergeben wird: ".txt" → "txt"
    if (filetype.startsWith(".")) filetype = filetype.slice(1);

    const fullPath = join(directory, `${filename}.${filetype}`);

    // Verzeichnis (rekursiv) erstellen, falls nicht existent
    await mkdir(directory, { recursive: true });

    // Datei schreiben (überschreibt, falls existiert)
    await writeFile(fullPath, content);
    console.log(`Datei erstellt: ${fullPath}`);
}

// Beispielaufruf (auskommentieren, falls als Library benutzt)
/*
createFile('./test', 'beispiel', 'txt', 'Das ist der Dateitext!')
  .catch(console.error);
*/
