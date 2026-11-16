import { useCallback, useEffect, useMemo, useState } from "react";
import type { WidgetProps } from "../types";
import { Segmented, Stage, Toggle } from "@/ui";
import { CodePanel, InputEditor, LabShell, ModeTabs, Narration, PlayerBar, parseInt1, parseNums, randInt, usePlayer, type Field } from "./kit/player";
import { buildRun, HAS_TRACE, type DPFrame, type Inputs, type KnapView, type Mode } from "./engine";
import { DPTable, Formula } from "./Table";
import "./dp.css";

const MODES: { value: Mode; label: string }[] = [
  { value: "stairs", label: "Stairs" },
  { value: "house-robber", label: "House robber" },
  { value: "grid-paths", label: "Grid paths" },
  { value: "lcs", label: "LCS" },
  { value: "edit-distance", label: "Edit distance" },
  { value: "knapsack", label: "Knapsack" },
  { value: "coin-change", label: "Coin change" },
];
const isMode = (m: unknown): m is Mode => MODES.some((o) => o.value === m);

const DEFAULTS: Inputs = {
  stairs: { n: 6 },
  "house-robber": { nums: [2, 7, 9, 3, 1] },
  "grid-paths": { grid: ["....", ".*..", "...."] },
  lcs: { a: "abcde", b: "ace" },
  "edit-distance": { a: "horse", b: "ros" },
  knapsack: { items: [[2, 3], [3, 4], [4, 5]], W: 6 },
  "coin-change": { coins: [1, 2, 5], amount: 11 },
};

const STR_MAX = 7;
const validWord = (s: unknown): s is string => typeof s === "string" && /^[A-Za-z]{1,7}$/.test(s);

type Drafts = Record<string, string>;
function toDrafts(mode: Mode, inp: Inputs): Drafts {
  switch (mode) {
    case "stairs": return { n: String(inp.stairs.n) };
    case "house-robber": return { nums: inp["house-robber"].nums.join(", ") };
    case "grid-paths": return { grid: inp["grid-paths"].grid.join(", ") };
    case "lcs": return { a: inp.lcs.a, b: inp.lcs.b };
    case "edit-distance": return { a: inp["edit-distance"].a, b: inp["edit-distance"].b };
    case "knapsack": return { items: inp.knapsack.items.map(([w, v]) => `${w}:${v}`).join(", "), W: String(inp.knapsack.W) };
    case "coin-change": return { coins: inp["coin-change"].coins.join(", "), amount: String(inp["coin-change"].amount) };
  }
}

function parseWord(s: string, name: string): string | { err: string } {
  const t = s.trim();
  if (!/^[A-Za-z]+$/.test(t)) return { err: `${name} must be letters only (no spaces).` };
  if (t.length > STR_MAX) return { err: `Keep ${name} to ${STR_MAX} letters or fewer so the table stays readable.` };
  return t;
}

/** Validate the draft fields for one mode. Returns the new input or an error string. */
function parseDrafts(mode: Mode, d: Drafts): Inputs[Mode] | string {
  switch (mode) {
    case "stairs": { const n = parseInt1(d.n ?? "", 2, 12, "n"); return typeof n === "string" ? n : { n }; }
    case "house-robber": { const nums = parseNums(d.nums ?? "", { min: 0, max: 99, minLen: 2, maxLen: 9, name: "house values" }); return typeof nums === "string" ? nums : { nums }; }
    case "grid-paths": {
      const rows = (d.grid ?? "").split(/[\s,/]+/).filter(Boolean);
      if (rows.length < 2 || rows.length > 5) return "Enter 2 to 5 rows, separated by commas.";
      const C = rows[0].length;
      if (C < 2 || C > 7) return "Each row needs 2 to 7 cells.";
      if (rows.some((r) => r.length !== C)) return "Every row must have the same length.";
      if (rows.some((r) => !/^[.*]+$/.test(r))) return "Use '.' for an open cell and '*' for a rock.";
      if (rows[0][0] === "*") return "The start cell (0, 0) cannot be a rock.";
      return { grid: rows };
    }
    case "lcs": case "edit-distance": {
      const a = parseWord(d.a ?? "", "a"); if (typeof a !== "string") return a.err;
      const b = parseWord(d.b ?? "", "b"); if (typeof b !== "string") return b.err;
      return { a, b };
    }
    case "knapsack": {
      const parts = (d.items ?? "").split(/[\s,]+/).filter(Boolean);
      if (parts.length < 1 || parts.length > 4) return "Enter 1 to 4 items as weight:value, for example 2:3, 3:4.";
      const items: [number, number][] = [];
      for (const p of parts) {
        const m = p.match(/^(\d+):(\d+)$/);
        if (!m) return `"${p}" is not weight:value.`;
        const w = Number(m[1]), v = Number(m[2]);
        if (w < 1 || w > 8) return "Keep each weight between 1 and 8.";
        if (v < 1 || v > 30) return "Keep each value between 1 and 30.";
        items.push([w, v]);
      }
      const W = parseInt1(d.W ?? "", 1, 9, "Capacity W"); if (typeof W === "string") return W;
      return { items, W };
    }
    case "coin-change": {
      const coins = parseNums(d.coins ?? "", { min: 1, max: 9, minLen: 1, maxLen: 4, name: "coin values" }); if (typeof coins === "string") return coins;
      if (new Set(coins).size !== coins.length) return "Each coin value should appear once.";
      const amount = parseInt1(d.amount ?? "", 1, 12, "Amount"); if (typeof amount === "string") return amount;
      return { coins, amount };
    }
  }
}

