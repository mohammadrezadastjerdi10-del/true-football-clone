import { Button } from "@/components/ui/button";
import { useSave } from "@/hooks/use-save";
import { ACHIEVEMENTS, SPONSOR_LEVELS, STADIUM_LEVELS, achievementDef } from "@/lib/game/sim";
import type { SaveData } from "@/lib/game/types";
import { Bar, Flag, SectionTitle } from "@/components/game/shared";
import { fmtMoney, ordinal } from "@/lib/game/format";
import { cn } from "@/lib/utils";
import { num, useLang } from "@/lib/i18n";
import { Award, Landmark, Loader2, ShieldCheck, Trophy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function ClubTab({ save }: { save: SaveData }) {
  const { upgradeStadium, upgradeSponsor, isLoading } = useSave();
  const { t, lang } = useLang();
  const [busy, setBusy] = useState<string | null>(null);

  const nextStadium = STADIUM_LEVELS[save.stadium.level];
  const nextSponsor = SPONSOR_LEVELS[save.sponsor.level];
  const trophies = save.history.reduce((a, h) => a + h.trophies.length, 0) + save.seasonTrophies.length;

  const run = async (id: string, fn: () => Promise<unknown>, success: string) => {
    setBusy(id);
    try {
      const res = (await fn()) as { ok?: boolean; error?: string } | undefined;
      if (res && res.ok === false) {
        toast.error(res.error ?? t("tf.failed"));
        return;
      }
      toast.success(success);
    } catch {
      toast.error(t("tf.failed"));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Manager + board */}
      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <div className="rounded-2xl border border-white/8 bg-card p-6">
          <SectionTitle title={t("cl.manager")} sub={t("cl.managerSub")} />
          <div className="mt-5 flex items-center gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
              <ShieldCheck className="size-7" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-lg font-bold tracking-tight">{save.manager.name}</p>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Flag nat={save.manager.nat} />
                {t("cl.seasonsRun", { n: num(lang, save.season) })}
                <span>·</span>
                <Trophy className="size-3.5 text-amber-300" />
                {t("cl.trophies", { n: num(lang, trophies) })}
              </p>
            </div>
          </div>

          <div className="mt-6 border-t border-white/5 pt-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                {t("ov.board")}
              </span>
              <span className={cn("font-mono text-sm font-bold tabular-nums", save.board > 55 ? "text-emerald-300" : save.board > 30 ? "text-amber-300" : "text-red-400")}>
                {num(lang, save.board)}%
              </span>
            </div>
            <Bar value={save.board} tone={save.board > 55 ? "ok" : save.board > 30 ? "warn" : "bad"} className="mt-2" />
            <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
              {save.board > 55
                ? t("cl.boardGood")
                : save.board > 30
                  ? t("cl.boardWarn")
                  : t("cl.boardBad")}
            </p>
          </div>
        </div>

        {/* Finances */}
        <div className="rounded-2xl border border-white/8 bg-card p-6">
          <SectionTitle title={t("cl.finances")} sub={t("cl.financesSub")} />
          <div className="mt-5 grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3">
              <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                {t("ov.balance")}
              </div>
              <div className={cn("mt-1 font-mono text-lg font-bold tabular-nums", save.balance < 0 ? "text-red-400" : "text-emerald-300")}>
                {fmtMoney(save.balance)}
              </div>
            </div>
            <div className="rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3">
              <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                {t("cl.income")}
              </div>
              <div className="mt-1 font-mono text-lg font-bold tabular-nums text-emerald-400">
                +{fmtMoney(save.weeklyIncome)}
              </div>
            </div>
            <div className="rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3">
              <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                {t("cl.expenses")}
              </div>
              <div className="mt-1 font-mono text-lg font-bold tabular-nums text-red-300">
                −{fmtMoney(save.weeklyWage)}
              </div>
            </div>
          </div>

          <div className="mt-5">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-400/90">
              {t("cl.log")}
            </p>
            <ul className="max-h-64 divide-y divide-white/5 overflow-y-auto rounded-xl border border-white/5 bg-white/[0.02]">
              {save.financeLog.length === 0 && (
                <li className="py-6 text-center text-sm text-muted-foreground">{t("cl.emptyLog")}</li>
              )}
              {save.financeLog.map((f, i) => (
                <li key={i} className="flex items-center gap-3 px-4 py-2.5 text-xs">
                  <span className="w-12 shrink-0 font-mono tabular-nums text-muted-foreground">
                    {t("ov.weekShort", { week: num(lang, f.week) })}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-muted-foreground">{f.note}</span>
                  {f.income > 0 && <span className="shrink-0 font-mono tabular-nums text-emerald-400">+{fmtMoney(f.income)}</span>}
                  {f.expense > 0 && <span className="shrink-0 font-mono tabular-nums text-red-300">−{fmtMoney(f.expense)}</span>}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Facilities */}
      <div className="rounded-2xl border border-white/8 bg-card p-6">
        <SectionTitle title={t("cl.facilities")} sub={t("cl.facilitiesSub")} />
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sky-500/10 text-sky-300">
                  <Landmark className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{save.stadium.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {t("tf.stadiumLine", { lvl: num(lang, save.stadium.level), cap: num(lang, save.stadium.capacity), ticket: num(lang, save.stadium.ticket) })}
                  </p>
                </div>
              </div>
              <div className="text-end text-xs text-muted-foreground">
                {nextStadium ? (
                  <>
                    <p className="font-medium text-foreground">{t("tf.next", { name: nextStadium.name })}</p>
                    <p className="mt-0.5">{fmtMoney(nextStadium.cost)}</p>
                  </>
                ) : (
                  <p className="font-medium text-emerald-400">{t("tf.maxLevel")}</p>
                )}
              </div>
            </div>
            {nextStadium && (
              <Button
                variant="outline"
                className="mt-3 w-full rounded-xl"
                disabled={isLoading || save.balance < nextStadium.cost}
                onClick={() => run("stadium", () => upgradeStadium(), t("tf.stadiumUpgraded"))}
              >
                {busy === "stadium" ? <Loader2 className="size-4 animate-spin" /> : null}
                {t("tf.upgradeStadium")}
              </Button>
            )}
          </div>

          <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-300">
                  <Award className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{t("cl.sponsor")}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {t("tf.sponsorLine", { lvl: num(lang, save.sponsor.level), amount: fmtMoney(save.sponsor.weekly) })}
                  </p>
                </div>
              </div>
              <div className="text-end text-xs text-muted-foreground">
                {nextSponsor ? (
                  <>
                    <p className="font-medium text-foreground">{t("tf.next", { name: nextSponsor.name })}</p>
                    <p className="mt-0.5">{fmtMoney(nextSponsor.cost)}</p>
                  </>
                ) : (
                  <p className="font-medium text-emerald-400">{t("tf.maxLevel")}</p>
                )}
              </div>
            </div>
            {nextSponsor && (
              <Button
                variant="outline"
                className="mt-3 w-full rounded-xl"
                disabled={isLoading || save.balance < nextSponsor.cost}
                onClick={() => run("sponsor", () => upgradeSponsor(), t("tf.sponsorUpgraded"))}
              >
                {busy === "sponsor" ? <Loader2 className="size-4 animate-spin" /> : null}
                {t("tf.upgradeSponsor")}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Season history */}
      <div className="rounded-2xl border border-white/8 bg-card p-6">
        <SectionTitle title={t("cl.history")} sub={t("cl.historySub")} />
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="text-start text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                <th className="px-3 py-2.5">{t("cl.h.season")}</th>
                <th className="px-3 py-2.5 text-center">{t("cl.h.pos")}</th>
                <th className="px-3 py-2.5 text-center">{t("cl.h.cup")}</th>
                <th className="px-3 py-2.5 text-center">{t("cl.h.trophies")}</th>
                <th className="px-3 py-2.5 text-end">{t("cl.h.balance")}</th>
              </tr>
            </thead>
            <tbody>
              {save.history.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-sm text-muted-foreground">
                    {t("cl.emptyHistory")}
                  </td>
                </tr>
              )}
              {save.history.map((h) => (
                <tr key={h.season} className="border-t border-white/5 text-muted-foreground">
                  <td className="px-3 py-3 font-medium text-foreground">{h.label}</td>
                  <td className="px-3 py-3 text-center font-mono tabular-nums">
                    {lang === "fa" ? num(lang, h.pos) : ordinal(h.pos)}
                  </td>
                  <td className="px-3 py-3 text-center">{h.cup}</td>
                  <td className="px-3 py-3 text-center">
                    {h.trophies.length ? (
                      <span className="inline-flex items-center gap-1 text-amber-300">
                        {h.trophies.map((tr) => (tr === "League" ? "🏆" : "🏅")).join(" ")}
                      </span>
                    ) : (
                      <span className="text-muted-foreground/50">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-end font-mono tabular-nums">{fmtMoney(h.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Achievements */}
      <div className="rounded-2xl border border-white/8 bg-card p-6">
        <SectionTitle
          title={t("cl.achievements")}
          sub={t("cl.achievementsSub", { n: num(lang, save.achievements.length), total: num(lang, Object.keys(ACHIEVEMENTS).length) })}
        />
        <div className="mt-5 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(ACHIEVEMENTS).map(([id, def]) => {
            const unlocked = save.achievements.includes(id);
            const info = achievementDef(id);
            const label = lang === "fa" ? def.fa[0] : def.en[0];
            const desc = lang === "fa" ? def.fa[1] : def.en[1];
            return (
              <div
                key={id}
                className={cn(
                  "flex items-start gap-3 rounded-xl border px-4 py-3",
                  unlocked ? "border-emerald-500/20 bg-emerald-500/[0.05]" : "border-white/5 bg-white/[0.02] opacity-50",
                )}
              >
                <span className="text-xl leading-none">{info?.icon ?? "🏆"}</span>
                <div className="min-w-0">
                  <p className={cn("text-sm font-semibold tracking-tight", unlocked ? "text-foreground" : "text-muted-foreground")}>
                    {label}
                  </p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{desc}</p>
                </div>
                {unlocked && <span className="ml-auto mt-0.5 text-emerald-400">✓</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
