# GIFT format parser

[![CircleCI](https://circleci.com/gh/pavlov99/gift/tree/master.svg?style=svg&circle-token=be34ec20970ec37168473206d036856c90701251)](https://circleci.com/gh/pavlov99/gift/tree/master)
[![npm version](https://badge.fury.io/js/giftparser.svg)](https://www.npmjs.com/package/giftparser)

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

## Deployment

1. Ensure tests are passed and linter does not have errors.
2. Build the package: `yarn build`. It creates files in `dist/`.
3. Update the version in package.json.
4. Commit changes with 'REL:' prefix and tag the commit with 'v<pkg.version>' tag, e.g. `v1.0.0`.
5. Publish the package `npm publish`.
