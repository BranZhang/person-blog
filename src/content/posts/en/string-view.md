---
title: "Understanding std::string_view"
description: "Using std::string_view for allocation-free string access while avoiding lifetime, ownership, and null-termination pitfalls."
pubDatetime: 2021-08-07T13:24:00.000Z
modDatetime: 2025-02-10T14:07:56.000Z
draft: false
hiddenLocales: ["zh-cn"]
tags: ["C++"]
---

String handling can be cumbersome in older versions of C++. C++17 addressed part of this problem by introducing `std::string_view`.

## std::string

Before discussing why `std::string_view` matters, consider `std::string`. It is a convenient owning wrapper around a contiguous character buffer. It supports storage, modification, iteration, and output. For example:

```cpp
std::string str = "My str";
std::string prefix = "My ";
if (str.compare(0, prefix.size(), pre) == 0) {
    std::cout << str.substr(prefix.size()); // "str"
}
```

The `compare` call is somewhat C-like, but there is another problem: `std::string::substr` allocates a new `std::string`. It leaves the original unchanged and returns a separate owning string, even though this example only needs to inspect the existing characters. Avoiding that allocation requires code such as:

```cpp
for (size_t i = prefox.size(); i < str.size(); ++i) {
    std::cout << str[i];
}
```

Consider another example:

```cpp
bool validate(const std::string& str) {
    std::string start = "lstart", stop = "lstop";
    return str.compare(0, start.size(), start) == 0 && str.compare(str.size() - stop.size(), stop.size(), stop) == 0;
}
```

This performs no string copies, but accidentally omitting `&` from the parameter would introduce one. The verbose, C-style `compare` calls also remain.

## std::string_view (C++17)

Since C++17, `std::string_view` can provide a non-owning view over an existing contiguous character sequence. A substring view can be iterated and compared without allocating another `std::string`, and the resulting syntax is clearer.

```cpp
std::string str = "My str";
std::string prefix = "My ";
std::string_view str_v = str; // no allocation performed
if (str_v.substr(0, prefix.size()) == prefix) { // no allocation
    std::cout << str_v.substr(prefix.size()); // no allocation
}
```

The `validate` function can now accept `std::string_view` by value rather than taking `const std::string&`:

```cpp
bool validate(std::string_view str) {
    std::string start = "lstart", stop = "lstop";
    return str.substr(0, start.size()) == start && str.substr(str.size() - stop.size()) == stop;
}
```

### How It Works

Conceptually, `std::string_view` stores a pointer to the beginning of a character sequence and a length. Its constructor receives those values, and `substr` creates another view with an adjusted pointer and length. Constructing a view from `std::string` obtains the string's underlying sequence without copying its characters.

### String Literals and Character Buffers

`std::string_view` can also be constructed from `char*`, or from a pointer and a `size_t` length. String literals stored in the program binary can therefore be inspected directly without first constructing an owning `std::string`.

```cpp
std::string_view str = "My str"; // no string allocation
std::string_view prefix = "My ";
if (str.substr(0, prefix.size()) == prefix) {
    std::cout << str.substr(prefix.size());
}
bool validate(std::string_view str) {
    std::string_view start = "lstart", stop = "lstop"; // no string allocations
    return str.substr(0, start.size()) == start && str.substr(str.size() - stop.size()) == stop;
}
```

When a view is constructed from `char*` without an explicit length, its length is determined by the first null character (`\0`). This requires care, as discussed below.

## C++20 and C++23 Additions

Newer standards added useful operations to `std::string_view` and `std::string`. C++20 introduced `starts_with` and `ends_with`, which fit the examples above, and C++23 added `contains`:

```cpp
std::string_view str = "My str";
std::string_view prefix = "My ";
if (str.starts_with(prefix)) {
    std::cout << str.substr(prefix.size());
}
bool validate(std::string_view str) {
    return str.starts_with("lstart") && str.ends_with("lstop");
}
```

## Constexpr

These operations can be used in `constexpr` contexts. Because `std::string_view` does not allocate storage, it is particularly useful for compile-time string processing.

```cpp
constexpr std::string_view str = "My str";
constexpr std::string_view prefix = "My ";
if (str.starts_with(prefix)) {
    std::cout << str.substr(prefix.size());
}
constexpr bool validate(std::string_view str) {
    return str.starts_with("lstart") && str.ends_with("lstop");
}
```

## Best Practices

`std::string_view` improves the performance and readability of string analysis, but its non-owning design introduces important safety tradeoffs.

### Rule 1: Never Return a std::string_view

```cpp
std::string_view func() {
    std::string str;
    std::cin >> str;
    return str;
}
```

This harmless-looking function returns a dangling view. `str` owns the allocation containing the input characters. When the function returns, its destructor releases that storage, leaving the returned `std::string_view` pointing to freed memory.

Note that returning `std::string_view` does not always cause unsafe memory access. A view into static storage, or into memory that remains accessible outside the function, is still valid. But such cases can become invalid as code evolves, so the safest practice is to never return `std::string_view` under any circumstances.

### Rule 2: Do Not Assume Null Termination

A view represents a pointer and length, not a null-terminated C string. Keep that distinction in mind.

```cpp
std::string_view str = "my cool str";
str.remove_prefix(str.find(" "));
str.remove_suffix(str.size() - str.rfind(" "));
std::cout << str; // "cool" - OK
std::cout << str.data(); // "cool str"
```

`remove_prefix` and `remove_suffix` only change the view's beginning and length. `remove_suffix` does not insert a null terminator at the new end, so passing `data()` to an API that expects a C string can read beyond the view. Either modify the owning string when appropriate or construct a new `std::string`, which provides its own terminator.

```cpp
{ // Modifying owner
    std::string str = "cool str";
    std::string_view str_v = str;
    str_v.remove_suffix(4);
    str[4] = '\0';

    std::cout << str << "\n"; // "cool\0str"
    std::cout << str_v << "\n"; // "cool"
    std::cout << str_v.data(); // "cool"
}

{ // Allocating a new string
    std::string_view str = "cool str";
    str.remove_suffix(4);
    std::string modified_str(str);
    std::string_view mstr_v = modified_str;

    std::cout << str << "\n"; // "cool"
    std::cout << str.data() << "\n"; // "cool str"
    std::cout << modified_str << "\n"; // "cool"
    std::cout << mstr_v << "\n"; // "cool"
    std::cout << mstr_v.data(); // "cool"
}
```

### Rule 3: Do Not Lose Ownership

`std::string_view` neither owns nor releases the characters it references. Losing track of the owner can cause undefined behavior, invalid memory access, or even leaks when code is mechanically converted from `std::string` to `std::string_view`.

```cpp
const char* get() { return new char[]{"my new str"}; }

{
    std::string_view str = get();
    // Here we can call: delete str.data()
    str.remove_prefix(1); // Memory leak!
    // delete str.data() // Invalid call here. The pointer doesn't point to the allocated section head.
}
```

## Summary

`std::string_view` can make string-processing code faster and easier to read, but every view carries a lifetime contract. Correct use requires tracking ownership, respecting its explicit length, and preventing the referenced storage from expiring—especially as code evolves.
