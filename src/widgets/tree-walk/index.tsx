import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Segmented, springs } from "@/ui";
import { rng, useReducedMotion } from "@/lib/hooks";
import type { WidgetProps } from "../types";
import { usePlayer } from "../recursion-tree/kit/player";
import { CodePanel, InputEditor, LabShell, Narration, PlayerBar, parseInt1 } from "../recursion-tree/kit/ui";
import { MODES, buildBfs, buildBst, buildDfs, buildIter, type BstKind, type DfsKind, type IterKind, type List, type Mode, type Run, type TFrame } from "./engine";
import { fromLevel, parseTree, randomBst, randomTree } from "./model";
import { BinTree } from "./BinTree";
import "./tw.css";

const isMode = (v: unknown): v is Mode => typeof v === "string" && MODES.some((m) => m.value === v);

const DEFAULT_TREE: Record<Mode, (number | null)[]> = {
  "dfs-return": [1, 2, 3, 4, 5, null, null, 6],
  "bfs-levels": [3, 9, 20, null, null, 15, 7],
  iterative: [1, 2, 3, 4, 5],
  bst: [8, 3, 10, 1, 6, null, 14, null, null, 4, 7, 13],
};
const PRESETS: Record<Mode, { label: string; tree: (number | null)[] }[]> = {
  "dfs-return": [
    { label: "Diameter 4", tree: [1, 2, 3, 4, 5, null, null, 6] },
    { label: "[1, 2, 3, 4, 5]", tree: [1, 2, 3, 4, 5] },
    { label: "House robber III", tree: [3, 2, 3, null, 3, null, 1] },
    { label: "A line", tree: [1, 2, null, 3, null, 4] },
  ],
  "bfs-levels": [
    { label: "LC 102 example", tree: [3, 9, 20, null, null, 15, 7] },
    { label: "Full, 3 levels", tree: [1, 2, 3, 4, 5, 6, 7] },
    { label: "Lopsided", tree: [1, 2, 3, null, 4, null, null, 5, 6] },
  ],
  iterative: [
    { label: "[1, 2, 3]", tree: [1, 2, 3] },
    { label: "[1, 2, 3, 4, 5]", tree: [1, 2, 3, 4, 5] },
    { label: "Full, 3 levels", tree: [1, 2, 3, 4, 5, 6, 7] },
  ],
  bst: [
    { label: "Valid BST", tree: [8, 3, 10, 1, 6, null, 14, null, null, 4, 7, 13] },
    { label: "Not a BST: 6 under 15", tree: [10, 5, 15, null, null, 6, 20] },
    { label: "Small BST", tree: [5, 3, 8, 2, 4, 7, 9] },
  ],
};

function validTreeProp(v: unknown): (number | null)[] | undefined {
  if (!Array.isArray(v) || !v.every((x) => x === null || typeof x === "number")) return undefined;
  const r = parseTree(v.map((x) => (x === null ? "null" : String(x))).join(","));
  return typeof r === "string" ? undefined : r;
}

export default function TreeWalk(props: WidgetProps) {
  const locked = isMode(props.mode) ? props.mode : undefined;
  const [mode, setMode] = useState<Mode>(locked ?? "dfs-return");
  const m = locked ?? mode;
  const propTree = validTreeProp(props.tree);
  const [trees, setTrees] = useState<Record<Mode, (number | null)[]>>(() => ({
    "dfs-return": propTree ?? DEFAULT_TREE["dfs-return"],
    "bfs-levels": propTree ?? DEFAULT_TREE["bfs-levels"],
    iterative: propTree ?? DEFAULT_TREE.iterative,
    bst: propTree ?? DEFAULT_TREE.bst,
  }));
  const [dfsKind, setDfsKind] = useState<DfsKind>("height");
  const [iterKind, setIterKind] = useState<IterKind>("post");
  const [bstKind, setBstKind] = useState<BstKind>("search");
  const [xs, setXs] = useState({ search: 7, insert: 5 });

  const arr = trees[m];
  const tree = useMemo(() => fromLevel(arr), [arr]);
  const run: Run = useMemo(() => {
    switch (m) {
      case "dfs-return": return buildDfs(tree, dfsKind);
      case "bfs-levels": return buildBfs(tree);
      case "iterative": return buildIter(tree, iterKind);
      case "bst": return buildBst(tree, bstKind, bstKind === "insert" ? xs.insert : xs.search);
    }
  }, [m, tree, dfsKind, iterKind, bstKind, xs]);

  const p = usePlayer<TFrame>(run.frames, props.onComplete);
  const f = p.frame;

  const sub =
    m === "dfs-return" ? <Segmented<DfsKind> label="Each node returns" value={dfsKind} onChange={setDfsKind} options={[{ value: "height", label: "Height + diameter" }, { value: "sum", label: "Subtree sum" }]} /> :
    m === "iterative" ? <Segmented<IterKind> label="Order" value={iterKind} onChange={setIterKind} options={[{ value: "post", label: "Post-order" }, { value: "pre", label: "Preorder" }, { value: "in", label: "Inorder" }]} /> :
    m === "bst" ? <Segmented<BstKind> label="Operation" value={bstKind} onChange={setBstKind} options={[{ value: "search", label: "Search" }, { value: "insert", label: "Insert" }, { value: "validate", label: "Validate" }]} /> : null;

  const stage = (
    <div className="rx-stage tw-stage">
      <div className="rx-stage-head">
        <span className="tw-title">{TITLE[m]}</span>
        {f.stats?.map((s) => <span key={s.label} className={`tw-stat${s.tone === "good" ? " good" : ""}`}>{s.label} <b>{s.value}</b></span>)}
        {sub && <div className="tw-sub">{sub}</div>}
      </div>
      <div className="tw-body">
        <BinTree tree={run.tree} frame={f} flowKey={p.cur} label={`Binary tree, ${run.tree.nodes.length} nodes. ${f.say}`} />
        <div className="tw-panel">{f.lists.map((l) => <ListView key={l.name} l={l} />)}</div>
      </div>
      <Legend m={m} kind={m === "bst" ? bstKind : m === "iterative" ? iterKind : ""} />
    </div>
  );

  return (
    <LabShell label="Tree traversal lab" onKeyDown={p.onKeyDown}
      tabs={locked ? undefined : <Segmented<Mode> label="Mode" value={m} options={MODES} onChange={setMode} />}
      stage={stage} narration={<Narration p={p} />} bar={<PlayerBar p={p} />}
      code={<CodePanel title={run.title} lines={run.code} active={f.line} active2={f.line2} />}
      below={<TreeInput key={`${m}-${arr.join(",")}-${bstKind}-${xs.search}-${xs.insert}`} m={m} arr={arr} bstKind={bstKind} x={bstKind === "insert" ? xs.insert : xs.search}
        onTree={(t) => setTrees((s) => ({ ...s, [m]: t }))} onX={(v) => setXs((s) => ({ ...s, [bstKind === "insert" ? "insert" : "search"]: v }))} />} />
  );
}

