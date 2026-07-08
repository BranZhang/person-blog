---
title: "算法笔记——动态规划"
description: "0， 发现是动态规划类问题 1，寻找最优子状态与状态转移方程 2，找不到 3，时间到，卒"
pubDatetime: 2018-12-09T09:51:43.000Z
modDatetime: 2023-01-03T09:56:09.000Z
author: "Zhang"
tags:
  - "算法"
canonicalURL: "https://littlepotato.me/2018/12/09/algorithm-note-dynamic-programing/"
---

<p class="wp-block-paragraph">本篇文章是对动态规划类的问题进行一个汇总。随着我对这类的问题的不断地接触，这篇笔记也会不断的丰富。</p>

<p class="wp-block-paragraph">在网上看到了一篇对动态规划问题梳理的很详细的文章，所以本文基本按照那篇文章的结构来进行，之后会结合 LeetCode 中的实际题目看看处理问题的思路。那篇文章的链接见文末。</p>

<!--more-->

<h2 class="wp-block-heading">简介</h2>

<p class="wp-block-paragraph">个人感觉动态规划类似高中的数学归纳法。对于一个问题，我知道问题尺度很小的时候的处理办法，我也知道如何根据一个已有的状态，计算出下一个状态的方法。于是，这个问题就解决了。不同于高中的数学问题，现在接触到的动态规划问题，不太容易用公式这样很纯粹的东西去表达，或许是我笨吧。所以也就有了这篇梳理思路的笔记。</p>

<hr class="wp-block-separator has-css-opacity"/>

<h2 class="wp-block-heading">动态规划初探</h2>

<h3 class="wp-block-heading">递推</h3>

<p class="wp-block-paragraph">递推简单来说就是从前往后来一遍。在计算后者的数值时，需要用到前者的结果。一种自底向上的方法。</p>

<p class="wp-block-paragraph"><strong>卖股票：</strong>Say you have an array for which the ith element is the price of a given stock on day i. If you were only permitted to complete at most one transaction (i.e., buy one and sell one share of the stock), design an algorithm to find the maximum profit. <a href="https://leetcode.com/problems/best-time-to-buy-and-sell-stock/" target="_blank" rel="noopener">链接</a></p>

<p class="wp-block-paragraph">为了寻找最佳的买入卖出时间，题目实际上是假设了我们能够遇见未来一段时间内的股价。（否则怎么能在事先计算好的时间点买入卖出？）单纯的寻找数组的最小值和最大值没有意义。因为最小值在最大值之前出现才有意义。</p>

<p class="wp-block-paragraph">所以，在遍历时，一方面我们要计算一下当前值之前的股价最低值。另一方面，用当前值减去最低值，就可以知道一次交易的获利，进而计算一个时间段内的获取最大收益的买入卖出时间。</p>

<h3 class="wp-block-heading">记忆化搜索</h3>

<p class="wp-block-paragraph">不同于递推的自底向上，记忆化搜索是自顶向下的。计算的过程看起来和深度优先遍历可能比较相似。个人感觉有不少的动态规划类的题目可以用深度遍历来实现。</p>

<p class="wp-block-paragraph">记忆化搜索避免了对所有状态都计算一遍。有些问题把所有状态都遍历一遍效率太低，或者对答案的求解本就只需要计算一部分即可。</p>

<p class="wp-block-paragraph"><strong>找零钱：</strong>You are given coins of different denominations and a total amount of money amount. Write a function to compute the fewest number of coins that you need to make up that amount. If that amount of money cannot be made up by any combination of the coins, return -1. <a href="https://leetcode.com/problems/coin-change/" target="_blank" rel="noopener">链接</a></p>

<p class="wp-block-paragraph">从动态规划的角度来说：假设我要凑到 <em>N</em> 元，并且我有 <em>p, q, m</em> 三种零钱，那么我凑到 N 元所需要的最少的零钱数等于 <em>MIN(coinChange(N-p), coinChange(N-q), coinChange(N-m)) + 1</em>。</p>

<p class="wp-block-paragraph">从深度遍历的角度来说：我一开始并不需要考虑到每种零钱的存在。从很朴素的思考问题的角度来看，我先用面额最大的零钱尽可能的凑够 <em>N</em> 元，不够的再用面额稍小的来凑。如此一来，计算量便少于动态规划的方法。参考代码：</p>

<pre class="EnlighterJSRAW" data-enlighter-language="python" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">def coinChange(self, coins, amount):
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
    return -1 if self.ans == INVALID else self.ans</pre>

<h3 class="wp-block-heading">状态和状态转移</h3>

<p class="wp-block-paragraph">状态，即意味着在将一个大问题化解为小问题时，一个小问题的处理结果。</p>

<p class="wp-block-paragraph">在递推的例子中，前 <em>N</em> 天的最低股价是一个状态。这个状态随着天数的增加而刷新。</p>

<p class="wp-block-paragraph">在记忆化搜索的例子中，凑到 <em>M</em> 元所需要的最少的零钱数就是一个状态。</p>

<h3 class="wp-block-heading">最优化原理和最优子结构</h3>

<p class="wp-block-paragraph">对于一个问题，会存在不一样的状态选取和转移方程。也就带来了不一样的复杂度。</p>

<p class="wp-block-paragraph"><strong>最长单调子序列：</strong>Given an unsorted array of integers, find the length of longest increasing subsequence. <a href="https://leetcode.com/problems/longest-increasing-subsequence/" target="_blank" rel="noopener">链接</a></p>

