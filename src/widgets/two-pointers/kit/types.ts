/**
 * Shared types for the step-by-step algorithm players (two-pointers, sliding-window).
 * An engine is a pure function: input -> Frame[]. The UI only ever shows frames[index],
 * so Step back, Step, Play and Reset are trivial and always correct.
 */
import type { Tone } from "@/content/types";

export type { Tone };
export type CellTone = Tone | "dim" | "faint";

export interface Cell {
  /** Stable id. Keep it the same for the same element across frames so moves (like a sort) animate. */
  id: string;
  text: string;
  tone?: CellTone;
  /** Quiet glyph (space, comma) that the algorithm skips. */
  quiet?: boolean;
}

export interface Pointer {
  id: string;
  label: string;
  /** Cell index, or null to hide the pointer. */
  at: number | null;
  side?: "top" | "bottom";
  /** "accent" = this pointer just moved. */
  tone?: Tone;
}

export interface Band { from: number; to: number; tone?: Tone }

export interface Kv { k: string; v: string; tone?: Tone | "dim" }

export interface View {
  cells: Cell[];
  pointers: Pointer[];
  /** The live range: the window, or the candidates still alive. */
  band?: Band | null;
  /** A second, dashed outline (the best window so far). */
  ghost?: Band | null;
  chips: Kv[];
  map?: { title: string; entries: Kv[]; empty?: string };
  results?: { title: string; items: string[]; empty?: string };
}

export interface Predict {
  q: string;
  options: string[];
  answer: number;
  why: string;
}

export interface Frame {
  /** 1-based code lines running in this frame. */
  line: number[];
  /** One short sentence. */
  say: string;
  tone?: Tone;
  view: View;
  /** Asked before this frame is shown, when Predict is on. */
  predict?: Predict;
}

export interface RawInput { main: string; second?: string }

export type Built = { ok: true; frames: Frame[]; note?: string } | { ok: false; error: string };

/** One tab of a lab. */
export interface ModeSpec {
  id: string;
  label: string;
  /** Short line under the tabs: what this mode solves. */
  blurb: string;
  code: string;
  mainLabel: string;
  mainHint: string;
  secondLabel?: string;
  presets: { name: string; main: string; second?: string }[];
  random: () => RawInput;
  /** Validate the raw input and run the engine. Pure. */
  build: (raw: RawInput) => Built;
}
