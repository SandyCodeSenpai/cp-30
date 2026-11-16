/**
 * Grid model + pure frame builders for the four grid modes.
 * Each builder runs the real algorithm once and records a frame (state, code line, narration) per step.
 */
import type { BaseFrame } from "./kit/player";

export type GridMode = "bfs" | "dfs" | "multi-source" | "zero-one";
export const MODES: { value: GridMode; label: string }[] = [
  { value: "bfs", label: "BFS" },
  { value: "dfs", label: "DFS islands" },
  { value: "multi-source", label: "Multi-source" },
  { value: "zero-one", label: "0-1 BFS" },
];

/** `block[i]` means: wall (bfs, multi-source: empty cell with no orange), land (dfs), obstacle that costs 1 (zero-one). */
export interface Grid { R: number; C: number; block: boolean[]; sources: number[]; target: number | null }

export const LIMITS = { minR: 3, maxR: 12, minC: 3, maxC: 16, maxSources: 8 };

export interface QItem { id: number; cell: number }
export interface GridFrame extends BaseFrame {
  dist: number[];            // -1 = not seen (bfs); Infinity = INF (zero-one); unused in dfs
  q: QItem[];                // queue / deque / stack (front or bottom first)
  cur: number;               // cell just popped, -1 = none
  fresh: number[];           // cells pushed in this step
  look: number;              // neighbour being relaxed (zero-one), -1 = none
  end?: "front" | "back";    // where `look` went (zero-one)
  island: number[];          // dfs: island number per cell, 0 = not seen
  scan: number;              // dfs: the scan position s, -1 = none
  comps: number;
  path: number[];            // final shortest path (cells), empty until the end
  done: boolean;
}

const DIRS: [number, number][] = [[1, 0], [-1, 0], [0, 1], [0, -1]];
export const rc = (g: Grid, i: number) => `(${Math.floor(i / g.C)}, ${i % g.C})`;
const list = (g: Grid, cells: number[]) => cells.map((c) => rc(g, c)).join(", ");

function neighbours(g: Grid, u: number): { cell: number; out: boolean }[] {
  const r = Math.floor(u / g.C), c = u % g.C;
  return DIRS.map(([dr, dc]) => {
    const nr = r + dr, nc = c + dc;
    const out = nr < 0 || nr >= g.R || nc < 0 || nc >= g.C;
    return { cell: out ? -1 : nr * g.C + nc, out };
  });
}

/* ---------------- Text format ---------------- */

const CHARS: Record<GridMode, { open: string; block: string; src: boolean; tgt: boolean }> = {
  "bfs": { open: ".", block: "#", src: true, tgt: true },
  "multi-source": { open: ".", block: "#", src: true, tgt: false },
  "dfs": { open: "0", block: "1", src: false, tgt: false },
  "zero-one": { open: "0", block: "1", src: true, tgt: true },
};

export function legend(mode: GridMode): string {
  switch (mode) {
    case "bfs": return "One row per line. . = open, # = wall, S = start, T = target.";
    case "multi-source": return "One row per line. . = fresh orange, # = empty cell, S = rotten orange (a source). Up to 8 sources.";
    case "dfs": return "One row per line. 1 = land, 0 = water.";
    case "zero-one": return "One row per line. 0 = free cell, 1 = obstacle (costs 1 to enter), S = start, T = target.";
  }
}

export function toText(g: Grid, mode: GridMode): string {
  const ch = CHARS[mode];
  const rows: string[] = [];
  for (let r = 0; r < g.R; r++) {
    let s = "";
    for (let c = 0; c < g.C; c++) {
      const i = r * g.C + c;
      s += ch.src && g.sources.includes(i) ? "S" : ch.tgt && g.target === i ? "T" : g.block[i] ? ch.block : ch.open;
    }
    rows.push(s);
  }
  return rows.join("\n");
}

