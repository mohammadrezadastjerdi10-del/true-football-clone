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
import { computeOverall, playerName, sortSquad } from "@/lib/game/sim";
import type { MarketPlayer, SaveData } from "@/lib/game/types";
import { PlayerSheet } from "@/components/game/PlayerSheet";
import { Flag, Ovr, PosBadge, SectionTitle } from "@/components/game/shared";
import { fmtMoney } from "@/lib/game/format";
import { cn } from "@/lib/utils";
import { faDigits, num, useLang } from "@/lib/i18n";
import { BadgePlus, Check, Loader2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

const POS_FILTERS = ["All", "GK", "DF", "MF", "FW"] as const;

export function TransfersTab({ save }: { save: SaveData }) {
  const { buyPlayer, transferListPlayer, unlistPlayer, acceptOffer, rejectOffer, isLoading } = useSave();
  const { t, lang } = useLang();
  const [posFilter, setPosFilter] = useState<(typeof POS_FILTERS)[number]>("All");
  const [listPid, setListPid] = useState<string>("");
  const [listPrice, setListPrice] = useState("500000");
  const [busy, setBusy] = useState<string | null>(null);
  const [scoutId, setScoutId] = useState<string | null>(null);
  const scouted = save.market.find((m) => m.id === scoutId) ?? null;

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
      const res = (await fn()) as { ok?: boolean; error?: string } | undefined;
      if (res && res.ok === false) {
        toast.error(res.error ?? t("tf.failed"));
        return;
      }
      if (success) toast.success(success);
    } catch (e) {
      console.error(e);
      toast.error(t("tf.failed"));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Market */}
      <div className="rounded-2xl border border-white/8 bg-card p-6">
        <SectionTitle
          title={t("tf.market")}
          sub={t("tf.marketSub", { count: num(lang, save.market.length), budget: fmtMoney(save.balance) })}
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
                  {f === "All" ? t("tf.all") : f}
                </button>
              ))}
            </div>
          }
        />
        <p className="mt-3 text-[11px] text-muted-foreground">
          {t("tf.scoutHint")}
        </p>
        <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {market.map((m) => (
            <MarketCard
              key={m.id}
              m={m}
              balance={save.balance}
              busy={busy === m.id}
              lang={lang}
              onOpen={() => setScoutId(m.id)}
              onBuy={() => run(m.id, () => buyPlayer({ marketId: m.id }), t("tf.signed"))}
            />
          ))}
          {market.length === 0 && (
            <p className="col-span-full py-10 text-center text-sm text-muted-foreground">
              {t("tf.noPlayers")}
            </p>
          )}
        </div>
      </div>

      {/* Listed players + offers */}
      <div className="rounded-2xl border border-white/8 bg-card p-6">
        <SectionTitle title={t("tf.listTitle")} sub={t("tf.listSub")} />
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <Select value={listPid} onValueChange={setListPid}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder={t("tf.choosePlayer")} />
            </SelectTrigger>
            <SelectContent>
              {squadSorted.map((p) => (
                <SelectItem key={p.id} value={p.id} disabled={save.listed[p.id] != null}>
                  {playerName(p)} ({num(lang, computeOverall(p))}) {save.listed[p.id] != null ? t("tf.listed") : ""}
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
            aria-label={t("tf.asking")}
          />
          <Button
            variant="outline"
            className="gap-2 rounded-xl"
            disabled={!listPid || isLoading}
            onClick={() =>
              run(listPid, () => transferListPlayer({ playerId: listPid, price: Number(listPrice) || 500000 }), t("tf.listedOk"))
            }
          >
            <BadgePlus className="size-4" />
            {t("tf.list")}
          </Button>
        </div>

        <div className="mt-5 space-y-2.5">
          {listedPlayers.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {t("tf.nobodyListed")}
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
                  {t("tf.unlist")}
                </Button>
              </div>
              {(save.offers[p.id] ?? []).map((o) => (
                <div key={o.id} className="mt-3 flex items-center justify-between rounded-lg border border-amber-400/15 bg-amber-400/[0.04] px-3 py-2.5">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {t("tf.offer", { club: o.from, amount: fmtMoney(o.amount) })}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {t("tf.weeklyWage", { wage: fmtMoney(o.weeklyWage) })}
                    </p>
                  </div>
                  <div className="flex gap-1.5">
                    <Button size="sm" variant="outline" className="gap-1 rounded-lg border-emerald-500/30 text-emerald-300" disabled={isLoading} onClick={() => run(o.id, () => acceptOffer({ playerId: p.id, offerId: o.id }), t("tf.accepted"))}>
                      <Check className="size-3.5" />
                      {t("tf.accept")}
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

      <PlayerSheet
        player={scouted}
        mode="market"
        open={scouted != null}
        onOpenChange={(o) => { if (!o) setScoutId(null); }}
      />
    </div>
  );
}

function MarketCard({
  m,
  balance,
  busy,
  onBuy,
  onOpen,
  lang,
}: {
  m: MarketPlayer;
  balance: number;
  busy: boolean;
  onBuy: () => void;
  onOpen: () => void;
  lang: "en" | "fa";
}) {
  const { t } = useLang();
  const afford = balance >= m.asking;
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onOpen(); }}
      className="group cursor-pointer rounded-xl border border-white/8 bg-white/[0.02] p-4 transition-colors hover:border-emerald-500/40"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <Flag nat={m.nat} />
          <div>
            <p className="text-sm font-semibold tracking-tight">
              {m.first} {m.last}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {t("sq.yrs", { age: num(lang, m.age) })} · {t("sq.pot")} {num(lang, m.pot)} · {t("sq.form")} {lang === "fa" ? faDigits(m.form.toFixed(1)) : m.form.toFixed(1)}
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
        onClick={(e) => { e.stopPropagation(); onBuy(); }}
      >
        {busy ? <Loader2 className="size-3.5 animate-spin" /> : <BadgePlus className="size-3.5" />}
        {afford ? t("tf.signPlayer") : t("tf.tooExpensive")}
      </Button>
    </div>
  );
}
