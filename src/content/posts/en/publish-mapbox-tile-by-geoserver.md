---
title: "Publishing Mapbox-Compatible Vector Tiles with GeoServer"
description: "A practical walkthrough for publishing a Mapbox-compatible vector tile service with GeoServer."
pubDatetime: 2021-01-05T10:10:24.000Z
modDatetime: 2025-02-18T14:32:47.000Z
draft: false
hiddenLocales: ["zh-cn"]
tags: ["GeoServer", "Mapbox", "MVT", "GIS"]
---

GeoServer is not the only way to publish vector tiles for Mapbox. Mapbox also provides its own tiling and hosting services. This article simply explains how to provide an equivalent vector tile service with GeoServer, which can be useful when avoiding hosted-data charges or deploying within a private network.

That said, Mapbox no longer appears to charge for data storage. And if an individual or company can deploy a map service on an internal network, generating vector tiles is probably not much of an obstacle either. So the exact use case for this approach may be narrower than it first appears.

#### Step 1: Install GeoServer

See the [installation documentation](https://docs.geoserver.org/latest/en/user/installation/index.html#installation).

#### Step 2: Enable Cross-Origin Access in GeoServer

See [Enable CORS](https://docs.geoserver.org/latest/en/user/production/container.html#production-container-enable-cors).

#### Step 3: Install the Vector Tiles Extension

Follow [Installing the Vector Tiles Extension](https://docs.geoserver.org/latest/en/user/extensions/vectortiles/install.html#vectortiles-install).

#### Step 4: Add MVT as an Output Format

Follow the [Vector tiles tutorial](https://docs.geoserver.org/latest/en/user/extensions/vectortiles/tutorial.html#vectortiles-tutorial).

#### Step 5: Load the Tiles in Mapbox

Example:

```js
map.addSource("poi", {
  type: "vector",
  scheme: "tms",
  tiles: ["your server path"],
});
map.addLayer({
  id: "layer",
  type: "circle",
  source: "poi",
  "source-layer": "poi_source_layer",
  paint: {
    "circle-radius": 10,
    "circle-color": "Black",
  },
});
```

Notes on several parameters:

**`scheme`:** Select `tms`, the OSGeo tile addressing scheme. See [vector-scheme](https://docs.mapbox.com/mapbox-gl-js/style-spec/sources/#vector-scheme).

**Coordinate reference system:** Use EPSG:900913 rather than EPSG:4326.

**`your server path`:**

> *http://127.0.0.1:8080/geoserver/gwc/service/tms/1.0.0/*
>
> _china_city%3APoi@EPSG%3A900913@pbf/{z}/{x}/{y}.pbf_
>
> — Example URL (no longer available)

This is admittedly a lightweight note. I originally investigated the GeoServer–Mapbox workflow because someone had posted an Upwork job specifically requesting it. I may add more substantial use cases if I encounter them later.
