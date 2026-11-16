import { useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useReducedMotion } from "@/lib/hooks";
import { CodePanel, InputEditor, LabShell, Narration, Pic, PlayerBar, parseInt1, randInt, usePlayer, type Run } from "../bits/kit/player";
import { GCD_CODE } from "./code";
import { buildGcd, type GcdFrame } from "./engine";

/** One bar: a split into q copies of b plus the remainder r, drawn to scale against the first a. */
function Bar({ a, b, q, r, scale, fin }: { a: number; b: number; q: number; r: number; scale: number; fin?: boolean }) {
  const segs: { w: number; rem?: boolean; label: string }[] = [];
  const many = q > 12;
  if (many) segs.push({ w: q * b, label: `${q} × ${b}` });
  else for (let i = 0; i < q; i++) segs.push({ w: b, label: String(b) });
  if (r > 0) segs.push({ w: r, rem: true, label: String(r) });
  return (
    <div className="nt-bar" style={{ width: `${Math.max(2, (a / scale) * 100)}%` }} aria-hidden="true">
      {segs.map((s, i) => (
        <div key={i} className={`nt-seg${s.rem ? " rem" : ""}${fin ? " fin" : ""}`} style={{ flex: `${s.w} 0 0` }}>{s.w / scale > 0.06 ? s.label : ""}</div>
      ))}
    </div>
  );
}

export default function Gcd({ n0, tabs, onComplete }: { n0?: number; tabs?: ReactNode; onComplete?: () => void }) {
  const [pair, setPair] = useState<[number, number]>([n0 && n0 > 1 ? Math.min(n0, 99999) : 252, 105]);
  const [a0, b0] = pair;
  const frames = useMemo(() => buildGcd(a0, b0), [a0, b0]);
  const run: Run<GcdFrame> = useMemo(() => ({ frames }), [frames]);
  const p = usePlayer(run, onComplete);
  const f = p.frame;
  const reduce = useReducedMotion();
  const scale = Math.max(a0, b0, 1);

  const [at, setAt] = useState(String(a0)), [bt, setBt] = useState(String(b0));
  const [err, setErr] = useState<string | null>(null);
  const apply = () => {
    const av = parseInt1(at, 1, 99999, "a"); if (typeof av === "string") { setErr(av); return; }
    const bv = parseInt1(bt, 0, 99999, "b"); if (typeof bv === "string") { setErr(bv); return; }
    setErr(null); setPair([av, bv]);
  };
  const set = (av: number, bv: number) => { setPair([av, bv]); setAt(String(av)); setBt(String(bv)); setErr(null); };
  const stage = (
    <Pic label={`Euclid on ${a0} and ${b0}`}>
      <div className="nt-inner">
        <div className="nt-pair" aria-live="polite">
          <span className="l">(a, b) =</span>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span key={`${f.a}-${f.b}`} className="p" initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ type: "spring", stiffness: 300, damping: 28 }}>
              ({f.a}, {f.b})
            </motion.span>
          </AnimatePresence>
          {f.done && <span className="bk-var good">gcd = <b>{f.a}</b></span>}
        </div>
        <div className="nt-steps">
          {f.steps.length === 0 && (
            <div className="nt-step">
              <span className="eq">a = <b>{a0}</b>, b = <b>{b0}</b></span>
              <Bar a={a0} b={a0} q={1} r={0} scale={scale} />
              {b0 > 0 && <Bar a={b0} b={b0} q={1} r={0} scale={scale} />}
            </div>
          )}
          {f.steps.map((s, i) => {
            const last = i === f.steps.length - 1;
            return (
              <motion.div key={i} className={`nt-step${last && !f.done ? "" : " old"}`} initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: last && !f.done ? 1 : 0.55, y: 0 }}>
                <span className="eq"><b>{s.a}</b> = {s.q} × <b>{s.b}</b> + <em>{s.r}</em></span>
                <Bar a={s.a} b={s.b} q={s.q} r={s.r} scale={scale} />
              </motion.div>
            );
          })}
          {f.done && f.steps.length > 0 && (
            <motion.div className="nt-step" initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <span className="eq" style={{ fontFamily: "var(--font-body)" }}>{f.steps[f.steps.length - 1].b} divides {f.steps[f.steps.length - 1].a} exactly, so it divides {a0} and {b0} too.</span>
              <Bar a={a0} b={f.a} q={a0 / f.a} r={0} scale={scale} fin />
            </motion.div>
          )}
        </div>
        <span className="bt-hint" style={{ fontSize: 13, color: "var(--muted)" }}>The blue piece is a % b. It becomes the new b, so the pair shrinks fast: O(log min(a, b)) steps.</span>
      </div>
    </Pic>
  );
  return (
    <LabShell label="Euclid's algorithm" tabs={tabs} stage={stage} narration={<Narration p={p} />} bar={<PlayerBar p={p} />} onKeyDown={p.onKeyDown}
      code={<CodePanel title="gcd(a, b): Euclid" lines={GCD_CODE} active={f.line} note={<>In contests just call math.gcd. Divide before you multiply in lcm, so the number never grows past the answer.</>} />}
      below={<InputEditor fields={[{ id: "a", label: "a (1 to 99999)", value: at, onChange: setAt, numeric: true }, { id: "b", label: "b (0 to 99999)", value: bt, onChange: setBt, numeric: true }]} onApply={apply} error={err}
        onRandom={() => { const g = randInt(2, 12); set(g * randInt(5, 40), g * randInt(2, 20)); }}
        presets={[
          { label: "252, 105", run: () => set(252, 105) },
          { label: "48, 18", run: () => set(48, 18) },
          { label: "89, 55 (Fibonacci)", run: () => set(89, 55) },
          { label: "17, 5", run: () => set(17, 5) },
        ]} />}
    />
  );
}
