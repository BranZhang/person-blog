---
title: "Mapbox 3D 立交实现方式解析"
description: "看了下最近的 Mapbox GL JS 的更新日志，发现新增了立交桥的3D显示效果。根据车道级的高精地图数据，能够实现立交，高架，隧道，导流区等形式的效果。还是挺美观的。下面将从样式，数据，渲染等几个角度研究一下 Mapbox 的实现思路。"
pubDate: "2025-05-21T09:14:51.000Z"
updatedDate: "2025-06-23T08:48:29.000Z"
published: true
disableComments: true
disableLikes: true
tags: ["gis","mapbox","WebGL","地图","GIS"]
---
<p class="wp-block-paragraph">看了下最近的 <a href="https://github.com/mapbox/mapbox-gl-js" target="_blank" rel="noopener">Mapbox GL JS</a> 的更新日志，发现新增了立交桥的3D显示效果。根据车道级的高精地图数据，能够实现立交，高架，隧道，导流区等形式的效果。还是挺美观的。下面将从样式，数据，渲染等几个角度研究一下 Mapbox 的实现思路。</p>

<!--more-->

<h2 class="wp-block-heading">效果预览</h2>

<div class="wp-block-image">
<figure class="aligncenter size-large is-resized"><img loading="lazy" decoding="async" width="1024" height="486" src="/wp-content/uploads/2025/05/image-1024x486.png" alt="" class="wp-image-12308" style="width:670px;height:auto" srcset="/wp-content/uploads/2025/05/image-1024x486.png 1024w, /wp-content/uploads/2025/05/image-300x143.png 300w, /wp-content/uploads/2025/05/image-768x365.png 768w, /wp-content/uploads/2025/05/image-1536x730.png 1536w, /wp-content/uploads/2025/05/image-1300x618.png 1300w, /wp-content/uploads/2025/05/image.png 1920w" sizes="auto, (max-width: 1024px) 100vw, 1024px" /><figcaption class="wp-element-caption">立交桥</figcaption></figure>
</div>

<div class="wp-block-image">
<figure class="aligncenter size-large is-resized"><img loading="lazy" decoding="async" width="1024" height="486" src="/wp-content/uploads/2025/05/image-1-1024x486.png" alt="" class="wp-image-12309" style="width:670px" srcset="/wp-content/uploads/2025/05/image-1-1024x486.png 1024w, /wp-content/uploads/2025/05/image-1-300x143.png 300w, /wp-content/uploads/2025/05/image-1-768x365.png 768w, /wp-content/uploads/2025/05/image-1-1536x730.png 1536w, /wp-content/uploads/2025/05/image-1-1300x618.png 1300w, /wp-content/uploads/2025/05/image-1.png 1920w" sizes="auto, (max-width: 1024px) 100vw, 1024px" /><figcaption class="wp-element-caption">高架</figcaption></figure>
</div>

<div class="wp-block-image">
<figure class="aligncenter size-large is-resized"><img loading="lazy" decoding="async" width="1024" height="486" src="/wp-content/uploads/2025/05/image-2-1024x486.png" alt="" class="wp-image-12310" style="width:670px" srcset="/wp-content/uploads/2025/05/image-2-1024x486.png 1024w, /wp-content/uploads/2025/05/image-2-300x143.png 300w, /wp-content/uploads/2025/05/image-2-768x365.png 768w, /wp-content/uploads/2025/05/image-2-1536x730.png 1536w, /wp-content/uploads/2025/05/image-2-1300x618.png 1300w, /wp-content/uploads/2025/05/image-2.png 1920w" sizes="auto, (max-width: 1024px) 100vw, 1024px" /><figcaption class="wp-element-caption">隧道</figcaption></figure>
</div>

