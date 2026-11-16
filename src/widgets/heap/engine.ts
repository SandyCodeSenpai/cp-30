/** Pure frame builders for the heap lab. No React here. */
import type { Ask, BaseFrame } from "../binary-search/player";

export type HeapMode = "basics" | "top-k" | "median" | "merge-k";
/** An item keeps its id for its whole life, so the picture can move it between zones. */
export interface Item { id: number; v: number; key: number[]; tag?: string }
export type Hl = "act" | "cmp" | "res" | "out";

export interface HeapFrame extends BaseFrame {
  code?: "push" | "pop";
  heaps: Item[][];
  hl: Record<number, Hl>;
  /** [heap number, parent index, child index] edge to highlight. */
  edge?: [number, number, number];
  tray: Item[];
  vars: [string, string][];
  median?: string;
}

export interface Built { frames: HeapFrame[]; starts: number[] }

/* ---------------- Code (Day 9 templates, heapq on a plain list) ---------------- */

export const CODE_PUSH = [
  "# What heapq.heappush(h, x) does",
  "def push(h, x):",
  "    h.append(x)                  # add at the end",
  "    i = len(h) - 1",
  "    while i > 0 and h[(i - 1) // 2] > h[i]:",
  "        p = (i - 1) // 2         # parent index",
  "        h[i], h[p] = h[p], h[i]  # sift up: swap with parent",
  "        i = p",
];
export const CODE_POP = [
  "# What heapq.heappop(h) does (same idea)",
  "def pop(h):",
  "    top = h[0]                   # the smallest item",
  "    last = h.pop()",
  "    if h:",
  "        h[0] = last              # last item goes to the root",
  "        i = 0",
  "        while 2 * i + 1 < len(h):",
  "            c = 2 * i + 1        # left child",
  "            if c + 1 < len(h) and h[c + 1] < h[c]:",
  "                c += 1           # the right child is smaller",
  "            if h[i] <= h[c]:",
  "                break",
  "            h[i], h[c] = h[c], h[i]  # sift down: swap with child",
  "            i = c",
  "    return top",
];
export const CODE_TOPK = [
  "import heapq",
  "",
  "# Top-k largest: min-heap of size k",
  "def k_largest(nums, k):",
  "    h = []",
  "    for x in nums:",
  "        heapq.heappush(h, x)",
  "        if len(h) > k:",
  "            heapq.heappop(h)",
  "    return h                      # h[0] is the k-th largest",
];
export const CODE_MEDIAN = [
  "import heapq",
  "",
  "# Two heaps: running median",
  "class Median:",
  "    def __init__(self):",
  "        self.lo = []              # max-heap via negation (lower half)",
  "        self.hi = []              # min-heap (upper half)",
  "    def add(self, x):",
  "        heapq.heappush(self.lo, -x)",
  "        heapq.heappush(self.hi, -heapq.heappop(self.lo))   # move lo's max up",
  "        if len(self.hi) > len(self.lo):",
  "            heapq.heappush(self.lo, -heapq.heappop(self.hi))",
  "    def median(self):",
  "        if len(self.lo) > len(self.hi):",
  "            return -self.lo[0]",
  "        return (-self.lo[0] + self.hi[0]) / 2",
];
export const CODE_MERGE = [
  "import heapq",
  "",
  "# Merge k sorted lists: one head per list in the heap",
  "def merge_k(lists):",
  "    h = [(a[0], i, 0) for i, a in enumerate(lists) if a]",
  "    heapq.heapify(h)",
  "    out = []",
  "    while h:",
  "        v, i, j = heapq.heappop(h)",
  "        out.append(v)",
  "        if j + 1 < len(lists[i]):",
  "            heapq.heappush(h, (lists[i][j + 1], i, j + 1))",
  "    return out",
];

/* ---------------- heapq, exactly (tuples compare left to right) ---------------- */

