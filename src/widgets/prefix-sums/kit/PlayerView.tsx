/** Layout shared by the step labs: stage, narration (or a predict question), transport, code panel, input editor. */
import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button, Icon, Segmented, Slider, Stage, Toggle } from "@/ui";
import { useReducedMotion, useWidth } from "@/lib/hooks";
import type { PlayerApi, Speed } from "./player";
import "./kit.css";

/** Renders `code` spans inside a narration sentence. */
export function Rich({ text }: { text: string }) {
  const parts = text.split("`");
  return <>{parts.map((p, k) => (k % 2 ? <code key={k} className="ak-ic">{p}</code> : <Fragment key={k}>{p}</Fragment>))}</>;
}

const KW = /\b(def|for|in|while|if|else|return|from|import|and|not|or|lambda|max|min|len|range|enumerate|list|accumulate|deque|defaultdict)\b/g;
const BUILTIN = new Set(["max", "min", "len", "range", "enumerate", "list", "accumulate", "deque", "defaultdict"]);
function CodeLine({ text }: { text: string }) {
  const hash = text.indexOf("#");
  const body = hash >= 0 ? text.slice(0, hash) : text;
  const comment = hash >= 0 ? text.slice(hash) : "";
  const out: ReactNode[] = [];
  let lastIdx = 0;
  body.replace(KW, (m, _g, off: number) => {
    if (off > lastIdx) out.push(body.slice(lastIdx, off));
    out.push(<span key={off} className={BUILTIN.has(m) ? "ak-bi" : "ak-kw"}>{m}</span>);
    lastIdx = off + m.length;
    return m;
  });
  out.push(body.slice(lastIdx));
  return <>{out}{comment && <span className="ak-cm">{comment}</span>}</>;
}

/** Wrapped code lines hang 4 columns past their own indent. */
const hang = (t: string) => { const lead = t.length - t.trimStart().length + 4; return { paddingLeft: `${lead}ch`, textIndent: `-${lead}ch` }; };

