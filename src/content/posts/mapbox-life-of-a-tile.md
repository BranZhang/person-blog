---
title: "Mapbox 矢量瓦片的生命周期介绍"
description: "翻译自 maplibre/maplibre-gl-js 项目的《life-of-a-tile》，介绍了矢量瓦片的请求，解析，渲染的流程。"
pubDatetime: 2021-02-28T02:07:00.000Z
modDatetime: 2025-02-18T14:31:16.000Z
author: "Zhang"
tags:
  - "mapbox"
  - "WebGL"
  - "地图"
  - "GIS"
canonicalURL: "https://littlepotato.me/2021/02/28/mapbox-life-of-a-tile/"
---

<p class="wp-block-paragraph"><strong>本篇文章翻译自 <a href="https://github.com/maplibre/maplibre-gl-js/blob/main/docs/life-of-a-tile.md" data-type="URL" data-id="https://github.com/maplibre/maplibre-gl-js/blob/main/docs/life-of-a-tile.md" target="_blank" rel="noreferrer noopener">maplibre/maplibre-gl-js 项目的《life-of-a-tile》</a>。文中的超链接，对应到 Mapbox 的 v1.13.2 版本。</strong></p>

<p class="wp-block-paragraph">本篇文章将说明在 Mapbox 中，一个瓦片的加载流程，整个过程可以分为3个部分：</p>

<ul class="wp-block-list">
<li><strong>Event loop：</strong>由用户交互触发，并更新 map 内部的信息，例如 viewport，相机视角等。</li>

<li><strong>Tile loading：</strong>异步请求当前地图所需要的瓦片，图片，字体等数据。</li>

<li><strong>Render loop：</strong>将当前状态的地图渲染到屏幕上。</li>
</ul>

<p class="wp-block-paragraph">理想状况下，Event loop 和 Render loop 以60帧每秒的速度运转，类似 Tile loading 等重活，会放在 web worker 中异步执行。</p>

<!--more-->

<hr class="wp-block-separator has-alpha-channel-opacity is-style-wide"/>

<h2 class="wp-block-heading">Event Loop</h2>

<div class="wp-block-image is-style-default">
<figure class="aligncenter size-full"><img decoding="async" src="/wp-content/uploads/2022/09/event-loop.plantuml.svg" alt="" class="wp-image-11791"/><figcaption class="wp-element-caption">https://github.com/maplibre/maplibre-gl-js/blob/main/docs/diagrams/event-loop.plantuml.svg</figcaption></figure>
</div>

<h3 class="wp-block-heading">Transform</h3>

<p class="wp-block-paragraph"><a href="https://github.com/mapbox/mapbox-gl-js/blob/release-v1.13.2/src/geo/transform.js" target="_blank" data-type="URL" data-id="https://github.com/mapbox/mapbox-gl-js/blob/release-v1.13.2/src/geo/transform.js" rel="noreferrer noopener">Transform</a> 中保存了当前地图视角的信息（pitch, zoom, bearing, bounds 等）。代码中有2个地方能够直接更新 transform 的状态：</p>

<ul class="wp-block-list">
<li><a href="https://github.com/mapbox/mapbox-gl-js/blob/release-v1.13.2/src/ui/camera.js" target="_blank" data-type="URL" data-id="https://github.com/mapbox/mapbox-gl-js/blob/release-v1.13.2/src/ui/camera.js" rel="noreferrer noopener">Camera</a>（<a href="https://github.com/mapbox/mapbox-gl-js/blob/release-v1.13.2/src/ui/map.js" target="_blank" data-type="URL" data-id="https://github.com/mapbox/mapbox-gl-js/blob/release-v1.13.2/src/ui/map.js" rel="noreferrer noopener">Map</a> 的父类）中的 <a href="https://github.com/mapbox/mapbox-gl-js/blob/release-v1.13.2/src/ui/camera.js#L211" target="_blank" data-type="URL" data-id="https://github.com/mapbox/mapbox-gl-js/blob/release-v1.13.2/src/ui/camera.js#L211" rel="noreferrer noopener">Camera#panTo</a>，<a href="https://github.com/mapbox/mapbox-gl-js/blob/release-v1.13.2/src/ui/camera.js#L173" target="_blank" data-type="URL" rel="noreferrer noopener">Camera#setCenter</a> 等方法被调用时。</li>

