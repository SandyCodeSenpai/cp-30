/**
 * Pure frame builders for the recursion-tree lab. Each mode runs the real algorithm once and records
 * a frame (node states + running code line + one-sentence narration + variables) at every teaching moment.
 */
import { asker, lineOf, type Ask, type BaseFrame } from "./kit/player";
import { COMBO, COMBO_NOCUT, FIB, PERMUTE, QUEENS, STAIRS, SUBSETS } from "./code";

export type Mode = "subsets" | "permutations" | "pruning" | "memo" | "n-queens";
export const MODES: { value: Mode; label: string }[] = [
  { value: "subsets", label: "Subsets" },
  { value: "permutations", label: "Permutations" },
  { value: "pruning", label: "Pruning" },
  { value: "memo", label: "Memo" },
  { value: "n-queens", label: "N-Queens" },
];

/** h = not called yet, open = on the call stack, act = running now, done = returned,
 *  sol = leaf that saved an answer, cut = pruned before the call, hit = memo hit, dead = wasted call. */
export type St = "h" | "open" | "act" | "done" | "sol" | "cut" | "hit" | "dead";

export interface CNode {
  id: number; parent: number; depth: number;
  label: string; sub?: string; edge?: string; dashed?: boolean;
  kind: "call" | "cut";
  /** shown under the node once it returns (memo values) */
  ret?: string;
  /** tiny unlabeled cut stub (N-Queens, where there are many) */
  mini?: boolean;
  /** memo off: this call repeats work done before */
  rep?: boolean;
  children: number[];
}

export interface Board { n: number; queens: number[]; tryCell?: [number, number]; safe?: boolean; attackers?: [number, number][]; solved?: boolean }

export interface Vars {
  path?: number[];
  res?: string[];
  used?: boolean[];
  remain?: number;
  memo?: [number, number][];
  calls: number;
  hits?: number;
  board?: Board;
  sets?: { cols: number[]; d1: number[]; d2: number[] };
}

export interface Flow { from: number; to: number; text: string; kind: "undo" | "ret" }
export interface RFrame extends BaseFrame { st: St[]; active: number; flow?: Flow; vars: Vars }
export interface Run { nodes: CNode[]; frames: RFrame[]; code: string[]; title: string; off?: number[]; totals?: { label: string; value: number; on?: boolean }[] }

const L = (a: number[]) => `[${a.join(",")}]`;
const S = (a: number[]) => `[${a.join(", ")}]`;

class Builder {
  nodes: CNode[] = [];
  st: St[] = [];
  frames: RFrame[] = [];
  active = -1;
  calls = 0;
  ask = asker(3);
  constructor(public code: string[]) {}
  add(parent: number, label: string, o: Partial<CNode> = {}): number {
    const id = this.nodes.length;
    const depth = parent < 0 ? 0 : this.nodes[parent].depth + 1;
    this.nodes.push({ id, parent, depth, label, kind: "call", children: [], ...o });
    if (parent >= 0) this.nodes[parent].children.push(id);
    this.st.push("h");
    if ((o.kind ?? "call") === "call") this.calls++;
    return id;
  }
  /** Make `id` the running node; its ancestors are on the stack. */
  enter(id: number) {
    if (this.active >= 0 && this.st[this.active] === "act") this.st[this.active] = "open";
    this.st[id] = "act"; this.active = id;
  }
  /** Return from `id` to its parent. Keeps sol / dead / hit colors. */
  leave(id: number) {
    if (this.st[id] === "act" || this.st[id] === "open") this.st[id] = "done";
    const p = this.nodes[id].parent;
    if (p >= 0) { this.st[p] = "act"; this.active = p; } else this.active = -1;
  }
  line(needle: string, from = 0) { return lineOf(this.code, needle, from); }
  snap(line: number, say: string, vars: Omit<Vars, "calls">, extra: { line2?: number; flow?: Flow } = {}) {
    this.frames.push({ st: this.st.slice(), active: this.active, line, say, vars: { ...vars, calls: this.calls }, ...extra });
  }
  /** Attach a predict question to the latest frame (asked before moving on). */
  askLast(kind: string, a: Ask) {
    const f = this.frames[this.frames.length - 1];
    if (f && !f.ask) f.ask = this.ask(kind, a);
  }
}

