---
title: "计算器启示录"
description: "Steam夏促到了，每个游戏都打上了‘50% off’的标签，所以愿望单里的《文明6》从109元降价到了108.5元。"
pubDate: "2019-09-08T12:35:51.000Z"
updatedDate: "2023-01-03T09:53:31.000Z"
published: true
disableComments: true
disableLikes: true
tags: ["bug","Windows编程启示录","计算器","调度场算法","逆波兰表达式","算法"]
---
<h2 class="wp-block-heading">简介</h2>

<p class="wp-block-paragraph">之所以起了这个标题，是因为看了《Windows编程启示录》。为什么会看这本书呢？因为这本书和这篇文章<a href="https://devblogs.microsoft.com/oldnewthing/?p=23853" target="_blank" rel="noopener">《How does the calculator percent key work?》</a>是同一个人。为什么会看这篇文章呢？因为前几天，网上曝光出了手机自带的计算器中的一个“bug”，无论是安卓，还是iOS，在自带的计算器软件中输入“10%+10%”，得出的结果是0.11，而非0.2。08年的这篇文章解释了这个问题。</p>

<!--more-->

<blockquote class="wp-block-quote is-layout-flow wp-block-quote-is-layout-flow">
<p class="wp-block-paragraph">What you first have to understand is that the percent key on those pocket calculators was not designed for mathematicians and engineers. It was designed for your everyday person doing some simple calculations. Therefore, the behavior of the key to you, an engineer, seems bizarrely counter-intuitive and even buggy. But to an everyday person, it makes perfect sense. Or at least that’s the theory.</p>
<cite>How does the calculator percent key work?</cite></blockquote>

<p class="wp-block-paragraph">当然，还有一种很形象的解释是：你还有10%的血，牧师跑过来，对你放了个“使目标剩余血量提升10%”的法术，于是，你的血量就变为11%了。且不论这种法术有多蠢，至少符合了这个计算器bug的模式。</p>

<h2 class="wp-block-heading">如何解析算式</h2>

<p class="wp-block-paragraph">如何把一个常见的算式计算出结果呢，比如“1+2×(3+4)”？首先需要使用<a href="https://zh.wikipedia.org/wiki/%E8%B0%83%E5%BA%A6%E5%9C%BA%E7%AE%97%E6%B3%95" target="_blank" rel="noopener">调度场算法</a>将这样的中缀表达式转换为<a href="https://zh.wikipedia.org/wiki/%E9%80%86%E6%B3%A2%E5%85%B0%E8%A1%A8%E7%A4%BA%E6%B3%95" target="_blank" rel="noopener">逆波兰表达式</a>，再由逆波兰表达式计算出式子的值。</p>

<p class="wp-block-paragraph">其实这样的处理逻辑也适用于自定义的计算语法，而不是仅限于现有的加减乘除，括号等。比如我就是要让加减的优先级高于乘除，可以通过修改上述的计算逻辑来实现。</p>

<h3 class="wp-block-heading"> 调度场算法 </h3>

<p class="wp-block-paragraph">为了简化问题，现在只考虑算式中包含数字，加减，百分号的情况。我把维基百科页面上算法的详细流程摘抄过来了，并去除了没涉及到的运算符的内容。</p>

<ul class="wp-block-list">
<li>当还有记号可以读取时：
<ul class="wp-block-list">
<li>读取一个记号。</li>

<li>如果这个记号表示一个数字，那么将其添加到输出队列中。</li>

<li>如果这个记号表示一个函数，那么将其压入栈当中。</li>

<li>如果这个记号表示一个操作符，记做 <img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-13c86eb9d8c4330af4a133453ba421b7_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#111;&#95;&#49;" title="Rendered by QuickLaTeX.com" height="12" width="16" style="vertical-align: -4px;"/> ，那么：
<ul class="wp-block-list">
<li>只要存在另一个记为 <img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-97a9d18fcb3ec8de08868ad2e4c103cc_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#111;&#95;&#50;" title="Rendered by QuickLaTeX.com" height="11" width="16" style="vertical-align: -3px;"/> 的操作符位于栈的顶端，并且
<ul class="wp-block-list">
<li>如果 <img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-13c86eb9d8c4330af4a133453ba421b7_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#111;&#95;&#49;" title="Rendered by QuickLaTeX.com" height="12" width="16" style="vertical-align: -4px;"/> 是左结合性的并且它的运算符优先级要小于或者等于 <img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-97a9d18fcb3ec8de08868ad2e4c103cc_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#111;&#95;&#50;" title="Rendered by QuickLaTeX.com" height="11" width="16" style="vertical-align: -3px;"/> 的优先级，或者</li>

<li>如果 <img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-13c86eb9d8c4330af4a133453ba421b7_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#111;&#95;&#49;" title="Rendered by QuickLaTeX.com" height="12" width="16" style="vertical-align: -4px;"/> 是右结合性的并且它的运算符优先级比 <img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-97a9d18fcb3ec8de08868ad2e4c103cc_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#111;&#95;&#50;" title="Rendered by QuickLaTeX.com" height="11" width="16" style="vertical-align: -3px;"/> 的要低，那么</li>
</ul>
</li>