<p class="wp-block-paragraph">嗯，看起来并不是很难。状态是截至到当前位置的题解，状态转移方式就是判断前面的数，看看当前的数接到后面是否满足单调增。所以首先要遍历一遍，对于第 <em>i</em> 个数，遍历前 <em>i-1</em> 个，如果其中的第 j 个满足 <em>Array[i] &gt; Array[j]</em>，则 <em>dp[i] = MAX(dp[i], dp[j]+1)</em>。解决了，时间复杂度 <img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-252de2ecdc38fc02b970f287778ceb76_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#79;&#40;&#110;&#94;&#123;&#50;&#125;&#41;" title="Rendered by QuickLaTeX.com" height="20" width="48" style="vertical-align: -4px;"/>。</p>

<p class="wp-block-paragraph">但实际上还有更快的解决方法，时间复杂度为 <img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-bca0c5741b018206bf7dc717c864e9f0_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#79;&#40;&#110;&#108;&#111;&#103;&#110;&#41;" title="Rendered by QuickLaTeX.com" height="18" width="75" style="vertical-align: -4px;"/>。状态是长度为 N 的单调子序列的最后的一个值，状态转移方式是 <em>dp[position(num)] = num</em>。这样就保证了对于第 i 个数，前 i 个的解是单调增的，这是我们就不需要再通过遍历寻找需要插入的位置了，直接通过二叉搜索。于是时间复杂度就优化到了 <img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-bca0c5741b018206bf7dc717c864e9f0_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#79;&#40;&#110;&#108;&#111;&#103;&#110;&#41;" title="Rendered by QuickLaTeX.com" height="18" width="75" style="vertical-align: -4px;"/>。</p>

<h3 class="wp-block-heading">决策和无后效性</h3>

<p class="wp-block-paragraph">在动态规划中，后一状态应该只考虑上一状态的情况，而与更早的状态无关。对于需要计算的下一状态，我只关心如何从上一个状态计算得到，至于更早的状态，那是在计算上一个状态时需要考虑的，现在无需再关心了。</p>

<p class="wp-block-paragraph">以下面的题目为例，有一排房子，抢劫后可以得到指定的钱，但是为了避免触发报警器，不能抢劫相邻的房子。</p>

<p class="wp-block-paragraph"><strong>入室抢劫：</strong>Given a list of non-negative integers representing the amount of money of each house, determine the maximum amount of money you can rob tonight without alerting the police. It will automatically contact the police if two adjacent houses were broken into on the same night. <a href="https://leetcode.com/problems/house-robber/" target="_blank" rel="noopener">链接</a></p>

<p class="wp-block-paragraph">所以，当强盗拿着事先踩点好的房子价值列表，从街头往街尾走，安排抢劫计划。对于第 N 栋房子，抢还是不抢呢？</p>

<p class="wp-block-paragraph">如果抢，那么第 N-1 必然不能抢，那么截止到第 N 栋的最大收益等于第 N 栋房子的价格加上截止到第 N-2 栋的最大收益。如果不抢，那么截止到第 N 栋的最大收益等于截止到第 N-1 栋的最大收益。</p>

<hr class="wp-block-separator has-css-opacity"/>

<h2 class="wp-block-heading"> 经典模型 </h2>

<h3 class="wp-block-heading"> 线性模型 </h3>

<p class="wp-block-paragraph">这里的线性指的是问题的依赖关系是线性的。在下面的“动态规划的常用状态转移方程”章节中会提到“把问题的依赖关系可以看成是一个图”的观点。很多题目的依赖关系都是线性的。</p>

<p class="wp-block-paragraph"><strong>找零钱：</strong>You are given coins of different denominations and a total amount of money amount. Write a function to compute the fewest number of coins that you need to make up that amount. If that amount of money cannot be made up by any combination of the coins, return -1. <a href="https://leetcode.com/problems/coin-change/" target="_blank" rel="noopener">链接</a></p>

<p class="wp-block-paragraph">假设 <img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-493e3eaecde91f1cf00d7fbc7eb1f116_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#100;&#112;&#40;&#105;&#41;" title="Rendered by QuickLaTeX.com" height="18" width="38" style="vertical-align: -4px;"/> 就是要凑到 <img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-299289f085d0706bdefa9bbba17ee7ec_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#105;" title="Rendered by QuickLaTeX.com" height="12" width="6" style="vertical-align: 0px;"/> 元所需要的最少硬币数，则转移方程为 <img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-776834220507f9922d3b68d79a3c9ce0_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#100;&#112;&#40;&#105;&#41;&#32;&#61;&#32;&#109;&#105;&#110;&#40;&#100;&#112;&#40;&#105;&#45;&#110;&#41;&#41;&#32;&#43;&#32;&#49;&#44;&#32;&#110;&#32;&#92;&#105;&#110;&#32;&#99;&#111;&#105;&#110;&#115;" title="Rendered by QuickLaTeX.com" height="18" width="306" style="vertical-align: -4px;"/>。使用动态规划的参考解法如下：</p>

<pre class="EnlighterJSRAW" data-enlighter-language="python" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">def coinChange(self, coins, amount):
    MAX = float('inf')
    dp = [0] + [MAX] * amount

    for i in xrange(1, amount + 1):
        dp[i] = min([dp[i - c] if i - c >= 0 else MAX for c in coins]) + 1
		
    return [dp[amount], -1][dp[amount] == MAX]</pre>

<p class="wp-block-paragraph">前面也提到了这条题目的深度遍历的解法，可以对比一下这两种解法。</p>

<h3 class="wp-block-heading"> 区间模型 </h3>

<p class="wp-block-paragraph">区间模型的状态表示一般为d[i][j]，表示区间[i, j]上的最优解，然后通过状态转移计算出[i+1, j]或者[i, j+1]上的最优解，逐步扩大区间的范围，最终求得[1, len]的最优解。</p>

