import type { Lesson } from "../types";

// Chapter 6, part 1: the week intro plus Days 15-18 (DP mindset, grid and string DP, knapsack, LIS and interval DP).

/** Join code lines with "\n". */
const L = (...lines: string[]) => lines.join("\n");
/** Column labels "0".."n-1". */
const idx = (n: number) => Array.from({ length: n }, (_, i) => String(i));

/* ---------------- Code templates (from the book) ---------------- */

const ROB_MEMO = L(
  "from functools import cache",
  "import sys",
  "sys.setrecursionlimit(10**6)",
  "",
  "def rob(nums):",
  "    n = len(nums)",
  "",
  "    @cache",
  "    def f(i):                      # best loot from houses i..n-1",
  "        if i >= n:",
  "            return 0",
  "        return max(f(i + 1), nums[i] + f(i + 2))   # skip i, or take i",
  "",
  "    return f(0)",
);

const ROB_TABLE = L(
  "def rob(nums):",
  "    n = len(nums)",
  "    dp = [0] * (n + 2)             # dp[n] = dp[n+1] = 0 are the base cases",
  "    for i in range(n - 1, -1, -1):",
  "        dp[i] = max(dp[i + 1], nums[i] + dp[i + 2])",
  "    return dp[0]",
);

const DICE = L(
  "MOD = 10**9 + 7",
  "",
  "def dice(n):",
  "    dp = [0] * (n + 1)",
  "    dp[0] = 1                      # one way to make 0: throw nothing",
  "    for s in range(1, n + 1):",
  "        dp[s] = sum(dp[s - d] for d in range(1, 7) if s - d >= 0) % MOD",
  "    return dp[n]",
);

const LCS = L(
  "def lcs(a, b):",
  "    n, m = len(a), len(b)",
  "    dp = [[0] * (m + 1) for _ in range(n + 1)]     # NOT [[0]*(m+1)]*(n+1)",
  "    for i in range(1, n + 1):",
  "        ai = a[i - 1]",
  "        row, up = dp[i], dp[i - 1]",
  "        for j in range(1, m + 1):",
  "            if ai == b[j - 1]:",
  "                row[j] = up[j - 1] + 1",
  "            else:",
  "                row[j] = up[j] if up[j] > row[j - 1] else row[j - 1]",
  "    return dp[n][m]",
);

const EDIT = L(
  "def edit_distance(a, b):",
  "    n, m = len(a), len(b)",
  "    prev = list(range(m + 1))                      # row 0: j inserts",
  "    for i in range(1, n + 1):",
  "        cur = [i] + [0] * m                        # column 0: i deletes",
  "        for j in range(1, m + 1):",
  "            if a[i - 1] == b[j - 1]:",
  "                cur[j] = prev[j - 1]",
  "            else:",
  "                cur[j] = 1 + min(prev[j - 1], prev[j], cur[j - 1])",
  "        prev = cur",
  "    return prev[m]",
);

const GRID_PATHS = L(
  "def grid_paths(grid, MOD=10**9 + 7):              # grid[r][c] == '*' means blocked",
  "    C = len(grid[0])",
  "    dp = [0] * C",
  "    dp[0] = 1",
  "    for row in grid:",
  "        for c in range(C):",
  "            if row[c] == '*':",
  "                dp[c] = 0",
  "            elif c > 0:",
  "                dp[c] = (dp[c] + dp[c - 1]) % MOD  # dp[c] still holds \"from above\"",
  "    return dp[C - 1]",
);

const KNAP01 = L(
  "def knap01(items, W):                    # items = [(weight, value)], each used at most once",
  "    dp = [0] * (W + 1)                   # dp[c] = best value with capacity c",
  "    for w, v in items:",
  "        for c in range(W, w - 1, -1):    # DESCENDING",
  "            if dp[c - w] + v > dp[c]:",
  "                dp[c] = dp[c - w] + v",
  "    return dp[W]",
);

const MIN_COINS = L(
  "def min_coins(coins, amount):            # unbounded",
  "    INF = amount + 1",
  "    dp = [0] + [INF] * amount",
  "    for coin in coins:",
  "        for a in range(coin, amount + 1):  # ASCENDING",
  "            if dp[a - coin] + 1 < dp[a]:",
  "                dp[a] = dp[a - coin] + 1",
  "    return dp[amount] if dp[amount] < INF else -1",
);

const COUNTS = L(
  "def count_combinations(coins, amount):   # order does NOT matter (LC 518)",
  "    dp = [1] + [0] * amount",
  "    for coin in coins:                   # items outer",
  "        for a in range(coin, amount + 1):",
  "            dp[a] += dp[a - coin]",
  "    return dp[amount]",
  "",
  "def count_sequences(nums, target):       # order matters (LC 377)",
  "    dp = [1] + [0] * target",
  "    for t in range(1, target + 1):       # amount outer",
  "        for x in nums:",
  "            if x <= t:",
  "                dp[t] += dp[t - x]",
  "    return dp[target]",
);

const PARTITION = L(
  "def can_partition(nums):                 # LC 416",
  "    total = sum(nums)",
  "    if total % 2:",
  "        return False",
  "    bits = 1                             # only sum 0 is reachable",
  "    for x in nums:",
  "        bits |= bits << x                # 0/1: each x shifts the old set once",
  "    return (bits >> (total // 2)) & 1 == 1",
);

const LIS = L(
  "from bisect import bisect_left",
  "",
  "def lis_length(a):                       # strictly increasing",
  "    tails = []",
  "    for x in a:",
  "        i = bisect_left(tails, x)        # bisect_right for non-decreasing",
  "        if i == len(tails):",
  "            tails.append(x)",
  "        else:",
  "            tails[i] = x",
  "    return len(tails)",
);

const LIS_SLOW = L(
  "def lis_slow(a):                         # O(n^2)",
  "    n = len(a)",
  "    dp = [1] * n                         # dp[i] = LIS that ends at index i",
  "    for i in range(n):",
  "        for j in range(i):",
  "            if a[j] < a[i] and dp[j] + 1 > dp[i]:",
  "                dp[i] = dp[j] + 1",
  "    return max(dp, default=0)",
);

const BURST = L(
  "def max_coins(nums):                     # LC 312 Burst Balloons",
  "    a = [1] + nums + [1]",
  "    n = len(a)",
  "    dp = [[0] * n for _ in range(n)]     # dp[l][r] = best for balloons strictly between l and r",
  "    for length in range(2, n):           # r - l = length",
  "        for l in range(n - length):",
  "            r = l + length",
  "            best = 0",
  "            al_ar = a[l] * a[r]",
  "            for k in range(l + 1, r):    # k is the LAST balloon burst in (l, r)",
  "                cand = dp[l][k] + dp[k][r] + al_ar * a[k]",
  "                if cand > best:",
  "                    best = cand",
  "            dp[l][r] = best",
  "    return dp[0][n - 1]",
);

/* ---------------- Shared visuals ---------------- */

const HOUSES = [2, 7, 9, 3, 1, "", ""];
const LCS_ROWS = ["''", "a", "b", "c", "d"];
const LCS_COLS = ["''", "a", "c", "b", "d"];
const ED_ROWS = ["''", "c", "a", "t"];
const ED_COLS = ["''", "a", "c", "t"];
const KN_ROWS = ["none", "item 1", "item 2", "item 3"];
const CC_ROWS = ["start", "coin 1", "coin 3", "coin 4"];
const LIS_NUMS = [10, 9, 2, 5, 3, 7, 101, 18];

const DAILY_RULES =
  "Time-box every problem and stop when the box ends. No AI. If you run out of the 110 minutes, the overflow rows move to tomorrow's re-solve slot, and so does any unfinished stretch row.";

const SUMMARY_END = "Log 1 mistake and add 3 cards. Record the day in the Tracker (#tracker), then review your cards in the Gym (#gym).";

