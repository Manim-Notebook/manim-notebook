import { window, commands } from "vscode";

import { describe, it } from "mocha";
import * as assert from "assert";
import * as sinon from "sinon";

// eslint-disable-next-line no-unused-vars
import * as manimNotebook from "@src/extension";

describe("Manim Installation", function () {
  it.only("Detects Manim version", async () => {
    const spy = sinon.spy(window, "showInformationMessage");
    await commands.executeCommand("manim-notebook.redetectManimVersion");
    assert.ok(spy.calledOnce);
    assert.match(spy.getCall(0).args[0], /v\d+\.\d+\.\d+/);
  });
});
