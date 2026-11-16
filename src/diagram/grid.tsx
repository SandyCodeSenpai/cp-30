/* Grid visual: a DP table or a grid map. Row/column labels, per-cell tones, "#" walls
   and curved dependency arrows between cells. Changed values pop once; new arrows draw in. */
import { useMemo, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { GridVisual, Tone } from "@/content/types";
import { measure, plain } from "./text";
import { AlgoCard, fmtList, headPath, isMono, toneClass, useBoxWidth, useMotion, useVersions, type P } from "./algo";

interface GridL { w: number; h: number; cell: number; cellW: number; gap: number; fs: number; radius: number;
  x0: number; y0: number; rows: number; cols: number; rowLabW: number; colLabH: number;
  cx: (c: number) => number; cy: (r: number) => number }

function layoutGrid(v: GridVisual, avail: number): GridL {
  const rows = v.cells.length, cols = Math.max(1, ...v.cells.map((r) => r.length), v.colLabels?.length ?? 0);
  const narrow = avail < 480;
  const gap = narrow ? 3 : 4, pad = 6;
  const rowLabW = v.rowLabels?.length ? Math.ceil(Math.max(...v.rowLabels.map((l) => measure(plain(l), 13, 500, true)))) + 12 : 0;
  const colLabH = v.colLabels?.length ? 24 : 0;
  const fit = Math.floor((avail - rowLabW - 2 * pad - (cols - 1) * gap) / cols);
  const cell = Math.max(30, Math.min(50, fit));
  const fs = cell >= 44 ? 16 : cell >= 36 ? 15 : 13;
  const textMax = Math.max(0, ...v.cells.flatMap((r) => r.map((x) => (x === "#" ? 0 : measure(String(x), fs, 600, isMono(x))))));
  const colLabMax = Math.max(0, ...(v.colLabels ?? []).map((l) => measure(plain(l), 13, 500, true)));
  const cellW = Math.max(cell, Math.ceil(textMax + 12), Math.ceil(colLabMax + 6));
  const x0 = pad + rowLabW, y0 = 4 + colLabH;
  const cx = (c: number) => x0 + c * (cellW + gap);
  const cy = (r: number) => y0 + r * (cell + gap);
  return {
    w: x0 + cols * cellW + (cols - 1) * gap + pad, h: y0 + rows * cell + Math.max(0, rows - 1) * gap + 6,
    cell, cellW, gap, fs, radius: cell >= 40 ? 9 : 7, x0, y0, rows, cols, rowLabW, colLabH, cx, cy,
  };
}

/** A dependency arrow that runs beside the cell text, not through it: offset to the left of travel, slightly bowed. */
function arrowGeom(L: GridL, from: [number, number], to: [number, number]) {
  const a: P = { x: L.cx(from[1]) + L.cellW / 2, y: L.cy(from[0]) + L.cell / 2 };
  const b: P = { x: L.cx(to[1]) + L.cellW / 2, y: L.cy(to[0]) + L.cell / 2 };
  const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
  const ux = dx / len, uy = dy / len, nx = uy, ny = -ux; // normal to the left of travel (up for a left-to-right arrow)
  const s = Math.min(L.cell, L.cellW);
  const off = s * 0.3, bow = Math.min(10, len * 0.12);
  const start: P = { x: a.x + ux * s * 0.12 + nx * off, y: a.y + uy * s * 0.12 + ny * off };
  const end: P = { x: b.x - ux * s * 0.2 + nx * off, y: b.y - uy * s * 0.2 + ny * off };
  const ctrl: P = { x: (start.x + end.x) / 2 + nx * bow, y: (start.y + end.y) / 2 + ny * bow };
  const head = 6.5;
  // pull the line back so it ends under the arrowhead, not past its tip
  const tdx = end.x - ctrl.x, tdy = end.y - ctrl.y, tl = Math.hypot(tdx, tdy) || 1;
  const lineEnd: P = { x: end.x - (tdx / tl) * head * 0.7, y: end.y - (tdy / tl) * head * 0.7 };
  const d = `M${start.x.toFixed(1)},${start.y.toFixed(1)} Q${ctrl.x.toFixed(1)},${ctrl.y.toFixed(1)} ${lineEnd.x.toFixed(1)},${lineEnd.y.toFixed(1)}`;
  return { d, head: headPath(end, tdx, tdy, head, 3.6) };
}

export function describeGrid(v: GridVisual): string {
  const rows = v.cells.length, cols = Math.max(0, ...v.cells.map((r) => r.length));
  const parts = [`Grid, ${rows} rows by ${cols} columns.`];
  if (v.colLabels?.length) parts.push(`Columns: ${v.colLabels.map(plain).join(", ")}.`);
  if (v.rowLabels?.length) parts.push(`Rows: ${v.rowLabels.map(plain).join(", ")}.`);
  v.cells.forEach((r, i) => parts.push(`Row ${v.rowLabels?.[i] ? plain(v.rowLabels[i]) : i}: ${r.map((x) => (x === "" ? "empty" : x === "#" ? "wall" : String(x))).join(", ")}.`));
  const ts = Object.entries(v.tones ?? {}).filter(([, t]) => t !== "neutral").map(([k, t]) => `cell ${k} ${t}`);
  if (ts.length) parts.push(`Marked: ${fmtList(ts)}.`);
  const as = (v.arrows ?? []).map((a) => `${a.from.join(",")} to ${a.to.join(",")}`);
  if (as.length) parts.push(`Arrows: ${fmtList(as)}.`);
  return parts.join(" ");
}

export function GridDiagram({ v }: { v: GridVisual }) {
  const host = useRef<HTMLDivElement>(null);
  const avail = useBoxWidth(host);
  const { reduced, fade } = useMotion();
  const L = useMemo(() => (avail > 0 ? layoutGrid(v, avail) : null), [v, avail]);
  const versions = useVersions(v.cells.flatMap((r, ri) => r.map((x, ci) => [`${ri},${ci}`, String(x)] as [string, string])));
  const aria = useMemo(() => describeGrid(v), [v]);
  const tones = v.tones ?? {};

  return (
    <AlgoCard kind="grid" hostRef={host} avail={avail} contentW={L?.w ?? 0} reduced={reduced}>
      {L && (
        <div className="dg-grid" role="img" aria-label={aria} style={{ width: L.w, height: L.h, ["--cell-r" as string]: `${L.radius}px` }}>
          {(v.colLabels ?? []).map((l, c) => (
            <span key={`cl${c}`} className="dg-grid-lab" aria-hidden="true" style={{ left: L.cx(c), top: 2, width: L.cellW, height: L.colLabH - 4 }}>{plain(l)}</span>
          ))}
          {(v.rowLabels ?? []).map((l, r) => (
            <span key={`rl${r}`} className="dg-grid-lab is-row" aria-hidden="true" style={{ left: 0, top: L.cy(r), width: L.x0 - 10, height: L.cell }}>{plain(l)}</span>
          ))}
          <AnimatePresence initial={false}>
            {v.cells.flatMap((row, r) => row.map((x, c) => {
              const k = `${r},${c}`, ver = versions.get(k) ?? 0, t: Tone | undefined = tones[k];
              const wall = x === "#", empty = x === "";
              return (
                <motion.div key={k} aria-hidden="true"
                  className={`dg-cell ${toneClass(t)}${wall ? " is-wall" : ""}${empty ? " is-empty" : ""}`}
                  style={{ left: L.cx(c), top: L.cy(r), width: L.cellW, height: L.cell, fontSize: L.fs }}
                  initial={{ opacity: 0, scale: 0.86 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={fade}>
                  {ver > 0 && !wall && <span key={`r${ver}`} className="dg-ripple" />}
                  {!wall && <span key={`v${ver}`} className={`dg-cell-v${isMono(x) ? " is-mono" : ""}${ver > 0 ? " is-pop" : ""}`}>{empty ? "" : String(x)}</span>}
                </motion.div>
              );
            }))}
          </AnimatePresence>
          {!!v.arrows?.length && (
            <svg className="dg-arrows" width={L.w} height={L.h} aria-hidden="true">
              <AnimatePresence initial={false}>
                {v.arrows.map((a) => {
                  const g = arrowGeom(L, a.from, a.to);
                  const key = `${a.from.join(",")}>${a.to.join(",")}`;
                  return (
                    <motion.g key={key} className={`dg-arrow ${toneClass(a.tone)}`}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={fade}>
                      <path className="dg-arrow-halo" d={g.d} />
                      <motion.path className="dg-arrow-line" d={g.d}
                        initial={reduced ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={reduced ? { duration: 0 } : { duration: 0.42, ease: [0.2, 0.8, 0.2, 1] }} />
                      <motion.path className="dg-arrow-head" d={g.head}
                        initial={reduced ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={reduced ? { duration: 0 } : { delay: 0.3, duration: 0.15 }} />
                    </motion.g>
                  );
                })}
              </AnimatePresence>
            </svg>
          )}
        </div>
      )}
    </AlgoCard>
  );
}
