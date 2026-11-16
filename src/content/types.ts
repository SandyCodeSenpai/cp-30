/**
 * Course content schema. Content files (src/content/chNN.ts) export one `Chapter` as default.
 * Text fields use "lite markdown": **bold**, *italic*, `code`, "- " bullet lines, blank line = new paragraph,
 * and [[glossary term]] (or [[shown text|glossary term]]) to link a glossary entry.
 */
import type { WidgetId } from "@/widgets/ids";

export type PartId = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface Chapter {
  n: number;            // 0..19, same numbering as the book
  title: string;        // e.g. "Inside a CDN: PoPs, Edge Servers and Caches"
  short: string;        // 1-3 word name for tight UI, e.g. "Inside a CDN"
  part: PartId;
  hook: string;         // one sentence teaser
  lessons: Lesson[];    // see design/CONTENT-BRIEF.md for lesson counts per chapter
  sources: string[];    // the book chapter's Sources list, one string per source (title + url as plain text)
}

export interface Lesson {
  id: string;           // "ch05-l3" (unique, stable)
  /** Day of the 30-day plan this lesson belongs to (0..30). Week chapters only. The Today page uses it. */
  day?: number;
  title: string;        // short, friendly: "Why one PoP is many caches"
  goal: string;         // one sentence: what the reader can do after this lesson
  minutes: number;      // estimated 5-12
  steps: Step[];        // 10-22 steps
}

/** move = "Thinking move", trap = "Python trap", mistake = "Common mistake", clue = "15-second clue" */
export type CalloutType = "move" | "trap" | "mistake" | "clue";
export interface Callout { type: CalloutType; text: string }

export type Step =
  | ReadStep
  | QuizStep
  | MultiStep
  | NumberStep
  | OrderStep
  | MatchStep
  | RevealStep
  | WidgetStep
  | SummaryStep
  | CodeStep
  | PracticeStep;

/** One idea. body <= ~90 words. Optional visual shown above or beside the text. */
export interface ReadStep {
  kind: "read";
  title?: string;
  body: string;
  visual?: Visual;
  callout?: Callout;
}

/** Single-answer multiple choice. 2-4 options. */
export interface QuizStep {
  kind: "quiz";
  /** Unscored warm-up: "Take a guess, we haven't covered this yet". No accuracy or XP effect, neutral feedback. Max 1 per lesson. */
  guess?: boolean;
  /** 1-3 sentence refresher of the idea needed to answer, WITHOUT giving the answer. Shown by "I'm not sure, teach me". Required on scored questions. */
  teach?: string;
  prompt: string;
  visual?: Visual;
  options: string[];
  answer: number;       // index into options
  explain: string;      // shown after answering, right or wrong
  hint?: string;        // shown after a first miss (optional)
}

/** Select all that apply. */
export interface MultiStep {
  kind: "multi";
  /** Unscored warm-up: "Take a guess, we haven't covered this yet". No accuracy or XP effect, neutral feedback. Max 1 per lesson. */
  guess?: boolean;
  /** 1-3 sentence refresher of the idea needed to answer, WITHOUT giving the answer. Shown by "I'm not sure, teach me". Required on scored questions. */
  teach?: string;
  prompt: string;
  visual?: Visual;
  options: string[];
  answers: number[];
  explain: string;
  hint?: string;
}

/** Back-of-envelope numeric answer. */
export interface NumberStep {
  kind: "number";
  /** Unscored warm-up: "Take a guess, we haven't covered this yet". No accuracy or XP effect, neutral feedback. Max 1 per lesson. */
  guess?: boolean;
  /** 1-3 sentence refresher of the idea needed to answer, WITHOUT giving the answer. Shown by "I'm not sure, teach me". Required on scored questions. */
  teach?: string;
  prompt: string;
  visual?: Visual;
  answer: number;
  tolerance: number;    // absolute tolerance, e.g. answer 400, tolerance 40
  unit?: string;        // shown next to the input, e.g. "Gbps"
  hint?: string;
  explain: string;      // show the working
}

