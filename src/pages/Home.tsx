import { useRef, useState, type CSSProperties } from "react";
import { motion } from "framer-motion";
import { Button, Icon, ProgressBar, Ring } from "@/ui";
import { progress, useProgress, streakOf, today as todayIso } from "@/state/progress";
import { WIDGETS, WIDGET_LIST } from "@/widgets/registry";
import type { WidgetId } from "@/widgets/ids";
import { go } from "@/lib/router";
import { useReducedMotion } from "@/lib/hooks";
import { ALL_LESSONS, COURSE, continueTarget, isDone, lessonHref, partColor, plain, plural } from "./course";
import { CountUp, LabCard, fadeUp } from "./common";
import { DAY_TOPICS, LAST_DAY, WEEKS, clampDay, dayStatus, isContestDay, lessonsForDay, planDay, practiceForDay, shortTopicOf, topicOf, type DayStatus } from "./plan";
import Path from "./Path";

const FEATURED: WidgetId = "triage";

export default function Home() {
  const p = useProgress();
  const reduce = useReducedMotion();
  return (
    <div className="page home">
      <motion.section className="home-hero" {...fadeUp(reduce)} aria-label="Today">
        <TodayHero />
        <div className="home-side">
          <StreakCard />
          <ContinueCard />
        </div>
      </motion.section>

      <motion.section className="home-plan" aria-labelledby="plan-h" {...fadeUp(reduce, 0.05)}>
        <div className="sec-head">
          <h2 id="plan-h" className="sec-title">The 30-day plan</h2>
          <p className="sec-sub">Day 0 is setup. Days 1 to 28 are four weeks of topics, with a review and a contest every 7th day. Day 29 is a full mock and Day 30 is the final exam.</p>
        </div>
        <PlanGrid />
      </motion.section>

      <section className="home-path" aria-labelledby="path-h">
        <div className="sec-head">
          <h2 id="path-h" className="sec-title">Your path</h2>
          <p className="sec-sub">{plural(COURSE.length, "chapter")} in seven parts. Go in order, or open any lesson.</p>
        </div>
        <Path />
      </section>

      <section className="home-labs" aria-labelledby="labs-h">
        <FeaturedLab />
        <LabStrip done={p.widgets ?? {}} />
      </section>
    </div>
  );
}

/* ---------------- Today hero ---------------- */

