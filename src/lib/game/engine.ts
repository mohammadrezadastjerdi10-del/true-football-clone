// Match engine. Pure TS so it runs identically in the browser (live match
// playback) and on the Convex backend (AI vs AI results).
//
// Uses 37-attribute system with position-dependent weighting.

import { Rng } from "./rng";
import type { MatchEvent, MatchEventType, MatchStats, PlayerAttrs, Pos } from "./types";

export interface EnginePlayer {
  id: string;
  name: string;
  pos: Pos;
  attrs: PlayerAttrs;
  morale: number;
  cond: number;
  form: number; // average of recent ratings (0 = unknown -> neutral)
}

export interface EngineSlot {
  p: EnginePlayer;
  slot: string;
  role: Pos;
}

export interface EngineSide {
  id: string;
  name: string;
  short: string;
  p1: string;
  p2: string;
  xi: EngineSlot[];
  bench: EngineSlot[];
  tactics: { mentality: number; pressing: number; passing: number; tempo: number };
  str: { att: number; def: number; mid: number; gk: number };
  talk: 0 | 1 | 2; // halftime team talk: 0 none, 1 positive, 2 fired-up
}

export interface TeamState {
  goals: number;
  shots: number;
  onTarget: number;
  corners: number;
  fouls: number;
  yellows: number;
  reds: number;
  xg: number;
  posMin: number;
  momentum: number;
  onPitch: EngineSlot[];
  subsUsed: number;
}

export interface LiveMatch {
  minute: number;
  half: 1 | 2;
  ended: boolean;
  atHt: boolean;
  home: EngineSide;
  away: EngineSide;
  teams: [TeamState, TeamState];
  events: MatchEvent[];
  rng: Rng;
  lang: "en" | "fa";
}

export interface FormationSlot {
  slot: string;
  role: Pos;
  x: number; // 0-100, attacking direction is up (small y)
  y: number;
  key: string; // unique per slot instance ("CB-2"), used as the lineup key
}

type FormationSlotDef = Omit<FormationSlot, "key">;

