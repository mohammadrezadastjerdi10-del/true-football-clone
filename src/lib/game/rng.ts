// Deterministic seeded RNG (mulberry32) used across save generation and the
// match engine so a given save + seed always produces the same world.

export class Rng {
  private s: number;

  constructor(seed: number) {
    this.s = seed >>> 0;
  }

  /** float in [0, 1) */
  next(): number {
    let t = (this.s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** int in [min, max] inclusive */
  int(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1));
  }

  /** float in [min, max) */
  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  chance(p: number): boolean {
    return this.next() < p;
  }

  pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }

  pickWeighted<T>(arr: readonly T[], weight: (t: T) => number): T {
    let total = 0;
    for (const a of arr) total += Math.max(0, weight(a));
    let r = this.next() * total;
    for (const a of arr) {
      r -= Math.max(0, weight(a));
      if (r <= 0) return a;
    }
    return arr[arr.length - 1];
  }

  shuffle<T>(arr: T[]): T[] {
    const out = arr.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }

  /** roughly normal-ish value, mean 0, sd ~1 */
  gauss(): number {
    return (this.next() + this.next() + this.next() + this.next() - 2) * 0.75;
  }
}

export function hashSeed(...parts: (string | number)[]): number {
  let h = 2166136261;
  for (const p of parts) {
    const str = String(p);
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    h ^= 0x9e3779b9;
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
