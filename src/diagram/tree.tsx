/* Binary tree visual from a LeetCode level-order list (null = missing child).
   Tidy layout (subtrees packed by their contours), tones per node, small notes beside nodes. */
import { useMemo, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Tone, TreeVisual } from "@/content/types";
import { measure, plain } from "./text";
import { AlgoCard, fmtList, toneClass, useBoxWidth, useMotion, useVersions } from "./algo";

interface TN { idx: number; val: string | number; depth: number; side: -1 | 0 | 1; left?: TN; right?: TN; rel: number; x: number; parent?: TN }

/** LeetCode deserialisation: children are handed out, in order, to the non-null nodes of the previous level. */
function build(nodes: (string | number | null)[]): TN[] {
  if (!nodes.length || nodes[0] === null || nodes[0] === undefined) return [];
  const mk = (idx: number, depth: number, side: -1 | 0 | 1, parent?: TN): TN => ({ idx, val: nodes[idx] as string | number, depth, side, rel: 0, x: 0, parent });
  const root = mk(0, 0, 0);
  const all = [root], queue = [root];
  let i = 1;
  while (queue.length && i < nodes.length) {
    const cur = queue.shift()!;
    for (const side of [-1, 1] as const) {
      if (i >= nodes.length) break;
      const v = nodes[i];
      if (v !== null && v !== undefined) {
        const ch = mk(i, cur.depth + 1, side, cur);
        if (side < 0) cur.left = ch; else cur.right = ch;
        all.push(ch); queue.push(ch);
      }
      i++;
    }
  }
  return all;
}

/** Contour-based tidy layout in "units" (1 unit = minimum gap between neighbours). Returns [left, right] contours per depth. */
function place(t: TN): [number[], number[]] {
  const SEP = 1;
  if (!t.left && !t.right) return [[0], [0]];
  if (t.left && t.right) {
    const [lL, lR] = place(t.left), [rL, rR] = place(t.right);
    let s = SEP;
    for (let d = 0; d < Math.min(lR.length, rL.length); d++) s = Math.max(s, lR[d] - rL[d] + SEP);
    t.left.rel = -s / 2; t.right.rel = s / 2;
    const depth = Math.max(lL.length, rL.length);
    const L = [0], R = [0];
    for (let d = 0; d < depth; d++) {
      const a = d < lL.length ? lL[d] - s / 2 : Infinity, b = d < rL.length ? rL[d] + s / 2 : Infinity;
      const c = d < lR.length ? lR[d] - s / 2 : -Infinity, e = d < rR.length ? rR[d] + s / 2 : -Infinity;
      L.push(Math.min(a, b)); R.push(Math.max(c, e));
    }
    return [L, R];
  }
  const ch = (t.left ?? t.right)!;
  const [cL, cR] = place(ch);
  ch.rel = t.left ? -SEP / 2 : SEP / 2;
  return [[0, ...cL.map((x) => x + ch.rel)], [0, ...cR.map((x) => x + ch.rel)]];
}

interface TreeL {
  w: number; h: number; r: number; fs: number;
  nodes: { idx: number; val: string | number; x: number; y: number; px?: number; py?: number; note?: { text: string; x: number; w: number } }[];
}

function layoutTree(v: TreeVisual, avail: number): TreeL | null {
  const all = build(v.nodes);
  if (!all.length) return null;
  place(all[0]);
  for (const n of all) n.x = (n.parent ? n.parent.x : 0) + n.rel;
  const narrow = avail < 480;
  const fs = narrow ? 14 : 15;
  const textMax = Math.max(...all.map((n) => measure(String(n.val), fs, 600)));
  const r = Math.max(narrow ? 16 : 19, Math.ceil(textMax / 2 + 7));
  const NOTE_GAP = 5;
  const notes = v.notes ?? {};
  const noteW = (n: TN) => (notes[n.idx] ? Math.ceil(measure(plain(notes[n.idx]), 12, 600)) + 14 : 0);
  // notes sit on the outer side: left children to the left, right children and the root to the right
  const leftW = (n: TN) => (n.side < 0 && noteW(n) ? noteW(n) + NOTE_GAP : 0);
  const rightW = (n: TN) => (n.side >= 0 && noteW(n) ? noteW(n) + NOTE_GAP : 0);

  // pixels per unit: fit the width, but never let neighbours (and their notes) touch
  const byDepth = new Map<number, TN[]>();
  for (const n of all) byDepth.set(n.depth, [...(byDepth.get(n.depth) ?? []), n]);
  let need = 2 * r + 10;
  for (const row of byDepth.values()) {
    row.sort((a, b) => a.x - b.x);
    for (let i = 1; i < row.length; i++) {
      const a = row[i - 1], b = row[i], du = b.x - a.x;
      if (du > 0) need = Math.max(need, (2 * r + rightW(a) + leftW(b) + 10) / du);
    }
  }
  const minX = Math.min(...all.map((n) => n.x)), maxX = Math.max(...all.map((n) => n.x));
  const span = maxX - minX;
  const fitPpu = span > 0 ? (avail - 2 * r - 24) / span : need;
  const ppu = Math.max(need, Math.min(narrow ? 64 : 84, fitPpu));
  const levelH = narrow ? 58 : 66;

  const px = (n: TN) => (n.x - minX) * ppu;
  const lo = Math.min(...all.map((n) => px(n) - r - leftW(n)));
  const hi = Math.max(...all.map((n) => px(n) + r + rightW(n)));
  const pad = 6, shift = pad - lo;
  const depthMax = Math.max(...all.map((n) => n.depth));
  const y = (n: TN) => r + 4 + n.depth * levelH;
  return {
    w: Math.ceil(hi - lo + 2 * pad), h: Math.ceil(depthMax * levelH + 2 * r + 8), r, fs,
    nodes: all.map((n) => {
      const x = px(n) + shift, nw = noteW(n);
      return {
        idx: n.idx, val: n.val, x, y: y(n),
        px: n.parent ? px(n.parent) + shift : undefined, py: n.parent ? y(n.parent) : undefined,
        note: nw ? { text: plain(notes[n.idx]), w: nw, x: n.side < 0 ? x - r - NOTE_GAP - nw / 2 : x + r + NOTE_GAP + nw / 2 } : undefined,
      };
    }),
  };
}

