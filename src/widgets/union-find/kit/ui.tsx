/** Shared controls for the union-find and toposort labs: player bar, narration with Predict, code panel, input editor, strips. */
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button, Icon, IconButton, Segmented, Toggle, springs } from "@/ui";
import { useReducedMotion } from "@/lib/hooks";
import type { Ask, BaseFrame, Player, Speed } from "./player";
import "./kit.css";

/* ---------------- Controls ---------------- */

export function PlayerBar<F extends BaseFrame>({ p }: { p: Player<F> }) {
  const atEnd = p.cur >= p.last;
  return (
    <div className="kx-bar">
      <div className="kx-btns">
        <Button size="m" onClick={p.back} disabled={p.cur === 0 && !p.asking} aria-label="Step back (Left arrow)"><Icon name="chevron-left" size={18} />Back</Button>
        <Button size="m" variant="primary" onClick={p.toggle} disabled={!!p.asking} aria-label={p.playing ? "Pause (Space)" : "Play (Space)"} className="kx-play">
          <Icon name={p.playing ? "pause" : "play"} size={16} />{p.playing ? "Pause" : atEnd ? "Replay" : "Play"}
        </Button>
        <Button size="m" onClick={p.step} disabled={atEnd || !!p.asking} aria-label="Step (Right arrow)">Step<Icon name="chevron-right" size={18} /></Button>
        <IconButton label="Reset to the first step" onClick={p.reset}><Icon name="reset" size={20} /></IconButton>
      </div>
      <div className="kx-opts">
        <Segmented<Speed> label="Speed" value={p.speed} onChange={p.setSpeed} options={[{ value: 0.5, label: "0.5x" }, { value: 1, label: "1x" }, { value: 2, label: "2x" }]} />
        <Toggle label="Predict" checked={p.predict} onChange={p.setPredict} />
      </div>
    </div>
  );
}

/* ---------------- Narration + Predict ---------------- */

export function Narration<F extends BaseFrame & { tone?: "good" | "bad" | "warn" }>({ p }: { p: Player<F> }) {
  const ask = p.asking ? p.frame?.ask : undefined;
  const tone = p.frame?.tone;
  return (
    <div className={`kx-say${tone ? ` tone-${tone}` : ""}`} aria-live="polite">
      <div className="kx-say-top">
        <span className="kx-count">Step {p.cur + 1} of {p.total}</span>
        <div className="kx-track" aria-hidden="true"><span style={{ width: `${p.last ? (p.cur / p.last) * 100 : 100}%` }} /></div>
      </div>
      {ask && p.asking ? <PredictCard ask={ask} chosen={p.asking.chosen} onChoose={p.choose} onContinue={p.proceed} /> : <p className="kx-say-text">{rich(p.frame?.say ?? "")}</p>}
    </div>
  );
}

/** `code` spans: text between backticks renders in mono. */
export function rich(s: string): ReactNode[] {
  return s.split("`").map((part, i) => (i % 2 ? <code key={i}>{part}</code> : <span key={i}>{part}</span>));
}

function PredictCard({ ask, chosen, onChoose, onContinue }: { ask: Ask; chosen: number | null; onChoose: (n: number) => void; onContinue: () => void }) {
  const right = chosen !== null && chosen === ask.answer;
  return (
    <div className="kx-ask">
      <div className="kx-ask-label">Predict</div>
      <p className="kx-ask-q">{rich(ask.q)}</p>
      <div className="kx-ask-opts" role="group" aria-label="Your prediction">
        {ask.options.map((o, i) => {
          const state = chosen === null ? "" : i === ask.answer ? " right" : i === chosen ? " wrong" : " dim";
          return (
            <button key={i} type="button" className={`kx-opt${state}`} disabled={chosen !== null} onClick={() => onChoose(i)}>
              <span className="kx-opt-key">{i + 1}</span><span>{rich(o)}</span>
            </button>
          );
        })}
      </div>
      {chosen !== null && (
        <div className={`kx-ask-fb ${right ? "good" : "bad"}`}>
          <span className="kx-ask-verdict"><Icon name={right ? "check" : "x"} size={16} />{right ? "Correct" : "Not quite"}</span>
          {ask.why && <span className="kx-ask-why">{rich(ask.why)}</span>}
          <Button size="m" variant={right ? "good" : "secondary"} onClick={onContinue} autoFocus>Continue<Icon name="chevron-right" size={18} /></Button>
        </div>
      )}
    </div>
  );
}

