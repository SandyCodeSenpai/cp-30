import type { CSSProperties } from "react";
import { motion } from "framer-motion";
import { useProgress } from "@/state/progress";
import { WIDGET_LIST } from "@/widgets/registry";
import { useReducedMotion } from "@/lib/hooks";
import { chapterByN, partColor, plain } from "./course";
import { LabCard, PageHead, fadeUp } from "./common";
import { FeaturedLab } from "./Home";

export default function LabsPage() {
  const p = useProgress();
  const reduce = useReducedMotion();
  const labs = WIDGET_LIST.filter((w) => w.id !== "triage");
  const chapters = [...new Set(labs.map((w) => w.chapter))].sort((a, b) => a - b);
  const doneCount = WIDGET_LIST.filter((w) => p.widgets?.[w.id]).length;
  return (
    <div className="page labs">
      <PageHead eyebrow={`${WIDGET_LIST.length} labs · ${doneCount} done`} title="Labs" sub="Step-by-step players for every pattern in the course. Change the input, step through the algorithm, and watch the Python template run line by line." />
      <motion.div {...fadeUp(reduce)}><FeaturedLab wide /></motion.div>
      {chapters.map((n) => {
        const ch = chapterByN(n);
        return (
          <section key={n} className="labs-group" style={{ "--pc": partColor(ch?.part ?? 0) } as CSSProperties} aria-labelledby={`lg-${n}`}>
            <div className="labs-group-head">
              <span className="pg-dot" />
              <h2 id={`lg-${n}`} className="labs-group-title">Chapter {n}{ch ? ` · ${plain(ch.short || ch.title)}` : ""}</h2>
              {ch && <a href={`#ch${n}`} className="labs-group-link">Open the chapter</a>}
            </div>
            <div className="lab-grid">{labs.filter((w) => w.chapter === n).map((w) => <LabCard key={w.id} w={w} done={!!p.widgets?.[w.id]} hideChapter />)}</div>
          </section>
        );
      })}
    </div>
  );
}
