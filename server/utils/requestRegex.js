/**
 * Ermittelt und gibt ein Array von regulären Ausdrücken (Regex-Mustern) zurück,
 * basierend auf den bereitgestellten Einstellungen und dem Verarbeitungstyp.
 *
 * Unterstützte Anwendungsfälle:
 * - **Log-Dateien** (`type === "log"`): Kombination aus vordefinierten Regex-Mustern und benutzerdefinierten Mustern.
 * - **Andere Typen** (z. B. XML, JSON): Nur benutzerdefinierte Regex-Muster aus den Einstellungen.
 *
 * Verfügbare vordefinierte Regex-Typen:
 * - `"E-Mail"`: E-Mail-Adressen im Format `user@domain.tld`
 * - `"IP-Adressen"`: IPv4-Adressen im Format `xxx.xxx.xxx.xxx`
 *
 * @async
 * @function requestRegex
 * @param {Object} settings - Einstellungsobjekt mit möglichen Schlüsseln:
 * @param {Object} [settings.logSettings] - Enthält `checkedOptions` (Array von Strings), welche vordefinierte Regex-Typen aktivieren.
 * @param {string[]} [settings.logSettings.checkedOptions] - Ausgewählte vordefinierte Regex-Kategorien wie `"E-Mail"` oder `"IP-Adressen"`.
 * @param {Object} [settings.regexSettings] - Enthält ein `patterns`-Array mit benutzerdefinierten Regex-Strings.
 * @param {string[]} [settings.regexSettings.patterns] - Benutzerdefinierte reguläre Ausdrücke.
 * @param {string} type - Der Verarbeitungstyp, z. B. `"log"`, `"xml"` oder `"json"`.
 * @param {import('winston').Logger} logger - Logger für die Ausgaben im Log
 *
 * @returns {Promise<string[]>} Ein Array mit allen ermittelten regulären Ausdrücken als Strings.
 *
 * @throws {Error} Wenn bei der Verarbeitung der Einstellungen ein Fehler auftritt.
 */
export default async function requestRegex(settings, type, logger) {
    try {
        const regex = {
            "E-Mail": "([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\\.[a-zA-Z]{2,})",
            "IP-Adressen":
                "\\b(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])\\.(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])\\.(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])\\.(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])\\b",
        };

        const collectChecked = (obj) => ({
            checkedOptions: Array.isArray(obj.checkedOptions)
                ? obj.checkedOptions
                : [],
        });

        const collectPatterns = (obj) => ({
            patterns: Array.isArray(obj.patterns) ? obj.patterns : [],
        });

        let checked;
        let regexes;
        let patterns;

        if (type === "log") {
            if (settings.logSettings && settings.regexSettings) {
                checked = collectChecked(settings.logSettings).checkedOptions;
                regexes = collectPatterns(settings.regexSettings).patterns;

                patterns = [
                    ...checked
                        .filter((option) =>
                            Object.prototype.hasOwnProperty.call(regex, option)
                        )
                        .map((option) => regex[option]),
                    ...regexes,
                ];
            } else if (settings.regexSettings) {
                regexes = collectPatterns(settings.regexSettings).patterns;
                patterns = [...regexes];
            } else if (settings.logSettings) {
                checked = collectChecked(settings.logSettings).checkedOptions;
                patterns = checked
                    .filter((option) =>
                        Object.prototype.hasOwnProperty.call(regex, option)
                    )
                    .map((option) => regex[option]);
            } else {
                logger?.warn("No settings provided for Logs.");
                return [];
            }
        } else {
            if (settings.regexSettings) {
                regexes = collectPatterns(settings.regexSettings).patterns;
                patterns = [...regexes];
            } else {
                logger?.warn("No regexes provided for XML and JSON.");
                return [];
            }
        }

        return patterns;
    } catch (error) {
        logger?.error("Error in requestRegex:", { error });
        return [];
    }
}
