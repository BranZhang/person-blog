---
title: "React Compiler 为什么会让 MobX observer 渲染出旧数据"
description: "从一个最小复现出发，分析 React Compiler 的 JSX memoization 如何与 MobX 的内部可变状态发生冲突，以及现阶段的规避方式和责任边界。"
pubDatetime: 2026-07-13T00:00:00.000Z
draft: false
hiddenLocales: ["en"]
tags: ["React", "React Compiler", "MobX", "JavaScript"]
---

最近在给一个 React 19 + MobX 项目启用 React Compiler 时，我遇到了一个很安静、也很危险的问题：MobX Store 中的值正常变化，组件也没有报错，但页面始终停留在初始值。

这个问题最终被整理成了一个[最小复现仓库](https://github.com/BranZhang/react-compiler-mobx-repro)。更值得记录的是，最初我把它理解成了“Compiler 缓存 observable 读取，导致 MobX 订阅丢失”；检查实际编译产物后才发现，这个判断并不准确。**MobX 仍在触发渲染，observable 也仍然被读取，真正陈旧的是 React Compiler 缓存下来的 JSX。**

这篇文章从复现代码出发，解释 React Compiler 的 memoization 为什么会与 MobX `observer` 的响应式模型冲突，以及在双方正式解决兼容性之前，应用应该怎么处理。

## 最小复现

Store 只是一个普通的 MobX 计数器：

```ts
import { action, makeObservable, observable } from "mobx";

class CounterStore {
  count = 0;

  constructor() {
    makeObservable(this, {
      count: observable,
      increment: action,
    });
  }

  increment() {
    this.count += 1;
  }
}

export const COUNTER_STORE = new CounterStore();
```

组件先声明为顶层函数，再交给 `observer` 包装：

```tsx
function PlainComponent() {
  const count = COUNTER_STORE.count;
  return <div>plain observer: {count}</div>;
}

const Plain = observer(PlainComponent);
```

React Compiler 使用 `infer` 模式：

```ts
react({
  babel: {
    plugins: [
      [
        "babel-plugin-react-compiler",
        {
          compilationMode: "infer",
        },
      ],
    ],
  },
});
```

连续点击三次 `increment()` 后，Store 中的 `count` 已经是 `3`，界面却一直显示：

```text
plain observer: 0
```

关闭 React Compiler 后一切正常；在组件中加入 `'use no memo'` 也会恢复正常。由此可以确认，问题位于 Compiler 优化与 MobX 响应式模型的交界处。

## MobX observer 实际在做什么

MobX 的规则可以概括为：**记录 tracked function 执行期间真正读取过的 observable 属性。**`observer` 包装的 React 组件就是一种 tracked function。

其内部行为可以粗略理解为：

```tsx
reaction.track(() => {
  result = Component(props);
});
```

当组件执行 `COUNTER_STORE.count` 时，MobX 不只是返回当前值，还会向当前 Reaction 报告“这个属性被读取了”。之后 `count` 变化，Reaction 通知 React 重新渲染组件。

因此，下面这次普通的属性访问带有两层含义：

```ts
const count = COUNTER_STORE.count;
```

1. 返回当前的数值；
2. 在当前 MobX tracking context 中登记依赖。

这套动态追踪机制让使用者不需要手写依赖数组，但它也意味着一次看似普通的 getter 读取具有 Compiler 无法从语法中看见的响应式语义。MobX 官方文档对这一机制有更完整的说明：[Understanding reactivity](https://mobx.js.org/understanding-reactivity.html)。

## 真正被缓存的是 JSX

最初看到页面不更新，很容易推测：Compiler 把 `COUNTER_STORE.count` 本身缓存了，第二次渲染没有读取 observable，于是 MobX 清除了订阅。

但构建产物显示，编译结果更接近下面这样：

```tsx
function PlainComponent() {
  const cache = useMemoCache(1);
  const count = COUNTER_STORE.count;

  let result;
  if (cache[0] === MEMO_CACHE_SENTINEL) {
    result = <div>plain observer: {count}</div>;
    cache[0] = result;
  } else {
    result = cache[0];
  }

  return result;
}
```

`COUNTER_STORE.count` 依然在每次渲染中执行。MobX 能继续追踪它，也会在每次变化后继续通知组件。问题发生在后面：Compiler 没有把这个 observable 值视为缓存 JSX 的有效依赖，因此每次都返回首次渲染时创建的 React Element。

完整过程如下：

| 时刻       | MobX 读取   | MobX 是否通知渲染 | 组件返回的 JSX                 |
| ---------- | ----------- | ----------------- | ------------------------------ |
| 初次渲染   | `count = 0` | 建立订阅          | 新建并缓存 `plain observer: 0` |
| 第一次更新 | `count = 1` | 是                | 返回缓存的 `plain observer: 0` |
| 第二次更新 | `count = 2` | 是                | 返回缓存的 `plain observer: 0` |
| 第三次更新 | `count = 3` | 是                | 返回缓存的 `plain observer: 0` |

这也解释了一个很有迷惑性的现象：在渲染函数中加入 `console.log(count)`，控制台可能持续输出 `0、1、2、3`，但界面仍然是 `0`。组件确实执行了，MobX 也确实工作了，只是 React 收到的始终是第一次创建的 JSX。

## 根本冲突：内部可变性

React Compiler 需要判断哪些计算可以安全复用。对于模块级 Store：

```ts
COUNTER_STORE === COUNTER_STORE; // 始终为 true
```

但 MobX 允许对象身份不变、内部属性不断变化：

```ts
COUNTER_STORE.count; // 0 -> 1 -> 2 -> 3
```

React 官方把这种模式称为 **interior mutability**：容器引用没有改变，内部状态却改变了。若优化器只根据外部身份推导稳定性，就无法知道 `COUNTER_STORE.count` 已经成为 JSX 的动态输入。

两套模型的差异可以这样概括：

| React Compiler 的优化模型                  | MobX 的响应式模型                      |
| ------------------------------------------ | -------------------------------------- |
| 相同引用通常代表稳定输入                   | 相同 Store 引用中的属性可以变化        |
| 属性访问通常可以当作普通取值               | observable getter 还会登记动态依赖     |
| JSX 根据静态分析出的依赖缓存               | JSX 依赖运行时收集到的 observable      |
| 变化最好通过 props、state 或 snapshot 表达 | 变化隐藏在 Proxy/getter 和 Reaction 中 |

这不是说 MobX 的设计本身错误。MobX 在 React Compiler 的 memoization 规则完整出现之前就形成了这套 API，它用内部可变性换来了非常自然、细粒度的响应式体验。问题是 Compiler 无法仅凭普通的属性访问识别这些额外语义。

React 官方目前已经在 [`incompatible-library`](https://react.dev/reference/eslint-plugin-react-hooks/lints/incompatible-library) 文档中明确提到 MobX：`observer` 会破坏 memoization 假设，而 linter 暂时还不能检测这一模式。

## `React.memo` 为什么不是同一个问题

`observer` 本身也会使用类似 `React.memo` 的组件级优化，但它与本次 JSX 缓存不是一回事。

`React.memo` 主要避免由父组件相同 props 引起的普通重新渲染。MobX 自己的外部 Store 通知仍能像组件内部 state 一样触发更新。React Compiler 则会深入组件函数内部，缓存表达式、对象、函数和 JSX 节点。

所以本次问题不是简单的“`React.memo` 与 MobX 不能一起使用”，而是：

> Compiler 对组件内部 JSX 的静态 memoization，没有识别出对象身份之外的 MobX observable 依赖。

## 当前可用的解决方案

### 1. 在 observer 组件中使用 `use no memo`

这是目前最直接、最可靠的方案：

```tsx
function PlainComponent() {
  "use no memo";

  const count = COUNTER_STORE.count;
  return <div>plain observer: {count}</div>;
}

const Plain = observer(PlainComponent);
```

Compiler 跳过该组件后，每次 MobX 更新都会重新创建包含最新值的 JSX。React 官方也把 [`use no memo`](https://react.dev/reference/react-compiler/directives/use-no-memo) 定位为处理这类兼容问题的逃生舱。

### 2. 以 annotation 模式渐进启用 Compiler

如果项目中存在大量 MobX 组件，可以把 Compiler 改为：

```ts
{
  compilationMode: "annotation";
}
```

然后只给确认安全的组件添加：

```tsx
function SafeComponent() {
  "use memo";
  // ...
}
```

这种方式牺牲了默认覆盖率，但比遗漏某个 `observer` 并在生产环境得到静默错误更安全。

### 3. 使用显式外部 Store snapshot

从 React 的架构方向看，更理想的外部 Store 接口是 `useSyncExternalStore`：订阅变化，并通过 snapshot 把当前状态显式交给 React。

这可能成为 MobX 长期兼容 React Compiler 的基础，但不建议每个业务组件自行用 `reaction + useState` 重写 `observer`。手写订阅会增加清理、并发渲染一致性和重复封装的维护成本，更适合由 MobX React 绑定统一解决。

### 不要依赖偶然的 bailout

复现中还有两个有趣的对照：

- 将函数内联传给 `observer(function Component() {})`，当前 `infer` 模式可能不会编译它；
- 在渲染期间写入 `window`，Compiler 会因副作用而放弃优化。

它们都能让界面恢复，但只是依赖当前启发式或制造副作用，不是稳定的生产方案。

## 这应该由谁负责

这个问题包含三个不同层次：

1. **React Compiler / ESLint**：既然 MobX 已被明确列为不兼容模式，就应该识别 `observer`，自动跳过编译或给出 `incompatible-library` 诊断，避免静默生成错误 UI。
2. **MobX React 绑定**：长期可以提供 Compiler 兼容的订阅与 snapshot API，或者通过自己的 Babel/SWC 插件自动标记不应编译的组件。
3. **应用开发者**：在生态完成兼容之前，使用 `'use no memo'` 或 annotation 模式建立明确边界。

因此，这个复现更适合首先作为 React Compiler core 问题提交。诉求不应是“Compiler 必须理解所有 MobX 内部机制”，而应该是：

> 当 Compiler 遇到已经被官方文档列为不兼容的 `observer` 模式时，应跳过组件或给出可操作的诊断，而不是静默缓存陈旧 JSX。

## 总结

这次问题最容易误判的地方，是“页面没有变化”并不等于“组件没有重新渲染”。只有检查编译产物，才能看到实际链路：MobX 持续读取最新 observable、持续触发组件，而 Compiler 持续返回第一次缓存的 JSX。

它也说明了编译期优化面对响应式库时的根本难点：一个普通的属性读取，可能承载静态分析看不见的订阅、依赖收集和内部可变状态。自动 memoization 要安全工作，不仅需要组件满足 React 的规则，也需要第三方状态库通过 Compiler 能理解的方式暴露变化。

在这条兼容路径成熟之前，`'use no memo'` 不是失败，而是一条必要且清晰的边界声明。

完整代码与控制实验见：[react-compiler-mobx-repro](https://github.com/BranZhang/react-compiler-mobx-repro)。
