/**
 * @license
 * Copyright 2017 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * @fileoverview Tools for manipulating text in SVG.
 */

export enum HorizontalAlign {
  Left,
  Right,
  Center,
}

export enum VerticalAlign {
  Top,
  Bottom,
  Middle,
}

/**
 * Definition of the options object which the fitTextInBox() function may take.
 */
export interface FitTextInBoxOptions {
  /**
   * Width of the box.
   */
  width: number;

  /**
   * Height of the box.
   */
  height: number;

  /**
   * Width of a monospace font glyph relative to its height.
   */
  glyphAspectRatio?: number;

  /**
   * X offset of the box to fill.
   */
  x?: number;

  /**
   * Y offset of the box to fill.
   */
  y?: number;

  /**
   * Height of lines as a proportion of font size. Same semantic meaning as CSS
   * line-height attribute when used without any units.
   * See: https://developer.mozilla.org/en-US/docs/Web/CSS/line-height
   */
  lineHeight?: number;

  /**
   * How to align text horizontally (left, right, center).
   */
  horizontalAlign?: HorizontalAlign;

  /**
   * How to align text vertically within the box (top, bottom, middle).
   */
  verticalAlign?: VerticalAlign;
}

/**
 * Default values used by fitTextInBox() in the absence of a specified option.
 */
const FIT_TEXT_IN_BOX_DEFAULT_OPTIONS = {
  x: 0,
  y: 0,
  glyphAspectRatio: 0.6,  // 0.6em wide.
  lineHeight: 1.1,        // 10% margin between lines.
  horizontalAlign: HorizontalAlign.Center,
  verticalAlign: VerticalAlign.Middle,
};

/**
 * The fitTextInBox() function performs a binary search when looking for the
 * best combination of wrapping and size to fit the text. It will never make
 * more than MAX_ATTEMPTS during the search.
 */
const MAX_ATTEMPTS = 20;

/**
 * The fitTextInBox() uses the relative aspect ratio of a candidate wrapping and
 * size combination to determine whether the candidate is best. If at any time
 * the ratio between candidate aspect ratio and box aspect ratio is less than
 * EPSILON, the algorithim will short circuit rather than continuing to look.
 */
const EPSILON = 0.01;

/**
 * When asked to fit() text, the TextFitter returns a tuple of lines, each with
 * x and y coordinates for its upper left hand corner, as well as an overall
 * font size in the same units as the containing box.
 *
 * So for example, if the containing box was 32x32 pixels, then semantically the
 * fontSize suggested would be in pixels. This will usually be the case,
 * although the algorithim is implementation agnostic.
 */
export interface TextSpecs {
  fontSize: number;  // Same units as bounding box, typically pixels.
  lines: {text: string; x: number; y: number;}[];
}

/**
 * A Segment consists of text and may be marked as containing only whitespace.
 * If a segment consists of only whitespace, it is considered not to add to
 * horizontal space when at the beginning or end of a line, and may be omitted
 * between lines.
 */
export interface Segment {
  text: string;
  whitespace: boolean;
}

/**
 * The TextFitter class exists to efficiently fit text into a bounding box. It
 * is meant to be called many times for different input text, given the same
 * options.
 */
export class TextFitter {
  /**
   * Text fitting settings for this instance.
   */
  settings: FitTextInBoxOptions;

  constructor(options: FitTextInBoxOptions) {
    // Compute settings from options and defaults.
    this.settings =
        (Object as any).assign({}, FIT_TEXT_IN_BOX_DEFAULT_OPTIONS, options) as
        FitTextInBoxOptions;
  }

