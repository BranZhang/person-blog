---
title: "WebAssembly 学习笔记"
description: "WebAssembly（简称 WASM）是一种以安全有效的方式运行可移植程序的新兴 Web 技术，下面是引用 MDN 上对它的定义： WebAssembly 是一种新的编码方式，可&hellip;"
pubDate: "2023-12-09T07:30:00.000Z"
updatedDate: "2025-03-05T09:49:16.000Z"
published: true
tags: ["C++","JavaScript","WebAssembly"]
---
<p class="wp-block-paragraph"><a href="https://webassembly.org/" target="_blank" rel="noopener">WebAssembly</a>（简称 WASM）是一种以安全有效的方式运行可移植程序的新兴 Web 技术，下面是引用 <a href="https://developer.mozilla.org/zh-CN/docs/WebAssembly" target="_blank" rel="noopener">MDN 上对它的定义</a>：</p>

<blockquote class="wp-block-quote is-layout-flow wp-block-quote-is-layout-flow">
<p class="wp-block-paragraph">WebAssembly 是一种新的编码方式，可以在现代的网络浏览器中运行 － 它是一种低级的类汇编语言，具有紧凑的二进制格式，可以接近原生的性能运行，并为诸如 C/C++ 等语言提供一个编译目标，以便它们可以在 Web 上运行。它也被设计为可以与 JavaScript 共存，允许两者一起工作。</p>
</blockquote>

<!--more-->

<p class="wp-block-paragraph">也就是说，无论你使用的是哪一种语言，我们都可以将其转换为 WebAssembly 格式，并在浏览器中以原生的性能运行。WebAssembly 的开发团队来自 Mozilla、Google、Microsoft 和 Apple，分别代表着四大网络浏览器 Firefox、Chrome、Microsoft Edge 和 Safari，从 2017 年 11 月开始，这四大浏览器就开始实验性的支持 WebAssembly。当时 WebAssembly 还没有形成标准，这么多的浏览器开发商对某个尚未标准化的技术 <a href="https://lists.w3.org/Archives/Public/public-webassembly/2017Feb/0002.html" target="_blank" rel="noopener">达成如此一致的意见</a>，这在历史上是很罕见的，可以看出这绝对是一项值得关注的技术，被号称为 <code>the future of web development</code>。</p>

<div class="wp-block-image">
<figure class="aligncenter size-full is-resized"><img loading="lazy" decoding="async" width="768" height="259" src="/wp-content/uploads/2023/12/3915709301.png" alt="" class="wp-image-12267" style="width:717px;height:auto" srcset="/wp-content/uploads/2023/12/3915709301.png 768w, /wp-content/uploads/2023/12/3915709301-300x101.png 300w" sizes="auto, (max-width: 768px) 100vw, 768px" /></figure>
</div>

<p class="wp-block-paragraph">WebAssembly 在 2019 年 12 月 5 日被万维网联盟（W3C）推荐为标准，与 HTML，CSS 和 JavaScript 一起，成为 Web 的第四种语言。</p>

<h2 class="wp-block-heading">WebAssembly 之前的历史</h2>

<p class="wp-block-paragraph">JavaScript 诞生于 1995 年 5 月，一个让人津津乐道的故事是，当时刚加入网景的 <a href="https://zh.wikipedia.org/wiki/%E5%B8%83%E8%98%AD%E7%99%BB%C2%B7%E8%89%BE%E5%85%8B" target="_blank" rel="noopener">Brendan Eich</a> 仅仅花了十天时间就开发出了 JavaScript 语言。开发 JavaScript 的初衷是为 HTML 提供一种脚本语言使得网页变得更动态，当时根本就没有考虑什么浏览器兼容性、安全性、移植性这些东西，对性能也没有特别的要求。但随着 Web 技术的发展，网页要解决的问题已经远不止简单的文本信息，而是包括了更多的高性能图像处理和 3D 渲染等方面，这时，JavaScript 的性能问题就凸显出来了。于是，如何让 JavaScript 执行的更快，变成了各大浏览器生产商争相竞逐的目标。</p>

<h3 class="wp-block-heading">浏览器性能之战</h3>

<p class="wp-block-paragraph">这场关于浏览器的性能之战在 2008 年由 Google 带头打响，这一年的 9 月 2 日，Google 发布了一款跨时代的浏览器 Chrome，具备简洁的用户界面和极致的用户体验，内置的 <a href="https://v8.dev/" target="_blank" rel="noopener">V8</a> 引擎采用了全新的 JIT 编译（Just-in-time compilation，即时编译）技术，使得浏览器的响应速度得到了几倍的提升。次年，Apple 发布了他们的浏览器新版本 Safari 4，其中引入新的 Nitro 引擎（也被称为 SquirrelFish 或 <a href="https://trac.webkit.org/wiki/JavaScriptCore" target="_blank" rel="noopener">JavaScriptCore</a>），同样使用的是 JIT 技术。紧接着，Mozilla 在 Firefox 3.5 中引入 <a href="https://en.wikipedia.org/wiki/SpiderMonkey" target="_blank" rel="noopener">TraceMonkey</a> 技术，Microsoft 在 2011 年也推出 <a href="https://en.wikipedia.org/wiki/Chakra_(JScript_engine" target="_blank" rel="noopener">Chakra</a>) 引擎。</p>

