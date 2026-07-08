---
title: "利用遮挡剔除优化 3D Tiles 传输（译：Optimizing 3D Tiles Streaming in Cesium for Unreal with Occlusion Culling）"
description: "为了提高 Cesium for Unreal 中 3D Tiles 的传输性能，我们最近将虚幻引擎的遮挡剔除系统集成到了我们的瓦片选择算法中。"
pubDate: "2023-02-04T07:43:00.000Z"
updatedDate: "2025-03-03T02:25:16.000Z"
published: true
tags: ["Cesium","gis","地图","GIS","算法"]
---
<p class="wp-block-paragraph">为了提高 Cesium for Unreal 中 3D Tiles 的传输性能，我们最近将虚幻引擎的遮挡剔除系统集成到了我们的瓦片选择算法中。</p>

<!--more-->

<h2 class="wp-block-heading">什么是遮挡剔除？</h2>

<p class="wp-block-paragraph">遮挡剔除是一种避免渲染完全被其他场景中的物体遮挡的物体的技术。在密集的场景中，这可以显著提高性能——而不会降低渲染质量。</p>

<div class="wp-block-image">
<figure class="aligncenter size-full is-resized"><img loading="lazy" decoding="async" width="2592" height="1965" src="/wp-content/uploads/2025/03/OcclusionDiagram.avif" alt="" class="wp-image-12230" style="width:566px;height:auto"/><figcaption class="wp-element-caption">有两座建筑物被视锥剔除（因为它们在摄像机视野之外），另外三座建筑物被遮挡剔除（因为它们被其他建筑物遮挡）</figcaption></figure>
</div>

<p class="wp-block-paragraph">在上图中，绿色建筑物（遮挡者）遮挡了右侧的红色建筑物（被遮挡者）。由于这些红色建筑物对于摄像机是不可见的，因此它们不需要被渲染。</p>

<h2 class="wp-block-heading">剔除的时机</h2>

<div class="wp-block-image">
<figure class="aligncenter size-full"><img loading="lazy" decoding="async" width="960" height="288" src="/wp-content/uploads/2025/03/Occlusion-Pipeline.avif" alt="" class="wp-image-12231"/><figcaption class="wp-element-caption">从瓦片选择到渲染，瓦片的总体处理流程</figcaption></figure>
</div>

<p class="wp-block-paragraph">上述图示展示了一个瓦片在渲染到屏幕之前所经历的各个阶段。运行时的 3D Tiles 选择算法根据当前的摄像机视角来选择并请求瓦片。一旦请求的瓦片完成异步加载，3D Tiles 网格就会交给虚幻引擎的渲染管线。</p>

<p class="wp-block-paragraph">剔除可以在这些阶段中的任何一个使用，以节省计算和资源，但尽早剔除总是更好的，因为它能减少管线后续的无用计算。虚幻引擎在可见性检查阶段进行瓦片剔除，避免渲染那些不可见的瓦片。在选择阶段对瓦片进行剔除有助于避免请求和加载该瓦片。</p>

<p class="wp-block-paragraph">Cesium for Unreal 已经利用 3D Tiles 视锥剔除和基于距离的“雾”剔除来减少不必要的瓦片请求。本文探讨了如何在 Cesium for Unreal 中实现 3D Tiles 遮挡剔除，以在密集场景中进一步节省瓦片请求。</p>

<h2 class="wp-block-heading">遮挡剔除技术概述</h2>

<h3 class="wp-block-heading">背景</h3>

<p class="wp-block-paragraph">遮挡剔除可以指多种技术。遮挡剔除方法通常分为三大类：预计算、物体空间和图像空间。</p>

<h3 class="wp-block-heading">预计算遮挡剔除</h3>

<p class="wp-block-paragraph">虚幻引擎有预计算的可见性体积，有时也称为潜在可见集（PVS）。每个预计算的可见性体积都有一个对应的物体集，这个集包含了当摄像机位于该体积内时，可能会被看到的所有物体。在运行时，基于摄像机位置，利用这个集合来快速筛选出候选物体进行渲染（其中一些物体可能仍然会被视锥剔除）。</p>

