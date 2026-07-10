---
title: "Web Gaussian Splatting: Cesium 3D Tiles vs. SparkJS 2.0"
description: "A technical comparison of Cesium's standards-based 3D Tiles pipeline and SparkJS 2.0's renderer-native, paged Gaussian-splat runtime."
pubDatetime: 2026-06-10T12:33:00.000Z
modDatetime: 2026-06-12T01:38:58.000Z
draft: false
hiddenLocales: ["zh-cn"]
tags: ["3D Tiles", "Cesium", "Gaussian Splatting", "SparkJS", "WebGL", "GIS"]
cover: "/wp-content/uploads/2026/06/labs-report-gaussian-splatting-stadium-e1781228379995.webp"
---

3D Gaussian Splatting (3DGS) is rapidly becoming a mainstream representation for photorealistic 3D rendering on the web. The industry has not yet converged on how a browser should efficiently stream and render millions—or tens of millions—of splats. This article compares two representative open-source approaches, **Cesium 3D Tiles + glTF `KHR_gaussian_splatting`** and **SparkJS 2.0**, examining their data formats, LOD strategies, streaming pipelines, runtime memory, ecosystem integration, and design tradeoffs.

Cesium and SparkJS solve the same problem from opposite directions:

- **Cesium** treats Gaussian splats as a **standard payload** within 3D Tiles. 3D Tiles supplies spatial indexing, metadata, and the request model; `KHR_gaussian_splatting` defines splat semantics; and the current implementation also requires an SPZ compression extension.
- **SparkJS 2.0** treats splats as a **renderer-native data structure**. It uses a custom Gaussian tree for LOD, a fixed global splat budget, a virtualized GPU page table for residency, and its own `.rad` format for chunked streaming.

Choose Cesium for **open standards, georeferencing, 3D Tiles metadata, and integration with large geospatial scenes**. Choose SparkJS for **strict control over the active splat count, fine-grained paging, low working-set memory, and tight Three.js integration**.

## Architecture and Data Formats

### Cesium: A Layered Standards Stack

Cesium uses a layered stack. The outer layer is a 3D Tiles tileset: every tile has a bounding volume, geometric error, refinement mode, and content URI. With implicit tiling, subtree files index the hierarchy, availability bitstreams use Morton order, and property tables can attach metadata.

Each selected tile contains glTF or GLB. Splats are point primitives with `POSITION`, `KHR_gaussian_splatting:ROTATION`, `SCALE`, `OPACITY`, and spherical-harmonic coefficients, plus optional `COLOR_0` data for a point-cloud fallback.

CesiumJS cannot currently render arbitrary glTF splats. It checks that the tileset declares both `KHR_gaussian_splatting` and `KHR_gaussian_splatting_compression_spz_2`. Selected tiles are expanded into runtime arrays—positions, rotations, scales, colors, and packed SH—and then aggregated into one rendering snapshot. Therefore:

> Cesium's streaming unit is the **tile**, and its runtime organization is **structured CPU arrays followed by GPU texture packing**.

### SparkJS: Two Renderer-native Storage Layers

Spark uses two storage layers.

**Layer 1, `PackedSplats`:** the core layout is fixed at **16 bytes per splat**: float16 center coordinates, a 3-byte logarithmically encoded scale, 4-byte RGBA, and an octahedral-plus-angle compressed quaternion. SH is stored separately (`sh1` uses two words per splat; `sh2` and `sh3` use four each). This is a hybrid of an **AoS 16-byte core record and SoA side buffers for SH**.

**Layer 2, `.rad`:** introduced in Spark 2.0 for LOD, streaming, and random access. It supports custom field encoding, columnar storage, compression, and chunked random access. At runtime, Spark either performs byte-range requests against one `.rad` file or follows header references to external `.radc` chunks. Page size is fixed at **65,536 splats per page**, and the shared desktop GPU pool defaults to **16,777,216 splats**.

### Different Roles for SPZ

SPZ, Niantic's open-source Gaussian compression format, matters to both ecosystems but serves different roles. For Cesium, SPZ is the compression path in the glTF extension workflow. For Spark, it is only one input format; `.rad` is the native streaming format for large LOD scenes. **SPZ is an interchange and transport codec, while `.rad` is a runtime-oriented scene-delivery codec.**

### Format Comparison

| Property                 | **Cesium 3D Tiles + glTF**                                                                     | SparkJS 2.0                                                                          |
| ------------------------ | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Primary container        | 3D Tiles tileset + glTF/GLB content; hierarchy, metadata, and availability come from 3D Tiles  | `PackedSplats` + `.rad`/`.radc` for prebuilt streaming LOD scenes                    |
| Data organization        | glTF point attributes → runtime arrays → aggregated snapshot                                   | 16-byte packed core record + separate SH buffers; columnar, chunkable `.rad` storage |
| Quantization/compression | glTF permits float or normalized integer accessors; Cesium currently requires SPZ              | Fixed-width quantized core, bit-packed SH, and compressed chunked access in `.rad`   |
| Metadata/indexing        | Tile/content metadata, implicit-subtree availability, Morton ordering                          | Header metadata, chunk-to-page mapping, freelist, and LRU                            |
| Streaming unit           | Tile-content and subtree files                                                                 | Network chunks and GPU pages of 65,536 splats                                        |
| Standardization          | Open-standards path; `KHR_gaussian_splatting` is a Release Candidate proposed for 3D Tiles 2.0 | Open source but Spark-specific; not an industry standard                             |

