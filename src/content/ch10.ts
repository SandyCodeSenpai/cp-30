import type { Chapter, Visual } from "./types";

/* Starting a Codeforces virtual contest, revealed message by message. */
const cfVirtual = (upTo: number): Visual => ({
  kind: "sequence",
  spec: {
    actors: [
      { id: "you", label: "You", kind: "viewer" },
      { id: "cf", label: "Codeforces", kind: "service" },
    ],
    messages: [
      { from: "you", to: "cf", label: "Open codeforces.com/contests" },
      { from: "cf", to: "you", label: "List of past contests" },
      { from: "you", to: "cf", label: "Pick a Div. 3 or Div. 4 never seen" },
      { from: "you", to: "cf", label: "Virtual participation: start now" },
      { from: "cf", to: "you", label: "Round opens with its own timer", tone: "accent" },
      { from: "you", to: "cf", label: "Submit normally" },
      { from: "cf", to: "you", label: "Standings as if you were there", tone: "good" },
    ],
    upTo,
  },
});

/* The six steps for every problem, as a snake. */
const sixSteps = (focus?: string[]): Visual => ({
  kind: "flow",
  spec: {
    nodes: [
      { id: "s1", label: "1. Read", sub: "statement, then constraints", col: 0, row: 0 },
      { id: "s2", label: "2. Scan", sub: "15 seconds, clue comment", col: 1, row: 0 },
      { id: "s3", label: "3. Break it", sub: "2 minutes", col: 2, row: 0 },
      { id: "s4", label: "4. Code", col: 2, row: 1 },
      { id: "s5", label: "5. Test", sub: "samples + 2 edge cases", col: 1, row: 1 },
      { id: "s6", label: "6. Submit", col: 0, row: 1, tone: "good" },
    ],
    edges: [
      { from: "s1", to: "s2" },
      { from: "s2", to: "s3" },
      { from: "s3", to: "s4" },
      { from: "s4", to: "s5" },
      { from: "s5", to: "s6" },
    ],
    focus,
  },
  caption: "The same six steps on every problem",
});

/* The in-contest stuck protocol. */
const stuck = (focus?: string[]): Visual => ({
  kind: "flow",
  spec: {
    nodes: [
      { id: "r1", label: "1. Re-read", sub: "word by word + sample", col: 0, row: 0 },
      { id: "r2", label: "2. Re-scan", sub: "out loud", col: 1, row: 0 },
      { id: "r3", label: "3. Brute force", sub: "one sentence", col: 2, row: 0 },
      { id: "r4", label: "4. Small cases", sub: "n = 1, 2, 3, 4", col: 2, row: 1 },
      { id: "r5", label: "5. One flip", sub: "sort, reverse, ...", col: 1, row: 1 },
      { id: "r6", label: "6. Move on", sub: "note, next problem", col: 0, row: 1, tone: "warn" },
    ],
    edges: [
      { from: "r1", to: "r2" },
      { from: "r2", to: "r3" },
      { from: "r3", to: "r4" },
      { from: "r4", to: "r5" },
      { from: "r5", to: "r6" },
    ],
    focus,
  },
  caption: "About 5 minutes in total",
});

/* A first LeetCode Weekly, as a flip book over the four problems. */
const weekly = (at: number, clock: string, tones: Record<number, "good" | "bad" | "warn" | "accent" | "neutral">, caption: string): Visual => ({
  kind: "array",
  rows: [{ label: "contest", items: ["Q1", "Q2", "Q3", "Q4"], pointers: [{ at, label: clock, tone: "accent" }], tones }],
  caption,
});

/* The 45-minute upsolve, as a flip book over its four blocks. */
const upsolve = (at: number, caption: string): Visual => ({
  kind: "array",
  rows: [
    {
      label: "minutes",
      items: ["0–5", "5–25", "25–35", "35–45"],
      pointers: [{ at, label: "now", tone: "accent" }],
      tones: Object.fromEntries(Array.from({ length: at }, (_, i) => [i, "good" as const])),
    },
  ],
  caption,
});

const fastIoCode =
  "import sys\n\ndef main():\n    data = sys.stdin.read().split()\n    n = int(data[0])\n    out = []\n    total = 0\n    for i in range(1, n + 1):\n        total += int(data[i])\n        out.append(total)\n    print(\"\\n\".join(map(str, out)))\n\nmain()\n";

