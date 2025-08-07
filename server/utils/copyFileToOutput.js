import fs from "fs";
import path from "path";
import generateFileName from "./generateFileName.js";

export default async function copyFileToOutput(uploadDir, outputDir) {
    try {
        // Ensure the output and upload directories exist
        if (!fs.existsSync(uploadDir)) {
            console.error(`Upload directory does not exist: ${uploadDir}`);
            return;
        }
        if (!fs.existsSync(outputDir)) {
            console.error(`Output directory does not exist: ${outputDir}`);
            return;
        }

        // Read all files in the upload directory
        const files = await fs.readdir(uploadDir);

        // If no files are found, log a message and exit
        if (files.length === 0) {
            console.log("No files to copy.");
            return;
        } else { // If files are found, proceed to copy them
            for (const file of files) {
                const srcPath = path.join(uploadDir, file);
                const stat = await fs.stat(srcPath); // Get stats about the entry

                if (stat.isFile()) {
                    // Only process files
                    const newFileName = await generateFileName(file);
                    const destPath = path.join(outputDir, newFileName);
                    await fs.copyFile(srcPath, destPath);
                }
                // If it's not a file (e.g., directory), skip it
            }
        }
    } catch (error) {
        console.error("Error in copyFileToOutput:", error);
    }
}
