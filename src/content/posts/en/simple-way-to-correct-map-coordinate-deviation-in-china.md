---
title: "A Simple Way to Correct Raster Map Offsets in China"
description: "Approximately correcting GCJ-offset raster tiles by transforming the requested tile extent before retrieving imagery."
pubDatetime: 2017-11-23T13:22:36.000Z
modDatetime: 2023-01-03T09:57:46.000Z
draft: false
hiddenLocales: ["zh-cn"]
tags: ["GCJ-02", "WMS", "Coordinate Systems", "Mapping", "GIS"]
---

While developing a program that wraps online map services as WMS layers, I discovered a way to approximately correct the positional offset in raster maps served in China.

## Project Overview

### Motivation

Projects that compare data from several online map providers must usually integrate multiple service APIs. Development becomes simpler if every provider can be loaded through a common layer interface.

This project wraps online map services as WMS layers so that they can be loaded into map controls and mainstream GIS software such as QGIS and ArcGIS. The resulting layers are mainly useful for visual comparison.

### Request Flow

The WMS wrapper works as follows:

1. The map control or GIS application receives a user-supplied WMS URL.
2. It sends a WMS map request with the required parameters.
3. The server reads the requested extent, image dimensions, and other parameters.
4. It requests the corresponding tiles from the online map provider.
5. It crops, stretches, or otherwise transforms the returned imagery.
6. It returns the final image to the client.

The wrapper itself is straightforward. The unexpected result was that this workflow made it possible to approximately reverse the offset applied to raster maps.

## The Key Observation

Real-world features such as buildings and roads pass through data collection and processing before being rendered into map tiles.

![](/wp-content/uploads/2019/08/gis-4-real_world.png "A building between points A and B rendered into a tile")

When a provider applies a coordinate offset, the effect is not obvious if its data is used alone. Combining it with other sources, however, reveals misalignment between datasets. The offset is generally nonlinear and cannot be corrected by adding a constant displacement.

To keep the map usable, the transformation must nevertheless be approximately linear over a sufficiently small area. The diagram below illustrates transformed feature coordinates. Requesting a tile using the original points A and B returns imagery containing the shifted features.

![](/wp-content/uploads/2019/08/gis-4-encrypted_coordinate.png)

The provider cannot return a tile rendered from the unshifted source data. It can, however, return a tile that closely resembles one.

The solution is to use the provider's API for converting original coordinates into its offset coordinate system. Transform the desired tile extent through that API before requesting the imagery.

![](/wp-content/uploads/2019/08/gis-4-finish.png)

If A transforms to A′ and B transforms to B′, the tile requested for the A′–B′ extent is approximately aligned with the original A–B extent.

The smaller the requested tile extent, the better this local linear approximation becomes.

## Requirements

**A provider can be wrapped as WMS if it offers interface 1 below. If it offers both interfaces, its offset tiles can be approximately restored to the original coordinate space:**

1. **An interface that returns map imagery for a specified coordinate extent.**
2. **An interface that transforms original coordinates into the provider's offset coordinate system.**

Most providers do not directly expose interface 1. A static-map API may serve the same purpose, or the tile requests can be identified by inspecting network traffic.

Most online map providers do expose interface 2.

## Result

The red lines in the following screenshots are OpenStreetMap data.

![](/wp-content/uploads/2019/08/gis-4-amap_osm.png "Amap imagery and OSM data before correction")

![](/wp-content/uploads/2019/08/gis-4-amap_c_osm.png "Corrected Amap imagery aligned with OSM data")

After applying the correction described above, the raster tiles in the second screenshot align closely with the OSM vectors.

Project: [BranZhang/WebMap2WMS](https://github.com/BranZhang/WebMap2WMS)

[]()
