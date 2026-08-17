import { useMemo } from "react";
import { computeOverall, sortSquad } from "@/lib/game/sim";
import type { SaveData } from "@/lib/game/types";
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
import { cn } from "@/lib/utils";

export function SquadTab({ save }: { save: SaveData }) {
  const squad = useMemo(() => sortSquad(save.squad), [save.squad]);
  const wage = save.squad.reduce((a, p) => a + p.wage, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <SectionTitle
          title="First-team squad"
          sub={`${save.squad.length} players · weekly wages ${fmtMoney(wage)}`}
        />
        <div className="flex gap-2 text-xs text-muted-foreground">
          {(["GK", "DF", "MF", "FW"] as const).map((pos) => {
            const list = squad.filter((p) => p.pos === pos);
            const avg = list.length
              ? Math.round(list.reduce((a, p) => a + computeOverall(p), 0) / list.length)
              : 0;
            return (
              <span key={pos} className="rounded-lg border border-white/8 bg-white/[0.03] px-2.5 py-1.5">
                {pos} · {list.length} · <span className="font-mono tabular-nums text-foreground/80">{avg}</span>
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
                <th className="px-4 py-3">Player</th>
                <th className="px-3 py-3 text-center">Pos</th>
                <th className="px-3 py-3 text-center">Ovr</th>
                <th className="px-3 py-3 text-center">Pot</th>
                <th className="px-3 py-3 text-center">Form</th>
                <th className="hidden px-3 py-3 text-center md:table-cell">Recent</th>
                <th className="hidden px-3 py-3 text-center sm:table-cell">Morale</th>
                <th className="hidden px-3 py-3 text-center sm:table-cell">Condition</th>
                <th className="px-4 py-3 text-right">Value</th>
              </tr>
            </thead>
            <tbody>
              {squad.map((p) => (
                <tr key={p.id} className="border-t border-white/5 transition-colors hover:bg-white/[0.02]">
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
                    {p.pot}
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
                        {p.morale}
                      </span>
                    </div>
                  </td>
                  <td className="hidden px-3 py-3 sm:table-cell">
                    <div className="mx-auto w-20 space-y-1">
                      <Bar value={p.cond} tone={p.cond > 55 ? "ok" : p.cond > 35 ? "warn" : "bad"} />
                      <span className="block text-center font-mono text-[10px] tabular-nums text-muted-foreground">
                        {p.cond}
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
        Overall is weighted for the player&apos;s position. Form is the average of
        the last five match ratings; condition and morale are drained by
        matchdays and restored by training.
      </p>
    </div>
  );
}
