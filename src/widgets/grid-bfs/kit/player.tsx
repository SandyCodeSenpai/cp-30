/**
 * Step player shared by the grid-bfs and dijkstra labs.
 * Each mode precomputes an array of frames with a pure function (state + code line + narration),
 * so Step back, Step, Play and the scrubber only move an index.
 */
import { useCallback, useEffect, useRef, useState, type CSSProperties, type FormEvent, type KeyboardEvent, type ReactNode } from "react";
import { Button, Icon, IconButton, Segmented, Toggle } from "@/ui";
import "./kit.css";

/** A 2-3 option question asked before moving from this frame to the next one (when Predict is on). */
export interface Ask { q: string; options: string[]; answer: number; why?: string }
export interface BaseFrame { line: number; line2?: number; say: string; ask?: Ask }

export type Speed = 0.5 | 1 | 2 | 4;
const DELAY: Record<Speed, number> = { 0.5: 1700, 1: 950, 2: 480, 4: 200 };

interface Asking { at: number; chosen: number | null; resume: boolean }

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

  // A new frames array (new input or new mode) resets the run.
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
  const seek = useCallback((i: number) => { setPlaying(false); setAsking(null); setIdx(Math.max(0, Math.min(last, i))); }, [last]);
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
  }, [playing, asking, cur, speed, forward]);
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
    else if (e.key === " " || e.key === "Spacebar") { e.preventDefault(); toggle(); }
  }, [asking, frames, choose, proceed, step, back, toggle]);

  return { frame: frames[cur], cur, last, total: frames.length, playing, speed, setSpeed, predict, setPredict, asking, step, back, reset, seek, toggle, choose, proceed, onKeyDown };
}
export type Player<F extends BaseFrame> = ReturnType<typeof usePlayer<F>>;

/* ---------------- Controls ---------------- */

export function PlayerBar<F extends BaseFrame>({ p, narrow }: { p: Player<F>; narrow?: boolean }) {
  const atEnd = p.cur >= p.last;
  return (
    <div className="gx-bar">
      <div className="gx-btns">
        <Button size="m" onClick={p.back} disabled={p.cur === 0 && !p.asking} aria-label="Step back (Left arrow)"><Icon name="chevron-left" size={18} />{narrow ? null : "Back"}</Button>
        <Button size="m" variant="primary" onClick={p.toggle} disabled={!!p.asking} aria-label={p.playing ? "Pause (Space)" : "Play (Space)"} className="gx-play">
          <Icon name={p.playing ? "pause" : "play"} size={16} />{p.playing ? "Pause" : atEnd ? "Replay" : "Play"}
        </Button>
        <Button size="m" onClick={p.step} disabled={atEnd || !!p.asking} aria-label="Step (Right arrow)">Step<Icon name="chevron-right" size={18} /></Button>
        <IconButton label="Reset" onClick={p.reset}><Icon name="reset" size={20} /></IconButton>
      </div>
      <div className="gx-opts">
        <Segmented<Speed> label="Speed" value={p.speed} onChange={p.setSpeed} options={[{ value: 0.5, label: "0.5x" }, { value: 1, label: "1x" }, { value: 2, label: "2x" }, { value: 4, label: "4x" }]} />
        <Toggle label="Predict" checked={p.predict} onChange={p.setPredict} />
      </div>
    </div>
  );
}

/* ---------------- Narration, scrubber and predict ---------------- */

export function Narration<F extends BaseFrame>({ p, render }: { p: Player<F>; render?: (s: string) => ReactNode }) {
  const ask = p.asking ? p.frame?.ask : undefined;
  const say = p.frame?.say ?? "";
  return (
    <div className="gx-say">
      <div className="gx-say-top">
        <span className="gx-count">Step {p.cur + 1} of {p.total}</span>
        <input className="gx-scrub" type="range" min={0} max={p.last} value={p.cur} aria-label="Jump to step"
          style={{ "--pct": `${p.last ? (p.cur / p.last) * 100 : 100}%` } as CSSProperties}
          onChange={(e) => p.seek(Number(e.target.value))} />
      </div>
      <div aria-live="polite">
        {ask && p.asking ? <PredictCard ask={ask} chosen={p.asking.chosen} onChoose={p.choose} onContinue={p.proceed} /> : <p className="gx-say-text">{render ? render(say) : codeify(say)}</p>}
      </div>
    </div>
  );
}

/** Text between backticks renders as inline code. */
export function codeify(s: string): ReactNode {
  const parts = s.split("`");
  return parts.map((t, i) => (i % 2 ? <code key={i}>{t}</code> : t));
}

function PredictCard({ ask, chosen, onChoose, onContinue }: { ask: Ask; chosen: number | null; onChoose: (n: number) => void; onContinue: () => void }) {
  const right = chosen !== null && chosen === ask.answer;
  return (
    <div className="gx-ask">
      <div className="gx-ask-label">Predict</div>
      <p className="gx-ask-q">{codeify(ask.q)}</p>
      <div className="gx-ask-opts" role="group" aria-label="Your prediction">
        {ask.options.map((o, i) => {
          const state = chosen === null ? "" : i === ask.answer ? " right" : i === chosen ? " wrong" : " dim";
          return (
            <button key={i} type="button" className={`gx-opt${state}`} disabled={chosen !== null} onClick={() => onChoose(i)}>
              <span className="gx-opt-key">{i + 1}</span><span>{codeify(o)}</span>
            </button>
          );
        })}
      </div>
      {chosen !== null && (
        <div className={`gx-ask-fb ${right ? "good" : "bad"}`}>
          <span className="gx-ask-verdict"><Icon name={right ? "check" : "x"} size={16} />{right ? "Correct" : "Not quite"}</span>
          {ask.why && <span className="gx-ask-why">{codeify(ask.why)}</span>}
          <Button size="m" variant={right ? "good" : "secondary"} onClick={onContinue} autoFocus>Continue<Icon name="chevron-right" size={18} /></Button>
        </div>
      )}
    </div>
  );
}

