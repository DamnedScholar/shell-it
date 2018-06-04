/** @jsx etch.dom */
const fs      = require('fs')
const util    = require('util')
const exec    = require('child_process').execSync
const SelectList = require('atom-select-list')
const {Disposable, CompositeDisposable, TextEditor} = require('atom')
const etch = require('etch')
const $ = etch.dom

class CheckBox {
  constructor (props) {
    this.props = props
    etch.initialize(this)
  }

  update (props, children) {
    return etch.update(this)
  }

  render () {
    if (this.props.title == "Clipboard")
      this.icon = "clippy"
    else if (this.props.title == "Selection")
      this.icon = "file-code"
    else
      this.icon = "alert"

    return $.div(
      {className: this.props.className},
      $.label(
        {for: this.props.mode},
        $.input(
          {id: "shell-it-" + this.props.mode,
            type: "checkbox", checked: this.props.checked}
        ),
        $.i({className: "icon icon-" + this.icon})
      )
    )
  }
}

class ShellItView extends SelectList {
  constructor (props) {
    super(props)

    this.props = props
  }

  async show () {
    if (!this.panel) {
      this.panel = atom.workspace.addModalPanel({item: this})
    }

    if (!this.props.preserveLastCmd) {
      this.reset()
    } else {
      this.refs.queryEditor.selectAll()
    }

    this.activeElement = (document.activeElement === document.body) ? atom.views.getView(atom.workspace) : document.activeElement

    this.previouslyFocusedElement = document.activeElement
    this.panel.show()
    this.focus()

    console.log(this.props.state)
  }

  hide () {
    this.panel.hide()
    if (this.previouslyFocusedElement) {
      this.previouslyFocusedElement.focus()
      this.previouslyFocusedElement = null
    }
  }

  didClickItem (itemIndex) {
    this.selectIndex(itemIndex)
    const text = this.props.items[itemIndex]
    this.setQuery(text)
  }

  setQuery (text) {
    if (this.refs && this.refs.queryEditor) {
      this.refs.queryEditor.insertText(text)
      this.refs.queryEditor.selectAll()
    } else {
      console.log("shell-it Error: Could not find an editor element.")
    }
  }

  getSelectedItem () {
    if (this.selectionIndex === undefined) return null
    console.log("Index: " + this.selectionIndex + " Returning the selected item.")
    return this.items[this.selectionIndex]
  }

  confirmSelection () {
    const command = this.getQuery()
    console.log(command)
    if (command != null) {
      if (this.props.didConfirmSelection) {
        this.props.didConfirmSelection(command)
      }
    } else {
      if (this.props.didCancelSelection) {
        this.props.didCancelSelection()
      } else {
        this.hide()
      }
    }
  }

  cancelSelection () {
    this.hide()
  }

  render () {
    return $.div( {className: "shell-it-view"},
      $.div( {className: "query"},
        $.div( {className: "inputs check"},
          $(CheckBox, {className: "checkbox left", mode: "clipin",
                        title: "Clipboard", handleCheckbox: this.handleCheckbox,
                        checked: this.props.state.clipin}),
          $(CheckBox, {className: "checkbox left", mode: "selin",
                        title: "Selection", handleCheckbox: this.handleCheckbox,
                        checked: this.props.state.selin})
        ),
        $.div( {className: "inputs spacer"}, "->"),
        $.div( {className: "editor"},
          $(TextEditor, {ref: 'queryEditor', mini: true})
        ),
        $.div( {className: "outputs spacer"}, "<-"),
        $.div( {className: "outputs check"},
          $(CheckBox, {className: "checkbox right", mode: "clipout",
                        title: "Clipboard", handleCheckbox: this.handleCheckbox,
                        checked: this.props.state.clipout}),
          $(CheckBox, {className: "checkbox right", mode: "selout",
                        title: "Selection", handleCheckbox: this.handleCheckbox,
                        checked: this.props.state.selout})
        )
      ),
      this.renderLoadingMessage(),
      this.renderInfoMessage(),
      this.renderErrorMessage(),
      this.renderItems()
    )
  }
}

