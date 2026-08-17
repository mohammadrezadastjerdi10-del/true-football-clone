// Match engine. Pure TS so it runs identically in the browser (live match
// playback) and on the Convex backend (AI vs AI results).

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
}

export interface FormationSlot {
  slot: string;
  role: Pos;
  x: number; // 0-100, attacking direction is up (small y)
  y: number;
}

export const FORMATIONS: Record<string, { name: string; slots: FormationSlot[] }> = {
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
  return FORMATIONS[key]?.slots ?? FORMATIONS["4-4-2"].slots;
}

// ---------------------------------------------------------------------------
// Player / team strength
// ---------------------------------------------------------------------------

export function roleFit(pos: Pos, role: Pos): number {
  if (pos === role) return 1;
  if (role === "GK") return 0.12;
  if (pos === "GK") return 0.1;
  if (pos === "DF") return role === "MF" ? 0.7 : 0.4;
  if (pos === "MF") return role === "FW" ? 0.8 : 0.75;
  // FW
  return role === "MF" ? 0.75 : 0.35;
}

const ROLE_WEIGHTS: Record<Pos, Record<string, number>> = {
  GK: { gk: 0.65, def: 0.2, tec: 0.1, str: 0.05 },
  DF: { def: 0.55, pac: 0.15, pas: 0.1, hea: 0.1, str: 0.1 },
  MF: { pas: 0.28, tec: 0.18, def: 0.12, sho: 0.1, pac: 0.12, str: 0.1, hea: 0.05 },
  FW: { sho: 0.32, pac: 0.2, tec: 0.16, hea: 0.12, pas: 0.1, str: 0.1 },
};

