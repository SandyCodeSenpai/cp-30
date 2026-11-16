/** Range-query lab: Fenwick tree, iterative segment tree, coordinate compression (Day 25). */
import { useState } from "react";
import { Segmented } from "@/ui";
import type { WidgetProps } from "../types";
import FenwickMode, { FW_DEFAULT } from "./Fenwick";
import SegTreeMode, { SEG_DEFAULT } from "./SegTree";
import CompressMode, { CMP_DEFAULT } from "./Compress";
import "./rq.css";

type Mode = "fenwick" | "segment-tree" | "compress";
const MODES: { value: Mode; label: string }[] = [
  { value: "fenwick", label: "Fenwick" }, { value: "segment-tree", label: "Segment tree" }, { value: "compress", label: "Compress" },
];

function validNums(v: unknown, min: number, max: number, minLen = 4, maxLen = 16): number[] | null {
  if (!Array.isArray(v) || v.length < minLen || v.length > maxLen) return null;
  if (!v.every((x) => typeof x === "number" && Number.isInteger(x) && x >= min && x <= max)) return null;
  return v as number[];
}

export default function RangeQuery(props: WidgetProps) {
  const locked = MODES.some((m) => m.value === props.mode) ? (props.mode as Mode) : null;
  const [mode, setMode] = useState<Mode>(locked ?? "fenwick");
  const m = locked ?? mode;
  const tabs = locked ? undefined : <Segmented<Mode> value={m} onChange={setMode} options={MODES} label="Mode" />;
  const nums = props.nums;
  if (m === "segment-tree") return <SegTreeMode key={m} tabs={tabs} onComplete={props.onComplete} nums={validNums(nums, -99, 99) ?? SEG_DEFAULT} />;
  if (m === "compress") return <CompressMode key={m} tabs={tabs} onComplete={props.onComplete} nums={validNums(nums, -1_000_000_000, 1_000_000_000, 3, 12) ?? CMP_DEFAULT} />;
  return <FenwickMode key={m} tabs={tabs} onComplete={props.onComplete} nums={validNums(nums, -20, 99) ?? FW_DEFAULT} />;
}
