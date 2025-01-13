import { workspace, Range } from "vscode";
import { describe, it } from "mocha";
import { uriInWorkspace } from "./utils/testRunner";
import { ManimCellRanges } from "../src/pythonParsing";

describe("Manim Cell Ranges", function () {
  // in the expected ranges we only care about the start and end lines
  // line numbers are 0-based here
  const tests = [
    {
      filename: "detection_basic.py",
      expectedRanges: [[5, 7], [9, 10]],
    },
    {
      filename: "detection_class_definition.py",
      expectedRanges: [[9, 11], [13, 14]],
    },
    {
      filename: "detection_inside_construct.py",
      expectedRanges: [[5, 12], [14, 16]],
    },
    {
      filename: "detection_multiple_inheritance.py",
      expectedRanges: [[5, 7], [9, 21], [14, 21], [31, 33], [35, 36]],
    },
    {
      filename: "detection_multiple_methods.py",
      expectedRanges: [[5, 7], [9, 10]],
    },
    {
      filename: "detection_syntax.py",
      expectedRanges: [[5, 9], [11, 12], [14, 15], [17, 17], [19, 19],
        [25, 25], [31, 32], [33, 34], [35, 35], [36, 36]],
    },
  ];

  tests.forEach(function (test) {
    it(`Correctly assigns ranges for ${test.filename}`, async () => {
      const uri = uriInWorkspace(test.filename);
      const document = await workspace.openTextDocument(uri);

      const ranges: Range[] = ManimCellRanges.calculateRanges(document);
      const expectedRanges = test.expectedRanges;

      if (ranges.length !== expectedRanges.length) {
        throw new Error(`Expected ${expectedRanges.length} ranges, but got ${ranges.length}`);
      }

      for (let i = 0; i < ranges.length; i++) {
        const range = ranges[i];
        const expectedRange = expectedRanges[i];

        if (range.start.line !== expectedRange[0]) {
          throw new Error(`Start line does not match (${i}):`
            + ` expected: ${expectedRange[0]}, actual: ${range.start.line}`);
        }
        if (range.end.line !== expectedRange[1]) {
          throw new Error(`End line does not match (${i}):`
            + ` expected: ${expectedRange[1]}, actual: ${range.end.line}`);
        }
      }
    });
  });
});
