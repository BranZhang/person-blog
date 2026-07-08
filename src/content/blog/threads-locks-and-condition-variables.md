---
title: "C++ 11 线程、锁和条件变量（译：C++11 Threads, Locks and Condition Variables）"
description: "这篇文章是关于C++11对线程和同步机制（互斥锁和条件变量）支持的详细讲解。"
pubDate: "2021-12-26T03:05:00.000Z"
updatedDate: "2025-03-03T09:37:41.000Z"
published: true
tags: ["C++"]
---
<p class="wp-block-paragraph">这篇文章是关于C++11对线程和同步机制（互斥锁和条件变量）支持的详细讲解。</p>

<!--more-->

<h2 class="wp-block-heading">线程</h2>

<p class="wp-block-paragraph"><code>std::thread</code>&nbsp;类， 位于&nbsp;<code>&lt;thread&gt;</code>&nbsp;头文件，实现了线程操作。<code>std::thread</code>&nbsp;可以和普通函数和 lambda 表达式搭配使用。它还允许向线程的执行函数传递任意多参数。</p>

<pre class="EnlighterJSRAW" data-enlighter-language="cpp" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">#include &lt;thread>
 
 void func()
{
   // do some work
}
 
int main()
{
   std::thread t(func);
   t.join();
   return 0;
}</pre>

<p class="wp-block-paragraph">上面的例子中，<code>t</code>&nbsp;是一个线程实例，函数&nbsp;<code>func()</code>&nbsp;在该线程运行。调用&nbsp;<code>join()</code>&nbsp;函数是为了阻塞当前线程（此处即主线程），直到&nbsp;<code>t</code>&nbsp;线程执行完毕。线程函数的返回值都会被忽略，但线程函数接受任意数目的输入参数。</p>

<pre class="EnlighterJSRAW" data-enlighter-language="cpp" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">void func(int i, double d, const std::string&amp; s)
{
    std::cout &lt;&lt; i &lt;&lt; ", " &lt;&lt; d &lt;&lt; ", " &lt;&lt; s &lt;&lt; std::endl;
}

int main()
{
   std::thread t(func, 1, 12.50, "sample");
   t.join();
       
   return 0;

}</pre>

<p class="wp-block-paragraph">虽然可以向线程函数传递任意多参数，但都必须以值传递。如果需以引用传递，则必须以&nbsp;<code>std::ref</code>&nbsp;或&nbsp;<code>std::cref</code>&nbsp;封装，如下例所示：</p>

<pre class="EnlighterJSRAW" data-enlighter-language="cpp" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">void func(int&amp; a)
{
   a++;

}
 
 int main()
{
   int a = 42;
   std::thread t(func, std::ref(a));
   t.join();

   std::stringcout &lt;&lt; a &lt;&lt; std::endl;

   return 0;
}</pre>

<p class="wp-block-paragraph">这个程序会打印&nbsp;<code>43</code>，但如果不用&nbsp;<code>std::ref</code>&nbsp;封装，则输出会是&nbsp;<code>42</code>。</p>

<p class="wp-block-paragraph">除了&nbsp;<code>join</code>&nbsp;函数，这个类还提供更多的操作：</p>

<ul class="wp-block-list">
<li><code>swap</code>：交换两个线程实例的句柄</li>

<li><code>detach</code>：允许一个线程继续独立于线程实例运行；detach 过的线程不可以再 join</li>
</ul>

<pre class="EnlighterJSRAW" data-enlighter-language="generic" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">int main()
{
    std::thread t(funct);
    t.detach();

    return 0;
}</pre>

<p class="wp-block-paragraph">一个重要的知识点是，如果一个线程函数抛出异常，并不会被常规的&nbsp;<code>try-catch</code>&nbsp;方法捕获。也就是说，下面的写法是不会奏效的：</p>

<pre class="EnlighterJSRAW" data-enlighter-language="generic" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">try
{
    std::thread t1(func);
    std::thread t2(func);

    t1.join();
    t2.join();
}
catch(const std::exception&amp; ex)
{
    std::cout &lt;&lt; ex.what() &lt;&lt; std::endl;
}</pre>

<p class="wp-block-paragraph">要追踪线程间的异常，你可以在线程函数内捕获，暂时存储在一个稍后可以访问的结构内。</p>

<pre class="EnlighterJSRAW" data-enlighter-language="generic" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">std::mutex                       g_mutex;
std::vector&lt;std::exception_ptr>  g_exceptions;

void throw_function()
{
   throw std::exception("something wrong happened");
}

void func()
{
   try
   {
      throw_function();
   }
   catch(...)
   {
      std::lock_guard&lt;std::mutex> lock(g_mutex);
      g_exceptions.push_back(std::current_exception());
   }
}

