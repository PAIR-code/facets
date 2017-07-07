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
 * @fileoverview Tools for computing layout related values, such as the camera's
 * frustum boundaries and position.
 */

export interface Size {
  height: number;
  width: number;
}

export interface Rect {
  bottom: number;
  left: number;
  right: number;
  top: number;
}

/**
 * To place a camera above the scene, we need to know its position in world
 * coordinates and its frustum boundaries.
 */
export interface Camera {
  position: {x: number; y: number;};
  frustum: Rect;
}

export class Layout {
  /**
   * Positions in world coordinates of the bounds of the underlying grid
   * visualization.
   */
  grid: Rect;

  /**
   * Size of the containing viewport in pixels.
   */
  viewport: Size;

  /**
   * Amount of space to be left between the visualization and viewport.
   */
  padding: Rect;

  /**
   * Initialize all measurements to zero. These will need to be set prior to
   * calling any of the compute methods, or you'll get NaN results.
   */
  constructor() {
    this.grid = {bottom: 0, left: 0, right: 0, top: 0};
    this.viewport = {height: 0, width: 0};
    this.padding = {bottom: 0, left: 0, right: 0, top: 0};
  }

  /**
   * Compute the scale to fit the grid into the viewport, leaving the
   * specified amount of room for padding.
   */
  computeScale(): number {
    const effectiveWidth =
        this.viewport.width - this.padding.left - this.padding.right;
    const effectiveHeight =
        this.viewport.height - this.padding.top - this.padding.bottom;

    // If the viewport is smaller than the space required for padding, then
    // the scale cannot be meaningfully computed.
    if (isNaN(effectiveWidth) || effectiveWidth <= 0 ||
        isNaN(effectiveHeight) || effectiveHeight <= 0) {
      return NaN;
    }

    const effectiveAspect = effectiveWidth / effectiveHeight;

    const gridWidth = this.grid.right - this.grid.left;
    const gridHeight = this.grid.top - this.grid.bottom;

    // If the grid has no size, then the scale cannot be computed.
    if (isNaN(gridWidth) || gridWidth <= 0 || isNaN(gridHeight) ||
        gridHeight <= 0) {
      return NaN;
    }

    const gridAspect = gridWidth / gridHeight;

    return (
        effectiveAspect > gridAspect ? effectiveHeight / gridHeight :
                                       effectiveWidth / gridWidth);
  }

  /**
   * Compute the camera position and frustum size in world coordinates so
   * that the grid fits inside the viewport with padding.
   *
   * In many applications, particularly those that use a perspective camera, the
   * view volume extends away from the camera's location. In these cases, the
   * frustum extends in all four directions (up, down, left and right).
   *
   * However, in this case, the camera's frustum extends only to the right
   * (positive X) and downwards (negative Y) because this makes the origin (0,0)
   * align in both camera and pixel coordinate space.
   *
   *            +y
   *             ^
   *             |       camera   top (0)
   *             |          @................,
   *             |          :                :
   *             |          :                :
   *             |     left :                : right
   *             |      (0) :                :  (+x)
   *             |          :                :
   *             |          :................:
   *             |              bottom (-y)
   *             |
   *  -x  <======+=============================> +x
   *             |\
   *             | world
   *             | origin
   *             |
   *             |
   *             |
   *             V
   *            -y
   *
   * This design choice makes it conceptually simpler to convert between camera
   * and pixel coordinate spaces since the camera's location relative to the
   * view box aligns with the screen's origin (top-left). All that differs
   * is the scale and y inversion.
   */
  computeCamera(): Camera {
    const scale = this.computeScale();

    // If the scale cannot be computed, neither can the camera properties.
    if (isNaN(scale) || scale <= 0) {
      return {
        position: {x: NaN, y: NaN},
        frustum: {bottom: NaN, left: NaN, right: NaN, top: NaN}
      };
    }

    const gridWidth = this.grid.right - this.grid.left;
    const gridHeight = this.grid.top - this.grid.bottom;
    const worldWidth = this.viewport.width / scale;
    const worldHeight = this.viewport.height / scale;
    const paddingWidth = (this.padding.left + this.padding.right) / scale;
    const paddingHeight = (this.padding.top + this.padding.bottom) / scale;

    // To center horizontally and vertically, we take half the excess space.
    const horizontalMargin = (worldWidth - paddingWidth - gridWidth) / 2;
    const verticalMargin = (worldHeight - paddingHeight - gridHeight) / 2;

    return {
      position: {
        x: this.grid.left - horizontalMargin - this.padding.left / scale,
        y: this.grid.top + verticalMargin + this.padding.top / scale,
      },
      frustum: {bottom: -worldHeight, left: 0, right: worldWidth, top: 0}
    };
  }

  /**
   * If the combined left and right padding would exceed the specified minimum
   * width, this would leave no room for the grid. In that case, we want to
   * trade off padding proportionally.
   */
  reducePaddingToFitWidth(rectWidth: number, minWidth: number) {
    if (minWidth > rectWidth) {
      this.padding.left = 0;
      this.padding.right = 0;
    } else if (this.padding.left + this.padding.right + minWidth > rectWidth) {
      const paddingWidth = this.padding.left + this.padding.right;
      const availableWidth = rectWidth - minWidth;
      this.padding.left =
          (this.padding.left / paddingWidth * availableWidth) || 0;
      this.padding.right =
          (this.padding.right / paddingWidth * availableWidth) || 0;
    }
  }

  /**
   * If the combined top and bottom padding would exceed the specified minimum
   * height, this would leave no room for the grid. In that case, we want to
   * trade off padding proportionally.
   */
  reducePaddingToFitHeight(rectHeight: number, minHeight: number) {
    if (minHeight > rectHeight) {
      this.padding.top = 0;
      this.padding.bottom = 0;
    } else if (
        this.padding.top + this.padding.bottom + minHeight > rectHeight) {
      const paddingHeight = this.padding.top + this.padding.bottom;
      const availableHeight = rectHeight - minHeight;
      this.padding.top =
          (this.padding.top / paddingHeight * availableHeight) || 0;
      this.padding.bottom =
          (this.padding.bottom / paddingHeight * availableHeight) || 0;
    }
  }
}
