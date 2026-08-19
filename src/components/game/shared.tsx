import { countryById, type ClubDef } from "@/lib/game/world";
import { cn } from "@/lib/utils";
import type { Player } from "@/lib/game/types";
import { avgForm, computeOverall, playerName } from "@/lib/game/sim";
import { formLetters, formTone, fmtMoney } from "@/lib/game/format";
import { num, useLang } from "@/lib/i18n";
import { Badge } from "@/components/ui/badge";

/** Premium SVG shield-shaped club crest with initials */
export function Crest({
  club,
  size = 44,
  className,
}: {
  club: ClubDef;
  size?: number;
  className?: string;
}) {
  const initials = club.short.slice(0, 3);
  // Stable gradient ID based on club + size to avoid SVG ID collisions
  const gradId = `cg-${club.id.replace(/[^a-z0-9]/gi, "")}-${size}`;
  return (
    <span
      className={cn("inline-flex shrink-0 items-center justify-center", className)}
      style={{ width: size, height: (size * 46) / 40 }}
    >
      <svg viewBox="0 0 40 46" width={size} height={(size * 46) / 40} className="drop-shadow-lg">
        {/* Shield body */}
        <path
          d="M20 2 L37 9 L37 26 Q37 38 20 44 Q3 38 3 26 L3 9 Z"
          fill={club.p1}
          stroke="rgba(255,255,255,0.25)"
          strokeWidth="0.6"
        />
        {/* Inner glow gradient for premium feel */}
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.18)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0.0)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.25)" />
          </linearGradient>
        </defs>
        <path
          d="M20 2 L37 9 L37 26 Q37 38 20 44 Q3 38 3 26 L3 9 Z"
          fill={`url(#${gradId})`}
        />
        {/* Highlight line across top for depth */}
        <path
          d="M8 10 L32 10"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="0.3"
          fill="none"
        />
        {/* Initials text */}
        <text
          x="20"
          y="27"
          textAnchor="middle"
          fontFamily="'Inter', system-ui, sans-serif"
          fontWeight="900"
          fontSize="12.5"
          fill={club.p2}
          style={{ filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.3))" }}
        >
          {initials}
        </text>
      </svg>
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
  const { t, lang } = useLang();
  return (
    <div className="flex items-center gap-2.5">
      <Flag nat={p.nat} />
      <div className="leading-tight">
        <div className="text-sm font-medium text-foreground">
          {playerName(p)}
          {p.star && <span className="ms-1 text-amber-300">★</span>}
        </div>
        <div className="text-[11px] text-muted-foreground">
          {t("sq.yrs", { age: num(lang, p.age) })} · {fmtMoney(p.val)}
          {p.injury && <span className="ms-1.5 text-red-400">{t("sq.inj", { weeks: num(lang, p.injury.weeks) })}</span>}
          {p.susp > 0 && <span className="ms-1.5 text-amber-300">{t("sq.susp")}</span>}
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
