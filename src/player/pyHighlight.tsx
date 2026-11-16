/** A small Python tokenizer for the code editor and solution blocks. The output text is exactly the input text. */
import type { ReactNode } from "react";

const KEYWORDS = new Set(
  "False None True and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield".split(" "),
);
const BUILTINS = new Set(
  ("print input len range enumerate zip map filter sorted reversed sum min max abs int str float list dict set tuple bool " +
    "any all iter next divmod pow round ord chr bin hex oct isinstance type super object open repr hash id frozenset bytes " +
    "bytearray slice callable getattr setattr hasattr format vars globals exec eval self cls " +
    "Exception ValueError KeyError IndexError TypeError ZeroDivisionError RecursionError StopIteration NotImplemented")
    .split(" "),
);

// 1 comment · 2 string (with prefix, triple or single quotes, may be unterminated) · 3 number · 4 decorator · 5 name
const TOKEN = new RegExp(
  [
    /(#[^\n]*)/.source,
    /((?:[rRbBuUfF]{1,2})?(?:"""[\s\S]*?(?:"""|$)|'''[\s\S]*?(?:'''|$)|"(?:[^"\\\n]|\\.)*"?|'(?:[^'\\\n]|\\.)*'?))/.source,
    /(\b(?:0[xX][\da-fA-F_]+|0[bB][01_]+|0[oO][0-7_]+|\d[\d_]*\.?[\d_]*(?:[eE][+-]?\d+)?[jJ]?)\b)/.source,
    /(@[A-Za-z_][\w.]*)/.source,
    /([A-Za-z_]\w*)/.source,
  ].join("|"),
  "g",
);

export type TokClass = "c" | "s" | "n" | "d" | "k" | "b" | "f";
export function tokenize(code: string): { t: string; c?: TokClass }[] {
  const out: { t: string; c?: TokClass }[] = [];
  let last = 0, prevKw = "";
  TOKEN.lastIndex = 0;
  for (let m = TOKEN.exec(code); m; m = TOKEN.exec(code)) {
    if (m[0] === "") { TOKEN.lastIndex++; continue; }
    if (m.index > last) out.push({ t: code.slice(last, m.index) });
    let c: TokClass | undefined;
    if (m[1]) c = "c";
    else if (m[2]) c = "s";
    else if (m[3]) c = "n";
    else if (m[4]) c = "d";
    else if (m[5]) {
      const w = m[5];
      c = KEYWORDS.has(w) ? "k" : prevKw === "def" || prevKw === "class" ? "f" : BUILTINS.has(w) ? "b" : undefined;
    }
    prevKw = m[5] && KEYWORDS.has(m[5]) ? m[5] : m[5] ? "" : prevKw;
    out.push({ t: m[0], c });
    last = m.index + m[0].length;
  }
  if (last < code.length) out.push({ t: code.slice(last) });
  return out;
}

export function Highlighted({ code }: { code: string }): ReactNode {
  return tokenize(code).map((tk, i) => (tk.c ? <span key={i} className={`py-${tk.c}`}>{tk.t}</span> : tk.t));
}
