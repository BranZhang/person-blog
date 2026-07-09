---
title: "算法笔记——动态规划"
description: "0， 发现是动态规划类问题 1，寻找最优子状态与状态转移方程 2，找不到 3，时间到，卒"
pubDatetime: 2018-12-09T09:51:43.000Z
modDatetime: 2023-01-03T09:56:09.000Z
draft: false
tags: ["算法"]
---

本篇文章是对动态规划类的问题进行一个汇总。随着我对这类的问题的不断地接触，这篇笔记也会不断的丰富。

在网上看到了一篇对动态规划问题梳理的很详细的文章，所以本文基本按照那篇文章的结构来进行，之后会结合 LeetCode 中的实际题目看看处理问题的思路。那篇文章的链接见文末。

## 简介

个人感觉动态规划类似高中的数学归纳法。对于一个问题，我知道问题尺度很小的时候的处理办法，我也知道如何根据一个已有的状态，计算出下一个状态的方法。于是，这个问题就解决了。不同于高中的数学问题，现在接触到的动态规划问题，不太容易用公式这样很纯粹的东西去表达，或许是我笨吧。所以也就有了这篇梳理思路的笔记。

---

## 动态规划初探

### 递推

递推简单来说就是从前往后来一遍。在计算后者的数值时，需要用到前者的结果。一种自底向上的方法。

