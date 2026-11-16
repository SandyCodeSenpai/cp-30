/**
 * The day's real problems as a checklist: tier, level, time box, a hidden clue, a link to the judge,
 * a time-box timer and a status per problem (saved with progress.setProblem).
 *
 *   import { PracticeList, problemUrl } from "@/player/Practice";
 *   <PracticeList problems={problems} intro="..." />
 */
import { useEffect, useId, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { PracticeStep, Problem } from "@/content/types";
import { progress, useProgress, type ProblemStatus } from "@/state/progress";
import { useReducedMotion } from "@/lib/hooks";
import { Inline, Text } from "./Text";
import { IconCheck, IconClock } from "./icons";
import "./practice.css";

/* ---------------- Links ---------------- */

const slug = (t: string) => t.toLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

export type Judge = "LeetCode" | "CSES" | "Codeforces" | "AtCoder";
export function judgeOf(ref: string): Judge | null {
  if (/^(LC|LeetCode)\b/i.test(ref)) return "LeetCode";
  if (/^CSES\b/i.test(ref)) return "CSES";
  if (/codeforces/i.test(ref)) return "Codeforces";
  if (/atcoder/i.test(ref)) return "AtCoder";
  return null;
}

/**
 * Where to solve a problem. `url` wins. "LC 1 Two Sum" -> leetcode.com/problems/two-sum/.
 * "CSES — X" -> the CSES problem set. Codeforces rows with a tag and a rating range -> a filtered problem set.
 * AtCoder -> the contest archive. Unknown -> undefined.
 */
export function problemUrl(p: Pick<Problem, "ref"> & { url?: string }): string | undefined {
  if (p.url) return p.url;
  const ref = p.ref.trim();
  const lc = /^(?:LC|LeetCode)\s*#?(\d+)[.:]?\s+(.+)$/i.exec(ref);
  if (lc) { const s = slug(lc[2]); return s ? `https://leetcode.com/problems/${s}/` : "https://leetcode.com/problemset/"; }
  switch (judgeOf(ref)) {
    case "CSES": return "https://cses.fi/problemset/";
    case "Codeforces": {
      const range = /(\d{3,4})\s*(?:–|—|-|to)\s*(\d{3,4})/.exec(ref);
      const tag = /\btags?\s+([a-z0-9 &*+'-]+?)\s*(?:[,;.(]|$)/i.exec(ref);
      if (range && tag) return `https://codeforces.com/problemset?tags=${encodeURIComponent(tag[1].trim().toLowerCase())},${range[1]}-${range[2]}`;
      return "https://codeforces.com/problemset";
    }
    case "AtCoder": return "https://atcoder.jp/contests/archive";
    default: return undefined;
  }
}

/* ---------------- Labels ---------------- */

const TIER: Record<Problem["tier"], { label: string; bars: number }> = {
  warm: { label: "Warm-up", bars: 1 }, core: { label: "Core", bars: 2 }, stretch: { label: "Stretch", bars: 3 },
};
const LEVEL: Record<string, string> = { E: "Easy", M: "Medium", H: "Hard" };
const levelOf = (l: string) => LEVEL[l.trim().toUpperCase()] ?? (/^\d{3,4}\s*[–—-]\s*\d{3,4}$/.test(l.trim()) ? `Rating ${l.trim()}` : l);

const STATUSES: { s: ProblemStatus; label: string }[] = [
  { s: "solved", label: "Solved alone" },
  { s: "hint", label: "Needed a hint" },
  { s: "editorial", label: "Read the editorial" },
  { s: "skipped", label: "Skip" },
];

/* ---------------- List ---------------- */

export function PracticeList({ problems, intro }: { problems: Problem[]; intro?: string }) {
  const st = useProgress();
  const marks = problems.map((p) => st.problems[p.ref]?.s);
  const done = marks.filter((m) => m && m !== "skipped").length;
  const skipped = marks.filter((m) => m === "skipped").length;
  return (
    <div className="pr">
      {intro && <Text text={intro} className="pr-intro" />}
      <div className="pr-summary">
        <div className="pr-sum-text">
          <span className="tnum"><strong>{done} of {problems.length}</strong> done</span>
          {skipped > 0 && <span className="pr-sum-skip tnum"> · {skipped} skipped</span>}
        </div>
        <a className="pr-log" href="#tracker">Log a mistake</a>
      </div>
      <div className="pr-bar" aria-hidden="true"><i style={{ width: `${problems.length ? (100 * done) / problems.length : 0}%` }} /></div>
      <ol className="pr-list">
        {problems.map((p) => <ProblemCard key={p.ref} p={p} status={st.problems[p.ref]?.s ?? null} />)}
      </ol>
    </div>
  );
}

function ProblemCard({ p, status }: { p: Problem; status: ProblemStatus | null }) {
  const [clue, setClue] = useState(false);
  const clueId = useId();
  const url = problemUrl(p);
  const judge = judgeOf(p.ref);
  const tier = TIER[p.tier] ?? TIER.core;
  const finished = !!status && status !== "skipped";
  return (
    <li className={`pr-card ${finished ? "is-done" : ""} ${status === "skipped" ? "is-skipped" : ""}`}>
      <div className="pr-top">
        <div className="pr-meta">
          <span className="pr-tier" title={`Tier: ${tier.label}`}>
            <span className="pr-bars" aria-hidden="true">{[1, 2, 3].map((b) => <i key={b} className={b <= tier.bars ? "on" : ""} />)}</span>
            {tier.label}
          </span>
          {p.lvl && <span className="pr-lvl">{levelOf(p.lvl)}</span>}
          <span className="pr-box tnum"><IconClock size={14} />{p.box} min</span>
        </div>
        <div className="pr-title-row">
          <h3 className="pr-ref">
            {finished && <span className="pr-done-mark" aria-hidden="true"><IconCheck size={12} /></span>}
            {p.ref}
          </h3>
          {url && (
            <a className="pr-open" href={url} target="_blank" rel="noopener noreferrer" aria-label={`Open ${p.ref}${judge ? ` on ${judge}` : ""} (new tab)`}>
              Open<ExtIcon />
            </a>
          )}
        </div>
      </div>

      {p.clue && (
        <div className="pr-clue">
          <button type="button" data-own-enter="" className="pr-clue-btn" aria-expanded={clue} aria-controls={clueId} onClick={() => setClue(!clue)}>
            <Chevron open={clue} />{clue ? "Hide the clue" : "Show the clue"}
          </button>
          <AnimatePresence initial={false}>
            {clue && (
              <motion.div id={clueId} className="pr-clue-text" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}>
                <Text text={p.clue} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      <BoxTimer id={p.ref} minutes={p.box} />

      <div className="pr-status" role="group" aria-label={`How did ${p.ref} go?`}>
        {STATUSES.map(({ s, label }) => (
          <button key={s} type="button" data-own-enter="" className={`pr-st st-${s} ${status === s ? "on" : ""}`} aria-pressed={status === s}
            onClick={() => progress.setProblem(p.ref, status === s ? null : s)}>
            {status === s && s !== "skipped" && <IconCheck size={13} />}{label}
          </button>
        ))}
      </div>
    </li>
  );
}

/* ---------------- Practice step (lesson player) ---------------- */

const DEFAULT_INTRO = "Solve these on the judge sites. Start each time box when you start reading the problem. No AI help. When the box runs out, read the editorial and log what you missed.";

export function PracticeView({ step, past }: { step: PracticeStep; past?: boolean }) {
  return (
    <>
      {past && <p className="lp-past">You are looking back. Your marks are saved.</p>}
      <div className="lp-eyebrow">Practice</div>
      <h2 className="lp-title"><Inline text={step.title ?? "Today's problems"} /></h2>
      <PracticeList problems={step.problems} intro={step.intro ?? DEFAULT_INTRO} />
      <p className="pr-later">You can continue now and come back later. Your marks are saved in this browser.</p>
    </>
  );
}

/* ---------------- Time-box timer ---------------- */

type TimerState = { mode: "idle" } | { mode: "run"; endAt: number } | { mode: "pause"; left: number } | { mode: "over" };
const tkey = (id: string) => `cp30:box:${id}`;
function loadTimer(id: string): TimerState {
  try { const raw = sessionStorage.getItem(tkey(id)); if (raw) { const t = JSON.parse(raw) as TimerState; if (t && typeof t.mode === "string") return t; } } catch { /* blocked */ }
  return { mode: "idle" };
}
function saveTimer(id: string, t: TimerState) {
  try { if (t.mode === "idle") sessionStorage.removeItem(tkey(id)); else sessionStorage.setItem(tkey(id), JSON.stringify(t)); } catch { /* blocked */ }
}
const mmss = (ms: number) => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };

function BoxTimer({ id, minutes }: { id: string; minutes: number }) {
  const total = Math.max(1, minutes) * 60000;
  const [t, setT] = useState<TimerState>(() => loadTimer(id));
  const [now, setNow] = useState(() => Date.now());
  const reduced = useReducedMotion();
  const set = (n: TimerState) => { setT(n); saveTimer(id, n); setNow(Date.now()); };

  useEffect(() => {
    if (t.mode !== "run") return;
    const tick = () => { const n = Date.now(); setNow(n); if (n >= t.endAt) set({ mode: "over" }); };
    tick();
    const iv = setInterval(tick, 500);
    return () => clearInterval(iv);
  }, [t]); // eslint-disable-line react-hooks/exhaustive-deps

  if (t.mode === "idle") {
    return (
      <div className="pr-timer">
        <button type="button" data-own-enter="" className="pr-t-btn start" onClick={() => set({ mode: "run", endAt: Date.now() + total })}>
          <IconClock size={16} />Start the {minutes} min time box
        </button>
      </div>
    );
  }
  if (t.mode === "over") {
    return (
      <motion.div className="pr-timer pr-over" role="status" initial={reduced ? { opacity: 0 } : { opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}>
        <div className="pr-over-text">
          <strong>Time box over:</strong> stop, read the editorial, log it.
        </div>
        <div className="pr-over-row">
          <a className="pr-t-btn link" href="#tracker">Log it</a>
          <button type="button" data-own-enter="" className="pr-t-btn" onClick={() => set({ mode: "idle" })}>Reset timer</button>
        </div>
      </motion.div>
    );
  }
  const left = t.mode === "run" ? Math.max(0, t.endAt - now) : t.left;
  const frac = left / total;
  const R = 16, C = 2 * Math.PI * R;
  return (
    <div className={`pr-timer is-${t.mode}`}>
      <span className="pr-ring" role="timer" aria-label={`${Math.ceil(left / 60000)} minutes left${t.mode === "pause" ? ", paused" : ""}`}>
        <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true">
          <circle className="track" cx="20" cy="20" r={R} />
          <circle className="fill" cx="20" cy="20" r={R} strokeDasharray={C} strokeDashoffset={C * (1 - frac)} transform="rotate(-90 20 20)" />
        </svg>
      </span>
      <span className="pr-left tnum" aria-hidden="true">{mmss(left)}</span>
      <span className="pr-t-note">{t.mode === "pause" ? "Paused" : "left"}</span>
      <div className="pr-t-actions">
        {t.mode === "run"
          ? <button type="button" data-own-enter="" className="pr-t-btn" onClick={() => set({ mode: "pause", left })}>Pause</button>
          : <button type="button" data-own-enter="" className="pr-t-btn" onClick={() => set({ mode: "run", endAt: Date.now() + t.left })}>Resume</button>}
        <button type="button" data-own-enter="" className="pr-t-btn" onClick={() => set({ mode: "idle" })}>Stop</button>
      </div>
    </div>
  );
}

const ExtIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M14 5h5v5M19 5l-8 8M17 14v4a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 5 18V8.5A1.5 1.5 0 0 1 6.5 7H10" />
  </svg>
);
const Chevron = ({ open }: { open: boolean }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
    style={{ transform: open ? "rotate(90deg)" : "none", transition: "transform 160ms var(--ease-color)" }}>
    <path d="M9 5.5l6.5 6.5L9 18.5" />
  </svg>
);