<li><a href="https://github.com/mapbox/mapbox-gl-js/blob/release-v1.13.2/src/ui/handler_manager.js" target="_blank" data-type="URL" data-id="https://github.com/mapbox/mapbox-gl-js/blob/release-v1.13.2/src/ui/handler_manager.js" rel="noreferrer noopener">HandlerManager</a> 响应 DOM 事件。HandlerManager 将这些事件转发到 <a href="https://github.com/mapbox/mapbox-gl-js/tree/release-v1.13.2/src/ui/handler" target="_blank" data-type="URL" data-id="https://github.com/mapbox/mapbox-gl-js/tree/release-v1.13.2/src/ui/handler" rel="noreferrer noopener">src/ui/handler</a> 中的交互处理模块，这些 handlers 的事件将合并为 <a href="https://github.com/mapbox/mapbox-gl-js/blob/release-v1.13.2/src/ui/handler_manager.js#L70" target="_blank" data-type="URL" data-id="https://github.com/mapbox/mapbox-gl-js/blob/release-v1.13.2/src/ui/handler_manager.js#L70" rel="noreferrer noopener">HandlerResult</a> 并触发一次渲染。并结合 <a href="https://github.com/mapbox/mapbox-gl-js/blob/release-v1.13.2/src/ui/handler_inertia.js" target="_blank" data-type="URL" data-id="https://github.com/mapbox/mapbox-gl-js/blob/release-v1.13.2/src/ui/handler_inertia.js" rel="noreferrer noopener">HandlerInertia</a> 来实现地图的惯性操作（比如快速拖动地图，松开鼠标后地图会出于惯性继续移动一段距离）。</li>
</ul>

<h3 class="wp-block-heading">Camera 和 HandlerManager</h3>

<p class="wp-block-paragraph">Camera 和 HandlerManager 都可以在更新了 transform 的状态后，抛出 <mark style="background-color:#e0e0e0" class="has-inline-color"><code>move</code></mark>，<mark style="background-color:#e0e0e0" class="has-inline-color"><code>zoom</code></mark>，<mark style="background-color:#e0e0e0" class="has-inline-color"><code>movestart</code></mark>，<mark style="background-color:#e0e0e0" class="has-inline-color"><code>moveend</code></mark> 等事件。这些事件，包括其他的事件，例如样式更改或者数据加载完成的事件，都将触发对 <a href="https://github.com/mapbox/mapbox-gl-js/blob/release-v1.13.2/src/ui/map.js#L2439" target="_blank" data-type="URL" data-id="https://github.com/mapbox/mapbox-gl-js/blob/release-v1.13.2/src/ui/map.js#L2439" rel="noreferrer noopener">Map#_render()</a> 的调用，并渲染一帧地图画面。</p>

<hr class="wp-block-separator has-alpha-channel-opacity is-style-wide"/>

<h2 class="wp-block-heading">Tile loading</h2>

<div class="wp-block-image">
<figure class="aligncenter size-full"><img decoding="async" src="/wp-content/uploads/2022/09/fetch-tile.plantuml.svg" alt="" class="wp-image-11792"/><figcaption class="wp-element-caption">https://github.com/maplibre/maplibre-gl-js/blob/main/docs/diagrams/fetch-tile.plantuml.svg</figcaption></figure>
</div>

<p class="wp-block-paragraph"><a href="https://github.com/mapbox/mapbox-gl-js/blob/release-v1.13.2/src/ui/map.js#L2439" data-type="URL" data-id="https://github.com/mapbox/mapbox-gl-js/blob/release-v1.13.2/src/ui/map.js#L2439" target="_blank" rel="noreferrer noopener">Map#_render()</a> 会以2种不同的方式执行，取决于 <code><mark style="background-color:#e0e0e0" class="has-inline-color has-black-color">map._sourcesDirty</mark></code> 的值。当 _sourcesDirty 为 true 时，_render() 首先要询问每个 source，是否需要请求新的数据。_sourcesDirty 为 false 时的情况将在下一节介绍。</p>

