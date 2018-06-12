import * as regexp from './regexp';
import BlockOption from './blockOption';


/* GITF Block */
export default class Block {
  /**
   * @param {string} type
   */
  constructor({ type, options = [] }) {
    this.type = type;
    this.options = options;
  }

  static splitOptions(block) {
    // NOTE: do not remember option value, a.k.a (?:) group
    // In every option match either special character [=,~,#,{,}] or not option
    // start
    // NOTE: .split(/((?<!\\)[=~](?:(?:\\[=~#\{\}])|(?:[^=~]))+)/y)
    // negative lookbehind is not supported! Write tests to fail it.
    return block
      .trim()
      .split(/([=~](?:(?:\\[=~#{}])|(?:[^=~]))+)/g)
      .filter(x => x)
      .map(x => x.trim());
  }

  static fromString(block) {
    if (!((block.charAt(0) === '{') && (block.charAt(block.length - 1) === '}'))) {
      throw new Error(`Block should start with '{' and end with '}': ${block}`);
    }
    const body = block.slice(1, -1);

    // Apply simple rules and regular expressions first (easier and handle multiple cases)
    // Then attempt to parse candidates into blocks.
    const OPTION_INTERVAL = new RegExp(`[=~](%\\d{2}%)?${regexp.INTERVAL.source}\\s*(#[^=~]*)?`);
    const BLOCK_NUMBER = new RegExp(`^((${regexp.INTERVAL.source})|((\\s*${OPTION_INTERVAL.source})+))$`);

    if (/^[\s]*$/.test(body)) {
      return new Block({
        type: Block.TYPES.TEXT,
        options: [],
      });
    } else if (/^(TRUE|FALSE|T|F)$/.test(body)) {
      return new Block({
        type: Block.TYPES.BOOLEAN,
        options: [
          new BlockOption({ value: /^(TRUE|T)$/.test(body) }),
        ],
      });
    } else if (body.charAt(0) === '#') {
      // body has at least one character, otherwise it would be matched in TEXT block.
      if (BLOCK_NUMBER.test(body.slice(1))) {
        const options = body.slice(1)
          .split('=')
          .map(s => s.trim())
          .filter(Boolean)
          .map(o => BlockOption.fromString(`=${o}`));

        return new Block({
          type: Block.TYPES.NUMBER,
          options,
        });
      }
      throw new Error(`Invalid number block: ${block}`);
    } else {
      const options = Block.splitOptions(body).map(o => BlockOption.fromString(o));

      if (options.every(o => o.prefix === '~')) {
        return new Block({
          type: Block.TYPES.CHECKBOX,
          options,
        });
      } else if (options.every(o => o.prefix === '=')) {
        if (options.every(o => o.value.includes('->'))) {
          return new Block({
            type: Block.TYPES.MATCHING,
            options,
          });
        }
        return new Block({
          type: Block.TYPES.INPUT,
          options,
        });
      } else if (options.every(o => o.prefix === '~' || o.prefix === '=')) {
        // candidate for radio button
        // TODO: add tests for incorrect radio options a.k.a multiple ~ =
        // TODO: add tests for options not starting with = or ~.
        return new Block({
          type: Block.TYPES.RADIO,
          options,
        });
      }
    }
  }

  static fromMaskedString(block) {
    if (!((block.charAt(0) === '{') && (block.charAt(block.length - 1) === '}'))) {
      throw new Error(`Block should start with '{' and end with '}': ${block}`);
    }
    const body = block.slice(1, -1);
    if (body === '') {
      return new Block({ type: Block.TYPES.TEXT });
    } else if (body === '~') {
      return new Block({ type: Block.TYPES.BOOLEAN });
    } else if (body === '#') {
      return new Block({ type: Block.TYPES.NUMBER });
    } else if (body === '=') {
      return new Block({ type: Block.TYPES.INPUT });
    }
    const options = Block.splitOptions(body).map(o => BlockOption.fromString(o));
    if (options.every(o => o.prefix === '~')) {
      return new Block({ type: Block.TYPES.CHECKBOX, options });
    } else if (options.every(o => o.prefix === '=')) {
      return new Block({ type: Block.TYPES.RADIO, options });
    }
    throw Error('Could not parse masked block options');
  }

  static getType(block) {
    const obj = Block.fromString(block);
    if (obj) {
      return obj.type;
    }
  }

  // Is valid = type could be detected.
  static isValid(block) {
    if (!((block.charAt(0) === '{') && (block.charAt(block.length - 1) === '}'))) {
      return false;
    }

    try {
      const b = Block.fromString(block);
      if (b === undefined) {
        return false;
      }
    } catch (e) {
      return false;
    }
    return true;
  }

  static isValidMasked(block) {
    try {
      const b = Block.fromMaskedString(block);
      if (b === undefined) {
        return false;
      }
    } catch (e) {
      return false;
    }
    return true;
  }

  toString() {
    switch (this.type) {
      default:
        throw Error(`NotImplemented for type ${this.type}`);
    }
  }

  toMaskedString() {
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
        return `{${this.options.map(o => `=${o.value}`).join(' ')}}`;
      case Block.TYPES.CHECKBOX:
        return `{${this.options.map(o => `~${o.value}`).join(' ')}}`;
      default:
        throw Error(`Could not mask block. Unsupported type ${this.type}`);
    }
  }

  /**
   *
   * @param {(string|string[])} answer answer to the question. Array in case
   *   of checkbox question.
   * @returns {number} grade, typically 0 or 1. Could be adjusted via
   *   percentage %n% option modifier.
   */
  grade(answer) {
    switch (this.type) {
      case Block.TYPES.RADIO:
        const [option] = this.options.filter(o => o.value.trim() === answer);
        if (option) {
          return option.credit || (option.prefix === '=' ? 1 : 0);
        }
        return 0;
      case Block.TYPES.CHECKBOX:
        // NOTE: answer should be an array
        const optionCredits = new Map(this.options.map(o => [o.value, o.credit]));
        const answerScores = answer.map(a => optionCredits.get(a) || 0);
        return answerScores.reduce((total, val) => total + val, 0);
      case Block.TYPES.BOOLEAN:
        return this.options[0].value ^ Boolean(answer) ? 0 : 1;
      case Block.TYPES.TEXT:
        return undefined;
      case Block.TYPES.INPUT:
        return this.options.some(o => o.value.trim() === answer) ? 1 : 0;
      case Block.TYPES.NUMBER:
        answer = Number(answer);
        const optionScores = this.options.map((o) => {
          const { credit = 1, value } = o; // If credit is undefined, e.g. "=", set it to 1
          if (value.includes(':')) {
            // tolerance specified
            const [mean, tolerance] = value.split(':').map(Number);
            return ((answer >= mean - tolerance) && (answer <= mean + tolerance)) ? credit : 0;
          } else if (value.includes('..')) {
            // range specified
            const [valueMin, valueMax] = value.split('..').map(Number);
            return ((answer >= valueMin) && (answer <= valueMax)) ? credit : 0;
          }
          return (Number(value) === answer) ? credit : 0;
        });
        return Math.max(...optionScores);
      default:
        throw Error(`Grading is not implemented for type ${this.type}`);
    }
  }

  getMaxScore() {
    switch (this.type) {
      case Block.TYPES.RADIO:
      case Block.TYPES.BOOLEAN:
      case Block.TYPES.INPUT:
      case Block.TYPES.NUMBER:
        return 1;
      case Block.TYPES.CHECKBOX:
        return this.options.map(o => o.credit)
          .filter(Boolean)
          .filter(x => x > 0)
          .reduce((total, value) => total + value, 0);
      case Block.TYPES.TEXT:
        return undefined;
      default:
        throw Error(`Max score is not implemented for type ${this.type}`);
    }
  }

  /**
   *
   * @param {(string|string[]))} answer answer to the question. Array in case
   *   of checkbox question.
   * @returns {string?} feedback if exists. Else undefined.
   */
  getFeedback(answer) {
    switch (this.type) {
      case Block.TYPES.RADIO:
        const [option] = this.options.filter(o => o.value.trim() === answer);
        if (option) {
          return option.feedback;
        }
        return undefined;
      default:
        throw Error(`Grading is not implemented for type ${this.type}`);
    }
  }
}

Block.TYPES = Object.freeze({
  BOOLEAN: 'BOOLEAN',
  NUMBER: 'NUMBER',
  MATCHING: 'MATCHING',
  INPUT: 'INPUT',
  RADIO: 'RADIO',
  CHECKBOX: 'CHECKBOX',
  TEXT: 'TEXT',
});
