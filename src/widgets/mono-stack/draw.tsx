/** Bars, the vertical stack column and the horizontal deque used by the mono-stack lab. */
import { type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { springs } from "@/ui";
import { useReducedMotion } from "@/lib/hooks";
import { sn } from "../prefix-sums/kit/parse";

export function useMotion() {
  const reduce = useReducedMotion();
  return { reduce, move: reduce ? { duration: 0.15 } : springs.smooth, pop: reduce ? { duration: 0.15 } : springs.snappy };
}

export const HEAD = 34, IDX = 20;

/** Geometry for N columns that share the row with a side column of width side. */
export function barGeom(w: number, N: number, side: number) {
  const LW = 40;
  const bw = Math.max(26, Math.min(64, Math.floor((w - LW - side - 14) / Math.max(1, N))));
  return { LW, bw, width: LW + N * bw };
}

export interface BarsProps {
  values: number[];
  bw: number; LW: number; H: number;
  zero?: boolean;                     // heights from 0 (histogram) instead of min..max
  cls: (k: number) => string;
  rowLabel?: string;
  sentinel?: number;
  arc?: { from: number; to: number; label: string } | null;
  rects?: { l: number; r: number; h: number; cls: string; label?: string }[];
  band?: { l: number; r: number } | null;
  children?: ReactNode;
}

export function Bars(p: BarsProps) {
  const { move } = useMotion();
  const N = p.values.length;
  const real = p.values.filter((_, k) => k !== p.sentinel);
  const vmax = Math.max(1, ...real), vmin = Math.min(...real);
  const hOf = (v: number) => p.zero ? Math.max(3, (v / vmax) * p.H) : Math.round(p.H * (0.26 + 0.74 * ((v - vmin) / (vmax - vmin || 1))));
  const cx = (k: number) => p.LW + k * p.bw + p.bw / 2;
  const base = HEAD + p.H;
  const topOf = (k: number) => base - hOf(p.values[k]);
  const width = p.LW + N * p.bw;
  return (
    <div className="ms-bars" style={{ width, height: base + IDX }}>
      {p.rowLabel && <div className="ms-rowlabel" style={{ top: base - 18 }}>{p.rowLabel}</div>}
      <div className="ms-base" style={{ left: p.LW, width: N * p.bw, top: base }} />
      <AnimatePresence>
        {p.band && (
          <motion.div key="band" className="ms-band" initial={{ opacity: 0, left: p.LW + p.band.l * p.bw + 1, width: (p.band.r - p.band.l + 1) * p.bw - 2 }}
            animate={{ opacity: 1, left: p.LW + p.band.l * p.bw + 1, width: (p.band.r - p.band.l + 1) * p.bw - 2 }} exit={{ opacity: 0 }} transition={move}
            style={{ top: 4, height: base + IDX - 4 }} />
        )}
      </AnimatePresence>
      {p.rects?.map((r) => (
        <motion.div key={`${r.cls}`} className={`ms-rect ${r.cls}`} initial={false}
          animate={{ left: p.LW + r.l * p.bw + 2, width: (r.r - r.l + 1) * p.bw - 4, top: base - Math.max(3, hOf(r.h)), height: Math.max(3, hOf(r.h)) }} transition={move}>
          {r.label && <span className="ms-rect-label">{r.label}</span>}
        </motion.div>
      ))}
      {p.values.map((v, k) => {
        const h = hOf(v), sent = k === p.sentinel;
        return (
          <div key={k}>
            <motion.div className={`ms-bar ${p.cls(k)}${sent ? " sentinel" : ""}`} initial={false}
              animate={{ height: h, top: base - h }} transition={move}
              style={{ left: p.LW + k * p.bw + 4, width: p.bw - 8 }} />
            <div className={`ms-val ${p.cls(k)}`} style={{ left: p.LW + k * p.bw, width: p.bw, top: base - h - 19 }}>{sent ? "0" : sn(v)}</div>
            <div className="ms-idx" style={{ left: p.LW + k * p.bw, width: p.bw, top: base + 3 }}>{sent ? "end" : k}</div>
          </div>
        );
      })}
      {p.arc && (() => {
        const x1 = cx(p.arc.from), x2 = cx(p.arc.to);
        const y1 = topOf(p.arc.from) - 20, y2 = topOf(p.arc.to) - 20;
        const peak = Math.max(4, Math.min(y1, y2) - 10 - Math.min(26, Math.abs(x2 - x1) / 6));
        return (
          <svg className="ms-arc" width={width} height={base} viewBox={`0 0 ${width} ${base}`} aria-hidden="true">
            <motion.path d={`M${x1} ${y1} C ${x1} ${peak}, ${x2} ${peak}, ${x2 - 1} ${y2 - 2}`} fill="none" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.35 }} />
            <path d={`M${x2 - 5} ${y2 - 8} L${x2 - 1} ${y2 - 1} L${x2 + 4} ${y2 - 7}`} fill="none" />
            <text x={(x1 + x2) / 2} y={peak + 2} textAnchor="middle" className="ms-arc-label">{p.arc.label}</text>
          </svg>
        );
      })()}
      {p.children}
    </div>
  );
}

