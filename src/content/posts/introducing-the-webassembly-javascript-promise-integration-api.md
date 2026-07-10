---
title: "介绍 WebAssembly JavaScript Promise 集成 API（译：Introducing the WebAssembly JavaScript Promise Integration API）"
description: "一些 WebAssembly 应用程序在开发时，默认外部以同步的方式访问自身。在 JavaScript Promise 集成 (JSPI) API 的帮助下，使得 WebAssem…"
pubDatetime: 2024-07-13T09:00:00.000Z
modDatetime: 2025-02-27T15:05:50.000Z
draft: false
hiddenLocales: ["en"]
tags: ["C++","JavaScript","WebAssembly"]
---

一些 WebAssembly 应用程序在开发时，默认外部以同步的方式访问自身。在 JavaScript Promise 集成 (JSPI) API 的帮助下，使得 WebAssembly 应用程序能够接受外部的异步访问。本文概述了 JSPI API 的核心功能、如何访问它、如何为其开发软件，并提供了一些示例供尝试。

## JSPI 是做什么的

异步 API 通过将操作的启动与其解决分离来运行；后者通常会在前者之后一段时间完成。最重要的是，应用程序在启动操作后继续执行，并在操作完成时收到通知。

例如，通过使用 `fetch` API，Web 应用程序可以访问与 URL 相关的内容；然而，`fetch` 函数并不会直接返回获取的结果，而是返回一个 Promise 对象。通过将回调函数附加到该 Promise 对象，`fetch` 响应与原始请求之间的连接得以重新建立。回调函数可以检查响应并收集数据（当然，如果数据存在的话）。

在许多情况下，C/C++（以及许多其他语言）应用程序最初是基于同步 API 编写的。例如，Posix 的 `read` 函数在 I/O 操作完成之前不会返回：`read` 函数会阻塞，直到读取完成。

然而，浏览器的主线程不能被阻塞，许多环境也不支持同步编程。结果是应用程序开发者希望使用简单易用的 API，但与之相对的是，整个生态系统要求 I/O 操作必须通过异步代码来实现。这对于现有的传统应用程序尤其成问题，因为将它们迁移到异步编程的成本很高。

JSPI（JavaScript Promise Integration）是一个弥合同步应用程序和异步 Web API 之间差距的 API。它通过拦截异步 Web API 函数返回的 Promise 对象，并暂停 WebAssembly 应用程序来工作。当异步 I/O 操作完成时，WebAssembly 应用程序会恢复执行。这使得 WebAssembly 应用程序能够使用线性代码来执行异步操作，并处理其结果。

最重要的是，使用 JSPI 对 WebAssembly 应用程序本身的修改非常少。

### JSPI 是如何工作的

JSPI 的工作原理是：拦截从 JavaScript 调用返回的 Promise 对象，并暂停 WebAssembly 应用程序的主逻辑。一个回调函数会附加到这个 Promise 对象上，当浏览器的事件循环任务执行时，这个回调会恢复被暂停的 WebAssembly 代码。

此外，WebAssembly 导出（export）被重构为返回一个 Promise 对象，而不是原始的返回值。这个 Promise 对象成为 WebAssembly 应用程序返回的值：当 WebAssembly 代码被暂停时，导出的 Promise 对象作为调用 WebAssembly 时的返回值。

当原始调用完成时，导出的 Promise 会被解析：如果原始 WebAssembly 函数返回一个正常的值，那么导出的 Promise 对象会用该值（转换为 JavaScript 对象）来解析；如果抛出了异常，则导出的 Promise 对象会被拒绝。

#### 封装导入和导出

这通过在 WebAssembly 模块实例化阶段包装导入和导出实现。函数包装器为正常的异步导入添加了暂停行为，并将暂停操作路由到 Promise 对象回调。

并非所有的 WebAssembly 模块的导入和导出都需要包装。那些执行路径不涉及调用异步 API 的导出最好不要包装。类似地，并非所有的 WebAssembly 模块的导入都是异步 API 函数，这些导入也不应包装。

当然，有许多内部机制使得这一切得以实现；但 JSPI 并没有改变 JavaScript 语言或 WebAssembly 本身。它的操作仅限于 JavaScript 和 WebAssembly 之间的边界。

从 Web 应用程序开发者的角度来看，结果是一个代码体，类似于其他用 JavaScript 编写的异步函数，参与 JavaScript 世界中的异步函数和 Promises。从 WebAssembly 开发者的角度来看，这使得他们可以使用同步 API 编写应用程序，同时也能参与到 Web 的异步生态系统中。

