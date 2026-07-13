---
title: "Why React Compiler Can Render Stale Data in MobX observer Components"
description: "A minimal reproduction of React Compiler caching stale JSX around MobX observer, why interior mutability conflicts with memoization, and the practical fixes available today."
pubDatetime: 2026-07-13T00:00:00.000Z
draft: false
hiddenLocales: ["zh-cn"]
tags: ["React", "React Compiler", "MobX", "JavaScript"]
---

While enabling React Compiler in a React 19 application using MobX, I encountered a quiet but dangerous failure: the MobX store changed normally and no error was reported, yet the UI remained stuck at its initial value.

I reduced the problem to a [minimal reproduction](https://github.com/BranZhang/react-compiler-mobx-repro). The most important discovery came after inspecting the compiled output. My first theory was that the compiler cached the observable read and caused MobX to lose its subscription. That was incorrect. **MobX continues to trigger renders and the observable is still read; React Compiler returns JSX cached from the initial render.**

This article explains how that happens, why the memoization model conflicts with MobX `observer`, and what applications can do until the ecosystem provides a complete integration.

## Minimal Reproduction

The store is a small MobX counter:

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

The component is declared as a top-level function and then wrapped with `observer`:

```tsx
function PlainComponent() {
  const count = COUNTER_STORE.count;
  return <div>plain observer: {count}</div>;
}

const Plain = observer(PlainComponent);
```

React Compiler runs in `infer` mode:

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

After calling `increment()` three times, the store contains `3`, but the page still shows:

```text
plain observer: 0
```

Disabling React Compiler fixes the behavior. Adding `'use no memo'` to the component fixes it as well, locating the failure at the boundary between Compiler optimization and MobX reactivity.

## What MobX observer Does

MobX tracks observable properties that are actually read while a tracked function runs. An `observer` component is one such tracked function. Its behavior can be approximated as:

```tsx
reaction.track(() => {
  result = Component(props);
});
```

Reading `COUNTER_STORE.count` both returns its current value and reports the access to the active MobX Reaction. When `count` changes later, that Reaction asks React to render the component again.

The apparently ordinary access below therefore has hidden reactive semantics:

```ts
const count = COUNTER_STORE.count;
```

1. Return the current number.
2. Register a dependency in the current MobX tracking context.

This dynamic tracking avoids explicit dependency lists, but a compiler cannot infer these additional semantics from normal property-access syntax. See MobX's [Understanding reactivity](https://mobx.js.org/understanding-reactivity.html) documentation for the complete model.

## The JSX Is Stale, Not the Subscription

It is tempting to assume that the compiler caches `COUNTER_STORE.count`, skips the observable read on the next render, and causes MobX to clear the subscription. The generated output tells a different story. Simplified, it looks like this:

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

`COUNTER_STORE.count` still executes on every render, so MobX continues to track it and notify the component. The problem comes afterward: Compiler does not treat the observable value as a dependency of the JSX cache, so every render returns the React Element created with the initial value.

| Moment         | MobX reads  | Does MobX trigger a render? | JSX returned                         |
| -------------- | ----------- | --------------------------- | ------------------------------------ |
| Initial render | `count = 0` | Subscription established    | Create and cache `plain observer: 0` |
| First update   | `count = 1` | Yes                         | Cached `plain observer: 0`           |
| Second update  | `count = 2` | Yes                         | Cached `plain observer: 0`           |
| Third update   | `count = 3` | Yes                         | Cached `plain observer: 0`           |

This also explains a confusing control case: `console.log(count)` may print `0, 1, 2, 3` while the page remains at `0`. The component executes and MobX works, but React receives the same initial JSX.

## The Fundamental Conflict: Interior Mutability

React Compiler needs to determine which calculations are safe to reuse. The module-level store keeps the same identity:

```ts
COUNTER_STORE === COUNTER_STORE; // always true
```

MobX, however, allows properties inside that stable object to change:

```ts
COUNTER_STORE.count; // 0 -> 1 -> 2 -> 3
```

React calls this pattern **interior mutability**: a container preserves its identity while hidden state changes inside it. An optimizer reasoning from external identity cannot know that `COUNTER_STORE.count` is a dynamic JSX input.

| React Compiler's model                                         | MobX's model                                            |
| -------------------------------------------------------------- | ------------------------------------------------------- |
| Stable references generally mean stable inputs                 | Properties inside a stable Store can change             |
| Property access usually behaves like an ordinary read          | An observable getter also registers a dependency        |
| JSX is cached from statically analyzed dependencies            | JSX depends on observables collected at runtime         |
| Changes should be expressed through props, state, or snapshots | Changes are hidden behind proxies/getters and Reactions |

MobX is not simply “wrong” here. Its API predates the fully documented React Compiler memoization rules and trades interior mutability for ergonomic, fine-grained reactivity. The issue is that ordinary property access does not expose those semantics to Compiler.

React's [`incompatible-library`](https://react.dev/reference/eslint-plugin-react-hooks/lints/incompatible-library) documentation now names MobX explicitly: `observer` can break memoization assumptions, and the linter does not yet detect the pattern.

## Why This Is Not Just React.memo

`observer` applies a component-level optimization similar to `React.memo`, but that is different from the cache involved here.

`React.memo` primarily avoids ordinary parent-driven renders when props are unchanged. A MobX external-store notification can still update the component, much like local state can update a memoized component. React Compiler goes further by caching expressions, objects, functions, and JSX inside the component body.

The failure is therefore not simply “React.memo cannot be used with MobX.” More precisely:

> Compiler's static JSX memoization does not recognize a MobX observable dependency hidden behind a stable object identity.

## Practical Solutions

### Use `use no memo` in observer Components

The most direct and reliable workaround is:

```tsx
function PlainComponent() {
  "use no memo";

  const count = COUNTER_STORE.count;
  return <div>plain observer: {count}</div>;
}

const Plain = observer(PlainComponent);
```

Once Compiler skips the function, each MobX update produces fresh JSX containing the latest value. React documents [`use no memo`](https://react.dev/reference/react-compiler/directives/use-no-memo) as an escape hatch for compatibility problems like this.

### Adopt Compiler Incrementally

For an application with many MobX components, consider annotation mode:

```ts
{
  compilationMode: "annotation";
}
```

Then opt in only components that have been verified as safe:

```tsx
function SafeComponent() {
  "use memo";
  // ...
}
```

This reduces optimization coverage, but it is safer than missing one `observer` component and shipping silently stale UI.

### Use an Explicit External-Store Snapshot

React's preferred architecture for external stores is `useSyncExternalStore`: subscribe to changes and expose current state as a snapshot React can understand.

This may form the basis of long-term MobX Compiler compatibility. Individual applications should not necessarily replace every `observer` with handwritten `reaction + useState`, however. Manual subscriptions add cleanup, concurrent-rendering consistency, and maintenance concerns that are better solved once in the MobX React binding.

### Do Not Depend on Accidental Bailouts

The reproduction includes two useful controls:

- Passing an inline function to `observer(function Component() {})` may currently avoid compilation in `infer` mode.
- Writing to `window` during render makes Compiler bail out because of the side effect.

Both restore the display, but they depend on current heuristics or introduce invalid render-time behavior. Neither is a production solution.

## Who Should Fix It?

The responsibility has three layers:

1. **React Compiler and ESLint** should recognize `observer`, skip compilation, or emit an `incompatible-library` diagnostic. A documented incompatibility should not silently produce stale UI.
2. **MobX React bindings** can eventually provide a Compiler-compatible subscription/snapshot API or automatically mark incompatible components through their Babel/SWC tooling.
3. **Application developers** need to establish an explicit boundary with `'use no memo'` or annotation mode until that integration exists.

The reproduction therefore makes sense first as a React Compiler core report. The request is not that Compiler understand every MobX implementation detail. It is narrower:

> When Compiler encounters an `observer` pattern already documented as incompatible, it should skip that component or provide an actionable diagnostic instead of silently caching stale JSX.

## Conclusion

The most misleading part of this bug is that an unchanged UI does not mean the component did not render. Only the generated code revealed the real sequence: MobX keeps reading the latest observable and scheduling renders, while Compiler keeps returning JSX cached during the first render.

This illustrates the central difficulty of compile-time optimization around reactive libraries. An ordinary-looking property read may carry subscriptions, runtime dependency collection, and interior mutable state that static analysis cannot see. Safe automatic memoization requires both React components and third-party state libraries to express changes in a model Compiler can understand.

Until that integration matures, `'use no memo'` is not a failure. It is a necessary and explicit compatibility boundary.

The full source and control experiments are available in [react-compiler-mobx-repro](https://github.com/BranZhang/react-compiler-mobx-repro).
