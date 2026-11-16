/** N-Queens board: placed queens, the square being tried, and the attack lines that cut it. */
import { AnimatePresence, motion } from "framer-motion";
import { springs } from "@/ui";
import { useReducedMotion } from "@/lib/hooks";
import type { Board as B } from "./engine";

const CELL = 36, M = 18;
const CROWN = "M-9,6 L-10.5,-5 L-4.5,0.5 L0,-8 L4.5,0.5 L10.5,-5 L9,6 Z";

export function Board({ b }: { b: B }) {
  const reduce = useReducedMotion();
  const size = b.n * CELL;
  const cx = (c: number) => M + c * CELL + CELL / 2;
  const cy = (r: number) => M + r * CELL + CELL / 2;
  const t = b.tryCell;
  return (
    <svg className="rx-svg rt-board" width={size + M + 4} height={size + M + 4} viewBox={`0 0 ${size + M + 4} ${size + M + 4}`} role="img"
      aria-label={`${b.n} by ${b.n} board. Queens at ${b.queens.map((c, r) => `row ${r} column ${c}`).join(", ") || "none"}.`}>
      {Array.from({ length: b.n }, (_, i) => (
        <g key={`ix${i}`}>
          <text className="rt-bidx" x={cx(i)} y={12} textAnchor="middle">{i}</text>
          <text className="rt-bidx" x={8} y={cy(i) + 4} textAnchor="middle">{i}</text>
        </g>
      ))}
      {Array.from({ length: b.n * b.n }, (_, k) => {
        const r = Math.floor(k / b.n), c = k % b.n;
        return <rect key={k} x={M + c * CELL} y={M + r * CELL} width={CELL} height={CELL} className={`rt-cell${(r + c) % 2 ? " alt" : ""}`} />;
      })}
      <rect x={M} y={M} width={size} height={size} className="rt-bframe" rx={4} />
      {t && (
        <rect x={M + t[1] * CELL + 2} y={M + t[0] * CELL + 2} width={CELL - 4} height={CELL - 4} rx={6} className={`rt-try ${b.safe ? "ok" : "bad"}`} />
      )}
      {t && !b.safe && b.attackers?.map(([r, c], i) => (
        <motion.line key={`a${i}-${t[0]}-${t[1]}`} x1={cx(c)} y1={cy(r)} x2={cx(t[1])} y2={cy(t[0])} className="rt-attack"
          initial={reduce ? { opacity: 0 } : { pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: reduce ? 0.15 : 0.3 }} />
      ))}
      {t && !b.safe && <path className="rt-xmark" d={`M${cx(t[1]) - 6},${cy(t[0]) - 6} L${cx(t[1]) + 6},${cy(t[0]) + 6} M${cx(t[1]) + 6},${cy(t[0]) - 6} L${cx(t[1]) - 6},${cy(t[0]) + 6}`} />}
      <AnimatePresence>
        {b.queens.map((c, r) => (
          <motion.g key={`q${r}-${c}`} initial={reduce ? { opacity: 0 } : { opacity: 0, y: -14, scale: 0.7 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -16, scale: 0.8 }} transition={reduce ? { duration: 0.15 } : springs.snappy}>
            <g transform={`translate(${cx(c)},${cy(r)})`}>
              <path d={CROWN} className={`rt-queen${b.solved ? " solved" : ""}${t && t[0] === r && t[1] === c ? " new" : ""}`} />
            </g>
          </motion.g>
        ))}
      </AnimatePresence>
    </svg>
  );
}
