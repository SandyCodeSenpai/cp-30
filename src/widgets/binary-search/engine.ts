/** Pure frame builders for the binary-search lab. No React here. */
import type { BaseFrame } from "./player";

export type BsMode = "classic" | "boundary" | "on-answer";
export type Cond = "ge" | "gt" | "rot";
export type Problem = "koko" | "split";

export interface KokoCheck { kind: "koko"; k: number; piles: number[]; hours: number[]; total: number; h: number; ok: boolean }
export interface SplitCheck { kind: "split"; cap: number; parts: number[][]; k: number; ok: boolean }
export type Check = KokoCheck | SplitCheck;

export interface BsFrame extends BaseFrame {
  lo: number; hi: number; mid: number | null;
  /** ok(x) for values that were checked (by domain offset). */
  known: Record<number, boolean>;
  /** Domain = [d0, d1] (array indexes, or answer values). */
  d0: number; d1: number;
  phase: "init" | "loop" | "mid" | "test" | "move" | "end" | "done";
  /** Result shown on the last frame. */
  result?: number;
  found?: boolean;
  /** on-answer: the check being evaluated (or pending). */
  check?: Check; pending?: boolean;
}

/* ---------------- Code templates (from Day 6) ---------------- */

export const CODE_CLASSIC = [
  "# LC 704 Binary Search: template 1 with ok = a[mid] >= target",
  "def search(a, target):",
  "    lo, hi = 0, len(a)          # a[:lo] < target <= a[hi:]",
  "    while lo < hi:",
  "        mid = (lo + hi) // 2",
  "        if a[mid] >= target:",
  "            hi = mid",
  "        else:",
  "            lo = mid + 1",
  "    if lo < len(a) and a[lo] == target:",
  "        return lo",
  "    return -1",
];

const FIRST_TRUE = [
  "# First x in [lo, hi] with ok(x) True. ok must be F..F T..T and ok(hi) True.",
  "def first_true(lo, hi, ok):",
  "    while lo < hi:",
  "        mid = (lo + hi) // 2",
  "        if ok(mid):",
  "            hi = mid",
  "        else:",
  "            lo = mid + 1",
  "    return lo",
  "",
];
const FT = { while: 2, mid: 3, test: 4, hi: 5, lo: 7, ret: 8 };

export const COND_INFO: Record<Cond, { label: string; tail: string[]; okText: (x: number) => string; name: string }> = {
  ge: { label: "a[i] >= x", name: "bisect_left", okText: (x) => `a[i] >= ${x}`,
    tail: ["# bisect_left(a, x): first index with a[i] >= x", "i = first_true(0, len(a), lambda i: a[i] >= x)"] },
  gt: { label: "a[i] > x", name: "bisect_right", okText: (x) => `a[i] > ${x}`,
    tail: ["# bisect_right(a, x): first index with a[i] > x", "i = first_true(0, len(a), lambda i: a[i] > x)"] },
  rot: { label: "a[i] <= a[-1]", name: "min of rotated", okText: () => "a[i] <= a[-1]",
    tail: ["# LC 153 Find Minimum in Rotated Sorted Array", "i = first_true(0, len(a) - 1, lambda i: a[i] <= a[-1])"] },
};
export const codeBoundary = (c: Cond) => [...FIRST_TRUE, ...COND_INFO[c].tail];

export const CODE_KOKO = [
  ...FIRST_TRUE.slice(1),
  "# LC 875 Koko Eating Bananas",
  "def min_eating_speed(piles, h):",
  "    return first_true(1, max(piles),",
  "                      lambda k: sum((p + k - 1) // k for p in piles) <= h)",
];
export const CODE_SPLIT = [
  ...FIRST_TRUE.slice(1),
  "# LC 410 Split Array Largest Sum (same code as LC 1011)",
  "def split_array(nums, k):",
  "    def ok(cap):                # at most k parts, each sum <= cap?",
  "        parts, cur = 1, 0",
  "        for x in nums:",
  "            if cur + x > cap:",
  "                parts, cur = parts + 1, 0",
  "            cur += x",
  "        return parts <= k",
  "    return first_true(max(nums), sum(nums), ok)",
];