const pick = <T,>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)];
function randomInput(mode: Mode): Inputs[Mode] {
  switch (mode) {
    case "stairs": return { n: randInt(3, 10) };
    case "house-robber": return { nums: Array.from({ length: randInt(4, 8) }, () => randInt(1, 15)) };
    case "grid-paths": {
      const R = randInt(3, 4), C = randInt(3, 5);
      const g = Array.from({ length: R }, (_, r) => Array.from({ length: C }, (_, c) => ((r === 0 && c === 0) || (r === R - 1 && c === C - 1) || Math.random() > 0.2 ? "." : "*")).join(""));
      return { grid: g };
    }
    case "lcs": case "edit-distance": {
      const w = (n: number) => Array.from({ length: n }, () => pick(["a", "b", "c", "d"])).join("");
      return { a: w(randInt(3, 6)), b: w(randInt(3, 5)) };
    }
    case "knapsack": return { items: Array.from({ length: 3 }, () => [randInt(1, 4), randInt(1, 9)] as [number, number]), W: randInt(4, 7) };
    case "coin-change": {
      const set = new Set<number>(); const n = randInt(2, 3);
      while (set.size < n) set.add(randInt(1, 6));
      return { coins: [...set].sort((a, b) => a - b), amount: randInt(6, 11) };
    }
  }
}

const PRESETS: Record<Mode, { label: string; value: Inputs[Mode] }[]> = {
  stairs: [{ label: "n = 4", value: { n: 4 } }, { label: "n = 6", value: { n: 6 } }, { label: "n = 10", value: { n: 10 } }],
  "house-robber": [{ label: "1, 2, 3, 1", value: { nums: [1, 2, 3, 1] } }, { label: "2, 7, 9, 3, 1", value: { nums: [2, 7, 9, 3, 1] } }, { label: "2, 1, 1, 2", value: { nums: [2, 1, 1, 2] } }],
  "grid-paths": [{ label: "LC 63 example", value: { grid: ["...", ".*.", "..."] } }, { label: "3 x 7, no rocks (LC 62)", value: { grid: [".......", ".......", "......."] } }, { label: "A wall with a gap", value: { grid: ["....", "***.", "....", ".*.."] } }],
  lcs: [{ label: "abcde / ace", value: { a: "abcde", b: "ace" } }, { label: "ABCBDAB / BDCABA", value: { a: "ABCBDAB", b: "BDCABA" } }, { label: "abc / def", value: { a: "abc", b: "def" } }],
  "edit-distance": [{ label: "horse / ros", value: { a: "horse", b: "ros" } }, { label: "kitten / sitting", value: { a: "kitten", b: "sitting" } }, { label: "abc / abc", value: { a: "abc", b: "abc" } }],
  knapsack: [{ label: "2:3, 3:4, 4:5 · W 6", value: { items: [[2, 3], [3, 4], [4, 5]], W: 6 } }, { label: "One item, W = 2", value: { items: [[1, 1]], W: 2 } }, { label: "1:2, 3:4, 4:5 · W 5", value: { items: [[1, 2], [3, 4], [4, 5]], W: 5 } }],
  "coin-change": [{ label: "1, 2, 5 · 11", value: { coins: [1, 2, 5], amount: 11 } }, { label: "1, 3, 4 · 6", value: { coins: [1, 3, 4], amount: 6 } }, { label: "2 · 3 (impossible)", value: { coins: [2], amount: 3 } }],
};

const FIELDS: Record<Mode, Omit<Field, "value" | "onChange">[]> = {
  stairs: [{ id: "n", label: "n (2 to 12)", numeric: true }],
  "house-robber": [{ id: "nums", label: "House values", wide: true, placeholder: "2, 7, 9, 3, 1" }],
  "grid-paths": [{ id: "grid", label: "Rows: '.' open, '*' rock", wide: true, placeholder: "...., .*.., ...." }],
  lcs: [{ id: "a", label: "a" }, { id: "b", label: "b" }],
  "edit-distance": [{ id: "a", label: "a (from)" }, { id: "b", label: "b (to)" }],
  knapsack: [{ id: "items", label: "Items, weight:value", wide: true, placeholder: "2:3, 3:4, 4:5" }, { id: "W", label: "Capacity W", numeric: true }],
  "coin-change": [{ id: "coins", label: "Coins", placeholder: "1, 2, 5" }, { id: "amount", label: "Amount", numeric: true }],
};

