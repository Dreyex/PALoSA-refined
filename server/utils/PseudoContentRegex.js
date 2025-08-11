import generatePseudonym from "pseudonymous-id-generator";
import "dotenv/config";
import isIPv4Address from "./isIPv4Address.js";
import { CryptoPAn } from "cryptopan";
import isEmailAddress from "./isEMailAddress.js";
import pseudonymizeEmail from "./pseudonymizeMail.js";
import { ipStringToBuffer, bufferToIpString } from "./ipBuffer.js"

const anonymizationKey = process.env.pseudoKey;

// CryptoPan initialisieren
const cp = new CryptoPAn(Buffer.from(anonymizationKey, "utf-8"));

/**
 * Anonymisiert Inhalte basierend auf den gegebenen Regex-Patterns.
 * - IPv4-Adressen werden mit CryptoPan maskiert.
 * - Email-Adressen werden mit einer Pseudonymisierungsmethode anonymisiert.
 * - Sonstige Matches werden mit pseudonymous-id-generator pseudonymisiert.
 * @param {string} content - Der Ausgangsinhalt, der anonymisiert werden soll.
 * @param {string[]} patterns - Ein Array von Regex-Pattern-Strings zur Bestimmung der zu anonymisierenden Inhalte.
 * @returns {Promise<string>} result - Der anonymisierte Inhalt.
 */
export default async function pseudoContentRegex(content, patterns) {
    let result = content;
    //console.log("Anonymizing content with patterns:", patterns);
    //console.log("Content:", content);
    //console.log("Result:", result);
    const regexes = patterns.map((patternStr) => new RegExp(patternStr, "g"));
    //console.log("Anonymizing content with regexes:", regexes);

    for (const regex of regexes) {
        result = await replaceAsync(result, regex, async (match) => {
            if (await isIPv4Address(match)) {
                //console.log(`Pseudonymizing IPv4 with CryptoPan: ${match}`);
                const ipBuffer = ipStringToBuffer(match);
                const pseudonymizedBuffer = cp.pseudonymiseIP(ipBuffer); //IP Adresse pseudonymisieren
                return bufferToIpString(pseudonymizedBuffer);
            } else if (await isEmailAddress(match)) {
                console.log(`Pseudonymizing email address: ${match}`);
                return await pseudonymizeEmail(match);
            } else {
                //console.log(`Pseudonymizing non-IP match: ${match}`);
                return generatePseudonym(match, anonymizationKey);
            }
        });
    }
    //console.log(result);
    return result;
}

/**
 * Ersetzt asynchron alle Matches eines regulären Ausdrucks in einem String
 * durch den Rückgabewert einer asynchronen Callback-Funktion.
 * @param {string} str - Der Eingabe-String.
 * @param {RegExp} regex - Der reguläre Ausdruck, der zu matchende Teile findet.
 * @param {(match: string) => Promise<string>} asyncFn - Die asynchrone Funktion, die jeden Match ersetzt.
 * @returns {Promise<string>} - Der veränderte String nach den Ersetzungen.
 */
async function replaceAsync(str, regex, asyncFn) {
    const matches = [];
    str.replace(regex, (match, ...args) => {
        const offset = args[args.length - 2];
        matches.push({ match, offset });
        return match;
    });

    const pieces = [];
    let lastIndex = 0;

    for (const { match, offset } of matches) {
        pieces.push(str.substring(lastIndex, offset));
        const replacement = await asyncFn(match);
        pieces.push(replacement);
        lastIndex = offset + match.length;
    }

    pieces.push(str.substring(lastIndex));
    return pieces.join("");
}


