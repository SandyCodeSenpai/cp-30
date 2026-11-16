/**
 * Pure frame builders for the DP table lab. Each builder takes the input and returns every frame of the run:
 * the table values, the active cell, the cells it reads (arrows), the recurrence with real numbers,
 * the running code line and one sentence of narration. The component only moves an index.
 */
import type { Ask, BaseFrame } from "./kit/player";
import { numAsk } from "./kit/player";
import { COINS, EDIT, GRID, KNAP_1D, KNAP_2D, KNAP_FWD, LCS, ROB, STAIRS } from "./code";

export type Mode = "stairs" | "house-robber" | "grid-paths" | "lcs" | "edit-distance" | "knapsack" | "coin-change";
export type KnapView = "2d" | "back" | "fwd";
export type Cell = [number, number];
/** pick = the value that wins (accent) · read = also read (neutral) · bad = reads a value it must not (item reused) · ok = reuse that is allowed */
export type DepKind = "pick" | "read" | "bad" | "ok";
export interface Dep { r: number; c: number; kind: DepKind; label: string; value: string }
export interface Head { name: string; cells: string[]; strong?: boolean }
export interface TableSpec {
  rows: number; cols: number;
  colHeads: Head[]; rowHeads: Head[];
  base: string[]; blocked: string[];
  /** 1-D table: arrows between cells of the same row are drawn as arcs below the row. */
  arcs: boolean;
  /** rows carry tags such as "prev" / "cur" on the right. */
  tags: boolean;
  /** show the "updated in this pass" key */
  fresh?: boolean;
}
export interface DPFrame extends BaseFrame {
  vals: (string | null)[][];
  cur?: Cell;
  deps?: Dep[];
  sym?: string;
  num?: string;
  chip?: string;
  note?: string;
  fresh?: string[];
  path?: Cell[];
  answer?: Cell;
  answerTone?: "good" | "bad";
  rowTags?: (string | null)[];
  hiCols?: number[];
  hiRows?: number[];
  trace?: boolean;
}
export interface DPRun { spec: TableSpec; frames: DPFrame[]; code: string[]; title: string; result: string }

export interface Inputs {
  stairs: { n: number };
  "house-robber": { nums: number[] };
  "grid-paths": { grid: string[] };
  lcs: { a: string; b: string };
  "edit-distance": { a: string; b: string };
  knapsack: { items: [number, number][]; W: number };
  "coin-change": { coins: number[]; amount: number };
}

const k = (r: number, c: number) => `${r},${c}`;
const range = (n: number) => Array.from({ length: n }, (_, i) => i);
const idx = (n: number) => range(n).map(String);

class Builder {
  frames: DPFrame[] = [];
  constructor(public vals: (string | null)[][]) {}
  /** Push a frame. `ask` is asked before this frame is revealed (it is stored on the previous frame). */
  push(f: Omit<DPFrame, "vals">, ask?: Ask) {
    if (ask && this.frames.length) this.frames[this.frames.length - 1].ask = ask;
    this.frames.push({ ...f, vals: this.vals.map((r) => [...r]) });
  }
}
const grid0 = (rows: number, cols: number) => range(rows).map(() => Array<string | null>(cols).fill(null));

/* ---------------- 1-D: climbing stairs ---------------- */
function stairs({ n }: Inputs["stairs"]): DPRun {
  const b = new Builder(grid0(1, n + 1));
  const d = Array(n + 1).fill(0);
  b.push({ line: 1, say: `The table has n + 1 = ${n + 1} slots. dp[i] will hold the number of ways to reach step i.` });
  d[0] = 1; b.vals[0][0] = "1";
  b.push({ line: 2, cur: [0, 0], sym: "dp[0] = 1", say: "Base case: there is one way to stand at step 0. Do nothing." });
  d[1] = 1; b.vals[0][1] = "1";
  b.push({ line: 3, cur: [0, 1], sym: "dp[1] = 1", say: "Base case: there is one way to reach step 1. Take a single 1-step." });
  for (let i = 2; i <= n; i++) {
    const x = d[i - 1], y = d[i - 2];
    d[i] = x + y; b.vals[0][i] = String(d[i]);
    const ask = i === 2 ? numAsk("What is dp[2]?", 2, [1, 3], "dp[1] + dp[0] = 1 + 1 = 2: climb 1 + 1, or one 2-step.")
      : i === n && n > 3 ? numAsk(`dp[${n - 1}] = ${x} and dp[${n - 2}] = ${y}. What is dp[${n}]?`, d[i], [x, x * 2], `Add the two ways to arrive: ${x} + ${y} = ${d[i]}.`) : undefined;
    b.push({
      line: 5, line2: 4, cur: [0, i],
      deps: [{ r: 0, c: i - 1, kind: "pick", label: "last move was 1 step", value: String(x) }, { r: 0, c: i - 2, kind: "pick", label: "last move was 2 steps", value: String(y) }],
      sym: `dp[${i}] = dp[${i - 1}] + dp[${i - 2}]`, num: `= ${x} + ${y} = ${d[i]}`,
      say: `Your last move onto step ${i} was 1 step (from ${i - 1}) or 2 steps (from ${i - 2}). Add the ways: ${x} + ${y} = ${d[i]}.`,
    }, ask);
  }
  b.push({ line: 6, answer: [0, n], sym: `return dp[${n}]`, num: `= ${d[n]}`, say: `dp[${n}] = ${d[n]}: there are ${d[n]} ways to climb ${n} steps. Each value reads only the two before it, so two variables would also work.` });
  return {
    spec: { rows: 1, cols: n + 1, colHeads: [{ name: "i", cells: idx(n + 1) }], rowHeads: [{ name: "", cells: ["dp"] }], base: [k(0, 0), k(0, 1)], blocked: [], arcs: true, tags: false },
    frames: b.frames, code: STAIRS, title: "Climbing stairs (LC 70)", result: `${d[n]} ways`,
  };
}