## LOD: Tile-level Error vs. a Splat-tree Budget

This is the most fundamental difference between the two systems.

### Cesium: Tile-level Screen-space Error

Cesium inherits its LOD model from 3D Tiles. Every tile has a `geometricError` and a `REPLACE` or `ADD` refinement mode. Runtime screen-space error is derived from geometric error and camera state, and refinement occurs above a threshold. **The LOD unit is a tile, and the metric is tile-level screen-space error—not individual-splat importance.**

### Spark: Gaussian Splat Tree with a Hard Budget

Spark constructs a **Gaussian splat tree** in which every internal splat is a downsampled representation of its children. Background traversal uses a priority queue ordered by `pixel_scale`, the projected angular size. Refinement stops when the largest frontier splat is smaller than one pixel, the node has no children, or further refinement would exceed budget `N`. Multi-tree traversal and foveation distribute the global budget across objects according to screen relevance.

> **Cesium asks, “Which spatial tiles should be displayed?” Spark asks, “Which splat-tree frontier produces the best image under this budget?”**

This distinction determines most downstream behavior. Cesium's coarse unit provides interoperability and metadata support, but refinement quality depends on the tiler's spatial partitioning and geometric-error assignment; the Cesium ion tiler is not open source. Spark directly controls complexity and detail distribution, with `O(N log N)` traversal cost relative to rendered splats rather than total scene size, but only within Spark's ecosystem.

## Streaming Pipelines

### Cesium: Select Tiles → Aggregate a Snapshot → Commit Atomically

1. 3D Tiles traversal selects visible tiles.
2. `GltfLoader` loads content; `GaussianSplat3DTileContent` extracts and caches positions, rotations, scales, and SH.
3. `GaussianSplatPrimitive` aggregates selected tiles into a pending snapshot.
4. A WASM texture generator packs attributes into GPU textures.
5. A WASM radix sorter produces the sorted index buffer, and the snapshot is committed atomically.
6. In steady state, sorting runs again only after camera movement exceeds a threshold.

### Spark: Operating-system-style Virtual Memory

1. `PagedSplats` parses the `.rad` header from a small leading byte range, expanding from 64 KB to 256 KB and then 1 MB as needed.
2. It obtains chunks through byte-range requests or external `.radc` files and decodes them in a worker.
3. `SplatPager` manages a shared page pool, freelist, LRU, chunk-to-page mapping, and preallocated textures.
4. Visible instances upload an index-indirection texture mapping logical output order to page-resident packed splats.

This applies operating-system-style virtual memory to splats: **streaming unit = chunk, residency unit = page, draw-indirection unit = index texture**.

Spark's pager is not yet fully mature. Open issues report that disposing `PagedSplats` does not abort in-flight requests, orphaned requests can leave stale references in pager maps, and `.rad` scenes can exhibit animation stutter. These issues do not invalidate the architecture, but they matter when selecting a production path.

### A Shared Abstract Lifecycle

Both pipelines share the same abstract lifecycle: a selector decides what is needed → the network retrieves a tile or chunk → a worker or WASM module decodes it → textures and indices are uploaded → splats are sorted and drawn.

![](/wp-content/uploads/2026/06/mermaid-diagram-1024x500.png)

## Runtime Memory and GPU Layout

Both public implementations are **WebGL-first** and texture-centric, but their working-set memory costs differ significantly.

**Cesium:** CPU-side positions, rotations, and scales use `Float32Array`; colors use `Uint8Array`; and SH half-float pairs are packed into `Uint32Array`. Each GPU splat occupies **two `RGBA32UI` texels, or 32 bytes**, in the primary attribute texture, with SH in another integer texture. Rendering disables culling, enables depth testing, disables depth writes, and uses premultiplied-alpha blending.

**Spark:** an `RGBA32UI` `DataArrayTexture` stores the 16-byte packed core record. `RG32UI` and `RGBA32UI` textures store SH, while `PagedSplats` adds a 2D `RGBA32UI` index texture for logical indirection. Sorting can use radial distance or z-depth. The documentation recommends disabling browser MSAA, which does not improve splatting and reduces performance.

### Storage and Working-set Estimates

| Metric                                    | Cesium                                                                  | SparkJS 2.0                                             |
| ----------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------- |
| Source bytes/splat, core only             | Estimated 24–36 B; SPZ can substantially reduce disk size               | **Exactly 16 B**                                        |
| Source bytes/splat, with SH3              | Estimated ~228 B with all-float32 SH                                    | **Exactly 56 B**: 16 core + 8 sh1 + 16 sh2 + 16 sh3     |
| Active GPU bytes/visible splat, core only | ~32 B: two `RGBA32UI` texels                                            | ~20 B: 16 core + ~4 index                               |
| Active GPU bytes/visible splat, with SH3  | ~152 B                                                                  | ~60 B                                                   |
| Decode/staging model                      | Tile decode + transform + snapshot aggregation + texture packing + sort | Worker chunk decode + page upload + index update + sort |

