---
title: "C++20：使用协程构建线程池"
description: "介绍 在本文中，我将尝试记录我实现一个简单线程池的经验。这个线程池基于 cppcoro 库的概念和思想。经过重新实现并简化到最基本的部分，以便理解协程的最重要方面。"
pubDatetime: 2022-05-13T15:36:00.000Z
modDatetime: 2025-02-18T14:34:49.000Z
draft: false
tags: ["C++","C++20","Coroutines"]
---
<h2 class="wp-block-heading">介绍</h2>

<p class="wp-block-paragraph">在本文中，我将尝试记录我实现一个简单线程池的经验。这个线程池基于 <a href="https://github.com/lewissbaker/cppcoro" data-type="link" data-id="https://github.com/lewissbaker/cppcoro" target="_blank" rel="noopener">cppcoro</a> 库的概念和思想。经过重新实现并简化到最基本的部分，以便理解协程的最重要方面。</p>

<!--more-->

<p class="wp-block-paragraph">下面的图表展示了过程和协程这种更通用方法之间的区别。通过添加挂起和恢复功能，我们可以以更加优雅和高效的方式实现某些概念——如线程池、状态机、生成器等，远比传统方式更为简洁。</p>

<div class="wp-block-image">
<figure class="aligncenter size-full"><img loading="lazy" decoding="async" width="1024" height="576" src="/wp-content/uploads/2025/02/coroutines_1.png" alt="" class="wp-image-12079" srcset="/wp-content/uploads/2025/02/coroutines_1.png 1024w, /wp-content/uploads/2025/02/coroutines_1-300x169.png 300w, /wp-content/uploads/2025/02/coroutines_1-768x432.png 768w" sizes="auto, (max-width: 1024px) 100vw, 1024px" /><figcaption class="wp-element-caption">协程是函数的一种泛化，增加了挂起和恢复的功能。C++20通过提供多个附加的自定义选项，使得基于这一概念实现功能成为可能。</figcaption></figure>
</div>

<p class="wp-block-paragraph">当然，与常规过程相比，额外的功能要求我们考虑一些额外的因素。当协程挂起时，本地变量需要被复制到一块独立的内存区域，并在恢复协程时再将其恢复。此外，还需要为协程数据分配额外的内存，并在某些时刻销毁这块内存。幸运的是，所有这些步骤都由编译器处理。这种方法的整体概念被称为“无栈协程”（stack-less coroutines），与传统的“有栈协程”（stackful coroutines）相对，后者在挂起时会将整个栈切换出去。后者在像boost::context 这样的库中已经有一段时间了，因为它们不需要编译器和语言的改动。而无栈协程的引入是因为它们相比有栈协程在多个方面具有效率上的优势。一个重要的优势就是内存使用，通常会低几个数量级。</p>

<p class="wp-block-paragraph">在 C++20 中，这些无栈协程由一组可变的概念和自定义选项组成。下面将通过实现线程池的过程来解释这些概念。</p>

<h2 class="wp-block-heading"><strong>基本知识</strong></h2>

<h3 class="wp-block-heading">协程</h3>

<p class="wp-block-paragraph">在语法上，协程与普通函数差别不大。主要的区别在于它的返回类型要求，以及它的实现体中必须至少包含以下关键字之一：<code>co_await</code>、<code>co_yield</code> 或 <code>co_return</code>。以下部分展示了测试协程。它将自己调度到线程池上，一旦被另一个线程继续执行，就打印出线程 ID。</p>

<pre class="EnlighterJSRAW" data-enlighter-language="cpp" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">task run_async_print(threadpool&amp; pool)
{
    co_await pool.schedule();
    std::cout &lt;&lt; "This is a hello from thread: "
        &lt;&lt; std::this_thread::get_id() &lt;&lt; "\n";
}</pre>

