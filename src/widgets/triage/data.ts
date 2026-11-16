/** Data for the 15-second triage lab (book chapter 9: the 15-second scan and the signal words dictionary). */
import type { Card } from "@/content/deck";

export type StepId = "budget" | "want" | "shape" | "trigger";
export type Want = "yesno" | "num" | "minmax" | "minimax" | "any" | "kth" | "every" | "query" | "each" | "pos";
export type Shape = "array" | "string" | "two" | "grid" | "tree" | "graph" | "intervals" | "number" | "queries";

/** Complexity ranks: fastest first. */
export const COST = ["O(log n)", "O(√n)", "O(n)", "O(n log n)", "O(n²)", "O(n³)", "O(2ⁿ · n)", "O(n!)"];

export interface Opt<T extends string> { id: T; label: string; short: string }

/** Step 1: largest n → the slowest complexity that still fits (rank in COST). */
export interface BudgetOpt extends Opt<string> { rank: number }
export const BUDGETS: BudgetOpt[] = [
  { id: "b10", label: "n ≤ 10", short: "n ≤ 10", rank: 7 },
  { id: "b20", label: "n ≤ 20", short: "n ≤ 20", rank: 6 },
  { id: "b500", label: "n ≤ 500", short: "n ≤ 500", rank: 5 },
  { id: "b5000", label: "n ≤ 5000", short: "n ≤ 5000", rank: 4 },
  { id: "b2e5", label: "n ≤ 2·10⁵", short: "n ≤ 2·10⁵", rank: 3 },
  { id: "b1e6", label: "n ≤ 10⁶", short: "n ≤ 10⁶", rank: 2 },
  { id: "b1e12", label: "N ≤ 10¹²", short: "N ≤ 10¹²", rank: 1 },
  { id: "b1e18", label: "N ≤ 10¹⁸", short: "N ≤ 10¹⁸", rank: 0 },
];

export const WANTS: Opt<Want>[] = [
  { id: "yesno", label: "YES / NO", short: "YES / NO" },
  { id: "num", label: "A count or a sum", short: "a count" },
  { id: "minmax", label: "A min or a max", short: "a min or max" },
  { id: "minimax", label: "Min of a max (or max of a min)", short: "min of a max" },
  { id: "pos", label: "An index or a position", short: "an index" },
  { id: "kth", label: "The k-th item, or the top k", short: "the k-th" },
  { id: "any", label: "Any valid answer, or an order", short: "any valid answer" },
  { id: "every", label: "Every combination, listed", short: "every combination" },
  { id: "query", label: "One answer per query", short: "per query" },
  { id: "each", label: "One answer per index or node", short: "per index" },
];

export const SHAPES: Opt<Shape>[] = [
  { id: "array", label: "One array", short: "array" },
  { id: "string", label: "One string", short: "string" },
  { id: "two", label: "Two strings or lists", short: "two lists" },
  { id: "grid", label: "A grid", short: "grid" },
  { id: "tree", label: "A tree", short: "tree" },
  { id: "graph", label: "A graph (nodes, edges)", short: "graph" },
  { id: "intervals", label: "Intervals", short: "intervals" },
  { id: "number", label: "One number N", short: "one number" },
  { id: "queries", label: "Queries or operations", short: "queries" },
];

export interface Family {
  id: string; name: string; day: number; cost: number; costLabel: string;
  wants: Want[]; shapes: Shape[]; triggers: string[];
}

