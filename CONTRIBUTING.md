# Delivery Academy: rules for every agent

**What we are building.** CP 30 is an interactive course website made from the book in `../chapters/*.md`: *The 30-Day Python Competitive Programming Roadmap*. The reader is a working software engineer who writes Python daily but is weak at data structures and algorithms. They want to (1) think like a strong competitive programmer and (2) see a LeetCode-style problem and name the right algorithm in 10–15 seconds. English may not be their first language. Python only, no C++. The style is **Brilliant.org** (short steps, one idea at a time, pictures that move, learning by doing), progress feels like **Duolingo** (a path, XP, streaks, a daily plan), and the finish is **Apple** (calm type, whitespace, soft depth, smooth motion). The site is public: write for "you", never mention a specific person, and do not use calendar dates (say "Day 8", not "Sun Nov 22").

**Stack.** Vite + React 18 + TypeScript (strict), plain CSS that uses the design tokens, and `framer-motion` for motion. **Do not add dependencies.** Build visuals with SVG, CSS and React.

## Commands (run them from `app/`)
- The dev server is **already running** at `http://127.0.0.1:5181`. Never start another one, and never kill it. It hot-reloads your files.
- Type-check only your own files: `bunx tsc --noEmit 2>&1 | grep -E "src/(widgets/<your-id>|content/chNN)"`. Other agents are editing other files at the same time, so ignore errors that are not in your files.
- Take a screenshot and capture console errors: `tools/shot.sh '<route>' /abs/out.png [width] [height]`.
- Drive the page with clicks, waits and screenshots: `node tools/probe.mjs '<route>' /abs/out.png '[{"clickText":"Play"},{"wait":1500},{"shot":"/abs/s2.png"}]' [w] [h]`. Then look at the PNGs with the Read tool.
- Write scratch files only under `/tmp/da-scratch/<your-name>/`.

## Routes (plain hash names, no slashes)
| Route | Shows |
|---|---|
| `#home` | Home |
| `#ch5` | Chapter 5 overview |
| `#ch5-3` | Lesson 3 of chapter 5 |
| `#labs` | All labs |
| `#lab-<widgetId>` | One lab, full page |
| `#glossary` | Glossary |
| `#w-<widgetId>` | Widget harness, compact mode, 680px column |
| `#w-<widgetId>@375` | Widget harness in a phone-width column |
| `#w-<widgetId>!full` | Widget harness, full page mode |
| `#diagrams` | Diagram engine demo |

## File ownership: edit ONLY your own files
| Owner | Files |
|---|---|
| Content agent for chapter N | `src/content/chNN.ts` (week chapters 4–7: `src/content/chNN/part1.ts` or `part2.ts`, one agent each) |
| Widget agent `<id>` | everything under `src/widgets/<id>/` (split into several files and a local `.css` if useful) |
| Diagram engine agent | `src/diagram/**` |
| Design lead / pages agent | `src/pages/**` except `LessonPage.tsx` and the two harnesses, `src/styles/**`, `src/ui/**`, `index.html`, `design/DESIGN.md` |
| Lesson-player agent | `src/player/**`, `src/pages/LessonPage.tsx`, `src/runner/**` (in-browser Python) |
| Pages agent | the design-lead row above, plus `src/pages/TodayPage.tsx`, `GymPage.tsx`, `TrackerPage.tsx` |
| Editor | everything else (`types.ts`, `registry.ts`, `ids.ts`, `deck.ts`, `state/`, `lib/`, `tools/`, `App.tsx`) |

If you need a change in a shared file, do not make it. Note it in your final report.

## Design tokens (`src/styles/tokens.css`)
Use only these token names and never hard-code colors, because each token has a light value and a dark value.
- Surfaces and text: `--bg --surface --surface-2 --surface-3 --ink --ink-2 --muted --line`
- Accent: `--accent --accent-ink --accent-soft`
- Status: `--good --good-soft --bad --bad-soft --warn --warn-soft`
- Part colors: `--p1` … `--p6`
- Callout colors: `--c-staff --c-mistake --c-industry --c-cr`, each with a `-soft` variant
- Shape and motion: `--radius-s/m/l/pill --shadow-1/2 --font-display --font-body --font-mono --ease --dur`

In SVG, set colors through `style={{ fill: "var(--p2)" }}` or through CSS classes. Do not use `fill="#hex"`.

## Shared UI (`@/ui`): use these instead of building your own
`Button`, `Slider`, `Segmented`, `Toggle`, `Stat`, `StatGrid`, `Stage` (dotted simulation canvas), `WidgetFrame` (stage + controls, responsive), `Chip`, `Callout`, `Log`, `LineChart`.
- Helpers in `@/lib/format`: `fmtNum`, `fmtPct`, `fmtBps`, `fmtBytes`, `fmtMoney`, `fmtMs`, `clamp`.
- Hooks in `@/lib/hooks`: `useRaf(cb(dt), running)`, `useWidth(ref)`, `useReducedMotion()`, `rng(seed)`.

## Facts to keep consistent everywhere
- The plan: Day 0 = setup and baseline. Days 1–28 = four weeks of topics (see `../STYLE.md`, "Day topic allocation"). Day 29 = full mock. Day 30 = final 15-second exam. Every 7th day (7, 14, 21, 28) is a review and contest day.
- The daily 3-hour block: 0:00–0:10 recognition warm-up · 0:10–0:40 learn the idea and type the template from memory · 0:40–2:30 time-boxed problems · 2:30–3:00 log and spaced re-solve.
- Speed rule of thumb: CPython about 10^7 simple operations per second, PyPy about 10^8. LeetCode runs CPython; Codeforces, AtCoder and CSES let you pick PyPy.
- Realistic Day 30 targets (from chapter 0): about 85% on a 100-card 15-second exam, LeetCode Q1–Q2 always and Q3 about half the time, Codeforces performance around 1000–1300.
- Companion books are referenced by the book ("Clue List rule 11", "Recognition Handbook Part 3"). The website does not have them: rewrite such references so they stand alone (state the rule itself) or drop them.
- Problem references must be exact (number + title). Never invent a problem.

## Quality bar (every agent)
- **Simple English.** Short sentences. Define each term the first time it appears.
- **Both themes.** The page must work in light mode and dark mode (dark is `data-theme="dark"` on `<html>`). To test dark mode, run `document.documentElement.dataset.theme='dark'` in a probe `eval` step.
- **Responsive.** Lessons render widgets about 640px wide (compact). Lab pages render them up to 1100px. Everything must stay usable at 375px with no horizontal page scroll; switch layout with `useWidth` or container queries. Text must never be smaller than 12px on screen.
- **Accessible.** Real buttons and inputs, visible focus, `aria-label` on SVGs, and respect for `useReducedMotion()`.
- **No console errors.**
- **No emojis.**
- Before you finish, look at your own screenshots: desktop, 375px and dark mode.
