---
title: "Advanced Thread Safety in C++"
description: "Advanced techniques for protecting shared state in C++, including mutex discipline, deadlock avoidance, and thread-safe object design."
pubDatetime: 2024-12-27T08:33:00.000Z
modDatetime: 2025-02-22T11:48:50.000Z
draft: false
hiddenLocales: ["zh-cn"]
tags: ["C++", "Multithreading", "Concurrency"]
---

## Introduction

C++ allows parts of a program to run concurrently in multiple threads. Such programs need extra care to prevent shared data from causing race conditions. Mutexes and locks are the usual solution, but their cost can become significant in performance-critical code, especially for heavily contended data. C++ therefore provides several lower-level alternatives.

## Strategies for Balancing Performance

Over the past few decades, CPU performance has improved much faster than memory performance.

![](/wp-content/uploads/2025/02/Processor.webp "The processor-memory performance gap over time")

To keep memory from limiting overall performance, CPU designers employ strategies such as:

- CPU caches ([memory caching](https://en.wikipedia.org/wiki/CPU_cache))
- Instruction-level parallelism ([instruction parallelization](https://en.wikipedia.org/wiki/Instruction-level_parallelism))
- [Speculative execution](https://en.wikipedia.org/wiki/Speculative_execution)
- Multiple CPU cores

These strategies are implemented entirely in hardware. As a programmer, you generally cannot see or directly control what happens underneath. Compiler authors apply their own strategies as well, including:

- [Constant folding](https://en.wikipedia.org/wiki/Constant_folding)
- [Copy elision](https://en.wikipedia.org/wiki/Copy_elision)
- [Loop-invariant code motion](https://en.wikipedia.org/wiki/Loop-invariant_code_motion)
- [Instruction scheduling](https://en.wikipedia.org/wiki/Instruction_scheduling)
- [Loop unrolling](https://en.wikipedia.org/wiki/Loop_unrolling)
- Many other optimizations

A compiler may perform any optimization that preserves the program's observable behavior. With a single-threaded program, you rarely need to care about the strategies chosen by the hardware or compiler. Once multiple threads are involved, however, their effects on ordering and visibility become crucial.

## Atomic Operations

In multithreaded programming, you will often hear the term “atomic operation.” It is used in three related but distinct senses:

1. An operation on one value—a read or write—completes indivisibly, without another thread observing a partial result.
2. An updated value becomes visible to other CPUs.
3. Operations on multiple values complete without interference from other threads, such as updating A and B together as a transaction.

“Atomic” most commonly refers to the first meaning, often implies the second, and is sometimes used for a combination of all three. **These distinctions recur throughout this article.**

### A Flawed Example

In the following code, the main thread creates another thread. Both continue running while `shutdown` is `false`. The main thread eventually sets `shutdown` to `true`, causing both loops to exit before it waits for the worker thread. Unfortunately, the program is incorrect.

```cpp
bool shutdown;

void thread_1() {
    while ( !shutdown ) {
        // ...
    }
}

int main() {
    std::thread t1{ thread_1 };
    while ( !shutdown ) {
        // ...
        if ( some_condition )
            shutdown = true;
    }
    t1.join();
}
```

The problem is that `shutdown` is shared between threads without synchronization. It is tempting to argue that a Boolean is only one byte and therefore must be thread-safe because no thread can read or write half a byte.

Even if the access is indivisible in the first sense, that is not sufficient. The program has a data race under the C++ memory model, and neither visibility nor ordering between the threads is guaranteed.

### The Wrong Fix: `volatile`

Would making the variable `volatile` make the program thread-safe?

```cpp
volatile bool shutdown;
```

In C++, using `volatile` to establish thread safety is incorrect.

`volatile` tells the compiler that accesses to an object are observable and must not be optimized away in the usual manner. It is intended for uses such as memory-mapped I/O and certain signal-handling scenarios—not inter-thread synchronization.

A `volatile` object does not make one thread's changes visible to another and does not establish a happens-before relationship. Use `std::atomic`, a mutex, or another synchronization primitive instead.

### A Correct Fix: Mutexes and Locks

The classic solution is to protect the shared state with a mutex:

```cpp
bool shutdown;
std::mutex shutdown_mux;

void thread_1() {
    while ( true ) {
        // ...
        std::lock_guard<std::mutex> lock{ shutdown_mux };
        if ( shutdown )
            break;
    }
}

int main() {
    std::thread t1{ thread_1 };
    while ( true ) {
        // ...
        if ( some_condition ) {
            std::lock_guard<std::mutex> lock{ shutdown_mux };
            shutdown = true;
            break;
        }
    }
    t1.join();
}
```

The mutex makes accesses to `shutdown` indivisible and provides the required visibility and ordering. It can also protect larger invariants involving multiple values, making mutexes the most general-purpose tool for thread safety. C++ also offers more specialized primitives that can be useful in performance-sensitive code.

### Before Reaching for Lower-Level Techniques

Correct multithreaded code is difficult even with ordinary mutexes. Before using the techniques below, keep the following in mind:

- Algorithmic complexity matters more than lock mechanics. An N⋅log(N) algorithm using a relatively slow mutex will often outperform an N<sup>2</sup> algorithm using a faster lock or a lock-free technique.
- Profile the program to determine whether lock operations consume meaningful time.
- Use lower-level techniques only when lock contention is a demonstrated bottleneck.

### A Lighter Fix: `std::atomic`

The mutex solution is correct, but a Boolean flag can use a lighter-weight abstraction:

```cpp
std::atomic<bool> shutdown;
```

`std::atomic<T>` gives `shutdown` well-defined atomic access and inter-thread visibility. The standard library provides specialized operations for built-in scalar and pointer types. User-defined `T` types can also be used when they are trivially copyable, although the implementation may use an internal lock and may impose size or alignment constraints.

For integral and pointer types, `std::atomic<T>` supports convenient operator overloads:

```cpp
std::atomic<int> x{ 0 };

x = 1;      // x.store(1)
int i = x;  // x.load()
++x;        // x.fetch_add(1)
x++;        // x.fetch_add(1)
--x;        // x.fetch_sub(1)
x--;        // x.fetch_sub(1)
x += 1;     // x.fetch_add(1)
x -= 1;     // x.fetch_sub(1)
x &= 1;     // x.fetch_and(1)
x |= 1;     // x.fetch_or(1)
x ^= 1;     // x.fetch_xor(1)
```

These operators are shorthand for the member functions shown in the comments. Calling the member functions directly can make it clearer that the variable is atomic. Note, however, that:

```cpp
x = x + 1; // not equivalent to ++x or x += 1
```

This expression performs a separate atomic load and atomic store; the combined read-modify-write operation is not atomic. Another thread can modify `x` between the two steps.

### Lock-Free Atomic Operations

`std::atomic<T>` is not guaranteed to be lock-free or faster than a mutex for every type and platform. Use `is_lock_free()` at runtime or `is_always_lock_free` at compile time to query the implementation. The answer can depend on factors such as alignment and CPU instruction support; for example, a platform may use `cmpxchg16b` for 16-byte atomics and fall back to a lock when that instruction is unavailable.

`std::atomic_flag` is the only standard atomic type guaranteed to be lock-free on every conforming implementation. An example appears later in the article.

## Memory Barriers

Indivisible atomic access alone is not enough for thread safety because the execution order of memory operations may differ from the source-code order. Hardware, the compiler, or both can reorder operations to improve performance.

Memory barriers selectively prevent operations from moving across a boundary. The important distinction is that a barrier constrains the order of operations rather than performing the operations itself.

### `memory_order_seq_cst`: Sequential Consistency

Sequential consistency is the strongest standard memory ordering and is therefore the default. For example, `std::atomic<T>::fetch_add()` has the following signature:

```cpp
T fetch_add( T arg, std::memory_order order
                    = std::memory_order_seq_cst ) noexcept;
```

It also imposes the strongest constraints by participating in a single total order of sequentially consistent operations. When an algorithm permits it, a weaker memory order may generate more efficient code.

### `memory_order_relaxed`: Atomicity Without Synchronization

Relaxed ordering provides atomicity and a per-object modification order, but no synchronization or ordering for unrelated memory accesses. Incrementing a reference count is a common use case:

```cpp
template<typename T>
class shared_ptr {
public:
    // ...
private:
    struct counted_obj {
        // ...
        std::atomic<size_t> _count;
        T _obj;
    };

    counted_obj *const _co;

    void _inc_ref() noexcept {
        _co->_count.fetch_add( 1, std::memory_order_relaxed );
    }
    // ...
};
```

At this point you might ask: "If there is no synchronization, how can this possibly work? Couldn't thread 1 increment the value from N to N+1 while thread 2 also increments the same old value N to N+1?"

No, for two reasons:

- Each increment is still atomic (in the first and second senses), so every thread always sees the latest value. What `memory_order_relaxed` does is allow the hardware or compiler to reorder other operations unrelated to `_count`, whether before or after the increment, to improve overall performance—not specifically to speed up `_count` itself.
- Because `_count` is part of a private data structure, no other thread is guaranteed to take any conditional action based on its current value. In other words, using `memory_order_relaxed` is safe as long as only the increment is performed and it does not change any thread's control flow.

`memory_order_relaxed` is not safe when decrementing a reference count. When you decrement a reference count, you typically destroy the object or release its resources once the count reaches zero. In that case, the ordering of the operation matters a great deal. If you use `memory_order_relaxed`, the ordering of the `fetch_sub` operation is not guaranteed, which can lead to the following problems:

- **Race conditions**: one thread might access the object after another thread has decremented the reference count but before it has destroyed the object, resulting in access to an already-destroyed object and undefined behavior.
- **No guaranteed synchronization**: although the decrement itself is atomic, other threads' operations may see a stale reference-count value, leading to incorrect logic or resource leaks.

In practice, avoid `memory_order_relaxed` unless you can prove its use is correct and it genuinely improves performance significantly. Using `memory_order_relaxed` correctly is very difficult.

### `memory_order_acquire` and `memory_order_release`

Acquire and release ordering commonly form a pair:

- A release store publishes preceding writes; those writes cannot be reordered after the release.
- An acquire load observes the published value and prevents subsequent reads and writes from being reordered before the acquire.

In this example, `shared_data` is shared by two threads and `data_ready` acts as the synchronization flag:

```cpp
int shared_data;
std::atomic<int> data_ready{ 0 };

void producer() {
    shared_data = 42;
    data_ready.store( 1, std::memory_order_release );
}

void consumer() {
    while ( data_ready.load( std::memory_order_acquire ) == 0 )
        ;
    assert( shared_data == 42 );  // always true
}

int main() {
    std::thread t1{ producer };
    std::thread t2{ consumer };
    t1.join();
    t2.join();
}
```

The producer writes `shared_data` and then publishes readiness. The release store prevents the data write from moving after the flag update. When the consumer's acquire load reads the published value, the producer's preceding writes happen-before the consumer's subsequent reads, so reading `shared_data` is safe.

Two details are worth noting:

- `shared_data` itself need not be atomic. This is especially useful for data that is too large or not trivially copyable.
- Any number of writes can be published together through the same release/acquire synchronization point.

Busy-waiting can be efficient when the expected wait is extremely short. A general spin lock can be implemented with `std::atomic_flag`:

```cpp
std::atomic_flag mutex = ATOMIC_FLAG_INIT;

class spin_lock {
public:
    explicit spin_lock( std::atomic_flag *mutex ) noexcept :
        _mutex{ mutex }
    {
        while ( !_mutex->test_and_set( std::memory_order_acquire ) )
           ;
    }
    ~spin_lock() noexcept {
        _mutex->clear( std::memory_order_release );
    }
private:
    std::atomic_flag *const _mutex;
};
```

### `memory_order_consume`

Consume ordering is a dependency-based form of acquire ordering. In principle, it can be cheaper on weakly ordered CPUs such as ARM and PowerPC. Consider the earlier declarations:

```cpp
int shared_data;
std::atomic<int> data_ready{ 0 };
```

There is no machine-visible dependency between `shared_data` and `data_ready`; the relationship exists only in the programmer's reasoning. A pointer can create an actual dependency that the compiler can track:

```cpp
std::atomic<int*> data_ready{ nullptr };

void producer() {
    static int shared_data;
    shared_data = 42;
    data_ready.store( &shared_data, std::memory_order_release );
}

void consumer() {
    while ( (data_ready.load( std::memory_order_consume )) == nullptr )
        ;
    assert( *data_ready == 42 );  // always true
}
```

The pointer value must now be loaded before it can be dereferenced. This creates a dependency chain that can preserve the required ordering without an additional barrier. In practice, compiler support for `memory_order_consume` has historically been limited, and implementations commonly treat it as acquire.

### `memory_order_acq_rel`

This ordering combines acquire and release semantics for a read-modify-write operation. Decrementing a reference count is a typical use case:

```cpp
template<typename T>
class shared_ptr {
public:
    // ...

    ~shared_ptr() noexcept {
        if ( _co->_count.fetch_sub( 1, std::memory_order_acq_rel ) == 1 )
            delete _co;
    }

    // ...
};
```

Relaxed ordering alone is insufficient on the final decrement because destruction must observe the accesses that happened before other owners released their references.

### `std::atomic_thread_fence()`

A relaxed atomic operation provides atomicity without a barrier, while `std::atomic_thread_fence()` supplies ordering without operating on a particular atomic object. A fence can coordinate multiple relaxed atomic operations. For example, instead of writing:

```cpp
atomic<int> x, y;
x.store( 1, std::memory_order_release );
y.store( 2, std::memory_order_release );
```

you can write:

```cpp
x.store( 1, std::memory_order_relaxed );
y.store( 2, std::memory_order_relaxed );
std::atomic_thread_fence( std::memory_order_release );
```

Atomic-operation ordering and fence ordering are not identical. Consider:

```cpp
std::atomic<int> sync{ 0 };
// (1) load & store operations
sync.store( 1, std::memory_order_release );
// (2) store operations
```

The operations in (1) cannot be reordered after the release store to `sync`. Stores in (2), however, may move before that release operation.

An explicit fence applies ordering constraints more broadly than an operation on a specific atomic. Given:

```cpp
// (1) load & store operations
std::atomic_thread_fence( std::memory_order_release );
// (2) load operations
sync.store( 1, std::memory_order_relaxed );
// (3) store operations
```

the operations in (1) cannot move after subsequent stores in (3), and those stores cannot move before the fence. Loads in (2) are not constrained in the same way by a release fence.

Acquire ordering applies the corresponding constraints in the opposite direction. These distinctions are subtle; acquire and release operations tied to a specific atomic synchronization variable are usually easier to reason about.

## Compare-and-Swap (CAS)

Compare-and-swap (CAS), also called compare-and-exchange in the C++ API, atomically compares a value and conditionally replaces it. Conceptually, it behaves like this:

```cpp
template<typename T>
bool atomic<T>::compare_exchange( T &expected, T desired ) {
    if ( this->_value == expected ) {
        this->_value = desired;
        return true;
    }
    expected = this->_value;
    return false;
}
```

The actual operation must, of course, execute atomically. It checks the current value and then:

- If the value equals `expected`, replaces it with `desired` and returns `true`.
- Otherwise, leaves the atomic object unchanged, writes its current value back to `expected`, and returns `false`, allowing the caller to retry.

C++ provides two variants: `compare_exchange_weak()` and `compare_exchange_strong()`.

For example, CAS can implement the earlier `spin_lock` class:

```cpp
std::atomic<bool> mutex;

class spin_lock {
public:
    explicit spin_lock( std::atomic<bool> *mutex ) noexcept :
        _mutex{ mutex }
    {
        bool flag = false;
        while ( !_mutex->compare_exchange_weak( flag, true ) )
            flag = false;  // must reset
    }

    ~spin_lock() noexcept {
        _mutex->store( false );
    }

private:
    std::atomic<bool> *const _mutex;
};
```

The CAS operation examines `_mutex`:

- If it is `false`, the lock is free, so CAS changes it to `true` and succeeds.
- If it is `true`, another thread owns the lock, so CAS does not change it and returns `false`.

The first argument, `flag`, is both an input and an output. On failure, it receives the atomic object's current value—`true` here—so it must be reset to `false` before the next attempt.

### Lock-Free Operations

CAS is a fundamental building block for lock-free data structures. A partial lock-free stack implementation might look like this:

```cpp
template<typename T>
class stack {
public:
    struct node {
       node *_next;
       T _data;
       explicit node( T &&data ) : _data{ std::move( data ) } { }
    };

    void push( T &&data ) {
        node<T> *new_node = new node<T>{ std::move( data ) };
        new_node->_next = _head.load( std::memory_order_relaxed );

        while ( !_head.compare_exchange_weak(
            new_node->_next, new_node,
            std::memory_order_release,
            std::memory_order_relaxed ) );
    }

private:
    std::atomic<node<T>*> _head;
};
```

After allocating a node, the code attempts to update `_head`:

- If `_head` still equals `new_node->_next`, its original value, CAS makes `_head` point to `new_node` using the success memory order supplied as the third argument.
- If they differ, another thread has changed `_head`. CAS writes the current head into `new_node->_next` using the failure memory order supplied as the fourth argument, and the loop retries.

### `compare_exchange_weak()` vs `compare_exchange_strong()`

The difference between the two variants is failure behavior:

- `compare_exchange_strong()` fails when the current value does not equal the expected value.
- `compare_exchange_weak()` may additionally fail spuriously even when the values compare equal.

Spurious failure reflects how CAS is efficiently implemented on architectures that use load-linked/store-conditional instructions, such as ARM and PowerPC.

The following pseudocode illustrates the relationship between the two operations:

```cpp
enum class cas_result {
    EQUAL,
    NOT_EQUAL,
    SPURIOUS_FAILURE
};

template<typename T>
cas_result cas_weak_impl( atomic<T> *p, T &expected, T desired );

template<typename T>
bool atomic<T>::compare_exchange_weak( T &expected, T desired ) {
    return cas_weak_impl( this, expected, desired ) == cas_result::EQUAL;
}

template<typename T>
bool atomic<T>::compare_exchange_strong( T &expected, T desired ) {
    cas_result cr;
    do {
        cr = cas_weak_impl( this, expected, desired );
    } while ( cr == cas_result::SPURIOUS_FAILURE );
    return cr == cas_result::EQUAL;
}
```

Assuming `cas_weak_impl()` provides the weak primitive, `compare_exchange_weak()` is a thin wrapper, while `compare_exchange_strong()` retries internally to filter spurious failures.

Use the weak form when the surrounding algorithm already retries in a loop; it may map more efficiently to weakly ordered architectures. Use the strong form when a spurious failure would require expensive recovery or when the caller wants a single definitive attempt. Neither form, by itself, solves or reliably detects the ABA problem.

A one-shot `try_lock()` is a typical use for `compare_exchange_strong()`:

```cpp
bool my_try_lock( std::atomic<bool> *mutex ) noexcept {
    bool flag = false;
    return mutex->compare_exchange_strong( flag, true );
}
```

## The ABA Problem

The ABA problem can be illustrated with two threads. Thread 1:

1. Reads value A from a memory location.
2. Performs other work.
3. Reads the same location again and still sees A.
4. Compares the two reads and concludes that the value did not change.

While thread 1 was doing its other work, thread 2 may have:

1. Written B to the same location.
2. Performed other work.
3. Written A back to the location.

Thread 1 sees A both times even though the state changed from A to B and back to A. Sometimes that intermediate change is harmless; sometimes it invalidates the assumptions behind the operation.

Consider the earlier `stack<T>::push()` code, repeated here for convenience:

```cpp
void push( T &&data ) {
    node<T> *new_node = new node<T>{ std::move( data ) };
    new_node->_next = _head.load( std::memory_order_relaxed );

    while ( !_head.compare_exchange_weak(
                new_node->_next, new_node,
                std::memory_order_release,
                std::memory_order_relaxed ) );
}
```

The following diagram illustrates the operation:

![](/wp-content/uploads/2024/12/threadsafety.webp)

State (1) is the initial condition: A and B are stack nodes, `_head` (H) points to A, and `new_node` (N) also points to A through `_next`. The dashed box contains the two values being compared. State (3) is the desired result, with `_head` pointing to `new_node` and `new_node->_next` pointing to A.

Suppose another thread inserts X before the loop, as in state (2), and immediately removes it. Both `_head` and `new_node->_next` again point to A, so setting `_head` to `new_node` is still correct. ABA is harmless for this `push()` operation.

Now consider a possible `stack<T>::pop()` implementation:

```cpp
T pop() {
    node<T> *first = _head.load( std::memory_order_relaxed );

    while ( first != nullptr &&
            !_head.compare_exchange_weak(
                first, first->_next,
                std::memory_order_release,
                std::memory_order_relaxed ) );

    if ( first == nullptr )
        throw empty_stack_exception{};
    T ret_val{ std::move( first->_data ) };
    delete first;
    return ret_val;
}
```

Its state transitions are shown below:

![](/wp-content/uploads/2024/12/threadsafety2.webp)

In state (1), A, B, and C are stack nodes, while `_head` (H) and `first` (F) both point to A. The dashed box contains the compared values. State (5) is the expected result, with `_head` pointing to B.

Now suppose another thread removes A and B in state (2), then pushes A again in state (3). `_head` and `first` both point to A, so CAS succeeds and sets `_head` to `first->_next`. This result is wrong.

Originally, A's `_next` pointed to B, so `first->_next` was expected to be B. But B was deleted in state (2). State (4) therefore leaves `_head` as a dangling pointer to the deleted B. Unlike the `push()` case, the expected successor can become stale, so ABA is a real correctness problem here.

ABA bugs are difficult to detect because the compared pointer may remain unchanged while the object or links behind it change. Common solutions include:

- Protecting the operation with a mutex
- Using tagged or versioned pointers
- Using a safe memory-reclamation scheme such as hazard pointers

### Versioned Pointers

A versioned pointer stores a pointer together with a counter that increments whenever the pointer value changes. Conceptually, it looks like this:

```cpp
template<typename T>
class vers_ptr {
public:
    vers_ptr() noexcept : _ptr{ nullptr }, _vers{ 0 } { }
    vers_ptr( T *ptr ) noexcept : _ptr{ ptr }, _vers{ 1 } { }

    vers_ptr& operator=( T *ptr ) noexcept {
        set( ptr );
        return *this;
    }

    // ...

private:
    T *_ptr;
    uintptr_t _vers;  // must be sizeof(T*) for cmpxchg16b

    void set( T *ptr ) noexcept {
        _ptr = ptr;
        ++_vers;
    }
};

static_assert( sizeof( vers_ptr<void> ) == 16 );
```

The data structure then uses `vers_ptr<node>` instead of a raw `node*`:

```cpp
struct node {
    vers_ptr<node> _next;
    // ...
};

T pop() {
    vers_ptr<node> first = _head.load( std::memory_order_relaxed );

    while ( first != nullptr &&
            !_head.compare_exchange_weak(
                first, first->_next,
                std::memory_order_release,
                std::memory_order_relaxed ) ) ;
    // ...
}

// ...

std::atomic<vers_ptr<node>> _head;
```

This works because even if the `_ptr` part of `first` points to A again, its `_vers` part differs. `_head` and `first` therefore do not compare equal, preventing CAS from installing the stale value B from `first->_next`.

There are important constraints:

- The platform must support a CAS wide enough for the pointer and counter together—typically 16 bytes on a 64-bit platform. x86-64 implementations may use the `cmpxchg16b` instruction.
- `std::atomic<T>` requires `T` to be trivially copyable. The implementation of `vers_ptr` must preserve that property.

## Cache Lines

CPU caches are organized into fixed-size cache lines, commonly 64 bytes on modern desktop and server processors. Loading a memory address brings its entire surrounding cache line into the cache, and cache-coherence traffic also operates at cache-line granularity. This behavior improves performance when code has good spatial locality, but it can hurt when unrelated, frequently written values share a line.

Consider a lock-free queue:

```cpp
template<typename T>
class queue {
    // ...

    std::atomic<node*> _head;
    std::atomic<node*> _tail;
};
```

Suppose one thread continually pushes items at the tail, repeatedly updating `_tail`, while another pops from the head and repeatedly updates `_head`.

If `_head` and `_tail` occupy the same cache line, writes to either variable invalidate the line for the other CPU. This unnecessary cache-coherence contention is known as false sharing.

Placing the two atomics on separate cache lines prevents one update from disturbing the other. C++17 provides `std::hardware_destructive_interference_size` for this purpose:

```cpp
template<typename T>
class queue {
    // ...
    alignas(std::hardware_destructive_interference_size) std::atomic<node*> _head;
    alignas(std::hardware_destructive_interference_size) std::atomic<node*> _tail;
};
```

This consumes a little extra memory but prevents `_head` and `_tail` from sharing a cache line.

## Summary

- Algorithm design matters more than lock mechanics.
- Direct use of atomics and memory barriers is difficult to get right.
- Profile before adopting advanced synchronization techniques.
- Use lower-level atomics and barriers only when locking is a measured bottleneck.
- Atomic operations and ordering guarantees must be designed together.
- Compare-and-swap is a fundamental lock-free building block.
- Account for ABA and safe memory reclamation.
- Avoid false sharing between frequently written values.

## References

- [What “volatile” does in C (and C++)](https://medium.com/@pauljlucas/what-volatile-does-in-c-and-c-d6e9924b15c7)
- [Advanced Thread Safety in C++](https://medium.com/@pauljlucas/advanced-thread-safety-in-c-4cbab821356e)
