import { useRef } from "react";
import { motion } from "framer-motion";
import { springs } from "@/ui";
import { useReducedMotion, useWidth } from "@/lib/hooks";
import type { BsFrame, Check, Cond } from "./engine";
import { okAt } from "./engine";

const T = (reduce: boolean) => (reduce ? { duration: 0 } : springs.smooth);

/** Pointer chip: a pill with a small triangle. dir "down" sits above its target, "up" sits below. */
function PtrChip({ x, y, label, dir, tone, reduce }: { x: number; y: number; label: string; dir: "up" | "down"; tone: "accent" | "ink" | "good"; reduce: boolean }) {
  const w = Math.max(30, label.length * 7.4 + 16), h = 22;
  const top = dir === "down" ? 0 : 7;
  const tri = dir === "down" ? `M${-5},${h} L0,${h + 6} L5,${h}` : `M-5,7 L0,1 L5,7`;
  return (
    <motion.g initial={false} animate={{ x, y }} transition={T(reduce)} className={`bs-ptr bs-ptr-${tone}`}>
      <path d={tri} className="bs-ptr-bg" />
      <rect x={-w / 2} y={top} width={w} height={h} rx={11} className="bs-ptr-bg" />
      <text x={0} y={top + 15.5} textAnchor="middle" className="bs-ptr-text">{label}</text>
    </motion.g>
  );
}

/* ---------------- Array view: classic + boundary ---------------- */