/* ---------------- Classic ---------------- */

export function buildClassic(a: number[], target: number): BsFrame[] {
  const n = a.length;
  const F: BsFrame[] = [];
  const known: Record<number, boolean> = {};
  let lo = 0, hi = n;
  const push = (f: Omit<BsFrame, "lo" | "hi" | "known" | "d0" | "d1"> & Partial<BsFrame>) =>
    F.push({ lo, hi, known: { ...known }, d0: 0, d1: n, ...f });
  push({ line: 2, mid: null, phase: "init", say: `Search for ${target}. Start with the whole array: lo = 0, hi = ${n} (one past the end). The first value >= ${target} is somewhere in [lo, hi].` });
  while (lo < hi) {
    push({ line: 3, mid: null, phase: "loop", say: `lo = ${lo} < hi = ${hi}, so there are still ${hi - lo} unchecked ${hi - lo === 1 ? "item" : "items"}.` });
    const mid = (lo + hi) >> 1;
    push({ line: 4, mid, phase: "mid", say: `mid = (${lo} + ${hi}) // 2 = ${mid}.` });
    const ok = a[mid] >= target;
    known[mid] = ok;
    const keepL = `Left: hi = mid = ${mid}`, keepR = `Right: lo = mid + 1 = ${mid + 1}`;
    push({
      line: 5, mid, phase: "test",
      say: `a[${mid}] = ${a[mid]}. Is ${a[mid]} >= ${target}? ${ok ? "Yes" : "No"}.`,
      ask: { q: `a[${mid}] = ${a[mid]} is ${ok ? ">=" : "<"} ${target}. Which part can still hold the first value >= ${target}?`, options: [keepL, keepR], answer: ok ? 0 : 1,
        why: ok ? `Index ${mid} already works, so the first one is at ${mid} or to its left.` : `Every index up to ${mid} is too small, so look right of ${mid}.` },
    });
    if (ok) { hi = mid; push({ line: 6, mid, phase: "move", say: `${a[mid]} >= ${target}, so index ${mid} and everything right of it are >= ${target}. Keep the left part: hi = ${mid}.` }); }
    else { lo = mid + 1; push({ line: 8, mid, phase: "move", say: `${a[mid]} < ${target}, so index ${mid} and everything left of it are too small. Keep the right part: lo = ${mid + 1}.` }); }
  }
  push({ line: 3, mid: null, phase: "end", say: `lo = hi = ${lo}: the range is empty, so the loop stops. Index ${lo} is the first place a value >= ${target} could be.` });
  const found = lo < n && a[lo] === target;
  push({ line: 9, mid: null, phase: "end", say: lo >= n ? `lo = ${lo} is past the end: every value is < ${target}.` : `Check the end point: a[${lo}] = ${a[lo]}. Is it ${target}? ${found ? "Yes" : "No"}.` });
  if (found) push({ line: 10, mid: null, phase: "done", found: true, result: lo, say: `Found ${target} at index ${lo}, after only ${Object.keys(known).length} checks. That is O(log n).` });
  else push({ line: 11, mid: null, phase: "done", found: false, result: -1, say: `${target} is not in the array, so return -1. It would go at index ${lo}.` });
  return F;
}

/* ---------------- Boundary (first_true over indexes) ---------------- */

export function okAt(a: number[], c: Cond, x: number, i: number): boolean {
  if (i >= a.length) return true;
  return c === "ge" ? a[i] >= x : c === "gt" ? a[i] > x : a[i] <= a[a.length - 1];
}