### 预期性能

由于用于暂停和恢复 WebAssembly 模块的机制本质上是常数时间操作，我们预计使用 JSPI 不会带来高昂的成本——尤其是与其他基于转换的方法相比。

需要做的工作量是常量级的，也就是将异步 API 调用返回的 Promise 对象传递给 WebAssembly。同样，当 Promise 被解析时，WebAssembly 应用程序可以以常数时间的开销恢复。

然而，和浏览器中其他基于 Promise 的 API 一样，任何时候 WebAssembly 应用程序暂停时，除非由浏览器的任务执行器唤醒，否则它不会再被“唤醒”。这要求启动 WebAssembly 计算的 JavaScript 代码本身能够返回给浏览器。

### 可以使用 JSPI 来暂停 JavaScript 程序吗

JavaScript 已经拥有一个成熟的机制来表示异步计算：Promise 对象和 async 函数语法。JSPI 旨在与这一机制良好集成，而不是取而代之。

### 现在如何使用 JSPI

JSPI 目前正在由 W3C WebAssembly 工作组标准化。到目前为止，它已经进入标准化过程的第 3 阶段，我们预计将在 2024 年底前完成完全标准化。

JSPI 在 Linux、MacOS、Windows 和 ChromeOS 上的 Chrome 浏览器中可用，支持 Intel 和 ARM 平台，包括 64 位和 32 位版本。

目前，JSPI 可以通过两种方式使用：通过原型试验和本地 Chrome flags。要在本地测试，打开 Chrome 浏览器，访问 chrome://flags，搜索“Experimental WebAssembly JavaScript Promise Integration (JSPI)”并勾选该选项。按照提示重新启动浏览器以使其生效。

您应至少使用版本 126.0.6478.26，以获取最新版本的 API。我们建议使用开发者频道（Dev Channel），以确保应用所有稳定性更新。此外，如果您希望使用 Emscripten 生成 WebAssembly（我们推荐使用），则应使用至少 3.1.61 版本。

启用后，您应该能够运行使用 JSPI 的脚本。下面我们展示了如何使用 Emscripten 生成一个在 C/C++ 中使用 JSPI 的 WebAssembly 模块。如果您的应用程序使用其他语言（例如没有使用 Emscripten），我们建议您查看提案以了解 API 如何工作。

#### 限制

Chrome 实现的 JSPI 已经支持典型的使用案例。然而，它仍然被视为实验性功能，因此存在一些需要注意的限制：

- 需要使用命令行标志或参与原型试验。
- 每次调用 JSPI 导出时，都会在固定大小的栈上运行。
- 调试支持相对有限。特别是，在开发者工具面板中可能很难看到不同的事件。为 JSPI 应用程序提供更丰富的调试支持在未来的路线图中。

## 使用示例

为了看到这一切的工作效果，让我们尝试一个简单的例子。这个 C 程序以一种极其糟糕的方式计算斐波那契数列：通过让 JavaScript 来做加法，甚至更糟的是，使用 JavaScript 的 Promise 对象来完成这个任务：

```c
long promiseFib(long x) {
 if (x == 0)
   return 0;
 if (x == 1)
   return 1;
 return promiseAdd(promiseFib(x - 1), promiseFib(x - 2));
}
// promise an addition
EM_ASYNC_JS(long, promiseAdd, (long x, long y), {
  return Promise.resolve(x+y);
});
```

`promiseFib` 函数本身是一个直白的递归版本的斐波那契函数。从我们的角度来看，最有趣的部分是 `promiseAdd` 的定义，它用 JSPI 完成了两个斐波那契数的一半的加法操作！

我们使用 Emscripten 宏 `EM_ASYNC_JS` 在 C 程序的主体中编写了 `promiseFib` 函数作为一个 JavaScript 函数。由于加法操作通常不涉及 JavaScript 中的 Promise，因此我们需要通过构造一个 Promise 来强制使用它。

`EM_ASYNC_JS` 宏生成了所有必要的胶水代码，以便我们可以使用 JSPI 像调用普通函数一样访问 Promise 的结果。

为了编译我们的这个小示例，我们使用 Emscripten 的 `emcc` 编译器：

```bash
emcc -O3 badfib.c -o b.html -s JSPI
```

这将编译我们的程序，生成一个可加载的 HTML 文件（b.html）。这里最特别的命令行选项是 `-s JSPI`。这个选项用于生成代码，使其能够使用 JSPI 与返回 Promise 的 JavaScript 导入进行交互。

