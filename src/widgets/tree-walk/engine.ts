/**
 * Pure frame builders for the tree-walk lab. Each one runs the traversal on a parsed tree and records
 * node states, badges, the stack / queue contents, the running code line and one sentence per step.
 */
import { asker, lineOf, type Ask, type BaseFrame } from "../recursion-tree/kit/player";
import type { Tree } from "./model";
import { BST_INSERT, BST_SEARCH, BST_VALID, DIAMETER, IN_ITER, LEVELS, POST_ITER, PRE_ITER, SUBSUM } from "./code";

export type Mode = "dfs-return" | "bfs-levels" | "iterative" | "bst";
export const MODES: { value: Mode; label: string }[] = [
  { value: "dfs-return", label: "DFS returns" },
  { value: "bfs-levels", label: "BFS levels" },
  { value: "iterative", label: "Iterative" },
  { value: "bst", label: "BST" },
];
export type DfsKind = "height" | "sum";
export type IterKind = "post" | "pre" | "in";
export type BstKind = "search" | "insert" | "validate";

/** h = not in the tree yet (insert), idle, queued = waiting in the queue / stack, open = on the call stack,
 *  act = being processed now, done = finished, good / bad = result, dim = ruled out. */
export type TSt = "h" | "idle" | "queued" | "open" | "act" | "done" | "good" | "bad" | "dim";
export type Tone = "acc" | "good" | "bad" | "dim" | "open";
export interface Item { key: string; t: string; tone?: Tone }
export interface List { name: string; items: Item[]; vertical?: boolean; note?: string; empty?: string }
export interface TFrame extends BaseFrame {
  st: TSt[]; badge: (string | null)[];
  flow?: { from: number; to: number; text: string };
  ghosts?: { parent: number; side: "L" | "R" }[];
  band?: number;
  lists: List[];
  stats?: { label: string; value: string; tone?: Tone }[];
}
export interface Run { tree: Tree; frames: TFrame[]; code: string[]; title: string }

class TB {
  st: TSt[]; badge: (string | null)[];
  frames: TFrame[] = [];
  ask = asker(3);
  constructor(public t: Tree, public code: string[]) {
    this.st = t.nodes.map(() => "idle");
    this.badge = t.nodes.map(() => null);
  }
  line(needle: string, from = 0) { return lineOf(this.code, needle, from); }
  v(u: number) { return this.t.nodes[u].val; }
  snap(line: number, say: string, lists: List[], extra: Partial<TFrame> = {}) {
    this.frames.push({ st: this.st.slice(), badge: this.badge.slice(), line, say, lists, ...extra });
  }
  askLast(kind: string, a: Ask) {
    const f = this.frames[this.frames.length - 1];
    if (f && !f.ask) f.ask = this.ask(kind, a);
  }
}

const L = (a: (number | string)[]) => `[${a.join(", ")}]`;
/** 2-3 distinct options with the right one at a position that varies with `seed`. */
function opts(right: string, wrong: string[], seed: number): { options: string[]; answer: number } {
  const w = [...new Set(wrong.filter((x) => x !== right))].slice(0, 2);
  const at = seed % (w.length + 1);
  const options = [...w];
  options.splice(at, 0, right);
  return { options, answer: at };
}

/* ---------------- DFS that returns a value ---------------- */

