---
title: "Understanding C++ Rvalue References and std::move"
description: "How rvalue references, std::move, and move semantics improve resource management in modern C++."
pubDatetime: 2022-10-05T13:47:00.000Z
modDatetime: 2025-03-03T14:28:26.000Z
draft: false
hiddenLocales: ["zh-cn"]
tags: ["C++"]
---

C++11 introduced **rvalue references** and `std::move`, two key features that significantly improve resource management in C++, particularly through **move semantics** and **perfect forwarding**.

## Rvalue References

In C++, expressions can be categorized as **lvalues** and **rvalues**:

- An **lvalue** refers to an object with a persistent storage location, such as a variable, an array element, or an object reached through a dereferenced pointer. An lvalue can appear on the left side of an assignment.
- An **rvalue** generally represents a temporary value without a persistent identity, such as the literal `42` or an expression that returns a temporary object.

An rvalue reference is declared with `&&`:

```cpp
int &&r = 10;  // rvalue reference
```

Rvalue references make it possible to **take ownership** of an object's resources without an expensive copy. This enables **move semantics**, in which resources are transferred from one object to another.

Important properties of rvalue references include:

- **Binding to rvalues:** They normally bind to temporary objects and function return values.
- **Resource transfer:** They allow resources such as dynamic memory and file handles to be transferred without a deep copy.

## std::move

`std::move` casts its argument to an rvalue reference. It does not move anything by itself; it tells the compiler that an lvalue may be treated as an rvalue, allowing move operations to participate in overload resolution.

```cpp
T&& std::move(T& x);
```

The cast allows a move constructor or move-assignment operator to be selected.

```text
#include <iostream>
#include <vector>

class MyClass {
public:
    MyClass() { std::cout << "MyClass created!" << std::endl; }
    MyClass(const MyClass&) { std::cout << "MyClass copied!" << std::endl; }
    MyClass(MyClass&&) { std::cout << "MyClass moved!" << std::endl; }
};

int main() {
    MyClass obj1;  // Create an object.
    MyClass obj2 = std::move(obj1);  // Move from obj1 into obj2.
}
```

In this example:

- `std::move(obj1)` casts `obj1` to an rvalue reference.
- The move constructor, rather than the copy constructor, initializes `obj2`.

## Move Semantics

Move semantics transfer an object's resources instead of copying them. Copying a large container or dynamically allocated buffer can be expensive, especially when objects are repeatedly passed to and returned from functions. Moving can eliminate much of that cost.

The **move constructor** and **move-assignment operator** are the two core operations.

Example move constructor:

```text
class MyClass {
public:
    MyClass() { std::cout << "MyClass created!" << std::endl; }
    MyClass(const MyClass&) { std::cout << "MyClass copied!" << std::endl; }
    MyClass(MyClass&& other) {
        std::cout << "MyClass moved!" << std::endl;
        // Transfer resources from other.
    }
};
```

A move constructor typically takes ownership of the source object's resources and leaves the source in a valid but otherwise unspecified state.

Example move-assignment operator:

```text
MyClass& operator=(MyClass&& other) {
    std::cout << "Move assignment!" << std::endl;
    // Release the current resources and transfer resources from other.
    return *this;
}
```

## Use Cases

- **Avoiding unnecessary copies:** Moving large datasets, containers, or resource-owning objects can save both time and memory.
- **Containers and algorithms:** Standard Library containers such as `std::vector` can relocate elements by moving them rather than copying their resources.

## Summary

Rvalue references commonly appear in function parameters. Such a parameter can bind directly to an rvalue or to an lvalue explicitly cast with `std::move`. Used correctly, rvalue references and `std::move` make C++ programs more efficient, especially in code that creates, transfers, and destroys many resource-owning objects.
