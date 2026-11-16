/** Coordinate compression + inversion count with a BIT of counts (count_inversions). Pure frames. */
import type { Ask, BaseFrame } from "./kit/player";
import { IL } from "./code";

export interface CmpFrame extends BaseFrame {
  stage: 0 | 1 | 2 | 3;      // 0 = raw, 1 = duplicates marked, 2 = sorted vals shown, 3 = ranks shown
  dup: boolean[];            // a[i] is a repeat of an earlier value
  ranks: (number | null)[];  // compressed rank under each a[i] (filled as we go)
  cnt: number[];             // cnt[r] for r = 1..k (what the BIT stores, as plain counts)
  seen: number | null;       // loop index
  r: number | null;          // rank of the current x
  sumR: number | null;       // when set, highlight ranks <= sumR (bit.sum) and > sumR (strictly greater)
  addR: number | null;       // rank just added
  inv: number;
  vars: { k: string; v: string; tone?: "accent" | "good" | "warn" }[];
  done?: boolean;
}

export function fmtBig(v: number): string {
  const s = v < 0 ? "−" : "", a = Math.abs(v);
  if (a < 10000) return s + String(a);
  if (a % 1_000_000_000 === 0) return `${s}${a / 1_000_000_000}B`;
  if (a % 1_000_000 === 0) return `${s}${a / 1_000_000}M`;
  if (a % 1000 === 0) return `${s}${a / 1000}k`;
  return s + a.toLocaleString("en-US");
}

export function cmpFrames(a: number[]): { frames: CmpFrame[]; vals: number[] } {
  const n = a.length;
  const vals = Array.from(new Set(a)).sort((x, y) => x - y), k = vals.length;
  const rank = new Map(vals.map((v, i) => [v, i + 1] as const));
  const firstAt = new Map<number, number>();
  const dup = a.map((v, i) => { if (firstAt.has(v)) return true; firstAt.set(v, i); return false; });
  const frames: CmpFrame[] = [];
  const ranks: (number | null)[] = new Array(n).fill(null);
  const cnt = new Array(k + 1).fill(0);
  let inv = 0;
  const base = (o: Partial<CmpFrame>): CmpFrame => ({ line: 0, say: "", stage: 3, dup, ranks: [...ranks], cnt: [...cnt], seen: null, r: null, sumR: null, addR: null, inv, vars: [], ...o });

  frames.push(base({ line: IL.def, stage: 0, dup: a.map(() => false),
    say: `Count pairs i < j with a[i] > a[j]. The values go up to ${fmtBig(Math.max(...a.map(Math.abs)))}, too big to index a BIT. Compress them first.` }));
  const dups = dup.filter(Boolean).length;
  frames.push(base({ line: IL.vals, stage: 1,
    say: dups ? `\`set(a)\` keeps one copy of each value. ${dups} repeat${dups > 1 ? "s are" : " is"} dropped, so ${k} distinct values remain.` : `\`set(a)\`: all ${n} values are distinct, so nothing is dropped.` }));
  frames.push(base({ line: IL.vals, stage: 2,
    say: `\`sorted(...)\` puts the ${k} distinct values in order. Only their order matters for comparisons, not their size.` }));
  frames.push(base({ line: IL.rank, stage: 3, vars: [{ k: "k", v: String(k) }],
    say: `\`rank[v] = i + 1\`: the smallest value gets rank 1, the largest gets rank ${k}. Ranks are 1-based because the BIT is 1-indexed.` }));
  frames.push(base({ line: IL.inv0, line2: IL.bit, stage: 3, vars: [{ k: "inv", v: "0" }],
    say: `\`bit = BIT(${k})\` holds one count per rank, all 0. It will answer "how many values seen so far have rank ≤ r?" in O(log k).` }));

  for (let seen = 0; seen < n; seen++) {
    const x = a[seen], r = rank.get(x)!;
    ranks[seen] = r;
    const wrong = Array.from(new Set([r, Math.min(k, r + 1), Math.max(1, r - 1), seen + 1].filter((q) => q >= 1 && q <= k && q !== r))).slice(0, 2);
    const opts = [r, ...wrong].sort((p, q) => p - q);
    const ask: Ask | undefined = seen === 1 || (seen === 3 && n > 4) ? { q: `x = ${fmtBig(x)}. What is \`rank[x]\`?`, options: opts.map(String), answer: opts.indexOf(r), why: `${fmtBig(x)} is number ${r} in the sorted list ${vals.map(fmtBig).join(", ")}.` } : undefined;
    if (ask && frames.length) frames[frames.length - 1].ask = ask;
    frames.push(base({ line: IL.r, line2: IL.loop, seen, r, vars: [{ k: "seen", v: String(seen) }, { k: "x", v: fmtBig(x) }, { k: "r", v: String(r), tone: "accent" }, { k: "inv", v: String(inv) }],
      say: `seen = ${seen}, x = ${fmtBig(x)}. Look it up: \`r = rank[x]\` = ${r}. From now on the BIT only sees ${r}.` }));
    const le = cnt.slice(1, r + 1).reduce((p, q) => p + q, 0);
    const gt = seen - le;
    inv += gt;
    frames.push(base({ line: IL.inv, seen, r, sumR: r, vars: [{ k: "seen", v: String(seen) }, { k: "bit.sum(r)", v: String(le), tone: "good" }, { k: "seen − sum", v: String(gt), tone: "warn" }, { k: "inv", v: String(inv), tone: "accent" }],
      say: seen === 0 ? "Nothing seen yet: `bit.sum(r)` = 0 and seen = 0, so no pairs." : `${seen} value${seen > 1 ? "s" : ""} came before. \`bit.sum(${r})\` = ${le} of them have rank ≤ ${r}. The other ${gt} ${gt === 1 ? "is" : "are"} strictly greater: inv += ${gt} → ${inv}.` }));
    cnt[r] += 1;
    frames.push(base({ line: IL.add, seen, r, addR: r, vars: [{ k: "seen", v: String(seen) }, { k: "r", v: String(r), tone: "accent" }, { k: "inv", v: String(inv) }],
      say: `\`bit.add(${r}, 1)\`: count one more value with rank ${r}. Now the BIT knows ${seen + 1} value${seen ? "s" : ""}.` }));
  }
  frames.push(base({ line: IL.ret, vars: [{ k: "inv", v: String(inv), tone: "good" }], done: true,
    say: `Return ${inv}. Each step was O(log k), so the whole count is O(n log n) instead of checking all ${n * (n - 1) / 2} pairs.` }));
  return { frames, vals };
}