export function buildDfs(t: Tree, kind: DfsKind): Run {
  const code = kind === "height" ? DIAMETER : SUBSUM;
  const b = new TB(t, code);
  const fn = kind === "height" ? "height" : "total";
  const N = t.nodes;
  interface Fr { id: number; l?: number; r?: number }
  const stack: Fr[] = [];
  let best = 0;
  const lists = (): List[] => [{
    name: "call stack", vertical: true, empty: "empty",
    items: stack.slice().reverse().map((f, i) => ({ key: `c${f.id}`, tone: i === 0 ? "acc" : "open", t: `${fn}(${N[f.id].val})${f.l !== undefined ? `  l=${f.l}` : ""}${f.r !== undefined ? `  r=${f.r}` : ""}` })),
  }];
  const stats = () => (kind === "height" ? [{ label: "best", value: String(best) }] : undefined);
  const callLine = b.line(`l, r = ${fn}(node.left)`);
  const baseLine = b.line("return 0");

  if (t.root < 0) { b.snap(0, "The tree is empty.", lists()); return { tree: t, frames: b.frames, code, title: "" }; }
  stack.push({ id: t.root }); b.st[t.root] = "act";
  b.snap(b.line(kind === "height" ? "    height(root)" : `return ${fn}(root)`), `Call \`${fn}(${b.v(t.root)})\` on the root. It goes on the call stack.`, lists(), { stats: stats() });

  const visit = (u: number): number => {
    const fr = stack[stack.length - 1];
    const n = N[u];
    const side = (c: number, s: "L" | "R"): number => {
      if (c < 0) return 0;
      b.st[u] = "open"; stack.push({ id: c }); b.st[c] = "act";
      b.snap(callLine, `${s === "L" ? "Go left" : "Now go right"}: call \`${fn}(${b.v(c)})\`. Push it on the call stack.`, lists(), { stats: stats() });
      const val = visit(c);
      b.st[u] = "act";
      return val;
    };
    if (n.left < 0 && n.right < 0) {
      fr.l = 0; fr.r = 0;
      b.snap(baseLine, `${b.v(u)} is a leaf. Both children are None, and \`${fn}(None)\` returns 0. So l = 0 and r = 0.`, lists(), { stats: stats(), ghosts: [{ parent: u, side: "L" }, { parent: u, side: "R" }], line2: b.line("if not node") });
    } else {
      if (n.left < 0) {
        fr.l = 0;
        b.snap(baseLine, `${b.v(u)} has no left child: \`${fn}(None)\` returns 0, so l = 0.`, lists(), { stats: stats(), ghosts: [{ parent: u, side: "L" }], line2: b.line("if not node") });
      } else fr.l = side(n.left, "L");
      if (n.right < 0) {
        fr.r = 0;
        b.snap(baseLine, `${b.v(u)} has no right child: \`${fn}(None)\` returns 0, so r = 0.`, lists(), { stats: stats(), ghosts: [{ parent: u, side: "R" }], line2: b.line("if not node") });
      } else fr.r = side(n.right, "R");
    }
    const l = fr.l!, r = fr.r!;
    let ret: number;
    if (kind === "height") {
      const nb = Math.max(best, l + r);
      b.snap(b.line("best = max"), nb > best
        ? `l = ${l}, r = ${r}. The longest path bending at ${b.v(u)} has ${l + r} edge${l + r === 1 ? "" : "s"}. best = max(${best}, ${l + r}) = ${nb}.`
        : `l = ${l}, r = ${r}. The path through ${b.v(u)} has ${l + r} edge${l + r === 1 ? "" : "s"}. best stays ${best}.`, lists(), { stats: [{ label: "best", value: String(nb), tone: nb > best ? "good" : undefined }] });
      best = nb;
      ret = 1 + Math.max(l, r);
      b.askLast("ret", { q: `l = ${l}, r = ${r}. What does \`height(${b.v(u)})\` return to its parent?`, ...opts(String(ret), [String(l + r), String(Math.max(l, r)), String(l + r + 1)], u), why: "The parent can extend only one side, so return 1 + max(l, r). Both sides together go into best, not into the return value." });
    } else {
      ret = n.val + l + r;
      b.askLast("ret", { q: `l = ${l}, r = ${r}. What does \`total(${b.v(u)})\` return?`, ...opts(String(ret), [String(l + r), String(n.val), String(n.val + Math.max(l, r))], u), why: "A subtree sum is my value plus everything on both sides." });
    }
    stack.pop();
    b.st[u] = "done"; b.badge[u] = kind === "height" ? `h=${ret}` : `=${ret}`;
    const p = n.parent;
    const say = kind === "height"
      ? `\`height(${b.v(u)})\` returns 1 + max(${l}, ${r}) = ${ret}. Pop it off the call stack.${p < 0 ? ` That is the height of the tree. The diameter is best = ${best}.` : ""}`
      : `\`total(${b.v(u)})\` returns ${n.val} + ${l} + ${r} = ${ret}. Pop it off the call stack.${p < 0 ? ` That is the sum of the whole tree.` : ""}`;
    if (p >= 0) b.st[p] = "act";
    b.snap(b.line(kind === "height" ? "return 1 + max" : "return node.val"), say, lists(), { stats: stats(), flow: p >= 0 ? { from: u, to: p, text: String(ret) } : undefined });
    return ret;
  };
  visit(t.root);
  return { tree: t, frames: b.frames, code, title: kind === "height" ? "Day 11 · DFS returns height, keeps best" : "Day 11 · DFS returns a subtree sum" };
}

