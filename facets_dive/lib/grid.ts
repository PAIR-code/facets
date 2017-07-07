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
 * @fileoverview Logic for laying out items in a grid.
 */
import * as SortingModule from './sorting';

export type Key = SortingModule.Key;

// Unicode characters for separating string fields.
const UNIT_SEPARATOR = '\u001F';
const RECORD_SEPARATOR = '\u001E';

/**
 * A Grid works by arranging a collection of Items. They can be anything, but
 * creating an explicit type makes it clear that we're not just bailing out of
 * specifying a type.
 */
export type Item = any;

/**
 * A Cell is identified by a vertical and horizontal key (row and column
 * respectively) and contains items. A grid contains a collection of such cells.
 *
 * Cells are positioned in world coordinates (x/y) and have dimensions
 * determined by the aspect ratio of the cell, the aspect ratio of the grid's
 * items, and the number of items in the cell.
 */
export interface Cell {
  /**
   * Items contained in this Cell.
   */
  items: Item[];

  /**
   * The cell's vertical key (identifies which row it's in).
   */
  verticalKey: Key;

  /**
   * The cell's horizontal key (identifies which column it's in).
   */
  horizontalKey: Key;

  /**
   * The cell's compound key, composed of the vertical and horizontal keys.
   * Suitable for use as a unique hash identifying this cell.
   */
  compoundKey: string;

  /**
   * X coordinate of lower-left-hand corner in world coordinates.
   */
  x?: number;

  /**
   * Y coordinate of lower-left-hand corner in world coordinates.
   */
  y?: number;

  /**
   * Width of the cell in world coordinates.
   */
  width?: number;

  /**
   * Height of the cell in world coordinates.
   */
  height?: number;

  /**
   * Minimum width necessary to stack all the items using the computed optimal
   * cell aspect ratio.
   */
  minWidth?: number;

  /**
   * Minimum height necessary to stack all the items using the computed optimal
   * cell aspect ratio.
   */
  minHeight?: number;

  /**
   * Width of the inner portion of the cell, where items would be placed, after
   * accounting for cell padding.
   */
  innerWidth?: number;

  /**
   * Height of the inner portion of the cell, where items would be placed, after
   * accounting for cell padding.
   */
  innerHeight?: number;

  /**
   * X position of the lower-left hand corner of the cell's content area, after
   * accounting for cell padding.
   */
  contentX?: number;

  /**
   * Y position of the lower-left hand corner of the cell's content area, after
   * accounting for cell padding.
   */
  contentY?: number;

  /**
   * A cell may have siblings above, below, to the left, or to the right.
   */
  siblings: {
    above?: Cell | null; below?: Cell | null; left?: Cell | null;
    right?: Cell | null;
  };
}

/**
 * Maximum number of attempts to perform when computing optimization tasks like
 * determining the optimal cell aspect ratio to achive a given overall grid
 * aspect ratio.
 */
const MAX_OPTIMIZATION_ATTEMPTS = 20;

/**
 * Due to floating point division and rounding, in particular with 4:3 aspect
 * ratio items, some cell position calculations can be off by imperceptible
 * amounts (billionths of a world coordinate unit) before rounding. This value
 * is sometimes needed in stacking calculations to avoid these errors.
 */
const ROUNDING_EPSILON = 1e-6;

/**
 * The position of an item within a cell. Both X and Y are relative and should
 * be normalized to 0-1.
 */
export type ItemPosition = {
  x: number,
  y: number
};

/**
 * Method signature for a callback function that can compute the relative X and
 * Y coordinates for an item within a cell.
 */
export type ComputeItemPosition =
    (item: Item, index: number, cell: Cell, grid: Grid) => ItemPosition;

/**
 * The default method of computing the X coordinate for an item within a cell,
 * using only its index within the cell item list. The output will be a
 * cell-relative coordinate in the range 0-1.
 */
export const X_SCATTER_POSITION_FROM_INDEX =
    (item: Item, index: number, cell: Cell, grid: Grid) => {
      // TODO(jimbo): Investigate replacing the non-null assertion (!) with
      // a runtime check.
      // If you are certain the expression is always non-null/undefined, remove
      // this comment.
      const numColumns =
          Math.floor(ROUNDING_EPSILON + cell.minWidth! / grid.itemAspectRatio);
      return numColumns > 1 ? (index % numColumns) / (numColumns - 1) : 0;
    };