function TodayHero() {
  const p = useProgress();
  if (!p.day1) return <SetDay1 />;
  const pd = planDay(p) ?? 0;
  const day = clampDay(pd);
  const lessons = lessonsForDay(day);
  const { problems } = practiceForDay(day);
  const solved = problems.filter((x) => p.problems?.[x.ref]?.s === "solved" || p.problems?.[x.ref]?.s === "hint" || p.problems?.[x.ref]?.s === "editorial").length;
  const warmDone = (p.gymRuns ?? []).some((r) => r.at === todayIso() && r.kind === "warmup");
  const next = lessons.find((f) => !isDone(p, f.lesson));
  const eyebrow = pd < 0 ? `Day 0 starts in ${plural(-pd, "day")}` : pd > LAST_DAY ? "The 30 days are done" : `Day ${day} of ${LAST_DAY}`;
  const week = WEEKS.find((w) => w.days.includes(day))?.label ?? "";

  return (
    <div className="hero-card">
      <div className="hero-top">
        <div className="hero-daynum" aria-hidden="true"><span className="tnum">{day}</span><small>of {LAST_DAY}</small></div>
        <div className="hero-head">
          <div className="pg-eyebrow">{eyebrow}{pd >= 0 && pd <= LAST_DAY && week && <><span className="dotsep" />{week}</>}</div>
          <h1 className="hero-title">{topicOf(day)}</h1>
        </div>
      </div>

      <ul className="hero-lessons" aria-label="Lessons for this day">
        {lessons.length === 0 && <li className="hero-lesson empty"><span className="hl-ico"><Icon name="clock" size={18} /></span><span className="hl-body"><span className="hl-t">Lessons for this day are being written</span><span className="hl-m">The problems and the gym still work.</span></span></li>}
        {lessons.slice(0, 2).map((f, i) => {
          const done = isDone(p, f.lesson);
          return (
            <li key={f.lesson.id}>
              <a className={`hero-lesson${done ? " done" : ""}`} href={lessonHref(f.ch.n, f.idx)}>
                <span className="hl-ico">{done ? <Icon name="check" size={18} stroke={2.6} /> : <Icon name={i === 0 ? "book" : "target"} size={18} />}</span>
                <span className="hl-body">
                  <span className="hl-k">{i === 0 ? "Lesson A · Learn" : "Lesson B · Drill"}{done ? " · Done" : ` · ${f.lesson.minutes} min`}</span>
                  <span className="hl-t">{plain(f.lesson.title)}</span>
                </span>
                <Icon name="chevron-right" size={18} stroke={2} className="hl-chev" />
              </a>
            </li>
          );
        })}
      </ul>

      <div className="hero-stats">
        <a className="hero-stat" href={`#today-${day}`}>
          <span className="hs-k">Problems</span>
          <span className="hs-v tnum">{problems.length ? `${solved} of ${problems.length}` : "None listed yet"}</span>
          {problems.length > 0 && <ProgressBar value={solved / problems.length} height={4} label="Problems done" />}
        </a>
        <a className="hero-stat" href="#gym">
          <span className="hs-k">Gym warm-up</span>
          <span className={`hs-v${warmDone ? " good" : ""}`}>{warmDone ? <><Icon name="check" size={16} stroke={2.6} />Done today</> : day <= 1 ? "Deck opens after Day 1" : "20 cards, not done"}</span>
        </a>
      </div>

      <div className="hero-actions">
        {next
          ? <Button variant="primary" size="l" onClick={() => go(lessonHref(next.ch.n, next.idx).slice(1))}>{lessons.indexOf(next) === 0 ? "Start lesson A" : "Start lesson B"}<Icon name="arrow-right" size={18} stroke={2.2} /></Button>
          : <Button variant="primary" size="l" onClick={() => go(`today-${day}`)}>Open the day plan<Icon name="arrow-right" size={18} stroke={2.2} /></Button>}
        {next && <Button variant="ghost" size="l" onClick={() => go(`today-${day}`)}>Day plan</Button>}
      </div>
    </div>
  );
}

function SetDay1() {
  const [v, setV] = useState(todayIso());
  return (
    <form className="hero-card setup" onSubmit={(e) => { e.preventDefault(); if (/^\d{4}-\d{2}-\d{2}$/.test(v)) progress.setDay1(v); }}>
      <div className="pg-eyebrow">Set up your month</div>
      <h1 className="hero-title">When is your Day 1?</h1>
      <p className="hero-text">Day 0 is the day before: setup and a baseline test. Every page counts days from here, so you always know what today is for. You can change it later in the Tracker.</p>
      <div className="setup-row">
        <label className="ui-field">
          <span>Day 1</span>
          <input className="ui-input" type="date" value={v} required onChange={(e) => setV(e.target.value)} />
        </label>
        <Button variant="primary" size="l" type="submit">Start the plan<Icon name="arrow-right" size={18} stroke={2.2} /></Button>
      </div>
      <ul className="setup-facts">
        <li><Icon name="clock" size={16} />3 hours a day</li>
        <li><Icon name="timer" size={16} />15-second recognition gym</li>
        <li><Icon name="target" size={16} />6 to 8 problems a day</li>
      </ul>
    </form>
  );
}

/* ---------------- Side cards ---------------- */