/** A row of cells aligned under the bars (answers, window outputs). */
export function CellRow({ values, bw, LW, label, cls }: { values: (number | string | null)[]; bw: number; LW: number; label: string; cls: (k: number) => string }) {
  const { pop } = useMotion();
  return (
    <div className="ms-row" style={{ width: LW + values.length * bw }}>
      <div className="ms-rowlabel inrow">{label}</div>
      {values.map((v, k) => (
        <div key={k} className={`ms-cell ${cls(k)}`} style={{ left: LW + k * bw + 3, width: bw - 6 }}>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span key={String(v)} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={pop}>
              {v === null ? "" : typeof v === "number" ? sn(v) : v}
            </motion.span>
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}

/** Vertical stack: bottom at the bottom, top at the top. Pushes drop in, pops slide out to the left. */
export function StackColumn({ items, values, title, sub, cls, minH, width }: {
  items: number[]; values: number[]; title: string; sub: string; cls: (j: number) => string; minH: number; width: number;
}) {
  const { pop, reduce } = useMotion();
  return (
    <div className="ms-stack" style={{ width, minHeight: minH }}>
      <div className="ms-stack-head"><span>{title}</span><small>{sub}</small></div>
      <div className="ms-stack-body">
        <AnimatePresence initial={false}>
          {items.map((j, t) => (
            <motion.div layout={!reduce} key={j} className={`ms-scell ${cls(j)}${t === items.length - 1 ? " top" : ""}`}
              initial={{ opacity: 0, y: reduce ? 0 : -26 }} animate={{ opacity: 1, y: 0, x: 0 }} exit={{ opacity: 0, x: reduce ? 0 : -36, transition: { duration: 0.22 } }} transition={pop}>
              <b>{j}</b><span>{sn(values[j])}</span>
            </motion.div>
          ))}
        </AnimatePresence>
        {items.length === 0 && <div className="ms-stack-empty">empty</div>}
      </div>
    </div>
  );
}

/** Horizontal deque: front on the left, back on the right. */
export function DequeRow({ items, values, cls }: { items: number[]; values: number[]; cls: (j: number) => string }) {
  const { pop, reduce } = useMotion();
  return (
    <div className="ms-deque">
      <span className="ms-end">front</span>
      <div className="ms-deque-body">
        <AnimatePresence initial={false} mode="popLayout">
          {items.map((j) => (
            <motion.div layout={!reduce} key={j} className={`ms-scell h ${cls(j)}`}
              initial={{ opacity: 0, x: reduce ? 0 : 24 }} animate={{ opacity: 1, x: 0, y: 0 }} exit={{ opacity: 0, y: reduce ? 0 : 18, transition: { duration: 0.2 } }} transition={pop}>
              <b>{j}</b><span>{sn(values[j])}</span>
            </motion.div>
          ))}
        </AnimatePresence>
        {items.length === 0 && <div className="ms-stack-empty">empty</div>}
      </div>
      <span className="ms-end">back</span>
    </div>
  );
}

export function Legend({ items }: { items: { cls: string; label: string }[] }) {
  return <div className="ak-legend">{items.map((it) => <span key={it.label}><i className={`ms-key ${it.cls}`} />{it.label}</span>)}</div>;
}
