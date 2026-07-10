---
title: "Word Segmentation Algorithms and a Simple Implementation, Part 2"
description: "A closer look at the algorithms behind Jieba and other Chinese word-segmentation systems."
pubDatetime: 2018-05-08T16:10:00.000Z
modDatetime: 2023-01-03T09:57:03.000Z
draft: false
hiddenLocales: ["zh-cn"]
tags: ["NLP", "Jieba", "Natural Language Processing", "Word Segmentation"]
---

This article introduces the word-segmentation algorithms mentioned in [Word Segmentation Algorithms and a Simple Implementation, Part 1](https://littlepotato.me/archives/293), including but not limited to those used by Jieba.

The Jieba source code referenced below is from version 0.39.

## Prefix Dictionary

Jieba builds its prefix dictionary with the following code:

```python
def gen_pfdict(self, f):
    lfreq = {}
    ltotal = 0
    f_name = f.name
    for lineno, line in enumerate(f, 1):
        try:
            line = line.strip().decode('utf-8')
            word, freq = line.split(' ')[:2]
            freq = int(freq)
            lfreq[word] = freq
            ltotal += freq
            for ch in range(len(word)):
                wfrag = word[:ch + 1]
                if wfrag not in lfreq:
                    lfreq[wfrag] = 0
        except ValueError:
            raise ValueError(
                'invalid dictionary entry in %s at Line %s: %s' % (f_name, lineno, line))
    f.close()
    return lfreq, ltotal
```

The implementation looks almost too straightforward. Some tests suggest that it is slightly faster in Python than a trie, although that still needs verification. The result is likely affected by language characteristics, dictionary size, word length, and the number of distinct characters.

### Trie

Jieba's original trie-construction algorithm, shown below, was replaced by the prefix-dictionary approach above.

```python
def gen_trie(f_name):
    lfreq = {}
    trie = {}
    ltotal = 0.0
    with open(f_name, 'rb') as f:
        lineno = 0
        for line in f.read().rstrip().decode('utf-8').split('\n'):
            lineno += 1
            try:
                word,freq,_ = line.split(' ')
                freq = float(freq)
                lfreq[word] = freq
                ltotal += freq
                p = trie
                for c in word:
                    if c not in p:
                        p[c] ={}
                    p = p[c]
                p['']='' #ending flag
            except ValueError as e:
                logger.debug('%s at line %s %s' % (f_name,  lineno, line))
                raise e
    return trie, lfreq, ltotal
```

Tries remain useful in many applications, especially search. Here are several related exercises:

- [Prefix and Suffix Search](https://leetcode.com/problems/prefix-and-suffix-search/)
- [Implement Trie (Prefix Tree)](https://leetcode.com/problems/implement-trie-prefix-tree/)
- [Implement Magic Dictionary](https://leetcode.com/problems/implement-magic-dictionary/)

## Directed Acyclic Graph

The following algorithm constructs a directed acyclic graph (DAG), where `FREQ` is the prefix dictionary described above.

```python
def get_DAG(self, sentence):
    self.check_initialized()
    DAG = {}
    N = len(sentence)
    for k in range(N):
        tmplist = []
        i = k
        frag = sentence[k]
        while i < N and frag in self.FREQ:
            # If the frequency is greater than zero, append position i to the list keyed by k.
            if self.FREQ[frag]:
                tmplist.append(i)
            # A zero frequency means the prefix exists but is not itself a word; keep scanning.
            i += 1
            frag = sentence[k:i + 1]
        if not tmplist:
            tmplist.append(k)
        DAG[k] = tmplist
    return DAG
```

## Finding the Maximum-Probability Path

```python
def calc(self, sentence, DAG, route):
    N = len(sentence)
    route[N] = (0, 0)
    logtotal = log(self.total)
    for idx in range(N - 1, -1, -1):
        route[idx] = max((log(self.FREQ.get(sentence[idx:x + 1]) or 1) -
                          logtotal + route[x + 1][0], x) for x in DAG[idx])

def __cut_DAG_NO_HMM(self, sentence):
    re_eng = re.compile('[a-zA-Z0-9]', re.U)

    DAG = self.get_DAG(sentence)
    route = {}
    self.calc(sentence, DAG, route)
    x = 0
    N = len(sentence)
    buf = ''
    while x < N:
        y = route[x][1] + 1
        l_word = sentence[x:y]
        if re_eng.match(l_word) and len(l_word) == 1:
            buf += l_word
            x = y
        else:
            if buf:
                yield buf
                buf = ''
            yield l_word
            x = y
    if buf:
        yield buf
        buf = ''
```

Consider an interactive input field where the complete query must be segmented after every keystroke. Calling the segmentation API from scratch would repeat the entire computation for each new character. With an understanding of the maximum-probability-path algorithm, however, the result can be updated incrementally. This reduces computation at the cost of some additional memory, so whether it is worthwhile depends on the application.

As the algorithm shows, each newly typed character adds one node to the DAG. The dictionary determines which directed edges leave that node, after which dynamic programming updates the maximum-probability path.

## HMM

Hidden Markov models are discussed in more detail in the separate article “Notes on HMMs.”

## References

- [A Java Implementation of a Double-Array Trie (Chinese)](http://www.hankcs.com/program/java/%E5%8F%8C%E6%95%B0%E7%BB%84trie%E6%A0%91doublearraytriejava%E5%AE%9E%E7%8E%B0.html)
- [Fast Multi-pattern Matching with Aho–Corasick and a Double-Array Trie (Chinese)](https://www.hankcs.com/program/algorithm/aho-corasick-double-array-trie.html)
- [AhoCorasickDoubleArrayTrie](https://github.com/hankcs/AhoCorasickDoubleArrayTrie)
