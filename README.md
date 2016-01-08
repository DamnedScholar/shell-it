# shell-it package

A simple Atom package to replace text in the editor by passing it through a shell command.  It is in the vein of `%!` in VIM.

![untitled screencast 14](https://cloud.githubusercontent.com/assets/811455/12188291/aa60f46e-b568-11e5-84bc-277e30f9c0bd.gif)

### Usage
- select text
- execute `shell-it:open` (default keybinding is `shift-ctrl-alt-S`)
- type in shell cmd (such as `sort`).
- hit enter

Command will be executed in an OS shell with the selected text as stdin. That selected text will be replaced with the command's stdout.

If you want to operate on the entire buffer then do select-all first.

### License
Copyright Mark-Hahn with the MIT license.
