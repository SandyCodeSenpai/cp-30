/**
 * The 30-day plan, as pages see it: day topics, the lessons and problems of each day,
 * day status for the plan grid, and the spaced re-solve queue. Pure helpers over ProgressState.
 */
import type { ComponentType } from "react";
import type { Problem, PracticeStep } from "@/content/types";
import { dateOfDay, planDay, today, type ProgressState } from "@/state/progress";
import { ALL_LESSONS, isDone, type FlatLesson } from "./course";

export const LAST_DAY = 30;

/** Day topics, from the plan in STYLE.md ("Day topic allocation"). [long, short] */
export const DAY_TOPICS: [string, string][] = [
  ["Setup and baseline test", "Setup"],
  ["Complexity from constraints, arrays and hashing", "Hashing"],
  ["Two pointers and sorting", "Two pointers"],
  ["Sliding window", "Window"],
  ["Prefix sums and difference arrays", "Prefix sums"],
  ["Stack, monotonic stack and deque", "Stacks"],
  ["Binary search and search on the answer", "Binary search"],
  ["Week 1 review and Contest 1", "Contest 1"],
  ["Greedy and intervals", "Greedy"],
  ["Heaps: top-k, two heaps, sweeps", "Heaps"],
  ["Recursion and backtracking", "Backtracking"],
  ["Trees: DFS, BFS levels, BST", "Trees"],
  ["Graphs: BFS, DFS, grids, 0-1 BFS", "Graphs"],
  ["Topological sort and union-find", "Topo + DSU"],
  ["Dijkstra, MST and Contest 2", "Dijkstra"],
  ["DP mindset: memo to table, 1-D DP", "DP basics"],
  ["Grid DP and string DP", "Grid DP"],
  ["The knapsack family", "Knapsack"],
  ["LIS and interval DP", "LIS"],
  ["Bitmask DP and digit DP", "Bitmask DP"],
  ["Tree DP, DAG DP and state machines", "Tree DP"],
  ["DP review and Contest 3", "Contest 3"],
  ["Modular arithmetic, fast power and nCr", "Mod math"],
  ["Sieve, factors and contribution counting", "Primes"],
  ["Bit manipulation and XOR", "Bits"],
  ["Fenwick tree and segment tree", "Fenwick"],
  ["Strings: KMP, Z and rolling hash", "Strings"],
  ["Constructive problems and greedy proofs", "Constructive"],
  ["Contest 4 and week 4 review", "Contest 4"],
  ["Full mock contest and weak-topic patch", "Mock"],
  ["The final 15-second exam", "Final exam"],
];
export const topicOf = (d: number) => DAY_TOPICS[clampDay(d)][0];
export const shortTopicOf = (d: number) => DAY_TOPICS[clampDay(d)][1];
export const clampDay = (d: number) => Math.max(0, Math.min(LAST_DAY, Math.round(d)));

/** Week rows for the plan grid. */
export const WEEKS: { label: string; days: number[] }[] = [
  { label: "Start", days: [0] },
  { label: "Week 1", days: [1, 2, 3, 4, 5, 6, 7] },
  { label: "Week 2", days: [8, 9, 10, 11, 12, 13, 14] },
  { label: "Week 3", days: [15, 16, 17, 18, 19, 20, 21] },
  { label: "Week 4", days: [22, 23, 24, 25, 26, 27, 28] },
  { label: "Finish", days: [29, 30] },
];
export const isContestDay = (d: number) => d > 0 && d % 7 === 0;
export const isTestDay = (d: number) => d === 0 || d === 30 || isContestDay(d);

/* ---------------- Lessons and problems per day ---------------- */

export function lessonsForDay(day: number): FlatLesson[] {
  return ALL_LESSONS.filter((f) => f.lesson.day === day);
}

export interface DayPractice { problems: Problem[]; intro?: string }
export function practiceForDay(day: number): DayPractice {
  const seen = new Set<string>();
  const problems: Problem[] = [];
  let intro: string | undefined;
  for (const f of lessonsForDay(day)) {
    for (const s of f.lesson.steps) {
      if (!s || s.kind !== "practice") continue;
      const ps = s as PracticeStep;
      if (!intro && ps.intro) intro = ps.intro;
      for (const pr of Array.isArray(ps.problems) ? ps.problems : []) {
        if (!pr || typeof pr.ref !== "string" || seen.has(pr.ref)) continue;
        seen.add(pr.ref); problems.push(pr);
      }
    }
  }
  return { problems, intro };
}

let PROBLEM_INDEX: Map<string, { day: number; p: Problem }> | null = null;
/** Every practice problem in the course: ref -> its plan day and data. */
export function problemIndex() {
  if (PROBLEM_INDEX) return PROBLEM_INDEX;
  const m = new Map<string, { day: number; p: Problem }>();
  for (let d = 0; d <= LAST_DAY; d++) for (const p of practiceForDay(d).problems) if (!m.has(p.ref)) m.set(p.ref, { day: d, p });
  PROBLEM_INDEX = m;
  return m;
}

