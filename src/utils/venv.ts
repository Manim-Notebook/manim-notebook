import * as path from "path";

/**
 * Transforms a path pointing to either an environment folder or a
 * Python executable into a path pointing to the respective binary in that
 * environment.
 *
 * @param envPath The path to the Python environment or Python executable.
 * @param binary The binary to be called, e.g. "manimgl".
 * @returns The path to the binary inside the environment.
 */
export function getBinaryPathInPythonEnv(envPath: string, binary: string): string {
  if (envPath.endsWith("python") || envPath.endsWith("python3")) {
    return envPath.replace(/python3?$/, binary);
  }

  const binFolderName = process.platform === "win32" ? "Scripts" : "bin";
  return path.join(envPath, binFolderName, binary);
}
