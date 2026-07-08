---
title: "C++ 如何解析函数调用（译：How C++ Resolves a Function Call）"
description: "C 是一种简单的语言，每个函数名称只能对应一个函数。另一方面，C++ 提供了更大的灵活性："
pubDate: "2023-04-21T10:09:00.000Z"
updatedDate: "2025-03-09T15:28:20.000Z"
published: true
tags: ["C++"]
---
<p class="wp-block-paragraph">C 是一种简单的语言，每个函数名称只能对应一个函数。另一方面，C++ 提供了更大的灵活性：</p>

<ul class="wp-block-list">
<li>你可以定义多个同名函数（函数重载）。</li>

<li>你可以重载内置运算符，如 <code>+</code> 和 <code>==</code>。</li>

<li>你可以编写函数模板。</li>

<li>命名空间有助于避免命名冲突。</li>
</ul>

<!--more-->

<p class="wp-block-paragraph">我喜欢这些 C++ 特性。利用这些特性，你可以让 <code>str1 + str2</code> 返回两个字符串的拼接结果。你可以有一对 2D 点和另一对 3D 点，并重载 <code>dot(a, b)</code> 使其适用于任意类型。你可以创建一系列类似数组的类，并编写一个通用的排序函数模板，使其适用于所有这些类。</p>

<p class="wp-block-paragraph">但在利用这些特性时，很容易走得太远。某个时候，编译器可能会意外地拒绝你的代码，并报出类似以下的错误：</p>

<pre class="EnlighterJSRAW" data-enlighter-language="generic" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">error C2666: 'String::operator ==': 2 overloads have similar conversions
note: could be 'bool String::operator ==(const String &amp;) const'
note: or       'built-in C++ operator==(const char *, const char *)'
note: while trying to match the argument list '(const String, const char *)'</pre>

<p class="wp-block-paragraph">和许多 C++ 程序员一样，我在职业生涯中一直在与这些错误作斗争。每次遇到这种情况，我通常会挠头思索，然后在网上查找资料加深理解，接着修改代码直到成功编译。然而，最近在为 Plywood 开发新的运行时库时，我一次次被这些错误阻挠。渐渐地，我意识到，尽管我有丰富的 C++ 经验，但仍然缺少某些关键的理解，而我却不知道那究竟是什么。</p>

<p class="wp-block-paragraph">幸运的是，现在是 2021 年，关于 C++ 的信息比以往更加全面。尤其要感谢 <a href="https://cppreference.com" target="_blank" rel="noopener">cppreference.com</a>，让我终于弄清楚自己理解中缺失的部分：编译时，每次函数调用背后都有一个隐藏的算法，而我以前对它缺乏清晰的认识。</p>

<p class="wp-block-paragraph">这就是编译器在处理函数调用表达式时，确定具体调用哪个函数的过程：</p>

<div class="wp-block-image">
<figure class="aligncenter size-large is-resized"><img loading="lazy" decoding="async" width="927" height="1024" src="/wp-content/uploads/2023/04/image-1-927x1024.png" alt="" class="wp-image-12280" style="width:632px;height:auto" srcset="/wp-content/uploads/2023/04/image-1-927x1024.png 927w, /wp-content/uploads/2023/04/image-1-272x300.png 272w, /wp-content/uploads/2023/04/image-1-768x848.png 768w, /wp-content/uploads/2023/04/image-1-1391x1536.png 1391w, /wp-content/uploads/2023/04/image-1-1300x1436.png 1300w, /wp-content/uploads/2023/04/image-1.png 1464w" sizes="auto, (max-width: 927px) 100vw, 927px" /></figure>
</div>

<p class="wp-block-paragraph">这些步骤被写入了 C++ 标准。每个 C++ 编译器都必须遵循这些步骤，而且这一切都发生在编译时，针对程序中每个被求值的函数调用表达式。事后看来，显然必须有这样的算法。它是 C++ 能同时支持上述所有特性的唯一方式。这就是将这些特性结合在一起后得到的结果。</p>

<p class="wp-block-paragraph">我想这个算法的整体目的是“按程序员的预期执行”，在某种程度上，它在这方面是成功的。你可以在完全忽略这个算法的情况下走得很远。但当你开始使用多个 C++ 特性时，比如在开发一个库时，最好知道规则。</p>

