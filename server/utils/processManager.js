import mergeSettings from "./mergeSettings.js";

// Process Manager for the Pseudonymization process
export default async function startProcessManager(sessionId, data)
{
    //console.log(data);
    //console.log(sessionId);
    await mergeSettings(sessionId, data, "json");
    await mergeSettings(sessionId, data, "xml");
}