export function describeTree(v: TreeVisual): string {
  const all = build(v.nodes);
  if (!all.length) return "Binary tree: empty.";
  const parts = [`Binary tree, level order: ${v.nodes.map((x) => (x === null ? "null" : String(x))).join(", ")}.`];
  const kids = all.filter((n) => n.left || n.right).map((n) => `${n.val} has ${[n.left && `left ${n.left.val}`, n.right && `right ${n.right.val}`].filter(Boolean).join(" and ")}`);
  if (kids.length) parts.push(`${kids.join("; ")}.`);
  const ts = Object.entries(v.tones ?? {}).filter(([i, t]) => t !== "neutral" && v.nodes[+i] != null).map(([i, t]) => `${v.nodes[+i]} ${t}`);
  if (ts.length) parts.push(`Marked: ${fmtList(ts)}.`);
  const ns = Object.entries(v.notes ?? {}).filter(([i]) => v.nodes[+i] != null).map(([i, t]) => `${v.nodes[+i]}: ${plain(t)}`);
  if (ns.length) parts.push(`Notes: ${fmtList(ns)}.`);
  return parts.join(" ");
}

export function TreeDiagram({ v }: { v: TreeVisual }) {
  const host = useRef<HTMLDivElement>(null);
  const avail = useBoxWidth(host);
  const { reduced, move, fade } = useMotion();
  const L = useMemo(() => (avail > 0 ? layoutTree(v, avail) : null), [v, avail]);
  const versions = useVersions([
    ...v.nodes.map((x, i) => [`v${i}`, String(x)] as [string, string]),
    ...Object.entries(v.notes ?? {}).map(([i, t]) => [`n${i}`, t] as [string, string]),
  ]);
  const aria = useMemo(() => describeTree(v), [v]);
  const tones: Record<number, Tone> = v.tones ?? {};

  return (
    <AlgoCard kind="tree" hostRef={host} avail={avail} contentW={L?.w ?? 0} reduced={reduced}>
      {avail > 0 && !L && <div className="dg-empty" role="img" aria-label={aria}>Empty tree</div>}
      {L && (
        <svg className="dg-tree" width={L.w} height={L.h} viewBox={`0 0 ${L.w} ${L.h}`} role="img" aria-label={aria}>
          <AnimatePresence initial={false}>
            {L.nodes.filter((n) => n.px !== undefined).map((n) => (
              <motion.line key={`e${n.idx}`} className="dg-t-edge"
                initial={{ opacity: 0, x1: n.px!, y1: n.py!, x2: n.x, y2: n.y }} animate={{ opacity: 1, x1: n.px!, y1: n.py!, x2: n.x, y2: n.y }} exit={{ opacity: 0 }}
                transition={{ default: move, opacity: fade }} />
            ))}
          </AnimatePresence>
          <AnimatePresence initial={false}>
            {L.nodes.map((n) => {
              const ver = versions.get(`v${n.idx}`) ?? 0;
              return (
                <motion.g key={`n${n.idx}`} className={`dg-t-node ${toneClass(tones[n.idx])}`}
                  initial={{ opacity: 0, x: n.x, y: n.y + 6 }} animate={{ opacity: 1, x: n.x, y: n.y }} exit={{ opacity: 0 }}
                  transition={{ default: move, opacity: fade }}>
                  <circle r={L.r} cx={0} cy={0} />
                  {ver > 0 && <circle key={`r${ver}`} className="dg-svg-ripple" r={L.r} />}
                  <text key={`t${ver}`} className={`dg-t-val${ver > 0 ? " dg-svg-pop" : ""}`} style={{ fontSize: L.fs }}>{String(n.val)}</text>
                </motion.g>
              );
            })}
          </AnimatePresence>
          <AnimatePresence initial={false}>
            {L.nodes.filter((n) => n.note).map((n) => {
              const ver = versions.get(`n${n.idx}`) ?? 0;
              return (
                <motion.g key={`note${n.idx}`} className={`dg-note ${toneClass(tones[n.idx])}`}
                  initial={{ opacity: 0, x: n.note!.x, y: n.y }} animate={{ opacity: 1, x: n.note!.x, y: n.y }} exit={{ opacity: 0 }}
                  transition={{ default: move, opacity: fade }}>
                  <g key={ver} className={ver > 0 ? "dg-svg-pop" : undefined}>
                    <rect x={-n.note!.w / 2} y={-10} width={n.note!.w} height={20} rx={10} />
                    <text>{n.note!.text}</text>
                  </g>
                </motion.g>
              );
            })}
          </AnimatePresence>
        </svg>
      )}
    </AlgoCard>
  );
}
