import { useMemo, useRef, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { useReducedMotion, useWidth } from "@/lib/hooks";
import { randInt, usePlayer } from "../range-query/kit/player";
import { CodePanel, HScroll, LabShell, Legend, Narration, PlayerBar, Vars } from "../range-query/kit/ui";
import { KMP_CODE } from "./code";
import { kmpFrames, showCh, type KmpFrame } from "./kmp-engine";
import { StrEditor, PATS, TEXTS } from "./StrEditor";

export const KMP_TEXT = "abacababab", KMP_PAT = "abab";

export default function KmpMode({ text: t0, pattern: p0, tabs, onComplete }: { text: string; pattern: string; tabs?: ReactNode; onComplete?: () => void }) {
  const [text, setText] = useState(t0);
  const [pat, setPat] = useState(p0);
  const { s, frames } = useMemo(() => kmpFrames(text, pat), [text, pat]);
  const p = usePlayer(frames, onComplete);
  const f = p.frame;

  const stage = (
    <div className="rq-stage">
      <div className="rq-stage-head">
        <span className="rq-stage-title">find_all("{text}", "{pat}")</span>
        <Legend items={[{ cls: "lg-accent", label: "comparing" }, { cls: "lg-good", label: "matched" }, { cls: "lg-bad", label: "mismatch" }, { cls: "lg-warn", label: "fallback" }]} />
      </div>
      <KmpView f={f} s={s} m={pat.length} stepKey={p.cur} />
      <div className="fw-foot"><Vars items={f.vars} /></div>
    </div>
  );
  return (
    <LabShell label="KMP lab" tabs={tabs} stage={stage} onKeyDown={p.onKeyDown}
      narration={<Narration p={p} />} bar={<PlayerBar p={p} />}
      code={<CodePanel title="prefix_function + find_all" lines={KMP_CODE} active={f.line} active2={f.line2}
        note={<>pi[i] = length of the longest proper prefix of s[:i+1] that is also its suffix.</>} />}
      below={<StrEditor text={text} pat={pat} textMax={16} patMax={6}
        onApply={(t, q) => { setText(t); setPat(q); }}
        presets={[{ label: "abab in text", t: KMP_TEXT, p: KMP_PAT }, { label: "Many fallbacks", t: "aabaaabaaaab", p: "aaab" }, { label: "Overlaps", t: "aaaaaaa", p: "aaa" }, { label: "No match", t: "abcabdabcab", p: "abcabc" }]}
        onRandom={() => { const j = randInt(0, PATS.length - 1); setPat(PATS[j]); setText(TEXTS[j]); }} />}
    />
  );
}

function KmpView({ f, s, m, stepKey }: { f: KmpFrame; s: string; m: number; stepKey: number }) {
  const box = useRef<HTMLDivElement>(null);
  const width = useWidth(box) || 600;
  const reduce = useReducedMotion();
  const N = s.length, padL = 34;
  const cw = Math.max(26, Math.min(44, Math.floor((width - padL - 8) / N)));
  const W = padL + N * cw + 8;
  const arcH = 46, idxY = arcH + 10, topY = arcH + 16, ch = 32;
  const piY = topY + ch + 4, piH = 22;
  const regY = piY + piH + 14;
  const slY = regY + 18, H = slY + ch + 10;
  const x = (j: number) => padL + j * cw;
  const xc = (j: number) => padL + (j + 0.5) * cw;

  const i = f.i, k = f.k;
  const matchCells = new Set<number>();
  for (const st of f.matches) for (let j = 0; j < m; j++) matchCells.add(m + 1 + st + j);
  const newCells = new Set<number>();
  if (f.newMatch !== undefined) for (let j = 0; j < m; j++) newCells.add(m + 1 + f.newMatch + j);

  // sliding row state
  const off = i !== null && k !== null ? i - k : 0;
  const pending = f.cmp === undefined || !!f.arc;
  const cellState = (j: number) => {
    if (i === null || k === null) return "";
    if (pending) return j < k ? "ok" : j === k ? "cmp" : "rest";
    if (f.cmp === "eq") return j <= k ? "ok" : "rest";
    return j < k ? "ok" : j === k ? "bad" : "rest";
  };

  let arc: ReactNode = null;
  if (f.arc) {
    const x1 = xc(f.arc.from), x2 = xc(f.arc.to), top = topY - 8 - Math.min(arcH - 14, 12 + Math.abs(x1 - x2) * 0.3);
    const apex = topY - 4 + 0.75 * (top - (topY - 4));
    arc = (
      <g className="sm-arc">
        <motion.path key={`a${stepKey}`} d={`M${x1},${topY - 4} C${x1},${top} ${x2},${top} ${x2},${topY - 6}`} markerEnd="url(#sm-arrow)"
          initial={reduce ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.45, ease: "easeOut" }} />
        <rect x={(x1 + x2) / 2 - 44} y={apex - 22} width={88} height={20} rx={10} className="sm-arc-pill" />
        <text x={(x1 + x2) / 2} y={apex - 8} textAnchor="middle" className="sm-arc-txt">k = pi[{f.arc.via}]</text>
      </g>
    );
  }

  return (
    <div ref={box}>
      <HScroll focusX={i !== null ? xc(i) : undefined}>
        <svg className="rq-svg" width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Prefix function over pattern plus separator plus text, ${N} characters.`}>
          <defs>
            <marker id="sm-arrow" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L8,4 L0,8 z" className="sm-head" /></marker>
          </defs>
          {i !== null && <rect x={x(i) + 0.5} y={topY - 4} width={cw - 1} height={slY + ch + 4 - (topY - 4)} rx={9} className="sm-band" />}
          <text x={4} y={topY + ch / 2 + 5} className="fw-lab">s</text>
          {i !== null && k !== null && <text x={4} y={slY + ch / 2 + 5} className="fw-lab">pat</text>}
          <text x={4} y={piY + piH / 2 + 5} className="fw-lab">pi</text>
          {arc}
          {Array.from(s).map((c, j) => {
            const cls = ["sm-cell", j === m ? "sep" : "", matchCells.has(j) ? "match" : "", newCells.has(j) ? "new" : "", j === i ? "cur" : "",
              j === i && !pending ? (f.cmp === "eq" ? "eq" : "ne") : ""].filter(Boolean).join(" ");
            const piv = f.pi[j];
            const piCls = ["sm-pi", piv === null ? "empty" : "", j === i && piv !== null ? "cur" : "", piv === m && j > m ? "full" : "", f.arc && f.arc.via === j ? "via" : ""].filter(Boolean).join(" ");
            return (
              <g key={j}>
                <text x={xc(j)} y={idxY} textAnchor="middle" className={`sg-aidx${j === i ? " sm-on" : ""}`}>{j}</text>
                <rect x={x(j) + 1.5} y={topY} width={cw - 3} height={ch} rx={7} className={cls} />
                <text x={xc(j)} y={topY + ch / 2 + 5} textAnchor="middle" className={`sm-ch${j === m ? " sep" : ""}`}>{showCh(c)}</text>
                <rect x={x(j) + 4} y={piY} width={cw - 8} height={piH} rx={6} className={piCls} />
                <text x={xc(j)} y={piY + piH / 2 + 4.5} textAnchor="middle" className="sm-pi-t">{piv === null ? "" : piv}</text>
              </g>
            );
          })}
          {/* region labels */}
          <path d={`M${x(0) + 2},${regY - 6} L${x(0) + 2},${regY - 2} L${x(m) - 2},${regY - 2} L${x(m) - 2},${regY - 6}`} className="sm-brk" />
          <text x={(x(0) + x(m)) / 2} y={regY + 11} textAnchor="middle" className="sm-reg">pattern</text>
          {N > m + 1 && <>
            <path d={`M${x(m + 1) + 2},${regY - 6} L${x(m + 1) + 2},${regY - 2} L${x(N) - 2},${regY - 2} L${x(N) - 2},${regY - 6}`} className="sm-brk" />
            <text x={(x(m + 1) + x(N)) / 2} y={regY + 11} textAnchor="middle" className="sm-reg">text</text>
          </>}

          {/* the sliding pattern: pat[k] sits under s[i] */}
          {i !== null && k !== null && (
            <motion.g initial={false} animate={{ x: off * cw }} transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 200, damping: 26 }}>
              {Array.from(s.slice(0, m + 1)).map((c, j) => {
                const st = cellState(j);
                if (j === m && st !== "cmp" && st !== "bad") return null;
                return (
                  <g key={j} className={`sm-sl ${st}`}>
                    <rect x={x(j) + 1.5} y={slY} width={cw - 3} height={ch} rx={7} />
                    <text x={xc(j)} y={slY + ch / 2 + 5} textAnchor="middle" className={`sm-ch${j === m ? " sep" : ""}`}>{showCh(c)}</text>
                  </g>
                );
              })}
            </motion.g>
          )}
        </svg>
      </HScroll>
    </div>
  );
}
