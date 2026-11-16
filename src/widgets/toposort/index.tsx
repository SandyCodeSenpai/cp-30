/**
 * Topological sort lab. Modes: kahn · cycle · dfs. No other props.
 * Frames come from pure builders in engine.ts; the player only moves an index.
 */
import { useMemo, useRef, useState } from "react";
import type { WidgetProps } from "../types";
import { Stage, Stat, StatGrid } from "@/ui";
import { useWidth } from "@/lib/hooks";
import { usePlayer, randInt, type Run } from "../union-find/kit/player";
import { ArrayRow, CodePanel, InputEditor, ModeTabs, Narration, PlayerBar, Strip, type CellTone } from "../union-find/kit/ui";
import { DFS, KAHN } from "./code";
import { buildDfs, buildKahn, graphStr, parseGraph, type Edge, type TFrame, type TMode } from "./engine";
import { layoutGraph } from "./layout";
import { DagView } from "./DagView";
import "./topo.css";

const MODES: { value: TMode; label: string }[] = [
  { value: "kahn", label: "Kahn" }, { value: "cycle", label: "Cycle" }, { value: "dfs", label: "DFS" },
];
const isMode = (m: unknown): m is TMode => m === "kahn" || m === "cycle" || m === "dfs";

// Course schedule: arrow u > v means "take u before v".
const COURSES: Edge[] = [[0, 2], [0, 3], [1, 3], [2, 4], [3, 4], [3, 5], [4, 6], [5, 6]];
const PRESETS: Record<string, { n: number; edges: Edge[] }> = {
  courses: { n: 7, edges: COURSES },
  coursesCycle: { n: 7, edges: [...COURSES, [6, 4]] },
  diamond: { n: 4, edges: [[0, 1], [0, 2], [1, 3], [2, 3]] },
  build: { n: 6, edges: [[5, 2], [5, 0], [4, 0], [4, 1], [2, 3], [3, 1]] },
  ring: { n: 5, edges: [[0, 1], [1, 2], [2, 3], [3, 1], [3, 4]] },
  pair: { n: 2, edges: [[1, 0], [0, 1]] },
};

interface Input { n: number; edges: Edge[]; start: number }
const DEFAULTS: Record<TMode, Input> = {
  kahn: { ...PRESETS.courses, start: 3 },
  cycle: { ...PRESETS.coursesCycle, start: 0 },
  dfs: { ...PRESETS.courses, start: 0 },
};

function randomDag(n: number, cyc: boolean): Edge[] {
  const perm = Array.from({ length: n }, (_, i) => i).sort(() => Math.random() - 0.5);
  const out: Edge[] = [], seen = new Set<string>();
  const want = Math.min(16, randInt(n, Math.round(n * 1.5)));
  let guard = 0;
  while (out.length < want && guard++ < 400) {
    const i = randInt(0, n - 2), j = randInt(i + 1, Math.min(n - 1, i + 3));
    const k = `${perm[i]}>${perm[j]}`;
    if (!seen.has(k)) { seen.add(k); out.push([perm[i], perm[j]]); }
  }
  if (cyc && n >= 3) {
    const i = randInt(1, n - 2), j = randInt(i + 1, n - 1);
    // a back arrow from later to earlier closes a cycle if a forward path exists; force one
    const a = perm[i], b = perm[j];
    if (!seen.has(`${a}>${b}`)) out.push([a, b]);
    if (!seen.has(`${b}>${a}`)) out.push([b, a]);
  }
  return out;
}

