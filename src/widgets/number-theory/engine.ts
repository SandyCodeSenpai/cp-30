/** Pure frame builders for the number-theory lab. BigInt wherever a value can pass 2^53. */
import type { Ask, BaseFrame } from "../bits/kit/player";
import { group } from "../bits/kit/player";
import { NL, PL } from "./code";

export const MOD = 1_000_000_007n;
export const isqrt = (n: number) => Math.floor(Math.sqrt(n));
export function modpow(a: bigint, b: bigint, m: bigint): bigint {
  let res = 1n % m; a %= m;
  while (b > 0n) { if (b & 1n) res = (res * a) % m; a = (a * a) % m; b >>= 1n; }
  return res;
}
export const fmtBig = (v: bigint) => group(v);
export const modName = (m: bigint) => (m === MOD ? "10^9+7" : String(m));

/* ---------------- sieve, SPF, factorize ---------------- */

export interface SieveFrame extends BaseFrame { i: number | null; crossedBy: number[][]; fresh: number[]; done: boolean }
export function buildSieve(n: number): SieveFrame[] {
  const F: SieveFrame[] = [];
  const crossedBy: number[][] = Array.from({ length: n + 1 }, () => []);
  const isP = new Array(n + 1).fill(true); isP[0] = isP[1] = false;
  const r = isqrt(n);
  F.push({ line: 1, say: `Start with every number from 0 to ${n} marked prime (1).`, i: null, crossedBy: crossedBy.map((c) => c.slice()), fresh: [], done: false });
  F.push({ line: 2, say: "0 and 1 are not prime, so mark them 0.", i: null, crossedBy: crossedBy.map((c) => c.slice()), fresh: [], done: false });
  F.push({ line: 3, say: `i runs from 2 to isqrt(${n}) = ${r}. A number above ${r} that is not prime has a factor ≤ ${r}, so it gets crossed out anyway.`, i: null, crossedBy: crossedBy.map((c) => c.slice()), fresh: [], done: false });
  let firstPrime = true;
  for (let i = 2; i <= r; i++) {
    if (!isP[i]) {
      F.push({ line: 4, say: `i = ${i} is already crossed out (by ${crossedBy[i][0]}), so it is not prime. Skip it.`, i, crossedBy: crossedBy.map((c) => c.slice()), fresh: [], done: false });
      continue;
    }
    const fresh: number[] = [];
    const mults: number[] = [];
    for (let j = i * i; j <= n; j += i) { mults.push(j); if (isP[j]) fresh.push(j); isP[j] = false; crossedBy[j].push(i); }
    F.push({
      line: 4, say: `i = ${i} is still marked 1, so ${i} is prime.`, i, crossedBy: F[F.length - 1].crossedBy, fresh: [], done: false,
      ask: firstPrime || i === 3 ? { q: `Cross out the multiples of ${i}. Where do you start?`, options: [`${i} * ${i} = ${i * i}`, `2 * ${i} = ${2 * i}`, `${i}`], answer: 0, why: `Smaller multiples like ${i} * 2 already have a smaller prime factor, so they are crossed out already.` } : undefined,
    });
    firstPrime = false;
    const shown = mults.length > 6 ? `${mults.slice(0, 4).join(", ")}, ... ${mults[mults.length - 1]}` : mults.join(", ");
    F.push({
      line: 5,
      say: mults.length ? `Cross out ${shown}: every ${i}th number from ${i}*${i} = ${i * i}. ${fresh.length < mults.length ? `${mults.length - fresh.length} of them were already crossed.` : ""}`.trim() : `${i}*${i} = ${i * i} is past ${n}: nothing to cross.`,
      i, crossedBy: crossedBy.map((c) => c.slice()), fresh, done: false,
    });
  }
  const primes = isP.map((p, k) => (p ? k : -1)).filter((k) => k >= 0);
  F.push({ line: 6, say: `Done. The ${primes.length} numbers still marked are the primes. The first colour on each crossed number is its smallest prime factor.`, i: null, crossedBy: crossedBy.map((c) => c.slice()), fresh: [], done: true });
  return F;
}

