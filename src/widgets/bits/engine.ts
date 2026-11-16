/** Pure frame builders for the bits lab. Each returns every frame up front. */
import type { Ask, BaseFrame } from "./kit/player";
import { BL, SL } from "./code";
import { binStr, toBits } from "./grid";

/* ---------------- basics ---------------- */

export type Op = "and" | "or" | "xor" | "shl" | "shr" | "clearlow" | "lowbit" | "neg";
export const OPS: { value: Op; label: string; short: string }[] = [
  { value: "and", label: "x & y", short: "&" },
  { value: "or", label: "x | y", short: "|" },
  { value: "xor", label: "x ^ y", short: "^" },
  { value: "neg", label: "-x", short: "-x" },
  { value: "shl", label: "x << k", short: "<<" },
  { value: "shr", label: "x >> k", short: ">>" },
  { value: "lowbit", label: "x & -x", short: "x&-x" },
  { value: "clearlow", label: "x & (x-1)", short: "x&(x-1)" },
];
export const usesY = (op: Op) => op === "and" || op === "or" || op === "xor";
export const usesK = (op: Op) => op === "shl" || op === "shr";

export interface BRow { key: string; label: string; v: number; tone: "in" | "mid" | "res"; name: string }
export interface BasicsFrame extends BaseFrame { reveal: number[]; col: number | null; src: [number, number] | null; over?: (string | null)[]; overRow?: number }
export interface BasicsRun { rows: BRow[]; frames: BasicsFrame[]; result: number; overflow: boolean }

const opSym = { and: "&", or: "|", xor: "^" } as const;
const lowestOne = (v: number, w: number) => toBits(v, w).indexOf(1);

