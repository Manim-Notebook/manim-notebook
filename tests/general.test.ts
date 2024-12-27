import * as assert from "assert";
import * as vscode from "vscode";
import { window } from "vscode";
import * as note from "../src/extension";

suite("Extension Test Suite", () => {
  window.showInformationMessage("Start all tests.");

  test("Sample test", () => {
    assert.strictEqual(-1, [1, 2, 3].indexOf(5));
    assert.strictEqual(-1, [1, 2, 3].indexOf(0));
  });
});