const lessons: Lesson[] = [
  /* =====================================================================
     Day 15 A: DP mindset
     ===================================================================== */
  {
    id: "ch06-l1",
    day: 15,
    title: "Day 15: DP mindset, from memo to table",
    goal: "Design a 1-D DP with the 6-step recipe, write it top-down, then convert it to a bottom-up table.",
    minutes: 14,
    steps: [
      {
        kind: "read",
        title: "Week 3: dynamic programming",
        body:
          "DP is where most self-taught programmers stall. The usual reason is not a missing trick. They guess the recurrence before deciding **what the state is**.\n\nThis week you design every DP the same way and say the steps out loud.\n\n**Goal for Day 15:** turn any \"number of ways / best value over a sequence\" problem into a 1-D DP. Write it top-down first, then bottom-up, without looking.\n\nFirst, spend 45 minutes on the [[upsolve]] of Contest #2 (the routine is in Chapter 10). Then start the normal 3-hour block.",
      },
      {
        kind: "quiz",
        guess: true,
        prompt: "Take a guess. You climb a staircase of 4 steps, taking 1 or 2 steps at a time. How many different ways can you reach the top?",
        options: ["4", "5", "6", "8"],
        answer: 1,
        explain:
          "5 ways: 1+1+1+1, 1+1+2, 1+2+1, 2+1+1, 2+2. Listing them by hand works for 4 steps but not for 40. This lesson shows how to count them with a small table instead.",
      },
      {
        kind: "read",
        title: "The 6-step recipe",
        body:
          "**[[Dynamic programming]]** (DP) solves a problem by combining the answers to smaller versions of it. Use this recipe for every DP this week, in this order.\n\nThe **[[state]]** is the smallest piece of information that makes the future independent of the past. If two different histories leave you in the same state, they must have the same best future.\n\nCheck the complexity against the constraints **before** you code. In Python, aim for about 10^7 simple steps in total.",
        visual: {
          kind: "table",
          headers: ["Step", "What you decide"],
          rows: [
            ["1. State", "The smallest info that makes the future independent of the past"],
            ["2. Transition", "Look at the last choice; build from smaller states"],
            ["3. Base cases", "Empty prefix, empty string, single cell, zero amount"],
            ["4. Answer", "dp[n], dp[0], max(dp), dp[full_mask][...]: decide before coding"],
            ["5. Order", "Fill every state after the states it reads"],
            ["6. Complexity", "Number of states x cost of one transition"],
          ],
        },
      },
      {
        kind: "read",
        title: "Finish the sentence first",
        body:
          "Back to the stairs: n steps, climb 1 or 2 at a time, count the ways.\n\n- **State:** `ways(i)` = the number of ways to stand on step i.\n- **Transition:** the last move came from step i-1 or step i-2. So `ways(i) = ways(i-1) + ways(i-2)`. This rule is the **recurrence**: the [[transition]] from smaller states.\n- **[[Base cases|base case]]:** `ways(0) = 1` (you are already there), `ways(1) = 1`.\n- **Answer:** `ways(n)`.",
        callout: {
          type: "move",
          text: "Before writing any code, finish the sentence \"`dp[i]` = the best/number of ___ for ___\". If you can't finish it, you don't have a state yet, and the recurrence will be guesswork.",
        },
      },
      {
        kind: "read",
        title: "Plain recursion repeats itself",
        body:
          "Write the recurrence as a plain recursive function and call `f(5)`. It calls `f(4)` and `f(3)`. But `f(4)` also calls `f(3)`. The same subproblems are solved again and again, and the number of calls grows exponentially.\n\nDP is brute-force recursion that **never solves the same subproblem twice**.",
        visual: {
          kind: "tree",
          nodes: ["f(5)", "f(4)", "f(3)", "f(3)", "f(2)", "f(2)", "f(1)", "f(2)", "f(1)", "f(1)", "f(0)", "f(1)", "f(0)", null, null, "f(1)", "f(0)"],
          tones: { 2: "warn", 3: "warn", 4: "bad", 5: "bad", 7: "bad" },
          caption: "f(3) is solved 2 times and f(2) 3 times: 15 calls in total.",
        },
      },
      {
        kind: "read",
        title: "Top-down: remember every answer",
        body:
          "Store each answer the first time you compute it. On the next call with the same argument, return the stored answer at once. This is **[[memoization]]**, also called **top-down** DP. In Python, the `@cache` decorator ([[functools.cache]]) does it for you.\n\nNow `f(3)` and `f(2)` are each computed once. Their second calls are cache hits (green) and stop immediately. Calls drop from 15 to 9, and in general from exponential to O(n).",
        visual: {
          kind: "tree",
          nodes: ["f(5)", "f(4)", "f(3)", "f(3)", "f(2)", null, null, "f(2)", "f(1)", null, null, "f(1)", "f(0)"],
          tones: { 2: "good", 4: "good" },
          notes: { 2: "cached", 4: "cached" },
          caption: "Green = answered from the cache. 9 calls instead of 15.",
        },
      },
      {
        kind: "widget",
        widget: "recursion-tree",
        title: "Watch the memo collapse the tree",
        task: "Set n to 6 with memo off and note how many calls happen. Then turn memo on. Watch the repeated calls turn into cache hits and compare the two counts.",
        props: { mode: "memo", n: 6 },
      },
      {
        kind: "read",
        title: "Bottom-up: fill a table",
        body:
          "**Bottom-up** DP ([[tabulation]]) fills a table in an order where every value you read is already computed. No recursion.\n\n- **State:** `dp[i]` = ways to stand on step i.\n- **Recurrence:** `dp[i] = dp[i-1] + dp[i-2]`.\n- **Base:** `dp[0] = 1`, `dp[1] = 1` (green).\n- **Answer cell:** `dp[5]`.\n\n`dp[i]` reads smaller i, so fill left to right. First cell: `dp[2] = dp[1] + dp[0] = 2` (1+1, or 2). The arrows show what it depends on.",
        visual: {
          kind: "grid",
          cells: [[1, 1, 2, "", "", ""]],
          rowLabels: ["dp"],
          colLabels: idx(6),
          tones: { "0,0": "good", "0,1": "good", "0,2": "accent" },
          arrows: [
            { from: [0, 0], to: [0, 2], tone: "warn" },
            { from: [0, 1], to: [0, 2], tone: "warn" },
          ],
          caption: "Base cases in green. The answer will appear in cell 5.",
        },
      },
      {
        kind: "read",
        title: "Keep going",
        body:
          "`dp[3] = dp[2] + dp[1] = 2 + 1 = 3`. Then `dp[4] = dp[3] + dp[2] = 3 + 2 = 5`.\n\nEach cell costs one addition, so the table costs O(n). That is the general rule: **complexity = number of states x cost of one transition**. If each `dp[i]` had to try every split point j before it, the cost would be n states x O(n) = O(n^2).",
        visual: {
          kind: "grid",
          cells: [[1, 1, 2, 3, 5, ""]],
          rowLabels: ["dp"],
          colLabels: idx(6),
          tones: { "0,0": "good", "0,1": "good", "0,4": "accent" },
          arrows: [
            { from: [0, 2], to: [0, 4], tone: "warn" },
            { from: [0, 3], to: [0, 4], tone: "warn" },
          ],
        },
      },
      {
        kind: "read",
        title: "The answer cell",
        body:
          "`dp[5] = dp[4] + dp[3] = 5 + 3 = 8`. That is the answer cell: 8 ways to climb 5 stairs.\n\nNotice that each cell reads only the last two values. So you can keep **two variables** instead of an array (`a, b = b, a + b`). That uses O(1) memory.",
        visual: {
          kind: "grid",
          cells: [[1, 1, 2, 3, 5, 8]],
          rowLabels: ["dp"],
          colLabels: idx(6),
          tones: { "0,0": "good", "0,1": "good", "0,5": "accent" },
          arrows: [
            { from: [0, 3], to: [0, 5], tone: "warn" },
            { from: [0, 4], to: [0, 5], tone: "warn" },
          ],
          caption: "Answer cell dp[5] = 8.",
        },
      },
      {
        kind: "number",
        teach: "Each cell is the sum of the two cells just before it. Look at the last two cells of the finished table.",
        prompt: "Extend the same stairs table by one cell. What is `dp[6]`?",
        answer: 13,
        tolerance: 0.5,
        explain: "`dp[6] = dp[5] + dp[4] = 8 + 5 = 13`.",
      },
      {
        kind: "widget",
        widget: "dp-table",
        title: "Stairs, cell by cell",
        task: "Step through the stairs table. Before each step, say the two cells the next one adds. Check that cell 5 is 8, then predict cell 6 before you look.",
        props: { mode: "stairs" },
      },
      {
        kind: "read",
        title: "House Robber: the state",
        body:
          "Houses in a row hold money `nums`. You can't rob two adjacent houses. Maximise the loot.\n\n- **State:** `f(i)` = best loot from houses i..n-1.\n- **Transition:** the choice at house i. Skip it → `f(i+1)`. Take it → `nums[i] + f(i+2)`.\n- **Base:** `f(i) = 0` when i ≥ n (no houses left).\n- **Answer:** `f(0)`.",
        visual: {
          kind: "array",
          rows: [{ label: "nums", items: [2, 7, 9, 3, 1] }],
          indices: true,
          caption: "Taking house i blocks house i+1.",
        },
      },
      {
        kind: "read",
        title: "Top-down first",
        body:
          "Write the top-down version first. It is the fastest way to find the recurrence.\n\n`@cache` remembers each `f(i)`. `sys.setrecursionlimit` lets Python recurse deeper than its default of 1000. `f` sits **inside** `rob`, so its cache belongs to this one input.\n\nMental test on `[2, 7]`: `f(0) = max(f(1), 2 + f(2)) = max(7, 2 + 0) = 7`. Correct.",
        visual: { kind: "code", lang: "python", code: ROB_MEMO },
      },
      {
        kind: "code",
        title: "Top-down House Robber",
        prompt: "Write House Robber top-down: a cached `f(i)` defined **inside** `rob`, with `f(i) = max(f(i+1), nums[i] + f(i+2))`.",
        starter: L("from functools import cache", "", "def rob(nums):", "    pass"),
        solution: ROB_MEMO,
        tests: [
          { call: "rob([2, 7, 9, 3, 1])", expect: "12" },
          { call: "rob([1, 2, 3, 1])", expect: "4" },
          { call: "rob([2, 1, 1, 2])", expect: "4" },
          { call: "rob([5])", expect: "5" },
          { call: "rob([])", expect: "0", label: "no houses" },
        ],
        teach: "f(i) = best loot from houses i..n-1. Skip house i, or take it and jump to i+2. Past the end, the loot is 0.",
        explain: "The base case `i >= n` covers both i = n and i = n+1, because taking the last house jumps two past it.",
      },
      {
        kind: "read",
        title: "Now turn it into a table",
        body:
          "`f(i)` reads **larger** i, so the bottom-up loop runs from i = n-1 **down** to 0.\n\n- **State:** `dp[i]` = best loot from houses i..n-1.\n- **Recurrence:** `dp[i] = max(dp[i+1], nums[i] + dp[i+2])`.\n- **Base:** `dp[5] = dp[6] = 0` (green). The array has n + 2 cells.\n- **Answer cell:** `dp[0]`.\n\nFirst: `dp[4] = max(dp[5], 1 + dp[6]) = max(0, 1) = 1`.",
        visual: {
          kind: "grid",
          cells: [HOUSES, ["", "", "", "", 1, 0, 0]],
          rowLabels: ["nums", "dp"],
          colLabels: idx(7),
          tones: { "1,5": "good", "1,6": "good", "1,4": "accent" },
          arrows: [
            { from: [1, 5], to: [1, 4], tone: "warn" },
            { from: [1, 6], to: [1, 4], tone: "warn" },
            { from: [0, 4], to: [1, 4], tone: "warn" },
          ],
        },
      },
      {
        kind: "read",
        title: "Right to left",
        body:
          "`dp[3] = max(dp[4], 3 + dp[5]) = max(1, 3) = 3`.\n\n`dp[2] = max(dp[3], 9 + dp[4]) = max(3, 9 + 1) = 10`. Taking house 2 plus the best from house 4 on beats skipping it.",
        visual: {
          kind: "grid",
          cells: [HOUSES, ["", "", 10, 3, 1, 0, 0]],
          rowLabels: ["nums", "dp"],
          colLabels: idx(7),
          tones: { "1,5": "good", "1,6": "good", "1,2": "accent" },
          arrows: [
            { from: [1, 3], to: [1, 2], tone: "warn" },
            { from: [1, 4], to: [1, 2], tone: "warn" },
            { from: [0, 2], to: [1, 2], tone: "warn" },
          ],
        },
      },
      {
        kind: "read",
        title: "The answer cell is dp[0]",
        body:
          "`dp[1] = max(dp[2], 7 + dp[3]) = max(10, 10) = 10`.\n\n`dp[0] = max(dp[1], 2 + dp[2]) = max(10, 12) = 12`. The answer is 12: rob houses 0, 2 and 4 (2 + 9 + 1).\n\nEach `dp[i]` reads only the next two cells, so two rolling variables would also work.",
        visual: {
          kind: "grid",
          cells: [HOUSES, [12, 10, 10, 3, 1, 0, 0]],
          rowLabels: ["nums", "dp"],
          colLabels: idx(7),
          tones: { "1,5": "good", "1,6": "good", "1,0": "accent" },
          arrows: [
            { from: [1, 1], to: [1, 0], tone: "warn" },
            { from: [1, 2], to: [1, 0], tone: "warn" },
            { from: [0, 0], to: [1, 0], tone: "warn" },
          ],
          caption: "Answer cell dp[0] = 12.",
        },
      },
      {
        kind: "widget",
        widget: "dp-table",
        title: "House Robber, cell by cell",
        task: "Step through House Robber on [2, 7, 9, 3, 1]. At each cell, say \"skip\" or \"take\" before the arrows appear. Then edit the input to [2, 1, 1, 2] and predict the answer cell (4).",
        props: { mode: "house-robber" },
      },
      {
        kind: "read",
        title: "The table template",
        body:
          "`dp = [0] * (n + 2)` creates the two base cells at the end. `range(n - 1, -1, -1)` runs i from n-1 down to 0, so `dp[i+1]` and `dp[i+2]` are ready when `dp[i]` reads them.\n\nMental test on `[5]`: `dp[0] = max(dp[1], 5 + dp[2]) = max(0, 5) = 5`. Correct.",
        visual: { kind: "code", lang: "python", code: ROB_TABLE },
      },
      {
        kind: "code",
        title: "Now type it yourself",
        prompt: "Type the bottom-up House Robber from memory. Base cells at the end, loop from n-1 down to 0, answer in `dp[0]`.",
        starter: L("# def rob(nums):", "#   table of n + 2 zeros", "#   fill i from n-1 down to 0", "#   return the answer cell"),
        solution: ROB_TABLE,
        tests: [
          { call: "rob([2, 7, 9, 3, 1])", expect: "12" },
          { call: "rob([1, 2, 3, 1])", expect: "4" },
          { call: "rob([2, 1, 1, 2])", expect: "4" },
          { call: "rob([5])", expect: "5" },
          { call: "rob([])", expect: "0", label: "no houses" },
        ],
        fromMemory: true,
        teach: "dp[i] = max(dp[i+1], nums[i] + dp[i+2]). dp[n] and dp[n+1] are 0. dp[i] reads larger i, so loop downward.",
        explain: "Same recurrence as the top-down version, with the loop direction reversed because `f(i)` reads larger i.",
      },
      {
        kind: "read",
        title: "Top-down or bottom-up?",
        body:
          "Both give the same answers. Top-down is faster to **write**. Bottom-up is faster to **run**, and it is the only safe choice when the recursion would be deep.",
        visual: {
          kind: "compare",
          left: {
            title: "Top-down (memo)",
            points: ["Faster to write", "Only visits reachable states", "Use it to find the recurrence", "Fine when depth stays below about 10^4"],
          },
          right: {
            title: "Bottom-up (table)",
            points: ["No recursion, no cache overhead", "Often 2-5x faster in Python", "Required when depth could reach 10^4 or more"],
          },
        },
      },
      {
        kind: "read",
        title: "Trap: recursion depth",
        body: "Raising the limit does not make deep recursion safe.",
        callout: {
          type: "trap",
          text: "`sys.setrecursionlimit` only raises Python's own counter. The real C stack can still overflow, and then you get a bare \"Runtime Error\" or a segfault with no traceback, somewhere around depth 10^4-10^5 depending on the judge. **Rule: if the recursion depth can reach 10^4 or more, write it bottom-up.** Chapter 3 covers the threading stack trick, but a loop is simpler and faster.",
        },
      },
      {
        kind: "quiz",
        teach: "Python's recursion limit is only a counter. The C stack underneath it has its own limit, around depth 10^4-10^5.",
        prompt: "Your `f(i)` recursion can go 10^5 calls deep. What should you submit?",
        options: [
          "Top-down with sys.setrecursionlimit(10**6)",
          "A bottom-up loop over a table",
          "Top-down with @cache, no other change",
          "Either one; depth does not matter in Python",
        ],
        answer: 1,
        explain:
          "At depth 10^4 or more, the C stack can overflow even with a raised limit, and the judge shows a bare Runtime Error. Bottom-up has no recursion at all.",
      },
      {
        kind: "read",
        title: "Trap: the cost of @cache",
        body: "A cache is convenient, but every entry costs memory, and where you define it matters.",
        callout: {
          type: "trap",
          text: "**Memory:** every `@cache` entry stores a key tuple, a dict slot and the result, roughly 100+ bytes per state. 10^6 states can use 100-200 MB and hit Memory Limit Exceeded on a 256 MB judge. A flat list of ints is several times smaller, so big state spaces go bottom-up.\n\n**Stale cache on LeetCode:** define the `@cache` function **inside** the method. At module or class level, the cache survives across test cases and returns answers for the wrong input. Before Python 3.9, use `@lru_cache(maxsize=None)`.",
        },
      },
      {
        kind: "read",
        title: "Counting with a mod: Dice Combinations",
        body:
          "Count the ordered ways to make sum n by throwing a die (faces 1-6). Print it modulo 10^9+7.\n\n- **State:** `dp[s]` = ordered ways to make sum s.\n- **Recurrence:** the last throw was d, so `dp[s] = dp[s-1] + ... + dp[s-6]` (only s-d ≥ 0).\n- **Base:** `dp[0] = 1`: one way to make 0, throw nothing.\n- **Answer cell:** `dp[n]`.\n\nSo `dp[3] = dp[2] + dp[1] + dp[0] = 2 + 1 + 1 = 4`.",
        visual: {
          kind: "grid",
          cells: [[1, 1, 2, 4]],
          rowLabels: ["dp"],
          colLabels: idx(4),
          tones: { "0,0": "good", "0,3": "accent" },
          arrows: [
            { from: [0, 0], to: [0, 3], tone: "warn" },
            { from: [0, 1], to: [0, 3], tone: "warn" },
            { from: [0, 2], to: [0, 3], tone: "warn" },
          ],
        },
      },
      {
        kind: "read",
        title: "The counting template",
        body:
          "On CSES, n goes up to 10^6. Recursion that deep would crash, so this one is **bottom-up only**.\n\nTake `% MOD` as you fill each cell, so the numbers stay small. The generator inside `sum` skips any d larger than s.\n\nMental test: `dice(2)`: `dp[1] = 1`, `dp[2] = dp[1] + dp[0] = 2` (1+1 or 2). Correct.",
        visual: { kind: "code", lang: "python", code: DICE },
      },
      {
        kind: "code",
        title: "Dice Combinations",
        prompt: "Write `dice(n)`: the number of ordered ways to make sum n with throws of 1-6, modulo 10^9+7.",
        starter: L("MOD = 10**9 + 7", "", "def dice(n):", "    pass"),
        solution: DICE,
        tests: [
          { call: "dice(1)", expect: "1" },
          { call: "dice(2)", expect: "2" },
          { call: "dice(3)", expect: "4" },
          { call: "dice(6)", expect: "32" },
          { call: "dice(7)", expect: "63", label: "the 6-face limit kicks in" },
        ],
        teach: "dp[0] = 1. dp[s] is the sum of dp[s-d] for d from 1 to 6 with s-d ≥ 0. Fill s upward.",
        explain: "Up to s = 6 every earlier cell counts, so the values double. From s = 7 the window of the last 6 cells starts to slide.",
      },
      {
        kind: "read",
        title: "15-second clues",
        body: "See the phrase on the left of the arrow, think of the DP on the right.",
        callout: {
          type: "clue",
          text: "- \"Number of ways to reach / form / decode\" → counting DP, `dp[i]` = sum of smaller states.\n- \"Max/min total, but you can't take two adjacent\" → `dp[i] = max(skip i, take i + dp[i-2])`.\n- \"Answer modulo 10^9+7\" → it's a count, so it's counting DP.\n- \"Can the string be split / can you reach the end\" → boolean DP over prefixes.\n- Greedy feels right but you can build a counterexample in 30 seconds → DP.",
        },
      },
      {
        kind: "quiz",
        teach: "A huge answer that must be reduced by a modulus is a sign of counting. Recall which kind of DP counts things.",
        prompt: "A problem ends with \"return the answer modulo 10^9+7\". What kind of DP is it most likely?",
        options: ["Counting DP (sum of smaller states)", "Min-cost DP (min of smaller states)", "Boolean DP (any of smaller states)", "No DP: a greedy choice"],
        answer: 0,
        explain: "A mod means the answer is a count that can grow huge. So it's counting DP, where each state adds up smaller states.",
      },
      {
        kind: "summary",
        points: [
          "Recipe: state, transition (last choice), base cases, answer location, order of filling, complexity = states x transition.",
          "Top-down = recursion + @cache. Use it to find the recurrence and when depth stays below about 10^4.",
          "Bottom-up = fill a table so every value you read is ready. f(i) reads larger i → loop downward.",
          "If dp[i] reads only the last one or two cells, keep two variables: O(1) memory.",
          "Traps: deep recursion crashes, @cache costs 100+ bytes per state, define the cache inside the method.",
        ],
      },
    ],
  },

  /* =====================================================================
     Day 15 B: drill
     ===================================================================== */
  {
    id: "ch06-l2",
    day: 15,
    title: "Day 15 drill: name the 1-D state",
    goal: "Spot 1-D DP problems in disguise, say their state and recurrence, and work the Day 15 problem list.",
    minutes: 10,
    steps: [
      {
        kind: "read",
        title: "Recap, then drill",
        body:
          "Every 1-D DP comes from the same recipe. Say the state as a full sentence, then the recurrence, the base case and the answer cell.\n\nThis lesson gives you 5 disguised problems to name, then the day's problem list, then the end-of-day check.",
        visual: {
          kind: "stats",
          items: [
            { value: "State", label: "dp[i] = best/number of ___ for ___" },
            { value: "Last choice", label: "take/skip, 1 or 2 steps, last word" },
            { value: "Base", label: "empty prefix, dp[0] = 1 for counts" },
            { value: "Order", label: "fill so every read is ready" },
          ],
        },
      },
      {
        kind: "quiz",
        teach: "Ask what the last choice is and what it rules out. Taking an item that blocks its neighbour is a take/skip DP.",
        prompt: "You pick workout days. You can't train on two consecutive days, and each day has a score. Maximise the total score.",
        options: ["Take/skip DP (House Robber)", "Counting DP over prefixes (Decode Ways)", "Boolean prefix DP (Word Break)", "Min-cost DP over the last k positions (Frog)"],
        answer: 0,
        explain:
          "Signal: \"can't take two consecutive\" + maximise. `dp[i]` = best score using days 0..i; `dp[i] = max(dp[i-1], dp[i-2] + a[i])`.",
      },
      {
        kind: "quiz",
        teach: "\"Count the ways\" over a string means counting DP over prefixes. The last choice is how the final piece of the string was read.",
        prompt: "A digit string encodes letters (1 → A … 26 → Z). Count the ways to read it.",
        options: ["Take/skip DP (House Robber)", "Counting DP over prefixes (Decode Ways)", "Boolean prefix DP (Word Break)", "Greedy: read two digits whenever possible"],
        answer: 1,
        explain:
          "Signal: \"count the ways to read\". `dp[i]` = ways to read the first i characters; `dp[i] = dp[i-1]` (if `s[i-1] != '0'`) `+ dp[i-2]` (if `10 ≤ s[i-2:i] ≤ 26`), with `dp[0] = 1`.",
      },
      {
        kind: "read",
        title: "Notice the signal",
        body:
          "Max/min with a blocking rule → take/skip. \"Count the ways\" → counting DP with `dp[0] = 1`. In both, the state is a prefix (or suffix) of the input, and the last choice is about the last element or the last piece.",
      },
      {
        kind: "quiz",
        teach: "When you can arrive from any of the last k positions and each move has a cost, the state is the position and you take the min over where you came from.",
        prompt: "A frog on stones with heights h can jump 1 to k stones forward. A jump costs |h_i − h_j|. Find the minimum cost to reach the last stone.",
        options: ["Counting DP over prefixes (Decode Ways)", "Min-cost DP over the last k positions (Frog)", "Take/skip DP (House Robber)", "Greedy: always jump to the lowest stone"],
        answer: 1,
        explain:
          "Signal: minimum cost + \"jump 1 to k\". `dp[i]` = minimum cost to stand on stone i; `dp[i] = min(dp[j] + |h_i − h_j|)` for j in [i−k, i−1].",
      },
      {
        kind: "quiz",
        teach: "A yes/no question about cutting a string into valid pieces is a boolean DP over prefixes. The last choice is the last piece.",
        prompt: "You get text with the spaces removed, plus a dictionary. Can the text be cut into dictionary words?",
        options: ["Boolean prefix DP (Word Break)", "Counting DP over prefixes (Decode Ways)", "Take/skip DP (House Robber)", "Two pointers over the text"],
        answer: 0,
        explain:
          "Signal: \"can it be split\". `dp[i]` = the first i characters can be split; `dp[i] = any(dp[j] and s[j:i] in words)`.",
      },
      {
        kind: "read",
        title: "Notice the signal",
        body:
          "\"Minimum cost to reach\" → min over the states you could come from. \"Can it be split / reached\" → the same shape with `any` instead of `min`. Same recipe, different combine step: sum for counts, min/max for best, any for yes/no.",
      },
      {
        kind: "quiz",
        teach: "Ordered ways to build a total from a fixed set of parts: the last part used decides which smaller total you came from.",
        prompt: "Count the ordered ways to write n as a sum of 1s, 3s and 4s.",
        options: ["Counting DP: dp[s] = dp[s-1] + dp[s-3] + dp[s-4]", "Take/skip DP (House Robber)", "Min-cost DP over the last k positions (Frog)", "Greedy: use as many 4s as possible"],
        answer: 0,
        explain:
          "Signal: \"count the ordered ways\" to make a total. `dp[s]` = ordered ways to make s; `dp[s] = dp[s-1] + dp[s-3] + dp[s-4]`, with `dp[0] = 1`. It is Dice Combinations with parts {1, 3, 4}.",
      },
      {
        kind: "practice",
        title: "Today's problems",
        intro:
          DAILY_RULES + " Problems 7-8 are overflow. For Climbing Stairs, write both the top-down and the bottom-up version.",
        problems: [
          { ref: "LC 70 Climbing Stairs", tier: "warm", lvl: "E", box: 15, clue: "Ways to reach step i = ways(i−1) + ways(i−2). Write both versions." },
          { ref: "AtCoder DP Contest — A Frog 1", tier: "warm", lvl: "E", box: 15, clue: "dp[i] = min(dp[i-1] + abs(h[i]-h[i-1]), dp[i-2] + abs(h[i]-h[i-2]))." },
          { ref: "LC 198 House Robber", tier: "core", lvl: "M", box: 30, clue: "No two adjacent → take/skip. Finish with two rolling variables." },
          { ref: "LC 740 Delete and Earn", tier: "core", lvl: "M", box: 30, clue: "Bucket by value, then it's House Robber over values." },
          { ref: "LC 91 Decode Ways", tier: "core", lvl: "M", box: 30, clue: "Prefix DP. One-digit and two-digit last choice. Watch '0'." },
          { ref: "LC 139 Word Break", tier: "core", lvl: "M", box: 30, clue: "dp[i] = prefix of length i splittable. Try every last word." },
          { ref: "CSES — Dice Combinations", tier: "stretch", lvl: "M", box: 45, clue: "Ordered ways, mod 10^9+7. Bottom-up only (n = 10^6)." },
          { ref: "CSES — Removing Digits", tier: "stretch", lvl: "M", box: 45, clue: "dp[x] = 1 + min(dp[x−d]) over the digits d of x. (overflow)" },
        ],
      },
      {
        kind: "reveal",
        prompt: "End-of-day check 1. Recite the 6-step DP design recipe, in order. Say it out loud, then tap.",
        answer:
          "1. **State**: the smallest info that makes the future independent of the past. 2. **Transition**: look at the last choice. 3. **Base cases**: empty prefix, empty string, single cell, zero amount. 4. **Answer location**: decide before coding. 5. **Order of filling**: every state after the states it reads. 6. **Complexity** = number of states x cost of one transition, checked before coding.",
      },
      {
        kind: "reveal",
        prompt: "End-of-day check 2. When must you convert top-down to bottom-up in Python? Give two separate reasons.",
        answer:
          "1. **Depth**: if the recursion can reach about 10^4 or more, the C stack can overflow even with a raised recursion limit. 2. **Memory**: `@cache` costs 100+ bytes per state, so about 10^6 states can hit Memory Limit Exceeded. (Bonus: bottom-up is often 2-5x faster.)",
      },
      {
        kind: "reveal",
        prompt: "End-of-day check 3. `f(i)` reads `f(i+1)` and `f(i+3)`. In which direction does the bottom-up loop run, and how big is the array?",
        answer:
          "Downward, from i = n-1 to 0, because each cell reads larger i. The array needs n + 3 cells, so that `dp[n]`, `dp[n+1]` and `dp[n+2]` exist as base cases.",
      },
      {
        kind: "summary",
        points: [
          "Take/skip, counting over prefixes, boolean prefix and min-cost over the last k are all 1-D DP.",
          "Combine step: sum for counts, min/max for best, any for yes/no.",
          "Counting DP starts with dp[0] = 1.",
          SUMMARY_END,
        ],
      },
    ],
  },

  /* =====================================================================
     Day 16 A: grid DP + string DP
     ===================================================================== */
  {
    id: "ch06-l3",
    day: 16,
    title: "Day 16: Grid DP and two-string DP",
    goal: "Fill a 2-D table for grid paths, LCS and edit distance from memory, including the rolling-row version.",
    minutes: 14,
    steps: [
      {
        kind: "read",
        title: "From a line to a table",
        body:
          "Yesterday the state was one index. Today it is two: a cell (r, c) in a grid ([[grid DP]]), or a pair (i, j) of prefix lengths in two strings. The recipe does not change.\n\n**Goal:** write the 2-D table for any grid-path or two-string problem from memory, including the rolling-row version.",
      },
      {
        kind: "read",
        title: "Grid DP: the state is the cell",
        body:
          "A robot moves only right or down from the top-left to the bottom-right. Rocks (#) block cells. Count the routes.\n\n- **State:** `dp[r][c]` = routes to cell (r, c).\n- **Transition:** the last move came from above or from the left: `dp[r][c] = dp[r-1][c] + dp[r][c-1]`. A rock has 0 routes.\n- **Base:** the top row and left column have 1 route each (a straight line), until a rock blocks it.\n- **Answer cell:** bottom-right.",
        visual: {
          kind: "grid",
          cells: [[1, 1, 1, 1], [1, "#", "", ""], [1, "", "", ""]],
          tones: { "0,0": "good", "0,1": "good", "0,2": "good", "0,3": "good", "1,0": "good", "2,0": "good", "1,1": "bad" },
          caption: "Base cells in green. The rock is red and counts as 0.",
        },
      },
      {
        kind: "read",
        title: "Fill row by row",
        body:
          "`dp[r][c]` reads the cell above and the cell to the left, so fill **row by row, left to right**.\n\nCell (1, 2): from above 1, from the left 0 (the rock). So `dp[1][2] = 1 + 0 = 1`.",
        visual: {
          kind: "grid",
          cells: [[1, 1, 1, 1], [1, "#", 1, ""], [1, "", "", ""]],
          tones: { "1,1": "bad", "1,2": "accent" },
          arrows: [
            { from: [0, 2], to: [1, 2], tone: "warn" },
            { from: [1, 1], to: [1, 2], tone: "warn" },
          ],
        },
      },
      {
        kind: "read",
        title: "Next cells",
        body:
          "Cell (1, 3): `1 + 1 = 2`. Then row 2 starts. Cell (2, 1): from above is the rock (0), from the left is 1, so `dp[2][1] = 1`. Cell (2, 2): `1 + 1 = 2`.",
        visual: {
          kind: "grid",
          cells: [[1, 1, 1, 1], [1, "#", 1, 2], [1, 1, 2, ""]],
          tones: { "1,1": "bad", "1,3": "accent", "2,2": "accent" },
          arrows: [
            { from: [0, 3], to: [1, 3], tone: "warn" },
            { from: [1, 2], to: [1, 3], tone: "warn" },
            { from: [1, 2], to: [2, 2], tone: "warn" },
            { from: [2, 1], to: [2, 2], tone: "warn" },
          ],
        },
      },
      {
        kind: "read",
        title: "The answer cell",
        body:
          "Bottom-right: `dp[2][3] = dp[1][3] + dp[2][2] = 2 + 2 = 4`. There are 4 routes around the rock.\n\nEvery cell costs one addition, so the table costs O(R·C).",
        visual: {
          kind: "grid",
          cells: [[1, 1, 1, 1], [1, "#", 1, 2], [1, 1, 2, 4]],
          tones: { "1,1": "bad", "2,3": "accent" },
          arrows: [
            { from: [1, 3], to: [2, 3], tone: "warn" },
            { from: [2, 2], to: [2, 3], tone: "warn" },
          ],
          caption: "Answer cell (2, 3) = 4.",
        },
      },
      {
        kind: "number",
        teach: "Every cell is the cell above plus the cell to the left. The top row and left column are all 1 when there are no rocks.",
        prompt: "Same 3 x 4 grid, but with **no** rock. How many routes reach the bottom-right cell?",
        answer: 10,
        tolerance: 0.5,
        explain: "Row 0: 1 1 1 1. Row 1: 1 2 3 4. Row 2: 1 3 6 10. The answer cell is 10.",
      },
      {
        kind: "widget",
        widget: "dp-table",
        title: "Grid paths, cell by cell",
        task: "Step through the grid. For each cell, say the two numbers it adds before you press Step. Then put a rock in the second row and watch which cells change.",
        props: { mode: "grid-paths" },
      },
      {
        kind: "read",
        title: "One row is enough",
        body:
          "Row r only reads row r and row r-1. So keep **one row** `dp` and overwrite it left to right.\n\nWhen you reach `dp[c]`, it still holds the **old** value: the cell above. `dp[c-1]` was just updated: the cell to the left. So `dp[c] = dp[c] + dp[c-1]`. A rock sets `dp[c] = 0`.",
        visual: {
          kind: "array",
          rows: [
            { label: "before", items: [1, 0, 1, 2], tones: { 1: "bad" } },
            { label: "after", items: [1, 1, 2, 4], tones: { 3: "accent" }, pointers: [{ at: 3, label: "c" }] },
          ],
          indices: true,
          caption: "Updating to row 2: dp[3] = old dp[3] (above, 2) + new dp[2] (left, 2) = 4.",
        },
      },
      {
        kind: "read",
        title: "The rolling-row template",
        body:
          "`dp[0] = 1` is the start. For each row, a blocked cell becomes 0. Otherwise, for c > 0, add the left neighbour to the value from above. Column 0 keeps its value from above, so it stays 1 until a rock zeroes it. Counts are taken mod 10^9+7, as on CSES.\n\nMental test on `[\"..\", \".*\"]`: row 0 → [1, 1]; row 1 → [1, 0]. Answer 0, correct, because the target is a rock.",
        visual: { kind: "code", lang: "python", code: GRID_PATHS },
      },
      {
        kind: "code",
        title: "Grid paths with rocks",
        prompt: "Write `grid_paths(grid)`. `grid` is a list of strings, `'*'` is a rock. Use one rolling row, mod 10^9+7.",
        starter: L("def grid_paths(grid, MOD=10**9 + 7):", "    pass"),
        solution: GRID_PATHS,
        tests: [
          { call: "grid_paths(['....', '.*..', '....'])", expect: "4", label: "the example" },
          { call: "grid_paths(['...', '...', '...'])", expect: "6" },
          { call: "grid_paths(['..', '*.'])", expect: "1" },
          { call: "grid_paths(['.'])", expect: "1", label: "one cell" },
          { call: "grid_paths(['*'])", expect: "0", label: "start is blocked" },
        ],
        teach: "dp[c] holds the value from above. For c > 0 add dp[c-1], the value from the left. A rock sets dp[c] = 0.",
        explain: "The loop never needs a second array, because `dp[c]` is read once (as \"above\") before it is overwritten.",
      },
      {
        kind: "read",
        title: "Two strings: the state is two prefixes",
        body:
          "For two strings A and B, the state is `(i, j)`: **the first i characters of A and the first j characters of B**.\n\nThe last choice is about the **last characters**, `A[i-1]` and `B[j-1]`. Either they match (use the diagonal cell) or you drop or edit one of them (use the cell above or to the left).\n\nUse an (n+1) x (m+1) table. Row 0 and column 0 are the **empty-prefix** base cases. The cost is O(n·m).",
      },
      {
        kind: "read",
        title: "LCS: the setup",
        body:
          "The **[[longest common subsequence]]** (LCS) is the longest sequence of characters that appears in both strings in order, not necessarily side by side.\n\n- **State:** `dp[i][j]` = LCS length of `a[:i]` and `b[:j]`.\n- **Recurrence:** match → `dp[i-1][j-1] + 1`; otherwise `max(dp[i-1][j], dp[i][j-1])`.\n- **Base:** row 0 and column 0 are 0 (an empty prefix shares nothing).\n- **Answer cell:** `dp[n][m]`.\n\nExample: a = \"abcd\" (rows), b = \"acbd\" (columns).",
        visual: {
          kind: "grid",
          cells: [[0, 0, 0, 0, 0], [0, "", "", "", ""], [0, "", "", "", ""], [0, "", "", "", ""], [0, "", "", "", ""]],
          rowLabels: LCS_ROWS,
          colLabels: LCS_COLS,
          tones: { "0,0": "good", "0,1": "good", "0,2": "good", "0,3": "good", "0,4": "good", "1,0": "good", "2,0": "good", "3,0": "good", "4,0": "good" },
          caption: "'' is the empty prefix. Base cells in green.",
        },
      },
      {
        kind: "read",
        title: "A match uses the diagonal",
        body:
          "Cell (1, 1) compares 'a' with 'a': a match. Both last characters join the common subsequence, so `dp[1][1] = dp[0][0] + 1 = 1`.\n\nThe rest of row 1 are mismatches. Each takes `max(up, left)`, which is 1.",
        visual: {
          kind: "grid",
          cells: [[0, 0, 0, 0, 0], [0, 1, 1, 1, 1], [0, "", "", "", ""], [0, "", "", "", ""], [0, "", "", "", ""]],
          rowLabels: LCS_ROWS,
          colLabels: LCS_COLS,
          tones: { "1,1": "accent" },
          arrows: [{ from: [0, 0], to: [1, 1], tone: "good" }],
        },
      },
      {
        kind: "read",
        title: "A mismatch takes the better neighbour",
        body:
          "Cell (2, 3) compares 'b' with 'b': match, so `dp[1][2] + 1 = 2` (green arrow).\n\nCell (2, 4) compares 'b' with 'd': mismatch. Drop the last 'b' of a (up: 1) or the last 'd' of b (left: 2). Take the max: `dp[2][4] = 2` (orange arrows).",
        visual: {
          kind: "grid",
          cells: [[0, 0, 0, 0, 0], [0, 1, 1, 1, 1], [0, 1, 1, 2, 2], [0, "", "", "", ""], [0, "", "", "", ""]],
          rowLabels: LCS_ROWS,
          colLabels: LCS_COLS,
          tones: { "2,3": "accent", "2,4": "warn" },
          arrows: [
            { from: [1, 2], to: [2, 3], tone: "good" },
            { from: [1, 4], to: [2, 4], tone: "warn" },
            { from: [2, 3], to: [2, 4], tone: "warn" },
          ],
        },
      },
      {
        kind: "read",
        title: "The answer cell",
        body:
          "Fill the last two rows the same way. Cell (4, 4) compares 'd' with 'd': match, so `dp[3][3] + 1 = 3`.\n\nThe LCS of \"abcd\" and \"acbd\" has length 3 (\"abd\" or \"acd\").",
        visual: {
          kind: "grid",
          cells: [[0, 0, 0, 0, 0], [0, 1, 1, 1, 1], [0, 1, 1, 2, 2], [0, 1, 2, 2, 2], [0, 1, 2, 2, 3]],
          rowLabels: LCS_ROWS,
          colLabels: LCS_COLS,
          tones: { "4,4": "accent" },
          arrows: [{ from: [3, 3], to: [4, 4], tone: "good" }],
          caption: "Answer cell dp[4][4] = 3.",
        },
      },
      {
        kind: "widget",
        widget: "dp-table",
        title: "LCS, cell by cell",
        task: "Step through the LCS table for \"abcd\" and \"acbd\". Before each step, say \"match → diagonal + 1\" or \"mismatch → max of up and left\". Then try your own pair of strings.",
        props: { mode: "lcs", a: "abcd", b: "acbd" },
      },
      {
        kind: "read",
        title: "The LCS template",
        body:
          "`[[0] * (m + 1) for _ in range(n + 1)]` builds n+1 separate rows. `row` and `up` are local names for `dp[i]` and `dp[i-1]`, which keeps the inner loop fast. The comparison uses `a[i-1]` and `b[j-1]`, because row i means a prefix of length i.\n\nMental test: `lcs(\"ab\", \"b\")`: row 1 ('a') is all 0; row 2 ('b') matches at j = 1: `0 + 1 = 1`. Correct.",
        visual: { kind: "code", lang: "python", code: LCS },
      },
      {
        kind: "code",
        title: "Now type it yourself",
        prompt: "Type `lcs(a, b)` from memory: an (n+1) x (m+1) table, diagonal + 1 on a match, max of up and left otherwise.",
        starter: L("# def lcs(a, b):", "#   (n+1) x (m+1) table of zeros (one list per row!)", "#   compare a[i-1] with b[j-1]", "#   return the answer cell"),
        solution: LCS,
        tests: [
          { call: "lcs('abcde', 'ace')", expect: "3" },
          { call: "lcs('abcd', 'acbd')", expect: "3" },
          { call: "lcs('abc', 'abc')", expect: "3" },
          { call: "lcs('abc', 'def')", expect: "0" },
          { call: "lcs('', 'abc')", expect: "0", label: "empty string" },
        ],
        fromMemory: true,
        teach: "dp[i][j] = LCS of a[:i] and b[:j]. Row 0 and column 0 are 0. Match → dp[i-1][j-1] + 1; else max(dp[i-1][j], dp[i][j-1]).",
        explain: "The answer is in the bottom-right cell `dp[n][m]`, the full lengths of both strings.",
      },
      {
        kind: "quiz",
        teach: "A match means both last characters join the subsequence together. Think about which cell has both of them removed.",
        prompt: "In the LCS table, `a[i-1] == b[j-1]`. Which cell do you add 1 to?",
        options: ["dp[i-1][j] (up)", "dp[i][j-1] (left)", "dp[i-1][j-1] (diagonal)", "max of up and left"],
        answer: 2,
        explain: "On a match, both last characters are used, so you go back one character in **both** strings: the diagonal `dp[i-1][j-1]`.",
      },
      {
        kind: "read",
        title: "Edit distance: three moves, three neighbours",
        body:
          "The **[[edit distance]]** is the fewest single-character inserts, deletes and replaces that turn a into b.\n\n- **State:** `dp[i][j]` = edits to turn `a[:i]` into `b[:j]`.\n- **Recurrence:** match → `dp[i-1][j-1]`. Otherwise `1 + min(replace = dp[i-1][j-1], delete = dp[i-1][j], insert = dp[i][j-1])`.\n- **Base:** `dp[i][0] = i` (delete all i), `dp[0][j] = j` (insert all j).\n- **Answer cell:** `dp[n][m]`.\n\nExample: \"cat\" → \"act\".",
        visual: {
          kind: "grid",
          cells: [[0, 1, 2, 3], [1, "", "", ""], [2, "", "", ""], [3, "", "", ""]],
          rowLabels: ED_ROWS,
          colLabels: ED_COLS,
          tones: { "0,0": "good", "0,1": "good", "0,2": "good", "0,3": "good", "1,0": "good", "2,0": "good", "3,0": "good" },
        },
      },
      {
        kind: "read",
        title: "A mismatch reads three cells",
        body:
          "Cell (1, 1) compares 'c' with 'a': mismatch. Three options:\n\n- replace 'c' by 'a': diagonal 0\n- delete 'c': up 1\n- insert 'a': left 1\n\n`dp[1][1] = 1 + min(0, 1, 1) = 1`.",
        visual: {
          kind: "grid",
          cells: [[0, 1, 2, 3], [1, 1, "", ""], [2, "", "", ""], [3, "", "", ""]],
          rowLabels: ED_ROWS,
          colLabels: ED_COLS,
          tones: { "1,1": "accent" },
          arrows: [
            { from: [0, 0], to: [1, 1], tone: "warn" },
            { from: [0, 1], to: [1, 1], tone: "warn" },
            { from: [1, 0], to: [1, 1], tone: "warn" },
          ],
        },
      },
      {
        kind: "read",
        title: "A match is free",
        body:
          "Cell (1, 2) compares 'c' with 'c': match. No edit is needed, so copy the diagonal: `dp[1][2] = dp[0][1] = 1`.\n\nCell (1, 3), 'c' vs 't': `1 + min(2, 3, 1) = 2`.",
        visual: {
          kind: "grid",
          cells: [[0, 1, 2, 3], [1, 1, 1, 2], [2, "", "", ""], [3, "", "", ""]],
          rowLabels: ED_ROWS,
          colLabels: ED_COLS,
          tones: { "1,2": "accent" },
          arrows: [{ from: [0, 1], to: [1, 2], tone: "good" }],
        },
      },
      {
        kind: "read",
        title: "The answer cell",
        body:
          "The last two rows fill the same way. Cell (3, 3) compares 't' with 't': match, so it copies `dp[2][2] = 2`.\n\nSo \"cat\" → \"act\" takes 2 edits: replace 'c' by 'a', then 'a' by 'c'.",
        visual: {
          kind: "grid",
          cells: [[0, 1, 2, 3], [1, 1, 1, 2], [2, 1, 2, 2], [3, 2, 2, 2]],
          rowLabels: ED_ROWS,
          colLabels: ED_COLS,
          tones: { "3,3": "accent" },
          arrows: [{ from: [2, 2], to: [3, 3], tone: "good" }],
          caption: "Answer cell dp[3][3] = 2.",
        },
      },
      {
        kind: "widget",
        widget: "dp-table",
        title: "Edit distance, cell by cell",
        task: "Step through \"cat\" → \"act\". On each mismatch, name which of the three arrows wins (replace, delete or insert). Then try \"horse\" → \"ros\": the answer cell should be 3.",
        props: { mode: "edit-distance", a: "cat", b: "act" },
      },
      {
        kind: "read",
        title: "The edit-distance template, two rows",
        body:
          "Row i reads only rows i and i-1, so keep two rows: O(m) memory. `prev` starts as row 0 (`j` inserts). Each new `cur` starts with `i` (column 0, i deletes). In the min: `prev[j-1]` = replace, `prev[j]` = delete, `cur[j-1]` = insert.\n\nMental test: `edit_distance(\"a\", \"\")`: `prev = [0]`; row 1 → `cur = [1]`. Answer 1, one delete. Correct.",
        visual: { kind: "code", lang: "python", code: EDIT },
      },
      {
        kind: "code",
        title: "Edit distance",
        prompt: "Write `edit_distance(a, b)` with two rolling rows.",
        starter: L("def edit_distance(a, b):", "    pass"),
        solution: EDIT,
        tests: [
          { call: "edit_distance('horse', 'ros')", expect: "3" },
          { call: "edit_distance('intention', 'execution')", expect: "5" },
          { call: "edit_distance('cat', 'act')", expect: "2" },
          { call: "edit_distance('', 'abc')", expect: "3", label: "empty a" },
          { call: "edit_distance('abc', '')", expect: "3", label: "empty b" },
          { call: "edit_distance('a', 'a')", expect: "0" },
        ],
        teach: "Base: dp[i][0] = i, dp[0][j] = j. Match → diagonal. Else 1 + min(diagonal, up, left).",
        explain: "The base row `list(range(m + 1))` and the `[i]` at the start of each row are the two base cases.",
      },
      {
        kind: "read",
        title: "Common mistake: string vs table indices",
        body: "The table has one extra row and column for the empty prefix.",
        callout: {
          type: "mistake",
          text: "Mixing up string indices and table indices. `dp[i][j]` covers prefixes of length i and j, so the characters you compare are `a[i-1]` and `b[j-1]`.",
        },
      },
      {
        kind: "read",
        title: "Trap: the shared-row table",
        body: "This one looks right and silently gives wrong answers.",
        visual: { kind: "code", lang: "python", code: L("bad = [[0] * 3] * 2      # 2 references to ONE row", "bad[0][0] = 9", "print(bad)               # [[9, 0, 0], [9, 0, 0]]", "", "good = [[0] * 3 for _ in range(2)]") },
        callout: {
          type: "trap",
          text: "`[[0] * m] * n` makes n references to **the same** row. Writing one cell changes every row. Always use `[[0] * m for _ in range(n)]`.",
        },
      },
      {
        kind: "read",
        title: "Trap: speed",
        body: "In Python, the inner loop of a 2-D DP is where the time goes.",
        callout: {
          type: "trap",
          text: "Pull `dp[i]` and `dp[i-1]` into local names (`row`, `up`) before the inner loop. Each `dp[i][j]` lookup is two indexing operations, and over 25·10^6 cells that difference decides AC versus TLE. For n·m ≥ 10^7, submit with PyPy.",
        },
      },
      {
        kind: "read",
        title: "15-second clues",
        body: "Five shapes that all mean a 2-D table.",
        callout: {
          type: "clue",
          text: "- Grid + \"move only right/down\" + count paths or min cost → `dp[r][c]` from the top and left neighbours.\n- Two strings + \"common\", \"delete\", \"insert\", \"transform\", \"match\" → `dp[i][j]` over prefixes.\n- One string + \"palindromic subsequence\" → `dp[i][j]` over the substring s[i..j].\n- \"Largest square of 1s\" → `dp[r][c]` = side of the best square whose bottom-right corner is (r, c).\n- An array where each value depends on the previous value → 2-D state `dp[i][value]`.",
        },
      },
      {
        kind: "summary",
        points: [
          "Grid DP: dp[r][c] = from above + from the left (or min + cost). Fill row by row. O(R·C).",
          "Two strings: dp[i][j] over prefixes, an (n+1) x (m+1) table, row 0 and column 0 are the empty-prefix base cases.",
          "LCS: match → diagonal + 1, else max(up, left). Edit distance: match → diagonal, else 1 + min(replace, delete, insert).",
          "Row i reads only rows i and i-1: keep one or two rows for O(m) memory.",
          "Never build a table with [[0] * m] * n. Compare a[i-1] with b[j-1].",
        ],
      },
    ],
  },

  /* =====================================================================
     Day 16 B: drill
     ===================================================================== */
  {
    id: "ch06-l4",
    day: 16,
    title: "Day 16 drill: grids and two strings",
    goal: "Recognise grid, two-string and substring DP in disguise and work the Day 16 problem list.",
    minutes: 10,
    steps: [
      {
        kind: "read",
        title: "Recap, then drill",
        body:
          "Two kinds of 2-D state today: a **cell** in a grid, and a pair of **prefix lengths** in two strings. In both, look at the last move or the last characters.\n\nThis lesson gives you 5 disguised problems, then the problem list and the end-of-day check.",
        visual: {
          kind: "compare",
          left: { title: "Grid DP", points: ["dp[r][c] = answer at cell (r, c)", "Reads up and left", "Fill row by row"] },
          right: { title: "Two-string DP", points: ["dp[i][j] = answer for a[:i], b[:j]", "Reads diagonal, up, left", "Row 0 and column 0 = empty prefix"] },
        },
      },
      {
        kind: "quiz",
        teach: "Moving only right or down on a grid means each cell is reached from at most two neighbours.",
        prompt: "A robot crosses a grid with some rocks, moving only right or down. How many routes are there?",
        options: ["Grid DP from top and left", "LCS over two prefixes", "BFS shortest path", "Largest-square DP"],
        answer: 0,
        explain: "Signal: grid + right/down + count. `dp[r][c]` = routes to (r, c); `dp[r][c] = dp[r-1][c] + dp[r][c-1]`, with 0 on rocks.",
      },
      {
        kind: "quiz",
        teach: "Whatever you keep from both strings must be a common subsequence. Ask what you want to keep as long as possible.",
        prompt: "Find the minimum number of characters to delete from two strings so they become equal.",
        options: ["Edit distance with replace allowed", "LCS, then n + m − 2·LCS", "Grid DP from top and left", "Sort both strings and compare"],
        answer: 1,
        explain: "Signal: two strings + \"delete\" + \"equal\". What stays is a common subsequence, so keep the longest one. `dp[i][j]` = LCS of the prefixes; answer = n + m − 2·LCS.",
      },
      {
        kind: "read",
        title: "Notice the signal",
        body:
          "\"Right or down\" → grid DP. \"Two strings\" + delete/insert/common → `dp[i][j]` over prefixes. When the allowed edits are only deletions, the part you keep is a common subsequence, so LCS does the work.",
      },
      {
        kind: "quiz",
        teach: "Name a square by its bottom-right corner. A big square at a corner needs smaller squares above, to the left and diagonally.",
        prompt: "Find the largest all-ones square in a 0/1 matrix.",
        options: ["Grid DP: sum of up and left", "Largest-square DP: 1 + min(up, left, diag)", "2-D prefix sums only", "LCS over rows"],
        answer: 1,
        explain: "Signal: \"largest square of 1s\". `dp[r][c]` = side of the largest square with bottom-right corner (r, c); `= 1 + min(up, left, diag)` if the cell is 1.",
      },
      {
        kind: "quiz",
        teach: "A palindrome question on one string uses a table over the substring s[i..j]. The part you do not need to insert for is already a palindrome.",
        prompt: "Find the fewest insertions that make a string a palindrome.",
        options: ["n − LPS, with dp[i][j] over s[i..j]", "Edit distance from s to its reverse", "Two pointers from both ends, greedy", "Grid DP from top and left"],
        answer: 0,
        explain:
          "Signal: one string + \"palindrome\". Answer = n − LPS (longest palindromic subsequence). `dp[i][j]` = LPS of s[i..j]; equal ends → `2 + dp[i+1][j-1]`, else `max(dp[i+1][j], dp[i][j-1])`.",
      },
      {
        kind: "read",
        title: "Notice the signal",
        body:
          "One string with \"palindrome\" → the state is a substring `s[i..j]`, not two prefixes. Then `dp[i][j]` reads `dp[i+1][...]`, so i must run **downward** while j runs upward.\n\nThe last drill is two strings again, but with a yes/no answer.",
      },
      {
        kind: "quiz",
        teach: "Two strings with \"keep the order\" is prefix DP. If i characters of A and j of B are used, C's first i+j characters are covered.",
        prompt: "Can string C be formed by interleaving A and B while keeping each one's internal order?",
        options: ["Two pointers, greedy: take from A when it matches", "Boolean dp[i][j] over prefixes of A and B", "LCS of A and C", "Edit distance from A+B to C"],
        answer: 1,
        explain:
          "Signal: two strings + \"keep order\" + yes/no. `dp[i][j]` = the first i of A and the first j of B form the first i+j of C; `dp[i][j] = (dp[i-1][j] and A[i-1]==C[i+j-1]) or (dp[i][j-1] and B[j-1]==C[i+j-1])`. Greedy fails when both A and B match the next character.",
      },
      {
        kind: "practice",
        title: "Today's problems",
        intro: DAILY_RULES + " Problem 8 is overflow. Problem 3 is the core template: type it from memory.",
        problems: [
          { ref: "LC 62 Unique Paths", tier: "warm", lvl: "M", box: 15, clue: "Warm-up. Write the rolling 1-row version." },
          { ref: "LC 64 Minimum Path Sum", tier: "warm", lvl: "M", box: 15, clue: "Same shape, but min + cost instead of a sum." },
          { ref: "LC 1143 Longest Common Subsequence", tier: "core", lvl: "M", box: 30, clue: "The core template. Type it from memory." },
          { ref: "LC 72 Edit Distance", tier: "core", lvl: "M", box: 30, clue: "Three operations = three neighbours. Get the base row and column right." },
          { ref: "LC 221 Maximal Square", tier: "core", lvl: "M", box: 30, clue: "1 + min(up, left, diag) when the cell is '1'." },
          { ref: "LC 516 Longest Palindromic Subsequence", tier: "core", lvl: "M", box: 30, clue: "dp[i][j] over s[i..j]. Fill i from n−1 down, j upward." },
          { ref: "CSES — Grid Paths I", tier: "core", lvl: "M", box: 45, clue: "Blocked cells, mod. Use the rolling template." },
          { ref: "CSES — Array Description", tier: "stretch", lvl: "M", box: 45, clue: "dp[i][v]; v comes from v−1, v, v+1. The state includes the value. (overflow)" },
        ],
      },
      {
        kind: "reveal",
        prompt: "End-of-day check 1. In edit distance, which neighbour is \"insert\", which is \"delete\", and which is \"replace\"? Why is `dp[0][j] = j`?",
        answer:
          "Left `dp[i][j-1]` = insert (b's last character is produced, so b shrinks). Up `dp[i-1][j]` = delete (a's last character is removed). Diagonal `dp[i-1][j-1]` = replace (both shrink). `dp[0][j] = j` because turning the empty string into j characters takes exactly j inserts.",
      },
      {
        kind: "reveal",
        prompt: "End-of-day check 2. For LPS on s[i..j], why must i run downward while j runs upward?",
        answer:
          "`dp[i][j]` reads `dp[i+1][j-1]`, `dp[i+1][j]` and `dp[i][j-1]`. Row i+1 must be finished before row i, so i goes from n-1 down. Within a row, `dp[i][j-1]` must be ready before `dp[i][j]`, so j goes up.",
      },
      {
        kind: "reveal",
        prompt: "End-of-day check 3. Why does the 1-row grid template work without a second array?",
        answer:
          "When you reach `dp[c]` in row r, it still holds row r-1's value: the cell above. `dp[c-1]` has already been overwritten with row r's value: the cell to the left. Those are exactly the two cells the recurrence needs, and the old value is read once before it is replaced.",
      },
      {
        kind: "summary",
        points: [
          "Right/down grid → dp[r][c]. Two strings → dp[i][j] over prefixes. One string + palindrome → dp[i][j] over s[i..j].",
          "Delete-only between two strings → n + m − 2·LCS. Fewest insertions to a palindrome → n − LPS.",
          "Largest square → 1 + min(up, left, diag).",
          SUMMARY_END,
        ],
      },
    ],
  },

  /* =====================================================================
     Day 17 A: knapsack family
     ===================================================================== */
  {
    id: "ch06-l5",
    day: 17,
    title: "Day 17: The knapsack family",
    goal: "Pick the right knapsack variant and the right loop direction in under 15 seconds, and write each template.",
    minutes: 14,
    steps: [
      {
        kind: "read",
        title: "Items and a capacity",
        body:
          "A **[[knapsack]]** problem gives you items, each with a weight (or size) and a value, and a capacity or a target sum. You choose which items to use.\n\nThe variants differ in one detail: can an item be used **once**, or **many times**? And when you count, does **order** matter?\n\n**Goal:** given a capacity or target sum and a set of items, pick the right variant and the right **loop direction** in under 15 seconds.",
      },
      {
        kind: "quiz",
        guess: true,
        prompt: "Take a guess. Items (weight, value): (1, 15), (3, 20), (4, 30). Capacity 4. Each item at most once. What is the best total value?",
        options: ["30", "35", "45", "50"],
        answer: 1,
        explain:
          "35: take the weight-1 and weight-3 items (15 + 20). The single weight-4 item gives only 30. The greedy idea \"take the most valuable item\" fails, which is why we build a table.",
      },
      {
        kind: "read",
        title: "0/1 knapsack: the state",
        body:
          "Process items one at a time. Each item's last choice is \"use it or not\".\n\n- **State:** `dp[c]` = best value with capacity c, using the items seen so far.\n- **Recurrence:** for an item (w, v): `dp[c] = max(dp[c], dp[c-w] + v)`.\n- **Base:** before any item, `dp[c] = 0` for every c.\n- **Answer cell:** `dp[W]`.\n\nThe table below keeps one row per item, so you can see each step. Row \"none\" is the base.",
        visual: {
          kind: "grid",
          cells: [[0, 0, 0, 0, 0], ["", "", "", "", ""], ["", "", "", "", ""], ["", "", "", "", ""]],
          rowLabels: KN_ROWS,
          colLabels: idx(5),
          tones: { "0,0": "good", "0,1": "good", "0,2": "good", "0,3": "good", "0,4": "good" },
          caption: "Columns = capacity c. Items: 1 = (1, 15), 2 = (3, 20), 3 = (4, 30).",
        },
      },
      {
        kind: "read",
        title: "Item 1: (1, 15)",
        body:
          "Each cell reads the row above twice: straight up (skip the item) and w columns to the left (take it).\n\n`dp[1] = max(skip 0, take 0 + 15) = 15`. Every capacity ≥ 1 can hold this item, so the row is 0 15 15 15 15.",
        visual: {
          kind: "grid",
          cells: [[0, 0, 0, 0, 0], [0, 15, 15, 15, 15], ["", "", "", "", ""], ["", "", "", "", ""]],
          rowLabels: KN_ROWS,
          colLabels: idx(5),
          tones: { "1,1": "accent" },
          arrows: [
            { from: [0, 1], to: [1, 1], tone: "warn" },
            { from: [0, 0], to: [1, 1], tone: "good" },
          ],
        },
      },
      {
        kind: "read",
        title: "Item 2: (3, 20)",
        body:
          "`dp[3] = max(skip 15, take dp_above[0] + 20 = 20) = 20`.\n\n`dp[4] = max(skip 15, take dp_above[1] + 20 = 35) = 35`. Taking item 2 leaves capacity 1, and the row above says capacity 1 is worth 15.",
        visual: {
          kind: "grid",
          cells: [[0, 0, 0, 0, 0], [0, 15, 15, 15, 15], [0, 15, 15, 20, 35], ["", "", "", "", ""]],
          rowLabels: KN_ROWS,
          colLabels: idx(5),
          tones: { "2,4": "accent" },
          arrows: [
            { from: [1, 4], to: [2, 4], tone: "warn" },
            { from: [1, 1], to: [2, 4], tone: "good" },
          ],
        },
      },
      {
        kind: "read",
        title: "Item 3: (4, 30) and the answer",
        body:
          "`dp[4] = max(skip 35, take dp_above[0] + 30 = 30) = 35`. Skipping wins.\n\nThe answer cell `dp[4]` in the last row is 35, the same answer as the guess.",
        visual: {
          kind: "grid",
          cells: [[0, 0, 0, 0, 0], [0, 15, 15, 15, 15], [0, 15, 15, 20, 35], [0, 15, 15, 20, 35]],
          rowLabels: KN_ROWS,
          colLabels: idx(5),
          tones: { "3,4": "accent" },
          arrows: [
            { from: [2, 4], to: [3, 4], tone: "warn" },
            { from: [2, 0], to: [3, 4], tone: "good" },
          ],
          caption: "Answer cell = 35.",
        },
      },
      {
        kind: "read",
        title: "One row, but which direction?",
        body:
          "Each row reads only the row above, so one array is enough. But the **direction of the inner loop** decides whether an item can be reused.\n\nOne item (1, 15), W = 2:\n\n- **Ascending** c: `dp[1] = 15`, then `dp[2] = dp[1] + 15 = 30`. `dp[1]` was already updated, so the item was used twice. Wrong for 0/1.\n- **Descending** c: `dp[2] = old dp[1] + 15 = 15`, then `dp[1] = 15`. Each item once. That is **[[0/1 knapsack|0/1]]**.",
        visual: {
          kind: "array",
          rows: [
            { label: "ascending", items: [0, 15, 30], tones: { 2: "bad" } },
            { label: "descending", items: [0, 15, 15], tones: { 2: "good" } },
          ],
          indices: true,
          caption: "Same item, same W = 2. Only the loop direction differs.",
        },
      },
      {
        kind: "widget",
        widget: "dp-table",
        title: "Knapsack, cell by cell",
        task: "Run the 0/1 knapsack table and say each cell's two choices (skip, take) before you step. Then switch to the 1-D backwards loop and check that each item is used once.",
        props: { mode: "knapsack" },
      },
      {
        kind: "read",
        title: "The 0/1 template",
        body:
          "`for c in range(W, w - 1, -1)` runs c from W **down** to w. So `dp[c - w]` has not been updated for this item yet, and it still means \"without this item\". Capacities below w can't hold the item, so the loop stops there.\n\nMental test: one item (1, 15), W = 2 → `dp[2] = 15`, `dp[1] = 15`. Answer 15, used once. Correct.",
        visual: { kind: "code", lang: "python", code: KNAP01 },
      },
      {
        kind: "code",
        title: "Now type it yourself",
        prompt: "Type the 0/1 knapsack from memory: one array, capacity loop **descending**.",
        starter: L("# def knap01(items, W):", "#   dp[c] = best value with capacity c", "#   for each (w, v): loop c from W down to w", "#   return dp[W]"),
        solution: KNAP01,
        tests: [
          { call: "knap01([(1, 15), (3, 20), (4, 30)], 4)", expect: "35" },
          { call: "knap01([(3, 30), (4, 50), (5, 60)], 8)", expect: "90" },
          { call: "knap01([(1, 15)], 2)", expect: "15", label: "item used once" },
          { call: "knap01([(5, 10)], 4)", expect: "0", label: "too heavy" },
          { call: "knap01([], 5)", expect: "0", label: "no items" },
        ],
        fromMemory: true,
        teach: "dp[c] = max(dp[c], dp[c-w] + v). Descending c keeps dp[c-w] from this item's own update.",
        explain: "The test with one item of weight 1 and W = 2 catches the wrong loop direction: ascending would return 30.",
      },
      {
        kind: "number",
        teach: "With an ascending loop, dp[c - w] may already include the current item, so the item can be counted again and again.",
        prompt: "A buggy 0/1 knapsack loops c **ascending**. One item (1, 10), W = 3. What does `dp[3]` end up as?",
        answer: 30,
        tolerance: 0.5,
        explain: "Ascending: `dp[1] = 10`, `dp[2] = dp[1] + 10 = 20`, `dp[3] = dp[2] + 10 = 30`. The item was used 3 times. The correct 0/1 answer is 10.",
      },
      {
        kind: "read",
        title: "Unbounded: ascending on purpose",
        body:
          "With unlimited copies (coins, unlimited supply), reuse is what you want: an [[unbounded knapsack]]. So loop c **ascending**: `dp[c - w]` may already include this item.\n\n**Min coins:**\n- **State:** `dp[a]` = fewest coins to make amount a.\n- **Recurrence:** `dp[a] = min(dp[a], dp[a - coin] + 1)`.\n- **Base:** `dp[0] = 0`; every other cell starts at INF = amount + 1.\n- **Answer:** `dp[amount]`, or -1 if it is still INF.\n\nCoins [1, 3, 4], amount 6. Coin 1 alone gives 0 1 2 3 4 5 6.",
        visual: {
          kind: "grid",
          cells: [[0, "INF", "INF", "INF", "INF", "INF", "INF"], [0, 1, 2, 3, 4, 5, 6], ["", "", "", "", "", "", ""], ["", "", "", "", "", "", ""]],
          rowLabels: CC_ROWS,
          colLabels: idx(7),
          tones: { "0,0": "good" },
          arrows: [{ from: [1, 1], to: [1, 2], tone: "warn" }],
        },
      },
      {
        kind: "read",
        title: "Coin 3: reuse inside the row",
        body:
          "`dp[3] = min(3, dp[0] + 1) = 1`. Then `dp[6] = min(6, dp[3] + 1) = 2`. The arrow stays **inside the row**: `dp[3]` already used coin 3, so 6 = 3 + 3 uses it twice. That is exactly what ascending allows.",
        visual: {
          kind: "grid",
          cells: [[0, "INF", "INF", "INF", "INF", "INF", "INF"], [0, 1, 2, 3, 4, 5, 6], [0, 1, 2, 1, 2, 3, 2], ["", "", "", "", "", "", ""]],
          rowLabels: CC_ROWS,
          colLabels: idx(7),
          tones: { "2,3": "warn", "2,6": "accent" },
          arrows: [{ from: [2, 3], to: [2, 6], tone: "warn" }],
        },
      },
      {
        kind: "read",
        title: "Coin 4 and the answer",
        body:
          "`dp[4] = min(2, dp[0] + 1) = 1`. `dp[5] = min(3, dp[1] + 1) = 2`. `dp[6] = min(2, dp[2] + 1 = 3) = 2`.\n\nThe answer is 2 coins (3 + 3). Greedy \"take the biggest coin first\" gives 4 + 1 + 1 = 3 coins: the 30-second counterexample that says DP.",
        visual: {
          kind: "grid",
          cells: [[0, "INF", "INF", "INF", "INF", "INF", "INF"], [0, 1, 2, 3, 4, 5, 6], [0, 1, 2, 1, 2, 3, 2], [0, 1, 2, 1, 1, 2, 2]],
          rowLabels: CC_ROWS,
          colLabels: idx(7),
          tones: { "3,6": "accent" },
          arrows: [
            { from: [2, 6], to: [3, 6], tone: "warn" },
            { from: [3, 2], to: [3, 6], tone: "warn" },
          ],
          caption: "Answer cell = 2.",
        },
      },
      {
        kind: "widget",
        widget: "dp-table",
        title: "Coin change, cell by cell",
        task: "Step through coins [1, 3, 4] with amount 6. Watch the arrow stay inside the row when a coin is reused. Check that the answer cell is 2, not the greedy 3.",
        props: { mode: "coin-change" },
      },
      {
        kind: "read",
        title: "The min-coins template",
        body:
          "`dp = [0] + [INF] * amount` sets the base. Coins are the outer loop, amounts the inner loop, **ascending** from `coin`. At the end, a cell still at INF means the amount can't be made.\n\nMental test: coins [2], amount 3 → `dp = [0, 4, 1, 4]`. `dp[3]` is INF (4), so return -1. Correct.",
        visual: { kind: "code", lang: "python", code: MIN_COINS },
        callout: {
          type: "trap",
          text: "For \"min coins\", use `amount + 1` as infinity, not `float('inf')`. Mixing floats and ints is slower, and you'd need an extra conversion when you return the answer.",
        },
      },
      {
        kind: "code",
        title: "Coin change (min coins)",
        prompt: "Write `min_coins(coins, amount)`: the fewest coins that make `amount`, unlimited copies, or -1.",
        starter: L("def min_coins(coins, amount):", "    pass"),
        solution: MIN_COINS,
        tests: [
          { call: "min_coins([1, 3, 4], 6)", expect: "2" },
          { call: "min_coins([1, 2, 5], 11)", expect: "3" },
          { call: "min_coins([2], 3)", expect: "-1", label: "unreachable" },
          { call: "min_coins([1], 0)", expect: "0", label: "amount 0" },
          { call: "min_coins([5], 5)", expect: "1" },
        ],
        teach: "dp[0] = 0, others INF = amount + 1. For each coin, loop a ascending: dp[a] = min(dp[a], dp[a - coin] + 1).",
        explain: "Ascending lets the same coin appear many times, which is what \"unlimited copies\" means.",
      },
      {
        kind: "read",
        title: "Counting: does order matter?",
        body:
          "For counting, the **loop nesting** decides whether order matters. Coins [1, 2], amount 3:\n\n- **Items outer**: each multiset is counted once: {1,1,1}, {1,2} → **2** (Coin Change II, combinations).\n- **Amount outer**: every ordering is counted: 1+1+1, 1+2, 2+1 → **3** (Combination Sum IV, sequences).\n\nBoth start with `dp[0] = 1` and add `dp[a - coin]`.",
        visual: {
          kind: "compare",
          left: { title: "Combinations (order doesn't matter)", points: ["for coin in coins:  (outer)", "  for a in range(coin, amount + 1):", "Coins [1, 2], amount 3 → 2"] },
          right: { title: "Sequences (order matters)", points: ["for t in range(1, target + 1):  (outer)", "  for x in nums:", "Coins [1, 2], amount 3 → 3"] },
        },
      },
      {
        kind: "read",
        title: "The two counting templates",
        body:
          "Items outer: once you move past a coin, it never comes back, so every multiset is built in one fixed coin order and counted once. Amount outer: at each total, any item can be the last one, so every ordering is counted.\n\nMental test, `count_combinations([2], 3)`: `dp = [1, 0, 1, 0]` → 0 ways. Correct.",
        visual: { kind: "code", lang: "python", code: COUNTS },
      },
      {
        kind: "code",
        title: "Count both ways",
        prompt: "Write both `count_combinations(coins, amount)` (items outer) and `count_sequences(nums, target)` (amount outer).",
        starter: L("def count_combinations(coins, amount):", "    pass", "", "def count_sequences(nums, target):", "    pass"),
        solution: COUNTS,
        tests: [
          { call: "count_combinations([1, 2, 5], 5)", expect: "4" },
          { call: "count_sequences([1, 2, 3], 4)", expect: "7" },
          { call: "count_combinations([1, 2], 3)", expect: "2" },
          { call: "count_sequences([1, 2], 3)", expect: "3" },
          { call: "count_combinations([2], 3)", expect: "0", label: "unreachable" },
          { call: "count_sequences([9], 3)", expect: "0", label: "item too big" },
        ],
        teach: "Both: dp[0] = 1, dp[a] += dp[a - x]. Combinations put the items in the outer loop; sequences put the amount in the outer loop.",
        explain: "The two functions differ only in which loop is outside. Compare them line by line.",
      },
      {
        kind: "number",
        teach: "Order matters here, so 1+2 and 2+1 are different. List every ordering, or fill dp with the amount in the outer loop.",
        prompt: "`count_sequences([1, 2], 4)`: how many ordered ways make 4 from 1s and 2s?",
        answer: 5,
        tolerance: 0.5,
        explain: "1+1+1+1, 1+1+2, 1+2+1, 2+1+1, 2+2 → 5. With the table: dp = 1, 1, 2, 3, 5.",
      },
      {
        kind: "read",
        title: "Subset sum with a big-int bitset",
        body:
          "\"Is sum s reachable?\" is 0/1 knapsack with yes/no cells. Faster in Python: store the reachable sums as the bits of one integer. Bit s is 1 if sum s is reachable.\n\nStart with `bits = 1` (only sum 0). For each x, `bits |= bits << x`: every old sum s also gives s + x. The shift uses the **old** set, so each x is used once.\n\nExample [1, 5, 11, 5]: total 22; sum 11 is reachable (1 + 5 + 5).",
        visual: { kind: "code", lang: "python", code: PARTITION },
      },
      {
        kind: "read",
        title: "Why the bitset is fast",
        body: "A machine word holds 64 bits, so one shift-and-OR moves 64 sums at once.",
        callout: {
          type: "move",
          text: "The bitset runs about 64 sums per machine operation. It turns a 10^8 subset-sum loop into roughly 10^6 word operations. Any \"is sum s reachable\" question with sums up to about 10^6 should use it in Python.",
        },
      },
      {
        kind: "code",
        title: "Partition Equal Subset Sum",
        prompt: "Write `can_partition(nums)`: can the list split into two groups with equal sums? Use the bitset.",
        starter: L("def can_partition(nums):", "    pass"),
        solution: PARTITION,
        tests: [
          { call: "can_partition([1, 5, 11, 5])", expect: "True" },
          { call: "can_partition([1, 2, 3, 5])", expect: "False" },
          { call: "can_partition([1])", expect: "False", label: "odd total" },
          { call: "can_partition([2, 2])", expect: "True" },
          { call: "can_partition([3, 3, 3, 3])", expect: "True", label: "all equal" },
        ],
        teach: "An odd total can't split. Otherwise build the reachable sums with bits |= bits << x and test bit total // 2.",
        explain: "`(bits >> (total // 2)) & 1` reads one bit: whether sum total/2 is reachable.",
      },
      {
        kind: "read",
        title: "Complexity: items x capacity",
        body:
          "Every knapsack table costs **items x capacity**.\n\n- 100 x 10^5 = 10^7: fine in PyPy.\n- 1000 x 10^5 = 10^8: TLE in Python.\n\nIf you see the second case, look for the bitset trick or a **value swap**: when the capacity is huge (up to 10^9) but values are small, make the value the index: `dp[value]` = min weight for that value.",
      },
      {
        kind: "read",
        title: "Common mistake: loop direction",
        body: "This bug passes small hand tests and fails on the judge.",
        callout: {
          type: "mistake",
          text: "Getting the loop direction wrong. Ascending in a 0/1 problem silently lets you reuse items, so the answers come out too big. Test with one item of weight 1 and W = 2. The 0/1 answer must use it once.",
        },
      },
      {
        kind: "read",
        title: "15-second clues",
        body: "Read the item rule, then pick the variant and the loop direction.",
        callout: {
          type: "clue",
          text: "- \"Each item at most once\" + capacity or target → 0/1, capacity loop **descending**.\n- \"Unlimited copies\" → unbounded, capacity loop **ascending**.\n- \"Number of combinations\" (order doesn't matter) → items outer, amount inner.\n- \"Number of sequences\" (order matters) → amount outer, items inner.\n- \"Split into two groups with equal or closest sums\" → subset sum over total/2.\n- Capacity up to 10^9 but small values → swap roles: `dp[value] = min weight`.",
        },
      },
      {
        kind: "summary",
        points: [
          "State dp[c] = best/ways/reachable with capacity or sum exactly c; each item's last choice is use it or not.",
          "Descending capacity loop = each item once (0/1). Ascending = unlimited copies (unbounded).",
          "Counting: items outer = combinations (LC 518); amount outer = sequences (LC 377).",
          "Subset sum in Python: bits |= bits << x, about 64 sums per operation.",
          "Cost = items x capacity; 10^8 is TLE, so look for the bitset or a value swap.",
        ],
      },
    ],
  },

  /* =====================================================================
     Day 17 B: drill
     ===================================================================== */
  {
    id: "ch06-l6",
    day: 17,
    title: "Day 17 drill: pick the knapsack",
    goal: "Name the knapsack variant and loop direction of disguised problems and work the Day 17 problem list.",
    minutes: 11,
    steps: [
      {
        kind: "read",
        title: "Recap, then drill",
        body:
          "Two questions pick the variant. **Once or many times?** Once → descending; many → ascending. **When counting, does order matter?** No → items outer; yes → amount outer.\n\nThis lesson gives you 5 disguised problems, then the bitset from memory, the problem list and the end-of-day check.",
        visual: {
          kind: "table",
          headers: ["Variant", "Loop"],
          rows: [
            ["0/1 (each item once)", "capacity descending"],
            ["Unbounded (unlimited copies)", "capacity ascending"],
            ["Count combinations", "items outer"],
            ["Count sequences", "amount outer"],
            ["Sum reachable?", "bits |= bits << x"],
          ],
        },
      },
      {
        kind: "quiz",
        teach: "Two groups with close sums: one group's sum decides the other's. Ask which sums one group can reach.",
        prompt: "Split a list of weights into two groups so the difference of their sums is as small as possible.",
        options: ["Subset sum (0/1, or the bitset)", "Unbounded knapsack (ascending)", "Greedy: sort and alternate", "Counting sequences (amount outer)"],
        answer: 0,
        explain: "Signal: \"split into two groups\" + closest sums. `dp[s]` = sum s is reachable (0/1, descending, or the bitset); answer = min |total − 2s|.",
      },
      {
        kind: "quiz",
        teach: "Unlimited copies of each value, and you want the fewest pieces. Recall which loop direction allows reuse.",
        prompt: "Find the fewest stamps that make an exact postage, with unlimited stamps of each value.",
        options: ["0/1 knapsack (descending)", "Unbounded min (ascending)", "Counting combinations (items outer)", "Greedy: biggest stamp first"],
        answer: 1,
        explain: "Signal: \"unlimited\" + \"fewest\" + exact total. `dp[a]` = fewest stamps for a; `dp[a] = min(dp[a], dp[a - c] + 1)`, ascending.",
      },
      {
        kind: "read",
        title: "Notice the signal",
        body:
          "\"Two groups\" hides a subset sum: you only choose one group. \"Unlimited\" means ascending. And a coin system where greedy works is rare: always test 3 + 3 versus 4 + 1 + 1 before trusting greedy.",
      },
      {
        kind: "quiz",
        teach: "Different orders of the same step sizes count as different here. Recall which loop goes outside when order matters.",
        prompt: "Count the different orders of steps (sizes from a set) that climb exactly n stairs.",
        options: ["Counting combinations (items outer)", "Counting sequences (amount outer)", "0/1 subset count (descending)", "Min-cost DP"],
        answer: 1,
        explain: "Signal: \"different orders\" + exact total. `dp[s]` = ordered ways; `dp[s] = sum(dp[s - c])`, amount outer (sequences).",
      },
      {
        kind: "quiz",
        teach: "Each string is an item used at most once, but it costs two resources. A capacity with two numbers gives a 2-D table.",
        prompt: "Each string costs some 0s and some 1s. With at most m zeros and k ones, pick as many strings as possible.",
        options: ["Unbounded knapsack over zeros only", "0/1 knapsack with a 2-D capacity, both loops descending", "Greedy: cheapest strings first", "Counting sequences"],
        answer: 1,
        explain: "Signal: two budgets + each item once. `dp[z][o]` = most strings within z zeros and o ones; 0/1 over strings, both loops descending.",
      },
      {
        kind: "read",
        title: "Notice the signal",
        body:
          "Two budgets → two capacity dimensions, and both loops run descending for 0/1. The last drill has a capacity that is far too big for a table. Look at what else is small.",
      },
      {
        kind: "quiz",
        teach: "A table over capacity needs W cells. When W is huge but values are small, the small thing can become the index instead.",
        prompt: "Items have weights up to 10^9 and values up to 1000, with N ≤ 100. Maximise value within capacity W.",
        options: ["Plain 0/1 over capacity", "Value swap: dp[v] = min weight for value v", "Bitset over weights", "Unbounded knapsack"],
        answer: 1,
        explain:
          "Signal: capacity 10^9 but small values. `dp[v]` = min weight to get value exactly v; 0/1 descending over v; answer = max v with `dp[v] ≤ W`. Total value ≤ 100 x 1000 = 10^5 cells.",
      },
      {
        kind: "practice",
        title: "Today's problems",
        intro:
          DAILY_RULES + " Problem 8 is overflow. The last two rows are extras, only if you're ahead. CSES — Book Shop is the classic 0/1 problem, but 1000 x 10^5 is a known TLE risk in Python: submit it with PyPy, and if it fails, log \"Python TLE\" and move on.",
        problems: [
          { ref: "AtCoder DP Contest — D Knapsack 1", tier: "warm", lvl: "E", box: 15, clue: "Plain 0/1, descending loop. W ≤ 10^5, N ≤ 100." },
          { ref: "LC 322 Coin Change", tier: "core", lvl: "M", box: 30, clue: "Unbounded min. Ascending. Return −1 if unreachable." },
          { ref: "LC 518 Coin Change II", tier: "core", lvl: "M", box: 30, clue: "Combinations: coins outer." },
          { ref: "LC 377 Combination Sum IV", tier: "core", lvl: "M", box: 30, clue: "Sequences: target outer. Compare it with #3 line by line." },
          { ref: "LC 416 Partition Equal Subset Sum", tier: "core", lvl: "M", box: 30, clue: "Subset sum to total/2. Write it with an array, then with the bitset." },
          { ref: "LC 494 Target Sum", tier: "core", lvl: "M", box: 30, clue: "Signs split the numbers into P and N. P = (total + target) / 2 → count subsets. Check parity and abs(target) ≤ total." },
          { ref: "CSES — Coin Combinations II", tier: "core", lvl: "M", box: 45, clue: "Unordered, mod. Then read Coin Combinations I and say which loop order it needs." },
          { ref: "AtCoder DP Contest — E Knapsack 2", tier: "stretch", lvl: "M", box: 45, clue: "W ≤ 10^9, values small → dp[v] = min weight for value v. (overflow)" },
          { ref: "LC 474 Ones and Zeroes", tier: "stretch", lvl: "M", box: 30, clue: "Extra: 2-D capacity, both loops descending." },
          { ref: "CSES — Book Shop", tier: "stretch", lvl: "M", box: 45, clue: "Extra: classic 0/1 at 1000 x 10^5. PyPy; if TLE, log \"Python TLE\"." },
        ],
      },
      {
        kind: "reveal",
        prompt: "End-of-day check 1. Why does a descending capacity loop mean \"each item once\"? Explain it with `dp[c - w]`.",
        answer:
          "Going down, you update `dp[c]` before `dp[c - w]` (since c − w < c). So when `dp[c]` reads `dp[c - w]`, that cell still holds the value from **before** this item: \"without this item\". The item can be added only once. Ascending would read a `dp[c - w]` that may already contain it.",
      },
      {
        kind: "reveal",
        prompt: "End-of-day check 2. Coin Change II vs Combination Sum IV: which loop is outer in each, and why?",
        answer:
          "Coin Change II (combinations): coins outer. Each coin is fully processed before the next, so every multiset is built in one fixed coin order and counted once. Combination Sum IV (sequences): amount outer. At each total, any number can be the last one, so 1+2 and 2+1 are both counted.",
      },
      {
        kind: "code",
        title: "End-of-day check 3: the bitset from memory",
        prompt: "Write the 3-line bitset subset sum from memory: `can_reach(nums, s)` returns True if some subset of `nums` sums to exactly `s`.",
        starter: L("def can_reach(nums, s):", "    # start with only sum 0 reachable", "    # shift in each x", "    # read bit s"),
        solution: L("def can_reach(nums, s):", "    bits = 1", "    for x in nums:", "        bits |= bits << x", "    return (bits >> s) & 1 == 1"),
        tests: [
          { call: "can_reach([3, 34, 4, 12, 5, 2], 9)", expect: "True" },
          { call: "can_reach([3, 34, 4, 12, 5, 2], 30)", expect: "False" },
          { call: "can_reach([5], 3)", expect: "False" },
          { call: "can_reach([2, 2], 4)", expect: "True", label: "uses both copies" },
          { call: "can_reach([], 0)", expect: "True", label: "empty set" },
        ],
        fromMemory: true,
        teach: "bits = 1 means only sum 0. bits |= bits << x adds x to every old sum. Bit s tells you if s is reachable.",
        explain: "Because `bits << x` uses the old set, each x is added once: this is 0/1, not unbounded.",
      },
      {
        kind: "summary",
        points: [
          "Two groups with close sums → subset sum over total/2.",
          "Unlimited + fewest → unbounded min, ascending. Different orders → amount outer.",
          "Two budgets → 2-D 0/1, both loops descending. Huge capacity, small values → dp[value] = min weight.",
          SUMMARY_END,
        ],
      },
    ],
  },

  /* =====================================================================
     Day 18 A: LIS + interval DP
     ===================================================================== */
  {
    id: "ch06-l7",
    day: 18,
    title: "Day 18: LIS in n log n and interval DP",
    goal: "Write LIS with bisect in 6 lines, and solve merge-or-split range problems with an interval DP that loops over length.",
    minutes: 14,
    steps: [
      {
        kind: "read",
        title: "Two new shapes",
        body:
          "Today has two DP shapes. **LIS** finds the longest increasing subsequence fast, with binary search. **[[Interval DP]]** solves problems where you merge or split a contiguous range.\n\n**Goal:** write LIS with `bisect` in 6 lines, and recognise \"merge or split a contiguous range\" as interval DP with a length-ordered loop.",
      },
      {
        kind: "read",
        title: "What LIS means",
        body:
          "A **[[subsequence]]** keeps some elements in their original order, not necessarily next to each other. The **[[longest increasing subsequence]]** (LIS) is the longest one whose values strictly increase.\n\nIn `[10, 9, 2, 5, 3, 7, 101, 18]`, one LIS is 2, 3, 7, 18 (green). Its length is 4.",
        visual: {
          kind: "array",
          rows: [{ label: "nums", items: LIS_NUMS, tones: { 2: "good", 4: "good", 5: "good", 7: "good" } }],
          indices: true,
        },
      },
      {
        kind: "quiz",
        guess: true,
        prompt: "Take a guess. What is the LIS length of `[0, 1, 0, 3, 2, 3]`?",
        options: ["3", "4", "5", "6"],
        answer: 1,
        explain: "4: for example 0, 1, 2, 3 (indices 0, 1, 4, 5). Next you'll see a table that finds this without listing subsequences.",
      },
      {
        kind: "read",
        title: "The O(n^2) DP",
        body:
          "- **State:** `dp[i]` = length of the longest increasing subsequence that **ends at** index i.\n- **Recurrence:** `dp[i] = 1 + max(dp[j])` over j < i with `a[j] < a[i]`.\n- **Base:** `dp[i] = 1` (the element alone).\n- **Answer:** `max(dp)`.\n\nAt i = 5 (value 7), the earlier smaller values are 2, 5 and 3 (orange) with dp 1, 2, 2. So `dp[5] = 1 + 2 = 3`.",
        visual: {
          kind: "array",
          rows: [
            { label: "nums", items: LIS_NUMS, tones: { 2: "warn", 3: "warn", 4: "warn", 5: "accent" } },
            { label: "dp", items: [1, 1, 1, 2, 2, 3, 4, 4], tones: { 5: "accent" }, pointers: [{ at: 5, label: "i" }] },
          ],
          indices: true,
        },
      },
      {
        kind: "read",
        title: "Too slow for 10^5",
        body:
          "Each `dp[i]` scans every earlier j, so this costs n states x O(n) = O(n^2). For n = 10^5 that is 10^10 steps: far too slow. Write it once to learn it, then switch to the fast version.",
        visual: { kind: "code", lang: "python", code: LIS_SLOW },
      },
      {
        kind: "read",
        title: "The tails idea",
        body:
          "Keep a list `tails`. **`tails[k]` = the smallest possible last value of an increasing subsequence of length k+1.** A smaller last value is better, because more numbers can follow it.\n\n`tails` is always **sorted**. For each x, binary-search the first tail ≥ x and replace it with x. If no tail is ≥ x, append x. The length of `tails` is the LIS length.\n\n`tails` is **not** the subsequence itself, only its length is right.",
      },
      {
        kind: "read",
        title: "x = 10, 9, 2",
        body:
          "x = 10: tails is empty, so append → [10].\n\nx = 9: the first tail ≥ 9 is 10. Replace: [9]. A length-1 subsequence ending in 9 beats one ending in 10.\n\nx = 2: replace 9 → [2].",
        visual: {
          kind: "array",
          rows: [
            { label: "nums", items: LIS_NUMS, pointers: [{ at: 2, label: "x" }], tones: { 2: "accent" } },
            { label: "tails", items: [2], tones: { 0: "warn" } },
          ],
          indices: true,
        },
      },
      {
        kind: "read",
        title: "x = 5: append",
        body: "x = 5: no tail is ≥ 5 (tails is [2]). So 5 extends the longest subsequence: append → [2, 5]. LIS length is now 2.",
        visual: {
          kind: "array",
          rows: [
            { label: "nums", items: LIS_NUMS, pointers: [{ at: 3, label: "x" }], tones: { 3: "accent" } },
            { label: "tails", items: [2, 5], tones: { 1: "good" } },
          ],
          indices: true,
        },
      },
      {
        kind: "read",
        title: "x = 3: replace",
        body:
          "x = 3: `bisect_left([2, 5], 3) = 1`, the first tail ≥ 3 is 5. Replace it: [2, 3].\n\nThe length stays 2, but a length-2 subsequence can now end in 3 instead of 5. That leaves more room for what comes next.",
        visual: {
          kind: "array",
          rows: [
            { label: "nums", items: LIS_NUMS, pointers: [{ at: 4, label: "x" }], tones: { 4: "accent" } },
            { label: "tails", items: [2, 3], tones: { 1: "warn" } },
          ],
          indices: true,
        },
      },
      {
        kind: "read",
        title: "x = 7, 101: append twice",
        body: "x = 7 is bigger than every tail: append → [2, 3, 7]. x = 101: append → [2, 3, 7, 101]. Length 4.",
        visual: {
          kind: "array",
          rows: [
            { label: "nums", items: LIS_NUMS, pointers: [{ at: 6, label: "x" }], tones: { 6: "accent" } },
            { label: "tails", items: [2, 3, 7, 101], tones: { 2: "good", 3: "good" } },
          ],
          indices: true,
        },
      },
      {
        kind: "read",
        title: "x = 18: replace, and the answer",
        body:
          "x = 18: the first tail ≥ 18 is 101 (index 3). Replace: [2, 3, 7, 18].\n\nThe answer is `len(tails) = 4`. Each element costs one binary search, so the total is O(n log n).",
        visual: {
          kind: "array",
          rows: [
            { label: "nums", items: LIS_NUMS, pointers: [{ at: 7, label: "x" }], tones: { 7: "accent" } },
            { label: "tails", items: [2, 3, 7, 18], tones: { 3: "warn" }, ranges: [{ from: 0, to: 3, tone: "good", label: "length 4" }] },
          ],
          indices: true,
        },
      },
      {
        kind: "widget",
        widget: "lis",
        title: "Patience tails",
        task: "Step through the same array. Before each step, predict: append or replace, and at which index? Check that the final length is 4. Then press Random and predict the length before you run it.",
        props: { mode: "tails", nums: LIS_NUMS },
      },
      {
        kind: "read",
        title: "The LIS template",
        body:
          "`bisect_left(tails, x)` returns the first index whose tail is ≥ x. Equal to `len(tails)` → append; otherwise replace.\n\n- Strictly increasing → `bisect_left`.\n- Non-decreasing → `bisect_right` (an equal value may extend).\n\nMental test on `[7, 7, 7]`: tails becomes [7] and stays [7]. Length 1, correct for strict.",
        visual: { kind: "code", lang: "python", code: LIS },
      },
      {
        kind: "code",
        title: "Now type it yourself",
        prompt: "Type `lis_length(a)` from memory: strictly increasing, `tails` + `bisect_left`.",
        starter: L("# from bisect import bisect_left", "# def lis_length(a):", "#   tails = []", "#   for each x: find i, append or replace", "#   return len(tails)"),
        solution: LIS,
        tests: [
          { call: "lis_length([10, 9, 2, 5, 3, 7, 101, 18])", expect: "4" },
          { call: "lis_length([0, 1, 0, 3, 2, 3])", expect: "4" },
          { call: "lis_length([7, 7, 7, 7])", expect: "1", label: "all equal" },
          { call: "lis_length([5])", expect: "1" },
          { call: "lis_length([])", expect: "0", label: "empty" },
        ],
        fromMemory: true,
        teach: "tails[k] = smallest last value of an increasing subsequence of length k+1. i = bisect_left(tails, x); append if i == len(tails), else replace.",
        explain: "6 lines plus the import. For non-decreasing, change only `bisect_left` to `bisect_right`.",
      },
      {
        kind: "quiz",
        teach: "Find the first tail that is greater than or equal to x. If there is one, x replaces it; if not, x is appended.",
        prompt: "`tails = [2, 5, 8]` and the next value is x = 4. What does `tails` become?",
        options: ["[2, 4, 8]", "[2, 5, 8, 4]", "[2, 4, 5, 8]", "[4, 5, 8]"],
        answer: 0,
        explain: "`bisect_left([2, 5, 8], 4) = 1`. The first tail ≥ 4 is 5, so 4 replaces it: [2, 4, 8]. The length stays 3.",
      },
      {
        kind: "read",
        title: "LIS in disguise",
        body:
          "Two common disguises:\n\n- **Nesting** envelopes, boxes or dolls (2-D): sort by one dimension, then run LIS on the other.\n- **Minimum deletions to make it sorted** = n − LIS.",
        callout: {
          type: "mistake",
          text: "Russian Doll Envelopes: sort by width ascending and, **for equal widths, height descending**. Then run strict LIS on the heights. Otherwise two envelopes with the same width chain together.",
        },
      },
      {
        kind: "read",
        title: "Interval DP: the state is a range",
        body:
          "- **State:** `dp[l][r]` = the best answer for the subarray l..r **alone**.\n- **Transition:** the last choice is a **split point k** inside the range: which balloon is burst last, which cut is made first, which merge happens last. Then `dp[l][r]` combines `dp[l][k]` and `dp[k][r]`.\n- **Order:** `dp[l][r]` reads strictly **shorter** ranges, so loop over **length first**, then over l.\n\nO(n^2) states x O(n) splits = O(n^3), fine for n ≤ 300-500 in PyPy.",
      },
      {
        kind: "read",
        title: "Burst Balloons: burst the last one",
        body:
          "Bursting balloon k earns `left neighbour x k x right neighbour`. Pad the row with 1s at both ends: `a = [1, 3, 1, 5, 1]` for nums [3, 1, 5].\n\n- **State:** `dp[l][r]` = best coins from bursting everything **strictly between** l and r.\n- **Recurrence:** pick the balloon k burst **last**. Its neighbours are then l and r: `dp[l][r] = max(dp[l][k] + dp[k][r] + a[l]·a[k]·a[r])`.\n- **Base:** r = l + 1 → nothing between → 0 (green).\n- **Answer cell:** `dp[0][4]`.",
        visual: {
          kind: "grid",
          cells: [["-", 0, "", "", ""], ["-", "-", 0, "", ""], ["-", "-", "-", 0, ""], ["-", "-", "-", "-", 0], ["-", "-", "-", "-", "-"]],
          rowLabels: idx(5).map((s) => "l=" + s),
          colLabels: idx(5).map((s) => "r=" + s),
          tones: { "0,1": "good", "1,2": "good", "2,3": "good", "3,4": "good" },
          caption: "a = [1, 3, 1, 5, 1]. Only cells with l < r are used.",
        },
      },
      {
        kind: "read",
        title: "Length 2: one balloon inside",
        body:
          "With one balloon inside, k has only one choice.\n\n`dp[0][2] = 0 + 0 + 1·3·1 = 3`. `dp[1][3] = 0 + 0 + 3·1·5 = 15` (k = 2, arrows). `dp[2][4] = 1·5·1 = 5`.",
        visual: {
          kind: "grid",
          cells: [["-", 0, 3, "", ""], ["-", "-", 0, 15, ""], ["-", "-", "-", 0, 5], ["-", "-", "-", "-", 0], ["-", "-", "-", "-", "-"]],
          rowLabels: idx(5).map((s) => "l=" + s),
          colLabels: idx(5).map((s) => "r=" + s),
          tones: { "1,3": "accent" },
          arrows: [
            { from: [1, 2], to: [1, 3], tone: "warn" },
            { from: [2, 3], to: [1, 3], tone: "warn" },
          ],
        },
      },
      {
        kind: "read",
        title: "Length 3: try each k",
        body:
          "`dp[1][4]`, balloons 2 and 3 inside:\n\n- k = 2 last: `dp[1][2] + dp[2][4] + 3·1·1 = 0 + 5 + 3 = 8`\n- k = 3 last: `dp[1][3] + dp[3][4] + 3·5·1 = 15 + 0 + 15 = 30`\n\nSo `dp[1][4] = 30` (arrows show k = 3). Likewise `dp[0][3] = 30`.",
        visual: {
          kind: "grid",
          cells: [["-", 0, 3, 30, ""], ["-", "-", 0, 15, 30], ["-", "-", "-", 0, 5], ["-", "-", "-", "-", 0], ["-", "-", "-", "-", "-"]],
          rowLabels: idx(5).map((s) => "l=" + s),
          colLabels: idx(5).map((s) => "r=" + s),
          tones: { "1,4": "accent" },
          arrows: [
            { from: [1, 3], to: [1, 4], tone: "warn" },
            { from: [3, 4], to: [1, 4], tone: "warn" },
          ],
        },
      },
      {
        kind: "read",
        title: "Length 4: the answer cell",
        body:
          "`dp[0][4]` tries k = 1, 2, 3. The best is k = 3 (balloon 5) last: `dp[0][3] + dp[3][4] + 1·5·1 = 30 + 0 + 5 = 35`.\n\nWhen k bursts last, its neighbours are the fixed borders l and r, so the two sides are **independent**. Choosing the **first** balloon would not split it: its neighbours keep changing.",
        visual: {
          kind: "grid",
          cells: [["-", 0, 3, 30, 35], ["-", "-", 0, 15, 30], ["-", "-", "-", 0, 5], ["-", "-", "-", "-", 0], ["-", "-", "-", "-", "-"]],
          rowLabels: idx(5).map((s) => "l=" + s),
          colLabels: idx(5).map((s) => "r=" + s),
          tones: { "0,4": "accent" },
          arrows: [
            { from: [0, 3], to: [0, 4], tone: "warn" },
            { from: [3, 4], to: [0, 4], tone: "warn" },
          ],
          caption: "Answer cell dp[0][4] = 35.",
        },
      },
      {
        kind: "number",
        teach: "Each k gives dp[l][k] + dp[k][r] + a[l]·a[k]·a[r]. Work out the length-2 cells first, then try each k for the full range.",
        prompt: "Padded row `a = [1, 2, 4, 1]` (balloons 2 and 4). What is `dp[0][3]`?",
        answer: 12,
        tolerance: 0.5,
        explain:
          "Length 2: `dp[0][2] = 1·2·4 = 8`, `dp[1][3] = 2·4·1 = 8`. Then k = 1: `0 + 8 + 1·2·1 = 10`; k = 2: `8 + 0 + 1·4·1 = 12`. Best = 12.",
      },
      {
        kind: "read",
        title: "The Burst Balloons template",
        body:
          "Pad with 1s. The outer loop is `length` = r − l, from 2 up, so every shorter range is done first. Then l, then r = l + length. The inner loop tries each k as the last balloon. `al_ar` is hoisted out of the k loop for speed.\n\nMental test, `max_coins([7])`: a = [1, 7, 1], one cell `dp[0][2] = 1·7·1 = 7`. Correct.",
        visual: { kind: "code", lang: "python", code: BURST },
      },
      {
        kind: "code",
        title: "Burst Balloons",
        prompt: "Type `max_coins(nums)` from the template: pad with 1s, loop over length, then l, then the last balloon k.",
        starter: L("def max_coins(nums):", "    pass"),
        solution: BURST,
        tests: [
          { call: "max_coins([3, 1, 5, 8])", expect: "167" },
          { call: "max_coins([3, 1, 5])", expect: "35", label: "the example" },
          { call: "max_coins([1, 5])", expect: "10" },
          { call: "max_coins([7])", expect: "7", label: "one balloon" },
          { call: "max_coins([])", expect: "0", label: "no balloons" },
        ],
        teach: "dp[l][r] = best for balloons strictly between l and r. Try every k as the last one: dp[l][k] + dp[k][r] + a[l]·a[k]·a[r]. Loop over length first.",
        explain: "The answer cell `dp[0][n-1]` covers every real balloon, between the two padding 1s.",
      },
      {
        kind: "read",
        title: "Last or first?",
        body: "The split point is the whole trick in interval DP.",
        callout: {
          type: "move",
          text: "In interval DP, ask \"what happens **last** inside this range?\" or \"what happens **first**?\" One of the two makes the left and right parts independent. Try both in your head before you code.",
        },
      },
      {
        kind: "read",
        title: "Trap: interval DP with @cache",
        body: "Top-down is tempting here, and it is too slow.",
        callout: {
          type: "trap",
          text: "Interval DP with `@cache` on (l, r) for n = 500 creates 125k entries and up to 6·10^7 calls through the split loop. That's far too slow. Always write interval DP bottom-up with the length loop.",
        },
      },
      {
        kind: "read",
        title: "15-second clues",
        body: "LIS clues first, then interval DP clues.",
        callout: {
          type: "clue",
          text: "- \"Longest increasing / non-decreasing subsequence\", n up to 10^5 → patience tails + `bisect`.\n- \"Nest envelopes / boxes / dolls\" (2-D) → sort one dimension, LIS on the other.\n- \"Minimum deletions to make it sorted\" → n − LIS.\n- \"Burst / merge / cut / triangulate\", cost depends on neighbours or the range → interval DP `dp[l][r]`.\n- n ≤ 500 and the cost depends on a contiguous range → O(n^3) interval DP is fine.\n- Two players take from either end → interval DP on the score difference.",
        },
      },
      {
        kind: "summary",
        points: [
          "LIS: tails[k] = smallest last value of an increasing subsequence of length k+1; tails stays sorted.",
          "bisect_left for strictly increasing, bisect_right for non-decreasing. O(n log n).",
          "Interval DP: dp[l][r] for the range alone; the last choice is a split point k; loop over length first. O(n^3).",
          "Burst Balloons: the balloon burst last has the fixed borders l and r as neighbours, so the sides are independent.",
          "Never use @cache for interval DP at n = 500: write it bottom-up.",
        ],
      },
    ],
  },

  /* =====================================================================
     Day 18 B: drill
     ===================================================================== */
  {
    id: "ch06-l8",
    day: 18,
    title: "Day 18 drill: LIS or interval?",
    goal: "Tell LIS problems from interval DP problems in disguise and work the Day 18 problem list.",
    minutes: 10,
    steps: [
      {
        kind: "read",
        title: "Recap, then drill",
        body:
          "LIS: a sorted `tails` list and one `bisect` per element. Interval DP: `dp[l][r]` for a range, a split point k, and a loop over length first.\n\nThis lesson gives you 5 disguised problems, then the problem list and the end-of-day check.",
        visual: {
          kind: "compare",
          left: { title: "LIS", points: ["Subsequence, increasing", "tails + bisect_left (strict)", "O(n log n), n up to 10^5"] },
          right: { title: "Interval DP", points: ["Merge / cut / burst a contiguous range", "dp[l][r], split point k", "Length loop first, O(n^3), n ≤ 500"] },
        },
      },
      {
        kind: "quiz",
        teach: "Nesting needs both sides to grow. Sorting fixes one side, and the other side must then increase.",
        prompt: "Boxes (w, h) fit inside each other only if both sides are strictly smaller. Find the deepest nesting.",
        options: ["Sort by w (h descending on ties), then LIS on h", "Interval DP over the boxes", "Plain LIS on w only", "0/1 knapsack over boxes"],
        answer: 0,
        explain: "Signal: \"nest\" in 2-D. Sort by w ascending (h descending on ties); LIS on h with `tails` + `bisect_left`.",
      },
      {
        kind: "quiz",
        teach: "Whatever you keep must already be strictly increasing. Ask what you want to keep as long as possible.",
        prompt: "Find the fewest elements to remove so the array becomes strictly increasing (n = 10^5).",
        options: ["n − LIS, with tails + bisect_left", "O(n^2) LIS table", "Interval DP on the array", "Monotonic stack"],
        answer: 0,
        explain: "Signal: \"fewest to remove\" + \"increasing\" + n = 10^5. Answer = n − LIS; `tails[k]` = smallest tail of length k+1; `bisect_left`. The O(n^2) table would be 10^10 steps.",
      },
      {
        kind: "read",
        title: "Notice the signal",
        body:
          "\"Increasing\" or \"nest\" with a subsequence (any elements, kept in order) → LIS. The next three all act on a **contiguous** range where the cost depends on the range: that is interval DP.",
      },
      {
        kind: "quiz",
        teach: "A cut splits one piece into two independent pieces. Ask which cut happens first inside a piece.",
        prompt: "A log is cut at given marks. Each cut costs the length of the piece being cut. Minimise the total cost.",
        options: ["Greedy: cut in the middle first", "Interval DP over the sorted marks", "LIS on the marks", "Unbounded knapsack"],
        answer: 1,
        explain:
          "Signal: \"cut\" + cost = piece length. `dp[i][j]` over sorted marks (plus both ends) = min cost to finish the piece between marks i and j; `= (c[j] − c[i]) + min over k of dp[i][k] + dp[k][j]`; loop by length.",
      },
      {
        kind: "quiz",
        teach: "The last merge joins a left block and a right block. Its cost is the size of the whole range.",
        prompt: "Merge adjacent piles until one remains. Each merge costs the new pile's size. Minimise the total cost.",
        options: ["Heap: always merge the two smallest piles", "Interval DP with prefix sums", "LIS on the pile sizes", "Two pointers"],
        answer: 1,
        explain:
          "Signal: \"adjacent\" + merge cost = range sum. `dp[l][r]` = min cost to merge l..r into one pile; `= min over k of dp[l][k] + dp[k+1][r] + sum(l..r)`; prefix sums give the range sum; loop by length. The heap only works when any two piles may merge.",
      },
      {
        kind: "read",
        title: "Notice the signal",
        body:
          "Cut → ask which cut is **first**. Merge → ask which merge is **last**. Either way, the range splits into two independent ranges. The last drill uses a range differently: two players take from its ends.",
      },
      {
        kind: "quiz",
        teach: "After a player takes from one end, the rest is a smaller range, and it is the other player's turn. Store the score difference for whoever moves now.",
        prompt: "Two players alternately take a number from either end of a row. Find the first player's best score minus the second player's.",
        options: ["Greedy: take the larger end", "Interval DP on the score difference", "LIS on the row", "Prefix sums only"],
        answer: 1,
        explain:
          "Signal: \"either end\" + two players. `dp[l][r]` = best difference for the current player on l..r; `= max(a[l] − dp[l+1][r], a[r] − dp[l][r-1])`.",
      },
      {
        kind: "practice",
        title: "Today's problems",
        intro: DAILY_RULES + " Problem 8 is overflow. Problem 7 is the template: type it from memory.",
        problems: [
          { ref: "LC 300 Longest Increasing Subsequence", tier: "warm", lvl: "M", box: 15, clue: "Write O(n²) once, then the bisect version." },
          { ref: "CSES — Increasing Subsequence", tier: "core", lvl: "M", box: 30, clue: "n = 2·10^5 → only O(n log n) passes. Strict." },
          { ref: "LC 354 Russian Doll Envelopes", tier: "core", lvl: "H", box: 45, clue: "Sort (w asc, h desc), then LIS on h." },
          { ref: "LC 1964 Find the Longest Valid Obstacle Course at Each Position", tier: "core", lvl: "H", box: 45, clue: "Non-decreasing → bisect_right. The answer at i is the insert index + 1." },
          { ref: "LC 1039 Minimum Score Triangulation of Polygon", tier: "core", lvl: "M", box: 30, clue: "Edge (l, r) + apex k → dp[l][k] + dp[k][r] + v[l]·v[k]·v[r]." },
          { ref: "LC 1547 Minimum Cost to Cut a Stick", tier: "core", lvl: "H", box: 45, clue: "Sort cuts, add 0 and n. Interval over cut indices, cost = length of the range." },
          { ref: "LC 312 Burst Balloons", tier: "core", lvl: "H", box: 45, clue: "The \"last balloon\" trick. Type the template from memory." },
          { ref: "AtCoder DP Contest — N Slimes", tier: "stretch", lvl: "H", box: 45, clue: "Merge adjacent piles, cost = range sum → prefix sums + interval DP. (overflow)" },
        ],
      },
      {
        kind: "reveal",
        prompt: "End-of-day check 1. What does `tails[k]` mean? Why is `tails` sorted? Which `bisect` for strict and which for non-strict?",
        answer:
          "`tails[k]` = the smallest possible last value of an increasing subsequence of length k+1. It is sorted because a subsequence of length k+2 contains one of length k+1 that ends on a smaller value, so `tails[k] < tails[k+1]`. Strict → `bisect_left`; non-decreasing → `bisect_right`.",
      },
      {
        kind: "reveal",
        prompt: "End-of-day check 2. Why must interval DP loop over length before l?",
        answer:
          "`dp[l][r]` reads `dp[l][k]` and `dp[k][r]`, which are strictly shorter ranges. Looping over length first guarantees every shorter range is final before any longer range reads it. Looping over l first (upward) would read `dp[k][r]` with k > l before it was computed.",
      },
      {
        kind: "reveal",
        prompt: "End-of-day check 3. In Burst Balloons, why does \"the last balloon burst\" split the problem, while \"the first balloon burst\" does not?",
        answer:
          "If k bursts last in (l, r), then while the left and right sides are being burst, k is still there as a wall. Its neighbours at the end are exactly l and r, so the gain `a[l]·a[k]·a[r]` is known and the two sides never touch. If k bursts first, its left and right neighbours become adjacent, so the two sides depend on each other.",
      },
      {
        kind: "summary",
        points: [
          "Nest in 2-D → sort (w asc, h desc), LIS on h. Fewest removals to sort → n − LIS.",
          "Cut a log → interval DP over sorted marks. Merge adjacent piles → interval DP + prefix sums.",
          "Two players from both ends → interval DP on the score difference.",
          SUMMARY_END,
        ],
      },
    ],
  },
];

export default lessons;
