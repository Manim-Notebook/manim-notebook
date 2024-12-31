/**
 * Main entry point for tests. Uses the @vscode/test-electron API to simplify
 * the process of downloading, unzipping, and launching VSCode with extension
 * test parameters.
 *
 * This is only used when you call "npm test" in the terminal and not when you
 * run the tests from the debug panel. For the latter, we have a custom
 * launch task in .vscode/launch.json.
 *
 * Adapted from the VSCode testing extension guide [1].
 * File on Github: [2].
 *
 * [1] https://code.visualstudio.com/api/working-with-extensions/testing-extension#advanced-setup-your-own-runner
 * [2] https://github.com/microsoft/vscode-extension-samples/blob/main/helloworld-test-sample/src/test/runTest.ts
 */

import * as path from "path";

import { runTests } from "@vscode/test-electron";

/**
 * Main entry point for tests from the "npm test" script. This is not called
 * when you run the tests from the debug panel via the custom launch task in
 * .vscode/launch.json.
 */
async function main() {
  try {
    // Folder containing the extension manifest package.json
    // Passed to `--extensionDevelopmentPath`
    const extensionDevelopmentPath = path.resolve(__dirname, "../../");

    // Path to the extension test script
    // Passed to --extensionTestsPath
    const extensionTestsPath = path.resolve(__dirname, "./utils/testRunner");

    // Download VS Code, unzip it and run the integration test
    await runTests({
      extensionDevelopmentPath,
      extensionTestsPath,
      launchArgs: [
        "tests/fixtures",
        "--disable-extensions",
      ],
      // also see launch.json
      extensionTestsEnv: {
        IS_TESTING: "true",
        TEST_BASE_PATH: extensionDevelopmentPath,
        IS_CALLED_IN_NPM_SCRIPT: "true",
      },
    });
  } catch {
    console.error("Failed to run tests");
    process.exit(1);
  }
}

main();
