/** Pure frame builders for the four prefix-sum modes. Input in, list of snapshots out. */
import { makePredict, type Frame } from "./kit/player";
import { listStr, op, sn } from "./kit/parse";

const M = "−"; // minus sign for prose

/* ------------------------------------------------------------------ range-sum */
export const RANGE_CODE = [
  "from itertools import accumulate",
  "",
  "# 1. Prefix sums: sum(a[l..r]) inclusive = pre[r + 1] - pre[l]",
  "pre = list(accumulate(a, initial=0))",
  "",
  "def range_sum(l, r):",
  "    return pre[r + 1] - pre[l]",
];
export interface Query { l: number; r: number }
export interface RangeS { a: number[]; pre: (number | null)[]; cur: number | null; q: Query | null; qs: 0 | 1 | 2 | 3 | 4 }
export const rangeQueryStart = (n: number) => n + 2;

export function rangeFrames(a: number[], q: Query): Frame<RangeS>[] {
  const n = a.length;
  const full = [0]; for (const x of a) full.push(full[full.length - 1] + x);
  const pre = (k: number) => full.map((v, i) => (i <= k ? v : null));
  const F: Frame<RangeS>[] = [];
  F.push({ line: 4, s: { a, pre: pre(0), cur: 0, q: null, qs: 0 }, vars: [["pre[0]", 0]],
    say: "`pre[0] = 0` is the sum of zero elements. `pre[i]` will hold the sum of the first i elements: everything left of line i." });
  for (let k = 1; k <= n; k++) {
    F.push({ line: 4, s: { a, pre: pre(k), cur: k, q: null, qs: 0 }, vars: [[`pre[${k}]`, full[k]]],
      say: `pre[${k}] = pre[${k - 1}] + a[${k - 1}] = ${sn(full[k - 1])} + ${op(a[k - 1])} = ${sn(full[k])}.` });
  }
  F.push({ line: 4, s: { a, pre: pre(n), cur: null, q: null, qs: 0 }, tone: "good",
    say: `One O(n) pass gives ${n + 1} prefix values. Now any range sum is one subtraction.` });
  const { l, r } = q, len = r - l + 1, ans = full[r + 1] - full[l];
  const base = { a, pre: pre(n), cur: null, q };
  F.push({ line: 6, s: { ...base, qs: 1 }, vars: [["l", l], ["r", r]],
    say: `Query: the sum of a[${l}..${r}]. Adding the ${len} values one by one costs ${len} steps for every query.` });
  F.push({ line: 7, s: { ...base, qs: 2 }, vars: [[`pre[${r + 1}]`, full[r + 1]]], tone: "accent",
    say: `pre[${r + 1}] = ${sn(full[r + 1])} is the sum of a[0..${r}]. It covers the range, plus extra on the left.`,
    predict: makePredict(`Which subtraction gives the sum of a[${l}..${r}]?`,
      `pre[${r + 1}] ${M} pre[${l}]`, [`pre[${r}] ${M} pre[${l}]`, `pre[${r + 1}] ${M} pre[${l + 1}]`, `pre[${r}] ${M} pre[${Math.max(0, l - 1)}]`],
      `pre[${r + 1}] covers a[0..${r}] and pre[${l}] covers a[0..${l - 1}]. The difference is exactly a[${l}..${r}].`, l * 7 + r) });
  F.push({ line: 7, s: { ...base, qs: 3 }, vars: [[`pre[${l}]`, full[l]]], tone: "warn",
    say: l === 0 ? "`pre[0] = 0`: the range starts at index 0, so there is nothing extra to remove."
      : `pre[${l}] = ${sn(full[l])} is the sum of a[0..${l - 1}], the extra part. Subtract it.` });
  F.push({ line: 7, s: { ...base, qs: 4 }, vars: [["sum", ans]], tone: "good",
    say: `pre[${r + 1}] ${M} pre[${l}] = ${sn(full[r + 1])} ${M} ${op(full[l])} = ${sn(ans)}. One subtraction: O(1) for any range.` });
  return F;
}

