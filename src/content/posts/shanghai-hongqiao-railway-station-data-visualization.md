---
title: "虹桥火车站的火车运行可视化"
description: "实现了一个简单的虹桥火车站运行的可视化效果，细化到每一个车站，每一节车厢。"
pubDatetime: 2019-12-08T16:57:59.000Z
modDatetime: 2023-01-03T10:05:47.000Z
draft: false
tags: ["可视化","火车","虹桥站","GIS"]
cover: "/wp-content/uploads/2019/12/hongqiao.png"
---
<p class="wp-block-paragraph">当做完这个火车运行可视化的小页面时，已经想不起来为什么要做这个了，可能就是觉得好玩吧。最终的版本比起最初设想的内容，缺了不少，主要是一些数据无法获取到。也有一些是因为实现起来太复杂。</p>

<!--more-->

<p class="wp-block-paragraph">虽然个人不喜欢网页中带背景音乐，但这里还是想附歌一首，来自《train valley》游戏中，“Japan”章节的背景音乐。</p>

<figure class="wp-block-audio"><audio controls src="/wp-content/uploads/2019/12/train_valley_japan3_OST.mp3" loop></audio><figcaption class="wp-element-caption">train_valley_japan3_OST</figcaption></figure>

<h2 class="wp-block-heading">示例体验</h2>

<p class="wp-block-paragraph">左上角可暂停或者继续，目前示例中的数据为下午6点至 下午 6点40分的部分列车。点击地图的右上角可全屏观看。</p>

<div class="wp-block-cp-codepen-gutenberg-embed-block cp_embed_wrapper"><iframe id="cp_embed_rNvWjde" src="//codepen.io/anon/embed/rNvWjde?height=450&amp;theme-id=1&amp;slug-hash=rNvWjde&amp;default-tab=result" height="450" scrolling="no" frameborder="0" allowfullscreen allowpaymentrequest name="CodePen Embed rNvWjde" title="CodePen Embed rNvWjde" class="cp_embed_iframe" style="width:100%;overflow:hidden">CodePen Embed Fallback</iframe></div>

<h2 class="wp-block-heading">数据说明</h2>

<p class="wp-block-paragraph">数据主要抓取自第三方的火车票购票平台，它们把数据都整理好了，抓取过程极为方便。</p>

<p class="wp-block-paragraph">但问题在于有些数据抓取不到，比如一趟车次的车厢数量，所以就默认车厢数量为16。但实际上有些列车短一些，有些长一些的。比如17辆长编组“复兴号”动车组。</p>

<p class="wp-block-paragraph">大部分以“上海虹桥站”为终点站的车次，都没有站台信息，所以也可视化不了。据了解可能是一些车次的终点站停靠站台是在抵达前零时安排的，所以也无法通过接口获取到。</p>

<h2 class="wp-block-heading">可视化实现方法</h2>

<h3 class="wp-block-heading">铁路主题的地图</h3>

<p class="wp-block-paragraph">基于暗色调的地图，移除了与铁路无关的要素，重点突出了铁路轨道。不得不说OSM上的数据很全，虹桥火车站的30个站台标注的都很准，铁路之间的岔口也比较全，基本满足了列车的路径规划需求。</p>

<p class="wp-block-paragraph">虹桥火车站南北两侧的进出的贴图标注的也很全面，至少从虹桥站到上海南站和上海站的轨道是有的，本打算将上海的三个火车站的列车一起可视化的，但是考虑到地图在小比例尺下，列车，轨道和站台的显示效果不好，所以就放弃了。</p>

<p class="wp-block-paragraph">所以，最终决定就只显示虹桥火车站及出站后或者进站前的6千米的范围内的轨道。</p>

<h3 class="wp-block-heading">列车模型</h3>

<p class="wp-block-paragraph">列车的模型采用了8节编组的方式，2个编组串联成一趟列车。不知道这样是否准确。</p>

<figure class="wp-block-image size-large"><img loading="lazy" decoding="async" width="1024" height="165" src="/wp-content/uploads/2019/12/image-1024x165.png" alt="" class="wp-image-676" srcset="/wp-content/uploads/2019/12/image-1024x165.png 1024w, /wp-content/uploads/2019/12/image-300x48.png 300w, /wp-content/uploads/2019/12/image-768x124.png 768w, /wp-content/uploads/2019/12/image.png 1453w" sizes="auto, (max-width: 1024px) 100vw, 1024px" /></figure>

