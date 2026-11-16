import { useId, useRef } from "react";
import { motion } from "framer-motion";
import { springs } from "@/ui";
import { useReducedMotion, useWidth } from "@/lib/hooks";
import { clamp } from "@/lib/format";
import type { LisFrame, LisMode } from "./engine";

const HEAD = 70;

/** One SVG for both modes: the array a, the dp row under it, then either the tails array or the O(n^2) check table. */
export function LisView({ a, f, mode }: { a: number[]; f: LisFrame; mode: LisMode }) {
  const wrap = useRef<HTMLDivElement>(null);
  const W = useWidth(wrap) || 600;
  const reduce = useReducedMotion();
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const n = a.length;
  const cs = clamp(Math.floor((W - HEAD - 6) / n), 28, 52);
  const x = (i: number) => HEAD + i * cs;
  const mx = (i: number) => HEAD + i * cs + cs / 2;
  const fs = cs >= 44 ? 15 : cs >= 34 ? 14 : 13;
  const dh = Math.max(26, Math.round(cs * 0.62));
  const done = f.k < 0 && !!f.lis;
  const lisSet = new Set(f.lis ?? []);

  const arcH = mode === "quadratic" ? Math.round(cs * 0.95) + 10 : 0;
  const aTop = arcH + 22;
  const dpTop = aTop + cs + 6;
  // tails mode geometry
  const tHead = dpTop + dh + 52;
  const tTop = tHead + 8;
  // quadratic geometry
  const th = clamp(Math.round(cs * 0.72), 26, 36);
  const qTitle = dpTop + dh + 26;
  const qTop = qTitle + 10;
  const svgW = HEAD + n * cs + 4;
  const svgH = mode === "tails" ? tTop + cs + 40 : qTop + (n - 1) * th + 6;

  const aState = (i: number) => {
    if (done) return lisSet.has(i) ? "lis" : "";
    if (i === f.k) return "cur";
    if (mode === "quadratic" && i === f.j) return f.cmp === "no" ? "cmp-no" : f.cmp === "up" ? "cmp-up" : "cmp-keep";
    if (f.k >= 0 && i > f.k) return "future";
    if (f.k < 0 && !done) return "future";
    return "";
  };

  const slots = f.tails.length + (done ? 0 : 1); // one ghost slot shows where an append would land

  return (
    <div className="lis-scroll" ref={wrap}>
      <svg className="lis-svg" width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`} style={{ width: svgW, height: svgH }} role="img"
        aria-label={mode === "tails" ? `Array a and the tails array: ${f.tails.join(", ") || "empty"}` : `Array a and the dp row: ${f.dp.join(", ")}`}>
        <defs>
          {["acc", "mut", "bad"].map((t) => (
            <marker key={t} id={`${uid}-${t}`} viewBox="0 0 10 10" refX="7" refY="5" markerWidth="9" markerHeight="9" markerUnits="userSpaceOnUse" orient="auto-start-reverse">
              <path d="M0,0.5 L10,5 L0,9.5 z" className={`lis-ah ${t}`} />
            </marker>
          ))}
        </defs>

        {/* index header + labels */}
        {a.map((_, i) => <text key={`ix${i}`} x={mx(i)} y={aTop - 7} textAnchor="middle" className="lis-idx">{i}</text>)}
        <text x={HEAD - 10} y={aTop + cs / 2 + 5} textAnchor="end" className="lis-lab">a</text>
        <text x={HEAD - 10} y={dpTop + dh / 2 + 5} textAnchor="end" className="lis-lab">dp</text>
        {mode === "tails" && <text x={HEAD - 10} y={dpTop + dh / 2 + 19} textAnchor="end" className="lis-sub">O(n²)</text>}

        {/* quadratic: the comparison arc j -> k above the array */}
        {mode === "quadratic" && f.j !== undefined && f.k >= 0 && (() => {
          const sx = mx(f.j) + cs * 0.18, tx = mx(f.k) - cs * 0.18, y = aTop - 16;
          const h = Math.min(arcH - 4, 14 + (f.k - f.j) * cs * 0.22);
          const t = f.cmp === "no" ? "mut" : f.cmp === "up" ? "acc" : "mut";
          return <path className={`lis-arc ${f.cmp}`} d={`M ${sx} ${y} C ${sx} ${y - h} ${tx} ${y - h} ${tx} ${y}`} markerEnd={`url(#${uid}-${t})`} />;
        })()}

        {/* a row */}
        {a.map((v, i) => (
          <g key={`a${i}`}>
            <rect x={x(i) + 2} y={aTop} width={cs - 4} height={cs - 4} rx={8} className={`lis-cell ${aState(i)}`} />
            <text x={mx(i)} y={aTop + (cs - 4) / 2 + fs * 0.36} textAnchor="middle" className={`lis-val ${aState(i)}`} style={{ fontSize: String(v).length > 2 ? Math.max(12, fs - 2) : fs }}>{v}</text>
          </g>
        ))}

        {/* dp row */}
        {f.dp.map((v, i) => {
          const on = (mode === "quadratic" && i === f.k) || (mode === "tails" && i === f.k && f.act === "find");
          return (
            <g key={`d${i}`}>
              <rect x={x(i) + 4} y={dpTop} width={cs - 8} height={dh} rx={6} className={`lis-dp${v === null ? " empty" : ""}${on ? " on" : ""}${done && lisSet.has(i) ? " lis" : ""}`} />
              {v !== null && <text x={mx(i)} y={dpTop + dh / 2 + 4.5} textAnchor="middle" className={`lis-dpv${on ? " on" : ""}`}>{v}</text>}
            </g>
          );
        })}

        {mode === "tails" && (
          <g>
            <text x={HEAD - 10} y={tTop + cs / 2 + 3} textAnchor="end" className="lis-lab">tails</text>
            {Array.from({ length: Math.max(1, slots) }, (_, i) => <text key={`ti${i}`} x={mx(i)} y={tHead} textAnchor="middle" className="lis-idx">{i}</text>)}
            {Array.from({ length: Math.max(1, slots) }, (_, i) => {
              const filled = i < f.tails.length;
              const isPos = f.pos === i && f.k >= 0;
              const cls = !filled ? "ghost" : isPos && f.act !== "find" ? "cur" : isPos ? "target" : "";
              return (
                <g key={`t${i}`}>
                  <rect x={x(i) + 2} y={tTop} width={cs - 4} height={cs - 4} rx={8} className={`lis-cell tail ${cls}${!filled && isPos ? " target" : ""}`} />
                  {filled && (
                    <motion.text key={`${i}-${f.tails[i]}`} x={mx(i)} y={tTop + (cs - 4) / 2 + fs * 0.36} textAnchor="middle" className={`lis-val ${cls}`}
                      style={{ fontSize: String(f.tails[i]).length > 2 ? Math.max(12, fs - 2) : fs }}
                      initial={reduce ? false : { opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={reduce ? { duration: 0 } : springs.smooth}>{f.tails[i]}</motion.text>
                  )}
                </g>
              );
            })}
            {/* probes made by bisect_left */}
            {f.act === "find" && f.probes?.map((p, i) => <circle key={`p${i}`} cx={mx(p)} cy={tTop + cs + 4} r={3} className="lis-probe" />)}
            {f.pos !== undefined && f.k >= 0 && (
              <g>
                <text x={mx(f.pos)} y={tTop + cs + 24} textAnchor="middle" className="lis-caret">
                  {f.act === "replace" && f.old !== undefined ? `was ${f.old}` : f.act === "append" ? "appended" : `i = ${f.pos}`}
                </text>
              </g>
            )}
            {/* arrow from x = a[k] to its slot */}
            {f.k >= 0 && f.pos !== undefined && (
              <path className="lis-move" d={`M ${mx(f.k)} ${dpTop + dh + 4} C ${mx(f.k)} ${dpTop + dh + 30} ${mx(f.pos)} ${tHead - 34} ${mx(f.pos)} ${tHead - 14}`} markerEnd={`url(#${uid}-acc)`} />
            )}
          </g>
        )}

        {mode === "quadratic" && f.tri && (
          <g>
            <text x={HEAD - 10} y={qTitle} textAnchor="end" className="lis-sub">check</text>
            <text x={HEAD} y={qTitle} className="lis-sub">dp[j] + 1 if a[j] &lt; a[i]</text>
            {Array.from({ length: n - 1 }, (_, r) => {
              const i = r + 1, y = qTop + r * th;
              return (
                <g key={`q${i}`}>
                  <text x={HEAD - 10} y={y + th / 2 + 4} textAnchor="end" className={`lis-qlab${i === f.k ? " on" : ""}`}>i = {i}</text>
                  {Array.from({ length: i }, (_, j) => {
                    const v = f.tri![i][j];
                    const cur = i === f.k && j === f.j;
                    const best = v !== null && v !== "–" && Number(v) === f.dp[i] && (i < f.k || f.k < 0 || (i === f.k && j <= (f.j ?? -1)));
                    return (
                      <g key={j}>
                        <rect x={x(j) + 3} y={y + 2} width={cs - 6} height={th - 4} rx={5} className={`lis-q${v === null ? " empty" : v === "–" ? " no" : ""}${best ? " best" : ""}${cur ? " cur" : ""}`} />
                        {v !== null && <text x={mx(j)} y={y + th / 2 + 4.5} textAnchor="middle" className={`lis-qv${v === "–" ? " no" : ""}${best ? " best" : ""}${cur ? " cur" : ""}`}>{v}</text>}
                      </g>
                    );
                  })}
                </g>
              );
            })}
          </g>
        )}
      </svg>
    </div>
  );
}
