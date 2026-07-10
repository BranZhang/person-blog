---
title: "Designing a Cultural Revolution-era Map"
description: "A cartographic experiment combining historical Beijing street names with period-inspired typography, colors, symbols, and map styling."
pubDatetime: 2019-09-07T13:01:54.000Z
modDatetime: 2025-02-04T13:40:24.000Z
draft: false
hiddenLocales: ["zh-cn"]
tags: ["Mapbox", "OpenStreetMap", "Cartography", "GIS"]
cover: "/wp-content/uploads/2019/09/china-e1673587197753.png"
---

I recently read Chen Tushou's article “Inside Beijing's Place-name Changes, 1965–1975,” which describes an official effort in the 1960s and 1970s to replace Beijing street names considered inconsistent with the political climate of the time.

> Numerous revolutionary proposals called for street names associated with feudalism or capitalism to be replaced by names carrying revolutionary meaning, so that the capital's streets would reflect the spirit of the socialist era.
>
> — Chen Tushou, “Inside Beijing's Place-name Changes, 1965–1975”

Rather than reconstructing every renaming from the period, I used the examples in that article to design a map whose data and visual style evoke its historical context.

## Overview

The custom data consists mainly of the place-name changes listed in the article. Other roads remain unchanged; their alignments are assumed to be broadly similar to the modern network.

The style covers typography, colors, and symbols.

The following images served as visual references. They came from the web and may include later reproductions.

<figure class="blog-gallery">
<div class="blog-gallery-grid" style="grid-template-columns:repeat(auto-fit,minmax(220px,1fr))">
  <figure class="blog-gallery-item"><img src="/wp-content/uploads/2019/09/gis-5-1.jpg" alt="" loading="lazy" /></figure>
  <figure class="blog-gallery-item"><img src="/wp-content/uploads/2019/09/gis-5-6-722x1024.jpg" alt="" loading="lazy" /></figure>
  <figure class="blog-gallery-item"><img src="/wp-content/uploads/2019/09/gis-5-7.jpg" alt="" loading="lazy" /></figure>
  <figure class="blog-gallery-item"><img src="/wp-content/uploads/2019/09/gis-5-4-1.png" alt="" loading="lazy" /></figure>
</div>
</figure>

## Data Preparation

The article provides the following mapping between established Beijing road names and their proposed or temporary replacements:

| Zhangzizhong Road                                                                         | East Workers–Peasants–Soldiers Avenue |
| ----------------------------------------------------------------------------------------- | ------------------------------------- |
| Zhaodengyu Road                                                                           | Zhonghua Road                         |
| Tonglinge Road                                                                            | Four News Road                        |
| Shifuma Avenue _(now New Culture Street)_                                                 | New Culture Street                    |
| East and West Chang'an Avenue; roads inside and outside Jianguomen and Fuxingmen          | The East Is Red Avenue                |
| Fuxing Road                                                                               | People's Liberation Army Road         |
| Jianguo Road                                                                              | Long March Road                       |
| Qianmen Avenue, Tianqiao South Avenue, roads inside and outside Yongdingmen, Nanyuan Road | Communism Avenue                      |
| Roads inside and outside Di'anmen                                                         | General Line Road                     |
| Fuyou Street                                                                              | Shaoshan Road                         |
| Xishiku Avenue                                                                            | Collectivization Road                 |
| Jingshan East Street                                                                      | Ever Red Road / Raising the Red Road  |
| Xisi North Avenue and Xinjiekou South Avenue                                              | Red Flag Road                         |
| Dongsi North Avenue and Yonghegong Avenue                                                 | Red Sun Road                          |
| Wangfujing Avenue                                                                         | People's Road                         |
| Di'anmen East Avenue                                                                      | Great Leap Forward Road               |
| Di'anmen West Avenue                                                                      | People's Commune Road                 |
| West Jiaomin Lane                                                                         | Certain Victory Road                  |
| Zhushikou West Avenue, Luomashi Avenue, and roads inside and outside Guang'anmen          | Red Guard Road                        |
| Dayangfang Road                                                                           | All Seasons Red Road                  |
| Baiwanzhuang Avenue                                                                       | Cosmic Red Road                       |
| Zhushikou East Avenue                                                                     | Red Light Road                        |
| Jiuxianqiao Road                                                                          | East Red Road                         |
| Guangning Road                                                                            | Red Electricity Road                  |
| Xilao Hutong                                                                              | Universal Red Hutong                  |
| Taijichang Avenue                                                                         | Permanent Revolution Road             |
| Huangsi Avenue                                                                            | Ever Forward Road                     |
| East Huangchenggen North Street                                                           | Rosy Clouds Street                    |
| Xizhaosi Street                                                                           | Bright Road                           |
| Chegongzhuang Avenue                                                                      | Eastward Road                         |
| Tiantan Road                                                                              | Dawn Road                             |
| Beiwa Road                                                                                | Lofty Aspiration Road                 |
| Beifengwo Road                                                                            | Torch Radiance Road                   |
| Jinyuanzhuang Road                                                                        | Wisdom and Courage Road               |
| Majiapu Road                                                                              | Autumn Harvest Uprising Road          |