<p class="wp-block-paragraph">通过 <code>co_await</code> 表达式，我们暂停了协程。该关键字的参数必须是一个可等待对象（实现了 <code>co_await</code> 操作符的对象）、一个可等待的表达式，或者一个可以转换为可等待对象的对象。所有这些方法的共同点是，最终结果是一个“等待器”（awaiter）实例。等待器描述了协程暂停和恢复操作的行为，即在协程执行应该继续时如何恢复执行。对于我们的示例来说，这意味着协程将被挂起，并通过等待器由线程池接管。所谓的返回对象 <code>task</code> 会被返回给协程的创建者。创建者的目的就是与协程进行交互，获取潜在的结果，或者简单地等待协程完成，并在最后销毁协程。</p>

<h3 class="wp-block-heading">返回对象和 Promise&nbsp;类型</h3>

<p class="wp-block-paragraph">在我们继续讨论等待器和实际的线程池之前，应该先看一下返回对象和它的伴随类型——<code>promise</code> 类型。它们两个都很重要，原因也很充分。返回对象 <code>task</code> 之所以重要，是因为它用于与协程的创建者进行交互；而 <code>promise</code> 类型 <code>task_promise</code> 之所以重要，是因为它是所有由编译器生成的代码的交互点。</p>

<pre class="EnlighterJSRAW" data-enlighter-language="cpp" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">struct task_promise
{
    task get_return_object() noexcept {
        return task{ std::coroutine_handle&lt;task_promise>::from_promise(*this) };
    };

    std::suspend_never initial_suspend() const noexcept { return {}; }
    std::suspend_never final_suspend() const noexcept { return {}; }

    void return_void() noexcept {}

    void unhandled_exception() noexcept {
        std::cerr &lt;&lt; "Unhandled exception caught...\n";
        exit(1);
    }
};
</pre>

<p class="wp-block-paragraph">在这个例子中，<code>promise</code> 类型（在此称为 <code>task_promise</code>）是我们指定协程创建时会发生什么的地方。我们还指定了协程完成时会发生什么。<code>initial_suspend</code> 描述了在协程创建时，直到第一次调用 <code>co_*</code> 的代码是立即执行还是要等到第一次执行恢复操作时才执行。可以把它想象成一个生成器（或枚举器），你很可能会先调用 <code>next()</code>，然后才期望第一个项可用。这意味着，在协程创建时，我们不会执行任何代码。在这种情况下，我们返回 <code>std::suspend_always</code>，告诉编译器在第一次恢复协程之前不要执行任何代码。在我们的例子中，我们处于一个希望实现尽可能简单的线程池的步骤，这意味着我们希望在任务创建时立即调度协程并执行所有代码，包括 <code>co_await</code> 表达式。因此，我们暂时返回 <code>std::suspend_never</code>。稍后我们会因为另一个好的理由改变这一点，但目前这种方式已经足够了。</p>

<p class="wp-block-paragraph">另一方面，<code>final_suspend</code> 调用描述了在协程执行完成后，协程是否应该再挂起一次，或者是否应该销毁它。在这个示例的第一次迭代中，我们可以选择简单的解决方案，返回 <code>std::suspend_never</code>。</p>

<p class="wp-block-paragraph">还需要实现一些附加的方法。<code>get_return_object</code> 方法正如其名，它创建了我们的任务对象。这里的有趣细节是，我们获取了 <code>std::coroutine_handle&lt;&gt;</code>，这是用来恢复协程的句柄。然后，这个句柄被传递给任务对象。其他必需的方法是 <code>return_void</code> 和 <code>unhandled_exception</code>。虽然后者不言自明，<code>return_void</code> 更为有趣。它在以下两种情况中调用：一种是协程完成时没有任何特殊操作，比如在实现体的尾部退出；另一种是执行 <code>co_return</code> 以提前完成协程时。</p>

<p class="wp-block-paragraph">提到 <code>co_return</code> 关键字时，虽然在这些示例中并不重要，我们也应该提到 <code>co_yield</code>。这两个关键字都是围绕 <code>co_await</code> 的简化，适用于那些简单的挂起场景，且潜在的恢复操作由协程的创建者手动触发。一个应用示例是生成器，在生成新值后我们挂起，等待请求下一个项目时再恢复执行。关于这两个关键字的更多信息，可以查看 <a href="https://github.com/lewissbaker/cppcoro/blob/master/include/cppcoro/generator.hpp" target="_blank" rel="noopener">cppcoro/generator.hpp</a>。</p>

