import type { Lesson } from "../types";
// Chapter 6, part 2: Days 19-21 (bitmask DP + digit DP, tree/DAG/state-machine DP, DP mixed review + Contest #3).
// Lesson ids continue after part 1: ch06-l9 ... ch06-l14.

const TRI = {
  kind: "graph" as const,
  nodes: [
    { id: "0", label: "0", x: 15, y: 75, tone: "accent" as const, note: "start" },
    { id: "1", label: "1", x: 50, y: 20 },
    { id: "2", label: "2", x: 85, y: 75 },
  ],
  edges: [
    { from: "0", to: "1", w: 1 },
    { from: "1", to: "2", w: 2 },
    { from: "0", to: "2", w: 4 },
  ],
  caption: "Three cities. Start at 0 and visit all of them.",
};

const MASKS = ["001 {0}", "011 {0,1}", "101 {0,2}", "111 {0,1,2}"];
const LASTS = ["last 0", "last 1", "last 2"];
const INF = "∞";

const ROBBER_TREE: (number | null)[] = [3, 2, 3, null, 3, null, 1];

const DAG_NODES = (notes: Record<string, string>, tones: Record<string, "good" | "accent" | "neutral"> = {}) =>
  [
    { id: "0", label: "0", x: 10, y: 50 },
    { id: "2", label: "2", x: 40, y: 85 },
    { id: "1", label: "1", x: 60, y: 15 },
    { id: "3", label: "3", x: 90, y: 50 },
  ].map((n) => ({ ...n, note: notes[n.id], tone: tones[n.id] }));
const DAG_EDGES = (good: string[] = []) =>
  [
    ["0", "1"], ["0", "2"], ["2", "1"], ["1", "3"], ["2", "3"],
  ].map(([from, to]) => ({ from, to, directed: true, tone: good.includes(`${from}>${to}`) ? ("good" as const) : undefined }));

const STOCK_DAYS = ["start", "p = 1", "p = 2", "p = 3", "p = 0", "p = 2"];

