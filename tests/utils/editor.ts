import { TextEditor, Selection } from "vscode";

/**
 * Moves the cursor to the specified line number in the given editor.
 *
 * Adapted from:
 * https://github.com/microsoft/vscode/issues/6695#issuecomment-221146568
 */
export function goToLine(editor: TextEditor, lineNumber: number) {
  let range = editor.document.lineAt(lineNumber - 1).range;
  editor.selection = new Selection(range.start, range.end);
  editor.revealRange(range);
}
