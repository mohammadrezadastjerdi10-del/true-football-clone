// Shared types for the football manager game. Pure types only — imported by
// both the Convex backend (simulation) and the React frontend (live match).

export type Pos = "GK" | "DF" | "MF" | "FW";

export const POS_ORDER: Pos[] = ["GK", "DF", "MF", "FW"];

export interface PlayerAttrs {
  gk: number;
  def: number;
  pas: number;
  sho: number;
  hea: number;
  pac: number;
  str: number;
  tec: number;
}

export const ATTR_KEYS = ["gk", "def", "pas", "sho", "hea", "pac", "str", "tec"] as const;
export type AttrKey = (typeof ATTR_KEYS)[number];

export const ATTR_LABELS: Record<AttrKey, string> = {
  gk: "Goalkeeping",
  def: "Defence",
  pas: "Passing",
  sho: "Shooting",
  hea: "Heading",
  pac: "Pace",
  str: "Strength",
  tec: "Technique",
};

export interface Player {
  id: string;
  first: string;
  last: string;
  age: number;
  nat: string; // country id
  pos: Pos;
  attrs: PlayerAttrs;
  pot: number; // potential 0-99
  val: number; // market value (€)
  wage: number; // weekly wage (€)
  contract: number; // weeks remaining
  morale: number; // 0-100
  cond: number; // 0-100
  form: number[]; // last match ratings
  injury: { weeks: number; type: string } | null;
  susp: number; // league matches suspended
  xp: number; // accumulated experience
  star?: boolean; // marquee real-world player
}

export type SlotRole = Pos;

export interface Tactics {
  formation: string; // key of FORMATIONS
  mentality: number; // 0-100 (defensive -> attacking)
  pressing: number; // 0-100
  passing: number; // 0-100 (short -> direct)
  tempo: number; // 0-100
  lineup: Record<string, string | null>; // slot -> player id
}

export type FocusKey =
  | "attack"
  | "defense"
  | "fitness"
  | "shooting"
  | "passing"
  | "goalkeeping"
  | "balanced";

export interface TrainingPlan {
  focus: FocusKey;
  intensity: number; // 0-100
  indiv: Record<string, FocusKey>; // player id -> focus
}

export interface LeagueRow {
  clubId: string;
  p: number;
  w: number;
  d: number;
  l: number;
  gf: number;
  ga: number;
  pts: number;
}

export interface LeagueFixture {
  round: number;
  home: string;
  away: string;
  played: boolean;
  hg?: number;
  ag?: number;
}

export interface CupFixture {
  round: number; // 1-based cup round
  home: string;
  away: string;
  played: boolean;
  hg?: number;
  ag?: number;
  winner?: string;
}

export interface CupState {
  nextRound: number; // round to play next (1-based)
  alive: string[]; // clubs still in the cup
  rounds: CupFixture[][]; // completed fixture lists per round (index 0 = round 1)
  done: boolean;
  winner?: string;
  userWon?: boolean;
}

export type MatchEventType =
  | "kickoff"
  | "chance"
  | "save"
  | "post"
  | "goal"
  | "corner"
  | "foul"
  | "yellow"
  | "red"
  | "offside"
  | "injury"
  | "sub"
  | "ht"
  | "ft";

export interface MatchEvent {
  minute: number;
  half: 1 | 2;
  type: MatchEventType;
  team: 0 | 1;
  text: string;
  player?: string;
  assist?: string;
}

export interface MatchStats {
  possession: number;
  shots: number;
  onTarget: number;
  corners: number;
  fouls: number;
  yellows: number;
  reds: number;
  xg: number;
}

export interface ScorerRec {
  playerId: string;
  minute: number;
}

export interface MarketPlayer {
  id: string;
  first: string;
  last: string;
  age: number;
  nat: string;
  pos: Pos;
  attrs: PlayerAttrs;
  pot: number;
  ovr: number; // overall for the position
  val: number;
  wage: number;
  asking: number;
  morale: number;
  form: number; // avg last rating
}

export interface TransferOffer {
  id: string;
  from: string; // club short name
  amount: number;
  weeklyWage: number;
}

export interface YouthPlayer {
  id: string;
  first: string;
  last: string;
  age: number;
  nat: string;
  pos: Pos;
  attrs: PlayerAttrs;
  pot: number;
  morale: number;
  cond: number;
  xp: number;
  sinceWeek: number;
  name: string;
}

export interface NewsItem {
  week: number;
  kind: "result" | "transfer" | "finance" | "youth" | "match" | "board" | "achievement" | "info" | "cup";
  text: string;
}

export interface SeasonSummary {
  season: number;
  label: string;
  clubId: string;
  pos: number;
  cup: string; // e.g. "Quarter-final"
  balance: number;
  trophies: string[];
}

export interface FinanceLogEntry {
  week: number;
  income: number;
  expense: number;
  note: string;
}

export interface SaveData {
  v: 1;
  seed: number;
  manager: { name: string; nat: string };
  clubId: string;
  season: number; // 1-based
  label: string; // "2025/26"
  week: number; // current week (0 = before week 1)
  phase: "league" | "season_end" | "sacked";
  balance: number;
  stadium: { level: number; capacity: number; ticket: number; name: string };
  sponsor: { level: number; weekly: number };
  squad: Player[];
  youth: YouthPlayer[];
  tactics: Tactics;
  training: TrainingPlan;
  league: { rows: LeagueRow[]; fixtures: LeagueFixture[] };
  cup: CupState;
  market: MarketPlayer[];
  listed: Record<string, number>; // player id -> asking price
  offers: Record<string, TransferOffer[]>; // player id -> offers
  news: NewsItem[];
  achievements: string[];
  history: SeasonSummary[];
  board: number; // 0-100
  flags: Record<string, number>;
  lastMatch: FinishedMatch | null;
  financeLog: FinanceLogEntry[];
  weeklyWage: number;
  weeklyIncome: number;
  seasonTrophies: string[];
}

export interface FinishedMatch {
  id: string;
  kind: "league" | "cup";
  round: number;
  week: number;
  home: string;
  away: string;
  hg: number;
  ag: number;
  stats: [MatchStats, MatchStats];
  ratings: Record<string, number>;
  scorers: ScorerRec[];
  cards: { playerId: string; type: "yellow" | "red" }[];
  injuries: { playerId: string; weeks: number; type: string }[];
  subs: { outId: string; inId: string; minute: number }[];
  xi: string[];
  homeTeam: string;
  awayTeam: string;
}

export interface NextEvent {
  type: "league" | "cup" | "bye" | "season_end";
  round: number;
  week: number;
  fixture: { home: string; away: string; hg?: number; ag?: number } | null;
  cupRoundName?: string;
}
