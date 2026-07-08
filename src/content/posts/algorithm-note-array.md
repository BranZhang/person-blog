---
title: "算法笔记——数组"
description: "数组类的题目不大好整理，应为只涉及到数组的问题不多。其中数值计算，Two Pointers是与数组关联度最大的2个分类；搜索，排序与数组关联度并不大。"
pubDatetime: 2018-11-22T14:41:16.000Z
modDatetime: 2023-01-03T09:56:22.000Z
author: "Zhang"
tags:
  - "leetcode"
  - "Two Pointers"
  - "数组"
  - "算法"
canonicalURL: "https://littlepotato.me/2018/11/22/algorithm-note-array/"
---

<p class="wp-block-paragraph">数组类的题目不大好整理，应为只涉及到数组的问题不多。其中数值计算，Two Pointers是与数组关联度最大的2个分类；搜索，排序与数组关联度并不大。</p>

<!--more-->

<hr class="wp-block-separator has-css-opacity"/>

<h2 class="wp-block-heading">数值计算</h2>

<h3 class="wp-block-heading">求和</h3>

<p class="wp-block-paragraph">求和类的题目主要是这样的形式：给定一个数组，找出其中N个数，使得N个数的和等于某定值。或者是N个数的和最接近某个定值。比如：</p>

<ul class="wp-block-list">
<li><strong>2数之和等于定值</strong>：Given an array of integers, return&nbsp;indices&nbsp;of the two numbers such that they add up to a specific target. <a href="https://leetcode.com/problems/two-sum/" target="_blank" rel="noopener">链接</a> </li>

<li><strong>3数之和等于定值</strong>：Given an array&nbsp;nums&nbsp;of&nbsp;<em>n</em>&nbsp;integers, are there elements&nbsp;<em>a</em>,&nbsp;<em>b</em>,&nbsp;<em>c</em>&nbsp;in&nbsp;nums&nbsp;such that&nbsp;<em>a</em>&nbsp;+&nbsp;<em>b</em>&nbsp;+&nbsp;<em>c</em>&nbsp;= 0? Find all unique triplets in the array which gives the sum of zero. <a href="https://leetcode.com/problems/3sum/" target="_blank" rel="noopener">链接</a></li>

<li><strong>4数之和等于定值</strong>：Given an array&nbsp;nums&nbsp;of&nbsp;<em>n</em>&nbsp;integers and an integer&nbsp;target are there elements&nbsp;<em>a</em>,&nbsp;<em>b</em>,&nbsp;<em>c</em>, and&nbsp;<em>d</em>in&nbsp;nums&nbsp;such that&nbsp;<em>a</em>&nbsp;+&nbsp;<em>b</em>&nbsp;+&nbsp;<em>c</em>&nbsp;+&nbsp;<em>d</em>&nbsp;=&nbsp;target? Find all unique quadruplets in the array which gives the sum of&nbsp;target <a href="https://leetcode.com/problems/4sum/" target="_blank" rel="noopener">链接</a></li>

<li><strong>任意数量之和等于定值</strong>：Given a&nbsp;set&nbsp;of candidate numbers (candidates)&nbsp;(without duplicates)&nbsp;and a target number (target), find all unique combinations in&nbsp;candidates&nbsp;where the candidate numbers sums to&nbsp;target. <a href="https://leetcode.com/problems/combination-sum/" target="_blank" rel="noopener">链接</a></li>
</ul>

<p class="wp-block-paragraph">还有些与上述问题类似的，不再罗列。</p>

<p class="wp-block-paragraph">先考虑一个简单的问题，如果问题是1数之和等于定值如何处理？简单的遍历一遍即可。</p>

<p class="wp-block-paragraph">那2数之和呢？同样是遍历一遍，在遍历过程中，假设当前值为<em> a </em>，判断在当前值之前或者之后的子数组中，是否存在“ 1数之和等于 <em>N-a</em>”这样的问题的解。<em>（这里有个前提条件，数组未排序。数组如果已排序，则“Two Pointers”效率更高，参考下文）</em></p>

<p class="wp-block-paragraph">同样的，对于“以3数之和等于定值”这个问题，遍历一遍，在遍历过程中，假设当前值为<em> a </em>，判断在当前值之前或者之后的子数组中，是否存在“2数之和等于 <em>N-a</em>”这样的问题的解。</p>