/** Put items in the correct order. `items` is the CORRECT order; the UI shuffles it. 3-6 items. */
export interface OrderStep {
  kind: "order";
  /** Unscored warm-up: "Take a guess, we haven't covered this yet". No accuracy or XP effect, neutral feedback. Max 1 per lesson. */
  guess?: boolean;
  /** 1-3 sentence refresher of the idea needed to answer, WITHOUT giving the answer. Shown by "I'm not sure, teach me". Required on scored questions. */
  teach?: string;
  prompt: string;
  items: string[];
  explain: string;
  hint?: string;
}

/** Match left to right. `pairs` are the correct pairs; the UI shuffles the right side. 3-5 pairs. */
export interface MatchStep {
  kind: "match";
  /** Unscored warm-up: "Take a guess, we haven't covered this yet". No accuracy or XP effect, neutral feedback. Max 1 per lesson. */
  guess?: boolean;
  /** 1-3 sentence refresher of the idea needed to answer, WITHOUT giving the answer. Shown by "I'm not sure, teach me". Required on scored questions. */
  teach?: string;
  prompt: string;
  pairs: [string, string][];
  explain: string;
}

/** Think first, then tap to reveal. Good for design-review questions. */
export interface RevealStep {
  kind: "reveal";
  prompt: string;
  visual?: Visual;
  answer: string;
}

/** An interactive simulation. `task` tells the reader what to try. */
export interface WidgetStep {
  kind: "widget";
  widget: WidgetId;
  title?: string;
  task: string;          // e.g. "Turn request collapsing off and press Premiere. Watch the origin."
  props?: Record<string, unknown>;
}

export interface SummaryStep {
  kind: "summary";
  title?: string;
  points: string[];      // 3-6 bullets
}

/**
 * Write and run real Python in the browser (Pyodide, loaded on first use).
 * Not scored for accuracy; passing all tests gives XP. "Show solution" is always available.
 */
export interface CodeStep {
  kind: "code";
  title?: string;
  prompt: string;        // what to write, lite markdown
  starter: string;       // code shown in the editor at the start (a signature + "pass", or empty for from-memory)
  solution: string;      // a correct reference solution (must pass every test)
  /** Function tests: `eval(call) == eval(expect)` after running the reader's code.
   *  Stdin tests: run the code as a script with this stdin; stdout is compared token by token. */
  tests: CodeTest[];     // 2-8 tests, small inputs
  teach?: string;        // refresher shown by "I'm not sure, teach me"
  explain?: string;      // shown after passing or after "Show solution"
  /** "Type the template from memory": the editor starts from `starter` and the solution stays hidden until asked. */
  fromMemory?: boolean;
}
export type CodeTest =
  | { call: string; expect: string; label?: string }      // e.g. call "two_sum([3, 2, 4], 6)", expect "[1, 2]"
  | { stdin: string; stdout: string; label?: string };

/** The day's real problems on LeetCode / CSES / Codeforces / AtCoder, as a checklist with time boxes. */
export interface PracticeStep {
  kind: "practice";
  title?: string;
  intro?: string;        // one or two sentences: how to attack the list (time boxes, no AI, log misses)
  problems: Problem[];
}
export interface Problem {
  /** Stable key and display name, exactly as the book writes it:
   *  "LC 1 Two Sum", "CSES — Distinct Numbers", "Codeforces problemset, rating 800–1000, tag implementation, solve 2". */
  ref: string;
  tier: "warm" | "core" | "stretch";
  lvl: string;           // "E" | "M" | "H" | "CSES" | "800–1000" ...
  box: number;           // time box in minutes
  clue: string;          // the clue to notice
  url?: string;          // only if certain; LeetCode links are derived from the title automatically
}

/* ---------------- Visuals ---------------- */

export type Visual =
  | { kind: "flow"; spec: FlowSpec; caption?: string }
  | { kind: "sequence"; spec: SequenceSpec; caption?: string }
  | { kind: "table"; headers: string[]; rows: string[][]; caption?: string }
  | { kind: "code"; lang: string; code: string; caption?: string }
  | { kind: "stats"; items: { value: string; label: string; note?: string }[]; caption?: string }
  | { kind: "compare"; left: { title: string; points: string[] }; right: { title: string; points: string[] }; caption?: string }
  | ArrayVisual
  | GridVisual
  | TreeVisual
  | GraphVisual;

