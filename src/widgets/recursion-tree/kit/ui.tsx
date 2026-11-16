/** Shared controls for the recursion-tree and tree-walk labs: player bar, narration, predict card, code panel, input editor. */
import { useState, type FormEvent, type KeyboardEvent, type ReactNode } from "react";
import { motion } from "framer-motion";
import { Button, Icon, IconButton, Segmented, Toggle, springs } from "@/ui";
import { useReducedMotion } from "@/lib/hooks";
import type { Ask, BaseFrame, Player, Speed } from "./player";
import "./kit.css";

/* ---------------- Controls ---------------- */

export function PlayerBar<F extends BaseFrame>({ p, extra }: { p: Player<F>; extra?: ReactNode }) {
  const atEnd = p.cur >= p.last;
  return (
    <div className="rx-bar">
      <div className="rx-btns">
        <Button size="m" onClick={p.back} disabled={p.cur === 0 && !p.asking} aria-label="Step back (Left arrow)"><Icon name="chevron-left" size={18} />Back</Button>
        <Button size="m" variant="primary" onClick={p.toggle} disabled={!!p.asking} aria-label={p.playing ? "Pause (Space)" : "Play (Space)"} className="rx-play">
          <Icon name={p.playing ? "pause" : "play"} size={16} />{p.playing ? "Pause" : atEnd ? "Replay" : "Play"}
        </Button>
        <Button size="m" onClick={p.step} disabled={atEnd || !!p.asking} aria-label="Step (Right arrow)">Step<Icon name="chevron-right" size={18} /></Button>
        <IconButton label="Reset" onClick={p.reset}><Icon name="reset" size={20} /></IconButton>
      </div>
      <div className="rx-opts">
        <Segmented<Speed> label="Speed" value={p.speed} onChange={p.setSpeed} options={[{ value: 0.5, label: "0.5x" }, { value: 1, label: "1x" }, { value: 2, label: "2x" }]} />
        <Toggle label="Predict" checked={p.predict} onChange={p.setPredict} />
        {extra}
      </div>
    </div>
  );
}

/* ---------------- Narration + predict ---------------- */

/** Render `code` spans inside narration: text between backticks becomes <code>. */
export function Rich({ text }: { text: string }) {
  const parts = text.split("`");
  return <>{parts.map((s, i) => (i % 2 ? <code key={i}>{s}</code> : <span key={i}>{s}</span>))}</>;
}

export function Narration<F extends BaseFrame>({ p }: { p: Player<F> }) {
  const ask = p.asking ? p.frame?.ask : undefined;
  return (
    <div className="rx-say" aria-live="polite">
      <div className="rx-say-top">
        <span className="rx-count">Step {p.cur + 1} of {p.total}</span>
        <div className="rx-track" aria-hidden="true"><span style={{ width: `${p.last ? (p.cur / p.last) * 100 : 100}%` }} /></div>
      </div>
      {ask && p.asking ? <PredictCard ask={ask} chosen={p.asking.chosen} onChoose={p.choose} onContinue={p.proceed} /> : <p className="rx-say-text"><Rich text={p.frame?.say ?? ""} /></p>}
    </div>
  );
}

function PredictCard({ ask, chosen, onChoose, onContinue }: { ask: Ask; chosen: number | null; onChoose: (n: number) => void; onContinue: () => void }) {
  const right = chosen !== null && chosen === ask.answer;
  return (
    <div className="rx-ask">
      <div className="rx-ask-label">Predict</div>
      <p className="rx-ask-q"><Rich text={ask.q} /></p>
      <div className="rx-ask-opts" role="group" aria-label="Your prediction">
        {ask.options.map((o, i) => {
          const state = chosen === null ? "" : i === ask.answer ? " right" : i === chosen ? " wrong" : " dim";
          return (
            <button key={i} type="button" className={`rx-opt${state}`} disabled={chosen !== null} onClick={() => onChoose(i)}>
              <span className="rx-opt-key">{i + 1}</span><span><Rich text={o} /></span>
            </button>
          );
        })}
      </div>
      {chosen !== null && (
        <div className={`rx-ask-fb ${right ? "good" : "bad"}`}>
          <span className="rx-ask-verdict"><Icon name={right ? "check" : "x"} size={16} />{right ? "Correct" : "Not quite"}</span>
          {ask.why && <span className="rx-ask-why"><Rich text={ask.why} /></span>}
          <Button size="m" variant={right ? "good" : "secondary"} onClick={onContinue} autoFocus>Continue<Icon name="chevron-right" size={18} /></Button>
        </div>
      )}
    </div>
  );
}

/* ---------------- Code panel ---------------- */

