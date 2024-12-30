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
import { window, Terminal, TerminalShellExecution } from "vscode";

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
      injectVSCodeTerminal(`. ${activatePath}`);

      const files: string[] = globSync("**/**.test.js",
        { cwd: testsRoot, ignore: ["**/node_modules/**"] });

      files.forEach(f => mocha.addFile(path.resolve(testsRoot, f)));

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

/**
 * Injects the VSCode terminal such that every command is prefixed with the
 * source command to activate the Python virtual environment.
 */
function injectVSCodeTerminal(sourceCommand: string) {
  const createTerminalOrig = window.createTerminal;
  window.createTerminal = (args: any): Terminal => {
    const terminal = createTerminalOrig(args);

    // Inject sendText()
    const sendTextOrig = terminal.sendText;
    terminal.sendText = (text: string, shouldExecute?: boolean): void => {
      return sendTextOrig(`${sourceCommand} && ${text}`, shouldExecute);
    };

    // Inject shellIntegration.executeCommand()
    window.onDidChangeTerminalShellIntegration((event) => {
      if (event.terminal !== terminal) {
        return;
      }
      const shellIntegration = event.shellIntegration;
      const executeCommandOrig = shellIntegration.executeCommand;
      shellIntegration.executeCommand = (commandLine: string): TerminalShellExecution => {
        return executeCommandOrig(`${sourceCommand} && ${commandLine}`);
      };

      // Overwrite the readonly shellIntegration property of the terminal
      Object.defineProperty(terminal, "shellIntegration", {
        value: shellIntegration,
        writable: false,
      });
    });

    return terminal;
  };
}
