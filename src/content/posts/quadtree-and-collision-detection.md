---
title: "四叉树与碰撞检测"
description: "在本文中，我将分享我的四叉树实现以及在设计过程中产生的一些思考。 首先，我想讨论为什么我决定实现四叉树。四叉树是一种空间分割数据结构。与其他数据结构相比，它的主要优势在于其多功能性&hellip;"
pubDatetime: 2023-08-05T09:53:00.000Z
modDatetime: 2025-03-10T14:00:29.000Z
author: "Zhang"
tags:
  - "C++"
  - "gis"
  - "算法"
canonicalURL: "https://littlepotato.me/2023/08/05/quadtree-and-collision-detection/"
---

<p class="wp-block-paragraph">在本文中，我将分享我的四叉树实现以及在设计过程中产生的一些思考。</p>

<p class="wp-block-paragraph">首先，我想讨论为什么我决定实现四叉树。四叉树是一种空间分割数据结构。与其他数据结构相比，它的主要优势在于其多功能性。四叉树在插入、删除和查找操作上都能提供良好的性能，因此可以用于数据频繁变化的动态环境。此外，它的概念相对容易理解，实现起来也不算复杂。如果你对空间分割完全不了解，我建议你阅读一下《<a href="https://gameprogrammingpatterns.com/spatial-partition.html" target="_blank" rel="noopener">Spatial Partition</a>》。</p>

<!--more-->

<p class="wp-block-paragraph">在2D世界，比如GIS系统或者平面的游戏中，有几个场景使用四叉树可以立即带来性能提升：</p>

<ul class="wp-block-list">
<li><strong>碰撞检测</strong>：使用四叉树比暴力遍历所有对象的方式高效得多，尽管它并非最优解。如果有需要，可以使用更专业的算法。</li>

<li><strong>场景管理（Scene Graph）</strong>：在执行裁剪（Culling）时，我可以使用四叉树来快速找到可见的节点。</li>

<li><strong>光照系统</strong>：我可以使用四叉树找到与光源可见区域相交的墙体。</li>

<li><strong>点位检索</strong>：可以使用四叉树找到接近某个实体的所有对象。</li>
</ul>

<p class="wp-block-paragraph">正如你所看到的，四叉树非常<strong>多功能</strong>，是一个值得加入工具箱的好用数据结构。</p>

<h2 class="wp-block-heading">预备知识</h2>

<p class="wp-block-paragraph">在详细介绍四叉树的代码之前，我们需要一些基础的数据结构：</p>

<ul class="wp-block-list">
<li><strong><code>Vector2</code> 类</strong>：用于表示二维点。</li>

<li><strong><code>Box</code> 类</strong>：用于表示矩形区域。</li>
</ul>

<p class="wp-block-paragraph">这两个类都将使用模板进行泛型化处理。</p>

<h3 class="wp-block-heading">Vector2</h3>

<p class="wp-block-paragraph"><code>Vector2</code> 类是一个精简的类，它仅包含构造函数以及 <code>+</code> 和 <code>/</code> 运算符，这已经满足我们的需求：</p>

<pre class="EnlighterJSRAW" data-enlighter-language="cpp" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">template&lt;typename T>
class Vector2
{
public:
    T x;
    T y;

    constexpr Vector2&lt;T>(T X = 0, T Y = 0) noexcept : x(X), y(Y)
    {

    }

    constexpr Vector2&lt;T>&amp; operator+=(const Vector2&lt;T>&amp; other) noexcept
    {
        x += other.x;
        y += other.y;
        return *this;
    }

    constexpr Vector2&lt;T>&amp; operator/=(T t) noexcept
    {
        x /= t;
        y /= t;
        return *this;
    }
};

template&lt;typename T>
constexpr Vector2&lt;T> operator+(Vector2&lt;T> lhs, const Vector2&lt;T>&amp; rhs) noexcept
{
    lhs += rhs;
    return lhs;
}

template&lt;typename T>
constexpr Vector2&lt;T> operator/(Vector2&lt;T> vec, T t) noexcept
{
    vec /= t;
    return vec;
}</pre>