  /**
   * Given a text string, fit it into the box defined by this object's settings.
   * Return a specification detailing how the text should be laid out on a
   * per-line basis.
   *
   * Each line consists of text and pair of x/y coordinates. The x and y are
   * measured from the top left hand corner of the containing box and represent
   * the top left hand corner of the beginning of the line.
   */
  fit(text: string): TextSpecs {
    // Split text into segments.
    text = text.trim();
    const {max, segments} = this.split(text);

    // Compute best cutoff width in glyphs to approach target aspect ratio.
    const {cutoff, width, height} =
        this.computeCutoff(segments, text.length, max);

    // The best found width and height will almost certainly be a little too
    // tall or too wide to exactly fit within the target aspect ratio. The size
    // factor is how much bigger (or smaller) the bounding box is relative to
    // the glyph-based units of width and height.
    // If you are certain the expression is always non-null/undefined, remove
    // this comment.
    const textWidth = width * this.settings.glyphAspectRatio!;
    const boxAspectRatio = this.settings.width / this.settings.height;
    const textAspectRatio = textWidth / height;
    const sizeFactor = textAspectRatio > boxAspectRatio ?
        this.settings.width / textWidth :
        this.settings.height / height;

    // The horizontal multiplication factor (xMult) determines how much of the
    // horizontal space left on the line should be padded to the left.
    const xMult =
        (this.settings.horizontalAlign === HorizontalAlign.Left ?
             0 :
             this.settings.horizontalAlign === HorizontalAlign.Right ? 1 : 0.5);

    // The vertical offset specifies how far from the top the first line should
    // appear, based on vertical alignment settings.
    const yOffset = Math.max(0, this.settings.height - height * sizeFactor) *
        (this.settings.verticalAlign === VerticalAlign.Top ?
             0 :
             this.settings.verticalAlign === VerticalAlign.Bottom ? 1 : 0.5);

    const wrappedLines = this.wrapLines(segments, cutoff);

    // Construct final lines from wrapped lines based on settings.
    const lines: {text: string; x: number; y: number;}[] = [];
    for (let i = 0; i < wrappedLines.length; i++) {
      const {startPos, endPos, textLength} = wrappedLines[i];
      let lineText = '';
      for (let j = startPos; j < endPos; j++) {
        const segment = segments[j];
        lineText += segment.text;
      }
      // If you are certain the expression is always non-null/undefined, remove
      // this comment.
      const xdiff = this.settings.width -
          lineText.length * this.settings.glyphAspectRatio! * sizeFactor;
      // If you are certain the expression is always non-null/undefined, remove
      // this comment.
      lines.push({
        text: lineText,
        x: this.settings.x! + xMult * Math.max(0, xdiff),
        y: this.settings.y! + yOffset +
            i * this.settings.lineHeight! * sizeFactor,
      });
    }

    return {lines, fontSize: sizeFactor};
  }

  /**
   * Given a text string, break it up into a sequence of strings, some of which
   * may consist of only whitespace.
   */
  split(text: string) {
    const segments: Segment[] = [];
    let pos = 1;
    let prev = text.charAt(0);
    let prevW = /\s/.test(prev);
    let start = 0;
    let max = 0;
    while (pos <= text.length) {
      const ch = text.charAt(pos);
      const chW = /\s/.test(ch);
      if (!ch.length || prevW !== chW) {
        // We've found a word boundary or end of string.
        max = Math.max(max, pos - start);
        segments.push({
          text: text.substring(start, pos),
          whitespace: prevW,
        });
        start = pos;
      }
      prev = ch;
      prevW = chW;
      pos++;
    }
    return {max, segments};
  }

  /**
   * Given a collection of segments and a proposed bounding width (in glyphs),
   * compute the bounding rectangle that would contain the wrapped text.
   */
  computeTextRect(segments: Segment[], proposedWidth: number) {
    // Total length of the current row, including trailing whitespace.
    let rowLength = 0;

    // Length of current row, ignoring trailing whitespace.
    let trimmedRowLength = 0;

    // Longest row length encountered (ignores trailing whitespace).
    let maxLength = 0;

    // Total accumulated height of rows.
    let totalHeight = 1;

    for (let i = 0; i < segments.length; i++) {
      const {text, whitespace} = segments[i];
      const length = text.length;

      if (whitespace && !rowLength) {
        // Short-circuit for whitespace at the beginning of a line.
        continue;
      }

      if (whitespace) {
        if (rowLength + length <= proposedWidth) {
          rowLength += length;
        } else {
          rowLength = 0;
          trimmedRowLength = 0;
          // If you are certain the expression is always non-null/undefined,
          // remove this comment.
          totalHeight += this.settings.lineHeight!;
        }
      } else {
        if (rowLength + length <= proposedWidth) {
          // Still room on this row.
          rowLength += length;
          trimmedRowLength = rowLength;
        } else if (trimmedRowLength) {
          // Not enough room on this row, start another.
          rowLength = trimmedRowLength = length;
          // If you are certain the expression is always non-null/undefined,
          // remove this comment.
          totalHeight += this.settings.lineHeight!;
        } else {
          // This individual segment is too long for the proposed width, so
          // it goes on a line by itself.
          maxLength = Math.max(maxLength, length);
          rowLength = trimmedRowLength = 0;
          // If you are certain the expression is always non-null/undefined,
          // remove this comment.
          totalHeight += this.settings.lineHeight!;
        }
      }

      maxLength = Math.max(maxLength, trimmedRowLength);
    }

    return {width: maxLength, height: totalHeight};
  }

