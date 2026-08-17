import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useSave } from "@/hooks/use-save";
import { FORMATIONS, formationSlots } from "@/lib/game/engine";
import { autoPick, computeOverall, playerName, sortSquad } from "@/lib/game/sim";
import type { SaveData } from "@/lib/game/types";
import { Ovr, PosBadge, SectionTitle } from "@/components/game/shared";
import { cn } from "@/lib/utils";
import { num, useLang } from "@/lib/i18n";
import { Loader2, Save, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const SLIDERS: { key: "mentality" | "pressing" | "passing" | "tempo"; labelKey: string; loKey: string; hiKey: string }[] = [
  { key: "mentality", labelKey: "tc.mentality", loKey: "tc.mentality.lo", hiKey: "tc.mentality.hi" },
  { key: "pressing", labelKey: "tc.pressing", loKey: "tc.pressing.lo", hiKey: "tc.pressing.hi" },
  { key: "passing", labelKey: "tc.passing", loKey: "tc.passing.lo", hiKey: "tc.passing.hi" },
  { key: "tempo", labelKey: "tc.tempo", loKey: "tc.tempo.lo", hiKey: "tc.tempo.hi" },
];

export function TacticsTab({ save }: { save: SaveData }) {
  const { setTactics, isLoading } = useSave();
  const { t, lang } = useLang();
  const [formation, setFormation] = useState(save.tactics.formation);
  const [mentality, setMentality] = useState(save.tactics.mentality);
  const [pressing, setPressing] = useState(save.tactics.pressing);
  const [passing, setPassing] = useState(save.tactics.passing);
  const [tempo, setTempo] = useState(save.tactics.tempo);
  const [lineup, setLineup] = useState<Record<string, string | null>>({ ...save.tactics.lineup });
  const [dirty, setDirty] = useState(false);

  const slots = formationSlots(formation);
  const sorted = sortSquad(save.squad);

  const changeFormation = (key: string) => {
    setFormation(key);
    setLineup(autoPick(save.squad, key));
    setDirty(true);
  };

  const setSlot = (slot: string, value: string) => {
    const next = { ...lineup };
    // A player can only be in one slot at a time
    for (const k of Object.keys(next)) {
      if (next[k] === value) next[k] = null;
    }
    next[slot] = value || null;
    setLineup(next);
    setDirty(true);
  };

  const saveTactics = async () => {
    try {
      await setTactics({ formation, mentality, pressing, passing, tempo, lineup });
      setDirty(false);
      toast.success(t("tc.saved"));
    } catch {
      toast.error(t("tc.saveError"));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <SectionTitle
          title={t("tc.title")}
          sub={t("tc.sub")}
        />
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="gap-2 rounded-xl border-white/10"
            onClick={() => {
              setLineup(autoPick(save.squad, formation));
              setDirty(true);
            }}
          >
            <Sparkles className="size-4" />
            {t("tc.autoPick")}
          </Button>
          <Button className="gap-2 rounded-xl" onClick={saveTactics} disabled={!dirty || isLoading}>
            {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            {t("tc.save")}
          </Button>
        </div>
      </div>

      {/* Formation */}
      <div className="rounded-2xl border border-white/8 bg-card p-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          {t("tc.formation")}
        </p>
        <div className="flex flex-wrap gap-2">
          {Object.keys(FORMATIONS).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => changeFormation(key)}
              className={cn(
                "rounded-xl border px-4 py-2 font-mono text-sm font-semibold tabular-nums transition-all",
                formation === key
                  ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300"
                  : "border-white/8 bg-white/[0.03] text-muted-foreground hover:border-white/20 hover:text-foreground",
              )}
            >
              {FORMATIONS[key].name}
            </button>
          ))}
        </div>
      </div>

      {/* Sliders */}
      <div className="grid gap-4 sm:grid-cols-2">
        {SLIDERS.map((s) => {
          const value = s.key === "mentality" ? mentality : s.key === "pressing" ? pressing : s.key === "passing" ? passing : tempo;
          const set = s.key === "mentality" ? setMentality : s.key === "pressing" ? setPressing : s.key === "passing" ? setPassing : setTempo;
          return (
            <div key={s.key} className="rounded-2xl border border-white/8 bg-card p-5">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-semibold tracking-tight">{t(s.labelKey)}</p>
                <span className="font-mono text-sm font-bold tabular-nums text-emerald-400">{num(lang, value)}</span>
              </div>
              <Slider
                value={[value]}
                min={0}
                max={100}
                step={5}
                onValueChange={([v]) => {
                  set(v);
                  setDirty(true);
                }}
              />
              <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
                <span>{t(s.loKey)}</span>
                <span>{t(s.hiKey)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Lineup */}
      <div className="rounded-2xl border border-white/8 bg-card p-5">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          {t("tc.xi", { name: FORMATIONS[formation].name })}
        </p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {slots.map((slot) => {
            const pid = lineup[slot.key] ?? null;
            const player = pid ? save.squad.find((p) => p.id === pid) : undefined;
            return (
              <div
                key={slot.key}
                className={cn(
                  "flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors",
                  player ? "border-white/10 bg-white/[0.03]" : "border-dashed border-white/15",
                )}
              >
                <span className="w-9 shrink-0 text-center font-mono text-xs font-bold tabular-nums text-muted-foreground">
                  {slot.slot}
                </span>
                <PosBadge pos={slot.role} />
                <select
                  value={pid ?? ""}
                  onChange={(e) => setSlot(slot.key, e.target.value)}
                  className="min-w-0 flex-1 cursor-pointer rounded-md border border-transparent bg-transparent px-1 py-1 text-sm font-medium text-foreground outline-none hover:border-white/15 focus:border-emerald-500/40"
                >
                  <option value="">{t("tc.empty")}</option>
                  {sorted
                    .filter((p) => !(pid && p.id !== pid && Object.values(lineup).includes(p.id)))
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {playerName(p)} ({computeOverall(p)})
                      </option>
                    ))}
                </select>
                {player && <Ovr value={computeOverall(player)} />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const FORMATION_SLOT_LABELS: Record<string, string> = {
  "4-4-2": "Classic 4-4-2",
  "4-3-3": "Attacking 4-3-3",
  "4-2-3-1": "Holding 4-2-3-1",
  "3-5-2": "Wing-back 3-5-2",
  "5-3-2": "Solid 5-3-2",
  "4-5-1": "Compact 4-5-1",
  "3-4-3": "Front-foot 3-4-3",
};
