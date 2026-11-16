import { useMemo, useState } from "react";
import { Segmented, Stage, Toggle } from "@/ui";
import type { WidgetProps } from "../types";
import {
  buildBoundary, buildClassic, buildOnAnswer, CODE_CLASSIC, CODE_KOKO, CODE_SPLIT, codeBoundary, COND_INFO, kokoCheck, splitCheck,
  type BsFrame, type BsMode, type Cond, type Problem,
} from "./engine";
import { AnswerLine, ArrayView, CheckPanel } from "./BsStage";
import { CodePanel, InputEditor, LabShell, Narration, parseInt1, parseNums, PlayerBar, randInt, usePlayer, type Run } from "./player";
import "./bs.css";

const MODES: { value: BsMode; label: string }[] = [
  { value: "classic", label: "Classic" },
  { value: "boundary", label: "Boundary" },
  { value: "on-answer", label: "On the answer" },
];

const CLASSIC0 = { a: [1, 3, 4, 7, 9, 11, 15, 20], t: 7 };
const BOUND0 = { a: [1, 2, 2, 4, 4, 4, 7, 9], x: 4 };
const ROT0 = [9, 11, 15, 2, 4, 6, 7];
const KOKO0 = { a: [3, 6, 7, 11], t: 8 };
const SPLIT0 = { a: [7, 2, 5, 10, 8], t: 2 };

const isNums = (v: unknown): v is number[] => Array.isArray(v) && v.length > 0 && v.every((x) => typeof x === "number" && Number.isFinite(x));
const sortNums = (a: number[]) => [...a].sort((p, q) => p - q);
const isRotated = (a: number[]) => {
  if (new Set(a).size !== a.length) return false;
  let drops = 0;
  for (let i = 0; i + 1 < a.length; i++) if (a[i] > a[i + 1]) drops++;
  return drops === 0 || (drops === 1 && a[a.length - 1] < a[0]);
};
const sortedDistinct = (n: number, max: number) => {
  const s = new Set<number>(); while (s.size < n) s.add(randInt(1, max));
  return sortNums([...s]);
};

