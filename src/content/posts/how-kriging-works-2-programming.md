---
title: "实现克里金(kriging)插值（二）代码实现"
description: "接上篇《克里金(kriging)插值的计算原理》，本篇主要介绍如何通过 C# 来实现这样的算法。"
pubDatetime: 2017-08-29T10:04:43.000Z
modDatetime: 2023-01-03T09:57:57.000Z
draft: false
tags: ["C#","kriging","插值","GIS","算法"]
---
<p class="wp-block-paragraph">接上篇的计算原理，本篇主要介绍如何通过 C# 来实现这样的算法。</p>

<!--more-->

<h2 class="wp-block-heading" id="程序下载">程序下载</h2>

<div class="wp-block-file"><a id="wp-block-file--media-a3df5bdd-d4f6-4132-a136-963e8a714188" href="/wp-content/uploads/2019/08/%E5%85%8B%E9%87%8C%E9%87%91%E6%8F%92%E5%80%BC%E5%8F%8ADEM%E7%AD%89%E9%AB%98%E7%BA%BF%E7%94%9F%E6%88%90.zip">克里金插值及DEM等高线生成</a><a href="/wp-content/uploads/2019/08/%E5%85%8B%E9%87%8C%E9%87%91%E6%8F%92%E5%80%BC%E5%8F%8ADEM%E7%AD%89%E9%AB%98%E7%BA%BF%E7%94%9F%E6%88%90.zip" class="wp-block-file__button wp-element-button" aria-describedby="wp-block-file--media-a3df5bdd-d4f6-4132-a136-963e8a714188" download>Download</a></div>

<hr class="wp-block-separator has-css-opacity is-style-wide"/>

<h2 class="wp-block-heading" id="回顾算法流程-1">回顾算法流程</h2>

<ol class="wp-block-list">
<li> 求取已知点的距离以及点对的半方差</li>

<li> 筛选第一步求取的结果，计算出几个均值点，用于拟合</li>

<li> 选定拟合模型，为了方便代码实现，我选择了指数模型</li>

<li> 用指数模型去拟合第二步得出的均值点，得出偏基台值 <img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-7be173e8e81928a3f63b59c4117635e0_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#99;" title="Rendered by QuickLaTeX.com" height="8" width="9" style="vertical-align: 0px;"/> 和主变程值 <img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-a05d21231b95a3cca8e9f374ca9465cb_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#114;" title="Rendered by QuickLaTeX.com" height="8" width="9" style="vertical-align: 0px;"/></li>

<li> 根据拟合得到的模型，按照公式通过已知点高程计算位置点高程 <br></li>
</ol>

<hr class="wp-block-separator has-css-opacity is-style-wide"/>

<h2 class="wp-block-heading" id="通过c实现的难点">通过C#实现的难点</h2>

<p class="wp-block-paragraph">在试图实现这个算法的过程中，首先碰到的难题是算法不懂，但是这个问题已经解决了。接下来的难题是，如何用C#进行离散点的拟合，以及如何高效的实现算法中公式的矩阵运算。</p>

<p class="wp-block-paragraph">为了解决以上的问题，我利用了网络上的C#的数学库，比较好的有：开源的“<strong>Math.NET</strong>”，以及收费的“<strong>ILNumerics</strong>”，我选用了“<strong>Math.NET</strong>”。</p>

<p class="wp-block-paragraph">如何将Math.NET加入到自己的项目中：参考网页：<a href="https://www.nuget.org/packages/MathNet.Numerics/%20Math.NET%20Numerics" target="_blank" rel="noopener">Math.NET Numerics</a></p>

<p class="wp-block-paragraph">在VS的主界面上，选择“工具”=&gt;“NuGet程序包管理器”=&gt;“程序包管理器控制台”，可以看到这样的界面：</p>

<div class="wp-block-image">
<figure class="aligncenter"><img loading="lazy" decoding="async" width="1024" height="223" src="/wp-content/uploads/2019/07/gis-2-1-1024x223.jpg" alt="" class="wp-image-171" srcset="/wp-content/uploads/2019/07/gis-2-1-1024x223.jpg 1024w, /wp-content/uploads/2019/07/gis-2-1-300x65.jpg 300w, /wp-content/uploads/2019/07/gis-2-1-768x167.jpg 768w, /wp-content/uploads/2019/07/gis-2-1.jpg 1106w" sizes="auto, (max-width: 1024px) 100vw, 1024px" /><figcaption class="wp-element-caption">NuGet</figcaption></figure>
</div>

