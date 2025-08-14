import { mkdir, writeFile } from "fs/promises";
import { createFile } from "../utils/createFile.js";

jest.mock("fs/promises");

describe("createFile", () => {
  it("erstellt Datei mit Inhalt", async () => {
    await createFile("/tmp", "test", "txt", "Hallo");
    expect(mkdir).toHaveBeenCalled();
    expect(writeFile).toHaveBeenCalled();
  });
});
