# Content brief (one agent per chapter or half-week)

You turn part of the book *The 30-Day Python Competitive Programming Roadmap* (`../chapters/NN-*.md`) into interactive lessons for the CP 30 website (`../app`).

**Read first:**
- `app/CONTRIBUTING.md`
- `../STYLE.md`, the book's plan and day topic allocation
- `app/src/content/types.ts`, the schema. Follow it exactly. Note the new step kinds `code` and `practice`, the visuals `array`, `grid`, `tree` and `graph`, and the `day` field on lessons.
- `app/src/content/glossary.ts`, for `[[term]]` links
- `app/design/WIDGETS.md`, the 20 labs you can embed with a `widget` step, with their modes and props. They are being built in parallel; use them by id and `props.mode`.
- your source chapter, all of it

## The reader, and the one rule that matters most

The reader is a beginner at algorithms. Their words, about an earlier course: "It feels like it's asking me questions more than me learning it. Because I don't know anything, how would I do it?"

So **teach first, then check.** Every lesson explains with a picture and a worked example before it asks anything. Questions only cover what came earlier.

## Lesson shape

### Day lessons (chapters 4–8)
Each day becomes **exactly two lessons**, both with `day: N`:

**Lesson A, "Day N: <topic>"** teaches the idea. Aim for 14–24 steps:
1. **Opener (read).** The situation, why this matters, and what you can do by the end. Include the book's "Goal" line.
2. **Optional guess.** At most one `guess: true` question, answerable from everyday intuition.
3. **The idea, in small reads.** One idea per step.
   - Show the algorithm working on a tiny example. Use an `array`, `grid`, `tree` or `graph` visual.
   - Repeat the same visual across 3–6 consecutive read steps, moving the pointers and colors one step at a time, like a flip book. This is the most important teaching tool here.
4. **The 15-second clues** as read steps with `callout: { type: "clue" }`. "See this → think that."
5. **A `widget` step** with the matching lab and a concrete task ("Set n to 10^5 and pick O(n^2). Which judge passes?").
6. **The template.**
   - First a read step with a `code` visual walking through it line by line, with the mental test the book does on a tiny case.
   - Then a `code` step: "Now type it yourself", with `fromMemory: true` for the main template. The tests must use small inputs.
7. **Complexity, Python traps and common mistakes** as reads with callouts (`trap`, `mistake`, `move`).
8. **1–3 scored questions**, spaced between reads, each with `teach`.
9. **Summary.**

**Lesson B, "Day N drill: <topic>"** practises. Aim for 10–18 steps:
1. **Opener (read).** Recap the day's idea in 3–5 short lines (for example a `stats` or `compare` visual), and say what this lesson does.
2. **The recognition drill.** The book's 5 disguised one-line problems become 5 `quiz` steps, each with 3–4 options. The options are pattern names, and the distractors are near misses from the same week. Each has `teach` and an `explain` that names the trigger signal. Runs of questions are allowed in drill lessons, but put a short read between every 2–3 questions ("Notice the signal: ...").
3. **Today's problems.** One `practice` step with every row of the book's "Problems (in order)" table.
   - `ref` is exactly as the book writes it. `tier`: W = warm, C = core, S = stretch.
   - `box` is the number of minutes, `lvl` is copied, and `clue` is the clue column.
   - The `intro` gives the book's rules for the list: time box, no AI, move unfinished stretch rows to the re-solve list.
4. **End-of-day check.** The book's 3 questions become `reveal` steps (think, then tap) or scored questions, with the book's answer.
5. **Summary.** End with "Log 1 mistake and add 3 cards" and point to the Tracker and the Gym.

**Special days.**
- **Day 0 (setup and baseline):** lesson A is the setup (accounts, PyPy, folder, the template). Lesson B is the baseline: the 4 timed problems as a practice step, and how to record the result.
- **Review and contest days (7, 14, 21, 28) and Days 29–30:** lesson A teaches the day's review content, the contest routine or the exam. Lesson B is the practice/re-solve list and the checks.

### Other chapters (0–3, 9–12)
Write 3–10 lessons, each with 10–22 steps, in the same teach-first shape. The last lesson of chapters 2, 3, 9 and 10 is a "Checkpoint" lesson:
- It opens with a read step: "Here is what this chapter covered", with 3–6 key ideas.
- Then it has questions, each with `teach`.
- Runs of questions are allowed there.