/* ---------------- BFS by levels ---------------- */

export function buildBfs(t: Tree): Run {
  const b = new TB(t, LEVELS);
  const N = t.nodes;
  const q: number[] = [];
  let row: number[] = [];
  const out: number[][] = [];
  const lists = (): List[] => [
    { name: "q", items: q.map((u, i) => ({ key: `q${u}`, t: String(N[u].val), tone: i === 0 ? "acc" : undefined })), note: "front on the left", empty: "empty" },
    { name: "row", items: row.map((u) => ({ key: `r${u}`, t: String(N[u].val), tone: "good" as Tone })), empty: "[]" },
    { name: "out", items: out.map((r, i) => ({ key: `o${i}`, t: L(r.map((u) => N[u].val)) })), empty: "[]" },
  ];
  if (t.root < 0) { b.snap(0, "The tree is empty.", lists()); return { tree: t, frames: b.frames, code: LEVELS, title: "" }; }
  q.push(t.root); b.st[t.root] = "queued";
  b.snap(b.line("out, q = "), `Start with the root in the queue: q = [${b.v(t.root)}].`, lists());
  let level = 0;
  while (q.length) {
    const k = q.length;
    b.askLast("len", { q: `The queue holds ${L(q.map((u) => N[u].val))}. How many nodes does this level pop?`, ...opts(String(k), [String(k * 2), "Until the queue is empty"], level), why: "At the start of a level, the queue holds exactly that level. len(q) is read once, before the loop adds children." });
    row = [];
    b.snap(b.line("for _ in range(len(q))"), `Level ${level} starts. len(q) = ${k}, so pop exactly ${k} node${k > 1 ? "s" : ""}. Children pushed now wait for the next level.`, lists(), { band: level, line2: b.line("row = []") });
    for (let i = 0; i < k; i++) {
      const u = q.shift()!;
      for (let j = 0; j < b.st.length; j++) if (b.st[j] === "act") b.st[j] = "done";
      b.st[u] = "act"; row.push(u);
      const kids = [N[u].left, N[u].right].filter((c) => c >= 0);
      b.snap(b.line("node = q.popleft()"), `Pop ${b.v(u)} from the front and add it to row: row = ${L(row.map((x) => N[x].val))}.${kids.length ? "" : ` It has no children.`}`, lists(), { band: level, line2: b.line("row.append") });
      if (kids.length) {
        for (const c of kids) { q.push(c); b.st[c] = "queued"; }
        b.snap(b.line("if node.left"), `Push its child${kids.length > 1 ? "ren" : ""} ${kids.map((c) => N[c].val).join(" and ")} to the back: q = ${L(q.map((x) => N[x].val))}. ${kids.length > 1 ? "They are" : "It is"} on level ${level + 1}.`, lists(), { band: level, line2: b.line("if node.right") });
      }
    }
    for (let j = 0; j < b.st.length; j++) if (b.st[j] === "act") b.st[j] = "done";
    out.push(row.slice()); row = [];
    b.snap(b.line("out.append(row)"), `Level ${level} is done. out = ${L(out.map((r) => L(r.map((x) => N[x].val))))}.`, lists(), { band: level });
    level++;
  }
  b.snap(b.line("return out"), `The queue is empty. ${out.length} level${out.length > 1 ? "s" : ""}, one row each. Every node was pushed once and popped once: O(n).`, lists());
  return { tree: t, frames: b.frames, code: LEVELS, title: "Day 11 · BFS by levels" };
}