/* ---------------- Subsets: take / skip ---------------- */

export function buildSubsets(nums: number[]): Run {
  const b = new Builder(SUBSETS);
  const n = nums.length;
  const path: number[] = [], res: string[] = [];
  const v = () => ({ path: path.slice(), res: res.slice() });
  const root = b.add(-1, "[]");
  b.enter(root);
  b.snap(b.line("    dfs(0)"), `Call \`dfs(0)\` with \`path = []\`. Each level decides one item: take it or skip it.`, v());

  const dfs = (u: number, i: number) => {
    if (i === n) {
      b.askLast("leaf", { q: `\`i == len(nums)\`, so this is a leaf. What goes into \`res\`?`, options: [`A copy of path: ${S(path)}`, "path itself, the same list object"], answer: 0, why: "Use `path[:]`. The path list keeps changing, so storing the object itself would leave every entry empty at the end." });
      res.push(S(path)); b.st[u] = "sol";
      b.snap(b.line("res.append"), `i = ${i} = len(nums): a leaf. Save a copy of path: \`${S(path)}\`. That makes ${res.length} subset${res.length > 1 ? "s" : ""} so far.`, v());
      return;
    }
    const x = nums[i];
    path.push(x);
    b.snap(b.line("path.append(nums[i])"), `Take \`nums[${i}] = ${x}\`: path = ${S(path)}.`, v());
    const c = b.add(u, L(path), { edge: `+${x}` });
    b.enter(c);
    b.snap(b.line("# recurse"), `Recurse: \`dfs(${i + 1})\` with path = ${S(path)}.`, v());
    dfs(c, i + 1);
    b.leave(c);
    b.askLast("undo", { q: `\`dfs(${i + 1})\` returned to \`dfs(${i})\`. What happens to path = ${S(path)} now?`, options: [`\`path.pop()\`: it becomes ${S(path.slice(0, -1))}`, `Nothing: it stays ${S(path)}`, "It is cleared to []"], answer: 0, why: `Undo the choice, so the skip branch starts from the same path the take branch started from.` });
    path.pop();
    b.snap(b.line("path.pop()"), `Back in \`dfs(${i})\`. Undo: pop ${x}, so path = ${S(path)} again.`, v(), { flow: { from: c, to: u, text: `pop ${x}`, kind: "undo" } });
    const s = b.add(u, L(path), { edge: "skip", dashed: true });
    b.enter(s);
    b.snap(b.line("# skip"), `Skip ${x}: \`dfs(${i + 1})\` with path = ${S(path)}.`, v());
    dfs(s, i + 1);
    b.leave(s);
  };
  dfs(root, 0);
  b.st[root] = "done"; b.active = -1;
  b.snap(b.line("return res"), `Done. Each of the ${n} items was taken or skipped, so there are 2^${n} = ${1 << n} leaves and ${res.length} subsets.`, v());
  return { nodes: b.nodes, frames: b.frames, code: SUBSETS, title: "Day 10 · subsets: take / skip" };
}

/* ---------------- Permutations: used[] ---------------- */

