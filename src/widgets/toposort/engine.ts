/**
 * Pure frame builders for the toposort lab. Input (n, edges) in, frames out.
 * Each frame is a full snapshot so stepping back is free.
 */
import type { Ask, BaseFrame } from "../union-find/kit/player";
import { D, K } from "./code";

export type TMode = "kahn" | "cycle" | "dfs";
export type NState = "wait" | "queue" | "cur" | "done" | "stuck" | "open";
export type Edge = [number, number];

export interface TFrame extends BaseFrame {
  indeg: number[];
  state: NState[];
  /** edge index being looked at */
  edge?: number;
  /** edges already used (Kahn: removed; DFS: explored) */
  used: boolean[];
  /** edges left on the cycle at the end */
  bad: boolean[];
  /** indeg cells that changed in this frame */
  flash: number[];
  queue: number[]; order: number[];
  stack: number[]; post: number[];
  /** final answer (DFS: reversed post) */
  final?: number[];
  /** small label under a node: order position or finish number */
  rank: (number | null)[];
  stuck: number[];
  tone?: "good" | "bad" | "warn";
}

const L = (xs: number[]) => `[${xs.join(", ")}]`;

export function buildKahn(n: number, edges: Edge[]): TFrame[] {
  const adj: number[][] = Array.from({ length: n }, () => []);
  const eid: number[][] = Array.from({ length: n }, () => []);
  const indeg = Array(n).fill(0) as number[];
  edges.forEach(([u, v], i) => { adj[u].push(v); eid[u].push(i); indeg[v]++; });
  const state: NState[] = Array(n).fill("wait");
  const used = edges.map(() => false);
  const rank: (number | null)[] = Array(n).fill(null);
  const queue: number[] = [], order: number[] = [];
  const frames: TFrame[] = [];
  const push = (f: Partial<TFrame> & { line: number; say: string }) => frames.push({
    indeg: [...indeg], state: [...state], used: [...used], bad: edges.map(() => false), flash: [], queue: [...queue], order: [...order],
    stack: [], post: [], rank: [...rank], stuck: [], ...f,
  });
  const askLast = (a: Ask) => { const f = frames[frames.length - 1]; if (f && !f.ask) f.ask = a; };

  push({ line: K.count, line2: K.build, say: `Build \`adj\` and count arrows into each node: \`indeg = ${L(indeg)}\`.`, flash: indeg.map((_, i) => i) });
  for (let i = 0; i < n; i++) if (indeg[i] === 0) { queue.push(i); state[i] = "queue"; }
  push({ line: K.queue, say: queue.length ? `Indegree 0 means nothing comes before it. Queue: ${L(queue)}.` : `No node has indegree 0, so the queue starts empty.` });

  while (queue.length) {
    const u = queue.shift()!;
    order.push(u); state[u] = "cur"; rank[u] = order.length;
    push({ line: K.pop, line2: K.append, say: `Pop ${u} from the front. \`order = ${L(order)}\`.${adj[u].length ? "" : ` ${u} has no outgoing arrows.`}` });
    adj[u].forEach((v, j) => {
      const e = eid[u][j];
      const before = indeg[v];
      askLast({ q: `Arrow ${u} → ${v} is used up. Does ${v} join the queue now?`, options: ["Yes", "No"], answer: before === 1 ? 0 : 1, why: before === 1 ? `\`indeg[${v}]\` goes from 1 to 0. Nothing else blocks it.` : `\`indeg[${v}]\` goes from ${before} to ${before - 1}. It still waits for ${before - 1} more arrow${before - 1 === 1 ? "" : "s"}.` });
      indeg[v]--; used[e] = true;
      push({ line: K.dec, edge: e, flash: [v], say: `Arrow ${u} → ${v} is used up: \`indeg[${v}]\` ${before} → ${indeg[v]}.${indeg[v] ? ` Still blocked by ${indeg[v]} arrow${indeg[v] === 1 ? "" : "s"}.` : ""}` });
      if (indeg[v] === 0) {
        queue.push(v); state[v] = "queue";
        push({ line: K.push, edge: e, say: `\`indeg[${v}]\` is 0: everything before ${v} is done. Push ${v} to the back of the queue.` });
      }
    });
    state[u] = "done";
  }

  if (order.length === n) {
    push({ line: K.ret, tone: "good", say: `All ${n} nodes came out. \`order = ${L(order)}\` is a valid order: every arrow points forward in it.` });
  } else {
    const stuck = state.map((s, i) => (s === "wait" ? i : -1)).filter((i) => i >= 0);
    askLast({ q: `The queue is empty. Did all ${n} nodes come out?`, options: ["Yes, the order is complete", `No, some are stuck`], answer: 1, why: `Only ${order.length} of ${n} came out. The rest never reached indegree 0.` });
    push({ line: K.loop, tone: "warn", say: `The queue is empty, so the loop stops. Only ${order.length} of ${n} nodes came out.` });
    stuck.forEach((i) => (state[i] = "stuck"));
    const bad = edges.map(([u, v]) => stuck.includes(u) && stuck.includes(v));
    push({ line: K.ret, tone: "bad", bad, stuck, say: `${stuck.join(", ")} never reached indegree 0: each waits on another in a cycle. \`len(order) = ${order.length} < ${n}\`, so return \`[]\`.` });
  }
  return frames;
}

