import type { Chapter } from "./types";

const ch: Chapter = {
  n: 11,
  title: "Beyond Day 30",
  short: "Beyond 30",
  part: 6,
  hook: "The real road to the top, in months and years.",
  sources: [
    "Codeforces blog 151862, median time to reach each rank (2026): codeforces.com/blog/entry/151862",
  ],
  lessons: [
    /* ------------------------------------------------------------------ */
    {
      id: "ch11-l1",
      title: "The ladder to the top",
      goal: "Know what each Codeforces stage after this course demands, how long it usually takes, and which stage your own goal needs.",
      minutes: 8,
      steps: [
        {
          kind: "read",
          title: "If you still want the top",
          body: "If after 30 days you still want the top 200, this lesson shows what it takes.\n\nThe numbers are Codeforces ratings. The times assume about **2 hours a day** and steady contests. They are typical, not guaranteed. Next to each stage is the **median** time real users needed to reach it.",
        },
        {
          kind: "read",
          title: "The ladder",
          body: "Each row is one stage of the [[Codeforces rank]] ladder: the rating, the usual time from the start of this course, and whether Python is still fine.",
          visual: {
            kind: "table",
            headers: ["Stage", "Rating", "Typical time", "Python OK?"],
            rows: [
              ["Month 1 (this course)", "~1000–1300", "30 days", "Yes"],
              ["Pupil → Specialist", "1200–1400", "2–6 months (median 1.1 y)", "Yes"],
              ["Expert", "1600", "6–12 months (median 1.3 y)", "Yes"],
              ["Candidate Master", "1900", "1–2 years (median 1.7 y)", "Mostly. Some time limits get tight."],
              ["Master → Grandmaster", "2100–2400", "2–4 years (median 2.0–2.9 y)", "Often too slow"],
              ["Top 200", "~2750+", "3–6+ years", "Very rare in Python"],
            ],
          },
        },
        {
          kind: "read",
          title: "Pupil to Specialist (1200–1400)",
          body: "**What you add:** solve [[Div 2]] problems A and B in under 30 minutes.\n\nPractise with a rating-sorted sheet such as the CP-31 sheet, at ratings **1100–1400**. Month 1 gave you the patterns, the templates and the [[AI detox]]. This stage turns them into speed.",
        },
        {
          kind: "read",
          title: "Expert (1600)",
          body: "**What you add:** solve Div 2 problem C regularly.\n\nThat needs greedy proofs, [[binary search]] everywhere, prefix-sum tricks and [[DSU]] used without thinking. Finish the [[CSES]] **Sorting and Searching**, **Dynamic Programming** and **Graph** sections.",
        },
        {
          kind: "read",
          title: "Candidate Master and beyond",
          body: "**Candidate Master (1900):** Div 2 problem D. You need [[segment trees|segment tree]] fluently, [[tree DP]], combinatorics and [[constructive problems|constructive problem]].\n\n**Master to Grandmaster (2100–2400):** Div 1 problems. Advanced DP, network flows, FFT and heavy math.\n\n**Top 200 (~2750+):** training like an olympiad competitor, for **3–6+ years**.",
        },
        {
          kind: "quiz",
          teach: "Each stage adds one Div 2 problem: A–B for Specialist, C for Expert, D for Candidate Master, then Div 1 problems for Master and above.",
          prompt: "Which stage needs fluent segment trees, tree DP, combinatorics and constructive problems?",
          options: ["Pupil", "Expert", "Candidate Master", "Top 200"],
          answer: 2,
          explain: "**Candidate Master (1900)**, the stage of Div 2 problem D. Expert is about Div 2 C with greedy, binary search, prefix tricks and DSU.",
        },
        {
          kind: "read",
          title: "The honest Python note",
          body: "Up to about **1900** on Codeforces, Python is fine. On LeetCode, Python is fine at **every** level.\n\nAbove about **2100** on Codeforces, people who stay in Python keep losing problems they had actually solved to [[TLE]]. Most people switch to C++ around there.\n\nDecide that if you get there. It isn't a month-1 problem.",
          callout: { type: "trap", text: "Above about 2100 on Codeforces, a correct idea in Python can still fail the time limit. Below 1900 this almost never decides a problem if you use PyPy and fast input." },
        },
        {
          kind: "quiz",
          teach: "Python's speed only becomes a real limit high up the Codeforces ladder. LeetCode never needs another language.",
          prompt: "Up to about what Codeforces rating is Python fine?",
          options: ["About 1200", "About 1900", "About 2750", "Python is never fine on Codeforces"],
          answer: 1,
          explain: "About **1900**. Above about 2100 Python starts losing solved problems to TLE. On LeetCode it is fine at every level.",
        },
        {
          kind: "read",
          title: "A better question",
          body: "Ask yourself what you actually want the top-200 rank **for**.\n\n**Interviews:** the bar is about LeetCode [[Knight (LeetCode)|Knight]] level (**about 1850**), or solving 3 of 4 contest problems. That is reachable in about **2–4 months** after this course, and it is more than enough. A top-200 rank adds nothing at an interview.",
        },
        {
          kind: "read",
          title: "The thinking style, and the rank itself",
          body: "**The thinking style:** it peaks around **Expert to Candidate Master (1600–1900)**. By then you can reason through new problems without help. That is the complete-programmer skill most people are after.\n\n**The rank itself:** that is a hobby that takes years. It's fine if you love it, but it shouldn't block your other goals.",
        },
        {
          kind: "quiz",
          teach: "Different goals need different levels: interviews need roughly LeetCode Knight, the thinking style peaks around Expert to Candidate Master, and the rank itself takes years.",
          prompt: "Your goal is to pass coding interviews. What level is enough?",
          options: [
            "Codeforces top 200",
            "Codeforces Grandmaster",
            "About LeetCode Knight (~1850), or 3 of 4 contest problems",
            "Any rating, because interviews don't test algorithms",
          ],
          answer: 2,
          explain: "About **LeetCode Knight (~1850)**, or 3 of 4 contest problems. That is about 2–4 months after this course. A top-200 rank adds nothing at an interview.",
        },
        {
          kind: "summary",
          points: [
            "Pupil to Specialist: Div 2 A–B in 30 minutes, 2–6 months. Expert: Div 2 C, 6–12 months.",
            "Candidate Master: Div 2 D, 1–2 years. Grandmaster: 2–4 years. Top 200: 3–6+ years.",
            "Python is fine to about 1900 on Codeforces and at every level on LeetCode.",
            "Interviews need about LeetCode Knight (~1850). The thinking style peaks at 1600–1900.",
          ],
        },
      ],
    },

    /* ------------------------------------------------------------------ */
    {
      id: "ch11-l2",
      title: "Month 2",
      goal: "Set up a second month that keeps the habits and raises the level.",
      minutes: 6,
      steps: [
        {
          kind: "read",
          title: "Daily: three problems above your level",
          body: "Each day of month 2:\n\n- **3 problems** at your Codeforces rating **+100 to +300**, mixed topics. Use a rating-sorted sheet or the Codeforces problemset filtered by rating.\n- **10 recognition cards** in the Gym.\n\nFor example, at a rating of 1100 you practise problems rated 1200 to 1400. Slightly too hard is where you grow.",
        },
        {
          kind: "number",
          teach: "Month 2 problems are rated from your rating + 100 up to your rating + 300.",
          prompt: "Your Codeforces rating is 1250. What is the **highest** problem rating in your month-2 practice band?",
          answer: 1550,
          tolerance: 1,
          explain: "1250 + 300 = **1550**. The band is 1350 to 1550.",
        },
        {
          kind: "read",
          title: "Weekly: three contests",
          body: "Each week of month 2:\n\n- **1 LeetCode Weekly**\n- **1 Codeforces** [[Div 2]], [[Div 3]] or [[Div 4]], live\n- **1 AtCoder** [[ABC]] as a [[virtual contest]]\n\nAfter each one, [[upsolve]] **one problem past your last solve**. If you solved A and B, upsolve C. That one problem is where your next level is.",
        },
        {
          kind: "reveal",
          prompt: "In a contest you solved A, B and C. Which problem do you upsolve?",
          answer: "Problem **D**, the first one past your last solve. One problem per contest is enough; it is where your next level sits.",
        },
        {
          kind: "read",
          title: "Topics to deepen",
          body: "Do not pick topics by feel. Pick them from evidence:\n\n- the **two categories** that fill your [[mistake journal]]\n- the [[CSES]] **Sorting and Searching** and **Dynamic Programming** sections, finished completely",
        },
        {
          kind: "read",
          title: "What to keep",
          body: "Keep every habit from month 1:\n\n- the [[AI detox]]\n- the [[stuck protocol]]\n- the [[re-solve queue]]\n- the progress table in the Tracker\n\nThe habits are what made month 1 work. Dropping them is the fastest way to slide back.",
        },
        {
          kind: "multi",
          teach: "Month 2 raises the level but keeps the month-1 habits: no AI while solving, the stuck protocol, spaced re-solves and the progress table.",
          prompt: "Which of these carry into month 2? Select all that apply.",
          options: [
            "The AI detox",
            "The stuck protocol",
            "The re-solve queue",
            "Only solving problems below your rating",
            "The progress table",
          ],
          answers: [0, 1, 2, 4],
          explain: "All four habits stay. Problems move **above** your rating, by +100 to +300, not below it.",
        },
        {
          kind: "read",
          title: "How you'll know it worked",
          body: "Month 2 worked when two things are true:\n\n- [[Div 2]] problem B feels **routine**.\n- Your LeetCode rating, now past its first 5 percentile-only contests, is **moving toward 1850**.\n\nCheck both in the Tracker at the end of the month, the same way you compared Day 30 with Day 0.",
        },
        {
          kind: "reveal",
          prompt: "Look at your mistake journal at the end of month 1. Which two categories would you deepen first?",
          answer: "The two categories with the most lines. If they are, say, **wrong pattern** and **edge case**, spend month 2 on recognition cards for the patterns you confused and on testing tiny and extreme inputs before you submit.",
        },
        {
          kind: "summary",
          points: [
            "Daily: 3 problems at your rating +100 to +300, mixed topics, plus 10 recognition cards.",
            "Weekly: a LeetCode Weekly, a live Codeforces round, an AtCoder ABC virtual. Upsolve one problem past your last solve.",
            "Deepen your two biggest journal categories, and finish CSES Sorting and Searching and DP.",
            "Keep the AI detox, the stuck protocol, the re-solve queue and the progress table.",
            "Success: Div 2 B feels routine and your LeetCode rating moves toward 1850.",
          ],
        },
      ],
    },
  ],
};

export default ch;