<p class="wp-block-paragraph">依次类推。下面是“4数之和等于定值”的一个解法，其中递归调用“findNsum”方法，就是按照上面的逻辑，不断的简化问题。</p>

<pre class="EnlighterJSRAW" data-enlighter-language="python" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">def fourSum(self, nums: List[int], target: int) -> List[List[int]]:
    nums.sort()
    results = []
    self.findNsum(nums, target, 4, [], results)
    return results
    
def findNsum(self, nums, target, N, result, results):
    if len(nums) &lt; N or N &lt; 2:
        return
    # 如果是求取2数之和等于target，则使用“Two Pointers”求解
    if N == 2:
        l,r = 0,len(nums)-1
        while l &lt; r:
            if nums[l] + nums[r] == target:
                results.append(result + [nums[l], nums[r]])
                l += 1
                r -= 1
                while l &lt; r and nums[l] == nums[l - 1]:
                    l += 1
                while r > l and nums[r] == nums[r + 1]:
                    r -= 1
            elif nums[l] + nums[r] &lt; target:
                l += 1
            else:
                r -= 1
    # 否则，遍历数组，继续简化问题
    else:
        for i in range(0, len(nums)-N+1):
            if target &lt; nums[i]*N or target > nums[-1]*N:
                          break
            if i == 0 or i > 0 and nums[i-1] != nums[i]:
                self.findNsum(nums[i+1:], target-nums[i], N-1, result+[nums[i]], results)
    return</pre>

<p class="wp-block-paragraph">还有一种类型是给定一个数组，多次求取其中指定区间的数值之和，这样的问题可以从一维拓展到二维，甚至是更高维。比如：</p>

<ul class="wp-block-list">
<li><strong>给定一维数组，根据指定区间求和</strong>：Given an integer array&nbsp;<em>nums</em>, find the sum of the elements between indices&nbsp;<em>i</em>&nbsp;and&nbsp;<em>j</em>&nbsp;(<em>i</em>&nbsp;≤&nbsp;<em>j</em>), inclusive. <a rel="noreferrer noopener" aria-label=" (opens in a new tab)" href="https://leetcode.com/problems/range-sum-query-immutable/" target="_blank">链接</a></li>

<li><strong>问题延申到二维</strong>：Given a 2D matrix&nbsp;<em>matrix</em>, find the sum of the elements inside the rectangle defined by its upper left corner (<em>row</em>1,&nbsp;<em>col</em>1) and lower right corner (<em>row</em>2,&nbsp;<em>col</em>2). <a href="https://leetcode.com/problems/range-sum-query-2d-immutable/" target="_blank" rel="noreferrer noopener" aria-label=" (opens in a new tab)">链接</a></li>
</ul>

<p class="wp-block-paragraph">LeetCode将上面的问题划分成了动态规划问题，可以算是一种简单的DP问题吧。</p>

<p class="wp-block-paragraph">对于这类问题的求解方法就是，预先计算好所有的前 N 个数值之和，当需要计算 <em>p</em> 到 <em>q</em> 之间的值时，直接用前 <em>q</em> 个之和减去前 <em>p</em> 个即可。</p>

<h3 class="wp-block-heading">中位数</h3>

<p class="wp-block-paragraph"><strong>计算2个已排序的数组的中位数：</strong>There are two sorted arrays nums1 and nums2 of size m and n respectively. Find the median of the two sorted arrays. The overall run time complexity should be O(log (m+n)). <a href="https://leetcode.com/problems/median-of-two-sorted-arrays/" target="_blank" rel="noopener">链接</a></p>

<p class="wp-block-paragraph">参考解法，来自<a href="https://leetcode.com/problems/median-of-two-sorted-arrays/discuss/2481/Share-my-O(log(min(mn)))-solution-with-explanation" target="_blank" rel="noopener">《Share my O(log(min(m,n))) solution with explanation》</a>。</p>

<pre class="EnlighterJSRAW" data-enlighter-language="python" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">def median(A, B):
    m, n = len(A), len(B)
    if m > n:
        A, B, m, n = B, A, n, m
    if n == 0:
        raise ValueError

    imin, imax, half_len = 0, m, (m + n + 1) / 2
    while imin &lt;= imax:
        i = (imin + imax) / 2
        j = half_len - i
        if i &lt; m and B[j-1] > A[i]:
            # i 的值太小， 增加它
            imin = i + 1
        elif i > 0 and A[i-1] > B[j]:
            # i 的值过大， 减小它
            imax = i - 1
        else:
            # i is perfect

            if i == 0: max_of_left = B[j-1]
            elif j == 0: max_of_left = A[i-1]
            else: max_of_left = max(A[i-1], B[j-1])

            if (m + n) % 2 == 1:
                return max_of_left

            if i == m: min_of_right = B[j]
            elif j == n: min_of_right = A[i]
            else: min_of_right = min(A[i], B[j])

            return (max_of_left + min_of_right) / 2.0</pre>

