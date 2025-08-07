import mergeSettings from "./mergeSettings.js";
import createOutDir from "./createOutDir.js";
import processLogFiles from "./processLogFiles.js";

import path from "path";
import { fileURLToPath } from "url";
import copyFileToOutput from "./copyFileToOutput.js";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Process Manager for the Pseudonymization process
export default async function startProcessManager(sessionId, data)
{
    //Setting paths
    console.log("Setting up paths...");
    const uploadDir = path.join(__dirname, '..', "uploads", sessionId, "other");
    const outputDir = path.join(__dirname, '..', "output", sessionId);

    //Creating Directorys for Output
    console.log("Creating directorys...");
    await createOutDir("output");
    await createOutDir(`output/${sessionId}`);

    //Merging Settings for Pseudonymization
    console.log("Merging settings...");
    await mergeSettings(sessionId, data, "json");
    await mergeSettings(sessionId, data, "xml");

    //Copying files to Output Directory
    console.log("Copying Files to Output Directory...")
    await copyFileToOutput(uploadDir, outputDir);

    //Processing Log Files
    console.log("Processing log files...");
    await processLogFiles(outputDir, data);

    console.log("✅ - Process completed");
}