<p class="wp-block-paragraph">这个集合必须离线预先计算。预计算的可见性体积对于游戏关卡中封闭的部分非常有用，例如玩家可能在一个狭窄的走廊中行走，走廊遮挡了大部分外部世界。然而，在 3D Tiles 和大规模地理空间内容流式传输的背景下，几乎不可能对每种几何布局或潜在的摄像机位置进行排列组合，以预计算可见性信息。</p>

<div class="wp-block-image">
<figure class="aligncenter size-full is-resized"><img loading="lazy" decoding="async" width="1281" height="854" src="/wp-content/uploads/2025/03/PVS.avif" alt="" class="wp-image-12232" style="width:665px;height:auto"/><figcaption class="wp-element-caption">在虚幻引擎中可视化的预计算可见性体积，在这个关卡中，从沿走道的多个可见性体积中，某些悬崖部分可能不可见——这些信息可以通过预计算得出。</figcaption></figure>
</div>

<h3 class="wp-block-heading">物体空间</h3>

<p class="wp-block-paragraph">物体空间方法是另一类遮挡剔除技术，在这种方法中，遮挡物和被遮挡物的几何形状以保守的、轴对齐的表示方式存储在包围体积层次结构（BVH）中——通常使用八叉树。每个遮挡物体积沿摄像机的反方向向物体BVH投射一个“可见性阴影”。对于每个遮挡物，必须遍历一次BVH以找 到被遮挡的物体（那些位于遮挡物“阴影”中的物体）。遮挡物的轴对齐表示可以选择进行融合，以提高遮挡率并减少独立的BVH遍历次数。</p>

<p class="wp-block-paragraph">遮挡物融合、轴对齐遮挡物简化和BVH遍历都是CPU密集型任务。为了支持3D Tiles，如果使用这种方法，这些任务必须在运行时持续执行，因为随着摄像机飞行穿越世界，遮挡物的集合会不断变化。总体而言，物体空间方法随着遮挡物数量的增加而扩展性差，且可能过于保守。</p>

<div class="wp-block-image">
<figure class="aligncenter size-full"><img loading="lazy" decoding="async" width="294" height="261" src="/wp-content/uploads/2025/03/objectSpace.avif" alt="" class="wp-image-12233"/><figcaption class="wp-element-caption">场景中的物体存储在八叉树中。红点代表摄像机。遮挡物（黄色）投射出一个“阴影”（蓝色），遮挡所有被遮挡物体后面的物体。</figcaption></figure>
</div>

<h3 class="wp-block-heading">图像空间</h3>

<p class="wp-block-paragraph">图像空间方法目前是最受欢迎、可扩展且有效的遮挡剔除形式。这些方法利用GPU，并且对于动态和流式传输的物体具有更强的鲁棒性，开销极小。本文的其余部分重点介绍了虚幻引擎和Cesium for Unreal中使用的图像空间技术的特定组合。</p>

<h2 class="wp-block-heading"><strong>图像空间遮挡剔除</strong></h2>

<h3 class="wp-block-heading">外包体积</h3>

<p class="wp-block-paragraph">精确判断一个物体是否被遮挡是昂贵且不利于遮挡剔除目标的。考虑与视锥剔除的类比——检查物体的每个顶点以判断它们是否都在屏幕外是非常耗时的。相反，更快速且同样有效的方法是检查物体的包围体积是否在屏幕外。类似地，我们可以测试物体的包围体积是否被遮挡，而不是直接测试物体的几何形状，这样计算效率更高。至关重要的是，我们的近似遮挡结果仍然是保守的——我们永远不会错误地认为一个物体被遮挡。</p>

<p class="wp-block-paragraph">在实际实现遮挡剔除时，每个物体应该具有一个预计算的、合适的包围体积，该体积包含了物体的所有几何形状。一般来说，面向的包围盒（OBBs）最为适合（例如，建筑物通常可以紧密地用OBBs包围）。轴对齐包围盒（AABBs）可能适配稍微差一些，但有时由于更容易集成到场景八叉树中，它们会更受偏好。包围球通常适配最差，导致极为保守的遮挡结果。</p>

