import { useRef, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { springs } from "@/ui";
import { useReducedMotion, useWidth } from "@/lib/hooks";
import type { HeapFrame, HeapMode, Item } from "./engine";

export interface Meta {
  mode: HeapMode;
  /** Largest size each heap reaches in this run (keeps the layout still while stepping). */
  maxSize: number[];
  /** top-k / median: the input stream. merge-k: the source lists. */
  stream?: Item[];
  lists?: Item[][];
  trayMax: number;
}

type P = { x: number; y: number };
const depthOf = (n: number) => Math.max(1, Math.ceil(Math.log2(n + 1)));

export function HeapStage({ f, meta }: { f: HeapFrame; meta: Meta }) {
  const ref = useRef<HTMLDivElement>(null);
  const W = Math.max(300, useWidth(ref) || 620);
  const reduce = useReducedMotion();
  const move = reduce ? { duration: 0 } : springs.smooth;
  const r = W < 440 ? 15 : 18;
  const fs = r >= 18 ? 14 : 13;
  const pad = 6;
  const x0 = pad, x1 = W - pad;
  const pos = new Map<number, P & { zone: string }>();
  const caps: ReactNode[] = [];
  const slots: (P & { k: string })[] = [];
  const edges: { k: string; a: P; b: P; on: boolean }[] = [];
  const cells: { id: number; x: number; y: number; w: number; text: string; idx: number; hl?: string }[] = [];
  const rootTags: (P & { t: string })[] = [];
  let y = 0;
  const cap = (text: string, x: number, yy: number, anchor: "start" | "middle" | "end" = "start") =>
    caps.push(<text key={`c${caps.length}`} x={x} y={yy} textAnchor={anchor} className="pl-cap">{text}</text>);

  const inHeap = new Set<number>(); f.heaps.forEach((h) => h.forEach((it) => inHeap.add(it.id)));
  const inTray = new Set(f.tray.map((t) => t.id));

  /** A row of circle slots that wraps. Returns the slot centers and the height used. */
  const slotRow = (n: number, top: number, xa: number, xb: number) => {
    const step = 2 * r + 8;
    const per = Math.max(1, Math.floor((xb - xa) / step));
    const rows = Math.max(1, Math.ceil(n / per));
    const pts: P[] = [];
    for (let k = 0; k < n; k++) pts.push({ x: xa + (k % per) * step + r + 2, y: top + Math.floor(k / per) * step + r });
    return { pts, h: rows * step - 8 };
  };

  const tree = (hn: number, h: Item[], capN: number, xa: number, xb: number, top: number, tag: string) => {
    const depth = depthOf(Math.max(1, capN));
    const lh = 2 * r + 22;
    const tw = Math.min(xb - xa, 2 ** (depth - 1) * (2 * r + 34));
    xa = xa + (xb - xa - tw) / 2;
    const at = (i: number): P => {
      const l = Math.floor(Math.log2(i + 1)), p = i - (2 ** l - 1);
      return { x: xa + ((p + 0.5) * tw) / 2 ** l, y: top + r + l * lh };
    };
    h.forEach((it, i) => {
      pos.set(it.id, { ...at(i), zone: "heap" });
      if (i > 0) {
        const pi = (i - 1) >> 1;
        edges.push({ k: `${hn}-${i}`, a: at(pi), b: at(i), on: !!f.edge && f.edge[0] === hn && f.edge[1] === pi && f.edge[2] === i });
      }
    });
    if (!h.length) slots.push({ ...at(0), k: `empty${hn}` });
    else rootTags.push({ ...at(0), t: tag });
    return 2 * r + (depth - 1) * lh;
  };

  const listRow = (h: Item[], capN: number, xa: number, xb: number, top: number, wide: boolean, show: (it: Item) => string) => {
    const cw = Math.max(26, Math.min(wide ? 84 : 38, (xb - xa) / Math.max(1, capN)));
    h.forEach((it, i) => cells.push({ id: it.id, x: xa + i * cw, y: top, w: cw - 4, text: show(it), idx: i, hl: f.hl[it.id] }));
    if (!h.length) cap("[ ]  empty", xa + 2, top + 20);
    return 30 + 18;
  };

  const mode = meta.mode;
  const sizeAt = (i: number) => meta.maxSize[i] ?? 1;

  if (mode === "top-k" || mode === "median") {
    const n = meta.stream?.length ?? 0;
    cap("nums (stream)", x0, y + 12); y += 20;
    const row = slotRow(n, y, x0, x1);
    meta.stream?.forEach((it, k) => {
      slots.push({ ...row.pts[k], k: `s${k}` });
      if (!inHeap.has(it.id) && !inTray.has(it.id)) pos.set(it.id, { ...row.pts[k], zone: "stream" });
    });
    y += row.h + 18;
  }
  if (mode === "merge-k" && meta.lists) {
    const lab = 64;
    meta.lists.forEach((lst, i) => {
      const row = slotRow(lst.length, y, x0 + lab, x1);
      cap(`lists[${i}]`, x0, y + r + 4);
      lst.forEach((it, j) => {
        slots.push({ ...row.pts[j], k: `l${i}-${j}` });
        if (!inHeap.has(it.id) && !inTray.has(it.id)) pos.set(it.id, { ...row.pts[j], zone: "stream" });
      });
      y += row.h + 8;
    });
    y += 10;
  }

  if (mode === "median") {
    const gap = 16, half = (x1 - x0 - gap) / 2;
    cap("lo: lower half, max-heap", x0, y + 12); cap("hi: upper half, min-heap", x0 + half + gap, y + 12); y += 22;
    const th = Math.max(tree(0, f.heaps[0], sizeAt(0), x0, x0 + half, y, "max"), tree(1, f.heaps[1], sizeAt(1), x0 + half + gap, x1, y, "min"));
    y += th + 18;
    cap("self.lo (stores -x)", x0, y + 12); cap("self.hi", x0 + half + gap, y + 12); y += 18;
    listRow(f.heaps[0], sizeAt(0), x0, x0 + half, y, false, (it) => String(it.key[0]));
    y += listRow(f.heaps[1], sizeAt(1), x0 + half + gap, x1, y, false, (it) => String(it.key[0]));
  } else {
    const title = mode === "basics" ? "h as a tree" : mode === "top-k" ? `h: min-heap, at most k + 1 items` : "h: min-heap of (value, i, j)";
    cap(title, x0, y + 12); y += 22;
    y += tree(0, f.heaps[0], sizeAt(0), x0, x1, y, "h[0]") + 18;
    cap("h as a list (what Python stores)", x0, y + 12); y += 18;
    y += listRow(f.heaps[0], sizeAt(0), x0, x1, y, mode === "merge-k", (it) => (mode === "merge-k" ? `(${it.key.join(",")})` : String(it.v)));
  }

  if (meta.trayMax > 0) {
    y += 10;
    cap(mode === "basics" ? "popped" : mode === "top-k" ? "popped: too small for the top k" : mode === "merge-k" ? "out" : "", x0, y + 12); y += 20;
    const row = slotRow(meta.trayMax, y, x0, x1);
    row.pts.forEach((p, k) => slots.push({ ...p, k: `t${k}` }));
    f.tray.forEach((it, k) => pos.set(it.id, { ...row.pts[k], zone: "tray" }));
    y += row.h;
  }
  const H = Math.ceil(y + 8);

  const toks = [...pos.entries()];
  const valOf = new Map<number, number>();
  f.heaps.forEach((h) => h.forEach((it) => valOf.set(it.id, it.v)));
  f.tray.forEach((it) => valOf.set(it.id, it.v));
  meta.stream?.forEach((it) => !valOf.has(it.id) && valOf.set(it.id, it.v));
  meta.lists?.forEach((l) => l.forEach((it) => !valOf.has(it.id) && valOf.set(it.id, it.v)));

  return (
    <div ref={ref} className="hp-view">
      <svg className={`pl-svg hp-m-${mode}`} viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img"
        aria-label={f.heaps.map((h, i) => `${f.heaps.length > 1 ? (i ? "hi" : "lo") : "h"} = [${h.map((it) => it.key[0]).join(", ")}]`).join("; ")}>
        {caps}
        {slots.map((s) => <circle key={s.k} cx={s.x} cy={s.y} r={r - 1} className="hp-slot" />)}
        {edges.map((e) => <line key={e.k} x1={e.a.x} y1={e.a.y} x2={e.b.x} y2={e.b.y} className={`hp-edge${e.on ? " on" : ""}`} />)}
        {rootTags.map((t, i) => <text key={`rt${i}`} x={t.x - r - 6} y={t.y + 4} textAnchor="end" className="pl-cap">{t.t}</text>)}
        <AnimatePresence initial={false}>
          {cells.map((c) => (
            <motion.g key={`L${c.id}`} className={`hp-cell${c.hl ? ` hl-${c.hl}` : ""}`} initial={{ x: c.x, y: c.y, opacity: 0 }} animate={{ x: c.x, y: c.y, opacity: 1 }} exit={{ opacity: 0 }} transition={move}>
              <rect x={0} y={0} width={c.w} height={30} rx={7} />
              <text x={c.w / 2} y={20} textAnchor="middle" className="hp-cell-t">{c.text}</text>
              <text x={c.w / 2} y={44} textAnchor="middle" className="pl-cap hp-cell-i">{c.idx}</text>
            </motion.g>
          ))}
        </AnimatePresence>
        <AnimatePresence initial={false}>
          {toks.map(([id, p]) => (
            <motion.g key={id} className={`hp-tok z-${p.zone}${f.hl[id] ? ` hl-${f.hl[id]}` : ""}`}
              initial={{ x: p.x, y: p.y, opacity: 0, scale: 0.6 }} animate={{ x: p.x, y: p.y, opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.6 }} transition={move}>
              <circle r={r} />
              <text y={fs * 0.36} textAnchor="middle" style={{ fontSize: fs }}>{valOf.get(id)}</text>
            </motion.g>
          ))}
        </AnimatePresence>
      </svg>
      {f.vars.length > 0 && <div className="pl-vars" aria-label="Variables">{f.vars.map(([k, v]) => <span key={k} className="pl-var">{k} = <b>{v}</b></span>)}</div>}
    </div>
  );
}