<p class="wp-block-paragraph">所以，让我们从头到尾走一遍这个算法。我们将要涵盖的许多内容对于有经验的 C++ 程序员来说可能很熟悉。尽管如此，我认为看到所有步骤如何配合在一起，还是很有启发性的。（至少对我来说是这样。）在过程中，我们会涉及几个高级 C++ 子主题，比如基于参数的查找和 SFINAE，但我们不会深入探讨任何一个子主题。这样，即使你对某个子主题一无所知，你也至少能知道它如何融入到 C++ 在编译时解析函数调用的整体策略中。我认为这是最重要的。</p>

<h2 class="wp-block-heading">名称查找</h2>

<p class="wp-block-paragraph">我们的旅程从一个函数调用表达式开始。以下面代码中的表达式 <code>blast(ast, 100)</code> 为例。这个表达式显然是要调用一个名为 <code>blast</code> 的函数。但是，具体是哪个呢？</p>

<pre class="EnlighterJSRAW" data-enlighter-language="cpp" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">namespace galaxy {
    struct Asteroid {
        float radius = 12;
    };
    void blast(Asteroid* ast, float force);
}

struct Target {
    galaxy::Asteroid* ast;
    Target(galaxy::Asteroid* ast) : ast{ast} {}
    operator galaxy::Asteroid*() const { return ast; }
};

bool blast(Target target);
template &lt;typename T> void blast(T* obj, float force);

void play(galaxy::Asteroid* ast) {
    blast(ast, 100);
}</pre>

<p class="wp-block-paragraph">回答这个问题的第一步是名称查找。在这一步中，编译器会查看到目前为止所有已声明的函数和函数模板，并识别出那些可能通过给定名称被引用的函数。</p>

<div class="wp-block-image">
<figure class="aligncenter size-full is-resized"><img loading="lazy" decoding="async" width="891" height="259" src="/wp-content/uploads/2023/04/image.png" alt="" class="wp-image-12282" style="width:551px;height:auto" srcset="/wp-content/uploads/2023/04/image.png 891w, /wp-content/uploads/2023/04/image-300x87.png 300w, /wp-content/uploads/2023/04/image-768x223.png 768w" sizes="auto, (max-width: 891px) 100vw, 891px" /></figure>
</div>

<p class="wp-block-paragraph">正如流程图所示，名称查找有三种主要类型，每种类型都有自己的一套规则。</p>

<ul class="wp-block-list">
<li><strong>成员名查找</strong>发生在名称位于 <code>.</code> 或 <code>-&gt;</code> 符号的右侧时，如 <code>foo-&gt;bar</code>。这种查找用于定位类成员。</li>

<li><strong>限定名查找</strong>发生在名称中包含 <code>::</code> 符号时，如 <code>std::sort</code>。这种类型的名称是显式的。<code>::</code> 符号右侧的部分仅在左侧部分所标识的作用域中进行查找。</li>

<li><strong>非限定名查找</strong>则不是这两者。当编译器遇到非限定名称时，如 <code>blast</code>，它会根据上下文在不同的作用域中查找匹配的声明。编译器应该查找的具体位置由一套详细的规则决定。</li>
</ul>

<p class="wp-block-paragraph">在我们的例子中，我们有一个非限定名称。当对函数调用表达式执行名称查找时，编译器可能会找到多个声明。我们将这些声明称为候选项。在上面的例子中，编译器找到了三个候选项：</p>

<div class="wp-block-image">
<figure class="aligncenter size-large is-resized"><img loading="lazy" decoding="async" width="1024" height="232" src="/wp-content/uploads/2023/04/image-2-1024x232.png" alt="" class="wp-image-12283" style="width:510px;height:auto" srcset="/wp-content/uploads/2023/04/image-2-1024x232.png 1024w, /wp-content/uploads/2023/04/image-2-300x68.png 300w, /wp-content/uploads/2023/04/image-2-768x174.png 768w, /wp-content/uploads/2023/04/image-2.png 1214w" sizes="auto, (max-width: 1024px) 100vw, 1024px" /></figure>
</div>