export const FORMATIONS: Record<string, { name: string; slots: FormationSlotDef[] }> = {
  "4-4-2": {
    name: "4-4-2",
    slots: [
      { slot: "GK", role: "GK", x: 50, y: 96 },
      { slot: "LB", role: "DF", x: 14, y: 78 },
      { slot: "CB", role: "DF", x: 37, y: 83 },
      { slot: "CB", role: "DF", x: 63, y: 83 },
      { slot: "RB", role: "DF", x: 86, y: 78 },
      { slot: "LM", role: "MF", x: 14, y: 52 },
      { slot: "CM", role: "MF", x: 40, y: 56 },
      { slot: "CM", role: "MF", x: 60, y: 56 },
      { slot: "RM", role: "MF", x: 86, y: 52 },
      { slot: "ST", role: "FW", x: 40, y: 22 },
      { slot: "ST", role: "FW", x: 60, y: 22 },
    ],
  },
  "4-3-3": {
    name: "4-3-3",
    slots: [
      { slot: "GK", role: "GK", x: 50, y: 96 },
      { slot: "LB", role: "DF", x: 14, y: 78 },
      { slot: "CB", role: "DF", x: 37, y: 83 },
      { slot: "CB", role: "DF", x: 63, y: 83 },
      { slot: "RB", role: "DF", x: 86, y: 78 },
      { slot: "CM", role: "MF", x: 30, y: 56 },
      { slot: "CM", role: "MF", x: 50, y: 52 },
      { slot: "CM", role: "MF", x: 70, y: 56 },
      { slot: "LW", role: "FW", x: 18, y: 26 },
      { slot: "ST", role: "FW", x: 50, y: 18 },
      { slot: "RW", role: "FW", x: 82, y: 26 },
    ],
  },
  "4-2-3-1": {
    name: "4-2-3-1",
    slots: [
      { slot: "GK", role: "GK", x: 50, y: 96 },
      { slot: "LB", role: "DF", x: 14, y: 78 },
      { slot: "CB", role: "DF", x: 37, y: 83 },
      { slot: "CB", role: "DF", x: 63, y: 83 },
      { slot: "RB", role: "DF", x: 86, y: 78 },
      { slot: "DM", role: "MF", x: 35, y: 62 },
      { slot: "DM", role: "MF", x: 65, y: 62 },
      { slot: "AM", role: "MF", x: 24, y: 40 },
      { slot: "AM", role: "MF", x: 50, y: 36 },
      { slot: "AM", role: "MF", x: 76, y: 40 },
      { slot: "ST", role: "FW", x: 50, y: 18 },
    ],
  },
  "3-5-2": {
    name: "3-5-2",
    slots: [
      { slot: "GK", role: "GK", x: 50, y: 96 },
      { slot: "CB", role: "DF", x: 30, y: 84 },
      { slot: "CB", role: "DF", x: 50, y: 87 },
      { slot: "CB", role: "DF", x: 70, y: 84 },
      { slot: "LM", role: "MF", x: 12, y: 55 },
      { slot: "CM", role: "MF", x: 35, y: 58 },
      { slot: "CM", role: "MF", x: 65, y: 58 },
      { slot: "RM", role: "MF", x: 88, y: 55 },
      { slot: "AM", role: "MF", x: 50, y: 42 },
      { slot: "ST", role: "FW", x: 40, y: 20 },
      { slot: "ST", role: "FW", x: 60, y: 20 },
    ],
  },
  "5-3-2": {
    name: "5-3-2",
    slots: [
      { slot: "GK", role: "GK", x: 50, y: 96 },
      { slot: "LWB", role: "DF", x: 10, y: 70 },
      { slot: "CB", role: "DF", x: 32, y: 86 },
      { slot: "CB", role: "DF", x: 50, y: 89 },
      { slot: "CB", role: "DF", x: 68, y: 86 },
      { slot: "RWB", role: "DF", x: 90, y: 70 },
      { slot: "CM", role: "MF", x: 35, y: 55 },
      { slot: "CM", role: "MF", x: 65, y: 55 },
      { slot: "AM", role: "MF", x: 50, y: 40 },
      { slot: "ST", role: "FW", x: 40, y: 20 },
      { slot: "ST", role: "FW", x: 60, y: 20 },
    ],
  },
  "4-5-1": {
    name: "4-5-1",
    slots: [
      { slot: "GK", role: "GK", x: 50, y: 96 },
      { slot: "LB", role: "DF", x: 14, y: 78 },
      { slot: "CB", role: "DF", x: 37, y: 83 },
      { slot: "CB", role: "DF", x: 63, y: 83 },
      { slot: "RB", role: "DF", x: 86, y: 78 },
      { slot: "LM", role: "MF", x: 14, y: 52 },
      { slot: "CM", role: "MF", x: 38, y: 56 },
      { slot: "CM", role: "MF", x: 62, y: 56 },
      { slot: "RM", role: "MF", x: 86, y: 52 },
      { slot: "AM", role: "MF", x: 50, y: 38 },
      { slot: "ST", role: "FW", x: 50, y: 18 },
    ],
  },
  "3-4-3": {
    name: "3-4-3",
    slots: [
      { slot: "GK", role: "GK", x: 50, y: 96 },
      { slot: "CB", role: "DF", x: 30, y: 84 },
      { slot: "CB", role: "DF", x: 50, y: 87 },
      { slot: "CB", role: "DF", x: 70, y: 84 },
      { slot: "LM", role: "MF", x: 14, y: 54 },
      { slot: "CM", role: "MF", x: 38, y: 58 },
      { slot: "CM", role: "MF", x: 62, y: 58 },
      { slot: "RM", role: "MF", x: 86, y: 54 },
      { slot: "LW", role: "FW", x: 20, y: 24 },
      { slot: "ST", role: "FW", x: 50, y: 18 },
      { slot: "RW", role: "FW", x: 80, y: 24 },
    ],
  },
};

export function formationSlots(key: string): FormationSlot[] {
  const slots = FORMATIONS[key]?.slots ?? FORMATIONS["4-4-2"].slots;
  return slots.map((s, i) => ({ ...s, key: `${s.slot}-${i + 1}` }));
}

// ---------------------------------------------------------------------------
// 37-attribute position-dependent weighting for match simulation
// ---------------------------------------------------------------------------