const lt = (a: Item, b: Item) => {
  for (let i = 0; i < Math.max(a.key.length, b.key.length); i++) {
    const x = a.key[i] ?? -Infinity, y = b.key[i] ?? -Infinity;
    if (x !== y) return x < y;
  }
  return false;
};
function siftdown(h: Item[], start: number, pos: number) {
  const item = h[pos];
  while (pos > start) {
    const pp = (pos - 1) >> 1;
    if (lt(item, h[pp])) { h[pos] = h[pp]; pos = pp; continue; }
    break;
  }
  h[pos] = item;
}
function siftup(h: Item[], pos: number) {
  const end = h.length, start = pos, item = h[pos];
  let c = 2 * pos + 1;
  while (c < end) {
    const r = c + 1;
    if (r < end && !lt(h[c], h[r])) c = r;
    h[pos] = h[c]; pos = c; c = 2 * pos + 1;
  }
  h[pos] = item;
  siftdown(h, start, pos);
}
export const heappush = (h: Item[], it: Item) => { h.push(it); siftdown(h, 0, h.length - 1); };
export const heappop = (h: Item[]): Item => {
  const last = h.pop()!;
  if (!h.length) return last;
  const top = h[0]; h[0] = last; siftup(h, 0); return top;
};
export const heapify = (h: Item[]) => { for (let i = (h.length >> 1) - 1; i >= 0; i--) siftup(h, i); };

const pyNum = (x: number) => (Number.isInteger(x) ? `${x}.0` : String(x));
const ordinal = (k: number) => (k === 1 ? "1st" : k === 2 ? "2nd" : k === 3 ? "3rd" : `${k}th`);
const uniqOpts = (vals: number[]) => [...new Set(vals)];

/* ---------------- basics: push / pop written out ---------------- */

export type Op = { t: "push"; v: number } | { t: "pop" };

