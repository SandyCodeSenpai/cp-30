import { useCallback, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button, Chip, Icon, Stage, springs } from "@/ui";
import { rng } from "@/lib/hooks";
import { OpsChart, type RowMark } from "./OpsChart";
import { BookTable } from "./BookTable";
import { BOOK, CX, CXS, CPY, PYPY, POOL, aboutTime, bookRowFor, fits, fmtN, fmtOps, log10Ops, questionFor, secondsLog, type Cx, type Question } from "./model";

const ROUND = 6;
const LIMIT = 2;

/** Six questions from six different rows of the table, in a shuffled order. */
function makeRound(seed: number, firstN?: number): Question[] {
  const r = rng(seed * 7919 + 13);
  const rows = POOL.map((_, i) => i);
  for (let i = rows.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [rows[i], rows[j]] = [rows[j], rows[i]]; }
  let qs = rows.slice(0, ROUND).map((ri) => POOL[ri][Math.floor(r() * POOL[ri].length)]);
  if (firstN && firstN > 0) {
    const first = questionFor(firstN);
    const row = bookRowFor(firstN);
    qs = [first, ...qs.filter((q) => bookRowFor(q.n) !== row)].slice(0, ROUND);
  }
  return qs;
}

type Phase = "ask" | "done";

export function BudgetMode({ n0, reduce, onDone }: { n0?: number; reduce: boolean; onDone: () => void }) {
  const [seed] = useState(() => Math.floor(Math.random() * 1000));
  const [round, setRound] = useState(1);
  const qs = useMemo(() => makeRound(seed + round, round === 1 ? n0 : undefined), [seed, round, n0]);
  const [qi, setQi] = useState(0);
  const [sel, setSel] = useState<Cx | null>(null);
  const [tried, setTried] = useState<Cx[]>([]);
  const [phase, setPhase] = useState<Phase>("ask");
  const [hint, setHint] = useState<string | null>(null);
  const [correct, setCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const reported = useRef(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const q = qs[qi];
  const row = BOOK[bookRowFor(q.n)];
  const key = row.cx;

  const check = useCallback(() => {
    if (!sel || phase !== "ask") return;
    if (sel === key) { setPhase("done"); setCorrect(true); setHint(null); setScore((s) => s + 1); return; }
    const L = log10Ops(sel, q.n);
    const slower = CX[sel].rank > CX[key].rank;
    if (tried.length === 0) {
      setTried([sel]);
      if (slower) {
        const head = `${CX[sel].label} at n = ${fmtN(q.n)} is ${fmtOps(L)} operations: ${aboutTime(secondsLog(L, CPY))} in CPython and ${aboutTime(secondsLog(L, PYPY))} in PyPy.`;
        setHint(fits(L, PYPY, LIMIT) ? `${head} PyPy might pass, but CPython would not, and the table asks for less. Try a faster row.` : `${head} That is far too slow. Try a faster row.`);
      } else {
        setHint(`${CX[sel].label} passes easily: only ${fmtOps(L)} operations. But the setter allows more work than that. Which slower row still fits?`);
      }
      return;
    }
    setTried((t) => [...t, sel]); setPhase("done"); setCorrect(false); setHint(null);
  }, [sel, phase, key, q.n, tried.length]);

  const next = useCallback(() => {
    if (qi + 1 >= qs.length) {
      setFinished(true);
      if (!reported.current) { reported.current = true; onDone(); }
      return;
    }
    setQi(qi + 1); setSel(null); setTried([]); setPhase("ask"); setHint(null); setCorrect(null);
    rootRef.current?.querySelector<HTMLElement>(".cx-q")?.focus({ preventScroll: true });
  }, [qi, qs.length, onDone]);

  const restart = () => { setRound((r) => r + 1); setQi(0); setSel(null); setTried([]); setPhase("ask"); setHint(null); setCorrect(null); setScore(0); setFinished(false); };

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (finished) return;
    if (phase === "ask" && /^[1-8]$/.test(e.key)) { setSel(CXS[Number(e.key) - 1].id); e.preventDefault(); }
    if (e.key === "Enter" && !(e.target instanceof HTMLButtonElement)) { e.preventDefault(); phase === "ask" ? check() : next(); }
  };

  const marks: Partial<Record<Cx, RowMark>> = {};
  tried.forEach((t) => { marks[t] = "wrong"; });
  if (phase === "done") marks[key] = "key";

  if (finished) {
    return (
      <div className="cx-finish" ref={rootRef}>
        <motion.div className="cx-score" initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={reduce ? { duration: 0.15 } : springs.smooth}>
          <div className="cx-score-num">{score}<span> of {qs.length}</span></div>
          <div className="cx-score-text">{score === qs.length ? "Every budget right. You read n like a setter." : score >= qs.length - 2 ? "Most budgets right. Look again at the rows you missed." : "Read the table below once more, then try a new round."}</div>
          <Button variant="primary" onClick={restart}><Icon name="reset" size={18} />New round</Button>
        </motion.div>
        <BookTable active={null} title="The constraint table to remember" />
      </div>
    );
  }

  return (
    <div className="cx-budget" ref={rootRef} onKeyDown={onKey}>
      <div className="cx-budget-side">
        <div className="cx-qhead">
          <span className="cx-qcount">Question {qi + 1} of {qs.length}</span>
          <span className="cx-dots" aria-hidden="true">{qs.map((_, i) => <i key={i} className={i < qi ? "past" : i === qi ? "now" : ""} />)}</span>
        </div>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={`${round}-${qi}`} className="cx-q" tabIndex={-1}
            initial={reduce ? { opacity: 0 } : { opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={reduce ? { opacity: 0 } : { opacity: 0, x: -24 }}
            transition={reduce ? { duration: 0.15 } : springs.smooth}>
            <div className="cx-constraints">
              <div className="cx-constraints-title"><span>Constraints</span><Chip>Time limit {LIMIT} s</Chip></div>
              {q.lines.map((l) => <code key={l}>{l}</code>)}
            </div>
            <p className="cx-prompt">Which complexity did the setter pick this n for?</p>
          </motion.div>
        </AnimatePresence>
        <AnimatePresence mode="popLayout" initial={false}>
          {(hint || phase === "done") && (
            <motion.div key={phase === "done" ? `d${qi}` : `h${qi}-${tried.length}`} className={`cx-feedback ${phase === "done" ? (correct ? "good" : "bad") : "bad"}`} role="status"
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={reduce ? { duration: 0.15 } : springs.smooth}>
              <div className="cx-feedback-head">
                <Icon name={phase === "done" && correct ? "check" : "info"} size={18} />
                {phase === "done" ? (correct ? "Correct" : "Not quite. Here is why.") : "Not quite"}
              </div>
              {phase === "done" ? (
                <p>{correct ? "" : <>The target is <b>{CX[key].label}</b>. </>}{row.why} Typical tool: {row.tool.toLowerCase()}.</p>
              ) : <p>{hint}</p>}
            </motion.div>
          )}
        </AnimatePresence>
        <div className="cx-actions">
          {phase === "ask"
            ? <Button variant="primary" size="l" block disabled={!sel} onClick={check}>Check</Button>
            : <Button variant="primary" size="l" block onClick={next}>{qi + 1 >= qs.length ? "See result" : "Next question"}</Button>}
        </div>
      </div>
      <Stage className="cx-stage">
        <div className="cx-stage-cap">{phase === "done" ? <>Every row at n = {fmtN(q.n)}</> : tried.length ? <>Your first pick at n = {fmtN(q.n)}</> : <>Pick a row. The bars appear when you check.</>}</div>
        <OpsChart n={q.n} limit={LIMIT} selected={sel} onSelect={phase === "ask" ? (c) => setSel(c) : undefined}
          bars={phase === "done" ? true : tried} chips marks={marks} reduce={reduce} stagger={phase === "done"} keys={phase === "ask"}
          label="Pick the target complexity" />
      </Stage>
    </div>
  );
}
