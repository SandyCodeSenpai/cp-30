/**
 * Step-player engine shared by the prefix-sums and mono-stack labs.
 * A mode turns its input into a list of frames with a pure function. Each frame is a full snapshot
 * (state + running code line + one-sentence narration), so Step back, Step, Play and scrubbing are
 * just moves of an index.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import type { Tone } from "@/content/types";

export interface Predict {
  q: string;
  options: string[];
  answer: number;
  why: string;
}

export interface Frame<S> {
  /** 1-based line in the code panel that is running in this frame. */
  line: number;
  /** One short sentence. Text inside `backticks` renders as code. */
  say: string;
  s: S;
  vars?: [string, string | number][];
  /** Asked before this frame is shown, when Predict is on. */
  predict?: Predict;
  tone?: Tone;
}

export type Speed = "slow" | "normal" | "fast";
const DELAY: Record<Speed, number> = { slow: 1500, normal: 850, fast: 380 };

export interface PlayerApi<S> {
  frames: Frame<S>[];
  i: number;
  frame: Frame<S>;
  last: number;
  playing: boolean;
  speed: Speed;
  predictOn: boolean;
  /** Index of the frame whose predict question is open, or null. */
  pending: number | null;
  touched: boolean;
  setSpeed: (s: Speed) => void;
  setPredictOn: (v: boolean) => void;
  step: () => void;
  back: () => void;
  toggle: () => void;
  reset: () => void;
  jump: (i: number) => void;
  resolve: () => void;
}

/**
 * @param resetKey when it changes (new input, new mode) the player rewinds to frame 0.
 * @param onEnd called every time the last frame is reached; the caller decides what "once" means.
 */
export function usePlayer<S>(frames: Frame<S>[], resetKey: string, onEnd?: () => void): PlayerApi<S> {
  const [rawI, setRawI] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<Speed>("normal");
  const [predictOn, setPredictOnState] = useState(false);
  const [pending, setPendingState] = useState<number | null>(null);
  const [touched, setTouched] = useState(false);
  const last = Math.max(0, frames.length - 1);
  const i = Math.min(rawI, last);

  // Refs mirror state so rapid clicks (faster than a render) never act on a stale index.
  const iRef = useRef(0), pendRef = useRef<number | null>(null), predRef = useRef(false);
  const framesRef = useRef(frames); framesRef.current = frames;
  const lastRef = useRef(last); lastRef.current = last;
  const answered = useRef(new Set<number>());
  const resumeAfter = useRef(false);
  iRef.current = Math.min(iRef.current, last);
  const setI = (n: number) => { iRef.current = n; setRawI(n); };
  const setPending = (n: number | null) => { pendRef.current = n; setPendingState(n); };

  useEffect(() => {
    setI(0); setPlaying(false); setPending(null); answered.current = new Set(); resumeAfter.current = false;
  }, [resetKey]);

  const forward = useCallback((fromPlay: boolean) => {
    const cur = iRef.current, L = lastRef.current;
    if (pendRef.current !== null) return;
    if (cur >= L) { setPlaying(false); return; }
    const nxt = cur + 1;
    if (predRef.current && framesRef.current[nxt]?.predict && !answered.current.has(nxt)) {
      resumeAfter.current = fromPlay;
      setPlaying(false);
      setPending(nxt);
      return;
    }
    setI(nxt);
  }, []);

  // Play loop: one frame per tick, paused while a predict question is open.
  useEffect(() => {
    if (!playing || pending !== null) return;
    if (i >= last) { setPlaying(false); return; }
    const t = setTimeout(() => forward(true), DELAY[speed]);
    return () => clearTimeout(t);
  }, [playing, pending, i, last, speed, forward]);

  const endRef = useRef(onEnd); endRef.current = onEnd;
  useEffect(() => { if (frames.length > 1 && i === last) endRef.current?.(); }, [i, last, frames.length]);

  const touch = () => setTouched(true);
  return {
    frames, i, frame: frames[i], last, playing, speed, predictOn, pending, touched,
    setSpeed,
    setPredictOn: (v) => { predRef.current = v; setPredictOnState(v); if (!v) setPending(null); },
    step: () => { touch(); if (pendRef.current !== null) return; setPlaying(false); forward(false); },
    back: () => { touch(); setPlaying(false); if (pendRef.current !== null) { setPending(null); return; } setI(Math.max(0, iRef.current - 1)); },
    toggle: () => {
      touch();
      if (pendRef.current !== null) return;
      if (playing) { setPlaying(false); return; }
      if (iRef.current >= lastRef.current) setI(0);
      setPlaying(true);
    },
    reset: () => { touch(); setPlaying(false); setPending(null); setI(0); answered.current = new Set(); },
    jump: (n) => { touch(); setPlaying(false); setPending(null); setI(Math.max(0, Math.min(lastRef.current, n))); },
    resolve: () => {
      const p = pendRef.current;
      if (p === null) return;
      answered.current.add(p);
      setI(p);
      setPending(null);
      if (resumeAfter.current) setPlaying(true);
      resumeAfter.current = false;
    },
  };
}

/** Deterministic shuffle of options (keeps the answer index right). */
export function makePredict(q: string, correct: string, wrong: string[], why: string, seed = 0): Predict {
  const uniq = [correct, ...wrong.filter((w, k) => w !== correct && wrong.indexOf(w) === k)].slice(0, 4);
  const order = uniq.map((_, k) => k);
  let s = (seed * 2654435761 + 12345) >>> 0;
  for (let k = order.length - 1; k > 0; k--) { s = (s * 1664525 + 1013904223) >>> 0; const j = s % (k + 1); [order[k], order[j]] = [order[j], order[k]]; }
  return { q, options: order.map((k) => uniq[k]), answer: order.indexOf(0), why };
}