/* ---------------- 1-D: house robber (backwards) ---------------- */
function robber({ nums }: Inputs["house-robber"], trace: boolean): DPRun {
  const n = nums.length;
  const b = new Builder(grid0(1, n + 2));
  const d = Array(n + 2).fill(0);
  b.vals[0][n] = "0"; b.vals[0][n + 1] = "0";
  b.push({ line: 2, sym: `dp[${n}] = dp[${n + 1}] = 0`, say: `dp[i] = the most money from houses i to ${n - 1}. dp[${n}] and dp[${n + 1}] are past the last house, so they are 0.` });
  let askedChoice = false;
  for (let i = n - 1; i >= 0; i--) {
    const skip = d[i + 1], take = nums[i] + d[i + 2];
    d[i] = Math.max(skip, take); b.vals[0][i] = String(d[i]);
    const tk: DepKind = take >= skip ? "pick" : "read", sk: DepKind = skip >= take ? "pick" : "read";
    let say = take > skip ? `Take house ${i}: ${nums[i]} + dp[${i + 2}] = ${take} beats skipping it (dp[${i + 1}] = ${skip}).`
      : skip > take ? `Skip house ${i}: dp[${i + 1}] = ${skip} beats taking it (${nums[i]} + ${d[i + 2]} = ${take}).`
      : `Taking and skipping house ${i} both give ${take}.`;
    if (i === n - 1) say = `The loop runs backwards: dp[i] reads dp[i + 1] and dp[i + 2], so those must be final first. ${say}`;
    let ask: Ask | undefined;
    if (!askedChoice && i <= n - 3 && take !== skip) {
      askedChoice = true;
      ask = { q: `House ${i} has ${nums[i]}. dp[${i + 1}] = ${skip} and dp[${i + 2}] = ${d[i + 2]}. Take it or skip it?`, options: ["Take it", "Skip it"], answer: take > skip ? 0 : 1, why: `Take gives ${nums[i]} + ${d[i + 2]} = ${take}. Skip gives ${skip}.` };
    } else if (i === 0 && n > 2) ask = numAsk("What is dp[0]?", d[0], [skip, take === d[0] ? skip + nums[0] : take, d[0] + 1], `max(dp[1], nums[0] + dp[2]) = max(${skip}, ${take}) = ${d[0]}.`);
    b.push({
      line: 4, line2: 3, cur: [0, i], hiCols: [i],
      deps: [{ r: 0, c: i + 1, kind: sk, label: `skip house ${i}`, value: String(skip) }, { r: 0, c: i + 2, kind: tk, label: `take house ${i}: ${nums[i]} +`, value: String(d[i + 2]) }],
      sym: `dp[${i}] = max(dp[${i + 1}], nums[${i}] + dp[${i + 2}])`, num: `= max(${skip}, ${nums[i]} + ${d[i + 2]}) = ${d[i]}`, say,
    }, ask);
  }
  b.push({ line: 5, answer: [0, 0], sym: "return dp[0]", num: `= ${d[0]}`, say: `dp[0] = ${d[0]}: the most you can rob from all ${n} houses without robbing two neighbours.` });
  if (trace) {
    const path: Cell[] = []; const taken: number[] = [];
    let i = 0;
    while (i < n) {
      path.push([0, i]);
      const take = nums[i] + d[i + 2];
      if (take >= d[i + 1]) {
        taken.push(i);
        b.push({ line: -1, trace: true, path: [...path], hiCols: [...taken], answer: [0, 0], say: `Trace back: at house ${i}, taking gives ${nums[i]} + dp[${i + 2}] = ${take}, which equals dp[${i}]. Take it and jump to house ${i + 2}.` });
        i += 2;
      } else {
        b.push({ line: -1, trace: true, path: [...path], hiCols: [...taken], answer: [0, 0], say: `Trace back: at house ${i}, skipping keeps dp[${i + 1}] = ${d[i + 1]}, which equals dp[${i}]. Skip it and move to house ${i + 1}.` });
        i += 1;
      }
    }
    b.push({ line: -1, trace: true, path: [...path], hiCols: [...taken], answer: [0, 0], say: `Houses robbed: ${taken.join(", ")}. Money: ${taken.map((t) => nums[t]).join(" + ")} = ${d[0]}. No two of them are neighbours.` });
  }
  return {
    spec: { rows: 1, cols: n + 2, colHeads: [{ name: "i", cells: idx(n + 2) }, { name: "nums", cells: [...nums.map(String), "", ""], strong: true }], rowHeads: [{ name: "", cells: ["dp"] }], base: [k(0, n), k(0, n + 1)], blocked: [], arcs: true, tags: false },
    frames: b.frames, code: ROB, title: "House robber (LC 198)", result: `${d[0]}`,
  };
}