<h3 class="wp-block-heading">Box</h3>

<p class="wp-block-paragraph"><code>Box</code> 类稍微复杂一些，但也不会太难理解：</p>

<pre class="EnlighterJSRAW" data-enlighter-language="cpp" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">template&lt;typename T>
class Box
{
public:
    T left;
    T top;
    T width; // Must be positive
    T height; // Must be positive

    constexpr Box(T Left = 0, T Top = 0, T Width = 0, T Height = 0) noexcept :
        left(Left), top(Top), width(Width), height(Height)
    {

    }

    constexpr Box(const Vector2&lt;T>&amp; position, const Vector2&lt;T>&amp; size) noexcept :
        left(position.x), top(position.y), width(size.x), height(size.y)
    {

    }

    constexpr T getRight() const noexcept
    {
        return left + width;
    }

    constexpr T getBottom() const noexcept
    {
        return top + height;
    }

    constexpr Vector2&lt;T> getTopLeft() const noexcept
    {
        return Vector2&lt;T>(left, top);
    }

    constexpr Vector2&lt;T> getCenter() const noexcept
    {
        return Vector2&lt;T>(left + width / 2, top + height / 2);
    }

    constexpr Vector2&lt;T> getSize() const noexcept
    {
        return Vector2&lt;T>(width, height);
    }

    constexpr bool contains(const Box&lt;T>&amp; box) const noexcept
    {
        return left &lt;= box.left &amp;&amp; box.getRight() &lt;= getRight() &amp;&amp;
            top &lt;= box.top &amp;&amp; box.getBottom() &lt;= getBottom();
    }

    constexpr bool intersects(const Box&lt;T>&amp; box) const noexcept
    {
        return !(left >= box.getRight() || getRight() &lt;= box.left ||
            top >= box.getBottom() || getBottom() &lt;= box.top);
    }
};</pre>

<p class="wp-block-paragraph">它包含了一些有用的 getter 方法。更有趣的是，它提供了 <code>contains</code> 方法（用于检查一个矩形是否被另一个矩形包含）和 <code>intersects</code> 方法（用于检测两个矩形是否相交）。</p>

<p class="wp-block-paragraph">在插入和删除操作中，我们会使用 <code>contains</code> 方法，而 <code>intersects</code> 方法则用于碰撞检测。</p>

<h2 class="wp-block-heading">四叉树（Quadtree）</h2>

<p class="wp-block-paragraph">下面是 <code>Quadtree</code> 类的基本框架：</p>

<pre class="EnlighterJSRAW" data-enlighter-language="cpp" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">template&lt;typename T, typename GetBox, typename Equal = std::equal_to&lt;T>, typename Float = float>
class Quadtree
{
    static_assert(std::is_convertible_v&lt;std::invoke_result_t&lt;GetBox, const T&amp;>, Box&lt;Float>>,
        "GetBox must be a callable of signature Box&lt;Float>(const T&amp;)");
    static_assert(std::is_convertible_v&lt;std::invoke_result_t&lt;Equal, const T&amp;, const T&amp;>, bool>,
        "Equal must be a callable of signature bool(const T&amp;, const T&amp;)");
    static_assert(std::is_arithmetic_v&lt;Float>);

public:
    Quadtree(const Box&lt;Float>&amp; box, const GetBox&amp; getBox = GetBox(),
        const Equal&amp; equal = Equal()) :
        mBox(box), mRoot(std::make_unique&lt;Node>()), mGetBox(getBox), mEqual(equal)
    {

    }

private:
    static constexpr auto Threshold = std::size_t(16);
    static constexpr auto MaxDepth = std::size_t(8);

    struct Node
    {
        std::array&lt;std::unique_ptr&lt;Node>, 4> children;
        std::vector&lt;T> values;
    };

    Box&lt;Float> mBox;
    std::unique_ptr&lt;Node> mRoot;
    GetBox mGetBox;
    Equal mEqual;

    bool isLeaf(const Node* node) const
    {
        return !static_cast&lt;bool>(node->children[0]);
    }
};</pre>

