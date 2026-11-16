/**
 * The 15-second recognition gym (book chapter 9): daily 20-card warm-up, recognition tests,
 * history and a deck browser. Cards come from src/content/deck.ts.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button, Chip, Icon, IconButton, Kbd, LineChart, Segmented, springs } from "@/ui";
import { DECK } from "@/content";
import type { Card } from "@/content/deck";
import { progress, useProgress, type CardStat, type ProgressState } from "@/state/progress";
import { useReducedMotion } from "@/lib/hooks";
import { PageHead } from "./common";
import { LAST_DAY, planDay, whenLabel } from "./plan";

const LIMIT_MS = 15000;
type Mode = "say" | "pick";
type Kind = "warmup" | "test";

/* ---------------- Deck helpers ---------------- */

const blockOf = (n: number) => (n <= 42 ? "A" : n <= 88 ? "B" : n <= 118 ? "C" : "D");
const BLOCKS = [
  { id: "A", label: "Block A", range: "Cards 1–42", days: "Days 1–6" },
  { id: "B", label: "Block B", range: "Cards 43–88", days: "Days 8–14" },
  { id: "C", label: "Block C", range: "Cards 89–118", days: "Days 15–20" },
  { id: "D", label: "Block D", range: "Cards 119–150", days: "Days 22–27" },
];

function shuffle<T>(a: T[]): T[] {
  const x = [...a];
  for (let i = x.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [x[i], x[j]] = [x[j], x[i]]; }
  return x;
}
/** Avoid two neighbours from the same day where possible (interleaving). */
function interleave(cards: Card[]): Card[] {
  const out: Card[] = [];
  const rest = [...cards];
  while (rest.length) {
    const prev = out[out.length - 1];
    const i = rest.findIndex((c) => !prev || c.day !== prev.day);
    out.push(rest.splice(i < 0 ? 0 : i, 1)[0]);
  }
  return out;
}

/** Warm-up draw: last misses first, then a weighted random fill that favours low Leitner boxes. */
function drawWarmup(pool: Card[], gym: Record<number, CardStat>, size: number): Card[] {
  const misses = shuffle(pool.filter((c) => gym[c.n] && gym[c.n].seen > 0 && gym[c.n].box === 1)).slice(0, Math.ceil(size / 2));
  const picked = new Set(misses.map((c) => c.n));
  const rest = pool.filter((c) => !picked.has(c.n)).map((c) => ({ c, w: 6 - (gym[c.n]?.box ?? 1) }));
  const fill: Card[] = [];
  while (fill.length + misses.length < size && rest.length) {
    const total = rest.reduce((a, r) => a + r.w, 0);
    let x = Math.random() * total, i = 0;
    while (i < rest.length - 1 && x >= rest[i].w) { x -= rest[i].w; i++; }
    fill.push(rest.splice(i, 1)[0].c);
  }
  return [...misses, ...interleave(shuffle(fill))];
}
/** Test draw: the cards you have seen least, at random. The 100-card exam takes at least 20 from block D. */
function drawTest(pool: Card[], gym: Record<number, CardStat>, size: number): Card[] {
  const order = shuffle(pool).sort((a, b) => (gym[a.n]?.seen ?? 0) - (gym[b.n]?.seen ?? 0));
  let set = order.slice(0, size);
  if (size >= 100) {
    const d = set.filter((c) => blockOf(c.n) === "D").length;
    if (d < 20) {
      const extra = order.filter((c) => blockOf(c.n) === "D" && !set.includes(c)).slice(0, 20 - d);
      const keep = set.filter((c) => blockOf(c.n) !== "D").slice(0, size - (d + extra.length));
      set = [...set.filter((c) => blockOf(c.n) === "D"), ...extra, ...keep];
    }
  }
  return interleave(shuffle(set));
}

