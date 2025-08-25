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
 * Verarbeitet und pseudonymisiert alle JSON-Dateien im angegebenen Ausgabeordner.
 *
 * Der Ablauf umfasst mehrere Schritte:
 *
 * 1. **Regex-Muster ermitteln** – Ermittelt reguläre Ausdrücke für den Typ `"other"` aus den `settings`
 *    mittels {@link requestRegex}, um später textbasierte Inhalte zu anonymisieren.
 * 2. **Config laden** – Liest `config.json` aus dem `uploadDir/json`, um:
 *    - `derivedFields` (abgeleitete Felder) zu bestimmen.
 *    - `sources` (Quellenfelder für gezielte Feld-Pseudonymisierung) zu ermitteln.
 * 3. **Source-Felder pseudonymisieren** – Durchläuft das JSON mit {@link processConfigSources},
 *    um gezielt Felder aus `sources` zu anonymisieren (IPs, E-Mails, etc.).
 * 4. **Derived-Felder erzeugen** – Verwendet {@link processConfigDerived}, um Felder aus mehreren
 *    Quellen zusammenzuführen und ggf. zu pseudonymisieren.
 * 5. **Regex-Pseudonymisierung auf gesamten JSON-String anwenden** – Nutzt {@link pseudoContentRegex},
 *    um den kompletten JSON-String nach den ermittelten Patterns zu durchsuchen und zu anonymisieren.
 * 6. **Ergebnisse zurückschreiben** – Überschreibt die Originaldatei im Ausgabeverzeichnis.
 *
 * @async
 * @function processJsonFiles
 * @param {string} uploadDir - Pfad zum Upload-Verzeichnis (enthält ggf. `json/config.json`).
 * @param {string} outputDir - Pfad zum Ausgabeverzeichnis, in dem die zu anonymisierenden JSON-Dateien liegen.
 * @param {Object} settings - Einstellungen für die Verarbeitung, z. B. Regex-Definitionen.
 * @param {Object} [settings.regexSettings] - Optional: Benutzerdefinierte Regex-Muster.
 * @param {Object} [settings.logSettings] - Optional: Aktivierte Standard-Muster (nicht typabhängig).
 * @param {import('winston').Logger} logger - Logger für die Ausgaben im Log
 *
 * @returns {Promise<void>} Gibt keinen Wert zurück, verarbeitet jedoch alle passenden JSON-Dateien im Verzeichnis.
 *
 * @throws {Error} Falls die Pseudonymisierung fehlschlägt oder eine Hilfsfunktion (z. B. {@link pseudoContentRegex})
 *                 keinen String zurückgibt.
 */
export default async function processJsonFiles(
    uploadDir,
    outputDir,
    settings,
    logger
) {
    try {
        const patterns = await requestRegex(settings, "other", logger);
        logger.info(
            `Using ${patterns.length} regex patterns for JSON anonymization`
        );

        const dirents = fs.readdirSync(outputDir, { withFileTypes: true });

        const configPath = path.join(uploadDir, "json", "json-config.json");
        let derivedFields = {};
        let sources = [];
        if (fs.existsSync(configPath)) {
            const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
            derivedFields = config.derived || {};
            sources = config.sources || [];
            logger.info(`Loaded config from ${configPath}`);
        } else {
            logger.warn(`Config file ${configPath} does not exist`);
        }

        for (const dirent of dirents) {
            if (dirent.isFile() && dirent.name.endsWith(".json")) {
                const filePath = path.join(outputDir, dirent.name);
                let jsonData = JSON.parse(fs.readFileSync(filePath, "utf-8"));

                logger.info(
                    `Processing source fields for file: ${dirent.name}`
                );
                jsonData = await processConfigSources({
                    jsonData,
                    logger,
                    configPath
                });

                logger.info(
                    `Processing derived fields for file: ${dirent.name}`
                );
                jsonData = processConfigDerived({
                    jsonData,
                    derivedFields,
                    sources,
                    uploadDir,
                    logger,
                });

                logger.info(
                    `Applying regex pseudonymization to file: ${dirent.name}`
                );
                const jsonString = JSON.stringify(jsonData);
                const updatedContent = await pseudoContentRegex(
                    jsonString,
                    patterns,
                    logger
                );

                if (typeof updatedContent !== "string") {
                    throw new Error(
                        "PseudoContentRegex hat keinen String zurückgegeben"
                    );
                }

                fs.writeFileSync(filePath, updatedContent, "utf-8");
                logger.info(`Anonymized JSON file: ${dirent.name}`);
            }
        }

        logger.info("Finished processing all JSON files");
    } catch (error) {
        logger.error("Error in processJsonFiles:", { error });
        throw error; // Weiterwerfen für zentrale Behandlung
    }
}