export function buildBasics(op: Op, x: number, y: number, k: number, w: number): BasicsRun {
  const F: BasicsFrame[] = [];
  const xb = toBits(x, w);
  if (op === "and" || op === "or" || op === "xor") {
    const s = opSym[op];
    const r = op === "and" ? x & y : op === "or" ? x | y : x ^ y;
    const yb = toBits(y, w), rb = toBits(r, w);
    const rows: BRow[] = [
      { key: "x", label: "x", v: x, tone: "in", name: "x" },
      { key: "y", label: `${s} y`, v: y, tone: "in", name: "y" },
      { key: "r", label: "=", v: r, tone: "res", name: "result" },
    ];
    const line = BL[op];
    const rule = op === "and" ? "AND gives 1 only when both bits are 1" : op === "or" ? "OR gives 1 when at least one bit is 1" : "XOR gives 1 when the two bits differ";
    F.push({ line, say: `Line the bits up in columns. ${rule}. Work from bit 0 on the right.`, reveal: [w, w, 0], col: null, src: null });
    const askCols = new Set<number>();
    const d = xb.findIndex((a, i) => a !== yb[i]); if (d >= 0) askCols.add(d);
    const both = xb.findIndex((a, i) => a === 1 && yb[i] === 1); if (both >= 0) askCols.add(both);
    for (let i = 0; i < w; i++) {
      const a = xb[i], b = yb[i], o = rb[i];
      const why = op === "and" ? (o ? "both are 1" : "not both 1") : op === "or" ? (o ? "at least one is 1" : "both are 0") : (o ? "they differ" : "they are the same");
      const ask: Ask | undefined = askCols.has(i)
        ? { q: `Bit ${i}: x has ${a}, y has ${b}. What is \`${a} ${s} ${b}\`?`, options: ["0", "1"], answer: o, why: `${a} ${s} ${b} = ${o}: ${why}.` }
        : undefined;
      if (ask) F[F.length - 1].ask = ask;
      F.push({ line, say: `Bit ${i} (worth ${2 ** i}): \`${a} ${s} ${b} = ${o}\`, because ${why}.`, reveal: [w, w, i + 1], col: i, src: null });
    }
    const sum = rb.map((v, i) => (v ? 2 ** i : 0)).filter(Boolean);
    F.push({ line, say: `x ${s} y = ${r}${sum.length > 1 ? ` (${sum.reverse().join(" + ")})` : ""}. Each column was computed on its own: no carries.`, reveal: [w, w, w], col: null, src: null });
    return { rows, frames: F, result: r, overflow: false };
  }
  if (op === "shl" || op === "shr") {
    const left = op === "shl";
    const r = left ? x * 2 ** k : Math.floor(x / 2 ** k);
    const rb = toBits(r, w);
    const overflow = left && (r >= 2 ** w || r < -(2 ** (w - 1)));
    const rows: BRow[] = [
      { key: "x", label: "x", v: x, tone: "in", name: "x" },
      { key: "r", label: left ? `<< ${k}` : `>> ${k}`, v: r, tone: "res", name: "result" },
    ];
    const line = left ? BL.shl : BL.shr;
    F.push({
      line,
      say: left ? `Shift left by k = ${k}: every bit moves ${k} place${k === 1 ? "" : "s"} to the left, and 0s come in on the right. That is x * 2**${k}.`
        : `Shift right by k = ${k}: every bit moves ${k} place${k === 1 ? "" : "s"} to the right, and the low bits fall off. That is x // 2**${k}.`,
      reveal: [w, 0], col: null, src: null,
    });
    if (k > 0) F[0].ask = left
      ? { q: `What is \`${x} << ${k}\`?`, options: [String(x * 2 ** k), String(x + k), String(x * k)], answer: 0, why: `Each shift left doubles the number, so it is ${x} * 2**${k}.` }
      : { q: `What is \`${x} >> ${k}\`?`, options: [String(Math.floor(x / 2 ** k)), String(x - k), String(Math.floor(x / k) || 0)], answer: 0, why: `Each shift right halves the number and rounds down, so it is ${x} // 2**${k}.` };
    for (let i = 0; i < w; i++) {
      const from = left ? i - k : i + k;
      let say: string;
      if (left && from < 0) say = `Bit ${i}: nothing shifts in here, so it is 0.`;
      else if (!left && from >= w) say = `Bit ${i}: it would come from bit ${from}, above the top. Python fills with the sign: ${x < 0 ? "1 because x < 0" : "0 because x ≥ 0"}.`;
      else say = `Bit ${i} comes from bit ${from} of x, which is ${xb[from]}.`;
      F.push({ line, say, reveal: [w, i + 1], col: i, src: from >= 0 && from < w ? [0, from] : null });
    }
    F.push({
      line,
      say: overflow ? `x << ${k} = ${r}. Python ints have no width, so nothing is lost; only the low ${w} bits fit in this picture.`
        : `${left ? `x << ${k}` : `x >> ${k}`} = ${r}${left ? ` = ${x} * ${2 ** k}` : ` = ${x} // ${2 ** k}`}.`,
      reveal: [w, w], col: null, src: null,
    });
    return { rows, frames: F, result: r, overflow };
  }
  if (op === "clearlow" || op === "lowbit") {
    const clear = op === "clearlow";
    const m = clear ? x - 1 : -x;
    const r = clear ? x & (x - 1) : x & -x;
    const mb = toBits(m, w), rb = toBits(r, w);
    const p = lowestOne(x, w);
    const rows: BRow[] = [
      { key: "x", label: "x", v: x, tone: "in", name: "x" },
      { key: "m", label: clear ? "& x-1" : "& -x", v: m, tone: "mid", name: clear ? "x - 1" : "-x" },
      { key: "r", label: "=", v: r, tone: "res", name: "result" },
    ];
    const line = clear ? BL.clearlow : BL.lowbit;
    F.push({
      line,
      say: x === 0 ? "x = 0 has no set bit, so the answer will be 0." : `x = ${x}. Its lowest set bit is bit ${p} (worth ${2 ** p}).`,
      reveal: [w, 0, 0], col: p >= 0 ? p : null, src: null,
      ask: x === 0 ? undefined : clear
        ? { q: `Which bit of x will \`x & (x - 1)\` remove?`, options: ["The lowest 1", "The highest 1", "Bit 0, always"], answer: 0, why: "x - 1 turns the lowest 1 into 0 and the 0s below it into 1s. AND with x keeps everything else." }
        : { q: `What is left after \`x & -x\`?`, options: ["Only the lowest 1", "Only the highest 1", "Every bit except the lowest 1"], answer: 0, why: "-x flips every bit above the lowest 1 and keeps the lowest 1. So AND keeps only that bit." },
    });
    F.push({
      line,
      say: clear
        ? `x - 1 = ${m}: the lowest 1 (bit ${p}) becomes 0, and every 0 below it becomes 1. Bits above bit ${p} do not change.`
        : `-x = ${m} = ~x + 1. Every bit above bit ${p} is flipped; bit ${p} and the 0s below it stay the same.`,
      reveal: [w, w, 0], col: p >= 0 ? p : null, src: null,
    });
    if (x === 0) F[1].say = clear ? "x - 1 = -1: in two's complement every bit is 1." : "-0 = 0: every bit is 0.";
    for (let i = 0; i < w; i++) {
      const a = xb[i], b = mb[i];
      const zone = p < 0 ? "" : i < p ? " (below the lowest 1)" : i === p ? " (the lowest 1)" : " (above it)";
      F.push({ line, say: `Bit ${i}${zone}: \`${a} & ${b} = ${a & b}\`.`, reveal: [w, w, i + 1], col: i, src: null });
    }
    F.push({
      line,
      say: clear ? `x & (x - 1) = ${r}: the lowest set bit is gone.${x > 0 && r === 0 ? ` It is 0, so ${x} is a power of two.` : ""} Repeat it to visit every set bit.`
        : `x & -x = ${r}: only the lowest set bit is left, as a value.${x === 12 ? " That is the book's 12 -> 4." : ""} The Fenwick tree (Day 25) is built on this.`,
      reveal: [w, w, w], col: null, src: null,
    });
    return { rows, frames: F, result: r, overflow: false };
  }
  // neg: two's complement, -x = ~x + 1
  const nx = ~x, r = -x;
  const nb = toBits(nx, w), rb = toBits(r, w);
  const rows: BRow[] = [
    { key: "x", label: "x", v: x, tone: "in", name: "x" },
    { key: "n", label: "~x", v: nx, tone: "mid", name: "~x" },
    { key: "o", label: "+ 1", v: 1, tone: "mid", name: "one" },
    { key: "r", label: "= -x", v: r, tone: "res", name: "-x" },
  ];
  F.push({ line: BL.neg, say: `Two's complement: to get -x, flip every bit of x, then add 1. Start with x = ${x}.`, reveal: [w, 0, 0, 0], col: null, src: null });
  for (let i = 0; i < w; i++) F.push({ line: BL.neg, say: `Flip bit ${i}: x has ${xb[i]}, so ~x has ${nb[i]}.`, reveal: [w, i + 1, 0, 0], col: i, src: null });
  F.push({
    line: BL.neg, say: `~x = ${nx}. In Python, ~x is always -x - 1. Now add 1, with carries, from bit 0.`, reveal: [w, w, w, 0], col: null, src: null,
    ask: { q: "Adding 1 to ~x: where does the carry stop?", options: ["At the first 0 of ~x", "At bit 0", "It never stops"], answer: 0, why: "1 + 1 = 10 in binary: every 1 at the bottom of ~x becomes 0 and passes the carry on, until the first 0 takes it." },
  });
  let carry = 1;
  const over: (string | null)[] = new Array(w).fill(null);
  for (let i = 0; i < w; i++) {
    const add = (i === 0 ? 1 : 0);
    const sum = nb[i] + add + (i === 0 ? 0 : carry);
    const cin = i === 0 ? 0 : carry;
    if (i > 0 && cin) over[i] = "1";
    const out = sum >> 1;
    F.push({
      line: BL.neg,
      say: i === 0 ? `Bit 0: ${nb[0]} + 1 = ${sum}, write ${sum & 1}${out ? ", carry 1" : ""}.` : cin ? `Bit ${i}: ${nb[i]} + carry 1 = ${sum}, write ${sum & 1}${out ? ", carry 1" : ""}.` : `Bit ${i}: no carry, copy ${nb[i]}.`,
      reveal: [w, w, w, i + 1], col: i, src: null, over: over.slice(), overRow: 3,
    });
    carry = out;
    if (!carry && i < w - 1) {
      F.push({ line: BL.neg, say: `The carry is used up, so bits ${i + 1} to ${w - 1} are copied from ~x.`, reveal: [w, w, w, w], col: null, src: null, over: over.slice(), overRow: 3 });
      break;
    }
  }
  F.push({ line: BL.neg, say: `-x = ${r}. The top bit is the sign: it is worth -${2 ** (w - 1)} in ${w} bits. Python shows bin(${r}) as ${r < 0 ? "'-0b" + (-r).toString(2) + "'" : "'0b" + r.toString(2) + "'"}, not these bits; mask with & ${"0x" + (2 ** w - 1).toString(16).toUpperCase()} to see them.`, reveal: [w, w, w, w], col: null, src: null, over, overRow: 3 });
  void rb;
  return { rows, frames: F, result: r, overflow: false };
}

