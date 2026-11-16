import type { Visual, FlowSpec, ArrayVisual, GridVisual, TreeVisual, GraphVisual } from "@/content/types";
// Owned by the diagram-engine agent: sample visuals covering every feature, shown at #diagrams.

/* ---------------- flip books (the same visual repeated across steps) ---------------- */

/** LC 167 Two Sum II - Input Array Is Sorted: nums = [1, 6, 7, 8, 9, 20], target = 14. */
const twoSumFrames = (): ArrayVisual[] => {
  const nums = [1, 6, 7, 8, 9, 20];
  const frame = (L: number, R: number, verdict: "big" | "small" | "hit", caption: string): ArrayVisual => {
    const tones: Record<number, "neutral" | "good" | "warn"> = {};
    nums.forEach((_, i) => { if (i < L || i > R) tones[i] = "neutral"; });
    if (verdict === "hit") { tones[L] = "good"; tones[R] = "good"; }
    const sum = nums[L] + nums[R];
    return {
      kind: "array", indices: true,
      rows: [
        { label: "nums", items: nums, tones,
          pointers: [{ at: L, label: "L" }, { at: R, label: "R" }],
          ranges: [{ from: L, to: R, label: "still possible", tone: verdict === "hit" ? "good" : "accent" }] },
        { label: "sum", items: [sum], tones: { 0: verdict === "hit" ? "good" : "warn" } },
      ],
      caption,
    };
  };
  return [
    frame(0, 5, "big", "Start with `L` at the smallest and `R` at the largest. 1 + 20 = 21 is **too big**, so move `R` left."),
    frame(0, 4, "small", "1 + 9 = 10 is **too small**, so move `L` right. Every pair with 1 is now ruled out."),
    frame(1, 4, "big", "6 + 9 = 15 is too big again. Move `R` left. The gray cells can never be part of the answer."),
    frame(1, 3, "hit", "6 + 8 = 14. **Found** in 4 checks instead of 15 pairs."),
  ];
};

/** LC 1143 Longest Common Subsequence: text1 = "abcde" (columns), text2 = "ace" (rows). */
const lcsFrames = (): GridVisual[] => {
  const full = [
    [0, 0, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 1],
    [0, 1, 1, 2, 2, 2],
    [0, 1, 1, 2, 2, 3],
  ];
  const upTo = (r: number, c: number) => full.map((row, i) => row.map((x, j) => (i === 0 || j === 0 || i < r || (i === r && j <= c) ? x : "")));
  const base: Record<string, "neutral"> = {};
  for (let j = 0; j < 6; j++) base[`0,${j}`] = "neutral";
  for (let i = 1; i < 4; i++) base[`${i},0`] = "neutral";
  const g = (cells: (string | number)[][], extra: GridVisual["tones"], arrows: GridVisual["arrows"], caption: string): GridVisual => ({
    kind: "grid", cells, colLabels: ["", "a", "b", "c", "d", "e"], rowLabels: ["", "a", "c", "e"],
    tones: { ...base, ...extra }, arrows, caption,
  });
  return [
    g(upTo(0, 0), {}, [], "Row 0 and column 0 are 0: an empty string has nothing in common with anything."),
    g(upTo(1, 1), { "1,1": "good" }, [{ from: [0, 0], to: [1, 1], tone: "accent" }], "`a` = `a`, so take the diagonal and add 1."),
    g(upTo(2, 3), { "2,3": "good" }, [{ from: [1, 2], to: [2, 3], tone: "accent" }], "`c` = `c`: diagonal + 1 = 2."),
    g(upTo(2, 4), { "2,4": "accent" }, [{ from: [1, 4], to: [2, 4] }, { from: [2, 3], to: [2, 4] }], "`c` and `d` differ: take the **max** of the cell above and the cell to the left."),
  ];
};

/** LC 104 Maximum Depth of Binary Tree on [3, 9, 20, null, null, 15, 7]: each call returns 1 + max(children). */
const depthFrames = (): TreeVisual[] => {
  const nodes = [3, 9, 20, null, null, 15, 7];
  return [
    { kind: "tree", nodes, tones: { 0: "accent" }, caption: "Call `depth(3)`. It must ask both children first." },
    { kind: "tree", nodes, tones: { 0: "accent", 1: "good" }, notes: { 1: "1" }, caption: "`9` has no children, so it returns 1." },
    { kind: "tree", nodes, tones: { 0: "accent", 1: "good", 2: "good", 5: "good", 6: "good" }, notes: { 1: "1", 2: "2", 5: "1", 6: "1" }, caption: "`15` and `7` return 1, so `20` returns 1 + max(1, 1) = 2." },
    { kind: "tree", nodes, tones: { 0: "good", 1: "good", 2: "good", 5: "good", 6: "good" }, notes: { 0: "3", 1: "1", 2: "2", 5: "1", 6: "1" }, caption: "The root returns 1 + max(1, 2) = **3**." },
  ];
};

