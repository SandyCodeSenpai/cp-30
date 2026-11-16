import { createContext } from "react";
import type { Visual } from "@/content/types";
/** true on wide viewports (>= 1100px): flow, sequence, tree and graph visuals move to a sticky left column. */
export const WideCtx = createContext(false);
export const WIDE_QUERY = "(min-width: 1100px)";
export const splitsVisual = (v?: Visual) => !!v && (v.kind === "flow" || v.kind === "sequence" || v.kind === "tree" || v.kind === "graph");
/** true inside the lesson player: it draws step visuals itself (so they can stay mounted across steps). */
export const HoistCtx = createContext(false);
/**
 * Visual kinds that stay mounted when consecutive steps use the same kind, so the diagram engine can animate
 * pointers, tones and focus from one step to the next (a flip book).
 */
export const FLIP_KINDS = new Set<Visual["kind"]>(["array", "grid", "tree", "graph", "flow", "sequence"]);
