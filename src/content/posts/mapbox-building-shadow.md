---
title: "建筑物阴影效果的实现"
description: "在 Mapbox 中实现基于日照的建筑物阴影效果。"
pubDatetime: 2022-07-06T10:38:00.000Z
modDatetime: 2025-02-18T12:25:36.000Z
author: "Zhang"
tags:
  - "mapbox"
  - "WebGL"
  - "可视化"
  - "地图"
  - "GIS"
canonicalURL: "https://littlepotato.me/2022/07/06/mapbox-building-shadow/"
---

<p class="wp-block-paragraph">光照分析是一个很常见的需求，那么如何在地图中实现类似的效果呢？</p>

<!--more-->

<figure class="wp-block-image size-large"><img loading="lazy" decoding="async" width="1024" height="493" src="/wp-content/uploads/2022/12/image-1-1024x493.png" alt="" class="wp-image-11865" srcset="/wp-content/uploads/2022/12/image-1-1024x493.png 1024w, /wp-content/uploads/2022/12/image-1-300x144.png 300w, /wp-content/uploads/2022/12/image-1-768x370.png 768w, /wp-content/uploads/2022/12/image-1-1536x740.png 1536w, /wp-content/uploads/2022/12/image-1.png 1605w" sizes="auto, (max-width: 1024px) 100vw, 1024px" /><figcaption class="wp-element-caption">理想效果</figcaption></figure>

<h2 class="wp-block-heading">框架选择</h2>

<h3 class="wp-block-heading">Cesium</h3>

<p class="wp-block-paragraph">Cesium 本身是支持光照阴影效果的，只需要将 Viewer 中的 shadows 属性置为 true 即可。不过，默认的视觉效果不太好，锯齿状严重，如下图所示。我们可以通过修改 <a href="https://cesium.com/learn/cesiumjs/ref-doc/ShadowMap.html" target="_blank" rel="noopener">ShadowMap</a> 类的参数来优化效果。</p>

<figure class="wp-block-gallery has-nested-images columns-default is-cropped wp-block-gallery-12 is-layout-flex wp-block-gallery-is-layout-flex">
<figure class="wp-block-image size-large"><img loading="lazy" decoding="async" width="562" height="904" data-id="11872" src="/wp-content/uploads/2022/12/cesium_1-1.png" alt="" class="wp-image-11872" srcset="/wp-content/uploads/2022/12/cesium_1-1.png 562w, /wp-content/uploads/2022/12/cesium_1-1-187x300.png 187w" sizes="auto, (max-width: 562px) 100vw, 562px" /><figcaption class="wp-element-caption">默认效果</figcaption></figure>

<figure class="wp-block-image size-large"><img loading="lazy" decoding="async" width="560" height="903" data-id="11871" src="/wp-content/uploads/2022/12/cesium_2-1.png" alt="" class="wp-image-11871" srcset="/wp-content/uploads/2022/12/cesium_2-1.png 560w, /wp-content/uploads/2022/12/cesium_2-1-186x300.png 186w" sizes="auto, (max-width: 560px) 100vw, 560px" /><figcaption class="wp-element-caption">size = 10240</figcaption></figure>

<figure class="wp-block-image size-large"><img loading="lazy" decoding="async" width="562" height="903" data-id="11873" src="/wp-content/uploads/2022/12/cesium_3-1.png" alt="" class="wp-image-11873" srcset="/wp-content/uploads/2022/12/cesium_3-1.png 562w, /wp-content/uploads/2022/12/cesium_3-1-187x300.png 187w" sizes="auto, (max-width: 562px) 100vw, 562px" /><figcaption class="wp-element-caption">size = 10240<br>softShadows = true</figcaption></figure>
<figcaption class="blocks-gallery-caption wp-element-caption">Cesium 的建筑阴影效果</figcaption></figure>

<pre class="EnlighterJSRAW" data-enlighter-language="js" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">const viewer = new Cesium.Viewer("cesiumContainer", {
  shadows: true
});

viewer.shadowMap.size = 10240;
viewer.shadowMap.softShadows = true;</pre>

<p class="wp-block-paragraph">从类的属性上看，Cesium 的 <a href="https://cesium.com/learn/cesiumjs/ref-doc/ShadowMap.html" target="_blank" rel="noreferrer noopener">ShadowMap</a> 类和 threejs 的 <a href="https://threejs.org/docs/index.html?q=light#api/en/lights/shadows/LightShadow" data-type="URL" data-id="https://threejs.org/docs/index.html?q=light#api/en/lights/shadows/LightShadow" target="_blank" rel="noreferrer noopener">LightShadow</a> 类很相似，本质上都是通过创建阴影纹理贴图来实现的。更高的阴影效果也就意味着更多的性能消耗。</p>

<h3 class="wp-block-heading">Mapbox</h3>

<p class="wp-block-paragraph">对于 Mapbox 而言，虽然它在三维方面的可扩展性很强，但实际上，目前没怎么看到成熟的基于 Mapbox 的三维可视化插件，更多的是成熟的框架利用 WebGL 实现与 Mapbox 的兼容，例如 deck.gl。几年前由 Peter Liu 开发的 threebox 框架已不再维护，一位微软的工程师 <a href="https://github.com/jscastro76/threebox" data-type="URL" data-id="https://github.com/jscastro76/threebox" target="_blank" rel="noreferrer noopener">fork 了一份</a>后在继续维护，工作的主要内容是让 threebox 支持 v2 版本的 Mapbox。</p>

