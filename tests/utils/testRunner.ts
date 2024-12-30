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

import * as vscode from "vscode";

import * as path from "path";
import Mocha from "mocha";
import { globSync } from "glob";
import "source-map-support/register";
import { window, Terminal, TerminalShellExecution } from "vscode";

// import * as manimNotebook from "../../src/extension";

// import { ManimInstaller } from "./manimInstaller";
// import { ManimCaller } from "./manimCaller";
// const MANIM_INSTALLER = new ManimInstaller();
// export const manimCaller = new ManimCaller();

export function run(): Promise<void> {
  const mocha = new Mocha({
    ui: "tdd",
    timeout: 10000,
  });

  return new Promise(async (resolve, reject) => {
    try {
      // WEe need some time to install Manim first. Afterwards, the tests
      // themselves will activate the extension
      // (I haven't found a way to NOT let VSCode activate the extension
      // automatically before we are done here expect this way)
      // Hook into the extension's activation event
      // const activateOrig = manimNotebook.activate;
      // const newActivate = async (context: vscode.ExtensionContext) => {
      //   console.log("IN ACTIVATION");
      //   extensionContext = context;
      //   // then do nothing, will activate later manually
      //   // await activateOrig(context);
      // };
      // (manimNotebook as any).activate = newActivate;

      const testsRoot = path.resolve(__dirname, "..");

      // Install Manim
      // await MANIM_INSTALLER.setup(testsRoot);
      // await MANIM_INSTALLER.download();
      // await MANIM_INSTALLER.install();
      // manimCaller.venvPath = MANIM_INSTALLER.venvPath;
      // const activatePath =
      // path.join(MANIM_INSTALLER.venvPath, "bin", "activate");
      // injectVSCodeTerminal`. ${activatePath}`);

      // Activate Manim Notebook
      // console.log("🚀 Activating Manim Notebook");
      // const extension =
      // vscode.extensions.getExtension("Manim-Notebook.manim-notebook");
      // if (!extension) {
      //   throw new Error("Could not find Manim Notebook extension.");
      // }
      // await extension.activate();

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
      return sendTextOrig.call(terminal, `${sourceCommand} && ${text}`, shouldExecute);
    };

    // Inject shellIntegration.executeCommand()
    window.onDidChangeTerminalShellIntegration((event) => {
      if (event.terminal !== terminal) {
        return;
      }
      const shellIntegration = event.shellIntegration;
      // only stub executeCommand(commandLine: string) method, not
      // the executeCommand(executable: string, args: string[]) method
      const executeCommandOrig = shellIntegration.executeCommand as
      (_commandLine: string) => TerminalShellExecution;
      shellIntegration.executeCommand = (commandLine: string): TerminalShellExecution => {
        return executeCommandOrig.call(shellIntegration, `${sourceCommand} && ${commandLine}`);
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
