import type { WidgetProps } from "../types";
import { LabShell } from "./kit/LabShell";
import type { ModeSpec, RawInput } from "./kit/types";
import { isSorted, parseInt1, parseNums, pick, randInt } from "./kit/util";
import { COMPACT, PAIR_SUM, PALINDROME, THREE_SUM } from "./code";
import { compactFrames, pairSumFrames, palindromeFrames, threeSumFrames } from "./engine";

const sortNote = (was: boolean) => (was ? undefined : "Your numbers were sorted first: this template needs a sorted array.");

const PAIR: ModeSpec = {
  id: "pair-sum",
  label: "Pair sum",
  blurb: "Sorted array and a target. If the sum is too small, move i right. If it is too big, move j left.",
  code: PAIR_SUM,
  mainLabel: "Sorted numbers",
  mainHint: "4 to 16 whole numbers between -99 and 99, comma-separated. They will be sorted.",
  secondLabel: "target",
  presets: [
    { name: "Found", main: "1, 3, 4, 5, 7, 10, 11, 15", second: "15" },
    { name: "Two Sum II", main: "2, 7, 11, 15", second: "9" },
    { name: "No pair", main: "1, 2, 4, 8, 16, 32", second: "7" },
    { name: "Negatives", main: "-8, -5, -2, 0, 3, 6, 9, 12", second: "4" },
  ],
  random: () => {
    const n = randInt(6, 10);
    const a = Array.from({ length: n }, () => randInt(-10, 30)).sort((x, y) => x - y);
    const hit = Math.random() < 0.75;
    const i = randInt(0, n - 2), j = randInt(i + 1, n - 1);
    return { main: a.join(", "), second: String(hit ? a[i] + a[j] : randInt(-5, 50)) };
  },
  build: (raw) => {
    const p = parseNums(raw.main, { min: 4, max: 16 });
    if (!p.ok) return p;
    const t = parseInt1(raw.second, "target", -999, 999);
    if (!t.ok) return t;
    const a = [...p.nums].sort((x, y) => x - y);
    return { ok: true, frames: pairSumFrames(a, t.v), note: sortNote(isSorted(p.nums)) };
  },
};

const PALIN: ModeSpec = {
  id: "palindrome",
  label: "Palindrome",
  blurb: "Compare the two ends and walk inward. Skip anything that is not a letter or a digit.",
  code: PALINDROME,
  mainLabel: "Text",
  mainHint: "2 to 18 characters. Case is ignored, and spaces and punctuation are skipped.",
  presets: [
    { name: "Step on no pets", main: "Step on no pets" },
    { name: "race a car", main: "race a car" },
    { name: "Taco cat", main: "Taco cat" },
    { name: "Madam, I'm Adam", main: "Madam, I'm Adam" },
  ],
  random: () => {
    const words = ["level", "noon", "racecar", "rotor", "refer", "stats", "kayak", "civic", "radar", "abcba", "abca", "never odd or even", "no x in Nixon", "top spot", "abc cba", "a,b:a"];
    const w = pick(words);
    if (Math.random() < 0.3 && w.length > 3) { const k = randInt(0, w.length - 1); return { main: w.slice(0, k) + "q" + w.slice(k + 1) }; }
    return { main: w };
  },
  build: (raw) => {
    const s = raw.main;
    if (s.trim().length < 2) return { ok: false, error: "Enter at least 2 characters." };
    if (s.length > 18) return { ok: false, error: "Use at most 18 characters." };
    return { ok: true, frames: palindromeFrames(s) };
  },
};

const THREE: ModeSpec = {
  id: "three-sum",
  label: "3Sum",
  blurb: "Sort. Fix i, then run pair sum on the rest with lo and hi. Skip equal values so each triple appears once.",
  code: THREE_SUM,
  mainLabel: "Numbers",
  mainHint: "3 to 12 whole numbers between -99 and 99. The triples must sum to 0.",
  presets: [
    { name: "LC 15", main: "-1, 0, 1, 2, -1, -4" },
    { name: "Many copies", main: "-2, 0, 0, 2, 2, -2, 0" },
    { name: "Zeros", main: "0, 0, 0, 0" },
    { name: "None", main: "1, 2, -4, 5, 7" },
  ],
  random: () => {
    const n = randInt(6, 9);
    return { main: Array.from({ length: n }, () => randInt(-6, 6)).join(", ") };
  },
  build: (raw) => {
    const p = parseNums(raw.main, { min: 3, max: 12 });
    if (!p.ok) return p;
    return { ok: true, frames: threeSumFrames(p.nums) };
  },
};

const SAME: ModeSpec = {
  id: "same-direction",
  label: "Read / write",
  blurb: "Both pointers move the same way. r reads every element; w marks where the next kept value goes.",
  code: COMPACT,
  mainLabel: "Sorted numbers",
  mainHint: "4 to 16 whole numbers between -99 and 99. They will be sorted.",
  presets: [
    { name: "LC 26", main: "0, 0, 1, 1, 1, 2, 2, 3, 3, 4" },
    { name: "All same", main: "5, 5, 5, 5, 5" },
    { name: "No copies", main: "1, 2, 3, 4, 5" },
    { name: "Pairs", main: "1, 1, 2, 2, 3, 3" },
  ],
  random: () => {
    const n = randInt(7, 11);
    const a: number[] = [randInt(0, 3)];
    while (a.length < n) a.push(a[a.length - 1] + (Math.random() < 0.55 ? 0 : randInt(1, 2)));
    return { main: a.join(", ") };
  },
  build: (raw) => {
    const p = parseNums(raw.main, { min: 4, max: 16 });
    if (!p.ok) return p;
    const a = [...p.nums].sort((x, y) => x - y);
    return { ok: true, frames: compactFrames(a), note: sortNote(isSorted(p.nums)) };
  },
};

const MODES = [PAIR, PALIN, THREE, SAME];

/** Two pointers lab: pair sum, palindrome, 3Sum, and read/write (same-direction) pointers. */
export default function TwoPointers(props: WidgetProps) {
  const nums = Array.isArray(props.nums) && props.nums.every((x) => typeof x === "number") ? (props.nums as number[]).join(", ") : undefined;
  const target = typeof props.target === "number" ? String(props.target) : undefined;
  const s = typeof props.s === "string" ? props.s : undefined;
  const initial: Record<string, RawInput | undefined> = {
    "pair-sum": nums || target ? { main: nums ?? PAIR.presets[0].main, second: target ?? PAIR.presets[0].second } : undefined,
    "palindrome": s ? { main: s } : undefined,
    "three-sum": nums ? { main: nums } : undefined,
    "same-direction": nums ? { main: nums } : undefined,
  };
  return <LabShell modes={MODES} mode={props.mode} compact={props.compact !== false} onComplete={props.onComplete} initial={initial} name="Two pointers" />;
}
