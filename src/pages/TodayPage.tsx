import { useEffect, useState, type ReactNode } from "react";
import { Button, Icon, IconButton, ProgressBar, Chip } from "@/ui";
import { progress, useProgress, today as todayIso } from "@/state/progress";
import { DECK } from "@/content";
import { go } from "@/lib/router";
import { isDone, lessonHref, plain, plural } from "./course";
import {
  LAST_DAY, PracticeMod, WEEKS, clampDay, dateOfDay, defaultDay, dayStatus, isContestDay, lessonsForDay, linkFor, planDay,
  practiceForDay, resolveQueue, topicOf,
} from "./plan";
import { DayProblems } from "./ProblemList";

/* ---------------- The daily 3-hour block ---------------- */

interface Phase { from: number; to: number; title: string; text: string }
const PHASES: Phase[] = [
  { from: 0, to: 10, title: "Recognition warm-up", text: "20 cards, 15 seconds each. Say the pattern and the target complexity out loud." },
  { from: 10, to: 40, title: "Learn the idea", text: "Do lesson A. Type the template from memory twice." },
  { from: 40, to: 150, title: "Problems", text: "Work in order and respect the time boxes. Write the three-line clue comment first." },
  { from: 150, to: 180, title: "Log and re-solve", text: "Log 1 mistake, write 3 new cards, re-solve 1 or 2 problems from the queue." },
];
const clock = (min: number) => `${Math.floor(min / 60)}:${String(Math.floor(min % 60)).padStart(2, "0")}`;
const hms = (sec: number) => `${Math.floor(sec / 3600)}:${String(Math.floor((sec % 3600) / 60)).padStart(2, "0")}:${String(Math.floor(sec % 60)).padStart(2, "0")}`;

/* The block timer is a per-browser convenience: kept in localStorage, wrapped in try/catch. */
const TIMER_KEY = "cp30:block";
interface TimerState { start: number | null; acc: number }
function loadTimer(): TimerState {
  try { const r = localStorage.getItem(TIMER_KEY); if (r) { const t = JSON.parse(r); if (typeof t.acc === "number") return t; } } catch { /* blocked */ }
  return { start: null, acc: 0 };
}
function saveTimer(t: TimerState) { try { localStorage.setItem(TIMER_KEY, JSON.stringify(t)); } catch { /* blocked */ } }

function useBlockTimer() {
  const [t, setT] = useState<TimerState>(loadTimer);
  const [, tick] = useState(0);
  useEffect(() => {
    if (t.start === null) return;
    const id = setInterval(() => tick((x) => x + 1), 1000);
    return () => clearInterval(id);
  }, [t.start]);
  const elapsed = (t.acc + (t.start !== null ? Date.now() - t.start : 0)) / 1000;
  const set = (n: TimerState) => { saveTimer(n); setT(n); };
  return {
    running: t.start !== null, elapsed,
    start: () => set({ start: Date.now(), acc: t.acc }),
    pause: () => set({ start: null, acc: t.acc + (t.start !== null ? Date.now() - t.start : 0) }),
    reset: () => set({ start: null, acc: 0 }),
  };
}

/* ---------------- Page ---------------- */