/**
 * The default method of computing the Y coordinate for an item within a cell,
 * using only its index within the cell item list. The output will be a
 * cell-relative coordinate in the range 0-1.
 */
export const Y_SCATTER_POSITION_FROM_INDEX =
    (item: Item, index: number, cell: Cell, grid: Grid) => {
      // TODO(jimbo): Investigate replacing the non-null assertion (!) with
      // a runtime check.
      // If you are certain the expression is always non-null/undefined, remove
      // this comment.
      const numColumns =
          Math.floor(ROUNDING_EPSILON + cell.minWidth! / grid.itemAspectRatio);
      const numRows = Math.ceil(cell.items.length / numColumns);
      return numRows > 1 ? Math.floor(index / numColumns) / (numRows - 1) : 0;
    };

/**
 * This generator produces a positioning function with the desired centering
 * vertically and horizontally.
 */
export const stackItems =
    (verticalAlign?: string, horizontalAlign?: string): ComputeItemPosition => {
      const offsetX = horizontalAlign === 'right' ?
          1 :
          horizontalAlign === 'middle' ? 0.5 : 0;
      const offsetY =
          verticalAlign === 'top' ? 1 : verticalAlign === 'middle' ? 0.5 : 0;
      return (item: Item, index: number, cell: Cell, grid: Grid) => {
        const x = X_SCATTER_POSITION_FROM_INDEX(item, index, cell, grid);
        const y = Y_SCATTER_POSITION_FROM_INDEX(item, index, cell, grid);
        // TODO(jimbo): Investigate replacing the non-null assertion (!)
        // with a runtime check.
        // If you are certain the expression is always non-null/undefined,
        // remove this comment.
        const innerWidth = cell.innerWidth! - grid.itemAspectRatio;
        // TODO(jimbo): Investigate replacing the non-null assertion (!)
        // with a runtime check.
        // If you are certain the expression is always non-null/undefined,
        // remove this comment.
        const innerHeight = cell.innerHeight! - 1;
        // TODO(jimbo): Investigate replacing the non-null assertion (!)
        // with a runtime check.
        // If you are certain the expression is always non-null/undefined,
        // remove this comment.
        return {
          x: (x / innerWidth * (cell.minWidth! - grid.itemAspectRatio)) +
              (offsetX * (cell.innerWidth! - cell.minWidth!) / innerWidth),
          y: (y / innerHeight * (cell.minHeight! - 1)) +
              (offsetY * (cell.innerHeight! - cell.minHeight!) / innerHeight),
        };
      };
    };

/**
 * The default method of positioning items within a cell is to stack them
 * starting in the lower left and proceeding upwards in rows.
 */
export const STACK_ITEMS = stackItems('bottom', 'left');

/**
 * Grid alignment options.
 */
export enum GridAlignment {
  /**
   * Tight grid alignmment causes each column to be wide enough to
   * accomodate the widest cell in that column, or each row to be tall enough
   * to accomodate that row's tallest cell.
   *
   *   +----+--------------+
   *   |    |oo            |
   *   |o   |ooo           |
   *   +----+--------------+
   *   |    |oooooooooo    |
   *   |    |oooooooooooooo|
   *   |    |oooooooooooooo|
   *   |oo  |oooooooooooooo|
   *   |oooo|oooooooooooooo|
   *   |oooo|oooooooooooooo|
   *   +----+--------------+
   */
  Tight,

  /**
   * Uniform grid alignmment forces all cells to be the same uniform width and
   * height, large enough to accomodate stacking the items in the largest cell.
   *
   *   +--------------+--------------+
   *   |              |              |
   *   |              |              |
   *   |              |              |
   *   |              |              |
   *   |              |oo            |
   *   |o             |ooo           |
   *   +--------------+--------------+
   *   |              |oooooooooo    |
   *   |              |oooooooooooooo|
   *   |              |oooooooooooooo|
   *   |oo            |oooooooooooooo|
   *   |oooo          |oooooooooooooo|
   *   |oooo          |oooooooooooooo|
   *   +--------------+--------------+
   */
  Uniform,
}

/**
 * A faceting function takes an item and returns a key (or null) into which to
 * bucket that item. For example, a histogram faceting function may look at each
 * item as a number and use it to determine a bucket index. Then, for items that
 * cannot be interpreted as a number return null.
 */
export type FacetingFunction = (item: Item) => (Key | null);