/* ---------------- Grid: unique paths with rocks (one rolling row) ---------------- */
function gridPaths({ grid }: Inputs["grid-paths"]): DPRun {
  const R = grid.length, C = grid[0].length;
  const b = new Builder(grid0(R, C));
  const dp = Array(C).fill(0); dp[0] = 1;
  const blocked: string[] = [];
  grid.forEach((row, r) => [...row].forEach((ch, c) => { if (ch === "*") blocked.push(k(r, c)); }));
  const note = () => `The code keeps one row: dp = [${dp.join(", ")}]`;
  b.push({ line: 3, note: note(), sym: "dp[0] = 1", say: `dp is one row of ${C} numbers, reused for every grid row. dp[0] = 1: one way to stand on the start cell. Rocks have a striped pattern.` });
  let askedBoth = false, askedRock = false;
  for (let r = 0; r < R; r++) {
    for (let c = 0; c < C; c++) {
      if (grid[r][c] === "*") {
        dp[c] = 0; b.vals[r][c] = "0";
        const ask = !askedRock ? { q: `(${r}, ${c}) is a rock. What does dp[${c}] become?`, options: ["0", "The value from above", "1"], answer: 0, why: "No path can stand on a rock, so the count is 0." } : undefined;
        askedRock = true;
        b.push({ line: 7, line2: 6, cur: [r, c], note: note(), sym: `dp[${c}] = 0`, say: `(${r}, ${c}) is a rock. No path can stand on it, so dp[${c}] = 0.` }, ask);
      } else if (c > 0) {
        const up = dp[c], left = dp[c - 1];
        dp[c] = up + left; b.vals[r][c] = String(dp[c]);
        const deps: Dep[] = [];
        if (r > 0) deps.push({ r: r - 1, c, kind: "pick", label: "from above (old dp[c])", value: String(up) });
        deps.push({ r, c: c - 1, kind: "pick", label: "from the left (dp[c - 1])", value: String(left) });
        let ask: Ask | undefined;
        if (!askedBoth && r > 0 && up > 0 && left > 0) { askedBoth = true; ask = numAsk(`Above is ${up}, left is ${left}. What goes in (${r}, ${c})?`, up + left, [Math.max(up, left), up * left], `Paths arrive from above or from the left: ${up} + ${left} = ${up + left}.`); }
        else if (r === R - 1 && c === C - 1 && askedBoth) ask = numAsk(`What is the value at the end cell (${r}, ${c})?`, up + left, [Math.max(up, left), up + left + 1]);
        b.push({
          line: 9, line2: 8, cur: [r, c], deps, note: note(),
          sym: `dp[${c}] = dp[${c}] + dp[${c - 1}]`, num: `= ${up} + ${left} = ${dp[c]}`,
          say: r === 0 ? `Row 0 has nothing above, so dp[${c}] was 0. Add the left neighbour: 0 + ${left} = ${dp[c]}.`
            : `dp[${c}] still holds ${up}, the paths from above. Add dp[${c - 1}] = ${left}, the paths from the left: ${dp[c]}.`,
        }, ask);
      } else {
        b.vals[r][0] = String(dp[0]);
        b.push({
          line: 8, line2: 6, cur: [r, 0], note: note(),
          deps: r > 0 ? [{ r: r - 1, c: 0, kind: "pick", label: "from above", value: String(dp[0]) }] : undefined,
          sym: `dp[0] = ${dp[0]}`,
          say: r === 0 ? "Start cell: dp[0] = 1." : `Column 0: you can only arrive from above, so dp[0] keeps its value ${dp[0]}.`,
        });
      }
    }
  }
  const ans = dp[C - 1];
  b.push({ line: 10, answer: [R - 1, C - 1], answerTone: "good", note: note(), sym: `return dp[${C - 1}]`, num: `= ${ans}`, say: `dp[${C - 1}] = ${ans}: there ${ans === 1 ? "is 1 path" : `are ${ans} paths`} from the top-left to the bottom-right, moving only right or down. The % MOD only matters for huge counts.` });
  return {
    spec: { rows: R, cols: C, colHeads: [{ name: "c", cells: idx(C) }], rowHeads: [{ name: "r", cells: idx(R) }], base: [k(0, 0)], blocked, arcs: false, tags: false },
    frames: b.frames, code: GRID, title: "Grid paths with rocks (LC 63, CSES Grid Paths I)", result: `${ans} paths`,
  };
}

