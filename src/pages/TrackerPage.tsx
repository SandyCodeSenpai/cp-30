/**
 * Trackers (book chapter 12): progress table, daily log, mistake journal, re-solve queue, settings.
 * Everything is saved in this browser through @/state/progress.
 */
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Button, Chip, Icon, IconButton, Sheet } from "@/ui";
import { progress, useProgress, today as todayIso, type MistakeCategory, type ProgressState } from "@/state/progress";
import { PageHead } from "./common";
import { isDone } from "./course";
import { LAST_DAY, dateOfDay, lessonsForDay, linkFor, planDay, problemIndex, resolveQueue, shortTopicOf, whenLabel } from "./plan";

const TABS = [
  { id: "table", label: "Progress table" },
  { id: "log", label: "Daily log" },
  { id: "mistakes", label: "Mistakes" },
  { id: "resolve", label: "Re-solves" },
  { id: "settings", label: "Settings" },
] as const;
type TabId = (typeof TABS)[number]["id"];

export default function TrackerPage({ tab: routeTab }: { tab?: string }) {
  const valid = (t?: string): TabId => (TABS.some((x) => x.id === t) ? (t as TabId) : "table");
  const [tab, setTab] = useState<TabId>(valid(routeTab));
  useEffect(() => { setTab(valid(routeTab)); }, [routeTab]);
  const choose = (t: TabId) => { setTab(t); try { history.replaceState(null, "", t === "table" ? "#tracker" : `#tracker-${t}`); } catch { /* sandboxed */ } };
  const p = useProgress();
  const cur = planDay(p);
  const q = resolveQueue(p);
  const open = q.filter((r) => !r.clean).length;

  return (
    <div className="page tracker">
      <PageHead eyebrow={cur !== null && cur >= 0 && cur <= LAST_DAY ? `Day ${cur} of ${LAST_DAY}` : "Trackers"} title="Tracker"
        sub="Fill these in every day. The trackers show whether the month worked. Your feelings won't." />
      <div className="tk-tabs" role="tablist" aria-label="Tracker sections">
        {TABS.map((t) => (
          <button key={t.id} type="button" role="tab" id={`tk-tab-${t.id}`} aria-selected={tab === t.id} aria-controls={`tk-panel-${t.id}`}
            className={tab === t.id ? "on" : ""} onClick={() => choose(t.id)}>
            {t.label}{t.id === "mistakes" && p.mistakes?.length ? <span className="tk-n tnum">{p.mistakes.length}</span> : null}
            {t.id === "resolve" && open ? <span className="tk-n tnum">{open}</span> : null}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`tk-panel-${tab}`} aria-labelledby={`tk-tab-${tab}`} className="tk-panel">
        {tab === "table" && <ProgressTable p={p} />}
        {tab === "log" && <DailyLog p={p} />}
        {tab === "mistakes" && <Mistakes p={p} />}
        {tab === "resolve" && <Resolves p={p} />}
        {tab === "settings" && <Settings p={p} />}
      </div>
    </div>
  );
}

function Intro({ children }: { children: ReactNode }) { return <p className="tk-intro">{children}</p>; }

/* ---------------- Progress table ---------------- */

const TABLE_DAYS = [0, 7, 14, 21, 28, 30];
const METRICS: { key: string; label: string; none?: number[] }[] = [
  { key: "rec-pct", label: "Recognition: % correct (cards)" },
  { key: "rec-sec", label: "Recognition: average seconds per card" },
  { key: "timed", label: "Timed set: problems solved / 4" },
  { key: "total", label: "Total problems solved (running)" },
  { key: "lc-solved", label: "LeetCode contest: problems solved / 4", none: [0, 30] },
  { key: "lc-rating", label: "LeetCode contest rating", none: [0] },
  { key: "cf-rating", label: "Codeforces rating (if rated)", none: [0] },
  { key: "templates", label: "Templates you can write from memory (of 12)" },
  { key: "queue", label: "Re-solve queue length" },
];
const TEMPLATES = [
  "Binary search on the answer", "Sliding window", "Monotonic stack", "Prefix sum + map", "BFS (grid)", "DFS iterative",
  "DSU", "Topological sort", "Dijkstra", "Memoized DP", "Fenwick tree", "Fast I/O main template",
];
const TPL_KEY = "__templates";

/** Numbers the app already knows for a metric on a plan day (shown as a placeholder, filled on request). */
function suggest(p: ProgressState, key: string, day: number, cur: number | null): string {
  const date = dateOfDay(p, day);
  const t = todayIso();
  if (!date || date > t) return "";
  const tests = (p.gymRuns ?? []).filter((r) => r.kind === "test" && r.at === date);
  const last = tests[tests.length - 1];
  const done = Object.values(p.problems ?? {}).filter((m) => m.s !== "skipped" && m.at <= date).length;
  switch (key) {
    case "rec-pct": return last ? String(Math.round((last.right / Math.max(1, last.size)) * 100)) : "";
    case "rec-sec": return last ? (last.avgMs / 1000).toFixed(1) : "";
    case "total": return done ? String(done) : "";
    case "templates": { const n = Object.values(p.table?.[TPL_KEY] ?? {}).filter((v) => v === "1").length; return day === cur && n ? String(n) : ""; }
    case "queue": return day === cur ? String(resolveQueue(p).filter((r) => !r.clean).length) : "";
    default: return "";
  }
}

function ProgressTable({ p }: { p: ProgressState }) {
  const cur = planDay(p);
  const tpl = p.table?.[TPL_KEY] ?? {};
  const tplCount = TEMPLATES.filter((_, i) => tpl[i] === "1").length;
  const fill = (day: number) => {
    for (const m of METRICS) {
      if (m.none?.includes(day) || p.table?.[m.key]?.[day]) continue;
      const v = suggest(p, m.key, day, cur);
      if (v) progress.setTable(m.key, day, v);
    }
  };
  return (
    <>
      <Intro>Fill this in on Day 0, then on every review day (7, 14, 21, 28), then on Day 30. Gray numbers are what the site already knows; press "Fill" to copy them in.</Intro>
      <div className="tk-scroll" tabIndex={0} aria-label="Progress table, scrolls sideways">
        <table className="tk-table pt">
          <thead>
            <tr>
              <th scope="col">Metric</th>
              {TABLE_DAYS.map((d) => (
                <th key={d} scope="col" className={cur === d ? "cur" : ""}>
                  <span>Day {d}</span>
                  {METRICS.some((m) => !m.none?.includes(d) && !p.table?.[m.key]?.[d] && suggest(p, m.key, d, cur)) &&
                    <button type="button" className="tk-fill" onClick={() => fill(d)} aria-label={`Fill Day ${d} from your data`}>Fill</button>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {METRICS.map((m) => (
              <tr key={m.key}>
                <th scope="row">{m.label}</th>
                {TABLE_DAYS.map((d) => (
                  <td key={d} className={cur === d ? "cur" : ""}>
                    {m.none?.includes(d)
                      ? <span className="tk-none" aria-label="Not measured">—</span>
                      : <input className="tk-cell tnum" value={p.table?.[m.key]?.[d] ?? ""} placeholder={suggest(p, m.key, d, cur)}
                          aria-label={`${m.label}, Day ${d}`} inputMode="decimal" maxLength={12}
                          onChange={(e) => progress.setTable(m.key, d, e.target.value)} />}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="tk-sec" aria-labelledby="tpl-h">
        <div className="tk-sec-head"><h2 id="tpl-h" className="sec-title sm">The 12 templates</h2><span className="tk-count tnum">{tplCount} of 12</span></div>
        <Intro>Tick a template when you can type it from memory, correct on the first run. By Day 30 you should be able to write all of them without looking.</Intro>
        <ul className="tpl">
          {TEMPLATES.map((t, i) => (
            <li key={t}>
              <label className={`tpl-item${tpl[i] === "1" ? " on" : ""}`}>
                <input type="checkbox" className="ui-check" checked={tpl[i] === "1"} onChange={(e) => progress.setTable(TPL_KEY, i, e.target.checked ? "1" : "")} />
                <span>{t}</span>
              </label>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

/* ---------------- Daily log ---------------- */

function DailyLog({ p }: { p: ProgressState }) {
  const cur = planDay(p);
  const idx = problemIndex();
  const queue = resolveQueue(p);
  const lastDay = cur === null ? LAST_DAY : Math.max(0, Math.min(LAST_DAY, cur));
  const rows = Array.from({ length: lastDay + 1 }, (_, d) => d).reverse();
  return (
    <>
      <Intro>One row per day, filled in from your lessons, problem marks and re-solves. Hours are yours to log. {cur === null ? "Set your Day 1 in Settings to match problems to days by date." : "Future days appear as they arrive."}</Intro>
      <div className="tk-scroll" tabIndex={0} aria-label="Daily log, scrolls sideways">
        <table className="tk-table log">
          <thead>
            <tr><th scope="col">Day</th><th scope="col">Topic</th><th scope="col">Lessons</th><th scope="col">Alone</th><th scope="col">Hint</th><th scope="col">Editorial</th><th scope="col">Re-solves</th><th scope="col">Hours</th></tr>
          </thead>
          <tbody>
            {rows.map((d) => {
              const date = dateOfDay(p, d);
              const marks = Object.entries(p.problems ?? {}).filter(([ref, m]) => (date ? m.at === date : idx.get(ref)?.day === d)).map(([, m]) => m.s);
              const ls = lessonsForDay(d);
              const lsDone = ls.filter((f) => isDone(p, f.lesson)).length;
              const rs = date ? queue.reduce((a, r) => a + (r.d3done && r.d3 === date ? 1 : 0) + (r.d7done && r.d7 === date ? 1 : 0), 0) : null;
              const n = (s: string) => marks.filter((x) => x === s).length;
              return (
                <tr key={d} className={cur === d ? "cur" : ""}>
                  <th scope="row"><a href={`#today-${d}`}>Day {d}</a></th>
                  <td className="topic">{shortTopicOf(d)}</td>
                  <td className="tnum">{ls.length ? `${lsDone}/${ls.length}` : "—"}</td>
                  <td className="tnum">{n("solved") || ""}</td>
                  <td className="tnum">{n("hint") || ""}</td>
                  <td className="tnum">{n("editorial") || ""}</td>
                  <td className="tnum">{rs === null ? "—" : rs || ""}</td>
                  <td>
                    <input className="tk-cell tnum" type="number" min={0} max={16} step={0.25} value={p.hours?.[d] ?? ""} placeholder="0"
                      aria-label={`Hours on Day ${d}`} onChange={(e) => { const v = parseFloat(e.target.value); progress.setHours(d, Number.isFinite(v) ? v : 0); }} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <LogTotals p={p} />
    </>
  );
}

function LogTotals({ p }: { p: ProgressState }) {
  const marks = Object.values(p.problems ?? {});
  const solved = marks.filter((m) => m.s !== "skipped").length;
  const hours = Object.values(p.hours ?? {}).reduce((a, h) => a + (h || 0), 0);
  return (
    <div className="tk-totals">
      <div><span className="tnum">{solved}</span><small>problems done</small></div>
      <div><span className="tnum">{marks.filter((m) => m.s === "solved").length}</span><small>solved alone</small></div>
      <div><span className="tnum">{Math.round(hours * 10) / 10}</span><small>hours logged</small></div>
      <div><span className="tnum">{p.mistakes?.length ?? 0}</span><small>mistakes logged</small></div>
    </div>
  );
}

/* ---------------- Mistake journal ---------------- */

const CATEGORIES: MistakeCategory[] = ["misread", "wrong pattern", "right pattern, wrong details", "edge case", "off-by-one", "Python TLE", "recursion depth", "didn't know the technique"];

function Mistakes({ p }: { p: ProgressState }) {
  const [date, setDate] = useState(todayIso());
  const [problem, setProblem] = useState("");
  const [what, setWhat] = useState("");
  const [category, setCategory] = useState<MistakeCategory>("wrong pattern");
  const [rule, setRule] = useState("");
  const [saved, setSaved] = useState(false);
  const [confirm, setConfirm] = useState<string | null>(null);
  const firstRef = useRef<HTMLInputElement>(null);
  const refs = useMemo(() => [...new Set([...problemIndex().keys(), ...Object.keys(p.problems ?? {})])].sort(), [p.problems]);
  const list = p.mistakes ?? [];
  const counts = CATEGORIES.map((c) => ({ c, n: list.filter((m) => m.category === c).length })).filter((x) => x.n > 0).sort((a, b) => b.n - a.n);
  const max = Math.max(1, ...counts.map((x) => x.n));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!problem.trim() || !what.trim()) return;
    progress.addMistake({ date, problem: problem.trim(), what: what.trim(), category, rule: rule.trim() });
    setProblem(""); setWhat(""); setRule(""); setSaved(true);
    setTimeout(() => setSaved(false), 2400);
    firstRef.current?.focus();
  };

  return (
    <>
      <Intro>One line for every Wrong Answer, TLE, or solution you had to look up. On Day 29 you read the whole journal: the two biggest categories become your patch work.</Intro>
      <form className="mj-form" onSubmit={submit}>
        <div className="mj-row">
          <label className="ui-field mj-date"><span>Date</span><input className="ui-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} required /></label>
          <label className="ui-field mj-prob"><span>Problem</span><input ref={firstRef} className="ui-input" value={problem} onChange={(e) => setProblem(e.target.value)} placeholder="LC 3 Longest Substring Without Repeating Characters" list="mj-refs" required /></label>
        </div>
        <datalist id="mj-refs">{refs.map((r) => <option key={r} value={r} />)}</datalist>
        <label className="ui-field"><span>What went wrong</span><textarea className="ui-textarea" rows={2} value={what} onChange={(e) => setWhat(e.target.value)} placeholder="Moved the left pointer to last[c], not last[c] + 1" required /></label>
        <div className="mj-row wide">
          <label className="ui-field mj-cat"><span>Category</span>
            <select className="ui-select" value={category} onChange={(e) => setCategory(e.target.value as MistakeCategory)}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label className="ui-field mj-rule"><span>Rule for next time</span><input className="ui-input" value={rule} onChange={(e) => setRule(e.target.value)} placeholder="When moving left past a duplicate, use max(left, last[c] + 1)" /></label>
        </div>
        <div className="mj-actions">
          <Button variant="primary" type="submit" disabled={!problem.trim() || !what.trim()}><Icon name="plus" size={16} stroke={2.4} />Add to the journal</Button>
          <span className="mj-saved" role="status">{saved ? "Saved." : ""}</span>
        </div>
      </form>

      {counts.length > 0 && (
        <section className="tk-sec" aria-labelledby="mjc-h">
          <h2 id="mjc-h" className="sec-title sm">By category</h2>
          <ul className="mj-bars">
            {counts.map((x, i) => (
              <li key={x.c} className={i < 2 ? "top" : ""}>
                <span className="mj-bar-l">{x.c}</span>
                <span className="mj-bar"><span style={{ width: `${(x.n / max) * 100}%` }} /></span>
                <span className="mj-bar-n tnum">{x.n}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="tk-sec" aria-labelledby="mjl-h">
        <div className="tk-sec-head"><h2 id="mjl-h" className="sec-title sm">Journal</h2><span className="tk-count tnum">{list.length} {list.length === 1 ? "entry" : "entries"}</span></div>
        {list.length === 0 ? <div className="tk-empty">No mistakes logged yet. The first Wrong Answer is the first entry.</div> : (
          <ul className="mj-list">
            {list.map((m) => (
              <li key={m.id} className="mj-item">
                <div className="mj-top">
                  <span className="mj-when">{whenLabel(p, m.date)}</span>
                  <Chip>{m.category}</Chip>
                  <span className="mj-del">
                    {confirm === m.id
                      ? <><Button size="s" variant="danger" onClick={() => { progress.removeMistake(m.id); setConfirm(null); }}>Delete</Button><Button size="s" variant="ghost" onClick={() => setConfirm(null)}>Keep</Button></>
                      : <IconButton label={`Delete the entry for ${m.problem}`} onClick={() => setConfirm(m.id)}><Icon name="trash" size={17} /></IconButton>}
                  </span>
                </div>
                <div className="mj-prob-t">{m.problem}</div>
                <p className="mj-what">{m.what}</p>
                {m.rule && <p className="mj-rule-t"><span>Rule</span>{m.rule}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

/* ---------------- Re-solve queue ---------------- */

function Resolves({ p }: { p: ProgressState }) {
  const q = resolveQueue(p);
  const t = todayIso();
  const label = (iso: string) => (iso === t ? "Today" : whenLabel(p, iso).replace(/^./, (c) => c.toUpperCase()));
  return (
    <>
      <Intro>Every problem you marked "Hint" or "Editorial". Re-solve it from a blank file with a 15-minute box on Day +3, and once more on Day +7. Clean twice, and it leaves the queue.</Intro>
      {q.length === 0 ? <div className="tk-empty">The queue is empty. Problems you mark "Hint" or "Editorial" on the Today page appear here.</div> : (
        <ul className="rq">
          {q.map((r) => {
            const url = linkFor({ ref: r.ref });
            return (
              <li key={r.ref} className={`rq-item${r.clean ? " clean" : ""}${r.dueNow.length ? " due" : ""}`}>
                <div className="rq-main">
                  <div className="rq-t">{url ? <a href={url} target="_blank" rel="noreferrer noopener">{r.ref}</a> : r.ref}</div>
                  <div className="rq-m">First try {label(r.at).toLowerCase() === "today" ? "today" : label(r.at)}, {r.how === "hint" ? "with a hint" : "with the editorial"}{r.day !== undefined ? ` · Day ${r.day} list` : ""}</div>
                </div>
                <div className="rq-checks">
                  {(["d3", "d7"] as const).map((k) => {
                    const done = k === "d3" ? r.d3done : r.d7done;
                    const when = k === "d3" ? r.d3 : r.d7;
                    const due = !done && when <= t;
                    return (
                      <label key={k} className={`rq-check${due ? " due" : ""}`}>
                        <input type="checkbox" className="ui-check" checked={done} onChange={(e) => progress.setResolve(r.ref, k, e.target.checked)} />
                        <span><b>{k === "d3" ? "Day +3" : "Day +7"}</b><small>{done ? "Done" : due ? `Due ${when === t ? "today" : "now"}` : label(when)}</small></span>
                      </label>
                    );
                  })}
                  {r.clean ? <Chip tone="good"><Icon name="check" size={12} stroke={3} />Clean</Chip> : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

/* ---------------- Settings ---------------- */


function Settings({ p }: { p: ProgressState }) {
  const [day1, setDay1] = useState(p.day1 ?? todayIso());
  const [msg, setMsg] = useState("");
  const [resetOpen, setResetOpen] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (p.day1) setDay1(p.day1); }, [p.day1]);

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(progress.get(), null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `cp30-progress-${todayIso()}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    setMsg("Progress exported.");
  };
  const readFile = (f: File | undefined) => {
    if (!f) return;
    f.text().then((text) => {
      try {
        const obj = JSON.parse(text);
        if (!obj || typeof obj !== "object" || Array.isArray(obj) || !("done" in obj || "gym" in obj || "problems" in obj)) throw new Error("not a progress file");
        setPending(text);
      } catch { setMsg("That file is not a CP 30 progress file."); }
    }).catch(() => setMsg("The file could not be read."));
    if (fileRef.current) fileRef.current.value = "";
  };
  const applyImport = () => {
    if (!pending) return;
    try { progress.replaceAll(JSON.parse(pending)); setMsg("Progress imported."); }
    catch { setMsg("That file could not be imported. Nothing was changed."); }
    setPending(null);
  };

  return (
    <>
      <Intro>Your progress is saved only in this browser. Export it to keep a copy or to move to another device.</Intro>
      <div className="st-grid">
        <section className="st-card" aria-labelledby="st-d1">
          <h2 id="st-d1" className="st-t"><Icon name="calendar" size={18} />Your Day 1</h2>
          <p>Day 0 is the day before. Every page counts days from this date.{p.day1 && <> Today is <b>{(() => { const d = planDay(p); return d === null ? "" : d < 0 ? `${-d} days before Day 0` : `Day ${d}`; })()}</b>.</>}</p>
          <form className="st-row" onSubmit={(e) => { e.preventDefault(); if (/^\d{4}-\d{2}-\d{2}$/.test(day1)) { progress.setDay1(day1); setMsg("Day 1 saved."); } }}>
            <label className="ui-field"><span className="sr-only">Day 1</span><input className="ui-input" type="date" value={day1} onChange={(e) => setDay1(e.target.value)} required /></label>
            <Button type="submit" variant="secondary">Save</Button>
          </form>
        </section>
        <section className="st-card" aria-labelledby="st-ex">
          <h2 id="st-ex" className="st-t"><Icon name="download" size={18} />Export and import</h2>
          <p>A JSON file with lessons, problems, gym runs, mistakes and the tables.</p>
          <div className="st-row">
            <Button variant="secondary" onClick={exportJson}><Icon name="download" size={16} stroke={2} />Export</Button>
            <Button variant="secondary" onClick={() => fileRef.current?.click()}><Icon name="upload" size={16} stroke={2} />Import</Button>
            <input ref={fileRef} type="file" accept="application/json,.json" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => readFile(e.target.files?.[0])} />
          </div>
        </section>
        <section className="st-card" aria-labelledby="st-rs">
          <h2 id="st-rs" className="st-t"><Icon name="reset" size={18} />Start over</h2>
          <p>Delete all progress in this browser: lessons, XP, problems, gym, mistakes and Day 1.</p>
          <div className="st-row"><Button variant="secondary" className="st-danger" onClick={() => setResetOpen(true)}>Reset progress</Button></div>
        </section>
      </div>
      <p className="st-msg" role="status">{msg}</p>

      <Sheet open={resetOpen} onClose={() => setResetOpen(false)} label="Reset progress" width={440}>
        <div className="soft">
          <div className="soft-ico"><Icon name="trash" size={22} /></div>
          <h3 className="soft-title">Reset all progress?</h3>
          <p className="soft-text">This deletes everything saved in this browser. Export first if you want a copy. This cannot be undone.</p>
          <div className="soft-actions">
            <Button variant="danger" size="l" block onClick={() => { progress.reset(); setResetOpen(false); setMsg("Progress reset."); }}>Delete all progress</Button>
            <Button variant="secondary" size="l" block data-autofocus onClick={() => setResetOpen(false)}>Cancel</Button>
          </div>
        </div>
      </Sheet>
      <Sheet open={!!pending} onClose={() => setPending(null)} label="Import progress" width={440}>
        <div className="soft">
          <div className="soft-ico"><Icon name="upload" size={22} /></div>
          <h3 className="soft-title">Replace your progress?</h3>
          <p className="soft-text">The file replaces everything saved in this browser now.</p>
          <div className="soft-actions">
            <Button variant="primary" size="l" block onClick={applyImport}>Import the file</Button>
            <Button variant="secondary" size="l" block data-autofocus onClick={() => setPending(null)}>Cancel</Button>
          </div>
        </div>
      </Sheet>
    </>
  );
}
