import { useState } from "react";
import { Segmented } from "@/ui";
import type { WidgetProps } from "../types";
import { LabShell } from "../two-pointers/kit/LabShell";
import type { ModeSpec, RawInput } from "../two-pointers/kit/types";
import { parseInt1, parseNums, pick, randInt } from "../two-pointers/kit/util";
import { FIXED, LONGEST_COUNT, LONGEST_LAST, SHORTEST } from "./code";
import { fixedFrames, longestCountFrames, longestLastFrames, shortestFrames, total } from "./engine";

const FIXED_MODE: ModeSpec = {
  id: "fixed",
  label: "Fixed size",
  blurb: "A window of exactly k values slides right. Add the value that comes in, drop the one that leaves.",
  code: FIXED,
  mainLabel: "Numbers",
  mainHint: "4 to 16 whole numbers between -99 and 99. Negatives are fine for a fixed window.",
  secondLabel: "k",
  presets: [
    { name: "LC 643", main: "1, 12, -5, -6, 50, 3", second: "4" },
    { name: "k = 3", main: "2, 1, 5, 1, 3, 2, 9, 0", second: "3" },
    { name: "k = 2", main: "4, -2, 7, 1, -3, 8, 2", second: "2" },
  ],
  random: () => {
    const n = randInt(7, 11);
    return { main: Array.from({ length: n }, () => randInt(-5, 12)).join(", "), second: String(randInt(2, 4)) };
  },
  build: (raw) => {
    const p = parseNums(raw.main, { min: 4, max: 16 });
    if (!p.ok) return p;
    const k = parseInt1(raw.second, "k", 1, p.nums.length);
    if (!k.ok) return k;
    return { ok: true, frames: fixedFrames(p.nums, k.v) };
  },
};

const strBuild = (frames: (s: string) => ReturnType<typeof longestCountFrames>) => (raw: RawInput) => {
  const s = raw.main;
  if (s.length < 2) return { ok: false as const, error: "Enter at least 2 characters." };
  if (s.length > 16) return { ok: false as const, error: "Use at most 16 characters." };
  return { ok: true as const, frames: frames(s) };
};

const LONGEST_BASE = {
  id: "longest",
  label: "Longest",
  mainLabel: "Text",
  mainHint: "2 to 16 characters. Find the longest part with no repeated character.",
  presets: [
    { name: "abcabcbb", main: "abcabcbb" },
    { name: "pwwkew", main: "pwwkew" },
    { name: "bbbbb", main: "bbbbb" },
    { name: "abba", main: "abba" },
  ],
  random: () => {
    const alpha = pick(["abc", "abcd", "abcde", "xyz"]);
    const n = randInt(7, 12);
    return { main: Array.from({ length: n }, () => alpha[randInt(0, alpha.length - 1)]).join("") };
  },
};

const LONGEST_COUNT_MODE: ModeSpec = {
  ...LONGEST_BASE,
  blurb: "Grow right every step. While the window has a repeat, shrink from the left. Record the length when it is valid.",
  code: LONGEST_COUNT,
  build: strBuild(longestCountFrames),
};

const LONGEST_LAST_MODE: ModeSpec = {
  ...LONGEST_BASE,
  blurb: "Same window, but remember where each character was last seen. On a repeat, left jumps straight past the old copy.",
  code: LONGEST_LAST,
  build: strBuild(longestLastFrames),
};

const SHORTEST_MODE: ModeSpec = {
  id: "shortest",
  label: "Shortest",
  blurb: "Grow right until the sum reaches the target. While it does, record the length and shrink from the left.",
  code: SHORTEST,
  mainLabel: "Numbers (0 or more)",
  mainHint: "4 to 16 whole numbers from 0 to 99. A window needs values that are not negative.",
  secondLabel: "target",
  presets: [
    { name: "LC 209", main: "2, 3, 1, 2, 4, 3", second: "7" },
    { name: "One big", main: "1, 4, 4", second: "4" },
    { name: "Not reachable", main: "1, 1, 1, 1, 1", second: "11" },
    { name: "Long", main: "1, 2, 3, 4, 5, 6, 7, 8", second: "15" },
  ],
  random: () => {
    const n = randInt(7, 11);
    const a = Array.from({ length: n }, () => randInt(1, 9));
    return { main: a.join(", "), second: String(randInt(8, Math.max(9, Math.floor(total(a) * 0.6)))) };
  },
  build: (raw) => {
    const p = parseNums(raw.main, { min: 4, max: 16, lo: 0, hi: 99 });
    if (!p.ok) {
      if (/^-|\s-|,-/.test(raw.main.trim()) || raw.main.includes("-")) return { ok: false, error: "Negative values break the window: the sum no longer grows as the window grows. Use prefix sums for that (Day 4)." };
      return p;
    }
    const t = parseInt1(raw.second, "target", 1, 999);
    if (!t.ok) return t;
    return { ok: true, frames: shortestFrames(p.nums, t.v) };
  },
};

type MapKind = "count" | "last-seen";

/** Sliding window lab: fixed size, longest valid (count map or last-seen map), shortest valid. */
export default function SlidingWindow(props: WidgetProps) {
  const [mapKind, setMapKind] = useState<MapKind>(props.map === "last-seen" ? "last-seen" : "count");
  const modes = [FIXED_MODE, mapKind === "count" ? LONGEST_COUNT_MODE : LONGEST_LAST_MODE, SHORTEST_MODE];
  const nums = Array.isArray(props.nums) && props.nums.every((x) => typeof x === "number") ? (props.nums as number[]).join(", ") : undefined;
  const k = typeof props.k === "number" ? String(props.k) : undefined;
  const target = typeof props.target === "number" ? String(props.target) : undefined;
  const s = typeof props.s === "string" ? props.s : undefined;
  const initial: Record<string, RawInput | undefined> = {
    "fixed": nums || k ? { main: nums ?? FIXED_MODE.presets[0].main, second: k ?? FIXED_MODE.presets[0].second } : undefined,
    "longest": s ? { main: s } : undefined,
    "shortest": nums || target ? { main: nums ?? SHORTEST_MODE.presets[0].main, second: target ?? SHORTEST_MODE.presets[0].second } : undefined,
  };
  return (
    <LabShell modes={modes} mode={props.mode} compact={props.compact !== false} onComplete={props.onComplete} initial={initial} name="Sliding window"
      extra={(id) => id === "longest" ? (
        <div className="kit-extra">
          <Segmented label="Map" value={mapKind} onChange={setMapKind}
            options={[{ value: "count", label: "count (book template)" }, { value: "last-seen", label: "last seen (jump)" }]} />
        </div>
      ) : null} />
  );
}
