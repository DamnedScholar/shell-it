
fs      = require 'fs'
SubAtom = require 'sub-atom'

module.exports =
  @subs = new SubAtom
  activate: ->
    @sub = atom.commands.add 'atom-workspace', 'shell-it:open': => @open()

  open: ->
    console.log window.prompt "Enter shell command"

  deactivate: ->
    @sub.dispose()
