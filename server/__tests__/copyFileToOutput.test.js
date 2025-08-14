import fs from "fs";
import fsPromises from "fs/promises";
import copyFileToOutput from "../utils/copyFileToOutput.js";

jest.mock("fs");
jest.mock("fs/promises");

describe("copyFileToOutput", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("kopiert Dateien erfolgreich", async () => {
    fs.existsSync.mockReturnValue(true);
    fsPromises.readdir.mockResolvedValue(["data.json"]);
    fsPromises.stat.mockResolvedValue({ isFile: () => true });
    fsPromises.copyFile.mockResolvedValue();

    await copyFileToOutput("/upload", "/output");

    expect(fsPromises.copyFile).toHaveBeenCalled();
  });

  it("bricht ab, wenn Upload-Ordner fehlt", async () => {
    fs.existsSync.mockReturnValue(false);
    await copyFileToOutput("/upload", "/output");
    expect(fsPromises.copyFile).not.toHaveBeenCalled();
  });
});