/* ---------------- Day status ---------------- */

export type DayStatus = "done" | "today" | "missed" | "ahead";
export function dayStatus(s: ProgressState, day: number, current: number | null): DayStatus {
  const ls = lessonsForDay(day);
  const done = ls.length ? ls.every((f) => isDone(s, f.lesson)) : (s.hours?.[day] ?? 0) > 0;
  if (done) return "done";
  if (current === null) return "ahead";
  if (day === current) return "today";
  return day < current ? "missed" : "ahead";
}
/** Lessons done / total for a day. */
export function dayLessonFrac(s: ProgressState, day: number) {
  const ls = lessonsForDay(day);
  return { done: ls.filter((f) => isDone(s, f.lesson)).length, total: ls.length };
}

/** The plan day to show by default: today's day clamped to 0..30, or 0 if Day 1 is not set. */
export function defaultDay(s: ProgressState): number {
  const d = planDay(s);
  return d === null ? 0 : clampDay(d);
}

/* ---------------- Dates ---------------- */

const toUTC = (iso: string) => { const [y, m, d] = iso.split("-").map(Number); return Date.UTC(y, (m || 1) - 1, d || 1); };
export function addDays(iso: string, n: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const x = new Date(y, (m || 1) - 1, (d || 1) + n);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
}
export const daysBetween = (a: string, b: string) => Math.round((toUTC(b) - toUTC(a)) / 86400000);
/** Plan day of a calendar date, or null if Day 1 is not set. */
export function dayOfDate(s: ProgressState, iso: string): number | null {
  if (!s.day1) return null;
  return daysBetween(s.day1, iso) + 1;
}
/** "Day 8" when the plan is set, otherwise a relative phrase ("today", "in 3 days", "2 days ago"). */
export function whenLabel(s: ProgressState, iso: string): string {
  const d = dayOfDate(s, iso);
  if (d !== null && d >= 0 && d <= 45) return `Day ${d}`;
  const k = daysBetween(today(), iso);
  if (k === 0) return "today";
  if (k === 1) return "tomorrow";
  if (k === -1) return "yesterday";
  return k > 0 ? `in ${k} days` : `${-k} days ago`;
}
export { dateOfDay, planDay };

/* ---------------- Re-solve queue (Rule 5) ---------------- */

export interface ResolveItem {
  ref: string; how: "hint" | "editorial"; at: string;
  d3: string; d7: string; d3done: boolean; d7done: boolean;
  dueNow: ("d3" | "d7")[]; clean: boolean; day?: number;
}
export function resolveQueue(s: ProgressState): ResolveItem[] {
  const t = today();
  const idx = problemIndex();
  const out: ResolveItem[] = [];
  for (const [ref, mark] of Object.entries(s.problems ?? {})) {
    if (!mark || (mark.s !== "hint" && mark.s !== "editorial")) continue;
    const r = s.resolves?.[ref] ?? {};
    const d3 = addDays(mark.at, 3), d7 = addDays(mark.at, 7);
    const dueNow: ("d3" | "d7")[] = [];
    if (!r.d3 && d3 <= t) dueNow.push("d3");
    if (!r.d7 && d7 <= t) dueNow.push("d7");
    out.push({ ref, how: mark.s, at: mark.at, d3, d7, d3done: !!r.d3, d7done: !!r.d7, dueNow, clean: !!r.d3 && !!r.d7, day: idx.get(ref)?.day });
  }
  return out.sort((a, b) => (a.clean === b.clean ? (a.d3 < b.d3 ? -1 : a.d3 > b.d3 ? 1 : a.ref.localeCompare(b.ref)) : a.clean ? 1 : -1));
}

/* ---------------- Problem links ---------------- */

type PracticeMod = { PracticeList?: ComponentType<{ problems: Problem[]; intro?: string }>; problemUrl?: (p: Problem) => string | undefined | null };
/* The player agent builds src/player/Practice.tsx. import.meta.glob is {} until it exists, so the build never breaks. */
const practiceMods = import.meta.glob("../player/Practice.tsx", { eager: true }) as Record<string, PracticeMod>;
export const PracticeMod: PracticeMod | undefined = practiceMods["../player/Practice.tsx"];

const slug = (t: string) => t.toLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
/** A link for a problem: its own url, the player's resolver, or a LeetCode slug from "LC 1 Two Sum". */
export function linkFor(p: Problem | { ref: string; url?: string }): string | undefined {
  if (p.url) return p.url;
  try { const u = PracticeMod?.problemUrl?.(p as Problem); if (u) return u; } catch { /* resolver not ready */ }
  const m = p.ref.match(/^LC\s+\d+\s+(.+)$/);
  if (m) return `https://leetcode.com/problems/${slug(m[1])}/`;
  return undefined;
}

export const STATUS_LABEL: Record<"solved" | "hint" | "editorial" | "skipped", string> = {
  solved: "Solved alone", hint: "With a hint", editorial: "Read the editorial", skipped: "Skipped",
};
