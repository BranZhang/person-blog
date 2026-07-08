---
title: "几何形状在球面和平面之间的剖分差异"
description: "在球形表面绘制多边形比在平面上绘制要麻烦不少。这个问题和将一张全景照片还原到现实视觉效果本质上是一样的"
pubDatetime: 2024-11-11T08:31:00.000Z
modDatetime: 2025-02-28T10:17:38.000Z
author: "Zhang"
tags:
  - "Cesium"
  - "gis"
  - "GIS"
canonicalURL: "https://littlepotato.me/2024/11/11/polygon-triangulation-on-the-sphere/"
---

<p class="wp-block-paragraph">在球形表面绘制多边形比在平面上绘制要麻烦不少。这个问题和将一张全景照片还原到现实视觉效果本质上是一样的</p>

<!--more-->

<p class="wp-block-paragraph">想要意识到平面上的多边形和球形表面的多边形之间的区别，必须要有测地线的概念，也就是球面上的最短路径。</p>

<div class="wp-block-image">
<figure class="aligncenter size-full is-resized"><img loading="lazy" decoding="async" width="960" height="607" src="/wp-content/uploads/2025/02/Geometry_geodesic_vs_planar_annotated.png" alt="" class="wp-image-12200" style="width:603px;height:auto" srcset="/wp-content/uploads/2025/02/Geometry_geodesic_vs_planar_annotated.png 960w, /wp-content/uploads/2025/02/Geometry_geodesic_vs_planar_annotated-300x190.png 300w, /wp-content/uploads/2025/02/Geometry_geodesic_vs_planar_annotated-768x486.png 768w" sizes="auto, (max-width: 960px) 100vw, 960px" /><figcaption class="wp-element-caption"><em>测地多边形（红色）和平面多边形（黑色）</em></figcaption></figure>
</div>

<p class="wp-block-paragraph">在小尺度下，可以近似的将两者视为等同。但随着多边形的大小越来越大，无论在统计层面还是可视化层面，都要做区分处理了。本文将在可视化层面讨论一下如何处理好大范围的多边形渲染问题。</p>

<figure class="wp-block-gallery has-nested-images columns-default is-cropped wp-block-gallery-2 is-layout-flex wp-block-gallery-is-layout-flex">
<figure class="wp-block-image size-large"><img loading="lazy" decoding="async" width="557" height="313" data-id="12201" src="/wp-content/uploads/2025/02/bad_triangulation.avif" alt="" class="wp-image-12201"/><figcaption class="wp-element-caption">该多边形环绕了整个世界，在CesiumJS中渲染的错误多边形三角剖分。</figcaption></figure>

<figure class="wp-block-image size-large"><img loading="lazy" decoding="async" width="505" height="284" data-id="12202" src="/wp-content/uploads/2025/02/good_triangulation.avif" alt="" class="wp-image-12202"/><figcaption class="wp-element-caption">在CesiumJS中渲染的正确多边形三角剖分。</figcaption></figure>
</figure>

<h2 class="wp-block-heading">在 Cesium 中渲染多边形</h2>

<p class="wp-block-paragraph">为了渲染几何图形，我们必须将其分解为三角形以创建网格。将任意简单多边形分解为三角形的过程在 2D 中已经有了明确定义。CesiumJS 使用一个名为 <strong>earcut</strong> 的库，它足够快速，可以在浏览器中进行实时三角剖分。</p>

<div class="wp-block-image">
<figure class="aligncenter size-full is-resized"><img loading="lazy" decoding="async" width="1322" height="510" src="/wp-content/uploads/2025/02/triangulation.avif" alt="" class="wp-image-12203" style="width:627px;height:auto"/><figcaption class="wp-element-caption">在CesiumJS中，多边形使用 earcut 算法进行三角剖分，以便在椭球表面上以3D形式显示。</figcaption></figure>
</div>

<p class="wp-block-paragraph">我们必须首先将多边形的顶点投影到2D平面上。之前，我们总是将多边形的顶点投影到一个与椭球相切的平面上。这对于那些没有跨越地球大范围的多边形效果很好，因为在接近切点时，投影产生的失真很小。</p>

<div class="wp-block-image">
<figure class="aligncenter size-full is-resized"><img loading="lazy" decoding="async" width="1007" height="939" src="/wp-content/uploads/2025/02/tangent.avif" alt="" class="wp-image-12204" style="width:368px;height:auto"/><figcaption class="wp-element-caption">将多边形从椭球表面投影到椭球相切平面，在该平面上进行2D坐标系中的三角剖分。</figcaption></figure>
</div>

