import { useCallback, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button, Icon, Segmented, Stage, Toggle } from "@/ui";
import { useReducedMotion, useWidth } from "@/lib/hooks";
import { ArrayView } from "./ArrayView";
import { CodePanel } from "./CodePanel";
import { InputPanel } from "./InputPanel";
import { PredictCard } from "./PredictCard";
import { SPEEDS, usePlayer, type Speed } from "./usePlayer";
import type { Frame, Kv, ModeSpec, RawInput, View } from "./types";
import "./kit.css";

function KvChip({ kv }: { kv: Kv }) {
  return <span className={`kit-kv t-${kv.tone ?? "neutral"}`}><span className="k">{kv.k}</span><span className="v">{kv.v}</span></span>;
}

function StateRow({ view }: { view: View }) {
  return (
    <div className="kit-state">
      {view.chips.length > 0 && <div className="kit-chips">{view.chips.map((c) => <KvChip key={c.k} kv={c} />)}</div>}
      {view.map && (
        <div className="kit-map">
          <span className="kit-map-title">{view.map.title}</span>
          {view.map.entries.length ? view.map.entries.map((e) => <KvChip key={e.k} kv={e} />) : <span className="kit-map-empty">{view.map.empty ?? "empty"}</span>}
        </div>
      )}
      {view.results && (
        <div className="kit-map">
          <span className="kit-map-title">{view.results.title}</span>
          {view.results.items.length
            ? view.results.items.map((t, i) => <span key={i} className="kit-kv t-good"><span className="v">{t}</span></span>)
            : <span className="kit-map-empty">{view.results.empty ?? "empty"}</span>}
        </div>
      )}
    </div>
  );
}

function Narration({ frame, idx, last }: { frame: Frame; idx: number; last: number }) {
  return (
    <div className={`kit-say t-${frame.tone ?? "neutral"}`} aria-live="polite">
      <span className="kit-say-n">Step {idx + 1} of {last + 1}</span>
      <p>{frame.say}</p>
    </div>
  );
}

const SPEED_OPTS: { value: Speed; label: string }[] = [{ value: "slow", label: "Slow" }, { value: "normal", label: "Normal" }, { value: "fast", label: "Fast" }];

export interface LabShellProps {
  modes: ModeSpec[];
  /** props.mode: when valid, lock to it and hide the tabs. */
  mode?: unknown;
  compact: boolean;
  onComplete?: () => void;
  /** Starting input per mode id (from props), falls back to the first preset. */
  initial: Record<string, RawInput | undefined>;
  /** Mode-specific options, shown above the input. */
  extra?: (modeId: string) => ReactNode;
  name: string;
}

