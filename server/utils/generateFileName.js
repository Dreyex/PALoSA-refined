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