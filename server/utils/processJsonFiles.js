import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import generatePseudonym from "pseudonymous-id-generator";
import requestRegex from "./requestRegex.js";
import pseudoContentRegex from "./pseudoContentRegex.js";
import pseudonymizeEmail from "./pseudonymizeMail.js";
import isIPv4Address from "./isIPv4Address.js";
import isEmailAddress from "./isEMailAddress.js";
import { ipStringToBuffer, bufferToIpString } from "./ipBuffer.js";
import { CryptoPAn } from "cryptopan"; // Beispielhaft
dotenv.config();

/**
 * Verarbeitet und anonymisiert alle JSON-Dateien im outputDir-Verzeichnis.
 * @async
 * @param {string} uploadDir - Pfad zum Session-Upload-Verzeichnis.
 * @param {string} outputDir - Pfad zum Output-Verzeichnis.
 * @param {object} settings - Einstellungen zur Regex-Erstellung.
 */
export default async function processJsonFiles(uploadDir, outputDir, settings) {
    const patterns = await requestRegex(settings, "other");
    const dirents = fs.readdirSync(outputDir, { withFileTypes: true });

    // (1) Lade abgeleitete Felder aus der Config
    const configPath = path.join(uploadDir, "json", "config.json");
    let derivedFields = {};
    let sources = [];
    if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
        derivedFields = config.derived || {};
        sources = config.sources || [];
    }

    for (const dirent of dirents) {
        if (dirent.isFile() && dirent.name.endsWith(".json")) {
            const filePath = path.join(outputDir, dirent.name);
            let jsonData = JSON.parse(fs.readFileSync(filePath, "utf-8"));
            console.log(jsonData);
            // 1. Quellenfelder überall finden und pseudonymisieren
            console.log("...Processing Source Fields...");
            jsonData = await processConfigSources({ uploadDir, jsonData });
            console.log(jsonData);
            // 2. Abgeleitete Felder bilden und pseudonymisieren
            console.log("...Processing Derived Fields...");
            jsonData = processConfigDerived({
                jsonData,
                derivedFields,
                sources,
                uploadDir,
            });
            console.log(jsonData);
            // 3. Reguläre Expressions auf String anwenden
            console.log("...Processing Regexes...");
            const jsonString = JSON.stringify(jsonData);
            const updatedContent = await pseudoContentRegex(
                jsonString,
                patterns
            );
            console.log(updatedContent);
            if (typeof updatedContent !== "string") {
                throw new Error(
                    "PseudoContentRegex hat keinen String zurückgegeben"
                );
            }
            fs.writeFileSync(filePath, updatedContent, "utf-8");
            console.log(`Anonymisiert: ${dirent.name}`);
        }
    }
}

/**
 * Pseudonymisiert Werte aus Sources-Feldern in der Konfigurationsdatei.
 * @async
 * @param {object} params - Objekt mit notwendigen Parametern.
 * @param {string} params.uploadDir - Pfad zum Upload-Verzeichnis der Session.
 * @param {object} params.jsonData - Zu anonymisierendes JSON-Objekt.
 * @returns {object} - JSON-Objekt mit pseudonymisierten Source-Feldern.
 */
async function processConfigSources({ uploadDir, jsonData }) {
    const configPath = path.join(uploadDir, "json", "config.json");
    if (!fs.existsSync(configPath)) return jsonData;
    const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    const sources = config.sources || [];
    const pseudoKey = process.env.pseudoKey || "defaultKey";
    const cryptoPAn = new CryptoPAn(Buffer.from(pseudoKey, "utf-8"));

    for (const fieldName of sources) {
        // Ersetze alle Vorkommen des Feldes innerhalb der JSON Rekursiv
        await traverseAndProcess(
            jsonData,
            fieldName,
            async (parentObj, key) => {
                const value = parentObj[key];
                if (typeof value === "string" && isIPv4Address(value)) {
                    const ipBuffer = ipStringToBuffer(value);
                    let ip = bufferToIpString(
                        cryptoPAn.pseudonymiseIP(ipBuffer)
                    );
                    parentObj[key] = ip;
                } else if (typeof value === "string" && isEmailAddress(value)) {
                    console.log(typeof value, value);
                    parentObj[key] = await pseudonymizeEmail(value);
                } else {
                    parentObj[key] = await generatePseudonym(value, pseudoKey);
                }
            }
        );
    }
    return jsonData;
}

