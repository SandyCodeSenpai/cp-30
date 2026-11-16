/**
 * Step-by-step player kit shared by the dp-table and lis labs.
 * Each mode builds an array of frames with a pure function (state + code line + narration),
 * so Step back / Step / Play are only index moves.
 */
import { Fragment, useCallback, useEffect, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from "react";
import { motion } from "framer-motion";
import { Button, Icon, IconButton, Segmented, Toggle, springs } from "@/ui";
import { useReducedMotion } from "@/lib/hooks";
import "./kit.css";

/** A 2-3 option question asked before moving from this frame to the next one (when Predict is on). */
export interface Ask { q: string; options: string[]; answer: number; why?: string }
export interface BaseFrame { line: number; line2?: number; say: string; ask?: Ask }

export type Speed = 0.5 | 1 | 2;
const DELAY: Record<Speed, number> = { 0.5: 1700, 1: 1000, 2: 480 };

interface Asking { at: number; chosen: number | null; resume: boolean }

/** `frames` must be a new array whenever the input changes; a new array resets the player. */
export function usePlayer<F extends BaseFrame>(frames: F[], onComplete?: () => void) {
  const last = Math.max(0, frames.length - 1);
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<Speed>(1);
  const [predict, setPredict] = useState(false);
  const [asking, setAsking] = useState<Asking | null>(null);
  const answered = useRef(new Set<number>());
  const completed = useRef(false);
  const cb = useRef(onComplete); cb.current = onComplete;

  useEffect(() => { setIdx(0); setPlaying(false); setAsking(null); answered.current = new Set(); }, [frames]);

  const cur = Math.min(idx, last);

  const forward = useCallback((fromPlay: boolean): boolean => {
    if (asking || cur >= last) return false;
    const f = frames[cur];
    if (predict && f.ask && !answered.current.has(cur)) { setAsking({ at: cur, chosen: null, resume: fromPlay }); setPlaying(false); return false; }
    setIdx(cur + 1); return true;
  }, [asking, cur, last, frames, predict]);

  const step = useCallback(() => { setPlaying(false); forward(false); }, [forward]);
  const back = useCallback(() => { setPlaying(false); setAsking(null); setIdx(Math.max(0, cur - 1)); }, [cur]);
  const reset = useCallback(() => { setPlaying(false); setAsking(null); setIdx(0); }, []);
  const jumpEnd = useCallback(() => { setPlaying(false); setAsking(null); setIdx(last); }, [last]);
  const toggle = useCallback(() => {
    if (asking) return;
    if (playing) { setPlaying(false); return; }
    if (cur >= last) setIdx(0);
    setPlaying(true);
  }, [asking, playing, cur, last]);
  const choose = useCallback((n: number) => {
    setAsking((a) => (a && a.chosen === null ? { ...a, chosen: n } : a));
    if (asking) answered.current.add(asking.at);
  }, [asking]);
  const proceed = useCallback(() => {
    if (!asking) return;
    setIdx(asking.at + 1); setAsking(null);
    if (asking.resume) setPlaying(true);
  }, [asking]);

  useEffect(() => {
    if (!playing || asking) return;
    const t = setTimeout(() => { if (!forward(true)) setPlaying(false); }, DELAY[speed]);
    return () => clearTimeout(t);
  }, [playing, asking, cur, last, speed, forward]);
  useEffect(() => { if (playing && cur >= last) setPlaying(false); }, [playing, cur, last]);

  useEffect(() => {
    if (frames.length > 1 && cur === last && !completed.current) { completed.current = true; cb.current?.(); }
  }, [cur, last, frames.length]);

  const onKeyDown = useCallback((e: KeyboardEvent<HTMLElement>) => {
    const t = e.target as HTMLElement;
    if (t.closest("input, textarea, select, [contenteditable='true']")) return;
    if (asking) {
      const ask = frames[asking.at]?.ask;
      const n = Number(e.key);
      if (ask && asking.chosen === null && n >= 1 && n <= ask.options.length) { e.preventDefault(); choose(n - 1); return; }
      if (asking.chosen !== null && (e.key === "Enter" || e.key === "ArrowRight")) { e.preventDefault(); proceed(); return; }
    }
    if (e.key === "ArrowRight") { e.preventDefault(); step(); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); back(); }
    else if (e.key === " " || e.key === "Spacebar") {
      if (t.closest("button, [role='radio'], [role='switch'], a")) return; // let the focused control handle Space
      e.preventDefault(); toggle();
    }
  }, [asking, frames, choose, proceed, step, back, toggle]);

  return { frame: frames[cur], cur, last, total: frames.length, playing, speed, setSpeed, predict, setPredict, asking, step, back, reset, jumpEnd, toggle, choose, proceed, onKeyDown };
}
export type Player<F extends BaseFrame> = ReturnType<typeof usePlayer<F>>;