module.exports = {
  activate: function() {
    this.subs = new CompositeDisposable;
    this.subs.add(atom.commands.add('atom-workspace', {
      'shell-it:open': (function(_this) {
        return function() {
          return _this.open();
        };
      })(this)
    }));
    this.subs.add(atom.commands.add('atom-workspace', {
      'core:cancel': (function(_this) {
        return function() {
          return _this.panel.hide();
        };
      })(this)
    }));

    this.state = {clipin: false, selin: true, clipout: false, selout: true,
                  last: []}

    return this.lastCmd = "";
  },
  open: function() {
    var dialog;
    if (this.panel) {
      this.hide();
    }
    if (!(this.editor = atom.workspace.getActiveTextEditor())) {
      console.log('shell-it: Active Pane Is Not A Text Editor')
      return;
    }

    this.panel = new ShellItView({
      state: this.state,
      items: this.state.last,
      preserveLastCmd: true,
      elementForItem: (item, {index, selected, visible}) => {
        if (!visible) {
          return document.createElement("li")
        }

        const li = document.createElement('li')
        const icon = document.createElement('div')
        const text = document.createElement('span')
        li.classList.add('prev-command')
        icon.classList.add('left')
        text.classList.add('right')
        icon.innerHTML = "<i class='icon icon-chevron-right'>"
        text.innerText = item
        li.appendChild(icon)
        li.appendChild(text)

        return li
      },
      didConfirmSelection: (command) => {
        console.log("Confirmation received. Executing.")
        this.hide()

        var clipout, editorPath, i, len, projPath, ref, ref1, selout, stdin
        if (this.panel) {
          if ((editorPath = this.editor.getPath())) {
            ref = atom.project.getPaths()
            for (i = 0, len = ref.length; i < len; i++) {
              projPath = ref[i]
              if (editorPath.slice(0, projPath.length) === projPath) {
                break
              }
            }
          } else {
            projPath = (ref1 = atom.project.getPaths()[0]) != null ? ref1 : '/'
          }
          stdin = ''
          if (document.getElementById('shell-it-clipin').checked) {
            stdin += atom.clipboard.read()
            this.state.clipin = true
          }
          else
            this.state.clipin = false
          if (document.getElementById('shell-it-selin').checked) {
            stdin += this.editor.getSelectedText()
            this.state.selin = true
          }
          else
            this.state.selin = false
          if (document.getElementById('shell-it-clipout').checked)
            this.state.clipout = true
          else
            this.state.clipout = false
          if (document.getElementById('shell-it-selout').checked)
            this.state.selout = true
          else
            this.state.selout = false

          process = (cwd, command, stdin, selout, clipout) => {
            var e, range, stdout
            try {
              stdout = exec(command, {
                cwd: cwd,
                input: stdin,
                timeout: 5e3
              })
              this.state.last = this.state.last.filter(entry => entry != command)
              stdout = stdout.toString()
              atom.notifications.addSuccess("Command `" + command + "` run successfully.")
              console.log(stdout)
            } catch (error) {
              e = error
              atom.notifications.addError(e.toString())
              return
            }
            if (selout) {
              range = this.editor.getSelectedBufferRange()
              this.editor.setTextInBufferRange(range, stdout)
            }
            if (clipout) {
              return atom.clipboard.write(stdout)
            }
          }
          process(projPath, command, stdin, this.state.selout, this.state.clipout)

          this.state.last.unshift(command)
        }
      }
    })
    return this.panel.show()
  },
  hide: function() {
    this.panel.hide()
    if (this.previouslyFocusedElement) {
      this.previouslyFocusedElement.focus()
      this.previouslyFocusedElement = null
    }
  },
  deactivate: function() {
    this.hide()
    return this.subs.dispose()
  }
}