/* ---------------- Two strings: LCS ---------------- */
function lcs({ a, b: s2 }: Inputs["lcs"], trace: boolean): DPRun {
  const n = a.length, m = s2.length;
  const B = new Builder(grid0(n + 1, m + 1));
  const d = range(n + 1).map(() => Array(m + 1).fill(0));
  const base: string[] = [];
  for (let i = 0; i <= n; i++) { B.vals[i][0] = "0"; base.push(k(i, 0)); }
  for (let j = 1; j <= m; j++) { B.vals[0][j] = "0"; base.push(k(0, j)); }
  const tags = (i: number) => range(n + 1).map((r) => (r === i ? "row" : r === i - 1 ? "up" : null));
  B.push({ line: 2, sym: "dp[0][j] = dp[i][0] = 0", say: "dp[i][j] = the LCS length of the first i letters of a and the first j letters of b. Row 0 and column 0 are empty prefixes, so they stay 0." });
  let askedMatch = false, askedMiss = false;
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      let ask: Ask | undefined;
      if (a[i - 1] === s2[j - 1]) {
        const x = d[i - 1][j - 1];
        d[i][j] = x + 1;
        if (!askedMatch) { askedMatch = true; ask = { q: `a[${i - 1}] = '${a[i - 1]}' and b[${j - 1}] = '${s2[j - 1]}' match. Where does dp[${i}][${j}] come from?`, options: ["The diagonal, plus 1", "The larger of up and left", "Up plus left"], answer: 0, why: "A shared last letter extends the LCS of both shorter prefixes: dp[i-1][j-1] + 1." }; }
        B.vals[i][j] = String(d[i][j]);
        if (i === n && j === m && !ask) ask = numAsk(`What is dp[${n}][${m}]?`, d[i][j], [x, d[i][j] + 1]);
        B.push({
          line: 8, line2: 7, cur: [i, j], hiRows: [i], hiCols: [j], rowTags: tags(i),
          deps: [{ r: i - 1, c: j - 1, kind: "pick", label: "diagonal + 1", value: String(x) }],
          sym: `dp[${i}][${j}] = dp[${i - 1}][${j - 1}] + 1`, num: `= ${x} + 1 = ${d[i][j]}`,
          say: `'${a[i - 1]}' == '${s2[j - 1]}': both prefixes end with the same letter, so it extends the LCS of the shorter prefixes. Diagonal + 1 = ${d[i][j]}.`,
        }, ask);
      } else {
        const up = d[i - 1][j], left = d[i][j - 1];
        d[i][j] = up > left ? up : left;
        if (!askedMiss) { askedMiss = true; ask = { q: `'${a[i - 1]}' and '${s2[j - 1]}' differ. Where does dp[${i}][${j}] come from?`, options: ["The diagonal, plus 1", "The larger of up and left", "Up plus left"], answer: 1, why: "One of the two last letters is not in the LCS. Drop it: up drops a's letter, left drops b's letter. Keep the better one." }; }
        else if (i === n && j === m) ask = numAsk(`What is dp[${n}][${m}]?`, d[i][j], [up + left, d[i][j] + 1]);
        B.vals[i][j] = String(d[i][j]);
        B.push({
          line: 10, line2: 7, cur: [i, j], hiRows: [i], hiCols: [j], rowTags: tags(i),
          deps: [{ r: i - 1, c: j, kind: up > left ? "pick" : "read", label: `up: drop '${a[i - 1]}'`, value: String(up) }, { r: i, c: j - 1, kind: up > left ? "read" : "pick", label: `left: drop '${s2[j - 1]}'`, value: String(left) }],
          sym: `dp[${i}][${j}] = max(dp[${i - 1}][${j}], dp[${i}][${j - 1}])`, num: `= max(${up}, ${left}) = ${d[i][j]}`,
          say: `'${a[i - 1]}' != '${s2[j - 1]}': drop one of the last letters. Up (drop '${a[i - 1]}') = ${up}, left (drop '${s2[j - 1]}') = ${left}. Keep the larger: ${d[i][j]}.`,
        }, ask);
      }
    }
  }
  const v = d[n][m];
  B.push({ line: 11, answer: [n, m], sym: `return dp[${n}][${m}]`, num: `= ${v}`, say: `dp[${n}][${m}] = ${v}: the longest common subsequence of "${a}" and "${s2}" has length ${v}.` });
  let word = "";
  if (trace) {
    let i = n, j = m; const path: Cell[] = [[n, m]]; const hr: number[] = [], hc: number[] = []; const chars: string[] = [];
    while (i > 0 && j > 0) {
      let say: string;
      if (a[i - 1] === s2[j - 1]) {
        chars.unshift(a[i - 1]); hr.push(i); hc.push(j);
        say = `Trace back: '${a[i - 1]}' matches, so it is in the LCS. Step diagonally to (${i - 1}, ${j - 1}).`;
        i--; j--;
      } else if (d[i - 1][j] > d[i][j - 1]) { say = `Trace back: no match. Up (${d[i - 1][j]}) > left (${d[i][j - 1]}), so this value came from above. Move up.`; i--; }
      else { say = `Trace back: no match. Left (${d[i][j - 1]}) >= up (${d[i - 1][j]}), so this value came from the left. Move left.`; j--; }
      path.push([i, j]);
      B.push({ line: -1, trace: true, path: [...path], hiRows: [...hr], hiCols: [...hc], answer: [n, m], say });
    }
    word = chars.join("");
    B.push({ line: -1, trace: true, path: [...path], hiRows: hr, hiCols: hc, answer: [n, m], say: v ? `LCS = "${word}" (length ${v}). Its letters are marked in both strings.` : "The strings share no letter, so the LCS is empty." });
  }
  return {
    spec: { rows: n + 1, cols: m + 1, colHeads: [{ name: "j", cells: idx(m + 1) }, { name: "b", cells: ["", ...s2], strong: true }], rowHeads: [{ name: "i", cells: idx(n + 1) }, { name: "a", cells: ["", ...a], strong: true }], base, blocked: [], arcs: false, tags: true },
    frames: B.frames, code: LCS, title: "Longest common subsequence (LC 1143)", result: word ? `${v} ("${word}")` : `${v}`,
  };
}