<h3 class="wp-block-heading">极值</h3>

<p class="wp-block-paragraph">极值的寻找通常是一个搜索的过程，关于数组的搜索下文会提到；而涉及到数组中多个数计算出来的极值，往往会用到动态规划。</p>

<p class="wp-block-paragraph">通过搜索解决的极值寻找：</p>

<ul class="wp-block-list">
<li><strong>求排序后但部分被反转的数组的最小值：</strong>Suppose an array sorted in ascending order is rotated at some pivot unknown to you beforehand. Find the minimum element. <a href="https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/" target="_blank" rel="noopener">链接</a></li>

<li><strong>求数组的极大值：</strong>Given an input array nums, where nums[i] ≠ nums[i+1], find a peak element and return its index. <a href="https://leetcode.com/problems/find-peak-element/" target="_blank" rel="noopener">链接</a></li>
</ul>

<p class="wp-block-paragraph">通过动态规划解决的极值寻找：</p>

<ul class="wp-block-list">
<li><strong>寻找2个数组的最长公共子串：</strong>Given two integer arrays A and B, return the maximum length of an subarray that appears in both arrays. <a href="https://leetcode.com/problems/maximum-length-of-repeated-subarray/" target="_blank" rel="noopener">链接</a></li>

<li><strong>找出数组中3个不重叠的长度为k的子串，使得和最大：</strong>In a given array nums of positive integers, find three non-overlapping subarrays with maximum sum.Each subarray will be of size k, and we want to maximize the sum of all 3*k entries. <a href="https://leetcode.com/problems/maximum-sum-of-3-non-overlapping-subarrays/" target="_blank" rel="noopener">链接</a></li>
</ul>

<h3 class="wp-block-heading">众数</h3>

<ul class="wp-block-list">
<li><strong>找出数组中出现频率超过 1/2 的数：</strong>Given an array of size n, find the majority element. The majority element is the element that appears more than ⌊ n/2 ⌋ times. <a href="https://leetcode.com/problems/majority-element/" target="_blank" rel="noopener">链接</a></li>

<li><strong>找出数组中出现频率超过 1/3 的数：</strong>Given an integer array of size n, find all elements that appear more than ⌊ n/3 ⌋ times. <a href="https://leetcode.com/problems/majority-element-ii/" target="_blank" rel="noopener">链接</a></li>
</ul>

<p class="wp-block-paragraph">通过遍历，统计一遍数字出现的次数即可。对于第二题，需要注意时间复杂度与空间复杂度的限制。</p>

<hr class="wp-block-separator has-css-opacity"/>

<h2 class="wp-block-heading">Two Pointers</h2>

<p class="wp-block-paragraph">九章算法里叫两根指针，感觉不够准确。这个算法简单来说就是声明2个指针，分别指向数组的头尾，根据想要达到的条件，不断的调整头指针和尾指针的位置，最终要么2个指针碰头而无解，要么找到解。这个算法在上面的求和中已经用到了。</p>

<ul class="wp-block-list">
<li><strong>求数组中最短的连续子集，使得和大于等于定值：</strong>Given an array of n positive integers and a positive integer s, find the minimal length of a contiguous subarray of which the sum ≥ s. If there isn&#8217;t one, return 0 instead. <a href="https://leetcode.com/problems/minimum-size-subarray-sum/" target="_blank" rel="noopener">链接</a></li>

<li><strong>原地对只有3种值的数组进行排序：</strong>Given an array with n objects colored red, white or blue, sort them in-place so that objects of the same color are adjacent, with the colors in the order red, white and blue. <a href="https://leetcode.com/problems/sort-colors/" target="_blank" rel="noopener">链接</a></li>

<li><strong>选出数组中的2个值，使得它们与X轴构成的矩形面积最大：</strong>Given n non-negative integers a1, a2, …, an , where each represents a point at coordinate (i, ai). n vertical lines are drawn such that the two endpoints of line i is at (i, ai) and (i, 0). Find two lines, which together with x-axis forms a container, such that the container contains the most water. <a href="https://leetcode.com/problems/container-with-most-water/" target="_blank" rel="noopener">链接</a></li>

