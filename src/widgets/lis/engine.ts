/**
 * Pure frame builders for the LIS lab: the O(n log n) tails array with bisect_left, and the O(n^2) dp table.
 * Every frame holds the full state, the running code line and one sentence of narration.
 */
import type { Ask, BaseFrame } from "../dp-table/kit/player";
import { numAsk } from "../dp-table/kit/player";

export type LisMode = "tails" | "quadratic";

export interface LisFrame extends BaseFrame {
  /** index in a being processed (-1 = none) */
  k: number;
  /** quadratic: the j being compared with k */
  j?: number;
  tails: number[];
  /** index in a that last wrote each tails slot */
  tailIdx: number[];
  pos?: number;
  probes?: number[];
  act?: "find" | "append" | "replace";
  old?: number;
  /** dp[i] = LIS length that ends at a[i] (null = not computed yet) */
  dp: (number | null)[];
  /** quadratic: tri[i][j] = dp[j] + 1 if a[j] < a[i], "–" if not, null if not checked yet */
  tri?: (string | null)[][];
  /** quadratic: kind of the current comparison */
  cmp?: "up" | "keep" | "no";
  /** final: indexes of one real LIS */
  lis?: number[];
  bis: number;
  quad: number;
  info?: string;
}
export interface LisRun { frames: LisFrame[]; code: string[]; title: string; result: number }

export const TAILS_CODE = [
  "from bisect import bisect_left",
  "",
  "def lis_length(a):                       # strictly increasing",
  "    tails = []",
  "    for x in a:",
  "        i = bisect_left(tails, x)        # bisect_right for non-decreasing",
  "        if i == len(tails):",
  "            tails.append(x)",
  "        else:",
  "            tails[i] = x",
  "    return len(tails)",
];

export const QUAD_CODE = [
  "def lis_quadratic(a):                    # O(n^2)",
  "    n = len(a)",
  "    dp = [1] * n                         # dp[i] = longest increasing run ending at a[i]",
  "    for i in range(n):",
  "        for j in range(i):",
  "            if a[j] < a[i] and dp[j] + 1 > dp[i]:",
  "                dp[i] = dp[j] + 1",
  "    return max(dp)",
];

/** O(n^2) dp with parents, used for the comparison row and to recover one real LIS. */
export function quadDp(a: number[]) {
  const n = a.length, dp = Array(n).fill(1), par = Array(n).fill(-1);
  for (let i = 0; i < n; i++) for (let j = 0; j < i; j++) if (a[j] < a[i] && dp[j] + 1 > dp[i]) { dp[i] = dp[j] + 1; par[i] = j; }
  let best = 0; for (let i = 1; i < n; i++) if (dp[i] > dp[best]) best = i;
  const lis: number[] = []; for (let i = n ? best : -1; i >= 0; i = par[i]) lis.unshift(i);
  return { dp, lis, len: n ? dp[best] : 0 };
}

const list = (xs: number[]) => `[${xs.join(", ")}]`;

export function buildTails(a: number[]): LisRun {
  const n = a.length;
  const Q = quadDp(a);
  const frames: LisFrame[] = [];
  const tails: number[] = [], tailIdx: number[] = [];
  let bis = 0, quad = 0;
  const dp: (number | null)[] = Array(n).fill(null);
  const push = (f: Omit<LisFrame, "tails" | "tailIdx" | "dp" | "bis" | "quad">, ask?: Ask) => {
    if (ask && frames.length) frames[frames.length - 1].ask = ask;
    frames.push({ ...f, tails: [...tails], tailIdx: [...tailIdx], dp: [...dp], bis, quad });
  };
  push({ k: -1, line: 3, info: "tails = []", say: "tails[k] = the smallest last value of any increasing subsequence of length k + 1. It starts empty and always stays sorted." });
  let askedReplace = false, askedAppend = false;
  for (let k = 0; k < n; k++) {
    const x = a[k];
    let lo = 0, hi = tails.length; const probes: number[] = [];
    while (lo < hi) { const mid = (lo + hi) >> 1; probes.push(mid); if (tails[mid] < x) lo = mid + 1; else hi = mid; }
    const pos = lo;
    bis += probes.length; quad += k; dp[k] = Q.dp[k];
    const say = tails.length === 0 ? `x = ${x}. tails is empty, so bisect_left returns 0.`
      : pos === tails.length ? `x = ${x} is bigger than every tail (the last is ${tails[tails.length - 1]}), so bisect_left returns ${pos} = len(tails). It checked ${probes.length} slot${probes.length === 1 ? "" : "s"}.`
      : `x = ${x}. The first tail ≥ ${x} is tails[${pos}] = ${tails[pos]}, so bisect_left returns ${pos}. It checked ${probes.length} slot${probes.length === 1 ? "" : "s"}${probes.length < tails.length ? `, not all ${tails.length}` : ""}.`;
    let ask: Ask | undefined;
    if (tails.length >= 2) {
      const isApp = pos === tails.length;
      if ((isApp && !askedAppend) || (!isApp && !askedReplace)) {
        if (isApp) askedAppend = true; else askedReplace = true;
        const opts = [`Append ${x}`];
        const reps = [pos, 0, tails.length - 1, Math.max(0, pos - 1)].filter((p, i, arr) => p < tails.length && arr.indexOf(p) === i);
        for (const p of reps) if (opts.length < 3) opts.push(`Replace tails[${p}] = ${tails[p]}`);
        const right = isApp ? 0 : opts.indexOf(`Replace tails[${pos}] = ${tails[pos]}`);
        ask = { q: `x = ${x}, tails = ${list(tails)}. What happens to tails?`, options: opts, answer: right, why: isApp ? `${x} is bigger than every tail, so it extends the longest run.` : `The first tail ≥ ${x} is tails[${pos}] = ${tails[pos]}. ${x} replaces it.` };
      }
    }
    push({ k, line: 5, line2: 4, pos, probes, act: "find", info: `bisect_left(${list(tails)}, ${x}) = ${pos}`, say }, ask);
    if (pos === tails.length) {
      tails.push(x); tailIdx.push(k);
      push({ k, line: 7, line2: 6, pos, act: "append", info: `tails.append(${x})  →  ${list(tails)}`, say: `Append ${x}. Now there is an increasing subsequence of length ${tails.length} that ends in ${x}.` });
    } else {
      const old = tails[pos]; tails[pos] = x; tailIdx[pos] = k;
      push({ k, line: 9, line2: 8, pos, old, act: "replace", info: `tails[${pos}] = ${x}  →  ${list(tails)}`, say: old === x ? `tails[${pos}] is already ${x}. Writing it again changes nothing: equal values never make the run longer (strictly increasing).` : `Replace tails[${pos}] = ${old} with ${x}. A length-${pos + 1} run can now end in a smaller value, which leaves more room to grow later.` });
    }
  }
  const real = tailIdx.every((v, i) => i === 0 || v > tailIdx[i - 1]);
  const lisVals = Q.lis.map((i) => a[i]);
  push({
    k: -1, line: 10, lis: Q.lis, info: `len(tails) = ${tails.length}   ·   max(dp) = ${Q.len}`,
    say: `len(tails) = ${tails.length}: the LIS length, the same as max(dp) in the O(n²) row.` + (real ? ` Here tails ${list(tails)} happens to be a real subsequence too.` : ` But tails ${list(tails)} is not a real subsequence of a. Only its length is the answer. One real LIS is ${list(lisVals)}.`),
  });
  return { frames, code: TAILS_CODE, title: "LIS with tails and bisect_left", result: tails.length };
}