export class Grid {
  // SETTINGS.

  /**
   * The array of objects to be bucketed and positioned. These objects will be
   * directly modified to set their target position and opacity.
   */
  items: Item[];

  /**
   * The aspect ratio (width / height) of the items. Default is 1 (square).
   *
   *   Ratio:    1/2             1                2
   *
   *          - +---+       -  +---+       -  +-------+
   *          . |   |       1  |   |       1  |       |
   *          2 |   |       -  +---+       -  +-------+
   *          . |   |          |.1.|          |. .2. .|
   *          - +---+
   *            |.1.|
   */
  itemAspectRatio: number;

  /**
   * The cell margin is the amount of space to preserve between cells, both
   * vertically and horizontally, measured in item widths. Default is 1, meaning
   * there's enough space to place one item in between adjacent columns.
   *
   * For example, say the itemAspectRatio is 2, meaning items are twice as wide
   * as they are tall.
   *
   *   -  +-------+
   *   1  |       |
   *   -  +-------+
   *      |. .2. .|
   *
   * When placed in a grid with the default cell margin of 1, there'll be 1 item
   * width (that is, 2 item heights) worth of space between every cell.
   *
   *              |. . 2 . .|
   *   -  +-------+         +-------+
   *   .  |       |         |       |
   *   .  +-------+         +-------+ -
   *   .                              .
   *   4                              2
   *   .                              .
   *   .  +-------+         +-------+ -
   *   .  |       |         |       |
   *   -  +-------+         +-------+
   *      |. . . . . . 6 . . . . . .|
   */
  cellMargin: number;

  /**
   * Cell padding describes the amount of space to preserve within cells, much
   * like padding in a DOM element. It's broken up into four parts: top, left,
   * right and bottom. All padding defaults to 0.
   *
   * Like cellMargin, cellPadding is measured in item widths.
   */
  cellPadding: {bottom: number; left: number; right: number; top: number;};

  /**
   * Target aspect ratio to achieve for the whole grid. Defaults to 1 (square).
   */
  targetGridAspectRatio: number;

  /**
   * Faceting function used for vertical bucketing. Given an item, this must
   * produce either a number or string key.
   *
   * The default faceting function returns null for any input, placing all items
   * into the same row.
   */
  verticalFacet: FacetingFunction;

  /**
   * Faceting function used for horizontal bucketing. Given an item, this must
   * produce either a number or string key.
   *
   * The default faceting function returns null for any input, placing all items
   * into the same column.
   */
  horizontalFacet: FacetingFunction;

  /**
   * Comparison function for sorting keys vertically.
   *
   * For numbers, higher values should come later (like positive Y on a scatter
   * plot), but for strings, alphabetically later values should actually come
   * earlier. This is because we read text left-to-right and top-to-bottom, but
   * we expect numbers on charts to go left-to-right and bottom-to-top.
   *
   * In addition, unexpected values (like finding a string when sorting numbers,
   * or vice versa) should come especially "early" to the comparator so they
   * appear towards the bottom of the screen.
   */
  verticalKeyCompare: (a: Key, b: Key) => number;

  /**
   * Comparison function for sorting keys horizontally.
   *
   * Unexpected values (like finding a string when sorting numbers, or vice
   * versa) should come especially "early" to the comparator so they appear
   * towards the left hand side.
   */
  horizontalKeyCompare: (a: Key, b: Key) => number;

  /**
   * When arranging items in a grid, this callback method will be used to set
   * the coordinates for a given item. If left unspecified, the default callback
   * function will simply set the x and y properties of the item objects.
   */
  itemPositionSetter: (item: Item, x: number, y: number) => void;

  /**
   * Method to use to compute positions of items within a cell. By default,
   * this will use an algorithm which stacks items starting from the lower-left
   * and building up in rows.
   *
   * The return value should be the X and Y coordinates of the item, relative to
   * the cell. That is, an X value of 0 would be on the far left, and 1 would
   * be on the far right. Likewile a Y value of 0 would be on the bottom, and 1
   * would be on the top.
   */
  computeItemPosition: ComputeItemPosition;

  /**
   * How to align and size grid cells relative to each other vertically.
   */
  verticalGridAlignment: GridAlignment;

  /**
   * How to align and size grid cells relative to each other horizontally.
   */
  horizontalGridAlignment: GridAlignment;

  /**
   * Minimum allowed cell aspect ratio. Defaults to 0.
   */
  minCellAspectRatio: number;