<p class="wp-block-paragraph">使用 JIT 技术，极大的提高了 JavaScript 的性能。那么 JIT 是如何工作的呢？我们知道，JavaScript 是解释型语言，因此传统的 JavaScript 引擎需要逐行读取 JavaScript 代码，并将其翻译成可执行的机器码。很显然这是极其低效的，如果有一段代码需要执行上千次，那么 JavaScript 引擎也会傻傻的翻译上千次。JIT 技术的基本思路就是缓存，它将执行频次比较高的代码实时编译成机器码，并缓存起来，当下次执行到同样代码时直接使用相应的机器码替换掉，从而获得极大的性能提升。另外，对于执行频次非常高的代码，JIT 引擎还会使用优化编译器（Optimising Compiler）编译出更高效的机器码。关于 JIT 技术的原理可以参考 <a href="https://hacks.mozilla.org/2017/02/a-crash-course-in-just-in-time-jit-compilers/" target="_blank" rel="noopener">A crash course in just-in-time (JIT) compilers</a> 这篇文章。</p>

<p class="wp-block-paragraph">JIT 技术推出之后，JavaScript 的性能得到了飞速提升：</p>

<div class="wp-block-image">
<figure class="aligncenter size-full is-resized"><img loading="lazy" decoding="async" width="571" height="403" src="/wp-content/uploads/2023/12/2031471968.png" alt="" class="wp-image-12268" style="width:425px;height:auto" srcset="/wp-content/uploads/2023/12/2031471968.png 571w, /wp-content/uploads/2023/12/2031471968-300x212.png 300w" sizes="auto, (max-width: 571px) 100vw, 571px" /></figure>
</div>

<p class="wp-block-paragraph">随着性能的提升，JavaScript 的应用范围也得到了极大的扩展，Web 内容变得更加丰富，图片、视频、游戏，等等等等，甚至有人将 JavaScript 用于后端开发（Node.js）。不过 JIT 也不完全是 “性能银弹”，因为通过 JIT 优化也是有一定代价的，比如存储优化后的机器码需要更多的内存，另外 JIT 优化对变量类型非常敏感，但是由于 JavaScript <strong>动态类型</strong> 的特性，用户代码中对某个变量的类型并不会严格固定，这时 JIT 优化的效果将被大打折扣。比如下面这段简单的代码：</p>

<pre class="EnlighterJSRAW" data-enlighter-language="js" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">function arraySum(arr) {
  var sum = 0;
  for (var i = 0; i &lt; arr.length; i++) {
    sum += arr[i];
  }
}</pre>

<p class="wp-block-paragraph">假设 JIT 检测到 <code>sum += arr[i];</code> 这行代码被执行了很多次，开始对其进行编译优化，它首先需要确认 <code>sum</code>、<code>arr</code>、<code>i</code> 和 <code>arr[i]</code> 这些变量的类型，如果 <code>arr[i]</code> 是 <code>int</code> 类型，这就是整数相加的操作，但如果 <code>arr[i]</code> 是 <code>string</code> 类型，这又变成了字符串拼接的操作，这两种情况编译成的机器码是完全不同的。所以 JIT 引擎会先根据代码执行情况假设变量为某种类型，然后再进行优化，当执行时会对类型进行检测，一旦检测到类型不同时，这个 JIT 优化将被作废，这个过程叫做 <strong>去优化</strong>（deoptimization，或者 bailing out）。假如用户写出这样的代码：</p>

<pre class="EnlighterJSRAW" data-enlighter-language="js" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">arr = [1, "hello"];</pre>

<p class="wp-block-paragraph">JavaScript 这种动态类型的特点对 JIT 引擎是非常不友好的，反复的优化和去优化不仅无法提高性能，甚至会有副作用。所以在实际的生产环境中，JIT 的效果往往没有那么显著，通过 JIT 的优化很快就遇到了瓶颈。</p>

<p class="wp-block-paragraph">但是日益丰富的 Web 内容对 JavaScript 的性能提出了更高的要求，尤其是 3D 游戏，这些游戏在 PC 上跑都很吃力，更别说在浏览器里运行了。如何让 JavaScript 执行地更快，是摆在各大浏览器生产商面前的一大难题，很快，Google 和 Mozilla 交出了各自的答卷。</p>

