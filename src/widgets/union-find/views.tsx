/** SVG views for the union-find lab: the forest (parent pointers) and the graph (edges arriving, groups as islands). */
import { type KeyboardEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { springs } from "@/ui";
import { useReducedMotion } from "@/lib/hooks";
import type { UFFrame } from "./engine";

const R = 19;

interface Pos { x: number; y: number }

/** Tidy forest layout in real pixels. Trees are packed into rows that fit the width. */
export function forestLayout(parent: number[], W: number): { pos: Pos[]; height: number } {
  const n = parent.length;
  const kids: number[][] = Array.from({ length: n }, () => []);
  const roots: number[] = [];
  parent.forEach((p, i) => (p === i ? roots.push(i) : kids[p].push(i)));
  const leaves = (v: number): number => (kids[v].length ? kids[v].reduce((s, c) => s + leaves(c), 0) : 1);
  const depthOf = (v: number): number => (kids[v].length ? 1 + Math.max(...kids[v].map(depthOf)) : 0);
  const S = 50, H = 64, TOP = 30, GAP = 26, pad = 10;
  const avail = Math.max(120, W - 2 * pad);
  const cap = Math.max(1, Math.floor(avail / S));
  const rows: number[][] = [];
  let cur: number[] = [], used = 0;
  for (const r of roots) {
    const w = leaves(r);
    if (cur.length && used + w > cap) { rows.push(cur); cur = []; used = 0; }
    cur.push(r); used += w;
  }
  if (cur.length) rows.push(cur);
  const pos: Pos[] = Array.from({ length: n }, () => ({ x: 0, y: 0 }));
  let top = TOP;
  for (const row of rows) {
    const slots = row.reduce((s, r) => s + leaves(r), 0);
    const s = Math.min(S, avail / slots);
    const stagger = s < 2 * R + 8;
    const x0 = (W - slots * s) / 2 + s / 2;
    let slot = 0, maxD = 0;
    const place = (v: number, d: number): number => {
      maxD = Math.max(maxD, d + (stagger ? 0.5 : 0));
      if (!kids[v].length) { const x = x0 + slot * s; pos[v] = { x, y: top + d * H + (stagger && slot % 2 ? H * 0.5 : 0) }; slot++; return x; }
      const xs = kids[v].map((c) => place(c, d + 1));
      const x = (xs[0] + xs[xs.length - 1]) / 2; pos[v] = { x, y: top + d * H }; return x;
    };
    for (const r of row) { place(r, 0); maxD = Math.max(maxD, depthOf(r)); }
    top += maxD * H + 2 * R + GAP;
  }
  return { pos, height: Math.max(top - GAP + 8, 120) };
}

/** Points on a circle, for the graph view. */
export function circleLayout(n: number, W: number): { pos: Pos[]; height: number } {
  const rad = Math.max(90, Math.min(W / 2 - 34, 150));
  const cx = W / 2, cy = rad + 34;
  const pos = Array.from({ length: n }, (_, i) => {
    const t = -Math.PI / 2 + (2 * Math.PI * i) / n;
    return { x: cx + rad * Math.cos(t), y: cy + rad * Math.sin(t) };
  });
  return { pos, height: 2 * rad + 68 };
}

const rootOf = (parent: number[], x: number) => { let g = 0; while (parent[x] !== x && g++ < 64) x = parent[x]; return x; };

function nodeKey(e: KeyboardEvent, f: () => void) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); f(); } }

/** Child-to-parent arrow, shortened to the circle borders. Returns [line d, head d]. */
function arrowPath(a: Pos, b: Pos): [string, string] {
  const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len;
  const sx = a.x + ux * (R + 2), sy = a.y + uy * (R + 2);
  const ex = b.x - ux * (R + 3), ey = b.y - uy * (R + 3);
  const bx = ex - ux * 8, by = ey - uy * 8, px = -uy * 4.5, py = ux * 4.5;
  const f = (v: number) => v.toFixed(1);
  return [`M${f(sx)} ${f(sy)} L${f(bx)} ${f(by)}`, `M${f(ex)} ${f(ey)} L${f(bx + px)} ${f(by + py)} L${f(bx - px)} ${f(by - py)} Z`];
}

