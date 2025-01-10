import { ManimInstaller } from "./manimInstaller";
import * as path from "path";

async function setupManimInstallation() {
  const baseFolder = process.cwd();
  const tmpFolder = path.join(baseFolder, "tmp");
  console.log(`Temporary folder: ${tmpFolder}`);

  const installer = new ManimInstaller();
  await installer.setup(tmpFolder);
  await installer.download();
  await installer.install();
  await installer.installAdditionalDependencies();
  await installer.verifyInstallation();

  console.log("💫 If started via debug configuration,"
    + "go to the VSCode debug console to see the test output.");
}

(async () => {
  await setupManimInstallation();
})();
