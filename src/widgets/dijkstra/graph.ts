/** Graph model, presets, text format and a faithful copy of Python's heapq. */

export type DMode = "dijkstra" | "negative" | "bfs-vs" | "mst";
export const MODES: { value: DMode; label: string }[] = [
  { value: "dijkstra", label: "Dijkstra" },
  { value: "negative", label: "Negative edge" },
  { value: "bfs-vs", label: "BFS vs Dijkstra" },
  { value: "mst", label: "MST (Kruskal)" },
];

export interface Pt { x: number; y: number }              // 0..1 inside the drawing area
export interface Edge { u: number; v: number; w: number }
export interface Graph { n: number; pos: Pt[]; edges: Edge[]; directed: boolean; weighted: boolean; src: number }

export const MAX_N = 8, MAX_E = 16;

const P6: Pt[] = [{ x: 0.04, y: 0.5 }, { x: 0.33, y: 0.08 }, { x: 0.33, y: 0.92 }, { x: 0.67, y: 0.08 }, { x: 0.67, y: 0.92 }, { x: 0.96, y: 0.5 }];
const P7: Pt[] = [{ x: 0.04, y: 0.5 }, { x: 0.28, y: 0.08 }, { x: 0.28, y: 0.92 }, { x: 0.52, y: 0.5 }, { x: 0.74, y: 0.08 }, { x: 0.74, y: 0.92 }, { x: 0.96, y: 0.5 }];
const PM: Pt[] = [{ x: 0.04, y: 0.3 }, { x: 0.36, y: 0.06 }, { x: 0.28, y: 0.94 }, { x: 0.62, y: 0.52 }, { x: 0.96, y: 0.12 }, { x: 0.9, y: 0.92 }];
const P3: Pt[] = [{ x: 0.08, y: 0.5 }, { x: 0.92, y: 0.15 }, { x: 0.5, y: 0.92 }];
const P4: Pt[] = [{ x: 0.06, y: 0.5 }, { x: 0.5, y: 0.08 }, { x: 0.5, y: 0.92 }, { x: 0.94, y: 0.5 }];
const P5: Pt[] = [{ x: 0.04, y: 0.5 }, { x: 0.3, y: 0.08 }, { x: 0.3, y: 0.92 }, { x: 0.68, y: 0.5 }, { x: 0.96, y: 0.5 }];

const E = (s: string): Edge[] => s.split(",").map((t) => { const [u, v, w] = t.trim().split(/\s+/).map(Number); return { u, v, w: w ?? 1 }; });

export interface Preset { label: string; g: Graph }
export const PRESETS: Record<DMode, Preset[]> = {
  "dijkstra": [
    { label: "Six cities", g: { n: 6, pos: P6, directed: true, weighted: true, src: 0, edges: E("0 1 4, 0 2 1, 2 1 2, 1 3 5, 2 3 8, 2 4 10, 3 4 2, 3 5 6, 4 5 3") } },
    { label: "Book check", g: { n: 3, pos: P3, directed: true, weighted: true, src: 0, edges: E("0 1 4, 0 2 1, 2 1 2") } },
    { label: "Long way round", g: { n: 6, pos: P6, directed: true, weighted: true, src: 0, edges: E("0 1 9, 0 2 1, 2 4 1, 4 3 1, 3 1 1, 1 5 2, 3 5 6") } },
  ],
  "negative": [
    { label: "One negative edge", g: { n: 4, pos: P4, directed: true, weighted: true, src: 0, edges: E("0 1 2, 0 2 5, 2 1 -4, 1 3 3") } },
    { label: "Deeper", g: { n: 5, pos: P5, directed: true, weighted: true, src: 0, edges: E("0 1 1, 0 2 4, 2 3 -3, 1 3 2, 3 4 1") } },
  ],
  "bfs-vs": [
    { label: "Seven nodes", g: { n: 7, pos: P7, directed: false, weighted: false, src: 0, edges: E("0 1, 0 2, 1 3, 2 3, 1 4, 3 4, 3 5, 2 5, 4 6, 5 6") } },
    { label: "A ring", g: { n: 6, pos: P6, directed: false, weighted: false, src: 0, edges: E("0 1, 1 3, 3 5, 5 4, 4 2, 2 0") } },
  ],
  "mst": [
    { label: "Six towns", g: { n: 6, pos: PM, directed: false, weighted: true, src: 0, edges: E("0 1 4, 0 2 3, 1 2 5, 1 3 6, 2 3 2, 1 4 7, 3 4 4, 3 5 5, 2 5 8, 4 5 9") } },
    { label: "Not connected", g: { n: 6, pos: PM, directed: false, weighted: true, src: 0, edges: E("0 1 4, 0 2 3, 1 2 5, 3 4 4, 3 5 5, 4 5 9") } },
  ],
};

export const WEIGHT_RANGE: Record<DMode, [number, number]> = { "dijkstra": [0, 99], "negative": [-20, 99], "bfs-vs": [1, 1], "mst": [1, 99] };

