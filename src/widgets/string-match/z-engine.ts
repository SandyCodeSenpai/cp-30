/** Z-function with the [l, r) box. Pure frames. */
import type { BaseFrame } from "../range-query/kit/player";
import { ZL } from "./code";

export interface ZFrame extends BaseFrame {
  z: (number | null)[];
  i: number | null;
  zi: number;                 // current z[i] (matched length so far)
  known: number;              // part of z[i] copied from the box (not compared)
  l: number; r: number;       // box s[l:r] == s[0:r-l]
  cmp?: "eq" | "ne" | "end";  // last comparison s[zi] vs s[i + zi]
  copy?: { from: number; capped: boolean };  // z[i] taken from z[i - l]
  moved?: boolean;            // box moved in this frame
  vars: { k: string; v: string; tone?: "accent" | "good" | "warn" | "bad" }[];
  done?: boolean;
}

export function zFrames(s: string): ZFrame[] {
  const n = s.length;
  const z: (number | null)[] = new Array(n).fill(null);
  z[0] = 0;
  let l = 0, r = 0;
  const frames: ZFrame[] = [];
  const q = (c: string) => `'${c}'`;
  const base = (o: Partial<ZFrame>): ZFrame => ({ line: 0, say: "", z: [...z], i: null, zi: 0, known: 0, l, r, vars: [], ...o });
  const box = () => ({ k: "[l, r)", v: `[${l}, ${r})` });

  frames.push(base({ line: ZL.init, vars: [box()],
    say: `z[i] = how many characters of s[i:] match the start of s. z[0] is left as 0. The box [l, r) remembers the match that reaches furthest right.` }));
  let compares = 0;
  for (let i = 1; i < n; i++) {
    let zi = 0, known = 0;
    if (i < r) {
      const from = i - l, cand = z[from]!, cap = r - i;
      zi = Math.min(cap, cand); known = zi;
      frames[frames.length - 1].ask = {
        q: `i = ${i} is inside the box [${l}, ${r}). What does z[i] start at?`,
        options: Array.from(new Set([zi, 0, cand + 1 <= n - i ? cand + 1 : cap + 1])).sort((a, b) => a - b).map(String),
        answer: -1, why: `min(r − i, z[i − l]) = min(${cap}, z[${from}] = ${cand}) = ${zi}. Those characters are known to match without comparing.`,
      };
      const a = frames[frames.length - 1].ask!; a.answer = a.options.indexOf(String(zi));
      frames.push(base({ line: ZL.copy, line2: ZL.inBox, i, zi, known, copy: { from, capped: cap < cand }, vars: [{ k: "i", v: String(i), tone: "accent" }, box(), { k: "z[i]", v: String(zi), tone: "good" }],
        say: `i = ${i} is inside the box, and s[${l}:${r}] equals s[0:${r - l}]. So s[${i}:] starts like s[${from}:]. Copy z[${from}] = ${cand}${cap < cand ? `, but cap it at r − i = ${cap}: past r we know nothing` : ""}. z[${i}] = ${zi}.` }));
    } else {
      frames.push(base({ line: ZL.inBox, i, zi, vars: [{ k: "i", v: String(i), tone: "accent" }, box(), { k: "z[i]", v: "0" }],
        say: `i = ${i} is not inside the box (r = ${r}), so nothing is known. Start at z[${i}] = 0 and compare.` }));
    }
    while (i + zi < n && s[zi] === s[i + zi]) {
      zi += 1; compares++;
      frames.push(base({ line: ZL.inc, line2: ZL.while, i, zi, known, cmp: "eq", vars: [{ k: "i", v: String(i), tone: "accent" }, box(), { k: "z[i]", v: String(zi), tone: "good" }],
        say: `s[${zi - 1}] = ${q(s[zi - 1])} matches s[${i + zi - 1}]: z[${i}] = ${zi}.` }));
    }
    const end = i + zi >= n;
    if (!end) compares++;
    z[i] = zi;
    const moved = i + zi > r;
    const why = end ? "the string ends" : `s[${zi}] = ${q(s[zi])} ≠ s[${i + zi}] = ${q(s[i + zi])}`;
    if (moved) { l = i; r = i + zi; }
    frames.push(base({ line: moved ? ZL.move : ZL.ifBox, line2: ZL.while, i, zi, known, cmp: end ? "end" : "ne", moved, vars: [{ k: "i", v: String(i), tone: "accent" }, box(), { k: `z[${i}]`, v: String(zi), tone: "good" }],
      say: `Stop: ${why}. z[${i}] = ${zi}. ` + (moved ? `This match reaches ${r}, further than before, so the box moves to [${l}, ${r}).` : zi ? `It does not reach past r = ${r}, so the box stays.` : `The box stays [${l}, ${r}).`) }));
  }
  frames.push(base({ line: ZL.ret, done: true, vars: [{ k: "z", v: `[${z.join(", ")}]`, tone: "good" }],
    say: `Done. Every successful compare pushes r right, and r never moves back, so the whole Z array costs O(n): ${compares} compares for n = ${n}.` }));
  return frames;
}
