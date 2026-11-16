import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { WidgetProps } from "../types";
import { Button, Icon, IconButton, Segmented, Stage, springs } from "@/ui";
import { useReducedMotion, useWidth } from "@/lib/hooks";
import { CodePanel, InputEditor, LabShell, Narration, PlayerBar, Stats, usePlayer } from "../grid-bfs/kit/player";
import { MODES, PRESETS, WEIGHT_RANGE, parseGraph, randomWeights, toText, type DMode, type Graph } from "./graph";
import { bfsFrames, dijkstraFrames, kruskalFrames, type DFrame } from "./engine";
import { BFS_CODE, DIJKSTRA_CODE, DONE_CODE, KRUSKAL_CODE } from "./code";
import { GraphView } from "./GraphView";
import "./dijkstra.css";

const MODE_IDS = new Set<string>(MODES.map((m) => m.value));
type Algo = "bfs" | "dijkstra";
const fmt = (x: number) => (x === Infinity ? "∞" : String(x));

export default function DijkstraLab(props: WidgetProps) {
  const locked = typeof props.mode === "string" && MODE_IDS.has(props.mode) ? (props.mode as DMode) : null;
  const full = !props.compact;
  const [mode, setMode] = useState<DMode>(locked ?? "dijkstra");
  const [graphs, setGraphs] = useState<Record<DMode, Graph>>(() => ({
    "dijkstra": PRESETS.dijkstra[0].g, "negative": PRESETS.negative[0].g, "bfs-vs": PRESETS["bfs-vs"][0].g, "mst": PRESETS.mst[0].g,
  }));
  const g = graphs[mode];
  const setGraph = (next: Graph) => { setGraphs((s) => ({ ...s, [mode]: next })); };
  const [algo, setAlgo] = useState<Algo>("bfs");
  const [selected, setSelected] = useState<number | null>(null);
  const [text, setText] = useState(() => toText(g));
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => { setText(toText(g)); setErr(null); }, [g]);
  useEffect(() => { setSelected(null); }, [mode]);

  const frames = useMemo(() => {
    if (mode === "dijkstra") return dijkstraFrames(g, "lazy");
    if (mode === "negative") return dijkstraFrames(g, "done");
    if (mode === "mst") return kruskalFrames(g);
    return algo === "bfs" ? bfsFrames(g) : dijkstraFrames(g, "lazy");
  }, [g, mode, algo]);
  const other = useMemo(() => {
    if (mode !== "bfs-vs") return null;
    const fr = algo === "bfs" ? dijkstraFrames(g, "lazy") : bfsFrames(g);
    return fr[fr.length - 1].dist;
  }, [g, mode, algo]);

  const p = usePlayer<DFrame>(frames, props.onComplete);
  const f = p.frame;
  const reduce = useReducedMotion();
  const boxRef = useRef<HTMLDivElement>(null);
  const width = useWidth(boxRef);
  const narrow = width > 0 && width < 520;

  const apply = () => { const r = parseGraph(text, mode, g); if (typeof r === "string") setErr(r); else { setErr(null); setSelected(null); setGraph(r); } };
  const setWeight = (i: number, w: number) => {
    const [lo, hi] = WEIGHT_RANGE[mode];
    const ww = Math.max(lo, Math.min(hi, w));
    setGraph({ ...g, edges: g.edges.map((e, k) => (k === i ? { ...e, w: ww } : e)) });
  };

  const isMst = mode === "mst";
  const variant = mode === "negative" ? "done" : "lazy";
  const code = isMst ? KRUSKAL_CODE : mode === "negative" ? DONE_CODE : mode === "bfs-vs" && algo === "bfs" ? BFS_CODE : DIJKSTRA_CODE;
  const title = isMst ? "kruskal (Day 14)" : mode === "negative" ? "Classic Dijkstra with done[]" : mode === "bfs-vs" && algo === "bfs" ? "bfs on an adjacency list" : "dijkstra (Day 14)";
  const note: ReactNode = isMst ? <><code>dsu.union(u, v)</code> returns False when u and v already have the same root (the DSU from Day 13: path compression + union by size).</>
    : mode === "negative" ? <>The lazy template from the Dijkstra tab pushes a node again when its dist drops, so it can repair a small case like this. But with negative edges it may redo the same work again and again (exponential in the worst case). Treat any negative edge as "not Dijkstra".</>
    : mode === "bfs-vs" ? <>Every edge costs 1. Switch between BFS and Dijkstra above the graph: the distances match.</>
    : <><code>adj[u]</code> lists the edges out of u in the order of Edit input. Edges are one-way (u → v).</>;

  const hint = isMst ? "Tap a weight to change it." : mode === "bfs-vs" ? "Tap a node to make it the source." : "Tap a weight to change it. Tap a node to make it the source.";
  const SHORT: Record<DMode, string> = { "dijkstra": "Dijkstra", "negative": "Negative", "bfs-vs": "BFS vs", "mst": "MST" };
  const tabs = locked ? undefined : <Segmented<DMode> label="Mode" value={mode} options={narrow ? MODES.map((m) => ({ ...m, label: SHORT[m.value] })) : MODES} onChange={setMode} />;
  const sel = selected !== null && selected < g.edges.length ? g.edges[selected] : null;
  const [lo, hi] = WEIGHT_RANGE[mode];

  const stage = (
    <Stage className="dj-stage">
      <div className="dj-top">
        <div className="dj-hint"><Icon name="pencil" size={16} />{hint}</div>
        {mode === "bfs-vs" && <Segmented<Algo> label="Run" value={algo} onChange={setAlgo} options={[{ value: "bfs", label: "BFS" }, { value: "dijkstra", label: "Dijkstra" }]} />}
      </div>
      <GraphView g={g} f={f} mode={mode} selected={selected} reduce={reduce}
        onSelectEdge={g.weighted ? (i) => setSelected((s) => (s === i ? null : i)) : undefined}
        onPickSource={isMst ? undefined : (v) => setGraph({ ...g, src: v })} />
      {sel && selected !== null && (
        <div className="dj-wedit" role="group" aria-label="Edit edge weight">
          <span>Edge <b>{sel.u} {g.directed ? "→" : "–"} {sel.v}</b> weight</span>
          <IconButton label="Decrease weight" onClick={() => setWeight(selected, sel.w - 1)} disabled={sel.w <= lo}><span className="dj-pm">−</span></IconButton>
          <output className={`dj-wval${sel.w < 0 ? " neg" : ""}`}>{sel.w}</output>
          <IconButton label="Increase weight" onClick={() => setWeight(selected, sel.w + 1)} disabled={sel.w >= hi}><span className="dj-pm">+</span></IconButton>
          <Button size="s" variant="ghost" onClick={() => setSelected(null)}>Done</Button>
          {mode === "dijkstra" && sel.w === 0 && <span className="dj-wnote">Dijkstra allows 0, not less. Negative weights live in the Negative edge tab.</span>}
        </div>
      )}
      {isMst ? <MstPanels g={g} f={f} reduce={reduce} /> : <PathPanels g={g} f={f} mode={mode} algo={algo} variant={variant} other={other} reduce={reduce} />}
      <Stats items={statsFor(g, f, mode, algo)} />
    </Stage>
  );

  return (
    <div ref={boxRef} className={`dj-root${full ? " full" : ""}`}>
      <LabShell label="Dijkstra lab" tabs={tabs} onKeyDown={p.onKeyDown} stage={stage}
        narration={<Narration p={p} />}
        bar={<PlayerBar p={p} narrow={narrow} />}
        code={<CodePanel title={title} lines={code} active={f.line} active2={f.line2} note={note} />}
        below={
          <InputEditor label={g.weighted ? "Edges (u v w)" : "Edges (u v)"} value={text} onChange={setText} onApply={apply} error={err}
            note={g.weighted ? `Edges as "u v w", separated by commas. ${g.directed ? "One-way: u → v. " : ""}Nodes 0 to 7. Weights ${lo} to ${hi}.` : `Edges as "u v", separated by commas. Nodes 0 to 7.`}
            presets={PRESETS[mode].map((x) => ({ label: x.label, run: () => { setSelected(null); setGraph({ ...x.g }); } }))}
            onRandom={g.weighted ? () => { setSelected(null); setGraph(randomWeights(g, mode)); } : undefined} />
        } />
    </div>
  );
}

