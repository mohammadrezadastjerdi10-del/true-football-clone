import { Button } from "@/components/ui/button";
import {
  ChevronRight,
  CircleDollarSign,
  Clock3,
  FastForward,
  Landmark,
  Newspaper,
  Play,
  Trophy,
} from "lucide-react";
import { useSave } from "@/hooks/use-save";
import { clubDefOf, CUP_ROUND_AT_WEEK, LEAGUE_ROUND_AT_WEEK, nextEvent, positionOf, standings } from "@/lib/game/sim";
import { leagueById } from "@/lib/game/world";
import type { NextEvent, SaveData } from "@/lib/game/types";
import { fmtMoney, ordinal } from "@/lib/game/format";
import { Bar, Crest, ResultChips, SectionTitle, Stat } from "@/components/game/shared";
import { cn } from "@/lib/utils";
import { num, useLang } from "@/lib/i18n";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const NEWS_ICON: Record<SaveData["news"][number]["kind"], string> = {
  result: "📋",
  transfer: "✍️",
  finance: "💶",
  youth: "🎓",
  match: "⚽",
  board: "⚠️",
  achievement: "🏆",
  info: "ℹ️",
  cup: "🏅",
};

export function OverviewTab({
  save,
  onPlayMatch,
}: {
  save: SaveData;
  onPlayMatch: (ev: NextEvent) => void;
}) {
  const { advanceWeek, skipToNextMatch, startNextSeason, isLoading } = useSave();
  const { t, lang } = useLang();
  const club = clubDefOf(save, save.clubId);
  const league = leagueById(save.clubId);
  const ev = nextEvent(save);
  const pos = positionOf(save);
  const rows = standings(save);
  const myRow = rows.find((r) => r.clubId === save.clubId)!;
  const oppClub =
    ev.fixture ? clubDefOf(save, ev.fixture.home === save.clubId ? ev.fixture.away : ev.fixture.home) : null;
  const home = ev.fixture ? ev.fixture.home === save.clubId : null;

  const advance = async () => {
    try {
      const res = await advanceWeek();
      if (!res.advanced) toast.info(t("ov.playFirst"));
    } catch {
      toast.error(t("ov.advanceError"));
    }
  };

  const skip = async () => {
    try {
      const res = await skipToNextMatch();
      if (res.weeks > 0) toast.success(t("ov.skipDone", { n: num(lang, res.weeks) }));
    } catch {
      toast.error(t("ov.advanceError"));
    }
  };

  const nextSeason = async () => {
    try {
      await startNextSeason();
      toast.success(t("ov.seasonStarted", { label: save.label }));
    } catch {
      toast.error(t("ov.seasonError"));
    }
  };

  return (
    <div className="space-y-6">
      {/* Club hero */}
      <div className="relative overflow-hidden rounded-2xl border border-white/8">
        <div
          className="absolute inset-0 -z-10"
          style={{
            background: `linear-gradient(135deg, ${club.p1}33 0%, transparent 55%), radial-gradient(700px 240px at 85% -20%, oklch(0.5 0.13 155 / 0.25), transparent)`,
          }}
        />
        <div className="flex flex-wrap items-center justify-between gap-6 p-6 sm:p-8">
          <div className="flex items-center gap-4">
            <Crest club={club} size={64} />
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {club.name}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("ov.leagueLine", { league: league.name, label: save.label, week: num(lang, save.week) })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ResultChips raw={save.flags.lastResults} />
            <div className="rounded-xl border border-white/10 bg-background/60 px-4 py-2 text-end">
              <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                {t("ov.position")}
              </div>
              <div className="font-mono text-xl font-bold tabular-nums text-emerald-400">
                {lang === "fa" ? num(lang, pos) : ordinal(pos)}
                <span className="text-xs font-medium text-muted-foreground"> / {num(lang, 12)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Next fixture / action */}
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl border border-white/8 bg-card p-6">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {ev.type === "cup"
                ? t("ov.cup", { round: ev.cupRoundName ?? "" })
                : ev.type === "league"
                  ? t("ov.league", { round: num(lang, ev.round) })
                  : ev.type === "season_end"
                    ? t("ov.seasonComplete")
                    : t("ov.trainingWeek")}
            </p>
            {ev.type === "cup" && <Trophy className="size-4 text-amber-300" />}
          </div>

          {ev.fixture && oppClub ? (
            <div className="mt-5 flex items-center justify-between gap-4">
              <div className="flex flex-1 flex-col items-center gap-2 text-center">
                <Crest club={home ? club : oppClub} size={52} />
                <span className="max-w-[110px] truncate text-xs font-medium text-muted-foreground">
                  {home ? club.short : oppClub.short}
                </span>
              </div>
              <div className="text-center">
                <div className="font-mono text-2xl font-bold tabular-nums text-foreground">{t("ov.vs")}</div>
                <div className="mt-1 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  {home ? t("ov.home") : t("ov.away")}
                </div>
              </div>
              <div className="flex flex-1 flex-col items-center gap-2 text-center">
                <Crest club={home ? oppClub : club} size={52} />
                <span className="max-w-[110px] truncate text-xs font-medium text-muted-foreground">
                  {home ? oppClub.short : club.short}
                </span>
              </div>
            </div>
          ) : (
            <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
              {ev.type === "season_end" ? t("ov.seasonOver") : t("ov.noMatch")}
            </p>
          )}

          <div className="mt-6">
            {ev.type === "league" || ev.type === "cup" ? (
              <Button className="w-full rounded-xl" size="lg" onClick={() => onPlayMatch(ev)}>
                <Play className="size-4" />
                {ev.type === "cup" ? t("ov.playCup", { round: t(`cup.r${ev.round}`) }) : t("ov.playMatchday", { round: num(lang, ev.round) })}
              </Button>
            ) : ev.type === "season_end" ? (
              <Button className="w-full rounded-xl" size="lg" onClick={nextSeason} disabled={isLoading}>
                {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Trophy className="size-4" />}
                {t("ov.startNextSeason")}
              </Button>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                <Button variant="outline" className="w-full rounded-xl border-white/10" size="lg" onClick={advance} disabled={isLoading}>
                  {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Clock3 className="size-4" />}
                  {t("ov.advanceOne")}
                </Button>
                <Button className="w-full rounded-xl" size="lg" onClick={skip} disabled={isLoading}>
                  {isLoading ? <Loader2 className="size-4 animate-spin" /> : <FastForward className="size-4" />}
                  {t("ov.skipToMatch")}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 gap-3">
          <Stat
            label={t("ov.balance")}
            value={
              <span className={cn(save.balance < 0 && "text-red-400")}>
                {fmtMoney(save.balance)}
              </span>
            }
          />
          <Stat
            label={t("ov.weekInOut")}
            value={
              <span className="font-mono text-sm tabular-nums">
                <span className="text-emerald-400">+{fmtMoney(save.weeklyIncome)}</span>
                <span className="text-muted-foreground"> / </span>
                <span className="text-red-300">−{fmtMoney(save.weeklyWage)}</span>
              </span>
            }
          />
          <Stat
            label={t("ov.board")}
            value={
              <div className="space-y-1.5">
                <span className="font-mono tabular-nums">{save.board}%</span>
                <Bar value={save.board} tone={save.board > 55 ? "ok" : save.board > 30 ? "warn" : "bad"} />
              </div>
            }
          />
          <Stat
            label={t("ov.club")}
            value={
              <div className="space-y-0.5 text-sm font-medium">
                <div className="flex items-center gap-1.5">
                  <Landmark className="size-3.5 text-muted-foreground" />
                  {save.stadium.name}
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <CircleDollarSign className="size-3.5" />
                  {t("ov.sponsorLine", { lvl: num(lang, save.sponsor.level), amount: fmtMoney(save.sponsor.weekly) })}
                </div>
              </div>
            }
          />
        </div>
      </div>

      {/* Season calendar */}
      <div className="rounded-2xl border border-white/8 bg-card p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionTitle title={t("ov.calendar")} sub={t("ov.calendarSub")} />
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-emerald-400" /> {t("ov.calNext")}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-amber-400/70" /> {t("ov.calCupShort")}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-white/15" /> {t("ov.calTraining")}
            </span>
          </div>
        </div>
        <div className="mt-4 flex gap-1.5 overflow-x-auto pb-2">
          {Array.from({ length: 27 }, (_, i) => i + 1).map((w) => {
            const round = LEAGUE_ROUND_AT_WEEK[w - 1];
            const cupR = CUP_ROUND_AT_WEEK[w - 1];
            const cupFixtures = save.cup.rounds[cupR - 1] ?? [];
            const hasCup = cupR > 0 && cupFixtures.some((f) => f.home === save.clubId || f.away === save.clubId);
            const cupPlanned = cupR > 0 && !hasCup && save.cup.alive.includes(save.clubId) && !save.cup.done;
            const past = w <= save.week;
            const now = w === ev.week;
            const isNext = now && (ev.type === "league" || ev.type === "cup");
            const icon = hasCup || cupPlanned ? "🏆" : round > 0 ? "⚽" : "·";
            const label = hasCup || cupPlanned
              ? t("ov.calCup", { round: t(`cup.r${cupR}`) })
              : round > 0
                ? t("ov.calMatchday", { r: num(lang, round) })
                : t("ov.calTraining");
            return (
              <div
                key={w}
                title={`${t("ov.calWeek", { w: num(lang, w) })} — ${label}`}
                className={cn(
                  "flex size-11 shrink-0 flex-col items-center justify-center rounded-xl border text-[10px] font-semibold transition-all",
                  past
                    ? "border-white/5 bg-white/[0.02] text-muted-foreground/50"
                    : isNext
                      ? "border-emerald-400/70 bg-emerald-500/15 text-emerald-200 ring-2 ring-emerald-400/40"
                      : now
                        ? "border-emerald-500/40 bg-emerald-500/[0.07] text-emerald-300"
                        : cupPlanned || hasCup
                          ? "border-amber-400/25 bg-amber-400/[0.06] text-amber-200"
                          : "border-white/10 bg-card text-foreground",
                )}
              >
                <span className="font-mono tabular-nums">{num(lang, w)}</span>
                <span className="text-[8px] leading-none opacity-80">{past && round > 0 && !hasCup ? "✓" : icon}</span>
              </div>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {ev.type === "league" || ev.type === "cup"
            ? t("ov.calNowMatch", {
                week: t("ov.calWeek", { w: num(lang, ev.week) }),
                label:
                  ev.type === "cup"
                    ? t("ov.calCup", { round: t(`cup.r${ev.round}`) })
                    : t("ov.calMatchday", { r: num(lang, ev.round) }),
              })
            : ev.type === "season_end"
              ? t("ov.seasonOver")
              : t("ov.calNowTraining", { week: t("ov.calWeek", { w: num(lang, ev.week) }) })}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        {/* League table */}
        <div className="rounded-2xl border border-white/8 bg-card">
          <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
            <SectionTitle title={league.name} />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-start text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                  <th className="px-4 py-2.5">#</th>
                  <th className="px-2 py-2.5">{t("ov.table.club")}</th>
                  <th className="px-2 py-2.5 text-center">{t("ov.table.p")}</th>
                  <th className="px-2 py-2.5 text-center">{t("ov.table.w")}</th>
                  <th className="px-2 py-2.5 text-center">{t("ov.table.d")}</th>
                  <th className="px-2 py-2.5 text-center">{t("ov.table.l")}</th>
                  <th className="px-2 py-2.5 text-center">{t("ov.table.gd")}</th>
                  <th className="px-4 py-2.5 text-end">{t("ov.table.pts")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const c = clubDefOf(save, r.clubId);
                  const mine = r.clubId === save.clubId;
                  return (
                    <tr
                      key={r.clubId}
                      className={cn(
                        "border-t border-white/5 text-muted-foreground",
                        mine && "bg-emerald-500/[0.06] text-foreground",
                      )}
                    >
                      <td className="px-4 py-2.5 font-mono tabular-nums">
                        {i === 0 ? "🥇" : num(lang, i + 1)}
                      </td>
                      <td className="px-2 py-2.5">
                        <span className="flex items-center gap-2">
                          <span
                            className="inline-block size-3.5 shrink-0 rounded"
                            style={{ background: c.p1 }}
                          />
                          <span className={cn("font-medium", mine ? "text-foreground" : "text-muted-foreground")}>
                            {c.short}
                          </span>
                        </span>
                      </td>
                      <td className="px-2 py-2.5 text-center tabular-nums">{r.p}</td>
                      <td className="px-2 py-2.5 text-center tabular-nums">{r.w}</td>
                      <td className="px-2 py-2.5 text-center tabular-nums">{r.d}</td>
                      <td className="px-2 py-2.5 text-center tabular-nums">{r.l}</td>
                      <td className="px-2 py-2.5 text-center tabular-nums">{r.gf - r.ga}</td>
                      <td className="px-4 py-2.5 text-end font-mono font-bold tabular-nums text-foreground">
                        {r.pts}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-white/5 px-5 py-3 text-xs text-muted-foreground">
            <span>{t("ov.table.p")}{num(lang, myRow.p)} · {t("ov.table.w")}{num(lang, myRow.w)} · {t("ov.table.d")}{num(lang, myRow.d)} · {t("ov.table.l")}{num(lang, myRow.l)} · {num(lang, myRow.gf)}–{num(lang, myRow.ga)}</span>
            <span className="flex items-center gap-1">
              {t("ov.nextUp", { round: ev.round ? num(lang, ev.round) : "—" })}
              <ChevronRight className="size-3.5 rtl:rotate-180" />
            </span>
          </div>
        </div>

        {/* News */}
        <div className="rounded-2xl border border-white/8 bg-card">
          <div className="flex items-center gap-2 border-b border-white/5 px-5 py-4">
            <Newspaper className="size-4 text-emerald-400" />
            <SectionTitle title={t("ov.clubNews")} />
          </div>
          <ul className="max-h-[420px] divide-y divide-white/5 overflow-y-auto px-5 py-2">
            {save.news.length === 0 && (
              <li className="py-6 text-center text-sm text-muted-foreground">
                {t("ov.noNews")}
              </li>
            )}
            {save.news.map((n, i) => (
              <li key={i} className="flex gap-3 py-3">
                <span className="mt-0.5 text-sm">{NEWS_ICON[n.kind] ?? "•"}</span>
                <div>
                  <p className="text-sm leading-relaxed text-foreground/90">{n.text}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{t("ov.weekShort", { week: num(lang, n.week) })}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