<p class="wp-block-paragraph"><strong>最小路径：</strong>Given a m x n grid filled with non-negative numbers, find a path from top left to bottom right which minimizes the sum of all numbers along its path. You can only move either down or right at any point in time. <a href="https://leetcode.com/problems/minimum-path-sum/" target="_blank" rel="noopener">链接</a></p>

<p class="wp-block-paragraph">感觉这条题目故意创造了一个区间模型的问题。转移方程是：</p>

<p class="wp-block-paragraph"><p class="ql-center-displayed-equation" style="line-height: 19px;"><span class="ql-right-eqno"> &nbsp; </span><span class="ql-left-eqno"> &nbsp; </span><img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-9f0a8e6481e4d1a740a79f63fc3c0063_l3.png" height="19" width="413" class="ql-img-displayed-equation quicklatex-auto-format" alt="&#92;&#91;&#100;&#112;&#91;&#105;&#93;&#91;&#106;&#93;&#32;&#61;&#32;&#109;&#105;&#110;&#40;&#100;&#112;&#91;&#105;&#45;&#49;&#93;&#91;&#106;&#93;&#44;&#32;&#100;&#112;&#91;&#105;&#93;&#91;&#106;&#45;&#49;&#93;&#41;&#32;&#43;&#32;&#103;&#114;&#105;&#100;&#115;&#91;&#105;&#93;&#91;&#106;&#93;&#92;&#93;" title="Rendered by QuickLaTeX.com"/></p></p>

<p class="wp-block-paragraph">解法示例：</p>

<pre class="EnlighterJSRAW" data-enlighter-language="python" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">def minPathSum(self, grid: List[List[int]]) -> int:
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
        
    return dp[M-1][N-1]</pre>

<p class="wp-block-paragraph">实际上，上面的解法在空间上还有优化的空间，可以参考下面的“滚动数组”优化方法。</p>

<h3 class="wp-block-heading"> 背包模型 </h3>

<h4 class="wp-block-heading"><strong>0/1背包</strong></h4>

<p class="wp-block-paragraph"><strong>模型说明：</strong>有 <img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-199d2a4bb55c19e6701e7ee9d5d521d2_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#78;" title="Rendered by QuickLaTeX.com" height="12" width="17" style="vertical-align: 0px;"/> 种物品（每种物品1件）和一个容量为 <img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-a05dff8cfbcebcbb5621fa4f9a30aef9_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#86;" title="Rendered by QuickLaTeX.com" height="12" width="14" style="vertical-align: 0px;"/> 的背包。放入第 <img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-299289f085d0706bdefa9bbba17ee7ec_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#105;" title="Rendered by QuickLaTeX.com" height="12" width="6" style="vertical-align: 0px;"/> 种物品耗费的空间是 <img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-00e0d34d2b0dc8a5c7764fcaaa63d67c_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#67;&#95;&#105;" title="Rendered by QuickLaTeX.com" height="15" width="18" style="vertical-align: -3px;"/> ，得到的价值是 <img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-71c7912fe93924a8b5d21c8178cb4d2f_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#87;&#95;&#105;" title="Rendered by QuickLaTeX.com" height="15" width="22" style="vertical-align: -3px;"/> 。求解将哪些物品装入背包可使价值总和最大。</p>

<p class="wp-block-paragraph"><strong>解法：</strong><img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-0b8e61eee72453ac1e9dc75fe5ed24ad_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#102;&#91;&#105;&#93;&#91;&#118;&#93;" title="Rendered by QuickLaTeX.com" height="18" width="46" style="vertical-align: -5px;"/> 表示前i种物品恰好放入一个容量为 <img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-0f15bf9890d84cc08ba40ee32c63a091_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#118;" title="Rendered by QuickLaTeX.com" height="8" width="9" style="vertical-align: 0px;"/> 的背包可以获得的最大价值。决策为第 <img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-299289f085d0706bdefa9bbba17ee7ec_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#105;" title="Rendered by QuickLaTeX.com" height="12" width="6" style="vertical-align: 0px;"/> 个物品在前 <img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-28d95ccec7d5dada83b9a1dbc8b0332d_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#105;&#45;&#49;" title="Rendered by QuickLaTeX.com" height="13" width="37" style="vertical-align: -1px;"/> 个物品放置完毕后，是选择放还是不放，状态转移方程为：</p>

<p class="wp-block-paragraph"><p class="ql-center-displayed-equation" style="line-height: 19px;"><span class="ql-right-eqno"> &nbsp; </span><span class="ql-left-eqno"> &nbsp; </span><img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-8534c95431bf8508b9412cabe243e285_l3.png" height="19" width="382" class="ql-img-displayed-equation quicklatex-auto-format" alt="&#92;&#91;&#102;&#91;&#105;&#93;&#91;&#118;&#93;&#32;&#61;&#32;&#109;&#97;&#120;&#40;&#102;&#91;&#105;&#45;&#49;&#93;&#91;&#118;&#93;&#44;&#32;&#102;&#91;&#105;&#45;&#49;&#93;&#91;&#118;&#32;&#45;&#32;&#67;&#95;&#105;&#93;&#32;&#43;&#87;&#95;&#105;&#41;&#92;&#93;" title="Rendered by QuickLaTeX.com"/></p></p>

<p class="wp-block-paragraph">时间复杂度 <img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-edaadc60edb5498f3b8ee88c324133ea_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#79;&#40;&#118;&#110;&#41;" title="Rendered by QuickLaTeX.com" height="18" width="49" style="vertical-align: -4px;"/>，空间复杂度 <img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-edaadc60edb5498f3b8ee88c324133ea_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#79;&#40;&#118;&#110;&#41;" title="Rendered by QuickLaTeX.com" height="18" width="49" style="vertical-align: -4px;"/>，空间复杂度可利用滚动数组进行优化达到 <img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-22d0d8ebf6dfac2dc362e53ba28daf17_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#79;&#40;&#118;&#41;" title="Rendered by QuickLaTeX.com" height="18" width="38" style="vertical-align: -4px;"/>，下文会提到。</p>