<p class="wp-block-paragraph">输入“Install-Package MathNet.Numerics”后，回车，等待片刻即可。</p>

<hr class="wp-block-separator has-css-opacity is-style-wide"/>

<h2 class="wp-block-heading" id="算法实现">算法实现</h2>

<h3 class="wp-block-heading" id="1求取已知点的距离以及点对的半方差">求取已知点的距离以及点对的半方差</h3>

<p class="wp-block-paragraph">点对的半方差计算公式：</p>

<p class="wp-block-paragraph"><p class="ql-center-displayed-equation" style="line-height: 38px;"><span class="ql-right-eqno"> &nbsp; </span><span class="ql-left-eqno"> &nbsp; </span><img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-968b74ead7a834626635dc8fdbb0b64e_l3.png" height="38" width="414" class="ql-img-displayed-equation quicklatex-auto-format" alt="&#92;&#91;&#83;&#101;&#109;&#105;&#118;&#97;&#114;&#105;&#111;&#103;&#114;&#97;&#109;&#40;&#100;&#105;&#115;&#116;&#97;&#110;&#99;&#101;&#95;&#104;&#41;&#61;&#123;&#49;&#92;&#111;&#118;&#101;&#114;&#50;&#125;&#8727;&#40;&#118;&#97;&#108;&#117;&#101;&#95;&#105;&#45;&#118;&#97;&#108;&#117;&#101;&#95;&#106;&#41;&#94;&#50;&#92;&#93;" title="Rendered by QuickLaTeX.com"/></p></p>

<p class="wp-block-paragraph">计算结果为一堆横坐标为<img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-42ad5bee56bcf4ccd4709deaefa3c2c0_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#100;&#105;&#115;&#116;&#97;&#110;&#99;&#101;&#95;&#104;" title="Rendered by QuickLaTeX.com" height="16" width="78" style="vertical-align: -3px;"/>，纵坐标为<img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-c46d24e92206010dc2931646c32b2cec_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#83;&#101;&#109;&#105;&#118;&#97;&#114;&#105;&#111;&#103;&#114;&#97;&#109;&#40;&#100;&#105;&#115;&#116;&#97;&#110;&#99;&#101;&#95;&#104;&#41;" title="Rendered by QuickLaTeX.com" height="18" width="226" style="vertical-align: -4px;"/>的点。</p>

<p class="wp-block-paragraph">将这些点按照横坐标分为约10份，（此处可按照实际情况修改），计算每个区间里的点的横坐标纵坐标均值，这样就能得到10个点代表刚刚的整个计算结果。</p>

<p class="wp-block-paragraph">如果点数过多，拟合的效果以及效率会受到影响。</p>

<h3 class="wp-block-heading" id="2拟合刚刚计算得到的点">拟合刚刚计算得到的点</h3>

<p class="wp-block-paragraph">拟合的方法我参考了文章”使用Math.NET求解线性和非线性最小二乘问题“，原链接已失效，读者可以尝试下根据文章标题搜索一下。这篇文章翻译自” Linear And Nonlinear Least-Squares With Math.NET “，同样失效，自行搜索。</p>

<p class="wp-block-paragraph">我提取了文章中的高斯牛顿法实现的拟合算法，主要由“GaussNewtonSolver”类和“PowerModel”类组成，读者也可以试着使用示例代码所提供的别的拟合算法来完成。</p>

<p class="wp-block-paragraph">下图是我的DEM：</p>

<div class="wp-block-image">
<figure class="aligncenter"><img loading="lazy" decoding="async" width="185" height="342" src="/wp-content/uploads/2019/07/gis-2-2.jpg" alt="" class="wp-image-172" srcset="/wp-content/uploads/2019/07/gis-2-2.jpg 185w, /wp-content/uploads/2019/07/gis-2-2-162x300.jpg 162w" sizes="auto, (max-width: 185px) 100vw, 185px" /><figcaption class="wp-element-caption">DEM及在上面选取的随机点</figcaption></figure>
</div>

