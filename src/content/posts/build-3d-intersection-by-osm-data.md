---
title: "基于 OSM 路网数据生成立体立交道路的尝试"
description: "之所以要做这么一件事情是因为在玩《Cities: Skylines》时，游戏内的立交建造比较繁琐，却又很重要。于是就萌生了做一个从目前已有的二维地图道路数据自动生成立体的立交道路的工具的想法。 尝试用线性规划来达到这样的目的。"
pubDatetime: 2018-05-20T14:48:13.000Z
modDatetime: 2023-01-03T10:02:43.000Z
draft: false
tags: ["kml","Linear Optimization","openstreetmap","ortools","osm","postgis","立交","GIS","算法"]
---
<h2 class="wp-block-heading">简介</h2>

<p class="wp-block-paragraph">之所以要做这么一件事情是因为在玩《<a rel="noreferrer noopener" aria-label=" (opens in a new tab)" href="https://store.steampowered.com/app/255710/Cities_Skylines/" target="_blank">Cities: Skylines</a>》时，游戏内的立交建造比较繁琐，又很重要。于是就萌生了做一个从目前已有的二维地图道路数据自动生成立体的立交道路的工具的想法。</p>

<p class="wp-block-paragraph">以延安东路立交桥为例，第一张是平面展示效果，第二张是立体展示效果：</p>

<figure class="wp-block-gallery has-nested-images columns-default is-cropped wp-block-gallery-16 is-layout-flex wp-block-gallery-is-layout-flex">
<figure class="wp-block-image size-large"><img loading="lazy" decoding="async" width="577" height="1024" data-id="191" src="/wp-content/uploads/2019/07/gis-3-2-577x1024.png" alt="" class="wp-image-191" srcset="/wp-content/uploads/2019/07/gis-3-2-577x1024.png 577w, /wp-content/uploads/2019/07/gis-3-2-169x300.png 169w, /wp-content/uploads/2019/07/gis-3-2.png 640w" sizes="auto, (max-width: 577px) 100vw, 577px" /><figcaption class="wp-element-caption">1. 平面效果，截取自苹果地图</figcaption></figure>

<figure class="wp-block-image size-large"><img loading="lazy" decoding="async" width="577" height="1024" data-id="192" src="/wp-content/uploads/2019/07/gis-3-1-1-577x1024.png" alt="" class="wp-image-192" srcset="/wp-content/uploads/2019/07/gis-3-1-1-577x1024.png 577w, /wp-content/uploads/2019/07/gis-3-1-1-169x300.png 169w, /wp-content/uploads/2019/07/gis-3-1-1.png 640w" sizes="auto, (max-width: 577px) 100vw, 577px" /><figcaption class="wp-element-caption">2. 立体效果，截取自百度地图</figcaption></figure>
</figure>

<p class="wp-block-paragraph">如果能用第二张图中的道路数据，导入到游戏中，想必很实用。所以，接下来的内容就是介绍我的想法，关于如何从图一中的数据计算得到图二中的数据。</p>

<!--more-->

<h2 class="wp-block-heading">计算原理</h2>

<p class="wp-block-paragraph">道路在平面上的坐标是已知的，但是要如何才能把道路在垂直方向上的坐标计算出来呢？或者说，道路的哪些属性能够帮助到我们？</p>

<p class="wp-block-paragraph">如果在 OSM 上编辑过复杂一点的道路数据的话，可能会注意到一个属性，用来体现道路之间的压盖层级的。</p>

<ul class="wp-block-list">
<li>例1：东西方向的A路为高架路，南北方向的B路为普通地面道路，则A路的层级比B路高。</li>

<li>例2：东西方向的C路为地下隧道，南北方向的D路为普通地面道路，则C路的层级比D路低。</li>
</ul>

<p class="wp-block-paragraph">这个压盖层级在在 OSM 编辑地图数据的时候，使用的名称为“<a rel="noreferrer noopener" aria-label="Layer (opens in a new tab)" href="https://wiki.openstreetmap.org/wiki/Layer" target="_blank">Layer</a>”，进入到后台数据库后则体现到了“z_order”这个字段上。这个属性的最直接的意义就在于，渲染地图的时候， 渲染引擎能够知道同一位置上叠加的道路的渲染顺序。</p>

<p class="wp-block-paragraph">既然已经能够知道道路在垂直方向上的排列顺序，那么，再结合一些额外的信息，是可以计算得到道路上的一个节点的高度值的，或者至少说是一个节点的取值范围。</p>