<p class="wp-block-paragraph">第一个候选项（上图中的圆圈标记）值得特别注意，因为它展示了 C++ 中一个容易忽视的特性：基于参数的查找，简称 ADL。我承认，在我的 C++ 职业生涯中，大部分时间我都没有意识到 ADL 在名称查找中的作用。这里简要总结一下，以防你也和我一样。通常，你不会期望这个函数成为这个特定调用的候选项，因为它是在 <code>galaxy</code> 命名空间内部声明的，而调用来自 <code>galaxy</code> 命名空间外部。代码中也没有 <code>using namespace galaxy</code> 指令来使这个函数可见。那么，为什么这个函数是一个候选项呢？</p>

<p class="wp-block-paragraph">原因在于，每当你在函数调用中使用非限定名称时——且该名称不指向类成员等——ADL（基于参数的查找）就会生效，名称查找变得更加贪婪。具体来说，除了通常的查找位置外，编译器还会在参数类型的命名空间中查找候选函数——因此有了“基于参数的查找”这一名称。</p>

<div class="wp-block-image">
<figure class="aligncenter size-full is-resized"><img loading="lazy" decoding="async" width="883" height="624" src="/wp-content/uploads/2023/04/image-3.png" alt="" class="wp-image-12284" style="width:364px;height:auto" srcset="/wp-content/uploads/2023/04/image-3.png 883w, /wp-content/uploads/2023/04/image-3-300x212.png 300w, /wp-content/uploads/2023/04/image-3-768x543.png 768w" sizes="auto, (max-width: 883px) 100vw, 883px" /></figure>
</div>

<p class="wp-block-paragraph">ADL 规则的完整集比我在这里描述的要复杂，但关键在于 ADL 只适用于非限定名称。对于限定名称，它们在单一作用域中进行查找，ADL 就没有意义了。ADL 还可以在重载内置运算符（如 <code>+</code> 和 <code>==</code>）时生效，这使得你可以在编写数学库等时充分利用它。</p>

<p class="wp-block-paragraph">有趣的是，有些情况下，成员名查找可以找到非限定名查找找不到的候选项。关于这一点，可以参考 Eli Bendersky 的文章了解更多详情。</p>

<h2 class="wp-block-heading">函数模板的特殊处理</h2>

<p class="wp-block-paragraph">通过名称查找找到的一些候选项是函数，其他的是函数模板。函数模板有一个问题：你不能直接调用它们。你只能调用函数。因此，在名称查找之后，编译器会遍历候选项列表，并尝试将每个函数模板转换为函数。</p>

<div class="wp-block-image">
<figure class="aligncenter size-full is-resized"><img loading="lazy" decoding="async" width="810" height="358" src="/wp-content/uploads/2023/04/image-4.png" alt="" class="wp-image-12285" style="width:462px;height:auto" srcset="/wp-content/uploads/2023/04/image-4.png 810w, /wp-content/uploads/2023/04/image-4-300x133.png 300w, /wp-content/uploads/2023/04/image-4-768x339.png 768w" sizes="auto, (max-width: 810px) 100vw, 810px" /></figure>
</div>

<p class="wp-block-paragraph">在我们跟随的例子中，其中一个候选项确实是一个函数模板：</p>

<div class="wp-block-image">
<figure class="aligncenter size-full is-resized"><img loading="lazy" decoding="async" width="663" height="58" src="/wp-content/uploads/2023/04/image-5.png" alt="" class="wp-image-12286" style="width:511px;height:auto" srcset="/wp-content/uploads/2023/04/image-5.png 663w, /wp-content/uploads/2023/04/image-5-300x26.png 300w" sizes="auto, (max-width: 663px) 100vw, 663px" /></figure>
</div>

<p class="wp-block-paragraph">这个函数模板有一个模板参数 T。因此，它期望一个模板参数。调用者 <code>blast(ast, 100)</code> 没有指定任何模板参数，所以为了将这个函数模板转换为函数，编译器必须确定 T 的类型。这时，模板参数推导就起作用了。在这一步，编译器会将调用者传递的函数参数（下图左侧）与函数模板期望的函数参数类型（右侧）进行比较。如果右侧引用了任何未指定的模板参数，比如 T，编译器会使用左侧的信息来推导它们。</p>

<div class="wp-block-image">
<figure class="aligncenter size-large is-resized"><img loading="lazy" decoding="async" width="1024" height="348" src="/wp-content/uploads/2023/04/image-6-1024x348.png" alt="" class="wp-image-12287" style="width:717px;height:auto" srcset="/wp-content/uploads/2023/04/image-6-1024x348.png 1024w, /wp-content/uploads/2023/04/image-6-300x102.png 300w, /wp-content/uploads/2023/04/image-6-768x261.png 768w, /wp-content/uploads/2023/04/image-6-1300x442.png 1300w, /wp-content/uploads/2023/04/image-6.png 1345w" sizes="auto, (max-width: 1024px) 100vw, 1024px" /></figure>
</div>

