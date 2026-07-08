---
title: "理解 C++ 右值引用和 std::move"
description: "C++ 右值引用（rvalue references）和 std::move 是 C++11 引入的两项关键特性，它们极大地改善了 C++ 中的资源管理，尤其是与 移动语义（mov&hellip;"
pubDatetime: 2022-10-05T13:47:00.000Z
modDatetime: 2025-03-03T14:28:26.000Z
author: "Zhang"
tags:
  - "C++"
canonicalURL: "https://littlepotato.me/2022/10/05/rvalue-references-std-move/"
---

<p class="wp-block-paragraph">C++ 右值引用（<strong>rvalue references</strong>）和 <code>std::move</code> 是 C++11 引入的两项关键特性，它们极大地改善了 C++ 中的资源管理，尤其是与 <strong>移动语义</strong>（<strong>move semantics</strong>）和 <strong>完美转发</strong>（<strong>perfect forwarding</strong>）相关的方面。</p>

<!--more-->

<h2 class="wp-block-heading">右值引用（Rvalue References）</h2>

<p class="wp-block-paragraph">在 C++ 中，变量分为 <strong>左值（lvalue）</strong> 和 <strong>右值（rvalue）</strong>：</p>

<ul class="wp-block-list">
<li><strong>左值</strong> 是指有持久存储位置的表达式，例如：变量、数组元素、解引用的指针等。左值可以出现在赋值语句的左边。</li>

<li><strong>右值</strong> 是指没有持久存储位置的临时对象，比如字面量（<code>42</code>）、返回临时对象的表达式等。右值通常出现在赋值语句的右边。</li>
</ul>

<p class="wp-block-paragraph">右值引用是 C++11 引入的概念，它通过 <code>&amp;&amp;</code> 来定义。例如：</p>

<pre class="EnlighterJSRAW" data-enlighter-language="cpp" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">int &amp;&amp;r = 10;  // 右值引用</pre>

<p class="wp-block-paragraph">右值引用允许你 <strong>窃取</strong> 对象的资源，而不需要进行昂贵的复制。它使得我们能够实现 <strong>移动语义</strong>，即将资源从一个对象“移动”到另一个对象，而不是复制。</p>

<p class="wp-block-paragraph">右值引用的特点：</p>

<ul class="wp-block-list">
<li><strong>绑定到右值</strong>：右值引用通常绑定到右值（临时对象），例如临时对象、函数返回值等。</li>

<li><strong>可转移资源</strong>：通过右值引用，可以转移对象的资源（例如内存、文件句柄等），而无需进行深拷贝。</li>
</ul>

<h2 class="wp-block-heading">std::move</h2>

<p class="wp-block-paragraph"><code>std::move</code> 是一个强制将左值转为右值引用的函数，它的作用并不是“移动”对象，而是告诉编译器把一个左值当作右值来处理，从而启用移动语义。</p>

<pre class="EnlighterJSRAW" data-enlighter-language="cpp" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">T&amp;&amp; std::move(T&amp; x);</pre>

<p class="wp-block-paragraph"><code>std::move</code> 的作用是将传入的左值转换成一个右值引用，使得可以调用移动构造函数或移动赋值操作符。</p>

<pre class="EnlighterJSRAW" data-enlighter-language="generic" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">#include &lt;iostream>
#include &lt;vector>

class MyClass {
public:
    MyClass() { std::cout &lt;&lt; "MyClass created!" &lt;&lt; std::endl; }
    MyClass(const MyClass&amp;) { std::cout &lt;&lt; "MyClass copied!" &lt;&lt; std::endl; }
    MyClass(MyClass&amp;&amp;) { std::cout &lt;&lt; "MyClass moved!" &lt;&lt; std::endl; }
};

int main() {
    MyClass obj1;  // 创建一个 MyClass 对象
    MyClass obj2 = std::move(obj1);  // 移动 obj1 到 obj2
}</pre>

<p class="wp-block-paragraph">在上面的代码中：</p>

<ul class="wp-block-list">
<li><code>std::move(obj1)</code> 将 <code>obj1</code> 转换为右值引用。</li>

<li>由于使用右值引用，<code>obj2</code> 通过移动构造函数获取资源，而不是通过复制构造函数。</li>
</ul>

<h2 class="wp-block-heading">移动语义</h2>

<p class="wp-block-paragraph">移动语义使得我们能够“移动”对象的资源，而不是复制它们。对于某些对象（如大型容器、动态分配的内存），复制可能是非常昂贵的，尤其是在多次传递和返回对象时。通过移动语义，我们可以节省很多资源。</p>

<p class="wp-block-paragraph"><strong>移动构造函数</strong> 和 <strong>移动赋值操作符</strong> 是实现移动语义的关键。</p>

<p class="wp-block-paragraph">示例：移动构造函数</p>

<pre class="EnlighterJSRAW" data-enlighter-language="generic" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">class MyClass {
public:
    MyClass() { std::cout &lt;&lt; "MyClass created!" &lt;&lt; std::endl; }
    MyClass(const MyClass&amp;) { std::cout &lt;&lt; "MyClass copied!" &lt;&lt; std::endl; }
    MyClass(MyClass&amp;&amp; other) { 
        std::cout &lt;&lt; "MyClass moved!" &lt;&lt; std::endl;
        // 转移资源
    }
};</pre>

<p class="wp-block-paragraph">移动构造函数的实现通常会“窃取”资源，并将源对象的状态设置为一个有效的空状态。</p>

<p class="wp-block-paragraph">示例：移动赋值操作符</p>

<pre class="EnlighterJSRAW" data-enlighter-language="generic" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">MyClass&amp; operator=(MyClass&amp;&amp; other) {
    std::cout &lt;&lt; "Move assignment!" &lt;&lt; std::endl;
    // 释放当前资源并转移资源
    return *this;
}</pre>

<h2 class="wp-block-heading">应用场景</h2>

<ul class="wp-block-list">
<li><strong>避免不必要的拷贝</strong>：特别是在处理大量数据或昂贵资源时，避免拷贝操作可以显著提高性能。例如，在传递大型容器或文件句柄时，使用移动语义可以节省时间和空间。</li>

<li><strong>容器和算法</strong>：在 STL 容器（如 <code>std::vector</code>）和算法中，移动语义允许容器通过移动而不是复制元素来避免不必要的资源复制。</li>
</ul>

<h2 class="wp-block-heading">总结</h2>

<p class="wp-block-paragraph">右值引用的声明一般出现在函数形参里，这样它既可以接收右值，也可以按引用接受经过 move 临时变成右值的左值。使用右值引用和 <code>std::move</code> 使得 C++ 程序更加高效，尤其是在需要大量对象创建和销毁的场景中。</p>

<p class="wp-block-paragraph"></p>
