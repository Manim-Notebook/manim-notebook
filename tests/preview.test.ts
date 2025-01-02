import { window, commands } from "vscode";
import { describe, it } from "mocha";
import { onAnyTerminalOutput } from "./utils/terminal";
import { uriRelative } from "./utils/testRunner";
import { goToLine } from "./utils/editor";

describe("Previewing", function () {
  it("Can preview the current Manim Cell", async () => {
    const editor = await window.showTextDocument(uriRelative("basic.py"));
    goToLine(editor, 11);
    await commands.executeCommand("manim-notebook.previewManimCell");

    return new Promise((resolve) => {
      onAnyTerminalOutput((data) => {
        if (data.includes("ReplacementTransformCircle")) {
          resolve();
        }
      });
    });
  });
});
