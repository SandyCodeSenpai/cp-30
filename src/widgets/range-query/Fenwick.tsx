import { useMemo, useState, type ReactNode } from "react";
import { Segmented } from "@/ui";
import { parseNums, randInt, usePlayer } from "./kit/player";
import { CodePanel, InputEditor, LabShell, Legend, Narration, NumIn, PlayerBar, Vars } from "./kit/ui";
import { BIT_CODE } from "./code";
import { fenwickFrames, type FwOp } from "./fw-engine";
import { BitStrip, FenwickView } from "./FenwickView";

export const FW_DEFAULT = [5, 3, 7, 9, 6, 4, 1, 2];
const OPS: { value: FwOp; label: string }[] = [
  { value: "sum", label: "Prefix sum" }, { value: "add", label: "Add" }, { value: "range", label: "Range sum" }, { value: "build", label: "Build" },
];

export default function FenwickMode({ nums: init, tabs, onComplete }: { nums: number[]; tabs?: ReactNode; onComplete?: () => void }) {
  const [nums, setNums] = useState(init);
  const n = nums.length;
  const [op, setOp] = useState<FwOp>("sum");
  const [i, setI] = useState(Math.min(7, n));
  const [d, setD] = useState(4);
  const [l, setL] = useState(3);
  const [r, setR] = useState(Math.min(7, n));
  const ci = Math.min(i, n), cr = Math.min(r, n), cl = Math.min(l, cr);
  const frames = useMemo(() => fenwickFrames(nums, op, { i: ci, d, l: cl, r: cr }), [nums, op, ci, d, cl, cr]);
  const p = usePlayer(frames, onComplete);
  const f = p.frame;

  const [txt, setTxt] = useState(init.join(", "));
  const [err, setErr] = useState<string | null>(null);
  const apply = (s = txt) => {
    const v = parseNums(s, { min: -20, max: 99, minLen: 4, maxLen: 16 });
    if (typeof v === "string") { setErr(v); return; }
    setErr(null); setNums(v); setTxt(v.join(", "));
  };
  const preset = (v: number[]) => { setTxt(v.join(", ")); setErr(null); setNums(v); };

  const touched = op === "add" ? f.changed.length : f.plus.length + f.minus.length;
  const legend = op === "add" ? [{ cls: "lg-accent", label: "current i" }, { cls: "lg-good", label: "updated" }]
    : op === "range" ? [{ cls: "lg-accent", label: "current i" }, { cls: "lg-good", label: "in sum(r)" }, { cls: "lg-warn", label: "in sum(l − 1)" }]
    : op === "build" ? [{ cls: "lg-accent", label: "first cell" }, { cls: "lg-good", label: "changed by this add" }]
    : [{ cls: "lg-accent", label: "current i" }, { cls: "lg-good", label: "added to s" }];

  const top = (
    <div className="rq-top">
      <Segmented<FwOp> label="Operation" value={op} onChange={setOp} options={OPS} />
      {op === "sum" && <NumIn label="i" value={ci} min={1} max={n} onChange={setI} />}
      {op === "add" && <><NumIn label="i" value={ci} min={1} max={n} onChange={setI} /><NumIn label="delta" value={d} min={-20} max={20} onChange={setD} /></>}
      {op === "range" && <><NumIn label="l" value={cl} min={1} max={n} onChange={(v) => { setL(v); if (v > r) setR(v); }} /><NumIn label="r" value={cr} min={1} max={n} onChange={(v) => { setR(v); if (v < l) setL(v); }} /></>}
    </div>
  );

  const stage = (
    <div className="rq-stage">
      <div className="rq-stage-head">
        <span className="rq-stage-title">{op === "sum" ? `bit.sum(${ci})` : op === "add" ? `bit.add(${ci}, ${d})` : op === "range" ? `bit.range_sum(${cl}, ${cr})` : `build BIT(${n})`}</span>
        <Legend items={legend} />
      </div>
      <FenwickView f={f} n={n} stepKey={p.cur} />
      <div className="fw-foot">
        <BitStrip f={f} n={n} />
        <Vars items={f.vars} />
      </div>
    </div>
  );

  return (
    <LabShell label="Fenwick tree lab" tabs={tabs} top={top} stage={stage} onKeyDown={p.onKeyDown}
      narration={<Narration p={p} />} bar={<PlayerBar p={p} />}
      code={<CodePanel title="class BIT" lines={BIT_CODE} active={f.line} active2={f.line2}
        note={op !== "build" ? <>Cells touched so far: <b className="rq-tab">{touched}</b> of n = {n}. A plain loop would touch up to {n}.</> : undefined} />}
      below={
        <InputEditor
          fields={[{ id: "a", label: "a[1..n], 4 to 16 values from −20 to 99", value: txt, onChange: setTxt, wide: true }]}
          onApply={() => apply()} error={err}
          note="The BIT is 1-indexed: a[1] is the first value. Index 0 is never used."
          presets={[
            { label: "8 values", run: () => preset(FW_DEFAULT) },
            { label: "n = 5", run: () => preset([4, -2, 7, 1, 3]) },
            { label: "n = 16", run: () => preset([2, 1, 1, 3, 2, 3, 4, 5, 6, 7, 8, 9, 1, 2, 3, 4]) },
          ]}
          onRandom={() => preset(Array.from({ length: randInt(6, 12) }, () => randInt(0, 9)))}
        />
      }
    />
  );
}
