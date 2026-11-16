/** Pure frame builders for the monotonic stack / deque modes. */
import { makePredict, type Frame } from "../prefix-sums/kit/player";
import { listStr, sn } from "../prefix-sums/kit/parse";

const M = "−";
const countOpts = (ans: number, max: number) => {
  const all = Array.from({ length: Math.max(max, ans, 2) + 1 }, (_, t) => t);
  const lo = Math.max(0, Math.min(ans - 1, all.length - 4));
  return all.slice(lo, lo + 4).map(String);
};

/* --------------------------------------------------------- next greater */
export type NgVariant = "days" | "index";
export const NG_CODE: Record<NgVariant, string[]> = {
  days: [
    "def dailyTemperatures(temperatures):",
    "    ans = [0] * len(temperatures)",
    "    stack = []                      # indices still waiting; temps non-increasing",
    "    for i, t in enumerate(temperatures):",
    "        while stack and temperatures[stack[-1]] < t:",
    "            j = stack.pop()",
    "            ans[j] = i - j",
    "        stack.append(i)",
    "    return ans",
  ],
  index: [
    "# 1. Next greater element (index), -1 if none. For \"next smaller\", flip < to >.",
    "def next_greater(a):",
    "    n = len(a)",
    "    res = [-1] * n",
    "    st = []                                 # indices, values decreasing",
    "    for i, x in enumerate(a):",
    "        while st and a[st[-1]] < x:",
    "            res[st.pop()] = i               # x answers everyone smaller on top",
    "        st.append(i)",
    "    return res",
  ],
};
const NG_LINES = {
  days: { init: 2, st: 3, loop: 4, cmp: 5, pop: 6, set: 7, push: 8, ret: 9 },
  index: { init: 4, st: 5, loop: 6, cmp: 7, pop: 8, set: 8, push: 9, ret: 10 },
};

export interface StackS {
  a: number[];
  i: number;                         // current index (-1 before the loop, n after)
  stack: number[];
  ans: (number | null)[];            // null = not answered yet
  cmp: { j: number; ok: boolean } | null;
  popped: number | null;             // index popped in this frame
  arc: [number, number] | null;      // j answered by i
  answered: number[];
  pushes: number; pops: number;
  done: boolean;
}