<h3 class="wp-block-heading">Google 的 NaCl 解决方案</h3>

<p class="wp-block-paragraph">Google 在 2008 年开源了 <a href="https://developer.chrome.com/docs/native-client/nacl-and-pnacl/" target="_blank" rel="noopener">NaCl 技术</a>，并在 2011 年的 Chrome 14 中正式启用。NaCl 的全称为 Native Client，这是一种可以在浏览器中执行原生代码（native code）的技术，听起来很像是 Microsoft 当时所使用的 <a href="https://en.wikipedia.org/wiki/ActiveX" target="_blank" rel="noopener">ActiveX</a> 技术，不过 ActiveX 由于其安全性一直被人所诟病。而 NaCl 定义了一套原生代码的安全子集，执行于独立的沙盒环境之中，并通过一套被称为 PPAPI（Pepper Plugin API）的接口来和 JavaScript 交互，避免了可能的安全问题。NaCl 采取了和 JIT 截然不同的 AOT 编译（Ahead-of-time compilation，即提前编译）技术，所以在性能上的表现非常突出，几乎达到了和原生应用一样的性能。不过由于 NaCl 应用是 C/C++ 语言编写的，与 CPU 架构强关联，不具有可移植性，因此需要针对不同的平台进行开发以及编译，用户使用起来非常痛苦。</p>

<p class="wp-block-paragraph">为了解决这个问题，Google 在 2013 年又推出了 PNaCl 技术（Portable Native Client），PNaCl 的创新之处在于使用 <a href="https://llvm.org/docs/LangRef.html" target="_blank" rel="noopener">LLVM IR</a>（Intermediate Representation）来分发应用，而不是直接分发原生代码，LLVM IR 也被称为 Bitcode，它是一种平台无关的中间语言表示，实现了和 Java 一样的目标：一次编译，到处运行。</p>

<p class="wp-block-paragraph">如果我们站在今天的视角来看，PNaCl 这项技术是非常超前的，它的核心理念和如今的 WebAssembly 如出一辙，只不过它出现的时机不对，当时很多人都对在浏览器中执行原生代码持怀疑态度，担心可能出现和 ActiveX 一样的安全问题，而且当时 HTML5 技术正发展的如火如荼，人们都在想着如何从浏览器中移除诸如 Flash 或 Java Applet 这些 JavaScript 之外的技术，所以 PNaCl 技术从诞生以来，一直不温不火，尽管后来 Firefox 和 Opera 等浏览器也开始支持 NaCl 和 PPAPI，但是一直无法得到普及（当时的 IE 还占领着浏览器市场的半壁江山）。</p>

<p class="wp-block-paragraph">随着 WebAssembly 技术的发展，Google Chrome 最终在 2018 年移除了对 PNaCl 的支持，决定全面拥抱 WebAssembly 技术。</p>

<h3 class="wp-block-heading">Mozilla 的 asm.js 解决方案</h3>

<p class="wp-block-paragraph">2010 年，刚刚加入 Mozilla 的 <a href="https://github.com/kripken" target="_blank" rel="noopener">Alon Zakai</a> 在工作之余突发奇想，能不能将自己编写的 C/C++ 游戏引擎运行在浏览器上？当时 NaCl 技术还没怎么普及，Alon Zakai 一时之间并没有找到什么好的技术方案。好在 C/C++ 是强类型语言，JavaScript 是弱类型语言，所以将 C/C++ 代码转换为 JavaScript 在技术上是完全可行的。Alon Zakai 于是便开始着手编写这样的一个编译器，<a href="https://emscripten.org/" target="_blank" rel="noopener">Emscripten</a> 便由此诞生了！</p>

<p class="wp-block-paragraph">Emscripten 和传统的编译器很类似，都是将某种语言转换为另一种语言形式，不过他们之间有着本质的区别。传统的编译器是将一种语言编译成某种 low-level 的语言，比如将 C/C++ 代码编译成二进制文件（机器码），这种编译器被称为 <a href="https://en.wikipedia.org/wiki/Compiler" target="_blank" rel="noopener">Compiler</a>；而 Emscripten 是将 C/C++ 代码编译成和它 same-level 的 JavaScript 代码，这种编译器被称为 Transpiler 或者 <a href="https://en.wikipedia.org/wiki/Source-to-source_compiler" target="_blank" rel="noopener">Source to source compiler</a>。</p>

<p class="wp-block-paragraph">Emscripten 相比于 NaCl 来说兼容性更好，于是很快就得到了 Mozilla 的认可。之后 Alon Zakai 被邀请加入 Mozilla 的研究团队并全职负责 Emscripten 的开发，以及通过 Emscripten 编译生成的 JavaScript 代码的性能优化上。在 2013 年，Alon Zakai 联合 Luke Wagner，David Herman 一起发布了 <a href="http://asmjs.org/" target="_blank" rel="noopener">asm.js</a> 规范，同年，Mozilla 也发布了 Firefox 22，并内置了新一代的 OdinMonkey 引擎，它是第一个支持 asm.js 规范的 JavaScript 引擎。</p>

