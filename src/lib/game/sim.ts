// Core single-player game logic. Pure TS so the Convex backend runs it; the
// client uses selected pieces (auto-pick, engine-side building, next event).

import { formationSlots, quickSim, roleStrength, type EngineSide, type EngineSlot } from "./engine";
import { hashSeed, Rng } from "./rng";
import type {
  CupFixture,
  CupState,
  FinanceLogEntry,
  FinishedMatch,
  FocusKey,
  LeagueFixture,
  LeagueRow,
  MarketPlayer,
  MatchEvent,
  NextEvent,
  Player,
  PlayerAttrs,
  Pos,
  SaveData,
  ScoutKind,
  ScoutMission,
  Tactics,
  TransferOffer,
  YouthPlayer,
} from "./types";
import { ATTR_KEYS, POS_ORDER } from "./types";
import { clubById, countryById, leagueById, NAME_POOLS, ALL_COUNTRIES, SEASON_START_YEAR, starsFor, type ClubDef } from "./world";

/**
 * Resolve a club's display identity. Custom clubs keep the internal league
 * slot (fixtures, table, cup draw) but override name/colours/stadium/nation.
 */
export function clubDefOf(save: SaveData, clubId: string): ClubDef {
  const c = save.customClub;
  if (c && clubId === save.clubId) {
    const league = leagueOf(save.clubId);
    return {
      id: clubId,
      name: c.name,
      short: c.short,
      league: league.id,
      country: c.country,
      p1: c.p1,
      p2: c.p2,
      stadium: c.stadium,
      tier: c.tier,
    };
  }
  return clubById(clubId);
}

/** The league a club actually plays in (clubs are keyed by club id). */
export function leagueOf(clubId: string): import("./world").LeagueDef {
  return leagueById(clubById(clubId).league);
}

export const LEAGUE_SIZE = 16;
export const TOTAL_ROUNDS = (LEAGUE_SIZE - 1) * 2; // 30 rounds (double round-robin)
// 34 weeks: 30 league rounds + 4 cup rounds, interspersed with rest weeks
export const SEASON_WEEKS = 34;

// week (1-34) -> league round (0 = cup/rest week)
// 30 league rounds spread across 34 weeks with 4 cup breaks
export const LEAGUE_ROUND_AT_WEEK: number[] = [
  1, 2, 3, 0, 4, 5, 6, 7, 8, 0, 9, 10, 11, 12, 13, 14, 0, 15, 16, 17, 18, 19, 20, 0, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30,
];
// week (1-34) -> cup round (0 = no cup)
export const CUP_ROUND_AT_WEEK: number[] = [
  0, 0, 0, 1, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
];

export const CUP_ROUND_NAMES = ["First round", "Quarter-final", "Semi-final", "Final"];
export const CUP_ROUND_SHORT = ["R1", "QF", "SF", "F"];

export const STADIUM_LEVELS = [
  { capacity: 18000, ticket: 25, cost: 0, name: "Compact Arena" },
  { capacity: 32000, ticket: 32, cost: 12_000_000, name: "Community Stadium" },
  { capacity: 48000, ticket: 40, cost: 35_000_000, name: "City Stadium" },
  { capacity: 68000, ticket: 48, cost: 75_000_000, name: "Grand Stadium" },
  { capacity: 90000, ticket: 55, cost: 140_000_000, name: "National Stadium" },
  { capacity: 120000, ticket: 65, cost: 230_000_000, name: "Colossal Arena" },
];

export const SPONSOR_LEVELS = [
  { weekly: 150_000, cost: 0, name: "Local Partner" },
  { weekly: 300_000, cost: 2_000_000, name: "Regional Brand" },
  { weekly: 600_000, cost: 6_000_000, name: "National Brand" },
  { weekly: 1_100_000, cost: 15_000_000, name: "Continental Brand" },
  { weekly: 1_800_000, cost: 30_000_000, name: "Global Giant" },
];

export const PRIZE_MONEY = [8_000_000, 5_500_000, 4_000_000, 3_200_000, 2_600_000, 2_200_000, 1_900_000, 1_600_000, 1_400_000, 1_200_000, 1_050_000, 900_000, 800_000, 700_000, 600_000, 500_000];

// League wealth multiplier on prize money (richer leagues pay out more).
const LEAGUE_WEALTH: Record<string, number> = {
  eng: 2.0, esp: 1.9, ita: 1.8, ger: 1.8, fra: 1.6, sau: 1.5, usa: 1.3, jpn: 1.2,
  por: 1.1, ned: 1.1, bel: 1.0, tur: 1.0, bra: 1.0, arg: 0.9, mex: 0.9, sui: 0.9,
  aut: 0.85, cze: 0.85, ukr: 0.8, swe: 0.8, den: 0.8, nor: 0.75, rou: 0.75, hun: 0.7,
  cro: 0.7, gre: 0.7, pol: 0.7, sco: 0.7, qat: 1.1, uae: 1.0, egy: 0.6, irn: 0.5,
};
export const CUP_PRIZE = 1_500_000;

// Scouting: duration (weeks) -> cost. Faster reports cost more.
export const SCOUT_DURATIONS = [1, 2, 3] as const;
export const SCOUT_COSTS: Record<(typeof SCOUT_DURATIONS)[number], number> = {
  1: 50_000,
  2: 30_000,
  3: 20_000,
};
export const MAX_ACTIVE_SCOUTS = 3;

const TIER_OVR = [86, 81, 77, 73];
// Realistic budgets: Tier 1 = elite (€120M+), Tier 2 = strong (€40-80M), Tier 3 = mid (€15-30M), Tier 4 = small (€5-15M)
const TIER_BUDGET = [120_000_000, 50_000_000, 20_000_000, 8_000_000];
// Realistic attendance: Tier 1 = 50-70k, Tier 2 = 30-45k, Tier 3 = 15-25k, Tier 4 = 8-15k
const TIER_POPULARITY = [62000, 38000, 20000, 12000];

export const FOCUS_ATTRS: Record<FocusKey, (keyof PlayerAttrs)[]> = {
  attack: ["finishing", "longShots", "dribbling", "ballControl", "firstTouch", "crossing"],
  defense: ["tackling", "marking", "heading", "positioning", "concentration"],
  fitness: ["acceleration", "sprintSpeed", "stamina", "strength", "agility", "balance", "jumping"],
  shooting: ["finishing", "longShots", "penalties", "composure"],
  passing: ["passing", "shortPassing", "longPassing", "vision", "firstTouch"],
  goalkeeping: ["reflexes", "handling", "gkPositioning", "oneOnOne", "kicking", "throwing", "aerialAbility", "communication"],
  balanced: ["finishing", "tackling", "passing", "acceleration", "stamina", "dribbling", "heading", "strength"],
};

export const FOCUS_LABELS: Record<FocusKey, string> = {
  attack: "Attacking",
  defense: "Defending",
  fitness: "Fitness",
  shooting: "Shooting",
  passing: "Passing",
  goalkeeping: "Goalkeeping",
  balanced: "Balanced",
};

// ---------------------------------------------------------------------------
// Attribute / value helpers
// ---------------------------------------------------------------------------

export function roleWeights(pos: Pos): Partial<Record<keyof PlayerAttrs, number>> {
  switch (pos) {
    case "GK":
      return {
        reflexes: 0.18, handling: 0.15, gkPositioning: 0.15, oneOnOne: 0.1,
        aerialAbility: 0.08, communication: 0.06, kicking: 0.05, throwing: 0.03,
        positioning: 0.05, decisions: 0.03, composure: 0.03, concentration: 0.03,
        agility: 0.02, balance: 0.02, jumping: 0.02,
      };
    case "DF":
      return {
        tackling: 0.16, marking: 0.14, heading: 0.1, positioning: 0.1,
        strength: 0.08, acceleration: 0.06, sprintSpeed: 0.05, jumping: 0.05,
        composure: 0.05, concentration: 0.05, bravery: 0.04, teamwork: 0.04,
        decisions: 0.03, anticipation: 0.03, workRate: 0.02,
      };
    case "MF":
      return {
        passing: 0.1, shortPassing: 0.09, vision: 0.09, decisions: 0.07,
        composure: 0.06, ballControl: 0.06, firstTouch: 0.05, dribbling: 0.05,
        tackling: 0.05, teamwork: 0.05, stamina: 0.05, workRate: 0.05,
        positioning: 0.04, anticipation: 0.04, determination: 0.04,
        longPassing: 0.03, crossing: 0.03, aggression: 0.02, strength: 0.03,
      };
    default:
      return {
        finishing: 0.16, composure: 0.09, dribbling: 0.08, acceleration: 0.08,
        sprintSpeed: 0.07, firstTouch: 0.06, ballControl: 0.06, heading: 0.06,
        positioning: 0.05, decisions: 0.05, longShots: 0.05, balance: 0.04,
        agility: 0.04, penalties: 0.03, determination: 0.03, stamina: 0.03,
        strength: 0.02,
      };
  }
}

export function computeOverall(p: { attrs: PlayerAttrs; pos: Pos }, pos?: Pos): number {
  const w = roleWeights(pos ?? p.pos);
  let s = 0;
  let tw = 0;
  for (const k of ATTR_KEYS) {
    s += p.attrs[k] * (w[k] ?? 0);
    tw += w[k] ?? 0;
  }
  return Math.round(s / (tw || 1));
}

export function playerValue(ovr: number, age: number): number {
  const base = Math.pow(Math.max(0, ovr - 48), 3) * 1500;
  const ageF = age < 23 ? 1.25 : age <= 27 ? 1.1 : age <= 30 ? 0.85 : age <= 32 ? 0.6 : age <= 34 ? 0.35 : 0.2;
  return Math.round(base * ageF / 10000) * 10000;
}

export function marketAsking(p: { ovr: number; age: number; pot?: number; pos: Pos }): number {
  // Deterministic, information-based asking price: base value, then a
  // premium for young players with real potential and a premium/discount by
  // position (forwards cost more, keepers and defenders less).
  let v = playerValue(p.ovr, p.age);
  const young = p.age <= 22;
  if (young && p.pot && p.pot > p.ovr + 3) v *= 1.3;
  if (p.age >= 30) v *= p.age >= 33 ? 0.7 : 0.85;
  if (p.pos === "FW") v *= 1.08;
  else if (p.pos === "GK") v *= 0.92;
  else if (p.pos === "DF") v *= 0.95;
  return Math.round(v / 100_000) * 100_000;
}

export function wageFor(ovr: number): number {
  // Realistic weekly wages in EUR:
  // OVR 48-55: €3K-8K (squad depth)
  // OVR 56-65: €8K-20K (regular starters)
  // OVR 66-75: €20K-50K (key players)
  // OVR 76-85: €50K-120K (stars)
  // OVR 86+: €120K-250K (elite)
  const base = Math.pow(Math.max(0, ovr - 42), 2.8) * 1.8;
  return Math.max(3000, Math.round(base / 500) * 500);
}

export function avgForm(p: Player): number {
  if (!p.form.length) return 7;
  return p.form.reduce((a, b) => a + b, 0) / p.form.length;
}

export function playerName(p: { first: string; last: string }): string {
  return p.last ? `${p.first} ${p.last}` : p.first;
}

export function sortSquad(squad: Player[]): Player[] {
  return squad.slice().sort((a, b) => {
    if (a.pos !== b.pos) return POS_ORDER.indexOf(a.pos) - POS_ORDER.indexOf(b.pos);
    return computeOverall(b) - computeOverall(a);
  });
}

// ---------------------------------------------------------------------------
// Generation
// ---------------------------------------------------------------------------

