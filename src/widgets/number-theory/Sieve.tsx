import { useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { motion } from "framer-motion";
import { Segmented } from "@/ui";
import { useReducedMotion, useWidth } from "@/lib/hooks";
import { CodePanel, InputEditor, LabShell, Narration, Pic, PlayerBar, parseInt1, randInt, usePlayer, type Run } from "../bits/kit/player";
import { FACTOR_CODE, SIEVE_CODE, SPF_CODE } from "./code";
import { buildFactor, buildSieve, buildSpf, factStr, isqrt, spfTable, type FactorFrame, type SieveFrame, type SpfFrame } from "./engine";

type Phase = "sieve" | "spf" | "factor";
const PRIMES = [2, 3, 5, 7];
const pc = (p: number) => { const i = PRIMES.indexOf(p); return i >= 0 ? `nt-pc${i}` : ""; };

function useCell(n: number) {
  const ref = useRef<HTMLDivElement>(null);
  const avail = useWidth(ref) || 600;
  return { ref, avail, nc: (sideW: number) => Math.max(28, Math.min(50, Math.floor((avail - sideW - 36) / 10))), n };
}

function Legend({ n }: { n: number }) {
  const ps = PRIMES.filter((p) => p * p <= n);
  return (
    <div className="nt-legend" aria-label="Prime colours">
      {ps.map((p) => <span key={p} className={pc(p)}><i />{p}</span>)}
      <span style={{ color: "var(--muted)" }}>each prime's colour</span>
    </div>
  );
}

export default function Sieve({ n0, tabs, onComplete }: { n0?: number; tabs?: ReactNode; onComplete?: () => void }) {
  const [n, setN] = useState(Math.max(10, Math.min(120, n0 ?? 50)));
  const [phase, setPhase] = useState<Phase>("sieve");
  const [x, setX] = useState(Math.min(48, n));
  const sub = (
    <div className="nt-top">
      <Segmented<Phase> label="Part" value={phase} onChange={setPhase} options={[{ value: "sieve", label: "1. Sieve" }, { value: "spf", label: "2. SPF table" }, { value: "factor", label: "3. Factorize" }]} />
    </div>
  );
  const [nt, setNt] = useState(String(n)), [xt, setXt] = useState(String(x));
  const [err, setErr] = useState<string | null>(null);
  const apply = () => {
    const v = parseInt1(nt, 10, 120, "N"); if (typeof v === "string") { setErr(v); return; }
    const xv = parseInt1(xt, 2, v, "x"); if (typeof xv === "string") { setErr(xv); return; }
    setErr(null); setN(v); setX(xv);
  };
  const editor = (
    <InputEditor
      fields={[{ id: "n", label: "N (10 to 120)", value: nt, onChange: setNt, numeric: true }, ...(phase === "factor" ? [{ id: "x", label: `x to factorize (2 to N)`, value: xt, onChange: setXt, numeric: true }] : [])]}
      onApply={apply} error={err}
      onRandom={() => { const v = randInt(30, 120); const xv = randInt(2, v); setN(v); setX(xv); setNt(String(v)); setXt(String(xv)); setErr(null); }}
      presets={[
        { label: "N = 30", run: () => { setN(30); setX(Math.min(x, 30)); setNt("30"); } },
        { label: "N = 50", run: () => { setN(50); setX(Math.min(x, 50)); setNt("50"); } },
        { label: "N = 100", run: () => { setN(100); setNt("100"); } },
        ...(phase === "factor" ? [{ label: "x = 48", run: () => { setN(Math.max(n, 48)); setX(48); setXt("48"); } }, { label: "x = 97", run: () => { setN(Math.max(n, 97)); setX(97); setXt("97"); } }, { label: "x = 90", run: () => { setN(Math.max(n, 90)); setX(90); setXt("90"); } }] : []),
      ]}
    />
  );
  const common = { n, sub, tabs, editor, onComplete };
  if (phase === "sieve") return <SievePart key="s" {...common} />;
  if (phase === "spf") return <SpfPart key="p" {...common} />;
  return <FactorPart key="f" {...common} x={Math.min(x, n)} />;
}

interface PartProps { n: number; sub: ReactNode; tabs?: ReactNode; editor: ReactNode; onComplete?: () => void }

function SievePart({ n, sub, tabs, editor, onComplete }: PartProps) {
  const frames = useMemo(() => buildSieve(n), [n]);
  const run: Run<SieveFrame> = useMemo(() => ({ frames }), [frames]);
  const p = usePlayer(run, onComplete);
  const f = p.frame;
  const reduce = useReducedMotion();
  const c = useCell(n);
  const nc = c.nc(0);
  const r = isqrt(n);
  const primesSoFar = f.done ? f.crossedBy.filter((cb, k) => k >= 2 && cb.length === 0).length : null;
  const stage = (
    <Pic label={`Sieve of Eratosthenes on 0 to ${n}`}>
      <div className="nt-inner" ref={c.ref}>
        <Legend n={n} />
        <div className="nt-grid" style={{ "--nc": `${nc}px` } as CSSProperties} role="img" aria-label={`Numbers 0 to ${n}. ${f.done ? `${primesSoFar} primes remain.` : ""}`}>
          {Array.from({ length: n + 1 }, (_, k) => {
            const cb = f.crossedBy[k];
            const zeroed = k < 2 && p.cur >= 1;
            const crossed = cb.length > 0;
            const isActive = f.i === k;
            const processedPrime = k >= 2 && k <= r && !crossed && f.i !== null && k <= f.i && PRIMES.includes(k);
            const donePrime = f.done && k >= 2 && !crossed;
            const fresh = f.fresh.indexOf(k);
            const cls = `nt-cell ${crossed ? `crossed ${pc(cb[0])}` : ""}${zeroed ? " zero" : ""}${processedPrime || (f.done && k <= r && !crossed && k >= 2) ? ` prime-on ${pc(k)}` : donePrime ? " prime-done" : ""}${isActive ? " cur" : ""}`;
            return (
              <motion.div key={`${k}-${crossed ? cb[0] : 0}`} className={cls}
                initial={fresh >= 0 && !reduce ? { scale: 0.6, opacity: 0.3 } : false} animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 420, damping: 24, delay: fresh >= 0 && !reduce ? Math.min(fresh * 0.035, 0.6) : 0 }}>
                <span className="nt-num">{k}</span>
                {cb.length > 0 && <span className="nt-dots" aria-hidden="true">{cb.map((q) => <b key={q} className={pc(q)} />)}</span>}
              </motion.div>
            );
          })}
        </div>
        <div className="bk-chips">
          <span className="bk-var">isqrt({n}) = <b>{r}</b></span>
          {f.i !== null && <span className="bk-var acc">i = <b>{f.i}</b></span>}
          {f.done && <span className="bk-var good">primes ≤ {n}: <b>{primesSoFar}</b></span>}
        </div>
      </div>
    </Pic>
  );
  return (
    <LabShell label="Sieve of Eratosthenes" tabs={tabs} sub={sub} stage={stage} narration={<Narration p={p} />} bar={<PlayerBar p={p} />} onKeyDown={p.onKeyDown}
      code={<CodePanel title="sieve(n), from math import isqrt" lines={SIEVE_CODE} active={f.line} note={<>Dots under a number show every prime that crossed it. O(n log log n).</>} />}
      below={editor} />
  );
}