<p class="wp-block-paragraph">如前所述，返回对象承载了 pormise 类型，它是返回给协程创建者的对象。在我们的任务示例中，它可以具有阻塞功能（例如 <code>wait</code>），用于等待协程完成，或者包含用于检索潜在结果值的方法。然而，对于我们最初的示例（之后会迭代改进），这些功能并未添加。编译器的唯一严格要求是提供一个提示，告诉它 pormise 类型是什么。因为如果我们回顾一下，协程只指定了返回类型 <code>task</code>，但编译器需要知道对应的 pormise 类型是什么。这个通过添加一个公共的 <code>using</code> 声明来完成，声明指向实际的类类型 <code>promise_type</code>。</p>

<pre class="EnlighterJSRAW" data-enlighter-language="cpp" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">class [[nodiscard]] task
{
public:
    using promise_type = task_promise;

    explicit task(std::coroutine_handle&lt;task_promise> handle)
        : m_handle(handle)
    {
    }

private:
    std::coroutine_handle&lt;task_promise> m_handle;
};
</pre>

<p class="wp-block-paragraph">虽然我们第一个任务类的版本没有任何重要的功能，但其中的一些方面仍然很有趣。你可能还记得，在我们的 pormise 类型的 <code>final_suspend</code> 调用中返回了 <code>std::suspend_never</code>，这意味着协程会自动销毁。另一种选择是返回 <code>std::suspend_always</code>，并在任务类的析构函数中销毁它。还需要注意的是，我们的类在定义中添加了 <code>[[nodiscard]]</code> 属性。这在后续的实现中非常重要，特别是当任务对象控制协程的生命周期时。通常我建议总是将该属性添加到返回类型对象上，因为控制协程生命周期通常是常规做法，而非例外。对于我们最初的版本，这已经足够了，我将在后面的章节中再次讨论这些问题。</p>

<h3 class="wp-block-heading">线程池和等待器</h3>

<p class="wp-block-paragraph">为了将一切拆解到最基本的组件，让我们首先看一下线程池类的基本结构。以下是一个最基本的实现，后台有一些线程在等待队列中执行任务，或者在我们的例子中，恢复协程。即使没有协程，简单的 <code>thread_loop</code> 实现也不会有太大的不同。我们只会将 <code>std::function</code> 实例存储在队列中，而不是协程。这里唯一有趣的地方在于，我们使用 <code>std::coroutine_handle</code> 来与协程进行交互。特别是 <code>resume()</code> 调用在线程循环中的作用非常重要。一旦协程完成，它将自动被销毁，我们可以等待队列中的下一个协程。</p>

<pre class="EnlighterJSRAW" data-enlighter-language="cpp" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">class threadpool
{
public:
    // ...

    auto schedule()
    {
        // ... here we've got to return the awaiter I mentioned earlier
    }
private:
    std::queue&lt;std::coroutine_handle&lt;>> m_coros;
    // ...

    void thread_loop()
    {
        while (!m_stop_thread)
        {
            std::unique_lock&lt;std::mutex> lock(m_mutex);

            // ... waiting for a task, checking for stop requests

            auto coro = m_coros.front();
            m_coros.pop();
            lock.unlock();
            coro.resume();
        }
    }

    void enqueue_task(std::couroutine_handle&lt;> coro) noexcept {
        std::unique_lock&lt;std::mutex> lock(m_mutex);
        m_coros.emplace(coro);
        m_cond.notify_one();
    }
};
</pre>

<p class="wp-block-paragraph">如果我们使用 <code>std::function</code> 来包装任务并将它们调度到线程池中，我们很可能会将它们传递给 <code>schedule</code> 方法。而使用协程时，我们必须创建一个等待器（awaiter）来代替它，承担这一功能。虽然这最初看起来可能有些不方便，但实际上这种方法提供了多种自定义的可能性。</p>

<pre class="EnlighterJSRAW" data-enlighter-language="cpp" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">auto schedule()
{
    struct awaiter
    {
        threadpool* m_threadpool;

        constexpr bool await_ready() const noexcept { return false; }
        constexpr void await_resume() const noexcept { }
        void await_suspend(std::coroutine_handle&lt;> coro) const noexcept {
            m_threadpool->enqueue_task(coro);
        }
    };
    return awaiter{this};
}
</pre>

