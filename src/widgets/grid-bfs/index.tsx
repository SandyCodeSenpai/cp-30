import { useEffect, useMemo, useRef, useState } from "react";
import type { WidgetProps } from "../types";
import { Button, Icon, Segmented, Stage } from "@/ui";
import { rng, useReducedMotion, useWidth } from "@/lib/hooks";
import { CodePanel, InputEditor, LabShell, Narration, PlayerBar, Stats, usePlayer } from "./kit/player";
import { buildFrames, legend, LIMITS, MODES, parseGrid, presetGrid, PRESETS, randomGrid, toText, type Grid, type GridFrame, type GridMode } from "./engine";
import { BFS_CODE, DFS_CODE, ZERO_ONE_CODE } from "./code";
import { GridView, Strip, type Brush } from "./GridView";
import "./grid.css";

const MODE_IDS = new Set<string>(MODES.map((m) => m.value));
const clampInt = (v: unknown, a: number, b: number) => (typeof v === "number" && Number.isFinite(v) ? Math.max(a, Math.min(b, Math.round(v))) : null);

/** A seeded random grid of the asked size. For BFS keep trying seeds until T is reachable. */
function sizedGrid(mode: GridMode, R: number, C: number): Grid {
  for (let seed = 7; seed < 60; seed++) {
    const g = randomGrid(mode, R, C, rng(seed));
    if (mode !== "bfs") return g;
    const f = buildFrames(g, mode);
    if (f[f.length - 1].path.length > 0) return g;
  }
  return randomGrid(mode, R, C, () => 0.99);
}

export default function GridBfs(props: WidgetProps) {
  const locked = typeof props.mode === "string" && MODE_IDS.has(props.mode) ? (props.mode as GridMode) : null;
  const full = !props.compact;
  const rows = clampInt(props.rows, LIMITS.minR, LIMITS.maxR);
  const cols = clampInt(props.cols, LIMITS.minC, LIMITS.maxC);
  const initial = (m: GridMode): Grid => (rows || cols ? sizedGrid(m, rows ?? 6, cols ?? 9) : presetGrid(m, full));

  const [mode, setMode] = useState<GridMode>(locked ?? "bfs");
  const [grids, setGrids] = useState<Partial<Record<GridMode, Grid>>>(() => ({ [locked ?? "bfs"]: initial(locked ?? "bfs") }));
  const g = grids[mode] ?? initial(mode);
  const setGrid = (next: Grid) => setGrids((s) => ({ ...s, [mode]: next }));
  const [brush, setBrush] = useState<Brush>("block");
  const [text, setText] = useState(() => toText(g, mode));
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => { setText(toText(g, mode)); setErr(null); }, [g, mode]);

  const frames = useMemo(() => buildFrames(g, mode), [g, mode]);
  const p = usePlayer<GridFrame>(frames, props.onComplete);
  const f = p.frame;
  const reduce = useReducedMotion();
  const boxRef = useRef<HTMLDivElement>(null);
  const width = useWidth(boxRef);
  const narrow = width > 0 && width < 520;

  const changeMode = (m: GridMode) => { if (!grids[m]) setGrids((s) => ({ ...s, [m]: initial(m) })); setMode(m); };
  const apply = () => { const r = parseGrid(text, mode); if (typeof r === "string") setErr(r); else { setErr(null); setGrid(r); } };
  const clearBlocks = () => setGrid({ ...g, block: g.block.map(() => false) });

  const code = mode === "dfs" ? DFS_CODE : mode === "zero-one" ? ZERO_ONE_CODE : BFS_CODE;
  const title = mode === "dfs" ? "count_components (Day 12)" : mode === "zero-one" ? "zero_one_bfs (Day 12)" : "grid_bfs (Day 12)";
  const note = mode === "dfs"
    ? <>Here a node is a land cell, and <code>adj[u]</code> is its land neighbours. The scan <code>for s in range(n)</code> goes row by row.</>
    : mode === "zero-one" ? <>LC 2290: <code>cost = lambda r, c, nr, nc: grid[nr][nc]</code>. Entering an obstacle costs 1.</>
    : mode === "multi-source" ? <>LC 994 Rotting Oranges: <code>sources</code> = every rotten orange, <code>wall</code> = an empty cell.</>
    : <>One source: <code>sources = [start]</code>. <code>dist[T]</code> is the fewest steps.</>;

  const hint = mode === "dfs" ? "Drag on the grid to paint land and water."
    : mode === "multi-source" ? (brush === "block" ? "Drag to paint empty cells (no orange)." : "Tap cells to add or remove rotten oranges (S).")
    : mode === "zero-one" ? "Drag to paint obstacles. Drag S or T to move them."
    : "Drag to paint walls. Drag S or T to move them.";

  const stats = statsFor(g, mode, f);
  const tabs = locked ? undefined : <Segmented<GridMode> label="Mode" value={mode} options={MODES} onChange={changeMode} />;

  const dsKind = mode === "dfs" ? "stack" : mode === "zero-one" ? "deque" : "queue";
  const dsHint = mode === "dfs" ? "bottom … top: pop() and append() use the right end"
    : mode === "zero-one" ? "left = front: popleft(), appendleft() · right = back: append()"
    : "left = front: popleft() · right = back: append()";

  const stage = (
    <Stage className="gb-stage">
      <div className="gb-top">
        <div className="gb-hint-line"><Icon name="pencil" size={16} />{hint}</div>
        <div className="gb-tools">
          {mode === "multi-source" && (
            <Segmented<Brush> value={brush} onChange={setBrush} options={[{ value: "block", label: "Empty cells" }, { value: "source", label: "Rotten (S)" }]} />
          )}
          <Button size="s" variant="ghost" onClick={clearBlocks}><Icon name="trash" size={16} />Clear</Button>
        </div>
      </div>
      <GridView g={g} mode={mode} f={f} brush={brush} onEdit={setGrid} reduce={reduce} />
      <Legend mode={mode} />
      <Strip items={f.q} label={mode === "dfs" ? "stack" : mode === "zero-one" ? "dq" : "q"} hint={dsHint} g={g} f={f} reduce={reduce} kind={dsKind} />
      <Stats items={stats} />
    </Stage>
  );

  return (
    <div ref={boxRef} className={`gb-root${full ? " full" : ""}`}>
      <LabShell label="Grid BFS and DFS lab" tabs={tabs} onKeyDown={p.onKeyDown}
        stage={stage}
        narration={<Narration p={p} />}
        bar={<PlayerBar p={p} narrow={narrow} />}
        code={<CodePanel title={title} lines={code} active={f.line} active2={f.line2} note={note} />}
        below={
          <InputEditor label="Grid" multiline rows={Math.min(8, g.R + 1)} value={text} onChange={setText} onApply={apply} error={err} note={legend(mode)}
            presets={PRESETS[mode].filter((x) => full || !x.full).map((x) => ({ label: x.label, run: () => setGrid(parseGrid(x.text, mode) as Grid) }))}
            onRandom={() => setGrid(randomGrid(mode, g.R, g.C))} />
        } />
    </div>
  );
}

