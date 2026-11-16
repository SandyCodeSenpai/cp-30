/**
 * Pure frame builders for the sliding-window lab. Input in, the whole run out as frames.
 */
import type { Band, Cell, CellTone, Frame, Kv, Pointer, Tone } from "../two-pointers/kit/types";
import { choices, linesFor, q, tonesBy } from "../two-pointers/kit/util";
import { FIXED, LONGEST_COUNT, LONGEST_LAST, SHORTEST } from "./code";

const ptr = (id: string, label: string, at: number | null, moved: boolean, side: "top" | "bottom" = "bottom"): Pointer =>
  ({ id, label, at, side, tone: moved ? "accent" : "neutral" });
const win = (from: number, to: number, tone: Tone = "accent"): Band | null => (to >= from ? { from, to, tone } : null);
const sumText = (xs: number[]) => xs.map((x, i) => (i === 0 ? String(x) : x < 0 ? `- ${-x}` : `+ ${x}`)).join(" ");

/* -------------------------------------------------------------------- fixed */

export function fixedFrames(a: number[], k: number): Frame[] {
  const L = linesFor(FIXED);
  const n = a.length;
  const F: Frame[] = [];
  const cells = (l: number, r: number, tones: Record<number, CellTone> = {}): Cell[] =>
    a.map((x, i) => ({ id: `c${i}`, text: String(x), tone: tones[i] ?? (i < l || i > r ? "faint" : undefined) }));
  const chips = (cur: number | null, best: number | null, curTone?: Tone, bestTone?: Tone): Kv[] => [
    { k: "k", v: String(k) },
    { k: "cur", v: cur === null ? "-" : String(cur), tone: curTone },
    { k: "best", v: best === null ? "-" : String(best), tone: bestTone },
  ];

  F.push({
    line: [L("def max_window_sum")],
    say: `Find the largest sum of ${k} values in a row. Each window shares ${k - 1} values with the next one.`,
    view: { cells: cells(0, n - 1), pointers: [ptr("i", "i", null, false)], chips: chips(null, null) },
  });
  let cur = a.slice(0, k).reduce((s, x) => s + x, 0);
  F.push({
    line: [L("cur = sum(a[:k])")],
    say: `First window a[0..${k - 1}]: cur = ${sumText(a.slice(0, k))} = ${cur}.`,
    view: { cells: cells(0, k - 1), pointers: [ptr("i", "i", null, false)], band: win(0, k - 1), chips: chips(cur, null, "accent") },
  });
  let best = cur, bestL = 0;
  F.push({
    line: [L("best = cur")],
    say: `best = ${best}, the only window seen so far.`,
    view: { cells: cells(0, k - 1), pointers: [ptr("i", "i", null, false)], band: win(0, k - 1), ghost: win(0, k - 1, "good"), chips: chips(cur, best, undefined, "good") },
  });
  for (let i = k; i < n; i++) {
    const old = cur;
    cur += a[i] - a[i - k];
    const l = i - k + 1;
    const pc = choices(`cur = ${cur}`, [`cur = ${old + a[i]}`, `cur = ${old - a[i - k]}`, `cur = ${cur + 2 * a[i - k]}`], i);
    F.push({
      line: [L("for i in range"), L("cur += a[i] - a[i - k]")],
      say: `Add a[${i}] = ${a[i]}, drop a[${i - k}] = ${a[i - k]}: cur = ${old} + ${a[i]} - ${a[i - k]} = ${cur}.`.replace(/\+ -(\d)/g, "- $1").replace(/- -(\d)/g, "+ $1"),
      view: {
        cells: cells(l, i, { [i]: "accent", [i - k]: "dim" }),
        pointers: [ptr("drop", "i - k", i - k, false, "top"), ptr("i", "i", i, true)],
        band: win(l, i), ghost: win(bestL, bestL + k - 1, "good"), chips: chips(cur, best, "accent"),
      },
      predict: { q: `The window slides one step right. What is cur now?`, ...pc, why: `Only two values change: a[${i}] = ${a[i]} comes in and a[${i - k}] = ${a[i - k]} goes out. ${old} + ${a[i]} - ${a[i - k]} = ${cur}.`.replace(/\+ -(\d)/g, "- $1").replace(/- -(\d)/g, "+ $1") },
    });
    const better = cur > best;
    const prev = best;
    if (better) { best = cur; bestL = l; }
    F.push({
      line: [L("best = max(best, cur)")],
      say: better ? `best = max(${prev}, ${cur}) = ${best}. A new best window.` : `best = max(${prev}, ${cur}) = ${best}. No change.`,
      tone: better ? "good" : undefined,
      view: { cells: cells(l, i), pointers: [ptr("drop", "i - k", null, false, "top"), ptr("i", "i", i, false)], band: win(l, i), ghost: win(bestL, bestL + k - 1, "good"), chips: chips(cur, best, undefined, better ? "good" : undefined) },
    });
  }
  F.push({
    line: [L("return best")],
    say: `The best window is a[${bestL}..${bestL + k - 1}] with sum ${best}. Each step was O(1), so the whole scan is O(n).`,
    tone: "good",
    view: { cells: cells(bestL, bestL + k - 1, tonesBy<CellTone>(n, (i) => (i >= bestL && i < bestL + k ? "good" : "faint"))), pointers: [ptr("i", "i", null, false)], band: win(bestL, bestL + k - 1, "good"), chips: chips(cur, best, undefined, "good") },
  });
  return F;
}