  /**
   * Maximum allowed cell aspect ratio. Defaults to positive infinity.
   */
  maxCellAspectRatio: number;

  /**
   * Optional method for sorting items within each Cell prior to updating item
   * positions.
   */
  cellItemComparator: ((a: Item, b: Item) => number)|null;

  // READ-ONLY PROPERTIES.

  /**
   * Sorted array of keys discovered from vertical, row-based bucketing.
   */
  verticalKeys: Key[];

  /**
   * Hash of verticalKeys for fast lookup prior to insertion.
   */
  verticalKeysHash: {[key: string]: Key};

  /**
   * Sorted array of keys discovered from horizontal, column-based bucketing.
   */
  horizontalKeys: Key[];

  /**
   * Hash of horizontalKeys for fast lookup prior to insertion.
   */
  horizontalKeysHash: {[key: string]: Key};

  /**
   * Hash of Cells in the grid. The keys of this hash are constructed from a
   * pair of vertical and horizontal keys.
   * See getCompoundKey().
   */
  cells: {[key: string]: Cell};

  /**
   * Length of the items array of the cell with the most items.
   */
  longestCellLength: number;

  /**
   * Width of the laid out grid after arrange() has been called.
   */
  width: number;

  /**
   * Height of the laid out grid after arrange() has been called.
   */
  height: number;

  constructor(items: Item[]) {
    this.items = items;
    this.itemAspectRatio = 1;
    this.cellMargin = 1;
    this.cellPadding = {
      bottom: 0,
      left: 0,
      right: 0,
      top: 0,
    };
    this.targetGridAspectRatio = 1;
    this.minCellAspectRatio = 0;
    this.maxCellAspectRatio = Infinity;

    // Default faceting functions put everything in the same null bucket.
    this.verticalFacet = item => null!;
    this.horizontalFacet = item => null!;

    // Default key sorting assumes primarily string values.
    this.verticalKeyCompare = SortingModule.verticalStringCompare;
    this.horizontalKeyCompare = SortingModule.horizontalStringCompare;

    // Initialize local state.
    this.verticalKeys = [];
    this.verticalKeysHash = {};
    this.horizontalKeys = [];
    this.horizontalKeysHash = {};
    this.cells = {};
    this.longestCellLength = 0;
    this.width = 0;
    this.height = 0;

    // Generate default item position setter.
    this.itemPositionSetter = (item: any, x: number, y: number) => {
      item.x = x;
      item.y = y;
    };

    // Use default 'stacked' algorithm to position items in their cells.
    this.computeItemPosition = STACK_ITEMS;

    // Use the default Tight grid alighnment.
    this.verticalGridAlignment = GridAlignment.Tight;
    this.horizontalGridAlignment = GridAlignment.Tight;

    // By default, don't sort cell items before positioning.
    this.cellItemComparator = null;
  }

  /**
   * Clear and re-initialize internal computed state.
   */
  clear() {
    this.verticalKeys = [];
    this.verticalKeysHash = {};

    this.horizontalKeys = [];
    this.horizontalKeysHash = {};

    this.cells = {};
    this.longestCellLength = 0;
    this.width = 0;
    this.height = 0;
  }