export interface SpfFrame extends BaseFrame { i: number | null; spf: number[]; fresh: number[]; kept: number[]; done: boolean }
export function buildSpf(n: number): SpfFrame[] {
  const F: SpfFrame[] = [];
  const spf = Array.from({ length: n + 1 }, (_, k) => k);
  const r = isqrt(n);
  F.push({ line: 1, say: "spf = list(range(n + 1)): every number starts as its own smallest prime factor.", i: null, spf: spf.slice(), fresh: [], kept: [], done: false });
  for (let i = 2; i <= r; i++) {
    if (spf[i] !== i) {
      F.push({ line: 3, say: `spf[${i}] = ${spf[i]}, not ${i}: ${i} is not prime. Skip it.`, i, spf: spf.slice(), fresh: [], kept: [], done: false });
      continue;
    }
    const fresh: number[] = [], kept: number[] = [];
    for (let j = i * i; j <= n; j += i) { if (spf[j] === j) { spf[j] = i; fresh.push(j); } else kept.push(j); }
    F.push({
      line: 3, say: `spf[${i}] == ${i}, so ${i} is prime. Visit its multiples from ${i * i}.`, i, spf: F[F.length - 1].spf, fresh: [], kept: [], done: false,
      ask: i === 3 && kept.length ? { q: `spf[12] is already 2. When i = 3 reaches 12, what happens?`, options: ["It stays 2", "It becomes 3", "It becomes 6"], answer: 0, why: "`if spf[j] == j` only writes numbers that have no factor yet, so the smallest prime wins." } : undefined,
    });
    F.push({
      line: 6,
      say: fresh.length ? `Set spf = ${i} for ${fresh.length > 6 ? fresh.slice(0, 5).join(", ") + ", ..." : fresh.join(", ")}.${kept.length ? ` ${kept.length > 4 ? kept.slice(0, 3).join(", ") + ", ..." : kept.join(", ")} already ${kept.length === 1 ? "has" : "have"} a smaller prime, so ${kept.length === 1 ? "it stays" : "they stay"}.` : ""}`
        : `Every multiple of ${i} from ${i * i} already has a smaller prime factor.`,
      i, spf: spf.slice(), fresh, kept, done: false,
    });
  }
  F.push({ line: 7, say: "Done. spf[x] is the smallest prime that divides x. For a prime, spf[x] == x. Build it once in O(n log log n).", i: null, spf: spf.slice(), fresh: [], kept: [], done: true });
  return F;
}

export interface FactorFrame extends BaseFrame { x: number; p: number | null; f: [number, number][]; ladder: { x: number; p: number }[]; done: boolean }
export function spfTable(n: number) {
  const spf = Array.from({ length: n + 1 }, (_, k) => k);
  for (let i = 2; i * i <= n; i++) if (spf[i] === i) for (let j = i * i; j <= n; j += i) if (spf[j] === j) spf[j] = i;
  return spf;
}
export const factStr = (f: [number, number][]) => f.map(([p, e]) => (e > 1 ? `${p}^${e}` : `${p}`)).join(" * ") || "1";
export function buildFactor(x0: number, spf: number[]): FactorFrame[] {
  const F: FactorFrame[] = [];
  const f: [number, number][] = [];
  const ladder: { x: number; p: number }[] = [];
  let x = x0;
  F.push({ line: 1, say: `Factorize x = ${x0} with the SPF table. Start with an empty dict f.`, x, p: null, f: [], ladder: [], done: false });
  while (x > 1) {
    const p = spf[x];
    F.push({
      line: 3, say: `Look up spf[${x}] = ${p}. That is the smallest prime that divides ${x}.`, x, p, f: f.map((t) => [t[0], t[1]]), ladder: ladder.slice(), done: false,
      ask: F.length === 1 ? { q: `x = ${x}. What is \`spf[${x}]\`?`, options: Array.from(new Set([String(p), String(Math.floor(x / p)), String(x)])).slice(0, 3), answer: 0, why: `The smallest prime that divides ${x} is ${p}.` } : undefined,
    });
    while (x % p === 0) {
      ladder.push({ x, p });
      const was = x;
      x = x / p;
      const e = f.find((t) => t[0] === p);
      if (e) e[1]++; else f.push([p, 1]);
      F.push({ line: 5, say: `${was} // ${p} = ${x}. f[${p}] = ${f.find((t) => t[0] === p)![1]}.${x % p === 0 ? ` ${x} is still divisible by ${p}.` : ""}`, x, p, f: f.map((t) => [t[0], t[1]]), ladder: ladder.slice(), done: false });
    }
  }
  F.push({
    line: 7, say: x0 === 1 ? "x = 1 has no prime factors: return {}." : `x = 1, stop. ${x0} = ${factStr(f)}. Each step divides x by at least 2, so this takes O(log x) steps.`,
    x, p: null, f: f.map((t) => [t[0], t[1]]), ladder: ladder.slice(), done: true,
  });
  return F;
}

/* ---------------- fast power ---------------- */

