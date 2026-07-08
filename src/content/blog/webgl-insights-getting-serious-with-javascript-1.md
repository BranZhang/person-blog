---
title: "WebGL Insights — Getting Serious with JavaScript（上）"
description: "WebGL相关的书籍并不多，《WebGL Insights》算是一本，其中各个章节都是由行业内资深的开发者们编写的。书中第四章的作者，Matthew Amato 和 Kevin R&hellip;"
pubDate: "2020-07-25T14:04:00.000Z"
updatedDate: "2025-02-18T14:35:18.000Z"
published: true
disableComments: true
disableLikes: true
tags: ["Cesium","gis","JavaScript","WebGL","地图"]
---
<p class="wp-block-paragraph">WebGL相关的书籍并不多，《WebGL Insights》算是一本，其中各个章节都是由行业内资深的开发者们编写的。书中第四章的作者，Matthew Amato 和 Kevin Ring，正好是 Cesium 的联合创始人及资深开发工程师，所以就想着将本章翻译一下，加深一下理解。</p>

<!--more-->

<h2 class="wp-block-heading">4.1 介绍</h2>

<p class="wp-block-paragraph">正如我们将在第七章“Teaching an Introductory Computer Graphics Course with WebGL”中看到的，JavaScript 和 WebGL 的特性使其成为计算机图形学的一个极好的学习平台。其他人也认为，工具链的普遍可访问性和质量使它在图形研究中也具有很大的优势。在本章中，我们将讨论我们认为 JavaScript 和 WebGL 最重要的用途：编写和维护实际的基于浏览器的应用程序和库。</p>

<p class="wp-block-paragraph">我们对 JavaScript 和 WebGL 的知识主要来自于我们创建和维护 Cesium 的经验——一个开源的基于 WebGL 的 3D 地球仪和 2D 地图引擎（如图4.1所示）。在 Cesium 之前，我们是传统的桌面软件开发人员，使用 C++、C# 和 Java 进行开发。像许多人一样，WebGL 的出现意外地将我们吸引到了 Web 开发的世界中。</p>

<div class="wp-block-image">
<figure class="aligncenter size-large"><img loading="lazy" decoding="async" width="1024" height="640" src="/wp-content/uploads/2025/02/WebGL.Insights.-.Patrick.Cozzi-Image70-1024x640.jpg" alt="" class="wp-image-12056" srcset="/wp-content/uploads/2025/02/WebGL.Insights.-.Patrick.Cozzi-Image70-1024x640.jpg 1024w, /wp-content/uploads/2025/02/WebGL.Insights.-.Patrick.Cozzi-Image70-300x188.jpg 300w, /wp-content/uploads/2025/02/WebGL.Insights.-.Patrick.Cozzi-Image70-768x480.jpg 768w, /wp-content/uploads/2025/02/WebGL.Insights.-.Patrick.Cozzi-Image70-1536x960.jpg 1536w, /wp-content/uploads/2025/02/WebGL.Insights.-.Patrick.Cozzi-Image70.jpg 1920w" sizes="auto, (max-width: 1024px) 100vw, 1024px" /><figcaption class="wp-element-caption">图4.1 在Cesium中观看大峡谷的日落。</figcaption></figure>
</div>

<p class="wp-block-paragraph">自2012年发布以来，Cesium 的代码库已经增长到超过150,000行 JavaScript、HTML 和 GLSL 代码，得到了数十名开发者的贡献，并被部署到数百万终端用户中。虽然维护任何大型代码库都面临挑战，但维护一个基于 JavaScript 的大型代码库则更加困难。</p>

<p class="wp-block-paragraph">本章讨论了我们在这些挑战中的经验，以及我们解决或缓解这些问题的策略。我们希望为任何开发大型浏览器应用程序的人提供一个良好的起点，无论是使用 JavaScript，还是像 CoffeeScript 这样的紧密相关的语言。</p>

<p class="wp-block-paragraph">首先，缺乏内置的模块化系统意味着没有统一的方式来组织我们的代码。在较小的应用程序中使用的常见方法，在应用程序增长时会变得极其痛苦。我们在4.2节中讨论了模块化的解决方案。</p>

