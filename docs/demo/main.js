(function () {
  function _getBlockOptionNode (option) {
    var node = window.document.createElement('TR')

    var headers = ['prefix', 'credit', 'value', 'feedback']
    for (var i = 0; i < headers.length; i++) {
      var td = window.document.createElement('TD')
      td.textContent = option[headers[i]]
      node.appendChild(td)
    }

    return node
  }

  function getBlockOptionsTableNode (options) {
    var node = window.document.createElement('TABLE')
    node.className = 'table is-bordered is-narrow'
    var head = window.document.createElement('THEAD')
    node.appendChild(head)
    var tr = window.document.createElement('TR')
    head.appendChild(tr)

    var headers = ['prefix', 'credit', 'value', 'feedback']
    for (var i = 0; i < headers.length; i++) {
      var th = window.document.createElement('TH')
      th.textContent = headers[i]
      tr.appendChild(th)
    }

    var body = window.document.createElement('TBODY')
    node.appendChild(body)
    for (i = 0; i < options.length; i++) {
      node.appendChild(_getBlockOptionNode(options[i]))
    }

    return node
  }

  function _getRenderedListNode (options) {
    var node = window.document.createElement('DIV')
    node.className = 'field'
    var div = window.document.createElement('DIV')
    div.className = 'control'
    var uniqueName = new Date().valueOf()
    for (var i = 0; i < options.length; i++) {
      var label = window.document.createElement('LABEL')
      label.className = options[i].prefix === '~' ? 'checkbox' : 'radio'
      div.appendChild(label)
      var input = window.document.createElement('INPUT')
      input.type = options[i].prefix === '~' ? 'checkbox' : 'radio'
      input.name = uniqueName
      label.appendChild(input)
      label.appendChild(window.document.createTextNode(options[i].value))
    }

    node.appendChild(div)
    return node
  }

  function _getRenderedSelectorNode (options) {
    var node = window.document.createElement('DIV')
    node.className = 'select'
    // TODO: support select multiple
    var select = window.document.createElement('SELECT')
    node.appendChild(select)
    for (var i = 0; i < options.length; i++) {
      var option = window.document.createElement('OPTION')
      select.appendChild(option)
      option.value = options[i].value
      option.textContent = options[i].value
    }
    return node
  }

  // Render form with submit at Question level.
  function getRenderedBlockNode (block) {
    switch (block.type) {
      case 'TEXT':
        return window.document.createElement('TEXTAREA')
      case 'BOOLEAN':
        return _getRenderedListNode([{ value: 'True' }, { value: 'False' }])
      case 'NUMBER':
        var numberInput = window.document.createElement('INPUT')
        numberInput.type = 'number'
        return numberInput
      case 'INPUT':
        var textInput = window.document.createElement('INPUT')
        textInput.type = 'text'
        return textInput
      case 'RADIO':
        return _getRenderedSelectorNode(block.options)
      case 'CHECKBOX':
        return _getRenderedListNode(block.options)
      default:
        return window.document.createElement('DIV')
    }
  }

  function getBlockNode (block) {
    var node = window.document.createElement('LI')
    var blockText = window.document.createElement('DIV')
    blockText.textContent = block
    var blockOptions = window.document.createElement('DIV')
    var blockTextMasked = window.document.createElement('DIV')
    var blockRendered = window.document.createElement('DIV')

    try {
      var b = gift.Block.fromString(block)
      blockText.textContent += (' [GIFT:' + b.type + ']')
      blockOptions.appendChild(getBlockOptionsTableNode(b.options))
      blockTextMasked.textContent = 'Masked: ' + b.toMaskedString()

      var m = gift.Block.fromMaskedString(b.toMaskedString())
      blockRendered.appendChild(getRenderedBlockNode(m))
    } catch (err) {
    }

    node.appendChild(blockText)
    node.appendChild(blockOptions)
    node.appendChild(blockTextMasked)
    node.appendChild(blockRendered)

    return node
  }

  function render () {
    var input = window.document.getElementById('input')
    var question = input.value
    var blocks = gift.Question.splitBlocks(question)
    var blockList = window.document.getElementById('blocks')
    blockList.innerHTML = ''
    for (var i = 0; i < blocks.length; i++) {
      blockList.appendChild(getBlockNode(blocks[i]))
    }

    var output = window.document.getElementById('output')
    output.innerHTML = ''
    for (i = 0; i < blocks.length; i++) {
      try {
        var b = gift.Block.fromString(blocks[i])
        var m = gift.Block.fromMaskedString(b.toMaskedString())
        output.appendChild(getRenderedBlockNode(m))
      } catch (err) {
        // Append text node
        output.appendChild(window.document.createTextNode(blocks[i]))
      }
    }
  }

  function init () {
    var input = window.document.getElementById('input')
    render()
    input.addEventListener('keyup', render)
  }

  window.onload = init
})()
