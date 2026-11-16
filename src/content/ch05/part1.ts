import type { Lesson, ArrayRow, Tone, Visual } from "../types";

/* Chapter 5, part 1: the Week 2 intro and Days 8-11 (lessons ch05-l1 ... ch05-l8). */

/* ---------- helpers ---------- */

/** Python source, one string per line. */
const py = (...lines: string[]) => lines.join("\n");
const codeV = (code: string, caption?: string): Visual => ({ kind: "code", lang: "python", code, caption });
const range = (n: number) => Array.from({ length: n }, (_, i) => i);

/** One interval on a timeline 0..T. Covered cells show the time; the rest are blank. */
const iv = (s: number, e: number, T: number, tone?: Tone, note?: string): ArrayRow => {
  const tones: Record<number, Tone> = {};
  if (tone) for (let t = s; t <= e; t++) tones[t] = tone;
  return {
    label: "[" + s + "," + e + "]" + (note ? " " + note : ""),
    items: range(T + 1).map((t) => (t >= s && t <= e ? t : "")),
    tones,
  };
};
/** Several blocks on one timeline row, e.g. a merged output. */
const blocks = (label: string, spans: [number, number][], T: number, tone: Tone): ArrayRow => {
  const inside = (t: number) => spans.some(([s, e]) => t >= s && t <= e);
  const tones: Record<number, Tone> = {};
  range(T + 1).forEach((t) => { if (inside(t)) tones[t] = tone; });
  return { label, items: range(T + 1).map((t) => (inside(t) ? t : "")), tones };
};
/** A timeline visual: a "time" row, then one row per interval. */
const timeline = (T: number, rows: ArrayRow[], caption: string, ptr?: { at: number; label: string }): Visual => ({
  kind: "array",
  rows: [{ label: "time", items: range(T + 1), pointers: ptr ? [{ ...ptr, tone: "accent" }] : undefined }, ...rows],
  caption,
});
const arr = (rows: ArrayRow[], caption?: string, indices?: boolean): Visual => ({ kind: "array", rows, caption, indices });
const tree = (nodes: (number | string | null)[], tones?: Record<number, Tone>, notes?: Record<number, string>, caption?: string): Visual =>
  ({ kind: "tree", nodes, tones, notes, caption });

/* ---------- shared Python ---------- */

const TREE_HEAD = py(
  "from collections import deque",
  "",
  "class TreeNode:",
  "    def __init__(self, val=0, left=None, right=None):",
  "        self.val = val",
  "        self.left = left",
  "        self.right = right",
  "",
  "def build(vals):",
  "    # level-order list -> tree (None = missing child). Used by the tests.",
  "    if not vals or vals[0] is None:",
  "        return None",
  "    root = TreeNode(vals[0])",
  "    q, i = deque([root]), 1",
  "    while q and i < len(vals):",
  "        node = q.popleft()",
  "        if i < len(vals) and vals[i] is not None:",
  "            node.left = TreeNode(vals[i])",
  "            q.append(node.left)",
  "        i += 1",
  "        if i < len(vals) and vals[i] is not None:",
  "            node.right = TreeNode(vals[i])",
  "            q.append(node.right)",
  "        i += 1",
  "    return root",
  "",
);

const MAX_NON_OVERLAP = py(
  "# Max number of non-overlapping intervals. Sort by END.",
  "def max_non_overlapping(intervals):",
  "    intervals.sort(key=lambda iv: iv[1])",
  "    count, last_end = 0, float('-inf')",
  "    for s, e in intervals:",
  "        if s >= last_end:          # use s > last_end if touching counts as overlap",
  "            count += 1",
  "            last_end = e",
  "    return count                   # \"min removals\" = len(intervals) - count",
);
const MERGE = py(
  "# Merge overlapping intervals. Sort by START.",
  "def merge(intervals):",
  "    intervals.sort()",
  "    out = []",
  "    for s, e in intervals:",
  "        if out and s <= out[-1][1]:",
  "            out[-1][1] = max(out[-1][1], e)",
  "        else:",
  "            out.append([s, e])",
  "    return out",
);
const K_LARGEST = py(
  "import heapq",
  "",
  "# Top-k largest: min-heap of size k",
  "def k_largest(nums, k):",
  "    h = []",
  "    for x in nums:",
  "        heapq.heappush(h, x)",
  "        if len(h) > k:",
  "            heapq.heappop(h)",
  "    return h                      # h[0] is the k-th largest",
);
const MEDIAN = py(
  "import heapq",
  "",
  "# Two heaps: running median",
  "class Median:",
  "    def __init__(self):",
  "        self.lo = []              # max-heap via negation (lower half)",
  "        self.hi = []              # min-heap (upper half)",
  "    def add(self, x):",
  "        heapq.heappush(self.lo, -x)",
  "        heapq.heappush(self.hi, -heapq.heappop(self.lo))   # move lo's max up",
  "        if len(self.hi) > len(self.lo):",
  "            heapq.heappush(self.lo, -heapq.heappop(self.hi))",
  "    def median(self):",
  "        if len(self.lo) > len(self.hi):",
  "            return -self.lo[0]",
  "        return (-self.lo[0] + self.hi[0]) / 2",
);
const MIN_ROOMS = py(
  "import heapq",
  "",
  "# Heap + sweep: minimum rooms so no two meetings in a room overlap.",
  "# Half-open [s, e): a room that frees at time e can take a meeting starting at e.",
  "def min_rooms(intervals):",
  "    intervals.sort()",
  "    ends = []                     # end times of rooms in use",
  "    for s, e in intervals:",
  "        if ends and ends[0] <= s:",
  "            heapq.heapreplace(ends, e)    # reuse the room that frees first",
  "        else:",
  "            heapq.heappush(ends, e)",
  "    return len(ends)",
);
const SUBSETS = py(
  "import sys",
  "sys.setrecursionlimit(10**6)      # harmless here; required habit for Days 11-13",
  "",
  "# Subsets: take / skip",
  "def subsets(nums):",
  "    res, path = [], []",
  "    def dfs(i):",
  "        if i == len(nums):",
  "            res.append(path[:])   # copy! path keeps changing",
  "            return",
  "        path.append(nums[i])      # choose",
  "        dfs(i + 1)                # recurse",
  "        path.pop()                # undo",
  "        dfs(i + 1)                # skip",
  "    dfs(0)",
  "    return res",
);
const COMBO = py(
  "# Combinations with a start index + duplicate skipping (input sorted)",
  "def combo_sum_unique(cands, target):",
  "    cands.sort()",
  "    res, path = [], []",
  "    def dfs(start, remain):",
  "        if remain == 0:",
  "            res.append(path[:])",
  "            return",
  "        for j in range(start, len(cands)):",
  "            if j > start and cands[j] == cands[j - 1]:",
  "                continue          # same value at same depth = duplicate branch",
  "            if cands[j] > remain:",
  "                break             # sorted, so everything after is too big",
  "            path.append(cands[j])",
  "            dfs(j + 1, remain - cands[j])   # j + 1: each item used once",
  "            path.pop()",
  "    dfs(0, target)",
  "    return res",
);
const PERMUTE = py(
  "# Permutations with a used[] array",
  "def permute(nums):",
  "    res, path, used = [], [], [False] * len(nums)",
  "    def dfs():",
  "        if len(path) == len(nums):",
  "            res.append(path[:])",
  "            return",
  "        for i, x in enumerate(nums):",
  "            if used[i]:",
  "                continue",
  "            used[i] = True",
  "            path.append(x)",
  "            dfs()",
  "            path.pop()",
  "            used[i] = False",
  "    dfs()",
  "    return res",
);
const DIAMETER = py(
  "# Recursive: DFS returns a value + global best (diameter)",
  "def diameter(root):",
  "    best = 0",
  "    def height(node):",
  "        nonlocal best",
  "        if not node:",
  "            return 0",
  "        l, r = height(node.left), height(node.right)",
  "        best = max(best, l + r)        # path through this node (edges)",
  "        return 1 + max(l, r)           # parent can extend only one side",
  "    height(root)",
  "    return best",
);
const LEVELS = py(
  "# BFS by levels",
  "def levels(root):",
  "    out, q = [], deque([root] if root else [])",
  "    while q:",
  "        row = []",
  "        for _ in range(len(q)):        # exactly this level",
  "            node = q.popleft()",
  "            row.append(node.val)",
  "            if node.left:  q.append(node.left)",
  "            if node.right: q.append(node.right)",
  "        out.append(row)",
  "    return out",
);
const HEIGHT_ITER = py(
  "# Iterative post-order, binary tree: (node, done) flag. Height of every node.",
  "def height_iter(root):",
  "    h = {None: 0}",
  "    stack = [(root, False)] if root else []",
  "    while stack:",
  "        node, done = stack.pop()",
  "        if done:                       # children already computed",
  "            h[node] = 1 + max(h[node.left], h[node.right])",
  "        else:",
  "            stack.append((node, True)) # come back after children",
  "            if node.left:  stack.append((node.left, False))",
  "            if node.right: stack.append((node.right, False))",
  "    return h.get(root, 0)",
);
const SUBTREE_SIZES = py(
  "# Iterative post-order, tree as edges (n up to 2e5): DFS order, then reverse.",
  "def subtree_sizes(n, adj, root=0):",
  "    parent = [-1] * n",
  "    seen = [False] * n",
  "    seen[root] = True",
  "    order, stack = [], [root]",
  "    while stack:",
  "        u = stack.pop()",
  "        order.append(u)                # parent is always before its children",
  "        for v in adj[u]:",
  "            if not seen[v]:",
  "                seen[v] = True",
  "                parent[v] = u",
  "                stack.append(v)",
  "    size = [1] * n",
  "    for u in reversed(order):          # children before parents = post-order",
  "        if parent[u] != -1:",
  "            size[parent[u]] += size[u]",
  "    return size",
);

/* ---------- shared drill text ---------- */
const PRACTICE_RULES =
  "Work the rows in order. Start a timer for each box and stop when it rings: never extend a box. No AI while solving. A stretch row you don't finish goes on the [[re-solve list|re-solve queue]] for Day 14.";
const SUMMARY_END = "Log 1 mistake and add 3 cards. Then mark the day on the Tracker and review your cards in the Gym.";

/* ---------- Day 8 timeline pictures ---------- */
const D8 = { a: [1, 3], b: [2, 5], c: [4, 6], d: [6, 8], e: [0, 9] } as const;
const d8 = (tones: Partial<Record<keyof typeof D8, Tone>>, caption: string, ptr?: { at: number; label: string }) =>
  timeline(9, (Object.keys(D8) as (keyof typeof D8)[]).map((k) => iv(D8[k][0], D8[k][1], 9, tones[k] ?? "neutral")), caption, ptr);

/* ---------- Day 10 subsets tree: [] / take 1 / skip 1 / then take or skip 2 ---------- */
const SUB_TREE = ["[ ]", "[1]", "[ ]", "[1,2]", "[1]", "[2]", "[ ]"];

/* ---------- Day 11 trees ---------- */
const T1 = [3, 9, 20, null, null, 15, 7];
const T_DIAM = [1, 2, 3, 4, 5];