export function ArrayView({ a, f, mode, x, cond, revealAll }: { a: number[]; f: BsFrame; mode: "classic" | "boundary"; x: number; cond: Cond; revealAll: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const W = Math.max(300, useWidth(ref) || 600);
  const reduce = useReducedMotion();
  const n = a.length;
  const slots = mode === "classic" ? n + 1 : f.d1 + 1;
  const pad = 6;
  const cw = Math.min(54, Math.floor((W - 2 * pad) / slots));
  const gap = cw >= 34 ? 6 : 3;
  const box = cw - gap;
  const ch = cw >= 40 ? 46 : 38;
  const x0 = Math.round((W - slots * cw) / 2);
  const cx = (i: number) => x0 + i * cw + cw / 2;
  const Y1 = 36;
  const showOk = mode === "boundary";
  const Y2 = Y1 + ch + 40;
  const Yc = (showOk ? Y2 + 20 : Y1 + ch + 30);
  const Yb = Yc + 44;
  const H = mode === "classic" ? Yb + 24 : Yc + 26;
  const fs = cw >= 34 ? 15 : cw >= 24 ? 13 : 12;
  const done = f.phase === "done";
  const inBand = (i: number) => i >= f.lo && i <= f.hi;
  const lohiSame = f.lo === f.hi;

  const okLabel = (i: number) => {
    if (f.known[i] !== undefined) return { t: f.known[i] ? "T" : "F", cls: f.known[i] ? "t" : "f", solid: true };
    if (i < f.lo) return { t: "F", cls: "f", solid: false };
    if (i >= f.hi) return { t: "T", cls: "t", solid: false };
    if (revealAll) { const v = okAt(a, cond, x, i); return { t: v ? "T" : "F", cls: v ? "t ghost" : "f ghost", solid: false }; }
    return { t: "?", cls: "u", solid: false };
  };

  return (
    <div ref={ref} className="bs-view">
      <svg className="pl-svg" viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img"
        aria-label={`Sorted array ${a.join(", ")}. lo = ${f.lo}, hi = ${f.hi}${f.mid !== null ? `, mid = ${f.mid}` : ""}.`}>
        {/* the search band [lo, hi] */}
        <motion.rect className={`bs-band${done ? " done" : ""}`} initial={false} rx={12}
          animate={{ x: x0 + f.lo * cw + gap / 2 - 5, width: (f.hi - f.lo + 1) * cw - gap + 10 }} y={Y1 - 6} height={ch + 12} transition={T(reduce)} />
        {Array.from({ length: slots }, (_, i) => {
          const isEnd = i >= n;
          const isMid = f.mid === i;
          const isRes = done && f.result === i;
          const cls = `bs-cell${isMid ? " mid" : ""}${isRes ? (mode === "classic" && !f.found ? " miss" : " res") : ""}${isEnd ? " end" : ""}`;
          return (
            <g key={i} className="bs-cellg" style={{ opacity: inBand(i) || isRes ? 1 : 0.38 }}>
              <rect x={x0 + i * cw + gap / 2} y={Y1} width={box} height={ch} rx={Math.min(10, box / 3)} className={cls} />
              <text x={cx(i)} y={Y1 + ch / 2 + fs * 0.36} textAnchor="middle" className={`bs-val${isEnd ? " end" : ""}`} style={{ fontSize: isEnd ? 12 : fs }}>{isEnd ? (cw >= 30 ? "end" : "") : a[i]}</text>
              <text x={cx(i)} y={Y1 + ch + 16} textAnchor="middle" className="pl-cap">{i}</text>
            </g>
          );
        })}
        {showOk && Array.from({ length: slots }, (_, i) => {
          const o = okLabel(i);
          const bw = Math.min(28, box);
          return (
            <g key={`ok${i}`}>
              <rect x={cx(i) - bw / 2} y={Y2 - 14} width={bw} height={21} rx={6} className={`bs-ok ${o.cls}${o.solid ? " solid" : ""}`} />
              <text x={cx(i)} y={Y2 + 1} textAnchor="middle" className={`bs-ok-t ${o.cls}${o.solid ? " solid" : ""}`}>{o.t}</text>
            </g>
          );
        })}
        {showOk && x0 >= 44 && <text x={x0 - 8} y={Y2 + 1} textAnchor="end" className="pl-cap">ok(i)</text>}
        {f.mid !== null && <PtrChip x={cx(f.mid)} y={2} label="mid" dir="down" tone="accent" reduce={reduce} />}
        {lohiSame
          ? <PtrChip x={cx(f.lo)} y={Yc - 8} label={done ? "answer" : "lo = hi"} dir="up" tone={done ? "good" : "ink"} reduce={reduce} />
          : <>
            <PtrChip x={cx(f.lo)} y={Yc - 8} label="lo" dir="up" tone="ink" reduce={reduce} />
            <PtrChip x={cx(f.hi)} y={Yc - 8} label="hi" dir="up" tone="ink" reduce={reduce} />
          </>}
        {mode === "classic" && <>
          {f.lo > 0 && <Bracket x1={x0 + gap / 2} x2={x0 + f.lo * cw - gap / 2} y={Yb} label={`< ${x}`} reduce={reduce} />}
          {f.hi < n && <Bracket x1={x0 + f.hi * cw + gap / 2} x2={x0 + n * cw - gap / 2} y={Yb} label={`>= ${x}`} reduce={reduce} />}
        </>}
      </svg>
    </div>
  );
}

function Bracket({ x1, x2, y, label, reduce }: { x1: number; x2: number; y: number; label: string; reduce: boolean }) {
  const w = Math.max(2, x2 - x1);
  return (
    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={reduce ? { duration: 0 } : { duration: 0.2 }}>
      <motion.path initial={false} animate={{ d: `M${x1},${y - 6} L${x1},${y} L${x1 + w},${y} L${x1 + w},${y - 6}` }} className="bs-bracket" transition={T(reduce)} />
      <motion.text initial={false} animate={{ x: x1 + w / 2 }} y={y + 17} textAnchor="middle" className="bs-bracket-t" transition={T(reduce)}>{label}</motion.text>
    </motion.g>
  );
}

/* ---------------- Answer line: on-answer ---------------- */

export function AnswerLine({ f, okOf, revealAll, unit }: { f: BsFrame; okOf: (v: number) => boolean; revealAll: boolean; unit: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const W = Math.max(280, useWidth(ref) || 560);
  const reduce = useReducedMotion();
  const count = f.d1 - f.d0 + 1;
  const narrowSeg = (W - 28) / count < 22;
  const pad = narrowSeg ? 8 + Math.max(String(f.d0).length, String(f.d1).length) * 8 : 14;
  const sw = (W - 2 * pad) / count;
  const x0 = pad;
  const sx = (v: number) => x0 + (v - f.d0) * sw;
  const cx = (v: number) => sx(v) + sw / 2;
  const Y1 = 40, bh = 34;
  const Yc = Y1 + bh + 18;
  const done = f.phase === "done";
  const H = Yc + (done ? 58 : 34);
  const segGap = sw >= 10 ? 2 : 0;
  const showNums = sw >= 22;
  const state = (v: number) => {
    if (f.known[v] !== undefined) return f.known[v] ? "t solid" : "f solid";
    if (v < f.lo) return "f";
    if (v >= f.hi) return "t";
    if (revealAll) return okOf(v) ? "t ghost" : "f ghost";
    return "u";
  };
  const lohiSame = f.lo === f.hi;
  return (
    <div ref={ref} className="bs-view">
      <svg className="pl-svg" viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img"
        aria-label={`Answer line from ${f.d0} to ${f.d1}. lo = ${f.lo}, hi = ${f.hi}${f.mid !== null ? `, mid = ${f.mid}` : ""}.`}>
        <motion.rect className={`bs-band${done ? " done" : ""}`} initial={false} rx={10}
          animate={{ x: sx(f.lo) - 4, width: (f.hi - f.lo + 1) * sw + 8 - segGap }} y={Y1 - 6} height={bh + 12} transition={T(reduce)} />
        {Array.from({ length: count }, (_, j) => {
          const v = f.d0 + j;
          const s = state(v);
          const first = j === 0, last = j === count - 1;
          return (
            <g key={v}>
              <rect x={sx(v) + segGap / 2} y={Y1} width={Math.max(1, sw - segGap)} height={bh} rx={segGap ? Math.min(6, sw / 3) : 0}
                className={`bs-seg ${s}${f.mid === v ? " mid" : ""}`} />
              {showNums && <text x={cx(v)} y={Y1 + bh / 2 + 4.5} textAnchor="middle" className={`bs-seg-t ${s}`}>{v}</text>}
              {!showNums && (first || last) && <text x={first ? sx(v) - 5 : sx(v) + sw + 5} y={Y1 + bh / 2 + 4} textAnchor={first ? "end" : "start"} className="pl-cap">{v}</text>}
            </g>
          );
        })}
        {f.mid !== null && <PtrChip x={cx(f.mid)} y={4} label={showNums ? "mid" : `mid ${f.mid}`} dir="down" tone="accent" reduce={reduce} />}
        {lohiSame
          ? <PtrChip x={cx(f.lo)} y={Yc - 8} label={done ? `answer ${f.lo}` : `lo = hi = ${f.lo}`} dir="up" tone={done ? "good" : "ink"} reduce={reduce} />
          : <>
            <PtrChip x={cx(f.lo)} y={Yc - 8} label={showNums ? "lo" : `lo ${f.lo}`} dir="up" tone="ink" reduce={reduce} />
            <PtrChip x={cx(f.hi)} y={Yc - 8} label={showNums ? "hi" : `hi ${f.hi}`} dir="up" tone="ink" reduce={reduce} />
          </>}
        {done && <>
          {f.lo > f.d0 && <text x={(sx(f.d0) + sx(f.lo)) / 2} y={Yc + 44} textAnchor="middle" className="bs-word f">no ... no</text>}
          <text x={(sx(f.lo) + sx(f.d1 + 1)) / 2} y={Yc + 44} textAnchor="middle" className="bs-word t">yes ... yes</text>
        </>}
      </svg>
      <div className="bs-legend" aria-hidden="true">
        <span><i className="u" />not checked</span><span><i className="f" />no</span><span><i className="t" />yes</span><span className="bs-legend-note">faded = known without a check</span>
        <span className="bs-legend-unit">{unit}</span>
      </div>
    </div>
  );
}

/* ---------------- check(mid) side panel ---------------- */

export function CheckPanel({ check, pending, t }: { check?: Check; pending?: boolean; t: number }) {
  if (!check) return (
    <div className="bs-check empty"><div className="bs-check-title">check(mid)</div><p>Each step runs one check at mid. Its work shows here.</p></div>
  );
  const verdict = pending ? <span className="bs-verdict u">?</span> : <span className={`bs-verdict ${check.ok ? "t" : "f"}`}>{check.ok ? "yes" : "no"}</span>;
  if (check.kind === "koko") {
    return (
      <div className="bs-check" aria-live="polite">
        <div className="bs-check-head"><div className="bs-check-title">check(k = {check.k})</div>{verdict}</div>
        <div className="bs-check-sub">Hours per pile: ceil(p / {check.k})</div>
        <div className="bs-piles">
          {check.hours.map((hh, i) => (
            <div key={i} className="bs-pile">
              <div className="bs-pile-p">{check.piles[i]}</div>
              <div className="bs-pile-h">{pending ? "?" : `${hh} h`}</div>
            </div>
          ))}
        </div>
        <div className="bs-check-sum">{pending ? <>Total ? h. Allowed {t} h.</> : <>Total <b>{check.total} h</b> {check.ok ? "<=" : ">"} {t} h allowed</>}</div>
      </div>
    );
  }
  return (
    <div className="bs-check" aria-live="polite">
      <div className="bs-check-head"><div className="bs-check-title">check(cap = {check.cap})</div>{verdict}</div>
      <div className="bs-check-sub">Greedy: start a new part when the sum would pass {check.cap}.</div>
      <div className="bs-parts">
        {pending
          ? <div className="bs-part u"><div className="bs-part-vals">{check.parts.flat().map((v, i) => <span key={i}>{v}</span>)}</div><div className="bs-part-sum">?</div></div>
          : check.parts.map((part, i) => (
            <div key={i} className={`bs-part ${check.ok ? "t" : i >= check.k ? "f" : ""}`}>
              <div className="bs-part-vals">{part.map((v, j) => <span key={j}>{v}</span>)}</div>
              <div className="bs-part-sum">sum {part.reduce((s, v) => s + v, 0)}</div>
            </div>
          ))}
      </div>
      <div className="bs-check-sum">{pending ? <>? parts. Allowed {check.k}.</> : <><b>{check.parts.length} {check.parts.length === 1 ? "part" : "parts"}</b> {check.ok ? "<=" : ">"} k = {check.k}</>}</div>
    </div>
  );
}