<p class="wp-block-paragraph">asm.js 的思想很简单，就是尽可能的在 JavaScript 中使用类型明确的参数，并通过 <code>TypedArray</code> 取消了垃圾回收机制，这样可以让 JIT 充分利用和优化，进而提高 JavaScript 的执行性能。比如下面这样一段 C 代码：</p>

<pre class="EnlighterJSRAW" data-enlighter-language="c" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">int f(int i) {
  return i + 1;
}</pre>

<p class="wp-block-paragraph">使用 Emscripten 编译生成的 JavaScript 代码如下：</p>

<pre class="EnlighterJSRAW" data-enlighter-language="js" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">function f(i) {
  i = i|0;
  return (i + 1)|0;
}</pre>

<p class="wp-block-paragraph">通过在变量和返回值后面加上 <code>|0</code> 这样的操作，我们明确了参数和返回值的数据类型，当 JIT 引擎检测到这样的代码时，便可以跳过语法分析和类型推断这些步骤，将代码直接转成机器语言。据称，使用 asm.js 能达到原生代码 50% 左右的速度，虽然没有 NaCl 亮眼，但是这相比于普通的 JavaScript 代码而言已经是极大的性能提升了。而且我们可以看出 asm.js 采取了和 NaCl 截然不同的思路，asm.js 其实和 JavaScript 没有区别，它只是 JavaScript 的一个子集而已，这样做不仅可以充分发挥出 JIT 的最大功效，而且能兼容所有的浏览器。</p>

<p class="wp-block-paragraph">但是 asm.js 也存在着不少的问题。首先由于它还是和 JavaScript一样是文本格式，因此加载和解析都会花费比较长的时间，这被称为慢启动问题；其次，asm.js 除了在变量后面加 <code>|0</code> 之外，还有很多类似这样的标注代码：</p>

<div class="wp-block-image">
<figure class="aligncenter size-full is-resized"><img loading="lazy" decoding="async" width="660" height="357" src="/wp-content/uploads/2023/12/3642329671.webp" alt="" class="wp-image-12269" style="width:584px;height:auto" srcset="/wp-content/uploads/2023/12/3642329671.webp 660w, /wp-content/uploads/2023/12/3642329671-300x162.webp 300w" sizes="auto, (max-width: 660px) 100vw, 660px" /></figure>
</div>

<p class="wp-block-paragraph">很显然，这让代码的可读性和可扩展性都变的很差；最后，仍然是性能问题，通过 asm.js 无论怎么优化最终生成的都还是 JavaScript 代码，性能自然远远比不上原生代码；因此这并不是一个非常理想的技术方案。</p>

<h3 class="wp-block-heading">其他解决方案</h3>

<p class="wp-block-paragraph">除了 NaCl 和 asm.js，实际上还有一些其他的解决方案，但最终的结果要么夭折，要么被迫转型。其中值得一提的是 Google 发明的 <a href="https://dart.dev/" target="_blank" rel="noopener">Dart</a> 语言，Dart 语言的野心很大，它最初的目的是要取代 JavaScript 成为 Web 的首选语言，为此 Google 还开发了一款新的浏览器 Dartium，内置 Dart 引擎可以执行 Dart 程序，而且对于不支持 Dart 程序的浏览器，它还提供了相应的工具将 Dart 转换为 JavaScript。这一套组合拳可谓是行云流水，可是结果如何可想而知，不仅很难得到用户的承认，而且也没得到其他浏览器的认可，最终 Google 在 2015 年取消了该计划。目前 Dart 语言转战移动开发领域，比如跨平台开发框架 Flutter 就是采用 Dart 开发的。</p>

<h3 class="wp-block-heading">WebAssembly = NaCl + asm.js</h3>

<p class="wp-block-paragraph">随着技术的发展，Mozilla 和 Google 的工程师出现了很多次的交流和合作，通过汲取 NaCl 和 asm.js 两者的优点，双方推出了一种全新的技术方案：</p>

<ul class="wp-block-list">
<li>和 NaCl/PNaCl 一样，基于二进制格式，从而能够被快速解析，达到原生代码的运行速度；</li>

<li>和 PNaCl 一样，依赖于通用的 LLVM IR，这样既具备可移植性，又便于其他语言快速接入；</li>

<li>和 asm.js 一样，使用 Emscripten 等工具链进行编译；另外，Emscripten 同时支持生成 asm.js 和二进制格式，当浏览器不兼容新的二进制格式时，asm.js 可以作为降级方案；</li>