/** Directed adjacency in edge-list order: adj[u] = [{ v, w, e }]. Undirected edges appear in both lists. */
export function adjacency(g: Graph): { v: number; w: number; e: number }[][] {
  const adj = Array.from({ length: g.n }, () => [] as { v: number; w: number; e: number }[]);
  g.edges.forEach((ed, e) => {
    adj[ed.u].push({ v: ed.v, w: ed.w, e });
    if (!g.directed) adj[ed.v].push({ v: ed.u, w: ed.w, e });
  });
  return adj;
}

/** Bellman-Ford: the true shortest distances (null when a negative cycle is reachable). */
export function bellmanFord(g: Graph): number[] | null {
  const dist = new Array<number>(g.n).fill(Infinity); dist[g.src] = 0;
  const adj = adjacency(g);
  for (let i = 0; i < g.n; i++) {
    let changed = false;
    for (let u = 0; u < g.n; u++) if (dist[u] < Infinity) for (const { v, w } of adj[u]) if (dist[u] + w < dist[v]) { dist[v] = dist[u] + w; changed = true; }
    if (!changed) return dist;
  }
  return null;
}

function circle(n: number): Pt[] {
  return Array.from({ length: n }, (_, i) => {
    const a = Math.PI + (2 * Math.PI * i) / n;
    return { x: 0.5 + 0.46 * Math.cos(a), y: 0.5 + 0.46 * Math.sin(a) };
  });
}

export function toText(g: Graph): string {
  return g.edges.map((e) => (g.weighted ? `${e.u} ${e.v} ${e.w}` : `${e.u} ${e.v}`)).join(", ");
}

export function parseGraph(text: string, mode: DMode, prev: Graph): Graph | string {
  const parts = text.split(/[,\n;]+/).map((s) => s.trim()).filter(Boolean);
  const weighted = mode !== "bfs-vs";
  if (parts.length < 1 || parts.length > MAX_E) return `Enter 1 to ${MAX_E} edges.`;
  const [lo, hi] = WEIGHT_RANGE[mode];
  const edges: Edge[] = [];
  for (const p of parts) {
    const xs = p.replace(/->|>/g, " ").split(/\s+/).filter(Boolean);
    const want = weighted ? 3 : 2;
    if (xs.length !== want || xs.some((x) => !/^-?\d+$/.test(x))) return weighted ? `"${p}" should look like "u v w", for example "0 1 4".` : `"${p}" should look like "u v", for example "0 1".`;
    const [u, v, w] = xs.map(Number);
    if (u < 0 || v < 0 || u >= MAX_N || v >= MAX_N) return `Use node numbers 0 to ${MAX_N - 1}.`;
    if (u === v) return `Edge "${p}" goes from a node to itself.`;
    const ww = weighted ? w : 1;
    if (ww < lo || ww > hi) return mode === "dijkstra" && ww < 0 ? "Dijkstra needs weights of 0 or more. Try the Negative edge tab." : `Keep weights between ${lo} and ${hi}.`;
    edges.push({ u, v, w: ww });
  }
  const n = Math.max(...edges.flatMap((e) => [e.u, e.v])) + 1;
  if (n < 2) return "Use at least 2 nodes.";
  const directed = mode === "dijkstra" || mode === "negative";
  const pos = n === prev.n ? prev.pos : n <= prev.pos.length ? prev.pos.slice(0, n) : circle(n);
  const g: Graph = { n, pos, edges, directed, weighted, src: Math.min(prev.src, n - 1) };
  if (mode === "negative" && bellmanFord(g) === null) return "This graph has a negative cycle. Then no shortest path exists. Change a weight.";
  return g;
}

/** Same edges, random weights. Negative mode keeps exactly one negative edge (and no negative cycle). */
export function randomWeights(g: Graph, mode: DMode): Graph {
  const r = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1));
  for (let tries = 0; tries < 40; tries++) {
    const edges = g.edges.map((e) => ({ ...e, w: mode === "bfs-vs" ? 1 : r(1, 12) }));
    if (mode === "negative") { const k = r(0, edges.length - 1); edges[k].w = -r(1, 6); }
    const ng = { ...g, edges };
    if (mode !== "negative" || bellmanFord(ng) !== null) return ng;
  }
  return g;
}

/* ---------------- heapq, exactly as CPython does it ---------------- */

export interface Entry { d: number; v: number; id: number }
const lt = (a: Entry, b: Entry) => a.d < b.d || (a.d === b.d && a.v < b.v);
function siftdown(h: Entry[], start: number, pos: number) {
  const item = h[pos];
  while (pos > start) { const pp = (pos - 1) >> 1; if (lt(item, h[pp])) { h[pos] = h[pp]; pos = pp; continue; } break; }
  h[pos] = item;
}
function siftup(h: Entry[], pos: number) {
  const end = h.length, start = pos, item = h[pos];
  let child = 2 * pos + 1;
  while (child < end) { const right = child + 1; if (right < end && !lt(h[child], h[right])) child = right; h[pos] = h[child]; pos = child; child = 2 * pos + 1; }
  h[pos] = item; siftdown(h, start, pos);
}
export function heappush(h: Entry[], x: Entry) { h.push(x); siftdown(h, 0, h.length - 1); }
export function heappop(h: Entry[]): Entry { const last = h.pop()!; if (h.length) { const r = h[0]; h[0] = last; siftup(h, 0); return r; } return last; }