<ul class="wp-block-list">
<li><strong>把数组分为2个和相同的子集：</strong>Given a non-empty array containing only positive integers, find if the array can be partitioned into two subsets such that the sum of elements in both subsets is equal. <a href="https://leetcode.com/problems/partition-equal-subset-sum/" target="_blank" rel="noopener">链接</a></li>
</ul>

<h4 class="wp-block-heading">完全背包</h4>

<p class="wp-block-paragraph"><strong>模型说明：</strong>有 <img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-199d2a4bb55c19e6701e7ee9d5d521d2_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#78;" title="Rendered by QuickLaTeX.com" height="12" width="17" style="vertical-align: 0px;"/> 种物品（每种物品无限件）和一个容量为 <img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-a05dff8cfbcebcbb5621fa4f9a30aef9_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#86;" title="Rendered by QuickLaTeX.com" height="12" width="14" style="vertical-align: 0px;"/> 的背包。放入第 <img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-299289f085d0706bdefa9bbba17ee7ec_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#105;" title="Rendered by QuickLaTeX.com" height="12" width="6" style="vertical-align: 0px;"/> 种物品耗费的空间是 <img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-00e0d34d2b0dc8a5c7764fcaaa63d67c_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#67;&#95;&#105;" title="Rendered by QuickLaTeX.com" height="15" width="18" style="vertical-align: -3px;"/> ，得到的价值是 <img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-71c7912fe93924a8b5d21c8178cb4d2f_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#87;&#95;&#105;" title="Rendered by QuickLaTeX.com" height="15" width="22" style="vertical-align: -3px;"/> 。求解将哪些物品装入背包可使价值总和最大。</p>

<p class="wp-block-paragraph"><strong>解法：</strong><img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-0b8e61eee72453ac1e9dc75fe5ed24ad_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#102;&#91;&#105;&#93;&#91;&#118;&#93;" title="Rendered by QuickLaTeX.com" height="18" width="46" style="vertical-align: -5px;"/> 表示前 <img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-299289f085d0706bdefa9bbba17ee7ec_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#105;" title="Rendered by QuickLaTeX.com" height="12" width="6" style="vertical-align: 0px;"/> 种物品恰好放入一个容量为 <img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-0f15bf9890d84cc08ba40ee32c63a091_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#118;" title="Rendered by QuickLaTeX.com" height="8" width="9" style="vertical-align: 0px;"/> 的背包可以获得的最大价值。状态转移方程为：</p>

<p class="wp-block-paragraph"><p class="ql-center-displayed-equation" style="line-height: 19px;"><span class="ql-right-eqno"> &nbsp; </span><span class="ql-left-eqno"> &nbsp; </span><img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-8f883557015b93b8d6e24b76d807d15f_l3.png" height="19" width="461" class="ql-img-displayed-equation quicklatex-auto-format" alt="&#92;&#91;&#102;&#91;&#105;&#93;&#91;&#118;&#93;&#32;&#61;&#32;&#109;&#97;&#120;&#40;&#102;&#91;&#105;&#45;&#49;&#93;&#91;&#118;&#32;&#45;&#32;&#107;&#67;&#95;&#105;&#93;&#32;&#43;&#32;&#107;&#87;&#105;&#32;&#32;&#124;&#32;&#48;&#32;&#60;&#61;&#32;&#107;&#32;&#60;&#61;&#32;&#118;&#47;&#67;&#105;&#41;&#92;&#93;" title="Rendered by QuickLaTeX.com"/></p></p>

<p class="wp-block-paragraph">当 <img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-5db73187d4a7cb6e507d89d84266dd6d_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#107;" title="Rendered by QuickLaTeX.com" height="13" width="9" style="vertical-align: 0px;"/> 的取值为0，1时，这就是0/1背包的状态转移方程。时间复杂度 <img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-a63e57546b5135302bb5f6ceddcdb194_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#79;&#40;&#32;&#118;&#110;&#42;&#115;&#117;&#109;&#40;&#86;&#47;&#67;&#95;&#105;&#41;&#32;&#41;" title="Rendered by QuickLaTeX.com" height="19" width="159" style="vertical-align: -5px;"/> ，空间复杂度在用滚动数组优化后可以达到 <img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-22d0d8ebf6dfac2dc362e53ba28daf17_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#79;&#40;&#118;&#41;" title="Rendered by QuickLaTeX.com" height="18" width="38" style="vertical-align: -4px;"/> 。进行优化后，状态转移方程变成：</p>

<p class="wp-block-paragraph"><p class="ql-center-displayed-equation" style="line-height: 19px;"><span class="ql-right-eqno"> &nbsp; </span><span class="ql-left-eqno"> &nbsp; </span><img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-8d648ebdb2309620374d0ec01cf3d5b9_l3.png" height="19" width="350" class="ql-img-displayed-equation quicklatex-auto-format" alt="&#92;&#91;&#102;&#91;&#105;&#93;&#91;&#118;&#93;&#32;&#61;&#32;&#109;&#97;&#120;&#40;&#102;&#91;&#105;&#45;&#49;&#93;&#91;&#118;&#93;&#44;&#32;&#32;&#102;&#91;&#105;&#93;&#91;&#118;&#32;&#45;&#32;&#67;&#95;&#105;&#93;&#32;&#43;&#87;&#95;&#105;&#41;&#92;&#93;" title="Rendered by QuickLaTeX.com"/></p></p>

<p class="wp-block-paragraph">时间复杂度降为 <img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-edaadc60edb5498f3b8ee88c324133ea_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#79;&#40;&#118;&#110;&#41;" title="Rendered by QuickLaTeX.com" height="18" width="49" style="vertical-align: -4px;"/>。</p>

