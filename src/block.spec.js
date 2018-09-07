import test from 'zora';
import Block from './block';


test('splitOptions', (t) => {
  t.test('should split options', (tt) => {
    tt.deepEqual(Block.splitOptions('=one option'), ['=one option']);
    tt.deepEqual(Block.splitOptions('=correct ~wrong'), ['=correct', '~wrong']);
    tt.deepEqual(
      Block.splitOptions('=even ~incorrect =supported'),
      ['=even', '~incorrect', '=supported'],
    );
    tt.deepEqual(
      Block.splitOptions(' =cat -> cat food =dog -> dog food '),
      ['=cat -> cat food', '=dog -> dog food'],
    );
    tt.deepEqual(
      Block.splitOptions('=even ~incorrect =supported'),
      ['=even', '~incorrect', '=supported'],
    );
    tt.deepEqual(
      Block.splitOptions('=option1 ~option2 \\~option3 \\= \\~ \\# #'),
      ['=option1', '~option2 \\~option3 \\= \\~ \\# #'],
    );
  });

  t.test('should split tricky options', (tt) => {
    // FIXME: Requires negative lookbehind
    tt.deepEqual(Block.splitOptions(`text \\= not option =option1
        ~~option2 # text \\= in comment # another one =option3`), [
      'text \\= not option',
      '=option1',
      '~',
      '~option2 # text \\= in comment # another one',
      '=option3',
    ]);
  });
});

