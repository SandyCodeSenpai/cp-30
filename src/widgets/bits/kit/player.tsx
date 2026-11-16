/**
 * Step player kit shared by the bits and number-theory labs.
 * Every steppable part is a pure function that returns frames (state + code line + narration),
 * so Step back / Step / Play are only index moves.
 */
import { useCallback, useEffect, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from "react";
import { motion } from "framer-motion";
import { Button, Icon, IconButton, Segmented, Toggle, springs } from "@/ui";
import { useReducedMotion } from "@/lib/hooks";
import "./kit.css";

/** A 2-3 option question asked before moving from this frame to the next one (when Predict is on). */
export interface Ask { q: string; options: string[]; answer: number; why?: string }
export interface BaseFrame { line: number; say: string; ask?: Ask }
/** One precomputed run. A new object resets the player. */
export interface Run<F> { frames: F[]; start?: number }

export type Speed = 0.5 | 1 | 2;
const DELAY: Record<Speed, number> = { 0.5: 1700, 1: 1000, 2: 480 };

interface Asking { at: number; chosen: number | null; resume: boolean }

/** Display order of a question's options: a stable rotation, so the right answer is not always first. */
export function askOrder(ask: Ask): number[] {
  const n = ask.options.length;
  if (/^[01]$/.test(ask.options[0] ?? "") && n === 2) return [0, 1];
  let h = 0;
  for (const ch of ask.q) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const r = h % n;
  return Array.from({ length: n }, (_, i) => (i + r) % n);
}

export function usePlayer<F extends BaseFrame>(run: Run<F>, onComplete?: () => void) {
  const { frames } = run;
  const last = Math.max(0, frames.length - 1);
  const [idx, setIdx] = useState(run.start ?? 0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<Speed>(1);
  const [predict, setPredict] = useState(false);
  const [asking, setAsking] = useState<Asking | null>(null);
  const answered = useRef(new Set<number>());
  const completed = useRef(false);
  const cb = useRef(onComplete); cb.current = onComplete;
  // A new run resets the player during render, so no stale frame is ever drawn.
  const [seenRun, setSeenRun] = useState(run);
  let idxNow = idx;
  if (seenRun !== run) {
    idxNow = Math.min(run.start ?? 0, Math.max(0, run.frames.length - 1));
    setSeenRun(run); setIdx(idxNow);
    setPlaying(false); setAsking(null); answered.current = new Set();
  }

  const cur = Math.min(idxNow, last);

  const forward = useCallback((fromPlay: boolean): boolean => {
    if (asking || cur >= last) return false;
    const f = frames[cur];
    if (predict && f.ask && !answered.current.has(cur)) { setAsking({ at: cur, chosen: null, resume: fromPlay }); setPlaying(false); return false; }
    setIdx(cur + 1);
    if (cur + 1 >= last && !completed.current) { completed.current = true; cb.current?.(); }
    return true;
  }, [asking, cur, last, frames, predict]);

  const step = useCallback(() => { setPlaying(false); forward(false); }, [forward]);
  const back = useCallback(() => { setPlaying(false); setAsking(null); setIdx(Math.max(0, cur - 1)); }, [cur]);
  const reset = useCallback(() => { setPlaying(false); setAsking(null); setIdx(0); answered.current = new Set(); }, []);
  const toggle = useCallback(() => {
    if (asking) return;
    if (playing) { setPlaying(false); return; }
    if (cur >= last) { setIdx(0); answered.current = new Set(); }
    setPlaying(true);
  }, [asking, playing, cur, last]);
  const choose = useCallback((n: number) => {
    setAsking((a) => (a && a.chosen === null ? { ...a, chosen: n } : a));
    if (asking) answered.current.add(asking.at);
  }, [asking]);
  const proceed = useCallback(() => {
    if (!asking) return;
    setIdx(asking.at + 1); setAsking(null);
    if (asking.at + 1 >= last && !completed.current) { completed.current = true; cb.current?.(); }
    if (asking.resume) setPlaying(true);
  }, [asking, last]);

  useEffect(() => {
    if (!playing || asking) return;
    const t = setTimeout(() => { if (!forward(true)) setPlaying(false); }, DELAY[speed]);
    return () => clearTimeout(t);
  }, [playing, asking, cur, last, speed, forward]);
  useEffect(() => { if (playing && cur >= last) setPlaying(false); }, [playing, cur, last]);


  const onKeyDown = useCallback((e: KeyboardEvent<HTMLElement>) => {
    const t = e.target as HTMLElement;
    if (t.closest("input, textarea, select, [contenteditable='true']")) return;
    if (asking) {
      const ask = frames[asking.at]?.ask;
      const n = Number(e.key);
      if (ask && asking.chosen === null && n >= 1 && n <= ask.options.length) { e.preventDefault(); choose(askOrder(ask)[n - 1]); return; }
      if (asking.chosen !== null && (e.key === "Enter" || e.key === "ArrowRight")) { e.preventDefault(); proceed(); return; }
    }
    if (e.key === "ArrowRight") { e.preventDefault(); step(); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); back(); }
    else if (e.key === " " || e.key === "Spacebar") {
      if (t.closest("button, [role=radio], [role=switch]")) return;
      e.preventDefault(); toggle();
    }
  }, [asking, frames, choose, proceed, step, back, toggle]);

  /** Mark the task done (for modes whose task is not "run to the end"). */
  const complete = useCallback(() => { if (!completed.current) { completed.current = true; cb.current?.(); } }, []);

  return { frame: frames[cur], cur, last, total: frames.length, playing, speed, setSpeed, predict, setPredict, asking, step, back, reset, toggle, choose, proceed, onKeyDown, complete };
}
export type Player<F extends BaseFrame> = ReturnType<typeof usePlayer<F>>;

/* ---------------- Controls ---------------- */

export function PlayerBar<F extends BaseFrame>({ p, extra, noPredict }: { p: Player<F>; extra?: ReactNode; noPredict?: boolean }) {
  const atEnd = p.cur >= p.last;
  return (
    <div className="bk-bar">
      <div className="bk-btns">
        <Button size="m" onClick={p.back} disabled={p.cur === 0 && !p.asking} aria-label="Step back (Left arrow)"><Icon name="chevron-left" size={18} />Back</Button>
        <Button size="m" variant="primary" onClick={p.toggle} disabled={!!p.asking} aria-label={p.playing ? "Pause (Space)" : "Play (Space)"} className="bk-play">
          <Icon name={p.playing ? "pause" : "play"} size={16} />{p.playing ? "Pause" : atEnd ? "Replay" : "Play"}
        </Button>
        <Button size="m" onClick={p.step} disabled={atEnd || !!p.asking} aria-label="Step (Right arrow)">Step<Icon name="chevron-right" size={18} /></Button>
        <IconButton label="Reset" onClick={p.reset}><Icon name="reset" size={20} /></IconButton>
      </div>
      <div className="bk-opts">
        <Segmented<Speed> label="Speed" value={p.speed} onChange={p.setSpeed} options={[{ value: 0.5, label: "0.5x" }, { value: 1, label: "1x" }, { value: 2, label: "2x" }]} />
        {!noPredict && <Toggle label="Predict" checked={p.predict} onChange={p.setPredict} />}
        {extra}
      </div>
    </div>
  );
}

/** Render `code` spans inside a narration string. */
export function Rich({ text }: { text: string }) {
  const parts = text.split("`");
  return <>{parts.map((s, i) => (i % 2 ? <code key={i}>{s}</code> : <span key={i}>{s}</span>))}</>;
}

/* ---------------- Narration + predict ---------------- */

export function Narration<F extends BaseFrame>({ p, override }: { p: Player<F>; override?: string | null }) {
  const ask = p.asking ? p.frame?.ask : undefined;
  return (
    <div className="bk-say" aria-live="polite">
      <div className="bk-say-top">
        <span className="bk-count">Step {p.cur + 1} of {p.total}</span>
        <div className="bk-track" aria-hidden="true"><span style={{ width: `${p.last ? (p.cur / p.last) * 100 : 100}%` }} /></div>
      </div>
      {ask && p.asking ? <PredictCard ask={ask} chosen={p.asking.chosen} onChoose={p.choose} onContinue={p.proceed} /> : <p className="bk-say-text"><Rich text={override ?? p.frame?.say ?? ""} /></p>}
    </div>
  );
}

function PredictCard({ ask, chosen, onChoose, onContinue }: { ask: Ask; chosen: number | null; onChoose: (n: number) => void; onContinue: () => void }) {
  const right = chosen !== null && chosen === ask.answer;
  return (
    <div className="bk-ask">
      <div className="bk-ask-label">Predict</div>
      <p className="bk-ask-q"><Rich text={ask.q} /></p>
      <div className="bk-ask-opts" role="group" aria-label="Your prediction">
        {askOrder(ask).map((i, pos) => {
          const o = ask.options[i];
          const state = chosen === null ? "" : i === ask.answer ? " right" : i === chosen ? " wrong" : " dim";
          return (
            <button key={i} type="button" className={`bk-opt${state}`} disabled={chosen !== null} onClick={() => onChoose(i)}>
              <span className="bk-opt-key">{pos + 1}</span><span><Rich text={o} /></span>
            </button>
          );
        })}
      </div>
      {chosen !== null && (
        <div className={`bk-ask-fb ${right ? "good" : "bad"}`}>
          <span className="bk-ask-verdict"><Icon name={right ? "check" : "x"} size={16} />{right ? "Correct" : "Not quite"}</span>
          {ask.why && <span className="bk-ask-why"><Rich text={ask.why} /></span>}
          <Button size="m" variant={right ? "good" : "secondary"} onClick={onContinue} autoFocus>Continue<Icon name="chevron-right" size={18} /></Button>
        </div>
      )}
    </div>
  );
}

/* ---------------- Code panel ---------------- */

const KWS = "def|class|return|while|for|in|if|else|elif|and|or|not|import|from|lambda|break|continue|True|False|None|is";
const KW = new RegExp(`^(${KWS})$`);
const SPLIT = new RegExp(`(\\b(?:${KWS})\\b|\\b\\d+\\b)`);
function tokens(src: string): ReactNode[] {
  const hash = src.indexOf("#");
  const code = hash >= 0 ? src.slice(0, hash) : src;
  const out: ReactNode[] = [];
  code.split(SPLIT).forEach((part, i) => {
    if (!part) return;
    if (KW.test(part)) out.push(<span key={i} className="tk-kw">{part}</span>);
    else if (/^\d+$/.test(part)) out.push(<span key={i} className="tk-num">{part}</span>);
    else out.push(part);
  });
  if (hash >= 0) out.push(<span key="c" className="tk-com">{src.slice(hash)}</span>);
  return out;
}

const LH = 22;
export function CodePanel({ title, lines, active, note }: { title: string; lines: string[]; active: number; note?: ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <figure className="bk-code" aria-label={`Python code: ${title}.${active >= 0 ? ` Line ${active + 1} is running.` : ""}`}>
      <figcaption><span className="bk-code-dot" aria-hidden="true" />{title}</figcaption>
      <div className="bk-code-scroll">
        <pre className="bk-pre" style={{ height: lines.length * LH }}>
          {active >= 0 && <motion.div className="bk-hl" aria-hidden="true" initial={false} animate={{ y: active * LH }} transition={reduce ? { duration: 0 } : springs.snappy} />}
          {lines.map((ln, i) => (
            <div key={i} className={`bk-ln${i === active ? " on" : ""}`} aria-current={i === active ? "step" : undefined}>
              <span className="bk-no" aria-hidden="true">{i + 1}</span><code>{tokens(ln)}</code>
            </div>
          ))}
        </pre>
      </div>
      {note && <div className="bk-code-note">{note}</div>}
    </figure>
  );
}

/* ---------------- Input editor ---------------- */

export interface Field { id: string; label: string; value: string; onChange: (v: string) => void; placeholder?: string; wide?: boolean; numeric?: boolean }
export function InputEditor({ fields, onApply, error, presets, onRandom, note, defaultOpen = false }: {
  fields: Field[]; onApply: () => void; error?: string | null; presets?: { label: string; run: () => void }[]; onRandom?: () => void; note?: ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const submit = (e: FormEvent) => { e.preventDefault(); onApply(); };
  return (
    <div className={`bk-edit${open ? " open" : ""}`}>
      <div className="bk-edit-head">
        <Button size="s" variant="ghost" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          <Icon name="chevron-down" size={16} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform var(--dur) var(--ease)" }} />Edit input
        </Button>
        {onRandom && <Button size="s" variant="ghost" onClick={onRandom}><Icon name="repeat" size={16} />Random</Button>}
      </div>
      {open && (
        <form className="bk-edit-body" onSubmit={submit}>
          <div className="bk-fields">
            {fields.map((f) => (
              <label key={f.id} className={`bk-field${f.wide ? " wide" : ""}`}>
                <span>{f.label}</span>
                <input value={f.value} placeholder={f.placeholder} inputMode={f.numeric ? "numeric" : "text"} spellCheck={false} autoComplete="off"
                  aria-invalid={!!error} onChange={(e) => f.onChange(e.target.value)} />
              </label>
            ))}
            <Button size="m" variant="tinted" type="submit" className="bk-apply">Apply</Button>
          </div>
          {error && <div className="bk-err" role="alert"><Icon name="info" size={16} />{error}</div>}
          {note && !error && <div className="bk-note">{note}</div>}
          {presets && presets.length > 0 && (
            <div className="bk-presets"><span>Presets</span>{presets.map((p) => <Button key={p.label} size="s" onClick={p.run}>{p.label}</Button>)}</div>
          )}
        </form>
      )}
    </div>
  );
}

/* ---------------- Layout ---------------- */

/** Lab shell: optional mode tabs, then picture + narration + controls, and the code beside (wide) or below (narrow). */
export function LabShell({ tabs, sub, stage, narration, bar, code, below, onKeyDown, label }: {
  tabs?: ReactNode; sub?: ReactNode; stage: ReactNode; narration?: ReactNode; bar?: ReactNode; code: ReactNode; below?: ReactNode; onKeyDown?: (e: KeyboardEvent<HTMLElement>) => void; label: string;
}) {
  return (
    <section className="bk-lab" onKeyDown={onKeyDown} tabIndex={-1} aria-label={label}>
      {tabs && <div className="bk-tabs">{tabs}</div>}
      {sub && <div className="bk-sub">{sub}</div>}
      <div className="bk-grid">
        <div className="bk-left">{stage}{narration}{bar}</div>
        <div className="bk-right">{code}</div>
      </div>
      {below}
    </section>
  );
}

/** A stage card (dotted canvas) used for every picture. */
export function Pic({ children, label, className = "" }: { children: ReactNode; label: string; className?: string }) {
  return <div className={`bk-pic ${className}`} role="group" aria-label={label}>{children}</div>;
}

/* ---------------- Small helpers ---------------- */

/** Parse "1, 2, 3" into numbers. Returns an error string on bad input. */
export function parseNums(s: string, o: { min: number; max: number; minLen: number; maxLen: number; name?: string }): number[] | string {
  const parts = s.split(/[\s,]+/).filter(Boolean);
  const name = o.name ?? "values";
  if (parts.length < o.minLen || parts.length > o.maxLen) return `Enter ${o.minLen} to ${o.maxLen} ${name}, separated by commas.`;
  const out: number[] = [];
  for (const p of parts) {
    if (!/^-?\d+$/.test(p)) return `"${p}" is not a whole number.`;
    const v = Number(p);
    if (v < o.min || v > o.max) return `Keep each value between ${o.min} and ${o.max}.`;
    out.push(v);
  }
  return out;
}
export function parseInt1(s: string, min: number, max: number, name: string): number | string {
  const t = s.trim().replace(/_/g, "");
  if (!/^-?\d+$/.test(t)) return `${name} must be a whole number.`;
  const v = Number(t);
  if (v < min || v > max) return `${name} must be between ${min} and ${max}.`;
  return v;
}
export function parseBig(s: string, min: bigint, max: bigint, name: string): bigint | string {
  const t = s.trim().replace(/[_\s]/g, "");
  if (!/^\d+$/.test(t)) return `${name} must be a whole number of 0 or more.`;
  const v = BigInt(t);
  if (v < min || v > max) return `${name} must be between ${min} and ${max}.`;
  return v;
}
export const randInt = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1));
export const numProp = (v: unknown): number | undefined => (typeof v === "number" && Number.isFinite(v) ? Math.trunc(v) : undefined);
/** "1000000007" -> "1,000,000,007" for any bigint or number. */
export const group = (v: bigint | number) => String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