/* ---------------- Code panel ---------------- */

const KWS = "def|class|return|while|for|in|if|else|elif|and|or|not|import|from|lambda|break|continue|True|False|None|self";
const SPLIT = new RegExp(`(\\b(?:${KWS})\\b|\\b\\d+\\b|"[^"]*")`);
function tokens(src: string): ReactNode[] {
  const hash = src.indexOf("#");
  const code = hash >= 0 ? src.slice(0, hash) : src;
  const out: ReactNode[] = [];
  code.split(SPLIT).forEach((part, i) => {
    if (!part) return;
    if (part === "self") out.push(<span key={i} className="tk-self">{part}</span>);
    else if (new RegExp(`^(?:${KWS})$`).test(part)) out.push(<span key={i} className="tk-kw">{part}</span>);
    else if (/^\d+$/.test(part)) out.push(<span key={i} className="tk-num">{part}</span>);
    else if (/^".*"$/.test(part)) out.push(<span key={i} className="tk-str">{part}</span>);
    else out.push(part);
  });
  if (hash >= 0) out.push(<span key="c" className="tk-com">{src.slice(hash)}</span>);
  return out;
}

const LH = 22;
/** Python template with the running line highlighted. `maxHeight` makes it scroll (inside the panel only). */
export function CodePanel({ title, lines, active, active2, maxHeight }: { title: string; lines: string[]; active: number; active2?: number; maxHeight?: number }) {
  const reduce = useReducedMotion();
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = box.current; if (!el || !maxHeight || active < 0) return;
    const top = active * LH, pad = LH * 2;
    if (top < el.scrollTop + pad || top + LH > el.scrollTop + el.clientHeight - pad) {
      el.scrollTo({ top: Math.max(0, top - el.clientHeight / 2 + LH), behavior: reduce ? "auto" : "smooth" });
    }
  }, [active, maxHeight, reduce]);
  return (
    <figure className="kx-code" aria-label={`Python code: ${title}. Line ${active + 1} is running.`}>
      <figcaption><span className="kx-code-dot" aria-hidden="true" />{title}</figcaption>
      <div className="kx-code-scroll" ref={box} style={maxHeight ? { maxHeight, overflowY: "auto" } : undefined}>
        <pre className="kx-pre" style={{ height: lines.length * LH }}>
          {active2 !== undefined && active2 >= 0 && <div className="kx-hl2" style={{ transform: `translateY(${active2 * LH}px)` }} aria-hidden="true" />}
          {active >= 0 && <motion.div className="kx-hl" aria-hidden="true" initial={false} animate={{ y: active * LH }} transition={reduce ? { duration: 0 } : springs.snappy} />}
          {lines.map((ln, i) => (
            <div key={i} className={`kx-ln${i === active ? " on" : ""}`} aria-current={i === active ? "step" : undefined}>
              <span className="kx-no" aria-hidden="true">{i + 1}</span><code>{tokens(ln.replace(/\s{3,}#/, "  #"))}</code>
            </div>
          ))}
        </pre>
      </div>
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
    <div className={`kx-edit${open ? " open" : ""}`}>
      <div className="kx-edit-head">
        <Button size="s" variant="ghost" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          <Icon name="pencil" size={16} />Edit input
          <Icon name="chevron-down" size={16} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform var(--dur) var(--ease)" }} />
        </Button>
        {presets?.map((p) => <Button key={p.label} size="s" variant="ghost" onClick={p.run}>{p.label}</Button>)}
        {onRandom && <Button size="s" variant="ghost" onClick={onRandom}><Icon name="repeat" size={16} />Random</Button>}
      </div>
      {open && (
        <form className="kx-edit-body" onSubmit={submit}>
          <div className="kx-fields">
            {fields.map((f) => (
              <label key={f.id} className={`kx-field${f.wide ? " wide" : ""}`}>
                <span>{f.label}</span>
                <input value={f.value} placeholder={f.placeholder} inputMode={f.numeric ? "numeric" : "text"} spellCheck={false} autoComplete="off"
                  aria-invalid={!!error} onChange={(e) => f.onChange(e.target.value)} />
              </label>
            ))}
            <Button size="m" variant="tinted" type="submit" className="kx-apply">Apply</Button>
          </div>
          {error && <div className="kx-err" role="alert"><Icon name="info" size={16} />{error}</div>}
          {note && !error && <div className="kx-note">{note}</div>}
        </form>
      )}
    </div>
  );
}

/* ---------------- Array row (parent / size / indeg) ---------------- */

export type CellTone = "accent" | "soft" | "good" | "bad" | "dim" | undefined;
export function ArrayRow({ name, values, tones, flash, showIndex = true, label }: {
  name: string; values: (number | string)[]; tones?: CellTone[]; flash?: number[]; showIndex?: boolean; label?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <div className="kx-arr" role="group" aria-label={label ?? `${name} array: ${values.join(", ")}`}>
      <div className="kx-arr-name">{name}</div>
      <div className="kx-arr-cells" style={{ gridTemplateColumns: `repeat(${values.length}, minmax(0, 1fr))` }}>
        {values.map((v, i) => {
          const hot = flash?.includes(i);
          return (
            <div key={i} className={`kx-cell${tones?.[i] ? ` t-${tones[i]}` : ""}`}>
              {showIndex && <span className="kx-idx">{i}</span>}
              <motion.span key={`${v}`} className="kx-val" initial={hot && !reduce ? { scale: 1.35, opacity: 0.3 } : false} animate={{ scale: 1, opacity: 1 }} transition={springs.bouncy}>{v}</motion.span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- Strip (queue / order / stack) ---------------- */

export function Strip({ name, items, hint, tones, emptyText = "empty", ends }: {
  name: string; items: { key: string; label: ReactNode }[]; hint?: ReactNode; tones?: CellTone[]; emptyText?: string; ends?: [string, string];
}) {
  const reduce = useReducedMotion();
  return (
    <div className="kx-strip" role="group" aria-label={`${name}: ${items.length ? items.map((x) => x.key.split(":")[0]).join(", ") : emptyText}`}>
      <div className="kx-strip-head"><span className="kx-arr-name">{name}</span>{hint && <span className="kx-strip-hint">{hint}</span>}</div>
      <div className="kx-strip-row">
        {ends && items.length > 0 && <span className="kx-end">{ends[0]}</span>}
        <AnimatePresence initial={false} mode="popLayout">
          {items.map((it, i) => (
            <motion.span layout={!reduce} key={it.key} className={`kx-chip${tones?.[i] ? ` t-${tones[i]}` : ""}`}
              initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.6, y: 6 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.6, y: -6 }} transition={reduce ? { duration: 0.15 } : springs.snappy}>
              {it.label}
            </motion.span>
          ))}
        </AnimatePresence>
        {items.length === 0 && <span className="kx-empty">{emptyText}</span>}
        {ends && items.length > 0 && <span className="kx-end">{ends[1]}</span>}
      </div>
    </div>
  );
}

/* ---------------- Mode tabs ---------------- */

export function ModeTabs<M extends string>({ mode, modes, onChange }: { mode: M; modes: { value: M; label: string }[]; onChange: (m: M) => void }) {
  return <div className="kx-tabs"><Segmented<M> value={mode} options={modes} onChange={onChange} /></div>;
}
