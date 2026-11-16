import type { Chapter } from "./types";

const ch: Chapter = {
  n: 1,
  title: "The Rules of the 30 Days",
  short: "The rules",
  part: 0,
  hook: "The topics are standard. The way you practise is what changes how you think.",
  sources: [],
  lessons: [
    /* ------------------------------------------------------------------ */
    {
      id: "ch01-l1",
      title: "No AI, time boxes, and the stuck protocol",
      goal: "Follow the AI detox and know exactly what to do when a problem's time box runs out.",
      minutes: 8,
      steps: [
        {
          kind: "read",
          title: "Why rules",
          body: "This plan works only if you follow its rules. Anyone can list the topics. What changes how you think is the **way** you practise.\n\nMost of these rules exist to undo one habit: reaching for AI the moment a problem feels hard. This lesson covers the first two rules: the AI detox, and what to do when you are stuck.",
        },
        {
          kind: "quiz",
          guess: true,
          prompt: "What builds the memory that lets you recognise a pattern in 15 seconds?",
          options: [
            "Reading many good solutions",
            "Producing the answer yourself, even slowly",
            "Watching someone solve problems",
          ],
          answer: 1,
          explain: "**Producing the answer yourself.** Recognition is a memory skill, and you build those memories by pulling the answer out of your own head. Reading an answer, from AI or an editorial, builds almost none.",
        },
        {
          kind: "read",
          title: "Rule 1: the AI detox",
          body: "Strong programmers got strong by being stuck for 20 minutes and pushing through. If AI rescues you every time, that never happens. So the [[AI detox]] has two parts:\n\n- **No AI while solving.** No chat assistant, no \"just a hint\". Close the tab.\n- **Turn off AI autocomplete** in your editor for practice files. Autocomplete that finishes your BFS for you is AI solving the problem.",
        },
        {
          kind: "read",
          title: "When AI is allowed",
          body: "AI is allowed **only after the problem is closed**: you got Accepted, or you finished the stuck protocol and read the [[editorial]] (the official solution write-up).\n\nThen you may ask AI to *explain* the editorial or *review* your accepted code (\"is there a cleaner way?\"). It never writes your code.\n\n**Never in contests.** Codeforces and LeetCode both forbid AI help in rated contests. Breaking that rule also defeats the point: the contest is your test.",
        },
        {
          kind: "read",
          title: "Why this matters",
          body: "Recognising a pattern in 15 seconds is a memory skill. You build those memories only by **producing** the answer yourself.\n\nReading an answer, from AI or from an editorial, feels like learning but builds almost no memory. That is why the order is always: struggle first, read later.",
          callout: { type: "move", text: "Struggle first, then read. The minutes you spend stuck are the minutes that build the reflex." },
        },
        {
          kind: "quiz",
          teach: "AI is allowed only after the problem is closed: Accepted, or the stuck protocol finished and the editorial read. Even then it explains or reviews; it never writes your code.",
          prompt: "Which use of AI follows the rules?",
          options: [
            "Asking for a small hint after 10 minutes on a Medium",
            "Letting editor autocomplete finish your BFS loop",
            "After Accepted, asking AI to review your code for a cleaner way",
            "Checking your idea with AI during a rated contest",
          ],
          answer: 2,
          explain: "Only the **review after Accepted** is allowed. Hints while solving, autocomplete in practice files and any AI in a contest all break the detox.",
        },
        {
          kind: "read",
          title: "Rule 2: every problem has a time box",
          body: "A [[time box]] is the fixed time you give a problem before you change what you are doing. The first box depends on the level.",
          visual: {
            kind: "table",
            headers: ["Level", "First box", "What it means"],
            rows: [
              ["Easy", "15 min", "If an Easy takes longer, the basics are missing. Note which ones."],
              ["Medium", "30 min", "The core of this plan."],
              ["Hard / CF 1400+ / CSES", "45 min", "Stretch problems. Getting stuck here is normal."],
            ],
          },
        },
        {
          kind: "read",
          title: "The stuck protocol",
          body: "When the box runs out, do the [[stuck protocol]], in this order:\n\n- **1.** Re-read the constraints and **write the brute force**, even if it is O(n³). Say where it wastes work. (+10 min)\n- **2.** **Take one hint**: the LeetCode hint or topic tag, or only the first paragraph of the editorial. (+15 min)\n- **3.** **Read the full editorial.** Close it. Write the solution from scratch without looking. If you can't, read it again, close it again, and repeat.\n- **4.** **Add the problem to the re-solve queue** for Day +3 and Day +7.",
        },
        {
          kind: "read",
          title: "Not too long, not too short",
          body: "Never sit on one problem for 3 hours. The time is better spent on the next problem and a re-solve later.\n\nNever give up after 5 minutes either. Those first minutes of being stuck are where the thinking happens. The time box protects you from both mistakes.",
          callout: { type: "mistake", text: "Opening the editorial the moment you feel stuck. Wait for the box to run out, then follow the protocol step by step." },
        },
        {
          kind: "order",
          teach: "The protocol starts with what you can do alone, then adds the smallest possible help, then the full solution, and ends by scheduling the problem again.",
          prompt: "Your 30-minute box on a Medium just ran out. Put the stuck protocol in order.",
          items: [
            "Re-read the constraints and write the brute force",
            "Take one hint",
            "Read the full editorial, close it, write it from scratch",
            "Add the problem to the re-solve queue",
          ],
          explain: "Brute force first (+10 min), then one hint (+15 min), then the full editorial written from scratch, then the re-solve queue for Day +3 and Day +7.",
        },
        {
          kind: "quiz",
          teach: "The first box is 15 minutes for Easy, 30 for Medium, and 45 for Hard, Codeforces 1400+ or CSES problems.",
          prompt: "You start a CSES problem. How long is its first time box?",
          options: ["15 minutes", "30 minutes", "45 minutes", "No limit"],
          answer: 2,
          explain: "**45 minutes.** CSES problems count as stretch problems, like Hards and Codeforces 1400+. Getting stuck on them is normal.",
        },
        {
          kind: "summary",
          points: [
            "No AI while solving, and no AI autocomplete in practice files.",
            "AI may explain an editorial or review accepted code, only after the problem is closed. Never in contests.",
            "Time boxes: Easy 15, Medium 30, Hard / CF 1400+ / CSES 45 minutes.",
            "Stuck protocol: brute force, one hint, full editorial then write from scratch, re-solve queue.",
          ],
        },
      ],
    },

    /* ------------------------------------------------------------------ */
    {
      id: "ch01-l2",
      title: "Name the clue, type from memory, come back later",
      goal: "Write the three-line clue comment, practise templates from memory, and run the re-solve queue and mistake journal.",
      minutes: 8,
      steps: [
        {
          kind: "read",
          title: "Rule 3: name the clue before you code",
          body: "Before you type any code, write three lines as a comment at the top of the file:\n\n- **clue:** the words or limits in the statement that point to a method\n- **pattern:** the method you will use\n- **target:** the complexity you aim for\n\nHere is an example for a problem that asks for the smallest k that works.",
          visual: {
            kind: "code",
            lang: "python",
            code: "# clue: \"minimum k such that ... works\" + answer up to 1e9\n# pattern: binary search on the answer, check is O(n)\n# target: O(n log max)",
          },
        },
        {
          kind: "read",
          title: "Why every problem, even Easy ones",
          body: "These three lines are the habit that builds the 15-second reflex. Each time, you force yourself to connect a **clue** in the statement to a **pattern**, and to check the speed with a **target**.\n\nDo it on **every** problem, Easy ones included. On an Easy it takes 20 seconds, and those repetitions add up over 150 problems.",
        },
        {
          kind: "quiz",
          teach: "Rule 3 asks for three comment lines before any code: what you noticed in the statement, the method, and the speed you aim for.",
          prompt: "Which three lines go at the top of every solution file?",
          options: [
            "Problem name, date, difficulty",
            "Clue, pattern, target complexity",
            "Input format, output format, sample test",
            "Time box, hints used, verdict",
          ],
          answer: 1,
          explain: "**Clue, pattern, target.** For example: clue \"minimum k such that ... works\", pattern binary search on the answer, target O(n log max).",
        },
        {
          kind: "read",
          title: "Rule 4: type templates from memory",
          body: "Each day has one or two templates. Read one once, **close it**, and type it from memory. Then compare. Repeat until it comes out correct.\n\nBy Day 30 you should write these without looking: BFS, union-find, Dijkstra, binary search on the answer, a Fenwick tree and memoized DP. Typing them daily makes them mechanical, so your thinking time goes to the problem.",
        },
        {
          kind: "read",
          title: "Rule 5: spaced re-solve",
          body: "A problem you needed help with is **not done**. It goes into the [[re-solve queue]] and comes back:\n\n- **Day +3:** re-solve it from a blank file, with a 15-minute box.\n- **Day +7:** re-solve it once more. If it's clean, it leaves the queue.\n\nFor example, a problem you needed a hint for on Day 10 comes back on Day 13 and Day 17. This is [[spaced repetition]] applied to problems.",
          visual: {
            kind: "table",
            headers: ["Problem", "First attempt", "Re-solve Day +3", "Re-solve Day +7"],
            rows: [["A problem that needed a hint", "Day 10", "Day 13", "Day 17"]],
          },
        },
        {
          kind: "number",
          teach: "A problem you needed help with comes back 3 days later and again 7 days after the first attempt.",
          prompt: "You needed the editorial for a problem on Day 6. On which day is its **second** re-solve?",
          answer: 13,
          tolerance: 0.5,
          unit: "day",
          explain: "The first re-solve is Day 6 + 3 = **Day 9**. The second is Day 6 + 7 = **Day 13**. If that one is clean, the problem leaves the queue.",
        },
        {
          kind: "read",
          title: "Rule 6: the mistake journal",
          body: "Every Wrong Answer, TLE, or solution you had to look up gets **one line** in the [[mistake journal]]: the problem, what went wrong, its category, and the rule you will follow next time.\n\nThe last 30 minutes of every day include this log, plus one or two re-solves from the queue.",
          visual: {
            kind: "table",
            headers: ["Problem", "What went wrong", "Category", "Rule for next time"],
            rows: [["LC 3 Longest Substring Without Repeating Characters", "Moved left pointer to last[c], not last[c] + 1", "off-by-one", "When moving left past a duplicate, use max(left, last[c] + 1)"]],
          },
        },
        {
          kind: "read",
          title: "The eight categories",
          body: "Every mistake goes into one of eight categories:\n\n- **misread** · **wrong pattern** · **right pattern, wrong details** · **edge case**\n- **off-by-one** · **Python TLE** · **recursion depth** · **didn't know the technique**\n\nOn Day 29 you read the whole journal. The two biggest categories become your patch work for the last days and for month 2.",
        },
        {
          kind: "match",
          teach: "Each category names the root cause: reading the problem, choosing the method, the details of the method, unusual inputs, indexes, Python speed, recursion, or a missing technique.",
          prompt: "Match each mistake to its category.",
          pairs: [
            ["Used last[c] instead of last[c] + 1", "off-by-one"],
            ["Solved for subarrays, but it asked for subsequences", "misread"],
            ["Right O(n log n) idea, but TLE from calling input() per line", "Python TLE"],
            ["Recursive DFS crashed on a path of 10^5 nodes", "recursion depth"],
          ],
          explain: "An index wrong by one is **off-by-one**. Solving a different problem than asked is **misread**. A correct idea that is too slow only because of Python overhead is **Python TLE**. A crash from deep recursion is **recursion depth**.",
        },
        {
          kind: "summary",
          points: [
            "Before code, write three comment lines: clue, pattern, target. On every problem.",
            "Read a template once, close it, type it from memory, compare, repeat.",
            "A problem you needed help with comes back on Day +3 and Day +7, from a blank file.",
            "One journal line per WA, TLE or lookup, in one of eight categories. On Day 29 the two biggest become your patch work.",
          ],
        },
      ],
    },

    /* ------------------------------------------------------------------ */
    {
      id: "ch01-l3",
      title: "Contests, volume, and the 3-hour day",
      goal: "Plan a day and a week of the course, recover from a missed day, and know when a problem is really done.",
      minutes: 9,
      steps: [
        {
          kind: "read",
          title: "Rule 7: contests are mandatory",
          body: "You take one live contest on every contest day (Days 7, 14, 21 and 28), plus [[virtual contests|virtual contest]] in Week 4.\n\nYour rating will be low at first. That's expected. A contest is the only place where **nobody tells you the topic**, which is exactly the 15-second skill you are training. You [[upsolve]] the next day: solve the problems you missed (Chapter 10).",
        },
        {
          kind: "read",
          title: "Rule 8: the volume floor",
          body: "Aim for **6–8 problems a day** and roughly **150–180 problems by Day 30**, plus 4 live contests and 2–3 virtual ones.\n\nFewer than that and the patterns won't stick. More than that, done carelessly, is worse than fewer done with real thought.",
          visual: {
            kind: "stats",
            items: [
              { value: "6–8", label: "problems a day" },
              { value: "150–180", label: "problems by Day 30" },
              { value: "4 + 2–3", label: "live + virtual contests" },
            ],
          },
        },
        {
          kind: "read",
          title: "The daily 3-hour block",
          body: "Every topic day uses the same block. The Today page lays it out for you.",
          visual: {
            kind: "table",
            headers: ["Time", "What", "Notes"],
            rows: [
              ["0:00–0:10", "Recognition warm-up", "20 cards, 15 seconds each. Say the answer out loud."],
              ["0:10–0:40", "Learn the idea", "Read the day's idea. Type the template from memory twice."],
              ["0:40–2:30", "Problems", "Work in order and respect the time boxes. Write the clue comment first."],
              ["2:30–3:00", "Log and re-solve", "Mistake journal, 3 new recognition cards, 1–2 re-solves from the queue."],
            ],
          },
        },
        {
          kind: "read",
          title: "The optional extra hour",
          body: "Have more time? Add an hour of problems from that day's list, or a Codeforces problem at your level.\n\nBut the last 30 minutes are not optional. The log, the new cards and the re-solves are what turn today's work into memory.",
          callout: { type: "mistake", text: "Skipping the log to fit in more problems. Without the log and re-solves, most of today's work is forgotten within a week." },
        },
        {
          kind: "order",
          teach: "The day goes from a short warm-up, to learning the idea and its template, to the long problem block, to logging and re-solving at the end.",
          prompt: "Put the daily 3-hour block in order.",
          items: [
            "Recognition warm-up: 20 cards",
            "Learn the idea and type the template twice",
            "Time-boxed problems, in order",
            "Mistake journal, new cards, re-solves",
          ],
          explain: "0:00 warm-up, 0:10 learn the idea, 0:40 problems, 2:30 log and re-solve.",
        },
        {
          kind: "read",
          title: "The weekly rhythm",
          body: "The week has three kinds of days. The day after a contest starts with a 45-minute upsolve.",
          visual: {
            kind: "table",
            headers: ["Day", "Shape"],
            rows: [
              ["Day after a contest (8, 15, 22, 29)", "45 min upsolve of the contest, then the day's topic."],
              ["Topic days", "One topic per day, using the 3-hour block."],
              ["Contest day (7, 14, 21, 28)", "Light topic or review, a 30-card Recognition Test, then the LeetCode Weekly contest."],
            ],
          },
        },
        {
          kind: "read",
          title: "If you miss a day",
          body: "Don't skip the topic. **Push it to the next day** and shrink the next review day to fit.\n\nIf you miss **three or more days in a row**, restart the current week. Doing every topic halfway is worse than doing fewer topics properly.",
        },
        {
          kind: "quiz",
          teach: "A single missed day is absorbed by pushing the topic forward and shrinking the next review day. A longer gap needs a bigger reset.",
          prompt: "You miss three days in a row in the middle of a week. What do you do?",
          options: [
            "Skip those three topics and continue",
            "Do all three topics tomorrow",
            "Restart the current week",
            "Skip the next contest to catch up",
          ],
          answer: 2,
          explain: "**Restart the current week.** Cramming or skipping topics leaves you doing everything halfway, which is worse than doing fewer topics properly.",
        },
        {
          kind: "read",
          title: "What \"done\" means",
          body: "A problem is **done** only when all four are true:\n\n- **1.** It's **Accepted**.\n- **2.** You can say **why it's correct** in two sentences.\n- **3.** You know its **time and space complexity**.\n- **4.** You can name **the clue** that would make you recognise it again.\n\nIf one is missing, the problem isn't done.",
        },
        {
          kind: "multi",
          teach: "Done needs more than the green verdict. It also needs the reason, the cost, and the signal that would help you spot it again.",
          prompt: "Which must be true before a problem counts as done? Select all that apply.",
          options: [
            "It is Accepted",
            "You can explain why it's correct in two sentences",
            "You solved it in under 5 minutes",
            "You know its time and space complexity",
            "You can name the clue that would make you recognise it",
          ],
          answers: [0, 1, 3, 4],
          explain: "Accepted, **why** it's correct, its **complexity**, and its **clue**. Speed is not part of the definition. Slow problems you needed help with go to the re-solve queue instead.",
        },
        {
          kind: "summary",
          points: [
            "One live contest every 7th day, plus virtual contests in Week 4. Upsolve the next day.",
            "6–8 problems a day, 150–180 by Day 30.",
            "The 3-hour block: warm-up, learn the idea, problems, log and re-solve. Never skip the log.",
            "Missed a day: push the topic forward. Missed three in a row: restart the week.",
            "Done = Accepted + why it's correct + complexity + the clue.",
          ],
        },
      ],
    },

    /* ------------------------------------------------------------------ */
    {
      id: "ch01-l4",
      title: "Checkpoint: the rules",
      goal: "Check that you can apply all eight rules and the daily block.",
      minutes: 6,
      steps: [
        {
          kind: "read",
          title: "Here is what this chapter covered",
          body: "- **AI detox:** no AI while solving; only after the problem is closed; never in contests.\n- **Time boxes:** 15 / 30 / 45 minutes, then the stuck protocol.\n- **Clue comment:** clue, pattern, target before any code.\n- **Templates from memory**, and **re-solves** on Day +3 and Day +7.\n- **Mistake journal** with eight categories.\n- **Contests and volume:** a contest every 7th day, 150–180 problems, and the 3-hour block.",
        },
        {
          kind: "quiz",
          teach: "The stuck protocol starts with the brute force and one hint before the full editorial. The editorial is read, closed, and then the code is written from scratch.",
          prompt: "Your box ran out and you already wrote the brute force. You have used one hint and still have no idea. What now?",
          options: [
            "Copy the editorial's code and submit it",
            "Read the full editorial, close it, and write the solution from scratch",
            "Keep thinking for another hour",
            "Skip the problem and never return",
          ],
          answer: 1,
          explain: "Step 3: read the full editorial, **close it**, and write the solution without looking. Then step 4: add it to the re-solve queue.",
        },
        {
          kind: "quiz",
          teach: "Time boxes are 15 minutes for Easy and 30 for Medium. An Easy that runs long tells you something about your basics.",
          prompt: "An Easy problem has taken you 25 minutes. What does the rule say this means?",
          options: [
            "Easy problems are random, so ignore it",
            "The basics are missing. Note which ones",
            "You should switch to Medium problems",
            "You need a longer box for Easy problems",
          ],
          answer: 1,
          explain: "If an Easy takes longer than 15 minutes, **the basics are missing**. Note which ones so you can fix them.",
        },
        {
          kind: "quiz",
          teach: "Rule 5 brings back every problem you needed help with, from a blank file, after 3 days and after 7 days.",
          prompt: "You solved a problem alone, but only after reading one hint. What happens to it?",
          options: [
            "It is done, because it was Accepted",
            "It goes into the re-solve queue for Day +3 and Day +7",
            "You re-solve it the same night",
            "You delete it from your notes",
          ],
          answer: 1,
          explain: "Any problem you needed help with, even one hint, is **not done**. It comes back on Day +3 and Day +7.",
        },
        {
          kind: "match",
          teach: "Each rule targets one habit: thinking without AI, limiting time, naming the clue, remembering templates, spacing reviews, and logging mistakes.",
          prompt: "Match each rule to what it does.",
          pairs: [
            ["AI detox", "Makes you produce answers yourself"],
            ["Time box", "Stops you sitting on one problem for hours"],
            ["Clue comment", "Builds the 15-second reflex"],
            ["Re-solve queue", "Brings back problems you needed help with"],
            ["Mistake journal", "Shows your two weakest categories by Day 29"],
          ],
          explain: "Each rule protects one part of the skill: thinking alone, using time well, recognising patterns, remembering solutions and fixing repeated mistakes.",
        },
        {
          kind: "quiz",
          teach: "The last 30 minutes of the day hold the mistake journal, three new recognition cards and one or two re-solves.",
          prompt: "It is 2:30 into your 3-hour block. What should you be doing?",
          options: [
            "Starting a new Hard problem",
            "Logging mistakes, adding 3 cards and doing 1–2 re-solves",
            "The recognition warm-up",
            "Typing the template for the first time",
          ],
          answer: 1,
          explain: "2:30–3:00 is **log and re-solve**: the mistake journal, 3 new recognition cards, and 1–2 problems from the re-solve queue.",
        },
        {
          kind: "multi",
          teach: "AI may help only after a problem is closed, and only to explain or review. It never writes code, and it is never used in contests.",
          prompt: "Which of these break the AI detox? Select all that apply.",
          options: [
            "Copilot-style autocomplete on in your practice files",
            "Asking AI to explain an editorial after you finished the stuck protocol",
            "Asking for \"just a hint\" after 20 minutes",
            "Using AI during a live LeetCode Weekly",
          ],
          answers: [0, 2, 3],
          explain: "Autocomplete, hints while solving and AI in a contest all break it. Asking AI to **explain an editorial** after the problem is closed is allowed.",
        },
        {
          kind: "summary",
          points: [
            "Struggle first; AI only after the problem is closed, and never in contests.",
            "Box, then brute force, one hint, editorial from scratch, re-solve queue.",
            "Clue, pattern, target before any code.",
            "Log every miss; re-solve on Day +3 and Day +7; a problem is done only with all four checks.",
          ],
        },
      ],
    },
  ],
};

export default ch;
