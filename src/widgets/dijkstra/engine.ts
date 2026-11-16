/** Pure frame builders: run the real algorithm once and record state + code line + narration per step. */
import type { Ask, BaseFrame } from "../grid-bfs/kit/player";
import { adjacency, bellmanFord, heappop, heappush, type Entry, type Graph } from "./graph";
import { BL, DL, KL, NL } from "./code";

export interface DFrame extends BaseFrame {
  dist: number[];                         // Infinity = INF (Dijkstra), -1 = not seen (BFS)
  parentEdge: number[];                   // edge that last improved dist[v]
  done: boolean[];                        // popped with a valid entry: final
  heap: Entry[];                          // the real pq list (or the BFS queue)
  popped: (Entry & { stale: boolean }) | null;
  cur: number;                            // node being expanded
  edge: number;                           // edge being looked at
  dir: [number, number] | null;           // its direction of travel
  result: "better" | "same" | null;
  tree: boolean;                          // draw the final shortest-path tree
  truth: number[] | null;                 // negative mode: true distances, shown at the end
  order: number[];                        // mst: sorted edge indexes
  at: number;                             // mst: position in order
  take: (boolean | null)[];               // mst: per edge, taken / skipped / not yet
  dsu: number[];                          // mst: DSU parent array
  total: number; used: number;
  pops: number; staleN: number; pushes: number;
  finished: boolean;
}

const fmt = (x: number) => (x === Infinity ? "INF" : String(x));

function blank(g: Graph): DFrame {
  return {
    line: 0, say: "", dist: [], parentEdge: new Array(g.n).fill(-1), done: new Array(g.n).fill(false), heap: [], popped: null, cur: -1, edge: -1, dir: null,
    result: null, tree: false, truth: null, order: [], at: -1, take: g.edges.map(() => null), dsu: [], total: 0, used: 0, pops: 0, staleN: 0, pushes: 0, finished: false,
  };
}

function whichPop(heap: Entry[]): Ask {
  const sorted = [...heap].sort((a, b) => a.d - b.d || a.v - b.v);
  const best = sorted[0];
  const others = [heap[heap.length - 1], sorted[sorted.length - 1], sorted[1]].filter((e, i, a) => e && e.id !== best.id && a.findIndex((x) => x && x.id === e.id) === i).slice(0, 2);
  const opts = [best, ...others].sort((a, b) => a.v * 7 + a.d - (b.v * 7 + b.d));
  return {
    q: "Which entry does `heappop(pq)` return?",
    options: opts.map((e) => `(${e.d}, ${e.v})`), answer: opts.findIndex((e) => e.id === best.id),
    why: "A min-heap always gives the smallest pair: the smallest distance first, and on a tie the smaller node number.",
  };
}