/* ---------------- Iterative with an explicit stack ---------------- */

export function buildIter(t: Tree, kind: IterKind): Run {
  if (kind === "pre") return buildPre(t);
  if (kind === "in") return buildIn(t);
  const b = new TB(t, POST_ITER);
  const N = t.nodes;
  const stack: [number, boolean][] = [];
  const h = new Map<number, number>();
  const fmt = ([u, d]: [number, boolean]) => `(${N[u].val}, ${d ? "T" : "F"})`;
  const lists = (): List[] => [
    { name: "stack", vertical: true, empty: "empty", note: "top first", items: stack.slice().reverse().map((e, i) => ({ key: `s${e[0]}${e[1]}`, t: fmt(e), tone: i === 0 ? "acc" : e[1] ? "open" : undefined })) },
    { name: "h", items: [...h.entries()].map(([u, v]) => ({ key: `h${u}`, t: `${N[u].val}: ${v}`, tone: "good" as Tone })), empty: "{None: 0}" },
  ];
  if (t.root < 0) { b.snap(0, "The tree is empty.", lists()); return { tree: t, frames: b.frames, code: POST_ITER, title: "" }; }
  stack.push([t.root, false]); b.st[t.root] = "queued";
  b.snap(b.line("stack = [(root, False)]"), `Push (${b.v(t.root)}, F): F means "not expanded yet". The stack replaces the call stack, so depth can never crash Python.`, lists());
  let k = 0;
  while (stack.length) {
    if (stack.length > 1) {
      const top = fmt(stack[stack.length - 1]), bottom = fmt(stack[0]);
      b.askLast("pop", { q: `The stack, bottom to top, is ${stack.map(fmt).join(" ")}. Which item is popped next?`, ...opts(top, [bottom], k++), why: "A stack is last in, first out. pop() takes the item pushed most recently: the top." });
    }
    const [u, done] = stack.pop()!;
    for (let j = 0; j < b.st.length; j++) if (b.st[j] === "act") b.st[j] = b.badge[j] ? "done" : "open";
    b.st[u] = "act";
    b.snap(b.line("node, done = stack.pop()"), done ? `Pop (${b.v(u)}, T): this is the second visit. Its children are finished.` : `Pop (${b.v(u)}, F): the first visit. Expand it.`, lists());
    if (done) {
      const hl = h.get(N[u].left) ?? 0, hr = h.get(N[u].right) ?? 0;
      const val = 1 + Math.max(hl, hr);
      h.set(u, val); b.badge[u] = `h=${val}`; b.st[u] = "done";
      b.snap(b.line("h[node] = "), `h[${b.v(u)}] = 1 + max(${N[u].left >= 0 ? `h[${N[N[u].left].val}]` : "h[None]"}, ${N[u].right >= 0 ? `h[${N[N[u].right].val}]` : "h[None]"}) = 1 + max(${hl}, ${hr}) = ${val}.`, lists());
    } else {
      stack.push([u, true]);
      const kids = [N[u].left, N[u].right].filter((c) => c >= 0);
      for (const c of kids) { stack.push([c, false]); b.st[c] = "queued"; }
      b.st[u] = "open";
      b.snap(b.line("stack.append((node, True))"), `Push (${b.v(u)}, T) to come back after its children${kids.length ? `, then ${kids.map((c) => `(${N[c].val}, F)`).join(" and ")}` : ". It has no children, so it pops again right away"}.`, lists(), { line2: kids.length ? b.line("if node.left") : undefined });
    }
  }
  b.snap(b.line("return h.get"), `The stack is empty. Every node was pushed twice: once to expand it and once to finish it. Height of the tree = ${h.get(t.root)}.`, lists());
  return { tree: t, frames: b.frames, code: POST_ITER, title: "Day 11 · iterative post-order with a done flag" };
}

