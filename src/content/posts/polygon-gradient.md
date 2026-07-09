---
title: "多边形渐变色的实现"
description: "在前端通过多边形直骨架算法实现多边形的内发光/阴影效果。类似于 QGIS 中的“shapeburst fill”。"
pubDatetime: 2022-09-07T10:04:04.000Z
modDatetime: 2023-01-03T09:47:31.000Z
draft: false
tags: ["mapbox","WebGL","可视化","地图","GIS","算法"]
cover: "/wp-content/uploads/2022/09/polygon-gradient-cover-e1672739243762.png"
---
<p class="wp-block-paragraph">渐变效果能够实现多种颜色之间的自然过渡，一般情况下，渐变往往与某种场强度相关，或者说某一个在二维空间内连续变化的数值相关，比如某片地区的气温，海拔高度，一条路径的畅通程度。地图中常见的渐变效果是热力图，分层设色也算渐变吧，只要分的够多。</p>

<figure class="wp-block-gallery has-nested-images columns-default is-cropped wp-block-gallery-8 is-layout-flex wp-block-gallery-is-layout-flex">
<figure class="wp-block-image size-large"><img loading="lazy" decoding="async" width="928" height="950" data-id="11889" src="/wp-content/uploads/2022/12/image-9.png" alt="" class="wp-image-11889" srcset="/wp-content/uploads/2022/12/image-9.png 928w, /wp-content/uploads/2022/12/image-9-293x300.png 293w, /wp-content/uploads/2022/12/image-9-768x786.png 768w" sizes="auto, (max-width: 928px) 100vw, 928px" /><figcaption class="wp-element-caption">热力图</figcaption></figure>

<figure class="wp-block-image size-large"><img loading="lazy" decoding="async" width="597" height="402" data-id="11888" src="/wp-content/uploads/2022/12/image-8.png" alt="" class="wp-image-11888" srcset="/wp-content/uploads/2022/12/image-8.png 597w, /wp-content/uploads/2022/12/image-8-300x202.png 300w" sizes="auto, (max-width: 597px) 100vw, 597px" /><figcaption class="wp-element-caption">基于高程的分层设色</figcaption></figure>

<figure class="wp-block-image size-large"><img loading="lazy" decoding="async" width="394" height="314" data-id="11887" src="/wp-content/uploads/2022/12/image-7.png" alt="" class="wp-image-11887" srcset="/wp-content/uploads/2022/12/image-7.png 394w, /wp-content/uploads/2022/12/image-7-300x239.png 300w" sizes="auto, (max-width: 394px) 100vw, 394px" /><figcaption class="wp-element-caption">线段的渐变</figcaption></figure>
<figcaption class="blocks-gallery-caption wp-element-caption">普通的渐变色</figcaption></figure>

<p class="wp-block-paragraph">渐变色也能用于实现阴影的效果，也就是从灰色过渡为透明的形式，从而使得 2D 的地图更加立体。下图是 iOS 中地图应用的截图，右上角的控件实际上就有阴影，用于与地图做区分。仔细观察的话，地图中水系的边缘也是有向内的阴影的，用于与陆地做区分。</p>

<div class="wp-block-group"><div class="wp-block-group__inner-container is-layout-constrained wp-block-group-is-layout-constrained">
<!--more-->
</div></div>

<div class="wp-block-image">
<figure class="aligncenter size-large is-resized"><img loading="lazy" decoding="async" src="/wp-content/uploads/2022/12/image-10-1024x730.png" alt="" class="wp-image-11890" width="589" height="420" srcset="/wp-content/uploads/2022/12/image-10-1024x730.png 1024w, /wp-content/uploads/2022/12/image-10-300x214.png 300w, /wp-content/uploads/2022/12/image-10-768x547.png 768w, /wp-content/uploads/2022/12/image-10.png 1222w" sizes="auto, (max-width: 589px) 100vw, 589px" /><figcaption class="wp-element-caption">渐变色作为阴影的使用</figcaption></figure>
</div>