<div class="wp-block-image">
<figure class="aligncenter size-full is-resized"><img loading="lazy" decoding="async" width="1256" height="789" src="/wp-content/uploads/2025/03/treesBounds.avif" alt="" class="wp-image-12234" style="width:723px;height:auto"/><figcaption class="wp-element-caption">带有包围球（黄色）和包围盒（红色）的树木显示。请注意，包围球通常比包围盒的拟合度差。虚幻引擎使用轴对齐包围盒进行遮挡剔除。</figcaption></figure>
</div>

<h3 class="wp-block-heading">深度缓冲区</h3>

<p class="wp-block-paragraph">深度缓冲区是单通道图像，每个像素代表与摄像机的距离。对于当前视图，包含场景中所有可能遮挡物的深度缓冲区应在预处理阶段绘制。作为一种优化，可以考虑使用上一帧的深度缓冲区，但这会根据帧与帧之间的运动量引起遮挡结果的轻微不准确。</p>

<div class="wp-block-image">
<figure class="aligncenter size-full is-resized"><img loading="lazy" decoding="async" width="2543" height="1572" src="/wp-content/uploads/2025/03/depthBuffer.avif" alt="" class="wp-image-12235" style="width:762px;height:auto"/><figcaption class="wp-element-caption">虚幻引擎使用一个仅深度的预处理阶段，绘制所有可见遮挡物以创建深度缓冲区，然后进行遮挡测试。这是通过RenderDoc帧捕获的虚幻引擎截图。</figcaption></figure>
</div>

<h3 class="wp-block-heading">绘制包围体积</h3>

<p class="wp-block-paragraph">为了检查一个物体是否被遮挡，需要将物体的包围体积绘制到深度缓冲区，并检查修改了多少像素。现代图形API通常提供高效的硬件优化功能，用于计算在一次绘制调用中光栅化的像素数量。</p>

<div class="wp-block-image">
<figure class="aligncenter size-full"><img loading="lazy" decoding="async" width="600" height="318" src="/wp-content/uploads/2025/03/bvDepthTests.avif" alt="" class="wp-image-12236"/><figcaption class="wp-element-caption">包围体积被绘制到深度缓冲区中以测试遮挡情况。如果非零的绿色像素表示相应的物体是可见的。</figcaption></figure>
</div>

<div class="wp-block-image">
<figure class="aligncenter size-full is-resized"><img loading="lazy" decoding="async" width="2332" height="1469" src="/wp-content/uploads/2025/03/batchedQuery1.avif" alt="" class="wp-image-12237" style="width:769px;height:auto"/><figcaption class="wp-element-caption">在虚幻引擎中，之前被遮挡的物体在随后的帧中被批处理为分组的遮挡查询。这是一种优化，用于减少对持续遮挡物体的遮挡查询次数。在这种情况下，批次中的所有物体都保持遮挡状态。</figcaption></figure>
</div>

<h3 class="wp-block-heading">使用遮挡结果进行剔除</h3>

<p class="wp-block-paragraph">如果没有像素被光栅化，意味着整个包围体积被场景中现有的几何形状遮挡。因此，物体被遮挡，不需要渲染。</p>

<p class="wp-block-paragraph">遮挡结果需要回传到CPU才能用于剔除。实际上，这需要精心的流水线设计，以避免在GPU与CPU之间的同步引入瓶颈。大多数实现必须接受接收遮挡结果时的2-3帧延迟。它们使用几帧前的遮挡结果来决定当前帧中要剔除哪些物体，尽管场景在这期间可能已经发生变化。值得注意的是，这打破了遮挡剔除的保守性假设——新的非遮挡物体可能在最多2-3帧内看不见。</p>

<h2 class="wp-block-heading">3D Tiles的遮挡剔除</h2>

<h3 class="wp-block-heading">3D Tiles、分层LOD 和包围体积</h3>

