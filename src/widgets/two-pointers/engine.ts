/**
 * Pure frame builders for the two-pointers lab. Each returns the whole run as a list of frames.
 * No React here: input in, frames out.
 */
import type { Cell, CellTone, Frame, Kv, Pointer, Tone } from "./kit/types";
import { linesFor, pyList, q } from "./kit/util";
import { COMPACT, PAIR_SUM, PALINDROME, THREE_SUM } from "./code";

const ptr = (id: string, at: number | null, moved: boolean, side: "top" | "bottom" = "bottom", label = id): Pointer =>
  ({ id, label, at, side, tone: moved ? "accent" : "neutral" });

/* ------------------------------------------------------------------ pair-sum */

export function pairSumFrames(a: number[], target: number): Frame[] {
  const L = linesFor(PAIR_SUM);
  const n = a.length;
  const F: Frame[] = [];
  const cells = (i: number, j: number, tones: Record<number, CellTone> = {}): Cell[] =>
    a.map((x, k) => ({ id: `c${k}`, text: String(x), tone: tones[k] ?? (k < i || k > j ? "dim" : undefined) }));
  const chips = (i: number, j: number, s?: number, tone?: Tone): Kv[] => [
    { k: "target", v: String(target) },
    { k: "i", v: String(i) },
    { k: "j", v: String(j) },
    ...(s === undefined ? [] : [{ k: "s", v: String(s), tone }]),
  ];

  F.push({
    line: [L("def pair_sum")],
    say: `The array is sorted. Find two values that add up to ${target}.`,
    view: { cells: cells(0, n - 1), pointers: [ptr("i", null, false), ptr("j", null, false)], chips: [{ k: "target", v: String(target) }] },
  });
  let i = 0, j = n - 1;
  F.push({
    line: [L("i, j = 0")],
    say: `Start i at the left end (index 0) and j at the right end (index ${j}).`,
    view: { cells: cells(i, j), pointers: [ptr("i", i, true), ptr("j", j, true)], band: { from: i, to: j, tone: "neutral" }, chips: chips(i, j) },
  });
  while (i < j) {
    const s = a[i] + a[j];
    F.push({
      line: [L("s = a[i] + a[j]")],
      say: `s = a[${i}] + a[${j}] = ${a[i]} + ${a[j]} = ${s}.`,
      view: { cells: cells(i, j, { [i]: "accent", [j]: "accent" }), pointers: [ptr("i", i, false), ptr("j", j, false)], band: { from: i, to: j, tone: "neutral" }, chips: chips(i, j, s) },
    });
    if (s === target) {
      F.push({
        line: [L("if s == target"), L("return i, j")],
        say: `${s} equals the target. Return (${i}, ${j}): ${a[i]} + ${a[j]} = ${target}.`,
        tone: "good",
        view: { cells: cells(i, j, { [i]: "good", [j]: "good" }), pointers: [ptr("i", i, false), ptr("j", j, false)], band: { from: i, to: j, tone: "good" }, chips: chips(i, j, s, "good") },
      });
      return F;
    }
    const small = s < target;
    const pre = { q: `s = ${s} and the target is ${target}. Which pointer moves?`, options: ["i moves right", "j moves left"], answer: small ? 0 : 1 };
    if (small) {
      const dropped = i;
      i++;
      F.push({
        line: [L("if s < target"), L("i += 1")],
        say: `${s} < ${target}, too small. a[${dropped}] = ${a[dropped]} is too small even with the largest value left, so drop it: i moves right.`,
        view: { cells: cells(i, j), pointers: [ptr("i", i, true), ptr("j", j, false)], band: { from: i, to: j, tone: "neutral" }, chips: chips(i, j) },
        predict: { ...pre, why: `The sum is too small. Moving j left can only make it smaller, so only i moving right can help.` },
      });
    } else {
      const dropped = j;
      j--;
      F.push({
        line: [L("else:"), L("j -= 1")],
        say: `${s} > ${target}, too big. a[${dropped}] = ${a[dropped]} is too big even with the smallest value left, so drop it: j moves left.`,
        view: { cells: cells(i, j), pointers: [ptr("i", i, false), ptr("j", j, true)], band: { from: i, to: j, tone: "neutral" }, chips: chips(i, j) },
        predict: { ...pre, why: `The sum is too big. Moving i right can only make it bigger, so only j moving left can help.` },
      });
    }
  }
  F.push({
    line: [L("while i < j"), L("return -1, -1")],
    say: `i and j met, so every pair was ruled out. No pair adds up to ${target}.`,
    tone: "warn",
    view: { cells: cells(i, j), pointers: [ptr("i", i, false), ptr("j", j, false)], chips: chips(i, j) },
  });
  return F;
}

