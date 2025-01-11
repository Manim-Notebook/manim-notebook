import * as vscode from "vscode";
import { TextDocument } from "vscode";
import { Logger } from "./logger";

/**
 * ManimCellRanges calculates the ranges of Manim cells in a given document.
 * It is used to provide folding ranges, code lenses, and decorations for Manim
 * Cells in the editor.
 */
export class ManimCellRanges {
  /**
   * Regular expression to match the start of a Manim cell.
   *
   * The marker is a comment line starting with "##". That is, "### # #" is also
   * considered a valid marker.
   *
   * Since the comment might be indented, we allow for any number of
   * leading whitespaces.
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
   * Manim Cells are only recognized inside the construct() method of a
   * Manim class (see `ManimClass`).
   */
  public static calculateRanges(document: vscode.TextDocument): vscode.Range[] {
    const ranges: vscode.Range[] = [];
    const manimClasses = ManimClass.findAllIn(document);

    manimClasses.forEach((manimClass) => {
      if (manimClass.constructLine === undefined || manimClass.constructLastLine === undefined
        || manimClass.constructBodyIndent === undefined) {
        Logger.trace(`Manim class without construct() method: ${manimClass.className}`);
        return;
      }

      const startTotal = manimClass.constructLine + 1; // construct() body begins
      const indent = manimClass.constructBodyIndent;
      const endTotal = manimClass.constructLastLine;

      let start = startTotal;
      let end = startTotal;
      let inManimCell = false;

      // Find the Manim Cell ranges inside the construct() method
      for (let i = startTotal; i <= endTotal; i++) {
        const line = document.lineAt(i);
        const currentIndentation = line.firstNonWhitespaceCharacterIndex;

        if (currentIndentation === indent && ManimCellRanges.MARKER.test(line.text)) {
          if (inManimCell) {
            ranges.push(ManimCellRanges.getRangeDiscardEmpty(document, start, end));
          }
          inManimCell = true;
          start = i;
          end = i;
        } else {
          if (!inManimCell) {
            start = i;
          }
          end = i;
        }
      }

      if (inManimCell) {
        ranges.push(ManimCellRanges.getRangeDiscardEmpty(document, start, endTotal));
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

export class ManimClass {
  /**
   * Regular expression to match a class that inherits from any object.
   * The class name is captured in the first group.
   *
   * Note that MyClassName() is not considered here since we expect any words
   * inside the parentheses.
   */
  private static INHERITED_CLASS_REGEX = /^\s*class\s+(\w+)\s*\(\w.*\)\s*:/;

  /**
   * Regular expression to match a class definition.
   * The class name is captured in the first group.
   *
   * This includes the case MyClassName(), but not MyClassName(AnyClass).
   * The class name is captured in the first group.
   *
   * This regex and the inherited class regex are mutually exclusive.
   */
  private static CLASS_REGEX = /^\s*class\s+(\w+)\s*(\(\s*\))?\s*:/;

  /**
   * Regular expression to match the construct() method definition.
   */
  private static CONSTRUCT__METHOD_REGEX = /^\s*def\s+construct\s*\(self\)\s*:/;

  line: string;
  lineNumber: number; // 0-based
  className: string;
  classIndent: number;
  constructLine?: number; // 0-based
  constructLastLine?: number; // 0-based
  constructBodyIndent?: number;

  constructor(
    line: string, lineNumber: number, className: string, classIndent: number,
  ) {
    this.line = line;
    this.lineNumber = lineNumber;
    this.className = className;
    this.classIndent = classIndent;
  }

  /**
   * Returns the lines that define Manim classes in the given document.
   *
   * A Manim class is defined as:
   * - Inherits from any object. Not necessarily "Scene" since users might want
   *   to use inheritance where just the base class inherits from "Scene".
   * - Contains a "def construct(self)" method with exactly this signature.
   *
   * @param document The document to search in.
   */
  public static findAllIn(document: vscode.TextDocument): ManimClass[] {
    const lines = document.getText().split("\n");

    const classes: ManimClass[] = [];
    let candidate: ManimClass | null = null; // a class that might be a Manim class

    for (let lineNumber = 0; lineNumber < lines.length; lineNumber++) {
      const line = lines[lineNumber];
      const inheritedClassMatch = line.match(this.INHERITED_CLASS_REGEX);
      const classMatch = line.match(this.CLASS_REGEX);
      const constructMatch = line.match(this.CONSTRUCT__METHOD_REGEX);
      if (!inheritedClassMatch && !classMatch && !constructMatch) {
        continue;
      }

      if (inheritedClassMatch || classMatch) {
        // class ManimScene(Scene):
        if (inheritedClassMatch) {
          const newCurrentClass = new ManimClass(
            line, lineNumber,
            inheritedClassMatch[1],
            line.search(/\S/),
          );

          newCurrentClass.className = inheritedClassMatch[1];
          candidate = newCurrentClass;
          classes.push(newCurrentClass);

        // class NormalClass:
        } else if (classMatch) {
          const newClassIndent = line.search(/\S/);
          if (candidate
            && newClassIndent <= candidate.classIndent) {
            candidate = null;
          }
        }
      } else if (candidate && constructMatch) {
        candidate.constructLine = lineNumber;
        candidate.constructLastLine = lineNumber;

        // Not even next line available
        if (lineNumber + 1 >= lines.length) {
          candidate = null;
          continue;
        }

        // Body indentation
        const constructBodyIndent = lines[lineNumber + 1].search(/\S/);
        candidate.constructBodyIndent = constructBodyIndent;

        // Find the last line of the construct method by looking for the next
        // line with a different or lower indentation level.
        for (let i = lineNumber + 1; i < lines.length; i++) {
          const nextLine = lines[i];
          if (!nextLine.trim()) {
            continue;
          }
          const nextIndent = nextLine.search(/\S/);
          if (nextIndent < constructBodyIndent) {
            break; // e.g. next class or method
          }
          candidate.constructLastLine = i;
        }

        // it was already pushed beforehand
        candidate = null;
      }
    }

    return classes;
  }

  /**
   * Finds the name of the Manim scene at the given cursor position.
   *
   * @param document The document to search in.
   * @param cursorLine The line number of the cursor.
   * @returns The ClassLine associated to the Manim scene, or null if not found.
   */
  public static findManimSceneName(document: TextDocument, cursorLine: number): ManimClass | null {
    const classLines = this.findAllIn(document);
    const matchingClass = classLines
      .reverse()
      .find(({ lineNumber }) => lineNumber <= cursorLine);

    if (!matchingClass) {
      return null;
    }

    return matchingClass;
  }
}
