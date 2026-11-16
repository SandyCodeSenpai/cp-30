/**
 * Step player shared by the range-query and string-match labs.
 * Each mode builds an array of frames with a pure function (state + code line + narration),
 * so Step back / Step / Play are only index moves.
 */
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";

/** A 2-3 option question asked before moving from this frame to the next one (when Predict is on). */
export interface Ask { q: string; options: string[]; answer: number; why?: string }
/** `line` is the 0-based line in the code panel; `line2` is a softer "caller" line. */
export interface BaseFrame { line: number; line2?: number; say: string; ask?: Ask }

export type Speed = 0.5 | 1 | 2;
const DELAY: Record<Speed, number> = { 0.5: 1900, 1: 1150, 2: 560 };

interface Asking { at: number; chosen: number | null; resume: boolean }

/** `frames` must be a new array whenever the input changes; that resets the player. */
export function usePlayer<F extends BaseFrame>(frames: F[], onComplete?: () => void) {
  const last = Math.max(0, frames.length - 1);
  const [idx, setIdxState] = useState(0);
  // Mirror the index in a ref so several fast clicks or key presses before a render still add up.
  const idxRef = useRef(0);
  const setIdx = useCallback((v: number) => { idxRef.current = v; setIdxState(v); }, []);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<Speed>(1);
  const [predict, setPredict] = useState(false);
  const [asking, setAsking] = useState<Asking | null>(null);
  const answered = useRef(new Set<number>());
  const completed = useRef(false);
  const cb = useRef(onComplete); cb.current = onComplete;

  useEffect(() => { setIdx(0); setPlaying(false); setAsking(null); answered.current = new Set(); }, [frames, setIdx]);

  const cur = Math.min(idx, last);
  const askingRef = useRef<Asking | null>(null); askingRef.current = asking;

  const forward = useCallback((fromPlay: boolean): boolean => {
    const at = Math.min(idxRef.current, last);
    if (askingRef.current || at >= last) return false;
    const f = frames[at];
    if (predict && f.ask && !answered.current.has(at)) { const a = { at, chosen: null, resume: fromPlay }; askingRef.current = a; setAsking(a); setPlaying(false); return false; }
    setIdx(at + 1); return true;
  }, [last, frames, predict, setIdx]);

  const step = useCallback(() => { setPlaying(false); forward(false); }, [forward]);
  const back = useCallback(() => { setPlaying(false); setAsking(null); setIdx(Math.max(0, Math.min(idxRef.current, last) - 1)); }, [last, setIdx]);
  const reset = useCallback(() => { setPlaying(false); setAsking(null); setIdx(0); }, [setIdx]);
  const toEnd = useCallback(() => { setPlaying(false); setAsking(null); setIdx(last); }, [last, setIdx]);
  const toggle = useCallback(() => {
    if (asking) return;
    if (playing) { setPlaying(false); return; }
    if (cur >= last) setIdx(0);
    setPlaying(true);
  }, [asking, playing, cur, last, setIdx]);
  const choose = useCallback((n: number) => {
    setAsking((a) => (a && a.chosen === null ? { ...a, chosen: n } : a));
    if (asking) answered.current.add(asking.at);
  }, [asking]);
  const proceed = useCallback(() => {
    if (!asking) return;
    setIdx(asking.at + 1); setAsking(null);
    if (asking.resume) setPlaying(true);
  }, [asking, setIdx]);

  useEffect(() => {
    if (!playing || asking) return;
    const t = setTimeout(() => { if (!forward(true)) setPlaying(false); }, DELAY[speed]);
    return () => clearTimeout(t);
  }, [playing, asking, cur, last, speed, forward]);
  useEffect(() => { if (playing && cur >= last) setPlaying(false); }, [playing, cur, last]);

  useEffect(() => {
    if (frames.length > 1 && cur === last && !completed.current) { completed.current = true; cb.current?.(); }
  }, [cur, last, frames.length]);

  const onKeyDown = useCallback((e: KeyboardEvent<HTMLElement>) => {
    const t = e.target as HTMLElement;
    if (t.closest("input, textarea, select, [contenteditable='true']")) return;
    if (asking) {
      const ask = frames[asking.at]?.ask;
      const n = Number(e.key);
      if (ask && asking.chosen === null && n >= 1 && n <= ask.options.length) { e.preventDefault(); choose(n - 1); return; }
      if (asking.chosen !== null && (e.key === "Enter" || e.key === "ArrowRight")) { e.preventDefault(); proceed(); return; }
    }
    if (e.key === "ArrowRight") { e.preventDefault(); step(); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); back(); }
    else if (e.key === " " || e.key === "Spacebar") { e.preventDefault(); toggle(); }
  }, [asking, frames, choose, proceed, step, back, toggle]);

  return { frame: frames[cur], cur, last, total: frames.length, playing, speed, setSpeed, predict, setPredict, asking, step, back, reset, toEnd, toggle, choose, proceed, onKeyDown };
}
export type Player<F extends BaseFrame> = ReturnType<typeof usePlayer<F>>;

/* ---------------- Input helpers ---------------- */

/** Parse "1, 2, 3" into whole numbers. Returns an error string on bad input. */
export function parseNums(s: string, o: { min: number; max: number; minLen: number; maxLen: number; name?: string }): number[] | string {
  const parts = s.split(/[\s,]+/).filter(Boolean);
  const name = o.name ?? "values";
  if (parts.length < o.minLen || parts.length > o.maxLen) return `Enter ${o.minLen} to ${o.maxLen} ${name}, separated by commas.`;
  const out: number[] = [];
  for (const p of parts) {
    if (!/^-?\d+$/.test(p)) return `"${p}" is not a whole number.`;
    const v = Number(p);
    if (v < o.min || v > o.max) return `Keep each value between ${o.min.toLocaleString("en-US")} and ${o.max.toLocaleString("en-US")}.`;
    out.push(v);
  }
  return out;
}

export function parseInt1(s: string, min: number, max: number, name: string): number | string {
  const t = s.trim();
  if (!/^-?\d+$/.test(t)) return `${name} must be a whole number.`;
  const v = Number(t);
  if (v < min || v > max) return `${name} must be between ${min} and ${max}.`;
  return v;
}

/** A string of allowed characters with a length range. */
export function parseStr(s: string, o: { minLen: number; maxLen: number; name: string; allow?: RegExp; allowText?: string }): string | { error: string } {
  const t = s.trim();
  if (t.length < o.minLen || t.length > o.maxLen) return { error: `${o.name} must have ${o.minLen} to ${o.maxLen} characters.` };
  const allow = o.allow ?? /^[A-Za-z0-9]+$/;
  if (!allow.test(t)) return { error: `${o.name}: use ${o.allowText ?? "letters and digits"} only.` };
  return t;
}

export const randInt = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1));
export const randChoice = <T,>(xs: readonly T[]): T => xs[Math.floor(Math.random() * xs.length)];
