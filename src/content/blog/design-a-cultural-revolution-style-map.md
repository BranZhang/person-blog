---
title: "文革风格的地图设计尝试"
description: "“随着无产阶级文化大革命的深入发展，首都的红卫兵和广大革命群众，在破四旧立四新的革命风暴中，对北京的街巷名称提出了许多革命倡议和意见……”"
pubDate: "2019-09-07T13:01:54.000Z"
updatedDate: "2025-02-04T13:40:24.000Z"
published: true
tags: ["mapbox","openstreetmap","地图","GIS"]
heroImage: "/wp-content/uploads/2019/09/china-e1673587197753.png"
---
<p class="wp-block-paragraph">最近刚好读到《中评周刊》115期的《陈徒手： 1965-1975：北京地名修改内情》文章，里面提到了北京在六七十年代，曾要求过改革不适合时代潮流的已有地名。原文的说法如下：</p>

<blockquote class="wp-block-quote is-layout-flow wp-block-quote-is-layout-flow">
<p class="wp-block-paragraph">对北京的街巷名称提出了许多革命倡议和意见，要求把一些带有封建主义、资本主义色彩的街巷名称，改为具有革命意义的名称，使首都的街巷名称充分反映出社会主义时代的精神面貌。</p>
<cite>陈徒手： 1965-1975：北京地名修改内情</cite></blockquote>

<p class="wp-block-paragraph">考虑到时间等因素，我就不去收集当时所有的地名更改相关的资料了，仅以文章中列出的改名信息，尝试设计一个，从数据到样式，符合当时环境的地图。如果读者有其他文革期间地名修改的相关资料，可以回复我。</p>

<!--more-->

<h2 class="wp-block-heading">简介</h2>

<p class="wp-block-paragraph">数据主要指地名相关的数据，按照上述文章中所指出的部分信息。不过数量不多，简单的看看效果吧。对于其他的道路，就保留在地图上吧，当时与现在的道路走向应该是大体一致的。</p>

<p class="wp-block-paragraph">样式是指地图的字体，配色，图标等。</p>

<p class="wp-block-paragraph">参考的风格主要如下。（图片来源于网络，并不保证不是后人仿制的）</p>

<figure class="wp-block-gallery aligncenter has-nested-images columns-3 is-cropped wp-block-gallery-14 is-layout-flex wp-block-gallery-is-layout-flex">
<figure class="wp-block-image size-large"><a href="/wp-content/uploads/2019/09/gis-5-1.jpg"><img loading="lazy" decoding="async" width="1010" height="758" data-id="369" src="/wp-content/uploads/2019/09/gis-5-1.jpg" alt="" class="wp-image-369" srcset="/wp-content/uploads/2019/09/gis-5-1.jpg 1010w, /wp-content/uploads/2019/09/gis-5-1-300x225.jpg 300w, /wp-content/uploads/2019/09/gis-5-1-768x576.jpg 768w" sizes="auto, (max-width: 1010px) 100vw, 1010px" /></a></figure>

<figure class="wp-block-image size-large"><a href="/wp-content/uploads/2019/09/gis-5-6.jpg"><img loading="lazy" decoding="async" width="722" height="1024" data-id="376" src="/wp-content/uploads/2019/09/gis-5-6-722x1024.jpg" alt="" class="wp-image-376" srcset="/wp-content/uploads/2019/09/gis-5-6-722x1024.jpg 722w, /wp-content/uploads/2019/09/gis-5-6-212x300.jpg 212w, /wp-content/uploads/2019/09/gis-5-6-768x1089.jpg 768w, /wp-content/uploads/2019/09/gis-5-6.jpg 1024w" sizes="auto, (max-width: 722px) 100vw, 722px" /></a></figure>

<figure class="wp-block-image size-large"><a href="/wp-content/uploads/2019/09/gis-5-7.jpg"><img loading="lazy" decoding="async" width="1010" height="758" data-id="375" src="/wp-content/uploads/2019/09/gis-5-7.jpg" alt="" class="wp-image-375" srcset="/wp-content/uploads/2019/09/gis-5-7.jpg 1010w, /wp-content/uploads/2019/09/gis-5-7-300x225.jpg 300w, /wp-content/uploads/2019/09/gis-5-7-768x576.jpg 768w" sizes="auto, (max-width: 1010px) 100vw, 1010px" /></a></figure>

<figure class="wp-block-image size-large"><a href="/wp-content/uploads/2019/09/gis-5-4-1.png"><img loading="lazy" decoding="async" width="934" height="551" data-id="374" src="/wp-content/uploads/2019/09/gis-5-4-1.png" alt="" class="wp-image-374" srcset="/wp-content/uploads/2019/09/gis-5-4-1.png 934w, /wp-content/uploads/2019/09/gis-5-4-1-300x177.png 300w, /wp-content/uploads/2019/09/gis-5-4-1-768x453.png 768w" sizes="auto, (max-width: 934px) 100vw, 934px" /></a></figure>
</figure>