/* ---------------- Inline text: `code` spans ---------------- */

export function Rich({ text }: { text: string }) {
  const parts = text.split("`");
  return <>{parts.map((p, i) => (i % 2 ? <code key={i}>{p}</code> : <Fragment key={i}>{p}</Fragment>))}</>;
}

/* ---------------- Controls ---------------- */

export function PlayerBar<F extends BaseFrame>({ p, extra }: { p: Player<F>; extra?: ReactNode }) {
  const atEnd = p.cur >= p.last;
  return (
    <div className="dk-bar">
      <div className="dk-btns">
        <Button size="m" onClick={p.back} disabled={p.cur === 0 && !p.asking} aria-label="Step back (Left arrow)"><Icon name="chevron-left" size={18} />Back</Button>
        <Button size="m" variant="primary" onClick={p.toggle} disabled={!!p.asking} aria-label={p.playing ? "Pause (Space)" : "Play (Space)"} className="dk-play">
          <Icon name={p.playing ? "pause" : "play"} size={16} />{p.playing ? "Pause" : atEnd ? "Replay" : "Play"}
        </Button>
        <Button size="m" onClick={p.step} disabled={atEnd || !!p.asking} aria-label="Step (Right arrow)">Step<Icon name="chevron-right" size={18} /></Button>
        <IconButton label="Reset" onClick={p.reset}><Icon name="reset" size={20} /></IconButton>
      </div>
      <div className="dk-opts">
        <Segmented<Speed> label="Speed" value={p.speed} onChange={p.setSpeed} options={[{ value: 0.5, label: "0.5x" }, { value: 1, label: "1x" }, { value: 2, label: "2x" }]} />
        <Toggle label="Predict" checked={p.predict} onChange={p.setPredict} />
        {extra}
      </div>
    </div>
  );
}

/* ---------------- Narration + predict ---------------- */

export function Narration<F extends BaseFrame>({ p }: { p: Player<F> }) {
  const ask = p.asking ? p.frame?.ask : undefined;
  return (
    <div className="dk-say" aria-live="polite">
      <div className="dk-say-top">
        <span className="dk-count">Step {p.cur + 1} of {p.total}</span>
        <div className="dk-track" aria-hidden="true"><span style={{ width: `${p.last ? (p.cur / p.last) * 100 : 100}%` }} /></div>
        {p.cur < p.last && <button type="button" className="dk-skip" onClick={p.jumpEnd}>Skip to end</button>}
      </div>
      {ask && p.asking ? <PredictCard ask={ask} chosen={p.asking.chosen} onChoose={p.choose} onContinue={p.proceed} /> : <p className="dk-say-text"><Rich text={p.frame?.say ?? ""} /></p>}
    </div>
  );
}

