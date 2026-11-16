/**
 * Union-find lab. Modes: basic · optimized · components. Props: mode?, n? (4 to 12).
 * Frames come from pure builders in engine.ts; the player only moves an index.
 */
import { useCallback, useMemo, useRef, useState } from "react";
import type { WidgetProps } from "../types";
import { Segmented, Stage, Stat, StatGrid } from "@/ui";
import { useWidth } from "@/lib/hooks";
import { usePlayer, randInt, type Run } from "./kit/player";
import { ArrayRow, CodePanel, InputEditor, ModeTabs, Narration, PlayerBar, type CellTone } from "./kit/ui";
import { BASIC, COMP, OPT } from "./code";
import { buildComponents, buildOps, edgesStr, height, opLabel, opsStr, parseEdges, parseN, parseOps, type Op, type UFFrame, type UFMode } from "./engine";
import { ForestView, GraphView } from "./views";
import "./uf.css";

const MODES: { value: UFMode; label: string }[] = [
  { value: "basic", label: "Basic" }, { value: "optimized", label: "Optimized" }, { value: "components", label: "Components" },
];
const isMode = (m: unknown): m is UFMode => m === "basic" || m === "optimized" || m === "components";

const u = (a: number, b: number): Op => ({ kind: "union", a, b });
const f = (x: number): Op => ({ kind: "find", x });

const PRESET_OPS = {
  // Plain unions that build a chain, then a slow find on it.
  chain: [u(1, 0), u(2, 1), u(3, 2), u(5, 4), f(0), u(0, 4), u(6, 7), f(4)],
  // Same idea for the optimized DSU: sizes keep it flat; the last find compresses a path.
  deep: [u(1, 0), u(2, 1), u(3, 2), u(5, 4), u(7, 6), u(5, 7), u(1, 5), f(6)],
  // Balanced merges make a tree of height 3, then one find flattens it.
  balanced: [u(0, 1), u(2, 3), u(0, 2), u(4, 5), u(6, 7), u(4, 6), u(0, 4), f(7), f(5)],
  // Long chain of unions: plain DSU gets tall, union by size stays flat.
  line: [u(1, 0), u(2, 1), u(3, 2), u(4, 3), u(5, 4), u(6, 5), u(7, 6), f(0)],
};
const PRESET_EDGES: Record<string, [number, number][]> = {
  friends: [[0, 1], [2, 3], [1, 2], [4, 5], [5, 6], [3, 0], [6, 7]],
  redundant: [[0, 1], [0, 2], [1, 3], [2, 3], [3, 4], [4, 5]],
  forest: [[0, 1], [2, 3], [4, 5], [6, 7], [1, 3], [5, 7]],
};

const fitOps = (ops: Op[], n: number) => ops.filter((o) => (o.kind === "find" ? o.x < n : o.a < n && o.b < n));
const fitEdges = (e: [number, number][], n: number) => e.filter(([a, b]) => a < n && b < n);

interface Input { n: number; ops: Op[]; edges: [number, number][]; startOp: number; autoplay: boolean; nonce: number }

function defaults(mode: UFMode, n: number): Input {
  if (mode === "components") { const edges = fitEdges(PRESET_EDGES.friends, n); return { n, ops: [], edges, startOp: Math.min(2, edges.length - 1), autoplay: false, nonce: 0 }; }
  const ops = fitOps(mode === "basic" ? PRESET_OPS.chain : PRESET_OPS.deep, n);
  return { n, ops, edges: [], startOp: Math.min(mode === "basic" ? 4 : 3, ops.length - 1), autoplay: false, nonce: 0 };
}

function randomOps(n: number): Op[] {
  const k = randInt(6, 10), out: Op[] = [];
  for (let i = 0; i < k; i++) {
    if (i > 3 && Math.random() < 0.25) out.push(f(randInt(0, n - 1)));
    else { const a = randInt(0, n - 1); let b = randInt(0, n - 1); if (b === a) b = (a + 1) % n; out.push(u(a, b)); }
  }
  return out;
}
function randomEdges(n: number): [number, number][] {
  const k = randInt(n - 2, n + 1), out: [number, number][] = [], seen = new Set<string>();
  while (out.length < k) { const a = randInt(0, n - 1), b = randInt(0, n - 1); const key = `${Math.min(a, b)}-${Math.max(a, b)}`; if (a !== b && !seen.has(key)) { seen.add(key); out.push([a, b]); } }
  return out;
}

