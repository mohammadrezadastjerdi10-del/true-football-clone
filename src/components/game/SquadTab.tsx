import { useMemo, useState } from "react";
import { computeOverall, sortSquad } from "@/lib/game/sim";
import type { Player, SaveData } from "@/lib/game/types";
import { PlayerSheet } from "@/components/game/PlayerSheet";
import {
  Bar,
  FormChips,
  PlayerForm,
  PlayerOverall,
  PosBadge,
  SectionTitle,
  SquadRowMeta,
} from "@/components/game/shared";
import { fmtMoney } from "@/lib/game/format";
import { num, useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function SquadTab({ save }: { save: SaveData }) {
  const { t, lang } = useLang();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const squad = useMemo(() => sortSquad(save.squad), [save.squad]);
  const wage = save.squad.reduce((a, p) => a + p.wage, 0);
  const selected = squad.find((p) => p.id === selectedId) ?? null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <SectionTitle
          title={t("sq.title")}
          sub={t("sq.sub", { count: num(lang, save.squad.length), wages: fmtMoney(wage) })}
        />
        <div className="flex gap-2 text-xs text-muted-foreground">
          {(["GK", "DF", "MF", "FW"] as const).map((pos) => {
            const list = squad.filter((p) => p.pos === pos);
            const avg = list.length
              ? Math.round(list.reduce((a, p) => a + computeOverall(p), 0) / list.length)
              : 0;
            return (
              <span key={pos} className="rounded-lg border border-white/8 bg-white/[0.03] px-2.5 py-1.5">
                {pos} · {num(lang, list.length)} · <span className="font-mono tabular-nums text-foreground/80">{num(lang, avg)}</span>
              </span>
            );
          })}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/8 bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="text-left text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                <th className="px-4 py-3">{t("sq.player")}</th>
                <th className="px-3 py-3 text-center">{t("sq.pos")}</th>
                <th className="px-3 py-3 text-center">{t("sq.ovr")}</th>
                <th className="px-3 py-3 text-center">{t("sq.pot")}</th>
                <th className="px-3 py-3 text-center">{t("sq.form")}</th>
                <th className="hidden px-3 py-3 text-center md:table-cell">{t("sq.recent")}</th>
                <th className="hidden px-3 py-3 text-center sm:table-cell">{t("sq.morale")}</th>
                <th className="hidden px-3 py-3 text-center sm:table-cell">{t("sq.condition")}</th>
                <th className="px-4 py-3 text-right">{t("sq.value")}</th>
              </tr>
            </thead>
            <tbody>
              {squad.map((p) => (
                <tr
                  key={p.id}
                  onClick={() => setSelectedId(p.id)}
                  className={cn(
                    "cursor-pointer border-t border-white/5 transition-colors hover:bg-white/[0.03]",
                    selectedId === p.id && "bg-emerald-500/[0.04]",
                  )}
                >
                  <td className="px-4 py-3">
                    <SquadRowMeta p={p} />
                  </td>
                  <td className="px-3 py-3 text-center">
                    <PosBadge pos={p.pos} />
                  </td>
                  <td className="px-3 py-3 text-center">
                    <PlayerOverall p={p} />
                  </td>
                  <td className="px-3 py-3 text-center font-mono text-xs tabular-nums text-muted-foreground">
                    {num(lang, p.pot)}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <PlayerForm p={p} />
                  </td>
                  <td className="hidden px-3 py-3 md:table-cell">
                    <div className="flex justify-center">
                      <FormChips p={p} />
                    </div>
                  </td>
                  <td className="hidden px-3 py-3 sm:table-cell">
                    <div className="mx-auto w-20 space-y-1">
                      <Bar value={p.morale} tone={p.morale > 55 ? "ok" : p.morale > 30 ? "warn" : "bad"} />
                      <span className="block text-center font-mono text-[10px] tabular-nums text-muted-foreground">
                        {num(lang, p.morale)}
                      </span>
                    </div>
                  </td>
                  <td className="hidden px-3 py-3 sm:table-cell">
                    <div className="mx-auto w-20 space-y-1">
                      <Bar value={p.cond} tone={p.cond > 55 ? "ok" : p.cond > 35 ? "warn" : "bad"} />
                      <span className="block text-center font-mono text-[10px] tabular-nums text-muted-foreground">
                        {num(lang, p.cond)}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs tabular-nums text-muted-foreground">
                    {fmtMoney(p.val)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs leading-relaxed text-muted-foreground">
        {t("sq.footnote")}
      </p>

      <PlayerSheet
        player={selected as Player | null}
        mode="squad"
        open={selected != null}
        onOpenChange={(o) => { if (!o) setSelectedId(null); }}
      />
    </div>
  );
}