/* Algorithm visuals. Build an algorithm up across consecutive read steps by repeating the visual
   with pointers / tones moved one step at a time (like a flip book). */

/** One or more arrays of cells with pointers under cells and highlighted ranges. */
export interface ArrayVisual {
  kind: "array";
  rows: ArrayRow[];
  indices?: boolean;     // show 0-based indices above the first row
  caption?: string;
}
export interface ArrayRow {
  label?: string;                                         // e.g. "nums", "prefix", "stack"
  items: (string | number)[];
  pointers?: { at: number; label: string; tone?: Tone }[]; // arrows under cells, e.g. {at: 0, label: "L"}
  ranges?: { from: number; to: number; tone?: Tone; label?: string }[]; // inclusive bracket over cells
  tones?: Record<number, Tone>;                           // per-cell color
}

/** A 2-D table, e.g. a DP table or a grid map. Cells may be "" for empty, "#" for walls. */
export interface GridVisual {
  kind: "grid";
  cells: (string | number)[][];
  rowLabels?: string[];
  colLabels?: string[];
  tones?: Record<string, Tone>;                           // key "r,c"
  arrows?: { from: [number, number]; to: [number, number]; tone?: Tone }[]; // dependency arrows between cells
  caption?: string;
}

/** A binary tree from a level-order list (LeetCode style, null = missing child). */
export interface TreeVisual {
  kind: "tree";
  nodes: (string | number | null)[];
  tones?: Record<number, Tone>;                           // key = index in `nodes`
  notes?: Record<number, string>;                         // small label beside a node, e.g. returned value
  caption?: string;
}

/** A small graph with hand-placed nodes. x, y in 0..100. */
export interface GraphVisual {
  kind: "graph";
  nodes: { id: string; label?: string; x: number; y: number; tone?: Tone; note?: string }[];
  edges: { from: string; to: string; w?: number | string; directed?: boolean; tone?: Tone; dashed?: boolean }[];
  caption?: string;
}

export type NodeKind =
  | "viewer" | "device" | "player" | "dns" | "resolver" | "steering" | "api" | "service"
  | "cdn" | "pop" | "edge" | "shield" | "origin" | "storage" | "packager" | "encoder"
  | "drm" | "isp" | "ix" | "cloud" | "region" | "monitor" | "database" | "queue"
  | "router" | "loadbalancer" | "cache" | "firewall" | "studio" | "generic";

export type Tone = "neutral" | "good" | "bad" | "warn" | "accent";

/**
 * A node-and-arrow diagram on a small grid. col 0..5, row 0..7.
 * Build ideas up across consecutive steps by repeating the SAME spec with a different `focus`/`flow`,
 * instead of one big merged diagram.
 */
export interface FlowSpec {
  nodes: FlowNode[];
  edges: FlowEdge[];
  groups?: { id: string; label: string; nodes: string[]; tone?: Tone }[];
  /** ids of nodes and edge keys ("a>b") to highlight; everything else is dimmed. Omit = nothing dimmed. */
  focus?: string[];
  /** ordered edge keys ("a>b") along which an animated packet travels. */
  flow?: string[];
  direction?: "down" | "right"; // reading direction hint, default "right"
}
export interface FlowNode {
  id: string;
  label: string;        // <= 18 chars ideally
  sub?: string;         // small second line, <= 26 chars
  kind?: NodeKind;
  col: number;
  row: number;
  tone?: Tone;
  badge?: string;       // tiny pill, e.g. "HIT", "MISS", "404", "x32"
}
export interface FlowEdge {
  from: string;
  to: string;
  label?: string;       // <= 16 chars
  dashed?: boolean;
  tone?: Tone;
  both?: boolean;       // arrowheads on both ends
}

/** A step-by-step message exchange. `upTo` shows messages[0..upTo] (inclusive); omit = all. */
export interface SequenceSpec {
  actors: { id: string; label: string; kind?: NodeKind }[];
  messages: { from: string; to: string; label: string; note?: string; tone?: Tone; dashed?: boolean }[];
  upTo?: number;
}

/* ---------------- Course meta ---------------- */
export interface PartMeta { id: PartId; name: string; blurb: string }
export interface GlossaryEntry { term: string; def: string }
