import { Button } from "@/components/ui/button";
import {
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Landmark,
  Newspaper,
  Play,
  Trophy,
} from "lucide-react";
import { useSave } from "@/hooks/use-save";
import { CUP_ROUND_NAMES, nextEvent, positionOf, standings } from "@/lib/game/sim";
import { clubById, leagueById } from "@/lib/game/world";
import type { NextEvent, SaveData } from "@/lib/game/types";
import { fmtMoney, ordinal } from "@/lib/game/format";
import { Bar, Crest, ResultChips, SectionTitle, Stat } from "@/components/game/shared";
import { cn } from "@/lib/utils";
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
  const { advanceWeek, startNextSeason, isLoading } = useSave();
  const club = clubById(save.clubId);
  const league = leagueById(save.clubId);
  const ev = nextEvent(save);
  const pos = positionOf(save);
  const rows = standings(save);
  const myRow = rows.find((r) => r.clubId === save.clubId)!;
  const oppClub =
    ev.fixture ? clubById(ev.fixture.home === save.clubId ? ev.fixture.away : ev.fixture.home) : null;
  const home = ev.fixture ? ev.fixture.home === save.clubId : null;

  const advance = async () => {
    try {
      const res = await advanceWeek();
      if (!res.advanced) toast.info("A match is scheduled — play it first.");
    } catch {
      toast.error("Could not advance the week.");
    }
  };

  const nextSeason = async () => {
    try {
      await startNextSeason();
      toast.success(`Season ${save.label} is underway!`);
    } catch {
      toast.error("Could not start the new season.");
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
                {league.name} · Season {save.label} · Week {save.week}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ResultChips raw={save.flags.lastResults} />
            <div className="rounded-xl border border-white/10 bg-background/60 px-4 py-2 text-right">
              <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Position
              </div>
              <div className="font-mono text-xl font-bold tabular-nums text-emerald-400">
                {ordinal(pos)}
                <span className="text-xs font-medium text-muted-foreground"> / 12</span>
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
                ? `National Cup · ${ev.cupRoundName ?? ""}`
                : ev.type === "league"
                  ? `League · Round ${ev.round}`
                  : ev.type === "season_end"
                    ? "Season complete"
                    : "Training week"}
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
                <div className="font-mono text-2xl font-bold tabular-nums text-foreground">vs</div>
                <div className="mt-1 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  {home ? "Home" : "Away"}
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
              {ev.type === "season_end"
                ? "The season is over. Review the campaign and start the next one."
                : "No match this week — a chance to rest players and let the youth develop."}
            </p>
          )}

          <div className="mt-6">
            {ev.type === "league" || ev.type === "cup" ? (
              <Button className="w-full rounded-xl" size="lg" onClick={() => onPlayMatch(ev)}>
                <Play className="size-4" />
                Play matchday {ev.type === "cup" ? `(${CUP_ROUND_NAMES[ev.round - 1] ?? "Cup"})` : ev.round}
              </Button>
            ) : ev.type === "season_end" ? (
              <Button className="w-full rounded-xl" size="lg" onClick={nextSeason} disabled={isLoading}>
                {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Trophy className="size-4" />}
                Start next season
              </Button>
            ) : (
              <Button className="w-full rounded-xl" size="lg" onClick={advance} disabled={isLoading}>
                {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Clock3 className="size-4" />}
                Advance week
              </Button>
            )}
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 gap-3">
          <Stat
            label="Balance"
            value={
              <span className={cn(save.balance < 0 && "text-red-400")}>
                {fmtMoney(save.balance)}
              </span>
            }
          />
          <Stat
            label="Week in / out"
            value={
              <span className="font-mono text-sm tabular-nums">
                <span className="text-emerald-400">+{fmtMoney(save.weeklyIncome)}</span>
                <span className="text-muted-foreground"> / </span>
                <span className="text-red-300">−{fmtMoney(save.weeklyWage)}</span>
              </span>
            }
          />
          <Stat
            label="Board confidence"
            value={
              <div className="space-y-1.5">
                <span className="font-mono tabular-nums">{save.board}%</span>
                <Bar value={save.board} tone={save.board > 55 ? "ok" : save.board > 30 ? "warn" : "bad"} />
              </div>
            }
          />
          <Stat
            label="Club"
            value={
              <div className="space-y-0.5 text-sm font-medium">
                <div className="flex items-center gap-1.5">
                  <Landmark className="size-3.5 text-muted-foreground" />
                  {save.stadium.name}
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <CircleDollarSign className="size-3.5" />
                  Sponsor Lv {save.sponsor.level} · {fmtMoney(save.sponsor.weekly)}/wk
                </div>
              </div>
            }
          />
        </div>
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
                <tr className="text-left text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                  <th className="px-4 py-2.5">#</th>
                  <th className="px-2 py-2.5">Club</th>
                  <th className="px-2 py-2.5 text-center">P</th>
                  <th className="px-2 py-2.5 text-center">W</th>
                  <th className="px-2 py-2.5 text-center">D</th>
                  <th className="px-2 py-2.5 text-center">L</th>
                  <th className="px-2 py-2.5 text-center">GD</th>
                  <th className="px-4 py-2.5 text-right">Pts</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const c = clubById(r.clubId);
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
                        {i === 0 ? "🥇" : i + 1}
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
                      <td className="px-4 py-2.5 text-right font-mono font-bold tabular-nums text-foreground">
                        {r.pts}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-white/5 px-5 py-3 text-xs text-muted-foreground">
            <span>P{myRow.p} · W{myRow.w} · D{myRow.d} · L{myRow.l} · {myRow.gf}–{myRow.ga}</span>
            <span className="flex items-center gap-1">
              Next up: Round {ev.round || "—"}
              <ChevronRight className="size-3.5" />
            </span>
          </div>
        </div>

        {/* News */}
        <div className="rounded-2xl border border-white/8 bg-card">
          <div className="flex items-center gap-2 border-b border-white/5 px-5 py-4">
            <Newspaper className="size-4 text-emerald-400" />
            <SectionTitle title="Club news" />
          </div>
          <ul className="max-h-[420px] divide-y divide-white/5 overflow-y-auto px-5 py-2">
            {save.news.length === 0 && (
              <li className="py-6 text-center text-sm text-muted-foreground">
                Nothing to report yet. Kick off your first week.
              </li>
            )}
            {save.news.map((n, i) => (
              <li key={i} className="flex gap-3 py-3">
                <span className="mt-0.5 text-sm">{NEWS_ICON[n.kind] ?? "•"}</span>
                <div>
                  <p className="text-sm leading-relaxed text-foreground/90">{n.text}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">Week {n.week}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
