---
title: "文革风格的地图设计尝试"
description: "“随着无产阶级文化大革命的深入发展，首都的红卫兵和广大革命群众，在破四旧立四新的革命风暴中，对北京的街巷名称提出了许多革命倡议和意见……”"
pubDatetime: 2019-09-07T13:01:54.000Z
modDatetime: 2025-02-04T13:40:24.000Z
draft: false
tags: ["mapbox","openstreetmap","地图","GIS"]
cover: "/wp-content/uploads/2019/09/china-e1673587197753.png"
---

最近刚好读到《中评周刊》115期的《陈徒手： 1965-1975：北京地名修改内情》文章，里面提到了北京在六七十年代，曾要求过改革不适合时代潮流的已有地名。原文的说法如下：

> 对北京的街巷名称提出了许多革命倡议和意见，要求把一些带有封建主义、资本主义色彩的街巷名称，改为具有革命意义的名称，使首都的街巷名称充分反映出社会主义时代的精神面貌。
>
> — 陈徒手： 1965-1975：北京地名修改内情

考虑到时间等因素，我就不去收集当时所有的地名更改相关的资料了，仅以文章中列出的改名信息，尝试设计一个，从数据到样式，符合当时环境的地图。如果读者有其他文革期间地名修改的相关资料，可以回复我。

## 简介

数据主要指地名相关的数据，按照上述文章中所指出的部分信息。不过数量不多，简单的看看效果吧。对于其他的道路，就保留在地图上吧，当时与现在的道路走向应该是大体一致的。

样式是指地图的字体，配色，图标等。

参考的风格主要如下。（图片来源于网络，并不保证不是后人仿制的）

<figure class="blog-gallery">
<div class="blog-gallery-grid" style="grid-template-columns:repeat(auto-fit,minmax(220px,1fr))">
  <figure class="blog-gallery-item"><img src="/wp-content/uploads/2019/09/gis-5-1.jpg" alt="" loading="lazy" /></figure>
  <figure class="blog-gallery-item"><img src="/wp-content/uploads/2019/09/gis-5-6-722x1024.jpg" alt="" loading="lazy" /></figure>
  <figure class="blog-gallery-item"><img src="/wp-content/uploads/2019/09/gis-5-7.jpg" alt="" loading="lazy" /></figure>
  <figure class="blog-gallery-item"><img src="/wp-content/uploads/2019/09/gis-5-4-1.png" alt="" loading="lazy" /></figure>
</div>
</figure>

## 数据准备

根据《陈徒手： 1965-1975：北京地名修改内情》，梳理得到的北京市路名更改对应表：

| 张自忠路 | 工农兵东大街 |
| --- | --- |
| 赵登禹路 | 中华路 |
| 佟麟阁路 | 四新路 |
| 石驸马大街*（这条路现在就叫新文化街了）* | 新文化街 |
| 东西长安街、建国门与复兴门内外大街 | 东方红大道 |
| 复兴路 | 解放军路 |
| 建国路 | 长征路 |
| 前门大街，天桥南大街，永定门内外大街，南苑路 | 共产主义大道 |
| 地安门内外大街 | 总路线路 |
| 府右街 | 韶山路 |
| 西什库大街 | 集体化路 |
| 景山东街 | 代代红路/育红路 |
| 西四北大街，新街口南大街 | 红旗路 |
| 东四北大街，雍和宫大街 | 红日路 |
| 王府井大街 | 人民路 |
| 地安门东大街 | 大跃进路 |
| 地安门西大街 | 人民公社路 |
| 西交民巷 | 必胜路 |
| 珠市口西大街，骡马市大街，广安门内外大街 | 红卫路 |
| 大羊坊路 | 四季红路 |
| 百万庄大街 | 宇宙红路 |
| 珠市口东大街 | 红光路 |
| 酒仙桥路 | 东红路 |
| 广宁路 | 红电路 |
| 西老胡同 | 普红胡同 |
| 台基厂大街 | 永革路 |
| 黄寺大街 | 永进路 |
| 东黄城根北街 | 霞光街 |
| 夕照寺街 | 光明路 |
| 车公庄大街 | 向东路 |
| 天坛路 | 曙光路 |
| 北洼路 | 志远路 |
| 北蜂窝路 | 炬辉路 |
| 晋元庄路 | 智勇路 |
| 马家堡路 | 秋收起义路 |

太多了，还有很多胡同，我就不一一罗列了，而且也不容易对应上，估计大部分如今已经被拆了。

