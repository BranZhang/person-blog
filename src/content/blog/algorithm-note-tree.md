---
title: "算法笔记——树"
description: "感觉树相关的算法问题离不开树的构建和搜索，不同类型的树有不同的搜索姿势，遍历也算是一种搜索吧，从头到尾，无目的的那种。"
pubDate: "2019-01-02T14:54:00.000Z"
updatedDate: "2023-01-03T09:54:03.000Z"
published: true
disableComments: true
disableLikes: true
tags: ["算法"]
---
<h2 class="wp-block-heading">简介</h2>

<p class="wp-block-paragraph">感觉树相关的算法问题离不开树的构建和搜索，不同类型的树有不同的搜索姿势，遍历也算是一种搜索吧，从头到尾，无目的的那种。</p>

<p class="wp-block-paragraph">构建是为了组织好数据，方便搜索。涉及到的问题一般是添，删，改，查。</p>

<p class="wp-block-paragraph">搜索则像是在解决实际的问题，既有通用的搜索方式，特殊形态的树也存在着特有的搜索方式。</p>

<!--more-->

<hr class="wp-block-separator has-css-opacity"/>

<h2 class="wp-block-heading">常见应用场景</h2>

<ul class="wp-block-list">
<li>xml文本内容的表达</li>

<li>路由器中的路由搜索引擎</li>

<li>数据库索引</li>

<li>文件系统的目录结构</li>

<li>决策树</li>
</ul>

<hr class="wp-block-separator has-css-opacity"/>

<h2 class="wp-block-heading">不同类型的树</h2>

<h3 class="wp-block-heading">二叉搜索树</h3>

<p class="wp-block-paragraph">二叉搜索树是一种节点值之间具有一定数量级次序的二叉树，对于树中每个节点：</p>

<ul class="wp-block-list">
<li>若其左子树存在，则其左子树中每个节点的值都不大于该节点值；</li>

<li>若其右子树存在，则其右子树中每个节点的值都不小于该节点值。</li>
</ul>

<div class="wp-block-image">
<figure class="aligncenter size-large is-resized"><img loading="lazy" decoding="async" src="/wp-content/uploads/2020/01/bst.jpg" alt="" class="wp-image-10524" width="311" height="351" srcset="/wp-content/uploads/2020/01/bst.jpg 311w, /wp-content/uploads/2020/01/bst-266x300.jpg 266w" sizes="auto, (max-width: 311px) 100vw, 311px" /><figcaption class="wp-element-caption">BST 示例</figcaption></figure>
</div>

<ul class="wp-block-list">
<li><strong>二叉搜索树中的插入操作：</strong>Given the root node of a binary search tree (BST) and a value to be inserted into the tree, insert the value into the BST. Return the root node of the BST after the insertion. It is guaranteed that the new value does not exist in the original BST. <a href="https://leetcode.com/problems/insert-into-a-binary-search-tree/" target="_blank" rel="noopener">链接</a></li>

<li><strong>二叉搜索树的范围和：</strong>Given the root node of a binary search tree, return the sum of values of all nodes with value between L and R (inclusive). <a href="https://leetcode.com/problems/range-sum-of-bst/" class="rank-math-link" target="_blank" rel="noopener">链接</a></li>

<li><strong>二叉搜索树中第K小的元素：</strong>Given a binary search tree, write a function kthSmallest to find the kth smallest element in it. <a href="https://leetcode.com/problems/kth-smallest-element-in-a-bst/" class="rank-math-link" target="_blank" rel="noopener">链接</a></li>
</ul>

<p class="wp-block-paragraph">上面3题中，第一题是BST的插入问题，后两题是BST的搜索问题。</p>

<p class="wp-block-paragraph">插入的算法可以用递归来完成，这里的插入还算简单，不需要对树的其他节点做调整，参考代码：</p>