<p class="wp-block-paragraph">我在已知的DEM上选取随机点，再利用这些随机点进行插值，方便比较计算结果与原始值。</p>

<p class="wp-block-paragraph">下图是这些随机点的半方差拟合结果：</p>

<div class="wp-block-image">
<figure class="aligncenter"><img loading="lazy" decoding="async" width="608" height="423" src="/wp-content/uploads/2019/07/gis-2-3.jpg" alt="" class="wp-image-173" srcset="/wp-content/uploads/2019/07/gis-2-3.jpg 608w, /wp-content/uploads/2019/07/gis-2-3-300x209.jpg 300w" sizes="auto, (max-width: 608px) 100vw, 608px" /><figcaption class="wp-element-caption">拟合结果</figcaption></figure>
</div>

<p class="wp-block-paragraph">红色的点是初始计算的结果，实际上已经做过一次筛选了，因为选取的随机点约100个，初步计算出来的半方差值约有9900个。蓝色的叉叉是再次筛选后的结果，每隔10个单位的区间计算一个平均点。深蓝色的线即为对蓝色叉叉的拟合。</p>

<p class="wp-block-paragraph"><strong>实际上，我用同样的离散点在ArcGIS中做一次插值，我的拟合结果与ArcGIS的拟合结果有一定差距，偏基台值基本一致，主变程值只有ArcGIS的拟合结果的一半，如果追求准确的插值结果，需要考虑对拟合算法的优化。</strong></p>

<h3 class="wp-block-heading" id="3根据拟合模型计算未知点高程">根据拟合模型计算未知点高程</h3>

<p class="wp-block-paragraph">以下提到的数学参数请对照上篇《实现克里金(kriging)插值（一）计算原理》一文中的定义。</p>

<p class="wp-block-paragraph">定义方法：</p>

<pre class="EnlighterJSRAW" data-enlighter-language="csharp" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">private double CalCij(double x1, double y1, double x2, double y2)
{
	double distance = Math.Sqrt(
		Math.Pow(x1 - x2, 2) + Math.Pow(y1 - y2, 2));
	if (distance == 0)
	{
		return formula_c;
	}
	else
	{
		return formula_c* Math.Exp(-distance / formula_r);
	}
}</pre>

<p class="wp-block-paragraph">计算两点之间的<img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-f33944ba15bd3213599745930fe86c35_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#67;&#95;&#123;&#105;&#106;&#125;" title="Rendered by QuickLaTeX.com" height="18" width="24" style="vertical-align: -6px;"/>值，<img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-16fcde3d17724a7223c10015d3f8d602_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#99;&#95;&#123;&#105;&#106;&#125;&#61;&#99;&#8722;&#114;&#40;&#104;&#95;&#123;&#105;&#106;&#125;&#41;" title="Rendered by QuickLaTeX.com" height="20" width="99" style="vertical-align: -6px;"/>，其中 <img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-82882156da3b00424c289725fca1ab2b_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#114;&#40;&#104;&#95;&#123;&#105;&#106;&#125;&#41;" title="Rendered by QuickLaTeX.com" height="20" width="46" style="vertical-align: -6px;"/> 就是上一步中拟合得到的模型结果，<img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-7be173e8e81928a3f63b59c4117635e0_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#99;" title="Rendered by QuickLaTeX.com" height="8" width="9" style="vertical-align: 0px;"/> 就是模型结果中的一个值。</p>

<p class="wp-block-paragraph">计算矩阵 <img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-7de099388b5cfc2d83fefad8ad5668f8_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#75;" title="Rendered by QuickLaTeX.com" height="12" width="17" style="vertical-align: 0px;"/>：</p>

<pre class="EnlighterJSRAW" data-enlighter-language="csharp" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">//size为已知点的个数
var K = new DenseMatrix(size, size);
for (int m = 0; m &lt; size; m++)
		for (int n = 0; n &lt; size; n++)
			K[m, n] = CalCij(
			 pointList[m].X,
			 pointList[m].Y, 
			 pointList[n].X,
			 pointList[n].Y);</pre>