<p class="wp-block-paragraph">这里的额外信息，指的是以下这些：</p>

<ul class="wp-block-list">
<li>上下相邻的两条道路高度差存在一个最小值，假设为4米。</li>

<li>一条道路上的相邻的2个节点之间的坡度值小于一个定值，假设为6%。</li>

<li>属性为地面类型的，高度固定为0米。</li>

<li>属性为高架类型的，高度至少为4米。</li>
</ul>

<p class="wp-block-paragraph">还要有一个假设：</p>

<ul class="wp-block-list">
<li>立交桥所处的范围内的地面高度都为0米，不考虑地势对道路的影响。</li>
</ul>

<p class="wp-block-paragraph">根据以上的条件，把每条道路上的每个点的高度值作为一个未知数，可以列出一个不等式方程组。</p>

<p class="wp-block-paragraph">那问题又来了，怎么解？好像解不了。那就还要再引入一个假设：</p>

<ul class="wp-block-list">
<li>组成立交的每一条道路都尽可能的低，为了减少造价。</li>
</ul>

<p class="wp-block-paragraph">上面的这个假设实际上是一个目标函数。于是，问题就变成了，有了约束条件， 求目标函数的最优解，一个普通的线性规划问题。</p>

<h2 class="wp-block-heading">数据准备</h2>

<h3 class="wp-block-heading">数据获取</h3>

<p class="wp-block-paragraph">OSM 的数据可以很方便的下载到，这里不再赘述。我分别选取了上海，约翰内斯堡，西雅图这三个城市的各一座立交桥作为测试数据。（实际上最终只在上海的延安东路立交桥和莘庄立交上做了尝试）</p>

<figure class="wp-block-image"><img loading="lazy" decoding="async" width="1024" height="569" src="/wp-content/uploads/2019/08/gis-3-3-1024x569.png" alt="" class="wp-image-219" srcset="/wp-content/uploads/2019/08/gis-3-3-1024x569.png 1024w, /wp-content/uploads/2019/08/gis-3-3-300x167.png 300w, /wp-content/uploads/2019/08/gis-3-3-768x427.png 768w, /wp-content/uploads/2019/08/gis-3-3.png 1149w" sizes="auto, (max-width: 1024px) 100vw, 1024px" /><figcaption class="wp-element-caption">OSM 中上海市延安东路立交的数据</figcaption></figure>

<h3 class="wp-block-heading">数据加工</h3>

<p class="wp-block-paragraph">单次计算只针对一个立交桥，并且不涉及除立交道路以外的道路，例如立交下的普通的城市道路。所以需要对数据进行筛选并提取。</p>

<p class="wp-block-paragraph">按道路属性进行筛选的时候需要注意，高速公路的道路类型和城市快速路的类型可能会不一样。</p>

<h3 class="wp-block-heading">数据命名</h3>

<p class="wp-block-paragraph">对道路的高度值的计算，实际上是计算道路上各个点的高度值。为了方便计算，需要把道路上的点分为4类：</p>

<ul class="wp-block-list">
<li>交叉点（Cross Point）：简称<img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-1fef0c81c8e49fcb56e9746be8c5163a_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#67;&#80;" title="Rendered by QuickLaTeX.com" height="12" width="30" style="vertical-align: 0px;"/>。两条不同的道路，在正视时形成的交叉点，但实际上因为两条道路高度必然不一样，实际中并没有相交。这样同一个交叉点最终对应了2个需要计算的未知数，分别对应两条不同的道路。</li>

<li>接触点（Touch Point）：简称<img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-541a78a21c0234252599cef75a6609d0_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#84;&#80;" title="Rendered by QuickLaTeX.com" height="12" width="29" style="vertical-align: 0px;"/>。匝道与主道进行合并时形成的点，一个接触点实际上对应了2条道路。</li>

<li>终点（End Point）：简称<img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-e9544d6f04482024c59d9411288bf6ca_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#69;&#80;" title="Rendered by QuickLaTeX.com" height="12" width="30" style="vertical-align: 0px;"/>。道路两端的点。</li>

<li>普通点（Normal Point）：简称<img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-010ea67a7743712b3a5d22426f65bb2c_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#78;&#80;" title="Rendered by QuickLaTeX.com" height="12" width="32" style="vertical-align: 0px;"/>。除了以上三种类型以外的点。</li>
</ul>

