import type { Chapter, PartMeta } from "./types";
import ch00 from "./ch00";
import ch01 from "./ch01";
import ch02 from "./ch02";
import ch03 from "./ch03";
import ch04 from "./ch04";
import ch05 from "./ch05";
import ch06 from "./ch06";
import ch07 from "./ch07";
import ch08 from "./ch08";
import ch09 from "./ch09";
import ch10 from "./ch10";
import ch11 from "./ch11";
import ch12 from "./ch12";
export const CHAPTERS: Chapter[] = [ch00, ch01, ch02, ch03, ch04, ch05, ch06, ch07, ch08, ch09, ch10, ch11, ch12];
export const PARTS: PartMeta[] = [
  { id: 0, name: "Start here", blurb: "The honest target and the rules of the month." },
  { id: 1, name: "Mindset and tools", blurb: "How strong programmers think, and Python for contests." },
  { id: 2, name: "Week 1: Foundations", blurb: "Days 0 to 7. Constraints, hashing, pointers, windows, prefix sums, stacks, binary search." },
  { id: 3, name: "Week 2: Core structures", blurb: "Days 8 to 14. Greedy, heaps, backtracking, trees and graphs." },
  { id: 4, name: "Week 3: Dynamic programming", blurb: "Days 15 to 21. States, tables, knapsack, LIS, bitmask and tree DP." },
  { id: 5, name: "Week 4: The CP toolkit", blurb: "Days 22 to 28. Math, bits, range queries, strings, constructive." },
  { id: 6, name: "Finish line and beyond", blurb: "Mocks, the final exam, the recognition gym, contests and month two." },
];
export { GLOSSARY } from "./glossary";
export { DECK } from "./deck";
