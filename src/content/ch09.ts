import type { Chapter } from "./types";

/* Chapter 9: The 15-Second Recognition Gym.
   The 150-card deck itself lives in deck.ts and is drilled on the Gym page (#gym).
   Lessons here teach how to use it and use only a handful of cards as worked examples. */

const SCAN_FLOW = (focus: string[]) => ({
  kind: "flow" as const,
  spec: {
    nodes: [
      { id: "s1", label: "n and values", sub: "0–5 s: budget", col: 0, row: 0 },
      { id: "s2", label: "Wants back", sub: "5–8 s: family", col: 1, row: 0 },
      { id: "s3", label: "Input shape", sub: "8–10 s: narrower", col: 2, row: 0 },
      { id: "s4", label: "Trigger phrase", sub: "10–15 s: one pattern", col: 3, row: 0 },
    ],
    edges: [
      { from: "s1", to: "s2" },
      { from: "s2", to: "s3" },
      { from: "s3", to: "s4" },
    ],
    focus,
  },
});

const CARD8 =
  "Card: \"Cut an array into k contiguous parts so the largest part sum is as small as possible. (n ≤ 10^5, values ≤ 10^4)\"";

const ch: Chapter = {
  n: 9,
  title: "The 15-Second Recognition Gym",
  short: "Recognition gym",
  part: 6,
  hook: "How recognition works, the 15-second scan, the signal words of contest problems, and the daily drill.",
  sources: [
    "Chase, W. G. & Simon, H. A. (1973). Perception in chess. Cognitive Psychology 4(1).",
    "Dunlosky, J. et al. (2013). Improving Students' Learning With Effective Learning Techniques. Psychological Science in the Public Interest 14(1).",
    "Rohrer, D., Dedrick, R. F. & Burgess, K. (2014). The benefit of interleaved mathematics practice is not limited to superficially similar kinds of problems. Psychonomic Bulletin & Review.",
    "Bastani, H. et al. (2025). Generative AI without guardrails can harm learning. PNAS.",
    "-is-this-fft-, Codeforces blog: why \"is this DP or greedy?\" is the wrong first question on hard problems.",
  ],
  lessons: [
    /* ------------------------------------------------------------------ L1 */
    {
      id: "ch09-l1",
      title: "Recognition is pattern memory",
      goal: "Explain why fast recognition is stored memory, and name the three habits that build it.",
      minutes: 8,
      steps: [
        {
          kind: "read",
          title: "The skill this chapter trains",
          body:
            "This chapter trains one skill: read a LeetCode-style problem and name the algorithm in 10 to 15 seconds.\n\nIt has four parts: how the skill works, a fixed **[[15-second scan]]**, a dictionary of contest **signal words**, and a daily drill.\n\nThe 150-card deck lives on the Gym page (#gym). The Gym is where your daily 20-card warm-up happens. These lessons teach you how to use it well.",
          visual: {
            kind: "stats",
            items: [
              { value: "15 s", label: "per problem", note: "the scan" },
              { value: "40", label: "signal words", note: "the dictionary" },
              { value: "150", label: "cards", note: "on the Gym page" },
              { value: "20", label: "cards a day", note: "10-minute warm-up" },
            ],
          },
        },
        {
          kind: "quiz",
          guess: true,
          prompt:
            "Take a guess. In classic chess studies, strong players remembered real board positions far better than beginners. What happened when the pieces were placed at random?",
          options: [
            "Strong players still remembered far more",
            "Strong players did no better than beginners",
            "Beginners remembered more",
          ],
          answer: 1,
          explain:
            "On random boards, the strong players lost their edge. Their memory was not better in general. They had stored thousands of familiar groups of pieces, and a random board has none of those groups.",
        },
        {
          kind: "read",
          title: "Chunks",
          body:
            "In the chess studies (Chase and Simon, 1973), strong players were not smarter. They had stored thousands of **chunks**. A chunk is a familiar group that you store and recall as one unit.\n\nA strong player saw a real board as a few chunks, not 25 separate pieces. So the board was easy to remember. A random board has no familiar chunks, so their advantage disappeared.\n\n**Recognition is pattern memory, not intelligence.**",
          visual: {
            kind: "compare",
            left: { title: "Beginner", points: ["Sees 25 separate pieces", "Must hold each one in mind", "Slow and easy to overload"] },
            right: { title: "Strong player", points: ["Sees a few familiar chunks", "Each chunk is one memory", "Fast, even under time pressure"] },
          },
        },
        {
          kind: "read",
          title: "Problems are made of chunks too",
          body:
            "Problems work the same way. A strong competitor does not read \"minimize the largest part sum\" as six words. They read **one chunk**. That chunk is already linked in memory to a technique: [[binary search on the answer]].\n\nSo the goal of this chapter is not to make you cleverer. It is to store many chunks, each linked to the right technique, so they fire on their own.",
          visual: {
            kind: "flow",
            spec: {
              nodes: [
                { id: "p", label: "\"minimize the", sub: "largest part sum\"", col: 0, row: 0 },
                { id: "c", label: "One chunk", sub: "read as a single unit", col: 2, row: 0, tone: "accent" },
                { id: "t", label: "Binary search", sub: "on the answer", col: 4, row: 0, tone: "good" },
              ],
              edges: [
                { from: "p", to: "c", label: "seen as" },
                { from: "c", to: "t", label: "linked to" },
              ],
              flow: ["p>c", "c>t"],
            },
          },
        },
        {
          kind: "read",
          title: "Way 1: retrieval",
          body:
            "You build chunks in three ways. The first is **[[retrieval|retrieval practice]]**: produce the answer from memory *before* you look.\n\nDunlosky and colleagues (2013) reviewed ten study techniques. Only two were rated \"high utility\": **practice testing** and **distributed practice** (spacing). Rereading and highlighting were rated low.\n\nA card you answer out loud is a practice test. A card you only read is rereading.",
          visual: {
            kind: "compare",
            left: { title: "High utility", points: ["Practice testing", "Distributed practice (spacing)"] },
            right: { title: "Low utility", points: ["Rereading", "Highlighting"] },
            caption: "Two of the ten techniques reviewed by Dunlosky et al. (2013) were rated high utility.",
          },
        },
        {
          kind: "quiz",
          teach:
            "Retrieval means producing the answer from memory before you look. A card you answer out loud is a practice test; a card you only read is rereading, which was rated low utility.",
          prompt: "You have 10 minutes with the deck. Which use of the time builds chunks best?",
          options: [
            "Read 20 cards with the answers showing",
            "Read each card, say the pattern out loud, then flip it",
            "Highlight the trigger words on 20 cards",
          ],
          answer: 1,
          explain:
            "Saying the answer before you flip is a practice test, one of the two high-utility techniques. Reading answers and highlighting were both rated low.",
        },
        {
          kind: "read",
          title: "Way 2: spacing",
          body:
            "The second way is **[[spacing|spaced repetition]]**: come back to a card over several days, not ten times in one sitting.\n\nThat is why the daily warm-up draws from *all* days up to today, not just today's topic. It is also why a problem you needed help with comes back on **Day +3** and **Day +7** (the [[re-solve queue]] from Chapter 1).",
          visual: {
            kind: "flow",
            spec: {
              nodes: [
                { id: "a", label: "Day N", sub: "solve it, with help", col: 0, row: 0 },
                { id: "b", label: "Day N + 3", sub: "re-solve, blank file", col: 2, row: 0 },
                { id: "c", label: "Day N + 7", sub: "clean? it leaves", col: 4, row: 0, tone: "good" },
              ],
              edges: [
                { from: "a", to: "b", label: "wait" },
                { from: "b", to: "c", label: "wait" },
              ],
            },
          },
        },
        {
          kind: "read",
          title: "Way 3: interleaving",
          body:
            "The third way is **[[interleaving]]**: mix the topics in one session.\n\nIn a study by Rohrer, Dedrick and Burgess (2014), students who practised **mixed** problem types scored **72%** on a delayed test. Students who practised one type at a time (**blocked** practice) scored **38%**.\n\nSame problems, same time. Only the order changed.",
          visual: {
            kind: "stats",
            items: [
              { value: "72%", label: "mixed practice", note: "delayed test" },
              { value: "38%", label: "blocked practice", note: "delayed test" },
            ],
            caption: "Rohrer, Dedrick and Burgess (2014).",
          },
        },
        {
          kind: "read",
          title: "Why mixing wins",
          body:
            "Blocked practice tells you the method before you start. After ten window problems in a row, you know problem eleven is a window too. You only practise *using* the method.\n\nInterleaved practice makes you *choose* the method. And choosing is exactly the skill a contest tests: nobody tells you the topic.",
          visual: {
            kind: "compare",
            left: { title: "Blocked", points: ["10 window cards, then 10 stack cards", "The method is given away", "You practise using it"] },
            right: { title: "Interleaved", points: ["20 cards from many days, shuffled", "Each card hides its method", "You practise choosing it"] },
          },
        },
        {
          kind: "quiz",
          teach:
            "Interleaving means mixing topics so each problem hides its method. Blocked practice gives the method away, so you never practise choosing.",
          prompt: "Which warm-up practises the skill a contest tests?",
          options: [
            "10 window cards, then 10 stack cards",
            "20 cards mixed from all earlier days, shuffled",
            "20 cards from today's topic only",
          ],
          answer: 1,
          explain:
            "Mixed cards from many days make you choose the method on every card. The other two tell you the method before you read the card.",
        },
        {
          kind: "read",
          title: "Why AI help hurts here",
          body:
            "This is also why AI help hurts this skill. In a study by Bastani and colleagues (PNAS, 2025), students with unrestricted GPT access did **48% better** on practice problems, and **17% worse** on the exam.\n\nSeeing an answer creates almost no chunk. Producing one does.",
          visual: {
            kind: "stats",
            items: [
              { value: "+48%", label: "on practice problems", note: "with unrestricted GPT" },
              { value: "−17%", label: "on the exam", note: "same students" },
            ],
            caption: "Bastani et al., PNAS 2025.",
          },
          callout: {
            type: "move",
            text: "If you did not produce the answer yourself, you did not build the chunk. Look only after you have said your answer.",
          },
        },
        {
          kind: "reveal",
          prompt:
            "Someone says: \"I read the whole answer key twice last night, so I'm ready for the test.\" Which of the three ways to build chunks did they skip?",
          answer:
            "All three. Reading answers is not retrieval (nothing was produced from memory). Twice in one night is not spacing. And reading a key in order never forces a choice, so it is not interleaving either. They built very few chunks.",
        },
        {
          kind: "summary",
          points: [
            "Recognition is stored pattern memory (chunks), not intelligence.",
            "Retrieval: say the answer before you look. Practice testing and spacing were the only high-utility techniques.",
            "Spacing: come back over days (Day +3, Day +7), not many times in one sitting.",
            "Interleaving: mixed practice scored 72% vs 38% for blocked. Choosing the method is the contest skill.",
            "Seeing an answer builds almost no chunk. Producing one does.",
          ],
        },
      ],
    },

    /* ------------------------------------------------------------------ L2 */
    {
      id: "ch09-l2",
      title: "A guess you test, and the 15-second scan",
      goal: "Treat your 15-second answer as a hypothesis, and run the four steps of the scan in order.",
      minutes: 9,
      steps: [
        {
          kind: "read",
          title: "Where 15 seconds works",
          body:
            "Fifteen seconds is realistic for **standard problems**:\n- LeetCode Easy and Medium\n- most LeetCode Hards that are one known technique\n- Codeforces [[Div 3]] and [[Div 4]] problems up to about C\n\nThese problems are built around one recognisable technique, and the statement leaks it. That is the kind of problem the scan is for.",
          visual: {
            kind: "compare",
            left: { title: "Standard problems", points: ["One known technique", "The statement leaks it", "15 seconds is realistic"] },
            right: { title: "Hard problems", points: ["Observations come first", "The technique appears later", "15 seconds is not the goal"] },
          },
        },
        {
          kind: "read",
          title: "Where it does not work",
          body:
            "Harder problems do not work this way. In a well-known Codeforces blog, the author -is-this-fft- argues that asking \"is this DP or greedy?\" at the start is the wrong question for hard problems.\n\nOn those, you first collect **observations** and simplify. The technique appears later.\n\nAlso: \"not greedy\" does not mean \"DP\". Ruling one out does not prove the other.",
        },
        {
          kind: "read",
          title: "A hypothesis, not a verdict",
          body:
            "So treat your 15-second answer as a **hypothesis**: a first guess that you test before you trust it.\n\nTwo quick tests:\n- Does the complexity fit the budget for this n?\n- Does the idea work on a tiny case, by hand?\n\nIf either test fails, drop the guess. Then use the **[[stuck protocol]]**: write the [[brute force]], take one hint, and only then read the [[editorial]].",
          callout: {
            type: "move",
            text: "Name the pattern in 15 seconds. Then spend the next 2 minutes trying to break it. Does the complexity fit the constraint table? Does it work on a tiny case by hand? If either check fails, drop the guess and go to the stuck protocol.",
          },
        },
        {
          kind: "read",
          title: "Why the 2-minute check pays",
          body:
            "Compare the two ways a wrong guess can go.\n\nA wrong guess you **test quickly** costs about 2 minutes. You see it fail on a tiny case and move on.\n\nA wrong guess you **code** costs about 30 minutes. You write it, debug it, and only then find the idea itself was wrong.",
          visual: {
            kind: "stats",
            items: [
              { value: "2 min", label: "wrong guess, tested", note: "fails on a tiny case" },
              { value: "30 min", label: "wrong guess, coded", note: "fails after debugging" },
            ],
          },
        },
        {
          kind: "quiz",
          teach:
            "The 15-second answer is a hypothesis. You test it for about 2 minutes (complexity and a tiny case), and if a test fails you drop it and use the stuck protocol.",
          prompt:
            "You name \"sliding window\" in 12 seconds. You try a tiny case by hand and the window gives the wrong answer. What do you do?",
          options: [
            "Code it anyway, since the guess came fast",
            "Drop the guess and go to the stuck protocol",
            "Code it and debug until it passes",
          ],
          answer: 1,
          explain:
            "A failed tiny case means the idea is wrong, not the code. Dropping it now costs 2 minutes. Coding it would cost about 30.",
        },
        {
          kind: "read",
          title: "Read the constraints first",
          body:
            "Now the scan itself. Read the problem in a fixed order, and **do not start with the story**.\n\nThe story (\"Alice has some cookies...\") is written to hide the technique. The constraints are not. A line like \"n ≤ 20\" or \"modulo 10^9+7\" cannot hide what it means.",
          visual: {
            kind: "compare",
            left: { title: "The story", points: ["Written to hide the technique", "Names, cookies, cities", "Read it last"] },
            right: { title: "The constraints", points: ["Cannot hide the technique", "n, value ranges, the output", "Read them first"] },
          },
        },
        {
          kind: "read",
          title: "The four steps",
          body:
            "The scan has four steps. Each one narrows the list of possible techniques.\n\nStep 1 gives you a **complexity budget**: the slowest running time that will still pass. Step 2 gives a family of approaches. Step 3 narrows the family. Step 4 picks one named pattern.\n\nThe next lessons teach each step with its own table.",
          visual: {
            kind: "table",
            headers: ["Seconds", "Look at", "Ask", "Output"],
            rows: [
              ["0–5", "n and the value ranges", "How much work can I afford?", "A complexity budget"],
              ["5–8", "What it wants back", "Count? Min/max? YES/NO? Any construction?", "A family of approaches"],
              ["8–10", "Input shape", "Array, string, grid, tree, graph, intervals, one number?", "Narrower family"],
              ["10–15", "One trigger phrase", "Which words match the signal dictionary?", "One named pattern + target complexity"],
            ],
          },
        },
        {
          kind: "read",
          title: "Watch it once: step 1",
          body:
            "Let's run the scan on one card from the deck.\n\n**Step 1, n and values.** n ≤ 10^5. In Python that means O(n log n) or better. Values are at most 10^4, so the total sum is at most 10^9.",
          visual: { ...SCAN_FLOW(["s1"]), caption: CARD8 },
        },
        {
          kind: "read",
          title: "Step 2",
          body:
            "**Step 2, what it wants back.** \"The largest part sum, as small as possible.\" That is the minimum of a maximum.\n\nA minimum of a maximum points to one family first: [[binary search on the answer]]. Guess a value for the largest part sum, and check whether it can work.",
          visual: { ...SCAN_FLOW(["s1", "s2", "s1>s2"]), caption: CARD8 },
        },
        {
          kind: "read",
          title: "Step 3",
          body:
            "**Step 3, input shape.** One array, cut into **contiguous** parts.\n\nThat shape makes the check easy. Walk left to right, add elements to the current part, and start a new part when the sum would pass the guess. That is a **greedy check** in one pass, O(n).",
          visual: { ...SCAN_FLOW(["s1", "s2", "s3", "s1>s2", "s2>s3"]), caption: CARD8 },
        },
        {
          kind: "read",
          title: "Step 4, and say it",
          body:
            "**Step 4, trigger phrase.** \"Largest ... as small as possible\" is the signal **\"minimize the maximum\"**. It confirms the family.\n\nNow say it out loud in one line:\n\n*\"n is 10^5, so n log n. It wants the minimum possible maximum. Binary search on the answer, greedy cut check, O(n log sum).\"*",
          visual: { ...SCAN_FLOW(["s1", "s2", "s3", "s4", "s1>s2", "s2>s3", "s3>s4"]), caption: CARD8 },
        },
        {
          kind: "widget",
          widget: "triage",
          title: "Run the scan yourself",
          task:
            "Pick the n range first, then what the problem wants back, then the input shape, then the trigger phrase. Watch the list of candidate patterns shrink after each choice.",
          props: { mode: "scan" },
        },
        {
          kind: "order",
          teach:
            "The scan starts with what the story cannot hide (the numbers), then the kind of answer, then the shape of the input, and ends with one phrase that picks the winner.",
          prompt: "Put the four steps of the 15-second scan in order.",
          items: ["n and the value ranges", "What it wants back", "Input shape", "One trigger phrase"],
          explain:
            "Budget first (0–5 s), then the answer type (5–8 s), then the input shape (8–10 s), then one trigger phrase (10–15 s).",
        },
        {
          kind: "summary",
          points: [
            "15 seconds is realistic for standard problems: LeetCode Easy/Medium, one-technique Hards, Codeforces Div 3/4 up to about C.",
            "Your 15-second answer is a hypothesis. Spend 2 minutes trying to break it: complexity fit, tiny case by hand.",
            "A wrong guess you test costs 2 minutes. A wrong guess you code costs 30.",
            "Read constraints before the story. The story hides the technique; the constraints cannot.",
            "Scan: n and values → what it wants back → input shape → one trigger phrase. Then say it in one line.",
          ],
        },
      ],
    },

    /* ------------------------------------------------------------------ L3 */
    {
      id: "ch09-l3",
      title: "Scan step 1: n and values give a budget",
      goal: "Turn the largest n and the value ranges into a complexity budget that works in Python.",
      minutes: 10,
      steps: [
        {
          kind: "read",
          title: "The first 5 seconds",
          body:
            "Step 1 looks at the **largest n** and the **value ranges**. It asks one question: how much work can I afford?\n\nThe output is a **complexity budget**: the slowest [[time complexity]] that still passes the time limit.\n\nTo find it, you need two numbers: how many operations your idea does, and how fast Python runs them.",
        },
        {
          kind: "read",
          title: "How fast Python runs",
          body:
            "Rough speeds:\n- **[[CPython]]** (the normal Python, used by LeetCode): about **10^7** simple operations per second.\n- **[[PyPy]]** (a faster Python you can pick on Codeforces, AtCoder and CSES): about **10^8**.\n\nTime limits are usually 1 to 2 seconds. These are rules of thumb, not guarantees. Chapter 4 (Day 1) measures them.",
          visual: {
            kind: "stats",
            items: [
              { value: "10^7 / s", label: "CPython", note: "LeetCode" },
              { value: "10^8 / s", label: "PyPy", note: "Codeforces, AtCoder, CSES" },
              { value: "1–2 s", label: "usual time limit" },
            ],
          },
        },
        {
          kind: "read",
          title: "Worked example",
          body:
            "Say n = 5000 and your idea is O(n^2).\n\nOperations: 5000^2 = 2.5·10^7.\n\nCPython: 2.5·10^7 ÷ 10^7 = **2.5 seconds**. Too slow for a 1–2 second limit.\n\nPyPy: 2.5·10^7 ÷ 10^8 = **0.25 seconds**. Fine.\n\nSo the same idea can pass on Codeforces with PyPy and fail on LeetCode.",
          visual: {
            kind: "table",
            headers: ["", "Operations", "Speed", "Time"],
            rows: [
              ["CPython", "2.5·10^7", "10^7 / s", "2.5 s (too slow)"],
              ["PyPy", "2.5·10^7", "10^8 / s", "0.25 s (fine)"],
            ],
          },
        },
        {
          kind: "number",
          teach: "Count the operations first (here n^2), then divide by the speed. CPython does about 10^7 simple operations per second.",
          prompt: "n = 2000 and your idea is O(n^2). About how many seconds does it take in CPython?",
          answer: 0.4,
          tolerance: 0.05,
          unit: "s",
          explain: "2000^2 = 4·10^6 operations. 4·10^6 ÷ 10^7 = 0.4 seconds. That passes.",
        },
        {
          kind: "read",
          title: "The constraint table: tiny n",
          body:
            "Now the table that turns n into a budget. Read it top to bottom; the first row whose n fits your problem gives the budget.\n\nTiny n allows huge work. n ≤ 10 allows trying **every permutation**. n ≤ 20 allows trying **every subset**: 2^20·20 ≈ 2·10^7, fine in PyPy, tight in CPython.",
          visual: {
            kind: "table",
            headers: ["Largest n", "C++ budget", "Python reality", "Likely techniques"],
            rows: [
              ["n ≤ 10", "O(n!·n)", "Fine (10! ≈ 3.6·10^6)", "All permutations, backtracking"],
              ["n ≤ 20", "O(2^n·n)", "2^20·20 ≈ 2·10^7: PyPy fine, CPython tight", "Subsets, bitmask DP, backtracking with pruning"],
            ],
          },
        },
        {
          kind: "read",
          title: "Small n: cubic and square",
          body:
            "With n up to a few hundred, cubic work fits. n ≤ 100: n^3 = 10^6 is easy, but n^4 = 10^8 is too slow in Python.\n\nn ≤ 500: n^3 = 1.25·10^8 is risky even in PyPy, so keep the inner loop tiny.\n\nn ≤ 5000: n^2 = 2.5·10^7. PyPy fine, CPython too slow, as in the worked example.",
          visual: {
            kind: "table",
            headers: ["Largest n", "C++ budget", "Python reality", "Likely techniques"],
            rows: [
              ["n ≤ 100", "O(n^3), even O(n^4)", "n^3 = 10^6 easy; n^4 = 10^8 too slow", "Floyd–Warshall, interval DP, cubic DP"],
              ["n ≤ 500", "O(n^3)", "1.25·10^8: risky even in PyPy", "Interval DP, Floyd, O(n^2 log n)"],
              ["n ≤ 5000", "O(n^2)", "2.5·10^7: PyPy fine, CPython too slow", "2-D DP (LCS, edit distance), all pairs"],
            ],
          },
        },
        {
          kind: "read",
          title: "Large n: n log n and linear",
          body:
            "n ≤ 2·10^5 is the most common limit. It allows **O(n log n)**: sort, heap, binary search, two pointers, Fenwick tree, Dijkstra, union-find.\n\nn ≤ 10^6 allows only **O(n)**: one pass, prefix sums, sieve, prefix function, monotonic stack.",
          visual: {
            kind: "table",
            headers: ["Largest n", "C++ budget", "Python reality", "Likely techniques"],
            rows: [
              ["n ≤ 2·10^5", "O(n log n)", "Fine with fast I/O", "Sort, heap, binary search, two pointers, Fenwick, Dijkstra, DSU"],
              ["n ≤ 10^6", "O(n)", "Fast I/O is mandatory", "One pass, prefix sums, sieve, prefix function, monotonic stack"],
            ],
          },
          callout: {
            type: "trap",
            text: "At n ≤ 10^6, Python needs fast input reading (read all of stdin at once) and should avoid a function call per element. The algorithm can be right and still time out.",
          },
        },
        {
          kind: "read",
          title: "Huge n: no loop to n",
          body:
            "When n reaches 10^9 or 10^18, you cannot even loop to n.\n\nn ≤ 10^9 allows **O(√n)** or **O(log n)**: √10^9 ≈ 3·10^4, fine. n ≤ 10^18 allows only **O(log n)**: fast power, binary search, digit DP, a closed formula.\n\nPython integers never overflow, which helps here. Floats are another story.",
          visual: {
            kind: "table",
            headers: ["Largest n", "C++ budget", "Python reality", "Likely techniques"],
            rows: [
              ["n ≤ 10^9", "O(√n) or O(log n)", "√10^9 ≈ 3·10^4, fine", "Trial division, binary search on the answer, formula"],
              ["n ≤ 10^18", "O(log n)", "Ints never overflow; float sqrt is wrong", "Fast power, binary search, digit DP, closed form"],
            ],
          },
          callout: {
            type: "trap",
            text: "math.sqrt works with floats, which are not exact near 10^18, so int(math.sqrt(n)) can be off by one. Use math.isqrt(n), which is exact for any integer.",
          },
        },
        {
          kind: "quiz",
          teach:
            "Find the first table row whose n fits. Tiny n (10 to 20) allows trying every permutation or every subset; mid-size n allows cubic or square work; large n allows n log n or less.",
          prompt: "The largest n is 18. Which family should you think of first?",
          options: ["Subsets or bitmask DP", "Sort + two pointers", "Floyd–Warshall"],
          answer: 0,
          explain: "n ≤ 20 gives a budget of O(2^n·n): about 2^18·18 ≈ 4.7·10^6 operations. That points to trying every subset, or a bitmask DP.",
        },
        {
          kind: "widget",
          widget: "complexity",
          title: "Find the budget",
          task: "Pick n = 5000 and try O(n^2): which Python passes? Then pick n = 2·10^5 and find the slowest complexity that still passes.",
          props: { mode: "budget" },
        },
        {
          kind: "read",
          title: "Value ranges carry clues too",
          body:
            "The value ranges are the second half of step 1. Small values mean you can use a **counting array**; huge values mean a hash map. Contest problems add more:\n- **Values ≤ 10^6:** you can index an array *by value*: sieve, smallest prime factor, loop over multiples, counting sort.\n- **Values < 2^30 (or 2^31) with XOR, AND or OR:** think **per bit**. That is 30 passes.",
          visual: {
            kind: "table",
            headers: ["Value clue", "Think"],
            rows: [
              ["Values ≤ 10^6", "Array indexed by value: sieve, smallest prime factor, multiples, counting sort"],
              ["Values < 2^30 + XOR / AND / OR", "Per bit, 30 passes"],
            ],
          },
        },
        {
          kind: "read",
          title: "Three more value clues",
          body:
            "- **Values up to 10^9, but only n ≤ 2·10^5 of them, needed as indexes:** [[coordinate compression]]. Sort the distinct values and replace each by its rank.\n- **Sum of values small (≤ 10^5) while n is moderate:** a DP over the sum, like knapsack.\n- **\"Sum of n over all test cases ≤ 2·10^5\":** each test must be about O(n log n), and you must not build an O(max value) array for every test.",
          visual: {
            kind: "table",
            headers: ["Value clue", "Think"],
            rows: [
              ["Values ≤ 10^9, n ≤ 2·10^5, used as indexes", "Coordinate compression"],
              ["Sum of values ≤ 10^5, moderate n", "DP over the sum (knapsack)"],
              ["Sum of n over all tests ≤ 2·10^5", "O(n log n) per test, no O(max value) array per test"],
            ],
          },
        },
        {
          kind: "quiz",
          teach:
            "When values are huge but there are not many of them, you can replace each value by its rank among the distinct values. Then the values fit as array indexes.",
          prompt: "Values go up to 10^9, there are only n ≤ 2·10^5 of them, and you need them as array indexes. What do you use?",
          options: ["Coordinate compression", "A counting array of size 10^9", "A sieve up to 10^9"],
          answer: 0,
          explain: "An array of size 10^9 does not fit in memory. Compression maps the at most 2·10^5 distinct values to ranks 0..n−1.",
        },
        {
          kind: "reveal",
          prompt:
            "A Codeforces problem says: \"t test cases. The sum of n over all test cases is at most 2·10^5. Values ≤ 10^9.\" What is your budget per test, and what must you avoid?",
          answer:
            "About O(n log n) per test (or O(n)), because all tests together have only 2·10^5 elements. Avoid anything sized by the maximum value per test (an array of 10^9, or even 10^6 rebuilt for each of many tests), and reset your state at the start of each test.",
        },
        {
          kind: "summary",
          points: [
            "Budget = the slowest complexity that still passes. Operations ÷ speed = time.",
            "CPython about 10^7 operations per second, PyPy about 10^8. Limits are usually 1–2 seconds.",
            "n ≤ 10 permutations · n ≤ 20 subsets · n ≤ 100–500 cubic · n ≤ 5000 square · n ≤ 2·10^5 n log n · n ≤ 10^6 linear · 10^9 √n or log · 10^18 log.",
            "Use math.isqrt, never float sqrt, for huge numbers. Fast I/O at 10^6.",
            "Values ≤ 10^6 → index by value; bitwise ops → per bit; huge values as indexes → compression; sum of n over tests → no big array per test.",
          ],
        },
      ],
    },

    /* ------------------------------------------------------------------ L4 */
    {
      id: "ch09-l4",
      title: "Scan steps 2 and 3: the answer and the shape",
      goal: "Use what the problem wants back and the shape of its input to narrow it to a few candidate patterns.",
      minutes: 10,
      steps: [
        {
          kind: "read",
          title: "Seconds 5 to 8: what it wants back",
          body:
            "Step 2 reads the **output** line. The kind of answer it wants points to a **family** of approaches.\n\nHere are the first four rows of the table. Notice how a count \"modulo 10^9+7\" rules out backtracking: the count is so large that the problem needs a modulus, so you could never list the items one by one.",
          visual: {
            kind: "table",
            headers: ["It asks for", "First guesses"],
            rows: [
              ["YES/NO, \"is it possible\"", "Invariant, greedy check, reachability (BFS, DSU), a binary-search feasibility test"],
              ["A count, \"modulo 10^9+7\"", "DP, combinatorics (nCr), contribution counting. Never backtracking"],
              ["A minimum or maximum", "Greedy if an exchange argument works, otherwise DP"],
              ["Minimum of a maximum (or max of a min)", "Binary search on the answer"],
            ],
          },
        },
        {
          kind: "read",
          title: "Min or max: greedy or DP?",
          body:
            "For a plain minimum or maximum, try **greedy** first: make the best-looking choice at each step.\n\nGreedy is safe when an **[[exchange argument]]** works: take any best answer, swap two neighbouring choices into greedy order, and show the answer does not get worse.\n\nIf you cannot make that swap argument work, the choices interact, and you need **[[DP|dynamic programming (DP)]]** (a table of answers to smaller subproblems).",
          visual: {
            kind: "compare",
            left: { title: "Greedy", points: ["Best local choice each step", "Needs an exchange argument", "Usually a sort + one pass"] },
            right: { title: "DP", points: ["Choices interact", "Store answers to subproblems", "Used when greedy has no proof"] },
          },
        },
        {
          kind: "quiz",
          teach:
            "A count modulo a big prime is huge, so the method must count without listing. The usual families are DP, nCr formulas and contribution counting.",
          prompt: "A problem asks for the number of valid strings, modulo 10^9+7. Which is NOT a good first guess?",
          options: ["DP", "Combinatorics with nCr", "Backtracking that lists each string", "Contribution counting"],
          answer: 2,
          explain: "The modulus tells you the count is enormous. Listing each string one by one would take far too long. Never backtracking for a count mod 10^9+7.",
        },
        {
          kind: "read",
          title: "The rest of the output table",
          body:
            "Five more answer types. Two to notice:\n- \"Print **any** valid ...\" means you build an answer yourself ([[constructive|constructive problem]]), not search for the best one.\n- \"**Every** combination, listed\" is the only case where backtracking is the plan, and it only works when n is small.",
          visual: {
            kind: "table",
            headers: ["It asks for", "First guesses"],
            rows: [
              ["\"Print any valid ...\"", "Constructive or greedy; topological order for dependencies"],
              ["The k-th something", "Heap, or binary search on the value + count"],
              ["Every combination, listed", "Backtracking (n must be small)"],
              ["One answer per query", "Precompute, or a range structure (Fenwick, segment tree)"],
              ["One answer per node or index", "One pass with a stack or map, or rerooting DP on a tree"],
            ],
          },
        },
        {
          kind: "quiz",
          teach: "Look up the answer type in the output table. \"The k-th something\" has its own row.",
          prompt: "The output line says: \"print the k-th smallest value\". What are the first guesses?",
          options: ["A heap, or binary search on the value + count", "Backtracking over all orders", "A topological order"],
          answer: 0,
          explain: "The k-th something → a heap, or binary search on the value while counting how many are at most that value.",
        },
        {
          kind: "read",
          title: "Seconds 8 to 10: input shape",
          body:
            "Step 3 reads the **input** section. What does the data look like?\n\nEach shape has its usual families. One array or one string is the most common, so those families are wide. A grid, a tree or a graph narrows things fast.",
          visual: {
            kind: "table",
            headers: ["Shape", "Usual families"],
            rows: [
              ["One array", "Hashing, two pointers, window, prefix sums, stack, sort, 1-D DP"],
              ["One string", "Window, hashing, prefix function, DP over prefixes"],
              ["Two strings", "2-D DP over (i, j); prefix function on a + '#' + b"],
              ["Grid", "BFS/DFS, grid DP, 2-D prefix sums"],
            ],
          },
        },
        {
          kind: "read",
          title: "n nodes and n − 1 edges",
          body:
            "One shape hides in plain numbers. If the input has **n nodes and n − 1 edges** and everything is connected, there is no room for a cycle. It is a **tree**.\n\nHere, 5 nodes and 4 edges. Trees mean a DFS that returns a value up to its parent, or a tree DP.",
          visual: {
            kind: "graph",
            nodes: [
              { id: "1", x: 50, y: 15, tone: "accent" },
              { id: "2", x: 25, y: 50 },
              { id: "3", x: 75, y: 50 },
              { id: "4", x: 10, y: 85 },
              { id: "5", x: 40, y: 85 },
            ],
            edges: [
              { from: "1", to: "2" },
              { from: "1", to: "3" },
              { from: "2", to: "4" },
              { from: "2", to: "5" },
            ],
            caption: "n = 5 nodes, n − 1 = 4 edges: a tree.",
          },
        },
        {
          kind: "read",
          title: "n nodes and m edges",
          body:
            "Add two more edges to the same nodes and there are cycles. Now it is a general **graph** with n nodes and m edges.\n\nThe usual families change: BFS for fewest steps, [[Dijkstra]] for weighted shortest paths, [[union-find (DSU)|union-find / DSU]] for connectivity, [[topological sort]] for dependencies.",
          visual: {
            kind: "graph",
            nodes: [
              { id: "1", x: 50, y: 15 },
              { id: "2", x: 25, y: 50 },
              { id: "3", x: 75, y: 50 },
              { id: "4", x: 10, y: 85 },
              { id: "5", x: 40, y: 85 },
            ],
            edges: [
              { from: "1", to: "2" },
              { from: "1", to: "3" },
              { from: "2", to: "4" },
              { from: "2", to: "5" },
              { from: "3", to: "5", tone: "warn" },
              { from: "4", to: "5", tone: "warn" },
            ],
            caption: "n = 5 nodes, m = 6 edges: a graph with cycles.",
          },
        },
        {
          kind: "read",
          title: "The rest of the shape table",
          body:
            "Four more shapes:\n- **Intervals** (pairs like [l, r]) almost always start with a sort.\n- A **permutation of 1..n** (each number exactly once) lets you store where each value sits.\n- **One number N** means math.\n- A **list of operations or queries** means you simulate with the right structure, or sort the queries and answer them in your own order (offline).",
          visual: {
            kind: "table",
            headers: ["Shape", "Usual families"],
            rows: [
              ["n nodes and n − 1 edges", "Tree: DFS that returns values, tree DP"],
              ["n nodes and m edges", "BFS, Dijkstra, DSU, topological sort"],
              ["Intervals or segments", "Sort + sweep, heap of end times, difference array"],
              ["A permutation of 1..n", "Position array, cycles, Fenwick for inversions"],
              ["One number N", "Math: formula, binary search, sieve, digit DP"],
              ["A list of operations or queries", "Simulate with the right structure, or sort the queries offline"],
            ],
          },
        },
        {
          kind: "match",
          teach: "Each input shape has a short list of usual families. Two strings → a table over both positions; a grid → walking it; one number → math.",
          prompt: "Match each input shape to its usual families.",
          pairs: [
            ["Grid", "BFS/DFS, grid DP, 2-D prefix sums"],
            ["Two strings", "2-D DP over (i, j)"],
            ["A permutation of 1..n", "Position array, cycles"],
            ["One number N", "Formula, binary search, sieve, digit DP"],
          ],
          explain: "These come straight from the shape table. The shape alone often cuts the list to three or four families.",
        },
        {
          kind: "quiz",
          teach: "Intervals are pairs [l, r]. The shape table lists sorting first, then sweeping, a heap of end times or a difference array.",
          prompt: "The input is \"n intervals [l_i, r_i]\". Which families come first?",
          options: ["Sort + sweep, heap of end times, difference array", "Grid DP", "Prefix function"],
          answer: 0,
          explain: "Intervals → sort (by start or by end), then sweep. A heap of end times counts overlaps; a difference array handles coverage.",
        },
        {
          kind: "read",
          title: "Steps 1 to 3 together",
          body:
            "Run steps 1–3 on a deck card: *\"Count subarrays with sum exactly k; values can be negative. (n ≤ 2·10^4)\"*\n\n- Step 1: n ≤ 2·10^4, so n^2 = 4·10^8 is too slow in Python. Aim for O(n) or O(n log n).\n- Step 2: a count.\n- Step 3: one array.\n\nThat leaves a few candidates: a sliding window, prefix sums with a map, hashing. Step 4 picks the winner, in the next lesson.",
          visual: { ...SCAN_FLOW(["s1", "s2", "s3", "s1>s2", "s2>s3"]), caption: "Three steps leave two or three candidates." },
        },
        {
          kind: "summary",
          points: [
            "Step 2 reads the output: YES/NO, count mod p, min/max, min of a max, any valid, k-th, every combination, per query, per node.",
            "A count modulo 10^9+7 is never backtracking. A min of a max is binary search on the answer.",
            "Greedy needs an exchange argument; without one, use DP.",
            "Step 3 reads the input shape. n nodes and n − 1 edges (connected) is a tree.",
            "After steps 1–3 you usually have two or three candidates left.",
          ],
        },
      ],
    },

    /* ------------------------------------------------------------------ L5 */
    {
      id: "ch09-l5",
      title: "Step 4 and signal words, part 1",
      goal: "Use one trigger phrase to pick the winner, and know the signal words for counting, bits, answer search and queries.",
      minutes: 11,
      steps: [
        {
          kind: "read",
          title: "Step 4: one phrase picks the winner",
          body:
            "Back to the card from the last lesson. Steps 1–3 left a window, prefix sums with a map, and hashing.\n\nNow read the trigger phrase: **\"exactly k\"** plus **\"values can be negative\"**. A window needs all-positive values, because with negatives a longer window can have a *smaller* sum. So the winner is **prefix sum + a map** of earlier prefix sums, O(n).",
          visual: {
            kind: "table",
            headers: ["Candidate", "Fits \"exactly k\" + negatives?"],
            rows: [
              ["Sliding window", "No: negatives break the shrink rule"],
              ["Prefix sum + map of counts", "Yes: O(n)"],
              ["Plain hashing of values", "No: the sum is over a range, not one value"],
            ],
          },
        },
        {
          kind: "read",
          title: "The signal words dictionary",
          body:
            "A **signal word** is a phrase in a statement that points to a technique. The next two lessons give the 40 signals that Codeforces, AtCoder and harder LeetCode problems use.\n\nEach row has three parts: the **signal**, what to **think first**, and what to **check** before you trust it. Learn the left column the way you learn any card: see the signal, say the technique.",
        },
        {
          kind: "read",
          title: "Counting under a modulus",
          body:
            "In interview problems, \"modulo\" usually means a counting DP. In contests it is often a **formula** (for example nCr with factorials) or a per-element **contribution**.\n\nDividing under a prime modulus needs a **[[modular inverse]]**: instead of dividing by x, multiply by pow(x, MOD − 2, MOD). This works only because MOD is prime.",
          visual: {
            kind: "table",
            headers: ["Signal", "Think first", "Check"],
            rows: [
              ["\"modulo 10^9+7\" or \"998244353\"", "Counting: DP, nCr with factorials, or contribution counting", "In CP it is often a formula or a per-element contribution"],
              ["Division under a prime modulus", "Modular inverse: pow(x, MOD − 2, MOD)", "Works only because MOD is prime"],
            ],
          },
        },
        {
          kind: "read",
          title: "Huge numbers, primes and gcd",
          body:
            "When numbers get huge, the size tells you the method.\n\nUp to 10^18: any loop to N is dead, so think O(log). One number up to 10^12: try divisors up to √x = 10^6. Many values up to 10^6: a **[[sieve]]**. For gcd, note that a running gcd only shrinks or stays, and changes at most about log V times.",
          visual: {
            kind: "table",
            headers: ["Signal", "Think first", "Check"],
            rows: [
              ["N or k up to 10^18", "O(log): fast power, binary lifting, matrix power, binary search, closed form, digit DP", "Any loop to N is dead"],
              ["One number x ≤ 10^12", "Trial division up to √x = 10^6", "√(10^12) = 10^6 fits"],
              ["Values ≤ 10^6 + divisors, gcd, primes", "Sieve, smallest prime factor, loop over multiples", "n/1 + n/2 + … ≈ n ln n"],
              ["\"gcd\" of a range or after removing one", "Prefix and suffix gcd", "Prefix gcd changes at most ~log V times"],
            ],
          },
        },
        {
          kind: "quiz",
          teach: "One big number up to 10^12 is too big for a sieve, but its square root is only 10^6. Every divisor pair has one member at most √x.",
          prompt: "You must list all divisors of one number x ≤ 10^12. What do you do?",
          options: ["Trial division up to √x = 10^6", "A sieve up to 10^12", "Loop from 1 to x"],
          answer: 0,
          explain: "Each divisor d ≤ √x pairs with x // d. So 10^6 checks find them all. A sieve or a loop to 10^12 is far too slow.",
        },
        {
          kind: "read",
          title: "XOR, AND, OR",
          body:
            "Bitwise signals usually mean: treat each bit on its own. Values below 2^30 have 30 bits, so that is 30 passes.\n\nXOR has one more trick: x ^ x = 0. So with [[prefix XORs|prefix XOR]] px, the XOR of a[l..r] is **px[r+1] ^ px[l]**, the same shape as prefix sums. For the maximum XOR of a pair, a binary trie works.",
          visual: {
            kind: "table",
            headers: ["Signal", "Think first", "Check"],
            rows: [
              ["\"XOR\"", "Per-bit independence; prefix XOR (x ^ x = 0); binary trie for max XOR", "XOR of a[l..r] = px[r+1] ^ px[l]"],
              ["\"AND\" / \"OR\" over pairs or subarrays", "Count per bit; the OR ending at i takes at most ~30 distinct values", "Values < 2^30 → 30 passes"],
            ],
          },
        },
        {
          kind: "read",
          title: "Sum over all subarrays: contribution",
          body:
            "\"Sum over all pairs\" or \"over all subarrays\" means **[[contribution counting|contribution technique]]**: instead of looping over every subarray, ask how much each element adds to the total.\n\nIn an array of length n, a[i] sits in (i + 1)·(n − i) subarrays. For [1, 2, 3]: counts 3, 4, 3, so the total is 1·3 + 2·4 + 3·3 = **20**. If the term has |x − y|, max or min, sort first.",
          visual: {
            kind: "array",
            indices: true,
            rows: [
              { label: "a", items: [1, 2, 3] },
              { label: "in how many", items: ["1·3 = 3", "2·2 = 4", "3·1 = 3"], tones: { 1: "accent" } },
              { label: "adds", items: [3, 8, 9], tones: { 0: "good", 1: "good", 2: "good" } },
            ],
            caption: "Subarray sums 1, 2, 3, 3, 5, 6 also total 20.",
          },
        },
        {
          kind: "number",
          teach: "a[i] appears in (i + 1)·(n − i) subarrays. Multiply each value by its count and add them up.",
          prompt: "Using contribution counting, what is the sum of the sums of all subarrays of [4, 1, 2]?",
          answer: 22,
          tolerance: 0.5,
          explain: "Counts for n = 3 are 3, 4, 3. Total = 4·3 + 1·4 + 2·3 = 12 + 4 + 6 = 22. (Check: 4 + 1 + 2 + 5 + 3 + 7 = 22.)",
        },
        {
          kind: "read",
          title: "Searching for the answer",
          body:
            "\"Minimize the maximum\" means binary search on the answer. It needs **[[monotonic|monotonicity]]** feasibility: if a value works, every larger value works too. It is the same idea as \"the minimum speed so that it works\".\n\n\"At most k changes\" is a budget: a window if the answer is contiguous. \"Exactly k\" is **atMost(k) − atMost(k − 1)**.",
          visual: {
            kind: "table",
            headers: ["Signal", "Think first", "Check"],
            rows: [
              ["\"Minimize the maximum\" / \"maximize the minimum\"", "Binary search on the answer", "Feasibility must be monotonic"],
              ["k-th smallest of a huge implicit set (pair sums, table cells, distances)", "Binary search on the value + count how many are ≤ mid", "Counting must be fast"],
              ["\"At most k changes / flips / operations\"", "Contiguous → window with a budget; else binary search on the answer, or DP with k in the state if k is small", "Is the answer contiguous?"],
              ["\"Exactly k\"", "atMost(k) − atMost(k − 1)", "Works for windows and many counting problems"],
            ],
          },
        },
        {
          kind: "read",
          title: "Worked example: exactly k",
          body:
            "Count subarrays of [1, 2, 1, 3] with **exactly 2** distinct values.\n\nCounting \"exactly\" directly with a window is awkward. Counting \"at most\" is easy. So:\n- atMost(2) = 8 (the four single cells, the three pairs, and [1, 2, 1])\n- atMost(1) = 4 (only the single cells)\n\nExactly 2 = 8 − 4 = **4**.",
          visual: {
            kind: "array",
            indices: true,
            rows: [
              { label: "a", items: [1, 2, 1, 3], ranges: [{ from: 0, to: 2, tone: "good", label: "2 distinct" }] },
            ],
            caption: "The 4 answers: [1,2], [2,1], [1,3], [1,2,1].",
          },
        },
        {
          kind: "quiz",
          teach: "\"Minimize the maximum\" and \"maximize the minimum\" are the same signal turned around. Guess the answer, check if it is feasible, and use the fact that feasibility is monotonic.",
          prompt: "\"Place the items so that the smallest gap between any two is as large as possible.\" What do you think first?",
          options: ["Binary search on the answer (the gap)", "Exactly k = atMost(k) − atMost(k − 1)", "Contribution counting"],
          answer: 0,
          explain: "\"The smallest ... as large as possible\" is maximize the minimum. Binary search on the gap, with a greedy placement check.",
        },
        {
          kind: "read",
          title: "Queries and range updates",
          body:
            "\"q queries\" on an array that never changes: **precompute** (prefix sums, sort + bisect, or answer the queries in sorted order). q·n is too slow.\n\nWith updates mixed in: a [[Fenwick tree|Fenwick tree (BIT)]] for sums or counts, a [[segment tree]] for min, max, gcd or any associative operation. A Fenwick tree needs an operation you can *undo*: sum yes, min no.",
          visual: {
            kind: "table",
            headers: ["Signal", "Think first", "Check"],
            rows: [
              ["\"q queries\", array never changes", "Precompute: prefix sums, sort + bisect, or offline in sorted order", "q·n is too slow"],
              ["\"q queries\" with updates mixed in", "Fenwick (sums, counts) or segment tree (min, max, gcd, any associative op)", "Fenwick needs an op you can undo"],
              ["\"Add v to every element in [l, r]\"", "Difference array if all updates come before reads; Fenwick on differences if mixed", "Are reads interleaved with updates?"],
            ],
          },
        },
        {
          kind: "read",
          title: "Changes over time",
          body:
            "\"After each operation, print...\" needs an **online** structure that updates cheaply: DSU, heap, [[SortedList]], Fenwick. Rebuilding each time is O(n·q).\n\nIf edges are **removed** and you are asked about connectivity, reverse time: start from the end and add the edges back with DSU. A DSU can join groups but cannot split them.",
          visual: {
            kind: "table",
            headers: ["Signal", "Think first", "Check"],
            rows: [
              ["\"After each operation, print ...\"", "Online structure: DSU for merges, heap, SortedList, Fenwick", "Rebuilding each time is O(n·q)"],
              ["Edges or items get removed, connectivity asked", "Reverse time: add them back with DSU", "DSU cannot delete"],
              ["Values up to 10^9 used as positions", "Coordinate compression: map each value to its rank", "Then a Fenwick or difference array fits"],
              ["\"t test cases\" + \"sum of n ≤ 2·10^5\"", "Per test O(n) or O(n log n); reset state per test", "No O(max value) allocation per test"],
            ],
          },
        },
        {
          kind: "quiz",
          teach: "A Fenwick tree answers prefix questions and then subtracts, so its operation must be undoable. Min and max cannot be undone by subtraction; a segment tree handles any associative operation.",
          prompt: "Updates are mixed with queries for the maximum of a range. Fenwick tree or segment tree?",
          options: ["Fenwick tree", "Segment tree", "Difference array"],
          answer: 1,
          explain: "Max cannot be undone like a sum can, so a Fenwick tree does not fit. Updates mixed with queries also rule out a difference array.",
        },
        {
          kind: "reveal",
          prompt: "Edges are deleted one at a time. After each deletion, you must print the number of connected groups. Why process the deletions backwards?",
          answer:
            "A DSU can merge groups fast but cannot split them. Read all the deletions first, start from the final graph, and add the edges back in reverse order. Each \"add\" is a cheap DSU union, and you record the answers in reverse.",
        },
        {
          kind: "summary",
          points: [
            "Step 4: one trigger phrase picks the winner among the two or three candidates left.",
            "Modulus → counting (DP, nCr, contribution); division mod prime → pow(x, MOD − 2, MOD).",
            "10^18 → O(log); one x ≤ 10^12 → √x; values ≤ 10^6 → sieve; XOR/AND/OR → per bit.",
            "Sum over all pairs or subarrays → contribution. Exactly k → atMost(k) − atMost(k − 1).",
            "Min of a max → binary search on the answer. Static queries → precompute; with updates → Fenwick or segment tree; deletions → reverse time with DSU.",
          ],
        },
      ],
    },

    /* ------------------------------------------------------------------ L6 */
    {
      id: "ch09-l6",
      title: "Signal words, part 2, and a drill",
      goal: "Know the signals for tiny n, strings, graphs, trees, games and constructive problems, then drill them.",
      minutes: 12,
      steps: [
        {
          kind: "read",
          title: "Four more groups",
          body:
            "The second half of the dictionary has four groups: **tiny n**, **strings**, **graphs and trees**, and **constructive problems and games**.\n\nEach group is taught with one small example. At the end there is a short drill. Say your answer out loud before you tap.",
        },
        {
          kind: "read",
          title: "Tiny n",
          body:
            "A tiny n is the loudest signal there is. n ≤ 20: try every subset, or a DP over subsets (a **[[bitmask]]**). n ≤ 10: every permutation.\n\nn ≤ 40 is the odd one: 2^40 is too big, but **[[meet in the middle]]** splits it into two halves of 2^20. Sort one half and binary search into it from the other.",
          visual: {
            kind: "table",
            headers: ["Signal", "Think first", "Check"],
            rows: [
              ["\"n ≤ 20\"", "Bitmask: all subsets, or DP over subsets", "2^20 ≈ 10^6 states"],
              ["\"n ≤ 40\"", "Meet in the middle: two halves of 2^20", "Sort one half, binary search from the other"],
              ["\"n ≤ 10\" (or 8, 9)", "All permutations", "10! ≈ 3.6·10^6"],
              ["\"Permutation of 1..n\"", "Position array pos[v]; cycles of i → p[i]", "Any-two swaps = n − cycles; adjacent swaps = inversions"],
            ],
          },
        },
        {
          kind: "read",
          title: "Permutations are cycles",
          body:
            "In a permutation, follow i → p[i] and you always come back to the start. Those loops are **cycles**.\n\np = [2, 3, 1, 5, 4] (1-indexed) has two cycles: 1 → 2 → 3 → 1, and 4 → 5 → 4.\n\nIf you may swap **any two** elements, each swap can fix one element of a cycle, so sorting takes n − cycles = 5 − 2 = **3** swaps. If only **adjacent** swaps are allowed, the answer is the number of **inversions** (pairs out of order) instead.",
          visual: {
            kind: "graph",
            nodes: [
              { id: "1", x: 15, y: 25, tone: "accent" },
              { id: "2", x: 40, y: 25, tone: "accent" },
              { id: "3", x: 27, y: 75, tone: "accent" },
              { id: "4", x: 70, y: 50, tone: "good" },
              { id: "5", x: 90, y: 50, tone: "good" },
            ],
            edges: [
              { from: "1", to: "2", directed: true },
              { from: "2", to: "3", directed: true },
              { from: "3", to: "1", directed: true },
              { from: "4", to: "5", directed: true },
              { from: "5", to: "4", directed: true },
            ],
            caption: "p = [2, 3, 1, 5, 4]: two cycles, so 3 swaps of any two elements.",
          },
        },
        {
          kind: "read",
          title: "Strings, part 1",
          body:
            "**Palindrome:** two ends moving inward, or expand around each centre. A palindromic *subsequence* is an interval DP instead.\n\n**Lexicographically smallest** result you build: greedy from left to right, taking the smallest choice that keeps the rest possible.\n\n**[[Subsequence|subsequence]]** (keeps order, may skip) is not **[[substring]]** (contiguous). Substring → window, hash, prefix function.",
          visual: {
            kind: "table",
            headers: ["Signal", "Think first", "Check"],
            rows: [
              ["\"Palindrome\"", "Two ends inward; expand around each centre O(n^2); is_pal table for DP; prefix function for \"palindromic prefix\"", "Palindromic subsequence = interval DP (or LCS with the reverse)"],
              ["\"Lexicographically smallest\" result you build", "Greedy left to right: smallest choice that keeps the rest feasible", "Deleting characters → monotonic stack; dependencies → topological sort with a min-heap"],
              ["\"Subsequence\" (not substring)", "2-D DP over (i, j); greedy two pointers to test \"is s a subsequence of t\"; increasing → LIS with bisect", "Substring = contiguous = window, hash or prefix function"],
            ],
          },
        },
        {
          kind: "read",
          title: "Strings, part 2, and circular arrays",
          body:
            "Pattern **occurrences**, a **period** or a **border** → [[prefix function]] or Z-function. Many substring comparisons → a **[[rolling hash]]** of prefixes, with a random base.\n\nA **circular** array: double it, or use total minus the best non-wrapping opposite. The maximum circular subarray is max(Kadane, total − minimum subarray), unless every value is negative.",
          visual: {
            kind: "table",
            headers: ["Signal", "Think first", "Check"],
            rows: [
              ["Pattern occurrences, \"period\", \"border\"", "Prefix function or Z-function", "On LeetCode, repeated str.find is often enough"],
              ["Many substring comparisons", "Rolling hash on prefixes", "Use a random base; fixed bases get hacked on Codeforces"],
              ["\"Circular\" array", "Double the array, or total − (best non-wrapping opposite)", "Max circular subarray = max(Kadane, total − min subarray), unless all values are negative"],
            ],
          },
          callout: {
            type: "trap",
            text: "On Codeforces, other users can attack (\"hack\") your solution with inputs built against a fixed hash base. Pick the base at random when the program starts.",
          },
        },
        {
          kind: "read",
          title: "Graphs and trees",
          body:
            "Edge weights only 0 or 1 sit between plain BFS (all weights equal) and Dijkstra (any weights): use **[[0-1 BFS]]** with a deque.\n\n\"At most k stops\" → [[Bellman-Ford]] for k + 1 rounds. \"For every node\" of a tree → **[[rerooting]]**: one pass down, one pass up, instead of n traversals. Paths in a directed graph with no cycles → DP in topological order.",
          visual: {
            kind: "table",
            headers: ["Signal", "Think first", "Check"],
            rows: [
              ["Edge weights only 0 or 1", "0-1 BFS with a deque", "Between plain BFS and Dijkstra"],
              ["\"At most k stops / edges\"", "Bellman-Ford for k + 1 rounds, or BFS over (node, used)", "Plain Dijkstra on the node alone is wrong"],
              ["Shortest path + extra condition (keys, fuel, one free edge)", "BFS or Dijkstra over states (node, extra)", "States = n × (extra values)"],
              ["\"For every node\" of a tree", "Rerooting DP: one pass down, one pass up", "Naive = n traversals = O(n^2)"],
              ["Count paths / longest path, directed, no cycles", "DP in topological order", "\"No cycles\" is the hint"],
            ],
          },
        },
        {
          kind: "read",
          title: "Shortest path with an extra condition",
          body:
            "Say you may use **one free edge** on a weighted shortest path. The node alone does not tell you enough: you also need to know whether the free edge is used.\n\nSo make each **state** a pair (node, used). Below, layer 0 is \"not used yet\" and layer 1 is \"used\". The dashed edges cost 0 and move you down a layer. Run Dijkstra on the 2n states.",
          visual: {
            kind: "graph",
            nodes: [
              { id: "A0", label: "A,0", x: 10, y: 20, tone: "accent" },
              { id: "B0", label: "B,0", x: 50, y: 20 },
              { id: "C0", label: "C,0", x: 90, y: 20 },
              { id: "A1", label: "A,1", x: 10, y: 80 },
              { id: "B1", label: "B,1", x: 50, y: 80 },
              { id: "C1", label: "C,1", x: 90, y: 80, tone: "good" },
            ],
            edges: [
              { from: "A0", to: "B0", w: 5, directed: true },
              { from: "B0", to: "C0", w: 7, directed: true },
              { from: "A1", to: "B1", w: 5, directed: true },
              { from: "B1", to: "C1", w: 7, directed: true },
              { from: "A0", to: "B1", w: 0, directed: true, dashed: true },
              { from: "B0", to: "C1", w: 0, directed: true, dashed: true },
            ],
            caption: "States (node, used). Best from A to C: pay 5, then use the free edge: 5.",
          },
        },
        {
          kind: "read",
          title: "Constructive problems and games",
          body:
            "\"Is it possible\" with an operation allowed **any number of times** → find an **[[invariant]]**: something the operation never changes (parity, sum mod k, the sorted multiset, gcd). Try n = 1, 2, 3 by hand first.\n\n\"Print any\" → solve small cases by hand and look for a pattern; write a checker. \"Print −1 if impossible\" → find the exact impossible condition first.",
          visual: {
            kind: "table",
            headers: ["Signal", "Think first", "Check"],
            rows: [
              ["\"Is it possible\" + \"any number of times\"", "Find an invariant: parity, sum mod k, sorted multiset, gcd", "Try n = 1, 2, 3 by hand first"],
              ["\"If there are several answers, print any\"", "Constructive: solve small cases by hand, find a pattern; often a sort or a fixed pattern", "Write a checker"],
              ["\"Print −1 if impossible\"", "Find the exact impossible condition first, then construct", "The condition is often the whole problem"],
              ["\"Both players play optimally\"", "Win/lose DP from the end positions; for big n, compute small n and find the pattern", "Parity is the usual pattern"],
              ["Two arrays, pair them up to minimize differences", "Sort both + two pointers or greedy matching", "Exchange argument"],
            ],
          },
        },
        {
          kind: "read",
          title: "Worked example: an invariant",
          body:
            "A deck card: *\"Operation: add 2 to any one element, as often as you like. Can all elements become equal?\"*\n\nAdding 2 never changes whether a number is odd or even. So parity is the invariant. If all elements have the same parity, keep adding 2 to the smaller ones: **YES**. If one is odd and one is even, they can never meet: **NO**.",
          visual: {
            kind: "array",
            rows: [
              { label: "YES", items: [3, 7, 5], tones: { 0: "good", 1: "good", 2: "good" } },
              { label: "NO", items: [2, 5], tones: { 0: "bad", 1: "warn" } },
            ],
            caption: "All odd → YES. One even and one odd → NO.",
          },
        },
        {
          kind: "read",
          title: "Drill time",
          body:
            "Now six quick lines, mixed from both halves of the dictionary. For each one:\n- find the **signal** in the line,\n- say the technique out loud,\n- then tap.\n\nIf you are unsure, use \"teach me\" before you guess.",
        },
        {
          kind: "quiz",
          teach: "Division under a prime modulus is done by multiplying by the inverse, which Fermat's little theorem gives as a power of the number.",
          prompt: "\"Print a / b modulo 998244353.\" What do you compute?",
          options: ["a * pow(b, MOD − 2, MOD) % MOD", "(a // b) % MOD", "a % MOD / b % MOD"],
          answer: 0,
          explain: "Signal: division under a prime modulus. Multiply by the modular inverse pow(b, MOD − 2, MOD). Integer division is wrong once a has been reduced mod MOD.",
        },
        {
          kind: "quiz",
          teach: "Tiny n picks the method: 20 → all subsets, 40 → two halves of 20 each.",
          prompt: "\"n ≤ 40, values up to 10^9. Choose a subset whose sum is closest to S.\" What fits?",
          options: ["Try all 2^40 subsets", "Meet in the middle", "Knapsack DP over the sum"],
          answer: 1,
          explain: "Signal: n ≤ 40. 2^40 ≈ 10^12 is too slow, and values up to 10^9 rule out a DP over the sum. Two halves of 2^20, sort one, binary search from the other.",
        },
        {
          kind: "read",
          title: "Notice the signal",
          body:
            "In both lines the **numbers** decided it, not the story. \"998244353\" announced modular arithmetic. \"n ≤ 40\" with huge values ruled out both brute force and a sum DP.\n\nThat is why step 1 of the scan reads the constraints first.",
        },
        {
          kind: "quiz",
          teach: "When every edge costs either 0 or 1, a deque replaces Dijkstra's heap: cost-0 moves go to the front, cost-1 moves go to the back.",
          prompt: "Deck card: \"Each grid cell has an arrow. Following it costs 0, changing it costs 1. Minimum cost from top-left to bottom-right. (100 × 100)\"",
          options: ["Plain BFS", "0-1 BFS with a deque", "Bellman-Ford"],
          answer: 1,
          explain: "Signal: edge costs are only 0 or 1. 0-1 BFS, O(nm). Plain BFS ignores the free moves; Bellman-Ford is far slower.",
        },
        {
          kind: "quiz",
          teach: "For games, solve small positions with a win/lose DP from the end. If n is too big for that, compute the small answers and look for a pattern.",
          prompt: "\"Both players play optimally. There are n ≤ 10^18 stones.\" What do you do first?",
          options: ["Win/lose DP over every n up to 10^18", "Compute small n with a win/lose DP and find the pattern", "Backtracking over all moves"],
          answer: 1,
          explain: "Signal: \"both players play optimally\" plus a huge n. Any loop to 10^18 is dead, so compute small n and find the pattern. Parity is the usual one.",
        },
        {
          kind: "read",
          title: "Notice the signal",
          body:
            "Two different signals, both from the graphs-and-games groups. \"Only 0 or 1\" is about *edge costs*. \"Play optimally\" with a huge n is about *finding a pattern* from small cases.\n\nTwo more lines to finish.",
        },
        {
          kind: "quiz",
          teach: "Subsequence keeps the order but may skip characters. To test whether one string is a subsequence of another, you can walk both strings once.",
          prompt: "\"Is s a subsequence of t?\" (|s|, |t| ≤ 10^5). What fits?",
          options: ["2-D DP over (i, j)", "Greedy two pointers", "Rolling hash"],
          answer: 1,
          explain: "Signal: \"is s a subsequence of t\". Walk t once, moving a pointer in s on each match. O(|t|). A 2-D DP would be 10^10 cells.",
        },
        {
          kind: "quiz",
          teach: "A circular array wraps around. The best wrapping subarray is everything except the worst non-wrapping one.",
          prompt: "\"The array is circular. Find the maximum subarray sum.\" Which formula?",
          options: [
            "max(Kadane, total − minimum subarray), unless every value is negative",
            "Kadane on the array as it is",
            "total − maximum subarray",
          ],
          answer: 0,
          explain: "Signal: \"circular\". The best answer either does not wrap (Kadane) or wraps (total minus the minimum subarray). If all values are negative, the second would be an empty subarray, so use Kadane alone.",
        },
        {
          kind: "summary",
          points: [
            "n ≤ 20 → bitmask; n ≤ 40 → meet in the middle; n ≤ 10 → permutations; permutation → cycles (any-two swaps = n − cycles).",
            "Palindrome, lexicographically smallest, subsequence vs substring, prefix function, rolling hash (random base), circular arrays.",
            "0/1 weights → 0-1 BFS; at most k stops → Bellman-Ford k + 1 rounds; extra condition → states (node, extra); every node of a tree → rerooting; DAG → DP in topological order.",
            "Any number of times → invariant; print any → small cases + checker; −1 → the impossible condition; games → small n pattern.",
            "The numbers usually decide it. Read them first.",
          ],
        },
      ],
    },

    /* ------------------------------------------------------------------ L7 */
    {
      id: "ch09-l7",
      title: "The daily drill protocol",
      goal: "Run the 20-card warm-up, score it honestly, follow the test calendar and keep the deck mixed.",
      minutes: 10,
      steps: [
        {
          kind: "read",
          title: "20 cards, 10 minutes, every day",
          body:
            "The warm-up is the first 10 minutes of every daily block (0:00–0:10). It has four moves: **draw**, **read and say**, **flip**, **log**.\n\nThe Gym page (#gym) runs it for you with the full 150-card deck. This lesson explains the rules it follows, so you can trust your score.",
          visual: {
            kind: "flow",
            spec: {
              nodes: [
                { id: "d", label: "Draw", sub: "20 cards", col: 0, row: 0 },
                { id: "r", label: "Read and say", sub: "15-second count", col: 1, row: 0 },
                { id: "f", label: "Flip", sub: "mark it", col: 2, row: 0 },
                { id: "l", label: "Log", sub: "one line per miss", col: 3, row: 0 },
              ],
              edges: [
                { from: "d", to: "r" },
                { from: "r", to: "f" },
                { from: "f", to: "l" },
              ],
            },
          },
        },
        {
          kind: "read",
          title: "Draw: only days before today",
          body:
            "Each card has a **day tag**, like D6: the earliest day the card is fair, because by the end of Day 6 you have studied every technique it needs.\n\nDraw 20 cards whose tag is **before today**. On Day 12, draw from D1–D11. Start with yesterday's misses, then fill the rest at random.",
          visual: {
            kind: "array",
            rows: [
              {
                label: "day tag",
                items: ["D1", "D2", "D3", "D4", "D5", "D6", "D8", "D9", "D10", "D11", "D12"],
                ranges: [{ from: 0, to: 9, tone: "good", label: "draw from these" }],
                pointers: [{ at: 10, label: "today", tone: "bad" }],
              },
            ],
            caption: "On Day 12 the pool is D1–D11. (Day 7 is a review day, so no card is tagged D7.)",
          },
        },
        {
          kind: "read",
          title: "Read and say, then flip and log",
          body:
            "**Read** the card, start a 15-second count, and **say out loud**: the pattern and the target complexity. For a DP card, also say the **state** (what dp[i] means).\n\n**Flip** to the answer and mark it.\n\n**Log** every miss in one line, so the miss turns into a lesson.",
          visual: {
            kind: "code",
            lang: "text",
            code: "Missed signal: ___. It meant: ___.\n\nMissed signal: \"values can be negative\". It meant: prefix sum + map, not a window.",
            caption: "The one-line miss log.",
          },
        },
        {
          kind: "quiz",
          teach: "A card's day tag is the earliest day it is fair. The warm-up draws only cards tagged before today.",
          prompt: "It is Day 9. Which cards may you draw?",
          options: ["Cards tagged D1–D8", "Cards tagged D1–D9", "Only cards tagged D9", "Any card in the deck"],
          answer: 0,
          explain: "Before today means up to Day 8. Today's topic is not finished yet, so its cards are not fair.",
        },
        {
          kind: "read",
          title: "The early days",
          body:
            "On Day 1 the deck has nothing for you yet. On Days 2–3 it has only 7–13 cards.\n\nFill the rest of the 20 with the **15-second clues** from the lessons you have done. Read the left side of a clue (\"next greater\", \"minimum capacity so that it works\") and say the right side. Then add your own new cards.",
        },
        {
          kind: "read",
          title: "Scoring: both rules, or it is a miss",
          body:
            "A card is **correct only if both are true**:\n- The pattern matches the answer (an alternative in the key's parentheses counts), **and** you said the right target complexity.\n- You said it **within 15 seconds**.\n\n\"I would have got it with more time\" is a miss. Speed *is* the skill.",
          callout: {
            type: "mistake",
            text: "Marking a slow right answer as correct. It feels fair, but it hides exactly the weakness the gym is meant to fix.",
          },
        },
        {
          kind: "quiz",
          teach: "A card counts only if the pattern and the target complexity are right and you said them within 15 seconds.",
          prompt: "You say \"binary search on the answer, O(n log sum)\" after 19 seconds. It matches the key. How do you mark it?",
          options: ["Correct", "Miss", "Half a point"],
          answer: 1,
          explain: "Right answer, but over 15 seconds. That is a miss. Log it like any other miss.",
        },
        {
          kind: "read",
          title: "Two numbers, every time",
          body:
            "Record two numbers after every session: **% correct** and **average seconds per card**.\n\nExample: 20 cards, 16 correct within 15 seconds, 220 seconds in total. Then % correct = 16 ÷ 20 = **80%**, and the average = 220 ÷ 20 = **11 seconds**.\n\nOn test days, enter both in the Tracker (#tracker).",
          visual: {
            kind: "stats",
            items: [
              { value: "80%", label: "correct", note: "16 of 20" },
              { value: "11 s", label: "average per card", note: "220 s ÷ 20" },
            ],
          },
        },
        {
          kind: "number",
          teach: "% correct = correct cards ÷ cards drawn × 100.",
          prompt: "You drew 30 cards. 21 were correct within 15 seconds. What is your % correct?",
          answer: 70,
          tolerance: 0.5,
          unit: "%",
          explain: "21 ÷ 30 = 0.7, so 70%.",
        },
        {
          kind: "read",
          title: "The deck's four blocks",
          body:
            "The deck has four **blocks**, one per week, so you can find your pool quickly. Cards are shuffled within each block, and no two neighbours share a day.\n\nThe block names matter for the tests on the next step.",
          visual: {
            kind: "table",
            headers: ["Block", "Cards", "Days", "Topics"],
            rows: [
              ["A", "1–42", "D1–D6", "Hashing, two pointers, sorting, window, prefix sums, stacks, binary search"],
              ["B", "43–88", "D8–D14", "Greedy, intervals, heaps, backtracking, trees, graphs, topological sort, DSU, Dijkstra, MST"],
              ["C", "89–118", "D15–D20", "DP: 1-D, grid, strings, knapsack, LIS, interval, bitmask, digit, tree, DAG, state machine"],
              ["D", "119–150", "D22–D27", "Modular math, number theory, contribution, bits, Fenwick/segment tree, string algorithms, constructive"],
            ],
          },
        },
        {
          kind: "read",
          title: "The test calendar",
          body:
            "Every review day has a recognition test. The baseline on Day 0 has no target: you want an honest number to compare against.\n\nDay 21 tests DP only, and there the **state** is required. The final exam on Day 30 is 100 cards.",
          visual: {
            kind: "table",
            headers: ["Day", "Test", "Draw", "Target"],
            rows: [
              ["Day 0", "Baseline", "20 random cards from the whole deck, cold. Write down which 20", "None. Honest number"],
              ["Day 7", "Test #1", "30 cards from block A, the ones you've seen least", "≥ 75%"],
              ["Day 14", "Test #2", "30 cards tagged up to D14; at least 20 from block B", "≥ 75%"],
              ["Day 21", "Test #3, DP only", "Chapter 6's DP test. For a second round that week: all 30 cards of block C. The state is required", "Chapter 6 sets it"],
              ["Day 28", "Test #4", "15 cards from block D + 15 from blocks A–C", "≥ 80%"],
              ["Day 30", "Final exam", "100 cards from the full deck, at least 20 from block D", "≥ 85% (Chapter 8)"],
            ],
          },
        },
        {
          kind: "read",
          title: "Interleave, always",
          body:
            "- **Never drill one topic in a row.** Not 10 window cards and then 10 stack cards. The deck is pre-shuffled for this reason. Shuffle your own cards too.\n- **The only exception is Day 21**, the DP-only test. There the question is not \"is it DP?\" but \"which DP, with which state?\", and a mixed deck cannot test that.\n- **Mix old with new.** About half of each warm-up should come from more than a week ago. That is spacing.",
        },
        {
          kind: "quiz",
          teach: "Warm-ups are mixed (interleaving), drawn only from days before today, and about half come from more than a week ago (spacing).",
          prompt: "It is Day 16. Which warm-up follows the rules?",
          options: [
            "20 DP cards tagged D15–D16, in order",
            "About 10 cards from more than a week ago and 10 recent ones, shuffled",
            "10 window cards, then 10 heap cards",
          ],
          answer: 1,
          explain: "Mixed, all tagged before Day 16, and about half older than a week. The first option includes today's tag and is one topic; the third is blocked.",
        },
        {
          kind: "widget",
          widget: "triage",
          title: "Try a few deck cards",
          task: "Run the 4-step scan on a few deck cards. Say the pattern and the target out loud within 15 seconds, then flip. The full daily 20-card warm-up lives on the Gym page.",
          props: { mode: "cards" },
        },
        {
          kind: "summary",
          points: [
            "Daily warm-up: draw 20 cards tagged before today, read and say pattern + target (and the state for DP), flip, log each miss in one line.",
            "Correct = right pattern and target, within 15 seconds. Slow is a miss.",
            "Record % correct and average seconds. Enter them in the Tracker on test days.",
            "Tests on Days 0, 7, 14, 21 (DP only), 28 and the 100-card final on Day 30 (target ≥ 85%).",
            "Always interleave, except the DP-only test. About half of each warm-up from more than a week ago.",
            "The Gym page (#gym) runs the warm-up for you.",
          ],
        },
      ],
    },

    /* ------------------------------------------------------------------ L8 */
    {
      id: "ch09-l8",
      title: "Write your own cards",
      goal: "Write a good card, write a twin for every miss, and know what to do when a card keeps failing.",
      minutes: 10,
      steps: [
        {
          kind: "read",
          title: "Every solved problem becomes a card",
          body:
            "Every problem you solve or **[[upsolve]]** (solve after the contest or time box, with help) produces one card. Aim for at least 3 new cards a day.\n\nContest problems make the best cards, because nobody told you their topic. You had to recognise it, or miss it, for real.",
        },
        {
          kind: "read",
          title: "Rules 1 and 2: own words, keep the constraint",
          body:
            "**Rule 1.** Your own words, one line. No problem name, and no pattern word (\"window\", \"heap\", \"DP\", \"graph\"). Those would give the answer away.\n\n**Rule 2.** Keep the constraint that decided it: \"n ≤ 20\", \"values can be negative\", \"N ≤ 10^18\". Without it the card has no signal.",
          visual: {
            kind: "compare",
            left: { title: "Bad card", points: ["\"Split array largest sum, binary search\"", "Problem name", "Pattern word", "No constraint"] },
            right: { title: "Good card", points: ["\"Cut a list into k contiguous groups so the largest group sum is smallest. (n ≤ 10^5)\"", "Own words", "No pattern word", "The deciding constraint"] },
          },
        },
        {
          kind: "read",
          title: "Rules 3 and 4: the back, and the day tag",
          body:
            "**Rule 3.** The back side, in this order: **pattern**, **target complexity**, **trigger**. The same format as the deck's answers.\n\n**Rule 4.** Tag the card with today's day number, so the warm-up rule (draw only days before today) still works.",
          visual: {
            kind: "code",
            lang: "text",
            code: "FRONT: Cut a list into k contiguous groups so the largest group sum is smallest. (n ≤ 10^5)   [D6]\nBACK:  binary search on the answer + greedy cut check, O(n log sum) | \"minimize the maximum\"",
            caption: "One card. The day tag is at the end of the front.",
          },
        },
        {
          kind: "quiz",
          teach: "A good front is one line in your own words, with no problem name, no pattern word, and the constraint that decided the answer.",
          prompt: "Which card front follows the rules?",
          options: [
            "Sliding window: longest substring with no repeats",
            "Longest stretch of a string with no letter used twice. (|s| ≤ 5·10^4)",
            "Longest Substring Without Repeating Characters (LeetCode)",
          ],
          answer: 1,
          explain: "The first gives away the pattern word. The third is the problem name and has no constraint. The second is own words plus the constraint.",
        },
        {
          kind: "read",
          title: "Rule 5: a twin for every miss",
          body:
            "**Rule 5.** For every miss, write a **twin**. A twin keeps the same story but changes **one constraint**, and that change changes the answer.\n\nTwins train the hardest part of recognition: telling close patterns apart. The deck already has several twin pairs. The next steps compare four of them side by side.",
        },
        {
          kind: "read",
          title: "Twin pair: window or prefix sum?",
          body:
            "Same story, \"a subarray with some sum\". One changed constraint flips the method.\n\nWith **all positive** values, growing a window always raises the sum, so you can shrink it safely: a **window**. With **negatives**, a longer window can have a smaller sum, so the shrink rule breaks: **prefix sum + map**.",
          visual: {
            kind: "compare",
            left: { title: "Shortest subarray with sum ≥ S; every value positive", points: ["Variable window", "Shrink while sum ≥ S", "O(n)"] },
            right: { title: "Count subarrays with sum exactly k; values can be negative", points: ["Prefix sum + map of earlier sums", "\"exactly k\" + negatives", "O(n)"] },
          },
        },
        {
          kind: "read",
          title: "Twin pair: DP over weight or over value?",
          body:
            "Both are 0/1 [[knapsack]]: take or leave each item, at most once. Index the DP by whichever number is **small**.\n\nCapacity W ≤ 10^5 → dp[weight] = best value, O(nW).\n\nCapacity up to 10^9, but every value ≤ 1000 → swap roles: dp[value] = smallest weight, O(n·Σv).",
          visual: {
            kind: "compare",
            left: { title: "n ≤ 100, W ≤ 10^5", points: ["dp[w] = best value", "Loop w downward", "O(nW)"] },
            right: { title: "n ≤ 100, W ≤ 10^9, values ≤ 1000", points: ["dp[value] = minimum weight", "Index by value", "O(n·Σv)"] },
          },
        },
        {
          kind: "quiz",
          teach: "A DP must be indexed by a number small enough to make a table of. In knapsack you can index by weight or by value, whichever is small.",
          prompt: "Which single change turns the \"DP over weight\" knapsack card into the \"DP over value\" card?",
          options: [
            "The capacity grows to 10^9 while every value stays ≤ 1000",
            "n grows from 100 to 10^5",
            "Each item may be used many times",
          ],
          answer: 0,
          explain: "A capacity of 10^9 makes dp[weight] impossible. Values are still small, so dp[value] = minimum weight works.",
        },
        {
          kind: "read",
          title: "Twin pair: grid DP or a formula?",
          body:
            "Count right/down paths across a grid.\n\nWith **blocked cells** and m, n ≤ 100: a grid DP, each cell = up + left, 0 on a block.\n\nWith **no blocks** but h, w ≤ 10^5: a table of 10^10 cells is too big. Every path is h − 1 downs and w − 1 rights in some order, so the count is **C(h + w − 2, h − 1)**. For 3 × 3: C(4, 2) = 6, the same as the corner cell.",
          visual: {
            kind: "grid",
            cells: [
              [1, 1, 1],
              [1, 2, 3],
              [1, 3, 6],
            ],
            tones: { "2,2": "good" },
            arrows: [
              { from: [1, 2], to: [2, 2], tone: "accent" },
              { from: [2, 1], to: [2, 2], tone: "accent" },
            ],
            caption: "3 × 3 grid DP: 6 paths = C(4, 2).",
          },
        },
        {
          kind: "read",
          title: "Twin pair: cycles or inversions?",
          body:
            "Sort a permutation with the fewest swaps.\n\nSwaps of **any two** elements → count **cycles**: n − cycles.\n\n**Adjacent** swaps only → count **inversions**: pairs i < j with a[i] > a[j]. Each adjacent swap fixes exactly one inversion.\n\nFor [4, 3, 2, 1]: two cycles (1 ↔ 4, 2 ↔ 3), so 2 swaps of any two. But all 6 pairs are inversions, so 6 adjacent swaps.",
          visual: {
            kind: "array",
            indices: true,
            rows: [{ label: "p", items: [4, 3, 2, 1], tones: { 0: "accent", 3: "accent", 1: "good", 2: "good" } }],
            caption: "Same input, two answers: 2 (any swaps) vs 6 (adjacent swaps).",
          },
        },
        {
          kind: "quiz",
          teach: "Any-two swaps are counted with cycles. Adjacent swaps each fix exactly one out-of-order pair.",
          prompt: "Swaps are allowed only between neighbours. Which count gives the fewest swaps to sort?",
          options: ["n − number of cycles", "The number of inversions", "n − 1"],
          answer: 1,
          explain: "Each adjacent swap removes exactly one inversion, so you need exactly as many swaps as there are inversions.",
        },
        {
          kind: "read",
          title: "An optional drill script",
          body:
            "The Gym page does all of this in your browser. If you also keep cards in a **tab-separated** file (number, day, front, back), this short script draws and times them. Pass the **day before today** and how many cards to draw.\n\nNote the scoring line: a card counts only if you marked it right **and** it took 15 seconds or less.",
          visual: {
            kind: "code",
            lang: "python",
            code:
              "# drill.py   usage: python3 drill.py 11 20   (draw 20 cards tagged up to Day 11)\nimport random, sys, time\n\ndef main():\n    day, count = int(sys.argv[1]), int(sys.argv[2])\n    pool = []\n    with open(\"cards.tsv\") as f:\n        for line in f:\n            parts = line.rstrip(\"\\n\").split(\"\\t\")\n            if len(parts) == 4 and int(parts[1]) <= day:\n                pool.append(parts)\n    drawn = random.sample(pool, min(count, len(pool)))\n    if not drawn:\n        print(\"no cards up to that day\")\n        return\n    hits, total, missed = 0, 0.0, []\n    for num, _, front, back in drawn:\n        print(f\"\\n#{num}  {front}\")\n        start = time.time()\n        input(\"  answer out loud, then press Enter \")\n        secs = time.time() - start\n        total += secs\n        print(f\"  {secs:.1f}s  ->  {back}\")\n        right = input(\"  right? [y/n] \").strip().lower() == \"y\"\n        if right and secs <= 15:\n            hits += 1\n        else:\n            missed.append(num)\n    print(f\"\\n{hits}/{len(drawn)} correct, avg {total / len(drawn):.1f}s, missed: {missed}\")\n\nmain()",
            caption: "Optional. The Gym page (#gym) already does this.",
          },
        },
        {
          kind: "read",
          title: "When a card keeps failing",
          body:
            "A card that keeps failing is telling you something. What it tells you depends on how it fails.\n\nThe last row surprises people: a card that is *too easy* can also be a problem. If you answer in 3 seconds every time, you may be remembering the card's wording, not the signal. Contests are the real test, because there the wording is new.",
          visual: {
            kind: "table",
            headers: ["What happens", "What to do"],
            rows: [
              ["Missed twice in a row", "Reread the matching clue or dictionary row, then write a twin for the card"],
              ["Missed three times", "It is not recognition: you don't know the technique well enough. Solve one real problem of that type from the day's list before you drill the card again"],
              ["Right every time and under 5 seconds", "You may be remembering the card, not the signal. Rewrite it in different words"],
            ],
          },
        },
        {
          kind: "quiz",
          teach: "Two misses mean reread and write a twin. Three misses mean the technique itself is weak, so drilling the card more will not fix it.",
          prompt: "You have missed the same card three times. What next?",
          options: ["Drill it ten more times today", "Solve one real problem of that type before drilling it again", "Delete the card"],
          answer: 1,
          explain: "After three misses the problem is not recognition. You need to understand the technique better, and solving a real problem does that.",
        },
        {
          kind: "reveal",
          prompt: "One card is right every time, in about 3 seconds. Is that good news?",
          answer:
            "Not necessarily. Under 5 seconds every time can mean you have memorised the card's words instead of learning the signal. Rewrite it in different words and see if it still fires.",
        },
        {
          kind: "summary",
          points: [
            "Every solved or upsolved problem → one card; at least 3 a day. Contest problems make the best cards.",
            "Front: own words, one line, no problem name or pattern word, keep the deciding constraint, day tag.",
            "Back: pattern, target complexity, trigger.",
            "Every miss → a twin that changes one constraint and so the answer.",
            "Missed twice → reread + twin. Missed three times → solve a real problem first. Always under 5 s → rewrite it.",
            "Each day: log 1 mistake and add 3 cards. Drill on the Gym page, track in the Tracker.",
          ],
        },
      ],
    },

    /* ------------------------------------------------------------------ L9 */
    {
      id: "ch09-l9",
      title: "Checkpoint: the recognition gym",
      goal: "Check that you can explain how recognition is built, run the scan and use the drill protocol.",
      minutes: 9,
      steps: [
        {
          kind: "read",
          title: "Here is what this chapter covered",
          body:
            "- Recognition is **pattern memory**: stored chunks, built by retrieval, spacing and interleaving.\n- Your 15-second answer is a **hypothesis**: test it for 2 minutes before you code.\n- The **scan**: n and values → what it wants back → input shape → one trigger phrase.\n- The **signal words** dictionary for contest problems.\n- The **drill protocol**: 20 cards a day, strict scoring, a test calendar, always mixed.\n- **Your own cards**, twins, and what to do when a card keeps failing.",
        },
        {
          kind: "quiz",
          teach: "In the chess studies, strong players lost their advantage on random boards. What they had was stored familiar groups.",
          prompt: "Why do strong competitors recognise problems so fast?",
          options: ["They have stored many chunks linked to techniques", "They read faster", "They are better at maths in general"],
          answer: 0,
          explain: "Recognition is pattern memory. A strong competitor reads a phrase as one chunk that is already linked to a technique.",
        },
        {
          kind: "quiz",
          teach: "Rohrer, Dedrick and Burgess compared mixed practice with practice on one type at a time, on a delayed test.",
          prompt: "In that study, mixed practice scored 72% on a delayed test. What did blocked practice score?",
          options: ["70%", "55%", "38%"],
          answer: 2,
          explain: "38%. Blocked practice gives the method away, so students never practised choosing it.",
        },
        {
          kind: "quiz",
          teach: "The thinking move: name the pattern fast, then try to break it with two checks before you code.",
          prompt: "After naming a pattern in 15 seconds, what do you do next?",
          options: [
            "Start coding right away",
            "Spend about 2 minutes trying to break it: complexity fit and a tiny case",
            "Read the editorial",
          ],
          answer: 1,
          explain: "A wrong guess you test costs 2 minutes; a wrong guess you code costs 30.",
        },
        {
          kind: "match",
          teach: "Use the constraint table: tiny n allows exponential work, mid n allows square work, large n allows n log n, and huge n allows only logarithmic work.",
          prompt: "Match each largest n to its budget in Python.",
          pairs: [
            ["n ≤ 20", "O(2^n·n)"],
            ["n ≤ 5000", "O(n^2), PyPy"],
            ["n ≤ 2·10^5", "O(n log n)"],
            ["n ≤ 10^18", "O(log n)"],
          ],
          explain: "These are the rows of the constraint table. 2^20·20 ≈ 2·10^7, 5000^2 = 2.5·10^7, and nothing can loop to 10^18.",
        },
        {
          kind: "number",
          teach: "Time ≈ operations ÷ speed. CPython runs about 10^7 simple operations per second.",
          prompt: "n = 10^6 and your idea is O(n). About how many seconds in CPython?",
          answer: 0.1,
          tolerance: 0.02,
          unit: "s",
          explain: "10^6 ÷ 10^7 = 0.1 seconds. Fine, as long as input reading is fast.",
        },
        {
          kind: "quiz",
          teach: "The output line points to a family. Some answer types have a fixed first guess.",
          prompt: "The problem asks for the minimum possible value of the largest part. First guess?",
          options: ["Binary search on the answer", "Backtracking", "Topological order"],
          answer: 0,
          explain: "A minimum of a maximum → binary search on the answer, with a feasibility check.",
        },
        {
          kind: "quiz",
          teach: "A connected graph with n nodes and n − 1 edges has no room for a cycle.",
          prompt: "The input has n nodes and n − 1 edges, all connected. What is it?",
          options: ["A tree", "A grid", "A graph with at least one cycle"],
          answer: 0,
          explain: "n − 1 edges connecting n nodes form a tree. Think of a DFS that returns values, or a tree DP.",
        },
        {
          kind: "quiz",
          teach: "x ^ x = 0, so prefix XORs cancel the same way prefix sums subtract.",
          prompt: "With prefix XORs px (px[0] = 0), what is the XOR of a[l..r]?",
          options: ["px[r+1] ^ px[l]", "px[r] ^ px[l]", "px[r+1] − px[l]"],
          answer: 0,
          explain: "The common prefix a[0..l−1] appears in both and cancels, leaving a[l..r].",
        },
        {
          kind: "quiz",
          teach: "Union-find can join groups but not split them. When things are deleted, think about the order you process them in.",
          prompt: "Edges are removed one at a time and connectivity is asked after each removal. What do you think first?",
          options: ["Reverse time and add the edges back with DSU", "Rerun BFS after each removal", "Dijkstra"],
          answer: 0,
          explain: "DSU cannot delete, so process the removals backwards as additions.",
        },
        {
          kind: "multi",
          teach: "A card is correct only when the pattern and target complexity are right and you said them within 15 seconds.",
          prompt: "Which of these count as correct? Select all that apply.",
          options: [
            "Right pattern and target, in 9 seconds",
            "Right pattern, wrong target complexity, in 8 seconds",
            "Right pattern and target, in 22 seconds",
            "The key's alternative in parentheses, with the right target, in 14 seconds",
          ],
          answers: [0, 3],
          explain: "Both rules must hold. A wrong target or more than 15 seconds is a miss. An alternative listed in the key counts.",
        },
        {
          kind: "quiz",
          teach: "The final exam is on Day 30 and draws from the full deck.",
          prompt: "What is the Day 30 final exam?",
          options: ["100 cards, at least 20 from block D, target ≥ 85%", "30 cards from block A, target ≥ 75%", "20 random cards, no target"],
          answer: 0,
          explain: "The other two are the Day 7 test and the Day 0 baseline.",
        },
        {
          kind: "quiz",
          teach: "A twin keeps the story and changes one thing, so that the method changes.",
          prompt: "What is a twin card?",
          options: [
            "The same story with one constraint changed, so the answer changes",
            "An exact copy of a card you missed",
            "A card from the same topic on a different day",
          ],
          answer: 0,
          explain: "Twins train you to tell close patterns apart, like a window (all positive) vs prefix sum + map (negatives).",
        },
        {
          kind: "summary",
          points: [
            "Build chunks with retrieval, spacing and interleaving; never by reading answers.",
            "Scan in 15 seconds, then test the guess for 2 minutes.",
            "Budget from n, family from the output, narrower from the shape, winner from one signal.",
            "Daily: 20 mixed cards on the Gym page (#gym), strict scoring, log every miss.",
            "Each day: log 1 mistake and add 3 cards. Write a twin for every miss.",
          ],
        },
      ],
    },
  ],
};

export default ch;
