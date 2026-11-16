/** Layered layout for a directed graph, in real pixels. Back edges (found by DFS) are ignored for layering. */
import type { Edge } from "./engine";

export interface GLayout { pos: { x: number; y: number }[]; width: number; height: number; layer: number[]; back: boolean[]; horizontal: boolean }
export const NR = 20;

export function layoutGraph(n: number, edges: Edge[], W: number): GLayout {
  const adj: number[][] = Array.from({ length: n }, () => []);
  edges.forEach(([u, v], i) => adj[u].push(i));
  // 1. back edges via iterative DFS
  const back = edges.map(() => false);
  const st = Array(n).fill(0) as number[], it = Array(n).fill(0) as number[];
  for (let s = 0; s < n; s++) {
    if (st[s]) continue;
    st[s] = 1; const stack = [s];
    while (stack.length) {
      const u = stack[stack.length - 1];
      if (it[u] < adj[u].length) {
        const e = adj[u][it[u]++], v = edges[e][1];
        if (st[v] === 1) back[e] = true; else if (st[v] === 0) { st[v] = 1; stack.push(v); }
      } else { stack.pop(); st[u] = 2; }
    }
  }
  // 2. longest-path layers on the DAG part
  const indeg = Array(n).fill(0) as number[];
  edges.forEach(([, v], i) => { if (!back[i]) indeg[v]++; });
  const layer = Array(n).fill(0) as number[];
  const q: number[] = []; for (let i = 0; i < n; i++) if (!indeg[i]) q.push(i);
  while (q.length) {
    const u = q.shift()!;
    for (const e of adj[u]) { if (back[e]) continue; const v = edges[e][1]; layer[v] = Math.max(layer[v], layer[u] + 1); if (--indeg[v] === 0) q.push(v); }
  }
  const nL = Math.max(...layer) + 1;
  const layers: number[][] = Array.from({ length: nL }, () => []);
  for (let i = 0; i < n; i++) layers[layer[i]].push(i);
  // 3. barycenter ordering, two sweeps
  const preds: number[][] = Array.from({ length: n }, () => []);
  const succs: number[][] = Array.from({ length: n }, () => []);
  edges.forEach(([u, v], i) => { if (!back[i]) { preds[v].push(u); succs[u].push(v); } });
  const idx = Array(n).fill(0) as number[];
  const reindex = () => layers.forEach((l) => l.forEach((v, i) => (idx[v] = i)));
  reindex();
  const bary = (v: number, nb: number[]) => (nb.length ? nb.reduce((s, x) => s + idx[x], 0) / nb.length : idx[v]);
  for (let pass = 0; pass < 2; pass++) {
    for (let l = 1; l < nL; l++) { layers[l].sort((a, b) => bary(a, preds[a]) - bary(b, preds[b]) || a - b); reindex(); }
    for (let l = nL - 2; l >= 0; l--) { layers[l].sort((a, b) => bary(a, succs[a]) - bary(b, succs[b]) || a - b); reindex(); }
  }
  const maxPer = Math.max(...layers.map((l) => l.length));
  const horizontal = W >= 520;
  const pos = Array.from({ length: n }, () => ({ x: 0, y: 0 }));
  let height: number;
  if (horizontal) {
    const padX = 40, padY = 26;
    const colGap = nL > 1 ? Math.min(150, (W - 2 * padX) / (nL - 1)) : 0;
    const rowGap = 78;
    const totalW = colGap * (nL - 1);
    const x0 = (W - totalW) / 2;
    height = padY * 2 + (maxPer - 1) * rowGap + 2 * NR + 18;
    layers.forEach((l, li) => l.forEach((v, i) => {
      pos[v] = { x: x0 + li * colGap, y: padY + NR + ((maxPer - l.length) / 2 + i) * rowGap };
    }));
  } else {
    const padY = 24, rowGap = 86;
    const colGap = maxPer > 1 ? Math.min(104, (W - 64) / (maxPer - 1)) : 0;
    height = padY * 2 + (nL - 1) * rowGap + 2 * NR;
    layers.forEach((l, li) => l.forEach((v, i) => {
      pos[v] = { x: W / 2 + (i - (l.length - 1) / 2) * colGap, y: padY + NR + li * rowGap };
    }));
  }
  return { pos, width: W, height, layer, back, horizontal };
}

/** Quadratic edge from u to v, bent when it skips layers, stays in one layer, or goes backwards. Returns line and arrowhead paths. */
export function edgeGeom(g: GLayout, e: Edge, i: number): { d: string; head: string } {
  const [u, v] = e, a = g.pos[u], b = g.pos[v];
  const span = g.layer[v] - g.layer[u];
  const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len, ny = dx / len;
  let bend = 0;
  if (g.back[i]) bend = 52;
  else if (span !== 1) bend = 30 * (i % 2 ? -1 : 1);
  const cx = (a.x + b.x) / 2 + nx * bend, cy = (a.y + b.y) / 2 + ny * bend;
  const ux = (cx - a.x) / (Math.hypot(cx - a.x, cy - a.y) || 1), uy = (cy - a.y) / (Math.hypot(cx - a.x, cy - a.y) || 1);
  const wx = (b.x - cx) / (Math.hypot(b.x - cx, b.y - cy) || 1), wy = (b.y - cy) / (Math.hypot(b.x - cx, b.y - cy) || 1);
  const sx = a.x + ux * (NR + 2), sy = a.y + uy * (NR + 2);
  const ex = b.x - wx * (NR + 3), ey = b.y - wy * (NR + 3);
  const bx = ex - wx * 9, by = ey - wy * 9, px = -wy * 5, py = wx * 5;
  const f = (x: number) => x.toFixed(1);
  return {
    d: `M${f(sx)} ${f(sy)} Q${f(cx)} ${f(cy)} ${f(bx)} ${f(by)}`,
    head: `M${f(ex)} ${f(ey)} L${f(bx + px)} ${f(by + py)} L${f(bx - px)} ${f(by - py)} Z`,
  };
}
