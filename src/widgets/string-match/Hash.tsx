import { useMemo, useRef, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { Button, Icon, Segmented } from "@/ui";
import { useReducedMotion, useWidth } from "@/lib/hooks";
import { randInt, usePlayer } from "../range-query/kit/player";
import { CodePanel, HScroll, LabShell, Legend, Narration, PlayerBar, Vars } from "../range-query/kit/ui";
import { HASH_CODE } from "./code";
import { DEMO, REAL_M, fmtH, hashFrames, randomBase, type HashCfg, type HashFrame } from "./hash-engine";
import { PATS, StrEditor, TEXTS } from "./StrEditor";

export const HASH_TEXT = "abracadabra", HASH_PAT = "abra";
type Num = "demo" | "real";

export default function HashMode({ text: t0, pattern: p0, tabs, onComplete }: { text: string; pattern: string; tabs?: ReactNode; onComplete?: () => void }) {
  const [text, setText] = useState(t0);
  const [pat, setPat] = useState(p0);
  const [num, setNum] = useState<Num>("demo");
  const [B, setB] = useState<bigint>(() => randomBase());
  const cfg: HashCfg = num === "demo" ? DEMO : { B, M: REAL_M, demo: false };
  const frames = useMemo(() => hashFrames(text, pat, cfg), [text, pat, num, B]); // eslint-disable-line react-hooks/exhaustive-deps
  const p = usePlayer(frames, onComplete);
  const f = p.frame;

  const top = (
    <div className="rq-top">
      <Segmented<Num> label="Numbers" value={num} onChange={setNum} options={[{ value: "demo", label: "Small: B = 31, M = 101" }, { value: "real", label: "Real: M = 2^61 − 1" }]} />
      {num === "real" && <Button size="s" variant="ghost" onClick={() => setB(randomBase())}><Icon name="repeat" size={16} />New random B</Button>}
    </div>
  );
  const stage = (
    <div className="rq-stage">
      <div className="rq-stage-head">
        <span className="rq-stage-title">find "{pat}" in "{text}"</span>
        <Legend items={[{ cls: "lg-accent", label: "window" }, { cls: "lg-good", label: "match" }, { cls: "lg-bad", label: "collision" }]} />
      </div>
      <HashView f={f} text={text} pat={pat} demo={cfg.demo} />
      <Formula f={f} />
      <div className="fw-foot"><Vars items={f.vars} /></div>
    </div>
  );
  return (
    <LabShell label="Rolling hash lab" tabs={tabs} top={top} stage={stage} onKeyDown={p.onKeyDown}
      narration={<Narration p={p} />} bar={<PlayerBar p={p} />}
      code={<CodePanel title="rolling hash" lines={HASH_CODE} active={f.line} active2={f.line2}
        note={num === "demo" ? <>The picture uses B = 31 and M = 101 so you can check the arithmetic. With M that small, collisions are common. The template uses M = 2^61 − 1 and a random B.</>
          : <>B = {B.toString()} (random, as in the template). Collisions are now about 1 in 2·10^18 per compare.</>} />}
      below={<StrEditor text={text} pat={pat} textMax={16} patMax={6}
        onApply={(t, q) => { setText(t); setPat(q); }}
        presets={[{ label: "abracadabra", t: HASH_TEXT, p: HASH_PAT }, { label: "Collision at 1", t: "ccdaddaada", p: "add" }, { label: "Collision at 7", t: "cbbdcbaabd", p: "cba" }, { label: "Repeats", t: "aaaaaaaa", p: "aaa" }]}
        onRandom={() => { const j = randInt(0, PATS.length - 1); setPat(PATS[j]); setText(TEXTS[j]); }} />}
    />
  );
}

function HashView({ f, text, pat, demo }: { f: HashFrame; text: string; pat: string; demo: boolean }) {
  const box = useRef<HTMLDivElement>(null);
  const width = useWidth(box) || 600;
  const reduce = useReducedMotion();
  const n = text.length, m = pat.length, padL = 42;
  const cw = Math.max(34, Math.min(52, Math.floor((width - padL - 20) / n)));
  const W = padL + n * cw + 20;
  const idxY = 14, topY = 22, ch = 34, hY = topY + ch + 18;
  const pY = hY + 26, H = pY + ch + 10;
  const x = (j: number) => padL + j * cw;
  const xc = (j: number) => padL + (j + 0.5) * cw;
  const scanning = f.win !== null;
  const tone = f.verdict === "match" ? "match" : f.verdict === "collision" ? "coll" : f.verdict === "equal" ? "eq" : "";
  const short = (v: bigint | null) => (v === null ? "" : demo || v < 1000n ? fmtH(v) : `…${v.toString().slice(-3)}`);
  const building = !scanning && f.built > 0 && f.target === null;

  return (
    <div ref={box}>
      <HScroll focusX={scanning ? xc(f.win! + m / 2) : building ? xc(f.built - 1) : undefined}>
        <svg className="rq-svg" width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Rolling hash over a ${n}-character text with a ${m}-character pattern.`}>
          <text x={4} y={topY + ch / 2 + 5} className="fw-lab">text</text>
          <text x={4} y={hY + 4} className="fw-lab">h</text>
          {/* matches and collisions found so far */}
          {Array.from(text).map((c, j) => {
            const inWin = scanning && j >= f.win! && j < f.win! + m;
            const cur = building && j === f.built - 1;
            const found = f.matches.some((l) => j >= l && j < l + m), coll = !found && f.collisions.some((l) => j >= l && j < l + m);
            const cls = ["sm-cell", cur ? "cur" : "", found ? "match" : coll ? "coll" : "", inWin ? `win ${tone}` : "", !scanning && j >= f.built && f.target === null ? "todo" : ""].filter(Boolean).join(" ");
            return (
              <g key={j}>
                <text x={xc(j)} y={idxY} textAnchor="middle" className="sg-aidx">{j}</text>
                <rect x={x(j) + 1.5} y={topY} width={cw - 3} height={ch} rx={7} className={cls} />
                <text x={xc(j)} y={topY + ch / 2 + 5} textAnchor="middle" className="sm-ch">{c}</text>
              </g>
            );
          })}
          {/* prefix hashes on the boundaries: h[i] = hash of text[:i] */}
          {f.h.map((v, j) => {
            const hot = (building && j === f.built) || (scanning && (j === f.win || j === f.win! + m));
            return (
              <g key={`h${j}`} className={`hs-h${v === null ? " empty" : ""}${hot ? " hot" : ""}`}>
                <line x1={x(j)} x2={x(j)} y1={topY + ch + 3} y2={hY - 9} />
                <text x={x(j)} y={hY + 4} textAnchor="middle">{short(v)}</text>
              </g>
            );
          })}
          {/* the window and the pattern under it */}
          {scanning && (
            <motion.g initial={false} animate={{ x: f.win! * cw }} transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 200, damping: 26 }}>
              <rect x={x(0) - 2} y={topY - 4} width={m * cw + 4} height={ch + 8} rx={10} className={`hs-win ${tone}`} />
              {Array.from(pat).map((c, j) => {
                const same = text[f.win! + j] === c;
                const cmpShown = f.verdict === "match" || f.verdict === "collision";
                return (
                  <g key={j} className={`sm-sl ${cmpShown ? (same ? "ok" : "bad") : "rest pat"}`}>
                    <rect x={x(j) + 1.5} y={pY} width={cw - 3} height={ch} rx={7} />
                    <text x={xc(j)} y={pY + ch / 2 + 5} textAnchor="middle" className="sm-ch">{c}</text>
                  </g>
                );
              })}
            </motion.g>
          )}
          {scanning && <text x={4} y={pY + ch / 2 + 5} className="fw-lab">pat</text>}
        </svg>
      </HScroll>
    </div>
  );
}

function Formula({ f }: { f: HashFrame }) {
  if (!f.formula) return <div className="hs-formula empty" aria-hidden="true" />;
  const v = f.verdict;
  return (
    <div className={`hs-formula${v ? ` v-${v}` : ""}`}>
      <pre>{f.formula.join("\n")}</pre>
      {v && <span className={`hs-verdict v-${v}`}>{v === "skip" ? "different: skip" : v === "equal" ? "equal: confirm" : v === "match" ? "confirmed match" : "collision"}</span>}
    </div>
  );
}
