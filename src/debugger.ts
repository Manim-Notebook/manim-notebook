import { DebugAdapterTracker, DebugSession } from "vscode";

import { Logger } from "./logger";
import { previewLine } from "./previewCode";

export class ManimDebugAdapterTracker implements DebugAdapterTracker {
  private session: DebugSession;

  private gotoThreadId: number | undefined;
  private filePath: string | undefined;

  constructor(session: DebugSession) {
    this.session = session;

    const config = session.configuration;
    const filePath = config.program;
    console.log("🚀 Debugging file:", filePath);
    this.filePath = filePath;
  }

  onDidSendMessage(message: any): void {
    console.log("Debug Event:", message);

    if (message.command === "gotoTargets") {
      const target = message.body.targets[0];
      console.log("🎯 Target:", target);
      this.session.customRequest("goto", { threadId: this.gotoThreadId, targetId: target.id });
    }
  }

  async onWillReceiveMessage(message: any): Promise<void> {
    console.log("📰 Message:", message);

    if (message.command === "next") {
      const threadId = message.arguments.threadId;
      if (!threadId) {
        Logger.error("No threadId found in next command");
        return;
      }

      const lineNumber = await this.getCurrentLineNumber(threadId);
      console.log("👉 Preview line (1-based):", lineNumber + 1);

      // this.session.customRequest("pause", { threadId });  // doesn't work
      await previewLine(lineNumber);
      this.requestGoToLine(threadId, lineNumber + 1);
    }
  }

  private async getCurrentLineNumber(threadId: number): Promise<number> {
    const response = await this.session.customRequest("stackTrace", { threadId });
    const stackFrames = response.stackFrames;
    if (!stackFrames || stackFrames.length === 0) {
      throw new Error("No stack frames found");
    }
    const topFrame = stackFrames[0];
    const line = topFrame.line;

    return line - 2; // -1 for 0-based index, -1 for the line where the breakpoint is set
  }

  private requestGoToLine(threadId: number, lineNumber: number) {
    this.gotoThreadId = threadId;
    this.session.customRequest("gotoTargets", {
      source: {
        path: this.filePath,
        sourceReference: 0, // indicate that we want to load the source from the file path
      },
      line: lineNumber + 1, // 1-based
    });
  }
}
