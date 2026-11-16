import type { Chapter } from "./types";

const ch: Chapter = {
  n: 0,
  title: "The Honest Target",
  short: "Start here",
  part: 0,
  hook: "What a month of focused Python practice can do, what it cannot, and how this course works.",
  sources: [
    "Codeforces and LeetCode public rating APIs: global rank cutoffs at the time of writing",
    "Codeforces blog 151862, median time to reach each rank (2026): codeforces.com/blog/entry/151862",
    "USACO Guide, notes on Python speed: usaco.guide",
  ],
  lessons: [
    /* ------------------------------------------------------------------ */
    {
      id: "ch00-l1",
      title: "Why not top 200 in a month",
      goal: "Explain what a top 100–200 rank really takes, and why no 30-day plan can deliver it.",
      minutes: 8,
      steps: [
        {
          kind: "read",
          title: "The honest answer first",
          body: "Maybe you want to become a top 100–200 competitive programmer in one month, in Python, starting from weak data structures and algorithms and a habit of asking AI for help.\n\nThis lesson gives you the honest answer first, because the whole plan depends on it. Then the next lesson shows what 30 days **can** do. It is still a big change, and it is the one you actually need.",
        },
        {
          kind: "quiz",
          guess: true,
          prompt: "Among Codeforces users who reached the Expert rank (rating 1600), what was the median time it took them?",
          options: ["About 1 month", "About 4 months", "About 1.3 years", "About 5 years"],
          answer: 2,
          explain: "The median is about **1.3 years**, and that counts only the people who got there. Expert is still far below the top 200. The next steps show the full picture.",
        },
        {
          kind: "read",
          title: "What top 100–200 means",
          body: "A **rating** is a number that estimates your contest strength. These are the ratings of the people ranked #100 and #200 in the world, from the platforms' public data at the time of writing.\n\nOn [[Codeforces]], #200 sits around 2750. That is the International Grandmaster level, far above most strong programmers you will ever meet.",
          visual: {
            kind: "table",
            headers: ["Platform", "Global #100", "Global #200", "What that rating means"],
            rows: [
              ["Codeforces (active users)", "~2930", "~2750", "International Grandmaster"],
              ["LeetCode contest", "~3070", "~2930", "Far above Guardian (~2140)"],
              ["AtCoder (all users)", "~2980", "~2840", "Red / high orange"],
            ],
          },
        },
        {
          kind: "read",
          title: "How long people take",
          body: "Each [[Codeforces rank]] is a title tied to a rating range. The table shows the **median** time it took users to reach each rank.\n\nThese numbers count only people who got there. Everyone who gave up is missing, so the real numbers are worse. Top 200 is above Grandmaster, which takes a median of almost 3 years.",
          visual: {
            kind: "table",
            headers: ["Rank", "Rating", "Median time to reach it"],
            rows: [
              ["Pupil", "1200", "0.9 years"],
              ["Specialist", "1400", "1.1 years"],
              ["Expert", "1600", "1.3 years"],
              ["Candidate Master", "1900", "1.7 years"],
              ["Grandmaster", "2400", "2.9 years"],
            ],
            caption: "Source: Codeforces blog 151862.",
          },
        },
        {
          kind: "quiz",
          teach: "The first table lists the ratings at global rank #100 and #200. On Codeforces, #200 is at the International Grandmaster level.",
          prompt: "Roughly what Codeforces rating do you need to be in the global top 200?",
          options: ["About 1600", "About 1900", "About 2750", "About 4000"],
          answer: 2,
          explain: "About **2750**. 1600 is Expert and 1900 is Candidate Master. Both take a median of more than a year, and both are far below the top 200.",
        },
        {
          kind: "read",
          title: "LeetCode's rules for new accounts",
          body: "Even a perfect month cannot get there, because the rating systems move slowly on purpose.\n\nOn LeetCode, a new account's first 5 contests earn only percentile points, at most **+70** each. Your real rating starts at contest 6, starting from 1500 plus those points. So the most it can be is 1500 + 5 × 70 = **1850**.\n\nA month has about 6 contests. A perfect month ends around 1850–2000, about a thousand points short of the top 200.",
          visual: {
            kind: "stats",
            items: [
              { value: "5", label: "percentile-only contests", note: "at most +70 each" },
              { value: "1850", label: "highest possible start", note: "1500 + 5 × 70" },
              { value: "~6", label: "contests in a month" },
            ],
          },
        },
        {
          kind: "read",
          title: "Codeforces does the same",
          body: "On Codeforces, a new account takes **6 rated rounds** before the rating on your profile matches your real one. Until then it climbs through built-in bonuses.\n\nA month has about 6–8 rounds you can enter. So by Day 30 your profile rating has barely caught up with you, whatever your skill.",
        },
        {
          kind: "quiz",
          teach: "On LeetCode, the first 5 contests of a new account earn at most +70 each. The real rating starts at contest 6, from 1500 plus those points.",
          prompt: "A brand-new LeetCode account has a perfect month of about 6 contests. Where does its rating end up?",
          options: ["Around 1850–2000", "Around 2500", "Around 2930, top 200", "It depends only on skill, so anywhere"],
          answer: 0,
          explain: "Around **1850–2000**. The first 5 contests can add at most 5 × 70 = 350 to 1500, so contest 6 starts at 1850 or less. That is about a thousand points below the top 200.",
        },
        {
          kind: "read",
          title: "The cost of Python",
          body: "This course uses Python only. Know the cost.\n\nIn a recent Codeforces Div 4 round, [[PyPy]] submissions got [[TLE|TLE (Time Limit Exceeded)]] about **2.7 times** as often as C++ (15.8% vs 5.9%). The USACO Guide says Python is \"too slow to pass most Gold and Platinum problems.\"\n\nPython is fine up to about **1900** on Codeforces and at any level on LeetCode. At the very top it is a real handicap.",
          callout: { type: "trap", text: "TLE means your program ran past the time limit. In Python it can happen even when your idea is right, simply because Python is slower than C++." },
        },
        {
          kind: "read",
          title: "So: a multi-year goal",
          body: "Top 100–200 is not a 30-day goal. It is a **multi-year** goal. Chapter 11, Beyond Day 30, shows the real ladder in months and years.\n\nIf a plan promises it in a month, it is lying to you. Knowing this early protects you from feeling like a failure on Day 30 for missing a target nobody could hit.",
        },
        {
          kind: "summary",
          points: [
            "Top 200 means a rating of about 2750+ on Codeforces and about 2930+ on LeetCode.",
            "Median Codeforces users need 1.3 years for Expert and 2.9 years for Grandmaster.",
            "New-account rules cap a perfect LeetCode month at about 1850–2000, and Codeforces needs 6 rated rounds to settle.",
            "Python is fine up to about 1900 on Codeforces and at every level on LeetCode.",
            "Top 200 is a multi-year goal. The month has a different, realistic target.",
          ],
        },
      ],
    },

    /* ------------------------------------------------------------------ */
    {
      id: "ch00-l2",
      title: "What 30 days can do",
      goal: "Name the six realistic Day 30 targets and know how the month and this course are laid out.",
      minutes: 9,
      steps: [
        {
          kind: "read",
          title: "The change you actually need",
          body: "The month cannot make you top 200. It can still change a lot, and the change it makes is the one that matters most: you will **see a problem and name the right algorithm**, and you will **think through problems without AI**.\n\nHere are the six realistic Day 30 targets. The next steps explain each one.",
          visual: {
            kind: "table",
            headers: ["Goal", "Day 30 target"],
            rows: [
              ["See a problem, name the algorithm in 10–15 s", "≥ 85% correct on a 100-card mixed exam"],
              ["Think without AI", "Solve Medium problems alone"],
              ["LeetCode contests", "Q1–Q2 every time, Q3 about half the time"],
              ["Codeforces", "Div 3 A–C reliably, performing at ~1000–1300"],
              ["Templates", "12 core templates written from memory"],
              ["Volume", "150–180 problems, 4 live contests, 2–3 virtual contests"],
            ],
          },
        },
        {
          kind: "read",
          title: "Target 1: the 15-second reflex",
          body: "This is the **main goal** of the course. You read a problem and name the algorithm in 10–15 seconds. On Day 30 you aim for **85% or more** on a 100-card mixed exam.\n\nIt is realistic because it is a **memory skill**. Memory skills build fast with daily [[retrieval practice]] (answering from memory), mixed topics ([[interleaving]]) and [[spaced repetition]] (reviews at growing gaps). The Gym page trains exactly this.",
        },
        {
          kind: "read",
          title: "Target 2: think without AI",
          body: "By Day 30 you should solve **Medium** problems alone, using the thinking moves from Chapter 2.\n\nThirty days of the [[AI detox]] (Chapter 1: no AI while solving) is enough to bring the habit back. Being stuck for 20 minutes and pushing through is how the skill grows.",
        },
        {
          kind: "read",
          title: "Target 3 and 4: contests",
          body: "**LeetCode:** solve Q1 and Q2 every contest, and Q3 about half the time. That is roughly [[Knight (LeetCode)|Knight]]-level problem solving. The rating needs more contests to catch up.\n\n**Codeforces:** solve [[Div 3]] problems A to C reliably, with a contest [[performance]] around **1000–1300**. Pupil (1200) is a good month. Specialist (1400) is an excellent one. Your profile rating catches up only after 6 rated rounds.",
        },
        {
          kind: "read",
          title: "Target 5 and 6: templates and volume",
          body: "**Templates:** 12 core templates written from memory, such as BFS, union-find, Dijkstra and binary search on the answer. Typing them every day makes this mechanical.\n\n**Volume:** 150–180 problems, 4 live contests and 2–3 [[virtual contests|virtual contest]]. That is about 6 problems a day at 3 hours a day.",
          visual: {
            kind: "stats",
            items: [
              { value: "12", label: "templates from memory" },
              { value: "150–180", label: "problems", note: "about 6 a day" },
              { value: "4 + 2–3", label: "live + virtual contests" },
            ],
          },
        },
        {
          kind: "quiz",
          teach: "The month's targets are about recognition, solving without AI, early contest problems, templates and volume. Ratings move too slowly to be a 30-day target.",
          prompt: "Which of these is a realistic Day 30 target?",
          options: [
            "A Codeforces rating of 1900",
            "Solving LeetCode Q1 and Q2 in every contest",
            "Top 1000 in the world on LeetCode",
            "Solving every Hard problem without hints",
          ],
          answer: 1,
          explain: "**Q1 and Q2 every contest** (and Q3 about half the time) is the realistic LeetCode target. 1900 is Candidate Master, a median of 1.7 years. Top 1000 and every Hard are years away.",
        },
        {
          kind: "read",
          title: "Your 15-second answer is a hypothesis",
          body: "Recognising a pattern in 15 seconds works well on LeetCode and on easier contest problems: Codeforces [[Div 3]] and [[Div 4]], and AtCoder [[ABC]] problems A to D. That covers almost every interview question.\n\nHarder contest problems are written to defeat pattern matching. There you gather observations first (Chapter 2).",
          callout: { type: "move", text: "Treat your 15-second answer as a **hypothesis**. Then check it against the constraints and a small example before you code." },
        },
        {
          kind: "quiz",
          teach: "A fast pattern name is a guess, not a proof. Strong programmers test the guess quickly before writing code.",
          prompt: "You read a problem and think \"sliding window\" within 10 seconds. What should you do next?",
          options: [
            "Start coding the window right away",
            "Check the idea against the constraints and a small example",
            "Ask AI whether sliding window is right",
            "Read the editorial to confirm",
          ],
          answer: 1,
          explain: "Your 15-second answer is a **hypothesis**. Check it against the constraints and a tiny example first. It takes a minute and saves long debugging later.",
        },
        {
          kind: "read",
          title: "The month at a glance",
          body: "**Day 0** is setup and a baseline test. Then come four weeks, one topic a day. Every 7th day (Days 7, 14, 21 and 28) is a review and contest day. **Day 29** is a full mock contest, and **Day 30** is the final 15-second exam.",
          visual: {
            kind: "table",
            headers: ["Days", "Theme", "Last day of the week"],
            rows: [
              ["Day 0", "Setup + baseline test", "—"],
              ["Days 1–7", "Foundations: constraints, hashing, two pointers, window, prefix sums, stacks, binary search", "Contest #1"],
              ["Days 8–14", "Greedy, heaps, backtracking, trees, graphs, topological sort, DSU, Dijkstra", "Contest #2"],
              ["Days 15–21", "Dynamic programming (every main type)", "Contest #3"],
              ["Days 22–28", "Contest toolkit: math, primes, bits, Fenwick/segment tree, strings, constructive", "Contest #4"],
              ["Days 29–30", "Mock contests + final 100-card exam", "—"],
            ],
          },
        },
        {
          kind: "read",
          title: "The daily budget",
          body: "Each day is **3 focused hours**. Chapter 1 shows how the block is split: a recognition warm-up, learning the idea, time-boxed problems, then logging and re-solving.\n\nIf you have more time, add problems. Do not skip steps to go faster.",
        },
        {
          kind: "order",
          teach: "The month starts with setup and foundations, then core structures, then dynamic programming, then contest-only tools, and ends with mocks and the final exam.",
          prompt: "Put the parts of the month in order.",
          items: [
            "Setup + baseline test",
            "Foundations: two pointers, windows, prefix sums, binary search",
            "Greedy, heaps, trees and graphs",
            "Dynamic programming",
            "Contest toolkit: math, bits, range queries, strings",
            "Mock contests + final exam",
          ],
          explain: "Day 0 setup, then Week 1 foundations, Week 2 core structures, Week 3 DP, Week 4 the contest toolkit, and Days 29–30 for mocks and the final exam.",
        },
        {
          kind: "read",
          title: "This course stands alone",
          body: "Everything you need is here. The course gives you:\n\n- a **30-day schedule**, one topic a day, with problems in order and time boxes\n- **how to think** when nothing looks familiar (Chapter 2)\n- **Python for contests**: fast input, PyPy, recursion limits, stress testing (Chapter 3)\n- **contest-only topics**: modular math, sieves, bit tricks, Fenwick and segment trees, string hashing, constructive problems\n- a **recognition gym** with a 150-card deck, plus contests and trackers",
        },
        {
          kind: "read",
          title: "How to use it",
          body: "- **Day 0:** do Chapters 1–3, then the Day 0 setup and baseline at the start of Week 1.\n- **Each day:** open the Today page and follow the 3-hour block. Warm up in the Gym with cards only from days you have covered.\n- **Each contest day:** use Chapter 10, the contest playbook, and log the results in the Tracker.\n- **Day 30:** take the final exam, compare it with Day 0, then read Chapter 11 for what comes next.",
        },
        {
          kind: "summary",
          points: [
            "Main goal: name the algorithm in 10–15 seconds, at 85% or better on a 100-card exam.",
            "Also: solve Mediums without AI, LeetCode Q1–Q2 every contest, Codeforces Div 3 A–C, 12 templates from memory.",
            "Volume: 150–180 problems, 4 live and 2–3 virtual contests, at 3 hours a day.",
            "A 15-second answer is a hypothesis. Check it against the constraints and a small example.",
            "Day 0 setup, four weekly blocks with a contest every 7th day, then a mock on Day 29 and the final exam on Day 30.",
          ],
        },
      ],
    },
  ],
};

export default ch;
