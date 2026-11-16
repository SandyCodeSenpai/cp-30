import { Component, useEffect, useState, type CSSProperties, type ErrorInfo, type ReactNode } from "react";
import { Chip, Icon, springs } from "@/ui";
import type { WidgetMeta } from "@/widgets/registry";
import { useReducedMotion } from "@/lib/hooks";
import { chapterByN, partColor } from "./course";

/** Catches render errors in children (content or widgets still being written) and shows a calm fallback. */
export class Boundary extends Component<{ children: ReactNode; fallback: (err: Error) => ReactNode; resetKey?: string }, { err: Error | null }> {
  state = { err: null as Error | null };
  static getDerivedStateFromError(err: Error) { return { err }; }
  componentDidCatch(err: Error, info: ErrorInfo) { console.warn("[shell] section failed to render:", err.message, info.componentStack?.split("\n")[1] ?? ""); }
  componentDidUpdate(prev: { resetKey?: string }) { if (prev.resetKey !== this.props.resetKey && this.state.err) this.setState({ err: null }); }
  render() { return this.state.err ? this.props.fallback(this.state.err) : this.props.children; }
}

export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return <a className="pg-back" href={href}><Icon name="chevron-left" size={18} stroke={2} />{children}</a>;
}

/** Large-title page header (Apple style). */
export function PageHead({ eyebrow, title, sub, dot, children }: { eyebrow?: ReactNode; title: ReactNode; sub?: ReactNode; dot?: string; children?: ReactNode }) {
  return (
    <header className="pg-head">
      {eyebrow && <div className="pg-eyebrow">{dot && <span className="pg-dot" style={{ background: dot }} />}{eyebrow}</div>}
      <h1 className="pg-title">{title}</h1>
      {sub && <p className="pg-sub">{sub}</p>}
      {children}
    </header>
  );
}

export function LabCard({ w, done, compact, hideChapter }: { w: WidgetMeta; done?: boolean; compact?: boolean; hideChapter?: boolean }) {
  const ch = chapterByN(w.chapter);
  const color = partColor(ch?.part ?? 0);
  return (
    <a href={`#lab-${w.id}`} className={`lab-card${compact ? " compact" : ""}`} style={{ "--pc": color } as CSSProperties}>
      <div className="lab-card-top">
        <span className="lab-icon"><Icon name="flask" size={20} /></span>
        {done ? <Chip tone="good"><Icon name="check" size={13} stroke={2.4} />Done</Chip> : hideChapter ? null : <span className="lab-ch">Chapter {w.chapter}</span>}
      </div>
      <div className="lab-card-title">{w.title}</div>
      <p className="lab-card-sum">{w.summary}</p>
      <span className="lab-card-go">Open lab<Icon name="arrow-right" size={16} stroke={2} /></span>
    </a>
  );
}

/** Count-up number for stats (respects reduced motion). */
export function CountUp({ value, ms = 600 }: { value: number; ms?: number }) {
  const reduce = useReducedMotion();
  const [v, setV] = useState(reduce ? value : 0);
  useEffect(() => {
    if (reduce) { setV(value); return; }
    let raf = 0; const t0 = performance.now();
    const tick = (t: number) => { const k = Math.min(1, (t - t0) / ms); setV(Math.round(value * (1 - Math.pow(1 - k, 3)))); if (k < 1) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, ms, reduce]);
  return <span className="tnum">{v.toLocaleString("en-US")}</span>;
}

export const fadeUp = (reduce: boolean, delay = 0) => reduce
  ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.15, delay } }
  : { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { ...springs.smooth, delay } };

/** Turn plain-text sources into nodes with clickable URLs. */
export function Linkify({ text }: { text: string }) {
  const parts = text.split(/(https?:\/\/[^\s)>\]]+)/g);
  return <>{parts.map((p, i) => (/^https?:\/\//.test(p) ? <a key={i} href={p} target="_blank" rel="noreferrer noopener">{p.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}</a> : <span key={i}>{p}</span>))}</>;
}