const DAY = ["S", "M", "T", "W", "T", "F", "S"];
const DAY_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function StreakCard() {
  const p = useProgress();
  const s = streakOf(p.days ?? []);
  const now = new Date();
  return (
    <div className="today-card">
      <div>
        <div className="today-big"><CountUp value={s.count} /><span className="today-unit">day streak</span></div>
        <div className="today-label">{s.count === 0 ? "Finish a lesson to start a streak." : s.todayDone ? "Today is done." : "Finish a lesson today to keep it."}</div>
      </div>
      <ol className="week" aria-label="The last seven days">
        {s.week.map((on, i) => {
          const d = new Date(now); d.setDate(now.getDate() - (6 - i));
          const isToday = i === 6;
          return (
            <li key={i} className={`wday${on ? " on" : ""}${isToday ? " today" : ""}`} aria-label={`${isToday ? "Today" : DAY_FULL[d.getDay()]}: ${on ? "lesson done" : "no lesson"}`}>
              <span className="wdot">{on && <Icon name="check" size={12} stroke={3} />}</span>
              <span className="wlet" aria-hidden="true">{DAY[d.getDay()]}</span>
            </li>
          );
        })}
      </ol>
      <div className="today-xp"><Icon name="bolt" size={14} stroke={2} /><CountUp value={p.xp || 0} /> XP total</div>
    </div>
  );
}

function ContinueCard() {
  const p = useProgress();
  const t = continueTarget(p);
  const total = ALL_LESSONS.length;
  const done = ALL_LESSONS.filter((f) => p.done?.[f.lesson.id]).length;
  if (!t) {
    return (
      <div className="cont-mini">
        <div className="pg-eyebrow">{total > 0 ? "Course complete" : "Getting ready"}</div>
        <div className="cont-mini-t">{total > 0 ? "You finished every lesson." : "Lessons are on their way."}</div>
        <a className="cont-mini-go" href="#gym">Keep the gym going<Icon name="chevron-right" size={16} stroke={2} /></a>
      </div>
    );
  }
  const { f, step, resumed } = t;
  const steps = f.lesson.steps.length;
  const frac = resumed && steps ? Math.min(1, (step ?? 0) / steps) : 0;
  return (
    <a className="cont-mini" href={lessonHref(f.ch.n, f.idx)} style={{ "--pc": partColor(f.ch.part) } as CSSProperties}>
      <div className="cont-mini-row">
        <Ring value={frac} size={36} stroke={4} color="var(--pc)" />
        <div className="cont-mini-body">
          <div className="pg-eyebrow">{resumed ? "Continue" : done === 0 ? "Start the course" : "Next in the course"}</div>
          <div className="cont-mini-t">{plain(f.lesson.title)}</div>
          <div className="cont-mini-m">{resumed && steps ? `Step ${Math.min(steps, (step ?? 0) + 1)} of ${steps}` : `Chapter ${f.ch.n}, lesson ${f.idx}`}{f.lesson.day !== undefined ? ` · Day ${f.lesson.day}` : ""}</div>
        </div>
        <Icon name="chevron-right" size={18} stroke={2} className="cont-mini-chev" />
      </div>
      {total > 0 && <div className="cont-mini-foot"><span className="tnum">{done} of {total}</span> lessons done</div>}
    </a>
  );
}

/* ---------------- Plan grid ---------------- */

const STATUS_TEXT: Record<DayStatus, string> = { done: "done", today: "today", missed: "not finished", ahead: "ahead" };

