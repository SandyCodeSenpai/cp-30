/** Controls, narration, code panel and input editor shared by the range-query and string-match labs. */
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from "react";
import { motion } from "framer-motion";
import { Button, Icon, IconButton, Segmented, Toggle, springs } from "@/ui";
import { useReducedMotion } from "@/lib/hooks";
import type { Ask, BaseFrame, Player, Speed } from "./player";
import "./kit.css";

/** Render `code` spans inside a narration string. */
export function rich(text: string): ReactNode[] {
  return text.split(/(`[^`]+`)/).map((part, i) =>
    part.startsWith("`") && part.endsWith("`") && part.length > 1 ? <code key={i}>{part.slice(1, -1)}</code> : <span key={i}>{part}</span>);
}

/* ---------------- Controls ---------------- */

export function PlayerBar<F extends BaseFrame>({ p }: { p: Player<F> }) {
  const atEnd = p.cur >= p.last;
  return (
    <div className="rq-bar">
      <div className="rq-btns">
        <Button size="m" onClick={p.back} disabled={p.cur === 0 && !p.asking} aria-label="Step back (Left arrow)"><Icon name="chevron-left" size={18} />Back</Button>
        <Button size="m" variant="primary" onClick={p.toggle} disabled={!!p.asking} aria-label={p.playing ? "Pause (Space)" : "Play (Space)"} className="rq-play">
          <Icon name={p.playing ? "pause" : "play"} size={16} />{p.playing ? "Pause" : atEnd ? "Replay" : "Play"}
        </Button>
        <Button size="m" onClick={p.step} disabled={atEnd || !!p.asking} aria-label="Step (Right arrow)">Step<Icon name="chevron-right" size={18} /></Button>
        <IconButton label="Reset" onClick={p.reset}><Icon name="reset" size={20} /></IconButton>
      </div>
      <div className="rq-opts">
        <Segmented<Speed> label="Speed" value={p.speed} onChange={p.setSpeed} options={[{ value: 0.5, label: "0.5x" }, { value: 1, label: "1x" }, { value: 2, label: "2x" }]} />
        <Toggle label="Predict" checked={p.predict} onChange={p.setPredict} />
      </div>
    </div>
  );
}

/* ---------------- Narration + predict ---------------- */

export function Narration<F extends BaseFrame>({ p }: { p: Player<F> }) {
  const ask = p.asking ? p.frame?.ask : undefined;
  return (
    <div className="rq-say" aria-live="polite">
      <div className="rq-say-top">
        <span className="rq-count">Step {p.cur + 1} of {p.total}</span>
        <div className="rq-track" aria-hidden="true"><span style={{ width: `${p.last ? (p.cur / p.last) * 100 : 100}%` }} /></div>
      </div>
      {ask && p.asking ? <PredictCard ask={ask} chosen={p.asking.chosen} onChoose={p.choose} onContinue={p.proceed} />
        : <p className="rq-say-text">{rich(p.frame?.say ?? "")}</p>}
    </div>
  );
}

function PredictCard({ ask, chosen, onChoose, onContinue }: { ask: Ask; chosen: number | null; onChoose: (n: number) => void; onContinue: () => void }) {
  const right = chosen !== null && chosen === ask.answer;
  return (
    <div className="rq-ask">
      <div className="rq-ask-label">Predict</div>
      <p className="rq-ask-q">{rich(ask.q)}</p>
      <div className="rq-ask-opts" role="group" aria-label="Your prediction">
        {ask.options.map((o, i) => {
          const state = chosen === null ? "" : i === ask.answer ? " right" : i === chosen ? " wrong" : " dim";
          return (
            <button key={i} type="button" className={`rq-opt${state}`} disabled={chosen !== null} onClick={() => onChoose(i)}>
              <span className="rq-opt-key">{i + 1}</span><span>{rich(o)}</span>
            </button>
          );
        })}
      </div>
      {chosen !== null && (
        <div className={`rq-ask-fb ${right ? "good" : "bad"}`}>
          <span className="rq-ask-verdict"><Icon name={right ? "check" : "x"} size={16} />{right ? "Correct" : "Not quite"}</span>
          {ask.why && <span className="rq-ask-why">{rich(ask.why)}</span>}
          <Button size="m" variant={right ? "good" : "secondary"} onClick={onContinue} autoFocus>Continue<Icon name="chevron-right" size={18} /></Button>
        </div>
      )}
    </div>
  );
}

/* ---------------- Code panel ---------------- */

const KWS = new Set(["def", "class", "return", "while", "for", "in", "if", "else", "elif", "and", "or", "not", "import", "from", "lambda", "break", "True", "False", "None", "is"]);

/** Tiny Python highlighter: keywords, numbers, strings, comments. */
function tokens(src: string): ReactNode[] {
  const out: ReactNode[] = [];
  let i = 0, buf = "", k = 0;
  const flush = () => { if (buf) { out.push(buf); buf = ""; } };
  while (i < src.length) {
    const c = src[i];
    if (c === "#") { flush(); out.push(<span key={k++} className="tk-com">{src.slice(i)}</span>); break; }
    if (c === '"' || c === "'") {
      let j = i + 1; while (j < src.length && src[j] !== c) j += src[j] === "\\" ? 2 : 1;
      flush(); out.push(<span key={k++} className="tk-str">{src.slice(i, j + 1)}</span>); i = j + 1; continue;
    }
    if (/[A-Za-z_]/.test(c)) {
      let j = i; while (j < src.length && /\w/.test(src[j])) j++;
      const w = src.slice(i, j);
      if (KWS.has(w)) { flush(); out.push(<span key={k++} className="tk-kw">{w}</span>); }
      else if (w === "self") { flush(); out.push(<span key={k++} className="tk-self">{w}</span>); }
      else buf += w;
      i = j; continue;
    }
    if (/\d/.test(c)) {
      let j = i; while (j < src.length && /[\d_*]/.test(src[j])) j++;
      flush(); out.push(<span key={k++} className="tk-num">{src.slice(i, j)}</span>); i = j; continue;
    }
    buf += c; i++;
  }
  flush();
  return out;
}

const LH = 21;
export function CodePanel({ title, lines, active, active2, note }: { title: string; lines: string[]; active: number; active2?: number; note?: ReactNode }) {
  const reduce = useReducedMotion();
  const scroll = useRef<HTMLDivElement>(null);
  // Keep the running line visible inside the panel (the panel scrolls, the page never does).
  useEffect(() => {
    const el = scroll.current; if (!el || active < 0) return;
    const top = active * LH + 8, bottom = top + LH;
    if (top < el.scrollTop + 8) el.scrollTo({ top: Math.max(0, top - 3 * LH), behavior: reduce ? "auto" : "smooth" });
    else if (bottom > el.scrollTop + el.clientHeight - 8) el.scrollTo({ top: bottom - el.clientHeight + 3 * LH, behavior: reduce ? "auto" : "smooth" });
  }, [active, reduce]);
  return (
    <figure className="rq-code" aria-label={`Python code: ${title}. Line ${active + 1} is running.`}>
      <figcaption><span className="rq-code-dot" aria-hidden="true" />{title}</figcaption>
      <div className="rq-code-scroll" ref={scroll}>
        <pre className="rq-pre" style={{ height: lines.length * LH }}>
          {active2 !== undefined && active2 >= 0 && <div className="rq-hl2" style={{ transform: `translateY(${active2 * LH}px)` }} aria-hidden="true" />}
          {active >= 0 && <motion.div className="rq-hl" aria-hidden="true" initial={false} animate={{ y: active * LH }} transition={reduce ? { duration: 0 } : springs.snappy} />}
          {lines.map((ln, i) => (
            <div key={i} className={`rq-ln${i === active ? " on" : ""}`} aria-current={i === active ? "step" : undefined}>
              <span className="rq-no" aria-hidden="true">{i + 1}</span><code>{tokens(ln)}</code>
            </div>
          ))}
        </pre>
      </div>
      {note && <div className="rq-code-note">{note}</div>}
    </figure>
  );
}

/* ---------------- Input editor ---------------- */

export interface Field { id: string; label: string; value: string; onChange: (v: string) => void; placeholder?: string; wide?: boolean; numeric?: boolean }
export function InputEditor({ fields, onApply, error, presets, onRandom, note }: {
  fields: Field[]; onApply: () => void; error?: string | null; presets?: { label: string; run: () => void }[]; onRandom?: () => void; note?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const submit = (e: FormEvent) => { e.preventDefault(); onApply(); };
  return (
    <div className={`rq-edit${open ? " open" : ""}`}>
      <div className="rq-edit-head">
        <Button size="s" variant="ghost" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          <Icon name="pencil" size={16} />Edit input
          <Icon name="chevron-down" size={16} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform var(--dur) var(--ease)" }} />
        </Button>
        {onRandom && <Button size="s" variant="ghost" onClick={onRandom}><Icon name="repeat" size={16} />Random</Button>}
      </div>
      {open && (
        <form className="rq-edit-body" onSubmit={submit}>
          <div className="rq-fields">
            {fields.map((f) => (
              <label key={f.id} className={`rq-field${f.wide ? " wide" : ""}`}>
                <span>{f.label}</span>
                <input value={f.value} placeholder={f.placeholder} inputMode={f.numeric ? "numeric" : "text"} spellCheck={false} autoComplete="off" autoCapitalize="off"
                  aria-invalid={!!error} onChange={(e) => f.onChange(e.target.value)} />
              </label>
            ))}
            <Button size="m" variant="tinted" type="submit" className="rq-apply">Apply</Button>
          </div>
          {error && <div className="rq-err" role="alert"><Icon name="info" size={16} />{error}</div>}
          {note && !error && <div className="rq-note">{note}</div>}
          {presets && presets.length > 0 && (
            <div className="rq-presets"><span>Presets</span>{presets.map((p) => <Button key={p.label} size="s" onClick={p.run}>{p.label}</Button>)}</div>
          )}
        </form>
      )}
    </div>
  );
}

/* ---------------- Small pieces ---------------- */

/** A row of labelled values (variables), e.g. i = 6, s = 11. */
export function Vars({ items }: { items: { k: string; v: ReactNode; tone?: "accent" | "good" | "warn" | "bad" }[] }) {
  return (
    <div className="rq-vars">
      {items.map((it) => <span key={it.k} className={`rq-var${it.tone ? ` t-${it.tone}` : ""}`}>{it.k} = <b>{it.v}</b></span>)}
    </div>
  );
}

/** A small key for the colours used in a picture. */
export function Legend({ items }: { items: { cls: string; label: string }[] }) {
  return <div className="rq-legend" aria-hidden="true">{items.map((it) => <span key={it.label}><i className={it.cls} />{it.label}</span>)}</div>;
}

/** Lab shell: optional mode tabs, then picture + narration + controls, and the code beside (wide) or below (narrow). */
export function LabShell({ tabs, top, stage, narration, bar, code, below, onKeyDown, label }: {
  tabs?: ReactNode; top?: ReactNode; stage: ReactNode; narration: ReactNode; bar: ReactNode; code: ReactNode; below?: ReactNode; onKeyDown: (e: KeyboardEvent<HTMLElement>) => void; label: string;
}) {
  return (
    <section className="rq-lab" onKeyDown={onKeyDown} tabIndex={-1} aria-label={label}>
      {tabs && <div className="rq-tabs">{tabs}</div>}
      <div className="rq-grid">
        <div className="rq-left">{top}{stage}{narration}{bar}</div>
        <div className="rq-right">{code}{below}</div>
      </div>
    </section>
  );
}

/** Horizontal scroller that keeps a target x (in px) in view without moving the page. */
export function HScroll({ children, focusX, className = "" }: { children: ReactNode; focusX?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el || focusX === undefined || el.scrollWidth <= el.clientWidth + 2) return;
    const pad = 48;
    if (focusX < el.scrollLeft + pad || focusX > el.scrollLeft + el.clientWidth - pad) {
      el.scrollTo({ left: Math.max(0, focusX - el.clientWidth / 2), behavior: "smooth" });
    }
  }, [focusX]);
  return <div className={`rq-hscroll ${className}`} ref={ref}>{children}</div>;
}

/** Small whole-number input that commits only valid values (min..max). */
export function NumIn({ label, value, onChange, min, max }: { label: string; value: number; onChange: (v: number) => void; min: number; max: number }) {
  const [txt, setTxt] = useState(String(value));
  useEffect(() => { setTxt(String(value)); }, [value]);
  const n = Number(txt.trim());
  const ok = /^-?\d+$/.test(txt.trim()) && n >= min && n <= max;
  return (
    <label className="rq-num">
      <span>{label}</span>
      <input value={txt} inputMode="numeric" spellCheck={false} autoComplete="off" aria-invalid={!ok} title={`${min} to ${max}`}
        onChange={(e) => { const v = e.target.value; setTxt(v); const m = Number(v.trim()); if (/^-?\d+$/.test(v.trim()) && m >= min && m <= max) onChange(m); }}
        onBlur={() => { if (!ok) setTxt(String(value)); }} />
    </label>
  );
}
