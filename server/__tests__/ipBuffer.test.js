import { ipStringToBuffer, bufferToIpString } from "../utils/ipBuffer.js";

describe("ipBuffer", () => {
    it("konvertiert IP zu Buffer und zurück", () => {
        const buf = ipStringToBuffer("192.168.0.1");
        expect(buf).toBeInstanceOf(Buffer);
        expect(bufferToIpString(buf)).toBe("192.168.0.1");
    });
});