  /**
   * Arrange the items into a grid by bucketing them and then laying them out.
   */
  arrange() {
    this.facetItemsIntoCells();

    // Compute the optimal cell aspect ratio, given the target grid ratio, then
    // constrain it based on the min and max allowed.
    const optimalCellAspectRatio =
        this.computeOptimalCellAspectRatio(this.targetGridAspectRatio);
    const cellAspectRatio = Math.min(
        this.maxCellAspectRatio,
        Math.max(this.minCellAspectRatio, optimalCellAspectRatio));

    // Determine cell, row, and column minimum and maximum sizes.
    const rowHeights: number[] = [];
    const columnWidths: number[] = [];
    for (let i = 0; i < this.verticalKeys.length; i++) {
      for (let j = 0; j < this.horizontalKeys.length; j++) {
        const cell =
            this.getOrCreateCell(this.verticalKeys[i], this.horizontalKeys[j]);
        [cell.minWidth, cell.minHeight] =
            this.computeCellDimensions(cellAspectRatio, cell.items.length);
        rowHeights[i] = Math.max(rowHeights[i] || 0, cell.minHeight);
        columnWidths[j] = Math.max(columnWidths[j] || 0, cell.minWidth);
      }
    }

    // Fill in cell siblings.
    for (let i = 0; i < this.verticalKeys.length; i++) {
      for (let j = 0; j < this.horizontalKeys.length; j++) {
        const cell =
            this.getCell(this.verticalKeys[i], this.horizontalKeys[j])!;
        if (i < this.verticalKeys.length - 1) {
          cell.siblings.above =
              this.getCell(this.verticalKeys[i + 1], this.horizontalKeys[j]);
        }
        if (i > 0) {
          cell.siblings.below =
              this.getCell(this.verticalKeys[i - 1], this.horizontalKeys[j]);
        }
        if (j > 0) {
          cell.siblings.left =
              this.getCell(this.verticalKeys[i], this.horizontalKeys[j - 1]);
        }
        if (j < this.horizontalKeys.length - 1) {
          cell.siblings.right =
              this.getCell(this.verticalKeys[i], this.horizontalKeys[j + 1]);
        }
      }
    }

    // Force uniform row heights and column widths when alignment is uniform.
    if (this.verticalGridAlignment === GridAlignment.Uniform) {
      const maxRowHeight = Math.max(...rowHeights);
      for (let i = 0; i < rowHeights.length; i++) {
        rowHeights[i] = maxRowHeight;
      }
    }
    if (this.horizontalGridAlignment === GridAlignment.Uniform) {
      const maxColumnWidth = Math.max(...columnWidths);
      for (let j = 0; j < columnWidths.length; j++) {
        columnWidths[j] = maxColumnWidth;
      }
    }

    // Backfill cell true width and height based on row and column dimensions.
    for (let i = 0; i < this.verticalKeys.length; i++) {
      for (let j = 0; j < this.horizontalKeys.length; j++) {
        const cell =
            this.getCell(this.verticalKeys[i], this.horizontalKeys[j])!;
        cell.height = rowHeights[i];
        cell.width = columnWidths[j];
        cell.innerHeight =
            cell.height - this.cellPadding.top - this.cellPadding.bottom;
        cell.innerWidth =
            cell.width - this.cellPadding.left - this.cellPadding.right;
      }
    }

    // Fill in cell positions.
    const margin = this.cellMargin * this.itemAspectRatio;
    for (let i = 0; i < this.verticalKeys.length; i++) {
      for (let j = 0; j < this.horizontalKeys.length; j++) {
        const cell =
            this.getCell(this.verticalKeys[i], this.horizontalKeys[j])!;
        if (i) {
          const prevRow =
              this.getCell(this.verticalKeys[i - 1], this.horizontalKeys[j])!;
          // TODO(jimbo): Investigate replacing the non-null assertion (!)
          // with a runtime check.
          // If you are certain the expression is always non-null/undefined,
          // remove this comment.
          cell.y = prevRow.y! + rowHeights[i - 1] + margin;
        } else {
          cell.y = 0;
        }
        cell.contentY = cell.y + this.cellPadding.bottom;
        if (j) {
          const prevColumn =
              this.getCell(this.verticalKeys[i], this.horizontalKeys[j - 1])!;
          // TODO(jimbo): Investigate replacing the non-null assertion (!)
          // with a runtime check.
          // If you are certain the expression is always non-null/undefined,
          // remove this comment.
          cell.x = prevColumn.x! + columnWidths[j - 1] + margin;
        } else {
          cell.x = 0;
        }
        cell.contentX = cell.x + this.cellPadding.left;
      }
    }

    // Compute overall width and height of grid.
    this.eachCell(cell => {
      // TODO(jimbo): Investigate replacing the non-null assertion (!) with
      // a runtime check.
      // If you are certain the expression is always non-null/undefined, remove
      // this comment.
      this.width = Math.max(this.width, cell.x! + cell.width!);
      // TODO(jimbo): Investigate replacing the non-null assertion (!) with
      // a runtime check.
      // If you are certain the expression is always non-null/undefined, remove
      // this comment.
      this.height = Math.max(this.height, cell.y! + cell.height!);
    });

    // Use cell positions to set each item's position.
    this.positionItems();
  }

