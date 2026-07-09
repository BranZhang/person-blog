---
title: "Poor pigs"
description: "谁还不是一只小猪仔呢？少碰敏感词，碰多了会死。"
pubDatetime: 2021-01-14T16:50:20.000Z
modDatetime: 2025-03-02T09:19:49.000Z
draft: false
tags: ["leetcode","算法"]
---
<p class="wp-block-paragraph">本文从一条 LeetCode 算法题，研究了一下题目拓展后的情景，并结合言论审查赋予了拓展题一点点实际意义。</p>

<p class="wp-block-paragraph"><strong>小插曲一</strong>：在写本文期间看到的笑话一则，真实性未验证：众网友为吐槽“浙江选考”，却发现微博屏蔽了部分“浙江选考”相关的搜索结果，问题既不是出在“浙江”上，也不是出在“选考”上，而是“江选”两个字。</p>

<p class="wp-block-paragraph"><strong>小插曲二</strong>：在 LeetCode 的中文站上看题解时，发现好像有些词被屏蔽了，通过与题目描述对比，发现“毒药”是敏感词。</p>

<div class="wp-block-image">
<figure class="aligncenter size-large is-resized"><img loading="lazy" decoding="async" src="/wp-content/uploads/2021/01/image.png" alt="" class="wp-image-11751" width="798" height="330" srcset="/wp-content/uploads/2021/01/image.png 997w, /wp-content/uploads/2021/01/image-300x124.png 300w, /wp-content/uploads/2021/01/image-768x318.png 768w" sizes="auto, (max-width: 798px) 100vw, 798px" /><figcaption class="wp-element-caption">“毒药”也是敏感词？</figcaption></figure>
</div>

<!--more-->

<h2 class="wp-block-heading">原题解析</h2>

<h3 class="wp-block-heading">题目</h3>

<p class="wp-block-paragraph">请听题：<a href="https://leetcode.com/problems/poor-pigs/" class="rank-math-link" target="_blank" rel="noopener">458.&nbsp;Poor Pigs</a>，题目中文描述如下：</p>

<p class="wp-block-paragraph">有 <em>buckets</em> 桶液体，其中 正好 有一桶含有毒药，其余装的都是水。它们从外观看起来都一样。为了弄清楚哪只水桶含有毒药，你可以喂一些猪喝，通过观察猪是否会死进行判断。不幸的是，你只有&nbsp;<em>minutesToTest</em> 分钟时间来确定哪桶液体是有毒的。</p>

<p class="wp-block-paragraph">喂猪的规则如下：</p>

<ul class="wp-block-list">
<li>选择若干活猪进行喂养</li>

<li>可以允许小猪同时饮用任意数量的桶中的水，并且该过程不需要时间。</li>

<li>小猪喝完水后，必须有<em> minutesToDie</em> 分钟的冷却时间。在这段时间里，你只能观察，而不允许继续喂猪。</li>

<li>过了 <em>minutesToDie</em> 分钟后，所有喝到毒药的猪都会死去，其他所有猪都会活下来。</li>

<li>重复这一过程，直到时间用完。</li>
</ul>

<p class="wp-block-paragraph">给你桶的数目 <em>buckets</em>，<em>minutesToTest</em> 和 <em>minutesToDie</em> ，返回在规定时间内判断哪个桶有毒所需的<strong>最小</strong>猪数。</p>

<h3 class="wp-block-heading">题解</h3>

<h4 class="wp-block-heading">数学方法</h4>

<p class="wp-block-paragraph">毕竟，这条题目给的标签就是 <strong>Math</strong>，想通之后的解法也很简单，就是一个数学公式。以总时间&nbsp;<code>minutesToTest = 60</code>，死亡时间&nbsp;<code>minutesToDie = 15</code>为例：</p>

<ol class="wp-block-list">
<li>当有&nbsp;1&nbsp;只小猪时，最多可以喝&nbsp;<code>times = minutesToTest</code>&nbsp;/&nbsp;<code>minutesToDie = 4</code>&nbsp;次水。</li>

<li>最多可以喝 4 次水，能够携带 <code>base = times + 1 = 5</code> 个的信息量，也就是（便于理解从 0 开始）：
<ul class="wp-block-list">
<li>(1) 喝&nbsp;0&nbsp;号死去，0&nbsp;号桶水有毒</li>