export function PlanGrid() {
  const p = useProgress();
  const cur = planDay(p);
  return (
    <div className="plan">
      <div className="plan-legend" aria-hidden="true">
        <span><i className="lg done" />Done</span><span><i className="lg today" />Today</span><span><i className="lg missed" />Not finished</span><span><i className="lg ahead" />Ahead</span>
      </div>
      <div className="plan-rows">
        {WEEKS.map((w) => (
          <div key={w.label} className="plan-row">
            <div className="plan-label">{w.label}</div>
            <ol className="plan-cells">
              {w.days.map((d) => {
                const st = dayStatus(p, d, cur);
                return (
                  <li key={d}>
                    <a href={`#today-${d}`} className={`pcell s-${st}${isContestDay(d) ? " contest" : ""}`}
                      aria-label={`Day ${d}, ${DAY_TOPICS[d][0]}, ${STATUS_TEXT[st]}`} aria-current={st === "today" ? "date" : undefined}>
                      <span className="pcell-top">
                        <span className="pcell-n tnum">{d}</span>
                        <span className="pcell-st" aria-hidden="true">{st === "done" ? <Icon name="check" size={13} stroke={3} /> : null}</span>
                      </span>
                      <span className="pcell-t">{shortTopicOf(d)}</span>
                    </a>
                  </li>
                );
              })}
            </ol>
          </div>
        ))}
      </div>
      {!p.day1 && <p className="plan-note">Set your Day 1 above to see which day is today.</p>}
    </div>
  );
}

/* ---------------- Labs ---------------- */

export function FeaturedLab({ wide }: { wide?: boolean }) {
  const w = WIDGETS[FEATURED];
  const p = useProgress();
  return (
    <a href={`#lab-${FEATURED}`} className={`play-card${wide ? " wide" : ""}`}>
      <div className="play-text">
        <div className="pg-eyebrow"><Icon name="sparkle" size={15} stroke={2} />Featured lab{p.widgets?.[FEATURED] ? " · Done" : ""}</div>
        <h3 className="play-title">{w?.title ?? "The 15-second triage"}</h3>
        <p className="play-sum">{w?.summary}</p>
        <span className="play-go">Open the lab<Icon name="arrow-right" size={17} stroke={2.2} /></span>
      </div>
      <div className="play-art"><TriageArt /></div>
    </a>
  );
}

/** Static picture of the 15-second scan: four questions, each one narrows the candidate patterns. */
function TriageArt() {
  const cols = [8, 5, 3, 1];
  const steps = ["n and values", "What it returns", "Input shape", "Trigger phrase"];
  return (
    <div className="triage-art">
      <svg viewBox="0 0 400 150" role="img" aria-label="Four scan steps. Eight candidate patterns become five, then three, then one.">
        {cols.map((k, c) => (
          <g key={c} transform={`translate(${8 + c * 98} 0)`}>
            {Array.from({ length: 8 }, (_, r) => {
              const alive = r < k;
              const last = c === 3 && r === 0;
              return <rect key={r} x={0} y={8 + r * 17} width={84} height={11} rx={5.5} className={last ? "ta-win" : alive ? "ta-on" : "ta-off"} />;
            })}
          </g>
        ))}
      </svg>
      <ol className="triage-steps" aria-hidden="true">{steps.map((s, i) => <li key={s}><b>{i + 1}</b>{s}</li>)}</ol>
    </div>
  );
}

function LabStrip({ done }: { done: Record<string, true> }) {
  const ref = useRef<HTMLDivElement>(null);
  const labs = WIDGET_LIST.filter((w) => w.id !== FEATURED);
  const scroll = (dir: number) => { const el = ref.current; if (el) el.scrollBy({ left: dir * Math.max(260, el.clientWidth * 0.8), behavior: "smooth" }); };
  return (
    <div className="strip">
      <div className="strip-head">
        <h2 id="labs-h" className="sec-title sm">Labs</h2>
        <span className="strip-count">{labs.length + 1} algorithm players to step through</span>
        <div className="strip-nav">
          <button type="button" className="ui-iconbtn" aria-label="Scroll labs left" onClick={() => scroll(-1)}><Icon name="chevron-left" size={18} stroke={2} /></button>
          <button type="button" className="ui-iconbtn" aria-label="Scroll labs right" onClick={() => scroll(1)}><Icon name="chevron-right" size={18} stroke={2} /></button>
          <a href="#labs" className="strip-all">All labs</a>
        </div>
      </div>
      <div className="strip-track" ref={ref}>
        {labs.map((w) => <LabCard key={w.id} w={w} done={!!done[w.id]} compact />)}
      </div>
    </div>
  );
}
