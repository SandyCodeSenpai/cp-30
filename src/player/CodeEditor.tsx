/**
 * A light Python editor with no dependencies: a transparent <textarea> over a syntax-highlighted <pre>.
 * Tab / Shift+Tab indent and dedent (selection aware), Enter keeps the indent (+4 after a colon),
 * Backspace in leading spaces removes one indent level, Cmd/Ctrl+Enter runs, Esc leaves the editor.
 * Edits go through execCommand("insertText") when it exists, so the browser's undo still works.
 */
import { useMemo, useRef, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { Highlighted } from "./pyHighlight";
import "./code.css";

const INDENT = "    ";

export interface CodeEditorProps {
  value: string;
  onChange: (v: string) => void;
  onRun?: () => void;
  onFocus?: () => void;
  /** 1-based line to mark as the error line */
  errorLine?: number;
  label: string;
  readOnly?: boolean;
  minLines?: number;
  /** exposes the textarea so the parent can replace the text with undo kept (Reset, Use solution) */
  taRef?: React.MutableRefObject<HTMLTextAreaElement | null>;
}

/** Replace [start, end) with text, keeping native undo. Then select [selStart, selEnd]. */
export function replaceRange(ta: HTMLTextAreaElement, start: number, end: number, text: string, selStart?: number, selEnd?: number) {
  ta.focus({ preventScroll: true });
  ta.setSelectionRange(start, end);
  let ok = false;
  try { ok = document.execCommand("insertText", false, text); } catch { ok = false; }
  if (!ok || ta.value.slice(start, start + text.length) !== text) {
    ta.setRangeText(text, start, end, "end");
    ta.dispatchEvent(new Event("input", { bubbles: true }));
  }
  const s = selStart ?? start + text.length;
  ta.setSelectionRange(s, selEnd ?? s);
}

export function CodeEditor({ value, onChange, onRun, onFocus, errorLine, label, readOnly, minLines = 6, taRef }: CodeEditorProps) {
  const ta = useRef<HTMLTextAreaElement | null>(null);
  const lines = useMemo(() => value.split("\n").length, [value]);
  const rows = Math.max(lines, minLines);

  function onKeyDown(e: ReactKeyboardEvent<HTMLTextAreaElement>) {
    const el = e.currentTarget;
    const v = el.value, s = el.selectionStart, en = el.selectionEnd;
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); onRun?.(); return; }
    if (e.key === "Escape") { e.preventDefault(); el.blur(); return; }
    if (readOnly || e.altKey || e.metaKey || e.ctrlKey || e.nativeEvent.isComposing) return;

    if (e.key === "Tab") {
      e.preventDefault();
      const ls = v.lastIndexOf("\n", s - 1) + 1;
      const multi = v.slice(s, en).includes("\n");
      if (!e.shiftKey && !multi) {
        const col = s - ls;
        replaceRange(el, s, en, " ".repeat(4 - (col % 4)));
        return;
      }
      // Indent or dedent every line the selection touches.
      const endAdj = en > s && v[en - 1] === "\n" ? en - 1 : en;
      const le = v.indexOf("\n", endAdj); const lineEnd = le === -1 ? v.length : le;
      const block = v.slice(ls, lineEnd).split("\n");
      let firstDelta = 0, total = 0;
      const next = block.map((l, i) => {
        if (!e.shiftKey) { if (l.trim() === "" && block.length > 1) return l; if (i === 0) firstDelta = 4; total += 4; return INDENT + l; }
        const n = Math.min(4, l.length - l.trimStart().length, l.match(/^ */)![0].length);
        if (i === 0) firstDelta = -n; total -= n; return l.slice(n);
      });
      const text = next.join("\n");
      if (text === block.join("\n")) return;
      const ns = Math.max(ls, s + firstDelta);
      const ne = multi ? Math.max(ns, en + total) : Math.max(ns, en + firstDelta);
      replaceRange(el, ls, lineEnd, text, ns, ne);
      return;
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const ls = v.lastIndexOf("\n", s - 1) + 1;
      const before = v.slice(ls, s);
      let indent = before.match(/^[ \t]*/)![0];
      if (/:\s*(#.*)?$/.test(before)) indent += INDENT;
      replaceRange(el, s, en, "\n" + indent);
      return;
    }
    if (e.key === "Enter") { e.preventDefault(); replaceRange(el, s, en, "\n"); return; }

    if (e.key === "Backspace" && s === en && s > 0) {
      const ls = v.lastIndexOf("\n", s - 1) + 1;
      const before = v.slice(ls, s);
      if (before.length > 0 && /^ +$/.test(before)) {
        e.preventDefault();
        const n = before.length % 4 || 4;
        replaceRange(el, s - n, s, "");
      }
    }
  }

  return (
    <div className={`ce ${readOnly ? "is-ro" : ""}`} data-own-keys="">
      <div className="ce-scroll">
        <div className="ce-inner" style={{ ["--ce-rows" as string]: rows }}>
          <div className="ce-gutter" aria-hidden="true">
            {Array.from({ length: rows }, (_, i) => (
              <div key={i} className={`ce-ln ${i + 1 === errorLine ? "is-err" : ""} ${i >= lines ? "is-ghost" : ""}`}>{i + 1}</div>
            ))}
          </div>
          <div className="ce-code">
            {errorLine && errorLine <= lines && <div className="ce-errband" style={{ ["--ce-line" as string]: errorLine - 1 }} aria-hidden="true" />}
            <pre className="ce-hl" aria-hidden="true"><Highlighted code={value} />{value.endsWith("\n") || value === "" ? " " : ""}</pre>
            <textarea
              ref={(el) => { ta.current = el; if (taRef) taRef.current = el; }}
              className="ce-ta" value={value} readOnly={readOnly} aria-label={label}
              spellCheck={false} autoCapitalize="off" autoCorrect="off" autoComplete="off" wrap="off"
              onChange={(e) => onChange(e.target.value)} onKeyDown={onKeyDown} onFocus={onFocus}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Read-only highlighted block (solution). */
export function CodeBlock({ code, label }: { code: string; label: string }) {
  const lines = code.replace(/\n+$/, "").split("\n");
  return (
    <div className="ce is-ro ce-block" role="region" aria-label={label}>
      <div className="ce-scroll" tabIndex={0}>
        <div className="ce-inner">
          <div className="ce-gutter" aria-hidden="true">{lines.map((_, i) => <div key={i} className="ce-ln">{i + 1}</div>)}</div>
          <div className="ce-code"><pre className="ce-hl static"><Highlighted code={lines.join("\n")} /></pre></div>
        </div>
      </div>
    </div>
  );
}