<ul class="wp-block-list">
<li><strong>单词拆分：</strong>Given a non-empty string s and a dictionary wordDict containing a list of non-empty words, determine if s can be segmented into a space-separated sequence of one or more dictionary words. <a href="https://leetcode.com/problems/word-break/" target="_blank" rel="noopener">链接</a></li>

<li><strong>求和：</strong>Given an integer array with all positive numbers and no duplicates, find the number of possible combinations that add up to a positive integer target. <a href="https://leetcode.com/problems/combination-sum-iv/" target="_blank" rel="noopener">链接</a></li>
</ul>

<h4 class="wp-block-heading">多重背包</h4>

<p class="wp-block-paragraph"><strong>模型说明：</strong>有 <img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-199d2a4bb55c19e6701e7ee9d5d521d2_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#78;" title="Rendered by QuickLaTeX.com" height="12" width="17" style="vertical-align: 0px;"/> 种物品（每种物品Mi件）和一个容量为 <img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-a05dff8cfbcebcbb5621fa4f9a30aef9_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#86;" title="Rendered by QuickLaTeX.com" height="12" width="14" style="vertical-align: 0px;"/> 的背包。放入第 <img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-299289f085d0706bdefa9bbba17ee7ec_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#105;" title="Rendered by QuickLaTeX.com" height="12" width="6" style="vertical-align: 0px;"/> 种物品耗费的空间是 <img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-00e0d34d2b0dc8a5c7764fcaaa63d67c_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#67;&#95;&#105;" title="Rendered by QuickLaTeX.com" height="15" width="18" style="vertical-align: -3px;"/> ，得到的价值是 <img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-71c7912fe93924a8b5d21c8178cb4d2f_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#87;&#95;&#105;" title="Rendered by QuickLaTeX.com" height="15" width="22" style="vertical-align: -3px;"/> 。求解将哪些物品装入背包可使价值总和最大。</p>

<p class="wp-block-paragraph"><strong>解法：</strong><img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-0b8e61eee72453ac1e9dc75fe5ed24ad_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#102;&#91;&#105;&#93;&#91;&#118;&#93;" title="Rendered by QuickLaTeX.com" height="18" width="46" style="vertical-align: -5px;"/> 表示前i种物品恰好放入一个容量为<img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-0f15bf9890d84cc08ba40ee32c63a091_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#118;" title="Rendered by QuickLaTeX.com" height="8" width="9" style="vertical-align: 0px;"/> 的背包可以获得的最大价值。</p>

<p class="wp-block-paragraph"><p class="ql-center-displayed-equation" style="line-height: 19px;"><span class="ql-right-eqno"> &nbsp; </span><span class="ql-left-eqno"> &nbsp; </span><img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-cef6e6d7409ca09e5ccd5a7b2c1ba60c_l3.png" height="19" width="442" class="ql-img-displayed-equation quicklatex-auto-format" alt="&#92;&#91;&#102;&#91;&#105;&#93;&#91;&#118;&#93;&#32;&#61;&#32;&#109;&#97;&#120;&#40;&#102;&#91;&#105;&#45;&#49;&#93;&#91;&#118;&#32;&#45;&#32;&#107;&#67;&#95;&#105;&#93;&#32;&#43;&#32;&#107;&#87;&#95;&#105;&#32;&#32;&#124;&#32;&#48;&#32;&#60;&#61;&#32;&#107;&#32;&#60;&#61;&#32;&#77;&#95;&#105;&#41;&#92;&#93;" title="Rendered by QuickLaTeX.com"/></p></p>

<p class="wp-block-paragraph">时间复杂度 <img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-5b1160823f1021af06733abe1def1f47_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#79;&#40;&#32;&#118;&#42;&#115;&#117;&#109;&#40;&#77;&#95;&#105;&#41;&#41;" title="Rendered by QuickLaTeX.com" height="18" width="130" style="vertical-align: -4px;"/> ，空间复杂度仍然可以用滚动数组优化后可以达到 <img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-22d0d8ebf6dfac2dc362e53ba28daf17_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#79;&#40;&#118;&#41;" title="Rendered by QuickLaTeX.com" height="18" width="38" style="vertical-align: -4px;"/> 。</p>

<p class="wp-block-paragraph"><strong>优化：</strong>采用二进制拆分物品，将Mi个物品拆分成容量为 <img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-1d99d94983d6f3c2c384a61362bcf1cf_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#49;&#44;&#32;&#50;&#44;&#32;&#52;&#44;&#32;&#56;&#44;&#32;&#46;&#46;&#46;&#46;&#46;&#46;&#44;&#32;&#50;&#94;&#123;&#107;&#125;&#44;&#32;&#77;&#105;&#45;&#40;&#32;&#50;&#94;&#123;&#107;&#43;&#49;&#125;&#32;&#45;&#32;&#49;&#32;&#41;" title="Rendered by QuickLaTeX.com" height="20" width="268" style="vertical-align: -4px;"/> 个对应价值为<img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-c1f83eafa247fae46e1987f7b21832d3_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#87;&#95;&#105;&#44;&#32;&#50;&#87;&#95;&#105;&#44;&#32;&#52;&#87;&#95;&#105;&#44;&#32;&#56;&#87;&#95;&#105;&#44;&#32;&#46;&#46;&#46;&#46;&#46;&#46;&#44;&#32;&#50;&#94;&#123;&#107;&#125;&#87;&#95;&#105;&#44;&#32;&#40;&#77;&#95;&#105;&#45;&#40;&#32;&#50;&#94;&#123;&#107;&#43;&#49;&#125;&#32;&#45;&#32;&#49;&#32;&#41;&#41;&#87;&#95;&#105;" title="Rendered by QuickLaTeX.com" height="20" width="412" style="vertical-align: -4px;"/> 的物品，然后采用0/1背包求解。这样做的时间复杂度降为 <img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-07c6350f1553410f29eb51ad6d0d83e7_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#79;&#40;&#118;&#42;&#115;&#117;&#109;&#40;&#108;&#111;&#103;&#77;&#95;&#105;&#41;&#41;" title="Rendered by QuickLaTeX.com" height="18" width="155" style="vertical-align: -4px;"/> 。这样的拆分方式在<a href="https://leetcode.com/problems/powx-n/" target="_blank" rel="noopener">链接</a>这条题目里也有所运用。</p>