/* ------------------------------------------------------------ longest: count */

export function longestCountFrames(s: string): Frame[] {
  const L = linesFor(LONGEST_COUNT);
  const n = s.length;
  const F: Frame[] = [];
  const count = new Map<string, number>();
  const disp = (c: string) => (c === " " ? "·" : c);
  const mapView = (bad?: string) => ({
    title: "count",
    entries: [...count.entries()].filter(([, v]) => v > 0).map(([k, v]) => ({ k: q(disp(k)), v: String(v), tone: (k === bad && v > 1 ? "bad" : undefined) as Tone | undefined })),
    empty: "empty",
  });
  const cells = (l: number, r: number, tones: Record<number, CellTone> = {}): Cell[] =>
    [...s].map((c, i) => ({ id: `c${i}`, text: disp(c), tone: tones[i] ?? (i < l || i > r ? "faint" : undefined) }));
  const chips = (l: number, r: number, best: number, bestTone?: Tone): Kv[] => [
    { k: "length", v: String(Math.max(0, r - l + 1)) },
    { k: "best", v: String(best), tone: bestTone },
  ];
  const ptrs = (l: number | null, r: number | null, moved: string[] = []) => [ptr("left", "left", l, moved.includes("left")), ptr("right", "right", r, moved.includes("right"))];

  F.push({
    line: [L("def longest_window")],
    say: `Find the longest part of "${s}" with no repeated character.`,
    view: { cells: cells(0, n - 1), pointers: ptrs(null, null), chips: [], map: mapView() },
  });
  let left = 0, best = 0, bestL = 0, bestR = -1;
  F.push({
    line: [L("count = defaultdict"), L("left = best = 0")],
    say: `Start with an empty window. count[c] says how many times c is inside it.`,
    view: { cells: cells(0, -1), pointers: ptrs(0, null, ["left"]), chips: chips(0, -1, 0), map: mapView() },
  });
  for (let right = 0; right < n; right++) {
    const ch = s[right];
    count.set(ch, (count.get(ch) ?? 0) + 1);
    const c = count.get(ch)!;
    const dupTones = (l: number): Record<number, CellTone> => {
      const t: Record<number, CellTone> = {};
      for (let i = l; i <= right; i++) if (s[i] === ch) t[i] = "bad";
      return t;
    };
    F.push({
      line: [L("for right, ch"), L("count[ch] += 1")],
      say: c > 1 ? `right = ${right} adds ${q(ch)}. count[${q(ch)}] = ${c}, so the window has a repeat.` : `right = ${right} adds ${q(ch)}. count[${q(ch)}] = 1.`,
      tone: c > 1 ? "bad" : undefined,
      view: { cells: cells(left, right, c > 1 ? dupTones(left) : { [right]: "accent" }), pointers: ptrs(left, right, ["right"]), band: win(left, right, c > 1 ? "bad" : "accent"), ghost: win(bestL, bestR, "good"), chips: chips(left, right, best), map: mapView(ch) },
    });
    if (count.get(ch)! > 1) {
      F.push({
        line: [L("while count[ch] > 1")],
        say: `count[${q(ch)}] > 1: the window is not valid. Shrink it from the left.`,
        tone: "bad",
        view: { cells: cells(left, right, dupTones(left)), pointers: ptrs(left, right), band: win(left, right, "bad"), ghost: win(bestL, bestR, "good"), chips: chips(left, right, best), map: mapView(ch) },
        predict: { q: `The window now holds ${q(ch)} twice. What moves?`, options: ["right moves back", "left moves forward", "The window starts over at right"], answer: 1, why: `right only moves forward. left steps forward until the old ${q(ch)} is gone.` },
      });
      while (count.get(ch)! > 1) {
        const gone = s[left];
        count.set(gone, count.get(gone)! - 1);
        left++;
        const still = count.get(ch)! > 1;
        F.push({
          line: [L("count[s[left]] -= 1"), L("left += 1")],
          say: still ? `Remove s[${left - 1}] = ${q(gone)}. Still two ${q(ch)}, keep shrinking.` : `Remove s[${left - 1}] = ${q(gone)}. Now count[${q(ch)}] = 1, so the window is valid.`,
          view: { cells: cells(left, right, still ? dupTones(left) : {}), pointers: ptrs(left, right, ["left"]), band: win(left, right, still ? "bad" : "accent"), ghost: win(bestL, bestR, "good"), chips: chips(left, right, best), map: mapView(ch) },
        });
      }
    }
    const len = right - left + 1;
    const better = len > best;
    const prev = best;
    if (better) { best = len; bestL = left; bestR = right; }
    F.push({
      line: [L("best = max(best")],
      say: better ? `Window "${s.slice(left, right + 1)}" has length ${len}. best = max(${prev}, ${len}) = ${best}.` : `Window "${s.slice(left, right + 1)}" has length ${len}. best stays ${best}.`,
      tone: better ? "good" : undefined,
      view: { cells: cells(left, right), pointers: ptrs(left, right), band: win(left, right), ghost: win(bestL, bestR, "good"), chips: chips(left, right, best, better ? "good" : undefined), map: mapView() },
    });
  }
  F.push({
    line: [L("return best")],
    say: `The longest window with no repeat is "${s.slice(bestL, bestR + 1)}", length ${best}. Each index entered once and left at most once: O(n).`,
    tone: "good",
    view: { cells: cells(bestL, bestR, tonesBy<CellTone>(n, (i) => (i >= bestL && i <= bestR ? "good" : "faint"))), pointers: ptrs(null, null), band: win(bestL, bestR, "good"), chips: [{ k: "best", v: String(best), tone: "good" }], map: mapView() },
  });
  return F;
}

