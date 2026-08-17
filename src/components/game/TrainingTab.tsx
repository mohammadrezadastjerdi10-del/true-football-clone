import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSave } from "@/hooks/use-save";
import { computeOverall, FOCUS_LABELS, playerName } from "@/lib/game/sim";
import { fmtMoney } from "@/lib/game/format";
import type { FocusKey, SaveData, YouthPlayer } from "@/lib/game/types";
import { PlayerSheet } from "@/components/game/PlayerSheet";
import { Flag, Ovr, PosBadge, SectionTitle } from "@/components/game/shared";
import { num, useLang } from "@/lib/i18n";
import { Loader2, Rocket, Save, UserX } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const FOCUS_KEYS = Object.keys(FOCUS_LABELS) as FocusKey[];

export function TrainingTab({ save }: { save: SaveData }) {
  const { setTraining, promoteYouth, releaseYouth, isLoading } = useSave();
  const { t, lang } = useLang();
  const [focus, setFocus] = useState<FocusKey>(save.training.focus);
  const [intensity, setIntensity] = useState(save.training.intensity);
  const [dirty, setDirty] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [openYouthId, setOpenYouthId] = useState<string | null>(null);
  const openYouth = save.youth.find((y) => y.id === openYouthId) ?? null;

  const saveTraining = async () => {
    try {
      await setTraining({ focus, intensity, indiv: {} });
      setDirty(false);
      toast.success(t("tr.saved"));
    } catch {
      toast.error(t("tr.saveError"));
    }
  };

  const promote = async (id: string) => {
    setBusyId(id);
    try {
      const res = await promoteYouth({ youthId: id });
      if (!res.ok) toast.error(res.error ?? t("tr.promoteError"));
      else toast.success(t("tr.promoted"));
    } catch {
      toast.error(t("tr.promoteError"));
    } finally {
      setBusyId(null);
    }
  };

  const release = async (id: string) => {
    setBusyId(id);
    try {
      await releaseYouth({ youthId: id });
      toast.info(t("tr.released"));
    } catch {
      toast.error(t("tr.releaseError"));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
      {/* Training plan */}
      <div className="space-y-6">
        <div className="rounded-2xl border border-white/8 bg-card p-6">
          <SectionTitle
            title={t("tr.title")}
            sub={t("tr.sub")}
          />
          <div className="mt-5 space-y-5">
            <div>
              <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                {t("tr.focus")}
              </span>
              <Select value={focus} onValueChange={(v) => { setFocus(v as FocusKey); setDirty(true); }}>
                <SelectTrigger className="mt-2 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FOCUS_KEYS.map((k) => (
                    <SelectItem key={k} value={k}>
                      {t(`tr.focus.${k}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  {t("tr.intensity")}
                </span>
                <span className="font-mono text-sm font-bold tabular-nums text-emerald-400">
                  {num(lang, intensity)}
                </span>
              </div>
              <Slider
                value={[intensity]}
                min={0}
                max={100}
                step={5}
                onValueChange={([v]) => { setIntensity(v); setDirty(true); }}
              />
              <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
                <span>{t("tr.intensity.lo")}</span>
                <span>{t("tr.intensity.hi")}</span>
              </div>
            </div>
            <Button className="w-full rounded-xl" onClick={saveTraining} disabled={!dirty || isLoading}>
              {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              {t("tr.save")}
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-white/8 bg-card p-6">
          <SectionTitle title={t("tr.facilities")} sub={t("tr.facilitiesSub")} />
          <div className="mt-4 space-y-2.5 text-sm text-muted-foreground">
            <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3">
              <span>{t("tr.stadium")}</span>
              <span className="font-medium text-foreground">
                {save.stadium.name} · {t("tf.stadiumLine", { lvl: num(lang, save.stadium.level), cap: num(lang, save.stadium.capacity), ticket: num(lang, save.stadium.ticket) })}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3">
              <span>{t("tr.sponsor")}</span>
              <span className="font-medium text-foreground">{t("tf.sponsorLine", { lvl: num(lang, save.sponsor.level), amount: fmtMoney(save.sponsor.weekly) })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Youth academy */}
      <div className="rounded-2xl border border-white/8 bg-card p-6">
        <SectionTitle
          title={t("tr.youth")}
          sub={t("tr.youthSub", { count: num(lang, save.youth.length) })}
        />
        <div className="mt-5 space-y-2.5">
          {save.youth.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {t("tr.emptyAcademy")}
            </p>
          )}
          {save.youth.map((y) => (
            <div
              key={y.id}
              role="button"
              tabIndex={0}
              onClick={() => setOpenYouthId(y.id)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setOpenYouthId(y.id); }}
              className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3 transition-colors hover:border-emerald-500/40"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Flag nat={y.nat} />
                  <span className="truncate">{playerName(y)}</span>
                </div>
                <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                  <PosBadge pos={y.pos} />
                  <span>{t("sq.yrs", { age: num(lang, y.age) })}</span>
                  <span>
                    {t("tr.pot")} <Ovr value={y.pot} className="text-xs" />
                  </span>
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 rounded-lg border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10"
                  disabled={busyId === y.id}
                  onClick={(e) => { e.stopPropagation(); promote(y.id); }}
                >
                  <Rocket className="size-3.5" />
                  {t("tr.promote")}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 rounded-lg text-muted-foreground hover:text-red-300"
                  disabled={busyId === y.id}
                  onClick={(e) => { e.stopPropagation(); release(y.id); }}
                >
                  <UserX className="size-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <PlayerSheet
        player={openYouth as YouthPlayer | null}
        mode="youth"
        open={openYouth != null}
        onOpenChange={(o) => { if (!o) setOpenYouthId(null); }}
      />
    </div>
  );
}
