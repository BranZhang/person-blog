---
title: "Quadtrees and Collision Detection"
description: "Designing a quadtree for spatial partitioning, range queries, and collision detection, with implementation tradeoffs in C++."
pubDatetime: 2023-08-05T09:53:00.000Z
modDatetime: 2025-03-10T14:00:29.000Z
draft: false
hiddenLocales: ["zh-cn"]
tags: ["C++", "GIS", "Quadtrees", "Spatial Indexing", "Algorithms"]
---

This article presents a quadtree implementation and the design decisions behind it.

A quadtree is a versatile spatial-partitioning structure. It provides good insertion, removal, and query performance, which makes it useful in dynamic environments where objects move frequently. The concept is also relatively easy to understand and implement. For background, see [Spatial Partition](https://gameprogrammingpatterns.com/spatial-partition.html).

In 2D systems such as GIS applications and planar games, a quadtree can immediately improve several workloads:

- **Collision detection:** much more efficient than testing every object pair, although specialized algorithms may perform better for particular cases.
- **Scene management:** quickly find visible nodes during culling.
- **Lighting:** find walls intersecting a light's visible region.
- **Proximity queries:** retrieve objects near an entity or point.

That versatility makes a quadtree a valuable general-purpose tool.

## Supporting Types

The implementation uses two basic generic types:

- **`Vector2`:** a 2D point or vector.
- **`Box`:** an axis-aligned rectangular region.

Both are class templates.

### Vector2

`Vector2` only needs a constructor and the `+` and `/` operators:

```cpp
template<typename T>
class Vector2
{
public:
    T x;
    T y;

    constexpr Vector2<T>(T X = 0, T Y = 0) noexcept : x(X), y(Y)
    {

    }

    constexpr Vector2<T>& operator+=(const Vector2<T>& other) noexcept
    {
        x += other.x;
        y += other.y;
        return *this;
    }

    constexpr Vector2<T>& operator/=(T t) noexcept
    {
        x /= t;
        y /= t;
        return *this;
    }
};

template<typename T>
constexpr Vector2<T> operator+(Vector2<T> lhs, const Vector2<T>& rhs) noexcept
{
    lhs += rhs;
    return lhs;
}

template<typename T>
constexpr Vector2<T> operator/(Vector2<T> vec, T t) noexcept
{
    vec /= t;
    return vec;
}
```

### Box

`Box` adds a few more operations:

```cpp
template<typename T>
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

    constexpr Box(const Vector2<T>& position, const Vector2<T>& size) noexcept :
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

    constexpr Vector2<T> getTopLeft() const noexcept
    {
        return Vector2<T>(left, top);
    }

    constexpr Vector2<T> getCenter() const noexcept
    {
        return Vector2<T>(left + width / 2, top + height / 2);
    }

    constexpr Vector2<T> getSize() const noexcept
    {
        return Vector2<T>(width, height);
    }

    constexpr bool contains(const Box<T>& box) const noexcept
    {
        return left <= box.left && box.getRight() <= getRight() &&
            top <= box.top && box.getBottom() <= getBottom();
    }

    constexpr bool intersects(const Box<T>& box) const noexcept
    {
        return !(left >= box.getRight() || getRight() <= box.left ||
            top >= box.getBottom() || getBottom() <= box.top);
    }
};
```

Besides accessors, it provides `contains` to test full containment and `intersects` to test overlap.

Insertion and removal use `contains`; collision queries use `intersects`.

## Quadtree Structure

The `Quadtree` skeleton is:

```cpp
template<typename T, typename GetBox, typename Equal = std::equal_to<T>, typename Float = float>
class Quadtree
{
    static_assert(std::is_convertible_v<std::invoke_result_t<GetBox, const T&>, Box<Float>>,
        "GetBox must be a callable of signature Box<Float>(const T&)");
    static_assert(std::is_convertible_v<std::invoke_result_t<Equal, const T&, const T&>, bool>,
        "Equal must be a callable of signature bool(const T&, const T&)");
    static_assert(std::is_arithmetic_v<Float>);

public:
    Quadtree(const Box<Float>& box, const GetBox& getBox = GetBox(),
        const Equal& equal = Equal()) :
        mBox(box), mRoot(std::make_unique<Node>()), mGetBox(getBox), mEqual(equal)
    {

    }

private:
    static constexpr auto Threshold = std::size_t(16);
    static constexpr auto MaxDepth = std::size_t(8);

    struct Node
    {
        std::array<std::unique_ptr<Node>, 4> children;
        std::vector<T> values;
    };

    Box<Float> mBox;
    std::unique_ptr<Node> mRoot;
    GetBox mGetBox;
    Equal mEqual;

    bool isLeaf(const Node* node) const
    {
        return !static_cast<bool>(node->children[0]);
    }
};
```

`Quadtree` is a class template so that it can serve several application domains.

Its template parameters are:

- `T`: the stored value type. Because values are stored directly, this should be lightweight, such as a pointer or small POD type.
- `GetBox`: a callable mapping a `T` value to its bounding `Box`.
- `Equal`: a callable comparing two values, defaulting to standard equality.
- `Float`: the numeric type used for spatial calculations, defaulting to `float`.

The `static_assert` declarations validate those contracts at compile time.

A node contains four child pointers and a vector of values. It does not store its bounding box or depth; those are derived during traversal. Benchmarks showed no performance loss from recomputing them, while the smaller node saves memory.

`isLeaf` checks only the first child because all four child pointers are either null or initialized together.

The member variables are:

- `mBox`: the global bounds containing every inserted value.
- `mRoot`: the root node.
- `mGetBox`: the value-to-bounds callable.
- `mEqual`: the equality callable.

The constructor initializes these members and creates the root.

Two constants control subdivision:

- `Threshold`: the maximum number of values before a node attempts to split.
- `MaxDepth`: the depth at which splitting stops to prevent harmful over-partitioning.

The defaults work well for many workloads but can be tuned.

## Insertion and Removal

There are two common policies for deciding where values are stored:

- **Leaves only:** a value intersecting several leaves is duplicated into all of them.
- **Any node:** a value is stored in the smallest node that fully contains its bounds.

The leaves-only policy queries quickly when all bounds are similarly small, but large objects create a severe degenerate case. An object covering the whole tree is copied into every leaf. Inserting `Threshold` such objects forces subdivision to `MaxDepth` and stores roughly `Threshold × 4`<sup>`MaxDepth`</sup> value copies.

Insertion and removal also become slower because every intersecting leaf must be updated.

The any-node policy avoids this degeneration and behaves more predictably across workloads, especially dynamic scenes that repeatedly remove and reinsert moving entities. This implementation uses that policy.

Two helpers locate the correct node.

#### computeBox

`computeBox` derives a child's bounds from its parent bounds and quadrant index.

```cpp
Box<Float> computeBox(const Box<Float>& box, int i) const
{
    auto origin = box.getTopLeft();
    auto childSize = box.getSize() / static_cast<Float>(2);
    switch (i)
    {
        // North West
        case 0:
            return Box<Float>(origin, childSize);
        // Norst East
        case 1:
            return Box<Float>(Vector2<Float>(origin.x + childSize.x, origin.y), childSize);
        // South West
        case 2:
            return Box<Float>(Vector2<Float>(origin.x, origin.y + childSize.y), childSize);
        // South East
        case 3:
            return Box<Float>(origin + childSize, childSize);
        default:
            assert(false && "Invalid child index");
            return Box<Float>();
    }
}
```

#### getQuadrant

`getQuadrant` returns the quadrant that fully contains a value:

```cpp
int getQuadrant(const Box<Float>& nodeBox, const Box<Float>& valueBox) const
{
    auto center = nodeBox.getCenter();
    // West
    if (valueBox.getRight() < center.x)
    {
        // North West
        if (valueBox.getBottom() < center.y)
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
        if (valueBox.getBottom() < center.y)
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
}
```

It returns `-1` when no quadrant fully contains the value.

These helpers support both insertion and removal.

### Insertion

The public `add` method delegates to a recursive helper:

```cpp
void add(const T& value)
{
    add(mRoot.get(), 0, mBox, value);
}
```

The helper is:

```cpp
void add(Node* node, std::size_t depth, const Box<Float>& box, const T& value)
{
    assert(node != nullptr);
    assert(box.contains(mGetBox(value)));
    if (isLeaf(node))
    {
        // Insert the value in this node if possible
        if (depth >= MaxDepth || node->values.size() < Threshold)
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
            add(node->children[static_cast<std::size_t>(i)].get(), depth + 1, computeBox(box, i), value);
        // Otherwise, we add the value in the current node
        else
            node->values.push_back(value);
    }
}
```

Assertions reject invalid operations such as inserting a value into a node that does not contain its bounds.

If the node is a leaf and either has capacity or is already at `MaxDepth`, the value is appended. Otherwise, the node splits and insertion is retried.

For an interior node, a value fully contained by one child recurses into that child. A value crossing quadrant boundaries remains in the current node.

Splitting works as follows:

```cpp
void split(Node* node, const Box<Float>& box)
{
    assert(node != nullptr);
    assert(isLeaf(node) && "Only leaves can be split");
    // Create children
    for (auto& child : node->children)
        child = std::make_unique<Node>();
    // Assign values to children
    auto newValues = std::vector<T>(); // New values for this node
    for (const auto& value : node->values)
    {
        auto i = getQuadrant(box, mGetBox(value));
        if (i != -1)
            node->children[static_cast<std::size_t>(i)]->values.push_back(value);
        else
            newValues.push_back(value);
    }
    node->values = std::move(newValues);
}
```

The method creates four children, then redistributes every existing value into a child when possible and keeps cross-boundary values in the parent.

### Removal

The public `remove` method likewise delegates to a helper.

```cpp
void remove(const T& value)
{
    remove(mRoot.get(), mBox, value);
}
```

Its recursive structure mirrors insertion:

```cpp
bool remove(Node* node, const Box<Float>& box, const T& value)
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
            if (remove(node->children[static_cast<std::size_t>(i)].get(), computeBox(box, i), value))
                return tryMerge(node);
        }
        // Otherwise, we remove the value from the current node
        else
            removeValue(node, value);
        return false;
    }
}
```

At a leaf, the value is removed and `true` tells the parent to consider merging. At an interior node, the method recurses into a fully containing child or removes a cross-boundary value from the current node. A successful child removal may trigger a merge.

Because value order is irrelevant, removal swaps the target with the last element and calls `pop_back`, making the erase itself O(1) after lookup.

```cpp
void removeValue(Node* node, const T& value)
{
    // Find the value in node->values
    auto it = std::find_if(std::begin(node->values), std::end(node->values),
        [this, &value](const auto& rhs){ return mEqual(value, rhs); });
    assert(it != std::end(node->values) && "Trying to remove a value that is not present in the node");
    // Swap with the last element and pop back
    *it = std::move(node->values.back());
    node->values.pop_back();
}
```

The merge helper is:

```cpp
void tryMerge(Node* node)
{
    assert(node != nullptr);
    assert(!isLeaf(node) && "Only interior nodes can be merged");
    auto nbValues = node->values.size();
    for (const auto& child : node->children)
    {
        if (!isLeaf(child.get()))
            return false;
        nbValues += child->values.size();
    }
    if (nbValues <= Threshold)
    {
        node->values.reserve(nbValues);
        // Merge the values of all the children
        for (const auto& child : node->children)
        {
            for (const auto& value : child->values)
                node->values.push_back(value);
        }
        // Remove the children
        for (auto& child : node->children)
            child.reset();
        return true;
    }
    else
        return false;
}
```

`tryMerge` first requires all children to be leaves. If the combined number of values in the node and its children is at most `Threshold`, it moves child values back to the parent, deletes the children, and returns `true` so that the next ancestor can consider merging too.

## Querying Intersections

### Querying a Bounding Box

The first query returns every value intersecting a given box, which can be used for view culling.

```cpp
std::vector<T> query(const Box<Float>& box) const
{
    auto values = std::vector<T>();
    query(mRoot.get(), mBox, box, values);
    return values;
}
```

The public method initializes the result vector and invokes the recursive traversal:

```cpp
void query(Node* node, const Box<Float>& box, const Box<Float>& queryBox, std::vector<T>& values) const
{
    assert(node != nullptr);
    assert(queryBox.intersects(box));
    for (const auto& value : node->values)
    {
        if (queryBox.intersects(mGetBox(value)))
            values.push_back(value);
    }
    if (!isLeaf(node))
    {
        for (auto i = std::size_t(0); i < node->children.size(); ++i)
        {
            auto childBox = computeBox(box, static_cast<int>(i));
            if (queryBox.intersects(childBox))
                query(node->children[i].get(), childBox, queryBox, values);
        }
    }
}
```

The traversal tests values stored in the current node, then recurses only into children whose bounds intersect the query. Nonintersecting branches are pruned immediately.

## Finding Every Intersecting Pair

Another common operation finds every intersecting pair in the tree. Calling `query` for every value would discover each pair repeatedly, so a dedicated traversal records each pair once.

An intersecting pair can occur in only two storage relationships:

- Both values are stored in the same node.
- One value is stored in a node and the other in one of its descendants.

Therefore the traversal only needs to:

- Test unique pairs within the current node.
- Test current-node values against values in descendant nodes.

This guarantees that each intersecting pair is recorded exactly once.

```cpp
std::vector<std::pair<T, T>> findAllIntersections() const
{
    auto intersections = std::vector<std::pair<T, T>>();
    findAllIntersections(mRoot.get(), intersections);
    return intersections;
}
```

`findAllIntersections` initializes the result vector and starts the recursive traversal.

```cpp
void findAllIntersections(Node* node, std::vector<std::pair<T, T>>& intersections) const
{
    // Find intersections between values stored in this node
    // Make sure to not report the same intersection twice
    for (auto i = std::size_t(0); i < node->values.size(); ++i)
    {
        for (auto j = std::size_t(0); j < i; ++j)
        {
            if (mGetBox(node->values[i]).intersects(mGetBox(node->values[j])))
                intersections.emplace_back(node->values[i], node->values[j]);
        }
    }
    if (!isLeaf(node))
    {
        // Values in this node can intersect values in descendants
        for (const auto& child : node->children)
        {
            for (const auto& value : node->values)
                findIntersectionsInDescendants(child.get(), value, intersections);
        }
        // Find intersections in children
        for (const auto& child : node->children)
            findAllIntersections(child.get(), intersections);
    }
}
```

It first checks pairs within the node. For an interior node, it then compares the node's values with descendant values through `findIntersectionsInDescendants`, and finally processes each child recursively.

`findIntersectionsInDescendants` compares one value with every relevant value in a subtree, producing all unique pairs without redundant full-tree queries.

```cpp
void findIntersectionsInDescendants(Node* node, const T& value, std::vector<std::pair<T, T>>& intersections) const
{
    // Test against the values stored in this node
    for (const auto& other : node->values)
    {
        if (mGetBox(value).intersects(mGetBox(other)))
            intersections.emplace_back(value, other);
    }
    // Test against values stored into descendants of this node
    if (!isLeaf(node))
    {
        for (const auto& child : node->children)
            findIntersectionsInDescendants(child.get(), value, intersections);
    }
}
```

## Summary

This completes the collision-detection workflow. For a deeper treatment of collision detection and spatial-partitioning structures, see Christer Ericson's _Real-Time Collision Detection_.

## References

- [Spatial Partition](https://gameprogrammingpatterns.com/spatial-partition.html)
