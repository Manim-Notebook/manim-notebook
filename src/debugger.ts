import { DebugAdapterTracker, DebugSession } from "vscode";
import * as vscode from "vscode";

import { Logger } from "./logger";
import { previewLine } from "./previewCode";

let filePath: string | undefined;

export class ManimDebugAdapterTracker implements DebugAdapterTracker {
  constructor(session: DebugSession) {
    const config = session.configuration;
    filePath = config.program;
    console.log("🚀 Debugging file:", filePath);
  }

  /**
   * The debug adapter has sent a Debug Adapter Protocol message to the editor.
   *
   * https://vscode-api.js.org/interfaces/vscode.DebugAdapterTracker.html#onDidSendMessage
   */
  async onDidSendMessage(message: any): Promise<void> {
    console.log("Debug Event:", message);
  }

  /**
   * The debug adapter is about to receive a Debug Adapter Protocol message
   * from the editor.
   *
   * https://vscode-api.js.org/interfaces/vscode.DebugAdapterTracker.html#onWillReceiveMessage
   */
  async onWillReceiveMessage(message: any): Promise<void> {
    console.log("📰 Message:", message);
  }
}

async function requestGoToLine(session: DebugSession, threadId: number, lineNumber: number) {
  const response = await session.customRequest("gotoTargets", {
    source: {
      path: filePath,
      // indicate that we want to load the source from the file path
      sourceReference: 0,
    },
    line: lineNumber + 1, // 1-based
  });
  if (!response.targets || response.targets.length === 0) {
    throw new Error("No goto targets found");
  }
  const target = response.targets[0];
  await session.customRequest("goto", { threadId, targetId: target.id });
}

async function getCurrentLineNumber(session: DebugSession, threadId: number): Promise<number> {
  const response = await session.customRequest("stackTrace", { threadId });
  const stackFrames = response.stackFrames;
  if (!stackFrames || stackFrames.length === 0) {
    throw new Error("No stack frames found");
  }
  const topFrame = stackFrames[0];
  const line = topFrame.line;

  return line - 1; // -1 for 0-based index
};

export async function previewAndStepOverCurrentLine() {
  // Session
  const session = vscode.debug.activeDebugSession;
  if (!session) {
    Logger.debug("No active debug session found");
    return;
  }

  // Thread
  const response = await session.customRequest("threads");
  const threads = response.threads;
  if (!threads || threads.length === 0) {
    Logger.debug("No threads found");
    return;
  }
  const threadId = threads[0].id;

  // Preview & step over
  const lineNumber = await getCurrentLineNumber(session, threadId);
  console.log("👉 Preview line (1-based):", lineNumber + 1);
  await previewLine(lineNumber);
  await requestGoToLine(session, threadId, lineNumber + 1);
}
