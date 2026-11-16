import { useState } from "react";
import { DEMOS, FLIPBOOKS } from "@/diagram/demo";
import { Visual } from "@/diagram";
import type { Visual as V } from "@/content/types";
import { Button } from "@/ui";

/** One visual repeated across steps, like the lesson player does: the Visual stays mounted, so changes animate. */
function FlipBook({ title, frames, n }: { title: string; frames: V[]; n: number }) {
  const [i, setI] = useState(0);
  return (
    <section aria-label={title} style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <h2 style={{ margin: 0, fontSize: 17, lineHeight: "22px", fontWeight: 600, color: "var(--ink)" }}>{title}</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span aria-live="polite" style={{ fontSize: 14, color: "var(--muted)", fontVariantNumeric: "tabular-nums", minWidth: 76, textAlign: "right" }}>Step {i + 1} of {frames.length}</span>
          <Button size="s" data-fb={`prev-${n}`} onClick={() => setI((x) => Math.max(0, x - 1))} disabled={i === 0}>Prev</Button>
          <Button size="s" variant="primary" data-fb={`next-${n}`} onClick={() => setI((x) => Math.min(frames.length - 1, x + 1))} disabled={i === frames.length - 1}>Next</Button>
        </div>
      </div>
      <Visual visual={frames[i]} />
    </section>
  );
}

export default function DiagramHarness() {
  return (
    <div style={{ padding: "24px 16px", display: "grid", gap: 40, maxWidth: 760, margin: "0 auto", boxSizing: "border-box", width: "100%" }}>
      <h1 style={{ margin: 0, fontSize: 28, lineHeight: "34px", fontWeight: 700, color: "var(--ink)" }}>Diagram engine</h1>
      {FLIPBOOKS.map((f, n) => <FlipBook key={f.title} title={f.title} frames={f.frames} n={n} />)}
      <h2 style={{ margin: "8px 0 0", fontSize: 22, lineHeight: "28px", fontWeight: 600, color: "var(--ink)" }}>Every visual kind</h2>
      {DEMOS.map((v, i) => <div key={i}><Visual visual={v} /></div>)}
    </div>
  );
}
