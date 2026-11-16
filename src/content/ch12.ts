import type { Chapter } from "./types";

const ch: Chapter = {
  n: 12,
  title: "Trackers",
  short: "Trackers",
  part: 6,
  hook: "The trackers show whether the month worked. Your feelings won't.",
  sources: [],
  lessons: [
    /* ------------------------------------------------------------------ */
    {
      id: "ch12-l1",
      title: "Why track: the progress table and the daily log",
      goal: "Know what to measure, when to measure it, and where this site stores it for you.",
      minutes: 7,
      steps: [
        {
          kind: "read",
          title: "Numbers, not feelings",
          body: "After a hard week you will **feel** slow. After an easy one you will feel great. Neither feeling tells you whether you improved.\n\nThe trackers do. You fill them in every day, and on Day 30 they show whether the month worked.\n\nThis site has them built in: the **Tracker** page (`#tracker`) and the **Gym** (`#gym`). Both save everything in your browser, so there is nothing to copy.",
        },
        {
          kind: "quiz",
          guess: true,
          prompt: "After two weeks, which is the better sign that you improved?",
          options: [
            "You feel quicker at spotting patterns",
            "Your average seconds per recognition card fell from 14 to 9",
            "You solved one problem that felt very hard",
          ],
          answer: 1,
          explain: "The **measured** drop from 14 to 9 seconds per card. Feelings change with mood and with how hard the week was. A number taken the same way each time shows real change.",
        },
        {
          kind: "read",
          title: "The progress table: when",
          body: "The **progress table** is your scoreboard. Fill it in on **Day 0**, then on every contest day (**Days 7, 14, 21 and 28**), then on **Day 30**.\n\nDay 0 is your baseline. Every later column is compared with it. That is why the Day 0 test matters even though the score will be low.",
          visual: {
            kind: "table",
            headers: ["Day 0", "Day 7", "Day 14", "Day 21", "Day 28", "Day 30"],
            rows: [["Baseline", "Contest day", "Contest day", "Contest day", "Contest day", "Result"]],
            caption: "Day 0 is the baseline. Day 30 is the result.",
          },
        },
        {
          kind: "read",
          title: "The progress table: what",
          body: "Nine rows. The first two come from the Gym, the rest from your problems and contests.\n\nRatings get a dash on Day 0 because you have no contest yet. Ratings are noisy for new accounts, so the problems solved and the recognition numbers matter more.",
          visual: {
            kind: "table",
            headers: ["Metric", "What it shows"],
            rows: [
              ["Recognition: % correct", "How often you name the right pattern"],
              ["Recognition: average seconds per card", "How fast the reflex is"],
              ["Timed set: problems solved / 4", "Solving under time pressure"],
              ["Total problems solved (running)", "Volume, aiming at 150–180"],
              ["LeetCode contest: solved / 4", "Contest results (not on Day 0)"],
              ["LeetCode contest rating", "Slow, noisy rating"],
              ["Codeforces rating (if rated)", "Slow, noisy rating"],
              ["Templates you can write from memory (of 12)", "Automatic code"],
              ["Re-solve queue length", "Unfinished learning"],
            ],
          },
        },
        {
          kind: "read",
          title: "The 12 templates",
          body: "The templates row counts how many of these 12 you can write from memory, without errors:\n\n- binary search on the answer · sliding window · monotonic stack\n- prefix sum + map · BFS (grid) · DFS iterative\n- DSU · topological sort · Dijkstra\n- memoized DP · Fenwick tree · fast I/O main template\n\nTest each one by typing it from a blank file.",
        },
        {
          kind: "quiz",
          teach: "The progress table is filled in on Day 0 as a baseline, on each contest day at the end of a week, and on Day 30.",
          prompt: "On which days do you fill in the progress table?",
          options: [
            "Every day",
            "Day 0, Days 7, 14, 21, 28, and Day 30",
            "Only Day 30",
            "Only after a good contest",
          ],
          answer: 1,
          explain: "**Day 0, every contest day, and Day 30.** Daily numbers go in the daily log instead.",
        },
        {
          kind: "read",
          title: "The daily log",
          body: "The **daily log** has one row per day. It records how you solved each problem, so you can see the help you needed shrink over the month.",
          visual: {
            kind: "table",
            headers: ["Column", "What you write"],
            rows: [
              ["Day and topic", "Day 1, Constraints + hashing"],
              ["Solved alone / with hint / editorial", "Three counts for today's problems"],
              ["Re-solves done", "Problems from the queue you redid today"],
              ["Cards added", "Usually 3"],
              ["Hours", "Focused hours, not time at the desk"],
              ["One-line lesson", "The single thing today taught you"],
            ],
          },
        },
        {
          kind: "read",
          title: "How the Tracker fills it for you",
          body: "In each day's practice list you mark every problem as **solved alone**, **with a hint**, **with the editorial**, or skipped. The Tracker counts these for your daily log and progress table.\n\nYou also enter your hours, and the progress table numbers on review days.\n\nEverything is saved **in this browser only**. Use the same browser each day, and don't clear this site's data.",
          callout: { type: "mistake", text: "Marking a problem \"solved\" when you read a hint first. Honest marks are the whole point: they decide what goes into the re-solve queue." },
        },
        {
          kind: "quiz",
          teach: "Every problem gets one mark: alone, with a hint, with the editorial, or skipped. The marks feed the daily log and the re-solve queue.",
          prompt: "You solved a problem after reading only the topic tag. How do you mark it?",
          options: ["Solved alone", "Solved with a hint", "Solved with the editorial", "Skipped"],
          answer: 1,
          explain: "A topic tag is a hint (step 2 of the stuck protocol). Mark it **with a hint**, which also sends it to the re-solve queue.",
        },
        {
          kind: "summary",
          points: [
            "Trackers show whether the month worked; feelings don't.",
            "Progress table: Day 0, Days 7, 14, 21, 28, and Day 30. Nine metrics, including 12 templates from memory.",
            "Daily log: one row per day, with how each problem was solved.",
            "The Tracker (#tracker) and Gym (#gym) store everything in your browser.",
          ],
        },
      ],
    },

    /* ------------------------------------------------------------------ */
    {
      id: "ch12-l2",
      title: "Journal, re-solve queue, cards and contest log",
      goal: "Write useful journal lines, run the re-solve queue, write good recognition cards and log contests.",
      minutes: 7,
      steps: [
        {
          kind: "read",
          title: "The mistake journal",
          body: "One row per Wrong Answer, TLE, or looked-up solution. The Tracker has a form for it.\n\nThe most important column is the last one: **the rule for next time**. A good rule is specific enough that you could follow it tomorrow without thinking.",
          visual: {
            kind: "table",
            headers: ["Day", "Problem", "What went wrong", "Category", "Rule for next time"],
            rows: [["3", "LC 3 Longest Substring Without Repeating Characters", "Moved left pointer to last[c], not last[c] + 1", "off-by-one", "When moving left past a duplicate, use max(left, last[c] + 1)"]],
          },
        },
        {
          kind: "read",
          title: "The eight categories",
          body: "Each line gets one category:\n\n- misread · wrong pattern · right pattern, wrong details · edge case\n- off-by-one · Python TLE · recursion depth · didn't know the technique\n\nThe categories let you count. On Day 29, the two biggest tell you what to patch.",
        },
        {
          kind: "quiz",
          teach: "A good rule is concrete and checkable: it names the exact situation and the exact fix, so you can apply it next time without thinking.",
          prompt: "Which is the best \"rule for next time\" for the LC 3 mistake?",
          options: [
            "Be more careful with pointers",
            "When moving left past a duplicate, use max(left, last[c] + 1)",
            "Practise more sliding window problems",
            "Read the problem twice",
          ],
          answer: 1,
          explain: "The specific rule names the **situation** (moving left past a duplicate) and the **fix** (max(left, last[c] + 1)). \"Be more careful\" changes nothing.",
        },
        {
          kind: "read",
          title: "The re-solve queue",
          body: "Add **every** problem you needed a hint or the editorial for. Each one comes back from a blank file on **Day +3** and **Day +7**. If the Day +7 solve is clean, it leaves the queue.\n\nFor example, LC 875 Koko Eating Bananas, solved with a hint on Day 6, returns on Day 9 and Day 13. The Tracker shows a checkbox for each re-solve.",
          visual: {
            kind: "table",
            headers: ["Problem", "First attempt", "Day +3", "Day +7", "Clean?"],
            rows: [["LC 875 Koko Eating Bananas", "Day 6 (hint)", "Day 9 ☐", "Day 13 ☐", "☐"]],
          },
        },
        {
          kind: "number",
          teach: "Re-solves are on Day +3 and Day +7, counted from the day of the first attempt.",
          prompt: "You needed the editorial for a problem on Day 12. On which day is its Day +7 re-solve?",
          answer: 19,
          tolerance: 0.5,
          unit: "day",
          explain: "Day 12 + 7 = **Day 19**. Its Day +3 re-solve is on Day 15.",
        },
        {
          kind: "read",
          title: "Recognition cards",
          body: "Each day you add 3 **recognition cards**. A card fits on one line. Write the statement **in your own words**, without the problem's name, plus the limits that matter. The back has the pattern, the reason and the complexity.",
          visual: {
            kind: "code",
            lang: "text",
            code: "FRONT: \"Longest stretch of days where you never spent more than k in total\" (n ≤ 1e5, values ≥ 0)\nBACK:  sliding window (non-negative values → shrink while sum > k), O(n)",
          },
        },
        {
          kind: "read",
          title: "Where cards live",
          body: "The Gym runs this course's **150-card deck** with a **15-second timer** and records every answer: right or wrong, and how many seconds you took. Cards you miss come back sooner.\n\nKeep your own new cards in a plain text file, a spreadsheet, or a flashcard app. If your app has a timer, turn it on so you can see whether you are under 15 seconds.",
        },
        {
          kind: "quiz",
          teach: "A card front describes the problem in your own words with its key limits, and leaves out the name, so the name can't give the answer away.",
          prompt: "Which is the best front for a recognition card?",
          options: [
            "LC 3 Longest Substring Without Repeating Characters",
            "\"Longest piece of a string with no letter used twice\" (n ≤ 5·10^4)",
            "Sliding window problem from Day 3",
            "A string problem",
          ],
          answer: 1,
          explain: "The second one: **your own words plus the limit**, with no name. A name or a topic label lets you answer from memory of the title, not from the clues.",
        },
        {
          kind: "read",
          title: "The contest log",
          body: "One row per contest. Write down the result while it's fresh, and keep it in a notes file next to your cards.\n\nThe **stuck on** and **lesson** columns matter most. Over four contests they show whether your misses move from \"no idea\" to \"wrong idea\" to \"bug\", which is real progress even when the rating doesn't move.",
          visual: {
            kind: "table",
            headers: ["Column", "Example"],
            rows: [
              ["Day and contest", "Day 7, LeetCode Weekly"],
              ["Solved", "2 of 4"],
              ["Rank / %", "Your rank or top percentage"],
              ["Rating change", "+ or −, if rated"],
              ["Stuck on", "Q3: no idea / wrong idea / bug / time"],
              ["Upsolved?", "Tick it after the upsolve"],
              ["Lesson", "One line"],
            ],
          },
        },
        {
          kind: "summary",
          points: [
            "Mistake journal: one line per WA, TLE or lookup, with a category and a specific rule for next time.",
            "Re-solve queue: every helped problem returns on Day +3 and Day +7.",
            "Cards: one line, your own words, no problem name; the back has pattern and complexity.",
            "Contest log: solved, rank, rating change, what you were stuck on, upsolved, lesson.",
            "Log in the Tracker (#tracker) and drill in the Gym (#gym), every day.",
          ],
        },
      ],
    },
  ],
};

export default ch;
