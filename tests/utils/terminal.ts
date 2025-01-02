import * as vscode from "vscode";
import { window } from "vscode";
import { withoutAnsiCodes } from "../../src/utils/terminal";

export async function onAnyTerminalOutput(
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