const ROLE_BONUS: Record<Pos, Partial<Record<keyof PlayerAttrs, number>>> = {
  GK: {
    reflexes: 14, handling: 12, gkPositioning: 12, oneOnOne: 8, aerialAbility: 7,
    communication: 6, kicking: 5, throwing: 4, positioning: 3, composure: 2,
    decisions: 2, jumping: 3, strength: 3, agility: 2, balance: 2, stamina: 1,
    tackling: 3, marking: 4, heading: 1, teamwork: 2, workRate: 1, bravery: 1,
    leadership: 2, determination: 2, fitness: 2,
    acceleration: -4, sprintSpeed: -4, finishing: -40, longShots: -25,
    dribbling: -18, ballControl: -8, firstTouch: -6, crossing: -15,
    passing: -8, shortPassing: -6, longPassing: -8, vision: -6,
    freeKicks: -10, penalties: -15, corners: -12, aggression: -4,
  },
  DF: {
    tackling: 12, marking: 12, heading: 6, positioning: 8, strength: 6,
    jumping: 5, concentration: 5, composure: 3, bravery: 4, aggression: 3,
    decisions: 2, anticipation: 3, teamwork: 2, workRate: 2, leadership: 2,
    acceleration: 3, sprintSpeed: 3, stamina: 3, fitness: 2,
    finishing: -12, longShots: -6, dribbling: -6, ballControl: -3,
    firstTouch: -3, crossing: -3, passing: -2, shortPassing: -2,
    longPassing: -2, vision: -5, freeKicks: -8, penalties: -10, corners: -5,
    reflexes: -35, handling: -35, gkPositioning: -35, oneOnOne: -35,
    kicking: -35, throwing: -35, aerialAbility: -35, communication: -35,
  },
  MF: {
    passing: 10, shortPassing: 8, longPassing: 6, vision: 8, ballControl: 6,
    firstTouch: 6, dribbling: 5, decisions: 4, teamwork: 4, stamina: 4,
    workRate: 3, tackling: 2, positioning: 3, composure: 3, crossing: 2,
    freeKicks: 2, anticipation: 2, determination: 2, aggression: 1,
    balance: 2, agility: 2, acceleration: 2, sprintSpeed: 2, strength: 2,
    leadership: 1, longShots: 1, fitness: 2, heading: -3, finishing: -2,
    penalties: -2,
    reflexes: -35, handling: -35, gkPositioning: -35, oneOnOne: -35,
    kicking: -35, throwing: -35, aerialAbility: -35, communication: -35,
  },
  FW: {
    finishing: 11, longShots: 6, dribbling: 7, acceleration: 7, sprintSpeed: 7,
    firstTouch: 5, ballControl: 5, heading: 4, positioning: 5, composure: 3,
    balance: 3, agility: 3, penalties: 4, freeKicks: 2, determination: 2,
    stamina: 2, strength: 2, fitness: 1, vision: 1,
    tackling: -10, marking: -8, crossing: -4, shortPassing: -4, longPassing: -6,
    passing: -4, teamwork: -1, workRate: -1,
    reflexes: -35, handling: -35, gkPositioning: -35, oneOnOne: -35,
    kicking: -35, throwing: -35, aerialAbility: -35, communication: -35,
  },
};

function makeAttrs(rng: Rng, target: number, pos: Pos): PlayerAttrs {
  const attrs = {} as PlayerAttrs;
  for (const k of ATTR_KEYS) {
    const bonus = ROLE_BONUS[pos][k] ?? 0;
    attrs[k] = Math.max(1, Math.min(99, Math.round(target + bonus + rng.gauss() * 4.5)));
  }
  return attrs;
}

function makeName(rng: Rng, nat: string): { first: string; last: string } {
  const pool = NAME_POOLS[nat] ?? NAME_POOLS.eng;
  const first = rng.pick(pool.f);
  const last = rng.chance(0.3) ? pool.l[Math.min(pool.l.length - 1, rng.int(0, pool.l.length - 1))] : rng.pick(pool.l);
  return { first, last: last === first ? "" : last };
}

export function generatePlayer(
  rng: Rng,
  nat: string,
  pos: Pos,
  target: number,
  age: number,
  opts?: { pot?: number; star?: boolean; first?: string; last?: string },
): Player {
  const attrs = makeAttrs(rng, target, pos);
  const p: Player = {
    id: `${pos}-${Math.abs(hashSeed(nat, target, age, rng.next(), opts?.first ?? ""))}`,
    first: opts?.first ?? makeName(rng, nat).first,
    last: opts?.last ?? "",
    age,
    nat,
    pos,
    attrs,
    pot: opts?.pot ?? Math.min(99, target + rng.int(2, 10)),
    val: 0,
    wage: 0,
    contract: rng.int(80, 200),
    morale: rng.int(58, 82),
    cond: rng.int(88, 100),
    form: [],
    injury: null,
    susp: 0,
    xp: 0,
    star: opts?.star,
  };
  if (!opts?.first && !opts?.last) {
    const n = makeName(rng, nat);
    p.first = n.first;
    p.last = n.last;
  }
  const ovr = computeOverall(p);
  p.val = playerValue(ovr, p.age);
  p.wage = wageFor(ovr);
  return p;
}

// Nationalities for a few marquee stars whose nation differs from club country
const STAR_NATS: Record<string, string> = {
  "Erling Haaland": "nor",
  "Rodri ": "esp",
  "Mohamed Salah": "egy",
  "Virgil van Dijk": "ned",
  "Alisson Becker": "bra",
  "Martin Odegaard": "nor",
  "Dominik Szoboszlai": "hun",
  "Son Heung-min": "kor",
  "Thibaut Courtois": "bel",
  "Federico Valverde": "uru",
  "Vinicius Junior": "bra",
  "Rodrygo Goes": "bra",
  "Eduardo Camavinga": "fra",
  "Jude Bellingham": "eng",
  "Robert Lewandowski": "pol",
  "Marc-Andre ter Stegen": "ger",
  "Lamine Yamal": "esp",
  "Ronald Araujo": "uru",
  "Lautaro Martinez": "arg",
  "Marcus Thuram": "fra",
  "Rafael Leao": "por",
  "Mike Maignan": "fra",
  "Theo Hernandez": "fra",
  "Christian Pulisic": "usa",
  "Khvicha Kvaratskhelia": "ukr",
  "Victor Osimhen": "nig",
  "Harry Kane": "eng",
  "Jeremie Frimpong": "ned",
  "Lukas Hradecky": "cze",
  "Granit Xhaka": "sui",
  "Achraf Hakimi": "mar",
  "Gianluigi Donnarumma": "ita",
  "Angel Di Maria": "arg",
  "Nicolas Otamendi": "arg",
  "Viktor Gyokeres": "swe",
  "Luuk de Jong": "ned",
  "Mauro Icardi": "arg",
  "Dries Mertens": "bel",
  "Fernando Muslera": "uru",
  "Dusan Tadic": "srb",
  "Fred Rodrigues": "bra",
  "Ciro Immobile": "ita",
  "Edinson Cavani": "uru",
  "Lionel Messi": "arg",
  "Luis Suarez": "uru",
  "Sergio Busquets": "esp",
  "Jordi Alba": "esp",
  "Giorgian De Arrascaeta": "uru",
  "Pedro Guilherme": "bra",
  "Agustin Rossi": "arg",
  "Andre-Pierre Gignac": "fra",
  "Sergio Canales": "esp",
  "Estevao Willian": "bra",
};

function starNat(clubId: string, first: string, last: string): string {
  const key = `${first} ${last}`.trim();
  const club = clubById(clubId);
  return STAR_NATS[key] ?? club.country;
}

export function generateClubSquad(clubId: string, season: number, seed: number, opts?: { country?: string; tier?: number }): Player[] {
  const rng = new Rng(hashSeed("squad", clubId, season, seed));
  const club = clubById(clubId);
  const nat = opts?.country ?? club.country;
  const tier = opts?.tier ?? club.tier;
  const target = TIER_OVR[Math.max(0, Math.min(3, tier - 1))];
  const stars = starsFor(clubId);
  const players: Player[] = [];
  const usedNames = new Set<string>();

  const starQueue = [...stars].sort(() => 0); // keep order
  const takeStar = (pos: Pos): Player | null => {
    const idx = starQueue.findIndex((s) => s.pos === pos);
    if (idx < 0) return null;
    const s = starQueue[idx];
    starQueue.splice(idx, 1);
    const attrs = makeAttrs(rng, s.ovr, pos);
    const p: Player = {
      id: `star-${s.first}-${s.last}-${pos}`.toLowerCase().replace(/\s+/g, "-"),
      first: s.first,
      last: s.last,
      age: s.age,
      nat: starNat(clubId, s.first, s.last),
      pos,
      attrs,
      pot: Math.min(99, s.ovr + 2),
      val: playerValue(s.ovr, s.age),
      wage: wageFor(s.ovr),
      contract: rng.int(80, 200),
      morale: rng.int(60, 85),
      cond: rng.int(90, 100),
      form: [],
      injury: null,
      susp: 0,
      xp: 0,
      star: true,
    };
    usedNames.add(playerName(p));
    return p;
  };

  const counts: [Pos, number][] = [["GK", 3], ["DF", 7], ["MF", 8], ["FW", 4]];
  for (const [pos, count] of counts) {
    for (let i = 0; i < count; i++) {
      const star = takeStar(pos);
      if (star) {
        players.push(star);
        continue;
      }
      const young = rng.chance(0.38);
      const age = young
        ? pos === "GK"
          ? rng.int(17, 22)
          : rng.int(17, 21)
        : rng.int(pos === "GK" ? 22 : 20, pos === "GK" ? 35 : 33);
      const ageFactor = age <= 21 ? -6 : age <= 24 ? -3 : age <= 28 ? 0 : age <= 31 ? 2 : 4;
      const ovr = Math.max(48, Math.min(96, target + ageFactor + rng.int(-2, 2)));
      const p = generatePlayer(rng, nat, pos, ovr, age, { pot: young ? Math.min(99, ovr + rng.int(6, 16)) : undefined });
      if (usedNames.has(playerName(p))) {
        const n = makeName(rng, nat);
        p.first = n.first;
        p.last = n.last;
      }
      usedNames.add(playerName(p));
      players.push(p);
    }
  }
  return players;
}

export function generateYouthSquad(clubId: string, season: number, seed: number, opts?: { country?: string; academy?: number }): YouthPlayer[] {
  const rng = new Rng(hashSeed("youth", clubId, season, seed));
  const club = clubById(clubId);
  const nat = opts?.country ?? club.country;
  const academy = Math.max(1, Math.min(3, opts?.academy ?? 1));
  const out: YouthPlayer[] = [];
  for (let i = 0; i < 12; i++) {
    const pos = rng.pick(["GK", "DF", "DF", "MF", "MF", "MF", "FW", "FW"] as Pos[]);
    const age = rng.int(15, 17);
    const target = Math.min(68, rng.int(48, 60) + (pos === "FW" ? 2 : 0) + (academy - 1) * 3);
    const p = generatePlayer(rng, nat, pos, target, age, { pot: Math.min(99, target + rng.int(14, 26)) });
    out.push({
      id: `youth-${i}-${clubId}`,
      first: p.first,
      last: p.last,
      age,
      nat: p.nat,
      pos,
      attrs: p.attrs,
      pot: p.pot,
      morale: rng.int(55, 85),
      cond: rng.int(85, 100),
      xp: 0,
      sinceWeek: 0,
      name: playerName(p),
    });
  }
  return out;
}