/* ---------------------------------------------------------------- palindrome */

export function palindromeFrames(s: string): Frame[] {
  const L = linesFor(PALINDROME);
  const n = s.length;
  const F: Frame[] = [];
  const alnum = (c: string) => /[a-z0-9]/i.test(c);
  const matched = new Set<number>();
  const cells = (i: number, j: number, tones: Record<number, CellTone> = {}): Cell[] =>
    [...s].map((c, k) => ({
      id: `c${k}`,
      text: c === " " ? "·" : c,
      quiet: !alnum(c),
      tone: tones[k] ?? (matched.has(k) ? "good" : k < i || k > j ? "dim" : undefined),
    }));
  const chips = (i: number, j: number): Kv[] => [
    { k: "i", v: String(i) },
    { k: "j", v: String(j) },
    { k: "s[i]", v: i < n ? q(s[i]) : "-" },
    { k: "s[j]", v: j >= 0 ? q(s[j]) : "-" },
  ];
  F.push({
    line: [L("def is_palindrome")],
    say: `Is "${s}" the same forwards and backwards? Ignore case and anything that is not a letter or digit.`,
    view: { cells: cells(0, n - 1), pointers: [ptr("i", null, false), ptr("j", null, false)], chips: [] },
  });
  let i = 0, j = n - 1;
  F.push({
    line: [L("i, j = 0")],
    say: `Start i at the first character and j at the last one.`,
    view: { cells: cells(i, j), pointers: [ptr("i", i, true), ptr("j", j, true)], band: { from: i, to: j, tone: "neutral" }, chips: chips(i, j) },
  });
  while (i < j) {
    if (!alnum(s[i])) {
      const k = i; i++;
      F.push({
        line: [L("if not s[i].isalnum()"), L("i += 1", 0)],
        say: `s[${k}] = ${q(s[k])} is not a letter or digit. Skip it: i moves right.`,
        view: { cells: cells(i, j), pointers: [ptr("i", i, true), ptr("j", j, false)], band: { from: i, to: j, tone: "neutral" }, chips: chips(i, j) },
      });
    } else if (!alnum(s[j])) {
      const k = j; j--;
      F.push({
        line: [L("elif not s[j].isalnum()"), L("j -= 1", 0)],
        say: `s[${k}] = ${q(s[k])} is not a letter or digit. Skip it: j moves left.`,
        view: { cells: cells(i, j), pointers: [ptr("i", i, false), ptr("j", j, true)], band: { from: i, to: j, tone: "neutral" }, chips: chips(i, j) },
      });
    } else if (s[i].toLowerCase() !== s[j].toLowerCase()) {
      F.push({
        line: [L("elif s[i].lower()"), L("return False")],
        say: `${q(s[i])} and ${q(s[j])} are different. It is not a palindrome: return False.`,
        tone: "bad",
        view: { cells: cells(i, j, { [i]: "bad", [j]: "bad" }), pointers: [ptr("i", i, false), ptr("j", j, false)], band: { from: i, to: j, tone: "bad" }, chips: chips(i, j) },
        predict: { q: `s[i] = ${q(s[i])} and s[j] = ${q(s[j])}. What happens?`, options: ["They match: both move inward", "They differ: return False"], answer: 1, why: `${q(s[i].toLowerCase())} is not ${q(s[j].toLowerCase())}, and one mismatch is enough to stop.` },
      });
      return F;
    } else {
      const a = i, b = j;
      matched.add(a); matched.add(b);
      i++; j--;
      F.push({
        line: [L("else:"), L("i += 1", 1), L("j -= 1", 1)],
        say: `${q(s[a])} and ${q(s[b])} match (case ignored). Move both inward.`,
        view: { cells: cells(i, j), pointers: [ptr("i", i, true), ptr("j", j, true)], band: i <= j ? { from: i, to: j, tone: "neutral" } : null, chips: chips(i, j) },
        predict: { q: `s[i] = ${q(s[a])} and s[j] = ${q(s[b])}. What happens?`, options: ["They match: both move inward", "They differ: return False"], answer: 0, why: `Ignoring case, ${q(s[a].toLowerCase())} equals ${q(s[b].toLowerCase())}.` },
      });
    }
  }
  F.push({
    line: [L("while i < j"), L("return True")],
    say: i === j ? `i and j meet in the middle. Every pair matched: return True.` : `i passed j. Every pair matched: return True.`,
    tone: "good",
    view: { cells: cells(i, j), pointers: [ptr("i", i < n ? i : null, false), ptr("j", j >= 0 ? j : null, false)], chips: chips(Math.min(i, n - 1), Math.max(j, 0)) },
  });
  return F;
}

