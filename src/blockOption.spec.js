import test from 'zora';
import BlockOption from './blockOption';


test('BlockOption()', (t) => {
  t.test('should create a BlockOption with correct parameters', (tt) => {
    tt.doesNotThrow(() => new BlockOption({ value: 'option' }));
  });

  t.test('should throw error on incorect prefix', (tt) => {
    tt.throws(() => new BlockOption({ prefix: '#', value: 'option' }), 'Invalid prefix');
  });

  t.test('should throw error on incorect credit', (tt) => {
    tt.throws(
      () => (new BlockOption({ value: 'option', credit: 'not-number' })),
      'Invalid credit value \'not-number\'. Should be a number.',
    );
    tt.throws(
      () => (new BlockOption({ value: 'option', credit: 2 })),
      'Invalid credit value \'2\'. Should be in [-1, 1].',
    );
  });

  t.test('should throw error on missing value', (tt) => {
    tt.throws(() => (new BlockOption({})).toString(), 'Invalid value');
  });
});


test('BlockOption.toString()', (t) => {
  t.test('shold stringify an option correctly', (tt) => {
    const paramsToString = params => (new BlockOption(params)).toString();

    tt.equal(paramsToString({ value: 'option' }), 'option');
    tt.equal(paramsToString({ prefix: '=', value: 'option' }), '=option');
    tt.equal(paramsToString({ prefix: '~', value: 'option' }), '~option');
    tt.equal(paramsToString({ value: 'option', feedback: 'good' }), 'option#good');
    tt.equal(paramsToString({ prefix: '~', value: 'option', credit: 1 }), '~%100%option');
    tt.equal(paramsToString({ prefix: '~', value: 'option', credit: 0.1 }), '~%10%option');
  });
});


test('BlockOption.fromString()', (t) => {
  t.test('should parse a string with a value only', (tt) => {
    const option = BlockOption.fromString('value');
    tt.equal(option.prefix, undefined, 'prefix is undefined');
    tt.equal(option.value, 'value', 'value is parsed');
    tt.equal(option.credit, undefined, 'credit is undefined');
    tt.equal(option.feedback, undefined, 'feedback is undefined');
  });

  t.test('should parse a string with prefix, credit, value and feedback', (tt) => {
    const option = BlockOption.fromString('=%50%value#feedback');
    tt.equal(option.prefix, '=', 'prefix is parsed');
    tt.equal(option.value, 'value', 'value is parsed');
    tt.equal(option.credit, 0.5, 'credit is parsed');
    tt.equal(option.feedback, 'feedback', 'feedback is parsed');
  });

  t.test('should parse a string with incorrect credit > 100%', (tt) => {
    const option1 = BlockOption.fromString('=%100%value#feedback');
    tt.equal(option1.value, 'value', 'value is parsed');
    tt.equal(option1.credit, 1, 'credit is parsed');

    const option2 = BlockOption.fromString('=%101%value#feedback');
    tt.equal(option2.value, '%101%value', 'value is parsed');
    tt.equal(option2.credit, undefined, 'credit is parsed');
  });

  t.test('should parse double feedback # # correctly', (tt) => {
    const option = BlockOption.fromString('value#feedback1 #feedback2');
    tt.equal(option.value, 'value', 'value is parsed');
    tt.equal(option.feedback, 'feedback1 #feedback2', 'feedback is parsed');
  });
});
