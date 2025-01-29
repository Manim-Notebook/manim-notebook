import { window, commands } from "vscode";

import { describe, it, before, afterEach } from "mocha";
import * as sinon from "sinon";
let expect: Chai.ExpectStatic;

import { Logger } from "../src/logger";
import { applyWindowsPastePatch } from "../src/patches/applyPatches";
import { manimNotebookContext } from "../src/extension";

// eslint-disable-next-line no-unused-vars
import * as manimNotebook from "@src/extension";
import { onTerminalOutput } from "../src/utils/terminal";

const MANIM_VERSION_STRING_REGEX = /v\d+\.\d+\.\d+/;

before(async () => {
  // why this weird import syntax?
  // -> see https://github.com/microsoft/vscode/issues/130367
  const chai = await import("chai");
  expect = chai.expect;
});

describe("Manim Activation", function () {
  afterEach(() => {
    sinon.restore();
  });

  it("Can read from terminal", async () => {
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

  it.only("Applies Windows paste patch", async function () {
    if (process.platform !== "win32") {
      this.skip();
    }
    expect(manimNotebookContext).to.not.be.undefined;
    this.timeout(10000);

    const spyInfo = sinon.spy(Logger, "info");
    const spyError = sinon.spy(Logger, "error");

    applyWindowsPastePatch(manimNotebookContext, "python3");

    await new Promise<void>((resolve) => {
      const checkSpy = () => {
        sinon.assert.notCalled(spyError);
        if (spyInfo.calledWith("Windows paste patch successfully applied (in applyPatches.ts)")) {
          resolve();
        } else {
          // we use a polling mechanism here as the patch is run
          // in the background
          setTimeout(checkSpy, 300);
        }
      };
      checkSpy();
    });
    sinon.assert.notCalled(spyError);
  });
});