## Rules (`bun tools/validate.ts` enforces 1–5)
1. **Step 1 of every lesson is a `read` step.**
2. **At most one `guess: true` question per lesson.** It is unscored, phrased as a guess, and its `explain` teaches the answer.
3. **No scored question on anything not yet taught**, in this lesson or an earlier one. Check every question yourself: "Could a beginner answer this using only what came before?"
4. **Pacing outside Checkpoint and Drill lessons:**
   - Never more than 2 scored questions in a row.
   - At most `ceil(reads/2)+1` scored questions per lesson.
   - `reveal`, `widget`, `code` and `practice` steps are not scored.
5. **Every scored question has `teach`.** That is 1–3 sentences that remind the reader of the idea, without giving away the answer.
6. **Worked example before every calculation.** Before a `number` question, show the same kind of calculation worked out with different numbers.
7. **Read steps:**
   - One idea, 90 words or fewer, simple English, short sentences.
   - **Bold** each new term and define it the first time.
   - Link glossary terms with `[[term]]` or `[[shown text|term]]`, using exact terms from `glossary.ts`. Only link terms that exist there.
   - Code goes in `code` visuals, not in the body. Short inline code in backticks is fine.

## Coverage
Every idea, template, table, callout, clue, problem list, drill and check in your part of the book appears somewhere. The reader wants all of the book's explanations.
- Keep problem references exact. Do not add problems the book does not list.
- Callout labels map to callout types:
  - `> **Thinking move:**` → `move`
  - `> **Python trap:**` → `trap`
  - `> **Common mistake:**` → `mistake`
  - `> **15-second clue:**` → `clue`
- **Companion-book references** ("Clue List rule 9", "Recognition Handbook Part 3", "Chapter 12"): the website does not have the companion books. State the rule itself instead.
  - The website's own pages are fine to mention: the Gym (`#gym`), the Tracker (`#tracker`), the Today page (`#today`).
  - So are other chapters of this course ("Chapter 3, the Python toolkit").
- **Neutral voice.** Write "you". No calendar dates and no weekdays: say "Day 8" or "contest day". Nothing about a specific person.

## Code steps (real Python, run in the browser)
- **Function style** for LeetCode-like templates. `tests: [{ call: "two_sum([3, 2, 4], 6)", expect: "[1, 2]" }]`. The check is `eval(call) == eval(expect)` after running the reader's code. When order does not matter, wrap the call: `sorted(...)`.
- **Stdin style** for the Codeforces/CSES template. `tests: [{ stdin: "3\n1 2 3\n", stdout: "6" }]`. Output is compared token by token. Read with `sys.stdin`, not `os.read`.
- `solution` must pass every test. Run `bun tools/check-code.ts chNN`. It must print `failures 0`.
- `starter` is what the reader sees: a signature and `pass`, or a few comment lines for from-memory templates.
- Keep tests small (the browser runs CPython) and give 3–6 per step, including an edge case (empty, one element, all equal).
- About one or two code steps per day lesson. Mark the main template `fromMemory: true`.

## Technical
- **Lesson ids.**
  - Chapters without parts use `chNN-l1`, `chNN-l2`, and so on.
  - Week chapters number lessons across the whole chapter. Part 1 starts at `chNN-l1`; part 2 continues where part 1 ends. Ch4: part 1 = Days 0–3 = l1–l8, part 2 = Days 4–7 = l9–l16. Ch5, 6 and 7: part 1 = 4 days = l1–l8, part 2 = 3 days = l9–l14.
  - Ch8: Day 29 = l1–l2, Day 30 = l3–l4.
- **Strings.** Use double-quoted strings, with `\n` inside code. Make sure code in strings has correct indentation.
- **Checks before you finish:**
  - `cd app && bunx tsc --noEmit 2>&1 | grep src/content/chNN` prints nothing.
  - `V=1 bun tools/validate.ts 2>&1 | grep "chNN-"` prints no errors and no warnings for your lessons. Ignore other chapters.
  - `bun tools/check-code.ts chNN` prints `failures 0`.
  - Optional, once the player has been built: screenshot a lesson with `tools/shot.sh 'chN-1' /tmp/da-scratch/<you>/x.png` and look at it.
- **Reply** with:
  - the number of lessons and steps
  - read steps vs scored questions
  - code steps and practice problems
  - widgets used
  - anything you could not convert or are unsure about
