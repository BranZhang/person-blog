---
title: "字符串视图"
description: "在某些较旧的 C++ 版本中，字符串处理可能会很麻烦。随着人们意识到 C++ 需要更强大的字符串处理能力，这一问题在 C++17 中得到了关注，并引入了 std::string_v&hellip;"
pubDate: "2021-08-07T13:24:00.000Z"
updatedDate: "2025-02-10T14:07:56.000Z"
published: true
disableComments: true
disableLikes: true
tags: ["C++"]
---
<p class="wp-block-paragraph">在某些较旧的 C++ 版本中，字符串处理可能会很麻烦。随着人们意识到 C++ 需要更强大的字符串处理能力，这一问题在 C++17 中得到了关注，并引入了 <code>std::string_view</code>。</p>

<!--more-->

<h2 class="wp-block-heading">std::string</h2>

<p class="wp-block-paragraph">在深入探讨 <code>std::string_view</code> 重要性之前，我们需要先了解 <code>std::string</code> 的功能。<code>std::string</code> 本质上是 <code>char*</code> 或 <code>char[]</code> 的一个友好封装。它允许我们存储连续分配的字符内存，并对其进行修改、迭代，最终用于显示。例如：</p>

<pre class="EnlighterJSRAW" data-enlighter-language="cpp" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">std::string str = "My str";
std::string prefix = "My ";
if (str.compare(0, prefix.size(), pre) == 0) {
    std::cout &lt;&lt; str.substr(prefix.size()); // "str"
}</pre>

<p class="wp-block-paragraph">现在，<code>compare</code> 函数看起来有点像 C 语言的风格，但这里还有另一个问题：<code>std::string::substr</code> 会导致额外的 <code>std::string</code> 分配。因为它不会修改原始字符串实例，而是返回一个新的字符串实例，而在这里我们其实并不需要这个新实例。为了避免这种情况，我们必须这样做：</p>

<pre class="EnlighterJSRAW" data-enlighter-language="cpp" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">for (size_t i = prefox.size(); i &lt; str.size(); ++i) {
    std::cout &lt;&lt; str[i];
}</pre>

<p class="wp-block-paragraph">让我们来看另外一个示例：</p>

<pre class="EnlighterJSRAW" data-enlighter-language="cpp" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">bool validate(const std::string&amp; str) {
    std::string start = "lstart", stop = "lstop";
    return str.compare(0, start.size(), start) == 0 &amp;&amp; str.compare(str.size() - stop.size(), stop.size(), stop) == 0;
}</pre>

<p class="wp-block-paragraph">在这里，我们没有进行任何拷贝操作。但如果在函数签名中忘记加 <code>&amp;</code> 符号，很容易导致一次拷贝。不过，C 风格的 <code>compare</code> 语法仍然存在。</p>

<h2 class="wp-block-heading">std::string_view (C++17)</h2>

<p class="wp-block-paragraph">自 C++17 起，我们可以使用 <code>std::string_view</code> 实例来观察已分配的连续内存。这意味着我们可以获取一个子字符串视图，它支持迭代和比较操作，而无需为此分配新的 <code>std::string</code> 实例，同时也避免了 C 语言风格的语法。</p>

<pre class="EnlighterJSRAW" data-enlighter-language="cpp" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">std::string str = "My str";
std::string prefix = "My ";
std::string_view str_v = str; // no allocation performed
if (str_v.substr(0, prefix.size()) == prefix) { // no allocation
    std::cout &lt;&lt; str_v.substr(prefix.size()); // no allocation
}</pre>

<p class="wp-block-paragraph">这意味着对于 <code>validate</code> 函数，我们现在可以直接传递 <code>std::string_view</code>，而无需使用 <code>const &amp;</code> 说明符：</p>

<pre class="EnlighterJSRAW" data-enlighter-language="cpp" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">bool validate(std::string_view str) {
    std::string start = "lstart", stop = "lstop";
    return str.substr(0, start.size()) == start &amp;&amp; str.substr(str.size() - stop.size()) == stop;
}</pre>

<h3 class="wp-block-heading">它是如何工作的</h3>

