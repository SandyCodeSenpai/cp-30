import { useMemo, useRef, useState, type ReactNode } from "react";
import { useWidth } from "@/lib/hooks";
import { CodePanel, InputEditor, LabShell, Narration, Pic, PlayerBar, parseNums, randInt, usePlayer, type Run } from "./kit/player";
import { BitGrid, cellSize, toBits, type GridRow } from "./grid";
import { PERBIT_CODE } from "./code";
import { buildPerBit, type PerBitFrame } from "./engine";

export default function PerBit({ tabs, onComplete }: { tabs?: ReactNode; onComplete?: () => void }) {
  const [a, setA] = useState([5, 9, 12, 7, 3]);
  const frames = useMemo(() => buildPerBit(a), [a]);
  const run: Run<PerBitFrame> = useMemo(() => ({ frames }), [frames]);
  const p = usePlayer(run, onComplete);
  const f = p.frame;
  const w = Math.max(1, Math.max(...a).toString(2).length);
  const ref = useRef<HTMLDivElement>(null);
  const full = useWidth(ref) || 600;
  const side = full >= 555;
  const avail = side ? Math.min(full * 0.5, 320) : full;
  const narrow = avail < 440;
  const labelW = narrow ? 44 : 56, valueW = 36;
  const cell = cellSize(avail, w, labelW, valueW + 10, 36, 20);
  const b = f.b;
  const rows: GridRow[] = a.map((v, i) => ({
    key: `a${i}`, label: `a[${i}]`, bits: toBits(v, w), tone: "mid" as const, value: v,
    mark: b >= 0 && (v >> b) & 1 ? [b] : undefined,
  }));
  const ones: (string | null)[] = Array.from({ length: w }, (_, bb) => (f.stats.find((s) => s.b === bb) || (f.phase === "count" && bb === b) ? String(a.filter((v) => (v >> bb) & 1).length) : null));
  rows.push({ key: "ones", label: "ones", bits: [], texts: ones, tone: "res", rule: true, value: "" });
  const n = a.length, pairs = (n * (n - 1)) / 2;

  const [txt, setTxt] = useState(a.join(", "));
  const [err, setErr] = useState<string | null>(null);
  const apply = () => { const v = parseNums(txt, { min: 0, max: 255, minLen: 2, maxLen: 8 }); if (typeof v === "string") { setErr(v); return; } setErr(null); setA(v); };
  const set = (v: number[]) => { setA(v); setTxt(v.join(", ")); setErr(null); };

  const stage = (
    <Pic label="Bit columns of the array">
      <div className="bt-pic-inner" ref={ref}>
        <div className="bt-pb">
        <BitGrid w={w} rows={rows} cell={cell} labelW={labelW} valueW={valueW} header={cell >= 30 && w <= 8 ? "both" : "index"} col={b >= 0 ? b : null} />
        <div className="bk-hscroll">
          <table className="bt-table" aria-label="Per-bit counts">
            <thead><tr><th>bit</th><th>ones</th><th>zeros</th><th>XOR pairs</th><th>worth</th><th>xor_s +=</th></tr></thead>
            <tbody>
              {Array.from({ length: w }, (_, bb) => {
                const s = f.stats.find((t) => t.b === bb);
                return (
                  <tr key={bb} className={bb === b ? "on" : s ? "" : "todo"}>
                    <td>{bb}</td><td>{s ? s.ones : "·"}</td><td>{s ? s.zeros : "·"}</td><td>{s ? `${s.ones}*${s.zeros} = ${s.xp}` : "·"}</td><td>{2 ** bb}</td><td>{s ? s.xp * 2 ** bb : "·"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        </div>
        <div className="bt-totals" aria-live="polite">
          <div className={`bt-total${f.phase === "done" ? " ok" : f.phase === "add" ? " on" : ""}`}><span>xor_s</span><b>{f.xs}</b></div>
          <div className={`bt-total${f.phase === "done" ? " ok" : ""}`}><span>and_s</span><b>{f.as}</b></div>
          <div className={`bt-total${f.phase === "done" ? " ok" : ""}`}><span>or_s</span><b>{f.os}</b></div>
          <div className="bt-total"><span>pairs</span><b>{pairs}</b></div>
        </div>
      </div>
    </Pic>
  );
  return (
    <LabShell label="Per-bit counting" tabs={tabs} stage={stage} narration={<Narration p={p} />} bar={<PlayerBar p={p} />} onKeyDown={p.onKeyDown}
      code={<CodePanel title="Sum of XOR, AND, OR over all pairs" lines={PERBIT_CODE} active={f.line}
        note={<>Per bit: XOR pairs = ones * zeros, AND pairs = C(ones, 2), OR pairs = C(n, 2) - C(zeros, 2). Here the loop stops at bit {w - 1}, the top bit of max(a).</>} />}
      below={<InputEditor fields={[{ id: "a", label: "a (2 to 8 values, 0 to 255)", value: txt, onChange: setTxt, wide: true }]} onApply={apply} error={err}
        onRandom={() => set(Array.from({ length: randInt(4, 6) }, () => randInt(1, 15)))}
        presets={[
          { label: "5, 9, 12, 7, 3", run: () => set([5, 9, 12, 7, 3]) },
          { label: "4, 14, 2 (LC 477)", run: () => set([4, 14, 2]) },
          { label: "1, 2, 3", run: () => set([1, 2, 3]) },
        ]} />}
    />
  );
}