<p class="wp-block-paragraph">正如你所看到的，<code>Quadtree</code> 是一个模板类。这使得我们可以在不同的场景下使用它，正如我在介绍部分所提到的。</p>

<p class="wp-block-paragraph"><code>Quadtree</code> 具有以下模板参数：</p>

<ul class="wp-block-list">
<li><code>T</code>：存储在四叉树中的值的类型。由于 <code>T</code> 将直接存储在四叉树中，因此它应该是轻量级的类型，例如指针或小型 POD（Plain Old Data）类型。</li>

<li><code>GetBox</code>：一个可调用对象的类型，它接受 <code>T</code> 类型的值作为输入，并返回一个 <code>Box</code>（边界框）。</li>

<li><code>Equal</code>：一个可调用对象的类型，用于比较两个值是否相等。默认情况下，它使用标准的 <code>operator==</code> 进行比较。</li>

<li><code>Float</code>：用于计算的数值类型，默认使用 <code>float</code>。</li>
</ul>

<p class="wp-block-paragraph">在类的开头，我们使用了静态断言（<code>static_assert</code>）来验证传入的模板参数是否合法。</p>

<p class="wp-block-paragraph">让我们看看<strong>四叉树节点</strong>的定义：节点包含四个子节点的指针，以及它所包含的值的列表。不会存储其边界框（bounding box）或深度（depth），这些信息将在需要时动态计算。性能测试表明：在 <code>Node</code> 结构中不存储 <code>bounding box</code> 和 <code>depth</code>，并不会影响性能，同时还能节省内存。</p>

<p class="wp-block-paragraph">为了区分内部节点（interior node）和叶子节点（leaf node），我们定义了 <code>isLeaf</code> 方法：它检查第一个子节点是否为空。由于所有子节点要么都是 <code>nullptr</code>，要么都不是，因此只需检查第一个子节点即可。</p>

<p class="wp-block-paragraph"><code>Quadtree</code> 具有以下成员变量：</p>

<ul class="wp-block-list">
<li><code>mBox</code>：全局边界框（bounding box），所有插入四叉树的值都必须位于这个边界内。</li>

<li><code>mRoot</code>：四叉树的根节点（root node）。</li>

<li><code>mGetBox</code>：用于从值中获取 <code>Box</code> 的可调用对象。</li>

<li><code>mEqual</code>：用于比较两个值是否相等的可调用对象。</li>
</ul>

<p class="wp-block-paragraph">构造函数会初始化 <code>mBox</code>、<code>mGetBox</code> 和 <code>mEqual</code>，并创建<strong>根节点</strong>。</p>

<p class="wp-block-paragraph">还有两个我们尚未讨论的参数：</p>

<ul class="wp-block-list">
<li><code>Threshold</code>：每个节点最多能存储的值的数量。超过此阈值后，节点会尝试分裂（split）。</li>

<li><code>MaxDepth</code>：最大深度。当一个节点的深度达到 <code>MaxDepth</code> 时，我们会停止分裂，以防止过度划分影响性能。</li>
</ul>

<p class="wp-block-paragraph">这些参数的默认值已经过优化，适用于大多数场景。但也可以根据特定需求进行调整。现在，我们已经完成了 <code>Quadtree</code> 的基础部分，可以深入研究更有趣的操作了！</p>

<h2 class="wp-block-heading">插入和删除</h2>

<p class="wp-block-paragraph">在展示插入的代码之前，我们需要讨论哪些节点会存储值。关于这个问题，有两种策略：</p>

<ul class="wp-block-list">
<li>仅叶子节点存储值：由于某个值的边界框（bounding box）可能会与多个叶子节点相交，因此它会被存储在所有相交的叶子节点中。</li>

<li>所有节点都可以存储值：值会存储在最小的完全包含其边界框的节点中。</li>
</ul>

<p class="wp-block-paragraph">哪种策略更好？如果所有的边界框都很小且大小相近，第一种策略在查找相交情况时效率更高。但是，如果存在较大的边界框，第一种策略可能会导致性能问题：例如，如果插入一个覆盖整个四叉树的值，它将被存储在所有叶子节点中。如果插入 <code>Threshold</code> 个这样的值，所有的节点都会持续分裂，直到达到 <code>MaxDepth</code>，所有叶子节点都会存储这些值。这会导致四叉树中存储的值数量达到 Threshold × 4<sup>MaxDepth</sup>，这将是一个非常庞大的数值。</p>

