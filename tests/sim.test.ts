import { describe, expect, test } from "bun:test";
import { formationSlots } from "../src/lib/game/engine";
import { Rng } from "../src/lib/game/rng";
import {
  acceptOffer,
  applyWeekly,
  autoPick,
  avgSquadOverall,
  buildEngineSideFromSquad,
  buyPlayer,
  computeOverall,
  createCareer,
  fixturesForLeague,
  interactPlayer,
  isUserMatchWeek,
  lastResults,
  LEAGUE_SIZE,
  nextEvent,
  playerValue,
  positionOf,
  promoteYouth,
  recordUserMatch,
  simulateWeek,
  standings,
  startNextSeason,
  transferListPlayer,
  upgradeStadium,
} from "../src/lib/game/sim";
import { leagueById, clubById, type Player } from "../src/lib/game/world";
import type { FinishedMatch } from "../src/lib/game/types";

const SEED = 2026;
const CLUB = "eng-man-city";

function career() {
  return createCareer({ seed: SEED, managerName: "Test Boss", managerNat: "eng", clubId: CLUB });
}

function all70(pos: Player["pos"]): Player {
  return {
    id: "x",
    first: "Test",
    last: "Player",
    age: 25,
    nat: "eng",
    pos,
    attrs: { gk: 70, def: 70, pas: 70, sho: 70, hea: 70, pac: 70, str: 70, tec: 70 },
    pot: 80,
    val: 0,
    wage: 0,
    contract: 100,
    morale: 70,
    cond: 90,
    form: [],
    injury: null,
    susp: 0,
    xp: 0,
  };
}

function makeMatch(save: ReturnType<typeof career>, hg: number, ag: number): FinishedMatch {
  const f = save.league.fixtures.find(
    (fx) => fx.round === 1 && (fx.home === save.clubId || fx.away === save.clubId),
  )!;
  const userHome = f.home === save.clubId;
  const pid = save.squad[0].id;
  return {
    id: "m-test",
    kind: "league",
    round: 1,
    week: 1,
    home: f.home,
    away: f.away,
    hg: userHome ? hg : ag,
    ag: userHome ? ag : hg,
    stats: [
      { possession: 55, shots: 10, onTarget: 4, corners: 3, fouls: 5, yellows: 1, reds: 0, xg: 1.2 },
      { possession: 45, shots: 8, onTarget: 3, corners: 2, fouls: 6, yellows: 1, reds: 0, xg: 0.9 },
    ],
    ratings: { [pid]: 8.4, [save.squad[1].id]: 7.1, [save.squad[2].id]: 6.5 },
    scorers: [{ playerId: pid, minute: 23 }],
    cards: [],
    injuries: [],
    subs: [],
    xi: save.squad.slice(0, 11).map((p) => p.id),
    homeTeam: clubById(f.home).name,
    awayTeam: clubById(f.away).name,
  };
}

describe("createCareer", () => {
  test("builds a complete save", () => {
    const save = career();
    expect(save.squad).toHaveLength(22); // 3 GK + 7 DF + 8 MF + 4 FW
    expect(save.youth).toHaveLength(12);
    expect(save.market).toHaveLength(90);
    expect(save.weeklyWage).toBeGreaterThan(0);
    expect(save.balance).toBeGreaterThan(0);
    expect(save.phase).toBe("league");
    expect(save.week).toBe(0);
    expect(save.league.rows).toHaveLength(LEAGUE_SIZE);
    expect(save.cup.alive).toHaveLength(LEAGUE_SIZE);
    expect(save.cup.rounds[0]).toHaveLength(4); // 8 clubs, 4 byes in round 1
    expect(save.tactics.formation).toBe("4-4-2");
  });

  test("is deterministic for a given seed", () => {
    const a = career();
    const b = career();
    expect(a.squad.map((p) => p.id)).toEqual(b.squad.map((p) => p.id));
    expect(a.weeklyWage).toBe(b.weeklyWage);
  });

  test("lineup fills every formation slot with a unique player", () => {
    const save = career();
    const labels = new Set(formationSlots("4-4-2").map((s) => s.slot));
    const entries = Object.entries(save.tactics.lineup);
    expect(entries).toHaveLength(labels.size);
    const ids = entries.map(([, id]) => id);
    expect(ids.every(Boolean)).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
    const gkSlot = formationSlots("4-4-2").find((s) => s.role === "GK")!.slot;
    const gk = save.squad.find((p) => p.id === save.tactics.lineup[gkSlot]);
    expect(gk?.pos).toBe("GK");
  });
});

