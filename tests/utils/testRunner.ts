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

import { workspace } from "vscode";

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

  const workspaceRoot = workspace.workspaceFolders![0].uri.fsPath;
  console.log(`💠 workspaceRoot: ${workspaceRoot}`);
  assert.ok(workspaceRoot.endsWith("fixtures"));
  const files: string[] = globSync("**", { cwd: workspaceRoot });
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
        console.log("Waiting fixed timeout of 5s before running tests...");
        console.log("(This is to ensure that the extension has properly activated.)");
        await new Promise(resolve => setTimeout(resolve, 5000));
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