<p class="wp-block-paragraph">此外，第一种策略在插入和删除时会更慢，因为我们需要在所有相交的叶子节点中执行操作。</p>

<p class="wp-block-paragraph">第二种策略不会有退化情况（degenerate case），因此它是更稳定的选择。由于我计划在多个不同的场景中使用四叉树，这种策略更加通用。特别是在动态场景中（如某个实体会频繁的移动），我们需要频繁插入和删除值，因此第二种策略更合适。</p>

<p class="wp-block-paragraph">为了找到应该插入或删除值的节点，我们将依赖于两个实用函数：</p>

<h4 class="wp-block-heading">computeBox</h4>

<p class="wp-block-paragraph">该函数用于计算子节点的边界框，它根据父节点的边界框以及该子节点所在的象限索引来计算。</p>

<pre class="EnlighterJSRAW" data-enlighter-language="cpp" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">Box&lt;Float> computeBox(const Box&lt;Float>&amp; box, int i) const
{
    auto origin = box.getTopLeft();
    auto childSize = box.getSize() / static_cast&lt;Float>(2);
    switch (i)
    {
        // North West
        case 0:
            return Box&lt;Float>(origin, childSize);
        // Norst East
        case 1:
            return Box&lt;Float>(Vector2&lt;Float>(origin.x + childSize.x, origin.y), childSize);
        // South West
        case 2:
            return Box&lt;Float>(Vector2&lt;Float>(origin.x, origin.y + childSize.y), childSize);
        // South East
        case 3:
            return Box&lt;Float>(origin + childSize, childSize);
        default:
            assert(false &amp;&amp; "Invalid child index");
            return Box&lt;Float>();
    }
}</pre>

<h4 class="wp-block-heading">getQuadrant</h4>

<p class="wp-block-paragraph">返回某个值所在的象限（Quadrant）：</p>

<pre class="EnlighterJSRAW" data-enlighter-language="cpp" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">int getQuadrant(const Box&lt;Float>&amp; nodeBox, const Box&lt;Float>&amp; valueBox) const
{
    auto center = nodeBox.getCenter();
    // West
    if (valueBox.getRight() &lt; center.x)
    {
        // North West
        if (valueBox.getBottom() &lt; center.y)
            return 0;
        // South West
        else if (valueBox.top >= center.y)
            return 2;
        // Not contained in any quadrant
        else
            return -1;
    }
    // East
    else if (valueBox.left >= center.x)
    {
        // North East
        if (valueBox.getBottom() &lt; center.y)
            return 1;
        // South East
        else if (valueBox.top >= center.y)
            return 3;
        // Not contained in any quadrant
        else
            return -1;
    }
    // Not contained in any quadrant
    else
        return -1;
}</pre>

<p class="wp-block-paragraph">如果该值没有完全包含在任何一个象限内，则返回 <code>-1</code>。</p>

<p class="wp-block-paragraph">现在，我们已经准备好来看插入（Insertion）和删除（Removal）的方法了。</p>

<h3 class="wp-block-heading">节点插入</h3>

<p class="wp-block-paragraph"><code>add</code> 方法只是调用了一个私有辅助方法：</p>

<pre class="EnlighterJSRAW" data-enlighter-language="cpp" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">void add(const T&amp; value)
{
    add(mRoot.get(), 0, mBox, value);
}</pre>

<p class="wp-block-paragraph">下面是该辅助方法的代码：</p>

<pre class="EnlighterJSRAW" data-enlighter-language="cpp" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">void add(Node* node, std::size_t depth, const Box&lt;Float>&amp; box, const T&amp; value)
{
    assert(node != nullptr);
    assert(box.contains(mGetBox(value)));
    if (isLeaf(node))
    {
        // Insert the value in this node if possible
        if (depth >= MaxDepth || node->values.size() &lt; Threshold)
            node->values.push_back(value);
        // Otherwise, we split and we try again
        else
        {
            split(node, box);
            add(node, depth, box, value);
        }
    }
    else
    {
        auto i = getQuadrant(box, mGetBox(value));
        // Add the value in a child if the value is entirely contained in it
        if (i != -1)
            add(node->children[static_cast&lt;std::size_t>(i)].get(), depth + 1, computeBox(box, i), value);
        // Otherwise, we add the value in the current node
        else
            node->values.push_back(value);
    }
}</pre>

