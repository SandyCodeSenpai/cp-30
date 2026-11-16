/** String-matching lab: prefix function (KMP), Z-function, rolling hash (Day 26). */
import { useState } from "react";
import { Segmented } from "@/ui";
import type { WidgetProps } from "../types";
import KmpMode, { KMP_PAT, KMP_TEXT } from "./Kmp";
import ZMode, { Z_DEFAULT } from "./ZMode";
import HashMode, { HASH_PAT, HASH_TEXT } from "./Hash";
import "../range-query/rq.css";
import "./sm.css";

type Mode = "kmp" | "z" | "rolling-hash";
const MODES: { value: Mode; label: string }[] = [{ value: "kmp", label: "KMP" }, { value: "z", label: "Z array" }, { value: "rolling-hash", label: "Rolling hash" }];

const okStr = (v: unknown, min: number, max: number, re = /^[A-Za-z0-9]+$/): v is string => typeof v === "string" && v.length >= min && v.length <= max && re.test(v);

export default function StringMatch(props: WidgetProps) {
  const locked = MODES.some((m) => m.value === props.mode) ? (props.mode as Mode) : null;
  const [mode, setMode] = useState<Mode>(locked ?? "kmp");
  const m = locked ?? mode;
  const tabs = locked ? undefined : <Segmented<Mode> value={m} onChange={setMode} options={MODES} label="Mode" />;
  const text = okStr(props.text, 3, 16) ? props.text : null;
  const pat = okStr(props.pattern, 1, 6) && (!text || props.pattern.length <= text.length) ? (props.pattern as string) : null;
  if (m === "z") {
    const zs = text && pat && pat.length + 1 + text.length <= 16 ? `${pat}$${text}` : okStr(props.text, 2, 16, /^[A-Za-z0-9#$]+$/) ? props.text : Z_DEFAULT;
    return <ZMode key={m} tabs={tabs} onComplete={props.onComplete} s={zs} />;
  }
  if (m === "rolling-hash") return <HashMode key={m} tabs={tabs} onComplete={props.onComplete} text={text && pat ? text : HASH_TEXT} pattern={text && pat ? pat : HASH_PAT} />;
  return <KmpMode key={m} tabs={tabs} onComplete={props.onComplete} text={text && pat ? text : KMP_TEXT} pattern={text && pat ? pat : KMP_PAT} />;
}