/* ------------------------------------------------------------- subarray-count */
export const COUNT_CODE = [
  "from collections import defaultdict",
  "",
  "# 2. Count subarrays with sum == k (negatives OK)",
  "def count_sum_k(nums, k):",
  "    seen = defaultdict(int)",
  "    seen[0] = 1                         # empty prefix",
  "    run = ans = 0",
  "    for x in nums:",
  "        run += x",
  "        ans += seen[run - k]",
  "        seen[run] += 1",
  "    return ans",
];
export interface CountS {
  a: number[]; k: number; i: number; run: number | null; ans: number | null;
  pre: (number | null)[];
  seen: [number, number][];
  hot: { key: number; kind: "add" | "hit" | "miss" } | null;
  matches: number[]; // start indexes p: a[p..i] sums to k
  found: [number, number][];
}

export function countFrames(a: number[], k: number): Frame<CountS>[] {
  const n = a.length;
  const full = [0]; for (const x of a) full.push(full[full.length - 1] + x);
  const pre = (t: number) => full.map((v, i) => (i <= t ? v : null));
  const F: Frame<CountS>[] = [];
  const seen = new Map<number, number>();
  const snap = () => [...seen.entries()] as [number, number][];
  const found: [number, number][] = [];
  const base = { a, k };
  F.push({ line: 5, s: { ...base, i: -1, run: null, ans: null, pre: pre(-1), seen: [], hot: null, matches: [], found: [] },
    say: "`seen` maps a prefix sum to how many times it has appeared so far." });
  seen.set(0, 1);
  F.push({ line: 6, s: { ...base, i: -1, run: null, ans: null, pre: pre(0), seen: snap(), hot: { key: 0, kind: "add" }, matches: [], found: [] },
    say: "`seen[0] = 1` is the empty prefix. Without it you miss every subarray that starts at index 0." });
  let run = 0, ans = 0;
  F.push({ line: 7, s: { ...base, i: -1, run, ans, pre: pre(0), seen: snap(), hot: null, matches: [], found: [] }, vars: [["run", 0], ["ans", 0]],
    say: `run is the prefix sum so far; ans counts subarrays with sum k = ${sn(k)}.` });
  let asked = 0;
  for (let i = 0; i < n; i++) {
    const x = a[i];
    const old = run; run += x;
    F.push({ line: 9, s: { ...base, i, run, ans, pre: pre(i + 1), seen: snap(), hot: null, matches: [], found: [...found] }, vars: [["x", x], ["run", run], ["ans", ans]],
      say: `x = a[${i}] = ${sn(x)}. run = ${sn(old)} + ${op(x)} = ${sn(run)}, the sum of a[0..${i}].` });
    const need = run - k, c = seen.get(need) ?? 0;
    const matches: number[] = [];
    for (let p = 0; p <= i; p++) if (full[p] === need) matches.push(p);
    for (const p of matches) found.push([p, i]);
    const prevAns = ans; ans += c;
    const opts = Array.from({ length: Math.max(3, c + 2) }, (_, t) => String(t)).slice(0, 4);
    const ask = asked < 4 && (c > 0 || i === 0 || i % 3 === 1);
    if (ask) asked++;
    F.push({ line: 10, s: { ...base, i, run, ans, pre: pre(i + 1), seen: snap(), hot: { key: need, kind: c ? "hit" : "miss" }, matches, found: [...found] },
      vars: [["run - k", need], ["seen[run - k]", c], ["ans", ans]], tone: c ? "good" : "neutral",
      say: c ? `Need run ${M} k = ${sn(run)} ${M} ${op(k)} = ${sn(need)}. seen[${sn(need)}] = ${c}, so ${c === 1 ? "1 subarray ends" : `${c} subarrays end`} here with sum ${sn(k)}. ans = ${prevAns} + ${c} = ${ans}.`
        : `Need run ${M} k = ${sn(run)} ${M} ${op(k)} = ${sn(need)}. No earlier prefix equals ${sn(need)}, so ans stays ${ans}.`,
      predict: ask ? makePredict(`run = ${sn(run)} and k = ${sn(k)}. How much does \`seen[run - k]\` add to ans?`, String(c), opts.filter((o) => o !== String(c)),
        c ? `${c === 1 ? "One earlier prefix equals" : `${c} earlier prefixes equal`} ${sn(need)}. Each one starts a subarray that ends at index ${i} and sums to ${sn(k)}.`
          : `No earlier prefix equals run ${M} k = ${sn(need)}, so no subarray ending at index ${i} sums to ${sn(k)}.`, i) : undefined });
    seen.set(run, (seen.get(run) ?? 0) + 1);
    F.push({ line: 11, s: { ...base, i, run, ans, pre: pre(i + 1), seen: snap(), hot: { key: run, kind: "add" }, matches: [], found: [...found] },
      vars: [[`seen[${run}]`, seen.get(run) ?? 0], ["ans", ans]],
      say: `Record this prefix: seen[${sn(run)}] is now ${seen.get(run)}. Later subarrays may start right after it.` });
  }
  F.push({ line: 12, s: { ...base, i: n, run, ans, pre: pre(n), seen: snap(), hot: null, matches: [], found: [...found] }, tone: "good", vars: [["ans", ans]],
    say: `return ${ans}. Each subarray was counted once, at its right end. One pass, O(n), and negatives are fine.` });
  return F;
}