<p class="wp-block-paragraph">计算矩阵 <img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-7de099388b5cfc2d83fefad8ad5668f8_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#75;" title="Rendered by QuickLaTeX.com" height="12" width="17" style="vertical-align: 0px;"/> 的逆矩阵<img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-c50f234edcc77997e0e063019cff3fa3_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#75;&#94;&#123;&#45;&#49;&#125;" title="Rendered by QuickLaTeX.com" height="16" width="35" style="vertical-align: 0px;"/>：</p>

<pre class="EnlighterJSRAW" data-enlighter-language="csharp" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">Kn = K.Inverse();</pre>

<p class="wp-block-paragraph">假设求坐标为 <img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-81c285d06928d5fa2eb2d912b7c25e55_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#40;&#109;&#44;&#110;&#41;" title="Rendered by QuickLaTeX.com" height="18" width="48" style="vertical-align: -4px;"/> 的未知点的高程：</p>

<p class="wp-block-paragraph">1. 计算向量 <img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-f0d278ca3f193357805a7765d9ffb155_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#68;" title="Rendered by QuickLaTeX.com" height="12" width="15" style="vertical-align: 0px;"/>：</p>

<pre class="EnlighterJSRAW" data-enlighter-language="csharp" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">var D = new DenseVector(size);
for (int p = 0; p &lt; size; p++)
	D[p] = CalCij(randomPointList[p].point.X,
		randomPointList[p].point.Y, m, n);</pre>

<p class="wp-block-paragraph">2. 计算<img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-1a19bd6d72878ce05761b2de6dbcbac3_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&lambda;&#40;&#105;&#41;" title="Rendered by QuickLaTeX.com" height="18" width="18" style="vertical-align: -4px;"/>，表示第 <img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-299289f085d0706bdefa9bbba17ee7ec_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#105;" title="Rendered by QuickLaTeX.com" height="12" width="6" style="vertical-align: 0px;"/> 个已知点对当前未知点的影响权重：</p>

<pre class="EnlighterJSRAW" data-enlighter-language="csharp" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">var namuta = Kn.LeftMultiply(D);</pre>

<p class="wp-block-paragraph">3. 计算 <img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-3846934cfcc6d2e6a5fcac6a722ca1bc_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#90;&#40;&#120;&#95;&#105;&#41;" title="Rendered by QuickLaTeX.com" height="18" width="43" style="vertical-align: -4px;"/>，即为第 <img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-299289f085d0706bdefa9bbba17ee7ec_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#105;" title="Rendered by QuickLaTeX.com" height="12" width="6" style="vertical-align: 0px;"/> 个点的高程值：</p>

<pre class="EnlighterJSRAW" data-enlighter-language="csharp" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">for (int q = 0; q &lt; size; q++)
	interpolationDEMData[m, n] += 
		namuta[q] * randomPointList[q].altitudeValue;</pre>

<p class="wp-block-paragraph">至此，坐标为 <img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-81c285d06928d5fa2eb2d912b7c25e55_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#40;&#109;&#44;&#110;&#41;" title="Rendered by QuickLaTeX.com" height="18" width="48" style="vertical-align: -4px;"/> 的未知点的高程就求得了，存在了 <img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-4c4bdd2040e2622171922430927f447a_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#105;&#110;&#116;&#101;&#114;&#112;&#111;&#108;&#97;&#116;&#105;&#111;&#110;&#68;&#69;&#77;&#68;&#97;&#116;&#97;" title="Rendered by QuickLaTeX.com" height="17" width="205" style="vertical-align: -4px;"/> 数组中。</p>

<p class="wp-block-paragraph">下图为插值结果：</p>

<div class="wp-block-image">
<figure class="aligncenter"><img loading="lazy" decoding="async" width="567" height="370" src="/wp-content/uploads/2019/07/gis-2-4.jpg" alt="" class="wp-image-174" srcset="/wp-content/uploads/2019/07/gis-2-4.jpg 567w, /wp-content/uploads/2019/07/gis-2-4-300x196.jpg 300w" sizes="auto, (max-width: 567px) 100vw, 567px" /><figcaption class="wp-element-caption">插值比较</figcaption></figure>
</div>

<p class="wp-block-paragraph">结果与原始数据相比较，还是比较准确的。</p>
