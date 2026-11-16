import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Segmented, Toggle, springs } from "@/ui";
import { useReducedMotion } from "@/lib/hooks";
import type { WidgetProps } from "../types";
import { usePlayer } from "./kit/player";
import { CodePanel, InputEditor, LabShell, Narration, PlayerBar, VarRow, fmtList, parseInt1, parseNums, randInt } from "./kit/ui";
import { MODES, buildMemo, buildPermutations, buildPruning, buildQueens, buildSubsets, type Mode, type Run, type RFrame } from "./engine";
import { CallTree } from "./CallTree";
import { Board } from "./Board";
import "./rt.css";

const isMode = (v: unknown): v is Mode => typeof v === "string" && MODES.some((m) => m.value === v);
const clampInt = (v: unknown, a: number, b: number, d: number) => (typeof v === "number" && Number.isFinite(v) ? Math.min(b, Math.max(a, Math.round(v))) : d);
const range1 = (n: number) => Array.from({ length: n }, (_, i) => i + 1);

export default function RecursionTree(props: WidgetProps) {
  const locked = isMode(props.mode) ? props.mode : undefined;
  const [mode, setMode] = useState<Mode>(locked ?? "subsets");
  const m = locked ?? mode;
  const nProp = typeof props.n === "number" ? props.n : undefined;

  // inputs per mode
  const [subNums, setSubNums] = useState<number[]>(range1(clampInt(nProp, 1, 4, 3)));
  const [permNums, setPermNums] = useState<number[]>(range1(clampInt(nProp, 2, 4, 3)));
  const [cands, setCands] = useState<number[]>([1, 2, 2, 3, 5]);
  const [target, setTarget] = useState(5);
  const [cut, setCut] = useState(true);
  const [memoN, setMemoN] = useState(clampInt(nProp, 2, 7, 5));
  const [memoOn, setMemoOn] = useState(false);
  const [fn, setFn] = useState<"stairs" | "fib">("stairs");
  const [qn, setQn] = useState(nProp === 5 ? 5 : 4);
  const [stopFirst, setStopFirst] = useState(false);

  const run: Run = useMemo(() => {
    switch (m) {
      case "subsets": return buildSubsets(subNums);
      case "permutations": return buildPermutations(permNums);
      case "pruning": return buildPruning(cands, target, cut);
      case "memo": return buildMemo(memoN, memoOn, fn);
      case "n-queens": return buildQueens(qn, stopFirst);
    }
  }, [m, subNums, permNums, cands, target, cut, memoN, memoOn, fn, qn, stopFirst]);

  const p = usePlayer<RFrame>(run.frames, props.onComplete);
  const f = p.frame;
  const hasSub = run.nodes.some((x) => x.sub || x.ret);

  const tabs = locked ? undefined : (
    <Segmented<Mode> label="Mode" value={m} options={MODES} onChange={(v) => setMode(v)} />
  );

  const headToggle =
    m === "pruning" ? <Toggle label="Cut (break)" checked={cut} onChange={setCut} /> :
    m === "memo" ? <Toggle label="Memo (@cache)" checked={memoOn} onChange={setMemoOn} /> :
    m === "n-queens" ? <Toggle label="Stop at first solution" checked={stopFirst} onChange={setStopFirst} /> : null;

  const stage = (
    <div className={`rx-stage rt-stage${m === "n-queens" ? " queens" : ""}`}>
      <div className="rx-stage-head">
        <span className="rt-title">{TITLE[m]}</span>
        <span className="rt-calls" aria-live="off">calls <b>{f.vars.calls}</b>{f.vars.hits ? <> · hits <b>{f.vars.hits}</b></> : null}</span>
        {headToggle && <div className="rt-headtoggle">{headToggle}</div>}
      </div>
      <div className="rt-body">
        {m === "n-queens" && f.vars.board && (
          <div className="rt-boardwrap">
            <Board b={f.vars.board} />
            {f.vars.sets && (
              <div className="rt-sets">
                <VarRow name="cols"><Boxes items={f.vars.sets.cols} /></VarRow>
                <VarRow name="r - c"><Boxes items={f.vars.sets.d1} /></VarRow>
                <VarRow name="r + c"><Boxes items={f.vars.sets.d2} /></VarRow>
                <p className="rt-setnote">A square (r, c) is safe when c, r - c and r + c are all missing from these sets.</p>
              </div>
            )}
          </div>
        )}
        <div className="rt-treewrap">
          <CallTree nodes={run.nodes} levelH={hasSub ? 80 : 58} st={f.st} active={f.active} flow={f.flow} flowKey={p.cur} label={`Call tree for ${m}. ${f.say}`} />
        </div>
      </div>
      <Legend m={m} />
      <VarsPanel f={f} run={run} m={m} />
    </div>
  );

  const editor = <Inputs m={m} {...{ subNums, setSubNums, permNums, setPermNums, cands, setCands, target, setTarget, memoN, setMemoN, fn, setFn, qn, setQn }} />;

  return (
    <LabShell label="Recursion tree lab" onKeyDown={p.onKeyDown} tabs={tabs} stage={stage} narration={<Narration p={p} />} bar={<PlayerBar p={p} />}
      code={<CodePanel title={run.title} lines={run.code} active={f.line} active2={f.line2} off={run.off} />}
      below={editor} />
  );
}

