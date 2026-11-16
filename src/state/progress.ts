/**
 * Learner progress, saved in this browser only (localStorage, every access wrapped in try/catch).
 * API is a contract for pages and the lesson player.
 */
import { useSyncExternalStore } from "react";

export interface LessonResult { xp: number; accuracy: number; at: string /* ISO date */ }
export interface Resume { chapter: number; lesson: number; step: number }
export type ProblemStatus = "solved" | "hint" | "editorial" | "skipped";
export interface ProblemMark { s: ProblemStatus; at: string /* ISO date */ }
export type MistakeCategory = "misread" | "wrong pattern" | "right pattern, wrong details" | "edge case" | "off-by-one" | "Python TLE" | "recursion depth" | "didn't know the technique";
export interface Mistake { id: string; date: string; problem: string; what: string; category: MistakeCategory; rule: string }
/** Leitner box per card: 1 = see daily, 5 = mastered. */
export interface CardStat { seen: number; right: number; lastMs: number; last: string; box: number }
export interface GymRun { at: string; kind: "warmup" | "test"; size: number; right: number; avgMs: number }
export interface ProgressState {
  done: Record<string, LessonResult>;   // lessonId -> result
  xp: number;
  days: string[];                       // ISO dates (YYYY-MM-DD) with at least one finished lesson
  dailyGoal: number;                    // lessons per day: 1, 2 or 3
  resume: Resume | null;
  widgets: Record<string, true>;        // widget ids the reader completed
  missed: Record<string, number[]>;     // lessonId -> step indexes answered wrong (for review)
  /* ---- the 30-day plan ---- */
  day1: string | null;                  // ISO date of Day 1 (Day 0 is the day before). null = not set yet.
  problems: Record<string, ProblemMark>; // Problem.ref -> status
  resolves: Record<string, { d3?: boolean; d7?: boolean }>; // Problem.ref -> spaced re-solves done
  mistakes: Mistake[];                  // newest first
  gym: Record<number, CardStat>;        // card number -> stats
  gymRuns: GymRun[];                    // newest last
  hours: Record<number, number>;        // plan day -> hours practised
  table: Record<string, Record<number, string>>; // progress-table metric -> plan day (0,7,14,21,28,30) -> value
}

const KEY = "cp30:v1";
const empty: ProgressState = {
  done: {}, xp: 0, days: [], dailyGoal: 1, resume: null, widgets: {}, missed: {},
  day1: null, problems: {}, resolves: {}, mistakes: [], gym: {}, gymRuns: [], hours: {}, table: {},
};
let state: ProgressState = load();
const subs = new Set<() => void>();
// Pick up changes saved by another tab so a later save here does not overwrite them.
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => { if (e.key === KEY) { state = load(); subs.forEach((f) => f()); } });
}