<pre class="EnlighterJSRAW" data-enlighter-language="python" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">def insertIntoBST(self, root, val):
    if root.val > val:
        if not root.left:
            root.left = TreeNode(val)
        else:
            self.insertIntoBST(root.left, val)
    else:
        if not root.right:
            root.right = TreeNode(val)
        else:
            self.insertIntoBST(root.right, val)
    return root</pre>

<p class="wp-block-paragraph">二叉搜索树的范围和，也就是需要找出所有在二叉树中指定区间范围内的值。可以使用深度遍历或者广度遍历。下面的是广度遍历的参考代码：</p>

<pre class="EnlighterJSRAW" data-enlighter-language="generic" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">def rangeSumBST(self, root, L, R):
    ans = 0
    stack = [root]
    while stack:
        node = stack.pop()
        if node:
            if L &lt;= node.val &lt;= R:
                ans += node.val
            if L &lt; node.val:
                stack.append(node.left)
            if node.val &lt; R:
                stack.append(node.right)
    return ans</pre>

<p class="wp-block-paragraph">对于寻找二叉搜索树中第K小的元素，需要用到中序遍历，将在下面提到。</p>

<h3 class="wp-block-heading">红黑树</h3>

<p class="wp-block-paragraph">红黑树本质上是一棵二叉搜索树，但它在二叉搜索树的基础上增加了着色和相关的性质使得红黑树相对平衡，从而保证了红黑树的查找、插入、删除的时间复杂度最坏为  <img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-3e714e1ffb0b6741764c419ad5162f72_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#79;&#40;&#108;&#111;&#103;&#110;&#41;" title="Rendered by QuickLaTeX.com" height="18" width="64" style="vertical-align: -4px;"/> 。</p>

<p class="wp-block-paragraph">红黑树的特性：</p>

<ul class="wp-block-list">
<li>每个节点或者是黑色，或者是红色。</li>

<li>根节点是黑色。</li>

<li>每个叶子节点（NIL）是黑色。 【 注意：这里叶子节点，是指为空(NIL或NULL)的叶子节点！ 】</li>

<li>如果一个节点是红色的，则它的子节点必须是黑色的。</li>

<li>从一个节点到该节点的子孙节点的所有路径上包含相同数目的黑节点。</li>
</ul>

<div class="wp-block-image">
<figure class="aligncenter size-large"><img loading="lazy" decoding="async" width="450" height="217" src="/wp-content/uploads/2020/01/Red_black_tree_example.png" alt="" class="wp-image-10525" srcset="/wp-content/uploads/2020/01/Red_black_tree_example.png 450w, /wp-content/uploads/2020/01/Red_black_tree_example-300x145.png 300w" sizes="auto, (max-width: 450px) 100vw, 450px" /><figcaption class="wp-element-caption">红黑树的图例</figcaption></figure>
</div>

<p class="wp-block-paragraph">红黑树的左右旋是比较重要的操作，左右旋的目的是调整红黑节点结构，转移黑色节点位置，使其在进行插入、删除后仍能保持红黑树的 5 条性质。</p>

<div class="wp-block-image">
<figure class="aligncenter size-large"><img loading="lazy" decoding="async" width="482" height="141" src="/wp-content/uploads/2020/01/Red_black_tree_opt.png" alt="" class="wp-image-10526" srcset="/wp-content/uploads/2020/01/Red_black_tree_opt.png 482w, /wp-content/uploads/2020/01/Red_black_tree_opt-300x88.png 300w" sizes="auto, (max-width: 482px) 100vw, 482px" /><figcaption class="wp-element-caption">红黑树的左右旋</figcaption></figure>
</div>

<p class="wp-block-paragraph">红黑树的增删操作比较复杂，在此就不多说了。看下面这个问题。</p>

<p class="wp-block-paragraph"><strong>区间和的个数：</strong>Given an integer array nums, return the number of range sums that lie in [lower, upper] inclusive. Range sum S(i, j) is defined as the sum of the elements in nums between indices i and j (i ≤ j), inclusive. <a class="rank-math-link rank-math-link rank-math-link rank-math-link" href="https://leetcode.com/problems/count-of-range-sum/" target="_blank" rel="noopener">链接</a></p>

