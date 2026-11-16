import type { Chapter } from "./types";
import part1 from "./ch04/part1";
import part2 from "./ch04/part2";
// Lessons live in ./ch04/part1.ts (first days) and ./ch04/part2.ts (last days), one agent each.
const ch: Chapter = {
  n: 4, title: "Week 1: Foundations", short: "Week 1", part: 2,
  hook: "Constraints, hashing, two pointers, windows, prefix sums, stacks and binary search.",
  sources: [],
  lessons: [...part1, ...part2],
};
export default ch;
