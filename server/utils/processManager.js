import mergeSettings from "./mergeSettings.js";

// Process Manager for the Pseudonymization process
export default function startProcessManager(sessionId, data)
{
    //console.log(data);
    //console.log(sessionId);
    mergeSettings(sessionId, data, "json");
    mergeSettings(sessionId, data, "xml");
}