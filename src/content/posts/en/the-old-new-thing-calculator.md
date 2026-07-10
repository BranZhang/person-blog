---
title: "What Calculator Percent Keys Teach Us"
description: "Why pocket calculators interpret percentages unexpectedly, and how to model that behavior with the shunting-yard algorithm and RPN."
pubDatetime: 2019-09-08T12:35:51.000Z
modDatetime: 2023-01-03T09:53:31.000Z
draft: false
hiddenLocales: ["zh-cn"]
tags:
  [
    "Bugs",
    "Calculators",
    "Shunting-yard Algorithm",
    "Reverse Polish Notation",
    "Algorithms",
  ]
---

## Introduction

The title was inspired by Raymond Chen's writing on Windows programming. I found his article [How does the calculator percent key work?](https://devblogs.microsoft.com/oldnewthing/?p=23853) after people online reported a supposed bug in the built-in Android and iOS calculators: entering `10% + 10%` produces `0.11` rather than `0.2`. Chen's 2008 article explains why.

> What you first have to understand is that the percent key on those pocket calculators was not designed for mathematicians and engineers. It was designed for your everyday person doing some simple calculations. Therefore, the behavior of the key to you, an engineer, seems bizarrely counter-intuitive and even buggy. But to an everyday person, it makes perfect sense. Or at least that’s the theory.
>
> — How does the calculator percent key work?

Another intuitive analogy is a game character with 10% health receiving a spell that increases the _remaining_ health by 10%. The result is 11%. The spell may be silly, but it matches the calculator's behavior.

## Parsing an Expression

To evaluate a conventional expression such as `1 + 2 × (3 + 4)`, first use the [shunting-yard algorithm](https://en.wikipedia.org/wiki/Shunting_yard_algorithm) to convert the infix expression to [Reverse Polish notation](https://en.wikipedia.org/wiki/Reverse_Polish_notation), then evaluate the resulting postfix expression.

The same machinery supports custom expression grammars, not only conventional arithmetic and parentheses. If a language needs addition and subtraction to bind more tightly than multiplication and division, its precedence table can simply define that behavior.

### Shunting-yard Algorithm

To simplify the problem, consider only numbers, addition, subtraction, and percentages. The relevant portion of the algorithm is:

- While tokens remain:
  - Read one token.
  - If it is a number, append it to the output queue.
  - If it is a function, push it onto the operator stack.
  - If it is an operator $o_1$, then while the top of the stack contains an operator $o_2$ and either:
    - $o_1$ is left-associative with precedence less than or equal to $o_2$, or
    - $o_1$ is right-associative with precedence lower than $o_2$,
  - pop $o_2$ into the output queue, repeating until the condition no longer holds.
  - Push $o_1$ onto the stack.
- When no tokens remain, pop all remaining operators into the output queue.
- The output queue is the postfix expression.

### Evaluating Reverse Polish Notation

- While input tokens remain, read token $X$.
  - If $X$ is an operand, push it onto the stack.
  - If $X$ is an operator, look up its arity $n$.
    - If fewer than $n$ operands are available, report an insufficient-operands error.
    - Otherwise pop $n$ operands, apply the operator, and push the result.
- If exactly one value remains, it is the result.
- If more than one value remains, report an extra-operands error.

## Interpreting `%`

### Mathematical Interpretation: `10% + 10% = 0.2`

Treat `%` as a unary postfix operator with precedence higher than ordinary arithmetic. For operand $n$, define $n\%=n \div 100$.

### Pocket-calculator Interpretation: `10% + 10% = 0.11`

Suppose I buy one toy for 100 yuan and another for 200 yuan, then apply a “50% off” promotion. Entering `100 + 200 - 50%` should produce 150, and phone calculators do return that result. How can this behavior be implemented?

Allow `%` to behave as either a unary or context-dependent binary operation. When at least two operands are available, use the calculator-style interpretation; with only one operand, convert it directly to a fraction. Give `%` the same precedence as addition and subtraction.

For $m + n\%$, define the percentage amount as $n \div 100 * m$. Because `%` shares precedence with addition and subtraction, `100 + 200 - 50%` first evaluates `100 + 200`, then calculates 50% of that intermediate base before subtracting it.

The original article also discusses multiplication and division. They are omitted here because a result such as 12,500 for `500 × 5%` violates conventional arithmetic and has no obvious everyday interpretation.