int main()
{
   g_exceptions.clear();

   std::thread t(func);
   t.join();

   for(auto&amp; e : g_exceptions)
   {
      try 
      {
         if(e != nullptr)
         {
            std::rethrow_exception(e);
         }
      }
      catch(const std::exception&amp; e)
      {
         std::cout &lt;&lt; e.what() &lt;&lt; std::endl;
      }
   }

   return 0;
}</pre>

<p class="wp-block-paragraph">关于捕获和处理异常，更深入的信息可以参看&nbsp;<a href="http://binglongx.wordpress.com/2010/01/03/handling-c-exceptions-thrown-from-worker-thread-in-the-main-thread/" target="_blank" rel="noopener">Handling C++ exceptions thrown from worker thread in the main thread</a>&nbsp;和&nbsp;<a href="http://stackoverflow.com/questions/233127/how-can-i-propagate-exceptions-between-threads" target="_blank" rel="noopener">How can I propagate exceptions between threads?</a>&nbsp;。</p>

<p class="wp-block-paragraph">此外，值得注意的是，&nbsp;头文件还在 `std::this_thread` 命名空间下提供了一些辅助函数：</p>

<ul class="wp-block-list">
<li><a href="http://en.cppreference.com/w/cpp/thread/get_id" target="_blank" rel="noopener">get_id</a>: 返回当前线程的 id</li>

<li><a href="http://en.cppreference.com/w/cpp/thread/yield" target="_blank" rel="noopener">yield</a>: 告知调度器运行其他线程，可用于当前处于繁忙的等待状态</li>

<li><a href="http://en.cppreference.com/w/cpp/thread/sleep_for" target="_blank" rel="noopener">sleep_for</a>：给定时长，阻塞当前线程</li>

<li><a href="http://en.cppreference.com/w/cpp/thread/sleep_until" target="_blank" rel="noopener">sleep_until</a>：阻塞当前线程至给定时间点</li>
</ul>

<h2 class="wp-block-heading">锁</h2>

<p class="wp-block-paragraph">在上个例子中，我们需要对&nbsp;<code>g_exceptions</code>&nbsp;这个 vector 的访问进行同步处理，确保同一时刻只有一个线程能向它插入新的元素。为此我使用了一个 mutex 和一个锁（lock）。mutex 是同步操作的主体，在 C++ 11 的&nbsp;<code>&lt;mutex&gt;</code>&nbsp;头文件中，有四种风格的实现：</p>

<ul class="wp-block-list">
<li><a href="http://en.cppreference.com/w/cpp/thread/mutex" target="_blank" rel="noopener">mutex</a>：提供了核心的&nbsp;<code>lock()</code>&nbsp;<code>unlock()</code>&nbsp;方法，以及当 mutex 不可用时就会返回的非阻塞方法&nbsp;<code>try_lock()</code></li>

<li><a href="http://en.cppreference.com/w/cpp/thread/recursive_mutex" target="_blank" rel="noopener">recursive_mutex</a>：允许同一线程内对同一 mutex 的多重持有</li>

<li><a href="http://en.cppreference.com/w/cpp/thread/timed_mutex" target="_blank" rel="noopener">timed_mutex</a>： 与&nbsp;<code>mutex</code>&nbsp;类似，但多了&nbsp;<code>try_lock_for()</code>&nbsp;<code>try_lock_until()</code>&nbsp;两个方法，用于在特定时长里持有 mutex，或持有 mutex 直到某个特定时间点</li>

<li><a href="http://en.cppreference.com/w/cpp/thread/recursive_timed_mutex" target="_blank" rel="noopener">recursive_timed_mutex</a>：<code>recursive_mutex</code>&nbsp;和&nbsp;<code>timed_mutex</code>&nbsp;的结合</li>
</ul>

<p class="wp-block-paragraph">下面是一个使用&nbsp;<code>std::mutex</code>&nbsp;的例子（注意&nbsp;<code>get_id()</code>&nbsp;和&nbsp;<code>sleep_for()</code>&nbsp;两个辅助方法的使用，上文已有提及）。</p>

<pre class="EnlighterJSRAW" data-enlighter-language="generic" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">#include &lt;iostream>
#include &lt;thread>
#include &lt;mutex>
#include &lt;chrono>
 
std::mutex g_lock;
 
void func()
{
    g_lock.lock();
 
    std::cout &lt;&lt; "entered thread " &lt;&lt; std::this_thread::get_id() &lt;&lt; std::endl;
    std::this_thread::sleep_for(std::chrono::seconds(rand() % 10));
    std::cout &lt;&lt; "leaving thread " &lt;&lt; std::this_thread::get_id() &lt;&lt; std::endl;
 
    g_lock.unlock();
}
 