  /**
   * Position each item in each cell. This uses the computeItemPosition() method
   * to get the relative X and Y coordinates for each item, and uses the
   * itemPositionSetter() method to set the absolute X and Y.
   */
  positionItems() {
    this.eachCell(cell => {
      // The maximum allowable X and Y values must account for the size of the
      // items being displayed, characterized by itemAspectRatio.
      // TODO(jimbo): Investigate replacing the non-null assertion (!) with
      // a runtime check.
      // If you are certain the expression is always non-null/undefined, remove
      // this comment.
      const width = Math.max(0, cell.innerWidth! - this.itemAspectRatio);
      // TODO(jimbo): Investigate replacing the non-null assertion (!) with
      // a runtime check.
      // If you are certain the expression is always non-null/undefined, remove
      // this comment.
      const height = Math.max(0, cell.innerHeight! - 1);

      // Create a copy of items, then sort if there is a comparator.
      const items = cell.items.slice(0);
      if (this.cellItemComparator) {
        items.sort(this.cellItemComparator);
      }

      for (let i = 0; i < items.length; i++) {
        // First, compute the desired item position.
        const computed = this.computeItemPosition(items[i], i, cell, this);

        // Clamp the X and Y coordinates to the range from 0-1.
        // TODO(jimbo): What to do with NaNs? Currently casting to 0.
        const x = !computed || isNaN(computed.x) ?
            0 :
            Math.max(0, Math.min(1, computed.x));
        const y = !computed || isNaN(computed.y) ?
            0 :
            Math.max(0, Math.min(1, computed.y));

        // Set the item position within the cell's content area.
        // TODO(jimbo): Investigate replacing the non-null assertion (!)
        // with a runtime check.
        // If you are certain the expression is always non-null/undefined,
        // remove this comment.
        this.itemPositionSetter(
            items[i], cell.contentX! + x * width, cell.contentY! + y * height);
      }
    });
  }

  /**
   * Apply faceting functions to each item to put them into their proper cells.
   */
  facetItemsIntoCells() {
    this.clear();

    // Perform faceting on each item, assigning each to the correct Cell.
    this.eachItem(item => {
      const cell = this.getOrCreateCell(
          this.verticalFacet(item)!, this.horizontalFacet(item)!);
      cell.items.push(item);
      this.longestCellLength =
          Math.max(this.longestCellLength, cell.items.length);
    });

    // Create vertical and horizontal key lists and sort them.
    for (const hashKey in this.verticalKeysHash) {
      this.verticalKeys.push(this.verticalKeysHash[hashKey]);
    }
    this.verticalKeys.sort(this.verticalKeyCompare);
    for (const hashKey in this.horizontalKeysHash) {
      this.horizontalKeys.push(this.horizontalKeysHash[hashKey]);
    }
    this.horizontalKeys.sort(this.horizontalKeyCompare);
  }

  /**
   * Call the provided function once for each item in items.
   */
  eachItem(callback: (item: Item) => any) {
    if (!this.items) {
      return;
    }
    for (let i = 0; i < this.items.length; i++) {
      callback.call(this, this.items[i]);
    }
  }

  /**
   * Call the provided function once for each cell in the grid.
   */
  eachCell(callback: (cell: Cell) => any) {
    for (const key in this.cells) {
      callback.call(this, this.cells[key])
    }
  }

  /**
   * Given a pair of vertical and horizontal keys, return a single compound
   * key which can be used to look up the cell with those keys in the hash.
   */
  getCompoundKey(verticalKey: Key, horizontalKey: Key) {
    return (typeof verticalKey) + UNIT_SEPARATOR + verticalKey +
        RECORD_SEPARATOR + (typeof horizontalKey) + UNIT_SEPARATOR +
        horizontalKey;
  }

  /**
   * Given a particular pair of vertical and horizontal keys, get the Cell
   * with those keys. If there isn't one, return null.
   */
  getCell(verticalKey: Key, horizontalKey: Key): Cell|null {
    const compoundKey = this.getCompoundKey(verticalKey, horizontalKey);
    return compoundKey in this.cells ? this.cells[compoundKey] : null;
  }

  /**
   * Get an array of all cells.
   */
  getCells() { return Object.keys(this.cells).map(key => this.cells[key]); }

  /**
   * Given a particular pair of vertial and horizontal faceting keys, get the
   * Cell with those keys. If there isn't one, create it, insert it, and then
   * return it.
   */
  getOrCreateCell(verticalKey: Key, horizontalKey: Key): Cell {
    let cell = this.getCell(verticalKey, horizontalKey);
    if (cell) {
      return cell;
    }
    this.addVerticalKey(verticalKey);
    this.addHorizontalKey(horizontalKey);
    const compoundKey = this.getCompoundKey(verticalKey, horizontalKey);
    cell = {verticalKey, horizontalKey, compoundKey, items: [], siblings: {}};
    this.cells[compoundKey] = cell;
    return cell;
  }

