---
title: "利用云服务器部署爬虫"
description: "开发了一个简单的爬虫，对方没有任何反爬手段，直接多线程循环遍历即可。"
pubDate: "2020-04-27T15:59:50.000Z"
updatedDate: "2025-02-18T14:33:48.000Z"
published: true
disableComments: true
disableLikes: true
tags: ["工具"]
---
<p class="wp-block-paragraph">开发了一个简单的爬虫，对方没有任何反爬手段，直接多线程循环遍历即可。</p>

<!--more-->

<p class="wp-block-paragraph">问题在于，对方数量略多，大约10000条，而且每条数据包含很多图片，在国内的网络下访问速度很慢。</p>

<p class="wp-block-paragraph">更不用说爬虫运行完后要上传到Google Drive中。</p>

<p class="wp-block-paragraph">通过实测：10000条记录在我自己的笔记本上大约要20个小时才能执行完，再花5个小时上传。太耗时间了。</p>

<p class="wp-block-paragraph">虽然最终任务完成了，但是每次都这么折腾肯定是不行的。于是想到了用云服务器来完成。</p>

<p class="wp-block-paragraph">先说结论：在Google Cloud Platform中创建了一个24核的机器。大约4小时不到完成爬虫任务。之后再花10分钟完成上传。当然安装命令行版的Google Drive花了额外的一点点时间。</p>

<p class="wp-block-paragraph">过程：</p>

<p class="wp-block-paragraph">爬虫的瓶颈应该在于网络吞吐。机器核心数只是提高了并发的线程数。但是究竟要开多台小机器，还是开一台大机器，其中的成本又该如何计算，这确实是个问题。</p>

<p class="wp-block-paragraph">所以对于之后的爬虫任务，就有几个问题要考虑：</p>

<p class="wp-block-paragraph">任务是否要分发到多台机器上？考虑的条件有：</p>

<ul class="wp-block-list">
<li>成本</li>

<li>复杂度</li>

<li>最终输出的结果的打包问题（我还没试过在多个磁盘间转移数据，所以默认打包只能在各个磁盘内各自进行）</li>
</ul>

<p class="wp-block-paragraph">下次开发这样的脚本的备注：</p>

<ul class="wp-block-list">
<li>脚本务必要考虑好出错的情况，尤其是文件编码方面，其次是网络访问出错，不过在服务器上这样的情况应该不多见。</li>

<li>事先估算好最终数据打包的情况，进而进行拆分到多个机器中运行。</li>

<li>做好python脚本中的log功能，最好能输出到Google的日志控制台中。</li>

<li>脚本结束即自动销毁机器。不过实际上最终上传数据还是需要一台机器的。</li>
</ul>
