---
title: "实现克里金(kriging)插值（一）计算原理"
description: "克里金插值较为复杂，但效果也是比较好的。为了能够通过代码实现克里金插值的过程，首先需要了解其详细的计算过程。"
pubDatetime: 2017-08-28T14:31:02.000Z
modDatetime: 2023-01-03T09:58:08.000Z
author: "Zhang"
tags:
  - "arcgis"
  - "C#"
  - "kriging"
  - "插值"
  - "GIS"
  - "算法"
canonicalURL: "https://littlepotato.me/2017/08/28/how-kriging-works-1-formula/"
---

<p class="wp-block-paragraph"><em>这篇文章是大三的一个课程大作业，最初发布在 CSDN 上。因为当时花了很多精力在这上面，所以决定搬过来。</em></p>

<p class="wp-block-paragraph">

克里金插值较为复杂，但效果也是比较好的。为了能够通过代码实现克里金插值的过程，首先需要了解其详细的计算过程。

</p>

<!--more-->

<hr class="wp-block-separator has-css-opacity is-style-wide"/>

<h2 class="wp-block-heading" id="在arcgis中操作一遍">在ArcGIS中实现克里金插值计算</h2>

<h3 class="wp-block-heading"> 导入散点数据 </h3>

<div class="wp-block-image">
<figure class="aligncenter"><img decoding="async" src="/wp-content/uploads/2019/07/gis-1-1.jpg" alt="" class="wp-image-100"/><figcaption class="wp-element-caption"> 导入散点数据，数据包括散点的坐标，高程值</figcaption></figure>
</div>

<p class="wp-block-paragraph">

在“Geostatistical Analyst”中选择“地统计向导”。找不到的先右击菜单栏空白处，勾选“Geostatistical Analyst”。

</p>

<h3 class="wp-block-heading"> 选择数据 </h3>

<div class="wp-block-image">
<figure class="aligncenter"><img decoding="async" src="/wp-content/uploads/2019/07/gis-1-2.jpg" alt="" class="wp-image-102"/><figcaption class="wp-element-caption"> 选择数据，选择“克里金法”，下一步</figcaption></figure>
</div>

<h3 class="wp-block-heading"> 选择“普通克里金” </h3>

<div class="wp-block-image">
<figure class="aligncenter"><img decoding="async" src="/wp-content/uploads/2019/07/gis-1-3.jpg" alt="" class="wp-image-103"/><figcaption class="wp-element-caption"> 选择“普通克里金”，下一步</figcaption></figure>
</div>

<h3 class="wp-block-heading"> 拟合界面 </h3>

<p class="wp-block-paragraph">这个界面的内容很重要，也正是帮助文档中所解释的内容。左上角的拟合曲线是我们将要在C#代码中实现的，坐标系中的散点也是需要我们去通过计算得到的。</p>

<div class="wp-block-image">
<figure class="aligncenter"><img decoding="async" src="/wp-content/uploads/2019/07/gis-1-4.jpg" alt="" class="wp-image-104"/><figcaption class="wp-element-caption"> 拟合界面 </figcaption></figure>
</div>

<h3 class="wp-block-heading"> 查看拟合函数类型 </h3>

<p class="wp-block-paragraph">点开上图界面中的“类型”，可以看到如下的几种：球面函数，指数函数，高斯函数等。选择其中不同的类型，左侧的拟合曲线也会相应的改变，这几种函数在帮助文档中有介绍到。</p>

<div class="wp-block-image">
<figure class="aligncenter"><img decoding="async" src="/wp-content/uploads/2019/07/gis-1-5.jpg" alt="" class="wp-image-87"/><figcaption class="wp-element-caption">拟合函数类型</figcaption></figure>
</div>

<h3 class="wp-block-heading"> 查看插值的结果 </h3>

<div class="wp-block-image">
<figure class="aligncenter"><img decoding="async" src="/wp-content/uploads/2019/07/gis-1-6.jpg" alt="" class="wp-image-105"/><figcaption class="wp-element-caption">选择好类型之后，下一步就将看到插值的结果</figcaption></figure>
</div>

<h3 class="wp-block-heading"> 误差分析的界面 </h3>

<div class="wp-block-image">
<figure class="aligncenter"><img decoding="async" src="/wp-content/uploads/2019/07/gis-1-7.jpg" alt="" class="wp-image-106"/><figcaption class="wp-element-caption">最后的界面是对插值结果的误差分析</figcaption></figure>
</div>

<hr class="wp-block-separator has-css-opacity is-style-wide"/>

<h2 class="wp-block-heading">阅读ArcGIS中的有关克里金插值的文档</h2>