const ch: Chapter = {
  n: 10,
  title: "The Contest Playbook",
  short: "Contests",
  part: 6,
  hook: "Which contests, the in-contest routine, the stuck protocol and upsolving.",
  sources: [
    "Codeforces: AI use rules for rated rounds, codeforces.com/blog/entry/133941",
    "LeetCode: contest rules, leetcode.com/discuss/post/951105/",
    "AtCoder: rules on generative AI, info.atcoder.jp/entry/llm-rules-en",
    "The +200 practice rule, codeforces.com/blog/entry/79521",
    "CP-31 sheet (TLE Eliminators), tle-eliminators.com/cp-sheet",
    "C2-Ladders, codeforces.com/blog/entry/100513",
    "CSES Problem Set, cses.fi/problemset",
    "AtCoder Problems, kenkoooo.com/atcoder",
    "NeetCode practice lists, neetcode.io/practice",
    "USACO Guide, usaco.guide",
    "Bastani et al., PNAS 2025 (unrestricted GPT access and exam scores)",
    "Lehmann et al., 2024 (asking AI for solutions and learning)",
  ],
  lessons: [
    /* ---------------- Lesson 1 ---------------- */
    {
      id: "ch10-l1",
      title: "Why contests, and which ones",
      goal: "Know which contests this plan uses, the honest target for each, and how the three platforms differ.",
      minutes: 9,
      steps: [
        {
          kind: "read",
          title: "Nobody tells you the topic",
          body:
            "A contest is the only place where nobody tells you the topic. It tests three things at once: the 15-second reflex (Chapter 9), your Python speed (Chapter 3), and your nerves.\n\nThis chapter covers which contests to take, the routine inside one, what to do when stuck, how to [[upsolve]], and how to read your [[rating]] (mostly: don't).",
        },
        {
          kind: "quiz",
          guess: true,
          prompt: "Take a guess. What trains your contest speed best?",
          options: ["More untimed practice problems", "Taking contests", "Reading editorials"],
          answer: 1,
          explain:
            "Contests. Solving and speed are different skills. Untimed problems build solving; only the clock builds speed.",
        },
        {
          kind: "read",
          title: "Two skills, not one",
          body:
            "Um_nik, one of the strongest competitors on Codeforces, says **solving** and **speed** are \"very different and almost independent\" skills.\n\nYou train solving on untimed problems, and speed in contests. This plan does both: the daily blocks are for solving, and the contest days (Days 7, 14, 21, 28) are for speed.",
          visual: {
            kind: "compare",
            left: { title: "Solving", points: ["Untimed problems", "The daily 3-hour block", "Ideas and templates"] },
            right: { title: "Speed", points: ["Contests and virtuals", "Contest days 7, 14, 21, 28", "Nerves and the clock"] },
          },
        },
        {
          kind: "read",
          title: "The contest calendar: the four Weeklies",
          body:
            "Four live **LeetCode Weekly** contests, one per contest day. The targets are honest, not hopeful.",
          visual: {
            kind: "table",
            headers: ["#", "Day", "Contest", "Honest target"],
            rows: [
              ["1", "D7", "LeetCode Weekly", "Q1 + Q2. Q3 is a bonus"],
              ["2", "D14", "LeetCode Weekly", "Q1 + Q2 faster than Contest #1; real attempt at Q3"],
              ["3", "D21", "LeetCode Weekly", "Q1 + Q2; Q3 if it's DP you can state"],
              ["4", "D28", "LeetCode Weekly", "Q1–Q2 every time, Q3 on a good day"],
            ],
          },
        },
        {
          kind: "read",
          title: "The contest calendar: three virtuals",
          body:
            "Three **[[virtual contests|virtual contest]]** (past rounds replayed with their real timer) on Codeforces and AtCoder near the end of the month.",
          visual: {
            kind: "table",
            headers: ["#", "Day", "Contest", "Honest target"],
            rows: [
              ["V1", "D27", "Codeforces Div 3 virtual (90-minute cap)", "A + B, attempt C"],
              ["V2", "D29", "Codeforces Div 3 or Div 4 virtual", "Div 3: A–B (+C). Div 4: A–D"],
              ["V3", "D29", "AtCoder ABC virtual", "A–C, D attempted for 30+ min"],
            ],
          },
        },
        {
          kind: "quiz",
          teach: "Each contest in the calendar has an honest target. Contest #3 falls in the DP week.",
          prompt: "Contest #3 on Day 21. What is the honest target?",
          options: ["All four problems", "Q1 + Q2; Q3 if it's DP you can state", "Q1 only", "Q3 and Q4, skip the easy ones"],
          answer: 1,
          explain: "Day 21 ends the DP week, so Q3 is in reach only if it is a DP whose state you can write down. Q1 + Q2 is the floor.",
        },
        {
          kind: "read",
          title: "Start times",
          body:
            "LeetCode Weekly runs once a week, on the weekend: evening in US time zones, morning in UTC.\n\nDon't trust any time written in a book. **Check leetcode.com/contest for the exact start in your time zone**, and register earlier that day.",
        },
        {
          kind: "read",
          title: "Optional: LeetCode Biweekly",
          body:
            "The **Biweekly** runs every other week, at a different hour from the Weekly. Check the same page.\n\nTake it only if it doesn't eat the review block of a contest day or the next day's upsolve.",
          callout: { type: "move", text: "One extra contest is worth less than one proper upsolve." },
        },
        {
          kind: "read",
          title: "Optional: live Codeforces and AtCoder",
          body:
            "Codeforces [[Div 3]] and [[Div 4]] rounds come every few weeks, on varying days (codeforces.com/contests). AtCoder ABC usually runs on the weekend at a Japan-friendly hour (atcoder.jp/contests).\n\nIf a live Div 3 or Div 4 fits your day, you may take it **in place of that day's stretch problems**. Never in place of the day's topic.",
        },
        {
          kind: "quiz",
          teach: "A live round may replace one part of a normal day, but never the part that teaches the day's topic.",
          prompt: "A live Codeforces Div 3 falls on Day 17. What may it replace?",
          options: ["The whole day", "Day 17's stretch problems", "Day 17's topic and template", "The next day's upsolve"],
          answer: 1,
          explain: "Only the stretch problems. The topic (knapsack on Day 17) still gets learned and typed from memory.",
        },
        {
          kind: "read",
          title: "The three platforms (1)",
          body: "Each platform has its own length and problem count.",
          visual: {
            kind: "table",
            headers: ["", "LeetCode Weekly", "Codeforces Div 3 / Div 4", "AtCoder ABC"],
            rows: [
              ["Length", "90 min", "About 2–2.5 hours (shown on the contest page)", "100 min"],
              ["Problems", "4, roughly Easy, Medium, Medium, Hard", "About 7–8, sorted from easiest. Div 4 is easier than Div 3", "7 or so, sorted. Your target is A–D"],
            ],
          },
        },
        {
          kind: "read",
          title: "The three platforms (2)",
          body:
            "They also differ in Python, penalties, and what happens after the round. **[[Hacking|hack]]** means other contestants try to break your accepted code with new tests.",
          visual: {
            kind: "table",
            headers: ["", "LeetCode Weekly", "Codeforces Div 3 / Div 4", "AtCoder ABC"],
            rows: [
              ["Python", "Python3 is CPython, no PyPy", "Choose PyPy 3 64-bit on every submit", "Choose the PyPy option"],
              ["Wrong submission", "5-minute penalty each", "10-minute penalty per wrong attempt on a problem you later solve", "5-minute penalty each"],
              ["After the round", "Final at once", "12 hours of open hacking, then system tests, then rating", "Final at once"],
            ],
          },
          callout: { type: "trap", text: "LeetCode runs [[CPython]] (about 10^7 simple operations per second). Codeforces and AtCoder let you pick [[PyPy]] (about 10^8). Pick it every time." },
        },
        {
          kind: "match",
          teach: "LeetCode only offers CPython. Codeforces and AtCoder both let you choose PyPy on each submit.",
          prompt: "Match each platform to the Python you submit with.",
          pairs: [
            ["LeetCode Weekly", "Python3 (CPython), no PyPy"],
            ["Codeforces", "PyPy 3 64-bit"],
            ["AtCoder", "The PyPy option"],
          ],
          explain: "On Codeforces and AtCoder, plain Python 3 is the most common cause of a Python TLE. On LeetCode there is no choice.",
        },
        {
          kind: "summary",
          points: [
            "Solving and speed are separate skills: daily blocks train solving, contests train speed.",
            "Four LeetCode Weeklies (Days 7, 14, 21, 28) and three virtuals (Days 27 and 29).",
            "Check the start time on leetcode.com/contest; never trust a time in a book.",
            "Biweekly and live rounds are optional and never replace an upsolve or the day's topic.",
            "LeetCode = 90 min, 4 problems, CPython. Codeforces = 2–2.5 h, PyPy. AtCoder ABC = 100 min, PyPy.",
          ],
        },
      ],
    },

    /* ---------------- Lesson 2 ---------------- */
    {
      id: "ch10-l2",
      title: "Virtual contests, AI rules and the checklist",
      goal: "Start a virtual contest on any platform, know the AI rules, and run the 15-minute pre-contest checklist.",
      minutes: 9,
      steps: [
        {
          kind: "read",
          title: "A virtual contest is a live one",
          body:
            "A **[[virtual contest]]** replays a past round under real time limits. Treat it as live: one sitting, timer on, no [[editorial]], no AI, no other people's code, phone in another room.\n\nAlways pick a round **you have never opened**, from the last 12 months. Older rounds have a different style.",
        },
        {
          kind: "read",
          title: "Codeforces (1)",
          body:
            "Go to codeforces.com/contests and scroll to past contests. Pick a \"Div. 3\" or \"Div. 4\" round you have never seen. Click **Virtual participation** in that round's row, choose to start now, and confirm.",
          visual: cfVirtual(3),
        },
        {
          kind: "read",
          title: "Codeforces (2)",
          body:
            "The round opens with its own timer. Submit normally. Your place in the standings is shown as if you had been there.\n\nVirtual rounds are **unrated** and have no hacks. Write the minute of each Accepted in the contest log (the Tracker page, `#tracker`).",
          visual: cfVirtual(6),
        },
        {
          kind: "order",
          teach: "First find an unseen round in the past-contest list, then join it from its row, then the timer starts and you submit.",
          prompt: "Put the Codeforces virtual contest steps in order.",
          items: [
            "Go to codeforces.com/contests, scroll to past contests",
            "Pick a Div. 3 or Div. 4 round you have never seen",
            "Click Virtual participation, start now, confirm",
            "Solve and submit under the round's own timer",
            "Write the minute of each Accepted in the contest log",
          ],
          explain: "Find, join, solve, log. The log entry is what turns a virtual into data you can compare later.",
        },
        {
          kind: "read",
          title: "AtCoder",
          body:
            "On atcoder.jp, open a past **AtCoder Beginner Contest (ABC)** you have never seen and use its **Virtual Participation** option.\n\nCan't find it? Use AtCoder Problems (kenkoooo.com/atcoder): create a virtual contest, add that ABC's problems, and set 100 minutes.\n\nChoose the PyPy language option on each submit.",
        },
        {
          kind: "read",
          title: "LeetCode",
          body:
            "Open leetcode.com/contest and pick a past Weekly from the list. Start it as a **virtual contest**. It runs for 90 minutes with a virtual ranking.\n\nUse a LeetCode virtual if you miss a live Weekly. Same day, same rules.",
        },
        {
          kind: "quiz",
          teach: "LeetCode lets you replay a past Weekly as a virtual contest with the same 90-minute limit.",
          prompt: "You miss the live Weekly on Day 14. What do you do?",
          options: [
            "Skip it and add more practice problems",
            "Run a past Weekly as a LeetCode virtual, same day, same rules",
            "Wait for next week's Weekly",
            "Read last week's editorials instead",
          ],
          answer: 1,
          explain: "A LeetCode virtual replaces the missed Weekly: same day, 90 minutes, no AI, no editorial.",
        },
        {
          kind: "read",
          title: "AI rules on each platform",
          body:
            "All three platforms ban AI help during rated contests. Rule 1 of this course (no AI, the [[AI detox]]) applies to virtuals and practice too.",
          visual: {
            kind: "table",
            headers: ["Platform", "Rule"],
            rows: [
              ["Codeforces", "Since September 2024, AI tools that do the reasoning are banned in rated rounds. Minor code completion and translating the statement are allowed."],
              ["LeetCode", "Code-generation tools and any outside help are prohibited in contests."],
              ["AtCoder", "Generative AI is banned during contests, including Copilot-style completion. Translation is allowed."],
            ],
          },
        },
        {
          kind: "read",
          title: "Why this matters for you",
          body:
            "In Bastani et al. (PNAS 2025), students with unrestricted GPT scored 48% **higher** on practice problems and 17% **lower** on the exam. In Lehmann et al. (2024), students who asked AI for solutions learned less.\n\nYour contest score is your exam. Turn off editor autocomplete too.",
          callout: { type: "mistake", text: "Leaving autocomplete on \"just for syntax\". An autocomplete that finishes your BFS is doing the reasoning." },
        },
        {
          kind: "quiz",
          teach: "AtCoder bans generative AI during contests, including Copilot-style completion. It names one thing that is still allowed.",
          prompt: "Which of these is allowed during an AtCoder contest?",
          options: ["Copilot-style code completion", "Translating the statement", "Asking a chatbot for a hint", "Pasting the statement into an AI"],
          answer: 1,
          explain: "Translation is allowed. Copilot-style completion is banned on AtCoder, even though Codeforces allows minor completion.",
        },
        {
          kind: "read",
          title: "Checklist (1): the setup",
          body:
            "Do this **15 minutes before the start**. Most \"bad contest\" stories begin with a setup problem, not an algorithm problem.\n\n- **AI off.** Close every AI tab. Disable Copilot, Cursor Tab, any completion.\n- **Template open.** Codeforces and AtCoder: `template.py` with [[fast input|fast I/O]], `main()`, output joined once. LeetCode: an empty scratch file.\n- **Language checked.** PyPy 3 64-bit, the AtCoder PyPy option, or Python3. New platform? One throwaway submission earlier in the week.\n- **[[Stress-test|stress testing]] files** for Codeforces: `brute.py`, `gen.py`, the compare loop.",
        },
        {
          kind: "read",
          title: "Checklist (2): you",
          body:
            "- **Paper and pen** for drawing small cases.\n- **Registered** (LeetCode and live Codeforces rounds need it).\n- **Warm-up: 10 [[recognition cards|recognition card]].** No new topics today; you won't learn anything useful in the last hour.\n- **Body:** eaten, water on the desk, the full contest length blocked, phone in another room.\n- **Contest log row** open on the Tracker page.",
        },
        {
          kind: "widget",
          widget: "triage",
          title: "The pre-contest warm-up",
          task: "Do the warm-up now: run the scan on 10 cards. Say n → budget first on each one.",
          props: { mode: "cards" },
        },
        {
          kind: "multi",
          teach: "The checklist covers setup (AI off, template, language, stress files) and you (paper, registration, 10 cards, body, log). It adds nothing new to learn.",
          prompt: "Which belong in the 15 minutes before a Codeforces round? Select all that apply.",
          options: [
            "Check PyPy 3 64-bit is selected",
            "Learn one new topic that might come up",
            "Warm up with 10 recognition cards",
            "Close every AI tab and disable completion",
            "Open brute.py and gen.py for stress testing",
          ],
          answers: [0, 2, 3, 4],
          explain: "Everything except the new topic. In the last hour you won't learn anything useful, and it only fills your head.",
        },
        {
          kind: "summary",
          points: [
            "Virtual = a past round, live rules: one sitting, timer, no editorial, no AI, no other code.",
            "Codeforces: Virtual participation. AtCoder: Virtual Participation or AtCoder Problems. LeetCode: virtual contest.",
            "All three ban AI in contests; this course bans it in virtuals and practice too.",
            "Turn off autocomplete: if it finishes your BFS, it did the reasoning.",
            "15 minutes before: AI off, template, language, stress files, paper, registered, 10 cards, body, log row.",
          ],
        },
      ],
    },

    /* ---------------- Lesson 3 ---------------- */
    {
      id: "ch10-l3",
      title: "Inside the contest: the routine",
      goal: "Work problems in order, run the same six steps on each, and use time boxes as alarms.",
      minutes: 11,
      steps: [
        {
          kind: "read",
          title: "A routine beats nerves",
          body:
            "Under a clock, people skip steps. A fixed **routine** (the same moves, in the same order, every time) protects you from that.\n\nBy the end of this lesson you will know which problem to open first, the six steps for every problem, and when a time box should make you stop and check.",
        },
        {
          kind: "read",
          title: "Go in order",
          body:
            "For a beginner the clear rule is: **solve in order**, Q1 → Q2 → Q3, or A → B → C.\n\nDo not spend the first 5 minutes reading every problem.",
        },
        {
          kind: "read",
          title: "Why in order",
          body:
            "- On all three platforms, problems are sorted roughly by difficulty. The first ones are the fastest points you will get.\n- Reading Q4 at minute 0 costs minutes, fills your head with a problem you probably can't solve yet, and hurts your nerve.\n- Strong competitors read everything first because they can solve most of the set. You aren't there yet.",
        },
        {
          kind: "read",
          title: "The exceptions",
          body:
            "**Codeforces:** the standings show how many people solved each problem. When you're stuck, switch to the unsolved problem with the **most solves**. That count is a better difficulty signal than the letter.\n\n**LeetCode:** stay on Q3 rather than jumping to Q4. Q4 is usually a Hard, and at your level switching rarely pays.",
        },
        {
          kind: "quiz",
          teach: "On Codeforces, the number of people who solved a problem is a better difficulty signal than its letter.",
          prompt: "Codeforces Div 3. You're stuck on C. D has 1200 solves so far, E has 2500. Where do you go?",
          options: ["D, because it comes next", "E, because more people solved it", "Back to B to re-check it", "Stay on C until the end"],
          answer: 1,
          explain: "More solves means easier for this crowd. E with 2500 solves is likely easier than D with 1200.",
        },
        {
          kind: "read",
          title: "Step 1: read the whole statement, then the constraints",
          body:
            "Every problem gets the same six steps. The first: read the **whole** statement, then the constraints.\n\nMisreading is the cheapest mistake to avoid and one of the most common.",
          visual: sixSteps(["s1"]),
        },
        {
          kind: "read",
          title: "Step 2: the 15-second scan",
          body:
            "Run the **[[15-second scan]]** (Chapter 9): n → budget, what it wants back, the input shape, the trigger phrase.\n\nThen write a 3-line **clue comment** at the top of your file: the signals you saw and the pattern they point to.",
          visual: sixSteps(["s2"]),
        },
        {
          kind: "read",
          title: "Step 3: try to break your guess",
          body:
            "Spend **2 minutes** trying to break your guess before you code it.\n\n- Does the [[complexity|time complexity]] fit the constraint table?\n- Does it give the right answer on the sample, worked by hand?",
          visual: sixSteps(["s3"]),
        },
        {
          kind: "read",
          title: "Steps 4 to 6: code, test, submit",
          body:
            "Code it. Then **test before you submit**: the samples, plus 2 [[edge cases|edge case]] of your own: n = 1, all values equal, the largest values, the \"−1 / impossible\" case.\n\nOnly then submit.",
          visual: sixSteps(["s4", "s5", "s6"]),
        },
        {
          kind: "widget",
          widget: "triage",
          title: "Step 2 in practice",
          task: "Run all four questions of the scan on one problem. Watch how each answer shrinks the list of candidate patterns.",
          props: { mode: "scan" },
        },
        {
          kind: "order",
          teach: "Reading comes first and submitting last. The 2-minute check sits between the scan and the code; testing sits between the code and the submit.",
          prompt: "Put the six steps for every problem in order.",
          items: [
            "Read the whole statement, then the constraints",
            "Run the 15-second scan and write the clue comment",
            "Spend 2 minutes trying to break your guess",
            "Code it",
            "Test: samples plus 2 edge cases",
            "Submit",
          ],
          explain: "Read, scan, break it, code, test, submit. Steps 3 and 5 are the ones people skip under pressure.",
        },
        {
          kind: "read",
          title: "Time boxes",
          body: "Each problem gets a **[[time box]]**: a time by which you expect to be done.",
          visual: {
            kind: "table",
            headers: ["Contest", "Box per problem"],
            rows: [
              ["LeetCode Weekly, 90 min", "Q1 done by 0:10 · Q2 by 0:30 · Q3 by 1:05 · Q4 only if Q3 is done (clock from the contest start)"],
              ["Codeforces Div 3", "A ≤ 10 min · B ≤ 20 · C ≤ 35 · D ≤ 45 (each counted from when you start it)"],
              ["Codeforces Div 4", "Same boxes, shifted one letter later: A and B ≤ 10 each, C ≤ 20, D ≤ 35"],
              ["AtCoder ABC, 100 min", "A ≤ 5 · B ≤ 10 · C ≤ 25 · D for the rest"],
            ],
          },
        },
        {
          kind: "read",
          title: "Alarms, not hard stops",
          body:
            "When a box rings, ask one question: **\"Have I had a new idea in the last 10 minutes?\"**\n\n- Yes → keep going.\n- No → run the [[stuck protocol]] (next lesson).",
        },
        {
          kind: "quiz",
          teach: "A time box is an alarm. When it rings, the test is whether the last 10 minutes produced a new idea.",
          prompt: "LeetCode Weekly. It's 1:05 and Q3 isn't done, but you found a new idea 4 minutes ago. What now?",
          options: ["Stop and open Q4", "Keep going on Q3", "Submit whatever you have", "Restart Q3 from scratch"],
          answer: 1,
          explain: "The box rang, but you had a new idea in the last 10 minutes, so you keep going. Only \"no new idea\" sends you to the stuck protocol.",
        },
        {
          kind: "read",
          title: "A good first Weekly (1)",
          body:
            "Here is a realistic 90 minutes for Contest #1, as a picture to aim at.\n\n**0:00–0:02** Open Q1. Statement, then constraints. Scan: \"n ≤ 100, count pairs → just loop.\"\n\n**0:02–0:08** Code, run the sample, check n = 1, submit. Accepted.",
          visual: weekly(0, "0:08", { 0: "good" }, "Q1 accepted at 0:08"),
        },
        {
          kind: "read",
          title: "A good first Weekly (2)",
          body:
            "**0:08–0:12** Open Q2. Scan: \"n ≤ 10^5, subarray, sum exactly k, negatives → prefix sum + map.\" Write the clue comment.\n\n**0:12–0:14** Two-minute break-it check: O(n) fits; the sample works by hand.",
          visual: weekly(1, "0:14", { 0: "good", 1: "accent" }, "Q2: scan done, guess checked"),
        },
        {
          kind: "read",
          title: "A good first Weekly (3)",
          body:
            "**0:14–0:30** Code, test the sample and an all-negative case, submit. **[[Wrong Answer|WA (Wrong Answer)]].** Re-read: you counted the empty prefix wrong. Fix, submit. Accepted, with a 5-minute penalty.",
          visual: weekly(1, "0:30", { 0: "good", 1: "good" }, "Q2 accepted at 0:30 (1 wrong submission)"),
        },
        {
          kind: "read",
          title: "A good first Weekly (4)",
          body:
            "**0:30–1:05** Q3. The scan gives two candidates. The box rings at 1:05 with a half-working idea, but the last 10 minutes produced new ideas, so you keep going.\n\n**1:05–1:30** Stuck protocol at 1:15: the brute force is O(n²) and n ≤ 10^5, too slow. Small cases on paper. No Accepted by 1:30. That's fine.",
          visual: weekly(2, "1:30", { 0: "good", 1: "good", 2: "warn" }, "Q3: honest attempt, not solved"),
        },
        {
          kind: "read",
          title: "A good first Weekly (5)",
          body:
            "**After:** log it. Q1 0:08, Q2 0:30 (1 WA), Q3 \"wrong idea\". Q3 is tomorrow's first upsolve.\n\nTwo solved, one honest attempt, and a clear upsolve target is a **good contest** for Week 1. Q4 was never opened, on purpose.",
          visual: weekly(2, "log", { 0: "good", 1: "good", 2: "warn" }, "Two solved, one upsolve target"),
        },
        {
          kind: "quiz",
          teach: "The AtCoder ABC boxes are A ≤ 5, B ≤ 10, C ≤ 25 minutes, and D gets the rest of the 100 minutes.",
          prompt: "In an AtCoder ABC, how long is the box for problem C?",
          options: ["10 minutes", "25 minutes", "35 minutes", "The rest of the contest"],
          answer: 1,
          explain: "C ≤ 25. D gets whatever time is left of the 100 minutes.",
        },
        {
          kind: "summary",
          points: [
            "Solve in order. Exceptions: on Codeforces go to the most-solved unsolved problem; on LeetCode stay on Q3.",
            "Six steps: read (constraints too), scan + clue comment, 2-minute break-it, code, test with 2 edge cases, submit.",
            "Time boxes are alarms: a new idea in the last 10 minutes means keep going.",
            "A good first Weekly: Q1 and Q2 solved, an honest Q3 attempt, and Q3 as tomorrow's upsolve.",
          ],
        },
      ],
    },

    /* ---------------- Lesson 4 ---------------- */
    {
      id: "ch10-l4",
      title: "When you are stuck in a contest",
      goal: "Recognise real stuckness and run the six-step contest stuck protocol, ending with moving on.",
      minutes: 8,
      steps: [
        {
          kind: "read",
          title: "No editorial in a contest",
          body:
            "Chapter 1's [[stuck protocol]] ends with the editorial. In a contest there is no editorial, so this version ends with **moving on**.\n\n**Stuck** means 15 minutes with no new idea. Errichto: \"if you aren't out of ideas then you aren't stuck.\"",
          visual: stuck(),
        },
        {
          kind: "quiz",
          teach: "Stuck is defined by ideas, not by time spent: 15 minutes with no new idea.",
          prompt: "You've been on C for 25 minutes and had two new ideas in the last 8. Are you stuck?",
          options: ["Yes, 25 minutes is too long", "No, you are still producing ideas", "Yes, because the box rang"],
          answer: 1,
          explain: "Stuck means 15 minutes with no new idea. You had new ideas recently, so keep working.",
        },
        {
          kind: "read",
          title: "1. Re-read",
          body:
            "When you are stuck, run six steps, in order, about 5 minutes in total.\n\nFirst: **re-read the statement and the constraints, word by word.** Rework the sample by hand. A lot of \"stuck\" is a misread.",
          visual: stuck(["r1"]),
        },
        {
          kind: "read",
          title: "2. Redo the scan out loud",
          body:
            "Which [[signal|trigger signal]] did you skip? Run the signal list in your head:\n\n- n ≤ 20? (try all subsets)\n- \"minimize the maximum\"? (binary search on the answer)\n- \"modulo\"? (counting)\n- \"any number of operations\"? (find what never changes)",
          visual: stuck(["r2"]),
        },
        {
          kind: "read",
          title: "3. The brute force in one sentence",
          body:
            "Say it: *\"The brute force is __ in O(__). The waste is __.\"* The **waste** is the repeated work a better algorithm would skip.\n\nIf the [[constraints]] are small enough that the [[brute force]] passes, **submit the brute force.**",
          visual: stuck(["r3"]),
        },
        {
          kind: "quiz",
          teach: "Compare the brute force's cost with the budget: about 10^7 simple operations per second in CPython, 10^8 in PyPy.",
          prompt: "n ≤ 18. Your brute force tries every subset: O(2^n · n), about 4.7 million steps. What do you do?",
          options: ["Keep looking for a smarter idea", "Submit the brute force", "Move on to the next problem", "Rewrite it as a DP first"],
          answer: 1,
          explain: "2^18 · 18 ≈ 4.7 · 10^6 fits easily. When the brute force passes, it is the solution.",
        },
        {
          kind: "read",
          title: "4. Small cases on paper",
          body:
            "Solve n = 1, 2, 3, 4 by hand, with the answers in a column. On Codeforces, the pattern often appears here.\n\nIn this example the answers are 1, 3, 6, 10: each adds n, so the answer is n(n+1)/2.",
          visual: {
            kind: "array",
            rows: [
              { label: "n", items: [1, 2, 3, 4] },
              { label: "answer", items: [1, 3, 6, 10], tones: { 3: "good" } },
            ],
            caption: "+2, +3, +4: the answer is n(n+1)/2",
          },
        },
        {
          kind: "read",
          title: "5. Try one flip",
          body:
            "Turn the problem around once:\n\n- **sort** the input\n- go **backwards**\n- **fix the answer and check it** ([[binary search on the answer]])\n- **count the complement** ([[complement counting]]: all minus the bad ones)",
          visual: stuck(["r5"]),
        },
        {
          kind: "read",
          title: "6. Move on",
          body:
            "Write one line about where you are. Go to the next problem (on Codeforces, the one with the most solves). Come back if time remains.",
          visual: stuck(["r6"]),
        },
        {
          kind: "order",
          teach: "The protocol starts with the cheapest checks (re-read, re-scan) and ends with moving on.",
          prompt: "Put the contest stuck protocol in order.",
          items: [
            "Re-read the statement and constraints, rework the sample",
            "Redo the 15-second scan out loud",
            "Write the brute force in one sentence",
            "Solve small cases on paper",
            "Try one flip",
            "Move on",
          ],
          explain: "Re-read, re-scan, brute force, small cases, flip, move on. About 5 minutes in total.",
        },
        {
          kind: "read",
          title: "\"I'm close\"",
          body: "The most expensive feeling in a contest.",
          callout: {
            type: "mistake",
            text:
              "Staying 50 minutes on one problem because \"I'm close\". If you were close, the last 10 minutes would have produced something. Two problems at 20 minutes each usually score better than one at 40.",
          },
        },
        {
          kind: "quiz",
          teach: "The fifth step lists four flips: sort, go backwards, fix the answer and check it, count the complement.",
          prompt: "The problem asks you to \"minimize the largest part\". Which flip fits best?",
          options: ["Sort the input", "Go backwards", "Fix the answer and check it", "Count the complement"],
          answer: 2,
          explain: "\"Minimize the maximum\" is the classic signal for fixing the answer x and checking \"can every part be ≤ x?\": binary search on the answer.",
        },
        {
          kind: "summary",
          points: [
            "Stuck = 15 minutes with no new idea. Still having ideas means you are not stuck.",
            "Protocol: re-read, re-scan out loud, brute force in one sentence, small cases, one flip, move on.",
            "If the brute force fits the constraints, submit it.",
            "Two problems at 20 minutes beat one at 40.",
          ],
        },
      ],
    },

    /* ---------------- Lesson 5 ---------------- */
    {
      id: "ch10-l5",
      title: "Wrong answers, TLE and penalties",
      goal: "Work out penalty minutes, check a Wrong Answer before resubmitting, and fix a Python TLE in the right order.",
      minutes: 11,
      steps: [
        {
          kind: "read",
          title: "Red verdicts",
          body:
            "Two verdicts cost beginners the most: **[[WA|WA (Wrong Answer)]]** (Wrong Answer: your output differs on some test) and **[[TLE|TLE (Time Limit Exceeded)]]** (Time Limit Exceeded: too slow).\n\nThis lesson: what a wrong submission costs, what to check before you resubmit, and the order to fix a slow Python solution.",
        },
        {
          kind: "read",
          title: "The penalty rules",
          body:
            "A **[[penalty]]** is extra time added to your score for wrong submissions.\n\n- LeetCode and AtCoder: **+5 minutes** per wrong submission.\n- Codeforces Div 3/4: **+10 minutes** per wrong attempt on a problem you **later solve**. Wrong attempts on a problem you never solve cost nothing.",
          visual: {
            kind: "stats",
            items: [
              { value: "+5 min", label: "LeetCode, AtCoder", note: "each wrong submission" },
              { value: "+10 min", label: "Codeforces Div 3/4", note: "only on problems you solve" },
            ],
          },
        },
        {
          kind: "read",
          title: "Worked example",
          body:
            "**LeetCode:** 3 wrong submissions → 3 × 5 = **15** penalty minutes.\n\n**Codeforces:** 1 wrong attempt on A, which you later solve, and 4 on D, which you never solve. Only A counts: 1 × 10 = **10** penalty minutes.",
          visual: {
            kind: "table",
            headers: ["Problem", "Wrong attempts", "Solved?", "Penalty"],
            rows: [
              ["A", "1", "yes", "10 min"],
              ["D", "4", "no", "0 min"],
              ["Total", "", "", "10 min"],
            ],
            caption: "Codeforces Div 3: only solved problems carry penalty",
          },
        },
        {
          kind: "number",
          teach: "On Codeforces Div 3/4, each wrong attempt costs 10 minutes, but only on problems you go on to solve.",
          prompt: "Codeforces Div 3. Two wrong attempts on B, which you later solve. Three wrong attempts on C, which you never solve. How many penalty minutes from wrong attempts?",
          answer: 20,
          tolerance: 0.5,
          unit: "min",
          explain: "B: 2 × 10 = 20. C was never solved, so its 3 wrong attempts add 0. Total 20.",
        },
        {
          kind: "read",
          title: "Penalty only breaks ties",
          body:
            "Penalty only matters between people with the **same number of solves**. One more solved problem beats any amount of penalty.",
          visual: {
            kind: "compare",
            left: { title: "You", points: ["3 solved", "40 penalty minutes", "Ranks higher"] },
            right: { title: "Rival", points: ["2 solved", "0 penalty minutes", "Ranks lower"] },
          },
        },
        {
          kind: "quiz",
          teach: "Rank by number solved first. Penalty only orders people who solved the same number.",
          prompt: "Ana: 3 solved, 45 penalty minutes. Ben: 3 solved, 20. Cy: 2 solved, 0. What is the order, best first?",
          options: ["Cy, Ben, Ana", "Ben, Ana, Cy", "Ana, Ben, Cy", "Ben, Cy, Ana"],
          answer: 1,
          explain: "Ana and Ben solved 3, so they beat Cy. Between them, Ben's smaller penalty wins. Ben, Ana, Cy.",
        },
        {
          kind: "read",
          title: "So, in practice",
          body:
            "- **Do** spend 1 to 2 minutes on the samples and two edge cases before submitting.\n- **Don't** spend 10 minutes re-checking to avoid a 5-minute penalty.\n- **Never** resubmit the same idea with random tweaks. Each blind resubmit costs penalty and teaches nothing.",
          callout: { type: "move", text: "A solve is worth far more than the penalty. Test briefly, submit, and if it fails, think before the next submit." },
        },
        {
          kind: "read",
          title: "Wrong Answer checklist (1)",
          body:
            "Check these **before** you resubmit:\n\n- **Output format:** \"YES\" vs \"Yes\", spaces, one line per test case.\n- **[[Multiple test cases|multiple test cases]]:** is all state reset per test? Did you read every line of input, even for tests you answered early?\n- **Edge cases:** n = 1, all values equal, all negative, an empty answer, the \"−1\" branch.",
        },
        {
          kind: "read",
          title: "Wrong Answer checklist (2)",
          body:
            "- **[[Off-by-one|off-by-one]]:** loop bounds, binary search bounds (`lo`, `hi`, `<` vs `<=`), inclusive ranges.\n- **Modulo:** applied at every step and on the final answer.\n- **Python specifics:** `//` rounds down toward minus infinity, so `-7 // 2` is `-4`. Never use floats for big integers: `math.isqrt(x)`, not `int(x ** 0.5)`.",
          visual: {
            kind: "code",
            lang: "python",
            code: "import math\nprint(-7 // 2)              # -4, not -3\nx = 10**18 - 1\nprint(math.isqrt(x))        # 999999999 (exact)\nprint(int(x ** 0.5))        # 1000000000 (float rounding: wrong)\n",
          },
        },
        {
          kind: "read",
          title: "Still WA?",
          body:
            "- **Still WA with 15+ minutes left?** Run the **[[stress test|stress testing]]** (Chapter 3): a brute force against your solution on random small inputs, until they disagree. It finds the failing case faster than staring.\n- **Two WAs and no new idea?** Move on. Come back at the end.",
        },
        {
          kind: "quiz",
          teach: "Python's `//` rounds down, toward minus infinity, not toward zero.",
          prompt: "What does `-7 // 2` give in Python?",
          options: ["-3", "-4", "-3.5", "3"],
          answer: 1,
          explain: "-3.5 rounded down (toward minus infinity) is -4. C++ and Java would give -3, which is why this is a classic WA.",
        },
        {
          kind: "read",
          title: "TLE: suspect Python first",
          body: "A Time Limit Exceeded in Python is often not the algorithm's fault.",
          callout: {
            type: "trap",
            text:
              "On TLE, check I/O and PyPy **before** you doubt the algorithm. A correct O(n log n) solution with `input()` in a loop can fail on Codeforces when the same code with fast input passes easily.",
          },
        },
        {
          kind: "read",
          title: "TLE on Codeforces and AtCoder (1)",
          body:
            "Check in this order:\n\n1. **PyPy selected?** The most common Python TLE is submitting under plain Python 3.\n2. **[[Fast input|fast I/O]]:** `sys.stdin.buffer.read().split()` once, not `input()` per line. `input()` is very slow on PyPy.\n3. **Fast output:** collect answers in a list, `print(\"\\n\".join(out))` once.\n4. **Recursion:** convert to an iterative stack. Deep recursion is slow and can crash PyPy.",
        },
        {
          kind: "read",
          title: "TLE on Codeforces and AtCoder (2)",
          body:
            "5. **Code inside `main()`:** local variable lookups are faster than globals.\n6. **Lists, not dicts,** when keys are 0..n.\n7. **Only now:** recount the complexity against the constraint table. Maybe it really is too slow.\n8. **Hacks** (Div 3/4 open hacking): a dict or set keyed by large integers can be hacked with **[[anti-hash tests|anti-hash test]]**. If you depend on one, XOR the keys with a random constant, or sort instead of hashing.",
        },
        {
          kind: "widget",
          widget: "complexity",
          title: "CPython vs PyPy",
          task: "Set n to 2·10^5 and pick O(n log n). Compare the CPython and PyPy times. Then pick O(n²) and see that no Python trick saves it.",
          props: { mode: "table", n: 200000 },
        },
        {
          kind: "code",
          title: "Fast input and output",
          prompt:
            "Read n, then n integers, from standard input. Print the running (prefix) sums, one per line. Read everything **once** and print **once**.\n\n(In the browser we read text with `sys.stdin.read()`. On Codeforces use `sys.stdin.buffer.read()`, the faster bytes version of the same idea.)",
          starter: "import sys\n\ndef main():\n    data = sys.stdin.read().split()\n    # your code here\n\nmain()\n",
          solution: fastIoCode,
          tests: [
            { stdin: "3\n1 2 3\n", stdout: "1\n3\n6" },
            { stdin: "1\n-5\n", stdout: "-5", label: "one element" },
            { stdin: "4\n2 2 2 2\n", stdout: "2\n4\n6\n8", label: "all equal" },
            { stdin: "5\n1\n2\n3\n4\n5\n", stdout: "1\n3\n6\n10\n15", label: "one number per line" },
          ],
          teach: "`.split()` with no argument splits on any whitespace, so numbers on one line or many lines read the same way.",
          explain: "One read, one loop, one print. The answers go into a list and leave through a single `\"\\n\".join`.",
        },
        {
          kind: "read",
          title: "TLE on LeetCode",
          body:
            "LeetCode runs [[CPython]] with no [[PyPy]], so there are fewer tricks.\n\n- Check the **complexity first**.\n- Replace `@cache` recursion over 10^5+ states with a bottom-up loop ([[tabulation]]).\n- Precompute outside loops.\n- Use built-ins (`sorted`, `sum`, `Counter`, `bisect`), which run in C.",
        },
        {
          kind: "quiz",
          teach: "On Codeforces, the TLE checks start with the language choice, then I/O, and only later the complexity.",
          prompt: "Codeforces TLE. Your solution is O(n log n) with n = 2·10^5. What do you check first?",
          options: ["Rewrite it as O(n)", "That PyPy 3 64-bit was selected", "Switch dicts to lists", "Remove recursion"],
          answer: 1,
          explain: "PyPy first: plain Python 3 is the most common cause of a Python TLE. O(n log n) at 2·10^5 is about 3.5 million steps, which fits.",
        },
        {
          kind: "summary",
          points: [
            "LeetCode and AtCoder: +5 min per wrong submission. Codeforces Div 3/4: +10 min per wrong attempt on problems you later solve.",
            "Penalty only breaks ties: one more solve beats any penalty.",
            "WA: format, test-case reset, edge cases, off-by-one, modulo, `//` and floats; then a stress test; then move on.",
            "TLE on Codeforces/AtCoder: PyPy, fast input, fast output, no deep recursion, main(), lists, then complexity, then anti-hash.",
            "TLE on LeetCode: complexity first, bottom-up instead of @cache, built-ins.",
          ],
        },
      ],
    },

    /* ---------------- Lesson 6 ---------------- */
    {
      id: "ch10-l6",
      title: "After the contest: the upsolve",
      goal: "Log a contest in 10 minutes and run the 45-minute upsolve protocol the next day.",
      minutes: 8,
      steps: [
        {
          kind: "read",
          title: "Same night: 10 minutes, then stop",
          body:
            "- Fill the contest log row (the Tracker page): problems solved, the minute of each Accepted, wrong submissions, rank.\n- For each unsolved problem, write **one word**: **no idea / wrong idea / bug / time.**\n- Don't read solutions tonight. A fresh attempt tomorrow is worth more than a tired editorial tonight.",
        },
        {
          kind: "quiz",
          teach: "The four words: no idea (nothing to try), wrong idea (tried a plan that can't work), bug (right plan, broken code), time (right plan, ran out of minutes).",
          prompt: "You knew Q3 needed BFS, coded it, and got WA you couldn't find before the end. Which word?",
          options: ["no idea", "wrong idea", "bug", "time"],
          answer: 2,
          explain: "The plan was right and the code was wrong: bug. \"Wrong idea\" would mean BFS itself was the wrong tool.",
        },
        {
          kind: "read",
          title: "What to upsolve",
          body:
            "To **[[upsolve]]** is to solve, after the contest, problems you could not solve in it. Errichto's advice: upsolve 1 to 2 problems after every contest.\n\nYour rule: **the first problem you did not solve, plus one more.** Not the whole set. The first unsolved problem is, by definition, right at the edge of your level. That makes it the most valuable problem of the week.",
        },
        {
          kind: "read",
          title: "The upsolve, minutes 0 to 5",
          body:
            "The upsolve is 45 minutes, the day after the contest.\n\nFirst, for problems you **solved**, skim the [[editorial]] for a cleaner idea. If there was one, write one line in the log.",
          visual: upsolve(0, "0–5: skim editorials of solved problems"),
        },
        {
          kind: "read",
          title: "Minutes 5 to 25",
          body:
            "**The first unsolved problem, alone.** New file, no hints.\n\nSleep often unlocks it: a problem that was a wall last night can look simple the next day.",
          visual: upsolve(1, "5–25: first unsolved, alone"),
        },
        {
          kind: "read",
          title: "Minutes 25 to 35",
          body:
            "Still stuck? **Read the editorial one paragraph at a time.** After each paragraph, close it and try again.\n\nOnce you have the idea, **implement it yourself**. Never copy code.",
          visual: upsolve(2, "25–35: editorial, one paragraph at a time"),
        },
        {
          kind: "read",
          title: "Minutes 35 to 45",
          body:
            "**One more:** the next unsolved problem. Read the editorial, then implement.\n\nIf it needs a technique this course hasn't taught yet, read for the idea only and stop.",
          visual: upsolve(3, "35–45: one more problem"),
        },
        {
          kind: "quiz",
          teach: "Minutes 5 to 25 are alone. From minute 25 the editorial is allowed, but only one paragraph at a time, closing it after each.",
          prompt: "Minute 27 of the upsolve. Still stuck on the first unsolved problem. What now?",
          options: [
            "Read the whole editorial and copy the code",
            "Read one paragraph of the editorial, close it, try again",
            "Skip it and start the next problem",
            "Keep going alone until minute 45",
          ],
          answer: 1,
          explain: "One paragraph, close, try. You get the smallest hint that unlocks you, and you still write the code yourself.",
        },
        {
          kind: "read",
          title: "Turn each upsolve into a card",
          body:
            "For each upsolved problem, **ask how you could have found it** (the USACO Guide's advice: work out how you could have reached the solution yourself). Which signal did you miss?\n\nThat answer becomes a **[[recognition card]]**: one line, the deciding constraint, and a twin card if you guessed wrong.",
        },
        {
          kind: "read",
          title: "Queue it and log it",
          body:
            "- Add it to the **[[re-solve queue]]** for Day +3 and Day +7: solve it again from blank 3 and 7 days later.\n- Add a **[[mistake-journal|mistake journal]]** line with its category.\n\nIf you solved every problem you attempted, upsolve the next one up with the same steps.",
        },
        {
          kind: "order",
          teach: "The 45 minutes go from easiest to hardest use of time: solved problems, then the first unsolved alone, then with the editorial, then one more.",
          prompt: "Put the four upsolve blocks in order.",
          items: [
            "Skim editorials of problems you solved",
            "First unsolved problem, alone, new file",
            "Editorial one paragraph at a time, then implement yourself",
            "One more unsolved problem: editorial, then implement",
          ],
          explain: "0–5, 5–25, 25–35, 35–45. The alone block is the longest because that is where the learning happens.",
        },
        {
          kind: "summary",
          points: [
            "Same night: log row, one word per unsolved (no idea / wrong idea / bug / time), no solutions.",
            "Upsolve the first unsolved problem plus one more, the next day, 45 minutes.",
            "Alone for 20 minutes; then the editorial one paragraph at a time; never copy code.",
            "Each upsolve: how could I have found it, a recognition card, re-solve on Day +3 and +7, a journal line.",
          ],
        },
      ],
    },

    /* ---------------- Lesson 7 ---------------- */
    {
      id: "ch10-l7",
      title: "Rating, and picking problems",
      goal: "Read early ratings correctly, track the numbers that do show progress, and pick practice problems at the right rating.",
      minutes: 10,
      steps: [
        {
          kind: "read",
          title: "In 30 days, rating is noise",
          body:
            "Four contests are too few to measure anything, and every platform makes early ratings misleading **on purpose**.\n\nSo learn what each platform does to new accounts, and what to track instead.",
        },
        {
          kind: "read",
          title: "Codeforces",
          body:
            "Since 2020, a new Codeforces account starts from a **hidden [[rating]] of 1400**. The displayed rating starts low and climbs through built-in bonuses over your first six rated rounds.\n\nEarly \"gains\" are partly the system, not you.",
        },
        {
          kind: "read",
          title: "AtCoder",
          body:
            "AtCoder deliberately pulls your rating down while you have few rated contests. It will look low for a while, whatever you do.",
        },
        {
          kind: "read",
          title: "LeetCode",
          body:
            "Since April 2026, a new account's first 5 contests are scored only by **percentile**: +70 for the top 5%, down to −20 for the bottom half. They don't count in the global ranking.\n\nYour real rating starts at contest 6, at 1500 plus those points. The most it can be is 1500 + 5 × 70 = **1850**.\n\nIf your account already has rated contests, this doesn't apply.",
        },
        {
          kind: "number",
          teach: "A new LeetCode account's rating at contest 6 is 1500 plus the points from its first 5 contests.",
          prompt: "Your first 5 LeetCode contests give +40, +10, −20, +40, +10. What is your starting rating at contest 6?",
          answer: 1580,
          tolerance: 0.5,
          explain: "40 + 10 − 20 + 40 + 10 = 80. Then 1500 + 80 = 1580.",
        },
        {
          kind: "read",
          title: "Track these instead",
          body:
            "The contest log on the Tracker page has a column for each:\n\n- Problems solved per contest.\n- **The minute Q1 and Q2 (or A and B) were Accepted.** If Q2 drops from 35 minutes to 15 over the month, that's real progress, whatever the rating says.\n- Wrong submissions per contest.\n- How many unsolved problems were \"no idea\" versus \"bug\" or \"time\".",
        },
        {
          kind: "read",
          title: "The path forward",
          body:
            "\"No idea\" turning into \"wrong idea\", then into \"bug\", is the path forward: first you see nothing, then you try the wrong tool, then the right tool with a broken implementation.\n\nThe honest month-one outcome: Q1 and Q2 on LeetCode every week, Q3 sometimes; A and B on a Div 3, C sometimes. That's a normal start. The road past it is Chapter 11.",
          visual: {
            kind: "array",
            rows: [{ label: "unsolved", items: ["no idea", "wrong idea", "bug", "solved"], tones: { 0: "bad", 1: "warn", 2: "accent", 3: "good" } }],
            caption: "Progress, left to right",
          },
        },
        {
          kind: "quiz",
          teach: "Early ratings are distorted on every platform. The minute Q1 and Q2 are Accepted, and the words in your unsolved column, show real change.",
          prompt: "Which change over the month is the clearest real progress?",
          options: [
            "Your Codeforces profile went from 400 to 900",
            "Q2 is now Accepted at minute 15 instead of 35",
            "You entered two extra contests",
            "Your AtCoder rating stayed flat",
          ],
          answer: 1,
          explain: "Faster Q2 is you. The Codeforces jump is mostly the new-account bonuses.",
        },
        {
          kind: "read",
          title: "Find your level R",
          body:
            "During the 30 days, your problems come from the day lists. Use this part for the optional extra hour and for month 2.\n\nYour **level R** is the highest Codeforces rating at which you solve most problems alone within 30 to 45 minutes. If you don't know it, start at 800 and move up.",
        },
        {
          kind: "read",
          title: "Practise at R + 100 to R + 300",
          body:
            "This is the community **\"+200 rule\"**. It isn't official, but it matches Errichto's advice (problems \"slightly above your level\") and the USACO Guide's (a good problem is one you struggle with, then solve).\n\nWorked example: R = 1000 → practise at **1100 to 1300**.\n\n- Solving more than 80% easily → go up 100.\n- Solving under 30% → go down 100.\n- Untimed doesn't mean unlimited: keep the time boxes and the stuck protocol.",
          visual: {
            kind: "array",
            rows: [
              {
                label: "rating",
                items: [800, 900, 1000, 1100, 1200, 1300, 1400],
                pointers: [{ at: 2, label: "R", tone: "accent" }],
                ranges: [{ from: 3, to: 5, tone: "good", label: "practise here" }],
              },
            ],
          },
        },
        {
          kind: "number",
          teach: "The practice range runs from R + 100 to R + 300.",
          prompt: "Your level R is 1200. What is the highest rating in your practice range?",
          answer: 1500,
          tolerance: 0.5,
          explain: "R + 300 = 1200 + 300 = 1500. The range is 1300 to 1500.",
        },
        {
          kind: "read",
          title: "Hide the tags",
          body:
            "A tag like \"binary search\" gives away the exact thing you are training to see.\n\nTurn off tag display for unsolved problems in your Codeforces settings, or cover them. Read the tags only after Accepted, to check your 15-second guess.",
        },
        {
          kind: "read",
          title: "Where to find problems (1)",
          body: "Mixed sources first; these train choosing the technique.",
          visual: {
            kind: "table",
            headers: ["Source", "Where", "Use it for"],
            rows: [
              ["Codeforces problemset by rating", "codeforces.com/problemset (set the rating range)", "Your main R + 100 to R + 300 practice. Mixed topics"],
              ["CP-31 sheet (TLE Eliminators)", "tle-eliminators.com/cp-sheet", "31 problems at each rating from 800 to 1900, deliberately not grouped by topic. Best fit for recognition"],
              ["C2-Ladders", "codeforces.com/blog/entry/100513", "Ladders by rating band, when you want a fixed list"],
            ],
          },
        },
        {
          kind: "read",
          title: "Where to find problems (2)",
          body: "Grouped and structured sources; these teach a technique.",
          visual: {
            kind: "table",
            headers: ["Source", "Where", "Use it for"],
            rows: [
              ["CSES Problem Set", "cses.fi/problemset", "400 classic problems in 18 sections, grouped by topic. Learn or drill a topic, not recognition. Strict limits test Python speed"],
              ["AtCoder Problems", "kenkoooo.com/atcoder", "ABC archive with difficulty colours, plus virtual contests. ABC C and D are clean pattern problems"],
              ["NeetCode 150 / 250", "neetcode.io/practice", "The LeetCode side, grouped by pattern"],
              ["USACO Guide", "usaco.guide", "Structured Bronze → Platinum path. Python struggles with time limits from Gold up"],
            ],
          },
        },
        {
          kind: "read",
          title: "Grouped, then mixed",
          body: "Both kinds of list matter, in a fixed order.",
          callout: {
            type: "move",
            text:
              "Grouped lists (CSES, NeetCode) teach a technique; mixed lists (CP-31, the rating filter, contests) teach you to **choose** it. You need both, in that order: learn the topic grouped, then practise it mixed.",
          },
        },
        {
          kind: "quiz",
          teach: "Grouped lists tell you the topic; mixed lists make you choose it, which is the recognition skill.",
          prompt: "You already know BIT. You want to train spotting when a problem needs it. Which source fits best?",
          options: ["CSES Range Queries section", "NeetCode 150", "The CP-31 sheet at your rating", "A BIT tutorial"],
          answer: 2,
          explain: "CP-31 is deliberately mixed, so nothing tells you \"this one is BIT\". CSES sections and NeetCode are grouped by topic.",
        },
        {
          kind: "summary",
          points: [
            "Early ratings mislead on purpose: Codeforces bonuses, AtCoder pull-down, LeetCode's first 5 contests.",
            "Track solves, the minute Q1/Q2 are Accepted, wrong submissions, and no idea → wrong idea → bug.",
            "Level R = highest rating where you solve most problems alone in 30–45 min. Practise at R + 100 to R + 300.",
            "Hide tags until Accepted.",
            "Learn grouped (CSES, NeetCode), then practise mixed (CP-31, rating filter, contests).",
          ],
        },
      ],
    },

    /* ---------------- Lesson 8: Checkpoint ---------------- */
    {
      id: "ch10-l8",
      title: "Checkpoint: the contest playbook",
      goal: "Check that you can run a contest from setup to upsolve.",
      minutes: 8,
      steps: [
        {
          kind: "read",
          title: "Here is what this chapter covered",
          body:
            "- **Contests train speed**; daily blocks train solving.\n- **Before:** 15-minute checklist: AI off, template, PyPy, 10 cards.\n- **During:** in order, six steps per problem, time boxes as alarms.\n- **[[Stuck|stuck protocol]]:** 15 minutes with no new idea → re-read, re-scan, brute force, small cases, flip, move on.\n- **Verdicts:** [[penalty]] only breaks ties; WA and TLE checklists.\n- **After:** one word per unsolved, then the 45-minute [[upsolve]]. Ignore early ratings.",
        },
        {
          kind: "match",
          teach: "LeetCode Weekly is the shortest; AtCoder ABC is 100 minutes; a Codeforces Div 3/4 runs about 2 to 2.5 hours.",
          prompt: "Match each contest to its length.",
          pairs: [
            ["LeetCode Weekly", "90 min"],
            ["AtCoder ABC", "100 min"],
            ["Codeforces Div 3 / Div 4", "About 2–2.5 hours"],
          ],
          explain: "90, 100, and about 2 to 2.5 hours (the exact length is on the contest page).",
        },
        {
          kind: "quiz",
          teach: "For a beginner, problems are solved in the order given, because they are sorted roughly by difficulty.",
          prompt: "A LeetCode Weekly starts. What do you do first?",
          options: ["Read all four problems", "Open Q1 and read its statement, then constraints", "Open Q4 to see the hardest", "Check the leaderboard"],
          answer: 1,
          explain: "Q1 first, statement then constraints. Reading everything first costs minutes and nerve.",
        },
        {
          kind: "number",
          teach: "LeetCode adds 5 minutes per wrong submission.",
          prompt: "LeetCode Weekly. You made 4 wrong submissions in total. How many penalty minutes?",
          answer: 20,
          tolerance: 0.5,
          unit: "min",
          explain: "4 × 5 = 20 minutes.",
        },
        {
          kind: "quiz",
          teach: "Rank is decided by solves first; penalty only orders people with the same number of solves.",
          prompt: "Should you spend 10 extra minutes re-checking a solution to avoid a possible 5-minute penalty?",
          options: ["Yes, penalty decides the rank", "No: 1–2 minutes of tests, then submit", "Yes, but only on Codeforces"],
          answer: 1,
          explain: "Test the samples and two edge cases (1–2 minutes), then submit. Ten minutes is better spent on the next problem.",
        },
        {
          kind: "quiz",
          teach: "Stuck is defined by ideas: a stretch of minutes with no new idea.",
          prompt: "When are you \"stuck\" in a contest?",
          options: ["After 10 minutes on a problem", "After 15 minutes with no new idea", "After your first WA", "When the time box rings"],
          answer: 1,
          explain: "15 minutes with no new idea. A ringing box only asks the question.",
        },
        {
          kind: "multi",
          teach: "The WA checklist: output format, multiple test cases, edge cases, off-by-one, modulo, Python `//` and floats.",
          prompt: "You got WA. Which are on the checklist before resubmitting? Select all that apply.",
          options: ["\"YES\" vs \"Yes\" in the output", "State reset between test cases", "Switch to PyPy", "The n = 1 case", "Use int(x ** 0.5) for square roots"],
          answers: [0, 1, 3],
          explain: "Format, resets and edge cases are WA checks. PyPy is a TLE fix, and int(x ** 0.5) is the float trap to avoid (use math.isqrt).",
        },
        {
          kind: "quiz",
          teach: "On Codeforces and AtCoder, the TLE checks start with the language choice and fast I/O before the algorithm.",
          prompt: "Codeforces TLE. PyPy is selected. What is the next thing to check?",
          options: ["Fast input: read all of stdin once", "Rewrite the algorithm", "Switch to Python 3", "Add @cache"],
          answer: 0,
          explain: "Second on the list: `sys.stdin.buffer.read().split()` once, not `input()` per line.",
        },
        {
          kind: "quiz",
          teach: "The upsolve rule picks the problem right at the edge of your level, plus one more.",
          prompt: "You solved Q1 and Q2 and not Q3 or Q4. What do you upsolve?",
          options: ["All four", "Q3, plus one more (Q4)", "Only Q4, the hardest", "Nothing; read the editorials"],
          answer: 1,
          explain: "The first unsolved (Q3) plus one more. Q3 is at the edge of your level, the most valuable problem of the week.",
        },
        {
          kind: "quiz",
          teach: "A new Codeforces account starts from a hidden 1400; the shown number climbs through bonuses over six rated rounds.",
          prompt: "After one rated Codeforces round, your profile shows a low number. What does it mean?",
          options: ["Your real level is that low", "Little: it is low by design for new accounts", "You should stop entering rounds"],
          answer: 1,
          explain: "Low by design. Judge by solves and the minute Q1/Q2 (A/B) were Accepted.",
        },
        {
          kind: "number",
          teach: "Practise at R + 100 to R + 300, where R is your level.",
          prompt: "Your level R is 900. What is the lowest rating in your practice range?",
          answer: 1000,
          tolerance: 0.5,
          explain: "R + 100 = 1000. The range is 1000 to 1200.",
        },
        {
          kind: "summary",
          points: [
            "Before: checklist. During: in order, six steps, alarms. Stuck: the six-step protocol, then move on.",
            "Penalty only breaks ties. WA and TLE each have a checklist; PyPy and fast I/O come first for TLE.",
            "After: log with one word per unsolved; upsolve the first unsolved plus one.",
            "Ignore early ratings; practise at R + 100 to R + 300 with tags hidden.",
          ],
        },
      ],
    },
  ],
};

export default ch;
