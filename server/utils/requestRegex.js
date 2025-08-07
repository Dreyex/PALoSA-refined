export default async function requestRegex(settings, type) {
    console.log("Requesting regex patterns for type:", type);
    console.log("Settings provided:", settings);
    try {
        // Stored Regex Patterns
        const regex = {
            "E-Mail": "([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\\.[a-zA-Z]{2,})",
            "IP-Adressen":
                "\\b(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])\\.(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])\\.(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])\\.(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])\\b",
        };

        // Get checked options array from settings
        const collectChecked = (obj) => ({
            checkedOptions: Array.isArray(obj.checkedOptions)
                ? obj.checkedOptions
                : [],
        });

        // Collect Regex patterns from settings
        const collectPatterns = (obj) => ({
            patterns: Array.isArray(obj.patterns) ? obj.patterns : [],
        });

        let checked;
        let regexes;
        let patterns;

        if (type === "log") {
            // processing for log type
            // Extract checked options and patterns from settings
            if (settings.logSettings && settings.regexSettings) {
                checked = collectChecked(settings.logSettings).checkedOptions;
                regexes = collectPatterns(settings.regexSettings).patterns;

                // Build patterns array based on checked options and add all regexes from regexes
                // If both logSettings and regexSettings are provided
                patterns = [
                    ...checked
                        .filter((option) => regex.hasOwnProperty(option))
                        .map((option) => regex[option]),
                    ...regexes,
                ];
            } else if (settings.regexSettings) {
                // only regex settings
                regexes = collectPatterns(settings.regexSettings).patterns;

                // If only regexSettings are provided, use them directly
                patterns = [...regexes];
            } else if (settings.logSettings) {
                // only log settings
                checked = collectChecked(settings.logSettings).checkedOptions;

                // If only logSettings are provided, use the checked options
                patterns = [
                    ...checked
                        .filter((option) => regex.hasOwnProperty(option))
                        .map((option) => regex[option]),
                ];
            } else {
                // no settings provided
                console.warn("No settings provided for Logs.");
                return [];
            }
        } else {
            // processing for other types
            // Extract regex patterns from settings
            if (settings.regexSettings) {
                // only regex settings
                regexes = collectPatterns(settings.regexSettings).patterns;

                // If regexSettings are provided, use them directly
                patterns = [...regexes];
            } else {
                // no regex settings provided
                console.warn("No regexes provided for XML and JSON.");
                return [];
            }
        }

        return patterns;
    } catch (error) {
        console.error("Error in requestRegex:", error);
        return [];
    }
}