int main()
{
    srand((unsigned int)time(0));
 
    std::thread t1(func);
    std::thread t2(func);
    std::thread t3(func);
 
    t1.join();
    t2.join();
    t3.join();
 
    return 0;
}</pre>

<p class="wp-block-paragraph">输出如下：</p>

<pre class="EnlighterJSRAW" data-enlighter-language="generic" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">entered thread 10144
leaving thread 10144
entered thread 4188
leaving thread 4188
entered thread 3424
leaving thread 3424</pre>

<p class="wp-block-paragraph"><code>lock()</code>&nbsp;<code>unlock()</code>&nbsp;两个方法应该很好懂，前者锁住 mutex，如果该 mutex 不可用，则阻塞线程；稍后，后者解锁线程。</p>

<p class="wp-block-paragraph">下面一个例子展示了一个简单的线程安全的容器（内部使用了&nbsp;<code>std::vector</code>）。该容器提供用于添加单一元素的&nbsp;<code>add()</code>方法，以及添加多个元素的&nbsp;<code>addrange()</code>&nbsp;方法（内部调用&nbsp;<code>add()</code>&nbsp;实现）。</p>

<p class="wp-block-paragraph"><strong>注意</strong>：尽管如此，下面会指出，由于&nbsp;<code>va_args</code>&nbsp;的使用等原因，这个容器并非真正线程安全。此外，<code>dump()</code>&nbsp;方法不应属于容器，在实际实现中它应该作为一个独立的辅助函数。这个例子的目的仅仅是展示 mutex 的相关概念，而非实现一个完整的线程安全的容器。</p>

<pre class="EnlighterJSRAW" data-enlighter-language="generic" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">template &lt;typename T>
class container 
{
    std::mutex _lock;
    std::vector&lt;T> _elements;
public:
    void add(T element) 
    {
        _lock.lock();
        _elements.push_back(element);
        _lock.unlock();
    }
 
    void addrange(int num, ...)
    {
        va_list arguments;
 
        va_start(arguments, num);
 
        for (int i = 0; i &lt; num; i++)
        {
            _lock.lock();
            add(va_arg(arguments, T));
            _lock.unlock();
        }
 
        va_end(arguments); 
    }
 
    void dump()
    {
        _lock.lock();
        for(auto e : _elements)
            std::cout &lt;&lt; e &lt;&lt; std::endl;
        _lock.unlock();
    }
};
 
void func(container&lt;int>&amp; cont)
{
    cont.addrange(3, rand(), rand(), rand());
}
 
int main()
{
    srand((unsigned int)time(0));
 
    container&lt;int> cont;
 
    std::thread t1(func, std::ref(cont));
    std::thread t2(func, std::ref(cont));
    std::thread t3(func, std::ref(cont));
 
    t1.join();
    t2.join();
    t3.join();
 
    cont.dump();
 
    return 0;
}</pre>

<p class="wp-block-paragraph">当你运行这个程序时，会进入死锁。原因：在 mutex 被释放前，容器尝试多次持有它，这显然不可能。这就是为什么引入&nbsp;<code>std::recursive_mutex</code>&nbsp;，它允许一个线程对 mutex 多重持有。允许的最大持有次数并不确定，但当达到上限时，线程锁会抛出&nbsp;<a href="http://en.cppreference.com/w/cpp/error/system_error" target="_blank" rel="noopener"><code>std::system_error</code></a>&nbsp;错误。因此，要解决上面例子的错误，除了修改&nbsp;<code>addrange</code>&nbsp;令其不再调用&nbsp;<code>lock</code>&nbsp;和&nbsp;<code>unlock</code>&nbsp;之外，可以用&nbsp;<code>std::recursive_mutex</code>&nbsp;代替&nbsp;<code>mutex</code>。</p>

<pre class="EnlighterJSRAW" data-enlighter-language="generic" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">template &lt;typename T>
class container 
{
    std::recursive_mutex _lock;
    // ...
};</pre>

<p class="wp-block-paragraph">成功输出：</p>

<pre class="EnlighterJSRAW" data-enlighter-language="generic" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">6334
18467
41
6334
18467
41
6334
18467
41</pre>

<p class="wp-block-paragraph">敏锐的读者可能注意到，每次调用&nbsp;<code>func()</code>&nbsp;输出的都是相同的数字。这是因为，seed 是线程局部量，调用&nbsp;<code>srand()</code>&nbsp;只会在主线程中初始化 seed，在其他工作线程中 seed 并未被初始化，所以每次得到的数字都是一样的。</p>