/** Weight map: how much each attribute contributes to a given on-pitch role. */
const ROLE_WEIGHTS: Record<Pos, Partial<Record<keyof PlayerAttrs, number>>> = {
  GK: {
    reflexes: 0.2, handling: 0.15, gkPositioning: 0.15, oneOnOne: 0.1,
    kicking: 0.08, throwing: 0.05, aerialAbility: 0.07, communication: 0.05,
    positioning: 0.03, decisions: 0.02,
  },
  DF: {
    tackling: 0.18, marking: 0.15, heading: 0.1, positioning: 0.12,
    composure: 0.06, concentration: 0.06, strength: 0.08, acceleration: 0.05,
    sprintSpeed: 0.04, jumping: 0.05, teamwork: 0.04, bravery: 0.04,
    decisions: 0.03,
  },
  MF: {
    passing: 0.12, shortPassing: 0.1, vision: 0.1, decisions: 0.08,
    composure: 0.07, tackling: 0.06, teamwork: 0.06, workRate: 0.06,
    stamina: 0.06, ballControl: 0.05, firstTouch: 0.05, dribbling: 0.04,
    positioning: 0.04, anticipation: 0.04, determination: 0.04,
    crossing: 0.03, longPassing: 0.02,
  },
  FW: {
    finishing: 0.18, composure: 0.1, dribbling: 0.08, acceleration: 0.08,
    sprintSpeed: 0.07, firstTouch: 0.06, ballControl: 0.06, heading: 0.06,
    positioning: 0.06, decisions: 0.05, balance: 0.04, agility: 0.04,
    longShots: 0.04, penalties: 0.03, determination: 0.03,
  },
};

// Special defensive contribution weights
const DEF_CONTRIB: Partial<Record<keyof PlayerAttrs, number>> = {
  tackling: 0.2, marking: 0.18, positioning: 0.15, heading: 0.08,
  composure: 0.06, concentration: 0.06, strength: 0.08, jumping: 0.05,
  bravery: 0.04, teamwork: 0.05, decisions: 0.03, anticipation: 0.04,
};

// Special midfield possession weights
const MID_CONTRIB: Partial<Record<keyof PlayerAttrs, number>> = {
  passing: 0.15, shortPassing: 0.12, vision: 0.1, ballControl: 0.08,
  firstTouch: 0.08, dribbling: 0.06, teamwork: 0.06, decisions: 0.06,
  composure: 0.06, stamina: 0.05, positioning: 0.05, anticipation: 0.04,
  workRate: 0.04, crossing: 0.03, longPassing: 0.04,
};

// Special attacking/creation weights
const ATT_CONTRIB: Partial<Record<keyof PlayerAttrs, number>> = {
  finishing: 0.15, dribbling: 0.1, vision: 0.08, crossing: 0.06,
  longShots: 0.06, firstTouch: 0.06, ballControl: 0.06, acceleration: 0.06,
  sprintSpeed: 0.05, composure: 0.06, decisions: 0.05, agility: 0.04,
  penalties: 0.03, heading: 0.04, balance: 0.04,
};

function weightedSum(attrs: PlayerAttrs, weights: Partial<Record<keyof PlayerAttrs, number>>): number {
  let s = 0;
  let tw = 0;
  for (const [k, w] of Object.entries(weights)) {
    s += (attrs[k as keyof PlayerAttrs] ?? 50) * (w as number);
    tw += w as number;
  }
  return tw > 0 ? s / tw : 50;
}

export function roleFit(pos: Pos, role: Pos): number {
  if (pos === role) return 1;
  if (role === "GK") return 0.12;
  if (pos === "GK") return 0.1;
  if (pos === "DF") return role === "MF" ? 0.7 : 0.4;
  if (pos === "MF") return role === "FW" ? 0.8 : 0.75;
  // FW
  return role === "MF" ? 0.75 : 0.35;
}

export function roleStrength(p: EnginePlayer, role: Pos): number {
  const weights = ROLE_WEIGHTS[role];
  const base = weightedSum(p.attrs, weights);
  const fit = roleFit(p.pos, role);
  return base * fit;
}

/** Attack contribution: used for chance creation and shooting. */
function attackRating(p: EnginePlayer): number {
  return weightedSum(p.attrs, ATT_CONTRIB) * roleFit(p.pos, "FW");
}

/** Defence contribution: used for defending chances. */
function defenceRating(p: EnginePlayer): number {
  return weightedSum(p.attrs, DEF_CONTRIB) * roleFit(p.pos, "DF");
}

/** Midfield contribution: used for possession. */
function midfieldRating(p: EnginePlayer): number {
  return weightedSum(p.attrs, MID_CONTRIB) * roleFit(p.pos, "MF");
}

