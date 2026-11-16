import { useCallback, useRef, useState } from "react";
import { Segmented } from "@/ui";
import { useReducedMotion } from "@/lib/hooks";
import type { WidgetProps } from "../types";
import { TableMode } from "./TableMode";
import { BudgetMode } from "./BudgetMode";
import "./complexity.css";

type Mode = "table" | "budget";
const MODES: { value: Mode; label: string }[] = [
  { value: "table", label: "Ops and time" },
  { value: "budget", label: "Read the budget" },
];

/** Constraints to complexity: slide n, pick an O(), see operations and the run time in CPython and PyPy. */
export default function ComplexityLab(props: WidgetProps) {
  const given = props.mode === "table" || props.mode === "budget" ? (props.mode as Mode) : undefined;
  const n0 = typeof props.n === "number" && props.n > 0 ? props.n : undefined;
  const [mode, setMode] = useState<Mode>(given ?? "table");
  const reduce = useReducedMotion();
  const fired = useRef(false);
  const { onComplete } = props;
  const done = useCallback(() => { if (!fired.current) { fired.current = true; onComplete?.(); } }, [onComplete]);
  const showTabs = !props.compact || !given;
  return (
    <div className={`cx${props.compact ? " compact" : " full"}`}>
      {showTabs && (
        <div className="cx-tabs"><Segmented value={mode} options={MODES} onChange={setMode} /></div>
      )}
      {mode === "table" ? <TableMode key="t" n0={n0} reduce={reduce} compact={!!props.compact} onDone={done} /> : <BudgetMode key="b" n0={n0} reduce={reduce} onDone={done} />}
    </div>
  );
}
