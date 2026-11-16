import { useEffect, useId, useRef } from "react";
import { motion } from "framer-motion";
import { springs } from "@/ui";
import { useReducedMotion, useWidth } from "@/lib/hooks";
import { clamp } from "@/lib/format";
import type { DPFrame, Dep, DepKind, TableSpec } from "./engine";
import { Rich } from "./kit/player";

const HH = 20; // header row height
const kk = (r: number, c: number) => `${r},${c}`;
const textW = (s: string, px = 7.6) => s.length * px;

/** The DP table as one SVG: headers, cells (base shaded, rocks striped), the arrows the current cell reads, the traceback path. */
export function DPTable({ spec, f, onCell, cellLabel }: { spec: TableSpec; f: DPFrame; onCell?: (r: number, c: number) => void; cellLabel?: (r: number, c: number) => string }) {
  const wrap = useRef<HTMLDivElement>(null);
  const measured = useWidth(wrap);
  const W = measured || 600;
  const reduce = useReducedMotion();
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");

  const lastHead = spec.rowHeads.length - 1;
  const headWs = spec.rowHeads.map((h, i) => {
    let w = Math.max(22, ...h.cells.map((s) => textW(s, h.strong ? 9 : 7.6) + 14), textW(h.name, 7) + 12);
    if (i === lastHead) w = Math.max(w, ...spec.colHeads.map((ch) => textW(ch.name, 7) + 14));
    return Math.ceil(w);
  });
  const headTotal = headWs.reduce((s, x) => s + x, 0);
  const tagW = spec.tags ? 46 : 0;
  const minCs = spec.rows === 1 ? (W < 420 ? 26 : 30) : 34;
  const cs = clamp(Math.floor((W - headTotal - tagW - 6) / spec.cols), minCs, spec.rows === 1 ? 54 : 52);
  const rowNames = spec.rowHeads.some((h) => h.name);
  const top = spec.colHeads.length * HH + (rowNames ? HH : 0) + 6;
  const x0 = headTotal + 2;
  const arcH = spec.arcs ? Math.round(cs * 0.95) + 8 : 0;
  const svgW = x0 + spec.cols * cs + tagW + 2;
  const svgH = top + spec.rows * cs + arcH + 4;
  const cx = (c: number) => x0 + c * cs + cs / 2;
  const cy = (r: number) => top + r * cs + cs / 2;
  const fs = cs >= 44 ? 15 : cs >= 36 ? 14 : 13;

  const base = new Set(spec.base), blocked = new Set(spec.blocked), fresh = new Set(f.fresh ?? []);
  const pathSet = new Set((f.path ?? []).map(([r, c]) => kk(r, c)));
  const depMap = new Map<string, DepKind>(); (f.deps ?? []).forEach((d) => depMap.set(kk(d.r, d.c), d.kind));
  const curKey = f.cur ? kk(f.cur[0], f.cur[1]) : "";
  const ansKey = f.answer ? kk(f.answer[0], f.answer[1]) : "";
  const hiC = new Set(f.hiCols ?? []), hiR = new Set(f.hiRows ?? []);

  // keep the active cell in view when the table scrolls sideways
  const focusCol = f.cur?.[1] ?? f.path?.[f.path.length - 1]?.[1] ?? f.answer?.[1];
  useEffect(() => {
    const el = wrap.current; if (!el || focusCol === undefined) return;
    if (el.scrollWidth <= el.clientWidth + 1) return;
    const x = x0 + focusCol * cs + cs / 2;
    const left = clamp(x - el.clientWidth / 2, 0, el.scrollWidth - el.clientWidth);
    if (Math.abs(left - el.scrollLeft) > cs / 2) el.scrollTo({ left, behavior: reduce ? "auto" : "smooth" });
  }, [focusCol, cs, x0, reduce]);

  const deps = f.deps ?? [];
  const arrow = (d: Dep, i: number) => {
    if (!f.cur) return null;
    const [tr, tc] = f.cur;
    if (d.r === tr && d.c === tc) return null;
    const cls = `dpt-arrow k-${d.kind}`;
    const marker = `url(#${uid}-${d.kind})`;
    if (spec.arcs && d.r === tr) {
      const by = top + (tr + 1) * cs - 2;
      const dist = Math.abs(d.c - tc);
      const h = Math.min(arcH - 6, 12 + dist * cs * 0.24);
      const spread = (i - (deps.length - 1) / 2) * Math.min(12, cs * 0.24);
      const sx = cx(d.c) + (d.c < tc ? 4 : -4), tx = cx(tc) + spread;
      return <path key={i} className={cls} d={`M ${sx} ${by} C ${sx} ${by + h} ${tx} ${by + h} ${tx} ${by + 3}`} markerEnd={marker} />;
    }
    const sx = cx(d.c), sy = cy(d.r), tx = cx(tc), ty = cy(tr);
    const dx = tx - sx, dy = ty - sy, len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len;
    const a = cs * 0.24, b = cs * 0.34;
    return <line key={i} className={cls} x1={sx + ux * a} y1={sy + uy * a} x2={tx - ux * b} y2={ty - uy * b} markerEnd={marker} />;
  };

  const tone = f.answerTone ?? "good";
  return (
    <div className="dpt-scroll" ref={wrap}>
      <svg className="dpt-svg" width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`} style={{ width: svgW, height: svgH }} role="img"
        aria-label={`DP table, ${spec.rows} by ${spec.cols}.${f.cur ? ` Current cell row ${f.cur[0]}, column ${f.cur[1]}.` : ""}`}>
        <defs>
          {(["pick", "read", "bad", "ok"] as DepKind[]).map((kd) => (
            <marker key={kd} id={`${uid}-${kd}`} viewBox="0 0 10 10" refX="7" refY="5" markerWidth="9" markerHeight="9" markerUnits="userSpaceOnUse" orient="auto-start-reverse">
              <path d="M0,0.5 L10,5 L0,9.5 z" className={`dpt-ah k-${kd}`} />
            </marker>
          ))}
          <pattern id={`${uid}-rock`} width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="7" height="7" className="dpt-rock-bg" /><line x1="0" y1="0" x2="0" y2="7" className="dpt-rock-line" />
          </pattern>
        </defs>

        {/* column headers */}
        {spec.colHeads.map((h, hi) => (
          <g key={`ch${hi}`}>
            <text x={x0 - 6} y={hi * HH + 14} textAnchor="end" className="dpt-hname">{h.name}</text>
            {h.cells.map((s, c) => {
              const on = h.strong && hiC.has(c);
              return (
                <g key={c}>
                  {on && <rect x={cx(c) - 11} y={hi * HH + 1} width={22} height={HH - 2} rx={6} className="dpt-hhi" />}
                  <text x={cx(c)} y={hi * HH + 14} textAnchor="middle" className={`dpt-head${h.strong ? " strong" : ""}${on ? " on" : ""}`}>{s}</text>
                </g>
              );
            })}
          </g>
        ))}

        {/* row headers */}
        {spec.rowHeads.map((h, hi) => {
          const left = headWs.slice(0, hi).reduce((s, x) => s + x, 0);
          const mid = left + headWs[hi] / 2;
          return (
            <g key={`rh${hi}`}>
              {h.name && <text x={mid} y={top - 9} textAnchor="middle" className="dpt-hname">{h.name}</text>}
              {h.cells.map((s, r) => {
                const on = h.strong && hiR.has(r);
                return (
                  <g key={r}>
                    {on && <rect x={mid - Math.max(11, textW(s, 9) / 2 + 5)} y={cy(r) - 10} width={Math.max(22, textW(s, 9) + 10)} height={20} rx={6} className="dpt-hhi" />}
                    <text x={mid} y={cy(r) + 4.5} textAnchor="middle" className={`dpt-head${h.strong ? " strong" : ""}${on ? " on" : ""}`}>{s}</text>
                  </g>
                );
              })}
            </g>
          );
        })}

        {/* cells */}
        {f.vals.map((row, r) => row.map((v, c) => {
          const key = kk(r, c);
          const cls = ["dpt-cell"];
          if (v === null) cls.push("empty");
          if (base.has(key)) cls.push("base");
          if (fresh.has(key)) cls.push("fresh");
          if (pathSet.has(key)) cls.push("path");
          if (depMap.has(key)) cls.push(`dep k-${depMap.get(key)}`);
          if (key === ansKey) cls.push(`answer t-${tone}`);
          if (key === curKey) cls.push("cur");
          return (
            <rect key={key} x={x0 + c * cs + 2} y={top + r * cs + 2} width={cs - 4} height={cs - 4} rx={7} className={cls.join(" ")}
              style={blocked.has(key) ? { fill: `url(#${uid}-rock)` } : undefined} />
          );
        }))}

        {/* traceback path */}
        {f.path && f.path.length > 1 && (
          <polyline className="dpt-path" points={f.path.map(([r, c]) => `${cx(c)},${cy(r)}`).join(" ")} />
        )}

        {/* values */}
        {f.vals.map((row, r) => row.map((v, c) => v === null ? null : (
          <text key={`v${r},${c}`} x={cx(c)} y={cy(r) + fs * 0.36} textAnchor="middle" className={`dpt-val${blocked.has(kk(r, c)) ? " rock" : ""}${kk(r, c) === curKey ? " cur" : ""}`} style={{ fontSize: v.length > 2 ? Math.max(12, fs - 2) : fs }}>{v}</text>
        )))}

        {/* arrows */}
        {deps.map(arrow)}

        {/* cursor ring */}
        {f.cur && (
          <motion.rect className="dpt-cursor" width={cs - 2} height={cs - 2} rx={8} initial={false}
            animate={{ x: x0 + f.cur[1] * cs + 1, y: top + f.cur[0] * cs + 1 }} transition={reduce ? { duration: 0 } : springs.snappy} />
        )}

        {/* row tags (prev / cur) */}
        {spec.tags && f.rowTags?.map((t, r) => t && (
          <g key={`t${r}`}>
            <rect x={x0 + spec.cols * cs + 6} y={cy(r) - 10} width={tagW - 8} height={20} rx={10} className={`dpt-tag-bg${t === "cur" || t === "row" ? " on" : ""}`} />
            <text x={x0 + spec.cols * cs + 6 + (tagW - 8) / 2} y={cy(r) + 4} textAnchor="middle" className={`dpt-tag${t === "cur" || t === "row" ? " on" : ""}`}>{t}</text>
          </g>
        ))}

        {/* click targets (grid mode: toggle rocks) */}
        {onCell && f.vals.map((row, r) => row.map((_, c) => (r === 0 && c === 0) ? null : (
          <rect key={`h${r},${c}`} x={x0 + c * cs} y={top + r * cs} width={cs} height={cs} className="dpt-hit" role="button" tabIndex={0}
            aria-label={cellLabel ? cellLabel(r, c) : `Cell ${r}, ${c}`}
            onClick={() => onCell(r, c)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); onCell(r, c); } }} />
        )))}
      </svg>
    </div>
  );
}

