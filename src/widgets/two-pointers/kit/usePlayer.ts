import { useCallback, useEffect, useRef, useState } from "react";
import type { Frame } from "./types";

export const SPEEDS = { slow: 1500, normal: 900, fast: 450 } as const;
export type Speed = keyof typeof SPEEDS;

/**
 * Playback over a precomputed frame list. Nothing is simulated here:
 * index moves, and Predict can hold the next frame back until it is answered.
 */
export function usePlayer(frames: Frame[], opts: { predictOn: boolean; onEnd?: () => void }) {
  const [idx, setIdxState] = useState(0);
  // Mirror of idx so fast repeated presses (keys, double clicks) never read a stale value.
  const idxRef = useRef(0);
  const setIdx = useCallback((v: number | ((i: number) => number)) => {
    const next = typeof v === "function" ? v(idxRef.current) : v;
    idxRef.current = next; setIdxState(next);
  }, []);
  const pendingRef = useRef<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<Speed>("normal");
  const [pending, setPendingState] = useState<number | null>(null);
  const setPending = useCallback((v: number | null) => { pendingRef.current = v; setPendingState(v); }, []);
  const answered = useRef(new Set<number>());
  const last = frames.length - 1;

  // A new input or mode means a new run: start over.
  useEffect(() => {
    setIdx(0); setPlaying(false); setPending(null); answered.current = new Set();
  }, [frames, setIdx, setPending]);

  const goTo = useCallback((next: number) => {
    if (next > last) return;
    if (opts.predictOn && frames[next]?.predict && !answered.current.has(next)) {
      setPending(next); setPlaying(false); return;
    }
    setIdx(next);
  }, [frames, last, opts.predictOn, setIdx, setPending]);

  const step = useCallback(() => { if (pendingRef.current === null) goTo(Math.min(idxRef.current + 1, last)); }, [goTo, last]);
  const back = useCallback(() => { setPending(null); setPlaying(false); setIdx((i) => Math.max(0, i - 1)); }, [setIdx, setPending]);
  const reset = useCallback(() => { setPending(null); setPlaying(false); setIdx(0); answered.current = new Set(); }, [setIdx, setPending]);
  const toggle = useCallback(() => {
    if (pending !== null) return;
    if (playing) { setPlaying(false); return; }
    if (idx >= last) { answered.current = new Set(); setIdx(0); }
    setPlaying(true);
  }, [idx, last, pending, playing, setIdx]);
  /** The reader answered the prediction: show the held frame. */
  const resolve = useCallback(() => {
    if (pending === null) return;
    answered.current.add(pending);
    setIdx(pending); setPending(null);
  }, [pending, setIdx, setPending]);

  useEffect(() => {
    if (!playing || pending !== null) return;
    if (idx >= last) { setPlaying(false); return; }
    const t = setTimeout(() => goTo(idx + 1), SPEEDS[speed]);
    return () => clearTimeout(t);
  }, [playing, pending, idx, last, speed, goTo]);

  const onEnd = useRef(opts.onEnd); onEnd.current = opts.onEnd;
  useEffect(() => { if (last > 0 && idx === last) onEnd.current?.(); }, [idx, last]);

  return { idx: Math.min(idx, last), last, playing, speed, setSpeed, pending, step, back, reset, toggle, resolve, setIdx };
}
