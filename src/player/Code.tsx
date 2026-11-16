/**
 * Code step: write real Python, run the tests in the browser (Pyodide), see each test pass or fail.
 * Not scored for accuracy. The player owns the bottom bar (Run tests, then Continue), XP and the success sheet;
 * this view owns the code text (a draft per step in localStorage), the run, the results and the solution panel.
 */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { CodeStep } from "@/content/types";
import { Button } from "@/ui";
import { runTests, usePyStatus, warmPython, type RunResult, type TestResult } from "@/runner";
import { CodeBlock, CodeEditor, replaceRange } from "./CodeEditor";
import { Inline, Text } from "./Text";
import { IconCheck, IconRetry, IconX } from "./icons";

export interface CodeState {
  /** the latest run */
  run?: RunResult;
  /** every test passed at least once */
  passed?: boolean;
  /** the reader opened the solution */
  solution?: boolean;
}

function hash(s: string): string { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); }
function loadDraft(key: string, starter: string): string {
  try {
    const raw = localStorage.getItem(key);
    if (raw) { const d = JSON.parse(raw) as { sig?: string; code?: string }; if (d.sig === hash(starter) && typeof d.code === "string") return d.code; }
  } catch { /* storage blocked */ }
  return starter;
}
function saveDraft(key: string, starter: string, code: string) {
  try {
    if (code === starter) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify({ sig: hash(starter), code }));
  } catch { /* storage blocked */ }
}

const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
export const RUN_KEY = isMac ? "⌘ Enter" : "Ctrl Enter";

