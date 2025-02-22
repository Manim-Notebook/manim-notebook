import * as fs from "fs";
import path from "path";
import { exec } from "child_process";

import { Logger, Window } from "../logger";

import * as vscode from "vscode";
import { ExtensionContext } from "vscode";

const PATCH_INFO_URL = "https://github.com/Manim-Notebook/manim-notebook/wiki/%F0%9F%A4%A2-Troubleshooting#windows-paste-patch";

/**
 * Applies the Windows paste patch to the user's Python environment such that
 * cell execution in IPython works correctly on Windows.
 *
 * More information in the troubleshooting wiki:
 * https://github.com/Manim-Notebook/manim-notebook/wiki/%F0%9F%A4%A2-Troubleshooting#windows-paste-patch
 *
 * @param context The extension context.
 * @param pythonBinary The path to the Python binary.
 */
export async function applyWindowsPastePatch(
  context: ExtensionContext, pythonBinary: string,
) {
  const pathToPatch = path.join(context.extensionPath,
    "src", "patches", "install_windows_paste_patch.py");
  const patch = fs.readFileSync(pathToPatch, "utf-8");
  // we encode/decode as base64 to avoid nasty errors when escaping manually
  const encodedPatch = Buffer.from(patch, "utf-8").toString("base64");
  const patchCommand = `${pythonBinary} -c "import base64;`
    + ` exec(base64.b64decode('${encodedPatch}').decode('utf-8'))"`;

  const timeoutPromise = new Promise<boolean>((resolve, _reject) => {
    setTimeout(() => {
      Logger.debug("Windows Paste Patch Terminal: timed out");
      resolve(false);
    }, 4000);
  });

  try {
    const patchApplied = await Promise.race(
      [execPatchAndCheckForSuccess(patchCommand), timeoutPromise],
    );
    if (patchApplied) {
      Logger.info("Windows paste patch successfully applied (in applyPatches.ts)");
      return;
    }

    const action = "Learn more";
    const selected = await Window.showErrorMessage(
      "Windows paste patch could not be applied. "
      + "Manim Notebook will likely not function correctly for you. "
      + "Please check the wiki for more information and report the issue.",
      action);
    if (selected === action) {
      vscode.env.openExternal(vscode.Uri.parse(PATCH_INFO_URL));
    }
  } catch (err) {
    Logger.error(`Abnormal termination while applying windows paste patch: ${err}`);
  }
}

/**
 * Executes the given command as child process. We listen to the output and
 * look for the message that indicates that the Windows paste patch was
 * successfully applied.
 *
 * @param command The command to execute in the shell (via Node.js `exec`).
 * @returns A promise that resolves to true if the patch was successfully
 * applied, and false otherwise. Might never resolve, so the caller should
 * let this promise race with a timeout promise.
 */
async function execPatchAndCheckForSuccess(command: string): Promise<boolean> {
  return new Promise<boolean>(async (resolve, _reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        Logger.error(`Windows Paste Patch Exec. error: ${error.message}`);
        resolve(false);
        return;
      }
      if (stderr) {
        Logger.error(`Windows Paste Patch Exec. stderr: ${stderr}`);
        resolve(false);
        return;
      }

      Logger.trace(`Windows Paste Patch Exec. stdout: ${stdout}`);
      const isSuccess = stdout.includes("42000043ManimNotebook31415");
      resolve(isSuccess);
    });
  });
}
