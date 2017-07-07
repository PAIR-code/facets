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
 * @fileoverview Types and utilities for working with visisble objects that have
 * bounds that must be honored during layout. Examples include Axes and Labels,
 * which may be too small to be visible, or should reduce the available space
 * for other visual elements.
 */

/**
 * On which side of a given context object should another object appear. For
 * example, a label might appear to the Left of the thing it labels.
 */
export enum Side {
  Bottom,
  Left,
  Right,
  Top,
}

/**
 * The position of the camera in world space. Used when determining whether a
 * bounded object should be visible.
 */
export interface CameraPosition {
  x: number;
  y: number;
}

/**
 * A bounding box contains the world coordinates of a box in which a pixel-based
 * element must fit. That is, given an element with certain pixel-measured
 * height and width requirements, a BoundingBox object describes the world-space
 * area in which it should be placed.
 */
export interface BoundingBox {
  bottom: number;
  left: number;
  right: number;
  top: number;
}

/**
 * The margin around an element that we wish to maintain, beyond the space
 * necessary to draw the object. These are measured in pixels.
 */
export interface ElementMargin {
  bottom: number;
  left: number;
  right: number;
  top: number;
}

/**
 * A bounded object is one which could potentially have a bounding box or
 * minimum scale for display. Examples are labels and axes.
 */
export class BoundedObject {
  /**
   * Minimum scale at which this object can be viewed. If the screen scale
   * is any smaller, then this label will not be visible.
   */
  minScale?: number;

  /**
   * Bounding box in world coordinates in which this object must fit. Using
   * minScale is preferred, but if the size of the element is not known in
   * advance this offers an alternative.
   */
  boundingBox?: BoundingBox;

  /**
   * Whether to scale down this object if the current scale is less than its
   * specified minScale. If this value is false/undefined, then when the scale
   * is less than the specified minScale, this object should be hidden from
   * view.
   */
  scaleDown?: boolean;

  /**
   * Width in screen pixel this object should be considered to have. If not
   * present, then the actual Element's size will be used.
   */
  width?: number;

  /**
   * Height in pixels that this object should be considered to have. If not
   * present, then the actual computed height of the Element will be used.
   */
  height?: number;

  /**
   * Amount of margin to leave around the element when computing how much
   * space it needs.
   */
  elementMargin?: ElementMargin;

  /**
   * Whether this bounded object should be visible. Calculated by checking
   * the minScale and/or boundingBox against the current scale.
   */
  visible?: boolean;

  /**
   * Given the current state of the visualization, should this bounded object be
   * visible on screen?
   */
  shouldBeVisible(
      elem: Element, scale: number, cameraPosition: CameraPosition,
      cameraBounds: BoundingBox): boolean {
    // Check minScale first, if present.
    if (this.minScale !== undefined) {
      return this.scaleDown || scale >= this.minScale;
    }

    // If the object has no specific bounding box, then we treat it as visible.
    if (!this.boundingBox) {
      return true;
    }

    // Check that at least part of the bounding box is within the camera's
    // frustum.
    const box = this.boundingBox;
    if (box.left > (cameraPosition.x + cameraBounds.right) ||
        box.right < (cameraPosition.x + cameraBounds.left) ||
        box.bottom > (cameraPosition.y + cameraBounds.top) ||
        box.top < (cameraPosition.y + cameraBounds.bottom)) {
      return false;
    }

    const margin = this.elementMargin || {bottom: 0, left: 0, right: 0, top: 0};

    // Now check whether the bounded object fits.
    const screenWidth = this.width === undefined ?
        elem.getBoundingClientRect().width + margin.left + margin.right :
        this.width;
    const screenHeight = this.height === undefined ?
        elem.getBoundingClientRect().height + margin.top + margin.bottom :
        this.height;
    const boxWidth = isFinite(box.left) && isFinite(box.right) ?
        box.right - box.left :
        Infinity;
    const boxHeight = isFinite(box.top) && isFinite(box.bottom) ?
        box.top - box.bottom :
        Infinity;
    return boxWidth * scale >= screenWidth && boxHeight * scale >= screenHeight;
  }
}