function PredictCard({ ask, chosen, onChoose, onContinue }: { ask: Ask; chosen: number | null; onChoose: (n: number) => void; onContinue: () => void }) {
  const right = chosen !== null && chosen === ask.answer;
  return (
    <div className="dk-ask">
      <div className="dk-ask-label">Predict</div>
      <p className="dk-ask-q"><Rich text={ask.q} /></p>
      <div className="dk-ask-opts" role="group" aria-label="Your prediction">
        {ask.options.map((o, i) => {
          const state = chosen === null ? "" : i === ask.answer ? " right" : i === chosen ? " wrong" : " dim";
          return (
            <button key={i} type="button" className={`dk-opt${state}`} disabled={chosen !== null} onClick={() => onChoose(i)}>
              <span className="dk-opt-key">{i + 1}</span><span><Rich text={o} /></span>
            </button>
          );
        })}
      </div>
      {chosen !== null && (
        <div className={`dk-ask-fb ${right ? "good" : "bad"}`}>
          <span className="dk-ask-verdict"><Icon name={right ? "check" : "x"} size={16} />{right ? "Correct" : "Not quite"}</span>
          {ask.why && <span className="dk-ask-why"><Rich text={ask.why} /></span>}
          <Button size="m" variant={right ? "good" : "secondary"} onClick={onContinue} autoFocus>Continue<Icon name="chevron-right" size={18} /></Button>
        </div>
      )}
    </div>
  );
}

/** Numeric predict question: "What is dp[3]?" with the right value and two plausible wrong ones, sorted. */
export function numAsk(q: string, right: number | string, wrongs: (number | string)[], why?: string): Ask {
  const opts: (number | string)[] = [right];
  for (const w of wrongs) if (opts.length < 3 && !opts.some((o) => String(o) === String(w))) opts.push(w);
  let k = 1;
  while (opts.length < 3 && typeof right === "number") { const c = right + k; if (!opts.includes(c) && c >= 0) opts.push(c); k = k > 0 ? -k : -k + 1; if (Math.abs(k) > 6) break; }
  const sorted = [...opts].sort((a, b) => (typeof a === "number" && typeof b === "number" ? a - b : String(a).localeCompare(String(b))));
  return { q, options: sorted.map(String), answer: sorted.findIndex((o) => String(o) === String(right)), why };
}

/* ---------------- Code panel ---------------- */

const KW_RE = /(\b(?:def|class|return|while|for|in|if|else|elif|and|or|not|import|from|lambda|break|True|False|None)\b|\b\d+\b)/;
function tokens(src: string): ReactNode[] {
  const hash = src.indexOf("#");
  const code = hash >= 0 ? src.slice(0, hash) : src;
  const out: ReactNode[] = [];
  code.split(KW_RE).forEach((part, i) => {
    if (!part) return;
    if (/^[a-zA-Z]+$/.test(part) && KW_RE.test(part)) out.push(<span key={i} className="dk-kw">{part}</span>);
    else if (/^\d+$/.test(part)) out.push(<span key={i} className="dk-num">{part}</span>);
    else out.push(part);
  });
  if (hash >= 0) out.push(<span key="c" className="dk-com">{src.slice(hash)}</span>);
  return out;
}

const LH = 22;
export function CodePanel({ title, lines, active, active2, note }: { title: string; lines: string[]; active: number; active2?: number; note?: string }) {
  const reduce = useReducedMotion();
  return (
    <figure className="dk-code" aria-label={`Python code: ${title}.${active >= 0 ? ` Line ${active + 1} is running.` : ""}`}>
      <figcaption><span className="dk-code-dot" aria-hidden="true" />{title}</figcaption>
      <div className="dk-code-scroll">
        <pre className="dk-pre" style={{ height: lines.length * LH }}>
          {active2 !== undefined && active2 >= 0 && <div className="dk-hl2" style={{ transform: `translateY(${active2 * LH}px)` }} aria-hidden="true" />}
          {active >= 0 && <motion.div className="dk-hl" aria-hidden="true" initial={false} animate={{ y: active * LH }} transition={reduce ? { duration: 0 } : springs.snappy} />}
          {lines.map((ln, i) => (
            <div key={i} className={`dk-ln${i === active ? " on" : ""}`} aria-current={i === active ? "step" : undefined}>
              <span className="dk-no" aria-hidden="true">{i + 1}</span><code>{tokens(ln)}</code>
            </div>
          ))}
        </pre>
      </div>
      {note && <div className="dk-code-note"><Rich text={note} /></div>}
    </figure>
  );
}