/**
 * Pseudonymisiert gezielt bestimmte Felder in einer JSON-Datenstruktur basierend auf
 * einer Konfiguration aus der Datei `config.json` im Upload-Verzeichnis.
 *
 * Die Funktion liest die Konfigurationsdatei, ermittelt eine Liste von Feldnamen (`sources`)
 * und durchläuft rekursiv das JSON-Objekt, um Werte dieser Felder zu ersetzen:
 *
 * - **IPv4-Adressen** → deterministische Pseudonymisierung mithilfe von CryptoPAn.
 * - **E-Mail-Adressen** → Pseudonymisierung mit {@link pseudonymizeEmail}.
 * - **Alle anderen Werte** → Generische Pseudonymisierung mit {@link generatePseudonym}.
 *
 * Intern verwendet die Funktion {@link traverseAndProcess}, um die relevanten Felder
 * tiefenrekursiv zu finden und zu bearbeiten.
 *
 * @async
 * @function processConfigSources
 * @param {Object} params - Parameterobjekt.
 * @param {string} params.uploadDir - Pfad zum Upload-Verzeichnis, in dem `json/config.json` erwartet wird.
 * @param {Object} params.jsonData - Das zu pseudonymisierende JSON-Objekt.
 * @param {import('winston').Logger} logger - Logger für die Ausgaben im Log
 *
 * @returns {Promise<Object>} Das pseudonymisierte JSON-Objekt.
 *
 * @throws {Error} Wenn das Lesen oder Parsen der `config.json` fehlschlägt,
 *                 oder wenn die Pseudonymisierung für ein Feld nicht durchgeführt werden kann.
 */
export async function processConfigSources({jsonData, logger, configPath }) {
    if (!fs.existsSync(configPath)) {
        logger?.warn(`Config file not found at ${configPath}`);
        return jsonData;
    }

    try {
        const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
        const sources = config.sources || [];
        const pseudoKey = process.env.PSEUDO_KEY || "defaultKey";
        // CryptoPAn benötigt 32 Byte Schlüssel
        const keyBuffer = Buffer.from(pseudoKey, "utf-8");
        const paddedKey = Buffer.alloc(32);
        keyBuffer.copy(paddedKey);
        const cryptoPAn = new CryptoPAn(paddedKey);

        for (const fieldName of sources) {
            logger?.info(`Processing source field: ${fieldName}`);
            await traverseAndProcess(
                jsonData,
                fieldName,
                async (parentObj, key) => {
                    const value = parentObj[key];
                    try {
                        if (typeof value === "string" && isIPv4Address(value)) {
                            const ipBuffer = ipStringToBuffer(value);
                            const ip = bufferToIpString(
                                cryptoPAn.pseudonymiseIP(ipBuffer)
                            );
                            parentObj[key] = ip;
                        } else if (
                            typeof value === "string" &&
                            isEmailAddress(value)
                        ) {
                            parentObj[key] = await pseudonymizeEmail(value);
                        } else {
                            parentObj[key] = await generatePseudonym(
                                value,
                                pseudoKey
                            );
                        }
                    } catch (err) {
                        logger?.error(
                            `Error pseudonymizing value in field ${fieldName}`,
                            { error: err }
                        );
                        throw err;
                    }
                }
            );
            logger;
        }
    } catch (error) {
        logger?.error("Error in processConfigSources:", { error });
        throw error;
    }

    return jsonData;
}