<p class="wp-block-paragraph">3D Tiles是一种用于流式传输大规模真实世界3D内容的分层空间索引标准。在3D Tiles中，3D内容被组织成一个分层的细节级别（HLOD）结构，其中每个瓦片都有一个关联的包围体积。原始的全分辨率几何体被空间上细分为叶子瓦片。层次结构中的内层瓦片使用逐渐较低细节级别（LOD）的原始内容表示。这种HLOD组织结构使得瓦片选择算法可以基于与视图者的距离来选择理想的LOD。与传统的缩放级别不同，3D Tiles基于几何误差LOD选择，允许在同一视图中显示多个级别。</p>

<p class="wp-block-paragraph">3D Tiles的层次结构是通过瓦片集（tileset）定义的，瓦片集包含了关于每个瓦片包围体积的预计算信息。</p>

<div class="wp-block-image">
<figure class="aligncenter size-full is-resized"><img loading="lazy" decoding="async" width="1250" height="798" src="/wp-content/uploads/2025/03/BoundingVolumes.avif" alt="" class="wp-image-12238" style="width:733px;height:auto"/><figcaption class="wp-element-caption">在Cesium for Unreal中可视化包围体积的3D瓦片集。3D Tiles允许将高细节模型以分层方式表达，以实现高效的流式传输。</figcaption></figure>
</div>

<h3 class="wp-block-heading">渲染器级别的遮挡剔除</h3>

<p class="wp-block-paragraph">在Cesium for Unreal中渲染的3D Tiles自动利用了Unreal Engine内置的遮挡系统。在Cesium for Unreal中，流式传输的3D Tiles在运行时转换为静态网格。这些网格通常代表地形、建筑物和其他固定几何体，因此这些网格的可移动性设置可以设置为“静态”。Unreal Engine会对这些静态网格进行遮挡测试，以确定哪些网格需要在渲染管线中绘制。通过将对象设置为静态，允许引擎进行进一步优化，如批处理遮挡查询，以处理先前被遮挡的网格。</p>

<div class="wp-block-image">
<figure class="aligncenter size-full"><img loading="lazy" decoding="async" width="2501" height="1545" src="/wp-content/uploads/2025/03/OccludedBounds.avif" alt="" class="wp-image-12239"/><figcaption class="wp-element-caption">渲染器级别的遮挡剔除。在Cesium for Unreal创建的流式网格上，Unreal Engine采用了渲染器级别的遮挡剔除。</figcaption></figure>
</div>

<p class="wp-block-paragraph">每个绿色的包围框代表一个在背景中被遮挡的网格，它被前景中可见的建筑物遮挡。</p>

<div class="wp-block-image">
<figure class="aligncenter size-full"><img loading="lazy" decoding="async" width="2494" height="1539" src="/wp-content/uploads/2025/03/WithoutOcclusion.avif" alt="" class="wp-image-12240"/><figcaption class="wp-element-caption">此图是冻结的相机视图，并从上方查看场景。</figcaption></figure>
</div>

<p class="wp-block-paragraph">红色线条大致表示冻结相机的位置和视野。这是仅使用视锥剔除而没有使用遮挡剔除时的场景——共渲染了192个图元。请注意，一个瓦片可能包含多个图元。</p>

<div class="wp-block-image">
<figure class="aligncenter size-full"><img loading="lazy" decoding="async" width="2479" height="1538" src="/wp-content/uploads/2025/03/WithOcclusion.avif" alt="" class="wp-image-12241"/><figcaption class="wp-element-caption">在启用视锥剔除和遮挡剔除后的冻结视图中——仅渲染了96个图元，而不是最初的192个。</figcaption></figure>
</div>

<p class="wp-block-paragraph">可以看到，与之前的图片相比，缺少了很多图元。Unreal通过剔除被认为被遮挡的场景部分，节省了近50%的原始渲染成本。</p>

