/** Python shown in the number-theory lab: the book's Day 22 and Day 23 templates. */

export const SIEVE_CODE = [
  "def sieve(n):                       # n >= 2; is_prime[x] == 1 iff x prime",
  "    is_prime = bytearray([1]) * (n + 1)",
  "    is_prime[0] = is_prime[1] = 0",
  "    for i in range(2, isqrt(n) + 1):",
  "        if is_prime[i]:",
  "            is_prime[i * i::i] = bytes(len(range(i * i, n + 1, i)))",
  "    return is_prime",
];
export const SPF_CODE = [
  "def spf_sieve(n):",
  "    spf = list(range(n + 1))",
  "    for i in range(2, isqrt(n) + 1):",
  "        if spf[i] == i:             # i is prime",
  "            for j in range(i * i, n + 1, i):",
  "                if spf[j] == j:",
  "                    spf[j] = i",
  "    return spf",
];
export const FACTOR_CODE = [
  "def factorize(x, spf):              # {prime: exponent}",
  "    f = {}",
  "    while x > 1:",
  "        p = spf[x]",
  "        while x % p == 0:",
  "            x //= p",
  "            f[p] = f.get(p, 0) + 1",
  "    return f",
];

export const POW_CODE = [
  "MOD = 10**9 + 7",
  "",
  "def power(a, b, mod=MOD):          # what pow(a, b, mod) does; write it once to understand",
  "    res, a = 1, a % mod",
  "    while b:",
  "        if b & 1:",
  "            res = res * a % mod",
  "        a = a * a % mod",
  "        b >>= 1",
  "    return res",
];
export const PL = { init: 3, loop: 4, test: 5, mul: 6, sq: 7, shift: 8, ret: 9 } as const;

export const INV_CODE = [
  ...POW_CODE,
  "",
  "inv = power(a, MOD - 2)            # Fermat: MOD is prime, so a^(MOD-2) = 1/a",
  "inv3 = pow(3, -1, MOD)              # 3.8+; raises ValueError if gcd(3, MOD) != 1",
  "half = 10 * pow(2, MOD - 2, MOD) % MOD   # \"10 / 2\" under MOD -> 5",
];
export const IL = { call: 11 } as const;

export const NCR_CODE = [
  "N = 2 * 10**5 + 5                   # largest n you will ever need",
  "fact = [1] * (N + 1)",
  "for i in range(1, N + 1):",
  "    fact[i] = fact[i - 1] * i % MOD",
  "inv_fact = [1] * (N + 1)",
  "inv_fact[N] = pow(fact[N], MOD - 2, MOD)",
  "for i in range(N, 0, -1):",
  "    inv_fact[i - 1] = inv_fact[i] * i % MOD",
  "",
  "def nCr(n, r):",
  "    if r < 0 or r > n:",
  "        return 0",
  "    return fact[n] * inv_fact[r] % MOD * inv_fact[n - r] % MOD",
];
export const NL = { n: 0, fact0: 1, fact: 3, inv0: 4, invN: 5, inv: 7, ret: 12 } as const;

export const GCD_CODE = [
  "def gcd(a, b):                     # what math.gcd does",
  "    while b:",
  "        a, b = b, a % b",
  "    return a",
  "",
  "from math import gcd, lcm           # lcm needs Python 3.9+",
  "l = a // gcd(a, b) * b              # lcm without a huge a * b",
];
