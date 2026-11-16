import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button, Icon, springs } from "@/ui";
import { rng } from "@/lib/hooks";
import { DECK, type Card } from "@/content/deck";
import { BUDGETS, COST, FAM, acceptedFor, familyOf, pretty, splitFront, type Family } from "./data";
import { Candidates, STEPS, SayIt, StepPanel, Strip, type PillMark } from "./Scan";
import { useScanState } from "./state";

const GOAL = 3;

function shuffled(cards: Card[], seed: number): Card[] {
  const r = rng(seed); const a = [...cards];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

export function CardsMode({ families, upToDay, reduce, onDone }: { families: Family[]; upToDay?: number; reduce: boolean; onDone: () => void }) {
  const [seed] = useState(() => Math.floor(Math.random() * 10000));
  const deck = useMemo(() => {
    const pool = DECK.filter((d) => (upToDay ? d.day <= upToDay : true));
    return shuffled(pool.length ? pool : DECK, seed + (upToDay ?? 0));
  }, [upToDay, seed]);
  const [i, setI] = useState(0);
  const card = deck[i % deck.length];
  const st = useScanState(families);
  const { c, open, setOpen, scan } = st;
  const [guess, setGuess] = useState<string | null>(null);
  const [guessTouched, setGuessTouched] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState({ right: 0, seen: 0 });
  const fired = useRef(false);

  const keyFam = familyOf(card);
  const accepted = acceptedFor(card);
  const front = splitFront(card.front);

  // One survivor after the trigger step becomes the answer, unless the reader picked one by hand.
  useEffect(() => {
    if (revealed || guessTouched) return;
    setGuess(scan.done && scan.alive.length === 1 ? scan.alive[0].f.id : null);
  }, [scan.done, scan.alive, revealed, guessTouched]);

  useEffect(() => {
    if (!fired.current && score.seen >= GOAL) { fired.current = true; onDone(); }
  }, [score.seen, onDone]);

  const reveal = () => {
    if (revealed) return;
    setRevealed(true);
    setScore((s) => ({ right: s.right + (guess && accepted.includes(guess) ? 1 : 0), seen: s.seen + 1 }));
  };
  const next = () => {
    setI((x) => x + 1); st.reset(); setGuess(null); setGuessTouched(false); setRevealed(false);
  };

  const marks: Record<string, PillMark> = {};
  if (!revealed) {
    if (scan.done) scan.alive.forEach((a) => { marks[a.f.id] = "winner"; });
    if (guess) marks[guess] = "guess";
  } else {
    if (guess && !accepted.includes(guess)) marks[guess] = "wrong";
    accepted.forEach((id) => { if (FAM[id]) marks[id] = "key"; });
  }

  const keyScored = scan.scored.find((s) => s.f.id === keyFam);
  const correct = !!guess && accepted.includes(guess);
  const budget = c.budget && c.budget !== "skip" ? BUDGETS.find((b) => b.id === c.budget) : undefined;

  return (
    <div className="tg-main" onKeyDown={(e) => {
      if (e.key === "Enter" && !(e.target instanceof HTMLButtonElement)) { e.preventDefault(); if (revealed) next(); else if (guess) reveal(); return; }
      if (!revealed) st.onKey(e);
    }}>
      <div className="tg-a-prob">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={card.n} className="tg-problem card" initial={reduce ? { opacity: 0 } : { opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, x: -24 }} transition={reduce ? { duration: 0.15 } : springs.smooth}>
            <div className="tg-problem-eyebrow">
              <span>Card {card.n} · Day {card.day}</span>
              <span className="tg-score" aria-label={`${score.right} correct out of ${score.seen}`}>{score.seen > 0 ? `${score.right} of ${score.seen} correct` : `${deck.length} cards`}</span>
            </div>
            <p className="tg-problem-text">{pretty(front.text)}</p>
            {front.constraint && <span className="tg-constraint">{pretty(front.constraint)}</span>}
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="tg-a-scan">
        <Strip c={c} open={open} setOpen={setOpen} disabled={revealed} />
        {!revealed && <StepPanel step={open} c={c} onChoose={st.choose} triggers={scan.triggers} reduce={reduce} />}
        {!revealed && <SayIt c={c} winners={scan.done ? scan.alive.map((a) => a.f) : []} />}
      </div>
      <div className="tg-a-cands">
        <Candidates scored={scan.scored} counts={scan.counts} c={c} marks={marks} focus={revealed ? keyFam : null} reduce={reduce}
          onTap={(id) => { if (!revealed) { setGuess(id); setGuessTouched(true); } }}
          tapLabel={revealed ? "" : "Tap to make it your answer."} />
      </div>
      <div className="tg-a-act">
        <AnimatePresence initial={false}>
          {revealed && (
            <motion.div key={`r${card.n}`} className={`tg-reveal ${guess ? (correct ? "good" : "bad") : "plain"}`} role="status"
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={reduce ? { duration: 0.15 } : springs.smooth}>
              <div className="tg-reveal-head">
                {guess ? <><Icon name={correct ? "check" : "info"} size={18} />{correct ? "Correct" : "Not quite"}</> : <>The key</>}
              </div>
              <dl className="tg-key">
                <div><dt>Pattern</dt><dd>{pretty(card.pattern)}</dd></div>
                <div><dt>Target</dt><dd className="num">{pretty(card.target)}</dd></div>
                <div><dt>Signal</dt><dd>{pretty(card.signal)}</dd></div>
              </dl>
              <p className="tg-reveal-why">
                {guess && !correct && <>You picked {FAM[guess].name}. </>}
                {keyScored?.out
                  ? <>Your scan ruled out <b>{FAM[keyFam].name}</b> at step {keyScored.out.step} ({STEPS[keyScored.out.step - 1].title.toLowerCase()}): {keyScored.out.reason}</>
                  : guess && !correct
                    ? <><b>{FAM[keyFam].name}</b> was still in your list. The trigger phrase decides between the survivors.</>
                    : <>The family is <b>{FAM[keyFam].name}</b>.</>}
                {budget && <> Your budget was {COST[budget.rank]}; the key runs in {pretty(card.target)}.</>}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="tg-actions">
          {!revealed ? (
            <>
              <Button variant="primary" size="l" disabled={!guess} onClick={reveal}>Check</Button>
              <Button variant="plain" onClick={reveal}>Show the key</Button>
              <span className="tg-actions-hint">{guess ? <>Your answer: <b>{FAM[guess].name}</b></> : "Run the scan, then tap a candidate to answer."}</span>
            </>
          ) : (
            <Button variant="primary" size="l" onClick={next}>Next card<Icon name="arrow-right" size={18} /></Button>
          )}
        </div>
      </div>
    </div>
  );
}
