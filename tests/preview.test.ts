import { window, commands } from "vscode";
import { describe, it } from "mocha";
import { onAnyTerminalOutput } from "./utils/terminal";
import { uriInWorkspace } from "./utils/testRunner";
import { goToLine } from "./utils/editor";

describe("Previewing", function () {
  it("Can preview the current Manim Cell", async () => {
    const editor = await window.showTextDocument(uriInWorkspace("basic.py"));
    goToLine(editor, 11);
    await commands.executeCommand("manim-notebook.previewManimCell");

    return new Promise((resolve) => {
      onAnyTerminalOutput((data, stopListening) => {
        if (data.includes("ReplacementTransformCircle")) {
          stopListening();
          resolve();
        }
      });
    });
  });
});