export function buildPermutations(nums: number[]): Run {
  const b = new Builder(PERMUTE);
  const n = nums.length;
  const path: number[] = [], res: string[] = [], used = nums.map(() => false);
  const v = () => ({ path: path.slice(), res: res.slice(), used: used.slice() });
  const root = b.add(-1, "[]");
  b.enter(root);
  const outer = b.line("    dfs()", b.line("used[i] = False"));
  b.snap(outer, `Call \`dfs()\` with \`path = []\`. Every item is free: used = [${used.map(() => "F").join(", ")}].`, v());
  const callLine = b.line("            dfs()");

  const dfs = (u: number) => {
    if (path.length === n) {
      res.push(S(path)); b.st[u] = "sol";
      b.snap(b.line("res.append"), `\`len(path) == len(nums)\`: a full ordering. Save a copy: ${S(path)}. That makes ${res.length}.`, v());
      return;
    }
    nums.forEach((x, i) => {
      if (used[i]) {
        b.askLast("used", { q: `The loop reaches \`i = ${i}\` (${x}). \`used[${i}]\` is True. What happens?`, options: [`\`continue\`: skip ${x}`, `Take ${x} a second time`], answer: 0, why: `${x} is already in path ${S(path)}. A permutation uses each item once.` });
        b.snap(b.line("continue"), `i = ${i}: \`used[${i}]\` is True, because ${x} is already in path. Skip it.`, v());
        return;
      }
      used[i] = true; path.push(x);
      b.snap(b.line("used[i] = True"), `i = ${i}: ${x} is free. Mark \`used[${i}] = True\` and push it: path = ${S(path)}.`, v(), { line2: b.line("path.append(x)") });
      const c = b.add(u, L(path), { edge: `+${x}` });
      b.enter(c);
      b.snap(callLine, `Recurse with path = ${S(path)}.`, v());
      dfs(c);
      b.leave(c);
      path.pop(); used[i] = false;
      b.snap(b.line("path.pop()"), `Back. Undo: pop ${x} and set \`used[${i}] = False\`, so ${x} is free for the next branch.`, v(), { line2: b.line("used[i] = False"), flow: { from: c, to: u, text: `pop ${x}`, kind: "undo" } });
    });
  };
  dfs(root);
  b.st[root] = "done"; b.active = -1;
  let fact = 1; for (let k = 2; k <= n; k++) fact *= k;
  b.snap(b.line("return res"), `Done. ${n} choices, then ${n - 1}, then ... gives ${n}! = ${fact} leaves: ${res.length} orderings.`, v());
  return { nodes: b.nodes, frames: b.frames, code: PERMUTE, title: "Day 10 · permutations with used[]" };
}

/* ---------------- Pruning: combination sum, unique ---------------- */

function comboRun(candsIn: number[], target: number, cut: boolean): Run {
  const code = cut ? COMBO : COMBO_NOCUT;
  const b = new Builder(code);
  const cands = candsIn.slice().sort((a, z) => a - z);
  const path: number[] = [], res: string[] = [];
  let remainNow = target;
  const v = () => ({ path: path.slice(), res: res.slice(), remain: remainNow });
  const root = b.add(-1, "[]", { sub: `rem ${target}` });
  b.enter(root);
  b.snap(b.line("dfs(0, target)"), `Sort the candidates: ${S(cands)}. Call \`dfs(0, ${target})\`: we need ${target} more.`, v());
  const callLine = b.line("dfs(j + 1");

  const dfs = (u: number, start: number, remain: number) => {
    remainNow = remain;
    if (!cut && remain < 0) {
      b.st[u] = "dead";
      b.snap(b.line("return            # too late"), `remain = ${remain} < 0. A wasted call: the sum went over the target one step ago, but without the cut we only see it now.`, v());
      return;
    }
    if (remain === 0) {
      res.push(S(path)); b.st[u] = "sol";
      b.snap(b.line("res.append"), `remain = 0: ${S(path)} sums to ${target}. Save a copy.`, v());
      return;
    }
    for (let j = start; j < cands.length; j++) {
      const x = cands[j];
      if (j > start && x === cands[j - 1]) {
        b.askLast("dup", { q: `\`cands[${j}] = ${x}\` equals \`cands[${j - 1}]\`, at the same depth. What happens?`, options: ["`continue`: skip it", "Recurse: it is a new branch"], answer: 0, why: "Taking the second copy here would build the same combinations a second time." });
        const d = b.add(u, `${x} dup`, { kind: "cut" });
        b.st[d] = "cut";
        b.snap(b.line("continue"), `j = ${j}: \`cands[${j}] = ${x}\` repeats the value just tried at this depth. Same branch again, so skip it.`, v());
        continue;
      }
      if (cut && x > remain) {
        b.askLast("break", { q: `\`cands[${j}] = ${x}\` but remain = ${remain}. What does the loop do?`, options: ["`break`: stop the loop", "`continue`: try the next value", `Recurse with remain = ${remain - x}`], answer: 0, why: "The list is sorted, so every later value is at least as big. None of them can fit." });
        const d = b.add(u, `${x}>${remain}`, { kind: "cut" });
        b.st[d] = "cut";
        const rest = cands.length - j - 1;
        b.snap(b.line("break"), `\`cands[${j}] = ${x}\` > remain ${remain}. The list is sorted${rest > 0 ? `, so the ${rest} value${rest > 1 ? "s" : ""} after it ${rest > 1 ? "are" : "is"} too big as well` : ""}: break. The whole branch is cut.`, v());
        break;
      }
      path.push(x);
      b.snap(b.line("path.append(cands[j])"), `Take \`cands[${j}] = ${x}\`: path = ${S(path)}, remain becomes ${remain} - ${x} = ${remain - x}.`, v());
      const c = b.add(u, L(path), { edge: `+${x}`, sub: `rem ${remain - x}` });
      b.enter(c);
      remainNow = remain - x;
      b.snap(callLine, `Recurse: \`dfs(${j + 1}, ${remain - x})\`. j + 1 means each item is used once.`, v());
      dfs(c, j + 1, remain - x);
      b.leave(c);
      path.pop(); remainNow = remain;
      b.snap(b.line("path.pop()"), `Back in \`dfs(${start}, ${remain})\`. Undo: pop ${x}, path = ${S(path)}.`, v(), { flow: { from: c, to: u, text: `pop ${x}`, kind: "undo" } });
    }
  };
  dfs(root, 0, target);
  b.st[root] = "done"; b.active = -1; remainNow = target;
  b.snap(b.line("return res"), `Done: ${res.length} unique combination${res.length === 1 ? "" : "s"} sum to ${target}, using ${b.calls} calls${cut ? "" : " without the cut"}.`, v());
  return { nodes: b.nodes, frames: b.frames, code, title: cut ? "Day 10 · combinations with a cut" : "Day 10 · the same search, no cut" };
}

