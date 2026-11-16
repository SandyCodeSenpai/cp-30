/** Small pure helpers shared by the engines. */

/** 1-based line number of the nth line (0-based nth) that contains `needle`. Throws if missing (caught in dev). */
export function lineOf(code: string, needle: string, nth = 0): number {
  const lines = code.split("\n");
  let seen = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(needle)) {
      if (seen === nth) return i + 1;
      seen++;
    }
  }
  throw new Error(`lineOf: "${needle}" (#${nth}) not found`);
}

/** Bind lineOf to one template. */
export const linesFor = (code: string) => (needle: string, nth = 0) => lineOf(code, needle, nth);

export type NumsResult = { ok: true; nums: number[] } | { ok: false; error: string };

/** Parse "1, 2, -3" (commas or spaces). Integers only, with length and value limits. */
export function parseNums(text: string, opts: { min: number; max: number; lo?: number; hi?: number }): NumsResult {
  const lo = opts.lo ?? -99, hi = opts.hi ?? 99;
  const parts = text.split(/[\s,]+/).map((p) => p.trim()).filter(Boolean);
  if (parts.length < opts.min) return { ok: false, error: `Enter at least ${opts.min} numbers.` };
  if (parts.length > opts.max) return { ok: false, error: `Use at most ${opts.max} numbers.` };
  const nums: number[] = [];
  for (const p of parts) {
    if (!/^-?\d+$/.test(p)) return { ok: false, error: `"${p}" is not a whole number.` };
    const v = Number(p);
    if (v < lo || v > hi) return { ok: false, error: `Keep each number between ${lo} and ${hi}.` };
    nums.push(v);
  }
  return { ok: true, nums };
}

export function parseInt1(text: string | undefined, name: string, lo: number, hi: number): { ok: true; v: number } | { ok: false; error: string } {
  const t = (text ?? "").trim();
  if (!/^-?\d+$/.test(t)) return { ok: false, error: `${name} must be a whole number.` };
  const v = Number(t);
  if (v < lo || v > hi) return { ok: false, error: `Keep ${name} between ${lo} and ${hi}.` };
  return { ok: true, v };
}

export const isSorted = (a: number[]) => a.every((x, i) => i === 0 || a[i - 1] <= x);

export const randInt = (lo: number, hi: number) => lo + Math.floor(Math.random() * (hi - lo + 1));
export const pick = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)];

/** Put the correct answer among distractors, dedupe, and shuffle deterministically by a seed. */
export function choices(correct: string, wrong: string[], seed: number): { options: string[]; answer: number } {
  const set: string[] = [correct];
  for (const w of wrong) if (!set.includes(w)) set.push(w);
  const opts = set.slice(0, 3);
  const rot = Math.abs(seed) % opts.length;
  const options = [...opts.slice(rot), ...opts.slice(0, rot)];
  return { options, answer: options.indexOf(correct) };
}

/** Python-style repr of a short list. */
export const pyList = (a: (number | string)[]) => `[${a.join(", ")}]`;
/** Python-style quoted char. */
export const q = (c: string) => `'${c}'`;

/** Build a per-cell tone map: f(i) for each of n cells. */
export function tonesBy<T extends string>(n: number, f: (i: number) => T | undefined): Record<number, T> {
  const out: Record<number, T> = {};
  for (let i = 0; i < n; i++) { const t = f(i); if (t !== undefined) out[i] = t; }
  return out;
}