export function ngFrames(a: number[], v: NgVariant): Frame<StackS>[] {
  const L = NG_LINES[v], days = v === "days";
  const n = a.length, F: Frame<StackS>[] = [];
  const st: number[] = [], ans: (number | null)[] = Array(n).fill(null), answered: number[] = [];
  let pushes = 0, pops = 0;
  const Ws = days ? "days" : "indexes", Cap = days ? "Day" : "Index", Caps = days ? "Days" : "Indexes";
  const name = (j: number) => (days ? `day ${j} (${sn(a[j])})` : `index ${j} (${sn(a[j])})`);
  const s = (o: Partial<StackS>): StackS => ({ a, i: -1, stack: [...st], ans: [...ans], cmp: null, popped: null, arc: null, answered: [...answered], pushes, pops, done: false, ...o });
  const vars = (i: number, extra: [string, string | number][] = []): [string, string | number][] =>
    [["i", i], [days ? "t" : "x", sn(a[i])], ...extra, ["pushes", pushes], ["pops", pops]];

  F.push({ line: L.init, s: s({}), say: days ? "`ans` starts as all 0s. A 0 means: no warmer day found (yet)." : "`res` starts as all −1: no greater element found (yet)." });
  F.push({ line: L.st, s: s({}), say: days ? "The stack holds the indices of days still waiting for a warmer day." : "`st` holds indices still waiting for a greater value. Their values decrease from bottom to top." });
  let asked = 0;
  for (let i = 0; i < n; i++) {
    const x = a[i];
    F.push({ line: L.loop, s: s({ i }), vars: vars(i), tone: "accent",
      say: days ? `Day ${i} arrives with temperature ${sn(x)}.` : `i = ${i}: x = ${sn(x)} arrives.` });
    let first = true;
    let willPop = 0; for (let t = st.length - 1; t >= 0 && a[st[t]] < x; t--) willPop++;
    while (true) {
      const predict = first && st.length > 0 && asked < 5
        ? makePredict(`${days ? `Day ${i} (${sn(x)})` : `x = ${sn(x)}`} arrives. The stack holds ${listStr(st.map((j) => sn(a[j])))} (bottom to top). How many ${Ws} will it pop?`,
          String(willPop), countOpts(willPop, st.length).filter((o) => o !== String(willPop)),
          willPop === 0 ? `The top value ${sn(a[st[st.length - 1]])} is not smaller than ${sn(x)}, so nothing pops.`
            : `It pops every value smaller than ${sn(x)} from the top: ${willPop}. It stops at the first one that is not smaller${willPop === st.length ? " (here the stack empties)" : ""}.`, i)
        : undefined;
      if (predict) asked++;
      first = false;
      if (st.length === 0) {
        F.push({ line: L.cmp, s: s({ i }), vars: vars(i), say: `The stack is empty, so nobody is waiting. The while loop stops.` });
        break;
      }
      const j = st[st.length - 1], ok = a[j] < x;
      if (!ok) {
        F.push({ line: L.cmp, s: s({ i, cmp: { j, ok } }), vars: vars(i), predict,
          say: `Top is ${name(j)}. ${sn(a[j])} < ${sn(x)} is false, so stop. Everything below it is even ${days ? "warmer" : "larger"} or equal.` });
        break;
      }
      F.push({ line: L.cmp, s: s({ i, cmp: { j, ok } }), vars: vars(i), tone: "accent", predict,
        say: `Top is ${name(j)}. ${sn(a[j])} < ${sn(x)}, so ${days ? `day ${i} is the first warmer day for day ${j}` : `${sn(x)} is the next greater value for index ${j}`}.` });
      st.pop(); pops++;
      if (days) {
        F.push({ line: L.pop, s: s({ i, popped: j }), vars: vars(i, [["j", j]]), say: `Pop day ${j} off the stack. Its wait is over.` });
        ans[j] = i - j; answered.push(j);
        F.push({ line: L.set, s: s({ i, popped: j, arc: [j, i] }), vars: vars(i, [["j", j], [`ans[${j}]`, i - j]]), tone: "good",
          say: `ans[${j}] = i ${M} j = ${i} ${M} ${j} = ${i - j}. Day ${j} waits ${i - j} day${i - j === 1 ? "" : "s"}.` });
      } else {
        ans[j] = i; answered.push(j);
        F.push({ line: L.set, s: s({ i, popped: j, arc: [j, i] }), vars: vars(i, [[`res[${j}]`, i]]), tone: "good",
          say: `Pop index ${j} and set res[${j}] = ${i}. Each pop writes one answer.` });
      }
    }
    st.push(i); pushes++;
    F.push({ line: L.push, s: s({ i }), vars: vars(i),
      say: days ? `Push day ${i}. It now waits for a warmer day.` : `Push index ${i}. It now waits for a greater value.` });
  }
  const left = [...st];
  const fill = days ? 0 : -1;
  const final = ans.map((x) => (x === null ? fill : x));
  F.push({ line: L.ret, s: { ...s({ i: n, done: true }), ans: final }, tone: "good", vars: [["pushes", pushes], ["pops", pops]],
    say: `${left.length ? `${left.length === 1 ? `${Cap} ${left[0]} is` : `${Caps} ${left.join(", ")} are`} still waiting, so ${left.length === 1 ? "it keeps" : "they keep"} ${sn(fill)}. ` : ""}Result ${listStr(final.map(sn))}. ${pushes} pushes, ${pops} pops: O(n).` });
  return F;
}

/* ------------------------------------------------------------ histogram */
export const HIST_CODE = [
  "# Largest rectangle: each bar extends to its previous smaller and next smaller",
  "def largest_rectangle(h):",
  "    h = h + [0]                             # sentinel pops everyone at the end",
  "    st, best = [], 0                        # indices, heights increasing",
  "    for i, x in enumerate(h):",
  "        while st and h[st[-1]] >= x:",
  "            j = st.pop()                    # i is j's next smaller",
  "            prev = st[-1] if st else -1     # new top is j's previous smaller",
  "            best = max(best, h[j] * (i - prev - 1))",
  "        st.append(i)",
  "    return best",
];
export interface Box { l: number; r: number; h: number; area: number }
export interface HistS {
  h: number[];                       // includes the sentinel 0 at the end
  i: number; stack: number[];
  cmp: { j: number; ok: boolean } | null;
  popped: number | null; prev: number | null;
  rect: Box | null; best: Box | null; bestVal: number;
  settled: number[];
  done: boolean;
}