export function buildBasics(ops: Op[]): Built {
  const F: HeapFrame[] = [];
  const starts: number[] = [];
  const h: Item[] = [];
  const tray: Item[] = [];
  let nid = 0;
  const snap = (f: Omit<HeapFrame, "heaps" | "tray" | "vars"> & { vars?: [string, string][] }) =>
    F.push({ heaps: [[...h]], tray: [...tray], vars: f.vars ?? [["len(h)", String(h.length)]], ...f });
  const askPrev = (a: Ask) => { if (F.length) F[F.length - 1].ask = a; };

  if (!ops.length) snap({ line: 0, code: "push", hl: {}, say: "The heap is empty. Push a value to start." });
  for (const op of ops) {
    starts.push(F.length);
    if (op.t === "push") {
      const x = op.v;
      const it: Item = { id: nid++, v: x, key: [x] };
      h.push(it);
      let i = h.length - 1;
      snap({ line: 2, code: "push", hl: { [it.id]: "act" }, vars: [["x", String(x)], ["i", String(i)], ["len(h)", String(h.length)]],
        say: h.length === 1 ? `push(${x}): the heap was empty, so ${x} becomes the root.` : `push(${x}): append ${x} at the end of the list, index ${i}. In the tree, that is the next free spot.` });
      while (i > 0) {
        const p = (i - 1) >> 1;
        const pv = h[p].v;
        if (pv > x) {
          askPrev({ q: `${x} sits under its parent ${pv}. What happens next?`, options: [`Swap: ${x} moves up`, "Stop here"], answer: 0, why: `The parent ${pv} is bigger than ${x}, so the order is broken. Swap.` });
          snap({ line: 4, code: "push", hl: { [it.id]: "act", [h[p].id]: "cmp" }, vars: [["i", String(i)], ["parent", String(p)]], say: `Parent h[${p}] = ${pv} > ${x}. A parent must be <= its children, so ${x} moves up.` });
          [h[i], h[p]] = [h[p], h[i]];
          snap({ line: 6, code: "push", hl: { [it.id]: "act", [h[i].id]: "cmp" }, edge: [0, p, i], vars: [["i", String(p)], ["parent", p > 0 ? String((p - 1) >> 1) : "none"]], say: `Swap ${x} and ${pv} along the edge. Now i = ${p}.` });
          i = p;
        } else {
          askPrev({ q: `${x} sits under its parent ${pv}. What happens next?`, options: [`Swap: ${x} moves up`, "Stop here"], answer: 1, why: `The parent ${pv} is <= ${x}, so the order is fine.` });
          snap({ line: 4, code: "push", hl: { [it.id]: "res", [h[p].id]: "cmp" }, vars: [["i", String(i)], ["parent", String(p)]], say: `Parent h[${p}] = ${pv} <= ${x}, so stop. Every parent is <= its children again. O(log n) swaps at most.` });
          break;
        }
      }
      if (i === 0 && h.length > 1) snap({ line: 4, code: "push", hl: { [it.id]: "res" }, vars: [["i", "0"]], say: `${x} reached the root (i = 0), so stop. ${x} is the new smallest.` });
    } else {
      if (!h.length) continue;
      const top = h[0];
      snap({ line: 2, code: "pop", hl: { [top.id]: "act" }, say: `pop(): the smallest item is always at the root, h[0] = ${top.v}.` });
      const last = h.pop()!;
      if (!h.length) {
        tray.push(top);
        snap({ line: 3, code: "pop", hl: { [top.id]: "out" }, say: `${top.v} was the only item. The heap is now empty.` });
        snap({ line: 15, code: "pop", hl: { [top.id]: "out" }, say: `pop() returns ${top.v}.` });
        continue;
      }
      h[0] = last; tray.push(top);
      snap({ line: 5, code: "pop", hl: { [last.id]: "act", [top.id]: "out" }, vars: [["top", String(top.v)], ["i", "0"], ["len(h)", String(h.length)]],
        say: `Take ${top.v} out. Move the last item, ${last.v}, into the root so the tree has no hole.` });
      let i = 0;
      while (2 * i + 1 < h.length) {
        const l = 2 * i + 1, r = l + 1;
        let c = l;
        if (r < h.length && h[r].v < h[l].v) c = r;
        const x = h[i].v, cv = h[c].v;
        const opts = r < h.length ? [`Left child ${h[l].v}`, `Right child ${h[r].v}`, "Neither: stop"] : [`Left child ${h[l].v}`, "Neither: stop"];
        const stop = x <= cv;
        askPrev({ q: `${x} is at index ${i}. Which child does it swap with?`, options: opts, answer: stop ? opts.length - 1 : c === l ? 0 : 1,
          why: stop ? `${x} is <= its smaller child ${cv}, so it stays.` : `Always swap with the smaller child (${cv}), so the new parent is <= both children.` });
        snap({ line: c === r ? 10 : 9, code: "pop", hl: { [h[i].id]: "act", [h[c].id]: "cmp" }, vars: [["i", String(i)], ["c", String(c)]],
          say: r < h.length ? `Children of ${x}: ${h[l].v} and ${h[r].v}. The smaller one is ${cv}${c === r ? " (right)" : " (left)"}.` : `${x} has one child: ${cv}.` });
        if (stop) {
          snap({ line: 12, code: "pop", hl: { [h[i].id]: "res", [h[c].id]: "cmp" }, vars: [["i", String(i)], ["c", String(c)]], say: `${x} <= ${cv}, so stop. The heap is valid again.` });
          break;
        }
        [h[i], h[c]] = [h[c], h[i]];
        snap({ line: 13, code: "pop", hl: { [h[c].id]: "act", [h[i].id]: "cmp" }, edge: [0, i, c], vars: [["i", String(c)]], say: `${x} > ${cv}, so swap them along the edge. Now i = ${c}.` });
        i = c;
      }
      if (2 * i + 1 >= h.length && (F[F.length - 1].line === 13 || F[F.length - 1].line === 5)) {
        snap({ line: 7, code: "pop", hl: { [h[i].id]: "res" }, vars: [["i", String(i)]], say: `${h[i].v} has no children now, so stop.` });
      }
      snap({ line: 15, code: "pop", hl: { [top.id]: "out", [h[0].id]: "res" }, say: `pop() returns ${top.v}. The new root, ${h[0].v}, is the next smallest.` });
    }
  }
  return { frames: F, starts };
}

/* ---------------- top-k ---------------- */