function buildPre(t: Tree): Run {
  const b = new TB(t, PRE_ITER);
  const N = t.nodes;
  const stack: number[] = [], out: number[] = [];
  const lists = (): List[] => [
    { name: "stack", vertical: true, empty: "empty", note: "top first", items: stack.slice().reverse().map((u, i) => ({ key: `s${u}`, t: String(N[u].val), tone: i === 0 ? "acc" : undefined })) },
    { name: "out", items: out.map((u) => ({ key: `o${u}`, t: String(N[u].val), tone: "good" as Tone })), empty: "[]" },
  ];
  if (t.root < 0) { b.snap(0, "The tree is empty.", lists()); return { tree: t, frames: b.frames, code: PRE_ITER, title: "" }; }
  stack.push(t.root); b.st[t.root] = "queued";
  b.snap(b.line("out, stack = "), `Push the root ${b.v(t.root)}.`, lists());
  let k = 0;
  while (stack.length) {
    if (stack.length > 1) b.askLast("pop", { q: `The stack, bottom to top, is ${L(stack.map((u) => N[u].val))}. Which node is popped next?`, ...opts(String(N[stack[stack.length - 1]].val), [String(N[stack[0]].val)], k++), why: "pop() takes the top: the node pushed last. That is why the left child is pushed after the right one." });
    const u = stack.pop()!;
    for (let j = 0; j < b.st.length; j++) if (b.st[j] === "act") b.st[j] = "done";
    b.st[u] = "act"; out.push(u);
    b.snap(b.line("node = stack.pop()"), `Pop ${b.v(u)} and visit it first (preorder): out = ${L(out.map((x) => N[x].val))}.`, lists(), { line2: b.line("out.append") });
    const r = N[u].right, l = N[u].left;
    if (r >= 0 || l >= 0) {
      if (r >= 0) { stack.push(r); b.st[r] = "queued"; }
      if (l >= 0) { stack.push(l); b.st[l] = "queued"; }
      b.snap(b.line("if node.right"), r >= 0 && l >= 0 ? `Push the right child ${N[r].val} first, then the left child ${N[l].val}. Left is on top, so it comes out next.` : `Push its only child ${N[r >= 0 ? r : l].val}.`, lists(), { line2: b.line("if node.left") });
    }
  }
  for (let j = 0; j < b.st.length; j++) if (b.st[j] === "act") b.st[j] = "done";
  b.snap(b.line("return out"), `Done. Preorder visits each node before its children: ${L(out.map((x) => N[x].val))}.`, lists());
  return { tree: t, frames: b.frames, code: PRE_ITER, title: "Iterative preorder with a stack" };
}