<ul class="wp-block-list">
<li><strong>0和1：</strong>In the computer world, use restricted resource you have to generate maximum benefit is what we always want to pursue. For now, suppose you are a dominator of m 0s and n 1s respectively. On the other hand, there is an array with strings consisting of only 0s and 1s.  Now your task is to find the maximum number of strings that you can form with given m 0s and n 1s. Each 0 and 1 can be used at most once. <a href="https://leetcode.com/problems/ones-and-zeroes/" target="_blank" rel="noopener">链接</a></li>

<li><strong>求和：</strong>Given a collection of candidate numbers (candidates) and a target number (target), find all unique combinations in candidates where the candidate numbers sums to target. <a href="https://leetcode.com/problems/combination-sum-ii/" target="_blank" rel="noopener">链接</a></li>
</ul>

<h3 class="wp-block-heading"> 状态压缩模型 </h3>

<p class="wp-block-paragraph">状态压缩的动态规划，一般处理的是数据规模较小的问题，将状态压缩成k进制的整数，k取2时最为常见。</p>

<p class="wp-block-paragraph">未在 LeetCode 中做到对应类型的题目。</p>

<h3 class="wp-block-heading"> 树状模型</h3>

<p class="wp-block-paragraph">树形动态规划（树形DP），是指状态图是一棵树，状态转移也发生在树上，父结点的值通过所有子结点计算完毕后得出。</p>

<p class="wp-block-paragraph">因为树本身的数据结构的限制，一方面，我们得到的是顶点，而不是叶子节点的集合；另一方面，基本的树结构只能从父节点获取子节点，而不能从子节点得到父节点。</p>

<p class="wp-block-paragraph">这两个特点决定了树状的动态规划问题自底向上的求解是比较困难的，进而就投向了深度遍历的怀抱。类似于前面的“记忆化搜索”。</p>

<p class="wp-block-paragraph"><strong>二叉树布控： </strong>Given a binary tree, we install cameras on the nodes of the tree.  Each camera at&nbsp;a node can monitor&nbsp;its parent, itself, and its immediate children. Calculate the minimum number of cameras needed to monitor all nodes of the tree. <a href="https://leetcode.com/problems/binary-tree-cameras/" target="_blank" rel="noopener">链接</a></p>

<p class="wp-block-paragraph">通过给每个节点一个状态标记来实现状态的转移，以及所需要的摄像头的数量记录。</p>

<pre class="EnlighterJSRAW" data-enlighter-language="python" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group=""># Definition for a binary tree node.
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
        
        return self.sum</pre>

<p class="wp-block-paragraph">当然，并不是涉及到树结构的动态规划问题就是树状模型。例如：</p>

<p class="wp-block-paragraph">叶子节点最小开销：Given an array arr of positive integers, consider all binary trees such that: Each node has either 0 or 2 children; The values of arr correspond to the values of each leaf in an in-order traversal of the tree.  (Recall that a node is a leaf if and only if it has 0 children.) The value of each non-leaf node is equal to the product of the largest leaf value in its left and right subtree respectively. Among all possible binary trees considered, return the smallest possible sum of the values of each non-leaf node. <a href="https://leetcode.com/problems/minimum-cost-tree-from-leaf-values/" target="_blank" rel="noopener">链接</a></p>

<hr class="wp-block-separator has-css-opacity"/>

<h2 class="wp-block-heading">动态规划的常用状态转移方程</h2>

<p class="wp-block-paragraph">原作者参考自《算法艺术与信息学竞赛》。动态规划算法三要素：</p>

<ul class="wp-block-list">
<li>所有不同的子问题组成的表</li>

<li>解决问题的依赖关系可以看成是一个图</li>

<li>填充子问题的顺序（即对②的图进行拓扑排序，填充的过程称为状态转移）</li>
</ul>

<p class="wp-block-paragraph">不过到目前位置碰到的题目都是基于数组实现的状态转移，还没有碰见真正的需要基于图来实现的状态转移。</p>

<figure class="wp-block-image"><img loading="lazy" decoding="async" width="763" height="459" src="/wp-content/uploads/2019/09/algorithm-1-1.png" alt="" class="wp-image-459" srcset="/wp-content/uploads/2019/09/algorithm-1-1.png 763w, /wp-content/uploads/2019/09/algorithm-1-1-300x180.png 300w" sizes="auto, (max-width: 763px) 100vw, 763px" /></figure>

<figure class="wp-block-image"><img loading="lazy" decoding="async" width="754" height="93" src="/wp-content/uploads/2019/09/algorithm-1-2.png" alt="" class="wp-image-460" srcset="/wp-content/uploads/2019/09/algorithm-1-2.png 754w, /wp-content/uploads/2019/09/algorithm-1-2-300x37.png 300w" sizes="auto, (max-width: 754px) 100vw, 754px" /></figure>

<p class="wp-block-paragraph">以上为原书的内容。原书中归纳的4中状态转移方程并不能完全理解，我还是结合例子来看吧。</p>

<hr class="wp-block-separator has-css-opacity"/>

<h2 class="wp-block-heading">动态规划和数据结构结合的常用优化</h2>

