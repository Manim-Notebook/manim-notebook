import { window, Terminal, TerminalShellExecution } from "vscode";
import * as path from "path";

export function setupTestEnvironment() {
  const basePath = process.env.TEST_BASE_PATH;
  if (!basePath) {
    throw new Error("TEST_BASE_PATH not set, although in testing environment.");
  }
  const binFolderName = process.platform === "win32" ? "Scripts" : "bin";
  const binPath = path.join(basePath, "tmp", "manimVenv", binFolderName);
  injectVSCodeTerminalForPythonVenv(binPath);
}

/**
 * Injects the VSCode terminal such that every command sent to it is prefixed
 * with a given path.
 *
 * This is useful in a testing environment where we want to run commands in a
 * virtual Python environment without actually installing the Python extension
 * that would source the virtual environment for us.
 *
 * @param binPath The path to the bin folder of the virtual Python environment.
 * This path will be prefixed to every command sent to the terminal, e.g.
 * `manimgl --version` becomes
 * `/path/to/venv/bin/manimgl --version`.
 */
function injectVSCodeTerminalForPythonVenv(binPath: string) {
  const createTerminalOrig = window.createTerminal;
  window.createTerminal = (args: any): Terminal => {
    const terminal = createTerminalOrig(args);

    // Inject sendText()
    const sendTextOrig = terminal.sendText;
    terminal.sendText = (text: string, shouldExecute?: boolean): void => {
      return sendTextOrig.call(terminal, path.join(binPath, text), shouldExecute);
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
        return executeCommandOrig.call(shellIntegration, path.join(binPath, commandLine));
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
