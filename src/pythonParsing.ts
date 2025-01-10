import * as vscode from "vscode";
import { TextDocument } from "vscode";
import { Logger } from "./logger";

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

    manimClasses.forEach((manimClass) => {
      if (manimClass.constructLine === undefined || manimClass.constructLastLine === undefined) {
        Logger.trace(`Manim class without construct() method: ${manimClass.className}`);
        return;
      }

      const startTotal = manimClass.constructLine + 1; // construct() body
      const endTotal = manimClass.constructLastLine;

      let start = startTotal;
      let end = startTotal;
      let inManimCell = false;

      // Find the Manim Cell ranges inside the construct() method
      for (let i = startTotal; i <= endTotal; i++) {
        const line = document.lineAt(i).text;

        if (ManimCellRanges.MARKER.test(line)) {
          if (inManimCell) {
            ranges.push(ManimCellRanges.getRangeDiscardEmpty(document, start, end));
          }
          inManimCell = true;
          start = i;
        } else if (inManimCell) {
          end = i;
        }
      }

      if (inManimCell) {
        ranges.push(ManimCellRanges.getRangeDiscardEmpty(document, start, end));
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
  isManimClass: boolean;
  line: string;
  lineNumber: number; // 0-based
  className: string;
  classIndent: number;
  constructLine?: number; // 0-based
  constructLastLine?: number; // 0-based
}

/**
 * Returns the lines that define Python classes.
 *
 * @param document The document to search in.
 */
function findClasses(document: vscode.TextDocument): ClassLine[] {
  const lines = document.getText().split("\n");

  const classLines: ClassLine[] = [];
  let currentManimClassCandidate: ClassLine | null = null;

  for (let lineNumber = 0; lineNumber < lines.length; lineNumber++) {
    const line = lines[lineNumber];

    // note that a classMatch and an inheritedClassMatch are mutually exclusive
    const inheritedClassMatch = line.match(/^\s*class\s+(\w+)\s*\(\w.*\)\s*:/);
    const classMatch = line.match(/^\s*class\s+(\w+)\s*(\(\s*\))?\s*:/);
    const constructMatch = line.match(/^\s*def\s+construct\s*\(self\)\s*:/);
    if (!inheritedClassMatch && !classMatch && !constructMatch) {
      continue;
    }

    if (inheritedClassMatch || classMatch) {
      const newCurrentClass = {
        isManimClass: false,
        line, lineNumber,
        className: "",
        classIndent: line.search(/\S/),
        constructLine: undefined,
        constructLastLine: undefined,
      };

      // class ManimScene(Scene):
      if (inheritedClassMatch) {
        newCurrentClass.className = inheritedClassMatch[1];
        currentManimClassCandidate = newCurrentClass;
      // class NormalClass:
      } else if (classMatch) {
        newCurrentClass.className = classMatch[1];
        const newClassIndent = line.search(/\S/);
        if (currentManimClassCandidate
          && newClassIndent <= currentManimClassCandidate.classIndent) {
          currentManimClassCandidate = null;
        }
      }

      classLines.push(newCurrentClass);
    } else if (currentManimClassCandidate && constructMatch) {
      currentManimClassCandidate.isManimClass = true;
      currentManimClassCandidate.constructLine = lineNumber;
      currentManimClassCandidate.constructLastLine = lineNumber;

      // Find the last line of the construct method by looking for the next
      // line with a different or lower indentation level.
      for (let i = lineNumber + 1; i < lines.length; i++) {
        const nextLine = lines[i];
        if (!nextLine.trim()) {
          continue;
        }
        const nextIndent = nextLine.search(/\S/);
        if (nextIndent <= currentManimClassCandidate.classIndent) {
          break;
        }
        currentManimClassCandidate.constructLastLine = i;
      }

      // it was already pushed beforehand
      currentManimClassCandidate = null;
    }
  }

  return classLines;
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
  return findClasses(document).filter(({ isManimClass }) => isManimClass);
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
