/** Picture of a Fenwick tree: the array, each t[i] as a bar over the cells it covers, and the i jumps as arcs. */
import { useRef } from "react";
import { motion } from "framer-motion";
import { useReducedMotion, useWidth } from "@/lib/hooks";
import { HScroll } from "./kit/ui";
import { bin, bitWidth, lowbit, type FwFrame } from "./fw-engine";

export function FenwickView({ f, n, stepKey }: { f: FwFrame; n: number; stepKey: number }) {
  const box = useRef<HTMLDivElement>(null);
  const width = useWidth(box) || 600;
  const reduce = useReducedMotion();
  const padL = 34, padR = 40;
  const cw = Math.max(34, Math.min(64, Math.floor((width - padL - padR) / n)));
  const W = padL + n * cw + padR;
  const levels = Math.floor(Math.log2(n)) + 1;
  const arcH = 56, y0 = arcH;               // index row starts here
  const aY = y0 + 40, aH = 34;
  const barsY = aY + aH + 14, LH = 34, BH = 27;
  const H = barsY + levels * LH + 2;
  const xc = (k: number) => (k <= 0 ? padL - 14 : k > n ? padL + n * cw + 22 : padL + (k - 0.5) * cw);

  const plus = new Set(f.plus), minus = new Set(f.minus), changed = new Set(f.changed), trail = new Set(f.trail);
  const active = f.trail.length > 0 || f.plus.length > 0 || f.minus.length > 0;
  // a cells covered by + blocks and by - blocks
  const cover = (set: Set<number>) => { const s = new Set<number>(); set.forEach((j) => { for (let k = j - lowbit(j) + 1; k <= j; k++) s.add(k); }); return s; };
  const covP = cover(plus), covM = cover(minus);

  // arcs: consecutive trail steps, plus the jump of this frame
  const arcs: { from: number; to: number; cur: boolean }[] = [];
  const order = f.trail;
  for (let k = 0; k + 1 < order.length; k++) arcs.push({ from: order[k], to: order[k + 1], cur: false });
  if (f.jump) {
    const dup = arcs.findIndex((a) => a.from === f.jump!.from && a.to === f.jump!.to);
    if (dup >= 0) arcs.splice(dup, 1);
    arcs.push({ from: f.jump.from, to: f.jump.to, cur: true });
  }

  const arcPath = (a: number, b: number) => {
    const x1 = xc(a), x2 = xc(b), dx = Math.abs(x2 - x1);
    const top = y0 - 6 - Math.min(arcH - 18, 14 + dx * 0.28);
    return { d: `M${x1},${y0 - 4} C${x1},${top} ${x2},${top} ${x2},${y0 - 6}`, mx: (x1 + x2) / 2, my: top + (y0 - 4 - top) * 0.25 };
  };

  return (
    <div ref={box} className="fw-wrap">
      <HScroll focusX={f.i !== null ? xc(f.i) : undefined}>
        <svg className="rq-svg fw-svg" width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img"
          aria-label={`Fenwick tree with ${n} values. ${f.i !== null ? `i = ${f.i}.` : ""}`}>
          <defs>
            <marker id="fw-arrow" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0,0 L8,4 L0,8 z" className="fw-head" />
            </marker>
            <marker id="fw-arrow-dim" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0,0 L8,4 L0,8 z" className="fw-head-dim" />
            </marker>
          </defs>

          {/* row labels */}
          <text x={4} y={y0 + 15} className="fw-lab">i</text>
          <text x={4} y={aY + aH / 2 + 4} className="fw-lab">a</text>
          <text x={4} y={barsY + BH / 2 + 4} className="fw-lab">t</text>

          {/* jump arcs */}
          {arcs.map((a) => {
            const { d, mx, my } = arcPath(a.from, a.to);
            const step = Math.abs(a.to - a.from);
            return (
              <g key={`${a.from}-${a.to}`} className={a.cur ? "fw-arc cur" : "fw-arc"}>
                <motion.path d={d} markerEnd={`url(#${a.cur ? "fw-arrow" : "fw-arrow-dim"})`}
                  initial={reduce || !a.cur ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.45, ease: "easeOut" }} />
                {a.cur && (
                  <g>
                    <rect x={mx - 19} y={my - 11} width={38} height={20} rx={10} className="fw-arc-pill" />
                    <text x={mx} y={my + 4} textAnchor="middle" className="fw-arc-txt">{a.to > a.from ? "+" : "−"}{step}</text>
                  </g>
                )}
              </g>
            );
          })}

          {/* index row with binary */}
          {Array.from({ length: n }, (_, k) => k + 1).map((k) => {
            const on = f.i === k;
            return (
              <g key={k}>
                {on && <motion.rect layoutId={reduce ? undefined : "fw-i"} x={xc(k) - cw / 2 + 3} y={y0} width={cw - 6} height={34} rx={9} className="fw-ipill" />}
                <text x={xc(k)} y={y0 + 15} textAnchor="middle" className={`fw-idx${on ? " on" : ""}`}>{k}</text>
                {cw >= 40 && <text x={xc(k)} y={y0 + 29} textAnchor="middle" className={`fw-bin${on ? " on" : ""}`}>{bin(k, n.toString(2).length)}</text>}
              </g>
            );
          })}
          {f.i === 0 && <text x={xc(0)} y={y0 + 15} textAnchor="middle" className="fw-idx on">0</text>}
          {f.i !== null && f.i > n && <text x={xc(f.i)} y={y0 + 15} textAnchor="middle" className="fw-idx on">{f.i}</text>}

          {/* the array a */}
          {Array.from({ length: n }, (_, k) => k + 1).map((k) => {
            const cls = covM.has(k) ? " minus" : covP.has(k) ? " plus" : "";
            return (
              <g key={k}>
                <rect x={padL + (k - 1) * cw + 2} y={aY} width={cw - 4} height={aH} rx={8} className={`fw-cell${cls}${f.flashA === k ? " flash" : ""}`} />
                <text x={xc(k)} y={aY + aH / 2 + 5} textAnchor="middle" className="fw-val">{f.a[k]}</text>
              </g>
            );
          })}

          {/* the bars t[j] */}
          {Array.from({ length: n }, (_, k) => k + 1).map((j) => {
            const lb = lowbit(j), lvl = Math.log2(lb);
            const x = padL + (j - lb) * cw + 2, w = lb * cw - 4, y = barsY + lvl * LH;
            const st = f.hot === j ? "hot" : minus.has(j) ? "minus" : plus.has(j) ? "plus" : changed.has(j) ? "changed" : trail.has(j) ? "trail" : "";
            const dim = active && !st;
            const val = f.t[j] ?? 0;
            return (
              <g key={j} className={`fw-bar ${st}${dim ? " dim" : ""}`}>
                <rect x={x} y={y} width={w} height={BH} rx={8} />
                {f.hot === j && !reduce && <motion.rect key={`p${stepKey}`} x={x} y={y} width={w} height={BH} rx={8} className="fw-pulse" initial={{ opacity: 0.7 }} animate={{ opacity: 0 }} transition={{ duration: 0.7 }} />}
                {lb >= 2 && w >= 70 && <text x={x + 9} y={y + BH / 2 + 4} className="fw-tlab">t[{j}]</text>}
                <text x={lb >= 2 && w >= 70 ? x + w - 9 : x + w / 2} y={y + BH / 2 + 5} textAnchor={lb >= 2 && w >= 70 ? "end" : "middle"} className="fw-tval">{val}</text>
              </g>
            );
          })}
        </svg>
      </HScroll>
    </div>
  );
}