/** Dijkstra from A on a small directed graph. Notes are the best known distances. */
const dijkstraFrames = (): GraphVisual[] => {
  const pos = { A: [6, 50], B: [40, 12], C: [40, 88], D: [74, 50], E: [100, 50] } as const;
  const edges: GraphVisual["edges"] = [
    { from: "A", to: "B", w: 4, directed: true }, { from: "A", to: "C", w: 1, directed: true },
    { from: "C", to: "B", w: 2, directed: true }, { from: "B", to: "D", w: 1, directed: true },
    { from: "C", to: "D", w: 5, directed: true }, { from: "D", to: "E", w: 3, directed: true },
  ];
  const f = (dist: Record<string, string>, tones: Record<string, "good" | "accent" | "neutral">, hot: string[], caption: string): GraphVisual => ({
    kind: "graph",
    nodes: (Object.keys(pos) as (keyof typeof pos)[]).map((id) => ({ id, x: pos[id][0], y: pos[id][1], note: `d=${dist[id] ?? "∞"}`, tone: tones[id] })),
    edges: edges.map((e) => (hot.includes(`${e.from}>${e.to}`) ? { ...e, tone: "accent" as const } : e)),
    caption,
  });
  return [
    f({ A: "0" }, { A: "accent" }, [], "Start: A is 0 away, every other node is ∞."),
    f({ A: "0", B: "4", C: "1" }, { A: "good" }, ["A>B", "A>C"], "Pop A and relax its edges: B = 4, C = 1."),
    f({ A: "0", B: "3", C: "1", D: "6" }, { A: "good", C: "good" }, ["C>B", "C>D"], "Pop C (the smallest). Going through C makes B **3**, cheaper than 4."),
    f({ A: "0", B: "3", C: "1", D: "4", E: "7" }, { A: "good", C: "good", B: "good", D: "good", E: "good" }, ["A>C", "C>B", "B>D", "D>E"], "Every node is final. The shortest path to E is A, C, B, D, E with length 7."),
  ];
};

export const FLIPBOOKS: { title: string; frames: Visual[] }[] = [
  { title: "Array: two pointers", frames: twoSumFrames() },
  { title: "Grid: LCS table", frames: lcsFrames() },
  { title: "Tree: post-order return values", frames: depthFrames() },
  { title: "Graph: Dijkstra", frames: dijkstraFrames() },
];

/* ---------------- one of every visual kind ---------------- */

const loop: FlowSpec = {
  nodes: [
    { id: "read", label: "Read the problem", sub: "input, output, limits", kind: "generic", col: 0, row: 0 },
    { id: "limits", label: "Check n", sub: "n ≤ 2·10^5", kind: "monitor", col: 1, row: 0, badge: "n log n" },
    { id: "clue", label: "Spot the clue", sub: "sorted, pairs, target", kind: "resolver", col: 2, row: 0 },
    { id: "pattern", label: "Name the pattern", sub: "two pointers", kind: "steering", col: 3, row: 0, tone: "accent" },
    { id: "code", label: "Type the template", sub: "from memory", kind: "api", col: 3, row: 1 },
    { id: "test", label: "Run the samples", kind: "service", col: 2, row: 1, badge: "PASS" },
    { id: "brute", label: "Brute force", sub: "O(n²), too slow", kind: "generic", col: 1, row: 1, tone: "bad" },
  ],
  edges: [
    { from: "read", to: "limits" }, { from: "limits", to: "clue", label: "budget" }, { from: "clue", to: "pattern" },
    { from: "pattern", to: "code" }, { from: "code", to: "test" },
    { from: "limits", to: "brute", label: "rules out", dashed: true, tone: "bad" },
  ],
  groups: [{ id: "fast", label: "The 15-second part", nodes: ["limits", "clue", "pattern"], tone: "accent" }],
};