<p class="wp-block-paragraph">Unreal Engine 的遮挡系统实际上并不会开始剔除这些瓦片，直到 Cesium for Unreal 已经获取、处理并加载了它们。例如，比较上面两张图 —— 即使 Unreal Engine 由于遮挡没有渲染这些瓦片，额外的瓦片仍然被加载。</p>

<h3 class="wp-block-heading"><strong>瓦片选择算法中的遮挡剔除</strong></h3>

<p class="wp-block-paragraph">Unreal Engine已经节省了被遮挡物体的不必要绘制调用，但瓦片选择算法可以更进一步，节省被遮挡瓦片的不必要网络请求。作为额外的好处，这也能加速可见瓦片的加载。</p>

<p class="wp-block-paragraph">Cesium for Unreal在遮挡感知瓦片选择中的方法包括以下步骤。</p>

<h3 class="wp-block-heading">等待遮挡结果</h3>

<p class="wp-block-paragraph">遮挡结果可能需要几个帧才能到达。默认情况下，如果瓦片仍在等待遮挡结果，我们不会继续遍历它。这可以避免对可能很快被发现是遮挡的瓦片发起不必要的网络加载请求。</p>

<div class="wp-block-image">
<figure class="aligncenter size-full is-resized"><img loading="lazy" decoding="async" width="1021" height="635" src="/wp-content/uploads/2025/03/Waiting-for-Occlusion.avif" alt="" class="wp-image-12242" style="width:685px;height:auto"/><figcaption class="wp-element-caption">我们会等待遮挡结果的瓦片遍历完成。</figcaption></figure>
</div>

<h3 class="wp-block-heading">在遮挡的瓦片处停止遍历</h3>

<p class="wp-block-paragraph">一旦发现一个瓦片被遮挡，选择算法就不再需要遍历该瓦片的子树，因为所有的子代都可以保证被遮挡。</p>

<h3 class="wp-block-heading">假设内部瓦片的可见性是一致的</h3>

<p class="wp-block-paragraph">选择算法假设如果一个瓦片有至少一个之前确认可见的子瓦片，它在这一帧仍然可见。这个假设让选择算法能够避免为那些可能“显而易见”的未被遮挡的内部瓦片发起重复的遮挡查询。注意，一旦瓦片的所有子瓦片都确认被遮挡，该瓦片将自动开始再次发起遮挡查询。</p>

<div class="wp-block-image">
<figure class="aligncenter size-full is-resized"><img loading="lazy" decoding="async" width="1021" height="635" src="/wp-content/uploads/2025/03/Final-Traversal-State.avif" alt="" class="wp-image-12243" style="width:723px;height:auto"/><figcaption class="wp-element-caption">选择算法不会遍历被遮挡的节点。对于有已经遍历的子孙节点的内部节点，不会请求遮挡。</figcaption></figure>
</div>

<h3 class="wp-block-heading">简单的剔除可能会导致空洞</h3>

<p class="wp-block-paragraph">当一个瓦片被确定为遮挡时，一种选择是简单地不加载它。这不会影响当前视图，但可能会在相机移动时创建明显的空洞，导致之前被遮挡的瓦片重新显现。这些空洞有时可以通过切换到已经加载的、较低LOD的瓦片来填补。但如果低LOD瓦片有任何先前渲染的后代（之前可见的细节会消失，并被可能是非常低细节的瓦片替换），就无法实现这一点。</p>

<div class="wp-block-image">
<figure class="aligncenter size-full"><img loading="lazy" decoding="async" width="600" height="327" src="/wp-content/uploads/2025/03/occlusionHoles.avif" alt="" class="wp-image-12244"/><figcaption class="wp-element-caption">直接剔除瓦片可能会导致后续帧出现空洞。</figcaption></figure>
</div>

<h3 class="wp-block-heading">避免空洞</h3>

<p class="wp-block-paragraph">选择算法可以避免继续细化遮挡瓦片，而不是直接“剔除”遮挡瓦片的加载。此外，不需要遍历遮挡瓦片的子瓦片，因为整个子树也会被视为遮挡。尽管遮挡的瓦片本身会被加载，但这种方法节省了加载该瓦片所有子代的开销。这解决了前面提到的空洞问题，但代价是需要加载更多的瓦片。</p>

