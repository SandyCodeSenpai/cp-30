// Run every code step's reference solution against its tests with local python3: bun tools/check-code.ts [chNN]
import { CHAPTERS } from "../src/content";
import { writeFileSync, mkdtempSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { spawnSync } from "child_process";
const only = process.argv[2];
const items: { at: string; solution: string; tests: unknown[] }[] = [];
for (const c of CHAPTERS) for (const l of c.lessons) l.steps.forEach((s, i) => {
  if (s.kind === "code" && (!only || l.id.startsWith(only))) items.push({ at: `${l.id} step ${i + 1}`, solution: s.solution, tests: s.tests });
});
const dir = mkdtempSync(join(tmpdir(), "cp30-code-"));
writeFileSync(join(dir, "items.json"), JSON.stringify(items));
const py = String.raw`
import json, sys, io, contextlib, signal
items = json.load(open(sys.argv[1]))
bad = 0
def norm(s): return s.split()
class TO(Exception): pass
def alarm(*a): raise TO()
signal.signal(signal.SIGALRM, alarm)
for it in items:
    for k, t in enumerate(it["tests"]):
        try:
            signal.alarm(5)
            if "call" in t:
                ns = {"__name__": "solution"}
                with contextlib.redirect_stdout(io.StringIO()):
                    exec(it["solution"], ns)
                    got = eval(t["call"], ns)
                want = eval(t["expect"], ns)
                ok = got == want
                if not ok: print(f"FAIL {it['at']} test {k+1}: {t['call']} -> {got!r}, expected {want!r}")
            else:
                out = io.StringIO()
                ns = {"__name__": "__main__"}
                old = sys.stdin; sys.stdin = io.TextIOWrapper(io.BytesIO(t["stdin"].encode()))
                try:
                    with contextlib.redirect_stdout(out):
                        exec(it["solution"], ns)
                finally:
                    sys.stdin = old
                ok = norm(out.getvalue()) == norm(t["stdout"])
                if not ok: print(f"FAIL {it['at']} test {k+1}: stdout {out.getvalue()!r}, expected {t['stdout']!r}")
            signal.alarm(0)
            if not ok: bad += 1
        except SystemExit:
            signal.alarm(0)
        except BaseException as e:
            signal.alarm(0); bad += 1
            print(f"ERROR {it['at']} test {k+1}: {type(e).__name__}: {e}")
print(f"code steps {len(items)} failures {bad}")
sys.exit(1 if bad else 0)
`;
writeFileSync(join(dir, "run.py"), py);
const r = spawnSync("python3", ["-I", join(dir, "run.py"), join(dir, "items.json")], { stdio: "inherit" });
process.exit(r.status ?? 1);