<h3 class="wp-block-heading">滚动数组</h3>

<p class="wp-block-paragraph">本来是将这道例题放在“最优化原理和最优子结构”章里面的，但是仔细看了下我自己的解法和别人提供的解法之后，发现发现问题并不是我的状态和转移方程选取的不够好，而是我没有对算法所需的空间进行优化。</p>

<p class="wp-block-paragraph"><strong>不同的子串：</strong>Given a string S and a string T, count the number of distinct subsequences of S which equals T. A subsequence of a string is a new string which is formed from the original string by deleting some (can be none) of the characters without disturbing the relative positions of the remaining characters. (ie, &#8220;ACE&#8221; is a subsequence of &#8220;ABCDE&#8221; while &#8220;AEC&#8221; is not). <a href="https://leetcode.com/problems/distinct-subsequences/" target="_blank" rel="noopener">链接</a></p>

<p class="wp-block-paragraph">输入的是两个字符串，<em>S</em> 和 <em>T</em>，所以很自然的想到利用一个二维数组 <em>dp</em>，<em>dp[i][j]</em> 代表 <em>S[0:i]</em> 和 <em>T[0:j]</em> 对于本题的解。解法如下：</p>

<pre class="EnlighterJSRAW" data-enlighter-language="python" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">def numDistinct(self, s, t):
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
    
    return dp[-1][-1]</pre>

<p class="wp-block-paragraph">但是实际上，在计算 <em>dp[i+1][j+1]</em> 时，只用到了 <em>dp[i+1][j] </em>和 <em>dp[i][j]</em>，因此实际上只需要用一个一维数组就可以完成算法。</p>

<pre class="EnlighterJSRAW" data-enlighter-language="python" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">def numDistinct(self, s: str, t: str) -> int:
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
    
    return dp[-1]</pre>

<h3 class="wp-block-heading">最长单调子序列的二分优化</h3>

<p class="wp-block-paragraph">同样是上面“最优化原理和最优子结构”章节的例题，</p>

<p class="wp-block-paragraph"><strong>最长单调子序列：</strong>Given an unsorted array of integers, find the length of longest increasing subsequence. <a href="https://leetcode.com/problems/longest-increasing-subsequence/" target="_blank" rel="noopener">链接</a></p>

<p class="wp-block-paragraph">状态是截至到当前位置的题解，状态转移方式就是判断前面的数，看看当前的数接到后面是否满足单调增。所以首先要遍历一遍，对于第 <em>i</em> 个数，遍历前 <em>i-1</em> 个，如果其中的第 j 个满足 <em>Array[i] &gt; Array[j]</em>，则 <em>dp[i] = MAX(dp[i], dp[j]+1)</em>。解决了，时间复杂度 <img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-252de2ecdc38fc02b970f287778ceb76_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#79;&#40;&#110;&#94;&#123;&#50;&#125;&#41;" title="Rendered by QuickLaTeX.com" height="20" width="48" style="vertical-align: -4px;"/>。</p>

<pre class="EnlighterJSRAW" data-enlighter-language="java" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">public int lengthOfLIS(int[] nums) {
	if(nums.length &lt;= 1) 
		return nums.length;

	// 记录最长子串长度
	int T[] = new int[nums.length];

	// Fill each position with value 1 in the array
	for(int i=0; i &lt; nums.length; i++)
		T[i] = 1;

	// Mark one pointer at i. For each i, start from j=0.
	for(int i=1; i &lt; nums.length; i++) {
		for(int j=0; j &lt; i; j++) {
			// It means next number contributes to increasing sequence.
			if(nums[j] &lt; nums[i]) {
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
	for(int i=0; i &lt; T.length; i++)
		longest = Math.max(longest, T[i]);

	return longest;
}</pre>

<p class="wp-block-paragraph">但实际上还有更快的解决方法，时间复杂度为 <img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-bca0c5741b018206bf7dc717c864e9f0_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#79;&#40;&#110;&#108;&#111;&#103;&#110;&#41;" title="Rendered by QuickLaTeX.com" height="18" width="75" style="vertical-align: -4px;"/>。状态是长度为 N 的单调子序列的最后的一个值，状态转移方式是 <em>dp[position(num)] = num</em>。这样就保证了对于第 i 个数，前 i 个的解是单调增的，这是我们就不需要再通过遍历寻找需要插入的位置了，直接通过二叉搜索。于是时间复杂度就优化到了 <img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-bca0c5741b018206bf7dc717c864e9f0_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#79;&#40;&#110;&#108;&#111;&#103;&#110;&#41;" title="Rendered by QuickLaTeX.com" height="18" width="75" style="vertical-align: -4px;"/>。</p>

<pre class="EnlighterJSRAW" data-enlighter-language="python" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">def lengthOfLIS(self, nums):
    tails = [0] * len(nums)
    size = 0
    for x in nums:
        i, j = 0, size
        while i != j:
            m = (i + j) / 2
            if tails[m] &lt; x:
                i = m + 1
            else:
                j = m
        tails[i] = x
        size = max(i + 1, size)
    return size</pre>

<h3 class="wp-block-heading">其他优化</h3>

<p class="wp-block-paragraph">暂未接触到相关的问题，遇到后再补充。</p>

<hr class="wp-block-separator has-css-opacity"/>

<h2 class="wp-block-heading">解题记录</h2>

<h3 class="wp-block-heading">完美平方数</h3>

<p class="wp-block-paragraph">Given a positive integer n, find the least number of perfect square numbers (for example, 1, 4, 9, 16, …) which sum to n. <a href="https://leetcode.com/problems/perfect-squares/" target="_blank" rel="noopener">链接</a></p>

<p class="wp-block-paragraph"> 和“记忆化搜索”章节以及“线性模型”章节中的“找零钱”示例类似，不过这里的零钱是一系列的平方数。这个问题的转移方程为 <img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-a696a7677954248c047de185e6666a13_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#100;&#112;&#40;&#105;&#41;&#32;&#61;&#32;&#109;&#105;&#110;&#40;&#100;&#112;&#40;&#105;&#45;&#110;&#41;&#41;&#32;&#43;&#32;&#49;&#44;&#32;&#110;&#32;&#92;&#105;&#110;&#32;&#40;&#49;&#44;&#32;&#52;&#44;&#32;&#57;&#44;&#32;&#49;&#54;&#44;&#32;&#46;&#46;&#46;&#46;&#46;&#46;&#41;" title="Rendered by QuickLaTeX.com" height="18" width="388" style="vertical-align: -4px;"/>。参考解法：</p>

<pre class="EnlighterJSRAW" data-enlighter-language="java" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">class Solution {
    public int numSquares(int n) {
        int[] dp = new int[n + 1];
        Arrays.fill(dp, Integer.MAX_VALUE);
        for (int i = 0; i * i &lt;= n; i++){
            dp[i * i] = 1;
        }
        for (int i = 1; i &lt;= n; i++){
            for (int j = 1; j * j &lt;= i; j++){
                dp[i] = Math.min(dp[i], dp[i - j * j] + 1);
            }
        }
        return dp[n];
    }
}</pre>

<p class="wp-block-paragraph">这条题目不难。但如果需要达到更优的效果，就需要借助数学知识了。根据<a href="https://baike.baidu.com/item/%E5%9B%9B%E5%B9%B3%E6%96%B9%E5%92%8C%E5%AE%9A%E7%90%86/4507832" target="_blank" rel="noopener">四平方和定理</a>，每个正整数均可表示为4个整数的平方和（其中有些数可能是0）。如果一个数可以整除4，那么这个数和这个数除以4以后的数，可以被同样个数的平方和表示。如果一个数除以8余7，那这个数只能用4个数的平方和表示。</p>

<pre class="EnlighterJSRAW" data-enlighter-language="java" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">class Solution {
    public int numSquares(int n){
        while (n % 4 == 0){
            n = n/4;
        }
        // 4个的情况
        if (n % 8 == 7){
            return 4;
        }
        // 1或2个的情况
        for (int i = 0; i * i &lt;= n; i++){
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
}</pre>

<h3 class="wp-block-heading">公式求和</h3>

<p class="wp-block-paragraph">You are given a list of non-negative integers, a1, a2, …, an, and a target, S. Now you have 2 symbols + and -. For each integer, you should choose one from + and &#8211; as its new symbol. Find out how many ways to assign symbols to make sum of integers equal to target S. <a href="https://leetcode.com/problems/target-sum/" target="_blank" rel="noopener">链接</a></p>

<p class="wp-block-paragraph">类似于24点游戏，不过这里只能用加和减。最暴力的方法就是罗列出所有的加减搭配方法，但是效率不允许。当然，不能从运算符的角度角度去遍历，我们可以从前 N 个数的计算结果可能值下手。同时，在 N 增长的过程中，去除一些“跑偏”的结果。解法示例：</p>

<pre class="EnlighterJSRAW" data-enlighter-language="generic" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">def findTargetSumWays(self, nums, S):
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
            if not pos-num_sum &lt;= S &lt;= pos+num_sum:
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
        return 0</pre>

<p class="wp-block-paragraph">上面的思路实际上是广度遍历。如果非要从运算符的角度去考虑问题呢？本题只有加和减两种运算符，那么可以这样来考虑，把给定的数组 A 中的数字分配到 M 和 N 两个数组中，使得 sum(M) &#8211; sum(N) == S 。M表示符号为 + 的数字，而 N 表示符号为 &#8211; 的数字。变换一下公式，即可得到，符号为 &#8211; 的数字与最终结果 S 构成的数组，数组之和应该等于符号为 + 的数字构成的数组。</p>

<p class="wp-block-paragraph">例如：输入数组是 [2, 5, 6, 8]，期望运算结果是7。那么 -2-5+6+8=7 是一组解。也就是 sum(2, 5, 7) == sum(6, 8) 。那么问题就变成了如何将一个数组拆分为2组和相同的子数组。也就是上文提到的“背包模型”的“0/1背包”。解法示例：</p>

<pre class="EnlighterJSRAW" data-enlighter-language="java" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">class Solution {
    public int findTargetSumWays(int[] nums, int s) {
        int sum = 0;
        for (int n : nums)
            sum += n;
        return sum &lt; s || (s + sum) % 2 > 0 ? 0 : subsetSum(nums, (s + sum) >>> 1); 
    }   

    public int subsetSum(int[] nums, int s) {
        int[] dp = new int[s + 1]; 
        dp[0] = 1;
        for (int n : nums)
            for (int i = s; i >= n; i--)
                dp[i] += dp[i - n]; 
        return dp[s];
    } 
}</pre>

<hr class="wp-block-separator has-css-opacity"/>

<h2 class="wp-block-heading">参考链接 </h2>

<ul class="wp-block-list">
<li><a href="http://www.cppblog.com/menjitianya/archive/2015/10/23/212084.html" target="_blank" rel="noopener">http://www.cppblog.com/menjitianya/archive/2015/10/23/212084.html</a></li>

<li><a href="https://oi-wiki.org/dp/" target="_blank" rel="noopener">https://oi-wiki.org/dp/</a></li>

<li><a href="https://www.1point3acres.com/bbs/forum.php?mod=viewthread&amp;tid=542696" target="_blank" rel="noopener">https://www.1point3acres.com/bbs/forum.php?mod=viewthread&amp;tid=542696</a></li>
</ul>
