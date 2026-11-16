import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { motion } from "framer-motion";
import { springs } from "@/ui";

const LH = 21;   // line height in px (matches .kit-code-line)
const PAD = 10;  // top padding of the code body

const KW = /^(def|return|while|for|in|if|elif|else|and|or|not|continue|from|import|True|False|None)$/;
const BI = /^(len|range|enumerate|max|min|sum|defaultdict)$/;

/** Tiny, calm Python highlighter: keywords bold, builtins softer, comments muted. */
function paint(line: string): ReactNode[] {
  const hash = line.indexOf("#");
  const code = hash >= 0 ? line.slice(0, hash) : line;
  const out: ReactNode[] = [];
  code.split(/(\b[A-Za-z_]+\b)/).forEach((part, i) => {
    if (!part) return;
    if (KW.test(part)) out.push(<span key={i} className="kw">{part}</span>);
    else if (BI.test(part)) out.push(<span key={i} className="bi">{part}</span>);
    else out.push(part);
  });
  if (hash >= 0) out.push(<span key="c" className="cm">{line.slice(hash)}</span>);
  return out;
}

/** The Python template with the running line(s) highlighted. `maxHeight` keeps it short in lessons and follows the active line. */
export function CodePanel({ code, active, title, maxHeight, reduce }: { code: string; active: number[]; title: string; maxHeight?: number; reduce: boolean }) {
  const lines = useMemo(() => code.split("\n"), [code]);
  const body = useRef<HTMLDivElement>(null);
  const lo = Math.min(...active), hi = Math.max(...active);
  const on = new Set(active);
  // Contiguous runs of active lines, each gets its own highlight band.
  const runs: [number, number][] = [];
  [...on].sort((x, y) => x - y).forEach((l) => {
    const r = runs[runs.length - 1];
    if (r && l === r[1] + 1) r[1] = l; else runs.push([l, l]);
  });

  useEffect(() => {
    const el = body.current;
    if (!el || !maxHeight) return;
    const mid = PAD + ((lo + hi) / 2 - 0.5) * LH;
    const k = Math.round((mid - el.clientHeight / 2 - PAD) / LH);   // snap to a whole line
    el.scrollTo({ top: k <= 0 ? 0 : PAD + k * LH, behavior: reduce ? "auto" : "smooth" });
  }, [lo, hi, maxHeight, reduce]);

  return (
    <section className="kit-code" aria-label={`Python code: ${title}`}>
      <div className="kit-code-head"><span>Python</span><span className="kit-code-title">{title}</span></div>
      <div className="kit-code-body" ref={body} style={maxHeight ? { maxHeight } : undefined}>
        <div className="kit-code-inner" style={{ paddingTop: PAD, paddingBottom: PAD }}>
          {runs.map(([a, b], i) => (
            <motion.div key={i} className="kit-code-hl" aria-hidden="true" initial={i === 0 ? false : { opacity: 0, y: PAD + (a - 1) * LH, height: (b - a + 1) * LH }}
              animate={{ opacity: 1, y: PAD + (a - 1) * LH, height: (b - a + 1) * LH }}
              transition={reduce ? { duration: 0.12 } : springs.snappy} />
          ))}
          {lines.map((l, i) => (
            <div key={i} className={`kit-code-line${on.has(i + 1) ? " on" : ""}`} aria-current={on.has(i + 1) ? "step" : undefined}>
              <span className="kit-code-no" aria-hidden="true">{i + 1}</span>
              <code>{l ? paint(l) : " "}</code>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
