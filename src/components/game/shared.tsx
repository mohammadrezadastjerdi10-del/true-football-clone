import { countryById, type ClubDef } from "@/lib/game/world";
import { cn } from "@/lib/utils";
import type { Player } from "@/lib/game/types";
import { avgForm, computeOverall, playerName } from "@/lib/game/sim";
import { formLetters, formTone, fmtMoney } from "@/lib/game/format";
import { Badge } from "@/components/ui/badge";

export function Crest({
  club,
  size = 44,
  className,
}: {
  club: ClubDef;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-xl font-black tracking-tight ring-1 ring-white/10",
        className,
      )}
      style={{
        width: size,
        height: size,
        background: club.p1,
        color: club.p2,
        fontSize: size * 0.28,
      }}
    >
      {club.short.slice(0, 3)}
    </span>
  );
}

export function Flag({ nat, className }: { nat: string; className?: string }) {
  return (
    <span className={cn("inline-block text-sm leading-none", className)}>
      {countryById(nat).flag}
    </span>
  );
}

export function PosBadge({ pos }: { pos: string }) {
  const tone =
    pos === "GK"
      ? "border-amber-400/25 bg-amber-400/10 text-amber-300"
      : pos === "DF"
        ? "border-sky-400/25 bg-sky-400/10 text-sky-300"
        : pos === "MF"
          ? "border-violet-400/25 bg-violet-400/10 text-violet-300"
          : "border-emerald-400/25 bg-emerald-400/10 text-emerald-300";
  return (
    <span
      className={cn(
        "inline-flex w-9 items-center justify-center rounded-md border px-1 py-0.5 text-[10px] font-bold tracking-wider",
        tone,
      )}
    >
      {pos}
    </span>
  );
}

export function Ovr({ value, className }: { value: number; className?: string }) {
  const tone =
    value >= 86
      ? "text-emerald-300"
      : value >= 78
        ? "text-lime-300"
        : value >= 70
          ? "text-amber-200"
          : "text-zinc-400";
  return (
    <span
      className={cn(
        "font-mono text-sm font-bold tabular-nums tracking-tight",
        tone,
        className,
      )}
    >
      {value}
    </span>
  );
}

export function Stat({
  label,
  value,
  className,
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3", className)}>
      <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-1.5 text-lg font-semibold tracking-tight text-foreground">
        {value}
      </div>
    </div>
  );
}

export function Bar({
  value,
  tone,
  className,
}: {
  value: number;
  tone?: "ok" | "warn" | "bad";
  className?: string;
}) {
  const color =
    tone === "bad"
      ? "bg-red-400"
      : tone === "warn"
        ? "bg-amber-400"
        : "bg-emerald-500";
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-white/10", className)}>
      <div
        className={cn("h-full rounded-full transition-all", color)}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

export function SquadRowMeta({ p }: { p: Player }) {
  return (
    <div className="flex items-center gap-2.5">
      <Flag nat={p.nat} />
      <div className="leading-tight">
        <div className="text-sm font-medium text-foreground">
          {playerName(p)}
          {p.star && <span className="ml-1 text-amber-300">★</span>}
        </div>
        <div className="text-[11px] text-muted-foreground">
          {p.age} yrs · {fmtMoney(p.val)}
          {p.injury && <span className="ml-1.5 text-red-400">inj {p.injury.weeks}w</span>}
          {p.susp > 0 && <span className="ml-1.5 text-amber-300">susp</span>}
        </div>
      </div>
    </div>
  );
}

export function FormChips({ p }: { p: Player }) {
  const recent = p.form.slice(-5);
  if (!recent.length) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <div className="flex gap-1">
      {recent.map((r, i) => (
        <span
          key={i}
          className={cn(
            "flex size-5 items-center justify-center rounded font-mono text-[10px] font-bold tabular-nums",
            r >= 7.5
              ? "bg-emerald-500/15 text-emerald-400"
              : r >= 6.5
                ? "bg-zinc-500/15 text-zinc-300"
                : "bg-red-500/15 text-red-400",
          )}
        >
          {r.toFixed(1)}
        </span>
      ))}
    </div>
  );
}

export function ResultChips({ raw }: { raw?: unknown }) {
  const letters = formLetters(raw);
  if (!letters.length) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <div className="flex gap-1">
      {letters.map((l, i) => (
        <span
          key={i}
          className={cn(
            "flex size-5 items-center justify-center rounded text-[10px] font-bold",
            formTone(l),
          )}
        >
          {l}
        </span>
      ))}
    </div>
  );
}

export function PlayerOverall({ p }: { p: Player }) {
  return <Ovr value={computeOverall(p)} />;
}

export function PlayerForm({ p }: { p: Player }) {
  const f = avgForm(p);
  return (
    <span className="font-mono text-sm tabular-nums text-muted-foreground">
      {f.toFixed(1)}
    </span>
  );
}

export function SectionTitle({
  title,
  sub,
  right,
}: {
  title: string;
  sub?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
        {sub && <p className="mt-0.5 text-sm text-muted-foreground">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

export function ChipBadge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <Badge
      variant="outline"
      className={cn("rounded-full border-white/10 bg-white/[0.04] font-medium text-muted-foreground", className)}
    >
      {children}
    </Badge>
  );
}