export interface PowRow { k: number; bit: number; sq: bigint; res: bigint | null }
export interface PowFrame extends BaseFrame { k: number; a: bigint; res: bigint; b: bigint; rows: PowRow[]; phase: "init" | "test" | "mul" | "sq" | "done"; mulOld?: bigint; raw?: bigint }
export const bitLen = (b: bigint) => (b === 0n ? 0 : b.toString(2).length);
export const powLabel = (base: string, k: number) => (k < 21 ? `${base}^${2 ** k}` : `${base}^(2^${k})`);

export function buildPow(a0: bigint, b0: bigint, m: bigint, baseName: string, lineOff = 0): PowFrame[] {
  const F: PowFrame[] = [];
  const L = (n: number) => n + lineOff;
  const M = modName(m);
  let a = a0 % m, res = 1n, b = b0, k = 0;
  const rows: PowRow[] = [];
  const bits = b0.toString(2);
  F.push({
    line: L(PL.init), say: `res = 1 and a = ${baseName} % ${M} = ${fmtBig(a)}. The exponent ${fmtBig(b0)} is ${bits.length > 24 ? `${bits.length} bits` : `0b${bits}`} in binary.`,
    k: -1, a, res, b, rows: [], phase: "init",
  });
  const total = bitLen(b0);
  while (b > 0n) {
    const bit = Number(b & 1n);
    rows.push({ k, bit, sq: a, res: null });
    const snap = () => rows.map((r) => ({ ...r }));
    F.push({
      line: L(PL.test), say: `Bit ${k} of the exponent: b & 1 = ${bit}. Right now a = ${powLabel(baseName, k)} mod ${M} = ${fmtBig(a)}.`,
      k, a, res, b, rows: snap(), phase: "test",
      ask: k < 3 ? { q: `b & 1 = ${bit}. What happens to res?`, options: ["`res = res * a % mod`", "res stays the same"], answer: bit ? 0 : 1, why: bit ? `Bit ${k} is 1, so ${powLabel(baseName, k)} is part of the product.` : `Bit ${k} is 0, so ${powLabel(baseName, k)} is not part of the product.` } : undefined,
    });
    if (bit) {
      const old = res;
      const raw = res * a;
      res = raw % m;
      rows[rows.length - 1].res = res;
      F.push({
        line: L(PL.mul), say: raw >= m ? `res = ${fmtBig(old)} * ${fmtBig(a)} = ${fmtBig(raw)}, then % ${M} = ${fmtBig(res)}.` : `res = ${fmtBig(old)} * ${fmtBig(a)} = ${fmtBig(res)}.`,
        k, a, res, b, rows: snap(), phase: "mul", mulOld: old, raw,
      });
    } else rows[rows.length - 1].res = res;
    const raw = a * a;
    a = raw % m;
    b >>= 1n;
    F.push({
      line: L(PL.sq), say: `Square a: ${raw >= m ? `${fmtBig(rows[rows.length - 1].sq)}^2 % ${M} = ${fmtBig(a)}` : `${fmtBig(rows[rows.length - 1].sq)}^2 = ${fmtBig(a)}`}, which is ${powLabel(baseName, k + 1)}. Then b >>= 1 drops the bit just used.`,
      k, a, res, b, rows: rows.map((r) => ({ ...r })), phase: "sq",
    });
    k++;
  }
  const used = rows.filter((r) => r.bit).map((r) => r.k).reverse();
  const muls = used.length;
  F.push({
    line: L(PL.ret),
    say: total === 0 ? `b = 0: the loop never runs. ${baseName}^0 = 1.`
      : `b = 0, return ${fmtBig(res)}. ${used.length > 1 && total <= 20 ? `${fmtBig(b0)} = ${used.map((u) => 2 ** u).join(" + ")}, so the answer is ${used.map((u) => powLabel(baseName, u)).join(" * ")}. ` : ""}${total} squarings and ${muls} multiplies, instead of ${fmtBig(b0)} multiplies: O(log b).`,
    k: total, a, res, b, rows: rows.map((r) => ({ ...r })), phase: "done",
  });
  return F;
}

/* ---------------- nCr ---------------- */

