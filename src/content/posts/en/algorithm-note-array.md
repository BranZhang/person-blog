---
title: "Algorithm Notes: Arrays"
description: "Patterns for array problems, including numeric operations, two pointers, traversal, and in-place transformations."
pubDatetime: 2018-11-22T14:41:16.000Z
modDatetime: 2023-01-03T09:56:22.000Z
draft: false
hiddenLocales: ["zh-cn"]
tags: ["LeetCode", "Two Pointers", "Arrays", "Algorithms"]
---

Array problems are difficult to classify because few involve arrays alone. Numeric computation and two-pointer techniques are the most array-specific categories, while searching and sorting are broader topics.

---

## Numeric Computation

### N-sum Problems

Given an array, find N values whose sum equals—or is closest to—a target. Examples include:

- [Two Sum](https://leetcode.com/problems/two-sum/)
- [3Sum](https://leetcode.com/problems/3sum/)
- [4Sum](https://leetcode.com/problems/4sum/)
- [Combination Sum](https://leetcode.com/problems/combination-sum/)

For 1-sum, a linear scan is sufficient.

For 2-sum, iterate over each value $a$ and ask whether the remaining subarray contains a solution to 1-sum with target $N-a$. This describes the unsorted case; a sorted array supports the more efficient two-pointer method below.

Likewise, 3-sum fixes one value $a$ and solves 2-sum for $N-a$ in the remaining suffix.

The pattern generalizes recursively. This 4-sum implementation reduces the problem through `findNsum` until it reaches a two-pointer 2-sum base case.

```python
def fourSum(self, nums: List[int], target: int) -> List[List[int]]:
    nums.sort()
    results = []
    self.findNsum(nums, target, 4, [], results)
    return results

def findNsum(self, nums, target, N, result, results):
    if len(nums) < N or N < 2:
        return
    # Solve the 2-sum base case with two pointers.
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
    # Otherwise, fix one value and reduce N.
    else:
        for i in range(0, len(nums)-N+1):
            if target < nums[i]*N or target > nums[-1]*N:
                          break
            if i == 0 or i > 0 and nums[i-1] != nums[i]:
                self.findNsum(nums[i+1:], target-nums[i], N-1, result+[nums[i]], results)
    return
```

Another family performs repeated range-sum queries, extending naturally from one dimension to two or more:

- [Range Sum Query – Immutable](https://leetcode.com/problems/range-sum-query-immutable/)
- [Range Sum Query 2D – Immutable](https://leetcode.com/problems/range-sum-query-2d-immutable/)

LeetCode classifies these as simple dynamic-programming problems.

Precompute prefix sums. A query over $[p,q]$ is then answered by subtracting the prefix before $p$ from the prefix through $q$.

### Median

See [Median of Two Sorted Arrays](https://leetcode.com/problems/median-of-two-sorted-arrays/), which requires logarithmic time.

The solution below follows [an O(log(min(m,n))) explanation](<https://leetcode.com/problems/median-of-two-sorted-arrays/discuss/2481/Share-my-O(log(min(mn)))-solution-with-explanation>).

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
            # i is too small; increase it.
            imin = i + 1
        elif i > 0 and A[i-1] > B[j]:
            # i is too large; decrease it.
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

### Extrema

Finding an extreme element is often a search problem; optimizing a value derived from several array elements often requires dynamic programming.

Search-based examples:

- [Find Minimum in Rotated Sorted Array](https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/)
- [Find Peak Element](https://leetcode.com/problems/find-peak-element/)

Dynamic-programming examples:

- [Maximum Length of Repeated Subarray](https://leetcode.com/problems/maximum-length-of-repeated-subarray/)
- [Maximum Sum of 3 Non-overlapping Subarrays](https://leetcode.com/problems/maximum-sum-of-3-non-overlapping-subarrays/)

### Majority Elements

- [Majority Element](https://leetcode.com/problems/majority-element/): frequency greater than ⌊n/2⌋.
- [Majority Element II](https://leetcode.com/problems/majority-element-ii/): frequency greater than ⌊n/3⌋.

A frequency table solves the basic form, although the second problem's time and space constraints motivate the Boyer–Moore voting generalization.

---

## Two Pointers

The two-pointer technique places cursors at opposite ends of an array and advances one or the other according to the invariant until they meet or find a solution. The N-sum implementation above already uses it.

- [Minimum Size Subarray Sum](https://leetcode.com/problems/minimum-size-subarray-sum/)
- [Sort Colors](https://leetcode.com/problems/sort-colors/)
- [Container With Most Water](https://leetcode.com/problems/container-with-most-water/)
- [Trapping Rain Water](https://leetcode.com/problems/trapping-rain-water/)

Trapping Rain Water resembles the GIS [sink-filling algorithm](https://pro.arcgis.com/en/pro-app/tool-reference/spatial-analyst/how-fill-works.htm) used in hydrologic DEM preprocessing.

Sort Colors is the [Dutch national flag problem](https://en.wikipedia.org/wiki/Dutch_national_flag_problem):

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

Trapping Rain Water uses cursors at the left and right boundaries. Move inward from the side with the lower running maximum:

- If the new bar is lower than that maximum, the difference is trapped water.
- If it is higher, update the running maximum.

Implementation:

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

## Ordering and Partitioning

Array-ordering problems extend beyond implementing sort algorithms. They include lexicographic permutations and partitioning an array into independently sortable chunks.

Lexicographic array problems often translate directly to strings.

- [Next Permutation](https://leetcode.com/problems/next-permutation/)
- [Max Chunks to Make Sorted](https://leetcode.com/problems/max-chunks-to-make-sorted/) and [version II](https://leetcode.com/problems/max-chunks-to-make-sorted-ii/)

For the second problem, a boundary after index $i$ is valid when the maximum value on the left is no greater than the minimum value on the right:

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

## Searching

Most search problems on ordered arrays reduce to binary search.

- [Find Minimum in Rotated Sorted Array](https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/)
- [Search a 2D Matrix](https://leetcode.com/problems/search-a-2d-matrix/)
- [Search in Rotated Sorted Array](https://leetcode.com/problems/search-in-rotated-sorted-array/)

In Search a 2D Matrix, every row is sorted and the first column orders the rows. Binary-search the first column to select a candidate row, then binary-search within that row.

Example:

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

    # First select a row from the first column.
    col = [matrix[i][0] for i in range(len(matrix))]
    rowid = binsearch(col,target)

    # Then search within that row.
    colid = binsearch(matrix[rowid], target)

    return matrix[rowid][colid] == target
```

---

## Other Problems

Several useful problems do not fit the categories above:

- [First Missing Positive](https://leetcode.com/problems/first-missing-positive/)
- [Merge Intervals](https://leetcode.com/problems/merge-intervals/)
- [Insert Interval](https://leetcode.com/problems/insert-interval/)

First Missing Positive can map existing positive integers to array indices, making the missing value discoverable in a second pass.

The interval problems replace scalar values with ranges and rely on ordered search and careful merging.

---
