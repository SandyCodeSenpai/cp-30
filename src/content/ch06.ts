import type { Chapter } from "./types";
import part1 from "./ch06/part1";
import part2 from "./ch06/part2";
// Lessons live in ./ch06/part1.ts (first days) and ./ch06/part2.ts (last days), one agent each.
const ch: Chapter = {
  n: 6, title: "Week 3: Dynamic Programming", short: "Week 3: DP", part: 4,
  hook: "From memoized recursion to tables, knapsack, LIS, bitmask and tree DP.",
  sources: [],
  lessons: [...part1, ...part2],
};
export default ch;
