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

import * as path from "path";
import Mocha from "mocha";
import * as assert from "assert";
import { globSync } from "glob";
import "source-map-support/register";

import { workspace, Uri } from "vscode";
import * as manimNotebook from "../../src/extension";
import * as sinon from "sinon";

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
  // register spy as early as possible
  const activationSpy = sinon.spy(manimNotebook, "onExtensionActivated");

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
        console.log("💠 Tests executed via debug configuration");
        console.log("💠 Waiting for extension activation...");
        await waitUntilExtensionActivated(activationSpy);
        console.log("💠 Extension activated");
      } else {
        // set environment variables when called via `npm test`
        // also see launch.json
        process.env.IS_TESTING = "true";
        process.env.TEST_BASE_PATH = process.env.EXTENSION_DEV_PATH;
        console.log("💠 Tests executed via npm script");
        await new Promise(resolve => setTimeout(resolve, 2000));
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
 * Waits until the Manim Notebook extension is activated.
 *
 * @param activationSpy The spy that listens for the activation event, e.g.
 * `onExtensionActivated`.
 */
async function waitUntilExtensionActivated(activationSpy: sinon.SinonSpy): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const interval = setInterval(() => {
      if (activationSpy.called) {
        clearInterval(interval);
        resolve();
      }
    }, 500);
    setTimeout(() => {
      clearInterval(interval);
      reject(new Error("Extension activation timeout"));
    }, 20000);
  });
}
