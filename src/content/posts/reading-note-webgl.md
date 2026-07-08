---
title: "学习笔记——WebGL"
description: "主要基于《WebGL 理论基础》文档的学习笔记。"
pubDatetime: 2021-02-25T04:24:00.000Z
modDatetime: 2025-02-04T14:05:04.000Z
author: "Zhang"
tags:
  - "WebGL"
  - "笔记"
canonicalURL: "https://littlepotato.me/2021/02/25/reading-note-webgl/"
---

<h2 class="wp-block-heading">书目</h2>

<ul class="wp-block-list">
<li><a href="https://webglfundamentals.org/webgl/lessons/zh_cn/" data-type="URL" data-id="https://webglfundamentals.org/webgl/lessons/zh_cn/" target="_blank" rel="noreferrer noopener">《WebGL 理论基础》</a></li>

<li><a href="https://book.douban.com/subject/25909351/" target="_blank" data-type="URL" data-id="https://book.douban.com/subject/25909351/" rel="noreferrer noopener">《WebGL 编程指南》</a></li>

<li><a href="http://www.yanhuangxueyuan.com/WebGL/" data-type="URL" data-id="http://www.yanhuangxueyuan.com/WebGL/" target="_blank" rel="noreferrer noopener">《WebGL 零基础入门教程》</a></li>
</ul>

<!--more-->

<h2 class="wp-block-heading">大纲</h2>

<ul class="wp-block-list">
<li><strong>概述</strong>
<ul class="wp-block-list">
<li>发展历史</li>
</ul>
</li>

<li><strong>基础概念</strong>
<ul class="wp-block-list">
<li>一个光栅化引擎，它可以根据你的代码绘制出点，线和三角形。</li>

<li>需要提供成对的方法，每对方法中一个叫顶点着色器， 另一个叫片断着色器。</li>

<li>着色器获取数据的4种方法</li>

<li>图元（primitives）</li>

<li>深度缓冲（Depth buffer 或者 Z-Buffer）</li>

<li>模板（stencil）</li>

<li>片段着色器精度</li>
</ul>
</li>

<li><strong>渲染管道(PipeLine)</strong>
<ul class="wp-block-list">
<li>顶点着色器（vertex shader）</li>

<li>图元组装（Primitives generation）</li>

<li>光栅化（rasterization）</li>

<li>片段着色器（fragment shader）</li>

<li>逐像素处理（per-fragment operations）</li>

<li>帧缓存（framebuffer）</li>
</ul>
</li>

<li><strong>二维运算</strong>
<ul class="wp-block-list">
<li>二维平移</li>

<li>二维旋转</li>

<li>二维缩放</li>

<li>二维投影</li>

<li>二维矩阵</li>
</ul>
</li>

<li><strong>三维投影</strong>
<ul class="wp-block-list">
<li>三维正射投影（orthographic）</li>

<li>三维透视投影（perspective）</li>

<li>三维相机</li>
</ul>
</li>

<li><strong>模型、视图、投影矩阵（MVP）</strong>
<ul class="wp-block-list">
<li>坐标系</li>

<li>本地坐标系(local coordinate system)</li>

<li>世界坐标系(world coordinate system)</li>

<li>观察坐标系(view coordinate system)</li>

<li>剪裁坐标系(clipping coordinate system)</li>
</ul>
</li>

<li><strong>光照</strong>
<ul class="wp-block-list">
<li>三维方向光源</li>

<li>三维点光源</li>

<li>三维聚光灯</li>

<li>阴影</li>
</ul>
</li>

<li><strong>几何</strong>
<ul class="wp-block-list">
<li>三维几何加工</li>

<li>obj 文件加载</li>

<li>加载带 Mtl 的 Obj</li>
</ul>
</li>

<li><strong>图像处理</strong>
<ul class="wp-block-list">
<li>绘制图片需要使用纹理，渲染纹理时需要纹理坐标，而不是像素坐标。纹理坐标范围始终是 0.0 到 1.0 。</li>

<li>将图像上传到 gl 的纹理</li>

<li>在纹理上寻找对应颜色值</li>

<li>图像颜色通道修改</li>

<li>每个像素的值设置为与左右像素的均值</li>

<li>施加多种效果</li>
</ul>
</li>

<li><strong>纹理</strong>
<ul class="wp-block-list">
<li>三维纹理</li>

<li>数据纹理</li>

<li>渲染到纹理</li>

<li>跨域图像</li>

<li>纹理映射的透视纠正</li>

<li>平面的和透视的投影映射</li>
</ul>
</li>

<li><strong>文字</strong>
<ul class="wp-block-list">
<li>HTML</li>

<li>二维Canvas</li>

<li>使用纹理</li>

<li>字形纹理</li>
</ul>
</li>

<li><strong>三维环境</strong>
<ul class="wp-block-list">
<li>立方体贴图</li>

<li>环境贴图</li>

<li>天空盒</li>

<li>蒙皮</li>

<li>雾</li>

<li>场景图</li>

<li>鼠标拾取</li>
</ul>
</li>

<li><strong>Canvas</strong>
<ul class="wp-block-list">
<li>clientWidth 和 clientHeight，返回的是画布在浏览器中实际显示的大小。</li>

<li>尺寸</li>

<li>Retina 或 HD-DPI</li>
</ul>
</li>

<li><strong>动画</strong>
<ul class="wp-block-list">
<li>requestAnimationFrame</li>
</ul>
</li>

<li><strong>其他</strong>
<ul class="wp-block-list">
<li>实例化绘制</li>

<li>多视角渲染</li>

<li>多画布渲染</li>

<li>透明渲染</li>
</ul>
</li>

<li><strong>代码规范</strong>
<ul class="wp-block-list">
<li>应用基本结构</li>

<li>命名约定</li>

<li>GLSL 中的 undefined</li>
</ul>
</li>

<li><strong>实用工具</strong>
<ul class="wp-block-list">
<li>开发调试</li>

<li>状态调试工具（WebGL State Diagram）</li>

<li>WebGL 引用表</li>
</ul>
</li>

<li><strong>测试</strong>
<ul class="wp-block-list">
<li>功能测试</li>

<li>性能测试</li>
</ul>
</li>

<li><strong>相关框架</strong>
<ul class="wp-block-list">
<li>WebGL封装</li>

<li>渲染引擎</li>

<li>游戏引擎</li>
</ul>
</li>

<li><strong>WebGL2</strong>
<ul class="wp-block-list">
<li>顶点数组对象始终可用</li>

<li>着色器中可以获取纹理大小</li>

<li>直接选取纹素</li>

<li>更多纹理格式</li>

<li>3D 纹理</li>

<li>纹理数组</li>

<li>非2的幂纹理支持</li>

<li>移除着色器循环限制</li>

<li>GLSL中的矩阵函数</li>

<li>常见的压缩纹理</li>

<li>Uniform 缓冲对象</li>

<li>深度纹理</li>
</ul>
</li>
</ul>

<hr class="wp-block-separator has-alpha-channel-opacity is-style-wide"/>

<p class="wp-block-paragraph">下方为 xmind 脑图的线上分享，如果没加载出来需要等一会会。</p>

<p><iframe loading="lazy" src="https://www.xmind.app/embed/WH5mtN/" width="100%" height="600px" frameborder="0" scrolling="no" allowfullscreen="true"></iframe></p>
