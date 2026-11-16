/**
 * In-browser Python (Pyodide in a Web Worker). Loaded lazily on first use, then kept for the session.
 *
 *   const r = await runTests(code, step.tests);   // { results, stdout, error?, line?, timeout? }
 *
 * One run at a time (later calls queue). A run that takes longer than 5 s is stopped: the worker is terminated
 * and a fresh one starts loading in the background.
 */
import { useSyncExternalStore } from "react";
import type { CodeTest } from "@/content/types";
import { WORKER_SRC } from "./harness";

export interface TestResult {
  ok: boolean;
  /** test.label, else the call, else "Input N" */
  label: string;
  kind: "call" | "stdin";
  /** the call expression, or the stdin text */
  input: string;
  /** repr of the value (function test) or the printed stdout (stdin test) */
  got: string;
  expected: string;
  /** last line of the traceback, e.g. "ZeroDivisionError: division by zero" */
  error?: string;
  /** 1-based line in the reader's code where the error happened */
  line?: number;
  trace?: string;
  /** print() output during a function test */
  printed?: string;
  stderr?: string;
  /** the test did not run (the run stopped earlier) */
  notRun?: boolean;
  timeout?: boolean;
}
export interface RunResult {
  results: TestResult[];
  /** everything printed, all tests together (stdin tests: their stdout) */
  stdout: string;
  /** a problem with the whole run: syntax error, timeout, Python failed to load or crashed */
  error?: string;
  line?: number;
  trace?: string;
  timeout?: boolean;
  /** Python could not load (offline, blocked) */
  unavailable?: boolean;
  ms: number;
}

export const TIMEOUT_MS = 5000;
const LOAD_TIMEOUT_MS = 90000;
export const TIMEOUT_MSG = "Took longer than 5 s: an infinite loop or a too-slow solution";

/* ---------------- status store ---------------- */
/** idle: never loaded · loading: first download · restarting: a fresh worker after a timeout or crash */
export type PyStatus = "idle" | "loading" | "restarting" | "ready" | "failed";
let status: PyStatus = "idle";
let everReady = false;
const subs = new Set<() => void>();
function setStatus(s: PyStatus) { if (s !== status) { status = s; subs.forEach((f) => f()); } }
export const pyStatus = () => status;
export function usePyStatus(): PyStatus {
  return useSyncExternalStore((f) => { subs.add(f); return () => { subs.delete(f); }; }, pyStatus, pyStatus);
}

/* ---------------- worker ---------------- */
let worker: Worker | null = null;
let blobUrl: string | null = null;
let nextId = 1;

interface Pending {
  id: number;
  tests: CodeTest[];
  results: (TestResult | undefined)[];
  started: number;
  timer?: ReturnType<typeof setTimeout>;
  /** gives up if Python never finishes loading */
  loadTimer?: ReturnType<typeof setTimeout>;
  resolve: (r: RunResult) => void;
  onTest?: (i: number, r: TestResult) => void;
}
let cur: Pending | null = null;

const labelOf = (t: CodeTest, i: number) => t.label ?? ("call" in t ? t.call : `Input ${i + 1}`);
const baseOf = (t: CodeTest, i: number): Omit<TestResult, "ok" | "got"> => "call" in t
  ? { label: labelOf(t, i), kind: "call", input: t.call, expected: t.expect }
  : { label: labelOf(t, i), kind: "stdin", input: t.stdin, expected: t.stdout };

function spawn(): Worker | null {
  try {
    if (!blobUrl) blobUrl = URL.createObjectURL(new Blob([WORKER_SRC], { type: "text/javascript" }));
    const w = new Worker(blobUrl);
    w.onmessage = (e: MessageEvent) => onMessage(w, e.data);
    w.onerror = (e) => {
      e.preventDefault();
      if (w !== worker) return;
      kill();
      setStatus("failed");
      finish({ error: "Python could not start in this browser.", unavailable: true });
    };
    return w;
  } catch {
    return null;
  }
}
function ensure(): Worker | null {
  if (!worker) {
    worker = spawn();
    if (!worker) { setStatus("failed"); return null; }
    setStatus(everReady ? "restarting" : "loading");
  }
  return worker;
}
function kill() { worker?.terminate(); worker = null; }

/** Start loading Python now (for example when the reader first focuses an editor). Safe to call often. */
export function warmPython() {
  if (worker || status === "failed") return;
  ensure()?.postMessage({ type: "load" });
}

