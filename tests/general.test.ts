import * as vscode from "vscode";
import { window } from "vscode";

import { describe, it } from "mocha";
import { before } from "mocha";
import * as assert from "assert";

import * as manimNotebook from "@src/extension";
// import { manimCaller } from "./utils/testRunner";

describe("Sample test", function () {
  before(async () => {
    // https://github.com/microsoft/vscode-discussions/discussions/2468
    // manimNotebook.activate(null as any);
  });

  it.only("Manim test", async () => {
    console.log("Running test");
    await new Promise(resolve => setTimeout(resolve, 10000));
    console.log("Test done");
  });
});