<p class="wp-block-paragraph">在这种情况下，编译器将 T 推导为 <code>galaxy::Asteroid</code>，因为这样做可以使第一个函数参数 <code>T*</code> 与参数 <code>ast</code> 兼容。模板参数推导的规则本身是一个庞大的话题，但在像这样的简单例子中，它们通常会按照你预期的方式工作。如果模板参数推导失败——换句话说，如果编译器无法以某种方式推导模板参数，使得函数参数与调用者的参数兼容——那么该函数模板将从候选项列表中移除。</p>

<p class="wp-block-paragraph">任何在候选项列表中存活到这一点的函数模板将进入下一步：模板参数替换。在这一步中，编译器会获取函数模板声明，并用相应的模板参数替换每个模板参数的出现。在我们的例子中，模板参数 T 被替换为其推导出的模板参数 <code>galaxy::Asteroid</code>。当这一步成功时，我们终于得到了一个可以调用的真正函数签名——而不仅仅是一个函数模板！</p>

<div class="wp-block-image">
<figure class="aligncenter size-large is-resized"><img loading="lazy" decoding="async" width="1024" height="223" src="/wp-content/uploads/2023/04/image-7-1024x223.png" alt="" class="wp-image-12288" style="width:515px;height:auto" srcset="/wp-content/uploads/2023/04/image-7-1024x223.png 1024w, /wp-content/uploads/2023/04/image-7-300x65.png 300w, /wp-content/uploads/2023/04/image-7-768x167.png 768w, /wp-content/uploads/2023/04/image-7.png 1258w" sizes="auto, (max-width: 1024px) 100vw, 1024px" /></figure>
</div>

<p class="wp-block-paragraph">当然，也有模板参数替换可能失败的情况。假设这个函数模板接受了第三个参数，如下所示：</p>

<pre class="EnlighterJSRAW" data-enlighter-language="cpp" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">template &lt;typename T> void blast(T* obj, float force, typename T::Units mass = 5000);</pre>

<p class="wp-block-paragraph">如果是这种情况，编译器会尝试将 <code>T::Units</code> 中的 <code>T</code> 替换为 <code>galaxy::Asteroid</code>。结果类型说明符 <code>galaxy::Asteroid::Units</code> 将是错误的，因为结构体 <code>galaxy::Asteroid</code> 实际上没有名为 <code>Units</code> 的成员。因此，模板参数替换会失败。</p>

<p class="wp-block-paragraph">当模板参数替换失败时，函数模板会从候选项列表中移除——在 C++ 的某个历史时刻，人们意识到这是一项他们可以利用的特性！这一发现引发了一整套元编程技术，这些技术统称为 SFINAE（替换失败不是错误）。SFINAE 是一个复杂且笨重的话题，我在这里只说两点。首先，它本质上是一种通过调整函数调用解析过程来选择你想要的候选项的方式。其次，随着程序员越来越多地转向现代 C++ 元编程技术（如约束和 <code>constexpr if</code>）来实现相同的目标，SFINAE 可能会逐渐过时。</p>

<h2 class="wp-block-heading">重载解析</h2>

<p class="wp-block-paragraph">在这一阶段，通过名称查找找到的所有函数模板都已经消失，我们只剩下一个整洁的候选函数集。这也被称为 <strong>重载集合</strong>。以下是我们例子中的更新后的候选函数列表：</p>

<div class="wp-block-image">
<figure class="aligncenter size-full is-resized"><img loading="lazy" decoding="async" width="761" height="112" src="/wp-content/uploads/2023/04/image-8.png" alt="" class="wp-image-12289" style="width:560px;height:auto" srcset="/wp-content/uploads/2023/04/image-8.png 761w, /wp-content/uploads/2023/04/image-8-300x44.png 300w" sizes="auto, (max-width: 761px) 100vw, 761px" /></figure>
</div>

<p class="wp-block-paragraph">接下来的两个步骤通过确定哪些候选函数是 <strong>可行的</strong>（换句话说，哪些函数 <strong>可以</strong> 处理该函数调用），进一步缩小这个列表。</p>