<p class="wp-block-paragraph">一趟列车对应着16个车厢对象，分别具有以下的属性：</p>

<ul class="wp-block-list">
<li>位置：经纬度表示的位置</li>

<li>旋转角度：车厢本身与正北之间的夹角</li>

<li>类型：车头，车身还是车尾</li>
</ul>

<pre class="EnlighterJSRAW" data-enlighter-language="js" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">static buildGeoJSON(coord, train_index, train_type, angle) {
    var singe_type = "body";

    if (train_type === "动车组" &amp;&amp; (train_index===0 || train_index===8)) {
        singe_type = "normal_head";
    }
    else if (train_type === "动车组" &amp;&amp; (train_index===7 || train_index===15)) {
        singe_type = "normal_tail";
    }
    else if (train_type === "高速铁路" &amp;&amp; (train_index===0 || train_index===8)) {
        singe_type = "high_head";
    }
    else if (train_type === "高速铁路" &amp;&amp; (train_index===7 || train_index===15)) {
        singe_type = "high_tail";
    }

    return {
        "type": "Feature",
        "geometry": {
            "type": "Point",
            "coordinates": coord
        },
        "properties": {
            "train_type": singe_type,
            "icon_rotate": angle
        }
    };
}</pre>

<p class="wp-block-paragraph">利用上述的3种属性即可绘制出一帧上面的截图的效果。下面将介绍这些属性的计算方式。</p>

<h3 class="wp-block-heading">列车数据计算</h3>

<p class="wp-block-paragraph">花了最多时间的基本就是列车的相关数据计算，虚拟时间的控制也花了点精力。</p>

<p class="wp-block-paragraph">首先要计算的是，列车是否已经驶出站台？驶出的距离为多少？为了让列车的移动更加平稳，在上面的示例中，列车的运行实际上是一个匀加速运动，加速度默认为 <img loading="lazy" decoding="async" src="/wp-content/ql-cache/quicklatex.com-879d462270df2c9e785272e114bc9379_l3.png" class="ql-img-inline-formula quicklatex-auto-format" alt="&#49;&#109;&#47;&#115;&#94;&#50;" title="Rendered by QuickLaTeX.com" height="21" width="49" style="vertical-align: -5px;"/>。因为可视范围不大，所以再整个范围内列车都保持着加速度不变，不需要考虑速度到达某个最大值后保持匀速行驶。</p>

<p class="wp-block-paragraph">再实现一个类似于 <a href="http://turfjs.org/docs/#along" target="_blank" rel="noopener">Turf 中 Along 的方法</a>。区别在于，对于一趟列车，需要计算16次。所以，出于效率考虑，我自己实现了一个 Along 方法。</p>

<p class="wp-block-paragraph">已知驶出的距离，再在此基础上推算每节车厢的首尾位置的坐标，进而推算出每节车厢的坐标及旋转角度，就可以做出可视化的效果了。</p>

<pre class="EnlighterJSRAW" data-enlighter-language="js" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">// 推算每节车厢的首尾位置的坐标
for(var i=this.route_path_coords.length-1; i > 0; i--) {
    var coord1 = this.route_path_coords[i];
    var coord2 = this.route_path_coords[i-1];
    var tmp_distance = Train.calDistanceInM(coord1[0], coord1[1], coord2[0], coord2[1]);
    if(tmp_distance &lt; passed_distance) {
        passed_distance -= tmp_distance;
    }
    else {
        result_coords.push(Train.getLocationByDistance(coord1, coord2, passed_distance/tmp_distance));
        if (train_index > 0) {
            train_index -= 1;
            passed_distance += Train.single_length;
            i += 1;
        }
    }

    if (train_index === 0) {
        break;
    }
}

// 推算出每节车厢的坐标及旋转角度
for (var k=0; k&lt;result_coords.length-1; k++) {
    var coord1 = result_coords[k];
    var coord2 = result_coords[k+1];
    var center = [(coord1[0]+coord2[0])/2, (coord1[1]+coord2[1])/2];
    var angle = Train.calAngle(coord1[0], coord1[1], coord2[0], coord2[1]);
    
    results.push(Train.buildGeoJSON(center, k, this.train_type, angle));
}</pre>

<h2 class="wp-block-heading">代码获取</h2>

<p class="wp-block-paragraph"><a href="https://github.com/BranZhang/Hongqiao_railway_station" target="_blank" rel="noopener">https://github.com/BranZhang/Hongqiao_railway_station</a></p>