<p class="wp-block-paragraph">手动加锁和解锁可能造成问题，比如忘记解锁或锁的次序出错，都会造成死锁。C++ 11 标准提供了若干类和函数来解决这个问题。封装类允许以 RAII 风格使用 mutex，在一个锁的生存周期内自动加锁和解锁。这些封装类包括：</p>

<ul class="wp-block-list">
<li><a href="http://en.cppreference.com/w/cpp/thread/lock_guardv" target="_blank" rel="noopener">lock_guard</a>：当一个实例被创建时，会尝试持有 mutex （通过调用&nbsp;<code>lock()</code>）；当实例销毁时，自动释放 mutex （通过调用&nbsp;<code>unlock()</code>）。不允许拷贝。</li>

<li><a href="http://en.cppreference.com/w/cpp/thread/unique_lock" target="_blank" rel="noopener">unique_lock</a>：通用 mutex 封装类，与&nbsp;<code>lock_guard</code>&nbsp;不同，还支持延迟锁、计时锁、递归锁、移交锁的持有权，以及使用条件变量。不允许拷贝，但允许转移（move）。</li>
</ul>

<p class="wp-block-paragraph">借助这些封装类，可以把容器改写为：</p>

<pre class="EnlighterJSRAW" data-enlighter-language="generic" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">template &lt;typename T>
class container 
{
    std::recursive_mutex _lock;
    std::vector&lt;T> _elements;
public:
    void add(T element) 
    {
        std::lock_guard&lt;std::recursive_mutex> locker(_lock);
        _elements.push_back(element);
    }
 
    void addrange(int num, ...)
    {
        va_list arguments;
 
        va_start(arguments, num);
 
        for (int i = 0; i &lt; num; i++)
        {
            std::lock_guard&lt;std::recursive_mutex> locker(_lock);
            add(va_arg(arguments, T));
        }
 
        va_end(arguments); 
    }
 
    void dump()
    {
        std::lock_guard&lt;std::recursive_mutex> locker(_lock);
        for(auto e : _elements)
            std::cout &lt;&lt; e &lt;&lt; std::endl;
    }
};</pre>

<p class="wp-block-paragraph">读者可能会提出， <code>dump()</code> 方法不更改容器的状态，应该设为 const。但如果你添加 const 关键字，会得到如下编译错误：</p>

<pre class="EnlighterJSRAW" data-enlighter-language="generic" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">‘std::lock_guard&lt;_Mutex>::lock_guard(_Mutex &amp;)' : cannot convert parameter 1 from ‘const std::recursive_mutex' to ‘std::recursive_mutex &amp;'</pre>

<p class="wp-block-paragraph">一个 mutex （不管何种风格）必须被持有和释放，这意味着 <code>lock()</code> <code>unlock</code> 方法必被调用，这两个方法是 non-const 的。所以，逻辑上 <code>lock_guard</code> 的声明不能是 const （若该方法 为 const，则 mutex 也为 const）。这个问题的解决办法是，将 mutex 设为 <code>mutable</code>。<code>mutable</code> 允许由 const 方法更改 mutex 状态。不过，这种用法仅限于隐式的，或「元（meta）」状态——譬如，运算过的高速缓存、检索完成的数据，使得下次调用能瞬间完成；或者，改变像 mutex 之类的位元，仅仅作为一个对象的实际状态的补充。</p>

<pre class="EnlighterJSRAW" data-enlighter-language="cpp" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">template &lt;typename T>
class container 
{
   mutable std::recursive_mutex _lock;
   std::vector&lt;T> _elements;
public:
   void dump() const
   {
      std::lock_guard&lt;std::recursive_mutex> locker(_lock);
      for(auto e : _elements)
         std::cout &lt;&lt; e &lt;&lt; std::endl;
   }
};</pre>

<p class="wp-block-paragraph">这些封装类锁的构造函数可以通过重载的声明来指定锁的策略。可用的策略有：</p>

<ul class="wp-block-list">
<li><code>defer_lock_t</code> 类型的 <code>defer_lock</code>：不持有 mutex</li>

<li><code>try_to_lock_t</code> 类型的 <code>try_to_lock</code>： 尝试持有 mutex 而不阻塞线程</li>

<li><code>adopt_lock_t</code> 类型的 <code>adopt_lock</code>：假定调用它的线程已持有 mutex</li>
</ul>

<p class="wp-block-paragraph">这些策略的声明方式如下：</p>

<pre class="EnlighterJSRAW" data-enlighter-language="cpp" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">struct defer_lock_t { };
struct try_to_lock_t { };
struct adopt_lock_t { };
 