const NOTES: Partial<Record<Mode, string>> = {
  "grid-paths": "The picture shows every row so you can see the arrows. The code keeps a single row `dp`, updated in place.",
  lcs: "`row` is dp[i] and `up` is dp[i - 1]. Local names make the inner loop faster.",
  "edit-distance": "The picture shows every row. The code keeps only two rows: `prev` and `cur`.",
};

export default function DPTableLab({ onComplete, ...props }: WidgetProps) {
  const locked = isMode(props.mode);
  const [mode, setMode] = useState<Mode>(locked ? (props.mode as Mode) : "stairs");
  const [inputs, setInputs] = useState<Inputs>(() => {
    const a = props.a, b = props.b;
    if (!validWord(a) && !validWord(b)) return DEFAULTS;
    const pairL = { a: validWord(a) ? a : DEFAULTS.lcs.a, b: validWord(b) ? b : DEFAULTS.lcs.b };
    const pairE = { a: validWord(a) ? a : DEFAULTS["edit-distance"].a, b: validWord(b) ? b : DEFAULTS["edit-distance"].b };
    return { ...DEFAULTS, lcs: pairL, "edit-distance": pairE };
  });
  const [trace, setTrace] = useState(true);
  const [view, setView] = useState<KnapView>("2d");
  const [drafts, setDrafts] = useState<Drafts>(() => toDrafts(mode, inputs));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { if (isMode(props.mode)) setMode(props.mode); }, [props.mode]);
  useEffect(() => { setDrafts(toDrafts(mode, inputs)); setError(null); }, [mode, inputs]);

  const run = useMemo(() => buildRun(mode, inputs, trace, view), [mode, inputs, trace, view]);
  const p = usePlayer<DPFrame>(run.frames, onComplete);
  const f = p.frame;

  const setInput = useCallback((v: Inputs[Mode]) => { setInputs((s) => ({ ...s, [mode]: v })); setError(null); }, [mode]);
  const apply = () => { const r = parseDrafts(mode, drafts); if (typeof r === "string") setError(r); else setInput(r); };

  const toggleRock = useCallback((r: number, c: number) => {
    const g = inputs["grid-paths"].grid.map((row) => [...row]);
    g[r][c] = g[r][c] === "*" ? "." : "*";
    setInput({ grid: g.map((row) => row.join("")) });
  }, [inputs, setInput]);

  const extra = (
    <div className="dpt-extra">
      {mode === "knapsack" && (
        <Segmented<KnapView> label="Table" value={view} onChange={setView} options={[{ value: "2d", label: "2-D table" }, { value: "back", label: "1-D, c going down" }, { value: "fwd", label: "1-D, c going up" }]} />
      )}
      {HAS_TRACE[mode] && !(mode === "knapsack" && view !== "2d") && <Toggle label="Trace back" checked={trace} onChange={setTrace} />}
    </div>
  );

  const tabs = !locked ? <ModeTabs label="DP problem" value={mode} options={MODES} onChange={(m) => { setMode(m); }} /> : undefined;

  const stage = (
    <Stage className="dpt-stage">
      <div className="dpt-top">
        <span className="dpt-title">{run.title}</span>
        {p.cur === p.last && <span className="dpt-result">Answer: <b>{run.result}</b></span>}
      </div>
      <DPTable spec={run.spec} f={f} onCell={mode === "grid-paths" ? toggleRock : undefined}
        cellLabel={(r, c) => `Cell ${r}, ${c}: ${inputs["grid-paths"].grid[r]?.[c] === "*" ? "rock. Press to remove it" : "open. Press to add a rock"}`} />
      {mode === "grid-paths" && <p className="dpt-hint">Tap a cell to add or remove a rock. The run starts again.</p>}
      <Formula f={f} spec={run.spec} />
    </Stage>
  );

  const fields: Field[] = FIELDS[mode].map((fd) => ({ ...fd, value: drafts[fd.id] ?? "", onChange: (v: string) => setDrafts((d) => ({ ...d, [fd.id]: v })) }));

  return (
    <LabShell
      label="DP table builder"
      onKeyDown={p.onKeyDown}
      tabs={tabs}
      stage={stage}
      narration={<Narration p={p} />}
      bar={<PlayerBar p={p} extra={extra} />}
      below={
        <InputEditor fields={fields} onApply={apply} error={error} onRandom={() => setInput(randomInput(mode))}
          presets={PRESETS[mode].map((pr) => ({ label: pr.label, run: () => setInput(pr.value) }))}
          note={mode === "lcs" || mode === "edit-distance" ? `Letters only, up to ${STR_MAX} each.` : undefined} />
      }
      code={<CodePanel title={run.title} lines={run.code} active={f.line} active2={f.line2} note={f.trace ? "Trace back is not part of the template. It walks back through the finished table to recover the choices." : NOTES[mode]} />}
    />
  );
}