/* Regression cases: a 3x3 snake with a back edge, and a 4x2 snake that turns tall on phones. */
const snakeLoop: FlowSpec = {
  direction: "right",
  nodes: [
    { id: "u", label: "1 Understand", sub: "restate, do the sample", col: 0, row: 0 },
    { id: "c", label: "2 Constraints", sub: "n gives target O()", col: 1, row: 0 },
    { id: "b", label: "3 Brute force", sub: "dumbest correct way", col: 2, row: 0 },
    { id: "w", label: "4 Find the waste", sub: "what repeats?", col: 2, row: 1, tone: "warn" },
    { id: "h", label: "5 Hypothesis", sub: "a written claim", col: 1, row: 1 },
    { id: "s", label: "6 Small cases", sub: "3-4 tiny inputs by hand", col: 0, row: 1 },
    { id: "p", label: "7 Prove or break", sub: "why always right?", col: 0, row: 2 },
    { id: "k", label: "8 Code", sub: "from the plan", col: 1, row: 2 },
    { id: "t", label: "9 Stress test", sub: "brute vs fast", col: 2, row: 2, tone: "good" },
  ],
  edges: [
    { from: "u", to: "c" }, { from: "c", to: "b" }, { from: "b", to: "w" }, { from: "w", to: "h" },
    { from: "h", to: "s" }, { from: "s", to: "p" }, { from: "p", to: "k" }, { from: "k", to: "t" },
    { from: "p", to: "h", dashed: true, tone: "bad", label: "broken" },
  ],
};
const snakeDay: FlowSpec = {
  nodes: [
    { id: "b1", label: "Upsolve #4", sub: "45 min", col: 0, row: 0 },
    { id: "b2", label: "CF virtual", sub: "Div 3 or Div 4", col: 1, row: 0 },
    { id: "br", label: "Break", sub: "20 min, off screen", col: 2, row: 0 },
    { id: "b3", label: "ABC virtual", sub: "100 min, A to D", col: 3, row: 0 },
    { id: "b4", label: "Tally journal", sub: "15 min", col: 3, row: 1 },
    { id: "b5", label: "Weak-topic patch", sub: "75 min", col: 2, row: 1 },
    { id: "b6", label: "Log + cards", sub: "15 min", col: 1, row: 1 },
  ],
  edges: [{ from: "b1", to: "b2" }, { from: "b2", to: "br" }, { from: "br", to: "b3" }, { from: "b3", to: "b4" }, { from: "b4", to: "b5" }, { from: "b5", to: "b6" }],
};