export function generateMarket(rng: Rng): MarketPlayer[] {
  const out: MarketPlayer[] = [];
  for (let i = 0; i < 90; i++) {
    const nat = rng.pickWeighted(ALL_COUNTRIES, (c) => (c.id === "eng" || c.id === "esp" || c.id === "ita" || c.id === "ger" || c.id === "fra" || c.id === "bra" || c.id === "arg" ? 4 : 1));
    const pos = rng.pick(["GK", "DF", "DF", "MF", "MF", "FW"] as Pos[]);
    const age = rng.int(17, 34);
    const young = age <= 22;
    const target = Math.max(50, Math.min(94, Math.round(68 + rng.gauss() * 9 + (young ? -3 : 3) + rng.range(-4, 4))));
    const p = generatePlayer(rng, nat.id, pos, target, age, { pot: young ? Math.min(99, target + rng.int(5, 16)) : Math.min(99, target + 2) });
    const ovr = computeOverall(p);
    out.push({
      id: `mkt-${i}`,
      first: p.first,
      last: p.last,
      age,
      nat: nat.id,
      pos,
      attrs: p.attrs,
      pot: p.pot,
      ovr,
      val: p.val,
      wage: wageFor(ovr),
      asking: marketAsking({ ovr, age, pot: p.pot, pos }),
      morale: rng.int(50, 85),
      form: Math.round(rng.range(5.5, 8.6) * 10) / 10,
      known: false,
    });
  }
  return out;
}

// ---------------------------------------------------------------------------
// League fixtures (circle method) & cup
// ---------------------------------------------------------------------------

export function fixturesForLeague(save: SaveData): LeagueFixture[] {
  const clubs = leagueOf(save.clubId).clubs.map((c) => c.id);
  const rng = new Rng(hashSeed("fixtures", save.clubId, save.seed));
  const fixtures: LeagueFixture[] = [];
  const n = clubs.length;
  const arr = clubs.slice(1);
  for (let round = 1; round <= n - 1; round++) {
    const pairs: [string, string][] = [[clubs[0], arr[0]]];
    for (let i = 1; i < n / 2; i++) {
      pairs.push([arr[i], arr[n - 1 - i]]);
    }
    let homeFirst = rng.chance(0.5);
    for (const [a, b] of pairs) {
      fixtures.push({ round, home: homeFirst ? a : b, away: homeFirst ? b : a, played: false });
      homeFirst = !homeFirst;
    }
    arr.push(arr.shift()!);
  }
  const firstHalf = fixtures.slice(0, (n / 2) * (n - 1));
  for (const f of firstHalf) {
    fixtures.push({ round: f.round + (n - 1), home: f.away, away: f.home, played: false });
  }
  return fixtures;
}

export function drawCupFirstRound(rng: Rng, clubs: string[]): { byes: string[]; fixtures: CupFixture[] } {
  const shuffled = rng.shuffle(clubs);
  const byes = shuffled.slice(0, 4);
  const rest = shuffled.slice(4);
  const fixtures: CupFixture[] = [];
  for (let i = 0; i < rest.length; i += 2) {
    const homeFirst = rng.chance(0.5);
    fixtures.push({ round: 1, home: homeFirst ? rest[i] : rest[i + 1], away: homeFirst ? rest[i + 1] : rest[i], played: false });
  }
  return { byes, fixtures };
}

export function drawCupNextRound(rng: Rng, winners: string[], round: number): CupFixture[] {
  const shuffled = rng.shuffle(winners);
  const fixtures: CupFixture[] = [];
  for (let i = 0; i < shuffled.length; i += 2) {
    const homeFirst = rng.chance(0.5);
    fixtures.push({ round, home: homeFirst ? shuffled[i] : shuffled[i + 1], away: homeFirst ? shuffled[i + 1] : shuffled[i], played: false });
  }
  return fixtures;
}

// ---------------------------------------------------------------------------
// Career creation
// ---------------------------------------------------------------------------

export interface CustomClubInput {
  name: string;
  short: string;
  country: string;
  p1: string;
  p2: string;
  stadium: string;
  capacity: number;
  tier: number; // 1-4 squad strength
  academy: number; // 1-3 youth academy level
  board: number; // starting board confidence 0-100
}

export function createCareer(input: { seed: number; managerName: string; managerNat: string; clubId: string; lang?: "en" | "fa"; custom?: CustomClubInput }): SaveData {
  const rng = new Rng(input.seed);
  const club = clubById(input.clubId);
  const league = leagueById(club.league);
  const clubs = league.clubs.map((c) => c.id);
  const custom = input.custom;
  const nat = custom?.country ?? club.country;
  const tier = custom?.tier ?? club.tier;
  const squad = generateClubSquad(club.id, 1, input.seed, { country: nat, tier });
  const youth = generateYouthSquad(club.id, 1, input.seed, { country: nat, academy: custom?.academy ?? 1 });
  const stadium = STADIUM_LEVELS[0];
  const balance = TIER_BUDGET[Math.max(0, Math.min(3, (custom?.tier ?? club.tier) - 1))] + rng.int(0, 8_000_000);

  const save: SaveData = {
    v: 1,
    seed: input.seed,
    lang: input.lang ?? "en",
    manager: { name: input.managerName, nat: input.managerNat },
    clubId: club.id,
    season: 1,
    label: `${SEASON_START_YEAR}/${String(SEASON_START_YEAR + 1).slice(2)}`,
    week: 0,
    phase: "league",
    balance,
    stadium: { level: 1, capacity: custom?.capacity ?? stadium.capacity, ticket: stadium.ticket, name: custom?.stadium ?? club.stadium },
    sponsor: { level: 1, weekly: SPONSOR_LEVELS[0].weekly },
    squad,
    youth,
    tactics: {
      formation: "4-4-2",
      mentality: 55,
      pressing: 45,
      passing: 45,
      tempo: 50,
      lineup: autoPick(squad, "4-4-2"),
    },
    training: { focus: "balanced", intensity: 60, indiv: {} },
    league: { rows: clubs.map((c) => ({ clubId: c, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 })), fixtures: [] },
    cup: { nextRound: 1, alive: clubs, rounds: [], done: false },
    market: generateMarket(rng),
    listed: {},
    offers: {},
    scouts: [],
    news: [],
    achievements: [],
    history: [],
    board: custom?.board ?? 55 + (club.tier === 1 ? 12 : club.tier === 2 ? 7 : club.tier === 3 ? 3 : 0),
    flags: {},
    lastMatch: null,
    customClub: custom
      ? {
          name: custom.name,
          short: custom.short,
          p1: custom.p1,
          p2: custom.p2,
          stadium: custom.stadium,
          capacity: custom.capacity,
          country: custom.country,
          tier: custom.tier,
          academy: custom.academy,
          board: custom.board,
        }
      : undefined,
    financeLog: [],
    weeklyWage: 0,
    weeklyIncome: 0,
    seasonTrophies: [],
  };
  save.league.fixtures = fixturesForLeague(save);
  const draw = drawCupFirstRound(new Rng(hashSeed("cup", club.id, save.seed)), clubs);
  save.cup.rounds = [draw.fixtures];
  save.cup.byes = draw.byes;
  save.weeklyWage = squad.reduce((a, p) => a + p.wage, 0);
  save.weeklyIncome = save.sponsor.weekly;
  addNews(save, "info", L(save, `Welcome to ${clubDefOf(save, save.clubId).name}, ${input.managerName}! Season ${save.label} begins — your board expects a solid campaign.`, `به ${clubDefOf(save, save.clubId).name} خوش آمدید، ${input.managerName}! فصل ${save.label} آغاز شد — هیئت‌مدیره انتظار یک فصل خوب دارد.`));
  addNews(save, "info", L(save, `Club budget: ${fmtMoney(save.balance)}. Sponsor: ${SPONSOR_LEVELS[0].name}. Stadium capacity: ${save.stadium.capacity.toLocaleString()}.`, `بودجه باشگاه: ${fmtMoney(save.balance)}. اسپانسر: ${SPONSOR_LEVELS[0].name}. ظرفیت ورزشگاه: ${save.stadium.capacity.toLocaleString()}.`));
  return save;
}

// ---------------------------------------------------------------------------
// Tactics helpers
// ---------------------------------------------------------------------------

export function autoPick(squad: Player[], formation: string): Record<string, string | null> {
  const slots = formationSlots(formation);
  const lineup: Record<string, string | null> = {};
  const used = new Set<string>();
  // GKs first (must be GK pos). Lineup is keyed by the per-instance slot
  // key (e.g. "CB-1"/"CB-2") so repeated labels can hold distinct players.
  for (const s of slots.filter((s) => s.role === "GK")) {
    const pick = squad.filter((p) => p.pos === "GK" && !used.has(p.id)).sort((a, b) => computeOverall(b) - computeOverall(a))[0];
    if (pick) {
      lineup[s.key] = pick.id;
      used.add(pick.id);
    } else {
      lineup[s.key] = null;
    }
  }
  // Outfield: best fit
  for (const s of slots.filter((s) => s.role !== "GK")) {
    let best: Player | null = null;
    let bestScore = -1;
    for (const p of squad) {
      if (used.has(p.id) || p.pos === "GK") continue;
      const score = roleStrength(toEnginePlayer(p), s.role) * (1 + (p.pos === s.role ? 0.08 : 0));
      if (score > bestScore) {
        bestScore = score;
        best = p;
      }
    }
    if (best) {
      lineup[s.key] = best.id;
      used.add(best.id);
    } else {
      lineup[s.key] = null;
    }
  }
  return lineup;
}

export function buildEngineSideFromSquad(save: SaveData, squad: Player[], isHome: boolean, seed: number): EngineSide {
  const club = clubDefOf(save, save.clubId);
  const tactics = save.tactics;
  const slots = formationSlots(tactics.formation);
  const xi: EngineSlot[] = [];
  const bench: EngineSlot[] = [];
  const used = new Set<string>();

  // The lineup is keyed by slot label, so formations with repeated labels
  // (two CBs, two CMs, …) collapse to one entry each. Track occupancy per
  // slot index and backfill every unfilled slot below so the XI is always
  // a full team of distinct players.
  const filled = new Array<boolean>(slots.length).fill(false);
  for (let i = 0; i < slots.length; i++) {
    const s = slots[i];
    // Prefer the per-instance key; fall back to the legacy label key so
    // saves created before unique slot keys still load correctly.
    const id = tactics.lineup[s.key] ?? tactics.lineup[s.slot];
    const p = squad.find((p) => p.id === id && !used.has(id));
    if (!p) continue;
    used.add(p.id);
    xi.push({ p: toEnginePlayer(p), slot: s.slot, role: s.role });
    filled[i] = true;
  }
  // Fill missing slots with the best available player for the role
  for (let i = 0; i < slots.length; i++) {
    if (filled[i]) continue;
    const s = slots[i];
    let best: Player | null = null;
    let bestScore = -1;
    for (const p of squad) {
      if (used.has(p.id)) continue;
      const score = roleStrength(toEnginePlayer(p), s.role);
      if (score > bestScore) {
        bestScore = score;
        best = p;
      }
    }
    if (best) {
      used.add(best.id);
      xi.push({ p: toEnginePlayer(best), slot: s.slot, role: s.role });
    }
  }
  for (const p of sortSquad(squad)) {
    if (!used.has(p.id) && bench.length < 9) {
      bench.push({ p: toEnginePlayer(p), slot: "SUB", role: p.pos });
    }
  }
  return {
    id: club.id,
    name: club.name,
    short: club.short,
    p1: club.p1,
    p2: club.p2,
    xi,
    bench,
    tactics: { mentality: tactics.mentality, pressing: tactics.pressing, passing: tactics.passing, tempo: tactics.tempo },
    str: { att: 70, def: 70, mid: 70, gk: 70 },
    talk: 0,
  };
}