<p class="wp-block-paragraph">CSS3 的渐变效果在地图中的应用也是有的。比较常见的方式是，先将 CSS3 的径向渐变效果绘制在 canvas 上，再将 canvas 叠加到地图上。这样可以实现圆形的渐变效果，可以用于展示点的缓冲区范围。</p>

<p class="wp-block-paragraph">然而问题在于，CSS3 的径向渐变只能以圆形或者方形呈现，碰上不规则的多边形，效果就不是那么好看了。以下图为例：圆形的渐变效果贴在了各个行政区的表面，但是与行政区的轮廓不匹配。</p>

<div class="wp-block-image">
<figure class="aligncenter size-large is-resized"><img loading="lazy" decoding="async" src="/wp-content/uploads/2022/12/image-6-1024x585.png" alt="" class="wp-image-11886" width="614" height="351" srcset="/wp-content/uploads/2022/12/image-6-1024x585.png 1024w, /wp-content/uploads/2022/12/image-6-300x171.png 300w, /wp-content/uploads/2022/12/image-6-768x439.png 768w, /wp-content/uploads/2022/12/image-6-1536x878.png 1536w, /wp-content/uploads/2022/12/image-6.png 1641w" sizes="auto, (max-width: 614px) 100vw, 614px" /><figcaption class="wp-element-caption">Cesium 中的渐变效果（网图）</figcaption></figure>
</div>

<p class="wp-block-paragraph">在一些桌面端的 GIS 软件中，是有多边形渐变的效果的，比如 QGIS。在 QGIS 里这一效果叫“shapeburst fill”。用来突出显示一个区域，或者显示水系的阴影。</p>

<figure class="wp-block-gallery aligncenter has-nested-images columns-default is-cropped wp-block-gallery-9 is-layout-flex wp-block-gallery-is-layout-flex">
<figure class="wp-block-image size-large"><img loading="lazy" decoding="async" width="373" height="319" data-id="11893" src="/wp-content/uploads/2022/12/image-13.png" alt="" class="wp-image-11893" srcset="/wp-content/uploads/2022/12/image-13.png 373w, /wp-content/uploads/2022/12/image-13-300x257.png 300w" sizes="auto, (max-width: 373px) 100vw, 373px" /><figcaption class="wp-element-caption">水系阴影</figcaption></figure>

<figure class="wp-block-image size-large"><img loading="lazy" decoding="async" width="1024" height="569" data-id="11891" src="/wp-content/uploads/2022/12/image-11-1024x569.png" alt="" class="wp-image-11891" srcset="/wp-content/uploads/2022/12/image-11-1024x569.png 1024w, /wp-content/uploads/2022/12/image-11-300x167.png 300w, /wp-content/uploads/2022/12/image-11-768x427.png 768w, /wp-content/uploads/2022/12/image-11.png 1045w" sizes="auto, (max-width: 1024px) 100vw, 1024px" /><figcaption class="wp-element-caption">区域高亮</figcaption></figure>
<figcaption class="blocks-gallery-caption wp-element-caption">shapeburst fill 的应用</figcaption></figure>

<h2 class="wp-block-heading">相关概念</h2>

<p class="wp-block-paragraph">在寻找多边形渐变的实现方案时，我了解到一些相关概念，在此记录一下。</p>

<h3 class="wp-block-heading">Drop shadow</h3>

<p class="wp-block-paragraph">根据维基页面，drop shadow 是一种能够让对象看起来像是被抬升的效果，常用于窗口或者菜单这样的图形交互界面。能够有效的让文本或者图标看起来与背景做区分。下方的示例是 CSS 中 drop-shadow() 的效果。</p>

<div class="wp-block-cp-codepen-gutenberg-embed-block cp_embed_wrapper"><iframe id="cp_embed_MWBWPZv" src="//codepen.io/anon/embed/MWBWPZv?height=550&amp;theme-id=1&amp;slug-hash=MWBWPZv&amp;default-tab=result" height="550" scrolling="no" frameborder="0" allowfullscreen allowpaymentrequest name="CodePen Embed MWBWPZv" title="CodePen Embed MWBWPZv" class="cp_embed_iframe" style="width:100%;overflow:hidden">CodePen Embed Fallback</iframe></div>

