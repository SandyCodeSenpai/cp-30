import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button, Icon, springs } from "@/ui";
import { EXAMPLES, FAM, type Choices, type Family, type StepId } from "./data";
import { Candidates, SayIt, StepPanel, Strip, type PillMark } from "./Scan";
import { useScanState } from "./state";

const PLAY_ORDER: StepId[] = ["budget", "want", "shape", "trigger"];

export function ScanMode({ families, reduce, onDone }: { families: Family[]; reduce: boolean; onDone: () => void }) {
  const st = useScanState(families);
  const { c, setC, open, setOpen, scan } = st;
  const [focus, setFocus] = useState<string | null>(null);
  const [ex, setEx] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [touched, setTouched] = useState(false);
  const timers = useRef<number[]>([]);
  const fired = useRef(false);

  const examples = EXAMPLES.filter((e) => families.some((f) => f.id === e.family) && FAM[e.family]);
  const stop = () => { timers.current.forEach((t) => clearTimeout(t)); timers.current = []; setPlaying(false); };
  useEffect(() => () => timers.current.forEach((t) => clearTimeout(t)), []);

  useEffect(() => {
    if (!fired.current && scan.done && scan.alive.length > 0) { fired.current = true; onDone(); }
  }, [scan.done, scan.alive.length, onDone]);

  const play = () => {
    stop();
    const next = ex === null ? 0 : (ex + 1) % examples.length;
    const e = examples[next];
    setEx(next); setFocus(null); setC({}); setOpen("budget"); setTouched(true);
    if (reduce) { setC({ ...e.picks }); setOpen("trigger"); return; }
    setPlaying(true);
    let acc: Choices = {};
    PLAY_ORDER.forEach((s, i) => {
      timers.current.push(window.setTimeout(() => {
        acc = { ...acc, [s]: e.picks[s] };
        setC(acc);
        setOpen(PLAY_ORDER[Math.min(i + 1, 3)]);
        if (i === 3) setPlaying(false);
      }, 650 + i * 900));
    });
  };

  const choose = (s: StepId, v: string) => { stop(); setTouched(true); st.choose(s, v); };
  const startOver = () => { stop(); st.reset(); setEx(null); setFocus(null); };

  const winners = scan.done ? scan.alive.map((a) => a.f) : [];
  const marks: Record<string, PillMark> = {};
  winners.forEach((w) => { marks[w.id] = "winner"; });
  const example = ex !== null ? examples[ex] : null;

  return (
    <div className="tg-main" onKeyDown={(e) => { if (!playing) st.onKey(e); }}>
      <div className="tg-a-prob">
        <AnimatePresence mode="wait" initial={false}>
          {example ? (
            <motion.div key={`ex${ex}`} className="tg-problem" initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={reduce ? { duration: 0.12 } : springs.smooth}>
              <div className="tg-problem-eyebrow">Example {ex! + 1} of {examples.length}</div>
              <p className="tg-problem-text">{example.text}</p>
              <span className="tg-constraint">{example.constraint}</span>
            </motion.div>
          ) : (
            <motion.p key="intro" className="tg-intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              Think of a problem, or play an example. Answer the four steps in order and watch the list shrink.
            </motion.p>
          )}
        </AnimatePresence>
        <div className="tg-toolbar">
          {examples.length > 0 && (
            <Button size="s" variant="secondary" onClick={play} className={touched ? "" : "tg-pulse"}>
              <Icon name="play" size={14} />{ex === null ? "Play an example" : "Next example"}
            </Button>
          )}
          <Button size="s" variant="ghost" onClick={startOver} disabled={!c.budget && !c.want && !c.shape && !c.trigger}><Icon name="reset" size={16} />Start over</Button>
        </div>
      </div>
      <div className="tg-a-scan">
        <Strip c={c} open={open} setOpen={(s) => { stop(); setOpen(s); }} />
        <StepPanel step={open} c={c} onChoose={choose} triggers={scan.triggers} reduce={reduce} />
        <SayIt c={c} winners={winners} />
      </div>
      <div className="tg-a-cands">
        <Candidates scored={scan.scored} counts={scan.counts} c={c} marks={marks} focus={focus} reduce={reduce}
          onTap={(id) => setFocus((f) => (f === id ? null : id))} tapLabel="Tap to see its trigger phrases." />
      </div>
    </div>
  );
}
