/** Day 14 templates exactly as in the book, plus the classic "done" variant and a graph BFS in the Day 12 style. */
export const DIJKSTRA_CODE = [
  "import heapq",
  "",
  "# Dijkstra with lazy deletion. adj[u] = [(v, w), ...], all w >= 0.",
  "def dijkstra(n, adj, src):",
  "    INF = float('inf')",
  "    dist = [INF] * n",
  "    dist[src] = 0",
  "    pq = [(0, src)]",
  "    while pq:",
  "        d, u = heapq.heappop(pq)",
  "        if d > dist[u]:",
  "            continue                      # stale entry: skip (lazy deletion)",
  "        for v, w in adj[u]:",
  "            nd = d + w",
  "            if nd < dist[v]:",
  "                dist[v] = nd",
  "                heapq.heappush(pq, (nd, v))",
  "    return dist",
];
/** Line indexes for the lazy template. */
export const DL = { init: 7, src: 6, pop: 9, stale: 11, staleIf: 10, loop: 12, nd: 13, cmp: 14, set: 15, push: 16, ret: 17 };

export const DONE_CODE = [
  "import heapq",
  "",
  "# Classic Dijkstra: a popped node is final (done).",
  "def dijkstra(n, adj, src):",
  "    INF = float('inf')",
  "    dist = [INF] * n",
  "    dist[src] = 0",
  "    done = [False] * n",
  "    pq = [(0, src)]",
  "    while pq:",
  "        d, u = heapq.heappop(pq)",
  "        if done[u]:",
  "            continue                      # popped before: already final",
  "        done[u] = True",
  "        for v, w in adj[u]:",
  "            nd = d + w",
  "            if nd < dist[v]:",
  "                dist[v] = nd",
  "                heapq.heappush(pq, (nd, v))",
  "    return dist",
];
export const NL = { init: 8, src: 6, pop: 10, stale: 12, staleIf: 11, mark: 13, loop: 14, nd: 15, cmp: 16, set: 17, push: 18, ret: 19 };

export const BFS_CODE = [
  "from collections import deque",
  "",
  "# BFS on an adjacency list. Every edge costs 1.",
  "def bfs(n, adj, src):",
  "    dist = [-1] * n",
  "    dist[src] = 0",
  "    q = deque([src])",
  "    while q:",
  "        u = q.popleft()",
  "        for v in adj[u]:",
  "            if dist[v] == -1:",
  "                dist[v] = dist[u] + 1      # mark on PUSH",
  "                q.append(v)",
  "    return dist",
];
export const BL = { init: 6, src: 5, pop: 8, loop: 9, cmp: 10, set: 11, push: 12, ret: 13 };

export const KRUSKAL_CODE = [
  "# Kruskal's MST, using the DSU class from Day 13. edges = [(w, u, v), ...]",
  "def kruskal(n, edges):",
  "    dsu = DSU(n)",
  "    total = used = 0",
  "    for w, u, v in sorted(edges):",
  "        if dsu.union(u, v):",
  "            total += w",
  "            used += 1",
  "            if used == n - 1:",
  "                break",
  "    return total if used == n - 1 else -1     # -1 = graph not connected",
];
export const KL = { dsu: 2, zero: 3, loop: 4, union: 5, total: 6, used: 7, full: 8, brk: 9, ret: 10 };