<p class="wp-block-paragraph">打开ArcGIS的帮助文档，搜索“克里金”，选择“克里金法的工作原理”。</p>

<div class="wp-block-image">
<figure class="aligncenter"><img decoding="async" src="/wp-content/uploads/2019/07/gis-1-8.jpg" alt="" class="wp-image-107"/><figcaption class="wp-element-caption">有关克里金插值的文档</figcaption></figure>
</div>

<h3 class="wp-block-heading"> 求取散点的半方差 </h3>

<p class="wp-block-paragraph">公式：<img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-87bd9e82749c7acf4f5802292cd4fb8e_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#83;&#101;&#109;&#105;&#118;&#97;&#114;&#105;&#111;&#103;&#114;&#97;&#109;&#40;&#100;&#105;&#115;&#116;&#97;&#110;&#99;&#101;&#95;&#104;&#41;&#32;&#61;&#32;&#123;&#49;&#92;&#111;&#118;&#101;&#114;&#50;&#125;&#32;&#42;&#32;&#40;&#118;&#97;&#108;&#117;&#101;&#95;&#105;&#32;&#45;&#32;&#118;&#97;&#108;&#117;&#101;&#95;&#106;&#41;&#94;&#50;" title="Rendered by QuickLaTeX.com" height="22" width="430" style="vertical-align: -6px;"/><br> 其中<img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-42ad5bee56bcf4ccd4709deaefa3c2c0_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#100;&#105;&#115;&#116;&#97;&#110;&#99;&#101;&#95;&#104;" title="Rendered by QuickLaTeX.com" height="16" width="78" style="vertical-align: -3px;"/>就是指<img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-299289f085d0706bdefa9bbba17ee7ec_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#105;" title="Rendered by QuickLaTeX.com" height="12" width="6" style="vertical-align: 0px;"/>，<img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-0c983e9fb87aa42fadd665cdd4a7739c_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#106;" title="Rendered by QuickLaTeX.com" height="16" width="9" style="vertical-align: -4px;"/>两点的距离，也就是坐标中的X轴的变量，计算得到的<img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-b2bd871291a77f667991fca67408bd89_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#83;&#101;&#109;&#105;&#118;&#97;&#114;&#105;&#111;&#103;&#114;&#97;&#109;" title="Rendered by QuickLaTeX.com" height="16" width="133" style="vertical-align: -4px;"/>就是坐标轴中Y轴的变量。</p>

<p class="wp-block-paragraph">如果有100个点，每个点都与其他的99个点计算半方差，但是这样会产生大量的数据，而且这些数据中有一部分是重复的。这样执行拟合的效率也会很低。按照帮助文档的说法，我们要精简得到的结果。比如：0~10之间的点求一个均值，10~20，20~30……   </p>

<p class="wp-block-paragraph">这样，我们就可以得到多个坐标点，如图，红色的点就是初始求得的点，蓝色的点就是均值点：</p>

<div class="wp-block-image">
<figure class="aligncenter"><img decoding="async" src="/wp-content/uploads/2019/07/gis-1-9.jpg" alt="" class="wp-image-108"/></figure>
</div>

<h3 class="wp-block-heading"> 拟合坐标点，求取主变程和基台值 </h3>

<p class="wp-block-paragraph">拟合主要是针对蓝色的点，拟合函数有多种选择，函数中的<img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-fa7404a749dd1a88fb8d521e07242734_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#99;&#95;&#48;" title="Rendered by QuickLaTeX.com" height="11" width="15" style="vertical-align: -3px;"/>是块金值，<img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-7be173e8e81928a3f63b59c4117635e0_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#99;" title="Rendered by QuickLaTeX.com" height="8" width="9" style="vertical-align: 0px;"/>是偏基台值，<img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-32b9bc61b9ef800f85a386d7521bb33e_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#97;" title="Rendered by QuickLaTeX.com" height="8" width="10" style="vertical-align: 0px;"/>或<img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-a05d21231b95a3cca8e9f374ca9465cb_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#114;" title="Rendered by QuickLaTeX.com" height="8" width="9" style="vertical-align: 0px;"/>是主变程值，<img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-fa7404a749dd1a88fb8d521e07242734_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#99;&#95;&#48;" title="Rendered by QuickLaTeX.com" height="11" width="15" style="vertical-align: -3px;"/>块金值在拟合中一般默认为0。  </p>

<div class="wp-block-image">
<figure class="aligncenter"><img decoding="async" src="/wp-content/uploads/2019/07/gis-1-10.jpg" alt="" class="wp-image-110"/><figcaption class="wp-element-caption">拟合函数</figcaption></figure>
</div>

