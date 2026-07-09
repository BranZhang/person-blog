---
title: "用 GeoServer 发布适用于 Mapbox 的矢量切片"
description: "使用 GeoServer 搭建适用于 Mapbox 的矢量瓦片服务过程记录。好久没更新了，拿这篇来凑凑数。"
pubDatetime: 2021-01-05T10:10:24.000Z
modDatetime: 2025-02-18T14:32:47.000Z
draft: false
tags: ["geoserver","mapbox","mvt","GIS"]
---

Mapbox 的矢量切片的服务发布方式不仅限于使用 GeoServer，Mapbox 自己本身也在提供这样的数据切片服务，本文仅为使用 GeoServer 提供同样的数据切片服务的操作说明，适用于规避 Mapbox 数据存储收费，内网部署等场景。

不过 Mapbox 貌似不再对数据存储收费了？而且如果一个人或者一家公司能够在内网中部署地图服务，数据矢量切片应该也不在话下？所以本文的方案到底会在什么样的场景下有用？

#### 步骤一：安装 GeoServer

参考文档：[Installation](https://docs.geoserver.org/latest/en/user/installation/index.html#installation)

#### 步骤二：打开 GeoServer 的跨域访问

参考文档：[Enable CORS](https://docs.geoserver.org/latest/en/user/production/container.html#production-container-enable-cors)

#### 步骤三：安装 Vector Tiles 扩展

参考教程：[Installing the Vector Tiles Extension](https://docs.geoserver.org/latest/en/user/extensions/vectortiles/install.html#vectortiles-install)

#### 步骤四：为发布的地图服务添加 mvt 格式的输出格式

参考教程：[Vector tiles tutorial](https://docs.geoserver.org/latest/en/user/extensions/vectortiles/tutorial.html#vectortiles-tutorial)

#### 步骤五：在 Mapbox 中加载

代码示例：

```js
map.addSource('poi', {
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
});
```

部分参数说明：

**scheme：**这里需要选择 tms，OSGeo 格式，参考文档：[vector-scheme](https://docs.mapbox.com/mapbox-gl-js/style-spec/sources/#vector-scheme)

**坐标系：**需要使用 EPSG:900913，而非 EPSG:4326。

**your server path：**

> *http://127.0.0.1:8080/geoserver/gwc/service/tms/1.0.0/*
>
> *china_city%3APoi@EPSG%3A900913@pbf/{z}/{x}/{y}.pbf*
>
> — 链接示例（已失效）

这记录好像有点水，之所以要研究一下 GeoServer 与 Mapbox 的合作方式，是因为有人在 UpWork 上发单了指名要做这么件事。等以后想到有什么更加有价值的使用场景再补充进来。
