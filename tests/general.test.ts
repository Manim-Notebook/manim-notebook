import { window } from "vscode";
import { before } from "mocha";

suite("Sample test", () => {
  before(() => {
    window.showInformationMessage("Start all tests.");
  });

  test("Sample test", async () => {
    const terminal = await window.createTerminal("yo");
    terminal.show();
    terminal.sendText("ls -la");

    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log("Done");
  });
});