<p class="wp-block-paragraph">在考虑这条题目之前，先来看看“<a href="https://leetcode.com/problems/count-of-smaller-numbers-after-self/" class="rank-math-link" target="_blank" rel="noopener">计算右侧小于当前元素的个数</a>”这个题目。给定一个数组，统计每个数的右侧，有多少个小于当前数值的元素。接解题的思路是，从右往左遍历，在遍历的同时，构建一颗二叉搜索树。每当需要在二叉搜索树中插入元素时，就可以顺便统计一下有多少节点小于当前值，也就是在数组中当前元素的右侧有多少个数小于当前值。</p>

<p class="wp-block-paragraph">回到这条题目：在给定数组中，求区间和满足指定范围的的区间的个数。可以简单的双重循环一遍，但是这样效率很差。结合“”题目来看，事先计算好数组的求和结果可以提高一些效率，定义新的数组 T，令 <img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-0b6ab4b39338891c25a3e8a1c630d700_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#84;&#105;&#32;&#61;" title="Rendered by QuickLaTeX.com" height="12" width="39" style="vertical-align: 0px;"/>。题目中想要求的区间实际上就是，区间 <img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-a30a5ea3272c65a2e833d052a5b474aa_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#40;&#105;&#44;&#106;&#41;" title="Rendered by QuickLaTeX.com" height="18" width="36" style="vertical-align: -4px;"/> 的和等于  。</p>

<p class="wp-block-paragraph">问题就转换为了：对于每一个位置，在它的右侧有多少个元素满足“与当前位置的差在指定的区间范围内”。所以，解法参照上面的题目，从右往左遍历，一边遍历一边构造二叉树，从而解决题目中的问题。考虑到输入的数组的大小，红黑树可能比二叉搜索树更加合适。</p>

<h3 class="wp-block-heading">霍夫曼树</h3>

<p class="wp-block-paragraph">霍夫曼树又称最优二叉树，是一种带权路径长度最短的二叉树。 霍夫曼 编码是哈夫曼树的一个应用，霍夫曼编码使用变长编码表对源符号（如文件中的一个字母）进行编码，其中变长编码表是通过一种评估来源符号出现几率的方法得到的，出现几率高的字母使用较短的编码，反之出现几率低的则使用较长的编码，这便使编码之后的字符串的平均长度、期望值降低，从而达到无损压缩数据的目的。</p>

<p class="wp-block-paragraph">霍夫曼树的构建过程可参考此<a href="https://zh.wikipedia.org/wiki/%E9%9C%8D%E5%A4%AB%E6%9B%BC%E7%BC%96%E7%A0%81" class="rank-math-link" target="_blank" rel="noopener">文章</a>。LeetCode上关于霍夫曼树的问题不多，下面是我找到的其中一条：</p>

<p class="wp-block-paragraph"><strong>建造街区的最短时间：</strong>You are given a list of blocks, where blocks[i] = t means that the i-th block needs t units of time to be built. A block can only be built by exactly one worker. A worker can either split into two workers (number of workers increases by one) or build a block then go home. Both decisions cost some time. The time cost of spliting one worker into two workers is given as an integer split. Note that if two workers split at the same time, they split in parallel so the cost would be split.  Output the minimum time needed to build all blocks. <a href="https://leetcode.com/problems/minimum-time-to-build-blocks" class="rank-math-link" target="_blank" rel="noopener">链接</a></p>

<p class="wp-block-paragraph">这个问题和霍夫曼树有什么关联呢？如果一个街区需要更多的时间来建造，也就对应着出现几率高的字母，得到的编码就越短，在工期的安排上就越优先。在建造工期长的街区的同时，另一个工人可以把时间花在招工，并完成工期短的街区。具体的构建过程，以输入参数 blocks [1, 2, 4, 7, 10]，split cost 3 为例：</p>

