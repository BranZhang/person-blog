---
title: "Poor pigs"
description: "Aren't we all just poor pigs? Touch too many sensitive words, and you might not survive either."
pubDatetime: 2021-01-14T16:50:20.000Z
modDatetime: 2025-03-02T09:19:49.000Z
draft: false
hiddenLocales: ["zh-cn"]
tags: ["LeetCode", "Information Theory", "Algorithms"]
---

Starting from a LeetCode problem, this article explores several extensions and uses content moderation as a real-world analogy.

**Aside 1:** While writing, I saw an unverified joke about a Chinese phrase whose cross-word character pair accidentally matched a blocked political abbreviation.

**Aside 2:** On LeetCode's Chinese site, the word “poison” itself appeared to be filtered in some solution text.

![](../../../assets/content-images/uploads/2021/01/image.png "Is 'poison' itself a sensitive word?")

## The Original Problem

### Statement

In [458. Poor Pigs](https://leetcode.com/problems/poor-pigs/):

There are `buckets` visually identical buckets, exactly one of which contains poison. Pigs can sample selected buckets, and their survival states must identify the poisoned bucket within `minutesToTest`.

The rules are:

- Choose any live pigs for a test round.
- A pig may sample any number of buckets, with feeding treated as instantaneous.
- Wait `minutesToDie` before using surviving pigs again.
- Pigs that sampled poison die; all others survive.
- Repeat until the test window expires.

Return the minimum number of pigs needed to identify the bucket.

### Solution

#### Mathematical Derivation

The solution reduces to a counting formula. With `minutesToTest = 60` and `minutesToDie = 15`:

1. A pig can participate in `times = minutesToTest / minutesToDie = 4` rounds.
2. Its observable outcome has `base = times + 1 = 5` states: death after round 1, 2, 3, or 4, or survival through all rounds. One pig can therefore distinguish five buckets.
3. Two pigs encode `base² = 25` joint states.
4. In general, `base^answer ≥ buckets`, so `answer = ceil(log(buckets) / log(base))`.

Implementation:

```java
public int poorPigs(int buckets, int minutesToDie, int minutesToTest) {
    int times = minutesToTest / minutesToDie;
    int base = times + 1;
    double temp = Math.log(buckets) / Math.log(base);
    int ans = (int)Math.ceil(temp)
    return ans;
}
```

#### Dynamic-programming View

The dynamic-programming formulation has three ingredients:

1. A table of distinct subproblems
2. A dependency graph between them
3. A topological evaluation order, expressed through state transitions

Following [Turn dynamic programming into mathematical formula](https://leetcode.com/problems/poor-pigs/discuss/94307/Turn-dynamic-programming-into-mathematical-formula):

**Subproblem:** `dp(n,t)` is the number of buckets distinguishable with `n` pigs and `t = minutesToTest / minutesToDie` rounds.

**Dependency:** In the first round, group buckets by how many of the `n` pigs sample them.

- If all `n` pigs sample a bucket and die, that outcome can identify one such bucket.
- If `n-k` pigs sample a poisoned bucket, `k` pigs and `t-1` rounds remain, supporting `C(n,k) × dp(k,t-1)` buckets in that group.
- The case in which no pig samples the bucket leaves all `n` pigs for `t-1` rounds.

Thus `dp(n,t) = Σ C(n,k) × dp(k,t-1)`.

Evaluate by increasing round count and then pig count.

The recurrence simplifies to the same closed-form counting formula.

#### Information-theory View

> With equally likely outcomes, identifying one of `buckets` possibilities requires `log(buckets)` information. Each pig contributes `log(states)`, so the required number is their ratio rounded up.
>
> — [https://leetcode-cn.com/problems/poor-pigs/solution/jing-dian-xin-xi-lun-ti-mu-by-pi-xie-wang-bei-luo/](https://leetcode-cn.com/problems/poor-pigs/solution/jing-dian-xin-xi-lun-ti-mu-by-pi-xie-wang-bei-luo/)

The implementation is therefore:

```cpp
int poorPigs(int buckets, int minutesToDie, int minutesToTest) {
    int states = minutesToTest / minutesToDie + 1;
    return ceil(log(buckets) / log(states));
}
```

## Extensions

### Multiple Poisoned Buckets

How many pigs are required if two, or an unknown number of, buckets are poisoned?

An analogous problem appears in black-box content moderation: given N candidate terms, a fixed review delay, and accounts that are deleted after posting a blocked term, how many accounts are needed to classify every term within a time limit?

Assume that:

- Moderation is simple substring matching against a fixed list.
- One post can combine arbitrarily many candidate terms, like one pig sampling many buckets.
- Separators prevent accidental matches across adjacent terms.

Accounts correspond to pigs, posts to mixtures of buckets, blocked terms to poison, review delay to time-to-death, and deletion to death. This is the unknown-number-of-poisons variant.

Real systems add complications:

- Candidate vocabulary may include names, abbreviations, romanization, English words, numbers, and mixed forms, so incomplete candidate generation misses blocked terms.
- Some platforms reject content immediately, changing the timing and strategy.

The analogy is only a way to explore the algorithm, not an operational proposal.

### Returning to the Abstract Problem

Return to pigs and poison to discuss multiple poisoned buckets.

Suppose 1,000 buckets must be tested in one hour, with death occurring after 15 minutes.

#### Variant 1: Exactly Two Poisoned Buckets

[Pig Super Evolution: Your Potential Is Beyond Imagination](https://mp.weixin.qq.com/s/JgColmETAH7Es81iM1dOeQ) surveys several practical strategies and finds that every one of them needs a minimum of 10 pigs, without proving whether 9 could suffice.

There are `C(1000,2) = 499,500` possible poisoned pairs. Four rounds give each pig five states, so the information bound is `5^n ≥ 499500`, yielding `n ≥ 9`. This is only a lower bound; it does not construct a valid nine-pig testing scheme.

#### Variant 2: An Unknown Number of Poisoned Buckets

This variant is much harder. Adaptive partitioning can produce reasonable strategies, but I do not yet have an optimal solution.

## Closing Thoughts

The moderation extension rests on highly idealized assumptions and is intended only as an illustration of the combinatorial problem.

In reality, censorship changes language through abbreviations and euphemisms and limits which viewpoints people can encounter.

## References

- [Poor Pigs problem statement in Chinese](https://leetcode-cn.com/problems/poor-pigs/)
- [Chinese solution discussions](https://leetcode-cn.com/problems/poor-pigs/solution/)
- Turn dynamic programming into mathematical formula：[https://leetcode.com/problems/poor-pigs/discuss/94307/Turn-dynamic-programming-into-mathematical-formula](https://leetcode.com/problems/poor-pigs/discuss/94307/Turn-dynamic-programming-into-mathematical-formula)
- [From dynamic programming to a closed form (Chinese)](https://leetcode-cn.com/problems/poor-pigs/solution/dong-tai-gui-hua-dao-tong-xiang-gong-shi-by-defeat/)
- [An information-theory solution (Chinese)](https://leetcode-cn.com/problems/poor-pigs/solution/jing-dian-xin-xi-lun-ti-mu-by-pi-xie-wang-bei-luo/)
- [The two-poisoned-bucket variant (Chinese)](https://www.zhihu.com/question/60461214)