/* ---------------- Two strings: edit distance ---------------- */
function editDistance({ a, b: s2 }: Inputs["edit-distance"], trace: boolean): DPRun {
  const n = a.length, m = s2.length;
  const B = new Builder(grid0(n + 1, m + 1));
  const d = range(n + 1).map(() => Array(m + 1).fill(0));
  const base: string[] = [];
  for (let j = 0; j <= m; j++) { d[0][j] = j; B.vals[0][j] = String(j); base.push(k(0, j)); }
  for (let i = 1; i <= n; i++) base.push(k(i, 0));
  const tags = (i: number) => range(n + 1).map((r) => (r === i ? "cur" : r === i - 1 ? "prev" : null));
  B.push({ line: 2, rowTags: range(n + 1).map((r) => (r === 0 ? "prev" : null)), sym: "dp[0][j] = j", say: `dp[i][j] = the fewest edits that turn the first i letters of a into the first j letters of b. Row 0: from an empty prefix you need j inserts.` });
  let askedMiss = false, askedMatch = false;
  for (let i = 1; i <= n; i++) {
    d[i][0] = i; B.vals[i][0] = String(i);
    B.push({ line: 4, line2: 3, cur: [i, 0], rowTags: tags(i), sym: `dp[${i}][0] = ${i}`, say: `Column 0: turn "${a.slice(0, i)}" into an empty string with ${i} delete${i > 1 ? "s" : ""}. The code keeps only two rows: prev and cur.` });
    for (let j = 1; j <= m; j++) {
      let ask: Ask | undefined;
      if (a[i - 1] === s2[j - 1]) {
        const x = d[i - 1][j - 1]; d[i][j] = x; B.vals[i][j] = String(x);
        if (!askedMatch) { askedMatch = true; ask = { q: `a[${i - 1}] and b[${j - 1}] are both '${a[i - 1]}'. What is dp[${i}][${j}]?`, options: ["Copy the diagonal", "1 + the diagonal", "1 + the smallest of the three"], answer: 0, why: "Matching last letters cost nothing. Keep them and solve the shorter prefixes: dp[i-1][j-1]." }; }
        else if (i === n && j === m) ask = numAsk(`What is dp[${n}][${m}]?`, x, [x + 1, Math.max(0, x - 1)]);
        B.push({
          line: 7, line2: 6, cur: [i, j], hiRows: [i], hiCols: [j], rowTags: tags(i),
          deps: [{ r: i - 1, c: j - 1, kind: "pick", label: "keep the match", value: String(x) }],
          sym: `dp[${i}][${j}] = dp[${i - 1}][${j - 1}]`, num: `= ${x}`,
          say: `'${a[i - 1]}' == '${s2[j - 1]}': the last letters already match. No edit, so copy the diagonal: ${x}.`,
        }, ask);
      } else {
        const rep = d[i - 1][j - 1], del = d[i - 1][j], ins = d[i][j - 1];
        const mn = Math.min(rep, del, ins); const v = 1 + mn; d[i][j] = v; B.vals[i][j] = String(v);
        const best = rep === mn ? 0 : del === mn ? 1 : 2;
        const names = [`replace '${a[i - 1]}' with '${s2[j - 1]}'`, `delete '${a[i - 1]}'`, `insert '${s2[j - 1]}'`];
        if (!askedMiss) { askedMiss = true; ask = numAsk(`Replace = ${rep}, delete = ${del}, insert = ${ins}. What is dp[${i}][${j}]?`, v, [mn, v + 1], `One edit plus the cheapest neighbour: 1 + ${mn} = ${v}.`); }
        else if (i === n && j === m) ask = numAsk(`What is dp[${n}][${m}]?`, v, [mn, v + 1]);
        B.push({
          line: 9, line2: 6, cur: [i, j], hiRows: [i], hiCols: [j], rowTags: tags(i),
          deps: [
            { r: i - 1, c: j - 1, kind: best === 0 ? "pick" : "read", label: "replace (diagonal)", value: String(rep) },
            { r: i - 1, c: j, kind: best === 1 ? "pick" : "read", label: "delete (up)", value: String(del) },
            { r: i, c: j - 1, kind: best === 2 ? "pick" : "read", label: "insert (left)", value: String(ins) },
          ],
          sym: `dp[${i}][${j}] = 1 + min(dp[${i - 1}][${j - 1}], dp[${i - 1}][${j}], dp[${i}][${j - 1}])`, num: `= 1 + min(${rep}, ${del}, ${ins}) = ${v}`,
          say: `'${a[i - 1]}' != '${s2[j - 1]}'. Pay one edit plus the cheapest neighbour. Best: ${names[best]}, so 1 + ${mn} = ${v}.`,
        }, ask);
      }
    }
  }
  const v = d[n][m];
  B.push({ line: 11, answer: [n, m], rowTags: tags(n).map((t) => (t === "cur" ? "prev" : null)), sym: `return prev[${m}]`, num: `= ${v}`, say: `After the last row, prev holds row ${n}. dp[${n}][${m}] = ${v}: "${a}" becomes "${s2}" in ${v} edit${v === 1 ? "" : "s"}.` });
  if (trace) {
    let i = n, j = m; const path: Cell[] = [[n, m]]; const ops: string[] = [];
    while (i > 0 || j > 0) {
      let say: string;
      if (i > 0 && j > 0 && a[i - 1] === s2[j - 1] && d[i][j] === d[i - 1][j - 1]) { say = `Trace back: '${a[i - 1]}' matches. No edit. Step diagonally.`; i--; j--; }
      else if (i > 0 && j > 0 && d[i][j] === d[i - 1][j - 1] + 1) { ops.unshift(`replace '${a[i - 1]}' with '${s2[j - 1]}'`); say = `Trace back: ${d[i][j]} = 1 + diagonal ${d[i - 1][j - 1]}, so this step was: replace '${a[i - 1]}' with '${s2[j - 1]}'.`; i--; j--; }
      else if (i > 0 && d[i][j] === d[i - 1][j] + 1) { ops.unshift(`delete '${a[i - 1]}'`); say = `Trace back: ${d[i][j]} = 1 + up ${d[i - 1][j]}, so this step was: delete '${a[i - 1]}'.`; i--; }
      else { ops.unshift(`insert '${s2[j - 1]}'`); say = `Trace back: ${d[i][j]} = 1 + left ${d[i][j - 1]}, so this step was: insert '${s2[j - 1]}'.`; j--; }
      path.push([i, j]);
      B.push({ line: -1, trace: true, path: [...path], answer: [n, m], say });
    }
    B.push({ line: -1, trace: true, path: [...path], answer: [n, m], say: ops.length ? `"${a}" to "${s2}" in ${ops.length} edit${ops.length > 1 ? "s" : ""}: ${ops.join(", ")}.` : "The strings are equal: no edits." });
  }
  return {
    spec: { rows: n + 1, cols: m + 1, colHeads: [{ name: "j", cells: idx(m + 1) }, { name: "b", cells: ["", ...s2], strong: true }], rowHeads: [{ name: "i", cells: idx(n + 1) }, { name: "a", cells: ["", ...a], strong: true }], base, blocked: [], arcs: false, tags: true },
    frames: B.frames, code: EDIT, title: "Edit distance (LC 72)", result: `${v} edits`,
  };
}

