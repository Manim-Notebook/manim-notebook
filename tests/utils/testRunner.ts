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

// import as soon as possible
import { activatedEmitter } from "../../src/extension";

import * as assert from "assert";
import { globSync } from "glob";
import Mocha from "mocha";
import * as path from "path";
import "source-map-support/register";
import "./prototype";

import { ConfigurationTarget, Uri, extensions, window, workspace } from "vscode";

const WORKSPACE_ROOT: string = workspace.workspaceFolders![0].uri.fsPath;

/**
 * Returns a Uri object for a file path relative to the workspace root.
 */
export function uriInWorkspace(pathRelativeToWorkspaceRoot: string): Uri {
  const fullPath = path.join(WORKSPACE_ROOT, pathRelativeToWorkspaceRoot);
  return Uri.file(fullPath);
}

/**
 * Runs the test suite.
 *
 * Note that this function is called from the launch.json test configuration
 * as well as when you execute "npm test" manually (in the latter case, from
 * the main() function in main.ts).
 */
export function run(): Promise<void> {
  const mocha = new Mocha({
    ui: "tdd",
    timeout: 45000,
    color: true,
  });

  console.log(`💠 workspaceRoot: ${WORKSPACE_ROOT}`);
  assert.ok(WORKSPACE_ROOT.endsWith("fixtures"));
  const files: string[] = globSync("**", { cwd: WORKSPACE_ROOT });
  console.log(`💠 files in root: ${files}`);

  return new Promise(async (resolve, reject) => {
    try {
      const testsRoot = path.resolve(__dirname, "..");
      console.log(`💠 testsRoot: ${testsRoot}`);

      const files: string[] = globSync("**/**.test.js",
        { cwd: testsRoot, ignore: ["**/node_modules/**"] });
      files.forEach(f => mocha.addFile(path.resolve(testsRoot, f)));

      if (process.env.IS_CALLED_IN_NPM_SCRIPT !== "true") {
        console.log("💠 Tests requested via debug configuration");
        // respective env variables are set in launch.json
      } else {
        process.env.IS_TESTING = "true";
        process.env.TEST_BASE_PATH = process.env.EXTENSION_DEV_PATH;
        console.log("💠 Tests requested via npm script");
      }

      await configureClipboardTimeoutForCI();

      // open any python file to trigger extension activation
      await window.showTextDocument(uriInWorkspace("basic.py"));

      const extension = await extensions.getExtension("manim-notebook.manim-notebook");
      if (extension?.isActive) {
        console.log("💠 Extension is detected as *activated*");
      } else {
        console.log("💠 Waiting for extension activation...");
        await waitUntilExtensionActivated();
        console.log("💠 Extension activation detected in tests");
      }

      console.log("Running tests...");
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
 * In CI, test execution can be slower and restoring clipboard contents may
 * race with command handling. Increase timeout to reduce flaky tests.
 */
async function configureClipboardTimeoutForCI(): Promise<void> {
  if (process.env.CI !== "true") {
    return;
  }

  const timeoutMs = Number(process.env.MANIM_NOTEBOOK_TEST_CLIPBOARD_TIMEOUT_MS ?? "2000");
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new Error("MANIM_NOTEBOOK_TEST_CLIPBOARD_TIMEOUT_MS must be a positive number");
  }

  await workspace
    .getConfiguration("manim-notebook")
    .update("clipboardTimeout", timeoutMs, ConfigurationTarget.Workspace);
  console.log(`💠 CI override: manim-notebook.clipboardTimeout=${timeoutMs}ms`);
}

/**
 * Waits until the Manim Notebook extension is activated.
 */
async function waitUntilExtensionActivated(): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    activatedEmitter.on("activated", () => resolve());
    setTimeout(() => {
      reject(new Error("Extension activation timeout"));
    }, 20000);
  });
}