<p class="wp-block-paragraph">数据的<a href="https://console.mapbox.com/studio/tilesets/mapbox.hd-road-v1/#16.23/48.220481/11.629958" target="_blank" rel="noopener">预览链接</a>。截至本篇文章发表时，这个链接是能够正常预览的。不排除哪天就看不了了。测试数据分布在德国慕尼黑，不知道高精地图的功能是不是 Mapbox 为宝马定制的。</p>

<h2 class="wp-block-heading">数据构成</h2>

<p class="wp-block-paragraph">从预览链接里能够看到高精地图效果的数据构成。数据依旧是基于 mvt 规范来提供的，<strong>暂时不确定</strong>这个 hd-roads 是否遵守了当前的 mvt 协议，也就是没有写入额外的数据。数据主要由以下几部分组成：</p>

<h3 class="wp-block-heading">hd_road_centerlines</h3>

<p class="wp-block-paragraph">每一根车道的中心线，在渲染过程中没用，不包括应急车道，更适合用于在导航过程中显示行车路线。</p>

<div class="wp-block-image">
<figure class="aligncenter size-full is-resized"><img loading="lazy" decoding="async" width="987" height="571" src="/wp-content/uploads/2025/05/image-8.png" alt="" class="wp-image-12325" style="width:645px;height:auto" srcset="/wp-content/uploads/2025/05/image-8.png 987w, /wp-content/uploads/2025/05/image-8-300x174.png 300w, /wp-content/uploads/2025/05/image-8-768x444.png 768w" sizes="auto, (max-width: 987px) 100vw, 987px" /></figure>
</div>

<h3 class="wp-block-heading">hd_road_elevation</h3>

<p class="wp-block-paragraph">这个数据集有点奇怪，肯定不是直接用于渲染的，它既有面数据也有点数据，根据名字看应该承载了道路高度信息，具体有啥用后面再说。</p>

<div class="wp-block-image">
<figure class="aligncenter size-full is-resized"><img loading="lazy" decoding="async" width="905" height="755" src="/wp-content/uploads/2025/05/image-9.png" alt="" class="wp-image-12326" style="width:777px;height:auto" srcset="/wp-content/uploads/2025/05/image-9.png 905w, /wp-content/uploads/2025/05/image-9-300x250.png 300w, /wp-content/uploads/2025/05/image-9-768x641.png 768w" sizes="auto, (max-width: 905px) 100vw, 905px" /></figure>
</div>

<div class="wp-block-image">
<figure class="aligncenter size-full is-resized"><img loading="lazy" decoding="async" width="902" height="654" src="/wp-content/uploads/2025/05/image-11.png" alt="" class="wp-image-12328" style="width:777px;height:auto" srcset="/wp-content/uploads/2025/05/image-11.png 902w, /wp-content/uploads/2025/05/image-11-300x218.png 300w, /wp-content/uploads/2025/05/image-11-768x557.png 768w" sizes="auto, (max-width: 902px) 100vw, 902px" /></figure>
</div>

<h3 class="wp-block-heading">hd_road_line</h3>

<p class="wp-block-paragraph">每一条车道两侧的边界线，也就是车道线，相邻的两个车道共用一条数据。应急车道的边界线也在其中。在渲染时可以是实线或者虚线。</p>

<div class="wp-block-image">
<figure class="aligncenter size-full is-resized"><img loading="lazy" decoding="async" width="766" height="591" src="/wp-content/uploads/2025/05/image-10.png" alt="" class="wp-image-12327" style="width:656px;height:auto" srcset="/wp-content/uploads/2025/05/image-10.png 766w, /wp-content/uploads/2025/05/image-10-300x231.png 300w" sizes="auto, (max-width: 766px) 100vw, 766px" /></figure>
</div>

<h3 class="wp-block-heading">hd_road_point</h3>

<p class="wp-block-paragraph">这个数据集中包含了多种数据，道路两侧的植物，道路指示符号等。</p>