/** Four pattern options for "Pick it": the right one plus three from the same block. */
function optionsFor(card: Card): string[] {
  const same = shuffle(DECK.filter((c) => blockOf(c.n) === blockOf(card.n) && c.pattern !== card.pattern));
  const other = shuffle(DECK.filter((c) => c.pattern !== card.pattern));
  const opts: string[] = [];
  for (const c of [...same, ...other]) { if (!opts.includes(c.pattern)) opts.push(c.pattern); if (opts.length === 3) break; }
  return shuffle([card.pattern, ...opts]);
}

/* ---------------- Page ---------------- */

interface Session { cards: Card[]; kind: Kind; mode: Mode; label: string }
interface Answer { card: Card; right: boolean; ms: number }

export default function GymPage() {
  const p = useProgress();
  const [session, setSession] = useState<Session | null>(null);
  const [result, setResult] = useState<{ s: Session; answers: Answer[] } | null>(null);

  const finish = useCallback((s: Session, answers: Answer[]) => {
    if (answers.length) {
      const right = answers.filter((a) => a.right).length;
      const avgMs = Math.round(answers.reduce((a, x) => a + x.ms, 0) / answers.length);
      progress.addGymRun({ kind: s.kind, size: answers.length, right, avgMs });
      setResult({ s, answers });
    }
    setSession(null);
    window.scrollTo(0, 0);
  }, []);

  if (session) return <Runner key={session.label + session.cards.map((c) => c.n).join(",")} session={session} onDone={(a) => finish(session, a)} onQuit={() => setSession(null)} />;
  if (result) return <Results p={p} r={result} onBack={() => setResult(null)} onAgain={(cards) => { setResult(null); setSession({ cards, kind: "warmup", mode: result.s.mode, label: "Misses again" }); }} />;
  return <GymHome p={p} onStart={(s) => { setSession(s); window.scrollTo(0, 0); }} />;
}

/* ---------------- Home: start, test, history, deck ---------------- */