function SpfPart({ n, sub, tabs, editor, onComplete }: PartProps) {
  const frames = useMemo(() => buildSpf(n), [n]);
  const run: Run<SpfFrame> = useMemo(() => ({ frames }), [frames]);
  const p = usePlayer(run, onComplete);
  const f = p.frame;
  const reduce = useReducedMotion();
  const c = useCell(n);
  const nc = c.nc(0);
  const stage = (
    <Pic label={`Smallest prime factor table for 0 to ${n}`}>
      <div className="nt-inner" ref={c.ref}>
        <Legend n={n} />
        <div className="nt-grid" style={{ "--nc": `${nc}px` } as CSSProperties} role="img" aria-label="Each number with its smallest prime factor">
          {Array.from({ length: n + 1 }, (_, k) => {
            const s = f.spf[k];
            const self = s === k;
            const fresh = f.fresh.indexOf(k);
            const cls = `nt-cell withspf${nc < 40 ? " tiny" : ""} ${self ? "spf-self" : `spf-set ${pc(s)}`}${k < 2 ? " zero" : ""}${f.i === k ? " cur" : ""}${f.kept.includes(k) ? " kept" : ""}`;
            return (
              <motion.div key={`${k}-${s}`} className={cls} initial={fresh >= 0 && !reduce ? { scale: 0.6 } : false} animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 420, damping: 24, delay: fresh >= 0 && !reduce ? Math.min(fresh * 0.035, 0.6) : 0 }}>
                <span className="nt-num">{k}</span>
                {k >= 2 && <span className="nt-spf">{s}</span>}
              </motion.div>
            );
          })}
        </div>
        <div className="bk-chips">
          <span className="bk-var">small number = spf[x]</span>
          {f.i !== null && <span className="bk-var acc">i = <b>{f.i}</b></span>}
        </div>
      </div>
    </Pic>
  );
  return (
    <LabShell label="Smallest prime factor sieve" tabs={tabs} sub={sub} stage={stage} narration={<Narration p={p} />} bar={<PlayerBar p={p} />} onKeyDown={p.onKeyDown}
      code={<CodePanel title="spf_sieve(n)" lines={SPF_CODE} active={f.line} note={<>Same loop as the sieve, but it records which prime got there first.</>} />}
      below={editor} />
  );
}