<div class="wp-block-image">
<figure class="aligncenter size-full is-resized"><img loading="lazy" decoding="async" width="673" height="499" src="/wp-content/uploads/2025/05/image-12.png" alt="" class="wp-image-12329" style="width:501px;height:auto" srcset="/wp-content/uploads/2025/05/image-12.png 673w, /wp-content/uploads/2025/05/image-12-300x222.png 300w" sizes="auto, (max-width: 673px) 100vw, 673px" /></figure>
</div>

<div class="wp-block-image">
<figure class="aligncenter size-full is-resized"><img loading="lazy" decoding="async" width="774" height="533" src="/wp-content/uploads/2025/05/image-13.png" alt="" class="wp-image-12330" style="width:503px;height:auto" srcset="/wp-content/uploads/2025/05/image-13.png 774w, /wp-content/uploads/2025/05/image-13-300x207.png 300w, /wp-content/uploads/2025/05/image-13-768x529.png 768w" sizes="auto, (max-width: 774px) 100vw, 774px" /></figure>
</div>

<h3 class="wp-block-heading">hd_road_polygon</h3>

<p class="wp-block-paragraph">这个数据集是面状数据，覆盖了上述的各种车道，应急车道，导流区等，可以简单的理解为，面状数据包含了所有与道路直接有关的数据，除了那些树木。</p>

<div class="wp-block-image">
<figure class="aligncenter size-full is-resized"><img loading="lazy" decoding="async" width="985" height="571" src="/wp-content/uploads/2025/05/image-14.png" alt="" class="wp-image-12331" style="width:721px;height:auto" srcset="/wp-content/uploads/2025/05/image-14.png 985w, /wp-content/uploads/2025/05/image-14-300x174.png 300w, /wp-content/uploads/2025/05/image-14-768x445.png 768w" sizes="auto, (max-width: 985px) 100vw, 985px" /></figure>
</div>

<h2 class="wp-block-heading">地图样式</h2>

<p class="wp-block-paragraph">直接看 debug 目录下的 3d-intersections.html 可以看到上面的示例。不过现在是要分析它的实现方式，所以还是简单一点好。我们可以从 test 目录入手，其中各个功能拆分的更细，便于研究。test 目录中可以看到这样的一个测试用例，这是其中的样式文件渲染出的效果：</p>

<div class="wp-block-image">
<figure class="aligncenter size-full is-resized"><img loading="lazy" decoding="async" width="512" height="512" src="/wp-content/uploads/2025/05/expected-2.png" alt="" class="wp-image-12318" style="width:436px;height:auto" srcset="/wp-content/uploads/2025/05/expected-2.png 512w, /wp-content/uploads/2025/05/expected-2-300x300.png 300w, /wp-content/uploads/2025/05/expected-2-150x150.png 150w" sizes="auto, (max-width: 512px) 100vw, 512px" /><figcaption class="wp-element-caption">测试样例效果</figcaption></figure>
</div>

<p class="wp-block-paragraph">这是对应的 style 文件（下面的内容不完整，无关的部分我删除了）：</p>

