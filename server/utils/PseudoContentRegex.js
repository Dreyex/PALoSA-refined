import generatePseudonym from "pseudonymous-id-generator";
import "dotenv/config";
import isIPv4Address from "./isIPv4Address.js";
import { CryptoPAn } from "cryptopan";
import isEmailAddress from "./isEMailAddress.js";
import pseudonymizeEmail from "./pseudonymizeMail.js";

const anonymizationKey = process.env.pseudoKey;

// CryptoPan initialisieren
const cp = new CryptoPAn(Buffer.from(anonymizationKey, "utf-8"));

/**
 * Anonymisiert Inhalte basierend auf den gegebenen Regex-Patterns.
 * - Wenn der Match eine IPv4-Adresse ist → CryptoPan Maskierung
 * - Andernfalls → pseudonymous-id-generator
 */
export default async function pseudoContentRegex(content, patterns) {
    let result = content;
    //console.log("Anonymizing content with patterns:", patterns);

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
    return result;
}

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

function ipStringToBuffer(ip) {
    // Zerlegt IPv4-Adresse in 4 Byte
    return Buffer.from(ip.split(".").map((octet) => parseInt(octet, 10)));
}

function bufferToIpString(buf) {
    return Array.from(buf).join(".");
}
