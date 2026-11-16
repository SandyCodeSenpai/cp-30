/** Fenwick tree (BIT) frames. Pure: input in, frames out. Indexes are 1-based like the template. */
import type { Ask, BaseFrame } from "./kit/player";
import { BL } from "./code";

export type FwOp = "sum" | "add" | "range" | "build";

export interface FwFrame extends BaseFrame {
  a: number[];            // a[1..n] for reference (a[0] unused)
  t: number[];            // t[1..n]
  i: number | null;       // the loop variable right now
  jump?: { from: number; to: number; dir: 1 | -1 }; // the jump this frame explains
  trail: number[];        // indexes visited in the current call, in order
  plus: number[];         // t indexes added with + (sum, or sum(r) in range_sum)
  minus: number[];        // t indexes subtracted (sum(l - 1) in range_sum)
  changed: number[];      // t indexes changed by add
  hot: number | null;     // t index touched in this frame
  vars: { k: string; v: string; tone?: "accent" | "good" | "warn" }[];
  flashA?: number;        // a index that just changed
  done?: boolean;
}

export const lowbit = (i: number) => i & -i;
export const bin = (i: number, w: number) => (i >>> 0).toString(2).padStart(w, "0");
export const bitWidth = (n: number) => Math.max(3, n.toString(2).length);

export function buildT(a: number[]): number[] {
  const n = a.length - 1, t = new Array(n + 1).fill(0);
  for (let i = 1; i <= n; i++) for (let j = i; j <= n; j += lowbit(j)) t[j] += a[i];
  return t;
}

function stepUp(i: number, n: number): number[] { const out: number[] = []; for (let j = i; j <= n; j += lowbit(j)) out.push(j); return out; }
function stepDown(i: number): number[] { const out: number[] = []; for (let j = i; j > 0; j -= lowbit(j)) out.push(j); return out; }