<li><strong>柱状图储水：</strong>Given n non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it is able to trap after raining. <a href="https://leetcode.com/problems/trapping-rain-water/" target="_blank" rel="noopener">链接</a></li>
</ul>

<p class="wp-block-paragraph">柱状图储水这个问题和GIS领域的<a href="https://pro.arcgis.com/en/pro-app/tool-reference/spatial-analyst/how-fill-works.htm" target="_blank" rel="noopener">“填洼”算法</a>很像。</p>

<p class="wp-block-paragraph">“3种值的数组进行排序”这个问题，实际上是<a href="https://en.wikipedia.org/wiki/Dutch_national_flag_problem" target="_blank" rel="noopener">“Dutch national flag problem”</a>。解法示例：</p>

<pre class="EnlighterJSRAW" data-enlighter-language="python" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">def sortColors(self, nums):
    red, white, blue = 0, 0, len(nums)-1
    
    while white &lt;= blue:
        if nums[white] == 0:
            nums[red], nums[white] = nums[white], nums[red]
            white += 1
            red += 1
        elif nums[white] == 1:
            white += 1
        else:
            nums[white], nums[blue] = nums[blue], nums[white]
            blue -= 1</pre>

<p class="wp-block-paragraph">对于“柱状图储水”问题，需要声明2个指针，分别位于最左和最优。指向较小的指针向中间移动一格，</p>

<ul class="wp-block-list">
<li> 如果移动后的位置比刚刚旁边的矮一点，则说明这里可以储水，且能储存和刚刚移过来的那一格一样高的水。 </li>

<li>如果移动后的位置比刚刚旁边的高一点，则把这个高值记录下来，没法储水。</li>
</ul>

<p class="wp-block-paragraph">算法实现如下：</p>

<pre class="EnlighterJSRAW" data-enlighter-language="python" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">def trap(self, height):
    """
    :type height: List[int]
    :rtype: int
    """
    leftCursor, rightCursor = 0, len(height)-1
    leftMax, rightMax, storedWater = 0, 0, 0
    
    while (leftCursor &lt;= rightCursor):
        leftMax = max(leftMax, height[leftCursor])
        rightMax = max(rightMax, height[rightCursor])
        if leftMax &lt; rightMax:
            storedWater += leftMax - height[leftCursor]
            leftCursor += 1
        else:
            storedWater += rightMax - height[rightCursor]
            rightCursor -= 1
                
    return storedWater</pre>

<hr class="wp-block-separator has-css-opacity"/>

<h2 class="wp-block-heading">排序</h2>

<p class="wp-block-paragraph">数组的排序问题并不是单纯的指数字之间的排序，更多的是数组间的排序，例如下面第一题的数组的字典序，第二题的切分数组，逆序后再合并，要求使得数组变为有序。</p>

<p class="wp-block-paragraph">数组排序问题有时候也可以视为字符串的排序问题。例如下面的第一题，把数组换成字符串毫无影响。</p>

<ul class="wp-block-list">
<li><strong>计算数组中元素的下一个字典排序：</strong>Implement next permutation, which rearranges numbers into the lexicographically next greater permutation of numbers. <a href="https://leetcode.com/problems/next-permutation/" target="_blank" rel="noopener">链接</a></li>

<li><strong>求解最多可将数组分为几块，使得每块逆序后再合并为一个数组，数组是升序排列的：</strong>Given an array arr that is a permutation of [0, 1, …, arr.length &#8211; 1], we split the array into some number of &#8220;chunks&#8221; (partitions), and individually sort each chunk.  After concatenating them, the result equals the sorted array. <a href="https://leetcode.com/problems/max-chunks-to-make-sorted/" target="_blank" rel="noopener">链接1</a>，<a href="https://leetcode.com/problems/max-chunks-to-make-sorted-ii/" target="_blank" rel="noopener">链接2</a></li>
</ul>

<p class="wp-block-paragraph">对于第二题，一个连续的子集可以成为一个小块的必要条件是：连续的子集必须是降序的；连续的子集的左边数必须要小于自己，右边的数必须要大于自己。解法实例：</p>

<pre class="EnlighterJSRAW" data-enlighter-language="java" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">class Solution {
    public int maxChunksToSorted(int[] arr) {
        int n = arr.length;
        int[] maxOfLeft = new int[n];
        int[] minOfRight = new int[n];

        maxOfLeft[0] = arr[0];
        for (int i = 1; i &lt; n; i++) {
            maxOfLeft[i] = Math.max(maxOfLeft[i-1], arr[i]);
        }

        minOfRight[n - 1] = arr[n - 1];
        for (int i = n - 2; i >= 0; i--) {
            minOfRight[i] = Math.min(minOfRight[i + 1], arr[i]);
        }

        int res = 0;
        for (int i = 0; i &lt; n - 1; i++) {
            if (maxOfLeft[i] &lt;= minOfRight[i + 1]) res++;
        }

        return res + 1;
    }
}</pre>