<p class="wp-block-paragraph"><code>std::string_view</code> 实际上是一个结构体，它包含指向字符缓冲区起始位置的指针和一个表示大小的成员。这些信息在构造函数中传递，并在 <code>substr</code> 函数中提取到一个新的实例中。<br>当从 <code>std::string</code> 实例构造 <code>std::string_view</code> 实例时，实际上是使用了 <code>std::string::operator basic_string_view</code>，然后再从 <code>std::string_view</code> 构造一个新的 <code>std::string_view</code>。</p>

<h3 class="wp-block-heading">更进一步</h3>

<p class="wp-block-paragraph"><code>std::string_view</code> 也可以由 <code>char*</code> 实例构造，或者通过 <code>char*</code> 和 <code>size_t</code> 参数构造。这意味着，如果我们只是需要观察和分析编译时字符串（这些字符串被保存在二进制文件中，因此它们的地址是可用的），我们可以直接将它们赋值给 <code>std::string_view</code> 实例，而无需先构造 <code>std::string</code> 实例。</p>

<pre class="EnlighterJSRAW" data-enlighter-language="cpp" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">std::string_view str = "My str"; // no string allocation
std::string_view prefix = "My ";
if (str.substr(0, prefix.size()) == prefix) {
    std::cout &lt;&lt; str.substr(prefix.size());
}
bool validate(std::string_view str) {
    std::string_view start = "lstart", stop = "lstop"; // no string allocations
    return str.substr(0, start.size()) == start &amp;&amp; str.substr(str.size() - stop.size()) == stop;
}</pre>

<p class="wp-block-paragraph">需要注意的是：当使用 <code>char*</code> 构造 <code>std::string_view</code> 实例而不指定长度时，长度将由第一个空字符 (<code>\0</code>) 确定。因此，使用时需要格外小心。我们将在后续进一步讨论这个问题。</p>

<h2 class="wp-block-heading">C++20/23 拓展</h2>

<p class="wp-block-paragraph">新的标准为 <code>std::string_view</code> 和 <code>std::string</code> 对象带来了许多有用的新特性。在 C++20 中，我们获得了两个新的成员函数：<code>starts_with</code> 和 <code>ends_with</code>（它们非常适用于上述示例）。此外，从 C++23 开始，我们还新增了 <code>contains</code> 成员函数：</p>

<pre class="EnlighterJSRAW" data-enlighter-language="cpp" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">std::string_view str = "My str";
std::string_view prefix = "My ";
if (str.starts_with(prefix)) {
    std::cout &lt;&lt; str.substr(prefix.size());
}
bool validate(std::string_view str) {
    return str.starts_with("lstart") &amp;&amp; str.ends_with("lstop");
}</pre>

<h2 class="wp-block-heading">Constexpr</h2>

<p class="wp-block-paragraph">以上所有函数都可以在 <code>constexpr</code> 上下文中使用或实现。由于 <code>std::string_view</code> 不会分配任何新数据，它为编译时编程提供了一个开放的可能性。</p>

<pre class="EnlighterJSRAW" data-enlighter-language="cpp" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">constexpr std::string_view str = "My str";
constexpr std::string_view prefix = "My ";
if (str.starts_with(prefix)) {
    std::cout &lt;&lt; str.substr(prefix.size());
}
constexpr bool validate(std::string_view str) {
    return str.starts_with("lstart") &amp;&amp; str.ends_with("lstop");
}</pre>

<h2 class="wp-block-heading">最佳实践</h2>

<p class="wp-block-paragraph"><code>std::string_view</code> 旨在提高字符串分析的性能。然而，性能与安全性之间始终存在权衡，而在处理 <code>std::string_view</code> 时，这种权衡尤为重要。</p>

<h3 class="wp-block-heading">规则1：永远不要返回 std::string_view</h3>

<pre class="EnlighterJSRAW" data-enlighter-language="cpp" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">std::string_view func() {
    std::string str;
    std::cin >> str;
    return str;
}</pre>

