/** Python shown in the bits lab. The cheat sheet and templates are the book's Day 24 templates. */

/** Basics: five plain operators on top, then the Day 24 cheat sheet exactly. */
export const BASICS_CODE = [
  "r = x & y                    # AND: 1 where both are 1",
  "r = x | y                    # OR: 1 where either is 1",
  "r = x ^ y                    # XOR: 1 where they differ",
  "r = x << k                   # shift left: x * 2**k",
  "r = x >> k                   # shift right: x // 2**k",
  "neg = ~x + 1                 # two's complement: equals -x",
  "",
  "# cheat sheet: each line stands alone",
  "low = x & -x                 # lowest set bit as a value: 12 -> 4",
  "x &= x - 1                   # drop the lowest set bit",
  "is_pow2 = x > 0 and x & (x - 1) == 0",
  "ones = x.bit_count()         # Python 3.10+; fallback: bin(x).count(\"1\")",
  "width = x.bit_length()       # 12 -> 4",
  "has_b = (x >> b) & 1",
  "x |= 1 << b                  # set bit b",
  "x &= ~(1 << b)               # clear bit b",
  "x ^= 1 << b                  # flip bit b",
];
export const BL = { and: 0, or: 1, xor: 2, shl: 3, shr: 4, neg: 5, lowbit: 8, clearlow: 9, flip: 16 } as const;

/** Subsets: the submask loop from the Day 24 cheat sheet, plus the bitmask = set idea from Day 19. */
export const SUBSETS_CODE = [
  "sub = mask                   # all non-empty submasks of mask",
  "while sub:",
  "    # ... use sub ...",
  "    sub = (sub - 1) & mask",
  "",
  "# bit i of a mask means \"item i is in the set\"",
  "items = [i for i in range(n) if (sub >> i) & 1]",
];
export const SL = { init: 0, loop: 1, use: 2, next: 3, items: 6 } as const;

export const SINGLE_CODE = [
  "def single_number(nums):     # every value twice except one",
  "    ans = 0",
  "    for x in nums:",
  "        ans ^= x             # a ^ a = 0 and a ^ 0 = a",
  "    return ans",
];
export const PREFIX_CODE = [
  "px = [0] * (len(a) + 1)      # px[i] = a[0] ^ ... ^ a[i-1]",
  "for i, x in enumerate(a):",
  "    px[i + 1] = px[i] ^ x",
  "",
  "def range_xor(l, r):         # a[l] ^ ... ^ a[r]",
  "    return px[r + 1] ^ px[l]",
];

/** Per-bit: the book's pair_bit_sums template exactly. */
export const PERBIT_CODE = [
  "def pair_bit_sums(a, bits=31):          # sums over pairs i < j",
  "    n = len(a)",
  "    xor_s = and_s = or_s = 0",
  "    for b in range(bits):",
  "        ones = sum((x >> b) & 1 for x in a)",
  "        zeros = n - ones",
  "        xor_s += ones * zeros << b",
  "        and_s += ones * (ones - 1) // 2 << b",
  "        or_s += (n * (n - 1) // 2 - zeros * (zeros - 1) // 2) << b",
  "    return xor_s, and_s, or_s",
];
