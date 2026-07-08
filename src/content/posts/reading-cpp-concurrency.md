---
title: "学习笔记——C++并发编程"
description: "书目 大纲 下方为 xmind 脑图的线上分享，如果没加载出来需要等一会会。"
pubDatetime: 2021-09-25T15:40:00.000Z
modDatetime: 2025-03-19T15:44:12.000Z
author: "Zhang"
tags:
  - "C++"
  - "笔记"
canonicalURL: "https://littlepotato.me/2021/09/25/reading-cpp-concurrency/"
---

<h2 class="wp-block-heading">书目</h2>

<ul class="wp-block-list">
<li><a href="https://book.douban.com/subject/35653912/" target="_blank" rel="noopener">C++并发编程实战 (第2版)</a></li>
</ul>

<h2 class="wp-block-heading">大纲</h2>

<ul class="wp-block-list">
<li><strong>基础</strong>
<ul class="wp-block-list">
<li>并发的方式</li>

<li>并发与并行</li>

<li>C++多线程</li>
</ul>
</li>

<li><strong>线程管控</strong>
<ul class="wp-block-list">
<li>基本管控</li>

<li>向线程函数传参</li>

<li>移交线程归属权</li>

<li>在运行时选择线程数量</li>

<li>识别线程</li>
</ul>
</li>

<li><strong>线程间共享数据</strong>
<ul class="wp-block-list">
<li>条件竞争</li>

<li>防止恶性条件竞争</li>

<li>其他场景下保护共享数据</li>
</ul>
</li>

<li><strong>并发操作同步</strong>
<ul class="wp-block-list">
<li>线程间同步操作工具</li>

<li>等待事件发生</li>

<li>使用future 等待一次性事件</li>

<li>等待时间期限</li>

<li>运用同步操作简化代码</li>
</ul>
</li>

<li>内存模型和原子操作
<ul class="wp-block-list">
<li>内存模型</li>

<li>原子类型</li>

<li>原子操作</li>

<li>借助原子操作实现同步机制</li>
</ul>
</li>

<li><strong>测试和调试</strong>
<ul class="wp-block-list">
<li>与并发相关的错误类型</li>

<li>错误定位</li>
</ul>
</li>

<li><strong>并行算法</strong>
<ul class="wp-block-list">
<li>并行化的标准库算法函数</li>

<li>执行策略</li>
</ul>
</li>

<li><strong>线程管理</strong>
<ul class="wp-block-list">
<li>线程池</li>

<li>中断线程</li>
</ul>
</li>

<li><strong>多线程代码设计</strong>
<ul class="wp-block-list">
<li>在线程间切分任务</li>

<li>影响并发性能的因素</li>

<li>其他因素</li>
</ul>
</li>

<li><strong>无锁的数据结构</strong></li>

<li><strong>基于锁的并发数据结构</strong></li>
</ul>

<hr class="wp-block-separator has-alpha-channel-opacity is-style-wide"/>

<p class="wp-block-paragraph">下方为 xmind 脑图的线上分享，如果没加载出来需要等一会会。</p>

<p><iframe src='https://www.xmind.app/embed/2SruSG/' width='900' height='600' frameborder='0' scrolling='no' allowfullscreen="true"></iframe></p>
