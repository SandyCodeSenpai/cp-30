/**
 * Bit playground lab.
 * Modes (props.mode): basics · subsets · xor-tricks · per-bit. Props: x?: number (starting x in basics, the mask in subsets).
 */
import { useState } from "react";
import { Segmented } from "@/ui";
import type { WidgetProps } from "../types";
import { numProp } from "./kit/player";
import Basics from "./Basics";
import Subsets from "./Subsets";
import XorTricks from "./XorTricks";
import PerBit from "./PerBit";
import "./bits.css";

type Mode = "basics" | "subsets" | "xor-tricks" | "per-bit";
const MODES: { value: Mode; label: string }[] = [
  { value: "basics", label: "Basics" },
  { value: "subsets", label: "Subsets" },
  { value: "xor-tricks", label: "XOR tricks" },
  { value: "per-bit", label: "Per bit" },
];

export default function BitsLab(props: WidgetProps) {
  const given = MODES.find((m) => m.value === props.mode)?.value;
  const [mode, setMode] = useState<Mode>(given ?? "basics");
  const x0 = numProp(props.x);
  const showTabs = !given || props.compact === false;
  const tabs = showTabs ? <Segmented<Mode> value={mode} onChange={setMode} options={MODES} /> : undefined;
  const common = { tabs, onComplete: props.onComplete };
  return (
    <div className="bt-root">
      {mode === "basics" && <Basics key="b" x0={x0} {...common} />}
      {mode === "subsets" && <Subsets key="s" x0={x0} {...common} />}
      {mode === "xor-tricks" && <XorTricks key="x" {...common} />}
      {mode === "per-bit" && <PerBit key="p" {...common} />}
    </div>
  );
}