<h2 class="wp-block-heading">数据准备</h2>

<p class="wp-block-paragraph">根据《陈徒手： 1965-1975：北京地名修改内情》，梳理得到的北京市路名更改对应表：</p>

<figure class="wp-block-table is-style-stripes"><table class="has-fixed-layout"><tbody><tr><td>张自忠路</td><td>工农兵东大街</td></tr><tr><td>赵登禹路</td><td>中华路</td></tr><tr><td>佟麟阁路</td><td>四新路</td></tr><tr><td>石驸马大街<em>（这条路现在就叫新文化街了）</em></td><td>新文化街</td></tr><tr><td>东西长安街、建国门与复兴门内外大街</td><td>东方红大道</td></tr><tr><td>复兴路</td><td>解放军路</td></tr><tr><td>建国路</td><td>长征路</td></tr><tr><td>前门大街，天桥南大街，永定门内外大街，南苑路</td><td>共产主义大道</td></tr><tr><td>地安门内外大街</td><td>总路线路</td></tr><tr><td>府右街</td><td>韶山路</td></tr><tr><td>西什库大街</td><td>集体化路</td></tr><tr><td>景山东街</td><td>代代红路/育红路</td></tr><tr><td>西四北大街，新街口南大街</td><td>红旗路</td></tr><tr><td>东四北大街，雍和宫大街</td><td>红日路</td></tr><tr><td>王府井大街</td><td>人民路</td></tr><tr><td>地安门东大街</td><td>大跃进路</td></tr><tr><td>地安门西大街</td><td>人民公社路</td></tr><tr><td>西交民巷</td><td>必胜路</td></tr><tr><td>珠市口西大街，骡马市大街，广安门内外大街</td><td>红卫路</td></tr><tr><td>大羊坊路</td><td>四季红路</td></tr><tr><td>百万庄大街</td><td>宇宙红路</td></tr><tr><td>珠市口东大街</td><td>红光路</td></tr><tr><td>酒仙桥路</td><td>东红路</td></tr><tr><td>广宁路</td><td>红电路</td></tr><tr><td>西老胡同</td><td>普红胡同</td></tr><tr><td>台基厂大街</td><td>永革路</td></tr><tr><td>黄寺大街</td><td>永进路</td></tr><tr><td>东黄城根北街</td><td>霞光街</td></tr><tr><td>夕照寺街</td><td>光明路</td></tr><tr><td>车公庄大街</td><td>向东路</td></tr><tr><td>天坛路</td><td>曙光路</td></tr><tr><td>北洼路</td><td>志远路</td></tr><tr><td>北蜂窝路</td><td>炬辉路</td></tr><tr><td>晋元庄路</td><td>智勇路</td></tr><tr><td>马家堡路</td><td>秋收起义路</td></tr></tbody></table></figure>

<p class="wp-block-paragraph">太多了，还有很多胡同，我就不一一罗列了，而且也不容易对应上，估计大部分如今已经被拆了。</p>

<blockquote class="wp-block-quote is-layout-flow wp-block-quote-is-layout-flow">
<p class="wp-block-paragraph">最为省事的办法是以一个革命化的新名称替换一大片胡同名，譬如东城区决定从东单二条到前炒面胡同，按顺序改名为瑞金路头条至三十条；从大甜水井胡同到菜厂胡同、锡拉胡同、东厂胡同，列为人民路一至九条；</p>
</blockquote>

<p class="wp-block-paragraph">如果只是单纯的在地图上加上标记没什么意思。那只是把地图拿来应用，算不上是地图本身。我们要</p>

<div class="wp-block-image">
<figure class="aligncenter"><img loading="lazy" decoding="async" width="699" height="56" src="/wp-content/uploads/2019/09/gis-5-9.jpeg" alt="" class="wp-image-384" srcset="/wp-content/uploads/2019/09/gis-5-9.jpeg 699w, /wp-content/uploads/2019/09/gis-5-9-300x24.jpeg 300w" sizes="auto, (max-width: 699px) 100vw, 699px" /></figure>
</div>

<p class="wp-block-paragraph">那么怎么才能修改地图上的数据呢？或者说，如何才能让我们后期添加到地图上的数据看起来和地图上的其他要素融为一体呢？有请 <a href="https://studio.mapbox.com/" target="_blank" rel="noopener">Mapbox Studio</a> 以及 <a href="https://www.openstreetmap.org" target="_blank" rel="noopener">OpenStreetMap</a>。</p>

<p class="wp-block-paragraph">点的标记并不难做，无论是文字还是图标。不好弄的是路名。现在的解决方案是，从 OSM 上下载北京的路网数据，修改道路名称，再将修改后的数据上传到 Studio 中，将上传的道路数据以 Symbol Layer 加载到样式中，并将绘制方式设置的和原有的道路名称图层一样。</p>