<p class="wp-block-paragraph">首先，我们进行一些断言，以确保不会执行无意义的操作，例如尝试将一个值插入到不包含其边界框的节点中。</p>

<p class="wp-block-paragraph">然后，如果该节点是叶子节点，并且可以插入新值（即当前深度已经达到 <code>MaxDepth</code> 或者未达到 <code>Threshold</code>），则直接插入。否则，我们会拆分（split）该节点，然后重新尝试插入。</p>

<p class="wp-block-paragraph">如果该节点是一个内部节点，我们会计算该值的边界框所在的象限（quadrant）：如果它完全包含在某个子节点内，我们进行递归调用，将其插入该子节点。否则，我们直接插入到当前节点。</p>

<p class="wp-block-paragraph">最后，我们来看拆分（split）过程的代码：</p>

<pre class="EnlighterJSRAW" data-enlighter-language="cpp" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">void split(Node* node, const Box&lt;Float>&amp; box)
{
    assert(node != nullptr);
    assert(isLeaf(node) &amp;&amp; "Only leaves can be split");
    // Create children
    for (auto&amp; child : node->children)
        child = std::make_unique&lt;Node>();
    // Assign values to children
    auto newValues = std::vector&lt;T>(); // New values for this node
    for (const auto&amp; value : node->values)
    {
        auto i = getQuadrant(box, mGetBox(value));
        if (i != -1)
            node->children[static_cast&lt;std::size_t>(i)]->values.push_back(value);
        else
            newValues.push_back(value);
    }
    node->values = std::move(newValues);
}</pre>

<p class="wp-block-paragraph">我们创建四个子节点。然后，遍历父节点的所有值，决定应将它们放入子节点还是留在父节点。</p>

<h3 class="wp-block-heading">节点删除</h3>

<p class="wp-block-paragraph">同样，<code>remove</code> 方法只是调用了一个辅助方法。</p>

<pre class="EnlighterJSRAW" data-enlighter-language="cpp" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">void remove(const T&amp; value)
{
    remove(mRoot.get(), mBox, value);
}</pre>

<p class="wp-block-paragraph">下面是该辅助方法的代码，它与插入操作非常相似：</p>

<pre class="EnlighterJSRAW" data-enlighter-language="cpp" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">bool remove(Node* node, const Box&lt;Float>&amp; box, const T&amp; value)
{
    assert(node != nullptr);
    assert(box.contains(mGetBox(value)));
    if (isLeaf(node))
    {
        // Remove the value from node
        removeValue(node, value);
        return true;
    }
    else
    {
        // Remove the value in a child if the value is entirely contained in it
        auto i = getQuadrant(box, mGetBox(value));
        if (i != -1)
        {
            if (remove(node->children[static_cast&lt;std::size_t>(i)].get(), computeBox(box, i), value))
                return tryMerge(node);
        }
        // Otherwise, we remove the value from the current node
        else
            removeValue(node, value);
        return false;
    }
}</pre>

<p class="wp-block-paragraph">如果当前节点是叶子节点，我们会从其值列表中移除该值，并返回 <code>true</code>。返回值 <code>true</code> 会通知其父节点，提示它尝试与子节点合并。否则，我们确定该值的边界框所在的象限（quadrant）：如果它完全包含在某个子节点内，我们递归调用 <code>remove</code>，并在需要时尝试合并当前节点。否则，我们直接从当前节点的值列表中删除该值。</p>

<p class="wp-block-paragraph">由于我们不关心节点中存储值的顺序，因此在删除值时可以做一个小优化：直接用最后一个值替换要删除的值，并弹出（pop back） 最后一个值，这样删除操作的时间复杂度为 O(1)。</p>