function statsFor(g: Grid, mode: GridMode, f: GridFrame) {
  const reached = f.dist.filter((d) => d !== -1 && d !== Infinity).length;
  if (mode === "dfs") return [{ label: "islands (comps)", value: f.comps, tone: f.done ? ("good" as const) : undefined }, { label: "land cells", value: g.block.filter(Boolean).length }];
  if (mode === "multi-source") {
    const fresh = g.block.filter((b, i) => !b && f.dist[i] === -1).length;
    const mx = Math.max(0, ...f.dist);
    return [
      { label: "sources", value: g.sources.length },
      { label: "reached", value: reached },
      f.done ? { label: "answer", value: fresh ? -1 : mx, tone: fresh ? ("bad" as const) : ("good" as const) } : { label: "minute", value: mx },
    ];
  }
  const t = g.target!;
  const dt = f.dist[t];
  const known = dt !== -1 && dt !== Infinity;
  return [
    { label: "reached", value: reached },
    { label: mode === "zero-one" ? "dist[T] (obstacles)" : "dist[T]", value: known ? dt : f.done ? -1 : mode === "zero-one" ? "INF" : "-1", tone: f.done ? (known ? ("good" as const) : ("bad" as const)) : undefined },
  ];
}

function Legend({ mode }: { mode: GridMode }) {
  const items: [string, string][] = mode === "dfs"
    ? [["water", "Water"], ["land", "Land"], ["inq", "On the stack"], ["live", "Current island"], ["vis", "Earlier island"]]
    : [
      ...(mode === "multi-source" ? [["orange", "Fresh orange"], ["blk empty", "Empty"]] as [string, string][] : [[mode === "zero-one" ? "blk obstacle" : "blk wall", mode === "zero-one" ? "Obstacle (cost 1)" : "Wall"]] as [string, string][]),
      ["inq", mode === "zero-one" ? "In the deque" : "In the queue"], ["vis", "Done"], ["cur", "Popped now"],
      ...(mode === "multi-source" ? [] : [["path", "Shortest path"]] as [string, string][]),
    ];
  return (
    <div className="gb-legend" aria-hidden="true">
      {items.map(([k, label]) => <span key={label}><i className={`gb-sw ${k}`} />{label}</span>)}
    </div>
  );
}
