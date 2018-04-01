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
var Block = function Block (ref) {
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
    .map(function (x) { return x.trim(); })
};

Block.fromString = function fromString (block) {
  if (!((block.charAt(0) == '{') && (block.charAt(block.length - 1) == '}'))) {
    throw new Error(("Block should start with '{' and end with '}': " + block))
  }
  var body = block.slice(1, -1);

  // Apply simple rules and regular expressions first (easier and handle multiple cases)
  // Then attempt to parse candidates into blocks.
  var OPTION_INTERVAL = new RegExp('[=~](%\\d{2}%)?' + INTERVAL.source + '\\s*(#[^=~]*)?');
  var BLOCK_NUMBER = new RegExp(("^((" + (INTERVAL.source) + ")|((\\s*" + (OPTION_INTERVAL.source) + ")+))$"));

  if (/^[\s]*$/.test(body)) {
    return new Block({
      type: Block.TYPES.TEXT,
      options: []
    })
  } else if (/^(TRUE|FALSE|T|F)$/.test(body)) {
    return new Block({
      type: Block.TYPES.BOOLEAN,
      options: [
        new BlockOption({ value: /^(TRUE|T)$/.test(body) })
      ]
    })
  } else if (body.charAt(0) == '#') {
    // body has at least one character, otherwise it would be matched in TEXT block.
    if (BLOCK_NUMBER.test(body.slice(1))) {
      return new Block({
        type: Block.TYPES.NUMBER,
        options: [ BlockOption.fromString(body.slice(1)) ]
      })
    } else {
      throw new Error(("Invalid number block: " + block))
    }
  } else {
    var options = this.splitOptions(body).map(function (o) { return BlockOption.fromString(o); });

    if (options.every(function (o) { return o.prefix == '~'; })) {
      return new Block({
        type: Block.TYPES.CHECKBOX,
        options: options
      })
    } else if (options.every(function (o) { return o.prefix == '='; })) {
      if (options.every(function (o) { return o.value.includes('->'); })) {
        return new Block({
          type: Block.TYPES.MATCHING,
          options: options
        })
      }
      return new Block({
        type: Block.TYPES.INPUT,
        options: options
      })
    } else if (options.every(function (o) { return o.prefix == '~' || o.prefix == '='; })) {
      // candidate for radio button
      // TODO: add tests for incorrect radio options a.k.a multiple ~ =
      // TODO: add tests for options not starting with = or ~.
      return new Block({
        type: Block.TYPES.RADIO,
        options: options
      })
    }
  }
};

Block.fromMaskedString = function fromMaskedString (block) {
  if (!((block.charAt(0) == '{') && (block.charAt(block.length - 1) == '}'))) {
    throw new Error(("Block should start with '{' and end with '}': " + block))
  }
  var body = block.slice(1, -1);
  if (body === '') {
    return new Block({ type: Block.TYPES.TEXT })
  } else if (body === '~') {
    return new Block({ type: Block.TYPES.BOOLEAN })
  } else if (body === '#') {
    return new Block({ type: Block.TYPES.NUMBER })
  } else if (body === '=') {
    return new Block({ type: Block.TYPES.INPUT })
  } else {
    var options = this.splitOptions(body).map(function (o) { return BlockOption.fromString(o); });
    if (options.every(function (o) { return o.prefix == '~'; })) {
      return new Block({ type: Block.TYPES.CHECKBOX, options: options })
    } else if (options.every(function (o) { return o.prefix == '='; })) {
      return new Block({ type: Block.TYPES.RADIO, options: options })
    } else {
      throw Error("Could not parse masked block options")
    }
  }
};

Block.getType = function getType (block) {
  var obj = this.fromString(block);
  if (obj) {
    return obj.type
  }
};

// Is valid = type could be detected.
Block.isValid = function isValid (block) {
  if (!((block.charAt(0) == '{') && (block.charAt(block.length - 1) == '}'))) {
    return false
  }
  return true
};

Block.prototype.toString = function toString () {
};

Block.prototype.toMaskedString = function toMaskedString () {
  switch(this.type) {
    case Block.TYPES.TEXT:
      return '{}'
    case Block.TYPES.BOOLEAN:
      return '{~}'
    case Block.TYPES.NUMBER:
      return '{#}'
    case Block.TYPES.INPUT:
      return '{=}'
    case Block.TYPES.RADIO:
      return ("{" + (this.options.map(function (o) { return ("=" + (o.value)); }).join(' ')) + "}")
    case Block.TYPES.CHECKBOX:
      return ("{" + (this.options.map(function (o) { return ("~" + (o.value)); }).join(' ')) + "}")
    default:
     throw Error(("Could not mask block. Unsupported type " + (this.type)))
  }
};

Block.prototype.grade = function grade (answer) {};

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

Question.splitBlocks = function splitBlocks (question) {
  // Apply simple regexps first and then if candidate is not qualified - merge
  // it with text on the left and right.
  // NOTES: (Negative) lookbehind is not supported by JavaScript yet. It is a
  // part of ES2018 proposal.
  // More info about lookbehind: http://2ality.com/2017/05/regexp-lookbehind-assertions.html
  // There is a possible way to replace lookabehind wiht lookahead on the
  // reversed string: https://stackoverflow.com/questions/641407/javascript-negative-lookbehind-equivalent#answer-11347100
  // return question.split(/(?<!\\)({[^}]*(?<!\\)})/g).filter(x => x)
  return question
    .split(/({[^}]*})/g)
    .filter(function (x) { return x; })
};

export { Block, Question };
