import { useCallback, useMemo, useRef, useState } from "react";
import { Segmented } from "@/ui";
import { useReducedMotion } from "@/lib/hooks";
import type { WidgetProps } from "../types";
import { FAMILIES } from "./data";
import { ScanMode } from "./ScanMode";
import { CardsMode } from "./CardsMode";
import "./triage.css";

type Mode = "scan" | "cards";
const MODES: { value: Mode; label: string }[] = [
  { value: "scan", label: "The 4-step scan" },
  { value: "cards", label: "Scan real cards" },
];

/** The 15-second triage: four quick questions narrow a list of candidate patterns. */
export default function TriageLab(props: WidgetProps) {
  const given = props.mode === "scan" || props.mode === "cards" ? (props.mode as Mode) : undefined;
  const upToDay = typeof props.upToDay === "number" && props.upToDay > 0 ? Math.floor(props.upToDay) : undefined;
  const [mode, setMode] = useState<Mode>(given ?? "scan");
  const reduce = useReducedMotion();
  const fired = useRef(false);
  const { onComplete } = props;
  const done = useCallback(() => { if (!fired.current) { fired.current = true; onComplete?.(); } }, [onComplete]);
  const families = useMemo(() => {
    const f = upToDay ? FAMILIES.filter((x) => x.day <= upToDay) : FAMILIES;
    return f.length >= 2 ? f : FAMILIES.slice(0, 2);
  }, [upToDay]);
  const showTabs = !props.compact || !given;
  return (
    <div className={`tg${props.compact ? " compact" : " full"}`}>
      {showTabs && <div className="tg-tabs"><Segmented value={mode} options={MODES} onChange={setMode} /></div>}
      {mode === "scan"
        ? <ScanMode key="s" families={families} reduce={reduce} onDone={done} />
        : <CardsMode key="c" families={families} upToDay={upToDay} reduce={reduce} onDone={done} />}
    </div>
  );
}
