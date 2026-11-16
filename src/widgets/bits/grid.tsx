/** Aligned binary rows: bit columns line up so the reader can compute an operation one column at a time. */
import type { CSSProperties, ReactNode } from "react";
import { motion } from "framer-motion";
import { useReducedMotion } from "@/lib/hooks";

export interface GridRow {
  key: string;
  /** Short label left of the bits, for example "x", "& y", "=". */
  label: ReactNode;
  /** Bits, LSB first, length w. */
  bits: number[];
  /** Value text on the right. */
  value?: ReactNode;
  /** How many low bits are visible (default all). */
  reveal?: number;
  /** Clickable input row. */
  onToggle?: (bit: number) => void;
  /** in = input, mid = intermediate, res = result. */
  tone?: "in" | "mid" | "res" | "dim";
  /** Draw a rule above this row (the "=" line of hand arithmetic). */
  rule?: boolean;
  /** Bits to emphasise (outline), LSB index. */
  mark?: number[];
  /** Bits to show as "outside the mask" (faded). */
  fade?: number[];
  /** Small marks above cells (for example carries), LSB first. */
  over?: (string | null)[];
  /** Text cells instead of bits (for count rows), LSB first. */
  texts?: (string | null)[];
  ariaName?: string;
}

/** Cell size that fits the container. */
export function cellSize(avail: number, w: number, labelW: number, valueW: number, max = 38, min = 20, nibble = true, gapX = 3) {
  // every column has a gapX gap; nibble gaps add another 4px column (plus its gap) every 4 bits
  const nib = nibble && w > 4 ? Math.floor((w - 1) / 4) * (4 + gapX) : 0;
  const fit = Math.floor((avail - labelW - valueW - nib - 6) / w) - gapX;
  return Math.max(min, Math.min(max, fit));
}