<h4 class="wp-block-heading"> 球形模型 </h4>

<div class="wp-block-image">
<figure class="aligncenter"><img decoding="async" src="/wp-content/uploads/2019/07/gis-1-11.jpg" alt="" class="wp-image-111"/><figcaption class="wp-element-caption"> 球形模型</figcaption></figure>
</div>

<h4 class="wp-block-heading"> 指数模型 </h4>

<div class="wp-block-image">
<figure class="aligncenter"><img decoding="async" src="/wp-content/uploads/2019/07/gis-1-12.jpg" alt="" class="wp-image-112"/><figcaption class="wp-element-caption"> 指数模型</figcaption></figure>
</div>

<h4 class="wp-block-heading"> 高斯模型 </h4>

<div class="wp-block-image">
<figure class="aligncenter"><img decoding="async" src="/wp-content/uploads/2019/07/gis-1-13.jpg" alt="" class="wp-image-113"/><figcaption class="wp-element-caption"> 高斯模型</figcaption></figure>
</div>

<p class="wp-block-paragraph">在以上三个模型中，抛开<img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-fa7404a749dd1a88fb8d521e07242734_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#99;&#95;&#48;" title="Rendered by QuickLaTeX.com" height="11" width="15" style="vertical-align: -3px;"/>默认为0，球形模型的方程有3个未知量，高斯模型和指数模型有2个未知量，因为需要用C#程序去实现这个拟合的过程，我选择了较为简单的指数模型，其公式为：  </p>

<p class="wp-block-paragraph"><p class="ql-center-displayed-equation" style="line-height: 58px;"><span class="ql-right-eqno"> &nbsp; </span><span class="ql-left-eqno"> &nbsp; </span><img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-6c87478bd7b74199d81e54f7acb74289_l3.png" height="58" width="287" class="ql-img-displayed-equation quicklatex-auto-format" alt="&#92;&#91;&#32;&#32;&#32;&#114;&#123;&#40;&#104;&#41;&#125;&#32;&#61;&#32;&#92;&#98;&#101;&#103;&#105;&#110;&#123;&#99;&#97;&#115;&#101;&#115;&#125;&#32;&#99;&#95;&#48;&#43;&#99;&#42;&#40;&#49;&#45;&#101;&#94;&#123;&#123;&#45;&#104;&#125;&#92;&#111;&#118;&#101;&#114;&#32;&#114;&#125;&#41;&#44;&#32;&#32;&#38;&#32;&#104;&#62;&#48;&#32;&#92;&#92;&#32;&#48;&#44;&#32;&#38;&#32;&#104;&#61;&#48;&#32;&#92;&#101;&#110;&#100;&#123;&#99;&#97;&#115;&#101;&#115;&#125;&#92;&#93;" title="Rendered by QuickLaTeX.com"/></p></p>

<p class="wp-block-paragraph">通过拟合得到<img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-7be173e8e81928a3f63b59c4117635e0_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#99;" title="Rendered by QuickLaTeX.com" height="8" width="9" style="vertical-align: 0px;"/>，<img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-a05d21231b95a3cca8e9f374ca9465cb_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#114;" title="Rendered by QuickLaTeX.com" height="8" width="9" style="vertical-align: 0px;"/>，得到了半方差的插值模型，我们就可以进行下一步的插值计算了。</p>

<h3 class="wp-block-heading"> 求取未知点的插值结果 </h3>

<p class="wp-block-paragraph">接下来的插值计算过程帮助文档中未详细描述，我从一次比赛的pdf中得到了计算过程，在此分享一下。  <br>
设函数<img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-8b7ca70ab00cc7f8c33099c45f4b632e_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#114;&#95;&#123;&#40;&#104;&#41;&#125;" title="Rendered by QuickLaTeX.com" height="15" width="27" style="vertical-align: -7px;"/>为上面所求得的模型，<img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-bdc92920386d628c4e07e3b7130fc745_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#104;" title="Rendered by QuickLaTeX.com" height="13" width="10" style="vertical-align: 0px;"/>为<img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-299289f085d0706bdefa9bbba17ee7ec_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#105;" title="Rendered by QuickLaTeX.com" height="12" width="6" style="vertical-align: 0px;"/>，<img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-0c983e9fb87aa42fadd665cdd4a7739c_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#106;" title="Rendered by QuickLaTeX.com" height="16" width="9" style="vertical-align: -4px;"/>两点之间的距离。</p>

