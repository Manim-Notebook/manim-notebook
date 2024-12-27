import { defineConfig } from "@vscode/test-cli";

export default defineConfig({
  files: "out/test/**/*.test.js",
  version: "stable",
  workspaceFolder: "tests/fixtures",
  // https://github.com/microsoft/vscode-extension-test-runner/issues/56
  // extensionDevelopmentPath: "../"
});
