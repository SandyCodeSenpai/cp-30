import { useMemo, useRef, useState } from "react";
import { useWidth } from "@/lib/hooks";
import { PlayerView, type EditorSpec } from "../prefix-sums/kit/PlayerView";
import { usePlayer } from "../prefix-sums/kit/player";
import { parseNums, randArr, randInt } from "../prefix-sums/kit/parse";
import { HIST_CODE, histFrames, type HistS } from "./frames";
import { Bars, Legend, StackColumn, barGeom } from "./draw";

const PRESETS = [
  { label: "LC 84 example", a: [2, 1, 5, 6, 2, 3] },
  { label: "Staircase", a: [1, 2, 3, 4, 5] },
  { label: "Valley", a: [5, 4, 1, 4, 5] },
];
const LIM = { min: 3, max: 15, lo: 0, hi: 20 };

export default function Histogram({ nums, onEnd }: { nums?: number[]; onEnd: () => void }) {
  const ok = nums && nums.length >= 2 && nums.every((x) => x >= 0);
  const [h, setH] = useState(ok ? nums!.slice(0, 15) : PRESETS[0].a);
  const frames = useMemo(() => histFrames(h), [h]);
  const pl = usePlayer(frames, `hi:${h.join(",")}`, onEnd);
  const [txt, setTxt] = useState(h.join(", "));
  const [err, setErr] = useState<string | null>(null);
  const load = (nh: number[]) => { setH(nh); setTxt(nh.join(", ")); setErr(null); };
  const editor: EditorSpec = {
    fields: [{ id: "h", label: "Bar heights (3 to 15 numbers, 0 to 20)", value: txt, onChange: setTxt, placeholder: "2, 1, 5, 6, 2, 3" }],
    error: err,
    onApply: () => { const r = parseNums(txt, LIM); if (!r.ok) return setErr(r.error); load(r.value); },
    onRandom: () => load(randArr(randInt(5, 9), 1, 9)),
    presets: PRESETS.map((p) => ({ label: p.label, onClick: () => load(p.a) })),
  };
  return (
    <PlayerView pl={pl} code={HIST_CODE} codeTitle="LC 84 Largest Rectangle in Histogram"
      stageLabel={`Histogram of ${h.length} bars, the rectangle being measured, and the stack of indices.`}
      editor={editor} stage={<HistStage s={pl.frame.s} />} />
  );
}

function HistStage({ s }: { s: HistS }) {
  const ref = useRef<HTMLDivElement>(null);
  const w = useWidth(ref) || 600;
  const side = w >= 520 ? 104 : 80;
  const N = s.h.length, sentinel = N - 1;
  const { LW, bw } = barGeom(w, N, side);
  const H = 150;
  const stackSet = new Set(s.stack), settled = new Set(s.settled);
  const cls = (k: number) => {
    if (s.popped === k) return "pop";
    if (s.cmp?.j === k) return s.cmp.ok ? "cmp-ok" : "cmp-no";
    if (k === s.i) return "cur";
    if (stackSet.has(k)) return "wait";
    if (settled.has(k)) return "done";
    return k > s.i ? "future" : "done";
  };
  const rects: { l: number; r: number; h: number; cls: string; label?: string }[] = [];
  if (s.best) rects.push({ ...s.best, cls: "best", label: s.rect ? undefined : `best ${s.best.area}` });
  if (s.rect) rects.push({ ...s.rect, cls: "cur", label: `${s.rect.h} × ${s.rect.r - s.rect.l + 1} = ${s.rect.area}` });
  const stackCls = (j: number) => (s.cmp?.j === j ? (s.cmp.ok ? "cmp-ok" : "cmp-no") : "");
  return (
    <div ref={ref}>
      <div className="ms-layout">
        <div className="ak-scroll ms-left">
          <Bars values={s.h} bw={bw} LW={LW} H={H} zero cls={cls} rowLabel="h" sentinel={sentinel} rects={rects} />
          <div className="ms-best" style={{ marginLeft: LW }}>best = <b>{s.bestVal}</b></div>
        </div>
        <StackColumn items={s.stack} values={s.h} title="stack" sub="indices" cls={stackCls} minH={54 + H} width={side} />
      </div>
      <Legend items={[{ cls: "cur", label: "arriving" }, { cls: "wait", label: "on the stack" }, { cls: "pop", label: "popped: measure it" }, { cls: "rect", label: "its rectangle" }, { cls: "best", label: "best so far" }]} />
    </div>
  );
}