<li>和 asm.js 一样，必须以非常自然的方式直接操作 Web API，而不用像 PNaCl 一样需要处理与 JavaScript 之间的通信；</li>
</ul>

<p class="wp-block-paragraph">这个技术方案在 2015 年正式命名为 WebAssembly，2017 年各大浏览器生产商纷纷宣布支持 WebAssembly，2019 年 WebAssembly 正式成为 W3C 标准，一场关于浏览器的性能革命已经悄然展开。</p>

<div class="wp-block-image">
<figure class="aligncenter size-full is-resized"><img loading="lazy" decoding="async" width="554" height="402" src="/wp-content/uploads/2023/12/2623224868.png" alt="" class="wp-image-12271" style="width:470px;height:auto" srcset="/wp-content/uploads/2023/12/2623224868.png 554w, /wp-content/uploads/2023/12/2623224868-300x218.png 300w" sizes="auto, (max-width: 554px) 100vw, 554px" /></figure>
</div>

<h2 class="wp-block-heading">WebAssembly 入门示例</h2>

<p class="wp-block-paragraph">从上面的学习中我们知道，WebAssembly 是一种通用的编码格式，并且已经有很多编程语言支持将源码编译成这种格式了，官方的 <a href="https://webassembly.org/getting-started/developers-guide/" target="_blank" rel="noopener">Getting Started</a> 有一个详细的列表。这一节我们就跟着官方的教程实践一下下面这三种语言：<a href="https://developer.mozilla.org/en-US/docs/WebAssembly/C_to_wasm" target="_blank" rel="noopener">C/C++</a>，<a href="https://developer.mozilla.org/en-US/docs/WebAssembly/Rust_to_wasm" target="_blank" rel="noopener">Rust</a>，<a href="https://github.com/golang/go/wiki/WebAssembly" target="_blank" rel="noopener">Go</a>。</p>

<h3 class="wp-block-heading">将 C/C++ 程序编译成 WebAssembly</h3>

<p class="wp-block-paragraph">首先我们参考 <a href="https://emscripten.org/docs/getting_started/downloads.html" target="_blank" rel="noopener">Emscripten 的官方文档</a> 上的步骤下载并安装 <a href="https://emscripten.org/" target="_blank" rel="noopener">Emscripten SDK</a>，安装完成后通过下面的命令检查环境是否正常：</p>

<pre class="EnlighterJSRAW" data-enlighter-language="generic" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">$ emcc --check
emcc (Emscripten gcc/clang-like replacement + linker emulating GNU ld) 3.1.24 (68a9f990429e0bcfb63b1cde68bad792554350a5)
shared:INFO: (Emscripten: Running sanity checks)</pre>

<p class="wp-block-paragraph">环境准备就绪后，我们就可以将 C/C++ 的代码编译为 WebAssembly 了。写一个简单的 Hello World 程序 <code>hello.c</code>：</p>

<pre class="EnlighterJSRAW" data-enlighter-language="c" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">#include &lt;stdio.h>
 
int main() {
    printf("Hello World\n");
    return 0;
}</pre>

<p class="wp-block-paragraph">然后使用 emcc 进行编译：</p>

<pre class="EnlighterJSRAW" data-enlighter-language="generic" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">$ emcc hello.c -o hello.html</pre>

<p class="wp-block-paragraph">上面这个命令会生成三个文件：</p>

<ul class="wp-block-list">
<li>hello.wasm &#8211; 这就是生成的 WebAssembly 二进制字节码文件</li>

<li>hello.js &#8211; 包含一段胶水代码（glue code）通过 JavaScript 来调用 WebAssembly 文件</li>

<li>hello.html &#8211; 方便开发调试，在页面上显示 WebAssembly 的调用结果</li>
</ul>

<p class="wp-block-paragraph">我们不能直接用浏览器打开 hello.html 文件，因为浏览器不支持 <code>file://</code> 形式的 XHR 请求，所以在 HTML 中无法加载 .wasm 等相关的文件，为了看到效果，我们需要一个 Web Server，比如 Nginx、Tomcat 等，不过这些安装和配置都比较麻烦，我们还有很多其他的方法快速启动一个 Web Server。</p>

<p class="wp-block-paragraph">比如通过 <code>npm</code> 启动一个本地 Web Server：</p>

<pre class="EnlighterJSRAW" data-enlighter-language="generic" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">$ npx serve .</pre>

<p class="wp-block-paragraph">或者使用 Python3 的 <code>http.server</code> 模块：</p>

<pre class="EnlighterJSRAW" data-enlighter-language="generic" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">$ python3 -m http.server</pre>

<p class="wp-block-paragraph">访问 hello.html 页面如下：</p>

