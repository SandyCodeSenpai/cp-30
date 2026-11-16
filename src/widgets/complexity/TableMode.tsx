import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button, Chip, Icon, Segmented, Slider, Stage, Stat, StatGrid, WidgetFrame, springs } from "@/ui";
import { OpsChart } from "./OpsChart";
import { BookTable } from "./BookTable";
import { BOOK, CX, aboutTime, CPY, PYPY, N_STOPS, bookRowFor, fits, fmtN, fmtOps, fmtTime, log10Ops, nearestStop, secondsLog, type Cx } from "./model";

function Verdicts({ L, speed }: { L: number; speed: number }) {
  return (
    <span className="cx-verdicts">
      {[1, 2].map((lim) => {
        const ok = fits(L, speed, lim);
        return <Chip key={lim} tone={ok ? "good" : "bad"}>{lim} s: {ok ? "Pass" : "TLE"}</Chip>;
      })}
    </span>
  );
}

export function TableMode({ n0, reduce, compact, onDone }: { n0?: number; reduce: boolean; compact: boolean; onDone: () => void }) {
  const [showBook, setShowBook] = useState(!compact);
  const [idx, setIdx] = useState(() => nearestStop(n0 ?? 5000));
  const [cx, setCx] = useState<Cx>(() => (n0 ? BOOK[bookRowFor(N_STOPS[nearestStop(n0)])].cx : "n2"));
  const [limit, setLimit] = useState<1 | 2>(1);
  const [touched, setTouched] = useState({ n: false, cx: false });
  const done = useRef(false);
  const n = N_STOPS[idx];

  useEffect(() => {
    if (!done.current && touched.n && touched.cx) { done.current = true; onDone(); }
  }, [touched, onDone]);

  const L = log10Ops(cx, n);
  const cpy = secondsLog(L, CPY), pypy = secondsLog(L, PYPY);
  const row = bookRowFor(n);
  const cpyOk = fits(L, CPY, limit), pypyOk = fits(L, PYPY, limit);
  const close = pypyOk && 10 ** pypy > limit * 0.5;

  const sentence = (
    <>
      <b>{CX[cx].label}</b> at n = {fmtN(n)} is <b>{fmtOps(L)}</b> operations. CPython needs {aboutTime(cpy)}
      {cpyOk ? ", which passes" : ", a TLE"} at {limit} s. PyPy needs {aboutTime(pypy)}
      {pypyOk ? (close ? ": it passes, but it is close, so keep the inner loop tiny." : ", which passes.") : ", a TLE too."}
    </>
  );

  return (
    <WidgetFrame
      stage={
        <Stage className="cx-stage">
          <OpsChart n={n} limit={limit} selected={cx} onSelect={(c) => { setCx(c); setTouched((t) => ({ ...t, cx: true })); }}
            bars chips reduce={reduce} label={`Operation counts at n = ${fmtN(n)}. Pick a complexity.`} />
        </Stage>
      }
      controls={
        <>
          <div className="cx-ctl-row">
            <div className={touched.n ? "" : "cx-pulse"}>
              <Slider label="Largest n" value={idx} min={0} max={N_STOPS.length - 1}
                onChange={(v) => { setIdx(v); setTouched((t) => ({ ...t, n: true })); }} format={(v) => `n = ${fmtN(N_STOPS[v])}`} />
            </div>
            <Segmented label="Time limit" value={limit} options={[{ value: 1, label: "1 second" }, { value: 2, label: "2 seconds" }]} onChange={(v) => setLimit(v)} />
          </div>
          <StatGrid>
            <Stat label="Operations" value={fmtOps(L)} sub={CX[cx].label} />
            <Stat label="CPython (LeetCode)" value={fmtTime(cpy)} tone={cpyOk ? "good" : "bad"} sub={<Verdicts L={L} speed={CPY} />} />
            <Stat label="PyPy (Codeforces)" value={fmtTime(pypy)} tone={pypyOk ? "good" : "bad"} sub={<Verdicts L={L} speed={PYPY} />} />
          </StatGrid>
          <p className="cx-speed">CPython does about 10⁷ simple operations per second, PyPy about 10⁸.</p>
        </>
      }
      footer={
        <div className="cx-foot">
          <p className="cx-say" aria-live="polite">{sentence}</p>
          {compact && (
            <Button variant="plain" size="s" className="cx-book-toggle" aria-expanded={showBook} onClick={() => setShowBook((v) => !v)}>
              <Icon name="chevron-down" size={16} style={{ transform: showBook ? "rotate(180deg)" : undefined, transition: "transform var(--dur) var(--ease)" }} />
              {showBook ? "Hide the constraint table" : "Show the constraint table"}
            </Button>
          )}
          <AnimatePresence initial={false}>
            {showBook && (
              <motion.div key="book" initial={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
                transition={reduce ? { duration: 0.15 } : springs.smooth} style={{ overflow: "hidden" }}>
                <BookTable active={row} target={BOOK[row].cx === cx} onPick={(i) => {
                  setIdx(N_STOPS.indexOf(BOOK[i].max)); setCx(BOOK[i].cx); setTouched({ n: true, cx: true });
                }} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      }
    />
  );
}