export interface NodeViewProps {
  frame: UFFrame; width: number; showSize: boolean; selected: number | null; onNode?: (v: number) => void; clickHint: string;
}

export function ForestView({ frame, width, showSize, selected, onNode, clickHint }: NodeViewProps) {
  const reduce = useReducedMotion();
  const { parent, size } = frame;
  const { pos, height } = forestLayout(parent, width);
  const tr = reduce ? { duration: 0.15 } : springs.smooth;
  const pathEdge = new Set<number>();
  for (let i = 0; i + 1 < frame.path.length; i++) if (parent[frame.path[i]] === frame.path[i + 1]) pathEdge.add(frame.path[i]);
  const n = parent.length;
  return (
    <svg className="kx-svg uf-svg" viewBox={`0 0 ${width} ${height}`} width={width} height={height}
      role="img" aria-label={`Union-find forest. ${parent.map((p, i) => (p === i ? `${i} is a root` : `${i} points to ${p}`)).join(". ")}.`}>
      <AnimatePresence initial={false}>
        {parent.map((p, i) => {
          if (p === i) return null;
          const [d, head] = arrowPath(pos[i], pos[p]);
          const cls = frame.changed.includes(i) ? " is-new" : pathEdge.has(i) ? " is-path" : "";
          return (
            <motion.g key={`e${i}`} className={`uf-edge${cls}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <motion.path className="uf-edge-line" initial={false} animate={{ d }} transition={tr} />
              <motion.path className="uf-edge-head" initial={false} animate={{ d: head }} transition={tr} />
            </motion.g>
          );
        })}
      </AnimatePresence>
      {Array.from({ length: n }, (_, v) => {
        const isRoot = parent[v] === v;
        const st = nodeState(frame, v, selected);
        return (
          <motion.g key={`n${v}`} className={`uf-node${st}${isRoot ? " is-root" : ""}${onNode ? " clickable" : ""}`} initial={false} animate={{ x: pos[v].x, y: pos[v].y }} transition={tr}
            role={onNode ? "button" : undefined} tabIndex={onNode ? 0 : undefined} aria-label={onNode ? `Node ${v}. ${clickHint}` : undefined}
            aria-pressed={onNode ? selected === v : undefined}
            onClick={onNode ? () => onNode(v) : undefined} onKeyDown={onNode ? (e) => nodeKey(e, () => onNode(v)) : undefined}>
            <circle className="uf-hit" r={24} />
            {frame.changed.includes(v) && !reduce && <motion.circle key={`p${frame.op}-${frame.line}`} className="uf-pulse" r={R} initial={{ scale: 1, opacity: 0.55 }} animate={{ scale: 1.7, opacity: 0 }} transition={{ duration: 0.7, ease: "easeOut" }} />}
            <circle className="uf-ring" r={R + 5} />
            <circle className="uf-body" r={R} />
            <text className="uf-label" dy="0.35em" textAnchor="middle">{v}</text>
            {showSize && isRoot && size[v] > 1 && (
              <g className="uf-badge" transform={`translate(${R * 0.72}, ${-R * 0.95})`}>
                <rect x={-2} y={-9} width={size[v] >= 10 ? 34 : 28} height={18} rx={9} />
                <text x={size[v] >= 10 ? 15 : 12} dy="0.35em" textAnchor="middle">×{size[v]}</text>
              </g>
            )}
          </motion.g>
        );
      })}
    </svg>
  );
}

function nodeState(f: UFFrame, v: number, selected: number | null): string {
  let s = "";
  if (f.cur === v) s += " is-cur";
  else if (f.roots.includes(v)) s += " is-found";
  else if (f.path.includes(v)) s += " is-path";
  if (f.changed.includes(v)) s += " is-changed";
  if (selected === v) s += " is-sel";
  return s;
}

/** Graph view: nodes on a circle, edges as they arrive. Connected groups sit on soft "islands". */
export function GraphView({ frame, width, selected, onNode, clickHint }: NodeViewProps) {
  const reduce = useReducedMotion();
  const { parent } = frame;
  const n = parent.length;
  const { pos, height } = circleLayout(n, width);
  const hotRoot = frame.roots.length ? rootOf(parent, frame.roots[0]) : -1;
  const groupOf = parent.map((_, v) => rootOf(parent, v));
  const islandW = 2 * R + 18;
  return (
    <svg className="kx-svg uf-svg" viewBox={`0 0 ${width} ${height}`} width={width} height={height}
      role="img" aria-label={`Graph with ${n} nodes and ${frame.edges.length} edges. Groups: ${[...new Set(groupOf)].map((r) => groupOf.map((g, v) => (g === r ? v : -1)).filter((v) => v >= 0).join(" ")).join("; ")}.`}>
      <g className="uf-islands">
        {groupOf.map((g, v) => <motion.circle key={`i${v}`} className={`uf-island${g === hotRoot ? " hot" : ""}`} cx={pos[v].x} cy={pos[v].y} initial={false} animate={{ r: islandW / 2 }} />)}
        {frame.edges.map((e, k) => e.status === "pending" ? null : (
          <motion.line key={`il${k}`} className={`uf-island-line${groupOf[e.a] === hotRoot ? " hot" : ""}`} x1={pos[e.a].x} y1={pos[e.a].y} x2={pos[e.b].x} y2={pos[e.b].y}
            strokeWidth={islandW} initial={reduce ? { opacity: 0 } : { pathLength: 0 }} animate={reduce ? { opacity: 1 } : { pathLength: 1 }} transition={{ duration: reduce ? 0.15 : 0.45, ease: "easeOut" }} />
        ))}
      </g>
      {frame.edges.map((e, k) => (
        <motion.line key={`g${k}`} className={`uf-gedge s-${e.status}`} x1={pos[e.a].x} y1={pos[e.a].y} x2={pos[e.b].x} y2={pos[e.b].y}
          initial={reduce ? { opacity: 0 } : { pathLength: 0, opacity: 0 }} animate={reduce ? { opacity: 1 } : { pathLength: 1, opacity: 1 }} transition={{ duration: reduce ? 0.15 : 0.4 }} />
      ))}
      {Array.from({ length: n }, (_, v) => {
        const st = nodeState(frame, v, selected);
        const bad = frame.tone === "bad" && frame.line === 6 && frame.path.includes(v);
        return (
          <g key={`n${v}`} className={`uf-node${st}${parent[v] === v ? " is-root" : ""}${bad ? " is-bad" : ""}${onNode ? " clickable" : ""}`} transform={`translate(${pos[v].x}, ${pos[v].y})`}
            role={onNode ? "button" : undefined} tabIndex={onNode ? 0 : undefined} aria-label={onNode ? `Node ${v}. ${clickHint}` : undefined} aria-pressed={onNode ? selected === v : undefined}
            onClick={onNode ? () => onNode(v) : undefined} onKeyDown={onNode ? (e) => nodeKey(e, () => onNode(v)) : undefined}>
            <circle className="uf-hit" r={24} />
            {frame.changed.includes(v) && !reduce && <motion.circle key={`p${frame.op}-${frame.line}`} className="uf-pulse" r={R} initial={{ scale: 1, opacity: 0.55 }} animate={{ scale: 1.7, opacity: 0 }} transition={{ duration: 0.7, ease: "easeOut" }} />}
            <circle className="uf-ring" r={R + 5} />
            <circle className="uf-body" r={R} />
            <text className="uf-label" dy="0.35em" textAnchor="middle">{v}</text>
          </g>
        );
      })}
    </svg>
  );
}