  /**
   * Given a particular vertical key, return the row of Cells with that key,
   * ordered by their horizontal key.
   */
  getRow(verticalKey: Key): Cell[] {
    const row: Cell[] = [];
    for (let i = 0; i < this.horizontalKeys.length; i++) {
      const cell = this.getCell(verticalKey, this.horizontalKeys[i]);
      if (cell) {
        row.push(cell);
      }
    }
    return row;
  }

  /**
   * Given a particular horizontal key, return the column of Cells with that
   * key, ordered by their horizontal key.
   */
  getColumn(horizontalKey: Key): Cell[] {
    const column: Cell[] = [];
    for (let i = 0; i < this.verticalKeys.length; i++) {
      const cell = this.getCell(this.verticalKeys[i], horizontalKey);
      if (cell) {
        column.push(cell);
      }
    }
    return column;
  }

  /**
   * Add a vertical key to the verticalKeysHash.
   */
  addVerticalKey(verticalKey: Key) {
    const key = (typeof verticalKey) + UNIT_SEPARATOR + verticalKey;
    if (!(key in this.verticalKeysHash)) {
      this.verticalKeysHash[key] = verticalKey;
    }
  }

  /**
   * Add a horizontal key to the horizontalKeys array, return its index.
   */
  addHorizontalKey(horizontalKey: Key) {
    const key = (typeof horizontalKey) + UNIT_SEPARATOR + horizontalKey;
    if (!(key in this.horizontalKeysHash)) {
      this.horizontalKeysHash[key] = horizontalKey;
    }
  }

  /**
   * Given an overall target aspect ratio for the whole grid, compute the
   * optimal cell aspect ratio to use to achieve it.
   *
   * This algorithm proposes a cell aspect ratio to inform item stacking, then
   * measures what the overall grid aspect ratio would be if the proposed cell
   * aspect ratio was chosen. So the more items there are in the cells of the
   * grid, the more flexibility there is, and the better the computed optimal
   * cell aspect ratio will be.
   *
   * Since any non-empty cell has a minimum possible width and height, it may be
   * that the final grid aspect ratio differs noticeably from the target,
   * irrespective of the cell aspect ratio.
   *
   * @param targetGridAspectRatio The desired overall grid aspect ratio.
   */
  computeOptimalCellAspectRatio(targetGridAspectRatio: number): number {
    const numRows = this.verticalKeys.length;
    const numColumns = this.horizontalKeys.length;

    if (!numRows || !numColumns) {
      return 1;
    }

    // Start with a naive guess that ignores the effect of margins.
    let proposedCellAspectRatio = numRows / numColumns;
    let bestCellAspectRatio = proposedCellAspectRatio;

    const epsilon = 0.001;
    let bestErr = Infinity;

    // Keep track of the lowest and highest possible cell aspect ratios as we
    // search. The algorithm doubles its initial estimate until a highBound is
    // discovered, and performs a binary search after that.
    let lowBound = 0;
    let highBound = Infinity;

    // Limit the number of optimization attempts so that we don't go over the
    // maximum, but otherwise try the greater of the number of rows, columns, or
    // items in the largest cell.
    const maxAttempts = Math.min(
        MAX_OPTIMIZATION_ATTEMPTS,
        Math.max(numRows, numColumns, this.longestCellLength));

    let attempts = 0;
    while (attempts < maxAttempts) {
      attempts++;

      const computedGridAspectRatio =
          this.computeGridAspectRatio(proposedCellAspectRatio);
      const err =
          Math.abs(1 - (computedGridAspectRatio / targetGridAspectRatio));

      if (err < bestErr) {
        bestCellAspectRatio = proposedCellAspectRatio;
        bestErr = err;
      }

      if (err < epsilon) {
        break;
      }

      if (computedGridAspectRatio > targetGridAspectRatio) {
        // If the computed grid aspect ratio is too high, that means our
        // proposed cell aspect ratio is too high and we should lower it.
        highBound = proposedCellAspectRatio;
        proposedCellAspectRatio -= (highBound - lowBound) / 2;
      } else {
        // When the computed aspect ratio is too low, that means our proposed
        // cell aspect ratio is too low and we should raise it.
        lowBound = proposedCellAspectRatio;
        if (isFinite(highBound)) {
          proposedCellAspectRatio += (highBound - lowBound) / 2;
        } else {
          proposedCellAspectRatio *= 2;
        }
      }
    }

    return bestCellAspectRatio;
  }

