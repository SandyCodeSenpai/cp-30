/** Python templates from Day 26 (chapter 7), line for line. Usage lines are marked. */

export const KMP_CODE = [
  "def prefix_function(s):",
  "    n = len(s)",
  "    pi = [0] * n",
  "    for i in range(1, n):",
  "        k = pi[i - 1]",
  "        while k and s[i] != s[k]:",
  "            k = pi[k - 1]",
  "        if s[i] == s[k]:",
  "            k += 1",
  "        pi[i] = k",
  "    return pi",
  "",
  "def find_all(text, pat):                     # start indices of pat in text",
  "    m = len(pat)",
  "    pi = prefix_function(pat + \"\\x00\" + text)",
  "    return [i - 2 * m for i in range(len(pi)) if pi[i] == m]",
];
export const KL = { def: 0, n: 1, pi0: 2, for: 3, kInit: 4, while: 5, fall: 6, if: 7, inc: 8, set: 9, ret: 10, find: 12, m: 13, call: 14, findRet: 15 } as const;

export const Z_CODE = [
  "def z_function(s):                           # z[0] left as 0 by convention",
  "    n = len(s)",
  "    z = [0] * n",
  "    l = r = 0                                # s[l:r] matches s[0:r-l]",
  "    for i in range(1, n):",
  "        if i < r:",
  "            z[i] = min(r - i, z[i - l])",
  "        while i + z[i] < n and s[z[i]] == s[i + z[i]]:",
  "            z[i] += 1",
  "        if i + z[i] > r:",
  "            l, r = i, i + z[i]",
  "    return z",
];
export const ZL = { def: 0, init: 3, for: 4, inBox: 5, copy: 6, while: 7, inc: 8, ifBox: 9, move: 10, ret: 11 } as const;

export const HASH_CODE = [
  "import random",
  "M = (1 << 61) - 1",
  "B = random.randrange(10**6, M - 1)           # chosen at runtime: cannot be hacked",
  "",
  "def build(s):",
  "    n = len(s)",
  "    h, pw = [0] * (n + 1), [1] * (n + 1)",
  "    for i, ch in enumerate(s):",
  "        h[i + 1] = (h[i] * B + ord(ch)) % M",
  "        pw[i + 1] = pw[i] * B % M",
  "    return h, pw",
  "",
  "def sub_hash(h, pw, l, r):                   # hash of s[l:r]",
  "    return (h[r] - h[l] * pw[r - l]) % M",
  "",
  "m = len(pat)                                 # usage: find pat in text",
  "h, pw = build(text)",
  "target = build(pat)[0][m]                    # hash of the whole pattern",
  "for l in range(len(text) - m + 1):",
  "    if sub_hash(h, pw, l, l + m) == target:  # equal hash: maybe equal",
  "        if text[l:l + m] == pat:             # confirm: rules out a collision",
  "            print(l)",
];
export const HL = { M: 1, B: 2, build: 4, init: 6, for: 7, h: 8, pw: 9, ret: 10, sub: 12, subRet: 13, m: 15, hb: 16, target: 17, loop: 18, cmp: 19, confirm: 20, print: 21 } as const;
