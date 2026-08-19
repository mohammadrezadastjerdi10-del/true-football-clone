import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useSave } from "@/hooks/use-save";
import {
  applySub,
  computeRatings,
  createMatch,
  finalStats,
  setMentality,
  setTeamTalk,
  stepMatch,
  type LiveMatch,
} from "@/lib/game/engine";
import { buildEngineSideFromSquad, buildOpponentSide, clubDefOf, playerName } from "@/lib/game/sim";
import type { ClubDef } from "@/lib/game/world";
import { hashSeed } from "@/lib/game/rng";
import type { NextEvent, SaveData, ScorerRec } from "@/lib/game/types";
import { Crest, PosBadge } from "@/components/game/shared";
import { cn } from "@/lib/utils";
import { num, useLang } from "@/lib/i18n";
import { ArrowLeft, CheckCircle2, Loader2, Play, SkipForward } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

interface SubRec {
  outId: string;
  inId: string;
  minute: number;
}

export function MatchView({
  save,
  ev,
  onClose,
}: {
  save: SaveData;
  ev: NextEvent;
  onClose: () => void;
}) {
  const { finishMatch, isLoading } = useSave();
  const { t, lang } = useLang();
  const isHome = ev.fixture ? ev.fixture.home === save.clubId : true;
  const userTeam: 0 | 1 = isHome ? 0 : 1;
  const club = clubDefOf(save, save.clubId);
  const oppClub = ev.fixture ? clubDefOf(save, ev.fixture.home === save.clubId ? ev.fixture.away : ev.fixture.home) : club;

  const seed = useMemo(
    () => hashSeed("match", save.clubId, save.seed, save.week + 1, ev.round, ev.type),
    [save.clubId, save.seed, save.week, ev.round, ev.type],
  );

  const [match, setMatch] = useState<LiveMatch>(() => {
    const mySide = buildEngineSideFromSquad(save, save.squad, isHome, seed);
    const oppSide = buildOpponentSide(save, oppClub.id, seed);
    return createMatch(isHome ? mySide : oppSide, isHome ? oppSide : mySide, seed, save.lang ?? "en");
  });
  const [subs, setSubs] = useState<SubRec[]>([]);
  const [subTarget, setSubTarget] = useState<string | null>(null);
  const [mentality, setMentalityDraft] = useState(match.home.tactics.mentality);
  const [saving, setSaving] = useState(false);

  const mySide = userTeam === 0 ? match.home : match.away;
  const oppSide = userTeam === 0 ? match.away : match.home;
  const myGoals = match.teams[userTeam].goals;
  const oppGoals = match.teams[1 - userTeam].goals;
  const step = (mins: number) => {
    if (match.ended || match.atHt) return;
    setMatch({ ...stepMatch(match, mins) });
  };

  const atHt = match.atHt && match.half === 1;
  const talk = (t: 0 | 1 | 2) => {
    setTeamTalk(match, userTeam, t);
    // The engine pauses at half-time; the caller is responsible for
    // starting the second half after the team talk.
    match.half = 2;
    setMatch({ ...match });
  };

  const doSub = (inId: string) => {
    if (!subTarget) return;
    const ok = applySub(match, userTeam, subTarget, inId);
    if (ok) {
      setSubs((s) => [...s, { outId: subTarget, inId, minute: match.minute }]);
      setSubTarget(null);
      setMatch({ ...match });
    }
  };

  const confirmResult = async () => {
    setSaving(true);
    try {
      const stats = finalStats(match);
      const ratings = computeRatings(match);
      const scorers: ScorerRec[] = match.events
        .filter((e) => e.type === "goal" && e.team === userTeam && e.player)
        .map((e) => ({ playerId: e.player!, minute: e.minute }));
      const cards = match.events
        .filter((e) => (e.type === "yellow" || e.type === "red") && e.team === userTeam && e.player)
        .map((e) => ({ playerId: e.player!, type: e.type as "yellow" | "red" }));
      const injuries = match.events
        .filter((e) => e.type === "injury" && e.team === userTeam && e.player)
        .map((e) => ({ playerId: e.player!, weeks: 2, type: "Knock" }));

      await finishMatch({
        kind: ev.type === "cup" ? "cup" : "league",
        round: ev.round,
        home: ev.fixture!.home,
        away: ev.fixture!.away,
        hg: match.teams[0].goals,
        ag: match.teams[1].goals,
        stats,
        ratings,
        scorers,
        cards,
        injuries,
        subs,
        xi: mySide.xi.map((s) => s.p.id),
        homeTeam: clubDefOf(save, ev.fixture!.home).name,
        awayTeam: clubDefOf(save, ev.fixture!.away).name,
      });
      toast.success(
        myGoals > oppGoals
          ? t("mv.winToast")
          : myGoals === oppGoals
            ? t("mv.drawToast")
            : t("mv.loseToast"),
      );
      onClose();
    } catch (e) {
      console.error(e);
      toast.error(t("mv.resultError"));
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const ratings = match.ended ? computeRatings(match) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground" onClick={onClose}>
          <ArrowLeft className="size-4 rtl:rotate-180" />
          {t("mv.back")}
        </Button>
        <div className="rounded-lg border border-white/8 bg-white/[0.03] px-3 py-1.5 font-mono text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {ev.type === "cup" ? t("mv.cup", { round: t(`cup.r${ev.round}`) }) : t("mv.league", { round: num(lang, ev.round) })} · {isHome ? t("mv.home") : t("mv.away")}
        </div>
      </div>

      {/* Scoreboard */}
      <div className="overflow-hidden rounded-2xl border border-white/8 bg-card">
        <div className="flex items-center justify-between border-b border-white/5 px-6 py-3">
          <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            {match.ended ? t("mv.fulltime") : atHt ? t("mv.halftime") : t("mv.live", { min: num(lang, match.minute) })}
          </div>
          <div className="flex gap-1.5">
            {[0, 1].map((teamIdx) => (
              <span
                key={teamIdx}
                className={cn(
                  "rounded-md px-2 py-0.5 font-mono text-[10px] font-bold uppercase tabular-nums",
                  teamIdx === userTeam ? "bg-emerald-500/15 text-emerald-300" : "bg-white/5 text-muted-foreground",
                )}
              >
                {teamIdx === userTeam ? t("mv.you") : t("mv.opp")}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 px-6 py-8">
          <TeamScore club={clubDefOf(save, mySide.id)} goals={myGoals} highlight />
          <div className="text-center">
            <div className="font-mono text-5xl font-bold tabular-nums tracking-tight">
              {num(lang, myGoals)}
              <span className="mx-2 text-muted-foreground/50">–</span>
              {num(lang, oppGoals)}
            </div>
            <div className="mt-2 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              {match.ended ? t("mv.finalWhistle") : match.minute <= 45 ? t("mv.minute", { min: num(lang, match.minute) }) : t("mv.secondHalf")}
            </div>
          </div>
          <TeamScore club={clubDefOf(save, oppSide.id)} goals={oppGoals} />
        </div>

        {/* Stats */}
        <div className="border-t border-white/5 px-6 py-5">
          <div className="mb-2 flex justify-between text-[11px] font-medium text-muted-foreground">
            <span className="text-emerald-400">{num(lang, statsPct(match, userTeam))}%</span>
            <span>{t("mv.possession")}</span>
            <span>{num(lang, statsPct(match, (1 - userTeam) as 0 | 1))}%</span>
          </div>
          <div className="flex h-1.5 gap-1 overflow-hidden rounded-full">
            <div className="rounded-full bg-emerald-500" style={{ width: `${statsPct(match, userTeam)}%` }} />
            <div className="flex-1 rounded-full bg-white/10" />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3 text-center sm:grid-cols-5">
            {[
              [t("mv.shots"), match.teams[userTeam].shots, match.teams[1 - userTeam].shots],
              [t("mv.onTarget"), match.teams[userTeam].onTarget, match.teams[1 - userTeam].onTarget],
              [t("mv.corners"), match.teams[userTeam].corners, match.teams[1 - userTeam].corners],
              [t("mv.fouls"), match.teams[userTeam].fouls, match.teams[1 - userTeam].fouls],
              [t("mv.xg"), match.teams[userTeam].xg, match.teams[1 - userTeam].xg],
            ].map(([label, a, b]) => (
              <div key={label as string} className="rounded-lg bg-white/[0.04] px-2 py-2.5">
                <div className="font-mono text-sm font-semibold tabular-nums">
                  {num(lang, Number(a))} <span className="text-muted-foreground/60">–</span> {num(lang, Number(b))}
                </div>
                <div className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                  {label as string}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <div className="rounded-2xl border border-white/8 bg-card p-5">
          {atHt ? (
            <div>
              <p className="text-sm font-semibold">{t("mv.teamTalk")}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("mv.teamTalkSub", { opp: num(lang, oppGoals), you: num(lang, myGoals) })}
              </p>
              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                {(
                  [
                    [0, "mv.stayCalm", "mv.stayCalmSub"],
                    [1, "mv.positive", "mv.positiveSub"],
                    [2, "mv.firedUp", "mv.firedUpSub"],
                  ] as const
                ).map(([talkId, labelKey, subKey]) => (
                  <Button key={talkId} variant="outline" className="h-auto flex-col gap-0.5 rounded-xl border-white/10 py-3" onClick={() => talk(talkId)}>
                    <span className="text-sm font-semibold">{t(labelKey)}</span>
                    <span className="text-[11px] font-normal text-muted-foreground">{t(subKey)}</span>
                  </Button>
                ))}
              </div>
            </div>
          ) : match.ended ? (
            <div>
              <p className="text-sm font-semibold text-emerald-400">
                {myGoals > oppGoals ? t("mv.victory") : myGoals === oppGoals ? t("mv.pointsShared") : t("mv.defeat")}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("mv.confirmText")}
              </p>
              <Button className="mt-4 w-full rounded-xl" size="lg" onClick={confirmResult} disabled={saving}>
                {saving ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                {t("mv.confirm")}
              </Button>
            </div>
          ) : (
            <div>
              <p className="text-sm font-semibold">{t("mv.control")}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("mv.controlSub")}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="outline" size="sm" className="gap-1.5 rounded-lg border-white/10" onClick={() => step(1)}>
                  <Play className="size-3.5" /> {t("mv.min1")}
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5 rounded-lg border-white/10" onClick={() => step(5)}>
                  <SkipForward className="size-3.5" /> {t("mv.min5")}
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5 rounded-lg border-white/10" onClick={() => step(match.half === 1 ? 45 - match.minute : 90 - match.minute)}>
                  <SkipForward className="size-3.5" /> {t(match.half === 1 ? "mv.toHalftime" : "mv.toFulltime")}
                </Button>
              </div>
              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="font-medium text-muted-foreground">{t("mv.mentality")}</span>
                  <span className="font-mono tabular-nums text-emerald-400">{num(lang, mentality)}</span>
                </div>
                <Slider
                  value={[mentality]}
                  min={0}
                  max={100}
                  step={5}
                  onValueChange={([v]) => {
                    setMentalityDraft(v);
                    setMentality(match, userTeam, v);
                    setMatch({ ...match });
                  }}
                />
                <div className="mt-1.5 flex justify-between text-[10px] text-muted-foreground">
                  <span>{t("mv.defensive")}</span>
                  <span>{t("mv.attacking")}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Events feed */}
        <div className="rounded-2xl border border-white/8 bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {t("mv.commentary")}
          </p>
          <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto pr-1">
            {match.events.length === 0 && (
              <li className="py-8 text-center text-sm text-muted-foreground">
                {t("mv.emptyCommentary")}
              </li>
            )}
            {[...match.events].reverse().map((e, i) => (
              <li key={i} className="flex gap-3 text-sm leading-relaxed">
                <span
                  className={cn(
                    "mt-0.5 w-8 shrink-0 text-right font-mono text-xs tabular-nums",
                    e.type === "goal"
                      ? "font-bold text-emerald-400"
                      : e.type === "red"
                        ? "font-bold text-red-400"
                        : "text-muted-foreground",
                  )}
                >
                  {num(lang, e.minute)}'
                </span>
                <span
                  className={cn(
                    e.type === "goal" && "font-medium text-foreground",
                    e.type === "red" && "text-red-300",
                    e.type === "ht" || e.type === "ft" ? "text-muted-foreground" : "text-foreground/80",
                  )}
                >
                  {e.text}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Lineups */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/8 bg-card p-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-400">
            {t("mv.yourXI")}
          </p>
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {mySide.xi.map((s) => (
              <button
                key={s.p.id}
                type="button"
                onClick={() => setSubTarget(match.ended ? null : subTarget === s.p.id ? null : s.p.id)}
                className={cn(
                  "flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                  subTarget === s.p.id
                    ? "border-amber-400/50 bg-amber-400/10"
                    : "border-white/5 bg-white/[0.02] hover:border-white/15",
                  match.ended && "cursor-default",
                )}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <PosBadge pos={s.role} />
                  <span className="truncate font-medium">{s.p.name}</span>
                </span>
                <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
                  {ratings ? ratings[s.p.id]?.toFixed(1) : "—"}
                </span>
              </button>
            ))}
          </div>
          {!match.ended && (
            <p className="mt-3 text-[11px] text-muted-foreground">
              {subTarget ? t("mv.pickSub") : t("mv.tapStarter")}
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-white/8 bg-card p-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {t("mv.bench")}{subs.length >= 3 ? ` · ${t("mv.allSubsUsed")}` : ` · ${t("mv.subsLeft", { n: num(lang, 3 - subs.length) })}`}
          </p>
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {mySide.bench.map((s) => (
              <button
                key={s.p.id}
                type="button"
                disabled={match.ended || subs.length >= 3 || !subTarget}
                onClick={() => doSub(s.p.id)}
                className="flex items-center gap-2 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2 text-left text-sm transition-colors enabled:hover:border-emerald-500/40 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <PosBadge pos={s.p.pos} />
                <span className="truncate font-medium">{s.p.name}</span>
                <span className="ml-auto text-[10px] uppercase tracking-wider text-muted-foreground">
                  {t("mv.sub")}
                </span>
              </button>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground">
            {t("mv.starters", { name: oppSide.name, n: num(lang, oppSide.xi.length) })}
          </p>
        </div>
      </div>
    </div>
  );
}

function statsPct(m: LiveMatch, t: 0 | 1): number {
  const total = m.teams[0].posMin + m.teams[1].posMin;
  if (!total) return 50;
  return Math.round((m.teams[t].posMin / total) * 100);
}

function TeamScore({
  club,
  goals,
  highlight,
}: {
  club: ClubDef;
  goals: number;
  highlight?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <Crest club={club} size={48} />
      <div className="flex items-center gap-1.5">
        <span className="font-mono text-xl font-bold tabular-nums">{goals}</span>
        <span className="max-w-[90px] truncate text-xs font-medium text-muted-foreground">
          {club.short}
        </span>
        {highlight && <span className="size-1.5 rounded-full bg-emerald-400" />}
      </div>
    </div>
  );
}
