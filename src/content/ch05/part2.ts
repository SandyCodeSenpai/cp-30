import type { Lesson, Visual, GraphVisual } from "../types";

// Chapter 5, part 2: Days 12-14 (graphs, topological sort + union-find, Dijkstra + MST + Contest #2).
// Lessons ch05-l9 ... ch05-l14, two per day (A = teach, B = drill).

const py = (...lines: string[]) => lines.join("\n");

/* ---------------- Day 12 visuals ---------------- */

// BFS flip book on a 3x4 grid: S at (0,0), T at (2,3), walls at (1,1) and (1,2).
const bfsGrid = (cells: (string | number)[][], tones: Record<string, "good" | "accent" | "warn" | "neutral" | "bad">, caption: string): Visual => ({
  kind: "grid", cells, tones, caption,
});

// 0-1 BFS example grid: 1 = obstacle (entering costs 1), 0 = free.
const costTones = { "0,1": "warn", "0,2": "warn", "1,0": "warn", "1,1": "warn" } as const;

/* ---------------- Day 13 visuals ---------------- */

// Kahn example: edges 0->2, 1->2, 1->3, 2->4, 3->4.
const kahnPos = { "0": [10, 25], "1": [10, 75], "2": [45, 25], "3": [45, 75], "4": [85, 50] } as const;
const kahnGraph = (
  notes: Record<string, string>,
  tones: Record<string, "good" | "accent" | "neutral">,
  doneEdges: string[],
  caption: string,
): GraphVisual => ({
  kind: "graph",
  nodes: (Object.keys(kahnPos) as (keyof typeof kahnPos)[]).map((id) => ({
    id, x: kahnPos[id][0], y: kahnPos[id][1], note: notes[id], tone: tones[id] ?? "neutral",
  })),
  edges: [["0", "2"], ["1", "2"], ["1", "3"], ["2", "4"], ["3", "4"]].map(([from, to]) => ({
    from, to, directed: true, dashed: doneEdges.includes(`${from}>${to}`) || undefined,
  })),
  caption,
});

/* ---------------- Day 14 visuals ---------------- */

// Dijkstra example from the book: 0->1 (4), 0->2 (1), 2->1 (2).
const dijGraph = (
  notes: [string, string, string],
  tones: ["good" | "accent" | "neutral", "good" | "accent" | "neutral", "good" | "accent" | "neutral"],
  caption: string,
  hot?: string,
): GraphVisual => ({
  kind: "graph",
  nodes: [
    { id: "0", x: 10, y: 70, note: notes[0], tone: tones[0] },
    { id: "2", x: 50, y: 20, note: notes[2], tone: tones[2] },
    { id: "1", x: 90, y: 70, note: notes[1], tone: tones[1] },
  ],
  edges: [
    { from: "0", to: "1", w: 4, directed: true, tone: hot === "0>1" || hot === "0" ? "accent" : undefined },
    { from: "0", to: "2", w: 1, directed: true, tone: hot === "0>2" || hot === "0" ? "accent" : undefined },
    { from: "2", to: "1", w: 2, directed: true, tone: hot === "2>1" ? "accent" : undefined },
  ],
  caption,
});

// Kruskal example: edges (w, u, v) = (1,0,1) (2,1,2) (3,0,2) (4,2,3) (5,1,3).
const kruskalGraph = (taken: string[], skipped: string[], caption: string): GraphVisual => ({
  kind: "graph",
  nodes: [
    { id: "0", x: 15, y: 20 },
    { id: "1", x: 85, y: 20 },
    { id: "2", x: 15, y: 80 },
    { id: "3", x: 85, y: 80 },
  ],
  edges: [
    ["0", "1", 1], ["1", "2", 2], ["0", "2", 3], ["2", "3", 4], ["1", "3", 5],
  ].map(([from, to, w]) => {
    const k = `${from}-${to}`;
    return {
      from: String(from), to: String(to), w: w as number,
      tone: taken.includes(k) ? ("good" as const) : skipped.includes(k) ? ("bad" as const) : undefined,
      dashed: skipped.includes(k) || undefined,
    };
  }),
  caption,
});

/* ---------------- Templates (exactly as the book writes them) ---------------- */

const GRID_BFS = py(
  "from collections import deque",
  "",
  "DIRS = ((1, 0), (-1, 0), (0, 1), (0, -1))",
  "",
  "# Grid BFS. One source = single-source BFS. Many sources = multi-source BFS.",
  "def grid_bfs(grid, sources, wall='#'):",
  "    R, C = len(grid), len(grid[0])",
  "    dist = [[-1] * C for _ in range(R)]",
  "    q = deque()",
  "    for r, c in sources:",
  "        dist[r][c] = 0",
  "        q.append((r, c))",
  "    while q:",
  "        r, c = q.popleft()",
  "        for dr, dc in DIRS:",
  "            nr, nc = r + dr, c + dc",
  "            if 0 <= nr < R and 0 <= nc < C and dist[nr][nc] == -1 and grid[nr][nc] != wall:",
  "                dist[nr][nc] = dist[r][c] + 1      # mark on PUSH",
  "                q.append((nr, nc))",
  "    return dist                                     # -1 = unreachable",
);

const COUNT_COMPONENTS = py(
  "# Connected components on an adjacency list, iterative DFS",
  "def count_components(n, adj):",
  "    seen = [False] * n",
  "    comps = 0",
  "    for s in range(n):",
  "        if seen[s]:",
  "            continue",
  "        comps += 1",
  "        seen[s] = True",
  "        stack = [s]",
  "        while stack:",
  "            u = stack.pop()",
  "            for v in adj[u]:",
  "                if not seen[v]:",
  "                    seen[v] = True",
  "                    stack.append(v)",
  "    return comps",
);

const ZERO_ONE = py(
  "from collections import deque",
  "",
  "# 0-1 BFS on a grid. cost(r, c, nr, nc) returns 0 or 1.",
  "def zero_one_bfs(R, C, start, cost):",
  "    INF = float('inf')",
  "    dist = [[INF] * C for _ in range(R)]",
  "    sr, sc = start",
  "    dist[sr][sc] = 0",
  "    dq = deque([(sr, sc)])",
  "    while dq:",
  "        r, c = dq.popleft()",
  "        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):",
  "            nr, nc = r + dr, c + dc",
  "            if 0 <= nr < R and 0 <= nc < C:",
  "                w = cost(r, c, nr, nc)",
  "                nd = dist[r][c] + w",
  "                if nd < dist[nr][nc]:",
  "                    dist[nr][nc] = nd",
  "                    if w == 0:",
  "                        dq.appendleft((nr, nc))   # same distance: front",
  "                    else:",
  "                        dq.append((nr, nc))       # one more: back",
  "    return dist",
);

const TOPO = py(
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
);

const DSU = py(
  "# DSU: iterative find with path compression + union by size",
  "class DSU:",
  "    def __init__(self, n):",
  "        self.parent = list(range(n))",
  "        self.size = [1] * n",
  "        self.groups = n",
  "",
  "    def find(self, x):",
  "        root = x",
  "        while self.parent[root] != root:",
  "            root = self.parent[root]",
  "        while self.parent[x] != root:           # path compression",
  "            nxt = self.parent[x]",
  "            self.parent[x] = root",
  "            x = nxt",
  "        return root",
  "",
  "    def union(self, a, b):",
  "        a, b = self.find(a), self.find(b)",
  "        if a == b:",
  "            return False                          # already connected",
  "        if self.size[a] < self.size[b]:",
  "            a, b = b, a                           # a = bigger tree",
  "        self.parent[b] = a",
  "        self.size[a] += self.size[b]",
  "        self.groups -= 1",
  "        return True",
);

const DIJKSTRA = py(
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
);

const KRUSKAL = py(
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
);

const PRACTICE_RULES =
  "Work in order and respect each time box. When a box runs out: write the brute force, take one hint, then read the editorial, close it and write the solution yourself. No AI while solving. Stretch rows you do not reach go on the re-solve list. Never extend a box.";

/* ======================================================================= */