function buildIn(t: Tree): Run {
  const b = new TB(t, IN_ITER);
  const N = t.nodes;
  const stack: number[] = [], out: number[] = [];
  let node = t.root;
  const lists = (): List[] => [
    { name: "stack", vertical: true, empty: "empty", note: "top first", items: stack.slice().reverse().map((u, i) => ({ key: `s${u}`, t: String(N[u].val), tone: i === 0 ? "acc" : "open" })) },
    { name: "out", items: out.map((u) => ({ key: `o${u}`, t: String(N[u].val), tone: "good" as Tone })), empty: "[]" },
    { name: "node", items: node >= 0 ? [{ key: `n${node}`, t: String(N[node].val), tone: "acc" as Tone }] : [{ key: "none", t: "None", tone: "dim" as Tone }] },
  ];
  const mark = () => {
    for (let j = 0; j < b.st.length; j++) if (b.st[j] === "act") b.st[j] = out.includes(j) ? "done" : stack.includes(j) ? "open" : "idle";
    if (node >= 0) b.st[node] = "act";
  };
  if (t.root < 0) { b.snap(0, "The tree is empty.", lists()); return { tree: t, frames: b.frames, code: IN_ITER, title: "" }; }
  mark();
  b.snap(b.line("out, stack, node = "), `Start with node = the root ${b.v(t.root)} and an empty stack.`, lists());
  while (stack.length || node >= 0) {
    while (node >= 0) {
      const u = node;
      stack.push(u); b.st[u] = "open";
      node = N[u].left;
      mark();
      b.snap(b.line("stack.append(node)"), node >= 0 ? `Push ${N[u].val} and go left to ${N[node].val}.` : `Push ${N[u].val}. Its left child is None, so stop going left.`, lists(), { line2: b.line("node = node.left"), ghosts: node < 0 ? [{ parent: u, side: "L" }] : undefined });
    }
    if (stack.length > 1) b.askLast("pop", { q: `Nothing more to the left. Which node is popped and visited next?`, ...opts(String(N[stack[stack.length - 1]].val), [String(N[stack[0]].val)], out.length), why: "The top of the stack is the deepest node on the left edge: the smallest one not yet visited." });
    const u = stack.pop()!;
    out.push(u); node = u;
    for (let j = 0; j < b.st.length; j++) if (b.st[j] === "act") b.st[j] = out.includes(j) ? "done" : "open";
    b.st[u] = "act";
    b.snap(b.line("node = stack.pop()"), `Pop ${N[u].val} and visit it: out = ${L(out.map((x) => N[x].val))}. Its whole left side is already done.`, lists(), { line2: b.line("out.append") });
    node = N[u].right;
    b.st[u] = "done"; mark();
    b.snap(b.line("node = node.right"), node >= 0 ? `Move to its right child ${N[node].val}. Repeat: go left from there.` : `Its right child is None, so the next pop goes back up.`, lists(), { ghosts: node < 0 ? [{ parent: u, side: "R" }] : undefined });
  }
  b.snap(b.line("return out"), `Done. Inorder = left, node, right: ${L(out.map((x) => N[x].val))}. On a BST this list is sorted.`, lists());
  return { tree: t, frames: b.frames, code: IN_ITER, title: "Iterative inorder with a stack" };
}

/* ---------------- BST: search, insert, validate ---------------- */

const subtree = (t: Tree, u: number, out: number[] = []) => { if (u < 0) return out; out.push(u); subtree(t, t.nodes[u].left, out); subtree(t, t.nodes[u].right, out); return out; };

