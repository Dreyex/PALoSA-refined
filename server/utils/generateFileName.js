/**
 * Erzeugt einen neuen Dateinamen, indem der Suffix `"-pseudo"` 
 * direkt vor der Dateiendung eingefügt wird.
 * 
 * Diese Funktion wird genutzt, um pseudonymisierte Dateien vom Original zu unterscheiden.
 * Falls der Dateiname **keine** Endung besitzt, wird der Suffix ans Ende des Namens angehängt.
 * 
 * @async
 * @function generateFileName
 * @param {string} fileName - Ursprünglicher Dateiname (z. B. `"report.json"` oder `"logfile"`).
 * @returns {Promise<string>} Der neue Dateiname mit `"-pseudo"` vor der Endung oder am Ende des Namens.
 */
export default async function generateFileName(fileName) {
    try {
        // Insert "-pseudo" before the file extension
        const extIndex = fileName.lastIndexOf(".");
        let newName;
        if (extIndex !== -1) {
            newName = fileName.slice(0, extIndex) + "-pseudo" + fileName.slice(extIndex);
        } else {
            newName = fileName + "-pseudo";
        }
        return newName;
    } catch (error) {
        console.error("Error in generateFileName:", error);
        return fileName;
    }
}