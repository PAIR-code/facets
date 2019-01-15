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
 * @fileoverview A SpriteAtlas is a THREE.js Texture that handles the backing
 * image data for a collection of Sprites.
 */
import {TextFitter} from './text';

declare var THREE: any;

export interface SpriteImageData {
  /**
   * The type of data. E.g. 'image/png' or 'text'.
   */
  type: string;

  /**
   * Data content, like base64 encoded PNG or the text to be drawn.
   */
  data: string;

  /**
   * For text, whether this value is a special value (will be in italics).
   */
  special?: boolean;
}

/**
 * Jobs in the SpriteAtlas's draw queue. These jobs will either be to create
 * Images from data, or to draw created Images to the canvas.
 */
export interface DrawJob {
  /**
   * Index of the sprite we're working on.
   */
  spriteIndex: number;

  /**
   * When this job went on the queue.
   */
  timestamp: number;

  /**
   * Incoming data about the image to draw.
   */
  imageData?: SpriteImageData;

  /**
   * Actual Image object for the image data. Creating this is severely slow
   * on Chrome/Linux, so we do the jobs separately.
   */
  image?: HTMLImageElement;

  /**
   * Optional (but recommended) callback to execute when the draw job finishes.
   */
  callback?: (spriteIndex: number) => any;
}

/**
 * Default amount of time to spend drawing before ceding control back to the UI
 * thread. 16 ms = ~60 FPS.
 */
const DEFAULT_DRAW_TIMEOUT = 50;  // ~20 FPS.

/**
 * Default amount of time to wait in ms before next draw. We use setTimeout
 * instead of requestAnimationFrame so that the visualization will keep working
 * on drawing queued images if the user switches tabs.
 */
const DEFAULT_WAIT_TIMEOUT = 1;

/**
 * Font family to use when rendering text.
 */
const FONT_FAMILY = `'Roboto Mono', 'Consolas', 'Menlo', monospace`;

/**
 * Amount of padding as a proportion of sprite size to preserve within sprite
 * when rendering text.
 */
const TEXT_PADDING = 0.125;

/**
 * A SpriteAtlas is a dynamic texture atlas which holds image data for the
 * Sprites of a SpriteMesh. It is backed by a <canvas> elment which individual
 * Sprite image data is drawn into.
 *
 * The width and height of the atlas are both roughly the square root of the
 * capacity times the sprite width and height respectively. Each sprite gets
 * a parcel of the atlas space based on its index, starting with the first
 * sprite (index 0) at the top-left hand corner, then proceeding across and
 * down.
 *
 * Consider a typical scenario consisting of 10,000 sprites of size 32x32.
 *
 *               |.32px..|
 *
 *      -        +-------+-------+-------+- - - -+-------+     -
 *      .        |       |       |       |       |       |     .
 *      .        |   0   |   1   |   2   |  ...  |   99  |    32px
 *      .        |       |       |       |       |       |     .
 *      .        +-------+-------+-------+- - - -+-------+     -
 *      .        |       |       |       |       |       |
 *      .        |  100  |  101  |  102  |  ...  |  199  |
 *      .        |       |       |       |       |       |
 *   3,200px     +-------+-------+-------+- - - -+-------+
 *      .        |       |       |       |       |       |
 *      .           ...     ...     ...     ...     ...
 *      .        |       |       |       |       |       |
 *      .        +-------+-------+-------+- - - -+-------+
 *      .        |       |       |       |       |       |
 *      .        | 9,900 | 9,901 | 9,902 |  ...  | 9,999 |
 *      .        |       |       |       |       |       |
 *      -        +-------+-------+-------+- - - -+-------+
 *
 *               |. . . . . . . . 3,200px . . . . . . . .|
 *
 * Given the index of a sprite, we can determine the coordinates of its parcel
 * of the atlas. Meanwhile, the SpriteMaterial's vertex shader can compute the
 * UVs for each sprite vertex.
 */