<p class="wp-block-paragraph">其次，JavaScript 的许多特性和灵活性使得它容易上手并使用，但也使得编写性能不佳的代码变得容易。不同的浏览器引擎针对不同的使用场景进行优化，因此，在这一个浏览器中高效的代码，在另一个浏览器中运行时可能并不高效。作为 WebGL 开发人员，这对我们来说尤其令人担忧，因为实时交互式图形应用通常是网络上任何应用程序中性能要求最高的。我们在4.3节中给出了一些编写高性能 JavaScript 代码的技巧和方法。</p>

<p class="wp-block-paragraph">最后，像 JavaScript 这样的动态类型语言使得自动化测试比以往任何时候都更加重要。由于 JavaScript 没有编译步骤，并且其符号引用在运行时动态解析，即使是基本的重构，在没有一个强大的测试套件的情况下也令人不安。一个良好的测试方法对于构建大型应用程序并使其随着时间的推移不断演进至关重要。我们在4.4节中讨论了测试大型 JavaScript 应用程序的策略，尤其是那些使用 WebGL 的应用程序。</p>

<h2 class="wp-block-heading">4.2 模块化</h2>

<blockquote class="wp-block-quote is-layout-flow wp-block-quote-is-layout-flow">
<p class="has-small-font-size wp-block-paragraph">“模块化”这一小节对于目前的前端开发者或者其他语言的开发者来说，已经不是难题了。</p>
</blockquote>

<p class="wp-block-paragraph">小型 JavaScript 应用程序通常以一个单一的 JavaScript 源文件开始，通过简单的 <code>&lt;script&gt;</code> 标签包含在 HTML 页面中。源文件定义了应用程序在全局作用域中需要的函数和类型。随着应用程序的发展，可能会添加另一个源文件，再添加一个，直到最终我们发现自己有成百上千个源文件和 <code>&lt;script&gt;</code> 标签。</p>

<p class="wp-block-paragraph">当然，大多数开发人员在应用程序文件达到数百个源文件之前就能意识到这种做法的问题。部分问题包括：</p>

<ul class="wp-block-list">
<li><strong>依赖顺序</strong>：源文件的<code>&lt;script&gt;</code>标签必须按正确的顺序包含在HTML页面中。如果一个文件在另一个文件加载之前使用了该文件定义的符号，那么第一个文件将看到未定义的引用并抛出异常。这在由多个HTML文件组成的应用程序中尤为痛苦，因为这个正确顺序的脚本标签列表必须在多个地方维护。</li>

<li><strong>全局作用域污染</strong>：所有函数和类型都被添加到全局作用域中，每个文件都去全局作用域查找其依赖。如果另一个库使用与我们应用代码相同的函数和类型名称，那么其中一个将失败。</li>

<li><strong>缺乏封装</strong>：没有明显的地方来存放我们函数和类型的私有细节，如内部辅助函数。</li>

<li><strong>性能差</strong>：加载大量独立的 JavaScript 文件很慢。在开发阶段，如果我们从本地 Web 服务器加载代码，这可能是可以接受的，但当客户端和 Web 服务器相距甚远时，性能就变得非常差。</li>
</ul>

<p class="wp-block-paragraph">有各种方法可以解决这些问题。例如，我们可以在部署之前创建一个构建步骤，将所有源文件连接在一起，来避免加载许多 JavaScript 文件时的性能差和顺序依赖问题。当然，这个构建步骤仍然需要确保按正确的顺序连接源文件！</p>

<p class="wp-block-paragraph">在 Cesium 的早期，我们决定通过使用异步模块定义（AMD）模式和 RequireJS 来解决所有这些问题。</p>

<h3 class="wp-block-heading">4.2.1 异步模块定义（AMD）</h3>

<p class="wp-block-paragraph">AMD 是一种组织 JavaScript 模块的方式，它具备以下特点：</p>

<ul class="wp-block-list">
<li>明确声明它们依赖于哪些其他模块</li>

<li>在所有依赖项加载完成之前不会被加载</li>

<li>不会修改全局作用域</li>
</ul>

<p class="wp-block-paragraph">一个模块是我们应用中的一个小功能单元，例如一个单独的函数或类。以下是 Cesium 中 Ray 模块的一个略微修改版示例。Ray（射线）由 3D 空间中的一个原点和方向组成，它可以计算沿着射线给定距离的点：</p>

<pre class="EnlighterJSRAW" data-enlighter-language="js" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">define([
    './Cartesian3'
], function (
    Cartesian3) {
    "use strict";
    var Ray = function (origin, direction) {
        this.origin = origin;
        this.direction = direction;
    };
    Ray.getPoint = function (ray, t) {
        var offset = Cartesian3.multiplyByScalar(ray.direction, t);
        return Cartesian3.add(ray.origin, offset);
    };
    return Ray;
});</pre>