function GymHome({ p, onStart }: { p: ProgressState; onStart: (s: Session) => void }) {
  const cur = planDay(p);
  const defUpTo = cur === null ? LAST_DAY : Math.max(0, Math.min(LAST_DAY, cur - 1));
  const [mode, setMode] = useState<Mode>(() => { try { return (localStorage.getItem("cp30:gym-mode") as Mode) === "pick" ? "pick" : "say"; } catch { return "say"; } });
  const [upTo, setUpTo] = useState(defUpTo);
  const [testSize, setTestSize] = useState<number>(cur === LAST_DAY ? 100 : cur !== null && cur > 0 && cur % 7 === 0 ? 30 : 20);
  const setModeSaved = (m: Mode) => { setMode(m); try { localStorage.setItem("cp30:gym-mode", m); } catch { /* blocked */ } };

  const pool = useMemo(() => DECK.filter((c) => c.day <= upTo), [upTo]);
  const testPool = testSize >= 100 || cur === null || cur <= 0 ? DECK : DECK.filter((c) => c.day <= Math.max(cur, 1));
  const gym = p.gym ?? {};
  const seen = Object.values(gym).filter((c) => c.seen > 0).length;
  const mastered = Object.values(gym).filter((c) => c.box >= 5).length;
  const box1 = Object.values(gym).filter((c) => c.seen > 0 && c.box === 1).length;

  return (
    <div className="page gym">
      <PageHead eyebrow={cur !== null && cur >= 0 && cur <= LAST_DAY ? `Day ${cur} of ${LAST_DAY}` : "The 15-second reflex"} title="Recognition gym"
        sub="Read a problem, then name its pattern and its target complexity in 15 seconds. A card is correct only if both are right and in time." />

      <div className="gym-top">
        <section className="gym-card start" aria-labelledby="gw-h">
          <div className="gym-card-k"><Icon name="timer" size={16} />Daily warm-up</div>
          <h2 id="gw-h" className="gym-card-t">20 cards, misses first</h2>
          <Segmented label="How you answer" value={mode} onChange={setModeSaved} options={[{ value: "say", label: "Say it" }, { value: "pick", label: "Pick it" }]} />
          <p className="gym-hint">{mode === "say"
            ? "Say the pattern and the complexity out loud, press Space to check, then grade yourself honestly."
            : "Pick the pattern from four options. Good for your first days; switch to Say it once it feels easy."}</p>
          <label className="ui-field">
            <span>Cards up to</span>
            <select className="ui-select" value={upTo} onChange={(e) => setUpTo(Number(e.target.value))}>
              {Array.from({ length: LAST_DAY + 1 }, (_, d) => <option key={d} value={d}>Day {d}{d === defUpTo && cur !== null ? " (before today)" : ""}</option>)}
            </select>
            <small>{pool.length ? `${pool.length} cards in the pool.` : "No cards are tagged this early. The deck starts at Day 1."}</small>
          </label>
          <Button variant="primary" size="l" block disabled={!pool.length}
            onClick={() => onStart({ cards: drawWarmup(pool, gym, 20), kind: "warmup", mode, label: "Warm-up" })}>
            Start the warm-up<Icon name="arrow-right" size={18} stroke={2.2} />
          </Button>
        </section>

        <section className="gym-card" aria-labelledby="gt-h">
          <div className="gym-card-k"><Icon name="target" size={16} />Recognition test</div>
          <h2 id="gt-h" className="gym-card-t">A fresh set, the cards you have seen least</h2>
          <Segmented label="Size" value={testSize} onChange={setTestSize} options={[{ value: 20, label: "20" }, { value: 30, label: "30" }, { value: 100, label: "100" }]} />
          <p className="gym-hint">{testSize === 20 ? "Baseline on Day 0: 20 random cards, cold. No target, only an honest number."
            : testSize === 30 ? "Weekly test on Days 7, 14, 21 and 28. Target: 75% or more."
            : "Final exam on Day 30: 100 cards from the whole deck, at least 20 from block D. Target: about 85%."}</p>
          <p className="gym-hint muted">{testSize >= 100 || cur === null || cur <= 0 ? "Draws from all 150 cards." : `Draws from the ${testPool.length} cards tagged up to Day ${Math.max(cur, 1)}.`}</p>
          <Button variant="secondary" size="l" block onClick={() => onStart({ cards: drawTest(testPool, gym, testSize), kind: "test", mode, label: `${testSize}-card test` })}>
            Start the test
          </Button>
        </section>
      </div>

      <div className="gym-stats" aria-label="Deck progress">
        <div><span className="tnum">{seen}</span><small>cards seen of {DECK.length}</small></div>
        <div><span className="tnum">{mastered}</span><small>in box 5 (steady)</small></div>
        <div><span className="tnum">{box1}</span><small>last answer missed</small></div>
      </div>

      <History p={p} />
      <DeckBrowser p={p} />
    </div>
  );
}

