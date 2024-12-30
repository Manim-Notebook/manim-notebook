import { describe, it } from "mocha";

// eslint-disable-next-line no-unused-vars
import * as manimNotebook from "@src/extension";

describe("Sample test", function () {
  it.only("Manim test", async () => {
    console.log("Running test...");
    await new Promise(resolve => setTimeout(resolve, 5000));
    console.log("Test finished");
  });
});