<h2 class="wp-block-heading">样式设计</h2>

<h3 class="wp-block-heading">地图重点</h3>

<p class="wp-block-paragraph">地图重点要展示哪些信息呢？上述提到的被更改的道路名称，地名等肯定是要着重显示的。除此之外，还有天安门广场，中南海，以及各级党政机关等重点区域也要突出显示。对应的图标也要替换。</p>

<p class="wp-block-paragraph">在搜索资料的过程中，了解到在六七十年代，有一种叫做串联图的存在。搜索“大串连”以了解更多内容。那地图的标题就叫《首都革命串联交通图》好了。</p>

<h3 class="wp-block-heading">字体</h3>

<p class="wp-block-paragraph">简单搜索了一下，最终选用澎湃字体。不过由于 Mapbox Studio 貌似存在bug，现在字体还不能显示出来。</p>

<h3 class="wp-block-heading">配色</h3>

<p class="wp-block-paragraph">参考当时的海报风格，主要是革命红，军装绿和工人蓝，意外的是还有金色，莫不是党的光辉？那就叫光辉金好了。</p>

<h3 class="wp-block-heading">全国山河一片红</h3>

<div class="wp-block-image">
<figure class="aligncenter"><img loading="lazy" decoding="async" width="223" height="300" src="/wp-content/uploads/2019/09/gis-5-12-223x300.jpg" alt="" class="wp-image-397" srcset="/wp-content/uploads/2019/09/gis-5-12-223x300.jpg 223w, /wp-content/uploads/2019/09/gis-5-12.jpg 297w" sizes="auto, (max-width: 223px) 100vw, 223px" /><figcaption class="wp-element-caption">《全国山河一片红》邮票</figcaption></figure>
</div>

<p class="wp-block-paragraph">这张邮票的背景读者可以自行搜索。我觉得将地图在小比例尺下显示成这样的效果不错。关键是怎么做出这样的效果呢？</p>

<p class="wp-block-paragraph">首先我们需要把除大陆以外的国家隐藏，并将大陆地区的背景设置为红色。并按照大陆地区的陆地边界线设置光晕效果。最后还要添加一个台湾地区的红色边框。哦，还有金色的横幅。革命红与光辉金的搭配再次出现。</p>

<p class="wp-block-paragraph">难搞的是大陆地区的陆地边界线。需要用大陆地区省份的多边形进行合并，再从中减去渤海，黄海，东海等海域。别忘了还要删掉南海诸岛。实际上多虑了，我本以为国家边界线数据会包括领海，实际上并没有。而且数据里把南海诸岛的所属国家标注成菲律宾了，也省的我麻烦了。</p>

<p class="wp-block-paragraph">因为 Studio 的热力图图层貌似存在bug，所以光晕效果没有加上。将下面的地图缩小至全国范围可以看到效果。</p>

<h2 class="wp-block-heading">最终效果</h2>

<p><script src="https://api.tiles.mapbox.com/mapbox-gl-js/v1.3.1/mapbox-gl.js"></script>
<link href="https://api.tiles.mapbox.com/mapbox-gl-js/v1.3.1/mapbox-gl.css" rel="stylesheet">
<style>
    #map_one { 
		width:100%;
		height:550px;
		margin: auto; 
	}
</style>
<div id="map_one"></div>
<p><script>
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
</script></p>

<h2 class="wp-block-heading">最后</h2>

<p class="wp-block-paragraph">值此新中国成立70周年之际，就将此图献给国家吧。??❓</p>

<div class="wp-block-image">
<figure class="aligncenter is-resized"><img loading="lazy" decoding="async" src="/wp-content/uploads/2019/09/gis-5-10-1024x634.png" alt="" class="wp-image-385" width="512" height="317" srcset="/wp-content/uploads/2019/09/gis-5-10-1024x634.png 1024w, /wp-content/uploads/2019/09/gis-5-10-300x186.png 300w, /wp-content/uploads/2019/09/gis-5-10-768x476.png 768w, /wp-content/uploads/2019/09/gis-5-10.png 1271w" sizes="auto, (max-width: 512px) 100vw, 512px" /></figure>
</div>

<h2 class="wp-block-heading">参考资料</h2>

<ul class="wp-block-list">
<li><a href="http://www.unirule.cloud/index.php?c=article&amp;id=4827" target="_blank" rel="noopener">《中评周刊》第115期</a></li>

<li><a href="http://seemap.kr-smart.com/index.php?m=content&amp;c=index&amp;a=show&amp;catid=30&amp;id=492" target="_blank" rel="noopener">“文革”大串连:地图上抹不掉的记忆</a></li>

<li><a href="https://zhuanlan.zhihu.com/p/28785397" target="_blank" rel="noopener">锐字工房澎湃字体介绍</a></li>
</ul>