<p class="wp-block-paragraph">但不可能将椭球或球面上的所有点投影到一个单一的平面上。随着距离切点越来越远，失真会增加。对于超过180度的范围，投影到切平面总是会产生不正确的结果，因为当在2D中查看时，位置会“回绕”到自身。</p>

<p class="wp-block-paragraph">一个直接的解决方案是使用多个切平面，而不仅仅是一个。为了确保无缝的网格，必须沿着每个投影区域的边缘拆分多边形。从性能角度来看，在几何体创建时拆分多边形可能是一个代价高昂的操作，因为算法需要处理每个多边形的边和每个拆分平面。然而，一旦完成三角剖分，所有拆分的多边形会在处理流程的后续步骤中重新合并，在几何批处理步骤中重新组合，以确保与之前相同的渲染性能。</p>

<p class="wp-block-paragraph">根据多边形的范围，我们可以通过仅在知道其足够大时才执行拆分操作来节省时间。但每次我们将多边形投影到不同的空间时，拆分算法的执行次数就会增加，运行时性能的拖累也会更大。</p>

<p class="wp-block-paragraph">即使假设范围不超过90度，我们也需要最多拆分三次：沿着x轴、y轴和z轴拆分。</p>

<div class="wp-block-image">
<figure class="aligncenter size-full is-resized"><img loading="lazy" decoding="async" width="1322" height="948" src="/wp-content/uploads/2025/02/split.avif" alt="" class="wp-image-12205" style="width:523px;height:auto"/><figcaption class="wp-element-caption">将椭球体沿x轴、y轴和z轴拆分成八个范围。</figcaption></figure>
</div>

<p class="wp-block-paragraph">也许笛卡尔坐标系在这里限制了我们。那换用不同的投影呢？例如，立方体映射（cubemaps）是一种将3D球体投影到2D空间以渲染天空盒或环境贴图的著名方法。</p>

<p class="wp-block-paragraph">这里的问题是，并非所有投影都是共形的；它们不能正确地保持形状或点之间的相对角度。尽管它们常常会扭曲面积（这也是这种投影类型不常用于极地区域以外的地图制作的原因），但保持形状对于我们在多边形上执行的几何操作至关重要。我们依赖形状来保证不仅是三角剖分的准确性，还包括任何裁剪操作、确定绕线顺序，或测试极点是否在多边形内部或外部。</p>

<div class="wp-block-image">
<figure class="aligncenter size-full is-resized"><img loading="lazy" decoding="async" width="1228" height="1159" src="/wp-content/uploads/2025/02/stereographic_map.avif" alt="" class="wp-image-12206" style="width:463px;height:auto"/><figcaption class="wp-element-caption">共形地图投影保持形状，但代价是扭曲面积。</figcaption></figure>
</div>

<p class="wp-block-paragraph">有一种投影特别适合于只需在极少数位置拆分多边形。立体投影（或极地投影）可以将3D笛卡尔坐标点从南极投影到与北极相切的平面，反之亦然。</p>

<div class="wp-block-image">
<figure class="aligncenter size-full is-resized"><img loading="lazy" decoding="async" width="1322" height="802" src="/wp-content/uploads/2025/02/sterographic_projection.avif" alt="" class="wp-image-12207" style="width:571px;height:auto"/><figcaption class="wp-element-caption">从北极到南极平面上投影位置Q和P的立体投影。</figcaption></figure>
</div>

<p class="wp-block-paragraph">关键在于，由于三角函数在小角度下的精度问题，这些投影仅在大于一个半球的范围内有效。为了应对这个问题，我们在赤道处拆分多边形，确保为每个边处理正确的弧类型。我们只需要在z=0的平面上执行一次拆分操作。</p>

<div class="wp-block-image">
<figure class="aligncenter size-full is-resized"><img loading="lazy" decoding="async" width="1016" height="282" src="/wp-content/uploads/2025/02/sterograohic_triangulation.png" alt="" class="wp-image-12210" style="width:774px;height:auto" srcset="/wp-content/uploads/2025/02/sterograohic_triangulation.png 1016w, /wp-content/uploads/2025/02/sterograohic_triangulation-300x83.png 300w, /wp-content/uploads/2025/02/sterograohic_triangulation-768x213.png 768w" sizes="auto, (max-width: 1016px) 100vw, 1016px" /><figcaption class="wp-element-caption">创建立体坐标系中的三角剖分可以确保即使多边形环绕椭球体，仍然能保持每个多边形位置之间的角度。</figcaption></figure>
</div>