/** Dijkstra. variant "lazy" = the book template (skip stale entries); "done" = the classic version (a popped node is final). */
export function dijkstraFrames(g: Graph, variant: "lazy" | "done"): DFrame[] {
  const L = variant === "lazy" ? DL : NL;
  const adj = adjacency(g);
  const dist = new Array<number>(g.n).fill(Infinity), parentEdge = new Array<number>(g.n).fill(-1), done = new Array<boolean>(g.n).fill(false);
  const heap: Entry[] = []; let id = 0;
  let pops = 0, staleN = 0, pushes = 0, relaxN = 0;
  const frames: DFrame[] = [];
  const snap = (f: Partial<DFrame> & { line: number; say: string }) =>
    frames.push({ ...blank(g), dist: dist.slice(), parentEdge: parentEdge.slice(), done: done.slice(), heap: heap.slice(), pops, staleN, pushes, ...f });
  const arrow = (u: number, v: number) => `${u} → ${v}`;

  dist[g.src] = 0; heappush(heap, { d: 0, v: g.src, id: id++ }); pushes++;
  snap({ line: L.init, line2: L.src, say: `\`dist[${g.src}] = 0\`, every other node is INF. The heap \`pq\` holds one entry: (0, ${g.src}).` });

  while (heap.length) {
    if (heap.length >= 2 && (pops < 2 || pops % 3 === 0)) frames[frames.length - 1].ask = whichPop(heap);
    const e = heappop(heap); pops++;
    const u = e.v;
    const stale = variant === "lazy" ? e.d > dist[u] : done[u];
    if (stale) {
      snap({ line: L.pop, popped: { ...e, stale: false }, say: `\`heappop\` gives (${e.d}, ${u}), the smallest pair left in the heap.` });
      frames[frames.length - 1].ask = {
        q: variant === "lazy" ? `The entry says ${e.d}, but \`dist[${u}]\` is already ${fmt(dist[u])}. What happens?` : `Node ${u} is already done. What happens?`,
        options: ["Skip it: `continue`", "Relax its edges again"], answer: 0,
        why: variant === "lazy" ? "The entry is stale: a shorter path was found after it was pushed. Its edges already ran with the better distance." : "In the classic version a done node is final, so its edges never run again.",
      };
      staleN++;
      snap({ line: L.stale, line2: L.staleIf, popped: { ...e, stale: true }, say: variant === "lazy"
        ? `${e.d} > \`dist[${u}]\` = ${dist[u]}: this entry is stale. A shorter path to ${u} was found after it was pushed. Skip it.`
        : dist[u] === e.d
          ? `Node ${u} is already done, so this entry is skipped. \`dist[${u}]\` did drop to ${dist[u]}, but its edges never run with the new value.`
          : `Node ${u} is already done, so this old entry is skipped.` });
      continue;
    }
    done[u] = true;
    snap({ line: variant === "lazy" ? L.pop : NL.mark, line2: variant === "lazy" ? undefined : NL.pop, popped: { ...e, stale: false }, cur: u, say: variant === "lazy"
      ? `\`heappop\` gives (${e.d}, ${u}). It is the closest node left, and weights are not negative, so \`dist[${u}] = ${e.d}\` is final.`
      : `\`heappop\` gives (${e.d}, ${u}). \`done[${u}] = True\`: the classic rule says ${u} is final now.` });
    if (adj[u].length === 0) snap({ line: L.loop, cur: u, say: `Node ${u} has no outgoing edges. Nothing to relax.` });
    for (const { v, w, e: ei } of adj[u]) {
      const nd = e.d + w, old = dist[v], better = nd < old;
      relaxN++;
      if (relaxN <= 3 || relaxN % 5 === 0) {
        const prev = frames[frames.length - 1];
        if (!prev.ask) prev.ask = {
          q: `Edge ${arrow(u, v)} has weight ${w}, so \`nd = ${e.d} + ${w} = ${nd}\`. \`dist[${v}]\` is ${fmt(old)}. What happens?`,
          options: ["Update `dist` and push", "No change"], answer: better ? 0 : 1,
          why: better ? `${nd} < ${fmt(old)}, so this path is shorter.` : `${nd} is not smaller than ${fmt(old)}.`,
        };
      }
      if (better) {
        dist[v] = nd; parentEdge[v] = ei; heappush(heap, { d: nd, v, id: id++ }); pushes++;
        let say = `Edge ${arrow(u, v)} (${w}): \`nd = ${e.d} + ${w} = ${nd} < ${fmt(old)}\`. Set \`dist[${v}] = ${nd}\` and push (${nd}, ${v}).`;
        if (variant === "lazy" && old !== Infinity) say += ` The old entry (${old}, ${v}) stays in the heap. It is now stale.`;
        if (variant === "done" && done[v]) say = `Edge ${arrow(u, v)} (${w}): \`nd = ${nd} < ${old}\`, so \`dist[${v}]\` drops to ${nd}. But node ${v} is already done: its edges ran with the old value ${old}, and they will not run again.`;
        snap({ line: L.push, line2: L.set, cur: u, edge: ei, dir: [u, v], result: "better", say });
      } else {
        snap({ line: L.cmp, cur: u, edge: ei, dir: [u, v], result: "same", say: `Edge ${arrow(u, v)} (${w}): \`nd = ${nd}\` is not smaller than \`dist[${v}] = ${fmt(old)}\`. No change.` });
      }
    }
  }

  const unreachable = dist.map((d, i) => (d === Infinity ? i : -1)).filter((i) => i >= 0);
  const distText = `[${dist.map(fmt).join(", ")}]`;
  if (variant === "lazy") {
    snap({ line: L.ret, tree: true, finished: true, say: `The heap is empty. \`dist = ${distText}\`.${staleN ? ` ${staleN} stale entr${staleN === 1 ? "y was" : "ies were"} skipped.` : ""} The green edges form the shortest-path tree.` +
      (unreachable.length ? ` Node${unreachable.length > 1 ? "s" : ""} ${unreachable.join(", ")} cannot be reached.` : "") });
  } else {
    const truth = bellmanFord(g);
    const wrong = truth ? dist.map((d, i) => (d !== truth[i] ? i : -1)).filter((i) => i >= 0) : [];
    const say = wrong.length
      ? `The heap is empty. Dijkstra says ${wrong.map((i) => `\`dist[${i}] = ${fmt(dist[i])}\``).join(", ")}, but the true shortest ${wrong.length > 1 ? "distances are" : "distance is"} ${wrong.map((i) => fmt(truth![i])).join(", ")}. With a negative edge, "popped = final" is false. Use Bellman-Ford instead.`
      : `The heap is empty, and this time every distance happens to be right. With a negative edge nothing guarantees that. Try "One negative edge".`;
    snap({ line: L.ret, tree: false, finished: true, truth, say });
  }
  return frames;
}

/** Graph BFS (every edge costs 1). The queue is drawn in the same strip as the heap, as (dist, node). */
export function bfsFrames(g: Graph): DFrame[] {
  const adj = adjacency(g);
  const dist = new Array<number>(g.n).fill(-1), parentEdge = new Array<number>(g.n).fill(-1), done = new Array<boolean>(g.n).fill(false);
  let q: Entry[] = []; let id = 0, pops = 0, pushes = 0;
  const frames: DFrame[] = [];
  const snap = (f: Partial<DFrame> & { line: number; say: string }) =>
    frames.push({ ...blank(g), dist: dist.slice(), parentEdge: parentEdge.slice(), done: done.slice(), heap: q.slice(), pops, pushes, ...f });

  dist[g.src] = 0; q = [{ d: 0, v: g.src, id: id++ }]; pushes++;
  snap({ line: BL.init, line2: BL.src, say: `\`dist[${g.src}] = 0\`, every other node is -1 (not seen). The queue holds ${g.src}.` });
  while (q.length) {
    const e = q[0]; q = q.slice(1); pops++;
    const u = e.v; done[u] = true;
    snap({ line: BL.pop, cur: u, popped: { ...e, stale: false }, say: `\`popleft()\` gives ${u}, dist ${dist[u]}. A queue gives nodes in order of distance, so no heap is needed.` });
    for (const { v, e: ei } of adj[u]) {
      if (dist[v] === -1) {
        dist[v] = dist[u] + 1; parentEdge[v] = ei; q = [...q, { d: dist[v], v, id: id++ }]; pushes++;
        snap({ line: BL.push, line2: BL.set, cur: u, edge: ei, dir: [u, v], result: "better", say: `${v} is new: \`dist[${v}] = ${dist[v]}\`, mark it now and append it.` });
      } else {
        snap({ line: BL.cmp, cur: u, edge: ei, dir: [u, v], result: "same", say: `${v} is already seen (dist ${dist[v]}). Skip it.` });
      }
    }
  }
  snap({ line: BL.ret, tree: true, finished: true, say: `The queue is empty. \`dist = [${dist.join(", ")}]\`. Same answer as Dijkstra, with no heap: O(V + E) instead of O((V + E) log V).` });
  return frames;
}