/** Candidate patterns, in the order the course teaches them. */
export const FAMILIES: Family[] = [
  { id: "hash", name: "Hash map / set", day: 1, cost: 2, costLabel: "O(n)", wants: ["yesno", "num", "minmax", "any", "each", "pos", "kth"], shapes: ["array", "string", "two", "queries"],
    triggers: ["seen before? find its partner", "group things that are the same", "count pairs i < j with f(i) == f(j)"] },
  { id: "twoptr", name: "Sort + two pointers", day: 2, cost: 2, costLabel: "O(n)", wants: ["yesno", "num", "minmax", "any", "every", "each", "pos"], shapes: ["array", "string", "two"],
    triggers: ["sorted array + a pair or a triple", "compare from both ends", "merge two sorted lists"] },
  { id: "window", name: "Sliding window", day: 3, cost: 2, costLabel: "O(n)", wants: ["minmax", "num", "yesno", "pos"], shapes: ["array", "string", "two"],
    triggers: ["longest or shortest substring / subarray", "at most k changes, or k distinct", "a rearrangement inside a fixed length"] },
  { id: "prefix", name: "Prefix sums / difference array", day: 4, cost: 2, costLabel: "O(n)", wants: ["num", "query", "minmax", "each", "yesno"], shapes: ["array", "grid", "queries"],
    triggers: ["range sums, and the array never changes", "count subarrays with sum k", "add v to every element in [l, r]", "all the others, without division"] },
  { id: "stack", name: "Monotonic stack / deque", day: 5, cost: 2, costLabel: "O(n)", wants: ["each", "minmax", "num", "yesno", "any"], shapes: ["array", "string"],
    triggers: ["next greater / previous smaller", "brackets or nested expressions", "remove digits for the smallest result", "max of every window of size k"] },
  { id: "bsearch", name: "Binary search", day: 6, cost: 0, costLabel: "O(log n)", wants: ["pos", "yesno", "query", "num", "kth"], shapes: ["array", "number", "queries"],
    triggers: ["sorted array + O(log n)", "for each query: how many ≤ x"] },
  { id: "bsanswer", name: "Binary search on the answer", day: 6, cost: 3, costLabel: "O(n log V)", wants: ["minimax", "minmax", "kth", "num"], shapes: ["array", "number", "grid"],
    triggers: ["minimize the maximum / maximize the minimum", "smallest speed or capacity that works", "k-th smallest of a huge implicit set"] },
  { id: "greedy", name: "Greedy", day: 8, cost: 3, costLabel: "O(n log n)", wants: ["yesno", "minmax", "num", "any", "each"], shapes: ["array", "string"],
    triggers: ["can you reach the end? fewest jumps", "order jobs so a total is smallest", "cut a string into the most parts"] },
  { id: "intervals", name: "Intervals: sort + sweep", day: 8, cost: 3, costLabel: "O(n log n)", wants: ["minmax", "num", "any", "yesno"], shapes: ["intervals"],
    triggers: ["overlapping intervals: merge or remove", "fewest points that hit every interval"] },
  { id: "heap", name: "Heap / top-k", day: 9, cost: 3, costLabel: "O(n log k)", wants: ["kth", "minmax", "num", "query", "any", "each"], shapes: ["array", "two", "queries", "intervals"],
    triggers: ["k-th largest / top k", "merge k sorted lists", "running median of a stream", "always combine the two smallest"] },
  { id: "backtrack", name: "Backtracking", day: 10, cost: 6, costLabel: "O(2ⁿ) or O(n!)", wants: ["every", "num", "yesno", "minmax"], shapes: ["array", "string", "grid", "number"],
    triggers: ["list every combination or permutation", "place pieces so none conflict", "find a word in a grid of letters"] },
  { id: "tree", name: "Tree DFS / BFS", day: 11, cost: 2, costLabel: "O(n)", wants: ["minmax", "num", "yesno", "each", "kth", "any", "pos"], shapes: ["tree"],
    triggers: ["height, diameter or a path in a binary tree", "level by level", "valid BST, or k-th smallest in a BST"] },
  { id: "graph", name: "Grid / graph BFS and DFS", day: 12, cost: 2, costLabel: "O(n + m)", wants: ["minmax", "num", "yesno", "each", "any"], shapes: ["grid", "graph", "string"],
    triggers: ["fewest steps, every move costs 1", "count islands or regions", "many starts at distance 0", "edge weights only 0 or 1", "split into two groups (2-colour)"] },
  { id: "topo", name: "Topological sort", day: 13, cost: 2, costLabel: "O(n + m)", wants: ["any", "yesno", "minmax"], shapes: ["graph", "string", "array"],
    triggers: ["prerequisites / dependencies", "an order that respects every rule"] },
  { id: "dsu", name: "Union-find", day: 13, cost: 2, costLabel: "O(n α(n))", wants: ["num", "yesno", "any", "query"], shapes: ["graph", "array", "queries", "string"],
    triggers: ["merge groups, then ask: connected?", "edges arrive one by one", "the edge that makes a cycle"] },
  { id: "shortest", name: "Dijkstra and shortest paths", day: 14, cost: 3, costLabel: "O(m log n)", wants: ["minmax", "num", "any"], shapes: ["graph", "grid"],
    triggers: ["weighted shortest path", "at most k stops", "connect everything at minimum cost"] },
  { id: "dp1", name: "1-D DP", day: 15, cost: 2, costLabel: "O(n)", wants: ["num", "minmax", "yesno"], shapes: ["array", "string", "number"],
    triggers: ["number of ways to climb or decode", "cannot take two neighbours", "buy and sell with a cooldown"] },
  { id: "dp2", name: "2-D DP", day: 16, cost: 4, costLabel: "O(n · m)", wants: ["num", "minmax", "yesno"], shapes: ["two", "grid", "string"],
    triggers: ["two strings: common subsequence or edits", "paths in a grid, moving right or down", "largest square of 1s"] },
  { id: "knapsack", name: "Knapsack / subset-sum DP", day: 17, cost: 4, costLabel: "O(n · W)", wants: ["num", "minmax", "yesno"], shapes: ["array", "number"],
    triggers: ["pick a subset under a sum or weight limit", "coins: fewest coins, or number of ways"] },
  { id: "lis", name: "LIS with bisect", day: 18, cost: 3, costLabel: "O(n log n)", wants: ["minmax", "num"], shapes: ["array", "intervals"],
    triggers: ["longest increasing subsequence", "nest envelopes or boxes"] },
  { id: "intervaldp", name: "Interval DP", day: 18, cost: 5, costLabel: "O(n³)", wants: ["minmax", "num"], shapes: ["array", "string"],
    triggers: ["merge or burst over a range l..r"] },
  { id: "bitmask", name: "Bitmask DP", day: 19, cost: 6, costLabel: "O(2ⁿ · n)", wants: ["minmax", "num", "yesno", "any"], shapes: ["array", "graph", "grid"],
    triggers: ["assign or visit each one exactly once"] },
  { id: "digit", name: "Digit DP", day: 19, cost: 0, costLabel: "O(log N)", wants: ["num"], shapes: ["number"],
    triggers: ["count numbers in [L, R] with a digit rule"] },
  { id: "treedp", name: "Tree DP / DP on a DAG", day: 20, cost: 2, costLabel: "O(n)", wants: ["minmax", "num", "each"], shapes: ["tree", "graph"],
    triggers: ["the answer for every node of a tree", "longest path in a graph with no cycles", "pick nodes, never a parent and its child"] },
  { id: "math", name: "Mod math, nCr, fast power", day: 22, cost: 0, costLabel: "O(log N)", wants: ["num", "query", "yesno"], shapes: ["number", "grid", "queries"],
    triggers: ["modulo 10⁹+7", "N or k up to 10¹⁸", "division under a prime modulus"] },
  { id: "sieve", name: "Sieve, primes, gcd", day: 23, cost: 1, costLabel: "O(√N) or O(V log V)", wants: ["num", "query", "yesno", "every", "each", "minmax"], shapes: ["number", "array", "queries"],
    triggers: ["values ≤ 10⁶ + divisors, gcd or primes", "one number x ≤ 10¹²: factor it"] },
  { id: "contribution", name: "Contribution counting", day: 23, cost: 2, costLabel: "O(n) or O(n log n)", wants: ["num"], shapes: ["array", "string"],
    triggers: ["sum over all pairs or all subarrays"] },
  { id: "bits", name: "Bits and XOR", day: 24, cost: 2, costLabel: "O(30 n)", wants: ["num", "minmax", "each", "any", "pos"], shapes: ["array", "number"],
    triggers: ["XOR", "AND / OR over pairs", "the one number that appears once"] },
  { id: "range", name: "Fenwick / segment tree", day: 25, cost: 3, costLabel: "O(log n) per query", wants: ["query", "num", "each"], shapes: ["queries", "array"],
    triggers: ["q queries with updates mixed in", "count inversions, or smaller after self", "values up to 10⁹ used as positions"] },
  { id: "strings", name: "String matching: KMP, Z, hash", day: 26, cost: 2, costLabel: "O(n + m)", wants: ["pos", "num", "yesno", "minmax", "any"], shapes: ["string", "two"],
    triggers: ["find all occurrences of p in t", "repeated substring, or the period", "longest duplicate substring", "shortest palindrome by adding a prefix"] },
  { id: "construct", name: "Constructive / invariant", day: 27, cost: 2, costLabel: "O(n)", wants: ["any", "yesno", "num"], shapes: ["number", "array"],
    triggers: ["print any valid answer", "possible after any number of operations?", "permutation of 1..n: cycles and swaps"] },
];
export const FAM: Record<string, Family> = Object.fromEntries(FAMILIES.map((f) => [f.id, f]));