export function buildBoundary(a: number[], c: Cond, x: number): BsFrame[] {
  const n = a.length;
  const hi0 = c === "rot" ? n - 1 : n;
  const F: BsFrame[] = [];
  const known: Record<number, boolean> = {};
  let lo = 0, hi = hi0;
  const ok1 = COND_INFO[c].okText(x);
  const callLine = FIRST_TRUE.length + 1;
  const push = (f: Omit<BsFrame, "lo" | "hi" | "known" | "d0" | "d1"> & Partial<BsFrame>) =>
    F.push({ lo, hi, known: { ...known }, d0: 0, d1: hi0, ...f });
  push({ line: callLine, mid: null, phase: "init", say: c === "rot"
    ? `ok(i) asks: is a[i] <= a[-1] = ${a[n - 1]}? It is False on the high left part and True from the minimum on. Find the first True.`
    : `ok(i) asks: is ${ok1}? The row reads F..F T..T. Find the first True, from index 0 to ${n} (the end).` });
  while (lo < hi) {
    push({ line: FT.while, mid: null, phase: "loop", say: `lo = ${lo} < hi = ${hi}: keep going.` });
    const mid = (lo + hi) >> 1;
    push({ line: FT.mid, mid, phase: "mid", say: `mid = (${lo} + ${hi}) // 2 = ${mid}.` });
    const ok = okAt(a, c, x, mid);
    known[mid] = ok;
    const detail = c === "rot" ? `a[${mid}] = ${a[mid]} <= ${a[n - 1]}` : c === "ge" ? `a[${mid}] = ${a[mid]} >= ${x}` : `a[${mid}] = ${a[mid]} > ${x}`;
    push({
      line: FT.test, line2: callLine, mid, phase: "test", say: `ok(${mid}): ${detail}? ${ok ? "True" : "False"}.`,
      ask: { q: `ok(${mid}) is ${ok ? "True" : "False"}. Where is the first True?`, options: [`At ${mid} or left: hi = ${mid}`, `Right of ${mid}: lo = ${mid + 1}`], answer: ok ? 0 : 1,
        why: ok ? `Everything right of a True is also True, so the first True is ${mid} or earlier.` : `Everything left of a False is also False, so the first True is after ${mid}.` },
    });
    if (ok) { hi = mid; push({ line: FT.hi, mid, phase: "move", say: `True, so ${mid} and everything right of it are True. hi = ${mid}.` }); }
    else { lo = mid + 1; push({ line: FT.lo, mid, phase: "move", say: `False, so ${mid} and everything left of it are False. lo = ${mid + 1}.` }); }
  }
  push({ line: FT.while, mid: null, phase: "end", say: `lo = hi = ${lo}: stop. Everything left of ${lo} is False, ${lo} and right are True.` });
  const r = lo;
  const tail = c === "rot" ? `The minimum is a[${r}] = ${a[r]}.` : r >= n ? `No index is True, so the answer is len(a) = ${n}. ${COND_INFO[c].name}(a, ${x}) = ${n}.` : `${COND_INFO[c].name}(a, ${x}) = ${r}.`;
  push({ line: FT.ret, line2: callLine, mid: null, phase: "done", result: r, say: `Return ${r}: the first True. ${tail}` });
  return F;
}

/* ---------------- On the answer ---------------- */

export function kokoCheck(piles: number[], h: number, k: number): KokoCheck {
  const hours = piles.map((p) => Math.ceil(p / k));
  const total = hours.reduce((s, v) => s + v, 0);
  return { kind: "koko", k, piles, hours, total, h, ok: total <= h };
}
export function splitCheck(nums: number[], k: number, cap: number): SplitCheck {
  const parts: number[][] = [[]]; let cur = 0;
  for (const x of nums) {
    if (cur + x > cap) { parts.push([]); cur = 0; }
    cur += x; parts[parts.length - 1].push(x);
  }
  return { kind: "split", cap, parts, k, ok: parts.length <= k };
}

export function answerRange(p: Problem, nums: number[]): [number, number] {
  return p === "koko" ? [1, Math.max(...nums)] : [Math.max(...nums), nums.reduce((s, v) => s + v, 0)];
}