type Msg =
  | { type: "ready" }
  | { type: "loadError"; id?: number; message: string }
  | { type: "started"; id: number }
  | { type: "test"; id: number; i: number; result: Partial<TestResult> & { ok: boolean; got: string; expected: string } }
  | { type: "done"; id: number; ms?: number; syntax?: { error: string; line: number | null; trace: string } }
  | { type: "fatal"; id: number; message: string };

function onMessage(w: Worker, m: Msg) {
  if (w !== worker) return;
  switch (m.type) {
    case "ready": everReady = true; setStatus("ready"); return;
    case "loadError":
      kill(); setStatus("failed");
      finish({ error: "Python could not load. Check your internet connection, then run again.", unavailable: true });
      return;
    case "started":
      if (!cur || cur.id !== m.id) return;
      if (cur.loadTimer) clearTimeout(cur.loadTimer);
      cur.started = performance.now();
      cur.timer = setTimeout(onTimeout, TIMEOUT_MS);
      return;
    case "test": {
      if (!cur || cur.id !== m.id) return;
      const t = cur.tests[m.i];
      const r: TestResult = { ...baseOf(t, m.i), ...clean(m.result) };
      cur.results[m.i] = r;
      cur.onTest?.(m.i, r);
      return;
    }
    case "done":
      if (!cur || cur.id !== m.id) return;
      if (m.syntax) finish({ error: m.syntax.error, line: m.syntax.line ?? undefined, trace: m.syntax.trace });
      else finish(typeof m.ms === "number" ? { ms: m.ms } : {});
      return;
    case "fatal":
      if (!cur || cur.id !== m.id) return;
      kill();
      finish({ error: "Python stopped unexpectedly. Usually the recursion went too deep for the browser: try an iterative version, or run again." });
      warmPython();
      return;
  }
}
function clean(r: Partial<TestResult> & { ok: boolean; got: string; expected: string }): Partial<TestResult> & { ok: boolean; got: string } {
  const out: Partial<TestResult> & { ok: boolean; got: string } = { ok: r.ok, got: r.got };
  if (r.expected) out.expected = r.expected; // an error before eval(expect) keeps the test's own text
  if (r.error) { out.error = r.error; out.trace = r.trace; if (typeof r.line === "number") out.line = r.line; }
  if (r.printed) out.printed = r.printed;
  if (r.stderr) out.stderr = r.stderr;
  return out;
}

function onTimeout() {
  if (!cur) return;
  let at = 0;
  while (at < cur.tests.length && cur.results[at]) at++;
  kill();
  finish({ error: TIMEOUT_MSG, timeout: true }, at);
  warmPython(); // a fresh worker, ready for the next run
}

function finish(extra: Partial<RunResult>, timeoutAt = -1) {
  const p = cur; if (!p) return;
  cur = null;
  if (p.timer) clearTimeout(p.timer);
  if (p.loadTimer) clearTimeout(p.loadTimer);
  const results = p.tests.map((t, i): TestResult => p.results[i] ?? {
    ...baseOf(t, i), ok: false, got: "",
    ...(i === timeoutAt ? { error: TIMEOUT_MSG, timeout: true } : { notRun: true }),
  });
  const stdout = results.map((r) => (r.kind === "stdin" ? r.got : r.printed ?? "")).filter(Boolean).join("");
  p.resolve({ results, stdout, ms: p.started ? performance.now() - p.started : 0, ...extra });
}

let chain: Promise<unknown> = Promise.resolve();

/** Run the reader's code against the tests. Never rejects: problems come back in `error`. */
export function runTests(code: string, tests: CodeTest[], opts: { onTest?: (i: number, r: TestResult) => void } = {}): Promise<RunResult> {
  const job = chain.then(() => new Promise<RunResult>((resolve) => {
    const id = nextId++;
    cur = { id, tests, results: [], started: 0, resolve, onTest: opts.onTest };
    if (status === "failed") setStatus("idle"); // try again on a new run
    const w = ensure();
    if (!w) { finish({ error: "Python cannot run in this browser (Web Workers are blocked).", unavailable: true }); return; }
    cur.loadTimer = setTimeout(() => {
      if (!cur || cur.id !== id || cur.started) return;
      kill(); setStatus("failed");
      finish({ error: "Python is taking too long to load. Check your internet connection, then run again.", unavailable: true });
    }, LOAD_TIMEOUT_MS);
    w.postMessage({ type: "run", id, code, tests });
  }));
  chain = job.catch(() => undefined);
  return job;
}
