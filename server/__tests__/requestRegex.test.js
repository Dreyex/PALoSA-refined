import requestRegex from "../utils/requestRegex.js";

describe("requestRegex", () => {
  it("kombiniert logSettings & regexSettings", async () => {
    const settings = {
      logSettings: { checkedOptions: ["E-Mail"] },
      regexSettings: { patterns: ["abc"] },
    };
    const patterns = await requestRegex(settings, "log");
    expect(patterns).toEqual(expect.arrayContaining(["abc"]));
  });

  it("gibt [] bei fehlenden Settings zurück", async () => {
    const patterns = await requestRegex({}, "log");
    expect(patterns).toEqual([]);
  });
});
