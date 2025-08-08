import fs from "fs";
import path from "path";
import requestRegex from "./requestRegex.js";
import pseudoContentRegex from "./pseudoContentRegex.js";

export default async function processJsonFiles(outputDir, settings) {
    const patterns = await requestRegex(settings, "other");
    const dirents = fs.readdirSync(outputDir, { withFileTypes: true });

    for (const dirent of dirents) {
        if (dirent.isFile() && dirent.name.endsWith(".json")) {
            const filePath = path.join(outputDir, dirent.name);
            const fileContent = fs.readFileSync(filePath, "utf-8");
            const updatedContent = await pseudoContentRegex(
                fileContent,
                patterns
            );

            //TODO: Abarbeiten der Keys einfügen

            fs.writeFileSync(filePath, updatedContent, "utf-8");
            console.log(`Anonymisiert: ${dirent.name}`);
        }
    }
}
