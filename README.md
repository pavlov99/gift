# GIFT format parser

[![CircleCI](https://circleci.com/gh/pavlov99/gift/tree/master.svg?style=svg&circle-token=be34ec20970ec37168473206d036856c90701251)](https://circleci.com/gh/pavlov99/gift/tree/master)

A parser of assessment items written in [GIFT format](https://en.wikipedia.org/wiki/GIFT_(file_format)), implements [Moodle 3.4 spec](https://docs.moodle.org/34/en/GIFT_format).

* Vanilla isomorphic JavaScript, no dependencies.
* Available in ES6, CommonJS and minified UMD formats.

## Quickstart

```javascript
var blockStrings = gift.Question.splitBlocks('2 * 3 equals {~5 =6 ~8 ~23}')
var block = gift.Block.fromString('{~5 =6 ~8 ~23}')
```

## Development

Built with love and [rollup](https://github.com/rollup/rollup)/[bublé](https://github.com/Rich-Harris/buble).
