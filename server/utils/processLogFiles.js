import 'dotenv/config';
import * as fs from 'fs';
import path from 'path';
import pseudonymousIdGenerator from 'pseudonymous-id-generator';


const anonymizationKey = process.env.ANONYMIZATION_KEY;

export default async function processLogFiles(outputDir, settings) {
    const patterns = await requestRegex(settings);
    console.log(settings);
    console.log(patterns);
    //TODO:  pseudonymous-id-generator als npm Paket
    /* fs.readdirSync(outputDir, { withFileTypes: true })
        .filter(
            (dirent) =>
                dirent.isFile() &&
                !dirent.name.endsWith(".xml") &&
                !dirent.name.endsWith(".json")
        )
        .forEach((dirent) => {
            const filePath = path.join(outputDir, dirent.name);
            const fileContent = fs.readFileSync(filePath, "utf-8");
            const updatedContent = anonymizeContent(fileContent);
            fs.writeFileSync(filePath, updatedContent, "utf-8");
            console.log(`Anonymisiert: ${dirent.name}`);
        }); */
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

async function anonymizeContent(content) {
    let result = content;
    patterns.forEach((regex) => {
        result = result.replace(regex, (match) =>
            generatePseudonymousId(match, anonymizationKey)
        );
    });
    return result;
}