<div class="wp-block-image">
<figure class="aligncenter size-large"><img loading="lazy" decoding="async" width="1024" height="435" src="/wp-content/uploads/2023/12/263141450-1024x435.png" alt="" class="wp-image-12272" srcset="/wp-content/uploads/2023/12/263141450-1024x435.png 1024w, /wp-content/uploads/2023/12/263141450-300x127.png 300w, /wp-content/uploads/2023/12/263141450-768x326.png 768w, /wp-content/uploads/2023/12/263141450-1536x652.png 1536w, /wp-content/uploads/2023/12/263141450-1300x552.png 1300w, /wp-content/uploads/2023/12/263141450.png 1920w" sizes="auto, (max-width: 1024px) 100vw, 1024px" /></figure>
</div>

<p class="wp-block-paragraph">可以看到我们在 C 语言中打印的 Hello World 成功输出到浏览器了。</p>

<p class="wp-block-paragraph">另外，我们也可以将 C 语言中的函数暴露出来给 JavaScript 调用。默认情况下，Emscripten 生成的代码只会调用 <code>main()</code> 函数，其他函数忽略。我们可以使用 <code>emscripten.h</code> 中的 <code>EMSCRIPTEN_KEEPALIVE</code> 来暴露函数，新建一个 <code>greet.c</code> 文件如下：</p>

<pre class="EnlighterJSRAW" data-enlighter-language="c" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">#include &lt;stdio.h>
#include &lt;emscripten/emscripten.h>
 
int main() {
    printf("Hello World\n");
    return 0;
}
 
#ifdef __cplusplus
#define EXTERN extern "C"
#else
#define EXTERN
#endif
 
EXTERN EMSCRIPTEN_KEEPALIVE void greet(char* name) {
    printf("Hello, %s!\n", name);
}</pre>

<p class="wp-block-paragraph">上面的代码定义了一个 <code>void greet(char* name)</code> 函数，为了让这个函数可以在 JavaScript 中调用，编译时还需要指定 <code>NO_EXIT_RUNTIME</code> 和 <code>EXPORTED_RUNTIME_METHODS</code> 参数，将 <code>ccall</code> 导出来：</p>

<pre class="EnlighterJSRAW" data-enlighter-language="generic" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">$ emcc -o greet.html greet.c -s NO_EXIT_RUNTIME=1 -s EXPORTED_RUNTIME_METHODS=ccall</pre>

<p class="wp-block-paragraph">greet.html 文件和上面的 hello.html 几乎是一样的，我们在该文件中加几行代码来测试我们的 <code>greet()</code> 函数，首先加一个按钮：</p>

<pre class="EnlighterJSRAW" data-enlighter-language="html" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">&lt;button id="mybutton">Click me!&lt;/button></pre>

<p class="wp-block-paragraph">然后为它添加点击事件，可以看到 JavaScript 就是通过上面导出的 <code>ccall</code> 来调用 <code>greet()</code> 函数的：</p>

<pre class="EnlighterJSRAW" data-enlighter-language="js" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">document.getElementById("mybutton").addEventListener("click", () => {
  const result = Module.ccall(
    "greet",         // name of C function
    null,            // return type
    ["string"],      // argument types
    ["WebAssembly"]  // arguments
  );
});</pre>

<blockquote class="wp-block-quote is-layout-flow wp-block-quote-is-layout-flow">
<p class="wp-block-paragraph">除了&nbsp;<code>ccall</code>，我们还可以使用&nbsp;<code>-s EXPORTED_RUNTIME_METHODS=ccall,cwrap</code>&nbsp;同时导出&nbsp;<code>ccall</code>&nbsp;和&nbsp;<code>cwrap</code>&nbsp;函数。<code>ccall</code>&nbsp;的作用是直接调用某个 C 函数，而&nbsp;<code>cwrap</code>&nbsp;是将 C 函数编译为一个 JavaScript 函数，并可以反复调用，这在正式项目中更实用。</p>
</blockquote>

<p class="wp-block-paragraph">点击这个按钮，可以在页面和控制台上都看到 <code>greet()</code> 函数打印的内容：</p>

<div class="wp-block-image">
<figure class="aligncenter size-large"><img loading="lazy" decoding="async" width="1024" height="443" src="/wp-content/uploads/2023/12/3461844847-1024x443.png" alt="" class="wp-image-12273" srcset="/wp-content/uploads/2023/12/3461844847-1024x443.png 1024w, /wp-content/uploads/2023/12/3461844847-300x130.png 300w, /wp-content/uploads/2023/12/3461844847-768x332.png 768w, /wp-content/uploads/2023/12/3461844847-1536x665.png 1536w, /wp-content/uploads/2023/12/3461844847-1300x563.png 1300w, /wp-content/uploads/2023/12/3461844847.png 1920w" sizes="auto, (max-width: 1024px) 100vw, 1024px" /></figure>
</div>

<h2 class="wp-block-heading">WebAssembly 文本格式</h2>

