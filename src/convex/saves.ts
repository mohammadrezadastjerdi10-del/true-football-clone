// Convex API for the football manager game. All game logic lives in
// src/lib/game/* (pure TS shared with the client for the live match engine);
// these functions load the user's save, run the logic, and persist.

import { mutation, query, type MutationCtx } from "./_generated/server";
import { getCurrentUser } from "./users";
import { v } from "convex/values";
import {
  acceptOffer as acceptOfferFor,
  buyPlayer as buyPlayerFor,
  completeWeek,
  createCareer as createCareerData,
  dispatchScout as dispatchScoutFor,
  interactPlayer as interactPlayerFor,
  nextEvent,
  promoteYouth as promoteYouthFor,
  recordUserMatch,
  rejectOffer as rejectOfferFor,
  releaseYouth as releaseYouthFor,
  setTactics as applyTactics,
  setTraining as applyTrainingPlan,
  simulateWeek,
  skipToNextMatch as skipToNextMatchData,
  startNextSeason as startNextSeasonData,
  transferListPlayer as transferListPlayerFor,
  unlistPlayer as unlistPlayerFor,
  upgradeSponsor as upgradeSponsorFor,
  upgradeStadium as upgradeStadiumFor,
  LEAGUE_ROUND_AT_WEEK,
  CUP_ROUND_AT_WEEK,
} from "../lib/game/sim";
import { hashSeed, Rng } from "../lib/game/rng";
import type { FinishedMatch, SaveData, Tactics } from "../lib/game/types";

const statsValidator = v.object({
  possession: v.number(),
  shots: v.number(),
  onTarget: v.number(),
  corners: v.number(),
  fouls: v.number(),
  yellows: v.number(),
  reds: v.number(),
  xg: v.number(),
});

const finishMatchArgs = v.object({
  kind: v.union(v.literal("league"), v.literal("cup")),
  round: v.number(),
  home: v.string(),
  away: v.string(),
  hg: v.number(),
  ag: v.number(),
  stats: v.array(statsValidator),
  ratings: v.record(v.string(), v.number()),
  scorers: v.array(v.object({ playerId: v.string(), minute: v.number() })),
  cards: v.array(v.object({ playerId: v.string(), type: v.union(v.literal("yellow"), v.literal("red")) })),
  injuries: v.array(v.object({ playerId: v.string(), weeks: v.number(), type: v.string() })),
  subs: v.array(v.object({ outId: v.string(), inId: v.string(), minute: v.number() })),
  xi: v.array(v.string()),
  homeTeam: v.string(),
  awayTeam: v.string(),
});

async function loadSave(ctx: MutationCtx) {
  const user = await getCurrentUser(ctx);
  if (!user) throw new Error("Not authenticated");
  const doc = await ctx.db
    .query("saves")
    .withIndex("by_user", (q) => q.eq("userId", user._id))
    .first();
  return { user, doc };
}

export const setLang = mutation({
  args: { lang: v.union(v.literal("en"), v.literal("fa")) },
  handler: async (ctx, args) => {
    const { doc } = await loadSave(ctx);
    if (!doc) throw new Error("No career found");
    const save = doc.data as SaveData;
    save.lang = args.lang;
    await ctx.db.patch(doc._id, { data: save, updatedAt: Date.now() });
    return { ok: true };
  },
});

export const mySave = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return null;
    const doc = await ctx.db
      .query("saves")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();
    if (!doc) return null;
    return { data: doc.data as SaveData, updatedAt: doc.updatedAt };
  },
});