function History({ p }: { p: ProgressState }) {
  const runs = p.gymRuns ?? [];
  const warm = runs.map((r, i) => ({ r, i: i + 1 })).filter((x) => x.r.kind === "warmup");
  const tests = runs.map((r, i) => ({ r, i: i + 1 })).filter((x) => x.r.kind === "test");
  const pct = (r: { right: number; size: number }) => Math.round((r.right / Math.max(1, r.size)) * 100);
  return (
    <section className="gym-sec" aria-labelledby="gh-h">
      <div className="sec-head"><h2 id="gh-h" className="sec-title sm">History</h2><p className="sec-sub">Percent correct per run. The dashed lines are the weekly target (75%) and the Day 30 target (85%).</p></div>
      {runs.length === 0
        ? <div className="gym-empty">No runs yet. Your first warm-up or test shows up here.</div>
        : <div className="gym-hist">
            <div className="gym-chart">
              <LineChart height={200} yMin={0} yMax={100} xMin={1} xMax={Math.max(2, runs.length)} yFmt={(v) => `${Math.round(v)}%`} xFmt={(v) => `${Math.round(v)}`} xLabel="run"
                hLines={[{ y: 75, label: "75%", tone: "warn" }, { y: 85, label: "85%", tone: "good" }]}
                series={[
                  { id: "w", label: "Warm-ups", color: "var(--accent)", dots: true, points: warm.map((x) => [x.i, pct(x.r)] as [number, number]) },
                  { id: "t", label: "Tests", color: "var(--c-staff)", dots: true, points: tests.map((x) => [x.i, pct(x.r)] as [number, number]) },
                ]} />
            </div>
            <div className="gym-tests">
              <div className="gym-tests-h">Tests</div>
              {tests.length === 0 ? <p className="gym-hint muted">No tests yet. Take the baseline on Day 0.</p> : (
                <ol className="gym-runs">
                  {[...tests].reverse().slice(0, 8).map(({ r, i }) => (
                    <li key={i}><span className="gr-when">{whenLabel(p, r.at)}</span><span className="gr-k">{r.size} cards</span><span className="gr-v tnum">{pct(r)}%</span><span className="gr-s tnum">{(r.avgMs / 1000).toFixed(1)} s</span></li>
                  ))}
                </ol>
              )}
              <div className="gym-tests-h">Last warm-ups</div>
              {warm.length === 0 ? <p className="gym-hint muted">None yet.</p> : (
                <ol className="gym-runs">
                  {[...warm].reverse().slice(0, 5).map(({ r, i }) => (
                    <li key={i}><span className="gr-when">{whenLabel(p, r.at)}</span><span className="gr-k">{r.size} cards</span><span className="gr-v tnum">{pct(r)}%</span><span className="gr-s tnum">{(r.avgMs / 1000).toFixed(1)} s</span></li>
                  ))}
                </ol>
              )}
            </div>
          </div>}
    </section>
  );
}

function Pips({ stat }: { stat?: CardStat }) {
  if (!stat || stat.seen === 0) return <span className="pips new">New</span>;
  return (
    <span className="pips" role="img" aria-label={`Box ${stat.box} of 5`}>
      {[1, 2, 3, 4, 5].map((b) => <i key={b} className={b <= stat.box ? "on" : ""} />)}
    </span>
  );
}

