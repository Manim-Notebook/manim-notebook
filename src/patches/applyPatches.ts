import * as fs from "fs";
import path from "path";
import { onTerminalOutput } from "../utils/terminal";
import { Logger, Window } from "../logger";

import * as vscode from "vscode";
import { ExtensionContext, window, ThemeIcon, Terminal } from "vscode";

const PATCH_INFO_URL = "https://github.com/Manim-Notebook/manim-notebook/wiki/%F0%9F%A4%A2-Troubleshooting#windows-paste-patch";

export async function applyWindowsRecognizePastePatch(
  context: ExtensionContext, python3Path: string | undefined,
) {
  const pathToPatch = path.join(context.extensionPath,
    "src", "patches", "install_windows_paste_patch.py");
  let patch = fs.readFileSync(pathToPatch, "utf-8");

  patch = patch.replace(/"/g, '\\"');
  patch = patch.replace(/'/g, "\\'");
  patch = patch.replace(/\n/g, "\\n");

  const python3 = python3Path || "python3";
  const patchCommand = `${python3} -c "exec('''${patch}''')"`;

  const terminal = await window.createTerminal({
    name: "Win Patch",
    iconPath: new ThemeIcon("symbol-property"),
  });

  const timeoutPromise = new Promise<boolean>((resolve, _reject) => {
    setTimeout(() => {
      Logger.debug("Windows Paste Patch Terminal: timed out");
      resolve(false);
    }, 4000);
  });

  await Promise
    .race([lookForPatchSuccessfullyAppliedMessage(terminal, patchCommand), timeoutPromise])
    .then(async (patchApplied) => {
      if (patchApplied) {
        Logger.info("Windows paste patch successfully applied");
        return;
      }

      const action = "Learn more";
      const selected = await Window.showErrorMessage(
        "Could not apply Windows paste patch. "
        + "Please check the wiki for more information.",
        action);
      if (selected === action) {
        vscode.env.openExternal(vscode.Uri.parse(PATCH_INFO_URL));
      }
    }).catch((err) => {
      Logger.error(
        `Abnormal termination while applying windows paste patch: ${err}`);
    });
}

async function lookForPatchSuccessfullyAppliedMessage(
  terminal: Terminal, command: string): Promise<boolean> {
  return new Promise<boolean>(async (resolve, _reject) => {
    onTerminalOutput(terminal, (data: string) => {
      const success = data.includes("Manim Notebook: Windows paste patch applied");
      if (!success) {
        return;
      }
      terminal.dispose();
      resolve(true);
    });

    window.onDidEndTerminalShellExecution((event) => {
      if (event.terminal !== terminal) {
        return;
      }
      if (event.exitCode !== 0) {
        Logger.error("Windows Paste Patch Terminal: shell exited with error code");
        resolve(false);
      }
    });

    terminal.sendText(command);
  });
}
