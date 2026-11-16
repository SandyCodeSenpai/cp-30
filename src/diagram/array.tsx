/* Array visual: rows of square cells, an optional index row, pointers under cells and ranges over them.
   Built for flip books: pointers and ranges slide, tones cross-fade, changed values pop once. */
import { useMemo, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { ArrayVisual, Tone } from "@/content/types";
import { measure, plain } from "./text";
import { AlgoCard, fmtList, isMono, toneClass, useBoxWidth, useMotion, useVersions } from "./algo";

const CHIP_H = 20, CHIP_GAP = 3, CARET_H = 7, LANE_H = 22, IDX_H = 18, ROW_GAP = 18, LABEL_ABOVE_H = 20;

interface PtrL { key: string; label: string; tone: Tone; x: number; y: number; stack: number }
interface RangeL { key: string; label?: string; tone: Tone; x: number; w: number; lineY: number; labelShift: number }
interface RowL {
  label?: string; labelY: number; y: number; items: (string | number)[]; tones: Record<number, Tone>;
  ptrs: PtrL[]; ranges: RangeL[];
}
interface ArrL { w: number; h: number; cellW: number; cellH: number; fs: number; radius: number; labelW: number; labelAbove: boolean;
  colX: (i: number) => number; idxY: number | null; idxCount: number; rows: RowL[] }

function layoutArray(v: ArrayVisual, avail: number): ArrL {
  const narrow = avail < 480;
  const labels = v.rows.map((r) => r.label ? plain(r.label) : "");
  const hasLabels = labels.some(Boolean);
  const sideLabelW = hasLabels ? Math.ceil(Math.max(...labels.map((l) => measure(l, 13, 500, true)))) + 16 : 0;

  const n = Math.max(1, ...v.rows.map((r) => r.items.length));
  const ats = v.rows.flatMap((r) => (r.pointers ?? []).map((p) => p.at));
  const minIdx = Math.min(0, ...ats), maxIdx = Math.max(n - 1, ...ats);
  const cols = maxIdx - minIdx + 1;
  const padX = 10;
  const fitFor = (lw: number, g: number) => Math.floor((avail - lw - 2 * padX - (cols - 1) * g) / cols);
  // long rows: tighter gaps first, then move row labels above the rows, then shrink cells, then scroll
  const gap = narrow || fitFor(sideLabelW, 6) < 40 ? (fitFor(sideLabelW, 4) < 34 ? 3 : 4) : 6;
  const labelAbove = hasLabels && (narrow || fitFor(sideLabelW, gap) < 36);
  const labelW = labelAbove ? 0 : sideLabelW;
  const fit = fitFor(labelW, gap);
  const cell = Math.max(26, Math.min(52, fit));
  const fs = cell >= 46 ? 18 : cell >= 40 ? 16 : cell >= 36 ? 15 : cell >= 32 ? 14 : 13;
  const textMax = Math.max(0, ...v.rows.flatMap((r) => r.items.map((it) => measure(String(it), fs, 600, isMono(it)))));
  const cellW = Math.max(cell, Math.ceil(textMax + 10));
  const x0 = padX + labelW;
  const colX = (i: number) => x0 + (i - minIdx) * (cellW + gap);
  const w = x0 + cols * cellW + (cols - 1) * gap + padX;

  let y = 4;
  let idxY: number | null = null;
  const rows: RowL[] = v.rows.map((r, ri) => {
    const rowLabel = labels[ri] || undefined;
    let labelY = 0;
    if (labelAbove && rowLabel) { labelY = y; y += LABEL_ABOVE_H; }
    if (ri === 0 && v.indices) { idxY = y; y += IDX_H; }

    // ranges: clamp, then give each a lane so brackets and labels never overlap
    const len = Math.max(1, r.items.length);
    const raw = (r.ranges ?? []).map((g, gi) => ({ g, gi, from: Math.max(minIdx, Math.min(g.from, g.to)), to: Math.min(Math.max(len - 1, maxIdx), Math.max(g.from, g.to)) }))
      .filter((g) => g.from <= g.to);
    const lanes: number[] = []; // right edge per lane
    const placed = raw.sort((a, b) => a.from - b.from || b.to - a.to).map((g) => {
      const x = colX(g.from) - 3, w2 = colX(g.to) + cellW - colX(g.from) + 6;
      const lw = g.g.label ? measure(plain(g.g.label), 12, 600) + 4 : 0;
      const cx = x + w2 / 2;
      const left = Math.min(x, cx - lw / 2), right = Math.max(x + w2, cx + lw / 2);
      let lane = lanes.findIndex((edge) => edge + 8 <= left);
      if (lane < 0) { lane = lanes.length; lanes.push(right); } else lanes[lane] = right;
      const labelShift = Math.max(0, lw / 2 - cx + 2) - Math.max(0, cx + lw / 2 - w + 2);
      return { g, x, w: w2, lane, labelShift };
    });
    const rangeTop = y;
    y += lanes.length * LANE_H + (lanes.length ? 2 : 0);
    const cellsY = y;
    const ranges: RangeL[] = placed.map(({ g, x, w: w2, lane, labelShift }) => ({
      key: g.g.label ? `l:${g.g.label}` : `i:${g.gi}`, label: g.g.label, tone: g.g.tone ?? "accent", x, w: w2, labelShift,
      lineY: rangeTop + (lanes.length - 1 - lane) * LANE_H + LANE_H - 6,
    }));
    y += cell;

    // pointers: several on one cell stack downwards in the order given
    const seen = new Map<number, number>(), keys = new Map<string, number>();
    let maxStack = 0;
    const ptrTop = y + 4;
    const ptrs: PtrL[] = (r.pointers ?? []).map((p) => {
      const stack = seen.get(p.at) ?? 0; seen.set(p.at, stack + 1); maxStack = Math.max(maxStack, stack + 1);
      const k = keys.get(p.label) ?? 0; keys.set(p.label, k + 1);
      return { key: k ? `${p.label}#${k}` : p.label, label: p.label, tone: p.tone ?? "accent", x: colX(p.at) + cellW / 2, y: ptrTop + stack * (CHIP_H + CHIP_GAP), stack };
    });
    if (ptrs.length) y += 4 + CARET_H + 1 + maxStack * CHIP_H + (maxStack - 1) * CHIP_GAP;
    const row: RowL = { label: rowLabel, labelY, y: cellsY, items: r.items, tones: r.tones ?? {}, ptrs, ranges };
    if (ri < v.rows.length - 1) y += ROW_GAP;
    return row;
  });

  return { w, h: y + 4, cellW, cellH: cell, fs, radius: cell >= 40 ? 11 : cell >= 32 ? 9 : 7, labelW, labelAbove, colX, idxY, idxCount: n, rows };
}

export function describeArray(v: ArrayVisual): string {
  return v.rows.map((r, ri) => {
    const name = r.label ? plain(r.label) : v.rows.length > 1 ? `row ${ri + 1}` : "";
    const items = r.items.length ? r.items.map((x) => (x === "" ? "empty" : String(x))).join(", ") : "empty";
    const parts = [`Array${name ? ` ${name}` : ""}: ${items}.`];
    const ps = (r.pointers ?? []).map((p) => `${plain(p.label)} at index ${p.at}`);
    if (ps.length) parts.push(`Pointer${ps.length > 1 ? "s" : ""} ${fmtList(ps)}.`);
    for (const g of r.ranges ?? []) parts.push(`${g.label ? `Range ${plain(g.label)}` : "Range"} covers index ${g.from} to ${g.to}.`);
    const ts = Object.entries(r.tones ?? {}).filter(([, t]) => t !== "neutral").map(([i, t]) => `index ${i} ${t}`);
    if (ts.length) parts.push(`Marked: ${fmtList(ts)}.`);
    return parts.join(" ");
  }).join(" ");
}

export function ArrayDiagram({ v }: { v: ArrayVisual }) {
  const host = useRef<HTMLDivElement>(null);
  const avail = useBoxWidth(host);
  const { reduced, move, fade } = useMotion();
  const L = useMemo(() => (avail > 0 ? layoutArray(v, avail) : null), [v, avail]);
  const versions = useVersions(v.rows.flatMap((r, ri) => r.items.map((it, i) => [`${ri}:${i}`, String(it)] as [string, string])));
  const aria = useMemo(() => describeArray(v), [v]);

  return (
    <AlgoCard kind="array" hostRef={host} avail={avail} contentW={L?.w ?? 0} reduced={reduced}>
      {L && (
        <div className="dg-arr" role="img" aria-label={aria} style={{ width: L.w, height: L.h, ["--cell-r" as string]: `${L.radius}px` }}>
          {L.idxY !== null && Array.from({ length: L.idxCount }, (_, i) => (
            <span key={`ix${i}`} className="dg-arr-idx" aria-hidden="true" style={{ left: L.colX(i), top: L.idxY!, width: L.cellW }}>{i}</span>
          ))}
          {L.rows.map((r, ri) => (
            <div key={ri} className="dg-arr-row" aria-hidden="true">
              {r.label && (L.labelAbove
                ? <span className="dg-arr-label is-above" style={{ left: L.colX(0), top: r.labelY }}>{r.label}</span>
                : <span className="dg-arr-label" style={{ left: 0, width: L.labelW - 12, top: r.y, height: L.cellH }}>{r.label}</span>)}

              <AnimatePresence initial={false}>
                {r.ranges.map((g) => (
                  <motion.div key={`band-${g.key}`} className={`dg-range-band ${toneClass(g.tone)}`}
                    style={{ left: 0, top: r.y - 3, height: L.cellH + 6 }}
                    initial={{ opacity: 0, x: g.x, width: g.w }} animate={{ opacity: 1, x: g.x, width: g.w }} exit={{ opacity: 0 }}
                    transition={{ x: move, width: move, opacity: fade }} />
                ))}
                {r.ranges.map((g) => (
                  <motion.div key={`br-${g.key}`} className={`dg-range ${toneClass(g.tone)}`}
                    style={{ left: 0, top: g.lineY }}
                    initial={{ opacity: 0, x: g.x, width: g.w }} animate={{ opacity: 1, x: g.x, width: g.w }} exit={{ opacity: 0 }}
                    transition={{ x: move, width: move, opacity: fade }}>
                    {g.label && <span className="dg-range-label" style={{ marginLeft: g.labelShift }}>{plain(g.label)}</span>}
                  </motion.div>
                ))}
              </AnimatePresence>

              <AnimatePresence initial={false}>
                {r.items.map((it, i) => {
                  const ver = versions.get(`${ri}:${i}`) ?? 0;
                  const empty = it === "";
                  return (
                    <motion.div key={`c${i}`} className={`dg-cell ${toneClass(r.tones[i])}${empty ? " is-empty" : ""}`}
                      style={{ left: L.colX(i), top: r.y, width: L.cellW, height: L.cellH, fontSize: L.fs }}
                      initial={{ opacity: 0, scale: 0.86 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.86 }} transition={fade}>
                      {ver > 0 && <span key={`r${ver}`} className="dg-ripple" />}
                      <span key={`v${ver}`} className={`dg-cell-v${isMono(it) ? " is-mono" : ""}${ver > 0 ? " is-pop" : ""}`}>{empty ? "" : String(it)}</span>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              <AnimatePresence initial={false}>
                {r.ptrs.map((p) => (
                  <motion.div key={`p-${p.key}`} className={`dg-ptr ${toneClass(p.tone)}`} style={{ left: 0, top: 0 }}
                    initial={{ opacity: 0, x: p.x, y: p.y + 6 }} animate={{ opacity: 1, x: p.x, y: p.y }} exit={{ opacity: 0, y: p.y + 6 }}
                    transition={{ x: move, y: move, opacity: fade }}>
                    <svg className="dg-ptr-caret" width="12" height={CARET_H} viewBox={`0 0 12 ${CARET_H}`} style={{ opacity: p.stack ? 0 : 1 }}>
                      <path d={`M6 0.5 L11 ${CARET_H} L1 ${CARET_H} Z`} />
                    </svg>
                    <span className="dg-ptr-chip">{plain(p.label)}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ))}
        </div>
      )}
    </AlgoCard>
  );
}