const TITLE: Record<Mode, string> = {
  subsets: "Call tree: take or skip each item",
  permutations: "Call tree: pick any unused item",
  pruning: "Call tree: combination sum",
  memo: "Call tree: f(i) = f(i - 1) + f(i - 2)",
  "n-queens": "Board and call tree",
};

function Legend({ m }: { m: Mode }) {
  return (
    <div className="rx-legend" aria-hidden="true">
      <span><i className="acc" />running</span>
      <span><i className="open" />on the call stack</span>
      {m !== "memo" && <span><i className="good" />answer saved</span>}
      {(m === "pruning" || m === "n-queens") && <span><i className="cut" />cut (never called)</span>}
      {m === "pruning" && <span><i className="bad" />wasted call</span>}
      {m === "memo" && <><span><i className="hit" />memo hit</span><span><i className="rep" />repeated work</span></>}
      {m === "subsets" && <span className="rt-dashkey"><svg width="22" height="8" aria-hidden="true"><path d="M1 4 H21" /></svg>skip edge</span>}
    </div>
  );
}

function Boxes({ items, tone }: { items: (string | number)[]; tone?: string }) {
  const reduce = useReducedMotion();
  if (!items.length) return <span className="rx-empty">[]</span>;
  return (
    <AnimatePresence initial={false} mode="popLayout">
      {items.map((x, i) => (
        <motion.span key={`${i}-${x}`} className={`rx-box${tone ? ` ${tone}` : ""}`} layout={!reduce}
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: -10, scale: 0.8 }} animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: -12, scale: 0.8 }} transition={reduce ? { duration: 0.12 } : springs.snappy}>{x}</motion.span>
      ))}
    </AnimatePresence>
  );
}