<p class="wp-block-paragraph">上面我们使用了三种不同的编程语言来体验 WebAssembly，学习了如何编译，以及如何在浏览器中使用 JavaScript 调用它。不过这里有一个问题，由于 wasm 文件是二进制格式，对我们来说是完全黑盒的，不像 JavaScript 是纯文本的，我们可以方便地通过浏览器自带的开发者工具对其进行调试，而 wasm 如果调用出问题，我们将很难排查。实际上，WebAssembly 在设计之初就已经考虑了这样的问题，所以它不仅具有 <a href="https://webassembly.github.io/spec/core/binary/index.html" target="_blank" rel="noopener">二进制格式</a>，而且还有一种类似于汇编语言的 <a href="https://webassembly.github.io/spec/core/text/index.html" target="_blank" rel="noopener">文本格式</a>，方便用户查看、编辑和调试。</p>

<p class="wp-block-paragraph">下面是 WebAssembly 文本格式的一个简单例子：</p>

<pre class="EnlighterJSRAW" data-enlighter-language="generic" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">(module
  (func $add (param $lhs i32) (param $rhs i32) (result i32)
    local.get $lhs
    local.get $rhs
    i32.add)
  (export "add" (func $add))
)</pre>

<p class="wp-block-paragraph">WebAssembly 代码中的基本单元是一个模块，每个模块通过一个大的 <a href="https://zh.wikipedia.org/wiki/S-%E8%A1%A8%E8%BE%BE%E5%BC%8F" target="_blank" rel="noopener">S-表达式</a> 来表示，S-表达式是一种嵌套结构，实际上它是树的一种表示形式。上面的代码首先通过 <code>(module)</code> 定义了一个模块，然后模块中使用 <code>(func $add (param $lhs i32) (param $rhs i32) (result i32))</code> 定义了一个 <code>add()</code> 函数，这个 S-表达式转换为比较好理解的形式就是 <code>i32 add(i32 lhs, i32 rhs)</code>，最后通过 <code>(export "add" (func $add))</code> 将该函数暴露出来，关于这段代码的详细解释可以参考 Mozilla 官方文档中的 <a href="https://developer.mozilla.org/zh-CN/docs/WebAssembly/Understanding_the_text_format" target="_blank" rel="noopener">Understanding WebAssembly text format</a>。</p>

<p class="wp-block-paragraph">我们将上面的代码保存到 <code>add.wat</code> 文件中，并通过 <a href="https://github.com/WebAssembly/wabt" target="_blank" rel="noopener">WABT</a> 工具包（The WebAssembly Binary Toolkit）中的 <a href="https://webassembly.github.io/wabt/doc/wat2wasm.1.html" target="_blank" rel="noopener">wat2wasm</a> 将其转换为 wasm 格式：</p>

<pre class="EnlighterJSRAW" data-enlighter-language="generic" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">$ wat2wasm add.wat -o add.wasm</pre>

<p class="wp-block-paragraph">使用下面的 JavaScript 脚本加载 wasm 并调用 <code>add()</code> 函数：</p>

<pre class="EnlighterJSRAW" data-enlighter-language="js" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">fetchAndInstantiate('add.wasm').then(function(instance) {
    console.log(instance.exports.add(1, 2));  // "3"
});
 
// fetchAndInstantiate() found in wasm-utils.js
function fetchAndInstantiate(url, importObject) {
    return fetch(url).then(response =>
    response.arrayBuffer()
    ).then(bytes =>
    WebAssembly.instantiate(bytes, importObject)
    ).then(results =>
    results.instance
    );
}</pre>

<p class="wp-block-paragraph">将这段 JavaScript 脚本放在一个 HTML 文件中，然后启动 Web Server 访问，可以看到控制台输出了 3，也就是 <code>add(1, 2)</code> 的结果，并且我们还可以通过 Chrome 提供的 <a href="https://developer.chrome.com/blog/wasm-debugging-2020/" target="_blank" rel="noopener">开发者工具对 wasm 文件进行调试</a>：</p>

<div class="wp-block-image">
<figure class="aligncenter size-large"><img loading="lazy" decoding="async" width="1024" height="473" src="/wp-content/uploads/2023/12/3995215115-1024x473.png" alt="" class="wp-image-12274" srcset="/wp-content/uploads/2023/12/3995215115-1024x473.png 1024w, /wp-content/uploads/2023/12/3995215115-300x139.png 300w, /wp-content/uploads/2023/12/3995215115-768x355.png 768w, /wp-content/uploads/2023/12/3995215115-1536x710.png 1536w, /wp-content/uploads/2023/12/3995215115-1300x601.png 1300w, /wp-content/uploads/2023/12/3995215115.png 1920w" sizes="auto, (max-width: 1024px) 100vw, 1024px" /></figure>
</div>

<h2 class="wp-block-heading">在非浏览器下运行 WebAssembly</h2>