<p class="wp-block-paragraph"> 设<img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-41da637ae671cf89d42e95ebbe00de49_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#99;&#95;&#123;&#105;&#106;&#125;&#61;&#99;&#45;&#114;&#40;&#104;&#95;&#123;&#105;&#106;&#125;&#41;" title="Rendered by QuickLaTeX.com" height="20" width="122" style="vertical-align: -6px;"/>，用于计算矩阵<img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-7de099388b5cfc2d83fefad8ad5668f8_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#75;" title="Rendered by QuickLaTeX.com" height="12" width="17" style="vertical-align: 0px;"/>，向量<img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-f0d278ca3f193357805a7765d9ffb155_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#68;" title="Rendered by QuickLaTeX.com" height="12" width="15" style="vertical-align: 0px;"/>。矩阵K是用已知散点求得的，表达式如下：  </p>

<p class="wp-block-paragraph"><p class="ql-center-displayed-equation" style="line-height: 91px;"><span class="ql-right-eqno"> &nbsp; </span><span class="ql-left-eqno"> &nbsp; </span><img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-bcb9a2ba0a1b76334ab8fb21370215c6_l3.png" height="91" width="226" class="ql-img-displayed-equation quicklatex-auto-format" alt="&#92;&#91;&#75;&#61;&#32;&#32;&#32;&#32;&#32;&#32;&#32;&#32;&#32;&#92;&#98;&#101;&#103;&#105;&#110;&#123;&#98;&#109;&#97;&#116;&#114;&#105;&#120;&#125;&#32;&#32;&#32;&#32;&#32;&#32;&#32;&#32;&#32;&#99;&#95;&#123;&#49;&#49;&#125;&#38;&#32;&#99;&#95;&#123;&#49;&#50;&#125;&#32;&#38;&#32;&#92;&#99;&#100;&#111;&#116;&#115;&#92;&#32;&#38;&#99;&#95;&#123;&#49;&#110;&#125;&#32;&#32;&#92;&#92;&#32;&#32;&#32;&#32;&#32;&#32;&#32;&#32;&#32;&#99;&#95;&#123;&#50;&#49;&#125;&#38;&#32;&#99;&#95;&#123;&#50;&#50;&#125;&#32;&#38;&#32;&#32;&#92;&#99;&#100;&#111;&#116;&#115;&#92;&#32;&#38;&#99;&#95;&#123;&#50;&#110;&#125;&#32;&#32;&#92;&#92;&#32;&#32;&#32;&#32;&#32;&#32;&#32;&#32;&#32;&#32;&#92;&#99;&#100;&#111;&#116;&#115;&#92;&#32;&#38;&#32;&#32;&#92;&#99;&#100;&#111;&#116;&#115;&#92;&#32;&#38;&#32;&#32;&#92;&#99;&#100;&#111;&#116;&#115;&#92;&#32;&#38;&#32;&#32;&#92;&#99;&#100;&#111;&#116;&#115;&#92;&#32;&#32;&#92;&#92;&#32;&#32;&#32;&#32;&#32;&#32;&#32;&#32;&#32;&#99;&#95;&#123;&#110;&#49;&#125;&#38;&#32;&#99;&#95;&#123;&#110;&#50;&#125;&#32;&#38;&#32;&#32;&#92;&#99;&#100;&#111;&#116;&#115;&#92;&#32;&#38;&#99;&#95;&#123;&#110;&#110;&#125;&#32;&#32;&#92;&#92;&#32;&#32;&#32;&#32;&#32;&#32;&#32;&#32;&#32;&#92;&#101;&#110;&#100;&#123;&#98;&#109;&#97;&#116;&#114;&#105;&#120;&#125;&#92;&#93;" title="Rendered by QuickLaTeX.com"/></p></p>

<p class="wp-block-paragraph">向量<img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-f0d278ca3f193357805a7765d9ffb155_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#68;" title="Rendered by QuickLaTeX.com" height="12" width="15" style="vertical-align: 0px;"/>是计算当前要求的未知点与已知点之间的<img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-06398b7de34466d8df008df614083b32_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#99;&#95;&#123;&#105;&#106;&#125;" title="Rendered by QuickLaTeX.com" height="14" width="19" style="vertical-align: -6px;"/>，公式如下：  </p>