  /**
   * Given a proposed cell aspect ratio, compute what the overall grid aspect
   * ratio would be, taking settings into account.
   */
  computeGridAspectRatio(proposedCellAspectRatio: number): number {
    const numRows = this.verticalKeys.length;
    const numColumns = this.horizontalKeys.length;

    // These values are used in computing the grid aspect ratio when the grid
    // alignment is row dominant, column dominant or uniform.
    const rowHeights: number[] = [];
    const columnWidths: number[] = [];

    let maxRowWidth = -Infinity;
    let maxRowHeight = -Infinity;
    let maxColumnWidth = -Infinity;
    let maxColumnHeight = -Infinity;

    // Keep track of the cumulative cell sizes, adding widths across columns and
    // heights across rows. These values are used to determine the widest row
    // and tallest column.
    const cumulativeCellSizes: {height: number, width: number}[][] = [];

    // Compute the individual and maximum row widths and column heights.
    for (let i = 0; i < numRows; i++) {
      cumulativeCellSizes[i] = [];

      for (let j = 0; j < numColumns; j++) {
        const cumulativeCellSize = cumulativeCellSizes[i][j] = {
          width: j ? cumulativeCellSizes[i][j - 1].width : 0,
          height: i ? cumulativeCellSizes[i - 1][j].height : 0,
        };

        const cell = this.getCell(this.verticalKeys[i], this.horizontalKeys[j]);

        if (!cell || !cell.items || !cell.items.length) {
          continue;
        }

        const [cellWidth, cellHeight] = this.computeCellDimensions(
            proposedCellAspectRatio, cell.items.length);

        columnWidths[j] = Math.max(columnWidths[j] || 0, cellWidth);
        rowHeights[i] = Math.max(rowHeights[i] || 0, cellHeight);

        // Update cumulative cell width/height.
        cumulativeCellSize.width += cellWidth;
        cumulativeCellSize.height += cellHeight;

        // Update maximums.
        maxRowWidth = Math.max(maxRowWidth, cumulativeCellSize.width);
        maxRowHeight = Math.max(maxRowHeight, cellHeight);
        maxColumnWidth = Math.max(maxColumnWidth, cellWidth);
        maxColumnHeight = Math.max(maxColumnHeight, cumulativeCellSize.height);
      }
    }

    // When using Uniform alignment, the true maxRowWidth will be the width of
    // the widest column times the number of columns. Likewise, the true
    // maxColumnHeight will be the height of the tallest row times the number
    // of rows.
    if (this.verticalGridAlignment === GridAlignment.Uniform) {
      maxColumnHeight = maxRowHeight * numRows;
    }
    if (this.horizontalGridAlignment === GridAlignment.Uniform) {
      maxRowWidth = maxColumnWidth * numColumns;
    }

    // TODO(jimbo): Use columnWidths/rowHeights + grid alignment once available.

    const totalMargin = this.cellMargin * this.itemAspectRatio;
    const totalWidth = maxRowWidth + totalMargin * (numColumns - 1);
    const totalHeight = maxColumnHeight + totalMargin * (numRows - 1);

    return totalWidth / totalHeight;
  }

  /**
   * Compute the size of a cell, given the cell's aspect ratio and the number
   * of items it has.
   */
  computeCellDimensions(cellAspectRatio: number, itemCount: number): number[] {
    const dimensions = [
      this.itemAspectRatio * (this.cellPadding.left + this.cellPadding.right),
      this.itemAspectRatio * (this.cellPadding.top + this.cellPadding.bottom)
    ];

    // Short-circuit if there are no items.
    if (!itemCount) {
      return dimensions;
    }

    // Compute the width of the cell as measured in items.
    const cellItemWidth = Math.min(
        itemCount,
        Math.ceil(
            Math.sqrt(cellAspectRatio * itemCount) / this.itemAspectRatio));

    // Compute full cell width and height, accounting for item aspect ratio.
    dimensions[0] += this.itemAspectRatio * cellItemWidth;
    dimensions[1] += Math.ceil(itemCount / cellItemWidth);
    return dimensions;
  }
}
