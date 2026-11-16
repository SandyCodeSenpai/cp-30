import { useEffect, useMemo, useState } from "react";
import type { WidgetProps } from "../types";
import { Segmented, Stage } from "@/ui";
import { CodePanel, InputEditor, LabShell, Narration, PlayerBar, parseNums, randInt, usePlayer } from "../dp-table/kit/player";
import { buildQuad, buildTails, type LisFrame, type LisMode } from "./engine";
import { LisView } from "./View";
import "./lis.css";

const MODES: { value: LisMode; label: string }[] = [
  { value: "tails", label: "Tails + bisect, O(n log n)" },
  { value: "quadratic", label: "dp table, O(n²)" },
];
const isMode = (m: unknown): m is LisMode => m === "tails" || m === "quadratic";
const DEFAULT = [10, 9, 2, 5, 3, 7, 101, 18];
const LIMITS = { min: -99, max: 999, minLen: 3, maxLen: 12, name: "numbers" };
const validNums = (v: unknown): v is number[] => Array.isArray(v) && v.length >= LIMITS.minLen && v.length <= LIMITS.maxLen && v.every((q) => Number.isInteger(q) && q >= LIMITS.min && q <= LIMITS.max);

const PRESETS: { label: string; nums: number[] }[] = [
  { label: "LC 300 example", nums: [10, 9, 2, 5, 3, 7, 101, 18] },
  { label: "tails is not the LIS", nums: [3, 5, 7, 1, 2] },
  { label: "0, 1, 0, 3, 2, 3", nums: [0, 1, 0, 3, 2, 3] },
  { label: "All equal", nums: [7, 7, 7, 7] },
];

export default function LisLab({ onComplete, ...props }: WidgetProps) {
  const locked = isMode(props.mode);
  const [mode, setMode] = useState<LisMode>(locked ? (props.mode as LisMode) : "tails");
  const [nums, setNums] = useState<number[]>(() => (validNums(props.nums) ? props.nums : DEFAULT));
  const [draft, setDraft] = useState(nums.join(", "));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { if (isMode(props.mode)) setMode(props.mode); }, [props.mode]);
  useEffect(() => { setDraft(nums.join(", ")); setError(null); }, [nums]);

  const run = useMemo(() => (mode === "tails" ? buildTails(nums) : buildQuad(nums)), [mode, nums]);
  const p = usePlayer<LisFrame>(run.frames, onComplete);
  const f = p.frame;
  const n = nums.length;

  const apply = () => { const r = parseNums(draft, LIMITS); if (typeof r === "string") setError(r); else setNums(r); };
  const random = () => setNums(Array.from({ length: randInt(6, 10) }, () => randInt(1, 20)));

  const stats = mode === "tails"
    ? <><span>len(tails) = <b>{f.tails.length}</b></span><span>bisect checks: <b>{f.bis}</b></span><span>O(n²) checks: <b>{f.quad}</b></span></>
    : <><span>checks: <b>{f.quad}</b> of {(n * (n - 1)) / 2}</span><span>max(dp) so far: <b>{Math.max(...f.dp.map((v) => v ?? 0))}</b></span></>;

  const stage = (
    <Stage className="lis-stage">
      <div className="lis-top">
        <span className="lis-title">{run.title}</span>
        {p.cur === p.last && <span className="lis-result">LIS length: <b>{run.result}</b></span>}
      </div>
      <LisView a={nums} f={f} mode={mode} />
      <div className="lis-info" aria-live="polite">
        {f.info && <code className="lis-eq">{f.info}</code>}
        <div className="lis-stats">{stats}</div>
        <div className="lis-key" aria-hidden="true">
          <span><i className="sw cur" />current</span>
          {mode === "tails" ? <span><i className="sw probe" />slot checked by bisect</span> : <span><i className="sw no" />a[j] ≥ a[i]: skip</span>}
          {f.lis && <span><i className="sw lis" />one real LIS</span>}
        </div>
      </div>
    </Stage>
  );

  return (
    <LabShell
      label="Longest increasing subsequence"
      onKeyDown={p.onKeyDown}
      tabs={!locked ? <div className="lis-tabs"><Segmented<LisMode> label="Method" value={mode} onChange={setMode} options={MODES} /></div> : undefined}
      stage={stage}
      narration={<Narration p={p} />}
      bar={<PlayerBar p={p} />}
      below={
        <InputEditor
          fields={[{ id: "nums", label: "nums (3 to 12 whole numbers)", value: draft, onChange: setDraft, wide: true, placeholder: "10, 9, 2, 5, 3, 7, 101, 18" }]}
          onApply={apply} error={error} onRandom={random}
          presets={PRESETS.map((pr) => ({ label: pr.label, run: () => setNums(pr.nums) }))} />
      }
      code={<CodePanel title={run.title} lines={run.code} active={f.line} active2={f.line2}
        note={mode === "tails" ? "Use `bisect_right` for non-decreasing runs. tails is sorted, so each step is a binary search: O(log n)." : "Every pair (j, i) is checked once: n(n - 1) / 2 checks. Fine for n up to a few thousand."} />}
    />
  );
}