<p class="wp-block-paragraph">当前的 threebox 其实不太适合作为一个成熟的产品去使用，代码中有很多的硬编码部分，需要对 Mapbox 很熟悉，对 threebox 源码以及 three.js 框架很熟悉，才能实际的使用 threebox 这个框架。</p>

<p class="wp-block-paragraph">而 threebox 中的建筑物阴影效果没有兼容 v2 版的 Mapbox。所以本篇文章接下来将会介绍如何修复好这个功能。</p>

<h2 class="wp-block-heading">BuildingShadows 图层逻辑</h2>

<p class="wp-block-paragraph">threebox 中的 BuildingShadows 图层使用了另外一种方式来实现建筑物的阴影效果。</p>

<p class="wp-block-paragraph">看看它的顶点着色器和片段着色器：</p>

<pre class="EnlighterJSRAW" data-enlighter-language="cpp" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">// vertexShader

uniform mat4 u_matrix;
uniform float u_height_factor;
uniform float u_altitude;
uniform float u_azimuth;
attribute vec2 a_pos;
attribute vec4 a_normal_ed;
attribute lowp vec2 a_base;
attribute lowp vec2 a_height;
void main() {
    float base = max(0.0, a_base.x);
    float height = max(0.0, a_height.x);
    float t = mod(a_normal_ed.x, 2.0);
    vec4 pos = vec4(a_pos, t > 0.0 ? height : base, 1);
    float len = pos.z * u_height_factor / tan(u_altitude);
    pos.x += cos(u_azimuth) * len;
    pos.y += sin(u_azimuth) * len;
    pos.z = 0.0;
    gl_Position = u_matrix * pos;
}


// fragmentShader

void main() {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 0.7);
}</pre>

<p class="wp-block-paragraph">颜色的计算很简单，关键在于顶点的计算。首先构造出来的顶点：</p>

<p class="has-text-align-center wp-block-paragraph">vec4(a_pos, t &gt; 0.0 ? height : base, 1)</p>

<p class="wp-block-paragraph">是原始的拉伸后的建筑顶点。接着计算阴影的长度：</p>

<p class="has-text-align-center wp-block-paragraph">pos.z * u_height_factor / tan(u_altitude)</p>

<p class="wp-block-paragraph">并结合阴影的方位，计算出投射后的阴影顶点位置：</p>

<p class="has-text-align-center wp-block-paragraph">pos.x += cos(u_azimuth) * len;<br>pos.y += sin(u_azimuth) * len;</p>

<p class="wp-block-paragraph">而 u_azimuth 的值，则是根据指定的当地时间，以及建筑的地理位置计算得到的光照角度。</p>

<figure class="wp-block-image size-large"><img decoding="async" src="/wp-content/uploads/2022/12/image-4-1024x697.png" alt="" class="wp-image-11878"/><figcaption class="wp-element-caption">Mapbox 中的建筑物阴影</figcaption></figure>

<h2 class="wp-block-heading">兼容 v2 版的 mapbox</h2>

<p class="wp-block-paragraph">那为什么这段代码与 Mapbox 不再兼容了呢？问题出在读取的建筑图层数据上。Mapbox 在升级到 v2 的过程中，为了减小 fill-extrusion 图层的内存占用，传给着色器的数据做了一些调整，将顶点以及法向量合并成了一个变量，具体的改动可以参考这个<a href="https://github.com/mapbox/mapbox-gl-js/commit/cef95aa0241e748b396236f1269fbb8270f31565" data-type="URL" data-id="https://github.com/mapbox/mapbox-gl-js/commit/cef95aa0241e748b396236f1269fbb8270f31565" target="_blank" rel="noreferrer noopener">提交</a>。</p>

<p class="wp-block-paragraph">所以，将顶点着色器的改动同步到 threebox 中的 BuildingShadows 中即可。</p>

<h2 class="wp-block-heading">最终效果</h2>

<p class="wp-block-paragraph">最后，将建筑物阴影，Mapbox 的地图光源，以及天空盒效果结合起来，可以得到以下的效果。</p>

<div class="wp-block-cp-codepen-gutenberg-embed-block cp_embed_wrapper"><iframe id="cp_embed_poZzoNO" src="//codepen.io/anon/embed/poZzoNO?height=650&amp;theme-id=1&amp;slug-hash=poZzoNO&amp;default-tab=result" height="650" scrolling="no" frameborder="0" allowfullscreen allowpaymentrequest name="CodePen Embed poZzoNO" title="CodePen Embed poZzoNO" class="cp_embed_iframe" style="width:100%;overflow:hidden">CodePen Embed Fallback</iframe></div>

<p class="wp-block-paragraph">基于 Mapbox 实现的建筑物阴影，与 Mapbox 本身高度耦合，实际视觉体验不及 Cesium，不过胜在实现简单，性能负担小。</p>

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
