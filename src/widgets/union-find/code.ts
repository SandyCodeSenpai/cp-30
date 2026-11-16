/** Python templates shown in the code panel (Day 13). Line numbers in engine.ts index into these arrays. */

// The book's DSU, exactly: iterative find with path compression + union by size.
export const OPT = [
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
];
export const L = {
  init: 2, findStart: 7, findLoop: 8, findUp: 9, compLoop: 10, compSet: 12, findRet: 14,
  uFind: 17, uSame: 18, uFalse: 19, uCmp: 20, uSwap: 21, uAttach: 22, uSize: 23, uGroups: 24, uTrue: 25,
} as const;

// The same class with both tricks removed: the plain version.
export const BASIC = [
  "class DSU:",
  "    def __init__(self, n):",
  "        self.parent = list(range(n))",
  "",
  "    def find(self, x):",
  "        while self.parent[x] != x:",
  "            x = self.parent[x]",
  "        return x",
  "",
  "    def union(self, a, b):",
  "        a, b = self.find(a), self.find(b)",
  "        if a == b:",
  "            return False                  # already connected",
  "        self.parent[b] = a                # attach b's root under a",
  "        return True",
];
export const B = { init: 2, findLoop: 5, findUp: 6, findRet: 7, uFind: 10, uSame: 11, uFalse: 12, uAttach: 13, uTrue: 14 } as const;

// Edges arriving one by one (uses the DSU class above).
export const COMP = [
  "# edges arrive one at a time (undirected graph)",
  "dsu = DSU(n)",
  "for a, b in edges:",
  "    if dsu.union(a, b):",
  "        print(dsu.groups)        # merged: one group fewer",
  "    else:",
  "        print(\"cycle\", a, b)     # a, b already connected",
];
export const C = { init: 1, loop: 2, union: 3, merged: 4, cycle: 6 } as const;
