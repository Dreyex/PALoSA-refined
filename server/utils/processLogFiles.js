import fs from "fs";
import path from "path";
import requestRegex from "./requestRegex.js";
import pseudoContentRegex from "./pseudoContentRegex.js";

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
            console.log(`Anonymisiert: ${dirent.name}`);
        }
    }
}