<li>(2) 喝 1 号死去，1 号桶水有毒</li>

<li>(3) 喝&nbsp;2&nbsp;号死去，2&nbsp;号桶水有毒</li>

<li>(4) 喝&nbsp;3&nbsp;号死去，3&nbsp;号桶水有毒</li>

<li>(5) 喝了上述所有水依然活蹦乱跳，4&nbsp;号桶水有毒</li>

<li>结论是&nbsp;1&nbsp;只小猪最多能够验证&nbsp;5&nbsp;桶水中哪只水桶有毒，当&nbsp;<code>buckets ≤ 5</code>&nbsp;时，<code>answer = 1</code></li>
</ul>
</li>

<li>那么 2 只小猪可以验证的范围最多到多少呢？我们把每只小猪携带的信息量看成是 base 进制数，2 只小猪的信息量就是 pow(base, 2) = pow(5, 2) = 25，所以当 5 ≤ buckets ≤ 25时，anwser = 2。</li>

<li>那么可以得到公式关系：pow(base, ans) ≥ buckets，取对数后即为：ans ≥ log(buckets) / log(base)，因为 ans 为整数，所以 ans = ceil(log(buckets) / log(base))。</li>
</ol>

<p class="wp-block-paragraph">因此，代码实现如下：</p>

<pre class="EnlighterJSRAW" data-enlighter-language="java" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">public int poorPigs(int buckets, int minutesToDie, int minutesToTest) {
    int times = minutesToTest / minutesToDie;
    int base = times + 1;
    double temp = Math.log(buckets) / Math.log(base);
    int ans = (int)Math.ceil(temp)
    return ans;
}</pre>

<h4 class="wp-block-heading">动态规划方法</h4>

<p class="wp-block-paragraph">既然提到了动态规划，来来来，动态规划算法三要素：</p>

<ol class="wp-block-list">
<li>所有不同的子问题组成的表</li>

<li>解决问题的依赖关系可以看成是一个图</li>

<li>填充子问题的顺序（即对②的图进行拓扑排序，填充的过程称为状态转移）</li>
</ol>

<p class="wp-block-paragraph">那么，按照<a href="https://leetcode.com/problems/poor-pigs/discuss/94307/Turn-dynamic-programming-into-mathematical-formula" class="rank-math-link" target="_blank" rel="noopener">《Turn dynamic programming into mathematical formula》</a>这篇文章中的思路，对应到上面三要素，</p>

<p class="wp-block-paragraph"><strong>子问题：</strong>小猪的个数 n，以及有限时间内最多测试次数 t，t = minutesToTest / minutesToDie，可以判断 dp(n,t) 桶水，不同的 n 和 t 组成了子问题。</p>

<p class="wp-block-paragraph"><strong>问题的依赖关系：</strong>当有 n 只小猪，最多测试次数为 t 时，</p>

<ul class="wp-block-list">
<li>同时被 n 只猪喝，那么假设这桶水有毒，所有猪全死了，如果这类桶数量超过1，显然就无法判断具体是哪一桶了，因此这类桶最多一个（猪全死了就是它有毒）。</li>

<li>同时被 n-1 只猪喝，假设这桶水有毒，死了 n-1 只猪，那么只剩下一只猪和 t-1 轮喝水机会，那么这类水桶最多只能有 C(n,n-1) * dp(1,t-1) 个。</li>

<li>同时被n-k只猪喝，假设这桶水有毒，死了n-k只猪，那么只剩下k只猪和t-1轮喝水机会，那么这类水桶最多只能有 C(n,k) * dp(k,t-1) 个。</li>

<li>这一轮没有猪喝，那么假设这桶水有毒，只剩下n只猪和t-1轮喝水机会，那么这类桶最多只能有 C(n,0) * dp(n,t-1) 个。</li>
</ul>

<p class="wp-block-paragraph">因此，可以得到依赖关系：dp(n,t) = C(n,n) * dp(0,r-1) + C(n,n-1) * dp(1,r-1) + &#8230; + C(n,0) * dp(n,r-1)</p>

