import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSave } from "@/hooks/use-save";
import { SPONSOR_LEVELS, STADIUM_LEVELS, computeOverall, playerName, sortSquad } from "@/lib/game/sim";
import type { MarketPlayer, SaveData } from "@/lib/game/types";
import { Flag, Ovr, PosBadge, SectionTitle } from "@/components/game/shared";
import { fmtMoney } from "@/lib/game/format";
import { cn } from "@/lib/utils";
import { BadgePlus, Check, Loader2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

const POS_FILTERS = ["All", "GK", "DF", "MF", "FW"] as const;

export function TransfersTab({ save }: { save: SaveData }) {
  const { buyPlayer, transferListPlayer, unlistPlayer, acceptOffer, rejectOffer, upgradeStadium, upgradeSponsor, isLoading } = useSave();
  const [posFilter, setPosFilter] = useState<(typeof POS_FILTERS)[number]>("All");
  const [listPid, setListPid] = useState<string>("");
  const [listPrice, setListPrice] = useState("500000");
  const [busy, setBusy] = useState<string | null>(null);

  const market = useMemo(
    () =>
      save.market
        .filter((m) => posFilter === "All" || m.pos === posFilter)
        .sort((a, b) => b.ovr - a.ovr),
    [save.market, posFilter],
  );

  const listedPlayers = save.squad.filter((p) => save.listed[p.id] != null);
  const squadSorted = sortSquad(save.squad);

  const run = async (id: string, fn: () => Promise<unknown>, success?: string) => {
    setBusy(id);
    try {
      await fn();
      if (success) toast.success(success);
    } catch (e) {
      console.error(e);
      toast.error("That didn't work — try again.");
    } finally {
      setBusy(null);
    }
  };

  const nextStadium = STADIUM_LEVELS[save.stadium.level];
  const nextSponsor = SPONSOR_LEVELS[save.sponsor.level];

  return (
    <div className="space-y-6">
      {/* Market */}
      <div className="rounded-2xl border border-white/8 bg-card p-6">
        <SectionTitle
          title="Transfer market"
          sub={`${save.market.length} players available · your budget ${fmtMoney(save.balance)}`}
          right={
            <div className="flex gap-1.5">
              {POS_FILTERS.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setPosFilter(f)}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors",
                    posFilter === f
                      ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300"
                      : "border-white/8 bg-white/[0.03] text-muted-foreground hover:text-foreground",
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          }
        />
        <div className="mt-5 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {market.map((m) => (
            <MarketCard key={m.id} m={m} balance={save.balance} busy={busy === m.id} onBuy={() => run(m.id, () => buyPlayer({ marketId: m.id }), "Signed! Welcome aboard.")} />
          ))}
          {market.length === 0 && (
            <p className="col-span-full py-10 text-center text-sm text-muted-foreground">
              No players match this filter.
            </p>
          )}
        </div>
      </div>

      {/* Listed players + offers */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/8 bg-card p-6">
          <SectionTitle title="List a player" sub="Set your asking price and clubs will come knocking" />
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Select value={listPid} onValueChange={setListPid}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Choose a player" />
              </SelectTrigger>
              <SelectContent>
                {squadSorted.map((p) => (
                  <SelectItem key={p.id} value={p.id} disabled={save.listed[p.id] != null}>
                    {playerName(p)} ({computeOverall(p)}) {save.listed[p.id] != null ? "· listed" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="number"
              min={100000}
              step={50000}
              value={listPrice}
              onChange={(e) => setListPrice(e.target.value)}
              className="sm:w-40"
              aria-label="Asking price"
            />
            <Button
              variant="outline"
              className="gap-2 rounded-xl"
              disabled={!listPid || isLoading}
              onClick={() =>
                run(listPid, () => transferListPlayer({ playerId: listPid, price: Number(listPrice) || 500000 }), "Player listed on the market.")
              }
            >
              <BadgePlus className="size-4" />
              List
            </Button>
          </div>

          <div className="mt-5 space-y-2.5">
            {listedPlayers.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Nobody is listed right now.
              </p>
            )}
            {listedPlayers.map((p) => (
              <div key={p.id} className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <Flag nat={p.nat} />
                    <span className="text-sm font-medium">{playerName(p)}</span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {fmtMoney(save.listed[p.id])}
                    </span>
                  </div>
                  <Button variant="ghost" size="sm" className="text-muted-foreground" disabled={isLoading} onClick={() => run(p.id, () => unlistPlayer({ playerId: p.id }))}>
                    <X className="size-4" />
                    Unlist
                  </Button>
                </div>
                {(save.offers[p.id] ?? []).map((o) => (
                  <div key={o.id} className="mt-3 flex items-center justify-between rounded-lg border border-amber-400/15 bg-amber-400/[0.04] px-3 py-2.5">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {o.from} offer · <span className="font-mono text-emerald-300">{fmtMoney(o.amount)}</span>
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        weekly wage {fmtMoney(o.weeklyWage)}
                      </p>
                    </div>
                    <div className="flex gap-1.5">
                      <Button size="sm" variant="outline" className="gap-1 rounded-lg border-emerald-500/30 text-emerald-300" disabled={isLoading} onClick={() => run(o.id, () => acceptOffer({ playerId: p.id, offerId: o.id }), "Transfer completed.")}>
                        <Check className="size-3.5" />
                        Accept
                      </Button>
                      <Button size="sm" variant="ghost" className="rounded-lg text-muted-foreground" disabled={isLoading} onClick={() => run(o.id, () => rejectOffer({ playerId: p.id, offerId: o.id }))}>
                        <X className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Club upgrades */}
        <div className="rounded-2xl border border-white/8 bg-card p-6">
          <SectionTitle title="Club facilities" sub="Invest the club's money in infrastructure" />
          <div className="mt-5 space-y-4">
            <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">{save.stadium.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Lv {save.stadium.level} · {save.stadium.capacity.toLocaleString()} seats · €{save.stadium.ticket}/ticket
                  </p>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  {nextStadium ? (
                    <>
                      <p className="font-medium text-foreground">Next: {nextStadium.name}</p>
                      <p className="mt-0.5">{fmtMoney(nextStadium.cost)}</p>
                    </>
                  ) : (
                    <p className="font-medium text-emerald-400">Max level</p>
                  )}
                </div>
              </div>
              {nextStadium && (
                <Button
                  variant="outline"
                  className="mt-3 w-full rounded-xl"
                  disabled={isLoading || save.balance < nextStadium.cost}
                  onClick={() => run("stadium", () => upgradeStadium(), "Stadium expanded!")}
                >
                  {busy === "stadium" ? <Loader2 className="size-4 animate-spin" /> : null}
                  Upgrade stadium
                </Button>
              )}
            </div>

            <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">Sponsorship</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Lv {save.sponsor.level} · {fmtMoney(save.sponsor.weekly)}/week
                  </p>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  {nextSponsor ? (
                    <>
                      <p className="font-medium text-foreground">Next: {nextSponsor.name}</p>
                      <p className="mt-0.5">{fmtMoney(nextSponsor.cost)}</p>
                    </>
                  ) : (
                    <p className="font-medium text-emerald-400">Max level</p>
                  )}
                </div>
              </div>
              {nextSponsor && (
                <Button
                  variant="outline"
                  className="mt-3 w-full rounded-xl"
                  disabled={isLoading || save.balance < nextSponsor.cost}
                  onClick={() => run("sponsor", () => upgradeSponsor(), "Better sponsor secured!")}
                >
                  {busy === "sponsor" ? <Loader2 className="size-4 animate-spin" /> : null}
                  Upgrade sponsor
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MarketCard({
  m,
  balance,
  busy,
  onBuy,
}: {
  m: MarketPlayer;
  balance: number;
  busy: boolean;
  onBuy: () => void;
}) {
  const afford = balance >= m.asking;
  return (
    <div className="group rounded-xl border border-white/8 bg-white/[0.02] p-4 transition-colors hover:border-white/20">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <Flag nat={m.nat} />
          <div>
            <p className="text-sm font-semibold tracking-tight">
              {m.first} {m.last}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {m.age} yrs · Pot {m.pot} · Form {m.form.toFixed(1)}
            </p>
          </div>
        </div>
        <Ovr value={m.ovr} />
      </div>
      <div className="mt-3 flex items-center justify-between">
        <PosBadge pos={m.pos} />
        <span className="font-mono text-xs tabular-nums text-muted-foreground">
          {fmtMoney(m.asking)}
        </span>
      </div>
      <Button
        className="mt-3 w-full rounded-xl"
        size="sm"
        disabled={!afford || busy}
        onClick={onBuy}
      >
        {busy ? <Loader2 className="size-3.5 animate-spin" /> : <BadgePlus className="size-3.5" />}
        {afford ? "Sign player" : "Too expensive"}
      </Button>
    </div>
  );
}
