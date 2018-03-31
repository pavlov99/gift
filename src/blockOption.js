/** Single option of the block.*/
export default class BlockOption {
  /**
   * @param {?string} prefix. Either '=' or '~', optional.
   * @param {?number} credit. Float number from -1 to 1 inclusive.
   * @param {string} value, possible answer to the question.
   * @param {?string} feedback optional feedback to the user.
   */
  constructor ({ prefix, credit, value, feedback }) {
    if (value === undefined) {
      throw new Error(`Invalid value '${value}', should not be empty`)
    }
    this.value = value

    if (!(prefix === undefined || prefix == '=' || prefix == '~')) {
      throw new Error(`Invalid prefix value: ${prefix}. Use [undefined, '~', '=']`)
    }
    this.prefix = prefix

    if (credit !== undefined) {
      if (isNaN(parseFloat(credit))) {
        throw new Error(`Invalid credit value '${credit}'. Should be a number.`)
      }
      this.credit = parseFloat(credit)
      if (this.credit > 1 || this.credit < -1) {
        throw new Error(`Invalid credit value '${this.credit}'. Should be in [-1, 1].`)
      }
    } else {
      this.credit = undefined
    }

    this.feedback = feedback
  }

  toString () {
    const prefix = this.prefix ? this.prefix : ''
    const credit = this.credit ? `%${this.credit * 100}%` : ''
    const feedback = this.feedback ? `#${this.feedback}` : ''
    return `${prefix}${credit}${this.value}${feedback}`
  }

  static fromString (option) {
    const re = /^([=~])?(%-?\d{1,3}%)?([^=~#]*)(#[^=~]*)?$/
    const groups = option.match(re)
    if (groups) {
      const credit = groups[2] ?
        parseFloat(groups[2].slice(1, -1)) / 100 : undefined
      const feedback = groups[4] ? groups[4].slice(1) : undefined
      return new BlockOption({
        prefix: groups[1],
        credit,
        value: groups[3],
        feedback
      })
    }
  }
}
