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
import { globSync } from "glob";
import "source-map-support/register";

export function run(): Promise<void> {
  const mocha = new Mocha({
    ui: "tdd",
  });

  const testsRoot = path.resolve(__dirname, "..");

  return new Promise((resolve, reject) => {
    try {
      const files: string[] = globSync("**/**.test.js",
        { cwd: testsRoot, ignore: ["**/node_modules/**"] });

      files.forEach(f => mocha.addFile(path.resolve(testsRoot, f)));

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