const lessons: Lesson[] = [
  /* ================================================================
     Day 19 A: bitmask DP + digit DP
     ================================================================ */
  {
    id: "ch06-l9",
    day: 19,
    title: "Day 19: Bitmask DP and digit DP",
    goal: "Turn \"n ≤ 20 + subsets or orders\" into dp[mask] or dp[mask][last], and count numbers in [L, R] with one digit-DP template.",
    minutes: 12,
    steps: [
      {
        kind: "read",
        title: "Tiny n, huge N",
        body: "Some problems give you a tiny n, like n ≤ 16 or n ≤ 20, and ask about **orders** or **subsets**: visit every city, give every worker a job. Others ask you to count numbers up to 10^18 that follow a digit rule.\n\nToday you learn the two DP shapes for these: **[[bitmask DP]]** and **[[digit DP]]**.\n\n**Goal:** recognise \"n ≤ 20 + subsets/orderings\" as `dp[mask]` or `dp[mask][last]`, and write one digit-DP template that counts numbers in [L, R] with a digit property.",
      },
      {
        kind: "quiz",
        guess: true,
        prompt: "Five cities, 0 to 4. Two partial routes: 0→1→2→3 and 0→2→1→3. Both visited {0, 1, 2, 3}, both stand at city 3, and city 4 is left. Does the best way to finish depend on which route you took?",
        options: [
          "No. Only which cities are visited and where you stand matter",
          "Yes. The order of the earlier cities changes the best finish",
          "Only if the two routes have the same cost so far",
        ],
        answer: 0,
        explain: "The rest of the trip only needs two facts: which cities are still left, and where you stand now. So both routes are the same **state**. Keep the cheaper one and forget the other. That is the whole trick of bitmask DP.",
      },
      {
        kind: "read",
        title: "A set stored in one integer",
        body: "A **[[bitmask]]** is an integer whose bits store a set. Bit i is 1 when item i is in the set. With 4 items, the set {0, 1, 3} is 1 + 2 + 8 = 11.\n\nThree moves you need:\n- `mask >> i & 1` tests whether item i is in the set.\n- `mask | (1 << i)` adds item i.\n- `1 << n` is 2^n, the number of different sets.\n\nSo every subset of n items is one number from 0 to 2^n − 1.",
        visual: {
          kind: "array",
          rows: [
            { label: "item i", items: [0, 1, 2, 3] },
            { label: "in set?", items: [1, 1, 0, 1], tones: { 0: "good", 1: "good", 3: "good" } },
            { label: "value", items: [1, 2, 4, 8], tones: { 0: "good", 1: "good", 3: "good" } },
          ],
          caption: "mask = 1 + 2 + 8 = 11, written 1011 in binary (bit 0 is the rightmost digit).",
        },
      },
      {
        kind: "read",
        title: "Why the order stops mattering",
        body: "In [[backtracking]] (Day 10) you tried all n! orders. But after 0→1→2→3 and after 0→2→1→3, the future is the same. Both still need city 4, and both stand at 3.\n\nSo the **[[state]]** is (which cities are used, where you stand) = `(mask, last)`. For each state, keep only the cheapest history.\n\nThat collapses n! orders into 2^n · n states. At n = 16: 16! is about 2·10^13, but 2^16 · 16 is about 10^6.",
        visual: {
          kind: "graph",
          nodes: [
            { id: "0", label: "0", x: 10, y: 50, tone: "accent" },
            { id: "1", label: "1", x: 40, y: 15 },
            { id: "2", label: "2", x: 40, y: 85 },
            { id: "3", label: "3", x: 70, y: 50, tone: "good", note: "same state" },
            { id: "4", label: "4", x: 95, y: 50, note: "left" },
          ],
          edges: [
            { from: "0", to: "1", directed: true, tone: "accent" },
            { from: "1", to: "2", directed: true, tone: "accent" },
            { from: "2", to: "3", directed: true, tone: "accent" },
            { from: "0", to: "2", directed: true, tone: "warn", dashed: true },
            { from: "2", to: "1", directed: true, tone: "warn", dashed: true },
            { from: "1", to: "3", directed: true, tone: "warn", dashed: true },
          ],
          caption: "Solid route 0→1→2→3 and dashed route 0→2→1→3 end in the same state: mask {0,1,2,3}, last = 3.",
        },
      },
      {
        kind: "read",
        title: "dp[mask][last] in words",
        body: "This is the **travelling salesman** shape (TSP): shortest route through all nodes.\n- **State:** `dp[mask][last]` = min cost of a route that started at 0, visited exactly the cities in `mask`, and stands at `last`.\n- **Base:** `dp[1][0] = 0` (only city 0 visited). Everything else starts at infinity.\n- **Transition:** last choice = the next city `nxt` not in mask: `dp[mask | 1<<nxt][nxt] = min(.., dp[mask][last] + dist[last][nxt])`.\n- **Answer:** `min(dp[full])` over every `last`, with full = 2^n − 1.",
        visual: TRI,
      },
      {
        kind: "read",
        title: "Worked example: the base cell",
        body: "Same three cities: 0–1 costs 1, 1–2 costs 2, 0–2 costs 4. By eye, 0→1→2 costs 3 and 0→2→1 costs 6. Let the table find it.\n\nRows are masks (binary, city 0 is the rightmost bit), columns are `last`. Masks without city 0 can never be reached, so they are hidden.\n\nBase: `dp[001][0] = 0`. Every other cell is ∞ for now.",
        visual: {
          kind: "grid",
          cells: [
            [0, INF, INF],
            [INF, INF, INF],
            [INF, INF, INF],
            [INF, INF, INF],
          ],
          rowLabels: MASKS,
          colLabels: LASTS,
          tones: { "0,0": "accent" },
          caption: "Only the base cell is known.",
        },
      },
      {
        kind: "read",
        title: "Worked example: leave city 0",
        body: "Mask 001 is first. From `dp[001][0] = 0`, try each city not in the mask.\n\n- Go to city 1: mask becomes 011, cost 0 + 1 = 1. So `dp[011][1] = 1`.\n- Go to city 2: mask becomes 101, cost 0 + 4 = 4. So `dp[101][2] = 4`.\n\nBoth arrows go down to a bigger mask, because adding a city only turns a bit on.",
        visual: {
          kind: "grid",
          cells: [
            [0, INF, INF],
            [INF, 1, INF],
            [INF, INF, 4],
            [INF, INF, INF],
          ],
          rowLabels: MASKS,
          colLabels: LASTS,
          tones: { "0,0": "accent", "1,1": "good", "2,2": "good" },
          arrows: [
            { from: [0, 0], to: [1, 1], tone: "good" },
            { from: [0, 0], to: [2, 2], tone: "good" },
          ],
          caption: "Two new cells, each one step from the base.",
        },
      },
      {
        kind: "read",
        title: "Worked example: the full mask",
        body: "Next masks in increasing order: 011, then 101.\n\n- From `dp[011][1] = 1`, only city 2 is left: 1 + 2 = 3. So `dp[111][2] = 3`.\n- From `dp[101][2] = 4`, only city 1 is left: 4 + 2 = 6. So `dp[111][1] = 6`.\n\nEach cell was final before it was read, because every arrow points to a bigger mask. That is why plain increasing order of `mask` is a correct fill order.",
        visual: {
          kind: "grid",
          cells: [
            [0, INF, INF],
            [INF, 1, INF],
            [INF, INF, 4],
            [INF, 6, 3],
          ],
          rowLabels: MASKS,
          colLabels: LASTS,
          tones: { "1,1": "accent", "2,2": "accent", "3,1": "good", "3,2": "good" },
          arrows: [
            { from: [1, 1], to: [3, 2], tone: "good" },
            { from: [2, 2], to: [3, 1], tone: "good" },
          ],
          caption: "The last row is the full mask 111: every city visited.",
        },
      },
      {
        kind: "read",
        title: "Worked example: read the answer",
        body: "The answer lives in the full-mask row: `min(dp[111]) = min(∞, 6, 3) = 3`. The route is 0→1→2, which matches what you saw by eye.\n\nFor a **closed tour** that returns to 0, add `dist[last][0]` to each cell before taking the min: min(6 + 1, 3 + 4) = 7.",
        visual: {
          kind: "grid",
          cells: [
            [0, INF, INF],
            [INF, 1, INF],
            [INF, INF, 4],
            [INF, 6, 3],
          ],
          rowLabels: MASKS,
          colLabels: LASTS,
          tones: { "3,2": "good", "3,1": "neutral" },
          caption: "Answer cell: dp[111][2] = 3.",
        },
      },
      {
        kind: "read",
        title: "How big can n be?",
        body: "Complexity = number of states × cost of one transition. `dp[mask][last]` has 2^n · n states, and each loops over n next cities: O(2^n · n²).\n\n- n = 16: 65,536 · 256 ≈ 1.7·10^7. Safe in Python.\n- n = 20: about 4·10^8. [[TLE|TLE (Time Limit Exceeded)]] in Python.\n- At n = 20 only `dp[mask]` with an O(n) step survives: 2^20 · 20 ≈ 2·10^7, in [[PyPy]].",
        visual: {
          kind: "stats",
          items: [
            { value: "1.7·10^7", label: "n = 16, dp[mask][last]", note: "safe in Python" },
            { value: "4·10^8", label: "n = 20, dp[mask][last]", note: "TLE in Python" },
            { value: "2·10^7", label: "n = 20, dp[mask], O(n) step", note: "PyPy" },
          ],
        },
        callout: { type: "move", text: "n ≤ 20 in the constraints is a loud signal. It means \"the setter expects 2^n\". If n ≤ 20 and the problem is about orderings or subsets, write `mask` before anything else." },
      },
      {
        kind: "quiz",
        teach: "For `dp[mask][last]` with a loop over the next item, steps ≈ 2^n · n · n. CPython does about 10^7 simple steps per second.",
        prompt: "A problem has n = 18 and needs `dp[mask][last]` with a loop over the next item. About how many steps is that, and is it safe in CPython with a 1 s limit?",
        options: [
          "About 8·10^7: too slow for CPython",
          "About 10^6: easily safe",
          "About 10^4: instant",
        ],
        answer: 0,
        explain: "2^18 = 262,144, and 18 · 18 = 324. So about 262,144 · 324 ≈ 8.5·10^7 steps: around 8 seconds in CPython. Use PyPy, or look for a `dp[mask]` state with an O(n) step.",
      },
      {
        kind: "read",
        title: "dp[mask] alone: assignment",
        body: "Sometimes you don't need `last`. **Assignment:** n workers, n jobs, cost[i][j]. Give jobs to workers in order 0, 1, 2, ... Then the mask of used jobs tells you who is next: worker **popcount(mask)**, the number of 1 bits.\n\n- **State:** `dp[mask]` = min cost after the jobs in mask went to workers 0 .. popcount − 1.\n- **Base:** `dp[0] = 0`.\n- **Transition:** worker i = popcount(mask) takes a free job j.\n- **Answer:** `dp[full]`.",
        visual: { kind: "code", lang: "python", code: "pc = [0] * full\nfor m in range(1, full):\n    pc[m] = pc[m >> 1] + (m & 1)        # popcount of every mask in O(2^n)\n# Python 3.10+: mask.bit_count() is also fast\n", caption: "Precompute popcount for every mask once." },
        callout: { type: "trap", text: "`bin(mask).count('1')` inside a hot loop is slow. Precompute `pc = [0] * full` with `pc[m] = pc[m >> 1] + (m & 1)`. On Python 3.10+, `mask.bit_count()` is fast." },
      },
      {
        kind: "read",
        title: "Worked example: two workers",
        body: "cost = [[3, 1], [2, 5]] (row = worker, column = job). Bit 0 = job 0.\n\n- mask 00 (popcount 0, worker 0): job 0 → `dp[01] = 3`; job 1 → `dp[10] = 1`.\n- mask 01 (worker 1): only job 1 is free → 3 + 5 = 8.\n- mask 10 (worker 1): only job 0 is free → 1 + 2 = 3.\n\n`dp[11] = min(8, 3) = 3`: worker 0 takes job 1, worker 1 takes job 0.",
        visual: {
          kind: "array",
          rows: [
            { label: "mask", items: ["00", "01", "10", "11"] },
            { label: "dp", items: [0, 3, 1, 3], tones: { 0: "accent", 3: "good" } },
          ],
          caption: "Four masks, filled in increasing order. dp[11] is the answer.",
        },
      },
      {
        kind: "widget",
        widget: "bits",
        title: "Subsets are numbers",
        task: "The mask 11 is 1011 in binary: the set {0, 1, 3}. Step through its subsets. Each subset is a number whose 1 bits all sit inside 1011. A set of 3 items has 2^3 = 8 subsets. Check that you see 8.",
        props: { mode: "subsets", x: 11 },
      },
      {
        kind: "read",
        title: "The TSP template, line by line",
        body: "- `full = 1 << n` masks; every `dp[mask][last]` starts at INF.\n- `dp[1][0] = 0`: mask 1 means only city 0.\n- For each mask in increasing order, each reachable `last`, and each `nxt` not in mask (`mask >> nxt & 1` is 0): relax `dp[nm][nxt]`.\n- Answer: `min(dp[full - 1])`.\n\nMental test on the 3-city example: it fills 1 and 4, then 3 and 6, and returns 3.",
        visual: { kind: "code", lang: "python", code: "def shortest_visit_all(dist):            # n <= ~16 in Python\n    n = len(dist)\n    INF = float('inf')\n    full = 1 << n\n    dp = [[INF] * n for _ in range(full)]  # dp[mask][last] = min cost; visited = mask, standing at last\n    dp[1][0] = 0\n    for mask in range(1, full):\n        row = dp[mask]\n        for last in range(n):\n            cur = row[last]\n            if cur == INF:\n                continue\n            for nxt in range(n):\n                if mask >> nxt & 1:\n                    continue\n                nm = mask | (1 << nxt)\n                c = cur + dist[last][nxt]\n                if c < dp[nm][nxt]:\n                    dp[nm][nxt] = c\n    return min(dp[full - 1])             # add dist[last][0] inside min() for a closed tour\n" },
      },
      {
        kind: "code",
        title: "Now type it yourself",
        prompt: "Write `shortest_visit_all(dist)`: the cost of the shortest route that starts at node 0 and visits every node exactly once (no return to 0). `dist[a][b]` is the cost from a to b. Say the state out loud first.",
        starter: "def shortest_visit_all(dist):\n    # state: dp[mask][last] = min cost, visited = mask, standing at last\n    # base: dp[1][0] = 0\n    # answer: min over the full mask\n    pass\n",
        solution: "def shortest_visit_all(dist):            # n <= ~16 in Python\n    n = len(dist)\n    INF = float('inf')\n    full = 1 << n\n    dp = [[INF] * n for _ in range(full)]  # dp[mask][last] = min cost; visited = mask, standing at last\n    dp[1][0] = 0\n    for mask in range(1, full):\n        row = dp[mask]\n        for last in range(n):\n            cur = row[last]\n            if cur == INF:\n                continue\n            for nxt in range(n):\n                if mask >> nxt & 1:\n                    continue\n                nm = mask | (1 << nxt)\n                c = cur + dist[last][nxt]\n                if c < dp[nm][nxt]:\n                    dp[nm][nxt] = c\n    return min(dp[full - 1])             # add dist[last][0] inside min() for a closed tour\n",
        tests: [
          { call: "shortest_visit_all([[0, 1, 4], [1, 0, 2], [4, 2, 0]])", expect: "3", label: "the 3-city example" },
          { call: "shortest_visit_all([[0, 1, 15, 6], [2, 0, 7, 3], [9, 6, 0, 12], [10, 4, 8, 0]])", expect: "12", label: "4 nodes, not symmetric" },
          { call: "shortest_visit_all([[0, 5], [5, 0]])", expect: "5" },
          { call: "shortest_visit_all([[0]])", expect: "0", label: "one node" },
        ],
        teach: "dp[mask][last] = min cost having visited mask and standing at last. Start with dp[1][0] = 0, go through masks in increasing order, and for each next city not in mask relax dp[mask | 1 << nxt][nxt].",
        explain: "Every transition goes to a bigger mask, so increasing order fills every cell before it is read. For a closed tour, return `min(dp[full - 1][last] + dist[last][0] for last in range(n))`.",
        fromMemory: true,
      },
      {
        kind: "read",
        title: "Digit DP: count, don't loop",
        body: "A different problem: **count** the x in [0, N] with a digit rule, where N can be 10^18. You can't loop over 10^18 numbers.\n\n**Digit DP** builds x one digit at a time from the left, and counts the ways. The state is `(pos, tight, started, extra)`:\n- `pos`: which digit you are placing.\n- `tight`: the digits so far equal N's prefix.\n- `started`: a non-zero digit has appeared.\n- `extra`: what the rule needs: the previous digit, the digit sum mod k, or a mask of used digits.",
      },
      {
        kind: "read",
        title: "tight: never go above N",
        body: "**tight** stops x from going above N. Take N = 23.\n\nAt pos 0 you may place 0, 1 or 2. If you place 2, x matches N so far, so you stay tight: the next digit is capped at 3. If you place 0 or 1, x is already smaller than N, so the next digit is free: 0 to 9, for good.\n\nIn code: `limit = int(s[pos]) if tight else 9`, and the new tight is `tight and d == limit`.",
        visual: {
          kind: "array",
          rows: [
            { label: "N", items: ["2", "3"] },
            { label: "x", items: ["2", "?"], tones: { 0: "accent" }, pointers: [{ at: 1, label: "pos 1: 0..3", tone: "accent" }] },
            { label: "x", items: ["1", "?"], tones: { 0: "good" }, pointers: [{ at: 1, label: "pos 1: 0..9", tone: "good" }] },
          ],
          caption: "Placing N's own digit keeps you tight. Placing a smaller digit frees every later digit.",
        },
      },
      {
        kind: "read",
        title: "started: leading zeros are not digits",
        body: "**started** handles leading zeros. With N = 100, the number 7 is built as 0, 0, 7.\n\nTake the rule \"no two adjacent digits are equal\". Without `started`, the two leading zeros look like equal neighbours, so 7 is wrongly rejected. With `started = False`, those zeros are not real digits, so the check is skipped until the first non-zero digit.",
        visual: {
          kind: "array",
          rows: [
            { label: "N", items: ["1", "0", "0"] },
            { label: "x = 7", items: ["0", "0", "7"], tones: { 0: "bad", 1: "bad", 2: "good" } },
          ],
          caption: "The red zeros are padding, not digits of 7.",
        },
        callout: { type: "mistake", text: "Forgetting `started` in digit DP. Without it, leading zeros count as real digits, so 7 is read as \"007\" and fails \"adjacent digits differ\". Every digit-DP bug list starts here." },
      },
      {
        kind: "read",
        title: "Worked example: count_upto(11)",
        body: "Rule: adjacent digits differ. N = 11, s = \"11\". Count x in [0, 11].\n\n- pos 0 is tight, so d is 0 or 1.\n- d = 0: not started, not tight. pos 1 can be 0..9 with no check. That is 0..9: **10** numbers.\n- d = 1: started, tight, prev = 1, so pos 1 is capped at 1. d = 0 gives 10. d = 1 equals prev: skipped. **1** number.\n\nTotal 10 + 1 = 11. Only 11 itself fails.",
        visual: {
          kind: "array",
          rows: [
            { label: "N", items: ["1", "1"] },
            { label: "d = 0", items: ["0", "0..9"], tones: { 1: "good" } },
            { label: "d = 1", items: ["1", "0"], tones: { 1: "good" } },
            { label: "d = 1", items: ["1", "1"], tones: { 1: "bad" } },
          ],
          caption: "10 + 1 = 11 numbers in [0, 11] have no equal neighbours.",
        },
      },
      {
        kind: "read",
        title: "Digit DP in words",
        body: "- **State:** `go(pos, prev, tight, started)` = how many ways to fill positions pos .. end.\n- **Base:** pos == len(s) → 1, one finished valid number.\n- **Answer** for [0, N]: `go(0, -1, True, False)`.\n- **Range** [L, R]: `count(R) − count(L − 1)`. Example: [5, 10] = count(10) − count(4) = 11 − 5 = 6.\n\nSize: about 19 positions × 2 × 2 × |extra| states, each with 10 digits. Tiny.",
      },
      {
        kind: "read",
        title: "The digit-DP template",
        body: "One template; only the marked line changes per problem.\n\n- `limit` is N's digit while tight, else 9.\n- The `if started and d == prev` line is the property check.\n- The new tight is `tight and d == limit`; the new started is `started or d != 0`.\n\nSanity check: `count_upto(11)` returns 11, as in the worked example.",
        visual: { kind: "code", lang: "python", code: "from functools import cache\n\ndef count_upto(N):                       # how many x in [0, N] qualify\n    if N < 0:\n        return 0\n    s = str(N)\n\n    @cache\n    def go(pos, prev, tight, started):\n        if pos == len(s):\n            return 1\n        limit = int(s[pos]) if tight else 9\n        total = 0\n        for d in range(limit + 1):\n            if started and d == prev:    # the property check: change this line per problem\n                continue\n            total += go(pos + 1, d, tight and d == limit, started or d != 0)\n        return total\n\n    return go(0, -1, True, False)\n" },
      },
      {
        kind: "code",
        title: "Now type it yourself",
        prompt: "Write `count_upto(N)`: how many x in [0, N] have no two adjacent digits equal (CSES Counting Numbers). Return 0 when N < 0, so that `count_upto(b) - count_upto(a - 1)` works for a = 0.",
        starter: "from functools import cache\n\ndef count_upto(N):\n    # state: (pos, prev, tight, started)\n    # base: pos == len(s) -> 1\n    pass\n",
        solution: "from functools import cache\n\ndef count_upto(N):                       # how many x in [0, N] qualify\n    if N < 0:\n        return 0\n    s = str(N)\n\n    @cache\n    def go(pos, prev, tight, started):\n        if pos == len(s):\n            return 1\n        limit = int(s[pos]) if tight else 9\n        total = 0\n        for d in range(limit + 1):\n            if started and d == prev:    # the property check: change this line per problem\n                continue\n            total += go(pos + 1, d, tight and d == limit, started or d != 0)\n        return total\n\n    return go(0, -1, True, False)\n",
        tests: [
          { call: "count_upto(11)", expect: "11", label: "worked example" },
          { call: "count_upto(100)", expect: "91" },
          { call: "count_upto(321) - count_upto(122)", expect: "171", label: "range [123, 321]" },
          { call: "count_upto(0)", expect: "1", label: "only 0" },
          { call: "count_upto(-1)", expect: "0", label: "a = 0 gives count_upto(-1)" },
        ],
        teach: "Walk N's digits from the left. tight caps the digit at N's digit; started skips the check while you are still placing leading zeros. The base case returns 1.",
        explain: "For a range, `count_upto(b) - count_upto(a - 1)`. For a different rule, change only the check line and what you pass as `prev` (or add a sum, a mask, and so on).",
        fromMemory: true,
      },
      {
        kind: "quiz",
        teach: "tight stays True only while every digit placed so far equals N's digit at that position. Once you place a smaller digit, tight becomes False for good.",
        prompt: "Digit DP with N = 523. You placed 5, then 1. What is the limit for the third digit?",
        options: [
          "9, because x is already below N",
          "3, because you are still tight",
          "2, because 1 < 2",
        ],
        answer: 0,
        explain: "After 5 you were tight. Then 1 < 2 (N's second digit), so x is already smaller than 52_ and tight became False. The third digit is free: 0 to 9.",
      },
      {
        kind: "read",
        title: "The 15-second clues",
        body: "When you scan a problem, these phrases should make you write `mask` or a digit-DP state before anything else.\n\nFor packing, store a pair (bins used, fill of the last bin). Python compares tuples left to right, so `min` picks fewer bins first, then less fill.",
        callout: { type: "clue", text: "n ≤ 20 and \"visit all\", \"assign each\", \"every permutation\", \"pair up\" → bitmask DP. Shortest route through all nodes / cities → `dp[mask][last]` (TSP). \"Assign n workers to n jobs\", n ≤ 20 → `dp[mask]`, worker index = popcount(mask). \"Pack items into the fewest bins/sessions/rides\", n ≤ 20 → `dp[mask] = (bins, fill of the last bin)`. \"Count integers in [L, R]\" with R up to 10^18 and a digit rule (digit sum, no repeats, adjacent digits differ) → digit DP. \"Count x ≤ N whose binary form ...\" → digit DP on bits." },
      },
      {
        kind: "summary",
        points: [
          "A bitmask is a set in one integer: bit i is 1 when item i is used. n items give 2^n masks.",
          "Order doesn't matter, only which items are used (and maybe the last one): `dp[mask]` or `dp[mask][last]`.",
          "Masks in increasing order are a correct fill order, because adding an item only makes the mask bigger.",
          "`dp[mask][last]` is O(2^n · n²): safe to about n = 16 in Python. At n = 20 use `dp[mask]` with an O(n) step, in PyPy.",
          "Digit DP state: (pos, tight, started, extra). Range answer = count(R) − count(L − 1).",
        ],
      },
    ],
  },

  /* ================================================================
     Day 19 B: drill
     ================================================================ */
  {
    id: "ch06-l10",
    day: 19,
    title: "Day 19 drill: bitmask DP and digit DP",
    goal: "Name the bitmask or digit-DP state for five disguised problems, then work today's problem list.",
    minutes: 10,
    steps: [
      {
        kind: "read",
        title: "Today in five lines",
        body: "Recap of Day 19:\n- n ≤ 20 + orders or subsets → the set of used items is the state, as a `mask`.\n- Cost depends on the previous item → `dp[mask][last]`. It doesn't → `dp[mask]`.\n- Huge N + a digit rule → digit DP over `(pos, tight, started, extra)`.\n\nThis lesson: 5 disguised problems to name, one code warm-up, today's problem list and the end-of-day check.",
        visual: {
          kind: "compare",
          left: { title: "Bitmask DP", points: ["n ≤ 20", "state = used set (+ last)", "fill masks in increasing order", "O(2^n · n) or O(2^n · n²)"] },
          right: { title: "Digit DP", points: ["N up to 10^18", "state = (pos, tight, started, extra)", "about 10 digits per state", "count(R) − count(L − 1)"] },
        },
      },
      {
        kind: "quiz",
        teach: "When the cost of the next step depends on the previous item, the state needs `last`. When it only depends on how many items are already placed, popcount(mask) tells you who is next.",
        prompt: "Assign 15 interns to 15 projects; each pair has a cost. Minimise the total cost.",
        options: [
          "`dp[mask]`, intern index = popcount(mask)",
          "`dp[mask][last]` (TSP)",
          "Digit DP",
          "Backtracking over all 15! orders",
        ],
        answer: 0,
        explain: "Signal: 15 items, \"assign each\". `dp[mask]` = min cost after giving the projects in mask to the first popcount(mask) interns. `dp[mask | 1<<j] = min(.., dp[mask] + cost[popcount(mask)][j])`. 15! orders would be far too many.",
      },
      {
        kind: "quiz",
        teach: "Shortest route through all nodes: the cost of the next leg depends on where you stand now.",
        prompt: "A drone must photograph all 16 sites exactly once, starting from base. Find the minimum flight distance.",
        options: [
          "`dp[mask]` with popcount",
          "`dp[mask][last]` (TSP)",
          "0/1 knapsack",
          "Interval DP",
        ],
        answer: 1,
        explain: "Signal: \"visit all\", n = 16, distances. `dp[mask][last]` = min distance having visited mask and standing at last. `dp[mask | 1<<nxt][nxt] = min(.., dp[mask][last] + d[last][nxt])`. n = 16 keeps O(2^n · n²) near 1.7·10^7.",
      },
      {
        kind: "read",
        title: "Notice the signal",
        body: "Both cards had n ≤ 20 and \"every item once\". That says mask.\n\nThen ask one question: **does the next cost depend on the previous item?** A flight leg does (from where?), so you need `last`. An intern's cost does not, because popcount(mask) already says which intern is next.",
      },
      {
        kind: "quiz",
        teach: "When N is far too big to loop over and the rule is about digits, build the number digit by digit and carry only what the rule needs.",
        prompt: "Count the integers in [1, 10^18] whose digit sum is divisible by 7.",
        options: [
          "Digit DP with state (pos, sum mod 7, tight)",
          "Loop over every number and test it",
          "Bitmask DP over the 18 digits",
          "Unbounded knapsack over digit sums",
        ],
        answer: 0,
        explain: "Signal: \"count integers\" up to 10^18 + a digit rule. Digit DP `(pos, sum mod 7, tight)`, answer `count(10^18) − count(0)`. Zero has digit sum 0, so subtract it.",
      },
      {
        kind: "quiz",
        teach: "Packing into the fewest bins with n ≤ 20: the state is the set of packed items, and the value is a pair you can compare as a tuple.",
        prompt: "Pack 14 jobs into the fewest shifts of length T, with no job split across shifts.",
        options: [
          "`dp[mask]` = (shifts used, time used in the last shift)",
          "Greedy: sort the jobs and fill shifts in order",
          "0/1 knapsack once per shift",
          "`dp[mask][last]` (TSP)",
        ],
        answer: 0,
        explain: "Signal: n = 14 + \"fewest bins\". `dp[mask]` = (min shifts, min time used in the last shift). Add job j: if it fits, same shift; else open a new shift. Greedy packing can be wrong, and filling one shift at a time does not minimise the count.",
      },
      {
        kind: "read",
        title: "Notice the signal",
        body: "\"Count the integers up to a huge N\" with a rule about digits → digit DP. Nothing to enumerate, only digits to place.\n\n\"Fewest bins\" with n ≤ 20 → `dp[mask]` holding a **pair**. Compare pairs as tuples, so fewer bins wins first and less fill breaks ties.\n\nThe last card mixes both ideas: the digits can be **bits**.",
      },
      {
        kind: "quiz",
        teach: "Digit DP works in any base. In base 2 each position is one bit, and the extra state is whatever the rule needs from the previous position.",
        prompt: "Count the x ≤ N (N up to 10^9) whose binary form has no two consecutive 1s.",
        options: [
          "Digit DP on bits: (pos, prev bit, tight)",
          "Bitmask DP over 2^30 masks",
          "Loop x from 0 to N",
          "Sliding window over the bits",
        ],
        answer: 0,
        explain: "Signal: \"count x ≤ N whose binary form ...\". Digit DP on the bits of N, state `(pos, prev bit, tight)`; skip placing a 1 right after a 1. A loop to 10^9 is too slow in Python.",
      },
      {
        kind: "code",
        title: "Card 1 as code",
        prompt: "Write `min_assignment(cost)`: n workers and n jobs, `cost[i][j]` = cost for worker i to do job j. Give every worker exactly one job and return the minimum total. Use `dp[mask]` with worker = popcount(mask).",
        starter: "def min_assignment(cost):\n    pass\n",
        solution: "def min_assignment(cost):                # n <= ~20\n    n = len(cost)\n    INF = float('inf')\n    full = 1 << n\n    dp = [INF] * full                    # dp[mask] = min cost; jobs in mask go to workers 0..popcount-1\n    dp[0] = 0\n    for mask in range(full):\n        if dp[mask] == INF:\n            continue\n        i = bin(mask).count('1')         # the next worker = popcount(mask)\n        if i == n:\n            continue\n        for j in range(n):\n            if mask >> j & 1:\n                continue\n            nm = mask | (1 << j)\n            c = dp[mask] + cost[i][j]\n            if c < dp[nm]:\n                dp[nm] = c\n    return dp[full - 1]\n",
        tests: [
          { call: "min_assignment([[3, 1], [2, 5]])", expect: "3", label: "the worked example" },
          { call: "min_assignment([[9, 2, 7], [6, 4, 3], [5, 8, 1]])", expect: "9" },
          { call: "min_assignment([[1, 1], [1, 1]])", expect: "2", label: "all equal" },
          { call: "min_assignment([[7]])", expect: "7", label: "one worker" },
        ],
        teach: "dp[0] = 0. For each mask in increasing order, worker i = popcount(mask) takes a free job j: dp[mask | 1 << j] = min(.., dp[mask] + cost[i][j]). The answer is dp[full].",
        explain: "2^n masks × n jobs = O(2^n · n). That is the shape that survives n = 20 in PyPy.",
      },
      {
        kind: "practice",
        title: "Today's problems",
        intro: "Work the rows in order and keep each time box. No AI. Say the state out loud before you code. If a stretch row is unfinished when its box ends, move it to the re-solve list. Row 8 is overflow: submit it with PyPy, then log the result.",
        problems: [
          { ref: "LC 526 Beautiful Arrangement", tier: "warm", lvl: "M", box: 15, clue: "n ≤ 15. `dp[mask]` = ways; position = popcount + 1." },
          { ref: "LC 1986 Minimum Number of Work Sessions to Finish the Tasks", tier: "core", lvl: "M", box: 30, clue: "n ≤ 14 bins. `dp[mask] = (sessions, time in the last one)`, compare as tuples." },
          { ref: "AtCoder DP Contest — O Matching", tier: "stretch", lvl: "H", box: 45, clue: "N ≤ 21 pairing, mod. `dp[mask]` over women; man index = popcount." },
          { ref: "LC 847 Shortest Path Visiting All Nodes", tier: "stretch", lvl: "H", box: 45, clue: "BFS over (node, mask) states. Unweighted, so BFS rather than DP order." },
          { ref: "CSES — Counting Numbers", tier: "stretch", lvl: "H", box: 45, clue: "Use the digit-DP template above. Note a can be 0." },
          { ref: "LC 233 Number of Digit One", tier: "stretch", lvl: "H", box: 45, clue: "Digit DP carrying \"count of 1s so far\", or per-position counting." },
          { ref: "AtCoder DP Contest — S Digit Sum", tier: "stretch", lvl: "H", box: 45, clue: "K up to 10^10000 as a string. State (pos, sum mod D, tight). Subtract the zero. Write it bottom-up: 10^4 digits is too deep to recurse." },
          { ref: "CSES — Elevator Rides", tier: "stretch", lvl: "H", box: 45, clue: "Overflow. Same idea as #2 at n = 20. Expect a Python TLE risk. Submit with PyPy, then log the result." },
        ],
      },
      {
        kind: "reveal",
        prompt: "End-of-day check 1: why is n ≤ 20 the signal for bitmask DP? How large can n be in Python for `dp[mask][last]`?",
        answer: "2^20 is about 10^6, so a setter who allows n ≤ 20 expects you to touch every subset. `dp[mask][last]` with a loop over the next item is O(2^n · n²): about 1.7·10^7 at n = 16, which is safe in Python. At n = 20 it is 4·10^8, so only `dp[mask]` with an O(n) step survives, in PyPy.",
      },
      {
        kind: "reveal",
        prompt: "End-of-day check 2: in digit DP, what do `tight` and `started` each prevent?",
        answer: "`tight` prevents counting numbers above N: while the digits so far equal N's prefix, the next digit is capped at N's digit. `started` prevents leading zeros from acting as real digits, so 7 is not read as \"007\" and checked against the rule.",
      },
      {
        kind: "reveal",
        prompt: "End-of-day check 3: why can masks be filled in plain increasing order?",
        answer: "Every transition turns a bit on: `nm = mask | (1 << nxt)` is always bigger than `mask`. So when the loop reaches a mask, every smaller mask that feeds it is already final. That is the order-of-filling rule.",
      },
      {
        kind: "summary",
        points: [
          "n ≤ 20 + every item once → `mask`. Ask: does the next cost depend on the previous item? Yes → add `last`.",
          "Fewest bins with n ≤ 20 → `dp[mask]` = (bins, fill of the last bin), compared as tuples.",
          "Huge N + digit rule → digit DP; the digits can be bits.",
          "Log 1 mistake and add 3 cards. Record today in the Tracker (#tracker) and review your cards in the Gym (#gym).",
        ],
      },
    ],
  },

  /* ================================================================
     Day 20 A: tree DP, DAG DP, state-machine DP
     ================================================================ */
  {
    id: "ch06-l11",
    day: 20,
    title: "Day 20: Tree DP, DAG DP and state-machine DP",
    goal: "Solve DP on a tree, on a dependency graph and over days with modes, using the same recipe with three different fill orders.",
    minutes: 12,
    steps: [
      {
        kind: "read",
        title: "One recipe, three fill orders",
        body: "Today's three DPs look different but use the same recipe: state, transition, base, answer, order. Only the **order of filling** changes, and the input hands it to you.\n\n**Goal:** see \"DP on a tree\", \"DP on a dependency graph\" and \"DP with a few modes per day\" as the same recipe, with the order of filling given by post-order, topological order or time.",
        visual: {
          kind: "table",
          headers: ["Input shape", "State", "Fill order"],
          rows: [
            ["Tree", "dp[v][mode]", "post-order: children before parent"],
            ["DAG (dependencies)", "dp[v]", "topological order"],
            ["Days with modes", "(day, mode)", "time: day by day"],
          ],
        },
      },
      {
        kind: "quiz",
        guess: true,
        prompt: "A team's best result depends on the best results of its sub-teams. In what order should you compute the teams?",
        options: [
          "Sub-teams first, then the team above them",
          "The top team first, then the sub-teams",
          "Any order works",
        ],
        answer: 0,
        explain: "A team can only combine answers that already exist, so the sub-teams go first. On a tree this is **post-order**: every child is finished before its parent. That is the fill order for tree DP.",
      },
      {
        kind: "read",
        title: "Tree DP: the state",
        body: "A **subtree** of v is v plus everything below it.\n\n**[[tree DP]]** state: `dp[v][s]` = the best answer **inside v's subtree**, given that v is in mode s (taken or not, guarded or not).\n\nOnce v's mode is fixed, its children don't affect each other. That is why trees are easy for DP. Fill in **[[post-order]]** (children before parent). Total work is O(n).",
      },
      {
        kind: "read",
        title: "Example: no two adjacent nodes",
        body: "Pick nodes with the largest total, but never a node and its child (LC 337 House Robber III).\n\n- **State:** each node returns `(take, skip)`: best in its subtree with v chosen, and with v not chosen.\n- **Transition:** `take = val + sum(skip of children)`; `skip = sum(max(take, skip) of children)`.\n- **Base:** a leaf returns `(val, 0)`.\n- **Answer:** `max(take, skip)` at the root.",
        visual: { kind: "tree", nodes: ROBBER_TREE, caption: "Values on the nodes. Taking a node forbids taking its children." },
      },
      {
        kind: "read",
        title: "Worked example: the leaves",
        body: "Post-order starts at the bottom. The two leaves have no children.\n\n- Leaf with value 3: take = 3, skip = 0 → (3, 0).\n- Leaf with value 1: take = 1, skip = 0 → (1, 0).",
        visual: { kind: "tree", nodes: ROBBER_TREE, tones: { 4: "good", 6: "good" }, notes: { 4: "(3, 0)", 6: "(1, 0)" }, caption: "Each note is (take, skip)." },
      },
      {
        kind: "read",
        title: "Worked example: the middle level",
        body: "- Node 2 (left), child (3, 0): take = 2 + 0 = 2. skip = max(3, 0) = 3 → (2, 3).\n- Node 3 (right), child (1, 0): take = 3 + 0 = 3. skip = max(1, 0) = 1 → (3, 1).\n\nEach parent only needs its children's two numbers, nothing deeper.",
        visual: { kind: "tree", nodes: ROBBER_TREE, tones: { 1: "good", 2: "good", 4: "neutral", 6: "neutral" }, notes: { 1: "(2, 3)", 2: "(3, 1)", 4: "(3, 0)", 6: "(1, 0)" } },
      },
      {
        kind: "read",
        title: "Worked example: the root",
        body: "Root value 3, children (2, 3) and (3, 1).\n\n- take = 3 + 3 + 1 = 7 (both children skipped).\n- skip = max(2, 3) + max(3, 1) = 3 + 3 = 6.\n\nAnswer: max(7, 6) = **7**. That is the root plus the two bottom nodes: 3 + 3 + 1.",
        visual: { kind: "tree", nodes: ROBBER_TREE, tones: { 0: "good", 4: "good", 6: "good" }, notes: { 0: "(7, 6)", 1: "(2, 3)", 2: "(3, 1)", 4: "(3, 0)", 6: "(1, 0)" }, caption: "Chosen nodes in green: 3 + 3 + 1 = 7." },
        callout: { type: "move", text: "If you don't know what a tree DP node should return, ask \"what does my parent need to know about me to make its own decision?\" That answer is the state." },
      },
      {
        kind: "widget",
        widget: "tree-walk",
        title: "Values flow up",
        task: "Run the DFS on this tree. Watch each node return its value only after both children have returned. That is post-order, the same order tree DP fills in.",
        props: { mode: "dfs-return", tree: ROBBER_TREE },
      },
      {
        kind: "widget",
        widget: "dp-table",
        title: "The same choice on a line",
        task: "House Robber on a line is the same take-or-skip choice: each house is a node with one child. Step through and say the recurrence with the numbers plugged in before each cell fills.",
        props: { mode: "house-robber" },
      },
      {
        kind: "quiz",
        teach: "In tree DP each node returns what its parent needs to decide. With \"no two adjacent\", the parent's choice depends on whether the child was chosen.",
        prompt: "Max sum of chosen nodes on a tree, no two adjacent. What should each node return to its parent?",
        options: [
          "A pair: (best with me taken, best with me skipped)",
          "One number: the best sum in my subtree",
          "The height of my subtree",
        ],
        answer: 0,
        explain: "If the parent is taken, it needs the child's skip value; if not, it needs max(take, skip). One number can't serve both cases, so each node returns the pair.",
      },
      {
        kind: "read",
        title: "Without recursion",
        body: "On CSES or Codeforces, n = 2·10^5 and the tree can be one long path: recursion overflows. Use an explicit order instead.\n\n- [[DFS with a stack|iterative DFS]], record `order` (pre-order) and `parent`.\n- A child is pushed only when its parent is popped, so every parent appears before its children.\n- So `reversed(order)` puts every child before its parent: post-order.\n- Then each u adds its values into its parent p.",
        visual: { kind: "code", lang: "python", code: "def max_independent_set(n, adj, val, root=0):\n    parent = [-1] * n\n    order = []                           # pre-order; reversed = children before parents\n    seen = [False] * n\n    seen[root] = True\n    stack = [root]\n    while stack:\n        u = stack.pop()\n        order.append(u)\n        for v in adj[u]:\n            if not seen[v]:\n                seen[v] = True\n                parent[v] = u\n                stack.append(v)\n    take = val[:]                        # take[u] = best in subtree with u chosen\n    skip = [0] * n                       # skip[u] = best in subtree with u not chosen\n    for u in reversed(order):\n        p = parent[u]\n        if p >= 0:\n            take[p] += skip[u]\n            skip[p] += max(take[u], skip[u])\n    return max(take[root], skip[root])\n" },
        callout: { type: "trap", text: "LeetCode `TreeNode` recursion is fine up to depth about 10^4 with a raised recursion limit. CSES Tree Matching and anything with n = 2·10^5 given as an edge list must use the iterative order." },
      },
      {
        kind: "code",
        title: "Now type it yourself",
        prompt: "Write `max_independent_set(n, adj, val, root=0)`: the max total of `val` over chosen nodes, no two adjacent. `adj` is an adjacency list. Use the iterative order: pre-order with a stack, then reversed.",
        starter: "def max_independent_set(n, adj, val, root=0):\n    # 1. stack DFS: order (pre-order) and parent\n    # 2. take = val[:], skip = [0] * n\n    # 3. for u in reversed(order): push into parent\n    pass\n",
        solution: "def max_independent_set(n, adj, val, root=0):\n    parent = [-1] * n\n    order = []                           # pre-order; reversed = children before parents\n    seen = [False] * n\n    seen[root] = True\n    stack = [root]\n    while stack:\n        u = stack.pop()\n        order.append(u)\n        for v in adj[u]:\n            if not seen[v]:\n                seen[v] = True\n                parent[v] = u\n                stack.append(v)\n    take = val[:]                        # take[u] = best in subtree with u chosen\n    skip = [0] * n                       # skip[u] = best in subtree with u not chosen\n    for u in reversed(order):\n        p = parent[u]\n        if p >= 0:\n            take[p] += skip[u]\n            skip[p] += max(take[u], skip[u])\n    return max(take[root], skip[root])\n",
        tests: [
          { call: "max_independent_set(5, [[1, 2], [0, 3], [0, 4], [1], [2]], [3, 2, 3, 3, 1])", expect: "7", label: "the worked example" },
          { call: "max_independent_set(3, [[1], [0, 2], [1]], [1, 2, 3])", expect: "4", label: "a path" },
          { call: "max_independent_set(4, [[1, 2, 3], [0], [0], [0]], [10, 4, 4, 4])", expect: "12", label: "a star" },
          { call: "max_independent_set(1, [[]], [5])", expect: "5", label: "one node" },
        ],
        teach: "take[u] = val[u] + sum of children's skip; skip[u] = sum of max(take, skip) over children. Reversed pre-order processes children before parents.",
        explain: "O(n), no recursion. The same skeleton solves CSES Tree Matching: change what each node stores and how it merges into its parent.",
        fromMemory: true,
      },
      {
        kind: "read",
        title: "Two more tree shapes to know",
        body: "**Longest path through a node.** Each node returns its longest downward chain. At the node, add the two best child chains to get a path that bends there, and update a global best (Day 11's DFS-returns-value plus a global).\n\n**[[Rerooting|rerooting]]** (just know the name). \"Sum of distances from every node\" would need n DFS passes. Rerooting uses two: post-order for subtree answers, then pre-order to push each parent's \"outside\" answer down. Classics: LC 834 Sum of Distances in Tree, CSES — Tree Distances II. Park them for month 2.",
      },
      {
        kind: "read",
        title: "DAG DP: the idea",
        body: "Any DP is secretly a **[[DAG]]** (directed graph with no cycles): states are nodes, transitions are edges.\n\nWhen the input itself is a DAG, fill in **[[topological order|topological sort]]** ([[Kahn's queue|Kahn's algorithm]], Day 13):\n- **State:** `dp[v]` = edges on the longest path ending at v.\n- **Base:** every `dp[v] = 0`.\n- **Transition:** when you pop u, [[relax|relaxation]] each edge u→v: `dp[v] = max(dp[v], dp[u] + 1)`.\n- **Answer:** `max(dp)`. O(V + E).",
        visual: {
          kind: "graph",
          nodes: DAG_NODES({ "0": "in 0", "1": "in 2", "2": "in 1", "3": "in 2" }, { "0": "accent" }),
          edges: DAG_EDGES(),
          caption: "Indegrees shown. Only node 0 has indegree 0, so the queue starts as [0].",
        },
      },
      {
        kind: "read",
        title: "Worked example: pop 0",
        body: "Pop 0, with `dp[0] = 0`.\n\n- Edge 0→1: `dp[1] = 1`. Indegree of 1 drops to 1.\n- Edge 0→2: `dp[2] = 1`. Indegree of 2 drops to 0, so push 2.\n\nQueue: [2].",
        visual: {
          kind: "graph",
          nodes: DAG_NODES({ "0": "dp 0", "1": "dp 1, in 1", "2": "dp 1, in 0", "3": "dp 0, in 2" }, { "0": "good", "2": "accent" }),
          edges: DAG_EDGES(["0>1", "0>2"]),
        },
      },
      {
        kind: "read",
        title: "Worked example: pop 2, then 1",
        body: "Pop 2 (`dp[2] = 1`):\n- 2→1: `dp[1] = max(1, 2) = 2`. Indegree of 1 is 0, push 1.\n- 2→3: `dp[3] = 2`. Indegree of 3 drops to 1.\n\nPop 1 (`dp[1] = 2`):\n- 1→3: `dp[3] = max(2, 3) = 3`. Push 3.\n\nAnswer: `max(dp) = 3`, the path 0→2→1→3. Every node was popped only after all its incoming edges were relaxed.",
        visual: {
          kind: "graph",
          nodes: DAG_NODES({ "0": "dp 0", "1": "dp 2", "2": "dp 1", "3": "dp 3" }, { "3": "good" }),
          edges: DAG_EDGES(["0>2", "2>1", "1>3"]),
          caption: "The longest path 0→2→1→3 has 3 edges.",
        },
      },
      {
        kind: "read",
        title: "A grid can be a DAG too",
        body: "\"Only move to a strictly larger cell\" (LC 329): values go up along every move, so you can never come back. No cycles, so it is a DAG.\n\nState: `dp[cell]` = longest increasing path starting at cell = 1 + max over larger neighbours. Use [[memo|memoization]] DFS with **no visited set**, or sort cells by value and fill in that order.\n\nHere the longest path is 1 → 2 → 6 → 9: length 4.",
        visual: {
          kind: "grid",
          cells: [[9, 9, 4], [6, 6, 8], [2, 1, 1]],
          tones: { "2,1": "good", "2,0": "good", "1,0": "good", "0,0": "good" },
          arrows: [
            { from: [2, 1], to: [2, 0], tone: "good" },
            { from: [2, 0], to: [1, 0], tone: "good" },
            { from: [1, 0], to: [0, 0], tone: "good" },
          ],
        },
      },
      {
        kind: "quiz",
        teach: "A visited set exists to stop a DFS from walking in circles. Ask whether a circle is even possible when every move goes to a strictly larger value.",
        prompt: "In LC 329, why does memo DFS need no visited set?",
        options: [
          "Values strictly increase along a path, so you can never return to a cell",
          "Python's recursion limit stops any loop",
          "The grid is always small",
        ],
        answer: 0,
        explain: "Every step goes to a larger value, so a path can't come back to a cell it left. There are no cycles: the moves form a DAG, and memo alone is enough.",
      },
      {
        kind: "code",
        title: "Longest path in a DAG",
        prompt: "Write `longest_path_dag(n, edges)`: the number of edges on the longest path in a DAG with nodes 0..n−1 and directed `edges` as (u, v) pairs (AtCoder DP G). Use Kahn's queue.",
        starter: "from collections import deque\n\ndef longest_path_dag(n, edges):\n    # indegrees, queue of indegree-0 nodes\n    # dp[v] = edges on the longest path ending at v\n    pass\n",
        solution: "from collections import deque\n\ndef longest_path_dag(n, edges):\n    adj = [[] for _ in range(n)]\n    indeg = [0] * n\n    for u, v in edges:\n        adj[u].append(v)\n        indeg[v] += 1\n    q = deque(i for i in range(n) if indeg[i] == 0)\n    dp = [0] * n                         # dp[v] = edges on the longest path ending at v\n    while q:\n        u = q.popleft()\n        for v in adj[u]:\n            if dp[u] + 1 > dp[v]:\n                dp[v] = dp[u] + 1\n            indeg[v] -= 1\n            if indeg[v] == 0:\n                q.append(v)\n    return max(dp)\n",
        tests: [
          { call: "longest_path_dag(4, [(0, 1), (0, 2), (2, 1), (1, 3), (2, 3)])", expect: "3", label: "the worked example" },
          { call: "longest_path_dag(6, [(1, 2), (3, 4), (4, 5)])", expect: "2", label: "two pieces" },
          { call: "longest_path_dag(5, [(4, 2), (1, 2), (1, 3), (4, 1), (4, 0), (0, 3), (3, 2), (0, 2)])", expect: "3" },
          { call: "longest_path_dag(1, [])", expect: "0", label: "no edges" },
        ],
        teach: "Kahn's order: start with indegree-0 nodes. When you pop u, relax dp[v] = max(dp[v], dp[u] + 1) for each edge u→v, then lower v's indegree and push it at 0.",
        explain: "Every v is popped only after all edges into it were relaxed, so `dp[v]` is final when it is read. O(V + E).",
        fromMemory: true,
      },
      {
        kind: "read",
        title: "State-machine DP: circles and arrows",
        body: "**[[state-machine DP]]**: the state is `(day, mode)`. Draw each mode as a circle and each action as an arrow. Each day, every mode takes the max over its incoming arrows.\n\nLC 309 (stock with cooldown) has three modes:\n- **hold**: you own a share.\n- **sold**: you sold today.\n- **rest**: you own nothing and may buy.\n\nArrows: rest → hold (buy, −p), hold → sold (sell, +p), sold → rest (cooldown), and hold and rest can wait.",
        visual: {
          kind: "graph",
          nodes: [
            { id: "rest", label: "rest", x: 15, y: 70, note: "or wait" },
            { id: "hold", label: "hold", x: 50, y: 20, note: "or wait" },
            { id: "sold", label: "sold", x: 85, y: 70 },
          ],
          edges: [
            { from: "rest", to: "hold", w: "buy −p", directed: true },
            { from: "hold", to: "sold", w: "sell +p", directed: true },
            { from: "sold", to: "rest", w: "cooldown", directed: true },
          ],
          caption: "LC 309: three modes, one arrow per action. Every \"Best Time to Buy and Sell Stock\" variant is this with different circles.",
        },
      },
      {
        kind: "read",
        title: "Worked example: days 1 to 3",
        body: "prices = [1, 2, 3, 0, 2]. Start: hold = −∞, sold = 0, rest = 0. Daily, from **yesterday's** values:\n`hold = max(hold, rest − p)`, `sold = hold + p`, `rest = max(rest, sold)`.\n\n- p = 1: hold = 0 − 1 = −1, sold = −∞, rest = 0.\n- p = 2: hold = −1, sold = −1 + 2 = 1, rest = 0.\n- p = 3: hold = −1, sold = −1 + 3 = 2, rest = max(0, 1) = 1.",
        visual: {
          kind: "grid",
          cells: [["−∞", 0, 0], [-1, "−∞", 0], [-1, 1, 0], [-1, 2, 1], ["", "", ""], ["", "", ""]],
          rowLabels: STOCK_DAYS,
          colLabels: ["hold", "sold", "rest"],
          tones: { "3,0": "accent", "3,1": "accent", "3,2": "accent" },
        },
      },
      {
        kind: "read",
        title: "Worked example: days 4 and 5",
        body: "- p = 0: hold = max(−1, 1 − 0) = 1 (buy at 0 after resting), sold = −1 + 0 = −1, rest = max(1, 2) = 2.\n- p = 2: hold = max(1, 2 − 2) = 1, sold = 1 + 2 = 3, rest = max(2, −1) = 2.\n\nAnswer: max(sold, rest) = **3**. Buy at 1, sell at 2, cool down, buy at 0, sell at 2.",
        visual: {
          kind: "grid",
          cells: [["−∞", 0, 0], [-1, "−∞", 0], [-1, 1, 0], [-1, 2, 1], [1, -1, 2], [1, 3, 2]],
          rowLabels: STOCK_DAYS,
          colLabels: ["hold", "sold", "rest"],
          tones: { "5,1": "good" },
          arrows: [{ from: [4, 0], to: [5, 1], tone: "good" }],
        },
      },
      {
        kind: "read",
        title: "Update all modes at once",
        body: "The tuple assignment matters. Python evaluates the whole right side first, so every new value is computed from **yesterday's** values.\n\nIf you update `hold` first and then use the new `hold` to compute `sold`, you buy and sell on the same day.",
        visual: { kind: "code", lang: "python", code: "# WRONG: sold reads the hold you just changed today\nhold = max(hold, rest - p)\nsold = hold + p                          # buy and sell on the same day\nrest = max(rest, sold)\n\n# RIGHT: every new value reads yesterday's values\nhold, sold, rest = max(hold, rest - p), hold + p, max(rest, sold)\n" },
        callout: { type: "mistake", text: "In state-machine DP, updating `hold` first and then using the new `hold` to compute `sold` in the same day lets you buy and sell on the same day. Use tuple assignment or temporaries." },
      },
      {
        kind: "code",
        title: "Stock with cooldown",
        prompt: "Write `max_profit_cooldown(prices)` (LC 309): buy and sell any number of times, one share at a time, and after a sale you must wait one day before buying. Three modes: hold, sold, rest.",
        starter: "def max_profit_cooldown(prices):\n    pass\n",
        solution: "def max_profit_cooldown(prices):         # LC 309\n    hold, sold, rest = float('-inf'), 0, 0\n    for p in prices:\n        hold, sold, rest = max(hold, rest - p), hold + p, max(rest, sold)\n    return max(sold, rest)\n",
        tests: [
          { call: "max_profit_cooldown([1, 2, 3, 0, 2])", expect: "3", label: "the worked example" },
          { call: "max_profit_cooldown([2, 1, 4])", expect: "3" },
          { call: "max_profit_cooldown([5, 4, 3])", expect: "0", label: "falling prices" },
          { call: "max_profit_cooldown([1])", expect: "0", label: "one day" },
        ],
        teach: "hold = max(hold, rest − p), sold = hold + p, rest = max(rest, sold), all computed from yesterday's values in one tuple assignment. Start with hold = −infinity.",
        explain: "O(n) time, O(1) space. LC 714 (fee) is the same with two modes: `hold = max(hold, free − p)`, `free = max(free, hold + p − fee)`.",
      },
      {
        kind: "match",
        teach: "The fill order must compute every state after the states it reads. Each input shape gives you a natural order for free.",
        prompt: "Match each DP to its fill order.",
        pairs: [
          ["Tree DP", "Post-order: children before parent"],
          ["DAG DP", "Topological order"],
          ["State-machine DP", "Time: day by day, all modes at once"],
        ],
        explain: "Tree: post-order (or reversed pre-order). DAG: topological order from Kahn's queue. State machine: one day at a time, every mode from yesterday's values.",
      },
      {
        kind: "read",
        title: "The 15-second clues",
        body: "Five phrases to map in one glance. Each one names the shape, and the shape names the fill order.",
        callout: { type: "clue", text: "Tree + \"choose nodes, no two adjacent / max sum / min cover\" → each node returns (take, skip) or a few states. Tree + \"longest path through a node\" → combine the two best child chains (DFS-returns-value plus a global best). Tree + \"answer for every node as root\" → rerooting. DAG / dependencies / \"only move to strictly larger\" → DP in topological order. \"Buy/sell with cooldown / fee / at most k transactions\" → state machine: hold, free, cooldown." },
      },
      {
        kind: "summary",
        points: [
          "Tree DP: `dp[v][mode]` = best inside v's subtree; fill in post-order, or reversed pre-order without recursion.",
          "Ask what the parent needs to know about the child: that is the state, often (take, skip).",
          "DAG DP: `dp[v]` in topological order; a strictly increasing grid is a DAG, so memo DFS needs no visited set.",
          "State-machine DP: modes as circles, actions as arrows, update all modes at once from yesterday's values.",
          "Rerooting answers \"every node as root\" in two passes. Know the name for now.",
        ],
      },
    ],
  },

  /* ================================================================
     Day 20 B: drill
     ================================================================ */
  {
    id: "ch06-l12",
    day: 20,
    title: "Day 20 drill: tree, DAG and state-machine DP",
    goal: "Name the tree, DAG or state-machine state for five disguised problems, then work today's problem list.",
    minutes: 10,
    steps: [
      {
        kind: "read",
        title: "Today in four lines",
        body: "Recap of Day 20:\n- Tree → each node returns a few states, filled in post-order.\n- DAG or \"only move to strictly larger\" → `dp[v]` in topological order.\n- Days with modes → circles and arrows, all modes updated together.\n- When stuck: what does my parent need to know about me?\n\nThis lesson: 5 disguised problems to name, today's problem list and the end-of-day check.",
        visual: {
          kind: "table",
          headers: ["Shape", "State", "Fill order"],
          rows: [
            ["Tree", "(take, skip) per node", "post-order"],
            ["DAG", "dp[v]", "topological"],
            ["Days + modes", "(day, mode)", "day by day"],
          ],
        },
      },
      {
        kind: "quiz",
        teach: "A company hierarchy is a tree. With \"never a node together with its parent\", each node returns two values.",
        prompt: "Invite employees to a party, never an employee together with their direct boss. Maximise total fun.",
        options: [
          "Tree DP: each employee returns (take, skip)",
          "State machine over days",
          "DAG longest path",
          "Bitmask DP over employees",
        ],
        answer: 0,
        explain: "Signal: hierarchy + \"no two adjacent\". `take[v] = fun[v] + sum(skip[c])`, `skip[v] = sum(max(take[c], skip[c]))`. This is House Robber III with people.",
      },
      {
        kind: "quiz",
        teach: "Buy/sell problems are state machines. Count how many modes you need: what can you be doing at the end of a day?",
        prompt: "Trade a stock with a fixed fee on every sale. Maximise profit.",
        options: [
          "State machine with two modes: hold and free",
          "Tree DP",
          "DAG DP in topological order",
          "Bitmask DP",
        ],
        answer: 0,
        explain: "Signal: buy/sell + fee. `hold = max(hold, free − p)`, `free = max(free, hold + p − fee)`. No cooldown, so two modes are enough.",
      },
      {
        kind: "read",
        title: "Notice the signal",
        body: "A boss/employee hierarchy is a **tree**, even when the problem never says \"tree\". \"No one with their boss\" is the (take, skip) pair.\n\nBuy, sell, fee, cooldown, \"at most k\" → draw the **modes** first. The number of circles is the size of the state.",
      },
      {
        kind: "quiz",
        teach: "If every move goes to a strictly larger value, a walk can never return to where it was, so the moves form a DAG.",
        prompt: "Find the longest walk in a height map that only steps to a strictly higher neighbour.",
        options: [
          "DAG DP: dp[cell] = 1 + max over higher neighbours",
          "BFS shortest path in a grid",
          "Grid DP moving only right and down",
          "Bitmask DP over visited cells",
        ],
        answer: 0,
        explain: "Signal: \"strictly higher\" → no cycles → DAG. `dp[cell] = 1 + max(dp[higher neighbour])` with memo DFS, or process cells by value. BFS finds shortest paths, not longest.",
      },
      {
        kind: "quiz",
        teach: "Prerequisites form a DAG. A course can finish only after all its prerequisites have finished.",
        prompt: "Courses have durations and prerequisites, and any number can run in parallel. Find the minimum total time.",
        options: [
          "DAG DP in topological order: finish[v] = time[v] + max(finish[u])",
          "Dijkstra from the first course",
          "Sum of all durations",
          "Union-find over prerequisites",
        ],
        answer: 0,
        explain: "Signal: dependencies → topological order. `finish[v] = time[v] + max(finish[u])` over prerequisites u; the answer is the max finish. A sum would ignore that courses run in parallel.",
      },
      {
        kind: "read",
        title: "Notice the signal",
        body: "\"Only move to strictly larger\" and \"prerequisites\" both mean **no cycles**. No cycles means a DAG, and a DAG means DP in topological order (or memo DFS).\n\nThe last card is a tree again, but two states are not enough. Ask what the parent needs to know.",
      },
      {
        kind: "quiz",
        teach: "Ask what the parent needs to know about a child. With guards that cover neighbours, the parent must know whether the child has a guard, is already covered, or still needs the parent's help.",
        prompt: "Place the fewest guards on tree nodes so that every node has a guard on it or on a neighbour.",
        options: [
          "Tree DP with 3 states: guard here / covered by a child / not yet covered",
          "Tree DP with 2 states: (take, skip)",
          "Greedy: put a guard on every leaf",
          "BFS by levels",
        ],
        answer: 0,
        explain: "Signal: tree + \"min cover\" of neighbours. A skipped node can be covered by a child or still need its parent, so (take, skip) is not enough. Three states: guard here, covered by a child, not yet covered (the parent must cover it). This is LC 968 Binary Tree Cameras.",
      },
      {
        kind: "practice",
        title: "Today's problems",
        intro: "Work the rows in order and keep each time box. No AI. Draw the tree states or the mode arrows before you code. If a stretch row is unfinished when its box ends, move it to the re-solve list. Row 8 is overflow. Extra if you're ahead: LC 123 Best Time to Buy and Sell Stock III and LC 188 Best Time to Buy and Sell Stock IV (state = (transactions used, holding)).",
        problems: [
          { ref: "LC 309 Best Time to Buy and Sell Stock with Cooldown", tier: "warm", lvl: "M", box: 15, clue: "Three modes: hold, sold, rest. Draw the arrows first." },
          { ref: "LC 714 Best Time to Buy and Sell Stock with Transaction Fee", tier: "warm", lvl: "M", box: 15, clue: "Two modes. Pay the fee on sell." },
          { ref: "LC 337 House Robber III", tier: "core", lvl: "M", box: 30, clue: "Each node returns (rob, skip)." },
          { ref: "AtCoder DP Contest — G Longest Path", tier: "core", lvl: "M", box: 30, clue: "Topological order + `dp[v]`. Use the template from memory." },
          { ref: "CSES — Tree Matching", tier: "core", lvl: "M", box: 45, clue: "`dp[v][0/1]` = v is free or matched to a child. Iterative order." },
          { ref: "LC 329 Longest Increasing Path in a Matrix", tier: "stretch", lvl: "H", box: 45, clue: "Strictly increasing moves → DAG. Memo DFS, or sort cells by value." },
          { ref: "LC 2246 Longest Path With Different Adjacent Characters", tier: "stretch", lvl: "H", box: 45, clue: "Two best child chains with a different letter + a global best. n = 10^5, so iterative." },
          { ref: "LC 968 Binary Tree Cameras", tier: "stretch", lvl: "H", box: 45, clue: "Overflow. Three states: has camera / covered / not covered." },
        ],
      },
      {
        kind: "reveal",
        prompt: "End-of-day check 1: what is the fill order for tree DP, for DAG DP and for state-machine DP? Name all three.",
        answer: "Tree DP: post-order (children before parent), or reversed pre-order without recursion. DAG DP: topological order (Kahn's queue). State-machine DP: time, one day at a time, with every mode computed from yesterday's values.",
      },
      {
        kind: "reveal",
        prompt: "End-of-day check 2: draw the state diagram for LC 309: three circles and their arrows.",
        answer: "Circles: hold, sold, rest. Arrows: rest → hold (buy, −p); hold → sold (sell, +p); sold → rest (the cooldown day); hold → hold and rest → rest (wait). Code: `hold, sold, rest = max(hold, rest - p), hold + p, max(rest, sold)`.",
      },
      {
        kind: "read",
        title: "Check your drawing",
        body: "Your drawing should match this. If you had an arrow from sold straight to hold, that skips the cooldown day.",
        visual: {
          kind: "graph",
          nodes: [
            { id: "rest", label: "rest", x: 15, y: 70, note: "or wait" },
            { id: "hold", label: "hold", x: 50, y: 20, note: "or wait" },
            { id: "sold", label: "sold", x: 85, y: 70 },
          ],
          edges: [
            { from: "rest", to: "hold", w: "buy −p", directed: true },
            { from: "hold", to: "sold", w: "sell +p", directed: true },
            { from: "sold", to: "rest", w: "cooldown", directed: true },
          ],
        },
      },
      {
        kind: "reveal",
        prompt: "End-of-day check 3: why does reversed pre-order guarantee that children are processed before parents?",
        answer: "In the stack DFS, a child is pushed only when its parent is popped, and the parent is appended to `order` at that moment. So every parent appears in pre-order before all its children. Reverse the list and every child comes before its parent, which is exactly what post-order needs.",
      },
      {
        kind: "summary",
        points: [
          "Hierarchy or \"no one with their boss\" → tree DP with (take, skip). Covering neighbours → 3 states.",
          "Buy/sell with fee, cooldown or k transactions → draw the modes, then update them together.",
          "Strictly increasing moves or prerequisites → DAG → topological order or memo DFS.",
          "Log 1 mistake and add 3 cards. Record today in the Tracker (#tracker) and review your cards in the Gym (#gym).",
        ],
      },
    ],
  },

  /* ================================================================
     Day 21 A: DP mixed review + Contest #3
     ================================================================ */
  {
    id: "ch06-l13",
    day: 21,
    title: "Day 21: DP mixed review and Contest #3",
    goal: "Name the DP state for an unlabelled problem in 15 seconds, debug a wrong DP with a checklist, and run Contest #3 with a plan.",
    minutes: 12,
    steps: [
      {
        kind: "read",
        title: "No new topic today",
        body: "Today you **mix** the whole DP week so the topic label disappears. In a contest no one tells you \"this is knapsack\". Seeing it anyway is the actual skill.\n\nMorning: the 3-hour block on mixed DP plus Recognition Test #3. Evening: Contest #3. Day 22 starts with 45 minutes of upsolving.\n\n**Goal:** name the DP state for an unlabelled problem in 15 seconds, then hold up under contest pressure tonight.",
      },
      {
        kind: "read",
        title: "The week's recipe",
        body: "Every DP this week was designed in the same order. Say the steps out loud:\n\n1. **[[State|state]]**: the smallest information that makes the future independent of the past.\n2. **[[Transition|transition]]**: look at the last choice.\n3. **[[Base cases|base case]]**: empty prefix, empty string, zero amount.\n4. **Answer location**: `dp[n]`, `dp[0]`, `max(dp)`, `dp[full][...]`.\n5. **Order of filling**: every state after the states it reads.\n6. **Complexity** = states × cost of one transition, about 10^7 in Python.",
      },
      {
        kind: "read",
        title: "Read the constraints first",
        body: "The size of n tells you the size of the state before you read the story.",
        visual: {
          kind: "table",
          headers: ["Constraint", "Likely DP"],
          rows: [
            ["n ≤ 20", "mask: O(2^n · n)"],
            ["n ≤ 500", "interval DP: O(n³)"],
            ["n ≤ 5000", "O(n²) table"],
            ["n ≤ 10^5", "O(n) or O(n log n) DP"],
            ["\"mod 10^9+7\"", "counting DP"],
          ],
        },
        callout: { type: "clue", text: "Read the constraints first. n ≤ 20 → mask. n ≤ 500 → O(n³) interval DP. n ≤ 5000 → O(n²) table. n ≤ 10^5 → O(n) or O(n log n) DP. \"Mod 10^9+7\" → counting DP." },
      },
      {
        kind: "read",
        title: "The input shape names the state",
        body: "After the constraints, look at what the input **is**. Each shape has a standard state.",
        visual: {
          kind: "table",
          headers: ["Input", "State"],
          rows: [
            ["Two sequences", "(i, j)"],
            ["One contiguous range", "(l, r)"],
            ["A subset of ≤ 20 items", "mask"],
            ["A tree", "(node, mode)"],
            ["Days and modes", "(day, mode)"],
          ],
        },
        callout: { type: "clue", text: "Two sequences → `(i, j)`. One contiguous range → `(l, r)`. A subset → `mask`. A tree → `(node, mode)`. Days and modes → `(day, mode)`." },
      },
      {
        kind: "quiz",
        teach: "The constraint tells you the budget: about 10^7 steps in Python. n ≤ 500 allows n³ ≈ 1.25·10^8 only for very light loops, and it is the classic size for range DP.",
        prompt: "A problem has n ≤ 500 and asks for the best way to merge one contiguous row of piles. Which state fits?",
        options: [
          "`dp[l][r]` interval DP, O(n³)",
          "`dp[mask]` bitmask DP",
          "`dp[i][j]` over two strings",
        ],
        answer: 0,
        explain: "\"One contiguous range\" → `(l, r)`, and n ≤ 500 is the size where O(n³) interval DP is expected. A mask needs n ≤ 20, and there is only one sequence here.",
      },
      {
        kind: "read",
        title: "One more shape: job scheduling",
        body: "Jobs have start, end and profit; pick jobs that don't overlap for max profit (LC 1235). Sort by end.\n\n- **State:** `dp[i]` = best profit using only the first i jobs.\n- **Base:** `dp[0] = 0`.\n- **Transition:** last choice = job i. Skip: `dp[i-1]`. Take: `profit_i + dp[k]`, with k = number of jobs ending at or before job i starts. `bisect_right(ends, start_i)` finds k in O(log n).\n- **Answer:** `dp[n]`.",
        visual: {
          kind: "array",
          rows: [
            { label: "job", items: ["A", "B", "C", "D"] },
            { label: "start", items: [1, 2, 3, 3] },
            { label: "end", items: [3, 4, 5, 6] },
            { label: "profit", items: [50, 10, 40, 70] },
          ],
          indices: true,
          caption: "Four jobs, already sorted by end time.",
        },
        callout: { type: "clue", text: "\"Pick jobs with start/end/profit, no overlap\" → sort by end, `dp[i] = max(dp[i-1], profit_i + dp[last compatible])`, with `bisect` to find the last compatible job." },
      },
      {
        kind: "read",
        title: "Worked example: jobs A and B",
        body: "`ends = [3, 4, 5, 6]`, `dp[0] = 0`.\n\n- i = 1, job A (start 1): no job ends at or before 1, so k = 0. `dp[1] = max(0, 50 + dp[0]) = 50`.\n- i = 2, job B (start 2): still k = 0. `dp[2] = max(50, 10 + 0) = 50`. Skipping B is better.",
        visual: {
          kind: "array",
          rows: [
            { label: "end", items: [3, 4, 5, 6] },
            { label: "dp", items: [0, 50, 50, "?", "?"], tones: { 1: "good", 2: "good" }, pointers: [{ at: 2, label: "i = 2", tone: "accent" }] },
          ],
          caption: "dp has n + 1 cells: dp[0] is the empty prefix.",
        },
      },
      {
        kind: "read",
        title: "Worked example: jobs C and D",
        body: "- i = 3, job C (start 3): A ends at 3 ≤ 3, so k = 1. `dp[3] = max(50, 40 + dp[1]) = max(50, 90) = 90`.\n- i = 4, job D (start 3): k = 1 again. `dp[4] = max(90, 70 + dp[1]) = max(90, 120) = 120`.\n\nAnswer: `dp[4] = 120`, jobs A and D.",
        visual: {
          kind: "array",
          rows: [
            { label: "end", items: [3, 4, 5, 6], tones: { 0: "accent" } },
            { label: "dp", items: [0, 50, 50, 90, 120], tones: { 1: "accent", 4: "good" }, pointers: [{ at: 4, label: "answer", tone: "good" }] },
          ],
          caption: "Both C and D jump back to dp[1], the best profit that ends by time 3.",
        },
      },
      {
        kind: "read",
        title: "The template",
        body: "- Sort jobs by end time: `sorted(zip(end, start, profit))`.\n- `ends` is the sorted end list, so `bisect_right(ends, s)` counts jobs that end at or before s.\n- One pass fills `dp[1..n]`.\n\nMental test: on A, B, C, D it fills 50, 50, 90, 120. O(n log n) for the sort and the bisects.",
        visual: { kind: "code", lang: "python", code: "from bisect import bisect_right\n\ndef job_scheduling(start, end, profit):  # LC 1235\n    jobs = sorted(zip(end, start, profit))\n    ends = [e for e, s, p in jobs]\n    dp = [0] * (len(jobs) + 1)           # dp[i] = best profit using only the first i jobs (by end)\n    for i in range(1, len(jobs) + 1):\n        e, s, p = jobs[i - 1]\n        k = bisect_right(ends, s)        # jobs 0..k-1 end at or before s\n        dp[i] = max(dp[i - 1], dp[k] + p)\n    return dp[len(jobs)]\n" },
      },
      {
        kind: "code",
        title: "Now type it yourself",
        prompt: "Write `job_scheduling(start, end, profit)` (LC 1235): the max total profit of jobs that don't overlap. A job may start exactly when another ends.",
        starter: "from bisect import bisect_right\n\ndef job_scheduling(start, end, profit):\n    # sort by end; dp[i] = best using the first i jobs\n    pass\n",
        solution: "from bisect import bisect_right\n\ndef job_scheduling(start, end, profit):  # LC 1235\n    jobs = sorted(zip(end, start, profit))\n    ends = [e for e, s, p in jobs]\n    dp = [0] * (len(jobs) + 1)           # dp[i] = best profit using only the first i jobs (by end)\n    for i in range(1, len(jobs) + 1):\n        e, s, p = jobs[i - 1]\n        k = bisect_right(ends, s)        # jobs 0..k-1 end at or before s\n        dp[i] = max(dp[i - 1], dp[k] + p)\n    return dp[len(jobs)]\n",
        tests: [
          { call: "job_scheduling([1, 2, 3, 3], [3, 4, 5, 6], [50, 10, 40, 70])", expect: "120", label: "the worked example" },
          { call: "job_scheduling([1, 2, 3, 4, 6], [3, 5, 10, 6, 9], [20, 20, 100, 70, 60])", expect: "150" },
          { call: "job_scheduling([1, 1, 1], [2, 3, 4], [5, 6, 4])", expect: "6", label: "all overlap" },
          { call: "job_scheduling([1], [2], [5])", expect: "5", label: "one job" },
        ],
        teach: "Sort by end. dp[i] = max(dp[i-1], profit_i + dp[k]) where k = bisect_right(ends, start_i) counts the jobs that finish by the time job i starts.",
        explain: "`bisect_right` (not `bisect_left`) lets a job start exactly when another ends. The same shape solves any \"weighted intervals, no overlap\" problem.",
        fromMemory: true,
      },
      {
        kind: "widget",
        widget: "triage",
        title: "Scan without a label",
        task: "Run the 15-second scan on the deck cards. For every DP card, say the state and the transition out loud before you check. Count how many states you got right, not just pattern names.",
        props: { mode: "cards", upToDay: 21 },
      },
      {
        kind: "read",
        title: "How to split the morning",
        body: "The 3-hour block today has three parts. Put a header on every file: **clue / pattern / state / target** (what you noticed, the pattern, the DP state, and the complexity you aim for).",
        visual: {
          kind: "table",
          headers: ["Time", "What"],
          rows: [
            ["0:00–0:20", "Recognition Test #3. Score it."],
            ["0:20–2:20", "Mixed set. Header on every file: clue / pattern / state / target."],
            ["2:20–3:00", "Re-solve the two worst problems of the week from your log. Update the mistake journal."],
          ],
        },
      },
      {
        kind: "read",
        title: "When a DP gets Wrong Answer",
        body: "Don't change code at random. Go through this checklist **in order** and fill each blank in words before you touch the code.\n\nMost DP bugs are at step 1 (a vague state) or step 4 (reading a cell that isn't final yet). Step 7 is the [[stress test|stress testing]] from Chapter 3: a brute force on n ≤ 8 against your DP, on random inputs.",
        visual: { kind: "code", lang: "python", code: "# 1. STATE in words:   dp[i][j] = ______________________ for ______________\n# 2. BASE:             which cells are set before the loops? are they right for empty input?\n# 3. TRANSITION:       last choice = ______ ; every option listed?\n# 4. ORDER:            does every read hit an already-final cell? (draw 3x3 arrows)\n# 5. ANSWER:           dp[n]? dp[0]? max(dp)? dp[full][*]?\n# 6. LIMITS:           states x transition <= ~1e7 in Python? mod applied? int overflow n/a\n# 7. TINY TEST:        brute force on n <= 8 vs dp, random inputs (Chapter 3 stress test)\n", caption: "The DP debugging checklist." },
      },
      {
        kind: "quiz",
        teach: "The checklist is ordered on purpose: you can't check a base case, transition or answer until you know exactly what one cell means.",
        prompt: "Your DP gets Wrong Answer. What do you check first?",
        options: [
          "Write the state in words: what dp[i][j] means",
          "Change the loop direction and resubmit",
          "Raise the recursion limit",
        ],
        answer: 0,
        explain: "Step 1 is STATE in words. Every other step (base, transition, order, answer) is judged against that sentence. Changing loops at random hides the real bug.",
      },
      {
        kind: "read",
        title: "When the state isn't obvious",
        body: "Write the brute-force recursion first, then look at its **arguments**.\n\nFor example, `solve(i, last, used, total)`: if your code branches on `i`, `last` and `used` but only adds to `total`, then `total` is the value, not the state. The state is `(i, last, used)`.",
        callout: { type: "move", text: "If the state isn't obvious, write the brute-force recursion and look at its arguments. The arguments that actually change between calls are the state. Anything you pass but never branch on can be dropped." },
      },
      {
        kind: "read",
        title: "Contest #3: before and during",
        body: "Tonight's contest is a **LeetCode Weekly Contest**. Check leetcode.com/contest for the exact start time in your time zone, and register in the morning.\n\n- **Before:** 10 minutes of the recognition warm-up (Chapter 9). Open a blank template file. No AI tabs open.\n- **During:** follow the in-contest routine in Chapter 10. For each problem, write the header (clue / pattern / state / target) before coding. Expect Q3 or Q4 to be DP. Say the state out loud before you touch the keyboard.",
      },
      {
        kind: "read",
        title: "Contest #3: after",
        body: "Take 15 minutes, no more. Write down:\n- which problems you solved,\n- where you got stuck,\n- whether it was **recognition** (you didn't see it was DP) or **design** (you saw DP but couldn't find the state).\n\n[[Upsolving|upsolve]] waits for tomorrow morning: the first 45 minutes of Day 22.",
      },
      {
        kind: "quiz",
        teach: "Recognition means you didn't see which pattern it was. Design means you saw the pattern but couldn't build the solution.",
        prompt: "In the contest you knew Q3 was DP, but you couldn't decide what dp[i] should mean. Which kind of miss is that?",
        options: ["Design", "Recognition", "Implementation speed"],
        answer: 0,
        explain: "You recognised DP, so recognition worked. Not finding the state is a design miss. The fix is the recipe and the brute-force-arguments trick, not more pattern cards.",
      },
      {
        kind: "summary",
        points: [
          "Read the constraints first: n ≤ 20 mask, n ≤ 500 interval, n ≤ 5000 O(n²), n ≤ 10^5 O(n) or O(n log n); mod → counting.",
          "Input shape names the state: (i, j), (l, r), mask, (node, mode), (day, mode).",
          "Weighted jobs without overlap: sort by end, `dp[i] = max(dp[i-1], p + dp[k])`, k from `bisect_right`.",
          "On Wrong Answer, walk the 7-step checklist in order, starting with the state in words.",
          "After the contest, label each miss recognition or design. Upsolve on Day 22.",
        ],
      },
    ],
  },

  /* ================================================================
     Day 21 B: Recognition Test #3 + mixed set + checks
     ================================================================ */
  {
    id: "ch06-l14",
    day: 21,
    title: "Day 21 drill: Recognition Test #3 and the mixed set",
    goal: "Take Recognition Test #3 (name the DP state in 15 seconds), work the mixed set, and close the DP week.",
    minutes: 12,
    steps: [
      {
        kind: "read",
        title: "Close the DP week",
        body: "This lesson is the morning's work:\n- **Recognition Test #3**: 20 cards, DP only.\n- **The mixed set**: 6 problems with no topic label.\n- **The end-of-day check**.\n\nThe state shapes you need are all from this week.",
        visual: {
          kind: "stats",
          items: [
            { value: "20", label: "test cards", note: "15 s each" },
            { value: "6", label: "mixed problems", note: "no labels" },
            { value: "17+", label: "solid score", note: "move on to Week 4" },
          ],
        },
      },
      {
        kind: "read",
        title: "Test rules",
        body: "Set a 15-second timer per card. Say **the state and the transition** out loud, then tap to check.\n\nA card counts as correct only if the state is right. The pattern name alone isn't enough: \"knapsack\" without `dp[s]` and its meaning is a miss.\n\nKeep a tally of correct cards as you go.",
      },
      {
        kind: "reveal",
        prompt: "Cards 1–4. 15 seconds each: state and transition.\n1. Count binary strings of length n with no two consecutive 1s.\n2. Find the minimum cost to paint n houses with 3 colours, where neighbours can't share a colour.\n3. Find the longest palindromic subsequence of a string of length 1000.\n4. Count the ways to tile a 2×n board with dominoes.",
        answer: "1 → `dp[i][last bit]`; `dp[i][0] = dp[i-1][0] + dp[i-1][1]`, `dp[i][1] = dp[i-1][0]`.\n\n2 → `dp[i][c]` = min cost with house i painted c; `= cost[i][c] + min(dp[i-1][c'] for c' ≠ c)`.\n\n3 → `dp[i][j]` on s[i..j]; equal ends → `2 + dp[i+1][j-1]`, else `max(dp[i+1][j], dp[i][j-1])`.\n\n4 → `dp[n] = dp[n-1] + dp[n-2]` (last piece vertical, or two horizontal).",
      },
      {
        kind: "reveal",
        prompt: "Cards 5–8. 15 seconds each: state and transition.\n5. 18 friends must sit in a row; each adjacent pair has an awkwardness score. Minimise the total.\n6. Count the integers up to 10^15 that contain no digit 4.\n7. A frog on n stones can jump at most k ahead; the cost is the height difference. Find the minimum cost.\n8. Find the maximum sum of a subsequence in which no two chosen elements are adjacent, on a tree.",
        answer: "5 → `dp[mask][last]`; `dp[mask | 1<<j][j] = min(.., dp[mask][last] + w[last][j])`.\n\n6 → digit DP `(pos, tight, started)`; skip d = 4.\n\n7 → `dp[i] = min(dp[j] + |h_i − h_j|)` for j in [i−k, i−1].\n\n8 → tree DP `(take, skip)` per node.",
      },
      {
        kind: "read",
        title: "Notice the signal",
        body: "Cards 5 and 6 hid this week's newest shapes. 18 friends in a row, with a cost between neighbours, is TSP: `dp[mask][last]`. \"Count integers up to 10^15\" with a digit rule is digit DP.\n\nIf you named the topic but not the state, the card is a miss. That is the point of this test.",
      },
      {
        kind: "reveal",
        prompt: "Cards 9–12. 15 seconds each: state and transition.\n9. Cut a string into palindromes using the fewest cuts (n = 2000).\n10. Use the fewest perfect squares that sum to n.\n11. There are n items with weight ≤ 10^9 and value ≤ 10^3, n = 100. Find the max value within W.\n12. Find the longest chain of words where each word is the previous one plus one letter.",
        answer: "9 → `dp[i]` = min cuts for the prefix of length i; `= min(dp[j] + 1)` over palindromic s[j..i−1], with a precomputed `pal[j][i]` table.\n\n10 → unbounded knapsack: `dp[s] = 1 + min(dp[s − k²])`.\n\n11 → `dp[v]` = min weight for value v, 0/1 descending; answer = max v with `dp[v] ≤ W`.\n\n12 → sort words by length; `dp[w] = 1 + max(dp[w with one letter removed])`; a hash map is the table.",
      },
      {
        kind: "reveal",
        prompt: "Cards 13–16. 15 seconds each: state and transition.\n13. With at most k stock transactions, maximise profit.\n14. Find the longest common substring (contiguous) of two strings of length 3000.\n15. Count the monotone paths from the top-left to the bottom-right of a grid avoiding obstacles, mod 10^9+7.\n16. Find the minimum cost to merge n ≤ 400 adjacent stones into one pile.",
        answer: "13 → `dp[t][holding]` with t transactions used; buy from `(t, free)` → `(t, hold)`, sell → `(t+1, free)`.\n\n14 → `dp[i][j]` = length of the common suffix ending at a[i−1], b[j−1]; `= dp[i-1][j-1] + 1` if equal, else 0; answer = max.\n\n15 → `dp[r][c] = dp[r-1][c] + dp[r][c-1]` mod, 0 on obstacles.\n\n16 → interval `dp[l][r] = min(dp[l][k] + dp[k+1][r]) + sum(l..r)`, loop by length.",
      },
      {
        kind: "read",
        title: "Notice the signal",
        body: "Card 11 flips knapsack: weights up to 10^9 are too big to index, but values ≤ 10^3 × 100 items are small. So index by **value** and store the min weight.\n\nCard 14 says **contiguous**: a common substring resets to 0 on a mismatch. A subsequence (LCS) would not.",
      },
      {
        kind: "reveal",
        prompt: "Cards 17–20. 15 seconds each: state and transition.\n17. Count the subsets of an array (n ≤ 100, values ≤ 1000) whose sum is exactly S.\n18. Find the longest path in a DAG with 10^5 nodes.\n19. Match regex `.` and `*` against a string.\n20. In a game where each move removes 1, 3 or 4 stones from a pile of n, the player who can't move loses. Who wins?",
        answer: "17 → 0/1 counting `dp[s] += dp[s − x]`, descending.\n\n18 → topological order; `dp[v] = max(dp[u] + 1)` over edges u→v.\n\n19 → `dp[i][j]` = s[:i] matches p[:j]; `*` → zero copies `dp[i][j-2]`, or one more copy `dp[i-1][j]` if s[i−1] matches p[j−2].\n\n20 → `win[n] = any(not win[n − m])` for m in {1, 3, 4} with m ≤ n; `win[0] = False`.",
      },
      {
        kind: "read",
        title: "Score it",
        body: "Count the cards where your **state** was right.\n\n- **17 or more:** DP recognition is solid. Move on to Week 4.\n- **12 to 16:** turn every miss into a [[card|recognition card]] for the Gym (Chapter 9) and re-test on Day 25.\n- **Under 12:** re-read the 6-step DP recipe and redo Day 15's recognition drill tomorrow, before upsolving.\n\nRecord the score in the Tracker next to Test #1 and Test #2.",
      },
      {
        kind: "practice",
        title: "The mixed set",
        intro: "Work the rows in order and keep each time box. No AI. Write the header on every file: clue / pattern / state / target. If a stretch row is unfinished when its box ends, move it to the re-solve list. Row 6 is overflow. Then spend the last 40 minutes re-solving the two worst problems of the week from your log.",
        problems: [
          { ref: "AtCoder DP Contest — C Vacation", tier: "warm", lvl: "E", box: 15, clue: "`dp[i][activity]`; no activity on two consecutive days." },
          { ref: "LC 2140 Solving Questions With Brainpower", tier: "core", lvl: "M", box: 30, clue: "Take i → jump to i + brainpower + 1. Fill backward." },
          { ref: "LC 983 Minimum Cost For Tickets", tier: "core", lvl: "M", box: 30, clue: "`dp[day]` = min cost; 1/7/30-day pass as the last choice." },
          { ref: "LC 1235 Maximum Profit in Job Scheduling", tier: "stretch", lvl: "H", box: 45, clue: "Sort by end + `bisect` for the last compatible job." },
          { ref: "CSES — Two Sets II", tier: "core", lvl: "M", box: 45, clue: "0/1 counting over 1..n−1 to sum total/2 (leaving n out counts each split once). Check total is even first." },
          { ref: "AtCoder DP Contest — L Deque", tier: "stretch", lvl: "M", box: 45, clue: "Overflow. Ends-taking game → `dp[l][r]` on the score difference." },
        ],
      },
      {
        kind: "order",
        teach: "The recipe starts with what one cell means and ends with whether the whole table fits the time limit. Each step needs the one before it.",
        prompt: "End-of-day check 1: put the 6-step DP recipe in order.",
        items: [
          "State",
          "Transition (the last choice)",
          "Base cases",
          "Answer location",
          "Order of filling",
          "Complexity = states × transition cost",
        ],
        explain: "State → transition → base cases → answer location → order of filling → complexity. Say it out loud before every DP until it is automatic.",
      },
      {
        kind: "match",
        teach: "Each input shape has one standard state: what you need to know to describe where you are in that input.",
        prompt: "End-of-day check 2: name the state shape for each input.",
        pairs: [
          ["Two strings", "(i, j)"],
          ["One range", "(l, r)"],
          ["A subset of ≤ 20", "mask"],
          ["A tree", "(node, mode)"],
          ["Days with modes", "(day, mode)"],
        ],
        explain: "Two strings → (i, j) prefixes. One range → (l, r). A small subset → mask. A tree → (node, mode). Days with modes → (day, mode).",
      },
      {
        kind: "reveal",
        prompt: "End-of-day check 3: from tonight's contest, which problem did you misjudge, and was it recognition or design?",
        answer: "Write it down in one line: the problem, what you thought it was, and what it really was. Recognition = you didn't see it was DP. Design = you saw DP but couldn't find the state. Upsolve it in the first 45 minutes of Day 22.",
      },
      {
        kind: "summary",
        points: [
          "Recognition Test #3 counts a card only when the state is right, not just the pattern name.",
          "17+ → Week 4. 12–16 → cards for the misses, re-test on Day 25. Under 12 → redo the recipe and Day 15's drill.",
          "Header on every file: clue / pattern / state / target.",
          "Log 1 mistake and add 3 cards. Record the score in the Tracker (#tracker) and review your cards in the Gym (#gym).",
        ],
      },
    ],
  },
];

export default lessons;