export default function BinarySearch(props: WidgetProps) {
  const locked = MODES.some((m) => m.value === props.mode) ? (props.mode as BsMode) : undefined;
  const [mode, setMode] = useState<BsMode>(locked ?? "classic");
  const pNums = isNums(props.nums) ? props.nums.map(Math.round) : undefined;
  const pT = typeof props.target === "number" ? Math.round(props.target) : undefined;
  const pProblem = props.problem === "split" ? "split" : props.problem === "koko" ? "koko" : undefined;
  const pCond = props.cond === "gt" || props.cond === "rot" || props.cond === "ge" ? (props.cond as Cond) : undefined;

  // Applied inputs per mode (props seed them when valid).
  const [classic, setClassic] = useState(() => (pNums && pNums.length >= 2 && pNums.length <= 16 ? { a: sortNums(pNums), t: pT ?? pNums[Math.floor(pNums.length / 2)] } : CLASSIC0));
  const [bound, setBound] = useState(() => (pNums && pNums.length >= 2 && pNums.length <= 16 && pCond !== "rot" ? { a: sortNums(pNums), x: pT ?? BOUND0.x } : BOUND0));
  const [rot, setRot] = useState(() => (pNums && pCond === "rot" && isRotated(pNums) ? pNums : ROT0));
  const [cond, setCond] = useState<Cond>(pCond ?? "ge");
  const [problem, setProblem] = useState<Problem>(pProblem ?? "koko");
  const [koko, setKoko] = useState(() => (pNums && (pProblem ?? "koko") === "koko" && pNums.length <= 8 && pNums.every((v) => v >= 1 && v <= 30) && pT !== undefined && pT >= pNums.length ? { a: pNums, t: pT } : KOKO0));
  const [split, setSplit] = useState(() => (pNums && pProblem === "split" && pNums.length <= 8 && pNums.every((v) => v >= 1 && v <= 15) && pT !== undefined && pT >= 1 && pT <= pNums.length ? { a: pNums, t: pT } : SPLIT0));
  const [revealAll, setRevealAll] = useState(false);

  const run: Run<BsFrame> = useMemo(() => {
    if (mode === "classic") return { frames: buildClassic(classic.a, classic.t) };
    if (mode === "boundary") return { frames: cond === "rot" ? buildBoundary(rot, "rot", 0) : buildBoundary(bound.a, cond, bound.x) };
    const s = problem === "koko" ? koko : split;
    return { frames: buildOnAnswer(problem, s.a, s.t) };
  }, [mode, classic, bound, rot, cond, problem, koko, split]);

  const p = usePlayer(run, props.onComplete);
  const f = p.frame;

  /* ---- input editor (drafts) ---- */
  const cur = mode === "classic" ? { a: classic.a, t: classic.t } : mode === "boundary" ? (cond === "rot" ? { a: rot, t: 0 } : { a: bound.a, t: bound.x }) : problem === "koko" ? koko : split;
  const key = `${mode}-${cond}-${problem}-${cur.a.join(",")}-${cur.t}`;
  const [draft, setDraft] = useState<{ key: string; a: string; t: string }>({ key, a: cur.a.join(", "), t: String(cur.t) });
  const d = draft.key === key ? draft : { key, a: cur.a.join(", "), t: String(cur.t) };
  const [err, setErr] = useState<string | null>(null);
  const setD = (patch: Partial<typeof d>) => { setErr(null); setDraft({ ...d, ...patch }); };

  const apply = () => {
    if (mode === "classic" || (mode === "boundary" && cond !== "rot")) {
      const a = parseNums(d.a, { min: -99, max: 99, minLen: 4, maxLen: 16 });
      if (typeof a === "string") return setErr(a);
      const t = parseInt1(d.t, -99, 99, mode === "classic" ? "Target" : "x");
      if (typeof t === "string") return setErr(t);
      if (mode === "classic") setClassic({ a: sortNums(a), t }); else setBound({ a: sortNums(a), x: t });
      return setErr(null);
    }
    if (mode === "boundary") {
      const a = parseNums(d.a, { min: -99, max: 99, minLen: 4, maxLen: 16 });
      if (typeof a === "string") return setErr(a);
      if (!isRotated(a)) return setErr("Enter a sorted array of different values, rotated once, such as 9, 11, 15, 2, 4, 6, 7.");
      setRot(a); return setErr(null);
    }
    if (problem === "koko") {
      const a = parseNums(d.a, { min: 1, max: 30, minLen: 2, maxLen: 8, name: "piles" });
      if (typeof a === "string") return setErr(a);
      const t = parseInt1(d.t, a.length, 60, "Hours h");
      if (typeof t === "string") return setErr(`${t} Koko needs at least 1 hour per pile.`);
      setKoko({ a, t }); return setErr(null);
    }
    const a = parseNums(d.a, { min: 1, max: 15, minLen: 3, maxLen: 8 });
    if (typeof a === "string") return setErr(a);
    const t = parseInt1(d.t, 1, a.length, "Parts k");
    if (typeof t === "string") return setErr(t);
    setSplit({ a, t }); setErr(null);
  };

  const random = () => {
    setErr(null);
    if (mode === "classic") {
      const a = sortedDistinct(randInt(6, 12), 60);
      setClassic({ a, t: Math.random() < 0.7 ? a[randInt(0, a.length - 1)] : randInt(1, 60) });
    } else if (mode === "boundary") {
      if (cond === "rot") { const a = sortedDistinct(randInt(5, 10), 50); const k = randInt(1, a.length - 1); setRot([...a.slice(k), ...a.slice(0, k)]); }
      else { const a = sortNums(Array.from({ length: randInt(6, 12) }, () => randInt(1, 12))); setBound({ a, x: a[randInt(0, a.length - 1)] }); }
    } else if (problem === "koko") {
      const a = Array.from({ length: randInt(3, 6) }, () => randInt(2, 25));
      setKoko({ a, t: randInt(a.length + 1, a.length * 3) });
    } else {
      const a = Array.from({ length: randInt(4, 7) }, () => randInt(1, 12));
      setSplit({ a, t: randInt(2, 3) });
    }
  };

  const presets = mode === "classic"
    ? [
      { label: "Found", run: () => setClassic(CLASSIC0) },
      { label: "Not found", run: () => setClassic({ a: CLASSIC0.a, t: 8 }) },
      { label: "16 items", run: () => setClassic({ a: [2, 5, 8, 12, 16, 23, 38, 42, 56, 61, 72, 77, 81, 88, 91, 99], t: 72 }) },
      { label: "First item", run: () => setClassic({ a: CLASSIC0.a, t: 1 }) },
    ]
    : mode === "boundary"
      ? (cond === "rot"
        ? [{ label: "Rotated", run: () => setRot(ROT0) }, { label: "Not rotated", run: () => setRot([2, 4, 6, 7, 9, 11]) }, { label: "Min at end", run: () => setRot([5, 6, 7, 8, 9, 1]) }]
        : [{ label: "Duplicates", run: () => setBound(BOUND0) }, { label: "All False", run: () => setBound({ a: BOUND0.a, x: 10 }) }, { label: "All True", run: () => setBound({ a: BOUND0.a, x: 0 }) }])
      : problem === "koko"
        ? [{ label: "Book example", run: () => setKoko(KOKO0) }, { label: "LC 875 example 3", run: () => setKoko({ a: [30, 11, 23, 4, 20], t: 6 }) }]
        : [{ label: "LC 410 example", run: () => setSplit(SPLIT0) }, { label: "1 to 5, k = 2", run: () => setSplit({ a: [1, 2, 3, 4, 5], t: 2 }) }];

  const fields = mode === "classic"
    ? [{ id: "a", label: "Sorted array", value: d.a, onChange: (v: string) => setD({ a: v }), wide: true }, { id: "t", label: "Target", value: d.t, onChange: (v: string) => setD({ t: v }), numeric: true }]
    : mode === "boundary"
      ? (cond === "rot"
        ? [{ id: "a", label: "Rotated sorted array", value: d.a, onChange: (v: string) => setD({ a: v }), wide: true }]
        : [{ id: "a", label: "Sorted array", value: d.a, onChange: (v: string) => setD({ a: v }), wide: true }, { id: "t", label: "x", value: d.t, onChange: (v: string) => setD({ t: v }), numeric: true }])
      : problem === "koko"
        ? [{ id: "a", label: "piles", value: d.a, onChange: (v: string) => setD({ a: v }), wide: true }, { id: "t", label: "h (hours)", value: d.t, onChange: (v: string) => setD({ t: v }), numeric: true }]
        : [{ id: "a", label: "nums", value: d.a, onChange: (v: string) => setD({ a: v }), wide: true }, { id: "t", label: "k (parts)", value: d.t, onChange: (v: string) => setD({ t: v }), numeric: true }];

  const note = mode === "classic" || (mode === "boundary" && cond !== "rot") ? "4 to 16 values from -99 to 99. They are sorted for you." : mode === "boundary" ? "Distinct values, sorted and then rotated once." : problem === "koko" ? "2 to 8 piles of 1 to 30 bananas. h must be at least the number of piles." : "3 to 8 values from 1 to 15. k from 1 to the number of values.";

  /* ---- code ---- */
  const code = mode === "classic" ? CODE_CLASSIC : mode === "boundary" ? codeBoundary(cond) : problem === "koko" ? CODE_KOKO : CODE_SPLIT;
  const codeTitle = mode === "classic" ? "search(a, target)" : mode === "boundary" ? `first_true: ${COND_INFO[cond].name}` : problem === "koko" ? "first_true + Koko check" : "first_true + split check";

  /* ---- stage ---- */
  const sub = mode === "boundary"
    ? <div className="bs-sub">
      <Segmented<Cond> label="ok(i)" value={cond} onChange={(c) => { setCond(c); setErr(null); }} options={(["ge", "gt", "rot"] as Cond[]).map((c) => ({ value: c, label: COND_INFO[c].label }))} />
      <Toggle label="Show every ok(i)" checked={revealAll} onChange={setRevealAll} />
    </div>
    : mode === "on-answer"
      ? <div className="bs-sub">
        <Segmented<Problem> label="Problem" value={problem} onChange={(v) => { setProblem(v); setErr(null); }} options={[{ value: "koko", label: "Koko" }, { value: "split", label: "Split array" }]} />
        <Toggle label="Show every check" checked={revealAll} onChange={setRevealAll} />
      </div>
      : null;

  const head = mode === "classic"
    ? <div className="bs-head">Find <span className="bs-k">target = {classic.t}</span> in a sorted array.<span className="bs-inv">Invariant: <code>a[:lo] &lt; {classic.t} &lt;= a[hi:]</code></span></div>
    : mode === "boundary"
      ? <div className="bs-head">{cond === "rot" ? <span className="bs-k">a[-1] = {rot[rot.length - 1]}</span> : <span className="bs-k">x = {bound.x}</span>}<span className="bs-inv">Find the first T in F..F T..T</span></div>
      : problem === "koko"
        ? <div className="bs-head"><span className="bs-k">piles = [{koko.a.join(", ")}]</span><span className="bs-k">h = {koko.t}</span><span className="bs-inv">Smallest speed k with check(k) = yes</span></div>
        : <div className="bs-head"><span className="bs-k">nums = [{split.a.join(", ")}]</span><span className="bs-k">k = {split.t}</span><span className="bs-inv">Smallest cap with check(cap) = yes</span></div>;

  const okOf = (v: number) => (problem === "koko" ? kokoCheck(koko.a, koko.t, v).ok : splitCheck(split.a, split.t, v).ok);

  const stage = f && (
    <Stage className="bs-stage">
      {head}
      {sub}
      {mode === "on-answer"
        ? <div className="bs-ans">
          <AnswerLine f={f} okOf={okOf} revealAll={revealAll} unit={problem === "koko" ? "speed k (bananas per hour)" : "cap (largest part sum)"} />
          <CheckPanel check={f.check} pending={f.pending} t={problem === "koko" ? koko.t : split.t} />
        </div>
        : <ArrayView a={mode === "classic" ? classic.a : cond === "rot" ? rot : bound.a} f={f} mode={mode} x={mode === "classic" ? classic.t : bound.x} cond={cond} revealAll={revealAll} />}
    </Stage>
  );

  const tabs = !locked ? <Segmented<BsMode> value={mode} onChange={(m) => { setMode(m); setErr(null); }} options={MODES} /> : undefined;

  return (
    <LabShell
      label="Binary search lab"
      onKeyDown={p.onKeyDown}
      tabs={tabs}
      stage={stage}
      narration={<Narration p={p} />}
      bar={<PlayerBar p={p} />}
      code={f && <CodePanel title={codeTitle} lines={code} active={f.line} active2={f.line2} />}
      below={<InputEditor key={`${mode}-${cond}-${problem}`} fields={fields} onApply={apply} error={err} presets={presets} onRandom={random} note={note} defaultOpen={!props.compact} />}
    />
  );
}