export interface Choices { budget?: string; want?: string; shape?: string; trigger?: string }
export const SKIP = "skip";

export interface Out { step: 1 | 2 | 3 | 4; reason: string }

/** Why a family is ruled out by the current choices (first failing step), or null if it is still a candidate. */
export function ruleOut(f: Family, c: Choices): Out | null {
  if (c.budget && c.budget !== SKIP) {
    const b = BUDGETS.find((x) => x.id === c.budget)!;
    if (f.cost > b.rank) return { step: 1, reason: `${f.costLabel} is too slow when ${b.label}.` };
  }
  if (c.want && c.want !== SKIP && !f.wants.includes(c.want as Want)) {
    const w = WANTS.find((x) => x.id === c.want)!;
    return { step: 2, reason: `It does not usually return ${w.short}.` };
  }
  if (c.shape && c.shape !== SKIP && !f.shapes.includes(c.shape as Shape)) {
    const s = SHAPES.find((x) => x.id === c.shape)!;
    return { step: 3, reason: `It does not usually run on ${s.short === "array" ? "an array" : s.short === "one number" ? "one number" : `a ${s.short}`}.` };
  }
  if (c.trigger && c.trigger !== SKIP && !f.triggers.includes(c.trigger)) {
    return { step: 4, reason: `"${c.trigger}" is not one of its trigger phrases.` };
  }
  return null;
}