/** Kruskal with the Day 13 DSU (iterative find with path compression, union by size). */
export function kruskalFrames(g: Graph): DFrame[] {
  const parent = Array.from({ length: g.n }, (_, i) => i), size = new Array<number>(g.n).fill(1);
  const find = (x: number) => {
    let root = x;
    while (parent[root] !== root) root = parent[root];
    while (parent[x] !== root) { const nxt = parent[x]; parent[x] = root; x = nxt; }
    return root;
  };
  const take: (boolean | null)[] = g.edges.map(() => null);
  let total = 0, used = 0;
  const order = g.edges.map((_, i) => i).sort((a, b) => {
    const A = g.edges[a], B = g.edges[b];
    return A.w - B.w || A.u - B.u || A.v - B.v;
  });
  const frames: DFrame[] = [];
  const snap = (f: Partial<DFrame> & { line: number; say: string }) =>
    frames.push({ ...blank(g), take: take.slice(), dsu: parent.slice(), total, used, ...f });
  const name = (i: number) => `${g.edges[i].u}–${g.edges[i].v} (${g.edges[i].w})`;

  snap({ line: KL.zero, line2: KL.dsu, say: `\`dsu = DSU(${g.n})\`: every node is its own group. \`total = used = 0\`. A tree on ${g.n} nodes needs ${g.n - 1} edges.` });
  snap({ line: KL.loop, order, say: `\`sorted(edges)\`: try the cheapest edge first. Weights in order: ${order.map((i) => g.edges[i].w).join(", ")}.` });
  let k = 0;
  for (; k < order.length; k++) {
    const ei = order[k], { u, v, w } = g.edges[ei];
    const ru = find(u), rv = find(v);
    if (k < 3 || k % 2 === 1) frames[frames.length - 1].ask = {
      q: `Next edge: ${name(ei)}. Take it or skip it?`,
      options: ["Take it: `union` returns True", "Skip it: it would close a cycle"], answer: ru !== rv ? 0 : 1,
      why: ru !== rv ? `${u} and ${v} are in different groups, so the edge joins two groups without a cycle.` : `${u} and ${v} are already connected, so this edge would close a cycle.`,
    };
    if (ru !== rv) {
      let a = ru, b = rv;
      if (size[a] < size[b]) [a, b] = [b, a];
      parent[b] = a; size[a] += size[b];
      take[ei] = true; total += w; used++;
      snap({ line: KL.used, line2: KL.union, order, at: k, edge: ei, say: `${name(ei)}: \`find(${u}) = ${ru}\`, \`find(${v}) = ${rv}\`. Different groups, so \`union\` joins them. Take it: \`total = ${total}\`, \`used = ${used}\`.` });
      if (used === g.n - 1) {
        snap({ line: KL.brk, line2: KL.full, order, at: k, edge: ei, say: `\`used = ${used} = n - 1\`: the tree is complete. \`break\`. The other edges are never checked.` });
        break;
      }
    } else {
      take[ei] = false;
      snap({ line: KL.union, order, at: k, edge: ei, say: `${name(ei)}: \`find(${u}) = find(${v}) = ${ru}\`. They are already connected, so this edge would close a cycle. Skip it.` });
    }
  }
  const ok = used === g.n - 1;
  snap({ line: KL.ret, order, at: Math.min(k, order.length - 1), tree: true, finished: true, say: ok
    ? `Return \`total = ${total}\`. The green edges connect all ${g.n} nodes with the smallest possible total weight.`
    : `Only ${used} edges were taken, fewer than \`n - 1 = ${g.n - 1}\`. The graph is not connected, so return -1.` });
  return frames;
}
