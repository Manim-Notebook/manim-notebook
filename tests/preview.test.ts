import { window, commands } from "vscode";
import { describe, it, before } from "mocha";
import { onAnyTerminalOutput } from "./utils/terminal";
import { uriInWorkspace } from "./utils/testRunner";
import { goToLine } from "./utils/editor";
let expect: Chai.ExpectStatic;

before(async () => {
  // why this weird import syntax?
  // -> see https://github.com/microsoft/vscode/issues/130367
  const chai = await import("chai");
  expect = chai.expect;
});

describe("Previewing", function () {
  it("Can preview the current Manim Cell", async () => {
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

  it.only("Can preview laggy scene", async () => {
    const editor = await window.showTextDocument(uriInWorkspace("laggy.py"));
    const queue: { line: number; waitForStrings: string[]; resolve: () => void }[] = [];
    let wantToStopListening = false;

    onAnyTerminalOutput(async (data, stopListening) => {
      if (wantToStopListening) {
        stopListening();
        return;
      }
      if (queue.length === 0) {
        throw new Error("Listening to terminal output, but nothing in queue to check against");
      }

      const { waitForStrings } = queue[0];
      for (const str of waitForStrings) {
        if (data.includes(str)) {
          waitForStrings.removeByValue(str);
        }
      }
      if (waitForStrings.length === 0) {
        queue.shift()?.resolve();
      }
    });

    async function testPreviewAtLine(line: number, waitForStrings: string[]) {
      goToLine(editor, line);
      await commands.executeCommand("manim-notebook.previewManimCell");
      await new Promise<void>((resolve) => {
        queue.push({ line, waitForStrings, resolve });
      });
    }

    await testPreviewAtLine(8, ["ShowCreationVGroup", "In [2]:"]);
    await testPreviewAtLine(14, ["_MethodAnimationValueTracker", "In [3]:"]);
    await testPreviewAtLine(21, ["_MethodAnimationValueTracker", "In [4]:"]);
    await testPreviewAtLine(14, ["_MethodAnimationValueTracker", "In [5]:"]);

    wantToStopListening = true; // cleanup for subsequent tests
    expect(queue.length).to.equal(0);

    await commands.executeCommand("manim-notebook.exitScene");
    await new Promise(resolve => setTimeout(resolve, 1000));
  });
});
