/** Square-and-multiply picture: the exponent's bits, then one table row per bit (a^(2^k) and res). */
import { useEffect, useRef } from "react";
import { bitLen, fmtBig, modName, powLabel, type PowFrame } from "./engine";

export function PowView({ f, b0, base, m }: { f: PowFrame; b0: bigint; base: string; m: bigint }) {
  const L = bitLen(b0);
  const bits = b0.toString(2).split("").reverse().map(Number); // LSB first
  const wrap = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<(HTMLTableRowElement | null)[]>([]);
  useEffect(() => {
    // keep the current row visible inside the table's own scroll box (never scroll the page)
    const box = wrap.current, row = rowRefs.current[Math.max(0, Math.min(f.k, L - 1))];
    if (!box || !row) return;
    const top = row.offsetTop - 34, bottom = row.offsetTop + row.offsetHeight;
    if (top < box.scrollTop) box.scrollTop = top;
    else if (bottom > box.scrollTop + box.clientHeight) box.scrollTop = bottom - box.clientHeight;
  }, [f.k, L]);
  const small = L > 20;
  return (
    <>
      <div className={`nt-bits${small ? " small" : ""}`} aria-label={`Exponent ${b0} in binary`} style={{ paddingTop: small ? 0 : 14 }}>
        <span className="lab">b =</span>
        {bits.slice().reverse().map((bit, j) => {
          const k = L - 1 - j;
          return (
            <span key={k} className={`nt-bit${bit ? " one" : ""}${k === f.k && f.phase !== "done" ? " cur" : k < f.k ? " done" : ""}`}>
              {!small && (k % 4 === 0 || k === L - 1) && <small>{k}</small>}{bit}
            </span>
          );
        })}
        {L === 0 && <span className="nt-bit">0</span>}
      </div>
      <div className="nt-tablewrap" ref={wrap}>
        <table className="nt-table" aria-label="Square and multiply, one row per bit">
          <thead><tr><th>bit k</th><th>b's bit</th><th>a = {base}^(2^k) mod {modName(m)}</th><th>res after</th></tr></thead>
          <tbody>
            {Array.from({ length: L }, (_, k) => {
              const row = f.rows[k];
              const reached = !!row;
              const cur = k === f.k && f.phase !== "done";
              return (
                <tr key={k} ref={(el) => { rowRefs.current[k] = el; }} className={cur ? "on" : reached ? "" : "todo"}>
                  <td>{k}</td>
                  <td>{bits[k] ? <span className="mul" title="multiply">1</span> : <span className="skip">0</span>}</td>
                  <td className={reached && bits[k] ? "use" : ""}><span title={powLabel(base, k)}>{reached ? fmtBig(row.sq) : "·"}</span></td>
                  <td>{reached && row.res !== null ? fmtBig(row.res) : "·"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="nt-big">
        <div className={`nt-stat${f.phase === "sq" ? " on" : ""}`}><span>a</span><b>{fmtBig(f.a)}</b></div>
        <div className={`nt-stat${f.phase === "mul" ? " on" : f.phase === "done" ? " ok" : ""}`}><span>res</span><b>{fmtBig(f.res)}</b></div>
        <div className="nt-stat"><span>b left</span><b>{f.b.toString(2).length > 16 ? fmtBig(f.b) : `0b${f.b.toString(2)}`}</b></div>
      </div>
    </>
  );
}
