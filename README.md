# shell-it package

A simple Atom package to replace text in the editor by passing it through a shell command.  It is in the vein of `%!` in VIM or `shell-command-on-region` in Emacs.

![untitled screencast 15](https://cloud.githubusercontent.com/assets/811455/12214409/ddafdf94-b647-11e5-8a28-02c88d5a1446.gif)

### Usage

- If you want input, you first have to select or copy text. If you don't need input, the cursor merely needs to be placed inside a TextEditor.
- Execute `shell-it:open` (default keybinding is `shift-ctrl-alt-S`).
- Type in a shell command (such as `sort`).
- Select which input and output streams you want.
- Hit enter.
- The command will be executed in an OS shell and the results will be inserted into the clipboard and/or selection.

### Stdin and Stdout

- The left checkboxes specify stdin from the selected text and/or the clipboard.  If both are checked the clipboard and selection are concatenated for the input.

- The right checkboxes specify where stdout is sent.  If both are checked then the output goes to both the clipboard and the selection.

- The working directory is set to the project containing the current editor

### Changelog
* 0.4.0 - Rewrote the entire view as an `etch` component and added a limited history function.

### License
This package is covered by the MIT license. The original code was written by Mark-Hahn, with updates and rewrites by DamnedScholar.