/** Step-by-step algorithm player: tabs, picture, narration, transport, code, input. */
export function LabShell({ modes, mode, compact, onComplete, initial, extra, name }: LabShellProps) {
  const locked = typeof mode === "string" && modes.some((m) => m.id === mode);
  const [modeId, setModeId] = useState<string>(locked ? (mode as string) : modes[0].id);
  const spec = modes.find((m) => m.id === modeId) ?? modes[0];
  const fallback = (s: ModeSpec): RawInput => ({ main: s.presets[0].main, second: s.presets[0].second });
  const [raws, setRaws] = useState<Record<string, RawInput>>(() => {
    const r: Record<string, RawInput> = {};
    for (const m of modes) {
      const given = initial[m.id];
      r[m.id] = given && m.build(given).ok ? given : fallback(m);
    }
    return r;
  });
  const raw = raws[spec.id] ?? fallback(spec);
  const built = useMemo(() => { const b = spec.build(raw); return b.ok ? b : spec.build(fallback(spec)); }, [spec, raw]);
  const frames: Frame[] = useMemo(() => (built.ok ? built.frames : []), [built]);
  const allPointers = useMemo(() => frames.map((f) => f.view.pointers), [frames]);
  const note = built.ok ? built.note : undefined;

  const [predictOn, setPredictOn] = useState(false);
  const done = useRef(false);
  const onEnd = useCallback(() => { if (!done.current) { done.current = true; onComplete?.(); } }, [onComplete]);
  const P = usePlayer(frames, { predictOn, onEnd });
  const reduce = useReducedMotion();
  const [touched, setTouched] = useState(false);
  const [inputOpen, setInputOpen] = useState(!compact);

  const root = useRef<HTMLDivElement>(null);
  const width = useWidth(root);
  const wide = width >= 860;

  const act = (f: () => void) => () => { setTouched(true); f(); };
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const t = e.target as HTMLElement;
    if (t.closest("input, textarea, select, .kit-predict")) return;
    if (e.key === "ArrowRight") { e.preventDefault(); e.stopPropagation(); setTouched(true); P.step(); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); e.stopPropagation(); setTouched(true); P.back(); }
    else if (e.key === " " || e.key === "Spacebar") { e.preventDefault(); e.stopPropagation(); setTouched(true); P.toggle(); }
  };

  const frame = frames[P.idx];
  if (!frame) return null;
  const atEnd = P.idx >= P.last;

  return (
    <div className={`kit-root${compact ? " compact" : ""}`} ref={root} onKeyDown={onKey}>
      {!locked && modes.length > 1 && (
        <div className="kit-tabs">
          <Segmented value={modeId} options={modes.map((m) => ({ value: m.id, label: m.label }))} onChange={(v) => setModeId(v)} />
        </div>
      )}
      <p className="kit-blurb">{spec.blurb}</p>
      {extra?.(spec.id)}

      <div className={`kit-main${wide ? " wide" : ""}`}>
        <div className="kit-left">
          <Stage className="kit-stage">
            <div className="kit-stage-focus" tabIndex={0} aria-label={`${name}. Left and Right arrows step, Space plays and pauses.`}>
              <ArrayView view={frame.view} all={allPointers} reduce={reduce} label={`${name}: ${frame.say}`} />
              <StateRow view={frame.view} />
            </div>
          </Stage>

          <AnimatePresence mode="wait" initial={false}>
            {P.pending !== null && frames[P.pending]?.predict
              ? <PredictCard key={`p${P.pending}`} p={frames[P.pending].predict!} onDone={P.resolve} reduce={reduce} />
              : <motion.div key="say" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}><Narration frame={frame} idx={P.idx} last={P.last} /></motion.div>}
          </AnimatePresence>

          <div className="kit-transport" role="toolbar" aria-label="Player controls">
            <Button variant="secondary" size="s" onClick={act(P.back)} disabled={P.idx === 0 && P.pending === null} aria-label="Step back (Left arrow)">
              <Icon name="chevron-left" size={16} /><span className="kit-btn-text">Back</span>
            </Button>
            <Button variant="tinted" size="s" className={touched || reduce ? "" : "kit-pulse"} onClick={act(P.step)} disabled={atEnd || P.pending !== null} aria-label="Step (Right arrow)">
              <span className="kit-btn-text show">Step</span><Icon name="chevron-right" size={16} />
            </Button>
            <Button variant="secondary" size="s" onClick={act(P.toggle)} disabled={P.pending !== null} aria-label={P.playing ? "Pause (Space)" : "Play (Space)"}>
              <Icon name={P.playing ? "pause" : "play"} size={16} /><span className="kit-btn-text">{P.playing ? "Pause" : atEnd ? "Replay" : "Play"}</span>
            </Button>
            <Button variant="ghost" size="s" onClick={act(P.reset)} aria-label="Reset">
              <Icon name="reset" size={16} /><span className="kit-btn-text">Reset</span>
            </Button>
            <div className="kit-progress" aria-hidden="true"><span style={{ width: `${(P.idx / Math.max(1, P.last)) * 100}%` }} /></div>
            <div className="kit-speed" role="group" aria-label="Speed"><Segmented value={P.speed} options={SPEED_OPTS} onChange={(v) => P.setSpeed(v)} /></div>
          </div>
        </div>

        <CodePanel code={spec.code} active={frame.line} title={spec.label} maxHeight={wide ? undefined : compact ? 190 : 260} reduce={reduce} />
      </div>

      <div className="kit-input-wrap">
        <div className="kit-foot">
          <Button variant="plain" size="s" onClick={() => setInputOpen((o) => !o)} aria-expanded={inputOpen}>
            <Icon name={inputOpen ? "chevron-down" : "chevron-right"} size={16} />Edit input
          </Button>
          <Toggle label="Predict" hint="Ask before key moves" checked={predictOn} onChange={setPredictOn} />
        </div>
        {inputOpen && (
          <InputPanel spec={spec} raw={raw} note={note}
            onApply={(r) => { setRaws((all) => ({ ...all, [spec.id]: r })); setTouched(true); }} />
        )}
      </div>
    </div>
  );
}

export { SPEEDS };
