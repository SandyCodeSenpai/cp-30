import { useEffect, useId, useState } from "react";
import { Button, Icon } from "@/ui";
import type { ModeSpec, RawInput } from "./types";

/** Edit input: a validated text field (and an optional second number), presets and Random. */
export function InputPanel({ spec, raw, note, onApply }: { spec: ModeSpec; raw: RawInput; note?: string; onApply: (r: RawInput) => void }) {
  const [main, setMain] = useState(raw.main);
  const [second, setSecond] = useState(raw.second ?? "");
  const [err, setErr] = useState<string | null>(null);
  const id = useId();
  useEffect(() => { setMain(raw.main); setSecond(raw.second ?? ""); setErr(null); }, [raw, spec.id]);

  const apply = (r: RawInput) => {
    const b = spec.build(r);
    if (!b.ok) { setErr(b.error); return; }
    setErr(null); onApply(r);
  };
  const submit = () => apply({ main, second: spec.secondLabel ? second : undefined });

  return (
    <div className="kit-input">
      <form className="kit-input-row" onSubmit={(e) => { e.preventDefault(); submit(); }}>
        <label className="kit-field grow" htmlFor={`${id}-m`}>
          <span>{spec.mainLabel}</span>
          <input id={`${id}-m`} value={main} onChange={(e) => setMain(e.target.value)} spellCheck={false} autoComplete="off"
            aria-invalid={!!err} aria-describedby={`${id}-h`} />
        </label>
        {spec.secondLabel && (
          <label className="kit-field small" htmlFor={`${id}-s`}>
            <span>{spec.secondLabel}</span>
            <input id={`${id}-s`} value={second} onChange={(e) => setSecond(e.target.value)} inputMode="numeric" autoComplete="off" aria-invalid={!!err} />
          </label>
        )}
        <Button type="submit" variant="secondary" size="m" className="kit-apply">Apply</Button>
      </form>
      <div id={`${id}-h`} className={`kit-input-msg${err ? " err" : ""}`} aria-live="polite">{err ?? note ?? spec.mainHint}</div>
      <div className="kit-presets">
        <span className="kit-presets-label">Presets</span>
        {spec.presets.map((p) => (
          <Button key={p.name} variant="secondary" size="s" onClick={() => apply({ main: p.main, second: p.second })}>{p.name}</Button>
        ))}
        <Button variant="ghost" size="s" onClick={() => apply(spec.random())}><Icon name="sparkle" size={16} />Random</Button>
      </div>
    </div>
  );
}
