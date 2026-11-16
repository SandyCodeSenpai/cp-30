import type { ArrayVisual, Chapter, Visual } from "./types";

/* Day 29 schedule as a snake of blocks. Re-used with a moving focus (flip book). */
const schedule = (focus?: string[]): Visual => ({
  kind: "flow",
  spec: {
    nodes: [
      { id: "b1", label: "Upsolve #4", sub: "45 min", col: 0, row: 0 },
      { id: "b2", label: "CF virtual", sub: "Div 3 or Div 4", col: 1, row: 0 },
      { id: "br", label: "Break", sub: "20 min, off screen", col: 2, row: 0 },
      { id: "b3", label: "ABC virtual", sub: "100 min, A to D", col: 3, row: 0 },
      { id: "b4", label: "Tally journal", sub: "15 min", col: 3, row: 1 },
      { id: "b5", label: "Weak-topic patch", sub: "75 min", col: 2, row: 1 },
      { id: "b6", label: "Log + cards", sub: "15 min", col: 1, row: 1 },
    ],
    edges: [
      { from: "b1", to: "b2" },
      { from: "b2", to: "br" },
      { from: "br", to: "b3" },
      { from: "b3", to: "b4" },
      { from: "b4", to: "b5" },
      { from: "b5", to: "b6" },
    ],
    focus,
  },
  caption: "Day 29: about 6 hours, in this order",
});

/* Starting a Codeforces virtual contest, revealed message by message. */
const cfVirtual = (upTo: number): Visual => ({
  kind: "sequence",
  spec: {
    actors: [
      { id: "you", label: "You", kind: "viewer" },
      { id: "cf", label: "Codeforces", kind: "service" },
    ],
    messages: [
      { from: "you", to: "cf", label: "Log in, open codeforces.com/contests" },
      { from: "cf", to: "you", label: "List of past contests" },
      { from: "you", to: "cf", label: "Pick an unseen (Div. 3) or (Div. 4)" },
      { from: "you", to: "cf", label: "Click Virtual participation" },
      { from: "you", to: "cf", label: "Choose start time, register" },
      { from: "cf", to: "you", label: "Timer starts, problems open", tone: "accent" },
      { from: "you", to: "cf", label: "Submit as normal" },
      { from: "cf", to: "you", label: "Standings at the same elapsed minute", tone: "good" },
    ],
    upTo,
  },
});

/* Five exam cards, revealed row by row. */
const examCards = (rows: 1 | 2 | 3): Visual => {
  const r: ArrayVisual = {
    kind: "array",
    indices: false,
    rows: [{ label: "seconds", items: [8, 12, 19, 6, 14] }],
    caption: "Five cards from the exam",
  };
  if (rows >= 2) r.rows.push({ label: "right?", items: ["yes", "yes", "yes", "no", "yes"] });
  if (rows >= 3)
    r.rows.push({
      label: "counts?",
      items: ["hit", "hit", "miss", "miss", "hit"],
      tones: { 0: "good", 1: "good", 2: "bad", 3: "bad", 4: "good" },
    });
  if (rows >= 3) r.caption = "3 of 5 count. Card 3 was right but too slow.";
  return r;
};

const tallyCode =
  "import sys\nfrom collections import Counter\n\ntally = Counter(line.strip().lower() for line in sys.stdin if line.strip())\nfor topic, n in tally.most_common():\n    print(f\"{n:3d}  {topic}\")\n";

const timerCode =
  "import time\n\ncorrect = 0\nmissed = []\ntimes = []\nfor card in range(1, 101):\n    input(f\"Card {card}: press Enter, read it, answer aloud ... \")\n    start = time.monotonic()\n    input(\"Press Enter the moment you have said your answer \")\n    took = time.monotonic() - start\n    times.append(took)\n    right = input(\"Right? [y/n] \").strip().lower() == \"y\"\n    if right and took <= 15:\n        correct += 1\n    else:\n        missed.append((card, round(took, 1), right))\nprint(f\"Score: {correct}/100   {'PASS' if correct >= 85 else 'NOT YET'}\")\nprint(f\"Average seconds per card: {sum(times) / len(times):.1f}\")\nprint(\"Missed (card, seconds, was_right):\", missed)\n";

