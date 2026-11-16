# The 20 labs: what each one does, its modes and its props

Content agents embed labs with `{ kind: "widget", widget: "<id>", task: "...", props: { mode: "<mode>" } }`.
Widget agents must support exactly these modes and props, so lessons can rely on them. Every lab also works with no props (its first mode).

## Shared rules for every lab (Brilliant style)

**Step-by-step algorithm player:**
- Controls: Step back, Step, Play/Pause, Reset, and a speed control.
- Keyboard: Left and Right arrows step; Space plays and pauses.

**Show the code:**
- Show the Python template for the current mode beside the picture, with the line that is running right now highlighted.
- On narrow screens, put it below the picture.

**Narrate every step.** One short sentence, for example: "nums[r] = 5 is already in the window, so move L to index 3."

**Let the reader change the input.**
- An "Edit input" field (comma-separated numbers or a string), validated, with sensible limits (about 4–16 elements).
- Presets.
- A "Random" button.

**Predict before revealing**, where it fits. An optional "Predict" toggle pauses before key moments and asks a 2–3 option question, such as "Which pointer moves?", then continues.

**`onComplete()`** is called once, when the reader runs an algorithm to the end (or does the task in the mode).

**`compact` mode** (inside a lesson):
- About 640x560 or smaller, with no page chrome.
- Mode tabs at the top only when `props.mode` is not given.
- When `props.mode` is given, lock to that mode and hide the tabs.

**Full mode** (lab page): up to 1100px wide, with all modes in tabs.

## The labs

| id | modes (`props.mode`) | other props |
|---|---|---|
| `complexity` | `table` (n slider + O() picker → ops, CPython time at 10^7/s, PyPy time at 10^8/s, pass/TLE for a 1 s and 2 s limit) · `budget` (pick n from the constraint table, the reader picks the target complexity, check) | `n?: number` |
| `triage` | `scan` (the 4-step 15-second scan: n and values → budget; what it wants back; input shape; trigger phrase. Each choice narrows a list of candidate patterns) · `cards` (run the scan on deck cards from `src/content/deck.ts`) | `upToDay?: number` |
| `two-pointers` | `pair-sum` (sorted array, target; L/R inward) · `palindrome` · `three-sum` (fix i, two pointers on the rest, skip duplicates) · `same-direction` (remove duplicates in place: slow/fast) | `nums?: number[]`, `target?: number` |
| `sliding-window` | `fixed` (window of size k, running sum or max) · `longest` (longest substring without repeats, last-seen map) · `shortest` (shortest subarray with sum ≥ target, non-negative values) | `s?: string`, `nums?: number[]`, `k?: number` |
| `prefix-sums` | `range-sum` (build prefix, query [l, r] = P[r+1] − P[l]) · `subarray-count` (count subarrays with sum k using a map of prefix counts) · `difference` (range add updates on a difference array, then prefix to rebuild) · `grid` (2-D prefix sums, inclusion-exclusion) | `nums?: number[]` |
| `mono-stack` | `next-greater` (Daily Temperatures: decreasing stack of indexes) · `histogram` (largest rectangle) · `window-max` (deque of indexes, sliding window maximum) | `nums?: number[]`, `k?: number` |
| `binary-search` | `classic` (find target, lo/hi/mid, invariant shown) · `boundary` (first index where a condition is true: bisect_left style) · `on-answer` (a yes/no feasibility line over the answer range: Koko eating bananas / split array largest sum; check(mid) shown) | `nums?: number[]`, `target?: number` |
| `heap` | `basics` (push and pop on a min-heap: tree view and list view in sync, sift up/down) · `top-k` (keep a size-k min-heap over a stream) · `median` (two heaps, balance after each insert) · `merge-k` (merge k sorted lists) | `nums?: number[]`, `k?: number` |
| `recursion-tree` | `subsets` (include/exclude tree, backtrack) · `permutations` (used[] array) · `pruning` (combination sum with a cut when the sum is over target) · `memo` (Fibonacci / climbing stairs call tree; toggle memo and watch repeated calls collapse; count calls) · `n-queens` (4 or 5 queens, place/undo) | `n?: number` |
| `tree-walk` | `dfs-return` (DFS that returns a value up: height, sum; show the call stack) · `bfs-levels` (queue, level by level) · `iterative` (explicit stack, preorder and inorder) · `bst` (search/insert using the BST property, validate with bounds) | `tree?: (number\|null)[]` level order |
| `grid-bfs` | `bfs` (shortest path in a grid, distances fill in) · `dfs` (flood fill / count islands) · `multi-source` (rotting oranges: many starts at distance 0) · `zero-one` (0-1 BFS with a deque: cost 0 edges to the front) | `rows?: number`, `cols?: number`, the reader can paint walls |
| `union-find` | `basic` (parent array + forest picture; union and find) · `optimized` (path compression + union by size, compare tree heights) · `components` (edges arrive one by one; count components; detect a cycle in an undirected graph) | `n?: number` |
| `toposort` | `kahn` (indegrees, queue, output order; course schedule) · `cycle` (the same graph with a cycle: the queue empties early, so report it) · `dfs` (DFS post-order, reversed) | — |
| `dijkstra` | `dijkstra` (heap of (dist, node), pop, relax, skip stale entries) · `negative` (one negative edge: show the wrong answer) · `bfs-vs` (unweighted graph: BFS gives the same answer) · `mst` (Kruskal with union-find, light) | — |
| `dp-table` | `stairs` (1-D: dp[i] = dp[i-1] + dp[i-2]) · `house-robber` · `grid-paths` (unique paths with obstacles) · `lcs` · `edit-distance` · `knapsack` (0/1, 2-D table, then the 1-D backwards loop) · `coin-change` (unbounded). Each cell shows the arrows it depends on, the recurrence with numbers plugged in, and the answer cell | `a?: string`, `b?: string` |
| `lis` | `tails` (patience: for each x, bisect_left in tails, replace or append) · `quadratic` (O(n^2) dp table for comparison) | `nums?: number[]` |
| `bits` | `basics` (an 8- to 16-bit number: toggle bits, AND/OR/XOR/shift with a second number, two's complement for negatives, x & (x-1), x & -x) · `subsets` (enumerate submasks of a mask; bitmask = set) · `xor-tricks` (single number, prefix XOR) · `per-bit` (count set bits per position across an array; contribution to the sum of pairwise XORs) | `x?: number` |
| `number-theory` | `sieve` (Sieve of Eratosthenes on 2..N, then the smallest-prime-factor table and factorizing with it) · `fast-pow` (square-and-multiply on the binary of the exponent, mod 10^9+7) · `mod-inverse` (Fermat: a^(p-2) mod p; nCr with factorial tables) · `gcd` (Euclid steps) | `n?: number` |
| `range-query` | `fenwick` (point add, prefix sum; show i += i & -i and i -= i & -i paths) · `segment-tree` (build, point update, range query; highlight visited nodes) · `compress` (coordinate compression: sorted unique values → ranks) | `nums?: number[]` |
| `string-match` | `kmp` (build the prefix function pi, then match; show fallback jumps) · `z` (Z array with the [l, r] box) · `rolling-hash` (polynomial hash, slide the window, compare hashes, then confirm) | `text?: string`, `pattern?: string` |