<div class="wp-block-image">
<figure class="aligncenter size-full is-resized"><img loading="lazy" decoding="async" width="870" height="317" src="/wp-content/uploads/2023/04/image-9.png" alt="" class="wp-image-12290" style="width:465px;height:auto" srcset="/wp-content/uploads/2023/04/image-9.png 870w, /wp-content/uploads/2023/04/image-9-300x109.png 300w, /wp-content/uploads/2023/04/image-9-768x280.png 768w" sizes="auto, (max-width: 870px) 100vw, 870px" /></figure>
</div>

<p class="wp-block-paragraph">最明显的要求之一是 <strong>参数必须兼容</strong>；也就是说，一个可行的函数应该能够接受调用者的参数。如果调用者的参数类型与函数的参数类型不完全匹配，至少应该能够 <strong>隐式转换</strong> 每个参数到其相应的参数类型。让我们看看我们例子中的每个候选函数，看看它的参数是否兼容：</p>

<div class="wp-block-image">
<figure class="aligncenter size-large is-resized"><img loading="lazy" decoding="async" width="1024" height="302" src="/wp-content/uploads/2023/04/image-10-1024x302.png" alt="" class="wp-image-12291" style="width:571px;height:auto" srcset="/wp-content/uploads/2023/04/image-10-1024x302.png 1024w, /wp-content/uploads/2023/04/image-10-300x89.png 300w, /wp-content/uploads/2023/04/image-10-768x227.png 768w, /wp-content/uploads/2023/04/image-10.png 1212w" sizes="auto, (max-width: 1024px) 100vw, 1024px" /></figure>
</div>

<h4 class="wp-block-heading">候选项 1</h4>

<p class="wp-block-paragraph">调用者的第一个参数类型 <code>galaxy::Asteroid*</code> 完全匹配。调用者的第二个参数类型 <code>int</code> 可以隐式转换为第二个函数参数类型 <code>float</code>，因为 <code>int</code> 到 <code>float</code> 是标准转换。因此，候选项 1 的参数是兼容的。</p>

<h4 class="wp-block-heading">候选项 2</h4>

<p class="wp-block-paragraph">调用者的第一个参数类型 <code>galaxy::Asteroid*</code> 可以隐式转换为第一个函数参数类型 <code>Target</code>，因为 <code>Target</code> 有一个接受 <code>galaxy::Asteroid*</code> 类型参数的转换构造函数。（顺便说一下，这些类型也可以反向转换，因为 <code>Target</code> 有一个用户定义的转换函数可以转换回 <code>galaxy::Asteroid*</code>。）然而，调用者传递了两个参数，而候选项 2 只接受一个参数。因此，候选项 2 不可行。</p>

<div class="wp-block-image">
<figure class="aligncenter size-full is-resized"><img loading="lazy" decoding="async" width="790" height="103" src="/wp-content/uploads/2023/04/image-11.png" alt="" class="wp-image-12292" style="width:557px;height:auto" srcset="/wp-content/uploads/2023/04/image-11.png 790w, /wp-content/uploads/2023/04/image-11-300x39.png 300w, /wp-content/uploads/2023/04/image-11-768x100.png 768w" sizes="auto, (max-width: 790px) 100vw, 790px" /></figure>
</div>

<h4 class="wp-block-heading">候选项 3</h4>

<p class="wp-block-paragraph">候选项 3 的参数类型与候选项 1 相同，因此它也兼容。</p>

<p class="wp-block-paragraph">像这个过程中的其他所有内容一样，控制隐式转换的规则本身就是一个独立的话题。最值得注意的规则是，你可以通过将构造函数和转换运算符标记为 <code>explicit</code>，从而避免它们参与隐式转换。</p>

<p class="wp-block-paragraph">在使用调用者的参数筛选掉不兼容的候选项后，编译器接着检查每个函数的约束是否满足（如果有的话）。约束是 C++20 中的新特性。它们允许你使用自定义逻辑来消除候选函数（来自类模板或函数模板），而无需依赖 SFINAE。它们还应该为你提供更好的错误信息。我们的例子没有使用约束，因此我们可以跳过这一步。（从技术上讲，标准说约束也会在模板参数推导时被检查，但我略过了这个细节。两个地方的检查有助于确保显示最佳的错误信息。）</p>