/* ---------------- subsets ---------------- */

export interface SubFrame extends BaseFrame { sub: number; found: number[]; calc: { sub: number; minus: number; next: number } | null }
export const setStr = (m: number, n: number) => `{${Array.from({ length: n }, (_, i) => i).filter((i) => (m >> i) & 1).join(", ")}}`;

export function buildSubsets(mask: number, n: number): SubFrame[] {
  const F: SubFrame[] = [];
  const pc = toBits(mask, n).filter(Boolean).length;
  if (mask === 0) {
    F.push({ line: SL.init, say: "The mask is 0, the empty set. Click some item bits to put items in the set.", sub: 0, found: [], calc: null });
    F.push({ line: SL.loop, say: "sub = 0, so `while sub:` stops at once. The empty set has no non-empty submasks.", sub: 0, found: [], calc: null });
    return F;
  }
  F.push({ line: SL.init, say: `mask = ${binStr(mask, n)} is the set ${setStr(mask, n)}. Start with sub = mask, the largest submask.`, sub: mask, found: [], calc: null });
  let sub = mask;
  const found: number[] = [];
  while (sub) {
    found.push(sub);
    const next = (sub - 1) & mask;
    const minus = sub - 1;
    const wrong1 = minus !== next ? minus : (sub >> 1) & mask;
    const wrong2 = [next ^ mask, sub & (sub - 1), (next - 1) & mask].find((v) => v !== next && v !== wrong1 && v > 0) ?? (next + 1);
    const opts = [next, wrong1, wrong2].map((v) => binStr(v, n));
    F.push({
      line: SL.use, say: `Use sub = ${binStr(sub, n)}: the set ${setStr(sub, n)}. That is submask ${found.length}.`, sub, found: found.slice(), calc: null,
      ask: found.length <= 3 ? { q: `sub = ${binStr(sub, n)}. What is the next submask, \`(sub - 1) & mask\`?`, options: opts, answer: 0, why: `sub - 1 = ${binStr(minus, n)}, then & mask keeps only items in the set: ${binStr(next, n)}.` } : undefined,
    });
    F.push({
      line: SL.next,
      say: minus === next
        ? `sub - 1 = ${binStr(minus, n)}. Every bit is already inside the mask, so the next sub is ${binStr(next, n)}${next ? ` = ${setStr(next, n)}` : ""}.`
        : `sub - 1 = ${binStr(minus, n)} turns on bits outside the mask. & mask clears them: next sub = ${binStr(next, n)}${next ? ` = ${setStr(next, n)}` : ""}.`,
      sub, found: found.slice(), calc: { sub, minus, next },
    });
    sub = next;
  }
  F.push({ line: SL.loop, say: `sub = 0, so the loop stops. ${found.length} non-empty submasks = 2**${pc} - 1, in decreasing order. Each step costs O(1).`, sub: 0, found: found.slice(), calc: null });
  return F;
}

