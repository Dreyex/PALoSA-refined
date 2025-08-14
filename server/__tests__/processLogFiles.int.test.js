import fs from "fs";
import fsPromises from "fs/promises";
import path from "path";
import processLogFiles from "../utils/processLogFiles.js";

const sessionId = "jest-log-test";
const outputDir = path.join("server", "output", sessionId);

const settings = {
    pseudoKey: "1234567890abcdef",
    logSettings: { checkedOptions: ["E-Mail", "IP-Adressen"] },
    regexSettings: { patterns: [] },
};

beforeAll(async () => {
    process.env.pseudoKey = "1234567890abcdef";

    await fsPromises.mkdir(outputDir, { recursive: true });
    const logContent = "IP: 192.168.1.1 Email: test@example.com";
    await fsPromises.writeFile(path.join(outputDir, "server.log"), logContent);
});

afterAll(async () => {
    await fsPromises.rm(outputDir, { recursive: true, force: true });
});

test("processLogFiles pseudonymisiert IP und E-Mail in Logdateien", async () => {
    await processLogFiles(outputDir, settings);

    const content = fs.readFileSync(
        path.join(outputDir, "server.log"),
        "utf-8"
    );

    expect(content).not.toContain("192.168.1.1");
    expect(content).not.toContain("test@example.com");
});
