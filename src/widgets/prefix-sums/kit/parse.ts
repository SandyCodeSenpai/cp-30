/** Input parsing and random inputs for the step labs. */

export type Parsed<T> = { ok: true; value: T } | { ok: false; error: string };

/** "3, 1, -4 5" -> [3, 1, -4, 5], with length and value limits. */
export function parseNums(text: string, o: { min: number; max: number; lo: number; hi: number }): Parsed<number[]> {
  const parts = text.split(/[\s,]+/).filter(Boolean);
  if (parts.length < o.min) return { ok: false, error: `Enter at least ${o.min} numbers.` };
  if (parts.length > o.max) return { ok: false, error: `Use at most ${o.max} numbers.` };
  const out: number[] = [];
  for (const p of parts) {
    if (!/^-?\d+$/.test(p)) return { ok: false, error: `"${p}" is not a whole number.` };
    const v = Number(p);
    if (v < o.lo || v > o.hi) return { ok: false, error: `Keep values between ${o.lo} and ${o.hi}.` };
    out.push(v);
  }
  return { ok: true, value: out };
}

export function parseInt1(text: string, label: string, lo: number, hi: number): Parsed<number> {
  const t = text.trim();
  if (!/^-?\d+$/.test(t)) return { ok: false, error: `${label} must be a whole number.` };
  const v = Number(t);
  if (v < lo || v > hi) return { ok: false, error: `${label} must be between ${lo} and ${hi}.` };
  return { ok: true, value: v };
}

export const randInt = (lo: number, hi: number) => lo + Math.floor(Math.random() * (hi - lo + 1));
export const randArr = (n: number, lo: number, hi: number) => Array.from({ length: n }, () => randInt(lo, hi));

/** A number with a real minus sign for display. */
export const sn = (v: number) => (v < 0 ? `−${-v}` : String(v));
/** "+ 3" / "− 3" for chained sums. */
export const signed = (v: number) => (v < 0 ? `− ${-v}` : `+ ${v}`);
export const listStr = (a: (number | string)[]) => `[${a.map((v) => (typeof v === "number" ? String(v) : v)).join(", ")}]`;
/** A right-hand operand: negatives get parentheses, so "0 − (−1)" never reads as a double minus. */
export const op = (v: number) => (v < 0 ? `(${sn(v)})` : String(v));
