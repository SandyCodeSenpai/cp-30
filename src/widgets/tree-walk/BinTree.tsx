/** Binary tree drawing: nodes placed by in-order rank, so it always fits the stage width without overlaps. */
import { useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { springs } from "@/ui";
import { useReducedMotion, useWidth } from "@/lib/hooks";
import { inorderRank, type Tree } from "./model";
import type { TFrame, TSt } from "./engine";

const LEVEL_H = 66;
const TOP = 30;

export function BinTree({ tree, frame, flowKey, label }: { tree: Tree; frame: TFrame; flowKey: number; label: string }) {
  const reduce = useReducedMotion();
  const box = useRef<HTMLDivElement>(null);
  const cw = useWidth(box);
  const N = tree.nodes;
  const rank = useMemo(() => inorderRank(tree), [tree]);
  const maxDepth = N.reduce((a, n) => Math.max(a, n.depth), 0);
  const W = Math.max(280, Math.round(cw || 520));
  const pad = 24;
  const slot = Math.min(60, (W - pad * 2) / Math.max(1, N.length));
  const R = slot < 40 ? 15 : 17;
  const used = slot * N.length;
  const x0 = (W - used) / 2;
  const X = (u: number) => x0 + (rank[u] + 0.5) * slot;
  const Y = (u: number) => TOP + N[u].depth * LEVEL_H;
  const H = TOP + maxDepth * LEVEL_H + R + 34;
  const st = (u: number): TSt => frame.st[u] ?? "idle";
  const vis = (u: number) => st(u) !== "h";
  const hot = (s: TSt) => s === "act" || s === "open";
  const ghostDx = Math.max(24, slot * 0.7);

  return (
    <div className="tw-treebox" ref={box}>
      <svg className="rx-svg tw-tree" width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
        {frame.band !== undefined && (
          <g>
            <motion.rect className="tw-band" x={6} width={W - 12} height={R * 2 + 14} rx={12} initial={false}
              animate={{ y: TOP + frame.band * LEVEL_H - R - 7 }} transition={reduce ? { duration: 0 } : springs.smooth} />
            <motion.text className="tw-band-label" x={12} initial={false} animate={{ y: TOP + frame.band * LEVEL_H - R - 11 }} transition={reduce ? { duration: 0 } : springs.smooth}>level {frame.band}</motion.text>
          </g>
        )}
        {N.map((n) => {
          if (n.parent < 0 || !vis(n.id)) return null;
          const p = n.parent;
          const a = st(p), c = st(n.id);
          const cls = c === "dim" ? " dim" : hot(a) && hot(c) ? " hot" : "";
          return (
            <motion.line key={`e${n.id}`} className={`tw-edge${cls}`} x1={X(p)} y1={Y(p) + R} x2={X(n.id)} y2={Y(n.id) - R}
              initial={c === "good" && !reduce ? { pathLength: 0 } : false} animate={{ pathLength: 1 }} transition={{ duration: 0.4 }} />
          );
        })}
        {frame.ghosts?.map((g, i) => {
          const gx = X(g.parent) + (g.side === "L" ? -ghostDx : ghostDx), gy = Y(g.parent) + LEVEL_H * 0.78;
          return (
            <motion.g key={`g${g.parent}${g.side}${i}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
              <line className="tw-ghost-edge" x1={X(g.parent)} y1={Y(g.parent) + R} x2={gx} y2={gy - 10} />
              <rect className="tw-ghost" x={gx - 20} y={gy - 10} width={40} height={20} rx={10} />
              <text className="tw-ghost-text" x={gx} y={gy + 4} textAnchor="middle">None</text>
            </motion.g>
          );
        })}
        {N.map((n) => {
          if (!vis(n.id)) return null;
          const s = st(n.id);
          const badge = frame.badge[n.id];
          const bw = badge ? badge.length * 7.3 + 12 : 0;
          return (
            <g key={`n${n.id}`} transform={`translate(${X(n.id)},${Y(n.id)})`} className={`tw-node s-${s}`}>
              <motion.g initial={s === "good" && !reduce ? { scale: 0.4, opacity: 0 } : false} animate={{ scale: 1, opacity: 1 }} transition={springs.smooth}>
                {s === "act" && <circle r={R + 5} className="tw-halo" />}
                <circle r={R} className="tw-circle" />
                <text className="tw-val" textAnchor="middle" dy={4.8} style={{ fontSize: String(n.val).length > 2 ? 12 : R > 15 ? 14 : 13 }}>{n.val}</text>
              </motion.g>
              {badge && (
                <motion.g key={badge} initial={reduce ? { opacity: 0 } : { opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
                  <rect className={`tw-badge-bg${s === "bad" ? " bad" : s === "good" ? " good" : ""}`} x={-bw / 2} y={R + 4} width={bw} height={19} rx={9.5} />
                  <text className="tw-badge" textAnchor="middle" y={R + 17.5}>{badge}</text>
                </motion.g>
              )}
            </g>
          );
        })}
        {frame.flow && vis(frame.flow.from) && (() => {
          const f = frame.flow!;
          const text = f.text, w = text.length * 7.3 + 16;
          const chip = (
            <g className={`tw-flow${text === "False" ? " bad" : ""}`}>
              <rect x={-w / 2} y={-11} width={w} height={22} rx={11} />
              <text textAnchor="middle" dy={4}>{text}</text>
            </g>
          );
          if (reduce) return <g key={`f${flowKey}`} transform={`translate(${(X(f.from) + X(f.to)) / 2},${(Y(f.from) + Y(f.to)) / 2})`}>{chip}</g>;
          return (
            <motion.g key={`f${flowKey}`} initial={{ x: X(f.from), y: Y(f.from), opacity: 0 }}
              animate={{ x: [X(f.from), X(f.to)], y: [Y(f.from), Y(f.to) + R + 4], opacity: [0, 1, 1, 0.9] }}
              transition={{ duration: 0.75, ease: "easeInOut", opacity: { duration: 0.75, times: [0, 0.15, 0.8, 1] } }}>
              {chip}
            </motion.g>
          );
        })()}
      </svg>
    </div>
  );
}