/* ---------------- xor tricks ---------------- */

export interface SingleFrame extends BaseFrame { i: number; prev: number; ans: number; odd: number[]; cancel: number | null }
export function buildSingle(nums: number[]): SingleFrame[] {
  const F: SingleFrame[] = [];
  F.push({ line: 1, say: "Start with ans = 0. XOR with 0 changes nothing.", i: -1, prev: 0, ans: 0, odd: [], cancel: null });
  let ans = 0;
  const odd: number[] = [];
  nums.forEach((x, i) => {
    const prev = ans;
    ans ^= x;
    const at = odd.indexOf(x);
    const seen = at >= 0;
    if (seen && F.length) F[F.length - 1].ask = { q: `x = ${x} was seen before. What does \`ans ^= ${x}\` do?`, options: [`Its bits cancel out of ans`, `ans doubles`, `ans does not change`], answer: 0, why: `${x} ^ ${x} = 0, so the second copy removes exactly what the first copy added.` };
    if (seen) odd.splice(at, 1); else odd.push(x);
    F.push({
      line: 3,
      say: seen ? `x = ${x} is a second copy: its bits cancel. ans = ${prev} ^ ${x} = ${ans}.` : `x = ${x} is new: ans = ${prev} ^ ${x} = ${ans}.`,
      i, prev, ans, odd: odd.slice(), cancel: seen ? x : null,
    });
  });
  F.push({
    line: 4,
    say: odd.length === 1 ? `return ${ans}. Every pair cancelled, so only the single number ${odd[0]} is left. O(n) time, O(1) space.` : `return ${ans}. That is the XOR of the values that appear an odd number of times: ${odd.join(", ") || "none"}.`,
    i: nums.length, prev: ans, ans, odd: odd.slice(), cancel: null,
  });
  return F;
}

