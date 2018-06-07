import test from 'tape'
import Block from './block'


test('splitOptions', (t) => {
  t.test('should split options', (st) => {
    st.deepEqual(Block.splitOptions('=one option'), ['=one option'])
    st.deepEqual(Block.splitOptions('=correct ~wrong'), ['=correct', '~wrong'])
    st.deepEqual(Block.splitOptions('=even ~incorrect =supported'),
      ['=even', '~incorrect', '=supported'])
    st.deepEqual(Block.splitOptions(' =cat -> cat food =dog -> dog food '),
      ['=cat -> cat food', '=dog -> dog food'])
    st.deepEqual(Block.splitOptions('=even ~incorrect =supported'),
      ['=even', '~incorrect', '=supported'])
    st.deepEqual(Block.splitOptions('=option1 ~option2 \\~option3 \\= \\~ \\# #'),
      ['=option1', '~option2 \\~option3 \\= \\~ \\# #'])
    st.end()
  })

  t.skip('should split tricky options', (st) => {
    // FIXME: Requires negative lookbehind
    st.deepEqual(
      Block.splitOptions(`text \\= not option =option1
        ~~option2 # text \\= in comment # another one =option3`), [
        'text \\= not option',
        '=option1',
        '~',
        '~option2 # text \\= in comment # another one',
        '=option3'
      ]
    )
    st.end()
  })
})

