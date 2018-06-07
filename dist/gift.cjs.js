'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var NUMBER = /([+-]?\d+(\.\d+)?)([eE][+-]?\d+)?/;
var INTERVAL = new RegExp(NUMBER.source + '((:' + NUMBER.source + ')|(\\.\\.' + NUMBER.source + '))?');

var CreditOutOfRangeError = (function (Error) {
  function CreditOutOfRangeError () {
    Error.apply(this, arguments);
  }if ( Error ) CreditOutOfRangeError.__proto__ = Error;
  CreditOutOfRangeError.prototype = Object.create( Error && Error.prototype );
  CreditOutOfRangeError.prototype.constructor = CreditOutOfRangeError;

  

  return CreditOutOfRangeError;
}(Error));

/** Single option of the block. */
var BlockOption = function BlockOption(ref) {
  var prefix = ref.prefix;
  var credit = ref.credit;
  var value = ref.value;
  var feedback = ref.feedback;

  if (value === undefined) {
    throw new Error(("Invalid value '" + value + "', should not be empty"));
  }
  this.value = value;

  if (!(prefix === undefined || prefix === '=' || prefix === '~')) {
    throw new Error(("Invalid prefix value: " + prefix + ". Use [undefined, '~', '=']"));
  }
  this.prefix = prefix;

  if (credit !== undefined) {
    this.credit = parseFloat(credit);
    if (!this.credit) {
      throw new Error(("Invalid credit value '" + credit + "'. Should be a number."));
    }
    if (this.credit > 1 || this.credit < -1) {
      throw new CreditOutOfRangeError(("Invalid credit value '" + (this.credit) + "'. Should be in [-1, 1]."));
    }
  } else {
    this.credit = undefined;
  }

  this.feedback = feedback;
};

BlockOption.prototype.toString = function toString () {
  var prefix = this.prefix ? this.prefix : '';
  var credit = this.credit ? ("%" + (this.credit * 100) + "%") : '';
  var feedback = this.feedback ? ("#" + (this.feedback)) : '';
  return ("" + prefix + credit + (this.value) + feedback);
};