export function buildPruning(cands: number[], target: number, cut: boolean): Run {
  const on = comboRun(cands, target, true), off = comboRun(cands, target, false);
  const callsOf = (r: Run) => r.nodes.filter((x) => x.kind === "call").length;
  const run = cut ? on : off;
  const last = run.frames[run.frames.length - 1];
  last.say += cut ? ` Without the cut it takes ${callsOf(off)} calls.` : ` With the cut it takes only ${callsOf(on)}.`;
  return { ...run, totals: [{ label: "with cut", value: callsOf(on), on: cut }, { label: "no cut", value: callsOf(off), on: !cut }] };
}

/* ---------------- Memo: climbing stairs / Fibonacci ---------------- */

function memoRun(n: number, memo: boolean, fn: "stairs" | "fib"): Run {
  const code = fn === "stairs" ? STAIRS : FIB;
  const name = fn === "stairs" ? "f" : "fib";
  const b = new Builder(code);
  const base = (i: number) => (fn === "stairs" ? 1 : i);
  const isBase = (i: number) => (fn === "stairs" ? i <= 1 : i < 2);
  const cache = new Map<number, number>();
  const seen = new Set<number>();
  let hits = 0;
  const v = () => ({ memo: memo ? [...cache.entries()].sort((a, z) => a[0] - z[0]) : undefined, hits });
  const callLine = b.line(`return ${name}(i - 1)`);
  const retBase = b.line(fn === "stairs" ? "return 1" : "return i");

  const call = (parent: number, i: number, which: string): number => {
    if (memo && cache.has(i)) {
      const val = cache.get(i)!;
      b.askLast("hit", { q: `\`${name}(${i})\` was computed before. Memo is on. What happens on this call?`, options: ["Return the cached value at once", `Run ${name}(${i}) again, all the way down`], answer: 0, why: `@cache looks up i = ${i}, finds ${val}, and returns it without running the body.` });
      const u = b.add(parent, `${name}(${i})`, { ret: `=${val}` });
      hits++;
      b.st[u] = "hit"; b.st[parent] = "open"; b.active = u;
      b.snap(b.line("@cache"), `${which} \`${name}(${i})\` is already in the cache: return ${val} at once. Nothing is called below it.`, v(), { flow: { from: u, to: parent, text: `${val}`, kind: "ret" } });
      b.st[parent] = "act"; b.active = parent;
      return val;
    }
    const again = seen.has(i);
    if (!memo && again) {
      b.askLast("again", { q: `\`${name}(${i})\` was computed before, but memo is off. What happens?`, options: ["It runs again, with all its calls", "It returns the old value at once"], answer: 0, why: "Without a cache, Python has no memory of earlier calls. The whole subtree is rebuilt." });
    }
    const u = b.add(parent, `${name}(${i})`, { rep: !memo && again });
    seen.add(i);
    b.enter(u);
    b.snap(parent < 0 ? b.line(`${name}(n)`) : callLine, parent < 0
      ? `Call \`${name}(${i})\`${fn === "stairs" ? `: the number of ways to climb ${i} stairs` : ""}.`
      : `${which} \`${name}(${i})\`.${!memo && again ? ` It was computed before, but memo is off, so it runs again.` : ""}`, v());
    let val: number;
    if (isBase(i)) {
      val = base(i);
      if (memo) cache.set(i, val);
      b.nodes[u].ret = `=${val}`;
      b.st[u] = "done";
      b.snap(retBase, `\`${name}(${i})\` is a base case: return ${val}.${memo ? ` The cache stores ${name}(${i}) = ${val}.` : ""}`, v(), parent >= 0 ? { flow: { from: u, to: parent, text: `${val}`, kind: "ret" } } : {});
    } else {
      const a = call(u, i - 1, `\`${name}(${i})\` first calls`);
      const c = call(u, i - 2, `Then \`${name}(${i})\` calls`);
      val = a + c;
      if (memo) cache.set(i, val);
      b.nodes[u].ret = `=${val}`;
      b.st[u] = "done";
      b.snap(callLine, `\`${name}(${i})\` = ${name}(${i - 1}) + ${name}(${i - 2}) = ${a} + ${c} = ${val}.${memo ? ` Store it in the cache.` : ""}`, v(), parent >= 0 ? { flow: { from: u, to: parent, text: `${val}`, kind: "ret" } } : {});
    }
    if (parent >= 0) { b.st[parent] = "act"; b.active = parent; } else b.active = -1;
    return val;
  };
  const ans = call(-1, n, "");
  const total = b.calls;
  b.frames[b.frames.length - 1].say += ` That is the answer. Total calls: ${total}${memo ? ` (${total - hits} computed, ${hits} cache hits)` : ""}.`;
  void ans;
  const off = memo ? [] : [b.line("@cache")];
  return { nodes: b.nodes, frames: b.frames, code, off, title: memo ? "Day 15 · top-down with @cache" : "Day 15 · the same recursion, memo off" };
}

