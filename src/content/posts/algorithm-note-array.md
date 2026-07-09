---
title: "算法笔记——数组"
description: "数组类的题目不大好整理，应为只涉及到数组的问题不多。其中数值计算，Two Pointers是与数组关联度最大的2个分类；搜索，排序与数组关联度并不大。"
pubDatetime: 2018-11-22T14:41:16.000Z
modDatetime: 2023-01-03T09:56:22.000Z
draft: false
tags: ["leetcode","Two Pointers","数组","算法"]
---

数组类的题目不大好整理，应为只涉及到数组的问题不多。其中数值计算，Two Pointers是与数组关联度最大的2个分类；搜索，排序与数组关联度并不大。

---

## 数值计算

### 求和

求和类的题目主要是这样的形式：给定一个数组，找出其中N个数，使得N个数的和等于某定值。或者是N个数的和最接近某个定值。比如：

- **2数之和等于定值**：Given an array of integers, return indices of the two numbers such that they add up to a specific target. [链接](https://leetcode.com/problems/two-sum/)
- **3数之和等于定值**：Given an array nums of *n* integers, are there elements *a*, *b*, *c* in nums such that *a* + *b* + *c* = 0? Find all unique triplets in the array which gives the sum of zero. [链接](https://leetcode.com/problems/3sum/)
- **4数之和等于定值**：Given an array nums of *n* integers and an integer target are there elements *a*, *b*, *c*, and *d*in nums such that *a* + *b* + *c* + *d* = target? Find all unique quadruplets in the array which gives the sum of target [链接](https://leetcode.com/problems/4sum/)
- **任意数量之和等于定值**：Given a set of candidate numbers (candidates) (without duplicates) and a target number (target), find all unique combinations in candidates where the candidate numbers sums to target. [链接](https://leetcode.com/problems/combination-sum/)

还有些与上述问题类似的，不再罗列。

先考虑一个简单的问题，如果问题是1数之和等于定值如何处理？简单的遍历一遍即可。

那2数之和呢？同样是遍历一遍，在遍历过程中，假设当前值为* a *，判断在当前值之前或者之后的子数组中，是否存在“ 1数之和等于 *N-a*”这样的问题的解。*（这里有个前提条件，数组未排序。数组如果已排序，则“Two Pointers”效率更高，参考下文）*

同样的，对于“以3数之和等于定值”这个问题，遍历一遍，在遍历过程中，假设当前值为* a *，判断在当前值之前或者之后的子数组中，是否存在“2数之和等于 *N-a*”这样的问题的解。

依次类推。下面是“4数之和等于定值”的一个解法，其中递归调用“findNsum”方法，就是按照上面的逻辑，不断的简化问题。

```python
def fourSum(self, nums: List[int], target: int) -> List[List[int]]:
    nums.sort()
    results = []
    self.findNsum(nums, target, 4, [], results)
    return results
    
def findNsum(self, nums, target, N, result, results):
    if len(nums) < N or N < 2:
        return
    # 如果是求取2数之和等于target，则使用“Two Pointers”求解
    if N == 2:
        l,r = 0,len(nums)-1
        while l < r:
            if nums[l] + nums[r] == target:
                results.append(result + [nums[l], nums[r]])
                l += 1
                r -= 1
                while l < r and nums[l] == nums[l - 1]:
                    l += 1
                while r > l and nums[r] == nums[r + 1]:
                    r -= 1
            elif nums[l] + nums[r] < target:
                l += 1
            else:
                r -= 1
    # 否则，遍历数组，继续简化问题
    else:
        for i in range(0, len(nums)-N+1):
            if target < nums[i]*N or target > nums[-1]*N:
                          break
            if i == 0 or i > 0 and nums[i-1] != nums[i]:
                self.findNsum(nums[i+1:], target-nums[i], N-1, result+[nums[i]], results)
    return
```

还有一种类型是给定一个数组，多次求取其中指定区间的数值之和，这样的问题可以从一维拓展到二维，甚至是更高维。比如：

- **给定一维数组，根据指定区间求和**：Given an integer array *nums*, find the sum of the elements between indices *i* and *j* (*i* ≤ *j*), inclusive. [链接](https://leetcode.com/problems/range-sum-query-immutable/)
- **问题延申到二维**：Given a 2D matrix *matrix*, find the sum of the elements inside the rectangle defined by its upper left corner (*row*1, *col*1) and lower right corner (*row*2, *col*2). [链接](https://leetcode.com/problems/range-sum-query-2d-immutable/)

LeetCode将上面的问题划分成了动态规划问题，可以算是一种简单的DP问题吧。

对于这类问题的求解方法就是，预先计算好所有的前 N 个数值之和，当需要计算 *p* 到 *q* 之间的值时，直接用前 *q* 个之和减去前 *p* 个即可。

### 中位数

**计算2个已排序的数组的中位数：**There are two sorted arrays nums1 and nums2 of size m and n respectively. Find the median of the two sorted arrays. The overall run time complexity should be O(log (m+n)). [链接](https://leetcode.com/problems/median-of-two-sorted-arrays/)

参考解法，来自[《Share my O(log(min(m,n))) solution with explanation》](https://leetcode.com/problems/median-of-two-sorted-arrays/discuss/2481/Share-my-O(log(min(mn)))-solution-with-explanation)。

```python
def median(A, B):
    m, n = len(A), len(B)
    if m > n:
        A, B, m, n = B, A, n, m
    if n == 0:
        raise ValueError

    imin, imax, half_len = 0, m, (m + n + 1) / 2
    while imin <= imax:
        i = (imin + imax) / 2
        j = half_len - i
        if i < m and B[j-1] > A[i]:
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

            return (max_of_left + min_of_right) / 2.0
```

### 极值

极值的寻找通常是一个搜索的过程，关于数组的搜索下文会提到；而涉及到数组中多个数计算出来的极值，往往会用到动态规划。

通过搜索解决的极值寻找：

- **求排序后但部分被反转的数组的最小值：**Suppose an array sorted in ascending order is rotated at some pivot unknown to you beforehand. Find the minimum element. [链接](https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/)
- **求数组的极大值：**Given an input array nums, where nums[i] ≠ nums[i+1], find a peak element and return its index. [链接](https://leetcode.com/problems/find-peak-element/)

通过动态规划解决的极值寻找：

- **寻找2个数组的最长公共子串：**Given two integer arrays A and B, return the maximum length of an subarray that appears in both arrays. [链接](https://leetcode.com/problems/maximum-length-of-repeated-subarray/)
- **找出数组中3个不重叠的长度为k的子串，使得和最大：**In a given array nums of positive integers, find three non-overlapping subarrays with maximum sum.Each subarray will be of size k, and we want to maximize the sum of all 3*k entries. [链接](https://leetcode.com/problems/maximum-sum-of-3-non-overlapping-subarrays/)

### 众数

- **找出数组中出现频率超过 1/2 的数：**Given an array of size n, find the majority element. The majority element is the element that appears more than ⌊ n/2 ⌋ times. [链接](https://leetcode.com/problems/majority-element/)
- **找出数组中出现频率超过 1/3 的数：**Given an integer array of size n, find all elements that appear more than ⌊ n/3 ⌋ times. [链接](https://leetcode.com/problems/majority-element-ii/)

通过遍历，统计一遍数字出现的次数即可。对于第二题，需要注意时间复杂度与空间复杂度的限制。

---

## Two Pointers

九章算法里叫两根指针，感觉不够准确。这个算法简单来说就是声明2个指针，分别指向数组的头尾，根据想要达到的条件，不断的调整头指针和尾指针的位置，最终要么2个指针碰头而无解，要么找到解。这个算法在上面的求和中已经用到了。

- **求数组中最短的连续子集，使得和大于等于定值：**Given an array of n positive integers and a positive integer s, find the minimal length of a contiguous subarray of which the sum ≥ s. If there isn’t one, return 0 instead. [链接](https://leetcode.com/problems/minimum-size-subarray-sum/)
- **原地对只有3种值的数组进行排序：**Given an array with n objects colored red, white or blue, sort them in-place so that objects of the same color are adjacent, with the colors in the order red, white and blue. [链接](https://leetcode.com/problems/sort-colors/)
- **选出数组中的2个值，使得它们与X轴构成的矩形面积最大：**Given n non-negative integers a1, a2, …, an , where each represents a point at coordinate (i, ai). n vertical lines are drawn such that the two endpoints of line i is at (i, ai) and (i, 0). Find two lines, which together with x-axis forms a container, such that the container contains the most water. [链接](https://leetcode.com/problems/container-with-most-water/)
- **柱状图储水：**Given n non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it is able to trap after raining. [链接](https://leetcode.com/problems/trapping-rain-water/)

柱状图储水这个问题和GIS领域的[“填洼”算法](https://pro.arcgis.com/en/pro-app/tool-reference/spatial-analyst/how-fill-works.htm)很像。

“3种值的数组进行排序”这个问题，实际上是[“Dutch national flag problem”](https://en.wikipedia.org/wiki/Dutch_national_flag_problem)。解法示例：

```python
def sortColors(self, nums):
    red, white, blue = 0, 0, len(nums)-1
    
    while white <= blue:
        if nums[white] == 0:
            nums[red], nums[white] = nums[white], nums[red]
            white += 1
            red += 1
        elif nums[white] == 1:
            white += 1
        else:
            nums[white], nums[blue] = nums[blue], nums[white]
            blue -= 1
```

对于“柱状图储水”问题，需要声明2个指针，分别位于最左和最优。指向较小的指针向中间移动一格，

- 如果移动后的位置比刚刚旁边的矮一点，则说明这里可以储水，且能储存和刚刚移过来的那一格一样高的水。
- 如果移动后的位置比刚刚旁边的高一点，则把这个高值记录下来，没法储水。

算法实现如下：

```python
def trap(self, height):
    """
    :type height: List[int]
    :rtype: int
    """
    leftCursor, rightCursor = 0, len(height)-1
    leftMax, rightMax, storedWater = 0, 0, 0
    
    while (leftCursor <= rightCursor):
        leftMax = max(leftMax, height[leftCursor])
        rightMax = max(rightMax, height[rightCursor])
        if leftMax < rightMax:
            storedWater += leftMax - height[leftCursor]
            leftCursor += 1
        else:
            storedWater += rightMax - height[rightCursor]
            rightCursor -= 1
                
    return storedWater
```

---

## 排序

数组的排序问题并不是单纯的指数字之间的排序，更多的是数组间的排序，例如下面第一题的数组的字典序，第二题的切分数组，逆序后再合并，要求使得数组变为有序。

数组排序问题有时候也可以视为字符串的排序问题。例如下面的第一题，把数组换成字符串毫无影响。

- **计算数组中元素的下一个字典排序：**Implement next permutation, which rearranges numbers into the lexicographically next greater permutation of numbers. [链接](https://leetcode.com/problems/next-permutation/)
- **求解最多可将数组分为几块，使得每块逆序后再合并为一个数组，数组是升序排列的：**Given an array arr that is a permutation of [0, 1, …, arr.length – 1], we split the array into some number of “chunks” (partitions), and individually sort each chunk. After concatenating them, the result equals the sorted array. [链接1](https://leetcode.com/problems/max-chunks-to-make-sorted/)，[链接2](https://leetcode.com/problems/max-chunks-to-make-sorted-ii/)

对于第二题，一个连续的子集可以成为一个小块的必要条件是：连续的子集必须是降序的；连续的子集的左边数必须要小于自己，右边的数必须要大于自己。解法实例：

```java
class Solution {
    public int maxChunksToSorted(int[] arr) {
        int n = arr.length;
        int[] maxOfLeft = new int[n];
        int[] minOfRight = new int[n];

        maxOfLeft[0] = arr[0];
        for (int i = 1; i < n; i++) {
            maxOfLeft[i] = Math.max(maxOfLeft[i-1], arr[i]);
        }

        minOfRight[n - 1] = arr[n - 1];
        for (int i = n - 2; i >= 0; i--) {
            minOfRight[i] = Math.min(minOfRight[i + 1], arr[i]);
        }

        int res = 0;
        for (int i = 0; i < n - 1; i++) {
            if (maxOfLeft[i] <= minOfRight[i + 1]) res++;
        }

        return res + 1;
    }
}
```

---

## 搜索

数组的搜索，绝大多数是二分法搜索。

- **求排序后但部分被反转的数组的最小值：**Suppose an array sorted in ascending order is rotated at some pivot unknown to you beforehand. Find the minimum element. [链接](https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/)
- **对每行单独排序的二维数组进行搜索：**Write an efficient algorithm that searches for a value in an *m* x *n* matrix. [链接](https://leetcode.com/problems/search-a-2d-matrix/)
- **对排序后但部分被反转的数组进行搜索：**Suppose an array sorted in ascending order is rotated at some pivot unknown to you beforehand. [链接](https://leetcode.com/problems/search-in-rotated-sorted-array/)

以“对每行单独排序的二维数组进行搜索”这题为例，输入的二维数组的每行都是排序了的，数组的第一列也是排序了的。所以，想要判断一个数是否在这样的数组中存在，首先需要在第一列中使用二分法搜索，找到数据可能存在于某一行。再在这一行中使用二分法搜索，判断这个值是否存在于这一行中。

解法示例：

```python
def searchMatrix(self, matrix: List[List[int]], target: int) -> bool:
    
    def binsearch(nums,target):
        lo, hi = 0, len(nums)-1
        while lo<=hi:
            mi = (lo+hi)//2
            if target == nums[mi]:
                return mi
            elif target < nums[mi]:
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
    
    return matrix[rowid][colid] == target
```

---

## 其他

除了以上的问题类型，还有些题目暂时不太好归类，但确实也比较有趣。

- 找出最小的且不在给定的数组中的正整数：Given an unsorted integer array, find the smallest missing positive integer. [链接](https://leetcode.com/problems/first-missing-positive/)
- 将重叠的区段合并：Given a collection of intervals, merge all overlapping intervals. [链接](https://leetcode.com/problems/merge-intervals/)
- 将一个新的区段插入到数组中，并合并：Given a set of non-overlapping intervals, insert a new interval into the intervals (merge if necessary). [链接](https://leetcode.com/problems/insert-interval/)

对于第一题，考虑通过将数组中已有的正整数与数组的下标对应。这样通过第2次遍历即可知道缺少的最小的正整数。

二，三两题都是用数值区间来代替数字，用好二分法查找和递归。

---