  /**
   * Perform a binary search to find the optimal width cutoff to achive the
   * desired aspect ratio for wrapped text. The minumum bound is the width of
   * the single longest segment. The maximum is the total length of all
   * segments.
   */
  computeCutoff(segments: Segment[], total: number, max: number) {
    const targetAspectRatio = this.settings.width / this.settings.height;
    let low = max;
    let high = total;
    let proposedWidth = low + (high - low) / 2;

    let bestWidth = proposedWidth;
    let bestTextRect: {width: number; height: number;} = null!;
    let bestErr = Infinity;

    // The true best wrapping must be discoverabe in fewer attempts than half
    // the number of segments.
    const maxAttempts = Math.min(MAX_ATTEMPTS, (segments.length + 1) / 2);

    let attempts = 0;
    while (attempts < maxAttempts) {
      attempts++;

      const textRect = this.computeTextRect(segments, proposedWidth);
      // If you are certain the expression is always non-null/undefined, remove
      // this comment.
      const computedAspectRatio =
          textRect.width / textRect.height * this.settings.glyphAspectRatio!;

      const err = Math.abs(1 - (computedAspectRatio / targetAspectRatio));

      if (err < bestErr) {
        bestWidth = proposedWidth;
        bestTextRect = textRect;
        bestErr = err;
      }

      if (err < EPSILON) {
        break;
      }

      if (computedAspectRatio > targetAspectRatio) {
        // If the computed aspect ratio is too high, then the text should
        // ideally wrap more, meaning our proposed width is too big and we
        // should narrow it down.
        high = proposedWidth;
      } else {
        // Otherwise, the text is probably too wrapped and we should ease up by
        // increasing the proposed width.
        low = proposedWidth;
      }
      proposedWidth = low + (high - low) / 2;
    }

    return {
      cutoff: bestWidth,
      width: bestTextRect.width,
      height: bestTextRect.height
    };
  }

  /**
   * Wrap segments into lines based on the cutoff. The return value is a list
   * of line objects, each indicating the start and end offsets into the
   * segments array along with the total length of segments in than slice.
   */
  wrapLines(segments: Segment[], cutoff: number) {
    const lines: {startPos: number, endPos: number, textLength: number}[] = [];
    let startPos = 0;
    let endPos = 0;
    let lineLength = 0;
    let trimmedLineLength = 0;
    for (let i = 0; i < segments.length; i++) {
      const {text, whitespace} = segments[i];
      const length = text.length;
      if (whitespace && !lineLength) {
        // Ignore whitespace at the beginning of a line.
        startPos = endPos = i + 1;
        continue;
      }
      if (whitespace) {
        if (lineLength + length <= cutoff) {
          // There's room to add this segment on the current line.
          lineLength += length;
        } else {
          // This segment pushes us over.
          lines.push({
            startPos,
            endPos,
            textLength: trimmedLineLength,
          });
          lineLength = trimmedLineLength = 0;
          startPos = endPos = i + 1;
        }
      } else {
        if (lineLength + length <= cutoff) {
          // There's room to add this segment on the current line.
          lineLength += length;
          trimmedLineLength = lineLength;
          endPos = i + 1;
        } else if (trimmedLineLength) {
          // The segment pushes us over, and the line has content already.
          lines.push({
            startPos,
            endPos,
            textLength: trimmedLineLength,
          });
          lineLength = trimmedLineLength = length;
          startPos = i;
          endPos = i + 1;
        } else {
          // This single segment exceeds the cutoff.
          lines.push({
            startPos: i,
            endPos: i + 1,
            textLength: length,
          });
          lineLength = trimmedLineLength = 0;
          startPos = endPos = i + 1;
        }
      }
    }
    if (endPos > startPos) {
      lines.push({
        startPos,
        endPos,
        textLength: trimmedLineLength,
      });
    }
    return lines;
  }
}