/** The binary of i with its lowest set bit marked, and the jump to the next i. */
export function BitStrip({ f, n }: { f: FwFrame; n: number }) {
  const W = Math.max(bitWidth(n), f.jump ? bitWidth(Math.max(f.jump.from, f.jump.to)) : 0);
  if (f.i === null && !f.jump) return null;
  const row = (v: number, mark: boolean) => {
    const b = bin(v, W), lb = lowbit(v);
    return (
      <span className="fw-bits" aria-label={`${v} in binary is ${b}`}>
        {b.split("").map((c, k) => {
          const bitVal = 1 << (W - 1 - k);
          return <span key={k} className={`fw-bit${c === "1" ? " one" : ""}${mark && bitVal === lb && v > 0 ? " low" : ""}`}>{c}</span>;
        })}
      </span>
    );
  };
  if (f.jump) {
    const { from, to, dir } = f.jump, lb = lowbit(from);
    return (
      <div className="fw-strip" aria-live="off">
        <span className="fw-sk">i</span>{row(from, true)}<span className="fw-eq">= {from}</span>
        <span className="fw-op">{dir > 0 ? "+" : "−"}</span>
        <span className="fw-sk">i &amp; -i</span>{row(lb, true)}<span className="fw-eq">= {lb}</span>
        <span className="fw-op">→</span>
        {row(to, false)}<span className="fw-eq strong">= {to}{to > n ? ` > n` : ""}</span>
      </div>
    );
  }
  const i = f.i!;
  if (i <= 0 || i > n) return null;
  return (
    <div className="fw-strip">
      <span className="fw-sk">i</span>{row(i, true)}<span className="fw-eq">= {i}</span>
      <span className="fw-note">lowest 1 bit = {lowbit(i)}, so t[{i}] covers a[{i - lowbit(i) + 1}..{i}]</span>
    </div>
  );
}