/* ----------------------------------------------------------------- three-sum */

export function threeSumFrames(input: number[]): Frame[] {
  const L = linesFor(THREE_SUM);
  const items = input.map((x, k) => ({ x, id: `c${k}` }));
  const sorted = [...items].sort((p, r) => p.x - r.x);
  const v = sorted.map((p) => p.x);
  const n = v.length;
  const res: number[][] = [];
  const F: Frame[] = [];
  const results = () => ({ title: "res", items: res.map((t) => pyList(t)), empty: "No triples yet" });
  const cells = (i: number, lo: number | null, hi: number | null, tones: Record<number, CellTone> = {}): Cell[] =>
    sorted.map((p, k) => ({
      id: p.id,
      text: String(p.x),
      tone: tones[k] ?? (k < i ? "faint" : lo !== null && hi !== null && k > i && (k < lo || k > hi) ? "dim" : undefined),
    }));
  const ptrs = (i: number | null, lo: number | null, hi: number | null, moved: string[] = []): Pointer[] => [
    ptr("i", i, moved.includes("i"), "top"),
    ptr("lo", lo, moved.includes("lo")),
    ptr("hi", hi, moved.includes("hi")),
  ];
  const chips = (i: number, s?: number, tone?: Tone): Kv[] => [
    { k: "nums[i]", v: String(v[i]) },
    { k: "need", v: String(-v[i]) },
    ...(s === undefined ? [] : [{ k: "s", v: String(s), tone }]),
  ];

  F.push({
    line: [L("def three_sum")],
    say: `Find every triple that sums to 0, with no repeated triple.`,
    view: { cells: items.map((p) => ({ id: p.id, text: String(p.x) })), pointers: ptrs(null, null, null), chips: [], results: results() },
  });
  F.push({
    line: [L("nums.sort()")],
    say: `Sort first. Now equal values sit next to each other, and the sum tells you which pointer to move.`,
    view: { cells: cells(0, null, null), pointers: ptrs(null, null, null), chips: [], results: results() },
  });
  for (let i = 0; i < n - 2; i++) {
    if (i > 0 && v[i] === v[i - 1]) {
      F.push({
        line: [L("if i > 0 and"), L("continue")],
        say: `nums[${i}] = ${v[i]} is the same as nums[${i - 1}]. Skip it, or the same triples come out again.`,
        tone: "warn",
        view: { cells: cells(i, null, null, { [i]: "warn", [i - 1]: "faint" }), pointers: ptrs(i, null, null, ["i"]), chips: chips(i), results: results() },
        predict: { q: `nums[${i}] = ${v[i]} equals nums[${i - 1}]. What does the loop do?`, options: ["Search again with this i", "Skip this i"], answer: 1, why: `Every triple that starts with ${v[i]} was already found with i = ${i - 1}.` },
      });
      continue;
    }
    F.push({
      line: [L("for i in range")],
      say: `Fix i = ${i} (nums[i] = ${v[i]}). Now find two values to its right that sum to ${-v[i]}.`,
      view: { cells: cells(i, null, null, { [i]: "accent" }), pointers: ptrs(i, null, null, ["i"]), chips: chips(i), results: results() },
    });
    let lo = i + 1, hi = n - 1;
    F.push({
      line: [L("lo, hi = i + 1")],
      say: `lo starts just right of i, hi starts at the end.`,
      view: { cells: cells(i, lo, hi), pointers: ptrs(i, lo, hi, ["lo", "hi"]), band: { from: lo, to: hi, tone: "neutral" }, chips: chips(i), results: results() },
    });
    while (lo < hi) {
      const s = v[i] + v[lo] + v[hi];
      F.push({
        line: [L("s = nums[i] + nums[lo]")],
        say: `s = ${v[i]} + ${v[lo]} + ${v[hi]} = ${s}.`,
        view: { cells: cells(i, lo, hi, { [lo]: "accent", [hi]: "accent" }), pointers: ptrs(i, lo, hi), band: { from: lo, to: hi, tone: "neutral" }, chips: chips(i, s), results: results() },
      });
      const pre = { q: `s = ${s}. What happens next?`, options: ["lo moves right", "hi moves left", "Record the triple"], answer: s < 0 ? 0 : s > 0 ? 1 : 2 };
      if (s < 0) {
        lo++;
        F.push({
          line: [L("if s < 0"), L("lo += 1", 0)],
          say: `${s} < 0, too small. Move lo right to a bigger value.`,
          view: { cells: cells(i, lo, hi), pointers: ptrs(i, lo, hi, ["lo"]), band: { from: lo, to: hi, tone: "neutral" }, chips: chips(i), results: results() },
          predict: { ...pre, why: `The sum is below 0. Only a bigger value at lo can raise it.` },
        });
      } else if (s > 0) {
        hi--;
        F.push({
          line: [L("elif s > 0"), L("hi -= 1", 0)],
          say: `${s} > 0, too big. Move hi left to a smaller value.`,
          view: { cells: cells(i, lo, hi), pointers: ptrs(i, lo, hi, ["hi"]), band: { from: lo, to: hi, tone: "neutral" }, chips: chips(i), results: results() },
          predict: { ...pre, why: `The sum is above 0. Only a smaller value at hi can lower it.` },
        });
      } else {
        const t = [v[i], v[lo], v[hi]];
        res.push(t);
        F.push({
          line: [L("else:"), L("res.append")],
          say: `The sum is 0. Record ${pyList(t)}.`,
          tone: "good",
          view: { cells: cells(i, lo, hi, { [i]: "good", [lo]: "good", [hi]: "good" }), pointers: ptrs(i, lo, hi), band: { from: lo, to: hi, tone: "good" }, chips: chips(i, s, "good"), results: results() },
          predict: { ...pre, why: `The sum is exactly 0, so record it first. Skip duplicates only after recording.` },
        });
        lo++; hi--;
        F.push({
          line: [L("lo += 1", 1), L("hi -= 1", 1)],
          say: `Move both pointers inward to look for more triples with this i.`,
          view: { cells: cells(i, lo, hi), pointers: ptrs(i, lo, hi, ["lo", "hi"]), band: lo <= hi ? { from: lo, to: hi, tone: "neutral" } : null, chips: chips(i), results: results() },
        });
        while (lo < hi && v[lo] === v[lo - 1]) {
          lo++;
          F.push({
            line: [L("while lo < hi and nums[lo]"), L("lo += 1", 2)],
            say: `nums[${lo - 1}] = ${v[lo - 1]} is the same as the value just used. Skip it: lo moves right.`,
            tone: "warn",
            view: { cells: cells(i, lo, hi, { [lo - 1]: "warn" }), pointers: ptrs(i, lo, hi, ["lo"]), band: { from: lo, to: hi, tone: "neutral" }, chips: chips(i), results: results() },
          });
        }
      }
    }
    F.push({
      line: [L("while lo < hi:")],
      say: `lo and hi met. Done with i = ${i}.`,
      view: { cells: cells(i, lo, hi), pointers: ptrs(i, lo < n ? lo : null, hi > i ? hi : null), chips: chips(i), results: results() },
    });
  }
  F.push({
    line: [L("return res")],
    say: res.length ? `Done. Found ${res.length} unique ${res.length === 1 ? "triple" : "triples"}.` : `Done. No triple sums to 0.`,
    tone: res.length ? "good" : "warn",
    view: { cells: cells(0, null, null), pointers: ptrs(null, null, null), chips: [{ k: "triples", v: String(res.length), tone: res.length ? "good" : "warn" }], results: results() },
  });
  return F;
}

