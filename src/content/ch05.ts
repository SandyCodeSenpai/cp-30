import type { Chapter } from "./types";
import part1 from "./ch05/part1";
import part2 from "./ch05/part2";
// Lessons live in ./ch05/part1.ts (first days) and ./ch05/part2.ts (last days), one agent each.
const ch: Chapter = {
  n: 5, title: "Week 2: Greedy, Heaps, Trees and Graphs", short: "Week 2", part: 3,
  hook: "Greedy proofs, heaps, backtracking, trees, BFS, union-find and Dijkstra.",
  sources: [],
  lessons: [...part1, ...part2],
};
export default ch;
