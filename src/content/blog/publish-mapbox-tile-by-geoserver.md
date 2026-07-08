---
title: "用 GeoServer 发布适用于 Mapbox 的矢量切片"
description: "使用 GeoServer 搭建适用于 Mapbox 的矢量瓦片服务过程记录。好久没更新了，拿这篇来凑凑数。"
pubDate: "2021-01-05T10:10:24.000Z"
updatedDate: "2025-02-18T14:32:47.000Z"
published: true
tags: ["geoserver","mapbox","mvt","GIS"]
---
<p class="wp-block-paragraph">Mapbox 的矢量切片的服务发布方式不仅限于使用 GeoServer，Mapbox 自己本身也在提供这样的数据切片服务，本文仅为使用 GeoServer 提供同样的数据切片服务的操作说明，适用于规避 Mapbox 数据存储收费，内网部署等场景。</p>

<p class="wp-block-paragraph">不过 Mapbox 貌似不再对数据存储收费了？而且如果一个人或者一家公司能够在内网中部署地图服务，数据矢量切片应该也不在话下？所以本文的方案到底会在什么样的场景下有用？</p>

<!--more-->

<h4 class="wp-block-heading">步骤一：安装 GeoServer</h4>

<p class="wp-block-paragraph">参考文档：<a href="https://docs.geoserver.org/latest/en/user/installation/index.html#installation" class="rank-math-link" target="_blank" rel="noopener">Installation</a></p>

<h4 class="wp-block-heading">步骤二：打开 GeoServer 的跨域访问</h4>

<p class="wp-block-paragraph">参考文档：<a href="https://docs.geoserver.org/latest/en/user/production/container.html#production-container-enable-cors" class="rank-math-link" target="_blank" rel="noopener">Enable CORS</a></p>

<h4 class="wp-block-heading">步骤三：安装 Vector Tiles 扩展</h4>

<p class="wp-block-paragraph">参考教程：<a href="https://docs.geoserver.org/latest/en/user/extensions/vectortiles/install.html#vectortiles-install" class="rank-math-link" target="_blank" rel="noopener">Installing the Vector Tiles Extension</a></p>

<h4 class="wp-block-heading">步骤四：为发布的地图服务添加 mvt 格式的输出格式</h4>

<p class="wp-block-paragraph">参考教程：<a href="https://docs.geoserver.org/latest/en/user/extensions/vectortiles/tutorial.html#vectortiles-tutorial" class="rank-math-link" target="_blank" rel="noopener">Vector tiles tutorial</a></p>

<h4 class="wp-block-heading">步骤五：在 Mapbox 中加载</h4>

<p class="wp-block-paragraph">代码示例：</p>

<pre class="EnlighterJSRAW" data-enlighter-language="js" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">map.addSource('poi', {
    type: 'vector',
    scheme: 'tms',
    tiles: [
        'your server path'
    ]
});
map.addLayer({
    'id': 'layer',
    'type': 'circle',
    'source': 'poi',
    'source-layer': 'poi_source_layer',
    'paint': {
        'circle-radius': 10,
        'circle-color': 'Black',
    }
});</pre>

<p class="wp-block-paragraph">部分参数说明：</p>

<p class="wp-block-paragraph"><strong>scheme：</strong>这里需要选择 tms，OSGeo&nbsp;格式，参考文档：<a href="https://docs.mapbox.com/mapbox-gl-js/style-spec/sources/#vector-scheme" class="rank-math-link" target="_blank" rel="noopener">vector-scheme</a></p>

<p class="wp-block-paragraph"><strong>坐标系：</strong>需要使用 EPSG:900913，而非 EPSG:4326。</p>

<p class="wp-block-paragraph"><strong>your server path：</strong></p>

<p class="wp-block-paragraph"></p>

<blockquote class="wp-block-quote is-layout-flow wp-block-quote-is-layout-flow">
<p class="wp-block-paragraph"><em>http://127.0.0.1:8080/geoserver/gwc/service/tms/1.0.0/</em></p>

<p class="wp-block-paragraph"><em>china_city%3APoi@EPSG%3A900913@pbf/{z}/{x}/{y}.pbf</em></p>
<cite>链接示例（已失效）</cite></blockquote>

<p class="wp-block-paragraph">这记录好像有点水，之所以要研究一下 GeoServer 与 Mapbox 的合作方式，是因为有人在 UpWork 上发单了指名要做这么件事。等以后想到有什么更加有价值的使用场景再补充进来。</p>