**卖股票：**Say you have an array for which the ith element is the price of a given stock on day i. If you were only permitted to complete at most one transaction (i.e., buy one and sell one share of the stock), design an algorithm to find the maximum profit. [链接](https://leetcode.com/problems/best-time-to-buy-and-sell-stock/)

为了寻找最佳的买入卖出时间，题目实际上是假设了我们能够遇见未来一段时间内的股价。（否则怎么能在事先计算好的时间点买入卖出？）单纯的寻找数组的最小值和最大值没有意义。因为最小值在最大值之前出现才有意义。

所以，在遍历时，一方面我们要计算一下当前值之前的股价最低值。另一方面，用当前值减去最低值，就可以知道一次交易的获利，进而计算一个时间段内的获取最大收益的买入卖出时间。

### 记忆化搜索

不同于递推的自底向上，记忆化搜索是自顶向下的。计算的过程看起来和深度优先遍历可能比较相似。个人感觉有不少的动态规划类的题目可以用深度遍历来实现。

记忆化搜索避免了对所有状态都计算一遍。有些问题把所有状态都遍历一遍效率太低，或者对答案的求解本就只需要计算一部分即可。

**找零钱：**You are given coins of different denominations and a total amount of money amount. Write a function to compute the fewest number of coins that you need to make up that amount. If that amount of money cannot be made up by any combination of the coins, return -1. [链接](https://leetcode.com/problems/coin-change/)

从动态规划的角度来说：假设我要凑到 *N* 元，并且我有 *p, q, m* 三种零钱，那么我凑到 N 元所需要的最少的零钱数等于 *MIN(coinChange(N-p), coinChange(N-q), coinChange(N-m)) + 1*。

从深度遍历的角度来说：我一开始并不需要考虑到每种零钱的存在。从很朴素的思考问题的角度来看，我先用面额最大的零钱尽可能的凑够 *N* 元，不够的再用面额稍小的来凑。如此一来，计算量便少于动态规划的方法。参考代码：

```python
def coinChange(self, coins, amount):
    coins.sort(reverse=True)
    INVALID = 10**10
    self.ans = INVALID

    def dfs(s, amount, count):      
        if amount == 0:
            self.ans = count
            return
        if s == len(coins): return
      
        coin = coins[s]
        for k in range(amount // coin, -1, -1):
            if count + k >= self.ans: break
            dfs(s + 1, amount - k * coin, count + k)
    dfs(0, amount, 0)
    return -1 if self.ans == INVALID else self.ans
```

### 状态和状态转移

状态，即意味着在将一个大问题化解为小问题时，一个小问题的处理结果。

在递推的例子中，前 *N* 天的最低股价是一个状态。这个状态随着天数的增加而刷新。

在记忆化搜索的例子中，凑到 *M* 元所需要的最少的零钱数就是一个状态。

### 最优化原理和最优子结构

对于一个问题，会存在不一样的状态选取和转移方程。也就带来了不一样的复杂度。

**最长单调子序列：**Given an unsorted array of integers, find the length of longest increasing subsequence. [链接](https://leetcode.com/problems/longest-increasing-subsequence/)

嗯，看起来并不是很难。状态是截至到当前位置的题解，状态转移方式就是判断前面的数，看看当前的数接到后面是否满足单调增。所以首先要遍历一遍，对于第 *i* 个数，遍历前 *i-1* 个，如果其中的第 j 个满足 *Array[i] > Array[j]*，则 *dp[i] = MAX(dp[i], dp[j]+1)*。解决了，时间复杂度 $O(n^{2})$。

但实际上还有更快的解决方法，时间复杂度为 $O(nlogn)$。状态是长度为 N 的单调子序列的最后的一个值，状态转移方式是 *dp[position(num)] = num*。这样就保证了对于第 i 个数，前 i 个的解是单调增的，这是我们就不需要再通过遍历寻找需要插入的位置了，直接通过二叉搜索。于是时间复杂度就优化到了 $O(nlogn)$。

### 决策和无后效性

在动态规划中，后一状态应该只考虑上一状态的情况，而与更早的状态无关。对于需要计算的下一状态，我只关心如何从上一个状态计算得到，至于更早的状态，那是在计算上一个状态时需要考虑的，现在无需再关心了。

以下面的题目为例，有一排房子，抢劫后可以得到指定的钱，但是为了避免触发报警器，不能抢劫相邻的房子。

**入室抢劫：**Given a list of non-negative integers representing the amount of money of each house, determine the maximum amount of money you can rob tonight without alerting the police. It will automatically contact the police if two adjacent houses were broken into on the same night. [链接](https://leetcode.com/problems/house-robber/)

所以，当强盗拿着事先踩点好的房子价值列表，从街头往街尾走，安排抢劫计划。对于第 N 栋房子，抢还是不抢呢？

如果抢，那么第 N-1 必然不能抢，那么截止到第 N 栋的最大收益等于第 N 栋房子的价格加上截止到第 N-2 栋的最大收益。如果不抢，那么截止到第 N 栋的最大收益等于截止到第 N-1 栋的最大收益。

---

## 经典模型

### 线性模型

这里的线性指的是问题的依赖关系是线性的。在下面的“动态规划的常用状态转移方程”章节中会提到“把问题的依赖关系可以看成是一个图”的观点。很多题目的依赖关系都是线性的。

**找零钱：**You are given coins of different denominations and a total amount of money amount. Write a function to compute the fewest number of coins that you need to make up that amount. If that amount of money cannot be made up by any combination of the coins, return -1. [链接](https://leetcode.com/problems/coin-change/)

假设 $dp(i)$ 就是要凑到 $i$ 元所需要的最少硬币数，则转移方程为 $dp(i) = min(dp(i-n)) + 1, n \in coins$。使用动态规划的参考解法如下：

```python
def coinChange(self, coins, amount):
    MAX = float('inf')
    dp = [0] + [MAX] * amount

    for i in xrange(1, amount + 1):
        dp[i] = min([dp[i - c] if i - c >= 0 else MAX for c in coins]) + 1
		
    return [dp[amount], -1][dp[amount] == MAX]
```

前面也提到了这条题目的深度遍历的解法，可以对比一下这两种解法。

### 区间模型

区间模型的状态表示一般为d[i][j]，表示区间[i, j]上的最优解，然后通过状态转移计算出[i+1, j]或者[i, j+1]上的最优解，逐步扩大区间的范围，最终求得[1, len]的最优解。

**最小路径：**Given a m x n grid filled with non-negative numbers, find a path from top left to bottom right which minimizes the sum of all numbers along its path. You can only move either down or right at any point in time. [链接](https://leetcode.com/problems/minimum-path-sum/)

感觉这条题目故意创造了一个区间模型的问题。转移方程是：

$$
dp[i][j] = min(dp[i-1][j], dp[i][j-1]) + grids[i][j]
$$

解法示例：

```python
def minPathSum(self, grid: List[List[int]]) -> int:
    if not grid:
        return 0
        
    M = len(grid)
    N = len(grid[0])
        
    dp = [[0]*N for _ in range(M)]
        
    dp[0][0] = grid[0][0]
        
    for i in range(1, M):
        dp[i][0] = grid[i][0] + dp[i-1][0]
            
    for j in range(1, N):
        dp[0][j] = grid[0][j] + dp[0][j-1]
       
    for i in range(1, M):
        for j in range(1, N):
            dp[i][j] = min(dp[i-1][j], dp[i][j-1]) + grid[i][j]
        
    return dp[M-1][N-1]
```

实际上，上面的解法在空间上还有优化的空间，可以参考下面的“滚动数组”优化方法。

### 背包模型

#### **0/1背包**

**模型说明：**有 $N$ 种物品（每种物品1件）和一个容量为 $V$ 的背包。放入第 $i$ 种物品耗费的空间是 $C_i$ ，得到的价值是 $W_i$ 。求解将哪些物品装入背包可使价值总和最大。

**解法：**$f[i][v]$ 表示前i种物品恰好放入一个容量为 $v$ 的背包可以获得的最大价值。决策为第 $i$ 个物品在前 $i-1$ 个物品放置完毕后，是选择放还是不放，状态转移方程为：

$$
f[i][v] = max(f[i-1][v], f[i-1][v - C_i] +W_i)
$$

时间复杂度 $O(vn)$，空间复杂度 $O(vn)$，空间复杂度可利用滚动数组进行优化达到 $O(v)$，下文会提到。

- **把数组分为2个和相同的子集：**Given a non-empty array containing only positive integers, find if the array can be partitioned into two subsets such that the sum of elements in both subsets is equal. [链接](https://leetcode.com/problems/partition-equal-subset-sum/)

#### 完全背包

**模型说明：**有 $N$ 种物品（每种物品无限件）和一个容量为 $V$ 的背包。放入第 $i$ 种物品耗费的空间是 $C_i$ ，得到的价值是 $W_i$ 。求解将哪些物品装入背包可使价值总和最大。

**解法：**$f[i][v]$ 表示前 $i$ 种物品恰好放入一个容量为 $v$ 的背包可以获得的最大价值。状态转移方程为：

$$
f[i][v] = max(f[i-1][v - kC_i] + kWi  | 0 <= k <= v/Ci)
$$

当 $k$ 的取值为0，1时，这就是0/1背包的状态转移方程。时间复杂度 $O( vn*sum(V/C_i) )$ ，空间复杂度在用滚动数组优化后可以达到 $O(v)$ 。进行优化后，状态转移方程变成：

$$
f[i][v] = max(f[i-1][v],  f[i][v - C_i] +W_i)
$$

时间复杂度降为 $O(vn)$。

- **单词拆分：**Given a non-empty string s and a dictionary wordDict containing a list of non-empty words, determine if s can be segmented into a space-separated sequence of one or more dictionary words. [链接](https://leetcode.com/problems/word-break/)
- **求和：**Given an integer array with all positive numbers and no duplicates, find the number of possible combinations that add up to a positive integer target. [链接](https://leetcode.com/problems/combination-sum-iv/)

#### 多重背包

**模型说明：**有 $N$ 种物品（每种物品Mi件）和一个容量为 $V$ 的背包。放入第 $i$ 种物品耗费的空间是 $C_i$ ，得到的价值是 $W_i$ 。求解将哪些物品装入背包可使价值总和最大。

**解法：**$f[i][v]$ 表示前i种物品恰好放入一个容量为$v$ 的背包可以获得的最大价值。

$$
f[i][v] = max(f[i-1][v - kC_i] + kW_i  | 0 <= k <= M_i)
$$

时间复杂度 $O( v*sum(M_i))$ ，空间复杂度仍然可以用滚动数组优化后可以达到 $O(v)$ 。

**优化：**采用二进制拆分物品，将Mi个物品拆分成容量为 $1, 2, 4, 8, ......, 2^{k}, Mi-( 2^{k+1} - 1 )$ 个对应价值为$W_i, 2W_i, 4W_i, 8W_i, ......, 2^{k}W_i, (M_i-( 2^{k+1} - 1 ))W_i$ 的物品，然后采用0/1背包求解。这样做的时间复杂度降为 $O(v*sum(logM_i))$ 。这样的拆分方式在[链接](https://leetcode.com/problems/powx-n/)这条题目里也有所运用。

- **0和1：**In the computer world, use restricted resource you have to generate maximum benefit is what we always want to pursue. For now, suppose you are a dominator of m 0s and n 1s respectively. On the other hand, there is an array with strings consisting of only 0s and 1s. Now your task is to find the maximum number of strings that you can form with given m 0s and n 1s. Each 0 and 1 can be used at most once. [链接](https://leetcode.com/problems/ones-and-zeroes/)
- **求和：**Given a collection of candidate numbers (candidates) and a target number (target), find all unique combinations in candidates where the candidate numbers sums to target. [链接](https://leetcode.com/problems/combination-sum-ii/)

### 状态压缩模型

状态压缩的动态规划，一般处理的是数据规模较小的问题，将状态压缩成k进制的整数，k取2时最为常见。

未在 LeetCode 中做到对应类型的题目。

### 树状模型

树形动态规划（树形DP），是指状态图是一棵树，状态转移也发生在树上，父结点的值通过所有子结点计算完毕后得出。

因为树本身的数据结构的限制，一方面，我们得到的是顶点，而不是叶子节点的集合；另一方面，基本的树结构只能从父节点获取子节点，而不能从子节点得到父节点。

这两个特点决定了树状的动态规划问题自底向上的求解是比较困难的，进而就投向了深度遍历的怀抱。类似于前面的“记忆化搜索”。

**二叉树布控： **Given a binary tree, we install cameras on the nodes of the tree. Each camera at a node can monitor its parent, itself, and its immediate children. Calculate the minimum number of cameras needed to monitor all nodes of the tree. [链接](https://leetcode.com/problems/binary-tree-cameras/)

通过给每个节点一个状态标记来实现状态的转移，以及所需要的摄像头的数量记录。

```python
# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, x):
#         self.val = x
#         self.left = None
#         self.right = None

class Solution:
    def minCameraCover(self, root):
        # 0 代表没有被监控。1 代表被监控但是自己没有摄像头。 2 代表自己就拥有一个摄像头。
        def dfs(node):
            if not node:
                return 1
            l=dfs(node.left)
            r=dfs(node.right)
            
            if l==0 or r==0:
                self.sum+=1
                return 2
            elif l==2 or r==2:
                return 1
            else:
                return 0
        
        self.sum=0
        if dfs(root)==0:
            self.sum+=1
        
        return self.sum
```

当然，并不是涉及到树结构的动态规划问题就是树状模型。例如：

叶子节点最小开销：Given an array arr of positive integers, consider all binary trees such that: Each node has either 0 or 2 children; The values of arr correspond to the values of each leaf in an in-order traversal of the tree. (Recall that a node is a leaf if and only if it has 0 children.) The value of each non-leaf node is equal to the product of the largest leaf value in its left and right subtree respectively. Among all possible binary trees considered, return the smallest possible sum of the values of each non-leaf node. [链接](https://leetcode.com/problems/minimum-cost-tree-from-leaf-values/)

---

## 动态规划的常用状态转移方程

原作者参考自《算法艺术与信息学竞赛》。动态规划算法三要素：

- 所有不同的子问题组成的表
- 解决问题的依赖关系可以看成是一个图
- 填充子问题的顺序（即对②的图进行拓扑排序，填充的过程称为状态转移）

不过到目前位置碰到的题目都是基于数组实现的状态转移，还没有碰见真正的需要基于图来实现的状态转移。

![](/wp-content/uploads/2019/09/algorithm-1-1.png)

![](/wp-content/uploads/2019/09/algorithm-1-2.png)

以上为原书的内容。原书中归纳的4中状态转移方程并不能完全理解，我还是结合例子来看吧。

---

## 动态规划和数据结构结合的常用优化

### 滚动数组

本来是将这道例题放在“最优化原理和最优子结构”章里面的，但是仔细看了下我自己的解法和别人提供的解法之后，发现发现问题并不是我的状态和转移方程选取的不够好，而是我没有对算法所需的空间进行优化。

**不同的子串：**Given a string S and a string T, count the number of distinct subsequences of S which equals T. A subsequence of a string is a new string which is formed from the original string by deleting some (can be none) of the characters without disturbing the relative positions of the remaining characters. (ie, “ACE” is a subsequence of “ABCDE” while “AEC” is not). [链接](https://leetcode.com/problems/distinct-subsequences/)

输入的是两个字符串，*S* 和 *T*，所以很自然的想到利用一个二维数组 *dp*，*dp[i][j]* 代表 *S[0:i]* 和 *T[0:j]* 对于本题的解。解法如下：

```python
def numDistinct(self, s, t):
    """
    :type s: str
    :type t: str
    :rtype: int
    """
    dp = [[0] * (len(s)+1) for _ in range(len(t)+1)]
    
    for i in range(len(s)+1):
        dp[0][i] = 1
    
    for i in range(len(t)):
        for j in range(len(s)):
            if t[i] == s[j]:
                dp[i+1][j+1] = dp[i+1][j] + dp[i][j]
            else:
                dp[i+1][j+1] = dp[i+1][j]
    
    return dp[-1][-1]
```

但是实际上，在计算 *dp[i+1][j+1]* 时，只用到了 *dp[i+1][j] *和 *dp[i][j]*，因此实际上只需要用一个一维数组就可以完成算法。

```python
def numDistinct(self, s: str, t: str) -> int:
    if not t:
        return 1
    if not s:
        return 0
    
    m, n = len(s), len(t)
    dp = [0] * (n + 1)
    dp[0] = 1
    
    for i in range(1, m + 1):
        for j in range(n, 0, -1):
            if s[i - 1] == t[j - 1]:
                dp[j] += dp[j - 1]
    
    return dp[-1]
```

### 最长单调子序列的二分优化

同样是上面“最优化原理和最优子结构”章节的例题，

**最长单调子序列：**Given an unsorted array of integers, find the length of longest increasing subsequence. [链接](https://leetcode.com/problems/longest-increasing-subsequence/)

状态是截至到当前位置的题解，状态转移方式就是判断前面的数，看看当前的数接到后面是否满足单调增。所以首先要遍历一遍，对于第 *i* 个数，遍历前 *i-1* 个，如果其中的第 j 个满足 *Array[i] > Array[j]*，则 *dp[i] = MAX(dp[i], dp[j]+1)*。解决了，时间复杂度 $O(n^{2})$。

```java
public int lengthOfLIS(int[] nums) {
	if(nums.length <= 1) 
		return nums.length;

	// 记录最长子串长度
	int T[] = new int[nums.length];

	// Fill each position with value 1 in the array
	for(int i=0; i < nums.length; i++)
		T[i] = 1;

	// Mark one pointer at i. For each i, start from j=0.
	for(int i=1; i < nums.length; i++) {
		for(int j=0; j < i; j++) {
			// It means next number contributes to increasing sequence.
			if(nums[j] < nums[i]) {
				// But increase the value only if it results in a larger value of the sequence than T[i]
				// It is possible that T[i] already has larger value from some previous j'th iteration
				if(T[j] + 1 > T[i]) {
					T[i] = T[j] + 1;
				}
			}
		}
	}

	// Find the maximum length from the array that we just generated 
	int longest = 0;
	for(int i=0; i < T.length; i++)
		longest = Math.max(longest, T[i]);

	return longest;
}
```

但实际上还有更快的解决方法，时间复杂度为 $O(nlogn)$。状态是长度为 N 的单调子序列的最后的一个值，状态转移方式是 *dp[position(num)] = num*。这样就保证了对于第 i 个数，前 i 个的解是单调增的，这是我们就不需要再通过遍历寻找需要插入的位置了，直接通过二叉搜索。于是时间复杂度就优化到了 $O(nlogn)$。

```python
def lengthOfLIS(self, nums):
    tails = [0] * len(nums)
    size = 0
    for x in nums:
        i, j = 0, size
        while i != j:
            m = (i + j) / 2
            if tails[m] < x:
                i = m + 1
            else:
                j = m
        tails[i] = x
        size = max(i + 1, size)
    return size
```

### 其他优化

暂未接触到相关的问题，遇到后再补充。

---

## 解题记录

### 完美平方数

Given a positive integer n, find the least number of perfect square numbers (for example, 1, 4, 9, 16, …) which sum to n. [链接](https://leetcode.com/problems/perfect-squares/)

和“记忆化搜索”章节以及“线性模型”章节中的“找零钱”示例类似，不过这里的零钱是一系列的平方数。这个问题的转移方程为 $dp(i) = min(dp(i-n)) + 1, n \in (1, 4, 9, 16, ......)$。参考解法：

```java
class Solution {
    public int numSquares(int n) {
        int[] dp = new int[n + 1];
        Arrays.fill(dp, Integer.MAX_VALUE);
        for (int i = 0; i * i <= n; i++){
            dp[i * i] = 1;
        }
        for (int i = 1; i <= n; i++){
            for (int j = 1; j * j <= i; j++){
                dp[i] = Math.min(dp[i], dp[i - j * j] + 1);
            }
        }
        return dp[n];
    }
}
```

这条题目不难。但如果需要达到更优的效果，就需要借助数学知识了。根据[四平方和定理](https://baike.baidu.com/item/%E5%9B%9B%E5%B9%B3%E6%96%B9%E5%92%8C%E5%AE%9A%E7%90%86/4507832)，每个正整数均可表示为4个整数的平方和（其中有些数可能是0）。如果一个数可以整除4，那么这个数和这个数除以4以后的数，可以被同样个数的平方和表示。如果一个数除以8余7，那这个数只能用4个数的平方和表示。

```java
class Solution {
    public int numSquares(int n){
        while (n % 4 == 0){
            n = n/4;
        }
        // 4个的情况
        if (n % 8 == 7){
            return 4;
        }
        // 1或2个的情况
        for (int i = 0; i * i <= n; i++){
            int j = (int)Math.sqrt(n - i * i);
            if (i * i + j * j == n){
                int res = 0;
                if (i > 0){
                    res += 1;
                }
                if (j > 0){
                    res += 1;
                }
                return res;
            } 
        }
        // 3个的情况
        return 3;
    }
}
```

### 公式求和

You are given a list of non-negative integers, a1, a2, …, an, and a target, S. Now you have 2 symbols + and -. For each integer, you should choose one from + and – as its new symbol. Find out how many ways to assign symbols to make sum of integers equal to target S. [链接](https://leetcode.com/problems/target-sum/)

类似于24点游戏，不过这里只能用加和减。最暴力的方法就是罗列出所有的加减搭配方法，但是效率不允许。当然，不能从运算符的角度角度去遍历，我们可以从前 N 个数的计算结果可能值下手。同时，在 N 增长的过程中，去除一些“跑偏”的结果。解法示例：

```text
def findTargetSumWays(self, nums, S):
    """
    :type nums: List[int]
    :type S: int
    :rtype: int
    """
    poss_dict = {0:1}
            
    num_sum = sum(nums)
    
    for num in nums:
        temp = {}
        for pos in poss_dict:
            if not pos-num_sum <= S <= pos+num_sum:
                continue
            if pos+num in temp:
                temp[pos+num] += poss_dict[pos]
            else:
                temp[pos+num] = poss_dict[pos]
            if pos-num in temp:
                temp[pos-num] += poss_dict[pos]
            else:
                temp[pos-num] = poss_dict[pos]
        poss_dict = temp
        num_sum -= num
        
    if S in poss_dict:
        return poss_dict[S]
    else:
        return 0
```

上面的思路实际上是广度遍历。如果非要从运算符的角度去考虑问题呢？本题只有加和减两种运算符，那么可以这样来考虑，把给定的数组 A 中的数字分配到 M 和 N 两个数组中，使得 sum(M) – sum(N) == S 。M表示符号为 + 的数字，而 N 表示符号为 – 的数字。变换一下公式，即可得到，符号为 – 的数字与最终结果 S 构成的数组，数组之和应该等于符号为 + 的数字构成的数组。

例如：输入数组是 [2, 5, 6, 8]，期望运算结果是7。那么 -2-5+6+8=7 是一组解。也就是 sum(2, 5, 7) == sum(6, 8) 。那么问题就变成了如何将一个数组拆分为2组和相同的子数组。也就是上文提到的“背包模型”的“0/1背包”。解法示例：

```java
class Solution {
    public int findTargetSumWays(int[] nums, int s) {
        int sum = 0;
        for (int n : nums)
            sum += n;
        return sum < s || (s + sum) % 2 > 0 ? 0 : subsetSum(nums, (s + sum) >>> 1); 
    }   

    public int subsetSum(int[] nums, int s) {
        int[] dp = new int[s + 1]; 
        dp[0] = 1;
        for (int n : nums)
            for (int i = s; i >= n; i--)
                dp[i] += dp[i - n]; 
        return dp[s];
    } 
}
```

---

## 参考链接

- [http://www.cppblog.com/menjitianya/archive/2015/10/23/212084.html](http://www.cppblog.com/menjitianya/archive/2015/10/23/212084.html)
- [https://oi-wiki.org/dp/](https://oi-wiki.org/dp/)
- [https://www.1point3acres.com/bbs/forum.php?mod=viewthread&tid=542696](https://www.1point3acres.com/bbs/forum.php?mod=viewthread&tid=542696)
