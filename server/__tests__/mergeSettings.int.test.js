import fs from "fs";
import fsPromises from "fs/promises";
import path from "path";
import mergeSettings from "../utils/mergeSettings.js";

const sessionId = "jest-merge-test";
const uploadDir = path.join("server", "uploads", sessionId);

beforeEach(async () => {
    // Clean up any existing test files first
    await fsPromises.rm(uploadDir, { recursive: true, force: true });
    
    // Upload-/json-Verzeichnis vorbereiten
    await fsPromises.mkdir(path.join(uploadDir, "json"), { recursive: true });

    // Bestehende Config-Datei mit initialen Sources
    const initialConfig = {
        sources: ["existingField"],
        derived: {},
    };
    await fsPromises.writeFile(
        path.join(uploadDir, "json", "config.json"),
        JSON.stringify(initialConfig, null, 2)
    );
});

afterAll(async () => {
    await fsPromises.rm(uploadDir, { recursive: true, force: true });
});

test("mergeSettings erstellt gemergte config.json", async () => {
    const settings = {
        jsonSettings: {
            checkedOptions: ["fieldA", "fieldB"],
            patterns: ["pattern1"],
        },
        regexSettings: {
            checkedOptions: ["regexCheckA"],
            patterns: ["pattern2"],
        },
    };

    await mergeSettings(sessionId, settings, "json");

    const configPath = path.join(uploadDir, "json", "config.json");
    expect(fs.existsSync(configPath)).toBe(true);

    const merged = JSON.parse(fs.readFileSync(configPath, "utf-8"));

    // Vorhandene + neue Quellen enthalten
    expect(merged.sources).toEqual(
        expect.arrayContaining([
            "existingField",
            "fieldA",
            "fieldB",
            "pattern1",
            "regexCheckA",
            "pattern2",
        ])
    );

    // Keine Duplikate
    const uniqueCount = new Set(merged.sources).size;
    expect(uniqueCount).toBe(merged.sources.length);

    // Cleanup zweite Session
    await fsPromises.rm(path.join("server", "uploads", sessionId), {
        recursive: true,
        force: true,
    });
});

test("mergeSettings erstellt neue config.json wenn keine vorhanden", async () => {
    const sessionId2 = "jest-merge-test-2";
    const settings2 = {
        jsonSettings: {
            checkedOptions: ["foo"],
            patterns: [],
        },
    };

    await mergeSettings(sessionId2, settings2, "json");

    const configPath = path.join(
        "server",
        "uploads",
        sessionId2,
        "json",
        "config.json"
    );
    expect(fs.existsSync(configPath)).toBe(true);

    const merged = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    expect(merged.sources).toEqual(["foo"]);

    // Cleanup zweite Session
    await fsPromises.rm(path.join("server", "uploads", sessionId2), {
        recursive: true,
        force: true,
    });
});
