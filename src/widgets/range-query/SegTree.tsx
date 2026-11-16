import { useMemo, useRef, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { Segmented } from "@/ui";
import { useReducedMotion, useWidth } from "@/lib/hooks";
import { parseNums, randInt, usePlayer } from "./kit/player";
import { CodePanel, HScroll, InputEditor, LabShell, Legend, Narration, NumIn, PlayerBar, Vars } from "./kit/ui";
import { SEG_CODE } from "./code";
import { fmtV, leavesOf, rangeLabel, segFrames, type SegFn, type SegFrame, type SegOp } from "./seg-engine";

export const SEG_DEFAULT = [5, 8, 6, 3, 2, 7, 2, 6];
const OPS: { value: SegOp; label: string }[] = [{ value: "query", label: "Query" }, { value: "update", label: "Update" }, { value: "build", label: "Build" }];
const FNS: { value: SegFn; label: string }[] = [{ value: "min", label: "min" }, { value: "max", label: "max" }, { value: "sum", label: "sum" }];

export default function SegTreeMode({ nums: init, tabs, onComplete }: { nums: number[]; tabs?: ReactNode; onComplete?: () => void }) {
  const [nums, setNums] = useState(init);
  const n = nums.length;
  const [op, setOp] = useState<SegOp>("query");
  const [fn, setFn] = useState<SegFn>("min");
  const [l, setL] = useState(1);
  const [r, setR] = useState(Math.min(6, n));
  const [i, setI] = useState(3);
  const [v, setV] = useState(1);
  const cr = Math.min(Math.max(r, 1), n), cl = Math.min(l, cr - 1), ci = Math.min(i, n - 1);
  const frames = useMemo(() => segFrames(nums, fn, op, { l: cl, r: cr, i: ci, v }), [nums, fn, op, cl, cr, ci, v]);
  const p = usePlayer(frames, onComplete);
  const f = p.frame;

  const [txt, setTxt] = useState(init.join(", "));
  const [err, setErr] = useState<string | null>(null);
  const preset = (vals: number[]) => { setTxt(vals.join(", ")); setErr(null); setNums(vals); };
  const apply = () => {
    const vals = parseNums(txt, { min: -99, max: 99, minLen: 4, maxLen: 16 });
    if (typeof vals === "string") { setErr(vals); return; }
    preset(vals);
  };

  const legend = op === "query"
    ? [{ cls: "lg-ring", label: "visited" }, { cls: "lg-good", label: "used in res" }, { cls: "lg-warn", label: "partly covered" }, { cls: "lg-dim", label: "skipped" }]
    : [{ cls: "lg-accent", label: "being written" }, { cls: "lg-ring", label: "children read" }, { cls: "lg-good", label: "rewritten" }];

  const top = (
    <div className="rq-top">
      <Segmented<SegOp> label="Operation" value={op} onChange={setOp} options={OPS} />
      <Segmented<SegFn> label="op" value={fn} onChange={setFn} options={FNS} />
      {op === "query" && <><NumIn label="l" value={cl} min={0} max={n - 1} onChange={(x) => { setL(x); if (x >= r) setR(x + 1); }} /><NumIn label="r" value={cr} min={1} max={n} onChange={(x) => { setR(x); if (x <= l) setL(x - 1); }} /></>}
      {op === "update" && <><NumIn label="i" value={ci} min={0} max={n - 1} onChange={setI} /><NumIn label="value" value={v} min={-99} max={99} onChange={setV} /></>}
    </div>
  );

  const title = op === "query" ? `st.query(${cl}, ${cr})  # ${fn} of a[${cl}:${cr}]` : op === "update" ? `st.update(${ci}, ${v})` : `SegTree(a, ${fn === "sum" ? "add" : fn}, ${fmtV(fn === "min" ? Infinity : fn === "max" ? -Infinity : 0)})`;
  const stage = (
    <div className="rq-stage">
      <div className="rq-stage-head"><span className="rq-stage-title">{title}</span><Legend items={legend} /></div>
      <SegView f={f} n={n} op={op} stepKey={p.cur} />
      <div className="fw-foot"><Vars items={f.vars} /></div>
    </div>
  );

  const pow2 = (n & (n - 1)) === 0;
  return (
    <LabShell label="Segment tree lab" tabs={tabs} top={top} stage={stage} onKeyDown={p.onKeyDown}
      narration={<Narration p={p} />} bar={<PlayerBar p={p} />}
      code={<CodePanel title="class SegTree" lines={SEG_CODE} active={f.line} active2={f.line2}
        note={pow2 ? <>Node i has children 2i and 2i + 1. Leaves sit at t[{n}..{2 * n - 1}].</> : <>n = {n} is not a power of two, so the leaves sit on two levels. The query still works because op is commutative.</>} />}
      below={
        <InputEditor
          fields={[{ id: "a", label: "a[0..n-1], 4 to 16 values from −99 to 99", value: txt, onChange: setTxt, wide: true }]}
          onApply={apply} error={err} note="The segment tree is 0-indexed; queries are half-open: query(l, r) covers a[l..r − 1]."
          presets={[
            { label: "n = 8", run: () => preset(SEG_DEFAULT) },
            { label: "n = 6 (two leaf levels)", run: () => preset([4, 9, 1, 7, 3, 8]) },
            { label: "n = 16", run: () => preset([7, 2, 9, 4, 6, 1, 8, 3, 5, 9, 2, 7, 4, 6, 3, 8]) },
          ]}
          onRandom={() => preset(Array.from({ length: randInt(6, 10) }, () => randInt(0, 20)))}
        />
      }
    />
  );
}

function SegView({ f, n, op, stepKey }: { f: SegFrame; n: number; op: SegOp; stepKey: number }) {
  const box = useRef<HTMLDivElement>(null);
  const width = useWidth(box) || 600;
  const reduce = useReducedMotion();
  const N = 2 * n - 1, D = Math.floor(Math.log2(N)), slots = 1 << D;
  const slotW = Math.max(40, Math.min(92, Math.floor((width - 8) / slots)));
  const W = slots * slotW + 8;
  const nodeW = Math.min(slotW - 6, 66), nodeH = 32, levelH = 64, top = 26;
  const depth = (i: number) => Math.floor(Math.log2(i));
  const pos = (i: number) => { const d = depth(i); const sw = (W - 8) / (1 << d); return { x: 4 + (i - (1 << d) + 0.5) * sw, y: top + d * levelH, sw }; };
  const arrY = top + D * levelH + nodeH + 44;
  const cellW = Math.min(56, (W - 8) / n), arrX0 = (W - cellW * n) / 2;
  const H = arrY + 34 + 26;

  // relation of each node to the query range
  const rel = useMemo(() => {
    const m = new Map<number, "full" | "part" | "out">();
    if (!f.q) return m;
    const [L, R] = f.q;
    for (let v = 1; v <= N; v++) {
      const ls = leavesOf(v, n), inside = ls.filter((x) => x >= L && x < R).length;
      m.set(v, inside === ls.length ? "full" : inside === 0 ? "out" : "part");
    }
    return m;
  }, [f.q, n, N]);
  const used = new Set(f.used), visited = new Set(f.visited), changed = new Set(f.changed), kids = new Set(f.kids);
  const valOf = (v: number) => (v < n && v < f.built ? null : f.t[v]);
  const aVals = f.t.slice(n, 2 * n);

  const focusX = f.hot ? pos(f.hot).x : f.l !== null && f.l <= N ? pos(f.l).x : undefined;
  return (
    <div ref={box} className="sg-wrap">
      <HScroll focusX={focusX}>
        <svg className="rq-svg sg-svg" width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Segment tree over ${n} values, ${N} nodes.`}>
          {/* edges */}
          {Array.from({ length: N }, (_, k) => k + 1).filter((v) => v > 1).map((v) => {
            const a = pos(v >> 1), b = pos(v);
            const on = (f.hot === v >> 1 && kids.has(v));
            return <line key={`e${v}`} x1={a.x} y1={a.y + nodeH} x2={b.x} y2={b.y} className={`sg-edge${on ? " on" : ""}`} />;
          })}
          {/* leaf to array connectors */}
          {Array.from({ length: n }, (_, k) => k).map((k) => {
            const b = pos(n + k), cx = arrX0 + (k + 0.5) * cellW;
            return <path key={`c${k}`} d={`M${b.x},${b.y + nodeH} C${b.x},${arrY - 18} ${cx},${b.y + nodeH + 18} ${cx},${arrY}`} className="sg-link" />;
          })}
          {/* nodes */}
          {Array.from({ length: N }, (_, k) => k + 1).map((v) => {
            const { x, y } = pos(v);
            const r = rel.get(v);
            const cls = ["sg-node",
              v >= n ? "leaf" : "",
              r ? `rel-${r}` : "",
              used.has(v) ? "used" : "",
              visited.has(v) ? "visited" : "",
              changed.has(v) ? "changed" : "",
              kids.has(v) ? "kid" : "",
              f.hot === v ? "hot" : "",
              valOf(v) === null ? "unbuilt" : "",
              f.l === v ? "ptr" : ""].filter(Boolean).join(" ");
            const val = valOf(v);
            return (
              <g key={v} className={cls}>
                <rect x={x - nodeW / 2} y={y} width={nodeW} height={nodeH} rx={10} />
                {f.hot === v && !reduce && <motion.rect key={`p${stepKey}`} x={x - nodeW / 2} y={y} width={nodeW} height={nodeH} rx={10} className="sg-pulse" initial={{ opacity: 0.65 }} animate={{ opacity: 0 }} transition={{ duration: 0.7 }} />}
                <text x={x} y={y + nodeH / 2 + 5} textAnchor="middle" className="sg-val">{val === null ? fmtV(f.t[v]) : fmtV(val)}</text>
                <text x={f.l === v || (f.i === v && op !== "build") ? x + 12 : x} y={y - 6} textAnchor="middle" className="sg-idx"><title>{`t[${v}] covers ${rangeLabel(v, n)}`}</title>{v}</text>
              </g>
            );
          })}
          {/* pointers */}
          {f.l !== null && f.l <= N && f.r !== null && f.l < f.r && (() => { const { x, y } = pos(f.l); return (
            <motion.g initial={false} animate={{ x: x - nodeW / 2, y: y - 21 }} transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 28 }}>
              <rect x={0} y={0} width={18} height={18} rx={9} className="sg-ptr" /><text x={9} y={13} textAnchor="middle" className="sg-ptr-t">l</text>
            </motion.g>); })()}
          {f.r !== null && f.l !== null && f.l < f.r && f.r - 1 >= 1 && (() => { const p0 = pos(f.r - 1); const bx = p0.x + p0.sw / 2; return (
            <motion.g initial={false} animate={{ x: bx, y: p0.y - 4 }} transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 28 }}>
              <line x1={0} y1={0} x2={0} y2={nodeH + 8} className="sg-rline" />
              <rect x={-9} y={-17} width={18} height={18} rx={9} className="sg-ptr" /><text x={0} y={-4} textAnchor="middle" className="sg-ptr-t">r</text>
            </motion.g>); })()}
          {f.i !== null && op !== "build" && f.i <= N && (() => { const { x, y } = pos(f.i); return (
            <motion.g initial={false} animate={{ x: x - nodeW / 2, y: y - 21 }} transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 28 }}>
              <rect x={0} y={0} width={18} height={18} rx={9} className="sg-ptr" /><text x={9} y={13} textAnchor="middle" className="sg-ptr-t">i</text>
            </motion.g>); })()}

          {/* the array */}
          <text x={arrX0 - 6} y={arrY + 22} textAnchor="end" className="fw-lab">a</text>
          {aVals.map((val, k) => {
            const inQ = f.q ? k >= f.q[0] && k < f.q[1] : false;
            const changedLeaf = changed.has(n + k);
            return (
              <g key={k}>
                <rect x={arrX0 + k * cellW + 2} y={arrY} width={cellW - 4} height={32} rx={8} className={`sg-cell${inQ ? " inq" : ""}${changedLeaf ? " chg" : ""}`} />
                <text x={arrX0 + (k + 0.5) * cellW} y={arrY + 21} textAnchor="middle" className="fw-val">{val}</text>
                <text x={arrX0 + (k + 0.5) * cellW} y={arrY + 50} textAnchor="middle" className="sg-aidx">{k}</text>
              </g>
            );
          })}
          {f.q && (() => {
            const x1 = arrX0 + f.q[0] * cellW + 1, x2 = arrX0 + f.q[1] * cellW - 1;
            return <path d={`M${x1},${arrY - 6} L${x1},${arrY - 10} L${x2},${arrY - 10} L${x2},${arrY - 6}`} className="sg-brk" />;
          })()}
        </svg>
      </HScroll>
    </div>
  );
}
