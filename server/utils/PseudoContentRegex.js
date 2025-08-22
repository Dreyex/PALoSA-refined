import generatePseudonym from "pseudonymous-id-generator";
import "dotenv/config";
import isIPv4Address from "./isIPv4Address.js";
import { CryptoPAn } from "cryptopan";
import isEmailAddress from "./isEMailAddress.js";
import pseudonymizeEmail from "./pseudonymizeMail.js";
import { ipStringToBuffer, bufferToIpString } from "./ipBuffer.js";

const anonymizationKey = process.env.PSEUDO_KEY;

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
 * @param {import('winston').Logger} logger - Logger für die Ausgaben im Log
 *
 * @returns {Promise<string>} Der vollständig pseudonymisierte Text.
 *
 * @throws {Error} Falls ein Fehler bei der Pseudonymisierung, der Regex-Verarbeitung oder beim Ersetzen auftritt.
 */
export default async function pseudoContentRegex(content, patterns, logger) {
    let result = content;
    const regexes = patterns.map((p) => new RegExp(p, "g"));

    for (const regex of regexes) {
        try {
            result = await replaceAsync(
                result,
                regex,
                async (match) => {
                    if (await isIPv4Address(match)) {
                        const ipBuffer = ipStringToBuffer(match);
                        const pseudonymizedBuffer = cp.pseudonymiseIP(ipBuffer);
                        return bufferToIpString(pseudonymizedBuffer);
                    } else if (await isEmailAddress(match)) {
                        logger?.info(`Pseudonymizing email address: ${match}`);
                        return await pseudonymizeEmail(match);
                    } else {
                        return generatePseudonym(match, anonymizationKey);
                    }
                },
                logger
            );
            logger?.info(`Applied pattern ${regex} for pseudonymization`);
        } catch (error) {
            logger?.error(`Error applying pattern ${regex}:`, { error });
            throw error;
        }
    }

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
 * @param {import('winston').Logger} logger - Logger für die Ausgaben im Log
 *
 * @returns {Promise<string>} Ein neuer String mit allen asynchron vervollständigten Ersetzungen.
 */
async function replaceAsync(str, regex, asyncFn, logger) {
    const matches = [];
    str.replace(regex, (match, ...args) => {
        const offset = args[args.length - 2];
        matches.push({ match, offset });
        return match;
    });

    const pieces = [];
    let lastIndex = 0;

    try {
        for (const { match, offset } of matches) {
            pieces.push(str.substring(lastIndex, offset));
            const replacement = await asyncFn(match);
            pieces.push(replacement);
            lastIndex = offset + match.length;
        }
    } catch (error) {
        logger?.error("Error in replaceAsync during asyncFn execution", {
            error,
        });
        throw error;
    }

    pieces.push(str.substring(lastIndex));
    return pieces.join("");
}