export function buildDfs(n: number, edges: Edge[]): TFrame[] {
  const adj: number[][] = Array.from({ length: n }, () => []);
  const eid: number[][] = Array.from({ length: n }, () => []);
  edges.forEach(([u, v], i) => { adj[u].push(v); eid[u].push(i); });
  const st = Array(n).fill(0) as number[];
  const it = Array(n).fill(0) as number[];
  const used = edges.map(() => false);
  const rank: (number | null)[] = Array(n).fill(null);
  const post: number[] = [];
  let stack: number[] = [];
  const frames: TFrame[] = [];
  const nstate = (): NState[] => st.map((s, i) => (s === 2 ? "done" : s === 1 ? (stack[stack.length - 1] === i ? "cur" : "open") : "wait"));
  const push = (f: Partial<TFrame> & { line: number; say: string }) => frames.push({
    indeg: Array(n).fill(0), state: nstate(), used: [...used], bad: edges.map(() => false), flash: [], queue: [], order: [],
    stack: [...stack], post: [...post], rank: [...rank], stuck: [], ...f,
  });

  push({ line: D.init, say: `Every node starts new (\`state = 0\`). \`post\` will collect nodes in the order they finish.` });
  let firstPop = true;
  for (let s = 0; s < n; s++) {
    if (st[s]) { push({ line: D.skip, say: `${s} is already done. Skip it.` }); continue; }
    st[s] = 1; stack = [s];
    push({ line: D.start, line2: D.startMark, say: `Start a DFS at ${s}: mark it open, \`stack = [${s}]\`.` });
    while (stack.length) {
      const u = stack[stack.length - 1];
      if (it[u] < adj[u].length) {
        const v = adj[u][it[u]], e = eid[u][it[u]];
        it[u]++; used[e] = true;
        if (st[v] === 1) {
          push({ line: D.back, edge: e, tone: "bad", say: `Arrow ${u} → ${v} points back to an open node. That is a cycle: return \`[]\`.` });
          return frames;
        }
        if (st[v] === 0) {
          st[v] = 1; stack.push(v);
          push({ line: D.push, line2: D.tryEdge, edge: e, say: `Arrow ${u} → ${v}: ${v} is new, so go deeper. \`stack = ${L(stack)}\`.` });
        } else {
          push({ line: D.isNew, line2: D.tryEdge, edge: e, say: `Arrow ${u} → ${v}: ${v} is already done. Nothing to do.` });
        }
      } else {
        if (firstPop) {
          const f = frames[frames.length - 1];
          const opts = [...new Set([u, s, ...stack.slice(0, -1)])].slice(0, 3);
          if (opts.length > 1 && !f.ask) f.ask = { q: `Which node finishes next?`, options: opts.map(String), answer: 0, why: `${u} is on top of the stack and has no arrows left to try.` };
          firstPop = false;
        }
        stack.pop(); st[u] = 2; post.push(u); rank[u] = post.length;
        push({ line: D.finish, line2: D.pop, say: `All arrows out of ${u} are explored. ${u} is finished: \`post = ${L(post)}\`.` });
      }
    }
  }
  const final = [...post].reverse();
  const last = frames[frames.length - 1];
  const wrongSorted = [...post].sort((a, b) => a - b);
  const alt = L(post) === L(final) ? L(wrongSorted) : L(post);
  last.ask = { q: `\`post = ${L(post)}\`. What is the topological order?`, options: [L(final), alt], answer: 0, why: `A node finishes only after everything it points to. So reverse \`post\`.` };
  const pos = Array(n).fill(0) as number[]; final.forEach((v, i) => (pos[v] = i + 1));
  push({ line: D.ret, tone: "good", final, rank: pos, say: `Reverse \`post\`: \`order = ${L(final)}\`. Every node finished after the nodes it points to, so reversed, every arrow points forward.` });
  return frames;
}

/* -------------------- input -------------------- */

export function parseGraph(nText: string, eText: string): { n: number; edges: Edge[] } | string {
  if (!/^\d+$/.test(nText.trim())) return "n must be a whole number.";
  const n = Number(nText);
  if (n < 2 || n > 10) return "n must be between 2 and 10.";
  const parts = eText.split(/[,;\n]+/).map((x) => x.trim()).filter(Boolean);
  if (parts.length < 1 || parts.length > 20) return "Enter 1 to 20 arrows, separated by commas.";
  const out: Edge[] = [], seen = new Set<string>();
  for (const p of parts) {
    const m = p.match(/^(\d+)\s*(?:->|>|→|\s)\s*(\d+)$/);
    if (!m) return `"${p}" is not an arrow. Write it like "0>2" (0 comes before 2).`;
    const u = Number(m[1]), v = Number(m[2]);
    if (u >= n || v >= n) return `Node ${Math.max(u, v)} is out of range (0 to ${n - 1}).`;
    if (u === v) return `${u}>${v} is a self-loop. Use two different nodes.`;
    if (seen.has(`${u}>${v}`)) return `${u}>${v} appears twice.`;
    seen.add(`${u}>${v}`); out.push([u, v]);
  }
  return { n, edges: out };
}
export const graphStr = (e: Edge[]) => e.map(([u, v]) => `${u}>${v}`).join(", ");
