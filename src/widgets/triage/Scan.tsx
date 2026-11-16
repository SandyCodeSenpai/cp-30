import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { Button, Icon, springs } from "@/ui";
import { BUDGETS, COST, FAM, SHAPES, SKIP, WANTS, ruleOut, type Choices, type Family, type Out, type StepId } from "./data";

export const STEPS: { id: StepId; secs: string; title: string; ask: string; hint: string }[] = [
  { id: "budget", secs: "0–5 s", title: "n and values", ask: "How large is n?", hint: "Read the constraints first. They set your complexity budget." },
  { id: "want", secs: "5–8 s", title: "What it wants", ask: "What does it want back?", hint: "Count? Min or max? YES/NO? Any valid answer?" },
  { id: "shape", secs: "8–10 s", title: "Input shape", ask: "What is the input?", hint: "Array, string, grid, tree, graph, intervals, one number?" },
  { id: "trigger", secs: "10–15 s", title: "Trigger phrase", ask: "Which phrase is in the statement?", hint: "Only phrases of the patterns still alive are shown." },
];

export interface Scored { f: Family; out: Out | null }

/** All derived state of a scan: which families survive, counts after each step, trigger options. */
export function useScan(families: Family[], c: Choices) {
  return useMemo(() => {
    const scored: Scored[] = families.map((f) => ({ f, out: ruleOut(f, c) }));
    const partial = (k: number): Choices => ({ budget: c.budget, want: k > 1 ? c.want : undefined, shape: k > 2 ? c.shape : undefined, trigger: k > 3 ? c.trigger : undefined });
    const counts = [families.length, ...[1, 2, 3, 4].map((k) => families.filter((f) => !ruleOut(f, partial(k))).length)];
    const before4 = families.filter((f) => !ruleOut(f, partial(3)));
    // Round-robin: each surviving family's first phrase, then each one's second, and so on.
    const triggers: string[] = [];
    const maxT = Math.max(0, ...before4.map((f) => f.triggers.length));
    for (let k = 0; k < maxT; k++) before4.forEach((f) => { const t = f.triggers[k]; if (t && !triggers.includes(t)) triggers.push(t); });
    const alive = scored.filter((s) => !s.out);
    const done = !!c.trigger && c.trigger !== SKIP;
    return { scored, counts, triggers, alive, done };
  }, [families, c]);
}

export function stepValue(id: StepId, c: Choices): string | null {
  const v = c[id];
  if (!v) return null;
  if (v === SKIP) return "skipped";
  if (id === "budget") { const b = BUDGETS.find((x) => x.id === v)!; return `${COST[b.rank]}`; }
  if (id === "want") return WANTS.find((x) => x.id === v)?.short ?? v;
  if (id === "shape") return SHAPES.find((x) => x.id === v)?.short ?? v;
  return `"${v}"`;
}

/** The 15-second strip: four steps, each a tab that opens its question. Fills as you answer. Not a timer. */
export function Strip({ c, open, setOpen, disabled }: { c: Choices; open: StepId | null; setOpen: (s: StepId) => void; disabled?: boolean }) {
  return (
    <div className="tg-strip" role="tablist" aria-label="The 15-second scan">
      {STEPS.map((s, i) => {
        const v = stepValue(s.id, c);
        return (
          <button key={s.id} type="button" role="tab" aria-selected={open === s.id} disabled={disabled}
            className={`tg-seg${open === s.id ? " open" : ""}${v ? " answered" : ""}`} onClick={() => setOpen(s.id)}>
            <span className="tg-seg-top"><span className="tg-seg-n">{i + 1}</span><span className="tg-seg-secs">{s.secs}</span></span>
            <span className="tg-seg-title">{s.title}</span>
            <span className="tg-seg-val">{v ?? "Not yet"}</span>
            <span className="tg-seg-fill" aria-hidden="true"><motion.span initial={false} animate={{ scaleX: v ? 1 : 0 }} transition={springs.smooth} /></span>
          </button>
        );
      })}
    </div>
  );
}