export interface NcrFrame extends BaseFrame { fact: (bigint | null)[]; inv: (bigint | null)[]; i: number; col: "fact" | "inv" | null; query: boolean; ans?: bigint }
export function buildNcr(n: number, r: number): NcrFrame[] {
  const N = n;
  const F: NcrFrame[] = [];
  const fact: (bigint | null)[] = new Array(N + 1).fill(null); fact[0] = 1n;
  const inv: (bigint | null)[] = new Array(N + 1).fill(null);
  F.push({ line: NL.n, say: `The book sets N = 2 * 10**5 + 5. Here N = ${N}, so the table fits on screen. fact[0] = 1.`, fact: fact.slice(), inv: inv.slice(), i: 0, col: "fact", query: false });
  for (let i = 1; i <= N; i++) {
    fact[i] = (fact[i - 1]! * BigInt(i)) % MOD;
    F.push({ line: NL.fact, say: `fact[${i}] = fact[${i - 1}] * ${i} % MOD = ${fmtBig(fact[i]!)}.`, fact: fact.slice(), inv: inv.slice(), i, col: "fact", query: false });
  }
  inv[N] = modpow(fact[N]!, MOD - 2n, MOD);
  F.push({
    line: NL.invN, say: `One Fermat inverse: inv_fact[${N}] = fact[${N}]^(MOD-2) % MOD = ${fmtBig(inv[N]!)}. It is the number that times ${fmtBig(fact[N]!)} gives 1 mod 10^9+7.`,
    fact: fact.slice(), inv: inv.slice(), i: N, col: "inv", query: false,
    ask: { q: `Now fill downward. What is \`inv_fact[i - 1]\`?`, options: ["`inv_fact[i] * i % MOD`", "`inv_fact[i] // i`", "`pow(fact[i - 1], MOD - 2, MOD)` each time"], answer: 0, why: "1/(i-1)! = i / i!, so multiply by i. No division and only one pow call in total." },
  });
  for (let i = N; i >= 1; i--) {
    inv[i - 1] = (inv[i]! * BigInt(i)) % MOD;
    F.push({ line: NL.inv, say: `inv_fact[${i - 1}] = inv_fact[${i}] * ${i} % MOD = ${fmtBig(inv[i - 1]!)}${i - 1 <= 1 ? " (it is 1, as it should be)" : ""}.`, fact: fact.slice(), inv: inv.slice(), i: i - 1, col: "inv", query: false });
  }
  const ans = (((fact[n]! * inv[r]!) % MOD) * inv[n - r]!) % MOD;
  let exact = 1n; for (let k = 1; k <= r; k++) exact = (exact * BigInt(n - r + k)) / BigInt(k);
  F.push({
    line: NL.ret, say: `nCr(${n}, ${r}) = fact[${n}] * inv_fact[${r}] * inv_fact[${n - r}] % MOD = ${fmtBig(ans)}. The exact value is ${fmtBig(exact)}${exact >= MOD ? `, which is ${fmtBig(exact % MOD)} mod 10^9+7` : ""}. O(1) per query.`,
    fact: fact.slice(), inv: inv.slice(), i: -1, col: null, query: true, ans,
  });
  return F;
}

/* ---------------- gcd ---------------- */

export interface GcdStep { a: number; b: number; q: number; r: number }
export interface GcdFrame extends BaseFrame { steps: GcdStep[]; a: number; b: number; done: boolean }
export function buildGcd(a0: number, b0: number): GcdFrame[] {
  const F: GcdFrame[] = [];
  let a = a0, b = b0;
  const steps: GcdStep[] = [];
  F.push({ line: 0, say: `Start with the pair (a, b) = (${a}, ${b}). Any number that divides both also divides a % b.`, steps: [], a, b, done: false });
  while (b) {
    const q = Math.floor(a / b), r = a % b;
    const ask: Ask | undefined = steps.length < 2
      ? { q: `(a, b) = (${a}, ${b}). What is the next pair?`, options: [`(${b}, ${r})`, `(${b}, ${a - b})`, `(${r}, ${b})`].filter((v, i, s) => s.indexOf(v) === i), answer: 0, why: `${a} = ${q} * ${b} + ${r}, so a % b = ${r} and the pair becomes (b, a % b) = (${b}, ${r}).` }
      : undefined;
    if (ask) F[F.length - 1].ask = ask;
    steps.push({ a, b, q, r });
    F.push({ line: 2, say: `${a} = ${q} * ${b} + ${r}. So a % b = ${r}, and the pair shrinks to (${b}, ${r}).${r === 0 ? " The remainder is 0." : ""}`, steps: steps.slice(), a: b, b: r, done: false });
    [a, b] = [b, r];
  }
  const g = a, l = (a0 / g) * b0;
  F.push({ line: 3, say: `b = 0, so return a = ${g}. gcd(${a0}, ${b0}) = ${g} after ${steps.length} step${steps.length === 1 ? "" : "s"}. lcm = ${a0} // ${g} * ${b0} = ${l}.`, steps: steps.slice(), a, b, done: true });
  return F;
}
