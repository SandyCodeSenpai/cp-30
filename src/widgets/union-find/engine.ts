/**
 * Pure frame builders for the union-find lab. Input in, frames out.
 * Each frame is a full snapshot (parent, size, highlights, code line, narration).
 */
import type { Ask, BaseFrame } from "./kit/player";
import { B, C, L } from "./code";

export type UFMode = "basic" | "optimized" | "components";
export type Op = { kind: "union"; a: number; b: number } | { kind: "find"; x: number };
export type EdgeStatus = "pending" | "merged" | "cycle";

export interface UFFrame extends BaseFrame {
  parent: number[]; size: number[]; groups: number;
  /** nodes on the find path being walked */
  path: number[];
  /** the walker (x or root) right now */
  cur?: number;
  /** roots found by find(a), find(b) */
  roots: number[];
  /** parent entries that changed in this frame (they animate) */
  changed: number[];
  /** components mode: edges seen so far */
  edges: { a: number; b: number; status: EdgeStatus }[];
  /** index of the op (or edge) this frame belongs to; -1 = start */
  op: number;
  /** tallest tree if the same ops ran on the plain DSU (optimized mode compare) */
  naiveHeight: number;
  tone?: "good" | "bad" | "warn";
}

export const opLabel = (o: Op) => (o.kind === "union" ? `union(${o.a}, ${o.b})` : `find(${o.x})`);

export function depths(parent: number[]): number[] {
  return parent.map((_, i) => { let d = 0, x = i; while (parent[x] !== x && d <= parent.length) { x = parent[x]; d++; } return d; });
}
export const height = (parent: number[]) => Math.max(0, ...depths(parent));

const walk = (parent: number[], x: number) => { const p = [x]; while (parent[p[p.length - 1]] !== p[p.length - 1]) p.push(parent[p[p.length - 1]]); return p; };
const arrow = (p: number[]) => p.join(" → ");
const uniq = (xs: string[]) => [...new Set(xs)];

/* -------------------- basic + optimized -------------------- */

