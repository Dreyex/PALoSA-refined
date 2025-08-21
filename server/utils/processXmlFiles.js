import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import generatePseudonym from "pseudonymous-id-generator";
import requestRegex from "./requestRegex.js";
import pseudonymizeEmail from "./pseudonymizeMail.js";
import isIPv4Address from "./isIPv4Address.js";
import isEmailAddress from "./isEMailAddress.js";
import { ipStringToBuffer, bufferToIpString } from "./ipBuffer.js";
import { CryptoPAn } from "cryptopan";
import { XMLParser, XMLBuilder } from "fast-xml-parser";
dotenv.config();

/**
 * Verarbeitet und pseudonymisiert XML-Dateien in einem angegebenen Ausgabeordner basierend auf den übergebenen Einstellungen.
 *
 * Die Funktion führt folgende Schritte aus:
 * - Lädt die Konfiguration aus der Datei "xml/config.json" im Upload-Verzeichnis, um abgeleitete Felder und Quellen-Elementnamen zu extrahieren.
 * - Liest alle XML-Dateien im Ausgabeordner ein.
 * - Für jede XML-Datei wird der Inhalt geparsed, die XML-Knoten werden durchlaufen und Werte in Elementen
 *   pseudonymisiert, die entweder zu den Quellen gehören oder einem regulären Ausdrucksmuster entsprechen.
 *   - E-Mail-Adressen werden mit einem eigenen Pseudonymisierer pseudonymisiert.
 *   - IPv4-Adressen werden mit dem CryptoPAn-Algorithmus und einem Schlüssel aus den Umgebungsvariablen anonymisiert.
 *   - Andere passende Textwerte werden durch generierte Pseudonyme ersetzt.
 * - Anschließend werden abgeleitete Felder im gesamten XML-Text durch zusätzliche Regex-Ersetzungen pseudonymisiert.
 * - Die veränderten XML-Daten werden formatiert zurück in die Originaldateien geschrieben.
 *
 * @async
 * @param {string} uploadDir - Das Basisverzeichnis, in dem sich die Datei "xml/config.json" befindet.
 * @param {string} outputDir - Der Ordner mit den zu verarbeitenden und zu überschreibenden XML-Dateien.
 * @param {Object} settings - Einstellungen zur Anforderung regulärer Ausdrücke für die Mustererkennung.
 *
 * @throws Gibt bei Fehlern beim Lesen, Parsen oder Schreiben einer Datei eine Fehlermeldung aus, verarbeitet aber weiterhin andere Dateien.
 */
export default async function processXmlFiles(uploadDir, outputDir, settings) {
    const patterns = await requestRegex(settings, "other");
    const dirents = fs.readdirSync(outputDir, { withFileTypes: true });

    const configPath = path.join(uploadDir, "xml", "config.json");
    let derivedFields = {};
    let sources = [];
    if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
        derivedFields = config.derived || {};
        sources = config.sources || [];
    }

    const parser = new XMLParser({
        ignoreAttributes: false,
        preserveOrder: true,
        trimValues: true,
    });
    const builder = new XMLBuilder({
        ignoreAttributes: false,
        preserveOrder: true,
        format: true,
        indentBy: "  ",
        suppressEmptyNode: true,
    });

    for (const dirent of dirents) {
        if (dirent.isFile() && dirent.name.endsWith(".xml")) {
            const filePath = path.join(outputDir, dirent.name);
            try {
                const fileContent = fs.readFileSync(filePath, "utf-8");
                const parsedXml = parser.parse(fileContent);

                pseudonymizeXmlNodes(parsedXml, sources, patterns);

                let processedXmlString = builder.build(parsedXml);
                for (const field in derivedFields) {
                    const regex = new RegExp(derivedFields[field], "g");
                    processedXmlString = processedXmlString.replace(regex, () =>
                        generatePseudonym()
                    );
                }

                fs.writeFileSync(filePath, processedXmlString, "utf-8");
            } catch (err) {
                console.error(
                    `Fehler bei der Verarbeitung der Datei ${filePath}:`,
                    err
                );
            }
        }
    }
}

/**
 * Hilfsfunktion zur Prüfung, ob ein Text mindestens einem der übergebenen regulären Ausdrücke entspricht.
 *
 * @param {string} text - Der zu prüfende Text.
 * @param {Object} patterns - Ein Objekt mit Schlüssel-Wert-Paaren, wobei die Werte reguläre Ausdrücke als Strings sind.
 * @returns {boolean} True, wenn mindestens ein Pattern auf den Text zutrifft, sonst False.
 */
function matchesAnyPattern(text, patterns) {
    for (const key in patterns) {
        const regex = new RegExp(patterns[key], "g");
        if (regex.test(text)) {
            return true;
        }
    }
    return false;
}

/**
 * Rekursive Funktion, die XML-Knoten durchläuft und Textinhalte pseudonymisiert,
 * wenn diese bestimmten Bedingungen entsprechen (Quell-Elementnamen oder Muster).
 * 
 * Dabei werden E-Mail-Adressen, IPv4-Adressen und andere Inhalte gemäß jeweiligen Regeln pseudonymisiert.
 * 
 * @param {Array<Object>} nodes - Array von XML-Knoten im geparsten Format.
 * @param {Array<string>} sourceFields - Liste der XML-Elementnamen, die als besondere Quellen gelten und pseudonymisiert werden sollen.
 * @param {Object} regexPatterns - Objekt mit Schlüssel-Wert-Paaren für reguläre Ausdrücke zum Musterabgleich.
 */
function pseudonymizeXmlNodes(nodes, sourceFields, regexPatterns) {
    nodes.forEach((node) => {
        for (const key in node) {
            if (key === "__text") continue;

            const childrenOrValue = node[key];

            // Funktion zum Pseudonymisieren eines Textwerts
            function pseudonymizeValue(value) {
                if (isEmailAddress(value)) {
                    return pseudonymizeEmail(value);
                } else if (isIPv4Address(value)) {
                    const cp = new CryptoPAn(process.env.CRYPTO_PAN_KEY);
                    const ipBuf = ipStringToBuffer(value);
                    const anonIpBuf = cp.anonymize(ipBuf);
                    return bufferToIpString(anonIpBuf);
                } else {
                    return generatePseudonym();
                }
            }

            if (sourceFields.includes(key)) {
                if (Array.isArray(childrenOrValue)) {
                    childrenOrValue.forEach((child) => {
                        if (
                            Object.prototype.hasOwnProperty.call(
                                child,
                                "__text"
                            )
                        ) {
                            const content = child["__text"];
                            if (matchesAnyPattern(content, regexPatterns)) {
                                child["__text"] = pseudonymizeValue(content);
                            } else {
                                // Auch hier pseudonymisieren, wenn kein Pattern Match aber Quelle vorhanden
                                child["__text"] = pseudonymizeValue(content);
                            }
                        } else {
                            pseudonymizeXmlNodes([child]);
                        }
                    });
                } else if (typeof childrenOrValue === "string") {
                    if (matchesAnyPattern(childrenOrValue, regexPatterns)) {
                        node[key] = pseudonymizeValue(childrenOrValue);
                    } else {
                        node[key] = pseudonymizeValue(childrenOrValue);
                    }
                }
            } else if (Array.isArray(childrenOrValue)) {
                // Für Knoten, die nicht in sourceFields sind, aber deren Text einem Pattern entspricht
                pseudonymizeXmlNodes(childrenOrValue);
            }
        }
    });
}