export function buildOnAnswer(p: Problem, nums: number[], t: number): BsFrame[] {
  const [d0, d1] = answerRange(p, nums);
  const check = (v: number): Check => (p === "koko" ? kokoCheck(nums, t, v) : splitCheck(nums, t, v));
  const lambdaLine = p === "koko" ? CODE_KOKO.length - 1 : CODE_SPLIT.length - 2;
  const callLine = p === "koko" ? CODE_KOKO.length - 2 : CODE_SPLIT.length - 1;
  const L = { while: FT.while - 1, mid: FT.mid - 1, test: FT.test - 1, hi: FT.hi - 1, lo: FT.lo - 1, ret: FT.ret - 1 };
  const F: BsFrame[] = [];
  const known: Record<number, boolean> = {};
  let lo = d0, hi = d1;
  let last: Check | undefined;
  const push = (f: Omit<BsFrame, "lo" | "hi" | "known" | "d0" | "d1"> & Partial<BsFrame>) =>
    F.push({ lo, hi, known: { ...known }, d0, d1, check: last, ...f });
  push({ line: callLine, mid: null, phase: "init", say: p === "koko"
    ? `Speed k can be 1 to ${d1} (the biggest pile). At k = ${d1} every pile takes 1 hour, so k = ${d1} surely works. Find the smallest k that works.`
    : `The largest part sum is at least ${d0} (the biggest value) and at most ${d1} (one part). Find the smallest cap that works.` });
  while (lo < hi) {
    push({ line: L.while, mid: null, phase: "loop", say: `lo = ${lo} < hi = ${hi}: ${hi - lo + 1} answers are still possible.` });
    const mid = (lo + hi) >> 1;
    const c = check(mid);
    const q = p === "koko" ? `Koko eats ${mid} bananas per hour. Can she finish in ${t} hours?` : `Can you cut the array into at most ${t} parts, each with sum <= ${mid}?`;
    push({ line: L.mid, mid, phase: "mid", check: c, pending: true, say: `mid = (${lo} + ${hi}) // 2 = ${mid}. Now run check(${mid}).`,
      ask: { q, options: ["Yes", "No"], answer: c.ok ? 0 : 1, why: c.kind === "koko" ? `She needs ${c.total} hours${c.ok ? `, which is <= ${t}` : `, more than ${t}`}.` : `The greedy cut makes ${c.parts.length} ${c.parts.length === 1 ? "part" : "parts"}${c.ok ? `, which is <= ${t}` : `, more than ${t}`}.` } });
    known[mid] = c.ok; last = c;
    const why = c.kind === "koko" ? `She needs ${c.total} hours. ${c.total} <= ${t}? ${c.ok ? "Yes" : "No"}.` : `The greedy cut makes ${c.parts.length} ${c.parts.length === 1 ? "part" : "parts"}. ${c.parts.length} <= ${t}? ${c.ok ? "Yes" : "No"}.`;
    push({ line: L.test, line2: lambdaLine, mid, phase: "test", say: `check(${mid}): ${why}` });
    if (c.ok) { hi = mid; push({ line: L.hi, mid, phase: "move", say: `${mid} works, so every bigger value works too. The answer is ${mid} or smaller: hi = ${mid}.` }); }
    else { lo = mid + 1; push({ line: L.lo, mid, phase: "move", say: `${mid} fails, so every smaller value fails too. The answer is bigger: lo = ${mid + 1}.` }); }
  }
  const nChecks = Object.keys(known).length;
  push({ line: L.while, mid: null, phase: "end", say: `lo = hi = ${lo}: stop. No to the left, yes from ${lo} on.` });
  push({ line: L.ret, line2: callLine, mid: null, phase: "done", result: lo, check: check(lo),
    say: p === "koko" ? `The minimum speed is ${lo}. It took ${nChecks} checks instead of trying all ${d1 - d0 + 1} speeds.` : `The smallest possible largest sum is ${lo}. ${nChecks} checks instead of ${d1 - d0 + 1}.` });
  return F;
}
