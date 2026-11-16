/** Python templates from Day 2 (chapter 4). Keep them identical to the book. */

export const PAIR_SUM = `# 1. Pair with target sum on a sorted array
def pair_sum(a, target):
    i, j = 0, len(a) - 1
    while i < j:
        s = a[i] + a[j]
        if s == target:
            return i, j
        if s < target:
            i += 1
        else:
            j -= 1
    return -1, -1`;

/** LC 125 Valid Palindrome, written in the same shape as the pair-sum template. */
export const PALINDROME = `# Compare from both ends; skip non-alphanumerics (LC 125)
def is_palindrome(s):
    i, j = 0, len(s) - 1
    while i < j:
        if not s[i].isalnum():
            i += 1
        elif not s[j].isalnum():
            j -= 1
        elif s[i].lower() != s[j].lower():
            return False
        else:
            i += 1
            j -= 1
    return True`;

export const THREE_SUM = `# 2. All unique triples summing to 0 (LC 15 core)
def three_sum(nums):
    nums.sort()
    n, res = len(nums), []
    for i in range(n - 2):
        if i > 0 and nums[i] == nums[i - 1]:
            continue                          # skip duplicate first value
        lo, hi = i + 1, n - 1
        while lo < hi:
            s = nums[i] + nums[lo] + nums[hi]
            if s < 0:
                lo += 1
            elif s > 0:
                hi -= 1
            else:
                res.append([nums[i], nums[lo], nums[hi]])
                lo += 1
                hi -= 1
                while lo < hi and nums[lo] == nums[lo - 1]:
                    lo += 1                   # skip duplicate second value
    return res`;

/** Template 3 (read/write compaction) with keep(x) = "x is not a copy of the last kept value" (LC 26). */
export const COMPACT = `# 3. Read/write compaction: keep elements where keep(x) is True, in order
#    Here keep(a[r]) = "a[r] is new" (remove duplicates, LC 26)
def compact(a):
    w = 0
    for r in range(len(a)):
        if w == 0 or a[r] != a[w - 1]:        # keep(a[r])
            a[w] = a[r]
            w += 1
    return w                                  # new length`;