<p class="wp-block-paragraph"><p class="ql-center-displayed-equation" style="line-height: 91px;"><span class="ql-right-eqno"> &nbsp; </span><span class="ql-left-eqno"> &nbsp; </span><img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-c6d5ae0ec4fabef07f81cf0c9bfad51d_l3.png" height="91" width="123" class="ql-img-displayed-equation quicklatex-auto-format" alt="&#92;&#91;&#68;&#61;&#32;&#32;&#32;&#32;&#32;&#32;&#32;&#32;&#32;&#92;&#98;&#101;&#103;&#105;&#110;&#123;&#98;&#109;&#97;&#116;&#114;&#105;&#120;&#125;&#32;&#32;&#32;&#32;&#32;&#32;&#32;&#32;&#32;&#99;&#40;&#120;&#95;&#49;&#44;&#120;&#41;&#32;&#92;&#92;&#32;&#32;&#32;&#32;&#32;&#32;&#32;&#32;&#32;&#99;&#40;&#120;&#95;&#50;&#44;&#120;&#41;&#32;&#92;&#92;&#32;&#32;&#32;&#32;&#32;&#32;&#32;&#32;&#32;&#32;&#92;&#99;&#100;&#111;&#116;&#115;&#92;&#32;&#92;&#92;&#32;&#32;&#32;&#32;&#32;&#32;&#32;&#32;&#32;&#99;&#40;&#120;&#95;&#110;&#44;&#120;&#41;&#32;&#92;&#92;&#32;&#32;&#32;&#32;&#32;&#32;&#32;&#32;&#32;&#92;&#101;&#110;&#100;&#123;&#98;&#109;&#97;&#116;&#114;&#105;&#120;&#125;&#92;&#93;" title="Rendered by QuickLaTeX.com"/></p></p>

<p class="wp-block-paragraph">利用矩阵<img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-7de099388b5cfc2d83fefad8ad5668f8_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#75;" title="Rendered by QuickLaTeX.com" height="12" width="17" style="vertical-align: 0px;"/>和向量<img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-f0d278ca3f193357805a7765d9ffb155_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#68;" title="Rendered by QuickLaTeX.com" height="12" width="15" style="vertical-align: 0px;"/>，能够求得向量<img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-8d12af02aca15e24a5b2292db906b6e8_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#92;&#108;&#97;&#109;&#98;&#100;&#97;" title="Rendered by QuickLaTeX.com" height="12" width="11" style="vertical-align: 0px;"/>，<img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-6ca814cfca9039b6eb9dedb0e41ac480_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#92;&#108;&#97;&#109;&#98;&#100;&#97;&#40;&#105;&#41;" title="Rendered by QuickLaTeX.com" height="18" width="30" style="vertical-align: -4px;"/>表示第<img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-299289f085d0706bdefa9bbba17ee7ec_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#105;" title="Rendered by QuickLaTeX.com" height="12" width="6" style="vertical-align: 0px;"/>个已知点对当前未知点的影响权重，公式：<img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-0a422b4adabc24a63dcb295fa32e05e6_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#92;&#108;&#97;&#109;&#98;&#100;&#97;&#61;&#75;&#94;&#123;&#45;&#49;&#125;&#68;" title="Rendered by QuickLaTeX.com" height="16" width="88" style="vertical-align: 0px;"/></p>

<p class="wp-block-paragraph">计算<img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-052dc4d2763204264b72d25a0451a336_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#120;&#95;&#48;" title="Rendered by QuickLaTeX.com" height="11" width="18" style="vertical-align: -3px;"/>点的高程值得公式如下，其中<img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-3846934cfcc6d2e6a5fcac6a722ca1bc_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#90;&#40;&#120;&#95;&#105;&#41;" title="Rendered by QuickLaTeX.com" height="18" width="43" style="vertical-align: -4px;"/>表示<img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-299289f085d0706bdefa9bbba17ee7ec_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#105;" title="Rendered by QuickLaTeX.com" height="12" width="6" style="vertical-align: 0px;"/>点的高程值： <img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-1a850bef48853757966f31ed1033c584_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#90;&#40;&#120;&#95;&#48;&#41;&#61;&#92;&#115;&#117;&#109;&#95;&#123;&#105;&#61;&#49;&#125;&#94;&#110;&#92;&#108;&#97;&#109;&#98;&#100;&#97;&#95;&#105;&#42;&#90;&#40;&#120;&#95;&#105;&#41;" title="Rendered by QuickLaTeX.com" height="22" width="198" style="vertical-align: -7px;"/> </p>

<p class="wp-block-paragraph">这样，一个未知点的高程值就预测出来了，矩阵<img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-7de099388b5cfc2d83fefad8ad5668f8_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#75;" title="Rendered by QuickLaTeX.com" height="12" width="17" style="vertical-align: 0px;"/>针对同一批散点是确定的。所以，预测其他坐标的高程值时，只需要重复计算向量<img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-f0d278ca3f193357805a7765d9ffb155_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#68;" title="Rendered by QuickLaTeX.com" height="12" width="15" style="vertical-align: 0px;"/>。</p>