export function memoCalls(n: number, fn: "stairs" | "fib") {
  // Calls without memo: c(i) = 1 + c(i-1) + c(i-2), c(0) = c(1) = 1. With memo: n + 1 computed + (n - 2) hits = 2n - 1.
  const c: number[] = [1, 1];
  for (let i = 2; i <= n; i++) c[i] = 1 + c[i - 1] + c[i - 2];
  void fn;
  return { off: c[n], on: n < 2 ? 1 : 2 * n - 1 };
}

export function buildMemo(n: number, memo: boolean, fn: "stairs" | "fib"): Run {
  const run = memoRun(n, memo, fn);
  const t = memoCalls(n, fn);
  return { ...run, totals: [{ label: "memo off", value: t.off, on: !memo }, { label: "memo on", value: t.on, on: memo }] };
}

/* ---------------- N-Queens ---------------- */

export function buildQueens(n: number, stopFirst: boolean): Run {
  const b = new Builder(QUEENS);
  const queens: number[] = [];
  const cols = new Set<number>(), d1 = new Set<number>(), d2 = new Set<number>();
  const res: string[] = [];
  const sorted = (s: Set<number>) => [...s].sort((a, z) => a - z);
  const v = (extra: Partial<Board> = {}) => ({ res: res.slice(), board: { n, queens: queens.slice(), ...extra }, sets: { cols: sorted(cols), d1: sorted(d1), d2: sorted(d2) } });
  const root = b.add(-1, "start");
  b.enter(root);
  b.snap(b.line("    dfs(0)"), `One queen per row. Start at row 0 with an empty ${n}×${n} board. Each node below is the column picked for the next row.`, v());
  let stop = false;
  const checkLine = b.line("if c in cols");

  const dfs = (u: number, r: number): boolean => {
    if (r === n) {
      res.push(S(queens)); b.st[u] = "sol";
      b.snap(b.line("res.append"), `Row ${r} = n: every row has a queen and none attack each other. Save ${S(queens)}.`, v({ solved: true }));
      if (stopFirst) stop = true;
      return true;
    }
    const before = res.length;
    for (let c = 0; c < n && !stop; c++) {
      const attackers: [number, number][] = [];
      const why: string[] = [];
      queens.forEach((qc, qr) => {
        if (qc === c) { attackers.push([qr, qc]); why.push(`column ${c}`); }
        else if (qr - qc === r - c) { attackers.push([qr, qc]); why.push(`diagonal r - c = ${r - c}`); }
        else if (qr + qc === r + c) { attackers.push([qr, qc]); why.push(`diagonal r + c = ${r + c}`); }
      });
      const safe = attackers.length === 0;
      b.askLast("safe", { q: `Row ${r}, column ${c}. Is it safe for a queen?`, options: ["Yes: place a queen", "No: it is attacked"], answer: safe ? 0 : 1, why: safe ? "Its column and both diagonals are free." : `The queen at (${attackers[0][0]}, ${attackers[0][1]}) shares its ${why[0]}.` });
      if (!safe) {
        const d = b.add(u, `c${c}`, { kind: "cut", mini: true });
        b.st[d] = "cut";
        b.snap(checkLine, `Row ${r}, column ${c}: attacked by the queen at (${attackers[0][0]}, ${attackers[0][1]}), same ${why[0]}. Cut this branch.`, v({ tryCell: [r, c], safe: false, attackers }), { line2: b.line("continue  ") });
        continue;
      }
      queens.push(c); cols.add(c); d1.add(r - c); d2.add(r + c);
      const ch = b.add(u, `c${c}`);
      b.enter(ch);
      b.snap(b.line("cols.add(c)"), `Row ${r}, column ${c} is safe. Place the queen, add its keys to the three sets, and go to row ${r + 1}.`, v({ tryCell: [r, c], safe: true }), { line2: b.line("dfs(r + 1)") });
      const found = dfs(ch, r + 1);
      b.leave(ch);
      if (stop) return true;
      queens.pop(); cols.delete(c); d1.delete(r - c); d2.delete(r + c);
      const deadEnd = !found && b.nodes[ch].children.every((k) => b.nodes[k].kind === "cut") && r + 1 < n;
      b.snap(b.line("cols.remove(c)"), deadEnd
        ? `Row ${r + 1} has no safe column: a dead end. Undo: lift the queen from (${r}, ${c}) and remove its keys.`
        : `Back in row ${r}. Undo the queen at (${r}, ${c}) and try the next column.`, v(), { flow: { from: ch, to: u, text: `undo c${c}`, kind: "undo" } });
    }
    return res.length > before;
  };
  dfs(root, 0);
  b.st[root] = b.st[root] === "sol" ? "sol" : "done"; b.active = -1;
  if (res.length) { queens.length = 0; queens.push(...JSON.parse(res[0]) as number[]); }
  const endBoard = res.length ? v({ solved: true }) : v();
  queens.length = 0;
  b.snap(b.line("return res"), stopFirst
    ? `Stop at the first solution: ${res[0] ?? "none"}. It took ${b.calls} calls and ${b.nodes.filter((x) => x.kind === "cut").length} cuts. (In code, make dfs return True once res is not empty, and stop the loop.)`
    : `Done. ${n} queens has ${res.length} solution${res.length === 1 ? "" : "s"} (the board shows the first). The cuts kept the search to ${b.calls} calls instead of ${n}^${n} = ${n ** n} full boards.`, endBoard);
  return { nodes: b.nodes, frames: b.frames, code: QUEENS, title: "Day 10 · N-Queens: place, recurse, undo" };
}

/** Sanity check for the code panels: all needles must exist (used by dev only). */
export const ALL_CODE = { SUBSETS, PERMUTE, COMBO, COMBO_NOCUT, STAIRS, FIB, QUEENS };
