import type { Lesson, ArrayRow, Visual } from "../types";
// Chapter 4, Week 1, part 2: Days 4-7 (lessons ch04-l9 ... ch04-l16).

/** Join code lines with "\n". */
const py = (...lines: string[]): string => lines.join("\n");
/** An array visual with 0-based indices on top. */
const arr = (rows: ArrayRow[], caption?: string): Visual => ({ kind: "array", rows, indices: true, caption });

const LIST_INTRO =
  "Work in order and respect each time box. No AI while solving. Before you code, write three comment lines: the clue, the pattern, the target complexity. When a box runs out: write the brute force, take one hint, then read the editorial, close it and write the solution from scratch. Any stretch row you do not finish goes on the re-solve list.";

/* ------------------------------------------------------------------ */
/* Day 4 templates                                                     */
/* ------------------------------------------------------------------ */
const COUNT_SUM_K = py(
  "from collections import defaultdict",
  "",
  "def count_sum_k(nums, k):",
  "    seen = defaultdict(int)",
  "    seen[0] = 1                         # empty prefix",
  "    run = ans = 0",
  "    for x in nums:",
  "        run += x",
  "        ans += seen[run - k]",
  "        seen[run] += 1",
  "    return ans",
);
const LONGEST_ZERO = py(
  "def longest_zero_sum(nums):",
  "    first = {0: -1}",
  "    run = best = 0",
  "    for i, x in enumerate(nums):",
  "        run += x",
  "        if run in first:",
  "            best = max(best, i - first[run])",
  "        else:",
  "            first[run] = i",
  "    return best",
);
const APPLY_UPDATES = py(
  "from itertools import accumulate",
  "",
  "def apply_updates(n, updates):",
  "    diff = [0] * (n + 1)",
  "    for l, r, v in updates:",
  "        diff[l] += v",
  "        diff[r + 1] -= v",
  "    return list(accumulate(diff))[:n]",
);
const RANGE_SUMS = py(
  "from itertools import accumulate",
  "",
  "def range_sums(a, queries):",
  "    pre = list(accumulate(a, initial=0))",
  "    return [pre[r + 1] - pre[l] for l, r in queries]",
);
const PREFIX_2D = py(
  "def build_2d(g):",
  "    n, m = len(g), len(g[0])",
  "    P = [[0] * (m + 1) for _ in range(n + 1)]",
  "    for i in range(n):",
  "        for j in range(m):",
  "            P[i + 1][j + 1] = g[i][j] + P[i][j + 1] + P[i + 1][j] - P[i][j]",
  "    return P",
  "",
  "def rect(P, r1, c1, r2, c2):",
  "    return P[r2 + 1][c2 + 1] - P[r1][c2 + 1] - P[r2 + 1][c1] + P[r1][c1]",
);
const DAY4_TEMPLATE = py(
  "from itertools import accumulate",
  "from collections import defaultdict",
  "",
  "# 1. Prefix sums: sum(a[l..r]) inclusive = pre[r + 1] - pre[l]",
  "pre = list(accumulate(a, initial=0))",
  "",
  "# 2. Count subarrays with sum == k (negatives OK)",
  "def count_sum_k(nums, k):",
  "    seen = defaultdict(int)",
  "    seen[0] = 1                         # empty prefix",
  "    run = ans = 0",
  "    for x in nums:",
  "        run += x",
  "        ans += seen[run - k]",
  "        seen[run] += 1",
  "    return ans",
  "",
  "# 3. Longest subarray with sum == 0 (store FIRST index of each prefix)",
  LONGEST_ZERO,
  "",
  "# 4. Difference array: apply (l, r, v) updates, inclusive, 0-indexed",
  "def apply_updates(n, updates):",
  "    diff = [0] * (n + 1)",
  "    for l, r, v in updates:",
  "        diff[l] += v",
  "        diff[r + 1] -= v",
  "    return list(accumulate(diff))[:n]",
  "",
  "# 5. 2-D prefix: sum of rows r1..r2, cols c1..c2 inclusive",
  PREFIX_2D,
);

/* ------------------------------------------------------------------ */
/* Day 5 templates                                                     */
/* ------------------------------------------------------------------ */
const NEXT_GREATER = py(
  "def next_greater(a):",
  "    n = len(a)",
  "    res = [-1] * n",
  "    st = []                                 # indices, values decreasing",
  "    for i, x in enumerate(a):",
  "        while st and a[st[-1]] < x:",
  "            res[st.pop()] = i               # x answers everyone smaller on top",
  "        st.append(i)",
  "    return res",
);
const WINDOW_MAX = py(
  "from collections import deque",
  "",
  "def window_max(a, k):",
  "    dq, out = deque(), []                   # indices, values decreasing",
  "    for i, x in enumerate(a):",
  "        while dq and a[dq[-1]] <= x:",
  "            dq.pop()",
  "        dq.append(i)",
  "        if dq[0] <= i - k:                  # front fell out of the window",
  "            dq.popleft()",
  "        if i >= k - 1:",
  "            out.append(a[dq[0]])",
  "    return out",
);
const DAILY_TEMPS = py(
  "def daily_temperatures(t):",
  "    res = [0] * len(t)",
  "    st = []                                 # indices, values decreasing",
  "    for i, x in enumerate(t):",
  "        while st and t[st[-1]] < x:",
  "            j = st.pop()",
  "            res[j] = i - j                  # distance, not index",
  "        st.append(i)",
  "    return res",
);

/* ------------------------------------------------------------------ */
/* Day 6 templates                                                     */
/* ------------------------------------------------------------------ */
const FIRST_TRUE = py(
  "def first_true(lo, hi, ok):",
  "    while lo < hi:",
  "        mid = (lo + hi) // 2",
  "        if ok(mid):",
  "            hi = mid",
  "        else:",
  "            lo = mid + 1",
  "    return lo",
);
const LAST_TRUE = py(
  "def last_true(lo, hi, ok):",
  "    while lo < hi:",
  "        mid = (lo + hi + 1) // 2        # round up, or it loops forever",
  "        if ok(mid):",
  "            lo = mid",
  "        else:",
  "            hi = mid - 1",
  "    return lo",
);
const KOKO = py(
  FIRST_TRUE,
  "",
  "def min_eating_speed(piles, h):",
  "    return first_true(1, max(piles),",
  "                      lambda k: sum((p + k - 1) // k for p in piles) <= h)",
);
const COUNT_IN_RANGE = py(
  "from bisect import bisect_left, bisect_right",
  "",
  "def count_in_range(a, L, R):",
  "    return bisect_right(a, R) - bisect_left(a, L)",
);
const DAY6_TEMPLATE = py(
  "from bisect import bisect_left, bisect_right",
  "",
  "# 1. First x in [lo, hi] with ok(x) True. ok must be F..F T..T and ok(hi) True.",
  FIRST_TRUE,
  "",
  "# 2. Last x in [lo, hi] with ok(x) True. ok must be T..T F..F and ok(lo) True.",
  LAST_TRUE,
  "",
  "# 3. Example: LC 875 Koko Eating Bananas",
  "def min_eating_speed(piles, h):",
  "    return first_true(1, max(piles),",
  "                      lambda k: sum((p + k - 1) // k for p in piles) <= h)",
  "",
  "# 4. Sorted list lookups with bisect",
  "# first index with a[i] >= x : bisect_left(a, x)",
  "# first index with a[i] >  x : bisect_right(a, x)",
  "# count of values in [L, R]  : bisect_right(a, R) - bisect_left(a, L)",
);

/* ------------------------------------------------------------------ */
/* Shared visuals                                                      */
/* ------------------------------------------------------------------ */
const NUMS4 = [3, 1, 4, 1, 5];
const PRE4 = [0, 3, 4, 8, 9, 14];
const P2D = [
  [0, 0, 0, 0],
  [0, 1, 3, 6],
  [0, 5, 12, 21],
  [0, 12, 27, 45],
];
const MS = [2, 1, 5, 3, 4]; // next-greater flip book
const WM = [5, 3, 4, 1, 2]; // window-max flip book, k = 3
const FFT = ["F", "F", "F", "F", "F", "T", "T", "T"];
const KOKO_K = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const KOKO_H = [27, 15, 10, 8, 8, 6, 5, 5, 5, 5, 4];
const KOKO_OK = ["F", "F", "F", "T", "T", "T", "T", "T", "T", "T", "T"];

