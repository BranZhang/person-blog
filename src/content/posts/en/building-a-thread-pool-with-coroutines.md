---
title: "C++20: Building a Thread Pool with Coroutines"
description: "A minimal thread-pool implementation based on cppcoro concepts, designed to explain the essential mechanics of C++20 coroutines."
pubDatetime: 2022-05-13T15:36:00.000Z
modDatetime: 2025-02-18T14:34:49.000Z
draft: false
hiddenLocales: ["zh-cn"]
tags: ["C++", "C++20", "Coroutines"]
---

## Introduction

This article records the implementation of a small thread pool based on concepts from [cppcoro](https://github.com/lewissbaker/cppcoro). The design is reimplemented and reduced to its essentials to expose the most important coroutine mechanics.

The diagram illustrates the difference between an ordinary procedure and the more general coroutine model. Adding suspension and resumption makes abstractions such as thread pools, state machines, and generators more direct and efficient.

![](/wp-content/uploads/2025/02/coroutines_1.png "A coroutine generalizes a function with suspension and resumption; C++20 exposes customization points around that model")

That flexibility introduces lifecycle concerns. Local state must survive suspension in a separately allocated coroutine frame and be restored on resumption; the frame must eventually be destroyed. The compiler generates this machinery. C++20 uses **stackless coroutines**, in contrast to stackful implementations such as Boost.Context that switch an entire stack. Stackful coroutines require no language changes, but stackless frames can use orders of magnitude less memory.

C++20 exposes the stackless model through several concepts and customization points, which the thread-pool implementation will demonstrate.

## Fundamentals

### A Coroutine

A coroutine looks much like an ordinary function, but its return type must meet the coroutine requirements and its body must contain at least one of `co_await`, `co_yield`, or `co_return`. This test coroutine schedules itself on the pool and prints the worker thread ID after resumption:

```cpp
task run_async_print(threadpool& pool)
{
    co_await pool.schedule();
    std::cout << "This is a hello from thread: "
        << std::this_thread::get_id() << "\n";
}
```

`co_await` suspends the coroutine. Its operand must be awaitable, or convertible to an awaitable, and ultimately produces an **awaiter**. The awaiter defines whether suspension occurs, what happens during suspension, and what value is produced on resumption. Here it hands the suspended coroutine to the thread pool. The coroutine's `task` return object lets its caller interact with the operation, obtain a result, wait for completion, and eventually destroy the coroutine frame.

### Return Object and Promise Type

Before implementing the awaiter and pool, consider the return object and its associated promise type. `task` is the caller-facing handle, while `task_promise` is the interface used by compiler-generated coroutine code.

```cpp
struct task_promise
{
    task get_return_object() noexcept {
        return task{ std::coroutine_handle<task_promise>::from_promise(*this) };
    };

    std::suspend_never initial_suspend() const noexcept { return {}; }
    std::suspend_never final_suspend() const noexcept { return {}; }

    void return_void() noexcept {}

    void unhandled_exception() noexcept {
        std::cerr << "Unhandled exception caught...\n";
        exit(1);
    }
};
```

`task_promise` controls creation and completion behavior. `initial_suspend` determines whether the coroutine begins executing immediately or starts suspended until its first explicit resumption. A lazy generator normally returns `std::suspend_always`; this initial thread-pool version returns `std::suspend_never` so execution reaches the scheduling `co_await` as soon as the task is created. This choice will change later.

`final_suspend` determines whether a completed coroutine suspends one final time or destroys itself. The first version chooses automatic destruction with `std::suspend_never`.

`get_return_object` creates the task and passes it a `std::coroutine_handle` used for later resumption. `return_void` handles both falling off the end and an explicit value-less `co_return`; `unhandled_exception` handles exceptions escaping the body.

`co_return` and `co_yield` are specialized coroutine operations built around the same suspension machinery. A generator, for example, yields a value, suspends, and resumes when the caller requests the next item. See [cppcoro/generator.hpp](https://github.com/lewissbaker/cppcoro/blob/master/include/cppcoro/generator.hpp).

The return object may eventually provide `wait` or result access, but the first version only needs to identify its promise through a public `promise_type` alias.

```cpp
class [[nodiscard]] task
{
public:
    using promise_type = task_promise;

    explicit task(std::coroutine_handle<task_promise> handle)
        : m_handle(handle)
    {
    }

private:
    std::coroutine_handle<task_promise> m_handle;
};
```

Because `final_suspend` currently returns `std::suspend_never`, the frame destroys itself. An alternative is `std::suspend_always` with destruction in `task`'s destructor. The `[[nodiscard]]` attribute becomes important when ignoring the task would discard the object responsible for lifetime management; coroutine return types should generally use it.

### Thread Pool and Awaiter

The basic pool owns worker threads that wait on a queue and resume suspended coroutines. A conventional pool would queue `std::function` objects instead; here it queues `std::coroutine_handle` values. Each worker removes a handle and calls `resume()`. In this first version, completed coroutines destroy themselves.

```cpp
class threadpool
{
public:
    // ...

    auto schedule()
    {
        // ... here we've got to return the awaiter I mentioned earlier
    }
private:
    std::queue<std::coroutine_handle<>> m_coros;
    // ...

    void thread_loop()
    {
        while (!m_stop_thread)
        {
            std::unique_lock<std::mutex> lock(m_mutex);

            // ... waiting for a task, checking for stop requests

            auto coro = m_coros.front();
            m_coros.pop();
            lock.unlock();
            coro.resume();
        }
    }

    void enqueue_task(std::couroutine_handle<> coro) noexcept {
        std::unique_lock<std::mutex> lock(m_mutex);
        m_coros.emplace(coro);
        m_cond.notify_one();
    }
};
```

Instead of passing a `std::function` into `schedule`, coroutine code awaits a scheduling object. The extra awaiter protocol provides useful customization points.

```cpp
auto schedule()
{
    struct awaiter
    {
        threadpool* m_threadpool;

        constexpr bool await_ready() const noexcept { return false; }
        constexpr void await_resume() const noexcept { }
        void await_suspend(std::coroutine_handle<> coro) const noexcept {
            m_threadpool->enqueue_task(coro);
        }
    };
    return awaiter{this};
}
```

An awaiter implements three methods. `await_ready` can bypass suspension when the result is already available; scheduling always returns false. `await_suspend` receives the suspended coroutine handle and enqueues it. It may also return another handle for symmetric transfer. `await_resume` runs after resumption and determines the value of the `co_await` expression. Symmetric transfer will later implement continuations.

### Initial Result

The complete first version is available at [Thread Pool & Coroutines](https://gist.github.com/BranZhang/5f30d746c361a664515210ca7ef4be37). Its `main` function is:

```cpp
int main()
{
    std::cout << "The main thread id is: " << std::this_thread::get_id() << "\n";
    threadpool pool{8};
    task t = run_async_print(pool);
    std::this_thread::sleep_for(std::chrono::microseconds(1000));
}
```

The output shows both the main-thread ID and the worker-thread ID on which the coroutine resumed, confirming that scheduling works.

## Extending the Design

The first version demonstrates scheduling but does not provide a reliable way to observe completion. The following sections add that essential behavior.

### Continuations

Many useful operations require running code after a coroutine completes. cppcoro solves this with a **continuation**: another coroutine resumed when the original one reaches its final suspend point.

Implement this by storing the continuation handle in the promise and transferring execution to it when the task completes.

```cpp
struct task_promise
{
    struct final_awaitable
    {
        bool await_ready() const noexcept { return false; }

        std::coroutine_handle<> await_suspend(std::coroutine_handle<task_promise> coro) noexcept
        {
            return coro.promise().m_continuation;
        }

        void await_resume() noexcept {}
    };

    task get_return_object() noexcept;
    std::suspend_always initial_suspend() const noexcept { return {}; }
    auto final_suspend() const noexcept { return final_awaitable(); }
    void return_void() noexcept {}
    void unhandled_exception() noexcept { exit(1); }

    void set_continuation(std::coroutine_handle<> continuation) noexcept
    {
        m_continuation = continuation;
    }

private:
    std::coroutine_handle<> m_continuation = std::noop_coroutine();
};
```

Two details matter. First, `std::suspend_never` and `std::suspend_always` are themselves awaiters; a custom final awaiter can return the stored continuation handle from `await_suspend`, causing symmetric transfer on the same thread. Second, `initial_suspend` changes to `std::suspend_always`. The task must begin lazily so its continuation can be installed before execution starts; otherwise completion could race with registration.

The `task` return object must change accordingly.

```cpp
class [[nodiscard]] task
{
public:
    using promise_type = task_promise;

    explicit task(std::coroutine_handle<task_promise> handle)
        : m_handle(handle)
    {
    }

    ~task()
    {
        if (m_handle)
        {
            m_handle.destroy();
        }
    }

    auto operator co_await() noexcept
    {
        struct awaiter
        {
            bool await_ready() const noexcept { return !m_coro || m_coro.done(); }
            std::coroutine_handle<> await_suspend( std::coroutine_handle<> awaiting_coroutine) noexcept {
                m_coro.promise().set_continuation(awaiting_coroutine);
                return m_coro;
            }
            void await_resume() noexcept {}

            std::coroutine_handle<task_promise> m_coro;
        };
        return awaiter{m_handle};
    }

private:
    std::coroutine_handle<task_promise> m_handle;
};
```

Because the coroutine now remains suspended at completion, `task`'s destructor must destroy its frame. `operator co_await` makes a task awaitable. Its awaiter stores the awaiting coroutine as the task's continuation, then returns the task's own handle so that it begins executing immediately through symmetric transfer.

### Synchronous Waiting

For synchronous waiting, the continuation sets a one-shot event when the task completes. C++20's `std::atomic_flag::wait` and `notify_all` provide an efficient implementation:

```cpp
struct fire_once_event
{
    void set()
    {
        m_flag.test_and_set();
        m_flag.notify_all();
    }

    void wait()
    {
        m_flag.wait(false);
    }
private:
    std::atomic_flag m_flag;
};
```

These atomic waiting operations require at least GCC 11. Older toolchains can use `std::mutex` and `std::condition_variable`, or a platform futex. A second coroutine now awaits the original task and uses its own completion path to signal the event:

```cpp
sync_wait_task make_sync_wait_task(task& t)
{
    co_await t;
}
```

`co_await` registers the waiting coroutine as the task's continuation and resumes the original task. The original reaches its scheduling `co_await`, suspends again, and is queued on the pool. When it ultimately finishes, execution transfers back to the waiting coroutine, whose final suspend signals the event.

```cpp
struct sync_wait_task_promise
{

    std::suspend_always initial_suspend() const noexcept { return {}; }

    auto final_suspend() const noexcept
    {
        struct awaiter
        {
            bool await_ready() const noexcept { return false; }

            void await_suspend(std::coroutine_handle<sync_wait_task_promise> coro) const noexcept
            {
                fire_once_event *const event = coro.promise().m_event;
                if (event)
                {
                    event->set();
                }
            }

            void await_resume() noexcept {}
        };
        return awaiter();
    }

    fire_once_event *m_event = nullptr;

    sync_wait_task get_return_object() noexcept
    {
        return sync_wait_task{ std::coroutine_handle<sync_wait_task_promise>::from_promise(*this) };
    }

    void unhandled_exception() noexcept { exit(1); }
};
```

`sync_wait_task_promise` resembles `task_promise`, but it must return `std::suspend_always` from `initial_suspend`. The event pointer has to be installed before the wrapper coroutine starts awaiting the original task. The `sync_wait_task` return object performs that initialization and then resumes the wrapper.

```text
struct [[nodiscard]] sync_wait_task
{
    using promise_type = sync_wait_task_promise;

    sync_wait_task(std::coroutine_handle<sync_wait_task_promise> coro)
        : m_handle(coro)
    {
    }

    ~sync_wait_task()
    {
        if (m_handle)
        {
            m_handle.destroy();
        }
    }

    void run(fire_once_event& event);
private:
    std::coroutine_handle<sync_wait_task_promise> m_handle;
};

inline void sync_wait_task::run(fire_once_event& event)
{
    m_handle.promise().m_event = &event;
    m_handle.resume();
}

inline void sync_wait(task& t)
{
    fire_once_event event;
    auto wait_task = make_sync_wait_task(t);
    wait_task.run(event);
    event.wait();
}
```

`sync_wait_task::run` stores the event pointer and resumes the wrapper. The wrapper awaits the real task, which schedules itself on the pool. `sync_wait` then blocks on the event until the continuation signals completion.

### Result

The final `main` replaces an arbitrary sleep with a correct blocking wait:

```cpp
int main()
{
    std::cout << "The main thread id is: " << std::this_thread::get_id() << "\n";
    threadpool pool{8};
    task t = run_async_print(pool);
    sync_wait(t);
}
```

The complete example is available at [coroutine-based thread pool](https://gist.github.com/BranZhang/820da02642a49460f942debeaac0fe0f).

## Summary

cppcoro is an excellent reference for understanding these concepts and includes many additional facilities required by production and open-source code.

## References

- [CppCoro – A coroutine library for C++](https://github.com/lewissbaker/cppcoro)[https://github.com/lewissbaker/cppcoro#cppcoro---a-coroutine-library-for-c](https://github.com/lewissbaker/cppcoro#cppcoro---a-coroutine-library-for-c)
- [C++20: Building a Thread-Pool With Coroutines](https://blog.eiler.eu/posts/20210512/)
