import { describe, expect, test } from "bun:test";
import { hashSeed, Rng } from "../src/lib/game/rng";

describe("Rng", () => {
  test("is deterministic for the same seed", () => {
    const a = new Rng(42);
    const b = new Rng(42);
    for (let i = 0; i < 100; i++) {
      expect(a.next()).toBe(b.next());
    }
  });

  test("different seeds produce different sequences", () => {
    const a = new Rng(1);
    const b = new Rng(2);
    const seqA = Array.from({ length: 10 }, () => a.next());
    const seqB = Array.from({ length: 10 }, () => b.next());
    expect(seqA).not.toEqual(seqB);
  });

  test("next() stays in [0, 1)", () => {
    const rng = new Rng(7);
    for (let i = 0; i < 10_000; i++) {
      const v = rng.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  test("int() is inclusive of both bounds", () => {
    const rng = new Rng(9);
    for (let i = 0; i < 1_000; i++) {
      const v = rng.int(3, 8);
      expect(v).toBeGreaterThanOrEqual(3);
      expect(v).toBeLessThanOrEqual(8);
      expect(Number.isInteger(v)).toBe(true);
    }
    expect(new Rng(1).int(5, 5)).toBe(5);
  });

  test("range() stays in [min, max)", () => {
    const rng = new Rng(11);
    for (let i = 0; i < 1_000; i++) {
      const v = rng.range(-2.5, 3.5);
      expect(v).toBeGreaterThanOrEqual(-2.5);
      expect(v).toBeLessThan(3.5);
    }
  });

  test("chance() respects the probability bounds", () => {
    expect(new Rng(1).chance(0)).toBe(false);
    expect(new Rng(1).chance(1)).toBe(true);
  });

  test("shuffle() preserves the element multiset", () => {
    const rng = new Rng(5);
    const input = [1, 2, 3, 4, 5, 6, 7, 8];
    const out = rng.shuffle(input);
    expect(out).toHaveLength(input.length);
    expect([...out].sort((a, b) => a - b)).toEqual([...input].sort((a, b) => a - b));
  });

  test("pick() returns a member of the array", () => {
    const rng = new Rng(13);
    const arr = ["a", "b", "c"];
    for (let i = 0; i < 200; i++) {
      expect(arr).toContain(rng.pick(arr));
    }
  });

  test("pickWeighted() with all-zero weights falls back deterministically", () => {
    const rng = new Rng(17);
    const arr = ["a", "b", "c"];
    // zero total weight -> r = 0 -> first element wins
    expect(rng.pickWeighted(arr, () => 0)).toBe("a");
    expect(rng.pickWeighted(arr, () => 0)).toBe("a");
  });

  test("pickWeighted() only draws from positively-weighted items", () => {
    const rng = new Rng(19);
    const arr = ["a", "b", "c"];
    for (let i = 0; i < 500; i++) {
      // only "b" has a positive weight
      expect(rng.pickWeighted(arr, (x) => (x === "b" ? 2 : -1))).toBe("b");
    }
  });

  test("gauss() is roughly zero-mean", () => {
    const rng = new Rng(23);
    let sum = 0;
    const n = 20_000;
    for (let i = 0; i < n; i++) sum += rng.gauss();
    expect(Math.abs(sum / n)).toBeLessThan(0.05);
  });

  test("hashSeed() is deterministic", () => {
    expect(hashSeed("a", 1, "b")).toBe(hashSeed("a", 1, "b"));
  });

  test("hashSeed() distinguishes distinct inputs", () => {
    const a = hashSeed("league", "eng-man-city", 123);
    const b = hashSeed("league", "eng-man-city", 124);
    const c = hashSeed("league", "eng-arsenal", 123);
    expect(a).not.toBe(b);
    expect(a).not.toBe(c);
  });
});
