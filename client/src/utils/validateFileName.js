export default function validateFileName(fileName) {
    if (fileName === "config.json") {
        console.log("JSON-Name gültig");
        return true;
    } else {
        console.log("JSON-Name fehlerhaft:", fileName);
        return false;
    }
}