export interface PrefixFrame extends BaseFrame { built: number; px: number[]; i: number; query: boolean; done: boolean }
export function buildPrefix(a: number[], l: number, r: number): PrefixFrame[] {
  const F: PrefixFrame[] = [];
  const px = [0];
  F.push({ line: 0, say: "px[0] = 0: the XOR of nothing. px[i] will hold a[0] ^ ... ^ a[i-1].", built: 1, px: px.slice(), i: -1, query: false, done: false });
  a.forEach((x, i) => {
    px.push(px[i] ^ x);
    F.push({ line: 2, say: `px[${i + 1}] = px[${i}] ^ a[${i}] = ${px[i]} ^ ${x} = ${px[i + 1]}.`, built: i + 2, px: px.slice(), i, query: false, done: false });
  });
  const res = px[r + 1] ^ px[l];
  F[F.length - 1].ask = {
    q: `Which XOR gives \`a[${l}] ^ ... ^ a[${r}]\`?`,
    options: [`px[${r + 1}] ^ px[${l}]`, `px[${r}] ^ px[${l}]`, `px[${r + 1}] ^ px[${l + 1}]`], answer: 0,
    why: `px[${r + 1}] covers a[0..${r}] and px[${l}] covers a[0..${l - 1}]. The shared part a[0..${l - 1}] cancels.`,
  };
  F.push({ line: 5, say: `Query l = ${l}, r = ${r}: px[${r + 1}] ^ px[${l}] = ${px[r + 1]} ^ ${px[l]} = ${res}. The shared prefix a[0..${l - 1}] appears twice and cancels.`, built: px.length, px: px.slice(), i: -1, query: true, done: false });
  if (l === 0) F[F.length - 1].say = `Query l = 0, r = ${r}: px[${r + 1}] ^ px[0] = ${px[r + 1]} ^ 0 = ${res}.`;
  F.push({ line: 5, say: `Check: ${a.slice(l, r + 1).join(" ^ ")} = ${res}. Any range in O(1), after one O(n) pass.`, built: px.length, px: px.slice(), i: -1, query: true, done: true });
  return F;
}

/* ---------------- per bit ---------------- */

export interface BitStat { b: number; ones: number; zeros: number; xp: number; ap: number; op: number }
export interface PerBitFrame extends BaseFrame { b: number; phase: "init" | "count" | "add" | "done"; stats: BitStat[]; xs: number; as: number; os: number }
export function buildPerBit(a: number[]): PerBitFrame[] {
  const n = a.length;
  const bits = Math.max(1, Math.max(...a).toString(2).length);
  const pairs = (n * (n - 1)) / 2;
  const F: PerBitFrame[] = [];
  F.push({ line: 2, say: `${n} numbers make ${pairs} pairs. Instead of XOR-ing every pair, look at one bit column at a time.`, b: -1, phase: "init", stats: [], xs: 0, as: 0, os: 0 });
  let xs = 0, as = 0, os = 0;
  const stats: BitStat[] = [];
  for (let b = 0; b < bits; b++) {
    const ones = a.filter((x) => (x >> b) & 1).length;
    const zeros = n - ones;
    const xp = ones * zeros, ap = (ones * (ones - 1)) / 2, op = pairs - (zeros * (zeros - 1)) / 2;
    F.push({
      line: 4, say: `Bit ${b}: ${ones} number${ones === 1 ? " has" : "s have"} a 1 here.`, b, phase: "count", stats: stats.slice(), xs, as, os,
      ask: b < 2 ? { q: `Bit ${b}: ones = ${ones}, zeros = ${zeros}. How many pairs have a 1 in this bit of their XOR?`, options: [`ones * zeros = ${xp}`, `C(ones, 2) = ${ap}`, `ones = ${ones}`], answer: 0, why: "XOR is 1 exactly when one number has 1 and the other has 0: pick one from each group." } : undefined,
    });
    xs += xp * 2 ** b; as += ap * 2 ** b; os += op * 2 ** b;
    stats.push({ b, ones, zeros, xp, ap, op });
    F.push({
      line: 6,
      say: `zeros = ${zeros}. ${ones} * ${zeros} = ${xp} pair${xp === 1 ? "" : "s"} differ in bit ${b}; each is worth ${2 ** b}, so xor_s += ${xp * 2 ** b}. AND counts C(${ones}, 2) = ${ap}, OR counts ${pairs} - C(${zeros}, 2) = ${op}.`,
      b, phase: "add", stats: stats.slice(), xs, as, os,
    });
  }
  let bx = 0, ba = 0, bo = 0;
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) { bx += a[i] ^ a[j]; ba += a[i] & a[j]; bo += a[i] | a[j]; }
  const ok = bx === xs && ba === as && bo === os;
  F.push({
    line: 9,
    say: `Done in ${bits} columns. Brute force over all ${pairs} pairs gives XOR ${bx}, AND ${ba}, OR ${bo}: ${ok ? "the same" : "different"}. Cost O(n * bits), not O(n^2).${bits < 31 ? ` Bits ${bits} to 30 have ones = 0 and add nothing.` : ""}`,
    b: -1, phase: "done", stats: stats.slice(), xs, as, os,
  });
  return F;
}
