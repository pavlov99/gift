import test from 'zora';
import Question from './question';

test('splitBlocks', (t) => {
  t.test('should split question string into block chunks simple', (tt) => {
    const question = '1 + 1 {=2}';
    const result = Question.splitBlocks('1 + 1 {=2}');
    tt.deepEqual(result, ['1 + 1 ', '{=2}']);
    tt.equal(result.join(''), question);
  });

  t.test('should split question string into block chunks', (tt) => {
    const questions = [
      ['1 + 1 ', '{#2}', '. Sure!'],
      ['1 + 1 ', '{#2}', '. Sure! How about 2 * 2:', '{=4 ~5}'],
      ['String without GIFT blocks'],
    ];
    questions.forEach((chunks) => {
      tt.deepEqual(Question.splitBlocks(chunks.join('')), chunks);
    });
  });

  t.test('should not split source code with {} into blocks', (tt) => {
    const s = "```javascript\nfunction x() {\n  return '';\n}\n``` Is this code correct? {=yes ~no}";
    const blocks = Question.splitBlocks(s);
    tt.equal(blocks.length, 2, 'should split into 2 blocks');
  });

  t.test('should split escaped string into block chunks', (tt) => {
    const questions = [
      ['Escaped opened \\{'],
      ['Escaped opened \\{ }'],
      ['Escaped closed { \\}'],
      ['Escaped both \\{ \\}'],
      ['Escaped both ', '{ \\} \\{ }'],
    ];
    questions.forEach((chunks) => {
      tt.deepEqual(Question.splitBlocks(chunks.join('')), chunks);
    });
  });

  t.test('should mask question', (tt) => {
    const question = 'What is 1 + 1? {~1 =2 ~3}';
    tt.equal(Question.fromString(question).mask(), 'What is 1 + 1? {=1 =2 =3}');
  });

  t.test('should grade questions RADIO with one gift block', (tt) => {
    const question = Question.fromString('What is 1 + 1? {~1 =2 ~3}');
    tt.equal(question.grade('1'), 0);
    tt.equal(question.grade('2'), 1);
    tt.equal(question.grade('4'), 0, 'give 0 scores for non-existing answer');
  });

  t.test('should grade questions RADIO with two gift block', (tt) => {
    const question = Question.fromString('What is 1 + 1 {~1 =2 ~3}? How about 2 * 2? {~2 =4 ~8}');
    tt.equal(question.grade('2', '4'), 2);
    tt.equal(question.grade('2', '2'), 1, 'first correct, second wrong');
    tt.equal(question.grade('3', '4'), 1, 'first wrong, second correct');
    tt.equal(question.grade('1', '2'), 0, 'both wrong');
    tt.equal(question.grade('2'), 1, 'undefined answer to the second block');
  });
});