/* ---------------- Code panel ---------------- */

const KW_RE = /(\b(?:def|class|return|while|for|in|if|else|elif|and|or|not|import|from|lambda|break|continue|True|False|None)\b|\b\d+\b)/;
function tokens(src: string): ReactNode[] {
  // Find a comment start that is not inside a string literal.
  let hash = -1, q: string | null = null;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (q) { if (ch === q) q = null; }
    else if (ch === "'" || ch === '"') q = ch;
    else if (ch === "#") { hash = i; break; }
  }
  const code = hash >= 0 ? src.slice(0, hash) : src;
  const out: ReactNode[] = [];
  code.split(KW_RE).forEach((part, i) => {
    if (!part) return;
    if (/^\d+$/.test(part)) out.push(<span key={i} className="gx-tk-num">{part}</span>);
    else if (KW_RE.test(part) && /^[a-zA-Z]+$/.test(part)) out.push(<span key={i} className="gx-tk-kw">{part}</span>);
    else out.push(part);
  });
  if (hash >= 0) out.push(<span key="c" className="gx-tk-com">{src.slice(hash)}</span>);
  return out;
}

/** Python code with the running line highlighted. Long lines wrap with a hanging indent (no sideways scroll). */
export function CodePanel({ title, lines, active, active2, note }: { title: string; lines: string[]; active: number; active2?: number; note?: ReactNode }) {
  return (
    <figure className="gx-code" aria-label={`Python code: ${title}. Line ${active + 1} is running.`}>
      <figcaption><span className="gx-code-dot" aria-hidden="true" />{title}</figcaption>
      {note && <div className="gx-code-note">{note}</div>}
      <div className="gx-pre">
        {lines.map((ln, i) => {
          const indent = ln.length - ln.trimStart().length;
          const cls = i === active ? " on" : i === active2 ? " on2" : "";
          return (
            <div key={i} className={`gx-ln${cls}`} aria-current={i === active ? "step" : undefined}>
              <span className="gx-no" aria-hidden="true">{i + 1}</span>
              <code style={{ paddingLeft: `${indent + 4}ch`, textIndent: "-4ch" }}>{ln.trim() ? tokens(ln.trimStart()) : " "}</code>
            </div>
          );
        })}
      </div>
    </figure>
  );
}

/* ---------------- Input editor ---------------- */

export function InputEditor({ label, value, onChange, onApply, error, note, presets, onRandom, extra, multiline, rows = 6 }: {
  label: string; value: string; onChange: (v: string) => void; onApply: () => void; error?: string | null; note?: ReactNode;
  presets?: { label: string; run: () => void }[]; onRandom?: () => void; extra?: ReactNode; multiline?: boolean; rows?: number;
}) {
  const [open, setOpen] = useState(false);
  const submit = (e: FormEvent) => { e.preventDefault(); onApply(); };
  return (
    <div className="gx-edit">
      <div className="gx-edit-head">
        <Button size="s" variant="ghost" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          <Icon name="chevron-down" size={16} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform var(--dur) var(--ease)" }} />Edit input
        </Button>
        {onRandom && <Button size="s" variant="ghost" onClick={onRandom}><Icon name="repeat" size={16} />Random</Button>}
        {extra}
      </div>
      {presets && presets.length > 0 && (
        <div className="gx-presets"><span>Presets</span>{presets.map((p) => <Button key={p.label} size="s" onClick={p.run}>{p.label}</Button>)}</div>
      )}
      {open && (
        <form className="gx-edit-body" onSubmit={submit}>
          <label className="gx-field">
            <span>{label}</span>
            {multiline
              ? <textarea value={value} rows={rows} spellCheck={false} autoComplete="off" aria-invalid={!!error} onChange={(e) => onChange(e.target.value)} />
              : <input value={value} spellCheck={false} autoComplete="off" aria-invalid={!!error} onChange={(e) => onChange(e.target.value)} />}
          </label>
          <div className="gx-edit-row">
            <Button size="m" variant="tinted" type="submit">Apply</Button>
            {note && !error && <div className="gx-note">{note}</div>}
          </div>
          {error && <div className="gx-err" role="alert"><Icon name="info" size={16} />{error}</div>}
        </form>
      )}
    </div>
  );
}

/* ---------------- Layout ---------------- */

/** Lab shell: optional mode tabs, the picture + narration + controls, and the code beside (wide) or below (narrow). */
export function LabShell({ tabs, stage, narration, bar, code, below, onKeyDown, label }: {
  tabs?: ReactNode; stage: ReactNode; narration: ReactNode; bar: ReactNode; code: ReactNode; below?: ReactNode; onKeyDown: (e: KeyboardEvent<HTMLElement>) => void; label: string;
}) {
  return (
    <section className="gx-lab" onKeyDown={onKeyDown} tabIndex={-1} aria-label={label}>
      {tabs && <div className="gx-tabs">{tabs}</div>}
      <div className="gx-grid">
        <div className="gx-left">{stage}{narration}{bar}</div>
        <div className="gx-right">{code}{below}</div>
      </div>
    </section>
  );
}

export function Stats({ items }: { items: { label: string; value: ReactNode; tone?: "good" | "bad" }[] }) {
  return (
    <div className="gx-stats">
      {items.map((s) => <span key={s.label} className={`gx-stat${s.tone ? ` ${s.tone}` : ""}`}>{s.label} <b>{s.value}</b></span>)}
    </div>
  );
}

export const randInt = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1));