/* ---------------- 0/1 knapsack ---------------- */
export function knapBest(items: [number, number][], W: number): number[][] {
  const n = items.length;
  const d = range(n + 1).map(() => Array(W + 1).fill(0));
  for (let i = 1; i <= n; i++) {
    const [w, v] = items[i - 1];
    for (let c = 0; c <= W; c++) { d[i][c] = d[i - 1][c]; if (c >= w && d[i - 1][c - w] + v > d[i][c]) d[i][c] = d[i - 1][c - w] + v; }
  }
  return d;
}
const itemHead = (items: [number, number][]) => ["", ...items.map(([w, v]) => `${w},${v}`)];

function knap2d({ items, W }: Inputs["knapsack"], trace: boolean): DPRun {
  const n = items.length;
  const B = new Builder(grid0(n + 1, W + 1));
  const d = range(n + 1).map(() => Array(W + 1).fill(0));
  const base: string[] = [];
  for (let c = 0; c <= W; c++) { B.vals[0][c] = "0"; base.push(k(0, c)); }
  B.push({ line: 2, sym: "dp[0][c] = 0", say: "dp[i][c] = the best value using only the first i items with capacity c. Row 0 has no items, so every value is 0." });
  let askedChoice = false, toldRows = false;
  for (let i = 1; i <= n; i++) {
    const [w, v] = items[i - 1];
    const chip = `item ${i}: weight ${w}, value ${v}`;
    for (let c = 0; c <= W; c++) {
      const skip = d[i - 1][c];
      if (c < w) {
        d[i][c] = skip; B.vals[i][c] = String(skip);
        B.push({ line: 6, line2: 5, cur: [i, c], chip, hiRows: [i], deps: [{ r: i - 1, c, kind: "pick", label: "skip item " + i, value: String(skip) }], sym: `dp[${i}][${c}] = dp[${i - 1}][${c}]`, num: `= ${skip}`, say: `Capacity ${c} < weight ${w}: item ${i} does not fit. Copy the value above: ${skip}.` });
        continue;
      }
      const x = d[i - 1][c - w], take = x + v;
      d[i][c] = Math.max(skip, take); B.vals[i][c] = String(d[i][c]);
      let ask: Ask | undefined;
      if (!askedChoice && i >= 2 && take !== skip) { askedChoice = true; ask = { q: `Item ${i} (weight ${w}, value ${v}) at capacity ${c}. Skip gives ${skip}. Take gives dp[${i - 1}][${c - w}] + ${v} = ${x} + ${v}. Take or skip?`, options: ["Take it", "Skip it"], answer: take > skip ? 0 : 1, why: `${take} vs ${skip}: keep the larger.` }; }
      else if (i === n && c === W) ask = numAsk(`What is dp[${n}][${W}]?`, d[i][c], [skip === d[i][c] ? take : skip, d[i][c] + v].filter((q) => q >= 0));
      let say = take > skip ? `Take item ${i}: the best for capacity ${c - w} without it is ${x}, plus value ${v} = ${take} > ${skip}.` : `Skip item ${i}: ${skip} ≥ ${take}, the value if you take it.`;
      if (!toldRows) { toldRows = true; say += ` Both arrows start in row ${i - 1}, the row without item ${i}, so item ${i} is used at most once.`; }
      B.push({
        line: take > skip ? 8 : 7, line2: take > skip ? 7 : 6, cur: [i, c], chip, hiRows: [i],
        deps: [{ r: i - 1, c, kind: skip >= take ? "pick" : "read", label: `skip item ${i}`, value: String(skip) }, { r: i - 1, c: c - w, kind: take > skip ? "pick" : "read", label: `take item ${i}: + ${v}`, value: String(x) }],
        sym: `dp[${i}][${c}] = max(dp[${i - 1}][${c}], dp[${i - 1}][${c - w}] + ${v})`, num: `= max(${skip}, ${x} + ${v}) = ${d[i][c]}`, say,
      }, ask);
    }
  }
  const best = d[n][W];
  B.push({ line: 9, answer: [n, W], sym: `return dp[${n}][${W}]`, num: `= ${best}`, say: `dp[${n}][${W}] = ${best}: the best value with capacity ${W}. Row i only reads row i - 1, so the next view keeps one row and loops c backwards.` });
  if (trace) {
    let c = W; const path: Cell[] = []; const taken: number[] = [];
    for (let i = n; i >= 1; i--) {
      path.push([i, c]);
      const [w] = items[i - 1];
      if (d[i][c] !== d[i - 1][c]) {
        taken.push(i);
        B.push({ line: -1, trace: true, path: [...path], hiRows: [...taken], answer: [n, W], say: `Trace back: dp[${i}][${c}] = ${d[i][c]} is not the value above (${d[i - 1][c]}), so item ${i} was taken. Go up to row ${i - 1}, capacity ${c} - ${w} = ${c - w}.` });
        c -= w;
      } else B.push({ line: -1, trace: true, path: [...path], hiRows: [...taken], answer: [n, W], say: `Trace back: dp[${i}][${c}] equals the value above, so item ${i} was skipped. Go straight up.` });
    }
    path.push([0, c]);
    const tk = [...taken].reverse();
    B.push({ line: -1, trace: true, path: [...path], hiRows: taken, answer: [n, W], say: tk.length ? `Take item${tk.length > 1 ? "s" : ""} ${tk.join(" and ")}: weight ${tk.map((t) => items[t - 1][0]).join(" + ")} = ${tk.reduce((s, t) => s + items[t - 1][0], 0)}, value ${tk.map((t) => items[t - 1][1]).join(" + ")} = ${best}.` : "No item fits, so the best value is 0." });
  }
  return {
    spec: { rows: n + 1, cols: W + 1, colHeads: [{ name: "c", cells: idx(W + 1) }], rowHeads: [{ name: "i", cells: idx(n + 1) }, { name: "w,v", cells: itemHead(items), strong: true }], base, blocked: [], arcs: false, tags: false },
    frames: B.frames, code: KNAP_2D, title: "0/1 knapsack: 2-D table", result: `${best}`,
  };
}

