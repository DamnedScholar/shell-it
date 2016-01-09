
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
    dialog.innerHTML = """
      <div style="position:relative; display:inline-block; margin-right:10px;">
          <label for="shell-it-selin">
            <input id="shell-it-selin" type="checkbox" checked>
            Selection
          </label>
        <br>
          <label for="shell-it-clipin">
            <input id="shell-it-clipin" type="checkbox">
            Clipboard
          </label>
      </div>
      
      <div style="position:relative; top:12px; display:inline-block; ">
        <div style="position:relative; top:2px; display:inline-block; margin-right:10px; 
                    font-size:14px; font-weight:bold"> 
          =&gt 
        </div>
        
        <input id="shell-it-cmd" class="native-key-bindings" 
               placeholder="Enter shell command" 
               style="width:240px; font-size:14px; display:inline-block">
        
        <div style="position:relative; margin-left:10px; display:inline-block; 
                    font-size:14px; font-weight:bold"> 
          =&gt
        </div>
      </div>
      
      <div style="position:relative; display:inline-block; margin-left:10px;'>
          <label  for="shell-it-selout">
          <input id="shell-it-selout" type="checkbox" checked>
          Selection
          </label>
        <br>
          <label  for="shell-it-clipout">
            <input id="shell-it-clipout" type="checkbox">
            Clipboard
          </label>
      </div>
    """
    panel = atom.workspace.addModalPanel item: dialog
    input = document.getElementById 'shell-it-cmd'
    input.focus()
    input.addEventListener 'keypress', (e) =>
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
