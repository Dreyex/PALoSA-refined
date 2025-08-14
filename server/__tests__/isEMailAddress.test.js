import isEmailAddress from "../utils/isEMailAddress.js";

describe("isEmailAddress", () => {
    it("akzeptiert gültige Adressen", () => {
        expect(isEmailAddress("test@example.com")).toBe(true);
    });

    it("lehnt ungültige Adressen ab", () => {
        expect(isEmailAddress("test@")).toBe(false);
    });
});
