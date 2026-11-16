/**
 * Test chapter for the lesson player: route #ch99-1 (every step kind) and #ch99-2 (short).
 * ch99-1 covers teach-first (a guess step, `teach` on most questions, a number step with only a `hint`, an order step
 * with neither), the flip-book visuals (two flow steps in a row, three array steps in a row, then grid, tree, graph),
 * a code step with function tests, a from-memory code step with stdin tests, and a practice step.
 * Not part of the course.
 */
import type { ArrayVisual, Chapter, FlowSpec, SequenceSpec } from "@/content/types";

const choose: FlowSpec = {
  direction: "right",
  nodes: [
    { id: "read", label: "Read n", sub: "from the constraints", col: 0, row: 1 },
    { id: "small", label: "n ≤ 3,000", sub: "about 4.5M pairs", col: 1, row: 0 },
    { id: "big", label: "n ≤ 100,000", sub: "about 5 billion pairs", col: 1, row: 2 },
    { id: "brute", label: "Check every pair", sub: "O(n²)", col: 2, row: 0, tone: "good" },
    { id: "hash", label: "One pass + dict", sub: "O(n)", col: 2, row: 2, tone: "good" },
  ],
  edges: [
    { from: "read", to: "small" },
    { from: "read", to: "big" },
    { from: "small", to: "brute", label: "fast enough" },
    { from: "big", to: "hash", label: "needed" },
  ],
};

const calls: SequenceSpec = {
  actors: [
    { id: "loop", label: "for i, x" },
    { id: "seen", label: "seen (dict)" },
  ],
  messages: [
    { from: "loop", to: "seen", label: "x = 2: is 7 in seen?" },
    { from: "seen", to: "loop", label: "no", dashed: true },
    { from: "loop", to: "seen", label: "seen[2] = 0" },
    { from: "loop", to: "seen", label: "x = 7: is 2 in seen?" },
    { from: "seen", to: "loop", label: "yes, index 0", tone: "good", dashed: true },
  ],
};

const nums = [1, 3, 4, 6, 8, 11];
const arr = (l: number, r: number, caption: string, found = false): ArrayVisual => ({
  kind: "array",
  indices: true,
  rows: [{
    label: "nums",
    items: nums,
    pointers: [{ at: l, label: "L", tone: found ? "good" : "accent" }, { at: r, label: "R", tone: found ? "good" : "accent" }],
    ranges: [{ from: l, to: r, tone: found ? "good" : "neutral", label: found ? "sum 10" : `sum ${nums[l] + nums[r]}` }],
    tones: found ? { [l]: "good", [r]: "good" } : undefined,
  }],
  caption,
});