export function playerFitness(p: EnginePlayer): number {
  const formF = p.form > 0 ? Math.min(1.08, 0.92 + p.form * 0.015) : 1;
  return (0.72 + 0.28 * (0.62 * (p.morale / 100) + 0.38 * (p.cond / 100))) * formF;
}

export function computeSideStrength(side: EngineSide): void {
  let att = 0;
  let def = 0;
  let mid = 0;
  let gk = 0;
  for (const s of side.xi) {
    const eff = roleStrength(s.p, s.role) * playerFitness(s.p);
    if (s.role === "FW") att += eff;
    else if (s.role === "DF") def += eff;
    else if (s.role === "MF") mid += eff;
    else gk += eff;
  }
  side.str = {
    att: att / Math.max(1, side.xi.filter((s) => s.role === "FW").length || 1),
    def: def / Math.max(1, side.xi.filter((s) => s.role === "DF").length || 1),
    mid: mid / Math.max(1, side.xi.filter((s) => s.role === "MF").length || 1),
    gk,
  };
}

// ---------------------------------------------------------------------------
// Match creation & stepping
// ---------------------------------------------------------------------------

export function createMatch(home: EngineSide, away: EngineSide, seed: number, lang: "en" | "fa" = "en"): LiveMatch {
  computeSideStrength(home);
  computeSideStrength(away);
  return {
    minute: 0,
    half: 1,
    ended: false,
    atHt: false,
    home,
    away,
    lang,
    teams: [
      {
        goals: 0, shots: 0, onTarget: 0, corners: 0, fouls: 0, yellows: 0, reds: 0, xg: 0,
        posMin: 0, momentum: 0, onPitch: home.xi.map((s) => ({ ...s })), subsUsed: 0,
      },
      {
        goals: 0, shots: 0, onTarget: 0, corners: 0, fouls: 0, yellows: 0, reds: 0, xg: 0,
        posMin: 0, momentum: 0, onPitch: away.xi.map((s) => ({ ...s })), subsUsed: 0,
      },
    ],
    events: [],
    rng: new Rng(seed),
  };
}

function pname(p: EnginePlayer): string {
  return p.name;
}

function addEvent(m: LiveMatch, minute: number, type: MatchEventType, team: 0 | 1, text: string, player?: string, assist?: string) {
  m.events.push({ minute, half: m.half, type, team, text, player, assist });
}

function talkStrengthMod(side: EngineSide, half: 1 | 2): number {
  if (half === 1) return 1;
  if (side.talk === 1) return 1.06;
  if (side.talk === 2) return 1.12;
  return 1;
}

function currentAtt(m: LiveMatch, t: 0 | 1): number {
  const side = t === 0 ? m.home : m.away;
  const ts = m.teams[t];
  const players = ts.onPitch.filter((s) => s.role === "FW" || s.role === "MF");
  let total = 0;
  for (const s of players) {
    total += attackRating(s.p) * playerFitness(s.p);
  }
  const n = Math.max(1, players.length);
  return (total / n) * talkStrengthMod(side, m.half) * (0.82 + side.tactics.mentality * 0.003);
}

function currentDef(m: LiveMatch, t: 0 | 1): number {
  const side = t === 0 ? m.home : m.away;
  const ts = m.teams[t];
  const players = ts.onPitch.filter((s) => s.role === "DF" || s.role === "GK");
  let total = 0;
  for (const s of players) {
    total += defenceRating(s.p) * playerFitness(s.p);
  }
  const n = Math.max(1, players.length);
  return (total / n) * talkStrengthMod(side, m.half) * (1.18 - side.tactics.mentality * 0.003);
}

function currentMid(m: LiveMatch, t: 0 | 1): number {
  const ts = m.teams[t];
  const players = ts.onPitch.filter((s) => s.role === "MF");
  let total = 0;
  for (const s of players) {
    total += midfieldRating(s.p) * playerFitness(s.p);
  }
  return players.length > 0 ? total / players.length : 55;
}

// ---------------------------------------------------------------------------
// Commentary
// ---------------------------------------------------------------------------

