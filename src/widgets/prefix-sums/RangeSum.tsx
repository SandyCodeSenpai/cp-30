import { useMemo, useState } from "react";
import { PlayerView, type EditorSpec } from "./kit/PlayerView";
import { usePlayer } from "./kit/player";
import { parseInt1, parseNums, randArr, randInt, sn } from "./kit/parse";
import { RANGE_CODE, rangeFrames, rangeQueryStart, type Query } from "./frames";
import { Formula, PrefixTrack, T, type Bracket } from "./track";
import type { Tone } from "@/content/types";

const PRESETS: { label: string; a: number[]; q: Query }[] = [
  { label: "Book example", a: [3, 1, 4, 1, 5, 9, 2, 6], q: { l: 2, r: 5 } },
  { label: "With negatives", a: [2, -1, 3, -4, 5, -2], q: { l: 1, r: 3 } },
];
const LIM = { min: 4, max: 16, lo: -99, hi: 99 };
const M = "−";

export default function RangeSum({ nums, onEnd }: { nums?: number[]; onEnd: () => void }) {
  const init = nums && nums.length >= 2 ? nums.slice(0, 16) : PRESETS[0].a;
  const [a, setA] = useState(init);
  const [q, setQ] = useState<Query>(nums ? { l: Math.min(1, init.length - 1), r: Math.min(init.length - 1, 3) } : PRESETS[0].q);
  const [anchor, setAnchor] = useState<number | null>(null);
  const frames = useMemo(() => rangeFrames(a, q), [a, q]);
  const pl = usePlayer(frames, `rs:${a.join(",")}`, onEnd);
  const f = pl.frame, s = f.s, n = a.length, qStart = rangeQueryStart(n);
  const built = pl.i >= qStart - 1;

  const [txt, setTxt] = useState(a.join(", "));
  const [ql, setQl] = useState(String(q.l));
  const [qr, setQr] = useState(String(q.r));
  const [err, setErr] = useState<string | null>(null);
  const load = (na: number[], nq: Query) => { setA(na); setQ(nq); setTxt(na.join(", ")); setQl(String(nq.l)); setQr(String(nq.r)); setErr(null); setAnchor(null); };
  const editor: EditorSpec = {
    fields: [
      { id: "a", label: "Array a (4 to 16 numbers)", value: txt, onChange: setTxt, placeholder: "3, 1, 4, 1, 5" },
      { id: "l", label: "Query l", value: ql, onChange: setQl, narrow: true },
      { id: "r", label: "Query r", value: qr, onChange: setQr, narrow: true },
    ],
    error: err,
    onApply: () => {
      const r = parseNums(txt, LIM); if (!r.ok) return setErr(r.error);
      const L = parseInt1(ql, "l", 0, r.value.length - 1); if (!L.ok) return setErr(L.error);
      const R = parseInt1(qr, "r", 0, r.value.length - 1); if (!R.ok) return setErr(R.error);
      if (L.value > R.value) return setErr("l must be at most r.");
      load(r.value, { l: L.value, r: R.value });
    },
    onRandom: () => { const m = randInt(6, 10); const na = randArr(m, -5, 12); const l = randInt(0, m - 2); load(na, { l, r: randInt(l, m - 1) }); },
    presets: PRESETS.map((p) => ({ label: p.label, onClick: () => load(p.a, p.q) })),
  };

  const onCell = built ? (i: number) => {
    if (anchor === null) { setAnchor(i); return; }
    const nq = { l: Math.min(anchor, i), r: Math.max(anchor, i) };
    setAnchor(null); setQ(nq); setQl(String(nq.l)); setQr(String(nq.r));
    pl.jump(qStart);
  } : undefined;

  // drawing state
  const cellTone: Record<number, Tone | "dim" | "anchor"> = {};
  const pillTone: Record<number, Tone> = {};
  const brackets: Bracket[] = [];
  let band: { l: number; r: number; tone: Tone } | null = null;
  const P = s.pre as number[];
  if (s.cur !== null && s.cur > 0) { cellTone[s.cur - 1] = "accent"; pillTone[s.cur] = "accent"; pillTone[s.cur - 1] = "neutral"; }
  if (s.cur === 0) pillTone[0] = "accent";
  if (s.q && s.qs > 0) {
    const { l, r } = s.q;
    band = { l, r, tone: s.qs === 4 ? "good" : "accent" };
    if (s.qs >= 2) { brackets.push({ from: 0, to: r + 1, tone: "accent", label: `pre[${r + 1}] = ${sn(P[r + 1])}` }); pillTone[r + 1] = "accent"; }
    if (s.qs >= 3) {
      brackets.push({ from: 0, to: l, tone: "warn", label: `pre[${l}] = ${sn(P[l])}` }); pillTone[l] = "warn";
      for (let k = 0; k < l; k++) cellTone[k] = "dim";
    }
  }
  if (anchor !== null) cellTone[anchor] = "anchor";

  const sum = s.q ? P[s.q.r + 1] - P[s.q.l] : 0;
  return (
    <PlayerView pl={pl} code={RANGE_CODE} codeTitle="pre = accumulate(a, initial=0)"
      stageLabel={`Array of ${n} numbers with its prefix sums below.`}
      editor={editor}
      hint={built ? (anchor === null ? "Tap a cell, then another, to ask a new range." : `Now tap the other end of the range (start: ${anchor}).`) : undefined}
      stage={
        <>
          <PrefixTrack a={a} pre={s.pre} cover={s.qs === 0 ? s.cur : null} cellTone={cellTone} pillTone={pillTone} band={band} brackets={brackets}
            buildAt={s.cur} minBr={2} onCell={onCell} cellLabel={(i) => `a[${i}] = ${a[i]}. ${anchor === null ? "Set the start of a range" : "Set the end of the range"}`} />
          {s.q && s.qs >= 2 && (
            <Formula>
              <T>sum(a[{s.q.l}..{s.q.r}])</T> = <T tone="accent">pre[{s.q.r + 1}]</T> {M} <T tone={s.qs >= 3 ? "warn" : undefined}>pre[{s.q.l}]</T>
              {s.qs >= 3 && <> = <T tone="accent">{sn(P[s.q.r + 1])}</T> {M} <T tone="warn">{sn(P[s.q.l])}</T></>}
              {s.qs >= 4 && <> = <T tone="good">{sn(sum)}</T></>}
            </Formula>
          )}
        </>
      } />
  );
}
