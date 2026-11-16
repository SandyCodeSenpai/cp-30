import { useMemo, useState, type ReactNode } from "react";
import { CodePanel, InputEditor, LabShell, Narration, Pic, PlayerBar, parseBig, randInt, usePlayer, type Run } from "../bits/kit/player";
import { POW_CODE } from "./code";
import { buildPow, fmtBig, MOD, type PowFrame } from "./engine";
import { PowView } from "./PowView";

const MAXB = 10n ** 18n;

export default function FastPow({ b0, tabs, onComplete }: { b0?: number; tabs?: ReactNode; onComplete?: () => void }) {
  const [a, setA] = useState(3n);
  const [b, setB] = useState(b0 !== undefined && b0 >= 0 ? BigInt(b0) : 13n);
  const frames = useMemo(() => buildPow(a, b, MOD, String(a)), [a, b]);
  const run: Run<PowFrame> = useMemo(() => ({ frames }), [frames]);
  const p = usePlayer(run, onComplete);
  const f = p.frame;

  const [at, setAt] = useState(String(a)), [bt, setBt] = useState(String(b));
  const [err, setErr] = useState<string | null>(null);
  const apply = () => {
    const av = parseBig(at, 0n, MAXB, "a"); if (typeof av === "string") { setErr(av); return; }
    const bv = parseBig(bt, 0n, MAXB, "b"); if (typeof bv === "string") { setErr(bv); return; }
    setErr(null); setA(av); setB(bv);
  };
  const set = (av: bigint, bv: bigint) => { setA(av); setB(bv); setAt(String(av)); setBt(String(bv)); setErr(null); };
  const stage = (
    <Pic label={`Fast power ${a}^${b} mod 10^9+7`}>
      <div className="nt-inner">
        <div className="nt-pair"><span className="p">{fmtBig(a)}<sup style={{ fontSize: "0.55em" }}>{fmtBig(b)}</sup></span><span className="l">mod 10^9+7</span></div>
        <PowView f={f} b0={b} base={String(a)} m={MOD} />
      </div>
    </Pic>
  );
  return (
    <LabShell label="Fast power, square and multiply" tabs={tabs} stage={stage} narration={<Narration p={p} />} bar={<PlayerBar p={p} />} onKeyDown={p.onKeyDown}
      code={<CodePanel title="power(a, b, mod)" lines={POW_CODE} active={f.line} note={<>Python's built-in pow(a, b, MOD) does exactly this. Python ints never overflow, but reducing after every multiply keeps each number small and fast.</>} />}
      below={<InputEditor
        fields={[{ id: "a", label: "a (0 to 10^18)", value: at, onChange: setAt, numeric: true, wide: true }, { id: "b", label: "b (0 to 10^18)", value: bt, onChange: setBt, numeric: true, wide: true }]}
        onApply={apply} error={err}
        onRandom={() => set(BigInt(randInt(2, 99)), BigInt(randInt(5, 200)))}
        presets={[
          { label: "3^13", run: () => set(3n, 13n) },
          { label: "2^10", run: () => set(2n, 10n) },
          { label: "2^100", run: () => set(2n, 100n) },
          { label: "5^(10^18)", run: () => set(5n, MAXB) },
        ]} />}
    />
  );
}