<p class="wp-block-paragraph">在 AMD 模式中，我们的代码被放置在一个函数内，这个函数作为参数传递给 <code>define</code> 函数。这个“模块”函数为我们提供了一个存储实现细节的地方（如果需要的话）。JavaScript 的函数级作用域保证了，除非我们明确允许它逃逸，否则在这个函数内部定义的任何内容都不会在外部可见。</p>

<p class="wp-block-paragraph">我们的模块完全不涉及全局作用域。Ray 模块不会从全局作用域中获取依赖项（如<code>Cartesian3</code>），而是期望这些依赖项作为参数传递给模块函数。传递给 <code>define</code> 的第一个参数是一个数组，用来指定该模块所依赖的模块（在这个例子中是 <code>Cartesian3</code>），并将这些模块作为参数传递给模块函数。类似地，我们的模块导出“<code>Ray</code> 构造函数”从不直接赋值到全局作用域中，而是仅仅返回给调用者。</p>

<p class="wp-block-paragraph">那么，谁是调用者呢？答案是 AMD 模块加载器。</p>

<p class="wp-block-paragraph"><code>define</code> 函数将一个模块与其依赖项进行注册。每个依赖项本身就是一个模块，通常包含在一个单独的 JavaScript 源文件中，文件名与模块名相同。稍后，当所有依赖项都加载完成后，模块函数被调用。模块函数返回模块给加载器，加载器接着可以加载任何依赖该模块的其他模块。由于加载器知道所有模块及其依赖关系，它可以确保模块按正确的顺序加载，并且只加载完成特定任务所需要的模块。</p>

<p class="wp-block-paragraph">这就是“异步”模块定义的来源：模块不会在包含它们的 JavaScript 文件执行时立即创建。相反，模块是在其依赖项加载后异步创建的。</p>

<p class="wp-block-paragraph">使用 AMD，编写一个使用模块的网页非常简单，并且不需要构建步骤。通常，HTML 只需要使用 <code>RequireJS</code> 的 <code>data-main</code> 属性来引用主脚本：</p>

<pre class="EnlighterJSRAW" data-enlighter-language="html" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">&lt;script data-main="scripts/main" src="scripts/require.js">&lt;/script>
</pre>

<p class="wp-block-paragraph"><code>scripts/main.js</code> 本身就是一个AMD模块，它明确指定了自己的依赖项：</p>

<pre class="EnlighterJSRAW" data-enlighter-language="js" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">require(['a', 'b', 'c'], function (a, b, c) {
    a(b(), c());
});</pre>

<p class="wp-block-paragraph">当 RequireJS 看到 <code>data-main</code> 属性时，它会尝试加载指定的模块。加载该模块需要首先加载它的所有依赖项 a、b 和 c。尝试加载这些模块将导致它们的依赖项也会被加载。这个过程会递归进行。一旦 a、b、c 及其所有依赖项被加载完成，<code>main</code> 的模块函数就会被调用，应用程序便启动并运行。</p>

<p class="wp-block-paragraph">使用 AMD，我们可以快速进行迭代，因为不需要构建步骤；只需重新加载页面！无需在每个 HTML 页面中管理 <code>&lt;script&gt;</code> 标签的有序列表；我们只需指定入口点，RequireJS 会处理其余的工作。在开发过程中，我们也能轻松调试，因为浏览器看到的每个源文件就是我们编写的原始内容。在浏览器尚未很好地支持源映射之前，这一点尤其重要。</p>

<p class="wp-block-paragraph">那么部署怎么办呢？</p>

<p class="wp-block-paragraph">将所有单独的模块作为独立的 JavaScript 文件加载可能需要一些时间，尤其是在高延迟的网络连接下。幸运的是，<code>r.js</code> 优化器使得构建和压缩所有模块变得简单，它会创建一个包含应用程序所需所有代码的单一 JavaScript 源文件，而没有多余的代码。如果我们的应用程序使用了基于 AMD 构建的库，甚至可以将应用程序和这些库一起构建，确保只有我们实际使用的库的部分被包含在应用程序中。</p>

<p class="wp-block-paragraph">假设我们的应用程序有一个单一的脚本作为其 <code>data-main</code>，如前所示，我们可以通过在 <code>scripts</code> 目录下运行以下命令来构建一个合并并压缩过的版本：</p>

