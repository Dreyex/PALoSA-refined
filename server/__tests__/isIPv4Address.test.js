import isIPv4Address from "../utils/isIPv4Address.js";

describe("isIPv4Address", () => {
    it("erkennt gültige IPv4-Adressen", () => {
        expect(isIPv4Address("192.168.1.1")).toBe(true);
    });

    it("erkennt ungültige Adressen", () => {
        expect(isIPv4Address("999.999.999.999")).toBe(false);
        expect(isIPv4Address("abc.def.ghi.jkl")).toBe(false);
    });
});
