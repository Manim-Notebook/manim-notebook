import { exec } from "child_process";
import { existsSync } from "fs";
import * as path from "path";
import * as assert from "assert";

function run(cmd: string, ...args: any): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(cmd, ...args, (error: any, stdout: any, stderr: any) => {
      if (error) return reject(error);
      if (stderr) return reject(stderr);
      resolve(stdout);
    });
  });
}

export class ManimInstaller {
  /**
   * Path to the path where Manim will be installed to.
   */
  private manimPath: string = "";

  /**
   * Sets up the Manim installation path.
   *
   * @param testDir The path where the tests are located.
   * We expect it to be the `out/test/tests/` directory.
   */
  public async setup(testDir: string) {
    console.log("🎈 SETTING UP MANIM INSTALLATION");
    assert.ok(testDir.endsWith("out/test/tests"));
    this.manimPath = path.join(testDir, "../../..", "tmp", "manim");
    await run(`mkdir -p ${this.manimPath}`);
    console.log(`Manim installation path: ${this.manimPath}`);
  }

  /**
   * Checks if Manim is already downloaded (just a rudimentary check).
   */
  private async isAlreadyDownloaded() {
    const exists = existsSync(this.manimPath);
    if (!exists) {
      return false;
    }
    const files = await run(`ls -A ${this.manimPath}`);
    return files.length > 0;
  }

  /**
   * Downloads Manim from the official repository if not already done.
   */
  public async download() {
    if (await this.isAlreadyDownloaded()) {
      console.log("Manim already downloaded.");
      return;
    }

    console.log("Downloading Manim... (this might take a while)");
    await run(`git clone https://github.com/3b1b/manim.git ${this.manimPath}`,
      { cwd: this.manimPath });
  }
}