/* ------------------------------------------------------------ same-direction */

export function compactFrames(input: number[]): Frame[] {
  const L = linesFor(COMPACT);
  const a = [...input];
  const n = a.length;
  const F: Frame[] = [];
  const cells = (w: number, r: number | null, tones: Record<number, CellTone> = {}): Cell[] =>
    a.map((x, k) => ({ id: `c${k}`, text: String(x), tone: tones[k] ?? (k < w ? "good" : r !== null && k < r ? "faint" : undefined) }));
  const chips = (w: number, r: number | null): Kv[] => [
    { k: "w (slow)", v: String(w) },
    { k: "r (fast)", v: r === null ? "-" : String(r) },
    { k: "kept", v: w ? pyList(a.slice(0, w)) : "[]" },
  ];
  const band = (w: number) => (w > 0 ? { from: 0, to: w - 1, tone: "good" as Tone } : null);

  F.push({
    line: [L("def compact")],
    say: `The array is sorted. Keep one copy of each value, in place, with O(1) extra space.`,
    view: { cells: cells(0, null), pointers: [ptr("w", null, false, "top"), ptr("r", null, false)], chips: [] },
  });
  let w = 0;
  F.push({
    line: [L("w = 0")],
    say: `w is the write spot (slow pointer). r will read every element (fast pointer).`,
    view: { cells: cells(w, null), pointers: [ptr("w", 0, true, "top"), ptr("r", null, false)], chips: chips(w, null) },
  });
  for (let r = 0; r < n; r++) {
    const keep = w === 0 || a[r] !== a[w - 1];
    const why = w === 0 ? `Nothing is kept yet, so a[0] = ${a[r]} is new.` : keep ? `a[${r}] = ${a[r]} differs from the last kept value ${a[w - 1]}, so it is new.` : `a[${r}] = ${a[r]} equals the last kept value ${a[w - 1]}: a copy. Skip it.`;
    F.push({
      line: [L("for r in range"), L("if w == 0 or")],
      say: why,
      tone: keep ? undefined : "warn",
      view: { cells: cells(w, r, { [r]: keep ? "accent" : "warn", ...(w > 0 ? { [w - 1]: "good" } : {}) }), pointers: [ptr("w", w < n ? w : null, false, "top"), ptr("r", r, true)], band: band(w), chips: chips(w, r) },
      predict: w === 0 ? undefined : { q: `a[r] = ${a[r]} and the last kept value a[w - 1] = ${a[w - 1]}. Keep it?`, options: ["Keep: write it at a[w]", "Skip: it is a copy"], answer: keep ? 0 : 1, why: keep ? `The array is sorted, so a value different from the last kept one has never been kept.` : `It equals the last kept value, and in a sorted array copies sit next to each other.` },
    });
    if (keep) {
      const from = a[w];
      a[w] = a[r];
      w++;
      F.push({
        line: [L("a[w] = a[r]"), L("w += 1")],
        say: w - 1 === r ? `Write a[${r}] = ${a[r]} into a[${w - 1}] (same spot), then w moves to ${w}.` : `Write ${a[r]} into a[${w - 1}] (it held ${from}), then w moves to ${w}.`,
        view: { cells: cells(w, r, { [w - 1]: "accent" }), pointers: [ptr("w", w < n ? w : null, true, "top"), ptr("r", r, false)], band: band(w), chips: chips(w, r) },
      });
    }
  }
  F.push({
    line: [L("return w")],
    say: `New length is ${w}: ${pyList(a.slice(0, w))}. Values after index ${w - 1} no longer matter.`,
    tone: "good",
    view: { cells: cells(w, n), pointers: [ptr("w", w < n ? w : null, false, "top"), ptr("r", null, false)], band: band(w), chips: chips(w, null) },
  });
  return F;
}