<p class="wp-block-paragraph">使用立体坐标系还可以让我们通过“简单”的向量数学执行许多在球体上难以处理的操作。例如，我们现在可以根据多边形相对于原点的角度和总和来确定极点是否位于多边形内部或外部，并且可以生成正确的地图边界框。</p>

<div class="wp-block-image">
<figure class="aligncenter size-full is-resized"><img loading="lazy" decoding="async" width="1056" height="689" src="/wp-content/uploads/2025/02/inside_outside.avif" alt="" class="wp-image-12211" style="width:581px;height:auto"/><figcaption class="wp-element-caption">检查极点是否位于多边形内部或外部对于确定正确的地图边界矩形非常重要。</figcaption></figure>
</div>

<p class="wp-block-paragraph">在正确的处理好坐标的投影后，多边形得到了正确的渲染。</p>

<figure class="wp-block-gallery has-nested-images columns-default is-cropped wp-block-gallery-3 is-layout-flex wp-block-gallery-is-layout-flex">
<figure class="wp-block-image size-large"><img loading="lazy" decoding="async" width="1322" height="744" data-id="12213" src="/wp-content/uploads/2025/02/enclosing_pole_before.avif" alt="" class="wp-image-12213"/><figcaption class="wp-element-caption">一个错误的极地多边形</figcaption></figure>

<figure class="wp-block-image size-large"><img loading="lazy" decoding="async" width="1322" height="744" data-id="12212" src="/wp-content/uploads/2025/02/enclosing_pole_after.avif" alt="" class="wp-image-12212"/><figcaption class="wp-element-caption">正确渲染的多边形</figcaption></figure>
</figure>

<h2 class="wp-block-heading">在 MapillaryJS 中渲染标注物</h2>

<p class="wp-block-paragraph">MapillaryJS 是一个将全景照片，点云，空间标注等空间数据可视化的平台。在 MapillaryJS 中，也有几何形状在球面和平面之间转换的问题。</p>

<figure class="wp-block-gallery has-nested-images columns-default is-cropped wp-block-gallery-4 is-layout-flex wp-block-gallery-is-layout-flex">
<figure class="wp-block-image size-large"><img loading="lazy" decoding="async" width="640" height="320" data-id="12214" src="/wp-content/uploads/2025/02/polygon-equirectangular-panorama.jpg" alt="" class="wp-image-12214" srcset="/wp-content/uploads/2025/02/polygon-equirectangular-panorama.jpg 640w, /wp-content/uploads/2025/02/polygon-equirectangular-panorama-300x150.jpg 300w" sizes="auto, (max-width: 640px) 100vw, 640px" /><figcaption class="wp-element-caption">等距矩形全景图作为失真后的2D投影：真实3D世界中的直线看起来是弯曲的。</figcaption></figure>

<figure class="wp-block-image size-large"><img loading="lazy" decoding="async" width="640" height="336" data-id="12215" src="/wp-content/uploads/2025/02/polygon-undistorted.jpg" alt="" class="wp-image-12215" srcset="/wp-content/uploads/2025/02/polygon-undistorted.jpg 640w, /wp-content/uploads/2025/02/polygon-undistorted-300x158.jpg 300w" sizes="auto, (max-width: 640px) 100vw, 640px" /><figcaption class="wp-element-caption">等距矩形全景图在无失真的3D空间中渲染为球体：真实3D世界中的直线看起来是直的。</figcaption></figure>
</figure>

<p class="wp-block-paragraph">在 MapillaryJS 中，图像片段的可视化根据分割类别填充不同的颜色。填充颜色来自一个着色的3D网格，该网格被放置在图像前面，或者在全景图像的情况下，放置在图像球体内部，位于 MapillaryJS 查看器中的无失真3D空间中。</p>

<div class="wp-block-image">
<figure class="aligncenter size-full"><img loading="lazy" decoding="async" width="640" height="327" src="/wp-content/uploads/2025/02/polygon-rendered.jpg" alt="" class="wp-image-12216" srcset="/wp-content/uploads/2025/02/polygon-rendered.jpg 640w, /wp-content/uploads/2025/02/polygon-rendered-300x153.jpg 300w" sizes="auto, (max-width: 640px) 100vw, 640px" /><figcaption class="wp-element-caption">根据分割类别填充不同的颜色。</figcaption></figure>
</div>

