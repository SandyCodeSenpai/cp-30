import { useMemo, useRef, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { useReducedMotion, useWidth } from "@/lib/hooks";
import { parseNums, randChoice, randInt, usePlayer } from "./kit/player";
import { CodePanel, HScroll, InputEditor, LabShell, Legend, Narration, PlayerBar, Vars } from "./kit/ui";
import { INV_CODE } from "./code";
import { cmpFrames, fmtBig, type CmpFrame } from "./cmp-engine";

export const CMP_DEFAULT = [500, 1_000_000_000, 20, 500, 70_000, 3];

export default function CompressMode({ nums: init, tabs, onComplete }: { nums: number[]; tabs?: ReactNode; onComplete?: () => void }) {
  const [nums, setNums] = useState(init);
  const { frames, vals } = useMemo(() => cmpFrames(nums), [nums]);
  const p = usePlayer(frames, onComplete);
  const f = p.frame;

  const [txt, setTxt] = useState(init.join(", "));
  const [err, setErr] = useState<string | null>(null);
  const preset = (v: number[]) => { setTxt(v.join(", ")); setErr(null); setNums(v); };
  const apply = () => {
    const v = parseNums(txt, { min: -1_000_000_000, max: 1_000_000_000, minLen: 3, maxLen: 12 });
    if (typeof v === "string") { setErr(v); return; }
    preset(v);
  };
  const big = [3, 20, 500, 7000, 70_000, 2_000_000, 45_000_000, 1_000_000_000, 999_000];

  const stage = (
    <div className="rq-stage">
      <div className="rq-stage-head">
        <span className="rq-stage-title">count_inversions(a)</span>
        <Legend items={[{ cls: "lg-accent", label: "current x" }, { cls: "lg-good", label: "seen, rank ≤ r" }, { cls: "lg-warn", label: "seen, rank > r" }]} />
      </div>
      <CmpView f={f} a={nums} vals={vals} stepKey={p.cur} />
      <div className="fw-foot"><Vars items={f.vars} /></div>
    </div>
  );

  return (
    <LabShell label="Coordinate compression lab" tabs={tabs} stage={stage} onKeyDown={p.onKeyDown}
      narration={<Narration p={p} />} bar={<PlayerBar p={p} />}
      code={<CodePanel title="count_inversions (uses class BIT)" lines={INV_CODE} active={f.line} active2={f.line2}
        note={<>Compression keeps order and drops size: {vals.length} distinct values become ranks 1..{vals.length}.</>} />}
      below={
        <InputEditor
          fields={[{ id: "a", label: "a, 3 to 12 whole numbers (up to ±10^9)", value: txt, onChange: setTxt, wide: true }]}
          onApply={apply} error={err}
          presets={[
            { label: "Huge values", run: () => preset(CMP_DEFAULT) },
            { label: "Sorted (0 pairs)", run: () => preset([2, 40, 900, 5000, 1_000_000]) },
            { label: "Reversed", run: () => preset([1_000_000_000, 70_000, 500, 20, 3]) },
            { label: "Negatives", run: () => preset([-5, 1_000_000, -1_000_000_000, 0, -5, 42]) },
          ]}
          onRandom={() => preset(Array.from({ length: randInt(5, 8) }, () => randChoice(big)))}
        />
      }
    />
  );
}

function CmpView({ f, a, vals, stepKey }: { f: CmpFrame; a: number[]; vals: number[]; stepKey: number }) {
  const box = useRef<HTMLDivElement>(null);
  const width = useWidth(box) || 600;
  const reduce = useReducedMotion();
  const n = a.length, k = vals.length;
  const labels = a.map(fmtBig);
  const longest = Math.max(...labels.map((s) => s.length));
  const padL = 58;
  const minCw = Math.max(46, longest * 9 + 14);
  const cw = Math.max(minCw, Math.min(84, Math.floor((width - padL - 4) / n)));
  const W = padL + n * cw + 4;
  const aY = 22, aH = 34, rY = aY + aH + 6, rH = 26;
  const vY = rY + rH + 74, vH = 34;
  const cY = vY + vH + 22, barMax = 40;
  const H = cY + barMax + 24;
  const ax = (i: number) => padL + (i + 0.5) * cw;
  const vx0 = padL + ((n - k) * cw) / 2;
  const vx = (j: number) => vx0 + (j + 0.5) * cw;           // j = rank - 1
  const maxCnt = Math.max(1, ...f.cnt);

  const cur = f.seen;
  const inLoop = cur !== null;
  // flow line from the current a cell (rank row) to its sorted slot
  const flow = inLoop && f.r !== null ? { x1: ax(cur!), y1: rY + rH, x2: vx(f.r - 1), y2: vY } : null;

  return (
    <div ref={box}>
      <HScroll focusX={cur !== null ? ax(cur) : undefined}>
        <svg className="rq-svg cp-svg" width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Coordinate compression of ${n} values into ${k} ranks.`}>
          <text x={6} y={aY + aH / 2 + 4} className="fw-lab">a</text>
          <text x={6} y={rY + rH / 2 + 4} className="fw-lab">rank</text>
          {f.stage >= 2 && <text x={6} y={vY + vH / 2 + 4} className="fw-lab">vals</text>}
          {f.stage >= 3 && <text x={6} y={cY + barMax - 2} className="fw-lab">count</text>}

          {/* faint flows from first occurrences to the sorted list (stage 2+) */}
          {f.stage >= 2 && !inLoop && a.map((v, i) => {
            if (f.dup[i]) return null;
            const j = vals.indexOf(v);
            return <motion.path key={`fl${i}`} d={`M${ax(i)},${aY + aH} C${ax(i)},${vY - 30} ${vx(j)},${aY + aH + 40} ${vx(j)},${vY}`} className="cp-flow"
              initial={reduce ? false : { pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: 0.6, delay: reduce ? 0 : i * 0.05 }} />;
          })}
          {/* current flow */}
          {flow && (
            <motion.path key={`cur${cur}`} d={`M${flow.x1},${flow.y1} C${flow.x1},${flow.y2 - 26} ${flow.x2},${flow.y1 + 26} ${flow.x2},${flow.y2}`} className="cp-flow cur"
              initial={reduce ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5, ease: "easeOut" }} />
          )}

          {/* a */}
          {a.map((v, i) => {
            const cls = ["cp-cell", f.stage === 1 && f.dup[i] ? "dup" : "", cur === i ? "cur" : "",
              inLoop && f.sumR !== null && i < cur! ? (f.ranks[i]! <= f.sumR ? "le" : "gt") : ""].filter(Boolean).join(" ");
            return (
              <g key={i}>
                <text x={ax(i)} y={aY - 7} textAnchor="middle" className="sg-aidx">{i}</text>
                <rect x={padL + i * cw + 2} y={aY} width={cw - 4} height={aH} rx={8} className={cls} />
                <text x={ax(i)} y={aY + aH / 2 + 5} textAnchor="middle" className={`cp-val${f.stage === 1 && f.dup[i] ? " dup" : ""}`}>{labels[i]}</text>
                {f.stage === 1 && f.dup[i] && <line x1={padL + i * cw + 10} x2={padL + (i + 1) * cw - 10} y1={aY + aH / 2} y2={aY + aH / 2} className="cp-strike" />}
              </g>
            );
          })}
          {/* compressed ranks under a */}
          {a.map((_, i) => {
            const r = f.ranks[i];
            return (
              <g key={`r${i}`}>
                <rect x={padL + i * cw + 8} y={rY} width={cw - 16} height={rH} rx={13} className={`cp-rank${r === null ? " empty" : ""}${cur === i ? " cur" : ""}`} />
                {r !== null && <text x={ax(i)} y={rY + rH / 2 + 5} textAnchor="middle" className="cp-rank-t">{r}</text>}
              </g>
            );
          })}

          {/* sorted unique values with ranks */}
          {f.stage >= 2 && vals.map((v, j) => {
            const hit = f.r === j + 1 && inLoop;
            return (
              <motion.g key={`v${v}`} initial={reduce ? false : { opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: reduce ? 0 : j * 0.06 }}>
                <rect x={vx0 + j * cw + 2} y={vY} width={cw - 4} height={vH} rx={8} className={`cp-v${hit ? " cur" : ""}`} />
                <text x={vx(j)} y={vY + vH / 2 + 5} textAnchor="middle" className="cp-val">{fmtBig(v)}</text>
                {f.stage >= 3 && <text x={vx(j)} y={vY + vH + 15} textAnchor="middle" className={`cp-rlab${hit ? " cur" : ""}`}>r = {j + 1}</text>}
              </motion.g>
            );
          })}

          {/* counts per rank (what the BIT stores) */}
          {f.stage >= 3 && vals.map((_, j) => {
            const r = j + 1, c = f.cnt[r];
            const h = c ? 8 + (c / maxCnt) * (barMax - 8) : 3;
            const tone = f.sumR !== null && c > 0 ? (r <= f.sumR ? " le" : " gt") : "";
            return (
              <g key={`c${j}`} className={`cp-bar${tone}${f.addR === r ? " add" : ""}`}>
                <rect x={vx0 + j * cw + cw * 0.25} y={cY + barMax - h + 4} width={cw * 0.5} height={h} rx={4} />
                {f.addR === r && !reduce && <motion.rect key={`p${stepKey}`} x={vx0 + j * cw + cw * 0.25} y={cY + barMax - h + 4} width={cw * 0.5} height={h} rx={4} className="cp-pulse" initial={{ opacity: 0.7 }} animate={{ opacity: 0 }} transition={{ duration: 0.7 }} />}
                <text x={vx(j)} y={cY + barMax - h} textAnchor="middle" className="cp-cnt">{c}</text>
              </g>
            );
          })}
          {f.stage >= 3 && f.sumR !== null && (() => {
            const xr = vx0 + f.sumR * cw;
            return <line x1={xr} x2={xr} y1={vY - 6} y2={cY + barMax + 6} className="cp-split" />;
          })()}
        </svg>
      </HScroll>
    </div>
  );
}