export function CodePanel({ code, line, title }: { code: string[]; line: number; title: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const w = useWidth(ref);
  // In a narrow panel, pull padded inline comments in to two spaces so less wraps.
  const tight = w > 0 && w < 600;
  return (
    <div className="ak-code" ref={ref}>
      <div className="ak-code-head"><span>Python</span><span className="ak-code-title">{title}</span></div>
      <pre className="ak-pre" aria-label={`Python code, line ${line} is running`}>
        {code.map((t, k) => {
          const txt = tight ? t.replace(/(\S)\s{3,}#/, "$1  #") : t;
          const on = k + 1 === line;
          return (
            <div key={k} className={`ak-ln${on ? " on" : ""}`} aria-current={on ? "step" : undefined}>
              <span className="ak-no" aria-hidden="true">{k + 1}</span>
              <span className="ak-tx" style={hang(txt)}>{txt ? <CodeLine text={txt} /> : " "}</span>
            </div>
          );
        })}
      </pre>
    </div>
  );
}

export interface EditorSpec {
  fields: { id: string; label: string; value: string; onChange: (v: string) => void; placeholder?: string; narrow?: boolean; hint?: string }[];
  error?: string | null;
  onApply: () => void;
  presets?: { label: string; onClick: () => void }[];
  onRandom?: () => void;
}

function EditBox({ spec, open, setOpen, fixed }: { spec: EditorSpec; open: boolean; setOpen: (v: boolean) => void; fixed: boolean }) {
  return (
    <div className={`ak-edit${open ? " open" : ""}`}>
      {fixed ? <div className="ak-edit-head static">Edit input</div> : (
        <button type="button" className="ak-edit-head" aria-expanded={open} onClick={() => setOpen(!open)}>
          <span>Edit input</span><Icon name="chevron-down" size={18} className="ak-chev" />
        </button>
      )}
      {open && (
        <form className="ak-edit-body" onSubmit={(e) => { e.preventDefault(); spec.onApply(); }}>
          <div className="ak-fields">
            {spec.fields.map((f) => (
              <label key={f.id} className={`ak-field${f.narrow ? " narrow" : ""}`}>
                <span>{f.label}</span>
                <input value={f.value} onChange={(e) => f.onChange(e.target.value)} placeholder={f.placeholder} spellCheck={false} autoComplete="off"
                  aria-invalid={!!spec.error} />
                {f.hint && <small>{f.hint}</small>}
              </label>
            ))}
          </div>
          {spec.error && <div className="ak-err" role="alert">{spec.error}</div>}
          <div className="ak-edit-actions">
            <Button type="submit" size="s" variant="tinted">Apply</Button>
            {spec.onRandom && <Button size="s" onClick={spec.onRandom}>Random</Button>}
            {spec.presets?.map((p) => <Button key={p.label} size="s" variant="ghost" onClick={p.onClick}>{p.label}</Button>)}
          </div>
        </form>
      )}
    </div>
  );
}

function PredictCard<S>({ pl }: { pl: PlayerApi<S> }) {
  const p = pl.pending !== null ? pl.frames[pl.pending]?.predict : undefined;
  const [wrong, setWrong] = useState<number[]>([]);
  const [done, setDone] = useState<null | "right" | "reveal">(null);
  useEffect(() => { setWrong([]); setDone(null); }, [pl.pending]);
  if (!p) return null;
  const pick = (k: number) => {
    if (done) return;
    if (k === p.answer) { setDone("right"); return; }
    const w = [...wrong, k];
    setWrong(w);
    if (w.length >= 2 || p.options.length <= 2) setDone("reveal");
  };
  return (
    <div className="ak-predict" role="group" aria-label="Predict">
      <div className="ak-predict-q"><span className="ak-badge">Predict</span><Rich text={p.q} /></div>
      <div className="ak-opts">
        {p.options.map((o, k) => {
          const st = wrong.includes(k) ? "bad" : (done && k === p.answer) ? "good" : "";
          return (
            <button key={k} type="button" className={`ak-opt ${st}`} onClick={() => pick(k)} disabled={!!done && k !== p.answer && !wrong.includes(k)}>
              <span className="ak-opt-k">{k + 1}</span><span><Rich text={o} /></span>
            </button>
          );
        })}
      </div>
      {wrong.length > 0 && !done && <div className="ak-verdict bad"><strong>Not quite.</strong> Try again.</div>}
      {done && (
        <div className={`ak-verdict ${done === "right" ? "good" : "bad"}`}>
          <strong>{done === "right" ? "Correct." : "Here is why."}</strong> <Rich text={p.why} />
        </div>
      )}
      {done && <div><Button size="s" variant="primary" onClick={pl.resolve} autoFocus>Continue <Icon name="chevron-right" size={16} /></Button></div>}
    </div>
  );
}

export interface ViewProps<S> {
  pl: PlayerApi<S>;
  code: string[];
  codeTitle: string;
  stage: ReactNode;
  stageLabel: string;
  editor?: EditorSpec;
  aside?: ReactNode;
  hint?: ReactNode;
}

export function PlayerView<S>({ pl, code, codeTitle, stage, stageLabel, editor, aside, hint }: ViewProps<S>) {
  const rootRef = useRef<HTMLDivElement>(null);
  const w = useWidth(rootRef);
  const wide = w >= 860;
  const [editOpen, setEditOpen] = useState(false);
  const reduce = useReducedMotion();
  const f = pl.frame;

  // Keyboard: Left/Right step, Space plays. Works when focus is in the lab or nowhere in particular.
  const api = useRef(pl); api.current = pl;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const root = rootRef.current; if (!root || e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      const inside = !!t && root.contains(t);
      if (!inside && t !== document.body && t !== document.documentElement) return;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
      if (e.key === "ArrowRight") { e.preventDefault(); api.current.step(); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); api.current.back(); }
      else if (e.key === " " || e.key === "Spacebar") {
        if (inside && t && t.closest(".ak-opt")) return;
        e.preventDefault(); api.current.toggle();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const open = wide || editOpen;
  return (
    <div className={`ak${wide ? " wide" : ""}`} ref={rootRef}>
      <div className="ak-grid">
        <div className="ak-main">
          <Stage className="ak-stage">
            <div role="img" aria-label={stageLabel}>{stage}</div>
          </Stage>
          <div className="ak-say-wrap">
            <AnimatePresence mode="wait" initial={false}>
              {pl.pending !== null ? (
                <motion.div key="predict" initial={{ opacity: 0, y: reduce ? 0 : 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
                  <PredictCard pl={pl} />
                </motion.div>
              ) : (
                <motion.div key="say" className={`ak-say tone-${f?.tone ?? "neutral"}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                  <div className="ak-say-top">
                    <span className="ak-stepno">Step {pl.i + 1} of {pl.last + 1}</span>
                    <span className="ak-lineno">line {f?.line}</span>
                  </div>
                  <p className="ak-say-text" aria-live="polite"><Rich text={f?.say ?? ""} /></p>
                  {f?.vars && f.vars.length > 0 && (
                    <div className="ak-vars">{f.vars.map(([k, v]) => <span key={k} className="ak-var"><span>{k}</span><b>{v}</b></span>)}</div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
            {hint && pl.pending === null && <div className="ak-hint">{hint}</div>}
          </div>
          <div className="ak-transport">
            <div className="ak-buttons">
              <Button size="m" onClick={pl.back} disabled={pl.i === 0 && pl.pending === null} aria-label="Step back"><Icon name="chevron-left" size={18} />Back</Button>
              <Button size="m" variant="tinted" className={!pl.touched && !reduce ? "ak-pulse" : ""} onClick={pl.step} disabled={pl.i >= pl.last || pl.pending !== null}>Step<Icon name="chevron-right" size={18} /></Button>
              <Button size="m" onClick={pl.toggle} disabled={pl.pending !== null} aria-label={pl.playing ? "Pause" : "Play"}>
                <Icon name={pl.playing ? "pause" : "play"} size={16} />{pl.playing ? "Pause" : "Play"}
              </Button>
              <Button size="m" variant="ghost" onClick={pl.reset} aria-label="Reset"><Icon name="reset" size={18} />Reset</Button>
            </div>
            <div className="ak-settings">
              <div className="ak-scrub"><Slider label="Step" value={pl.i} min={0} max={Math.max(1, pl.last)} onChange={pl.jump} format={(v) => `${v + 1} / ${pl.last + 1}`} /></div>
              <Segmented<Speed> label="Speed" value={pl.speed} onChange={pl.setSpeed} options={[{ value: "slow", label: "Slow" }, { value: "normal", label: "Normal" }, { value: "fast", label: "Fast" }]} />
              <Toggle label="Predict" hint="Stop and ask before key moves" checked={pl.predictOn} onChange={pl.setPredictOn} />
            </div>
          </div>
        </div>
        <div className="ak-side">
          <CodePanel code={code} line={f?.line ?? 0} title={codeTitle} />
          {aside}
          {editor && <EditBox spec={editor} open={open} setOpen={setEditOpen} fixed={wide} />}
        </div>
      </div>
    </div>
  );
}

/** Mode tabs (shown only when the lesson did not lock a mode). */
export function ModeTabs<T extends string>({ modes, value, onChange }: { modes: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return <div className="ak-tabs"><Segmented<T> value={value} onChange={onChange} options={modes} /></div>;
}
