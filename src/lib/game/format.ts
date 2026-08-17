// Small presentation helpers shared by the game UI. Pure functions only.

/** €1,234,567 -> "€1.23M", €980,000 -> "€980K" */
export function fmtMoney(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1_000_000_000) return `${sign}€${(abs / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000) return `${sign}€${(abs / 1_000_000).toFixed(2)}M`;
  if (abs >= 10_000) return `${sign}€${Math.round(abs / 1000)}K`;
  return `${sign}€${abs.toLocaleString()}`;
}

export function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/** "WDLWW" -> ["W","D","L","W","W"] with color classes */
export function formLetters(raw?: unknown): string[] {
  return typeof raw === "string" ? raw.split("") : [];
}

export function formTone(letter: string): string {
  if (letter === "W") return "bg-emerald-500/15 text-emerald-400";
  if (letter === "D") return "bg-zinc-500/15 text-zinc-300";
  return "bg-red-500/15 text-red-400";
}

export function posShort(pos: string): string {
  return pos; // GK / DF / MF / FW already short
}

/** "2025/26" -> "Season 2025/26" helper */
export function seasonLabel(label: string): string {
  return label;
}

export function avg(nums: number[]): number {
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}
