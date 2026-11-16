import { useCallback, useEffect, useState, type KeyboardEvent } from "react";
import { BUDGETS, SHAPES, SKIP, WANTS, type Choices, type Family, type StepId } from "./data";
import { STEPS, useScan } from "./Scan";

const ORDER: StepId[] = STEPS.map((s) => s.id);

export function optionIds(step: StepId, triggers: string[]): string[] {
  if (step === "budget") return BUDGETS.map((b) => b.id);
  if (step === "want") return WANTS.map((w) => w.id);
  if (step === "shape") return SHAPES.map((s) => s.id);
  return triggers;
}

/** Shared scan state for both modes: choices, the open step, derived candidates, keyboard. */
export function useScanState(families: Family[]) {
  const [c, setC] = useState<Choices>({});
  const [open, setOpen] = useState<StepId>("budget");
  const scan = useScan(families, c);

  // A trigger chosen earlier may vanish when an earlier step changes: clear it.
  useEffect(() => {
    if (c.trigger && c.trigger !== SKIP && !scan.triggers.includes(c.trigger)) setC((x) => ({ ...x, trigger: undefined }));
  }, [c.trigger, scan.triggers]);

  const choose = useCallback((step: StepId, v: string) => {
    setC((prev) => {
      const nextC = { ...prev, [step]: prev[step] === v && v !== SKIP ? undefined : v };
      const after = ORDER.slice(ORDER.indexOf(step) + 1).find((s) => !nextC[s]);
      if (nextC[step] && after) setOpen(after);
      return nextC;
    });
  }, []);

  const reset = useCallback(() => { setC({}); setOpen("budget"); }, []);

  const onKey = useCallback((e: KeyboardEvent<HTMLElement>) => {
    const t = e.target as HTMLElement;
    if (t.tagName === "INPUT" || t.tagName === "TEXTAREA") return;
    if (/^[1-9]$/.test(e.key)) {
      const ids = optionIds(open, scan.triggers);
      const id = ids[Number(e.key) - 1];
      if (id) { e.preventDefault(); choose(open, id); }
    }
  }, [open, scan.triggers, choose]);

  return { c, setC, open, setOpen, scan, choose, reset, onKey };
}
