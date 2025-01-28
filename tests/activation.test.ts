import { window, commands, extensions } from "vscode";

import { describe, it, afterEach } from "mocha";
import * as sinon from "sinon";

import { Logger } from "../src/logger";

// eslint-disable-next-line no-unused-vars
import * as manimNotebook from "@src/extension";
import { onTerminalOutput } from "../src/utils/terminal";

const MANIM_VERSION_STRING_REGEX = /v\d+\.\d+\.\d+/;

describe("Manim Activation", function () {
  afterEach(() => {
    sinon.restore();
  });

  it("Can read from terminal", async () => {
    const extension = extensions.getExtension("Manim-Notebook.manim-notebook");
    if (!extension) {
      throw new Error("Manim Notebook extension not found");
    }
    await extension.activate();

    console.log("🎈 Creating terminal");
    const terminal = window.createTerminal("Dummy terminal");
    terminal.show();

    return new Promise((resolve) => {
      onTerminalOutput(terminal, (data) => {
        console.log(data);
        if (MANIM_VERSION_STRING_REGEX.test(data)) {
          resolve();
        }
      });
      terminal.sendText("manimgl --version");
    });
  });

  it("Detects Manim version", async () => {
    // TODO: Test different Manim versions installed
    const spy = sinon.spy(window, "showInformationMessage");
    await commands.executeCommand("manim-notebook.redetectManimVersion");
    sinon.assert.called(spy);
    sinon.assert.calledWith(spy, sinon.match(MANIM_VERSION_STRING_REGEX));
  });

  it("Applies Windows paste patch", async function () {
    if (process.platform !== "win32") {
      this.skip();
    }
    const extension = extensions.getExtension("Manim-Notebook.manim-notebook");
    if (!extension) {
      throw new Error("Manim Notebook extension not found");
    }

    const spy = sinon.spy(Logger, "info");
    const spyError = sinon.spy(Logger, "error");

    await extension.activate();

    sinon.assert.notCalled(spyError);
    sinon.assert.called(spy);
    sinon.assert.calledWith(spy, sinon.match("Windows paste patch successfully applied"));
  });
});