export const createCareer = mutation({
  args: {
    managerName: v.string(),
    managerNat: v.string(),
    clubId: v.string(),
    lang: v.optional(v.union(v.literal("en"), v.literal("fa"))),
    custom: v.optional(
      v.object({
        name: v.string(),
        short: v.string(),
        country: v.string(),
        p1: v.string(),
        p2: v.string(),
        stadium: v.string(),
        capacity: v.number(),
        tier: v.number(),
        academy: v.number(),
        board: v.number(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");
    const existing = await ctx.db
      .query("saves")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    for (const doc of existing) await ctx.db.delete(doc._id);
    const seed = Math.floor(Math.random() * 2 ** 31);
    const save = createCareerData({ seed, managerName: args.managerName.trim() || "Manager", managerNat: args.managerNat, clubId: args.clubId, lang: args.lang ?? "en", custom: args.custom });
    const id = await ctx.db.insert("saves", {
      userId: user._id,
      data: save,
      updatedAt: Date.now(),
    });
    return { id };
  },
});

export const advanceWeek = mutation({
  args: {},
  handler: async (ctx) => {
    const { doc } = await loadSave(ctx);
    if (!doc) throw new Error("No career found");
    const save = doc.data as SaveData;
    const ev = nextEvent(save);
    if (ev.type === "league" || ev.type === "cup") {
      return { advanced: false, reason: "match" };
    }
    const res = simulateWeek(save);
    if (res.advanced) {
      await ctx.db.patch(doc._id, { data: save, updatedAt: Date.now() });
    }
    return { advanced: res.advanced, reason: res.reason ?? "ok" };
  },
});

export const finishMatch = mutation({
  args: finishMatchArgs,
  handler: async (ctx, args) => {
    const { doc } = await loadSave(ctx);
    if (!doc) throw new Error("No career found");
    const save = doc.data as SaveData;
    const ev = nextEvent(save);
    // Find the fixture for the user's club. Try exact match first,
    // then fall back to searching by club ID in the current week.
    let matchKind = ev.type;
    let matchRound = ev.round;
    let fixtureHome = ev.fixture?.home;
    let fixtureAway = ev.fixture?.away;
    if (!fixtureHome || !fixtureAway) {
      // Exact match failed — search fixtures by club ID
      const week = save.week + 1;
      // Try cup fixtures
      const cupRound = CUP_ROUND_AT_WEEK[week - 1];
      if (cupRound > 0 && save.cup.alive.includes(save.clubId) && !save.cup.done) {
        const cupFixtures = save.cup.rounds[cupRound - 1] ?? [];
        const cupFx = cupFixtures.find((f) => !f.played && (f.home === save.clubId || f.away === save.clubId));
        if (cupFx) {
          matchKind = "cup"; matchRound = cupRound;
          fixtureHome = cupFx.home; fixtureAway = cupFx.away;
        }
      }
      // Try league fixtures
      if (!fixtureHome) {
        const leagueRound = LEAGUE_ROUND_AT_WEEK[week - 1];
        if (leagueRound > 0) {
          const leagueFx = save.league.fixtures.find((f) => f.round === leagueRound && !f.played && (f.home === save.clubId || f.away === save.clubId));
          if (leagueFx) {
            matchKind = "league"; matchRound = leagueRound;
            fixtureHome = leagueFx.home; fixtureAway = leagueFx.away;
          }
        }
      }
    }
    if (!fixtureHome || !fixtureAway) {
      throw new Error("No fixture for this match");
    }
    // Verify the submitted fixture matches
    if (fixtureHome !== args.home || fixtureAway !== args.away) {
      // Accept if the clubs match but home/away order differs
      if (!(fixtureHome === args.away && fixtureAway === args.home)) {
        throw new Error("Fixture mismatch");
      }
    }

    const finished: FinishedMatch = {
      id: `${matchKind}-${matchRound}-${save.week + 1}`,
      kind: matchKind as "league" | "cup",
      round: matchRound,
      week: save.week + 1,
      home: args.home,
      away: args.away,
      hg: args.hg,
      ag: args.ag,
      stats: args.stats.slice(0, 2) as [FinishedMatch["stats"][0], FinishedMatch["stats"][1]],
      ratings: args.ratings,
      scorers: args.scorers,
      cards: args.cards,
      injuries: args.injuries,
      subs: args.subs,
      xi: args.xi,
      homeTeam: args.homeTeam,
      awayTeam: args.awayTeam,
    };

    recordUserMatch(save, finished);
    completeWeek(save, new Rng(hashSeed("week", save.clubId, save.seed, save.week + 2)));
    await ctx.db.patch(doc._id, { data: save, updatedAt: Date.now() });
    return { ok: true, phase: save.phase, week: save.week };
  },
});

export const setTactics = mutation({
  args: {
    formation: v.string(),
    mentality: v.number(),
    pressing: v.number(),
    passing: v.number(),
    tempo: v.number(),
    lineup: v.record(v.string(), v.union(v.string(), v.null())),
  },
  handler: async (ctx, args) => {
    const { doc } = await loadSave(ctx);
    if (!doc) throw new Error("No career found");
    const save = doc.data as SaveData;
    const tactics: Tactics = {
      formation: args.formation,
      mentality: Math.max(0, Math.min(100, args.mentality)),
      pressing: Math.max(0, Math.min(100, args.pressing)),
      passing: Math.max(0, Math.min(100, args.passing)),
      tempo: Math.max(0, Math.min(100, args.tempo)),
      lineup: args.lineup,
    };
    applyTactics(save, tactics);
    await ctx.db.patch(doc._id, { data: save, updatedAt: Date.now() });
    return { ok: true };
  },
});

export const setTraining = mutation({
  args: { focus: v.string(), intensity: v.number(), indiv: v.record(v.string(), v.string()) },
  handler: async (ctx, args) => {
    const { doc } = await loadSave(ctx);
    if (!doc) throw new Error("No career found");
    const save = doc.data as SaveData;
    applyTrainingPlan(save, {
      focus: args.focus as SaveData["training"]["focus"],
      intensity: Math.max(0, Math.min(100, args.intensity)),
      indiv: args.indiv as Record<string, SaveData["training"]["focus"]>,
    });
    await ctx.db.patch(doc._id, { data: save, updatedAt: Date.now() });
    return { ok: true };
  },
});

export const skipToNextMatch = mutation({
  args: {},
  handler: async (ctx) => {
    const { doc } = await loadSave(ctx);
    if (!doc) throw new Error("No career found");
    const save = doc.data as SaveData;
    const res = skipToNextMatchData(save);
    if (res.weeks > 0) await ctx.db.patch(doc._id, { data: save, updatedAt: Date.now() });
    return res;
  },
});

export const dispatchScout = mutation({
  args: {
    kind: v.union(v.literal("player"), v.literal("region")),
    targetId: v.string(),
    duration: v.number(),
  },
  handler: async (ctx, args) => {
    const { doc } = await loadSave(ctx);
    if (!doc) throw new Error("No career found");
    const save = doc.data as SaveData;
    const res = dispatchScoutFor(save, args.kind, args.targetId, args.duration);
    if (res.ok) await ctx.db.patch(doc._id, { data: save, updatedAt: Date.now() });
    return res;
  },
});

export const interactPlayer = mutation({
  args: { playerId: v.string(), action: v.union(v.literal("praise"), v.literal("encourage"), v.literal("warn"), v.literal("fine")) },
  handler: async (ctx, args) => {
    const { doc } = await loadSave(ctx);
    if (!doc) throw new Error("No career found");
    const save = doc.data as SaveData;
    const res = interactPlayerFor(save, args.playerId, args.action);
    if (res.ok) await ctx.db.patch(doc._id, { data: save, updatedAt: Date.now() });
    return res;
  },
});

export const buyPlayer = mutation({
  args: { marketId: v.string() },
  handler: async (ctx, args) => {
    const { doc } = await loadSave(ctx);
    if (!doc) throw new Error("No career found");
    const save = doc.data as SaveData;
    const res = buyPlayerFor(save, args.marketId);
    if (res.ok) await ctx.db.patch(doc._id, { data: save, updatedAt: Date.now() });
    return res;
  },
});

export const transferListPlayer = mutation({
  args: { playerId: v.string(), price: v.number() },
  handler: async (ctx, args) => {
    const { doc } = await loadSave(ctx);
    if (!doc) throw new Error("No career found");
    const save = doc.data as SaveData;
    transferListPlayerFor(save, args.playerId, Math.max(100000, args.price));
    await ctx.db.patch(doc._id, { data: save, updatedAt: Date.now() });
    return { ok: true };
  },
});

export const unlistPlayer = mutation({
  args: { playerId: v.string() },
  handler: async (ctx, args) => {
    const { doc } = await loadSave(ctx);
    if (!doc) throw new Error("No career found");
    const save = doc.data as SaveData;
    unlistPlayerFor(save, args.playerId);
    await ctx.db.patch(doc._id, { data: save, updatedAt: Date.now() });
    return { ok: true };
  },
});

export const acceptOffer = mutation({
  args: { playerId: v.string(), offerId: v.string() },
  handler: async (ctx, args) => {
    const { doc } = await loadSave(ctx);
    if (!doc) throw new Error("No career found");
    const save = doc.data as SaveData;
    const res = acceptOfferFor(save, args.playerId, args.offerId);
    if (res.ok) await ctx.db.patch(doc._id, { data: save, updatedAt: Date.now() });
    return res;
  },
});

export const rejectOffer = mutation({
  args: { playerId: v.string(), offerId: v.string() },
  handler: async (ctx, args) => {
    const { doc } = await loadSave(ctx);
    if (!doc) throw new Error("No career found");
    const save = doc.data as SaveData;
    rejectOfferFor(save, args.playerId, args.offerId);
    await ctx.db.patch(doc._id, { data: save, updatedAt: Date.now() });
    return { ok: true };
  },
});

export const upgradeStadium = mutation({
  args: {},
  handler: async (ctx) => {
    const { doc } = await loadSave(ctx);
    if (!doc) throw new Error("No career found");
    const save = doc.data as SaveData;
    const res = upgradeStadiumFor(save);
    if (res.ok) await ctx.db.patch(doc._id, { data: save, updatedAt: Date.now() });
    return res;
  },
});

export const upgradeSponsor = mutation({
  args: {},
  handler: async (ctx) => {
    const { doc } = await loadSave(ctx);
    if (!doc) throw new Error("No career found");
    const save = doc.data as SaveData;
    const res = upgradeSponsorFor(save);
    if (res.ok) await ctx.db.patch(doc._id, { data: save, updatedAt: Date.now() });
    return res;
  },
});

export const promoteYouth = mutation({
  args: { youthId: v.string() },
  handler: async (ctx, args) => {
    const { doc } = await loadSave(ctx);
    if (!doc) throw new Error("No career found");
    const save = doc.data as SaveData;
    const res = promoteYouthFor(save, args.youthId);
    if (res.ok) await ctx.db.patch(doc._id, { data: save, updatedAt: Date.now() });
    return res;
  },
});

export const releaseYouth = mutation({
  args: { youthId: v.string() },
  handler: async (ctx, args) => {
    const { doc } = await loadSave(ctx);
    if (!doc) throw new Error("No career found");
    const save = doc.data as SaveData;
    releaseYouthFor(save, args.youthId);
    await ctx.db.patch(doc._id, { data: save, updatedAt: Date.now() });
    return { ok: true };
  },
});

export const startNextSeason = mutation({
  args: {},
  handler: async (ctx) => {
    const { doc } = await loadSave(ctx);
    if (!doc) throw new Error("No career found");
    const save = doc.data as SaveData;
    if (save.phase !== "season_end") throw new Error("Season is still in progress");
    startNextSeasonData(save);
    await ctx.db.patch(doc._id, { data: save, updatedAt: Date.now() });
    return { ok: true };
  },
});