<p class="wp-block-paragraph">图像片段由失真后的2D投影上的多边形定义。为了创建上述的网格，这个多边形需要进行三角剖分，即将其分解为一组三角形。</p>

<p class="wp-block-paragraph">虽然对于常规图像来说，通过三角剖分创建这个网格相对简单，但对于等距矩形的360°全景图像，由于其球形特性，这一过程变得更加复杂。多边形顶点（多边形的角点）之间的关系在从等距矩形投影去失真时发生了变化。</p>

<p class="wp-block-paragraph">这些关系变化可能会导致错误的三角形，如果三角剖分在原始的失真2D投影上进行。例如，三角形在从失真后的2D投影转到无失真3D空间时，可能会出现在实际的多边形轮廓外。因此，多边形不能直接在失真后的2D投影上进行三角剖分。同时，三角剖分需要在2D中执行，因此不能直接在图像球体上的3D空间中进行，所以我们需要另一种方法。</p>

<p class="wp-block-paragraph">除了实际解决三角剖分问题外，我们还需要一种高效的方法，因为对于单张图像，我们可能需要对成百上千的多边形和成千上万的顶点进行三角剖分。我们需要在尽可能保持 MapillaryJS 查看器响应迅速的情况下执行三角剖分。</p>

<p class="wp-block-paragraph">假设我们在全景图上监测到了一个简单的六边形，我们目标是：在无失真的 3D 空间中，正确且高效的实时显示它。</p>

<figure class="wp-block-gallery has-nested-images columns-default is-cropped wp-block-gallery-5 is-layout-flex wp-block-gallery-is-layout-flex">
<figure class="wp-block-image size-large"><img loading="lazy" decoding="async" width="376" height="188" data-id="12217" src="/wp-content/uploads/2025/02/polygon-on-real-image.png" alt="" class="wp-image-12217" srcset="/wp-content/uploads/2025/02/polygon-on-real-image.png 376w, /wp-content/uploads/2025/02/polygon-on-real-image-300x150.png 300w" sizes="auto, (max-width: 376px) 100vw, 376px" /><figcaption class="wp-element-caption">在等距矩形全景图的失真2D投影上检测到的简单六边形</figcaption></figure>

<figure class="wp-block-image size-large"><img loading="lazy" decoding="async" width="378" height="190" data-id="12218" src="/wp-content/uploads/2025/02/polygon-on-undistorted-image.png" alt="" class="wp-image-12218" srcset="/wp-content/uploads/2025/02/polygon-on-undistorted-image.png 378w, /wp-content/uploads/2025/02/polygon-on-undistorted-image-300x151.png 300w" sizes="auto, (max-width: 378px) 100vw, 378px" /><figcaption class="wp-element-caption">该多边形在无失真的3D空间中——六边形的形状已经发生变化</figcaption></figure>
</figure>

<p class="wp-block-paragraph">为了达到上面提到的目标，我们必须将失真后的2D投影划分为多个足够小的子区域，以确保所有点最终都位于选定的平面前面。让我们将图像划分为一个网格，确保没有任何子区域覆盖超过180度。如果我们选择一个2 x 3的矩形子区域网格，那么每个子区域在球体上的覆盖角度不会超过120度。</p>

<div class="wp-block-image">
<figure class="aligncenter size-full"><img loading="lazy" decoding="async" width="378" height="189" src="/wp-content/uploads/2025/02/6-subareas.png" alt="" class="wp-image-12219" srcset="/wp-content/uploads/2025/02/6-subareas.png 378w, /wp-content/uploads/2025/02/6-subareas-300x150.png 300w" sizes="auto, (max-width: 378px) 100vw, 378px" /><figcaption class="wp-element-caption">在一个定义了六个子区域的网格上的简单六边形。</figcaption></figure>
</div>

<p class="wp-block-paragraph">在划分图像后，我们可以通过裁剪每个子区域中的多边形，将三角剖分问题分解为六个子问题。在我们的例子中，我们得到三个裁剪后的多边形部分，这些部分与包含该多边形的子区域相关联。</p>

<div class="wp-block-image">
<figure class="aligncenter size-full"><img loading="lazy" decoding="async" width="503" height="248" src="/wp-content/uploads/2025/02/clipped-areas.png" alt="" class="wp-image-12220" srcset="/wp-content/uploads/2025/02/clipped-areas.png 503w, /wp-content/uploads/2025/02/clipped-areas-300x148.png 300w" sizes="auto, (max-width: 503px) 100vw, 503px" /><figcaption class="wp-element-caption">多边形被裁剪到每个子区域。</figcaption></figure>
</div>