describe("fixturesForLeague", () => {
  test("produces a complete double round-robin", () => {
    const save = career();
    const fx = save.league.fixtures;
    expect(fx).toHaveLength(132); // 22 rounds x 6 matches

    const perRound = new Map<number, number>();
    const perClub = new Map<string, number>();
    const pairs = new Map<string, number>();
    for (const f of fx) {
      perRound.set(f.round, (perRound.get(f.round) ?? 0) + 1);
      perClub.set(f.home, (perClub.get(f.home) ?? 0) + 1);
      perClub.set(f.away, (perClub.get(f.away) ?? 0) + 1);
      const key = [f.home, f.away].sort().join("|");
      pairs.set(key, (pairs.get(key) ?? 0) + 1);
    }
    for (let r = 1; r <= 22; r++) expect(perRound.get(r)).toBe(6);
    for (const count of perClub.values()) expect(count).toBe(22);
    for (const count of pairs.values()) expect(count).toBe(2); // home & away legs
  });
});

describe("player valuation", () => {
  test("computeOverall: all-70 attributes are a 70-rated player", () => {
    for (const pos of ["GK", "DF", "MF", "FW"] as const) {
      expect(computeOverall(all70(pos))).toBe(70);
    }
  });

  test("young players are worth more than ageing ones", () => {
    expect(playerValue(70, 21)).toBeGreaterThan(playerValue(70, 33));
    expect(playerValue(70, 27)).toBeGreaterThan(playerValue(70, 34));
  });

  test("better players are worth more", () => {
    expect(playerValue(80, 27)).toBeGreaterThan(playerValue(60, 27));
  });

  test("values are non-negative", () => {
    expect(playerValue(48, 30)).toBe(0);
    expect(playerValue(55, 34)).toBeGreaterThanOrEqual(0);
  });
});

describe("autoPick & the lineup contract", () => {
  test("autoPick fills every formation slot label with a unique player", () => {
    const save = career();
    for (const formation of ["4-4-2", "4-3-3", "4-2-3-1", "3-5-2", "4-5-1", "3-4-3"]) {
      const slots = formationSlots(formation);
      const labels = new Set(slots.map((s) => s.slot));
      const lineup = autoPick(save.squad, formation);
      const entries = Object.entries(lineup);
      expect(entries).toHaveLength(labels.size);
      const ids = entries.map(([, id]) => id);
      expect(ids.every(Boolean)).toBe(true);
      expect(new Set(ids).size).toBe(ids.length);
      const gkSlot = slots.find((s) => s.role === "GK")!.slot;
      expect(save.squad.find((p) => p.id === lineup[gkSlot])?.pos).toBe("GK");
    }
  });

  test("buildEngineSideFromSquad fields a full 11-player XI for every formation", () => {
    const save = career();
    for (const formation of ["4-4-2", "4-3-3", "4-2-3-1", "3-5-2", "5-3-2", "4-5-1", "3-4-3"]) {
      save.tactics.formation = formation;
      save.tactics.lineup = autoPick(save.squad, formation);
      const side = buildEngineSideFromSquad(save, save.squad, true, 7);
      expect(side.xi).toHaveLength(11);
      const ids = side.xi.map((s) => s.p.id);
      expect(new Set(ids).size).toBe(11);
      expect(side.xi.filter((s) => s.role === "GK")).toHaveLength(1);
    }
  });
});

describe("weekly flow", () => {
  test("nextEvent: week 0 is a league match in round 1", () => {
    const save = career();
    const ev = nextEvent(save);
    expect(ev.type).toBe("league");
    expect(ev.round).toBe(1);
    expect(ev.week).toBe(1);
    expect(isUserMatchWeek(save)).toBe(true);
  });

  test("simulateWeek blocks on a user match week", () => {
    const save = career();
    const res = simulateWeek(save);
    expect(res.advanced).toBe(false);
    expect(res.reason).toBe("user_match");
    expect(save.week).toBe(0);
  });

  test("applyWeekly applies finances without advancing the week", () => {
    const save = career();
    const before = save.balance;
    const wages = save.weeklyWage;
    applyWeekly(save, new Rng(1));
    expect(save.balance).toBe(before + save.sponsor.weekly - wages);
    expect(save.week).toBe(0);
    expect(save.news[0].kind).toBe("result");
  });

  test("simulateWeek runs the season end after week 26", () => {
    const save = career();
    save.week = 26;
    const res = simulateWeek(save);
    expect(res.advanced).toBe(true);
    expect(save.week).toBe(27);
    expect(save.phase).toBe("season_end");
    expect(save.history).toHaveLength(1);
    expect(save.history[0].season).toBe(1);
    expect(save.financeLog[0].note).toContain("Prize money");
  });

  test("recordUserMatch updates the table, form, and flags", () => {
    const save = career();
    const ptsBefore = save.league.rows.find((r) => r.clubId === save.clubId)!.pts;
    const m = makeMatch(save, 2, 1);
    recordUserMatch(save, m);

    expect(save.lastMatch).toBe(m);
    const myRow = save.league.rows.find((r) => r.clubId === save.clubId)!;
    expect(myRow.p).toBe(1);
    expect(myRow.pts).toBe(ptsBefore + 3);

    const fx = save.league.fixtures.find((f) => f.round === 1 && f.home === m.home && f.away === m.away)!;
    expect(fx.played).toBe(true);
    expect(fx.hg).toBe(m.hg);
    expect(fx.ag).toBe(m.ag);

    expect(String(save.flags.lastResults ?? "")).toContain("W");
    for (const pid of Object.keys(m.ratings)) {
      const p = save.squad.find((p) => p.id === pid);
      expect(p?.form).toHaveLength(1);
    }
    expect(save.news[0].kind).toBe("match");
  });
});

