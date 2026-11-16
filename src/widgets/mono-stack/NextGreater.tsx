import { useMemo, useRef, useState } from "react";
import { Segmented } from "@/ui";
import { useWidth } from "@/lib/hooks";
import { PlayerView, type EditorSpec } from "../prefix-sums/kit/PlayerView";
import { usePlayer } from "../prefix-sums/kit/player";
import { parseNums, randArr, randInt } from "../prefix-sums/kit/parse";
import { NG_CODE, ngFrames, type NgVariant, type StackS } from "./frames";
import { Bars, CellRow, Legend, StackColumn, barGeom } from "./draw";

const PRESETS = [
  { label: "LC 739 example", a: [73, 74, 75, 71, 69, 72, 76, 73] },
  { label: "Ties", a: [70, 70, 71, 69, 69, 72] },
  { label: "Decreasing", a: [80, 77, 74, 71, 68] },
];
const LIM = { min: 4, max: 16, lo: -99, hi: 150 };

export default function NextGreater({ nums, onEnd }: { nums?: number[]; onEnd: () => void }) {
  const [a, setA] = useState(nums && nums.length >= 2 ? nums.slice(0, 16) : PRESETS[0].a);
  const [variant, setVariant] = useState<NgVariant>("days");
  const frames = useMemo(() => ngFrames(a, variant), [a, variant]);
  const pl = usePlayer(frames, `ng:${variant}:${a.join(",")}`, onEnd);

  const [txt, setTxt] = useState(a.join(", "));
  const [err, setErr] = useState<string | null>(null);
  const load = (na: number[]) => { setA(na); setTxt(na.join(", ")); setErr(null); };
  const editor: EditorSpec = {
    fields: [{ id: "a", label: variant === "days" ? "Temperatures (4 to 16 numbers)" : "Array a (4 to 16 numbers)", value: txt, onChange: setTxt, placeholder: "73, 74, 75, 71" }],
    error: err,
    onApply: () => { const r = parseNums(txt, LIM); if (!r.ok) return setErr(r.error); load(r.value); },
    onRandom: () => load(randArr(randInt(6, 10), 60, 80)),
    presets: PRESETS.map((p) => ({ label: p.label, onClick: () => load(p.a) })),
  };

  return (
    <PlayerView pl={pl} code={NG_CODE[variant]} codeTitle={variant === "days" ? "LC 739 Daily Temperatures" : "next_greater(a)"}
      stageLabel={`Bars for ${a.length} values, the answers below them, and the stack of waiting indices.`}
      editor={editor}
      aside={
        <div className="ms-variant">
          <Segmented<NgVariant> label="Answer to store" value={variant} onChange={setVariant}
            options={[{ value: "days", label: "Days to wait (i − j)" }, { value: "index", label: "Index (i)" }]} />
        </div>
      }
      stage={<NgStage s={pl.frame.s} days={variant === "days"} />} />
  );
}

function NgStage({ s, days }: { s: StackS; days: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const w = useWidth(ref) || 600;
  const side = w >= 520 ? 104 : 80;
  const { LW, bw } = barGeom(w, s.a.length, side);
  const H = 132;
  const stackSet = new Set(s.stack), doneSet = new Set(s.answered);
  const cls = (k: number) => {
    if (s.popped === k) return "pop";
    if (s.cmp?.j === k) return s.cmp.ok ? "cmp-ok" : "cmp-no";
    if (k === s.i) return "cur";
    if (stackSet.has(k)) return s.done ? "left" : "wait";
    if (doneSet.has(k)) return "done";
    return k > s.i ? "future" : "done";
  };
  const fill = days ? "0" : "−1";
  const ansVals = s.ans.map((v) => (v === null ? fill : v));
  const ansCls = (k: number) => (s.arc && s.arc[0] === k ? "new" : s.ans[k] !== null && (doneSet.has(k) || s.done) && !(s.done && stackSet.has(k)) ? "set" : "pending");
  const arc = s.arc ? { from: s.arc[0], to: s.arc[1], label: days ? `${s.arc[1] - s.arc[0]} day${s.arc[1] - s.arc[0] === 1 ? "" : "s"}` : `next greater: ${s.arc[1]}` } : null;
  const stackCls = (j: number) => (s.cmp?.j === j ? (s.cmp.ok ? "cmp-ok" : "cmp-no") : "");
  return (
    <div ref={ref}>
      <div className="ms-layout">
        <div className="ak-scroll ms-left">
          <Bars values={s.a} bw={bw} LW={LW} H={H} cls={cls} rowLabel={days ? "temp" : "a"} arc={arc} />
          <CellRow values={ansVals} bw={bw} LW={LW} label={days ? "ans" : "res"} cls={ansCls} />
        </div>
        <StackColumn items={s.stack} values={s.a} title="stack" sub="indices" cls={stackCls} minH={HEAD_H + H} width={side} />
      </div>
      <Legend items={[{ cls: "cur", label: "arriving" }, { cls: "wait", label: "on the stack, waiting" }, { cls: "pop", label: "answered now" }, { cls: "done", label: "answered" }]} />
    </div>
  );
}
const HEAD_H = 54;
