/** Iterative segment tree frames (leaves at t[n..2n-1]). Pure: input in, frames out. */
import type { Ask, BaseFrame } from "./kit/player";
import { SL } from "./code";

export type SegOp = "query" | "update" | "build";
export type SegFn = "min" | "max" | "sum";

export interface SegFrame extends BaseFrame {
  t: number[];               // t[1..2n-1]; t[0] unused
  built: number;             // internal nodes >= built hold real values (build mode); 1 when built
  l: number | null; r: number | null;  // query pointers (tree indexes)
  i: number | null;          // update / build index
  res: number | null;
  used: number[];            // nodes merged into res
  visited: number[];         // nodes a pointer has been on
  changed: number[];         // nodes rewritten (update / build)
  hot: number | null;        // node read or written in this frame
  kids: number[];            // children read by op(...) in this frame
  q?: [number, number];      // query range a[L:R)
  vars: { k: string; v: string; tone?: "accent" | "good" | "warn" }[];
  done?: boolean;
}

export const identity = (fn: SegFn) => (fn === "min" ? Infinity : fn === "max" ? -Infinity : 0);
export const apply = (fn: SegFn, x: number, y: number) => (fn === "min" ? Math.min(x, y) : fn === "max" ? Math.max(x, y) : x + y);
export const fmtV = (v: number | null) => (v === null ? "" : v === Infinity ? "inf" : v === -Infinity ? "-inf" : String(v));
const opTxt = (fn: SegFn, x: number, y: number) => (fn === "sum" ? `${fmtV(x)} + ${fmtV(y)}` : `${fn}(${fmtV(x)}, ${fmtV(y)})`);

/** The array positions under node v (sorted). Works for any n, including non-powers of two. */
export function leavesOf(v: number, n: number): number[] {
  const out: number[] = [];
  const walk = (u: number) => { if (u >= 2 * n) return; if (u >= n) { out.push(u - n); return; } walk(2 * u); walk(2 * u + 1); };
  walk(v);
  return out.sort((x, y) => x - y);
}

export function rangeLabel(v: number, n: number): string {
  const ls = leavesOf(v, n);
  const parts: string[] = [];
  let s = ls[0], p = ls[0];
  for (let k = 1; k <= ls.length; k++) {
    if (k < ls.length && ls[k] === p + 1) { p = ls[k]; continue; }
    parts.push(s === p ? `a[${s}]` : `a[${s}..${p}]`);
    if (k < ls.length) { s = ls[k]; p = ls[k]; }
  }
  return parts.join(" + ");
}