<p class="wp-block-paragraph"><strong>填充顺序：</strong>按照先测试次数的增加，再小猪的个数增加来填充。</p>

<p class="wp-block-paragraph">当然，原文最终对依赖关系中的计算逻辑进行了简化，简化到最后实际上也是一个数学公式，进而可以直接计算出结果。</p>

<h4 class="wp-block-heading">信息论方法</h4>

<blockquote class="wp-block-quote is-layout-flow wp-block-quote-is-layout-flow">
<p class="wp-block-paragraph">“根据香农的信息论，信息熵 = 连加 &#8211; (每一项的概率*log(每一项的概率))。在此活动中每一项都是等概的。故计算结果：瓶子信息熵=log(瓶子数)，猪信息熵=log(状态数)，为了获得足够的信息需要的猪即为两个信息熵相除。”</p>
<cite><a href="https://leetcode-cn.com/problems/poor-pigs/solution/jing-dian-xin-xi-lun-ti-mu-by-pi-xie-wang-bei-luo/" class="rank-math-link" target="_blank" rel="noopener">https://leetcode-cn.com/problems/poor-pigs/solution/jing-dian-xin-xi-lun-ti-mu-by-pi-xie-wang-bei-luo/</a></cite></blockquote>

<p class="wp-block-paragraph">对应的代码实现如下：</p>

<pre class="EnlighterJSRAW" data-enlighter-language="cpp" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">int poorPigs(int buckets, int minutesToDie, int minutesToTest) {
    int states = minutesToTest / minutesToDie + 1;
    return ceil(log(buckets) / log(states));
}</pre>

<h2 class="wp-block-heading">拓展</h2>

<h3 class="wp-block-heading">修改后的题目</h3>

<p class="wp-block-paragraph">假如那些水桶中有不止1桶有毒，比如：2桶有毒，或者未知桶有毒，那么，需要多少只小猪来试毒？</p>

<p class="wp-block-paragraph">于是，上述对题目的改写，我联想到了一个实际场景，请听题：<strong>有一个论坛，其对敏感言论的审查平均时间为10分钟，一旦查出来某账户发表了敏感言论，将会被销号（你号没了）。但是平台又不公布敏感词。为此，假设现从某语料库中得到N个词语，问：在10小时内，判断出词库中每个词是否为敏感词，需要准备多少个账号？</strong></p>

<p class="wp-block-paragraph">在这里，我假设：</p>

<ul class="wp-block-list">
<li>平台的敏感词审查是单纯的字符串比对，也就是遍历敏感词列表，判断发布的言论是否包含敏感词。</li>

<li>可以将词进行组合发布，并且论坛不限制内容的长度，就好比同一只小猪可以同时测试多个桶是否有毒。</li>

<li>组合发布的词使用标点隔开，使得平台无法将前后的词连接起来，也就是说算法题里不会出现文章开头“插曲一”的情形。</li>
</ul>

<p class="wp-block-paragraph">这样的一个问题，账号相当于小猪，发表一段内容相当于喝下若干桶的水，敏感词相当于毒药，言论的审查平均时间相当于毒药的发作时间，被销号相当于中毒身亡。这个问题等同于小猪试毒药的“未知桶有毒”的情形。</p>

<p class="wp-block-paragraph">如果真的需要做成这样一件事情，其实还有很多细节可以深挖，比如：</p>

<ul class="wp-block-list">
<li>初始的词汇准备。不同于词典中的词语，敏感词不仅仅是诸如 “政府，共产党，造反” 一些常见的词语，也会是人名，简称，拼音，英语单词，数字，混写等，比如 “薄熙来，江选，CNM，8964，2b”等。如果初始词汇准备的不够全面，那也就谈不上测出敏感词了。</li>

<li>有些网站会在言论发布时就提示文本中是否包含敏感词，反应到题目中就是言论的审查时间非常短，所以在这样的情况下算法在实际设计时需要考虑别的方面。</li>
</ul>

<p class="wp-block-paragraph">当然，有人会说，有很多的更加方便的得到敏感词列表的方式，在此，本文仅讨论算法本身，以上对题目的联想仅仅是犯病了。</p>

<h3 class="wp-block-heading">回到算法题本身</h3>