function FactorPart({ n, x, sub, tabs, editor, onComplete }: PartProps & { x: number }) {
  const spf = useMemo(() => spfTable(n), [n]);
  const frames = useMemo(() => buildFactor(x, spf), [x, spf]);
  const run: Run<FactorFrame> = useMemo(() => ({ frames }), [frames]);
  const p = usePlayer(run, onComplete);
  const f = p.frame;
  const c = useCell(n);
  const side = c.avail >= 520;
  const nc = c.nc(side ? 150 : 0);
  const visited = new Set(f.ladder.map((l) => l.x));
  const stage = (
    <Pic label={`Factorize ${x} with the SPF table`}>
      <div className="nt-inner" ref={c.ref}>
        <div className={`nt-split${side ? " side" : ""}`}>
          <div className="nt-grid" style={{ "--nc": `${nc}px` } as CSSProperties} role="img" aria-label={`SPF table. Current x = ${f.x}.`}>
            {Array.from({ length: n + 1 }, (_, k) => {
              const s = spf[k];
              const cls = `nt-cell withspf${nc < 40 ? " tiny" : ""} ${s === k ? "spf-self" : `spf-set ${pc(s)}`}${k < 2 ? " zero" : ""}${k === f.x && f.x > 1 ? " onx" : ""}${visited.has(k) && k !== f.x ? " visited" : ""}`;
              return <div key={k} className={cls}><span className="nt-num">{k}</span>{k >= 2 && <span className="nt-spf">{s}</span>}</div>;
            })}
          </div>
          <div className="nt-inner" style={{ gap: 8 }}>
            <span className="bk-cap">Repeated division</span>
            <div className="nt-ladder" aria-label="Division ladder">
              {f.ladder.map((l, i) => (
                <motion.div key={i} className={`nt-lrow ${pc(l.p)}`} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}>
                  <span className="lx">{l.x}</span><span className="lp">{l.p}</span>
                </motion.div>
              ))}
              <div className={`nt-lrow${f.x === 1 ? " end" : " cur"}`}><span className="lx">{f.x}</span><span className="lp" /></div>
            </div>
            <span className="nt-dict">f = {"{"}{f.f.map(([q, e]) => `${q}: ${e}`).join(", ")}{"}"}</span>
            {f.done && <span className="bk-var good">{x} = <b>{factStr(f.f)}</b></span>}
          </div>
        </div>
      </div>
    </Pic>
  );
  return (
    <LabShell label="Factorize with the SPF table" tabs={tabs} sub={sub} stage={stage} narration={<Narration p={p} />} bar={<PlayerBar p={p} />} onKeyDown={p.onKeyDown}
      code={<CodePanel title="factorize(x, spf)" lines={FACTOR_CODE} active={f.line} note={<>Number of divisors = product of (e + 1) over f: {f.done ? f.f.map(([, e]) => `(${e}+1)`).join(" * ") + " = " + f.f.reduce((a, [, e]) => a * (e + 1), 1) : "..."}</>} />}
      below={editor} />
  );
}
