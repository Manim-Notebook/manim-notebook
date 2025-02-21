const fs = require("fs");
const path = require("path");

const packageJsonPath = path.resolve(__dirname, "../../package.json");
const packageJson = require(packageJsonPath);

function setTestEntryPointForTest() {
  packageJson.main = "./out-test/src/extension.js";
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
}

function resetEntryPoint() {
  packageJson.main = "./dist/extension.js";
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
}

if (process.argv[2] === "set") {
  setTestEntryPointForTest();
} else if (process.argv[2] === "reset") {
  resetEntryPoint();
}