const lessons: Lesson[] = [
  /* ------------------------------ Day 12 A ------------------------------ */
  {
    id: "ch05-l9",
    day: 12,
    title: "Day 12: Graphs, grids and BFS",
    goal: "Model a grid as a graph and pick DFS, BFS, multi-source BFS or 0-1 BFS, then type each template.",
    minutes: 12,
    steps: [
      {
        kind: "read",
        title: "Mazes, maps and spreading fires",
        body:
          "Today's problems look like mazes, maps and fires that spread. Under the costume they are all a **graph**: a set of **nodes** joined by **edges**.\n\n" +
          "**Goal:** model a grid or graph in 1 minute and pick the right search: DFS for \"connected?\", BFS for \"fewest steps\", multi-source BFS for \"distance to nearest\", 0-1 BFS for \"some steps free\".\n\n" +
          "By the end you can type grid BFS, iterative DFS and 0-1 BFS from memory.",
        visual: {
          kind: "table",
          headers: ["The question asks", "The search"],
          rows: [
            ["Connected? How many regions?", "DFS or BFS (flood fill)"],
            ["Fewest steps, every move costs 1", "BFS"],
            ["Distance to the nearest X", "Multi-source BFS"],
            ["Some moves are free, some cost 1", "0-1 BFS"],
          ],
          caption: "Where today is going",
        },
      },
      {
        kind: "quiz",
        guess: true,
        prompt: "Take a guess. You are in a maze and want the fewest steps to the exit. Which way of exploring finds it for sure?",
        options: [
          "Walk one path as deep as it goes, then back up and try another",
          "Explore every cell 1 step away, then every cell 2 steps away, and so on",
          "Always step toward the exit and ignore the walls",
        ],
        answer: 1,
        explain:
          "Exploring in rings of equal distance is **BFS**, breadth-first search. When it first reaches the exit, no shorter route can exist, because every shorter distance was already explored. Going deep first (DFS) can find a long, winding path before the short one.",
      },
      {
        kind: "read",
        title: "A grid is a graph",
        body:
          "Each cell is a **node**. Each cell you can step to (up, down, left, right) is a **neighbour**, joined by an **edge**. A wall `#` is a cell you may not enter.\n\n" +
          "In code the four moves are `DIRS = ((1, 0), (-1, 0), (0, 1), (0, -1))`. The neighbour of `(r, c)` is `(r + dr, c + dc)`, if it is inside the grid and not a wall.\n\n" +
          "A grid with R rows and C columns has R·C nodes and at most 4·R·C edges.",
        visual: {
          kind: "grid",
          cells: [
            ["", "n", "", "#"],
            ["n", "x", "n", ""],
            ["", "n", "", ""],
          ],
          tones: { "1,1": "accent", "0,1": "good", "1,0": "good", "1,2": "good", "2,1": "good", "0,3": "neutral" },
          arrows: [
            { from: [1, 1], to: [0, 1] },
            { from: [1, 1], to: [2, 1] },
            { from: [1, 1], to: [1, 0] },
            { from: [1, 1], to: [1, 2] },
          ],
          caption: "Cell x has 4 neighbours n. # is a wall.",
        },
      },
      {
        kind: "read",
        title: "Flood fill: one search per region",
        body:
          "**[[Flood fill]]** starts at one cell and visits every cell connected to it. DFS or BFS both work. Each cell is visited once, so a fill over the whole grid costs O(R·C).\n\n" +
          "To **count islands**, scan every cell. When you find land that no fill has visited yet, add 1 to the count and flood-fill from it. Each fill swallows one whole island.\n\n" +
          "The grid below has 2 islands, so 2 fills start.",
        visual: {
          kind: "grid",
          cells: [
            ["1", "1", "0", "0"],
            ["1", "0", "0", "1"],
            ["0", "0", "1", "1"],
          ],
          tones: { "0,0": "accent", "0,1": "accent", "1,0": "accent", "1,3": "good", "2,2": "good", "2,3": "good" },
          caption: "1 = land, 0 = water. Fill 1 (blue) and fill 2 (green): count = 2",
        },
      },
      {
        kind: "read",
        title: "BFS, frame 1: the start",
        body:
          "**[[BFS]]** keeps a **queue**: first in, first out. Put the start S in the queue with distance 0.\n\n" +
          "The `dist` grid starts at -1 everywhere, meaning \"not seen yet\".\n\n" +
          "Then repeat: pop the oldest cell. Each open neighbour that is still unseen gets the popped cell's distance + 1 and joins the back of the queue.",
        visual: bfsGrid(
          [["0", "", "", ""], ["", "#", "#", ""], ["", "", "", "T"]],
          { "0,0": "accent", "2,3": "warn" },
          "queue: (0,0)",
        ),
      },
      {
        kind: "read",
        title: "BFS, frame 2: distance 1",
        body:
          "Pop (0,0). Its open neighbours (1,0) and (0,1) get 0 + 1 = 1 and join the queue.\n\n" +
          "The moment a cell gets a distance, it counts as seen. Nothing will push it again.",
        visual: bfsGrid(
          [["0", "1", "", ""], ["1", "#", "#", ""], ["", "", "", "T"]],
          { "0,0": "good", "0,1": "accent", "1,0": "accent", "2,3": "warn" },
          "queue: (1,0), (0,1)",
        ),
      },
      {
        kind: "read",
        title: "BFS, frame 3: distance 2",
        body:
          "Pop (1,0): its unseen neighbour (2,0) gets 2. Pop (0,1): (0,2) gets 2. The walls are skipped.\n\n" +
          "Notice the order. Every distance-1 cell leaves the queue before any distance-2 cell. The queue only ever holds two distances, d and d + 1.",
        visual: bfsGrid(
          [["0", "1", "2", ""], ["1", "#", "#", ""], ["2", "", "", "T"]],
          { "0,0": "good", "0,1": "good", "1,0": "good", "0,2": "accent", "2,0": "accent", "2,3": "warn" },
          "queue: (2,0), (0,2)",
        ),
      },
      {
        kind: "read",
        title: "BFS, last frame: T is reached",
        body:
          "Keep going ring by ring: 3, then 4, then T gets 5.\n\n" +
          "BFS visits cells **in order of distance**. So when it first reaches T, 5 is the fewest steps. This is why **BFS gives shortest paths when every move costs the same**.\n\n" +
          "Each cell enters the queue once and checks 4 neighbours, so the whole run is O(R·C).",
        visual: bfsGrid(
          [["0", "1", "2", "3"], ["1", "#", "#", "4"], ["2", "3", "4", "5"]],
          { "0,0": "good", "0,1": "good", "0,2": "good", "0,3": "good", "1,0": "good", "1,3": "good", "2,0": "good", "2,1": "good", "2,2": "good", "2,3": "accent" },
          "dist grid at the end. Fewest steps from S to T = 5",
        ),
      },
      {
        kind: "read",
        title: "Mark a cell when you push it",
        body:
          "Look at the bottom-right cell. Both distance-1 cells are its neighbours.\n\n" +
          "If you marked a cell only when you **pop** it, both would see it as unmarked and push it twice. In a big graph, a node gets pushed once per neighbour, and BFS goes **quadratic**.\n\n" +
          "So set `dist` at **push** time. The first cell to reach a node wins, and the node is never pushed again.",
        visual: {
          kind: "grid",
          cells: [["0", "1"], ["1", "?"]],
          tones: { "0,0": "good", "0,1": "good", "1,0": "good", "1,1": "warn" },
          arrows: [
            { from: [0, 1], to: [1, 1], tone: "bad" },
            { from: [1, 0], to: [1, 1], tone: "bad" },
          ],
          caption: "Two cells can reach ? at the same time. Mark on push, so only the first one adds it.",
        },
      },
      {
        kind: "number",
        teach: "Fill the grid ring by ring: S is 0, its open neighbours are 1, their unseen open neighbours are 2, and so on. T's number is the answer.",
        prompt: "Run BFS from S. Walls are #. How many steps is the shortest path from S to T?",
        visual: { kind: "grid", cells: [["S", "", "#"], ["#", "", ""], ["", "", "T"]], tones: { "0,0": "accent", "2,2": "warn" } },
        answer: 4,
        tolerance: 0.4,
        unit: "steps",
        explain:
          "S is 0. (0,1) is 1. (1,1) is 2. (1,2) and (2,1) are 3. T at (2,2) is 4. The wall at (1,0) blocks the left column, but the middle is open.",
      },
      {
        kind: "read",
        title: "Multi-source BFS: many starts at once",
        body:
          "Now two fires, F, spread one cell per minute. When does each cell burn? That is its distance to the **nearest** fire.\n\n" +
          "**[[Multi-source BFS]]:** put **every** source in the queue at distance 0 **before** the loop starts. Then run the normal BFS loop, unchanged.\n\n" +
          "Both fires start in the queue. Their neighbours get 1, then 2, as if the two fires were one big start.",
        visual: bfsGrid(
          [["0", "", "", ""], ["", "", "#", ""], ["", "", "", "0"]],
          { "0,0": "accent", "2,3": "accent" },
          "Two sources, both at distance 0. queue: (0,0), (2,3)",
        ),
      },
      {
        kind: "read",
        title: "Multi-source BFS: one pass",
        body:
          "Every cell now holds the distance to its **nearest** fire. The whole grid burns by minute 2, the largest number. If some open cell were still -1, no fire could reach it.\n\n" +
          "This took one pass: O(R·C). Running one BFS per source would cost O(sources · R·C), too slow when there are thousands of sources.",
        visual: bfsGrid(
          [["0", "1", "2", "2"], ["1", "2", "#", "1"], ["2", "2", "1", "0"]],
          { "0,0": "accent", "2,3": "accent", "0,2": "warn", "0,3": "warn", "1,1": "warn", "2,0": "warn", "2,1": "warn" },
          "Distance to the nearest fire. Answer to \"when is everything burnt?\" = max = 2",
        ),
        callout: { type: "mistake", text: "In multi-source BFS, pushing sources one at a time and running BFS after each. All sources go in **before** the loop starts." },
      },
      {
        kind: "read",
        title: "When some moves are free",
        body:
          "In this grid, entering a cell marked 1 costs 1 (you remove an obstacle). Entering a 0 cell is free. Now you want the **cheapest** path, not the fewest steps.\n\n" +
          "Plain BFS assumes every move costs 1, so it fails here. **[[0-1 BFS]]** uses a **[[deque]]**, a queue you can push at both ends:\n" +
          "- a 0-cost move goes to the **front** (same distance)\n" +
          "- a 1-cost move goes to the **back** (distance + 1)",
        visual: {
          kind: "grid",
          cells: [["0", "1", "1"], ["1", "1", "0"]],
          tones: { ...costTones, "0,0": "accent" },
          caption: "Cost to enter each cell. Start top-left, goal bottom-right.",
        },
      },
      {
        kind: "read",
        title: "0-1 BFS: the free move goes first",
        body:
          "Start (0,0) at 0. Both neighbours cost 1, so they get 1 and go to the back. They give (1,1) and (0,2) distance 2.\n\n" +
          "Pop (1,1) at 2. Entering (1,2) is free: 2 + 0 = 2. It goes to the **front**, so it comes out next.\n\n" +
          "The deque stays sorted by distance, like a heap-free Dijkstra (Day 14). O(V + E). Update with `if new < dist[v]`, because a node can improve after it was first seen.",
        visual: {
          kind: "grid",
          cells: [["0", "1", "2"], ["1", "2", "2"]],
          tones: { "0,0": "good", "0,1": "good", "1,0": "good", "1,1": "good", "0,2": "neutral", "1,2": "accent" },
          arrows: [{ from: [1, 1], to: [1, 2], tone: "accent" }],
          caption: "Distances. deque after the free move: (1,2) at the front, then (0,2). Goal cost = 2",
        },
      },
      {
        kind: "quiz",
        teach: "Plain BFS is correct only when every move costs the same. When a move costs either 0 or 1, the structure must keep cheaper cells ahead of more expensive ones.",
        prompt: "Entering an empty cell costs 0 and entering an obstacle costs 1. You want the fewest obstacles removed to reach the corner. Which tool?",
        options: [
          "A plain queue: BFS with append and popleft only",
          "A deque: 0-cost moves to the front, 1-cost moves to the back",
          "Multi-source BFS from every obstacle",
          "Recursive DFS",
        ],
        answer: 1,
        explain:
          "Costs are 0 or 1, so this is **0-1 BFS**. A 0-cost move keeps the same distance and goes to the front; a 1-cost move goes to the back. This is LC 2290 in today's list.",
      },
      {
        kind: "read",
        title: "The 15-second clues",
        body:
          "- Grid + \"count islands / regions / areas\" → flood fill, DFS or BFS.\n" +
          "- \"Fewest moves / steps\", every move costs the same → BFS.\n" +
          "- \"Distance to the **nearest** X\", or \"everything spreads at once\" → multi-source BFS.\n" +
          "- Moves cost 0 or 1 (\"remove an obstacle\") → 0-1 BFS.\n" +
          "- \"Which cells can reach the border / both oceans\" → reverse it: BFS from the border inward.\n" +
          "- Graph given as an edge list → build the adjacency list first.",
        callout: { type: "clue", text: "\"Nearest\", \"spreads every minute\", \"all at once\" → multi-source. \"0 or 1 cost\" → deque, not heap." },
      },
      {
        kind: "widget",
        widget: "grid-bfs",
        title: "Grid BFS lab",
        task: "Press Play and watch the distances fill ring by ring. Then paint a wall across the middle with one gap and run it again. Which cells now have bigger distances?",
        props: { mode: "bfs" },
      },
      {
        kind: "read",
        title: "The template: grid BFS",
        body:
          "- `dist` starts at -1: unseen.\n" +
          "- Every source gets 0 and goes in the queue. One source = normal BFS; many = multi-source.\n" +
          "- Pop with `popleft()`. For each direction check: inside the grid, unseen, not a wall.\n" +
          "- Set `dist` and push in the same moment: mark on push.\n\n" +
          "Mental test: grid `[\"..\", \"..\"]`, source (0,0). Pop it: (1,0) and (0,1) get 1. Pop those: (1,1) gets 2, once.",
        visual: { kind: "code", lang: "python", code: GRID_BFS },
        callout: { type: "trap", text: "`list.pop(0)` is O(n). A BFS using a list as the queue is O(n²) and TLEs on 10^5 nodes. Always use `collections.deque` and `popleft()`." },
      },
      {
        kind: "code",
        title: "Now type it yourself",
        prompt:
          "From memory, write `grid_bfs(grid, sources, wall='#')`. `grid` is a list of strings and `sources` a list of `(r, c)`. Return the `dist` grid, with -1 for cells nothing can reach.",
        starter: py(
          "# from collections import deque",
          "# DIRS = the 4 moves",
          "# grid_bfs(grid, sources, wall='#') -> dist, -1 = unreachable",
          "# all sources at 0 first, mark on PUSH",
          "",
        ),
        solution: GRID_BFS,
        tests: [
          { call: "grid_bfs(['..', '..'], [(0, 0)])", expect: "[[0, 1], [1, 2]]", label: "tiny open grid" },
          { call: "grid_bfs(['....', '.##.', '....'], [(0, 0)])", expect: "[[0, 1, 2, 3], [1, -1, -1, 4], [2, 3, 4, 5]]", label: "the flip-book grid" },
          { call: "grid_bfs(['....', '..#.', '....'], [(0, 0), (2, 3)])", expect: "[[0, 1, 2, 2], [1, 2, -1, 1], [2, 2, 1, 0]]", label: "two sources" },
          { call: "grid_bfs(['.#.'], [(0, 0)])", expect: "[[0, -1, -1]]", label: "cut off by a wall" },
          { call: "grid_bfs(['.'], [(0, 0)])", expect: "[[0]]", label: "one cell" },
        ],
        teach: "Sources go in the queue at 0. Then pop, check the 4 neighbours, and for each valid unseen one set dist and push it together.",
        explain: "Walls stay -1 too, because they are never entered. For multi-source problems the same function works: pass every source.",
        fromMemory: true,
      },
      {
        kind: "read",
        title: "Iterative DFS: count components",
        body:
          "For a general graph, first build the **[[adjacency list]]**: `adj[u]` lists the neighbours of `u`. If you get an edge list, fill `adj` from it first.\n\n" +
          "To count components, loop over every node. An unseen node starts a new component: count it, then empty a **stack** of everything it reaches.\n\n" +
          "Why a stack, not recursion? Python's default [[recursion limit]] is about 1000. A recursive flood fill on a 1000×1000 grid crashes (Day 10). An explicit stack ([[iterative DFS]]) has no limit.",
        visual: { kind: "code", lang: "python", code: COUNT_COMPONENTS },
      },
      {
        kind: "code",
        title: "Count components with a stack",
        prompt: "Write `count_components(n, adj)` with an explicit stack, no recursion. `adj[u]` is the list of neighbours of node `u`.",
        starter: py("def count_components(n, adj):", "    pass", ""),
        solution: COUNT_COMPONENTS,
        tests: [
          { call: "count_components(5, [[1], [0, 2], [1], [4], [3]])", expect: "2" },
          { call: "count_components(3, [[], [], []])", expect: "3", label: "no edges" },
          { call: "count_components(1, [[]])", expect: "1", label: "one node" },
          { call: "count_components(4, [[1, 2, 3], [0], [0], [0]])", expect: "1", label: "a star" },
          { call: "count_components(6, [[1], [0], [3], [2], [5], [4]])", expect: "3" },
        ],
        teach: "Each unseen start node is a new component. Mark nodes when you push them on the stack, like BFS marks on push.",
        explain: "Swap the stack for a deque and `popleft()` and it becomes BFS. For counting, either order works.",
      },
      {
        kind: "read",
        title: "The template: 0-1 BFS",
        body:
          "Same shape as BFS, with three changes:\n" +
          "- `dist` starts at infinity, not -1.\n" +
          "- `cost(r, c, nr, nc)` returns 0 or 1 for one move.\n" +
          "- Update when `nd < dist[nr][nc]`, then push to the front for 0 and to the back for 1.\n\n" +
          "For LC 2290: `cost = lambda r, c, nr, nc: grid[nr][nc]`, because entering an obstacle costs 1. The answer is `dist[R-1][C-1]`.\n\n" +
          "Mental test: the 2×3 grid from before gives `[[0, 1, 2], [1, 2, 2]]`.",
        visual: { kind: "code", lang: "python", code: ZERO_ONE },
      },
      {
        kind: "code",
        title: "Write 0-1 BFS",
        prompt:
          "Write `zero_one_bfs(R, C, start, cost)`. `cost(r, c, nr, nc)` returns 0 or 1. Return the grid of cheapest costs from `start`. The tests pass LC 2290 style grids as the cost.",
        starter: py("from collections import deque", "", "def zero_one_bfs(R, C, start, cost):", "    pass", ""),
        solution: ZERO_ONE,
        tests: [
          { call: "zero_one_bfs(2, 3, (0, 0), lambda r, c, nr, nc: [[0, 1, 1], [1, 1, 0]][nr][nc])", expect: "[[0, 1, 2], [1, 2, 2]]", label: "the example grid" },
          { call: "zero_one_bfs(3, 3, (0, 0), lambda r, c, nr, nc: [[0, 1, 1], [1, 1, 0], [1, 1, 0]][nr][nc])[2][2]", expect: "2", label: "LC 2290 example 1" },
          { call: "zero_one_bfs(3, 5, (0, 0), lambda r, c, nr, nc: [[0, 1, 0, 0, 0], [0, 1, 0, 1, 0], [0, 0, 0, 1, 0]][nr][nc])[2][4]", expect: "0", label: "LC 2290 example 2" },
          { call: "zero_one_bfs(2, 2, (0, 0), lambda r, c, nr, nc: 0)", expect: "[[0, 0], [0, 0]]", label: "all free" },
          { call: "zero_one_bfs(1, 1, (0, 0), lambda r, c, nr, nc: 1)", expect: "[[0]]", label: "one cell" },
        ],
        teach: "0-cost neighbours go to the front with `appendleft`, 1-cost ones to the back with `append`. Only update and push when the new cost is smaller.",
        explain: "Because a node can be improved after it was first seen, 0-1 BFS checks `nd < dist` instead of a seen flag.",
      },
      {
        kind: "summary",
        title: "Day 12 in five lines",
        points: [
          "A grid is a graph: cells are nodes, the 4 moves are edges. Flood fill visits a region in O(R·C).",
          "BFS finds fewest steps when every move costs 1. Use a deque and mark on push.",
          "Multi-source BFS: all sources at distance 0 before the loop. One pass gives the distance to the nearest source.",
          "0-1 BFS: 0-cost moves to the front, 1-cost moves to the back of a deque.",
          "Deep graphs: iterative DFS with an explicit stack, never recursion.",
        ],
      },
    ],
  },

  /* ------------------------------ Day 12 B ------------------------------ */
  {
    id: "ch05-l10",
    day: 12,
    title: "Day 12 drill: name the search",
    goal: "Name the right graph search for a disguised problem in 15 seconds, then work today's problem list.",
    minutes: 10,
    steps: [
      {
        kind: "read",
        title: "Today's idea in four lines",
        body:
          "Four searches, four signals. This lesson: one lab run, 5 disguised problems to name in 15 seconds each, then today's problem list and the end-of-day check.",
        visual: {
          kind: "table",
          headers: ["Signal", "Search"],
          rows: [
            ["Connected? Count regions", "Flood fill (DFS or BFS)"],
            ["Fewest steps, equal costs", "BFS, mark on push"],
            ["Nearest X, spreads at once", "Multi-source BFS"],
            ["Moves cost 0 or 1", "0-1 BFS with a deque"],
          ],
        },
      },
      {
        kind: "widget",
        widget: "grid-bfs",
        title: "Rotting oranges",
        task: "Every rotten orange starts at distance 0. Press Play. At what minute does the last fresh orange rot? Then paint a wall that cuts one orange off and run it again: what should the answer be now?",
        props: { mode: "multi-source" },
      },
      {
        kind: "quiz",
        teach: "When a question asks for the distance to the nearest of many sources, think about how the search should start.",
        prompt: "A city grid has several fire stations. For every block, how far is the closest station?",
        options: ["One BFS from each station, then take the minimum", "Multi-source BFS from all stations", "0-1 BFS with a deque", "Flood fill, count components"],
        answer: 1,
        explain:
          "Signal: \"closest\" + many stations. Put every station in the queue at distance 0 and one BFS gives every block its nearest distance in O(R·C). One BFS per station repeats the same work many times.",
      },
      {
        kind: "quiz",
        teach: "Look at what each move costs. Equal costs, two different costs, or many different costs each point to a different search.",
        prompt: "A maze where walking is free but breaking a wall costs one hammer. Fewest hammers to exit?",
        options: ["Plain BFS", "0-1 BFS (wall = 1, open = 0)", "Multi-source BFS", "Backtracking over every path"],
        answer: 1,
        explain:
          "Signal: \"free\" next to \"costs one\". Edge weights are 0 and 1, so use a deque: open cells to the front, walls to the back.",
      },
      {
        kind: "read",
        title: "Notice the signal",
        body:
          "\"Nearest\" or \"closest\" for **every** cell means the sources start together: [[multi-source BFS]].\n\n" +
          "\"Free\" next to \"costs one\" means two edge weights, 0 and 1: a deque.\n\n" +
          "If every move costs the same, the plain queue is enough.",
      },
      {
        kind: "quiz",
        teach: "A grid of moves is still a graph. Ask whether every move costs the same.",
        prompt: "A knight on an 8×8 board. Fewest moves from one square to another?",
        options: ["BFS (all moves cost 1, 8 knight directions)", "0-1 BFS", "Greedy: always jump toward the target", "Multi-source BFS"],
        answer: 0,
        explain: "Signal: \"fewest moves\" and every jump costs 1. A knight is just a different DIRS list, 8 moves instead of 4. Plain BFS.",
      },
      {
        kind: "quiz",
        teach: "Some questions want a distance, others want a count of separate regions.",
        prompt: "A map of land and water. How many separate lakes?",
        options: ["BFS shortest path", "Flood fill, count components", "Multi-source BFS", "Heap top-k"],
        answer: 1,
        explain: "Signal: \"how many separate\". Scan the map; each unvisited water cell starts a flood fill and adds 1 to the count.",
      },
      {
        kind: "read",
        title: "Notice the signal",
        body:
          "A knight, a king or a jump of 2 just changes the DIRS list. The search stays BFS when every move costs 1.\n\n" +
          "\"How many separate ...\" asks for a **count of regions**, not a distance. Each flood fill swallows one region.",
      },
      {
        kind: "quiz",
        teach: "Many starting points that all spread at the same speed. Then ask what number the question wants: one cell's distance, or the time until every cell is reached.",
        prompt: "A virus starts in several cells and infects neighbours every hour. When is everyone infected?",
        options: [
          "Multi-source BFS; answer = the largest distance, -1 if some cell is never reached",
          "One BFS per infected cell, then take the smallest answer",
          "0-1 BFS",
          "Flood fill and count components",
        ],
        answer: 0,
        explain:
          "Signal: \"starts in several cells\" + \"every hour\". All infected cells go in at distance 0. Everyone is infected at the largest distance; if a cell stays -1, the answer is -1. This is Rotting Oranges.",
      },
      {
        kind: "practice",
        title: "Day 12 problems",
        intro:
          PRACTICE_RULES +
          " Extra if fast: LC 1368 Minimum Cost to Make at Least One Valid Path in a Grid (H, 0-1 BFS: follow the arrow = 0, change it = 1) and LC 417 Pacific Atlantic Water Flow (M, BFS inward from each ocean's border).",
        problems: [
          { ref: "LC 733 Flood Fill", tier: "warm", lvl: "E", box: 10, clue: "Component from one cell. Edge case: new color == old color" },
          { ref: "LC 200 Number of Islands", tier: "core", lvl: "M", box: 15, clue: "Count flood fills. Iterative, not recursive" },
          { ref: "LC 994 Rotting Oranges", tier: "core", lvl: "M", box: 20, clue: "Spreads every minute from all rotten → multi-source BFS" },
          { ref: "LC 542 01 Matrix", tier: "core", lvl: "M", box: 20, clue: "Distance to nearest 0 → all zeros are sources" },
          { ref: "LC 1091 Shortest Path in Binary Matrix", tier: "core", lvl: "M", box: 20, clue: "Fewest steps, 8 directions, start or end blocked → −1" },
          { ref: "LC 2290 Minimum Obstacle Removal to Reach Corner", tier: "stretch", lvl: "H", box: 25, clue: "Entering an obstacle costs 1, an empty cell costs 0 → 0-1 BFS" },
          { ref: "CSES — Labyrinth", tier: "core", lvl: "CSES", box: 25, clue: "BFS + store parent direction, rebuild the path backwards", url: "https://cses.fi/problemset/task/1193" },
          { ref: "Codeforces problemset, rating 1100–1400, tags graphs + shortest paths or dfs and similar, solve 1", tier: "stretch", lvl: "CF", box: 30, clue: "Read with fast input (Chapter 3). Adjacency list, iterative only" },
        ],
      },
      {
        kind: "reveal",
        prompt: "End-of-day check 1. Why must BFS mark a node when it is pushed and not when it is popped?",
        answer:
          "Between push and pop, other nodes can reach the same node. If it is only marked on pop, each of them pushes it again, so a node can sit in the queue once per neighbour. The queue blows up and BFS goes quadratic. Marking on push means the first discovery wins and each node enters the queue exactly once.",
      },
      {
        kind: "reveal",
        prompt: "End-of-day check 2. In 0-1 BFS, which end of the deque gets a 0-weight edge, and why does that keep it correct?",
        answer:
          "The **front**. A 0-weight move gives the neighbour the same distance as the node just popped, which is the smallest distance in the deque. Putting it at the front keeps the deque sorted by distance (all d at the front, d + 1 at the back), so nodes still come out in order of distance, like Dijkstra without a heap.",
      },
      {
        kind: "reveal",
        prompt: "End-of-day check 3. What is the complexity of multi-source BFS vs. one BFS per source?",
        answer:
          "Multi-source BFS is one pass: O(R·C) on a grid, O(V + E) on a graph. One BFS per source is O(sources · R·C), which TLEs when there are many sources.",
      },
      {
        kind: "summary",
        title: "Day 12 done",
        points: [
          "Nearest / spreads at once → multi-source BFS. 0 or 1 cost → 0-1 BFS. Equal costs → BFS. Count regions → flood fill.",
          "A different move set (knight, 8 directions) changes DIRS, not the algorithm.",
          "Log 1 mistake and add 3 cards. Record them in the Tracker, and review the cards in the Gym.",
        ],
      },
    ],
  },

  /* ------------------------------ Day 13 A ------------------------------ */
  {
    id: "ch05-l11",
    day: 13,
    title: "Day 13: Topological sort and union-find",
    goal: "Write Kahn's algorithm with cycle detection and a DSU with path compression and union by size, without recursion.",
    minutes: 12,
    steps: [
      {
        kind: "read",
        title: "Dependencies and groups",
        body:
          "Two new shapes today. **Dependencies**: \"take course 1 before course 3\". **Groups**: \"are these two people in the same friend circle?\"\n\n" +
          "**Goal:** see \"dependencies\" and write Kahn's algorithm with cycle detection. See \"connected / groups / edges arriving\" and write DSU with path compression and union by size, all without recursion.",
      },
      {
        kind: "quiz",
        guess: true,
        prompt: "Take a guess. Five courses, some with prerequisites. Which course can you take first?",
        options: ["One that has no prerequisites left to take", "The one with the most prerequisites", "Any course: the order does not matter"],
        answer: 0,
        explain:
          "Only a course with nothing blocking it can start. Take it, and some other courses lose a blocker. Repeat. That simple loop is Kahn's algorithm, coming next.",
      },
      {
        kind: "read",
        title: "Dependencies are arrows",
        body:
          "Draw each rule \"u must come before v\" as an arrow u → v. The result is a **directed graph**.\n\n" +
          "A node's **in-degree** is how many arrows point into it: how many things still block it. Below, nodes 0 and 1 have in-degree 0, so nothing blocks them.\n\n" +
          "A **[[topological order|topological sort]]** lists every node so that every arrow points forward: u always comes before v.",
        visual: kahnGraph({ "0": "in 0", "1": "in 0", "2": "in 2", "3": "in 1", "4": "in 2" }, {}, [], "Edges 0→2, 1→2, 1→3, 2→4, 3→4. Notes show in-degrees."),
      },
      {
        kind: "read",
        title: "Kahn's algorithm, frame 1",
        body:
          "**[[Kahn's algorithm]]** builds a topological order with a queue.\n\n" +
          "Start: push every node with in-degree 0. Here that is 0 and 1.\n\n" +
          "Then repeat: pop a node and add it to the order. For each arrow out of it, subtract 1 from the target's in-degree. When a target reaches 0, push it.",
        visual: kahnGraph({ "0": "in 0", "1": "in 0", "2": "in 2", "3": "in 1", "4": "in 2" }, { "0": "accent", "1": "accent" }, [], "queue: 0, 1 · order: (empty)"),
      },
      {
        kind: "read",
        title: "Kahn's algorithm, frame 2",
        body:
          "Pop 0: order is [0]. Arrow 0 → 2 drops node 2 to in-degree 1. Still blocked.\n\n" +
          "Pop 1: order is [0, 1]. Arrow 1 → 2 drops node 2 to 0, so push 2. Arrow 1 → 3 drops node 3 to 0, so push 3.\n\n" +
          "Arrows from finished nodes no longer count (dashed).",
        visual: kahnGraph({ "0": "done", "1": "done", "2": "in 0", "3": "in 0", "4": "in 2" }, { "0": "good", "1": "good", "2": "accent", "3": "accent" }, ["0>2", "1>2", "1>3"], "queue: 2, 3 · order: 0, 1"),
      },
      {
        kind: "read",
        title: "Kahn's algorithm, last frame",
        body:
          "Pop 2: node 4 drops to 1. Pop 3: node 4 drops to 0, so push it. Pop 4.\n\n" +
          "Order: [0, 1, 2, 3, 4]. All 5 nodes came out, so there is no cycle.\n\n" +
          "Every node and every arrow is handled once: O(V + E), with no recursion.",
        visual: kahnGraph({ "0": "1st", "1": "2nd", "2": "3rd", "3": "4th", "4": "5th" }, { "0": "good", "1": "good", "2": "good", "3": "good", "4": "good" }, ["0>2", "1>2", "1>3", "2>4", "3>4"], "order: 0, 1, 2, 3, 4"),
      },
      {
        kind: "read",
        title: "When the queue empties early",
        body:
          "Now arrows 0 → 1 → 2 → 0 form a **cycle**. Each of those nodes waits for another one, forever.\n\n" +
          "Kahn's pushes 3, pops it, and node 0 drops to in-degree 1. Then the queue is empty. The order is [3], only 1 of 4 nodes.\n\n" +
          "That is the cycle test: **if fewer than n nodes come out, there is a cycle**. The leftover nodes are on a cycle or wait behind one. Only a graph with no cycle, a **[[DAG]]**, has a topological order.",
        visual: {
          kind: "graph",
          nodes: [
            { id: "3", x: 10, y: 50, tone: "good", note: "done" },
            { id: "0", x: 42, y: 50, tone: "bad", note: "in 1" },
            { id: "1", x: 85, y: 18, tone: "bad", note: "in 1" },
            { id: "2", x: 85, y: 82, tone: "bad", note: "in 1" },
          ],
          edges: [
            { from: "3", to: "0", directed: true, dashed: true },
            { from: "0", to: "1", directed: true, tone: "bad" },
            { from: "1", to: "2", directed: true, tone: "bad" },
            { from: "2", to: "0", directed: true, tone: "bad" },
          ],
          caption: "order: 3 · queue: empty · 1 < 4 nodes, so a cycle exists",
        },
      },
      {
        kind: "quiz",
        teach: "Kahn's outputs a node only when its in-degree reaches 0. Think about which nodes can never reach 0.",
        prompt: "Kahn's algorithm runs on a directed graph with n = 6 nodes and returns an order with only 4 nodes. What does that tell you?",
        options: [
          "The graph has a cycle, so no valid order exists",
          "The graph has two separate parts",
          "The order is still valid, just shorter",
          "Two nodes had in-degree 0 at the start",
        ],
        answer: 0,
        explain:
          "Nodes on a cycle keep an arrow coming in from another stuck node, so their in-degree never reaches 0 and they never come out. Fewer than n nodes out means a cycle. Separate parts are fine: Kahn's starts every part whose nodes have in-degree 0.",
      },
      {
        kind: "read",
        title: "Clues for topological sort",
        body:
          "- \"Prerequisites\", \"must come before\", \"build order\", \"can all tasks finish\" → topological sort.\n" +
          "- \"Is there a cycle in a directed graph?\" → Kahn's: if fewer than n nodes come out, there's a cycle.",
        callout: { type: "clue", text: "Dependencies → Kahn's. Fewer than n nodes out → cycle." },
      },
      {
        kind: "widget",
        widget: "toposort",
        title: "Kahn's algorithm lab",
        task: "Press Step and watch each in-degree fall. Before each pop, predict which node leaves the queue next. At the end, check that every arrow in the order points forward.",
        props: { mode: "kahn" },
      },
      {
        kind: "read",
        title: "The template: Kahn's",
        body:
          "- Build: for each edge (u, v), `adj[u].append(v)` and `indeg[v] += 1`.\n" +
          "- Start: a deque of every node with in-degree 0.\n" +
          "- Loop: pop, append to `order`, lower each neighbour, push the ones that reach 0.\n" +
          "- Return `[]` when `len(order) < n`: a cycle.\n\n" +
          "Mental test: n = 3, edges (0, 1), (1, 2). The queue starts [0]. Pop 0, node 1 reaches 0. Pop 1, node 2 reaches 0. Order [0, 1, 2].",
        visual: { kind: "code", lang: "python", code: TOPO },
        callout: {
          type: "trap",
          text: "LC 207/210 give `[a, b]` meaning \"to take a you must first take b\". So the edge is **b → a**. Build `adj[b].append(a)` and `indeg[a] += 1`. Reading it backwards gives the reversed order, and LC 210 fails.",
        },
      },
      {
        kind: "code",
        title: "Now type it yourself",
        prompt: "From memory, write `topo_sort(n, edges)`. Edge `(u, v)` means u must come before v. Return the order, or `[]` if there is a cycle.",
        starter: py(
          "# from collections import deque",
          "# topo_sort(n, edges): adj + indeg, queue of in-degree 0",
          "# pop -> order, lower neighbours, push at 0",
          "# [] if len(order) < n",
          "",
        ),
        solution: TOPO,
        tests: [
          { call: "topo_sort(3, [(0, 1), (1, 2)])", expect: "[0, 1, 2]", label: "a chain" },
          { call: "topo_sort(5, [(0, 2), (1, 2), (1, 3), (2, 4), (3, 4)])", expect: "[0, 1, 2, 3, 4]", label: "the flip-book graph" },
          { call: "topo_sort(4, [(3, 0), (0, 1), (1, 2), (2, 0)])", expect: "[]", label: "cycle" },
          { call: "topo_sort(3, [(2, 1), (1, 0)])", expect: "[2, 1, 0]" },
          { call: "topo_sort(1, [])", expect: "[0]", label: "one node" },
        ],
        teach: "Count in-degrees, queue every node at 0, then pop, record, and lower the in-degree of each node it points to.",
        explain: "The queue is a deque, so pops are O(1). With the queue in index order, the output is the one shown in the tests.",
        fromMemory: true,
      },
      {
        kind: "read",
        title: "Union-find: groups as trees",
        body:
          "A new question: are a and b in the same group, while links keep arriving?\n\n" +
          "**[[Union-find|union-find / DSU]]**, also called **DSU** (disjoint set union), stores each group as a tree. The **root** is the group's name. `parent[x]` points one step up; a root points to itself.\n" +
          "- `find(x)` walks up to the root.\n" +
          "- `union(a, b)` finds both roots and attaches one under the other.\n\n" +
          "At the start, every node is its own group.",
        visual: {
          kind: "graph",
          nodes: ["0", "1", "2", "3", "4"].map((id, i) => ({ id, x: 10 + i * 20, y: 50, tone: "accent" as const, note: "root" })),
          edges: [],
          caption: "parent = [0, 1, 2, 3, 4] · groups = 5",
        },
      },
      {
        kind: "read",
        title: "union, frame 1",
        body:
          "`union(0, 1)`: roots 0 and 1 differ, so attach 1 under 0. `union(2, 3)`: attach 3 under 2.\n\n" +
          "Each union that joins two different groups lowers `groups` by 1: from 5 to 3.\n\n" +
          "Arrows point from child to parent.",
        visual: {
          kind: "graph",
          nodes: [
            { id: "0", x: 15, y: 25, tone: "accent", note: "root" },
            { id: "1", x: 15, y: 75 },
            { id: "2", x: 50, y: 25, tone: "accent", note: "root" },
            { id: "3", x: 50, y: 75 },
            { id: "4", x: 85, y: 25, tone: "accent", note: "root" },
          ],
          edges: [
            { from: "1", to: "0", directed: true, tone: "good" },
            { from: "3", to: "2", directed: true, tone: "good" },
          ],
          caption: "parent = [0, 0, 2, 2, 4] · groups = 3",
        },
      },
      {
        kind: "read",
        title: "union, frame 2",
        body:
          "`union(1, 3)`: `find(1)` walks 1 → 0, root 0. `find(3)` walks 3 → 2, root 2. Different roots, so attach root 2 under root 0. Now 0, 1, 2, 3 are one group: `groups` = 2.\n\n" +
          "Now call `union(3, 1)`. Both finds return 0. Same root means already connected: nothing changes and `union` returns **False**.",
        visual: {
          kind: "graph",
          nodes: [
            { id: "0", x: 35, y: 15, tone: "accent", note: "root" },
            { id: "1", x: 15, y: 55 },
            { id: "2", x: 55, y: 55 },
            { id: "3", x: 55, y: 90 },
            { id: "4", x: 85, y: 15, tone: "accent", note: "root" },
          ],
          edges: [
            { from: "1", to: "0", directed: true },
            { from: "2", to: "0", directed: true, tone: "good" },
            { from: "3", to: "2", directed: true },
          ],
          caption: "parent = [0, 0, 0, 2, 4] · groups = 2",
        },
      },
      {
        kind: "read",
        title: "Trick 1: path compression",
        body:
          "Trees can grow tall, and `find` walks the whole path every time.\n\n" +
          "**[[Path compression]]**: after `find(x)` reaches the root, point every node on the way **directly** at the root.\n\n" +
          "Here `find(3)` walks 3 → 2 → 0. Afterwards `parent[3] = 0`, so the next `find(3)` takes one step. It prevents the same long walk from being repeated.",
        visual: {
          kind: "graph",
          nodes: [
            { id: "0", x: 35, y: 15, tone: "accent", note: "root" },
            { id: "1", x: 15, y: 55 },
            { id: "2", x: 55, y: 55 },
            { id: "3", x: 55, y: 90, tone: "good" },
            { id: "4", x: 85, y: 15, tone: "accent", note: "root" },
          ],
          edges: [
            { from: "1", to: "0", directed: true },
            { from: "2", to: "0", directed: true },
            { from: "3", to: "2", directed: true, dashed: true },
            { from: "3", to: "0", directed: true, tone: "good" },
          ],
          caption: "After find(3): parent = [0, 0, 0, 0, 4]. The dashed arrow is gone.",
        },
      },
      {
        kind: "read",
        title: "Trick 2: union by size",
        body:
          "**[[Union by size]]**: keep a `size` for each root, and always attach the **smaller** tree under the **bigger** one. A node only gets one step deeper when its group at least doubles, so no path is longer than log n. It prevents tall, chain-shaped trees.\n\n" +
          "Together the two tricks make each operation nearly O(1) (inverse Ackermann, about 4 for any real n).",
        visual: {
          kind: "compare",
          left: { title: "Without union by size", points: ["union(1, 0), union(2, 1), union(3, 2), ...", "can build one long chain", "find walks up to n steps"] },
          right: { title: "With union by size", points: ["the small tree goes under the big one", "depth at most log n", "plus path compression: about 4 steps"] },
        },
      },
      {
        kind: "number",
        teach: "`groups` starts at n. Each union that joins two different roots lowers it by 1. A union inside one group changes nothing.",
        prompt: "`d = DSU(6)`. You call `union(0, 1)`, `union(1, 2)`, `union(3, 4)`, then `union(2, 0)`. What is `d.groups` now?",
        answer: 3,
        tolerance: 0.4,
        explain:
          "6 → 5 after (0, 1) → 4 after (1, 2) → 3 after (3, 4). Then `union(2, 0)`: 2 and 0 already share a root, so it returns False and groups stays 3. The groups are {0, 1, 2}, {3, 4} and {5}.",
      },
      {
        kind: "read",
        title: "DSU or BFS?",
        body:
          "Use DSU when you only **add** edges and ask \"same group?\" or \"how many groups?\". DSU can't remove edges.\n\n" +
          "Use BFS/DFS when you need actual **paths** or **distances**.\n\n" +
          "Clues for DSU:\n" +
          "- \"Are a and b connected?\", \"number of groups\", \"merge accounts\".\n" +
          "- \"Which edge, when added, makes a cycle?\" (undirected) → the first union that returns False.\n" +
          "- \"a == b and b != c, consistent?\" → union all equalities first, then check inequalities.",
        callout: { type: "clue", text: "Edges arrive one at a time and you're asked about connectivity after each → DSU, not repeated BFS." },
      },
      {
        kind: "widget",
        widget: "union-find",
        title: "Union-find lab",
        task: "Run the same unions with and without the two tricks. Compare the height of the tallest tree. Then call find on the deepest node and watch its path flatten.",
        props: { mode: "optimized" },
      },
      {
        kind: "read",
        title: "The template: DSU",
        body:
          "Three fields: `parent`, `size`, `groups`.\n" +
          "- `find`: the first loop walks up to the root. The second walks the path again and points each node at the root. No recursion.\n" +
          "- `union`: find both roots. Same root → return False. Else swap so `a` is the bigger tree, hang `b` under it, add the sizes, lower `groups`.\n\n" +
          "Check: `DSU(3)`, `union(0, 1)` → True, groups 2. `union(1, 0)` → False. `union(2, 1)` → True, groups 1, and `size[find(2)] == 3`.",
        visual: { kind: "code", lang: "python", code: DSU },
      },
      {
        kind: "code",
        title: "Now type it yourself",
        prompt:
          "From memory, write the `DSU` class: `__init__(n)`, an iterative `find(x)` with path compression, and `union(a, b)` with union by size that returns True or False and keeps `groups` up to date.",
        starter: py(
          "# class DSU: parent, size, groups",
          "# find: walk to root, then point the path at the root",
          "# union: roots equal -> False; bigger tree is the root; groups -= 1",
          "",
        ),
        solution: DSU,
        tests: [
          { call: "(lambda d: [d.union(0, 1), d.groups, d.union(1, 0), d.union(2, 1), d.groups, d.size[d.find(2)]])(DSU(3))", expect: "[True, 2, False, True, 1, 3]", label: "the book's check" },
          { call: "(lambda d: [d.union(0, 1), d.union(2, 3), d.union(1, 3), d.find(3) == d.find(0), d.groups])(DSU(5))", expect: "[True, True, True, True, 2]", label: "the flip-book unions" },
          { call: "(lambda d: [d.union(0, 1), d.union(2, 3), d.union(0, 2), d.find(3) == d.find(1), d.parent[3] == d.find(3)])(DSU(4))", expect: "[True, True, True, True, True]", label: "path compression" },
          { call: "(lambda d: [d.union(0, 1), d.union(0, 2), d.union(3, 0), d.parent[3] != 3, d.size[d.find(3)]])(DSU(4))", expect: "[True, True, True, True, 4]", label: "union by size: small tree goes under" },
          { call: "(lambda d: [d.find(0), d.union(0, 0), d.groups])(DSU(1))", expect: "[0, False, 1]", label: "one node" },
        ],
        teach: "find: walk up to the root, then walk again pointing each node at it. union: two roots; same means False; otherwise the smaller root goes under the bigger one.",
        explain: "Both loops in `find` are plain `while` loops, so even a chain of 10^5 nodes cannot hit the recursion limit.",
        fromMemory: true,
      },
      {
        kind: "read",
        title: "Keep find iterative",
        body:
          "A recursive `find` looks shorter: `self.parent[x] = self.find(self.parent[x])`. With union by size the depth stays O(log n), so it survives.\n\n" +
          "But some problems need a fixed root, so you drop union by size. Then a chain 10^5 long hits Python's recursion limit and crashes.\n\n" +
          "The two-loop version costs nothing extra. Write it every time.",
        callout: {
          type: "mistake",
          text: "Writing `find` recursively (`self.parent[x] = self.find(self.parent[x])`). The day you drop union by size, a 10^5-long chain crashes it. The iterative version costs nothing extra.",
        },
      },
      {
        kind: "summary",
        title: "Day 13 in five lines",
        points: [
          "Dependencies are arrows. In-degree = how many arrows point in.",
          "Kahn's: queue the in-degree-0 nodes, pop, lower neighbours, push at 0. Fewer than n out → cycle.",
          "DSU: each group is a tree, the root is its name. find walks up; union hangs one root under the other.",
          "Path compression flattens paths; union by size keeps trees shallow. Together nearly O(1).",
          "DSU for \"same group?\" while edges only arrive. BFS/DFS for paths and distances.",
        ],
      },
    ],
  },

  /* ------------------------------ Day 13 B ------------------------------ */
  {
    id: "ch05-l12",
    day: 13,
    title: "Day 13 drill: order or groups?",
    goal: "Tell topological sort and DSU problems apart in 15 seconds, then work today's problem list.",
    minutes: 10,
    steps: [
      {
        kind: "read",
        title: "Today's idea in four lines",
        body:
          "Two tools, [[topological sort]] and [[DSU]], one question to tell them apart: is it about **order** (what comes before what) or about **groups** (who is connected)? This lesson: two lab runs, 5 disguised problems, today's list and the end-of-day check.",
        visual: {
          kind: "compare",
          left: { title: "Topological sort (Kahn's)", points: ["prerequisites, build order", "queue of in-degree 0 nodes", "fewer than n out → cycle"] },
          right: { title: "DSU (union-find)", points: ["connected? how many groups?", "find + union, iterative", "path compression + union by size"] },
        },
      },
      {
        kind: "widget",
        widget: "toposort",
        title: "A graph with a cycle",
        task: "This graph has a cycle. Press Play and watch the queue empty before every node is out. Which nodes are left with in-degree above 0?",
        props: { mode: "cycle" },
      },
      {
        kind: "quiz",
        teach: "Ask whether the problem is about order (what must come before what) or about groups.",
        prompt: "Package A needs B and C installed first. Find an install order, or say it's impossible.",
        options: ["DSU, track groups", "Kahn's topological sort; a cycle means impossible", "Multi-source BFS", "Backtracking over every order"],
        answer: 1,
        explain: "Signal: \"needs ... first\" and \"or say it's impossible\". Dependencies → Kahn's. If fewer than n packages come out, there is a cycle and no order exists.",
      },
      {
        kind: "quiz",
        teach: "Edges only get added, and the question repeats after every new edge. Which structure answers \"how many groups\" cheaply after each addition?",
        prompt: "Social network: friendships are added one by one. After each, how many friend circles are there?",
        options: ["BFS after every new friendship", "Topological sort", "DSU, track `groups`", "Two heaps"],
        answer: 2,
        explain: "Signal: edges arrive one at a time + \"how many groups\" after each. DSU keeps `groups` up to date in nearly O(1) per union. A fresh BFS after each edge is far slower.",
      },
      {
        kind: "read",
        title: "Notice the signal",
        body:
          "\"Before\", \"first\", \"order\", \"impossible\" → directed arrows → Kahn's.\n\n" +
          "\"Groups\", \"circles\", \"connected\", and edges that only get **added** → DSU.",
      },
      {
        kind: "quiz",
        teach: "Equal means \"same group\". Think about which structure merges groups, and in what order to process the two kinds of rules.",
        prompt: "Given rules like \"x1 = x5\" and \"x2 ≠ x5\", can all rules hold at once?",
        options: ["DSU: union all equalities, then check the inequalities", "Topological sort", "BFS from x1", "Greedy: sort the rules"],
        answer: 0,
        explain: "Signal: \"a == b and b != c, consistent?\". Union every equality first. Then any `≠` rule whose two sides share a root is broken. This is LC 990.",
      },
      {
        kind: "quiz",
        teach: "In an undirected graph, an edge closes a cycle when its two ends were already connected. Which operation tells you that?",
        prompt: "A tree had one extra wire added between two houses. Which wire can you cut to make it a tree again?",
        options: ["Kahn's: the nodes left in a cycle", "DSU: the first union that returns False", "BFS shortest path", "Multi-source BFS from the leaves"],
        answer: 1,
        explain: "Signal: undirected + \"which edge makes a cycle\". Add the wires one by one with `union`. The first one that returns False joins two houses that were already connected. This is LC 684 Redundant Connection.",
      },
      {
        kind: "read",
        title: "Notice the signal",
        body:
          "Equalities and inequalities: equalities **merge** groups (union), inequalities **check** groups (find). Do all merges first.\n\n" +
          "\"Which edge makes a cycle?\" in an **undirected** graph → DSU. In a **directed** graph, a cycle check is Kahn's.",
      },
      {
        kind: "quiz",
        teach: "Each pair of neighbouring words tells you one letter comes before another. Is that order or groups?",
        prompt: "Given a sorted dictionary of an alien language, recover the letter order.",
        options: ["DSU on letters", "Topological sort on \"letter a before letter b\" rules", "Sort the letters by frequency", "Binary search"],
        answer: 1,
        explain:
          "Signal: recover an **order**. Compare adjacent words: at the first letter where they differ, the upper word's letter comes first. That is an edge. Then topological sort; a cycle means no valid order.",
      },
      {
        kind: "read",
        title: "Before the list: strings as nodes",
        body:
          "LC 721 Accounts Merge uses emails as nodes, not numbers. DSU arrays need integer ids.\n\n" +
          "So give each string an id the first time you see it: `id_of.setdefault(s, len(id_of))`. The first email gets 0, the next new one 1, and so on. Then use the array-based DSU as usual, and group the strings by `find(id)` at the end.",
        callout: {
          type: "move",
          text: "Strings or tuples as nodes (emails, coordinates)? Map each one to an integer id with a dict first (`id_of.setdefault(s, len(id_of))`). Then use the array-based DSU.",
        },
      },
      {
        kind: "widget",
        widget: "union-find",
        title: "Edges arriving one by one",
        task: "Add the edges one at a time. Watch the component count after each, and spot the first edge that closes a cycle. That is Redundant Connection and Road Construction in one picture.",
        props: { mode: "components" },
      },
      {
        kind: "practice",
        title: "Day 13 problems",
        intro:
          PRACTICE_RULES +
          " Extra if fast: CSES — Course Schedule (plain Kahn's, print IMPOSSIBLE on a cycle) and LC 802 Find Eventual Safe States (M, Kahn's on the reversed graph).",
        problems: [
          { ref: "LC 1971 Find if Path Exists in Graph", tier: "warm", lvl: "E", box: 10, clue: "Solve with DSU (then once with BFS, to compare)" },
          { ref: "LC 207 Course Schedule", tier: "core", lvl: "M", box: 15, clue: "\"Can all finish?\" = Kahn's and len(order) == n" },
          { ref: "LC 210 Course Schedule II", tier: "core", lvl: "M", box: 15, clue: "Same, return the order. Watch the edge direction" },
          { ref: "LC 684 Redundant Connection", tier: "core", lvl: "M", box: 15, clue: "First edge whose union returns False" },
          { ref: "LC 990 Satisfiability of Equality Equations", tier: "core", lvl: "M", box: 15, clue: "Union all ==, then any != inside one group → False" },
          { ref: "LC 721 Accounts Merge", tier: "core", lvl: "M", box: 30, clue: "Map emails to ids, union within each account, group by root" },
          { ref: "LC 2392 Build a Matrix With Conditions", tier: "stretch", lvl: "H", box: 30, clue: "Two independent topo sorts (rows, cols). Any cycle → empty matrix" },
          { ref: "CSES — Road Construction", tier: "core", lvl: "CSES", box: 20, clue: "After each new road: number of groups + largest group size → DSU with sizes", url: "https://cses.fi/problemset/task/1676" },
          { ref: "Codeforces problemset, rating 1200–1400, tag dsu, solve 1", tier: "stretch", lvl: "CF", box: 30, clue: "Recognise what \"same group\" means before coding" },
        ],
      },
      {
        kind: "reveal",
        prompt: "End-of-day check 1. How does Kahn's algorithm detect a cycle?",
        answer:
          "It counts the nodes that come out. A node on a cycle always has an arrow coming in from another stuck node, so its in-degree never reaches 0 and it is never pushed. If `len(order) < n`, there is a cycle.",
      },
      {
        kind: "reveal",
        prompt: "End-of-day check 2. Name the two DSU optimizations and what each one prevents.",
        answer:
          "**Path compression:** after a find, point every node on the path straight at the root. It prevents walking the same long path again and again. **Union by size:** hang the smaller tree under the bigger one. It prevents tall, chain-shaped trees. Together each operation is nearly O(1).",
      },
      {
        kind: "reveal",
        prompt: "End-of-day check 3. When must you use BFS instead of DSU?",
        answer:
          "When you need an actual **path** or a **distance**: DSU only knows \"same group or not\". Also when edges get **removed**, because DSU can't undo a union.",
      },
      {
        kind: "summary",
        title: "Day 13 done",
        points: [
          "Order, before, impossible → Kahn's. Groups, connected, edges arriving → DSU.",
          "Undirected \"which edge makes a cycle\" → first union that returns False.",
          "Equalities merge, inequalities check. Strings as nodes → map to ids first.",
          "Log 1 mistake and add 3 cards. Record them in the Tracker, and review the cards in the Gym.",
        ],
      },
    ],
  },

  /* ------------------------------ Day 14 A ------------------------------ */
  {
    id: "ch05-l13",
    day: 14,
    title: "Day 14: Dijkstra and a light MST",
    goal: "Write Dijkstra with heapq and lazy deletion from memory, and know when Kruskal's MST applies.",
    minutes: 12,
    steps: [
      {
        kind: "read",
        title: "When edges have different weights",
        body:
          "Roads have lengths. Flights have prices. Now each edge has a **weight**, and the path with the fewest edges may not be the cheapest.\n\n" +
          "**Goal (morning):** write Dijkstra with `heapq` and lazy deletion from memory, and know when Kruskal's MST applies.\n\n" +
          "**Evening:** Recognition Test #2, then a LeetCode Weekly as Contest #2. The next lesson covers the problems and the contest routine.",
      },
      {
        kind: "quiz",
        guess: true,
        prompt: "Take a guess. Which route from 0 to 1 is cheapest?",
        visual: dijGraph(["start", "", ""], ["accent", "neutral", "neutral"], "Edge numbers are costs"),
        options: ["0 → 1 directly, one edge", "0 → 2 → 1, two edges", "They cost the same"],
        answer: 1,
        explain:
          "Add the weights: 0 → 1 costs 4, but 0 → 2 → 1 costs 1 + 2 = 3. More edges, lower cost. BFS counts edges, so it would pick the 4. With weights you need a new tool.",
      },
      {
        kind: "read",
        title: "Dijkstra, frame 1: the idea",
        body:
          "**[[Dijkstra's algorithm|Dijkstra]]** is BFS where the queue is ordered by distance. It uses a **[[min-heap|heap / priority queue]]** (Day 9) of `(dist, node)` pairs.\n\n" +
          "Repeat: pop the closest node. Then **[[relax|relaxation]]** each edge u → v with weight w: if `d + w < dist[v]`, a cheaper route to v exists, so update `dist[v]` and push `(d + w, v)`.\n\n" +
          "All weights must be **non-negative**. Cost: O((V + E) log V).",
        visual: dijGraph(["0", "∞", "∞"], ["accent", "neutral", "neutral"], "dist = [0, ∞, ∞] · heap: (0, 0)"),
      },
      {
        kind: "read",
        title: "Dijkstra, frame 2: pop (0, 0)",
        body:
          "The heap gives (0, 0). Node 0 is final at 0.\n\n" +
          "Relax its edges. 0 → 1: 0 + 4 = 4 < ∞, so `dist[1] = 4`, push (4, 1). 0 → 2: 0 + 1 = 1 < ∞, so `dist[2] = 1`, push (1, 2).\n\n" +
          "The heap is now [(1, 2), (4, 1)]. Smallest first.",
        visual: dijGraph(["0", "4", "1"], ["good", "accent", "accent"], "dist = [0, 4, 1] · heap: (1, 2), (4, 1)", "0"),
      },
      {
        kind: "read",
        title: "Dijkstra, frame 3: pop (1, 2)",
        body:
          "Node 2 at distance 1 is final. Relax 2 → 1: 1 + 2 = 3 < 4. A cheaper route! `dist[1] = 3`, push (3, 1).\n\n" +
          "The old pair (4, 1) stays in the heap: `heapq` can't change a key in place. The heap is [(3, 1), (4, 1)].",
        visual: dijGraph(["0", "3", "1"], ["good", "accent", "good"], "dist = [0, 3, 1] · heap: (3, 1), (4, 1)", "2>1"),
      },
      {
        kind: "read",
        title: "Dijkstra, last frame: the stale pair",
        body:
          "Pop (3, 1): `dist[1]` is 3, it matches, so node 1 is final. It has no edges out.\n\n" +
          "Pop (4, 1): but `dist[1]` is already 3, and 4 > 3. This pair is **stale**, an old leftover. Skip it.\n\n" +
          "The heap is empty. `dist = [0, 3, 1]`. Correct.",
        visual: dijGraph(["0", "3", "1"], ["good", "good", "good"], "dist = [0, 3, 1] · (4, 1) was stale and skipped"),
      },
      {
        kind: "read",
        title: "Lazy deletion",
        body:
          "Leaving old pairs in the heap and skipping them on pop is called **[[lazy deletion]]**. The skip is one line: `if d > dist[u]: continue`.\n\n" +
          "This is the line people forget. Without it the answer is still right, but every stale pair rescans all of its node's edges. On dense or adversarial graphs that is far more work, and you TLE.",
      },
      {
        kind: "quiz",
        teach: "When a distance improves, Dijkstra pushes a new pair and leaves the old one in the heap. Compare the popped d with the stored dist.",
        prompt: "Mid-run, you pop (7, B) from the heap, but `dist[B]` is 5. What should the code do?",
        options: ["Skip it: it's a stale entry", "Set dist[B] = 7", "Relax B's edges using d = 7", "Stop: the algorithm is finished"],
        answer: 0,
        explain:
          "7 > 5, so (7, B) is a leftover from before B's distance improved. B was already handled at 5. Skip it with `if d > dist[u]: continue`.",
      },
      {
        kind: "read",
        title: "Final when popped, not when pushed",
        body:
          "Why is a popped node's distance final? Every other path to it goes through some node still in the heap, which is at least as far. Weights are non-negative, so that path can only get longer.\n\n" +
          "This is the opposite of BFS. In BFS you mark on push. In Dijkstra a distance is final only when popped.",
        callout: {
          type: "mistake",
          text: "Marking a node visited when you **push** it (the BFS habit). In Dijkstra a node's distance is final only when it's **popped**. Mark at push time and a later, shorter path gets ignored.",
        },
      },
      {
        kind: "read",
        title: "Negative edges break it",
        body:
          "The proof above needs non-negative weights. Here edge 2 → 1 costs -4.\n\n" +
          "Dijkstra pops node 1 at distance 2 and calls it final. But 0 → 2 → 1 costs 5 + (-4) = 1. The \"final\" distance was wrong.\n\n" +
          "So **Dijkstra breaks with negative edges**. On Codeforces that means [[Bellman-Ford]] or SPFA. That's beyond this month, so just recognise it.",
        visual: {
          kind: "graph",
          nodes: [
            { id: "0", x: 10, y: 70, tone: "good", note: "0" },
            { id: "2", x: 50, y: 20, note: "5" },
            { id: "1", x: 90, y: 70, tone: "bad", note: "popped at 2, truly 1" },
          ],
          edges: [
            { from: "0", to: "1", w: 2, directed: true },
            { from: "0", to: "2", w: 5, directed: true },
            { from: "2", to: "1", w: -4, directed: true, tone: "bad" },
          ],
          caption: "One negative edge: the popped distance of node 1 is not final",
        },
      },
      {
        kind: "widget",
        widget: "dijkstra",
        title: "Dijkstra lab",
        task: "Step through a full run. At each pop, say out loud whether the pair is fresh or stale before the lab tells you. How many stale pairs get skipped?",
        props: { mode: "dijkstra" },
      },
      {
        kind: "read",
        title: "The 15-second clues",
        body:
          "- Shortest path, **different non-negative weights** → Dijkstra.\n" +
          "- All weights equal → plain BFS (Day 12). Weights 0/1 → 0-1 BFS. Don't reach for Dijkstra.\n" +
          "- \"Minimize the **maximum** edge along the path\" (effort, water level) → Dijkstra with `max` instead of `+`, or binary search + BFS.\n" +
          "- \"Maximize probability\" (product of values ≤ 1) → Dijkstra on a max-heap of products.",
        callout: { type: "clue", text: "\"At most k stops / edges\" → not plain Dijkstra. Bellman-Ford for k rounds, or BFS by levels on (node, stops)." },
      },
      {
        kind: "read",
        title: "The template: Dijkstra",
        body:
          "- `dist` starts at infinity, `dist[src] = 0`, heap `[(0, src)]`.\n" +
          "- Pop `(d, u)`. If `d > dist[u]`, skip: lazy deletion.\n" +
          "- For each `(v, w)` in `adj[u]`: `nd = d + w`. If `nd < dist[v]`, update and push.\n\n" +
          "Mental test on edges 0→1 (4), 0→2 (1), 2→1 (2): pop (0,0), push (4,1), (1,2). Pop (1,2), relax 1 to 3, push (3,1). Pop (3,1), final. Pop (4,1), stale, skip. `dist = [0, 3, 1]`.",
        visual: { kind: "code", lang: "python", code: DIJKSTRA },
        callout: {
          type: "trap",
          text: "On Codeforces/CSES with 2·10^5 edges, read input with `sys.stdin.buffer` (Chapter 3) and submit with PyPy. Use `INF = 10**18` instead of `float('inf')` when you print distances, so integer output stays integer.",
        },
      },
      {
        kind: "code",
        title: "Now type it yourself",
        prompt:
          "From memory, write `dijkstra(n, adj, src)`. `adj[u]` is a list of `(v, w)` pairs with `w >= 0`. Return the list of distances, `float('inf')` for unreachable nodes.",
        starter: py(
          "# import heapq",
          "# dijkstra(n, adj, src): dist = INF, heap of (dist, node)",
          "# pop; skip if stale (d > dist[u])",
          "# relax: nd = d + w; if nd < dist[v]: update and push",
          "",
        ),
        solution: DIJKSTRA,
        tests: [
          { call: "dijkstra(3, [[(1, 4), (2, 1)], [], [(1, 2)]], 0)", expect: "[0, 3, 1]", label: "the book's example" },
          { call: "dijkstra(4, [[(1, 5), (2, 2)], [(3, 1)], [(1, 1), (3, 6)], []], 0)", expect: "[0, 3, 2, 4]" },
          { call: "dijkstra(3, [[(1, 1)], [(2, 1)], [(0, 1)]], 1)", expect: "[2, 0, 1]", label: "source is not 0" },
          { call: "dijkstra(3, [[(1, 0)], [(2, 0)], []], 0)", expect: "[0, 0, 0]", label: "zero weights" },
          { call: "dijkstra(2, [[], []], 0)", expect: "[0, float('inf')]", label: "unreachable" },
          { call: "dijkstra(1, [[]], 0)", expect: "[0]", label: "one node" },
        ],
        teach: "A heap of (dist, node) pairs. Pop the smallest; skip it if it is stale; relax each edge and push only when the distance improves.",
        explain: "The stale check is the only line that is not in a plain BFS-with-a-heap. Keep it.",
        fromMemory: true,
      },
      {
        kind: "number",
        teach: "Pop the smallest distance, relax its edges with d + w, and keep the smaller value. A route with more edges can still be cheaper.",
        prompt: "Run Dijkstra from 0 on this graph. What is the final `dist[3]`?",
        visual: {
          kind: "graph",
          nodes: [
            { id: "0", x: 10, y: 50, tone: "accent", note: "start" },
            { id: "1", x: 50, y: 15 },
            { id: "2", x: 50, y: 85 },
            { id: "3", x: 90, y: 50 },
          ],
          edges: [
            { from: "0", to: "1", w: 5, directed: true },
            { from: "0", to: "2", w: 2, directed: true },
            { from: "2", to: "1", w: 1, directed: true },
            { from: "1", to: "3", w: 1, directed: true },
            { from: "2", to: "3", w: 6, directed: true },
          ],
        },
        answer: 4,
        tolerance: 0.4,
        explain:
          "Pop 0: dist[1] = 5, dist[2] = 2. Pop 2 (at 2): 2 → 1 gives 3 < 5, 2 → 3 gives 8. Pop 1 (at 3): 1 → 3 gives 4 < 8. Pop 3 (at 4). The stale (5, 1) and (8, 3) are skipped. dist[3] = 4, via 0 → 2 → 1 → 3.",
      },
      {
        kind: "read",
        title: "MST light: Kruskal, frame 1",
        body:
          "A different question: connect **all** nodes with the least total edge weight, like cable between offices. The answer is a **[[minimum spanning tree|MST]]** (MST): n − 1 edges and no cycle.\n\n" +
          "**[[Kruskal's algorithm|Kruskal]]**: sort the edges by weight. Take each edge in order, and add it if its two ends are not connected yet. The DSU from Day 13 answers \"connected yet?\".\n\n" +
          "Here edge 1 (0–1) joins. Edge 2 (1–2) joins.",
        visual: kruskalGraph(["0-1", "1-2"], [], "taken: 1, 2 · total 3"),
      },
      {
        kind: "read",
        title: "Kruskal, last frame",
        body:
          "Edge 3 (0–2): `union(0, 2)` returns False, because 0 and 2 are already connected through 1. It would close a cycle, so skip it.\n\n" +
          "Edge 4 (2–3) joins. That is n − 1 = 3 edges: stop. Total 1 + 2 + 4 = 7. Cost O(E log E), for the sort.\n\n" +
          "Why is greedy safe? The [[exchange argument]] from Day 8: if a best tree skipped a cheap safe edge, adding it and removing a heavier edge from the cycle it forms is never worse.",
        visual: kruskalGraph(["0-1", "1-2", "2-3"], ["0-2"], "taken: 1, 2, 4 · skipped: 3 · total 7"),
      },
      {
        kind: "quiz",
        teach: "Kruskal takes edges cheapest first and asks the DSU whether the two ends are already connected.",
        prompt: "Kruskal reaches an edge, and `union(u, v)` returns False. What does it do?",
        options: ["Skips it: it would close a cycle", "Adds it and removes the heaviest edge so far", "Stops: the tree is finished", "Adds it anyway, since edges are sorted"],
        answer: 0,
        explain: "False means u and v are already in one group. Adding the edge would close a cycle and only add cost, so Kruskal skips it and moves on.",
      },
      {
        kind: "widget",
        widget: "dijkstra",
        title: "Kruskal lab",
        task: "Step through Kruskal. Before each edge, predict: join or skip? Check that it stops at n − 1 edges.",
        props: { mode: "mst" },
      },
      {
        kind: "read",
        title: "The template: Kruskal",
        body:
          "Kruskal reuses the `DSU` class from Day 13 unchanged.\n" +
          "- Edges come as `(w, u, v)`, weight first, so `sorted(edges)` sorts by weight.\n" +
          "- `if dsu.union(u, v)`: True means the edge joined two groups, so take it.\n" +
          "- Stop at `used == n - 1`. Fewer than n − 1 taken means the graph is not connected: return -1.\n\n" +
          "For LC 1584, build all pairs of points as edges (n ≤ 1000, so about 500,000 edges).",
        visual: { kind: "code", lang: "python", code: KRUSKAL },
      },
      {
        kind: "code",
        title: "Write Kruskal",
        prompt: "The `DSU` class from Day 13 is already in the editor. Write `kruskal(n, edges)` with `edges = [(w, u, v), ...]`. Return the MST's total weight, or -1 if the graph is not connected.",
        starter: DSU + "\n\n\n" + py("def kruskal(n, edges):", "    pass", ""),
        solution: DSU + "\n\n\n" + KRUSKAL,
        tests: [
          { call: "kruskal(4, [(1, 0, 1), (2, 1, 2), (3, 0, 2), (4, 2, 3), (5, 1, 3)])", expect: "7", label: "the flip-book graph" },
          { call: "kruskal(4, [(10, 0, 1), (1, 2, 3), (3, 1, 2), (7, 0, 3)])", expect: "11", label: "unsorted input" },
          { call: "kruskal(3, [(2, 0, 1), (2, 1, 2), (2, 0, 2)])", expect: "4", label: "all equal" },
          { call: "kruskal(3, [(5, 0, 1)])", expect: "-1", label: "not connected" },
          { call: "kruskal(1, [])", expect: "0", label: "one node" },
        ],
        teach: "Sort edges by weight. Take an edge when `union` returns True. Count the taken edges and stop at n − 1.",
        explain: "Putting the weight first in each tuple is what lets a plain `sorted(edges)` do the work.",
      },
      {
        kind: "summary",
        title: "Day 14 morning in five lines",
        points: [
          "Dijkstra = BFS with a min-heap of (dist, node). Pop the closest, relax with d + w. O((V + E) log V).",
          "Lazy deletion: push a new pair on improvement; skip a popped pair when d > dist[u].",
          "A distance is final when popped, not when pushed. Negative edges break Dijkstra.",
          "Equal weights → BFS. 0/1 weights → 0-1 BFS. Max along the path → Dijkstra with max.",
          "MST: Kruskal sorts edges and adds each one whose union returns True, until n − 1 edges.",
        ],
      },
    ],
  },

  /* ------------------------------ Day 14 B ------------------------------ */
  {
    id: "ch05-l14",
    day: 14,
    title: "Day 14 drill: Dijkstra, MST and Contest #2",
    goal: "Name the right shortest-path or MST tool in 15 seconds, work the morning list, then run Recognition Test #2 and Contest #2.",
    minutes: 10,
    steps: [
      {
        kind: "read",
        title: "Today's idea in four lines",
        body:
          "Match the edge weights to the tool, and spot the two twists: a path cost that is a **max**, and a cost that is a **product**.\n\n" +
          "This lesson: 5 disguised problems, the morning list, the end-of-day check, then the evening routine for Recognition Test #2 and Contest #2.",
        visual: {
          kind: "table",
          headers: ["Signal", "Tool"],
          rows: [
            ["Equal weights", "BFS"],
            ["Weights 0 or 1", "0-1 BFS"],
            ["Different non-negative weights", "Dijkstra (lazy deletion)"],
            ["Connect all, min total", "MST: Kruskal (sort + DSU)"],
          ],
        },
      },
      {
        kind: "quiz",
        teach: "Look at the weights: equal, 0/1, or many different non-negative values.",
        prompt: "Roads between towns have toll prices. Cheapest trip from your town to every other town?",
        options: ["BFS", "Dijkstra", "MST: Kruskal", "Topological sort"],
        answer: 1,
        explain: "Signal: different non-negative prices + one source to every town. That is plain Dijkstra.",
      },
      {
        kind: "quiz",
        teach: "Here a route's cost is not a sum. Ask how the cost of a route is measured and how that changes the relax step.",
        prompt: "Hiking on a height map, a route is as hard as its biggest single climb. Find the easiest route.",
        options: ["Dijkstra with max as the path cost (or binary search on the answer + BFS)", "Plain BFS", "MST: Kruskal", "Multi-source BFS"],
        answer: 0,
        explain: "Signal: \"as hard as its biggest single climb\" = minimize the maximum edge. Relax with `max(d, w)` instead of `d + w`. This is LC 1631 Path With Minimum Effort.",
      },
      {
        kind: "read",
        title: "Notice the signal",
        body:
          "\"Cheapest\" with different prices → Dijkstra.\n\n" +
          "\"As bad as its worst step\" → the path cost is a **max**, not a sum. Same Dijkstra loop, with `nd = max(d, w)`.",
      },
      {
        kind: "quiz",
        teach: "There is no start and no destination here. The goal is to connect everything as cheaply as possible.",
        prompt: "Lay fiber cable so every office is connected, using the least total cable.",
        options: ["Dijkstra from the first office", "MST: Kruskal (sort edges + DSU)", "BFS", "Topological sort"],
        answer: 1,
        explain: "Signal: \"every office connected\" + \"least total\". No single source, just one cheapest connected network: an MST. This is LC 1584.",
      },
      {
        kind: "quiz",
        teach: "A path's reliability is the product of its values, each at most 1. You want the biggest product, and Python's heap pops the smallest.",
        prompt: "Each connection succeeds with some probability. Find the most reliable path.",
        options: ["Dijkstra on products with a max-heap (push -prob)", "Plain BFS", "MST: Kruskal", "Dijkstra with max as the path cost"],
        answer: 0,
        explain:
          "Signal: maximize a product of values ≤ 1. Multiplying can only shrink a value, so the \"pop the best, it's final\" idea still holds. `heapq` is a min-heap, so push `-prob`. This is LC 1514.",
      },
      {
        kind: "read",
        title: "Notice the signal",
        body:
          "\"Connect everything, least total\" has no start node: MST, not Dijkstra.\n\n" +
          "\"Maximize probability\": products of values ≤ 1 only shrink, so Dijkstra still works. Flip the sign to use a min-heap as a max-heap.",
      },
      {
        kind: "quiz",
        teach: "Plain Dijkstra keeps one best distance per node. Ask what happens when the path is also limited in how many edges it may use.",
        prompt: "Flights with prices, but you may take at most 2 layovers. Cheapest route?",
        options: ["Plain Dijkstra", "Not plain Dijkstra: Bellman-Ford for k + 1 rounds", "MST: Kruskal", "0-1 BFS"],
        answer: 1,
        explain:
          "Signal: \"at most k stops\". Plain Dijkstra may keep a cheap route that uses too many flights. Run Bellman-Ford for k + 1 rounds (2 layovers = 3 flights), or BFS by levels on (node, stops). This is LC 787 Cheapest Flights Within K Stops.",
      },
      {
        kind: "practice",
        title: "Morning problems (0:40–2:00, stop on time)",
        intro:
          PRACTICE_RULES +
          " Stop at 2:00 even if rows are left. Codeforces today: skip it. The contest is your Codeforces-style practice.",
        problems: [
          { ref: "LC 743 Network Delay Time", tier: "warm", lvl: "M", box: 20, clue: "Template exactly. Answer = max dist, or −1 if any is INF" },
          { ref: "LC 1631 Path With Minimum Effort", tier: "core", lvl: "M", box: 20, clue: "Path cost = max step, so Dijkstra with max(d, w)" },
          { ref: "LC 1514 Path with Maximum Probability", tier: "core", lvl: "M", box: 20, clue: "Products ≤ 1, so push -prob into a min-heap" },
          { ref: "LC 1584 Min Cost to Connect All Points", tier: "core", lvl: "M", box: 20, clue: "\"Connect all, min total\" → Kruskal on all pairs (n ≤ 1000)" },
          { ref: "CSES — Shortest Routes I", tier: "core", lvl: "CSES", box: 20, clue: "Directed, weights up to 10^9, n = 10^5 → fast I/O + PyPy", url: "https://cses.fi/problemset/task/1671" },
          { ref: "LC 778 Swim in Rising Water", tier: "stretch", lvl: "H", box: 45, clue: "Minimize the max cell on the path = Dijkstra with max" },
        ],
      },
      {
        kind: "reveal",
        prompt: "End-of-day check 1. What is the lazy-deletion line in Dijkstra, and what breaks without it?",
        answer:
          "`if d > dist[u]: continue`. It skips stale pairs: old entries left in the heap after a distance improved. Without it the answer is still right, but every stale pair rescans its node's edges, so dense or adversarial graphs TLE.",
      },
      {
        kind: "reveal",
        prompt: "End-of-day check 2. Why does Dijkstra fail with negative edges?",
        answer:
          "Dijkstra treats a popped node as final, because any other route to it passes through a node at least as far away and can only get longer. A negative edge breaks that: a later route can get shorter, so a distance already called final turns out wrong.",
      },
      {
        kind: "reveal",
        prompt: "End-of-day check 3. Kruskal in one sentence: what is sorted, and what checks for a cycle?",
        answer:
          "The **edges are sorted by weight**, and each one is added unless the **DSU** says its two ends are already connected (union returns False, so it would close a cycle); stop at n − 1 edges.",
      },
      {
        kind: "read",
        title: "Evening, part 1: Recognition Test #2",
        body:
          "Before the contest, take 15 minutes for Recognition Test #2: 30 [[cards|recognition card]] from the Gym that you haven't seen in warm-ups, covering Days 1–14. 15 seconds each, answer out loud, no going back.\n\n" +
          "Record % correct and average seconds in the Tracker, in the Day 14 column. Compare with Day 0 and Day 7, not with how you feel.\n\n" +
          "If a topic misses 2 or more cards, it goes first in next week's warm-ups.",
      },
      {
        kind: "read",
        title: "Evening, part 2: Contest #2",
        body:
          "Contest #2 is a LeetCode Weekly: 90 minutes, 4 problems. Check leetcode.com/contest for the start time in your time zone.\n" +
          "- Before you start: template file open, `heapq`, `deque`, DSU and Dijkstra typed out and ready.\n" +
          "- For each problem: read the constraints first, say the pattern within 60 seconds, write the three-line clue comment, then code.\n" +
          "- Stuck on one for 20 minutes → move on (the [[stuck protocol]] in Chapter 10, the contest playbook).",
      },
      {
        kind: "read",
        title: "After the contest",
        body:
          "Fill one row of the contest log tonight, in the Tracker. [[Upsolving|upsolve]] is the first 45 minutes of Day 15.\n\n" +
          "Realistic target this week: Q1 + Q2 solved, and a real attempt at Q3. Two clean solves beat three with four wrong submissions.",
        visual: {
          kind: "stats",
          items: [
            { value: "Q1 + Q2", label: "solved", note: "the realistic target" },
            { value: "Q3", label: "a real attempt" },
            { value: "45 min", label: "upsolve", note: "start of Day 15" },
          ],
        },
      },
      {
        kind: "summary",
        title: "Week 2 done",
        points: [
          "Different non-negative weights → Dijkstra. Max along the path → Dijkstra with max. Products ≤ 1 → max-heap with -prob.",
          "Connect all, min total → Kruskal. At most k stops → not plain Dijkstra.",
          "Log 1 mistake and add 3 cards. Record them in the Tracker, and review the cards in the Gym.",
          "Before bed: fill the contest log row and the Day 14 progress column in the Tracker.",
        ],
      },
    ],
  },
];

export default lessons;