<p class="wp-block-paragraph">由于遮挡结果仅用于确定是否细化瓦片，因此不必为不需要细化的瓦片发起遮挡查询（例如，叶子瓦片和具有足够细节的瓦片）。注意图2.5右侧的叶子瓦片没有发起遮挡查询。虽然选择算法有时会加载不可见瓦片，但 Unreal Engine 仍然通过之前提到的渲染器级别的剔除策略节省了绘制调用。</p>

<div class="wp-block-image">
<figure class="aligncenter size-full"><img loading="lazy" decoding="async" width="600" height="319" src="/wp-content/uploads/2025/03/occlusionNoHoles.avif" alt="" class="wp-image-12245"/><figcaption class="wp-element-caption">使用非细化代替剔除可以消除空洞，但会导致某些子树的初始加载变慢。</figcaption></figure>
</div>

<h2 class="wp-block-heading">结果</h2>

<h3 class="wp-block-heading">3D Tiles遮挡剔除：前后对比</h3>

<p class="wp-block-paragraph">下面再次展示了来自图2.1-2.3的相同相机视角。这次，图像展示了3D Tiles选择算法中遮挡剔除的效果。与图2.2和2.3不同，下面的图片没有展示渲染器级别的剔除。相反，它们展示了当前视角下，由选择算法加载的瓦片数量（一些选中的瓦片可能仍会在后续被渲染器剔除）。</p>

<p class="wp-block-paragraph">请注意，使用默认设置时，选择算法不会加载视锥外的瓦片。</p>

<figure class="wp-block-image size-full"><img loading="lazy" decoding="async" width="1351" height="770" src="/wp-content/uploads/2025/03/WithoutOcclusion_2.avif" alt="" class="wp-image-12246"/><figcaption class="wp-element-caption">从上方再次展示了与图2.1-2.3相同的相机视角。每个瓦片都被涂上了随机颜色，以便更容易区分瓦片。在第一张图片中，3D Tiles的遮挡剔除关闭，加载了93个瓦片。</figcaption></figure>

<figure class="wp-block-image size-full"><img loading="lazy" decoding="async" width="1352" height="768" src="/wp-content/uploads/2025/03/WithOcclusion_3.avif" alt="" class="wp-image-12247"/><figcaption class="wp-element-caption">在第二张图片中，3D Tiles的遮挡剔除开启，加载的瓦片数减少到51个。如前节所述，选择算法会拒绝精炼已被遮挡的瓦片。与上述图片相比，可以注意到在那些大部分被相机遮挡的区域，加载的瓦片较少且细节较低。另一方面，靠近相机的未被遮挡区域不受遮挡剔除的影响。</figcaption></figure>

<h3 class="wp-block-heading">基准测试</h3>

<p class="wp-block-paragraph">遮挡剔除将最有利于深度复杂度较高的密集场景。地面级场景，如步行或驾驶，通常会比飞行模拟器等空中场景有更高的遮挡比例。</p>

<p class="wp-block-paragraph">我们测试了一些具有代表性的场景和相机运动，分别在启用和未启用遮挡剔除的情况下，来量化这些普遍现象。以下的脚本化相机飞行展示了在3D Tiles中，遮挡剔除的典型情况、理想情况和最差情况。</p>

<div class="wp-block-image">
<figure class="aligncenter size-full"><img loading="lazy" decoding="async" width="600" height="331" src="/wp-content/uploads/2025/03/Optimized_AvgFlythrough.avif" alt="" class="wp-image-12248"/><figcaption class="wp-element-caption">我们使用墨尔本图块集的脚本化飞行来比较启用和未启用遮挡剔除的情况下的总图块加载量。这个飞行展示了典型的城市图块集探索情况。</figcaption></figure>
</div>

