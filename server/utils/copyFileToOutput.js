import fs from "fs/promises";
import path from "path";
import generateFileName from "./generateFileName.js";

export default async function copyFileToOutput(uploadDir, outputDir) {
    try {
        const files = await fs.readdir(uploadDir);
        for (const file of files) {
            const srcPath = path.join(uploadDir, file);
            const stat = await fs.stat(srcPath);    // Get stats about the entry

            if (stat.isFile()) {    // Only process files
                const newFileName = await generateFileName(file);
                const destPath = path.join(outputDir, newFileName);
                await fs.copyFile(srcPath, destPath);
            }
            // If it's not a file (e.g., directory), skip it
        }
    } catch (error) {
        console.error("Error in copyFileToOutput:", error);
    }
}
