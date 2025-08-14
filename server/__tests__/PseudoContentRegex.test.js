import pseudoContentRegex from "../utils/pseudoContentRegex.js";

process.env.pseudoKey = "1234567890abcdef"; // 16 chars

describe("pseudoContentRegex", () => {
  it("pseudonymisiert E-Mail", async () => {
    const out = await pseudoContentRegex("test@example.com", ["[\\w.-]+@[\\w.-]+"]);
    expect(out).not.toBe("test@example.com");
  });

  it("pseudonymisiert IPv4", async () => {
    const out = await pseudoContentRegex("192.168.0.1", ["\\b(\\d{1,3}\\.){3}\\d{1,3}\\b"]);
    expect(out).not.toBe("192.168.0.1");
  });
});