<h3 class="wp-block-heading">请求</h3>

<p class="wp-block-paragraph">地图中的每个 source 对应着一个 sourceCache，调用这些 <a href="https://github.com/mapbox/mapbox-gl-js/blob/release-v1.13.2/src/source/source_cache.js#L474" data-type="URL" data-id="https://github.com/mapbox/mapbox-gl-js/blob/release-v1.13.2/src/source/source_cache.js#L474" target="_blank" rel="noreferrer noopener"></a><a href="https://github.com/mapbox/mapbox-gl-js/blob/release-v1.13.2/src/source/source_cache.js#L474" target="_blank" data-type="URL" data-id="https://github.com/mapbox/mapbox-gl-js/blob/release-v1.13.2/src/source/source_cache.js#L474" rel="noreferrer noopener">SourceCache#update(transform)</a>，得到理想状况下可以覆盖整个地图窗口范围的瓦片编号，如果存在没有请求过的瓦片，则发出请求。如果当前编号对应的瓦片不存在，则请求涵盖当前区域并且 z 值更小的瓦片。</p>

<h3 class="wp-block-heading">解析</h3>

<p class="wp-block-paragraph">调用 <code><mark style="background-color:#e0e0e0" class="has-inline-color">Source#loadTile(tile, callback)</mark></code> 来加载缺失的瓦片，不同类型的 source 加载方式不一样：</p>

<h4 class="wp-block-heading"><a href="https://github.com/mapbox/mapbox-gl-js/blob/release-v1.13.2/src/source/raster_tile_source.js" target="_blank" data-type="URL" data-id="https://github.com/mapbox/mapbox-gl-js/blob/release-v1.13.2/src/source/raster_tile_source.js" rel="noreferrer noopener">RasterTileSource</a></h4>

<p class="wp-block-paragraph">通过 <a href="https://github.com/mapbox/mapbox-gl-js/blob/release-v1.13.2/src/util/ajax.js" target="_blank" data-type="URL" data-id="https://github.com/mapbox/mapbox-gl-js/blob/release-v1.13.2/src/util/ajax.js" rel="noreferrer noopener">src/util/ajax</a> 来触发 getImage 请求，src/util/ajax 维护着一个请求队列，用于控制同时进行中的请求数量。</p>

<h4 class="wp-block-heading"><a href="https://github.com/mapbox/mapbox-gl-js/blob/release-v1.13.2/src/source/raster_dem_tile_source.js" target="_blank" data-type="URL" data-id="https://github.com/mapbox/mapbox-gl-js/blob/release-v1.13.2/src/source/raster_dem_tile_source.js" rel="noreferrer noopener">RasterDEMTileSource</a></h4>

<p class="wp-block-paragraph">和上面的一样，首先请求图像数据，接着向 web worker 发出 loadDEMTile 消息。因为需要从图像数据中读取像素的信息，必须要将图像绘制到 canvas 上，这一步的性能开销比较大，所以当浏览器支持 OffscreenCanvas 时，这一步将在 web worker 中执行，否则直接在主线程上执行。</p>

<p class="wp-block-paragraph">在 web worker 内，通过 <a href="https://github.com/mapbox/mapbox-gl-js/blob/release-v1.13.2/src/source/raster_dem_tile_source.js#L42" target="_blank" data-type="URL" data-id="https://github.com/mapbox/mapbox-gl-js/blob/release-v1.13.2/src/source/raster_dem_tile_source.js#L42" rel="noreferrer noopener">RasterDEMTileWorkerSource#loadTile</a> 将原始的 rgb 数据加载到一个 <a href="https://github.com/mapbox/mapbox-gl-js/blob/release-v1.13.2/src/data/dem_data.js" data-type="URL" data-id="https://github.com/mapbox/mapbox-gl-js/blob/release-v1.13.2/src/data/dem_data.js" target="_blank" rel="noreferrer noopener">DEMData</a> 实例中，并填充瓦片边缘 1px 的区域来避免闪烁的现象。最后将数据传回到主线程中。</p>