Many more hutongs were renamed, but matching them to the modern city is difficult and some have since been demolished.

> The simplest approach was to replace a whole group of hutong names with a revolutionary series—for example, renaming streets from Dongdan 2nd Alley through Qianchaomian Hutong as Ruijin Road 1st through 30th Alleys, and another group as People's Road 1st through 9th Alleys.

Simply placing markers on an existing map would not be especially interesting. The historical data should become part of the map itself.

![](/wp-content/uploads/2019/09/gis-5-9.jpeg)

How can newly added data look native to the rest of the map? The workflow uses [Mapbox Studio](https://studio.mapbox.com/) and [OpenStreetMap](https://www.openstreetmap.org).

Point labels and icons are straightforward; road names are harder. I downloaded Beijing's road network from OSM, replaced the names, uploaded the modified data to Studio, and rendered it as a symbol layer matching the built-in road-label style.

## Style Design

### Visual Hierarchy

The renamed roads and places need the greatest emphasis, along with Tiananmen Square, Zhongnanhai, and government institutions. Their symbols also need period-appropriate replacements.

Research uncovered “revolutionary travel maps” associated with the mass networking campaigns of the era, so I titled the design _Revolutionary Travel and Transportation Map of the Capital_.

### Typography

I selected the Pengpai display typeface, although a Mapbox Studio issue prevented it from rendering at the time.

### Color Palette

The palette draws from contemporary posters: revolutionary red, military green, worker blue, and a gold accent.

### “The Whole Country Is Red”

![](/wp-content/uploads/2019/09/gis-5-12-223x300.jpg "The Whole Country Is Red postage stamp")

The famous stamp suggested an effective small-scale national view. The remaining question was how to reproduce it cartographically.

The design hides other countries, fills mainland China in red, adds a glow along the land boundary, outlines Taiwan in red, and places a gold banner above the map.

Constructing the mainland boundary was the difficult part. The initial plan was to union provincial polygons and subtract the Bohai, Yellow, and East China seas. In practice, the country-boundary dataset did not include territorial waters, which simplified the operation.

A Studio heatmap-layer issue prevented the glow effect. Zoom the map below out to the national extent to see the rest of the design.

## Final Result

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

## Closing Note

The map was completed for the 70th anniversary of the founding of the People's Republic of China.

![](/wp-content/uploads/2019/09/gis-5-10-1024x634.png)

## References

- [China Review Weekly, Issue 115 (Chinese)](http://www.unirule.cloud/index.php?c=article&id=4827)
- [Cultural Revolution Mass Networking: Memories That Maps Cannot Erase (Chinese)](http://seemap.kr-smart.com/index.php?m=content&c=index&a=show&catid=30&id=492)
- [Introduction to the Pengpai Typeface (Chinese)](https://zhuanlan.zhihu.com/p/28785397)
