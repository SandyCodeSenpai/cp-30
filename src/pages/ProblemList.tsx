/**
 * Fallback checklist for a day's problems, used until the player's PracticeList exists
 * (src/player/Practice.tsx). Same data and the same progress calls, so switching is seamless.
 */
import type { Problem } from "@/content/types";
import { Icon } from "@/ui";
import { progress, useProgress, type ProblemStatus } from "@/state/progress";
import { PracticeMod, linkFor } from "./plan";

const TIER: Record<Problem["tier"], string> = { warm: "Warm-up", core: "Core", stretch: "Stretch" };
const MARKS: { s: ProblemStatus; label: string }[] = [
  { s: "solved", label: "Alone" }, { s: "hint", label: "Hint" }, { s: "editorial", label: "Editorial" }, { s: "skipped", label: "Skip" },
];

export function DayProblems({ problems, intro }: { problems: Problem[]; intro?: string }) {
  const Ext = PracticeMod?.PracticeList;
  if (Ext) return <Ext problems={problems} intro={intro} />;
  return <ProblemList problems={problems} intro={intro} />;
}

export default function ProblemList({ problems, intro }: { problems: Problem[]; intro?: string }) {
  const p = useProgress();
  return (
    <div className="plist">
      {intro && <p className="plist-intro">{intro}</p>}
      <ol className="plist-rows">
        {problems.map((pr, i) => {
          const mark = p.problems?.[pr.ref]?.s;
          const url = linkFor(pr);
          return (
            <li key={pr.ref} className={`prob${mark ? ` m-${mark}` : ""}`}>
              <div className="prob-main">
                <span className="prob-n tnum" aria-hidden="true">{mark === "solved" ? <Icon name="check" size={14} stroke={3} /> : i + 1}</span>
                <div className="prob-body">
                  <div className="prob-title">
                    {url ? <a href={url} target="_blank" rel="noreferrer noopener">{pr.ref}<Icon name="external" size={13} stroke={2} /></a> : <span>{pr.ref}</span>}
                  </div>
                  <div className="prob-meta">
                    <span className={`prob-tier t-${pr.tier}`}>{TIER[pr.tier] ?? pr.tier}</span>
                    {pr.lvl && <span>{pr.lvl}</span>}
                    <span className="tnum">{pr.box} min box</span>
                  </div>
                  {pr.clue && <div className="prob-clue"><span>Clue</span>{pr.clue}</div>}
                </div>
              </div>
              <div className="prob-marks" role="group" aria-label={`How did ${pr.ref} go?`}>
                {MARKS.map((m) => (
                  <button key={m.s} type="button" aria-pressed={mark === m.s} className={`pmark k-${m.s}${mark === m.s ? " on" : ""}`}
                    onClick={() => progress.setProblem(pr.ref, mark === m.s ? null : m.s)}>{m.label}</button>
                ))}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
