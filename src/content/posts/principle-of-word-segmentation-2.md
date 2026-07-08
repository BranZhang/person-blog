---
title: "分词算法的原理及简单实现（二）"
description: "根据结巴分词算法的相关原理，了解其中的各个算法的具体实现方式。"
pubDatetime: 2018-05-08T16:10:00.000Z
modDatetime: 2023-01-03T09:57:03.000Z
author: "Zhang"
tags:
  - "NLP"
  - "结巴分词"
  - "自然语言处理"
canonicalURL: "https://littlepotato.me/2018/05/09/principle-of-word-segmentation-2/"
---

<p class="wp-block-paragraph">本篇文章将主要介绍在<a rel="noreferrer noopener" aria-label=" (opens in a new tab)" href="https://littlepotato.me/archives/293" target="_blank">《分词算法的原理及简单实现（一）》</a>中提及的分词相关的各种算法。包括但不仅限于结巴分词。</p>

<p class="wp-block-paragraph">注：下文中提及的jieba分词源码指的是 v0.39 版本的代码。</p>

<!--more-->

<h2 class="wp-block-heading">前缀词典</h2>

<p class="wp-block-paragraph">jieba分词中，构建前缀词典相关的源码：</p>

<pre class="EnlighterJSRAW" data-enlighter-language="python" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">def gen_pfdict(self, f):
    lfreq = {}
    ltotal = 0
    f_name = f.name
    for lineno, line in enumerate(f, 1):
        try:
            line = line.strip().decode('utf-8')
            word, freq = line.split(' ')[:2]
            freq = int(freq)
            lfreq[word] = freq
            ltotal += freq
            for ch in range(len(word)):
                wfrag = word[:ch + 1]
                if wfrag not in lfreq:
                    lfreq[wfrag] = 0
        except ValueError:
            raise ValueError(
                'invalid dictionary entry in %s at Line %s: %s' % (f_name, lineno, line))
    f.close()
    return lfreq, ltotal</pre>

<p class="wp-block-paragraph">看着感觉简单粗暴，据测试在 python 中效率比Trie树要好一点？这个有待验证，应该跟语言特性，词典中词汇数量，词汇长短，单字种类有关。</p>

<h3 class="wp-block-heading">Trie树</h3>

<p class="wp-block-paragraph">jieba 分词中原来的Trie树生成算法，已被上面的方法取代。</p>

<pre class="EnlighterJSRAW" data-enlighter-language="python" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">def gen_trie(f_name):
    lfreq = {}
    trie = {}
    ltotal = 0.0
    with open(f_name, 'rb') as f:
        lineno = 0
        for line in f.read().rstrip().decode('utf-8').split('\n'):
            lineno += 1
            try:
                word,freq,_ = line.split(' ')
                freq = float(freq)
                lfreq[word] = freq
                ltotal += freq
                p = trie
                for c in word:
                    if c not in p:
                        p[c] ={}
                    p = p[c]
                p['']='' #ending flag
            except ValueError as e:
                logger.debug('%s at line %s %s' % (f_name,  lineno, line))
                raise e
    return trie, lfreq, ltotal</pre>

<p class="wp-block-paragraph">字典树这个数据结构的用途还是很多的，尤其在搜索领域，下面是一些相关的例题：</p>

<ul class="wp-block-list">
<li><a href="https://leetcode.com/problems/prefix-and-suffix-search/" target="_blank" rel="noopener">Prefix and Suffix Search</a></li>

<li><a href="https://leetcode.com/problems/implement-trie-prefix-tree/" target="_blank" rel="noopener">Implement Trie (Prefix Tree)</a></li>

<li><a href="https://leetcode.com/problems/implement-magic-dictionary/" target="_blank" rel="noopener">Implement Magic Dictionary</a></li>
</ul>

<h2 class="wp-block-heading">有向无环图</h2>

<p class="wp-block-paragraph">有向无环图的生成算法，其中 FREQ 即为上面提到的前缀词典。</p>

<pre class="EnlighterJSRAW" data-enlighter-language="python" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">def get_DAG(self, sentence):
    self.check_initialized()
    DAG = {}
    N = len(sentence)
    for k in range(N):
        tmplist = []
        i = k
        frag = sentence[k]
        while i &lt; N and frag in self.FREQ:
            # 如果词频大于0，就将这个位置i追加到以k为key的一个列表中
            if self.FREQ[frag]:
                tmplist.append(i)
            # 如果词频等于0，则表明前缀词典存在这个前缀，但是统计词典并没有这个词，继续循环
            i += 1
            frag = sentence[k:i + 1]
        if not tmplist:
            tmplist.append(k)
        DAG[k] = tmplist
    return DAG</pre>

<h2 class="wp-block-heading">查找最大概率路径</h2>

<pre class="EnlighterJSRAW" data-enlighter-language="python" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">def calc(self, sentence, DAG, route):
    N = len(sentence)
    route[N] = (0, 0)
    logtotal = log(self.total)
    for idx in range(N - 1, -1, -1):
        route[idx] = max((log(self.FREQ.get(sentence[idx:x + 1]) or 1) -
                          logtotal + route[x + 1][0], x) for x in DAG[idx])


def __cut_DAG_NO_HMM(self, sentence):
    re_eng = re.compile('[a-zA-Z0-9]', re.U)

    DAG = self.get_DAG(sentence)
    route = {}
    self.calc(sentence, DAG, route)
    x = 0
    N = len(sentence)
    buf = ''
    while x &lt; N:
        y = route[x][1] + 1
        l_word = sentence[x:y]
        if re_eng.match(l_word) and len(l_word) == 1:
            buf += l_word
            x = y
        else:
            if buf:
                yield buf
                buf = ''
            yield l_word
            x = y
    if buf:
        yield buf
        buf = ''</pre>

<p class="wp-block-paragraph">设想一个场景，用户在不断的输入，每当用户输入一个字符之后，需要对用户的完整输入进行一遍分词。如果只是单纯的调用分词接口，那么每输入一个字符就要进行一次分词运算。如果了解了“最大概率路径”的算法，就会发现，其实每输入一个字符只要在原有的分词算法上进行增量的计算即可。当然，这么做在减小计算量的同时，会增加一点内存占用。所以在实际应用中是否采用这样的方式，有待考量吧。</p>

<p class="wp-block-paragraph">从上面的算法中可以看出，每当用户输入的查询词新增一个字符时，实际上是在有向无环图后面增加一个节点，根据构建的词典判断从这个节点出发的有向边。再利用动态规划刷新一下最大概率路径即可。</p>

<h2 class="wp-block-heading">HMM</h2>

<p class="wp-block-paragraph"> 关于HMM的内容在文章《HMM的知识点》中进行详细的介绍。 </p>

<h2 class="wp-block-heading">参考资料</h2>

<ul class="wp-block-list">
<li><a href="http://www.hankcs.com/program/java/%E5%8F%8C%E6%95%B0%E7%BB%84trie%E6%A0%91doublearraytriejava%E5%AE%9E%E7%8E%B0.html" target="_blank" rel="noopener">双数组Trie树(DoubleArrayTrie)Java实现</a></li>

<li><a href="https://www.hankcs.com/program/algorithm/aho-corasick-double-array-trie.html" target="_blank" rel="noopener">Aho Corasick自动机结合DoubleArrayTrie极速多模式匹配</a></li>

<li><a href="https://github.com/hankcs/AhoCorasickDoubleArrayTrie" target="_blank" rel="noopener">AhoCorasickDoubleArrayTrie</a></li>
</ul>