<div class="wp-block-image">
<figure class="aligncenter size-full"><img loading="lazy" decoding="async" width="805" height="600" src="/wp-content/uploads/2025/03/AvgFlythroughChart.avif" alt="" class="wp-image-12249"/><figcaption class="wp-element-caption">图3.2中脚本化飞行的图块加载量，分别在启用和未启用遮挡剔除的情况下。这是Cesium for Unreal中遮挡剔除的典型表现情况。在这种情况下，遮挡剔除节省了大约17%的图块加载量。</figcaption></figure>
</div>

<div class="wp-block-image">
<figure class="aligncenter size-full"><img loading="lazy" decoding="async" width="600" height="319" src="/wp-content/uploads/2025/03/Optimized_GroundLevelFlythrough.avif" alt="" class="wp-image-12250"/><figcaption class="wp-element-caption">一个具有高深度复杂度的地面级飞行，探索墨尔本图块集。</figcaption></figure>
</div>

<div class="wp-block-image">
<figure class="aligncenter size-full"><img loading="lazy" decoding="async" width="805" height="600" src="/wp-content/uploads/2025/03/GroundLevelFlythroughChart.avif" alt="" class="wp-image-12251"/><figcaption class="wp-element-caption">图3.4中脚本化飞行的图块加载量，分别在启用和未启用遮挡剔除的情况下。这是遮挡剔除的理想视图场景。在这种情况下，遮挡剔除节省了大约31%的图块加载量。</figcaption></figure>
</div>

<div class="wp-block-image">
<figure class="aligncenter size-full"><img loading="lazy" decoding="async" width="600" height="331" src="/wp-content/uploads/2025/03/AerialFlythrough.avif" alt="" class="wp-image-12252"/><figcaption class="wp-element-caption">一个空中飞行，探索墨尔本图块集，几乎没有遮挡的机会。</figcaption></figure>
</div>

<div class="wp-block-image">
<figure class="aligncenter size-full"><img loading="lazy" decoding="async" width="805" height="600" src="/wp-content/uploads/2025/03/AerialFlythroughChart.avif" alt="" class="wp-image-12253"/><figcaption class="wp-element-caption">图3.6中脚本化空中飞行的图块加载量，分别在启用和未启用遮挡剔除的情况下。空中视图，例如高空飞行穿越城市或地形，具有深远的无阻碍视野，通常不太受益于遮挡剔除。在遮挡较少的使用场景中，由于额外的相对简单的遮挡检查，可能会有轻微的，但几乎无法察觉的计算开销。您可以尝试在Cesium3DTileset演员上禁用遮挡剔除，以节省遮挡查询的开销。</figcaption></figure>
</div>

<h2 class="wp-block-heading">结论</h2>

<p class="wp-block-paragraph">这些改进以及其他优化已在Cesium for Unreal v1.16.2版本中提供，现在可以使用。如果您已经安装了Cesium for Unreal，请通过Epic Games启动器更新插件版本。</p>

<p class="wp-block-paragraph">要启用实验性3D Tiles遮挡剔除支持，请前往“编辑” → “项目设置”，滚动到“插件”部分并点击左侧面板上的Cesium，勾选“启用实验性遮挡剔除功能”。</p>

<div class="wp-block-image">
<figure class="aligncenter size-full"><img loading="lazy" decoding="async" width="998" height="657" src="/wp-content/uploads/2025/03/EnableOcclusionCulling.avif" alt="" class="wp-image-12254"/></figure>
</div>

<p class="wp-block-paragraph">如果您是Cesium for Unreal的新用户，现在正是尝试它的好时机——请查看我们的快速入门教程，开始使用！</p>

<h2 class="wp-block-heading">参考资料</h2>

<ul class="wp-block-list">
<li><a href="https://dev.epicgames.com/documentation/en-us/unreal-engine/visibility-and-occlusion-culling?application_version=4.27" target="_blank" rel="noopener">Visibility and Occlusion Culling</a></li>

<li><a href="https://cesium.com/blog/2022/08/18/occlusion-culling-cesium-for-unreal/" target="_blank" rel="noopener">Optimizing 3D Tiles Streaming in Cesium for Unreal with Occlusion Culling</a></li>
</ul>
