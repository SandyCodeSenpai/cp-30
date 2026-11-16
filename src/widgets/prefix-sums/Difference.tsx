import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useWidth } from "@/lib/hooks";
import { PlayerView, type EditorSpec } from "./kit/PlayerView";
import { usePlayer } from "./kit/player";
import { parseInt1, randInt, sn } from "./kit/parse";
import { DIFF_CODE, diffFrames, type DiffS, type Update } from "./frames";
import { useMotion } from "./track";

const PRESETS: { label: string; n: number; ups: Update[] }[] = [
  { label: "Three updates", n: 8, ups: [[1, 3, 2], [2, 6, 3], [5, 7, -1]] },
  { label: "Book check", n: 5, ups: [[1, 3, 2]] },
  { label: "Flight bookings", n: 5, ups: [[0, 1, 10], [1, 2, 20], [1, 4, 25]] },
];

function parseUpdates(text: string, n: number): { ok: true; value: Update[] } | { ok: false; error: string } {
  const groups = text.split(/[;\n]+/).map((g) => g.trim()).filter(Boolean);
  if (groups.length < 1) return { ok: false, error: "Enter at least one update, like 1 3 2." };
  if (groups.length > 5) return { ok: false, error: "Use at most 5 updates." };
  const out: Update[] = [];
  for (const g of groups) {
    const p = g.replace(/[()]/g, "").split(/[\s,]+/).filter(Boolean);
    if (p.length !== 3 || !p.every((x) => /^-?\d+$/.test(x))) return { ok: false, error: `"${g}" should be three whole numbers: l r v.` };
    const [l, r, v] = p.map(Number);
    if (l < 0 || r >= n || l > r) return { ok: false, error: `In "${g}", need 0 ≤ l ≤ r ≤ ${n - 1}.` };
    if (Math.abs(v) > 50) return { ok: false, error: "Keep v between -50 and 50." };
    out.push([l, r, v]);
  }
  return { ok: true, value: out };
}
const upStr = (ups: Update[]) => ups.map((u) => u.join(" ")).join("; ");

export default function Difference({ nums, onEnd }: { nums?: number[]; onEnd: () => void }) {
  const n0 = nums && nums.length >= 4 ? Math.min(16, nums.length) : PRESETS[0].n;
  const [n, setN] = useState(n0);
  const [ups, setUps] = useState<Update[]>(n0 === PRESETS[0].n ? PRESETS[0].ups : [[1, Math.min(n0 - 1, 3), 2], [0, n0 - 1, 1]]);
  const frames = useMemo(() => diffFrames(n, ups), [n, ups]);
  const pl = usePlayer(frames, `df:${n}:${upStr(ups)}`, onEnd);
  const s = pl.frame.s;

  const [nt, setNt] = useState(String(n));
  const [ut, setUt] = useState(upStr(ups));
  const [err, setErr] = useState<string | null>(null);
  const load = (nn: number, nu: Update[]) => { setN(nn); setUps(nu); setNt(String(nn)); setUt(upStr(nu)); setErr(null); };
  const editor: EditorSpec = {
    fields: [
      { id: "n", label: "n", value: nt, onChange: setNt, narrow: true },
      { id: "u", label: "Updates: l r v; l r v (up to 5)", value: ut, onChange: setUt, placeholder: "1 3 2; 2 6 3" },
    ],
    error: err,
    onApply: () => {
      const N = parseInt1(nt, "n", 4, 16); if (!N.ok) return setErr(N.error);
      const U = parseUpdates(ut, N.value); if (!U.ok) return setErr(U.error);
      load(N.value, U.value);
    },
    onRandom: () => {
      const nn = randInt(6, 10);
      const nu: Update[] = Array.from({ length: randInt(2, 4) }, () => { const l = randInt(0, nn - 2); return [l, randInt(l, nn - 1), randInt(-3, 5) || 1]; });
      load(nn, nu);
    },
    presets: PRESETS.map((p) => ({ label: p.label, onClick: () => load(p.n, p.ups) })),
  };

  return (
    <PlayerView pl={pl} code={DIFF_CODE} codeTitle={`apply_updates(${n}, updates)`}
      stageLabel={`Difference array with ${n + 1} cells and ${ups.length} range updates.`}
      editor={editor} stage={<DiffStage s={s} />} />
  );
}