export default function Toposort(props: WidgetProps) {
  const locked = isMode(props.mode) ? props.mode : null;
  const [modeTab, setModeTab] = useState<TMode>(locked ?? "kahn");
  const mode = locked ?? modeTab;
  const [inputs, setInputs] = useState<Record<TMode, Input>>(DEFAULTS);
  const input = inputs[mode];
  const setInput = (p: Input) => setInputs((s) => ({ ...s, [mode]: p }));

  const run = useMemo<Run<TFrame>>(() => {
    const frames = mode === "dfs" ? buildDfs(input.n, input.edges) : buildKahn(input.n, input.edges);
    return { frames, start: Math.min(input.start, frames.length - 1) };
  }, [mode, input]);
  const p = usePlayer(run, props.onComplete);
  const fr = p.frame;

  const stageRef = useRef<HTMLDivElement>(null);
  const sw = useWidth(stageRef);
  const width = Math.max(260, Math.round((sw || 600) - 24));
  const g = useMemo(() => layoutGraph(input.n, input.edges, width), [input, width]);

  // editor
  const shown = `${input.n}|${graphStr(input.edges)}`;
  const [nText, setNText] = useState(String(input.n));
  const [eText, setEText] = useState(graphStr(input.edges));
  const [err, setErr] = useState<string | null>(null);
  const [lastShown, setLastShown] = useState(shown);
  if (lastShown !== shown) { setLastShown(shown); setNText(String(input.n)); setEText(graphStr(input.edges)); }
  const apply = () => { const r = parseGraph(nText, eText); if (typeof r === "string") { setErr(r); return; } setErr(null); setInput({ ...r, start: 0 }); };
  const load = (k: keyof typeof PRESETS) => { setErr(null); setInput({ ...PRESETS[k], start: 0 }); };
  const presets = mode === "cycle"
    ? [{ label: "Courses + 6>4", run: () => load("coursesCycle") }, { label: "Ring", run: () => load("ring") }, { label: "LC 207 example 2", run: () => load("pair") }]
    : [{ label: "Courses", run: () => load("courses") }, { label: "Diamond", run: () => load("diamond") }, { label: "Build order", run: () => load("build") }];
  const onRandom = () => { const n = randInt(5, 8); setErr(null); setInput({ n, edges: randomDag(n, mode === "cycle"), start: 0 }); };

  const isDfs = mode === "dfs";
  const indegTones: CellTone[] = fr.indeg.map((d, i) => (fr.flash.includes(i) && p.cur > 0 ? "accent" : fr.state[i] === "stuck" ? "bad" : fr.state[i] === "done" || fr.state[i] === "cur" ? "dim" : d === 0 ? "soft" : undefined));
  const ch = (v: number, tag = "") => ({ key: `${v}${tag}`, label: v });
  const done = isDfs ? fr.post.length : fr.order.length;

  return (
    <div className="kx-lab tp" onKeyDown={p.onKeyDown}>
      {!locked && <ModeTabs mode={mode} modes={MODES} onChange={(m) => { setModeTab(m); setErr(null); }} />}
      <div className="kx-grid">
        <div className="kx-left">
          <div ref={stageRef}>
            <Stage className="tp-stage">
              <div className="tp-tool">
                <span className="tp-hint">Arrow u → v: u must come before v.</span>
                <div className="tp-legend" aria-hidden="true">
                  {isDfs ? <><span><i className="q" />open</span><span><i className="c" />top of stack</span><span><i className="d" />finished</span></>
                    : <><span><i className="q" />in queue</span><span><i className="c" />popped</span><span><i className="d" />done</span>{mode === "cycle" && <span><i className="x" />stuck</span>}</>}
                </div>
              </div>
              <DagView g={g} edges={input.edges} frame={fr} frameKey={p.cur} showIndeg={!isDfs} dfs={isDfs} />
              <div className="tp-below">
                {isDfs ? (
                  <>
                    <Strip name="stack" hint="bottom → top" items={fr.stack.map((v) => ch(v))} tones={fr.stack.map((_, i) => (i === fr.stack.length - 1 ? "accent" : "soft"))} />
                    <Strip name="post" hint="finish order" items={fr.post.map((v) => ch(v))} />
                    {fr.final && <Strip name="order" hint="post reversed" items={fr.final.map((v) => ch(v, ":f"))} tones={fr.final.map(() => "good")} />}
                  </>
                ) : (
                  <>
                    <ArrayRow name="indeg" values={fr.indeg} tones={indegTones} flash={fr.flash} />
                    <Strip name="queue" items={fr.queue.map((v) => ch(v))} tones={fr.queue.map(() => "soft")} ends={["front", "back"]} />
                    <Strip name="order" items={fr.order.map((v) => ch(v))} tones={fr.order.map((v) => (fr.state[v] === "cur" ? "accent" : fr.tone === "good" ? "good" : undefined))} />
                    {fr.stuck.length > 0 && <Strip name="stuck" hint="indeg > 0" items={fr.stuck.map((v) => ch(v, ":s"))} tones={fr.stuck.map(() => "bad")} />}
                  </>
                )}
              </div>
            </Stage>
          </div>
          <Narration p={p} />
          <PlayerBar p={p} />
        </div>
        <div className="kx-right">
          <CodePanel title={isDfs ? "DFS post-order, reversed (iterative)" : "Kahn's algorithm: indegrees and a queue"} lines={isDfs ? DFS : KAHN} active={fr.line} active2={fr.line2} maxHeight={props.compact ? 248 : undefined} />
          <StatGrid>
            <Stat label={isDfs ? "Finished" : "Came out"} value={`${done} / ${input.n}`} tone={fr.tone === "good" ? "good" : fr.tone === "bad" && !isDfs ? "bad" : undefined} />
            {!isDfs && <Stat label="In queue" value={fr.queue.length} />}
            {isDfs && <Stat label="Stack depth" value={fr.stack.length} />}
            <Stat label="Arrows used" value={`${fr.used.filter(Boolean).length} / ${input.edges.length}`} />
          </StatGrid>
        </div>
      </div>
      <InputEditor
        fields={[
          { id: "n", label: "n (2 to 10)", value: nText, onChange: setNText, numeric: true },
          { id: "e", label: "Arrows (u>v = u before v)", value: eText, onChange: setEText, wide: true, placeholder: "0>2, 1>2, 2>3" },
        ]}
        onApply={apply} error={err} presets={presets} onRandom={onRandom}
        note={<>Up to 20 arrows. LeetCode 207 gives <code>[a, b]</code> meaning "b before a", so type it as <code>b&gt;a</code>.</>}
      />
    </div>
  );
}