<p class="wp-block-paragraph">这个看似无害的函数会导致不安全的内存访问。<code>str</code> 在堆上为输入的字符分配了新的内存空间。在返回 <code>std::string_view</code> 之后，它的析构函数释放了这块分配的内存。这意味着返回的 <code>std::string_view</code> 现在指向的是已被释放的内存。</p>

<p class="wp-block-paragraph">需要注意的是，返回 <code>std::string_view</code> 并不总是会导致不安全的内存访问。如果返回的 <code>std::string_view</code> 指向的是静态存储区的内存，或者指向的是在函数外部仍然可访问的内存，则仍然是有效的。但这类情况在未来可能变得无效，因此最安全的做法是禁止在任何情况下返回 <code>std::string_view</code>。</p>

<h3 class="wp-block-heading">规则2：注意空字符终止符</h3>

<p class="wp-block-paragraph">正如之前提到的，不建议使用空字符终止符，在使用 <code>std::string_view</code> 时应始终牢记这一点。</p>

<pre class="EnlighterJSRAW" data-enlighter-language="cpp" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">std::string_view str = "my cool str";
str.remove_prefix(str.find(" "));
str.remove_suffix(str.size() - str.rfind(" "));
std::cout &lt;&lt; str; // "cool" - OK
std::cout &lt;&lt; str.data(); // "cool str"</pre>

<p class="wp-block-paragraph"><code>remove_prefix</code> 和 <code>remove_suffix</code> 只会改变视图的起始和结束位置。这意味着 <code>remove_suffix</code> 并不会在末尾插入空字符终止符，因此直接打印底层数据时不会受到影响。为了修正这个问题，我们可以修改原始字符串（如果存在），或者从 <code>std::string_view</code> 构造一个新的 <code>std::string</code>，这样它会自动处理终止符，而不会修改原始字符串。</p>

<pre class="EnlighterJSRAW" data-enlighter-language="cpp" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">{ // Modifying owner
    std::string str = "cool str";
    std::string_view str_v = str;
    str_v.remove_suffix(4);
    str[4] = '\0';
 
    std::cout &lt;&lt; str &lt;&lt; "\n"; // "cool\0str"
    std::cout &lt;&lt; str_v &lt;&lt; "\n"; // "cool"
    std::cout &lt;&lt; str_v.data(); // "cool"
}
 
{ // Allocating a new string
    std::string_view str = "cool str";
    str.remove_suffix(4);
    std::string modified_str(str);
    std::string_view mstr_v = modified_str;
     
    std::cout &lt;&lt; str &lt;&lt; "\n"; // "cool"
    std::cout &lt;&lt; str.data() &lt;&lt; "\n"; // "cool str"
    std::cout &lt;&lt; modified_str &lt;&lt; "\n"; // "cool"
    std::cout &lt;&lt; mstr_v &lt;&lt; "\n"; // "cool"
    std::cout &lt;&lt; mstr_v.data(); // "cool"
}</pre>

<h3 class="wp-block-heading">规则3：不要丢失所有权</h3>

<p class="wp-block-paragraph"><code>std::string_view</code> 并不拥有其包含的字符串，因此不会对其进行保护或释放。除了可能导致未定义行为（UB）或非法内存访问外，在某些情况下，它还可能导致内存泄漏（这种情况可能发生在将原本使用 <code>std::string</code> 的代码转换为使用 <code>std::string_view</code> 时）。</p>

<pre class="EnlighterJSRAW" data-enlighter-language="cpp" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">const char* get() { return new char[]{"my new str"}; }
 
{
    std::string_view str = get();
    // Here we can call: delete str.data()
    str.remove_prefix(1); // Memory leak!
    // delete str.data() // Invalid call here. The pointer doesn't point to the allocated section head.
}</pre>

<h2 class="wp-block-heading">总结</h2>

<p class="wp-block-paragraph"><code>std::string_view</code> 可用于优化处理字符串的代码部分，提高性能和可读性。然而，任何使用都伴随着额外的责任，必须以正确的方式使用它，以避免出现意外行为（特别是在代码扩展和修改时）。这再次证明了“能力越大，责任越大”这一原则。</p>