const GOAL_TEXTS = [
  "{p} finishes coolly for {t}!",
  "GOAL! {p} finds the net for {t}!",
  "{p} slots it home — {t} strike!",
  "Unstoppable! {p} rifles it in for {t}.",
  "{p} heads home from close range for {t}.",
  "{p} curls one into the corner! {t} lead.",
  "Against the run of play, {p} scores for {t}!",
];
const SAVE_TEXTS = [
  "Great save! {p} is denied.",
  "{p} forces a fine stop from the keeper.",
  "The keeper palms away {p}'s effort.",
];
const WIDE_TEXTS = [
  "{p} drags the shot just wide.",
  "{p} blazes over the bar.",
  "{p} shoots... wide of the post.",
];
const POST_TEXTS = ["{p} hits the woodwork! So close for {t}."];
const BLOCK_TEXTS = ["{p}'s shot is blocked by a defender.", "{p} can't get his shot away — blocked!"];
const CORNER_TEXTS = ["{t} win a corner.", "Corner for {t}."];
const FOUL_TEXTS = ["Foul by {p}.", "{p} brings down an opponent.", "Free kick to the visitors after a foul by {p}."];
const YELLOW_TEXTS = ["{p} is shown a yellow card.", "{p} goes into the book."];
const RED_TEXTS = ["RED CARD! {p} is sent off for {t}!"];
const OFFSIDE_TEXTS = ["{p} is caught offside.", "Offside — {p} strayed too early."];
const INJURY_TEXTS = ["{p} is down and needs treatment.", "{p} limps off after a heavy challenge."];

// Persian commentary pools
const FA_GOAL_TEXTS = [
  "{p} با خونسردی برای {t} گل می‌زند!",
  "گل! {p} دروازه {t} را باز کرد!",
  "{p} توپ را به گوشه دروازه فرستاد — گل برای {t}!",
  "ضربه‌ای غیرقابل مهار! {p} برای {t} گل زد.",
  "{p} با ضربه سر از فاصله کم گل زد — {t}.",
  "{p} توپ را به گوشه دروازه پیچاند! {t} پیش افتاد.",
  "خلاف جریان بازی، {p} برای {t} گل زد!",
];
const FA_SAVE_TEXTS = [
  "سیو عالی! ضربه {p} مهار شد.",
  "{p} دروازه‌بان را به واکنش عالی واداشت.",
  "دروازه‌بان ضربه {p} را دفع کرد.",
];
const FA_WIDE_TEXTS = [
  "{p} ضربه را کمی به بیرون زد.",
  "{p} توپ را بالای دروازه فرستاد.",
  "شوت {p}... بیرون از قاب دروازه.",
];
const FA_POST_TEXTS = ["{p} به تیر دروازه زد! چقدر برای {t} بدشانسی بود."];
const FA_BLOCK_TEXTS = ["ضربه {p} توسط مدافع برگشت داده شد.", "{p} نتوانست شوت بزند — مهار شد!"];
const FA_CORNER_TEXTS = ["{t} صاحب کرنر شد.", "کرنر برای {t}."];
const FA_FOUL_TEXTS = ["خطای {p}.", "{p} حریف را متوقف کرد.", "خطای {p} — ضربه ایستگاهی برای حریف."];
const FA_YELLOW_TEXTS = ["{p} کارت زرد گرفت.", "{p} اخطار گرفت."];
const FA_RED_TEXTS = ["کارت قرمز! {p} از زمین اخراج شد — {t}!"];
const FA_OFFSIDE_TEXTS = ["{p} در موقعیت آفساید بود.", "آفساید — {p} خیلی زود حرکت کرد."];
const FA_INJURY_TEXTS = ["{p} آسیب دید و نیاز به درمان دارد.", "{p} بعد از برخورد شدید از زمین خارج شد."];

const TEXTS: Record<"en" | "fa", Record<string, string[]>> = {
  en: {
    goal: GOAL_TEXTS, save: SAVE_TEXTS, wide: WIDE_TEXTS, post: POST_TEXTS, block: BLOCK_TEXTS,
    corner: CORNER_TEXTS, foul: FOUL_TEXTS, yellow: YELLOW_TEXTS, red: RED_TEXTS,
    offside: OFFSIDE_TEXTS, injury: INJURY_TEXTS,
  },
  fa: {
    goal: FA_GOAL_TEXTS, save: FA_SAVE_TEXTS, wide: FA_WIDE_TEXTS, post: FA_POST_TEXTS, block: FA_BLOCK_TEXTS,
    corner: FA_CORNER_TEXTS, foul: FA_FOUL_TEXTS, yellow: FA_YELLOW_TEXTS, red: FA_RED_TEXTS,
    offside: FA_OFFSIDE_TEXTS, injury: FA_INJURY_TEXTS,
  },
};

