import { useMemo, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useWidth } from "@/lib/hooks";
import type { Tone } from "@/content/types";
import { PlayerView, type EditorSpec } from "./kit/PlayerView";
import { usePlayer } from "./kit/player";
import { randInt, sn } from "./kit/parse";
import { GRID_CODE, gridFrames, gridQueryStart, type GridS, type Rect } from "./frames";
import { Formula, T, useMotion } from "./track";

const LC304 = [[3, 0, 1, 4, 2], [5, 6, 3, 2, 1], [1, 2, 0, 1, 5], [4, 1, 0, 1, 7], [1, 0, 3, 0, 5]];
const PRESETS: { label: string; g: number[][]; q: Rect }[] = [
  { label: "LC 304 example", g: LC304, q: { r1: 2, c1: 1, r2: 4, c2: 3 } },
  { label: "Small 3 × 4", g: [[1, 2, 3, 4], [5, 6, 7, 8], [9, 1, 2, 3]], q: { r1: 1, c1: 1, r2: 2, c2: 2 } },
];
const M = "−";
const gStr = (g: number[][]) => g.map((r) => r.join(" ")).join("; ");
const qStr = (q: Rect) => `${q.r1} ${q.c1} ${q.r2} ${q.c2}`;

function parseGrid(t: string): { ok: true; value: number[][] } | { ok: false; error: string } {
  const rows = t.split(/[;\n]+/).map((r) => r.trim()).filter(Boolean).map((r) => r.split(/[\s,]+/).filter(Boolean));
  if (rows.length < 2 || rows.length > 6) return { ok: false, error: "Use 2 to 6 rows, separated by ;" };
  const m = rows[0].length;
  if (m < 2 || m > 6) return { ok: false, error: "Use 2 to 6 numbers in each row." };
  if (rows.some((r) => r.length !== m)) return { ok: false, error: "Every row needs the same number of values." };
  if (rows.some((r) => r.some((x) => !/^-?\d+$/.test(x)))) return { ok: false, error: "Use whole numbers only." };
  const g = rows.map((r) => r.map(Number));
  if (g.some((r) => r.some((v) => v < -9 || v > 99))) return { ok: false, error: "Keep values between -9 and 99." };
  return { ok: true, value: g };
}

export default function Grid2D({ grid, onEnd }: { grid?: number[][]; onEnd: () => void }) {
  const g0 = grid && grid.length >= 2 && grid[0]?.length >= 2 ? grid : LC304;
  const [g, setG] = useState(g0);
  const [q, setQ] = useState<Rect>(g0 === LC304 ? PRESETS[0].q : { r1: 0, c1: 0, r2: 1, c2: 1 });
  const [anchor, setAnchor] = useState<[number, number] | null>(null);
  const frames = useMemo(() => gridFrames(g, q), [g, q]);
  const pl = usePlayer(frames, `g2:${gStr(g)}`, onEnd);
  const s = pl.frame.s, qStart = gridQueryStart(g), built = pl.i >= qStart - 1;

  const [gt, setGt] = useState(gStr(g));
  const [qt, setQt] = useState(qStr(q));
  const [err, setErr] = useState<string | null>(null);
  const load = (ng: number[][], nq: Rect) => { setG(ng); setQ(nq); setGt(gStr(ng)); setQt(qStr(nq)); setErr(null); setAnchor(null); };
  const editor: EditorSpec = {
    fields: [
      { id: "g", label: "Grid rows, separated by ;", value: gt, onChange: setGt, placeholder: "1 2 3; 4 5 6" },
      { id: "q", label: "Query: r1 c1 r2 c2", value: qt, onChange: setQt, placeholder: "0 0 1 1" },
    ],
    error: err,
    onApply: () => {
      const G = parseGrid(gt); if (!G.ok) return setErr(G.error);
      const p = qt.split(/[\s,]+/).filter(Boolean).map(Number);
      const n = G.value.length, m = G.value[0].length;
      if (p.length !== 4 || p.some((v) => !Number.isInteger(v))) return setErr("Query needs four whole numbers: r1 c1 r2 c2.");
      const [r1, c1, r2, c2] = p;
      if (r1 < 0 || c1 < 0 || r2 >= n || c2 >= m || r1 > r2 || c1 > c2) return setErr(`Need 0 ≤ r1 ≤ r2 ≤ ${n - 1} and 0 ≤ c1 ≤ c2 ≤ ${m - 1}.`);
      load(G.value, { r1, c1, r2, c2 });
    },
    onRandom: () => {
      const n = randInt(3, 5), m = randInt(3, 5);
      const ng = Array.from({ length: n }, () => Array.from({ length: m }, () => randInt(0, 9)));
      const r1 = randInt(0, n - 2), c1 = randInt(0, m - 2);
      load(ng, { r1, c1, r2: randInt(r1 + 1, n - 1), c2: randInt(c1 + 1, m - 1) });
    },
    presets: PRESETS.map((p) => ({ label: p.label, onClick: () => load(p.g, p.q) })),
  };
  const onCell = built ? (i: number, j: number) => {
    if (!anchor) { setAnchor([i, j]); return; }
    const nq = { r1: Math.min(anchor[0], i), c1: Math.min(anchor[1], j), r2: Math.max(anchor[0], i), c2: Math.max(anchor[1], j) };
    setAnchor(null); setQ(nq); setQt(qStr(nq)); pl.jump(qStart);
  } : undefined;

  return (
    <PlayerView pl={pl} code={GRID_CODE} codeTitle="build_2d(g), rect(P, r1, c1, r2, c2)"
      stageLabel={`Grid g with ${g.length} rows and ${g[0].length} columns, and its 2-D prefix table P.`}
      editor={editor}
      hint={built ? (anchor ? `Now tap the opposite corner (first corner: row ${anchor[0]}, column ${anchor[1]}).` : "Tap a cell in g, then another, to ask a new rectangle.") : undefined}
      stage={<GridStage s={s} onCell={onCell} anchor={anchor} />} />
  );
}

