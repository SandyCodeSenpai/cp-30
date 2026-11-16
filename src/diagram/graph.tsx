/* Graph visual: hand-placed nodes (x, y in 0..100), directed or undirected edges, weight pills,
   dashed edges, tones and notes under nodes (for example a distance). Notes that change pop once. */
import { useMemo, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { GraphVisual } from "@/content/types";
import { measure, plain } from "./text";
import { AlgoCard, fmtList, headPath, qPoint, toneClass, useBoxWidth, useMotion, useVersions, type P } from "./algo";

const NOTE_H = 20, W_H = 18, HEAD = 8;

interface GNode { id: string; label: string; x: number; y: number; note?: { text: string; w: number; dx: number; dy: number } }
interface GEdge { src: number; key: string; d: string; head?: string; w?: { text: string; x: number; y: number; width: number } }
interface GraphL { w: number; h: number; r: number; fs: number; nodes: GNode[]; edges: GEdge[] }

function layoutGraph(v: GraphVisual, avail: number): GraphL {
  const narrow = avail < 480;
  const fs = narrow ? 14 : 15;
  const labels = v.nodes.map((n) => plain(n.label ?? n.id));
  const textMax = Math.max(0, ...labels.map((l) => measure(l, fs, 600)));
  const r = Math.max(narrow ? 17 : 19, Math.ceil(textMax / 2 + 9));
  const noteWs = v.nodes.map((n) => (n.note ? Math.ceil(measure(plain(n.note), 12, 600)) + 14 : 0));

  // a note goes under its node unless an edge arrives there; then above, right or left, whichever is free
  const SIDES = [[0, 1], [0, -1], [1, 0], [-1, 0]] as const;
  const side = v.nodes.map((n) => {
    const dirs = v.edges.filter((e) => e.from === n.id || e.to === n.id).map((e) => {
      const o = v.nodes.find((m) => m.id === (e.from === n.id ? e.to : e.from));
      if (!o) return null;
      const l = Math.hypot(o.x - n.x, o.y - n.y) || 1;
      return [(o.x - n.x) / l, (o.y - n.y) / l] as const;
    }).filter((d): d is readonly [number, number] => !!d);
    const score = SIDES.map(([sx, sy]) => Math.max(-1, ...dirs.map(([dx, dy]) => dx * sx + dy * sy)));
    const free = SIDES.findIndex((_, k) => score[k] < Math.cos(Math.PI * 40 / 180));
    return SIDES[free >= 0 ? free : score.indexOf(Math.min(...score))];
  });
  const noteAt = (i: number) => {
    const [sx, sy] = side[i], w = noteWs[i];
    return sy ? { dx: 0, dy: sy * (r + 6 + NOTE_H / 2) } : { dx: sx * (r + 6 + w / 2), dy: 0 };
  };
  const anyNote = (f: (i: number) => boolean) => v.nodes.some((n, i) => !!n.note && f(i));

  const xs = v.nodes.map((n) => n.x), ys = v.nodes.map((n) => n.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const bw = maxX - minX, bh = maxY - minY;
  const padX = Math.max(r, ...noteWs.map((w, i) => (!w ? 0 : side[i][0] ? r + 6 + w : w / 2))) + 8;
  const padTop = r + 6 + (anyNote((i) => side[i][1] < 0) ? NOTE_H + 8 : 0);
  const padBot = r + 6 + (anyNote((i) => side[i][1] > 0) ? NOTE_H + 8 : 0);
  const maxH = Math.min(420, Math.max(240, avail * 0.72));
  const sX = bw > 0 ? (avail - 2 * padX) / bw : Infinity;
  const sY = bh > 0 ? (maxH - padTop - padBot) / bh : Infinity;
  let s = Math.min(sX, sY, 6.2);
  if (!Number.isFinite(s)) s = 1;
  // never let two nodes (or a node and the note under its neighbour) touch: grow and scroll instead
  let minNeed = 0;
  for (let i = 0; i < v.nodes.length; i++) for (let j = i + 1; j < v.nodes.length; j++) {
    const du = Math.hypot(v.nodes[i].x - v.nodes[j].x, v.nodes[i].y - v.nodes[j].y);
    if (du > 0) minNeed = Math.max(minNeed, (2 * r + 18) / du);
  }
  s = Math.max(s, minNeed);
  // an edge should leave room for its weight pill (and arrowhead) between the two circles,
  // as far as the width allows: a slightly crowded pill beats a diagram that scrolls
  let wNeed = 0;
  for (const e of v.edges) {
    const a = v.nodes.find((n) => n.id === e.from), b = v.nodes.find((n) => n.id === e.to);
    if (!a || !b || e.w === undefined || e.w === "") continue;
    const du = Math.hypot(a.x - b.x, a.y - b.y);
    if (du > 0) wNeed = Math.max(wNeed, (2 * r + measure(String(e.w), 12, 600) + 12 + (e.directed ? HEAD : 0) + 10) / du);
  }
  s = Math.max(s, Math.min(wNeed, sX));

  const P = (n: { x: number; y: number }): P => ({ x: padX + (n.x - minX) * s, y: padTop + (n.y - minY) * s });
  const pos = new Map(v.nodes.map((n) => [n.id, P(n)]));
  const nodes: GNode[] = v.nodes.map((n, i) => ({ id: n.id, label: labels[i], ...pos.get(n.id)!, note: n.note ? { text: plain(n.note), w: noteWs[i], ...noteAt(i) } : undefined }));

  const pairCount = new Map<string, number>();
  for (const e of v.edges) pairCount.set(`${e.from}>${e.to}`, (pairCount.get(`${e.from}>${e.to}`) ?? 0) + 1);
  const seen = new Map<string, number>();
  const edges: GEdge[] = [];
  v.edges.forEach((e, src) => {
    const a = pos.get(e.from), b = pos.get(e.to);
    if (!a || !b || e.from === e.to) return;
    const k0 = `${e.from}>${e.to}`, dup = seen.get(k0) ?? 0; seen.set(k0, dup + 1);
    const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
    const nx = dy / len, ny = -dx / len; // left of travel
    const twoWay = pairCount.has(`${e.to}>${e.from}`);
    const bend = twoWay || dup ? Math.min(30, len * 0.16) * (1 + dup) : 0;
    const ctrl: P = { x: (a.x + b.x) / 2 + nx * bend, y: (a.y + b.y) / 2 + ny * bend };
    const toward = (from: P, to: P, dist: number): P => { const l = Math.hypot(to.x - from.x, to.y - from.y) || 1; return { x: from.x + ((to.x - from.x) / l) * dist, y: from.y + ((to.y - from.y) / l) * dist }; };
    const start = toward(a, ctrl, r + 2);
    const tip = toward(b, ctrl, r + 2);
    const lineEnd = e.directed ? toward(tip, ctrl, HEAD * 0.75) : tip;
    const d = bend
      ? `M${start.x.toFixed(1)},${start.y.toFixed(1)} Q${ctrl.x.toFixed(1)},${ctrl.y.toFixed(1)} ${lineEnd.x.toFixed(1)},${lineEnd.y.toFixed(1)}`
      : `M${start.x.toFixed(1)},${start.y.toFixed(1)} L${lineEnd.x.toFixed(1)},${lineEnd.y.toFixed(1)}`;
    let w: GEdge["w"];
    if (e.w !== undefined && e.w !== "") {
      const text = String(e.w), mid = qPoint(start, ctrl, tip, 0.5);
      w = { text, x: mid.x, y: mid.y, width: Math.max(22, Math.ceil(measure(text, 12, 600)) + 12) };
    }
    edges.push({ src, key: dup ? `${k0}#${dup}` : k0, d, head: e.directed ? headPath(tip, tip.x - ctrl.x, tip.y - ctrl.y, HEAD, 4.5) : undefined, w });
  });

  const contentW = Math.ceil(padX * 2 + bw * s), contentH = Math.ceil(padTop + padBot + bh * s);
  return { w: contentW, h: contentH, r, fs, nodes, edges };
}

export function describeGraph(v: GraphVisual): string {
  const name = new Map(v.nodes.map((n) => [n.id, plain(n.label ?? n.id)]));
  const parts = [`Graph with ${v.nodes.length} node${v.nodes.length === 1 ? "" : "s"}: ${v.nodes.map((n) => name.get(n.id)).join(", ")}.`];
  const es = v.edges.filter((e) => name.has(e.from) && name.has(e.to))
    .map((e) => `${name.get(e.from)} ${e.directed ? "to" : "and"} ${name.get(e.to)}${e.w !== undefined && e.w !== "" ? ` (weight ${e.w})` : ""}${e.tone && e.tone !== "neutral" ? ` ${e.tone}` : ""}`);
  if (es.length) parts.push(`Edges: ${es.join("; ")}.`);
  const ts = v.nodes.filter((n) => n.tone && n.tone !== "neutral").map((n) => `${name.get(n.id)} ${n.tone}`);
  if (ts.length) parts.push(`Marked: ${fmtList(ts)}.`);
  const ns = v.nodes.filter((n) => n.note).map((n) => `${name.get(n.id)}: ${plain(n.note!)}`);
  if (ns.length) parts.push(`Notes: ${fmtList(ns)}.`);
  return parts.join(" ");
}

export function GraphDiagram({ v }: { v: GraphVisual }) {
  const host = useRef<HTMLDivElement>(null);
  const avail = useBoxWidth(host);
  const { reduced, move, fade } = useMotion();
  const L = useMemo(() => (avail > 0 && v.nodes.length ? layoutGraph(v, avail) : null), [v, avail]);
  const versions = useVersions([
    ...v.nodes.map((n) => [`n:${n.id}`, n.note ?? ""] as [string, string]),
    ...v.edges.map((e, i) => [`w:${e.from}>${e.to}#${i}`, String(e.w ?? "")] as [string, string]),
  ]);
  const aria = useMemo(() => describeGraph(v), [v]);

  return (
    <AlgoCard kind="graph" hostRef={host} avail={avail} contentW={L?.w ?? 0} reduced={reduced}>
      {avail > 0 && !L && <div className="dg-empty" role="img" aria-label={aria}>Empty graph</div>}
      {L && (
        <svg className="dg-graph" width={L.w} height={L.h} viewBox={`0 0 ${L.w} ${L.h}`} role="img" aria-label={aria}>
          <AnimatePresence initial={false}>
            {L.edges.map((g) => {
              const e = v.edges[g.src];
              const wver = versions.get(`w:${e.from}>${e.to}#${g.src}`) ?? 0;
              return (
                <motion.g key={g.key} className={`dg-g-edge ${toneClass(e.tone)}${e.dashed ? " is-dashed" : ""}`}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={fade}>
                  <motion.path className="dg-g-line" initial={false} animate={{ d: g.d }} transition={move} />
                  {g.head && <motion.path className="dg-g-head" initial={false} animate={{ d: g.head }} transition={move} />}
                  {g.w && (
                    <motion.g className="dg-g-w" initial={false} animate={{ x: g.w.x, y: g.w.y }} transition={move}>
                      <g key={wver} className={wver > 0 ? "dg-svg-pop" : undefined}>
                        <rect x={-g.w.width / 2} y={-W_H / 2} width={g.w.width} height={W_H} rx={W_H / 2} />
                        <text>{g.w.text}</text>
                      </g>
                    </motion.g>
                  )}
                </motion.g>
              );
            })}
          </AnimatePresence>
          <AnimatePresence initial={false}>
            {L.nodes.map((n, i) => {
              const src = v.nodes[i];
              const nver = versions.get(`n:${n.id}`) ?? 0;
              return (
                <motion.g key={n.id} className={`dg-g-node ${toneClass(src.tone)}`}
                  initial={{ opacity: 0, x: n.x, y: n.y }} animate={{ opacity: 1, x: n.x, y: n.y }} exit={{ opacity: 0 }}
                  transition={{ default: move, opacity: fade }}>
                  <circle className="dg-g-shape" r={L.r} />
                  <text className="dg-g-label" style={{ fontSize: L.fs }}>{n.label}</text>
                  {n.note && (
                    <g className={`dg-note ${toneClass(src.tone)}`} transform={`translate(${n.note.dx.toFixed(1)} ${n.note.dy.toFixed(1)})`}>
                      <g key={nver} className={nver > 0 ? "dg-svg-pop" : undefined}>
                        <rect x={-n.note.w / 2} y={-NOTE_H / 2} width={n.note.w} height={NOTE_H} rx={NOTE_H / 2} />
                        <text>{n.note.text}</text>
                      </g>
                    </g>
                  )}
                  {nver > 0 && <circle key={`rp${nver}`} className="dg-svg-ripple" r={L.r} />}
                </motion.g>
              );
            })}
          </AnimatePresence>
        </svg>
      )}
    </AlgoCard>
  );
}