<p class="wp-block-paragraph">对街区工期进行排序，先分析前两个：</p>

<div class="wp-block-image">
<figure class="aligncenter size-medium"><img loading="lazy" decoding="async" width="300" height="143" src="/wp-content/uploads/2020/01/Huffman_0-1-e1578382812597-300x143.png" alt="" class="wp-image-10527" srcset="/wp-content/uploads/2020/01/Huffman_0-1-e1578382812597-300x143.png 300w, /wp-content/uploads/2020/01/Huffman_0-1-e1578382812597-768x365.png 768w, /wp-content/uploads/2020/01/Huffman_0-1-e1578382812597.png 960w" sizes="auto, (max-width: 300px) 100vw, 300px" /></figure>
</div>

<p class="wp-block-paragraph">对于前两个街区，需要花费的时间是，先花3天时间招个工，2个工人分别建造街区，时间花费max(1,2)天，共计split+max(1,2)，也就是5天。其余的依此类推。</p>

<figure class="wp-block-gallery aligncenter has-nested-images columns-default is-cropped wp-block-gallery-15 is-layout-flex wp-block-gallery-is-layout-flex">
<figure class="wp-block-image size-large"><img loading="lazy" decoding="async" width="960" height="720" data-id="10517" src="/wp-content/uploads/2020/01/Huffman_1.png" alt="" class="wp-image-10517" srcset="/wp-content/uploads/2020/01/Huffman_1.png 960w, /wp-content/uploads/2020/01/Huffman_1-300x225.png 300w, /wp-content/uploads/2020/01/Huffman_1-768x576.png 768w" sizes="auto, (max-width: 960px) 100vw, 960px" /></figure>

<figure class="wp-block-image size-large"><img loading="lazy" decoding="async" width="960" height="720" data-id="10518" src="/wp-content/uploads/2020/01/Huffman_2.png" alt="" class="wp-image-10518" srcset="/wp-content/uploads/2020/01/Huffman_2.png 960w, /wp-content/uploads/2020/01/Huffman_2-300x225.png 300w, /wp-content/uploads/2020/01/Huffman_2-768x576.png 768w" sizes="auto, (max-width: 960px) 100vw, 960px" /></figure>

<figure class="wp-block-image size-large"><img loading="lazy" decoding="async" width="960" height="720" data-id="10519" src="/wp-content/uploads/2020/01/Huffman_3.png" alt="" class="wp-image-10519" srcset="/wp-content/uploads/2020/01/Huffman_3.png 960w, /wp-content/uploads/2020/01/Huffman_3-300x225.png 300w, /wp-content/uploads/2020/01/Huffman_3-768x576.png 768w" sizes="auto, (max-width: 960px) 100vw, 960px" /></figure>
</figure>

<p class="wp-block-paragraph">最终，一个霍夫曼树就算构建完成了，生成的过程是自底向上的，实际的执行过程是自顶向下的，也就是：第一个工人先花3天招一个新工人，让他去建造需要花10天的街区；同时，第一个工人再花3天招一个新工人，让他去建造需要花7天的街区；依此类推。直到最后一个需要花1天的街区，就自己上了。</p>

<div class="wp-block-image">
<figure class="aligncenter size-medium"><img loading="lazy" decoding="async" width="300" height="225" src="/wp-content/uploads/2020/01/Huffman_4-300x225.png" alt="" class="wp-image-10520" srcset="/wp-content/uploads/2020/01/Huffman_4-300x225.png 300w, /wp-content/uploads/2020/01/Huffman_4-768x576.png 768w, /wp-content/uploads/2020/01/Huffman_4.png 960w" sizes="auto, (max-width: 300px) 100vw, 300px" /></figure>
</div>

<p class="wp-block-paragraph">剩下的就代码实现了，参考代码：</p>

