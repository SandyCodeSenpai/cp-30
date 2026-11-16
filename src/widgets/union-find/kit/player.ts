/**
 * Step player for the union-find and toposort labs.
 * A run is an array of precomputed frames (state + code line + narration), so
 * Step back, Step and Play only move an index. The player never computes the algorithm.
 */
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";

/** A 2-3 option question shown before moving past this frame (only when Predict is on). */
export interface Ask { q: string; options: string[]; answer: number; why?: string }
export interface BaseFrame { line: number; line2?: number; say: string; ask?: Ask }
/** One precomputed run. A new object resets the player to `start` (and plays if `autoplay`). */
export interface Run<F extends BaseFrame> { frames: F[]; start?: number; autoplay?: boolean }

export type Speed = 0.5 | 1 | 2;
const DELAY: Record<Speed, number> = { 0.5: 1900, 1: 1150, 2: 560 };

interface Asking { at: number; chosen: number | null; resume: boolean }

export function usePlayer<F extends BaseFrame>(run: Run<F>, onComplete?: () => void) {
  const { frames } = run;
  const last = Math.max(0, frames.length - 1);
  const [idx, setIdx] = useState(run.start ?? 0);
  const [playing, setPlaying] = useState(!!run.autoplay);
  const [speed, setSpeed] = useState<Speed>(1);
  const [predict, setPredict] = useState(false);
  const [asking, setAsking] = useState<Asking | null>(null);
  const answered = useRef(new Set<number>());
  const completed = useRef(false);
  const cb = useRef(onComplete); cb.current = onComplete;

  useEffect(() => {
    setIdx(Math.min(run.start ?? 0, Math.max(0, run.frames.length - 1)));
    setPlaying(!!run.autoplay); setAsking(null); answered.current = new Set();
  }, [run]);

  const cur = Math.min(idx, last);

  const forward = useCallback((fromPlay: boolean): boolean => {
    if (asking || cur >= last) return false;
    const f = frames[cur];
    if (predict && f.ask && !answered.current.has(cur)) { setAsking({ at: cur, chosen: null, resume: fromPlay }); setPlaying(false); return false; }
    setIdx(cur + 1); return true;
  }, [asking, cur, last, frames, predict]);

  const step = useCallback(() => { setPlaying(false); forward(false); }, [forward]);
  const back = useCallback(() => { setPlaying(false); setAsking(null); setIdx(Math.max(0, cur - 1)); }, [cur]);
  const reset = useCallback(() => { setPlaying(false); setAsking(null); setIdx(0); }, []);
  const jump = useCallback((i: number) => { setPlaying(false); setAsking(null); setIdx(Math.max(0, Math.min(last, i))); }, [last]);
  const toggle = useCallback(() => {
    if (asking) return;
    if (playing) { setPlaying(false); return; }
    if (cur >= last) setIdx(0);
    setPlaying(true);
  }, [asking, playing, cur, last]);
  const choose = useCallback((n: number) => {
    setAsking((a) => (a && a.chosen === null ? { ...a, chosen: n } : a));
    if (asking) answered.current.add(asking.at);
  }, [asking]);
  const proceed = useCallback(() => {
    if (!asking) return;
    setIdx(asking.at + 1); setAsking(null);
    if (asking.resume) setPlaying(true);
  }, [asking]);

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
    else if (e.key === " " || e.key === "Spacebar") {
      if (t.closest("button")) return; // let Space press the focused button
      e.preventDefault(); toggle();
    }
  }, [asking, frames, choose, proceed, step, back, toggle]);

  return { frame: frames[cur], cur, last, total: frames.length, playing, speed, setSpeed, predict, setPredict, asking, step, back, reset, jump, toggle, choose, proceed, onKeyDown };
}
export type Player<F extends BaseFrame> = ReturnType<typeof usePlayer<F>>;

/* ---------- small shared helpers ---------- */

/** Seeded RNG-free shuffle helper uses Math.random: only for the "Random" button. */
export const randInt = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1));
export const listStr = (xs: number[]) => `[${xs.join(", ")}]`;
