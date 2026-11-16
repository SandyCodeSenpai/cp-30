/** Binary tree model: LeetCode level-order parsing, layout by in-order rank, and small helpers. */

export interface TNode { id: number; val: number; left: number; right: number; parent: number; depth: number }
export interface Tree { nodes: TNode[]; root: number }

export const MAX_NODES = 15;
export const MAX_DEPTH = 4; // root depth 0 → at most 5 levels

/** LeetCode style: each non-null node takes the next two entries as its children. */
export function fromLevel(arr: (number | null)[]): Tree {
  const nodes: TNode[] = [];
  if (!arr.length || arr[0] === null || arr[0] === undefined) return { nodes, root: -1 };
  const mk = (val: number, parent: number, depth: number) => { nodes.push({ id: nodes.length, val, left: -1, right: -1, parent, depth }); return nodes.length - 1; };
  const root = mk(arr[0] as number, -1, 0);
  const q = [root];
  let i = 1;
  while (q.length && i < arr.length) {
    const u = q.shift()!;
    const a = arr[i++];
    if (a !== null && a !== undefined) { nodes[u].left = mk(a, u, nodes[u].depth + 1); q.push(nodes[u].left); }
    if (i >= arr.length) break;
    const b = arr[i++];
    if (b !== null && b !== undefined) { nodes[u].right = mk(b, u, nodes[u].depth + 1); q.push(nodes[u].right); }
  }
  return { nodes, root };
}

/** Back to level order with trailing nulls trimmed. */
export function toLevel(t: Tree): (number | null)[] {
  if (t.root < 0) return [];
  const out: (number | null)[] = [];
  const q: number[] = [t.root];
  while (q.length) {
    const u = q.shift()!;
    if (u < 0) { out.push(null); continue; }
    out.push(t.nodes[u].val);
    q.push(t.nodes[u].left, t.nodes[u].right);
  }
  while (out.length && out[out.length - 1] === null) out.pop();
  return out;
}

export function parseTree(s: string): (number | null)[] | string {
  const parts = s.replace(/[[\]]/g, "").split(/[\s,]+/).filter(Boolean);
  if (!parts.length) return "Enter at least one value.";
  const arr: (number | null)[] = [];
  for (const p of parts) {
    if (/^(null|none|-)$/i.test(p)) { arr.push(null); continue; }
    if (!/^-?\d+$/.test(p)) return `"${p}" is not a whole number or null.`;
    const v = Number(p);
    if (v < -99 || v > 99) return "Keep values between -99 and 99.";
    arr.push(v);
  }
  if (arr[0] === null) return "The root cannot be null.";
  const t = fromLevel(arr);
  if (t.nodes.length > MAX_NODES) return `Use at most ${MAX_NODES} nodes so the tree fits.`;
  if (t.nodes.some((n) => n.depth > MAX_DEPTH)) return `Keep the tree to ${MAX_DEPTH + 1} levels.`;
  return arr;
}

/** x = in-order rank, so no two nodes share a column and parents sit between their subtrees. */
export function inorderRank(t: Tree): number[] {
  const rank = new Array<number>(t.nodes.length).fill(0);
  let k = 0;
  const go = (u: number) => { if (u < 0) return; go(t.nodes[u].left); rank[u] = k++; go(t.nodes[u].right); };
  go(t.root);
  return rank;
}

export const height = (t: Tree, u: number): number => (u < 0 ? 0 : 1 + Math.max(height(t, t.nodes[u].left), height(t, t.nodes[u].right)));

/** A random tree shape with distinct small values. */
export function randomTree(rand: () => number, count: number): (number | null)[] {
  const vals = Array.from({ length: 20 }, (_, i) => i + 1).sort(() => rand() - 0.5).slice(0, count);
  const nodes: TNode[] = [{ id: 0, val: vals[0], left: -1, right: -1, parent: -1, depth: 0 }];
  for (let i = 1; i < count; i++) {
    for (let tries = 0; tries < 50; tries++) {
      const p = nodes[Math.floor(rand() * nodes.length)];
      if (p.depth >= 3) continue;
      const side = rand() < 0.5 ? "left" : "right";
      if (p[side] >= 0) continue;
      nodes.push({ id: nodes.length, val: vals[i], left: -1, right: -1, parent: p.id, depth: p.depth + 1 });
      p[side] = nodes.length - 1;
      break;
    }
  }
  return toLevel({ nodes, root: 0 });
}

/** A random BST built by inserting distinct values. */
export function randomBst(rand: () => number, count: number): (number | null)[] {
  for (let attempt = 0; attempt < 40; attempt++) {
    const vals = Array.from({ length: 30 }, (_, i) => i + 1).sort(() => rand() - 0.5).slice(0, count);
    const t = bstFrom(vals);
    if (t.nodes.every((n) => n.depth <= 3)) return toLevel(t);
  }
  return [8, 3, 10, 1, 6, null, 14, null, null, 4, 7, 13];
}

export function bstFrom(vals: number[]): Tree {
  const nodes: TNode[] = [];
  for (const v of vals) {
    if (!nodes.length) { nodes.push({ id: 0, val: v, left: -1, right: -1, parent: -1, depth: 0 }); continue; }
    let u = 0;
    for (;;) {
      const side = v < nodes[u].val ? "left" : "right";
      if (nodes[u][side] < 0) { nodes.push({ id: nodes.length, val: v, left: -1, right: -1, parent: u, depth: nodes[u].depth + 1 }); nodes[u][side] = nodes.length - 1; break; }
      u = nodes[u][side];
    }
  }
  return { nodes, root: nodes.length ? 0 : -1 };
}
