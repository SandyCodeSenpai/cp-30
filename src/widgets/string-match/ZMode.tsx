import { useMemo, useRef, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { useReducedMotion, useWidth } from "@/lib/hooks";
import { randChoice, usePlayer } from "../range-query/kit/player";
import { CodePanel, HScroll, LabShell, Legend, Narration, PlayerBar, Vars } from "../range-query/kit/ui";
import { Z_CODE } from "./code";
import { zFrames, type ZFrame } from "./z-engine";
import { StrEditor } from "./StrEditor";

export const Z_DEFAULT = "aabxaabxaa";
const Z_RANDOM = ["aabaabaab", "abacaba", "abaababaab", "aaaaaa", "abcabcab", "aab$baabaa", "abab#babab"];

export default function ZMode({ s: s0, tabs, onComplete }: { s: string; tabs?: ReactNode; onComplete?: () => void }) {
  const [s, setS] = useState(s0);
  const frames = useMemo(() => zFrames(s), [s]);
  const p = usePlayer(frames, onComplete);
  const f = p.frame;
  const stage = (
    <div className="rq-stage">
      <div className="rq-stage-head">
        <span className="rq-stage-title">z_function("{s}")</span>
        <Legend items={[{ cls: "lg-accent", label: "box [l, r)" }, { cls: "lg-dash", label: "known from the box" }, { cls: "lg-good", label: "compared, equal" }, { cls: "lg-bad", label: "mismatch" }]} />
      </div>
      <ZView f={f} s={s} stepKey={p.cur} />
      <div className="fw-foot"><Vars items={f.vars} /></div>
    </div>
  );
  return (
    <LabShell label="Z-function lab" tabs={tabs} stage={stage} onKeyDown={p.onKeyDown}
      narration={<Narration p={p} />} bar={<PlayerBar p={p} />}
      code={<CodePanel title="z_function" lines={Z_CODE} active={f.line} active2={f.line2}
        note={<>z[i] = length of the longest common prefix of s and s[i:]. A period p works when p + z[p] = n.</>} />}
      below={<StrEditor single text={s} textMax={16} onApply={(t) => setS(t)} note="To find a pattern, use s = pattern + '$' + text: a match starts wherever z[i] = len(pattern)."
        presets={[{ label: "aabxaabxaa", t: Z_DEFAULT }, { label: "aaaaaa", t: "aaaaaa" }, { label: "abacaba", t: "abacaba" }, { label: "pattern$text", t: "aba$abababa" }]}
        onRandom={() => setS(randChoice(Z_RANDOM.filter((x) => x !== s)))} />}
    />
  );
}

function ZView({ f, s, stepKey }: { f: ZFrame; s: string; stepKey: number }) {
  const box = useRef<HTMLDivElement>(null);
  const width = useWidth(box) || 600;
  const reduce = useReducedMotion();
  const n = s.length, padL = 34;
  const cw = Math.max(30, Math.min(48, Math.floor((width - padL - 8) / n)));
  const W = padL + n * cw + 8;
  const arcH = 40, labY = arcH + 14, topY = arcH + 36, ch = 32;
  const zY = topY + ch + 6, zH = 22;
  const slY = zY + zH + 22, H = slY + ch + 12;
  const x = (j: number) => padL + j * cw;
  const xc = (j: number) => padL + (j + 0.5) * cw;
  const i = f.i;

  const slState = (j: number) => {
    if (i === null) return "rest";
    if (j < f.known) return "known";
    if (j < f.zi) return "ok";
    if (j === f.zi) {
      if (f.cmp === "ne") return "bad";
      if (f.cmp === "end") return "rest";
      return f.cmp === "eq" ? "rest" : "cmp";
    }
    return "rest";
  };
  const slLen = i === null ? 0 : n - i;
  const showBox = f.r > f.l;

  let copyArc: ReactNode = null;
  if (f.copy && i !== null) {
    const y0 = arcH - 2, x1 = xc(f.copy.from), x2 = xc(i), top = y0 - Math.min(arcH - 26, 6 + Math.abs(x2 - x1) * 0.2);
    const apex = y0 + 0.75 * (top - y0);
    copyArc = (
      <g className="sm-arc copy">
        <motion.path key={`c${stepKey}`} d={`M${x1},${y0} C${x1},${top} ${x2},${top} ${x2},${y0 - 1}`} markerEnd="url(#sm-arrow2)"
          initial={reduce ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.45 }} />
        <rect x={(x1 + x2) / 2 - 46} y={apex - 22} width={92} height={20} rx={10} className="sm-arc-pill" />
        <text x={(x1 + x2) / 2} y={apex - 8} textAnchor="middle" className="sm-arc-txt">copy z[{f.copy.from}]</text>
      </g>
    );
  }

  return (
    <div ref={box}>
      <HScroll focusX={i !== null ? xc(i) : undefined}>
        <svg className="rq-svg" width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Z array of a ${n}-character string.`}>
          <defs>
            <marker id="sm-arrow2" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L8,4 L0,8 z" className="sm-head2" /></marker>
          </defs>
          {i !== null && <rect x={x(i) + 0.5} y={topY - 4} width={cw - 1} height={slY + ch + 4 - (topY - 4)} rx={9} className="sm-band" />}
          <text x={4} y={topY + ch / 2 + 5} className="fw-lab">s</text>
          <text x={4} y={zY + zH / 2 + 4.5} className="fw-lab">z</text>
          {i !== null && <text x={4} y={slY + ch / 2 + 5} className="fw-lab">s</text>}

          {/* the mirror of the box: s[0:r-l] (dashed) and the box itself */}
          {showBox && (
            <motion.g initial={false} animate={{ opacity: 1 }}>
              <motion.rect initial={false} animate={{ x: x(0) - 1, width: (f.r - f.l) * cw + 2 }} y={topY - 3} height={ch + 6} rx={10} className="sm-mirror"
                transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 220, damping: 28 }} />
              <motion.rect initial={false} animate={{ x: x(f.l) - 1, width: (f.r - f.l) * cw + 2 }} y={topY - 3} height={ch + 6} rx={10} className={`sm-box${f.moved ? " moved" : ""}`}
                transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 220, damping: 28 }} />
              <text x={x(f.l) + 2} y={labY} className="sm-box-t">{(f.r - f.l) * cw >= 96 ? `l = ${f.l}` : "l"}</text>
              <text x={x(f.r) - 2} y={labY} textAnchor="end" className="sm-box-t">{(f.r - f.l) * cw >= 96 ? `r = ${f.r}` : "r"}</text>
            </motion.g>
          )}
          {copyArc}
          {Array.from(s).map((c, j) => {
            const zv = f.z[j];
            const inMatch = i !== null && j >= i && j < i + f.zi;
            const isNe = i !== null && j === i + f.zi && f.cmp === "ne";
            const cls = ["sm-cell", inMatch ? (j - i! < f.known ? "known" : "match") : "", isNe ? "ne" : ""].filter(Boolean).join(" ");
            return (
              <g key={j}>
                <text x={xc(j)} y={topY - 9} textAnchor="middle" className={`sg-aidx${j === i ? " sm-on" : ""}`}>{j}</text>
                <rect x={x(j) + 1.5} y={topY} width={cw - 3} height={ch} rx={7} className={cls} />
                <text x={xc(j)} y={topY + ch / 2 + 5} textAnchor="middle" className="sm-ch">{c}</text>
                <rect x={x(j) + 4} y={zY} width={cw - 8} height={zH} rx={6} className={`sm-pi${zv === null ? " empty" : ""}${j === i && zv !== null ? " cur" : ""}${f.copy && f.copy.from === j ? " via" : ""}`} />
                <text x={xc(j)} y={zY + zH / 2 + 4.5} textAnchor="middle" className="sm-pi-t">{zv === null ? (j === i ? f.zi : "") : zv}</text>
              </g>
            );
          })}
          {/* the prefix of s, slid under s[i:] */}
          {i !== null && (
            <motion.g initial={false} animate={{ x: i * cw }} transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 200, damping: 26 }}>
              {Array.from(s.slice(0, Math.max(slLen, 0))).map((c, j) => (
                <g key={j} className={`sm-sl ${slState(j)}`}>
                  <rect x={x(j) + 1.5} y={slY} width={cw - 3} height={ch} rx={7} />
                  <text x={xc(j)} y={slY + ch / 2 + 5} textAnchor="middle" className="sm-ch">{c}</text>
                </g>
              ))}
            </motion.g>
          )}
        </svg>
      </HScroll>
    </div>
  );
}