function DeckBrowser({ p }: { p: ProgressState }) {
  const [q, setQ] = useState("");
  const [block, setBlock] = useState("all");
  const [day, setDay] = useState(0);
  const [open, setOpen] = useState<Record<number, boolean>>({});
  const days = useMemo(() => [...new Set(DECK.map((c) => c.day))].sort((a, b) => a - b), []);
  const tokens = q.toLowerCase().split(/\s+/).filter(Boolean);
  const list = DECK.filter((c) => (block === "all" || blockOf(c.n) === block) && (!day || c.day === day)
    && tokens.every((t) => `${c.n} ${c.front} ${c.pattern} ${c.target} ${c.signal}`.toLowerCase().includes(t)));
  return (
    <section className="gym-sec" aria-labelledby="gd-h">
      <div className="sec-head"><h2 id="gd-h" className="sec-title sm">The deck</h2><p className="sec-sub">150 cards in four blocks, one per week. The day tag is the earliest day the card is fair. Answers stay hidden until you open them.</p></div>
      <div className="deck-tools">
        <label className="gl-search deck-search">
          <Icon name="search" size={18} stroke={2} />
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search the cards" aria-label="Search the cards" />
        </label>
        <Segmented label="Block" value={block} onChange={setBlock} options={[{ value: "all", label: "All" }, ...BLOCKS.map((b) => ({ value: b.id, label: b.id }))]} />
        <label className="ui-field deck-day">
          <span>Day</span>
          <select className="ui-select sm" value={day} onChange={(e) => setDay(Number(e.target.value))}>
            <option value={0}>Any day</option>
            {days.map((d) => <option key={d} value={d}>Day {d}</option>)}
          </select>
        </label>
      </div>
      <p className="gym-count">{list.length === DECK.length ? `${DECK.length} cards` : `${list.length} of ${DECK.length} cards`}{block !== "all" && <> · {BLOCKS.find((b) => b.id === block)?.days}</>}</p>
      {list.length === 0 ? <div className="gym-empty">No card matches. Try a shorter word, such as "sorted" or "minimum".</div> : (
        <ul className="deck">
          {list.map((c) => {
            const o = !!open[c.n];
            return (
              <li key={c.n} className={`dcard${o ? " open" : ""}`}>
                <button type="button" className="dcard-btn" aria-expanded={o} onClick={() => setOpen((s) => ({ ...s, [c.n]: !s[c.n] }))}>
                  <span className="dcard-meta"><span className="tnum">#{c.n}</span><span>Day {c.day}</span><span>Block {blockOf(c.n)}</span><Pips stat={p.gym?.[c.n]} /></span>
                  <span className="dcard-front">{c.front}</span>
                  <span className="dcard-toggle">{o ? "Hide the answer" : "Show the answer"}<Icon name="chevron-down" size={16} stroke={2} /></span>
                </button>
                {o && <Answer card={c} />}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function Answer({ card, timeUp }: { card: Card; timeUp?: boolean }) {
  return (
    <dl className="ans">
      {timeUp && <div className="ans-up">Time is up. Over 15 seconds counts as a miss.</div>}
      <div><dt>Pattern</dt><dd>{card.pattern}</dd></div>
      <div><dt>Target</dt><dd className="mono">{card.target}</dd></div>
      <div><dt>Trigger</dt><dd>{card.signal}</dd></div>
    </dl>
  );
}

/* ---------------- Runner ---------------- */

function CountdownRing({ ms, size = 76 }: { ms: number; size?: number }) {
  const left = Math.max(0, LIMIT_MS - ms);
  const frac = left / LIMIT_MS;
  const r = (size - 6) / 2, c = 2 * Math.PI * r;
  const tone = left <= 5000 ? "var(--warn)" : "var(--accent)";
  return (
    <div className="cd" style={{ width: size, height: size }} role="timer" aria-label={`${Math.ceil(left / 1000)} seconds left`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true" style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} className="cd-track" strokeWidth={5} />
        <circle cx={size / 2} cy={size / 2} r={r} className="cd-fill" strokeWidth={5} strokeDasharray={c} strokeDashoffset={c * (1 - frac)} style={{ stroke: tone }} />
      </svg>
      <span className="cd-n tnum" aria-hidden="true">{Math.ceil(left / 1000)}</span>
    </div>
  );
}

function Runner({ session, onDone, onQuit }: { session: Session; onDone: (a: Answer[]) => void; onQuit: () => void }) {
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [stopMs, setStopMs] = useState<number | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  const t0 = useRef(performance.now());
  const card = session.cards[i];
  const options = useMemo(() => (session.mode === "pick" ? optionsFor(card) : []), [card, session.mode]);
  const elapsed = stopMs ?? now;
  const timeUp = elapsed >= LIMIT_MS;

  // Clock: ticks until the answer is revealed. At 15 s the answer shows by itself.
  useEffect(() => {
    if (stopMs !== null) return;
    let raf = 0;
    const tick = () => {
      const e = performance.now() - t0.current;
      setNow(e);
      if (e >= LIMIT_MS) { setStopMs(LIMIT_MS); setRevealed(true); return; }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [i, stopMs]);

  // A new card starts at the top, so the question is on screen (the Next button may have scrolled the page).
  useEffect(() => { if (i > 0 && window.scrollY > 0) window.scrollTo(0, 0); }, [i]);

  const reveal = useCallback(() => { if (revealed) return; setStopMs(Math.min(LIMIT_MS, performance.now() - t0.current)); setRevealed(true); }, [revealed]);

  const record = useCallback((right: boolean) => {
    const ms = Math.round(stopMs ?? Math.min(LIMIT_MS, performance.now() - t0.current));
    const ok = right && ms <= LIMIT_MS;
    progress.gymAnswer(card.n, ok, ms);
    const next = [...answers, { card, right: ok, ms }];
    setAnswers(next);
    if (i + 1 >= session.cards.length) { onDone(next); return; }
    setI(i + 1); setRevealed(false); setStopMs(null); setPicked(null); setNow(0); t0.current = performance.now();
  }, [answers, card, i, onDone, session.cards.length, stopMs]);

  const pick = useCallback((k: number) => {
    if (revealed || k < 0 || k >= options.length) return;
    setPicked(k);
    reveal();
  }, [options.length, reveal, revealed]);

  const pickRight = picked !== null && options[picked] === card.pattern && !timeUp;
  useEffect(() => { if (revealed && session.mode === "pick") document.querySelector<HTMLButtonElement>(".run-next")?.focus(); }, [revealed, session.mode]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT")) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (session.mode === "say") {
        if (!revealed && (e.key === " " || e.key === "Enter")) { e.preventDefault(); reveal(); }
        else if (revealed && e.key === "1") { e.preventDefault(); record(true); }
        else if (revealed && e.key === "2") { e.preventDefault(); record(false); }
      } else {
        if (!revealed && /^[1-4]$/.test(e.key)) { e.preventDefault(); pick(Number(e.key) - 1); }
        else if (revealed && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); record(pickRight); }
      }
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [pick, pickRight, record, reveal, revealed, session.mode]);

  const right = answers.filter((a) => a.right).length;
  return (
    <div className="page gym-run">
      <div className="run-top">
        <IconButton label="Stop and go back to the gym" onClick={onQuit}><Icon name="x" size={20} stroke={2} /></IconButton>
        <div className="run-prog" role="progressbar" aria-label="Cards done" aria-valuemin={0} aria-valuemax={session.cards.length} aria-valuenow={i}>
          <span style={{ width: `${(i / session.cards.length) * 100}%` }} />
        </div>
        <span className="run-count tnum">{i + 1} of {session.cards.length}</span>
      </div>
      <div className="run-sub"><span>{session.label} · {session.mode === "say" ? "Say it" : "Pick it"}</span><span className="tnum">{right} right so far</span></div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={card.n} className="run-card"
          initial={reduce ? { opacity: 0 } : { opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={reduce ? { opacity: 0 } : { opacity: 0, x: -24 }}
          transition={reduce ? { duration: 0.15 } : springs.smooth}>
          <div className="run-card-head">
            <div className="run-meta"><span className="tnum">Card #{card.n}</span><span>Day {card.day}</span><span>Block {blockOf(card.n)}</span></div>
            <CountdownRing ms={elapsed} />
          </div>
          <p className="run-front" aria-live="polite">{card.front}</p>

          {session.mode === "say" && !revealed && (
            <div className="run-say">
              <p className="run-ask">Say the pattern and the target complexity out loud.</p>
              <Button variant="primary" size="l" block onClick={reveal}>Show the answer<Kbd>Space</Kbd></Button>
            </div>
          )}

          {session.mode === "pick" && (
            <div className="run-opts" role="group" aria-label="Which pattern?">
              {options.map((o, k) => {
                const isRight = o === card.pattern;
                const st = !revealed ? (picked === k ? "sel" : "") : isRight ? "right" : picked === k ? "wrong" : "dim";
                return (
                  <motion.button key={o} type="button" className={`opt ${st}`} disabled={revealed} onClick={() => pick(k)}
                    animate={st === "wrong" && !reduce ? { x: [0, -6, 6, -3, 0] } : { x: 0 }} transition={{ duration: 0.3 }}>
                    <span className="opt-k" aria-hidden="true">{k + 1}</span><span className="opt-t">{o}</span>
                    {revealed && isRight && <Icon name="check" size={18} stroke={2.6} label="Right answer" />}
                    {revealed && st === "wrong" && <Icon name="x" size={18} stroke={2.6} label="Your answer" />}
                  </motion.button>
                );
              })}
            </div>
          )}

          {revealed && (
            <motion.div initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={reduce ? { duration: 0.15 } : springs.smooth}>
              {session.mode === "pick" && (
                <div className={`run-verdict ${pickRight ? "good" : "bad"}`} role="status">
                  {pickRight ? "Correct" : picked === null ? "Time is up" : timeUp ? "Right pattern, but over 15 seconds" : "Not quite"}
                  <span className="tnum">{(elapsed / 1000).toFixed(1)} s</span>
                </div>
              )}
              <Answer card={card} timeUp={session.mode === "say" && timeUp} />
              {session.mode === "say" ? (
                <>
                  <p className="run-ask">Correct only if the pattern and the complexity were both right, within 15 seconds. <span className="tnum">You took {(elapsed / 1000).toFixed(1)} s.</span></p>
                  <div className="run-grade">
                    <Button variant="good" size="l" onClick={() => record(true)}>{timeUp ? "I said it in time" : "Got it in time"}<Kbd>1</Kbd></Button>
                    <Button variant="secondary" size="l" onClick={() => record(false)}>Missed<Kbd>2</Kbd></Button>
                  </div>
                </>
              ) : (
                <Button variant={pickRight ? "good" : "primary"} size="l" block onClick={() => record(pickRight)} className="run-next">
                  {i + 1 >= session.cards.length ? "See the results" : "Next card"}<Kbd>Enter</Kbd>
                </Button>
              )}
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ---------------- Results ---------------- */

function Results({ p, r, onBack, onAgain }: { p: ProgressState; r: { s: Session; answers: Answer[] }; onBack: () => void; onAgain: (cards: Card[]) => void }) {
  const { s, answers } = r;
  const right = answers.filter((a) => a.right).length;
  const pct = Math.round((right / answers.length) * 100);
  const avg = answers.reduce((a, x) => a + x.ms, 0) / answers.length / 1000;
  const misses = answers.filter((a) => !a.right);
  const target = s.kind === "test" ? (answers.length >= 100 ? 85 : answers.length >= 30 ? 75 : null) : null;
  const tests = (p.gymRuns ?? []).filter((x) => x.kind === "test");
  const prevTest = s.kind === "test" && tests.length > 1 ? tests[tests.length - 2] : null;
  return (
    <div className="page gym-res">
      <div className="res-card">
        <div className="pg-eyebrow">{s.label} done</div>
        <div className="res-big"><span className="tnum">{right}</span><small>of {answers.length}</small></div>
        <div className="res-stats">
          <div><span className="tnum">{pct}%</span><small>correct</small></div>
          <div><span className="tnum">{avg.toFixed(1)} s</span><small>average per card</small></div>
          <div><span className="tnum">{misses.length}</span><small>{misses.length === 1 ? "miss" : "misses"}</small></div>
        </div>
        {target !== null && <p className={`res-target ${pct >= target ? "good" : ""}`}>{pct >= target ? `At or above the ${target}% target.` : `The target is ${target}%. The misses below are your work for this week.`}</p>}
        {prevTest && <p className="res-note">Your previous test: {Math.round((prevTest.right / Math.max(1, prevTest.size)) * 100)}% at {(prevTest.avgMs / 1000).toFixed(1)} s per card.</p>}
        {s.kind === "test" && <p className="res-note">Write both numbers into the progress table in the <a href="#tracker">Tracker</a>.</p>}
        <div className="res-actions">
          {misses.length > 0 && <Button variant="primary" size="l" onClick={() => onAgain(interleave(shuffle(misses.map((m) => m.card))))}>Drill the misses again</Button>}
          <Button variant={misses.length ? "secondary" : "primary"} size="l" onClick={onBack}>Back to the gym</Button>
        </div>
      </div>

      {misses.length > 0 && (
        <section className="gym-sec" aria-labelledby="rm-h">
          <div className="sec-head"><h2 id="rm-h" className="sec-title sm">Misses</h2><p className="sec-sub">For each miss, write one line: "Missed signal: ___. It meant: ___." Missed twice in a row? Write a twin card that changes one constraint.</p></div>
          <ul className="deck">
            {misses.map((m) => (
              <li key={m.card.n} className="dcard open">
                <div className="dcard-btn static">
                  <span className="dcard-meta"><span className="tnum">#{m.card.n}</span><span>Day {m.card.day}</span><span className="tnum">{(m.ms / 1000).toFixed(1)} s</span></span>
                  <span className="dcard-front">{m.card.front}</span>
                </div>
                <Answer card={m.card} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