export function parseGrid(text: string, mode: GridMode): Grid | string {
  const ch = CHARS[mode];
  const rows = text.split(/[\n/]+/).map((s) => s.replace(/[\s,]/g, "")).filter(Boolean);
  if (rows.length < LIMITS.minR || rows.length > LIMITS.maxR) return `Use ${LIMITS.minR} to ${LIMITS.maxR} rows.`;
  const C = rows[0].length;
  if (C < LIMITS.minC || C > LIMITS.maxC) return `Use ${LIMITS.minC} to ${LIMITS.maxC} columns.`;
  if (rows.some((r) => r.length !== C)) return "Every row must have the same length.";
  const g: Grid = { R: rows.length, C, block: [], sources: [], target: null };
  for (let r = 0; r < g.R; r++) for (let c = 0; c < C; c++) {
    const x = rows[r][c].toUpperCase(), i = r * C + c;
    if (x === ch.open) g.block.push(false);
    else if (x === ch.block) g.block.push(true);
    else if (x === "S" && ch.src) { g.block.push(false); g.sources.push(i); }
    else if (x === "T" && ch.tgt) { if (g.target !== null) return "Use only one T."; g.block.push(false); g.target = i; }
    else return `"${rows[r][c]}" is not allowed here. ${legend(mode)}`;
  }
  if (ch.src && g.sources.length === 0) return "Add an S.";
  if ((mode === "bfs" || mode === "zero-one") && g.sources.length > 1) return "Use only one S.";
  if (g.sources.length > LIMITS.maxSources) return `Use at most ${LIMITS.maxSources} sources.`;
  if (ch.tgt && g.target === null) return "Add a T.";
  return g;
}

/* ---------------- Presets and random ---------------- */

export const PRESETS: Record<GridMode, { label: string; text: string; full?: boolean }[]> = {
  "bfs": [
    { label: "Maze", text: "S...#....\n.##.#.##.\n.#..#..#.\n.#.##.#..\n.#....#.#\n...##...T" },
    { label: "Open field", text: ".........\n.........\n....S....\n.........\n.........\n........T" },
    { label: "No way out", text: "S..#.....\n...#.....\n...#..T..\n####.....\n.........\n........." },
    { label: "Big grid", full: true, text: "S.....#.......\n.####.#..###..\n.#......#.....\n.#.###..#.##.#\n......#.......\n.####.#..###..\n.#....#....#..\n...##...##...T" },
  ],
  "multi-source": [
    { label: "Rotting oranges", text: "S.#......\n...#..#..\n.#...S...\n....##...\n#........\n.....#..S" },
    { label: "One orange cut off", text: "S..#.....\n...#..S..\n...#.....\n####.....\n.##......\n.#......." },
    { label: "Corners", text: "S.......S\n.........\n...###...\n.........\nS.......S" },
    { label: "Big field", full: true, text: "S.....#.......\n......#..S....\n..###.........\n......##..#...\n.#.........#..\n.#..S.........\n...........##.\n.....##......S" },
  ],
  "dfs": [
    { label: "Three islands", text: "110001100\n110000100\n000110000\n000111001\n100000011\n110000001" },
    { label: "One big island", text: "011110000\n010010000\n011110110\n000010010\n000011110\n000000000" },
    { label: "Checkerboard", text: "101010101\n010101010\n101010101\n010101010\n101010101\n010101010" },
    { label: "Archipelago", full: true, text: "11000011000111\n11001011000101\n00001000110001\n01100000110000\n01101110000110\n00001110110110\n11000000110000\n11011000000011" },
  ],
  "zero-one": [
    { label: "Obstacle wall", text: "S01000000\n001011110\n101000010\n001110110\n000010100\n011010001\n00001110T" },
    { label: "Free corridor", text: "S11111111\n011111111\n000000001\n111111101\n11111110T" },
    { label: "All obstacles", text: "S1111\n11111\n11111\n1111T" },
    { label: "Big field", full: true, text: "S0100010001000\n00101010101011\n11100010100000\n00001110111110\n01100000001000\n01011111101011\n01000100001000\n0001010111011T" },
  ],
};

export function presetGrid(mode: GridMode, full: boolean): Grid {
  const list = PRESETS[mode];
  const p = full ? list.find((x) => x.full) ?? list[0] : list[0];
  return parseGrid(p.text, mode) as Grid;
}

/** Random grid of a given size. rand() is injectable so a seeded rng gives the same grid every time. */
export function randomGrid(mode: GridMode, R: number, C: number, rand: () => number = Math.random): Grid {
  const N = R * C;
  const density = mode === "dfs" ? 0.42 : mode === "zero-one" ? 0.38 : 0.24;
  const block = Array.from({ length: N }, () => rand() < density);
  const g: Grid = { R, C, block, sources: [], target: null };
  if (mode === "bfs" || mode === "zero-one") { g.sources = [0]; g.target = N - 1; block[0] = false; block[N - 1] = false; }
  if (mode === "multi-source") {
    const k = 2 + Math.floor(rand() * 2);
    while (g.sources.length < k) { const i = Math.floor(rand() * N); if (!g.sources.includes(i)) { g.sources.push(i); block[i] = false; } }
  }
  return g;
}