export function buildQuad(a: number[]): LisRun {
  const n = a.length;
  const frames: LisFrame[] = [];
  const dp: number[] = Array(n).fill(1);
  const tri: (string | null)[][] = Array.from({ length: n }, () => Array(n).fill(null));
  let quad = 0;
  const push = (f: Omit<LisFrame, "tails" | "tailIdx" | "dp" | "bis" | "quad" | "tri">, ask?: Ask) => {
    if (ask && frames.length) frames[frames.length - 1].ask = ask;
    frames.push({ ...f, tails: [], tailIdx: [], dp: [...dp], tri: tri.map((r) => [...r]), bis: 0, quad });
  };
  push({ k: -1, line: 2, info: `dp = ${list(dp)}`, say: "dp[i] = the longest increasing subsequence that ends exactly at a[i]. Each element alone has length 1, so dp starts as all 1s." });
  push({ k: 0, line: 3, info: "i = 0", say: "i = 0: there is nothing before a[0], so dp[0] stays 1." });
  let askedNo = false;
  for (let i = 1; i < n; i++) {
    for (let j = 0; j < i; j++) {
      quad++;
      const ok = a[j] < a[i], old = dp[i], cand = dp[j] + 1, up = ok && cand > old;
      if (up) dp[i] = cand;
      tri[i][j] = ok ? String(cand) : "–";
      let ask: Ask | undefined;
      if (!ok && !askedNo) { askedNo = true; ask = { q: `a[${j}] = ${a[j]} and a[${i}] = ${a[i]}. Can a[${j}] come right before a[${i}] in an increasing subsequence?`, options: ["Yes", "No"], answer: 1, why: `${a[j]} ≥ ${a[i]}, so the run would not be strictly increasing.` }; }
      else if (i === n - 1 && j === i - 1) ask = numAsk(`After the last check, what is dp[${i}]?`, dp[i], [old === dp[i] ? dp[i] + 1 : old, cand, dp[i] - 1].filter((q) => q >= 1));
      const say = up ? `a[${j}] = ${a[j]} < a[${i}] = ${a[i]}: extend the run that ends at ${j}. dp[${j}] + 1 = ${cand} > ${old}, so dp[${i}] = ${cand}.`
        : ok ? `a[${j}] = ${a[j]} < a[${i}] = ${a[i]}, but dp[${j}] + 1 = ${cand} is not more than dp[${i}] = ${old}. Keep ${old}.`
        : `a[${j}] = ${a[j]} ≥ a[${i}] = ${a[i]}: it cannot come before a[${i}] in an increasing run. Skip.`;
      push({ k: i, j, cmp: up ? "up" : ok ? "keep" : "no", line: up ? 6 : 5, line2: up ? 5 : 4, info: `check ${quad} of ${(n * (n - 1)) / 2}: a[${j}] ${ok ? "<" : "≥"} a[${i}]`, say }, ask);
    }
  }
  const Q = quadDp(a);
  const logn = Math.max(1, Math.ceil(Math.log2(Math.max(2, n))));
  push({ k: -1, line: 7, lis: Q.lis, info: `max(dp) = ${Q.len}`, say: `max(dp) = ${Q.len}. One LIS is ${list(Q.lis.map((i) => a[i]))}. This took ${quad} checks, about n²/2. The tails method needs about n · log₂ n ≈ ${n * logn}, which matters when n is 100,000.` });
  return { frames, code: QUAD_CODE, title: "LIS with the O(n²) table", result: Q.len };
}