test('getType', (t) => {
  t.test('should detect TEXT (Essay) type', (tt) => {
    tt.equal(Block.getType('{}'), 'TEXT');
    tt.equal(Block.getType('{ }'), 'TEXT');
    tt.equal(Block.getType('{\t}'), 'TEXT');
    tt.equal(Block.getType('{\n}'), 'TEXT');
  });

  t.test('should detect BOOLEAN (True/False) type', (tt) => {
    tt.equal(Block.getType('{TRUE}'), 'BOOLEAN');
    tt.equal(Block.getType('{FALSE}'), 'BOOLEAN');
    tt.equal(Block.getType('{T}'), 'BOOLEAN');
    tt.equal(Block.getType('{F}'), 'BOOLEAN');
  });

  t.test('should detect invalid BOOLEAN type', (tt) => {
    tt.equal(Block.getType('{true}'), undefined);
    tt.equal(Block.getType('{false}'), undefined);
    tt.equal(Block.getType('{t}'), undefined);
    tt.equal(Block.getType('{f}'), undefined);
    // No brackets
    tt.throws(() => Block.getType('T'), /Block should start with '{' and end with '}/);
    tt.throws(() => Block.getType('F'), /Block should start with '{' and end with '}/);
    // Extra spaces
    tt.equal(Block.getType('{ T}'), undefined);
    tt.equal(Block.getType('{T }'), undefined);
    tt.equal(Block.getType('{ T }'), undefined);
  });

  t.test('should detect NUMBER type', (tt) => {
    tt.equal(Block.getType('{#0}'), 'NUMBER');
    tt.equal(Block.getType('{#0.1}'), 'NUMBER');

    // Examples from the documentation
    tt.equal(Block.getType('{#1822:5}'), 'NUMBER');
    tt.equal(Block.getType('{#3.14159:0.0005}'), 'NUMBER');
    tt.equal(Block.getType('{#3.141..3.142}'), 'NUMBER');
  });

  t.test('should detect NUMBER type multiline strings', (tt) => {
    const block = `{#
      =1822:0
      =%50%1822:2
    }`;
    tt.equal(Block.getType(block), 'NUMBER');
  });

  t.test('should detect invalid NUMBER type', (tt) => {
    // No answer
    tt.throws(() => Block.getType('{#}'), /Invalid number block/);
    // extra spaces
    tt.throws(() => Block.getType('{# 1}'), /Invalid number block/);
    tt.throws(() => Block.getType('{#1 }'), /Invalid number block/);
    // precision is not specified
    tt.throws(() => Block.getType('{#1:}'), /Invalid number block/);
    tt.throws(() => Block.getType('{#1..}'), /Invalid number block/);
    // only precision/range specified
    tt.throws(() => Block.getType('{#:1}'), /Invalid number block/);
    tt.throws(() => Block.getType('{#..1}'), /Invalid number block/);
    // both precision and range
    tt.throws(() => Block.getType('{#1:1..2}'), /Invalid number block/);
    tt.throws(() => Block.getType('{#1..2:1}'), /Invalid number block/);
    // wrong presitions
    tt.throws(() => Block.getType('{#1:1:2}'), /Invalid number block/);
    // wrong range
    tt.throws(() => Block.getType('{#1..2..3}'), /Invalid number block/);
    tt.throws(() => Block.getType('{#1...2}'), /Invalid number block/);
  });

  t.test('should detect INPUT type', (tt) => {
    tt.equal(Block.getType('{=Grant =Ulysses S. Grant =Ulysses Grant}'), 'INPUT');
    tt.equal(Block.getType('{=four =4}'), 'INPUT');
  });

  t.test('should detect MATCHING type', (tt) => {
    tt.equal(Block.getType('{ =cat -> cat food =dog -> dog food }'), 'MATCHING');
    tt.equal(Block.getType(`{
       =Canada -> Ottawa
       =Italy  -> Rome
       =Japan  -> Tokyo
       =India  -> New Delhi
     }`), 'MATCHING');
  });

  t.test('should detect RADIO type', (tt) => {
    tt.equal(Block.getType('{=correct ~wrong}'), 'RADIO');
    tt.equal(Block.getType('{=Grant ~no one ~Napoleon ~Churchill ~Mother Teresa }'), 'RADIO');
    tt.equal(Block.getType(`{
      =Grant
      ~No one
      #Was true for 12 years, but Grant's remains were buried in the tomb in 1897
      ~Napoleon
      #He was buried in France
      ~Churchill
      #He was buried in England
      ~Mother Teresa
      #She was buried in India
      }`), 'RADIO');
    tt.equal(Block.getType('{=yellow # right; good! ~red # wrong, it\'s yellow ~blue # wrong, it\'s yellow }'), 'RADIO');
  });

  t.test('should detect CHECKBOX type', (tt) => {
    tt.equal(Block.getType(`{
       ~%-100%No one
       ~%50%Grant
       ~%50%Grant's wife
       ~%-100%Grant's father
    }`), 'CHECKBOX');
  });
});

test('isValidMasked', (t) => {
  t.test('should detect valid masked question', (tt) => {
    tt.ok(Block.isValidMasked('{}'));
    tt.ok(Block.isValidMasked('{#}'));
    tt.ok(Block.isValidMasked('{=}'));
    tt.ok(Block.isValidMasked('{~}'));
    tt.ok(Block.isValidMasked('{=a =b}'));
    tt.ok(Block.isValidMasked('{~a ~b}'));
  });

  t.test('should detect invalid masked question', (tt) => {
    tt.notOk(Block.isValidMasked('{=a ~b}'));
    tt.notOk(Block.isValidMasked('{ some text }'));
  });
});

test('grade', (t) => {
  t.test('should recognize correct answer RADIO', (tt) => {
    tt.equal(Block.fromString('{=yes ~no}').grade('yes'), 1);
  });

  t.test('should recognize incorrect answer RADIO', (tt) => {
    tt.equal(Block.fromString('{=yes ~no}').grade('no'), 0);
    tt.equal(Block.fromString('{=yes ~no}').grade('maybe'), 0);
  });

  t.test('should recognize correct answer BOOLEAN', (tt) => {
    tt.equal(Block.fromString('{T}').grade(true), 1);
    tt.equal(Block.fromString('{T}').grade(false), 0);
    tt.equal(Block.fromString('{F}').grade(true), 0);
    tt.equal(Block.fromString('{F}').grade(false), 1);
  });

  t.test('should recognize correct answer INPUT', (tt) => {
    tt.equal(Block.fromString('{=a}').grade('a'), 1);
    tt.equal(Block.fromString('{=a}').grade('b'), 0);
    tt.equal(Block.fromString('{=one =two}').grade('one'), 1);
    tt.equal(Block.fromString('{=one =two}').grade('two'), 1);
    tt.equal(Block.fromString('{=one =two}').grade('three'), 0);
  });

  t.test('should recognize correct answer CHECKBOX', (tt) => {
    tt.equal(Block.fromString('{~a ~b}').grade(['a']), 0, 'option matched but credit is zero');
    tt.equal(Block.fromString('{~%100%a ~b}').grade(['a']), 1, 'option matched and credit is 100%');

    tt.equal(Block.fromString('{~%30%a ~b ~%70%c}').grade(['a']), 0.3);
    tt.equal(Block.fromString('{~%30%a ~b ~%70%c}').grade(['c']), 0.7);
    tt.equal(Block.fromString('{~%30%a ~b ~%70%c}').grade(['a', 'c']), 1);

    tt.equal(Block.fromString('{~%60%a ~%-80%b ~%60%c ~%-100%d}').grade(['a', 'c']), 1.2);
    tt.equal(Block.fromString('{~%60%a ~%-80%b ~%60%c ~%-100%d}').grade(['b', 'd']), -1.8);
  });

  t.test('should recognize correct answer NUMBER', (tt) => {
    tt.equal(Block.fromString('{#1}').grade(0), 0);
    tt.equal(Block.fromString('{#1}').grade(1), 1);

    // Tolerance
    tt.equal(Block.fromString('{#0:1}').grade(1), 1);
    tt.equal(Block.fromString('{#0:1}').grade(-1), 1);
    tt.equal(Block.fromString('{#0:1}').grade(2), 0);

    // Range
    tt.equal(Block.fromString('{#-1..2}').grade(1), 1);
    tt.equal(Block.fromString('{#-1..2}').grade(2), 1);
    tt.equal(Block.fromString('{#-1..2}').grade(3), 0);    
  });

  t.test('should recognize correct answer NUMBER multiple options', (tt) => {
    const block = Block.fromString('{# =1822:0 =%50%1822:2}');
    tt.equal(block.grade(1822), 1);
    tt.equal(block.grade(1823), 0.5);
    tt.equal(block.grade(1825), 0);
  });
});

test('getMaxScore', (t) => {
  t.test('should getMax score', (tt) => {
    tt.equal(Block.fromString('{T}').getMaxScore(), 1);
    tt.equal(Block.fromString('{=yes ~no}').getMaxScore(), 1);
    tt.equal(Block.fromString('{=input}').getMaxScore(), 1);
    tt.equal(Block.fromString('{~%50%a ~%50%b}').getMaxScore(), 1);
    tt.equal(Block.fromString('{# =1822:0 =%50%1822:2}').getMaxScore(), 1);
  });
});

test('getFeedback', (t) => {
  t.test('should get feedback', (tt) => {
    const block = Block.fromString('{=yes #correct ~no #incorrect ~dont know}');
    tt.equal(block.getFeedback('yes'), 'correct');
    tt.equal(block.getFeedback('no'), 'incorrect');
    tt.equal(block.getFeedback('dont know'), undefined);
    tt.equal(block.getFeedback('not option'), undefined);
  });
});
