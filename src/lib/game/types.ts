// Shared types for the football manager game. Pure types only — imported by
// both the Convex backend (simulation) and the React frontend (live match).

export type Pos = "GK" | "DF" | "MF" | "FW";

export const POS_ORDER: Pos[] = ["GK", "DF", "MF", "FW"];

// ---------------------------------------------------------------------------
// 37-attribute system — four categories
// ---------------------------------------------------------------------------

/** Technical attributes (outfield) */
export interface TechAttrs {
  finishing: number;
  longShots: number;
  crossing: number;
  passing: number;
  shortPassing: number;
  longPassing: number;
  dribbling: number;
  ballControl: number;
  firstTouch: number;
  heading: number;
  tackling: number;
  marking: number;
  freeKicks: number;
  penalties: number;
  corners: number;
}

/** Physical attributes (all positions) */
export interface PhysAttrs {
  acceleration: number;
  sprintSpeed: number;
  stamina: number;
  strength: number;
  agility: number;
  balance: number;
  jumping: number;
  fitness: number;
}

/** Mental attributes (all positions) */
export interface MentalAttrs {
  decisions: number;
  composure: number;
  concentration: number;
  positioning: number;
  anticipation: number;
  vision: number;
  teamwork: number;
  workRate: number;
  aggression: number;
  bravery: number;
  leadership: number;
  determination: number;
}

/** Goalkeeper-specific attributes */
export interface GkAttrs {
  reflexes: number;
  handling: number;
  gkPositioning: number;
  oneOnOne: number;
  kicking: number;
  throwing: number;
  aerialAbility: number;
  communication: number;
}

/** Combined 37 attributes for every player */
export interface PlayerAttrs {
  // Technical
  finishing: number;
  longShots: number;
  crossing: number;
  passing: number;
  shortPassing: number;
  longPassing: number;
  dribbling: number;
  ballControl: number;
  firstTouch: number;
  heading: number;
  tackling: number;
  marking: number;
  freeKicks: number;
  penalties: number;
  corners: number;
  // Physical
  acceleration: number;
  sprintSpeed: number;
  stamina: number;
  strength: number;
  agility: number;
  balance: number;
  jumping: number;
  fitness: number;
  // Mental
  decisions: number;
  composure: number;
  concentration: number;
  positioning: number;
  anticipation: number;
  vision: number;
  teamwork: number;
  workRate: number;
  aggression: number;
  bravery: number;
  leadership: number;
  determination: number;
  // Goalkeeper
  reflexes: number;
  handling: number;
  gkPositioning: number;
  oneOnOne: number;
  kicking: number;
  throwing: number;
  aerialAbility: number;
  communication: number;
}

export const ATTR_KEYS: (keyof PlayerAttrs)[] = [
  // Technical
  "finishing", "longShots", "crossing", "passing", "shortPassing", "longPassing",
  "dribbling", "ballControl", "firstTouch", "heading", "tackling", "marking",
  "freeKicks", "penalties", "corners",
  // Physical
  "acceleration", "sprintSpeed", "stamina", "strength", "agility", "balance",
  "jumping", "fitness",
  // Mental
  "decisions", "composure", "concentration", "positioning", "anticipation",
  "vision", "teamwork", "workRate", "aggression", "bravery", "leadership", "determination",
  // Goalkeeper
  "reflexes", "handling", "gkPositioning", "oneOnOne", "kicking", "throwing",
  "aerialAbility", "communication",
] as const;

export type AttrKey = (typeof ATTR_KEYS)[number];

export const ATTR_CATEGORIES = {
  technical: ["finishing", "longShots", "crossing", "passing", "shortPassing", "longPassing", "dribbling", "ballControl", "firstTouch", "heading", "tackling", "marking", "freeKicks", "penalties", "corners"] as AttrKey[],
  physical: ["acceleration", "sprintSpeed", "stamina", "strength", "agility", "balance", "jumping", "fitness"] as AttrKey[],
  mental: ["decisions", "composure", "concentration", "positioning", "anticipation", "vision", "teamwork", "workRate", "aggression", "bravery", "leadership", "determination"] as AttrKey[],
  goalkeeper: ["reflexes", "handling", "gkPositioning", "oneOnOne", "kicking", "throwing", "aerialAbility", "communication"] as AttrKey[],
} as const;

export const ATTR_LABELS: Record<AttrKey, string> = {
  // Technical
  finishing: "Finishing",
  longShots: "Long Shots",
  crossing: "Crossing",
  passing: "Passing",
  shortPassing: "Short Passing",
  longPassing: "Long Passing",
  dribbling: "Dribbling",
  ballControl: "Ball Control",
  firstTouch: "First Touch",
  heading: "Heading",
  tackling: "Tackling",
  marking: "Marking",
  freeKicks: "Free Kicks",
  penalties: "Penalties",
  corners: "Corners",
  // Physical
  acceleration: "Acceleration",
  sprintSpeed: "Sprint Speed",
  stamina: "Stamina",
  strength: "Strength",
  agility: "Agility",
  balance: "Balance",
  jumping: "Jumping",
  fitness: "Fitness",
  // Mental
  decisions: "Decisions",
  composure: "Composure",
  concentration: "Concentration",
  positioning: "Positioning",
  anticipation: "Anticipation",
  vision: "Vision",
  teamwork: "Teamwork",
  workRate: "Work Rate",
  aggression: "Aggression",
  bravery: "Bravery",
  leadership: "Leadership",
  determination: "Determination",
  // Goalkeeper
  reflexes: "Reflexes",
  handling: "Handling",
  gkPositioning: "GK Positioning",
  oneOnOne: "One-on-One",
  kicking: "Kicking",
  throwing: "Throwing",
  aerialAbility: "Aerial Ability",
  communication: "Communication",
};

