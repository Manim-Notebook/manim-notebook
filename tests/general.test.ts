import * as vscode from "vscode";
import { window, commands } from "vscode";

import { describe, it } from "mocha";
import * as sinon from "sinon";

// eslint-disable-next-line no-unused-vars
import * as manimNotebook from "@src/extension";
// import { onTerminalOutput } from "../src/utils/terminal";

const ANSI_CONTROL_SEQUENCE_REGEX = /(?:\x1B[@-Z\\-_]|[\x80-\x9A\x9C-\x9F]|(?:\x1B\[|\x9B)[0-?]*[ -/]*[@-~])/g;

async function* withoutAnsiCodes(stream: AsyncIterable<string>): AsyncIterable<string> {
  for await (const data of stream) {
    yield data.replace(ANSI_CONTROL_SEQUENCE_REGEX, "");
  }
}

function onTerminalOutput(
  callback: (_data: string) => void, withoutAnsi = true) {
  window.onDidStartTerminalShellExecution(
    async (event: vscode.TerminalShellExecutionStartEvent) => {
      let stream = event.execution.read();
      if (withoutAnsi) {
        stream = withoutAnsiCodes(stream);
      }

      for await (const data of stream) {
        callback(data);
      }
    });
}

describe("Manim Installation", function () {
  it.only("Dummy terminal test", () => {
    // any Manim Notebook command to trigger the activation
    commands.executeCommand("manim-notebook.openWalkthrough");

    return new Promise<void>((resolve) => {
      onTerminalOutput((data) => {
        console.log(data);
        resolve();
      });
      setTimeout(() => {
        const terminal = window.createTerminal("Dummy terminal");
        terminal.show();
        terminal.sendText("manimgl --version");
      }, 7000);
    });
  });

  it("Detects Manim version", async () => {
    const spy = sinon.spy(window, "showInformationMessage");
    await commands.executeCommand("manim-notebook.redetectManimVersion");
    sinon.assert.called(spy);
    sinon.assert.calledWith(spy, sinon.match(/v\d+\.\d+\.\d+/));
  });
});
