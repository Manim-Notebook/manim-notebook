import { exec } from "child_process";

import { Window, Logger } from "./logger";
import * as vscode from "vscode";

/**
 * Manim version that the user has installed without the 'v' prefix,
 * e.g. '1.2.3'.
 */
let MANIM_VERSION: string | undefined;

let lastPythonBinary: string | undefined;

const MANIM_RELEASES_URL = "https://github.com/3b1b/manim/releases";
const MANIM_LATEST_RELEASE_API_URL = "https://api.github.com/repos/3b1b/manim/releases/latest";

/**
 * Checks if the given version is at least the required version.
 *
 * @param versionRequired The required version, e.g. '1.2.3'.
 * @param version The version to compare against, e.g. '1.3.4'.
 */
function isAtLeastVersion(versionRequired: string, version: string): boolean {
  const versionRequiredParts = versionRequired.split(".");
  const versionParts = version.split(".");

  for (let i = 0; i < versionRequiredParts.length; i++) {
    if (versionParts[i] === undefined) {
      return false;
    }

    const versionPart = parseInt(versionParts[i], 10);
    const versionRequiredPart = parseInt(versionRequiredParts[i], 10);

    if (versionPart > versionRequiredPart) {
      return true;
    }
    if (versionPart < versionRequiredPart) {
      return false;
    }
  }

  return true;
}

/**
 * Returns true if the users's Manim version is at least the required version.
 * Does not show any warning message should the version be too low.
 *
 * @param versionRequired The minimal Manim version required, e.g. '1.2.3'.
 * @returns True if the user has at least the required Manim version installed.
 */
export function hasUserMinimalManimVersion(versionRequired: string): boolean {
  if (!MANIM_VERSION) {
    return false;
  }
  return isAtLeastVersion(versionRequired, MANIM_VERSION);
}

/**
 * Returns true if the users's Manim version is at least the required version.
 * Shows a generic warning message should the version be too low.
 *
 * @param versionRequired The minimal Manim version required, e.g. '1.2.3'.
 * @returns True if the user has at least the required Manim version installed.
 */
export async function hasUserMinimalManimVersionAndWarn(versionRequired: string): Promise<boolean> {
  if (hasUserMinimalManimVersion(versionRequired)) {
    return true;
  }

  const sorryBaseMessage = "Sorry, this feature requires Manim version"
    + ` v${versionRequired} or higher.`;

  if (MANIM_VERSION) {
    Window.showWarningMessage(
      `${sorryBaseMessage} Your current version is v${MANIM_VERSION}.`);
    return false;
  }

  const tryAgainOption = "Try again to determine version";
  const message = `${sorryBaseMessage} Your current version could not be determined yet.`;
  const selected = await Window.showWarningMessage(message, tryAgainOption);
  if (selected === tryAgainOption) {
    await determineManimVersion(lastPythonBinary);
    return hasUserMinimalManimVersion(versionRequired);
  }

  return false;
}

/**
 * Returns the tag name of the latest Manim release if the GitHub API is
 * reachable. This tag name won't include the 'v' prefix, e.g. '1.2.3'.
 */
async function fetchLatestManimVersion(): Promise<string | undefined> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(MANIM_LATEST_RELEASE_API_URL, {
      headers: {
        Accept: "application/vnd.github+json",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      Logger.error(`GitHub API error: ${response.statusText}`);
      return undefined;
    }

    const data: any = await response.json();
    const tag = data.tag_name;
    return tag.startsWith("v") ? tag.substring(1) : tag;
  } catch (error) {
    Logger.error(`Error fetching latest Manim version: ${error}`);
    return undefined;
  }
}

/**
 * Determines the ManimGL version.
 *
 * Note that this *tries* to determine the version, but it could fail, in which
 * case the user will be informed about this and the MANIM_VERSION is set to
 * undefined.
 *
 * @param pythonBinary The path to the Python binary.
 */
export async function determineManimVersion(pythonBinary: string | undefined) {
  if (!pythonBinary) {
    Logger.error("Python binary path is undefined");
    return;
  }
  lastPythonBinary = pythonBinary;
  MANIM_VERSION = undefined;
  let couldDetermineManimVersion = false;

  const timeoutPromise = new Promise<boolean>((resolve, _reject) => {
    setTimeout(() => {
      Logger.debug("Manim Version Determination: timed out");
      resolve(false);
    }, 3000);
  });

  const versionCommand = `${pythonBinary} -c \"from importlib.metadata import version; `
    + " print(version('manimgl'))\"";

  try {
    couldDetermineManimVersion = await Promise.race(
      [execVersionCommandAndCheckForSuccess(versionCommand), timeoutPromise]);
  } catch (err) {
    Logger.error(`Abnormal termination of ManimGL Version Check: ${err}`);
  }

  if (couldDetermineManimVersion) {
    Logger.info(`👋 ManimGL version found: ${MANIM_VERSION}`);
    await showPositiveUserVersionFeedback();
  } else {
    Logger.info("👋 ManimGL version could not be determined");
    await showNegativeUserVersionFeedback();
  }
}

async function showPositiveUserVersionFeedback() {
  const latestVersion = await fetchLatestManimVersion();
  if (latestVersion) {
    if (latestVersion === MANIM_VERSION) {
      Window.showInformationMessage(
        `You're using the latest ManimGL version: v${MANIM_VERSION}`);
      return;
    }

    const showReleasesOption = "Show Manim releases";
    Window.showInformationMessage(
      `You're using ManimGL version v${MANIM_VERSION}.`
      + ` The latest version is v${latestVersion}.`, showReleasesOption)
      .then((selected) => {
        if (selected === showReleasesOption) {
          vscode.env.openExternal(vscode.Uri.parse(MANIM_RELEASES_URL));
        }
      });
    return;
  } else {
    Window.showInformationMessage(`You're using ManimGL version: v${MANIM_VERSION}`);
  }
}

async function showNegativeUserVersionFeedback() {
  const tryAgainAnswer = "Try again";
  const warningMessage = "Your ManimGL version could not be determined.";
  const answer = await Window.showWarningMessage(warningMessage, tryAgainAnswer);
  if (answer === tryAgainAnswer) {
    await determineManimVersion(lastPythonBinary);
  }
}

/**
 * Executes the given command as child process. We listen to the output and
 * look for the ManimGL version string.
 *
 * @param command The command to execute in the shell (via Node.js `exec`).
 * @returns A promise that resolves to true if the version was successfully
 * determined, and false otherwise. Might never resolve, so the caller should
 * let this promise race with a timeout promise.
 */
async function execVersionCommandAndCheckForSuccess(command: string): Promise<boolean> {
  return new Promise<boolean>(async (resolve, _reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        Logger.error(`Manim Version Check. error: ${error.message}`);
        resolve(false);
        return;
      }
      if (stderr) {
        Logger.error(`Manim Version Check. stderr: ${stderr}`);
        resolve(false);
        return;
      }

      Logger.trace(`Manim Version Check. stdout: ${stdout}`);
      const versionMatch = stdout.match(/^\s*([0-9]+\.[0-9]+\.[0-9]+)/m);
      if (!versionMatch) {
        resolve(false);
        return;
      }
      MANIM_VERSION = versionMatch[1];
      resolve(true);
    });
  });
}
