import { describe, expect, test } from "bun:test";
import {
  applySub,
  computeRatings,
  createMatch,
  finalStats,
  formationSlots,
  playerFitness,
  quickSim,
  roleFit,
  roleStrength,
  setMentality,
  stepMatch,
  tierStrength,
  type EnginePlayer,
  type EngineSide,
} from "../src/lib/game/engine";
import { buildEngineSideFromSquad, buildOpponentSide, createCareer } from "../src/lib/game/sim";
import { ATTR_KEYS, type PlayerAttrs } from "../src/lib/game/types";

/** A flat 37-attribute profile at `value` — a "neutral" player for tests. */
function baseAttrs(value: number): PlayerAttrs {
  return Object.fromEntries(ATTR_KEYS.map((k) => [k, value])) as PlayerAttrs;
}

function player(id: string, pos: EnginePlayer["pos"], attrs: Partial<EnginePlayer["attrs"]>): EnginePlayer {
  return {
    id,
    name: `P${id}`,
    pos,
    attrs: { ...baseAttrs(50), ...attrs },
    morale: 70,
    cond: 90,
    form: 7,
  };
}

function makeSide(): EngineSide {
  const xi = [
    { p: player("g1", "GK", { reflexes: 80, handling: 78, gkPositioning: 76 }), slot: "GK", role: "GK" as const },
    { p: player("d1", "DF", { tackling: 78, marking: 76, heading: 74 }), slot: "CB", role: "DF" as const },
    { p: player("d2", "DF", { tackling: 74, marking: 72 }), slot: "CB", role: "DF" as const },
    { p: player("m1", "MF", { passing: 76, vision: 72 }), slot: "CM", role: "MF" as const },
    { p: player("m2", "MF", { passing: 72 }), slot: "CM", role: "MF" as const },
    { p: player("f1", "FW", { finishing: 80 }), slot: "ST", role: "FW" as const },
  ];
  const bench = [{ p: player("f2", "FW", { finishing: 66 }), slot: "SUB", role: "FW" as const }];
  return {
    id: "home",
    name: "Home FC",
    short: "HOM",
    p1: "#fff",
    p2: "#000",
    xi,
    bench,
    tactics: { mentality: 50, pressing: 50, passing: 50, tempo: 50 },
    str: { att: 70, def: 70, mid: 70, gk: 70 },
    talk: 0,
  };
}

describe("roleFit", () => {
  test("perfect fit for natural position", () => {
    expect(roleFit("GK", "GK")).toBe(1);
    expect(roleFit("FW", "FW")).toBe(1);
  });

  test("out-of-position players are heavily penalised", () => {
    expect(roleFit("FW", "GK")).toBe(0.12);
    expect(roleFit("GK", "DF")).toBe(0.1);
  });

  test("adjacent positions fit partially", () => {
    expect(roleFit("DF", "MF")).toBe(0.7);
    expect(roleFit("MF", "FW")).toBe(0.8);
  });
});

describe("roleStrength", () => {
  test("higher attributes yield higher strength", () => {
    const strong = player("a", "FW", { finishing: 90, acceleration: 85, sprintSpeed: 85, dribbling: 80 });
    const weak = player("b", "FW", { finishing: 60, acceleration: 55, sprintSpeed: 55, dribbling: 50 });
    expect(roleStrength(strong, "FW")).toBeGreaterThan(roleStrength(weak, "FW"));
  });

  test("a goalkeeper is stronger in goal than outfield players are", () => {
    const gk = player("g", "GK", { reflexes: 82, handling: 80, gkPositioning: 78, tackling: 40, dribbling: 40, strength: 40 });
    const fw = player("f", "FW", { finishing: 82, reflexes: 40, tackling: 40, dribbling: 40, strength: 40 });
    expect(roleStrength(gk, "GK")).toBeGreaterThan(roleStrength(fw, "GK"));
  });
});

describe("playerFitness", () => {
  test("stays in a sane band", () => {
    const fresh = player("a", "MF", {});
    fresh.morale = 95;
    fresh.cond = 98;
    fresh.form = 8;
    const gassed = player("b", "MF", {});
    gassed.morale = 10;
    gassed.cond = 40;
    gassed.form = 5;
    expect(playerFitness(fresh)).toBeGreaterThan(playerFitness(gassed));
    expect(playerFitness(fresh)).toBeLessThan(1.1);
    expect(playerFitness(gassed)).toBeGreaterThan(0.6);
  });
});

// Drives the engine exactly the way MatchView does: step across the
// half-time boundary (pauses when the 46th minute is attempted), let the
// caller flip `half` and set the team talk, then step to full time (ends
// when the 91st minute is attempted).
function playFullMatch(m: ReturnType<typeof createMatch>): void {
  stepMatch(m, 46); // plays 1-45, pauses at the HT boundary
  expect(m.atHt).toBe(true);
  expect(m.minute).toBe(45);
  m.half = 2;
  stepMatch(m, 46); // plays 46-90
  stepMatch(m, 5); // 91st minute attempted -> full time
  expect(m.ended).toBe(true);
  expect(m.minute).toBe(90);
}

