import test from 'tape'
import BlockOption from './blockOption'


test('BlockOption()', (t) => {
  t.test('should create a BlockOption with correct parameters', (st) => {
    st.doesNotThrow(() => new BlockOption({ value: 'option' }))
    st.end()
  })

  t.test('should throw error on incorect prefix', (st) => {
    st.throws(() => new BlockOption({ prefix: '#', value: 'option'}), 'Invalid prefix')
    st.end()
  })

  t.test('should throw error on incorect credit', (st) => {
    st.throws(
      () => (new BlockOption({ value: 'option', credit: 'not-number' })),
      'Invalid credit value \'not-number\'. Should be a number.')
    st.throws(
      () => (new BlockOption({ value: 'option', credit: 2 })),
      'Invalid credit value \'2\'. Should be in [-1, 1].')
    st.end()
  })

  t.test('should throw error on missing value', (st) => {
    st.throws(() => (new BlockOption({})).toString(), 'Invalid value')
    st.end()
  })
})


test('BlockOption.toString()', (t) => {
  t.test('shold stringify an option correctly', (st) => {
    const paramsToString = (params) => (new BlockOption(params)).toString()

    st.equal(paramsToString({ value: 'option'}), 'option')
    st.equal(paramsToString({ prefix: '=', value: 'option'}), '=option')
    st.equal(paramsToString({ prefix: '~', value: 'option'}), '~option')
    st.equal(paramsToString({ value: 'option', feedback: 'good'}), 'option#good')
    st.equal(
      paramsToString({ prefix: '~', value: 'option', credit: 1}), '~%100%option')
    st.equal(
      paramsToString({ prefix: '~', value: 'option', credit: 0.1}), '~%10%option')
    st.end()
  })
})


test('BlockOption.fromString()', (t) => {
  t.test('should parse a string with a value only', (st) => {
    const option = BlockOption.fromString('value')
    st.equal(option.prefix, undefined, 'prefix is undefined')
    st.equal(option.value, 'value', 'value is parsed')
    st.equal(option.credit, undefined, 'credit is undefined')
    st.equal(option.feedback, undefined, 'feedback is undefined')
    st.end()
  })

  t.test('should parse a string with prefix, credit, value and feedback', (st) => {
    const option = BlockOption.fromString('=%50%value#feedback')
    st.equal(option.prefix, '=', 'prefix is parsed')
    st.equal(option.value, 'value', 'value is parsed')
    st.equal(option.credit, 0.5, 'credit is parsed')
    st.equal(option.feedback, 'feedback', 'feedback is parsed')
    st.end()
  })

  t.test('should parse a string with incorrect credit > 100%', (st) => {
    const option1 = BlockOption.fromString('=%100%value#feedback')
    st.equal(option1.value, 'value', 'value is parsed')
    st.equal(option1.credit, 1, 'credit is parsed')

    const option2 = BlockOption.fromString('=%101%value#feedback')
    st.equal(option2.value, '%101%value', 'value is parsed')
    st.equal(option2.credit, undefined, 'credit is parsed')
    st.end()
  })

  t.test('should parse double feedback # # correctly', (st) => {
    const option = BlockOption.fromString('value#feedback1 #feedback2')
    st.equal(option.value, 'value', 'value is parsed')
    st.equal(option.feedback, 'feedback1 #feedback2', 'feedback is parsed')
    st.end()
  })
})