如果你将生成的 b.html 文件加载到 Chrome 中，你应该能看到类似以下的输出：

```text
fib(0) 0μs 0μs 0μs
fib(1) 0μs 0μs 0μs
fib(2) 0μs 0μs 3μs
fib(3) 0μs 0μs 4μs
…
fib(15) 0μs 13μs 1225μs
```

这只是前 15 个 Fibonacci 数字的列表，后面跟着计算单个 Fibonacci 数字所需的平均时间（单位为微秒）。每行上的三个时间值分别表示纯 WebAssembly 计算所需的时间、混合 JavaScript/WebAssembly 计算所需的时间，以及第三个数字表示挂起版本计算所需的时间。

需要注意的是，fib(2) 是涉及访问 Promise 的最小计算，而在计算 fib(15) 时，大约进行了 1000 次对 `promiseAdd` 的调用。这表明，使用 JSPI 的函数的实际开销大约为 1 微秒 —— 这个开销显著高于仅仅加两个整数所需的时间，但比访问外部 I/O 函数所需的毫秒级时间要小得多。

## 使用 JSPI 延迟加载代码

在下一个示例中，我们将查看一个可能有些令人惊讶的 JSPI 用法：动态加载代码。我们的想法是获取一个包含所需代码的模块，但将其延迟到需要的函数第一次被调用时再加载。

我们需要使用 JSPI，因为像 fetch 这样的 API 本质上是异步的，但我们希望能够从应用程序中的任意位置调用它们——特别是从尚不存在的函数的调用中间。

核心思路是用一个存根替换动态加载的函数；这个存根首先加载缺失的函数代码，使用加载的代码替换自己，然后使用原始参数调用新加载的代码。任何后续对该函数的调用都直接进入已加载的函数。这个策略使得动态加载代码的过程几乎是透明的。

我们将要加载的模块非常简单，它包含一个返回 42 的函数：

```c
// This is a simple provider of forty-two
#include <emscripten.h>

EMSCRIPTEN_KEEPALIVE long provide42(){
  return 42l;
}
```

该函数位于名为 `p42.c` 的文件中，并且通过 Emscripten 编译生成，没有构建任何“额外的”内容：

```bash
emcc p42.c -o p42.wasm --no-entry -Wl,--import-memory
```

`EMSCRIPTEN_KEEPALIVE` 是 Emscripten 的一个宏，它确保函数 `provide42` 不会被消除，即使它在代码中没有被使用。这样生成的 WebAssembly 模块就包含了我们想要动态加载的函数。

我们在编译 `p42.c` 时添加的 `-Wl,--import-memory` 标志是为了确保它能够访问与主模块相同的内存。

为了动态加载代码，我们使用标准的 `WebAssembly.instantiateStreaming` API：

```js
WebAssembly.instantiateStreaming(fetch('p42.wasm'));
```

该表达式使用 `fetch` 定位已编译的 Wasm 模块，使用 `WebAssembly.instantiateStreaming` 编译 `fetch` 的结果，并从中创建一个实例化的模块。`fetch` 和 `WebAssembly.instantiateStreaming` 都返回 Promises；因此，我们不能直接访问结果并提取所需的函数。相反，我们使用 `EM_ASYNC_JS` 宏将其包装成一个 JSPI 风格的导入：

```js
EM_ASYNC_JS(fooFun, resolveFun, (), {
  console.log('loading promise42');
  LoadedModule = (await WebAssembly.instantiateStreaming(fetch('p42.wasm'))).instance;
  return addFunction(LoadedModule.exports['provide42']);
});
```

注意 `console.log` 的调用，我们将使用它来确保我们的逻辑是正确的。

`addFunction` 是 Emscripten API 的一部分，但为了确保它在运行时可用，我们需要通知 `emcc` 它是一个必需的依赖项。我们在以下代码行中实现这一点：

```c
EM_JS_DEPS(funDeps, "$addFunction")
```

在我们希望动态加载代码的情况下，我们希望确保不会不必要地加载代码；在这种情况下，我们希望确保后续对 `provide42` 的调用不会触发重新加载。C 语言提供了一个简单的功能可以用来实现这一点：我们不是直接调用 `provide42`，而是通过一个 trampoline 函数来加载这个函数，然后，在实际调用该函数之前，修改 trampoline 函数来绕过自己。我们可以通过合适的函数指针来实现这一点：

```c
extern fooFun get42;

long stub(){
  get42 = resolveFun();
  return get42();
}

fooFun get42 = stub;
```

