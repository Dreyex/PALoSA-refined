import fs from "fs";
import path from "path";
import requestRegex from "./requestRegex.js";
import pseudoContentRegex from "./pseudoContentRegex.js";

/**
 * Verarbeitet und pseudonymisiert Log-Dateien in einem angegebenen Ausgabeverzeichnis.
 * 
 * Die Funktion ermittelt zunächst mit {@link requestRegex} alle relevanten Regex-Muster
 * basierend auf den übergebenen `settings` für den Typ `"log"`.  
 * Anschließend werden alle Dateien im `outputDir` durchlaufen, die **keine**
 * XML- oder JSON-Dateien sind, und deren Inhalte werden durch die Funktion
 * {@link pseudoContentRegex} pseudonymisiert.
 * 
 * **Ablauf:**
 * 1. Ermitteln der Regex-Muster für die Pseudonymisierung.
 * 2. Einlesen aller Dateien im Ausgabeverzeichnis.
 * 3. Filtern auf Log-Dateien (ohne `.xml` oder `.json` Endung).
 * 4. Anonymisieren des Inhalts mit den ermittelten Mustern.
 * 5. Überschreiben der Original-Dateien im Ausgabeverzeichnis.
 * 
 * @async
 * @function processLogFiles
 * @param {string} outputDir - Absoluter Pfad zum Ausgabeverzeichnis mit den zu verarbeitenden Log-Dateien.
 * @param {Object} settings - Einstellungen für die Regex-Auswahl und Pseudonymisierung.
 * @param {Object} [settings.logSettings] - Optionen für vordefinierte Muster (z. B. `"E-Mail"`, `"IP-Adressen"`).
 * @param {string[]} [settings.logSettings.checkedOptions] - Aktivierte vordefinierte Regex-Typen.
 * @param {Object} [settings.regexSettings] - Benutzerdefinierte Regex-Muster.
 * @param {string[]} [settings.regexSettings.patterns] - Liste der benutzerdefinierten Regex-Strings.
 * 
 * @returns {Promise<void>} Die Funktion gibt keinen Wert zurück, verarbeitet aber die Log-Dateien im angegebenen Verzeichnis.
 * 
 * @throws {Error} Wenn das Lesen, Schreiben oder die Pseudonymisierung einer Datei fehlschlägt.
 */
export default async function processLogFiles(outputDir, settings) {
    //console.log("Settings for anonymization:", settings);

    const patterns = await requestRegex(settings, "log");
    const dirents = fs.readdirSync(outputDir, { withFileTypes: true });

    //console.log("Patterns for anonymization:", patterns);

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
                patterns
            );
            fs.writeFileSync(filePath, updatedContent, "utf-8");
            //console.log(`Anonymisiert: ${dirent.name}`);
        }
    }
}