<p class="wp-block-paragraph">等待器（awaiter）概念规定实现必须包含三个不同的方法。第一个方法 <code>await_ready</code> 是一个快捷方式，用于在不需要恢复协程的情况下使用。也就是说，协程要么已经被销毁，要么无论如何都会立即再次挂起。在这些示例中我们总是返回 <code>false</code>，但某些使用场景可能会从这个优化选项中受益。更有趣的两个方法是 <code>await_suspend</code> 和 <code>await_resume</code>。后者在恢复协程时被调用，并允许通过改变返回类型来为 <code>co_await</code> 表达式指定返回类型。而它的兄弟方法 <code>await_suspend</code> 则是在协程挂起期间被调用。它接受协程句柄作为参数，并可以自由地执行任何我们能想到的操作。在我们的例子中，我们只是简单地将其排队到线程池中。也可以选择在这个方法中返回另一个协程句柄，这样会导致线程继续执行那个协程。稍后我们将使用这个功能来实现继续操作（continuations）。</p>

<h3 class="wp-block-heading">初步结果</h3>

<p class="wp-block-paragraph">现在我们已经准备好了所有必要的组件，可以首次执行它们了。完整的示例可以在这里找到：<a href="https://gist.github.com/BranZhang/5f30d746c361a664515210ca7ef4be37" target="_blank" rel="noopener">Thread-Pool &amp; Coroutines</a>。为了让大家了解将要执行的内容，先简要看一下主函数：</p>

<pre class="EnlighterJSRAW" data-enlighter-language="cpp" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">int main()
{
    std::cout &lt;&lt; "The main thread id is: " &lt;&lt; std::this_thread::get_id() &lt;&lt; "\n";
    threadpool pool{8};
    task t = run_async_print(pool);
    std::this_thread::sleep_for(std::chrono::microseconds(1000));
}</pre>

<p class="wp-block-paragraph">编译并执行二进制文件后，主线程的线程 ID 和我们恢复协程时使用的线程的 ID 都被打印出来，这证明我们的第一版实现做到了我们预期的功能。</p>

<h2 class="wp-block-heading">拓展</h2>

<p class="wp-block-paragraph">虽然上面的示例足以解释概念，但仍然有一些基本要求没有完成，才能使线程池正常工作。仅仅执行一些工作而不知道它是否成功完成是一种不负责任的做法。这个示例足够展示如何利用基本的协程功能，但仅此而已。接下来的几部分将解决其中的一些不足之处。</p>

<h3 class="wp-block-heading">继续执行</h3>

<p class="wp-block-paragraph">我们想要实现的许多功能依赖于能够在协程完成后执行一些自定义代码。在 cppcoro 中，这个问题是通过添加对“继续执行”的支持来解决的。继续执行（continuation）是另一个协程，它会在原始协程完成后被恢复执行。</p>

<p class="wp-block-paragraph">为了实现这一点，一种方法是修改我们协程的 promise 类型和返回类型。我们从 promise 类型开始，在其中存储继续执行的协程，并确保在与该 promise 类型相关联的协程完成后恢复继续执行。</p>