export function CodeView({ step, state, draftKey, assist, past, reduced, register, onBusy, onResult, onSolution }: {
  step: CodeStep;
  state: CodeState;
  /** localStorage key for this step's draft */
  draftKey: string;
  assist?: ReactNode;
  past?: boolean;
  reduced: boolean;
  /** the player's "Run tests" button calls the function registered here */
  register: (fn: (() => void) | null) => void;
  onBusy: (busy: boolean) => void;
  onResult: (r: RunResult) => void;
  onSolution: () => void;
}) {
  const [code, setCode] = useState(() => loadDraft(draftKey, step.starter));
  const [busy, setBusy] = useState(false);
  const [live, setLive] = useState<TestResult[] | null>(null);
  const [ask, setAsk] = useState(false);
  const [showTrace, setShowTrace] = useState(false);
  const ta = useRef<HTMLTextAreaElement | null>(null);
  const resRef = useRef<HTMLDivElement>(null);
  const status = usePyStatus();
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);

  // Save the draft shortly after typing stops.
  useEffect(() => {
    const t = setTimeout(() => saveDraft(draftKey, step.starter, code), 300);
    return () => clearTimeout(t);
  }, [code, draftKey, step.starter]);

  const codeRef = useRef(code); codeRef.current = code;
  const busyRef = useRef(false);
  async function run() {
    if (busyRef.current) return;
    busyRef.current = true; setBusy(true); onBusy(true); setLive([]); setShowTrace(false);
    saveDraft(draftKey, step.starter, codeRef.current);
    const r = await runTests(codeRef.current, step.tests, { onTest: (i, t) => { if (alive.current) setLive((xs) => { const n = [...(xs ?? [])]; n[i] = t; return n; }); } });
    busyRef.current = false;
    if (!alive.current) return;
    setBusy(false); onBusy(false); setLive(null);
    onResult(r);
    requestAnimationFrame(() => resRef.current?.scrollIntoView({ block: "nearest", behavior: reduced ? "auto" : "smooth" }));
  }
  const runCb = useRef(run); runCb.current = run;
  useEffect(() => { register(() => runCb.current()); return () => register(null); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => onBusy(false), []); // eslint-disable-line react-hooks/exhaustive-deps

  function setAll(text: string) {
    const el = ta.current;
    if (el) replaceRange(el, 0, el.value.length, text, 0, 0);
    else setCode(text);
  }
  function showSolution() {
    if (step.fromMemory && !state.solution && !ask) { setAsk(true); return; }
    setAsk(false);
    onSolution();
  }

  const run0 = state.run;
  const errLine = !busy ? (run0?.line ?? run0?.results.find((r) => !r.ok && r.line)?.line) : undefined;
  const loading = busy && (status === "loading" || status === "restarting" || status === "idle");

  return (
    <>
      {past && <p className="lp-past">You are looking back. Your code is saved.</p>}
      <div className="lp-eyebrow">{step.fromMemory ? "From memory" : "Write code"}</div>
      {step.title && <h2 className="lp-title"><Inline text={step.title} /></h2>}
      <Text text={step.prompt} className="lp-body ce-prompt" />
      {assist && <div className="ce-assist">{assist}</div>}
      {step.fromMemory && !state.solution && <p className="ce-memory-note">Type it without looking. The solution stays hidden until you ask.</p>}

      <CodeEditor value={code} onChange={setCode} onRun={run} onFocus={warmPython} errorLine={errLine} label="Python code editor" taRef={ta} minLines={Math.min(10, Math.max(6, step.starter.split("\n").length + 2))} />

      <div className="ce-tools">
        <Button variant="tinted" onClick={run} disabled={busy} className="ce-run" data-own-enter="">
          <PlayIcon />{busy ? "Running" : "Run tests"}<kbd className="ce-kbd" aria-hidden="true">{RUN_KEY}</kbd>
        </Button>
        <Button variant="ghost" onClick={() => setAll(step.starter)} disabled={busy || code === step.starter} data-own-enter="">
          <IconRetry size={16} />Reset
        </Button>
        {!state.solution && <Button variant="ghost" onClick={showSolution} data-own-enter="">Show solution</Button>}
      </div>

      <AnimatePresence initial={false}>
        {ask && (
          <motion.div key="ask" className="ce-ask" role="alertdialog" aria-labelledby="ce-ask-t"
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
            <p id="ce-ask-t" className="ce-ask-title">Try once more first?</p>
            <p className="ce-ask-text">Typing a template from memory is how it sticks. Even a partial attempt helps. Run the tests and look at what fails.</p>
            <div className="ce-ask-row">
              <Button variant="tinted" data-own-enter="" onClick={() => { setAsk(false); ta.current?.focus(); }}>Try once more</Button>
              <Button variant="ghost" data-own-enter="" onClick={showSolution}>Show it anyway</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div ref={resRef} className="ce-results-wrap" aria-live="polite">
        {loading ? <Loading restarting={status === "restarting"} /> :
          busy ? <Results tests={step.tests.length} results={live ?? []} running /> :
          run0 ? <Results tests={step.tests.length} results={run0.results} run={run0} showTrace={showTrace} setShowTrace={setShowTrace} /> : null}
      </div>

      {state.solution && (
        <motion.div className="ce-solution" initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}>
          <div className="ce-sol-head">
            <span className="ce-sol-label">Solution</span>
            <Button variant="ghost" size="s" data-own-enter="" onClick={() => setAll(step.solution)}>Use this code</Button>
          </div>
          <CodeBlock code={step.solution} label="Solution code" />
          {step.explain && <Text text={step.explain} className="ce-sol-explain" />}
        </motion.div>
      )}
    </>
  );
}

const PlayIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" style={{ fill: "currentColor" }}><path d="M7 4.5v15a1 1 0 0 0 1.5.87l12-7.5a1 1 0 0 0 0-1.74l-12-7.5A1 1 0 0 0 7 4.5z" /></svg>
);

function Loading({ restarting }: { restarting: boolean }) {
  return (
    <div className="ce-loading" role="status">
      <span className="ce-spinner" aria-hidden="true" />
      <div>
        <div className="ce-loading-title">{restarting ? "Restarting Python" : "Loading Python, about 10 MB, once"}</div>
        <div className="ce-loading-sub">{restarting ? "A fresh Python is starting. Your tests run right after." : "Python runs here in your browser. After this, a run takes about a second."}</div>
      </div>
    </div>
  );
}