export function buildTopK(nums: number[], k: number): Built {
  const items = nums.map((v, i): Item => ({ id: i, v, key: [v] }));
  const F: HeapFrame[] = [];
  const h: Item[] = [], tray: Item[] = [];
  const snap = (f: Omit<HeapFrame, "heaps" | "tray" | "vars"> & { vars?: [string, string][] }) =>
    F.push({ heaps: [[...h]], tray: [...tray], vars: f.vars ?? [["k", String(k)], ["len(h)", String(h.length)]], ...f });
  snap({ line: 4, hl: {}, say: `h starts empty. It will keep the ${k} largest values seen so far. Its root is the smallest of them.` });
  for (const it of items) {
    snap({ line: 5, hl: { [it.id]: "act" }, vars: [["x", String(it.v)], ["k", String(k)], ["len(h)", String(h.length)]], say: `x = ${it.v}.` });
    heappush(h, it);
    snap({ line: 6, hl: { [it.id]: "act" }, vars: [["x", String(it.v)], ["k", String(k)], ["len(h)", String(h.length)]], say: `Push ${it.v}. It sifts up to its place. The smallest is on top: h[0] = ${h[0].v}.` });
    if (h.length > k) {
      const vals = uniqOpts([it.v, Math.max(...h.map((q) => q.v)), h[0].v]);
      if (vals.length >= 2) F[F.length - 1].ask = { q: `The heap has ${h.length} items and k = ${k}. Which value leaves?`, options: vals.map(String), answer: vals.indexOf(h[0].v), why: `Pop the smallest, ${h[0].v}. A value smaller than ${k} others cannot be in the top ${k}.` };
      snap({ line: 7, hl: { [h[0].id]: "cmp" }, say: `len(h) = ${h.length} > k = ${k}: one item too many.` });
      const out = heappop(h); tray.push(out);
      snap({ line: 8, hl: { [out.id]: "out" }, say: `Pop ${out.v}, the smallest. It cannot be in the top ${k}. Each push and pop is O(log k).` });
    } else {
      snap({ line: 7, hl: {}, say: `len(h) = ${h.length} <= k = ${k}: keep everything for now.` });
    }
  }
  const hl: Record<number, Hl> = {}; h.forEach((q) => (hl[q.id] = "res"));
  const sorted = h.map((q) => q.v).sort((a, b) => a - b);
  snap({ line: 9, hl, say: `Done. h holds the ${k} largest: ${sorted.join(", ")}. h[0] = ${h[0].v} is the ${ordinal(k)} largest. Total O(n log k).` });
  return { frames: F, starts: [0] };
}

/* ---------------- median: two heaps ---------------- */

export function buildMedian(nums: number[]): Built {
  const F: HeapFrame[] = [];
  const lo: Item[] = [], hi: Item[] = [], tray: Item[] = [];
  let median: string | undefined;
  const snap = (f: Omit<HeapFrame, "heaps" | "tray" | "vars" | "median"> & { vars?: [string, string][] }) =>
    F.push({ heaps: [[...lo], [...hi]], tray: [...tray], median, vars: f.vars ?? [["len(lo)", String(lo.length)], ["len(hi)", String(hi.length)]], ...f });
  snap({ line: 5, hl: {}, say: "lo keeps the lower half as a max-heap: it stores -x, so its root is the largest value. hi keeps the upper half as a min-heap." });
  nums.forEach((v, id) => {
    heappush(lo, { id, v, key: [-v] });
    snap({ line: 8, hl: { [id]: "act" }, say: `add(${v}): push -${v} into lo.` });
    const m = heappop(lo); heappush(hi, { ...m, key: [m.v] });
    snap({ line: 9, hl: { [m.id]: "act" }, say: `lo's largest, ${m.v}, moves up to hi. Now every value in lo is <= every value in hi.` });
    const more = hi.length > lo.length;
    F[F.length - 1].ask = { q: `lo has ${lo.length}, hi has ${hi.length}. Does hi give one item back to lo?`, options: ["Yes", "No"], answer: more ? 0 : 1,
      why: more ? "hi is bigger. lo may hold one extra, but hi may not." : "lo already has as many or one more. Sizes are balanced." };
    snap({ line: 10, hl: more ? { [hi[0].id]: "cmp" } : {}, say: more ? `len(hi) = ${hi.length} > len(lo) = ${lo.length}: hi is too big.` : `len(hi) = ${hi.length} <= len(lo) = ${lo.length}: balanced.` });
    if (more) {
      const b = heappop(hi); heappush(lo, { ...b, key: [-b.v] });
      snap({ line: 11, hl: { [b.id]: "act" }, say: `hi's smallest, ${b.v}, moves back to lo. lo may hold one extra item.` });
    }
    if (lo.length > hi.length) {
      median = String(lo[0].v);
      snap({ line: 14, hl: { [lo[0].id]: "res" }, say: `median() = -lo[0] = ${lo[0].v}. Odd count, so the median is the top of lo.` });
    } else {
      median = pyNum((lo[0].v + hi[0].v) / 2);
      snap({ line: 15, hl: { [lo[0].id]: "res", [hi[0].id]: "res" }, say: `median() = (${lo[0].v} + ${hi[0].v}) / 2 = ${median}. Even count, so average the two tops.` });
    }
  });
  F[F.length - 1].say += ` Each add is O(log n).`;
  return { frames: F, starts: [0] };
}