(Spark's core values are exact. Cesium's byte counts are estimates because glTF accessors permit several component types and SPZ substantially changes disk size.)

Cesium's hard-limit behavior is also notable. If the packed-splat texture would exceed the maximum texture dimensions, the implementation truncates the visible splat count and temporarily increases screen-space error. If the SH texture exceeds its limit, SH is disabled for that snapshot and rendering falls back to colors only. Cesium's visible-splat renderer is therefore constrained mainly by **texture capacity for the current tile set**, not by a fixed application-level budget.

## Performance Characteristics and Tradeoffs

**Bandwidth:** Cesium reduces network complexity through a standard hierarchy: subtree availability tells the client which tiles exist before fetching. Once selected, however, the request unit remains an entire tile-content file. Spark pays for a custom transport contract but fetches only the chunks required to fill the current budget frontier and reuses one fixed GPU pool across objects.

**CPU:** Cesium's heavy work occurs when the **selected tile set changes**: aggregation, transformation, packing, and sorting. Its architectural unit is “rebuild the visible snapshot.” Spark shifts work into continuous background maintenance—priority-queue traversal, chunk decoding, page residency, and index updates—avoiding a monolithic rebuild after small view changes.

**GPU:** Spark's advantage is clearest when the scene is enormous but screen complexity is bounded. Its fixed budget makes rendering cost nearly independent of total scene size: roughly **1.5 million LOD splats** by default on desktop and **500,000** on mobile. Cesium's screen-space-error mechanism is excellent for general 3D Tiles refinement but less direct as a Gaussian-specific budget.

**Mobile:** Spark provides a clearer budget model. Its paged-splat pool defaults to roughly 6.29 million splats on iOS and 8.39 million on other mobile devices, versus 16.78 million on desktop, and it exposes foveation controls. Cesium's fallbacks are robust but opportunistic—truncate on overflow or disable SH. Spark fits better when device-level predictability matters more than standards alignment.

### Decision Table

| Property          | Cesium 3D Tiles + glTF                                                                   | SparkJS 2.0                                                                                    |
| ----------------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Format            | Open-standards path, currently requiring SPZ compression                                 | Open source but Spark-specific; `.rad` is not an external standard                             |
| LOD unit          | Hierarchical tile                                                                        | Gaussian-tree node                                                                             |
| Streaming unit    | Tile-content and subtree files                                                           | Network chunk and GPU page                                                                     |
| Bytes/splat       | Higher and more variable: GPU core ~32 B, ~152 B with SH3                                | Lower and predictable: exactly 16 B core, ~60 B with SH3                                       |
| Decode cost       | Bursty when the tile set changes                                                         | Incremental worker, paging, and index updates                                                  |
| Greatest strength | Standards, geospatial metadata, interoperability, multi-engine deployment                | Fixed-budget rendering, fine-grained streaming, low active memory, native Three.js integration |
| Greatest weakness | Coarse request granularity and expensive snapshot rebuilds                               | Weak transport standardization; pager and animation still have rough edges                     |
| Best fit          | Geospatial digital twins, inspection systems, analytical overlays, mixed 3D Tiles scenes | Web/XR viewers, interactive worlds, and tightly budgeted composite scenes                      |

## Choosing Between Them

**If the project must live in the Cesium, 3D Tiles, and geospatial stack, choose Cesium.** The deciding factor is not raw performance but organizational leverage: standard metadata, an existing toolchain, georeferencing, and deployment across CesiumJS and Unreal.

**If the project is a custom web renderer and you control the viewer, content pipeline, and network protocol, choose Spark.** A fixed active-splat budget and virtualized page-resident pool give it a clear advantage in client-side control and device-level predictability.

## Future Directions

**Standards momentum favors Cesium.** `KHR_gaussian_splatting` is a Khronos Release Candidate whose design leaves room for future kernels, projections, and sorting modes. Cesium has also positioned splats as part of a future 3D Tiles proposal. Once splats become a durable open payload in glTF and 3D Tiles, every incremental ecosystem improvement will benefit splat delivery.

**Spark's contribution is architectural.** It demonstrates that a Gaussian-native runtime can treat splats as a **virtualized working set** rather than one monolithic point cloud. Even if `.rad` never becomes a standard, fixed budgets, page tables, multi-tree frontier selection, foveation, and chunked random access are likely to influence future systems, including standard payload extensions and WebGPU-compute runtimes.

**Open questions:** the public `.rad` specification remains thin; the final Khronos name for the companion SPZ extension is still changing; and neither ecosystem has a public, strictly apples-to-apples benchmark suite using the same scene, SH degree, sorting mode, and device budget. The most defensible conclusion is architectural rather than benchmark-driven:

**Cesium optimizes standardized geospatial streaming; Spark optimizes renderer-controlled splat virtualization.**
