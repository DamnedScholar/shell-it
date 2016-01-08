
fs      = require 'fs'
util    = require 'util'
SubAtom = require 'sub-atom'
exec    = require('child_process').execSync

module.exports =
  activate: ->
    @subs = new SubAtom
    @subs = atom.commands.add 'atom-workspace', 'shell-it:open': => @open()

  open: ->
    if not (@editor = atom.workspace.getActiveTextEditor())
      console.log 'shell-it: Active Pane Is Not A Text Editor'
      return
      
    dialog = document.createElement "div"
    dialog.setAttribute 'style', 'width:100%'
    
    lbl = document.createElement "div"
    lbl.setAttribute 'style', 'position:relative; float:left; margin-right:10px;' +
                              'font-weight:bold; font-size:12px'
    lbl.appendChild document.createTextNode 'Shell Command:'
    dialog.appendChild lbl
    
    input = document.createElement 'input'
    input.setAttribute 'style', 'width:350px'
    input.classList.add 'native-key-bindings'
    dialog.appendChild input
    
    panel = atom.workspace.addModalPanel item: dialog
    input.focus()
    
    input.addEventListener 'keypress', (e) =>
      value = input.getAttribute 'value'
      if e.which is 13
        @process input.value
        panel.destroy()
        atom.views.getView(@editor).focus()
        return false

  process: (cmd) ->
    console.log "shell-it: Processing shell command:", '"' + cmd + '"'
    range = @editor.getSelectedBufferRange()
    text  = @editor.getSelectedText()
    try
      stdout = exec cmd, input:text, timeout: 60e3
      stdout = stdout.toString()
    catch e
      console.log "shell-it: Exception:", util.inspect e, depth: null
      return
    # console.log 'stdout', stdout
    @editor.setTextInBufferRange range, stdout
    console.log "shell-it: Processing done"
    
  deactivate: ->
    @subs.dispose()