describe("transfers", () => {
  test("buyPlayer adds the player and removes them from the market", () => {
    const save = career();
    const cheapest = [...save.market].sort((a, b) => a.asking - b.asking)[0];
    const before = save.balance;
    const res = buyPlayer(save, cheapest.id);
    expect(res.ok).toBe(true);
    expect(save.squad).toHaveLength(23);
    expect(save.market).toHaveLength(89);
    expect(save.balance).toBe(before - cheapest.asking);
    // second buy of the same id fails
    expect(buyPlayer(save, cheapest.id).error).toContain("not found");
  });

  test("buyPlayer refuses when the squad is full", () => {
    const save = career();
    const cheapest = [...save.market].sort((a, b) => a.asking - b.asking);
    for (let i = 0; i < 6; i++) {
      const res = buyPlayer(save, cheapest[i].id);
      expect(res.ok).toBe(true);
    }
    expect(save.squad).toHaveLength(28);
    expect(buyPlayer(save, cheapest[6].id).error).toContain("Squad is full");
  });

  test("acceptOffer sells the player and pays the fee", () => {
    const save = career();
    const pid = save.squad[0].id;
    transferListPlayer(save, pid, 1_000_000);
    save.offers[pid] = [{ id: "ofr-test", from: "ARS", amount: 2_000_000, weeklyWage: 10_000 }];
    const before = save.balance;
    const res = acceptOffer(save, pid, "ofr-test");
    expect(res.ok).toBe(true);
    expect(save.squad).toHaveLength(21);
    expect(save.balance).toBe(before + 2_000_000);
    expect(save.flags.soldCount).toBe(1);
    expect(save.listed[pid]).toBeUndefined();
    expect(acceptOffer(save, pid, "ofr-test").error).toContain("no longer available");
  });
});

describe("stadium, youth, interactions", () => {
  test("upgradeStadium raises capacity and deducts cost", () => {
    const save = career();
    const before = save.balance;
    const res = upgradeStadium(save);
    expect(res.ok).toBe(true);
    expect(save.stadium.level).toBe(2);
    expect(save.stadium.capacity).toBe(32000);
    expect(save.balance).toBe(before - 15_000_000);
  });

  test("promoteYouth moves an eligible academy player into the squad", () => {
    const save = career();
    const youth = save.youth.find((y) => y.age >= 16)!;
    expect(youth).toBeDefined();
    const res = promoteYouth(save, youth.id);
    expect(res.ok).toBe(true);
    expect(save.squad).toHaveLength(23);
    expect(save.youth.some((y) => y.id === youth.id)).toBe(false);
    expect(save.flags.promotedYouth).toBeGreaterThanOrEqual(1);
  });

  test("interactPlayer applies morale changes once per week", () => {
    const save = career();
    const p = save.squad[0];
    const before = p.morale;
    expect(interactPlayer(save, p.id, "praise").ok).toBe(true);
    expect(p.morale).toBeGreaterThan(before);
    expect(interactPlayer(save, p.id, "praise").error).toContain("already been spoken to");
  });
});

describe("season & tables", () => {
  test("startNextSeason resets fixtures and ages the squad", () => {
    const save = career();
    const ages = save.squad.map((p) => p.age);
    startNextSeason(save);
    expect(save.season).toBe(2);
    expect(save.week).toBe(0);
    expect(save.phase).toBe("league");
    expect(save.label).toBe("2026/27");
    expect(save.squad.map((p, i) => p.age)).toEqual(ages.map((a) => a + 1));
    expect(save.league.fixtures).toHaveLength(132);
    expect(save.cup.nextRound).toBe(1);
    expect(save.cup.done).toBe(false);
  });

  test("standings and positionOf agree", () => {
    const save = career();
    const rows = save.league.rows;
    rows[0].pts = 30;
    rows[1].pts = 25;
    expect(standings(save)[0].clubId).toBe(rows[0].clubId);
    expect(positionOf(save)).toBeGreaterThanOrEqual(1);
    expect(positionOf(save)).toBeLessThanOrEqual(LEAGUE_SIZE);
  });

  test("helpers return sane values", () => {
    const save = career();
    expect(avgSquadOverall(save)).toBeGreaterThan(50);
    expect(avgSquadOverall(save)).toBeLessThanOrEqual(99);
    expect(lastResults(save)).toEqual([]);
    expect(save.league.rows.every((r) => r.p === 0)).toBe(true);
    expect(leagueById("eng").name).toBe("Premier League");
    expect(clubById("eng-arsenal").short).toBe("ARS");
  });
});