function Results({ tests, results, run, running, showTrace, setShowTrace }: {
  tests: number; results: (TestResult | undefined)[]; run?: RunResult; running?: boolean;
  showTrace?: boolean; setShowTrace?: (v: boolean) => void;
}) {
  const done = results.filter(Boolean) as TestResult[];
  const pass = done.filter((r) => r.ok).length;
  const all = !running && !run?.error && pass === tests;
  const head = running ? `Running test ${Math.min(done.length + 1, tests)} of ${tests}` :
    run?.timeout ? "Stopped" : run?.error && !done.some((r) => !r.notRun) ? "Could not run" :
    all ? `All ${tests} tests pass` : `${pass} of ${tests} tests pass`;
  return (
    <div className={`ce-results ${all ? "is-pass" : ""}`}>
      <div className="ce-res-head">
        <span className={`ce-res-icon ${all ? "good" : running ? "run" : "bad"}`} aria-hidden="true">
          {all ? <IconCheck size={15} /> : running ? <span className="ce-spinner sm" /> : <IconX size={14} />}
        </span>
        <span className="ce-res-title">{head}</span>
        {run && !run.error && run.ms > 0 && <span className="ce-res-ms tnum">{run.ms < 1 ? "under 1 ms" : run.ms < 1000 ? `${Math.round(run.ms)} ms` : `${(run.ms / 1000).toFixed(1)} s`}</span>}
      </div>
      {run?.error && (
        <div className="ce-err" role="alert">
          <div className="ce-err-main">
            {run.line && <span className="ce-err-line">Line {run.line}</span>}
            {run.timeout || run.unavailable ? <span className="ce-err-plain">{run.error}</span> : <code className="ce-err-msg">{run.error}</code>}
          </div>
          {run.timeout && <p className="ce-err-help">Look for a loop whose condition never becomes false, or a step that does too much work per item.</p>}
          {run.trace && setShowTrace && (
            <>
              <button type="button" data-own-enter="" className="ce-trace-btn" aria-expanded={!!showTrace} onClick={() => setShowTrace(!showTrace)}>
                {showTrace ? "Hide the full error" : "Show the full error"}
              </button>
              {showTrace && <pre className="ce-trace">{run.trace}</pre>}
            </>
          )}
        </div>
      )}
      <ol className="ce-tests">
        {Array.from({ length: tests }, (_, i) => results[i]).map((r, i) =>
          r ? <TestRow key={i} r={r} n={i + 1} /> : running ? <li key={i} className="ce-test is-wait"><span className="ce-t-mark" aria-hidden="true" /><span className="ce-t-label muted">Test {i + 1}</span></li> : null,
        )}
      </ol>
    </div>
  );
}

function TestRow({ r, n }: { r: TestResult; n: number }) {
  const [open, setOpen] = useState(false);
  const state = r.ok ? "ok" : r.notRun ? "skip" : "bad";
  const multi = r.kind === "stdin";
  const showBody = state === "bad" || open;
  return (
    <li className={`ce-test is-${state}`}>
      <div className="ce-t-row">
        <span className="ce-t-mark" aria-hidden="true">{r.ok ? <IconCheck size={13} /> : r.notRun ? "" : <IconX size={12} />}</span>
        <span className="sr-only">{r.ok ? "Passed:" : r.notRun ? "Not run:" : "Failed:"}</span>
        <code className="ce-t-label" title={r.label}>{r.label || `Test ${n}`}</code>
        {r.ok && <button type="button" data-own-enter="" className="ce-t-more" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? "Hide" : "Details"}</button>}
        {r.notRun && <span className="ce-t-note">Not run</span>}
      </div>
      {showBody && !r.notRun && (
        <div className="ce-t-body">
          {r.kind === "stdin" && <Field label="Input" value={r.input} multi />}
          {r.error ? (
            <div className="ce-t-err">
              {r.line && <span className="ce-err-line">Line {r.line}</span>}
              {r.timeout ? <span className="ce-err-plain">Stopped here after 5 s.</span> : <code className="ce-err-msg">{r.error}</code>}
            </div>
          ) : (
            <Field label="Got" value={r.got} multi={multi} tone={r.ok ? "good" : "bad"} />
          )}
          <Field label="Expected" value={r.expected} multi={multi} />
          {r.kind === "stdin" && r.error && r.got && <Field label="Printed before the error" value={r.got} multi />}
          {r.printed && <Field label="Printed" value={r.printed} multi />}
          {r.stderr && <Field label="stderr" value={r.stderr} multi />}
        </div>
      )}
    </li>
  );
}

function Field({ label, value, multi, tone }: { label: string; value: string; multi?: boolean; tone?: "good" | "bad" }) {
  const v = value.replace(/\n+$/, "");
  return (
    <div className={`ce-f ${multi ? "multi" : ""}`}>
      <span className="ce-f-label">{label}</span>
      <code className={`ce-f-val ${tone ?? ""}`}>{v === "" ? <span className="muted">(nothing)</span> : v}</code>
    </div>
  );
}