export function buildOps(mode: "basic" | "optimized", n: number, ops: Op[]): UFFrame[] {
  const opt = mode === "optimized";
  const parent = Array.from({ length: n }, (_, i) => i);
  const size = Array(n).fill(1) as number[];
  const naive = Array.from({ length: n }, (_, i) => i);
  let groups = n;
  let op = -1;
  const frames: UFFrame[] = [];
  const push = (f: Partial<UFFrame> & { line: number; say: string }) => frames.push({
    parent: [...parent], size: [...size], groups, path: [], roots: [], changed: [], edges: [], op, naiveHeight: height(naive), ...f,
  });

  push({ line: opt ? L.init : B.init, line2: opt ? 3 : undefined, say: `Start: \`parent[i] = i\`. Every node is its own root, so there are ${n} groups of one.` });

  // find with full line-by-line frames (a standalone find op)
  const findDetailed = (x: number) => {
    const p = walk(parent, x), r = p[p.length - 1];
    const others = uniq([String(r), String(x), String(parent[x])]).slice(0, 3);
    const ask: Ask = { q: `Where does \`find(${x})\` stop?`, options: others.map((o) => `at node ${o}`), answer: 0, why: `It follows parent links up until \`parent[r] == r\`. That node is ${r}.` };
    if (opt) {
      push({ line: L.findStart, say: `\`find(${x})\`: start with \`root = ${x}\`.`, path: [x], cur: x, ask: p.length > 1 ? ask : undefined });
      for (let i = 1; i < p.length; i++) push({ line: L.findUp, line2: L.findLoop, say: `\`parent[${p[i - 1]}] = ${p[i]}\`, not ${p[i - 1]} itself, so move up: \`root = ${p[i]}\`.`, path: p.slice(0, i + 1), cur: p[i] });
      push({ line: L.findLoop, say: `\`parent[${r}] == ${r}\`, so ${r} is the root.${p.length > 1 ? ` The walk was ${arrow(p)}.` : ""}`, path: p, cur: r, roots: [r] });
      const toFix = p.slice(0, -2);
      if (toFix.length === 0) push({ line: L.compLoop, say: p.length > 1 ? `${x} already points at the root. Nothing to compress.` : `${x} is the root. Nothing to compress.`, path: p, cur: r, roots: [r] });
      else {
        push({ line: L.compLoop, say: `Second pass: path compression. Walk ${arrow(p.slice(0, -1))} again and point each node straight at ${r}.`, path: p, cur: x, roots: [r] });
        for (const y of toFix) {
          const old = parent[y]; parent[y] = r;
          push({ line: L.compSet, say: `\`parent[${y}] = ${r}\` (it was ${old}). ${y} now sits one step below the root.`, path: p, cur: y, roots: [r], changed: [y] });
        }
      }
      push({ line: L.findRet, say: `Return ${r}.${toFix.length ? ` The chain is flat now: the next \`find(${x})\` takes one step.` : ""}`, path: toFix.length ? [x, r] : p, roots: [r], tone: "good" });
    } else {
      push({ line: B.findLoop, say: `\`find(${x})\`: is \`parent[${x}] == ${x}\`?${p.length > 1 ? ` No, it is ${parent[x]}.` : " Yes."}`, path: [x], cur: x, ask: p.length > 1 ? ask : undefined });
      for (let i = 1; i < p.length; i++) push({ line: B.findUp, line2: B.findLoop, say: `Move up: \`x = parent[${p[i - 1]}] = ${p[i]}\`.${i === p.length - 1 ? "" : ` Still not a root.`}`, path: p.slice(0, i + 1), cur: p[i] });
      push({ line: B.findRet, say: `\`parent[${r}] == ${r}\`, so return ${r}. That took ${p.length - 1} step${p.length === 2 ? "" : "s"}${p.length > 3 ? ": a tall tree makes every find slow" : ""}.`, path: p, cur: r, roots: [r], tone: "good" });
    }
    return r;
  };

  // find condensed into one or two frames (inside union)
  const findQuick = (x: number, roots: number[]) => {
    const p = walk(parent, x), r = p[p.length - 1];
    const line = opt ? L.uFind : B.uFind;
    push({ line, say: p.length > 1 ? `\`find(${x})\` walks ${arrow(p)}. Root is ${r}.` : `\`find(${x})\`: ${x} is already a root.`, path: p, cur: r, roots: [...roots, r] });
    if (opt && p.length > 2) {
      const toFix = p.slice(0, -2);
      for (const y of toFix) parent[y] = r;
      push({ line, line2: L.compSet, say: `Path compression: ${toFix.join(", ")} now point${toFix.length === 1 ? "s" : ""} straight at ${r}.`, path: [...toFix, r], roots: [...roots, r], changed: toFix });
    }
    return r;
  };

  const naiveUnion = (a: number, b: number) => { const ra = walk(naive, a).pop()!, rb = walk(naive, b).pop()!; if (ra !== rb) naive[rb] = ra; };

  ops.forEach((o, k) => {
    op = k;
    if (o.kind === "find") { findDetailed(o.x); return; }
    const { a, b } = o;
    const ra = findQuick(a, []);
    const rb = findQuick(b, [ra]);
    naiveUnion(a, b);
    if (ra === rb) {
      push({ line: opt ? L.uSame : B.uSame, say: `Both roots are ${ra}. ${a} and ${b} are already in the same group.`, roots: [ra] });
      push({ line: opt ? L.uFalse : B.uFalse, say: `Return False. Nothing changes.`, roots: [ra], tone: "warn" });
      return;
    }
    let big = ra, small = rb;
    if (opt) {
      const swap = size[ra] < size[rb];
      if (swap) { big = rb; small = ra; }
      push({
        line: L.uCmp, say: `Compare sizes: \`size[${ra}] = ${size[ra]}\`, \`size[${rb}] = ${size[rb]}\`.`, roots: [ra, rb],
        ask: { q: `Which root goes under the other?`, options: [`${rb} goes under ${ra}`, `${ra} goes under ${rb}`], answer: swap ? 1 : 0, why: `The smaller tree goes under the bigger one, so trees stay shallow. Ties keep \`a\` on top.` },
      });
      if (swap) push({ line: L.uSwap, say: `${ra}'s tree is smaller, so swap: now \`a = ${rb}\` (bigger) and \`b = ${ra}\`.`, roots: [rb, ra] });
    } else {
      push({
        line: B.uSame, say: `Roots ${ra} and ${rb} differ, so we merge.`, roots: [ra, rb],
        ask: { q: `Which root becomes the parent?`, options: [`${ra}`, `${rb}`], answer: 0, why: `The plain version always does \`parent[b] = a\`. It never checks which tree is bigger.` },
      });
    }
    parent[small] = big;
    groups--;
    push({ line: opt ? L.uAttach : B.uAttach, say: `\`parent[${small}] = ${big}\`: the whole tree of ${small} now hangs under ${big}.`, roots: [big], changed: [small], cur: small });
    if (opt) {
      const s0 = size[big]; size[big] += size[small];
      push({ line: L.uSize, say: `\`size[${big}]\` grows from ${s0} to ${size[big]}.`, roots: [big] });
      push({ line: L.uGroups, line2: L.uTrue, say: `\`groups\` drops to ${groups}. Return True.`, roots: [big], tone: "good" });
    } else {
      push({ line: B.uTrue, say: `Return True. ${groups} group${groups === 1 ? "" : "s"} left. Tallest tree: ${height(parent)}.`, roots: [big], tone: "good" });
    }
  });

  op = ops.length;
  const h = height(parent);
  push({
    line: -1, say: opt
      ? `Done. ${groups} group${groups === 1 ? "" : "s"}, tallest tree ${h}. The plain version on the same unions would be ${height(naive)} tall.`
      : `Done. ${groups} group${groups === 1 ? "" : "s"}. Tallest tree: ${h}. Click two nodes to union them, or switch to Optimized.`,
  });
  return frames;
}