/** Fit a grid to a new size (keeps what fits, keeps S and T inside). */
export function resizeGrid(g: Grid, mode: GridMode, R: number, C: number): Grid {
  const block: boolean[] = [];
  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) block.push(r < g.R && c < g.C ? g.block[r * g.C + c] : false);
  const move = (i: number) => { const r = Math.min(R - 1, Math.floor(i / g.C)), c = Math.min(C - 1, i % g.C); return r * C + c; };
  const sources = [...new Set(g.sources.map(move))];
  let target = g.target === null ? null : move(g.target);
  if (target !== null && sources.includes(target)) target = sources[0] === R * C - 1 ? 0 : R * C - 1;
  for (const s of sources) block[s] = false;
  if (target !== null) block[target] = false;
  return { R, C, block, sources: mode === "dfs" ? [] : sources, target };
}

/* ---------------- Frame builders ---------------- */

function base(): Omit<GridFrame, "line" | "say"> {
  return { dist: [], q: [], cur: -1, fresh: [], look: -1, island: [], scan: -1, comps: 0, path: [], done: false };
}

/** grid_bfs(grid, sources): single-source (bfs) and multi-source. */
export function bfsFrames(g: Grid, mode: "bfs" | "multi-source"): GridFrame[] {
  const N = g.R * g.C, multi = mode === "multi-source";
  const dist = new Array<number>(N).fill(-1);
  const parent = new Array<number>(N).fill(-1);
  let q: QItem[] = []; let qid = 0;
  const frames: GridFrame[] = [];
  const snap = (f: Partial<GridFrame> & { line: number; say: string }) => frames.push({ ...base(), dist: dist.slice(), q: q.slice(), ...f });

  snap({ line: 7, say: multi
    ? "`dist` starts at -1 everywhere: -1 means not reached yet. Every rotten orange (S) is a source."
    : "`dist` starts at -1 everywhere: -1 means not seen yet. The queue is empty." });
  g.sources.forEach((s, k) => {
    dist[s] = 0; q.push({ id: qid++, cell: s });
    snap({ line: 11, line2: 10, fresh: [s], say: multi
      ? `Source ${rc(g, s)} gets dist 0 and goes into the queue${k === 0 ? "" : ` (${k + 1} of ${g.sources.length})`}.`
      : `The start ${rc(g, s)} gets dist 0 and goes into the queue.` });
  });
  if (multi) snap({ line: 12, say: `All ${g.sources.length} sources are in the queue before the loop starts. That is the whole trick: they spread at the same time.` });

  let pops = 0, reachedT = false;
  while (q.length) {
    const item = q[0]; q = q.slice(1);
    const u = item.cell, d = dist[u];
    pops++;
    const front = q[0];
    snap({ line: 13, cur: u, say: `\`popleft()\` takes ${rc(g, u)}, the oldest cell in the queue. Its dist is ${d}.${g.target === u ? " This is the target T." : ""}` });
    const popAt = frames.length - 1;
    const fresh: number[] = []; let walls = 0, seen = 0, out = 0;
    for (const nb of neighbours(g, u)) {
      if (nb.out) { out++; continue; }
      if (dist[nb.cell] !== -1) { seen++; continue; }
      if (g.block[nb.cell]) { walls++; continue; }
      dist[nb.cell] = d + 1; parent[nb.cell] = u; q.push({ id: qid++, cell: nb.cell }); fresh.push(nb.cell);
    }
    const skip = [walls && `${walls} wall${walls > 1 ? "s" : ""}`, seen && `${seen} already seen`, out && `${out} outside`].filter(Boolean).join(", ");
    if (fresh.length) {
      const hitT = g.target !== null && fresh.includes(g.target) && !reachedT;
      if (hitT) reachedT = true;
      snap({ line: 17, line2: 18, cur: u, fresh, say:
        `Push ${list(g, fresh)} with dist ${d + 1}${pops <= 2 ? ", and mark them now, on push, so no cell enters the queue twice" : ""}.` +
        (skip ? ` Skip: ${skip}.` : "") +
        (hitT ? ` T is reached: the shortest path has ${d + 1} steps. You could stop here; the template fills the rest.` : "") });
      // Predict: ask about the distance new neighbours get (first pops, then every 5th).
      if (pops <= 2 || pops % 5 === 0) frames[popAt].ask = {
        q: `${rc(g, u)} has dist ${d}. What dist do its new neighbours get?`,
        options: [`${d}`, `${d + 1}`, `${d + 2}`], answer: 1,
        why: `Every step costs 1, so a neighbour found from a dist-${d} cell is ${d + 1} steps away.`,
      };
    } else {
      snap({ line: 16, cur: u, say: `No new neighbours: ${skip || "nothing around"}.` });
    }
    // Predict: which cell comes out next (FIFO), asked before the next pop.
    if (q.length >= 3 && pops % 5 === 3 && front) {
      const back = q[q.length - 1].cell;
      if (back !== q[0].cell) frames[frames.length - 1].ask = {
        q: "Which cell does `popleft()` take next?",
        options: [`${rc(g, q[0].cell)} (front)`, `${rc(g, back)} (back)`], answer: 0,
        why: "A queue is first in, first out. The front cell was pushed earliest, so it is never farther than the cells behind it.",
      };
    }
  }

  const open = g.block.map((b) => !b);
  let say: string;
  let path: number[] = [];
  if (!multi) {
    const t = g.target!;
    if (dist[t] === -1) say = `The queue is empty. \`dist[T]\` is still -1: there is no path to T. Return -1.`;
    else {
      path = walkBack(parent, t);
      say = `The queue is empty. \`dist[T] = ${dist[t]}\`. The green path walks back from T, each step to a neighbour with dist one smaller.`;
    }
  } else {
    const fresh = open.filter((o, i) => o && dist[i] === -1).length;
    const mx = Math.max(0, ...dist);
    say = fresh
      ? `The queue is empty, but ${fresh} fresh orange${fresh > 1 ? "s are" : " is"} still at -1. They can never rot, so the answer is -1.`
      : `The queue is empty. Every orange is reached. The answer is the largest dist: ${mx} minute${mx === 1 ? "" : "s"}.`;
  }
  snap({ line: 19, say, path, done: true });
  return frames;
}

