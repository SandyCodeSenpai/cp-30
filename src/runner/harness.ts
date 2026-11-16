/**
 * The Python side of the runner and the worker source. Both are plain strings: the worker is created from a Blob,
 * so it also works in the single-file build.
 *
 * Semantics match tools/check-code.ts:
 * - function test: exec the code in a fresh namespace (__name__ = "solution"), then eval(call) == eval(expect)
 *   in that namespace; print() output is captured. got / expected are reprs.
 * - stdin test: exec the code as __main__ with sys.stdin = TextIOWrapper(BytesIO(stdin)), so sys.stdin.readline,
 *   input() and sys.stdin.buffer all work; stdout is compared token by token (str.split()).
 * Differences that only make the browser kinder: sys.exit() in a stdin program ends it normally (the output is
 * still compared), sys.stdout.buffer works, and the recursion limit is restored after every test.
 */

/** Pyodide 0.26.4. The npm mirror is a fallback for hosts that only allow /npm/ paths on jsDelivr. */
export const PYODIDE_BASES = [
  "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/",
  "https://cdn.jsdelivr.net/npm/pyodide@0.26.4/",
];

export const USER_FILE = "<your code>";

const HARNESS_PY = String.raw`
import sys, io, json, traceback, linecache, contextlib

_U = "<your code>"
_LIM = sys.getrecursionlimit()
_CAP = 4000

def _cap(s):
    return s if len(s) <= _CAP else s[:_CAP] + "\n... (cut, " + str(len(s) - _CAP) + " more characters)"

def _reg(code):
    linecache.cache[_U] = (len(code), None, [l + "\n" for l in code.split("\n")], _U)

def _err(e):
    tb = [f for f in traceback.extract_tb(e.__traceback__) if f.filename == _U]
    line = tb[-1].lineno if tb else None
    if isinstance(e, SyntaxError) and e.filename == _U and e.lineno:
        line = e.lineno
    text = "".join(traceback.format_exception_only(type(e), e)).replace('File "' + _U + '", line', "Line").rstrip("\n")
    lines = [l for l in text.splitlines() if l.strip()]
    last = lines[-1].strip() if lines else type(e).__name__
    out = []
    if tb:
        out.append("Traceback (most recent call last):")
        for f in tb:
            out.append("  Line %d, in %s" % (f.lineno, f.name))
            if f.line:
                out.append("    " + f.line.strip())
    out.append(text)
    return {"error": _cap(last), "line": line, "trace": _cap("\n".join(out))}

def _cp_check(code):
    _reg(code)
    try:
        compile(code, _U, "exec")
        return ""
    except SyntaxError as e:
        return json.dumps(_err(e))
    except Exception as e:
        return json.dumps({"error": type(e).__name__ + ": " + str(e), "line": None, "trace": str(e)})

def _cp_run_one(code, tj):
    t = json.loads(tj)
    _reg(code)
    obj = compile(code, _U, "exec")
    ob = io.BytesIO()
    out = io.TextIOWrapper(ob, encoding="utf-8", newline="\n", write_through=True)
    err = io.StringIO()
    res = {"ok": False, "got": "", "expected": "", "printed": "", "stderr": ""}
    is_call = "call" in t
    old_in = sys.stdin
    try:
        if is_call:
            ns = {"__name__": "solution"}
            with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
                exec(obj, ns)
                got = eval(compile(t["call"], "<test>", "eval"), ns)
            want = eval(compile(t["expect"], "<test>", "eval"), ns)
            res["got"] = _cap(repr(got))
            res["expected"] = _cap(repr(want))
            res["ok"] = bool(got == want)
        else:
            ns = {"__name__": "__main__"}
            res["expected"] = _cap(t["stdout"])
            sys.stdin = io.TextIOWrapper(io.BytesIO(t["stdin"].encode("utf-8")), encoding="utf-8")
            with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
                try:
                    exec(obj, ns)
                except SystemExit:
                    pass
    except BaseException as e:
        res.update(_err(e))
    finally:
        sys.stdin = old_in
        sys.setrecursionlimit(_LIM)
        try:
            out.flush()
        except Exception:
            pass
        text = ob.getvalue().decode("utf-8", "replace")
        if is_call:
            res["printed"] = _cap(text)
        else:
            res["got"] = _cap(text)
            if "error" not in res:
                res["ok"] = text.split() == t["stdout"].split()
        res["stderr"] = _cap(err.getvalue())
    return json.dumps(res)
`;

/** Classic worker (importScripts). Messages in: {type:"load"} | {type:"run", id, code, tests}.
 *  Messages out: ready | loadError | started | test | done | fatal. */
export const WORKER_SRC = `
var BASES = ${JSON.stringify(PYODIDE_BASES)};
var HARNESS = ${JSON.stringify(HARNESS_PY)};
var py = null, loading = null, check = null, runOne = null;
function load() {
  if (!loading) {
    loading = (async function () {
      var lastErr = null;
      for (var i = 0; i < BASES.length; i++) {
        try {
          if (typeof loadPyodide === "undefined") importScripts(BASES[i] + "pyodide.js");
          py = await loadPyodide({ indexURL: BASES[i], stdout: function () {}, stderr: function () {} });
          py.runPython(HARNESS);
          check = py.globals.get("_cp_check");
          runOne = py.globals.get("_cp_run_one");
          return;
        } catch (e) { lastErr = e; }
      }
      throw lastErr || new Error("Python could not load");
    })();
    loading.catch(function () { loading = null; });
  }
  return loading;
}
function msg(e) { return String((e && e.message) || e).slice(0, 600); }
self.onmessage = async function (e) {
  var m = e.data;
  try { await load(); } catch (err) { postMessage({ type: "loadError", id: m.id, message: msg(err) }); return; }
  postMessage({ type: "ready" });
  if (m.type !== "run") return;
  postMessage({ type: "started", id: m.id });
  var t0 = performance.now();
  try {
    var syn = check(m.code);
    if (syn) { postMessage({ type: "done", id: m.id, syntax: JSON.parse(syn) }); return; }
    for (var i = 0; i < m.tests.length; i++) {
      var r = runOne(m.code, JSON.stringify(m.tests[i]));
      postMessage({ type: "test", id: m.id, i: i, result: JSON.parse(r) });
    }
    postMessage({ type: "done", id: m.id, ms: performance.now() - t0 });
  } catch (err) {
    postMessage({ type: "fatal", id: m.id, message: msg(err) });
  }
};
`;
