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
 * 
 * @returns {Promise<void>} Gibt keinen Wert zurück, verarbeitet jedoch alle passenden JSON-Dateien im Verzeichnis.
 * 
 * @throws {Error} Falls die Pseudonymisierung fehlschlägt oder eine Hilfsfunktion (z. B. {@link pseudoContentRegex}) 
 *                 keinen String zurückgibt.
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
            // 1. Quellenfelder überall finden und pseudonymisieren
            console.log("...Processing Source Fields...");
            jsonData = await processConfigSources({ uploadDir, jsonData });
            // 2. Abgeleitete Felder bilden und pseudonymisieren
            console.log("...Processing Derived Fields...");
            jsonData = processConfigDerived({
                jsonData,
                derivedFields,
                sources,
                uploadDir,
            });
            // 3. Reguläre Expressions auf String anwenden
            console.log("...Processing Regexes...");
            const jsonString = JSON.stringify(jsonData);
            const updatedContent = await pseudoContentRegex(
                jsonString,
                patterns
            );
            if (typeof updatedContent !== "string") {
                throw new Error(
                    "PseudoContentRegex hat keinen String zurückgegeben"
                );
            }
            fs.writeFileSync(filePath, updatedContent, "utf-8");
            //console.log(`Anonymisiert: ${dirent.name}`);
        }
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
 * 
 * @returns {Promise<Object>} Das pseudonymisierte JSON-Objekt.
 * 
 * @throws {Error} Wenn das Lesen oder Parsen der `config.json` fehlschlägt, 
 *                 oder wenn die Pseudonymisierung für ein Feld nicht durchgeführt werden kann.
 */
async function processConfigSources({ uploadDir, jsonData }) {
    const configPath = path.join(uploadDir, "json", "config.json");
    if (!fs.existsSync(configPath)) return jsonData;
    const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    const sources = config.sources || [];
    const pseudoKey = process.env.pseudoKey || "defaultKey";
    // CryptoPAn benötigt einen 32-Byte Schlüssel
    const keyBuffer = Buffer.from(pseudoKey, "utf-8");
    const paddedKey = Buffer.alloc(32);
    keyBuffer.copy(paddedKey);
    const cryptoPAn = new CryptoPAn(paddedKey);

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
 * 
 * @returns {Object} Das bearbeitete JSON-Objekt mit den hinzugefügten oder aktualisierten Derived Fields.
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
 * 
 * @returns {Promise<void>} Es wird nichts zurückgegeben, aber das Objekt kann durch den Callback verändert werden.
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
 * Ruft einen verschachtelten Wert aus einem Objekt anhand eines gegebenen 
 * Pfads (`dot notation`) ab.
 * 
 * Falls ein Teil des Pfades nicht existiert, wird `undefined` zurückgegeben.
 * 
 * @function getByPath
 * @param {Object} obj - Das Quellobjekt, aus dem der Wert gelesen werden soll.
 * @param {string} path - Der Pfad im `dot`-Format (z. B. `"user.address.street"`), 
 *                        der angibt, welcher Wert abgerufen werden soll.
 * 
 * @returns {*|undefined} Der gefundene Wert am angegebenen Pfad, oder `undefined`, wenn der Pfad nicht existiert.
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
 * 
 * @returns {void} Die Funktion gibt keinen Wert zurück, verändert aber das übergebene Objekt direkt.
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
