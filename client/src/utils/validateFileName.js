export default function validateFileName(fileName) {
    if (fileName === "json-config.json" || fileName === "xml-config.json") {
        console.log("JSON-Name gültig");
        return true;
    } else {
        console.log("JSON-Name fehlerhaft:", fileName);
        return false;
    }
}