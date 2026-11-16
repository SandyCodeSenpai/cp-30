import { useRef, type CSSProperties, type PointerEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { springs } from "@/ui";
import type { Grid, GridFrame, GridMode, QItem } from "./engine";
import { LIMITS } from "./engine";

export type Brush = "block" | "source";

interface Drag { kind: "paint" | "move-s" | "move-t" | "source"; value: boolean; from: number; last: number; work: Grid }

/** The paintable grid. Pointer drag paints (mouse, pen and touch); dragging S or T moves it. */
export function GridView({ g, mode, f, brush, onEdit, reduce }: {
  g: Grid; mode: GridMode; f: GridFrame; brush: Brush; onEdit: (g: Grid) => void; reduce: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<Drag | null>(null);
  const N = g.R * g.C;
  const single = mode === "bfs" || mode === "zero-one";

  const cellAt = (e: PointerEvent<HTMLDivElement>): number => {
    const el = ref.current; if (!el) return -1;
    const r = el.getBoundingClientRect();
    const c = Math.floor(((e.clientX - r.left) / r.width) * g.C), rr = Math.floor(((e.clientY - r.top) / r.height) * g.R);
    if (c < 0 || c >= g.C || rr < 0 || rr >= g.R) return -1;
    return rr * g.C + c;
  };

  const apply = (d: Drag, cell: number) => {
    const w = d.work;
    let next: Grid | null = null;
    if (d.kind === "paint") {
      if (w.sources.includes(cell) || w.target === cell || w.block[cell] === d.value) return;
      const block = w.block.slice(); block[cell] = d.value; next = { ...w, block };
    } else if (d.kind === "source") {
      const has = w.sources.includes(cell);
      if (d.value && !has && w.sources.length < LIMITS.maxSources) { const block = w.block.slice(); block[cell] = false; next = { ...w, block, sources: [...w.sources, cell] }; }
      else if (!d.value && has && w.sources.length > 1) next = { ...w, sources: w.sources.filter((s) => s !== cell) };
    } else if (d.kind === "move-s") {
      if (w.target === cell || w.sources.includes(cell) || w.block[cell]) return;
      next = { ...w, sources: w.sources.map((s) => (s === d.from ? cell : s)) };
      d.from = cell;
    } else if (d.kind === "move-t") {
      if (w.sources.includes(cell) || w.block[cell]) return;
      next = { ...w, target: cell };
    }
    if (next) { d.work = next; onEdit(next); }
  };

  const down = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    const cell = cellAt(e); if (cell < 0) return;
    e.preventDefault();
    (e.currentTarget.closest(".gx-lab") as HTMLElement | null)?.focus({ preventScroll: true });
    e.currentTarget.setPointerCapture?.(e.pointerId);
    let d: Drag;
    if (single && g.sources.includes(cell)) d = { kind: "move-s", value: true, from: cell, last: cell, work: g };
    else if (single && g.target === cell) d = { kind: "move-t", value: true, from: cell, last: cell, work: g };
    else if (mode === "multi-source" && brush === "source") d = { kind: "source", value: !g.sources.includes(cell), from: cell, last: cell, work: g };
    else if (g.sources.includes(cell)) return;
    else d = { kind: "paint", value: !g.block[cell], from: cell, last: cell, work: g };
    drag.current = d;
    if (d.kind === "paint" || d.kind === "source") apply(d, cell);
  };
  const move = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current; if (!d) return;
    const cell = cellAt(e); if (cell < 0 || cell === d.last) return;
    d.last = cell; apply(d, cell);
  };
  const up = () => { drag.current = null; };

  const inQ = new Set(f.q.map((x) => x.cell));
  const fresh = new Set(f.fresh);
  const onPath = new Set(f.path);
  const blockName = mode === "dfs" ? "land" : mode === "zero-one" ? "obstacle" : mode === "multi-source" ? "empty" : "wall";

  const cells = [];
  for (let i = 0; i < N; i++) {
    const isS = g.sources.includes(i), isT = g.target === i;
    const blk = g.block[i];
    const d = mode === "dfs" ? -1 : f.dist[i] ?? -1;
    const known = mode !== "dfs" && d !== -1 && d !== Infinity;
    const isl = mode === "dfs" ? f.island[i] ?? 0 : 0;
    const cls = ["gb-cell"];
    if (blk) cls.push(`blk ${blockName}`);
    if (known || isl) cls.push("vis");
    if (isl && isl === f.comps && f.q.length > 0) cls.push("live");
    if (inQ.has(i)) cls.push("inq");
    if (fresh.has(i)) cls.push("fresh");
    if (f.cur === i) cls.push("cur");
    if (f.look === i) cls.push("look");
    if (onPath.has(i)) cls.push("path");
    if (f.scan === i) cls.push("scan");
    if (isS) cls.push("src");
    if (isT) cls.push("tgt");
    let label = "";
    if (isS) label = "S";
    else if (known) label = String(d);
    else if (isT) label = "T";
    else if (isl) label = String(isl);
    const dot = mode === "multi-source" && !blk && !known && !isS;
    cells.push(
      <div key={i} className={cls.join(" ")}>
        <span className="gb-tile" />
        {dot && <span className="gb-orange" aria-hidden="true" />}
        {label && <span className="gb-num">{label}</span>}
        {isT && known && <span className="gb-tag">T</span>}
      </div>,
    );
  }

  const pts = f.path.map((c) => `${(c % g.C) * 10 + 5},${Math.floor(c / g.C) * 10 + 5}`).join(" ");
  const fs = Math.max(12, Math.min(16, Math.round(520 / Math.max(g.C, g.R * 1.3) * 0.38)));

  return (
    <div className="gb-wrap">
      <div ref={ref} className={`gb-grid m-${mode}`} role="img"
        aria-label={`${g.R} by ${g.C} grid. ${describe(g, mode)}`}
        style={{ gridTemplateColumns: `repeat(${g.C}, minmax(0, 1fr))`, aspectRatio: `${g.C} / ${g.R}`, "--gb-fs": `${fs}px` } as CSSProperties}
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
        {cells}
        {f.path.length > 1 && (
          <svg className="gb-path" viewBox={`0 0 ${g.C * 10} ${g.R * 10}`} aria-hidden="true">
            <motion.polyline key={pts} points={pts} fill="none"
              initial={reduce ? { opacity: 0 } : { pathLength: 0 }} animate={reduce ? { opacity: 1 } : { pathLength: 1 }}
              transition={reduce ? { duration: 0.15 } : { duration: 0.9, ease: "easeInOut" }} />
          </svg>
        )}
      </div>
    </div>
  );
}