<pre class="EnlighterJSRAW" data-enlighter-language="json" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">{
	"version": 8,
	"sources": {
		"hd-roads": {
			"type": "vector",
			"tileSize": 512,
			"maxzoom": 18,
			"tiles": ["local://tiles/3d-intersections/{z}-{x}-{y}.mvt"]
		},
		"geojson": {
			"type": "geojson",
			"data": {
				"type": "FeatureCollection",
				"features": [
					{
						"type": "Feature",
						"properties": {
							"zLevel": 1
						},
						"geometry": {
							"type": "MultiPoint",
							"coordinates": [[11.5406, 48.1763]]
						}
					}
				]
			}
		}
	},
	"layers": [
		{
			"id": "fake-road-shade",
			"type": "fill",
			"source": "hd-roads",
			"source-layer": "hd_road_polygon",
			"filter": [
				"all",
				["match", ["get", "class"], ["road", "bridge"], true, false]
			],
			"paint": {
				"fill-color": "rgb(214, 221, 219)"
			}
		},
		{
			"id": "road-base",
			"type": "fill",
			"source": "hd-roads",
			"source-layer": "hd_road_polygon",
			"filter": ["all", ["match", ["get", "class"], ["road"], true, false]],
			"layout": {
				"fill-elevation-reference": "hd-road-base"
			},
			"paint": {
				"fill-color": [
					"interpolate",
					["linear"],
					["zoom"],
					16,
					"hsl(212, 25%, 80%)",
					18,
					"hsl(212, 25%, 71%)"
				]
			}
		},
		{
			"id": "road-base-bridge",
			"type": "fill",
			"source": "hd-roads",
			"source-layer": "hd_road_polygon",
			"filter": ["all", ["match", ["get", "class"], ["bridge"], true, false]],
			"layout": {
				"fill-elevation-reference": "hd-road-base"
			},
			"paint": {
				"fill-color": [
					"interpolate",
					["linear"],
					["zoom"],
					16,
					"hsl(212, 25%, 80%)",
					18,
					"hsl(212, 25%, 71%)"
				]
			}
		},
		{
			"id": "road-hatched-area",
			"type": "fill",
			"source": "hd-roads",
			"source-layer": "hd_road_polygon",
			"filter": [
				"all",
				["match", ["get", "class"], ["hatched_area"], true, false]
			],
			"layout": {
				"fill-elevation-reference": "hd-road-markup"
			},
			"paint": {
				"fill-opacity": ["interpolate", ["linear"], ["zoom"], 15, 0, 16, 1],
				"fill-pattern": [
					"match",
					["get", "color"],
					["yellow"],
					"hatched-pattern-yellow",
					"hatched-pattern"
				]
			}
		},
		{
			"id": "solid-lines",
			"type": "line",
			"source": "hd-roads",
			"source-layer": "hd_road_line",
			"filter": [
				"all",
				["match", ["get", "class"], ["lanes"], true, false],
				[
					"match",
					["get", "line_type"],
					["solid", "solid_half_arrow", "half_arrow_solid", "arrow_solid"],
					true,
					false
				]
			],
			"layout": {
				"line-elevation-reference": "hd-road-markup"
			},
			"paint": {
				"line-color": [
					"match",
					["get", "color"],
					["yellow"],
					"hsl(54, 100%, 65%)",
					"hsl(0, 0%, 96%)"
				],
				"line-width": [
					"interpolate",
					["exponential", 1.5],
					["zoom"],
					15,
					0,
					18,
					1.5,
					19,
					3,
					22,
					10
				]
			}
		},
		{
			"id": "double-lines",
			"type": "line",
			"source": "hd-roads",
			"source-layer": "hd_road_line",
			"slot": "",
			"filter": [
				"all",
				["match", ["get", "class"], ["lanes"], true, false],
				["match", ["get", "line_type"], ["double"], true, false]
			],
			"layout": {
				"line-elevation-reference": "hd-road-markup"
			},
			"paint": {
				"line-color": [
					"match",
					["get", "color"],
					["yellow"],
					"hsl(54, 100%, 65%)",
					"hsl(0, 0%, 96%)"
				],
				"line-width": [
					"interpolate",
					["exponential", 1.5],
					["zoom"],
					15,
					0,
					18,
					1.5,
					19,
					3,
					22,
					10
				],
				"line-gap-width": 2
			}
		},
		{
			"id": "dashed-lines",
			"type": "line",
			"source": "hd-roads",
			"source-layer": "hd_road_line",
			"filter": [
				"all",
				["match", ["get", "class"], ["lanes"], true, false],
				[
					"match",
					["get", "line_type"],
					[
						"dashed",
						"arrow_dashed",
						"long_dashed",
						"short_dash",
						"solid_dashed"
					],
					true,
					false
				]
			],
			"layout": {
				"line-elevation-reference": "hd-road-markup"
			},
			"paint": {
				"line-color": [
					"match",
					["get", "color"],
					["yellow"],
					"hsl(54, 100%, 65%)",
					"hsl(0, 0%, 96%)"
				],
				"line-width": [
					"interpolate",
					["exponential", 1.5],
					["zoom"],
					15,
					0,
					18,
					1,
					19,
					3,
					22,
					6
				],
				"line-dasharray": [
					"step",
					["zoom"],
					["literal", [14, 14]],
					20,
					["literal", [18, 18]]
				]
			}
		},
		{
			"id": "circle",
			"type": "circle",
			"source": "geojson",
			"layout": {
				"circle-elevation-reference": "hd-road-markup"
			},
			"paint": {
				"circle-radius": 40,
				"circle-color": "green",
				"circle-pitch-alignment": "map"
			}
		}
	]
}
</pre>