export function buildBst(t0: Tree, kind: BstKind, x: number): Run {
  if (kind === "validate") return buildValidate(t0);
  const insert = kind === "insert";
  // For insert, add the new node to the tree now (hidden until the last step) so nothing moves.
  const t: Tree = { root: t0.root, nodes: t0.nodes.map((n) => ({ ...n })) };
  let newId = -1;
  if (insert && t.root >= 0) {
    let u = t.root;
    for (;;) {
      const side = x < t.nodes[u].val ? "left" : "right";
      if (t.nodes[u][side] < 0) { newId = t.nodes.length; t.nodes.push({ id: newId, val: x, left: -1, right: -1, parent: u, depth: t.nodes[u].depth + 1 }); t.nodes[u][side] = newId; break; }
      u = t.nodes[u][side];
    }
  }
  const code = insert ? BST_INSERT : BST_SEARCH;
  const b = new TB(t, code);
  if (newId >= 0) b.st[newId] = "h";
  const N = t.nodes;
  const path: number[] = [];
  const lists = (): List[] => [{ name: "path", items: path.map((u, i) => ({ key: `p${u}`, t: String(N[u].val), tone: i === path.length - 1 ? "acc" : "open" })), empty: "[]" }];
  const stats = [{ label: "x", value: String(x) }];
  if (t.root < 0) { b.snap(0, "The tree is empty.", lists()); return { tree: t, frames: b.frames, code, title: "" }; }
  let u = t.root;
  path.push(u); b.st[u] = "act";
  b.snap(b.line(insert ? "node = root" : "while node"), `${insert ? "Insert" : "Search for"} ${x}. Start at the root ${b.v(u)}. Each comparison throws away one whole side.`, lists(), { stats });
  let step = 0;
  for (;;) {
    const v = b.v(u);
    if (!insert && x === v) {
      b.askLast("dir", { q: `x = ${x}, node = ${v}. What happens?`, options: ["Found it", "Go left", "Go right"], answer: 0 });
      b.st[u] = "good";
      b.snap(b.line("return node"), `${x} == ${v}: found it after ${path.length} comparison${path.length > 1 ? "s" : ""}, one per level. O(height), not O(n).`, lists(), { stats });
      break;
    }
    const goLeft = x < v;
    const next = goLeft ? N[u].left : N[u].right;
    const realNext = next === newId ? -1 : next;
    b.askLast("dir", { q: `x = ${x}, node = ${v}. Where does ${x} belong?`, ...opts(goLeft ? "Go left" : "Go right", [goLeft ? "Go right" : "Go left"], step++), why: goLeft ? `${x} < ${v}, and everything smaller than ${v} lives in its left subtree.` : `${x} ${x === v ? "==" : ">"} ${v}, so it goes to the right subtree${x === v && insert ? " (this code sends equal values right)" : ""}.` });
    // rule out the other side
    for (const d of subtree(t, goLeft ? N[u].right : N[u].left)) if (d !== newId) b.st[d] = "dim";
    if (realNext < 0) {
      b.st[u] = "open";
      if (insert) {
        b.st[newId] = "good";
        b.snap(b.line(goLeft ? "node.left = TreeNode(x)" : "node.right = TreeNode(x)"), `${x} ${goLeft ? "<" : "≥"} ${v} and ${v} has no ${goLeft ? "left" : "right"} child. Attach ${x} there. The BST rule still holds everywhere.`, lists(), { stats, line2: b.line(goLeft ? "if not node.left" : "if not node.right") });
        b.snap(b.line("return root"), `Done: ${path.length} comparisons to find the spot. Insert is O(height), like search.`, lists(), { stats });
      } else {
        b.snap(b.line("node = node.left if"), `${x} ${goLeft ? "<" : ">"} ${v}, so go ${goLeft ? "left" : "right"}. But there is no ${goLeft ? "left" : "right"} child.`, lists(), { stats, ghosts: [{ parent: u, side: goLeft ? "L" : "R" }] });
        b.snap(b.line("return None"), `node is None: ${x} is not in the tree. We looked at only ${path.length} node${path.length > 1 ? "s" : ""}.`, lists(), { stats, ghosts: [{ parent: u, side: goLeft ? "L" : "R" }] });
      }
      break;
    }
    b.st[u] = "open";
    path.push(realNext); b.st[realNext] = "act";
    b.snap(insert ? b.line(goLeft ? "node = node.left" : "node = node.right") : b.line("node = node.left if"), `${x} ${goLeft ? "<" : x === v ? "==" : ">"} ${v}, so ${x} can only be in the ${goLeft ? "left" : "right"} subtree. Go ${goLeft ? "left" : "right"} to ${b.v(realNext)}.`, lists(), { stats, line2: insert ? b.line(goLeft ? "if x < node.val" : "else:") : undefined });
    u = realNext;
  }
  return { tree: t, frames: b.frames, code, title: insert ? "BST insert" : "BST search" };
}

