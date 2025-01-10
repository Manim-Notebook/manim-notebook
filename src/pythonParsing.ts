import * as vscode from "vscode";
import { TextDocument } from "vscode";

export class ManimCellRanges {
  /**
   * Regular expression to match the start of a Manim cell.
   *
   * The marker is a comment line starting with "##". Since the comment might
   * be indented, we allow for any number of leading whitespaces.
   *
   * Manim cells themselves might contain further comments, but no nested
   * Manim cells, i.e. no further comment starting with "##".
   */
  private static readonly MARKER = /^(\s*##)/;

  /**
   * Calculates the ranges of Manim cells in the given document.
   *
   * A new Manim cell starts at a custom MARKER. The cell ends either:
   * - when the next line starts with the MARKER
   * - when the indentation level decreases
   * - at the end of the document
   *
   * Manim Cells are only recognized inside Manim Classes, see findManimClasses.
   * They are considered whenever they are defined with the same or an increased
   * indentation level compared to the definition of the mandatory construct
   * method.
   *
   * This method is performance-intensive as it has to go through every single
   * line of the document. Despite this, we call it many times and caching
   * could be beneficial in the future.
   */
  public static calculateRanges(document: vscode.TextDocument): vscode.Range[] {
    const ranges: vscode.Range[] = [];
    const manimClasses = findManimClasses(document);

    manimClasses.forEach(({ lineNumber, constructIndent }) => {
      let start: number | null = null;
      let startIndent: number | null = null;

      for (let i = lineNumber; i < document.lineCount; i++) {
        const line = document.lineAt(i);
        if (line.isEmptyOrWhitespace) {
          continue;
        }

        const currentIndent = line.firstNonWhitespaceCharacterIndex;

        if (ManimCellRanges.MARKER.test(line.text) && currentIndent >= constructIndent) {
          if (start !== null) {
            ranges.push(this.getRangeDiscardEmpty(document, start, i - 1));
          }
          start = i;
          startIndent = currentIndent;
        } else if (start !== null && startIndent !== null && startIndent > currentIndent) {
          ranges.push(this.getRangeDiscardEmpty(document, start, i - 1));
          start = null;
          startIndent = null;
        }
      }

      if (start !== null) {
        ranges.push(this.getRangeDiscardEmpty(document, start, document.lineCount - 1));
      }
    });

    return ranges;
  }

  /**
   * Returns the cell range that contains the given line number.
   *
   * Returns null if no cell range contains the line, e.g. if the cursor is
   * outside of a Manim cell.
   */
  public static getCellRangeAtLine(document: TextDocument, line: number): vscode.Range | null {
    const ranges = ManimCellRanges.calculateRanges(document);
    for (const range of ranges) {
      if (range.start.line <= line && line <= range.end.line) {
        return range;
      }
    }
    return null;
  }

  /**
   * Constructs a new cell range from the given start and end line numbers.
   * Discards all trailing empty lines at the end of the range.
   */
  private static getRangeDiscardEmpty(
    document: vscode.TextDocument, start: number, end: number,
  ): vscode.Range {
    let endNew = end;
    while (endNew > start && document.lineAt(endNew).isEmptyOrWhitespace) {
      endNew--;
    }
    return new vscode.Range(start, 0, endNew, document.lineAt(endNew).text.length);
  }
}

interface ClassLine {
  line: string;
  lineNumber: number;
  className: string;
  constructIndent: number;
}

/**
 * Returns the lines that define Manim classes in the given document.
 *
 * A Manim class is defined as:
 * - Inherits from any object. Not necessarily "Scene" since users might want
 *   use inheritance where just the base class inherits from "Scene".
 * - Contains a "def construct(self)" method with exactly this signature.
 *
 * @param document The document to search in.
 */
export function findManimClasses(document: vscode.TextDocument): ClassLine[] {
  const lines = document.getText().split("\n");

  const classLines: ClassLine[] = [];
  let currentClass: ClassLine | null = null;

  for (let lineNumber = 0; lineNumber < lines.length; lineNumber++) {
    const line = lines[lineNumber];
    const classMatch = line.match(/^\s*class\s+(.+?)\s*\(.*\)\s*:/);
    const constructMatch = line.match(/^\s*def\s+construct\s*\(self\)\s*:/);

    if (classMatch) {
      currentClass = { line, lineNumber, className: classMatch[1], constructIndent: -1 };
    }

    if (currentClass && constructMatch) {
      currentClass.constructIndent = line.search(/\S/);
      classLines.push(currentClass);
      currentClass = null;
    }
  }

  return classLines;
}

/**
 * Finds the name of the Manim scene at the given cursor position.
 *
 * @param document The document to search in.
 * @param cursorLine The line number of the cursor.
 * @returns The ClassLine associated to the Manim scene, or null if not found.
 */
export function findManimSceneName(document: TextDocument, cursorLine: number): ClassLine | null {
  const classLines = findManimClasses(document);
  const matchingClass = classLines
    .reverse()
    .find(({ lineNumber }) => lineNumber <= cursorLine);

  if (!matchingClass) {
    return null;
  }

  return matchingClass;
}