/**
 * Erzeugt oder aktualisiert abgeleitete Felder in einem JSON-Objekt basierend auf einer Konfigurationsdefinition.
 *
 * Die Funktion erlaubt es, mehrere Quellwerte (`sources`) aus dem JSON zu lesen,
 * diese zu einem neuen Feld zusammenzuführen und optional durch einen Separator zu trennen.
 *
 * Wenn keine der angegebenen Quellen Daten enthält, wird das Ziel mit `null` belegt.
 * Intern nutzt die Funktion {@link getByPath} zum Auslesen verschachtelter Werte
 * und {@link setByPath} zum Setzen der Zielwerte.
 *
 * @function processConfigDerived
 * @param {Object} params - Parameterobjekt.
 * @param {Object} params.jsonData - Das zu verarbeitende JSON-Objekt, in dem neue Felder erstellt oder vorhandene aktualisiert werden.
 * @param {Object} params.derivedFields - Konfiguration für die abzuleitenden Felder.
 * @param {Object} params.derivedFields[<targetKey>] - Definition eines Derived Fields.
 * @param {string[]} params.derivedFields[<targetKey>].sources - Liste von Pfaden (`dot notation`) zu den Quellfeldern.
 * @param {string} [params.derivedFields[<targetKey>].separator=""] - Trennzeichen zwischen den zusammengeführten Quellwerten (Standard: leer).
 * @param {import('winston').Logger} logger - Logger für die Ausgaben im Log
 *
 * @returns {Object} Das bearbeitete JSON-Objekt mit den hinzugefügten oder aktualisierten Derived Fields.
 */
export function processConfigDerived({ jsonData, derivedFields, logger }) {
    for (const [targetKey, config] of Object.entries(derivedFields)) {
        const { sources: paths, separator = "" } = config;
        const values = [];
        for (const pathStr of paths) {
            const value = getByPath(jsonData, pathStr, logger);
            if (value !== undefined) values.push(value);
        }
        if (values.length > 0) {
            setByPath(jsonData, targetKey, values.join(separator), logger);
            logger?.info(
                `Set derived field '${targetKey}' with value: ${values.join(
                    separator
                )}`
            );
        } else {
            setByPath(jsonData, targetKey, null, logger);
            logger?.info(
                `Set derived field '${targetKey}' to null (no source values)`
            );
        }
    }
    return jsonData;
}

/**
 * Durchläuft ein Objekt rekursiv und führt für alle Vorkommen eines bestimmten Schlüssels
 * (`keyToFind`) eine asynchrone Callback-Funktion aus.
 *
 * Diese Funktion ist besonders nützlich, um verschachtelte Datenstrukturen
 * (z. B. JSON-Objekte) zu durchsuchen und gezielt Werte zu verarbeiten oder zu verändern.
 *
 * **Funktionsweise:**
 * 1. Überprüft, ob das aktuelle Element ein Objekt ist.
 * 2. Iteriert über alle Schlüssel im aktuellen Objekt.
 * 3. Falls der Schlüssel mit `keyToFind` übereinstimmt und der Wert **nicht null oder undefined** ist,
 *    wird der Callback asynchron ausgeführt und auf dessen Abschluss gewartet.
 * 4. Falls der aktuelle Wert selbst ein Objekt ist, wird die Funktion rekursiv aufgerufen.
 *
 * @async
 * @function traverseAndProcess
 * @param {Object} obj - Das zu durchsuchende Objekt (beliebige Tiefenstruktur).
 * @param {string} keyToFind - Der Name des Schlüssels, nach dem rekursiv gesucht werden soll.
 * @param {(parentObj: Object, key: string) => Promise<void>} callback -
 *        Eine asynchrone Funktion, die aufgerufen wird, wenn der Schlüssel gefunden wurde.
 *        Sie erhält das Elternobjekt und den gefundenen Schlüssel als Parameter,
 *        sodass der Wert bei Bedarf direkt verändert werden kann.
 * @param {import('winston').Logger} logger - Logger für die Ausgaben im Log
 *
 * @returns {Promise<void>} Es wird nichts zurückgegeben, aber das Objekt kann durch den Callback verändert werden.
 */