constexpr std::defer_lock_t defer_lock = std::defer_lock_t();
constexpr std::try_to_lock_t try_to_lock = std::try_to_lock_t();
constexpr std::adopt_lock_t adopt_lock = std::adopt_lock_t();</pre>

<p class="wp-block-paragraph">除了这些 mutex 封装类之外，标准库还提供了两个方法用于锁住一个或多个 mutex：</p>

<ul class="wp-block-list">
<li><a href="http://en.cppreference.com/w/cpp/thread/lock" target="_blank" rel="noopener">lock</a>：锁住 mutex，通过一个避免了死锁的算法（通过调用 <code>lock()</code>，<code>try_lock()</code> 和 <code>unlock()</code> 实现）</li>

<li><a href="http://en.cppreference.com/w/cpp/thread/try_lock" target="_blank" rel="noopener">try_lock</a>：尝试通过调用 <code>try_lock()</code> 来调用多个 mutex，调用次序由 mutex 的指定次序而定</li>
</ul>

<p class="wp-block-paragraph">下面是一个死锁案例：有一个元素容器，以及一个 <code>exchange()</code> 函数用于互换两个容器里的某个元素。为了实现线程安全，这个函数通过一个和容器关联的 mutex，对这两个容器的访问进行同步。</p>

<pre class="EnlighterJSRAW" data-enlighter-language="generic" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">template &lt;typename T>
class container 
{
public:
    std::mutex _lock;
    std::set&lt;T> _elements;
 
    void add(T element) 
    {
        _elements.insert(element);
    }
 
    void remove(T element) 
    {
        _elements.erase(element);
    }
};
 
void exchange(container&lt;int>&amp; cont1, container&lt;int>&amp; cont2, int value)
{
    cont1._lock.lock();
    std::this_thread::sleep_for(std::chrono::seconds(1)); // &lt;-- forces context switch to simulate the deadlock
    cont2._lock.lock();    
 
    cont1.remove(value);
    cont2.add(value);
 
    cont1._lock.unlock();
    cont2._lock.unlock();
}</pre>

<p class="wp-block-paragraph">假如这个函数在两个线程中被调用，在其中一个线程中，一个元素被移出容器 1 而加到容器 2；在另一个线程中，它被移出容器 2 而加到容器 1。这可能导致死锁——当一个线程刚持有第一个锁，程序马上切入另一个线程的时候。</p>

<pre class="EnlighterJSRAW" data-enlighter-language="cpp" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">int main()
{
    srand((unsigned int)time(NULL));
 
    container&lt;int> cont1; 
    cont1.add(1);
    cont1.add(2);
    cont1.add(3);
 
    container&lt;int> cont2; 
    cont2.add(4);
    cont2.add(5);
    cont2.add(6);
 
    std::thread t1(exchange, std::ref(cont1), std::ref(cont2), 3);
    std::thread t2(exchange, std::ref(cont2), std::ref(cont1), 6);
 
    t1.join();
    t2.join();
 
    return 0;
}</pre>

<p class="wp-block-paragraph">要解决这个问题，可以使用 <code>std::lock</code>，保证所有的锁都以不会死锁的方式被持有：</p>

<pre class="EnlighterJSRAW" data-enlighter-language="cpp" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">void exchange(container&lt;int>&amp; cont1, container&lt;int>&amp; cont2, int value)
{
    std::lock(cont1._lock, cont2._lock); 
 
    cont1.remove(value);
    cont2.add(value);
 
    cont1._lock.unlock();
    cont2._lock.unlock();
}</pre>

<h2 class="wp-block-heading">条件变量</h2>

<p class="wp-block-paragraph">C++ 11 提供的另一个同步机制是条件变量，用于阻塞一个或多个线程，直到接收到另一个线程的通知信号，或暂停信号，或<a href="https://en.wikipedia.org/wiki/Spurious_wakeup" target="_blank" rel="noopener">伪唤醒</a>信号。在 <code>&lt;condition_variable></code> 头文件里，有两个风格的条件变量实现：</p>

<ul class="wp-block-list">
<li><a href="http://en.cppreference.com/w/cpp/thread/condition_variable" target="_blank" rel="noopener">condition_variable</a>：所有需要等待这个条件变量的线程，必须先持有一个 <code>std::unique_lock</code></li>

<li><a href="http://en.cppreference.com/w/cpp/thread/condition_variable_any" target="_blank" rel="noopener">condition_variable_any</a>：更通用的实现，任何满足锁的基本条件（提供 <code>lock()</code> 和 <code>unlock()</code> 功能）的类型都可以使用；在性能和系统资源占用方面可能消耗更多，因而只有在它的灵活性成为必需的情况下才应优先使用</li>
</ul>

