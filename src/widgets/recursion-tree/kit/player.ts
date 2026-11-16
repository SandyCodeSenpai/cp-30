/**
 * Step player shared by the recursion-tree and tree-walk labs.
 * A mode builds every frame up front with a pure function, so Back / Step / Play are index moves.
 */
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";

/** A 2-3 option question asked before moving from this frame to the next one (when Predict is on). */
export interface Ask { q: string; options: string[]; answer: number; why?: string }
export interface BaseFrame { line: number; line2?: number; say: string; ask?: Ask }

export type Speed = 0.5 | 1 | 2;
const DELAY: Record<Speed, number> = { 0.5: 1700, 1: 950, 2: 450 };

interface Asking { at: number; chosen: number | null; resume: boolean }

export function usePlayer<F extends BaseFrame>(frames: F[], onComplete?: () => void) {
  const last = Math.max(0, frames.length - 1);
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<Speed>(1);
  const [predict, setPredict] = useState(false);
  const [asking, setAsking] = useState<Asking | null>(null);
  const answered = useRef(new Set<number>());
  const completed = useRef(false);
  const cb = useRef(onComplete); cb.current = onComplete;

  // A new frames array is a new run: go back to the start.
  useEffect(() => { setIdx(0); setPlaying(false); setAsking(null); answered.current = new Set(); }, [frames]);

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
  const jumpEnd = useCallback(() => { setPlaying(false); setAsking(null); setIdx(last); }, [last]);
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
  }, [playing, asking, cur, speed, forward]);

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
      if (t.closest("button")) return; // let a focused button handle its own Space
      e.preventDefault(); toggle();
    }
  }, [asking, frames, choose, proceed, step, back, toggle]);

  return { frame: frames[cur], prev: cur > 0 ? frames[cur - 1] : undefined, cur, last, total: frames.length, playing, speed, setSpeed, predict, setPredict, asking, step, back, reset, jumpEnd, toggle, choose, proceed, onKeyDown };
}
export type Player<F extends BaseFrame> = ReturnType<typeof usePlayer<F>>;

/** Mark a frame's ask only for the first `limit` frames of one kind, so Predict does not nag. */
export function asker(limit = 3) {
  const seen = new Map<string, number>();
  return (kind: string, a: Ask): Ask | undefined => {
    const n = seen.get(kind) ?? 0;
    if (n >= limit) return undefined;
    seen.set(kind, n + 1);
    return a;
  };
}

/** Find the 0-based line index of the first line that contains `needle`. Throws in dev if missing. */
export function lineOf(code: string[], needle: string, from = 0): number {
  for (let i = from; i < code.length; i++) if (code[i].includes(needle)) return i;
  if (import.meta.env?.DEV) console.warn(`[lineOf] missing: ${needle}`);
  return 0;
}