const lessons: Lesson[] = [
  /* =====================================================================
     Day 8 A: greedy + intervals
     ===================================================================== */
  {
    id: "ch05-l1",
    day: 8,
    title: "Day 8: Greedy and intervals",
    goal: "Prove a greedy rule with an exchange argument, or break it with a tiny counterexample, and write the two interval templates.",
    minutes: 12,
    steps: [
      {
        kind: "read",
        title: "Week 2 starts here",
        body: "Week 1 gave you the array tools. This week covers the topics behind most LeetCode mediums and Codeforces B–C problems: greedy choices, heaps, exhaustive search, trees and graphs.\n\nTwo new habits start now:\n- **Prove or break every greedy before you code it.**\n- **Assume Python recursion will crash on deep input.** When depth can reach 10^5, use an explicit stack.\n\nBy Day 14 you should write five templates from memory: grid BFS, [[iterative DFS]], [[union-find]], [[topological sort]] and [[Dijkstra]].",
        visual: {
          kind: "stats",
          items: [
            { value: "8–11", label: "Greedy, heaps, backtracking, trees", note: "this part" },
            { value: "12–13", label: "Graphs, topological sort, union-find" },
            { value: "14", label: "Dijkstra + Contest #2", note: "compare with Day 7" },
          ],
        },
      },
      {
        kind: "read",
        title: "Before the block: upsolve Contest #1",
        body: "Day 8 opens with **45 minutes of [[upsolving|upsolve]]**: going back to contest problems you didn't solve.\n\nFor each one: try it without the editorial (20-minute cap), then read the editorial, then write it again from scratch. Log each in the contest log and the re-solve queue. If you only have 3 hours today, drop the stretch problems, not the upsolve.\n\n**Goal of the day:** prove a greedy rule correct with an exchange argument, or kill it with a 3-case counterexample, before typing any code.",
      },
      {
        kind: "quiz",
        guess: true,
        prompt: "Coins are 1, 3 and 4. You must pay 6 with as few coins as possible. Rule: always take the largest coin that fits. Does that rule give the fewest coins?",
        options: ["Yes, largest-first is always best", "No, there is a better answer"],
        answer: 1,
        explain: "Largest-first takes 4, then 1, then 1: 3 coins. But 3 + 3 = 6 uses only 2 coins. The \"obvious\" choice blocked a better one. That is exactly the danger with greedy rules, and it is why this problem needs DP (Day 17).",
      },
      {
        kind: "read",
        title: "What greedy means",
        body: "A **[[greedy]] algorithm** makes the choice that looks best right now and never undoes it.\n\nIt's fast: usually sort, then one pass, so O(n log n). But it's often wrong, as the coins just showed.\n\nSo the real skill is not writing the greedy. It is deciding whether a greedy rule is safe **before** you submit. Today you get two tools for that: a proof (the exchange argument) and an attack (the counterexample habit).",
      },
      {
        kind: "read",
        title: "A problem: keep the most intervals",
        body: "An **interval** `[s, e]` is a start time and an end time, like a meeting. Two intervals **overlap** if they share time.\n\nTask: choose as many intervals as possible with no two overlapping. Here touching is fine: `[4,6]` and `[6,8]` can both stay.\n\nThe greedy rule to test: **sort by end time, then take every interval that starts at or after the end of the last one you took.** The five intervals below are already sorted by end.",
        visual: d8({}, "Five intervals, sorted by end. Each row shows the times it covers."),
      },
      {
        kind: "read",
        title: "Step 1: take the one that ends first",
        body: "`[1,3]` ends first. Nothing has been taken yet, so take it.\n\nRemember where it ends: `last_end = 3`. Any later interval must start at 3 or later to fit.\n\nCount = 1.",
        visual: d8({ a: "good" }, "Taken: [1,3]. last_end = 3.", { at: 3, label: "last_end" }),
      },
      {
        kind: "read",
        title: "Step 2: skip what overlaps",
        body: "Next by end is `[2,5]`. It starts at 2, which is before `last_end = 3`. It overlaps `[1,3]`, so skip it.\n\nNotice: we never go back to swap `[1,3]` out. Greedy never undoes a choice.",
        visual: d8({ a: "good", b: "bad" }, "[2,5] starts at 2 < 3: skip.", { at: 3, label: "last_end" }),
      },
      {
        kind: "read",
        title: "Step 3: take what fits",
        body: "`[4,6]` starts at 4, and 4 ≥ 3. Take it. Now `last_end = 6`.\n\n`[6,8]` starts at 6, and 6 ≥ 6. Touching is allowed, so take it. Now `last_end = 8`.\n\nCount = 3.",
        visual: d8({ a: "good", b: "bad", c: "good", d: "good" }, "Taken: [1,3], [4,6], [6,8]. last_end = 8.", { at: 8, label: "last_end" }),
      },
      {
        kind: "read",
        title: "Step 4: done",
        body: "`[0,9]` starts at 0, before 8. Skip it.\n\nAnswer: **3** intervals. One sort and one pass, so O(n log n).\n\nIt worked on this input. But a greedy that works on one example proves nothing. Next: why this rule is always right.",
        visual: d8({ a: "good", b: "bad", c: "good", d: "good", e: "bad" }, "Kept 3: [1,3], [4,6], [6,8]."),
      },
      {
        kind: "read",
        title: "The exchange argument",
        body: "The **[[exchange argument]]** proves a greedy rule safe. In plain English:\n\n1. Take any optimal answer.\n2. Find the first place it differs from what greedy picked.\n3. Swap the optimal answer's choice for greedy's choice.\n4. If the answer stays valid and doesn't get worse, greedy's choice is safe at that step.\n\nRepeat the swap at every step. The optimal answer turns into the greedy answer without ever getting worse. So greedy is optimal.",
      },
      {
        kind: "read",
        title: "The swap, on intervals",
        body: "Greedy takes `a`, the interval that ends first. Suppose an optimal answer starts with a different interval `b`.\n\nSince `a` ends first, `end(a) <= end(b)`. Replace `b` with `a`. Everything else in the optimal answer started after `end(b)`, so it also starts after `end(a)`. Nothing overlaps, and the count is the same.\n\nSo taking `a` is safe. Recurse on what's left.",
        visual: timeline(9, [iv(1, 3, 9, "good", "a (greedy)"), iv(2, 5, 9, "warn", "b (optimal)"), iv(6, 8, 9, "neutral", "rest")], "a ends no later than b, so whatever came after b still fits after a."),
      },
      {
        kind: "quiz",
        teach: "The exchange argument swaps the optimal answer's first interval b for greedy's interval a, and checks that the rest of the answer still fits.",
        prompt: "In the interval proof, why is it safe to replace the optimal answer's first interval b with greedy's a?",
        options: [
          "a ends no later than b, so everything after b also starts after a",
          "a is shorter than b",
          "a starts earlier than b",
          "a and b never overlap",
        ],
        answer: 0,
        explain: "Greedy picks the earliest end, so end(a) <= end(b). The rest of the optimal answer starts after end(b), so it also starts after end(a). Length and start time play no part.",
      },
      {
        kind: "read",
        title: "Order problems: the adjacent swap",
        body: "Some answers are an ordering. Compare two neighbours `x, y`: is `x` then `y` better than `y` then `x`? If you can decide using only `x` and `y`, **sort by that rule**. This is the **adjacent-swap argument**.\n\nExample, LC 179 Largest Number: put `a` before `b` when `a + b > b + a` as strings. In Python, sort with `functools.cmp_to_key`.",
        visual: {
          kind: "compare",
          left: { title: "\"9\" then \"34\"", points: ["\"9\" + \"34\" = \"934\"", "Bigger, so 9 goes first"] },
          right: { title: "\"34\" then \"9\"", points: ["\"34\" + \"9\" = \"349\"", "Smaller"] },
          caption: "The rule only looks at the two neighbours, so you can sort with it.",
        },
      },
      {
        kind: "read",
        title: "The counterexample habit",
        body: "Before you code a greedy, spend 2 minutes hunting for a [[counterexample]]: 3 tiny cases (2–4 elements each). Pick cases where the obvious choice blocks a better one.\n\nRule \"pick the shortest interval first\": `[1,5] [4,7] [6,10]`. The shortest is `[4,7]`, and it overlaps both others. Greedy keeps 1. The best is `[1,5]` and `[6,10]`: 2. The rule is dead.",
        visual: timeline(10, [iv(1, 5, 10, "neutral"), iv(4, 7, 10, "bad", "shortest"), iv(6, 10, 10, "neutral")], "Shortest-first takes [4,7] and blocks both others."),
        callout: { type: "move", text: "For a greedy, the question is not \"does this work on the sample?\" It's \"what is the smallest input where this choice hurts me?\" Look for that input on purpose." },
      },
      {
        kind: "read",
        title: "Which rules survive",
        body: "Rule \"pick the earliest start first\": `[1,10] [2,3] [4,5]`. It takes `[1,10]` and keeps 1. The best is 2. Dead.\n\nRule \"pick the earliest end first\": you can't break it, and the exchange argument proves it.\n\nThe decision: if 3 cases don't break it **and** you can state the swap in one sentence, code it. If you can't do either, write a [[brute force]] for n ≤ 8 and [[stress-test|stress testing]] against it (Chapter 3).",
        visual: timeline(10, [iv(1, 10, 10, "bad", "earliest start"), iv(2, 3, 10, "neutral"), iv(4, 5, 10, "neutral")], "Earliest-start takes [1,10], which covers everything."),
      },
      {
        kind: "number",
        teach: "To test a greedy rule, run it by hand: take the interval the rule likes most, drop everything that overlaps it, repeat. Touching intervals may both stay.",
        prompt: "Intervals `[0,3] [2,4] [3,6]`, touching allowed. Rule: \"pick the shortest interval first\". How many intervals does this rule keep?",
        answer: 1,
        tolerance: 0.4,
        unit: "intervals",
        explain: "Shortest is `[2,4]` (length 2). It overlaps `[0,3]` (2 < 3) and `[3,6]` (3 < 4), so both go. The rule keeps 1. The best is `[0,3]` and `[3,6]`, which touch: 2. Another counterexample.",
      },
      {
        kind: "read",
        title: "15-second clues: intervals",
        body: "Two interval questions look alike but need different sorts.\n\n- \"Minimum number of X to cover / remove / attend all\" + intervals → sort by **end**, take greedily.\n- \"Merge overlapping\" → sort by **start**, extend the last block.",
        callout: { type: "clue", text: "Intervals + \"keep / remove / cover\" → sort by end. Intervals + \"merge\" → sort by start." },
      },
      {
        kind: "read",
        title: "15-second clues: reach and cut",
        body: "- \"Can you reach the end\", \"minimum jumps\" → track the **farthest reach** so far. At index `i`, reach = `max(reach, i + a[i])`. If `i` ever passes reach, you're stuck.\n- \"Split into as many pieces as possible\" (LC 763 Partition Labels) → record each letter's last index. Walk the string, keep `farthest` = the largest last index seen. When `i == farthest`, cut.",
        visual: arr([{ label: "a", items: [2, 3, 1, 1, 4], pointers: [{ at: 1, label: "i" }, { at: 4, label: "reach", tone: "good" }] }], "a = [2, 3, 1, 1, 4]: at i = 1, reach = 1 + 3 = 4, the last index. Reachable.", true),
        callout: { type: "clue", text: "\"Reach the end\" → farthest reach so far. \"Pieces where each letter stays in one piece\" → last index, cut when i == farthest." },
      },
      {
        kind: "read",
        title: "15-second clues: sort and pair",
        body: "- \"Assign the smallest that fits\", \"match pairs\" → sort both sides, then two pointers (LC 455 Assign Cookies).\n- \"Arrange to make the biggest / smallest\" → sort with a custom comparison (the adjacent swap).\n- n up to 2·10^5 and no obvious DP state → the answer is probably sort + one pass.",
        callout: { type: "clue", text: "Big n, no DP state in sight → sort, then one greedy pass." },
      },
      {
        kind: "read",
        title: "Template 1: select (sort by end)",
        body: "Line by line:\n- Sort by end.\n- `last_end` starts at minus infinity, so the first interval always fits.\n- Take an interval when `s >= last_end`, then move `last_end` to its end.\n\nMental test on the five intervals: takes `[1,3]`, skips `[2,5]`, takes `[4,6]` and `[6,8]`, skips `[0,9]`. Returns 3. Correct.\n\n\"Minimum removals\" (LC 435) is just `len(intervals) - count`.",
        visual: codeV(MAX_NON_OVERLAP),
      },
      {
        kind: "code",
        title: "Now type it yourself",
        prompt: "Write `max_non_overlapping(intervals)` from memory. Return the largest number of intervals you can keep with no overlaps. Touching intervals like `[1,2]` and `[2,3]` may both stay.",
        starter: py(
          "# Max number of non-overlapping intervals.",
          "# 1. sort by end   2. last_end = -inf   3. take if s >= last_end",
          "def max_non_overlapping(intervals):",
          "    pass",
        ),
        solution: MAX_NON_OVERLAP,
        tests: [
          { call: "max_non_overlapping([[1, 3], [2, 5], [4, 6], [6, 8], [0, 9]])", expect: "3" },
          { call: "max_non_overlapping([[1, 2], [2, 3], [3, 4], [1, 3]])", expect: "3", label: "touching is fine" },
          { call: "max_non_overlapping([[1, 100], [1, 2], [2, 3]])", expect: "2" },
          { call: "max_non_overlapping([[5, 7]])", expect: "1", label: "one interval" },
          { call: "max_non_overlapping([])", expect: "0", label: "empty" },
        ],
        teach: "Sort by end. Keep `last_end`. Take an interval when its start is at or after `last_end`, then set `last_end` to its end.",
        explain: "One sort, one pass: O(n log n). For \"min removals\" return `len(intervals) - count`.",
        fromMemory: true,
      },
      {
        kind: "read",
        title: "Template 2: merge (sort by start)",
        body: "To **merge** overlapping intervals, sort by **start**. Walk left to right and compare each interval with the last block in the output.\n\n`[1,3]` starts a block. `[2,5]` starts at 2 ≤ 3, so it overlaps: extend the block's end to `max(3, 5) = 5`. The block is now `[1,5]`.",
        visual: timeline(9, [iv(1, 3, 9, "good"), iv(2, 5, 9, "good"), iv(7, 8, 9, "neutral"), iv(8, 9, 9, "neutral"), blocks("out", [[1, 5]], 9, "accent")], "Sorted by start. The first two merge into [1,5]."),
      },
      {
        kind: "read",
        title: "Merge, continued",
        body: "`[7,8]` starts at 7, after the block's end 5. No overlap: start a new block `[7,8]`.\n\n`[8,9]` starts at 8 ≤ 8. Extend: the block becomes `[7,9]`.\n\nOutput: `[[1,5], [7,9]]`. In code, the check is `s <= out[-1][1]`, and the extend is `out[-1][1] = max(out[-1][1], e)`.",
        visual: timeline(9, [iv(1, 3, 9, "neutral"), iv(2, 5, 9, "neutral"), iv(7, 8, 9, "good"), iv(8, 9, 9, "good"), blocks("out", [[1, 5], [7, 9]], 9, "accent")], "Output: [1,5] and [7,9]."),
        callout: { type: "mistake", text: "Sorting by start when the question asks \"how many can I keep\". Sort by start to **merge**. Sort by end to **select**." },
      },
      {
        kind: "code",
        title: "Write merge",
        prompt: "Write `merge(intervals)`: return the merged list of blocks, sorted by start. Intervals that touch (`[1,4]` and `[4,5]`) merge.",
        starter: py("def merge(intervals):", "    pass"),
        solution: MERGE,
        tests: [
          { call: "merge([[1, 3], [2, 6], [8, 10], [15, 18]])", expect: "[[1, 6], [8, 10], [15, 18]]" },
          { call: "merge([[1, 4], [4, 5]])", expect: "[[1, 5]]", label: "touching merges" },
          { call: "merge([[1, 4], [2, 3]])", expect: "[[1, 4]]", label: "one inside another" },
          { call: "merge([[4, 7], [1, 4]])", expect: "[[1, 7]]", label: "unsorted input" },
          { call: "merge([])", expect: "[]", label: "empty" },
        ],
        teach: "Sort by start. If the next interval starts at or before the last block's end, extend that end with max. Otherwise start a new block.",
        explain: "The `max` matters: `[1,4]` then `[2,3]` must stay `[1,4]`, not shrink to `[1,3]`.",
      },
      {
        kind: "read",
        title: "Touching: one character decides",
        body: "`s >= last_end` versus `s > last_end` decides whether `[1,2]` and `[2,3]` overlap.\n\n- LC 435 Non-overlapping Intervals treats touching as fine: use `>=`.\n- LC 452 Minimum Number of Arrows treats touching as overlapping, because one arrow at x = 2 bursts both balloons.\n\nRead the statement for this one detail before you type the comparison.",
        callout: { type: "trap", text: "`s >= last_end` vs `s > last_end` changes the answer whenever intervals touch. Check the statement every time." },
      },
      {
        kind: "quiz",
        teach: "With `s >= last_end`, an interval starting exactly at `last_end` counts as a new, separate interval. With `s > last_end`, it does not.",
        prompt: "In LC 452, balloons `[1,2]` and `[2,3]` touch, and one arrow bursts both. They must count as one group. Which check do you use in the select template?",
        options: ["`s >= last_end`", "`s > last_end`"],
        answer: 1,
        explain: "With `s > last_end`, `[2,3]` starts at 2, which is not greater than 2, so it joins the same group: one arrow. With `>=` you would count 2 arrows.",
      },
      {
        kind: "summary",
        points: [
          "Greedy = take the best-looking choice and never undo it. Fast, often wrong.",
          "Exchange argument: swap the optimal answer's choice for greedy's; if nothing gets worse, greedy is safe.",
          "Counterexample habit: 3 tiny cases where the obvious choice blocks a better one.",
          "Select the most intervals: sort by end. Merge: sort by start.",
          "`>=` vs `>` decides whether touching intervals overlap. Read the statement.",
        ],
      },
    ],
  },

  /* =====================================================================
     Day 8 B: drill
     ===================================================================== */
  {
    id: "ch05-l2",
    day: 8,
    title: "Day 8 drill: Greedy and intervals",
    goal: "Name the right greedy shape in 15 seconds and work Day 8's problem list.",
    minutes: 10,
    steps: [
      {
        kind: "read",
        title: "Recap",
        body: "Today's idea in four lines:\n- Greedy picks the best-looking choice and never undoes it.\n- Prove it with an exchange argument, or break it with 3 tiny cases.\n- Intervals: sort by **end** to select, sort by **start** to merge.\n- Reach problems: track the farthest reach. Order problems: sort with a pairwise rule.\n\nThis lesson: 5 disguised problems to name, then the day's problem list and the end-of-day check.",
        visual: {
          kind: "compare",
          left: { title: "Sort by end", points: ["Keep the most", "Remove the fewest", "Take if s >= last_end"] },
          right: { title: "Sort by start", points: ["Merge overlapping", "Output blocks", "Extend if s <= last block's end"] },
        },
      },
      {
        kind: "quiz",
        teach: "Ask what the question wants back: the most items kept, merged blocks, a yes/no reach, or an order.",
        prompt: "Lectures have start and end times. There is one hall. Host as many lectures as possible.",
        options: ["Greedy: sort by end, take if start ≥ last end", "Sort by start, merge overlapping", "Sliding window over the times", "Track the farthest reach"],
        answer: 0,
        explain: "\"As many as possible\" + intervals + no overlap = select. Sort by end and take greedily; the exchange argument proves it.",
      },
      {
        kind: "quiz",
        teach: "Some greedy problems are about how far you can get, not about intervals.",
        prompt: "A frog on stones can jump up to `a[i]` stones forward from stone `i`. Can it reach the last stone?",
        options: ["Track the farthest reachable index", "Sort by end, take greedily", "Binary search on the answer", "Prefix sums"],
        answer: 0,
        explain: "\"Can you reach the end\" is the signal. Keep reach = max(reach, i + a[i]); if i ever passes reach, the frog is stuck.",
      },
      {
        kind: "read",
        title: "Notice the signal",
        body: "In both questions, one phrase did the work: \"as many as possible\" with time ranges, and \"can it reach\". Train your eye to grab that phrase first, then check the input shape.",
      },
      {
        kind: "quiz",
        teach: "Decide whether the output is a count of kept intervals or a list of combined blocks.",
        prompt: "Given the time ranges of bookings, output the busy blocks with no gaps inside.",
        options: ["Sort by start, merge", "Sort by end, take greedily", "Sliding window", "Binary search on the answer"],
        answer: 0,
        explain: "\"Busy blocks\" = merged intervals. Sort by start and extend the last block while the next one overlaps.",
      },
      {
        kind: "quiz",
        teach: "When the answer is an arrangement, compare two neighbours and ask which order is better.",
        prompt: "Glue numbers together as strings to form the largest possible number.",
        options: ["Sort with comparator a+b vs b+a", "Sort descending by numeric value", "Sort by end, take greedily", "Monotonic stack"],
        answer: 0,
        explain: "An ordering problem: the adjacent swap. Put a before b when a + b > b + a as strings. Plain descending fails: 9 vs 34 is fine, but 3 vs 30 gives \"303\" instead of \"330\".",
      },
      {
        kind: "read",
        title: "Notice the signal",
        body: "\"Output the blocks\" means merge. \"Arrange to make the largest\" means a custom comparison. The last one hides an interval idea inside a string.",
      },
      {
        kind: "quiz",
        teach: "Each letter has a first and a last position in the string. A piece can only end where no open letter appears later.",
        prompt: "Split a string into as many pieces as possible so each letter appears in only one piece.",
        options: ["Last index of each letter, cut when i reaches the running max", "Sliding window with a set", "Two pointers from both ends", "Prefix sums of letter counts"],
        answer: 0,
        explain: "This is LC 763 Partition Labels. Record each letter's last index. Walk the string keeping farthest = max last index so far; when i == farthest, cut.",
      },
      {
        kind: "practice",
        title: "Today's problems",
        intro: PRACTICE_RULES + " Short on time? Drop the stretch rows, not the Contest #1 upsolve. Extra if fast: LC 179 Largest Number (comparator sort with `functools.cmp_to_key`), LC 135 Candy (H, two passes).",
        problems: [
          { ref: "LC 455 Assign Cookies", tier: "warm", lvl: "E", box: 10, clue: "Sort both arrays, so the smallest cookie that satisfies the least greedy child" },
          { ref: "LC 56 Merge Intervals", tier: "core", lvl: "M", box: 20, clue: "\"Overlapping\" + output merged list → sort by start" },
          { ref: "LC 435 Non-overlapping Intervals", tier: "core", lvl: "M", box: 20, clue: "\"Minimum to remove\" = n − max kept, sort by end" },
          { ref: "LC 452 Minimum Number of Arrows to Burst Balloons", tier: "core", lvl: "M", box: 20, clue: "Same as #3, but touching counts as overlap" },
          { ref: "LC 763 Partition Labels", tier: "core", lvl: "M", box: 20, clue: "Last index of each char, cut when `i == farthest`" },
          { ref: "LC 134 Gas Station", tier: "core", lvl: "M", box: 25, clue: "If total gas ≥ total cost, the start is right after the last point where the tank went negative" },
          { ref: "CSES — Tasks and Deadlines", tier: "stretch", lvl: "CSES", box: 25, clue: "Reward = Σ(d − f). Shortest job first, prove it by adjacent swap" },
          { ref: "Codeforces problemset, rating 1000–1300, tag greedy, solve 2", tier: "stretch", lvl: "CF", box: 40, clue: "Write the 3-case counterexample attempt in a comment before coding" },
        ],
      },
      {
        kind: "reveal",
        prompt: "End-of-day check 1: in two sentences, prove that \"earliest end first\" is optimal for selecting intervals.",
        answer: "Take any optimal answer and swap its first interval b for greedy's a, the one that ends first. Since end(a) <= end(b), everything after b still starts after a, so the answer stays valid with the same count; repeat at every step and the optimal answer becomes the greedy one.",
      },
      {
        kind: "reveal",
        prompt: "End-of-day check 2: give a 3-element counterexample to \"shortest interval first\".",
        answer: "[1,5] [4,7] [6,10]. The shortest is [4,7], and it overlaps both others, so the rule keeps 1. The best is [1,5] and [6,10]: 2.",
      },
      {
        kind: "reveal",
        prompt: "End-of-day check 3: when do you sort intervals by start, and when by end?",
        answer: "By start to merge (output combined blocks). By end to select (keep the most, remove the fewest, minimum arrows).",
      },
      {
        kind: "summary",
        points: [
          "\"Keep the most / remove the fewest\" intervals → sort by end.",
          "\"Merge / busy blocks\" → sort by start.",
          "\"Reach the end\" → farthest reach. \"Largest arrangement\" → pairwise comparator.",
          "Before any greedy: try to break it with 3 tiny cases.",
          SUMMARY_END,
        ],
      },
    ],
  },

  /* =====================================================================
     Day 9 A: heaps
     ===================================================================== */
  {
    id: "ch05-l3",
    day: 9,
    title: "Day 9: Heaps",
    goal: "See \"top k\", \"running median\" or \"next event by time\" and write the right heapq code in under 3 minutes.",
    minutes: 12,
    steps: [
      {
        kind: "read",
        title: "The min of a changing set",
        body: "Many problems keep asking the same thing: \"what is the smallest (or largest) item **right now**?\" while items keep arriving and leaving. Sorting again after every change is too slow.\n\nToday's tool answers that question fast.\n\n**Goal:** see \"top k\", \"running median\" or \"next event by time\" and write the right `heapq` code in under 3 minutes.",
      },
      {
        kind: "quiz",
        guess: true,
        prompt: "Numbers arrive one at a time. You keep the 3 largest seen so far in a box. A new number arrives. Which number in the box do you compare it with?",
        options: ["The smallest of the 3", "The largest of the 3", "All 3, one by one"],
        answer: 0,
        explain: "The smallest of the 3. If the new number beats it, the smallest gets thrown out; if not, the new number can't be in the top 3. So you want the smallest of the box on hand at all times. That is exactly what a min-heap gives you.",
      },
      {
        kind: "read",
        title: "What a heap gives you",
        body: "A **[[heap]]** keeps a set so that the smallest item is always on top.\n- Read the smallest: O(1).\n- Push or pop: O(log n).\n\nUse it when you need the min (or max) of a set that **keeps changing**. If the set never changes, sort it once instead.\n\nPython's heap is a plain list. Read level by level, the list is the tree. Every parent is ≤ its children, so `h[0]` is the smallest.",
        visual: tree([1, 3, 2, 7, 4, 5], { 0: "accent" }, { 0: "h[0]" }, "h = [1, 3, 2, 7, 4, 5]. Children of index i sit at 2i+1 and 2i+2."),
      },
      {
        kind: "read",
        title: "heapq is a min-heap",
        body: "Python's `heapq` is a **min-heap**: the smallest is on top.\n- For a **max-heap**, push `-x` and negate again when you pop.\n- For ties, push tuples `(priority, index, item)`. Tuples compare field by field. The unique index stops Python from ever comparing two items that can't be compared, like two `ListNode` objects.",
        visual: codeV(py(
          "import heapq",
          "h = []",
          "heapq.heappush(h, 5); heapq.heappush(h, 1)",
          "h[0]                 # 1, the smallest",
          "heapq.heappop(h)     # 1",
          "heapq.heappush(h, -9)   # max-heap trick: store -x",
          "-h[0]                # 9, the largest",
        )),
      },
      {
        kind: "widget",
        widget: "heap",
        title: "Push and pop",
        task: "Push a few numbers, then pop twice. Watch a new item sift up to its place and the last item sift down after a pop. The list view and tree view always match.",
        props: { mode: "basics" },
      },
      {
        kind: "read",
        title: "Shape 1: top-k with a size-k min-heap",
        body: "This is **[[top-k]]**: to keep the k **largest**, use a min-heap of size k. Push each number. When the heap grows past k, pop the smallest.\n\nExample: nums = `[5, 1, 9, 3, 7, 8]`, k = 3. After the first three pushes, the heap is `[1, 5, 9]`. Size 3 = k, so nothing is popped yet.",
        visual: arr([
          { label: "nums", items: [5, 1, 9, 3, 7, 8], pointers: [{ at: 2, label: "x" }], tones: { 0: "good", 1: "good", 2: "good" } },
          { label: "heap", items: [1, 5, 9], tones: { 0: "accent" } },
        ], "k = 3. Heap holds 3 items; h[0] = 1."),
      },
      {
        kind: "read",
        title: "Top-k: the smallest gets evicted",
        body: "x = 3: push it. The heap has 4 items, more than k, so pop the smallest: 1 leaves. Heap = `[3, 5, 9]`.\n\nThe item that leaves is always the weakest of the kept ones. That is why the heap must be a **min**-heap even though we want the largest.",
        visual: arr([
          { label: "nums", items: [5, 1, 9, 3, 7, 8], pointers: [{ at: 3, label: "x" }], tones: { 1: "bad", 3: "good" } },
          { label: "heap", items: [3, 5, 9], tones: { 0: "accent" } },
        ], "Pushed 3, popped 1."),
      },
      {
        kind: "read",
        title: "Top-k: the answer sits on top",
        body: "x = 7: push, pop 3. Heap = `[5, 7, 9]`.\nx = 8: push, pop 5. Heap = `[7, 8, 9]`.\n\nWhat's left are the 3 largest, and `h[0] = 7` is the **3rd largest**.\n\nCost: n pushes on a heap that never exceeds k + 1 items, so **O(n log k)**.",
        visual: arr([
          { label: "nums", items: [5, 1, 9, 3, 7, 8], pointers: [{ at: 5, label: "x" }], tones: { 2: "good", 4: "good", 5: "good" } },
          { label: "heap", items: [7, 8, 9], tones: { 0: "accent" }, pointers: [{ at: 0, label: "3rd largest", tone: "good" }] },
        ], "The k largest are left; h[0] is the k-th largest."),
      },
      {
        kind: "number",
        teach: "Push each number into a min-heap; when it holds more than k items, pop the smallest. At the end, h[0] is the k-th largest.",
        prompt: "nums = `[4, 10, 2, 8, 6]`, k = 2. Run the size-k min-heap. What is `h[0]` at the end?",
        answer: 8,
        tolerance: 0.4,
        explain: "4 → [4]; 10 → [4, 10]; 2 → pop 2 → [4, 10]; 8 → pop 4 → [8, 10]; 6 → pop 6 → [8, 10]. h[0] = 8, the 2nd largest.",
      },
      {
        kind: "widget",
        widget: "heap",
        title: "Top-k over a stream",
        task: "Set k = 3 and run the stream to the end. Before the last step, predict which value will sit at h[0].",
        props: { mode: "top-k", k: 3 },
      },
      {
        kind: "read",
        title: "Shape 2: two heaps for the median",
        body: "**[[Two heaps]]** keep a running median:\n- `lo`, a max-heap, holds the lower half.\n- `hi`, a min-heap, holds the upper half.\n\nTo add x: push it into `lo`, then move `lo`'s largest to `hi`. If `hi` is now bigger than `lo`, move `hi`'s smallest back. So `lo` holds the same count as `hi`, or one more.\n\nAdd 5: it lands in `lo`. Median 5. Add 2: `lo` = {2}, `hi` = {5}. Median (2 + 5) / 2 = 3.5.",
        visual: arr([
          { label: "lo (max)", items: [2], tones: { 0: "accent" } },
          { label: "hi (min)", items: [5], tones: { 0: "accent" } },
        ], "After adding 5, 2: median = (2 + 5) / 2 = 3.5."),
      },
      {
        kind: "read",
        title: "Two heaps: add 8",
        body: "Push 8 into `lo`: `lo` = {2, 8}. Move `lo`'s max (8) up: `hi` = {5, 8}, `lo` = {2}.\n\nNow `hi` has more than `lo`, so move `hi`'s min (5) back down: `lo` = {2, 5}, `hi` = {8}.\n\n`lo` has one extra, so the median is its top: **5**.",
        visual: arr([
          { label: "lo (max)", items: [2, 5], tones: { 1: "good" } },
          { label: "hi (min)", items: [8], tones: { 0: "accent" } },
        ], "lo has one extra: median = top of lo = 5."),
      },
      {
        kind: "read",
        title: "Two heaps: add 4",
        body: "Push 4 into `lo`: {2, 4, 5}. Move its max (5) up: `hi` = {5, 8}, `lo` = {2, 4}.\n\nSizes are equal, so nothing moves back. The median is the average of the two tops: (4 + 5) / 2 = **4.5**.\n\nEach add is a few pushes and pops: O(log n).",
        visual: arr([
          { label: "lo (max)", items: [2, 4], tones: { 1: "good" } },
          { label: "hi (min)", items: [5, 8], tones: { 0: "good" } },
        ], "Equal sizes: median = (4 + 5) / 2 = 4.5."),
      },
      {
        kind: "number",
        teach: "Push into lo, move lo's max to hi, and if hi is bigger, move hi's min back. If lo has one extra, the median is lo's top; otherwise average the two tops.",
        prompt: "Now `lo` = {2, 4} and `hi` = {5, 8}. Add 9. What is the median?",
        answer: 5,
        tolerance: 0.01,
        explain: "Push 9 into lo: {2, 4, 9}. Move 9 up: hi = {5, 8, 9}. hi is bigger, so move 5 down: lo = {2, 4, 5}, hi = {8, 9}. lo has one extra: median 5.",
      },
      {
        kind: "widget",
        widget: "heap",
        title: "Running median",
        task: "Add numbers one at a time. After each insert, check that lo's top and hi's top surround the median, and that lo never has more than one extra item.",
        props: { mode: "median" },
      },
      {
        kind: "read",
        title: "Shape 3: heap + sweep",
        body: "**Heap + sweep**: sort events by time, walk forward, push what has arrived into a heap, pop what has finished.\n\nExample: how many rooms so no two meetings in a room overlap? Meetings are half-open `[s, e)`: a room freed at time e can take a meeting starting at e.\n\nSort by start. Keep a min-heap `ends` of end times of rooms in use. `[1,4)`: push 4. `[2,5)`: the earliest end is 4 > 2, so open a room: `ends` = [4, 5].",
        visual: arr([
          { label: "meetings", items: ["[1,4)", "[2,5)", "[4,7)", "[6,8)"], pointers: [{ at: 1, label: "now" }], tones: { 0: "good", 1: "good" } },
          { label: "ends", items: [4, 5], tones: { 0: "accent" } },
        ], "Two rooms in use. ends[0] = 4 is the room that frees first."),
      },
      {
        kind: "read",
        title: "Heap + sweep: reuse a room",
        body: "`[4,7)`: the earliest end is 4 ≤ 4, so that room is free. Reuse it: replace 4 with 7. `ends` = [5, 7].\n\n`[6,8)`: the earliest end is 5 ≤ 6. Reuse: replace 5 with 8. `ends` = [7, 8].\n\nThe heap never grew past 2, so the answer is **2 rooms**. `heapreplace` pops and pushes in one call. Cost: O(n log n).",
        visual: arr([
          { label: "meetings", items: ["[1,4)", "[2,5)", "[4,7)", "[6,8)"], pointers: [{ at: 3, label: "now" }], tones: { 2: "good", 3: "good" } },
          { label: "ends", items: [7, 8], tones: { 0: "accent" } },
        ], "len(ends) = 2 rooms."),
      },
      {
        kind: "number",
        teach: "Sort by start. If the earliest end time in the heap is ≤ the meeting's start, reuse that room (replace); otherwise push a new end time. The answer is the heap's size.",
        prompt: "Meetings `[0,10) [1,3) [2,6) [7,9)`. How many rooms?",
        answer: 3,
        tolerance: 0.4,
        unit: "rooms",
        explain: "[0,10): ends [10]. [1,3): 10 > 1, push → [3, 10]. [2,6): 3 > 2, push → [3, 6, 10]. [7,9): 3 ≤ 7, reuse → [6, 9, 10]. 3 rooms.",
      },
      {
        kind: "read",
        title: "One more: merge k sorted lists",
        body: "To merge k sorted lists, keep a min-heap with **one item per list**: its current head. Pop the smallest, output it, and push the next item from the same list.\n\nThe heap never holds more than k items, so each step is O(log k). Push `(value, list_index, position)` so ties never compare anything odd.",
        visual: arr([
          { label: "A", items: [1, 4, 7], tones: { 0: "good" } },
          { label: "B", items: [2, 5], tones: { 0: "accent" } },
          { label: "C", items: [3, 6], tones: { 0: "accent" } },
          { label: "heap", items: ["(2,B)", "(3,C)", "(4,A)"], tones: { 0: "accent" } },
        ], "Popped (1, A) and pushed A's next item, 4."),
      },
      {
        kind: "read",
        title: "Speed notes",
        body: "- `heapq.heapify(list)` turns a list into a heap in O(n).\n- `heapq.nlargest(k, it)` is fine for one-off use.\n- For 10^5 operations, PyPy handles `heapq` well. In CPython it is fast enough for n·log n up to about 10^6 operations.",
      },
      {
        kind: "read",
        title: "15-second clues",
        body: "- \"k largest / k smallest / k closest / k most frequent\" → heap of size k.\n- \"Median of a stream\", \"balance two halves\" → two heaps.\n- \"Merge k sorted\" → min-heap with one item per list.\n- \"Tasks arrive over time, always process the cheapest available\" → sort by arrival + heap of available.\n- \"How many rooms / machines / servers at once\" → sort by start + heap of end times.\n- \"Repeatedly take the two largest and combine\" → max-heap simulation.",
        callout: { type: "clue", text: "Ask: \"what changing set do I need the min or max of?\" If there is one, reach for a heap." },
      },
      {
        kind: "read",
        title: "Template walk",
        body: "`k_largest`: push, and pop when the size passes k. `h[0]` is the k-th largest.\n\n`Median`: `lo` stores negatives so the min-heap acts as a max-heap. Every add goes through `lo` then up to `hi`, then back if `hi` got bigger.\n\nMental test on 5, 2, 8, 4: medians 5, 3.5, 5, 4.5. Matches the pictures.",
        visual: codeV(K_LARGEST + "\n\n" + MEDIAN.replace("import heapq\n\n", "")),
      },
      {
        kind: "code",
        title: "Now type it yourself: top-k",
        prompt: "Write `k_largest(nums, k)` from memory. Return a heap holding the k largest values (any order is fine; `h[0]` must be the k-th largest).",
        starter: py("import heapq", "", "# Top-k largest: min-heap of size k", "def k_largest(nums, k):", "    pass"),
        solution: K_LARGEST,
        tests: [
          { call: "sorted(k_largest([5, 1, 9, 3, 7, 8], 3))", expect: "[7, 8, 9]" },
          { call: "k_largest([4, 10, 2, 8, 6], 2)[0]", expect: "8", label: "h[0] is the k-th largest" },
          { call: "sorted(k_largest([3, 3, 3], 2))", expect: "[3, 3]", label: "all equal" },
          { call: "k_largest([7], 1)", expect: "[7]", label: "one element" },
        ],
        teach: "Min-heap. Push every number; if the heap has more than k items, pop. The smallest kept item is always the one to evict.",
        explain: "O(n log k). For LC 215, return `h[0]`.",
        fromMemory: true,
      },
      {
        kind: "code",
        title: "Two heaps: running median",
        prompt: "Fill in `Median`. `add(x)` inserts a number; `median()` returns the median so far. `lo` is a max-heap (store `-x`), `hi` a min-heap.",
        starter: py(
          "import heapq",
          "",
          "class Median:",
          "    def __init__(self):",
          "        self.lo = []   # max-heap via negation (lower half)",
          "        self.hi = []   # min-heap (upper half)",
          "    def add(self, x):",
          "        pass",
          "    def median(self):",
          "        pass",
        ),
        solution: MEDIAN,
        tests: [
          { call: "(lambda m: [m.add(x) or m.median() for x in [5, 2, 8, 4]])(Median())", expect: "[5, 3.5, 5, 4.5]", label: "medians after each add of 5, 2, 8, 4" },
          { call: "(lambda m: [m.add(x) or m.median() for x in [5, 2, 8, 4, 9]])(Median())[-1]", expect: "5", label: "then add 9" },
          { call: "(lambda m: [m.add(x) or m.median() for x in [1]])(Median())", expect: "[1]", label: "one number" },
          { call: "(lambda m: [m.add(x) or m.median() for x in [2, 2, 2]])(Median())", expect: "[2, 2, 2]", label: "all equal" },
        ],
        teach: "add: push -x into lo, move lo's max into hi, and if hi is now bigger, move hi's min back to lo. median: lo's top if lo is bigger, else the average of both tops.",
        explain: "Routing every number through lo then hi keeps every lo value ≤ every hi value. Each add is O(log n).",
      },
      {
        kind: "code",
        title: "Heap + sweep: meeting rooms",
        prompt: "Write `min_rooms(intervals)`: the fewest rooms so no two meetings in one room overlap. Meetings are half-open `[s, e)`, so a meeting may start exactly when another ends.",
        starter: py("import heapq", "", "def min_rooms(intervals):", "    pass"),
        solution: MIN_ROOMS,
        tests: [
          { call: "min_rooms([[1, 4], [2, 5], [4, 7], [6, 8]])", expect: "2" },
          { call: "min_rooms([[0, 10], [1, 3], [2, 6], [7, 9]])", expect: "3" },
          { call: "min_rooms([[1, 2], [2, 3], [3, 4]])", expect: "1", label: "back to back" },
          { call: "min_rooms([[1, 5], [1, 5], [1, 5]])", expect: "3", label: "all equal" },
          { call: "min_rooms([])", expect: "0", label: "empty" },
        ],
        teach: "Sort by start. Keep a min-heap of end times. If the earliest end is ≤ the start, replace it; otherwise push. Return the heap size.",
        explain: "For CSES Room Allocation the days are inclusive, so a room frees only if `end < arrival`: flip `<=` to `<`.",
      },
      {
        kind: "read",
        title: "Ties in a heap",
        body: "`heapq.heappush(h, (dist, node))`: when two `dist` values are equal, Python compares `node` next. If `node` is a `ListNode` or a dict, you get a `TypeError`.\n\nThe fix is a unique counter in the middle: push `(dist, i, node)`. Two tuples can never tie on `i`, so `node` is never compared.",
        callout: { type: "trap", text: "Equal priorities make Python compare the next tuple field. Push `(priority, i, obj)` with a unique counter `i`." },
      },
      {
        kind: "read",
        title: "Idle time in a sweep",
        body: "In heap + sweep problems with arrival times (LC 1834 Single-Threaded CPU), the heap can be empty while the next task hasn't arrived yet.\n\nThen **jump time forward** to that task's arrival time before you continue. Forgetting this makes the loop spin forever or gives a wrong answer.",
        callout: { type: "mistake", text: "Heap empty and nothing has arrived? Set time = next arrival. Don't tick forward one unit at a time, and don't stop." },
      },
      {
        kind: "summary",
        points: [
          "A heap gives the min of a changing set: peek O(1), push and pop O(log n). heapq is a min-heap; negate for a max-heap.",
          "Top-k largest: size-k min-heap, O(n log k); h[0] is the k-th largest.",
          "Running median: max-heap lo + min-heap hi, sizes within 1; lo may hold the extra.",
          "Heap + sweep: sort by time, heap of end times or available tasks; jump time when idle.",
          "Push (priority, i, obj) so ties never compare objects.",
        ],
      },
    ],
  },

  /* =====================================================================
     Day 9 B: drill
     ===================================================================== */
  {
    id: "ch05-l4",
    day: 9,
    title: "Day 9 drill: Heaps",
    goal: "Name the heap shape in 15 seconds and work Day 9's problem list.",
    minutes: 10,
    steps: [
      {
        kind: "read",
        title: "Recap",
        body: "Today's idea in four lines:\n- A heap gives the min of a **changing** set fast. `heapq` is a min-heap; push `-x` for a max-heap.\n- **Top-k:** size-k min-heap, O(n log k).\n- **Two heaps:** lower half in a max-heap, upper half in a min-heap; median on top.\n- **Heap + sweep:** sort by time, heap of what's active or available.\n\nThis lesson: 5 disguised problems, then the problem list and the end-of-day check.",
        visual: {
          kind: "stats",
          items: [
            { value: "O(n log k)", label: "Top-k" },
            { value: "O(log n)", label: "Two heaps, per insert" },
            { value: "O(n log n)", label: "Heap + sweep" },
          ],
        },
      },
      {
        kind: "quiz",
        teach: "Look at what changes over time: things arrive, and you keep choosing the best one that has arrived.",
        prompt: "A hospital admits patients over time. Whenever a doctor is free, the patient with the lowest severity score goes next.",
        options: ["Sort by arrival + min-heap of available patients (heap + sweep)", "Size-k heap", "Two heaps", "Sort by end, take greedily"],
        answer: 0,
        explain: "Arrivals over time + \"always process the best available\" = heap + sweep. Sort by arrival, push arrived patients into a min-heap keyed by severity, pop when a doctor is free.",
      },
      {
        kind: "quiz",
        teach: "A middle value splits the data into a lower half and an upper half.",
        prompt: "After each new reading from a sensor, report the middle value of all readings so far.",
        options: ["Two heaps", "Size-k min-heap", "Sort everything after every reading", "Sliding window"],
        answer: 0,
        explain: "\"Median of a stream\" = two heaps. Sorting after every reading is O(n log n) per reading.",
      },
      {
        kind: "read",
        title: "Notice the signal",
        body: "\"Arrives over time\" + \"best available\" pointed to heap + sweep. \"Middle value so far\" pointed to two heaps. The phrase \"so far\" means the set keeps changing, which is when a heap beats sorting.",
      },
      {
        kind: "quiz",
        teach: "First count how often each item appears, then keep only the best few counts.",
        prompt: "Given 10^6 search queries, return the 100 most common.",
        options: ["Counter + size-k heap", "Two heaps", "Sort by start + heap of end times", "Min-heap with one head per list"],
        answer: 0,
        explain: "Count with `Counter`, then keep a size-100 heap on (count, query). `heapq.nlargest(100, ...)` does the same in one call.",
      },
      {
        kind: "quiz",
        teach: "Ask how many things are happening at the same moment, at worst.",
        prompt: "Flights have departure and arrival times at one airport. What is the fewest number of gates needed?",
        options: ["Sort by start + min-heap of end times", "Sort by end, take greedily", "Two heaps", "Counter + size-k heap"],
        answer: 0,
        explain: "\"How many at once\" = meeting rooms. Sort by start; reuse the gate that frees first if it's free, else open one. Sort-by-end greedy counts how many you can keep in one gate, which is a different question.",
      },
      {
        kind: "read",
        title: "Notice the signal",
        body: "\"Most common\" + a number k pointed to a size-k heap. \"Fewest gates / rooms / machines\" pointed to a heap of end times. Day 8's sort-by-end greedy is the near miss: it answers \"how many fit in **one** room\".",
      },
      {
        kind: "quiz",
        teach: "Each source is already sorted, so the next output item is always one of the sources' current first items.",
        prompt: "You have k sorted log files. Print all entries in one sorted stream.",
        options: ["Min-heap with one head per file (k-way merge)", "Two heaps", "Sort by start, merge overlapping", "Size-k heap of the largest entries"],
        answer: 0,
        explain: "\"Merge k sorted\" = a min-heap holding each file's current head. Pop the smallest, print it, push that file's next entry.",
      },
      {
        kind: "practice",
        title: "Today's problems",
        intro: PRACTICE_RULES + " Extra if fast: LC 23 Merge k Sorted Lists (H), LC 1882 Process Tasks Using Servers (M, free-heap + busy-heap).",
        problems: [
          { ref: "LC 1046 Last Stone Weight", tier: "warm", lvl: "E", box: 10, clue: "\"Two heaviest, smash, repeat\" → max-heap via negation" },
          { ref: "LC 215 Kth Largest Element in an Array", tier: "core", lvl: "M", box: 15, clue: "Size-k min-heap. Say why it's O(n log k)" },
          { ref: "LC 347 Top K Frequent Elements", tier: "core", lvl: "M", box: 15, clue: "Counter + heap of size k on (count, value)" },
          { ref: "LC 973 K Closest Points to Origin", tier: "core", lvl: "M", box: 15, clue: "Size-k max-heap on `-(x*x + y*y)`, no `sqrt`" },
          { ref: "LC 1834 Single-Threaded CPU", tier: "core", lvl: "M", box: 25, clue: "Sort by enqueue time, heap of (processing time, index), jump time when idle" },
          { ref: "LC 295 Find Median from Data Stream", tier: "stretch", lvl: "H", box: 25, clue: "Two heaps, exactly today's template" },
          { ref: "CSES — Room Allocation", tier: "stretch", lvl: "CSES", box: 25, clue: "Heap of (end day, room id). Inclusive days mean a room frees only if `end < arrival`" },
          { ref: "Codeforces problemset, rating 1100–1400, tags greedy + data structures, solve 1", tier: "stretch", lvl: "CF", box: 30, clue: "Before coding, ask: \"what changing set do I need the min/max of?\"" },
        ],
      },
      {
        kind: "reveal",
        prompt: "End-of-day check 1: to keep the k largest, is the heap a min-heap or a max-heap, and why?",
        answer: "A min-heap. The item to throw out is always the smallest of the kept k, and a min-heap has it on top in O(1). When the heap passes k items, pop it. At the end h[0] is the k-th largest.",
      },
      {
        kind: "reveal",
        prompt: "End-of-day check 2: what goes wrong when you push (priority, obj) and two priorities tie?",
        answer: "Python compares the next tuple field, obj. If obj is a ListNode, a dict or anything without an order, you get a TypeError. Push (priority, i, obj) with a unique counter i.",
      },
      {
        kind: "reveal",
        prompt: "End-of-day check 3: in the two-heap median, which heap may hold one extra element?",
        answer: "lo, the max-heap of the lower half. After each add, len(lo) equals len(hi) or is one more. When lo has the extra, the median is -lo[0]; otherwise it is the average of the two tops.",
      },
      {
        kind: "summary",
        points: [
          "\"k largest / most frequent / closest\" → size-k heap.",
          "\"Median so far\" → two heaps.",
          "\"Arrives over time, best available\" or \"how many at once\" → sort + heap (sweep).",
          "\"Merge k sorted\" → one head per list in a min-heap.",
          SUMMARY_END,
        ],
      },
    ],
  },

  /* =====================================================================
     Day 10 A: recursion + backtracking
     ===================================================================== */
  {
    id: "ch05-l5",
    day: 10,
    title: "Day 10: Recursion and backtracking",
    goal: "Turn \"list all / count all / find any arrangement\" with tiny n into a correct choose, recurse, undo search.",
    minutes: 12,
    steps: [
      {
        kind: "read",
        title: "When n is tiny, try everything",
        body: "Some problems say \"list all\", \"count all\" or \"find any arrangement\", and n is tiny: 20 or less. That small n is a hint. You are allowed to try every possibility, as long as you do it in an organised way.\n\n**Goal:** turn \"list all / count all / find any arrangement\" with tiny n into a correct choose → recurse → undo search.",
      },
      {
        kind: "quiz",
        guess: true,
        prompt: "How many subsets does the set {a, b, c} have, counting the empty set and the full set?",
        options: ["3", "6", "8", "9"],
        answer: 2,
        explain: "8. Each element is either in or out: 2 × 2 × 2 = 2^3 = 8. That \"in or out\" choice per element is the whole idea behind subset search.",
      },
      {
        kind: "read",
        title: "A tree of decisions",
        body: "**[[Backtracking]]** walks a tree of decisions. At each step:\n1. **Choose** an option.\n2. **Recurse** to decide the rest.\n3. **Undo** the choice.\n\nThe undo is what lets you reuse one `path` list for the whole search instead of copying it at every step.\n\nFor subsets of `[1, 2]`, the first level decides 1 (take or skip), the second decides 2. Each **leaf** (a node with no children) is one finished subset.",
        visual: tree(SUB_TREE, {}, { 1: "take 1", 2: "skip 1" }, "Left = take, right = skip. 4 leaves = 4 subsets."),
      },
      {
        kind: "read",
        title: "Walk it: take, take",
        body: "`dfs(0)`: choose 1, so `path = [1]`. Recurse.\n`dfs(1)`: choose 2, so `path = [1, 2]`. Recurse.\n`dfs(2)`: i equals len(nums), a leaf. Record a **copy**: `res = [[1, 2]]`.",
        visual: tree(SUB_TREE, { 0: "accent", 1: "accent", 3: "good" }, { 3: "record" }, "path = [1, 2]"),
      },
      {
        kind: "read",
        title: "Walk it: undo, skip",
        body: "Back in `dfs(1)`: undo, `path.pop()`, so `path = [1]`. Now skip 2: call `dfs(2)` again.\n\nLeaf: record `[1]`. `res = [[1, 2], [1]]`.",
        visual: tree(SUB_TREE, { 0: "accent", 1: "accent", 3: "neutral", 4: "good" }, { 3: "done", 4: "record" }, "path = [1]"),
      },
      {
        kind: "read",
        title: "Walk it: the right half",
        body: "Back in `dfs(0)`: undo, so `path = []`. Skip 1: `dfs(1)`.\n\nTake 2: `path = [2]`, leaf, record `[2]`. Undo, skip 2: leaf, record `[]`.\n\n`res = [[1, 2], [1], [2], []]`. Four leaves, four subsets, and one `path` list did all the work.",
        visual: tree(SUB_TREE, { 0: "accent", 2: "accent", 5: "good", 6: "good" }, { 3: "1st", 4: "2nd", 5: "3rd", 6: "4th" }, "`res = [[1,2], [1], [2], []]`"),
      },
      {
        kind: "read",
        title: "Count the leaves",
        body: "The cost of a search is about the number of leaves.\n- **Subsets:** 2 choices per element, so 2^n leaves. With copying, O(2^n · n).\n- **Permutations** (every ordering): n! leaves.\n\nThat's why the constraint matters. 2^20 ≈ 10^6 is fine. 2^25 is too slow in Python. 10! ≈ 3.6·10^6 is borderline in CPython, and 12! is not feasible.",
        visual: {
          kind: "table",
          headers: ["n", "2^n (subsets)", "n! (orderings)"],
          rows: [["8", "256", "40,320"], ["10", "1,024", "3,628,800"], ["12", "4,096", "479,001,600"], ["20", "1,048,576", "far too many"], ["25", "33,554,432", "far too many"]],
          caption: "Python handles about 10^7 simple steps per second in CPython.",
        },
      },
      {
        kind: "quiz",
        teach: "Count the leaves: subsets give 2^n, orderings give n!. Python manages roughly 10^7 simple steps per second, and 12! is about 4.8·10^8.",
        prompt: "n ≤ 12, and the task is to list every ordering of the items. Is a plain n! search OK in Python?",
        options: ["Yes, 12! is small", "No, 12! is far too many leaves", "Only with a bitmask loop"],
        answer: 1,
        explain: "12! ≈ 4.8·10^8 leaves, far past 10^7 per second. Orderings are safe up to about n = 9 or 10. At n = 12 you need a smarter idea.",
      },
      {
        kind: "widget",
        widget: "recursion-tree",
        title: "Subsets: take or skip",
        task: "Run subsets on [1, 2, 3] and step through it. Count the leaves at the end: does it match 2^3?",
        props: { mode: "subsets" },
      },
      {
        kind: "read",
        title: "Template: subsets",
        body: "Line by line:\n- At a leaf (`i == len(nums)`), record `path[:]`, a copy.\n- Otherwise: choose `nums[i]`, recurse, undo with `pop()`, then recurse again to skip it.\n\nThe `setrecursionlimit` line is harmless here. It's a habit for Days 11–13.\n\nMental test on `[1, 2]`: you just traced it. Output `[[1, 2], [1], [2], []]`.",
        visual: codeV(SUBSETS),
      },
      {
        kind: "code",
        title: "Now type it yourself",
        prompt: "Write `subsets(nums)` from memory with choose → recurse → undo. Return every subset (any order).",
        starter: py("# Subsets: take / skip", "# leaf: record a copy. else: choose, recurse, undo, recurse (skip)", "def subsets(nums):", "    pass"),
        solution: SUBSETS,
        tests: [
          { call: "sorted(subsets([1, 2, 3]))", expect: "sorted([[], [1], [2], [3], [1, 2], [1, 3], [2, 3], [1, 2, 3]])" },
          { call: "sorted(subsets([1, 2]))", expect: "[[], [1], [1, 2], [2]]" },
          { call: "subsets([])", expect: "[[]]", label: "empty input: one subset" },
          { call: "len(subsets([4, 5, 6, 7, 8]))", expect: "32", label: "2^5 leaves" },
        ],
        teach: "Keep one `path`. At a leaf append `path[:]`. Otherwise append nums[i], recurse with i+1, pop, recurse with i+1 again.",
        explain: "2^n leaves, O(2^n · n) with the copies.",
        fromMemory: true,
      },
      {
        kind: "read",
        title: "Copy at the leaf",
        body: "`res.append(path)` without `[:]` appends the **same list object** every time. The search keeps changing that one list, and by the end it has been popped back to empty.\n\nSo `res` ends up as 4 references to one empty list: `[[], [], [], []]`.",
        callout: { type: "trap", text: "Always copy at the leaf: `res.append(path[:])`." },
      },
      {
        kind: "read",
        title: "Permutations: a used[] array",
        body: "For orderings, each level picks **any unused** element. A `used[]` array marks what is already in `path`.\n\nOn `[1, 2, 3]`: choose 1 (used[0] = True), then 2, then 3. `path = [1, 2, 3]` has length n: a leaf. Record it.",
        visual: arr([
          { label: "nums", items: [1, 2, 3], tones: { 0: "warn", 1: "warn", 2: "warn" } },
          { label: "used", items: ["T", "T", "T"] },
          { label: "path", items: [1, 2, 3], tones: { 0: "good", 1: "good", 2: "good" } },
        ], "Leaf: record [1, 2, 3]."),
      },
      {
        kind: "read",
        title: "Permutations: undo and try the next",
        body: "Undo 3 (used[2] = False), then undo 2. Back at depth 1, the loop moves on: 3 is unused, so choose it. `path = [1, 3]`. Then 2 is the only one left: `[1, 3, 2]`, record.\n\nAfter all of 1's branches, undo 1 and start with 2. In total 3! = 6 leaves. Depth is n.",
        visual: arr([
          { label: "nums", items: [1, 2, 3], tones: { 0: "warn", 2: "warn" } },
          { label: "used", items: ["T", "F", "T"] },
          { label: "path", items: [1, 3], tones: { 0: "good", 1: "accent" } },
        ], "path = [1, 3]; next, 2 is the only unused item."),
      },
      {
        kind: "widget",
        widget: "recursion-tree",
        title: "Permutations",
        task: "Step through permutations of [1, 2, 3]. Watch used[] flip to True on the way down and back to False on the way up. Count the leaves: 3! = 6?",
        props: { mode: "permutations" },
      },
      {
        kind: "code",
        title: "Write permutations",
        prompt: "Write `permute(nums)`: every ordering of distinct `nums`, using a `used[]` array.",
        starter: py("def permute(nums):", "    pass"),
        solution: PERMUTE,
        tests: [
          { call: "sorted(permute([1, 2, 3]))", expect: "[[1, 2, 3], [1, 3, 2], [2, 1, 3], [2, 3, 1], [3, 1, 2], [3, 2, 1]]" },
          { call: "permute([1])", expect: "[[1]]", label: "one element" },
          { call: "len(permute([1, 2, 3, 4]))", expect: "24", label: "4! leaves" },
          { call: "permute([])", expect: "[[]]", label: "empty" },
        ],
        teach: "At each level loop over all i. Skip used ones. Mark used, append, recurse, pop, unmark. Record a copy when len(path) == len(nums).",
        explain: "n! leaves, depth n.",
      },
      {
        kind: "read",
        title: "Combinations: a start index",
        body: "For combinations (order doesn't matter), loop `j` from a **start index**, and recurse with `dfs(j + 1, ...)`. Items before `start` are never picked again, so `[1, 2]` and `[2, 1]` can't both appear.\n\n`dfs(j + 1, ...)` means each item is used **once**. `dfs(j, ...)` means unlimited reuse (LC 39 Combination Sum).\n\nExample: `cands = [1, 1, 2]`, target 3. Take 1, take 2: remain 0, record `[1, 2]`.",
        visual: arr([
          { label: "cands", items: [1, 1, 2], pointers: [{ at: 0, label: "j=0" }, { at: 2, label: "j=2" }], tones: { 0: "good", 2: "good" } },
          { label: "path", items: [1, 2], tones: { 0: "good", 1: "good" } },
        ], "Depth 0 took index 0, depth 1 took index 2. remain = 0: record [1, 2]."),
        callout: { type: "mistake", text: "`dfs(j + 1, ...)` = each item once. `dfs(j, ...)` = unlimited reuse. Mixing them up gives wrong counts that still pass the sample." },
      },
      {
        kind: "read",
        title: "Skip duplicates at the same depth",
        body: "Back at depth 0, the loop reaches j = 1. But `cands[1] == cands[0]`: starting with this second 1 would rebuild `[1, 2]` exactly.\n\nSo: sort first, and at the same depth skip a value equal to its left neighbour (`j > start and cands[j] == cands[j-1]`). Deeper levels may still use it, so `[1, 1, ...]` stays possible.",
        visual: arr([
          { label: "cands", items: [1, 1, 2], pointers: [{ at: 1, label: "j=1" }], tones: { 0: "neutral", 1: "bad" } },
          { label: "path", items: ["·"] },
        ], "Depth 0, j = 1: same value as j = 0, so skip this branch."),
      },
      {
        kind: "read",
        title: "Pruning",
        body: "**[[Pruning]]** stops a branch as soon as it can't succeed. It turns slow into fast.\n- Running sum already over target? Stop. With **sorted** input, use `break`, not `continue`: every later item is even bigger.\n- In N-Queens, stop as soon as the queen's column or diagonal is taken.\n\nThe template below has both tricks: the duplicate skip and the `break`.",
        visual: codeV(COMBO),
      },
      {
        kind: "widget",
        widget: "recursion-tree",
        title: "Pruning",
        task: "Run the combination-sum search and watch branches turn grey the moment the sum passes the target. Compare the call count with and without the cut.",
        props: { mode: "pruning" },
      },
      {
        kind: "code",
        title: "Write combination sum with duplicates",
        prompt: "Write `combo_sum_unique(cands, target)`: all unique combinations that sum to `target`, each item used at most once. `cands` may contain duplicates (LC 40).",
        starter: py("def combo_sum_unique(cands, target):", "    pass"),
        solution: COMBO,
        tests: [
          { call: "sorted(combo_sum_unique([10, 1, 2, 7, 6, 1, 5], 8))", expect: "[[1, 1, 6], [1, 2, 5], [1, 7], [2, 6]]" },
          { call: "combo_sum_unique([1, 1, 2], 3)", expect: "[[1, 2]]", label: "no duplicate answers" },
          { call: "sorted(combo_sum_unique([2, 5, 2, 1, 2], 5))", expect: "[[1, 2, 2], [5]]" },
          { call: "combo_sum_unique([3], 1)", expect: "[]", label: "nothing fits" },
        ],
        teach: "Sort. Loop j from start. Skip if j > start and cands[j] == cands[j-1]. Break if cands[j] > remain. Choose, recurse with j + 1, undo.",
        explain: "Change `dfs(j + 1, ...)` to `dfs(j, ...)` and drop the duplicate skip, and you have LC 39.",
      },
      {
        kind: "quiz",
        teach: "In the combination template the recursive call's first argument is where the next level's loop starts. Starting at j + 1 forbids picking j again.",
        prompt: "LC 39 Combination Sum lets you reuse each candidate as many times as you like. Which recursive call do you write?",
        options: ["`dfs(j, remain - cands[j])`", "`dfs(j + 1, remain - cands[j])`", "`dfs(start + 1, remain - cands[j])`"],
        answer: 0,
        explain: "`dfs(j, ...)` lets the next level start at j again, so the same item can be picked again. `j + 1` means each item at most once.",
      },
      {
        kind: "read",
        title: "N-Queens",
        body: "Place n queens on an n×n board so none attack each other. Put **one queen per row**, and choose its column.\n\nKeep three sets: used columns, used `r - c` (one diagonal direction) and used `r + c` (the other). A square is safe if none of its three keys is in a set. Place, recurse to the next row, then remove the keys (undo).",
        visual: {
          kind: "grid",
          cells: [["", "Q", "", ""], ["", "", "", "Q"], ["Q", "", "", ""], ["", "", "Q", ""]],
          tones: { "0,1": "good", "1,3": "good", "2,0": "good", "3,2": "good" },
          caption: "A 4-queens answer. Every row, column and diagonal holds at most one queen.",
        },
      },
      {
        kind: "widget",
        widget: "recursion-tree",
        title: "N-Queens",
        task: "Solve 4 queens step by step. Watch a queen get placed, a dead end found, and the queen removed (undo). How many full solutions does 4 queens have?",
        props: { mode: "n-queens", n: 4 },
      },
      {
        kind: "read",
        title: "Grid search: mark and unmark",
        body: "LC 79 Word Search: can you trace a word on a letter grid by moving to neighbours, never reusing a cell?\n\nIt's backtracking on a grid. Mark the cell as used (choose), try all 4 neighbours (recurse), then unmark it (undo), so other paths may use it later.",
        visual: {
          kind: "grid",
          cells: [["H", "E", "L"], ["X", "O", "L"]],
          tones: { "0,0": "accent", "0,1": "accent", "0,2": "accent", "1,2": "accent", "1,1": "good" },
          arrows: [{ from: [0, 0], to: [0, 1] }, { from: [0, 1], to: [0, 2] }, { from: [0, 2], to: [1, 2] }, { from: [1, 2], to: [1, 1] }],
          caption: "Tracing HELLO. Each cell is marked while it's on the path.",
        },
      },
      {
        kind: "read",
        title: "Recursion depth in Python",
        body: "Python's default **[[recursion limit]]** is 1000 frames. Backtracking depth is at most n ≤ 20, so today is safe. Trees and graphs (Days 11–13) can reach depth 10^5, and they **will** crash. Two fixes:\n- `sys.setrecursionlimit(10**6)` at the top. Usually enough on LeetCode. On Codeforces it can still crash, because the C stack runs out before the limit does.\n- Rewrite with an explicit stack, or use the `bootstrap` decorator (Chapter 3). Day 11 has the iterative tree version.",
      },
      {
        kind: "read",
        title: "Subsets without recursion",
        body: "A **[[bitmask]]** loop lists subsets with no recursion at all. Each number from 0 to 2^n − 1 is one subset: bit i set means element i is in.\n\nIt's fine for n ≤ 15 in CPython and n ≤ 20 in PyPy.",
        visual: codeV(py(
          "n = len(nums)",
          "for mask in range(1 << n):",
          "    subset = [nums[i] for i in range(n) if mask >> i & 1]",
        ), "mask = 0b101 on [a, b, c] means {a, c}."),
      },
      {
        kind: "read",
        title: "15-second clues",
        body: "- n ≤ 20 and \"subsets\", \"choose any group\" → 2^n search.\n- n ≤ 10 and \"arrange\", \"order\", \"permutations\" → n! search.\n- \"Return all combinations / partitions / boards\" → backtracking.\n- Grid + \"find a word / path that doesn't reuse a cell\" → DFS with mark and unmark.\n- \"Split n items into k groups with equal sum\", n ≤ 16 → backtracking with pruning (or bitmask DP on Day 19).\n- Duplicates + \"unique combinations\" → sort, then skip equal neighbours at the same depth.",
        callout: { type: "clue", text: "Tiny n + \"all\" → backtracking. Check 2^n or n! against about 10^7 first." },
      },
      {
        kind: "quiz",
        teach: "Match the constraint to the leaf count: 2^n for choosing groups, n! for orderings.",
        prompt: "\"Given n ≤ 18 numbers, can you choose some of them so their sum is exactly S?\" Which search fits?",
        options: ["Subsets: take / skip, 2^n", "Permutations with used[], n!", "Heap of size k"],
        answer: 0,
        explain: "\"Choose some\" = subsets. 2^18 ≈ 2.6·10^5 leaves, easily fast enough. Order doesn't matter, so permutations would waste n! work.",
      },
      {
        kind: "summary",
        points: [
          "Backtracking = choose, recurse, undo, on one shared path list.",
          "Leaves: subsets 2^n (fine to n = 20), permutations n! (borderline at 10, impossible at 12).",
          "Copy at the leaf: `path[:]`.",
          "Combinations: start index; j + 1 = once, j = reuse; sort and skip equal neighbours at the same depth.",
          "Prune early: break on sorted overshoot; sets for columns and diagonals in N-Queens.",
        ],
      },
    ],
  },

  /* =====================================================================
     Day 10 B: drill
     ===================================================================== */
  {
    id: "ch05-l6",
    day: 10,
    title: "Day 10 drill: Backtracking",
    goal: "Name the right search in 15 seconds and work Day 10's problem list.",
    minutes: 10,
    steps: [
      {
        kind: "read",
        title: "Recap",
        body: "Today's idea in four lines:\n- Tiny n + \"list all / count all / any arrangement\" → backtracking: choose, recurse, undo.\n- Subsets: take or skip, 2^n. Permutations: `used[]`, n!.\n- Combinations: start index; sort + skip equal neighbours for unique answers.\n- Prune as early as you can.\n\nThis lesson: 5 disguised problems, then the problem list and the end-of-day check.",
        visual: {
          kind: "compare",
          left: { title: "2^n (subsets)", points: ["\"choose any group\"", "safe to n ≈ 20"] },
          right: { title: "n! (orderings)", points: ["\"arrange\", \"every order\"", "safe to n ≈ 9–10"] },
        },
      },
      {
        kind: "quiz",
        teach: "Splitting items into two piles means deciding, for each item, which pile it goes in.",
        prompt: "Given 15 weights, decide whether they can be split into two piles of exactly equal weight, and list one way.",
        options: ["Subset search, 2^n (n ≤ 20)", "Permutations, n!", "Greedy: put each weight on the lighter pile", "Two heaps"],
        answer: 0,
        explain: "Each weight goes in pile A or pile B: a subset. 2^15 ≈ 3.3·10^4 leaves. The lighter-pile greedy fails on small cases (try 3, 3, 2, 2, 2).",
      },
      {
        kind: "quiz",
        teach: "Each position of the output has a small set of options, and you want every combination of choices.",
        prompt: "A phone keypad maps digits to letters. List every word a digit string could spell.",
        options: ["Backtracking, one choice per digit", "Subsets: take / skip", "Sliding window", "Sort + greedy"],
        answer: 0,
        explain: "Each level is a digit, each branch one of its letters. \"List every\" + tiny input = backtracking.",
      },
      {
        kind: "read",
        title: "Notice the signal",
        body: "\"Split into two groups\" is take/skip in disguise: each item picks a side. \"List every word\" is one choice per position. In both, the word **every** plus a tiny input is the trigger.",
      },
      {
        kind: "quiz",
        teach: "Think about what a piece attacks: its row, its column, and its diagonals.",
        prompt: "Place 8 rooks-that-also-attack-diagonally on a board so none attack each other. Count the ways.",
        options: ["N-Queens backtracking with column and both diagonal sets", "Permutations with used[] and no other checks", "Subsets: take / skip", "Greedy, row by row"],
        answer: 0,
        explain: "A rook that also attacks diagonally is a queen. One per row, sets for columns, r − c and r + c. Plain permutations miss the diagonal check.",
      },
      {
        kind: "quiz",
        teach: "Ask whether the order of the chosen items matters in the output.",
        prompt: "Given up to 9 distinct digits, print every ordering.",
        options: ["Permutations with used[], n!", "Subsets, 2^n", "Combinations with a start index", "N-Queens"],
        answer: 0,
        explain: "\"Every ordering\" = permutations. 9! = 362,880 leaves, fine.",
      },
      {
        kind: "read",
        title: "Notice the signal",
        body: "\"Attacks diagonally\" pointed to the diagonal sets of N-Queens. \"Every ordering\" pointed to `used[]`. The last one moves the search onto a grid.",
      },
      {
        kind: "quiz",
        teach: "A path on a grid that can't reuse a cell needs a way to mark cells while they are on the path, and to free them afterwards.",
        prompt: "Grid of letters. Can you trace \"HELLO\" by moving to neighbours without reusing a cell?",
        options: ["Grid DFS with mark and unmark", "Subsets: take / skip", "Permutations", "Sliding window on each row"],
        answer: 0,
        explain: "This is LC 79 Word Search: mark the cell, recurse 4 ways, unmark.",
      },
      {
        kind: "practice",
        title: "Today's problems",
        intro: PRACTICE_RULES,
        problems: [
          { ref: "LC 1863 Sum of All Subset XOR Totals", tier: "warm", lvl: "E", box: 10, clue: "n ≤ 12 → enumerate all subsets (take/skip)" },
          { ref: "LC 78 Subsets", tier: "core", lvl: "M", box: 15, clue: "The template. Then redo it with a bitmask loop" },
          { ref: "LC 46 Permutations", tier: "core", lvl: "M", box: 15, clue: "`used[]` array, depth = n" },
          { ref: "LC 39 Combination Sum", tier: "core", lvl: "M", box: 20, clue: "Unlimited reuse → recurse with `j`, not `j + 1`" },
          { ref: "LC 40 Combination Sum II", tier: "core", lvl: "M", box: 20, clue: "Duplicates in input → sort + skip at the same depth" },
          { ref: "LC 79 Word Search", tier: "core", lvl: "M", box: 25, clue: "Grid DFS. Mark the cell, recurse 4 ways, unmark" },
          { ref: "LC 51 N-Queens", tier: "stretch", lvl: "H", box: 30, clue: "One queen per row. Sets for columns, `r - c`, `r + c`" },
          { ref: "CSES — Apple Division", tier: "stretch", lvl: "CSES", box: 20, clue: "n ≤ 20 → try all 2^n splits. Use PyPy" },
          { ref: "Codeforces problemset, rating 1000–1300, tag brute force, solve 1", tier: "stretch", lvl: "CF", box: 25, clue: "Check the constraint first. Is 2^n or n! under ~10^7?" },
        ],
      },
      {
        kind: "reveal",
        prompt: "End-of-day check 1: write the leaf count for subsets and for permutations. Which n is the safe limit for each in Python?",
        answer: "Subsets: 2^n leaves; 2^20 ≈ 10^6 is fine, 2^25 is too slow. Permutations: n! leaves; 10! ≈ 3.6·10^6 is borderline in CPython, 12! is not feasible.",
      },
      {
        kind: "reveal",
        prompt: "End-of-day check 2: why does `res.append(path)` break, and what's the fix?",
        answer: "It appends the same list object every time. The search keeps changing it and finally pops it back to empty, so every entry ends up empty. Fix: append a copy, `res.append(path[:])`.",
      },
      {
        kind: "reveal",
        prompt: "End-of-day check 3: what happens in Python if a DFS goes 10^5 deep with default settings, and what are the two fixes?",
        answer: "It hits the default limit of 1000 frames and raises RecursionError. Fix 1: sys.setrecursionlimit(10**6) (can still crash on Codeforces when the C stack runs out). Fix 2: rewrite with an explicit stack, or use the bootstrap decorator.",
      },
      {
        kind: "summary",
        points: [
          "\"Every / all\" + tiny n → backtracking. Check 2^n or n! against 10^7.",
          "Choose groups → subsets. Orderings → permutations with used[].",
          "Attacks on rows, columns, diagonals → N-Queens sets.",
          "Grid path without reuse → mark, recurse 4 ways, unmark.",
          SUMMARY_END,
        ],
      },
    ],
  },

  /* =====================================================================
     Day 11 A: trees
     ===================================================================== */
  {
    id: "ch05-l7",
    day: 11,
    title: "Day 11: Trees",
    goal: "Solve a tree problem by deciding what each node returns to its parent, and write it iteratively when depth can hit 10^5.",
    minutes: 12,
    steps: [
      {
        kind: "read",
        title: "One question solves most tree problems",
        body: "Height, diameter, path sums, \"is it balanced\": most tree problems look different but ask the same question underneath. Once you see that question, the code is short.\n\nYou'll also learn to walk a tree level by level, use the sorted order hidden in a search tree, and avoid Python's recursion crash on very deep trees.\n\n**Goal:** solve a tree problem by deciding what each node returns to its parent, and write it iteratively when depth can hit 10^5.",
      },
      {
        kind: "quiz",
        guess: true,
        prompt: "A node's left subtree has height 1 and its right subtree has height 2. What is the height of the node's own subtree (counting nodes on the longest downward path)?",
        options: ["2", "3", "4"],
        answer: 1,
        explain: "3. The node adds itself on top of its taller child: 1 + max(1, 2) = 3. A node only needs its children's answers to compute its own.",
      },
      {
        kind: "read",
        title: "What does a node hand to its parent?",
        body: "In a **binary tree**, each node has at most two children, left and right. A **leaf** has none.\n\nMost tree problems are one question: **what does a node need from its children, and what does it hand to its parent?** Write it as a sentence first: \"each node returns its height.\"\n\nChildren must finish before the parent. That order is **[[post-order]]**. Every node is visited once: O(n).",
        visual: tree(T1, {}, {}, "[3, 9, 20, null, null, 15, 7] in level order."),
      },
      {
        kind: "read",
        title: "Height, bottom up: the leaves",
        body: "A missing child returns 0. So each leaf returns 1 + max(0, 0) = **1**.\n\nThe leaves here are 9, 15 and 7.",
        visual: tree(T1, { 1: "good", 5: "good", 6: "good" }, { 1: "h=1", 5: "h=1", 6: "h=1" }),
      },
      {
        kind: "read",
        title: "Height: node 20",
        body: "Node 20 gets 1 from 15 and 1 from 7. It returns 1 + max(1, 1) = **2**.\n\nIt never looks deeper than its own children. Their answers already summarise everything below.",
        visual: tree(T1, { 1: "good", 2: "accent", 5: "good", 6: "good" }, { 1: "h=1", 2: "h=2", 5: "h=1", 6: "h=1" }),
      },
      {
        kind: "read",
        title: "Height: the root",
        body: "The root 3 gets 1 from 9 and 2 from 20. It returns 1 + max(1, 2) = **3**.\n\nThat's LC 104 Maximum Depth: `return 1 + max(height(left), height(right))`, with 0 for a missing node.",
        visual: tree(T1, { 0: "accent", 1: "good", 2: "good", 5: "good", 6: "good" }, { 0: "h=3", 1: "h=1", 2: "h=2", 5: "h=1", 6: "h=1" }),
      },
      {
        kind: "read",
        title: "Return one side, keep the best of both",
        body: "The **diameter** is the longest path between any two nodes, counted in edges. It may bend through a node: down the left and down the right.\n\nBut a parent can only extend **one** side of a child's path. So keep two things apart:\n- The **return value**: height, one side.\n- A **global best**: left + right, both sides.\n\nOn `[1, 2, 3, 4, 5]`: leaves 4, 5 and 3 return 1. Node 2 sees l = 1, r = 1, so best = 2, and it returns 2.",
        visual: tree(T_DIAM, { 1: "accent", 3: "good", 4: "good" }, { 1: "h=2, best=2", 3: "h=1", 4: "h=1", 2: "h=1" }),
      },
      {
        kind: "read",
        title: "Diameter at the root",
        body: "The root sees l = 2 (from node 2) and r = 1 (from node 3). best = max(2, 2 + 1) = **3**: the path 4 → 2 → 1 → 3.\n\nThe root returns 1 + max(2, 1) = 3 as its height, but nobody uses that. The answer is `best`.\n\nThe same trick solves LC 124 Maximum Path Sum: return `node.val + max(0, l, r)`, and update best with both sides.",
        visual: tree(T_DIAM, { 0: "accent", 1: "good", 2: "good", 3: "good" }, { 0: "best=3", 1: "h=2", 2: "h=1", 3: "h=1", 4: "h=1" }, "Longest path: 4 → 2 → 1 → 3, 3 edges."),
      },
      {
        kind: "number",
        teach: "Each node returns 1 + max(l, r) to its parent and updates best with l + r. A missing child gives 0.",
        prompt: "Tree `[1, 2, 3, 4, 5, null, null, 6]` (6 is the left child of 4). What is the diameter, in edges?",
        visual: tree([1, 2, 3, 4, 5, null, null, 6]),
        answer: 4,
        tolerance: 0.4,
        unit: "edges",
        explain: "6: h=1. 4: h=2. 5: h=1. Node 2: l=2, r=1, best=3, h=3. Node 3: h=1. Root: l=3, r=1, best=4. Path 6 → 4 → 2 → 1 → 3.",
      },
      {
        kind: "widget",
        widget: "tree-walk",
        title: "DFS that returns a value",
        task: "Step through the height DFS. Watch the call stack grow on the way down and each node's value appear only after both children return.",
        props: { mode: "dfs-return" },
      },
      {
        kind: "read",
        title: "Template: diameter",
        body: "Line by line:\n- `height(None)` returns 0.\n- Get `l` and `r` from the children first (post-order).\n- `best = max(best, l + r)`: the path through this node, both sides.\n- `return 1 + max(l, r)`: the parent extends only one side.\n- `nonlocal best` lets the inner function update the outer variable.\n\nMental test on `[1, 2, 3, 4, 5]`: best becomes 2 at node 2, then 3 at the root. Returns 3.",
        visual: codeV(DIAMETER),
      },
      {
        kind: "code",
        title: "Now type it yourself",
        prompt: "Write `diameter(root)` from memory: the longest path between two nodes, in edges. `TreeNode` and `build` (level order to tree) are given; keep them.",
        starter: TREE_HEAD + py("# DFS returns height; global best = l + r", "def diameter(root):", "    pass"),
        solution: TREE_HEAD + DIAMETER,
        tests: [
          { call: "diameter(build([1, 2, 3, 4, 5]))", expect: "3" },
          { call: "diameter(build([1, 2, 3, 4, 5, None, None, 6]))", expect: "4" },
          { call: "diameter(build([1, 2, None, 3, None, 4]))", expect: "3", label: "a line of 4 nodes" },
          { call: "diameter(build([1]))", expect: "0", label: "one node" },
          { call: "diameter(build([]))", expect: "0", label: "empty tree" },
        ],
        teach: "Inner function height(node): 0 for None; get l and r; best = max(best, l + r); return 1 + max(l, r).",
        explain: "O(n). For LC 543 this is the whole solution.",
        fromMemory: true,
      },
      {
        kind: "read",
        title: "Found it here? Lowest common ancestor",
        body: "LC 236: the **lowest common ancestor** (LCA) of p and q is the deepest node with both below it (a node counts as below itself).\n\nEach node returns \"p or q found in my subtree\": itself if it is p or q, else whichever child side found something. The **first** node where both sides return non-null is the answer.\n\np = 6, q = 8: node 5's left returns 6; node 1's right returns 8. At 3 both sides are non-null, so the LCA is 3.",
        visual: tree([3, 5, 1, 6, 2, 0, 8], { 0: "good", 1: "accent", 2: "accent", 3: "warn", 6: "warn" }, { 0: "both sides: LCA", 1: "returns 6", 2: "returns 8" }),
      },
      {
        kind: "read",
        title: "BFS by levels",
        body: "To walk a tree **level by level**, use **[[BFS]]** (breadth-first search) with a queue.\n\nThe trick: at the start of each outer loop, the queue holds **exactly one level**. So `len(q)` tells you how many nodes to pop for this level.\n\nStart: `q = [3]`. Pop 1 node: 3. Push its children 9 and 20. Row `[3]`.",
        visual: arr([
          { label: "queue", items: [9, 20], tones: { 0: "accent", 1: "accent" } },
          { label: "out", items: ["[3]"], tones: { 0: "good" } },
        ], "After level 0: the queue holds level 1."),
      },
      {
        kind: "read",
        title: "BFS: the next levels",
        body: "`len(q) = 2`, so pop 2 nodes: 9 (no children), then 20 (push 15 and 7). Row `[9, 20]`.\n\n`len(q) = 2` again: pop 15 and 7, no children. Row `[15, 7]`. The queue is empty: done.\n\nOutput: `[[3], [9, 20], [15, 7]]`. The **right side view** is the last item of each row; the **left side view** is the first.",
        visual: arr([
          { label: "queue", items: ["·"] },
          { label: "out", items: ["[3]", "[9,20]", "[15,7]"], tones: { 0: "good", 1: "good", 2: "good" } },
        ], "Three levels, one row each."),
      },
      {
        kind: "widget",
        widget: "tree-walk",
        title: "BFS by levels",
        task: "Step through the level-order walk. At the start of each level, check that the queue length equals the number of nodes on that level.",
        props: { mode: "bfs-levels" },
      },
      {
        kind: "code",
        title: "Write BFS by levels",
        prompt: "Write `levels(root)`: a list of rows, one per level, left to right.",
        starter: TREE_HEAD + py("def levels(root):", "    pass"),
        solution: TREE_HEAD + LEVELS,
        tests: [
          { call: "levels(build([3, 9, 20, None, None, 15, 7]))", expect: "[[3], [9, 20], [15, 7]]" },
          { call: "levels(build([1, 2, 3, 4, None, None, 5]))", expect: "[[1], [2, 3], [4, 5]]" },
          { call: "levels(build([1]))", expect: "[[1]]", label: "one node" },
          { call: "levels(build([]))", expect: "[]", label: "empty tree" },
        ],
        teach: "deque with the root. While q: row = []; for _ in range(len(q)): popleft, record, push children. Append row.",
        explain: "`for _ in range(len(q))` freezes the level size before you push the next level.",
      },
      {
        kind: "quiz",
        teach: "BFS by levels gives one row per level, left to right. Looking from one side, you see one node per level: the one closest to that side.",
        prompt: "BFS by levels gives `[[3], [9, 20], [15, 7]]`. Looking at the tree from the right side, which values do you see, top to bottom?",
        options: ["[3, 20, 7]", "[3, 9, 15]", "[3, 20, 15]", "[3, 9, 20, 15, 7]"],
        answer: 0,
        explain: "The last value of each row: 3, 20, 7. Taking the first of each row would give the left side view, [3, 9, 15].",
      },
      {
        kind: "read",
        title: "BST: in-order is sorted",
        body: "A **[[binary search tree]]** (BST) keeps every value in a node's left subtree smaller than the node, and every value in its right subtree bigger.\n\n**In-order** traversal visits left, then the node, then right. On a BST that visits the values in **sorted order**. So \"kth smallest\" (LC 230) is: walk in-order and stop at the k-th node.",
        visual: tree([5, 3, 8, 2, 4, 7, 9], {}, { 3: "1st", 1: "2nd", 4: "3rd", 0: "4th", 5: "5th", 2: "6th", 6: "7th" }, "In-order: 2, 3, 4, 5, 7, 8, 9."),
      },
      {
        kind: "read",
        title: "Validate a BST with bounds",
        body: "Checking only `left.val < node.val < right.val` is not enough. Here 6 is the right child of 3, and 3 < 6 looks fine. But 6 sits in 5's **left** subtree, so it must be below 5. It isn't.\n\nThe fix: pass `(low, high)` bounds down. Going left, the node's value becomes the new `high`; going right, it becomes the new `low`. Or check that the in-order sequence is strictly increasing.",
        visual: tree([5, 3, 8, null, 6], { 4: "bad" }, { 4: "must be in (3, 5)" }),
        callout: { type: "mistake", text: "Validating a BST by comparing a node only with its children. A deep node can still break an ancestor's rule. Pass bounds down." },
      },
      {
        kind: "widget",
        widget: "tree-walk",
        title: "BST search and validate",
        task: "Search for a value and watch each step go left or right by one comparison. Then run validate and watch the (low, high) bounds narrow on the way down.",
        props: { mode: "bst" },
      },
      {
        kind: "quiz",
        teach: "Every node must fit the bounds set by all its ancestors: going left caps the value from above, going right raises the floor.",
        prompt: "Is `[10, 5, 15, null, null, 6, 20]` a valid BST? (6 is the left child of 15.)",
        visual: tree([10, 5, 15, null, null, 6, 20]),
        options: ["Yes, every child is on the correct side of its parent", "No, 6 is in 10's right subtree but smaller than 10"],
        answer: 1,
        explain: "6 < 15 is fine locally, but 6 is in 10's right subtree, so its bounds are (10, 15). 6 < 10 breaks the rule.",
      },
      {
        kind: "read",
        title: "Why iterative",
        body: "A skewed tree (a linked list in disguise), or a CSES tree with 2·10^5 nodes, is that deep. Recursive Python can crash at that depth even after `setrecursionlimit`, because the C stack runs out. On PyPy, deep recursion is also slow.\n\nThe fix is post-order with an **explicit stack**. Push `(node, False)`. When popped with `False`, push it back as `(node, True)` and then its children. When popped with `True`, its children are done: compute its value.",
        callout: { type: "trap", text: "Recursive DFS on CSES or Codeforces trees gives RecursionError or a silent \"Runtime Error\". If n can be 10^5 and the tree can be a line, go iterative. Don't gamble." },
      },
      {
        kind: "read",
        title: "Explicit stack, on [1, 2, 3]",
        body: "Pop `(1, F)`: push `(1, T)`, then `(2, F)`, then `(3, F)`.\n\nPop `(3, F)`: push `(3, T)`, no children. Pop `(3, T)`: h[3] = 1 + max(0, 0) = 1.\n\nPop `(2, F)`, then `(2, T)`: h[2] = 1.\n\nPop `(1, T)`: both children are in `h`, so h[1] = 1 + max(1, 1) = 2.",
        visual: arr([
          { label: "stack", items: ["(1,T)", "(2,F)", "(3,F)"], tones: { 2: "accent" }, pointers: [{ at: 2, label: "top" }] },
          { label: "h", items: ["None:0"] },
        ], "After the first pop. The top of the stack is on the right."),
      },
      {
        kind: "widget",
        widget: "tree-walk",
        title: "Iterative traversal",
        task: "Run the explicit-stack walk. Watch each node get pushed twice: once to expand it, once to finish it after its children.",
        props: { mode: "iterative" },
      },
      {
        kind: "code",
        title: "Write the (node, done) stack",
        prompt: "Write `height_iter(root)` with an explicit stack of `(node, done)` pairs. No recursion. The last test is a 2000-node line, deeper than Python's default recursion limit.",
        starter: TREE_HEAD + py("def height_iter(root):", "    pass"),
        solution: TREE_HEAD + HEIGHT_ITER,
        tests: [
          { call: "height_iter(build([3, 9, 20, None, None, 15, 7]))", expect: "3" },
          { call: "height_iter(build([1]))", expect: "1", label: "one node" },
          { call: "height_iter(build([]))", expect: "0", label: "empty tree" },
          { call: "height_iter(build([1] + [x for i in range(2, 2001) for x in (None, i)]))", expect: "2000", label: "a 2000-deep line" },
        ],
        teach: "h = {None: 0}. Stack of (node, False). Pop: if done, h[node] = 1 + max(h[left], h[right]); else push (node, True) then its children with False.",
        explain: "Each node is pushed twice, so O(n), and depth never touches Python's call stack.",
      },
      {
        kind: "read",
        title: "Trees given as edges: reverse the DFS order",
        body: "Contest trees often come as an edge list with n up to 2·10^5. Build an [[adjacency list]], then:\n1. Walk an iterative DFS from the root and record the visit `order`. A parent always appears before its children.\n2. Process `order` **reversed**: now children come before parents. That is post-order, with no recursion.\n\nPath 0–1–2 rooted at 0: order = [0, 1, 2], parent = [−1, 0, 1].",
        visual: arr([
          { label: "order", items: [0, 1, 2] },
          { label: "parent", items: [-1, 0, 1] },
          { label: "size", items: [1, 1, 1] },
        ], "Every size starts at 1 (the node itself).", true),
      },
      {
        kind: "read",
        title: "Reverse order: add sizes up",
        body: "Walk `order` backwards.\n- u = 2: add size[2] = 1 to its parent 1. size[1] = 2.\n- u = 1: add size[1] = 2 to its parent 0. size[0] = 3.\n- u = 0: no parent.\n\nSizes = `[3, 2, 1]`. Correct. CSES Subordinates is exactly this, minus 1 for each node.",
        visual: arr([
          { label: "order", items: [0, 1, 2], pointers: [{ at: 1, label: "u" }] },
          { label: "size", items: [3, 2, 1], tones: { 0: "good", 1: "good" } },
        ], "Children finish before parents.", true),
      },
      {
        kind: "code",
        title: "Write subtree sizes",
        prompt: "Write `subtree_sizes(n, adj, root=0)`: the size of every node's subtree, for a tree given as an adjacency list. Use the reverse-DFS-order trick, no recursion.",
        starter: py("def subtree_sizes(n, adj, root=0):", "    pass"),
        solution: SUBTREE_SIZES,
        tests: [
          { call: "subtree_sizes(3, [[1], [0, 2], [1]])", expect: "[3, 2, 1]", label: "path 0-1-2" },
          { call: "subtree_sizes(4, [[1, 2, 3], [0], [0], [0]])", expect: "[4, 1, 1, 1]", label: "star" },
          { call: "subtree_sizes(5, [[1, 2], [0, 3, 4], [0], [1], [1]])", expect: "[5, 3, 1, 1, 1]" },
          { call: "subtree_sizes(3, [[1], [0, 2], [1]], 2)", expect: "[1, 2, 3]", label: "rooted at 2" },
          { call: "subtree_sizes(1, [[]])", expect: "[1]", label: "one node" },
        ],
        teach: "Iterative DFS with a stack, recording order and parent. Then size = [1] * n, and for u in reversed(order), add size[u] to size[parent[u]].",
        explain: "O(n), no recursion. The same reverse loop works for any \"for every node, something about its subtree\" question.",
      },
      {
        kind: "read",
        title: "15-second clues",
        body: "- Height, depth, diameter, balanced, \"path sum\" → DFS that returns a value to the parent.\n- \"Level by level\", \"right side view\", \"zigzag\", \"minimum depth\" → BFS with `for _ in range(len(q))`.\n- BST + \"kth smallest\", \"validate\", \"sorted order\" → in-order traversal.\n- Answer uses both sides, parent gets one → return one value, update a global best.\n- Edge-list tree, n up to 2·10^5 → adjacency list + iterative DFS.\n- \"For every node, something about its subtree\" → post-order.",
        callout: { type: "clue", text: "First write: \"each node returns ___ and updates ___\". Then pick recursive or iterative from the depth." },
      },
      {
        kind: "summary",
        points: [
          "Decide what each node returns to its parent; children first (post-order), O(n).",
          "Both sides through a node, one side to the parent: return height, update a global best.",
          "BFS levels: `for _ in range(len(q))` pops exactly one level.",
          "BST: in-order is sorted; validate with (low, high) bounds.",
          "Deep trees: explicit (node, done) stack, or reverse DFS order for edge-list trees.",
        ],
      },
    ],
  },

  /* =====================================================================
     Day 11 B: drill
     ===================================================================== */
  {
    id: "ch05-l8",
    day: 11,
    title: "Day 11 drill: Trees",
    goal: "Name the tree technique in 15 seconds and work Day 11's problem list.",
    minutes: 10,
    steps: [
      {
        kind: "read",
        title: "Recap",
        body: "Today's idea in four lines:\n- Decide what a node returns to its parent; keep a global best when the answer uses both sides.\n- BFS by levels: `len(q)` = one level.\n- BST: in-order is sorted; validate with bounds.\n- Deep trees: explicit stack, or reverse DFS order for edge-list trees.\n\nThis lesson: 5 disguised problems, then the problem list and the end-of-day check.",
        visual: {
          kind: "compare",
          left: { title: "DFS returns a value", points: ["height, diameter, path sum", "LCA: \"found p or q here\""] },
          right: { title: "BFS by levels", points: ["level order, side views", "minimum depth, zigzag"] },
        },
      },
      {
        kind: "quiz",
        teach: "Check n and the shape: a huge tree that may be a long line will break recursion. \"Everyone below them\" is a subtree question.",
        prompt: "A company org chart has 200,000 employees. For each one, count everyone below them.",
        options: ["Subtree sizes with iterative post-order (reverse DFS order)", "Recursive DFS returning size, default settings", "BFS by levels", "In-order traversal"],
        answer: 0,
        explain: "\"For every node, something about its subtree\" = post-order. n = 2·10^5 and the chart could be a long chain, so go iterative: subtree size − 1.",
      },
      {
        kind: "quiz",
        teach: "From one side you see one node per level.",
        prompt: "Print the values you'd see looking at a tree from its left side.",
        options: ["BFS by levels, take the first node of each level", "In-order traversal", "DFS that returns height", "Iterative post-order"],
        answer: 0,
        explain: "\"Side view\" = BFS by levels; the left side is the first node of each row.",
      },
      {
        kind: "read",
        title: "Notice the signal",
        body: "\"For each one, everyone below\" was a subtree question, and \"200,000\" told you to avoid recursion. \"From the left side\" was a level question. Read n before you pick recursive or iterative.",
      },
      {
        kind: "quiz",
        teach: "A path between two leaves bends through one highest node, using both of its sides.",
        prompt: "Find the longest walk between any two leaves in a tree.",
        options: ["DFS returns height, global best = l + r (diameter)", "BFS by levels, count the levels", "In-order traversal", "Two heaps"],
        answer: 0,
        explain: "That's the diameter: each node returns its height and updates best with l + r.",
      },
      {
        kind: "quiz",
        teach: "The left < node < right rule gives a traversal order that comes out sorted.",
        prompt: "A tree stores numbers so that left < node < right. Return the 5th smallest.",
        options: ["In-order traversal, stop at k", "BFS by levels", "Size-k heap over all values", "Post-order"],
        answer: 0,
        explain: "It's a BST, so in-order is sorted: stop at the 5th node. A heap works but ignores the order the BST already gives you.",
      },
      {
        kind: "read",
        title: "Notice the signal",
        body: "\"Longest between any two\" meant both sides through a node: return one, keep the best of both. \"left < node < right\" + \"k-th smallest\" meant in-order. The last one asks each node a yes/no question.",
      },
      {
        kind: "quiz",
        teach: "Let each subtree report whether it contains either person, and look for the first node where both reports meet.",
        prompt: "Two people in a family tree. Find their closest shared ancestor.",
        options: ["DFS returns \"found p or q here\"; first node with both sides non-null", "BFS by levels", "In-order traversal", "Diameter-style global best"],
        answer: 0,
        explain: "Lowest common ancestor (LC 236). Each node returns itself if it is p or q, else whichever side found something; where both sides are non-null is the answer.",
      },
      {
        kind: "practice",
        title: "Today's problems",
        intro: PRACTICE_RULES + " Extra if fast: CSES — Tree Diameter (two BFS passes: farthest from any node, then farthest from that).",
        problems: [
          { ref: "LC 104 Maximum Depth of Binary Tree", tier: "warm", lvl: "E", box: 10, clue: "Write it recursive, then with the `(node, done)` stack" },
          { ref: "LC 543 Diameter of Binary Tree", tier: "warm", lvl: "E", box: 15, clue: "Return height, update best with l + r" },
          { ref: "LC 102 Binary Tree Level Order Traversal", tier: "core", lvl: "M", box: 15, clue: "`for _ in range(len(q))`" },
          { ref: "LC 98 Validate Binary Search Tree", tier: "core", lvl: "M", box: 20, clue: "Pass `(low, high)` bounds, or in-order strictly increasing" },
          { ref: "LC 230 Kth Smallest Element in a BST", tier: "core", lvl: "M", box: 15, clue: "In-order with an explicit stack, stop at k" },
          { ref: "LC 236 Lowest Common Ancestor of a Binary Tree", tier: "core", lvl: "M", box: 20, clue: "Return \"found p or q in this subtree\". The first node where both sides return non-null is the answer" },
          { ref: "LC 124 Binary Tree Maximum Path Sum", tier: "stretch", lvl: "H", box: 25, clue: "Same as diameter. Return `node.val + max(0, l, r)`, best uses both sides" },
          { ref: "CSES — Subordinates", tier: "stretch", lvl: "CSES", box: 25, clue: "n up to 2·10^5 → subtree size − 1, iterative only" },
          { ref: "Codeforces problemset, rating 1100–1400, tag trees, solve 1", tier: "stretch", lvl: "CF", box: 30, clue: "Build adjacency list, use the reverse-order template, no recursion" },
        ],
      },
      {
        kind: "reveal",
        prompt: "End-of-day check 1: for diameter, what does a node return and what does it update? Why are they different?",
        answer: "It returns its height, 1 + max(l, r), and updates best with l + r. The best path may use both sides through this node, but a parent can only extend one side, so the return value carries one side.",
      },
      {
        kind: "reveal",
        prompt: "End-of-day check 2: write the reverse-DFS-order post-order from memory and trace it on a 3-node path.",
        visual: codeV(SUBTREE_SIZES),
        answer: "On the path 0–1–2 rooted at 0: order = [0, 1, 2]. Reversed: 2 adds 1 to node 1 (size 2), then 1 adds 2 to node 0 (size 3). Sizes = [3, 2, 1].",
      },
      {
        kind: "reveal",
        prompt: "End-of-day check 3: why can `sys.setrecursionlimit(10**6)` still crash on Codeforces?",
        answer: "The limit only lifts Python's own counter. Each Python call also uses the C stack, which runs out first on deep input, so the process dies with a silent Runtime Error. Use an explicit stack instead.",
      },
      {
        kind: "summary",
        points: [
          "Height, diameter, path sum, LCA → DFS that returns a value.",
          "Level order, side views → BFS with `for _ in range(len(q))`.",
          "BST + kth / validate / sorted → in-order.",
          "Big edge-list trees → adjacency list + reverse DFS order.",
          SUMMARY_END,
        ],
      },
    ],
  },
];

export default lessons;