<li>将 <img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-97a9d18fcb3ec8de08868ad2e4c103cc_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#111;&#95;&#50;" title="Rendered by QuickLaTeX.com" height="11" width="16" style="vertical-align: -3px;"/> 从栈的顶端弹出并且放入输出队列中（循环直至以上条件不满足为止）；</li>

<li>然后，将 <img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-13c86eb9d8c4330af4a133453ba421b7_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#111;&#95;&#49;" title="Rendered by QuickLaTeX.com" height="12" width="16" style="vertical-align: -4px;"/> 压入栈的顶端。</li>
</ul>
</li>
</ul>
</li>

<li>当再没有记号可以读取时：
<ul class="wp-block-list">
<li>如果此时在栈当中还有操作符：
<ul class="wp-block-list">
<li>将操作符逐个弹出并放入输出队列中。</li>
</ul>
</li>
</ul>
</li>

<li>输出队列，算法结束。</li>
</ul>

<h3 class="wp-block-heading">逆波兰表达式求值</h3>

<ul class="wp-block-list">
<li>while直到有输入符号
<ul class="wp-block-list">
<li>读入下一个符号X</li>

<li>IF X是一个操作数
<ul class="wp-block-list">
<li>入栈</li>
</ul>
</li>

<li>ELSE IF X是一个操作符
<ul class="wp-block-list">
<li>有一个先验的表格给出该操作符需要n个参数</li>

<li>IF堆栈中少于n个操作数
<ul class="wp-block-list">
<li>（错误） 用户没有输入足够的操作数</li>
</ul>
</li>

<li>Else，n个操作数出栈</li>

<li>计算操作符</li>

<li>将计算所得的值入栈</li>
</ul>
</li>
</ul>
</li>

<li>IF栈内只有一个值
<ul class="wp-block-list">
<li>这个值就是整个计算式的结果</li>
</ul>
</li>

<li>ELSE多于一个值
<ul class="wp-block-list">
<li>（错误） 用户输入了多余的操作数</li>
</ul>
</li>
</ul>

<h2 class="wp-block-heading">如何解析“%”</h2>

<h3 class="wp-block-heading">“10%+10% = 0.2”的解析方式</h3>

<p class="wp-block-paragraph">很方便，把“%”视为一个操作符，只需要将“%”的优先级定义为高于加减乘除，它需要1个参数 <img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-1b79cf26c7b6b2e125a2a94276b57f7b_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#110;" title="Rendered by QuickLaTeX.com" height="8" width="11" style="vertical-align: 0px;"/>，计算逻辑是 <img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-268c98e21b54cf65ddb1cc5e6791e313_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#110;&#92;&#37;&#61;&#110;&#32;&#92;&#100;&#105;&#118;&#32;&#49;&#48;&#48;" title="Rendered by QuickLaTeX.com" height="15" width="113" style="vertical-align: -1px;"/> 。 </p>

<h3 class="wp-block-heading">“10%+10% = 0.11”的解析方式</h3>

<p class="wp-block-paragraph">假设一个场景：我买了一个100元的玩具A，又买了个200元的玩具B，玩具城的橱窗上贴着“50% off”的促销宣传，于是我掏出了手机，输入了式子“100+200-50%”，理想的计算结果是150。我用手机上的计算器试了下，确实是150。那么从代码层面要怎么实现呢？</p>

<p class="wp-block-paragraph">可以将“%”的参数设置为1个或者2个，在剩余的参数大于等于2个的时候，按照“10%+10% = 0.11”的模式计算，在剩余的参数只有一个的时候，按照“10%+10% = 0.2”计算。并且，指定“%”的优先级等同于加号和减号。<del style="color:gray;"><em>加减？再看一遍</em><a href="https://www.bilibili.com/video/av53851218" target="_blank" rel="noopener"><em>新宝岛</em></a><em>。</em></del></p>

<p class="wp-block-paragraph">以式子 <img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-6f3000a9bb18fd534b3a60cfbad1b455_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#109;&#32;&#43;&#32;&#110;&#92;&#37;" title="Rendered by QuickLaTeX.com" height="16" width="65" style="vertical-align: -2px;"/> 为例，“%” 的计算逻辑就是 <img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-247943001b79218887a218d6832d6b2c_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#110;&#92;&#37;&#61;&#110;&#32;&#92;&#100;&#105;&#118;&#32;&#49;&#48;&#48;&#32;&#42;&#32;&#109;" title="Rendered by QuickLaTeX.com" height="15" width="148" style="vertical-align: -1px;"/> 。同时，由于“%”的优先级和加减运算是一样的，对于 “100+200-50%” 这样的式子，在计算“50%”之前，会完成“100+200”的计算，然后再进行 <img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-863cb1acc82ec4c21a12ba11de487ff7_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#53;&#48;&#32;&#92;&#100;&#105;&#118;&#32;&#49;&#48;&#48;&#32;&#42;&#32;&#50;&#48;&#48;" title="Rendered by QuickLaTeX.com" height="14" width="115" style="vertical-align: -1px;"/> 这样的计算。</p>

<p class="wp-block-paragraph">对于乘除而言，原文当中也提到了，这里之所以不提及，是因为对于“500×5%”这样的算式，“12500”作为结果不仅违背了普通的数字计算规则，也难以在现实生活中找到对应的实际意义。</p>