<p class="wp-block-paragraph">裁剪多边形后，我们可以将其反投影到球体上，然后立即将其投影到一个平面，该平面的法线方向指向网格矩形的中心，以确保所有点都位于平面前面。</p>

<div class="wp-block-image">
<figure class="aligncenter size-full is-resized"><img loading="lazy" decoding="async" width="286" height="324" src="/wp-content/uploads/2025/02/sphere-areas.png" alt="" class="wp-image-12223" style="width:177px;height:auto" srcset="/wp-content/uploads/2025/02/sphere-areas.png 286w, /wp-content/uploads/2025/02/sphere-areas-265x300.png 265w" sizes="auto, (max-width: 286px) 100vw, 286px" /><figcaption class="wp-element-caption">裁剪后的多边形部分反投影到球体上。</figcaption></figure>
</div>

<p class="wp-block-paragraph">一旦投影完成，我们现在可以对裁剪后的多边形进行三角剖分，然后用颜色填充三角形。</p>

<div class="wp-block-image">
<figure class="aligncenter size-full"><img loading="lazy" decoding="async" width="328" height="205" src="/wp-content/uploads/2025/02/clipped-polygon.png" alt="" class="wp-image-12225" srcset="/wp-content/uploads/2025/02/clipped-polygon.png 328w, /wp-content/uploads/2025/02/clipped-polygon-300x188.png 300w" sizes="auto, (max-width: 328px) 100vw, 328px" /><figcaption class="wp-element-caption">三角剖分后的裁剪多边形部分。</figcaption></figure>
</div>

<p class="wp-block-paragraph">如果我们现在将来自不同子区域的所有三角形组合起来，就得到了完整的三角剖分。我们可以在无失真的3D空间中渲染带填充的多边形。</p>

<p class="wp-block-paragraph">下面是一个简化的伪算法，用于在球面上进行多边形三角剖分：</p>

<ol class="wp-block-list">
<li>将原始图像划分为 x × y 个矩形子区域，其中 x ≥ 3 且 y ≥ 2，以确保每个子区域在球面上的覆盖角度最多为120度。</li>

<li>创建一个空的3D坐标三角形数组。</li>

<li>对于每个子区域：
<ul class="wp-block-list">
<li>使用失真后的2D坐标，根据子区域边界裁剪多边形。</li>

<li>将失真后的2D坐标反投影到无失真的3D坐标。</li>

<li>将无失真的3D坐标投影到一个平面上，平面位于摄像机前方，且主光轴通过子区域的中心。</li>

<li>对投影后的2D坐标进行三角剖分。</li>

<li>将与三角形索引对应的无失真3D坐标添加到三角形数组中。</li>
</ul>
</li>

<li>使用组装好的3D坐标三角形数组。</li>
</ol>

<div class="wp-block-image">
<figure class="aligncenter size-full is-resized"><img loading="lazy" decoding="async" width="286" height="324" src="/wp-content/uploads/2025/02/polygon-combined-sphere.png" alt="" class="wp-image-12226" style="width:198px;height:auto" srcset="/wp-content/uploads/2025/02/polygon-combined-sphere.png 286w, /wp-content/uploads/2025/02/polygon-combined-sphere-265x300.png 265w" sizes="auto, (max-width: 286px) 100vw, 286px" /><figcaption class="wp-element-caption">在无失真的 3D 空间中正确的渲染六边形。</figcaption></figure>
</div>

<h2 class="wp-block-heading">总结</h2>

<p class="wp-block-paragraph">在3D球形表面正确处理和渲染多边形，尤其是在面对大范围或复杂几何形状时，使用三角剖分不仅需要保持几何形状的准确性，还要确保在性能上能够支持实时渲染。CesiumJS 和 MapillaryJS 都通过将多边形分解为更小的部分来解决渲染和性能问题。</p>

<h2 class="wp-block-heading">参考资料</h2>

<ul class="wp-block-list">
<li><a href="https://mapillary.github.io/mapillary-js/docs/theory/polygon-triangulation/" target="_blank" rel="noopener">Polygon Triangulation on the Sphere</a></li>

<li><a href="https://cesium.com/blog/2023/10/19/large-polygons-in-cesiumjs/" target="_blank" rel="noopener">Large Polygons in CesiumJS</a></li>

<li><a href="https://developers.google.com/earth-engine/guides/geometries_planar_geodesic" target="_blank" rel="noreferrer noopener">Geodesic vs. Planar Geometries | Google Earth Engine</a></li>
</ul>