const ch: Chapter = {
  n: 8,
  title: "Days 29 and 30: Mocks and the Final Exam",
  short: "Final days",
  part: 6,
  hook: "Full mock contests, a weak-topic patch, and the final 15-second exam.",
  sources: [],
  lessons: [
    /* ---------------- Day 29, lesson A ---------------- */
    {
      id: "ch08-l1",
      day: 29,
      title: "Day 29: Full mock contests",
      goal: "Run a Codeforces virtual and an AtCoder ABC virtual under real time limits, then find and patch your two weakest topics.",
      minutes: 12,
      steps: [
        {
          kind: "read",
          title: "Two days left",
          body:
            "No new topics now. **Day 29** tests whether you can solve under contest pressure on two platforms, then patches the two weakest spots your mistake journal shows. **Day 30** measures you against Day 0 with the same instruments, so the comparison is honest.\n\n**Goal:** finish one full Codeforces virtual round and one AtCoder ABC virtual under real time limits, then fix your two worst topics with 6 targeted problems.",
          visual: {
            kind: "stats",
            items: [
              { value: "2", label: "virtual contests", note: "Codeforces + AtCoder" },
              { value: "6", label: "patch problems", note: "3 per weak topic" },
              { value: "~6 h", label: "today", note: "long on purpose" },
            ],
          },
        },
        {
          kind: "quiz",
          guess: true,
          prompt: "Take a guess. Today is planned as about 6 hours, but you only have 3. Which block would you drop?",
          options: ["The weak-topic patch", "The AtCoder ABC virtual", "The upsolve of Contest #4"],
          answer: 1,
          explain:
            "Drop the AtCoder virtual, not the patch. One full Codeforces mock already gives you contest pressure. The patch is the only block that fixes the topics you keep missing.",
        },
        {
          kind: "read",
          title: "Why the day is long",
          body:
            "Day 29 is about 6 hours **on purpose**. Two full mocks back to back is the closest you get to a real contest weekend: the second contest shows how you solve when you are already tired.\n\nIf you cannot give it 6 hours, drop the AtCoder virtual, not the patch.",
          visual: schedule(),
        },
        {
          kind: "read",
          title: "Block 1: upsolve Contest #4",
          body:
            "Every day after a contest day starts with an **[[upsolve]]**: solving, after the contest, a problem you could not solve during it.\n\nToday: the first problem you did not solve in Contest #4 (Day 28). You get 45 minutes. Open the [[editorial]] only after 20 stuck minutes.",
          visual: schedule(["b1"]),
        },
        {
          kind: "read",
          title: "Block 2: which Codeforces division",
          body:
            "Look at Day 27's Div 3 virtual.\n\n- Solved A and B? Take another **Div 3**.\n- Solved fewer than 2? Take a **Div 4**. It is easier, and getting A to D accepted is a better use of today than staring at C.\n\nPick a round from the last 12 months that you have never opened. Older rounds have a different style.",
          visual: schedule(["b2"]),
        },
        {
          kind: "quiz",
          teach: "The division depends on Day 27's Div 3 virtual. Two or more solved means another Div 3. Fewer than 2 means the easier Div 4.",
          prompt: "In Day 27's Div 3 virtual you solved only problem A. Which round do you take today?",
          options: [
            "A Div 3, to push for C",
            "A Div 4 you have never opened, from the last 12 months",
            "Any Div 4, even one you have seen, so you can finish it",
            "A Div 2, for more challenge",
          ],
          answer: 1,
          explain:
            "Fewer than 2 solved means Div 4. It must be a round you have never opened (a seen round tests memory, not solving), and from the last 12 months, because older rounds have a different style.",
        },
        {
          kind: "read",
          title: "Starting a virtual contest (1)",
          body:
            "A **[[virtual contest]]** replays a past round with its real time limit. You can do it any time.\n\nOn Codeforces: log in, open codeforces.com/contests, and scroll to the past contests. Find a \"(Div. 3)\" or \"(Div. 4)\" round you have not seen. Click **Virtual participation** in that row.",
          visual: cfVirtual(3),
        },
        {
          kind: "read",
          title: "Starting a virtual contest (2)",
          body:
            "Choose the start time (the default is a few minutes from now) and register. When the timer starts, open the problems and submit as normal.\n\nThe contest runs for the round's original length. The standings show you among the real contestants at the same elapsed minute.",
          visual: cfVirtual(7),
        },
        {
          kind: "read",
          title: "Rules for a virtual",
          body:
            "Virtual contests are **unrated** (your rating does not change) and have no **[[hacks|hack]]** (nobody can attack your solution with a new test).\n\nYour own rules until it ends: no editorial, no AI, no reading other people's code. Treat it exactly like a live round.",
          callout: { type: "mistake", text: "Peeking at the editorial \"just for a hint\" turns a mock into practice. Then you learn nothing about how you solve under the clock." },
        },
        {
          kind: "order",
          teach: "You find the round first, then join it through its row in the past-contest list, then set the start, and only then the timer runs.",
          prompt: "Put the steps for a Codeforces virtual contest in order.",
          items: [
            "Open codeforces.com/contests and scroll to past contests",
            "Find a (Div. 3) or (Div. 4) round you have not seen",
            "Click Virtual participation in that row",
            "Choose the start time and register",
            "Timer starts: open the problems and submit",
          ],
          explain: "List, round, Virtual participation, start time, then solve. The standings then compare you with real contestants at the same minute.",
        },
        {
          kind: "read",
          title: "Break, then the AtCoder ABC virtual",
          body:
            "First a 20-minute break, away from the screen.\n\nThen open atcoder.jp, go to past contests, pick an **[[AtCoder Beginner Contest (ABC)|ABC (AtCoder Beginner Contest)]]** you have not seen, and use its **Virtual Participation** option. Can't find it? Use AtCoder Problems (kenkoooo.com/atcoder): create a virtual contest, add that ABC's problems, set 100 minutes.\n\nABC rounds are 100 minutes. Target: A, B, C accepted, D attempted for at least 30 minutes.",
          visual: schedule(["br", "b3"]),
        },
        {
          kind: "read",
          title: "During both contests",
          body:
            "Follow the in-contest routine and the [[stuck protocol]] from Chapter 10 (the contest playbook).\n\nWrite down the minute each problem was **accepted**. After each contest, write one line per unsolved problem:\n\n\"What was the key idea, and which clue should have pointed at it?\"",
        },
        {
          kind: "read",
          title: "Contest triage clues (1)",
          body: "Today's 15-second clues are for contests, where nobody tells you the topic.",
          callout: {
            type: "clue",
            text:
              "Problem A or B with n ≤ 100 → do not optimise; simulate or brute force.\n\n\"Print any\", \"or -1\" → constructive (Day 27): try small cases first.",
          },
        },
        {
          kind: "read",
          title: "Contest triage clues (2)",
          body: "Two clues that come from the numbers in the statement.",
          callout: {
            type: "clue",
            text:
              "n ≤ 2·10^5 with queries → [[prefix sums|prefix sum]], [[BIT|Fenwick tree (BIT)]], or sort + [[two pointers]]. Not O(n²).\n\n\"Modulo 998244353\" or \"modulo 10^9+7\" → counting: DP or nCr (Day 22).",
          },
        },
        {
          kind: "read",
          title: "Contest triage clues (3)",
          body: "And one clue about yourself, not the problem.",
          callout: {
            type: "clue",
            text: "Stuck 20 minutes on one letter with nothing new written → read the next letter.",
          },
        },
        {
          kind: "widget",
          widget: "triage",
          title: "Warm up the scan",
          task: "Run the scan on 5 cards. For each one, say n → budget out loud before you pick a pattern.",
          props: { mode: "cards", upToDay: 28 },
        },
        {
          kind: "read",
          title: "Block 4: tally the mistake journal",
          body:
            "Open your **[[mistake journal]]** (the Tracker page, `#tracker`). Its **Category** column says the kind of error. For the patch you need the **topic**.\n\nNext to every entry from Days 1 to 28, write the topic of that problem: sliding window, DP state design, BIT, graphs, and so on. Then count.",
          visual: schedule(["b4"]),
        },
        {
          kind: "read",
          title: "A journal with topics added",
          body: "Here is a small journal after you write a topic next to each entry. Same color, same topic.",
          visual: {
            kind: "array",
            rows: [
              {
                label: "topic",
                items: ["DP state", "sliding window", "BIT", "DP state", "graphs", "sliding window", "DP state"],
                tones: { 0: "accent", 1: "warn", 2: "neutral", 3: "accent", 4: "neutral", 5: "warn", 6: "accent" },
              },
            ],
            indices: true,
          },
        },
        {
          kind: "read",
          title: "The two biggest counts are today's targets",
          body:
            "Count each topic. The two topics with the most entries are today's targets, **even if they feel embarrassing**.\n\nIf one Category dominates (say \"edge case\" or \"Python TLE\"), note it too. It becomes a checklist line for every contest.",
          visual: {
            kind: "array",
            rows: [
              {
                label: "tally",
                items: ["DP state: 3", "sliding window: 2", "BIT: 1", "graphs: 1"],
                tones: { 0: "good", 1: "good" },
                ranges: [{ from: 0, to: 1, tone: "good", label: "patch these" }],
              },
            ],
          },
        },
        {
          kind: "read",
          title: "Block 5: the weak-topic patch",
          body:
            "For each of the two topics, do 3 problems, in this order:\n\n- one you already **failed**, re-solved from a blank file\n- one fresh medium from that topic's day in this course\n- one from a Codeforces filter on that tag at rating 1100 to 1300\n\n25 minutes per problem, hard stop. Then log both contests and add cards (block 6).",
          visual: schedule(["b5", "b6"]),
        },
        {
          kind: "quiz",
          teach: "Each weak topic gets 3 problems in a fixed order: an old failure from blank, a fresh medium from the topic's day, then a rated Codeforces problem on that tag.",
          prompt: "Your weakest topic is BIT. Which problem do you do first in the patch?",
          options: [
            "A Codeforces BIT problem at rating 1100 to 1300",
            "A BIT problem you already failed, re-solved from a blank file",
            "A fresh medium from Day 25",
            "The BIT template, typed 3 times",
          ],
          answer: 1,
          explain: "Start with the one you already failed, from blank. It shows whether the gap is still there before you spend time on fresh problems.",
        },
        {
          kind: "read",
          title: "The tally script, line by line",
          body:
            "Paste the topics you wrote (one per line), press Ctrl-D to end the input, and read the top two. Run it again on the Category column.\n\n- `Counter(...)` counts each distinct line.\n- `.strip().lower()` makes \"DP\" and \"dp \" the same topic.\n- `if line.strip()` skips blank lines.\n- `most_common()` gives the biggest counts first.\n\nMental test: input `dp`, `graphs`, `DP` prints `2  dp`, then `1  graphs`.",
          visual: { kind: "code", lang: "python", code: tallyCode },
        },
        {
          kind: "code",
          title: "Now type it yourself",
          prompt:
            "Write the tally script from memory. Read lines from `sys.stdin`, ignore blank lines, treat upper and lower case as the same, and print each topic with its count, biggest first: `count  topic`.",
          starter: "# read topics from stdin, one per line\n# count them (ignore case and blank lines)\n# print the biggest counts first\n",
          solution: tallyCode,
          tests: [
            { stdin: "dp\ngraphs\nDP\n", stdout: "2 dp\n1 graphs", label: "case is ignored" },
            { stdin: "sliding window\nDP state\nsliding window\nBIT\n", stdout: "2 sliding window\n1 dp state\n1 bit", label: "topics with spaces" },
            { stdin: "\n\ngraphs\n\n", stdout: "1 graphs", label: "blank lines" },
            { stdin: "bit\nbit\nbit\n", stdout: "3 bit", label: "all equal" },
          ],
          fromMemory: true,
          teach: "`Counter` from `collections` counts items in an iterable. `most_common()` returns (item, count) pairs, biggest count first.",
          explain: "One `Counter` over the cleaned lines does all the work. Ties keep the order in which each topic first appeared.",
        },
        {
          kind: "summary",
          points: [
            "Day 29 = upsolve Contest #4, a Codeforces virtual, a break, an AtCoder ABC virtual, then the patch.",
            "Div 3 if you solved A and B on Day 27, otherwise Div 4. Never a round you have opened.",
            "Virtuals are unrated with no hacks. No editorial, no AI, no other people's code until the end.",
            "Write the minute of each Accepted, and one line per unsolved problem: the key idea and the missed clue.",
            "Tally the journal by topic. The top two get 3 problems each, 25 minutes each, hard stop.",
            "Short on time? Drop the AtCoder virtual, never the patch.",
          ],
        },
      ],
    },

    /* ---------------- Day 29, lesson B ---------------- */
    {
      id: "ch08-l2",
      day: 29,
      title: "Day 29 drill: contest triage",
      goal: "Name the tool for five mixed contest problems, then run the Day 29 list and its checks.",
      minutes: 10,
      steps: [
        {
          kind: "read",
          title: "Day 29 in four lines",
          body:
            "Today in short:\n\n- Two full virtual contests, back to back, real time limits.\n- Div 3 if you solved A and B on Day 27, otherwise Div 4.\n- Tally the mistake journal by topic; patch the top two.\n- 3 problems per topic, 25 minutes each, hard stop.\n\nThis lesson: 5 disguised problems from across the month, today's problem list, and the end-of-day check.",
          visual: {
            kind: "compare",
            left: { title: "Contest half", points: ["Codeforces Div 3/4 virtual", "AtCoder ABC virtual, A to D", "Minute of each Accepted"] },
            right: { title: "Patch half", points: ["Tally journal by topic", "Top 2 topics", "3 problems each, 25 min"] },
          },
        },
        {
          kind: "quiz",
          teach: "Start every scan with n. A tiny n means the budget is huge, so trying everything may be fine.",
          prompt: "n ≤ 10. Print any arrangement of the numbers that satisfies three conditions.",
          options: ["Brute force all permutations", "Constructive: build it greedily from small cases", "Bitmask DP", "Sort + two pointers"],
          answer: 0,
          explain:
            "Signal: n ≤ 10. 10! is about 3.6 million arrangements, which is fine if the check is cheap. \"Print any\" often means constructive, but when n is this small, just try them all.",
        },
        {
          kind: "quiz",
          teach: "\"Minimum number of moves\" where every move costs the same is a shortest path with equal edge weights.",
          prompt: "A grid up to 1000 × 1000. Find the minimum number of moves from S to G.",
          options: ["DFS flood fill", "BFS on the grid", "Dijkstra with a heap", "2-D DP from the top-left"],
          answer: 1,
          explain:
            "Signal: \"minimum moves\" with every move costing 1. BFS reaches cells in order of distance. Dijkstra also works but is slower and not needed. A DP only works when you can move in just two directions.",
        },
        {
          kind: "read",
          title: "Notice the signal",
          body:
            "In both problems the size decided the answer first. n ≤ 10 allows every arrangement. A 1000 × 1000 grid has 10^6 cells, so each cell can be visited once, which is exactly what [[BFS|BFS (breadth-first search)]] does.\n\nKeep reading n before the story.",
        },
        {
          kind: "quiz",
          teach: "\"For each element, count earlier elements that are larger\" with n = 2·10^5 needs O(n log n). A structure that adds a value and counts a range of values does this.",
          prompt: "2·10^5 values. For each one, count the earlier values that are larger.",
          options: ["Monotonic stack", "BIT over compressed values", "Prefix sums over the array", "Sort + two pointers"],
          answer: 1,
          explain:
            "Signal: \"for each, count earlier ones that are larger\" + n = 2·10^5. Compress the values to ranks, then walk left to right: query the BIT for how many seen values are above this rank, then add this value.",
        },
        {
          kind: "quiz",
          teach: "\"Count ... modulo a prime\" points to counting by DP or by nCr. A local rule between neighbours is a DP over positions.",
          prompt: "Count sequences of length n ≤ 10^6 that follow a local rule, modulo 998244353.",
          options: ["nCr with factorial tables", "1-D DP with a mod", "Bitmask DP", "Brute force with pruning"],
          answer: 1,
          explain:
            "Signals: \"count\" + \"modulo 998244353\" + a rule between neighbours. dp[i] depends on the last few positions, so a 1-D DP, taking the mod at every step, runs in O(n).",
        },
        {
          kind: "read",
          title: "Notice the signal",
          body:
            "\"For each, count earlier ones\" with large n is a range-count problem: [[BIT|Fenwick tree (BIT)]] after [[compression|coordinate compression]].\n\n\"Count\" plus \"modulo\" is counting: [[DP|dynamic programming (DP)]] when there is a rule between neighbours, [[nCr]] when you choose positions.",
        },
        {
          kind: "quiz",
          teach: "When a yes/no check flips from \"no\" to \"yes\" once and stays \"yes\", you can search over the answer itself.",
          prompt: "Find the smallest x such that check(x) passes. check is monotone and runs in O(n).",
          options: ["Binary search on a sorted array", "Binary search on the answer", "Two pointers", "Greedy, try every x from 1"],
          answer: 1,
          explain:
            "Signal: \"smallest x such that\" + a monotone check. Binary search over x, calling check(mid) each time: O(n log range).",
        },
        {
          kind: "read",
          title: "Today's list",
          body:
            "Next is today's full list. The time boxes are hard stops. No AI. Write the minute of each Accepted during the two contests.\n\nAnything unfinished goes on your [[re-solve list|re-solve queue]].",
        },
        {
          kind: "practice",
          title: "Day 29 problems (in order)",
          intro:
            "Work top to bottom with the time boxes. No AI, no editorial during the contests. Move anything unfinished, especially the patch problems, to the re-solve list.",
          problems: [
            { ref: "Upsolve: first unsolved problem from Contest #4", tier: "core", lvl: "M/H", box: 45, clue: "what did the constraints say?" },
            { ref: "Codeforces Div 3/4 virtual, A–B", tier: "warm", lvl: "800–1000", box: 30, clue: "read carefully; implement exactly" },
            { ref: "Codeforces Div 3/4 virtual, C (Div 4: C–D)", tier: "core", lvl: "1100–1300", box: 90, clue: "constraints → complexity (the constraint table); box = rest of round" },
            { ref: "AtCoder ABC virtual, A–C", tier: "core", lvl: "—", box: 50, clue: "ABC C is often a clean pattern problem" },
            { ref: "AtCoder ABC virtual, D", tier: "stretch", lvl: "—", box: 50, clue: "usually a named technique: BFS, DP, binary search, prefix sums" },
            { ref: "Weak topic #1: 3 problems", tier: "core", lvl: "M", box: 75, clue: "the clue you keep missing (3 × 25 min)" },
            { ref: "Weak topic #2: 3 problems", tier: "core", lvl: "M", box: 75, clue: "same (3 × 25 min)" },
          ],
        },
        {
          kind: "reveal",
          prompt: "End-of-day check 1. In each virtual: which letter stopped you, and was the blocker the idea, the code, or the time?",
          answer:
            "Write one word per contest: idea, code or time. \"Idea\" means a missed clue, so make a card for it. \"Code\" means a template you can't yet write cleanly. \"Time\" means the early letters took too long; compare the minute A and B were accepted with your earlier contests.",
        },
        {
          kind: "reveal",
          prompt: "End-of-day check 2. What are your two weakest topics, and did the patch change how fast you recognise them?",
          answer:
            "Name the two topics from the tally. Then be honest: in the third patch problem, did you name the pattern faster than in the first? If not, those topics stay in your daily drill in month 2.",
        },
        {
          kind: "reveal",
          prompt: "End-of-day check 3. What will you do differently in the first 10 minutes of your next real contest?",
          answer:
            "One concrete change, written down. For example: \"read the constraints before the story\", \"PyPy checked before the start\", or \"no reading ahead past Q2\". Add it to your pre-contest checklist.",
        },
        {
          kind: "summary",
          points: [
            "Tiny n (≤ 10) → brute force, even when it says \"print any\".",
            "Minimum moves on a grid → BFS. Count earlier larger values → BIT over compressed values.",
            "Count + modulo with a local rule → 1-D DP. Smallest x with a monotone check → binary search on the answer.",
            "Log 1 mistake and add 3 cards: the Tracker (#tracker) for the log, the Gym (#gym) for the cards.",
          ],
        },
      ],
    },

    /* ---------------- Day 30, lesson A ---------------- */
    {
      id: "ch08-l3",
      day: 30,
      title: "Day 30: The final recognition exam",
      goal: "Take the 100-card exam, run four timed problems, compare Day 30 with Day 0, and choose month 2.",
      minutes: 12,
      steps: [
        {
          kind: "read",
          title: "Measure, then choose",
          body:
            "**Goal:** measure where you are with the same instruments as Day 0, write the numbers down, and choose month 2.\n\nSame instruments means the comparison is honest: a recognition test, and four timed problems on the same four topics as Day 0.",
          visual: {
            kind: "table",
            headers: ["Time", "Block"],
            rows: [
              ["0:00–0:30", "Final Recognition Exam"],
              ["0:30–2:00", "Four timed problems"],
              ["2:00–2:30", "Fill the progress table"],
              ["2:30–3:00", "Decide month 2"],
            ],
          },
        },
        {
          kind: "read",
          title: "Today's clue",
          body: "There is no new pattern to learn today.",
          callout: { type: "clue", text: "The exam is the drill. Before you start, re-read your 10 most-missed cards once. Nothing else." },
        },
        {
          kind: "read",
          title: "The Final Recognition Exam",
          body:
            "100 [[recognition cards|recognition card]] from the deck (Chapter 9). **On this site, run it on the Gym page (`#gym`) in test mode:** it deals 100 fresh cards and times each one.\n\nOn paper instead? Shuffle the full deck and take the first 100. Make sure at least 20 are **CP-only cards** (math, bits, range queries, strings, constructive). Swap in more if the shuffle gave fewer.",
        },
        {
          kind: "quiz",
          guess: true,
          prompt: "Take a guess. You name the right algorithm for a card, but it took you 19 seconds. Does the card count as correct?",
          options: ["Yes, the answer was right", "No, it was too slow", "Half a point"],
          answer: 1,
          explain:
            "No. A card counts only if the answer is right and came inside 15 seconds. The skill being measured is the 15-second reflex, not knowing the answer eventually.",
        },
        {
          kind: "read",
          title: "The protocol (1): the clock",
          body:
            "15 seconds per card. Read the statement, say the algorithm **out loud**, flip, mark.\n\nHere are five cards and how long each took.",
          visual: examCards(1),
        },
        {
          kind: "read",
          title: "The protocol (2): right or wrong",
          body: "Now add whether the answer you said was right. Card 4 was quick, but wrong.",
          visual: examCards(2),
        },
        {
          kind: "read",
          title: "The protocol (3): what counts",
          body:
            "A card counts only if it is right **and** inside 15 seconds. Card 3 was right at 19 seconds: a miss. \"I would have got it with more time\" is a miss.\n\n100 cards × 15 s ≈ 25 minutes, plus flipping.",
          visual: examCards(3),
        },
        {
          kind: "read",
          title: "Pass mark, and comparing fairly",
          body:
            "**Pass mark: 85 or more correct out of 100.** Also record the average seconds per card.\n\nDay 0 had 20 cards, so **compare percentages, not counts**. Worked example: Day 0 was 9 of 20, and 9 ÷ 20 = 45%. Day 30 is 86 of 100 = 86%. The gain is 86 − 45 = **41 percentage points**. Do the same for Tests #1 to #4.",
          visual: {
            kind: "stats",
            items: [
              { value: "45%", label: "Day 0", note: "9 of 20" },
              { value: "86%", label: "Day 30", note: "86 of 100" },
              { value: "+41", label: "points gained" },
            ],
          },
        },
        {
          kind: "number",
          teach: "Turn each score into a percentage first (correct ÷ cards × 100). Then subtract Day 0's percentage from Day 30's.",
          prompt: "Day 0: 7 of 20 cards correct. Day 30: 88 of 100. How many percentage points did you gain?",
          answer: 53,
          tolerance: 0.5,
          unit: "points",
          explain: "7 ÷ 20 = 35%. 88 ÷ 100 = 88%. 88 − 35 = 53 percentage points. Comparing counts (7 vs 88) would be meaningless, because the tests had different sizes.",
        },
        {
          kind: "read",
          title: "A paper self-timer",
          body:
            "If you run the exam on paper, this script times each card while you mark right or wrong.\n\n- Press Enter, read the card, answer aloud, press Enter again.\n- `time.monotonic()` measures the seconds between the two presses.\n- `if right and took <= 15` is the whole rule.\n\nMental test: right in 12 s counts; right in 19 s goes to `missed`; wrong in 6 s goes to `missed`.",
          visual: { kind: "code", lang: "python", code: timerCode },
        },
        {
          kind: "code",
          title: "Write the scoring rule",
          prompt:
            "Write `score(cards)`. Each card is a pair `(right, seconds)`. Return how many cards count: right **and** at most 15 seconds.",
          starter: "def score(cards):\n    pass\n",
          solution: "def score(cards):\n    correct = 0\n    for right, took in cards:\n        if right and took <= 15:\n            correct += 1\n    return correct\n",
          tests: [
            { call: "score([(True, 8), (True, 12), (True, 19), (False, 6), (True, 14)])", expect: "3", label: "the five cards" },
            { call: "score([(True, 15)])", expect: "1", label: "exactly 15 s counts" },
            { call: "score([(False, 3), (False, 4)])", expect: "0", label: "all wrong" },
            { call: "score([])", expect: "0", label: "empty" },
          ],
          teach: "Both conditions must hold. A slow right answer and a fast wrong answer are both misses.",
          explain: "One `if right and took <= 15` line. The same rule is in the self-timer above.",
        },
        {
          kind: "read",
          title: "Four timed problems",
          body:
            "Same format as the Day 0 baseline: two easy and two medium, a hard 25-minute [[box|time box]] each, timer on **before** you read.\n\nUse fresh problems you have never opened, from the same four topics as Day 0: linked list, 1-D DP, grid BFS/DFS, intervals. No notes, no AI.\n\nRecord what Day 0 recorded: solved or not, minutes taken, and whether you named the pattern in the first 60 seconds.",
        },
        {
          kind: "read",
          title: "The number that matters most",
          body:
            "The last one, naming the pattern in the first 60 seconds, matters most. On Day 0 it was probably 0 or 1 of 4.\n\nThe month's real product is that number going to 4.",
          callout: { type: "move", text: "Before you type anything, say the pattern out loud and note the time. That is the habit you trained for 30 days." },
        },
        {
          kind: "quiz",
          teach: "Day 30 uses the same instruments as Day 0 so the two columns can be compared.",
          prompt: "Why do the four timed problems use the same four topics as Day 0 (but fresh problems)?",
          options: [
            "Because those topics are the most common in contests",
            "So the Day 0 vs Day 30 comparison is fair",
            "So you can reuse your Day 0 code",
            "Because the other topics are too hard",
          ],
          answer: 1,
          explain: "Same topics, same box, same rules: then a change in solved count or minutes is you, not the test. Fresh problems stop memory from inflating the result.",
        },
        {
          kind: "read",
          title: "The progress table",
          body:
            "Fill the Day 30 column of the progress table on the Tracker page (`#tracker`):\n\n- recognition % and average seconds per card\n- timed problems solved, out of 4\n- total problems solved\n- LeetCode and Codeforces ratings\n- templates you can write from memory (of 12)\n- [[re-solve queue]] length\n\nThen put Day 0 and Day 30 side by side and write one sentence about each row.",
        },
        {
          kind: "read",
          title: "What success looks like (1)",
          body: "Realistic targets for Day 30. \"Below target means\" tells you what month 2 should fix.",
          visual: {
            kind: "table",
            headers: ["Measure", "Realistic target", "Strong month", "Below target means"],
            rows: [
              ["Recognition exam (100 cards, ≤ 15 s)", "≥ 85%", "≥ 92%", "keep the 15-minute daily gym in month 2"],
              ["4 timed problems (25 min each)", "3–4 of 4; pattern named in 60 s on at least 3", "4 of 4, each in < 15 min", "redo the weak weeks before new topics"],
              ["LeetCode Weekly", "Q1–Q2 every contest; Q3 about half the time", "Q3 most weeks; Q4 sometimes", "Q3 is the month 2 focus"],
              ["Codeforces Div 3", "A–C reliably; D sometimes", "A–D reliably", "more 1000–1300 problems by tag"],
            ],
          },
        },
        {
          kind: "read",
          title: "What success looks like (2)",
          body: "The rest of the table: ratings, AtCoder, and templates.",
          visual: {
            kind: "table",
            headers: ["Measure", "Realistic target", "Strong month", "Below target means"],
            rows: [
              ["Codeforces rating", "performs at about 1000–1300", "performs at 1400+", "normal for month 1; keep entering rounds"],
              ["AtCoder ABC", "A–C reliably; D about half the time", "A–D reliably", "ABC D is the month 2 target"],
              ["Templates from memory", "nCr, sieve, BIT, segment tree, KMP, Z, hash: each < 3 min, bug-free", "all of them < 2 min", "type the failed ones daily for a week"],
            ],
          },
        },
        {
          kind: "read",
          title: "Don't read your Codeforces number",
          body: "Your profile [[rating]] after a few rounds is not your level.",
          callout: {
            type: "mistake",
            text:
              "Reading the Codeforces number on your profile as your level. A new account's displayed rating starts at 0 and is boosted over the first 6 rated rounds (+500, +350, +250, +150, +100, +50), while changes are computed as if you started at 1400. After one or two rounds the shown number is low by design. Judge yourself by each round's **[[performance]]**, or by which letters you solve.",
          },
        },
        {
          kind: "quiz",
          teach: "A new Codeforces account's shown rating starts at 0 and gets bonuses over its first 6 rated rounds, so it is low by design early on.",
          prompt: "After two rated Codeforces rounds, your profile shows 780. What does that tell you?",
          options: [
            "Your level is about 780",
            "Little: the shown number is low by design; look at each round's performance",
            "You should stop entering rated rounds",
            "You should switch to Div 4 only",
          ],
          answer: 1,
          explain: "Two rounds in, the shown rating still lacks most of its +500, +350, ... bonuses. Each round's performance number, or the letters you solved, is the honest measure.",
        },
        {
          kind: "read",
          title: "Choose month 2",
          body:
            "Read Chapter 11 (the road beyond 30 days: the ladder, the \"better question\", and the month 2 template).\n\nThen use the **Below target means** column to choose month 2's **two** focus areas. Write the plan for the next 30 days in one paragraph before you close the course.",
        },
        {
          kind: "quiz",
          teach: "Each row of the table has a \"Below target means\" entry. Find the row you missed and read that entry.",
          prompt: "Your exam score is 79%. Everything else hit the realistic target. What does the table say month 2 should include?",
          options: [
            "Redo the weak weeks before new topics",
            "Keep the 15-minute daily gym in month 2",
            "Type the failed templates daily for a week",
            "More 1000–1300 problems by tag",
          ],
          answer: 1,
          explain: "79% is below the 85% target on the recognition row, whose fix is to keep the 15-minute daily gym going.",
        },
        {
          kind: "read",
          title: "What Day 30 does not mean",
          body:
            "You are not near top 200, and one month cannot get you there.\n\nWhat it does mean, if you hit the targets: you can read a problem, name the tool in 15 seconds most of the time, and write it in Python without help. That is the base everything in Chapter 11 is built on.",
        },
        {
          kind: "summary",
          points: [
            "Exam: 100 cards on the Gym page in test mode. A card counts only if right and within 15 seconds.",
            "Pass mark 85/100. Compare with Day 0 in percentages, and record seconds per card.",
            "Four fresh timed problems on Day 0's topics, 25 minutes each. Track \"pattern named in 60 s\".",
            "Fill the Day 30 column of the progress table and write one sentence per row.",
            "Ignore the early Codeforces profile number; it is low by design.",
            "Pick two month 2 focus areas from the \"Below target means\" column.",
          ],
        },
      ],
    },

    /* ---------------- Day 30, lesson B ---------------- */
    {
      id: "ch08-l4",
      day: 30,
      title: "Day 30 drill: the last checks",
      goal: "Name the tool for five CP-style problems, run the Day 30 list, and answer the final checks.",
      minutes: 10,
      steps: [
        {
          kind: "read",
          title: "Day 30 in four lines",
          body:
            "Today in short:\n\n- 100 cards, right **and** within 15 seconds, pass mark 85.\n- Four fresh timed problems, Day 0's topics, 25 minutes each.\n- Day 0 and Day 30 side by side in the progress table.\n- Two month 2 focus areas from the \"Below target means\" column.\n\nThis lesson: 5 last disguised problems (mostly CP toolkit), today's list, and the final checks.",
          visual: {
            kind: "stats",
            items: [
              { value: "85/100", label: "pass mark" },
              { value: "15 s", label: "per card" },
              { value: "4 × 25", label: "timed minutes" },
            ],
          },
        },
        {
          kind: "quiz",
          teach: "nCr modulo a prime is computed from factorials and their modular inverses. Building them once makes every query O(1).",
          prompt: "The answer is a count modulo a prime, and it needs \"n choose k\" for many different k.",
          options: ["Factorials + inverse factorials", "1-D DP with a mod", "Fast power for each query alone", "Sieve of Eratosthenes"],
          answer: 0,
          explain:
            "Signals: \"modulo a prime\" + \"n choose k for many k\". Build fact[] and inv_fact[] once in O(n); then nCr = fact[n] · inv_fact[k] · inv_fact[n−k], each in O(1).",
        },
        {
          kind: "quiz",
          teach: "Updates mixed with range queries need a tree structure. Sums work with a Fenwick tree; other operations such as min need the more general tree.",
          prompt: "2·10^5 updates and range-minimum queries.",
          options: ["Fenwick tree (BIT)", "Iterative segment tree", "Prefix sums", "Monotonic deque"],
          answer: 1,
          explain:
            "Signals: updates + range **min**. A BIT handles prefix sums, not range min with arbitrary updates. A segment tree does both in O(log n). Prefix sums break as soon as values change.",
        },
        {
          kind: "read",
          title: "Notice the signal",
          body:
            "\"Many k\" plus \"modulo\" ([[modular arithmetic]]) means precompute factorial tables once.\n\n\"Updates\" plus a range query: sums can use a [[BIT|Fenwick tree (BIT)]]; min or max needs a [[segment tree]].",
        },
        {
          kind: "quiz",
          teach: "Exact pattern matching in a long text is a string-matching job: build an array over pattern + separator + text and look for full-length matches.",
          prompt: "Find every position where a pattern occurs in a text of length 10^6.",
          options: ["Sliding window with a counter", "Prefix function (KMP) or Z on pattern + sep + text", "Binary search on the answer", "Compare at every start, character by character"],
          answer: 1,
          explain:
            "Signal: \"every occurrence\" in a 10^6 text. Compute the prefix function or Z array of `pattern + sep + text`; a value equal to len(pattern) marks a match. O(n + m), where comparing at every start can be O(n·m).",
        },
        {
          kind: "quiz",
          teach: "\"All pairs\" with n = 10^5 rules out a double loop. For XOR, each bit can be counted on its own.",
          prompt: "Sum of XOR over all pairs, n = 10^5.",
          options: ["Prefix XOR", "Per-bit counting", "Double loop over pairs", "Fenwick tree"],
          answer: 1,
          explain:
            "Signals: \"over all pairs\" + XOR + n = 10^5. For each bit b, with c ones and n − c zeros, that bit adds c · (n − c) · 2^b. O(n · bits).",
        },
        {
          kind: "read",
          title: "Notice the signal",
          body:
            "\"Every occurrence of a pattern\" is string matching: [[prefix function]] or [[Z|Z-function]].\n\n\"All pairs\" with n = 10^5 means you cannot touch each pair. With [[XOR]], split the work by bit ([[per-bit counting]]).",
        },
        {
          kind: "quiz",
          teach: "With all values positive, a window's sum only grows when you add on the right and only shrinks when you drop on the left.",
          prompt: "An array of 10^5 values, all positive. Find the longest subarray with sum ≤ k.",
          options: ["Prefix sum + hash map", "Sliding window", "Binary search on the answer", "Monotonic deque"],
          answer: 1,
          explain:
            "Signals: \"longest subarray\" + \"sum ≤ k\" + **all positive**. Grow the right end; while the sum is over k, move the left end. O(n). With negatives it would not work.",
        },
        {
          kind: "read",
          title: "Today's list",
          body:
            "Next is the full Day 30 list. The exam comes first, while you are fresh. Timers on before you read each timed problem. No notes, no AI.",
        },
        {
          kind: "practice",
          title: "Day 30 problems (in order)",
          intro:
            "Hard 25-minute boxes on the timed problems, timer on before you read. No notes, no AI. Record solved, minutes, and whether you named the pattern in 60 seconds. Unsolved ones go to the re-solve list.",
          problems: [
            { ref: "Final Recognition Exam: 100 cards", tier: "core", lvl: "—", box: 30, clue: "right and ≤ 15 s (Gym page, test mode)" },
            { ref: "Timed problem 1: linked list, unseen", tier: "warm", lvl: "E", box: 25, clue: "pattern named in first 60 s?" },
            { ref: "Timed problem 2: 1D DP, unseen", tier: "warm", lvl: "E", box: 25, clue: "same" },
            { ref: "Timed problem 3: grid BFS/DFS, unseen", tier: "core", lvl: "M", box: 25, clue: "same" },
            { ref: "Timed problem 4: intervals, unseen", tier: "core", lvl: "M", box: 25, clue: "same" },
            { ref: "Fill the Chapter 12 progress table", tier: "core", lvl: "—", box: 30, clue: "Day 0 vs Day 30, side by side" },
            { ref: "Month 2 decision (Chapter 11)", tier: "core", lvl: "—", box: 30, clue: "one-paragraph plan" },
          ],
        },
        {
          kind: "reveal",
          prompt: "End-of-day check 1. Recognition: Day 0 % → Day 30 %. Did you pass 85%?",
          answer:
            "Write both as percentages (Day 0 had 20 cards, Day 30 has 100). 85% or more is a pass. Below 85%, month 2 keeps the 15-minute daily gym.",
        },
        {
          kind: "reveal",
          prompt: "End-of-day check 2. Timed problems: Day 0 solved/minutes → Day 30 solved/minutes.",
          answer:
            "Write both lines, plus how many patterns you named in the first 60 seconds. The realistic target is 3 to 4 of 4, with the pattern named in 60 seconds on at least 3. Below that, redo the weak weeks before new topics.",
        },
        {
          kind: "reveal",
          prompt: "End-of-day check 3. Which Chapter 11 path did you choose, and what is the first thing you will do on Day 31?",
          answer:
            "Name the path and one concrete first task, with a time. For example: \"the 15-minute gym, then one Codeforces problem at my level + 200\". Vague plans don't start.",
        },
        {
          kind: "read",
          title: "Keep the habit",
          body: "Log 1 mistake and add 3 cards, like every day.\n\nThen keep going: tomorrow is not Day 31 of a plan you finished. It is **Day 1 of month 2**.",
        },
        {
          kind: "summary",
          points: [
            "Count modulo a prime with many nCr → factorials + inverse factorials.",
            "Updates + range min → segment tree. Every occurrence of a pattern → prefix function or Z.",
            "Sum of XOR over all pairs → per-bit counting. Longest subarray, sum ≤ k, all positive → sliding window.",
            "Log 1 mistake and add 3 cards: the Tracker (#tracker) and the Gym (#gym).",
            "Tomorrow is Day 1 of month 2.",
          ],
        },
      ],
    },
  ],
};

export default ch;
