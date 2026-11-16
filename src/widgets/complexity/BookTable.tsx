import { BOOK } from "./model";

/** The book's "largest n → target complexity" table. The row for the current n is highlighted. */
export function BookTable({ active, target, onPick, title = "The constraint table" }: { active: number | null; target?: boolean; onPick?: (i: number) => void; title?: string }) {
  return (
    <div className="cx-book">
      <div className="cx-book-title">{title}{onPick && <span> · tap a row to load it</span>}</div>
      <div className="cx-book-rows" role="list">
        <div className="cx-book-row head" role="listitem" aria-hidden="true">
          <span>Largest n</span><span>Target</span><span className="ops">Ops at max n</span><span className="tool">Typical tool</span>
        </div>
        {BOOK.map((r, i) => {
          const cls = `cx-book-row${i === active ? " on" : ""}${i === active && target ? " hit" : ""}`;
          const cells = (<><span className="mono">{r.nLabel}</span><span className="mono strong">{r.target}</span><span className="ops mono">{r.ops}</span><span className="tool">{r.tool}</span></>);
          return onPick ? (
            <button key={r.max} type="button" role="listitem" className={cls} onClick={() => onPick(i)} aria-current={i === active ? "true" : undefined}
              aria-label={`${r.nLabel}: target ${r.target}, about ${r.ops} operations. ${r.tool}.`}>{cells}</button>
          ) : (
            <div key={r.max} role="listitem" className={cls}>{cells}</div>
          );
        })}
      </div>
    </div>
  );
}