<p class="wp-block-paragraph">最终需要计算的是前3类点，第四类点可以在线性规划完成后通过插值来计算。</p>

<h2 class="wp-block-heading">算法实现</h2>

<h3 class="wp-block-heading">空间关系</h3>

<p class="wp-block-paragraph">所有提到的涉及到空间关系的计算方式，均由PostGIS完成。此处不是文章的重点，不细说，详情请参考文档“<a href="https://postgis.net/docs/manual-2.4/" target="_blank" rel="noopener">https://postgis.net/docs/manual-2.4/</a>”。仅罗列一下部分用到的函数。</p>

<ul class="wp-block-list">
<li>计算道路交叉点：ST_Intersection()</li>

<li>去除重复点：ST_Removerepeatedpoints()<em>（由于精度问题，需要用PostGIS的函数来实现，而不是SQL）</em></li>

<li>合并多条线：ST_LineMerge()</li>

<li>判断要素是否有公共点：ST_Touches()</li>
</ul>

<h3 class="wp-block-heading">约束条件</h3>

<p class="wp-block-paragraph"><em>下面的公式写的可能不规范，如有错误请指出。</em></p>

<ul class="wp-block-list">
<li>根据道路属性，如果是地面道路则高度衡定为0，如果是高架道路，则高度大于等于3。暂不考虑隧道类型的道路。</li>
</ul>

<p class="wp-block-paragraph"><p class="ql-center-displayed-equation" style="line-height: 57px;"><span class="ql-right-eqno"> &nbsp; </span><span class="ql-left-eqno"> &nbsp; </span><img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-7ef25334def44480b990c34ac594d979_l3.png" height="57" width="377" class="ql-img-displayed-equation quicklatex-auto-format" alt="&#92;&#91;&#92;&#98;&#101;&#103;&#105;&#110;&#123;&#99;&#97;&#115;&#101;&#115;&#125;&#32;&#32;&#72;&#101;&#105;&#103;&#104;&#116;&#40;&#80;&#95;&#105;&#41;&#32;&#61;&#32;&#48;&#44;&#32;&#32;&#38;&#32;&#84;&#121;&#112;&#101;&#40;&#114;&#111;&#97;&#100;&#95;&#105;&#41;&#32;&#61;&#32;&#66;&#114;&#105;&#100;&#103;&#101;&#32;&#92;&#92;&#32;&#32;&#72;&#101;&#105;&#103;&#104;&#116;&#40;&#80;&#95;&#105;&#41;&#32;&#62;&#61;&#32;&#51;&#44;&#32;&#38;&#32;&#84;&#121;&#112;&#101;&#40;&#114;&#111;&#97;&#100;&#95;&#105;&#41;&#32;&#60;&#62;&#32;&#66;&#114;&#105;&#100;&#103;&#101;&#32;&#32;&#92;&#101;&#110;&#100;&#123;&#99;&#97;&#115;&#101;&#115;&#125;&#92;&#93;" title="Rendered by QuickLaTeX.com"/></p></p>

<ul class="wp-block-list">
<li>两点之间的坡度要小于等于指定值，注意，这里的<img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-c623cbfbe4c308a111292c65f4b43d4e_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#76;&#69;&#78;&#71;&#84;&#72;" title="Rendered by QuickLaTeX.com" height="12" width="90" style="vertical-align: 0px;"/>指的并不是两点之间的直线距离，二是沿道路前进曲线的距离。</li>
</ul>

<p class="wp-block-paragraph"><p class="ql-center-displayed-equation" style="line-height: 19px;"><span class="ql-right-eqno"> &nbsp; </span><span class="ql-left-eqno"> &nbsp; </span><img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-d6fbb7a98397118e6bb84ce9c0e87dad_l3.png" height="19" width="517" class="ql-img-displayed-equation quicklatex-auto-format" alt="&#92;&#91;&#92;&#109;&#105;&#100;&#32;&#72;&#101;&#105;&#103;&#104;&#116;&#40;&#80;&#95;&#105;&#41;&#32;&#45;&#32;&#72;&#101;&#105;&#103;&#104;&#116;&#40;&#80;&#95;&#123;&#105;&#43;&#49;&#125;&#41;&#92;&#109;&#105;&#100;&#32;&#42;&#32;&#76;&#69;&#78;&#71;&#84;&#72;&#32;&#60;&#61;&#32;&#77;&#65;&#88;&#92;&#95;&#83;&#76;&#79;&#80;&#69;&#92;&#93;" title="Rendered by QuickLaTeX.com"/></p></p>