/* ---------------- merge k sorted lists ---------------- */

export const mergeItemId = (i: number, j: number) => i * 100 + j;
export function buildMerge(lists: number[][]): Built {
  const F: HeapFrame[] = [];
  const tray: Item[] = [];
  const mk = (i: number, j: number): Item => ({ id: mergeItemId(i, j), v: lists[i][j], key: [lists[i][j], i, j], tag: `(${lists[i][j]}, ${i}, ${j})` });
  const h: Item[] = lists.map((a, i) => (a.length ? mk(i, 0) : null)).filter((x): x is Item => !!x);
  const N = lists.reduce((s, a) => s + a.length, 0);
  const snap = (f: Omit<HeapFrame, "heaps" | "tray" | "vars"> & { vars?: [string, string][] }) =>
    F.push({ heaps: [[...h]], tray: [...tray], vars: f.vars ?? [["len(h)", String(h.length)], ["len(out)", String(tray.length)]], ...f });
  const hl0: Record<number, Hl> = {}; h.forEach((q) => (hl0[q.id] = "act"));
  snap({ line: 4, hl: hl0, say: `Put the head of each list in h as (value, list i, index j). That is ${h.length} items, one per list.` });
  heapify(h);
  snap({ line: 5, hl: h.length ? { [h[0].id]: "res" } : {}, say: `heapify arranges h into a min-heap in O(k). The smallest head, ${h[0]?.v}, is on top.` });
  while (h.length) {
    const vals = uniqOpts(h.map((q) => q.v).reverse());
    if (vals.length >= 2) {
      const opts = vals.slice(0, 3);
      const mn = Math.min(...h.map((q) => q.v));
      if (!opts.includes(mn)) opts[opts.length - 1] = mn;
      F[F.length - 1].ask = { q: "Which value comes out next?", options: opts.map(String), answer: opts.indexOf(mn), why: `The root of h is always the smallest: ${mn}.` };
    }
    const it = heappop(h); tray.push(it);
    const [v, i, j] = it.key;
    snap({ line: 8, line2: 9, hl: { [it.id]: "act" }, vars: [["v", String(v)], ["i", String(i)], ["j", String(j)], ["len(out)", String(tray.length)]],
      say: `Pop (${v}, ${i}, ${j}): ${v} from list ${i} is the smallest left anywhere. Append it to out.` });
    if (j + 1 < lists[i].length) {
      const nx = mk(i, j + 1); heappush(h, nx);
      snap({ line: 11, line2: 10, hl: { [nx.id]: "act" }, vars: [["i", String(i)], ["j + 1", String(j + 1)], ["len(h)", String(h.length)]],
        say: `List ${i} has a next item, ${nx.v}. Push (${nx.v}, ${i}, ${j + 1}). The heap never holds more than k items.` });
    } else {
      snap({ line: 10, hl: {}, say: `List ${i} is used up. Nothing to push. The heap shrinks to ${h.length}.` });
    }
  }
  snap({ line: 12, hl: {}, say: `h is empty. out holds all ${N} values in sorted order. Total O(N log k).` });
  return { frames: F, starts: [0] };
}
