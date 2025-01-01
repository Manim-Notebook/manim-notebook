import { window, commands, Uri } from "vscode";

import { describe, it } from "mocha";
import * as sinon from "sinon";

import { onTerminalOutput } from "../src/utils/terminal";
import { uriRelative } from "./utils/testRunner";
import { goToLine } from "./utils/editor";

describe("Previewing", function () {
  it.only("Can preview the current Manim Cell", async () => {
    const editor = await window.showTextDocument(uriRelative("basic.py"));
    goToLine(editor, 11);
    await commands.executeCommand("manim-notebook.previewManimCell");

    onTerminalOutput(window.activeTerminal!, (data) => {
      console.log("🙈 received");
      console.log(data);
    });

    return new Promise(resolve => setTimeout(resolve, 40000));
  });
});
