import { useMemo, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Icon, Segmented } from "@/ui";
import { useReducedMotion, useWidth } from "@/lib/hooks";
import { CodePanel, InputEditor, LabShell, Narration, Pic, PlayerBar, parseInt1, randInt, usePlayer, type Run } from "./kit/player";
import { BitGrid, binStr, cellSize, toBits, type GridRow } from "./grid";
import { SUBSETS_CODE } from "./code";
import { buildSubsets, setStr, type SubFrame } from "./engine";

export default function Subsets({ x0, tabs, onComplete }: { x0?: number; tabs?: ReactNode; onComplete?: () => void }) {
  const start = x0 !== undefined && x0 > 0 ? x0 & 63 : 0b1101;
  const [n, setN] = useState<4 | 5 | 6>(Math.max(4, start.toString(2).length) as 4 | 5 | 6);
  const [mask, setMask] = useState(start);
  const frames = useMemo(() => buildSubsets(mask, n), [mask, n]);
  const run: Run<SubFrame> = useMemo(() => ({ frames }), [frames]);
  const p = usePlayer(run, onComplete);
  const f = p.frame;
  const reduce = useReducedMotion();

  const boxRef = useRef<HTMLDivElement>(null);
  const avail = useWidth(boxRef) || 600;
  const narrow = avail < 440;
  const labelW = narrow ? 58 : 72, valueW = narrow ? 40 : 150;
  const sv = (m: number) => (narrow ? String(m) : setStr(m, n));
  const cell = cellSize(avail, n, labelW, valueW + 10, 40, 24, false);
  const outside = Array.from({ length: n }, (_, i) => i).filter((i) => !((mask >> i) & 1));

  const rows: GridRow[] = [
    { key: "mask", label: "mask", bits: toBits(mask, n), tone: "in", value: sv(mask), onToggle: (b) => setMask(mask ^ (1 << b)), ariaName: "mask" },
  ];
  if (f.calc) {
    rows.push(
      { key: "sub", label: "sub", bits: toBits(f.calc.sub, n), tone: "mid", value: sv(f.calc.sub), rule: true },
      { key: "m1", label: "sub - 1", bits: toBits(f.calc.minus, n), tone: "mid", value: String(f.calc.minus), mark: outside.filter((i) => (f.calc!.minus >> i) & 1) },
      { key: "am", label: "& mask", bits: toBits(mask, n), tone: "mid", value: String(mask), fade: outside },
      { key: "nx", label: "next", bits: toBits(f.calc.next, n), tone: "res", value: f.calc.next ? sv(f.calc.next) : (narrow ? "0" : "0: stop"), rule: true },
    );
  } else {
    rows.push({ key: "sub", label: "sub", bits: toBits(f.sub, n), tone: "res", value: f.sub ? sv(f.sub) : (narrow ? "0" : "0: stop"), rule: true, fade: outside });
  }
  const total = 2 ** toBits(mask, n).filter(Boolean).length - 1;

  const [txt, setTxt] = useState(String(mask));
  const [err, setErr] = useState<string | null>(null);
  const apply = () => {
    const t = txt.trim();
    const v = /^0b[01]+$/.test(t) ? parseInt(t.slice(2), 2) : parseInt1(t, 1, 63, "mask");
    if (typeof v === "string" || v < 1 || v > 63) { setErr(typeof v === "string" ? v : "mask must be between 1 and 63 (6 items)."); return; }
    setErr(null); setMask(v); setN(Math.max(n, v.toString(2).length) as 4 | 5 | 6);
  };

  const stage = (
    <Pic label="Mask and its submasks">
      <div className="bt-pic-inner" ref={boxRef}>
        <div className="bt-items" aria-label="Items">
          {Array.from({ length: n }, (_, i) => (
            <span key={i} className={`bt-item${(f.calc ? f.calc.sub : f.sub) >> i & 1 ? " sub" : (mask >> i) & 1 ? " in" : ""}`}>item {i}</span>
          ))}
        </div>
        <BitGrid w={n} rows={rows} cell={cell} labelW={labelW} valueW={valueW} header="index" nibbleGap={false} />
        <div className="bt-row2">
          <span className="bk-cap">Submasks found: {f.found.length} of {total}</span>
          <span className="bt-hint"><Icon name="info" size={16} />Click a mask bit to add or remove an item.</span>
        </div>
        <div className="bt-found" aria-label="Submasks found so far">
          <AnimatePresence initial={false}>
            {f.found.map((s, i) => (
              <motion.div key={s} className={`bt-sub${i === f.found.length - 1 && f.sub !== 0 ? " new" : ""}`}
                initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ type: "spring", stiffness: 440, damping: 30 }}>
                <span className="b">{binStr(s, n).split("").map((c, j) => ((mask >> (n - 1 - j)) & 1 ? <span key={j}>{c}</span> : <i key={j}>{c}</i>))}</span>
                <span className="s">{setStr(s, n)}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </Pic>
  );

  return (
    <LabShell
      label="Submask enumeration"
      tabs={tabs}
      sub={<div className="bt-top"><Segmented<4 | 5 | 6> label="Items" value={n} onChange={(v) => { setN(v); setMask((m) => m & (2 ** v - 1) || 1); }} options={[{ value: 4, label: "4" }, { value: 5, label: "5" }, { value: 6, label: "6" }]} /></div>}
      stage={stage}
      narration={<Narration p={p} />}
      bar={<PlayerBar p={p} />}
      onKeyDown={p.onKeyDown}
      code={<CodePanel title="Every non-empty submask" lines={SUBSETS_CODE} active={f.line}
        note={<>A mask is a set: bit i is 1 when item i is in it. {n} items give 2**{n} = {2 ** n} masks.</>} />}
      below={
        <InputEditor
          fields={[{ id: "mask", label: "mask (number or 0b...)", value: txt, onChange: setTxt, wide: true }]}
          onApply={apply} error={err} note="1 to 63, so at most 6 items."
          onRandom={() => { const v = randInt(1, 2 ** n - 1); setMask(v); setTxt(String(v)); setErr(null); }}
          presets={[
            { label: "{0, 2, 3}", run: () => { setMask(0b1101); setN(4); } },
            { label: "{1, 3}", run: () => { setMask(0b1010); setN(4); } },
            { label: "{0, 1, 2, 3}", run: () => { setMask(15); setN(4); } },
            { label: "{1, 2, 4, 5}", run: () => { setMask(0b110110); setN(6); } },
          ]}
        />
      }
    />
  );
}
