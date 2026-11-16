import { useMemo, useRef, useState } from "react";
import { useWidth } from "@/lib/hooks";
import { PlayerView, type EditorSpec } from "../prefix-sums/kit/PlayerView";
import { usePlayer } from "../prefix-sums/kit/player";
import { parseInt1, parseNums, randArr, randInt } from "../prefix-sums/kit/parse";
import { WIN_CODE, winFrames, type WinS } from "./frames";
import { Bars, CellRow, DequeRow, Legend, barGeom } from "./draw";

const PRESETS = [
  { label: "LC 239 example", a: [1, 3, -1, -3, 5, 3, 6, 7], k: 3 },
  { label: "Decreasing", a: [9, 8, 7, 6, 5, 4], k: 3 },
  { label: "Increasing", a: [1, 2, 3, 4, 5, 6], k: 2 },
];
const LIM = { min: 4, max: 16, lo: -99, hi: 99 };

export default function WindowMax({ nums, k: k0, onEnd }: { nums?: number[]; k?: number; onEnd: () => void }) {
  const init = nums && nums.length >= 2 ? nums.slice(0, 16) : PRESETS[0].a;
  const [a, setA] = useState(init);
  const [k, setK] = useState(typeof k0 === "number" && k0 >= 1 && k0 <= init.length ? k0 : nums ? Math.min(3, init.length) : PRESETS[0].k);
  const frames = useMemo(() => winFrames(a, k), [a, k]);
  const pl = usePlayer(frames, `wm:${a.join(",")}:${k}`, onEnd);
  const [txt, setTxt] = useState(a.join(", "));
  const [kt, setKt] = useState(String(k));
  const [err, setErr] = useState<string | null>(null);
  const load = (na: number[], nk: number) => { setA(na); setK(nk); setTxt(na.join(", ")); setKt(String(nk)); setErr(null); };
  const editor: EditorSpec = {
    fields: [
      { id: "a", label: "Array a (4 to 16 numbers)", value: txt, onChange: setTxt, placeholder: "1, 3, -1, -3, 5" },
      { id: "k", label: "Window k", value: kt, onChange: setKt, narrow: true },
    ],
    error: err,
    onApply: () => {
      const r = parseNums(txt, LIM); if (!r.ok) return setErr(r.error);
      const K = parseInt1(kt, "k", 1, r.value.length); if (!K.ok) return setErr(K.error);
      load(r.value, K.value);
    },
    onRandom: () => { const na = randArr(randInt(7, 11), -5, 9); load(na, randInt(2, 4)); },
    presets: PRESETS.map((p) => ({ label: p.label, onClick: () => load(p.a, p.k) })),
  };
  return (
    <PlayerView pl={pl} code={WIN_CODE} codeTitle={`window_max(a, ${k})`}
      stageLabel={`Array of ${a.length} values with a window of size ${k}, the deque of indices, and the window maxima.`}
      editor={editor} stage={<WinStage s={pl.frame.s} />} />
  );
}

function WinStage({ s }: { s: WinS }) {
  const ref = useRef<HTMLDivElement>(null);
  const w = useWidth(ref) || 600;
  const { LW, bw } = barGeom(w, s.a.length, 0);
  const H = 120;
  const inDq = new Set(s.dq);
  const lo = Math.max(0, s.i - s.k + 1);
  const cls = (k: number) => {
    if (s.popped?.j === k) return "drop";
    if (s.front?.j === k) return s.front.out ? "drop" : "front";
    if (s.cmp?.j === k) return s.cmp.ok ? "cmp-ok" : "cmp-no";
    if (s.wrote !== null && s.dq[0] === k) return "max";
    if (k === s.i) return "cur";
    if (inDq.has(k)) return "wait";
    return k > s.i ? "future" : "done";
  };
  const band = s.i >= 0 && s.i < s.a.length ? { l: lo, r: s.i } : null;
  const outCls = (k: number) => (s.wrote === k ? "new" : s.out[k] !== null ? "set" : "empty");
  const dqCls = (j: number) => (s.cmp?.j === j ? (s.cmp.ok ? "cmp-ok" : "cmp-no") : s.front?.j === j ? (s.front.out ? "cmp-ok" : "front") : s.wrote !== null && s.dq[0] === j ? "max" : "");
  return (
    <div ref={ref}>
      <div className="ak-scroll">
        <Bars values={s.a} bw={bw} LW={LW} H={H} cls={cls} rowLabel="a" band={band} />
        <CellRow values={s.out} bw={bw} LW={LW} label="out" cls={outCls} />
      </div>
      <DequeRow items={s.dq} values={s.a} cls={dqCls} />
      <Legend items={[{ cls: "band", label: `window (k = ${s.k})` }, { cls: "cur", label: "arriving" }, { cls: "wait", label: "in the deque" }, { cls: "drop", label: "leaving" }, { cls: "max", label: "window max" }]} />
    </div>
  );
}