<pre class="EnlighterJSRAW" data-enlighter-language="cpp" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">void removeValue(Node* node, const T&amp; value)
{
    // Find the value in node->values
    auto it = std::find_if(std::begin(node->values), std::end(node->values),
        [this, &amp;value](const auto&amp; rhs){ return mEqual(value, rhs); });
    assert(it != std::end(node->values) &amp;&amp; "Trying to remove a value that is not present in the node");
    // Swap with the last element and pop back
    *it = std::move(node->values.back());
    node->values.pop_back();
}</pre>

<p class="wp-block-paragraph">最后，看一下 <code>tryMerge</code> 方法：</p>

<pre class="EnlighterJSRAW" data-enlighter-language="cpp" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">void tryMerge(Node* node)
{
    assert(node != nullptr);
    assert(!isLeaf(node) &amp;&amp; "Only interior nodes can be merged");
    auto nbValues = node->values.size();
    for (const auto&amp; child : node->children)
    {
        if (!isLeaf(child.get()))
            return false;
        nbValues += child->values.size();
    }
    if (nbValues &lt;= Threshold)
    {
        node->values.reserve(nbValues);
        // Merge the values of all the children
        for (const auto&amp; child : node->children)
        {
            for (const auto&amp; value : child->values)
                node->values.push_back(value);
        }
        // Remove the children
        for (auto&amp; child : node->children)
            child.reset();
        return true;
    }
    else
        return false;
}</pre>

<p class="wp-block-paragraph"><code>tryMerge</code> 方法用于检查是否可以合并子节点，确保该节点的所有子节点都是叶子节点。计算当前节点及其所有子节点的总值数量，如果小于 <code>Threshold</code>，则：将所有子节点的值拷贝回当前节点；删除子节点，使当前节点重新成为叶子节点；返回 <code>true</code>，通知父节点尝试与其子节点合并。</p>

<h2 class="wp-block-heading">查找相交对象</h2>

<h3 class="wp-block-heading">与边界框（Box）的相交检测</h3>

<p class="wp-block-paragraph">终于到了查找相交对象的部分。第一个应用场景是检索所有与给定边界框（Box）相交的值。例如，我们可以利用此方法来执行剔除（Culling）。</p>

<pre class="EnlighterJSRAW" data-enlighter-language="cpp" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">std::vector&lt;T> query(const Box&lt;Float>&amp; box) const
{
    auto values = std::vector&lt;T>();
    query(mRoot.get(), mBox, box, values);
    return values;
}</pre>

<p class="wp-block-paragraph">这个方法的目标是返回所有与查询框相交的值：初始化 <code>std::vector</code>，用于存储与查询框相交的值。初始化 <code>std::vector</code>，用于存储与查询框相交的值。该方法的主要逻辑如下：</p>

<pre class="EnlighterJSRAW" data-enlighter-language="cpp" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">void query(Node* node, const Box&lt;Float>&amp; box, const Box&lt;Float>&amp; queryBox, std::vector&lt;T>&amp; values) const
{
    assert(node != nullptr);
    assert(queryBox.intersects(box));
    for (const auto&amp; value : node->values)
    {
        if (queryBox.intersects(mGetBox(value)))
            values.push_back(value);
    }
    if (!isLeaf(node))
    {
        for (auto i = std::size_t(0); i &lt; node->children.size(); ++i)
        {
            auto childBox = computeBox(box, static_cast&lt;int>(i));
            if (queryBox.intersects(childBox))
                query(node->children[i].get(), childBox, queryBox, values);
        }
    }
}</pre>

<p class="wp-block-paragraph">首先，遍历当前节点的值列表，将所有与查询框相交的值添加到结果中。然后，如果当前节点是内部节点，我们需要递归调用：遍历所有子节点，如果子节点的边界框与查询框相交，则递归查询该子节点。</p>

<h2 class="wp-block-heading">查找所有相交的对象对</h2>

<p class="wp-block-paragraph">另一个常见的用例是查找四叉树中所有相交的值对。虽然可以使用 <code>query</code> 方法来完成此任务（即对所有值的边界框调用 <code>query</code>），但这样做会导致重复查找相交的对象对。我们可以采用更高效的方式，确保每对相交的对象只被添加一次。</p>