/* -------------------------------------------------------- longest: last seen */

export function longestLastFrames(s: string): Frame[] {
  const L = linesFor(LONGEST_LAST);
  const n = s.length;
  const F: Frame[] = [];
  const last = new Map<string, number>();
  const disp = (c: string) => (c === " " ? "·" : c);
  const mapView = (left: number, hot?: string) => ({
    title: "last (char → index)",
    entries: [...last.entries()].map(([k, v]) => ({ k: q(disp(k)), v: String(v), tone: (k === hot ? "accent" : v < left ? "dim" : undefined) as Tone | "dim" | undefined })),
    empty: "empty",
  });
  const cells = (l: number, r: number, tones: Record<number, CellTone> = {}): Cell[] =>
    [...s].map((c, i) => ({ id: `c${i}`, text: disp(c), tone: tones[i] ?? (i < l || i > r ? "faint" : undefined) }));
  const chips = (l: number, r: number, best: number, bestTone?: Tone): Kv[] => [
    { k: "length", v: String(Math.max(0, r - l + 1)) },
    { k: "best", v: String(best), tone: bestTone },
  ];
  const ptrs = (l: number | null, r: number | null, moved: string[] = []) => [ptr("left", "left", l, moved.includes("left")), ptr("right", "right", r, moved.includes("right"))];

  F.push({
    line: [L("def longest_window")],
    say: `Find the longest part of "${s}" with no repeated character. This time, remember where each character was last seen.`,
    view: { cells: cells(0, n - 1), pointers: ptrs(null, null), chips: [], map: mapView(0) },
  });
  let left = 0, best = 0, bestL = 0, bestR = -1;
  F.push({
    line: [L("last = {}"), L("left = best = 0")],
    say: `Start with an empty window and an empty map.`,
    view: { cells: cells(0, -1), pointers: ptrs(0, null, ["left"]), chips: chips(0, -1, 0), map: mapView(0) },
  });
  for (let right = 0; right < n; right++) {
    const ch = s[right];
    const seen = last.get(ch);
    if (seen !== undefined && seen >= left) {
      const oldLeft = left;
      left = seen + 1;
      const pc = choices(`left = ${left}`, [`left = ${oldLeft + 1}`, `left = ${right}`, `left = ${seen}`], right);
      F.push({
        line: [L("for right, ch"), L("if ch in last"), L("left = last[ch] + 1")],
        say: `right = ${right} reads ${q(ch)}, last seen at ${seen}, inside the window. Jump left to ${seen} + 1 = ${left}.`,
        tone: "warn",
        view: { cells: cells(left, right, { [seen]: "bad", [right]: "accent" }), pointers: ptrs(left, right, ["left", "right"]), band: win(left, right), ghost: win(bestL, bestR, "good"), chips: chips(left, right, best), map: mapView(left, ch) },
        predict: { q: `s[${right}] = ${q(ch)} was last seen at index ${seen}, and left = ${oldLeft}. Where does left go?`, ...pc, why: `left jumps to one past the old copy: ${seen} + 1 = ${left}. Everything before it would still contain two ${q(ch)}.` },
      });
    } else {
      F.push({
        line: [L("for right, ch"), L("if ch in last")],
        say: seen === undefined ? `right = ${right} reads ${q(ch)}. Never seen before, so the window stays valid.` : `right = ${right} reads ${q(ch)}. It was seen at ${seen}, but that is left of the window, so ignore it.`,
        view: { cells: cells(left, right, { [right]: "accent", ...(seen !== undefined ? { [seen]: "dim" as CellTone } : {}) }), pointers: ptrs(left, right, ["right"]), band: win(left, right), ghost: win(bestL, bestR, "good"), chips: chips(left, right, best), map: mapView(left) },
      });
    }
    last.set(ch, right);
    const len = right - left + 1;
    const better = len > best;
    const prev = best;
    if (better) { best = len; bestL = left; bestR = right; }
    F.push({
      line: [L("last[ch] = right"), L("best = max(best")],
      say: `Save last[${q(ch)}] = ${right}. Length ${len}, ${better ? `best = max(${prev}, ${len}) = ${best}.` : `best stays ${best}.`}`,
      tone: better ? "good" : undefined,
      view: { cells: cells(left, right), pointers: ptrs(left, right), band: win(left, right), ghost: win(bestL, bestR, "good"), chips: chips(left, right, best, better ? "good" : undefined), map: mapView(left, ch) },
    });
  }
  F.push({
    line: [L("return best")],
    say: `The longest window with no repeat is "${s.slice(bestL, bestR + 1)}", length ${best}. left only jumps forward: O(n).`,
    tone: "good",
    view: { cells: cells(bestL, bestR, tonesBy<CellTone>(n, (i) => (i >= bestL && i <= bestR ? "good" : "faint"))), pointers: ptrs(null, null), band: win(bestL, bestR, "good"), chips: [{ k: "best", v: String(best), tone: "good" }], map: mapView(n) },
  });
  return F;
}

