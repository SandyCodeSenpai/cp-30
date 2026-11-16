import type { Chapter } from "./types";
import part1 from "./ch07/part1";
import part2 from "./ch07/part2";
// Lessons live in ./ch07/part1.ts (first days) and ./ch07/part2.ts (last days), one agent each.
const ch: Chapter = {
  n: 7, title: "Week 4: The CP Toolkit", short: "Week 4", part: 5,
  hook: "Modular math, primes, bits, Fenwick and segment trees, strings and constructive problems.",
  sources: [],
  lessons: [...part1, ...part2],
};
export default ch;