/* ---------------- Input editor ---------------- */

export interface Field { id: string; label: string; value: string; onChange: (v: string) => void; placeholder?: string; wide?: boolean; numeric?: boolean }
export function InputEditor({ fields, onApply, error, presets, onRandom, note, children }: {
  fields: Field[]; onApply: () => void; error?: string | null; presets?: { label: string; run: () => void }[]; onRandom?: () => void; note?: ReactNode; children?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const submit = (e: FormEvent) => { e.preventDefault(); onApply(); };
  return (
    <div className={`dk-edit${open ? " open" : ""}`}>
      <div className="dk-edit-head">
        <Button size="s" variant="ghost" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          <Icon name="chevron-down" size={16} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform var(--dur) var(--ease)" }} />Edit input
        </Button>
        {onRandom && <Button size="s" variant="ghost" onClick={onRandom}><Icon name="repeat" size={16} />Random</Button>}
        {children}
      </div>
      {open && (
        <form className="dk-edit-body" onSubmit={submit}>
          <div className="dk-fields">
            {fields.map((f) => (
              <label key={f.id} className={`dk-field${f.wide ? " wide" : ""}`}>
                <span>{f.label}</span>
                <input value={f.value} placeholder={f.placeholder} inputMode={f.numeric ? "numeric" : "text"} spellCheck={false} autoComplete="off"
                  aria-invalid={!!error} onChange={(e) => f.onChange(e.target.value)} />
              </label>
            ))}
            <Button size="m" variant="tinted" type="submit" className="dk-apply">Apply</Button>
          </div>
          {error && <div className="dk-err" role="alert"><Icon name="info" size={16} />{error}</div>}
          {note && !error && <div className="dk-note">{note}</div>}
          {presets && presets.length > 0 && (
            <div className="dk-presets"><span>Presets</span>{presets.map((p) => <Button key={p.label} size="s" onClick={p.run}>{p.label}</Button>)}</div>
          )}
        </form>
      )}
    </div>
  );
}

/* ---------------- Mode tabs ---------------- */

export function ModeTabs<T extends string>({ value, options, onChange, label }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div className="dk-tabs" role="tablist" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" role="tab" aria-selected={o.value === value} className={o.value === value ? "on" : ""} onClick={() => onChange(o.value)}>{o.label}</button>
      ))}
    </div>
  );
}

/* ---------------- Parsing helpers ---------------- */

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
  const t = s.trim();
  if (!/^-?\d+$/.test(t)) return `${name} must be a whole number.`;
  const v = Number(t);
  if (v < min || v > max) return `${name} must be between ${min} and ${max}.`;
  return v;
}
export const randInt = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1));

/* ---------------- Lab shell ---------------- */

/** Optional mode tabs, then picture + narration + controls, with the code beside (wide) or below (narrow). */
export function LabShell({ tabs, stage, narration, bar, code, below, onKeyDown, label }: {
  tabs?: ReactNode; stage: ReactNode; narration: ReactNode; bar: ReactNode; code: ReactNode; below?: ReactNode; onKeyDown: (e: KeyboardEvent<HTMLElement>) => void; label: string;
}) {
  return (
    <section className="dk-lab" onKeyDown={onKeyDown} tabIndex={-1} aria-label={label}>
      {tabs && <div className="dk-tabrow">{tabs}</div>}
      <div className="dk-grid">
        <div className="dk-left">{stage}{narration}{bar}{below}</div>
        <div className="dk-right">{code}</div>
      </div>
    </section>
  );
}