<h2 class="wp-block-heading">决胜规则</h2>

<p class="wp-block-paragraph">在我们这个例子中，到目前为止，我们剩下了两个可行的函数。它们中的任何一个都可以很好地处理原始的函数调用：</p>

<div class="wp-block-image">
<figure class="aligncenter size-full is-resized"><img loading="lazy" decoding="async" width="754" height="86" src="/wp-content/uploads/2023/04/image-12.png" alt="" class="wp-image-12293" style="width:595px;height:auto" srcset="/wp-content/uploads/2023/04/image-12.png 754w, /wp-content/uploads/2023/04/image-12-300x34.png 300w" sizes="auto, (max-width: 754px) 100vw, 754px" /></figure>
</div>

<p class="wp-block-paragraph">事实上，如果上述两个函数中的任何一个是唯一可行的，那么它将处理这个函数调用。但由于有两个可行的函数，编译器现在必须做它在存在多个可行函数时总是做的事情：它必须确定哪个函数是最好的可行函数。要成为最好的可行函数，其中一个必须通过一系列的决胜规则“战胜”其他所有可行函数。</p>

<div class="wp-block-image">
<figure class="aligncenter size-full is-resized"><img loading="lazy" decoding="async" width="885" height="483" src="/wp-content/uploads/2023/04/image-13.png" alt="" class="wp-image-12294" style="width:529px;height:auto" srcset="/wp-content/uploads/2023/04/image-13.png 885w, /wp-content/uploads/2023/04/image-13-300x164.png 300w, /wp-content/uploads/2023/04/image-13-768x419.png 768w" sizes="auto, (max-width: 885px) 100vw, 885px" /></figure>
</div>

<p class="wp-block-paragraph">让我们看看前面三个决胜规则。</p>

<h4 class="wp-block-heading">第一个决胜规则：匹配更好的参数胜出</h4>

<p class="wp-block-paragraph">C++ 最重视调用者的参数类型与函数的参数类型之间的匹配程度。宽泛来说，C++ 更倾向于选择那些需要较少隐式转换的函数。当两个函数都需要转换时，某些转换被认为比其他转换“更好”。例如，这就是决定调用 <code>std::vector</code> 的 <code>operator[]</code> 的常量版本或非常量版本的规则。</p>

<p class="wp-block-paragraph">在我们跟随的例子中，两个可行函数具有相同的参数类型，所以没有哪个更好。它们打平。因此，我们进入第二个决胜规则。</p>

<h4 class="wp-block-heading">第二个决胜规则：非模板函数胜出</h4>

<p class="wp-block-paragraph">如果第一个决胜规则没有解决问题，那么 C++ 更倾向于调用非模板函数而不是模板函数。这就是我们例子中决定获胜者的规则；可行函数 1 是一个非模板函数，而可行函数 2 来自一个模板。因此，我们最好的可行函数是来自 <code>galaxy</code> 命名空间的函数：</p>

<div class="wp-block-image">
<figure class="aligncenter size-full is-resized"><img loading="lazy" decoding="async" width="732" height="102" src="/wp-content/uploads/2023/04/image-14.png" alt="" class="wp-image-12295" style="width:436px;height:auto" srcset="/wp-content/uploads/2023/04/image-14.png 732w, /wp-content/uploads/2023/04/image-14-300x42.png 300w" sizes="auto, (max-width: 732px) 100vw, 732px" /></figure>
</div>

<p class="wp-block-paragraph">值得重申的是，前两个决胜规则是按我描述的顺序排列的。换句话说，如果有一个可行函数，其参数与给定参数的匹配程度优于所有其他可行函数，即使它是一个模板函数，它也会获胜。</p>

<h4 class="wp-block-heading">第三个决胜规则：更专门化的模板胜出</h4>

<p class="wp-block-paragraph">在我们的例子中，最好的可行函数已经找到了，但如果没有找到，我们将进入第三个决胜规则。在这个规则中，C++ 更倾向于调用“更专门化”的模板函数，而不是“更一般化”的函数。例如，考虑以下两个函数模板：</p>

<pre class="EnlighterJSRAW" data-enlighter-language="cpp" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">template &lt;typename T> void blast(T obj, float force);
template &lt;typename T> void blast(T* obj, float force);</pre>