describe("match engine", () => {
  test("createMatch initialises state", () => {
    const m = createMatch(makeSide(), makeSide(), 123);
    expect(m.minute).toBe(0);
    expect(m.half).toBe(1);
    expect(m.ended).toBe(false);
    expect(m.atHt).toBe(false);
    expect(m.teams[0].onPitch).toHaveLength(m.home.xi.length);
    expect(m.teams[0].goals).toBe(0);
    expect(m.teams[1].goals).toBe(0);
  });

  test("a full match reaches full-time with consistent stats", () => {
    const m = createMatch(makeSide(), makeSide(), 456);
    playFullMatch(m);
    expect(m.events.some((e) => e.type === "ht")).toBe(true);
    expect(m.events.some((e) => e.type === "ft")).toBe(true);

    const [h, a] = finalStats(m);
    expect(h.possession + a.possession).toBe(100);
    expect(h.onTarget).toBeLessThanOrEqual(h.shots);
    expect(a.onTarget).toBeLessThanOrEqual(a.shots);
    expect(m.teams[0].goals).toBeGreaterThanOrEqual(0);
  });

  test("computeRatings covers every starter within [4, 10]", () => {
    const m = createMatch(makeSide(), makeSide(), 789);
    stepMatch(m, 45);
    m.half = 2;
    stepMatch(m, 45);
    const ratings = computeRatings(m);
    const allIds = [...m.home.xi, ...m.away.xi].map((s) => s.p.id);
    for (const id of allIds) {
      expect(ratings[id]).toBeDefined();
      expect(ratings[id]).toBeGreaterThanOrEqual(4);
      expect(ratings[id]).toBeLessThanOrEqual(10);
      expect(Math.round(ratings[id] * 10) / 10).toBe(ratings[id]); // one decimal
    }
  });

  test("applySub swaps a starter for a bench player, max 3", () => {
    const m = createMatch(makeSide(), makeSide(), 1);
    const outId = m.home.xi[1].p.id;
    const inId = m.home.bench[0].p.id;
    expect(applySub(m, 0, outId, inId)).toBe(true);
    expect(m.teams[0].subsUsed).toBe(1);
    expect(m.teams[0].onPitch.some((s) => s.p.id === inId)).toBe(true);
    expect(m.teams[0].onPitch.some((s) => s.p.id === outId)).toBe(false);

    // unknown player ids fail cleanly
    expect(applySub(m, 0, "nope", inId)).toBe(false);
    expect(applySub(m, 0, outId, "nope")).toBe(false);

    // 2 more subs OK, 4th refused
    const m2 = createMatch(makeSide(), makeSide(), 2);
    const b = m2.home.bench;
    expect(applySub(m2, 0, m2.home.xi[0].p.id, b[0].p.id)).toBe(true);
    expect(applySub(m2, 0, m2.home.xi[2].p.id, b[0].p.id)).toBe(true);
    expect(applySub(m2, 0, m2.home.xi[3].p.id, b[0].p.id)).toBe(true);
    expect(m2.teams[0].subsUsed).toBe(3);
    expect(applySub(m2, 0, m2.home.xi[4].p.id, b[0].p.id)).toBe(false);
  });

  test("setMentality clamps to [0, 100]", () => {
    const m = createMatch(makeSide(), makeSide(), 3);
    setMentality(m, 0, 999);
    expect(m.home.tactics.mentality).toBe(100);
    setMentality(m, 0, -5);
    expect(m.home.tactics.mentality).toBe(0);
  });
});

describe("quickSim", () => {
  test("is deterministic per seed", () => {
    const h = { att: 80, def: 75, mid: 78, gk: 76, mentality: 50 };
    const a = { att: 72, def: 70, mid: 71, gk: 69, mentality: 45 };
    expect(quickSim(h, a, 999)).toEqual(quickSim(h, a, 999));
  });

  test("produces non-negative, plausible scores", () => {
    const h = { att: 80, def: 75, mid: 78, gk: 76, mentality: 50 };
    const a = { att: 72, def: 70, mid: 71, gk: 69, mentality: 45 };
    const res = quickSim(h, a, 1234);
    expect(res.hg).toBeGreaterThanOrEqual(0);
    expect(res.ag).toBeGreaterThanOrEqual(0);
    expect(res.shotsH).toBeGreaterThanOrEqual(4);
    expect(res.shotsH).toBeLessThanOrEqual(18);
    expect(res.yellowsH).toBeGreaterThanOrEqual(0);
    expect(res.redsH).toBeGreaterThanOrEqual(0);
  });
});

describe("tierStrength & formations", () => {
  test("stronger tiers are stronger", () => {
    expect(tierStrength(1).att).toBeGreaterThan(tierStrength(3).att);
  });

  test("every formation has 11 slots", () => {
    for (const key of ["4-4-2", "4-3-3", "4-2-3-1", "3-5-2", "5-3-2", "4-5-1", "3-4-3"]) {
      expect(formationSlots(key)).toHaveLength(11);
    }
  });
});

describe("full stack: career -> engine sides -> match", () => {
  test("a user match against an AI opponent simulates end to end", () => {
    const save = createCareer({ seed: 2026, managerName: "Test Boss", managerNat: "eng", clubId: "eng-man-city" });
    const home = buildEngineSideFromSquad(save, save.squad, true, 42);
    const opp = save.league.fixtures[0].away === save.clubId ? save.league.fixtures[0].home : save.league.fixtures[0].away;
    const away = buildOpponentSide(save, opp, 42);

    expect(home.xi).toHaveLength(11);
    expect(away.xi).toHaveLength(11);

    const m = createMatch(home, away, 777);
    playFullMatch(m);

    const [hs, as] = finalStats(m);
    expect(hs.possession + as.possession).toBe(100);
    expect(hs.shots + as.shots).toBeGreaterThan(0);

    const ratings = computeRatings(m);
    for (const s of home.xi) {
      expect(ratings[s.p.id]).toBeDefined();
    }
  });
});

// --- contract guard: playFullMatch assumes the engine pauses at HT even
// when the step overshoots the 45-minute mark ---
test("engine pauses at half-time when a step crosses minute 45", () => {
  const m = createMatch(makeSide(), makeSide(), 12345);
  stepMatch(m, 60);
  expect(m.minute).toBe(45);
  expect(m.atHt).toBe(true);
  expect(m.half).toBe(1);
});