export function histFrames(h0: number[]): Frame<HistS>[] {
  const h = [...h0, 0], n = h.length, F: Frame<HistS>[] = [];
  const st: number[] = [], settled: number[] = [];
  let best: Box | null = null, bestVal = 0;
  const s = (o: Partial<HistS>): HistS => ({ h, i: -1, stack: [...st], cmp: null, popped: null, prev: null, rect: null, best, bestVal, settled: [...settled], done: false, ...o });
  F.push({ line: 3, s: s({}), say: "Append a bar of height 0 at the end. It is lower than every bar, so it pops everything left on the stack." });
  F.push({ line: 4, s: s({}), vars: [["best", 0]], say: "The stack holds indices whose heights increase from bottom to top. best = 0." });
  let asked = 0;
  for (let i = 0; i < n; i++) {
    const x = h[i], end = i === n - 1;
    F.push({ line: 5, s: s({ i }), vars: [["i", i], ["x", x], ["best", bestVal]], tone: "accent",
      say: end ? "The sentinel bar of height 0 arrives." : `Bar ${i} with height ${x} arrives.` });
    while (true) {
      if (st.length === 0) { F.push({ line: 6, s: s({ i }), vars: [["i", i], ["x", x]], say: "The stack is empty. Nothing to pop." }); break; }
      const j = st[st.length - 1], ok = h[j] >= x;
      if (!ok) {
        F.push({ line: 6, s: s({ i, cmp: { j, ok } }), vars: [["i", i], ["x", x]],
          say: `Top is bar ${j} (height ${h[j]}). ${h[j]} ≥ ${x} is false, so stop. Bar ${j} can still grow to the right.` });
        break;
      }
      F.push({ line: 6, s: s({ i, cmp: { j, ok } }), vars: [["i", i], ["x", x]], tone: "accent",
        say: `Top is bar ${j} (height ${h[j]}). ${h[j]} ≥ ${x}, so bar ${j} cannot extend past index ${i}.` });
      st.pop();
      F.push({ line: 7, s: s({ i, popped: j }), vars: [["j", j], ["h[j]", h[j]]], say: `Pop bar ${j}. Its next smaller bar is i = ${i}, so its rectangle ends at ${i - 1}.` });
      const prev = st.length ? st[st.length - 1] : -1;
      F.push({ line: 8, s: s({ i, popped: j, prev }), vars: [["j", j], ["prev", prev]],
        say: prev >= 0 ? `The new top, bar ${prev}, is bar ${j}'s previous smaller. So bar ${j} starts at ${prev + 1}.` : `The stack is empty: nothing on the left is smaller. prev = ${M}1, so bar ${j} starts at 0.` });
      const width = i - prev - 1, area = h[j] * width;
      const rect: Box = { l: prev + 1, r: i - 1, h: h[j], area };
      const better = area > bestVal;
      const oldBest = bestVal;
      if (better) { bestVal = area; best = rect; }
      settled.push(j);
      const ask = asked < 4 && h[j] > 0;
      if (ask) asked++;
      F.push({ line: 9, s: s({ i, popped: j, prev, rect }), vars: [["width", width], ["area", area], ["best", bestVal]], tone: better ? "good" : "neutral",
        say: `Width = i ${M} prev ${M} 1 = ${i} ${M} ${prev < 0 ? `(${M}1)` : prev} ${M} 1 = ${width}. Area = ${h[j]} × ${width} = ${area}. ${better ? `New best: ${area}.` : `best stays ${oldBest}.`}`,
        predict: ask ? makePredict(`Bar ${j} (height ${h[j]}) pops at i = ${i}, and prev = ${prev}. How wide is its rectangle?`, String(width),
          [String(width + 1), String(Math.max(0, width - 1)), String(i - j)].filter((o) => o !== String(width)),
          `It spans from prev + 1 = ${prev + 1} to i ${M} 1 = ${i - 1}: width = i ${M} prev ${M} 1 = ${width}.`, i * 3 + j) : undefined });
    }
    st.push(i);
    F.push({ line: 10, s: s({ i }), vars: [["i", i], ["best", bestVal]], say: end ? "Push the sentinel. Every real bar has been popped and measured." : `Push bar ${i}. Heights on the stack still increase.` });
  }
  F.push({ line: 11, s: s({ i: n, done: true }), tone: "good", vars: [["best", bestVal]],
    say: `return ${bestVal}.${best ? ` The best rectangle is bars ${best.l}..${best.r} at height ${best.h}.` : ""} Each bar was pushed once and popped once: O(n).` });
  return F;
}

/* ----------------------------------------------------------- window max */
export const WIN_CODE = [
  "from collections import deque",
  "",
  "# 2. Max of every window of size k",
  "def window_max(a, k):",
  "    dq, out = deque(), []                   # indices, values decreasing",
  "    for i, x in enumerate(a):",
  "        while dq and a[dq[-1]] <= x:",
  "            dq.pop()",
  "        dq.append(i)",
  "        if dq[0] <= i - k:                  # front fell out of the window",
  "            dq.popleft()",
  "        if i >= k - 1:",
  "            out.append(a[dq[0]])",
  "    return out",
];
export interface WinS {
  a: number[]; k: number; i: number;
  dq: number[];
  out: (number | null)[];            // aligned with the index where each window ends
  cmp: { j: number; ok: boolean } | null;
  front: { j: number; out: boolean } | null;
  popped: { j: number; side: "back" | "front" } | null;
  wrote: number | null;
  done: boolean;
}

