import { exec } from "child_process";
import { existsSync } from "fs";
import * as path from "path";

function run(cmd: string, ...args: any): Promise<string> {
  return new Promise((resolve, reject) => {
    console.log(`🌟 Running command: ${cmd}`);
    exec(cmd, ...args, (error: any, stdout: any, stderr: any) => {
      if (error) return reject(error);
      if (stderr) return reject(stderr);
      console.log(stdout);
      resolve(stdout);
    });
  });
}

/**
 * Helper class to install Manim and set up the Python virtual environment.
 * We expect that the setup() method is the first one to be called.
 */
export class ManimInstaller {
  /**
   * Path to the path where Manim will be installed to.
   */
  private manimPath: string = "";

  /**
   * Path to the virtual Python environment.
   */
  private venvPath: string = "";

  /**
   * Sets up the Manim installation path.
   *
   * @param tmpFolder The path for a temporary folder where we can install
   * Manim and the Python virtual environment to.
   */
  public async setup(tmpFolder: string) {
    console.log("🎈 SETTING UP MANIM INSTALLATION");

    // Manim installation path
    this.manimPath = path.join(tmpFolder, "manim");
    await run(`mkdir -p ${this.manimPath}`);
    console.log(`🍭 Manim installation path: ${this.manimPath}`);

    // Python virtual environment path
    this.venvPath = path.join(tmpFolder, "manimVenv");
    console.log(`🍭 Python virtual environment path: ${this.venvPath}`);
    await run(`python3 -m venv ${this.venvPath}`);
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
      console.log("🎁 Manim already downloaded");
      return;
    }

    console.log("🎁 Downloading Manim... (this might take a while)");
    await run(`git clone https://github.com/3b1b/manim.git ${this.manimPath}`,
      { cwd: this.manimPath });
  }

  /**
   * Installs Manim as (editable) Python package.
   */
  public async install() {
    const pipList = await this.runInVenv("pip list | grep manimgl");
    if (pipList.length > 0) {
      console.log("❇️ Manim already installed via pip");
      return;
    }
    console.log("❇️ Installing Manim...");
    await this.runInVenv(`pip install -e ${this.manimPath}`);
    console.log("❇️ Manim successfully installed");
  }

  /**
   * Installs additional dependencies for Manim.
   */
  public async installAdditionalDependencies() {
    console.log("🔧 Installing additional dependencies...");
    await this.runInVenv("pip install setuptools");
    console.log("🔧 Additional dependencies installed successfully.");
  }

  /**
   * Runs a command in the Python virtual environment by sourcing the
   * `activate` script beforehand.
   *
   * @param cmd The command to run.
   */
  private runInVenv(cmd: string): Promise<string> {
    if (!this.venvPath) {
      throw new Error("Python virtual environment not set up yet.");
    }
    return run(`. ${path.join(this.venvPath, "bin", "activate")} && ${cmd}`);
  }
}
