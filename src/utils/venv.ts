import * as path from "path";

/**
 * Regular expression to match Python executables on Windows and Unix-like
 * systems. Will detect "python", "python3", "python.exe", and "python3.exe".
 */
const PYTHON_BINARY_REGEX = /python3?(\.exe)?$/;

/**
 * Transforms a path pointing to either an environment folder or a
 * Python executable into a path pointing to the respective binary in that
 * environment.
 *
 * This is necessary since the Python extension may return the path to the
 * Python executable OR the path to the environment folder, depending on how
 * the venv was originally created. See:
 * https://github.com/microsoft/vscode-python/wiki/Python-Environment-APIs#extension-api-usage
 *
 * @param envPath The path to the Python environment or Python executable.
 * @param binary The binary to be called, e.g. "manimgl".
 * @returns The path to the binary inside the environment.
 */
export function getBinaryPathInPythonEnv(envPath: string, binary: string): string {
  if (PYTHON_BINARY_REGEX.test(envPath)) {
    return envPath.replace(PYTHON_BINARY_REGEX, binary);
  }

  const binFolderName = process.platform === "win32" ? "Scripts" : "bin";
  return path.join(envPath, binFolderName, binary);
}