<ul class="wp-block-list">
<li>上文提到的两条不同高度的道路在正视时会存在交叉点，这个交叉点实际上是2个点，平面坐标是一样的，但是高度不一样。根据道路的“z_order”属性，可以知道这两个点，哪个在上，哪个在下。</li>
</ul>

<p class="wp-block-paragraph"><p class="ql-center-displayed-equation" style="line-height: 20px;"><span class="ql-right-eqno"> &nbsp; </span><span class="ql-left-eqno"> &nbsp; </span><img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-d698ff37981319f515980a3d3b451cfb_l3.png" height="20" width="499" class="ql-img-displayed-equation quicklatex-auto-format" alt="&#92;&#91;&#72;&#101;&#105;&#103;&#104;&#116;&#40;&#67;&#80;&#95;&#123;&#104;&#105;&#103;&#104;&#125;&#41;&#32;&#45;&#32;&#72;&#101;&#105;&#103;&#104;&#116;&#40;&#67;&#80;&#95;&#123;&#108;&#111;&#119;&#125;&#41;&#32;&#62;&#61;&#32;&#77;&#73;&#78;&#92;&#95;&#69;&#76;&#69;&#86;&#65;&#84;&#73;&#79;&#78;&#92;&#93;" title="Rendered by QuickLaTeX.com"/></p></p>

<h3 class="wp-block-heading">目标函数</h3>

<p class="wp-block-paragraph">目标就是“组成立交的每一条道路都尽可能的低，为了减少造价”。所以需要使得道路的线数据中所有点的高度值之和最小：</p>

<p class="wp-block-paragraph"><p class="ql-center-displayed-equation" style="line-height: 54px;"><span class="ql-right-eqno"> &nbsp; </span><span class="ql-left-eqno"> &nbsp; </span><img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-506537e590285f6dfc4c8436bffb7fd2_l3.png" height="54" width="420" class="ql-img-displayed-equation quicklatex-auto-format" alt="&#92;&#91;&#83;&#61;&#92;&#115;&#117;&#109;&#95;&#123;&#105;&#61;&#49;&#125;&#94;&#109;&#92;&#72;&#101;&#105;&#103;&#104;&#116;&#40;&#67;&#80;&#95;&#109;&#41;&#43;&#92;&#115;&#117;&#109;&#95;&#123;&#105;&#61;&#49;&#125;&#94;&#110;&#92;&#72;&#101;&#105;&#103;&#104;&#116;&#40;&#84;&#80;&#95;&#110;&#41;&#43;&#92;&#115;&#117;&#109;&#95;&#123;&#105;&#61;&#49;&#125;&#94;&#112;&#92;&#72;&#101;&#105;&#103;&#104;&#116;&#40;&#69;&#80;&#95;&#112;&#41;&#43;&#92;&#115;&#117;&#109;&#95;&#123;&#105;&#61;&#49;&#125;&#94;&#113;&#92;&#72;&#101;&#105;&#103;&#104;&#116;&#40;&#78;&#80;&#95;&#113;&#41;&#92;&#93;" title="Rendered by QuickLaTeX.com"/></p> </p>

<h3 class="wp-block-heading">线性规划求解</h3>

<p class="wp-block-paragraph">求解线性规划使用了 Google 的 <a href="https://developers.google.com/optimization/" target="_blank" rel="noopener">ortools</a> 库，参考文档链接：<a href="https://developers.google.com/optimization/lp" target="_blank" rel="noopener">Linear Optimization</a>，以下的代码中的英文注释是文档里的，我就不翻译了，免得不达意而引起误解。</p>

<p class="wp-block-paragraph">创建一个解决线性规划问题的对象：</p>

<pre class="EnlighterJSRAW" data-enlighter-language="python" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">from ortools.linear_solver import linear_solver_pb2, pywraplp

# Create the linear solver with the GLOP backend.
solver = pywraplp.Solver('road_3D', pywraplp.Solver.GLOP_LINEAR_PROGRAMMING)</pre>

<p class="wp-block-paragraph">定义变量，并可以在初始化时就指定变量的取值范围：</p>

<pre class="EnlighterJSRAW" data-enlighter-language="python" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">for _n in range(0, len(cross_points)):
    cp_list.append(solver.NumVar(0, solver.infinity(), 'cp_{id:02d}'.format(id=_n)))

for _n in range(0, len(touch_points)):
    tp_list.append(solver.NumVar(0, solver.infinity(), 'tp_{id:02d}'.format(id=_n)))