/* -------------------- components -------------------- */

export function buildComponents(n: number, edges: [number, number][]): UFFrame[] {
  const parent = Array.from({ length: n }, (_, i) => i);
  const size = Array(n).fill(1) as number[];
  let groups = n, op = -1;
  const seen: UFFrame["edges"] = [];
  const frames: UFFrame[] = [];
  const push = (f: Partial<UFFrame> & { line: number; say: string }) => frames.push({
    parent: [...parent], size: [...size], groups, path: [], roots: [], changed: [], edges: seen.map((e) => ({ ...e })), op, naiveHeight: 0, ...f,
  });
  const find = (x: number) => { const p = walk(parent, x), r = p[p.length - 1]; const fixed = p.slice(0, -2); for (const y of fixed) parent[y] = r; return { r, p, fixed }; };

  push({ line: C.init, say: `${n} nodes and no edges yet, so there are ${n} groups.` });
  const cycles: string[] = [];
  edges.forEach(([a, b], k) => {
    op = k;
    seen.push({ a, b, status: "pending" });
    const pa = walk(parent, a).pop()!, pb = walk(parent, b).pop()!;
    push({
      line: C.loop, say: `Edge ${a}–${b} arrives.`, path: [a, b],
      ask: { q: `Edge ${a}–${b}: what will \`union(${a}, ${b})\` do?`, options: ["Merge two groups", "Return False: cycle"], answer: pa === pb ? 1 : 0, why: pa === pb ? `${a} and ${b} already have the same root, ${pa}.` : `Their roots differ (${pa} and ${pb}), so the groups merge.` },
    });
    const fa = find(a), fb = find(b);
    const changed = [...fa.fixed, ...fb.fixed];
    push({ line: C.union, say: `\`find(${a}) = ${fa.r}\`, \`find(${b}) = ${fb.r}\`.${fa.r === fb.r ? " Same root." : " Different roots."}`, path: uniq([...fa.p, ...fb.p].map(String)).map(Number), roots: uniq([String(fa.r), String(fb.r)]).map(Number), changed });
    if (fa.r === fb.r) {
      seen[k].status = "cycle"; cycles.push(`${a}–${b}`);
      push({ line: C.cycle, say: `${a} and ${b} were already connected, so this edge closes a cycle. \`union\` returns False.`, roots: [fa.r], path: [a, b], tone: "bad" });
    } else {
      let big = fa.r, small = fb.r;
      if (size[big] < size[small]) [big, small] = [small, big];
      parent[small] = big; size[big] += size[small]; groups--;
      seen[k].status = "merged";
      push({ line: C.merged, say: `Merge: ${small} goes under ${big} (the bigger tree). \`groups = ${groups}\`.`, roots: [big], changed: [small], cur: small, tone: "good" });
    }
  });
  op = edges.length;
  push({
    line: -1, tone: cycles.length ? "bad" : "good",
    say: `All edges done: ${groups} group${groups === 1 ? "" : "s"}. ${cycles.length ? `Cycle edge${cycles.length > 1 ? "s" : ""}: ${cycles.join(", ")}. The first one is the answer to "Redundant Connection".` : "No edge closed a cycle, so the graph is a forest."}`,
  });
  return frames;
}

