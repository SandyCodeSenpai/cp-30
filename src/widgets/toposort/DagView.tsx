/** The directed graph: nodes with indegree badges, arrows that fade once used, the active arrow drawn in accent. */
import { motion } from "framer-motion";
import { springs } from "@/ui";
import { useReducedMotion } from "@/lib/hooks";
import type { Edge, TFrame } from "./engine";
import { edgeGeom, NR, type GLayout } from "./layout";

const STATE_WORD: Record<string, string> = { wait: "waiting", queue: "in the queue", cur: "being processed", done: "done", stuck: "stuck", open: "open on the stack" };

export function DagView({ g, edges, frame, frameKey, showIndeg, dfs }: { g: GLayout; edges: Edge[]; frame: TFrame; frameKey: number; showIndeg: boolean; dfs?: boolean }) {
  const reduce = useReducedMotion();
  const geo = edges.map((e, i) => edgeGeom(g, e, i));
  const label = `Directed graph. ${edges.map(([u, v]) => `${u} to ${v}`).join(", ")}. ${frame.state.map((s, v) => `${v} ${STATE_WORD[s]}${showIndeg ? `, indegree ${frame.indeg[v]}` : ""}`).join("; ")}.`;
  return (
    <svg className="kx-svg tp-svg" viewBox={`0 0 ${g.width} ${g.height}`} width={g.width} height={g.height} role="img" aria-label={label}>
      {edges.map((_, i) => {
        const cls = frame.bad[i] ? " is-bad" : frame.edge === i ? " is-active" : frame.used[i] ? (dfs ? " is-seen" : " is-used") : dfs ? " is-fresh" : "";
        return (
          <g key={`e${i}`} className={`tp-edge${cls}`}>
            <path className="tp-edge-line" d={geo[i].d} />
            <path className="tp-edge-head" d={geo[i].head} />
          </g>
        );
      })}
      {frame.edge !== undefined && !reduce && (
        <motion.path key={`run${frameKey}`} className="tp-edge-run" d={geo[frame.edge].d} initial={{ pathLength: 0, opacity: 1 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: 0.45, ease: "easeOut" }} />
      )}
      {frame.state.map((s, v) => {
        const p = g.pos[v];
        const flash = frame.flash.includes(v);
        const deg = frame.indeg[v];
        const rk = frame.rank[v];
        return (
          <g key={`n${v}`} className={`tp-node s-${s}`} transform={`translate(${p.x}, ${p.y})`}>
            {s === "cur" && !reduce && <motion.circle key={`pulse${frameKey}`} className="tp-pulse" r={NR} initial={{ scale: 1, opacity: 0.5 }} animate={{ scale: 1.65, opacity: 0 }} transition={{ duration: 0.7, ease: "easeOut" }} />}
            <motion.circle className="tp-body" r={NR} initial={false} animate={{ scale: s === "cur" ? 1.08 : 1 }} transition={reduce ? { duration: 0 } : springs.snappy} />
            <text className="tp-label" dy="0.35em" textAnchor="middle">{v}</text>
            {showIndeg && (
              <g className={`tp-badge${flash ? " flash" : ""}${deg === 0 && s !== "stuck" ? " zero" : ""}`} transform={`translate(${NR * 0.78}, ${-NR * 0.9})`}>
                <rect x={-11} y={-10} width={22} height={20} rx={10} />
                <motion.text key={`${deg}`} dy="0.35em" textAnchor="middle" initial={flash && !reduce ? { scale: 1.6, opacity: 0 } : false} animate={{ scale: 1, opacity: 1 }} transition={springs.bouncy}>{deg}</motion.text>
              </g>
            )}
            {rk !== null && (
              <motion.text key={`r${rk}`} className="tp-rank" y={NR + 16} textAnchor="middle" initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>#{rk}</motion.text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