function tpick(m: LiveMatch, kind: string): string {
  return m.rng.pick(TEXTS[m.lang][kind]);
}

// ---------------------------------------------------------------------------
// Match stepping
// ---------------------------------------------------------------------------

export function stepMatch(m: LiveMatch, minutes: number): LiveMatch {
  const end = Math.min(m.minute + minutes, 90);
  while (m.minute < end && !m.ended) {
    const minute = m.minute + 1;

    if (m.half === 1 && minute > 45) {
      m.atHt = true;
      addEvent(m, 45, "ht", 0, m.lang === "fa" ? "پایان نیمه اول" : "Half-time");
      break;
    }

    m.minute = minute;

    // Possession side
    const mid0 = currentMid(m, 0);
    const mid1 = currentMid(m, 1);
    let p0 = 0.5 + (mid0 - mid1) * 0.02 + m.teams[0].momentum * 0.004 - m.teams[1].momentum * 0.004;
    p0 += (m.home.tactics.passing - m.away.tactics.passing) * 0.0004;
    p0 += (m.home.tactics.mentality - m.away.tactics.mentality) * 0.0006;
    p0 = Math.min(0.78, Math.max(0.22, p0));
    const attacker: 0 | 1 = m.rng.next() < p0 ? 0 : 1;
    const defender = (1 - attacker) as 0 | 1;
    m.teams[attacker].posMin += 1;

    // Decay momentum
    m.teams[0].momentum = Math.max(-100, m.teams[0].momentum - 2);
    m.teams[1].momentum = Math.max(-100, m.teams[1].momentum - 2);

    const sideA = attacker === 0 ? m.home : m.away;
    const sideD = defender === 0 ? m.home : m.away;
    const aAtt = currentAtt(m, attacker);
    const dDef = currentDef(m, defender);
    const gkEff = defender === 0 ? m.home.str.gk : m.away.str.gk;

    // Chance probability this minute
    const tempoF = 0.5 + (sideA.tactics.tempo + sideD.tactics.tempo) / 200;
    let chanceP = (0.09 + Math.max(0, aAtt - dDef) * 0.0022) * tempoF;
    chanceP *= 1 + (sideA.tactics.mentality - 50) * 0.003;

    if (m.rng.chance(chanceP)) {
      // Pick shooter — weighted toward forwards and attacking mids
      const candidates = attackerSide(m, attacker).filter((s) => s.role !== "GK");
      const shooter = m.rng.pick(candidates).p;

      const finishingAttr = shooter.attrs.finishing ?? 50;
      const baseXg = Math.max(0.03, Math.min(0.5, 0.08 + (aAtt - dDef) * 0.006 + (finishingAttr - 70) * 0.0012));
      m.teams[attacker].shots += 1;
      m.teams[attacker].xg += baseXg;

      const goalP = Math.max(0.04, Math.min(0.55, baseXg * (1 - gkEff / 130)));
      const roll = m.rng.next();

      if (roll < goalP) {
        m.teams[attacker].goals += 1;
        m.teams[attacker].onTarget += 1;
        m.teams[attacker].momentum = Math.min(100, m.teams[attacker].momentum + 25);
        const assistP = m.rng.pick(candidates.filter((s) => s.p.id !== shooter.id)).p;
        const text = tpick(m, "goal").replace("{p}", pname(shooter)).replace("{t}", sideA.short);
        addEvent(m, minute, "goal", attacker, text, shooter.id, assistP.id);
      } else if (roll < goalP + 0.34) {
        const text = tpick(m, "save").replace("{p}", pname(shooter));
        addEvent(m, minute, "save", attacker, text, shooter.id);
        m.teams[attacker].onTarget += 1;
      } else if (roll < goalP + 0.34 + 0.16) {
        m.teams[defender].corners += 1;
        const text = tpick(m, "corner").replace("{t}", sideA.short);
        addEvent(m, minute, "corner", attacker, text, shooter.id);
      } else if (roll < goalP + 0.34 + 0.16 + 0.16) {
        const text = tpick(m, "wide").replace("{p}", pname(shooter));
        addEvent(m, minute, "chance", attacker, text, shooter.id);
      } else if (roll < goalP + 0.34 + 0.16 + 0.16 + 0.07) {
        const text = tpick(m, "post").replace("{p}", pname(shooter)).replace("{t}", sideA.short);
        addEvent(m, minute, "post", attacker, text, shooter.id);
      } else {
        const text = tpick(m, "block").replace("{p}", pname(shooter));
        addEvent(m, minute, "chance", attacker, text, shooter.id);
      }
    }

    // Fouls / cards
    const pressF = (sideA.tactics.pressing + sideD.tactics.pressing) / 100;
    if (m.rng.chance(0.016 * pressF + 0.008)) {
      const fouler = m.rng.pick(attackerSide(m, defender).filter((s) => s.role !== "GK")).p;
      m.teams[defender].fouls += 1;
      const text = tpick(m, "foul").replace("{p}", pname(fouler));
      addEvent(m, minute, "foul", defender, text, fouler.id);
      if (m.rng.chance(0.16 + pressF * 0.05)) {
        const alreadyYellow = m.events.some((e) => e.type === "yellow" && e.player === fouler.id);
        if (alreadyYellow || m.rng.chance(0.06)) {
          m.teams[defender].reds += 1;
          const text = tpick(m, "red").replace("{p}", pname(fouler)).replace("{t}", sideD.short);
          addEvent(m, minute, "red", defender, text, fouler.id);
        } else {
          m.teams[defender].yellows += 1;
          const text = tpick(m, "yellow").replace("{p}", pname(fouler));
          addEvent(m, minute, "yellow", defender, text, fouler.id);
        }
      }
    }

    // Offside
    if (m.rng.chance(0.02)) {
      const off = m.rng.pick(attackerSide(m, attacker).filter((s) => s.role === "FW")).p;
      const text = tpick(m, "offside").replace("{p}", pname(off));
      addEvent(m, minute, "offside", attacker, text, off.id);
    }

    // Injury
    if (m.rng.chance(0.0028 * (1 - Math.min(0.5, (100 - avgCond(m, attacker)) / 100)))) {
      const victim = m.rng.pick(attackerSide(m, attacker)).p;
      const text = tpick(m, "injury").replace("{p}", pname(victim));
      addEvent(m, minute, "injury", attacker, text, victim.id);
    }

    if (m.half === 2 && minute >= 90) {
      m.ended = true;
      addEvent(m, 90, "ft", 0, m.lang === "fa" ? "پایان بازی" : "Full-time");
    }
  }
  return m;
}