/* ------------------------------------------------------------------ shortest */

export function shortestFrames(nums: number[], target: number): Frame[] {
  const L = linesFor(SHORTEST);
  const n = nums.length;
  const F: Frame[] = [];
  const cells = (l: number, r: number, tones: Record<number, CellTone> = {}): Cell[] =>
    nums.map((x, i) => ({ id: `c${i}`, text: String(x), tone: tones[i] ?? (i < l || i > r ? "faint" : undefined) }));
  const chips = (cur: number, best: number, curTone?: Tone, bestTone?: Tone): Kv[] => [
    { k: "target", v: String(target) },
    { k: "cur", v: String(cur), tone: curTone },
    { k: "best", v: best > n ? "none" : String(best), tone: bestTone },
  ];
  const ptrs = (l: number | null, r: number | null, moved: string[] = []) => [ptr("left", "left", l, moved.includes("left")), ptr("right", "right", r, moved.includes("right"))];

  F.push({
    line: [L("def shortest_window")],
    say: `Find the shortest run of values whose sum is at least ${target}. All values are 0 or more.`,
    view: { cells: cells(0, n - 1), pointers: ptrs(null, null), chips: [{ k: "target", v: String(target) }] },
  });
  let left = 0, cur = 0, best = n + 1, bestL = 0, bestR = -1;
  F.push({
    line: [L("left = cur = 0"), L("best = len(nums) + 1")],
    say: `Empty window, cur = 0. best starts at n + 1 = ${n + 1}, which means "none found yet".`,
    view: { cells: cells(0, -1), pointers: ptrs(0, null, ["left"]), chips: chips(cur, best) },
  });
  for (let right = 0; right < n; right++) {
    const x = nums[right];
    cur += x;
    const valid = cur >= target;
    F.push({
      line: [L("for right, x"), L("cur += x")],
      say: `right = ${right} adds ${x}: cur = ${cur}.`,
      view: { cells: cells(left, right, { [right]: "accent" }), pointers: ptrs(left, right, ["right"]), band: win(left, right, valid ? "good" : "accent"), ghost: win(bestL, bestR, "good"), chips: chips(cur, best, "accent") },
    });
    if (!valid) {
      F.push({
        line: [L("while cur >= target")],
        say: `${cur} < ${target}: not valid yet. Grow the window.`,
        view: { cells: cells(left, right), pointers: ptrs(left, right), band: win(left, right), ghost: win(bestL, bestR, "good"), chips: chips(cur, best) },
      });
      continue;
    }
    let first = true;
    while (cur >= target) {
      const len = right - left + 1;
      const prev = best;
      const better = len < best;
      if (better) { best = len; bestL = left; bestR = right; }
      F.push({
        line: [L("while cur >= target"), L("best = min(best")],
        say: `${cur} >= ${target}: valid. Length ${len}, ${better ? `best = ${prev > n ? "none" : prev} → ${best}.` : `best stays ${best}.`}`,
        tone: "good",
        view: { cells: cells(left, right), pointers: ptrs(left, right), band: win(left, right, "good"), ghost: win(bestL, bestR, "good"), chips: chips(cur, best, "good", better ? "good" : undefined) },
        predict: first ? { q: `cur = ${cur} and the target is ${target}. What happens next?`, options: ["Grow: right moves on", "Record the length, then shrink from the left"], answer: 1, why: `The window is valid. Record it, then try a shorter one: drop from the left while it stays valid.` } : undefined,
      });
      first = false;
      const gone = nums[left];
      cur -= gone;
      left++;
      F.push({
        line: [L("cur -= nums[left]"), L("left += 1")],
        say: `Drop nums[${left - 1}] = ${gone}: cur = ${cur}. Try the shorter window.`,
        view: { cells: cells(left, right, { [left - 1]: "dim" }), pointers: ptrs(left, right, ["left"]), band: win(left, right, cur >= target ? "good" : "accent"), ghost: win(bestL, bestR, "good"), chips: chips(cur, best, "accent") },
      });
    }
    F.push({
      line: [L("while cur >= target")],
      say: `${cur} < ${target}: not valid any more. Stop shrinking and move right.`,
      view: { cells: cells(left, right), pointers: ptrs(left, right), band: win(left, right), ghost: win(bestL, bestR, "good"), chips: chips(cur, best) },
    });
  }
  const found = best <= n;
  F.push({
    line: [L("return best if")],
    say: found ? `The shortest window is nums[${bestL}..${bestR}] = [${nums.slice(bestL, bestR + 1).join(", ")}], length ${best}.` : `No window reaches ${target}. Return 0.`,
    tone: found ? "good" : "warn",
    view: {
      cells: found ? cells(bestL, bestR, tonesBy<CellTone>(n, (i) => (i >= bestL && i <= bestR ? "good" : "faint"))) : cells(0, n - 1),
      pointers: ptrs(null, null), band: found ? win(bestL, bestR, "good") : null,
      chips: [{ k: "target", v: String(target) }, { k: "answer", v: found ? String(best) : "0", tone: found ? "good" : "warn" }],
    },
  });
  return F;
}

/** Sum helper for validation messages. */
export const total = (a: number[]) => a.reduce((s, x) => s + x, 0);
export { sumText };