/** count_components on the land cells of a grid (iterative DFS). */
export function dfsFrames(g: Grid): GridFrame[] {
  const N = g.R * g.C;
  const island = new Array<number>(N).fill(0);
  let stack: QItem[] = []; let qid = 0; let comps = 0;
  const frames: GridFrame[] = [];
  const snap = (f: Partial<GridFrame> & { line: number; say: string }) => frames.push({ ...base(), island: island.slice(), q: stack.slice(), comps, ...f });
  const land = g.block.filter(Boolean).length;

  snap({ line: 3, line2: 2, say: `A node is a land cell (n = ${land}). \`adj[u]\` = its land neighbours: down, up, right, left. Nothing is seen yet, \`comps = 0\`.` });
  let islandsAsked = 0;
  for (let s = 0; s < N; s++) {
    if (!g.block[s] || island[s]) continue;
    comps++; island[s] = comps; stack = [{ id: qid++, cell: s }];
    // Predict before a new island starts.
    if (islandsAsked < 2 || comps % 3 === 0) {
      islandsAsked++;
      frames[frames.length - 1].ask = {
        q: `The scan reaches ${rc(g, s)}: land, not seen yet. What happens?`,
        options: [`A new island: \`comps += 1\``, "Skip it, it belongs to an old island"], answer: 0,
        why: "If an earlier island touched this cell, its DFS would have marked it seen. Not seen means a new island.",
      };
    }
    snap({ line: 9, line2: 7, scan: s, fresh: [s], say: comps === 1
      ? `The scan reaches ${rc(g, s)}: land and not seen. New island: \`comps = 1\`. Mark it and start a stack.`
      : `The scan skips water and seen land, and stops at ${rc(g, s)}: a new island. \`comps = ${comps}\`.` });
    let pops = 0;
    while (stack.length) {
      const top = stack[stack.length - 1]; stack = stack.slice(0, -1);
      const u = top.cell; pops++;
      snap({ line: 11, cur: u, scan: s, say: `\`stack.pop()\` takes ${rc(g, u)}, the newest cell (the top of the stack).` });
      const fresh: number[] = [];
      for (const nb of neighbours(g, u)) {
        if (nb.out || !g.block[nb.cell] || island[nb.cell]) continue;
        island[nb.cell] = comps; stack.push({ id: qid++, cell: nb.cell }); fresh.push(nb.cell);
      }
      if (fresh.length) snap({ line: 15, line2: 14, cur: u, scan: s, fresh, say: `Push ${list(g, fresh)}. Mark them seen now, so they are pushed only once.` });
      else snap({ line: 13, cur: u, scan: s, say: "No unseen land around it. Nothing to push." });
      if (stack.length >= 2 && pops % 3 === 2) {
        frames[frames.length - 1].ask = {
          q: "Which cell does `stack.pop()` take next?",
          options: [`${rc(g, stack[stack.length - 1].cell)} (top, pushed last)`, `${rc(g, stack[0].cell)} (bottom, pushed first)`], answer: 0,
          why: "A stack is last in, first out. DFS goes deep along the newest cell first.",
        };
      }
    }
    const size = island.filter((x) => x === comps).length;
    snap({ line: 10, scan: s, say: `The stack is empty: island ${comps} is done (${size} cell${size > 1 ? "s" : ""}). The scan moves on.` });
  }
  snap({ line: 16, done: true, say: comps
    ? `The scan has passed every cell. \`comps = ${comps}\`: there ${comps === 1 ? "is 1 island" : `are ${comps} islands`}. Each cell was pushed once: O(R·C).`
    : "There is no land, so `comps = 0`." });
  return frames;
}

