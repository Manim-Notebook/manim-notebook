import * as crypto from "crypto";
import * as vscode from "vscode";
import { TextDocument } from "vscode";
import { Logger } from "./logger";

class Cache {
  public cellRanges: Map<string, vscode.Range[]> = new Map();
  public manimClasses: Map<string, ManimClass[]> = new Map();
  private static readonly MAX_CACHE_SIZE = 5;

  private hash(document: vscode.TextDocument): string {
    const text = document.getText();
    const hash = crypto.createHash("md5").update(text);
    return hash.digest("hex");
  }

  public getCellRanges(document: vscode.TextDocument): vscode.Range[] | undefined {
    const key = this.hash(document);
    if (this.cellRanges.has(key)) {
      console.log("Cache hit: Cell Ranges");
      return this.cellRanges.get(key);
    }
    return undefined;
  }

  public addCellRanges(document: vscode.TextDocument, ranges: vscode.Range[]): void {
    if (this.cellRanges.size >= Cache.MAX_CACHE_SIZE) {
      const keys = this.cellRanges.keys();
      const firstKey = keys.next().value;
      if (firstKey) {
        console.log("Cache DEL: Cell Ranges");
        this.cellRanges.delete(firstKey);
      }
    }

    this.cellRanges.set(this.hash(document), ranges);
  }

  public getManimClasses(document: vscode.TextDocument): ManimClass[] | undefined {
    const key = this.hash(document);
    if (this.manimClasses.has(key)) {
      console.log("Cache hit: Manim Classes");
      return this.manimClasses.get(key);
    }
    return undefined;
  }

  public addManimClasses(document: vscode.TextDocument, classes: ManimClass[]): void {
    if (this.manimClasses.size >= Cache.MAX_CACHE_SIZE) {
      const keys = this.manimClasses.keys();
      const firstKey = keys.next().value;
      if (firstKey) {
        console.log("Cache DEL: Manim Classes");
        this.manimClasses.delete(firstKey);
      }
    }

    this.manimClasses.set(this.hash(document), classes);
  }
}

const cache = new Cache();

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
    const cachedRanges = cache.getCellRanges(document);
    if (cachedRanges) {
      return cachedRanges;
    }

    const ranges: vscode.Range[] = [];
    const manimClasses = ManimClass.findAllIn(document);

    manimClasses.forEach((manimClass) => {
      const construct = manimClass.constructMethod;
      if (construct === null) {
        Logger.trace(`Manim class without construct() method: ${manimClass.className}`);
        return;
      }

      const startCell = construct.bodyRange.start;
      const endCell = construct.bodyRange.end;
      let start = startCell;
      let end = startCell;

      let inManimCell = false;

      for (let i = startCell; i <= endCell; i++) {
        const line = document.lineAt(i);
        const indentation = line.firstNonWhitespaceCharacterIndex;

        if (indentation === construct.bodyIndent && this.MARKER.test(line.text)) {
          if (inManimCell) {
            ranges.push(this.constructRange(document, start, end));
          }
          inManimCell = true;
          start = i;
          end = i;
          continue;
        }

        if (!inManimCell) {
          start = i;
        }
        end = i;
      }

      // last cell
      if (inManimCell) {
        ranges.push(this.constructRange(document, start, endCell));
      }
    });

    cache.addCellRanges(document, ranges);
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
  private static constructRange(
    document: vscode.TextDocument, start: number, end: number,
  ): vscode.Range {
    let endNew = end;
    while (endNew > start && document.lineAt(endNew).isEmptyOrWhitespace) {
      endNew--;
    }
    return new vscode.Range(start, 0, endNew, document.lineAt(endNew).text.length);
  }
}

interface LineRange {
  start: number; // 0-based
  end: number; // 0-based
}

interface MethodInfo {
  bodyRange: LineRange;
  bodyIndent: number;
}

/**
 * A Manim class is defined as:
 * - Inherits from any object. Not necessarily "Scene" since users might want
 *   to use inheritance where just the base class inherits from "Scene".
 * - Contains a "def construct(self)" method with exactly this signature.
 *
 * This class provides static methods to work with Manim classes in a Python
 * document.
 */
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
  private static CONSTRUCT_METHOD_REGEX = /^\s*def\s+construct\s*\(self\)\s*:/;

  line: string;
  lineNumber: number; // 0-based
  className: string;
  classIndent: number;
  constructMethod: MethodInfo | null = null;

  constructor(
    line: string, lineNumber: number, className: string, classIndent: number,
  ) {
    this.line = line;
    this.lineNumber = lineNumber;
    this.className = className;
    this.classIndent = classIndent;
  }

  /**
   * Returns all ManimClasses in the given document.
   *
   * @param document The document to search in.
   */
  public static findAllIn(document: vscode.TextDocument): ManimClass[] {
    const cachedClasses = cache.getManimClasses(document);
    if (cachedClasses) {
      return cachedClasses;
    }

    const lines = document.getText().split("\n");

    const classes: ManimClass[] = [];
    let candidate: ManimClass | null = null; // a class that might be a Manim class

    for (let lineNumber = 0; lineNumber < lines.length; lineNumber++) {
      const line = lines[lineNumber];

      const inheritedClassMatch = line.match(this.INHERITED_CLASS_REGEX);
      if (inheritedClassMatch) {
        candidate = new ManimClass(
          line, lineNumber,
          inheritedClassMatch[1], line.search(/\S/),
        );
        classes.push(candidate);
        continue;
      }

      if (line.match(this.CLASS_REGEX)) {
        const newClassIndent = line.search(/\S/);
        if (candidate && newClassIndent <= candidate.classIndent) {
          candidate = null;
        }
        continue;
      }

      if (line.match(this.CONSTRUCT_METHOD_REGEX) && candidate) {
        candidate.constructMethod = this.makeConstructMethodInfo(lines, lineNumber);
        candidate = null;
      }
    }

    cache.addManimClasses(document, classes);
    return classes;
  }

  /**
   * Calculates the range of the construct() method of the Manim class and
   * returns it along with the indentation level of the method body.
   *
   * The construct method is said to end when the indentation level of one
   * of the following lines is lower than the indentation level of the first
   * line of the method body.
   *
   * @param lines The lines of the document.
   * @param lineNumber The line number where the construct() method is defined.
   */
  private static makeConstructMethodInfo(lines: string[], lineNumber: number): MethodInfo {
    const bodyIndent = lines[lineNumber + 1].search(/\S/);
    const bodyRange = { start: lineNumber + 1, end: lineNumber + 1 };

    // Safety check: not even next line available
    if (lineNumber + 1 >= lines.length) {
      return { bodyRange, bodyIndent };
    }

    for (let i = bodyRange.start; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) {
        continue;
      }

      const indent = line.search(/\S/);
      if (indent < bodyIndent) {
        break; // e.g. next class or method found
      }
      bodyRange.end = i;
    }

    return { bodyRange, bodyIndent };
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