function knap1d({ items, W }: Inputs["knapsack"], fwd: boolean): DPRun {
  const B = new Builder(grid0(2, W + 1));
  const d = Array(W + 1).fill(0);
  const show = () => { B.vals[1] = d.map(String); };
  show();
  B.push({ line: 1, sym: "dp = [0] * (W + 1)", say: `One row: dp[c] = the best value with capacity c, using the items seen so far. The top row will show dp as it was before the current item.` });
  let askedFresh = false;
  for (let it = 0; it < items.length; it++) {
    const [w, v] = items[it]; const no = it + 1;
    const chip = `item ${no}: weight ${w}, value ${v}`;
    B.vals[0] = d.map(String);
    const fresh: string[] = [];
    B.push({ line: 2, chip, fresh: [], sym: `w, v = ${w}, ${v}`, say: fwd ? `Item ${no}. This loop runs c upwards from ${w} to ${W}. Capacities below ${w} cannot hold the item.` : `Item ${no}. The loop runs c downwards from ${W} to ${w}. Capacities below ${w} cannot hold the item.` });
    const cs = fwd ? range(W - w + 1).map((q) => w + q) : range(W - w + 1).map((q) => W - q);
    for (const c of cs) {
      const src = c - w; const srcFresh = fresh.includes(k(1, src));
      const x = d[src], old = d[c], cand = x + v, improve = cand > old;
      if (improve) { d[c] = cand; fresh.push(k(1, c)); }
      show();
      let say: string;
      if (srcFresh && improve) say = `dp[${src}] = ${x} was already updated with item ${no} in this loop. Adding ${v} again puts item ${no} in the bag twice: ${cand}.`;
      else if (srcFresh) say = `dp[${src}] already includes item ${no}, but ${x} + ${v} = ${cand} is not better than ${old}. Keep ${old}.`;
      else if (improve) say = `dp[${src}] = ${x} still means "without item ${no}" (same as the top row). Taking item ${no}: ${x} + ${v} = ${cand} > ${old}. Write it.`;
      else say = `dp[${src}] = ${x} still means "without item ${no}". ${x} + ${v} = ${cand} is not better than ${old}. Keep ${old}.`;
      let ask: Ask | undefined;
      if (!askedFresh && ((fwd && srcFresh) || (!fwd && it >= 1 && src >= w))) {
        askedFresh = true;
        ask = { q: `The loop is at c = ${c}. It reads dp[${src}]. Has dp[${src}] already been updated for item ${no}?`, options: [`Yes, it already includes item ${no}`, `No, it is still the value without item ${no}`], answer: srcFresh ? 0 : 1, why: srcFresh ? "Going up, smaller c are written first. So dp[c - w] may already contain this item, and the item is used again." : "Going down, smaller c are written later. So dp[c - w] still holds the value from before this item." };
      }
      B.push({
        line: improve ? 5 : 4, line2: improve ? 4 : 3, cur: [1, c], chip, fresh: [...fresh],
        deps: [{ r: 1, c: src, kind: srcFresh ? "bad" : improve ? "pick" : "read", label: srcFresh ? `dp[${src}] already includes item ${no}` : `dp[${src}], still without item ${no}`, value: String(x) }],
        sym: `dp[${c}] = max(dp[${c}], dp[${c - w}] + ${v})`, num: `= max(${old}, ${x} + ${v}) = ${d[c]}`, say,
      }, ask);
    }
  }
  const truth = knapBest(items, W)[items.length][W];
  const got = d[W];
  if (!fwd) B.push({ line: 6, answer: [1, W], answerTone: "good", sym: `return dp[${W}]`, num: `= ${got}`, say: `dp[${W}] = ${got}, the same as the 2-D table, with one row of memory. Going down, dp[c - w] is always read before it is overwritten, so each item is used at most once.` });
  else if (got > truth) B.push({ line: 6, answer: [1, W], answerTone: "bad", sym: `return dp[${W}]`, num: `= ${got} (0/1 answer: ${truth})`, say: `dp[${W}] = ${got}, but the true 0/1 answer is ${truth}. The ascending loop reused items. That loop solves the unbounded knapsack, not 0/1.` });
  else B.push({ line: 6, answer: [1, W], answerTone: "good", sym: `return dp[${W}]`, num: `= ${got}`, say: `dp[${W}] = ${got} happens to equal the 0/1 answer here, but no item was reused on the way to it. Try the preset "One item, W = 2" to see the bug.` });
  return {
    spec: { rows: 2, cols: W + 1, colHeads: [{ name: "c", cells: idx(W + 1) }], rowHeads: [{ name: "", cells: ["before", "dp"] }], base: [], blocked: [], arcs: true, tags: false, fresh: true },
    frames: B.frames, code: fwd ? KNAP_FWD : KNAP_1D, title: fwd ? "0/1 knapsack: 1-D, loop going up (wrong)" : "0/1 knapsack: 1-D, loop going down", result: `${got}`,
  };
}