export function toEnginePlayer(p: Player) {
  return { id: p.id, name: playerName(p), pos: p.pos, attrs: p.attrs, morale: p.morale, cond: p.cond, form: avgForm(p) };
}

export function buildOpponentSide(save: SaveData, opponentClubId: string, seed: number): EngineSide {
  const squad = generateClubSquad(opponentClubId, save.season, save.seed);
  const club = clubById(opponentClubId);
  const rng = new Rng(hashSeed("opp", opponentClubId, save.season, seed));
  const formation = rng.pick(["4-4-2", "4-3-3", "4-2-3-1", "3-5-2", "4-5-1", "5-3-2", "3-4-3"]);
  const lineup = autoPick(squad, formation);
  const slots = formationSlots(formation);
  const xi: EngineSlot[] = [];
  const used = new Set<string>();
  // Same slot-index backfill as buildEngineSideFromSquad: repeated slot
  // labels in a formation must still produce a full 11-player XI.
  const filled = new Array<boolean>(slots.length).fill(false);
  for (let i = 0; i < slots.length; i++) {
    const s = slots[i];
    const id = lineup[s.key];
    const p = id ? squad.find((p) => p.id === id) : undefined;
    if (!p || used.has(p.id)) continue;
    used.add(p.id);
    xi.push({ p: toEnginePlayer(p), slot: s.slot, role: s.role });
    filled[i] = true;
  }
  for (let i = 0; i < slots.length; i++) {
    if (filled[i]) continue;
    const s = slots[i];
    let best: Player | null = null;
    let bestScore = -1;
    for (const p of squad) {
      if (used.has(p.id)) continue;
      const score = roleStrength(toEnginePlayer(p), s.role);
      if (score > bestScore) {
        bestScore = score;
        best = p;
      }
    }
    if (best) {
      used.add(best.id);
      xi.push({ p: toEnginePlayer(best), slot: s.slot, role: s.role });
    }
  }
  const bench: EngineSlot[] = [];
  for (const p of sortSquad(squad)) {
    if (!used.has(p.id) && bench.length < 7) bench.push({ p: toEnginePlayer(p), slot: "SUB", role: p.pos });
  }
  return {
    id: club.id,
    name: club.name,
    short: club.short,
    p1: club.p1,
    p2: club.p2,
    xi,
    bench,
    tactics: {
      mentality: rng.int(35, 70),
      pressing: rng.int(20, 75),
      passing: rng.int(20, 75),
      tempo: rng.int(30, 75),
    },
    str: { att: 70, def: 70, mid: 70, gk: 70 },
    talk: 0,
  };
}

// ---------------------------------------------------------------------------
// Next event
// ---------------------------------------------------------------------------

export function nextEvent(save: SaveData): NextEvent {
  const week = save.week + 1;
  if (week > SEASON_WEEKS) {
    return { type: "season_end", round: 0, week, fixture: null };
  }
  const cupRound = CUP_ROUND_AT_WEEK[week - 1];
  const cupActive = save.cup.alive.includes(save.clubId) && !save.cup.done;
  if (cupRound > 0 && cupActive) {
    const fixtures = save.cup.rounds[cupRound - 1] ?? [];
    const mine = fixtures.find((f) => !f.played && (f.home === save.clubId || f.away === save.clubId));
    if (mine) {
      return {
        type: "cup",
        round: cupRound,
        week,
        fixture: { home: mine.home, away: mine.away },
        cupRoundName: CUP_ROUND_NAMES[cupRound - 1],
      };
    }
    // user got a bye or is already out — treat as normal advance week
    return { type: "bye", round: 0, week, fixture: null };
  }
  const leagueRound = LEAGUE_ROUND_AT_WEEK[week - 1];
  if (leagueRound > 0) {
    const mine = save.league.fixtures.find((f) => f.round === leagueRound && !f.played && (f.home === save.clubId || f.away === save.clubId));
    if (mine) {
      return { type: "league", round: leagueRound, week, fixture: { home: mine.home, away: mine.away } };
    }
  }
  return { type: "bye", round: 0, week, fixture: null };
}

export function isUserMatchWeek(save: SaveData): boolean {
  const ev = nextEvent(save);
  return ev.type === "league" || ev.type === "cup";
}

// ---------------------------------------------------------------------------
// Weekly processing
// ---------------------------------------------------------------------------

function addNews(save: SaveData, kind: SaveData["news"][number]["kind"], text: string) {
  save.news.unshift({ week: save.week + 1, kind, text });
  if (save.news.length > 40) save.news.length = 40;
}

/** Pick the generated text for the save's language. */
function L(save: SaveData, en: string, fa: string): string {
  return save.lang === "fa" ? fa : en;
}

/** Decide a drawn cup tie with a deterministic penalty shootout. */
function cupDecider(save: SaveData, home: string, away: string, round: number, hg: number, ag: number): string {
  const rng = new Rng(hashSeed("pens", home, away, round, save.seed, hg, ag));
  return rng.next() < 0.5 ? home : away;
}

/** "MCI 2–1 ARS (Cup)" score line, localised. */
function cupScoreLine(save: SaveData, fx: CupFixture): string {
  const pens = fx.hg === fx.ag;
  const en = `${clubDefOf(save, fx.home).short} ${fx.hg}–${fx.ag} ${clubDefOf(save, fx.away).short} (Cup${pens ? " · pens" : ""})`;
  const fa = `${clubDefOf(save, fx.home).short} ${fx.hg}–${fx.ag} ${clubDefOf(save, fx.away).short} (جام${pens ? " · پنالتی" : ""})`;
  return L(save, en, fa);
}

function addFinance(save: SaveData, income: number, expense: number, note: string) {
  save.balance += income - expense;
  save.financeLog.unshift({ week: save.week + 1, income, expense, note });
  if (save.financeLog.length > 16) save.financeLog.length = 16;
}

function pushResultFlag(save: SaveData, result: "W" | "D" | "L") {
  const cur = (save.flags.lastResults as unknown as string | undefined) ?? "";
  const next = (cur + result).slice(-6);
  save.flags.lastResults = next as unknown as number;
  save.flags.winStreak = result === "W" ? (save.flags.winStreak ?? 0) + 1 : 0;
  save.flags.unbeaten = result !== "L" ? (save.flags.unbeaten ?? 0) + 1 : 0;
  save.flags.lossStreak = result === "L" ? (save.flags.lossStreak ?? 0) + 1 : 0;
}

function myRow(save: SaveData): LeagueRow {
  return save.league.rows.find((r) => r.clubId === save.clubId)!;
}

export function positionOf(save: SaveData): number {
  const sorted = standings(save);
  return sorted.findIndex((r) => r.clubId === save.clubId) + 1;
}

export function standings(save: SaveData): LeagueRow[] {
  return save.league.rows.slice().sort((a, b) => b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf);
}

function applyResultToTable(save: SaveData, home: string, away: string, hg: number, ag: number) {
  const h = save.league.rows.find((r) => r.clubId === home);
  const a = save.league.rows.find((r) => r.clubId === away);
  if (!h || !a) return;
  h.p++;
  a.p++;
  h.gf += hg;
  h.ga += ag;
  a.gf += ag;
  a.ga += hg;
  if (hg > ag) {
    h.w++;
    h.pts += 3;
    a.l++;
  } else if (hg < ag) {
    a.w++;
    a.pts += 3;
    h.l++;
  } else {
    h.d++;
    a.d++;
    h.pts++;
    a.pts++;
  }
}

function recordLeagueMatch(save: SaveData, round: number, home: string, away: string, hg: number, ag: number) {
  const f = save.league.fixtures.find((f) => f.round === round && f.home === home && f.away === away);
  if (f) {
    f.played = true;
    f.hg = hg;
    f.ag = ag;
  }
  applyResultToTable(save, home, away, hg, ag);
}

function cupResultLabel(save: SaveData): string {
  if (save.cup.userWon) return "Winner";
  const roundsDone = save.cup.rounds.length;
  if (roundsDone >= 4) return "Final";
  if (roundsDone === 3) return "Semi-final";
  if (roundsDone === 2) return "Quarter-final";
  if (roundsDone === 1) return "First round";
  return "—";
}