<pre class="EnlighterJSRAW" data-enlighter-language="generic" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">def minBuildTime(self, blocks, split):
    heapq.heapify(blocks)
    while True:
        if len(blocks) == 1:
            return blocks[0]
        a, b = heapq.heappop(blocks), heapq.heappop(blocks)
        # as b is great or eqaul to a, so no need to max(a,b) + split
        heapq.heappush(blocks, b+split) </pre>

<hr class="wp-block-separator has-css-opacity"/>

<h2 class="wp-block-heading">树的搜索及遍历</h2>

<h3 class="wp-block-heading">广度优先遍历和深度优先遍历</h3>

<h4 class="wp-block-heading">广度优先遍历</h4>

<p class="wp-block-paragraph">从根节点开始，沿着树的宽度遍历树的节点。如果所有节点均被访问，则算法中止。</p>

<p class="wp-block-paragraph">当问题的解对应着一颗树的层数，或者需要在同层的节点中寻找答案的时候，广度优先遍历可能是一个不错的选择。</p>

<ul class="wp-block-list">
<li><strong>二叉树的锯齿形层次遍历：</strong>Given a binary tree, return the zigzag level order traversal of its nodes&#8217; values. (ie, from left to right, then right to left for the next level and alternate between). <a href="https://leetcode.com/problems/binary-tree-zigzag-level-order-traversal/" class="rank-math-link" target="_blank" rel="noopener">链接</a></li>

<li><strong>对称树：</strong>Given a binary tree, check whether it is a mirror of itself (ie, symmetric around its center). <a href="https://leetcode.com/problems/symmetric-tree/" class="rank-math-link" target="_blank" rel="noopener">链接</a></li>

<li><strong>二叉树的最小深度：</strong>Given a binary tree, find its minimum depth. <a href="https://leetcode.com/problems/minimum-depth-of-binary-tree/" class="rank-math-link" target="_blank" rel="noopener">链接</a></li>
</ul>

<p class="wp-block-paragraph">上面的问题中，前2个问题是以树的每一层为单位进行的，第1题需要输出树的每一层，并根据行数进行反转。第2题需要判断树的每一层是否是对称。第3个问题需要广度优先遍历这棵树，直到出现空节点。</p>

<p class="wp-block-paragraph">二叉树的最小深度的广度优先遍历的参考代码：</p>

<pre class="EnlighterJSRAW" data-enlighter-language="generic" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">def minDepth(self, root):
    if not root:
        return 0
    
    node_list = [root]
    depth = 1
    
    while node_list:
        temp = []
        for node in node_list:
            if not node.left and not node.right:
                return depth
            if node.left:
                temp.append(node.left)
            if node.right:
                temp.append(node.right)
        depth += 1
        node_list = temp</pre>

<p class="wp-block-paragraph">当然，递归也是一个不错的选择：</p>

<pre class="EnlighterJSRAW" data-enlighter-language="generic" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">def minDepth(self, root: TreeNode) -> int:
    if root is None:
        return 0
    if root.left is None and root.right is None:
        return 1
    if not root.left:
        return 1 + self.minDepth(root.right)
    if not root.right:
        return 1 + self.minDepth(root.left)
    return 1 + min(self.minDepth(root.left), self.minDepth(root.right))</pre>

<h4 class="wp-block-heading">深度优先遍历</h4>

<p class="wp-block-paragraph">沿着树的子节点遍历树，尽可能深的搜索树的分支。当节点v的所有子节点都己被探寻过，搜索将回溯到节点v的父节点。这一过程一直进行到已发现所有节点为止。</p>

<p class="wp-block-paragraph">相比广度优先遍历，深度优先遍历能够很方便的获取一条路径上的前后节点，因此适用性更广一些。深度优先遍历常常以递归的形式来实现。</p>

<ul class="wp-block-list">
<li><strong>路径之和：</strong>Given a binary tree and a sum, find all root-to-leaf paths where each path&#8217;s sum equals the given sum. <a class="rank-math-link rank-math-link" href="https://leetcode.com/problems/path-sum-ii/" target="_blank" rel="noopener">链接</a></li>