<pre class="EnlighterJSRAW" data-enlighter-language="bash" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">r.js -o name=main out=../build/main.js
</pre>

<p class="wp-block-paragraph">然后，我们只需将 <code>data-main</code> 属性更改为指向构建后的版本：</p>

<pre class="EnlighterJSRAW" data-enlighter-language="html" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">&lt;script data-main="build/main" src="scripts/require.js">&lt;/script>
</pre>

<p class="wp-block-paragraph">RequireJS 提供了大量选项，允许我们控制模块名称如何解析、指定第三方库的路径、使用不同的压缩器等等。RequireJS 还有一个丰富的加载器插件集合。其中，WebGL 应用程序中尤其有用的是 <code>text</code> 插件，它使得将 GLSL 文件加载为 JavaScript 字符串变得简单，便于将其传递给 WebGL API。所有详细信息可以在 RequireJS 官网找到。</p>

<h3 class="wp-block-heading">4.2.2 AMD的替代者</h3>

<p class="wp-block-paragraph">Cesium 团队在使用 AMD 方面取得了巨大的成功，并发现 RequireJS 是一个强大且灵活的工具。我们毫不犹豫地推荐在任何严肃的应用程序中使用它。然而，AMD 也有一些合理的批评意见，很多批评归结为对其基本设计目标的不满：创建一种能够在 Web 浏览器中加载的模块格式，且无需构建步骤和预处理。</p>

<p class="wp-block-paragraph">为此，AMD 采用了一种定义依赖项的语法，这种语法被许多人认为是丑陋和繁琐的。特别是，它要求我们在每个模块定义的顶部维护两个并行的列表，并保持它们完全同步：一个是所需模块的列表，另一个是模块创建函数的参数列表。如果我们不小心让这两个列表不同步，例如删除了一个列表中的依赖项但忘记在另一个列表中删除，那么我们名为 Cartesian3 的参数可能实际上是我们的 Matrix4 模块，这肯定会导致我们在使用时出现意想不到的行为。</p>

<p class="wp-block-paragraph">如果我们接受构建步骤，或许因为我们的代码需要构建以应对其他需求，那么在定义易读易写的模块时，AMD 并不是唯一的选择。毕竟，今天的 Web 浏览器已经支持源映射（source maps），因此调试转换过的代码，甚至是合并和压缩过的代码，也能像调试我们实际编写的代码一样顺利。通过增量工作，构建过程通常足够快速，以至于它完成时，我们能及时切换回浏览器窗口并刷新。</p>

<p class="wp-block-paragraph">如果我们能够使用更简单的模块模式，并在此过程中使开发环境更接近生产环境，同时不牺牲可调试性或迭代时间，那么这是一个很大的胜利。考虑到这一点，让我们简要地回顾一下 AMD 的一些更有前景的替代方案。</p>

<h3 class="wp-block-heading">4.2.3 CommonJS</h3>

<p class="wp-block-paragraph">最受欢迎的直接替代 AMD 的模块格式是 CommonJS 模块格式。CommonJS 模块并没有显式地包装在一个函数内。模块私有作用域是在每个源文件中隐含的，而不是像 AMD 那样显式地以函数形式表达。它们还使用了一种语法来表达依赖关系，这种语法更加简洁且更不容易出错：</p>

<pre class="EnlighterJSRAW" data-enlighter-language="js" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">var Cartesian3 = require('./Cartesian3');
var defaultValue = require('./defaultValue');</pre>

<p class="wp-block-paragraph">CommonJS 是用于服务器端 Node.js 模块的模块格式。在 Node.js 中，每次调用 <code>require</code> 时会从本地磁盘加载文件，因此可以合理地让其在文件加载并创建模块之前不会返回。然而，在浏览器中，由于高延迟的原因，同步的 <code>require</code> 调用会变得非常慢。</p>

<p class="wp-block-paragraph">因此，要在浏览器中使用 CommonJS 模块，我们必须将这些模块转换成适合浏览器的格式。一种方法是在加载到浏览器之前将它们转换为 AMD 模块。我们之前用于创建压缩构建的 <code>r.js</code> 工具，也可以用来转换 CommonJS 模块。</p>

