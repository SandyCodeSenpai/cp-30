/** The array row with the prefix row under it. pre[k] sits on the line between a[k-1] and a[k]. */
import { useRef, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { springs } from "@/ui";
import { useReducedMotion, useWidth } from "@/lib/hooks";
import type { Tone } from "@/content/types";
import { sn } from "./kit/parse";

export interface Bracket { from: number; to: number; tone: Tone; label: string }

export interface TrackProps {
  a: number[];
  pre: (number | null)[];
  /** Light band behind a[0..cover-1]: what the newest prefix covers. */
  cover?: number | null;
  cellTone?: Record<number, Tone | "dim" | "anchor">;
  pillTone?: Record<number, Tone>;
  /** Band over a[l..r]. */
  band?: { l: number; r: number; tone: Tone } | null;
  brackets?: Bracket[];
  /** Arrow from pill k-1 to pill k while building. */
  buildAt?: number | null;
  /** Reserve room for this many bracket rows so the layout does not jump. */
  minBr?: number;
  onCell?: (i: number) => void;
  cellLabel?: (i: number) => string;
}

const CELL_H = 46, IDX_H = 18, BR_H = 26, PILL_H = 30;

export function useMotion() {
  const reduce = useReducedMotion();
  return { reduce, move: reduce ? { duration: 0.15 } : springs.smooth, pop: reduce ? { duration: 0.15 } : springs.snappy };
}

export function PrefixTrack(p: TrackProps) {
  const ref = useRef<HTMLDivElement>(null);
  const w = useWidth(ref) || 600;
  const { move, pop } = useMotion();
  const n = p.a.length;
  const cw = Math.max(32, Math.min(62, Math.floor((w - 40) / (n + 1))));
  const lw = Math.round(cw / 2 + 38);
  const width = lw + n * cw + Math.ceil(cw / 2) + 4;
  const nb = Math.max(p.minBr ?? 1, p.brackets?.length ?? 0);
  const yCell = IDX_H, yBr = yCell + CELL_H + 8, yPill = yBr + nb * BR_H + 14, yPidx = yPill + PILL_H + 4;
  const height = yPidx + 18;
  const x = (k: number) => lw + k * cw; // boundary k
  const tone = (t?: string) => (t ? `t-${t}` : "");

  return (
    <div ref={ref} className="ak-scroll">
      <div className="ps-track" style={{ width, height }}>
        {/* row labels */}
        <div className="ps-rowlabel" style={{ top: yCell, height: CELL_H }}>a</div>
        <div className="ps-rowlabel" style={{ top: yPill, height: PILL_H }}>pre</div>

        {/* cover band */}
        <motion.div className="ps-cover" initial={false} style={{ top: yCell - 4, height: CELL_H + 8, left: x(0) }}
          animate={{ width: Math.max(0, (p.cover ?? 0) * cw), opacity: p.cover ? 1 : 0 }} transition={move} />
        {/* query band */}
        <AnimatePresence>
          {p.band && (
            <motion.div key="band" className={`ps-band ${tone(p.band.tone)}`} style={{ top: yCell - 5, height: CELL_H + 10 }}
              initial={{ opacity: 0, left: x(p.band.l), width: (p.band.r - p.band.l + 1) * cw }}
              animate={{ opacity: 1, left: x(p.band.l), width: (p.band.r - p.band.l + 1) * cw }} exit={{ opacity: 0 }} transition={move} />
          )}
        </AnimatePresence>

        {/* array cells */}
        {p.a.map((v, i) => {
          const t = p.cellTone?.[i];
          const El = p.onCell ? "button" : "div";
          return (
            <div key={i}>
              <div className="ps-idx" style={{ left: x(i), width: cw, top: 0 }}>{i}</div>
              <El className={`ps-cell ${t ? `c-${t}` : ""}${p.onCell ? " click" : ""}`} style={{ left: x(i) + 2, width: cw - 4, top: yCell, height: CELL_H }}
                {...(p.onCell ? { type: "button" as const, onClick: () => p.onCell?.(i), "aria-label": p.cellLabel?.(i) ?? `a[${i}] = ${v}` } : {})}>
                {sn(v)}
              </El>
            </div>
          );
        })}

        {/* boundary ticks */}
        {p.pre.map((_, k) => (
          <div key={k} className={`ps-tick${p.pillTone?.[k] ? " on" : ""}`} style={{ left: x(k), top: yCell + CELL_H + 2, height: yPill - (yCell + CELL_H + 2) }} />
        ))}

        {/* brackets */}
        <AnimatePresence>
          {p.brackets?.map((b, bi) => (
            <motion.div key={`${bi}-${b.from}-${b.to}-${b.tone}`} className={`ps-bracket ${tone(b.tone)}`} style={{ top: yBr + bi * BR_H, height: 10 }}
              initial={{ opacity: 0, left: x(b.from), width: 0 }} animate={{ opacity: 1, left: x(b.from), width: Math.max(2, (b.to - b.from) * cw) }} exit={{ opacity: 0 }} transition={move}>
              <span className="ps-bracket-label">{b.label}</span>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* prefix pills */}
        {p.pre.map((v, k) => (
          <AnimatePresence key={k}>
            {v !== null && (
              <motion.div className={`ps-pill ${tone(p.pillTone?.[k])}`} style={{ left: x(k), top: yPill, height: PILL_H, minWidth: Math.max(26, cw - 8) }}
                initial={{ opacity: 0, scale: 0.6, x: "-50%" }} animate={{ opacity: 1, scale: 1, x: "-50%" }} exit={{ opacity: 0, x: "-50%" }} transition={pop}>
                {sn(v)}
              </motion.div>
            )}
          </AnimatePresence>
        ))}
        {p.pre.map((_, k) => <div key={k} className="ps-pidx" style={{ left: x(k), top: yPidx }}>{k}</div>)}

        {/* build arrow: pre[k-1] + a[k-1] -> pre[k] */}
        {p.buildAt != null && p.buildAt > 0 && (
          <svg className="ps-arrow" style={{ left: x(p.buildAt - 1), top: yPill - 14, width: cw, height: 14 }} viewBox={`0 0 ${cw} 14`} aria-hidden="true">
            <path d={`M4 12 Q ${cw / 2} -2 ${cw - 6} 10`} fill="none" />
            <path d={`M${cw - 11} 8 L${cw - 6} 11 L${cw - 7} 5`} fill="none" />
          </svg>
        )}
      </div>
    </div>
  );
}

/** Colored formula pieces, e.g. pre[6] − pre[2] = 25 − 4 = 21. */
export function Formula({ children }: { children: ReactNode }) {
  return <div className="ps-formula">{children}</div>;
}
export const T = ({ tone, children }: { tone?: Tone; children: ReactNode }) => <span className={`ps-term ${tone ? `t-${tone}` : ""}`}>{children}</span>;
