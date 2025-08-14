import pseudonymizeEmail from "../utils/pseudonymizeMail.js";

process.env.pseudoKey = "1234567890abcdef";

describe("pseudonymizeMail", () => {
  it("ändert lokale und Domainteile, behält TLD", async () => {
    const email = "max@test.com";
    const out = await pseudonymizeEmail(email);
    expect(out).toMatch(/@.*\.com$/);
    expect(out).not.toBe(email);
  });
});