<p class="wp-block-paragraph">另一个越来越受到关注的工具，尤其是在 Node.js 开发者中，是 Browserify。Browserify 可以将 Node.js 风格的 CommonJS 模块合并成一个单独的、适合浏览器使用的 JavaScript 源文件，并且可以通过简单的 <code>&lt;script&gt;</code> 标签加载。使用 Browserify，甚至可以使用 AMD 模块。例如，在我们构建澳大利亚国家地图时，我们通过使用 <code>deamdify</code> 插件将 Cesium 的 AMD 模块拉入了我们的 Browserify 构建中。</p>

<p class="wp-block-paragraph">Browserify 的一个优点是它与 Node.js 生态系统兼容，甚至使我们能够使用 npm 进行浏览器中的包管理。通过简单的 <code>npm install</code>，下载、安装和捆绑第三方库变得非常轻松，并且其他开发者也可以轻松完成相同的操作。</p>

<p class="wp-block-paragraph">对于严肃的应用程序开发，一个非常有趣的方法是将应用程序构建为大量单独开发和版本管理的 npm 包。每个包应该独立有用，并且托管在单独的 git 仓库中。npm 优雅地管理这些包之间的依赖关系。尽管将应用程序拆解成这些独立的包可能有些挑战，但最终的奖励是一个可以跨应用程序重用的包库。<code>stackgl</code> 项目就是这种方法的一个很好的例子（第 13 章）。</p>

<h3 class="wp-block-heading">4.2.3 TypeScript</h3>

<p class="wp-block-paragraph">构建一个严肃的模块化应用程序的另一种方法是使用一种完全不同的语言，该语言编译为 JavaScript。这个类别中两个较为知名的语言是 CoffeeScript 和 Dart。然而，我们最喜欢的语言是 TypeScript，主要因为它与 JavaScript 的兼容性。所有 JavaScript 代码都是自动有效的 TypeScript 代码，而 TypeScript 编译器的输出是符合惯用的 JavaScript，就像我们手写的代码一样。TypeScript 有很好的语法来定义和导出模块，并且可以配置生成的 JavaScript 模块使用 AMD 或 CommonJS 格式。从 TypeScript 1.x 开始，导入模块的语法如下：</p>

<pre class="EnlighterJSRAW" data-enlighter-language="typescript" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">import Cartesian3 = require('./Cartesian3');
import defaultValue = require('./defaultValue');</pre>

<p class="wp-block-paragraph">这种语法在 TypeScript 2.0 中可能会发生变化，因为 TypeScript 旨在紧跟即将发布的 ECMAScript 6 标准，后文将讨论此标准。</p>

<p class="wp-block-paragraph">除了良好的模块支持外，TypeScript 还支持可选的类型注解，编译器会强制执行这些注解。在 Cesium 中，所有公共 API 和大多数私有 API 的类型都有明确的文档说明，因为这样可以让代码更易读，API 更易理解。我们认为，拥有一个强制执行类型兼容性的编译器，对于改进文档以及消除某些类型的错误非常有帮助。</p>

<h3 class="wp-block-heading">4.2.5 ECMAScript 6</h3>

<p class="wp-block-paragraph">即将发布的 JavaScript 版本，称为 ECMAScript 6 或 ES6，将内置对模块的支持，并应在你阅读本文时成为官方标准。ES6 模块避免了 AMD 中的“同步列表”问题，但由于它们是语言的一部分，它们可以在 Web 浏览器中异步加载。ES6 依赖项的指定方式如下：</p>

<pre class="EnlighterJSRAW" data-enlighter-language="js" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">import Cartesian3 from 'Cartesian3';
import defaultValue from 'defaultValue';</pre>

<p class="wp-block-paragraph">即使你的应用程序面向的是旧版浏览器，你仍然可以通过使用将 ES6 转换为当前版本 JavaScript（即 ES5）的工具，今天就开始使用 ES6。</p>

<h3 class="wp-block-heading">4.2.6 其他选择</h3>

<p class="wp-block-paragraph">还有许多其他方法可以模块化 JavaScript 代码。Google Closure 编译器 支持模块化，并且是构建大型 JavaScript 应用程序的热门选择。我们甚至听说过有人使用 #include 和 C 预处理器作为简单的构建过程。在评估工具链以构建你的严肃应用程序时，务必考虑它如何与更大的 JavaScript 生态系统进行接口。如果一个模块系统使得很难利用第三方库、文档生成工具、测试框架、测试运行器等，即使它再美观，也会显得不那么吸引人。</p>

<p class="wp-block-paragraph"></p>