function buildValidate(t: Tree): Run {
  const b = new TB(t, BST_VALID);
  const N = t.nodes;
  const fmtB = (v: number) => (v === -Infinity ? "-inf" : v === Infinity ? "inf" : String(v));
  const stack: { id: number; lo: number; hi: number }[] = [];
  const lists = (): List[] => [{
    name: "call stack", vertical: true, empty: "empty",
    items: stack.slice().reverse().map((f, i) => ({ key: `c${f.id}`, t: `is_bst(${N[f.id].val}, ${fmtB(f.lo)}, ${fmtB(f.hi)})`, tone: i === 0 ? "acc" : "open" })),
  }];
  if (t.root < 0) { b.snap(0, "The tree is empty: it is a valid BST.", lists()); return { tree: t, frames: b.frames, code: BST_VALID, title: "" }; }
  let k = 0;
  let failed = false;
  const callLine = b.line("return (is_bst(node.left");
  const visit = (u: number, lo: number, hi: number): boolean => {
    const v = b.v(u);
    b.badge[u] = `(${fmtB(lo)}, ${fmtB(hi)})`;
    const ok = lo < v && v < hi;
    b.askLast("in", { q: `Node ${v} must be inside (${fmtB(lo)}, ${fmtB(hi)}). Is it?`, ...opts(ok ? "Yes" : "No", [ok ? "No" : "Yes"], k++), why: ok ? `${fmtB(lo)} < ${v} < ${fmtB(hi)}.` : `${v} is ${v <= lo ? `not greater than ${fmtB(lo)}` : `not less than ${fmtB(hi)}`}. The bound came from an ancestor, not from the parent alone.` });
    if (!ok) {
      b.st[u] = "bad";
      b.snap(b.line("return False"), `${v} is not inside (${fmtB(lo)}, ${fmtB(hi)}): return False. ${v} sits on the correct side of its parent, but it breaks an ancestor's rule.`, lists(), { line2: b.line("if not (low") });
      failed = true;
      return false;
    }
    b.snap(b.line("if not (low"), `${fmtB(lo)} < ${v} < ${fmtB(hi)}: OK. Its left side must be < ${v}, its right side > ${v}.`, lists());
    const n = N[u];
    const kid = (c: number, side: "L" | "R", clo: number, chi: number): boolean => {
      if (c < 0) return true;
      b.st[u] = "open";
      stack.push({ id: c, lo: clo, hi: chi }); b.st[c] = "act";
      b.snap(callLine, `Call \`is_bst(${b.v(c)}, ${fmtB(clo)}, ${fmtB(chi)})\`: the ${side === "L" ? "left" : "right"} child gets ${side === "L" ? `high = ${v}` : `low = ${v}`}, and keeps the other bound from above.`, lists(), { line2: side === "R" ? b.line("is_bst(node.right") : undefined });
      const r = visit(c, clo, chi);
      stack.pop();
      if (r) b.st[u] = "act";
      return r;
    };
    if (n.left < 0 && n.right < 0) {
      b.snap(b.line("return True"), `${v} is a leaf. Both children are None, and \`is_bst(None)\` returns True.`, lists(), { ghosts: [{ parent: u, side: "L" }, { parent: u, side: "R" }], line2: b.line("if not node") });
    }
    if (!kid(n.left, "L", lo, v)) {
      b.st[u] = "bad";
      b.snap(callLine, `The left side returned False, so \`is_bst(${v})\` returns False too.`, lists(), { flow: { from: n.left, to: u, text: "False" } });
      return false;
    }
    if (!kid(n.right, "R", v, hi)) {
      b.st[u] = "bad";
      b.snap(callLine, `The right side returned False, so \`is_bst(${v})\` returns False too.`, lists(), { flow: { from: n.right, to: u, text: "False" } });
      return false;
    }
    b.st[u] = "good";
    if (n.parent >= 0) {
      b.snap(callLine, `Both sides of ${v} are valid: return True.`, lists(), { flow: { from: u, to: n.parent, text: "True" } });
    }
    return true;
  };
  stack.push({ id: t.root, lo: -Infinity, hi: Infinity }); b.st[t.root] = "act";
  b.snap(b.line("def is_bst"), `Call \`is_bst(${b.v(t.root)}, -inf, inf)\`. The root can hold any value.`, lists());
  const ok = visit(t.root, -Infinity, Infinity);
  stack.length = 0;
  b.snap(ok ? callLine : b.line("return False"), ok ? `Every node is inside its bounds: this is a valid BST.` : `False reached the root: this is not a BST.`, lists());
  void failed;
  return { tree: t, frames: b.frames, code: BST_VALID, title: "Validate a BST with (low, high) bounds" };
}
