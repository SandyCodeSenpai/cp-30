/** Python templates from Day 3 (chapter 4). Keep them identical to the book. */

/** The book's fixed window: start from cur = sum(a[:k]), then cur += a[i] - a[i - k] for i from k to n - 1 (LC 643). */
export const FIXED = `# Fixed window of size k: add one, drop one (LC 643)
def max_window_sum(a, k):
    cur = sum(a[:k])
    best = cur
    for i in range(k, len(a)):
        cur += a[i] - a[i - k]
        best = max(best, cur)
    return best`;

export const LONGEST_COUNT = `from collections import defaultdict

# 1. Longest valid window (here: no repeated character, LC 3)
def longest_window(s):
    count = defaultdict(int)
    left = best = 0
    for right, ch in enumerate(s):
        count[ch] += 1                          # add right
        while count[ch] > 1:                    # shrink while invalid
            count[s[left]] -= 1
            left += 1
        best = max(best, right - left + 1)      # window is valid here
    return best`;

/** Same problem with a last-seen map: left jumps straight past the old copy (CSES Playlist style). */
export const LONGEST_LAST = `# Same window with a last-seen map: left jumps, never steps
def longest_window(s):
    last = {}                                   # char -> last index seen
    left = best = 0
    for right, ch in enumerate(s):
        if ch in last and last[ch] >= left:
            left = last[ch] + 1                 # jump past the old copy
        last[ch] = right
        best = max(best, right - left + 1)      # window is valid here
    return best`;

export const SHORTEST = `# 2. Shortest valid window (positive values, sum >= target)
def shortest_window(nums, target):
    left = cur = 0
    best = len(nums) + 1
    for right, x in enumerate(nums):
        cur += x
        while cur >= target:                    # valid: record, then shrink
            best = min(best, right - left + 1)
            cur -= nums[left]
            left += 1
    return best if best <= len(nums) else 0`;