<p class="wp-block-paragraph">当对这两个函数模板执行模板参数推导时，第一个函数模板接受任何类型作为其第一个参数，而第二个函数模板仅接受指针类型。因此，第二个函数模板被认为是更专门化的。如果这两个函数模板是我们调用 <code>blast(ast, 100)</code> 时名称查找的唯一结果，并且它们都产生了可行函数，那么当前的决胜规则将导致选择第二个函数模板而不是第一个函数模板。决定哪个函数模板比另一个更专门化的规则是另一个庞大的话题。</p>

<p class="wp-block-paragraph">尽管第二个函数模板被认为是更专门化的，但重要的是要理解，第二个函数模板实际上并不是第一个函数模板的部分特化。相反，它们是两个完全独立的函数模板，恰好共享相同的名称。换句话说，它们是重载的。C++ 不允许函数模板的部分特化。</p>

<h4 class="wp-block-heading">汇总</h4>

<p class="wp-block-paragraph">除了这里列出的决胜规则之外，还有几个其他的决胜规则。例如，如果太空船 <code>&lt;=&gt;</code> 运算符和重载的比较运算符（如 <code>&gt;</code>）都是可行的，C++ 会更倾向于选择比较运算符。如果候选项是用户定义的转换函数，还会有其他规则优先于我所展示的规则。尽管如此，我认为我展示的这三个决胜规则是最重要的需要记住的。</p>

<p class="wp-block-paragraph">不言而喻，如果编译器检查了所有的决胜规则但没有找到一个明确的胜者，编译将失败，并出现类似于本文开头所示的错误信息。</p>

<h2 class="wp-block-heading"><strong>函数调用解析后</strong></h2>

<p class="wp-block-paragraph">我们已经走到了旅程的尽头。编译器现在确切地知道应该调用哪个函数来处理表达式 <code>blast(ast, 100)</code>。然而，在许多情况下，编译器在解析函数调用后还有更多的工作要做：</p>

<ul class="wp-block-list">
<li>如果调用的函数是类成员，编译器必须检查该成员的访问说明符，以确定它是否对调用者可访问。</li>

<li>如果调用的函数是模板函数，编译器会尝试实例化该模板函数，前提是其定义是可见的。</li>

<li>如果调用的函数是虚函数，编译器会生成特殊的机器指令，以便在运行时调用正确的重写版本。</li>
</ul>

<p class="wp-block-paragraph">这些都不适用于我们的例子。此外，它们也超出了本文的讨论范围。</p>

<p class="wp-block-paragraph">这篇文章没有包含任何新的信息。它基本上是对已经由 cppreference.com 描述的算法的简化解释，而 cppreference.com 本身也是 C++ 标准的简化版。然而，本文的目标是传达主要步骤，而不陷入细节。让我们回顾一下，看看有多少细节被跳过了。实际上，这还挺显著的：</p>

<ul class="wp-block-list">
<li>有一整套关于非限定名查找的规则。 </li>

<li>其中包括一套关于基于参数的查找的规则。 </li>

<li>成员名查找也有自己的规则。 </li>

<li>有一套关于模板参数推导的规则。</li>

<li> 基于 SFINAE 的元编程技术有一整套。 </li>

<li>有一套规则来管理隐式转换是如何工作的。 </li>

<li>约束（和概念）是 C++20 中完全新的特性。</li>

<li> 有一套规则来确定哪些隐式转换比其他的更好。 </li>

<li>有一套规则来确定哪个函数模板比另一个更专门化。</li>
</ul>

<p class="wp-block-paragraph">是的，C++ 是复杂的。如果你想花更多时间探讨这些细节，Stephan T. Lavavej 在 2012 年制作了一系列非常值得观看的 Channel 9 视频。特别是第一三个视频。（感谢 Stephan 审阅了这篇文章的早期草稿。）</p>

<p class="wp-block-paragraph">现在，我已经学会了 C++ 如何解析函数调用，作为库开发者，我感到更有信心了。编译错误变得更明显了。我可以更好地为 API 设计决策提供依据。我甚至成功地从这些规则中提炼出了一小套技巧。但那是另一个话题的内容了。</p>

<h2 class="wp-block-heading">参考资料</h2>

<ul class="wp-block-list">
<li><a href="https://preshing.com/20210315/how-cpp-resolves-a-function-call" target="_blank" rel="noopener">How C++ Resolves a Function Call</a></li>
</ul>