/** The open step: its question and the answer chips. */
const PHRASE_CAP = 10;

export function StepPanel({ step, c, onChoose, triggers, reduce }: { step: StepId; c: Choices; onChoose: (s: StepId, v: string) => void; triggers: string[]; reduce: boolean }) {
  const [more, setMore] = useState(false);
  useEffect(() => { setMore(false); }, [step]);
  const meta = STEPS.find((s) => s.id === step)!;
  const idx = STEPS.indexOf(meta);
  const opts: { id: string; label: string; sub?: string }[] =
    step === "budget" ? BUDGETS.map((b) => ({ id: b.id, label: b.label, sub: COST[b.rank] }))
    : step === "want" ? WANTS.map((w) => ({ id: w.id, label: w.label }))
    : step === "shape" ? SHAPES.map((s) => ({ id: s.id, label: s.label }))
    : triggers.filter((t, i) => more || i < PHRASE_CAP || t === c.trigger).map((t) => ({ id: t, label: `"${t}"` }));
  const hidden = step === "trigger" && !more ? triggers.length - opts.length : 0;
  const skipLabel = step === "budget" ? "Not given" : step === "trigger" ? "None of these" : "Not sure";
  return (
      <motion.div key={step} className="tg-panel" role="tabpanel" aria-label={meta.ask}
        initial={reduce ? { opacity: 0 } : { opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
        transition={reduce ? { duration: 0.12 } : { ...springs.smooth, opacity: { duration: 0.18 } }}>
        <div className="tg-panel-eyebrow">Step {idx + 1} of 4 · {meta.secs}</div>
        <div className="tg-panel-ask">{meta.ask}</div>
        <div className="tg-panel-hint">{meta.hint}</div>
        <div className={`tg-opts${step === "trigger" ? " phrases" : ""}`}>
          {opts.length === 0 && <div className="tg-empty">No pattern is left to match a phrase. Change an earlier step.</div>}
          {opts.map((o, i) => (
            <Button key={o.id} size="s" variant={c[step] === o.id ? "tinted" : "secondary"} className={`tg-opt${c[step] === o.id ? " on" : ""}`}
              aria-pressed={c[step] === o.id} onClick={() => onChoose(step, o.id)}>
              {i < 9 && <span className="tg-optkey" aria-hidden="true">{i + 1}</span>}
              <span className="tg-optlabel">{o.label}</span>{o.sub && <span className="tg-optsub">{o.sub}</span>}
            </Button>
          ))}
          {hidden > 0 && <Button size="s" variant="plain" onClick={() => setMore(true)}>{hidden} more phrases</Button>}
          <Button size="s" variant={c[step] === SKIP ? "tinted" : "ghost"} aria-pressed={c[step] === SKIP} onClick={() => onChoose(step, SKIP)}>{skipLabel}</Button>
        </div>
      </motion.div>
  );
}

export type PillMark = "winner" | "guess" | "key" | "wrong";

/** The candidate board. Alive patterns on top; ruled-out ones drop into the bottom group, dimmed, with the step that removed them. */
export function Candidates({ scored, counts, c, marks, focus, onTap, reduce, tapLabel }: {
  scored: Scored[]; counts: number[]; c: Choices; marks: Record<string, PillMark>; focus: string | null;
  onTap: (id: string) => void; reduce: boolean; tapLabel: string;
}) {
  const alive = scored.filter((s) => !s.out);
  const out = scored.filter((s) => s.out);
  const answered = STEPS.filter((s) => c[s.id]).length;
  const trail = counts.slice(0, answered + 1);
  const layout = reduce ? false : "position" as const;
  const focused = focus ? scored.find((s) => s.f.id === focus) : undefined;
  return (
    <div className="tg-cands">
      <div className="tg-cands-head">
        <div>
          <div className="tg-cands-title">Candidate patterns</div>
          <div className="tg-trail" aria-label={`Candidates after each step: ${trail.join(", ")}`}>
            {trail.map((n, i) => (
              <span key={i} className="tg-trail-item">{i > 0 && <Icon name="chevron-right" size={12} />}<span className={i === trail.length - 1 ? "now" : ""}>{n}</span></span>
            ))}
          </div>
        </div>
        <motion.div key={alive.length} className="tg-count" initial={reduce ? false : { scale: 1.18, opacity: 0.4 }} animate={{ scale: 1, opacity: 1 }} transition={springs.snappy} aria-live="polite">
          {alive.length}<span>left</span>
        </motion.div>
      </div>
      <LayoutGroup>
        <div className="tg-pills" role="list">
          {alive.length === 0 && <div className="tg-empty">Nothing fits. One answer is off: tap a step above to change it.</div>}
          {alive.map(({ f }) => (
            <motion.button key={f.id} layoutId={reduce ? undefined : f.id} layout={layout} type="button" role="listitem"
              className={`tg-pill${marks[f.id] ? ` m-${marks[f.id]}` : ""}${focus === f.id ? " focus" : ""}`}
              transition={springs.smooth} onClick={() => onTap(f.id)} aria-label={`${f.name}, ${f.costLabel}. ${tapLabel}`}>
              {marks[f.id] === "key" && <Icon name="check" size={14} />}
              <span className="tg-pill-name">{f.name}</span><span className="tg-pill-cost">{f.costLabel}</span>
            </motion.button>
          ))}
        </div>
        {out.length > 0 && (
          <>
            <div className="tg-out-title">Ruled out · {out.length}</div>
            <div className="tg-pills out" role="list">
              {out.map(({ f, out: o }) => (
                <motion.button key={f.id} layoutId={reduce ? undefined : f.id} layout={layout} type="button" role="listitem"
                  className={`tg-pill small${marks[f.id] ? ` m-${marks[f.id]}` : ""}${focus === f.id ? " focus" : ""}`}
                  transition={springs.smooth} onClick={() => onTap(f.id)} title={o!.reason} aria-label={`${f.name}: ruled out at step ${o!.step}. ${o!.reason}`}>
                  <span className="tg-pill-step" aria-hidden="true">{o!.step}</span>
                  <span className="tg-pill-name">{f.name}</span>
                </motion.button>
              ))}
            </div>
          </>
        )}
      </LayoutGroup>
      <AnimatePresence initial={false}>
        {focused && (
          <motion.div key={focused.f.id} className="tg-detail" initial={reduce ? { opacity: 0 } : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={reduce ? { duration: 0.12 } : springs.smooth}>
            <div className="tg-detail-head"><b>{focused.f.name}</b><span>{focused.f.costLabel} · Day {focused.f.day}</span></div>
            {focused.out && <div className="tg-detail-out">Ruled out at step {focused.out.step}: {focused.out.reason}</div>}
            <div className="tg-detail-trig">Trigger phrases: {focused.f.triggers.map((t) => `"${t}"`).join(" · ")}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** "Say it out loud" line, as in the book: budget, what it wants, shape, phrase → pattern + complexity. */
export function SayIt({ c, winners }: { c: Choices; winners: Family[] }): JSX.Element | null {
  if (!winners.length) return null;
  const parts: string[] = [];
  if (c.budget && c.budget !== SKIP) { const b = BUDGETS.find((x) => x.id === c.budget)!; parts.push(`${b.label}, so ${COST[b.rank]} or faster.`); }
  if (c.want && c.want !== SKIP) parts.push(`It wants ${WANTS.find((x) => x.id === c.want)!.short}.`);
  if (c.shape && c.shape !== SKIP) parts.push(`The input is ${SHAPES.find((x) => x.id === c.shape)!.label.toLowerCase()}.`);
  const names = winners.map((w) => `${w.name}, ${w.costLabel}`).join(" or ");
  return (
    <div className="tg-say" aria-live="polite">
      <div className="tg-say-label">Say it out loud</div>
      <p>{parts.join(" ")} {c.trigger && c.trigger !== SKIP ? <>"{c.trigger}" → </> : null}<b>{names}</b>.</p>
    </div>
  );
}

export const familyName = (id: string) => FAM[id]?.name ?? id;
