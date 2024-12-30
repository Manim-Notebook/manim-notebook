/**
 * Test runner script that programmatically runs the test suite using Mocha.
 * Also see the Mocha API: https://mochajs.org/api/mocha
 *
 * Adapted from the VSCode testing extension guide [1].
 * File on Github: [2].
 *
 * [1] https://code.visualstudio.com/api/working-with-extensions/testing-extension#advanced-setup-your-own-runner
 * [2] https://github.com/microsoft/vscode-extension-samples/blob/main/helloworld-test-sample/src/test/suite/index.ts
 */

import * as path from "path";
import Mocha from "mocha";
import { globSync } from "glob";
import "source-map-support/register";
import * as vscode from "vscode";
import { Terminal } from "vscode";
import { window } from "vscode";

import { ManimInstaller } from "./manimInstaller";
import { ManimCaller } from "./manimCaller";
const MANIM_INSTALLER = new ManimInstaller();
export const manimCaller = new ManimCaller();

export function run(): Promise<void> {
  const mocha = new Mocha({
    ui: "tdd",
  });

  return new Promise(async (resolve, reject) => {
    try {
      const testsRoot = path.resolve(__dirname, "..");

      await MANIM_INSTALLER.setup(testsRoot);
      await MANIM_INSTALLER.download();
      await MANIM_INSTALLER.install();
      manimCaller.venvPath = MANIM_INSTALLER.venvPath;
      const activatePath = path.join(MANIM_INSTALLER.venvPath, "bin", "activate");
      const sourceCommand = `. ${activatePath}`;

      const files: string[] = globSync("**/**.test.js",
        { cwd: testsRoot, ignore: ["**/node_modules/**"] });

      files.forEach(f => mocha.addFile(path.resolve(testsRoot, f)));

      // Inject the VSCode terminal
      const createTerminalOrig = vscode.window.createTerminal;
      vscode.window.createTerminal = (args: any): vscode.Terminal => {
        const terminal = createTerminalOrig(args);

        // Inject sendText()
        const sendTextOrig = terminal.sendText;
        terminal.sendText = (text: string, addNewLine?: boolean) => {
          sendTextOrig.call(terminal, `${sourceCommand} && ${text}`, addNewLine);
        };

        // Inject shellIntegration -> executeCommand()
        window.onDidChangeTerminalShellIntegration((event) => {
          if (event.terminal !== terminal) {
            return;
          }
          const shellIntegration: vscode.TerminalShellIntegration = event.shellIntegration;
          shellIntegration.executeCommand = (commandLine: string):
          vscode.TerminalShellExecution => {
            return shellIntegration.executeCommand(`${sourceCommand} && ${commandLine}`);
          };

          // overwrite the readonly shellIntegration property of the terminal
          Object.defineProperty(terminal, "shellIntegration", {
            value: shellIntegration,
            writable: false,
          });
        });

        return terminal;
      };

      // Prepend echo "Hello world" to every terminal call
      const originalExec = require("child_process").exec;
      require("child_process").exec = function (command: string, ...args: any[]) {
        return originalExec(`echo "Hello world" && ${command}`, ...args);
      };

      mocha.run((failures: any) => {
        if (failures > 0) {
          reject(new Error(`${failures} tests failed.`));
        } else {
          resolve();
        }
      });
    } catch (err) {
      console.error(err);
      reject(err);
    }
  });
}
