import generateFileName from "../utils/generateFileName.js";

describe("generateFileName", () => {
    it("stellt -pseudo vor die Dateiendung", async () => {
        expect(await generateFileName("test.json")).toBe("test-pseudo.json");
    });

    it("hängt -pseudo ans Ende, wenn keine Endung vorhanden", async () => {
        expect(await generateFileName("readme")).toBe("readme-pseudo");
    });
});