/** The recurrence with numbers plugged in, plus the arrow key (what each arrow means and its value). */
export function Formula({ f, spec }: { f: DPFrame; spec: TableSpec }) {
  return (
    <div className="dpt-formula" aria-live="polite">
      {f.chip && <div className="dpt-chip">{f.chip}</div>}
      {f.sym ? (
        <div className="dpt-eq"><code className="dpt-sym">{f.sym}</code>{f.num && <code className="dpt-num">{f.num}</code>}</div>
      ) : f.trace ? <div className="dpt-eq"><span className="dpt-tracecap">Trace back the choices from the answer cell</span></div> : <div className="dpt-eq dpt-eq-empty" />}
      {f.deps && f.deps.length > 0 && (
        <div className="dpt-legend">
          {f.deps.map((d, i) => (
            <span key={i} className={`dpt-leg k-${d.kind}`}><i aria-hidden="true" /><Rich text={d.label} />: <b>{d.value}</b></span>
          ))}
        </div>
      )}
      {f.note && <div className="dpt-note">{f.note}</div>}
      <div className="dpt-key" aria-hidden="true">
        {spec.base.length > 0 && <span><i className="sw base" />base case</span>}
        {spec.blocked.length > 0 && <span><i className="sw rock" />rock</span>}
        {spec.fresh && <span><i className="sw fresh" />updated in this pass</span>}
        <span><i className="sw cur" />current cell</span>
        {f.answer && <span><i className={`sw answer t-${f.answerTone ?? "good"}`} />answer</span>}
      </div>
    </div>
  );
}
