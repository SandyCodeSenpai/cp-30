import { useRef, type KeyboardEvent } from "react";
import { motion } from "framer-motion";
import { springs } from "@/ui";
import { useWidth } from "@/lib/hooks";
import { CXS, CPY, PYPY, log10Ops, fmtOps, rowVerdict, type Cx } from "./model";

/** log10 range drawn on the x axis: 1 .. 10^12 operations. Bigger counts run off the right edge. */
const DOMAIN = 12;
const pct = (L: number) => `${(Math.max(0, Math.min(DOMAIN, L)) / DOMAIN) * 100}%`;

export type RowMark = "key" | "wrong" | "pick";

/**
 * One row per complexity. Bars show log10(operations) at this n, against two budget lines:
 * CPython (10^7 ops/s) and PyPy (10^8 ops/s) for the chosen time limit.
 */
export function OpsChart(p: {
  n: number; limit: number; selected: Cx | null; onSelect?: (c: Cx) => void;
  /** Which rows show their bar. true = all. */
  bars: boolean | Cx[]; chips: boolean; marks?: Partial<Record<Cx, RowMark>>; reduce: boolean; label: string;
  /** Stagger bars as they appear (reveal moments). Show 1-8 key hints on rows. */
  stagger?: boolean; keys?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const w = useWidth(ref);
  const narrow = w > 0 && w < 470;
  const cpyL = Math.log10(CPY * p.limit), pypyL = Math.log10(PYPY * p.limit);
  const lim = `${p.limit} s`;
  const showBar = (c: Cx) => p.bars === true || (Array.isArray(p.bars) && p.bars.includes(c));
  const interactive = !!p.onSelect;

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!p.onSelect) return;
    const i = CXS.findIndex((c) => c.id === p.selected);
    let j = -1;
    if (e.key === "ArrowDown" || e.key === "ArrowRight") j = Math.min(CXS.length - 1, i + 1);
    if (e.key === "ArrowUp" || e.key === "ArrowLeft") j = Math.max(0, i < 0 ? 0 : i - 1);
    if (j >= 0) {
      e.preventDefault(); p.onSelect(CXS[j].id);
      const btn = ref.current?.querySelectorAll<HTMLButtonElement>(".cx-row")[j]; btn?.focus();
    }
  };

  const tween = { duration: 0.15 };
  return (
    <div className={`cx-chart${narrow ? " narrow" : ""}${p.keys ? " keyed" : ""}`} ref={ref}>
      <div className="cx-head" aria-hidden="true">
        <div className="cx-plot">
          <motion.span className="cx-linelabel l1" animate={{ left: pct(cpyL) }} transition={p.reduce ? tween : springs.smooth}>CPython {lim}</motion.span>
          <motion.span className="cx-linelabel l2" animate={{ left: pct(pypyL) }} transition={p.reduce ? tween : springs.smooth}>PyPy {lim}</motion.span>
        </div>
      </div>
      <div className="cx-body">
        <div className="cx-overlay" aria-hidden="true">
          <motion.div className="cx-zone mid" animate={{ left: pct(cpyL), width: `calc(${pct(pypyL)} - ${pct(cpyL)})` }} transition={p.reduce ? tween : springs.smooth} />
          <motion.div className="cx-zone hi" animate={{ left: pct(pypyL) }} transition={p.reduce ? tween : springs.smooth} />
          <motion.div className="cx-vline l1" animate={{ left: pct(cpyL) }} transition={p.reduce ? tween : springs.smooth} />
          <motion.div className="cx-vline l2" animate={{ left: pct(pypyL) }} transition={p.reduce ? tween : springs.smooth} />
        </div>
        <div role={interactive ? "radiogroup" : "list"} aria-label={p.label} onKeyDown={onKey}>
          {CXS.map((c, i) => {
            const L = log10Ops(c.id, p.n);
            const on = showBar(c.id);
            const over = L > DOMAIN;
            const v = rowVerdict(L, p.limit);
            const sel = p.selected === c.id;
            const mark = p.marks?.[c.id];
            const inside = L / DOMAIN > 0.62;
            const cls = `cx-row${sel ? " sel" : ""}${mark ? ` mark-${mark}` : ""}${interactive ? "" : " static"}`;
            const content = (
              <>
                <span className="cx-label">{c.label}</span>
                <span className="cx-track">
                  <motion.span className={`cx-bar${over ? " over" : ""}`}
                    initial={false}
                    animate={{ width: on ? pct(L) : "0%", opacity: on ? 1 : 0 }}
                    transition={p.reduce ? tween : { ...springs.smooth, delay: on && p.stagger ? i * 0.04 : 0 }}>
                    {on && inside && <span className="cx-ops in">{fmtOps(L)}</span>}
                  </motion.span>
                  {on && !inside && <motion.span className="cx-ops" animate={{ left: `calc(${pct(L)} + 6px)` }} initial={false} transition={p.reduce ? tween : springs.smooth}>{fmtOps(L)}</motion.span>}
                </span>
                <span className="cx-chipcell">
                  {p.chips && on && (
                    <span className={`cx-verdict v-${v}`}>{v === "pass" ? "Pass" : v === "pypy" ? (narrow ? "PyPy" : "PyPy only") : "TLE"}</span>
                  )}
                  {mark === "key" && !p.chips && <span className="cx-verdict v-key">Target</span>}
                </span>
              </>
            );
            return interactive ? (
              <button key={c.id} type="button" role="radio" aria-checked={sel} className={cls} tabIndex={sel || (!p.selected && i === 0) ? 0 : -1}
                aria-label={`${c.label}${on ? `: ${fmtOps(L)} operations` : ""}`} onClick={() => p.onSelect?.(c.id)}>
                {p.keys && <span className="cx-key" aria-hidden="true">{i + 1}</span>}
                {content}
              </button>
            ) : (
              <div key={c.id} role="listitem" className={cls}>{content}</div>
            );
          })}
        </div>
      </div>
      <div className="cx-axis" aria-hidden="true">
        <div className="cx-plot">
          {[0, 3, 6, 9, 12].map((t) => <span key={t} style={{ left: pct(t) }}>{t === 0 ? "1" : fmtOps(t)}</span>)}
        </div>
      </div>
    </div>
  );
}