function describe(g: Grid, mode: GridMode) {
  const n = g.block.filter(Boolean).length;
  if (mode === "dfs") return `${n} land cells. Drag to paint land and water.`;
  if (mode === "multi-source") return `${g.sources.length} sources, ${n} empty cells.`;
  return `${n} ${mode === "zero-one" ? "obstacles" : "walls"}. Drag to paint, drag S or T to move them.`;
}

/** Queue / deque / stack strip. Items keep their id so they slide when the front changes. */
export function Strip({ items, label, hint, g, f, reduce, kind }: {
  items: QItem[]; label: string; hint: string; g: Grid; f: GridFrame; reduce: boolean; kind: "queue" | "deque" | "stack";
}) {
  const fresh = new Set(f.fresh);
  const max = 40;
  const shown = items.length > max ? items.slice(0, max) : items;
  const frontIdx = kind === "stack" ? items.length - 1 : 0;
  return (
    <div className="gx-ds">
      <div className="gx-ds-head"><span><code>{label}</code> · {items.length} item{items.length === 1 ? "" : "s"}</span><span className="gb-hint">{hint}</span></div>
      <div className="gx-ds-row" role="list" aria-label={`${label}: ${items.map((x) => cellName(g, x.cell)).join(", ") || "empty"}`}>
        {items.length === 0 && <span className="gx-ds-empty">empty</span>}
        <AnimatePresence initial={false}>
          {shown.map((x, i) => (
            <motion.span key={x.id} role="listitem" layout={!reduce}
              className={`gx-chip${fresh.has(x.cell) && (kind !== "deque" || f.look === x.cell) ? " fresh" : ""}${i === frontIdx ? " front" : ""}`}
              initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.6 }} transition={reduce ? { duration: 0.12 } : springs.snappy}>
              {cellName(g, x.cell)}{hasDist(f) && <small>{fmtD(f.dist[x.cell])}</small>}
            </motion.span>
          ))}
        </AnimatePresence>
        {items.length > max && <span className="gx-ds-empty">+{items.length - max} more</span>}
      </div>
    </div>
  );
}
const cellName = (g: Grid, i: number) => `${Math.floor(i / g.C)},${i % g.C}`;
const hasDist = (f: GridFrame) => f.dist.length > 0;
const fmtD = (d: number) => (d === Infinity ? "" : `d=${d}`);
