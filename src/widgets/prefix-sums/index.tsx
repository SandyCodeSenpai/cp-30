/**
 * Prefix sums lab. Modes: range-sum · subarray-count · difference · grid.
 * Props: mode?, nums?: number[] (array for range-sum / subarray-count; its length is n for difference),
 *        k?: number (subarray-count target), grid?: number[][] (grid mode).
 */
import { useCallback, useRef, useState } from "react";
import type { WidgetProps } from "../types";
import { ModeTabs } from "./kit/PlayerView";
import RangeSum from "./RangeSum";
import SubarrayCount from "./SubarrayCount";
import Difference from "./Difference";
import Grid2D from "./Grid2D";
import "./prefix.css";

type Mode = "range-sum" | "subarray-count" | "difference" | "grid";
const MODES: { value: Mode; label: string }[] = [
  { value: "range-sum", label: "Range sum" },
  { value: "subarray-count", label: "Count = k" },
  { value: "difference", label: "Difference" },
  { value: "grid", label: "2-D grid" },
];

const numList = (v: unknown): number[] | undefined =>
  Array.isArray(v) && v.length > 0 && v.every((x) => typeof x === "number" && Number.isFinite(x)) ? v.map((x) => Math.round(x)) : undefined;
const numGrid = (v: unknown): number[][] | undefined => {
  if (!Array.isArray(v) || v.length < 2 || v.length > 6) return undefined;
  const rows = v.map(numList);
  if (rows.some((r) => !r || r.length < 2 || r.length > 6 || r.length !== rows[0]!.length)) return undefined;
  return rows as number[][];
};

export default function PrefixSums(props: WidgetProps) {
  const locked = MODES.some((m) => m.value === props.mode) ? (props.mode as Mode) : null;
  const [mode, setMode] = useState<Mode>(locked ?? "range-sum");
  const done = useRef(false);
  const cb = useRef(props.onComplete); cb.current = props.onComplete;
  const onEnd = useCallback(() => { if (!done.current) { done.current = true; cb.current?.(); } }, []);
  const nums = numList(props.nums);
  const k = typeof props.k === "number" ? Math.round(props.k) : undefined;
  const grid = numGrid(props.grid);

  return (
    <div className="ak-root ps">
      {!locked && <ModeTabs modes={MODES} value={mode} onChange={setMode} />}
      {mode === "range-sum" && <RangeSum nums={nums} onEnd={onEnd} />}
      {mode === "subarray-count" && <SubarrayCount nums={nums} k={k} onEnd={onEnd} />}
      {mode === "difference" && <Difference nums={nums} onEnd={onEnd} />}
      {mode === "grid" && <Grid2D grid={grid} onEnd={onEnd} />}
    </div>
  );
}
