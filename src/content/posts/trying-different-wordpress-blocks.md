---
title: "WordPress 的不同的组件尝试"
description: "尝试使用不同类型的block，提升记录的丰富度。"
pubDatetime: 2017-08-17T14:19:43.000Z
modDatetime: 2023-01-03T09:58:30.000Z
draft: false
tags: ["block","highlight","mapbox","WordPress","控件","工具"]
---

通过 **ShortCode**， 使用 Javascript 直接插入一个 Mapbox 地图。 ~~不过目前代码不能智能排版。~~（可以把编辑器切换为 **Code Editor** 来解决这个问题）

<script src="https://api.tiles.mapbox.com/mapbox-gl-js/v1.1.0/mapbox-gl.js"></script>
<link href="https://api.tiles.mapbox.com/mapbox-gl-js/v1.1.0/mapbox-gl.css" rel="stylesheet">
<style>
    #map { 
		width:100%;
		height:300px;
		margin: auto; 
	}
</style>

<script>
	mapboxgl.accessToken = 'pk.eyJ1IjoiYnJhbnpoYW5nIiwiYSI6ImNqM3FycmVldjAxZTUzM2xqMmllNnBjMHkifQ.Wv3ekbtia0BuUHGWVUGoFg';
	var map = new mapboxgl.Map({
		container: 'map', // container id
		style: 'mapbox://styles/mapbox/streets-v11', // stylesheet location
		center: [121.416554, 31.218091], // starting position [lng, lat]
		zoom: 13 // starting zoom
	});
</script>

通过 **Enlighter Sourcecode**（第三方），插入代码并高亮显示。

```python
# Definition for a binary tree node.
class TreeNode:
    def __init__(self, x):
        self.val = x
        self.left = None
        self.right = None

class Solution:
    def maxAncestorDiff(self, root):
        self.ans = 0
        
        def helper(node, min_num, max_num):
            if not node:
                return
            self.ans = max(self.ans, abs(min_num - node.val), abs(max_num - node.val))
            helper(root.left, min(node.val, min_num), max(node.val, max_num))
            helper(root.right, min(node.val, min_num), max(node.val, max_num))
        
        helper(root, root.val, root.val)
        
        return self.ans
```

嵌套一个**MindMap**，注意，需要使用国际版的账户登陆，才有在线分享功能。

<iframe loading="lazy" src="https://www.xmind.net/embed/CBeAjL/" width="100%" height="600px" frameborder="0" scrolling="no" allowfullscreen="true"></iframe>

嵌套一个流程图，来自[https://www.lucidchart.com](https://www.lucidchart.com/)

<iframe allowfullscreen="" frameborder="0" style="width:100%; height:600px" src="https://www.lucidchart.com/documents/embeddedchart/284f13e7-1c5c-44da-a19f-7980c666b93b" id="qnHJcgarumoJ"></iframe>

嵌套一个GitHub的代码片段，貌似可以替代前面的代码高亮插件？

<script src="https://gist.github.com/BranZhang/c236e3acbef9e5b6ee4b41bf383f1df5.js"></script>
