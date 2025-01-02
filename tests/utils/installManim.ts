import { ManimInstaller } from "./manimInstaller";
import * as path from "path";

async function setupManimInstallation() {
  const baseFolder = process.cwd();
  const tmpFolder = path.join(baseFolder, "tmp");
  console.log(`Temporary folder: ${tmpFolder}`);

  const installer = new ManimInstaller();
  await installer.setup(tmpFolder);
  await installer.download();

  if (process.platform === "win32") {
    installer.fixWindowsContextException();
  }

  await installer.install();
  await installer.installAdditionalDependencies();
  await installer.verifyInstallation();
}

(async () => {
  await setupManimInstallation();
})();
