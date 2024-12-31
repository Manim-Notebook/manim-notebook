import { window, commands } from "vscode";

import { describe, it } from "mocha";
import * as sinon from "sinon";

// eslint-disable-next-line no-unused-vars
import * as manimNotebook from "@src/extension";
import { onTerminalOutput } from "../src/utils/terminal";

describe("Manim Installation", function () {
  it.only("Dummy terminal test", async () => {
    const terminal = window.createTerminal("Dummy terminal");
    terminal.show();
    return new Promise((resolve) => {
      onTerminalOutput(terminal, (data) => {
        console.log(data);
        resolve();
      });
      terminal.sendText("echo 'Hello, world!'");
    });
  });

  it("Detects Manim version", async () => {
    const spy = sinon.spy(window, "showInformationMessage");
    await commands.executeCommand("manim-notebook.redetectManimVersion");
    sinon.assert.called(spy);
    sinon.assert.calledWith(spy, sinon.match(/v\d+\.\d+\.\d+/));
  });
});