export function winFrames(a: number[], k: number): Frame<WinS>[] {
  const n = a.length, F: Frame<WinS>[] = [];
  const dq: number[] = [], out: (number | null)[] = Array(n).fill(null);
  const s = (o: Partial<WinS>): WinS => ({ a, k, i: -1, dq: [...dq], out: [...out], cmp: null, front: null, popped: null, wrote: null, done: false, ...o });
  const lo = (i: number) => Math.max(0, i - k + 1);
  F.push({ line: 5, s: s({}), vars: [["k", k]], say: "dq holds indices. Their values decrease from front to back, so the front is always the window max." });
  let asked = 0;
  for (let i = 0; i < n; i++) {
    const x = a[i];
    F.push({ line: 6, s: s({ i }), vars: [["i", i], ["x", sn(x)]], tone: "accent",
      say: `i = ${i}: x = ${sn(x)} arrives. The window is now a[${lo(i)}..${i}].` });
    let willPop = 0; for (let t = dq.length - 1; t >= 0 && a[dq[t]] <= x; t--) willPop++;
    let first = true;
    while (true) {
      const predict = first && dq.length > 0 && asked < 4
        ? makePredict(`x = ${sn(x)} arrives. The deque holds values ${listStr(dq.map((j) => sn(a[j])))} (front to back). How many leave from the back?`,
          String(willPop), countOpts(willPop, dq.length).filter((o) => o !== String(willPop)),
          willPop ? `Every value ≤ ${sn(x)} at the back can never be a window max again while ${sn(x)} is in the window: ${willPop} leave.` : `The back value is bigger than ${sn(x)}, so nothing leaves.`, i)
        : undefined;
      if (predict) asked++;
      first = false;
      if (dq.length === 0) { F.push({ line: 7, s: s({ i }), vars: [["i", i], ["x", sn(x)]], say: "dq is empty. Nothing to remove." }); break; }
      const j = dq[dq.length - 1], ok = a[j] <= x;
      if (!ok) {
        F.push({ line: 7, s: s({ i, cmp: { j, ok } }), vars: [["i", i], ["x", sn(x)]], predict,
          say: `Back is index ${j} (${sn(a[j])}). ${sn(a[j])} ≤ ${sn(x)} is false, so stop. It may still be a max later.` });
        break;
      }
      F.push({ line: 7, s: s({ i, cmp: { j, ok } }), vars: [["i", i], ["x", sn(x)]], tone: "accent", predict,
        say: `Back is index ${j} (${sn(a[j])}). ${sn(a[j])} ≤ ${sn(x)}: it is older and not bigger, so it can never be the max again.` });
      dq.pop();
      F.push({ line: 8, s: s({ i, popped: { j, side: "back" } }), vars: [["i", i], ["x", sn(x)]], say: `Pop index ${j} from the back.` });
    }
    dq.push(i);
    F.push({ line: 9, s: s({ i }), vars: [["i", i], ["dq", listStr(dq)]], say: `Append index ${i} at the back. Values in dq still decrease.` });
    const f = dq[0], gone = f <= i - k;
    F.push({ line: 10, s: s({ i, front: { j: f, out: gone } }), vars: [["dq[0]", f], ["i - k", i - k]], tone: gone ? "warn" : "neutral",
      say: gone ? `Front is index ${f}. ${f} ≤ i ${M} k = ${i - k}: it fell out of the window.` : `Front is index ${f}. ${f} ≤ ${i - k} is false: it is still inside the window.` });
    if (gone) {
      dq.shift();
      F.push({ line: 11, s: s({ i, popped: { j: f, side: "front" } }), vars: [["dq", listStr(dq)]], say: `Pop index ${f} from the front.` });
    }
    if (i >= k - 1) {
      out[i] = a[dq[0]];
      F.push({ line: 13, s: s({ i, wrote: i }), vars: [["window", `a[${i - k + 1}..${i}]`], ["max", sn(a[dq[0]])]], tone: "good",
        say: `The window a[${i - k + 1}..${i}] is full. Its max is a[dq[0]] = a[${dq[0]}] = ${sn(a[dq[0]])}.` });
    } else {
      F.push({ line: 12, s: s({ i }), vars: [["i", i], ["k - 1", k - 1]], say: `i = ${i} < k ${M} 1 = ${k - 1}: the first window is not full yet, so no output.` });
    }
  }
  const res = out.filter((v): v is number => v !== null);
  F.push({ line: 14, s: s({ i: n, done: true }), tone: "good", vars: [["out", listStr(res.map(sn))]],
    say: `return ${listStr(res.map(sn))}. Each index entered and left the deque at most once: O(n).` });
  return F;
}