<li><strong>二叉树的最近公共祖先：</strong>Given a binary tree, find the lowest common ancestor (LCA) of two given nodes in the tree. <a class="rank-math-link rank-math-link" href="https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree/" target="_blank" rel="noopener">链接</a></li>
</ul>

<p class="wp-block-paragraph">第一题路径之和需要判断一条从根节点到叶子节点的路径之和是否等于给定值。如果使用广度优先遍历就需要在遍历过程中将整颗树的路径都保存下来，会占用很大的空间。第二题需要寻找2个子节点的最近公共祖先。采用递归，判断当前节点的左右子树是否包含给定的节点，如果左子树包含且右子树也包含，则当前节点为最近公共祖先。参考代码：</p>

<pre class="EnlighterJSRAW" data-enlighter-language="generic" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">def lowestCommonAncestor(self, root, p, q):
    if not root: return None
    if p == root or q == root:
        return root
    left = self.lowestCommonAncestor(root.left, p , q)
    right = self.lowestCommonAncestor(root.right, p , q)
        
    if left and right:
        return root
    if not left:
        return right
    if not right:
        return left</pre>

<h4 class="wp-block-heading">两者比较</h4>

<p class="wp-block-paragraph">广度优先遍历一般需要存储产生的所有结点，占的存储空间要比深度优先遍历大得多，因此程序设计中，必须考虑溢出和节省内存空间得问题。</p>

<p class="wp-block-paragraph">感觉没有什么问题是只能用广度优先遍历或者深度优先遍历来解，无非是一种更方便一点，另外一种在编码难度和效率上略逊一点。</p>

<ul class="wp-block-list">
<li><strong>N叉树的最大深度：</strong>Given a n-ary tree, find its maximum depth. <a class="rank-math-link" href="https://leetcode.com/problems/maximum-depth-of-n-ary-tree/" target="_blank" rel="noopener">链接</a></li>

<li><strong>求根到叶子节点数字之和：</strong>Given a binary tree containing digits from 0-9 only, each root-to-leaf path could represent a number. An example is the root-to-leaf path 1-&gt;2-&gt;3 which represents the number 123. Find the total sum of all root-to-leaf numbers. <a class="rank-math-link" href="https://leetcode.com/problems/sum-root-to-leaf-numbers/" target="_blank" rel="noopener">链接</a></li>

<li><strong>删除无效的括号：</strong>Remove the minimum number of invalid parentheses in order to make the input string valid. Return all possible results. <a class="rank-math-link rank-math-link rank-math-link" href="https://leetcode.com/problems/remove-invalid-parentheses/" target="_blank" rel="noopener">链接</a></li>
</ul>

<p class="wp-block-paragraph">上面的题目既可以用广度优先遍历来实现，也可以用深度优先遍历来实现。</p>

<p class="wp-block-paragraph">第一题N叉树的最大深度可以使用广度优先遍历，统计总共遍历了几层。也可以使用深度优先遍历，计算各个从根节点到叶子节点的路径的长度，取最大值。</p>

<p class="wp-block-paragraph">第二题使用两种遍历方法的解题思路与第一题类似。</p>

<p class="wp-block-paragraph">第三题删除无效括号，因为可能存在多组解，所以需要将所有的结果输出。用深度优先遍历或者广度优先遍历均可。下面分别是通过不同的遍历方法来求解：</p>

<pre class="EnlighterJSRAW" data-enlighter-language="generic" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">def removeInvalidParentheses(self, s):
    def dfs(s):
        mi = calc(s)
        if mi == 0:
            return [s]
        ans = []
        for x in range(len(s)):
            if s[x] in ('(', ')'):
                ns = s[:x] + s[x+1:]
                if ns not in visited and calc(ns) &lt; mi:
                    visited.add(ns)
                    ans.extend(dfs(ns))
        return ans
        
    def calc(s):
        a = b = 0
        for c in s:
            a += {'(' : 1, ')' : -1}.get(c, 0)
            b += a &lt; 0
            a = max(a, 0)
        return a + b

    visited = set([s])    
    return dfs(s)</pre>

