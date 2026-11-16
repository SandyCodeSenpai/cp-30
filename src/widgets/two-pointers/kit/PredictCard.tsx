import { useState } from "react";
import { motion } from "framer-motion";
import { Button, Icon, springs } from "@/ui";
import type { Predict } from "./types";

/** "Predict, then check": a 2-3 option question before a key step. First miss: try again. Second miss: reveal. */
export function PredictCard({ p, onDone, reduce }: { p: Predict; onDone: () => void; reduce: boolean }) {
  const [wrong, setWrong] = useState<number[]>([]);
  const [right, setRight] = useState(false);
  const revealed = right || wrong.length >= 2;
  const pick = (i: number) => {
    if (revealed || wrong.includes(i)) return;
    if (i === p.answer) setRight(true);
    else setWrong((w) => [...w, i]);
  };
  return (
    <motion.div className="kit-predict" role="group" aria-label="Predict the next step"
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={reduce ? { duration: 0.15 } : springs.smooth}>
      <div className="kit-predict-q"><span className="kit-predict-tag">Predict</span>{p.q}</div>
      <div className="kit-predict-opts">
        {p.options.map((o, i) => {
          const state = revealed && i === p.answer ? "good" : wrong.includes(i) ? "bad" : "";
          return (
            <motion.button key={o} type="button" className={`kit-opt ${state}`} onClick={() => pick(i)} disabled={revealed && i !== p.answer && !wrong.includes(i)}
              animate={wrong[wrong.length - 1] === i && !reduce ? { x: [0, -6, 5, -3, 0] } : { x: 0 }} transition={{ duration: 0.32 }}>
              <span className="kit-opt-key">{i + 1}</span>{o}
            </motion.button>
          );
        })}
      </div>
      {(revealed || wrong.length > 0) && (
        <div className={`kit-predict-fb ${right ? "good" : revealed ? "reveal" : "bad"}`} aria-live="polite">
          {right ? <><Icon name="check" size={18} /><b>Correct.</b> {p.why}</>
            : revealed ? <><b>Here is why.</b> {p.why}</>
            : <><b>Not quite.</b> Try again.</>}
        </div>
      )}
      {revealed && <div className="kit-predict-go"><Button variant="tinted" size="s" onClick={onDone} autoFocus>Continue<Icon name="chevron-right" size={16} /></Button></div>}
    </motion.div>
  );
}