const FIXTURE: Chapter = {
  n: 99,
  title: "Player test bench",
  short: "Test bench",
  part: 3,
  hook: "Every step kind in one place, for testing the lesson player.",
  sources: [],
  lessons: [
    {
      id: "ch99-l1",
      title: "Two Sum, three ways",
      goal: "Pick the right Two Sum method from n, and write the one-pass hash map version.",
      minutes: 12,
      steps: [
        {
          kind: "read",
          title: "Let n choose the method",
          body:
            "**Two Sum**: given a list `nums` and a number `target`, find two positions whose values add up to `target`.\n\n" +
            "Before you write code, read **n** from the constraints. It tells you how much work you can afford. " +
            "CPython does about 10^7 simple operations per second.",
          visual: { kind: "flow", spec: { ...choose, focus: ["read", "small", "big", "read>small", "read>big"] }, caption: "Constraints first, then the method" },
          callout: { type: "clue", text: "\"Two numbers that add up to target\" plus n up to 10^5 means a hash map, in one pass." },
        },
        {
          kind: "quiz",
          guess: true,
          prompt: "n = 100,000. Will checking every pair finish in 1 second in Python?",
          options: ["Yes, easily", "Yes, just barely", "No, it is far too slow"],
          answer: 2,
          explain:
            "There are about n²/2 = 5 billion pairs. At about 10^7 simple operations per second, that is around **500 seconds**. " +
            "A time limit is usually 1 or 2 seconds, so you need an O(n) or O(n log n) method.",
        },
        {
          kind: "quiz",
          teach: "Count the pairs: about n²/2. Compare that number with about 10^7 operations per second in CPython.",
          prompt: "n = 3,000. Is checking every pair fast enough?",
          visual: { kind: "flow", spec: { ...choose, focus: ["small", "brute", "small>brute"] } },
          options: ["Yes: about 4.5M pairs is well under a second", "No: any O(n²) is too slow", "Only in PyPy"],
          answer: 0,
          explain: "3,000² / 2 is about 4.5 million pairs. That is about half a second or less in CPython. O(n²) is fine for small n.",
        },
        {
          kind: "read",
          title: "Large n: one pass with a dict",
          body:
            "Walk the list once. For each number `x`, the partner you need is `target - x`.\n\n" +
            "- If the partner is already in a dict `seen`, you have the answer.\n- If not, store `seen[x] = i` and move on.\n\nEach lookup is O(1) on average, so the whole walk is O(n).",
          visual: { kind: "flow", spec: { ...choose, focus: ["big", "hash", "big>hash"], flow: ["read>big", "big>hash"] } },
        },
        {
          kind: "read",
          title: "Watch the dict fill up",
          body: "With `nums = [2, 7, 11, 15]` and `target = 9`: at `x = 2` the partner 7 is not there yet, so we store 2. At `x = 7` the partner 2 is there. Done after two steps.",
          visual: { kind: "sequence", spec: calls, caption: "One pass: look up the partner, then store the number" },
        },
        {
          kind: "read",
          title: "Sorted input: two pointers",
          body: "If the list is **sorted**, you need no dict. Put `L` at the start and `R` at the end. Look at `nums[L] + nums[R]` and compare it with the target, 10.",
          visual: arr(0, 5, "1 + 11 = 12, too big: move R left"),
        },
        {
          kind: "read",
          title: "Each move throws away one value",
          body: "The sum was too big, so `nums[R]` = 11 can never be in an answer: even the smallest partner is too much. Move `R` left. Now 1 + 8 = 9 is too small, so move `L` right.",
          visual: arr(0, 4, "1 + 8 = 9, too small: move L right"),
        },
        {
          kind: "read",
          title: "Found it",
          body: "After a few more moves, `L` points at 4 and `R` at 6. 4 + 6 = 10. Each step moves one pointer, so the walk is O(n).",
          visual: arr(2, 3, "4 + 6 = 10: found", true),
          callout: { type: "move", text: "Two pointers work because the list is sorted: one comparison tells you which side can never help." },
        },
        {
          kind: "read",
          title: "A grid visual",
          body: "A DP table. Each cell is the number of paths to it: the cell above plus the cell to the left.",
          visual: {
            kind: "grid",
            cells: [[1, 1, 1, 1], [1, 2, 3, 4], [1, 3, 6, 10]],
            rowLabels: ["r0", "r1", "r2"],
            colLabels: ["c0", "c1", "c2", "c3"],
            tones: { "2,3": "accent", "1,3": "warn", "2,2": "warn" },
            arrows: [{ from: [1, 3], to: [2, 3] }, { from: [2, 2], to: [2, 3] }],
            caption: "dp[2][3] = dp[1][3] + dp[2][2] = 4 + 6 = 10",
          },
        },
        {
          kind: "read",
          title: "A tree visual",
          body: "The tree `[3, 9, 20, null, null, 15, 7]` in LeetCode's level order. The small labels are the depth each call returns.",
          visual: { kind: "tree", nodes: [3, 9, 20, null, null, 15, 7], tones: { 0: "accent" }, notes: { 0: "3", 1: "1", 2: "2", 5: "1", 6: "1" }, caption: "max depth = 1 + max(left, right)" },
        },
        {
          kind: "read",
          title: "A graph visual",
          body: "A small graph. BFS from `A` visits nodes in layers: first `B` and `C`, then `D`, then `E`.",
          visual: {
            kind: "graph",
            nodes: [
              { id: "A", x: 10, y: 50, tone: "accent", note: "d=0" },
              { id: "B", x: 38, y: 20, note: "d=1" },
              { id: "C", x: 38, y: 80, note: "d=1" },
              { id: "D", x: 66, y: 50, note: "d=2" },
              { id: "E", x: 92, y: 50, note: "d=3" },
            ],
            edges: [
              { from: "A", to: "B" }, { from: "A", to: "C" }, { from: "B", to: "D" }, { from: "C", to: "D" }, { from: "D", to: "E", w: 4 },
            ],
            caption: "BFS layers from A",
          },
        },
        {
          kind: "multi",
          prompt: "Which of these need a sorted list to work?",
          options: ["Two pointers for a pair sum", "One pass with a dict", "Binary search for a value", "Counting with collections.Counter"],
          answers: [0, 2],
          teach: "Ask of each method: does it use the order of the values to throw part of the list away?",
          explain: "Two pointers and binary search both use the order to rule out a whole side at once. A dict and a Counter do not care about order.",
        },
        {
          kind: "number",
          prompt: "n = 100,000. About how many pairs (i < j) does brute force check, in billions?",
          answer: 5,
          tolerance: 0.5,
          unit: "billion",
          hint: "The number of pairs is n(n-1)/2, which is close to n²/2. 100,000² = 10^10.",
          explain: "n²/2 = 10^10 / 2 = 5 x 10^9 = **5 billion** pairs.",
        },
        {
          kind: "order",
          prompt: "Put the one-pass Two Sum loop body in order.",
          items: ["Take the next x at index i", "Compute need = target - x", "If need is in seen, return [seen[need], i]", "Store seen[x] = i"],
          explain: "Look up the partner before you store x. If you store first, x could pair with itself when target = 2x.",
        },
        {
          kind: "match",
          prompt: "Match each clue to its method.",
          teach: "Think about what each clue lets you skip: order lets you skip a side, a dict lets you skip the inner loop.",
          pairs: [
            ["Sorted list, pair sum", "Two pointers"],
            ["Unsorted list, pair sum", "One pass with a dict"],
            ["n ≤ 3,000", "Check every pair"],
            ["Find a value in a sorted list", "Binary search"],
          ],
          explain: "Sorted means two pointers or binary search. Unsorted with a pair means a dict. Small n means brute force is fine.",
        },
        {
          kind: "reveal",
          prompt: "Two Sum asks for indices, but you sort the list to use two pointers. What goes wrong, and how do you fix it?",
          answer:
            "Sorting moves the values, so the positions you find are positions in the **sorted** list, not the original one.\n\n" +
            "- Fix 1: sort pairs `(value, index)` and return the stored indices.\n- Fix 2: use the one-pass dict instead. It never moves anything.",
        },
        {
          kind: "widget",
          widget: "two-pointers",
          title: "Move the pointers yourself",
          task: "Step the two pointers through the sorted list until they find the pair. Watch which value each move throws away.",
        },
        {
          kind: "code",
          title: "Two Sum, one pass",
          prompt: "Write `two_sum(nums, target)`. Return `[i, j]` with `i < j` where `nums[i] + nums[j] == target`. Exactly one answer exists. Use one pass and a dict.",
          starter: "def two_sum(nums, target):\n    seen = {}  # value -> index\n    for i, x in enumerate(nums):\n        pass\n    return []\n",
          solution: "def two_sum(nums, target):\n    seen = {}  # value -> index\n    for i, x in enumerate(nums):\n        need = target - x\n        if need in seen:\n            return [seen[need], i]\n        seen[x] = i\n    return []\n",
          tests: [
            { call: "two_sum([2, 7, 11, 15], 9)", expect: "[0, 1]" },
            { call: "two_sum([3, 2, 4], 6)", expect: "[1, 2]" },
            { call: "two_sum([3, 3], 6)", expect: "[0, 1]", label: "two equal numbers" },
            { call: "two_sum([-1, -2, -3, -4, -5], -8)", expect: "[2, 4]" },
          ],
          teach: "For each `x`, the partner is `target - x`. Look it up in `seen` first. If it is there, return both indices. If not, store `seen[x] = i`.",
          explain: "Looking up before storing handles `[3, 3]` with target 6: the second 3 finds the first one. The loop does O(1) work per number, so it is O(n).",
        },
        {
          kind: "code",
          title: "Fast input template",
          fromMemory: true,
          prompt: "Type the fast-input template from memory. The input is `n` on the first line, then `n` integers on the second. Print their sum.",
          starter: "import sys\ninput = sys.stdin.readline\n\ndef main():\n    n = int(input())\n    # read the n numbers and print their sum\n\nmain()\n",
          solution: "import sys\ninput = sys.stdin.readline\n\ndef main():\n    n = int(input())\n    a = list(map(int, input().split()))\n    print(sum(a))\n\nmain()\n",
          tests: [
            { stdin: "3\n1 2 3\n", stdout: "6" },
            { stdin: "1\n-5\n", stdout: "-5" },
            { stdin: "5\n1000000000 1000000000 1000000000 1000000000 1000000000\n", stdout: "5000000000" },
          ],
          explain: "`sys.stdin.readline` is much faster than the built-in `input()` on large inputs. Python integers never overflow, so the last test just works.",
        },
        {
          kind: "practice",
          title: "Pair-sum problems",
          intro: "Give each problem its time box. No AI help. When a box runs out, read the editorial and log what you missed.",
          problems: [
            { ref: "LC 1 Two Sum", tier: "warm", lvl: "E", box: 15, clue: "Unsorted, return indices: one pass with a dict from value to index." },
            { ref: "LC 167 Two Sum II - Input Array Is Sorted", tier: "core", lvl: "M", box: 20, clue: "Sorted input and O(1) extra space: two pointers from both ends." },
            { ref: "LC 15 3Sum", tier: "core", lvl: "M", box: 35, clue: "Sort, fix one number, then two pointers on the rest. Skip equal neighbours to avoid duplicate triples." },
            { ref: "CSES — Sum of Two Values", tier: "stretch", lvl: "CSES", box: 30, clue: "Same as Two Sum, but read fast with sys.stdin and print 1-based positions." },
            { ref: "Codeforces problemset, rating 800–1000, tag two pointers, solve 2", tier: "stretch", lvl: "800–1000", box: 40, clue: "Read the constraints first. If n is up to 2 x 10^5, an O(n²) loop will not pass." },
          ],
        },
        {
          kind: "quiz",
          prompt: "Which method fits best here?",
          visual: {
            kind: "table",
            headers: ["Method", "Time", "Needs sorted?"],
            rows: [["Every pair", "O(n²)", "no"], ["Dict, one pass", "O(n)", "no"], ["Two pointers", "O(n)", "yes"]],
            caption: "Three ways to find a pair sum",
          },
          options: ["Every pair", "Dict, one pass"],
          teach: "Look at the time column, then ask whether the input is sorted. Here n is 100,000 and the list is not sorted.",
          answer: 1,
          explain: "With n = 100,000 and an unsorted list, the **one-pass dict** is the right tool: O(n), and it keeps the original indices.",
        },
        {
          kind: "summary",
          points: [
            "Read n first: about 10^7 simple operations per second in CPython.",
            "Small n: checking every pair is fine. Large n: one pass with a dict.",
            "Sorted input: two pointers, O(n) time and O(1) extra space.",
            "In the dict version, look up `target - x` before you store `x`.",
          ],
        },
      ],
    },
    {
      id: "ch99-l2",
      title: "A short second lesson",
      goal: "Check the Next lesson button.",
      minutes: 1,
      steps: [
        { kind: "read", title: "Hello again", body: "This lesson exists so that **Next lesson** has somewhere to go." },
        { kind: "summary", points: ["Next lesson works.", "Back to chapter works."] },
      ],
    },
  ],
};

export default FIXTURE;
