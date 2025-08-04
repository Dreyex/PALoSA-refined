import mergeSettings from "./mergeSettings.js";
import createOutDir from "./createOutDir.js";

// Process Manager for the Pseudonymization process
export default async function startProcessManager(sessionId, data)
{
    //console.log(data);
    //console.log(sessionId);
    createOutDir("output");
    await mergeSettings(sessionId, data, "json");
    await mergeSettings(sessionId, data, "xml");
}