<pre class="EnlighterJSRAW" data-enlighter-language="generic" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">def removeInvalidParentheses(self, s):
    def isvalid(s):
        ctr = 0
        for c in s:
            if c == '(':
                ctr += 1
            elif c == ')':
                ctr -= 1
                if ctr &lt; 0:
                    return False
        return ctr == 0
    level = {s}
    while True:
        valid = filter(isvalid, level)
        if valid:
            return valid
        level = {s[:i] + s[i+1:] for s in level for i in range(len(s))}</pre>

<h3 class="wp-block-heading">二叉树的遍历</h3>

<p class="wp-block-paragraph">二叉树还存在着一些独特的遍历手段：</p>

<ul class="wp-block-list">
<li><strong>前序遍历：</strong>Given a binary tree, return the preorder traversal of its nodes&#8217; values. <a href="https://leetcode.com/problems/binary-tree-preorder-traversal/" class="rank-math-link" target="_blank" rel="noopener">链接</a></li>

<li><strong>中序遍历：</strong>Given a binary tree, return the inorder traversal of its nodes&#8217; values. <a href="https://leetcode.com/problems/binary-tree-inorder-traversal/" class="rank-math-link" target="_blank" rel="noopener">链接</a></li>

<li><strong>后序遍历：</strong>Given a binary tree, return the postorder traversal of its nodes&#8217; values. <a href="https://leetcode.com/problems/binary-tree-postorder-traversal/" class="rank-math-link" target="_blank" rel="noopener">链接</a></li>
</ul>

<p class="wp-block-paragraph">以及一些围绕这三种遍历方式的问题：</p>

<ul class="wp-block-list">
<li><strong>根据前序遍历和后序遍历构建二叉树：</strong>Return any binary tree that matches the given preorder and postorder traversals. <a href="https://leetcode.com/problems/construct-binary-tree-from-preorder-and-postorder-traversal/" class="rank-math-link" target="_blank" rel="noopener">链接</a></li>

<li><strong>N叉树的前序遍历：</strong>Given an n-ary tree, return the preorder traversal of its nodes&#8217; values. <a href="https://leetcode.com/problems/n-ary-tree-preorder-traversal/" class="rank-math-link" target="_blank" rel="noopener">链接</a></li>

<li><strong>二叉搜索树中第K小的元素：</strong>Given a binary search tree, write a function kthSmallest to find the kth smallest element in it. <a href="https://leetcode.com/problems/kth-smallest-element-in-a-bst/" class="rank-math-link" target="_blank" rel="noopener">链接</a></li>
</ul>

<p class="wp-block-paragraph">第一，二题比较简单。对于第三题，可以根据二叉搜索树的特性进行中序遍历，因为二叉搜索树的中序遍历即为二叉搜索树的所有节点的排序结果，所以再中序遍历时，得到的第K个结果即为题解。参考代码：</p>

<pre class="EnlighterJSRAW" data-enlighter-language="generic" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">def kthSmallest(self, root, k):
    i=0
    stack=[]
    node=root
    while node or stack:
        while node:
            stack.append(node)
            node=node.left
        node=stack.pop()
        i+=1
        if i==k:
            return node.val
        node=node.right</pre>

<hr class="wp-block-separator has-css-opacity"/>

<h2 class="wp-block-heading">其他问题</h2>

<h3 class="wp-block-heading">树转图</h3>

<p class="wp-block-paragraph">如果在使用树的过程中，频繁的需要根据子节点获取父节点时，一种做法是为每个子节点添加一个父节点属性，或者干脆就将树转换为无向图来处理。参考问题：</p>

<ul class="wp-block-list">
<li><strong>冗余连接：</strong>The given input is a graph that started as a tree with N nodes (with distinct values 1, 2, …, N), with one additional edge added. The added edge has two different vertices chosen from 1 to N, and was not an edge that already existed. Return an edge that can be removed so that the resulting graph is a tree of N nodes. <a href="https://leetcode.com/problems/redundant-connection/" class="rank-math-link" target="_blank" rel="noopener">链接</a></li>

