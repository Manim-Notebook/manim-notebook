import * as vscode from "vscode";
import { window } from "vscode";
import { withoutAnsiCodes } from "../../src/utils/terminal";

/**
 * Registers a callback to read the stdout from the terminal. The callback is
 * invoked whenever any terminal emits output. The output is cleaned from
 * ANSI control codes by default.
 *
 * This function should only be called once in every test it() block at the
 * beginning. Otherwise, subsequent calls might not yield the expected results.
 *
 * @param callback The callback to invoke when output is emitted.
 * @param shouldLog Whether to log the terminal output to the console.
 * @param withoutAnsi Whether to clean the output from ANSI control codes.
 */
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
