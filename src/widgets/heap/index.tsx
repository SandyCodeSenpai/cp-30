import { useMemo, useState, type FormEvent } from "react";
import { Button, Segmented, Stage } from "@/ui";
import type { WidgetProps } from "../types";
import { CodePanel, InputEditor, LabShell, Narration, parseInt1, parseNums, PlayerBar, randInt, usePlayer, type Run } from "../binary-search/player";
import {
  buildBasics, buildMedian, buildMerge, buildTopK, CODE_MEDIAN, CODE_MERGE, CODE_POP, CODE_PUSH, CODE_TOPK, mergeItemId,
  type Built, type HeapFrame, type HeapMode, type Item, type Op,
} from "./engine";
import { HeapStage, type Meta } from "./HeapStage";
import "./heap.css";

const MODES: { value: HeapMode; label: string }[] = [
  { value: "basics", label: "Push and pop" },
  { value: "top-k", label: "Top k" },
  { value: "median", label: "Median" },
  { value: "merge-k", label: "Merge k" },
];

const BASICS0 = [5, 3, 8, 1, 9, 2];
const TOPK0 = { a: [4, 1, 7, 3, 8, 5, 9, 2], k: 3 };
const MEDIAN0 = [5, 15, 1, 3, 8, 7, 9];
const MERGE0 = [[1, 4, 9], [2, 3, 8, 10], [5, 6]];
const MAX_HEAP = 15;

const isNums = (v: unknown): v is number[] => Array.isArray(v) && v.length > 0 && v.every((x) => typeof x === "number" && Number.isFinite(x));
const opsFrom = (a: number[]): Op[] => [...a.map((v): Op => ({ t: "push", v })), { t: "pop" }];
const deal = (a: number[], k: number) => {
  const s = [...a].sort((p, q) => p - q);
  const out: number[][] = Array.from({ length: k }, () => []);
  s.forEach((v, i) => out[i % k].push(v));
  return out.filter((l) => l.length);
};
const listsText = (ls: number[][]) => ls.map((l) => l.join(", ")).join(" | ");