<p class="wp-block-paragraph">综合这份样式以及其他几份样式，可以发现，3D立交桥主要由以下几个图层组成：</p>

<h3 class="wp-block-heading">fake-road-shade</h3>

<p class="wp-block-paragraph">将表示路面的 polygon 简单的呈现出来，达到阴影的效果，挺巧妙的。</p>

<div class="wp-block-image">
<figure class="aligncenter size-full is-resized"><img loading="lazy" decoding="async" width="682" height="400" src="/wp-content/uploads/2025/05/image-5.png" alt="" class="wp-image-12322" style="width:484px;height:auto" srcset="/wp-content/uploads/2025/05/image-5.png 682w, /wp-content/uploads/2025/05/image-5-300x176.png 300w" sizes="auto, (max-width: 682px) 100vw, 682px" /></figure>
</div>

<h3 class="wp-block-heading">road-base，road-base-bridge</h3>

<p class="wp-block-paragraph">灰色区域的路面都是 road-base，road-base-bridge。两者使用的数据都是 source 中表示路面的polygon。</p>

<p class="wp-block-paragraph">road-base 贴在地面上，就是普通的二维多边形。road-base-bridge 是三维的，并且在 layout 配置中，指定 fill-elevation-reference 属性为 hd-road-base，这应该是实现三维效果的关键。</p>

<div class="wp-block-image">
<figure class="aligncenter size-full is-resized"><img loading="lazy" decoding="async" width="987" height="582" src="/wp-content/uploads/2025/05/image-6.png" alt="" class="wp-image-12323" style="width:480px;height:auto" srcset="/wp-content/uploads/2025/05/image-6.png 987w, /wp-content/uploads/2025/05/image-6-300x177.png 300w, /wp-content/uploads/2025/05/image-6-768x453.png 768w" sizes="auto, (max-width: 987px) 100vw, 987px" /></figure>
</div>

<div class="wp-block-image">
<figure class="aligncenter size-full is-resized"><img loading="lazy" decoding="async" width="627" height="182" src="/wp-content/uploads/2025/05/image-7.png" alt="" class="wp-image-12324" style="width:487px;height:auto" srcset="/wp-content/uploads/2025/05/image-7.png 627w, /wp-content/uploads/2025/05/image-7-300x87.png 300w" sizes="auto, (max-width: 627px) 100vw, 627px" /></figure>
</div>

<h3 class="wp-block-heading">road-hatched-area</h3>

<p class="wp-block-paragraph">导流区，通过 fill-pattern 实现的，所以需要准备好条纹状的纹理，这样实现无法控制纹理的走向。</p>

<div class="wp-block-image">
<figure class="aligncenter size-full is-resized"><img loading="lazy" decoding="async" width="586" height="319" src="/wp-content/uploads/2025/05/image-15.png" alt="" class="wp-image-12334" style="width:402px;height:auto" srcset="/wp-content/uploads/2025/05/image-15.png 586w, /wp-content/uploads/2025/05/image-15-300x163.png 300w" sizes="auto, (max-width: 586px) 100vw, 586px" /></figure>
</div>

<h3 class="wp-block-heading">solid-lines，double-lines，dashed-lines</h3>