<p class="wp-block-paragraph">为了方便算法问题的讨论，还是回到“小猪和毒药”的版本，下面就探讨一下毒药多于1桶时的情形。</p>

<p class="wp-block-paragraph">问题描述：1000桶水，猪喝毒水后会在15分钟内死去，想用一个小时找到毒水，至少需要几只猪？</p>

<h4 class="wp-block-heading">改版一：有2桶的毒药</h4>

<p class="wp-block-paragraph"><a href="https://mp.weixin.qq.com/s/JgColmETAH7Es81iM1dOeQ" class="rank-math-link" target="_blank" rel="noopener">《猪猪超进化：你的潜能，超乎你的想象！》</a>这篇文章从各种方案实施的角度，列举了多种实施方式，得出的最少小猪使用量均为10只。但却无法证明是否可能只用9只小猪。</p>

<p class="wp-block-paragraph">从信息论的角度，1000桶水里有2桶毒水，那么需要检验的点位有 (999+1)*999/2=499500 个（这公式怎么来的？），总共测试4轮，所以一只猪可以有5种状态，求解5^n&gt;499500，n为正整数，lg(49500)/lg(5) ≈ 8.15，所以至少需要9只小猪。当然，这只是理论上的最小值，如果无法给出可实施的方案，那这个结论是不成立的。</p>

<h4 class="wp-block-heading">改版二：有未知桶毒药</h4>

<p class="wp-block-paragraph">这个问题的复杂程度远超出我的想象，可以尝试用二分法之类的给出一个较为合理的解决方案，但目前做不到最优解。等有的进展再补充进来。（我真的会补坑，只要有进展）</p>

<h2 class="wp-block-heading">最后</h2>

<p class="wp-block-paragraph">以上仅为从一条算法题出发，结合敏感言论审查所想到的一点点拓展而已。并无多少实际执行的意义，如果你耐心看完上文，会发现拓展后的题目是基于很多理想化的前提的，现实远没有那么简单。</p>

<p class="wp-block-paragraph">言论的审查不仅在于交流上的不方便，频出的各种缩写，绰号，增加了交流的阻力，更使得每个人能够接受到的观点存在缺失。或许，这就是当猪的命吧。</p>

<h2 class="wp-block-heading">参考</h2>

<ul class="wp-block-list">
<li>算法题中文描述：<a href="https://leetcode-cn.com/problems/poor-pigs/" class="rank-math-link" target="_blank" rel="noopener">https://leetcode-cn.com/problems/poor-pigs/</a></li>

<li>算法题解法：<a href="https://leetcode-cn.com/problems/poor-pigs/solution/" class="rank-math-link" target="_blank" rel="noopener">https://leetcode-cn.com/problems/poor-pigs/solution/</a></li>

<li>Turn dynamic programming into mathematical formula：<a href="https://leetcode.com/problems/poor-pigs/discuss/94307/Turn-dynamic-programming-into-mathematical-formula" class="rank-math-link" target="_blank" rel="noopener">https://leetcode.com/problems/poor-pigs/discuss/94307/Turn-dynamic-programming-into-mathematical-formula</a></li>

<li>动态规划到通项公式：<a href="https://leetcode-cn.com/problems/poor-pigs/solution/dong-tai-gui-hua-dao-tong-xiang-gong-shi-by-defeat/" class="rank-math-link" target="_blank" rel="noopener">https://leetcode-cn.com/problems/poor-pigs/solution/dong-tai-gui-hua-dao-tong-xiang-gong-shi-by-defeat/</a></li>

<li>经典信息论题目：<a href="https://leetcode-cn.com/problems/poor-pigs/solution/jing-dian-xin-xi-lun-ti-mu-by-pi-xie-wang-bei-luo/" class="rank-math-link" target="_blank" rel="noopener">https://leetcode-cn.com/problems/poor-pigs/solution/jing-dian-xin-xi-lun-ti-mu-by-pi-xie-wang-bei-luo/</a></li>

<li>1000桶水中两桶有毒，猪喝毒水后会在15分钟内死去，想用一个小时找到毒水，至少需要几只猪？：<a href="https://www.zhihu.com/question/60461214" class="rank-math-link" target="_blank" rel="noopener">https://www.zhihu.com/question/60461214</a></li>
</ul>
