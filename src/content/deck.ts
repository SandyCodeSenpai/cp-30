/** The 150-card recognition deck (book chapter 9). Generated from chapters/09-recognition-gym.md. */
export interface Card { n: number; day: number; front: string; pattern: string; target: string; signal: string }
export const DECK: Card[] = [
 {
  "n": 1,
  "day": 3,
  "front": "Longest substring with no repeated character. (|s| ≤ 5·10^4)",
  "pattern": "Variable window + last-seen index of each character",
  "target": "O(n)",
  "signal": "substring + longest + no repeats (rule 4)"
 },
 {
  "n": 2,
  "day": 4,
  "front": "For each index, the product of all the other elements, without using division. (n ≤ 10^5)",
  "pattern": "Prefix products × suffix products",
  "target": "O(n)",
  "signal": "\"all the others\" + no division"
 },
 {
  "n": 3,
  "day": 2,
  "front": "List every distinct triple that sums to zero. (n ≤ 3000)",
  "pattern": "Sort, fix one element, two pointers on the rest, skip duplicates",
  "target": "O(n^2)",
  "signal": "triple + n ≤ 3000 allows n^2"
 },
 {
  "n": 4,
  "day": 5,
  "front": "Is a string of ( ) [ ] { } correctly nested? (|s| ≤ 10^4)",
  "pattern": "Stack",
  "target": "O(n)",
  "signal": "brackets (rule 15)"
 },
 {
  "n": 5,
  "day": 2,
  "front": "Sorted array that contains negatives: return the squares in sorted order. (n ≤ 10^4)",
  "pattern": "Two pointers from both ends; fill the result from the back",
  "target": "O(n)",
  "signal": "sorted + negatives → largest squares sit at the ends"
 },
 {
  "n": 6,
  "day": 6,
  "front": "Find any index whose value is larger than both neighbours, in O(log n). (n ≤ 10^5)",
  "pattern": "Binary search on the slope: move toward the bigger neighbour",
  "target": "O(log n)",
  "signal": "\"O(log n)\" on an unsorted array"
 },
 {
  "n": 7,
  "day": 3,
  "front": "Does s2 contain a rearrangement of s1 as one contiguous piece? (lengths ≤ 10^4, lowercase)",
  "pattern": "Fixed-size window of length len(s1) with 26 counts",
  "target": "O(n)",
  "signal": "fixed length + \"rearrangement\""
 },
 {
  "n": 8,
  "day": 6,
  "front": "Cut an array into k contiguous parts so the largest part sum is as small as possible. (n ≤ 10^5, values ≤ 10^4)",
  "pattern": "Binary search on the answer + greedy cutting check",
  "target": "O(n log Σa)",
  "signal": "\"minimize the maximum\""
 },
 {
  "n": 9,
  "day": 3,
  "front": "Longest substring you can turn into one repeated letter by changing at most k characters. (|s| ≤ 10^5, uppercase)",
  "pattern": "Window, valid while length − (max letter count) ≤ k",
  "target": "O(n)",
  "signal": "\"change at most k\" = a budget inside a window"
 },
 {
  "n": 10,
  "day": 4,
  "front": "Count subarrays with sum exactly k; values can be negative. (n ≤ 2·10^4)",
  "pattern": "Prefix sum + map counting earlier prefix sums",
  "target": "O(n)",
  "signal": "\"exactly k\" + negatives (rule 5)"
 },
 {
  "n": 11,
  "day": 5,
  "front": "Sum of the minimum of every subarray, modulo 10^9+7. (n ≤ 3·10^4)",
  "pattern": "Monotonic stack: previous smaller and next smaller-or-equal; add a[i]·left·right",
  "target": "O(n)",
  "signal": "\"sum over all subarrays of the min\" → contribution via stack, not DP"
 },
 {
  "n": 12,
  "day": 6,
  "front": "Place c items at n given positions (≤ 10^9) so the smallest gap between any two is as large as possible. (n ≤ 10^5)",
  "pattern": "Sort + binary search on the gap, greedy placement check",
  "target": "O(n log n + n log range)",
  "signal": "\"maximize the minimum\""
 },
 {
  "n": 13,
  "day": 5,
  "front": "Maximum of every block of k consecutive elements. (n ≤ 10^5)",
  "pattern": "Monotonic deque",
  "target": "O(n)",
  "signal": "max of each fixed-size window (rule 8)"
 },
 {
  "n": 14,
  "day": 6,
  "front": "For each of q queries x, how many array elements are ≤ x? (n, q ≤ 2·10^5)",
  "pattern": "Sort once + bisect_right per query",
  "target": "O((n + q) log n)",
  "signal": "many count queries on static data"
 },
 {
  "n": 15,
  "day": 2,
  "front": "Merge two sorted arrays of length n and m into one sorted array. (n, m ≤ 10^5)",
  "pattern": "Two pointers, take the smaller head each step",
  "target": "O(n + m)",
  "signal": "two sorted inputs → one sorted output"
 },
 {
  "n": 16,
  "day": 5,
  "front": "For each day, how many days until a warmer one. (n ≤ 10^5)",
  "pattern": "Monotonic decreasing stack of indices",
  "target": "O(n)",
  "signal": "\"how many days until\" (rule 7)"
 },
 {
  "n": 17,
  "day": 3,
  "front": "Shortest subarray with sum ≥ S; every value is positive. (n ≤ 10^5)",
  "pattern": "Variable window; shrink while sum ≥ S",
  "target": "O(n)",
  "signal": "positive values + shortest + \"≥ S\""
 },
 {
  "n": 18,
  "day": 1,
  "front": "Return the positions of two numbers in an unsorted array that add up to a target; exactly one answer exists. (n ≤ 10^4)",
  "pattern": "Hash map value → index; look up target − x before inserting x",
  "target": "O(n)",
  "signal": "find a partner in unsorted data (Clue List rule 9)"
 },
 {
  "n": 19,
  "day": 5,
  "front": "Evaluate an expression written in reverse Polish (postfix) notation.",
  "pattern": "Stack of operands",
  "target": "O(n)",
  "signal": "operators come after their operands"
 },
 {
  "n": 20,
  "day": 4,
  "front": "Apply q operations \"add v to every element of [l, r]\", then print the final array. (n, q ≤ 2·10^5)",
  "pattern": "Difference array, one prefix pass at the end",
  "target": "O(n + q)",
  "signal": "range updates, read only once at the end"
 },
 {
  "n": 21,
  "day": 6,
  "front": "Smallest eating speed so all piles are finished within h hours. (n ≤ 10^4, piles ≤ 10^9)",
  "pattern": "Binary search on the answer; check Σ ceil(p / speed) ≤ h",
  "target": "O(n log max)",
  "signal": "\"minimum speed such that it works\" (rule 30)"
 },
 {
  "n": 22,
  "day": 4,
  "front": "Longest subarray with as many 0s as 1s. (n ≤ 10^5)",
  "pattern": "Turn 0 into −1; prefix sum + first index of each sum",
  "target": "O(n)",
  "signal": "\"equal counts of two things\" → ±1 prefix"
 },
 {
  "n": 23,
  "day": 3,
  "front": "Longest subarray with at most k distinct values. (n ≤ 10^5)",
  "pattern": "Window + count map; shrink while distinct > k",
  "target": "O(n)",
  "signal": "\"at most k distinct\""
 },
 {
  "n": 24,
  "day": 2,
  "front": "Pick two walls from an array of heights so the water held between them is largest. (n ≤ 10^5)",
  "pattern": "Two pointers from the ends; move the shorter wall",
  "target": "O(n)",
  "signal": "best pair + n = 10^5 rules out O(n^2)"
 },
 {
  "n": 25,
  "day": 1,
  "front": "Count pairs i < j with a[i] = a[j]. (n ≤ 2·10^5)",
  "pattern": "Frequency map; add the count seen so far as you scan",
  "target": "O(n)",
  "signal": "count equal pairs; n = 2·10^5 kills O(n^2)"
 },
 {
  "n": 26,
  "day": 6,
  "front": "k-th smallest number in an n × m multiplication table. (n, m ≤ 3·10^4)",
  "pattern": "Binary search on the value; count(≤ x) = Σ min(x // i, m)",
  "target": "O(n log(nm))",
  "signal": "k-th in a huge implicit sorted set"
 },
 {
  "n": 27,
  "day": 1,
  "front": "Count pairs i < j with a[j] − a[i] = j − i. (n ≤ 2·10^5)",
  "pattern": "Rewrite as a[j] − j = a[i] − i; count equal keys with a map",
  "target": "O(n)",
  "signal": "equation mixing i and j → move each index to its own side"
 },
 {
  "n": 28,
  "day": 4,
  "front": "The array never changes; answer q range-sum queries. (n, q ≤ 2·10^5)",
  "pattern": "Prefix sums",
  "target": "O(n + q)",
  "signal": "many queries, no updates"
 },
 {
  "n": 29,
  "day": 5,
  "front": "Area of the largest rectangle that fits under a bar chart. (n ≤ 10^5)",
  "pattern": "Monotonic increasing stack; each bar's span = previous and next smaller",
  "target": "O(n)",
  "signal": "widest span in which a bar is the minimum"
 },
 {
  "n": 30,
  "day": 2,
  "front": "Sorted array: find two numbers that add to a target using O(1) extra space. (n ≤ 3·10^4)",
  "pattern": "Two pointers from both ends",
  "target": "O(n)",
  "signal": "sorted + pair + O(1) space (rule 2)"
 },
 {
  "n": 31,
  "day": 1,
  "front": "Is there a pair of equal values whose indices differ by at most k? (n ≤ 10^5)",
  "pattern": "Hash map value → last index seen",
  "target": "O(n)",
  "signal": "equal values + index distance"
 },
 {
  "n": 32,
  "day": 2,
  "front": "Children have greed g[i], cookies have size s[j]; a child is happy with one cookie of size ≥ its greed. Maximize happy children. (n, m ≤ 3·10^4)",
  "pattern": "Sort both; two pointers, give each child the smallest cookie that fits",
  "target": "O(n log n)",
  "signal": "match two lists by size → sort both"
 },
 {
  "n": 33,
  "day": 6,
  "front": "Smallest integer x with x·x ≥ N. (N ≤ 10^18)",
  "pattern": "Integer binary search, or math.isqrt (never float sqrt)",
  "target": "O(log N)",
  "signal": "10^18 → logarithmic"
 },
 {
  "n": 34,
  "day": 4,
  "front": "q queries: the sum of a sub-rectangle of a fixed grid. (n, m ≤ 1000, q ≤ 10^5)",
  "pattern": "2-D prefix sums",
  "target": "O(nm + q)",
  "signal": "rectangle sums + many queries"
 },
 {
  "n": 35,
  "day": 5,
  "front": "Delete exactly k digits from a number string so the result is as small as possible. (|s| ≤ 10^5)",
  "pattern": "Greedy + monotonic increasing stack",
  "target": "O(n)",
  "signal": "\"smallest after deleting\" → pop bigger earlier digits"
 },
 {
  "n": 36,
  "day": 3,
  "front": "Shortest piece of s that contains every character of t, counting repeats. (|s|, |t| ≤ 10^5)",
  "pattern": "Variable window + \"still needed\" counter",
  "target": "O(n)",
  "signal": "shortest substring covering a multiset"
 },
 {
  "n": 37,
  "day": 1,
  "front": "Length of the longest run of consecutive integers (like 4, 5, 6, 7) that can be formed from an unsorted array, in O(n). (n ≤ 10^5)",
  "pattern": "Hash set; start counting only at x where x − 1 is absent",
  "target": "O(n)",
  "signal": "consecutive values + \"O(n)\" rules out sorting"
 },
 {
  "n": 38,
  "day": 6,
  "front": "Find a target in a sorted array of distinct values that was rotated at an unknown point, in O(log n).",
  "pattern": "Binary search; decide which half is sorted",
  "target": "O(log n)",
  "signal": "rotated sorted (rule 3)"
 },
 {
  "n": 39,
  "day": 1,
  "front": "Group words that use exactly the same letters the same number of times. (n ≤ 10^4 words, length ≤ 100)",
  "pattern": "Hash map keyed by the sorted word or a 26-count tuple",
  "target": "O(n·L log L)",
  "signal": "\"same letters\" → canonical key (rule 10)"
 },
 {
  "n": 40,
  "day": 3,
  "front": "Count subarrays with exactly k distinct values. (n ≤ 2·10^4)",
  "pattern": "atMost(k) − atMost(k − 1), each one a window",
  "target": "O(n)",
  "signal": "\"exactly k\" → difference of two \"at most\" counts"
 },
 {
  "n": 41,
  "day": 1,
  "front": "Smallest positive integer missing from an unsorted array. (n ≤ 10^5, values from −10^9 to 10^9)",
  "pattern": "Hash set, test 1..n+1 (O(1)-space version: put each value at its own index)",
  "target": "O(n)",
  "signal": "the answer is at most n + 1"
 },
 {
  "n": 42,
  "day": 4,
  "front": "Count subarrays whose sum is divisible by k; values can be negative. (n ≤ 3·10^4)",
  "pattern": "Prefix sum mod k + counts (Python % is already non-negative)",
  "target": "O(n)",
  "signal": "\"divisible by k\" + subarray"
 },
 {
  "n": 43,
  "day": 13,
  "front": "Tasks with dependencies: print the lexicographically smallest valid order, or IMPOSSIBLE. (n, m ≤ 10^5)",
  "pattern": "Kahn's algorithm with a min-heap instead of a queue",
  "target": "O((n + m) log n)",
  "signal": "topological + \"lexicographically smallest\""
 },
 {
  "n": 44,
  "day": 8,
  "front": "Remove the fewest intervals so the rest do not overlap. (n ≤ 10^5)",
  "pattern": "Sort by end; greedily keep the one that ends first",
  "target": "O(n log n)",
  "signal": "fewest removed = most kept → earliest end"
 },
 {
  "n": 45,
  "day": 11,
  "front": "Lowest common ancestor of two nodes in a binary search tree.",
  "pattern": "Walk down from the root comparing values",
  "target": "O(h)",
  "signal": "BST + ancestor → use the ordering"
 },
 {
  "n": 46,
  "day": 13,
  "front": "n courses and prerequisite pairs; can all of them be finished? (n ≤ 2000)",
  "pattern": "Kahn's topological sort; a cycle exists if not every node is popped",
  "target": "O(n + m)",
  "signal": "prerequisites (rule 24)"
 },
 {
  "n": 47,
  "day": 10,
  "front": "Does a word appear in a letter grid by walking between adjacent cells, never reusing a cell? (grid ≤ 6 × 6, word ≤ 15)",
  "pattern": "DFS backtracking with visited marks",
  "target": "O(cells · 3^L)",
  "signal": "tiny grid + a path of letters"
 },
 {
  "n": 48,
  "day": 13,
  "front": "A tree received one extra edge. Return the edge whose removal makes it a tree again.",
  "pattern": "Union-Find: the first edge joining two already-connected nodes",
  "target": "O(n α(n))",
  "signal": "redundant edge"
 },
 {
  "n": 49,
  "day": 9,
  "front": "k-th largest element. (n ≤ 10^5)",
  "pattern": "Min-heap of size k (or quickselect)",
  "target": "O(n log k)",
  "signal": "k-th largest (rule 11)"
 },
 {
  "n": 50,
  "day": 14,
  "front": "Connect n points with minimum total Manhattan wire length. (n ≤ 1000)",
  "pattern": "MST: Prim's O(n^2) on the dense graph",
  "target": "O(n^2)",
  "signal": "connect everything cheaply, every pair possible"
 },
 {
  "n": 51,
  "day": 12,
  "front": "Can the nodes be split into two sides so every edge crosses between them? (n ≤ 10^5)",
  "pattern": "BFS/DFS 2-colouring",
  "target": "O(n + m)",
  "signal": "two teams, conflicts on edges"
 },
 {
  "n": 52,
  "day": 8,
  "front": "Merge all overlapping intervals. (n ≤ 10^4)",
  "pattern": "Sort by start, sweep",
  "target": "O(n log n)",
  "signal": "intervals + overlap (rule 29)"
 },
 {
  "n": 53,
  "day": 11,
  "front": "Return a binary tree's values level by level.",
  "pattern": "BFS with a queue, one level per loop",
  "target": "O(n)",
  "signal": "levels (rule 19)"
 },
 {
  "n": 54,
  "day": 9,
  "front": "Merge k sorted linked lists with N ≤ 10^4 nodes in total.",
  "pattern": "Min-heap holding each list's head",
  "target": "O(N log k)",
  "signal": "merge k sorted (rule 12)"
 },
 {
  "n": 55,
  "day": 8,
  "front": "Stations on a circle have gas[i] and cost[i] to drive to the next; find the start that completes the loop. (n ≤ 10^5)",
  "pattern": "Greedy: total ≥ 0 means a start exists; restart after every point where the tank drops below 0",
  "target": "O(n)",
  "signal": "circular tour + one pass"
 },
 {
  "n": 56,
  "day": 12,
  "front": "For every cell of a 0/1 grid, the distance to the nearest 0. (n·m ≤ 10^5)",
  "pattern": "Multi-source BFS from all zeros",
  "target": "O(nm)",
  "signal": "nearest of many sources"
 },
 {
  "n": 57,
  "day": 14,
  "front": "Route across a height grid that minimizes the largest single step difference. (100 × 100)",
  "pattern": "Dijkstra where a path's cost is its max edge (or binary search on the answer + BFS)",
  "target": "O(nm log nm)",
  "signal": "\"minimize the maximum\" along a path"
 },
 {
  "n": 58,
  "day": 12,
  "front": "Fewest moves from S to E in a maze with walls. (1000 × 1000)",
  "pattern": "BFS",
  "target": "O(nm)",
  "signal": "every step costs the same (rule 22)"
 },
 {
  "n": 59,
  "day": 8,
  "front": "a[i] is the longest jump allowed from index i. Can you reach the last index? (n ≤ 10^4)",
  "pattern": "Greedy farthest reach",
  "target": "O(n)",
  "signal": "reachability with ranges, yes/no only"
 },
 {
  "n": 60,
  "day": 9,
  "front": "Numbers arrive one at a time; after each, print the median so far. (≤ 5·10^4 numbers)",
  "pattern": "Two heaps",
  "target": "O(log n) per number",
  "signal": "median of a stream (rule 13)"
 },
 {
  "n": 61,
  "day": 8,
  "front": "Cut a string into as many pieces as possible so each letter appears in only one piece. (|s| ≤ 500)",
  "pattern": "Last-occurrence greedy",
  "target": "O(n)",
  "signal": "a letter cannot cross a cut"
 },
 {
  "n": 62,
  "day": 9,
  "front": "Tasks arrive at time t[i] with duration d[i]; one CPU always takes the shortest waiting task. Print the order. (n ≤ 10^5)",
  "pattern": "Sort by arrival + min-heap simulation",
  "target": "O(n log n)",
  "signal": "simulation + \"always the smallest available\""
 },
 {
  "n": 63,
  "day": 12,
  "front": "Count groups of connected land cells in a grid. (300 × 300)",
  "pattern": "Flood fill with iterative BFS/DFS",
  "target": "O(nm)",
  "signal": "count regions (rule 21)"
 },
 {
  "n": 64,
  "day": 10,
  "front": "Count ways to place n queens on an n × n board so none attack each other. (n ≤ 9)",
  "pattern": "Backtracking with column and two diagonal sets",
  "target": "O(n!) with pruning",
  "signal": "n ≤ 9 + placement rules"
 },
 {
  "n": 65,
  "day": 12,
  "front": "Each grid cell has an arrow. Following it costs 0, changing it costs 1. Minimum cost from top-left to bottom-right. (100 × 100)",
  "pattern": "0-1 BFS with a deque",
  "target": "O(nm)",
  "signal": "edge costs are only 0 or 1"
 },
 {
  "n": 66,
  "day": 14,
  "front": "Shortest distance from city 1 to every city. (n ≤ 10^5, m ≤ 2·10^5, weights ≤ 10^9)",
  "pattern": "Dijkstra with heapq, skip stale entries",
  "target": "O((n + m) log n)",
  "signal": "weighted + large n"
 },
 {
  "n": 67,
  "day": 11,
  "front": "Is this binary tree a valid search tree?",
  "pattern": "DFS passing (low, high) bounds, or check in-order is strictly increasing",
  "target": "O(n)",
  "signal": "BST validity (rule 20)"
 },
 {
  "n": 68,
  "day": 12,
  "front": "Rot spreads every minute from each rotten cell to its neighbours. When is everything rotten? (grid ≤ 1000 × 1000)",
  "pattern": "Multi-source BFS",
  "target": "O(nm)",
  "signal": "spreads from many starts at once"
 },
 {
  "n": 69,
  "day": 14,
  "front": "Cheapest flight from src to dst using at most k stops. (n ≤ 100)",
  "pattern": "Bellman-Ford for k + 1 rounds (relax from a copy each round), or BFS over (city, stops)",
  "target": "O(k·m)",
  "signal": "\"at most k stops\" → hop-limited"
 },
 {
  "n": 70,
  "day": 8,
  "front": "One machine, jobs with durations. Choose the order that minimizes the sum of finish times. (n ≤ 2·10^5)",
  "pattern": "Sort by duration ascending (exchange argument)",
  "target": "O(n log n)",
  "signal": "\"order to minimize a sum\" → swap two neighbours and compare"
 },
 {
  "n": 71,
  "day": 9,
  "front": "Fewest rooms so that overlapping meetings never share a room. (n ≤ 10^4)",
  "pattern": "Sort by start; min-heap of end times",
  "target": "O(n log n)",
  "signal": "maximum overlap of intervals"
 },
 {
  "n": 72,
  "day": 11,
  "front": "k-th smallest value in a binary search tree.",
  "pattern": "In-order traversal, stop at k",
  "target": "O(h + k)",
  "signal": "BST + k-th (rule 20)"
 },
 {
  "n": 73,
  "day": 10,
  "front": "Print every ordering of n distinct values. (n ≤ 8)",
  "pattern": "Backtracking with a used array",
  "target": "O(n! · n)",
  "signal": "n ≤ 8 → n! fits"
 },
 {
  "n": 74,
  "day": 14,
  "front": "A signal starts at node k on directed edges with weights ≥ 0. When have all nodes received it? (n ≤ 100, m ≤ 6000)",
  "pattern": "Dijkstra; answer = largest distance",
  "target": "O(m log n)",
  "signal": "different edge weights (rule 23)"
 },
 {
  "n": 75,
  "day": 12,
  "front": "Change one letter at a time; every step must be a dictionary word. Fewest steps from start word to end word. (≤ 5000 words, length ≤ 10)",
  "pattern": "BFS on an implicit graph, wildcard buckets for neighbours",
  "target": "O(N·L^2)",
  "signal": "fewest steps + neighbours you generate"
 },
 {
  "n": 76,
  "day": 13,
  "front": "Constraints like x == y and x != z over 26 variables. Can all of them hold? (≤ 500 constraints)",
  "pattern": "Union-Find: unite every ==, then check every !=",
  "target": "O(n α)",
  "signal": "equality is transitive"
 },
 {
  "n": 77,
  "day": 14,
  "front": "How many different shortest routes from 1 to n, modulo 10^9+7? (n ≤ 10^5, m ≤ 2·10^5, weighted)",
  "pattern": "Dijkstra + ways[], add on equal distance, reset on a shorter one",
  "target": "O((n + m) log n)",
  "signal": "shortest + \"how many\" → count during Dijkstra"
 },
 {
  "n": 78,
  "day": 8,
  "front": "Fewest vertical lines so every interval on the x-axis is crossed by at least one. (n ≤ 10^5)",
  "pattern": "Sort by end; place a line at the end of the first interval not yet hit",
  "target": "O(n log n)",
  "signal": "points that stab intervals"
 },
 {
  "n": 79,
  "day": 9,
  "front": "Join sticks two at a time; a join costs the sum of the two lengths. Minimize the total cost. (n ≤ 10^4)",
  "pattern": "Min-heap; always join the two smallest",
  "target": "O(n log n)",
  "signal": "repeatedly combine the two smallest"
 },
 {
  "n": 80,
  "day": 11,
  "front": "Longest path, counted in edges, between any two nodes of a binary tree. (≤ 10^4 nodes)",
  "pattern": "DFS returns height; update best with left + right at each node",
  "target": "O(n)",
  "signal": "a path may bend at any node → combine two child heights"
 },
 {
  "n": 81,
  "day": 9,
  "front": "Projects need capital c[i] and pay profit p[i]. Start with W, do at most k projects, maximize final capital. (n ≤ 10^5)",
  "pattern": "Sort by capital; push affordable profits into a max-heap, pop the best",
  "target": "O((n + k) log n)",
  "signal": "unlock, then pick the best → sort + heap"
 },
 {
  "n": 82,
  "day": 11,
  "front": "Depth of a binary tree. (≤ 10^4 nodes)",
  "pattern": "DFS returning height (BFS by levels if it may be deep)",
  "target": "O(n)",
  "signal": "depth (rule 18)"
 },
 {
  "n": 83,
  "day": 13,
  "front": "Each account lists emails; merge any two accounts that share an email.",
  "pattern": "Union-Find over emails (or DFS)",
  "target": "O(N α(N))",
  "signal": "\"share any → same group\", transitive"
 },
 {
  "n": 84,
  "day": 10,
  "front": "List every combination of candidates (each reusable) that sums to a target. (≤ 30 candidates, target ≤ 40)",
  "pattern": "Backtracking over sorted candidates; stop when too big",
  "target": "exponential, tiny input",
  "signal": "\"list every combination\""
 },
 {
  "n": 85,
  "day": 13,
  "front": "Words are listed in sorted order of an unknown alphabet. Recover the letter order.",
  "pattern": "Edge from the first differing letters of each neighbouring pair + topological sort",
  "target": "O(total letters)",
  "signal": "hidden order from pairwise comparisons"
 },
 {
  "n": 86,
  "day": 10,
  "front": "Print every subset of n distinct numbers. (n ≤ 15)",
  "pattern": "Backtracking (or loop over bitmasks)",
  "target": "O(2^n · n)",
  "signal": "\"every\" + n ≤ 15 (rule 26)"
 },
 {
  "n": 87,
  "day": 8,
  "front": "a[i] is the longest jump allowed from index i. Fewest jumps to reach the last index? (n ≤ 10^4)",
  "pattern": "Greedy level by level (BFS over ranges)",
  "target": "O(n)",
  "signal": "fewest jumps with ranges"
 },
 {
  "n": 88,
  "day": 13,
  "front": "Roads are added one at a time; after each, print the number of connected regions. (n, m ≤ 10^5)",
  "pattern": "Union-Find",
  "target": "O(m α(n))",
  "signal": "edges arrive over time (rule 25)"
 },
 {
  "n": 89,
  "day": 17,
  "front": "Knapsack with n ≤ 100 and capacity ≤ 10^9, but every value is ≤ 1000.",
  "pattern": "Swap roles: dp[value] = minimum weight",
  "target": "O(n·Σv)",
  "signal": "capacity huge, values small → index the DP by value"
 },
 {
  "n": 90,
  "day": 20,
  "front": "Longest path in a directed graph with no cycles. (n, m ≤ 10^5)",
  "pattern": "Topological order + DP",
  "target": "O(n + m)",
  "signal": "DAG + longest → DP in topological order"
 },
 {
  "n": 91,
  "day": 15,
  "front": "Largest product of a contiguous subarray; values can be negative or zero. (n ≤ 2·10^4)",
  "pattern": "DP tracking both the max and the min product ending here",
  "target": "O(n)",
  "signal": "product + negatives → keep the min too"
 },
 {
  "n": 92,
  "day": 17,
  "front": "n items with weight and value, capacity W, each item at most once; maximize value. (n ≤ 100, W ≤ 10^5)",
  "pattern": "0/1 knapsack, dp[w], loop w downward",
  "target": "O(nW)",
  "signal": "take-or-leave + capacity"
 },
 {
  "n": 93,
  "day": 16,
  "front": "Length of the longest sequence of characters that appears in order in both strings. (each ≤ 1000)",
  "pattern": "LCS DP over (i, j)",
  "target": "O(nm)",
  "signal": "two strings + in order but not contiguous (rule 28)"
 },
 {
  "n": 94,
  "day": 19,
  "front": "Assign n workers to n jobs one-to-one from a cost matrix; minimize the total. (n ≤ 20)",
  "pattern": "Bitmask DP over used jobs (next worker = popcount)",
  "target": "O(2^n · n)",
  "signal": "n ≤ 20 + assignment"
 },
 {
  "n": 95,
  "day": 17,
  "front": "Fewest coins (unlimited supply of each type) to make an amount. (amount ≤ 10^4, ≤ 12 coin types)",
  "pattern": "Unbounded knapsack, min",
  "target": "O(A·k)",
  "signal": "\"fewest\" + unlimited supply"
 },
 {
  "n": 96,
  "day": 18,
  "front": "An envelope (w, h) fits inside another only if both sides are strictly smaller. Longest nesting chain. (n ≤ 10^5)",
  "pattern": "Sort w ascending, h descending; LIS on h",
  "target": "O(n log n)",
  "signal": "2-D chain → sort one coordinate, LIS the other"
 },
 {
  "n": 97,
  "day": 15,
  "front": "Count ways to read a digit string as letters, where 1–26 map to A–Z. (|s| ≤ 100)",
  "pattern": "1-D DP over prefixes, last piece is one or two digits",
  "target": "O(n)",
  "signal": "split a string into pieces + count"
 },
 {
  "n": 98,
  "day": 19,
  "front": "Count integers in [L, R] that never have two equal adjacent digits. (R ≤ 10^18)",
  "pattern": "Digit DP f(R) − f(L − 1), state (pos, last digit, tight, started)",
  "target": "O(19 · 10 · 10)",
  "signal": "range count + a rule on digits"
 },
 {
  "n": 99,
  "day": 16,
  "front": "Count right/down paths across a grid with blocked cells. (m, n ≤ 100)",
  "pattern": "Grid DP: dp[i][j] = up + left, 0 on blocks",
  "target": "O(mn)",
  "signal": "right/down only + count"
 },
 {
  "n": 100,
  "day": 17,
  "front": "Put + or − in front of every number so the total equals a target; count the ways. (n ≤ 20, Σ ≤ 1000)",
  "pattern": "Count subsets with sum (Σ + target) / 2",
  "target": "O(n·Σ)",
  "signal": "signs = two groups; sum is small (2^n also passes, DP is the standard)"
 },
 {
  "n": 101,
  "day": 20,
  "front": "Rob houses arranged as a binary tree; never take a parent and its child. (≤ 10^4 nodes)",
  "pattern": "Tree DP returning (take, skip) for each node",
  "target": "O(n)",
  "signal": "tree + \"not adjacent\""
 },
 {
  "n": 102,
  "day": 17,
  "front": "Can an array be split into two groups with equal sums? (n ≤ 200, values ≤ 100)",
  "pattern": "Subset-sum DP for Σ/2 (or a Python int used as a bitset)",
  "target": "O(n·Σ)",
  "signal": "equal split → reach half the total"
 },
 {
  "n": 103,
  "day": 15,
  "front": "Rob houses in a row, never two adjacent ones; maximize the loot. (n ≤ 10^5)",
  "pattern": "1-D DP: dp[i] = max(dp[i−1], dp[i−2] + a[i])",
  "target": "O(n)",
  "signal": "\"no two adjacent\" + maximize"
 },
 {
  "n": 104,
  "day": 18,
  "front": "Longest strictly increasing subsequence. (n ≤ 10^5)",
  "pattern": "Patience sorting with bisect_left",
  "target": "O(n log n)",
  "signal": "increasing subsequence + n = 10^5"
 },
 {
  "n": 105,
  "day": 19,
  "front": "Count integers in [1, N] whose digit sum is a multiple of d. (N ≤ 10^18, d ≤ 100)",
  "pattern": "Digit DP over (position, sum mod d, tight)",
  "target": "O(19 · d · 10)",
  "signal": "count in [1, N] + digit property + huge N"
 },
 {
  "n": 106,
  "day": 15,
  "front": "Can a string be cut into words from a dictionary? (|s| ≤ 300, ≤ 1000 words of length ≤ 20)",
  "pattern": "DP over prefixes: ok[i] if some word ends at i after an ok prefix",
  "target": "O(n·L)",
  "signal": "segment a string into valid pieces"
 },
 {
  "n": 107,
  "day": 18,
  "front": "Merge adjacent piles until one remains; each merge costs the new pile's size. Minimize the total. (n ≤ 400)",
  "pattern": "Interval DP over (l, r) with prefix sums",
  "target": "O(n^3)",
  "signal": "adjacent merges + n ≤ 400"
 },
 {
  "n": 108,
  "day": 15,
  "front": "A frog on stone i may jump to i+1 … i+k, paying the height difference. Minimum cost to the last stone. (n ≤ 10^5, k ≤ 100)",
  "pattern": "1-D DP over the k previous stones",
  "target": "O(nk)",
  "signal": "min cost + small fixed jump range"
 },
 {
  "n": 109,
  "day": 18,
  "front": "Burst balloons one by one; a burst earns left·mid·right of its current neighbours. Maximize the total. (n ≤ 300)",
  "pattern": "Interval DP over (l, r), choosing the last balloon burst inside",
  "target": "O(n^3)",
  "signal": "removals change neighbours + n ≤ 300"
 },
 {
  "n": 110,
  "day": 16,
  "front": "Largest square made only of 1s in a binary matrix. (300 × 300)",
  "pattern": "dp[i][j] = 1 + min(up, left, up-left)",
  "target": "O(nm)",
  "signal": "square + 0/1 grid"
 },
 {
  "n": 111,
  "day": 20,
  "front": "Daily stock prices; buy and sell as often as you like, but you must rest one day after selling. (n ≤ 5000)",
  "pattern": "State-machine DP (hold, just sold, rest)",
  "target": "O(n)",
  "signal": "modes with rules for moving between them"
 },
 {
  "n": 112,
  "day": 16,
  "front": "Minimum-sum right/down path through a grid of costs. (200 × 200)",
  "pattern": "Grid DP: cost + min(up, left)",
  "target": "O(mn)",
  "signal": "right/down only + min cost"
 },
 {
  "n": 113,
  "day": 18,
  "front": "Fewest cuts so every piece of a string is a palindrome. (|s| ≤ 2000)",
  "pattern": "Palindrome table + 1-D DP over cut positions",
  "target": "O(n^2)",
  "signal": "palindrome pieces + n ≤ 2000"
 },
 {
  "n": 114,
  "day": 17,
  "front": "Number of ways to make an amount from coin types, where order does not matter. (amount ≤ 5000, ≤ 300 types)",
  "pattern": "Unbounded knapsack counting, coins in the outer loop",
  "target": "O(A·k)",
  "signal": "count combinations, not orderings"
 },
 {
  "n": 115,
  "day": 19,
  "front": "Shortest round trip that visits every city exactly once. (n ≤ 16)",
  "pattern": "Bitmask DP dp[mask][last]",
  "target": "O(2^n · n^2)",
  "signal": "visit all + n ≤ 16"
 },
 {
  "n": 116,
  "day": 15,
  "front": "Ways to climb n stairs taking 1 or 2 steps at a time. (n ≤ 45)",
  "pattern": "1-D DP: dp[i] = dp[i−1] + dp[i−2]",
  "target": "O(n)",
  "signal": "number of ways + small step choices"
 },
 {
  "n": 117,
  "day": 16,
  "front": "Fewest insert/delete/replace operations to turn one word into another. (each ≤ 500)",
  "pattern": "Edit distance DP over (i, j)",
  "target": "O(nm)",
  "signal": "two strings + three edit operations"
 },
 {
  "n": 118,
  "day": 20,
  "front": "For every node of a tree, the sum of distances to all other nodes. (n ≤ 2·10^5)",
  "pattern": "Rerooting DP: subtree sizes down, shift the answer up",
  "target": "O(n)",
  "signal": "\"for every node\" on a tree"
 },
 {
  "n": 119,
  "day": 24,
  "front": "For every i from 0 to n, the number of 1 bits in i. (n ≤ 10^5)",
  "pattern": "dp[i] = dp[i >> 1] + (i & 1)",
  "target": "O(n)",
  "signal": "bit counts for a whole range"
 },
 {
  "n": 120,
  "day": 25,
  "front": "Point updates mixed with range-minimum queries. (n, q ≤ 2·10^5)",
  "pattern": "Segment tree",
  "target": "O(log n) each",
  "signal": "min cannot be undone by subtraction → not a Fenwick"
 },
 {
  "n": 121,
  "day": 23,
  "front": "Sum of |a[i] − a[j]| over all pairs. (n ≤ 2·10^5)",
  "pattern": "Sort; a[i] contributes a[i]·i − (sum of the i before it)",
  "target": "O(n log n)",
  "signal": "sum over all pairs → contribution"
 },
 {
  "n": 122,
  "day": 22,
  "front": "a^b mod 10^9+7. (b ≤ 10^18)",
  "pattern": "Fast power: pow(a, b, MOD)",
  "target": "O(log b)",
  "signal": "huge exponent"
 },
 {
  "n": 123,
  "day": 23,
  "front": "Sum of the sums of all subarrays, mod 10^9+7. (n ≤ 2·10^5)",
  "pattern": "Contribution: a[i]·(i + 1)·(n − i)",
  "target": "O(n)",
  "signal": "sum over all subarrays → contribution"
 },
 {
  "n": 124,
  "day": 26,
  "front": "Is s a shorter block repeated several times? (|s| ≤ 10^6)",
  "pattern": "Prefix function: p = n − π[n−1]; yes if p < n and n % p == 0",
  "target": "O(n)",
  "signal": "period / repetition"
 },
 {
  "n": 125,
  "day": 27,
  "front": "Print a permutation of 1..n in which neighbours never differ by exactly 1, or say it is impossible. (n ≤ 10^6)",
  "pattern": "Construct: all evens, then all odds; n = 2 and 3 are impossible",
  "target": "O(n)",
  "signal": "\"print any\" + small cases show the pattern"
 },
 {
  "n": 126,
  "day": 26,
  "front": "Shortest string to add in front of s to make it a palindrome. (|s| ≤ 5·10^4)",
  "pattern": "Prefix function of s + '#' + reverse(s) → longest palindromic prefix",
  "target": "O(n)",
  "signal": "palindrome + prefix"
 },
 {
  "n": 127,
  "day": 24,
  "front": "An array holds n distinct values from 0..n. Find the missing one in O(1) extra space.",
  "pattern": "XOR of all indices and values (or the sum formula)",
  "target": "O(n)",
  "signal": "one missing from a known range"
 },
 {
  "n": 128,
  "day": 27,
  "front": "Fewest swaps (of any two positions) to sort a permutation of 1..n. (n ≤ 10^5)",
  "pattern": "Count cycles of i → p[i]; answer = n − cycles",
  "target": "O(n)",
  "signal": "permutation + swaps → cycles"
 },
 {
  "n": 129,
  "day": 25,
  "front": "Count pairs i < j with a[i] > a[j]. (n ≤ 2·10^5, values ≤ 10^9)",
  "pattern": "Coordinate compression + Fenwick (or merge sort)",
  "target": "O(n log n)",
  "signal": "inversions + huge values"
 },
 {
  "n": 130,
  "day": 22,
  "front": "Print x / y modulo the prime 998244353.",
  "pattern": "Modular inverse: pow(y, MOD − 2, MOD)",
  "target": "O(log MOD)",
  "signal": "division under a prime modulus"
 },
 {
  "n": 131,
  "day": 25,
  "front": "Operations: insert x, delete x, or ask for the k-th smallest current value (any k). (q ≤ 10^5, values ≤ 10^9)",
  "pattern": "SortedList (or offline compression + Fenwick)",
  "target": "O(log n) each, roughly",
  "signal": "dynamic set + order statistics"
 },
 {
  "n": 132,
  "day": 23,
  "front": "Largest gcd of any pair in the array. (n ≤ 10^6, values ≤ 10^6)",
  "pattern": "For g from max down: count values that are multiples of g; first g with ≥ 2 wins",
  "target": "O(V log V)",
  "signal": "gcd + values ≤ 10^6 → loop over multiples"
 },
 {
  "n": 133,
  "day": 25,
  "front": "For each element, how many smaller elements are to its right? (n ≤ 10^5, values in [−10^4, 10^4])",
  "pattern": "Fenwick scanning right to left, values shifted by an offset",
  "target": "O(n log V)",
  "signal": "\"count smaller after me\""
 },
 {
  "n": 134,
  "day": 26,
  "front": "All positions where pattern p occurs in text t. (|t|, |p| ≤ 10^6)",
  "pattern": "Prefix function (KMP) on p + '#' + t, or Z-function",
  "target": "O(n + m)",
  "signal": "find all occurrences, long strings"
 },
 {
  "n": 135,
  "day": 24,
  "front": "Sum of (a[i] XOR a[j]) over all pairs i < j. (n ≤ 3·10^5, values < 2^30)",
  "pattern": "Per bit b: ones · zeros · 2^b",
  "target": "O(30n)",
  "signal": "sum over pairs of a bitwise operation"
 },
 {
  "n": 136,
  "day": 26,
  "front": "Longest substring that occurs at least twice. (|s| ≤ 3·10^4)",
  "pattern": "Binary search on the length + rolling-hash set",
  "target": "O(n log n)",
  "signal": "longest repeated; if L works, L − 1 works"
 },
 {
  "n": 137,
  "day": 23,
  "front": "Factorize each of q numbers. (q ≤ 10^5, each ≤ 10^6)",
  "pattern": "Smallest-prime-factor sieve, then divide down",
  "target": "O(V + q log V)",
  "signal": "many factorizations, small values"
 },
 {
  "n": 138,
  "day": 22,
  "front": "Count right/down paths across an empty h × w grid, mod 10^9+7. (h, w ≤ 10^5)",
  "pattern": "C(h + w − 2, h − 1)",
  "target": "O(h + w)",
  "signal": "grid too big for DP + no obstacles → formula"
 },
 {
  "n": 139,
  "day": 24,
  "front": "Count subarrays whose XOR equals k. (n ≤ 2·10^5)",
  "pattern": "Prefix XOR + map of counts",
  "target": "O(n)",
  "signal": "subarray + XOR (same shape as rule 5)"
 },
 {
  "n": 140,
  "day": 25,
  "front": "Point updates mixed with range-sum queries. (n, q ≤ 2·10^5)",
  "pattern": "Fenwick tree",
  "target": "O(log n) each",
  "signal": "queries + updates (sums)"
 },
 {
  "n": 141,
  "day": 24,
  "front": "Largest XOR of any two elements. (n ≤ 2·10^5, values < 2^30)",
  "pattern": "Binary trie, greedy from the top bit",
  "target": "O(30n)",
  "signal": "maximize XOR of a pair"
 },
 {
  "n": 142,
  "day": 23,
  "front": "Count the primes below n. (n ≤ 5·10^6)",
  "pattern": "Sieve of Eratosthenes on a bytearray",
  "target": "O(n log log n)",
  "signal": "primes up to a bound"
 },
 {
  "n": 143,
  "day": 24,
  "front": "Every value appears twice except one. Find it with O(1) extra space.",
  "pattern": "XOR everything",
  "target": "O(n)",
  "signal": "pairs cancel"
 },
 {
  "n": 144,
  "day": 26,
  "front": "q queries: is s[l1..r1] equal to s[l2..r2]? (|s|, q ≤ 10^5)",
  "pattern": "Prefix rolling hash, O(1) per comparison",
  "target": "O(n + q)",
  "signal": "many substring comparisons"
 },
 {
  "n": 145,
  "day": 27,
  "front": "Operation: add 2 to any one element, as often as you like. Can all elements become equal? (n ≤ 2·10^5)",
  "pattern": "Invariant: parity never changes → YES iff all have the same parity",
  "target": "O(n)",
  "signal": "\"any number of operations\" + YES/NO → invariant"
 },
 {
  "n": 146,
  "day": 23,
  "front": "List all divisors of x. (x ≤ 10^12)",
  "pattern": "Trial division up to √x",
  "target": "O(√x)",
  "signal": "one big number → √x = 10^6"
 },
 {
  "n": 147,
  "day": 25,
  "front": "Operations: add v to a[l..r], or print a[i]. Interleaved. (n, q ≤ 2·10^5)",
  "pattern": "Fenwick on the difference array (range update, point query)",
  "target": "O(log n) each",
  "signal": "range add + point read, interleaved"
 },
 {
  "n": 148,
  "day": 22,
  "front": "q queries of C(n, k) mod 10^9+7. (n ≤ 10^6, q ≤ 10^5)",
  "pattern": "Precompute factorials + inverse factorials",
  "target": "O(N + q)",
  "signal": "many nCr queries"
 },
 {
  "n": 149,
  "day": 27,
  "front": "Build a string of length n from {a, b} with no length-3 palindrome inside. (n ≤ 2·10^5)",
  "pattern": "Repeat \"aabb\"",
  "target": "O(n)",
  "signal": "\"any string\" + a local rule → periodic pattern"
 },
 {
  "n": 150,
  "day": 22,
  "front": "Count length-n strings over k letters with no two equal neighbours, mod 10^9+7. (n ≤ 10^18)",
  "pattern": "Formula k·(k − 1)^(n − 1) with fast power",
  "target": "O(log n)",
  "signal": "n too large for any DP → closed form"
 }
];
