/** The call tree: nodes appear as recursion descends, the running path is blue, pruned branches are cut stubs. */
import { useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { springs } from "@/ui";
import { useReducedMotion, useWidth } from "@/lib/hooks";
import type { CNode, Flow, St } from "./engine";

const NODE_H = 28;
const CUT_H = 22;

export interface TreeLayout { x: number[]; y: number[]; w: number[]; width: number; height: number; levelH: number; dense: boolean }

/** Simple tidy layout: each subtree gets the width of its children side by side; parents sit centred above.
 *  `dense` (phones) uses 12px labels and tighter gaps so small trees fit without scrolling. */
export function layoutTree(nodes: CNode[], o: { levelH: number; dense?: boolean }): TreeLayout {
  const n = nodes.length;
  const CH = o.dense ? 7.25 : 7.85, GAP = o.dense ? 6 : 10, NPAD = o.dense ? 9 : 16;
  const textW = (s: string) => s.length * CH;
  const w = nodes.map((nd) => (nd.mini ? 12 : nd.kind === "cut" ? Math.max(22, textW(nd.label) + 8) : Math.max(o.dense ? 26 : 30, textW(nd.label) + NPAD)));
  // tiny cut stubs sit close together; everything else gets the normal gap
  const gapAfter = (a: number, b: number) => (nodes[a].mini && nodes[b].mini ? 3 : nodes[a].mini || nodes[b].mini ? Math.round(GAP * 0.6) : GAP);
  const rowW = (ch: number[]) => ch.reduce((acc, c, k) => acc + sw[c] + (k ? gapAfter(ch[k - 1], c) : 0), 0);
  // sub-labels and return values sit under the node and can be wider than it
  const own = nodes.map((nd, i) => Math.max(w[i], nd.sub ? textW(nd.sub) * 0.92 : 0, nd.ret ? textW(nd.ret) : 0));
  const sw = new Array<number>(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    const ch = nodes[i].children;
    sw[i] = Math.max(own[i], rowW(ch));
  }
  const x = new Array<number>(n).fill(0), y = new Array<number>(n).fill(0);
  const PAD = o.dense ? 6 : 14, TOP = 26;
  let maxDepth = 0;
  const place = (i: number, left: number) => {
    const nd = nodes[i];
    x[i] = left + sw[i] / 2;
    y[i] = TOP + nd.depth * o.levelH;
    maxDepth = Math.max(maxDepth, nd.depth);
    let cx = left + (sw[i] - rowW(nd.children)) / 2;
    nd.children.forEach((c, k) => { if (k) cx += gapAfter(nd.children[k - 1], c); place(c, cx); cx += sw[c]; });
  };
  if (n) place(0, PAD);
  return { x, y, w, width: (n ? sw[0] : 0) + PAD * 2, height: TOP + maxDepth * o.levelH + NODE_H / 2 + 26, levelH: o.levelH, dense: !!o.dense };
}

const FILL: Record<St, string> = { h: "var(--surface)", open: "var(--accent-soft)", act: "var(--accent)", done: "var(--surface)", sol: "var(--good-soft)", cut: "var(--surface)", hit: "var(--good-soft)", dead: "var(--bad-soft)" };
const STROKE: Record<St, string> = { h: "var(--line)", open: "var(--accent)", act: "var(--accent)", done: "var(--muted)", sol: "var(--good)", cut: "var(--muted)", hit: "var(--good)", dead: "var(--bad)" };
const INK: Record<St, string> = { h: "var(--ink)", open: "var(--accent-text)", act: "var(--accent-ink)", done: "var(--ink-2)", sol: "var(--good-ink)", cut: "var(--muted)", hit: "var(--good-ink)", dead: "var(--bad-ink)" };

export function CallTree({ nodes, levelH, st, active, flow, flowKey, label }: {
  nodes: CNode[]; levelH: number; st: St[]; active: number; flow?: Flow; flowKey: number; label: string;
}) {
  const reduce = useReducedMotion();
  const box = useRef<HTMLDivElement>(null);
  const cw = useWidth(box);
  // Use the dense layout on phones, or whenever the normal one would not fit the stage.
  const layout = useMemo(() => {
    const normal = layoutTree(nodes, { levelH });
    if (!cw || (cw >= 480 && normal.width <= cw)) return normal;
    return layoutTree(nodes, { levelH, dense: true });
  }, [nodes, levelH, cw]);
  const W = Math.max(layout.width, cw || 0);
  const off = (W - layout.width) / 2;
  const X = (i: number) => layout.x[i] + off;
  const Y = (i: number) => layout.y[i];
  const vis = (i: number) => (st[i] ?? "h") !== "h";

  // Keep the running node in view when the tree is wider than the stage.
  const focus = active >= 0 ? active : 0;
  useEffect(() => {
    const el = box.current; if (!el || layout.width <= el.clientWidth) return;
    const target = X(focus) - el.clientWidth / 2;
    el.scrollTo({ left: Math.max(0, target), behavior: reduce ? "auto" : "smooth" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus, layout, cw]);

  const onPath = useMemo(() => {
    const s = new Set<number>();
    for (let i = active; i >= 0; i = nodes[i]?.parent ?? -1) s.add(i);
    return s;
  }, [active, nodes]);

  const edgeEnd = (i: number) => (nodes[i].mini ? 6 : nodes[i].kind === "cut" ? CUT_H / 2 : NODE_H / 2);

  return (
    <div className="rx-scroll" ref={box}>
      <svg className={`rx-svg rt-tree${layout.dense ? " dense" : ""}`} width={W} height={layout.height} viewBox={`0 0 ${W} ${layout.height}`} role="img" aria-label={label}>
        {/* edges */}
        {nodes.map((nd) => {
          if (nd.parent < 0 || !vis(nd.id)) return null;
          const p = nd.parent;
          const ps = st[p];
          const below = nodes[p].sub || (nodes[p].ret && (ps === "done" || ps === "hit")) ? 21 : 0; // room for the text under the parent
          const x1 = X(p), y1 = Y(p) + NODE_H / 2 + below, x2 = X(nd.id), y2 = Y(nd.id) - edgeEnd(nd.id);
          const hot = onPath.has(nd.id);
          const cut = nd.kind === "cut";
          const d = `M${x1},${y1} L${x2},${y2}`;
          const mx = x1 + (x2 - x1) * 0.6, my = y1 + (y2 - y1) * 0.6;
          // cut mark: two short slashes across the edge, near the child
          const ang = Math.atan2(y2 - y1, x2 - x1);
          const cx = x1 + (x2 - x1) * 0.72, cy = y1 + (y2 - y1) * 0.72;
          const nx = -Math.sin(ang), ny = Math.cos(ang), tx = Math.cos(ang), ty = Math.sin(ang);
          const slash = (k: number) => `M${cx + tx * k - nx * 6 - tx * 2},${cy + ty * k - ny * 6 - ty * 2} L${cx + tx * k + nx * 6 + tx * 2},${cy + ty * k + ny * 6 + ty * 2}`;
          return (
            <g key={`e${nd.id}`} className={`rt-edge${hot ? " hot" : ""}${cut ? " cut" : ""}${nd.dashed ? " dash" : ""}`}>
              <motion.path d={d} initial={reduce ? { opacity: 0 } : { pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={reduce ? { duration: 0.15 } : { duration: 0.35, ease: "easeOut" }} />
              {cut && !nd.mini && <path className="rt-cutmark" d={`${slash(-3)} ${slash(3)}`} />}
              {nd.edge && !cut && !(layout.dense && nd.dashed) && (
                <g transform={`translate(${mx},${my})`}>
                  <rect className="rt-elabel-bg" x={-(nd.edge.length * 7.2) / 2 - 4} y={-9} width={nd.edge.length * 7.2 + 8} height={18} rx={6} />
                  <text className="rt-elabel" textAnchor="middle" dy={4}>{nd.edge}</text>
                </g>
              )}
            </g>
          );
        })}
        {/* nodes */}
        {nodes.map((nd) => {
          if (!vis(nd.id)) return null;
          const s = st[nd.id];
          const w = layout.w[nd.id];
          const cut = nd.kind === "cut";
          const h = cut ? CUT_H : NODE_H;
          const isAct = nd.id === active;
          const showRet = !!nd.ret && (s === "done" || s === "hit");
          if (nd.mini) return (
            <g key={`n${nd.id}`} transform={`translate(${X(nd.id)},${Y(nd.id)})`}>
              <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
                <title>{`${nd.label}: cut`}</title>
                <circle r={5.5} className="rt-mini" />
                <path className="rt-cutmark" d="M-4.5,4.5 L4.5,-4.5" />
              </motion.g>
            </g>
          );
          return (
            <g key={`n${nd.id}`} transform={`translate(${X(nd.id)},${Y(nd.id)})`}>
              <motion.g initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={reduce ? { duration: 0.15 } : springs.smooth}>
                {isAct && <rect className="rt-halo" x={-w / 2 - 5} y={-h / 2 - 5} width={w + 10} height={h + 10} rx={13} />}
                <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={cut ? 8 : 10}
                  className={`rt-node${cut ? " cut" : ""}${s === "hit" ? " hit" : ""}${nd.rep && !cut ? " rep" : ""}`}
                  style={{ fill: FILL[s], stroke: nd.rep && s !== "act" ? "var(--warn)" : STROKE[s] }} />
                <text className={`rt-label${cut ? " cut" : ""}`} textAnchor="middle" dy={cut ? 4 : 4.5} style={{ fill: INK[s] }}>{nd.label}</text>
                {nd.sub && !cut && <text className="rt-sub" textAnchor="middle" y={h / 2 + 15}>{nd.sub}</text>}
                {showRet && <text className={`rt-ret${s === "hit" ? " hit" : ""}`} textAnchor="middle" y={h / 2 + 15}>{s === "hit" ? `memo ${nd.ret}` : nd.ret}</text>}
              </motion.g>
            </g>
          );
        })}
        {/* the value or undo travelling up an edge */}
        {flow && vis(flow.from) && flow.to >= 0 && (
          reduce ? (
            <FlowChip key={`f${flowKey}`} x={(X(flow.from) + X(flow.to)) / 2} y={(Y(flow.from) + Y(flow.to)) / 2} text={flow.text} kind={flow.kind} />
          ) : (
            <motion.g key={`f${flowKey}`} initial={{ x: X(flow.from), y: Y(flow.from) - 4, opacity: 0 }}
              animate={{ x: [X(flow.from), X(flow.to)], y: [Y(flow.from) - 4, Y(flow.to) + NODE_H / 2 + 12], opacity: [0, 1, 1, 0.92] }}
              transition={{ duration: 0.75, ease: "easeInOut", times: [0, 1], opacity: { duration: 0.75, times: [0, 0.15, 0.8, 1] } }}>
              <FlowChip x={0} y={0} text={flow.text} kind={flow.kind} />
            </motion.g>
          )
        )}
      </svg>
    </div>
  );
}

function FlowChip({ x, y, text, kind }: { x: number; y: number; text: string; kind: Flow["kind"] }) {
  const w = text.length * 7.2 + 14;
  return (
    <g transform={`translate(${x},${y})`} className={`rt-flow ${kind}`}>
      <rect x={-w / 2} y={-11} width={w} height={22} rx={11} />
      <text textAnchor="middle" dy={4}>{text}</text>
    </g>
  );
}