<p class="wp-block-paragraph">WebAssembly 最早只应用于 Web 浏览器中，但鉴于它所拥有&nbsp;<strong>可移植、安全及高效</strong>&nbsp;等特性，WebAssembly 也被逐渐应用在 Web 领域之外的一些其他场景中，并为此提出了一项新的接口标准 ——&nbsp;<a href="https://wasi.dev/" target="_blank" rel="noopener">WASI（WebAssembly System Interface）</a>。</p>

<p class="wp-block-paragraph">要让 WebAssembly 跑在非 Web 环境下，我们必须有一款支持 WASI 接口的运行时（WASI runtime），目前比较流行的有：<a href="https://wasmtime.dev/" target="_blank" rel="noopener">wasttime</a>、<a href="https://wasmer.io/" target="_blank" rel="noopener">wasmer</a>&nbsp;和&nbsp;<a href="https://wasmedge.org/" target="_blank" rel="noopener">WasmEdge</a>&nbsp;等，这些运行时提供了不同编程语言的 SDK，可以使得我们在各种不同的语言中调用 WebAssembly 模块。</p>

<h2 class="wp-block-heading">参考资料</h2>

<ul class="wp-block-list">
<li><a href="https://webassembly.org/" target="_blank" rel="noopener">WebAssembly 官网</a></li>

<li><a href="https://developer.mozilla.org/zh-CN/docs/WebAssembly" target="_blank" rel="noopener">WebAssembly | MDN</a></li>

<li><a href="http://webassembly.org.cn/" target="_blank" rel="noopener">WebAssembly 中文网</a></li>

<li><a href="https://github.com/WebAssembly/design" target="_blank" rel="noopener">WebAssembly Design Documents</a></li>

<li><a href="https://webassembly.github.io/spec/core/index.html" target="_blank" rel="noopener">WebAssembly Specification</a></li>

<li><a href="https://zh.wikipedia.org/wiki/WebAssembly" target="_blank" rel="noopener">WebAssembly &#8211; 维基百科</a></li>

<li><a href="https://www.ruanyifeng.com/blog/2017/09/asmjs_emscripten.html" target="_blank" rel="noopener">asm.js 和 Emscripten 入门教程</a></li>

<li><a href="https://king-hcj.github.io/2020/10/05/google-v8/" target="_blank" rel="noopener">浏览器是如何工作的：Chrome V8 让你更懂JavaScript</a></li>

<li><a href="https://www.cnblogs.com/detectiveHLH/p/9928915.html" target="_blank" rel="noopener">WebAssembly完全入门——了解wasm的前世今身</a></li>

<li><a href="https://github.com/ErosZy/md/blob/master/WebAssembly%E4%B8%93%E6%A0%8F/1.%E6%B5%85%E8%BF%B0WebAssembly%E5%8E%86%E5%8F%B2.md" target="_blank" rel="noopener">浅谈WebAssembly历史</a></li>

<li><a href="https://hacks.mozilla.org/category/code-cartoons/a-cartoon-intro-to-webassembly/" target="_blank" rel="noopener">A cartoon intro to WebAssembly Articles</a></li>

<li><a href="https://zhuanlan.zhihu.com/p/102692865" target="_blank" rel="noopener">一个白学家眼里的 WebAssembly</a></li>

<li><a href="https://soulteary.com/2021/11/21/use-docker-and-golang-to-quickly-get-started-with-webassembly.html" target="_blank" rel="noopener">使用 Docker 和 Golang 快速上手 WebAssembly</a></li>

<li><a href="https://www.zhihu.com/question/31415286" target="_blank" rel="noopener">如何评论浏览器最新的 WebAssembly 字节码技术？</a></li>

<li><a href="https://www.zhihu.com/question/362649730" target="_blank" rel="noopener">如何看待 WebAssembly 这门技术？</a></li>

<li><a href="https://zhuanlan.zhihu.com/p/338261741" target="_blank" rel="noopener">系统学习WebAssembly（1） —— 理论篇</a></li>

<li><a href="https://juejin.cn/post/7013286944553566215" target="_blank" rel="noopener">快 11K Star 的 WebAssembly，你应该这样学</a></li>

<li><a href="https://tate-young.github.io/2020/03/02/webassembly.html" target="_blank" rel="noopener">WebAssembly 与 JIT</a></li>

<li><a href="https://codechina.gitcode.host/programmer/2017/programmer-2017-55.html" target="_blank" rel="noopener">WebAssembly 初步探索</a></li>

<li><a href="https://medium.com/starbugs/run-golang-on-browser-using-wasm-c0db53d89775" target="_blank" rel="noopener">WebAssembly 實戰 – 讓 Go 與 JS 在瀏覽器上共舞</a></li>
</ul>

<p class="wp-block-paragraph"></p>