<p class="wp-block-paragraph">条件变量的工作机制如下：</p>

<ul class="wp-block-list">
<li>至少有一个线程在等待某个条件成立。等待的线程必须先持有一个 <code>unique_lock</code> 锁。这个锁被传递给 <code>wait()</code> 方法，这会释放 mutex，阻塞线程直至条件变量收到通知信号。当收到通知信号，线程唤醒，重新持有锁。</li>

<li>至少有一个线程在发送条件成立的通知信号。信号的发送可以用 <a href="http://en.cppreference.com/w/cpp/thread/condition_variable/notify_one" target="_blank" rel="noopener"><code>notify_one()</code></a> 方法， 只解锁任意一个正在等待通知信号的线程，也可以用 <a href="http://en.cppreference.com/w/cpp/thread/condition_variable/notify_all" target="_blank" rel="noopener"><code>notify_all()</code></a> 方法， 解锁所有等待条件成立信号的线程。</li>

<li>在多核处理器系统上，由于使条件唤醒完全可预测的某些复杂机制的存在，可能发生伪唤醒，即一个线程在没有别的线程发送通知信号时也会唤醒。因而，当线程唤醒时，检查条件是否成立是必要的。而且，伪唤醒可能多次发生，所以条件检查要在一个循环里进行。</li>
</ul>

<p class="wp-block-paragraph">下面的代码展示使用条件变量进行线程同步的实例： 几个工作员线程在运行过程中会产生错误，他们将错误码存在一个队列里。一个记录员线程处理这些错误码，将错误码从记录队列里取出并打印出来。工作员会在发生错误时，给记录员发送信号。记录员则等待条件变量的通知信号。为了避免伪唤醒，等待工作放在一个检查布尔值的循环内。</p>

<pre class="EnlighterJSRAW" data-enlighter-language="cpp" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">#include &lt;thread>
#include &lt;mutex>
#include &lt;condition_variable>
#include &lt;iostream>
#include &lt;queue>
#include &lt;random>

std::mutex              g_lockprint;
std::mutex              g_lockqueue;
std::condition_variable g_queuecheck;
std::queue&lt;int>         g_codes;
bool                    g_done;
bool                    g_notified;

void workerfunc(int id, std::mt19937&amp; generator)
{
    // print a starting message
    {
        std::unique_lock&lt;std::mutex> locker(g_lockprint);
        std::cout &lt;&lt; "[worker " &lt;&lt; id &lt;&lt; "]\trunning..." &lt;&lt; std::endl;
    }

    // simulate work
    std::this_thread::sleep_for(std::chrono::seconds(1 + generator() % 5));

    // simulate error
    int errorcode = id*100+1;
    {
        std::unique_lock&lt;std::mutex> locker(g_lockprint);
        std::cout  &lt;&lt; "[worker " &lt;&lt; id &lt;&lt; "]\tan error occurred: " &lt;&lt; errorcode &lt;&lt; std::endl;
    }

    // notify error to be logged
    {
        std::unique_lock&lt;std::mutex> locker(g_lockqueue);
        g_codes.push(errorcode);
        g_notified = true;
        g_queuecheck.notify_one();
    }
}

void loggerfunc()
{
    // print a starting message
    {
        std::unique_lock&lt;std::mutex> locker(g_lockprint);
        std::cout &lt;&lt; "[logger]\trunning..." &lt;&lt; std::endl;
    }

    // loop until end is signaled
    while(!g_done)
    {
        std::unique_lock&lt;std::mutex> locker(g_lockqueue);

        while(!g_notified) // used to avoid spurious wakeups 
        {
            g_queuecheck.wait(locker);
        }

        // if there are error codes in the queue process them
        while(!g_codes.empty())
        {
            std::unique_lock&lt;std::mutex> locker(g_lockprint);
            std::cout &lt;&lt; "[logger]\tprocessing error:  " &lt;&lt; g_codes.front()  &lt;&lt; std::endl;
            g_codes.pop();
        }

        g_notified = false;
    }
}

int main()
{
    // initialize a random generator
    std::mt19937 generator((unsigned int)std::chrono::system_clock::now().time_since_epoch().count());

    // start the logger
    std::thread loggerthread(loggerfunc);

    // start the working threads
    std::vector&lt;std::thread> threads;
    for(int i = 0; i &lt; 5; ++i)
    {
        threads.push_back(std::thread(workerfunc, i+1, std::ref(generator)));
    }

    // work for the workers to finish
    for(auto&amp; t : threads)
        t.join();

    // notify the logger to finish and wait for it
    g_done = true;
    loggerthread.join();

    return 0;
}</pre>