<p class="wp-block-paragraph">车道分界线，车道边缘线等。</p>

<figure class="wp-block-image size-full"><img loading="lazy" decoding="async" width="922" height="467" src="/wp-content/uploads/2025/05/image-16.png" alt="" class="wp-image-12335" srcset="/wp-content/uploads/2025/05/image-16.png 922w, /wp-content/uploads/2025/05/image-16-300x152.png 300w, /wp-content/uploads/2025/05/image-16-768x389.png 768w" sizes="auto, (max-width: 922px) 100vw, 922px" /></figure>

<hr class="wp-block-separator has-alpha-channel-opacity is-style-dots"/>

<p class="wp-block-paragraph">实际上还有车道方向，隧道等要素，这些要素的表达和上面的图层基本类似，就不细说了。</p>

<h2 class="wp-block-heading">代码实现解析</h2>

<p class="wp-block-paragraph">看完样式文件中的 source 和 layer 配置，最奇怪的应该就是 hd_road_elevation 数据集和 xxx-elevation-reference 样式了。</p>

<p class="wp-block-paragraph">在 \src\data\bucket\fill_bucket.ts 文件中，可以看到 Bucket 读取 fill-elevation-reference 这个属性值作为 elevationMode。</p>

<div class="wp-block-image">
<figure class="aligncenter size-large is-resized"><img loading="lazy" decoding="async" width="1024" height="453" src="/wp-content/uploads/2025/05/image-17-1024x453.png" alt="" class="wp-image-12340" style="width:680px;height:auto" srcset="/wp-content/uploads/2025/05/image-17-1024x453.png 1024w, /wp-content/uploads/2025/05/image-17-300x133.png 300w, /wp-content/uploads/2025/05/image-17-768x340.png 768w, /wp-content/uploads/2025/05/image-17.png 1191w" sizes="auto, (max-width: 1024px) 100vw, 1024px" /></figure>
</div>

<p class="wp-block-paragraph">对于 elevationMode 不为 none 的 source，需要根据 elevationFeatures 来创建几何信息：</p>

<div class="wp-block-image">
<figure class="aligncenter size-large is-resized"><img loading="lazy" decoding="async" width="1024" height="228" src="/wp-content/uploads/2025/05/image-18-1024x228.png" alt="" class="wp-image-12341" style="width:732px;height:auto" srcset="/wp-content/uploads/2025/05/image-18-1024x228.png 1024w, /wp-content/uploads/2025/05/image-18-300x67.png 300w, /wp-content/uploads/2025/05/image-18-768x171.png 768w, /wp-content/uploads/2025/05/image-18-1300x290.png 1300w, /wp-content/uploads/2025/05/image-18.png 1372w" sizes="auto, (max-width: 1024px) 100vw, 1024px" /></figure>
</div>

<p class="wp-block-paragraph">对于一条数据，并不是所有的 elevationFeatures 都需要参与计算，在304行，代码根据 3d_elevation_id 来获取到对应的 tiledElevation 数据。</p>

<div class="wp-block-image">
<figure class="alignleft size-large"><img loading="lazy" decoding="async" width="1024" height="569" src="/wp-content/uploads/2025/05/image-19-1024x569.png" alt="" class="wp-image-12342" srcset="/wp-content/uploads/2025/05/image-19-1024x569.png 1024w, /wp-content/uploads/2025/05/image-19-300x167.png 300w, /wp-content/uploads/2025/05/image-19-768x427.png 768w, /wp-content/uploads/2025/05/image-19-1300x722.png 1300w, /wp-content/uploads/2025/05/image-19.png 1420w" sizes="auto, (max-width: 1024px) 100vw, 1024px" /></figure>
</div>

<p class="wp-block-paragraph"></p>