/* ----------------------------------------------------------------- difference */
export const DIFF_CODE = [
  "from itertools import accumulate",
  "",
  "# 4. Difference array: apply (l, r, v) updates, inclusive, 0-indexed",
  "def apply_updates(n, updates):",
  "    diff = [0] * (n + 1)",
  "    for l, r, v in updates:",
  "        diff[l] += v",
  "        diff[r + 1] -= v",
  "    return list(accumulate(diff))[:n]",
];
export type Update = [number, number, number];
export interface DiffS {
  n: number; ups: Update[]; diff: number[]; u: number; applied: number;
  hot: { idx: number; delta: number; kind: "start" | "stop" } | null;
  out: (number | null)[]; acc: number | null; done: boolean;
}

export function diffFrames(n: number, ups: Update[]): Frame<DiffS>[] {
  const F: Frame<DiffS>[] = [];
  const diff = Array(n + 1).fill(0) as number[];
  const out: (number | null)[] = Array(n + 1).fill(null);
  const base = { n, ups };
  const s = (o: Partial<DiffS>): DiffS => ({ ...base, diff: [...diff], u: -1, applied: 0, hot: null, out: [...out], acc: null, done: false, ...o });
  F.push({ line: 5, s: s({}), say: `diff has n + 1 = ${n + 1} cells. The extra cell catches r + 1 when r is the last index.` });
  ups.forEach(([l, r, v], u) => {
    F.push({ line: 6, s: s({ u, applied: u }), vars: [["l", l], ["r", r], ["v", v]],
      say: `Update (${l}, ${r}, ${sn(v)}): add ${sn(v)} to a[${l}..${r}]. Writing every cell would cost ${r - l + 1} steps.` });
    const o1 = diff[l]; diff[l] += v;
    F.push({ line: 7, s: s({ u, applied: u, hot: { idx: l, delta: v, kind: "start" } }), vars: [[`diff[${l}]`, diff[l]]], tone: "accent",
      say: `diff[${l}] = ${sn(o1)} + ${op(v)} = ${sn(diff[l])}. From index ${l} on, the running sum carries ${sn(v)}.` });
    const o2 = diff[r + 1]; diff[r + 1] -= v;
    F.push({ line: 8, s: s({ u, applied: u + 1, hot: { idx: r + 1, delta: -v, kind: "stop" } }), vars: [[`diff[${r + 1}]`, diff[r + 1]]], tone: "warn",
      say: `diff[${r + 1}] = ${sn(o2)} ${M} ${op(v)} = ${sn(diff[r + 1])}. This cancels ${sn(v)} after index ${r}. Two writes, O(1).`,
      predict: u === 0 ? makePredict("Why does the template write `diff[r + 1] -= v`?", `To stop adding ${sn(v)} after index ${r}`,
        [`To undo the write at index ${l}`, "Because Python lists start at 1"],
        `The prefix sum carries ${sn(v)} forward from index ${l} forever. Subtracting ${sn(v)} at r + 1 = ${r + 1} cancels it, so only a[${l}..${r}] gets it.`, 3) : undefined });
  });
  let run = 0;
  const askAt = Math.min(n - 1, Math.max(1, ups.length ? ups[0][0] + 1 : 1));
  for (let k = 0; k <= n; k++) {
    const prev = run; run += diff[k]; out[k] = run;
    F.push({ line: 9, s: s({ applied: ups.length, acc: k }), vars: [["k", k], ["running", run]], tone: k === n ? "neutral" : "accent",
      say: k === n ? `The extra cell: ${sn(prev)} + ${op(diff[k])} = ${sn(run)}. It is always 0, and \`[:n]\` drops it.`
        : `running = ${sn(prev)} + diff[${k}] (${sn(diff[k])}) = ${sn(run)}. That is the final a[${k}].`,
      predict: k === askAt ? makePredict(`The running sum is ${sn(prev)} and diff[${k}] = ${sn(diff[k])}. What is the final a[${k}]?`, sn(run),
        [sn(diff[k]), sn(prev), sn(prev - diff[k]), sn(run + 1)], `The running sum of diff is the final array: ${sn(prev)} + ${op(diff[k])} = ${sn(run)}.`, k) : undefined });
  }
  const res = out.slice(0, n) as number[];
  F.push({ line: 9, s: s({ applied: ups.length, done: true }), tone: "good", vars: [["result", listStr(res.map(sn))]],
    say: `Result ${listStr(res.map(sn))}. ${ups.length} updates cost O(q + n) instead of O(q · n).` });
  return F;
}

