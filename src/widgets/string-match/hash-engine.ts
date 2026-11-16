/** Polynomial rolling hash with prefix hashes (build + sub_hash), then scan windows and confirm. Pure frames. */
import type { BaseFrame } from "../range-query/kit/player";
import { HL } from "./code";

export interface HashCfg { B: bigint; M: bigint; demo: boolean }
export const DEMO: HashCfg = { B: 31n, M: 101n, demo: true };
export const REAL_M = (1n << 61n) - 1n;

export interface HashFrame extends BaseFrame {
  h: (bigint | null)[];           // prefix hashes of text, h[0..n]
  pw: (bigint | null)[];
  built: number;                  // characters hashed so far
  win: number | null;             // window start l
  target: bigint | null;
  formula?: string[];             // lines of arithmetic with numbers
  verdict?: "skip" | "equal" | "match" | "collision";
  matches: number[];
  collisions: number[];
  vars: { k: string; v: string; tone?: "accent" | "good" | "warn" | "bad" }[];
  done?: boolean;
}

const mod = (a: bigint, m: bigint) => ((a % m) + m) % m;
export const fmtH = (v: bigint | null) => (v === null ? "" : v.toString());

export function hashFrames(text: string, pat: string, cfg: HashCfg): HashFrame[] {
  const { B, M } = cfg, n = text.length, m = pat.length;
  const h: (bigint | null)[] = new Array(n + 1).fill(null), pw: (bigint | null)[] = new Array(n + 1).fill(null);
  h[0] = 0n; pw[0] = 1n;
  const frames: HashFrame[] = [];
  const matches: number[] = [], collisions: number[] = [];
  let target: bigint | null = null;
  const Ms = cfg.demo ? M.toString() : "M";
  const base = (o: Partial<HashFrame>): HashFrame => ({ line: 0, say: "", h: [...h], pw: [...pw], built: 0, win: null, target, matches: [...matches], collisions: [...collisions], vars: [], ...o });

  frames.push(base({ line: HL.hb, line2: HL.init, vars: [{ k: "B", v: B.toString() }, { k: "M", v: cfg.demo ? M.toString() : "2^61 − 1" }],
    say: cfg.demo ? `Read the text as a number in base B = ${B}, mod M = ${M}. Small numbers so you can check the math. h[i] is the hash of text[:i]; h[0] = 0.`
      : `Real numbers: M = 2^61 − 1 and a random B. h[i] is the hash of text[:i]; h[0] = 0.` }));
  for (let i = 0; i < n; i++) {
    const c = BigInt(text.charCodeAt(i));
    h[i + 1] = mod(h[i]! * B + c, M);
    pw[i + 1] = mod(pw[i]! * B, M);
    frames.push(base({ line: HL.h, line2: HL.pw, built: i + 1,
      formula: [`h[${i + 1}] = (h[${i}] · B + ord('${text[i]}')) mod ${Ms}`, `     = (${h[i]} · ${B} + ${c}) mod ${Ms}`, `     = ${h[i + 1]}`],
      vars: [{ k: "i", v: String(i), tone: "accent" }, { k: `h[${i + 1}]`, v: fmtH(h[i + 1]), tone: "good" }, { k: `pw[${i + 1}]`, v: fmtH(pw[i + 1]) }],
      say: `Shift the old hash one place left (times B) and add the new character code ord('${text[i]}') = ${c}. h[${i + 1}] = ${cfg.demo ? h[i + 1] : "a 61-bit number"}.` }));
  }
  // pattern hash
  let ph = 0n;
  for (const ch of pat) ph = mod(ph * B + BigInt(ch.charCodeAt(0)), M);
  target = ph;
  const terms = pat.split("").map((ch, j) => `${ch.charCodeAt(0)}·B^${m - 1 - j}`).join(" + ");
  frames.push(base({ line: HL.target, built: n, target,
    formula: [`hash("${pat}") = (${terms}) mod ${Ms}`, `     = ${ph}`],
    vars: [{ k: "target", v: fmtH(ph), tone: "accent" }],
    say: `Hash the pattern the same way: target = ${cfg.demo ? ph : "one 61-bit number"}. Now slide a window of length ${m} and compare one number per window.` }));

  const pm = pw[m]!;
  for (let l = 0; l + m <= n; l++) {
    const r = l + m, hv = mod(h[r]! - h[l]! * pm, M);
    const eq = hv === target;
    const formula = [`sub_hash(${l}, ${r}) = (h[${r}] − h[${l}] · pw[${m}]) mod ${Ms}`, `     = (${h[r]} − ${h[l]} · ${pm}) mod ${Ms}`, `     = ${hv}   ${eq ? "=" : "≠"} target ${target}`];
    frames.push(base({ line: HL.cmp, line2: HL.loop, built: n, win: l, formula, verdict: eq ? "equal" : "skip",
      vars: [{ k: "l", v: String(l), tone: "accent" }, { k: "hash", v: fmtH(hv), tone: eq ? "good" : undefined }, { k: "target", v: fmtH(target) }],
      say: eq ? `Window ${l}: the hash equals the target. Equal hashes mean "probably equal", so confirm with a real compare.` : `Window ${l}: ${cfg.demo ? `${hv} ≠ ${target}` : "the hashes differ"}, so text[${l}:${r}] cannot be the pattern. One O(1) check, no character compares.` }));
    if (eq) {
      const real = text.slice(l, r) === pat;
      frames[frames.length - 1].ask = { q: `The hashes are equal. Is text[${l}:${r}] = "${text.slice(l, r)}" surely the pattern?`, options: ["Yes, equal hash means equal string", "Not until we compare the characters"], answer: 1,
        why: `Different strings can share a hash (a collision). With M = ${cfg.demo ? M : "2^61 − 1"} that is ${cfg.demo ? "likely" : "rare"}, so the template confirms.` };
      if (real) matches.push(l); else collisions.push(l);
      frames.push(base({ line: real ? HL.print : HL.confirm, line2: HL.confirm, built: n, win: l, formula, verdict: real ? "match" : "collision",
        vars: [{ k: "l", v: String(l), tone: "accent" }, { k: `text[${l}:${r}]`, v: `"${text.slice(l, r)}"`, tone: real ? "good" : "bad" }],
        say: real ? `"${text.slice(l, r)}" = "${pat}": a real match at ${l}. print(${l}).` : `"${text.slice(l, r)}" ≠ "${pat}": a collision. The hashes matched by chance. The confirm step saved us. A huge M makes this very unlikely.` }));
    }
  }
  frames.push(base({ line: HL.loop, built: n, done: true,
    vars: [{ k: "matches", v: `[${matches.join(", ")}]`, tone: "good" }, ...(collisions.length ? [{ k: "collisions", v: `[${collisions.join(", ")}]`, tone: "bad" as const }] : [])],
    say: `Done: ${n - m + 1} windows, each O(1) after an O(n) build. Matches: ${matches.length ? matches.join(", ") : "none"}${collisions.length ? `. Collisions caught: ${collisions.length}` : ""}.` }));
  return frames;
}

/** A random base in [10^6, M - 2], like random.randrange(10**6, M - 1). */
export function randomBase(): bigint {
  const hi = BigInt(Math.floor(Math.random() * 2 ** 29)), lo = BigInt(Math.floor(Math.random() * 2 ** 32));
  const v = (hi << 32n) | lo;
  return 1_000_000n + (v % (REAL_M - 1n - 1_000_000n));
}