export default function TodayPage({ day: routeDay }: { day?: number }) {
  const p = useProgress();
  const cur = planDay(p);
  const [day, setDay] = useState(() => clampDay(routeDay ?? defaultDay(p)));

  // Follow the route (#today, #today-5), including nav clicks after the picker changed the address silently.
  useEffect(() => { setDay(clampDay(routeDay ?? defaultDay(progress.get()))); }, [routeDay]);
  useEffect(() => {
    const f = () => { const m = location.hash.match(/^#today(?:-(\d+))?$/); if (m) setDay(clampDay(m[1] ? Number(m[1]) : defaultDay(progress.get()))); };
    addEventListener("hashchange", f);
    return () => removeEventListener("hashchange", f);
  }, []);
  const pick = (d: number) => {
    const n = clampDay(d);
    setDay(n);
    try { history.replaceState(null, "", `#today-${n}`); } catch { /* sandboxed */ }
  };

  const isToday = cur !== null && day === clampDay(cur) && cur >= 0 && cur <= LAST_DAY;
  const st = dayStatus(p, day, cur);
  const week = WEEKS.find((w) => w.days.includes(day))?.label ?? "";
  const lessons = lessonsForDay(day);
  const { problems, intro } = practiceForDay(day);
  const marked = problems.filter((x) => { const s = p.problems?.[x.ref]?.s; return s === "solved" || s === "hint" || s === "editorial"; }).length;

  return (
    <div className="page today">
      <header className="td-head">
        <div className="td-picker" role="group" aria-label="Choose a day">
          <IconButton label="Previous day" onClick={() => pick(day - 1)} disabled={day <= 0}><Icon name="chevron-left" size={20} stroke={2} /></IconButton>
          <div className="td-picker-label" aria-live="polite"><span className="tnum">Day {day}</span><small>of {LAST_DAY}</small></div>
          <IconButton label="Next day" onClick={() => pick(day + 1)} disabled={day >= LAST_DAY}><Icon name="chevron-right" size={20} stroke={2} /></IconButton>
          {cur !== null && !isToday && cur >= 0 && cur <= LAST_DAY && <Button variant="plain" size="s" onClick={() => pick(cur)}>Back to today</Button>}
        </div>
        <div className="pg-eyebrow">
          {isToday ? <Chip tone="accent">Today</Chip> : st === "done" ? <Chip tone="good"><Icon name="check" size={12} stroke={3} />Done</Chip> : null}
          {week}{isContestDay(day) && <><span className="dotsep" />Review and contest day</>}
        </div>
        <h1 className="pg-title">{topicOf(day)}</h1>
        {!p.day1 && <p className="pg-sub">Your Day 1 is not set yet, so this page shows Day 0. <a href="#home">Set your Day 1</a> and the page will open on the right day.</p>}
        {p.day1 && cur !== null && cur < 0 && <p className="pg-sub">Day 0 starts in {plural(-cur, "day")}. You can look ahead now.</p>}
      </header>

      <div className="td-grid">
        <div className="td-main">
          <Section title="Lessons" id="td-lessons">
            {lessons.length === 0
              ? <div className="td-empty"><Icon name="clock" size={18} />The lessons for Day {day} are being written. Use the block below with the book's day plan.</div>
              : <div className="td-lessons">{lessons.map((f, i) => {
                  const done = isDone(p, f.lesson);
                  return (
                    <a key={f.lesson.id} href={lessonHref(f.ch.n, f.idx)} className={`td-lesson${done ? " done" : ""}`}>
                      <span className="td-lesson-k">{i === 0 ? "Lesson A · Learn the idea" : i === 1 ? "Lesson B · Drill and practice" : `Lesson ${String.fromCharCode(65 + i)}`}</span>
                      <span className="td-lesson-t">{plain(f.lesson.title)}</span>
                      {f.lesson.goal && <span className="td-lesson-g">{plain(f.lesson.goal)}</span>}
                      <span className="td-lesson-f">
                        {done ? <Chip tone="good"><Icon name="check" size={12} stroke={3} />Done</Chip> : <span>{f.lesson.minutes} min</span>}
                        <span className="td-lesson-go">{done ? "Replay" : "Start"}<Icon name="arrow-right" size={16} stroke={2.2} /></span>
                      </span>
                    </a>
                  );
                })}</div>}
          </Section>

          <BlockTimeline day={day} isToday={isToday} lessonHrefA={lessons[0] ? lessonHref(lessons[0].ch.n, lessons[0].idx) : undefined} />

          <Section title="Problems" id="td-problems" aside={problems.length ? <span className="td-count tnum">{marked} of {problems.length}</span> : null}>
            {problems.length > 0 && !PracticeMod?.PracticeList && <ProgressBar value={marked / problems.length} height={4} label="Problems attempted" />}
            {problems.length === 0
              ? <div className="td-empty"><Icon name="info" size={18} />The problem list for Day {day} appears here when its drill lesson is ready.</div>
              : <DayProblems problems={problems} intro={intro} />}
            <p className="td-rule">Mark how each one went. "Hint" and "Editorial" add the problem to the re-solve queue for Day +3 and Day +7.</p>
          </Section>
        </div>

        <aside className="td-side">
          <WarmupCard day={day} />
          <ResolveCard day={day} />
          <HoursCard day={day} />
          <div className="td-card td-remind">
            <div className="td-card-k"><Icon name="pencil" size={16} />End of the day</div>
            <div className="td-remind-t">Log 1 mistake, add 3 cards.</div>
            <p>Write one line in the mistake journal. Then write three new recognition cards in your own words, tagged Day {day}.</p>
            <a className="ui-btn ui-btn-secondary ui-btn-m ui-btn-block" href="#tracker-mistakes">Open the mistake journal</a>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Section({ title, id, aside, children }: { title: string; id: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="td-sec" aria-labelledby={id}>
      <div className="td-sec-head"><h2 id={id} className="sec-title sm">{title}</h2>{aside}</div>
      {children}
    </section>
  );
}

function BlockTimeline({ day, isToday, lessonHrefA }: { day: number; isToday: boolean; lessonHrefA?: string }) {
  const t = useBlockTimer();
  const min = t.elapsed / 60;
  const active = t.elapsed > 0 ? PHASES.findIndex((ph) => min >= ph.from && min < ph.to) : -1;
  const over = min >= 180;
  const actions: (ReactNode | null)[] = [
    <a key="w" href="#gym">Start the warm-up</a>,
    lessonHrefA ? <a key="l" href={lessonHrefA}>Open lesson A</a> : null,
    <a key="p" href="#td-problems" onClick={(e) => { e.preventDefault(); document.getElementById("td-problems")?.scrollIntoView({ behavior: "smooth", block: "start" }); }}>Go to the problems</a>,
    <a key="t" href="#tracker">Open the tracker</a>,
  ];
  return (
    <section className="td-sec" aria-labelledby="td-block">
      <div className="td-sec-head">
        <h2 id="td-block" className="sec-title sm">The 3-hour block</h2>
        <div className="td-timer">
          {(t.running || t.elapsed > 0) && <span className="td-timer-v tnum" aria-label="Time in the block">{hms(t.elapsed)}</span>}
          {t.running
            ? <Button size="s" onClick={t.pause}><Icon name="pause" size={14} stroke={2.4} />Pause</Button>
            : <Button size="s" variant={isToday ? "tinted" : "secondary"} onClick={t.start}><Icon name="play" size={13} />{t.elapsed > 0 ? "Resume" : "Start the block"}</Button>}
          {t.elapsed > 0 && <IconButton label="Reset the block timer" onClick={t.reset}><Icon name="reset" size={17} /></IconButton>}
        </div>
      </div>
      {isContestDay(day) && <p className="td-note">Review and contest day: take the 30-card recognition test in the gym, then the LeetCode Weekly in the evening.</p>}
      {day === 0 && <p className="td-note">Day 0: set up your accounts and template file, then take the 20-card baseline test in the gym. The number is not a grade, only a starting point.</p>}
      {day === 30 && <p className="td-note">Day 30: the final exam is 100 cards in the gym, 15 seconds each. Compare it with your Day 0 baseline.</p>}
      <ol className="tl">
        {PHASES.map((ph, i) => {
          const state = over || i < active ? "past" : i === active ? "now" : "next";
          const frac = i === active ? (min - ph.from) / (ph.to - ph.from) : state === "past" ? 1 : 0;
          return (
            <li key={ph.title} className={`tl-row ${t.elapsed > 0 ? state : ""}`} aria-current={i === active ? "step" : undefined}>
              <span className="tl-time tnum">{clock(ph.from)}<span aria-hidden="true">–</span><span className="sr-only"> to </span>{clock(ph.to)}</span>
              <span className="tl-dot" aria-hidden="true">{state === "past" && t.elapsed > 0 ? <Icon name="check" size={12} stroke={3} /> : null}</span>
              <span className="tl-body">
                <span className="tl-title">{ph.title}{i === active && <Chip tone="accent">Now</Chip>}</span>
                <span className="tl-text">{ph.text}</span>
                {i === active && <ProgressBar value={frac} height={4} label={`${ph.title} progress`} />}
                {actions[i] && <span className="tl-act">{actions[i]}</span>}
              </span>
            </li>
          );
        })}
      </ol>
      {over && <p className="td-note good">The 3-hour block is done. An optional extra hour: more problems from the list, but never instead of the log.</p>}
    </section>
  );
}

function WarmupCard({ day }: { day: number }) {
  const p = useProgress();
  const date = dateOfDay(p, day) ?? todayIso();
  const runs = (p.gymRuns ?? []).filter((r) => r.at === date);
  const warm = runs.filter((r) => r.kind === "warmup");
  const pool = DECK.filter((c) => c.day < day).length;
  const last = warm[warm.length - 1];
  return (
    <div className="td-card">
      <div className="td-card-k"><Icon name="timer" size={16} />Recognition warm-up</div>
      {last
        ? <div className="td-card-big"><span className="tnum">{last.right}/{last.size}</span><small>in {(last.avgMs / 1000).toFixed(1)} s per card</small></div>
        : <div className="td-card-t">{pool === 0 ? "No deck cards before this day yet" : "Not done yet"}</div>}
      <p>{pool === 0
        ? "The deck starts with cards tagged Day 1. Until then, read a clue rule and say its pattern, or browse the deck."
        : `${pool} cards are tagged before Day ${day}. Draw 20, misses first.`}</p>
      <Button variant={last ? "secondary" : "primary"} block onClick={() => go("gym")}>{last ? "Another round" : pool === 0 ? "Open the gym" : "Start the 20-card warm-up"}</Button>
    </div>
  );
}

function ResolveCard({ day }: { day: number }) {
  const p = useProgress();
  const date = dateOfDay(p, day) ?? todayIso();
  const due = resolveQueue(p).filter((r) => (!r.d3done && r.d3 <= date) || (!r.d7done && r.d7 <= date));
  return (
    <div className="td-card">
      <div className="td-card-k"><Icon name="repeat" size={16} />Re-solves due</div>
      {due.length === 0
        ? <><div className="td-card-t">Nothing due</div><p>Problems you mark "Hint" or "Editorial" come back on Day +3 and Day +7. Re-solve them from a blank file with a 15-minute box.</p></>
        : <ul className="rs-due">
            {due.map((r) => {
              const which: "d3" | "d7" = !r.d3done && r.d3 <= date ? "d3" : "d7";
              const url = linkFor({ ref: r.ref });
              return (
                <li key={r.ref}>
                  <label className="rs-check">
                    <input type="checkbox" className="ui-check" checked={false} onChange={() => progress.setResolve(r.ref, which, true)} aria-label={`Re-solved ${r.ref} (${which === "d3" ? "Day +3" : "Day +7"})`} />
                    <span className="rs-t">{url ? <a href={url} target="_blank" rel="noreferrer noopener">{r.ref}</a> : r.ref}<small>{which === "d3" ? "Day +3" : "Day +7"} re-solve · first try {r.how === "hint" ? "with a hint" : "with the editorial"}</small></span>
                  </label>
                </li>
              );
            })}
          </ul>}
      <a className="td-card-link" href="#tracker-resolve">See the whole queue</a>
    </div>
  );
}

function HoursCard({ day }: { day: number }) {
  const p = useProgress();
  const h = p.hours?.[day] ?? 0;
  const set = (v: number) => progress.setHours(day, Math.round(v * 4) / 4);
  return (
    <div className="td-card">
      <div className="td-card-k"><Icon name="clock" size={16} />Hours practised on Day {day}</div>
      <div className="hours">
        <IconButton label="Remove half an hour" onClick={() => set(h - 0.5)} disabled={h <= 0}><Icon name="chevron-left" size={18} stroke={2} /></IconButton>
        <label className="hours-v">
          <span className="sr-only">Hours</span>
          <input className="ui-input tnum" type="number" inputMode="decimal" min={0} max={16} step={0.25} value={h}
            onChange={(e) => { const v = parseFloat(e.target.value); set(Number.isFinite(v) ? v : 0); }} />
          <span aria-hidden="true">h</span>
        </label>
        <IconButton label="Add half an hour" onClick={() => set(h + 0.5)} disabled={h >= 16}><Icon name="chevron-right" size={18} stroke={2} /></IconButton>
      </div>
      <ProgressBar value={h / 3} height={4} color={h >= 3 ? "var(--good)" : undefined} label="Hours out of the 3-hour target" />
      <p>{h >= 3 ? "The 3-hour block is in." : `Target: 3 hours. ${h > 0 ? `${3 - h} to go.` : ""}`}</p>
    </div>
  );
}