<p class="wp-block-paragraph">运行这个程序，输出如下（注意这个输出在每次运行下都会改变，因为每个工作员线程的工作和休眠的时间间隔是任意的）：</p>

<pre class="EnlighterJSRAW" data-enlighter-language="generic" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">[logger]        running...
[worker 1]      running...
[worker 2]      running...
[worker 3]      running...
[worker 4]      running...
[worker 5]      running...
[worker 1]      an error occurred: 101
[worker 2]      an error occurred: 201
[logger]        processing error:  101
[logger]        processing error:  201
[worker 5]      an error occurred: 501
[logger]        processing error:  501
[worker 3]      an error occurred: 301
[worker 4]      an error occurred: 401
[logger]        processing error:  301
[logger]        processing error:  401</pre>

<p class="wp-block-paragraph">上面的 <code>wait()</code> 有两个重载：</p>

<ul class="wp-block-list">
<li>其中一个只需要传入一个 <code>unique_lock</code>；这个重载方法释放锁，阻塞线程并将其添加到一个等待该条件变量的线程队列里；该线程在收到条件变量通知信号或伪唤醒时唤醒，这时锁被重新持有，函数返回。</li>

<li>另外一个在 <code>unique_lock</code> 之外，还接收一个谓词（predicate），循环直至其返回 false；这个重载可用于避免伪唤醒，其功能类似于：</li>
</ul>

<pre class="EnlighterJSRAW" data-enlighter-language="cpp" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">while(!predicate()) 
    wait(lock);</pre>

<p class="wp-block-paragraph">于是，上面例子中布尔值 <code>g_notified</code> 可以不用，而代之以 <code>wait</code> 的接收谓词的重载，用于确认状态队列的状态（是否为空）：</p>

<pre class="EnlighterJSRAW" data-enlighter-language="cpp" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">void workerfunc(int id, std::mt19937&amp; generator)
{
    // print a starting message
    {
        std::unique_lock&lt;std::mutex> locker(g_lockprint);
        std::cout &lt;&lt; "[worker " &lt;&lt; id &lt;&lt; "]\trunning..." &lt;&lt; std::endl;
    }

    // simulate work
    std::this_thread::sleep_for(std::chrono::seconds(1 + generator() % 5));

    // simulate error
    int errorcode = id*100+1;
    {
        std::unique_lock&lt;std::mutex> locker(g_lockprint);
        std::cout &lt;&lt; "[worker " &lt;&lt; id &lt;&lt; "]\tan error occurred: " &lt;&lt; errorcode &lt;&lt; std::endl;
    }

    // notify error to be logged
    {
        std::unique_lock&lt;std::mutex> locker(g_lockqueue);
        g_codes.push(errorcode);
        g_queuecheck.notify_one();
    }
}

void loggerfunc()
{
    // print a starting message
    {
        std::unique_lock&lt;std::mutex> locker(g_lockprint);
        std::cout &lt;&lt; "[logger]\trunning..." &lt;&lt; std::endl;
    }

    // loop until end is signaled
    while(!g_done)
    {
        std::unique_lock&lt;std::mutex> locker(g_lockqueue);

        g_queuecheck.wait(locker, [&amp;](){return !g_codes.empty();});

        // if there are error codes in the queue process them
        while(!g_codes.empty())
        {
            std::unique_lock&lt;std::mutex> locker(g_lockprint);
            std::cout &lt;&lt; "[logger]\tprocessing error:  " &lt;&lt; g_codes.front() &lt;&lt; std::endl;
            g_codes.pop();
        }
    }
}</pre>

<p class="wp-block-paragraph">除了可重载的 <code>wait()</code>，还有另外两个等待方法，都有类似的接收谓词以避免伪唤醒的重载方法：</p>

<ul class="wp-block-list">
<li><a href="http://en.cppreference.com/w/cpp/thread/condition_variable/wait_for" target="_blank" rel="noopener">wait_for</a>：阻塞线程，直至收到条件变量通知信号，或指定时间段已过去。</li>

<li><a href="http://en.cppreference.com/w/cpp/thread/condition_variable/wait_until" target="_blank" rel="noopener">wait_until</a>：阻塞线程，直到收到条件变量通知信号，或指定时间点已达到。</li>
</ul>

<p class="wp-block-paragraph">这两个方法如果不传入谓词，会返回一个 <a href="http://en.cppreference.com/w/cpp/thread/cv_status" target="_blank" rel="noopener"><code>cv_status</code></a>，告知是到达设定时间还是线程因条件变量通知信号或伪唤醒而唤醒。</p>

