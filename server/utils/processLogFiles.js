export default async function processLogFiles(uploadDir, outputDir, settings) {
    const patterns = await requestRegex(settings);
    console.log(patterns);
    //TODO:  pseudonymous-id-generator als npm Paket
}

async function requestRegex(settings) {
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

        const collectPatterns = (obj) => ({
            patterns: Array.isArray(obj.patterns) ? obj.patterns : [],
        });

        const checked = collectChecked(settings.logSettings).checkedOptions;
        const regexes = collectPatterns(settings.regexSettings).patterns;

        // Build patterns array based on checked options and add all regexes from regexes
        const patterns = [
            ...checked
                .filter((option) => regex.hasOwnProperty(option))
                .map((option) => regex[option]),
            ...regexes,
        ];

        return patterns;
    } catch (error) {
        console.error("Error in requestRegex:", error);
        return [];
    }
}
