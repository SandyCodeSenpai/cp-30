import { useMemo, useState, type ReactNode } from "react";
import { Segmented } from "@/ui";
import { CodePanel, InputEditor, LabShell, Narration, Pic, PlayerBar, parseBig, parseInt1, randInt, usePlayer, type Run } from "../bits/kit/player";
import { INV_CODE, IL, NCR_CODE } from "./code";
import { buildNcr, buildPow, fmtBig, MOD, modName, type NcrFrame, type PowFrame } from "./engine";
import { PowView } from "./PowView";

type Part = "inverse" | "ncr";

export default function ModInverse({ n0, tabs, onComplete }: { n0?: number; tabs?: ReactNode; onComplete?: () => void }) {
  const [part, setPart] = useState<Part>("inverse");
  const sub = <div className="nt-top"><Segmented<Part> label="Part" value={part} onChange={setPart} options={[{ value: "inverse", label: "Inverse (Fermat)" }, { value: "ncr", label: "nCr tables" }]} /></div>;
  return part === "inverse" ? <Inverse sub={sub} tabs={tabs} onComplete={onComplete} /> : <Ncr n0={n0} sub={sub} tabs={tabs} onComplete={onComplete} />;
}

type P = "7" | "11" | "13" | "big";
const PV: Record<P, bigint> = { "7": 7n, "11": 11n, "13": 13n, big: MOD };
interface InvFrame extends PowFrame { check?: boolean }

function Inverse({ sub, tabs, onComplete }: { sub: ReactNode; tabs?: ReactNode; onComplete?: () => void }) {
  const [pk, setPk] = useState<P>("13");
  const [a, setA] = useState(5n);
  const m = PV[pk];
  const bad = a % m === 0n;
  const frames = useMemo<InvFrame[]>(() => {
    if (bad) return [{ line: IL.call + 1, say: `${a} is a multiple of ${modName(m)}, so it has no inverse: a * x % p is always 0. pow(a, -1, p) raises ValueError here.`, k: -1, a: 0n, res: 0n, b: 0n, rows: [], phase: "done" }];
    const pw: InvFrame[] = buildPow(a, m - 2n, m, "a");
    const inv = pw[pw.length - 1].res;
    pw[0].say = `Fermat: p = ${modName(m)} is prime, so a^(p-1) = 1 and a^(p-2) is 1/a. Compute ${a}^(${modName(m)} - 2) with fast power. ` + pw[0].say;
    pw.push({ ...pw[pw.length - 1], line: IL.call, check: true, say: `inv = ${fmtBig(inv)}. Check: ${a} * ${fmtBig(inv)} = ${fmtBig(a * inv)}, and % ${modName(m)} = ${fmtBig((a * inv) % m)}. So dividing by ${a} is multiplying by ${fmtBig(inv)}.` });
    return pw;
  }, [a, m, bad]);
  const run: Run<InvFrame> = useMemo(() => ({ frames }), [frames]);
  const p = usePlayer(run, onComplete);
  const f = p.frame;
  const small = m < 20n;

  const [at, setAt] = useState(String(a));
  const [err, setErr] = useState<string | null>(null);
  const apply = () => { const v = parseBig(at, 1n, 10n ** 18n, "a"); if (typeof v === "string") { setErr(v); return; } setErr(null); setA(v); };
  const stage = (
    <Pic label={`Inverse of ${a} mod ${modName(m)}`}>
      <div className="nt-inner">
        <div className="nt-pair"><span className="p">{fmtBig(a)}<sup style={{ fontSize: "0.5em" }}>−1</sup></span><span className="l">mod {modName(m)} = {fmtBig(a)}^({modName(m)} − 2)</span></div>
        {small && !bad && (
          <div className="nt-inner" style={{ gap: 6 }}>
            <span className="bk-cap">{String(a % m)} * x % {String(m)} for every x: exactly one x gives 1</span>
            <div className="nt-times" aria-label="Multiplication row">
              {Array.from({ length: Number(m) - 1 }, (_, i) => {
                const x = BigInt(i + 1), v = (a * x) % m;
                return <div key={i} className={`nt-t${f.check && v === 1n ? " hit" : ""}`}><small>x={i + 1}</small><b>{String(v)}</b></div>;
              })}
            </div>
          </div>
        )}
        {!bad && <PowView f={f} b0={m - 2n} base="a" m={m} />}
        {f.check && <span className="bk-var good">inv = <b>{fmtBig(f.res)}</b>, and {fmtBig(a)} * inv % {modName(m)} = <b>1</b></span>}
      </div>
    </Pic>
  );
  return (
    <LabShell label="Modular inverse with Fermat" tabs={tabs} sub={<>{sub}<div className="nt-top" style={{ marginTop: 10 }}><Segmented<P> label="Prime p" value={pk} onChange={setPk} options={[{ value: "7", label: "7" }, { value: "11", label: "11" }, { value: "13", label: "13" }, { value: "big", label: "10^9+7" }]} /></div></>}
      stage={stage} narration={<Narration p={p} />} bar={<PlayerBar p={p} />} onKeyDown={p.onKeyDown}
      code={<CodePanel title="Inverse = power(a, MOD - 2)" lines={INV_CODE} active={f.line} note={<>Small primes make the picture readable. The same code runs with MOD = 10^9+7: 30 bits, so 30 squarings.</>} />}
      below={<InputEditor fields={[{ id: "a", label: "a (1 to 10^18)", value: at, onChange: setAt, numeric: true, wide: true }]} onApply={apply} error={err}
        onRandom={() => { const v = BigInt(randInt(2, 12)); setA(v); setAt(String(v)); setErr(null); }}
        presets={[
          { label: "5 mod 13", run: () => { setA(5n); setAt("5"); setPk("13"); } },
          { label: "3 mod 7", run: () => { setA(3n); setAt("3"); setPk("7"); } },
          { label: "2 mod 10^9+7", run: () => { setA(2n); setAt("2"); setPk("big"); } },
          { label: "14 mod 7", run: () => { setA(14n); setAt("14"); setPk("7"); } },
        ]} />}
    />
  );
}