export function roleStrength(p: EnginePlayer, role: Pos): number {
  const w = ROLE_WEIGHTS[role];
  let s = 0;
  for (const k of Object.keys(w) as (keyof PlayerAttrs)[]) {
    s += (p.attrs[k] ?? 0) * w[k];
  }
  const fit = roleFit(p.pos, role);
  return s * fit;
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

export function createMatch(home: EngineSide, away: EngineSide, seed: number): LiveMatch {
  computeSideStrength(home);
  computeSideStrength(away);
  return {
    minute: 0,
    half: 1,
    ended: false,
    atHt: false,
    home,
    away,
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
  const att = ts.onPitch
    .filter((s) => s.role === "FW" || s.role === "MF")
    .reduce((sum, s) => sum + roleStrength(s.p, s.role) * playerFitness(s.p), 0);
  const n = Math.max(1, ts.onPitch.filter((s) => s.role === "FW" || s.role === "MF").length);
  return (att / n) * talkStrengthMod(side, m.half) * (0.88 + side.tactics.mentality * 0.0022);
}

function currentDef(m: LiveMatch, t: 0 | 1): number {
  const side = t === 0 ? m.home : m.away;
  const ts = m.teams[t];
  const def = ts.onPitch
    .filter((s) => s.role === "DF" || s.role === "GK")
    .reduce((sum, s) => sum + roleStrength(s.p, s.role) * playerFitness(s.p), 0);
  const n = Math.max(1, ts.onPitch.filter((s) => s.role === "DF" || s.role === "GK").length);
  return (def / n) * talkStrengthMod(side, m.half) * (1.12 - side.tactics.mentality * 0.0022);
}

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

export function stepMatch(m: LiveMatch, minutes: number): LiveMatch {
  const end = Math.min(m.minute + minutes, 90);
  while (m.minute < end && !m.ended) {
    const minute = m.minute + 1;

    // Half-time boundary
    if (m.half === 1 && minute > 45) {
      m.atHt = true;
      addEvent(m, 45, "ht", 0, "Half-time");
      break;
    }
    if (m.half === 2 && minute > 90) {
      m.ended = true;
      addEvent(m, 90, "ft", 0, "Full-time");
      break;
    }

    m.minute = minute;

    // Possession side
    const mid0 = currentSideMid(m, 0);
    const mid1 = currentSideMid(m, 1);
    let p0 = 0.5 + (mid0 - mid1) * 0.02 + m.teams[0].momentum * 0.004 - m.teams[1].momentum * 0.004;
    p0 += (m.home.tactics.passing - m.away.tactics.passing) * 0.0004;
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
    chanceP *= 1 + (sideA.tactics.mentality - 50) * 0.001;

    if (m.rng.chance(chanceP)) {
      const shooter = m.rng.pick(attackerSide(m, attacker).filter((s) => s.role !== "GK")).p;
      const baseXg = Math.max(0.03, Math.min(0.5, 0.08 + (aAtt - dDef) * 0.006 + (shooter.attrs.sho - 70) * 0.0012));
      m.teams[attacker].shots += 1;
      m.teams[attacker].xg += baseXg;
      const goalP = Math.max(0.04, Math.min(0.55, baseXg * (1 - gkEff / 130)));
      const roll = m.rng.next();
      if (roll < goalP) {
        m.teams[attacker].goals += 1;
        m.teams[attacker].onTarget += 1;
        m.teams[attacker].momentum = Math.min(100, m.teams[attacker].momentum + 25);
        const assistP = m.rng.pick(attackerSide(m, attacker).filter((s) => s.role !== "GK" && s.p.id !== shooter.id)).p;
        const text = m.rng.pick(GOAL_TEXTS).replace("{p}", pname(shooter)).replace("{t}", sideA.short);
        addEvent(m, minute, "goal", attacker, text, shooter.id, assistP.id);
      } else if (roll < goalP + 0.34) {
        const text = m.rng.pick(SAVE_TEXTS).replace("{p}", pname(shooter));
        addEvent(m, minute, "save", attacker, text, shooter.id);
      } else if (roll < goalP + 0.34 + 0.16) {
        m.teams[defender].corners += 1;
        const text = m.rng.pick(CORNER_TEXTS).replace("{t}", sideA.short);
        addEvent(m, minute, "corner", attacker, text, shooter.id);
      } else if (roll < goalP + 0.34 + 0.16 + 0.16) {
        const text = m.rng.pick(WIDE_TEXTS).replace("{p}", pname(shooter));
        addEvent(m, minute, "chance", attacker, text, shooter.id);
      } else if (roll < goalP + 0.34 + 0.16 + 0.16 + 0.07) {
        const text = m.rng.pick(POST_TEXTS).replace("{p}", pname(shooter)).replace("{t}", sideA.short);
        addEvent(m, minute, "post", attacker, text, shooter.id);
      } else {
        const text = m.rng.pick(BLOCK_TEXTS).replace("{p}", pname(shooter));
        addEvent(m, minute, "chance", attacker, text, shooter.id);
      }
    }

    // Fouls / cards
    const pressF = (sideA.tactics.pressing + sideD.tactics.pressing) / 100;
    if (m.rng.chance(0.016 * pressF + 0.008)) {
      const fouler = m.rng.pick(attackerSide(m, defender).filter((s) => s.role !== "GK")).p;
      m.teams[defender].fouls += 1;
      const text = m.rng.pick(FOUL_TEXTS).replace("{p}", pname(fouler));
      addEvent(m, minute, "foul", defender, text, fouler.id);
      if (m.rng.chance(0.16 + pressF * 0.05)) {
        const alreadyYellow = m.events.some((e) => e.type === "yellow" && e.player === fouler.id);
        if (alreadyYellow || m.rng.chance(0.06)) {
          m.teams[defender].reds += 1;
          const text = m.rng.pick(RED_TEXTS).replace("{p}", pname(fouler)).replace("{t}", sideD.short);
          addEvent(m, minute, "red", defender, text, fouler.id);
        } else {
          m.teams[defender].yellows += 1;
          const text = m.rng.pick(YELLOW_TEXTS).replace("{p}", pname(fouler));
          addEvent(m, minute, "yellow", defender, text, fouler.id);
        }
      }
    }

    // Offside
    if (m.rng.chance(0.02)) {
      const off = m.rng.pick(attackerSide(m, attacker).filter((s) => s.role === "FW")).p;
      const text = m.rng.pick(OFFSIDE_TEXTS).replace("{p}", pname(off));
      addEvent(m, minute, "offside", attacker, text, off.id);
    }

    // Injury (skipped when a red card left a team short)
    if (m.rng.chance(0.0028 * (1 - Math.min(0.5, (100 - avgCond(m, attacker)) / 100)))) {
      const victim = m.rng.pick(attackerSide(m, attacker)).p;
      const text = m.rng.pick(INJURY_TEXTS).replace("{p}", pname(victim));
      addEvent(m, minute, "injury", attacker, text, victim.id);
    }
  }
  return m;
}

function currentSideMid(m: LiveMatch, t: 0 | 1): number {
  const ts = m.teams[t];
  const mids = ts.onPitch
    .filter((s) => s.role === "MF")
    .map((s) => roleStrength(s.p, s.role) * playerFitness(s.p));
  if (mids.length === 0) return 55;
  return mids.reduce((a, b) => a + b, 0) / mids.length;
}

function attackerSide(m: LiveMatch, t: 0 | 1): EngineSlot[] {
  return m.teams[t].onPitch;
}

function avgCond(m: LiveMatch, t: 0 | 1): number {
  const arr = m.teams[t].onPitch.map((s) => s.p.cond);
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

export function applyTalk(m: LiveMatch, talk: 0 | 1 | 2): void {
  m.home.talk = talk;
  m.away.talk = 0;
  m.atHt = false;
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
  // Also update the side xi so final XI is consistent
  const side = team === 0 ? m.home : m.away;
  const xiIdx = side.xi.findIndex((s) => s.p.id === outId);
  if (xiIdx >= 0) side.xi[xiIdx] = newSlot;
  computeSideStrength(side);
  const sideName = team === 0 ? m.home.short : m.away.short;
  addEvent(m, m.minute, "sub", team, `${sideName} substitution: ${inSlot.p.name} on for ${outSlot.p.name}.`, outId, inId);
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
      // Assists
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
