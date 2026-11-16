import { useEffect, useState } from "react";
import { parseStr } from "../range-query/kit/player";
import { InputEditor, type Field } from "../range-query/kit/ui";

export const TEXTS = ["abacababab", "aabaacaabaa", "abcabcabcab", "ababbabababb", "xyxxyxyxyy", "banananaban", "mississippi"];
export const PATS = ["abab", "aab", "abca", "abab", "xyxy", "ana", "issi"];

const ALLOW = /^[A-Za-z0-9]+$/;
const ALLOW_Z = /^[A-Za-z0-9#$]+$/;

/** Text + pattern editor (or a single string when `single`). */
export function StrEditor({ text, pat, textMax, patMax, onApply, presets, onRandom, single, note }: {
  text: string; pat?: string; textMax: number; patMax?: number; single?: boolean; note?: string;
  onApply: (text: string, pat: string) => void; presets: { label: string; t: string; p?: string }[]; onRandom: () => void;
}) {
  const [t, setT] = useState(text);
  const [p, setP] = useState(pat ?? "");
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => { setT(text); setP(pat ?? ""); setErr(null); }, [text, pat]);
  const apply = () => {
    const tv = parseStr(t, { minLen: single ? 2 : 3, maxLen: textMax, name: single ? "The string s" : "Text", allow: single ? ALLOW_Z : ALLOW, allowText: single ? "letters, digits, # and $" : "letters and digits" });
    if (typeof tv !== "string") { setErr(tv.error); return; }
    if (single) { setErr(null); onApply(tv, ""); return; }
    const pv = parseStr(p, { minLen: 1, maxLen: patMax ?? 6, name: "Pattern", allow: ALLOW });
    if (typeof pv !== "string") { setErr(pv.error); return; }
    if (pv.length > tv.length) { setErr("The pattern must not be longer than the text."); return; }
    setErr(null); onApply(tv, pv);
  };
  const fields: Field[] = single
    ? [{ id: "s", label: `s (2 to ${textMax} characters)`, value: t, onChange: setT, wide: true }]
    : [{ id: "t", label: `text (3 to ${textMax})`, value: t, onChange: setT, wide: true }, { id: "p", label: `pattern (1 to ${patMax})`, value: p, onChange: setP }];
  return (
    <InputEditor fields={fields} onApply={apply} error={err} note={note}
      presets={presets.map((x) => ({ label: x.label, run: () => onApply(x.t, x.p ?? "") }))} onRandom={onRandom} />
  );
}