test('getType', (t) => {
  t.test('should detect TEXT (Essay) type', (st) => {
    st.equal(Block.getType('{}'), 'TEXT')
    st.equal(Block.getType('{ }'), 'TEXT')
    st.equal(Block.getType('{\t}'), 'TEXT')
    st.equal(Block.getType('{\n}'), 'TEXT')
    st.end()
  })

  t.test('should detect BOOLEAN (True/False) type', (st) => {
    st.equal(Block.getType('{TRUE}'), 'BOOLEAN')
    st.equal(Block.getType('{FALSE}'), 'BOOLEAN')
    st.equal(Block.getType('{T}'), 'BOOLEAN')
    st.equal(Block.getType('{F}'), 'BOOLEAN')
    st.end()
  })

  t.test('should detect invalid BOOLEAN type', (st) => {
    st.equal(Block.getType('{true}'), undefined)
    st.equal(Block.getType('{false}'), undefined)
    st.equal(Block.getType('{t}'), undefined)
    st.equal(Block.getType('{f}'), undefined)
    // No brackets
    st.throws(() => Block.getType('T'), /Block should start with '{' and end with '}/)
    st.throws(() => Block.getType('F'), /Block should start with '{' and end with '}/)
    // Extra spaces
    st.equal(Block.getType('{ T}'), undefined)
    st.equal(Block.getType('{T }'), undefined)
    st.equal(Block.getType('{ T }'), undefined)
    st.end()
  })

  t.test('should detect NUMBER type', (st) => {
    st.equal(Block.getType('{#0}'), 'NUMBER')
    st.equal(Block.getType('{#0.1}'), 'NUMBER')

    // Examples from the documentation
    st.equal(Block.getType('{#1822:5}'), 'NUMBER')
    st.equal(Block.getType('{#3.14159:0.0005}'), 'NUMBER')
    st.equal(Block.getType('{#3.141..3.142}'), 'NUMBER')
    st.end()
  })

  t.test('should detect NUMBER type multiline strings', (st) => {
    const block = `{#
      =1822:0
      =%50%1822:2
    }`
    st.equal(Block.getType(block), 'NUMBER')
    st.end()
  })

  t.test('should detect invalid NUMBER type', (st) => {
    // No answer
    st.throws(() => Block.getType('{#}'), /Invalid number block/)
    // extra spaces
    st.throws(() => Block.getType('{# 1}'), /Invalid number block/)
    st.throws(() => Block.getType('{#1 }'), /Invalid number block/)
    // precision is not specified
    st.throws(() => Block.getType('{#1:}'), /Invalid number block/)
    st.throws(() => Block.getType('{#1..}'), /Invalid number block/)
    // only precision/range specified
    st.throws(() => Block.getType('{#:1}'), /Invalid number block/)
    st.throws(() => Block.getType('{#..1}'), /Invalid number block/)
    // both precision and range
    st.throws(() => Block.getType('{#1:1..2}'), /Invalid number block/)
    st.throws(() => Block.getType('{#1..2:1}'), /Invalid number block/)
    // wrong presitions
    st.throws(() => Block.getType('{#1:1:2}'), /Invalid number block/)
    // wrong range
    st.throws(() => Block.getType('{#1..2..3}'), /Invalid number block/)
    st.throws(() => Block.getType('{#1...2}'), /Invalid number block/)
    st.end()
  })

  t.test('should detect INPUT type', (st) => {
    st.equal(Block.getType('{=Grant =Ulysses S. Grant =Ulysses Grant}'), 'INPUT')
    st.equal(Block.getType('{=four =4}'), 'INPUT')
    st.end()
  })

  t.test('should detect MATCHING type', (st) => {
    st.equal(Block.getType('{ =cat -> cat food =dog -> dog food }'), 'MATCHING')
    st.equal(Block.getType(`{
       =Canada -> Ottawa
       =Italy  -> Rome
       =Japan  -> Tokyo
       =India  -> New Delhi
     }`), 'MATCHING')
    st.end()
  })

  t.test('should detect RADIO type', (st) => {
    st.equal(Block.getType('{=correct ~wrong}'), 'RADIO')
    st.equal(Block.getType('{=Grant ~no one ~Napoleon ~Churchill ~Mother Teresa }'), 'RADIO')
    st.equal(Block.getType(`{
      =Grant
      ~No one
      #Was true for 12 years, but Grant's remains were buried in the tomb in 1897
      ~Napoleon
      #He was buried in France
      ~Churchill
      #He was buried in England
      ~Mother Teresa
      #She was buried in India
      }`
    ), 'RADIO')
    st.equal(Block.getType('{=yellow # right; good! ~red # wrong, it\'s yellow ~blue # wrong, it\'s yellow }'), 'RADIO')
    st.end()
  })

  t.test('should detect CHECKBOX type', (st) => {
    st.equal(Block.getType(`{
       ~%-100%No one
       ~%50%Grant
       ~%50%Grant's wife
       ~%-100%Grant's father
    }`), 'CHECKBOX')
    st.end()
  })
})

test('isValidMasked', (t) => {
  t.test('should detect valid masked question', (st) => {
    st.ok(Block.isValidMasked('{}'))
    st.ok(Block.isValidMasked('{#}'))
    st.ok(Block.isValidMasked('{=}'))
    st.ok(Block.isValidMasked('{~}'))
    st.ok(Block.isValidMasked('{=a =b}'))
    st.ok(Block.isValidMasked('{~a ~b}'))
    st.end()
  })

  t.test('should detect invalid masked question', (st) => {
    st.false(Block.isValidMasked('{=a ~b}'))
    st.false(Block.isValidMasked('{ some text }'))
    st.end()
  })
})

test('grade', (t) => {
  t.test('should recognize correct answer', (st) => {
    st.equal(Block.fromString('{=yes ~no}').grade('yes'), 1)
    st.end()
  })

  t.test('should recognize incorrect answer', (st) => {
    st.equal(Block.fromString('{=yes ~no}').grade('no'), 0)
    st.equal(Block.fromString('{=yes ~no}').grade('maybe'), 0)
    st.end()
  })
})

test('getFeedback', (t) => {
  t.test('should get feedback', (st) => {
    const block = Block.fromString('{=yes #correct ~no #incorrect ~dont know}');
    console.log(block.options)
    st.equal(block.getFeedback('yes'), 'correct')
    st.equal(block.getFeedback('no'), 'incorrect')
    st.equal(block.getFeedback('dont know'), undefined)
    st.equal(block.getFeedback('not option'), undefined)
    st.end()
  })
})