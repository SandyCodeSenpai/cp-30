/** Python templates for the toposort lab (Day 13). Line indexes in engine.ts point into these arrays. */

// The book's Kahn template, exactly.
export const KAHN = [
  "from collections import deque",
  "",
  "# Kahn's topological sort. edge (u, v) means u must come before v.",
  "def topo_sort(n, edges):",
  "    adj = [[] for _ in range(n)]",
  "    indeg = [0] * n",
  "    for u, v in edges:",
  "        adj[u].append(v)",
  "        indeg[v] += 1",
  "    q = deque(i for i in range(n) if indeg[i] == 0)",
  "    order = []",
  "    while q:",
  "        u = q.popleft()",
  "        order.append(u)",
  "        for v in adj[u]:",
  "            indeg[v] -= 1",
  "            if indeg[v] == 0:",
  "                q.append(v)",
  "    return order if len(order) == n else []     # [] = cycle exists",
];
export const K = { build: 4, count: 8, queue: 9, loop: 11, pop: 12, append: 13, dec: 15, push: 17, ret: 18 } as const;

// DFS post-order, reversed. Iterative (no recursion), in the style of the book's DFS templates.
export const DFS = [
  "def topo_dfs(n, adj):",
  "    state = [0] * n          # 0 new, 1 open, 2 done",
  "    it = [0] * n             # next neighbour to try",
  "    post = []",
  "    for s in range(n):",
  "        if state[s]:",
  "            continue",
  "        state[s] = 1",
  "        stack = [s]",
  "        while stack:",
  "            u = stack[-1]",
  "            if it[u] < len(adj[u]):",
  "                v = adj[u][it[u]]",
  "                it[u] += 1",
  "                if state[v] == 1:",
  "                    return []        # back edge: cycle",
  "                if state[v] == 0:",
  "                    state[v] = 1",
  "                    stack.append(v)",
  "            else:",
  "                stack.pop()",
  "                state[u] = 2",
  "                post.append(u)       # u is finished",
  "    return post[::-1]",
];
export const D = { init: 3, skip: 6, start: 8, startMark: 7, tryEdge: 12, back: 15, isNew: 16, push: 18, pop: 20, finish: 22, ret: 23 } as const;