function statsFor(g: Graph, f: DFrame, mode: DMode, algo: Algo) {
  if (mode === "mst") {
    const ok = f.used === g.n - 1;
    return [
      { label: "total", value: f.finished && !ok ? -1 : f.total, tone: f.finished ? (ok ? ("good" as const) : ("bad" as const)) : undefined },
      { label: "used", value: `${f.used} / ${g.n - 1}` },
    ];
  }
  if (mode === "bfs-vs" && algo === "bfs") return [{ label: "pops", value: f.pops }, { label: "pushes", value: f.pushes }];
  const items: { label: string; value: ReactNode; tone?: "good" | "bad" }[] = [
    { label: "pops", value: f.pops }, { label: "pushes", value: f.pushes }, { label: "stale skipped", value: f.staleN },
  ];
  if (mode === "negative" && f.truth) {
    const wrong = f.dist.filter((d, i) => d !== f.truth![i]).length;
    items.push({ label: "wrong answers", value: wrong, tone: wrong ? "bad" : "good" });
  }
  return items;
}

/* ---------------- Heap / queue + dist table ---------------- */

function PathPanels({ g, f, mode, algo, variant, other, reduce }: { g: Graph; f: DFrame; mode: DMode; algo: Algo; variant: "lazy" | "done"; other: number[] | null; reduce: boolean }) {
  const isQueue = mode === "bfs-vs" && algo === "bfs";
  const staleOf = (d: number, v: number) => !isQueue && (variant === "lazy" ? d > f.dist[v] : f.done[v]);
  const justPushed = f.result === "better" && f.dir ? f.dir[1] : -1;
  const via = (v: number) => { const e = f.parentEdge[v]; if (e < 0) return "–"; const ed = g.edges[e]; return String(ed.u === v ? ed.v : ed.u); };
  const otherName = algo === "bfs" ? "Dijkstra" : "BFS";
  return (
    <div className="dj-panels">
      <div className="gx-ds">
        <div className="gx-ds-head">
          <span><code>{isQueue ? "q" : "pq"}</code> · {f.heap.length} entr{f.heap.length === 1 ? "y" : "ies"}</span>
          <span className="dj-dshint">{isQueue ? "left = front: popleft()" : "the real heap list; pq[0] is the smallest"}</span>
        </div>
        <div className="gx-ds-row dj-heaprow" role="list" aria-label={`${isQueue ? "Queue" : "Heap"}: ${f.heap.map((e) => `(${e.d}, ${e.v})`).join(", ") || "empty"}`}>
          {f.popped && (
            <span className="dj-popped" role="listitem">
              <span className="dj-popped-label">{f.popped.stale ? "stale" : "popped"}</span>
              <motion.span key={`p${f.popped.id}-${f.popped.stale}`} className={`gx-chip ${f.popped.stale ? "dead" : "popped"}`}
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={reduce ? { duration: 0.12 } : springs.snappy}>
                ({f.popped.d}, {f.popped.v})
              </motion.span>
            </span>
          )}
          {f.heap.length === 0 && <span className="gx-ds-empty">empty</span>}
          <AnimatePresence initial={false}>
            {f.heap.map((e, i) => {
              const stale = staleOf(e.d, e.v);
              const fresh = e.v === justPushed && e.d === f.dist[e.v];
              return (
                <motion.span key={e.id} role="listitem" layout={!reduce}
                  className={`gx-chip${i === 0 ? " front" : ""}${stale ? " stale" : ""}${fresh ? " fresh" : ""}`}
                  title={stale ? "Stale: dist is already smaller" : undefined}
                  initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }}
                  exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.6 }} transition={reduce ? { duration: 0.12 } : springs.snappy}>
                  ({e.d}, {e.v}){stale && <small>stale</small>}
                </motion.span>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
      <div className="dj-table-wrap">
        <table className="dj-table">
          <tbody>
            <tr><th scope="row">node</th>{f.dist.map((_, v) => <td key={v} className={cls(f, v)}>{v}</td>)}</tr>
            <tr><th scope="row"><code>dist</code></th>{f.dist.map((d, v) => <td key={v} className={`${cls(f, v)}${f.truth && f.truth[v] !== d ? " bad" : ""}`}>{isQueue ? d : fmt(d)}</td>)}</tr>
            <tr><th scope="row">via</th>{f.dist.map((_, v) => <td key={v} className={cls(f, v)}>{v === g.src ? "src" : via(v)}</td>)}</tr>
            {f.truth && <tr className="truth"><th scope="row">true</th>{f.truth.map((d, v) => <td key={v} className={d !== f.dist[v] ? "good" : ""}>{fmt(d)}</td>)}</tr>}
            {other && <tr className="other"><th scope="row">{otherName}</th>{other.map((d, v) => <td key={v} className={f.finished ? (fmtSame(d, f.dist[v]) ? "good" : "bad") : ""}>{f.finished ? (d === -1 ? "-1" : fmt(d)) : "?"}</td>)}</tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
const fmtSame = (a: number, b: number) => a === b || (a === -1 && b === Infinity) || (a === Infinity && b === -1);
function cls(f: DFrame, v: number) {
  if (f.cur === v) return "cur";
  if (f.result === "better" && f.dir && f.dir[1] === v) return "upd";
  if (f.done[v]) return "done";
  return "";
}

/* ---------------- Kruskal panels ---------------- */

function MstPanels({ g, f, reduce }: { g: Graph; f: DFrame; reduce: boolean }) {
  const order = f.order.length ? f.order : g.edges.map((_, i) => i);
  const root = (x: number) => { let r = x; let guard = 20; while (f.dsu[r] !== r && guard--) r = f.dsu[r]; return r; };
  return (
    <div className="dj-panels">
      <div className="gx-ds">
        <div className="gx-ds-head">
          <span><code>{f.order.length ? "sorted(edges)" : "edges"}</code> · {g.edges.length}</span>
          <span className="dj-dshint">(w, u, v)</span>
        </div>
        <div className="gx-ds-row" role="list" aria-label="Edges in the order Kruskal tries them">
          {order.map((ei, k) => {
            const e = g.edges[ei], t = f.take[ei];
            const c = t === true ? " taken" : t === false ? " dead" : "";
            const at = f.at === k && f.order.length ? " front" : "";
            const skipped = f.order.length && f.finished && t === null ? " later" : "";
            return (
              <motion.span key={ei} role="listitem" layout={!reduce} transition={reduce ? { duration: 0 } : springs.smooth} className={`gx-chip${c}${at}${skipped}`}>
                ({e.w}, {e.u}, {e.v})
              </motion.span>
            );
          })}
        </div>
      </div>
      <div className="dj-table-wrap">
        <table className="dj-table">
          <tbody>
            <tr><th scope="row">node</th>{f.dsu.map((_, v) => <td key={v}>{v}</td>)}</tr>
            <tr><th scope="row"><code>parent</code></th>{f.dsu.map((p, v) => <td key={v} className={p !== v ? "done" : ""}>{p}</td>)}</tr>
            <tr><th scope="row">root</th>{f.dsu.map((_, v) => <td key={v}>{root(v)}</td>)}</tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