function VarsPanel({ f, run, m }: { f: RFrame; run: Run; m: Mode }) {
  const v = f.vars;
  return (
    <div className="rt-vars">
      {v.path && <VarRow name="path"><Boxes items={v.path} tone="acc" /></VarRow>}
      {v.used && (
        <VarRow name="used">
          {v.used.map((u, i) => <span key={i} className={`rx-box${u ? " acc" : " dim"}`} title={`used[${i}]`}>{u ? "T" : "F"}</span>)}
        </VarRow>
      )}
      {v.remain !== undefined && <VarRow name="remain"><span className={`rx-box${v.remain < 0 ? " bad" : v.remain === 0 ? " good" : ""}`}>{v.remain}</span></VarRow>}
      {m === "memo" && (
        <VarRow name="cache">
          {v.memo ? (v.memo.length ? <Boxes items={v.memo.map(([k, x]) => `${k}:${x}`)} tone="good" /> : <span className="rx-empty">{"{}"}</span>) : <span className="rx-empty">off: nothing is stored</span>}
        </VarRow>
      )}
      {v.res && (
        <VarRow name="res" note={`${v.res.length} found`}>
          {v.res.length ? v.res.map((r, i) => <span key={i} className="rx-box good">{r}</span>) : <span className="rx-empty">[]</span>}
        </VarRow>
      )}
      {run.totals && (
        <div className="rt-meter" aria-label="Total calls compared">
          {run.totals.map((t) => {
            const max = Math.max(...run.totals!.map((x) => x.value));
            return (
              <div key={t.label} className={`rt-meter-row${t.on ? " on" : ""}`}>
                <span className="rt-meter-label">{t.label}</span>
                <span className="rt-meter-bar"><span style={{ width: `${(t.value / max) * 100}%` }} /></span>
                <span className="rt-meter-val">{t.value} calls</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---------------- Inputs ---------------- */

function Inputs(p: {
  m: Mode;
  subNums: number[]; setSubNums: (v: number[]) => void;
  permNums: number[]; setPermNums: (v: number[]) => void;
  cands: number[]; setCands: (v: number[]) => void;
  target: number; setTarget: (v: number) => void;
  memoN: number; setMemoN: (v: number) => void;
  fn: "stairs" | "fib"; setFn: (v: "stairs" | "fib") => void;
  qn: number; setQn: (v: number) => void;
}) {
  // the key remounts the text fields when the mode or applied value changes
  if (p.m === "subsets") return <NumsInput key={`s${p.subNums.join()}`} value={p.subNums} set={p.setSubNums} min={1} max={4} note="1 to 4 values. The tree has 2^n leaves, so it doubles with every item."
    presets={[[1, 2], [1, 2, 3], [1, 2, 3, 4]]} />;
  if (p.m === "permutations") return <NumsInput key={`p${p.permNums.join()}`} value={p.permNums} set={p.setPermNums} min={2} max={4} note="2 to 4 values. The tree has n! leaves: 24 for n = 4." presets={[[1, 2], [1, 2, 3], [1, 2, 3, 4]]} />;
  if (p.m === "pruning") return <ComboInput key={`c${p.cands.join()}-${p.target}`} {...p} />;
  if (p.m === "memo") return (
    <InputEditor fields={[]} onApply={() => {}}>
      <div className="rt-inline">
        <Segmented<number> label="n" value={p.memoN} onChange={p.setMemoN} options={[2, 3, 4, 5, 6, 7].map((v) => ({ value: v, label: String(v) }))} />
        <Segmented<"stairs" | "fib"> label="Function" value={p.fn} onChange={p.setFn} options={[{ value: "stairs", label: "Climbing stairs" }, { value: "fib", label: "Fibonacci" }]} />
      </div>
    </InputEditor>
  );
  return (
    <InputEditor fields={[]} onApply={() => {}}>
      <div className="rt-inline">
        <Segmented<number> label="Queens" value={p.qn} onChange={p.setQn} options={[{ value: 4, label: "4 × 4" }, { value: 5, label: "5 × 5" }]} />
      </div>
    </InputEditor>
  );
}

function NumsInput({ value, set, min, max, note, presets }: { value: number[]; set: (v: number[]) => void; min: number; max: number; note: string; presets: number[][] }) {
  const [txt, setTxt] = useState(value.join(", "));
  const [err, setErr] = useState<string | null>(null);
  const apply = () => {
    const r = parseNums(txt, { min: 0, max: 9, minLen: min, maxLen: max, name: "numbers" });
    if (typeof r === "string") { setErr(r); return; }
    setErr(null); set(r);
  };
  const random = () => {
    const len = randInt(Math.max(min, 2), Math.min(max, 3));
    const pool = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5).slice(0, len).sort((a, z) => a - z);
    setErr(null); set(pool);
  };
  return (
    <InputEditor fields={[{ id: "nums", label: "nums (0 to 9)", value: txt, onChange: setTxt, wide: true, placeholder: "1, 2, 3" }]} onApply={apply} error={err} note={note}
      onRandom={random} presets={presets.map((ps) => ({ label: fmtList(ps), run: () => { setErr(null); set(ps); } }))} />
  );
}

function ComboInput(p: { cands: number[]; setCands: (v: number[]) => void; target: number; setTarget: (v: number) => void }) {
  const [txt, setTxt] = useState(p.cands.join(", "));
  const [tt, setTt] = useState(String(p.target));
  const [err, setErr] = useState<string | null>(null);
  const apply = () => {
    const r = parseNums(txt, { min: 1, max: 10, minLen: 3, maxLen: 7, name: "candidates" });
    if (typeof r === "string") { setErr(r); return; }
    const t = parseInt1(tt, 1, 12, "target");
    if (typeof t === "string") { setErr(t); return; }
    setErr(null); p.setCands(r); p.setTarget(t);
  };
  const random = () => {
    const len = randInt(4, 6);
    const c = Array.from({ length: len }, () => randInt(1, 6));
    setErr(null); p.setCands(c); p.setTarget(randInt(4, 9));
  };
  return (
    <InputEditor fields={[
      { id: "cands", label: "cands (1 to 10)", value: txt, onChange: setTxt, wide: true, placeholder: "1, 2, 2, 3, 5" },
      { id: "target", label: "target", value: tt, onChange: setTt, numeric: true },
    ]} onApply={apply} error={err} note="3 to 7 candidates, target up to 12. Duplicates are allowed: they show the skip rule." onRandom={random}
      presets={[
        { label: "[1,2,2,3,5] → 5", run: () => { setErr(null); p.setCands([1, 2, 2, 3, 5]); p.setTarget(5); } },
        { label: "[10,1,2,7,6,1,5] → 8", run: () => { setErr(null); p.setCands([10, 1, 2, 7, 6, 1, 5]); p.setTarget(8); } },
        { label: "[2,3,6,7] → 7", run: () => { setErr(null); p.setCands([2, 3, 6, 7]); p.setTarget(7); } },
      ]} />
  );
}
