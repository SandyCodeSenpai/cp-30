/** Numbers and text for the complexity lab. All speeds and rows come from the book (Day 1 and chapter 9). */

export type Cx = "log" | "sqrt" | "n" | "nlogn" | "n2" | "n3" | "2n" | "fact";

export interface CxInfo { id: Cx; label: string; rank: number }
/** Fastest first. `rank` orders them so we can say "faster" or "slower". */
export const CXS: CxInfo[] = [
  { id: "log", label: "O(log n)", rank: 0 },
  { id: "sqrt", label: "O(√n)", rank: 1 },
  { id: "n", label: "O(n)", rank: 2 },
  { id: "nlogn", label: "O(n log n)", rank: 3 },
  { id: "n2", label: "O(n²)", rank: 4 },
  { id: "n3", label: "O(n³)", rank: 5 },
  { id: "2n", label: "O(2ⁿ · n)", rank: 6 },
  { id: "fact", label: "O(n!)", rank: 7 },
];
export const CX: Record<Cx, CxInfo> = Object.fromEntries(CXS.map((c) => [c.id, c])) as Record<Cx, CxInfo>;

/** Simple operations per second (book, Day 1 "Python trap"). */
export const CPY = 1e7;
export const PYPY = 1e8;

function log10Fact(n: number): number {
  if (n <= 1) return 0;
  if (n <= 2000) { let s = 0; for (let k = 2; k <= n; k++) s += Math.log10(k); return s; }
  return n * Math.log10(n / Math.E) + 0.5 * Math.log10(2 * Math.PI * n);
}

/** log10 of the operation count. Logs keep 2^n and n! finite at any n. */
export function log10Ops(c: Cx, n: number): number {
  const L = Math.log10(Math.max(1, n));
  const lg2 = Math.max(1, Math.log2(Math.max(2, n)));
  switch (c) {
    case "log": return Math.log10(lg2);
    case "sqrt": return L / 2;
    case "n": return L;
    case "nlogn": return L + Math.log10(lg2);
    case "n2": return 2 * L;
    case "n3": return 3 * L;
    case "2n": return n * Math.log10(2) + L;
    case "fact": return log10Fact(n);
  }
}

const SUP: Record<string, string> = { "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹", "-": "⁻" };
export const sup = (s: string | number) => String(s).split("").map((c) => SUP[c] ?? c).join("");

/** 2·10⁵ style. Small numbers get commas. */
export function fmtN(n: number): string {
  if (n < 10000) return n.toLocaleString("en-US");
  const e = Math.floor(Math.log10(n) + 1e-9);
  const m = Math.round((n / 10 ** e) * 10) / 10;
  return m === 1 ? `10${sup(e)}` : `${m}·10${sup(e)}`;
}

/** An operation count given as log10. */
export function fmtOps(L: number): string {
  if (L < 4) return Math.round(10 ** L).toLocaleString("en-US");
  if (L < 21) {
    let e = Math.floor(L);
    let m = Math.round(10 ** (L - e) * 10) / 10;
    if (m >= 10) { m = 1; e += 1; }
    return m === 1 ? `10${sup(e)}` : `${m}·10${sup(e)}`;
  }
  if (L < 1e4) return `10${sup(Math.floor(L))}`;
  return `10^(${fmtN(Math.round(L))})`;
}

/** A run time given as log10(seconds). */
export function fmtTime(ls: number): string {
  if (ls < -3) return "under 1 ms";
  const s = 10 ** ls;
  if (s < 0.1) return `${Math.round(s * 1000)} ms`;
  if (s < 1) return `${s.toFixed(2).replace(/0$/, "")} s`;
  if (s < 10) return `${s.toFixed(1).replace(/\.0$/, "")} s`;
  if (s < 60) return `${Math.round(s)} s`;
  if (s < 3600) return `${Math.round(s / 60)} min`;
  if (s < 86400) return `${Math.round(s / 3600)} h`;
  const years = ls - Math.log10(3.156e7);
  if (years < 0) return `${Math.round(s / 86400)} days`;
  if (years < 4) return `${Math.round(10 ** years).toLocaleString("en-US")} years`;
  if (years < 10.14) return `${fmtOps(years)} years`;
  return "longer than the age of the universe";
}

/** "about 2.5 s", or a phrase without "about" for absurd times. */
export function aboutTime(ls: number): string {
  const t = fmtTime(ls);
  return t.startsWith("longer") || t.startsWith("under") ? t : `about ${t}`;
}

export const secondsLog = (L: number, speed: number) => L - Math.log10(speed);

/** Does this op count fit in `limit` seconds at `speed` ops/s? */
export const fits = (L: number, speed: number, limit: number) => L <= Math.log10(speed * limit) + 1e-9;

export type RowVerdict = "pass" | "pypy" | "tle";
export function rowVerdict(L: number, limit: number): RowVerdict {
  if (fits(L, CPY, limit)) return "pass";
  if (fits(L, PYPY, limit)) return "pypy";
  return "tle";
}