function DiffStage({ s }: { s: DiffS }) {
  const ref = useRef<HTMLDivElement>(null);
  const w = useWidth(ref) || 600;
  const { move, pop } = useMotion();
  const N = s.n + 1;
  const lw = 64;
  const cw = Math.max(32, Math.min(58, Math.floor((w - lw - 4) / N)));
  const width = lw + N * cw + 4;
  const x = (i: number) => lw + i * cw;
  const LANE = 22, yIdx = 0, yLanes = 20, yDiff = yLanes + Math.max(1, s.ups.length) * LANE + 10, CH = 44;
  const yOut = yDiff + CH + 30, height = yOut + CH + 6;
  const accK = s.acc;

  return (
    <div ref={ref} className="ak-scroll">
      <div className="ps-track" style={{ width, height }}>
        <div className="ps-rowlabel left" style={{ top: yLanes, height: LANE }}>updates</div>
        <div className="ps-rowlabel left" style={{ top: yDiff, height: CH }}>diff</div>
        <div className="ps-rowlabel left" style={{ top: yOut, height: CH }}>{s.done ? "result" : "running"}</div>
        {Array.from({ length: N }, (_, i) => <div key={i} className="ps-idx" style={{ left: x(i), width: cw, top: yIdx }}>{i}</div>)}

        {s.ups.map(([l, r, v], u) => {
          const st = u === s.u ? "cur" : u < s.applied ? "done" : "todo";
          return (
            <motion.div key={u} className={`ps-lane ${st}`} style={{ top: yLanes + u * LANE, height: LANE - 4, left: x(l) + 2, width: (r - l + 1) * cw - 4 }}
              initial={false} animate={{ opacity: st === "todo" ? 0.75 : 1 }} transition={move}>
              <span>{v > 0 ? `+${v}` : sn(v)}</span>
            </motion.div>
          );
        })}

        {s.diff.map((v, i) => {
          const hot = s.hot?.idx === i;
          const isAcc = accK !== null && i === accK;
          return (
            <div key={i} className={`ps-cell ${hot ? (s.hot!.kind === "start" ? "c-accent" : "c-warn") : isAcc ? "c-soft" : ""} ${i === s.n ? "extra" : ""}`}
              style={{ left: x(i) + 2, width: cw - 4, top: yDiff, height: CH }}>
              <motion.span key={`${i}:${v}`} initial={{ scale: hot ? 1.3 : 1 }} animate={{ scale: 1 }} transition={pop}>{v === 0 && !hot ? <span className="ps-zero">0</span> : sn(v)}</motion.span>
              <AnimatePresence>
                {hot && (
                  <motion.span className={`ps-delta ${s.hot!.kind === "start" ? "t-accent" : "t-warn"}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={pop}>
                    {s.hot!.delta > 0 ? `+${s.hot!.delta}` : sn(s.hot!.delta)}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          );
        })}

        {/* down arrows from diff to running sum */}
        {accK !== null && (
          <svg className="ps-arrow" style={{ left: x(accK), top: yDiff + CH + 2, width: cw, height: 26 }} viewBox={`0 0 ${cw} 26`} aria-hidden="true">
            <path d={`M${cw / 2} 2 V22 M${cw / 2 - 4} 17 L${cw / 2} 22 L${cw / 2 + 4} 17`} fill="none" />
          </svg>
        )}
        {s.out.map((v, i) => (
          <AnimatePresence key={i}>
            {v !== null && (
              <motion.div className={`ps-cell out ${i === accK ? "c-accent" : s.done && i < s.n ? "c-good" : ""} ${i === s.n ? "extra" : ""}`}
                style={{ left: x(i) + 2, width: cw - 4, top: yOut, height: CH }}
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: s.done && i === s.n ? 0.35 : 1, y: 0 }} exit={{ opacity: 0 }} transition={pop}>
                {sn(v)}
              </motion.div>
            )}
          </AnimatePresence>
        ))}
        {Array.from({ length: N }, (_, i) => s.out[i] === null && (
          <div key={`e${i}`} className={`ps-cell ghost ${i === s.n ? "extra" : ""}`} style={{ left: x(i) + 2, width: cw - 4, top: yOut, height: CH }} />
        ))}
      </div>
    </div>
  );
}