/* -------------------- input parsing -------------------- */

export function parseOps(s: string, n: number): Op[] | string {
  const parts = s.split(/[,;\n]+/).map((x) => x.trim()).filter(Boolean);
  if (parts.length < 1 || parts.length > 20) return "Enter 1 to 20 operations, separated by commas.";
  const out: Op[] = [];
  for (const p of parts) {
    let m = p.match(/^(?:f|find)\s*\(?\s*(\d+)\s*\)?$/i);
    if (m) { const x = Number(m[1]); if (x >= n) return `Node ${x} is out of range (0 to ${n - 1}).`; out.push({ kind: "find", x }); continue; }
    m = p.match(/^(?:u|union)?\s*\(?\s*(\d+)\s*(?:-|\s|,)\s*(\d+)\s*\)?$/i);
    if (!m) return `"${p}" is not an operation. Write "1-0" for union(1, 0) or "find 3".`;
    const a = Number(m[1]), b = Number(m[2]);
    if (a >= n || b >= n) return `Node ${Math.max(a, b)} is out of range (0 to ${n - 1}).`;
    out.push({ kind: "union", a, b });
  }
  return out;
}
export const opsStr = (ops: Op[]) => ops.map((o) => (o.kind === "union" ? `${o.a}-${o.b}` : `find ${o.x}`)).join(", ");

export function parseEdges(s: string, n: number): [number, number][] | string {
  const parts = s.split(/[,;\n]+/).map((x) => x.trim()).filter(Boolean);
  if (parts.length < 1 || parts.length > 20) return "Enter 1 to 20 edges, separated by commas.";
  const out: [number, number][] = [];
  for (const p of parts) {
    const m = p.match(/^\(?\s*(\d+)\s*(?:-|\s)\s*(\d+)\s*\)?$/);
    if (!m) return `"${p}" is not an edge. Write it like "0-1".`;
    const a = Number(m[1]), b = Number(m[2]);
    if (a >= n || b >= n) return `Node ${Math.max(a, b)} is out of range (0 to ${n - 1}).`;
    if (a === b) return `Edge ${a}-${b} is a self-loop. Use two different nodes.`;
    out.push([a, b]);
  }
  return out;
}
export const edgesStr = (e: [number, number][]) => e.map(([a, b]) => `${a}-${b}`).join(", ");

export function parseN(s: string): number | string {
  if (!/^\d+$/.test(s.trim())) return "n must be a whole number.";
  const n = Number(s); if (n < 4 || n > 12) return "n must be between 4 and 12."; return n;
}
