import { exec } from "child_process";
import { existsSync } from "fs";
import * as fs from "fs";
import * as path from "path";

function run(cmd: string, ...args: any): Promise<any> {
  const promise = new Promise<any>((resolve, reject) => {
    console.log(`▶️ Running command: ${cmd}`);
    exec(cmd, ...args, (error: Error, stdout: string | Buffer, stderr: string | Buffer) => {
      let errorMessage = error?.message || stderr;
      if (errorMessage) {
        if (errorMessage.includes("ffmpeg")) {
          console.error("🔥 ffmpeg warning detected -> will be ignored:");
          console.error(errorMessage);
        } else if (errorMessage.includes("VK_ERROR_INCOMPATIBLE_DRIVER")) {
          // https://gitlab.freedesktop.org/mesa/mesa/-/issues/10293
          // MESA: error:
          // ZINK: vkCreateInstance failed (VK_ERROR_INCOMPATIBLE_DRIVER)
          console.error("🔥 ZINK: vkCreateInstance warning detected -> will be ignored:");
          console.error(errorMessage);
        } else {
          console.error("🔥 Error while running command");
          if (error) return reject(error);
          if (stderr) return reject(stderr);
        }
      }
      console.log(stdout);
      resolve(stdout);
    });
  });
  promise.catch((err) => {
    console.error("Caught error in promise");
    console.error(err);
  });
  return promise;
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
   * Name of the Python binary.
   */
  private pythonBinary = process.platform === "win32" ? "python" : "python3";

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
    await run(`${this.pythonBinary} -m venv ${this.venvPath}`);
    await this.runWithVenvBin(`${this.pythonBinary} --version`);
    await this.runWithVenvBin("pip config set global.disable-pip-version-check true");
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
    // 2>&1 redirects stderr to stdout since git writes to stderr for
    // diagnostic messages and we don't want to reject the promise in that case.
    await run(`git clone --depth 1 https://github.com/3b1b/manim.git ${this.manimPath} 2>&1`,
      { cwd: this.manimPath });
  }

  /**
   * Installs Manim as (editable) Python package.
   */
  public async install() {
    const pipList = await this.runWithVenvBin("pip list");
    if (pipList.toLowerCase().includes("manimgl")) {
      console.log("❇️ Manim already installed via pip");
      return;
    }
    console.log("❇️ Installing Manim...");
    await this.runWithVenvBin(`pip install -e ${this.manimPath}`);
    console.log("❇️ Manim successfully installed");
  }

  /**
   * Installs additional dependencies for Manim.
   */
  public async installAdditionalDependencies() {
    console.log("🔧 Installing additional dependencies...");
    await this.runWithVenvBin("pip install setuptools");

    const pythonVersion = await this.runWithVenvBin(`${this.pythonBinary} --version`);
    if (pythonVersion.includes("3.13")) {
      // https://github.com/jiaaro/pydub/issues/815
      await this.runWithVenvBin("pip install audioop-lts");
    }

    if (process.platform === "linux") {
      await this.runWithVenvBin("pip install PyOpenGL");
    }

    console.log("🔧 Additional dependencies successfully installed");
  }

  /**
   * Disables Pyglet shadow window creation in Manim as workaround for
   * the "Unable to share contexts" error under Windows. This is just a
   * monkey patch.
   *
   * Also see:
   * - https://github.com/pyglet/pyglet/issues/1047
   * - https://discourse.psychopy.org/t/bugfixes-for-unable-to-share-contexts-and-portaudio-not-initialized/3537
   * - https://pyglet.readthedocs.io/en/latest/programming_guide/options.html#pyglet.Options.shadow_window
   *
 */
  public disablePygletShadowWindow(): void {
    const manimWindowFile = path.join(this.manimPath, "manimlib", "window.py");
    if (!fs.existsSync(manimWindowFile)) {
      console.error(`Manim window.py file not found: ${manimWindowFile}`);
      return;
    }
    console.log(`⛑️ Disabling pyglet shadow window creation in ${manimWindowFile}`);

    try {
      const fileContent = fs.readFileSync(manimWindowFile, "utf-8");

      // Stop the fix if it's already applied
      const disableShadowWindow = "pyglet.options['shadow_window']=False";
      if (fileContent.includes(disableShadowWindow)) {
        console.log("pyglet shadow window fix already applied");
        return;
      }

      // Prepend the fix, taking into account that
      // "from __future__ import annotations" must be the first line
      const fix = `import pyglet\n${disableShadowWindow}\n`;
      const futureImport = "from __future__ import annotations\n";
      const updatedContent = fileContent.startsWith(futureImport)
        ? `${futureImport}${fix}${fileContent.slice(futureImport.length)}`
        : `${fix}${fileContent}`;

      // Save the updated content
      fs.writeFileSync(manimWindowFile, updatedContent, "utf-8");
      console.log(`Updated: ${manimWindowFile}`);
    } catch (error) {
      console.error(`Error processing file ${manimWindowFile}:`, error);
    }
  }

  /**
   * Verifies the Manim installation.
   */
  public async verifyInstallation() {
    console.log("🔍 Verifying Manim installation");
    await this.runWithVenvBin("manimgl --version");
  }

  /**
   * Runs a command using the respective binary from the Python virtual
   * environment.
   *
   * @param binPath The path to the bin folder of the virtual Python
   * environment. This path will be prefixed to every command, e.g.
   * `manimgl --version` becomes
   * `/path/to/venv/bin/manimgl --version`.
   */
  private runWithVenvBin(cmd: string): Promise<string> {
    if (!this.venvPath) {
      throw new Error("Python virtual environment not set up yet.");
    }
    const binFolderName = process.platform === "win32" ? "Scripts" : "bin";
    const binPath = path.join(this.venvPath, binFolderName);
    return run(path.join(binPath, cmd));
  }
}
