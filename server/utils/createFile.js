// createFile.mjs oder mit "type": "module" in package.json z.B. "createFile.js"
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";

/**
 * Erstellt eine neue Datei im angegebenen Verzeichnis und schreibt den übergebenen Inhalt hinein.
 *
 * @async
 * @function createFile
 * @param {string} directory - Pfad zum Zielverzeichnis.
 * @param {string} filename - Name der Datei ohne Endung.
 * @param {string} filetype - Dateiendung (ohne Punkt).
 * @param {string} [content=""] - Inhalt der Datei.
 * @param {import('winston').Logger} logger - Logger zum Loggen von Infos und Fehlern.
 *
 * @returns {Promise<void>}
 */
export async function createFile(
    directory,
    filename,
    filetype,
    content = "",
    logger
) {
    try {
        if (filetype.startsWith(".")) filetype = filetype.slice(1);
        const fullPath = join(directory, `${filename}.${filetype}`);

        await mkdir(directory, { recursive: true });
        logger.info(
            `Verzeichnis erstellt oder existiert bereits: ${directory}`
        );

        await writeFile(fullPath, content);
        logger.info(`Datei erstellt/überschrieben: ${fullPath}`);
    } catch (error) {
        logger.error(
            `Fehler beim Erstellen der Datei ${filename}.${filetype} in ${directory}`,
            { error }
        );
        throw error; // Weiterwerfen, damit Aufrufer den Fehler ggf. behandeln kann
    }
}