export async function traverseAndProcess(obj, keyToFind, callback, logger) {
    if (typeof obj !== "object" || obj === null) return;

    for (const key in obj) {
        try {
            if (
                key === keyToFind &&
                obj[key] !== undefined &&
                obj[key] !== null
            ) {
                await callback(obj, key);
            }
            if (typeof obj[key] === "object" && obj[key] !== null) {
                await traverseAndProcess(obj[key], keyToFind, callback, logger);
            }
        } catch (err) {
            logger?.error(
                `Error processing key '${keyToFind}' in traverseAndProcess`,
                { error: err }
            );
            throw err;
        }
    }
}

/**
 * Ruft einen verschachtelten Wert aus einem Objekt anhand eines gegebenen
 * Pfads (`dot notation`) ab.
 *
 * Falls ein Teil des Pfades nicht existiert, wird `undefined` zurückgegeben.
 *
 * @function getByPath
 * @param {Object} obj - Das Quellobjekt, aus dem der Wert gelesen werden soll.
 * @param {string} path - Der Pfad im `dot`-Format (z. B. `"user.address.street"`),
 *                        der angibt, welcher Wert abgerufen werden soll.
 * @param {import('winston').Logger} logger - Logger für die Ausgaben im Log
 *
 * @returns {*|undefined} Der gefundene Wert am angegebenen Pfad, oder `undefined`, wenn der Pfad nicht existiert.
 */
export function getByPath(obj, path, logger) {
    const segments = path.split(".");
    function recursiveGet(current, segIdx) {
        if (segIdx >= segments.length) return current;
        const segment = segments[segIdx];
        if (Array.isArray(current)) {
            // Für jedes Element im Array rekursiv weitergehen
            return current
                .map(item => recursiveGet(item, segIdx))
                .filter(v => v !== undefined);
        }
        if (current && typeof current === "object" && segment in current) {
            return recursiveGet(current[segment], segIdx + 1);
        } else {
            logger?.warn(
                `getByPath: Segment '${segment}' nicht gefunden in Pfad '${path}'`
            );
            return undefined;
        }
    }
    return recursiveGet(obj, 0);
}

/**
 * Setzt einen Wert in einem verschachtelten Objekt an einer durch einen Pfad
 * (`dot notation`) definierten Position.
 *
 * Falls Teile des Pfades noch nicht existieren, werden automatisch leere Objekte erstellt.
 *
 * @function setByPath
 * @param {Object} obj - Das Zielobjekt, in dem der Wert gesetzt werden soll.
 * @param {string} path - Der Pfad im `dot`-Format (z. B. `"user.address.street"`), der angibt,
 *                        wo der Wert gesetzt werden soll.
 * @param {*} value - Der Wert, der an der angegebenen Position gespeichert wird.
 * @param {import('winston').Logger} logger - Logger für die Ausgaben im Log
 *
 * @returns {void} Die Funktion gibt keinen Wert zurück, verändert aber das übergebene Objekt direkt.
 */
export function setByPath(obj, path, value, logger) {
    const keys = path.split(".");
    function recursiveSet(current, idx) {
        const key = keys[idx];
        if (idx === keys.length - 1) {
            if (Array.isArray(current)) {
                // Für jedes Element im Array Wert setzen
                current.forEach(item => recursiveSet(item, idx));
            } else {
                current[key] = value;
                logger?.info(`setByPath: Wert gesetzt im Pfad '${path}'`);
            }
            return;
        }
        if (Array.isArray(current)) {
            // Für jedes Element im Array rekursiv weitergehen
            current.forEach(item => recursiveSet(item, idx));
            return;
        }
        if (!(key in current)) {
            current[key] = {};
            logger?.info(
                `setByPath: Teilpfad '${key}' wurde erstellt in Pfad '${path}'`
            );
        }
        recursiveSet(current[key], idx + 1);
    }
    recursiveSet(obj, 0);
}