/** The book's constraint table (Day 1), with the √n row from chapter 9 so every complexity has a row. */
export interface BookRow { max: number; nLabel: string; cx: Cx; target: string; ops: string; tool: string; why: string }
export const BOOK: BookRow[] = [
  { max: 10, nLabel: "n ≤ 10", cx: "fact", target: "O(n!)", ops: "3.6·10⁶", tool: "Try every permutation", why: "10! ≈ 3.6·10⁶ operations: fine even in CPython." },
  { max: 20, nLabel: "n ≤ 20", cx: "2n", target: "O(2ⁿ · n)", ops: "10⁶ – 2·10⁷", tool: "Every subset, bitmask", why: "2²⁰ · 20 ≈ 2·10⁷: PyPy is fine, CPython is tight." },
  { max: 500, nLabel: "n ≤ 500", cx: "n3", target: "O(n³)", ops: "1.25·10⁸", tool: "Triple loop, interval DP, Floyd", why: "500³ = 1.25·10⁸: risky even in PyPy. Keep the inner loop tiny." },
  { max: 5000, nLabel: "n ≤ 5000", cx: "n2", target: "O(n²)", ops: "2.5·10⁷", tool: "Every pair, 2-D DP", why: "5000² = 2.5·10⁷: fine in PyPy (about 0.25 s), too slow in CPython (about 2.5 s)." },
  { max: 2e5, nLabel: "n ≤ 2·10⁵", cx: "nlogn", target: "O(n log n)", ops: "3.5·10⁶", tool: "Sort, binary search, heap", why: "Any double loop is dead: (2·10⁵)² = 4·10¹⁰. O(n log n) is safe everywhere." },
  { max: 1e6, nLabel: "n ≤ 10⁶", cx: "n", target: "O(n)", ops: "10⁶", tool: "One pass: hash map, window, stack", why: "One pass. Even n log n is 2·10⁷ here, about 2 s in CPython. Read input fast." },
  { max: 1e12, nLabel: "n ≤ 10¹²", cx: "sqrt", target: "O(√n)", ops: "10⁶", tool: "Trial division up to √n", why: "√10¹² = 10⁶: you can loop up to the square root, never up to n." },
  { max: 1e18, nLabel: "n ≤ 10¹⁸", cx: "log", target: "O(log n)", ops: "about 60", tool: "Binary search on the answer, fast power, formula", why: "Any loop up to n is dead. log₂ 10¹⁸ ≈ 60 steps." },
];
export const bookRowFor = (n: number) => BOOK.findIndex((r) => n <= r.max + 1e-9) === -1 ? BOOK.length - 1 : BOOK.findIndex((r) => n <= r.max + 1e-9);

/** Slider stops for n (log-like spacing). Includes every book row's max. */
export const N_STOPS = [2, 3, 4, 5, 6, 8, 10, 12, 15, 18, 20, 25, 30, 40, 50, 75, 100, 200, 300, 500, 1000, 2000, 3000, 5000,
  1e4, 2e4, 5e4, 1e5, 2e5, 5e5, 1e6, 1e7, 1e8, 1e9, 1e10, 1e12, 1e15, 1e18];
export function nearestStop(n: number): number {
  let best = 0, d = Infinity;
  N_STOPS.forEach((s, i) => { const x = Math.abs(Math.log10(s) - Math.log10(Math.max(1, n))); if (x < d) { d = x; best = i; } });
  return best;
}

/** Budget-mode question pool: a few LeetCode/Codeforces-style constraint blocks per book row. */
export interface Question { n: number; lines: string[] }
export const POOL: Question[][] = [
  [{ n: 8, lines: ["1 ≤ n ≤ 8", "1 ≤ cost[i][j] ≤ 100"] }, { n: 10, lines: ["1 ≤ nums.length ≤ 10", "All values are distinct"] }],
  [{ n: 16, lines: ["1 ≤ n ≤ 16", "0 ≤ dist[i][j] ≤ 10⁶"] }, { n: 20, lines: ["1 ≤ nums.length ≤ 20", "−10⁷ ≤ nums[i] ≤ 10⁷"] }],
  [{ n: 300, lines: ["1 ≤ nums.length ≤ 300", "0 ≤ nums[i] ≤ 100"] }, { n: 500, lines: ["1 ≤ n ≤ 500", "1 ≤ w[i][j] ≤ 10⁹"] }],
  [{ n: 3000, lines: ["3 ≤ nums.length ≤ 3000", "−10⁵ ≤ nums[i] ≤ 10⁵"] }, { n: 5000, lines: ["1 ≤ s.length ≤ 5000", "s has lowercase letters only"] }],
  [{ n: 1e5, lines: ["1 ≤ nums.length ≤ 10⁵", "1 ≤ nums[i] ≤ 10⁴"] }, { n: 2e5, lines: ["1 ≤ n ≤ 2·10⁵", "1 ≤ a[i] ≤ 10⁹"] }],
  [{ n: 1e6, lines: ["1 ≤ s.length ≤ 10⁶", "s has lowercase letters only"] }, { n: 1e6, lines: ["1 ≤ n ≤ 10⁶", "0 ≤ a[i] ≤ 10⁹"] }],
  [{ n: 1e9, lines: ["1 ≤ n ≤ 10⁹"] }, { n: 1e12, lines: ["1 ≤ x ≤ 10¹²", "Print every prime factor of x"] }],
  [{ n: 1e18, lines: ["1 ≤ n ≤ 10¹⁸", "Print the answer modulo 10⁹+7"] }, { n: 1e18, lines: ["1 ≤ k ≤ 10¹⁸"] }],
];
export function questionFor(n: number): Question {
  const row = bookRowFor(n);
  const hit = POOL[row].find((q) => q.n === n);
  return hit ?? { n, lines: [`1 ≤ n ≤ ${fmtN(n)}`] };
}
