/** Python templates for the tree-walk lab. diameter, levels and height_iter are copied from Day 11;
 *  the others follow the same style and the rules stated in Day 11 (in-order on a BST, pass bounds down). */

export const DIAMETER = [
  "# Recursive: DFS returns a value + global best (diameter)",
  "def diameter(root):",
  "    best = 0",
  "    def height(node):",
  "        nonlocal best",
  "        if not node:",
  "            return 0",
  "        l, r = height(node.left), height(node.right)",
  "        best = max(best, l + r)        # path through this node (edges)",
  "        return 1 + max(l, r)           # parent can extend only one side",
  "    height(root)",
  "    return best",
];

export const SUBSUM = [
  "# DFS returns a value: the sum of each subtree",
  "def tree_sum(root):",
  "    def total(node):",
  "        if not node:",
  "            return 0",
  "        l, r = total(node.left), total(node.right)",
  "        return node.val + l + r        # my value + both children",
  "    return total(root)",
];

export const LEVELS = [
  "from collections import deque",
  "",
  "# BFS by levels",
  "def levels(root):",
  "    out, q = [], deque([root] if root else [])",
  "    while q:",
  "        row = []",
  "        for _ in range(len(q)):        # exactly this level",
  "            node = q.popleft()",
  "            row.append(node.val)",
  "            if node.left:  q.append(node.left)",
  "            if node.right: q.append(node.right)",
  "        out.append(row)",
  "    return out",
];

export const POST_ITER = [
  "# Iterative post-order, binary tree: (node, done) flag. Height of every node.",
  "def height_iter(root):",
  "    h = {None: 0}",
  "    stack = [(root, False)] if root else []",
  "    while stack:",
  "        node, done = stack.pop()",
  "        if done:                       # children already computed",
  "            h[node] = 1 + max(h[node.left], h[node.right])",
  "        else:",
  "            stack.append((node, True)) # come back after children",
  "            if node.left:  stack.append((node.left, False))",
  "            if node.right: stack.append((node.right, False))",
  "    return h.get(root, 0)",
];

export const PRE_ITER = [
  "# Iterative preorder: node, then left, then right",
  "def preorder(root):",
  "    out, stack = [], [root] if root else []",
  "    while stack:",
  "        node = stack.pop()",
  "        out.append(node.val)",
  "        if node.right: stack.append(node.right)   # right first,",
  "        if node.left:  stack.append(node.left)    # so left pops first",
  "    return out",
];

export const IN_ITER = [
  "# Iterative inorder: left, node, right (sorted order on a BST)",
  "def inorder(root):",
  "    out, stack, node = [], [], root",
  "    while stack or node:",
  "        while node:                    # go left as far as possible",
  "            stack.append(node)",
  "            node = node.left",
  "        node = stack.pop()",
  "        out.append(node.val)",
  "        node = node.right              # then the right subtree",
  "    return out",
];

export const BST_SEARCH = [
  "# BST search: one comparison picks a side",
  "def search(node, x):",
  "    while node:",
  "        if x == node.val:",
  "            return node",
  "        node = node.left if x < node.val else node.right",
  "    return None",
];

export const BST_INSERT = [
  "# BST insert: walk down, attach at the empty spot",
  "def insert(root, x):",
  "    if not root:",
  "        return TreeNode(x)",
  "    node = root",
  "    while True:",
  "        if x < node.val:",
  "            if not node.left:",
  "                node.left = TreeNode(x); break",
  "            node = node.left",
  "        else:",
  "            if not node.right:",
  "                node.right = TreeNode(x); break",
  "            node = node.right",
  "    return root",
];

export const BST_VALID = [
  "# Validate a BST: pass (low, high) bounds down",
  "def is_bst(node, low=float(\"-inf\"), high=float(\"inf\")):",
  "    if not node:",
  "        return True",
  "    if not (low < node.val < high):",
  "        return False",
  "    return (is_bst(node.left, low, node.val) and",
  "            is_bst(node.right, node.val, high))",
];
