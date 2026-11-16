/**
 * Monotonic stack and deque lab. Modes: next-greater (Daily Temperatures) · histogram (largest rectangle) · window-max (deque).
 * Props: mode?, nums?: number[], k?: number (window size for window-max).
 * The step player, code panel and input editor are shared with the prefix-sums lab (../prefix-sums/kit).
 */
import { useCallback, useRef, useState } from "react";
import type { WidgetProps } from "../types";
import { ModeTabs } from "../prefix-sums/kit/PlayerView";
import NextGreater from "./NextGreater";
import Histogram from "./Histogram";
import WindowMax from "./WindowMax";
import "./mono.css";

type Mode = "next-greater" | "histogram" | "window-max";
const MODES: { value: Mode; label: string }[] = [
  { value: "next-greater", label: "Next greater" },
  { value: "histogram", label: "Histogram" },
  { value: "window-max", label: "Window max" },
];
const numList = (v: unknown): number[] | undefined =>
  Array.isArray(v) && v.length > 0 && v.every((x) => typeof x === "number" && Number.isFinite(x)) ? v.map((x) => Math.round(x)) : undefined;

export default function MonoStack(props: WidgetProps) {
  const locked = MODES.some((m) => m.value === props.mode) ? (props.mode as Mode) : null;
  const [mode, setMode] = useState<Mode>(locked ?? "next-greater");
  const done = useRef(false);
  const cb = useRef(props.onComplete); cb.current = props.onComplete;
  const onEnd = useCallback(() => { if (!done.current) { done.current = true; cb.current?.(); } }, []);
  const nums = numList(props.nums);
  const k = typeof props.k === "number" ? Math.round(props.k) : undefined;
  return (
    <div className="ak-root ms">
      {!locked && <ModeTabs modes={MODES} value={mode} onChange={setMode} />}
      {mode === "next-greater" && <NextGreater nums={nums} onEnd={onEnd} />}
      {mode === "histogram" && <Histogram nums={nums} onEnd={onEnd} />}
      {mode === "window-max" && <WindowMax nums={nums} k={k} onEnd={onEnd} />}
    </div>
  );
}