BlockOption.fromString = function fromString (option) {
  var re = /^([=~])?(%-?\d{1,3}%)?([^=~#]*)(#[^=~]*)?$/;
  var groups = option.match(re);
  if (groups) {
    var credit = groups[2] ?
      parseFloat(groups[2].slice(1, -1)) / 100 : undefined;
    var feedback = groups[4] ? groups[4].slice(1) : undefined;
    try {
      return new BlockOption({
        prefix: groups[1],
        credit: credit,
        value: groups[3],
        feedback: feedback,
      });
    } catch (e) {
      if (e instanceof CreditOutOfRangeError) {
        return new BlockOption({
          prefix: groups[1],
          value: groups[2] + groups[3],
          feedback: feedback,
        });
      }
    }
  }
  return undefined;
};

/* GITF Block */
var Block = function Block(ref) {
  var type = ref.type;
  var options = ref.options; if ( options === void 0 ) options = [];

  this.type = type;
  this.options = options;
};

Block.splitOptions = function splitOptions (block) {
  // NOTE: do not remember option value, a.k.a (?:) group
  // In every option match either special character [=,~,#,{,}] or not option
  // start
  // NOTE: .split(/((?<!\\)[=~](?:(?:\\[=~#\{\}])|(?:[^=~]))+)/y)
  // negative lookbehind is not supported! Write tests to fail it.
  return block
    .trim()
    .split(/([=~](?:(?:\\[=~#{}])|(?:[^=~]))+)/g)
    .filter(function (x) { return x; })
    .map(function (x) { return x.trim(); });
};

Block.fromString = function fromString (block) {
  if (!((block.charAt(0) === '{') && (block.charAt(block.length - 1) === '}'))) {
    throw new Error(("Block should start with '{' and end with '}': " + block));
  }
  var body = block.slice(1, -1);

  // Apply simple rules and regular expressions first (easier and handle multiple cases)
  // Then attempt to parse candidates into blocks.
  var OPTION_INTERVAL = new RegExp(("[=~](%\\d{2}%)?" + (INTERVAL.source) + "\\s*(#[^=~]*)?"));
  var BLOCK_NUMBER = new RegExp(("^((" + (INTERVAL.source) + ")|((\\s*" + (OPTION_INTERVAL.source) + ")+))$"));

  if (/^[\s]*$/.test(body)) {
    return new Block({
      type: Block.TYPES.TEXT,
      options: [],
    });
  } else if (/^(TRUE|FALSE|T|F)$/.test(body)) {
    return new Block({
      type: Block.TYPES.BOOLEAN,
      options: [
        new BlockOption({ value: /^(TRUE|T)$/.test(body) }) ],
    });
  } else if (body.charAt(0) === '#') {
    // body has at least one character, otherwise it would be matched in TEXT block.
    if (BLOCK_NUMBER.test(body.slice(1))) {
      return new Block({
        type: Block.TYPES.NUMBER,
        options: [BlockOption.fromString(body.slice(1))],
      });
    }
    throw new Error(("Invalid number block: " + block));
  } else {
    var options = Block.splitOptions(body).map(function (o) { return BlockOption.fromString(o); });

    if (options.every(function (o) { return o.prefix === '~'; })) {
      return new Block({
        type: Block.TYPES.CHECKBOX,
        options: options,
      });
    } else if (options.every(function (o) { return o.prefix === '='; })) {
      if (options.every(function (o) { return o.value.includes('->'); })) {
        return new Block({
          type: Block.TYPES.MATCHING,
          options: options,
        });
      }
      return new Block({
        type: Block.TYPES.INPUT,
        options: options,
      });
    } else if (options.every(function (o) { return o.prefix === '~' || o.prefix === '='; })) {
      // candidate for radio button
      // TODO: add tests for incorrect radio options a.k.a multiple ~ =
      // TODO: add tests for options not starting with = or ~.
      return new Block({
        type: Block.TYPES.RADIO,
        options: options,
      });
    }
  }
};

Block.fromMaskedString = function fromMaskedString (block) {
  if (!((block.charAt(0) === '{') && (block.charAt(block.length - 1) === '}'))) {
    throw new Error(("Block should start with '{' and end with '}': " + block));
  }
  var body = block.slice(1, -1);
  if (body === '') {
    return new Block({ type: Block.TYPES.TEXT });
  } else if (body === '~') {
    return new Block({ type: Block.TYPES.BOOLEAN });
  } else if (body === '#') {
    return new Block({ type: Block.TYPES.NUMBER });
  } else if (body === '=') {
    return new Block({ type: Block.TYPES.INPUT });
  }
  var options = Block.splitOptions(body).map(function (o) { return BlockOption.fromString(o); });
  if (options.every(function (o) { return o.prefix === '~'; })) {
    return new Block({ type: Block.TYPES.CHECKBOX, options: options });
  } else if (options.every(function (o) { return o.prefix === '='; })) {
    return new Block({ type: Block.TYPES.RADIO, options: options });
  }
  throw Error('Could not parse masked block options');
};

Block.getType = function getType (block) {
  var obj = Block.fromString(block);
  if (obj) {
    return obj.type;
  }
};

// Is valid = type could be detected.
Block.isValid = function isValid (block) {
  if (!((block.charAt(0) === '{') && (block.charAt(block.length - 1) === '}'))) {
    return false;
  }

  try {
    var b = Block.fromString(block);
    if (b === undefined) {
      return false;
    }
  } catch (e) {
    return false;
  }
  return true;
};

Block.isValidMasked = function isValidMasked (block) {
  try {
    var b = Block.fromMaskedString(block);
    if (b === undefined) {
      return false;
    }
  } catch (e) {
    return false;
  }
  return true;
};

Block.prototype.toString = function toString () {
  switch (this.type) {
    default:
      throw Error(("NotImplemented for type " + (this.type)));
  }
};

Block.prototype.toMaskedString = function toMaskedString () {
  switch (this.type) {
    case Block.TYPES.TEXT:
      return '{}';
    case Block.TYPES.BOOLEAN:
      return '{~}';
    case Block.TYPES.NUMBER:
      return '{#}';
    case Block.TYPES.INPUT:
      return '{=}';
    case Block.TYPES.RADIO:
      return ("{" + (this.options.map(function (o) { return ("=" + (o.value)); }).join(' ')) + "}");
    case Block.TYPES.CHECKBOX:
      return ("{" + (this.options.map(function (o) { return ("~" + (o.value)); }).join(' ')) + "}");
    default:
      throw Error(("Could not mask block. Unsupported type " + (this.type)));
  }
};

/**
 *
 * @param {(string|string[])} answer answer to the question. Array in case
 * of checkbox question.
 * @returns {number} grade, typically 0 or 1. Could be adjusted via
 * percentage %n% option modifier.
 */
Block.prototype.grade = function grade (answer) {
  switch (this.type) {
    case Block.TYPES.RADIO:
      var ref = this.options.filter(function (o) { return o.value.trim() === answer; });
    var option = ref[0];
      if (option) {
        return option.credit || (option.prefix === '=' ? 1 : 0);
      }
      return 0;
    default:
      throw Error(("Grading is not implemented for type " + (this.type)));
  }
};

/**
 *
 * @param {(string|string[]))} answer answer to the question. Array in case
 * of checkbox question.
 * @returns {string?} feedback if exists. Else undefined.
 */
Block.prototype.getFeedback = function getFeedback (answer) {
  switch (this.type) {
    case Block.TYPES.RADIO:
      var ref = this.options.filter(function (o) { return o.value.trim() === answer; });
    var option = ref[0];
      if (option) {
        return option.feedback;
      }
      return undefined;
    default:
      throw Error(("Grading is not implemented for type " + (this.type)));
  }
};

Block.TYPES = Object.freeze({
  BOOLEAN: 'BOOLEAN',
  NUMBER: 'NUMBER',
  MATCHING: 'MATCHING',
  INPUT: 'INPUT',
  RADIO: 'RADIO',
  CHECKBOX: 'CHECKBOX',
  TEXT: 'TEXT',
});

var Question = function Question () {};

Question.splitBlocksWithPredicate = function splitBlocksWithPredicate (question, predicate) {
  // Apply simple regexps first and then if candidate is not qualified - merge
  // it with text on the left and right.
  // NOTES: (Negative) lookbehind is not supported by JavaScript yet. It is a
  // part of ES2018 proposal.
  // More info about lookbehind: http://2ality.com/2017/05/regexp-lookbehind-assertions.html
  // There is a possible way to replace lookabehind wiht lookahead on the
  // reversed string: https://stackoverflow.com/questions/641407/javascript-negative-lookbehind-equivalent#answer-11347100
  // return question.split(/(?<!\\)({[^}]*(?<!\\)})/g).filter(x => x)

  var blocks = [];
  var isValid = true;

  question
    .split(/({[^}]*})/g)
    .filter(function (x) { return x; })
    .forEach(function (candidate) {
      // If previous block is valid OR this is the first block, append candidate
      if (isValid) {
        blocks.push(candidate);
        isValid = predicate(candidate);
      } else if (predicate(candidate)) {
        // Candidate is valid
        blocks.push(candidate);
        isValid = true;
      } else {
        // Previous block is not GIFT and current is also not GIFT.
        // If both are GIFT - no need to concatenate as that is valid.
        blocks.push(blocks.pop().concat(candidate));
      }
    });

  return blocks;
};

Question.splitBlocks = function splitBlocks (question) {
  return Question.splitBlocksWithPredicate(question, Block.isValid);
};

Question.splitMaskedBlocks = function splitMaskedBlocks (question) {
  return Question.splitBlocksWithPredicate(question, Block.isValidMasked);
};

Question.mask = function mask (question) {
  return Question.splitBlocks(question)
    .map(function (blockText) {
      try {
        return Block.fromString(blockText).toMaskedString();
      } catch (err) {
        // I want application to not crush, but don't care about the message
      }
      return blockText;
    })
    .join('');
};

exports.Block = Block;
exports.Question = Question;