export class SpriteAtlas extends THREE.Texture {
  // SETTINGS.

  /**
   * How many sprites this texture can hold.
   */
  capacity: number;

  /**
   * Width of one sprite backing image in pixels.
   */
  imageWidth: number;

  /**
   * Height of one sprite backing image in pixels.
   */
  imageHeight: number;

  /**
   * Amount of time in ms to spend drawing images to the backing canvas before
   * ceding control back to the UI thread. Setting this to zero disables the
   * timeout. See DEFAULT_DRAW_TIMEOUT.
   */
  drawTimeout: number;

  /**
   * Amount of time in ms to wait between batches of drawing images.
   * See DEFAULT_WAIT_TIMEOUT.
   */
  waitTimeout: number;

  // READ-ONLY PROPERTIES.

  /**
   * Backing canvas for the texture atlas.
   */
  canvas: HTMLCanvasElement;

  /**
   * 2D context for drawing onto the backing canvas.
   */
  context: CanvasRenderingContext2D;

  /**
   * Number of rows of sprites from top to bottom.
   */
  spriteRows: number;

  /**
   * Number of columns of sprites from left-to-right.
   */
  spriteColumns: number;

  /**
   * Queue of sprite images to draw asynchronously.
   */
  drawQueue: DrawJob[];

  /**
   * Whether a call to draw images has been queued.
   */
  isDrawQueued: boolean;

  /**
   * In the case of an incoming montage, or other cancellation, we don't want
   * any queued draw jobs or outstanding event handlers to run. So we keep track
   * of the last time a request to clear was set, so that any draw jobs before
   * it are ignored.
   */
  lastClearTimestamp: number;

  /**
   * Callbacks and their arguments that are ready to be invoked at the next
   * available time after the texture has been flushed to the GPU.
   */
  callbackQueue: Array < {
    callback: (...args: any[]) => any;
    args: any[];
  }
  > ;

  /**
   * Callback handler to invoke when finished drawing all queued images.
   */
  onDrawFinished?: () => any;

  /**
   * Number of Images which are currently in flight to be loaded. This number
   * increases when we create images, and decreases when they either load or
   * error out.
   */
  pendingImageCount: number;

  // PRIVATE.

  /**
   * TextFitter object used for fitting text into sprites.
   */
  fitter: TextFitter;

  constructor(capacity: number, imageWidth: number, imageHeight: number) {
    const spriteColumns = Math.ceil(Math.sqrt(capacity));
    const spriteRows = Math.ceil(capacity / spriteColumns);

    const canvas = document.createElement('canvas');
    canvas.width = imageWidth * spriteColumns;
    canvas.height = imageHeight * spriteRows;

    const context = canvas.getContext('2d')!;

    super(canvas);

    this.capacity = capacity;

    this.imageWidth = imageWidth;
    this.imageHeight = imageHeight;

    this.spriteColumns = spriteColumns;
    this.spriteRows = spriteRows;

    this.canvas = canvas;
    this.context = context;

    this.minFilter = THREE.LinearFilter;
    this.magFilter = THREE.LinearFilter;

    this.drawTimeout = DEFAULT_DRAW_TIMEOUT;
    this.waitTimeout = DEFAULT_WAIT_TIMEOUT;
    this.drawQueue = [];
    this.isDrawQueued = false;
    this.lastClearTimestamp = 0;

    this.callbackQueue = [];

    this.pendingImageCount = 0;

    this.fitter = new TextFitter({
      x: imageWidth * TEXT_PADDING,
      y: imageHeight * TEXT_PADDING,
      width: imageWidth * (1 - 2 * TEXT_PADDING),
      height: imageHeight * (1 - 2 * TEXT_PADDING),
    });
  }

  /**
   * Clear out the draw queue, the callback queue, and update the last clear
   * timeout, which is also the returned value. This prevents any outstanding
   * images from performing actions on completion as well.
   */
  clearQueues(): number {
    this.drawQueue = [];
    this.callbackQueue = [];
    this.pendingImageCount = 0;
    return this.lastClearTimestamp = Date.now();
  }

