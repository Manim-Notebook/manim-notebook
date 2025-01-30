import { DebugAdapterTracker, DebugSession } from "vscode";

export class ManimDebugAdapterTracker implements DebugAdapterTracker {
  private session: DebugSession;
  private gotoThreadId: number | undefined;

  constructor(session: DebugSession) {
    this.session = session;
  }

  onDidSendMessage(message: any): void {
    console.log("Debug Event:", message);

    if (message.command === "gotoTargets") {
      const target = message.body.targets[0];
      console.log("🎯 Target", target);
      this.session.customRequest("goto", { threadId: this.gotoThreadId, targetId: target.id });
    }

    if (!message.body || !message.body.threadId) {
      return;
    }
    const threadId = message.body.threadId;

    if (message.event === "stopped") {
      // Request stack trace to get execution details
      this.session.customRequest("stackTrace", { threadId })
        .then((response) => {
          const stackFrames = response.stackFrames;
          if (stackFrames && stackFrames.length > 0) {
            const topFrame = stackFrames[0];
            const file = topFrame.source?.path || "unknown";
            const line = topFrame.line;

            console.log(`Debugger stopped at line ${line} in ${file}`);
          }
        });
    }

    if (message.event === "continued") {
      this.session.customRequest("stackTrace", { threadId })
        .then((response) => {
          const stackFrames = response.stackFrames;
          if (stackFrames && stackFrames.length > 0) {
            const topFrame = stackFrames[0];
            const file = topFrame.source?.path || "unknown";
            const line = topFrame.line;

            console.log(`Debugger continued at line ${line} in ${file}`);
          }
        });
    }

    // if (message.event === "continued" && message.body.threadId) {
    //   console.log("💨 Will pause debugger (onDidSendMessage", message);
    //   session.customRequest("pause", { threadId: message.body.threadId });
    // }
  }

  onWillReceiveMessage(message: any): void {
    console.log("✅ Message", message);

    // Retrieve the path dynamically

    if (message.command === "continue" && message.arguments.threadId) {
      console.log("💨 Will pause debugger", message);
      this.gotoThreadId = message.arguments.threadId;
      this.session.customRequest("gotoTargets", {
        source: {
          path: "your-path-to/exciting-first-start.py",
          sourceRference: 0,
        },
        line: 23,
      });
    }
  }
}
