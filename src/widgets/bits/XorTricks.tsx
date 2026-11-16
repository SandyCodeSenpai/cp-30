import { useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Segmented } from "@/ui";
import { useWidth } from "@/lib/hooks";
import { CodePanel, InputEditor, LabShell, Narration, Pic, PlayerBar, parseInt1, parseNums, randInt, usePlayer, type Run } from "./kit/player";
import { BitGrid, cellSize, toBits, type GridRow } from "./grid";
import { PREFIX_CODE, SINGLE_CODE } from "./code";
import { buildPrefix, buildSingle, type PrefixFrame, type SingleFrame } from "./engine";

type Part = "single" | "prefix";
const widthOf = (vals: number[]) => Math.max(4, ...vals.map((v) => v.toString(2).length));

export default function XorTricks({ tabs, onComplete }: { tabs?: ReactNode; onComplete?: () => void }) {
  const [part, setPart] = useState<Part>("single");
  const sub = <div className="bt-top"><Segmented<Part> label="Trick" value={part} onChange={setPart} options={[{ value: "single", label: "Single number" }, { value: "prefix", label: "Prefix XOR" }]} /></div>;
  return part === "single" ? <Single tabs={tabs} sub={sub} onComplete={onComplete} /> : <Prefix tabs={tabs} sub={sub} onComplete={onComplete} />;
}

function useCells(len: number) {
  const ref = useRef<HTMLDivElement>(null);
  const avail = useWidth(ref) || 600;
  const aw = Math.max(30, Math.min(52, Math.floor((avail - 4 * len) / len)));
  return { ref, avail, aw };
}

function Single({ tabs, sub, onComplete }: { tabs?: ReactNode; sub: ReactNode; onComplete?: () => void }) {
  const [nums, setNums] = useState([4, 1, 2, 1, 2]);
  const frames = useMemo(() => buildSingle(nums), [nums]);
  const run: Run<SingleFrame> = useMemo(() => ({ frames }), [frames]);
  const p = usePlayer(run, onComplete);
  const f = p.frame;
  const { ref, avail, aw } = useCells(nums.length);
  const w = widthOf(nums);
  const narrow = avail < 440;
  const labelW = narrow ? 50 : 64, valueW = 40;
  const cell = cellSize(avail, w, labelW, valueW, 36, 18);
  const x = f.i >= 0 && f.i < nums.length ? nums[f.i] : null;
  const rows: GridRow[] = x !== null
    ? [
        { key: "a", label: "ans", bits: toBits(f.prev, w), tone: "mid", value: f.prev },
        { key: "x", label: "^ x", bits: toBits(x, w), tone: "in", value: x, mark: f.cancel !== null ? toBits(x, w).flatMap((v, i) => (v ? [i] : [])) : undefined },
        { key: "r", label: "=", bits: toBits(f.ans, w), tone: "res", value: f.ans, rule: true },
      ]
    : [{ key: "r", label: "ans", bits: toBits(f.ans, w), tone: "res", value: f.ans }];

  // which indexes are cancelled pairs (both copies seen) so far
  const seenCount = new Map<number, number>();
  const gone = new Set<number>();
  nums.slice(0, Math.max(0, f.i + 1)).forEach((v, i) => {
    const c = (seenCount.get(v) ?? 0) + 1; seenCount.set(v, c);
    if (c % 2 === 0) { gone.add(i); const prev = nums.slice(0, i).lastIndexOf(v); gone.add(prev); }
  });

  const [txt, setTxt] = useState(nums.join(", "));
  const [err, setErr] = useState<string | null>(null);
  const apply = () => { const v = parseNums(txt, { min: 0, max: 255, minLen: 1, maxLen: 11 }); if (typeof v === "string") { setErr(v); return; } setErr(null); setNums(v); };
  const random = () => {
    const k = randInt(2, 4), pool: number[] = [];
    while (pool.length < k + 1) { const v = randInt(1, 15); if (!pool.includes(v)) pool.push(v); }
    const arr = [pool[0], ...pool.slice(1).flatMap((v) => [v, v])].sort(() => Math.random() - 0.5);
    setNums(arr); setTxt(arr.join(", ")); setErr(null);
  };

  const stage = (
    <Pic label="XOR every number">
      <div className="bt-pic-inner" ref={ref}>
        <div className="bt-arr">
          <span className="bt-rowlab">nums</span>
          <div className="bt-cells" style={{ "--aw": `${aw}px` } as CSSProperties}>
            {nums.map((v, i) => (
              <div key={i} className="bt-ci">
                <div className={`bt-c${i === f.i ? " cur" : f.i >= nums.length && !gone.has(i) ? " inq" : i < f.i ? " done" : ""}${gone.has(i) && i !== f.i ? " gone" : ""}`}>{v}</div>
                <small>{i}</small>
              </div>
            ))}
          </div>
        </div>
        <BitGrid w={w} rows={rows} cell={cell} labelW={labelW} valueW={valueW} header="index" />
        <div className="bt-row2">
          <span className="bk-cap">Seen an odd number of times:</span>
          <div className="bk-chips">{f.odd.length ? f.odd.map((v) => <span key={v} className="bk-var acc"><b>{v}</b></span>) : <span className="bk-var">none</span>}</div>
        </div>
      </div>
    </Pic>
  );
  return (
    <LabShell label="Single number with XOR" tabs={tabs} sub={sub} stage={stage} narration={<Narration p={p} />} bar={<PlayerBar p={p} />} onKeyDown={p.onKeyDown}
      code={<CodePanel title="LC 136 Single Number" lines={SINGLE_CODE} active={f.line} note={<>ans is always the XOR of the values seen an odd number of times.</>} />}
      below={<InputEditor fields={[{ id: "nums", label: "nums (1 to 11 values, 0 to 255)", value: txt, onChange: setTxt, wide: true }]} onApply={apply} error={err} onRandom={random}
        presets={[
          { label: "4, 1, 2, 1, 2", run: () => { setNums([4, 1, 2, 1, 2]); setTxt("4, 1, 2, 1, 2"); } },
          { label: "2, 2, 1", run: () => { setNums([2, 2, 1]); setTxt("2, 2, 1"); } },
          { label: "7, 3, 5, 3, 7", run: () => { setNums([7, 3, 5, 3, 7]); setTxt("7, 3, 5, 3, 7"); } },
        ]} />}
    />
  );
}

