import * as vscode from "vscode";
import { window } from "vscode";
import { withoutAnsiCodes } from "../../src/utils/terminal";

export function onAnyTerminalOutput(
  callback: (_data: string, _stopListening: CallableFunction) => void,
  shouldLog = true,
  withoutAnsi = true): void {
  const listener = window.onDidStartTerminalShellExecution(
    async (event: vscode.TerminalShellExecutionStartEvent) => {
      let stream = event.execution.read();
      if (withoutAnsi) {
        stream = withoutAnsiCodes(stream);
      }

      const stopListening = () => {
        shouldLog = false;
        listener.dispose();
      };

      for await (const data of stream) {
        if (shouldLog) {
          console.log(`Terminal output: ${data}`);
        }
        callback(data, stopListening);
      }
    });
}
