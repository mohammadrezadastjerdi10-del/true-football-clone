import { describe, expect, test } from "bun:test";
import { avg, fmtMoney, formLetters, formTone, ordinal } from "../src/lib/game/format";

describe("fmtMoney", () => {
  test("formats small amounts", () => {
    expect(fmtMoney(0)).toBe("€0");
    expect(fmtMoney(999)).toBe("€999");
  });

  test("formats thousands", () => {
    expect(fmtMoney(12_000)).toBe("€12K");
    expect(fmtMoney(980_000)).toBe("€980K");
  });

  test("formats millions", () => {
    expect(fmtMoney(1_234_567)).toBe("€1.23M");
    expect(fmtMoney(15_000_000)).toBe("€15.00M");
  });

  test("formats billions", () => {
    expect(fmtMoney(2_500_000_000)).toBe("€2.50B");
  });

  test("handles negatives", () => {
    expect(fmtMoney(-50_000)).toBe("-€50K");
    expect(fmtMoney(-1_000_000)).toBe("-€1.00M");
  });
});

describe("ordinal", () => {
  test("produces correct suffixes", () => {
    expect(ordinal(1)).toBe("1st");
    expect(ordinal(2)).toBe("2nd");
    expect(ordinal(3)).toBe("3rd");
    expect(ordinal(4)).toBe("4th");
    expect(ordinal(11)).toBe("11th");
    expect(ordinal(12)).toBe("12th");
    expect(ordinal(13)).toBe("13th");
    expect(ordinal(21)).toBe("21st");
    expect(ordinal(22)).toBe("22nd");
    expect(ordinal(23)).toBe("23rd");
    expect(ordinal(101)).toBe("101st");
  });
});

describe("formLetters", () => {
  test("splits a form string", () => {
    expect(formLetters("WDLWW")).toEqual(["W", "D", "L", "W", "W"]);
  });

  test("returns [] for non-strings", () => {
    expect(formLetters(undefined)).toEqual([]);
    expect(formLetters(42)).toEqual([]);
  });
});

describe("formTone", () => {
  test("maps results to tone classes", () => {
    expect(formTone("W")).toContain("emerald");
    expect(formTone("D")).toContain("zinc");
    expect(formTone("L")).toContain("red");
  });
});

describe("avg", () => {
  test("averages numbers", () => {
    expect(avg([1, 2, 3])).toBe(2);
    expect(avg([])).toBe(0);
  });
});