从程序的其他部分来看，我们想要调用的函数叫做 `get42`。它的初始实现是通过一个 stub 函数，该函数调用 `resolveFun` 来实际加载 `provide42`。加载成功后，我们将 `get42` 指向新加载的函数，然后调用它。

我们的主函数调用 `get42` 两次：

```c
int main() {
  printf("first call p42() = %ld\n", get42());
  printf("second call = %ld\n", get42());
}
```

在浏览器中运行这个代码的结果是一个日志，看起来像这样：

```text
loading promise42
first call p42() = 42
second call = 42
```

请注意，`loading promise42` 这一行只出现了一次，而 `get42` 实际上被调用了两次。

这个例子演示了 JSPI 可以以一些意想不到的方式使用：动态加载代码似乎与创建 Promise 相距甚远。此外，还有其他方式可以将 WebAssembly 模块动态链接在一起；这并不意味着这是解决该问题的最终方案。

我们非常期待看到您能利用这一新功能做些什么！欢迎加入 W3C WebAssembly 社区组的讨论，参与 GitHub 上的讨论。

## 附：完整代码

### `badfib`

```c
#include <stdio.h>
#include <stdlib.h>
#include <time.h>
#include <emscripten.h>

typedef long (testFun)(long, int);

#define microSeconds (1000000)

long add(long x, long y) {
  return x + y;
}

// Ask JS to do the addition
EM_JS(long, jsAdd, (long x, long y), {
  return x + y;
});

// promise an addition
EM_ASYNC_JS(long, promiseAdd, (long x, long y), {
  return Promise.resolve(x+y);
});

__attribute__((noinline))
long localFib(long x) {
 if (x==0)
   return 0;
 if (x==1)
   return 1;
 return add(localFib(x - 1), localFib(x - 2));
}

__attribute__((noinline))
long jsFib(long x) {
  if (x==0)
    return 0;
  if (x==1)
    return 1;
  return jsAdd(jsFib(x - 1), jsFib(x - 2));
}

__attribute__((noinline))
long promiseFib(long x) {
  if (x==0)
    return 0;
  if (x==1)
    return 1;
  return promiseAdd(promiseFib(x - 1), promiseFib(x - 2));
}

long runLocal(long x, int count) {
  long temp = 0;
  for(int ix = 0; ix < count; ix++)
    temp += localFib(x);
  return temp / count;
}

long runJs(long x,int count) {
  long temp = 0;
  for(int ix = 0; ix < count; ix++)
    temp += jsFib(x);
  return temp / count;
}

long runPromise(long x, int count) {
  long temp = 0;
  for(int ix = 0; ix < count; ix++)
    temp += promiseFib(x);
  return temp / count;
}

double runTest(testFun test, int limit, int count){
  clock_t start = clock();
  test(limit, count);
  clock_t stop = clock();
  return ((double)(stop - start)) / CLOCKS_PER_SEC;
}

void runTestSequence(int step, int limit, int count) {
  for (int ix = 0; ix <= limit; ix += step){
    double light = (runTest(runLocal, ix, count) / count) * microSeconds;
    double jsTime = (runTest(runJs, ix, count) / count) * microSeconds;
    double promiseTime = (runTest(runPromise, ix, count) / count) * microSeconds;
    printf("fib(%d) %gμs %gμs %gμs %gμs\n",ix, light, jsTime, promiseTime, (promiseTime - jsTime));
  }
}

EMSCRIPTEN_KEEPALIVE int main() {
  int step =  1;
  int limit = 15;
  int count = 1000;
  runTestSequence(step, limit, count);
  return 0;
}
```

### `u42.c`

```c
#include <stdio.h>
#include <emscripten.h>

typedef long (*fooFun)();

// promise a function
EM_ASYNC_JS(fooFun, resolveFun, (), {
  console.log('loading promise42');
  LoadedModule = (await WebAssembly.instantiateStreaming(fetch('p42.wasm'))).instance;
  return addFunction(LoadedModule.exports['provide42']);
});

EM_JS_DEPS(funDeps, "$addFunction")

extern fooFun get42;

long stub() {
  get42 = resolveFun();
  return get42();
}

fooFun get42 = stub;

int main() {
  printf("first call p42() = %ld\n", get42());
  printf("second call = %ld\n", get42());
}
```

### p42.c

```c
#include <emscripten.h>

EMSCRIPTEN_KEEPALIVE long provide42() {
  return 42l;
}
```