type CellMark = { tone: Tone | "soft"; sign?: string };

function GridStage({ s, onCell, anchor }: { s: GridS; onCell?: (i: number, j: number) => void; anchor: [number, number] | null }) {
  const ref = useRef<HTMLDivElement>(null);
  const w = useWidth(ref) || 600;
  const { move } = useMotion();
  const n = s.g.length, m = s.g[0].length;
  const GAP = 4, LAB = 22;
  const side = w >= (2 * m + 1) * 44 + 2 * LAB + 48;
  const cs = side ? Math.min(52, Math.floor((w - 2 * LAB - 48) / (2 * m + 1)) - GAP) : Math.max(34, Math.min(50, Math.floor((w - LAB) / (m + 1)) - GAP));
  const st = cs + GAP;

  // marks
  const gMark: Record<string, CellMark> = {}, pMark: Record<string, CellMark> = {};
  const overlays: { r1: number; c1: number; r2: number; c2: number; cls: string; label?: string }[] = [];
  if (s.cur) {
    const [i, j] = s.cur;
    overlays.push({ r1: 0, c1: 0, r2: i, c2: j, cls: "soft" });
    gMark[`${i},${j}`] = { tone: "accent" };
    pMark[`${i + 1},${j + 1}`] = { tone: "accent" };
    pMark[`${i},${j + 1}`] = { tone: "soft", sign: "+" };
    pMark[`${i + 1},${j}`] = { tone: "soft", sign: "+" };
    pMark[`${i},${j}`] = { tone: "warn", sign: M };
  }
  if (s.q && s.qs > 0) {
    const { r1, c1, r2, c2 } = s.q;
    if (s.qs >= 2 && s.qs < 6) overlays.push({ r1: 0, c1: 0, r2, c2, cls: "soft" });
    if (s.qs >= 3 && s.qs < 6 && r1 > 0) overlays.push({ r1: 0, c1: 0, r2: r1 - 1, c2, cls: "minus" });
    if (s.qs >= 4 && s.qs < 6 && c1 > 0) overlays.push({ r1: 0, c1: 0, r2, c2: c1 - 1, cls: "minus" });
    if (s.qs === 5 && r1 > 0 && c1 > 0) overlays.push({ r1: 0, c1: 0, r2: r1 - 1, c2: c1 - 1, cls: "plus" });
    overlays.push({ r1, c1, r2, c2, cls: s.qs === 6 ? "good" : "query" });
    if (s.qs >= 2) pMark[`${r2 + 1},${c2 + 1}`] = { tone: "accent", sign: "+" };
    if (s.qs >= 3) pMark[`${r1},${c2 + 1}`] = { tone: "warn", sign: M };
    if (s.qs >= 4) pMark[`${r2 + 1},${c1}`] = { tone: "warn", sign: M };
    if (s.qs >= 5) pMark[`${r1},${c1}`] = { tone: "accent", sign: "+" };
  }
  if (anchor) gMark[`${anchor[0]},${anchor[1]}`] = { tone: "neutral" };

  const table = (rows: number, cols: number, cell: (i: number, j: number) => ReactNode, label: string, extra?: ReactNode) => (
    <div className="ps-gblock">
      <div className="ps-gname">{label}</div>
      <div className="ps-grid" style={{ width: LAB + cols * st, height: LAB + rows * st }}>
        {Array.from({ length: cols }, (_, j) => <div key={`c${j}`} className="ps-gidx" style={{ left: LAB + j * st, top: 0, width: cs, height: LAB }}>{j}</div>)}
        {Array.from({ length: rows }, (_, i) => <div key={`r${i}`} className="ps-gidx" style={{ left: 0, top: LAB + i * st, width: LAB - 4, height: cs }}>{i}</div>)}
        {Array.from({ length: rows }, (_, i) => Array.from({ length: cols }, (_, j) => cell(i, j)))}
        {extra}
      </div>
    </div>
  );

  const gCell = (i: number, j: number) => {
    const mk = gMark[`${i},${j}`];
    const El = onCell ? "button" : "div";
    return (
      <El key={`${i},${j}`} className={`ps-gcell${mk ? ` m-${mk.tone}` : ""}${onCell ? " click" : ""}`} style={{ left: LAB + j * st, top: LAB + i * st, width: cs, height: cs }}
        {...(onCell ? { type: "button" as const, onClick: () => onCell(i, j), "aria-label": `g[${i}][${j}] = ${s.g[i][j]}` } : {})}>
        {sn(s.g[i][j])}
      </El>
    );
  };
  const pCell = (i: number, j: number) => {
    const v = s.P[i][j], mk = pMark[`${i},${j}`];
    return (
      <div key={`${i},${j}`} className={`ps-gcell p${mk ? ` m-${mk.tone}` : ""}${v === null ? " empty" : ""}${i === 0 || j === 0 ? " zero" : ""}`} style={{ left: LAB + j * st, top: LAB + i * st, width: cs, height: cs }}>
        {v === null ? "" : sn(v)}
        {mk?.sign && <span className="ps-sign">{mk.sign}</span>}
      </div>
    );
  };
  const gOver = (
    <AnimatePresence>
      {overlays.map((o, k) => (
        <motion.div key={`${o.cls}-${k}`} className={`ps-gover ${o.cls}`}
          initial={{ opacity: 0, left: LAB + o.c1 * st - 2, top: LAB + o.r1 * st - 2, width: (o.c2 - o.c1 + 1) * st, height: (o.r2 - o.r1 + 1) * st }}
          animate={{ opacity: 1, left: LAB + o.c1 * st - 2, top: LAB + o.r1 * st - 2, width: (o.c2 - o.c1 + 1) * st, height: (o.r2 - o.r1 + 1) * st }}
          exit={{ opacity: 0 }} transition={move} />
      ))}
    </AnimatePresence>
  );

  const q = s.q, P = s.P as number[][];
  return (
    <div ref={ref}>
      <div className="ak-scroll">
        <div className={`ps-grids${side ? " side" : ""}`}>
          {table(n, m, gCell, "g", gOver)}
          {table(n + 1, m + 1, pCell, "P")}
        </div>
      </div>
      {q && s.qs >= 2 && (
        <Formula>
          <T tone="accent">P[{q.r2 + 1}][{q.c2 + 1}]</T>
          {s.qs >= 3 && <> {M} <T tone="warn">P[{q.r1}][{q.c2 + 1}]</T></>}
          {s.qs >= 4 && <> {M} <T tone="warn">P[{q.r2 + 1}][{q.c1}]</T></>}
          {s.qs >= 5 && <> + <T tone="accent">P[{q.r1}][{q.c1}]</T></>}
          {s.qs >= 6 && <> = {sn(P[q.r2 + 1][q.c2 + 1])} {M} {sn(P[q.r1][q.c2 + 1])} {M} {sn(P[q.r2 + 1][q.c1])} + {sn(P[q.r1][q.c1])} = <T tone="good">{sn(P[q.r2 + 1][q.c2 + 1] - P[q.r1][q.c2 + 1] - P[q.r2 + 1][q.c1] + P[q.r1][q.c1])}</T></>}
        </Formula>
      )}
    </div>
  );
}