export default function Heap(props: WidgetProps) {
  const locked = MODES.some((m) => m.value === props.mode) ? (props.mode as HeapMode) : undefined;
  const [mode, setMode] = useState<HeapMode>(locked ?? "basics");
  const pNums = isNums(props.nums) ? props.nums.map(Math.round).filter((v) => v >= 0 && v <= 99) : undefined;
  const pK = typeof props.k === "number" ? Math.round(props.k) : undefined;

  const [basics, setBasics] = useState<{ ops: Op[]; jump: boolean }>(() => ({ ops: opsFrom(pNums && pNums.length <= 12 ? pNums : BASICS0), jump: false }));
  const [topk, setTopk] = useState(() => (pNums && pNums.length >= 2 && pNums.length <= 14 ? { a: pNums, k: Math.max(1, Math.min(pK ?? 3, 5, pNums.length - 1)) } : TOPK0));
  const [median, setMedian] = useState(() => (pNums && pNums.length >= 2 && pNums.length <= 12 ? pNums : MEDIAN0));
  const [merge, setMerge] = useState(() => (pNums && pNums.length >= 2 && pNums.length <= 16 ? deal(pNums, Math.max(2, Math.min(4, pK ?? 3))) : MERGE0));

  const built: Built = useMemo(() => {
    if (mode === "basics") return buildBasics(basics.ops);
    if (mode === "top-k") return buildTopK(topk.a, topk.k);
    if (mode === "median") return buildMedian(median);
    return buildMerge(merge);
  }, [mode, basics, topk, median, merge]);

  const run: Run<HeapFrame> = useMemo(() => (mode === "basics" && basics.jump
    ? { frames: built.frames, start: built.starts[built.starts.length - 1] ?? 0, autoplay: true }
    : { frames: built.frames }), [built, mode, basics.jump]);

  const meta: Meta = useMemo(() => {
    const nh = built.frames[0]?.heaps.length ?? 1;
    const maxSize = Array.from({ length: nh }, (_, i) => Math.max(1, ...built.frames.map((fr) => fr.heaps[i].length)));
    const trayMax = Math.max(0, ...built.frames.map((fr) => fr.tray.length));
    if (mode === "top-k") return { mode, maxSize, trayMax, stream: topk.a.map((v, i): Item => ({ id: i, v, key: [v] })) };
    if (mode === "median") return { mode, maxSize, trayMax: 0, stream: median.map((v, i): Item => ({ id: i, v, key: [v] })) };
    if (mode === "merge-k") return { mode, maxSize, trayMax, lists: merge.map((l, i) => l.map((v, j): Item => ({ id: mergeItemId(i, j), v, key: [v, i, j] }))) };
    return { mode, maxSize, trayMax };
  }, [built, mode, topk, median, merge]);

  const p = usePlayer(run, props.onComplete);
  const f = p.frame;

  /* ---- basics: push / pop buttons ---- */
  const finalSize = built.frames[built.frames.length - 1]?.heaps[0]?.length ?? 0;
  const [pushVal, setPushVal] = useState("4");
  const [pushErr, setPushErr] = useState<string | null>(null);
  const addOp = (op: Op) => { setBasics((b) => ({ ops: [...b.ops, op], jump: true })); };
  const onPush = (e: FormEvent) => {
    e.preventDefault();
    const v = parseInt1(pushVal, 0, 99, "Value");
    if (typeof v === "string") { setPushErr(v); return; }
    setPushErr(null); addOp({ t: "push", v }); setPushVal(String(randInt(0, 30)));
  };

  /* ---- input editor ---- */
  const curText = mode === "basics" ? basics.ops.filter((o): o is { t: "push"; v: number } => o.t === "push").map((o) => o.v).join(", ")
    : mode === "top-k" ? topk.a.join(", ") : mode === "median" ? median.join(", ") : listsText(merge);
  const curT = mode === "top-k" ? String(topk.k) : "";
  const key = `${mode}|${curText}|${curT}`;
  const [draft, setDraft] = useState({ key, a: curText, t: curT });
  const d = draft.key === key ? draft : { key, a: curText, t: curT };
  const [err, setErr] = useState<string | null>(null);
  const setD = (patch: Partial<typeof d>) => { setErr(null); setDraft({ ...d, ...patch }); };

  const apply = () => {
    if (mode === "merge-k") {
      const parts = d.a.split("|").map((s) => s.trim()).filter(Boolean);
      if (parts.length < 2 || parts.length > 4) return setErr("Enter 2 to 4 lists, separated by |.");
      const ls: number[][] = [];
      for (const part of parts) {
        const a = parseNums(part, { min: 0, max: 99, minLen: 1, maxLen: 5, name: "values per list" });
        if (typeof a === "string") return setErr(a);
        ls.push([...a].sort((x, y) => x - y));
      }
      setMerge(ls); return setErr(null);
    }
    const lim = mode === "basics" ? { minLen: 1, maxLen: 12 } : mode === "top-k" ? { minLen: 2, maxLen: 14 } : { minLen: 2, maxLen: 12 };
    const a = parseNums(d.a, { min: 0, max: 99, ...lim });
    if (typeof a === "string") return setErr(a);
    if (mode === "basics") setBasics({ ops: opsFrom(a), jump: false });
    else if (mode === "median") setMedian(a);
    else {
      const k = parseInt1(d.t, 1, Math.min(5, a.length - 1), "k");
      if (typeof k === "string") return setErr(k);
      setTopk({ a, k });
    }
    setErr(null);
  };
  const rnd = (n: number, max = 40) => Array.from({ length: n }, () => randInt(0, max));
  const random = () => {
    setErr(null);
    if (mode === "basics") setBasics({ ops: opsFrom(rnd(randInt(4, 7))), jump: false });
    else if (mode === "top-k") { const a = rnd(randInt(6, 10)); setTopk({ a, k: randInt(2, 4) }); }
    else if (mode === "median") setMedian(rnd(randInt(5, 9)));
    else setMerge(Array.from({ length: randInt(2, 4) }, () => rnd(randInt(1, 4), 30).sort((x, y) => x - y)));
  };
  const presets = mode === "basics"
    ? [{ label: "Mixed", run: () => setBasics({ ops: opsFrom(BASICS0), jump: false }) }, { label: "Descending", run: () => setBasics({ ops: opsFrom([9, 7, 5, 3, 1]), jump: false }) }, { label: "Ascending", run: () => setBasics({ ops: opsFrom([1, 3, 5, 7, 9]), jump: false }) }]
    : mode === "top-k"
      ? [{ label: "Default", run: () => setTopk(TOPK0) }, { label: "LC 215: k = 2", run: () => setTopk({ a: [3, 2, 1, 5, 6, 4], k: 2 }) }, { label: "Sorted", run: () => setTopk({ a: [1, 2, 3, 4, 5, 6, 7], k: 3 }) }]
      : mode === "median"
        ? [{ label: "Default", run: () => setMedian(MEDIAN0) }, { label: "Ascending", run: () => setMedian([1, 2, 3, 4, 5, 6, 7, 8]) }, { label: "LC 295", run: () => setMedian([1, 2, 3]) }]
        : [{ label: "Default", run: () => setMerge(MERGE0) }, { label: "LC 23 example", run: () => setMerge([[1, 4, 5], [1, 3, 4], [2, 6]]) }, { label: "Four lists", run: () => setMerge([[3, 9], [1, 7, 12], [2, 4], [5, 6, 8]]) }];
  const fields = mode === "top-k"
    ? [{ id: "a", label: "nums", value: d.a, onChange: (v: string) => setD({ a: v }), wide: true }, { id: "t", label: "k", value: d.t, onChange: (v: string) => setD({ t: v }), numeric: true }]
    : [{ id: "a", label: mode === "basics" ? "Values to push (then one pop)" : mode === "median" ? "Stream of numbers" : "Sorted lists, separated by |", value: d.a, onChange: (v: string) => setD({ a: v }), wide: true }];
  const note = mode === "basics" ? "1 to 12 values from 0 to 99." : mode === "top-k" ? "2 to 14 values from 0 to 99. k from 1 to 5." : mode === "median" ? "2 to 12 values from 0 to 99." : "2 to 4 lists of 1 to 5 values. Each list is sorted for you.";

  /* ---- code ---- */
  const code = mode === "basics" ? (f?.code === "pop" ? CODE_POP : CODE_PUSH) : mode === "top-k" ? CODE_TOPK : mode === "median" ? CODE_MEDIAN : CODE_MERGE;
  const codeTitle = mode === "basics" ? (f?.code === "pop" ? "heappop, written out" : "heappush, written out") : mode === "top-k" ? "k_largest(nums, k)" : mode === "median" ? "class Median" : "merge_k(lists)";

  const head = mode === "basics"
    ? <div className="hp-head">
      <span className="hp-rule">Min-heap rule: every parent &lt;= its children</span>
      <form className="hp-ops" onSubmit={onPush}>
        <label className="hp-push"><span className="sr-only">Value to push</span>
          <input value={pushVal} onChange={(e) => { setPushVal(e.target.value); setPushErr(null); }} inputMode="numeric" aria-label="Value to push" aria-invalid={!!pushErr} />
        </label>
        <Button size="s" variant="tinted" type="submit" disabled={finalSize >= MAX_HEAP}>Push</Button>
        <Button size="s" variant="tinted" onClick={() => addOp({ t: "pop" })} disabled={finalSize === 0}>Pop</Button>
      </form>
      {pushErr && <span className="hp-err" role="alert">{pushErr}</span>}
    </div>
    : mode === "top-k"
      ? <div className="hp-head"><span className="hp-k">k = {topk.k}</span><span className="hp-rule">Keep a min-heap of the k largest. Its root is the k-th largest.</span></div>
      : mode === "median"
        ? <div className="hp-head"><span className={`hp-median${f?.median ? " on" : ""}`}>median() = {f?.median ?? "?"}</span><span className="hp-rule">lo may hold one more item than hi</span></div>
        : <div className="hp-head"><span className="hp-k">k = {merge.length} lists</span><span className="hp-k">N = {merge.reduce((s, l) => s + l.length, 0)} values</span><span className="hp-rule">The heap holds one head per list</span></div>;

  const tabs = !locked ? <Segmented<HeapMode> value={mode} onChange={(m) => { setMode(m); setErr(null); }} options={MODES} /> : undefined;

  return (
    <LabShell
      label="Heap lab"
      onKeyDown={p.onKeyDown}
      tabs={tabs}
      stage={f && <Stage className="hp-stage">{head}<HeapStage f={f} meta={meta} /></Stage>}
      narration={<Narration p={p} />}
      bar={<PlayerBar p={p} />}
      code={f && <CodePanel title={codeTitle} lines={code} active={f.line} active2={f.line2} />}
      below={<InputEditor key={mode} fields={fields} onApply={apply} error={err} presets={presets} onRandom={random} note={note} defaultOpen={!props.compact} />}
    />
  );
}