const TITLE: Record<Mode, string> = {
  "dfs-return": "Values flow up the edges",
  "bfs-levels": "One level at a time",
  iterative: "Your own stack",
  bst: "Smaller left, larger right",
};

function Legend({ m, kind }: { m: Mode; kind: string }) {
  return (
    <div className="rx-legend" aria-hidden="true">
      <span><i className="acc" />now</span>
      {m === "dfs-return" && <span><i className="open" />on the call stack</span>}
      {m === "bfs-levels" && <span><i className="tw-q" />in the queue</span>}
      {m === "iterative" && <><span><i className="tw-q" />waiting in the stack</span>{kind === "post" && <span><i className="open" />(node, T) waiting</span>}</>}
      {m === "bst" && kind !== "validate" && <><span><i className="open" />path</span><span><i className="tw-dim" />ruled out</span></>}
      {m === "bst" && kind === "validate" && <><span><i className="open" />on the call stack</span><span><i className="good" />valid</span><span><i className="bad" />breaks a bound</span></>}
      {m !== "bst" && <span><i className="tw-done" />finished</span>}
    </div>
  );
}

function ListView({ l }: { l: List }) {
  const reduce = useReducedMotion();
  return (
    <div className={`tw-list${l.vertical ? " vertical" : ""}`}>
      <div className="tw-list-head"><span className="tw-list-name">{l.name}</span>{l.note && <span className="tw-list-note">{l.note}</span>}</div>
      <div className="tw-list-items">
        {l.items.length === 0 && <span className="rx-empty">{l.empty ?? "[]"}</span>}
        <AnimatePresence initial={false} mode="popLayout">
          {l.items.map((it) => (
            <motion.span key={it.key} className={`rx-box tw-item${it.tone ? ` ${it.tone}` : ""}`} layout={!reduce}
              initial={reduce ? { opacity: 0 } : l.vertical ? { opacity: 0, y: -12 } : { opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0, y: 0 }}
              exit={reduce ? { opacity: 0 } : l.vertical ? { opacity: 0, y: -12 } : { opacity: 0, x: -12 }} transition={reduce ? { duration: 0.12 } : springs.snappy}>{it.t}</motion.span>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function TreeInput({ m, arr, bstKind, x, onTree, onX }: { m: Mode; arr: (number | null)[]; bstKind: BstKind; x: number; onTree: (t: (number | null)[]) => void; onX: (v: number) => void }) {
  const [txt, setTxt] = useState(arr.map((v) => (v === null ? "null" : v)).join(", "));
  const [xt, setXt] = useState(String(x));
  const [err, setErr] = useState<string | null>(null);
  const needX = m === "bst" && bstKind !== "validate";
  const apply = () => {
    const r = parseTree(txt);
    if (typeof r === "string") { setErr(r); return; }
    if (needX) {
      const v = parseInt1(xt, -99, 99, "x");
      if (typeof v === "string") { setErr(v); return; }
      onX(v);
    }
    setErr(null); onTree(r);
  };
  const random = () => {
    const rand = rng(Math.floor(Math.random() * 1e9));
    const t = m === "bst" ? randomBst(rand, 6 + Math.floor(rand() * 4)) : randomTree(rand, 5 + Math.floor(rand() * 5));
    setErr(null); onTree(t);
    if (needX) {
      const vals = t.filter((v): v is number => v !== null);
      onX(bstKind === "search" && rand() < 0.7 ? vals[Math.floor(rand() * vals.length)] : Math.floor(rand() * 30) + 1);
    }
  };
  return (
    <InputEditor
      fields={[
        { id: "tree", label: "tree (level order, null for a gap)", value: txt, onChange: setTxt, wide: true, placeholder: "1, 2, 3, null, 4" },
        ...(needX ? [{ id: "x", label: "x", value: xt, onChange: setXt, numeric: true }] : []),
      ]}
      onApply={apply} error={err} onRandom={random}
      note="Up to 15 nodes and 5 levels, values from -99 to 99. Same format as LeetCode."
      presets={PRESETS[m].map((ps) => ({ label: ps.label, run: () => { setErr(null); onTree(ps.tree); } }))} />
  );
}