export default function UnionFind(props: WidgetProps) {
  const locked = isMode(props.mode) ? props.mode : null;
  const n0 = typeof props.n === "number" && props.n >= 4 && props.n <= 12 ? Math.round(props.n) : 8;
  const [modeTab, setModeTab] = useState<UFMode>(locked ?? "basic");
  const mode = locked ?? modeTab;
  const [inputs, setInputs] = useState<Record<UFMode, Input>>(() => ({ basic: defaults("basic", n0), optimized: defaults("optimized", n0), components: defaults("components", n0) }));
  const input = inputs[mode];
  const setInput = useCallback((p: Partial<Input>) => setInputs((s) => ({ ...s, [mode]: { ...s[mode], ...p, nonce: s[mode].nonce + 1 } })), [mode]);

  const run = useMemo<Run<UFFrame>>(() => {
    const frames = mode === "components" ? buildComponents(input.n, input.edges) : buildOps(mode, input.n, input.ops);
    const s = frames.findIndex((fr) => fr.op === input.startOp);
    return { frames, start: Math.max(0, s), autoplay: input.autoplay };
  }, [mode, input]);
  const p = usePlayer(run, props.onComplete);
  const fr = p.frame;

  // click to union / find
  const [clickMode, setClickMode] = useState<"union" | "find">("union");
  const [selected, setSelected] = useState<number | null>(null);
  const opCount = mode === "components" ? input.edges.length : input.ops.length;
  const full = opCount >= 24;
  const onNode = useCallback((v: number) => {
    if (full) return;
    if (mode !== "components" && clickMode === "find") { setSelected(null); setInput({ ops: [...input.ops, f(v)], startOp: input.ops.length, autoplay: true }); return; }
    if (selected === null) { setSelected(v); return; }
    if (selected === v) { setSelected(null); return; }
    const a = selected; setSelected(null);
    if (mode === "components") setInput({ edges: [...input.edges, [a, v]], startOp: input.edges.length, autoplay: true });
    else setInput({ ops: [...input.ops, u(a, v)], startOp: input.ops.length, autoplay: true });
  }, [full, mode, clickMode, selected, input, setInput]);

  // input editor
  const shownOps = mode === "components" ? edgesStr(input.edges) : opsStr(input.ops);
  const [nText, setNText] = useState(String(input.n));
  const [opsText, setOpsText] = useState(shownOps);
  const [err, setErr] = useState<string | null>(null);
  const [lastShown, setLastShown] = useState(`${input.n}|${shownOps}`);
  if (lastShown !== `${input.n}|${shownOps}`) { setLastShown(`${input.n}|${shownOps}`); setOpsText(shownOps); setNText(String(input.n)); }
  const apply = () => {
    const n = parseN(nText); if (typeof n === "string") { setErr(n); return; }
    if (mode === "components") { const e = parseEdges(opsText, n); if (typeof e === "string") { setErr(e); return; } setErr(null); setSelected(null); setInput({ n, edges: e, startOp: -1, autoplay: false }); }
    else { const o = parseOps(opsText, n); if (typeof o === "string") { setErr(o); return; } setErr(null); setSelected(null); setInput({ n, ops: o, startOp: -1, autoplay: false }); }
  };
  const load = (n: number, data: { ops?: Op[]; edges?: [number, number][] }) => {
    setErr(null); setSelected(null);
    setInput({ n, ops: data.ops ? fitOps(data.ops, n) : input.ops, edges: data.edges ? fitEdges(data.edges, n) : input.edges, startOp: -1, autoplay: false });
  };
  const presets = mode === "components"
    ? [{ label: "Friend circles", run: () => load(8, { edges: PRESET_EDGES.friends }) }, { label: "Redundant edge", run: () => load(6, { edges: PRESET_EDGES.redundant }) }, { label: "Forest", run: () => load(8, { edges: PRESET_EDGES.forest }) }]
    : mode === "basic"
      ? [{ label: "Chain", run: () => load(8, { ops: PRESET_OPS.chain }) }, { label: "Long line", run: () => load(8, { ops: PRESET_OPS.line }) }]
      : [{ label: "Flat by size", run: () => load(8, { ops: PRESET_OPS.deep }) }, { label: "Long line", run: () => load(8, { ops: PRESET_OPS.line }) }, { label: "Compress", run: () => load(8, { ops: PRESET_OPS.balanced }) }];
  const onRandom = () => { const n = input.n; if (mode === "components") load(n, { edges: randomEdges(n) }); else load(n, { ops: randomOps(n) }); };

  const changeMode = (m: UFMode) => { setModeTab(m); setSelected(null); setErr(null); };

  // layout
  const stageRef = useRef<HTMLDivElement>(null);
  const sw = useWidth(stageRef);
  const width = Math.max(260, Math.round((sw || 600) - 24));
  const [view, setView] = useState<"graph" | "forest">("graph");
  const graph = mode === "components" && view === "graph";
  const showSize = mode !== "basic";

  const parentTones: CellTone[] = fr.parent.map((_, i) => (fr.changed.includes(i) ? "accent" : fr.cur === i || fr.roots.includes(i) || fr.path.includes(i) ? "soft" : undefined));
  const sizeTones: CellTone[] = fr.parent.map((pp, i) => (pp !== i ? "dim" : fr.roots.includes(i) ? "soft" : undefined));
  const code = mode === "basic" ? BASIC : mode === "optimized" ? OPT : COMP;
  const codeTitle = mode === "components" ? "Edges arriving: count groups, find the cycle edge" : mode === "basic" ? "Plain DSU: no tricks" : "DSU: path compression + union by size";
  const h = height(fr.parent);
  const cycles = fr.edges.filter((e) => e.status === "cycle").length;
  const clickHint = mode === "components" ? "Click two nodes to add an edge." : clickMode === "union" ? "Click two nodes to union them." : "Click a node to run find on it.";
  const items = mode === "components" ? input.edges.map(([a, b], i) => ({ label: `${a}–${b}`, i, status: fr.edges[i]?.status })) : input.ops.map((o, i) => ({ label: opLabel(o), i, status: undefined }));

  return (
    <div className="kx-lab uf" onKeyDown={p.onKeyDown}>
      {!locked && <ModeTabs mode={mode} modes={MODES} onChange={changeMode} />}
      <div className="kx-grid">
        <div className="kx-left">
          <div ref={stageRef}>
            <Stage className="uf-stage">
              <div className="uf-tool">
                <span className="uf-hint">{full ? "That is enough operations. Edit the input to start over." : selected !== null ? `Selected ${selected}. Now click a second node.` : clickHint}</span>
                <div className="uf-tool-right">
                  {mode !== "components" && <Segmented<"union" | "find"> value={clickMode} onChange={(v) => { setClickMode(v); setSelected(null); }} options={[{ value: "union", label: "Union" }, { value: "find", label: "Find" }]} />}
                  {mode === "components" && <Segmented<"graph" | "forest"> value={view} onChange={setView} options={[{ value: "graph", label: "Graph" }, { value: "forest", label: "Forest" }]} />}
                </div>
              </div>
              {graph
                ? <GraphView frame={fr} width={width} showSize={false} selected={selected} onNode={onNode} clickHint={clickHint} />
                : <ForestView frame={fr} width={width} showSize={showSize} selected={selected} onNode={onNode} clickHint={clickHint} />}
              <div className="uf-arrays">
                <ArrayRow name="parent" values={fr.parent} tones={parentTones} flash={fr.changed} />
                {showSize && <ArrayRow name="size" values={fr.size} tones={sizeTones} showIndex={false} label={`size array: ${fr.size.join(", ")}. Only roots' sizes matter.`} />}
              </div>
            </Stage>
          </div>
          <Narration p={p} />
          <PlayerBar p={p} />
        </div>
        <div className="kx-right">
          <CodePanel title={codeTitle} lines={code} active={fr.line} active2={fr.line2} maxHeight={props.compact ? 248 : undefined} />
          <StatGrid>
            <Stat label="Groups" value={fr.groups} />
            {mode !== "components" && <Stat label="Tallest tree" value={h} tone={mode === "basic" && h >= 3 ? "warn" : undefined} sub="edges from root to deepest node" />}
            {mode === "optimized" && <Stat label="Plain DSU" value={fr.naiveHeight} tone={fr.naiveHeight > h ? "warn" : undefined} sub="tallest tree, same unions" />}
            {mode === "components" && <Stat label="Edges seen" value={fr.edges.length} sub={`of ${input.edges.length}`} />}
            {mode === "components" && <Stat label="Cycle edges" value={cycles} tone={cycles ? "bad" : undefined} sub="union returned False" />}
          </StatGrid>
          <div className="uf-ops" role="group" aria-label={mode === "components" ? "Edges in order. Click one to jump to it." : "Operations in order. Click one to jump to it."}>
            <div className="uf-ops-title">{mode === "components" ? "Edges" : "Operations"}</div>
            <div className="uf-ops-row">
              {items.map((it) => (
                <button key={it.i} type="button" className={`uf-op${fr.op === it.i ? " on" : fr.op > it.i ? " done" : ""}${it.status === "cycle" ? " cycle" : ""}`}
                  onClick={() => p.jump(run.frames.findIndex((x) => x.op === it.i))} aria-current={fr.op === it.i ? "step" : undefined}>{it.label}</button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <InputEditor
        fields={[
          { id: "n", label: "n (4 to 12)", value: nText, onChange: setNText, numeric: true },
          { id: "ops", label: mode === "components" ? "Edges (a-b)" : "Operations (a-b = union, find x)", value: opsText, onChange: setOpsText, wide: true, placeholder: mode === "components" ? "0-1, 2-3, 1-2" : "1-0, 2-1, find 0" },
        ]}
        onApply={apply} error={err} presets={presets} onRandom={onRandom}
        note={mode === "components" ? "Undirected edges, up to 20. Nodes are 0 to n - 1." : "Up to 20 operations. \"1-0\" means union(1, 0). Nodes are 0 to n - 1."}
      />
    </div>
  );
}