function attackerSide(m: LiveMatch, t: 0 | 1): EngineSlot[] {
  return m.teams[t].onPitch;
}

function avgCond(m: LiveMatch, t: 0 | 1): number {
  const arr = m.teams[t].onPitch.map((s) => s.p.cond);
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

export function setTeamTalk(m: LiveMatch, team: 0 | 1, talk: 0 | 1 | 2): void {
  const side = team === 0 ? m.home : m.away;
  side.talk = talk;
  m.atHt = false;
}

export function applyTalk(m: LiveMatch, talk: 0 | 1 | 2): void {
  setTeamTalk(m, 0, talk);
  m.away.talk = 0;
}

export function applySub(m: LiveMatch, team: 0 | 1, outId: string, inId: string): boolean {
  const ts = m.teams[team];
  if (ts.subsUsed >= 3) return false;
  const outIdx = ts.onPitch.findIndex((s) => s.p.id === outId);
  const benchSide = team === 0 ? m.home : m.away;
  const inSlot = benchSide.bench.find((s) => s.p.id === inId);
  if (outIdx < 0 || !inSlot) return false;
  const outSlot = ts.onPitch[outIdx];
  const newSlot: EngineSlot = { p: inSlot.p, slot: outSlot.slot, role: outSlot.role };
  ts.onPitch[outIdx] = newSlot;
  ts.subsUsed += 1;
  const side = team === 0 ? m.home : m.away;
  const xiIdx = side.xi.findIndex((s) => s.p.id === outId);
  if (xiIdx >= 0) side.xi[xiIdx] = newSlot;
  computeSideStrength(side);
  const sideName = team === 0 ? m.home.short : m.away.short;
  const subText =
    m.lang === "fa"
      ? `تعویض ${sideName}: ${inSlot.p.name} به جای ${outSlot.p.name}`
      : `${sideName} substitution: ${inSlot.p.name} on for ${outSlot.p.name}.`;
  addEvent(m, m.minute, "sub", team, subText, outId, inId);
  return true;
}

export function setMentality(m: LiveMatch, team: 0 | 1, v: number): void {
  const side = team === 0 ? m.home : m.away;
  side.tactics.mentality = Math.max(0, Math.min(100, v));
}

// ---------------------------------------------------------------------------
// Ratings & final stats
// ---------------------------------------------------------------------------

export function computeRatings(m: LiveMatch): Record<string, number> {
  const ratings: Record<string, number> = {};
  for (let t = 0 as 0 | 1; t < 2; t++) {
    const side = t === 0 ? m.home : m.away;
    const teamGoals = m.teams[t].goals;
    const conceded = m.teams[1 - t].goals;
    for (const s of side.xi) {
      const p = s.p;
      let r = 4.9 + roleStrength(p, s.role) / 22;
      const events = m.events.filter((e) => e.player === p.id);
      for (const e of events) {
        if (e.type === "goal") r += 1.4;
        if (e.type === "goal" && e.assist) r += 0.05;
        if (e.type === "yellow") r -= 0.3;
        if (e.type === "red") r -= 1.6;
        if (e.type === "injury") r -= 0.5;
      }
      const assists = m.events.filter((e) => e.assist === p.id);
      r += assists.length * 0.9;
      if (s.role !== "GK" && s.role !== "FW") {
        if (teamGoals >= 3) r += 0.2;
        if (conceded === 0) r += 0.5;
        if (conceded >= 3) r -= 0.3;
      }
      if (s.role === "GK") {
        if (conceded === 0) r += 0.7;
        else r -= conceded * 0.12;
      }
      if (m.teams[t].goals > m.teams[1 - t].goals) r += 0.25;
      else if (m.teams[t].goals < m.teams[1 - t].goals) r -= 0.25;
      ratings[p.id] = Math.round(Math.max(4, Math.min(10, r)) * 10) / 10;
    }
  }
  return ratings;
}

export function finalStats(m: LiveMatch): [MatchStats, MatchStats] {
  const posTotal = m.teams[0].posMin + m.teams[1].posMin || 1;
  const stat = (t: 0 | 1): MatchStats => ({
    possession: Math.round((m.teams[t].posMin / posTotal) * 100),
    shots: m.teams[t].shots,
    onTarget: m.teams[t].onTarget,
    corners: m.teams[t].corners,
    fouls: m.teams[t].fouls,
    yellows: m.teams[t].yellows,
    reds: m.teams[t].reds,
    xg: Math.round(m.teams[t].xg * 10) / 10,
  });
  return [stat(0), stat(1)];
}

// ---------------------------------------------------------------------------
// AI quick simulation (aggregate, no commentary)
// ---------------------------------------------------------------------------

export interface QuickResult {
  hg: number;
  ag: number;
  shotsH: number;
  shotsA: number;
  yellowsH: number;
  yellowsA: number;
  redsH: number;
  redsA: number;
}

export function quickSim(
  h: { att: number; def: number; mid: number; gk: number; mentality: number },
  a: { att: number; def: number; mid: number; gk: number; mentality: number },
  seed: number,
): QuickResult {
  const rng = new Rng(seed);
  const lambdaH = Math.max(0.15, 0.75 + (h.att - a.def) * 0.028 + rng.range(-0.35, 0.35));
  const lambdaA = Math.max(0.15, 0.75 + (a.att - h.def) * 0.028 + rng.range(-0.35, 0.35));
  const hg = poisson(rng, lambdaH);
  const ag = poisson(rng, lambdaA);
  return {
    hg,
    ag,
    shotsH: rng.int(4, 18),
    shotsA: rng.int(4, 18),
    yellowsH: rng.int(0, 3),
    yellowsA: rng.int(0, 3),
    redsH: rng.chance(0.05) ? 1 : 0,
    redsA: rng.chance(0.05) ? 1 : 0,
  };
}

function poisson(rng: Rng, lambda: number): number {
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= rng.next();
  } while (p > L);
  return k - 1;
}

/** Expected team strength for a club tier (used for AI vs AI matches). */
export function tierStrength(tier: number): { att: number; def: number; mid: number; gk: number } {
  const base = [86, 81, 77, 73][Math.max(0, Math.min(3, tier - 1))];
  const o = 6;
  return { att: base + o, def: base + o, mid: base + o, gk: base + o };
}