<li><strong>二叉树中所有距离为 K 的结点：</strong>We are given a binary tree (with root node root), a target node, and an integer value K. Return a list of the values of all nodes that have a distance K from the target node.  The answer can be returned in any order. <a href="https://leetcode.com/problems/all-nodes-distance-k-in-binary-tree/" class="rank-math-link" target="_blank" rel="noopener">链接</a></li>
</ul>

<p class="wp-block-paragraph">具体解法在《算法笔记——图》中详细介绍。</p>

<h3 class="wp-block-heading">动态规划</h3>

<p class="wp-block-paragraph">因为树本身的数据结构的限制，一方面，我们得到的是顶点，而不是叶子节点的集合；另一方面，基本的树结构只能从父节点获取子节点，而不能从子节点得到父节点。</p>

<p class="wp-block-paragraph">这两个特点决定了树状的动态规划问题自底向上的求解是比较困难的，进而就投向了深度遍历的怀抱。或者说是“记忆化搜索”。参考问题：</p>

<ul class="wp-block-list">
<li><strong>不同的二叉搜索树：</strong>Given n, how many structurally unique BST&#8217;s (binary search trees) that store values 1 … n ? <a href="https://leetcode.com/problems/unique-binary-search-trees/" class="rank-math-link" target="_blank" rel="noopener">链接</a></li>

<li><strong>打家劫舍 III：</strong>The thief has found himself a new place for his thievery again. There is only one entrance to this area, called the &#8220;root.&#8221; Besides the root, each house has one and only one parent house. After a tour, the smart thief realized that &#8220;all houses in this place forms a binary tree&#8221;. It will automatically contact the police if two directly-linked houses were broken into on the same night. Determine the maximum amount of money the thief can rob tonight without alerting the police. <a href="https://leetcode.com/problems/house-robber-iii/" class="rank-math-link" target="_blank" rel="noopener">链接</a></li>

<li><strong>二叉树布控：</strong>Given a binary tree, we install cameras on the nodes of the tree. Each camera at a node can monitor its parent, itself, and its immediate children. Calculate the minimum number of cameras needed to monitor all nodes of the tree. <a href="https://leetcode.com/problems/binary-tree-cameras/" class="rank-math-link" target="_blank" rel="noopener">链接</a></li>
</ul>

<p class="wp-block-paragraph"> 具体解法在《<a href="https://littlepotato.me/2018/12/09/algorithm-note-dynamic-programing/#lwptoc14" class="rank-math-link">算法笔记——动态规划</a>》中详细介绍。 </p>

<hr class="wp-block-separator has-css-opacity"/>

<h2 class="wp-block-heading">参考链接</h2>

<ul class="wp-block-list">
<li><a href="https://segmentfault.com/a/1190000016329895" class="rank-math-link" target="_blank" rel="noopener">https://segmentfault.com/a/1190000016329895</a></li>

<li><a class="rank-math-link rank-math-link" href="https://www.zybuluo.com/pastqing/note/314050" target="_blank" rel="noopener">https://www.zybuluo.com/pastqing/note/314050</a></li>

<li><a href="https://www.jianshu.com/p/ff4b93b088eb" target="_blank" rel="noopener">https://www.jianshu.com/p/ff4b93b088eb</a></li>

<li><a href="https://zh.wikipedia.org/wiki/%E7%BA%A2%E9%BB%91%E6%A0%91" target="_blank" rel="noopener">https://zh.wikipedia.org/wiki/%E7%BA%A2%E9%BB%91%E6%A0%91</a></li>

<li><a href="https://medium.com/analytics-vidhya/what-is-huffman-coding-ea36379da63e" target="_blank" rel="noopener">https://medium.com/analytics-vidhya/what-is-huffman-coding-ea36379da63e</a></li>
</ul>
