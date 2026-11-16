/* Shared pieces for the algorithm visuals (array, grid, tree, graph):
   the calm card, the sideways scroller, change tracking for flip-book pulses and motion presets. */
import { useMemo, useRef, type CSSProperties, type ReactNode, type RefObject } from "react";
import type { Tone } from "@/content/types";
import { useReducedMotion } from "@/lib/hooks";
import { useBoxWidth } from "./flow";

export const SPRING = { type: "spring", stiffness: 195, damping: 28 } as const; // DESIGN.md "smooth"
export const FADE = { duration: 0.22, ease: [0.28, 0.11, 0.32, 1] } as const;
export const INSTANT = { duration: 0 } as const;

export function useMotion() {
  const reduced = useReducedMotion();
  return { reduced, move: reduced ? INSTANT : SPRING, fade: reduced ? INSTANT : FADE };
}

export const toneClass = (t?: Tone) => (t ? `tone-${t}` : "");

const NUMERIC = /^[-+]?(\d[\d,_]*)(\.\d+)?$/;
/** Strings that are not numbers render in the mono font (characters, words, symbols). */
export const isMono = (v: string | number) => typeof v === "string" && v !== "" && !NUMERIC.test(v.trim());

/**
 * Per-key change counters. A key's counter goes up each time its value changes between renders,
 * so `key={version}` on a child remounts it and replays a one-shot "changed" animation.
 * Version 0 means "never changed": nothing pulses on first appearance.
 */
export function useVersions(entries: [string, string][]): Map<string, number> {
  const store = useRef<{ prev: Map<string, string>; ver: Map<string, number> }>({ prev: new Map(), ver: new Map() });
  const sig = entries.map(([k, v]) => `${k}=${v}`).join("\u0001");
  return useMemo(() => {
    const { prev, ver } = store.current;
    for (const [k, v] of entries) {
      const p = prev.get(k);
      if (p !== undefined && p !== v) ver.set(k, (ver.get(k) ?? 0) + 1);
      prev.set(k, v);
    }
    return new Map(ver);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig]);
}

/** The card every algorithm visual sits in. The caller measures `hostRef` (the width it may use) and lays out
 *  for it; content wider than that scrolls sideways inside the card only, never the page. */
export function AlgoCard({ kind, hostRef, avail, contentW, children, reduced }: {
  kind: string; hostRef: RefObject<HTMLDivElement>; avail: number; contentW: number; children: ReactNode; reduced: boolean;
}) {
  const over = avail > 0 && contentW > avail + 1;
  return (
    <div className={`dg-algo dg-algo-${kind}${reduced ? " is-rm" : ""}`}>
      <div ref={hostRef} className="dg-algo-host">
        <div className={`dg-scroll${over ? " is-overflow" : ""}`} tabIndex={over ? 0 : undefined}
          role={over ? "region" : undefined} aria-label={over ? "Diagram, scrolls sideways" : undefined}>
          <div className="dg-algo-inner" style={{ width: contentW || undefined, margin: over ? undefined : "0 auto" } as CSSProperties}>{children}</div>
        </div>
      </div>
    </div>
  );
}

export { useBoxWidth };

/** Quadratic curve helpers for arrows (grid dependencies, graph edges). */
export type P = { x: number; y: number };
export const qPoint = (a: P, c: P, b: P, t: number): P => ({
  x: (1 - t) * (1 - t) * a.x + 2 * (1 - t) * t * c.x + t * t * b.x,
  y: (1 - t) * (1 - t) * a.y + 2 * (1 - t) * t * c.y + t * t * b.y,
});
/** Arrowhead triangle with its tip at `tip`, pointing along (dx, dy). */
export function headPath(tip: P, dx: number, dy: number, len = 7, half = 4) {
  const l = Math.hypot(dx, dy) || 1, ux = dx / l, uy = dy / l;
  const bx = tip.x - ux * len, by = tip.y - uy * len;
  return `M${tip.x.toFixed(1)},${tip.y.toFixed(1)} L${(bx - uy * half).toFixed(1)},${(by + ux * half).toFixed(1)} L${(bx + uy * half).toFixed(1)},${(by - ux * half).toFixed(1)} Z`;
}
export const fmtList = (xs: string[]) => xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`;