<pre class="EnlighterJSRAW" data-enlighter-language="cpp" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">struct task_promise
{
    struct final_awaitable
    {
        bool await_ready() const noexcept { return false; }

        std::coroutine_handle&lt;> await_suspend(std::coroutine_handle&lt;task_promise> coro) noexcept
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

    void set_continuation(std::coroutine_handle&lt;> continuation) noexcept
    {
        m_continuation = continuation;
    }

private:
    std::coroutine_handle&lt;> m_continuation = std::noop_coroutine();
};
</pre>

<p class="wp-block-paragraph">虽然存储继续执行的协程的方法相当明显，但这里有两个额外的变化需要注意。首先，应该注意的是，<code>std::suspend_never</code> 和 <code>std::suspend_always</code> 实际上是等待器（awaiter）本身。它们之间的唯一区别是 <code>await_ready</code> 返回的值。对我们来说，这一点很重要，因为我们可以实现自己的等待器，从而控制最终的挂起操作（final suspend）。<code>final_awaiter</code> 类有一个自定义的 <code>await_suspend</code> 实现，它接受协程的句柄作为参数。该方法会检索到它的 promise 类型，并获取我们之前存储的继续执行的协程。通过返回这个等待器，挂起原始协程的线程将执行继续执行的协程，直到它自己再次挂起或完成。第二个重要的变化是 <code>initial_suspend</code> 返回类型改为 <code>std::suspend_always</code>。这意味着我们不能再立即执行我们的任务。如果我们设置了继续执行的协程，我们必须在开始执行协程之前进行设置，否则我们会创建竞争条件。</p>

<p class="wp-block-paragraph">通过 promise 类型，我们只调整了一部分。返回对象 <code>task</code> 也需要进行更新。</p>

<pre class="EnlighterJSRAW" data-enlighter-language="cpp" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">class [[nodiscard]] task
{
public:
    using promise_type = task_promise;

    explicit task(std::coroutine_handle&lt;task_promise> handle)
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
            std::coroutine_handle&lt;> await_suspend( std::coroutine_handle&lt;> awaiting_coroutine) noexcept {
                m_coro.promise().set_continuation(awaiting_coroutine);
                return m_coro;
            }
            void await_resume() noexcept {}

            std::coroutine_handle&lt;task_promise> m_coro;
        };
        return awaiter{m_handle};
    }

private:
    std::coroutine_handle&lt;task_promise> m_handle;
};
</pre>

<p class="wp-block-paragraph">第一个重要的任务是，我们必须手动销毁协程，因为我们不再让编译器为我们完成这项工作。这可以很容易地通过 <code>task</code> 对象的析构函数来完成。第二部分是，我们需要以某种方式获取一个已挂起的协程的句柄，并将其设置为继续执行的部分。这意味着我们必须使用 <code>co_await</code> 表达式。与博客第一部分中的 <code>schedule</code> 调用不同，我们不再使用可等待表达式，而是通过实现 <code>co_await</code> 操作符使 <code>task</code> 成为一个可等待对象。但如最初所解释的，最终的结果是相同的：我们必须返回一个等待器（awaiter）实例。这个等待器接受继续执行的句柄，并将其设置在原始协程的 promise 上。然后，它返回原始协程的句柄，以便在注册继续执行时，原协程可以自动恢复执行。</p>

<h3 class="wp-block-heading">同步</h3>

<p class="wp-block-paragraph">在这个例子中，继续操作的目的是在协程执行完成时设置一个事件。借助 C++20，我们可以使用 <code>std::atomic_flag</code> 上的 <code>wait</code> 和 <code>notify</code> 功能，这使得我们能够非常高效地实现这样的事件：</p>

<pre class="EnlighterJSRAW" data-enlighter-language="cpp" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">struct fire_once_event
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
</pre>

<p class="wp-block-paragraph">不幸的是，使用 <code>std::atomic_flag</code> 扩展功能至少需要 GCC 11 版本，否则就需要基于 <code>std::mutex</code> 和 <code>std::condition_variable</code> 来实现类似的事件（或者如果平台依赖性不是问题，可以使用 futex）。现在我们已经有了继续操作支持，将任务类变成了一个可等待对象，并且也有了一个事件，我们可以继续实现阻塞功能了。为了使用这个可等待对象并注册一个继续操作，我们需要创建第二个协程。这个协程的任务是等待原始任务的执行，并在它完成时设置事件。因此，实际的协程非常简短：</p>

<pre class="EnlighterJSRAW" data-enlighter-language="cpp" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">sync_wait_task make_sync_wait_task(task&amp; t)
{
    co_await t;
}
</pre>

<p class="wp-block-paragraph"><code>co_await</code> 从可等待的任务中检索等待器，并将自身注册为继续操作。通过 <code>co_await</code> 原始任务，原始协程将恢复执行并到达它自己的第一个 <code>co_await</code> 表达式。该表达式会再次挂起原始协程并将其调度到线程池中。当任务被调度后，第二个协程中的代码已经完成，剩下的操作将通过它的返回对象和 promise 类型来处理。</p>