export function BitGrid({ w, rows, cell, labelW, valueW, col, src, header = "index", signed, nibbleGap = true, gapX = 3, noValue }: {
  w: number; rows: GridRow[]; cell: number; labelW: number; valueW: number;
  /** Active bit column (LSB index), highlighted across all rows. */
  col?: number | null;
  /** Secondary highlight: [rowIndex, bit]. */
  src?: [number, number] | null;
  header?: "index" | "weight" | "both" | "none";
  signed?: boolean;
  nibbleGap?: boolean;
  gapX?: number;
  /** Drop the value column (narrow screens show values elsewhere). */
  noValue?: boolean;
}) {
  const reduce = useReducedMotion();
  const gap = nibbleGap && w > 4 ? 4 : 0;
  // column template: label, then bits MSB..LSB with a small gap after every 4 bits, then value.
  const colsT: string[] = [`${labelW}px`];
  const colOf: number[] = new Array(w).fill(2);
  for (let j = 0; j < w; j++) {
    const bit = w - 1 - j;
    colsT.push(`${cell}px`);
    colOf[bit] = colsT.length;
    if (gap && bit > 0 && bit % 4 === 0) colsT.push(`${gap}px`);
  }
  if (!noValue) colsT.push(`minmax(${valueW}px, auto)`);
  const gridCol = (bit: number) => colOf[bit];
  const valueCol = noValue ? colsT.length + 1 : colsT.length;
  const hasOver = rows.some((r) => r.over && r.over.some(Boolean));
  const style = { gridTemplateColumns: colsT.join(" "), columnGap: gapX, "--c": `${cell}px` } as CSSProperties;
  const showWeight = header === "weight" || header === "both";
  const showIndex = header === "index" || header === "both";
  const weight = (b: number) => (signed && b === w - 1 ? `-${2 ** b}` : String(2 ** b));
  let gr = 1;
  const out: ReactNode[] = [];
  if (showIndex) {
    out.push(<div key="hi-l" className="bg-hl" style={{ gridRow: gr, gridColumn: 1 }}>bit</div>);
    for (let b = 0; b < w; b++) out.push(<div key={`hi${b}`} className={`bg-head${col === b ? " on" : ""}`} style={{ gridRow: gr, gridColumn: gridCol(b) }}>{b}</div>);
    gr++;
  }
  if (showWeight) {
    out.push(<div key="hw-l" className="bg-hl" style={{ gridRow: gr, gridColumn: 1 }}>worth</div>);
    for (let b = 0; b < w; b++) out.push(<div key={`hw${b}`} className={`bg-head w${col === b ? " on" : ""}${signed && b === w - 1 ? " neg" : ""}`} style={{ gridRow: gr, gridColumn: gridCol(b) }}>{weight(b)}</div>);
    gr++;
  }
  rows.forEach((r, ri) => {
    if (r.rule) { out.push(<div key={`rule${ri}`} className="bg-rule" style={{ gridRow: gr, gridColumn: `1 / ${colsT.length + 1}` }} />); gr++; }
    if (hasOver && r.over) {
      for (let b = 0; b < w; b++) {
        const o = r.over[b];
        if (o) out.push(<div key={`ov${ri}-${b}`} className="bg-over" style={{ gridRow: gr, gridColumn: gridCol(b) }}>{o}</div>);
      }
      gr++;
    }
    out.push(<div key={`l${ri}`} className={`bg-label t-${r.tone ?? "mid"}`} style={{ gridRow: gr, gridColumn: 1 }}>{r.label}</div>);
    const reveal = r.reveal ?? w;
    if (r.texts) {
      for (let b = 0; b < w; b++) {
        const t = r.texts[b];
        out.push(<div key={`c${ri}-${b}`} className={`bg-txt${t === null ? " empty" : ""}${col === b ? " colon" : ""}`} style={{ gridRow: gr, gridColumn: gridCol(b) }}>{t ?? ""}</div>);
      }
      if (!noValue) out.push(<div key={`v${ri}`} className={`bg-val t-${r.tone ?? "mid"}`} style={{ gridRow: gr, gridColumn: valueCol }}>{r.value}</div>);
      gr++;
      return;
    }
    for (let b = 0; b < w; b++) {
      const shown = b < reveal;
      const v = r.bits[b] ?? 0;
      const cls = `bg-cell t-${r.tone ?? "mid"} ${shown ? (v ? "one" : "zero") : "hidden"}${r.mark?.includes(b) ? " mark" : ""}${r.fade?.includes(b) ? " fade" : ""}${src && src[0] === ri && src[1] === b ? " src" : ""}${col === b ? " colon" : ""}`;
      const inner = shown
        ? <motion.span key={`v${v}`} initial={reduce ? false : { scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 440, damping: 26 }}>{v}</motion.span>
        : null;
      const pos = { gridRow: gr, gridColumn: gridCol(b) };
      if (r.onToggle) {
        out.push(
          <button key={`c${ri}-${b}`} type="button" className={cls} style={pos} onClick={() => r.onToggle?.(b)}
            aria-label={`Bit ${b} of ${r.ariaName ?? "x"} is ${v}. Click to flip it.`} aria-pressed={!!v}>{inner}</button>,
        );
      } else {
        out.push(<div key={`c${ri}-${b}`} className={cls} style={pos} aria-hidden="true">{inner}</div>);
      }
    }
    if (!noValue) out.push(<div key={`v${ri}`} className={`bg-val t-${r.tone ?? "mid"}`} style={{ gridRow: gr, gridColumn: valueCol }}>{r.value}</div>);
    gr++;
  });
  const band = col !== null && col !== undefined && col >= 0 && col < w
    ? <motion.div className="bg-band" aria-hidden="true" layout={!reduce} transition={{ type: "spring", stiffness: 440, damping: 36 }}
        style={{ gridRow: `1 / ${gr}`, gridColumn: gridCol(col) }} />
    : null;
  return (
    <div className="bg-scroll">
      <div className="bg-grid" style={style}>
        {band}
        {out}
      </div>
    </div>
  );
}

export const toBits = (v: number, w: number) => {
  const out: number[] = [];
  // two's complement for negatives, at width w
  const u = ((v % 2 ** w) + 2 ** w) % 2 ** w;
  for (let b = 0; b < w; b++) out.push(Math.floor(u / 2 ** b) % 2);
  return out;
};
export const binStr = (v: number, w: number) => toBits(v, w).slice().reverse().join("");
