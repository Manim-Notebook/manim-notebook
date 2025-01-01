import { window, commands, extensions } from "vscode";

import { describe, it } from "mocha";
import * as sinon from "sinon";

// eslint-disable-next-line no-unused-vars
import * as manimNotebook from "@src/extension";
import { onTerminalOutput } from "../src/utils/terminal";

const MANIM_VERSION_STRING_REGEX = /v\d+\.\d+\.\d+/;

describe("Manim Installation", function () {
  it("Can read from terminal", async () => {
    const extension = extensions.getExtension("Manim-Notebook.manim-notebook");
    if (!extension) {
      throw new Error("Manim Notebook extension not found");
    }
    await extension.activate();

    console.log("🎈 Creating terminal");
    const terminal = window.createTerminal("Dummy terminal");
    terminal.show();

    return new Promise((resolve) => {
      onTerminalOutput(terminal, (data) => {
        console.log(data);
        if (MANIM_VERSION_STRING_REGEX.test(data)) {
          resolve();
        }
      });
      terminal.sendText("manimgl --version");
    });
  });

  it("Detects Manim version", async () => {
    // TODO: Test different Manim versions installed
    const spy = sinon.spy(window, "showInformationMessage");
    await commands.executeCommand("manim-notebook.redetectManimVersion");
    sinon.assert.called(spy);
    sinon.assert.calledWith(spy, sinon.match(MANIM_VERSION_STRING_REGEX));
  });
});