<p class="wp-block-paragraph">drop-shadow 比 box-shadow 能够更好的处理不规则多边形的情况。</p>

<h3 class="wp-block-heading">Signed Distance Field（有向距离场）</h3>

<p class="wp-block-paragraph">不同几何形状的 SDF，可以参考这篇文章：<a href="https://iquilezles.org/articles/distfunctions2d/" target="_blank" rel="noopener">https://iquilezles.org/articles/distfunctions2d/</a></p>

<p class="wp-block-paragraph">下面是多边形的 SDF 可视化的结果。SDF 的关键在于计算屏幕上的各个点到对象的最短距离。对于规则的多边形而言，计算可以通过公式完成，但是对于任意形状的多边形，这样的计算开销就有点大了。</p>

<iframe loading="lazy" width="100%" height="400" frameborder="0" src="https://www.shadertoy.com/embed/wdBXRW?gui=true&amp;t=10&amp;paused=true&amp;muted=false" allowfullscreen=""></iframe>

<p class="wp-block-paragraph">下面是每个点的距离计算方式。</p>

<pre class="EnlighterJSRAW" data-enlighter-language="cpp" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">float sdPolygon( in vec2[N] v, in vec2 p )
{
    float d = dot(p-v[0],p-v[0]);
    float s = 1.0;
    for( int i=0, j=N-1; i&lt;N; j=i, i++ )
    {
        vec2 e = v[j] - v[i];
        vec2 w =    p - v[i];
        vec2 b = w - e*clamp( dot(w,e)/dot(e,e), 0.0, 1.0 );
        d = min( d, dot(b,b) );
        bvec3 c = bvec3(p.y>=v[i].y,p.y&lt;v[j].y,e.x*w.y>e.y*w.x);
        if( all(c) || all(not(c)) ) s*=-1.0;  
    }
    return s*sqrt(d);
}
</pre>

<p class="wp-block-paragraph">很多文章也提到了 SDF 在光照，阴影方面的用途，这个之后有机会再展开讲。</p>

<h3 class="wp-block-heading">Straight skeleton（直骨架）</h3>

<p class="wp-block-paragraph">可以先来看一下多边形直骨架的定义：</p>

<blockquote class="wp-block-quote is-layout-flow wp-block-quote-is-layout-flow">
<p class="wp-block-paragraph">从每一条多边形的轮廓边上向多边形内部穿过一个三维的平面，所有的这些平面与多边形的夹角都是相等的，比如：45度，这些平面在三维空间上相交，相交所产生的三维的包围多面体上的边就相当于是多边形的屋顶的棱（可以认为原简单多边形是你家房子的墙壁，然后所生成直骨架就相当于你家的屋顶），然后包围多面体上的所有边和顶点在原简单多边形上进行投影，投影所得到的点和边就是简单多边形的骨架边和骨架顶点。</p>
</blockquote>

<p class="wp-block-paragraph">多边形直骨架和多边形渐变有什么关系呢？多边形的直骨架的生成结果，加上线性的渐变后，能够实现多边形渐变的效果。</p>

<figure class="wp-block-gallery has-nested-images columns-default is-cropped wp-block-gallery-10 is-layout-flex wp-block-gallery-is-layout-flex">
<figure class="wp-block-image size-large"><img loading="lazy" decoding="async" width="914" height="862" data-id="11899" src="/wp-content/uploads/2022/12/image-14.png" alt="" class="wp-image-11899" srcset="/wp-content/uploads/2022/12/image-14.png 914w, /wp-content/uploads/2022/12/image-14-300x283.png 300w, /wp-content/uploads/2022/12/image-14-768x724.png 768w" sizes="auto, (max-width: 914px) 100vw, 914px" /><figcaption class="wp-element-caption">多边形直骨架</figcaption></figure>

