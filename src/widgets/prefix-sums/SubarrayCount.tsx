import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PlayerView, type EditorSpec } from "./kit/PlayerView";
import { usePlayer } from "./kit/player";
import { parseInt1, parseNums, randArr, randInt, sn } from "./kit/parse";
import { COUNT_CODE, countFrames } from "./frames";
import { PrefixTrack, useMotion, type Bracket } from "./track";
import type { Tone } from "@/content/types";

const PRESETS: { label: string; a: number[]; k: number }[] = [
  { label: "Negatives", a: [3, 4, 7, 2, -3, 1, 4, 2], k: 7 },
  { label: "Book check", a: [1, 1, 1], k: 2 },
  { label: "Zeros", a: [0, 0, 1, 0, -1], k: 0 },
];
const LIM = { min: 3, max: 16, lo: -99, hi: 99 };

export default function SubarrayCount({ nums, k: k0, onEnd }: { nums?: number[]; k?: number; onEnd: () => void }) {
  const [a, setA] = useState(nums && nums.length >= 3 ? nums.slice(0, 16) : PRESETS[0].a);
  const [k, setK] = useState(typeof k0 === "number" ? k0 : PRESETS[0].k);
  const frames = useMemo(() => countFrames(a, k), [a, k]);
  const pl = usePlayer(frames, `sc:${a.join(",")}:${k}`, onEnd);
  const { move, pop } = useMotion();
  const s = pl.frame.s;

  const [txt, setTxt] = useState(a.join(", "));
  const [kt, setKt] = useState(String(k));
  const [err, setErr] = useState<string | null>(null);
  const load = (na: number[], nk: number) => { setA(na); setK(nk); setTxt(na.join(", ")); setKt(String(nk)); setErr(null); };
  const editor: EditorSpec = {
    fields: [
      { id: "a", label: "nums (3 to 16 numbers, negatives OK)", value: txt, onChange: setTxt, placeholder: "3, 4, 7, 2, -3" },
      { id: "k", label: "k", value: kt, onChange: setKt, narrow: true },
    ],
    error: err,
    onApply: () => {
      const r = parseNums(txt, LIM); if (!r.ok) return setErr(r.error);
      const K = parseInt1(kt, "k", -999, 999); if (!K.ok) return setErr(K.error);
      load(r.value, K.value);
    },
    onRandom: () => { const na = randArr(randInt(6, 10), -3, 6); const i = randInt(0, na.length - 3); load(na, na.slice(i, i + randInt(1, 3)).reduce((x, y) => x + y, 0)); },
    presets: PRESETS.map((p) => ({ label: p.label, onClick: () => load(p.a, p.k) })),
  };

  const cellTone: Record<number, Tone | "dim"> = {};
  const pillTone: Record<number, Tone> = {};
  const brackets: Bracket[] = [];
  if (s.i >= 0 && s.i < a.length) {
    cellTone[s.i] = "accent";
    pillTone[s.i + 1] = "accent";
  }
  if (s.hot?.kind === "hit") {
    s.matches.forEach((p) => {
      pillTone[p] = "good";
      brackets.push({ from: p, to: s.i + 1, tone: "good", label: `a[${p}..${s.i}]` });
    });
  }
  if (s.i === -1 && s.hot?.key === 0) pillTone[0] = "accent";
  const need = s.hot && s.hot.kind !== "add" ? s.hot.key : null;
  const missing = s.hot?.kind === "miss";

  return (
    <PlayerView pl={pl} code={COUNT_CODE} codeTitle={`count_sum_k(nums, ${k})`}
      stageLabel={`Array with running prefix sums and the seen map. Counting subarrays with sum ${k}.`}
      editor={editor}
      stage={
        <div className="ps-count">
          <PrefixTrack a={a} pre={s.pre} cover={s.i >= 0 ? Math.min(a.length, s.i + 1) : null} cellTone={cellTone} pillTone={pillTone} brackets={brackets} minBr={2} />
          <div className="ps-mapwrap">
            <div className="ps-map">
              <div className="ps-map-head"><span>seen</span><span className="ps-map-sub">prefix sum : count</span></div>
              <div className="ps-chips">
                <AnimatePresence initial={false}>
                  {s.seen.map(([key, c]) => {
                    const hot = s.hot && s.hot.key === key ? s.hot.kind : null;
                    return (
                      <motion.span layout key={key} className={`ps-chip${hot ? ` h-${hot}` : ""}`} initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={pop}>
                        <span className="ps-chip-k">{sn(key)}</span><span className="ps-chip-c">{c}</span>
                      </motion.span>
                    );
                  })}
                  {missing && need !== null && (
                    <motion.span key="miss" className="ps-chip h-miss" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={move}>
                      <span className="ps-chip-k">{sn(need)}</span><span className="ps-chip-c">0</span>
                    </motion.span>
                  )}
                </AnimatePresence>
                {s.seen.length === 0 && <span className="ps-empty">empty</span>}
              </div>
              {need !== null && <div className={`ps-need ${missing ? "miss" : "hit"}`}>look up run {"−"} k = {sn(need)}: {missing ? "not seen" : `seen ${s.matches.length}×`}</div>}
            </div>
            <div className="ps-map">
              <div className="ps-map-head"><span>ans = <b className="ps-ans">{s.ans ?? 0}</b></span><span className="ps-map-sub">subarrays with sum {sn(k)}</span></div>
              <div className="ps-chips">
                <AnimatePresence initial={false}>
                  {s.found.map(([p, i]) => (
                    <motion.span layout key={`${p}-${i}`} className="ps-found" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={pop}>a[{p}..{i}]</motion.span>
                  ))}
                </AnimatePresence>
                {s.found.length === 0 && <span className="ps-empty">none yet</span>}
              </div>
            </div>
          </div>
        </div>
      } />
  );
}
