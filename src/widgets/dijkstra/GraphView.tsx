import { useId, useRef, type KeyboardEvent } from "react";
import { motion } from "framer-motion";
import { useWidth } from "@/lib/hooks";
import type { Graph } from "./graph";
import type { DFrame } from "./engine";
import type { DMode } from "./graph";

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const fmtD = (d: number | undefined) => (d === undefined ? "" : d === Infinity ? "∞" : String(d));

/** Hand-placed graph drawn at true pixel size (so text never shrinks below 12px). */
export function GraphView({ g, f, mode, selected, onSelectEdge, onPickSource, reduce }: {
  g: Graph; f: DFrame; mode: DMode; selected: number | null; onSelectEdge?: (i: number) => void; onPickSource?: (v: number) => void; reduce: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const uid = useId().replace(/:/g, "");
  const W = Math.max(300, Math.round(useWidth(ref) || 600));
  const narrow = W < 480;
  const R = narrow ? 17 : 21;
  const H = Math.round(clamp(W * 0.46, 250, 330));
  const padX = R + 6, padY = R + 26;
  const X = (i: number) => padX + g.pos[i].x * (W - 2 * padX);
  const Y = (i: number) => padY + g.pos[i].y * (H - 2 * padY);
  const isMst = mode === "mst";
  const showDist = !isMst;

  const treeEdges = new Set<number>();
  if (isMst) g.edges.forEach((_, i) => { if (f.take[i]) treeEdges.add(i); });
  else if (f.tree) f.parentEdge.forEach((e) => { if (e >= 0) treeEdges.add(e); });
  const hasRev = (u: number, v: number) => g.directed && g.edges.some((e) => e.u === v && e.v === u);

  const edges = g.edges.map((e, i) => {
    const x1 = X(e.u), y1 = Y(e.u), x2 = X(e.v), y2 = Y(e.v);
    const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len, ny = dx / len;
    const bend = hasRev(e.u, e.v) ? 16 : 0;
    const cx = (x1 + x2) / 2 + nx * bend, cy = (y1 + y2) / 2 + ny * bend;
    // Trim both ends to the circle (plus room for the arrowhead on directed edges).
    const t1x = cx - x1, t1y = cy - y1, l1 = Math.hypot(t1x, t1y) || 1;
    const t2x = cx - x2, t2y = cy - y2, l2 = Math.hypot(t2x, t2y) || 1;
    const endGap = R + (g.directed ? 3 : 0);
    const sx = x1 + (t1x / l1) * R, sy = y1 + (t1y / l1) * R;
    const ex = x2 + (t2x / l2) * endGap, ey = y2 + (t2y / l2) * endGap;
    const d = `M${sx.toFixed(1)},${sy.toFixed(1)} Q${cx.toFixed(1)},${cy.toFixed(1)} ${ex.toFixed(1)},${ey.toFixed(1)}`;
    const lx = 0.25 * x1 + 0.5 * cx + 0.25 * x2, ly = 0.25 * y1 + 0.5 * cy + 0.25 * y2;
    const active = f.edge === i;
    const cls = ["dj-edge"];
    if (treeEdges.has(i)) cls.push("tree");
    if (isMst && f.take[i] === false) cls.push("skip");
    if (active) cls.push(isMst ? (f.take[i] ? "act tree" : "act skip") : `act ${f.result ?? ""}`);
    if ((f.tree && !isMst) && !treeEdges.has(i)) cls.push("dim");
    if (isMst && f.finished && !treeEdges.has(i)) cls.push("dim");
    const marker = !g.directed ? undefined : `url(#${uid}-${treeEdges.has(i) && !active ? "tree" : active ? "act" : "def"})`;
    return { e, i, d, lx, ly, cls: cls.join(" "), state: cls.slice(1).join(" "), marker, active };
  });

  const editable = !!onSelectEdge && g.weighted;
  const key = (fn: () => void) => (ev: KeyboardEvent) => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); ev.stopPropagation(); fn(); } };
  const label = `Graph with ${g.n} nodes and ${g.edges.length} ${g.directed ? "directed " : ""}edges.${showDist ? ` Source ${g.src}.` : ""}`;

  return (
    <div ref={ref} className="dj-graph">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="group" aria-label={label}>
        <defs>
          {(["def", "act", "tree"] as const).map((k) => (
            <marker key={k} id={`${uid}-${k}`} viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse" markerUnits="userSpaceOnUse">
              <path d="M0,1 L9,5 L0,9 z" className={`dj-arrow ${k}`} transform="scale(1)" />
            </marker>
          ))}
        </defs>
        {edges.map(({ i, d, cls, marker }) => (
          <path key={`e${i}`} d={d} className={cls} markerEnd={marker} fill="none" />
        ))}
        {edges.map(({ e, i, lx, ly, state, active }) => {
          if (!g.weighted) return null;
          const txt = String(e.w);
          const w = Math.max(24, txt.length * 8 + 12);
          const sel = selected === i;
          return (
            <g key={`w${i}`} className={`dj-w ${state}${sel ? " sel" : ""}${editable ? " edit" : ""}${e.w < 0 ? " neg" : ""}`} transform={`translate(${lx.toFixed(1)},${ly.toFixed(1)})`}
              role={editable ? "button" : undefined} tabIndex={editable ? 0 : undefined}
              aria-label={editable ? `Edge ${e.u} to ${e.v}, weight ${e.w}. Press to edit the weight.` : undefined}
              onClick={editable ? () => onSelectEdge!(i) : undefined} onKeyDown={editable ? key(() => onSelectEdge!(i)) : undefined}>
              <rect x={-w / 2} y={-11} width={w} height={22} rx={11} />
              <text y={4.5} textAnchor="middle">{txt}</text>
              {active && !reduce && <motion.rect key={`p${f.edge}-${f.line}`} x={-w / 2 - 3} y={-14} width={w + 6} height={28} rx={14} className="dj-w-ring" initial={{ opacity: 0.9, scale: 0.9 }} animate={{ opacity: 0, scale: 1.25 }} transition={{ duration: 0.7 }} />}
            </g>
          );
        })}
        {Array.from({ length: g.n }, (_, v) => {
          const x = X(v), y = Y(v);
          const cls = ["dj-node"];
          if (f.cur === v) cls.push("cur");
          else if (f.done[v]) cls.push("done");
          if (showDist && v === g.src) cls.push("src");
          if (f.dir && f.dir[1] === v && f.result === "better") cls.push("upd");
          const dv = f.dist[v];
          const wrong = f.truth && f.truth[v] !== dv;
          const above = g.pos[v].y < 0.5;
          const by = above ? -R - 14 : R + 14;
          const pick = onPickSource && showDist;
          return (
            <g key={`n${v}`} className={cls.join(" ")} transform={`translate(${x.toFixed(1)},${y.toFixed(1)})`}
              role={pick ? "button" : "img"} tabIndex={pick ? 0 : undefined}
              aria-label={`Node ${v}${showDist ? `, dist ${dv === Infinity ? "INF" : dv}` : ""}${pick ? ". Press to make it the source." : ""}`}
              onClick={pick ? () => onPickSource!(v) : undefined} onKeyDown={pick ? key(() => onPickSource!(v)) : undefined}>
              <motion.circle r={R} initial={false} animate={{ scale: f.cur === v && !reduce ? 1.08 : 1 }} transition={{ type: "spring", stiffness: 440, damping: 30 }} />
              <text y={5.5} textAnchor="middle" className="dj-node-label">{v}</text>
              {showDist && dv !== undefined && (
                <g className={`dj-badge${wrong ? " bad" : ""}${f.dir && f.dir[1] === v && f.result === "better" ? " upd" : ""}`} transform={`translate(0,${by})`}>
                  <rect x={-Math.max(15, fmtD(dv).length * 4.5 + 8)} y={-10} width={2 * Math.max(15, fmtD(dv).length * 4.5 + 8)} height={20} rx={10} />
                  <text y={4.5} textAnchor="middle">{fmtD(dv)}</text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