<h4 class="wp-block-heading"><a href="https://github.com/mapbox/mapbox-gl-js/blob/release-v1.13.2/src/source/vector_tile_source.js" target="_blank" data-type="URL" data-id="https://github.com/mapbox/mapbox-gl-js/blob/release-v1.13.2/src/source/vector_tile_source.js" rel="noreferrer noopener">VectorTileSource</a></h4>

<p class="wp-block-paragraph">向 web worker 发出 loadTile 或者 reloadTile 的消息，在 web worker 内，<a href="https://github.com/mapbox/mapbox-gl-js/blob/release-v1.13.2/src/source/worker.js#L99" target="_blank" data-type="URL" data-id="https://github.com/mapbox/mapbox-gl-js/blob/release-v1.13.2/src/source/worker.js#L99" rel="noreferrer noopener">Worker#loadTile</a> 收到消息并传递给 <a href="https://github.com/mapbox/mapbox-gl-js/blob/release-v1.13.2/src/source/vector_tile_source.js#L184" data-type="URL" data-id="https://github.com/mapbox/mapbox-gl-js/blob/release-v1.13.2/src/source/vector_tile_source.js#L184" target="_blank" rel="noreferrer noopener">VectorTileWorkerSource#loadTile</a>。</p>

<p class="wp-block-paragraph">调用 <a href="https://github.com/mapbox/mapbox-gl-js/blob/release-v1.13.2/src/source/vector_tile_source.js#L184" data-type="URL" data-id="https://github.com/mapbox/mapbox-gl-js/blob/release-v1.13.2/src/source/vector_tile_source.js#L184" target="_blank" rel="noreferrer noopener">VectorTileWorkerSource#loadTile</a>，内部的处理逻辑为：</p>

<ul class="wp-block-list">
<li>通过 <a href="https://github.com/mapbox/mapbox-gl-js/blob/release-v1.13.2/src/util/ajax.js#L261" target="_blank" data-type="URL" data-id="https://github.com/mapbox/mapbox-gl-js/blob/release-v1.13.2/src/util/ajax.js#L261" rel="noreferrer noopener">ajax#getArrayBuffer()</a> 获取二进制数据；</li>

<li>通过 <a href="https://github.com/mapbox/pbf" target="_blank" data-type="URL" data-id="https://github.com/mapbox/pbf" rel="noreferrer noopener">pbf</a> 解码 protobuf；</li>

<li>通过 <a href="https://github.com/mapbox/vector-tile" target="_blank" data-type="URL" data-id="https://github.com/mapbox/vector-tile" rel="noreferrer noopener">@mapbox/vector-tile#VectorTile</a> 解析矢量瓦片中的数据；</li>

<li>将结果传入到一个新的 <a href="https://github.com/mapbox/mapbox-gl-js/blob/release-v1.13.2/src/source/worker_tile.js" target="_blank" data-type="URL" data-id="https://github.com/mapbox/mapbox-gl-js/blob/release-v1.13.2/src/source/worker_tile.js" rel="noreferrer noopener">WorkerTile</a> 实例中。</li>
</ul>

<p class="wp-block-paragraph">调用 <a href="https://github.com/mapbox/mapbox-gl-js/blob/release-v1.13.2/src/source/worker_tile.js#L66" target="_blank" data-type="URL" data-id="https://github.com/mapbox/mapbox-gl-js/blob/release-v1.13.2/src/source/worker_tile.js#L66" rel="noreferrer noopener">WorkerTile#parse()</a>。在 web worker 里，根据瓦片的 id 接收上面的处理结果：</p>

<ul class="wp-block-list">
<li>对于每个矢量瓦片的 source layer，对应的 source layer 当前处于可见状态的图层：
<ul class="wp-block-list">
<li>通过 recalculateLayers 方法计算 layout 相关的属性；</li>

