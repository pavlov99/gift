import test from 'tape'
import Question from './question'

test('splitBlocks', (t) => {
  t.test('should split question string into block chunks simple', (st) => {
    const question = '1 + 1 {=2}'
    const result = Question.splitBlocks('1 + 1 {=2}')
    st.deepEqual(result, ['1 + 1 ', '{=2}'])
    st.equal(result.join(''), question)
    st.end()
  })

  t.test('should split question string into block chunks', (st) => {
    const questions = [
      ['1 + 1 ', '{#2}', '. Sure!'],
      ['1 + 1 ', '{#2}', '. Sure! How about 2 * 2:', '{=4 ~5}'],
      ['String without GIFT blocks'],
    ]
    questions.forEach((chunks) => {
      st.deepEqual(Question.splitBlocks(chunks.join('')), chunks)
    })
    st.end()
  })

  t.skip('should split escaped string into block chunks', (st) => {
    const questions = [
      ['Escaped opened \\{'],
      ['Escaped opened \\{ }']
      ['Escaped closed { \\}']
      ['Escaped both \\{ \\}'],
      ['Escaped both ', '{ \\} \\{ }'],
    ]
    questions.forEach((chunks) => {
      st.deepEqual(Question.splitBlocks(chunks.join('')), chunks)
    })
    st.end()
  })

  t.test('should mask question', (st) => {
    const question = 'What is 1 + 1? {~1 =2 =3}'
    st.equal(Question.mask(question), 'What is 1 + 1? {=1 =2 =3}')
    st.end()
  })
})
