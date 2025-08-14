import fs from "fs";
import fsPromises from "fs/promises";
import path from "path";
import processJsonFiles from "../utils/processJsonFiles.js";

const sessionId = "jest-json-test";
const uploadDir = path.join("server", "uploads", sessionId);
const outputDir = path.join("server", "output", sessionId);

const settings = {
  pseudoKey: "1234567890abcdef",
  regexSettings: { patterns: [] },
  logSettings: { checkedOptions: ["E-Mail", "IP-Adressen"] }
};

beforeAll(async () => {
  process.env.pseudoKey = "1234567890abcdef";

  // config.json erstellen
  const configDir = path.join(uploadDir, "json");
  await fsPromises.mkdir(configDir, { recursive: true });
  const config = {
    sources: ["ipField", "mailField"],
    derived: {
      mergedField: {
        sources: ["nested.a", "nested.b"],
        separator: "-"
      }
    }
  };
  await fsPromises.writeFile(
    path.join(configDir, "config.json"),
    JSON.stringify(config, null, 2)
  );

  // Output-Ordner mit Testdatei erstellen
  await fsPromises.mkdir(outputDir, { recursive: true });
  const testData = {
    ipField: "192.168.1.1",
    mailField: "user@example.com",
    nested: { a: "foo", b: "bar" }
  };
  await fsPromises.writeFile(
    path.join(outputDir, "data.json"),
    JSON.stringify(testData)
  );
});

afterAll(async () => {
  await fsPromises.rm(uploadDir, { recursive: true, force: true });
  await fsPromises.rm(outputDir, { recursive: true, force: true });
});

test("processJsonFiles pseudonymisiert Inhalte und erstellt Derived Fields", async () => {
  await processJsonFiles(uploadDir, outputDir, settings);

  const content = fs.readFileSync(path.join(outputDir, "data.json"), "utf-8");

  expect(content).not.toContain("192.168.1.1");
  expect(content).not.toContain("user@example.com");
  expect(content).toContain("mergedField");
});