/** nums is 0-based input; inside, a[1..n]. */
export function fenwickFrames(nums: number[], op: FwOp, p: { i: number; d: number; l: number; r: number }): FwFrame[] {
  const n = nums.length, W = bitWidth(n);
  const a = [0, ...nums];
  const frames: FwFrame[] = [];
  const base = (over: Partial<FwFrame>): FwFrame => ({ line: 0, say: "", a, t: [], i: null, trail: [], plus: [], minus: [], changed: [], hot: null, vars: [], ...over });

  if (op === "build") {
    const t = new Array(n + 1).fill(0);
    frames.push(base({ line: BL.buildNew, t: [...t], say: `Start with \`t = [0] * ${n + 1}\`. Every block sum is 0. Now add each value once.` }));
    for (let i = 1; i <= n; i++) {
      const path = stepUp(i, n);
      for (const j of path) t[j] += a[i];
      const ask: Ask | undefined = i === 3 && n >= 4 ? { q: `\`add(3, ${a[3]})\` starts at i = 3. Which t cells does it change?`, options: ["Only t[3]", stepUp(3, n).map((j) => `t[${j}]`).join(", "), "t[1], t[2], t[3]"], answer: 1, why: `Start at 3 = 011 and keep adding the lowest set bit: ${stepUp(3, n).join(" → ")}. Each of those blocks contains a[3].` } : undefined;
      if (ask) frames[frames.length - 1].ask = ask;
      frames.push(base({
        line: BL.buildAdd, line2: BL.buildFor, t: [...t], trail: path, changed: path, hot: path[0], flashA: i,
        vars: [{ k: "i", v: String(i) }, { k: "x", v: String(a[i]) }],
        say: `\`add(${i}, ${a[i]})\` climbs ${path.join(" → ")}: ${path.length === 1 ? "one block holds" : `${path.length} blocks hold`} a[${i}], so ${path.length === 1 ? "it changes" : "each one changes"}.`,
      }));
    }
    frames.push(base({ line: BL.buildAdd, t: [...t], done: true, say: `Built with ${n} adds, O(n log n). Each t[i] holds the sum of the ${"`i & -i`"} values that end at i.` }));
    return frames;
  }

  const t = buildT(a);

  /** Frames for one sum(i) call. sign = +1 for plus, -1 for minus (range_sum). */
  const sumCall = (i0: number, sign: 1 | -1, line2: number | undefined, pre: { plus: number[]; minus: number[]; extra: FwFrame["vars"] }): number => {
    const used: number[] = [];
    const pl = () => (sign > 0 ? [...pre.plus, ...used] : pre.plus);
    const mi = () => (sign < 0 ? [...pre.minus, ...used] : pre.minus);
    let s = 0, i = i0;
    frames.push(base({ line: BL.sumS0, line2, t, i, plus: pl(), minus: mi(), vars: [...pre.extra, { k: "i", v: `${i} = ${bin(i, W)}`, tone: "accent" }, { k: "s", v: "0" }],
      say: i0 === 0 ? "`sum(0)` is the empty prefix. The loop does not run, so it returns 0." : `\`sum(${i0})\` adds up a[1..${i0}]. Start with s = 0 at i = ${i0}.` }));
    while (i > 0) {
      const lb = lowbit(i), lo = i - lb + 1;
      s += t[i]; used.push(i);
      frames.push(base({ line: BL.sumS, line2, t, i, trail: [...used], hot: i, plus: pl(), minus: mi(),
        vars: [...pre.extra, { k: "i", v: `${i} = ${bin(i, W)}`, tone: "accent" }, { k: "s", v: String(s), tone: "good" }],
        say: `\`s += t[${i}]\`. t[${i}] = ${t[i]} is the sum of a[${lo}..${i}] (${lb} value${lb > 1 ? "s" : ""}, because i & -i = ${lb}). Now s = ${s}.` }));
      const nx = i - lb;
      const ask: Ask | undefined = nx > 0 ? (() => {
        const opts = [nx, ...Array.from(new Set([i - 1, i - 2 * lb, i + lb, nx + 1])).filter((x) => x !== i && x !== nx && x >= 0)].slice(0, 3);
        const order = [...opts].sort((x, y) => x - y);
        return { q: `i = ${i} = ${bin(i, W)}. What is i after \`i -= i & -i\`?`, options: order.map(String), answer: order.indexOf(nx), why: `i & -i keeps only the lowest 1 bit: ${bin(lb, W)} = ${lb}. ${i} − ${lb} = ${nx}.` };
      })() : undefined;
      if (ask) frames[frames.length - 1].ask = ask;
      frames.push(base({ line: BL.sumJump, line2, t, i: nx, jump: { from: i, to: nx, dir: -1 }, trail: [...used], plus: pl(), minus: mi(),
        vars: [...pre.extra, { k: "i", v: `${nx} = ${bin(nx, W)}`, tone: "accent" }, { k: "s", v: String(s), tone: "good" }],
        say: nx > 0 ? `\`i -= i & -i\`: ${bin(i, W)} loses its lowest 1 bit (${lb}), so i = ${nx}. The next block ends just before a[${lo}].` : `\`i -= i & -i\`: ${i} − ${lb} = 0. All of a[1..${i0}] is covered.` }));
      i = nx;
    }
    frames.push(base({ line: BL.sumRet, line2, t, i: 0, trail: [...used], plus: pl(), minus: mi(),
      vars: [...pre.extra, { k: "s", v: String(s), tone: "good" }],
      say: `i = 0, so the loop stops. \`sum(${i0})\` returns ${s} after ${used.length} step${used.length === 1 ? "" : "s"}, not ${i0}.` }));
    if (sign > 0) pre.plus.push(...used); else pre.minus.push(...used);
    return s;
  };

  if (op === "sum") {
    const i = Math.min(Math.max(1, p.i), n);
    frames.push(base({ line: BL.sum, t, i, vars: [{ k: "i", v: `${i} = ${bin(i, W)}`, tone: "accent" }], say: `The tree is built. Call \`sum(${i})\` for the prefix a[1] + ... + a[${i}]. Watch i jump down.` }));
    const pre = { plus: [] as number[], minus: [] as number[], extra: [] as FwFrame["vars"] };
    const s = sumCall(i, 1, undefined, pre);
    frames.push(base({ line: BL.sumRet, t, i: null, plus: pre.plus, trail: pre.plus, done: true, vars: [{ k: `sum(${i})`, v: String(s), tone: "good" }],
      say: `Done: sum(${i}) = ${s}. The blocks ${pre.plus.map((x) => `t[${x}]`).join(", ")} tile a[1..${i}] with no gaps and no overlap.` }));
    return frames;
  }

  if (op === "add") {
    const i0 = Math.min(Math.max(1, p.i), n), d = p.d;
    const a2 = [...a]; a2[i0] += d;
    const t2 = [...t];
    const changed: number[] = [];
    frames.push(base({ line: BL.add, a: a2, t: [...t2], i: i0, flashA: i0, vars: [{ k: "i", v: `${i0} = ${bin(i0, W)}`, tone: "accent" }, { k: "delta", v: String(d) }],
      say: `Call \`add(${i0}, ${d})\`: a[${i0}] goes from ${a[i0]} to ${a2[i0]}. Every block that contains a[${i0}] must change by ${d}.` }));
    let i = i0;
    while (i <= n) {
      t2[i] += d; changed.push(i);
      const lb = lowbit(i);
      frames.push(base({ line: BL.addT, a: a2, t: [...t2], i, trail: [...changed], changed: [...changed], hot: i, flashA: i0,
        vars: [{ k: "i", v: `${i} = ${bin(i, W)}`, tone: "accent" }, { k: "delta", v: String(d) }],
        say: `\`t[${i}] += ${d}\`. Block ${i} covers a[${i - lb + 1}..${i}], which contains a[${i0}]. t[${i}] is now ${t2[i]}.` }));
      const nx = i + lb;
      const ask: Ask | undefined = nx <= n ? (() => {
        const order = [nx, ...Array.from(new Set([i + 1, i * 2, i + 2, nx * 2])).filter((x) => x !== i && x !== nx)].slice(0, 3).sort((x, y) => x - y);
        return { q: `i = ${i} = ${bin(i, W)}. What is i after \`i += i & -i\`?`, options: order.map(String), answer: order.indexOf(nx), why: `The lowest 1 bit of ${bin(i, W)} is ${lb}. ${i} + ${lb} = ${nx}: the next block up that also contains a[${i0}].` };
      })() : undefined;
      if (ask) frames[frames.length - 1].ask = ask;
      frames.push(base({ line: BL.addJump, a: a2, t: [...t2], i: nx, jump: { from: i, to: nx, dir: 1 }, trail: [...changed], changed: [...changed], flashA: i0,
        vars: [{ k: "i", v: `${nx} = ${bin(nx, W)}`, tone: "accent" }, { k: "delta", v: String(d) }],
        say: nx <= n ? `\`i += i & -i\`: ${i} + ${lb} = ${nx} (${bin(nx, W)}). Adding the lowest bit carries to a longer block.` : `\`i += i & -i\`: ${i} + ${lb} = ${nx}, which is past n = ${n}. The loop stops.` }));
      i = nx;
    }
    frames.push(base({ line: BL.addWhile, a: a2, t: [...t2], i: null, trail: changed, changed, done: true, vars: [{ k: "changed", v: String(changed.length) }],
      say: `Done: ${changed.length} cells changed (${changed.map((x) => `t[${x}]`).join(", ")}). Never more than log2(n) + 1 = ${Math.floor(Math.log2(n)) + 1}, never n.` }));
    return frames;
  }

  // range_sum(l, r)
  const r = Math.min(Math.max(1, p.r), n), l = Math.min(Math.max(1, p.l), r);
  frames.push(base({ line: BL.range, t, i: null, vars: [{ k: "l", v: String(l) }, { k: "r", v: String(r) }],
    say: `\`range_sum(${l}, ${r})\` = sum(${r}) − sum(${l - 1}). Two prefix walks, then one subtraction.` }));
  const pre = { plus: [] as number[], minus: [] as number[], extra: [{ k: "l", v: String(l) }, { k: "r", v: String(r) }] as FwFrame["vars"] };
  const sr = sumCall(r, 1, BL.rangeRet, pre);
  pre.extra = [...pre.extra, { k: `sum(${r})`, v: String(sr), tone: "good" }];
  const sl = sumCall(l - 1, -1, BL.rangeRet, pre);
  frames.push(base({ line: BL.rangeRet, t, i: null, plus: pre.plus, minus: pre.minus, done: true,
    vars: [{ k: "result", v: `${sr} − ${sl} = ${sr - sl}`, tone: "good" }],
    say: `Return ${sr} − ${sl} = ${sr - sl}: the sum of a[${l}..${r}]. Fenwick can subtract because + has an inverse. Min has none, so min needs a segment tree.` }));
  return frames;
}
