import * as fs from "fs";
import path from "path";
import { waitNewTerminalDelay } from "../utils/terminal";

import { ExtensionContext, window, ThemeIcon } from "vscode";

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
  const pythonCommand = `${python3} -c "exec('''${patch}''')"`;

  // Execute the patch in a new terminal
  const terminal = window.createTerminal({
    name: "Win Patch",
    iconPath: new ThemeIcon("symbol-property"),
  });
  await waitNewTerminalDelay();
  terminal.sendText(pythonCommand);
}