<p class="wp-block-paragraph">标准库还提供了 <a href="http://en.cppreference.com/w/cpp/thread/notify_all_at_thread_exit" target="_blank" rel="noopener"><code>notify_all_at_thread_exit</code></a> 方法，实现了通知其他线程某个给定线程已经结束，以及销毁所有 <code>thread_local</code> 实例的机制。引入这个方法的原因是，在使用 <code>thread_local</code> 时， 等待一些通过非 <code>join()</code> 机制引入的线程可能造成错误行为，因为在等待的线程恢复或可能结束之后，他们的析构方法可能还在被调用（参看 <a href="http://www.open-std.org/jtc1/sc22/wg21/docs/papers/2010/n3070.html" target="_blank" rel="noopener">N3070</a> 和 <a href="http://www.open-std.org/jtc1/sc22/wg21/docs/papers/2009/n2880.html" target="_blank" rel="noopener">N2880</a>）。特别的，对这个函数的一个调用，必须发生在线程刚好退出之前。下面是一个 <code>notify_all_at_thread_exit</code> 和 <code>condition_variable</code> 搭配使用来同步两个线程的实例：</p>

<pre class="EnlighterJSRAW" data-enlighter-language="cpp" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">std::mutex              g_lockprint;
std::mutex              g_lock;
std::condition_variable g_signal;
bool                    g_done;

void workerfunc(std::mt19937&amp; generator)
{
   {
      std::unique_lock&lt;std::mutex> locker(g_lockprint);
      std::cout &lt;&lt; "worker running..." &lt;&lt; std::endl;
   }

   std::this_thread::sleep_for(std::chrono::seconds(1 + generator() % 5));

   {
      std::unique_lock&lt;std::mutex> locker(g_lockprint);
      std::cout &lt;&lt; "worker finished..." &lt;&lt; std::endl;
   }

   std::unique_lock&lt;std::mutex> lock(g_lock);
   g_done = true;
   std::notify_all_at_thread_exit(g_signal, std::move(lock));
}

int main()
{
   // initialize a random generator
   std::mt19937 generator((unsigned int)std::chrono::system_clock::now().time_since_epoch().count());

   std::cout &lt;&lt; "main running..." &lt;&lt; std::endl;

   std::thread worker(workerfunc, std::ref(generator));
   worker.detach();

   std::cout &lt;&lt; "main crunching..." &lt;&lt; std::endl;

   std::this_thread::sleep_for(std::chrono::seconds(1 + generator() % 5));

   {
      std::unique_lock&lt;std::mutex> locker(g_lockprint);
      std::cout &lt;&lt; "main waiting for worker..." &lt;&lt; std::endl;
   }

   std::unique_lock&lt;std::mutex> lock(g_lock);
   while(!g_done) // avoid spurious wake-ups
      g_signal.wait(lock);

   std::cout &lt;&lt; "main finished..." &lt;&lt; std::endl;

   return 0;
}</pre>

<p class="wp-block-paragraph">如果 worker 在主线程之前结束，输出如下：</p>

<pre class="EnlighterJSRAW" data-enlighter-language="generic" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">main running...
worker running...
main crunching...
worker finished...
main waiting for worker...
main finished...</pre>

<p class="wp-block-paragraph">如果主线程在 worker 线程之前结束，输出如下：</p>

<pre class="EnlighterJSRAW" data-enlighter-language="generic" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">main running...
worker running...
main crunching...
main waiting for worker...
worker finished...
main finished...</pre>

<h2 class="wp-block-heading">小结</h2>

<p class="wp-block-paragraph">C++ 11 允许开发者们以标准的、不依赖于平台的方式编写多线程程序。这篇文章概述了标准库对于线程和同步操作机制的支持。<code>&lt;thread></code>头文件提供代表操作线程 <code>thread</code> 类和配套辅助方法。<code>&lt;mutex></code> 头文件提供几种 mutex 互斥锁及封装类，提供多线程同步访问机制。<code>&lt;condition_variable></code> 提供两种条件变量的实现，支持阻塞一个或多个线程直至接收到另一个线程发送的通知信号，或到达设定时间，或发生伪唤醒。建议读者对相关话题进行拓展阅读。</p>

<h2 class="wp-block-heading">参考资料</h2>

<ul class="wp-block-list">
<li><a href="https://www.codeproject.com/Articles/598695/Cplusplus-threads-locks-and-condition-variables" target="_blank" rel="noopener">C++11 Threads, Locks and Condition Variables</a></li>
</ul>

<p class="wp-block-paragraph"></p>
