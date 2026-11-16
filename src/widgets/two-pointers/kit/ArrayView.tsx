import { useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { springs } from "@/ui";
import { useWidth } from "@/lib/hooks";
import { clamp } from "@/lib/format";
import type { Band, Pointer, View } from "./types";

const LEVEL = 26;   // vertical step between stacked pointer labels
const PILL_H = 22;

/** Estimated pill width for a label (12-13px mono, 600). */
const pillW = (label: string, fs: number) => Math.round(label.length * fs * 0.62 + 16);

/** Greedy lanes: a pointer goes to the lowest level where its label does not touch another label. */
function stack(ps: Pointer[], pitch: number, fs: number): Map<string, number> {
  const out = new Map<string, number>();
  const rights: number[] = [];
  const vis = ps.filter((p) => p.at !== null).sort((a, b) => (a.at! - b.at!) || ps.indexOf(a) - ps.indexOf(b));
  for (const p of vis) {
    const c = p.at! * pitch + pitch / 2, half = pillW(p.label, fs) / 2;
    let lv = 0;
    while (rights[lv] !== undefined && c - half < rights[lv] + 4) lv++;
    rights[lv] = c + half;
    out.set(p.id, lv);
  }
  return out;
}

/**
 * A row of cells with animated pointers and a soft window band.
 * Width-aware: cell size follows the container, never below 12px text.
 */
export function ArrayView({ view, reduce, label, all }: { view: View; reduce: boolean; label: string; all?: Pointer[][] }) {
  const ref = useRef<HTMLDivElement>(null);
  const measured = useWidth(ref);
  const W = measured || 560;
  const n = Math.max(1, view.cells.length);
  const pitch = clamp(Math.floor((W - 16) / n), 20, 62);
  const gap = pitch >= 44 ? 8 : pitch >= 30 ? 5 : 3;
  const cw = pitch - gap;
  const ch = clamp(cw + 4, 28, 52);
  const fs = clamp(Math.round(cw * 0.36), 12, 18);
  const pfs = pitch >= 30 ? 13 : 12;
  const rowW = pitch * n;

  const top = view.pointers.filter((p) => p.side === "top");
  const bottom = view.pointers.filter((p) => p.side !== "top");
  const topLv = stack(top, pitch, pfs), botLv = stack(bottom, pitch, pfs);
  // Reserve lanes for the most crowded frame of the run, so the stage height never jumps.
  const lanes = useMemo(() => {
    let t = 0, b = 0;
    for (const ps of all ?? [view.pointers]) {
      const tl = stack(ps.filter((p) => p.side === "top"), pitch, pfs), bl = stack(ps.filter((p) => p.side !== "top"), pitch, pfs);
      tl.forEach((v) => { t = Math.max(t, v + 1); });
      bl.forEach((v) => { b = Math.max(b, v + 1); });
    }
    return { t, b };
  }, [all, view.pointers, pitch, pfs]);
  const topH = top.length ? (Math.max(1, lanes.t) - 1) * LEVEL + PILL_H + 14 : 8;
  const y0 = topH;
  const idxY = y0 + ch + 4;
  const botY = idxY + 18;
  const H = bottom.length ? botY + (Math.max(1, lanes.b) - 1) * LEVEL + 4 + PILL_H + 6 : botY;

  // When the layout itself changes (first measure, resize), jump; only algorithm moves animate.
  const prevPitch = useRef(pitch);
  const relayout = prevPitch.current !== pitch;
  prevPitch.current = pitch;
  const t = relayout ? { duration: 0 } : reduce ? { duration: 0.15 } : springs.smooth;
  const lastBand = useRef<Band | null>(null), lastGhost = useRef<Band | null>(null);
  if (view.band) lastBand.current = view.band;
  if (view.ghost) lastGhost.current = view.ghost;
  const geo = (b: Band | null, pad: number) => b ? { x: b.from * pitch + gap / 2 - pad, width: (b.to - b.from + 1) * pitch - gap + pad * 2 } : { x: 0, width: 0 };
  const band = lastBand.current, ghost = lastGhost.current;

  return (
    <div className="kit-arr-scroll" ref={ref}>
      <div className="kit-arr" style={{ width: rowW, height: H }} role="img" aria-label={label}>
        {measured > 0 && <>
        {ghost && (
          <motion.div key={`g@${pitch}`} className={`kit-ghost t-${ghost.tone ?? "good"}`} initial={false}
            animate={{ ...geo(ghost, 7), opacity: view.ghost ? 1 : 0 }} transition={t}
            style={{ top: y0 - 7, height: ch + 14 }} />
        )}
        {band && (
          <motion.div key={`b@${pitch}`} className={`kit-band t-${view.band?.tone ?? band.tone ?? "accent"}`} initial={false}
            animate={{ ...geo(band, 4), opacity: view.band ? 1 : 0 }} transition={t}
            style={{ top: y0 - 4, height: ch + 8 }} />
        )}
        {view.cells.map((c, k) => (
          <motion.div key={`${c.id}@${pitch}`} className={`kit-cell${c.tone ? ` t-${c.tone}` : ""}${c.quiet ? " quiet" : ""}`} initial={false}
            animate={{ x: k * pitch + gap / 2 }} transition={t}
            style={{ top: y0, width: cw, height: ch, fontSize: fs }}>
            {c.text}
          </motion.div>
        ))}
        {view.cells.map((c, k) => (
          <div key={`i${c.id}`} className="kit-idx" style={{ left: k * pitch, width: pitch, top: idxY }}>{k}</div>
        ))}
        {[...top, ...bottom].map((p) => {
          const isTop = p.side === "top";
          const lv = (isTop ? topLv : botLv).get(p.id) ?? 0;
          const w = pillW(p.label, pfs);
          const at = p.at ?? 0;
          const x = at * pitch + pitch / 2 - w / 2;
          const stem = 4 + lv * LEVEL;
          const y = isTop ? y0 - 5 - stem - PILL_H : botY;
          return (
            <motion.div key={`${p.id}@${pitch}`} className={`kit-ptr ${isTop ? "top" : "bottom"} t-${p.tone ?? "neutral"}`} initial={false}
              animate={{ x, y, opacity: p.at === null ? 0 : 1 }} transition={t} style={{ width: w, zIndex: 10 - lv }} aria-hidden="true">
              {isTop && <span className="kit-pill" style={{ fontSize: pfs }}>{p.label}</span>}
              <motion.span className="kit-stem" initial={false} animate={{ height: stem }} transition={t} />
              {!isTop && <span className="kit-pill" style={{ fontSize: pfs }}>{p.label}</span>}
            </motion.div>
          );
        })}
        </>}
      </div>
    </div>
  );
}
