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

import * as path from "path";
import Mocha from "mocha";
import * as assert from "assert";
import { globSync } from "glob";
import "source-map-support/register";

import { window, workspace, Uri } from "vscode";

const WORKSPACE_ROOT: string = workspace.workspaceFolders![0].uri.fsPath;

/**
 * Returns a Uri object for a file path relative to the workspace root.
 */
export function uriRelative(pathRelativeToWorkspaceRoot: string): Uri {
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
    timeout: 20000,
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
      } else {
        process.env.IS_TESTING = "true";
        process.env.TEST_BASE_PATH = process.env.EXTENSION_DEV_PATH;
        console.log("💠 Tests requested via npm script");
      }

      // open any python file to trigger extension activation
      await window.showTextDocument(uriRelative("basic.py"));

      console.log("💠 Waiting for extension activation...");
      await waitUntilExtensionActivated();
      console.log("💠 Extension activated detected in tests");

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
 * Waits until the Manim Notebook extension is activated.
 */
async function waitUntilExtensionActivated(): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    activatedEmitter.on("activated", () => resolve());
    setTimeout(() => {
      reject(new Error("Extension activation timeout"));
    }, 15000);
  });
}
