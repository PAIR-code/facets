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
 * @fileoverview Axis class for rendering an axis on the side of a cell.
 */
import {BoundedObject, Side} from './bounded-object';
import {Cell} from './grid';

/**
 * Thickness in pixels of the stroke used in drawing axes.
 */
export const AXIS_STROKE_PX = 1.2;

/**
 * Length in pixels of the axis's wing nubs.
 */
export const AXIS_WING_LENGTH_PX = 6;

/**
 * Amount of space in pixels to leave between the cell's content and the axis.
 */
export const AXIS_OFFSET_PX = 4;

/**
 * Amount of space in pixels to leave between an axis and the next cell.
 */
export const AXIS_MARGIN_PX = 14;

/**
 * Minimum tolerable ratio between the length of an axis and its wing length.
 * That is, if the long side of the axis is below this multiple of the wing,
 * then the axis looks too much like a square letter 'C' rather than a nice thin
 * line with tiny wings, and it should fade out.
 */
const AXIS_MIN_LENGTH_RATIO = 5;

/**
 * Axis objects are bound to create axis lines (paths).
 */
export class Axis extends BoundedObject {
  /**
   * Whether this axis is on the left or bottom side of the cell.
   */
  side: Side;

  /**
   * The grid cell to which this axis is attached.
   */
  cell: Cell;

  /**
   * Create the Axis object by capturing the selected Side and Cell, then pre-
   * compute the minimum scale at which this axis should be visible based on
   * the presence of nearby neighboring cells.
   */
  constructor(side: Side, cell: Cell) {
    super();
    this.side = side;
    this.cell = cell;

    // Total space required in screen pixels width-wise.
    const total = AXIS_OFFSET_PX + AXIS_MARGIN_PX * 2 + AXIS_STROKE_PX +
        AXIS_WING_LENGTH_PX;

    switch (side) {
      case Side.Left:
        // Default min scale to use based on the acceptable length-to-wing
        // ratio, if we're not boxed in by neighboring cells.
        // TODO(jimbo): Investigate replacing the non-null assertion (!)
        // with a runtime check.
        // If you are certain the expression is always non-null/undefined,
        // remove this comment.
        this.minScale =
            AXIS_WING_LENGTH_PX * AXIS_MIN_LENGTH_RATIO / cell.innerHeight!;

        // Search for the nearest sibling cell to the left that is non-empty
        // OR that has a non-empty sibling above. Since we allow both Left and
        // Bottom side axes, a cell above could have a Bottom axis which would
        // limit the space available for this one.
        let left = cell.siblings.left;
        while (left && !left.items.length &&
               (!left.siblings.above || !left.siblings.above.items.length)) {
          left = left.siblings.left;
        }

        // If we found a non-empty cell (OR cell with non-empty sibling above),
        // then its distance away could bound the minimum scale fon this axis.
        if (left) {
          // TODO(jimbo): Investigate replacing the non-null assertion (!)
          // with a runtime check.
          // If you are certain the expression is always non-null/undefined,
          // remove this comment.
          this.minScale = Math.max(
              this.minScale,
              total / (cell.contentX! - (left.contentX! + left.innerWidth!)));
        }
        break;

      case Side.Bottom:
        // Default min scale to use based on the acceptable length-to-wing
        // ratio, if we're not boxed in by neighboring cells.
        // TODO(jimbo): Investigate replacing the non-null assertion (!)
        // with a runtime check.
        // If you are certain the expression is always non-null/undefined,
        // remove this comment.
        this.minScale =
            AXIS_WING_LENGTH_PX * AXIS_MIN_LENGTH_RATIO / cell.innerWidth!;

        // Search for the nearest non-empty sibling cell below OR that has a
        // non-empty sibling to the right. Since we allow both Left and Bottom
        // side axes, a cell to the right could have a Left axis which would
        // limit the space available for this one.
        let below = cell.siblings.below;
        while (below && !below.items.length &&
               (!below.siblings.right || !below.siblings.right.items.length)) {
          below = below.siblings.below;
        }

        // If we found a non-empty cell (OR cell with non-epmty sibling to the
        // right) thet its distance away could bound the minimum scale.
        if (below) {
          // TODO(jimbo): Investigate replacing the non-null assertion (!)
          // with a runtime check.
          // If you are certain the expression is always non-null/undefined,
          // remove this comment.
          this.minScale = Math.max(
              this.minScale,
              total /
                  (cell.contentY! - (below.contentY! + below.innerHeight!)));
        }
        break;

      default:
        throw Error('Axes for specified side are not implemented.');
    }
  }

  /**
   * Return the scaled stroke width for this axis.
   */
  strokeWidth(scale: number): number {
    return AXIS_STROKE_PX / scale;
  }

  /**
   * Return the SVG path string (d attribute) it should follow in world
   * coordinates at the specified scale.
   */
  path(scale: number): string {
    // Scale the axis offset and wing length down since we're drawing the path
    // in world coordinates (not screen coordinates).
    const axisOffset = AXIS_OFFSET_PX / scale;
    const wingLength = AXIS_WING_LENGTH_PX / scale;

    if (this.side === Side.Left) {
      // TODO(jimbo): Investigate replacing the non-null assertion (!) with
      // a runtime check.
      // If you are certain the expression is always non-null/undefined, remove
      // this comment.
      const x = this.cell.contentX! - axisOffset - wingLength;
      // TODO(jimbo): Investigate replacing the non-null assertion (!) with
      // a runtime check.
      // If you are certain the expression is always non-null/undefined, remove
      // this comment.
      const y = this.cell.contentY! + AXIS_STROKE_PX / 2 / scale;
      // TODO(jimbo): Investigate replacing the non-null assertion (!) with
      // a runtime check.
      // If you are certain the expression is always non-null/undefined, remove
      // this comment.
      const height = this.cell.innerHeight! - AXIS_STROKE_PX / scale;
      return `M ${x},${y} h ${wingLength} v ${height} h -${wingLength}`;
    } else if (this.side === Side.Bottom) {
      // TODO(jimbo): Investigate replacing the non-null assertion (!) with
      // a runtime check.
      // If you are certain the expression is always non-null/undefined, remove
      // this comment.
      const x = this.cell.contentX! + AXIS_STROKE_PX / 2 / scale;
      // TODO(jimbo): Investigate replacing the non-null assertion (!) with
      // a runtime check.
      // If you are certain the expression is always non-null/undefined, remove
      // this comment.
      const y = this.cell.contentY! - axisOffset - wingLength;
      // TODO(jimbo): Investigate replacing the non-null assertion (!) with
      // a runtime check.
      // If you are certain the expression is always non-null/undefined, remove
      // this comment.
      const width = this.cell.innerWidth! - AXIS_STROKE_PX / scale;
      return `M ${x},${y} v ${wingLength} h ${width} v -${wingLength}`;
    }
    return '';
  }

  /**
   * Return a uniquely identifiable string for this axis based on its side and
   * the cell to which it's attached.
   */
  key(): string {
    return `${this.cell.compoundKey}-${this.side}`;
  }
}