const lessons: Lesson[] = [
  /* ================================================================ */
  /* Day 4 A                                                           */
  /* ================================================================ */
  {
    id: "ch04-l9",
    day: 4,
    title: "Day 4: Prefix sums and difference arrays",
    goal: "Answer range-sum queries in O(1), count subarrays with a target sum (negatives allowed), and apply many range updates in O(n + q).",
    minutes: 12,
    steps: [
      {
        kind: "read",
        title: "The same question, again and again",
        body: "Today's problems ask one question many times: *what is the sum of a[l..r]?* Looping over the range costs O(n) per question. With 10^5 questions on 10^5 numbers, that is 10^10 steps. Far too slow.\n\nToday you pay O(n) once, then answer each question in O(1).\n\n**Goal:** answer range-sum queries in O(1), count subarrays with a target sum (negatives allowed), and apply many range updates in O(n + q).",
      },
      {
        kind: "quiz",
        guess: true,
        prompt: "Take a guess. An array never changes, and you get 100,000 questions of the form \"sum from l to r\". What is the smart move?",
        options: [
          "Loop from l to r for every question",
          "Write down running totals once, then answer each question with one subtraction",
          "Sort the array first",
        ],
        answer: 1,
        explain: "Running totals. If you know the total up to r and the total up to just before l, the difference is the sum of the range. That is the whole idea of prefix sums. Sorting would change which numbers sit between l and r.",
      },
      {
        kind: "read",
        title: "Running totals, one cell at a time",
        body: "A **prefix sum** array stores running totals. `pre[i]` is the sum of the first `i` elements. `pre[0] = 0` is the sum of no elements, the **empty prefix**. So `pre` has one more cell than `nums`.\n\nThe rule: `pre[i + 1] = pre[i] + nums[i]`.\n\n- i = 0: pre[1] = 0 + 3 = 3\n- i = 1: pre[2] = 3 + 1 = 4",
        visual: arr([
          { label: "nums", items: NUMS4, pointers: [{ at: 1, label: "i" }], tones: { 0: "neutral", 1: "accent" } },
          { label: "pre", items: [0, 3, 4, "", "", ""], tones: { 0: "neutral", 1: "neutral", 2: "accent" } },
        ]),
      },
      {
        kind: "read",
        title: "The finished prefix array",
        body: "Keep going: 4 + 4 = 8, 8 + 1 = 9, 9 + 5 = 14. The last cell, `pre[5] = 14`, is the sum of the whole array. One addition per cell, so building it is one O(n) pass.\n\nIn Python, one line builds it: `pre = list(accumulate(a, initial=0))`. `accumulate` comes from `itertools`, and `initial=0` puts the empty prefix at the front.",
        visual: arr([
          { label: "nums", items: NUMS4 },
          { label: "pre", items: PRE4, tones: { 5: "accent" } },
        ]),
      },
      {
        kind: "read",
        title: "A query is one subtraction",
        body: "The formula, with both ends included:\n\n`sum(a[l..r]) = pre[r + 1] − pre[l]`\n\nExample: sum of a[1..3] = pre[4] − pre[1] = 9 − 3 = 6. Check by hand: 1 + 4 + 1 = 6.\n\nEvery query is now one subtraction: O(1).",
        visual: arr([
          { label: "nums", items: NUMS4, ranges: [{ from: 1, to: 3, tone: "good", label: "1 + 4 + 1 = 6" }] },
          { label: "pre", items: PRE4, tones: { 1: "bad", 4: "good" }, pointers: [{ at: 1, label: "l" }, { at: 4, label: "r + 1" }] },
        ]),
      },
      {
        kind: "read",
        title: "Why the subtraction works",
        body: "`pre[r + 1]` is the sum of a[0..r]. `pre[l]` is the sum of a[0..l−1]. Subtract them and the shared front part cancels. What is left is exactly a[l..r].\n\nThis is also why `pre` starts with 0: when l = 0 you subtract `pre[0] = 0` and keep the whole front.",
        visual: arr([
          { label: "pre[4]", items: NUMS4, ranges: [{ from: 0, to: 3, tone: "accent", label: "9" }] },
          { label: "pre[1]", items: NUMS4, ranges: [{ from: 0, to: 0, tone: "bad", label: "3" }] },
          { label: "left", items: NUMS4, ranges: [{ from: 1, to: 3, tone: "good", label: "9 − 3 = 6" }] },
        ]),
      },
      {
        kind: "number",
        teach: "sum(a[l..r]) = pre[r + 1] − pre[l]. Find the two cells of pre, then subtract the smaller-index one from the larger-index one.",
        prompt: "Same arrays: nums = [3, 1, 4, 1, 5] and pre = [0, 3, 4, 8, 9, 14]. What is the sum of a[2..4]?",
        visual: arr([
          { label: "nums", items: NUMS4 },
          { label: "pre", items: PRE4 },
        ]),
        answer: 10,
        tolerance: 0.1,
        explain: "l = 2 and r = 4, so pre[5] − pre[2] = 14 − 4 = 10. Check by hand: 4 + 1 + 5 = 10.",
      },
      {
        kind: "read",
        title: "Harder: count subarrays with sum k",
        body: "New problem: count the **subarrays** (contiguous pieces) whose sum is exactly k. Values can be negative.\n\nWalk once and keep a **running sum** `run`. A subarray ending at index i has sum k exactly when some earlier prefix equals `run − k`. That is Two Sum (Day 1) again, but on prefix values.\n\nSo keep a [[hash map]] `seen`: prefix value → how many times you saw it.",
      },
      {
        kind: "read",
        title: "Start with the empty prefix",
        body: "Example: `nums = [1, 1, 1]`, `k = 2`. The answer should be 2: [1, 1] at indexes 0–1 and at 1–2.\n\nBefore the loop, `seen = {0: 1}`. It records the empty prefix, the sum before any element. It lets a subarray that starts at index 0 be counted.\n\n`run = 0`, `ans = 0`.",
        visual: arr([
          { label: "nums", items: [1, 1, 1] },
          { label: "seen", items: ["0: 1"], tones: { 0: "accent" } },
        ]),
      },
      {
        kind: "read",
        title: "i = 0",
        body: "`run = 1`. Look up `run − k = 1 − 2 = −1`. It is not in `seen`, so `ans` stays 0.\n\nThen record this prefix: `seen[1] += 1`.\n\nOrder matters: look up first, record second. Then the current prefix never matches itself.",
        visual: arr([
          { label: "nums", items: [1, 1, 1], pointers: [{ at: 0, label: "i" }], tones: { 0: "accent" } },
          { label: "seen", items: ["0: 1", "1: 1"], tones: { 1: "accent" } },
        ], "run = 1, look up −1: not found, ans = 0"),
      },
      {
        kind: "read",
        title: "i = 1",
        body: "`run = 2`. Look up `2 − 2 = 0`. `seen[0]` is 1, so one subarray ends here: a[0..1] = [1, 1]. `ans = 1`.\n\nThat match came from the empty prefix. Without `{0: 1}` you would miss it.\n\nRecord `seen[2] += 1`.",
        visual: arr([
          { label: "nums", items: [1, 1, 1], pointers: [{ at: 1, label: "i" }], ranges: [{ from: 0, to: 1, tone: "good", label: "sum 2" }] },
          { label: "seen", items: ["0: 1", "1: 1", "2: 1"], tones: { 0: "good", 2: "accent" } },
        ], "run = 2, look up 0: found once, ans = 1"),
      },
      {
        kind: "read",
        title: "i = 2",
        body: "`run = 3`. Look up `3 − 2 = 1`. `seen[1]` is 1, the prefix after index 0. So a[1..2] = [1, 1] counts. `ans = 2`. Correct.\n\nOne pass and one map lookup per element: O(n). It works with negative values too. A [[sliding window]] (Day 3) needs positive values to move its edges safely. This does not.",
        visual: arr([
          { label: "nums", items: [1, 1, 1], pointers: [{ at: 2, label: "i" }], ranges: [{ from: 1, to: 2, tone: "good", label: "sum 2" }] },
          { label: "seen", items: ["0: 1", "1: 1", "2: 1", "3: 1"], tones: { 1: "good", 3: "accent" } },
        ], "run = 3, look up 1: found once, ans = 2"),
        callout: { type: "mistake", text: "Forgetting `seen[0] = 1` (or `first = {0: -1}`). Without it, you miss every subarray that starts at index 0." },
      },
      {
        kind: "quiz",
        teach: "A subarray that ends at index i has sum k exactly when some earlier prefix equals run − k. You look that value up in seen.",
        prompt: "You walk nums = [3, 4, 7] with k = 7. At i = 2 the running sum is run = 14. Which prefix value do you look up in seen?",
        options: ["14", "7", "0", "21"],
        answer: 1,
        explain: "run − k = 14 − 7 = 7. The prefix 7 appeared after index 1 (3 + 4), so a[2..2] = [7] has sum 7.",
      },
      {
        kind: "widget",
        widget: "prefix-sums",
        title: "Count subarrays with a map",
        task: "Step through the count. Before each step, say out loud which prefix value you will look up (run − k). Then step and check the map and the count.",
        props: { mode: "subarray-count" },
      },
      {
        kind: "read",
        title: "Longest instead of how many",
        body: "Now find the **longest** subarray with sum 0. Same walk, different map: store the **first index** where each prefix appeared. Start with `first = {0: -1}`: the empty prefix sits just before index 0.\n\nAt i = 3, `run = 0` again. It first appeared at −1, so the length is 3 − (−1) = 4.\n\nNever overwrite a first index. The earliest match is farthest away, so it gives the longest piece.",
        visual: arr([
          { label: "nums", items: [1, -1, 3, -3, 2], pointers: [{ at: 3, label: "i" }], ranges: [{ from: 0, to: 3, tone: "good", label: "sum 0, length 4" }] },
          { label: "run", items: [1, 0, 3, 0, 2], tones: { 1: "warn", 3: "good" } },
        ]),
      },
      {
        kind: "read",
        title: "Counts or first index?",
        body: "One question decides what the map holds:\n\n- For **how many**, store **counts**. Every earlier match is one more subarray.\n- For **longest**, store the **first index**. Only the earliest match matters, because it is farthest away.",
        visual: {
          kind: "compare",
          left: { title: "How many?", points: ["seen = {0: 1}", "ans += seen[run - k]", "seen[run] += 1"] },
          right: { title: "Longest?", points: ["first = {0: -1}", "best = max(best, i - first[run])", "set first[run] only if new"] },
        },
      },
      {
        kind: "quiz",
        teach: "For the longest subarray, the map stores one index per prefix value. The longest piece comes from the match that is farthest away from i.",
        prompt: "You want the longest subarray with sum 0. The prefix value 5 appears after indexes 2, 6 and 9. Which index should the map keep for 5?",
        options: ["2", "9", "6", "3, the number of times it appeared"],
        answer: 0,
        explain: "Keep the first index, 2. A later i that sees run = 5 gets the longest length i − 2. Index 9 would give a shorter piece, and a count answers \"how many\", not \"how long\".",
      },
      {
        kind: "read",
        title: "Two disguises, same machine",
        body: "- **Sum divisible by k.** Two prefixes with the same remainder `run % k` mean the subarray between them is divisible by k. Use `run % k` as the key and count.\n- **Equal number of 0s and 1s.** Turn each 0 into −1. A balanced subarray now has sum 0, so find the longest zero-sum subarray with the first-index map.",
        callout: { type: "trap", text: "In Python, `-7 % 5 == 3`, always non-negative. So for \"sum divisible by k\" you can use `run % k` directly as the key. In C++ or Java people need an extra fix; you do not." },
      },
      {
        kind: "read",
        title: "Difference array: mark only the edges",
        body: "New problem: many updates *add v to every element in a[l..r]*, and you read the array once at the end. Looping over each range costs O(q · n).\n\nA **difference array** marks only the two edges: `diff[l] += v` and `diff[r + 1] −= v`. Two cells per update: O(1).\n\nExample: n = 5, one update (1, 3, 2). `diff` has n + 1 cells, so `r + 1` always fits.",
        visual: arr([
          { label: "diff", items: [0, 2, 0, 0, -2, 0], tones: { 1: "good", 4: "bad" }, pointers: [{ at: 1, label: "l" }, { at: 4, label: "r + 1" }] },
        ], "update (l = 1, r = 3, v = 2)"),
      },
      {
        kind: "read",
        title: "Rebuild with one prefix pass",
        body: "After all updates, take the prefix sum of `diff`. The +2 at index 1 carries forward into every later cell. The −2 at index 4 cancels it. So the +2 lands exactly on indexes 1..3.\n\nKeep the first n cells: `[0, 2, 2, 2, 0]`. Many updates simply add up in `diff`. Total cost: O(q + n) instead of O(q · n).",
        visual: arr([
          { label: "diff", items: [0, 2, 0, 0, -2, 0], tones: { 1: "good", 4: "bad" } },
          { label: "prefix", items: [0, 2, 2, 2, 0, 0], ranges: [{ from: 1, to: 3, tone: "good", label: "+2" }] },
        ]),
      },
      {
        kind: "quiz",
        teach: "To add v to a[l..r], a difference array changes only two cells: one at the start of the range and one just after its end.",
        prompt: "n = 6. Which cells of diff change for the update (l = 2, r = 4, v = 5)?",
        options: [
          "diff[2] += 5 and diff[4] −= 5",
          "diff[2], diff[3] and diff[4] each += 5",
          "diff[2] += 5 and diff[5] −= 5",
          "diff[1] += 5 and diff[4] −= 5",
        ],
        answer: 2,
        explain: "diff[l] += v and diff[r + 1] −= v, so diff[2] += 5 and diff[5] −= 5. The prefix pass then adds 5 to indexes 2, 3 and 4, and the −5 at index 5 stops it.",
      },
      {
        kind: "widget",
        widget: "prefix-sums",
        title: "Range updates",
        task: "Apply three range updates. Before you run the final prefix pass, predict the rebuilt array from the diff cells. Then run it and compare.",
        props: { mode: "difference" },
      },
      {
        kind: "read",
        title: "2-D prefix sums: build",
        body: "For a grid with many rectangle-sum queries, build a 2-D table. `P[i][j]` is the sum of the rectangle from the top-left corner to row i−1, column j−1. Row 0 and column 0 are zeros.\n\n`P[i+1][j+1] = g[i][j] + P[i][j+1] + P[i+1][j] − P[i][j]`\n\nAdd the cell above and the cell to the left. Their overlap, the top-left corner, was added twice, so subtract it once.",
        visual: {
          kind: "grid",
          cells: P2D,
          rowLabels: ["0", "1", "2", "3"],
          colLabels: ["0", "1", "2", "3"],
          tones: { "2,2": "good", "1,2": "accent", "2,1": "accent", "1,1": "bad" },
          arrows: [{ from: [1, 2], to: [2, 2] }, { from: [2, 1], to: [2, 2] }, { from: [1, 1], to: [2, 2], tone: "bad" }],
          caption: "P for g = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]. P[2][2] = g[1][1] + 3 + 5 − 1 = 5 + 3 + 5 − 1 = 12.",
        },
      },
      {
        kind: "read",
        title: "2-D query: four terms",
        body: "Sum of rows r1..r2 and columns c1..c2:\n\n`P[r2+1][c2+1] − P[r1][c2+1] − P[r2+1][c1] + P[r1][c1]`\n\nTake the big rectangle, cut off the strip above and the strip to the left. The top-left corner was cut twice, so add it back. This is [[inclusion-exclusion]].\n\nRows 1..2, columns 1..2: 45 − 6 − 12 + 1 = 28. By hand: 5 + 6 + 8 + 9 = 28.",
        visual: {
          kind: "grid",
          cells: P2D,
          rowLabels: ["0", "1", "2", "3"],
          colLabels: ["0", "1", "2", "3"],
          tones: { "3,3": "good", "1,3": "bad", "3,1": "bad", "1,1": "accent" },
          caption: "Green: + P[3][3]. Red: − P[1][3] and − P[3][1]. Blue: + P[1][1].",
        },
      },
      {
        kind: "read",
        title: "The 15-second clues",
        body: "When you read a problem, these phrases point to today's tools. Notice the word *once* in the update clue: a difference array works when you read the final array after all updates, not between them.",
        callout: {
          type: "clue",
          text: "- Many queries \"sum of a[l..r]\" → prefix array, each query O(1).\n- \"Subarray sum equals k\" with negatives → prefix sum + hash map of counts.\n- \"Sum divisible by k\" → prefix sum mod k + counts.\n- \"Equal number of 0s and 1s\" → map 0 to −1, look for equal prefix sums.\n- Many updates \"add v to every element in [l, r]\", read once at the end → difference array.\n- Grid + many rectangle-sum queries → 2-D prefix sums.",
        },
      },
      {
        kind: "read",
        title: "The whole template",
        body: "Here is the day as one template. Read it line by line.\n\nMental test, `count_sum_k([1, 1, 1], 2)`: run = 1, need −1, 0 found. run = 2, need 0, found once → ans 1. run = 3, need 1, found once → ans 2. Correct.\n\nMental test, `apply_updates(5, [(1, 3, 2)])`: diff = [0, 2, 0, 0, −2, 0], prefix = [0, 2, 2, 2, 0, 0], first 5 → [0, 2, 2, 2, 0]. Correct.",
        visual: { kind: "code", lang: "python", code: DAY4_TEMPLATE },
      },
      {
        kind: "code",
        title: "Now type it yourself",
        prompt: "Write `count_sum_k(nums, k)` from memory: the number of subarrays whose sum is exactly `k`. Values may be negative.",
        starter: py(
          "# prefix sum + map of prefix counts",
          "# remember the empty prefix",
          "def count_sum_k(nums, k):",
          "    pass",
        ),
        solution: COUNT_SUM_K,
        tests: [
          { call: "count_sum_k([1, 1, 1], 2)", expect: "2" },
          { call: "count_sum_k([1, 2, 3], 3)", expect: "2" },
          { call: "count_sum_k([1, -1, 0], 0)", expect: "3", label: "negatives and zero" },
          { call: "count_sum_k([3, 4, 7, 2, -3, 1, 4, 2], 7)", expect: "4" },
          { call: "count_sum_k([5], 5)", expect: "1", label: "one element" },
          { call: "count_sum_k([], 0)", expect: "0", label: "empty" },
        ],
        teach: "Keep a running sum. Before the loop, record the empty prefix: seen[0] = 1. For each x: add it to run, add seen[run − k] to the answer, then record run.",
        explain: "Look up before you record, so the current prefix never pairs with itself. `defaultdict(int)` returns 0 for prefixes you have not seen.",
        fromMemory: true,
      },
      {
        kind: "summary",
        points: [
          "[[Prefix sums|prefix sum]]: pre[0] = 0 and pre[i + 1] = pre[i] + a[i]. Then sum(a[l..r]) = pre[r + 1] − pre[l], O(1) per query.",
          "Count subarrays with sum k: running sum + map of prefix counts, start with {0: 1}. Works with negatives.",
          "\"How many\" stores counts; \"longest\" stores the first index, starting with {0: -1}.",
          "Divisible by k → key run % k. Equal 0s and 1s → turn 0 into −1, look for sum 0.",
          "[[Difference array]]: diff[l] += v, diff[r + 1] −= v, one prefix pass at the end. O(q + n).",
          "[[2-D prefix sum|2-D prefix sum]]: build with + above + left − corner; query with four terms (inclusion-exclusion).",
        ],
      },
    ],
  },

  /* ================================================================ */
  /* Day 4 B                                                           */
  /* ================================================================ */
  {
    id: "ch04-l10",
    day: 4,
    title: "Day 4 drill: prefix sums and difference arrays",
    goal: "Spot prefix sums, prefix + hash map and difference arrays in disguise, type the rest of the templates, and work the day's problem list.",
    minutes: 10,
    steps: [
      {
        kind: "read",
        title: "Day 4 in five lines",
        body: "Today's tools, as \"see this → use that\". This lesson has five disguised problems, then the rest of today's templates to type, then the problem list and the end-of-day check.",
        visual: {
          kind: "table",
          headers: ["You see", "You use"],
          rows: [
            ["Many range-sum queries, array fixed", "Prefix sums, O(1) per query"],
            ["Count subarrays with sum k, negatives", "Prefix sum + map of counts, {0: 1}"],
            ["Longest subarray with sum 0 (or balanced)", "Prefix sum + first-index map, {0: -1}"],
            ["Many range adds, read once at the end", "Difference array + one prefix pass"],
            ["Grid + many rectangle sums", "2-D prefix, four-term query"],
          ],
        },
      },
      {
        kind: "quiz",
        teach: "Ask two things: does the array change, and how many questions come? Many sum questions on a fixed array want a table you build once.",
        prompt: "q = 10^5 queries. Each asks for the total of a[l..r]. The array never changes.",
        options: ["Difference array", "Prefix sums", "Sliding window", "Prefix sum + hash map of counts"],
        answer: 1,
        explain: "Prefix sums. The signal: many range-sum queries on an array that never changes. Build pre once in O(n), answer each query with pre[r + 1] − pre[l].",
      },
      {
        kind: "quiz",
        teach: "Updates that add to a whole range, read only at the end, can be recorded at the two edges of each range and rebuilt later.",
        prompt: "10^5 operations each add v to every seat from l to r. Print the final values.",
        options: ["Prefix sums, rebuilt after every update", "Sliding window", "Difference array, one prefix pass at the end", "Two pointers"],
        answer: 2,
        explain: "Difference array. The signal: many \"add v to [l, r]\" updates and one read at the end. Each update is diff[l] += v, diff[r + 1] −= v; one prefix pass prints the result.",
      },
      {
        kind: "read",
        title: "Notice the signal",
        body: "*Queries* on a fixed array point to prefix sums. *Updates* read once at the end point to a difference array.\n\nIt is the same addition running in opposite directions: prefix sums turn values into totals, a difference array turns edge marks into values.",
      },
      {
        kind: "quiz",
        teach: "Negative values break the sliding window. Two prefixes with the same remainder mod m mean the piece between them is a multiple of m.",
        prompt: "Values can be negative. Count subarrays whose sum is a multiple of m.",
        options: ["Sliding window", "Sort, then two pointers", "Difference array", "Prefix sum mod m + count map"],
        answer: 3,
        explain: "Prefix sum mod m + count map. The signals: \"count subarrays\", \"multiple of m\" and negatives. Use run % m as the key and add seen[run % m] before recording it.",
      },
      {
        kind: "quiz",
        teach: "\"Equal numbers\" becomes \"sum 0\" if one letter counts +1 and the other −1. For \"longest\", the map stores the first index of each prefix.",
        prompt: "A string of 'a' and 'b'. Find the longest substring with equal numbers of each.",
        options: [
          "Map a → +1, b → −1, longest zero-sum via first-index map",
          "Sliding window with a letter counter",
          "Prefix sums with a count map",
          "Two pointers from both ends",
        ],
        answer: 0,
        explain: "Map a → +1 and b → −1; a balanced substring has sum 0. The signal \"longest\" means a first-index map, not counts. A window does not work: a balanced piece can grow unbalanced and then balanced again.",
      },
      {
        kind: "read",
        title: "Notice the signal",
        body: "*Negatives* or *multiple of m* rule out the window and call for prefix + map.\n\nThen one word picks the map: *count* → store counts, *longest* → store the first index.",
      },
      {
        kind: "quiz",
        teach: "With only positive values, a window's sum grows when you extend it and shrinks when you cut it. That makes moving two edges safe.",
        prompt: "Positive values only. Find the shortest subarray with sum at least S.",
        options: ["Prefix sum + hash map of counts", "Difference array", "Sliding window (Day 3)", "Prefix sum mod S"],
        answer: 2,
        explain: "Sliding window, shortest valid. The signal: positive values only + \"shortest\" + \"at least\". Positives make the sum monotone as the window grows, so the window is simpler than a prefix map.",
      },
      {
        kind: "read",
        title: "Type the rest of today's templates",
        body: "You typed `count_sum_k` in the lesson. Now type the other four: the prefix array for range queries, the first-index map, the difference array and the 2-D prefix.\n\nTry each from memory first. Open the solution only after a real attempt.",
      },
      {
        kind: "code",
        title: "Prefix sums for range queries",
        prompt: "Write `range_sums(a, queries)`. Each query is `(l, r)`, both ends included. Return the list of sums, building the prefix array once.",
        starter: py("from itertools import accumulate", "", "def range_sums(a, queries):", "    pass"),
        solution: RANGE_SUMS,
        tests: [
          { call: "range_sums([3, 1, 4, 1, 5], [(1, 3), (2, 4)])", expect: "[6, 10]" },
          { call: "range_sums([3, 1, 4, 1, 5], [(0, 4), (0, 0)])", expect: "[14, 3]" },
          { call: "range_sums([-2, 0, 3, -5, 2, -1], [(0, 2), (2, 5), (0, 5)])", expect: "[1, -1, -3]", label: "LC 303 example" },
          { call: "range_sums([7], [(0, 0)])", expect: "[7]", label: "one element" },
          { call: "range_sums([1, 2], [])", expect: "[]", label: "no queries" },
        ],
        teach: "pre = list(accumulate(a, initial=0)). Then sum(a[l..r]) = pre[r + 1] − pre[l].",
        explain: "Build once in O(n), then each query is one subtraction. `initial=0` adds the empty prefix, so l = 0 needs no special case.",
      },
      {
        kind: "code",
        title: "Longest zero-sum subarray",
        prompt: "Write `longest_zero_sum(nums)`: the length of the longest subarray with sum 0, or 0 if there is none.",
        starter: py("# first-index map, start with the empty prefix at -1", "def longest_zero_sum(nums):", "    pass"),
        solution: LONGEST_ZERO,
        tests: [
          { call: "longest_zero_sum([1, -1, 3, -3, 2])", expect: "4" },
          { call: "longest_zero_sum([1, 2, 3])", expect: "0", label: "none" },
          { call: "longest_zero_sum([0])", expect: "1", label: "one element" },
          { call: "longest_zero_sum([0, 0, 0])", expect: "3", label: "all equal" },
          { call: "longest_zero_sum([-1, 1, -1, 1])", expect: "4" },
          { call: "longest_zero_sum([])", expect: "0", label: "empty" },
        ],
        teach: "Store the first index where each prefix value appeared, starting with first = {0: -1}. When a prefix repeats, the piece between has sum 0.",
        explain: "Only set `first[run]` when it is new. Overwriting it would shorten every later answer.",
        fromMemory: true,
      },
      {
        kind: "code",
        title: "Difference array",
        prompt: "Write `apply_updates(n, updates)`. Each update `(l, r, v)` adds `v` to every index from `l` to `r`, inclusive and 0-indexed. Return the final array of length `n`, starting from all zeros.",
        starter: py("from itertools import accumulate", "", "def apply_updates(n, updates):", "    pass"),
        solution: APPLY_UPDATES,
        tests: [
          { call: "apply_updates(5, [(1, 3, 2)])", expect: "[0, 2, 2, 2, 0]" },
          { call: "apply_updates(5, [(1, 3, 2), (0, 2, 1)])", expect: "[1, 3, 3, 2, 0]", label: "updates add up" },
          { call: "apply_updates(4, [(0, 3, 1), (3, 3, -1)])", expect: "[1, 1, 1, 0]", label: "last index" },
          { call: "apply_updates(1, [(0, 0, 7)])", expect: "[7]", label: "one element" },
          { call: "apply_updates(3, [])", expect: "[0, 0, 0]", label: "no updates" },
        ],
        teach: "diff has n + 1 cells. For each update: diff[l] += v, diff[r + 1] −= v. At the end, take the prefix sum and keep the first n cells.",
        explain: "The extra cell lets `r + 1 = n` be written without a check. LC 1109 is 1-indexed: subtract 1 from l and r first.",
      },
      {
        kind: "code",
        title: "2-D prefix sums",
        prompt: "Write `build_2d(g)` and `rect(P, r1, c1, r2, c2)`. `rect` returns the sum of rows r1..r2 and columns c1..c2, inclusive.",
        starter: py("def build_2d(g):", "    pass", "", "def rect(P, r1, c1, r2, c2):", "    pass"),
        solution: PREFIX_2D,
        tests: [
          { call: "rect(build_2d([[1, 2, 3], [4, 5, 6], [7, 8, 9]]), 1, 1, 2, 2)", expect: "28" },
          { call: "rect(build_2d([[1, 2, 3], [4, 5, 6], [7, 8, 9]]), 0, 0, 2, 2)", expect: "45", label: "whole grid" },
          { call: "rect(build_2d([[1, 2, 3], [4, 5, 6], [7, 8, 9]]), 2, 0, 2, 2)", expect: "24", label: "one row" },
          { call: "rect(build_2d([[1, 2, 3], [4, 5, 6], [7, 8, 9]]), 0, 1, 2, 1)", expect: "15", label: "one column" },
          { call: "rect(build_2d([[5]]), 0, 0, 0, 0)", expect: "5", label: "1 x 1" },
        ],
        teach: "Build: P[i+1][j+1] = g[i][j] + P[i][j+1] + P[i+1][j] − P[i][j]. Query: big rectangle, minus the strip above, minus the strip to the left, plus the corner.",
        explain: "Both functions use the padded row 0 and column 0, so no query needs an edge case. CSES Forest Queries is this, plus fast input.",
      },
      {
        kind: "practice",
        title: "Today's problems",
        intro: LIST_INTRO,
        problems: [
          { ref: "LC 303 Range Sum Query - Immutable", tier: "warm", lvl: "E", box: 10, clue: "Many range queries → build prefix once" },
          { ref: "LC 724 Find Pivot Index", tier: "warm", lvl: "E", box: 10, clue: "Left sum == total − left sum − a[i]" },
          { ref: "LC 560 Subarray Sum Equals K", tier: "core", lvl: "M", box: 20, clue: "\"Equals k\" + negatives → prefix + count map" },
          { ref: "LC 974 Subarray Sums Divisible by K", tier: "core", lvl: "M", box: 20, clue: "Same remainder twice → divisible subarray between them" },
          { ref: "LC 525 Contiguous Array", tier: "core", lvl: "M", box: 20, clue: "0 → −1, longest zero-sum → first-index map" },
          { ref: "LC 1109 Corporate Flight Bookings", tier: "core", lvl: "M", box: 20, clue: "Many \"add to range\" updates, read once → difference array (watch 1-indexing)" },
          { ref: "CSES — Forest Queries", tier: "stretch", lvl: "CSES", box: 25, clue: "Grid + many rectangle queries → 2-D prefix; use fast input", url: "https://cses.fi/problemset/task/1652" },
          { ref: "Codeforces problemset, rating 1000–1200, tag implementation, solve 1–2 where there are range or \"how many\" queries", tier: "stretch", lvl: "1000–1200", box: 30, clue: "Ask: \"am I re-adding the same range again and again?\"" },
        ],
      },
      {
        kind: "reveal",
        prompt: "End-of-day check 1. Why do you start the map with {0: 1}? What breaks without it?",
        answer: "{0: 1} records the empty prefix: a sum of 0 before any element. A subarray that starts at index 0 has sum run − 0, so it needs an earlier prefix equal to 0. Without the entry, every subarray that starts at index 0 is missed. In [1, 1, 1] with k = 2 you would count 1 instead of 2.",
      },
      {
        kind: "reveal",
        prompt: "End-of-day check 2. For \"longest\" you store the first index; for \"count\" you store counts. Why the difference?",
        answer: "Counting needs every earlier match, because each one is a different subarray, so you keep how many times each prefix appeared. Longest needs only the match that is farthest away, which is the earliest one, so you keep the first index and never overwrite it.",
      },
      {
        kind: "reveal",
        prompt: "End-of-day check 3. Write the four-term 2-D rectangle formula from memory.",
        answer: "sum(rows r1..r2, cols c1..c2) = P[r2+1][c2+1] − P[r1][c2+1] − P[r2+1][c1] + P[r1][c1]. Big rectangle, minus the strip above, minus the strip to the left, plus the corner that was cut twice.",
      },
      {
        kind: "summary",
        points: [
          "Fixed array + many range sums → [[prefix sums|prefix sum]].",
          "Range adds read once at the end → [[difference array]].",
          "Negatives or \"multiple of m\" → prefix + map; counts for \"how many\", first index for \"longest\".",
          "Positives only + shortest/longest → the Day 3 window is still the simpler tool.",
          "Log 1 mistake and add 3 cards. Record it in the Tracker (#tracker) and drill the cards in the Gym (#gym).",
        ],
      },
    ],
  },

  /* ================================================================ */
  /* Day 5 A                                                           */
  /* ================================================================ */
  {
    id: "ch04-l11",
    day: 5,
    title: "Day 5: Stacks, monotonic stacks and deques",
    goal: "Use a stack for matching and nesting, a monotonic stack for \"next greater/smaller\", and a monotonic deque for \"max of every window\".",
    minutes: 12,
    steps: [
      {
        kind: "read",
        title: "Who is still waiting?",
        body: "Some problems ask, for every element, about the *next* element that beats it: the next warmer day, the next taller bar. Checking every later element for every element is O(n²). For n = 10^5 that is too slow.\n\nToday's tools answer all of them in one O(n) pass.\n\n**Goal:** use a stack for matching and nesting, a monotonic stack for \"next greater/smaller\", and a monotonic deque for \"max of every window\".",
      },
      {
        kind: "quiz",
        guess: true,
        prompt: "Take a guess. You read the brackets ( [ ] ) from left to right. When you reach ], which open bracket must it close?",
        options: ["The first open bracket you ever saw", "The most recent open bracket that is still open", "Any open bracket of the same shape"],
        answer: 1,
        explain: "The most recent one that is still open. The last bracket opened is the first one closed. That order, last in, first out, is exactly what a stack gives you.",
      },
      {
        kind: "read",
        title: "A stack remembers unfinished business",
        body: "A **stack** keeps items in **last-in, first-out** order. In Python, a plain list is a stack: `st.append(x)` pushes, `st.pop()` removes the top, `st[-1]` reads the top.\n\nOn brackets, each open bracket is unfinished business: it waits for its close. Reading `( [`, push both. The most recent one, `[`, is on top.",
        visual: arr([
          { label: "input", items: ["(", "[", "]", ")"], pointers: [{ at: 1, label: "i" }], tones: { 0: "neutral", 1: "accent" } },
          { label: "stack", items: ["(", "["], tones: { 1: "accent" } },
        ]),
      },
      {
        kind: "read",
        title: "Each close matches the top",
        body: "Read `]`. The top is `[`, the matching open bracket, so pop it. Then `)` matches `(`: pop. The input ends and the stack is empty, so the string is valid.\n\nIt fails if a close bracket finds the wrong open on top, finds an empty stack, or if anything is left at the end. A small map `{')': '(', ']': '['}` (close → open) does the matching.",
        visual: arr([
          { label: "input", items: ["(", "[", "]", ")"], pointers: [{ at: 2, label: "i" }], tones: { 1: "good", 2: "good" } },
          { label: "stack", items: ["("] },
        ], "after ] pops [ "),
      },
      {
        kind: "read",
        title: "Next greater element",
        body: "For each index, find the index of the next larger value to its right, or −1.\n\nAsk: **who is waiting for an answer, and what event answers them?** Every index waits until a larger value arrives. The waiting ones live on a stack.\n\nA **monotonic stack** keeps them in sorted order. Here the values are decreasing from bottom to top, and the stack holds indexes.",
        visual: arr([
          { label: "a", items: MS },
          { label: "res", items: [-1, -1, -1, -1, -1] },
        ], "a = [2, 1, 5, 3, 4]. Every answer starts at −1."),
      },
      {
        kind: "read",
        title: "i = 0 and i = 1: nobody is answered",
        body: "i = 0, x = 2: the stack is empty. Push 0.\n\ni = 1, x = 1: the top is index 0 with value 2. Is 2 < 1? No, so nobody is answered. Push 1.\n\nThe stack holds indexes 0 and 1, with values 2 and 1: decreasing from bottom to top.",
        visual: arr([
          { label: "a", items: MS, pointers: [{ at: 1, label: "i" }], tones: { 0: "warn", 1: "warn" } },
          { label: "stack", items: [0, 1] },
          { label: "res", items: [-1, -1, -1, -1, -1] },
        ], "yellow = still waiting on the stack"),
      },
      {
        kind: "read",
        title: "i = 2: one value answers two",
        body: "x = 5. The top is index 1 (value 1). 1 < 5, so 5 is its next greater: `res[1] = 2`. Pop.\n\nThe new top is index 0 (value 2). 2 < 5, so `res[0] = 2`. Pop.\n\nThe stack is empty. Push 2. One arrival answered everyone smaller on top.",
        visual: arr([
          { label: "a", items: MS, pointers: [{ at: 2, label: "i" }], tones: { 0: "good", 1: "good", 2: "warn" } },
          { label: "stack", items: [2] },
          { label: "res", items: [2, 2, -1, -1, -1], tones: { 0: "good", 1: "good" } },
        ]),
      },
      {
        kind: "read",
        title: "i = 3 and i = 4",
        body: "i = 3, x = 3: the top has value 5. 5 < 3? No. Push 3.\n\ni = 4, x = 4: the top is index 3 (value 3). 3 < 4, so `res[3] = 4`. Pop. Now the top has value 5, and 5 < 4 is false. Push 4.\n\nIndexes 2 and 4 are still waiting at the end, so they keep −1. Result: `[2, 2, −1, 4, −1]`.",
        visual: arr([
          { label: "a", items: MS, pointers: [{ at: 4, label: "i" }], tones: { 2: "warn", 3: "good", 4: "warn" } },
          { label: "stack", items: [2, 4] },
          { label: "res", items: [2, 2, -1, 4, -1], tones: { 3: "good" } },
        ]),
      },
      {
        kind: "read",
        title: "Why it is O(n), not O(n²)",
        body: "The inner `while` loop can pop many items at once, so it looks like O(n²). But count the work per index instead: each index is pushed exactly once and popped at most once.\n\nSo all the pops in the whole run add up to at most n. The total is O(n). This kind of counting, total work over the whole run, is called [[amortized]] cost.",
      },
      {
        kind: "quiz",
        teach: "For next greater: when x arrives, pop every index on top whose value is smaller than x, then push x's index. The stack keeps values decreasing from bottom to top.",
        prompt: "a = [4, 2, 3]. After i = 2 (x = 3) is processed, which indexes are on the stack, bottom to top?",
        options: ["[0, 1, 2]", "[2]", "[0, 2]", "[0, 1]"],
        answer: 2,
        explain: "i = 0 pushes 0. i = 1: 4 < 2 is false, push 1. i = 2: value 2 < 3, so pop 1 (res[1] = 2); value 4 < 3 is false, stop. Push 2. The stack is [0, 2], values 4 and 3, still decreasing.",
      },
      {
        kind: "read",
        title: "Variants of the same loop",
        body: "- **Next smaller**: flip `<` to `>` in the `while` test.\n- **How many days until warmer** (LC 739 Daily Temperatures): same loop, but store the distance `i − j` instead of the index `i`.\n- **Previous greater or smaller**: whatever is left on top after the pops is the nearest earlier element that beats x.",
        callout: { type: "mistake", text: "Storing values on the monotonic stack instead of indices. You almost always need the index (for distances, widths, or to write the answer)." },
      },
      {
        kind: "read",
        title: "Largest rectangle: previous and next smaller",
        body: "In LC 84, each bar extends left and right until it meets a shorter bar. So for every bar, find the **previous smaller** and the **next smaller** with the same loop. Then:\n\n`width = next − prev − 1`, `area = height × width`.\n\nHeights `[2, 1, 5, 6, 2, 3]`: the bar of height 5 at index 2 has previous smaller at index 1 and next smaller at index 4. Width = 4 − 1 − 1 = 2, area = 5 × 2 = 10.",
        visual: arr([
          { label: "h", items: [2, 1, 5, 6, 2, 3], pointers: [{ at: 1, label: "prev" }, { at: 2, label: "bar" }, { at: 4, label: "next" }], ranges: [{ from: 2, to: 3, tone: "good", label: "width 2" }], tones: { 1: "bad", 4: "bad" } },
        ]),
      },
      {
        kind: "number",
        teach: "A bar extends until the first shorter bar on each side. width = next − prev − 1, using the indexes of the previous smaller and next smaller bars. area = height × width.",
        prompt: "Heights [3, 1, 4, 5, 2]. The bar of height 4 is at index 2. Its previous smaller bar is at index 1 and its next smaller bar is at index 4. What is the area of its rectangle?",
        visual: arr([{ label: "h", items: [3, 1, 4, 5, 2], pointers: [{ at: 2, label: "bar" }] }]),
        answer: 8,
        tolerance: 0.1,
        explain: "width = 4 − 1 − 1 = 2 (indexes 2 and 3), area = 4 × 2 = 8.",
      },
      {
        kind: "widget",
        widget: "mono-stack",
        title: "Next greater, step by step",
        task: "Step through the next-greater run. Before each step, predict how many indexes the new value will pop. Then step and check.",
        props: { mode: "next-greater" },
      },
      {
        kind: "read",
        title: "A monotonic deque for window maximums",
        body: "Now: the maximum of every window of size k. A **deque** (double-ended queue) can add and remove at both ends in O(1). Use `collections.deque`.\n\nKeep indexes whose values are decreasing. The **front** is the window maximum.\n\nExample: `a = [5, 3, 4, 1, 2]`, `k = 3`. After i = 0 and i = 1, the deque holds indexes 0 and 1 (values 5 and 3). No full window yet.",
        visual: arr([
          { label: "a", items: WM, pointers: [{ at: 1, label: "i" }], tones: { 0: "warn", 1: "warn" } },
          { label: "deque", items: [0, 1] },
        ]),
        callout: { type: "trap", text: "Use a plain `list` as a stack (`append`, `pop`, `st[-1]`). Never use `list.pop(0)` as a queue: it is O(n). Use `collections.deque` with `popleft()`." },
      },
      {
        kind: "read",
        title: "i = 2: pop from the back",
        body: "x = 4. The back is index 1 with value 3, and 3 ≤ 4. While 4 is in the window, 3 can never be the maximum again, so throw it away. The new back has value 5, and 5 ≤ 4 is false. Push 2.\n\nThe first full window is indexes 0..2. The front, index 0, holds the maximum: output 5.",
        visual: arr([
          { label: "a", items: WM, pointers: [{ at: 2, label: "i" }], ranges: [{ from: 0, to: 2, tone: "accent", label: "window" }], tones: { 0: "good", 1: "bad" } },
          { label: "deque", items: [0, 2], tones: { 0: "good" } },
          { label: "out", items: [5] },
        ]),
      },
      {
        kind: "read",
        title: "i = 3: pop from the front",
        body: "x = 1. The back has value 4, and 4 ≤ 1 is false. Push 3. The deque is [0, 2, 3].\n\nNow the window is indexes 1..3. The front, index 0, has left it: `0 ≤ i − k = 0`. Pop it from the front.\n\nThe new front is index 2 (value 4). Output 4.",
        visual: arr([
          { label: "a", items: WM, pointers: [{ at: 3, label: "i" }], ranges: [{ from: 1, to: 3, tone: "accent", label: "window" }], tones: { 0: "bad", 2: "good" } },
          { label: "deque", items: [2, 3], tones: { 0: "good" } },
          { label: "out", items: [5, 4] },
        ]),
      },
      {
        kind: "read",
        title: "i = 4: done",
        body: "x = 2. The back is index 3 (value 1), and 1 ≤ 2: pop it. The next back has value 4, so stop. Push 4. The front, index 2, is still in the window 2..4. Output 4.\n\nResult: `[5, 4, 4]`. Check by hand: max(5, 3, 4) = 5, max(3, 4, 1) = 4, max(4, 1, 2) = 4. Each index enters and leaves the deque once, so the total is O(n).",
        visual: arr([
          { label: "a", items: WM, pointers: [{ at: 4, label: "i" }], ranges: [{ from: 2, to: 4, tone: "accent", label: "window" }], tones: { 2: "good", 3: "bad" } },
          { label: "deque", items: [2, 4], tones: { 0: "good" } },
          { label: "out", items: [5, 4, 4] },
        ]),
      },
      {
        kind: "quiz",
        teach: "The deque keeps indexes with decreasing values. Smaller values are thrown away from the back when a bigger one arrives; the oldest index leaves from the front when it falls out of the window.",
        prompt: "In the window-max deque, where is the index of the current window's maximum?",
        options: ["At the front of the deque", "At the back of the deque", "Anywhere; you scan the deque each time"],
        answer: 0,
        explain: "At the front. Values decrease from front to back, so the front is the largest value still in the window. Reading it is O(1).",
      },
      {
        kind: "widget",
        widget: "mono-stack",
        title: "Window maximum",
        task: "Run the window-max mode with k = 3. At every step, say which end of the deque changes: the back (a bigger value arrived) or the front (the oldest index left the window).",
        props: { mode: "window-max", k: 3 },
      },
      {
        kind: "read",
        title: "The 15-second clues",
        body: "These phrases point to today's tools. The last one is a cousin of next smaller: to build the smallest result, keep an **increasing** stack and pop a larger item whenever a smaller one arrives and you still may remove things.",
        callout: {
          type: "clue",
          text: "- Brackets, nesting, \"undo\", evaluating an expression → stack.\n- \"Next greater\", \"next smaller\", \"how many days until\", \"span\" → monotonic stack.\n- \"Largest rectangle\", \"for each bar, how far can it extend\" → previous and next smaller via monotonic stack.\n- \"Max (or min) of every window of size k\" → monotonic deque.\n- \"Remove k digits / letters to make it smallest\" → increasing stack, pop while you can improve.",
        },
      },
      {
        kind: "read",
        title: "The whole template",
        body: "Both templates, line by line.\n\nMental test, `window_max([1, 3, -1, -3, 5], 3)`: after i = 2 the deque holds the indexes of [3, −1], output 3. i = 3 adds −3, output 3. i = 4: 5 pops everything, output 5. Result `[3, 3, 5]`. Correct.\n\nFor LC 84, run \"previous smaller\" and \"next smaller\" with the same loop, then width = next − prev − 1.",
        visual: { kind: "code", lang: "python", code: py(NEXT_GREATER.replace("def next_greater", "# 1. Next greater element (index), -1 if none. For \"next smaller\", flip < to >.\ndef next_greater"), "", WINDOW_MAX.replace("def window_max", "# 2. Max of every window of size k\ndef window_max")) },
      },
      {
        kind: "code",
        title: "Now type it yourself: next greater",
        prompt: "Write `next_greater(a)` from memory: for each index, the index of the next strictly larger value to its right, or −1.",
        starter: py("# stack of indexes, values decreasing", "def next_greater(a):", "    pass"),
        solution: NEXT_GREATER,
        tests: [
          { call: "next_greater([2, 1, 5, 3, 4])", expect: "[2, 2, -1, 4, -1]" },
          { call: "next_greater([4, 2, 3])", expect: "[-1, 2, -1]" },
          { call: "next_greater([1, 2, 3])", expect: "[1, 2, -1]", label: "increasing" },
          { call: "next_greater([3, 3, 3])", expect: "[-1, -1, -1]", label: "all equal" },
          { call: "next_greater([7])", expect: "[-1]", label: "one element" },
          { call: "next_greater([])", expect: "[]", label: "empty" },
        ],
        teach: "Walk left to right. While the top index has a smaller value than x, pop it and record i as its answer. Then push i.",
        explain: "`res` starts at −1, so indexes still on the stack at the end need no extra work. Equal values do not pop each other because the test is strict `<`.",
        fromMemory: true,
      },
      {
        kind: "code",
        title: "Now type it yourself: window max",
        prompt: "Write `window_max(a, k)`: the maximum of every window of size `k`, in order. Assume 1 ≤ k ≤ len(a).",
        starter: py("from collections import deque", "", "# deque of indexes, values decreasing", "def window_max(a, k):", "    pass"),
        solution: WINDOW_MAX,
        tests: [
          { call: "window_max([1, 3, -1, -3, 5], 3)", expect: "[3, 3, 5]" },
          { call: "window_max([5, 3, 4, 1, 2], 3)", expect: "[5, 4, 4]" },
          { call: "window_max([1, 3, -1, -3, 5, 3, 6, 7], 3)", expect: "[3, 3, 5, 5, 6, 7]", label: "LC 239 example" },
          { call: "window_max([4, 2], 1)", expect: "[4, 2]", label: "k = 1" },
          { call: "window_max([2, 2, 2], 2)", expect: "[2, 2]", label: "all equal" },
          { call: "window_max([9], 1)", expect: "[9]", label: "one element" },
        ],
        teach: "For each i: pop from the back while the back value is ≤ x, push i, pop the front if it is i − k or older, and once i ≥ k − 1 output the front's value.",
        explain: "Pop from the back first, then check the front. Using `<=` at the back keeps the newer of two equal values, which stays in the window longer.",
      },
      {
        kind: "summary",
        points: [
          "A [[stack]] (plain list) handles matching and nesting: the last thing opened closes first.",
          "Ask: who is waiting for an answer, and what event answers them? The waiting ones live on the stack.",
          "Next greater: a [[monotonic stack]], decreasing, of indexes; pop and answer while the top is smaller. O(n), since each index is pushed and popped once.",
          "Next smaller: flip < to >. Daily Temperatures: store i − j. Histogram: width = next − prev − 1.",
          "Window max: a [[monotonic deque]] of indexes, decreasing. Pop smaller ones from the back, expired ones from the front; the front is the max.",
        ],
      },
    ],
  },

  /* ================================================================ */
  /* Day 5 B                                                           */
  /* ================================================================ */
  {
    id: "ch04-l12",
    day: 5,
    title: "Day 5 drill: stacks and monotonic structures",
    goal: "Tell a plain stack, a monotonic stack and a monotonic deque apart in disguise, and work the day's problem list.",
    minutes: 10,
    steps: [
      {
        kind: "read",
        title: "Day 5 in four lines",
        body: "Three structures, one question: **who is waiting for an answer, and what event answers them?**\n\nThis lesson has five disguised problems, one more template variant to type, the problem list and the end-of-day check.",
        visual: {
          kind: "table",
          headers: ["You see", "You use"],
          rows: [
            ["Brackets, nesting, undo, expressions", "Stack (plain list)"],
            ["Next greater/smaller, days until, span", "Monotonic stack of indexes"],
            ["Largest rectangle under bars", "Previous + next smaller, width = next − prev − 1"],
            ["Max or min of every window of size k", "Monotonic deque of indexes"],
          ],
        },
      },
      {
        kind: "quiz",
        teach: "A monotonic stack answers \"nearest element that beats me\" for every index. Looking backward instead of forward is still the same loop.",
        prompt: "For each day, how many consecutive days ending today had a price not above today's?",
        options: ["Sliding window", "Monotonic stack (stock span)", "Monotonic deque", "Prefix sums"],
        answer: 1,
        explain: "Monotonic stack. The signal: \"for each day\" + \"how many consecutive days\" back until a higher price. That is the previous greater element, which is LC 901 Online Stock Span.",
      },
      {
        kind: "quiz",
        teach: "Nesting means the last thing opened must close first: last in, first out.",
        prompt: "Is this string of ()[]{} correctly nested?",
        options: ["Monotonic stack", "Two pointers from both ends", "Stack", "Hash map of counts"],
        answer: 2,
        explain: "A plain stack. The signal: brackets and nesting. Push opens, and each close must match the top. Counting brackets is not enough: \"([)]\" has equal counts but is wrong.",
      },
      {
        kind: "read",
        title: "Notice the signal",
        body: "*Nesting* or *matching* → a plain stack; order is the whole point.\n\n*Nearest element that beats me*, forward or backward → a monotonic stack; the waiting indexes sit on it in sorted order.",
      },
      {
        kind: "quiz",
        teach: "To make a sequence as small as possible, a smaller item should come before a larger one. Keep an increasing stack and pop a larger item when a smaller one arrives, if you still may remove items.",
        prompt: "Remove k digits from a number string to make the result as small as possible.",
        options: ["Increasing stack, pop larger digits while k > 0", "Sort the digits", "Monotonic deque of size k", "Binary search on the result"],
        answer: 0,
        explain: "Increasing stack. The signal: \"remove k\" + \"as small as possible\". When a smaller digit arrives and k > 0, pop the larger digit on top: that improves an earlier position.",
      },
      {
        kind: "quiz",
        teach: "The maximum of a moving window needs a structure that drops old items from one end and dominated items from the other end.",
        prompt: "Report the highest sensor reading in every block of k consecutive readings.",
        options: ["Monotonic stack", "Prefix sums", "Sliding window with a running sum", "Monotonic deque"],
        answer: 3,
        explain: "Monotonic deque. The signal: \"max of every window of size k\". A running sum cannot give a max, and a stack cannot drop the oldest item from its far end.",
      },
      {
        kind: "read",
        title: "Notice the signal",
        body: "*Every window of size k* + *max or min* → deque: old items leave from the front.\n\n*How far can each bar extend* → previous and next smaller on a stack.",
      },
      {
        kind: "quiz",
        teach: "Each bar's rectangle stops at the first shorter bar on each side. Finding those for every bar is a previous-smaller and next-smaller job.",
        prompt: "Find the area of the biggest rectangle that fits under a skyline of bars.",
        options: ["Two pointers from both ends", "Monotonic stack, previous and next smaller", "Monotonic deque", "Prefix sums of heights"],
        answer: 1,
        explain: "Monotonic stack, previous and next smaller (LC 84). For each bar, width = next − prev − 1 and area = height × width. Two pointers solve a different problem, the most water between two lines.",
      },
      {
        kind: "code",
        title: "Variant: store the distance",
        prompt: "Write `daily_temperatures(t)`: for each day, the number of days until a warmer day, or 0 if there is none. This is template 1 with `i − j` instead of `i`.",
        starter: py("def daily_temperatures(t):", "    pass"),
        solution: DAILY_TEMPS,
        tests: [
          { call: "daily_temperatures([73, 74, 75, 71, 69, 72, 76, 73])", expect: "[1, 1, 4, 2, 1, 1, 0, 0]", label: "LC 739 example" },
          { call: "daily_temperatures([30, 40, 50, 60])", expect: "[1, 1, 1, 0]" },
          { call: "daily_temperatures([30, 60, 90])", expect: "[1, 1, 0]" },
          { call: "daily_temperatures([50, 50, 50])", expect: "[0, 0, 0]", label: "all equal" },
          { call: "daily_temperatures([42])", expect: "[0]", label: "one day" },
        ],
        teach: "Same decreasing stack of indexes as next_greater. When you pop index j because t[j] < x, the answer for j is i − j.",
        explain: "The default is 0 here, not −1, because the problem asks for a distance.",
      },
      {
        kind: "practice",
        title: "Today's problems",
        intro: LIST_INTRO,
        problems: [
          { ref: "LC 20 Valid Parentheses", tier: "warm", lvl: "E", box: 10, clue: "Brackets → stack; map close → open" },
          { ref: "LC 155 Min Stack", tier: "core", lvl: "M", box: 15, clue: "Push (value, min so far) pairs" },
          { ref: "LC 739 Daily Temperatures", tier: "core", lvl: "M", box: 20, clue: "\"How many days until warmer\" → next greater, store distance" },
          { ref: "LC 901 Online Stock Span", tier: "core", lvl: "M", box: 20, clue: "Span = previous greater; stack of (price, span), merge spans as you pop" },
          { ref: "LC 239 Sliding Window Maximum", tier: "core", lvl: "H", box: 30, clue: "Max of every window → monotonic deque" },
          { ref: "LC 84 Largest Rectangle in Histogram", tier: "stretch", lvl: "H", box: 35, clue: "Each bar extends to previous smaller and next smaller" },
          { ref: "CSES — Nearest Smaller Values", tier: "stretch", lvl: "CSES", box: 20, clue: "Previous smaller, 1-indexed, print 0 if none; n ≤ 2·10^5 so fast I/O", url: "https://cses.fi/problemset/task/1645" },
          { ref: "Codeforces problemset, rating 1000–1200, tag data structures, solve 1", tier: "stretch", lvl: "1000–1200", box: 30, clue: "At this rating \"data structures\" is usually a stack, set, or map; name which one in 60 s" },
        ],
      },
      {
        kind: "reveal",
        prompt: "End-of-day check 1. Why is the monotonic stack O(n) total and not O(n²)?",
        answer: "Each index is pushed exactly once and popped at most once. The inner while loop can pop many at a time, but over the whole run there are at most n pops in total. So the total work is O(n), amortized.",
      },
      {
        kind: "reveal",
        prompt: "End-of-day check 2. In the window-max deque, why is it safe to throw away smaller elements from the back?",
        answer: "The new value x is both larger (or equal) and newer. Every future window that contains the smaller element also contains x, because x leaves later. So the smaller element can never be the maximum again.",
      },
      {
        kind: "reveal",
        prompt: "End-of-day check 3. For \"next smaller to the right\", what single character in the template changes?",
        answer: "The comparison in the while test: `a[st[-1]] < x` becomes `a[st[-1]] > x`. Now a smaller arrival answers everyone larger on top, and the stack keeps values increasing.",
      },
      {
        kind: "summary",
        points: [
          "Nesting or matching → plain [[stack]].",
          "Next or previous greater/smaller, days until, span → monotonic stack of indexes.",
          "Largest rectangle → previous and next smaller, width = next − prev − 1.",
          "Max or min of every window → monotonic deque. Remove k to make smallest → increasing stack.",
          "Log 1 mistake and add 3 cards. Record it in the Tracker (#tracker) and drill the cards in the Gym (#gym).",
        ],
      },
    ],
  },

  /* ================================================================ */
  /* Day 6 A                                                           */
  /* ================================================================ */
  {
    id: "ch04-l13",
    day: 6,
    title: "Day 6: Binary search and searching the answer",
    goal: "Write one binary search that never loops forever, and turn \"minimum X such that it works\" into a binary search over X.",
    minutes: 12,
    steps: [
      {
        kind: "read",
        title: "Halve the range every time",
        body: "Many problems hide a search. Some are obvious, like finding a value in a sorted array. Some are not: \"the minimum speed so that you finish on time\".\n\nToday you learn one template that solves both and never loops forever.\n\n**Goal:** write one binary search that never loops forever, and turn \"minimum X such that it works\" into a binary search over X.",
      },
      {
        kind: "quiz",
        guess: true,
        prompt: "Take a guess. A friend picks a number from 1 to 1000. After each guess you hear \"higher\" or \"lower\". With smart guesses, how many do you need in the worst case?",
        options: ["About 10", "About 100", "About 500"],
        answer: 0,
        explain: "About 10. Guess the middle every time and each answer throws away half of what is left: 1000, 500, 250, ... down to 1 in about 10 steps, because 2^10 = 1024. That halving is binary search.",
      },
      {
        kind: "read",
        title: "A question that flips once",
        body: "Binary search works on any **yes/no question that flips once**: false, false, ..., false, true, true, ..., true. Call the question `ok(x)`. You want the **first true**.\n\nCheck the middle. If it is true, the answer is the middle or to its left. If false, the answer is to its right. Here the first true is at index 5. Watch the range shrink.",
        visual: arr([{ label: "ok", items: FFT, tones: { 5: "good", 6: "good", 7: "good" } }]),
      },
      {
        kind: "read",
        title: "Step 1: mid = 3 is false",
        body: "`lo = 0`, `hi = 7`. `mid = (0 + 7) // 2 = 3`. `ok(3)` is false, so the first true is to the right of 3: `lo = mid + 1 = 4`.\n\nThe range [lo, hi] always still contains the answer. That rule is the [[invariant]], and every move keeps it true.",
        visual: arr([{ label: "ok", items: FFT, ranges: [{ from: 0, to: 7, tone: "accent", label: "[lo, hi]" }], pointers: [{ at: 0, label: "lo" }, { at: 3, label: "mid", tone: "bad" }, { at: 7, label: "hi" }], tones: { 3: "bad" } }]),
      },
      {
        kind: "read",
        title: "Step 2: mid = 5 is true",
        body: "`lo = 4`, `hi = 7`. `mid = (4 + 7) // 2 = 5`. `ok(5)` is true. The answer is 5 or something to its left, so keep 5 in the range: `hi = mid = 5`.\n\nNote: `hi = mid`, not `mid − 1`. Mid could be the answer.",
        visual: arr([{ label: "ok", items: FFT, ranges: [{ from: 4, to: 7, tone: "accent", label: "[lo, hi]" }], pointers: [{ at: 4, label: "lo" }, { at: 5, label: "mid", tone: "good" }, { at: 7, label: "hi" }], tones: { 5: "good" } }]),
      },
      {
        kind: "read",
        title: "Steps 3 and 4: the range closes",
        body: "`lo = 4`, `hi = 5`. `mid = 4`. `ok(4)` is false, so `lo = 5`.\n\nNow `lo == hi == 5`. The loop `while lo < hi` stops, and `lo` is the first true. Four looks found it among eight cells.\n\nThe loop always ends: either `hi` shrinks to mid, or `lo` jumps past mid.",
        visual: arr([{ label: "ok", items: FFT, ranges: [{ from: 5, to: 5, tone: "good", label: "answer" }], pointers: [{ at: 4, label: "mid", tone: "bad" }, { at: 5, label: "lo = hi", tone: "good" }], tones: { 4: "bad", 5: "good" } }]),
      },
      {
        kind: "read",
        title: "Why it is fast: O(log range)",
        body: "Each step halves the range. A range of 1000 needs about 10 steps, because 2^10 = 1024 ≈ 1000. A range of 10^9 needs about 30, because 2^30 ≈ 10^9. Even 10^18 needs only about 60.\n\nSo binary search costs **O(log range)** checks, and the range can be huge. Python ints never overflow, so `(lo + hi) // 2` is always safe.",
      },
      {
        kind: "number",
        teach: "Each step of binary search halves the range. 2^10 ≈ 1000, so every factor of 1000 in the range adds about 10 steps.",
        prompt: "About how many steps does binary search need for a range of 10^6 values?",
        answer: 20,
        tolerance: 1,
        unit: "steps",
        explain: "10^6 = 1000 × 1000 ≈ 2^10 × 2^10 = 2^20, so about 20 steps.",
      },
      {
        kind: "read",
        title: "Finding a value in a sorted array",
        body: "To find `target` in a sorted array, use the question `ok(i) = a[i] >= target`. On a sorted array it flips once. The first true is the first index whose value is at least target.\n\nThen check equality: if that index is in range and `a[i] == target`, you found it. Otherwise the target is not there. This is LC 704 Binary Search.",
        visual: arr([
          { label: "a", items: [1, 3, 5, 7, 9, 11], tones: { 3: "good" } },
          { label: "ok", items: ["F", "F", "F", "T", "T", "T"], tones: { 3: "good", 4: "good", 5: "good" } },
        ], "target = 7: first true at index 3, and a[3] == 7"),
      },
      {
        kind: "read",
        title: "Python's bisect does boundaries for you",
        body: "On a sorted list, the [[bisect]] module gives the two boundaries you need most:\n\n- `bisect_left(a, x)`: the first index with `a[i] >= x`.\n- `bisect_right(a, x)`: the first index with `a[i] > x`.\n- Count of values in [L, R]: `bisect_right(a, R) − bisect_left(a, L)`.\n\nWith `a = [1, 3, 3, 3, 5, 8]` and x = 3: left = 1, right = 4, and 4 − 1 = 3 copies of 3.",
        visual: arr([{ label: "a", items: [1, 3, 3, 3, 5, 8], pointers: [{ at: 1, label: "left" }, { at: 4, label: "right" }], ranges: [{ from: 1, to: 3, tone: "good", label: "the 3s" }] }]),
      },
      {
        kind: "quiz",
        teach: "bisect_right(a, x) is the first index whose value is strictly greater than x. On a sorted list it lands just after the last copy of x.",
        prompt: "a = [2, 4, 4, 4, 6]. What is bisect_right(a, 4)?",
        options: ["1", "3", "4", "5"],
        answer: 2,
        explain: "The first value greater than 4 is the 6 at index 4. (bisect_left(a, 4) would be 1, and 4 − 1 = 3 copies of 4.)",
      },
      {
        kind: "read",
        title: "Last true: round up",
        body: "Sometimes the question flips the other way: true, ..., true, false, ..., false, and you want the **last true**. Mirror the template: if `ok(mid)`, `lo = mid`; else `hi = mid − 1`.\n\nBut take `lo = 2`, `hi = 3`. Rounding down gives `mid = 2`. If `ok(2)` is true, `lo = 2` again: nothing changes, forever. Round up instead: `mid = (lo + hi + 1) // 2 = 3`, so the range always shrinks.",
        visual: arr([{ label: "ok", items: ["T", "T", "T", "F", "F"], pointers: [{ at: 2, label: "lo = mid", tone: "bad" }, { at: 3, label: "hi" }], tones: { 2: "good" } }], "rounding down: mid = 2 again and again"),
        callout: { type: "mistake", text: "In `last_true`, using `mid = (lo + hi) // 2` with `lo = mid` loops forever when `hi = lo + 1`. Round up." },
      },
      {
        kind: "read",
        title: "Binary search on the answer",
        body: "The big idea: you often cannot compute the best value directly, but you can **check** a guess. That is **binary search on the answer**.\n\nLC 875 Koko Eating Bananas: eat piles of bananas at speed k within h hours. \"Can Koko finish with speed k?\" is false for small k, true for large k. So search over k.\n\nSet it up every time:\n1. Write `ok(x)` in words; check it flips once.\n2. `lo` = smallest possible answer, `hi` = a value surely true.\n3. Run the template.",
      },
      {
        kind: "read",
        title: "Koko: the ok line",
        body: "Piles `[3, 6, 7, 11]`, h = 8. At speed k, a pile p takes `(p + k − 1) // k` hours: p divided by k, rounded up.\n\nk = 3: 1 + 2 + 3 + 4 = 10 hours. Too slow, false.\nk = 4: 1 + 2 + 2 + 3 = 8 hours. True.\n\nThe ok line flips once, at k = 4. `lo = 1`, `hi = max(piles) = 11`, because speed 11 eats any pile in one hour.",
        visual: arr([
          { label: "k", items: KOKO_K },
          { label: "hours", items: KOKO_H },
          { label: "ok", items: KOKO_OK, tones: { 3: "good" } },
        ]),
      },
      {
        kind: "read",
        title: "Koko: the search",
        body: "`lo = 1`, `hi = 11`: mid = 6, 6 hours, true → `hi = 6`.\nmid = 3, 10 hours, false → `lo = 4`.\nmid = 5, 8 hours, true → `hi = 5`.\nmid = 4, 8 hours, true → `hi = 4`.\n\n`lo == hi == 4`. The answer is 4, after only four checks. Each check costs O(n), so the total is O(n log(max pile)).",
        visual: arr([
          { label: "k", items: KOKO_K, pointers: [{ at: 3, label: "lo = hi", tone: "good" }], ranges: [{ from: 3, to: 4, tone: "accent", label: "last range" }] },
          { label: "ok", items: KOKO_OK, tones: { 2: "bad", 3: "good", 4: "good", 5: "good" } },
        ]),
        callout: { type: "trap", text: "`(p + k - 1) // k` is ceiling division on ints. Never use `math.ceil(p / k)`: float division goes wrong for values near 10^18. Python ints never overflow, so `(lo + hi) // 2` is safe." },
      },
      {
        kind: "read",
        title: "Check a guess instead",
        body: "Some shapes almost always mean this pattern:\n\n- \"Minimum speed / capacity / days / time so that it works.\"\n- \"Maximize the minimum\" or \"minimize the maximum\": search the answer, and check it with a simple [[greedy]] pass.\n- Answer up to 10^9 or 10^18 with n up to 2·10^5: log(answer) × O(n) checks fits easily.",
        callout: { type: "move", text: "If you cannot find the answer, ask \"could I **check** a proposed answer quickly?\" If yes and the check flips once, you are done. This one move solves a large share of Codeforces 1100–1500 problems." },
      },
      {
        kind: "quiz",
        teach: "Binary search on the answer needs a yes/no check about a guessed value that is false for small guesses and true for large ones (or the reverse), flipping exactly once.",
        prompt: "LC 1011: ship packages in order within D days; find the minimum ship capacity c. Which ok(c) flips once from false to true as c grows?",
        options: [
          "The packages are sorted by weight",
          "c equals the heaviest package",
          "With capacity c, a greedy day count ships everything within D days",
          "The total weight is divisible by c",
        ],
        answer: 2,
        explain: "\"Can I ship everything within D days with capacity c?\" Fill each day greedily until the next package would not fit. A bigger c never needs more days, so ok flips once from false to true.",
      },
      {
        kind: "read",
        title: "Rotated sorted arrays",
        body: "A sorted array rotated at an unknown point, like `[4, 5, 6, 7, 0, 1, 2]`. To find the minimum (LC 153), use `ok(i) = a[i] <= a[-1]`: false on the left part, true from the minimum on. It flips once, so `first_true` finds it.\n\nTo search a target (LC 33): around `mid`, one half is always sorted. Compare `a[mid]` with `a[hi]` to tell which half, then check whether the target falls inside the sorted half.",
        visual: arr([
          { label: "a", items: [4, 5, 6, 7, 0, 1, 2], tones: { 4: "good" } },
          { label: "ok", items: ["F", "F", "F", "F", "T", "T", "T"], tones: { 4: "good", 5: "good", 6: "good" } },
        ], "ok(i) = a[i] <= a[-1] = 2: first true is the minimum"),
      },
      {
        kind: "quiz",
        teach: "In a rotated sorted array, ok(i) = a[i] <= a[-1] is false before the minimum and true from the minimum on. first_true returns the first index where it is true.",
        prompt: "a = [5, 6, 7, 1, 2, 3, 4] with ok(i) = a[i] <= a[-1]. Which index does first_true return?",
        options: ["0", "3", "6", "2"],
        answer: 1,
        explain: "a[-1] = 4. ok is F, F, F (5, 6, 7 > 4), then T from index 3 (1 ≤ 4). The first true is index 3, where the minimum 1 sits.",
      },
      {
        kind: "read",
        title: "The 15-second clues",
        body: "These phrases point to today's tools. The last one is the strongest: nothing else gives O(log n) on an array.",
        callout: {
          type: "clue",
          text: "- Sorted array + find a value or a boundary → binary search.\n- Rotated sorted, peak, mountain → binary search; compare the middle with an end.\n- \"Minimum speed / capacity / days / time so that it works\" → binary search on the answer.\n- \"Maximize the minimum\" or \"minimize the maximum\" → binary search on the answer + greedy check.\n- Answer up to 10^9 or 10^18, n up to 2·10^5 → log(answer) × O(n) check.\n- \"In O(log n)\" → binary search.",
        },
      },
      {
        kind: "widget",
        widget: "binary-search",
        title: "Search the answer",
        task: "Use the on-answer mode. Before each step, look at check(mid) and say which half survives: \"true, keep mid and the left\" or \"false, go right of mid\". Run it to the end.",
        props: { mode: "on-answer" },
      },
      {
        kind: "read",
        title: "The whole template",
        body: "All four parts, line by line.\n\nMental test, `min_eating_speed([3, 6, 7, 11], 8)`: k = 4 needs 1 + 2 + 2 + 3 = 8 hours, true. k = 3 needs 1 + 2 + 3 + 4 = 10, false. So the answer is 4. Correct.",
        visual: { kind: "code", lang: "python", code: DAY6_TEMPLATE },
      },
      {
        kind: "code",
        title: "Now type it yourself: first true",
        prompt: "Write `first_true(lo, hi, ok)` from memory: the first x in [lo, hi] with `ok(x)` true. Assume ok is F..F T..T and `ok(hi)` is true.",
        starter: py("# while lo < hi: true keeps mid, false skips past mid", "def first_true(lo, hi, ok):", "    pass"),
        solution: FIRST_TRUE,
        tests: [
          { call: "first_true(0, 7, lambda i: i >= 5)", expect: "5" },
          { call: "first_true(0, 10, lambda x: x * x >= 50)", expect: "8" },
          { call: "first_true(0, 5, lambda i: [1, 3, 5, 7, 9, 11][i] >= 7)", expect: "3", label: "sorted array lookup" },
          { call: "first_true(0, 6, lambda i: [4, 5, 6, 7, 0, 1, 2][i] <= 2)", expect: "4", label: "rotated minimum" },
          { call: "first_true(3, 3, lambda x: True)", expect: "3", label: "one value" },
          { call: "first_true(1, 10**18, lambda x: x >= 123456789012)", expect: "123456789012", label: "huge range" },
        ],
        teach: "Loop while lo < hi. mid = (lo + hi) // 2. If ok(mid), hi = mid (mid may be the answer). Else lo = mid + 1. Return lo.",
        explain: "Rounding down is right here: `hi = mid` always shrinks the range because mid < hi.",
        fromMemory: true,
      },
      {
        kind: "code",
        title: "Koko Eating Bananas",
        prompt: "Write `min_eating_speed(piles, h)` with your `first_true`: the minimum speed k that eats every pile within h hours.",
        starter: py(
          "def first_true(lo, hi, ok):",
          "    pass",
          "",
          "def min_eating_speed(piles, h):",
          "    pass",
        ),
        solution: KOKO,
        tests: [
          { call: "min_eating_speed([3, 6, 7, 11], 8)", expect: "4" },
          { call: "min_eating_speed([30, 11, 23, 4, 20], 5)", expect: "30", label: "one hour per pile" },
          { call: "min_eating_speed([30, 11, 23, 4, 20], 6)", expect: "23" },
          { call: "min_eating_speed([5], 10)", expect: "1", label: "lots of time" },
          { call: "min_eating_speed([1000000000], 2)", expect: "500000000", label: "big pile" },
        ],
        teach: "ok(k): the sum of (p + k − 1) // k over all piles is at most h. lo = 1, hi = max(piles).",
        explain: "Ceiling division with ints stays exact for huge values. The check is O(n), the search is O(log max pile).",
      },
      {
        kind: "summary",
        points: [
          "[[Binary search]] needs a yes/no question that flips once. first_true: true → hi = mid, false → lo = mid + 1.",
          "Cost is O(log range): about 30 steps for 10^9, 60 for 10^18.",
          "bisect_left = first a[i] >= x, bisect_right = first a[i] > x; count in [L, R] = right(R) − left(L).",
          "last_true must round up: mid = (lo + hi + 1) // 2.",
          "[[Binary search on the answer]]: write ok(x) in words, check it flips once, set lo and hi, run the template.",
          "Rotated arrays: one half is sorted; ok(i) = a[i] <= a[-1] finds the minimum.",
        ],
      },
    ],
  },

  /* ================================================================ */
  /* Day 6 B                                                           */
  /* ================================================================ */
  {
    id: "ch04-l14",
    day: 6,
    title: "Day 6 drill: binary search",
    goal: "Spot binary search and binary search on the answer in disguise, type the last two templates, and work the day's problem list.",
    minutes: 10,
    steps: [
      {
        kind: "read",
        title: "Day 6 in four lines",
        body: "One question unlocks today: **can I check a guess, and does the check flip once?**\n\nThis lesson has five disguised problems, the last two templates to type, the problem list and the end-of-day check.",
        visual: {
          kind: "table",
          headers: ["You see", "You use"],
          rows: [
            ["Sorted array + value or boundary", "first_true or bisect"],
            ["Rotated sorted, peak, mountain", "Binary search, compare mid with an end"],
            ["Minimum X so that it works", "Binary search on the answer"],
            ["Minimize the max / maximize the min", "Search the answer + greedy check"],
          ],
        },
      },
      {
        kind: "quiz",
        teach: "When you cannot compute the best value directly but can check one guess, and the check flips once as the guess grows, search over the guess.",
        prompt: "Minimum reading speed (pages per hour) to finish every chapter within H hours.",
        options: ["Sliding window", "Prefix sums", "Binary search on the answer (speed)", "Monotonic stack"],
        answer: 2,
        explain: "Binary search on speed. The signal: \"minimum speed\" + \"within H hours\". It is Koko in disguise: check(speed) sums the rounded-up hours per chapter.",
      },
      {
        kind: "quiz",
        teach: "On a sorted list, bisect_left finds the first value ≥ x and bisect_right finds the first value > x.",
        prompt: "A sorted array. How many values lie between L and R?",
        options: ["bisect_right(a, R) − bisect_left(a, L)", "Two pointers from both ends", "Prefix sums over the array", "Hash map of counts"],
        answer: 0,
        explain: "bisect_right(R) − bisect_left(L), two O(log n) lookups. The signal: sorted + \"how many values between\". Everything before bisect_left(L) is too small; everything from bisect_right(R) on is too big.",
      },
      {
        kind: "read",
        title: "Notice the signal",
        body: "*Minimum something so that it works* → guess the answer and check it.\n\n*Sorted* + *how many* or *where* → bisect. You never need to loop over a sorted array to count.",
      },
      {
        kind: "quiz",
        teach: "In a rotated sorted array, one side of the middle is always sorted. Comparing the middle with the right end tells you which side the minimum is on.",
        prompt: "A sorted array was rotated at an unknown point. Find its smallest value.",
        options: ["Monotonic stack", "Binary search, compare mid with the right end", "Sliding window", "Difference array"],
        answer: 1,
        explain: "Binary search with ok(i) = a[i] <= a[-1], which flips once at the minimum. The signal: \"sorted\" + \"rotated\". A linear scan works too, but the problem expects O(log n).",
      },
      {
        kind: "quiz",
        teach: "\"Make the largest part as small as possible\" is a minimize-the-maximum problem. Guess the limit, then check it greedily.",
        prompt: "Cut an array into k contiguous parts so the largest part sum is as small as possible.",
        options: ["Prefix sum + hash map", "Sliding window", "Difference array", "Binary search on the max part sum + greedy check"],
        answer: 3,
        explain: "Binary search on the max part sum. The check: fill parts greedily, start a new part when the next value would go over the limit, and see whether you used at most k parts. This is LC 410 Split Array Largest Sum, the same code as LC 1011.",
      },
      {
        kind: "read",
        title: "Notice the signal",
        body: "*Minimize the maximum* or *maximize the minimum* → search the answer. The check is almost always a greedy pass.\n\n*Rotated* or *peak* → still binary search; compare the middle with an end.",
      },
      {
        kind: "quiz",
        teach: "Binary search on the answer: pick the quantity asked for, write ok(x) for it, and make sure ok flips once as x grows.",
        prompt: "n machines; machine i makes one item every t_i seconds. Minimum time to make P items.",
        options: ["Binary search on time, check = Σ ⌊T / t_i⌋ ≥ P", "Sort the machines, then two pointers", "Prefix sums over t", "Monotonic deque"],
        answer: 0,
        explain: "Binary search on time T. In T seconds machine i makes ⌊T / t_i⌋ items; ok(T) is \"the total is at least P\", which flips once. This is CSES Factory Machines.",
      },
      {
        kind: "read",
        title: "Type the last two templates",
        body: "You typed `first_true` and Koko in the lesson. Now type `last_true`, which rounds up, and the `bisect` count. Try from memory first.",
      },
      {
        kind: "code",
        title: "Last true",
        prompt: "Write `last_true(lo, hi, ok)`: the last x in [lo, hi] with `ok(x)` true. Assume ok is T..T F..F and `ok(lo)` is true.",
        starter: py("# mirror of first_true; watch the rounding", "def last_true(lo, hi, ok):", "    pass"),
        solution: LAST_TRUE,
        tests: [
          { call: "last_true(0, 4, lambda i: i <= 2)", expect: "2" },
          { call: "last_true(0, 100, lambda x: x * x <= 50)", expect: "7", label: "integer square root" },
          { call: "last_true(2, 3, lambda x: x <= 2)", expect: "2", label: "hi = lo + 1" },
          { call: "last_true(2, 3, lambda x: True)", expect: "3" },
          { call: "last_true(5, 5, lambda x: True)", expect: "5", label: "one value" },
        ],
        teach: "Loop while lo < hi with mid = (lo + hi + 1) // 2. If ok(mid), lo = mid. Else hi = mid − 1. Return lo.",
        explain: "Rounding up keeps mid > lo, so `lo = mid` always moves. The test with lo = 2, hi = 3 would loop forever with rounding down.",
        fromMemory: true,
      },
      {
        kind: "code",
        title: "Count with bisect",
        prompt: "Write `count_in_range(a, L, R)`: how many values of the sorted list `a` lie in [L, R].",
        starter: py("from bisect import bisect_left, bisect_right", "", "def count_in_range(a, L, R):", "    pass"),
        solution: COUNT_IN_RANGE,
        tests: [
          { call: "count_in_range([1, 3, 3, 3, 5, 8], 3, 3)", expect: "3" },
          { call: "count_in_range([1, 3, 3, 3, 5, 8], 2, 6)", expect: "4" },
          { call: "count_in_range([1, 3, 3, 3, 5, 8], 9, 20)", expect: "0", label: "none" },
          { call: "count_in_range([2, 2, 2], 2, 2)", expect: "3", label: "all equal" },
          { call: "count_in_range([], 0, 10)", expect: "0", label: "empty" },
        ],
        teach: "bisect_right(a, R) is the first index after the values ≤ R. bisect_left(a, L) is the first index of a value ≥ L. The count is the difference.",
        explain: "LC 34 is the same two boundaries: first position = bisect_left(a, x), last position = bisect_right(a, x) − 1, when x is present.",
      },
      {
        kind: "practice",
        title: "Today's problems",
        intro: LIST_INTRO + " Finished early? LC 410 Split Array Largest Sum is the same code as LC 1011: add it to the Day 7 list.",
        problems: [
          { ref: "LC 704 Binary Search", tier: "warm", lvl: "E", box: 10, clue: "Type template 1 with ok = a[mid] >= target, then check equality" },
          { ref: "LC 34 Find First and Last Position of Element in Sorted Array", tier: "core", lvl: "M", box: 20, clue: "Two boundaries → bisect_left and bisect_right (write both by hand once)" },
          { ref: "LC 153 Find Minimum in Rotated Sorted Array", tier: "core", lvl: "M", box: 20, clue: "ok(i) = a[i] <= a[-1] flips once → first true" },
          { ref: "LC 33 Search in Rotated Sorted Array", tier: "core", lvl: "M", box: 25, clue: "One half is sorted; is the target inside it?" },
          { ref: "LC 875 Koko Eating Bananas", tier: "core", lvl: "M", box: 20, clue: "\"Minimum speed so that it works\" → search on k" },
          { ref: "LC 1011 Capacity To Ship Packages Within D Days", tier: "core", lvl: "M", box: 20, clue: "lo = max(w), hi = sum(w), greedy check counts days" },
          { ref: "CSES — Factory Machines", tier: "stretch", lvl: "CSES", box: 20, clue: "\"Minimum time to make t products\" → search on time; hi = min(k) * t; break the sum early once it reaches t", url: "https://cses.fi/problemset/task/1620" },
          { ref: "Codeforces problemset, rating 1000–1200, tag binary search, solve 1–2", tier: "stretch", lvl: "1000–1200", box: 30, clue: "Write ok(x) in words before coding" },
        ],
      },
      {
        kind: "reveal",
        prompt: "End-of-day check 1. What property must ok(x) have for binary search on the answer to be correct?",
        answer: "It must be [[monotone|monotonicity]]: it flips exactly once as x grows (false, ..., false, true, ..., true, or the reverse). Then checking one middle value tells you which half holds the answer. And the end of the range you start from must be surely true.",
      },
      {
        kind: "reveal",
        prompt: "End-of-day check 2. Why does last_true need (lo + hi + 1) // 2?",
        answer: "In last_true a true check sets lo = mid. With hi = lo + 1, rounding down gives mid = lo, so lo = mid changes nothing and the loop runs forever. Rounding up gives mid = hi, so the range always shrinks.",
      },
      {
        kind: "reveal",
        prompt: "End-of-day check 3. In LC 1011, why is lo = max(weights) and not 1?",
        answer: "A package cannot be split, so any capacity below the heaviest package can never ship it: those values are impossible. The smallest capacity that could work is max(weights). Starting there also keeps the greedy check simple, since every package fits in an empty day.",
      },
      {
        kind: "summary",
        points: [
          "Minimum X so that it works → binary search on the answer with a check that flips once.",
          "Minimize the max / maximize the min → search the answer + greedy check.",
          "Sorted + count or boundary → bisect_left / bisect_right.",
          "Rotated or peak → binary search, compare the middle with an end.",
          "Log 1 mistake and add 3 cards. Record it in the Tracker (#tracker) and drill the cards in the Gym (#gym).",
        ],
      },
    ],
  },

  /* ================================================================ */
  /* Day 7 A                                                           */
  /* ================================================================ */
  {
    id: "ch04-l15",
    day: 7,
    title: "Day 7: Review, Recognition Test #1 and Contest #1",
    goal: "Re-solve the week's core problems cold, score Recognition Test #1 against your Day 0 baseline, and finish your first live contest.",
    minutes: 10,
    steps: [
      {
        kind: "read",
        title: "The first test of the week",
        body: "Six days, six tools. Today checks whether they stuck: a recognition test, a timed re-solve from a blank file, and your first live contest.\n\nNo new idea today. The skill you train is **recall under a clock**.\n\n**Goal:** re-solve the week's core problems cold, score Recognition Test #1 against your Day 0 baseline, and finish your first live contest.",
      },
      {
        kind: "read",
        title: "The whole week in six lines",
        body: "Read each line, then say the tool out loud without looking. These six lines are the week's 15-second clues.",
        callout: {
          type: "clue",
          text: "- Constraints first: n → target complexity → shortlist of tools.\n- \"Seen it?\" / \"partner\" / \"group by\" → hash map or set.\n- Sorted (or sortable) + pairs → two pointers.\n- Contiguous + longest/shortest/at most, positives → sliding window. Negatives → prefix sum + hash map.\n- \"Next greater/smaller\", \"every window max\" → monotonic stack or deque.\n- \"Minimum X such that it works\" → binary search on the answer.",
        },
      },
      {
        kind: "read",
        title: "Today's plan",
        body: "The morning block is your normal 3 hours, reorganized. The contest comes in the evening.",
        visual: {
          kind: "table",
          headers: ["Time", "Task"],
          rows: [
            ["0:00–0:20", "Recognition Test #1"],
            ["0:20–2:30", "Mixed re-solve list, timed, no notes"],
            ["2:30–3:00", "Log scores, update the Tracker, rest"],
            ["Evening", "LeetCode Weekly Contest (Contest #1), 90 min"],
          ],
        },
      },
      {
        kind: "read",
        title: "Why re-solve?",
        body: "Solving a problem once with fresh notes in front of you proves little. Solving it four days later, mixed in with other topics, from a blank file, is the real test. If you cannot, you did not learn it yet.\n\nThe re-solve problems are **shuffled on purpose**, so the topic does not give away the pattern.",
      },
      {
        kind: "quiz",
        teach: "A re-solve tests recall without help: days later, from a blank file, with topics mixed so you must find the pattern yourself.",
        prompt: "Why is the re-solve list shuffled instead of grouped by day?",
        options: [
          "So the topic does not give away the pattern",
          "So the easy problems come first",
          "So you can copy your old code faster",
        ],
        answer: 0,
        explain: "In a contest no one tells you \"this is a stack problem\". Shuffling forces you to recognize the pattern from the statement, which is the skill you are training.",
      },
      {
        kind: "read",
        title: "Recognition Test #1",
        body: "Draw 30 cards from the Week 1 topics only: hashing, two pointers, sliding window, prefix sums, stack and monotonic structures, binary search. Pick the cards you have drawn **least** in the daily warm-ups. The Gym (#gym) holds the cards.\n\nSame rules as Day 0: **15 seconds** each, say the pattern out loud, **no half credit**.",
      },
      {
        kind: "widget",
        widget: "triage",
        title: "Warm up the scan",
        task: "Before the test, run the 15-second scan on a few Week 1 cards: budget from n, what it returns, input shape, trigger phrase. Name the pattern before the timer ends.",
        props: { mode: "cards", upToDay: 7 },
      },
      {
        kind: "read",
        title: "Score it and learn from the misses",
        body: "- Write the score next to your Day 0 baseline in the Tracker (#tracker).\n- Target: **15 out of 20 or better** (75%). Below 12 out of 20 (60%) means the drills are not sticking: next week, do the recognition warm-up out loud and add cards for every miss.\n- Every missed card becomes a [[mistake journal]] line: *what clue I missed*.",
      },
      {
        kind: "read",
        title: "Templates from a blank file",
        body: "No new template today. Before the re-solve list, open a blank file and type all of these from memory. Then compare with the week's lessons.\n\nAny template you got wrong goes on top of tomorrow's warm-up.",
        visual: {
          kind: "table",
          headers: ["Day", "Templates"],
          rows: [
            ["Day 1", "two_sum"],
            ["Day 2", "three_sum with duplicate skips"],
            ["Day 3", "longest_window and count_at_most"],
            ["Day 4", "count_sum_k and apply_updates"],
            ["Day 5", "next_greater and window_max"],
            ["Day 6", "first_true and last_true"],
          ],
        },
      },
      {
        kind: "code",
        title: "Blank file: Days 4 to 6",
        prompt: "From memory, in one file, write the six templates from Days 4 to 6: `count_sum_k`, `apply_updates`, `next_greater`, `window_max`, `first_true` and `last_true`. Each test checks one of them. (Type the Day 1–3 templates in their own lessons.)",
        starter: py(
          "from itertools import accumulate",
          "from collections import defaultdict, deque",
          "",
          "# count_sum_k(nums, k)",
          "# apply_updates(n, updates)",
          "# next_greater(a)",
          "# window_max(a, k)",
          "# first_true(lo, hi, ok)",
          "# last_true(lo, hi, ok)",
        ),
        solution: py(COUNT_SUM_K, "", APPLY_UPDATES, "", NEXT_GREATER, "", WINDOW_MAX, "", FIRST_TRUE, "", LAST_TRUE),
        tests: [
          { call: "count_sum_k([1, -1, 0], 0)", expect: "3", label: "count_sum_k" },
          { call: "apply_updates(5, [(1, 3, 2), (0, 2, 1)])", expect: "[1, 3, 3, 2, 0]", label: "apply_updates" },
          { call: "next_greater([2, 1, 5, 3, 4])", expect: "[2, 2, -1, 4, -1]", label: "next_greater" },
          { call: "window_max([1, 3, -1, -3, 5], 3)", expect: "[3, 3, 5]", label: "window_max" },
          { call: "first_true(0, 10, lambda x: x * x >= 50)", expect: "8", label: "first_true" },
          { call: "last_true(0, 100, lambda x: x * x <= 50)", expect: "7", label: "last_true" },
        ],
        teach: "Prefix counts start at {0: 1}. diff[l] += v, diff[r + 1] −= v. Stacks and deques hold indexes with decreasing values. first_true rounds down; last_true rounds up.",
        explain: "If any test failed, that template goes on top of tomorrow's warm-up.",
        fromMemory: true,
      },
      {
        kind: "read",
        title: "Contest #1: LeetCode Weekly",
        body: "Tonight you take your first live contest: the LeetCode Weekly. It is 90 minutes and usually 4 problems, roughly easy, medium, medium, hard.\n\nCheck **leetcode.com/contest** for the exact start time in your time zone, and register earlier in the day.",
      },
      {
        kind: "read",
        title: "Before the contest (10 minutes)",
        body: "- Close every AI tool and browser tab you do not need. This contest counts.\n- Open a blank editor with your Week 1 templates in a scratch file, *for reading only if you get stuck*, not for pasting.",
        callout: { type: "trap", text: "LeetCode runs [[CPython]], so use the 10^7 operations per second budget, not PyPy's 10^8." },
      },
      {
        kind: "read",
        title: "During the contest",
        body: "Chapter 10 has the full in-contest routine and stuck protocol. The short version:\n\n- Read the constraints of each problem first and write the target complexity.\n- Solve in order. If a problem gives you nothing in 15 minutes, read the next one.\n- A wrong answer costs a time [[penalty]]. Before submitting, run your own [[edge cases|edge case]]: n = 1, all equal, negatives, maximum n.",
      },
      {
        kind: "quiz",
        teach: "The contest routine: constraints first, solve in order, and do not sit on a problem that gives you nothing for 15 minutes.",
        prompt: "15 minutes into Q2 you still have no idea at all. What does the routine say?",
        options: [
          "Keep going until it works, however long it takes",
          "Read the next problem",
          "Submit a guess to see what the judge says",
        ],
        answer: 1,
        explain: "Read the next problem. Q3 may suit you better, and a fresh look at Q2 later often helps. Guess submissions cost a time penalty for each wrong answer.",
      },
      {
        kind: "read",
        title: "An honest target",
        body: "**Solve Q1 and Q2.** Q3 is a bonus. Do not expect Q4.\n\nThis is your first live contest after six days of topics. Finishing it, under real time pressure, is the win. The rating comes later.",
      },
      {
        kind: "read",
        title: "After the contest (10 minutes, then stop)",
        body: "- In the Tracker (#tracker), write: problems solved, minutes for each, wrong submissions, rank.\n- For each unsolved problem, write one line: *where I got stuck*. Use one of four labels: **no idea**, **wrong idea**, **right idea but bug**, **ran out of time**.\n- **Do not read solutions tonight.** You will upsolve with a fresh head.",
      },
      {
        kind: "quiz",
        teach: "Each unsolved problem gets one of four labels: no idea, wrong idea, right idea but bug, or ran out of time. Pick the first place things went wrong.",
        prompt: "You had the right approach for Q3, but an off-by-one error made it fail, and you never found it before time ran out. Which label fits best?",
        options: ["No idea", "Wrong idea", "Right idea but bug", "Ran out of time"],
        answer: 2,
        explain: "Right idea but bug. The approach was correct; the code was not. The label tells you what to train: edge-case tests and template accuracy, not recognition.",
      },
      {
        kind: "read",
        title: "How to upsolve tomorrow morning",
        body: "Day 8 opens with 45 minutes of **upsolving**: solving, after the contest, the problems you missed. For each unsolved problem, in order:\n\n1. **10 minutes fresh**, new file, no hints.\n2. **One hint only**: the first lines of the editorial or a top post. Close it.\n3. **Code it yourself** from that hint. Do not copy code.\n4. **Still stuck after 15 more minutes?** Read the full solution, close it, type it from memory.\n5. **Write the card**: the problem in disguise → the pattern. Log the miss.",
      },
      {
        kind: "order",
        teach: "Upsolving goes from the least help to the most: try alone, then one hint, then code it yourself, then the full solution if needed, and always end with a card.",
        prompt: "Put the upsolve steps in order.",
        items: [
          "10-minute fresh attempt, no hints",
          "Read one hint only, then close it",
          "Code it yourself from that hint",
          "If still stuck after 15 more minutes, read the full solution, close it, type it from memory",
          "Write the card and log the miss",
        ],
        explain: "Least help first. Sleep often unlocks the problem in the first 10 minutes, and each step adds only as much help as you need. If you solved everything, upsolve the next problem up (Q3 or Q4) the same way.",
      },
      {
        kind: "summary",
        points: [
          "Morning: Recognition Test #1 (30 Week 1 cards, 15 s each, no half credit), then the mixed re-solve from a blank file.",
          "Type every Week 1 template from memory first; wrong ones go on top of tomorrow's warm-up.",
          "Contest #1: constraints first, solve in order, move on after 15 empty minutes, test edge cases before submitting. Target Q1 and Q2.",
          "After: log solved, minutes, wrong submissions, rank; one \"where I got stuck\" line per miss. No solutions tonight.",
          "Tomorrow: 45 minutes of upsolving, least help first, ending with a card.",
        ],
      },
    ],
  },

  /* ================================================================ */
  /* Day 7 B                                                           */
  /* ================================================================ */
  {
    id: "ch04-l16",
    day: 7,
    title: "Day 7 drill: the week mixed up",
    goal: "Name the right Week 1 tool for mixed disguised problems, run the timed re-solve list, and answer the review-day checks.",
    minutes: 10,
    steps: [
      {
        kind: "read",
        title: "Mixed on purpose",
        body: "Today's drill mixes all six Week 1 tools, the way a contest does. Then comes the re-solve list.\n\nThe re-solve rules: **blank file, no notes, no looking at your old code.** If you fail a box, read your old solution, close it, and type it again from memory.",
        visual: {
          kind: "compare",
          left: { title: "Not a re-solve", points: ["Old code open", "Same topic as yesterday", "Notes in front of you"] },
          right: { title: "A real re-solve", points: ["Blank file", "Topics shuffled", "Time box, no notes"] },
        },
      },
      {
        kind: "quiz",
        teach: "Negative values break a sliding window, because extending it can make the sum smaller. Counting subarrays with an exact sum then needs prefix sums and a map.",
        prompt: "n ≤ 2·10^5 integers, possibly negative. Count subarrays whose sum equals T.",
        options: ["Sliding window", "Prefix sum + count map", "Two pointers on the sorted array", "Binary search on the answer"],
        answer: 1,
        explain: "Prefix sum + count map, starting with {0: 1}. The signal: \"count subarrays\" + \"possibly negative\". Negatives rule out the window, and sorting would break contiguity.",
      },
      {
        kind: "quiz",
        teach: "On a sorted array, a pair with a target sum can be found by moving two pointers inward from both ends.",
        prompt: "A sorted array of heights. Find two people whose heights add to exactly H.",
        options: ["Monotonic stack", "Prefix sum + count map", "Sliding window", "Two pointers from both ends"],
        answer: 3,
        explain: "Two pointers from both ends. The signal: sorted + a pair + an exact sum. Too small → move the left pointer right; too big → move the right pointer left.",
      },
      {
        kind: "read",
        title: "Notice the signal",
        body: "*Subarray* + *negatives* → prefix sums + map. *Sorted* + *pair* → two pointers.\n\nThe words \"subarray\" and \"pair\" already split the week in half: contiguous pieces versus two chosen elements.",
      },
      {
        kind: "quiz",
        teach: "\"The nearest earlier element that beats me\", for every position, is what a monotonic stack answers in one pass.",
        prompt: "For every position, find the nearest earlier position with a strictly smaller value.",
        options: ["Monotonic stack (previous smaller)", "Monotonic deque", "Binary search", "Hash map"],
        answer: 0,
        explain: "Monotonic stack, previous smaller. After popping everything ≥ x, the top is the nearest earlier smaller value. CSES Nearest Smaller Values is exactly this.",
      },
      {
        kind: "quiz",
        teach: "\"Minimum X such that it works\" with a check that flips once is binary search on the answer.",
        prompt: "Pick the minimum daily budget such that you can cover all expenses, in order, within D days.",
        options: ["Prefix sums", "Sliding window", "Binary search on the budget + greedy day count", "Monotonic stack"],
        answer: 2,
        explain: "Binary search on the budget with a greedy day count, the same shape as LC 1011. The signal: \"minimum budget\" + \"within D days\" + \"in order\".",
      },
      {
        kind: "read",
        title: "Notice the signal",
        body: "*For every position, nearest ... smaller/greater* → monotonic stack.\n\n*Minimum something so that it works* → binary search on the answer with a greedy check.",
      },
      {
        kind: "quiz",
        teach: "A sliding window fits contiguous pieces with \"longest\" and \"at most\" when growing the window can only make it less valid.",
        prompt: "A string of lowercase letters. Find the longest substring with at most k distinct letters.",
        options: ["Prefix sum + first-index map", "Sliding window, longest valid", "Binary search on the length", "Monotonic deque"],
        answer: 1,
        explain: "Sliding window, longest valid, at most k distinct. The signal: substring + longest + \"at most\". Grow the right edge, shrink the left while there are more than k distinct letters.",
      },
      {
        kind: "practice",
        title: "The timed re-solve",
        intro: "Blank file, no notes, no AI, no looking at your old code. If you fail a box, read your old solution, close it, and type it again from memory. Plus: any stretch row you skipped this week, and any problem in your mistake journal from Days 1–6. If time runs out, those move to the Day 8 warm-up, not to \"later\".",
        problems: [
          { ref: "LC 33 Search in Rotated Sorted Array", tier: "core", lvl: "M", box: 20, clue: "One half always sorted" },
          { ref: "LC 560 Subarray Sum Equals K", tier: "core", lvl: "M", box: 15, clue: "Negatives → prefix + count map, {0: 1}" },
          { ref: "LC 128 Longest Consecutive Sequence", tier: "core", lvl: "M", box: 15, clue: "Set, start only at run heads" },
          { ref: "LC 424 Longest Repeating Character Replacement", tier: "core", lvl: "M", box: 20, clue: "length − max_count ≤ k" },
          { ref: "LC 15 3Sum", tier: "core", lvl: "M", box: 20, clue: "Sort, fix one, skip duplicates after a match" },
          { ref: "LC 739 Daily Temperatures", tier: "core", lvl: "M", box: 15, clue: "Next greater, store distance" },
          { ref: "LC 1011 Capacity To Ship Packages Within D Days", tier: "core", lvl: "M", box: 15, clue: "Search on capacity, greedy day count" },
          { ref: "LC 84 Largest Rectangle in Histogram", tier: "core", lvl: "H", box: 25, clue: "Previous and next smaller" },
        ],
      },
      {
        kind: "reveal",
        prompt: "End-of-day check 1. What was your Recognition Test #1 score, and how does it compare with Day 0?",
        answer: "Write both numbers side by side in the Tracker (#tracker). The target is 15 out of 20 (75%) or better. Below 12 out of 20 (60%), do next week's recognition warm-up out loud and add a card for every miss. Each missed card also gets a mistake-journal line: what clue I missed.",
      },
      {
        kind: "reveal",
        prompt: "End-of-day check 2. Which of the eight re-solve problems failed its box, and which clue did you miss?",
        answer: "For each failed row, write the clue from the table next to the clue you actually noticed (or \"none\"). The gap between them is the mistake-journal line. Those problems go to the Day 8 warm-up, not to \"later\".",
      },
      {
        kind: "reveal",
        prompt: "End-of-day check 3. In the contest, for each unsolved problem: was it \"no idea\", \"wrong idea\", \"bug\", or \"time\"?",
        answer: "Pick exactly one label per problem. \"No idea\" and \"wrong idea\" mean recognition: add cards. \"Bug\" means template accuracy and edge-case tests. \"Time\" means speed: more timed re-solves. Do not read solutions tonight; the upsolve is tomorrow.",
      },
      {
        kind: "summary",
        points: [
          "Subarray + negatives → prefix + map. Sorted + pair → two pointers.",
          "Nearest smaller/greater for every position → monotonic stack.",
          "Minimum X so that it works → binary search on the answer. Longest with at most k → sliding window.",
          "Log 1 mistake and add 3 cards. Record scores in the Tracker (#tracker) and drill the cards in the Gym (#gym).",
          "Set an alarm: tomorrow's first 45 minutes are the upsolve.",
        ],
      },
    ],
  },
];

export default lessons;
