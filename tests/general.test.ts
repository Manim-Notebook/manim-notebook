import { describe, it } from "mocha";
import { window } from "vscode";
import { before } from "mocha";
import * as assert from "assert";
// eslint-disable-next-line no-unused-vars
import * as note from "../src/extension";

describe("Sample test", function () {
  this.timeout(10000);

  before(() => {
    window.showInformationMessage("Start all tests.");
  });

  it("Sample test", async () => {
    const terminal = await window.createTerminal("yo");
    terminal.show();
    terminal.sendText("ls -la");

    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log("Done");

    assert.strictEqual(-1, [1, 2, 3].indexOf(5));
    assert.strictEqual(-1, [1, 2, 3].indexOf(1));
  });

  it("Second test", async () => {
    assert.strictEqual(-1, [1, 2, 3].indexOf(5));
    assert.strictEqual(1, [1, 2, 3].indexOf(2));
  });
});