/* ----------------------------------------------------------------------- grid */
export const GRID_CODE = [
  "# 5. 2-D prefix: sum of rows r1..r2, cols c1..c2 inclusive",
  "def build_2d(g):",
  "    n, m = len(g), len(g[0])",
  "    P = [[0] * (m + 1) for _ in range(n + 1)]",
  "    for i in range(n):",
  "        for j in range(m):",
  "            P[i + 1][j + 1] = g[i][j] + P[i][j + 1] + P[i + 1][j] - P[i][j]",
  "    return P",
  "",
  "def rect(P, r1, c1, r2, c2):",
  "    return P[r2 + 1][c2 + 1] - P[r1][c2 + 1] - P[r2 + 1][c1] + P[r1][c1]",
];
export interface Rect { r1: number; c1: number; r2: number; c2: number }
export interface GridS { g: number[][]; P: (number | null)[][]; cur: [number, number] | null; q: Rect | null; qs: 0 | 1 | 2 | 3 | 4 | 5 | 6 }
export const gridQueryStart = (g: number[][]) => g.length * g[0].length + 3;

export function gridFrames(g: number[][], q: Rect): Frame<GridS>[] {
  const n = g.length, m = g[0].length;
  const P: (number | null)[][] = Array.from({ length: n + 1 }, (_, i) => Array.from({ length: m + 1 }, (_, j) => (i === 0 || j === 0 ? 0 : null)));
  const Pc = () => P.map((row) => [...row]);
  const F: Frame<GridS>[] = [];
  F.push({ line: 3, s: { g, P: Pc().map((r) => r.map(() => null)), cur: null, q: null, qs: 0 }, vars: [["n", n], ["m", m]],
    say: `The grid has n = ${n} rows and m = ${m} columns.` });
  F.push({ line: 4, s: { g, P: Pc(), cur: null, q: null, qs: 0 },
    say: `P is (n + 1) × (m + 1) = ${n + 1} × ${m + 1}. Row 0 and column 0 stay 0: the empty prefix.` });
  for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) {
    const up = P[i][j + 1] as number, left = P[i + 1][j] as number, diag = P[i][j] as number;
    const v = g[i][j] + up + left - diag; P[i + 1][j + 1] = v;
    F.push({ line: 7, s: { g, P: Pc(), cur: [i, j], q: null, qs: 0 }, vars: [[`P[${i + 1}][${j + 1}]`, v]],
      say: `P[${i + 1}][${j + 1}] = g[${i}][${j}] + up + left ${M} corner = ${sn(g[i][j])} + ${op(up)} + ${op(left)} ${M} ${op(diag)} = ${sn(v)}.` });
  }
  F.push({ line: 8, s: { g, P: Pc(), cur: null, q: null, qs: 0 }, tone: "good",
    say: `P is built in O(n · m). P[i][j] is the sum of the top-left block with i rows and j columns.` });
  const { r1, c1, r2, c2 } = q;
  const A = P[r2 + 1][c2 + 1] as number, B = P[r1][c2 + 1] as number, C = P[r2 + 1][c1] as number, D = P[r1][c1] as number;
  const ans = A - B - C + D;
  const s = (qs: GridS["qs"]): GridS => ({ g, P: Pc(), cur: null, q, qs });
  F.push({ line: 10, s: s(1), vars: [["r1", r1], ["c1", c1], ["r2", r2], ["c2", c2]],
    say: `Query: rows ${r1}..${r2}, columns ${c1}..${c2}. That is ${(r2 - r1 + 1) * (c2 - c1 + 1)} cells, but we only need 4 lookups.` });
  F.push({ line: 11, s: s(2), tone: "accent", vars: [[`P[${r2 + 1}][${c2 + 1}]`, A]],
    say: `Start with P[${r2 + 1}][${c2 + 1}] = ${sn(A)}: everything from the top-left corner down to (${r2}, ${c2}).` });
  F.push({ line: 11, s: s(3), tone: "warn", vars: [[`P[${r1}][${c2 + 1}]`, B]],
    say: r1 === 0 ? `P[0][${c2 + 1}] = 0: there are no rows above the query.` : `Subtract P[${r1}][${c2 + 1}] = ${sn(B)}: the rows above the query.` });
  F.push({ line: 11, s: s(4), tone: "warn", vars: [[`P[${r2 + 1}][${c1}]`, C]],
    say: c1 === 0 ? `P[${r2 + 1}][0] = 0: there are no columns left of the query.` : `Subtract P[${r2 + 1}][${c1}] = ${sn(C)}: the columns left of the query.` });
  F.push({ line: 11, s: s(5), tone: "accent", vars: [[`P[${r1}][${c1}]`, D]],
    say: `The corner block P[${r1}][${c1}] = ${sn(D)} was subtracted twice. Add it back once.`,
    predict: makePredict(`The top-left corner block P[${r1}][${c1}] was inside both subtracted parts. What do you do with it?`,
      "Add it back once", ["Subtract it once more", "Nothing, it is already right"],
      "It was removed twice but should be removed once. So add it back one time. This is inclusion-exclusion.", 5) });
  F.push({ line: 11, s: s(6), tone: "good", vars: [["sum", ans]],
    say: `${sn(A)} ${M} ${op(B)} ${M} ${op(C)} + ${op(D)} = ${sn(ans)}. Four lookups: O(1) per rectangle.` });
  return F;
}
