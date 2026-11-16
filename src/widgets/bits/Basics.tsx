import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Icon, Segmented, Slider, Toggle } from "@/ui";
import { useWidth } from "@/lib/hooks";
import { CodePanel, InputEditor, LabShell, Narration, Pic, PlayerBar, parseInt1, randInt, usePlayer, type Run } from "./kit/player";
import { BitGrid, binStr, cellSize, toBits, type GridRow } from "./grid";
import { BASICS_CODE, BL } from "./code";
import { buildBasics, OPS, usesK, usesY, type BasicsFrame, type Op } from "./engine";

const fit = (v: number, w: number, signed: boolean) => {
  const u = ((v % 2 ** w) + 2 ** w) % 2 ** w;
  return signed && u >= 2 ** (w - 1) ? u - 2 ** w : u;
};

export default function Basics({ x0, tabs, onComplete }: { x0?: number; tabs?: ReactNode; onComplete?: () => void }) {
  const [w, setW] = useState<8 | 12 | 16>(x0 !== undefined && Math.abs(x0) > 255 ? 16 : 8);
  const [signed, setSigned] = useState(x0 !== undefined && x0 < 0);
  const [x, setX] = useState(x0 !== undefined ? fit(x0, 16, x0 < 0) : 12);
  const [y, setY] = useState(10);
  const [k, setK] = useState(2);
  const [op, setOp] = useState<Op>("and");
  const [flash, setFlash] = useState<{ line: number; say: string } | null>(null);
  const atEnd = useRef(false);

  const built = useMemo(() => buildBasics(op, x, y, k, w), [op, x, y, k, w]);
  const run: Run<BasicsFrame> = useMemo(() => ({ frames: built.frames, start: atEnd.current ? built.frames.length - 1 : 0 }), [built]);
  const p = usePlayer(run, onComplete);
  useEffect(() => { atEnd.current = false; }, [run]);
  useEffect(() => { setFlash(null); }, [p.cur]);

  const boxRef = useRef<HTMLDivElement>(null);
  const avail = useWidth(boxRef) || 600;
  const narrow = avail < 440;
  const labelW = narrow ? 44 : 60, valueW = w === 16 ? 56 : 44;
  const cell = cellSize(avail, w, labelW, valueW + 8, 38, 14);

  const setWidth = (nw: 8 | 12 | 16) => { setW(nw); setX((v) => fit(v, nw, signed)); setY((v) => fit(v, nw, signed)); setK((v) => Math.min(v, nw - 1)); };
  const setSign = (s: boolean) => { setSigned(s); setX((v) => fit(v, w, s)); setY((v) => fit(v, w, s)); };
  const flip = (who: "x" | "y", b: number) => {
    const old = who === "x" ? x : y;
    const nv = fit(old ^ (1 << b), w, signed);
    atEnd.current = true;
    if (who === "x") setX(nv); else setY(nv);
    const turned = toBits(old, w)[b] ? "off" : "on";
    setFlash({ line: BL.flip, say: `You turned bit ${b} ${turned}: \`${who} ^= 1 << ${b}\`. ${who} = ${old} becomes ${nv}${b === w - 1 && signed ? ` (the top bit is the sign, worth -${2 ** (w - 1)})` : ` (${turned === "on" ? "+" : "-"}${2 ** b})`}.` });
  };

  const f = p.frame;
  const rows: GridRow[] = built.rows.map((r, i) => ({
    key: r.key, label: r.label, bits: toBits(r.v, w), reveal: f.reveal[i], tone: r.tone, rule: r.tone === "res",
    value: f.reveal[i] > 0 || r.tone === "in" ? (f.reveal[i] >= w || r.tone === "in" ? r.v : "…") : "",
    onToggle: r.key === "x" ? (b: number) => flip("x", b) : r.key === "y" ? (b: number) => flip("y", b) : undefined,
    ariaName: r.name, over: f.overRow === i ? f.over : undefined,
  }));

  // input editor
  const [ex, setEx] = useState(String(x)), [ey, setEy] = useState(String(y)), [ek, setEk] = useState(String(k));
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => { setEx(String(x)); setEy(String(y)); setEk(String(k)); }, [x, y, k]);
  const lo = signed ? -(2 ** (w - 1)) : 0, hi = signed ? 2 ** (w - 1) - 1 : 2 ** w - 1;
  const apply = () => {
    const a = parseInt1(ex, lo, hi, "x"); if (typeof a === "string") { setErr(`${a}${!signed && ex.trim().startsWith("-") ? " Turn on Signed for negatives." : ""}`); return; }
    const b = parseInt1(ey, lo, hi, "y"); if (typeof b === "string") { setErr(b); return; }
    const c = parseInt1(ek, 0, w - 1, "k"); if (typeof c === "string") { setErr(c); return; }
    setErr(null); setX(a); setY(b); setK(c);
  };
  const preset = (o: Op, a: number, b = y, kk = k) => { setOp(o); setX(fit(a, w, signed)); setY(fit(b, w, signed)); setK(kk); setErr(null); };

  const xs = x < 0 ? `-0b${(-x).toString(2)}` : `0b${x.toString(2)}`;
  const pc = Math.abs(x).toString(2).split("").filter((c) => c === "1").length;
  const stage = (
    <Pic label="Binary rows">
      <div className="bt-pic-inner" ref={boxRef}>
        <BitGrid w={w} rows={rows} cell={cell} labelW={labelW} valueW={valueW} col={f.col} src={f.src} header={cell >= 30 && w <= 8 ? "both" : "index"} signed={signed} />
        {usesK(op) && <div className="bt-k"><Slider label="Shift k" value={k} min={0} max={w - 1} onChange={(v) => setK(v)} /></div>}
        {built.overflow && f.reveal[1] >= w && <div className="bt-warn">Python keeps every bit: {x} &lt;&lt; {k} = {built.result}. Only the low {w} bits fit here.</div>}
        <div className="bt-read" aria-label="Live values of x">
          <span className="bk-var">x = <b>{x}</b></span>
          <span className="bk-var">bin(x) = <b>'{xs}'</b></span>
          <span className="bk-var">x.bit_count() = <b>{pc}</b></span>
          <span className="bk-var">x.bit_length() = <b>{Math.abs(x).toString(2).length - (x === 0 ? 1 : 0)}</b></span>
          <span className={`bk-var${x > 0 && (x & (x - 1)) === 0 ? " good" : ""}`}>is_pow2 = <b>{x > 0 && (x & (x - 1)) === 0 ? "True" : "False"}</b></span>
        </div>
        <div className="bt-hint"><Icon name="info" size={16} />Click any bit of {usesY(op) ? "x or y" : "x"} to flip it.{signed ? ` Signed: the top bit is worth -${2 ** (w - 1)}.` : ""}</div>
      </div>
    </Pic>
  );

  return (
    <LabShell
      label="Bit basics"
      tabs={tabs}
      sub={
        <div className="bt-top">
          <div className="bt-ops"><Segmented<Op> label="Operation" value={op} onChange={(o) => setOp(o)} options={OPS.map((o) => ({ value: o.value, label: o.label }))} /></div>
          <Segmented<8 | 12 | 16> label="Width" value={w} onChange={setWidth} options={[{ value: 8, label: "8" }, { value: 12, label: "12" }, { value: 16, label: "16" }]} />
          <Toggle label="Signed" checked={signed} onChange={setSign} />
        </div>
      }
      stage={stage}
      narration={<Narration p={p} override={flash?.say} />}
      bar={<PlayerBar p={p} />}
      onKeyDown={p.onKeyDown}
      code={<CodePanel title={`Bit operations: ${OPS.find((o) => o.value === op)?.label}`} lines={BASICS_CODE} active={flash?.line ?? f.line}
        note={<>x = {binStr(x, w)}{usesY(op) ? <>, y = {binStr(y, w)}</> : null}{usesK(op) ? <>, k = {k}</> : null}</>} />}
      below={
        <InputEditor
          fields={[
            { id: "x", label: "x", value: ex, onChange: setEx, numeric: true },
            ...(usesY(op) ? [{ id: "y", label: "y", value: ey, onChange: setEy, numeric: true }] : []),
            ...(usesK(op) ? [{ id: "k", label: "k", value: ek, onChange: setEk, numeric: true }] : []),
          ]}
          onApply={apply} error={err}
          note={`Whole numbers from ${lo} to ${hi} at ${w} bits.`}
          onRandom={() => { setX(fit(randInt(1, 2 ** w - 1), w, signed)); setY(fit(randInt(1, 2 ** w - 1), w, signed)); setErr(null); }}
          presets={[
            { label: "12 & 10", run: () => preset("and", 12, 10) },
            { label: "5 ^ 3", run: () => preset("xor", 5, 3) },
            { label: "12 & -12", run: () => preset("lowbit", 12) },
            { label: "40 & 39", run: () => preset("clearlow", 40) },
            { label: "-5", run: () => preset("neg", 5) },
            { label: "13 >> 2", run: () => preset("shr", 13, y, 2) },
          ]}
        />
      }
    />
  );
}
