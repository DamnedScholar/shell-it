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
    if (this.props.text == "Clipboard")
      this.icon = "clippy"
    else if (this.props.text == "Selection")
      this.icon = "code-file"
    else
      this.icon = "alert"

    return $.div(
      {className: this.props.className},
      $.label(
        {for: this.props.mode},
        $.input(
          {id: "shell-it-" + this.props.mode,
            type: "checkbox", checked: this.props.checked,
            onChange: this.props.ShellItView.handleCheckbox}
        ),
        $.i({className: "icon icon-" + this.icon})
      )
    )
  }
}

class ShellItView extends SelectList {
  constructor (props) {
    // To spawn a select list, we need to emulate some of the props
    // it expects.
    props.didConfirmSelection = (keyBinding) => {
      this.hide()
      const event = new CustomEvent(keyBinding.name, {bubbles: true, cancelable: true})
      this.activeElement.dispatchEvent(event)
    }

    props.didCancelSelection =  () => {
      this.hide()
    }

    super(props)
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
  }

  hide () {
    this.panel.hide()
    if (this.previouslyFocusedElement) {
      this.previouslyFocusedElement.focus()
      this.previouslyFocusedElement = null
    }
  }

  handleCheckbox (evt) {
    this.state[evt.target.id] = evt.target.checked

    console.log(evt.target.id + " set to " + evt.target.checked)
  }

  render () {
    console.log("Panel should be up.")
    console.log(new CheckBox({className: "checkbox left", mode: "clipin", text: "test"}))
    return $.div(
      {className: "shell-it-view",
       style: "display: flex; flex-direction: row; align-items: center;"},
      $.div(
        {className: "inputs",
         style: "display: flex; flex-direction: column"},
        $(CheckBox, {className: "checkbox left", mode: "clipin",
                     title: "Clipboard", ShellItView: this}),
        $(CheckBox, {className: "checkbox left", mode: "selin",
                     title: "Selection", ShellItView: this})
      ),
      $.div( {className: "inputs spacer",
              style: "flex-basis: 10px;"}, "->"),
      $.div( {style: "flex-grow: 1;"},
        $(TextEditor, {ref: 'queryEditor', mini: true}),
        // $.div( {},
        //   $.i({className: "icon icon-chevron-left"}),
        //   $.i({className: "icon icon-chevron-right"})
        // )
      ),
      $.div( {className: "outputs spacer",
              style: "flex-basis: 10px;"}, "<-"),
      $.div(
        {className: "outputs",
         style: "display: flex; flex-direction: column"},
        $(CheckBox, {className: "checkbox right", mode: "clipout",
                     title: "Clipboard", ShellItView: this}),
        $(CheckBox, {className: "checkbox right", mode: "selout",
                     title: "Selection", ShellItView: this})
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
      'core:confirm': (function(_this) {
        return function() {
          return _this.submit();
        };
      })(this)
    }));
    this.subs.add(atom.commands.add('atom-workspace', {
      'core:cancel': (function(_this) {
        return function() {
          return _this.close();
        };
      })(this)
    }));

    this.state = {clipin: 0, selin: 1, clipout: 0, selout: 1, last: []}

    return this.lastCmd = "";
  },
  open: function() {
    var dialog;
    if (this.panel) {
      this.close();
    }
    if (!(this.editor = atom.workspace.getActiveTextEditor())) {
      console.log('shell-it: Active Pane Is Not A Text Editor');
      return;
    }

    this.panel = new ShellItView({
      items: this.state.last,
      preserveLastCmd: true,
      elementForItem: (item, {index, selected, visible}) => {
        // TBD
      },
      didConfirmSelection: (keyBinding) => {
        this.hide()
        const event = new CustomEvent(keyBinding.name, {bubbles: true, cancelable: true})
        this.activeElement.dispatchEvent(event)

        var value = this.activeElement.value

        var clipout, editorPath, i, len, projPath, ref, ref1, selout, stdin;
        if (this.panel) {
          if ((editorPath = this.editor.getPath())) {
            ref = atom.project.getPaths();
            for (i = 0, len = ref.length; i < len; i++) {
              projPath = ref[i];
              if (editorPath.slice(0, projPath.length) === projPath) {
                break;
              }
            }
          } else {
            projPath = (ref1 = atom.project.getPaths()[0]) != null ? ref1 : '/';
          }
          stdin = '';
          if (document.getElementById('shell-it-clipin').checked) {
            stdin += atom.clipboard.read();
          }
          if (document.getElementById('shell-it-selin').checked) {
            stdin += this.editor.getSelectedText();
          }
          selout = document.getElementById('shell-it-selout').checked;
          clipout = document.getElementById('shell-it-clipout').checked;

          process = (projPath, value, stdin, selout, clipout) => {
            var e, range, stdout;
            try {
              stdout = exec(cmd, {
                cwd: cwd,
                input: stdin,
                timeout: 5e3
              });
              stdout = stdout.toString();
            } catch (error) {
              e = error;
              atom.confirm({
                message: 'Exception:',
                detailedMessage: e.stderr.toString(),
                buttons: {
                  Close: (function(_this) {
                    return function() {
                      return _this.close();
                    };
                  })(this)
                }
              });
              return;
            }
            if (selout) {
              range = this.editor.getSelectedBufferRange();
              this.editor.setTextInBufferRange(range, stdout);
            }
            if (clipout) {
              return atom.clipboard.write(stdout);
            }
          }
          process(projPath, value, stdin, selout, clipout)
          console.log([projPath, value, stdin, selout, clipout])
        }
      },
      didCancelSelection: () => {
        this.hide()
      }
    });
    console.log("Showing the panel.");
    return this.panel.show();
  },
  submit: function() {

  },
  process: function(cwd, cmd, stdin, selout, clipout) {
    var e, range, stdout;
    try {
      stdout = exec(cmd, {
        cwd: cwd,
        input: stdin,
        timeout: 5e3
      });
      stdout = stdout.toString();
    } catch (error) {
      e = error;
      atom.confirm({
        message: 'Exception:',
        detailedMessage: e.stderr.toString(),
        buttons: {
          Close: (function(_this) {
            return function() {
              return _this.close();
            };
          })(this)
        }
      });
      return;
    }
    if (selout) {
      range = this.editor.getSelectedBufferRange();
      this.editor.setTextInBufferRange(range, stdout);
    }
    if (clipout) {
      return atom.clipboard.write(stdout);
    }
  },
  close: function() {
    if (this.panel) {
      this.panel.destroy();
      atom.views.getView(this.editor).focus();
    }
    return this.panel = null;
  },
  deactivate: function() {
    this.close();
    return this.subs.dispose();
  }
};