function Prefix({ tabs, sub, onComplete }: { tabs?: ReactNode; sub: ReactNode; onComplete?: () => void }) {
  const [a, setA] = useState([3, 5, 2, 7, 1, 6]);
  const [q, setQ] = useState<[number, number]>([2, 4]);
  const frames = useMemo(() => buildPrefix(a, q[0], q[1]), [a, q]);
  const run: Run<PrefixFrame> = useMemo(() => ({ frames }), [frames]);
  const p = usePlayer(run, onComplete);
  const f = p.frame;
  const { ref, avail, aw } = useCells(a.length + 1);
  const px = f.px;
  const w = widthOf([...a, ...px]);
  const narrow = avail < 440;
  const labelW = narrow ? 64 : 78, valueW = 40;
  const cell = cellSize(avail, w, labelW, valueW, 36, 18);
  const [l, r] = q;
  let rows: GridRow[];
  if (f.query) {
    const res = px[r + 1] ^ px[l];
    rows = [
      { key: "p1", label: `px[${r + 1}]`, bits: toBits(px[r + 1], w), tone: "mid", value: px[r + 1] },
      { key: "p0", label: `^ px[${l}]`, bits: toBits(px[l], w), tone: "mid", value: px[l] },
      { key: "r", label: "=", bits: toBits(res, w), tone: "res", value: res, rule: true },
    ];
  } else if (f.i >= 0) {
    rows = [
      { key: "p", label: `px[${f.i}]`, bits: toBits(px[f.i], w), tone: "mid", value: px[f.i] },
      { key: "x", label: `^ a[${f.i}]`, bits: toBits(a[f.i], w), tone: "in", value: a[f.i] },
      { key: "r", label: `px[${f.i + 1}]`, bits: toBits(px[f.i + 1], w), tone: "res", value: px[f.i + 1], rule: true },
    ];
  } else rows = [{ key: "p", label: "px[0]", bits: toBits(0, w), tone: "res", value: 0 }];

  const [txt, setTxt] = useState(a.join(", ")), [lt, setLt] = useState(String(l)), [rt, setRt] = useState(String(r));
  const [err, setErr] = useState<string | null>(null);
  const apply = () => {
    const v = parseNums(txt, { min: 0, max: 255, minLen: 2, maxLen: 10 }); if (typeof v === "string") { setErr(v); return; }
    const L = parseInt1(lt, 0, v.length - 1, "l"); if (typeof L === "string") { setErr(L); return; }
    const R = parseInt1(rt, L, v.length - 1, "r"); if (typeof R === "string") { setErr(R); return; }
    setErr(null); setA(v); setQ([L, R]);
  };
  const random = () => {
    const n = randInt(5, 8), v = Array.from({ length: n }, () => randInt(0, 15));
    const L = randInt(0, n - 2), R = randInt(L + 1, n - 1);
    setA(v); setQ([L, R]); setTxt(v.join(", ")); setLt(String(L)); setRt(String(R)); setErr(null);
  };
  const half = (aw + 4) / 2;
  const stage = (
    <Pic label="Prefix XOR">
      <div className="bt-pic-inner" ref={ref}>
        <div className="bt-arr">
          <span className="bt-rowlab">a</span>
          <div className="bt-cells" style={{ "--aw": `${aw}px`, paddingLeft: half } as CSSProperties}>
            {a.map((v, i) => (
              <div key={i} className="bt-ci">
                <div className={`bt-c${f.query && i >= l && i <= r ? " inq" : i === f.i ? " cur" : ""}`}>{v}</div>
                <small>{i}</small>
              </div>
            ))}
          </div>
          <span className="bt-rowlab">px</span>
          <div className="bt-cells" style={{ "--aw": `${aw}px` } as CSSProperties}>
            {Array.from({ length: a.length + 1 }, (_, i) => (
              <div key={i} className="bt-ci">
                <div className={`bt-c px${i >= f.built ? " empty" : ""}${f.query && (i === l || i === r + 1) ? " hit" : ""}${!f.query && i === f.i + 1 && f.i >= 0 ? " new" : ""}`}>{i < f.built ? px[i] : "·"}</div>
                <small>{i}</small>
              </div>
            ))}
          </div>
        </div>
        <BitGrid w={w} rows={rows} cell={cell} labelW={labelW} valueW={valueW} header="index" />
        <div className="bt-row2"><span className="bk-var">query: l = <b>{l}</b>, r = <b>{r}</b></span>{f.done && <span className="bk-var good">range_xor({l}, {r}) = <b>{px[r + 1] ^ px[l]}</b></span>}</div>
      </div>
    </Pic>
  );
  return (
    <LabShell label="Prefix XOR" tabs={tabs} sub={sub} stage={stage} narration={<Narration p={p} />} bar={<PlayerBar p={p} />} onKeyDown={p.onKeyDown}
      code={<CodePanel title="XOR prefix: range XOR in O(1)" lines={PREFIX_CODE} active={f.line} note={<>Same as a sum prefix, with ^ in place of + and -, because x ^ x = 0.</>} />}
      below={<InputEditor
        fields={[{ id: "a", label: "a (2 to 10 values, 0 to 255)", value: txt, onChange: setTxt, wide: true }, { id: "l", label: "l", value: lt, onChange: setLt, numeric: true }, { id: "r", label: "r", value: rt, onChange: setRt, numeric: true }]}
        onApply={apply} error={err} onRandom={random}
        presets={[
          { label: "3, 5, 2, 7, 1, 6", run: () => { setA([3, 5, 2, 7, 1, 6]); setQ([2, 4]); setTxt("3, 5, 2, 7, 1, 6"); setLt("2"); setRt("4"); } },
          { label: "1, 3, 4, 8 (l=0)", run: () => { setA([1, 3, 4, 8]); setQ([0, 3]); setTxt("1, 3, 4, 8"); setLt("0"); setRt("3"); } },
        ]} />}
    />
  );
}
