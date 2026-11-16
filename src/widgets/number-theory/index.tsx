/**
 * Primes, mod and fast power lab.
 * Modes (props.mode): sieve · fast-pow · mod-inverse · gcd.
 * Props: n?: number (sieve: N up to 120; fast-pow: the exponent b; mod-inverse: n for nCr; gcd: the first number a).
 */
import { useState } from "react";
import { Segmented } from "@/ui";
import type { WidgetProps } from "../types";
import { numProp } from "../bits/kit/player";
import Sieve from "./Sieve";
import FastPow from "./FastPow";
import ModInverse from "./ModInverse";
import Gcd from "./Gcd";
import "./nt.css";

type Mode = "sieve" | "fast-pow" | "mod-inverse" | "gcd";
const MODES: { value: Mode; label: string }[] = [
  { value: "sieve", label: "Sieve" },
  { value: "fast-pow", label: "Fast pow" },
  { value: "mod-inverse", label: "Inverse, nCr" },
  { value: "gcd", label: "GCD" },
];

export default function NumberTheoryLab(props: WidgetProps) {
  const given = MODES.find((m) => m.value === props.mode)?.value;
  const [mode, setMode] = useState<Mode>(given ?? "sieve");
  const n0 = numProp(props.n);
  const showTabs = !given || props.compact === false;
  const tabs = showTabs ? <Segmented<Mode> value={mode} onChange={setMode} options={MODES} /> : undefined;
  const common = { tabs, onComplete: props.onComplete };
  return (
    <div className="nt-root">
      {mode === "sieve" && <Sieve key="s" n0={n0} {...common} />}
      {mode === "fast-pow" && <FastPow key="f" b0={n0} {...common} />}
      {mode === "mod-inverse" && <ModInverse key="m" n0={n0} {...common} />}
      {mode === "gcd" && <Gcd key="g" n0={n0} {...common} />}
    </div>
  );
}