export function recordUserMatch(save: SaveData, m: FinishedMatch) {
  save.lastMatch = m;
  const win = m.hg > m.ag;
  const draw = m.hg === m.ag;

  // league table / cup
  let cupAdvanced = false; // the user survived a drawn cup tie on penalties
  if (m.kind === "league") {
    recordLeagueMatch(save, m.round, m.home, m.away, m.hg, m.ag);
    // Simulate every other tie in the same round so the whole matchday
    // resolves together and the table stays in sync with reality.
    for (const f of save.league.fixtures) {
      if (f.round !== m.round || f.played) continue;
      const hStr = tierStrengthOf(f.home, save);
      const aStr = tierStrengthOf(f.away, save);
      const res = quickSim(hStr, aStr, hashSeed("leaguematch", f.home, f.away, m.round, save.seed, save.week + 1));
      recordLeagueMatch(save, m.round, f.home, f.away, res.hg, res.ag);
    }
  } else {
    const roundIdx = m.round - 1;
    const fixtures = save.cup.rounds[roundIdx] ?? [];

    // Record the user's own tie first (scores are stored home-first).
    const f = fixtures.find((fx) => !fx.played && ((fx.home === m.home && fx.away === m.away) || (fx.home === m.away && fx.away === m.home)));
    if (f) {
      f.played = true;
      f.hg = m.home === f.home ? m.hg : m.ag;
      f.ag = m.home === f.home ? m.ag : m.hg;
      f.winner = f.hg === f.ag ? cupDecider(save, f.home, f.away, m.round, f.hg, f.ag) : f.hg > f.ag ? f.home : f.away;
    }

    // Resolve every other tie in this round so the cup always runs as a
    // full knockout (previously the other ties never played and the cup
    // ended right after the user's first match).
    const winners: string[] = [];
    for (const fx of fixtures) {
      if (!fx.played) {
        const hStr = tierStrengthOf(fx.home, save);
        const aStr = tierStrengthOf(fx.away, save);
        const res = quickSim(hStr, aStr, hashSeed("cupmatch", fx.home, fx.away, save.week + 1, save.seed));
        fx.played = true;
        fx.hg = res.hg;
        fx.ag = res.ag;
        fx.winner = res.hg === res.ag ? cupDecider(save, fx.home, fx.away, m.round, res.hg, res.ag) : res.hg > res.ag ? fx.home : fx.away;
        addNews(save, "cup", cupScoreLine(save, fx));
      }
      winners.push(fx.winner!);
    }

    // Round-1 byes join the winners for the next round.
    const byes = roundIdx === 0 ? save.cup.byes ?? [] : [];
    save.cup.alive = [...winners, ...byes];

    const champion = winners[0] ?? save.cup.alive[0];
    if (save.cup.nextRound >= 4 || save.cup.alive.length <= 1) {
      save.cup.done = true;
      save.cup.winner = champion;
      if (champion === save.clubId) {
        save.seasonTrophies.push("Cup");
        addNews(save, "cup", L(save, `🏆 ${clubDefOf(save, save.clubId).name} win the National Cup!`, `🏆 ${clubDefOf(save, save.clubId).name} قهرمان جام حذفی شد!`));
      } else {
        addNews(save, "cup", L(save, `${clubDefOf(save, champion).name} win the National Cup.`, `${clubDefOf(save, champion).name} قهرمان جام حذفی شد.`));
      }
    } else {
      const nextRound = save.cup.nextRound + 1;
      save.cup.nextRound = nextRound;
      save.cup.rounds.push(drawCupNextRound(new Rng(hashSeed("cup", save.clubId, save.seed, save.week + 1)), save.cup.alive, nextRound));
    }
    if (champion === save.clubId) save.cup.userWon = save.cup.nextRound >= 4;
    cupAdvanced = champion === save.clubId;
  }

  // A drawn cup tie is decided on penalties: advancing counts as a win,
  // going out counts as a loss.
  const pensWin = m.kind === "cup" && draw && cupAdvanced;
  const pensLoss = m.kind === "cup" && draw && !cupAdvanced;
  pushResultFlag(save, win || pensWin ? "W" : draw && !pensLoss ? "D" : "L");

  // player effects
  const byId = new Map(save.squad.map((p) => [p.id, p]));
  for (const [pid, rating] of Object.entries(m.ratings)) {
    const p = byId.get(pid);
    if (!p) continue;
    p.form.push(rating);
    if (p.form.length > 5) p.form.shift();
    // condition drain by minutes
    const subOff = m.subs.find((s) => s.outId === pid);
    const subOn = m.subs.find((s) => s.inId === pid);
    let minutes = 90;
    if (subOff) minutes = subOff.minute;
    if (subOn) minutes = 90 - subOn.minute;
    const drain = Math.round(minutes * 0.22 + (rating >= 8 ? 2 : 0));
    p.cond = Math.max(35, p.cond - drain);
    // experience
    if (p.age <= 23) p.xp += Math.round(minutes / 20);
  }
  for (const c of m.cards) {
    const p = byId.get(c.playerId);
    if (p) {
      if (c.type === "red") {
        p.susp = Math.max(p.susp, 1 + (m.ratings[c.playerId] < 5 ? 1 : 0));
        p.morale = Math.max(20, p.morale - 8);
      } else {
        p.morale = Math.max(20, p.morale - 3);
      }
    }
  }
  for (const inj of m.injuries) {
    const p = byId.get(inj.playerId);
    if (p) {
      p.injury = { weeks: inj.weeks, type: inj.type };
      p.cond = Math.max(30, p.cond - 15);
      p.morale = Math.max(20, p.morale - 5);
    }
  }
  // team morale
  const moraleWin = win || pensWin;
  const moraleDraw = !moraleWin && draw && !pensLoss;
  const delta = moraleWin ? 3 : moraleDraw ? 0 : -4;
  for (const p of save.squad) {
    p.morale = Math.max(5, Math.min(100, p.morale + delta + (moraleWin && p.cond < 60 ? 1 : 0)));
  }

  // board confidence
  updateBoard(save, moraleWin ? 6 : moraleDraw ? 1 : -7);

  // matchday income (home)
  if (m.home === save.clubId) {
    const club = clubDefOf(save, save.clubId);
    const pop = TIER_POPULARITY[Math.max(0, Math.min(3, club.tier - 1))];
    const pos = positionOf(save);
    const last = (save.flags.lastResults as unknown as string) ?? "";
    const wins = (last.match(/W/g) ?? []).length;
    const factor = (0.85 + (LEAGUE_SIZE - pos) * 0.035) * (0.95 + wins * 0.03);
    const attendance = Math.min(save.stadium.capacity, Math.round(pop * factor));
    const income = attendance * save.stadium.ticket;
    addFinance(save, income, 0, `Matchday income vs ${clubDefOf(save, m.away).short} (${attendance.toLocaleString()} fans)`);
  }

  addNews(save, "match", L(save,
    `${clubDefOf(save, m.home).short} ${m.hg}–${m.ag} ${clubDefOf(save, m.away).short} (${m.kind === "cup" ? "Cup " + CUP_ROUND_SHORT[m.round - 1] : "League R" + m.round})`,
    `${clubDefOf(save, m.home).short} ${m.hg}–${m.ag} ${clubDefOf(save, m.away).short} (${m.kind === "cup" ? "جام " + CUP_ROUND_SHORT[m.round - 1] : "لیگ هفته " + m.round})`));
  if (win) addNews(save, "match", L(save, `Victory for ${clubDefOf(save, save.clubId).name}! ${scorerText(m, save)}`, `پیروزی برای ${clubDefOf(save, save.clubId).name}! ${scorerText(m, save)}`));
  else if (pensWin) addNews(save, "match", L(save, `Through on penalties for ${clubDefOf(save, save.clubId).name}! ${scorerText(m, save)}`, `صعود با ضربات پنالتی برای ${clubDefOf(save, save.clubId).name}! ${scorerText(m, save)}`));
  else if (pensLoss) addNews(save, "match", L(save, `Out on penalties for ${clubDefOf(save, save.clubId).name}. ${scorerText(m, save)}`, `حذف در ضربات پنالتی برای ${clubDefOf(save, save.clubId).name}. ${scorerText(m, save)}`));
  else if (draw) addNews(save, "match", L(save, `Points shared for ${clubDefOf(save, save.clubId).name}. ${scorerText(m, save)}`, `تقسیم امتیاز برای ${clubDefOf(save, save.clubId).name}. ${scorerText(m, save)}`));
  else addNews(save, "match", L(save, `Defeat for ${clubDefOf(save, save.clubId).name}. ${scorerText(m, save)}`, `شکست برای ${clubDefOf(save, save.clubId).name}. ${scorerText(m, save)}`));
}

function scorerText(m: FinishedMatch, save: SaveData): string {
  if (!m.scorers.length) return "No goals scored.";
  return m.scorers
    .map((s) => {
      const p = save.squad.find((p) => p.id === s.playerId);
      return `${s.minute}' ${p ? playerName(p) : s.playerId}`;
    })
    .join(", ");
}

function updateBoard(save: SaveData, delta: number) {
  save.board = Math.max(0, Math.min(100, save.board + delta));
  if (save.board <= 20 && save.board > 0 && save.flags.boardWarned !== save.season) {
    save.flags.boardWarned = save.season;
    addNews(save, "board", L(save, "⚠️ The board is unhappy with recent results. Improve quickly or face the consequences.", "⚠️ هیئت‌مدیره از نتایج اخیر ناراضی است. سریع اوضاع را بهتر کنید یا با عواقب آن روبه‌رو شوید."));
  }
  if (save.board <= 0 && save.phase === "league") {
    save.phase = "sacked";
    addNews(save, "board", L(save, "❌ You have been sacked! The board has lost patience. Start a new career.", "❌ شما اخراج شدید! هیئت‌مدیره صبرش را از دست داده است. یک مربی‌گری جدید شروع کنید."));
  }
}

export function applyTraining(save: SaveData) {
  const plan = save.training;
  const intensityF = 0.55 + plan.intensity / 100;
  for (const p of save.squad) {
    const ovr = computeOverall(p);
    const ageF = ageGrowthFactor(p.age);
    const potF = ovr < p.pot ? 1 : 0.4;
    const focus = plan.indiv[p.id] ?? plan.focus;
    const focusAttrs = new Set<string>(FOCUS_ATTRS[focus] as string[]);
    for (const k of ATTR_KEYS) {
      const inFocus = focusAttrs.has(k);
      const step = (inFocus ? 0.8 : 0.28) * ageF * potF * intensityF;
      if (ageF < 0 && !inFocus) {
        p.attrs[k] = Math.max(1, Math.round(p.attrs[k] + step * 0.6));
      } else {
        p.attrs[k] = Math.max(1, Math.min(99, Math.round(p.attrs[k] + step)));
      }
    }
    // condition recovery
    p.cond = Math.min(100, p.cond + Math.round(24 - plan.intensity * 0.13));
    if (p.injury) {
      p.injury.weeks -= 1;
      if (p.injury.weeks <= 0) {
        p.injury = null;
        addNews(save, "info", L(save, `${playerName(p)} has recovered from injury.`, `${playerName(p)} از مصدومیت بازگشت.`));
      }
    }
    p.morale += (50 - p.morale) * 0.08;
    p.morale = Math.max(5, Math.min(100, Math.round(p.morale)));
  }
  // youth
  for (const y of save.youth) {
    const ageF = 2.4;
    const potF = computeOverall({ attrs: y.attrs, pos: y.pos }) < y.pot ? 1 : 0.4;
    for (const k of ATTR_KEYS) {
      y.attrs[k] = Math.max(1, Math.min(99, Math.round(y.attrs[k] + 0.55 * ageF * potF * intensityF)));
    }
    y.cond = Math.min(100, y.cond + 20);
  }
}

function ageGrowthFactor(age: number): number {
  if (age <= 21) return 1.6;
  if (age <= 24) return 1.15;
  if (age <= 27) return 0.8;
  if (age <= 29) return 0.5;
  if (age <= 31) return 0.25;
  if (age <= 33) return -0.2;
  return -0.5;
}

export function applyMarketWeek(save: SaveData, rng: Rng) {
  // rotate market
  save.market = save.market.filter(() => rng.chance(0.8));
  const added = 4 + rng.int(0, 3);
  for (let i = 0; i < added; i++) {
    const nat = rng.pickWeighted(ALL_COUNTRIES, (c) => (["eng", "esp", "ita", "ger", "fra", "bra", "arg"].includes(c.id) ? 4 : 1));
    const pos = rng.pick(["GK", "DF", "DF", "MF", "MF", "FW"] as Pos[]);
    const age = rng.int(17, 33);
    const target = Math.max(50, Math.min(92, Math.round(67 + rng.gauss() * 9 + rng.range(-4, 4))));
    const p = generatePlayer(rng, nat.id, pos, target, age, { pot: age <= 22 ? Math.min(99, target + rng.int(5, 15)) : target + 2 });
    const ovr = computeOverall(p);
    save.market.push({
      id: `mkt-${save.week}-${i}`,
      first: p.first,
      last: p.last,
      age,
      nat: nat.id,
      pos,
      attrs: p.attrs,
      pot: p.pot,
      ovr,
      val: p.val,
      wage: wageFor(ovr),
      asking: marketAsking({ ovr, age, pot: p.pot, pos }),
      morale: rng.int(50, 85),
      form: Math.round(rng.range(5.5, 8.6) * 10) / 10,
      known: false,
    });
  }
  // offers for listed players
  for (const pid of Object.keys(save.listed)) {
    const p = save.squad.find((p) => p.id === pid);
    if (!p) continue;
    const asking = save.listed[pid];
    const existing = save.offers[pid] ?? [];
    if (existing.length < 3 && rng.chance(0.5)) {
      const formF = 0.85 + Math.min(0.3, (avgForm(p) - 6.5) * 0.1);
      const amount = Math.round((Math.min(asking, p.val * formF * rng.range(0.75, 1.05))) / 10000) * 10000;
      const club = rng.pick(leagueOf(save.clubId).clubs.filter((c) => c.id !== save.clubId));
      existing.push({
        id: `ofr-${save.week}-${pid}`,
        from: club.short,
        amount: Math.max(100000, amount),
        weeklyWage: Math.round(p.wage * rng.range(0.9, 1.15)),
      });
      save.offers[pid] = existing;
    }
  }
}