export const ATTR_LABELS_FA: Record<AttrKey, string> = {
  finishing: "تمام‌کنندگی",
  longShots: "شوت از راه دور",
  crossing: "ارسال",
  passing: "پاس",
  shortPassing: "پاس کوتاه",
  longPassing: "پاس بلند",
  dribbling: "دریبل",
  ballControl: "کنترل توپ",
  firstTouch: "تماس اول",
  heading: "ضربه سر",
  tackling: "تکل",
  marking: "پوشش",
  freeKicks: "ضربات آزاد",
  penalties: "پنالتی",
  corners: "کرنر",
  acceleration: "شتاب",
  sprintSpeed: "سرعت",
  stamina: "استقامت",
  strength: "قدرت",
  agility: "چابکی",
  balance: "تعادل",
  jumping: "پرش",
  fitness: "آمادگی جسمانی",
  decisions: "تصمیم‌گیری",
  composure: "آرامش",
  concentration: "تمرکز",
  positioning: "جاگیری",
  anticipation: "پیش‌بینی",
  vision: "دید",
  teamwork: "کار تیمی",
  workRate: "تلاش",
  aggression: "پرخاشگری",
  bravery: "شجاعت",
  leadership: "رهبری",
  determination: "اراده",
  reflexes: "واکنش",
  handling: "مهار",
  gkPositioning: "جاگیری دروازه‌بان",
  oneOnOne: "یک‌به‌یک",
  kicking: "لگد",
  throwing: "پرتاب",
  aerialAbility: "توان هوایی",
  communication: "ارتباط",
};

// ---------------------------------------------------------------------------
// Player
// ---------------------------------------------------------------------------

export type SlotRole = Pos;

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

// ---------------------------------------------------------------------------
// Tactics
// ---------------------------------------------------------------------------

export interface Tactics {
  formation: string; // key of FORMATIONS
  mentality: number; // 0-100 (defensive -> attacking)
  pressing: number; // 0-100
  passing: number; // 0-100 (short -> direct)
  tempo: number; // 0-100
  lineup: Record<string, string | null>; // slot -> player id
}

// ---------------------------------------------------------------------------
// Training
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// League
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Cup
// ---------------------------------------------------------------------------

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
  byes?: string[]; // clubs that skipped round 1 (optional for legacy saves)
  done: boolean;
  winner?: string;
  userWon?: boolean;
}

// ---------------------------------------------------------------------------
// Match
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Transfer market
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Youth
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// News
// ---------------------------------------------------------------------------

export interface NewsItem {
  week: number;
  kind: "result" | "transfer" | "finance" | "youth" | "match" | "board" | "achievement" | "info" | "cup";
  text: string;
}

// ---------------------------------------------------------------------------
// Season history
// ---------------------------------------------------------------------------

export interface SeasonSummary {
  season: number;
  label: string;
  clubId: string;
  pos: number;
  cup: string; // e.g. "Quarter-final"
  balance: number;
  trophies: string[];
}

// ---------------------------------------------------------------------------
// Finances
// ---------------------------------------------------------------------------

export interface FinanceLogEntry {
  week: number;
  income: number;
  expense: number;
  note: string;
}

// ---------------------------------------------------------------------------
// Board objectives
// ---------------------------------------------------------------------------

export type BoardObjective =
  | "avoid_relegation"
  | "finish_mid_table"
  | "qualify_continentals"
  | "win_league"
  | "win_cup"
  | "develop_youth"
  | "reduce_wages"
  | "maintain_finances"
  | "reach_semi_final";

export interface BoardExpectation {
  objective: BoardObjective;
  priority: "low" | "medium" | "high" | "critical";
  progress: number; // 0-100
}

// ---------------------------------------------------------------------------
// Manager profile
// ---------------------------------------------------------------------------

export interface ManagerProfile {
  name: string;
  nat: string;
  tacticalKnowledge: number; // 0-20
  youthDevelopment: number;
  playerManagement: number;
  motivation: number;
  scoutingKnowledge: number;
  negotiation: number;
  reputation: number; // 0-100
  experience: number; // 0-100
}

// ---------------------------------------------------------------------------
// Save data (entire game state)
// ---------------------------------------------------------------------------

export interface SaveData {
  v: 1;
  seed: number;
  lang?: "en" | "fa";
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

// ---------------------------------------------------------------------------
// Finished match
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Next event (navigation helper)
// ---------------------------------------------------------------------------

export interface NextEvent {
  type: "league" | "cup" | "bye" | "season_end";
  round: number;
  week: number;
  fixture: { home: string; away: string; hg?: number; ag?: number } | null;
  cupRoundName?: string;
}