<p class="wp-block-paragraph">两两相交的对象只能出现在以下两种情况：</p>

<ul class="wp-block-list">
<li>两个值存储在同一个节点中。</li>

<li>一个值存储在某个节点中，而另一个值存储在该节点的子孙节点中。</li>
</ul>

<p class="wp-block-paragraph">为了避免重复计算，我们只需要：</p>

<ul class="wp-block-list">
<li>检查当前节点内的值对（避免双重计算）。</li>

<li>检查当前节点的值与其所有子节点的值的相交情况。</li>
</ul>

<p class="wp-block-paragraph">这样，我们可以确保每对相交对象仅被记录一次。</p>

<pre class="EnlighterJSRAW" data-enlighter-language="cpp" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">std::vector&lt;std::pair&lt;T, T>> findAllIntersections() const
{
    auto intersections = std::vector&lt;std::pair&lt;T, T>>();
    findAllIntersections(mRoot.get(), intersections);
    return intersections;
}</pre>

<p class="wp-block-paragraph"><code>findAllIntersections</code> 方法初始化 <code>std::vector</code>，用于存储所有相交的值对。并调用辅助方法进行递归查找。</p>

<pre class="EnlighterJSRAW" data-enlighter-language="cpp" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">void findAllIntersections(Node* node, std::vector&lt;std::pair&lt;T, T>>&amp; intersections) const
{
    // Find intersections between values stored in this node
    // Make sure to not report the same intersection twice
    for (auto i = std::size_t(0); i &lt; node->values.size(); ++i)
    {
        for (auto j = std::size_t(0); j &lt; i; ++j)
        {
            if (mGetBox(node->values[i]).intersects(mGetBox(node->values[j])))
                intersections.emplace_back(node->values[i], node->values[j]);
        }
    }
    if (!isLeaf(node))
    {
        // Values in this node can intersect values in descendants
        for (const auto&amp; child : node->children)
        {
            for (const auto&amp; value : node->values)
                findIntersectionsInDescendants(child.get(), value, intersections);
        }
        // Find intersections in children
        for (const auto&amp; child : node->children)
            findAllIntersections(child.get(), intersections);
    }
}</pre>

<p class="wp-block-paragraph">第一步：检查当前节点存储的值之间的相交情况。第二步：如果当前节点是内部节点，检查当前节点存储的值与子节点存储的值之间的相交情况（通过 <code>findIntersectionsInDescendants</code>）。第三步：递归处理子节点。</p>

<p class="wp-block-paragraph"><code>findIntersectionsInDescendants</code> 方法递归查找：给定值 与整个子树中的所有值 之间的相交情况。这样，我们可以高效找到所有唯一的相交对象对，避免冗余计算。</p>

<pre class="EnlighterJSRAW" data-enlighter-language="cpp" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">void findIntersectionsInDescendants(Node* node, const T&amp; value, std::vector&lt;std::pair&lt;T, T>>&amp; intersections) const
{
    // Test against the values stored in this node
    for (const auto&amp; other : node->values)
    {
        if (mGetBox(value).intersects(mGetBox(other)))
            intersections.emplace_back(value, other);
    }
    // Test against values stored into descendants of this node
    if (!isLeaf(node))
    {
        for (const auto&amp; child : node->children)
            findIntersectionsInDescendants(child.get(), value, intersections);
    }
}</pre>

<h2 class="wp-block-heading">总结</h2>

<p class="wp-block-paragraph">至此，我们已经完成了碰撞检测（Collision Detection）的讨论。如果你想深入了解碰撞检测（Collision Detection）和空间划分数据结构（Space Partitioning Data Structures），我推荐阅读 Christer Ericson 的 <em>《<em>Real-Time Collision Detection</em>》</em>。</p>

<h2 class="wp-block-heading">参考资料</h2>

<ul class="wp-block-list">
<li><a href="https://gameprogrammingpatterns.com/spatial-partition.html" target="_blank" rel="noopener">Spatial Partition</a></li>
</ul>