<figure class="wp-block-image size-large is-resized"><img loading="lazy" decoding="async" width="1024" height="208" src="/wp-content/uploads/2025/05/image-20-1024x208.png" alt="" class="wp-image-12343" style="width:739px;height:auto" srcset="/wp-content/uploads/2025/05/image-20-1024x208.png 1024w, /wp-content/uploads/2025/05/image-20-300x61.png 300w, /wp-content/uploads/2025/05/image-20-768x156.png 768w, /wp-content/uploads/2025/05/image-20-1300x264.png 1300w, /wp-content/uploads/2025/05/image-20.png 1362w" sizes="auto, (max-width: 1024px) 100vw, 1024px" /></figure>

<p class="wp-block-paragraph">这时回过头来看上面的数据构成，hd_road_line 通过 3d_elevation_id 与 hd_road_elevation 数据关联，并从 hd_road_elevation 中获取到高度信息。</p>

<figure class="wp-block-gallery has-nested-images columns-default is-cropped wp-block-gallery-1 is-layout-flex wp-block-gallery-is-layout-flex">
<figure class="wp-block-image size-large"><img loading="lazy" decoding="async" width="499" height="477" data-id="12349" src="/wp-content/uploads/2025/05/image-24.png" alt="" class="wp-image-12349" srcset="/wp-content/uploads/2025/05/image-24.png 499w, /wp-content/uploads/2025/05/image-24-300x287.png 300w" sizes="auto, (max-width: 499px) 100vw, 499px" /></figure>

<figure class="wp-block-image size-large"><img loading="lazy" decoding="async" width="512" height="481" data-id="12348" src="/wp-content/uploads/2025/05/image-23.png" alt="" class="wp-image-12348" srcset="/wp-content/uploads/2025/05/image-23.png 512w, /wp-content/uploads/2025/05/image-23-300x282.png 300w" sizes="auto, (max-width: 512px) 100vw, 512px" /></figure>
</figure>

<p class="wp-block-paragraph">看一下某个 elevationFeatures 的数据，顶点数组中包含了点位坐标和高度：</p>

<div class="wp-block-image">
<figure class="aligncenter size-full is-resized"><img loading="lazy" decoding="async" width="985" height="504" src="/wp-content/uploads/2025/05/image-25.png" alt="" class="wp-image-12350" style="width:503px;height:auto" srcset="/wp-content/uploads/2025/05/image-25.png 985w, /wp-content/uploads/2025/05/image-25-300x154.png 300w, /wp-content/uploads/2025/05/image-25-768x393.png 768w" sizes="auto, (max-width: 985px) 100vw, 985px" /></figure>
</div>

<p class="wp-block-paragraph">在 \3d-style\elevation\elevation_feature.ts 文件中，可以看到代码通过线性插值的方式来为特定的点位计算高度值。</p>

<div class="wp-block-image">
<figure class="aligncenter size-large is-resized"><img loading="lazy" decoding="async" width="1024" height="376" src="/wp-content/uploads/2025/05/image-26-1024x376.png" alt="" class="wp-image-12351" style="width:685px;height:auto" srcset="/wp-content/uploads/2025/05/image-26-1024x376.png 1024w, /wp-content/uploads/2025/05/image-26-300x110.png 300w, /wp-content/uploads/2025/05/image-26-768x282.png 768w, /wp-content/uploads/2025/05/image-26-1300x477.png 1300w, /wp-content/uploads/2025/05/image-26.png 1438w" sizes="auto, (max-width: 1024px) 100vw, 1024px" /></figure>
</div>

<h2 class="wp-block-heading">总结</h2>

<p class="wp-block-paragraph">自 Mapbox v2 起，地形渲染能力被正式引入，为地图叠加提供了三维地形支持。自此，点、线、面要素具备了立体表现能力。基于相似的渲染机制，Mapbox 现已支持高精地图的可视化展示。在此过程中，hd_road_elevation 数据源的构建至关重要，是实现高精道路形态还原的核心。</p>

<p class="wp-block-paragraph">期待 Mapbox 在高精地图可视化领域的更多作品。</p>