/* ---------------- Coin change (unbounded, min coins) ---------------- */
function coinChange({ coins, amount }: Inputs["coin-change"], trace: boolean): DPRun {
  const INF = amount + 1;
  const B = new Builder(grid0(1, amount + 1));
  const d = [0, ...Array(amount).fill(INF)] as number[];
  const s = (x: number) => (x >= INF ? "INF" : String(x));
  const show = () => { B.vals[0] = d.map(s); };
  show();
  B.push({ line: 2, sym: `dp = [0] + [INF] * ${amount}`, say: `dp[a] = the fewest coins that make amount a. dp[0] = 0. INF = amount + 1 = ${INF} means "cannot make it yet".` });
  let askedReuse = false;
  for (const coin of coins) {
    const fresh: string[] = [];
    const chip = `coin = ${coin}`;
    B.push({ line: 3, chip, fresh: [], sym: `coin = ${coin}`, say: `Coin ${coin}. The loop goes up from a = ${coin}. Amounts below ${coin} cannot use it.` });
    for (let a = coin; a <= amount; a++) {
      const src = a - coin, srcFresh = fresh.includes(k(0, src));
      const x = d[src], old = d[a], cand = x + 1, improve = cand < old;
      if (improve) { d[a] = cand; fresh.push(k(0, a)); }
      show();
      let say: string;
      if (x >= INF) say = `dp[${src}] is INF: amount ${src} cannot be made yet, so this route fails. Keep ${s(old)}.`;
      else if (improve) say = `${x} coin${x === 1 ? "" : "s"} for ${src}, plus one coin of ${coin}, makes ${a} with ${cand}. Better than ${s(old)}.` + (srcFresh ? ` dp[${src}] already used coin ${coin}. That is fine: coins are unlimited, which is why this loop goes up.` : "");
      else say = `${x} + 1 = ${cand} is not fewer than ${s(old)}. Keep ${s(old)}.`;
      let ask: Ask | undefined;
      if (!askedReuse && srcFresh && x < INF) { askedReuse = true; ask = { q: `dp[${src}] was already updated with coin ${coin} in this loop. Is it fine to read it?`, options: ["Yes: coins are unlimited", "No: each coin can be used once"], answer: 0, why: "Unbounded: the same coin may be used again. That is exactly what the ascending loop allows." }; }
      else if (a === amount && coin === coins[coins.length - 1] && askedReuse) ask = numAsk(`What is dp[${amount}] after coin ${coin}?`, d[a] >= INF ? -1 : d[a], [old >= INF ? cand : old, d[a] + 1].filter((q) => q >= 0 && q < INF));
      B.push({
        line: improve ? 6 : 5, line2: improve ? 5 : 4, cur: [0, a], chip, fresh: [...fresh],
        deps: [{ r: 0, c: src, kind: srcFresh && x < INF ? "ok" : improve ? "pick" : "read", label: srcFresh ? `dp[${src}] + 1 (already uses coin ${coin}: allowed)` : `dp[${src}] + 1 coin of ${coin}`, value: s(x) }],
        sym: `dp[${a}] = min(dp[${a}], dp[${a - coin}] + 1)`, num: `= min(${s(old)}, ${s(x)} + 1) = ${s(d[a])}`, say,
      }, ask);
    }
  }
  const ok = d[amount] < INF;
  B.push({ line: 7, answer: [0, amount], answerTone: ok ? "good" : "bad", sym: `return ${ok ? `dp[${amount}]` : "-1"}`, num: `= ${ok ? d[amount] : -1}`, say: ok ? `dp[${amount}] = ${d[amount]}: the fewest coins that make ${amount}.` : `dp[${amount}] is still INF: ${amount} cannot be made from these coins, so return -1.` });
  if (trace && ok) {
    let a = amount; const path: Cell[] = []; const used: number[] = [];
    while (a > 0) {
      path.push([0, a]);
      const c = coins.find((q) => q <= a && d[a - q] + 1 === d[a])!;
      used.push(c);
      B.push({ line: -1, trace: true, path: [...path], answer: [0, amount], say: `Trace back: dp[${a}] = ${d[a]} = dp[${a - c}] + 1, so one coin was ${c}. Go to amount ${a - c}.` });
      a -= c;
    }
    path.push([0, 0]);
    B.push({ line: -1, trace: true, path: [...path], answer: [0, amount], say: `Coins used: ${used.join(" + ")} = ${amount}, which is ${used.length} coin${used.length > 1 ? "s" : ""}.` });
  }
  return {
    spec: { rows: 1, cols: amount + 1, colHeads: [{ name: "a", cells: idx(amount + 1) }], rowHeads: [{ name: "", cells: ["dp"] }], base: [k(0, 0)], blocked: [], arcs: true, tags: false, fresh: true },
    frames: B.frames, code: COINS, title: "Coin change: fewest coins (LC 322)", result: ok ? `${d[amount]} coins` : "-1",
  };
}

export function buildRun(mode: Mode, inp: Inputs, trace: boolean, view: KnapView): DPRun {
  switch (mode) {
    case "stairs": return stairs(inp.stairs);
    case "house-robber": return robber(inp["house-robber"], trace);
    case "grid-paths": return gridPaths(inp["grid-paths"]);
    case "lcs": return lcs(inp.lcs, trace);
    case "edit-distance": return editDistance(inp["edit-distance"], trace);
    case "knapsack": return view === "2d" ? knap2d(inp.knapsack, trace) : knap1d(inp.knapsack, view === "fwd");
    case "coin-change": return coinChange(inp["coin-change"], trace);
  }
}

export const HAS_TRACE: Record<Mode, boolean> = { stairs: false, "house-robber": true, "grid-paths": false, lcs: true, "edit-distance": true, knapsack: true, "coin-change": true };