export function applyYouthWeek(save: SaveData, rng: Rng) {
  const nat = save.customClub?.country ?? clubById(save.clubId).country;
  if (save.youth.length < 16 && rng.chance(0.55)) {
    const pos = rng.pick(["GK", "DF", "DF", "MF", "MF", "MF", "FW", "FW"] as Pos[]);
    const age = rng.int(15, 16);
    const target = rng.int(47, 57);
    const p = generatePlayer(rng, nat, pos, target, age, { pot: Math.min(99, target + rng.int(16, 28)) });
    save.youth.push({
      id: `youth-${save.week}-${save.youth.length}`,
      first: p.first,
      last: p.last,
      age,
      nat: p.nat,
      pos,
      attrs: p.attrs,
      pot: p.pot,
      morale: rng.int(60, 90),
      cond: 100,
      xp: 0,
      sinceWeek: save.week,
      name: playerName(p),
    });
    addNews(save, "youth", L(save, `🎓 Academy intake: ${playerName(p)} (${pos}, ${age}) joins the youth squad with big potential (${p.pot}).`, `🎓 استعداد جدید آکادمی: ${playerName(p)} (${pos}, ${age}) با پتانسیل بالا (${p.pot}) به تیم جوانان پیوست.`));
  }
}

export interface AchievementDef {
  icon: string;
  en: [string, string];
  fa: [string, string];
}

/** All achievements the game can award — name + description in both languages. */
export const ACHIEVEMENTS: Record<string, AchievementDef> = {
  first_win: { icon: "🥇", en: ["First Blood", "Win your first match"], fa: ["اولین پیروزی", "اولین برد خود را ثبت کنید"] },
  streak_3: { icon: "🔥", en: ["On Fire", "Win 3 matches in a row"], fa: ["در آتش", "۳ پیروزی متوالی"] },
  streak_5: { icon: "⚡", en: ["Unstoppable", "Win 5 matches in a row"], fa: ["غیرقابل توقف", "۵ پیروزی متوالی"] },
  unbeaten_5: { icon: "🛡️", en: ["Invincible Run", "Go 5 matches unbeaten"], fa: ["راه شکست‌ناپذیر", "۵ بازی بدون شکست"] },
  promote_3: { icon: "🎓", en: ["Academy Product", "Promote 3 youth players"], fa: ["محصول آکادمی", "۳ بازیکن جوان را بالا بیاورید"] },
  sign_5: { icon: "✍️", en: ["Deal Maker", "Sign 5 players"], fa: ["معامله‌گر", "۵ بازیکن بخرید"] },
  sell_5: { icon: "💰", en: ["Transfer Genius", "Sell 5 players"], fa: ["نابغه نقل‌وانتقالات", "۵ بازیکن بفروشید"] },
  stadium_3: { icon: "🏟️", en: ["Growing Club", "Upgrade the stadium to level 3"], fa: ["باشگاه در حال رشد", "ورزشگاه را به سطح ۳ برسانید"] },
  stadium_5: { icon: "🏟️", en: ["Monument", "Upgrade the stadium to level 5"], fa: ["یادمان", "ورزشگاه را به سطح ۵ برسانید"] },
  sponsor_4: { icon: "🤝", en: ["Corporate Power", "Reach sponsor level 4"], fa: ["قدرت شرکتی", "به سطح ۴ اسپانسر برسید"] },
  balance_100m: { icon: "💎", en: ["Rich Club", "Hold €100M in the bank"], fa: ["باشگاه ثروتمند", "۱۰۰ میلیون یورو در بانک داشته باشید"] },
  league_title: { icon: "🏆", en: ["Champions!", "Win the league title"], fa: ["قهرمان!", "قهرمان لیگ شوید"] },
  cup_title: { icon: "🏅", en: ["Cup Kings", "Win the National Cup"], fa: ["پادشاهان جام", "جام حذفی را ببرید"] },
  double: { icon: "👑", en: ["The Double", "Win the league and cup in one season"], fa: ["دبل", "در یک فصل قهرمان لیگ و جام شوید"] },
};

export function achievementDef(id: string): AchievementDef | undefined {
  return ACHIEVEMENTS[id];
}

const ACHIEVEMENT_FA: Record<string, [string, string]> = {
  first_win: ["اولین پیروزی", "اولین برد خود را ثبت کنید"],
  streak_3: ["در آتش", "۳ پیروزی متوالی"],
  streak_5: ["غیرقابل توقف", "۵ پیروزی متوالی"],
  unbeaten_5: ["راه شکست‌ناپذیر", "۵ بازی بدون شکست"],
  promote_3: ["محصول آکادمی", "۳ بازیکن جوان را بالا بیاورید"],
  sign_5: ["معامله‌گر", "۵ بازیکن بخرید"],
  sell_5: ["نابغه نقل‌وانتقالات", "۵ بازیکن بفروشید"],
  stadium_3: ["باشگاه در حال رشد", "ورزشگاه را به سطح ۳ برسانید"],
  stadium_5: ["یادمان", "ورزشگاه را به سطح ۵ برسانید"],
  sponsor_4: ["قدرت شرکتی", "به سطح ۴ اسپانسر برسید"],
  balance_100m: ["باشگاه ثروتمند", "۱۰۰ میلیون یورو در بانک داشته باشید"],
  league_title: ["قهرمان!", "قهرمان لیگ شوید"],
  cup_title: ["پادشاهان جام", "جام حذفی را ببرید"],
  double: ["دبل", "در یک فصل قهرمان لیگ و جام شوید"],
};

function checkAchievements(save: SaveData) {
  const ach = (id: string, name: string, desc: string, icon: string) => {
    if (!save.achievements.includes(id)) {
      save.achievements.push(id);
      const fa = ACHIEVEMENT_FA[id];
      addNews(save, "achievement", L(save, `${icon} Achievement unlocked: ${name} — ${desc}`, `${icon} دستاورد جدید: ${fa ? fa[0] : name} — ${fa ? fa[1] : desc}`));
    }
  };
  if ((save.flags.winStreak ?? 0) >= 1) ach("first_win", "First Blood", "Win your first match", "🥇");
  if ((save.flags.winStreak ?? 0) >= 3) ach("streak_3", "On Fire", "Win 3 matches in a row", "🔥");
  if ((save.flags.winStreak ?? 0) >= 5) ach("streak_5", "Unstoppable", "Win 5 matches in a row", "⚡");
  if ((save.flags.unbeaten ?? 0) >= 5) ach("unbeaten_5", "Invincible Run", "Go 5 matches unbeaten", "🛡️");
  if (save.flags.promotedYouth >= 3) ach("promote_3", "Academy Product", "Promote 3 youth players", "🎓");
  if ((save.flags.signedCount ?? 0) >= 5) ach("sign_5", "Deal Maker", "Sign 5 players", "✍️");
  if ((save.flags.soldCount ?? 0) >= 5) ach("sell_5", "Transfer Genius", "Sell 5 players", "💰");
  if (save.stadium.level >= 3) ach("stadium_3", "Growing Club", "Upgrade the stadium to level 3", "🏟️");
  if (save.stadium.level >= 5) ach("stadium_5", "Monument", "Upgrade the stadium to level 5", "🏟️");
  if (save.sponsor.level >= 4) ach("sponsor_4", "Corporate Power", "Reach sponsor level 4", "🤝");
  if (save.balance >= 100_000_000) ach("balance_100m", "Rich Club", "Hold €100M in the bank", "💎");
  if (save.seasonTrophies.includes("League")) ach("league_title", "Champions!", "Win the league title", "🏆");
  if (save.seasonTrophies.includes("Cup")) ach("cup_title", "Cup Kings", "Win the National Cup", "🏅");
  if (save.seasonTrophies.includes("League") && save.seasonTrophies.includes("Cup")) ach("double", "The Double", "Win the league and cup in one season", "👑");
}

