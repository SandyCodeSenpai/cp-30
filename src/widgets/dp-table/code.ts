/** Python templates shown beside the table. Line numbers in engine.ts are 0-based indexes into these arrays.
 *  house-robber, grid-paths, lcs, edit-distance, knapsack (1-D) and coin-change are the exact Week 3 templates. */

export const STAIRS = [
  "def climb_stairs(n):",
  "    dp = [0] * (n + 1)             # dp[i] = ways to reach step i",
  "    dp[0] = 1                      # one way to stand at the bottom",
  "    dp[1] = 1                      # one way to reach step 1",
  "    for i in range(2, n + 1):",
  "        dp[i] = dp[i - 1] + dp[i - 2]",
  "    return dp[n]",
];

export const ROB = [
  "def rob(nums):",
  "    n = len(nums)",
  "    dp = [0] * (n + 2)             # dp[n] = dp[n+1] = 0 are the base cases",
  "    for i in range(n - 1, -1, -1):",
  "        dp[i] = max(dp[i + 1], nums[i] + dp[i + 2])",
  "    return dp[0]",
];

export const GRID = [
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
];

export const LCS = [
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
];

export const EDIT = [
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
];

/** The 2-D table first (same recurrence, one row per item), then the Week 3 1-D template. */
export const KNAP_2D = [
  "def knap01_2d(items, W):                # items = [(weight, value)]",
  "    n = len(items)",
  "    dp = [[0] * (W + 1) for _ in range(n + 1)]   # dp[i][c]: first i items, capacity c",
  "    for i in range(1, n + 1):",
  "        w, v = items[i - 1]",
  "        for c in range(W + 1):",
  "            dp[i][c] = dp[i - 1][c]               # skip item i",
  "            if c >= w and dp[i - 1][c - w] + v > dp[i][c]:",
  "                dp[i][c] = dp[i - 1][c - w] + v   # take item i",
  "    return dp[n][W]",
];

export const KNAP_1D = [
  "def knap01(items, W):                    # items = [(weight, value)], each used at most once",
  "    dp = [0] * (W + 1)                   # dp[c] = best value with capacity c",
  "    for w, v in items:",
  "        for c in range(W, w - 1, -1):    # DESCENDING",
  "            if dp[c - w] + v > dp[c]:",
  "                dp[c] = dp[c - w] + v",
  "    return dp[W]",
];

export const KNAP_FWD = [
  "def knap01_wrong(items, W):              # the same code with the loop flipped",
  "    dp = [0] * (W + 1)",
  "    for w, v in items:",
  "        for c in range(w, W + 1):        # ASCENDING: wrong for 0/1",
  "            if dp[c - w] + v > dp[c]:",
  "                dp[c] = dp[c - w] + v",
  "    return dp[W]",
];

export const COINS = [
  "def min_coins(coins, amount):            # unbounded",
  "    INF = amount + 1",
  "    dp = [0] + [INF] * amount",
  "    for coin in coins:",
  "        for a in range(coin, amount + 1):  # ASCENDING",
  "            if dp[a - coin] + 1 < dp[a]:",
  "                dp[a] = dp[a - coin] + 1",
  "    return dp[amount] if dp[amount] < INF else -1",
];
