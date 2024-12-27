import * as assert from "assert";
import * as vscode from "vscode";
import { window } from "vscode";
// import * as note from "../src/extension";
import { before } from "mocha";

suite("General Tests", () => {
  before(() => {
    window.showInformationMessage("Start all tests.");
  });

  test("Sample test", async () => {
    assert.strictEqual(-1, [1, 2, 3].indexOf(5));
    assert.strictEqual(-1, [1, 2, 3].indexOf(0));

    const terminal = await window.createTerminal("yo");
    terminal.show();
    terminal.sendText("ls");

    await window.showInformationMessage("Sample test passed.");
  });
});
