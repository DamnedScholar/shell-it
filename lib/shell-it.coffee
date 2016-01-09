
fs      = require 'fs'
util    = require 'util'
SubAtom = require 'sub-atom'
exec    = require('child_process').execSync

module.exports =
  activate: ->
    @subs = new SubAtom
    @subs.add atom.commands.add 'atom-workspace', 'shell-it:open': => @open()
    @subs.add atom.commands.add 'atom-workspace', 'core:cancel':   => @close()
      
  open: ->
    if @panel then @close()

    if not (@editor = atom.workspace.getActiveTextEditor())
      console.log 'shell-it: Active Pane Is Not A Text Editor'
      return
      
    editorPath = @editor.getPath()
    for projPath in atom.project.getPaths()
      break if editorPath[0...projPath.length] is projPath

    dialog = document.createElement "div"
    dialog.setAttribute 'style', 'width:100%'
    dialog.innerHTML = """
      <div style="position:relative; display:inline-block; margin-right:10px;">
          <label  for="shell-it-selin">
            <input id="shell-it-selin" type="checkbox" checked>
            Selection
          </label>
        <br>
          <label  for="shell-it-clipin">
            <input id="shell-it-clipin" type="checkbox">
            Clipboard
          </label>
      </div>
      
      <div style="position:relative; top:-12px; display:inline-block; ">
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
    @panel = atom.workspace.addModalPanel item: dialog
    input = document.getElementById 'shell-it-cmd'
    input.focus()
    input.addEventListener 'keypress', (e) =>
      if e.which is 13
        stdin = ''
        if document.getElementById('shell-it-selin').checked
          stdin += @editor.getSelectedText()
        if document.getElementById('shell-it-clipin').checked
          stdin += atom.clipboard.read()
        selout  = document.getElementById('shell-it-selout' ).checked
        clipout = document.getElementById('shell-it-clipout').checked
        @process projPath, input.value, stdin, selout, clipout
        @close()
        return false

  process: (cwd, cmd, stdin, selout, clipout) ->
    # console.log {cwd, cmd, stdin, selout, clipout}
    try
      stdout = exec cmd, {cwd, input: stdin, timeout: 5e3}
      stdout = stdout.toString()
    catch e
      console.log "shell-it: Exception:", util.inspect e, depth: null
      return
    if selout
      range = @editor.getSelectedBufferRange()
      @editor.setTextInBufferRange range, stdout
    if clipout
      atom.clipboard.write stdout
    
  close: ->
    if @panel
      @panel.destroy()
      atom.views.getView(@editor).focus()
    @panel = null
  
  deactivate: ->
    @close()
    @subs.dispose()
