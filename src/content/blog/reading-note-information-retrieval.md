---
title: "学习笔记——信息检索"
description: "信息检索相关的学习内容。"
pubDate: "2018-03-17T11:22:42.000Z"
updatedDate: "2023-01-03T09:57:29.000Z"
published: true
tags: ["IR","信息检索","笔记"]
---
<h2 class="wp-block-heading">书目</h2>

<ul class="wp-block-list">
<li><a href="https://book.douban.com/subject/5252170/" target="_blank" rel="noopener">信息检索导论</a></li>
</ul>

<!--more-->

<h2 class="wp-block-heading">笔记大纲</h2>

<ul class="wp-block-list">
<li><strong>文档</strong>
<ul class="wp-block-list">
<li>文档频率（document frequency），出现某词项的文档的数目</li>

<li>索引粒度（indexing granularity）</li>
</ul>
</li>

<li><strong>布尔检索</strong><ul><li>由布尔值构成的词项-文档关联矩阵</li></ul>
<ul class="wp-block-list">
<li>一个普遍问题就是采用 AND 操作符产生的结果正确率虽高但是召回率偏低，而采用 OR 操作符召回率高但是正确率低</li>

<li>接受布尔表达式查询，AND，OR，NOT</li>

<li>额外的运算方式：词项邻近（term proximity）</li>
</ul>
</li>

<li><strong>排序检索模型（ranked retrieval model）</strong>
<ul class="wp-block-list">
<li>往往是采用一个或者多个词来构成自由文本查询（free text query）</li>
</ul>
</li>

<li><strong>容错式检索</strong>
<ul class="wp-block-list">
<li>词典搜索的数据结构</li>

<li>通配符查询</li>

<li>拼写校正</li>
</ul>
</li>

<li><strong>文档评分</strong>
<ul class="wp-block-list">
<li>参数化索引</li>

<li>域索引</li>

<li>词项频率（term frequencey）</li>

<li>逆文档频率 idf（inverse document frequency）</li>

<li>向量空间模型（vector space model，简称VSM）</li>

<li>文档长度的回转归一化</li>
</ul>
</li>

<li><strong>检索系统中的评分</strong>
<ul class="wp-block-list">
<li>利用倒排记录表</li>

<li>非精确返回前 K 篇文档</li>

<li>查询词项的邻近性</li>

<li>搜索系统中自由文本查询的传递路径</li>

<li>利用向量空间模型实现查询操作</li>
</ul>
</li>

<li><strong>效果评价</strong>
<ul class="wp-block-list">
<li>黄金标准（gold standard）或绝对真理（ground truth）</li>

<li>无序检索结果集合的评价</li>

<li>有序检索结果的评价方法</li>

<li>相关性判定</li>

<li>系统质量及用户效用</li>

<li>结果片段（snippet）</li>
</ul>
</li>

<li><strong>链接分析</strong>
<ul class="wp-block-list">
<li>PageRank</li>
</ul>
</li>

<li><strong>层次聚类</strong></li>

<li><strong>扁平聚类</strong>
<ul class="wp-block-list">
<li>聚类是无监督学习（unsupervised learning）的一种最普遍的形式</li>

<li>分类是监督学习的一种形式，其目标是对人类赋予数据的类别差异进行学习或复制</li>

<li>而在以聚类为重要代表的无监督学习当中，并没有这样的人来对类别的差异进行引导</li>

<li>聚类假设：在考虑文档和信息需求之间的相关性时，同一簇中的文档表现互相类似。</li>

<li>搜索结果聚类可以将相似的文档放在一起呈现。通常来说，浏览几个内容连贯的文档子集会比浏览一篇篇独立的文档更容易</li>

<li>聚类算法的主要应用</li>

<li>聚类算法的评价</li>
</ul>
</li>

<li><strong>机器学习</strong>
<ul class="wp-block-list">
<li>基于机器学习评分</li>

<li>基于机器学习的检索结果排序</li>
</ul>
</li>

<li><strong>概率检索模型</strong>
<ul class="wp-block-list">
<li>BM25 权重计算机制（BM25 weighting scheme）或Okapi 权重计算机制（Okapi weighting）</li>
</ul>
</li>

<li><strong>XML 检索</strong>
<ul class="wp-block-list">
<li>为结构化检索（structured retrieval）</li>

<li>挑战性问题</li>
</ul>
</li>

<li><strong>查询优化（query refinement）</strong>
<ul class="wp-block-list">
<li>布尔查询</li>

<li>全局方法</li>

<li>局部方法</li>
</ul>
</li>

<li><strong>索引压缩</strong>
<ul class="wp-block-list">
<li>优点</li>

<li>统计特性</li>

<li>词典压缩</li>

<li>倒排记录表压缩</li>
</ul>
</li>

<li><strong>索引构建</strong>
<ul class="wp-block-list">
<li>基于块的排序索引方法</li>

<li>内存式单遍扫描索引构建方法</li>

<li>分布式索引构建方法</li>

<li>动态索引构建方法</li>

<li>考虑文档对不同用户的可见性</li>
</ul>
</li>

<li><strong>倒排索引</strong>
<ul class="wp-block-list">
<li>每个词项都有一个记录出现该词项的所有文档的列表，该表中的每个元素记录的是词项在某文档中的一次出现信息</li>

<li>这个表中的每个元素通常称为倒排记录（posting）</li>

<li>每个词项对应的整个表称为倒排记录表（posting list）</li>

<li>所有词项的倒排记录表一起构成全体倒排记录表（postings）</li>

<li>每个倒排记录表存储了词项出现的文档列表，也可以存储一些其他信息，比如词项频率，词项在文档中出现的位置</li>

<li>二元词索引</li>
</ul>
</li>

<li><strong>词项</strong>
<ul class="wp-block-list">
<li>索引的单位</li>

<li>词条化（tokenization）</li>

<li>归一化</li>

<li>词项频率（term frequency，即词项在文档中出现的次数）</li>
</ul>
</li>
</ul>

<hr class="wp-block-separator has-alpha-channel-opacity is-style-wide"/>

<p class="wp-block-paragraph">下方为 xmind 脑图的线上分享，如果没加载出来需要等一会会。</p>

<p><iframe loading="lazy" src="https://www.xmind.net/embed/CBeAjL/" width="100%" height="600px" frameborder="0" scrolling="no" allowfullscreen="true"></iframe></p>
