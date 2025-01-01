import { window } from "vscode";
import * as path from "path";

export class ManimCaller {
  public venvPath: string = "";

  async callManim(args: string) {
    if (!this.venvPath) {
      throw new Error("Python virtual environment path not set (in ManimCaller).");
    }

    const terminal = await window.createTerminal("Manim");
    terminal.show();

    const activatePath = path.join(this.venvPath, "bin", "activate");
    console.log(`▶️ Calling Manimgl ${args}`);
    terminal.sendText(`. ${activatePath} && manimgl ${args}`);
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
}
