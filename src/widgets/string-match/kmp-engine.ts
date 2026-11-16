/** KMP via the prefix function of pat + "\x00" + text (find_all). Pure frames. */
import type { Ask, BaseFrame } from "../range-query/kit/player";
import { KL } from "./code";

export const SEP = "\u0000";

export interface KmpFrame extends BaseFrame {
  pi: (number | null)[];      // pi over s = pat + SEP + text
  i: number | null;
  k: number | null;           // the prefix length being tried; s[k] is compared with s[i]
  cmp?: "eq" | "ne";          // result of comparing s[i] and s[k] in this frame
  arc?: { from: number; to: number; via: number };  // fallback k -> pi[k-1] (via = k - 1)
  matches: number[];          // match starts in text found so far
  newMatch?: number;
  vars: { k: string; v: string; tone?: "accent" | "good" | "warn" | "bad" }[];
  done?: boolean;
}

export const showCh = (c: string) => (c === SEP ? "\\0" : c);

export function kmpFrames(text: string, pat: string): { s: string; frames: KmpFrame[] } {
  const m = pat.length, s = pat + SEP + text, N = s.length;
  const pi: (number | null)[] = new Array(N).fill(null);
  pi[0] = 0;
  const frames: KmpFrame[] = [];
  const matches: number[] = [];
  const q = (c: string) => `'${showCh(c)}'`;
  const base = (o: Partial<KmpFrame>): KmpFrame => ({ line: 0, say: "", pi: [...pi], i: null, k: null, matches: [...matches], vars: [], ...o });
  const where = (i: number) => (i < m ? `pattern` : i === m ? "separator" : `text[${i - m - 1}]`);

  frames.push(base({ line: KL.call, line2: KL.m, vars: [{ k: "m", v: String(m) }, { k: "len(s)", v: String(N) }],
    say: `Glue the strings: s = pat + "\\x00" + text (${N} characters). The separator never matches, so no prefix can run past the pattern. pi[0] = 0 always.` }));

  for (let i = 1; i < N; i++) {
    let k = pi[i - 1]!;
    const phase = i < m ? "Inside the pattern" : i === m ? "At the separator" : `In the text`;
    frames.push(base({ line: KL.kInit, line2: KL.for, i, k, vars: [{ k: "i", v: String(i), tone: "accent" }, { k: "k", v: String(k), tone: "accent" }],
      say: `${phase}: i = ${i}${i > m ? ` (${where(i)})` : ""}. Reuse the last answer: k = pi[${i - 1}] = ${k}${k ? `, so s[0:${k}] already matches the ${k === 1 ? "character" : `${k} characters`} before i` : ""}. Compare s[${i}] = ${q(s[i])} with s[${k}] = ${q(s[k])}.` }));
    while (k && s[i] !== s[k]) {
      const nk = pi[k - 1]!;
      // Predict: ask where k falls back to, on the frame before the fallback.
      const opts = Array.from(new Set([nk, 0, k - 1])).sort((a, b) => a - b);
      if (opts.length >= 2) frames[frames.length - 1].ask = {
        q: `s[${i}] = ${q(s[i])} does not match s[${k}] = ${q(s[k])}. What is k next?`, options: opts.map((o) => `k = ${o}`), answer: opts.indexOf(nk),
        why: `k = pi[k − 1] = pi[${k - 1}] = ${nk}. That is the longest shorter prefix that still matches, so we never re-read the text.`,
      } satisfies Ask;
      frames.push(base({ line: KL.fall, line2: KL.while, i, k: nk, cmp: "ne", arc: { from: k, to: nk, via: k - 1 },
        vars: [{ k: "i", v: String(i), tone: "accent" }, { k: "k", v: `${k} → ${nk}`, tone: "warn" }],
        say: `${q(s[i])} ≠ ${q(s[k])}, so fall back: k = pi[${k - 1}] = ${nk}, not 0. The pattern slides right by ${k - nk}; ${nk === 0 ? "nothing of it matches now" : nk === 1 ? "its first character still matches" : `its first ${nk} characters still match`}.` }));
      k = nk;
    }
    const eq = s[i] === s[k];
    if (eq) k += 1;
    pi[i] = k;
    let newMatch: number | undefined;
    if (k === m && i > m) { newMatch = i - 2 * m; matches.push(newMatch); }
    frames.push(base({ line: KL.set, line2: eq ? KL.inc : KL.if, i, k: eq ? k - 1 : k, cmp: eq ? "eq" : "ne", newMatch,
      vars: [{ k: "i", v: String(i), tone: "accent" }, { k: `pi[${i}]`, v: String(k), tone: newMatch !== undefined ? "good" : undefined }],
      say: (eq ? `${q(s[i])} = ${q(s[k - 1])}: k += 1. pi[${i}] = ${k}.` : `${q(s[i])} ≠ ${q(s[k])} and k = 0: nothing matches. pi[${i}] = 0.`)
        + (newMatch !== undefined ? ` pi = m = ${m}: the whole pattern ends here. Match at text index ${i} − 2·${m} = ${newMatch}.` : i === m ? " The separator matches nothing, so the pattern part is sealed off." : "") }));
  }
  frames.push(base({ line: KL.findRet, matches, done: true, vars: [{ k: "matches", v: `[${matches.join(", ")}]`, tone: "good" }],
    say: matches.length ? `Every pi[i] = ${m} marks a match end. Starts: ${matches.join(", ")}. Each character is compared O(1) times on average: O(n + m).` : `No pi[i] reaches ${m}, so the pattern does not occur. Still only O(n + m) work.` }));
  return { s, frames };
}