export const DEMOS: Visual[] = [
  { kind: "flow", spec: snakeLoop, caption: "A snake with a dashed back edge from step 7 to step 5." },
  { kind: "flow", spec: snakeDay, caption: "A 4 by 2 snake. On a phone it turns on its side and must stay short." },
  { kind: "flow", spec: loop, caption: "The recognition loop. The limits on **n** decide which patterns are even allowed." },
  { kind: "flow", spec: { ...loop, focus: ["read", "limits", "clue", "pattern"], flow: ["read>limits", "limits>clue", "clue>pattern"] }, caption: "Same diagram, next step: `focus` dims the rest and a dot follows the path." },
  {
    kind: "sequence",
    spec: {
      actors: [
        { id: "you", label: "You", kind: "viewer" },
        { id: "judge", label: "Online judge", kind: "service" },
        { id: "tests", label: "Hidden tests", kind: "database" },
      ],
      messages: [
        { from: "you", to: "judge", label: "Submit solution.py" },
        { from: "judge", to: "tests", label: "Run test 1 to 52" },
        { from: "tests", to: "judge", label: "Test 37: 2.4 s", dashed: true, tone: "bad", note: "Limit is 1 s" },
        { from: "judge", to: "you", label: "Time Limit Exceeded", dashed: true, tone: "bad" },
        { from: "you", to: "you", label: "Swap O(n²) for two pointers" },
      ],
      upTo: 3,
    },
    caption: "A submission revealed step by step with `upTo`.",
  },
  {
    kind: "table",
    headers: ["n up to", "Allowed complexity", "Typical pattern"],
    rows: [["10", "O(n!)", "Permutations"], ["20", "O(2^n)", "Bitmask search"], ["5000", "O(n²)", "Double loop, 2-D DP"], ["2·10^5", "O(n log n)", "Sort, heap, binary search"], ["10^7", "O(n)", "One pass, prefix sums"]],
    caption: "About 10^7 simple operations per second in CPython.",
  },
  {
    kind: "code", lang: "python",
    code: `def two_sum(nums, target):
    L, R = 0, len(nums) - 1
    while L < R:
        s = nums[L] + nums[R]
        if s == target:
            return [L + 1, R + 1]  # 1-indexed
        if s < target:
            L += 1
        else:
            R -= 1`,
    caption: "The two-pointer template for a sorted array.",
  },
  {
    kind: "stats",
    items: [{ value: "10^7", label: "CPython ops / second" }, { value: "10^8", label: "PyPy ops / second" }, { value: "15 s", label: "To name the pattern" }, { value: "85%", label: "Day 30 exam target" }],
    caption: "Four numbers to keep in your head.",
  },
  {
    kind: "compare",
    left: { title: "Brute force", points: ["Try every pair", "O(n²) time", "Fine for n up to about 3000"] },
    right: { title: "Two pointers", points: ["Needs a sorted array", "O(n) time after sorting", "Each step rules out a whole row of pairs"] },
    caption: "Same answer, very different running time.",
  },
  {
    kind: "array", indices: true,
    rows: [
      { label: "nums", items: [3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5, 8, 9, 7, 9, 3, 2, 3, 8, 4],
        pointers: [{ at: 4, label: "i" }, { at: 4, label: "j", tone: "warn" }, { at: 4, label: "mid", tone: "neutral" }, { at: 20, label: "n", tone: "neutral" }],
        ranges: [{ from: 0, to: 3, label: "sorted part", tone: "good" }, { from: 9, to: 14, label: "window k = 6" }],
        tones: { 5: "accent", 12: "bad", 14: "warn" } },
      { label: "prefix", items: [3, 4, 8, 9, 14, 23, 25, 31, 36, 39, 44, 52, 61, 68, 77, 80, 82, 85, 93, 97] },
    ],
    caption: "Twenty cells, a stack of three pointers on one cell, a pointer past the end and two labelled ranges. On a phone the cells shrink, then the row scrolls inside the card.",
  },
  {
    kind: "array",
    rows: [
      { label: "s", items: ["a", "b", "c", "a", "b", "c", "b", "b"], pointers: [{ at: 1, label: "left" }, { at: 3, label: "right" }], ranges: [{ from: 1, to: 3 }], tones: { 3: "bad" } },
      { label: "stack", items: ["(", "[", "{", "", ""], tones: { 2: "accent" } },
    ],
    caption: "Characters use the mono font. Empty strings draw as empty slots.",
  },
  {
    kind: "grid",
    cells: [
      ["S", 1, 2, "#", 8, 9],
      [1, "#", 3, "#", 7, 8],
      [2, 3, 4, 5, 6, "#"],
      ["#", "#", 5, "#", 7, "G"],
    ],
    tones: { "0,0": "accent", "3,5": "good", "2,2": "warn", "2,3": "warn", "2,4": "warn" },
    arrows: [{ from: [2, 2], to: [2, 3], tone: "warn" }, { from: [2, 3], to: [2, 4], tone: "warn" }, { from: [2, 4], to: [3, 4] }],
    caption: "A BFS map: `#` cells are walls, numbers are steps from S.",
  },
  {
    kind: "tree",
    nodes: [1, 2, 3, 4, 5, null, 6, null, null, 7, 8, null, 9],
    tones: { 1: "accent", 4: "accent", 9: "good" },
    notes: { 0: "root", 3: "leaf", 9: "h=3", 10: "h=3", 12: "h=3" },
    caption: "A lopsided tree from a LeetCode list. Notes sit on the outer side of each node.",
  },
  {
    kind: "graph",
    nodes: [
      { id: "1", x: 0, y: 30 }, { id: "2", x: 30, y: 0 }, { id: "3", x: 30, y: 60, tone: "accent" },
      { id: "4", x: 62, y: 30, tone: "bad", note: "cycle" }, { id: "5", x: 95, y: 30 },
    ],
    edges: [
      { from: "1", to: "2" }, { from: "1", to: "3" }, { from: "2", to: "4", directed: true }, { from: "4", to: "2", directed: true, tone: "bad" },
      { from: "3", to: "4", w: 7, dashed: true }, { from: "4", to: "5", w: "x2", tone: "good" },
    ],
    caption: "Undirected and directed edges, a two-way pair that curves apart, a dashed edge and weight pills.",
  },
];