  /**
   * Set the given sprite's image data asynchronously and call the callback when
   * finished.
   */
  setSpriteImageData(
      spriteIndex: number, imageData: SpriteImageData,
      callback?: (spriteIndex: number) => any) {
    this.drawQueue.push(
        {spriteIndex, timestamp: Date.now(), imageData, callback});
    this.queueDraw();
  }

  /**
   * Given a URL to a image image, load that image and draw its pixels to the
   * entire backing canvas.
   */
  setAtlasUrl(
      atlasUrl: string, crossOrigin?: string,
      callback?: (image: HTMLImageElement) => any) {
    const ts = this.clearQueues();
    const image = new Image();
    if (crossOrigin !== undefined) {
      image.crossOrigin = crossOrigin;
    }
    this.pendingImageCount++;
    image.onerror = () => {
      // TODO(jimbo): Express failures through the callback?
      if (this.lastClearTimestamp > ts) {
        // Something else triggered a clear while the image was being loaded.
        return;
      }
      this.pendingImageCount--;
    };
    image.onload = () => {
      // TODO(jimbo): Express failures through the callback?
      if (this.lastClearTimestamp > ts) {
        // Something else triggered a clear while the image was being loaded.
        return;
      }
      this.pendingImageCount--;

      this.updatePropertiesToMatchImageDimensions(image.width, image.height);

      this.context.drawImage(
          image, 0, 0, this.canvas.width, this.canvas.height);
      this.needsUpdate = true;
      if (callback) {
        this.callbackQueue.push({callback, args: [image]});
      }
      if (this.onDrawFinished) {
        this.onDrawFinished();
      }
    };
    image.src = atlasUrl;
  }

  /**
   * Given the width and height of an incoming atlas image to render, update
   * internal properties, including cavnas dimensions, to match.
   *
   * If the image is already the correct size, then no changes to internal state
   * should be made. If the image is large enough, but does not match with the
   * current number of sprites per row/column, then those properties will be
   * updated.
   *
   * If the image is too small to accomodate the specified sprite capacity, or
   * if the geometry of the image is not a whole number of sprites, then an
   * error will be thrown.
   */
  updatePropertiesToMatchImageDimensions(width: number, height: number) {
    if (width === this.imageWidth * this.spriteColumns &&
        height === this.imageHeight * this.spriteRows) {
      return;
    }

    const spriteColumns = width / this.imageWidth;
    const spriteRows = height / this.imageHeight;

    if (spriteColumns * spriteRows < this.capacity) {
      throw Error('Atlas image too small to accommodate atlas capacity.');
    }

    if (spriteColumns !== Math.round(spriteColumns) ||
        spriteRows !== Math.round(spriteRows)) {
      throw Error('Atlas image dimensions do not fit sprite image dimensions.');
    }

    this.spriteColumns = spriteColumns;
    this.spriteRows = spriteRows;
    this.canvas.width = width;
    this.canvas.height = height;
  }

  /**
   * Perform post-rendering tasks. This should be called by upstream users of
   * the texture at a time after the texture has been successfully uploaded to
   * the GPU.
   */
  postRender() {
    // Short-circuit if there are any outstanding tasks.
    if (this.drawQueue.length || this.pendingImageCount > 0) {
      return;
    }
    // Dequeue all callbacks.
    while (this.callbackQueue.length) {
      const {callback, args} = this.callbackQueue.shift()!;
      callback.apply(null, args);
    }
  }

  /**
   * Queue up a future call to drawImages().
   */
  queueDraw() {
    if (this.isDrawQueued) {
      return;
    }
    this.isDrawQueued = true;
    setTimeout(() => {
      if (this.isDrawQueued) {
        this.workOnDrawJobs();
      }
    }, this.waitTimeout);
  }