<figure class="wp-block-image size-large"><img loading="lazy" decoding="async" width="740" height="700" data-id="11900" src="/wp-content/uploads/2022/12/image-15.png" alt="" class="wp-image-11900" srcset="/wp-content/uploads/2022/12/image-15.png 740w, /wp-content/uploads/2022/12/image-15-300x284.png 300w" sizes="auto, (max-width: 740px) 100vw, 740px" /><figcaption class="wp-element-caption">渐变填充</figcaption></figure>
</figure>

<p class="wp-block-paragraph">多边形直骨架在 GIS 上的应用还有很多，例如：提取多边形的中心线，进而解决多边形内部文本摆放的问题。或者由上方定义可以联想到，多边形直骨架可以用于3D房屋屋顶的生成，或者地形的生成。</p>

<h2 class="wp-block-heading">实现方案</h2>

<p class="wp-block-paragraph">最终采用了多边形直骨架的方案。多边形直骨架能够更好的应对复杂的多边形，例如带孔多边形以及非凸多边形。SDF 的方案在面对大数据量时，计算效率不高。至于在 canvas 上实现 shadow 效果，限制太多，不适用于地图的场景。</p>

<div class="wp-block-image">
<figure class="alignright size-full is-resized"><img decoding="async" src="/wp-content/uploads/2022/12/image-17.png" alt="" class="wp-image-11904" height="150"/><figcaption class="wp-element-caption"><em>尖角形</em>拐角</figcaption></figure>
</div>

<div class="wp-block-image">
<figure class="alignright size-full is-resized"><img loading="lazy" decoding="async" src="/wp-content/uploads/2022/12/image-16.png" alt="" class="wp-image-11903" width="195" height="150"/><figcaption class="wp-element-caption"><em>圆形</em>拐角</figcaption></figure>
</div>

<p class="wp-block-paragraph">直骨架也存在一些缺点，例如：大于180°的角所产生的直骨架线会很长，这一点和绘制带宽度的线类似，需要处理线段拐角的情况。从右边的对比图中可以看出，SDF 输出的是圆形拐角，直骨架算法输出的是尖角形拐角。</p>

<p class="wp-block-paragraph">可以在直骨架算法输出的基础上做些修改，实现类似圆形拐角的效果。依次检查大于 180° 的轮廓顶点，过轮廓顶点做轮廓边的垂线，与内部平分线相交，会产生如下图中所示的淡蓝色的多边形（不一定是三角形），淡蓝色的多边形实际上就是需要处理成圆角的区域，此时需要对淡蓝色多边形做进一步的拆分，并重新计算顶点值即可。</p>

<figure class="wp-block-gallery has-nested-images columns-default is-cropped wp-block-gallery-11 is-layout-flex wp-block-gallery-is-layout-flex">
<figure class="wp-block-image size-large"><img loading="lazy" decoding="async" width="852" height="653" data-id="11905" src="/wp-content/uploads/2022/12/image-18.png" alt="" class="wp-image-11905" srcset="/wp-content/uploads/2022/12/image-18.png 852w, /wp-content/uploads/2022/12/image-18-300x230.png 300w, /wp-content/uploads/2022/12/image-18-768x589.png 768w" sizes="auto, (max-width: 852px) 100vw, 852px" /><figcaption class="wp-element-caption">直骨架算法输出结果</figcaption></figure>

<figure class="wp-block-image size-large"><img loading="lazy" decoding="async" width="852" height="653" data-id="11906" src="/wp-content/uploads/2022/12/image-19.png" alt="" class="wp-image-11906" srcset="/wp-content/uploads/2022/12/image-19.png 852w, /wp-content/uploads/2022/12/image-19-300x230.png 300w, /wp-content/uploads/2022/12/image-19-768x589.png 768w" sizes="auto, (max-width: 852px) 100vw, 852px" /><figcaption class="wp-element-caption">切割钝角</figcaption></figure>
</figure>

