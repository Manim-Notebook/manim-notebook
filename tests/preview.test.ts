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
      onAnyTerminalOutput(async (data, stopListening) => {
        if (data.includes("ReplacementTransformCircle")) {
          stopListening();
          await commands.executeCommand("manim-notebook.exitScene");
          setTimeout(resolve, 1500);
        }
      });
    });
  });

  it("Can preview laggy scene", async () => {
    const editor = await window.showTextDocument(uriInWorkspace("laggy.py"));
    goToLine(editor, 8);
    await commands.executeCommand("manim-notebook.previewManimCell");

    return new Promise((resolve) => {
      onAnyTerminalOutput(async (data, stopListening) => {
        if (data.includes("ShowCreationVGroup")) {
          stopListening();
          await commands.executeCommand("manim-notebook.exitScene");
          setTimeout(resolve, 1500);
        }
      });
    });
  });
});