> 最为省事的办法是以一个革命化的新名称替换一大片胡同名，譬如东城区决定从东单二条到前炒面胡同，按顺序改名为瑞金路头条至三十条；从大甜水井胡同到菜厂胡同、锡拉胡同、东厂胡同，列为人民路一至九条；

如果只是单纯的在地图上加上标记没什么意思。那只是把地图拿来应用，算不上是地图本身。我们要

![](/wp-content/uploads/2019/09/gis-5-9.jpeg)

那么怎么才能修改地图上的数据呢？或者说，如何才能让我们后期添加到地图上的数据看起来和地图上的其他要素融为一体呢？有请 [Mapbox Studio](https://studio.mapbox.com/) 以及 [OpenStreetMap](https://www.openstreetmap.org)。

点的标记并不难做，无论是文字还是图标。不好弄的是路名。现在的解决方案是，从 OSM 上下载北京的路网数据，修改道路名称，再将修改后的数据上传到 Studio 中，将上传的道路数据以 Symbol Layer 加载到样式中，并将绘制方式设置的和原有的道路名称图层一样。

## 样式设计

### 地图重点

地图重点要展示哪些信息呢？上述提到的被更改的道路名称，地名等肯定是要着重显示的。除此之外，还有天安门广场，中南海，以及各级党政机关等重点区域也要突出显示。对应的图标也要替换。

在搜索资料的过程中，了解到在六七十年代，有一种叫做串联图的存在。搜索“大串连”以了解更多内容。那地图的标题就叫《首都革命串联交通图》好了。

### 字体

简单搜索了一下，最终选用澎湃字体。不过由于 Mapbox Studio 貌似存在bug，现在字体还不能显示出来。

### 配色

参考当时的海报风格，主要是革命红，军装绿和工人蓝，意外的是还有金色，莫不是党的光辉？那就叫光辉金好了。

### 全国山河一片红

![](/wp-content/uploads/2019/09/gis-5-12-223x300.jpg "《全国山河一片红》邮票")

这张邮票的背景读者可以自行搜索。我觉得将地图在小比例尺下显示成这样的效果不错。关键是怎么做出这样的效果呢？

首先我们需要把除大陆以外的国家隐藏，并将大陆地区的背景设置为红色。并按照大陆地区的陆地边界线设置光晕效果。最后还要添加一个台湾地区的红色边框。哦，还有金色的横幅。革命红与光辉金的搭配再次出现。

难搞的是大陆地区的陆地边界线。需要用大陆地区省份的多边形进行合并，再从中减去渤海，黄海，东海等海域。别忘了还要删掉南海诸岛。实际上多虑了，我本以为国家边界线数据会包括领海，实际上并没有。而且数据里把南海诸岛的所属国家标注成菲律宾了，也省的我麻烦了。

因为 Studio 的热力图图层貌似存在bug，所以光晕效果没有加上。将下面的地图缩小至全国范围可以看到效果。

## 最终效果

<script src="https://api.tiles.mapbox.com/mapbox-gl-js/v1.3.1/mapbox-gl.js"></script>
<link href="https://api.tiles.mapbox.com/mapbox-gl-js/v1.3.1/mapbox-gl.css" rel="stylesheet">
<style>
    #map_one { 
		width:100%;
		height:550px;
		margin: auto; 
	}
</style>

<script>
	mapboxgl.accessToken = 'pk.eyJ1IjoiYnJhbnpoYW5nIiwiYSI6ImNqM3FycmVldjAxZTUzM2xqMmllNnBjMHkifQ.Wv3ekbtia0BuUHGWVUGoFg';
	var map = new mapboxgl.Map({
		container: 'map_one', // container id
		style: 'mapbox://styles/branzhang/ck06sghja2e0y1co69omz0y4a', // stylesheet location
		center: [116.392, 39.901], // starting position [lng, lat]
		zoom: 13, // starting zoom
		pitchWithRotate: false,
		localIdeographFontFamily: false,
		maxBounds:[[69, 15], [139, 56]]
	});
	map.dragRotate.disable();
	//map.touchZoomRotate.disableRotation();
</script>

## 最后

值此新中国成立70周年之际，就将此图献给国家吧。??❓

![](/wp-content/uploads/2019/09/gis-5-10-1024x634.png)

## 参考资料

- [《中评周刊》第115期](http://www.unirule.cloud/index.php?c=article&id=4827)
- [“文革”大串连:地图上抹不掉的记忆](http://seemap.kr-smart.com/index.php?m=content&c=index&a=show&catid=30&id=492)
- [锐字工房澎湃字体介绍](https://zhuanlan.zhihu.com/p/28785397)