/**
 * Überträgt abgeleitete Feldwerte gemäß der Konfiguration,
 * wobei sowohl der Ziel-Key als auch die Quellen-Pfade als Punktnotation-Strings angegeben werden.
 * @param {object} params
 * @param {object} params.jsonData
 * @param {object} params.derivedFields - Key = Ziel-Pfadstring; Value = { sources: Array von Pfadstrings, separator: String }
 * @returns {object} jsonData mit gesetzten Derived-Feldern
 */
function processConfigDerived({ jsonData, derivedFields }) {
    for (const [targetKey, config] of Object.entries(derivedFields)) {
        const { sources: paths, separator = "" } = config;
        const values = [];
        for (const pathStr of paths) {
            const value = getByPath(jsonData, pathStr);
            if (value !== undefined) values.push(value);
        }
        if (values.length > 0) {
            setByPath(jsonData, targetKey, values.join(separator));
        } else {
            setByPath(jsonData, targetKey, null);
        }
    }
    return jsonData;
}

/**
 * Durchläuft rekursiv ein Objekt und ruft für jeden Schlüssel, der mit `keyToFind` übereinstimmt, eine asynchrone Callbackfunktion auf.
 *
 * @async
 * @param {object} obj - Das zu durchsuchende Objekt.
 * @param {string} keyToFind - Der Schlüsselname, nach dem gesucht wird.
 * @param {(parentObj: object, key: string) => Promise<void>} callback - Asynchrone Callbackfunktion, die aufgerufen wird, wenn der Schlüssel gefunden wird.
 *        Die Callback erhält das Elternobjekt und den Schlüssel als Argumente.
 * @returns {Promise<void>} Löst auf, wenn das gesamte Objekt rekursiv verarbeitet wurde.
 */
async function traverseAndProcess(obj, keyToFind, callback) {
    if (typeof obj !== "object" || obj === null) return;
    for (const key in obj) {
        if (key === keyToFind && obj[key] !== undefined && obj[key] !== null) {
            // Auf das Promise des async Callback warten
            await callback(obj, key);
        }
        if (typeof obj[key] === "object" && obj[key] !== null) {
            // Rekursiv asynchron aufrufen und warten
            await traverseAndProcess(obj[key], keyToFind, callback);
        }
    }
}

/**
 * Ruft den Wert aus einem verschachtelten Objekt anhand eines Pfades mit Punktnotation ab.
 *
 * @param {Object} obj - Das Objekt, aus dem der Wert ausgelesen werden soll.
 * @param {string} path - Der Pfad zum Wert im Objekt, als Punkt-getrennener String (z.B. "adresse.strasse.hausnummer").
 * @returns {*} - Der Wert am angegebenen Pfad oder undefined, falls der Pfad nicht existiert.
 */
function getByPath(obj, path) {
    const segments = path.split(".");
    let current = obj;
    for (const segment of segments) {
        if (current && typeof current === "object" && segment in current) {
            current = current[segment];
        } else {
            return undefined;
        }
    }
    return current;
}

/**
 * Setzt einen Wert in einem verschachtelten Objekt anhand eines Pfades mit Punktnotation.
 * Achtung: Falls Zwischenobjekte auf dem Pfad nicht existieren, werden diese neu als leere Objekte angelegt.
 *
 * @param {Object} obj - Das Objekt, in dem der Wert gesetzt werden soll.
 * @param {string} path - Der Pfad zum zu setzenden Wert im Objekt, als Punkt-getrennener String (z.B. "adresse.strasse.hausnummer").
 * @param {*} value - Der Wert, der am Pfad gesetzt werden soll.
 */
function setByPath(obj, path, value) {
    const keys = path.split(".");
    let current = obj;
    for (let i = 0; i < keys.length - 1; i++) {
        if (!(keys[i] in current)) current[keys[i]] = {};
        current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
}