<pre class="EnlighterJSRAW" data-enlighter-language="cpp" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">struct sync_wait_task_promise
{

    std::suspend_always initial_suspend() const noexcept { return {}; }

    auto final_suspend() const noexcept
    {
        struct awaiter
        {
            bool await_ready() const noexcept { return false; }

            void await_suspend(std::coroutine_handle&lt;sync_wait_task_promise> coro) const noexcept
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
        return sync_wait_task{ std::coroutine_handle&lt;sync_wait_task_promise>::from_promise(*this) };
    }

    void unhandled_exception() noexcept { exit(1); }
};
</pre>

<p class="wp-block-paragraph">虽然基础结构与之前展示的 <code>task_promise</code> 类似，但细节非常重要。至关重要的是，从 <code>initial_suspend</code> 返回 <code>std::suspend_always</code>。我们不希望立即 <code>co_await</code> 原始协程。如你所见，我们的 <code>sync_wait_task_promise</code> 有一个事件成员，我们需要首先初始化它。因此，我们创建 <code>sync_wait_task</code>（协程），将事件引用存储在它的成员中，然后通过下面的 <code>sync_wait_task</code> 返回对象来恢复协程。</p>

<pre class="EnlighterJSRAW" data-enlighter-language="generic" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">struct [[nodiscard]] sync_wait_task
{
    using promise_type = sync_wait_task_promise;

    sync_wait_task(std::coroutine_handle&lt;sync_wait_task_promise> coro)
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

    void run(fire_once_event&amp; event);
private:
    std::coroutine_handle&lt;sync_wait_task_promise> m_handle;
};

inline void sync_wait_task::run(fire_once_event&amp; event)
{
    m_handle.promise().m_event = &amp;event;
    m_handle.resume();
}

inline void sync_wait(task&amp; t)
{
    fire_once_event event;
    auto wait_task = make_sync_wait_task(t);
    wait_task.run(event);
    event.wait();
}</pre>

<p class="wp-block-paragraph"><code>task</code> 结构实际上很简单，唯一显著的区别是与 <code>task</code> 结构相比，<code>run</code> 方法。<code>run</code> 方法设置事件引用，然后恢复协程。现在，协程最终 <code>co_await</code> 实际的任务，后者会恢复原始协程并将其安排到线程池中。通过调用所有程序代码，我们可以使用事件等待任务的完成。所有这些都包装在 <code>sync_wait</code> 函数中。</p>

<h3 class="wp-block-heading">结果</h3>

<p class="wp-block-paragraph">主函数只有一行不同的代码。我们不再仅仅是等待一秒钟并祈祷任务完成，而是可以阻塞并等待任务完成。</p>

<pre class="EnlighterJSRAW" data-enlighter-language="cpp" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">int main()
{
    std::cout &lt;&lt; "The main thread id is: " &lt;&lt; std::this_thread::get_id() &lt;&lt; "\n";
    threadpool pool{8};
    task t = run_async_print(pool);
    sync_wait(t);
}</pre>

<p class="wp-block-paragraph">完整的代码示例在这里：<a href="https://gist.github.com/BranZhang/820da02642a49460f942debeaac0fe0f" target="_blank" rel="noopener">coroutine based thread-pool</a></p>

<h2 class="wp-block-heading">总结</h2>

<p class="wp-block-paragraph">库 cppcoro 是一个非常好的参考。它让我自己理解了这些概念，此外，这个库还有许多额外的功能，是在实际的工业或开源项目中所需要的。</p>

<h2 class="wp-block-heading">参考资料</h2>

<ul class="wp-block-list">
<li><a href="https://github.com/lewissbaker/cppcoro" target="_blank" rel="noopener">CppCoro &#8211; A coroutine library for C++</a><a href="https://github.com/lewissbaker/cppcoro#cppcoro---a-coroutine-library-for-c" target="_blank" rel="noopener"></a></li>

<li><a href="https://blog.eiler.eu/posts/20210512/" target="_blank" rel="noopener">C++20: Building a Thread-Pool With Coroutines</a></li>
</ul>

<p class="wp-block-paragraph"></p>
