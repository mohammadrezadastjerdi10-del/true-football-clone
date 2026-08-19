import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSave } from "@/hooks/use-save";
import { computeOverall, playerName } from "@/lib/game/sim";
import { ATTR_CATEGORIES, ATTR_LABELS, ATTR_LABELS_FA } from "@/lib/game/types";
import type { MarketPlayer, Player, YouthPlayer } from "@/lib/game/types";
import { Bar, Flag, FormChips, Ovr, PosBadge } from "@/components/game/shared";
import { fmtMoney } from "@/lib/game/format";
import { num, useLang } from "@/lib/i18n";
import { Banknote, Binoculars, Handshake, Heart, Loader2, MessageCircle, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export type SheetPlayer = Player | MarketPlayer | YouthPlayer;
export type SheetMode = "squad" | "market" | "youth";

const GROUPS = [
  { key: "technical", labelKey: "pl.tech" },
  { key: "physical", labelKey: "pl.phys" },
  { key: "mental", labelKey: "pl.mental" },
  { key: "goalkeeper", labelKey: "pl.gk" },
] as const;

function pName(p: SheetPlayer): string {
  return "name" in p ? p.name : playerName(p);
}

function formList(p: SheetPlayer): number[] {
  if (!("form" in p)) return [];
  if (Array.isArray(p.form)) return p.form;
  if (typeof p.form === "number") return [p.form];
  return [];
}

function attrTone(v: number): string {
  if (v >= 86) return "text-emerald-300";
  if (v >= 78) return "text-lime-300";
  if (v >= 70) return "text-amber-200";
  return "text-zinc-400";
}

export function PlayerSheet({
  player,
  mode,
  open,
  onOpenChange,
}: {
  player: SheetPlayer | null;
  mode: SheetMode;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { interactPlayer, isLoading } = useSave();
  const { t, lang } = useLang();
  const [busy, setBusy] = useState<string | null>(null);
  if (!player) return null;

  const name = pName(player);
  const known = !("known" in player) || player.known !== false;
  const ovr = known ? computeOverall({ attrs: player.attrs, pos: player.pos }) : 0;
  const form = formList(player);
  const isGK = player.pos === "GK";
  const groups = GROUPS.filter((g) => (isGK ? g.key === "goalkeeper" || g.key === "physical" || g.key === "mental" : g.key !== "goalkeeper"));
  const attrs = player.attrs;
  const labels = lang === "fa" ? ATTR_LABELS_FA : ATTR_LABELS;

  const act = async (action: "praise" | "encourage" | "warn" | "fine") => {
    setBusy(action);
    try {
      const res = await interactPlayer({ playerId: player.id, action });
      if (res && res.ok === false) {
        toast.error(res.error ?? t("tf.failed"));
        return;
      }
      toast.success(t(`pl.done.${action}`));
    } catch {
      toast.error(t("tf.failed"));
    } finally {
      setBusy(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] gap-0 overflow-y-auto p-0 sm:max-w-xl">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-white/5 bg-card/95 px-6 py-5 backdrop-blur">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <Flag nat={player.nat} className="text-2xl" />
              <div>
                <DialogTitle className="text-lg font-bold tracking-tight">
                  {name}
                  {"star" in player && player.star && <span className="ms-1 text-amber-300">★</span>}
                </DialogTitle>
                <DialogDescription className="mt-0.5 flex items-center gap-2">
                  <PosBadge pos={player.pos} />
                  <span>{t("sq.yrs", { age: num(lang, player.age) })}</span>
                  {known && (
                    <>
                      <span>·</span>
                      <span>
                        {t("sq.pot")} {num(lang, player.pot)}
                      </span>
                    </>
                  )}
                </DialogDescription>
              </div>
            </div>
            <div className="text-end">
              <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                {t("sq.ovr")}
              </div>
              {known ? (
                <Ovr value={ovr} className="text-2xl" />
              ) : (
                <span className="font-mono text-2xl font-bold tabular-nums text-zinc-500">?</span>
              )}
            </div>
          </div>

          {/* Status */}
          {known && (
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2">
              <div className="flex items-center justify-between text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                <span>{t("sq.morale")}</span>
                <span className="font-mono tabular-nums text-foreground/80">{num(lang, player.morale ?? 50)}</span>
              </div>
              <Bar value={player.morale ?? 50} tone={(player.morale ?? 50) > 55 ? "ok" : (player.morale ?? 50) > 30 ? "warn" : "bad"} className="mt-1.5" />
            </div>
            <div className="rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2">
              <div className="flex items-center justify-between text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                <span>{t("sq.condition")}</span>
                <span className="font-mono tabular-nums text-foreground/80">{num(lang, "cond" in player ? player.cond : 100)}</span>
              </div>
              <Bar value={"cond" in player ? player.cond : 100} tone={("cond" in player ? player.cond : 100) > 55 ? "ok" : ("cond" in player ? player.cond : 100) > 35 ? "warn" : "bad"} className="mt-1.5" />
            </div>
          </div>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-muted-foreground">
            {known && form.length > 0 && (
              <span className="flex items-center gap-1.5">
                {t("sq.form")} <FormChips p={{ form } as Player} />
              </span>
            )}
            {"contract" in player && player.contract != null && (
              <span>{t("pl.contract", { weeks: num(lang, player.contract) })}</span>
            )}
            {"injury" in player && player.injury && (
              <span className="text-red-400">
                {t("pl.injured", { weeks: num(lang, player.injury.weeks), type: player.injury.type })}
              </span>
            )}
            {"susp" in player && player.susp > 0 && (
              <span className="text-amber-300">{t("pl.suspended", { n: num(lang, player.susp) })}</span>
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
            {!known && (
              <span className="inline-flex items-center gap-1.5 rounded-md border border-sky-400/25 bg-sky-400/10 px-2 py-0.5 text-[11px] font-medium text-sky-300">
                <Binoculars className="size-3.5" />
                {t("sc.unscouted")}
              </span>
            )}
            {known && "val" in player && player.val != null && (
              <span className="flex items-center gap-1 font-mono text-muted-foreground">
                {t("pl.value")} <span className="font-semibold text-foreground">{fmtMoney(player.val)}</span>
              </span>
            )}
            {known && "wage" in player && player.wage != null && (
              <span className="flex items-center gap-1 font-mono text-muted-foreground">
                {t("pl.wage")} <span className="font-semibold text-foreground">{fmtMoney(player.wage)}</span>
              </span>
            )}
            {known && "asking" in player && player.asking != null && (
              <span className="flex items-center gap-1 font-mono text-amber-300">
                {t("pl.asking")} <span className="font-semibold">{fmtMoney(player.asking)}</span>
              </span>
            )}
          </div>
        </div>

        {/* Attributes */}
        <div className="space-y-5 px-6 py-5">
          {mode === "market" && !known ? (
            <div className="rounded-xl border border-sky-400/20 bg-sky-400/[0.05] p-6 text-center">
              <Binoculars className="mx-auto size-6 text-sky-300" />
              <p className="mt-3 text-sm font-semibold text-foreground">{t("sc.hiddenTitle")}</p>
              <p className="mx-auto mt-1.5 max-w-xs text-xs leading-relaxed text-muted-foreground">
                {t("sc.hiddenBody")}
              </p>
              <p className="mt-3 text-[11px] font-medium text-sky-300/80">{t("sc.dispatchHint")}</p>
            </div>
          ) : (
            <div className="space-y-5">
              {groups.map((g) => (
            <div key={g.key}>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-400/90">
                {t(g.labelKey)}
              </p>
              <div className="grid grid-cols-2 gap-x-5 gap-y-1.5">
                {ATTR_CATEGORIES[g.key].map((k) => {
                  const v = attrs[k];
                  return (
                    <div key={k} className="flex items-center gap-2">
                      <span className="w-1/2 truncate text-xs text-muted-foreground">{labels[k]}</span>
                      <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/8">
                        <div className="h-full rounded-full bg-emerald-500/70" style={{ width: `${v}%` }} />
                      </div>
                      <span className={cn("w-5 text-end font-mono text-xs font-semibold tabular-nums", attrTone(v))}>
                        {num(lang, v)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
              ))}
            </div>
          )}

          {/* Morale actions (first team only) */}
          {mode === "squad" && (
            <div className="border-t border-white/5 pt-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-400/90">
                {t("pl.actions")}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">{t("pl.actionsSub")}</p>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <ActionButton
                  icon={<Heart className="size-3.5" />}
                  label={t("pl.praise")}
                  tone="emerald"
                  busy={busy === "praise"}
                  onClick={() => act("praise")}
                />
                <ActionButton
                  icon={<MessageCircle className="size-3.5" />}
                  label={t("pl.encourage")}
                  busy={busy === "encourage"}
                  onClick={() => act("encourage")}
                />
                <ActionButton
                  icon={<TriangleAlert className="size-3.5" />}
                  label={t("pl.warn")}
                  tone="amber"
                  busy={busy === "warn"}
                  onClick={() => act("warn")}
                />
                <ActionButton
                  icon={<Banknote className="size-3.5" />}
                  label={t("pl.fine")}
                  tone="red"
                  busy={busy === "fine"}
                  onClick={() => act("fine")}
                />
              </div>
              {mode === "squad" && (
                <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Handshake className="size-3.5" />
                  {t("pl.oncePerWeek")}
                </p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ActionButton({
  icon,
  label,
  onClick,
  busy,
  tone = "default",
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  busy: boolean;
  tone?: "default" | "emerald" | "amber" | "red";
}) {
  const tones: Record<string, string> = {
    default: "border-white/10 text-foreground hover:border-white/25",
    emerald: "border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10",
    amber: "border-amber-400/30 text-amber-300 hover:bg-amber-400/10",
    red: "border-red-500/30 text-red-300 hover:bg-red-500/10",
  };
  return (
    <Button variant="outline" size="sm" className={cn("gap-1.5 rounded-lg", tones[tone])} onClick={onClick} disabled={busy}>
      {busy ? <Loader2 className="size-3.5 animate-spin" /> : icon}
      {label}
    </Button>
  );
}
