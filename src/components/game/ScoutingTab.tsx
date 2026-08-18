import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSave } from "@/hooks/use-save";
import { MAX_ACTIVE_SCOUTS, SCOUT_COSTS, SCOUT_DURATIONS } from "@/lib/game/sim";
import { ATTR_CATEGORIES, ATTR_LABELS, ATTR_LABELS_FA } from "@/lib/game/types";
import type { MarketPlayer, ScoutKind, ScoutMission, SaveData } from "@/lib/game/types";
import { ALL_COUNTRIES, countryById } from "@/lib/game/world";
import { Flag, Ovr, PosBadge, SectionTitle } from "@/components/game/shared";
import { fmtMoney } from "@/lib/game/format";
import { num, useLang } from "@/lib/i18n";
import { PlayerSheet } from "@/components/game/PlayerSheet";
import {
  Binoculars,
  CheckCircle2,
  Clock3,
  FileText,
  Loader2,
  MapPin,
  Send,
  Sparkles,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Dur = (typeof SCOUT_DURATIONS)[number];

export function ScoutingTab({ save }: { save: SaveData }) {
  const { dispatchScout, isLoading } = useSave();
  const { t, lang } = useLang();
  const [kind, setKind] = useState<ScoutKind>("player");
  const [playerId, setPlayerId] = useState<string>("");
  const [regionId, setRegionId] = useState<string>("bra");
  const [duration, setDuration] = useState<Dur>(2);
  const [busy, setBusy] = useState(false);
  const [openReport, setOpenReport] = useState<ScoutMission | null>(null);
  const [sheetPlayer, setSheetPlayer] = useState<MarketPlayer | null>(null);

  const scouts = save.scouts ?? [];
  const active = useMemo(() => scouts.filter((s) => !s.done), [scouts]);
  const reports = useMemo(() => scouts.filter((s) => s.done).slice().reverse(), [scouts]);

  const unscouted = useMemo(
    () =>
      save.market.filter(
        (m) => m.known === false && !active.some((s) => s.kind === "player" && s.targetId === m.id),
      ),
    [save.market, active],
  );

  const cost = SCOUT_COSTS[duration];
  const targetOk = kind === "player" ? !!playerId : !!regionId;
  const afford = save.balance >= cost;

  const dispatch = async () => {
    if (!targetOk || !afford) return;
    setBusy(true);
    try {
      const res = (await dispatchScout({
        kind,
        targetId: kind === "player" ? playerId : regionId,
        duration,
      })) as { ok?: boolean; error?: string } | undefined;
      if (res && res.ok === false) {
        toast.error(res.error ?? t("tf.failed"));
        return;
      }
      toast.success(t("sc.dispatched"));
      if (kind === "player") setPlayerId("");
    } catch (e) {
      console.error(e);
      toast.error(t("tf.failed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Assign a scout */}
      <div className="rounded-2xl border border-white/8 bg-card p-6">
        <SectionTitle
          title={t("sc.assignTitle")}
          sub={t("sc.assignSub")}
          right={
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-sky-400/25 bg-sky-400/10 px-2.5 py-1.5 text-xs font-medium text-sky-300">
              <Binoculars className="size-3.5" />
              {t("sc.activeCount", { n: num(lang, active.length), max: num(lang, MAX_ACTIVE_SCOUTS) })}
            </span>
          }
        />

        <div className="mt-5 flex gap-1.5">
          {(
            [
              ["player", "sc.kindPlayer"],
              ["region", "sc.kindRegion"],
            ] as const
          ).map(([k, labelKey]) => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-xs font-semibold transition-colors",
                kind === k
                  ? "border-sky-500/50 bg-sky-500/10 text-sky-300"
                  : "border-white/8 bg-white/[0.03] text-muted-foreground hover:text-foreground",
              )}
            >
              {k === "player" ? <Binoculars className="size-3.5" /> : <MapPin className="size-3.5" />}
              {t(labelKey)}
            </button>
          ))}
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_auto]">
          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {t(kind === "player" ? "sc.targetPlayer" : "sc.targetRegion")}
            </p>
            {kind === "player" ? (
              <Select value={playerId} onValueChange={setPlayerId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("sc.pickPlayer")} />
                </SelectTrigger>
                <SelectContent>
                  {unscouted.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      <span className="flex items-center gap-2">
                        <Flag nat={m.nat} />
                        {m.first} {m.last} · {m.pos} · {num(lang, m.age)} yrs
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Select value={regionId} onValueChange={setRegionId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("sc.pickRegion")} />
                </SelectTrigger>
                <SelectContent>
                  {ALL_COUNTRIES.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <span className="flex items-center gap-2">
                        <span>{c.flag}</span>
                        {c.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {kind === "player" && unscouted.length === 0 && (
              <p className="mt-2 text-[11px] text-muted-foreground">
                {t("sc.noUnscouted")}
              </p>
            )}
          </div>

          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {t("sc.duration")}
            </p>
            <div className="flex gap-1.5">
              {SCOUT_DURATIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDuration(d)}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-center transition-colors",
                    duration === d
                      ? "border-emerald-500/50 bg-emerald-500/10"
                      : "border-white/8 bg-white/[0.03] hover:border-white/20",
                  )}
                >
                  <div className={cn("font-mono text-sm font-bold tabular-nums", duration === d ? "text-emerald-300" : "text-foreground")}>
                    {num(lang, d)}w
                  </div>
                  <div className="mt-0.5 text-[10px] text-muted-foreground">{fmtMoney(SCOUT_COSTS[d])}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/5 pt-4">
          <div className="text-xs text-muted-foreground">
            {t("sc.costLine", { cost: fmtMoney(cost), budget: fmtMoney(save.balance) })}
            {!afford && <span className="mt-1 block text-red-400">{t("sc.noFunds")}</span>}
          </div>
          <Button
            className="gap-2 rounded-xl"
            disabled={!targetOk || !afford || busy || isLoading}
            onClick={dispatch}
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            {t("sc.dispatch")}
          </Button>
        </div>
      </div>

      {/* Active missions */}
      <div className="rounded-2xl border border-white/8 bg-card p-6">
        <SectionTitle title={t("sc.activeTitle")} sub={t("sc.activeSub")} />
        <div className="mt-5 space-y-3">
          {active.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">{t("sc.noActive")}</p>
          )}
          {active.map((s) => {
            const remaining = Math.max(0, s.startWeek + s.duration - save.week);
            const pct = Math.round(((s.duration - remaining) / s.duration) * 100);
            return (
              <div key={s.id} className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg leading-none">{s.targetFlag ?? "🏳️"}</span>
                    <div className="leading-tight">
                      <p className="text-sm font-semibold text-foreground">{s.targetName}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {s.kind === "player" ? t("sc.visiting", { pos: s.pos ?? "" }) : t("sc.touring")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-muted-foreground">{fmtMoney(s.cost)}</span>
                    <span className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-[11px] font-medium text-foreground/80">
                      <Clock3 className="size-3 text-sky-300" />
                      {remaining === 0
                        ? t("sc.anyDay")
                        : t("sc.weeksLeft", { n: num(lang, remaining) })}
                    </span>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-sky-400/80 transition-all"
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                  <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
                    {num(lang, Math.min(100, pct))}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reports */}
      <div className="rounded-2xl border border-white/8 bg-card p-6">
        <SectionTitle title={t("sc.reportsTitle")} sub={t("sc.reportsSub")} />
        <div className="mt-5 space-y-2.5">
          {reports.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">{t("sc.noReports")}</p>
          )}
          {reports.map((s) => (
            <div
              key={s.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="text-lg leading-none">{s.targetFlag ?? "🏳️"}</span>
                <div className="min-w-0 leading-tight">
                  <p className="truncate text-sm font-semibold text-foreground">{s.targetName}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {s.kind === "player"
                      ? t("sc.reportPlayer", { week: num(lang, s.report?.completedWeek ?? 0) })
                      : t("sc.reportRegion", { week: num(lang, s.report?.completedWeek ?? 0), n: num(lang, s.report?.found?.length ?? 0) })}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="gap-1.5 rounded-lg border-white/10" onClick={() => setOpenReport(s)}>
                <FileText className="size-3.5" />
                {t("sc.viewReport")}
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Report dialog */}
      <ReportDialog
        mission={openReport}
        onClose={() => setOpenReport(null)}
        onOpenPlayer={(p) => setSheetPlayer(p)}
      />

      {/* Full player sheet for found prospects */}
      <PlayerSheet
        player={sheetPlayer}
        mode="market"
        open={sheetPlayer != null}
        onOpenChange={(o) => {
          if (!o) setSheetPlayer(null);
        }}
      />
    </div>
  );
}

function ReportDialog({
  mission,
  onClose,
  onOpenPlayer,
}: {
  mission: ScoutMission | null;
  onClose: () => void;
  onOpenPlayer: (p: MarketPlayer) => void;
}) {
  const { t, lang } = useLang();
  if (!mission) return null;
  const rep = mission.report;
  return (
    <Dialog open={mission != null} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-h-[88vh] gap-0 overflow-y-auto p-0 sm:max-w-xl">
        <div className="sticky top-0 z-10 border-b border-white/5 bg-card/95 px-6 py-5 backdrop-blur">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5 text-lg font-bold tracking-tight">
              <span className="text-2xl leading-none">{mission.targetFlag ?? "🏳️"}</span>
              {t("sc.reportOf", { name: mission.targetName })}
            </DialogTitle>
            <DialogDescription className="mt-1 text-xs text-muted-foreground">
              {t("sc.completedWeek", { week: num(lang, rep?.completedWeek ?? 0) })} · {fmtMoney(mission.cost)}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="space-y-5 px-6 py-5">
          {mission.kind === "player" ? (
            rep?.player ? (
              <PlayerReport p={rep.player} />
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">{t("sc.reportLost")}</p>
            )
          ) : rep?.found?.length ? (
            <div className="space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-400/90">
                {t("sc.foundPlayers")}
              </p>
              {rep.found.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => onOpenPlayer(f)}
                  className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3 text-left transition-colors hover:border-emerald-500/40"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <Flag nat={f.nat} />
                    <div className="min-w-0 leading-tight">
                      <p className="truncate text-sm font-medium text-foreground">
                        {f.first} {f.last}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        <PosBadge pos={f.pos} /> {t("sq.yrs", { age: num(lang, f.age) })} · {t("sq.pot")} {num(lang, f.pot)} · {fmtMoney(f.asking)}
                      </p>
                    </div>
                  </div>
                  <Ovr value={f.ovr} />
                </button>
              ))}
              <p className="pt-2 text-[11px] leading-relaxed text-muted-foreground">{t("sc.foundHint")}</p>
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">{t("sc.reportEmpty")}</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PlayerReport({ p }: { p: MarketPlayer }) {
  const { t, lang } = useLang();
  const labels = lang === "fa" ? ATTR_LABELS_FA : ATTR_LABELS;
  const isGK = p.pos === "GK";
  const groups = ATTR_CATEGORIES;
  const keys = (["technical", "physical", "mental", "goalkeeper"] as const).filter((g) =>
    isGK ? g === "goalkeeper" || g === "physical" || g === "mental" : g !== "goalkeeper",
  );
  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        {[
          [t("sq.ovr"), p.ovr],
          [t("sq.pot"), p.pot],
          [t("pl.value"), fmtMoney(p.val)],
          [t("pl.wage"), fmtMoney(p.wage)],
          [t("pl.asking"), fmtMoney(p.asking)],
          [t("sq.form"), p.form.toFixed(1)],
        ].map(([label, value]) => (
          <div key={label as string} className="rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2">
            <div className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">{label}</div>
            <div className="mt-0.5 font-mono text-sm font-bold tabular-nums text-foreground">{value}</div>
          </div>
        ))}
      </div>

      <div className="mt-5 space-y-5">
        {keys.map((g) => (
          <div key={g}>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-400/90">
              {t(g === "technical" ? "pl.tech" : g === "physical" ? "pl.phys" : g === "mental" ? "pl.mental" : "pl.gk")}
            </p>
            <div className="grid grid-cols-2 gap-x-5 gap-y-1.5">
              {groups[g].map((k) => {
                const v = p.attrs[k];
                return (
                  <div key={k} className="flex items-center gap-2">
                    <span className="w-1/2 truncate text-xs text-muted-foreground">{labels[k]}</span>
                    <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/8">
                      <div className="h-full rounded-full bg-emerald-500/70" style={{ width: `${v}%` }} />
                    </div>
                    <span className="w-5 text-right font-mono text-xs font-semibold tabular-nums text-foreground">
                      {num(lang, v)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <p className="mt-5 flex items-center gap-1.5 border-t border-white/5 pt-4 text-[11px] text-muted-foreground">
        <CheckCircle2 className="size-3.5 text-emerald-400" />
        {t("sc.fullUnlocked")}
      </p>
      <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <Sparkles className="size-3.5 text-sky-300/80" />
        {t("sc.signFromMarket")}
      </p>
    </div>
  );
}
