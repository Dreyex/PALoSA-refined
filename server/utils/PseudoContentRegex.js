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
 * Pseudonymisiert Inhalte auf Basis einer Menge von regulären Ausdrücken.
 * 
 * Diese Funktion durchsucht den übergebenen Content-String mit allen in `patterns` enthaltenen 
 * Regex-Mustern und ersetzt alle Treffer durch pseudonymisierte Werte.  
 * Die Pseudonymisierung erfolgt je nach erkannten Datentyp:
 * 
 * - **IPv4-Adressen**: werden mit CryptoPan deterministisch pseudonymisiert.
 * - **E-Mail-Adressen**: werden mithilfe von {@link pseudonymizeEmail} anonymisiert.
 * - **Andere Treffer**: werden mit {@link generatePseudonym} und einem Anonymisierungsschlüssel ersetzt.
 * 
 * Für die Ersetzung kommt intern {@link replaceAsync} zum Einsatz, um auch asynchrone Operationen zu ermöglichen.
 *
 * @async
 * @function pseudoContentRegex
 * @param {string} content - Ursprünglicher Textinhalt, der pseudonymisiert werden soll.
 * @param {string[]} patterns - Liste von Regex-Strings im String-Format, die zur Erkennung sensibler Inhalte dienen.
 * 
 * @returns {Promise<string>} Der vollständig pseudonymisierte Text.
 *
 * @throws {Error} Falls ein Fehler bei der Pseudonymisierung, der Regex-Verarbeitung oder beim Ersetzen auftritt.
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
 * Führt einen asynchronen String-Ersatz basierend auf einem regulären Ausdruck durch.
 * 
 * Diese Funktion ist ähnlich wie `String.prototype.replace`, erlaubt aber eine 
 * **asynchrone Ersetzungslogik** über eine Callback-Funktion (`asyncFn`).  
 * Sie sammelt alle Übereinstimmungen (`matches`) im String, ruft für jede Übereinstimmung 
 * asynchron die Ersetzungsfunktion auf und baut den String anschließend mit den 
 * Ergebnissen neu zusammen.
 * 
 * **Ablauf:**
 * 1. Finde alle Vorkommen des Regex im übergebenen String.
 * 2. Speichere Startoffsets und Treffertexte.
 * 3. Ersetze jeden Treffer mit dem Ergebnis der asynchronen Callback-Funktion.
 * 4. Füge alle Segmente und Ersetzungen zu einem neuen String zusammen.
 *
 * @async
 * @function replaceAsync
 * @param {string} str - Der Eingabestring, in dem Ersetzungen stattfinden sollen.
 * @param {RegExp} regex - Der reguläre Ausdruck, der die zu ersetzenden Teile bestimmt.  
 *                         Sollte vorzugsweise mit dem globalen Flag `g` verwendet werden, 
 *                         um alle Vorkommen zu finden.
 * @param {(match: string) => Promise<string>} asyncFn - Eine asynchrone Funktion, die für jedes 
 *                         gefundene Match einen neuen String zurückgibt.
 * 
 * @returns {Promise<string>} Ein neuer String mit allen asynchron vervollständigten Ersetzungen.
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