function load(): ProgressState {
  try { const raw = localStorage.getItem(KEY); return raw ? { ...empty, ...JSON.parse(raw) } : { ...empty }; } catch { return { ...empty }; }
}
function save(next: ProgressState) {
  state = next;
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* storage blocked: keep in memory */ }
  subs.forEach((f) => f());
}
const iso = (x: Date) => `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
/** Local calendar date, YYYY-MM-DD. */
export const today = () => iso(new Date());

export const progress = {
  get: () => state,
  subscribe(f: () => void) { subs.add(f); return () => subs.delete(f); },
  completeLesson(id: string, xp: number, accuracy: number) {
    const d = today();
    const prev = state.done[id];
    save({
      ...state,
      done: { ...state.done, [id]: { xp: Math.max(xp, prev?.xp ?? 0), accuracy: Math.max(accuracy, prev?.accuracy ?? 0), at: d } },
      xp: state.xp + (prev ? Math.round(xp / 4) : xp), // replays earn a little
      days: state.days.includes(d) ? state.days : [...state.days, d].slice(-400),
    });
  },
  setResume(r: Resume | null) { save({ ...state, resume: r }); },
  setDailyGoal(n: number) { save({ ...state, dailyGoal: Math.max(1, Math.min(3, n)) }); },
  markWidget(id: string) { if (!state.widgets[id]) save({ ...state, widgets: { ...state.widgets, [id]: true } }); },
  setMissed(lessonId: string, steps: number[]) { save({ ...state, missed: { ...state.missed, [lessonId]: steps } }); },
  reset() { save({ ...empty }); },
  /* ---- the 30-day plan ---- */
  setDay1(iso: string | null) { save({ ...state, day1: iso }); },
  setProblem(ref: string, st: ProblemStatus | null) {
    const problems = { ...state.problems };
    if (st) problems[ref] = { s: st, at: today() }; else delete problems[ref];
    save({ ...state, problems });
  },
  setResolve(ref: string, which: "d3" | "d7", v: boolean) { save({ ...state, resolves: { ...state.resolves, [ref]: { ...state.resolves[ref], [which]: v } } }); },
  addMistake(m: Omit<Mistake, "id">) { save({ ...state, mistakes: [{ ...m, id: Math.random().toString(36).slice(2, 10) }, ...state.mistakes].slice(0, 500) }); },
  removeMistake(id: string) { save({ ...state, mistakes: state.mistakes.filter((m) => m.id !== id) }); },
  /** Record one card attempt. right within 15 s moves the card up a box; a miss sends it to box 1. */
  gymAnswer(n: number, right: boolean, ms: number) {
    const c = state.gym[n] ?? { seen: 0, right: 0, lastMs: 0, last: "", box: 1 };
    const box = right ? Math.min(5, c.box + 1) : 1;
    save({ ...state, gym: { ...state.gym, [n]: { seen: c.seen + 1, right: c.right + (right ? 1 : 0), lastMs: ms, last: today(), box } } });
  },
  addGymRun(r: Omit<GymRun, "at">) { save({ ...state, gymRuns: [...state.gymRuns, { ...r, at: today() }].slice(-300) }); },
  setHours(day: number, h: number) { save({ ...state, hours: { ...state.hours, [day]: Math.max(0, Math.min(16, h)) } }); },
  setTable(metric: string, day: number, v: string) { save({ ...state, table: { ...state.table, [metric]: { ...state.table[metric], [day]: v } } }); },
};

/** Today's plan day: 0..30, negative before Day 0, >30 after the month. null if Day 1 is not set. */
export function planDay(s: ProgressState, now = new Date()): number | null {
  if (!s.day1) return null;
  const [y, m, d] = s.day1.split("-").map(Number);
  const start = Date.UTC(y, m - 1, d);
  const t = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((t - start) / 86400000) + 1;
}
/** Local calendar date (YYYY-MM-DD) of a plan day. */
export function dateOfDay(s: ProgressState, day: number): string | null {
  if (!s.day1) return null;
  const [y, m, d] = s.day1.split("-").map(Number);
  const x = new Date(y, m - 1, d + day - 1);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
}

/** Current streak in days (counts back from today, or from yesterday if today not yet done). */
export function streakOf(days: string[]): { count: number; todayDone: boolean; week: boolean[] } {
  const set = new Set(days);
  const d = new Date();
  const todayDone = set.has(iso(d));
  const cur = new Date(d);
  if (!todayDone) cur.setDate(cur.getDate() - 1);
  let count = 0;
  while (set.has(iso(cur))) { count++; cur.setDate(cur.getDate() - 1); }
  const week: boolean[] = [];
  for (let i = 6; i >= 0; i--) { const x = new Date(d); x.setDate(x.getDate() - i); week.push(set.has(iso(x))); }
  return { count, todayDone, week };
}

export function useProgress(): ProgressState {
  return useSyncExternalStore(progress.subscribe, progress.get, progress.get);
}
export function lessonsDoneToday(s: ProgressState): number {
  const d = today();
  return Object.values(s.done).filter((r) => r.at === d).length;
}
