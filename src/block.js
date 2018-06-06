import * as regexp from './regexp'
import BlockOption from './blockOption'


/* GITF Block */
export default class Block {
  /**
   * @param {string} type
   */
  constructor ({ type, options = [] }) {
    this.type = type
    this.options = options
  }

  static splitOptions (block) {
    // NOTE: do not remember option value, a.k.a (?:) group
    // In every option match either special character [=,~,#,{,}] or not option
    // start
    // NOTE: .split(/((?<!\\)[=~](?:(?:\\[=~#\{\}])|(?:[^=~]))+)/y)
    // negative lookbehind is not supported! Write tests to fail it.
    return block
      .trim()
      .split(/([=~](?:(?:\\[=~#{}])|(?:[^=~]))+)/g)
      .filter(x => x)
      .map(x => x.trim())
  }

  static fromString (block) {
    if (!((block.charAt(0) == '{') && (block.charAt(block.length - 1) == '}'))) {
      throw new Error(`Block should start with '{' and end with '}': ${block}`)
    }
    const body = block.slice(1, -1)

    // Apply simple rules and regular expressions first (easier and handle multiple cases)
    // Then attempt to parse candidates into blocks.
    const OPTION_INTERVAL = new RegExp('[=~](%\\d{2}%)?' + regexp.INTERVAL.source + '\\s*(#[^=~]*)?')
    const BLOCK_NUMBER = new RegExp(`^((${regexp.INTERVAL.source})|((\\s*${OPTION_INTERVAL.source})+))$`)

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
        throw new Error(`Invalid number block: ${block}`)
      }
    } else {
      const options = this.splitOptions(body).map(o => BlockOption.fromString(o))

      if (options.every(o => o.prefix == '~')) {
        return new Block({
          type: Block.TYPES.CHECKBOX,
          options
        })
      } else if (options.every(o => o.prefix == '=')) {
        if (options.every(o => o.value.includes('->'))) {
          return new Block({
            type: Block.TYPES.MATCHING,
            options
          })
        }
        return new Block({
          type: Block.TYPES.INPUT,
          options: options
        })
      } else if (options.every(o => o.prefix == '~' || o.prefix == '=')) {
        // candidate for radio button
        // TODO: add tests for incorrect radio options a.k.a multiple ~ =
        // TODO: add tests for options not starting with = or ~.
        return new Block({
          type: Block.TYPES.RADIO,
          options
        })
      }
    }
  }

  static fromMaskedString (block) {
    if (!((block.charAt(0) == '{') && (block.charAt(block.length - 1) == '}'))) {
      throw new Error(`Block should start with '{' and end with '}': ${block}`)
    }
    const body = block.slice(1, -1)
    if (body === '') {
      return new Block({ type: Block.TYPES.TEXT })
    } else if (body === '~') {
      return new Block({ type: Block.TYPES.BOOLEAN })
    } else if (body === '#') {
      return new Block({ type: Block.TYPES.NUMBER })
    } else if (body === '=') {
      return new Block({ type: Block.TYPES.INPUT })
    } else {
      const options = this.splitOptions(body).map(o => BlockOption.fromString(o))
      if (options.every(o => o.prefix == '~')) {
        return new Block({ type: Block.TYPES.CHECKBOX, options })
      } else if (options.every(o => o.prefix == '=')) {
        return new Block({ type: Block.TYPES.RADIO, options })
      } else {
        throw Error(`Could not parse masked block options`)
      }
    }
  }

  static getType (block) {
    const obj = Block.fromString(block)
    if (obj) {
      return obj.type
    }
  }

  // Is valid = type could be detected.
  static isValid (block) {
    if (!((block.charAt(0) == '{') && (block.charAt(block.length - 1) == '}'))) {
      return false
    }

    try {
      Block.fromString(block);
    } catch (e) {
      return false;
    }
    return true;
  }

  static isValidMasked (block) {
    try {
      Block.fromMaskedString(block);
    } catch (e) {
      return false;
    }
    return true;
  }

  toString() {
  }

  toMaskedString() {
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
        return `{${this.options.map(o => `=${o.value}`).join(' ')}}`
      case Block.TYPES.CHECKBOX:
        return `{${this.options.map(o => `~${o.value}`).join(' ')}}`
      default:
       throw Error(`Could not mask block. Unsupported type ${this.type}`)
    }
  }

  grade (answer) {}
}

Block.TYPES = Object.freeze({
  BOOLEAN: 'BOOLEAN',
  NUMBER: 'NUMBER',
  MATCHING: 'MATCHING',
  INPUT: 'INPUT',
  RADIO: 'RADIO',
  CHECKBOX: 'CHECKBOX',
  TEXT: 'TEXT',
})