<li>调用 style.createBucket, 每种类型的图层的数据源都有一个对应的 bucket 类型的对象，bucket 类在 <a href="https://github.com/mapbox/mapbox-gl-js/tree/release-v1.13.2/src/data/bucket" target="_blank" data-type="URL" data-id="https://github.com/mapbox/mapbox-gl-js/tree/release-v1.13.2/src/data/bucket" rel="noreferrer noopener">src/data/bucket/*</a> 目录中，它们都有同一个父类 <a href="https://github.com/mapbox/mapbox-gl-js/blob/release-v1.13.2/src/data/bucket.js" target="_blank" data-type="URL" data-id="https://github.com/mapbox/mapbox-gl-js/blob/release-v1.13.2/src/data/bucket.js" rel="noreferrer noopener">src/data/bucket</a>。</li>

<li>调用 <a href="https://github.com/mapbox/mapbox-gl-js/blob/release-v1.13.2/src/data/bucket.js#L78" target="_blank" data-type="URL" data-id="https://github.com/mapbox/mapbox-gl-js/blob/release-v1.13.2/src/data/bucket.js#L78" rel="noreferrer noopener">Bucket#populate()</a>，传入对应的 source layer 的矢量瓦片中的 features。这一步将预处理好需要从主线程加载到 GPU 的每一帧的数据。（例如：构成几何形状的三角形顶点的缓冲区）</li>
</ul>
</li>

<li>到这里，大多数类型的图层已经对 features 数据做好了三角剖分的处理，不过有些图层还会有一些额外的数据依赖，所以需要等待主线程对这些数据完成处理：
<ul class="wp-block-list">
<li>字体文件（Font PBFs），通过 getGlyphs 方法
<ul class="wp-block-list">
<li>由运行在主线程上的 <a href="https://github.com/mapbox/mapbox-gl-js/blob/release-v1.13.2/src/render/glyph_manager.js" target="_blank" data-type="URL" data-id="https://github.com/mapbox/mapbox-gl-js/blob/release-v1.13.2/src/render/glyph_manager.js" rel="noreferrer noopener">GlyphManager</a>，管理已获取的全局文字缓存。当一个字符缺失时，要么使用 <a href="https://github.com/mapbox/tiny-sdf" target="_blank" data-type="URL" data-id="https://github.com/mapbox/tiny-sdf" rel="noreferrer noopener">tinysdf</a> 在 canvas 上绘制这个字符，要么计算字符对应的 PBF 文件，并发起网络请求。</li>
</ul>
</li>

<li>图标（Icons）和图案（patterns），通过 getImages({type: &#8216;icon&#8217; | &#8216;pattern&#8217; }) 方法
<ul class="wp-block-list">
<li>由运行在主线程上的 <a href="https://github.com/mapbox/mapbox-gl-js/blob/release-v1.13.2/src/render/image_manager.js" target="_blank" data-type="URL" data-id="https://github.com/mapbox/mapbox-gl-js/blob/release-v1.13.2/src/render/image_manager.js" rel="noreferrer noopener">ImageManager</a> 管理这些图像缓存，如果没有，则通过网络进行请求。</li>
</ul>
</li>
</ul>
</li>
</ul>

<p class="wp-block-paragraph">当所有的数据全都准备好时（通过 <a href="https://github.com/mapbox/mapbox-gl-js/blob/release-v1.13.2/src/source/worker_tile.js#L178" target="_blank" data-type="URL" data-id="https://github.com/mapbox/mapbox-gl-js/blob/release-v1.13.2/src/source/worker_tile.js#L178" rel="noreferrer noopener">WorkerTile#maybePrepare()</a> 判断），使用 <a href="https://github.com/mapbox/potpack" target="_blank" data-type="URL" data-id="https://github.com/mapbox/potpack" rel="noreferrer noopener">potpack</a>，将用到的字体，图标和图像构建成一个可以加载到 GPU 的正方形矩阵，这个正方形矩阵保存在 <a href="https://github.com/mapbox/mapbox-gl-js/blob/release-v1.13.2/src/render/glyph_atlas.js" target="_blank" data-type="URL" data-id="https://github.com/mapbox/mapbox-gl-js/blob/release-v1.13.2/src/render/glyph_atlas.js" rel="noreferrer noopener">GlyphAtlas</a> 和 <a href="https://github.com/mapbox/mapbox-gl-js/blob/release-v1.13.2/src/render/image_atlas.js" target="_blank" data-type="URL" data-id="https://github.com/mapbox/mapbox-gl-js/blob/release-v1.13.2/src/render/image_atlas.js" rel="noreferrer noopener">ImageAtlas</a> 对象中。之后对每个等待以上这些数据的图层，调用 <a href="https://github.com/mapbox/mapbox-gl-js/blob/release-v1.13.2/src/style/style_layer.js#L198" target="_blank" data-type="URL" data-id="https://github.com/mapbox/mapbox-gl-js/blob/release-v1.13.2/src/style/style_layer.js#L198" rel="noreferrer noopener">StyleLayer#recalculate()</a> 方法，并且：</p>

<ul class="wp-block-list">
<li>在每个等待图案类资源加载的 buckets 上调用 addFeatures。</li>

<li>在每个等待 symbol 类资源的 buckets 上调用 <a href="https://github.com/mapbox/mapbox-gl-js/blob/release-v1.13.2/src/symbol/symbol_layout.js#L150" target="_blank" data-type="URL" data-id="https://github.com/mapbox/mapbox-gl-js/blob/release-v1.13.2/src/symbol/symbol_layout.js#L150" rel="noreferrer noopener">src/symbol/symbol_layout#performSymbolLayout()</a>，计算得到文本图层在当前地图 zoom 级别的 layout 属性，以及根据字体形状的每个 symbol 的位置。同时保存这些 symbol 几何的三角剖分的结果。之后，每个 symbol 的碰撞盒（collision boxes）也将被计算好，用于文字和图标的碰撞检测。</li>
</ul>

<p class="wp-block-paragraph">将这些 buckets，featureIndex，collision boxes，glyphAtlas 和 imageAtlas 传回主线程。</p>

<h4 class="wp-block-heading"><a href="https://github.com/mapbox/mapbox-gl-js/blob/release-v1.13.2/src/source/geojson_worker_source.js" target="_blank" data-type="URL" data-id="https://github.com/mapbox/mapbox-gl-js/blob/release-v1.13.2/src/source/geojson_worker_source.js" rel="noreferrer noopener">GeojsonSource</a></h4>

<p class="wp-block-paragraph">和 VectorTileSource 几乎一样，向 web worker 发出 loadTile 或者 reloadTile 的消息，除了 GeojsonWorkerSource 继承 VectorTileWorkerSource 后重写了 <mark style="background-color:#e0e0e0" class="has-inline-color"><code>loadVectorData</code></mark> 方法，因此不需要请求矢量瓦片并按照 pbf 规范解析，而是直接获取 geojson 数据并通过 <a href="https://github.com/mapbox/geojson-vt" target="_blank" data-type="URL" data-id="https://github.com/mapbox/geojson-vt" rel="noreferrer noopener">geojson-vt</a> 处理成类似矢量瓦片的格式，这样可以依旧使用 getTile 方法来获取主线程所需要的瓦片数据。</p>

<blockquote class="wp-block-quote is-layout-flow wp-block-quote-is-layout-flow">
<p class="wp-block-paragraph">插一嘴：Mapbox 将 geojson 数据源这样处理后，一方面能够将 LOD 策略应用到 geojson 数据上，另一方面，底层的绘制逻辑只需要针对矢量瓦片这一种数据规范即可，而不需要同时考虑瓦片和 geojson 两种。</p>
</blockquote>

<h4 class="wp-block-heading"><a href="https://github.com/mapbox/mapbox-gl-js/blob/release-v1.13.2/src/source/image_source.js" target="_blank" data-type="URL" data-id="https://github.com/mapbox/mapbox-gl-js/blob/release-v1.13.2/src/source/image_source.js" rel="noreferrer noopener">ImageSource</a></h4>

<p class="wp-block-paragraph">计算出一个瓦片编号，要满足 zoom 值足够大，并且这个瓦片的边界包含了 ImageSource 的坐标范围。只有在主线程正在请求这个瓦片时，loadTile() 会返回 true。（在使用这个 source 的图层被添加到地图中时，就已经去请求这个图片了）</p>

<hr class="wp-block-separator has-alpha-channel-opacity"/>

<p class="wp-block-paragraph">当 vector 或者 geojson 类型的 source 请求的数据返回到主线程时，会通过 <a href="https://github.com/mapbox/mapbox-gl-js/blob/release-v1.13.2/src/source/tile.js#L140" target="_blank" data-type="URL" data-id="https://github.com/mapbox/mapbox-gl-js/blob/release-v1.13.2/src/source/tile.js#L140" rel="noreferrer noopener">Tile#loadVectorData</a> 来解析数据并存储到 buckets 中。</p>

<h3 class="wp-block-heading">准备渲染</h3>

<p class="wp-block-paragraph">再回到 <a href="https://github.com/mapbox/mapbox-gl-js/blob/release-v1.13.2/src/source/source_cache.js" target="_blank" data-type="URL" data-id="https://github.com/mapbox/mapbox-gl-js/blob/release-v1.13.2/src/source/source_cache.js" rel="noreferrer noopener">SourceCache</a> 上，缺失的瓦片已经加载完成了，接下来就是：</p>

<ul class="wp-block-list">
<li>（插一嘴：应该是上面的 RasterDEMTileSource 中处理流程的后续）在 <a href="https://github.com/mapbox/mapbox-gl-js/blob/release-v1.13.2/src/source/source_cache.js#L274" target="_blank" data-type="URL" data-id="https://github.com/mapbox/mapbox-gl-js/blob/release-v1.13.2/src/source/source_cache.js#L274" rel="noreferrer noopener">SourceCache#_backfillDEM</a> 中，对于每一块瓦片，复制相邻的瓦片的边缘的像素，从而避免瓦片边缘处的伪影。</li>

<li>在 source 对象层面，抛出 data {dataType: &#8216;source&#8217;} 事件。事件向上冒泡，经过 SourceCache，Style，Map，最终转换成为 sourcedata 事件，并且会调用 Map#_update()，进而触发 Map#triggerRepaint()，最终触发 Map#_render() 来渲染新的一帧，这一帧的渲染流程和用户手动触发相机视角变化导致的渲染是一样的。</li>
</ul>

<hr class="wp-block-separator has-alpha-channel-opacity is-style-wide"/>

<h2 class="wp-block-heading">Render loop</h2>

<figure class="wp-block-image size-full"><img decoding="async" src="/wp-content/uploads/2022/09/render-frame.plantuml.svg" alt="" class="wp-image-11793"/><figcaption class="wp-element-caption">https://github.com/maplibre/maplibre-gl-js/blob/main/docs/diagrams/render-frame.plantuml.svg</figcaption></figure>

<p class="wp-block-paragraph">当 _sourcesDirty 为 false 时，map#_render() 将会直接在主线程上渲染新的一帧：</p>

<ul class="wp-block-list">
<li>调用 <a href="https://github.com/mapbox/mapbox-gl-js/blob/release-v1.13.2/src/style/style.js#L381" data-type="URL" data-id="https://github.com/mapbox/mapbox-gl-js/blob/release-v1.13.2/src/style/style.js#L381" target="_blank" rel="noreferrer noopener">Style#update()</a>，进而调用每个图层的 <mark style="background-color:#e0e0e0" class="has-inline-color"><code>recalculate()</code></mark> 方法，根据当前的 zoom 和 transition 状态重新计算 paint 属性值。</li>

<li>通过 <a href="https://github.com/mapbox/mapbox-gl-js/blob/release-v1.13.2/src/source/source_cache.js#L474" data-type="URL" data-id="https://github.com/mapbox/mapbox-gl-js/blob/release-v1.13.2/src/source/source_cache.js#L474" target="_blank" rel="noreferrer noopener">SourceCache#update(transform)</a> 请求新的瓦片，流程与上一节一致。</li>

<li>根据当前的图层样式，调用 <a href="https://github.com/mapbox/mapbox-gl-js/blob/release-v1.13.2/src/render/painter.js#L357" data-type="URL" data-id="https://github.com/mapbox/mapbox-gl-js/blob/release-v1.13.2/src/render/painter.js#L357" target="_blank" rel="noreferrer noopener">Painter#render(style)</a>：
<ul class="wp-block-list">
<li>对每个 source 调用 SourceCache#prepare(context)。</li>

<li>对于 source 中的每个瓦片：
<ul class="wp-block-list">
<li>调用 <a href="https://github.com/mapbox/mapbox-gl-js/blob/release-v1.13.2/src/source/tile.js#L241" target="_blank" data-type="URL" data-id="https://github.com/mapbox/mapbox-gl-js/blob/release-v1.13.2/src/source/tile.js#L241" rel="noreferrer noopener">Tile#upload(context)</a>，进而调用每个图层的 bucket 对象的 <a href="https://github.com/mapbox/mapbox-gl-js/blob/release-v1.13.2/src/data/bucket.js#L82" target="_blank" data-type="URL" data-id="https://github.com/mapbox/mapbox-gl-js/blob/release-v1.13.2/src/data/bucket.js#L82" rel="noreferrer noopener">Bucket#upload(context)</a>，这样可以将 GPU 绘制所需的顶点属性加载到 GPU 中。</li>

<li>调用 <a href="https://github.com/mapbox/mapbox-gl-js/blob/release-v1.13.2/src/source/tile.js#L261" target="_blank" data-type="URL" data-id="https://github.com/mapbox/mapbox-gl-js/blob/release-v1.13.2/src/source/tile.js#L261" rel="noreferrer noopener">Tile#prepare(imageManager)</a>，将图像纹理等（patterns，icons）加载到 GPU 中。 </li>
</ul>
</li>

<li>每个图层的绘制有4道处理通道，对于每个图层，都会调用 <a href="https://github.com/mapbox/mapbox-gl-js/blob/release-v1.13.2/src/render" target="_blank" data-type="URL" data-id="https://github.com/mapbox/mapbox-gl-js/blob/release-v1.13.2/src/render" rel="noreferrer noopener">src/render/draw_*</a> 中的 renderLayer() 方法：
<ul class="wp-block-list">
<li>offscreen 通道。对于 custom，hillshading 和 heatmap 图层，需要借助 GPU 预计算并且缓存一些数据到离屏的帧缓冲上。</li>

<li>opaque 通道。按照从上到下的顺序，以不透明的方式预先渲染 fill 和 background 类型的图层。</li>

<li>translucent 通道。按照从下到上的顺序，渲染其他类型的图层。</li>

<li>debug 通道。在最上层绘制一些调试信息，例如碰撞盒（collision boxes），瓦片边界等。</li>
</ul>
</li>

<li>每个 renderLayer() 会遍历可见的瓦片进行绘制，绑定纹理，使用 <a href="https://github.com/mapbox/mapbox-gl-js/blob/release-v1.13.2/src/shaders" target="_blank" data-type="URL" data-id="https://github.com/mapbox/mapbox-gl-js/blob/release-v1.13.2/src/shaders" rel="noreferrer noopener">src/shaders</a> 中定义的着色器，通过 <a href="https://github.com/mapbox/mapbox-gl-js/blob/release-v1.13.2/src/render/program.js#L123" target="_blank" data-type="URL" data-id="https://github.com/mapbox/mapbox-gl-js/blob/release-v1.13.2/src/render/program.js#L123" rel="noreferrer noopener">Program#draw()</a> 来配置 GPU 的绘制参数以及着色器的全局变量。最后，调用 <a href="https://github.com/mapbox/mapbox-gl-js/blob/release-v1.13.2/src/render/program.js#L179" target="_blank" data-type="URL" data-id="https://github.com/mapbox/mapbox-gl-js/blob/release-v1.13.2/src/render/program.js#L179" rel="noreferrer noopener">gl.drawElements()</a>，真正意义上的，将这个图层的一个瓦片绘制到屏幕上。</li>
</ul>
</li>

<li>最终，如果还有其他的渲染任务，则继续执行 repaint 相关的流程；否则，地图渲染流程完成，抛出 idle 事件。</li>
</ul>

<p class="wp-block-paragraph"></p>

<p class="wp-block-paragraph"></p>

<p class="wp-block-paragraph"></p>

<p class="wp-block-paragraph"></p>

<p class="wp-block-paragraph"></p>

<p class="wp-block-paragraph"></p>

<p class="wp-block-paragraph"></p>