function Ncr({ n0, sub, tabs, onComplete }: { n0?: number; sub: ReactNode; tabs?: ReactNode; onComplete?: () => void }) {
  const [n, setN] = useState(Math.max(2, Math.min(20, n0 ?? 6)));
  const [r, setR] = useState(Math.min(2, n));
  const frames = useMemo(() => buildNcr(n, r), [n, r]);
  const run: Run<NcrFrame> = useMemo(() => ({ frames }), [frames]);
  const p = usePlayer(run, onComplete);
  const f = p.frame;
  const [nt, setNt] = useState(String(n)), [rt, setRt] = useState(String(r));
  const [err, setErr] = useState<string | null>(null);
  const apply = () => {
    const nv = parseInt1(nt, 2, 20, "n"); if (typeof nv === "string") { setErr(nv); return; }
    const rv = parseInt1(rt, 0, nv, "r"); if (typeof rv === "string") { setErr(rv); return; }
    setErr(null); setN(nv); setR(rv);
  };
  const tag = (i: number) => (!f.query ? "" : [i === n ? "n" : "", i === r ? "r" : "", i === n - r ? "n-r" : ""].filter(Boolean).join(", "));
  const stage = (
    <Pic label={`Factorial tables for nCr(${n}, ${r})`}>
      <div className="nt-inner">
        <div className="nt-pair"><span className="p">C({n}, {r})</span><span className="l">mod 10^9+7, here N = {n}</span></div>
        <div className="nt-tablewrap" style={{ maxHeight: 360 }}>
          <table className="nt-table" aria-label="fact and inv_fact">
            <thead><tr><th>i</th><th>fact[i]</th><th>inv_fact[i]</th>{f.query && <th>used as</th>}</tr></thead>
            <tbody>
              {Array.from({ length: n + 1 }, (_, i) => {
                const on = f.i === i;
                const t = tag(i);
                return (
                  <tr key={i} className={on ? "on" : t ? "hit" : ""}>
                    <td>{i}</td>
                    <td className={f.query && i === n ? "use" : ""}>{f.fact[i] !== null ? fmtBig(f.fact[i]!) : "·"}</td>
                    <td className={f.query && (i === r || i === n - r) ? "use" : ""}>{f.inv[i] !== null ? fmtBig(f.inv[i]!) : "·"}</td>
                    {f.query && <td className="tag">{t}</td>}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {f.query && f.ans !== undefined && <span className="bk-var good">nCr({n}, {r}) = <b>{fmtBig(f.ans)}</b></span>}
      </div>
    </Pic>
  );
  return (
    <LabShell label="nCr with factorial tables" tabs={tabs} sub={sub} stage={stage} narration={<Narration p={p} />} bar={<PlayerBar p={p} />} onKeyDown={p.onKeyDown}
      code={<CodePanel title="fact, inv_fact and nCr" lines={NCR_CODE} active={f.line} note={<>O(N) once, then O(1) per query. inv_fact runs downward, so only one pow call is needed.</>} />}
      below={<InputEditor fields={[{ id: "n", label: "n (2 to 20)", value: nt, onChange: setNt, numeric: true }, { id: "r", label: "r (0 to n)", value: rt, onChange: setRt, numeric: true }]} onApply={apply} error={err}
        onRandom={() => { const nv = randInt(4, 16), rv = randInt(1, nv - 1); setN(nv); setR(rv); setNt(String(nv)); setRt(String(rv)); setErr(null); }}
        presets={[
          { label: "C(6, 2)", run: () => { setN(6); setR(2); setNt("6"); setRt("2"); } },
          { label: "C(10, 5)", run: () => { setN(10); setR(5); setNt("10"); setRt("5"); } },
          { label: "C(20, 10)", run: () => { setN(20); setR(10); setNt("20"); setRt("10"); } },
        ]} />}
    />
  );
}