export function applyWeekly(save: SaveData, rng: Rng) {
  applyTraining(save);
  applyMarketWeek(save, rng);
  applyYouthWeek(save, rng);
  tickScouts(save, rng);

  // finances
  const wages = save.squad.reduce((a, p) => a + p.wage, 0);
  save.weeklyWage = wages;
  const sponsorIncome = save.sponsor.weekly;
  save.weeklyIncome = sponsorIncome;
  addFinance(save, sponsorIncome, wages, "Weekly sponsor & wages");
  if (save.balance < 0) {
    updateBoard(save, -2);
    if (save.balance < -5_000_000) addNews(save, "finance", L(save, "⚠️ The club is in debt — sell players or reduce the wage bill!", "⚠️ باشگاه بدهکار است — بازیکن بفروشید یا دستمزدها را کاهش دهید!"));
  }

  // suspensions decay on league weeks
  for (const p of save.squad) {
    if (p.susp > 0) {
      p.susp -= 1;
      if (p.susp <= 0) addNews(save, "info", L(save, `${playerName(p)} returns from suspension.`, `${playerName(p)} از محرومیت بازگشت.`));
    }
  }

  // board weekly drift by position
  const pos = positionOf(save);
  if (pos <= 3) updateBoard(save, 1);
  else if (pos >= 10) updateBoard(save, -1);

  // league news
  const lastResults = (save.flags.lastResults as unknown as string) ?? "";
  addNews(save, "result", L(save, `League position: ${ordinal(pos)} of ${LEAGUE_SIZE}. Form: ${lastResults || "—"}.`, `رتبه ${ordinal(pos)} از ${LEAGUE_SIZE}. فرم: ${lastResults || "—"}.`));

  checkAchievements(save);
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

// ---------------------------------------------------------------------------
// Advance week (AI weeks + season flow)
// ---------------------------------------------------------------------------

export function simulateWeek(save: SaveData): { advanced: boolean; reason?: string } {
  const ev = nextEvent(save);
  if (ev.type === "league" || ev.type === "cup") {
    return { advanced: false, reason: "user_match" };
  }
  const rng = new Rng(hashSeed("week", save.clubId, save.seed, save.week + 1));
  const week = save.week + 1;

  if (week <= SEASON_WEEKS) {
    const cupRound = CUP_ROUND_AT_WEEK[week - 1];
    if (cupRound > 0 && !save.cup.done) {
      // simulate cup fixtures
      const fixtures = save.cup.rounds[cupRound - 1] ?? [];
      const winners: string[] = [];
      for (const f of fixtures) {
        if (f.played) {
          winners.push(f.winner ?? (f.hg! > f.ag! ? f.home : f.away));
          continue;
        }
        const hStr = tierStrengthOf(f.home, save);
        const aStr = tierStrengthOf(f.away, save);
        const res = quickSim(hStr, aStr, hashSeed("cupmatch", f.home, f.away, week, save.seed));
        f.played = true;
        f.hg = res.hg;
        f.ag = res.ag;
        f.winner = res.hg === res.ag ? cupDecider(save, f.home, f.away, cupRound, res.hg, res.ag) : res.hg > res.ag ? f.home : f.away;
        winners.push(f.winner);
        addNews(save, "cup", cupScoreLine(save, f));
      }
      if (winners.length) {
        // Round-1 byes join the winners for the next round.
        save.cup.alive = cupRound === 1 ? winners.concat(save.cup.byes || []) : winners;
        const alive = save.cup.alive;
        if (cupRound >= 4 || alive.length <= 1) {
          save.cup.done = true;
          save.cup.winner = alive[0];
          addNews(save, "cup", L(save, `${clubDefOf(save, alive[0]).name} win the National Cup!`, `${clubDefOf(save, alive[0]).name} قهرمان جام حذفی شد!`));
        } else {
          save.cup.nextRound = cupRound + 1;
          save.cup.rounds.push(drawCupNextRound(new Rng(hashSeed("cup", save.clubId, save.seed, week)), alive, cupRound + 1));
        }
      }
    } else {
      const leagueRound = LEAGUE_ROUND_AT_WEEK[week - 1];
      if (leagueRound > 0) {
        const fixtures = save.league.fixtures.filter((f) => f.round === leagueRound);
        for (const f of fixtures) {
          if (f.played) continue;
          const hStr = tierStrengthOf(f.home, save);
          const aStr = tierStrengthOf(f.away, save);
          const res = quickSim(hStr, aStr, hashSeed("leaguematch", f.home, f.away, leagueRound, save.seed));
          recordLeagueMatch(save, leagueRound, f.home, f.away, res.hg, res.ag);
          f.played = true;
          f.hg = res.hg;
          f.ag = res.ag;
        }
        addNews(save, "result", L(save, `Round ${leagueRound} complete. Leader: ${clubDefOf(save, standings(save)[0].clubId).name}.`, `هفته ${leagueRound} کامل شد. صدرنشین: ${clubDefOf(save, standings(save)[0].clubId).name}.`));
      }
    }
  }

  completeWeek(save, rng);
  return { advanced: true };
}

/**
 * Fast-forward through training weeks until the next user match (or the
 * season end). Returns how many weeks were consumed.
 */
export function skipToNextMatch(save: SaveData): { advanced: boolean; weeks: number; reason?: string } {
  let weeks = 0;
  for (let i = 0; i < 30; i++) {
    const ev = nextEvent(save);
    if (ev.type === "league" || ev.type === "cup" || ev.type === "season_end") {
      return { advanced: weeks > 0, weeks };
    }
    const res = simulateWeek(save);
    if (!res.advanced) return { advanced: weeks > 0, weeks, reason: res.reason };
    weeks += 1;
  }
  return { advanced: weeks > 0, weeks };
}

/** Finish the current week: weekly effects, week counter, season-end check. */
export function completeWeek(save: SaveData, rng: Rng) {
  applyWeekly(save, rng);
  save.week += 1;
  if (save.week > SEASON_WEEKS && save.phase === "league") {
    endSeason(save);
  }
}

function tierStrengthOf(clubId: string, save: SaveData): { att: number; def: number; mid: number; gk: number; mentality: number } {
  const club = clubDefOf(save, clubId);
  const base = TIER_OVR[Math.max(0, Math.min(3, club.tier - 1))];
  const o = 5;
  // deterministic small variation per club
  const v = (hashSeed("str", clubId, save.season) % 7) - 3;
  return { att: base + o + v, def: base + o + v, mid: base + o + v, gk: base + o + v, mentality: 50 };
}

export function endSeason(save: SaveData) {
  const pos = positionOf(save);
  const wealth = LEAGUE_WEALTH[leagueOf(save.clubId).id] ?? 1;
  const prize = Math.round(((PRIZE_MONEY[pos - 1] ?? 0) * wealth) / 100000) * 100000;
  const cupPrize = save.cup.userWon ? CUP_PRIZE : 0;
  addFinance(save, prize + cupPrize, 0, `Prize money: ${ordinal(pos)} in league${cupPrize ? " + cup win" : ""}`);
  if (pos === 1) {
    save.seasonTrophies.push("League");
    addNews(save, "achievement", L(save, `🏆 CHAMPIONS! ${clubDefOf(save, save.clubId).name} win the league!`, `🏆 قهرمان! ${clubDefOf(save, save.clubId).name} قهرمان لیگ شد!`));
  } else if (pos <= 3) {
    addNews(save, "result", L(save, `Season complete: ${ordinal(pos)} place.`, `پایان فصل: مقام ${ordinal(pos)}.`));
  } else {
    addNews(save, "result", L(save, `Season complete: ${ordinal(pos)} place.`, `پایان فصل: مقام ${ordinal(pos)}.`));
  }
  checkAchievements(save);
  save.history.push({
    season: save.season,
    label: save.label,
    clubId: save.clubId,
    pos,
    cup: cupResultLabel(save),
    balance: save.balance,
    trophies: save.seasonTrophies,
  });
  save.phase = "season_end";
}

export function startNextSeason(save: SaveData) {
  const rng = new Rng(hashSeed("season", save.clubId, save.seed, save.season + 1));
  save.season += 1;
  const year = SEASON_START_YEAR + save.season - 1;
  save.label = `${year}/${String(year + 1).slice(2)}`;
  save.week = 0;
  save.phase = "league";
  save.seasonTrophies = [];

  // age players
  for (const p of save.squad) {
    p.age += 1;
    p.contract -= 18;
    if (p.contract < 13) p.contract += 52;
    if (p.age >= 30) {
      for (const k of ATTR_KEYS) {
        p.attrs[k] = Math.max(1, p.attrs[k] - (p.age >= 34 ? 2 : 1));
      }
    }
    p.cond = 100;
    p.injury = null;
    p.susp = 0;
    p.morale = Math.max(45, Math.min(75, Math.round(p.morale + (55 - p.morale) * 0.3)));
  }
  save.youth = generateYouthSquad(save.clubId, save.season, save.seed);
  save.league.fixtures = fixturesForLeague(save);
  save.league.rows = save.league.rows.map((r) => ({ ...r, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 }));
  save.cup = {
    nextRound: 1,
    alive: leagueOf(save.clubId).clubs.map((c) => c.id),
    rounds: [],
    done: false,
  };
  const draw = drawCupFirstRound(new Rng(hashSeed("cup", save.clubId, save.seed)), save.cup.alive);
  save.cup.rounds = [draw.fixtures];
  save.cup.byes = draw.byes;
  save.market = generateMarket(rng);
  save.listed = {};
  save.offers = {};
  // active scout missions expire with the old market; reports stay archived
  save.scouts = (save.scouts ?? []).filter((s) => s.done);
  save.lastMatch = null;
  save.flags = { ...save.flags, lastResults: "", winStreak: 0, lossStreak: 0, unbeaten: 0, promotedYouth: 0, signedCount: 0, soldCount: 0 } as unknown as Record<string, number>;
  save.weeklyWage = save.squad.reduce((a, p) => a + p.wage, 0);
  save.weeklyIncome = save.sponsor.weekly;
  save.board = Math.min(100, save.board + 15);
  addNews(save, "info", L(save, `Season ${save.label} begins! New fixtures, new cup draw — go make history.`, `فصل ${save.label} آغاز شد! برنامه جدید، قرعه‌کشی جدید جام — بروید تاریخ بسازید.`));
}

// ---------------------------------------------------------------------------
// Scouting
// ---------------------------------------------------------------------------

/** Dispatch a scout. `kind: "player"` unlocks a market player's profile;
 *  `kind: "region"` hunts for new prospects in a country. Takes 1-3 weeks. */
export function dispatchScout(
  save: SaveData,
  kind: ScoutKind,
  targetId: string,
  duration: number,
): { ok: boolean; error?: string; missionId?: string } {
  save.scouts = save.scouts ?? [];
  const d = duration as (typeof SCOUT_DURATIONS)[number];
  if (!SCOUT_COSTS[d]) return { ok: false, error: L(save, "Invalid scout duration.", "مدت زمان نامعتبر است.") };
  const cost = SCOUT_COSTS[d];
  const active = save.scouts.filter((s) => !s.done);
  if (active.length >= MAX_ACTIVE_SCOUTS) {
    return { ok: false, error: L(save, `The scout department is busy (max ${MAX_ACTIVE_SCOUTS} active missions).`, `بخش استعدادیابی مشغول است (حداکثر ${MAX_ACTIVE_SCOUTS} مأموریت فعال).`) };
  }
  if (active.some((s) => s.kind === kind && s.targetId === targetId)) {
    return { ok: false, error: L(save, "A scout is already watching this target.", "یک استعدادیاب در حال حاضر این هدف را زیر نظر دارد.") };
  }
  if (save.balance < cost) return { ok: false, error: L(save, "Not enough funds for the scouting trip.", "بودجه کافی برای مأموریت استعدادیابی نیست.") };

  let targetName = "";
  let targetFlag: string | undefined;
  let pos: Pos | undefined;
  if (kind === "player") {
    const mp = save.market.find((m) => m.id === targetId);
    if (!mp) return { ok: false, error: L(save, "Player not found on the market.", "بازیکن در بازار پیدا نشد.") };
    if (mp.known !== false) return { ok: false, error: L(save, "This player is already fully scouted.", "این بازیکن قبلاً کاملاً بررسی شده است.") };
    targetName = `${mp.first} ${mp.last}`;
    targetFlag = countryById(mp.nat).flag;
    pos = mp.pos;
  } else {
    if (!ALL_COUNTRIES.some((c) => c.id === targetId)) return { ok: false, error: L(save, "Unknown scouting region.", "منطقه استعدادیابی نامعتبر است.") };
    const c = countryById(targetId);
    targetName = c.name;
    targetFlag = c.flag;
  }

  save.balance -= cost;
  save.financeLog.unshift({ week: save.week + 1, income: 0, expense: cost, note: `Scouting: ${targetName}` });
  const mission: ScoutMission = {
    id: `scout-${save.week}-${active.length}-${targetId}`,
    kind,
    targetId,
    targetName,
    targetFlag,
    pos,
    cost,
    startWeek: save.week,
    duration: d,
    done: false,
  };
  save.scouts.push(mission);
  addNews(save, "info", L(save, `🕵️ Scout dispatched ${kind === "player" ? `to watch ${targetName}` : `to ${targetName}`} — report in ${d} week${d > 1 ? "s" : ""} (${fmtMoney(cost)}).`, `🕵️ استعدادیاب ${kind === "player" ? `برای بررسی ${targetName}` : `به ${targetName}`} اعزام شد — گزارش تا ${d} هفته دیگر (${fmtMoney(cost)}).`));
  return { ok: true, missionId: mission.id };
}

/** Complete any scout missions whose deadline has passed. Runs every week. */
export function tickScouts(save: SaveData, rng: Rng) {
  save.scouts = save.scouts ?? [];
  for (const s of save.scouts) {
    if (s.done) continue;
    if (save.week + 1 < s.startWeek + s.duration) continue;
    s.done = true;
    const completedWeek = save.week + 1;
    if (s.kind === "player") {
      const mp = save.market.find((m) => m.id === s.targetId);
      if (mp) mp.known = true;
      s.report = {
        completedWeek,
        player: mp ? { ...mp } : undefined,
        note: L(save, "Detailed report on the target player.", "گزارش کامل از بازیکن هدف."),
      };
      addNews(save, "info", L(save, `📋 Scout report on ${s.targetName} is in — full profile unlocked.`, `📋 گزارش استعدادیاب درباره ${s.targetName} رسید — پروفایل کامل فعال شد.`));
    } else {
      const found: MarketPlayer[] = [];
      const count = 2 + rng.int(0, 2);
      for (let i = 0; i < count; i++) {
        const nat = s.targetId;
        const pos = rng.pick(["GK", "DF", "DF", "MF", "MF", "FW"] as Pos[]);
        const age = rng.int(17, 24);
        const young = age <= 21;
        const target = Math.max(56, Math.min(90, Math.round(64 + rng.gauss() * 7 + (young ? -1 : 4) + rng.range(-3, 3))));
        const p = generatePlayer(rng, nat, pos, target, age, { pot: young ? Math.min(99, target + rng.int(8, 18)) : Math.min(99, target + 3) });
        const ovr = computeOverall(p);
        found.push({
          id: `scout-${save.week}-${i}-${nat}`,
          first: p.first,
          last: p.last,
          age,
          nat,
          pos,
          attrs: p.attrs,
          pot: p.pot,
          ovr,
          val: p.val,
          wage: wageFor(ovr),
          asking: marketAsking({ ovr, age, pot: p.pot, pos }),
          morale: rng.int(55, 85),
          form: Math.round(rng.range(5.8, 8.4) * 10) / 10,
          known: true,
          foundByScout: true,
        });
      }
      save.market.push(...found);
      s.report = {
        completedWeek,
        found,
        note: L(save, "The scouting trip uncovered new prospects.", "سفر استعدادیابی استعدادهای جدیدی کشف کرد."),
      };
      addNews(save, "info", L(save, `🕵️ Scouts returned from ${s.targetName} — ${found.map((f) => `${f.first} ${f.last} (${f.ovr})`).join(", ")} added to the market.`, `🕵️ استعدادیابها از ${s.targetName} بازگشتند — ${found.map((f) => `${f.first} ${f.last} (${f.ovr})`).join("، ")} به بازار اضافه شدند.`));
    }
  }
  // keep the archive tidy
  const done = save.scouts.filter((s) => s.done);
  if (done.length > 30) {
    save.scouts = save.scouts.filter((s) => !s.done).concat(done.slice(done.length - 30));
  }
}

// ---------------------------------------------------------------------------
// Transfers, training, stadium, sponsor, interactions, youth
// ---------------------------------------------------------------------------

export function buyPlayer(save: SaveData, marketId: string): { ok: boolean; error?: string } {
  if (save.squad.length >= 28) return { ok: false, error: L(save, "Squad is full (max 28 players).", "تیم پر است (حداکثر ۲۸ بازیکن).") };
  const mp = save.market.find((m) => m.id === marketId);
  if (!mp) return { ok: false, error: L(save, "Player not found on the market.", "بازیکن در بازار پیدا نشد.") };
  if (mp.known === false) return { ok: false, error: L(save, "Scout this player first to unlock his full profile.", "برای فعال شدن پروفایل کامل، اول این بازیکن را استعدادیابی کنید.") };
  if (save.balance < mp.asking) return { ok: false, error: L(save, "Not enough funds.", "بودجه کافی نیست.") };
  const p: Player = {
    id: `buy-${save.week}-${mp.id}`,
    first: mp.first,
    last: mp.last,
    age: mp.age,
    nat: mp.nat,
    pos: mp.pos,
    attrs: { ...mp.attrs },
    pot: mp.pot,
    val: mp.val,
    wage: mp.wage,
    contract: 104,
    morale: 65,
    cond: 95,
    form: [mp.form],
    injury: null,
    susp: 0,
    xp: 0,
  };
  save.squad.push(p);
  save.market = save.market.filter((m) => m.id !== marketId);
  save.balance -= mp.asking;
  save.flags.signedCount = (save.flags.signedCount ?? 0) + 1;
  save.financeLog.unshift({ week: save.week + 1, income: 0, expense: mp.asking, note: `Transfer: ${playerName(p)}` });
  addNews(save, "transfer", L(save, `✍️ Signed ${playerName(p)} (${p.pos}, ${p.age}) for ${fmtMoney(mp.asking)}.`, `✍️ ${playerName(p)} (${p.pos}, ${p.age}) با ${fmtMoney(mp.asking)} به خدمت گرفته شد.`));
  checkAchievements(save);
  return { ok: true };
}

export function transferListPlayer(save: SaveData, playerId: string, price: number) {
  save.listed[playerId] = price;
  const p = save.squad.find((p) => p.id === playerId);
  if (p) addNews(save, "transfer", L(save, `📢 ${playerName(p)} has been placed on the transfer list for ${fmtMoney(price)}.`, `📢 ${playerName(p)} با قیمت ${fmtMoney(price)} در فهرست فروش قرار گرفت.`));
}

export function unlistPlayer(save: SaveData, playerId: string) {
  delete save.listed[playerId];
  delete save.offers[playerId];
}

export function acceptOffer(save: SaveData, playerId: string, offerId: string): { ok: boolean; error?: string } {
  const offers = save.offers[playerId] ?? [];
  const offer = offers.find((o) => o.id === offerId);
  if (!offer) return { ok: false, error: L(save, "Offer no longer available.", "پیشنهاد دیگر معتبر نیست.") };
  const idx = save.squad.findIndex((p) => p.id === playerId);
  if (idx < 0) return { ok: false, error: L(save, "Player not found.", "بازیکن پیدا نشد.") };
  const p = save.squad[idx];
  save.squad.splice(idx, 1);
  save.balance += offer.amount;
  save.flags.soldCount = (save.flags.soldCount ?? 0) + 1;
  save.financeLog.unshift({ week: save.week + 1, income: offer.amount, expense: 0, note: `Transfer out: ${playerName(p)} → ${offer.from}` });
  addNews(save, "transfer", L(save, `💰 Sold ${playerName(p)} to ${offer.from} for ${fmtMoney(offer.amount)}.`, `💰 ${playerName(p)} به ${offer.from} با ${fmtMoney(offer.amount)} فروخته شد.`));
  delete save.listed[playerId];
  delete save.offers[playerId];
  checkAchievements(save);
  return { ok: true };
}

export function rejectOffer(save: SaveData, playerId: string, offerId: string) {
  save.offers[playerId] = (save.offers[playerId] ?? []).filter((o) => o.id !== offerId);
}

export function interactPlayer(save: SaveData, playerId: string, action: "praise" | "encourage" | "warn" | "fine"): { ok: boolean; error?: string } {
  const p = save.squad.find((p) => p.id === playerId);
  if (!p) return { ok: false, error: L(save, "Player not found.", "بازیکن پیدا نشد.") };
  if (save.flags[`talk:${playerId}`] === save.week) return { ok: false, error: L(save, `${playerName(p)} has already been spoken to this week.`, `${playerName(p)} این هفته قبلاً صحبت شده است.`) };
  save.flags[`talk:${playerId}`] = save.week;
  const form = avgForm(p);
  if (action === "praise") {
    const boost = form >= 7 ? 8 : 3;
    p.morale = Math.min(100, p.morale + boost);
    addNews(save, "info", `🗣️ You praised ${playerName(p)} — morale up.`);
  } else if (action === "encourage") {
    p.morale = Math.min(100, p.morale + 5);
    addNews(save, "info", `🗣️ You encouraged ${playerName(p)}.`);
  } else if (action === "warn") {
    p.morale = Math.max(5, p.morale - 3);
    addNews(save, "info", `🗣️ You warned ${playerName(p)} about his form.`);
  } else {
    if (save.balance < p.wage) return { ok: false, error: L(save, "The club cannot afford the fine.", "باشگاه توانایی پرداخت جریمه را ندارد.") };
    p.morale = Math.max(5, p.morale - 10);
    p.cond = Math.min(100, p.cond + 4);
    addFinance(save, 0, p.wage, `Fine: ${playerName(p)}`);
    addNews(save, "info", `💸 You fined ${playerName(p)} one week's wages.`);
  }
  return { ok: true };
}

export function setTactics(save: SaveData, tactics: Tactics) {
  save.tactics = tactics;
}

export function setTraining(save: SaveData, training: SaveData["training"]) {
  save.training = training;
}

export function upgradeStadium(save: SaveData): { ok: boolean; error?: string } {
  const next = STADIUM_LEVELS[save.stadium.level];
  if (!next) return { ok: false, error: L(save, "Stadium is already at maximum level.", "ورزشگاه در حداکثر سطح است.") };
  if (save.balance < next.cost) return { ok: false, error: L(save, "Not enough funds for the upgrade.", "بودجه کافی برای ارتقا نیست.") };
  save.balance -= next.cost;
  save.stadium.level += 1;
  save.stadium.capacity = next.capacity;
  save.stadium.ticket = next.ticket;
  save.financeLog.unshift({ week: save.week + 1, income: 0, expense: next.cost, note: `Stadium upgrade → ${next.name}` });
  addNews(save, "finance", `🏟️ Stadium upgraded to ${next.name} (${next.capacity.toLocaleString()} seats).`);
  checkAchievements(save);
  return { ok: true };
}

export function upgradeSponsor(save: SaveData): { ok: boolean; error?: string } {
  const next = SPONSOR_LEVELS[save.sponsor.level];
  if (!next) return { ok: false, error: L(save, "Sponsor is already at maximum level.", "اسپانسر در حداکثر سطح است.") };
  if (save.balance < next.cost) return { ok: false, error: L(save, "Not enough funds.", "بودجه کافی نیست.") };
  save.balance -= next.cost;
  save.sponsor.level += 1;
  save.sponsor.weekly = next.weekly;
  save.weeklyIncome = next.weekly;
  save.financeLog.unshift({ week: save.week + 1, income: 0, expense: next.cost, note: `Sponsor upgrade → ${next.name}` });
  addNews(save, "finance", `🤝 New sponsor deal: ${next.name} (${fmtMoney(next.weekly)}/week).`);
  checkAchievements(save);
  return { ok: true };
}

export function promoteYouth(save: SaveData, youthId: string): { ok: boolean; error?: string } {
  if (save.squad.length >= 28) return { ok: false, error: L(save, "Squad is full (max 28 players).", "تیم پر است (حداکثر ۲۸ بازیکن).") };
  const idx = save.youth.findIndex((y) => y.id === youthId);
  if (idx < 0) return { ok: false, error: L(save, "Youth player not found.", "بازیکن جوان پیدا نشد.") };
  const y = save.youth[idx];
  if (y.age < 16) return { ok: false, error: L(save, `${y.name} is too young (16+ required).`, `${y.name} خیلی جوان است (حداقل ۱۶ سال لازم است).`) };
  const ovr = computeOverall({ attrs: y.attrs, pos: y.pos });
  const p: Player = {
    id: `pro-${y.id}`,
    first: y.first,
    last: y.last,
    age: y.age,
    nat: y.nat,
    pos: y.pos,
    attrs: { ...y.attrs },
    pot: y.pot,
    val: playerValue(ovr, y.age),
    wage: wageFor(ovr),
    contract: 104,
    morale: 70,
    cond: 100,
    form: [],
    injury: null,
    susp: 0,
    xp: y.xp,
  };
  save.squad.push(p);
  save.youth.splice(idx, 1);
  save.flags.promotedYouth = (save.flags.promotedYouth ?? 0) + 1;
  addNews(save, "youth", `🎓 ${y.name} promoted from the academy to the first team!`);
  checkAchievements(save);
  return { ok: true };
}

export function releaseYouth(save: SaveData, youthId: string) {
  const idx = save.youth.findIndex((y) => y.id === youthId);
  if (idx >= 0) {
    const y = save.youth[idx];
    save.youth.splice(idx, 1);
    addNews(save, "youth", `${y.name} has been released by the academy.`);
  }
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

export function fmtMoney(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1_000_000_000) return `${sign}€${(abs / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `${sign}€${(abs / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1)}M`;
  if (abs >= 1000) return `${sign}€${Math.round(abs / 1000)}K`;
  return `${sign}€${abs}`;
}

export function leagueRowToName(save: SaveData, clubId: string): string {
  return clubDefOf(save, clubId).name;
}

export function clubShort(save: SaveData, clubId: string): string {
  return clubDefOf(save, clubId).short;
}

export function avgSquadOverall(save: SaveData): number {
  const xi = Object.values(save.tactics.lineup)
    .map((id) => save.squad.find((p) => p.id === id))
    .filter((p): p is Player => !!p);
  if (!xi.length) return 0;
  return Math.round(xi.reduce((a, p) => a + computeOverall(p), 0) / xi.length);
}

export function lastResults(save: SaveData): string[] {
  return ((save.flags.lastResults as unknown as string) ?? "").split("").reverse();
}

// Re-exported for convenience in the UI
export type { CupState, FinanceLogEntry, LeagueFixture, MarketPlayer, MatchEvent, TransferOffer, YouthPlayer };
export { ATTR_KEYS };
