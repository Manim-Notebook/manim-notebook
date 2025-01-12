import * as crypto from "crypto";
import { TextDocument, Range } from "vscode";

/**
 * Cache is a simple key-value store that keeps a maximum number of entries.
 * The key is a VSCode TextDocument, and the value is of the generic type T.
 *
 * The cache is used to store the results of expensive calculations, e.g. the
 * Manim cell ranges in a document.
 */
class Cache<T> {
  private cache: Map<string, T> = new Map();
  private static readonly MAX_CACHE_SIZE = 5;

  private hash(document: TextDocument): string {
    const text = document.getText();
    const hash = crypto.createHash("md5").update(text);
    return hash.digest("hex");
  }

  public get(document: TextDocument): T | undefined {
    const key = this.hash(document);
    return this.cache.get(key);
  }

  public add(document: TextDocument, value: T): void {
    if (this.cache.size >= Cache.MAX_CACHE_SIZE) {
      const keys = this.cache.keys();
      const firstKey = keys.next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(this.hash(document), value);
  }
}

const cellRangesCache = new Cache<Range[]>();
const manimClassesCache = new Cache<ManimClass[]>();

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
  public static calculateRanges(document: TextDocument): Range[] {
    const cachedRanges = cellRangesCache.get(document);
    if (cachedRanges) {
      return cachedRanges;
    }

    const ranges: Range[] = [];
    const manimClasses = ManimClass.findAllIn(document);

    manimClasses.forEach((manimClass) => {
      const construct = manimClass.constructMethod;
      if (!construct) {
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

    cellRangesCache.add(document, ranges);
    return ranges;
  }

  /**
   * Returns the cell range of the Manim Cell at the given line number.
   *
   * Returns null if no cell range contains the line, e.g. if the cursor is
   * outside of a Manim cell.
   */
  public static getCellRangeAtLine(document: TextDocument, line: number): Range | null {
    const ranges = this.calculateRanges(document);
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
   *
   * The column is set to 0 for `start` and to the end of the line for `end`.
   */
  private static constructRange(document: TextDocument, start: number, end: number): Range {
    let endNew = end;
    while (endNew > start && document.lineAt(endNew).isEmptyOrWhitespace) {
      endNew--;
    }
    return new Range(start, 0, endNew, document.lineAt(endNew).text.length);
  }
}

/**
 * A range of lines in a document. Both start and end are inclusive and 0-based.
 */
interface LineRange {
  start: number;
  end: number;
}

/**
 * Information for a method, including the range of the method body and the
 * indentation level of the body.
 *
 * This is used to gather infos about the construct() method of a Manim class.
 */
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
   * Note that this regex doesn't trigger on MyClassName() since we expect
   * some words inside the parentheses, e.g. MyClassName(MyBaseClass).
   *
   * This regex and the class regex should not trigger both on the same input.
   */
  private static INHERITED_CLASS_REGEX = /^\s*class\s+(\w+)\s*\(\w.*\)\s*:/;

  /**
   * Regular expression to match a class definition.
   * The class name is captured in the first group.
   *
   * This includes the case MyClassName(), but not MyClassName(AnyClass).
   * The class name is captured in the first group.
   *
   * This regex and the inherited class regex should not trigger both
   * on the same input.
   */
  private static CLASS_REGEX = /^\s*class\s+(\w+)\s*(\(\s*\))?\s*:/;

  /**
   * Regular expression to match the construct() method definition.
   */
  private static CONSTRUCT_METHOD_REGEX = /^\s*def\s+construct\s*\(self\)\s*:/;

  /**
   * The 0-based line number where the Manim Class is defined.
   */
  lineNumber: number;

  /**
   * The name of the Manim Class.
   */
  className: string;

  /**
   * The indentation level of the class definition.
   */
  classIndent: number;

  /**
   * Information about the construct() method of the Manim Class.
   */
  constructMethod: MethodInfo | null = null;

  constructor(lineNumber: number, className: string, classIndent: number) {
    this.lineNumber = lineNumber;
    this.className = className;
    this.classIndent = classIndent;
  }

  /**
   * Returns all ManimClasses in the given document.
   *
   * @param document The document to search in.
   */
  public static findAllIn(document: TextDocument): ManimClass[] {
    const cachedClasses = manimClassesCache.get(document);
    if (cachedClasses) {
      return cachedClasses;
    }

    const lines = document.getText().split("\n");
    const classes: ManimClass[] = [];
    let manimClass: ManimClass | null = null;

    for (let lineNumber = 0; lineNumber < lines.length; lineNumber++) {
      const line = lines[lineNumber];

      const match = line.match(this.INHERITED_CLASS_REGEX);
      if (match) {
        manimClass = new ManimClass(lineNumber, match[1], line.search(/\S/));
        classes.push(manimClass);
        continue;
      }

      if (line.match(this.CLASS_REGEX)) {
        // only trigger when not a nested class
        if (manimClass && line.search(/\S/) <= manimClass.classIndent) {
          manimClass = null;
        }
        continue;
      }

      if (manimClass && line.match(this.CONSTRUCT_METHOD_REGEX)) {
        manimClass.constructMethod = this.makeConstructMethodInfo(lines, lineNumber);
        manimClass = null;
      }
    }

    manimClassesCache.add(document, classes);
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

    // Safety check: not even start line of body range accessible
    if (bodyRange.start >= lines.length) {
      return { bodyRange, bodyIndent };
    }

    for (let i = bodyRange.start; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) {
        continue; // skip empty lines
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
   * Returns the ManimClass at the given cursor position (if any).
   *
   * @param document The document to search in.
   * @param cursorLine The line number of the cursor.
   * @returns The ManimClass at the cursor position, or undefined if not found.
   */
  public static getManimClassAtCursor(document: TextDocument, cursorLine: number):
  ManimClass | undefined {
    const manimClasses = this.findAllIn(document);
    return manimClasses.reverse().find(({ lineNumber }) => lineNumber <= cursorLine);
  }
}