/** zero_one_bfs on a grid; cost = 1 to enter an obstacle, else 0 (LC 2290). */
export function zeroOneFrames(g: Grid): GridFrame[] {
  const N = g.R * g.C, INF = Infinity;
  const dist = new Array<number>(N).fill(INF);
  const parent = new Array<number>(N).fill(-1);
  const s = g.sources[0], t = g.target!;
  let dq: QItem[] = []; let qid = 0;
  const frames: GridFrame[] = [];
  const snap = (f: Partial<GridFrame> & { line: number; say: string }) => frames.push({ ...base(), dist: dist.slice(), q: dq.slice(), ...f });
  const cost = (c: number) => (g.block[c] ? 1 : 0);
  const fmt = (x: number) => (x === INF ? "INF" : String(x));

  snap({ line: 5, line2: 4, say: "`dist` starts at INF everywhere. Entering a free cell costs 0. Entering an obstacle costs 1." });
  dist[s] = 0; dq = [{ id: qid++, cell: s }];
  snap({ line: 8, line2: 7, fresh: [s], say: `The start ${rc(g, s)} gets dist 0. The deque holds only the start.` });

  const popped = new Set<number>();
  let relaxes = 0;
  while (dq.length) {
    const item = dq[0]; dq = dq.slice(1);
    const u = item.cell, d = dist[u];
    const again = popped.has(u); popped.add(u);
    snap({ line: 10, cur: u, say: again
      ? `\`popleft()\` takes ${rc(g, u)} a second time. Its neighbours were already relaxed with dist ${d}, so nothing will improve. That is harmless.`
      : `\`popleft()\` takes ${rc(g, u)} from the front. Its dist is ${d}, the smallest in the deque.` });
    let any = false;
    for (const nb of neighbours(g, u)) {
      if (nb.out) continue;
      const v = nb.cell, w = cost(v), nd = d + w;
      if (nd < dist[v]) {
        const old = dist[v];
        // Predict: ask before this relaxation which end it goes to.
        relaxes++;
        if (relaxes <= 4 || relaxes % 4 === 0) frames[frames.length - 1].ask = {
          q: `Entering ${rc(g, v)} costs ${w}, so \`nd = ${nd}\`. Which end of the deque does it go to?`,
          options: ["The front (`appendleft`)", "The back (`append`)"], answer: w === 0 ? 0 : 1,
          why: w === 0 ? "Cost 0 means the same distance as the cell we just popped, so it belongs at the front." : "Cost 1 means one more than the front, so it waits at the back.",
        };
        dist[v] = nd; parent[v] = u;
        if (w === 0) dq = [{ id: qid++, cell: v }, ...dq]; else dq = [...dq, { id: qid++, cell: v }];
        any = true;
        snap({ line: w === 0 ? 19 : 21, line2: 17, cur: u, look: v, fresh: [v], end: w === 0 ? "front" : "back", say: w === 0
          ? `${rc(g, v)} is free: cost 0, \`nd = ${nd} < ${fmt(old)}\`. Same distance, so \`appendleft\`: it goes to the FRONT.`
          : `${rc(g, v)} is an obstacle: cost 1, \`nd = ${nd} < ${fmt(old)}\`. One more, so \`append\`: it goes to the BACK.` });
      }
    }
    if (!any && !again) snap({ line: 16, cur: u, say: "No neighbour gets a smaller dist from here." });
  }
  const path = walkBack(parent, t);
  snap({ line: 22, path, done: true, say: `The deque is empty. \`dist[T] = ${dist[t]}\`: you must remove ${dist[t]} obstacle${dist[t] === 1 ? "" : "s"}. The deque stayed sorted by dist the whole time, like Dijkstra without a heap.` });
  return frames;
}

function walkBack(parent: number[], t: number): number[] {
  const path = [t]; let c = t; let guard = parent.length;
  while (parent[c] !== -1 && guard-- > 0) { c = parent[c]; path.push(c); }
  return path.reverse();
}

export function buildFrames(g: Grid, mode: GridMode): GridFrame[] {
  if (mode === "dfs") return dfsFrames(g);
  if (mode === "zero-one") return zeroOneFrames(g);
  return bfsFrames(g, mode);
}