  /**
   * Fulfill as many draw jobs as possible within the allowed time.
   */
  workOnDrawJobs() {
    this.isDrawQueued = false;

    const ts = Date.now();
    const stopTime = ts + (this.drawTimeout || Infinity);

    while (this.drawQueue.length && Date.now() < stopTime) {
      const {spriteIndex, timestamp, imageData, image, callback} =
          this.drawQueue.shift() as DrawJob;

      if (image) {
        // Image has loaded, draw it and add its callback to the queue.
        const width = this.imageWidth;
        const height = this.imageHeight;
        const x = width * (spriteIndex % this.spriteColumns);
        const y = height * Math.floor(spriteIndex / this.spriteColumns);
        this.context.clearRect(x, y, width, height);
        this.context.drawImage(image, x, y, width, height);

        if (typeof callback === 'function') {
          this.callbackQueue.push({callback, args: [spriteIndex]});
        }

      } else if (imageData && imageData.type === 'text') {
        // Draw text directly to the backing canvas and add its callback to the
        // queue.
        const offsetX = this.imageWidth * (spriteIndex % this.spriteColumns);
        const offsetY =
            this.imageHeight * Math.floor(spriteIndex / this.spriteColumns);

        const cx = offsetX + this.imageWidth / 2;
        const cy = offsetY + this.imageHeight / 2;

        const specs = this.fitter.fit(imageData.data + '');

        const ctx = this.context;

        ctx.clearRect(offsetX, offsetY, this.imageWidth, this.imageHeight);

        // Use translate and scale to draw an ellipse.
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(this.imageWidth, this.imageHeight);
        ctx.beginPath();
        ctx.arc(0, 0, 0.5, 0, 2 * Math.PI);
        ctx.restore();

        ctx.fillStyle = '#555555';
        ctx.fill();

        ctx.fillStyle = 'white';
        ctx.textBaseline = 'hanging';
        const fontStyle = imageData.special ? 'italic' : 'bold';
        ctx.font = `${fontStyle} ${specs.fontSize}px ${FONT_FAMILY}`;
        const lines = specs.lines;
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          // If you are certain the expression is always non-null/undefined,
          // remove this comment.
          const textWidth = line.text.length *
              this.fitter.settings.glyphAspectRatio! * specs.fontSize;
          ctx.fillText(
              line.text, offsetX + line.x, offsetY + line.y, textWidth);
        }


        if (typeof callback === 'function') {
          this.callbackQueue.push({callback, args: [spriteIndex]});
        }

      } else if (imageData) {
        // Create an image from the data and queue up a draw when it loads.
        const image = new Image();
        this.pendingImageCount++;
        image.onload = () => {
          // Short-circuit if state has been cleared while this was loading.
          if (ts < this.lastClearTimestamp) {
            return;
          }
          this.pendingImageCount--;
          // Move it to the front of the line. Already waited once.
          this.drawQueue.unshift({spriteIndex, timestamp, image, callback});
          this.queueDraw();
        };
        image.onerror = () => {
          // Short-circuit if state has been cleared while this was loading.
          if (ts < this.lastClearTimestamp) {
            return;
          }
          this.pendingImageCount--;
          // Try again later.
          // TODO(jimbo): Limit the number of times to retry.
          this.drawQueue.push({spriteIndex, timestamp, imageData, callback});
          this.queueDraw();
        };

        // Setting the image src seems to be quite expensive, especially on
        // Linux. Setting the image content from data appears to be a
        // synchronous operation that must be done on the UI thread.
        if (imageData.type === 'svg') {
          const svg =
              new Blob([imageData.data], {type: 'image/svg+xml;charset=utf-8'});
          image.src = URL.createObjectURL(svg);
        } else {
          image.src = `data:${imageData.type};base64,${imageData.data}`;
        }
      }
    }

    if (this.drawQueue.length || this.pendingImageCount > 0) {
      this.queueDraw();
    } else {
      this.needsUpdate = true;
      if (this.onDrawFinished) {
        this.onDrawFinished();
      }
    }
  }
}