<p class="wp-block-paragraph">这套方案并不完善，尤其是当尖角形状干扰到对面的边时，会导致最终的输出结果看起来缺了一块。</p>

<h2 class="wp-block-heading">最终效果</h2>

<p class="wp-block-paragraph">右边的是给 water 图层加了阴影效果的地图，可以和左边的对比一下。</p>

<div class="wp-block-cp-codepen-gutenberg-embed-block cp_embed_wrapper"><iframe id="cp_embed_LYBEexG" src="//codepen.io/anon/embed/LYBEexG?height=550&amp;theme-id=1&amp;slug-hash=LYBEexG&amp;default-tab=result" height="550" scrolling="no" frameborder="0" allowfullscreen allowpaymentrequest name="CodePen Embed LYBEexG" title="CodePen Embed LYBEexG" class="cp_embed_iframe" style="width:100%;overflow:hidden">CodePen Embed Fallback</iframe></div>

<p class="wp-block-paragraph">算法不太稳定，水系的阴影效果在拖动地图后不一定能加载出来。</p>

<h2 class="wp-block-heading">后续优化</h2>

<ul class="wp-block-list">
<li>算法效率。这应该是阻挡这一效果在 Mapbox 中落地的很重要的一个因素吧。</li>

<li>现有库的稳定性，现有的 Javascript 版本的直骨架计算库都存在一些问题，从项目的 issue 中就可以看出来了。当然也可以尝试下将 cgal 编译为 wasm 来解决。</li>

<li>和矢量瓦片结合的问题，如何在数据被切分后，依旧保持效果的完整性？</li>
</ul>

<h2 class="wp-block-heading">参考文章</h2>

<ul class="wp-block-list">
<li><a href="https://nyalldawson.net/2014/06/shapeburst-fill-styles-in-qgis-2-4/" data-type="URL" data-id="https://nyalldawson.net/2014/06/shapeburst-fill-styles-in-qgis-2-4/" target="_blank" rel="noreferrer noopener">SHAPEBURST FILL STYLES IN QGIS 2.4</a></li>

<li><a href="https://dsa.cs.tsinghua.edu.cn/~deng/cg/project/2009f/2009f-2-a.pdf" target="_blank" data-type="URL" data-id="https://dsa.cs.tsinghua.edu.cn/~deng/cg/project/2009f/2009f-2-a.pdf" rel="noreferrer noopener">平面简单多边形的直骨架实现</a></li>

<li><a href="https://github.com/mapbox/mapbox-gl-js/issues/6816" target="_blank" data-type="URL" data-id="https://github.com/mapbox/mapbox-gl-js/issues/6816" rel="noreferrer noopener">using straight skeletons to render strokes, tint bands and antialiasing</a></li>
</ul>

<p class="wp-block-paragraph"></p>

<p class="wp-block-paragraph"></p>

<p class="wp-block-paragraph"></p>

<p class="wp-block-paragraph"></p>

<p class="wp-block-paragraph"></p>

<p class="wp-block-paragraph"></p>

<p class="wp-block-paragraph"></p>

<p class="wp-block-paragraph"></p>

<p class="wp-block-paragraph"></p>

<p class="wp-block-paragraph"></p>

<p class="wp-block-paragraph"></p>

<p class="wp-block-paragraph"></p>

<p class="wp-block-paragraph"></p>

<p class="wp-block-paragraph"></p>

<p class="wp-block-paragraph"></p>

<p class="wp-block-paragraph"></p>

<p class="wp-block-paragraph"></p>

<p class="wp-block-paragraph"></p>

<p class="wp-block-paragraph"></p>

<p class="wp-block-paragraph"></p>

<p class="wp-block-paragraph"></p>

<p class="wp-block-paragraph"></p>

<p class="wp-block-paragraph"></p>

<p class="wp-block-paragraph"></p>

<p class="wp-block-paragraph"></p>

<p class="wp-block-paragraph"></p>

<p class="wp-block-paragraph"></p>

<p class="wp-block-paragraph"></p>

<p class="wp-block-paragraph"></p>
