
fs      = require 'fs'
util    = require 'util'
SubAtom = require 'sub-atom'
exec    = require('child_process').execSync
SelectList = require('atom-select-list')
{Disposable, CompositeDisposable, TextEditor} = require('atom')
etch = require('etch')
$ = etch.dom

class CheckBox {
  render () {
    return $.div(
      {className: this.props.className,
        type: "checkbox"},
      $.label(
        {for: this.props.mode},
        $.input(
          {id: this.props.mode},
          this.props.text
        )
      )
    )
  }
}

class ShellItView extends SelectList {
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

  render () {
    console.log("Panel should be up.")
    return $.div(
      {className: "shell-it-view"},
      $(CheckBox, {className: "checkbox left", mode: "clipin"}),
      $(CheckBox, {className: "checkbox left", mode: "selin"}),
      $(TextEditor, {ref: 'queryEditor', mini: true}),
      $(CheckBox, {className: "checkbox right", mode: "clipout"}),
      $(CheckBox, {className: "checkbox right", mode: "selout"}),
      this.renderLoadingMessage(),
      this.renderInfoMessage(),
      this.renderErrorMessage(),
      this.renderItems()
    )
  }
}

module.exports = {
  activate: function() {
    this.subs = new SubAtom;
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
    dialog = document.createElement("div");
    dialog.setAttribute('style', 'width:100%');
    dialog.innerHTML = "<div style=\"position:relative; display:inline-block; margin-right:10px;\">\n    <label  for=\"shell-it-clipin\">\n      <input id=\"shell-it-clipin\" type=\"checkbox\">\n      Clipboard\n    </label>\n  <br>\n    <label  for=\"shell-it-selin\">\n      <input id=\"shell-it-selin\" type=\"checkbox\" checked>\n      Selection\n    </label>\n</div>\n\n<div style=\"position:relative; top:-12px; display:inline-block; \">\n  <div style=\"position:relative; top:2px; display:inline-block; margin-right:10px;\n              font-size:14px; font-weight:bold\">\n    =&gt\n  </div>\n\n  <input id=\"shell-it-cmd\" class=\"native-key-bindings\"\n         placeholder=\"Enter shell command\"\n         style=\"width:240px; font-size:14px; display:inline-block\">\n\n  <div style=\"position:relative; margin-left:10px; display:inline-block;\n              font-size:14px; font-weight:bold\">\n    =&gt\n  </div>\n</div>\n\n<div style=\"position:relative; display:inline-block; margin-left:10px;'>\n    <label  for=\"shell-it-clipout\">\n      <input id=\"shell-it-clipout\" type=\"checkbox\">\n      Clipboard\n    </label>\n  <br>\n    <label  for=\"shell-it-selout\">\n    <input id=\"shell-it-selout\" type=\"checkbox\" checked>\n    Selection\n    </label>\n</div>";
    this.panel = new ShellItView({
      items: [],
      preserveLastCmd: true
    });
    console.log("Showing the panel.");
    return this.panel.show();
  },
  submit: function() {
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
      this.process(projPath, this.input.value, stdin, selout, clipout);
      return this.close();
    }
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
      this.newlineSub.dispose();
      atom.views.getView(this.editor).focus();
    }
    return this.panel = null;
  },
  deactivate: function() {
    this.close();
    return this.subs.dispose();
  }
};
