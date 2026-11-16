import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import type { WidgetId } from "./ids";
import type { WidgetProps } from "./types";

export interface WidgetMeta { id: WidgetId; title: string; summary: string; chapter: number; Component: LazyExoticComponent<ComponentType<WidgetProps>> }

export const WIDGETS: Record<WidgetId, WidgetMeta> = {
  "complexity": { id: "complexity", title: "Constraints to complexity", summary: "Slide n, pick an algorithm, and see the operation count and the run time in CPython and PyPy: pass or TLE.", chapter: 4, Component: lazy(() => import("./complexity")) },
  "triage": { id: "triage", title: "The 15-second triage", summary: "Answer four quick questions about a problem (n, what it asks, input shape, trigger phrase) and watch the candidate patterns narrow down.", chapter: 9, Component: lazy(() => import("./triage")) },
  "two-pointers": { id: "two-pointers", title: "Two pointers", summary: "Step two pointers through pair sums, palindromes, 3Sum and read/write compaction. See why each move is safe.", chapter: 4, Component: lazy(() => import("./two-pointers")) },
  "sliding-window": { id: "sliding-window", title: "Sliding window", summary: "Grow and shrink a window over an array or string: fixed size, longest valid, shortest valid.", chapter: 4, Component: lazy(() => import("./sliding-window")) },
  "prefix-sums": { id: "prefix-sums", title: "Prefix sums and difference arrays", summary: "Build a prefix array, answer range sums in O(1), count subarrays with a hash map, and apply range updates with a difference array.", chapter: 4, Component: lazy(() => import("./prefix-sums")) },
  "mono-stack": { id: "mono-stack", title: "Monotonic stack and deque", summary: "Push and pop through Daily Temperatures and sliding-window maximum, and watch every element enter and leave exactly once.", chapter: 4, Component: lazy(() => import("./mono-stack")) },
  "binary-search": { id: "binary-search", title: "Binary search and search on the answer", summary: "Run lo/hi/mid on a sorted array, then on a yes/no feasibility line to find the smallest answer that works.", chapter: 4, Component: lazy(() => import("./binary-search")) },
  "heap": { id: "heap", title: "Heaps and top-k", summary: "Push and pop on a min-heap as a tree and as a list, keep the top k, and balance two heaps for a running median.", chapter: 5, Component: lazy(() => import("./heap")) },
  "recursion-tree": { id: "recursion-tree", title: "Recursion trees, backtracking and memo", summary: "Grow the call tree for subsets, permutations and Fibonacci; prune branches; turn memo on and watch repeated calls disappear.", chapter: 5, Component: lazy(() => import("./recursion-tree")) },
  "tree-walk": { id: "tree-walk", title: "Tree traversals", summary: "Walk a binary tree with DFS that returns a value, BFS level by level, and an iterative stack, one node at a time.", chapter: 5, Component: lazy(() => import("./tree-walk")) },
  "grid-bfs": { id: "grid-bfs", title: "Grid BFS and DFS", summary: "Draw walls on a grid and flood it with BFS, DFS, multi-source BFS and 0-1 BFS. Watch the distances fill in.", chapter: 5, Component: lazy(() => import("./grid-bfs")) },
  "union-find": { id: "union-find", title: "Union-find", summary: "Union and find on a forest, with and without path compression and union by size. Count components as edges arrive.", chapter: 5, Component: lazy(() => import("./union-find")) },
  "toposort": { id: "toposort", title: "Topological sort", summary: "Run Kahn's algorithm on a dependency graph: indegrees, the queue, and cycle detection.", chapter: 5, Component: lazy(() => import("./toposort")) },
  "dijkstra": { id: "dijkstra", title: "Dijkstra's shortest paths", summary: "Pop the closest node, relax its edges, and see why a negative edge breaks it. Compare with BFS.", chapter: 5, Component: lazy(() => import("./dijkstra")) },
  "dp-table": { id: "dp-table", title: "DP table builder", summary: "Fill DP tables cell by cell: climbing stairs, grid paths, LCS, edit distance and 0/1 knapsack, with the arrows each cell depends on.", chapter: 6, Component: lazy(() => import("./dp-table")) },
  "lis": { id: "lis", title: "Longest increasing subsequence", summary: "Run the O(n log n) tails array with bisect, and compare it with the O(n^2) table.", chapter: 6, Component: lazy(() => import("./lis")) },
  "bits": { id: "bits", title: "Bit playground", summary: "Flip bits, mask, shift and XOR. Enumerate subsets of a bitmask and count each bit's contribution.", chapter: 7, Component: lazy(() => import("./bits")) },
  "number-theory": { id: "number-theory", title: "Primes, mod and fast power", summary: "Run the sieve and smallest-prime-factor table, factor numbers, and square-and-multiply a power mod 10^9+7.", chapter: 7, Component: lazy(() => import("./number-theory")) },
  "range-query": { id: "range-query", title: "Fenwick and segment trees", summary: "Update a value and query a range on a Fenwick tree and a segment tree, and see which nodes each operation touches.", chapter: 7, Component: lazy(() => import("./range-query")) },
  "string-match": { id: "string-match", title: "String matching", summary: "Build the prefix function (KMP), the Z array and a rolling hash, then find a pattern in a text.", chapter: 7, Component: lazy(() => import("./string-match")) },
};

export const WIDGET_LIST: WidgetMeta[] = Object.values(WIDGETS);