/* ---------------- Deck cards → family ---------------- */

const DAY_FAMILY: Record<number, string> = {
  1: "hash", 2: "twoptr", 3: "window", 4: "prefix", 5: "stack", 6: "bsearch", 8: "greedy", 9: "heap", 10: "backtrack", 11: "tree", 12: "graph",
  13: "topo", 14: "shortest", 15: "dp1", 16: "dp2", 17: "knapsack", 18: "lis", 19: "bitmask", 20: "treedp", 22: "math", 23: "sieve", 24: "bits",
  25: "range", 26: "strings", 27: "construct",
};
const CARD_FAMILY: Record<number, string> = {
  8: "bsanswer", 12: "bsanswer", 21: "bsanswer", 26: "bsanswer",
  44: "intervals", 52: "intervals", 78: "intervals",
  48: "dsu", 76: "dsu", 83: "dsu", 88: "dsu",
  107: "intervaldp", 109: "intervaldp", 113: "dp2",
  98: "digit", 105: "digit", 111: "dp1", 121: "contribution", 123: "contribution",
};
/** Other families the key itself names as a valid route ("... or ..."). */
const CARD_ALSO: Record<number, string[]> = {
  57: ["bsanswer"], 86: ["bitmask"], 83: ["graph"], 69: ["graph"], 129: ["range"], 131: ["range"], 33: ["math"], 49: ["heap"], 14: ["bsearch"],
  67: ["tree"], 82: ["tree"], 51: ["graph"], 102: ["knapsack"], 127: ["math"],
};
export const familyOf = (c: Card): string => CARD_FAMILY[c.n] ?? DAY_FAMILY[c.day] ?? "hash";
export const acceptedFor = (c: Card): string[] => [familyOf(c), ...(CARD_ALSO[c.n] ?? [])];

/** Split "Statement. (n ≤ 10^5)" into the statement and the constraint text. */
export function splitFront(front: string): { text: string; constraint: string | null } {
  const m = front.match(/^(.*)\(([^()]*(?:\([^()]*\)[^()]*)*)\)\s*\.?\s*$/s);
  if (!m || !/[≤<]|\d/.test(m[2])) return { text: front, constraint: null };
  return { text: m[1].trim(), constraint: m[2].trim() };
}

/** Book notation (10^5, n^2) to superscripts for display. */
const SUP: Record<string, string> = { "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹", "-": "⁻", "n": "ⁿ", "+": "⁺" };
export const pretty = (s: string) => s.replace(/\s*\((?:Clue List )?rule \d+\)|\s*\(same shape as rule \d+\)/g, "").replace(/\^(\(?)([0-9n+-]+)(\)?)/g, (_m, a: string, d: string, b: string) => (a && b ? d : a + d + b).split("").map((ch) => SUP[ch] ?? ch).join(""));

/** Worked examples for scan mode ("Play an example"). */
export interface Example { text: string; constraint: string; picks: Choices; family: string }
export const EXAMPLES: Example[] = [
  { text: "Return the indices of the two numbers that add up to target.", constraint: "n ≤ 10⁴", family: "hash",
    picks: { budget: "b2e5", want: "pos", shape: "array", trigger: "seen before? find its partner" } },
  { text: "Split an array into k parts so the largest part sum is as small as possible.", constraint: "n ≤ 10⁵, values ≤ 10⁴", family: "bsanswer",
    picks: { budget: "b2e5", want: "minimax", shape: "array", trigger: "minimize the maximum / maximize the minimum" } },
  { text: "Fewest steps from the top-left to the bottom-right of a grid with walls.", constraint: "1000 × 1000", family: "graph",
    picks: { budget: "b1e6", want: "minmax", shape: "grid", trigger: "fewest steps, every move costs 1" } },
  { text: "Count the ways to climb n stairs taking 1 or 2 steps at a time.", constraint: "n ≤ 45", family: "dp1",
    picks: { budget: "b500", want: "num", shape: "number", trigger: "number of ways to climb or decode" } },
];