export function segFrames(nums: number[], fn: SegFn, op: SegOp, p: { l: number; r: number; i: number; v: number }): SegFrame[] {
  const n = nums.length, e = identity(fn);
  const frames: SegFrame[] = [];
  const base = (o: Partial<SegFrame>): SegFrame => ({ line: 0, say: "", t: [], built: 1, l: null, r: null, i: null, res: null, used: [], visited: [], changed: [], hot: null, kids: [], vars: [], ...o });
  const t: number[] = [e, ...new Array(n - 1).fill(e), ...nums];

  if (op === "build") {
    frames.push(base({ line: SL.leaves, t: [...t], built: n, vars: [{ k: "n", v: String(n) }],
      say: `\`self.t = [identity] * n + list(data)\`: the ${n} values sit in the leaves t[${n}..${2 * n - 1}]. Inner nodes start as ${fmtV(e)}.` }));
    const changed: number[] = [];
    for (let i = n - 1; i >= 1; i--) {
      const x = t[2 * i], y = t[2 * i + 1];
      t[i] = apply(fn, x, y); changed.push(i);
      if (i === n - 2 && n >= 4) {
        frames[frames.length - 1].ask = { q: `Next is node ${i}. Which two nodes does it read?`, options: [`${i - 1} and ${i + 1}`, `${2 * i} and ${2 * i + 1}`, `${Math.floor(i / 2)} and ${i + 1}`], answer: 1, why: `Node i has children 2i and 2i + 1: ${2 * i} and ${2 * i + 1}.` };
      }
      frames.push(base({ line: SL.buildT, line2: SL.buildFor, t: [...t], built: i, i, hot: i, kids: [2 * i, 2 * i + 1], changed: [...changed],
        vars: [{ k: "i", v: String(i), tone: "accent" }, { k: `t[${i}]`, v: fmtV(t[i]), tone: "good" }],
        say: `t[${i}] = ${opTxt(fn, x, y)} = ${fmtV(t[i])}. Node ${i} reads its children ${2 * i} and ${2 * i + 1}, and covers ${rangeLabel(i, n)}.` }));
    }
    frames.push(base({ line: SL.buildFor, t: [...t], built: 1, changed, done: true, vars: [{ k: "root t[1]", v: fmtV(t[1]), tone: "good" }],
      say: `Built in O(n): ${n - 1} inner nodes, from n − 1 down to 1, so children are ready before parents. The root t[1] = ${fmtV(t[1])} is the ${fn} of the whole array.` }));
    return frames;
  }

  for (let i = n - 1; i >= 1; i--) t[i] = apply(fn, t[2 * i], t[2 * i + 1]);

  if (op === "update") {
    const ai = Math.min(Math.max(0, p.i), n - 1), val = p.v;
    let i = ai;
    frames.push(base({ line: SL.upd, t: [...t], vars: [{ k: "i", v: String(ai) }, { k: "value", v: String(val) }],
      say: `\`update(${ai}, ${val})\`: set a[${ai}] = ${val} (it was ${nums[ai]}). Only the nodes above that leaf can change.` }));
    i += n;
    frames.push(base({ line: SL.updShift, t: [...t], i, vars: [{ k: "i", v: String(i), tone: "accent" }],
      say: `\`i += self.n\`: the leaf for a[${ai}] is t[${i}].` }));
    t[i] = val;
    const changed = [i];
    frames.push(base({ line: SL.updSet, t: [...t], i, hot: i, changed: [...changed], vars: [{ k: "i", v: String(i), tone: "accent" }],
      say: `\`self.t[${i}] = ${val}\`. The leaf is new, so its parent is now out of date.` }));
    while (i > 1) {
      const par = i >> 1;
      const ask: Ask = { q: `i = ${i}. What is i after \`i >>= 1\`?`, options: [String(par), String(i - 1), String(i * 2)].sort((x, y) => Number(x) - Number(y)), answer: -1, why: `Shifting right by one halves i: the parent of ${i} is ${i} // 2 = ${par}.` };
      ask.answer = ask.options.indexOf(String(par));
      frames[frames.length - 1].ask = ask;
      i = par;
      frames.push(base({ line: SL.updUp, t: [...t], i, kids: [2 * i, 2 * i + 1], changed: [...changed], vars: [{ k: "i", v: String(i), tone: "accent" }],
        say: `\`i >>= 1\`: move to the parent, node ${i}.` }));
      const x = t[2 * i], y = t[2 * i + 1];
      t[i] = apply(fn, x, y); changed.push(i);
      frames.push(base({ line: SL.updT, t: [...t], i, hot: i, kids: [2 * i, 2 * i + 1], changed: [...changed], vars: [{ k: "i", v: String(i), tone: "accent" }, { k: `t[${i}]`, v: fmtV(t[i]), tone: "good" }],
        say: `t[${i}] = ${opTxt(fn, x, y)} = ${fmtV(t[i])}.` }));
    }
    frames.push(base({ line: SL.updWhile, t: [...t], changed, done: true, vars: [{ k: "nodes rewritten", v: String(changed.length), tone: "good" }],
      say: `i = 1 is the root, so the loop stops. ${changed.length} nodes changed: one per level, O(log n).` }));
    return frames;
  }

  // query a[L:R)
  const R = Math.min(Math.max(1, p.r), n), L = Math.min(Math.max(0, p.l), R - 1);
  const q: [number, number] = [L, R];
  let res = e;
  const used: number[] = [], visited: number[] = [];
  const st = (o: Partial<SegFrame>) => base({ t, q, res, used: [...used], visited: [...visited], ...o });
  const vv = (l: number | null, r: number | null) => [
    ...(l !== null ? [{ k: "l", v: String(l), tone: "accent" as const }] : []),
    ...(r !== null ? [{ k: "r", v: String(r), tone: "accent" as const }] : []),
    { k: "res", v: fmtV(res), tone: "good" as const }];
  frames.push(st({ line: SL.q, vars: [{ k: "l", v: String(L) }, { k: "r", v: String(R) }],
    say: `\`query(${L}, ${R})\`: the ${fn} of a[${L}:${R}], that is a[${L}..${R - 1}]. The tinted nodes show which parts of the tree lie inside the range.` }));
  frames.push(st({ line: SL.qRes, vars: vv(null, null), say: `\`res = self.e\` = ${fmtV(e)}, the identity: ${fn === "sum" ? "x + 0 = x" : `${fn}(x, ${fmtV(e)}) = x`}.` }));
  let l = L + n, r = R + n;
  visited.push(l); if (r - 1 >= 1) visited.push(r - 1);
  frames.push(st({ line: SL.qR, line2: SL.qL, l, r, vars: vv(l, r), say: `Move to the leaves: l = ${L} + ${n} = ${l}, r = ${R} + ${n} = ${r}. r is exclusive, so the range is the leaves l to r − 1.` }));
  const decide: number[] = [];
  while (l < r) {
    if (l & 1) {
      res = apply(fn, res, t[l]); used.push(l);
      decide.push(frames.length);
      frames.push(st({ line: SL.qLtake, line2: SL.qLodd, l, r, hot: l, vars: vv(l, r),
        say: `l = ${l} is odd: a right child. Its parent also covers a cell left of the range, so take t[${l}] = ${fmtV(t[l])} now (${rangeLabel(l, n)}). res = ${fmtV(res)}.` }));
      l += 1; visited.push(l);
      frames.push(st({ line: SL.qLinc, l, r, vars: vv(l, r), say: `\`l += 1\`: step past the node we just used. l = ${l}.` }));
    } else {
      decide.push(frames.length);
      frames.push(st({ line: SL.qLodd, l, r, vars: vv(l, r),
        say: `l = ${l} is even: a left child. Do not take it yet. Its parent covers it, so the work moves up a level.` }));
    }
    if (l >= r) { /* still run the r check like the code does */ }
    if (r & 1) {
      r -= 1; visited.push(r);
      frames.push(st({ line: SL.qRdec, line2: SL.qRodd, l, r, vars: vv(l, r), say: `r = ${r + 1} is odd, so node ${r} (just left of r) is a left child whose parent sticks out. \`r -= 1\`: r = ${r}.` }));
      res = apply(fn, res, t[r]); used.push(r);
      frames.push(st({ line: SL.qRtake, l, r, hot: r, vars: vv(l, r), say: `Take t[${r}] = ${fmtV(t[r])} (${rangeLabel(r, n)}). res = ${fmtV(res)}.` }));
    } else {
      frames.push(st({ line: SL.qRodd, l, r, vars: vv(l, r), say: `r = ${r} is even: node ${r - 1} is a right child, so its parent can cover it. Nothing to take on the right.` }));
    }
    const nl = l >> 1, nr = r >> 1;
    l = nl; r = nr;
    if (l < r) { visited.push(l); if (r - 1 >= 1) visited.push(r - 1); }
    frames.push(st({ line: SL.qRup, line2: SL.qLup, l, r, vars: vv(l, r), say: l < r ? `Go up one level: l = ${l}, r = ${r}.` : `Go up one level: l = ${l}, r = ${r}. Now l >= r, so nothing is left between them.` }));
  }
  frames.push(st({ line: SL.qRet, vars: [{ k: "res", v: fmtV(res), tone: "good" }], done: true,
    say: `Return ${fmtV(res)}. ${used.length} nodes (${used.map((u) => `t[${u}]`).join(", ")}) tile a[${L}..${R - 1}] exactly. At most 2 per level: O(log n).` }));

  // Predict: before each l decision, ask whether t[l] is used.
  for (const k of decide) {
    const fr = frames[k];
    if (k === 0 || fr.l === null) continue;
    const taken = fr.line === SL.qLtake;
    frames[k - 1].ask = { q: `l = ${fr.l}. Does t[${fr.l}] go into res now?`, options: ["Yes, take it", "No, its parent will cover it"], answer: taken ? 0 : 1,
      why: taken ? `${fr.l} is odd, a right child. Its parent reaches outside the range, so this node must be taken on its own.` : `${fr.l} is even, a left child. Its parent may lie fully inside, so we wait.` };
  }
  return frames;
}