const KWS = "def|class|return|while|for|in|if|else|elif|and|or|not|import|from|lambda|break|continue|True|False|None|nonlocal|is";
const KW = new RegExp(`^(?:${KWS})$`);
const SPLIT = new RegExp(`(\\b(?:${KWS})\\b|\\b\\d+\\b|@\\w+)`);
function tokens(src: string): ReactNode[] {
  const hash = src.indexOf("#");
  const code = hash >= 0 ? src.slice(0, hash) : src;
  const out: ReactNode[] = [];
  code.split(SPLIT).forEach((part, i) => {
    if (!part) return;
    if (KW.test(part)) out.push(<span key={i} className="rx-kw">{part}</span>);
    else if (/^\d+$/.test(part)) out.push(<span key={i} className="rx-num">{part}</span>);
    else if (part.startsWith("@")) out.push(<span key={i} className="rx-deco">{part}</span>);
    else out.push(part);
  });
  if (hash >= 0) out.push(<span key="c" className="rx-com">{src.slice(hash)}</span>);
  return out;
}

const LH = 22;
/** Python template with the running line highlighted. `off` lines are drawn struck out (e.g. @cache when memo is off). */
export function CodePanel({ title, lines, active, active2, off }: { title: string; lines: string[]; active: number; active2?: number; off?: number[] }) {
  const reduce = useReducedMotion();
  return (
    <figure className="rx-code" aria-label={`Python code: ${title}. Line ${active + 1} is running.`}>
      <figcaption><span className="rx-code-dot" aria-hidden="true" />{title}</figcaption>
      <div className="rx-code-scroll">
        <pre className="rx-pre" style={{ height: lines.length * LH }}>
          {active2 !== undefined && active2 >= 0 && <div className="rx-hl2" style={{ transform: `translateY(${active2 * LH}px)` }} aria-hidden="true" />}
          {active >= 0 && <motion.div className="rx-hl" aria-hidden="true" initial={false} animate={{ y: active * LH }} transition={reduce ? { duration: 0 } : springs.snappy} />}
          {lines.map((ln, i) => (
            <div key={i} className={`rx-ln${i === active ? " on" : ""}${off?.includes(i) ? " off" : ""}`} aria-current={i === active ? "step" : undefined}>
              <span className="rx-no" aria-hidden="true">{i + 1}</span><code>{tokens(ln)}</code>
            </div>
          ))}
        </pre>
      </div>
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
    <div className={`rx-edit${open ? " open" : ""}`}>
      <div className="rx-edit-head">
        {fields.length > 0 && (
          <Button size="s" variant="ghost" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
            <Icon name="chevron-down" size={16} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform var(--dur) var(--ease)" }} />Edit input
          </Button>
        )}
        {onRandom && <Button size="s" variant="ghost" onClick={onRandom}><Icon name="repeat" size={16} />Random</Button>}
        {children}
      </div>
      {open && (
        <form className="rx-edit-body" onSubmit={submit}>
          <div className="rx-fields">
            {fields.map((f) => (
              <label key={f.id} className={`rx-field${f.wide ? " wide" : ""}`}>
                <span>{f.label}</span>
                <input value={f.value} placeholder={f.placeholder} inputMode={f.numeric ? "numeric" : "text"} spellCheck={false} autoComplete="off"
                  aria-invalid={!!error} onChange={(e) => f.onChange(e.target.value)} />
              </label>
            ))}
            <Button size="m" variant="tinted" type="submit" className="rx-apply">Apply</Button>
          </div>
          {error && <div className="rx-err" role="alert"><Icon name="info" size={16} />{error}</div>}
          {note && !error && <div className="rx-note">{note}</div>}
          {presets && presets.length > 0 && (
            <div className="rx-presets"><span>Presets</span>{presets.map((p) => <Button key={p.label} size="s" onClick={p.run}>{p.label}</Button>)}</div>
          )}
        </form>
      )}
    </div>
  );
}

/* ---------------- Layout shell ---------------- */

/** Mode tabs, then the picture + narration + controls, with the code beside (wide) or below (narrow). */
export function LabShell({ tabs, stage, narration, bar, code, side, below, onKeyDown, label }: {
  tabs?: ReactNode; stage: ReactNode; narration: ReactNode; bar: ReactNode; code: ReactNode; side?: ReactNode; below?: ReactNode; onKeyDown: (e: KeyboardEvent<HTMLElement>) => void; label: string;
}) {
  return (
    <section className="rx-lab" onKeyDown={onKeyDown} tabIndex={-1} aria-label={label}>
      {tabs && <div className="rx-tabs">{tabs}</div>}
      <div className="rx-grid">
        <div className="rx-left">{stage}{narration}{bar}</div>
        <div className="rx-right">{code}{side}</div>
      </div>
      {below}
    </section>
  );
}

/* ---------------- Small panels ---------------- */

/** A labelled row of boxes (path, res, used, stack ...). */
export function VarRow({ name, children, note }: { name: string; children: ReactNode; note?: ReactNode }) {
  return (
    <div className="rx-var">
      <span className="rx-var-name">{name}</span>
      <div className="rx-var-items">{children}</div>
      {note && <span className="rx-var-note">{note}</span>}
    </div>
  );
}

/* ---------------- Parsing helpers ---------------- */

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
export const fmtList = (a: (number | string)[]) => `[${a.join(", ")}]`;