for _n in range(0, len(end_points)):
    ep_list.append(solver.NumVar(0, solver.infinity(), 'ep_{id:02d}'.format(id=_n)))</pre>

<p class="wp-block-paragraph">实现上述的约束条件的表达，以“两点之间的坡度要小于等于指定值”为例：</p>

<pre class="EnlighterJSRAW" data-enlighter-language="python" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">constraint = solver.Constraint(-distance * MAX_SLOPE, distance * MAX_SLOPE)
constraint.SetCoefficient(cp_list[m], 1)
constraint.SetCoefficient(cp_list[n], -1)</pre>

<p class="wp-block-paragraph">声明目标函数的对象，并设置为求最小值：</p>

<pre class="EnlighterJSRAW" data-enlighter-language="python" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">objective = solver.Objective()
objective.SetMinimization()

for _n in range(0, len(cross_points)):
    objective.SetCoefficient(cp_list[_n], 1)

for _n in range(0, len(touch_points)):
    objective.SetCoefficient(tp_list[_n], 1)

for _n in range(0, len(end_points)):
    objective.SetCoefficient(ep_list[_n], 1)</pre>

<p class="wp-block-paragraph">求解：</p>

<pre class="EnlighterJSRAW" data-enlighter-language="python" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">solver.Solve()

# 输出一个求解结果
print(cp_list[_n].solution_value())</pre>

<h3 class="wp-block-heading">“异常下降”</h3>

<p class="wp-block-paragraph">这样的模型实际上是存在一个问题的，假设在一条道路上选取连续的3个点，分别为A，B，C，点A和点C的下方因为存在道路，所以高度最终计算得到为4米，点B的下方没有道路，那么点B的高度为多少？</p>

<p class="wp-block-paragraph">按照常识，点B的高度应该也是4米。但是按照上面的模型，点B会在坡度限制范围内尽可能的低，那么实际生成出来的道路就会呈现出一个异常的下降，根据我朴素的日常经验来看，这是不应该的。</p>

<p class="wp-block-paragraph">目前的做法就是在线性规划计算完成后，再对数据进行一遍检查，弥补这样的问题。</p>

<h2 class="wp-block-heading">结果预览</h2>

<p class="wp-block-paragraph">在上面求出结果之后，还需要有一些后续的处理流程，比如整合，插值，按指定格式输出等。目前是将数据保存到 PostgreSQL 数据库中，并输出为kml格式的文件，方便在 Google Earth 中查看。</p>

<div class="wp-block-cp-codepen-gutenberg-embed-block cp_embed_wrapper"><iframe id="cp_embed_RwyGxrm" src="//codepen.io/anon/embed/RwyGxrm?height=500&amp;theme-id=1&amp;slug-hash=RwyGxrm&amp;default-tab=result" height="500" scrolling="no" frameborder="0" allowfullscreen allowpaymentrequest name="CodePen Embed RwyGxrm" title="CodePen Embed RwyGxrm" class="cp_embed_iframe" style="width:100%;overflow:hidden">CodePen Embed Fallback</iframe></div>

<h2 class="wp-block-heading">存在的问题</h2>

<ul class="wp-block-list">
<li>存在个别点<img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-5d20894ef2a12996c7e7691e1b192308_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#122;" title="Rendered by QuickLaTeX.com" height="8" width="9" style="vertical-align: 0px;"/>值计算错误的问题。引起这个问题的原因有几个，一个是上面提到的“异常下降”的问题；二是并非所有的立交都会遵守程序所设定的最小高度差和最大坡度；也不排除程序本身存在bug，会使得一些点的<img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-5d20894ef2a12996c7e7691e1b192308_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#122;" title="Rendered by QuickLaTeX.com" height="8" width="9" style="vertical-align: 0px;"/>值为0。</li>

<li>所有的计算都是基于地面为平面进行的，然而在实际生活中并不完全是这样。</li>

<li>因为不清楚《Cities: Skylines》中的数据规格，所以无法把已有的数据导入到游戏中。</li>
</ul>

<p class="wp-block-paragraph">因为懒，这些问题还没有解决。</p>

<p class="wp-block-paragraph">项目地址： <a href="https://github.com/BranZhang/intersection-3d-rebuild" target="_blank" rel="noreferrer noopener" aria-label=" (opens in a new tab)">https://github.com/BranZhang/intersection-3d-rebuild</a> </p>
