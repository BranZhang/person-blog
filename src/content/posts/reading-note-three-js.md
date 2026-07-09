---
title: "学习笔记——Three.JS"
description: "Three.JS相关的学习笔记。"
pubDatetime: 2020-12-13T05:51:00.000Z
modDatetime: 2025-02-18T12:34:55.000Z
draft: false
tags: ["JavaScript","Three.JS","WebGL","笔记"]
---
<h2 class="wp-block-heading">书目</h2>

<ul class="wp-block-list">
<li><a href="http://www.yanhuangxueyuan.com/Three.js/" data-type="URL" data-id="http://www.yanhuangxueyuan.com/Three.js/" target="_blank" rel="noreferrer noopener">《Three.js零基础入门教程》</a></li>

<li><a href="https://book.douban.com/subject/34451906/" data-type="URL" data-id="https://book.douban.com/subject/34451906/" target="_blank" rel="noreferrer noopener">《Three.js开发指南》</a></li>

<li><a href="https://threejs.org/docs/index.html#manual/en/introduction/Creating-a-scene" data-type="URL" data-id="https://threejs.org/docs/index.html#manual/en/introduction/Creating-a-scene" target="_blank" rel="noreferrer noopener">Three.js document</a></li>
</ul>

<!--more-->

<h2 class="wp-block-heading">大纲</h2>

<ul class="wp-block-list">
<li><strong>程序结构</strong>
<ul class="wp-block-list">
<li>场景（Scene）</li>

<li>相机（Camera）</li>

<li>渲染器（Renderer）</li>

<li>辅助对象</li>
</ul>
</li>

<li><strong>几何体（Geometry）</strong>
<ul class="wp-block-list">
<li>基类Geometry</li>

<li>BufferGeometry</li>

<li>分类</li>

<li>自定义几何体</li>

<li>构造实体几何体（ConstructiveSolidGeometry）</li>

<li>几何体合并</li>

<li>顶点</li>
</ul>
</li>

<li><strong>材质（Material）</strong>
<ul class="wp-block-list">
<li>基础属性</li>

<li>融合属性</li>

<li>分类</li>

<li>联合材质</li>

<li>材质索引materialIndex</li>
</ul>
</li>

<li><strong>模型</strong>
<ul class="wp-block-list">
<li>分类</li>

<li>模型基类</li>
</ul>
</li>

<li><strong>精灵模型</strong>
<ul class="wp-block-list">
<li>创建精灵模型对象不需要创建几何体对象Geometry，精灵模型对象本质上你可以理解为已经内部封装了一个平面矩形几何体PlaneGeometry。</li>

<li>粒子（Points）和精灵（Sprites）的效果是一样的。精灵多会有性能问题，但是能够单个控制。</li>

<li>可以基于一个复杂的几何体的顶点创建 Points 对象。</li>
</ul>
</li>

<li><strong>组对象</strong>
<ul class="wp-block-list">
<li>通过Threejs的组对象Group可以组织各个模型，构成一个层级结构。</li>

<li>Group</li>
</ul>
</li>

<li><strong>后处理</strong>
<ul class="wp-block-list">
<li>代码实现</li>

<li>后期处理通道</li>

<li>遮罩（mask）：可以在特定的区域使用通道</li>

<li>THREE.ShaderPass：自定义效果</li>
</ul>
</li>

<li><strong>工具</strong>
<ul class="wp-block-list">
<li>控件</li>

<li>Helper</li>
</ul>
</li>

<li><strong>插件</strong>
<ul class="wp-block-list">
<li>物理效果</li>
</ul>
</li>

<li><strong>拾取</strong>
<ul class="wp-block-list">
<li>CPU 拾取</li>

<li>GPU 拾取</li>
</ul>
</li>

<li><strong>加载外部模型</strong>
<ul class="wp-block-list">
<li>加载器</li>
</ul>
</li>

<li><strong>动画</strong>
<ul class="wp-block-list">
<li>基类（Camera）</li>

<li>分类</li>

<li>方法</li>

<li>自适应渲染</li>
</ul>
</li>

<li><strong>光源</strong>
<ul class="wp-block-list">
<li>基类Light</li>

<li>分类</li>

<li>阴<strong>场景</strong>影</li>
</ul>
</li>

<li><strong>纹理贴图</strong>
<ul class="wp-block-list">
<li>分类</li>

<li>创建纹理贴图</li>

<li>Texture对象</li>
</ul>
</li>

<li><strong>场景</strong>
<ul class="wp-block-list">
<li>属性</li>
</ul>
</li>
</ul>

<hr class="wp-block-separator has-alpha-channel-opacity is-style-wide"/>

<p class="wp-block-paragraph">下方为 xmind 脑图的线上分享，如果没加载出来需要等一会会。</p>

<iframe src='https://www.xmind.app/embed/E52ap7/' width='900' height='600' frameborder='0' scrolling='no' allowfullscreen="true"></iframe>