<hr class="wp-block-separator has-css-opacity"/>

<h2 class="wp-block-heading">搜索</h2>

<p class="wp-block-paragraph">数组的搜索，绝大多数是二分法搜索。</p>

<ul class="wp-block-list">
<li><strong>求排序后但部分被反转的数组的最小值：</strong>Suppose an array sorted in ascending order is rotated at some pivot unknown to you beforehand. Find the minimum element. <a href="https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/" target="_blank" rel="noopener">链接</a></li>

<li><strong>对每行单独排序的二维数组进行搜索：</strong>Write an efficient algorithm that searches for a value in an&nbsp;<em>m</em>&nbsp;x&nbsp;<em>n</em>&nbsp;matrix. <a href="https://leetcode.com/problems/search-a-2d-matrix/" target="_blank" rel="noopener">链接</a></li>

<li><strong>对排序后但部分被反转的数组进行搜索：</strong>Suppose an array sorted in ascending order is rotated at some pivot unknown to you beforehand. <a href="https://leetcode.com/problems/search-in-rotated-sorted-array/" target="_blank" rel="noopener">链接</a></li>
</ul>

<p class="wp-block-paragraph">以“对每行单独排序的二维数组进行搜索”这题为例，输入的二维数组的每行都是排序了的，数组的第一列也是排序了的。所以，想要判断一个数是否在这样的数组中存在，首先需要在第一列中使用二分法搜索，找到数据可能存在于某一行。再在这一行中使用二分法搜索，判断这个值是否存在于这一行中。</p>

<p class="wp-block-paragraph">解法示例：</p>

<pre class="EnlighterJSRAW" data-enlighter-language="python" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">def searchMatrix(self, matrix: List[List[int]], target: int) -> bool:
    
    def binsearch(nums,target):
        lo, hi = 0, len(nums)-1
        while lo&lt;=hi:
            mi = (lo+hi)//2
            if target == nums[mi]:
                return mi
            elif target &lt; nums[mi]:
                hi = mi - 1
            else:
                lo = mi + 1
        return lo - 1
    
    if len(matrix) == 0 or len(matrix[0]) == 0:
        return False

    # 先在第一列中搜索
    col = [matrix[i][0] for i in range(len(matrix))]
    rowid = binsearch(col,target)

    # 再在某一行中搜索
    colid = binsearch(matrix[rowid], target)
    
    return matrix[rowid][colid] == target</pre>

<hr class="wp-block-separator has-css-opacity"/>

<h2 class="wp-block-heading">其他</h2>

<p class="wp-block-paragraph">除了以上的问题类型，还有些题目暂时不太好归类，但确实也比较有趣。</p>

<ul class="wp-block-list">
<li>找出最小的且不在给定的数组中的正整数：Given an unsorted integer array, find the smallest missing positive integer. <a href="https://leetcode.com/problems/first-missing-positive/" target="_blank" rel="noopener">链接</a></li>

<li>将重叠的区段合并：Given a collection of intervals, merge all overlapping intervals. <a href="https://leetcode.com/problems/merge-intervals/" target="_blank" rel="noopener">链接</a></li>

<li>&nbsp;将一个新的区段插入到数组中，并合并：Given a set of non-overlapping intervals, insert a new interval into the intervals (merge if necessary). <a href="https://leetcode.com/problems/insert-interval/" target="_blank" rel="noopener">链接</a></li>
</ul>

<p class="wp-block-paragraph">对于第一题，考虑通过将数组中已有的正整数与数组的下标对应。这样通过第2次遍历即可知道缺少的最小的正整数。</p>

<p class="wp-block-paragraph">二，三两题都是用数值区间来代替数字，用好二分法查找和递归。</p>

<hr class="wp-block-separator has-css-opacity"/>
