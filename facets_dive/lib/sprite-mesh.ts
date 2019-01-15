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
 * @fileoverview A SpriteMesh is a THREE.js Mesh that handles the creation and
 * properties of a collection of Sprites.
 *
 * Because a SpriteMesh is meant to be rendered using a THREE.js WebGLRenderer
 * and has a custom SpriteMaterial, the details of this implementation are very
 * vertex-centric. The downside of this is that data ends up being repeated, but
 * the upside is that the material's vertex shader can perform many steps in
 * parallel on the GPU.
 *
 * Animation is implemented in the vertex shader of the SpriteMaterial through
 * attributes specified in the mesh's BufferGeometry. The geometry's position
 * attribute contains vertex positions at the end of a time range, and the
 * basePosition attribute contains the vertex positions at the beginning
 * of the time range. This way, any other logic that looks at geometry positions
 * (like ray casting) will do so using the end-of-animation positions.
 */

import {SpriteAtlas, SpriteImageData} from './sprite-atlas';

import {SpriteMaterial} from './sprite-material';

export type SpriteImageData = SpriteImageData;

declare var THREE: any;

/**
 * The Sprite class acts as an object-oriented interface for interacting with
 * the underlying properties managed by the SpriteMesh.
 *
 * In order to perform animation in the shaders of the SpriteMaterial, each
 * Sprite has two states: the current state, and the starting (base) state.
 * During rendering, each property of the Sprite is interpolated between these
 * states using an easing function according to the current time.
 *
 * For example, say a sprite is moving from position (0, 0, 0) to position
 * (1, 1, 1) from time 0 to time 10. At time 5, the sprite's effective position
 * will be half way between the starting base position and the current position
 * at (.5, .5, .5).
 *
 * Although you can directly manipulate both the base and current states of a
 * sprite, it's best to use the rebase() method, which will interpolate
 * attribute properties according to the SpriteMaterial's easing.
 *
 * Say you wanted to take a brand new Sprite and move it over the next 500 ms
 * from x=0 to x=900. In that case, here's what you'd want to do:
 *
 *      // Take note of the current time and create the sprite.
 *      const now = Date.now();
 *      const sprite = spriteMesh.createSprite();
 *
 *      // Initalize property to interpolate and specify timestamp.
 *      sprite.x = 0;
 *      sprite.timestamp = now;
 *
 *      // Rebase the sprite based on the current time.
 *      sprite.rebase(now);
 *
 *      // Overwrite the property to interpolate and update the timestamp.
 *      sprite.x = 900;
 *      sprite.timestamp = now + 500;
 *
 * When the SpriteMaterial's shaders are invoked to draw the sprite at any time
 * during the next 500 ms, its x position will be interpolated between 0 and
 * 900. After that, it'll just be 900.
 *
 * The benefit to this approach is that we can interrupt the animation mid-way
 * through and specify a new current value. For example, say we suddenly want
 * to put the sprite back at x=0 (over the next 500 ms). Here are the commands
 * to make it so:
 *
 *      // Take note of the current time and rebase the sprite.
 *      const now = Date.now();
 *      sprite.rebase(now);
 *
 *      // Overwrite the property to interpolate and update the timestamp.
 *      sprite.x = 0;
 *      sprite.timestamp = now + 500;
 *
 * This works no matter how much time has passed---whether the animation is
 * ongoing or not.
 *
 * Also note that since each sprite has its own pair of starting and current
 * timestamps, each sprite can independently animate over a different period of
 * time if desired. By staggering the timestamps slightly from one sprite to the
 * next, you can produce a wave effect, rather than having them all move in
 * unison (if desired).
 */
export class Sprite {
  /**
   * The SpriteMesh to which this Sprite is attached.
   */
  private _spriteMesh: SpriteMesh;

  /**
   * The index of this sprite in its SpriteMesh.
   */
  private _spriteIndex: number;

  /**
   * A Sprite is bound to a particular SpriteMesh at a particular index.
   */
  constructor(spriteMesh: SpriteMesh, spriteIndex: number) {
    this._spriteMesh = spriteMesh;
    this._spriteIndex = spriteIndex;
  }

  public get spriteMesh(): SpriteMesh {
    return this._spriteMesh;
  }

  public get spriteIndex(): number {
    return this._spriteIndex;
  }

  public get x(): number {
    return this._spriteMesh.getX(this._spriteIndex);
  }

  public set x(x: number) {
    this._spriteMesh.setX(this._spriteIndex, x);
  }

  public get y(): number {
    return this._spriteMesh.getY(this._spriteIndex);
  }

  public set y(y: number) {
    this._spriteMesh.setY(this._spriteIndex, y);
  }

  public get z(): number {
    return this._spriteMesh.getZ(this._spriteIndex);
  }

  public set z(z: number) {
    this._spriteMesh.setZ(this._spriteIndex, z);
  }

  public get r(): number {
    return this._spriteMesh.getR(this._spriteIndex);
  }

  public set r(r: number) {
    this._spriteMesh.setR(this._spriteIndex, r);
  }

  public get g(): number {
    return this._spriteMesh.getG(this._spriteIndex);
  }

  public set g(g: number) {
    this._spriteMesh.setG(this._spriteIndex, g);
  }

  public get b(): number {
    return this._spriteMesh.getB(this._spriteIndex);
  }

  public set b(b: number) {
    this._spriteMesh.setB(this._spriteIndex, b);
  }

  public get a(): number {
    return this._spriteMesh.getA(this._spriteIndex);
  }

  public set a(a: number) {
    this._spriteMesh.setA(this._spriteIndex, a);
  }

  public get opacity(): number {
    return this._spriteMesh.getOpacity(this._spriteIndex);
  }

  public set opacity(opacity: number) {
    this._spriteMesh.setOpacity(this._spriteIndex, opacity);
  }

  public get timestamp(): number {
    return this._spriteMesh.getTimestamp(this._spriteIndex);
  }

  public set timestamp(timestamp: number) {
    this._spriteMesh.setTimestamp(this._spriteIndex, timestamp);
  }

  public get baseX(): number {
    return this._spriteMesh.getBaseX(this._spriteIndex);
  }

  public set baseX(baseX: number) {
    this._spriteMesh.setBaseX(this._spriteIndex, baseX);
  }

  public get baseY(): number {
    return this._spriteMesh.getBaseY(this._spriteIndex);
  }

  public set baseY(baseY: number) {
    this._spriteMesh.setBaseY(this._spriteIndex, baseY);
  }

  public get baseZ(): number {
    return this._spriteMesh.getBaseZ(this._spriteIndex);
  }

  public set baseZ(baseZ: number) {
    this._spriteMesh.setBaseZ(this._spriteIndex, baseZ);
  }

  public get baseR(): number {
    return this._spriteMesh.getBaseR(this._spriteIndex);
  }

  public set baseR(baseR: number) {
    this._spriteMesh.setBaseR(this._spriteIndex, baseR);
  }

  public get baseG(): number {
    return this._spriteMesh.getBaseG(this._spriteIndex);
  }

  public set baseG(baseG: number) {
    this._spriteMesh.setBaseG(this._spriteIndex, baseG);
  }

  public get baseB(): number {
    return this._spriteMesh.getBaseB(this._spriteIndex);
  }

  public set baseB(baseB: number) {
    this._spriteMesh.setBaseB(this._spriteIndex, baseB);
  }

  public get baseA(): number {
    return this._spriteMesh.getBaseA(this._spriteIndex);
  }

  public set baseA(baseA: number) {
    this._spriteMesh.setBaseA(this._spriteIndex, baseA);
  }

  public get baseOpacity(): number {
    return this._spriteMesh.getBaseOpacity(this._spriteIndex);
  }

  public set baseOpacity(baseOpacity: number) {
    this._spriteMesh.setBaseOpacity(this._spriteIndex, baseOpacity);
  }

  public get baseTimestamp(): number {
    return this._spriteMesh.getBaseTimestamp(this._spriteIndex);
  }

  public set baseTimestamp(baseTimestamp: number) {
    this._spriteMesh.setBaseTimestamp(this._spriteIndex, baseTimestamp);
  }

  public get textureIndex(): number {
    return this._spriteMesh.getTextureIndex(this._spriteIndex);
  }

  public set textureIndex(textureIndex: number) {
    this._spriteMesh.setTextureIndex(this._spriteIndex, textureIndex);
  }

  public get baseTextureIndex(): number {
    return this._spriteMesh.getBaseTextureIndex(this._spriteIndex);
  }

  public set baseTextureIndex(baseTextureIndex: number) {
    this._spriteMesh.setBaseTextureIndex(this._spriteIndex, baseTextureIndex);
  }

  public get textureTimestamp(): number {
    return this._spriteMesh.getTextureTimestamp(this._spriteIndex);
  }

  public set textureTimestamp(textureTimestamp: number) {
    this._spriteMesh.setTextureTimestamp(this._spriteIndex, textureTimestamp);
  }

  public get baseTextureTimestamp(): number {
    return this._spriteMesh.getBaseTextureTimestamp(this._spriteIndex);
  }

  public set baseTextureTimestamp(baseTextureTimestamp: number) {
    this._spriteMesh.setBaseTextureTimestamp(
        this._spriteIndex, baseTextureTimestamp);
  }

  /**
   * Rebase the current position and opacity into the base position and
   * opacity at the timestamp specified. If no timestamp is specified, then the
   * SpriteMesh's current time is used.
   */
  rebase(timestamp?: number) {
    this._spriteMesh.rebase(this._spriteIndex, timestamp);
  }

  /**
   * Asynchronously set this Sprite's image data and invoke the callback when
   * finished. Typically the callback will update the texture index and
   * texture timestamps to begin smooth animated tweening.
   */
  setSpriteImageData(imageData: SpriteImageData, callback?: () => any) {
    this._spriteMesh.setSpriteImageData(this._spriteIndex, imageData, callback);
  }

  /**
   * Swap between the default and sprite textures over the duration indicated.
   */
  switchTextures(startTimestamp: number, endTimestamp: number) {
    this._spriteMesh.switchTextures(
        this._spriteIndex, startTimestamp, endTimestamp);
  }
}

/**
 * Constants representing the offset values within the various data arrays of
 * the SpriteMesh's underlying geometry.
 * @see SpriteMesh:positionData.
 */
const VERTICES_PER_SPRITE = 4;
const AV = 0, BV = 1, CV = 2, DV = 3;

const POSITIONS_PER_SPRITE = 12;
const AX = 0, AY = 1, AZ = 2;
const BX = 3, BY = 4, BZ = 5;
const CX = 6, CY = 7, CZ = 8;
const DX = 9, DY = 10, DZ = 11;

const COLORS_PER_SPRITE = 16;
const AR = 0, AG = 1, AB = 2, AA = 3;
const BR = 4, BG = 5, BB = 6, BA = 7;
const CR = 8, CG = 9, CB = 10, CA = 11;
const DR = 12, DG = 13, DB = 14, DA = 15;

const FACE_INDICES_PER_SPRITE = 6;

/**
 * Constants indicating which texture to use for each sprite.
 */
export const DEFAULT_TEXTURE_INDEX = 0;
export const SPRITE_TEXTURE_INDEX = 1;

export class SpriteMesh extends THREE.Mesh {
  // SETTINGS.

  /**
   * The number of sprites this SpriteMesh is capable of representing. Must
   * be set when the object is created and is treated as immutable thereafter.
   */
  capacity: number;

  /**
   * Width of a sprite image in pixels. Defaults to 32px.
   */
  imageWidth: number;

  /**
   * Height of a sprite image in pixels. Defaults to 32px.
   */
  imageHeight: number;

  /**
   * Width of a sprite in world coordinates. Defaults to the aspect ratio of
   * imageWidth and imageHeight. Should be set prior to creating Sprites.
   */
  spriteWidth: number;

  /**
   * Height of a sprite in world coordinates. Defaults to 1. Should be set prior
   * to creating Sprites.
   */
  spriteHeight: number;

  // READ-ONLY PROPERTIES.

  /**
   * The next unused index for creating sprites.
   */
  nextIndex: number;

  /**
   * Positions of the sprite vertices. Each sprite consists of four vertices
   * (A, B, C and D) connected by two triangular faces (ABC and ACD). Each
   * vertex has three positions (X, Y and Z), so the length of the positionData
   * array is 4 vertices * 3 positions = 12 total positions per sprite.
   *
   * The face indices are stored separately in faceIndexData. Each sprite has
   * two triangular faces: ABC and ACD. 2 faces * 3 indices = 6 indices per
   * sprite.
   *
   *    D             C
   *     +-----------+
   *     |         / |   Positions:
   *     |       /   |     [  AX AY AZ   BX BY BZ   CX CY CZ   DX DY DZ  ]
   *     |     /     |
   *     |   /       |   Face Indicies:
   *     | /         |     [  AV BV CV   AV CV DV  ]
   *     +-----------+
   *    A             B
   *
   * The position data is dynamic, allowing sprite positions to change. However
   * the face index data is static since the offset indicies into the positions
   * data are known in advance.
   */
  positionData: Float32Array;

  /**
   * THREE.js BufferAttribute for the positionData.
   */
  positionAttribute: THREE.BufferAttribute;

  /**
   * Base positions for the sprite vertices. Has the same dimensionality and
   * semantics as positionData. This attribute is used by the SpriteMaterial's
   * vertex shader to animate between staring and ending position.
   */
  basePositionData: Float32Array;

  /**
   * THREE.js BufferAttribute for the basePositionData.
   */
  basePositionAttribute: THREE.BufferAttribute;

  /**
   * Color data for the sprite vertices. There are four color channels (RGBA)
   * and that data is repeated for each of the sprite's four vertecies. So
   * the length of this array will be 16 times the capacity.
   *
   * The alpha channel of this attribute does NOT indicate the tranparency level
   * of the sprite. That is controlled by the opacity attribute. Rather, the
   * alpha chanel of the color data controls how much the color is to be
   * applied to the sprite.
   *
   * A value of 0 (the default) for the alpha channel means the sprite should
   * retain its original color.
   */
  colorData: Uint8Array;

  /**
   * THREE.js BufferAttribute for the colorData.
   */
  colorAttribute: THREE.BufferAttribute;

  /**
   * Base color data for the sprite vertices. Same dimensions and semantics as
   * colorData. This attribute is used by the vertex shader to animate between
   * starting and ending color.
   */
  baseColorData: Uint8Array;

  /**
   * THREE.js BufferAttribute for baseColorData.
   */
  baseColorAttribute: THREE.BufferAttribute;

  /**
   * Stores the opacity of each sprite as a floating point number from 0-1.
   * Due to WebGL's vertex-centric design, the opacity data ends up being
   * repeated for each of the four vertices that make up a Sprite.
   *
   * TODO(jimbo): Switch to normalized Uint8.
   */
  opacityData: Float32Array;

  /**
   * THREE.js BufferAttribute for the opacityData.
   */
  opacityAttribute: THREE.BufferAttribute;

  /**
   * Stores the base opacity values for sprites. Same dimensionality and
   * semantics as opacityData.
   */
  baseOpacityData: Float32Array;

  /**
   * THREE.js BufferAttribute for the baseOpacityData.
   */
  baseOpacityAttribute: THREE.BufferAttribute;

  /**
   * Ending timestamp in ms for animating sprite position and opacity changes.
   * On or after this time, the sprite should appear at the position specified.
   * At earlier times, the position should be interpolated.
   *
   * Due to the need for greater than 32bit precision to store a JavaScript
   * timestamp (ms since Unix epoch), the values stored in this array are
   * actually a diff between the real timestamp and the time when the SpriteMesh
   * was constructed.
   *
   * The ShaderMaterial's vertex shader uses the data in timestampData and
   * baseTimestampData to determine where to render the sprite at each frame
   * and with what opacity.
   *
   * Due to WebGL's vertex-centric nature, the size of this array will be four
   * times the number of sprites, and each set of four values will be repeated.
   */
  timestampData: Float32Array;

  /**
   * THREE.js BufferAttribute for the timestampData.
   */
  timestampAttribute: THREE.BufferAttribute;

  /**
   * The base JavaScript timestamp (ms since SpriteMesh construction) for
   * animating sprite position and opacity changes. Same dimensions as
   * timestampData.
   */
  baseTimestampData: Float32Array;

  /**
   * THREE.js BufferAttribute for the baseTimestampData.
   */
  baseTimestampAttribute: THREE.BufferAttribute;

  /**
   * Indexes of face vertices for each sprite.
   * @see SpriteMesh:positionData
   */
  faceIndexData: Uint32Array;

  /**
   * THREE.js BufferAttribute for the faceIndexData.
   */
  faceIndexAttribute: THREE.BufferAttribute;

  /**
   * The vertexIndex attribute tells the SpriteMaterial's vertex shader the
   * index of the current vertex. The data array simply contains the numbers 0-N
   * where N is the total number of vertices (4 * capacity).
   *
   * Ideally these index values would be unsigned integers, but WebGL attributes
   * must be floats or vectors of floats.
   *
   * @see SpriteMaterial:vertexShader
   */
  vertexIndexData: Float32Array;

  /**
   * THREE.js BufferAttribute for the vertexIndexData.
   */
  vertexIndexAttribute: THREE.BufferAttribute;

  /**
   * Numeric value indicating which texture is currently being used by the
   * sprite. The default value is 0, meaning the default texture. 1 means the
   * sprite texture.
   *
   * TODO(jimbo): Switch to normalized Uint8.
   */
  textureIndexData: Float32Array;

  /**
   * THREE.js BufferAttribute for the textureIndexData.
   */
  textureIndexAttribute: THREE.BufferAttribute;

  /**
   * Numeric value indicating which texture was previously used by the sprite.
   * The default value is 0, meaning the default texture. 1 means the sprite
   * texture.
   *
   * TODO(jimbo): Switch to normalized Uint8.
   */
  baseTextureIndexData: Float32Array;

  /**
   * THREE.js BufferAttribute for the baseTextureIndexData.
   */
  baseTextureIndexAttribute: THREE.BufferAttribute;

  /**
   * Ending timestamp in ms for animating sprite texture changes. On or after
   * this time, the sprite should appear to be fully using the texture
   * indicated in the textureIndex. At earlier times, the pixel value will be
   * interpolated between the textureIndex texture and the baseTextureIndex
   * texture.
   *
   * Due to the need for greater than 32bit precision to store a JavaScript
   * timestamp (ms since Unix epoch), the values stored in this array are
   * actually a diff between the real timestamp and the time when the SpriteMesh
   * was constructed.
   */
  textureTimestampData: Float32Array;

  /**
   * THREE.js BufferAttribute for the textureTimestampData.
   */
  textureTimestampAttribute: THREE.BufferAttribute;

  /**
   * The base JavaScript textureTimestamp (ms since SpriteMesh construction) for
   * animating sprite position and opacity changes. Same dimensions as
   * textureTimestampData.
   */
  baseTextureTimestampData: Float32Array;

  /**
   * THREE.js BufferAttribute for the baseTextureTimestampData.
   */
  baseTextureTimestampAttribute: THREE.BufferAttribute;

  /**
   * The THREE.js BufferGeometry containing all relevant Sprite rendering data
   * as BufferAttributes.
   */
  geometry: THREE.BufferGeometry;

  /**
   * Custom sprite material for rendering sprites.
   */
  material: SpriteMaterial;

  /**
   * The default texture to apply to sprites in the absense of any other data.
   */
  defaultTexture: THREE.Texture;

  /**
   * Canvas backing the default texture.
   */
  defaultTextureCanvas: HTMLCanvasElement;

  /**
   * Sprite texture atlas for loaded sprite image data.
   */
  spriteAtlas: SpriteAtlas;

  /**
   * JavaScript timestamp when this object was created
   */
  constructionTimestamp: number;

  /**
   * Callback to be invoked before the mesh is rendered.
   *
   * TODO(jimbo): After THREE upgraded to r81+, remove this type polyfill.
   */
  onBeforeRender: (...ignore: any[]) => void;

  /**
   * Initialize the mesh with the given capacity.
   */
  constructor(capacity: number, imageWidth = 32, imageHeight = 32) {
    // Initialize THREE.js Mesh. This will create a default geometry and
    // material, which we override below.
    super();

    this.capacity = capacity;
    this.imageWidth = imageWidth;
    this.imageHeight = imageHeight;

    this.nextIndex = 0;

    this.spriteWidth = this.imageWidth / this.imageHeight;
    this.spriteHeight = 1;

    this.geometry = new THREE.BufferGeometry();

    // Position and base. 4 vertices per sprite, 3 positions per vertex.
    this.positionData = new Float32Array(POSITIONS_PER_SPRITE * capacity);
    this.positionAttribute = new THREE.BufferAttribute(this.positionData, 3);
    this.positionAttribute.setDynamic(true);
    this.geometry.addAttribute('position', this.positionAttribute);

    this.basePositionData = new Float32Array(POSITIONS_PER_SPRITE * capacity);
    this.basePositionAttribute =
        new THREE.BufferAttribute(this.basePositionData, 3);
    this.basePositionAttribute.setDynamic(true);
    this.geometry.addAttribute('basePosition', this.basePositionAttribute);

    // Color and base. 4 vertices per sprite, 4 color channels per vertex.
    this.colorData = new Uint8Array(COLORS_PER_SPRITE * capacity);
    this.colorAttribute = new THREE.BufferAttribute(this.colorData, 4);
    // TODO(jimbo): Add 'normalized' to BufferAttribute's typings upstream.
    (this.colorAttribute as any).normalized = true;
    this.colorAttribute.setDynamic(true);
    this.geometry.addAttribute('color', this.colorAttribute);

    this.baseColorData = new Uint8Array(COLORS_PER_SPRITE * capacity);
    this.baseColorAttribute = new THREE.BufferAttribute(this.baseColorData, 4);
    // TODO(jimbo): Add 'normalized' to BufferAttribute's typings upstream.
    (this.baseColorAttribute as any).normalized = true;
    this.baseColorAttribute.setDynamic(true);
    this.geometry.addAttribute('baseColor', this.baseColorAttribute);

    // Opacity and base opacity. 4 vertices per sprite.
    this.opacityData = new Float32Array(VERTICES_PER_SPRITE * capacity);
    this.opacityAttribute = new THREE.BufferAttribute(this.opacityData, 1);
    this.opacityAttribute.setDynamic(true);
    this.geometry.addAttribute('opacity', this.opacityAttribute);

    this.baseOpacityData = new Float32Array(VERTICES_PER_SPRITE * capacity);
    this.baseOpacityAttribute =
        new THREE.BufferAttribute(this.baseOpacityData, 1);
    this.baseOpacityAttribute.setDynamic(true);
    this.geometry.addAttribute('baseOpacity', this.baseOpacityAttribute);

    // Timestamp and base timestamp. 4 vertices per sprite.
    this.timestampData = new Float32Array(VERTICES_PER_SPRITE * capacity);
    this.timestampAttribute = new THREE.BufferAttribute(this.timestampData, 1);
    this.timestampAttribute.setDynamic(true);
    this.geometry.addAttribute('timestamp', this.timestampAttribute);

    this.baseTimestampData = new Float32Array(VERTICES_PER_SPRITE * capacity);
    this.baseTimestampAttribute =
        new THREE.BufferAttribute(this.baseTimestampData, 1);
    this.baseTimestampAttribute.setDynamic(true);
    this.geometry.addAttribute('baseTimestamp', this.baseTimestampAttribute);

    // 2 faces per sprite, 3 indicies per face.
    this.faceIndexData = new Uint32Array(FACE_INDICES_PER_SPRITE * capacity);
    for (let i = 0; i < capacity; i++) {
      const faceOffsetIndex = FACE_INDICES_PER_SPRITE * i;
      const vertexOffsetIndex = VERTICES_PER_SPRITE * i;
      // ABC face.
      this.faceIndexData[faceOffsetIndex + 0] = vertexOffsetIndex + AV;
      this.faceIndexData[faceOffsetIndex + 1] = vertexOffsetIndex + BV;
      this.faceIndexData[faceOffsetIndex + 2] = vertexOffsetIndex + CV;
      // ACD face.
      this.faceIndexData[faceOffsetIndex + 3] = vertexOffsetIndex + AV;
      this.faceIndexData[faceOffsetIndex + 4] = vertexOffsetIndex + CV;
      this.faceIndexData[faceOffsetIndex + 5] = vertexOffsetIndex + DV;
    }
    this.faceIndexAttribute = new THREE.BufferAttribute(this.faceIndexData, 1);
    this.geometry.setIndex(this.faceIndexAttribute);

    // Texture index and base texture index. 4 vertices per sprite.
    this.textureIndexData = new Float32Array(VERTICES_PER_SPRITE * capacity);
    this.textureIndexAttribute =
        new THREE.BufferAttribute(this.textureIndexData, 1);
    this.textureIndexAttribute.setDynamic(true);
    this.geometry.addAttribute('textureIndex', this.textureIndexAttribute);

    this.baseTextureIndexData =
        new Float32Array(VERTICES_PER_SPRITE * capacity);
    this.baseTextureIndexAttribute =
        new THREE.BufferAttribute(this.baseTextureIndexData, 1);
    this.baseTextureIndexAttribute.setDynamic(true);
    this.geometry.addAttribute(
        'baseTextureIndex', this.baseTextureIndexAttribute);

    // Texture timestamp and base texture timestamp. 4 vertices per sprite.
    this.textureTimestampData =
        new Float32Array(VERTICES_PER_SPRITE * capacity);
    this.textureTimestampAttribute =
        new THREE.BufferAttribute(this.textureTimestampData, 1);
    this.textureTimestampAttribute.setDynamic(true);
    this.geometry.addAttribute(
        'textureTimestamp', this.textureTimestampAttribute);

    this.baseTextureTimestampData =
        new Float32Array(VERTICES_PER_SPRITE * capacity);
    this.baseTextureTimestampAttribute =
        new THREE.BufferAttribute(this.baseTextureTimestampData, 1);
    this.baseTextureTimestampAttribute.setDynamic(true);
    this.geometry.addAttribute(
        'baseTextureTimestamp', this.baseTextureTimestampAttribute);

    // Fill in the vertexIndex attribute with the values 0-N.
    const totalVertices = VERTICES_PER_SPRITE * capacity;
    this.vertexIndexData = new Float32Array(totalVertices);
    for (let i = 0; i < totalVertices; i++) {
      this.vertexIndexData[i] = i;
    }
    this.vertexIndexAttribute =
        new THREE.BufferAttribute(this.vertexIndexData, 1);
    this.geometry.addAttribute('vertexIndex', this.vertexIndexAttribute);

    // Create the default texture and its backing canvas.
    this.defaultTextureCanvas = this.createDefaultTextureCanvas();
    this.defaultTexture = new THREE.Texture(this.defaultTextureCanvas);
    this.defaultTexture.minFilter = THREE.LinearFilter;
    this.defaultTexture.magFilter = THREE.NearestFilter;
    this.defaultTexture.needsUpdate = true;

    // Setup the dynamic texture and its backing canvas.
    this.spriteAtlas = new SpriteAtlas(capacity, imageWidth, imageHeight);

    this.material = new SpriteMaterial(this.defaultTexture, this.spriteAtlas);

    this.onBeforeRender = () => {
      this.material.updateAtlasUniforms();
    };

    this.constructionTimestamp = Date.now();
    this.time = this.constructionTimestamp;

    // Prevents clipping by the frustum (whole shape disappears). An alternative
    // would be to add the mesh as a child of the camera (and the camera as a
    // child of the scene) but changing the frustum culling is something we can
    // do here irrespective of the scene and camera used.
    // See http://threejs.org/docs/#Reference/Core/Object3D.frustumCulled
    this.frustumCulled = false;
  }

  /**
   * Create and return a new Sprite.
   */
  createSprite() {
    return new Sprite(this, this.nextIndex++);
  }

  public get time(): number {
    return this.material.time + this.constructionTimestamp;
  }

  public set time(time: number) {
    this.material.time = time - this.constructionTimestamp;
  }

  /**
   * Create the default texture and backing canvas.
   */
  createDefaultTextureCanvas() {
    const canvas = this.defaultTextureCanvas = document.createElement('canvas');
    const width = canvas.width = this.imageWidth;
    const height = canvas.height = this.imageHeight;
    const context = canvas.getContext('2d')!;

    // Draw in a default SVG.
    const image = new Image();
    image.onload = () => {
      context.drawImage(image, 0, 0, width, height);
      this.defaultTexture.needsUpdate = true;
    };
    image.src = URL.createObjectURL(
        new Blob([DOT_SVG], {type: 'image/svg+xml;charset=utf-8'}));

    return canvas;
  }

  /**
   * Get the X component of the specified Sprite's position.
   */
  getX(spriteIndex: number) {
    const positionOffsetIndex = spriteIndex * POSITIONS_PER_SPRITE;
    return this.positionData[positionOffsetIndex + AX];
  }

  /**
   * Set the X component of the specified Sprite's position.
   */
  setX(spriteIndex: number, x: number) {
    const positionOffsetIndex = spriteIndex * POSITIONS_PER_SPRITE;
    this.positionData[positionOffsetIndex + AX] = x;
    this.positionData[positionOffsetIndex + BX] = x + this.spriteWidth;
    this.positionData[positionOffsetIndex + CX] = x + this.spriteWidth;
    this.positionData[positionOffsetIndex + DX] = x;
    this.positionAttribute.needsUpdate = true;
  }

  /**
   * Get the Y component of the specified Sprite's position.
   */
  getY(spriteIndex: number) {
    const positionOffsetIndex = spriteIndex * POSITIONS_PER_SPRITE;
    return this.positionData[positionOffsetIndex + AY];
  }

  /**
   * Set the Y component of the specified Sprite's position.
   */
  setY(spriteIndex: number, y: number) {
    const positionOffsetIndex = spriteIndex * POSITIONS_PER_SPRITE;
    this.positionData[positionOffsetIndex + AY] = y;
    this.positionData[positionOffsetIndex + BY] = y;
    this.positionData[positionOffsetIndex + CY] = y + this.spriteHeight;
    this.positionData[positionOffsetIndex + DY] = y + this.spriteHeight;
    this.positionAttribute.needsUpdate = true;
  }

  /**
   * Get the Z component of the specified Sprite's position.
   */
  getZ(spriteIndex: number) {
    const positionOffsetIndex = spriteIndex * POSITIONS_PER_SPRITE;
    return this.positionData[positionOffsetIndex + AZ];
  }

  /**
   * Set the Z component of the specified Sprite's position.
   */
  setZ(spriteIndex: number, z: number) {
    const positionOffsetIndex = spriteIndex * POSITIONS_PER_SPRITE;
    this.positionData[positionOffsetIndex + AZ] = z;
    this.positionData[positionOffsetIndex + BZ] = z;
    this.positionData[positionOffsetIndex + CZ] = z;
    this.positionData[positionOffsetIndex + DZ] = z;
    this.positionAttribute.needsUpdate = true;
  }

  /**
   * Get the R channel of the specified Sprite's color.
   */
  getR(spriteIndex: number) {
    const colorOffsetIndex = spriteIndex * COLORS_PER_SPRITE;
    return this.colorData[colorOffsetIndex + AR];
  }

  /**
   * Set the R channel of the specified Sprite's color.
   */
  setR(spriteIndex: number, r: number) {
    const colorOffsetIndex = spriteIndex * COLORS_PER_SPRITE;
    this.colorData[colorOffsetIndex + AR] = r;
    this.colorData[colorOffsetIndex + BR] = r;
    this.colorData[colorOffsetIndex + CR] = r;
    this.colorData[colorOffsetIndex + DR] = r;
    this.colorAttribute.needsUpdate = true;
  }

  /**
   * Get the G channel of the specified Sprite's color.
   */
  getG(spriteIndex: number) {
    const colorOffsetIndex = spriteIndex * COLORS_PER_SPRITE;
    return this.colorData[colorOffsetIndex + AG];
  }

  /**
   * Set the G channel of the specified Sprite's color.
   */
  setG(spriteIndex: number, g: number) {
    const colorOffsetIndex = spriteIndex * COLORS_PER_SPRITE;
    this.colorData[colorOffsetIndex + AG] = g;
    this.colorData[colorOffsetIndex + BG] = g;
    this.colorData[colorOffsetIndex + CG] = g;
    this.colorData[colorOffsetIndex + DG] = g;
    this.colorAttribute.needsUpdate = true;
  }

  /**
   * Get the B channel of the specified Sprite's color.
   */
  getB(spriteIndex: number) {
    const colorOffsetIndex = spriteIndex * COLORS_PER_SPRITE;
    return this.colorData[colorOffsetIndex + AB];
  }

  /**
   * Set the B channel of the specified Sprite's color.
   */
  setB(spriteIndex: number, b: number) {
    const colorOffsetIndex = spriteIndex * COLORS_PER_SPRITE;
    this.colorData[colorOffsetIndex + AB] = b;
    this.colorData[colorOffsetIndex + BB] = b;
    this.colorData[colorOffsetIndex + CB] = b;
    this.colorData[colorOffsetIndex + DB] = b;
    this.colorAttribute.needsUpdate = true;
  }

  /**
   * Get the A channel of the specified Sprite's color.
   */
  getA(spriteIndex: number) {
    const colorOffsetIndex = spriteIndex * COLORS_PER_SPRITE;
    return this.colorData[colorOffsetIndex + AA];
  }

  /**
   * Set the A channel of the specified Sprite's color.
   */
  setA(spriteIndex: number, a: number) {
    const colorOffsetIndex = spriteIndex * COLORS_PER_SPRITE;
    this.colorData[colorOffsetIndex + AA] = a;
    this.colorData[colorOffsetIndex + BA] = a;
    this.colorData[colorOffsetIndex + CA] = a;
    this.colorData[colorOffsetIndex + DA] = a;
    this.colorAttribute.needsUpdate = true;
  }

  /**
   * Get the X component of the specified Sprite's base position.
   */
  getBaseX(spriteIndex: number) {
    const positionOffsetIndex = spriteIndex * POSITIONS_PER_SPRITE;
    return this.basePositionData[positionOffsetIndex + AX];
  }

  /**
   * Set the X component of the specified Sprite's base position.
   */
  setBaseX(spriteIndex: number, baseX: number) {
    const positionOffsetIndex = spriteIndex * POSITIONS_PER_SPRITE;
    this.basePositionData[positionOffsetIndex + AX] = baseX;
    this.basePositionData[positionOffsetIndex + BX] = baseX + this.spriteWidth;
    this.basePositionData[positionOffsetIndex + CX] = baseX + this.spriteWidth;
    this.basePositionData[positionOffsetIndex + DX] = baseX;
    this.basePositionAttribute.needsUpdate = true;
  }

  /**
   * Get the Y component of the specified Sprite's base position.
   */
  getBaseY(spriteIndex: number) {
    const positionOffsetIndex = spriteIndex * POSITIONS_PER_SPRITE;
    return this.basePositionData[positionOffsetIndex + AY];
  }

  /**
   * Set the Y component of the specified Sprite's base position.
   */
  setBaseY(spriteIndex: number, baseY: number) {
    const positionOffsetIndex = spriteIndex * POSITIONS_PER_SPRITE;
    this.basePositionData[positionOffsetIndex + AY] = baseY;
    this.basePositionData[positionOffsetIndex + BY] = baseY;
    this.basePositionData[positionOffsetIndex + CY] = baseY + this.spriteHeight;
    this.basePositionData[positionOffsetIndex + DY] = baseY + this.spriteHeight;
    this.basePositionAttribute.needsUpdate = true;
  }

  /**
   * Get the Z component of the specified Sprite's base position.
   */
  getBaseZ(spriteIndex: number) {
    const positionOffsetIndex = spriteIndex * POSITIONS_PER_SPRITE;
    return this.basePositionData[positionOffsetIndex + AZ];
  }

  /**
   * Set the Z component of the specified Sprite's base position.
   */
  setBaseZ(spriteIndex: number, baseZ: number) {
    const positionOffsetIndex = spriteIndex * POSITIONS_PER_SPRITE;
    this.basePositionData[positionOffsetIndex + AZ] = baseZ;
    this.basePositionData[positionOffsetIndex + BZ] = baseZ;
    this.basePositionData[positionOffsetIndex + CZ] = baseZ;
    this.basePositionData[positionOffsetIndex + DZ] = baseZ;
    this.basePositionAttribute.needsUpdate = true;
  }

  /**
   * Get the R channel of the specified Sprite's base color.
   */
  getBaseR(spriteIndex: number) {
    const colorOffsetIndex = spriteIndex * COLORS_PER_SPRITE;
    return this.baseColorData[colorOffsetIndex + AR];
  }

  /**
   * Set the R channel of the specified Sprite's base color.
   */
  setBaseR(spriteIndex: number, baseR: number) {
    const colorOffsetIndex = spriteIndex * COLORS_PER_SPRITE;
    this.baseColorData[colorOffsetIndex + AR] = baseR;
    this.baseColorData[colorOffsetIndex + BR] = baseR;
    this.baseColorData[colorOffsetIndex + CR] = baseR;
    this.baseColorData[colorOffsetIndex + DR] = baseR;
    this.baseColorAttribute.needsUpdate = true;
  }

  /**
   * Get the G channel of the specified Sprite's base color.
   */
  getBaseG(spriteIndex: number) {
    const colorOffsetIndex = spriteIndex * COLORS_PER_SPRITE;
    return this.baseColorData[colorOffsetIndex + AG];
  }

  /**
   * Set the G channel of the specified Sprite's base color.
   */
  setBaseG(spriteIndex: number, baseG: number) {
    const colorOffsetIndex = spriteIndex * COLORS_PER_SPRITE;
    this.baseColorData[colorOffsetIndex + AG] = baseG;
    this.baseColorData[colorOffsetIndex + BG] = baseG;
    this.baseColorData[colorOffsetIndex + CG] = baseG;
    this.baseColorData[colorOffsetIndex + DG] = baseG;
    this.baseColorAttribute.needsUpdate = true;
  }

  /**
   * Get the B channel of the specified Sprite's base color.
   */
  getBaseB(spriteIndex: number) {
    const colorOffsetIndex = spriteIndex * COLORS_PER_SPRITE;
    return this.baseColorData[colorOffsetIndex + AB];
  }

  /**
   * Set the B channel of the specified Sprite's base color.
   */
  setBaseB(spriteIndex: number, baseB: number) {
    const colorOffsetIndex = spriteIndex * COLORS_PER_SPRITE;
    this.baseColorData[colorOffsetIndex + AB] = baseB;
    this.baseColorData[colorOffsetIndex + BB] = baseB;
    this.baseColorData[colorOffsetIndex + CB] = baseB;
    this.baseColorData[colorOffsetIndex + DB] = baseB;
    this.baseColorAttribute.needsUpdate = true;
  }

  /**
   * Get the A channel of the specified Sprite's base color.
   */
  getBaseA(spriteIndex: number) {
    const colorOffsetIndex = spriteIndex * COLORS_PER_SPRITE;
    return this.baseColorData[colorOffsetIndex + AA];
  }

  /**
   * Set the A channel of the specified Sprite's base color.
   */
  setBaseA(spriteIndex: number, baseA: number) {
    const colorOffsetIndex = spriteIndex * COLORS_PER_SPRITE;
    this.baseColorData[colorOffsetIndex + AA] = baseA;
    this.baseColorData[colorOffsetIndex + BA] = baseA;
    this.baseColorData[colorOffsetIndex + CA] = baseA;
    this.baseColorData[colorOffsetIndex + DA] = baseA;
    this.baseColorAttribute.needsUpdate = true;
  }

  /**
   * Get the opacity of the specified Sprite.
   */
  getOpacity(spriteIndex: number) {
    const vertexOffsetIndex = spriteIndex * VERTICES_PER_SPRITE;
    return this.opacityData[vertexOffsetIndex + AV];
  }

  /**
   * Set the opacity of the specified Sprite.
   */
  setOpacity(spriteIndex: number, opacity: number) {
    const vertexOffsetIndex = spriteIndex * VERTICES_PER_SPRITE;
    this.opacityData[vertexOffsetIndex + AV] = opacity;
    this.opacityData[vertexOffsetIndex + BV] = opacity;
    this.opacityData[vertexOffsetIndex + CV] = opacity;
    this.opacityData[vertexOffsetIndex + DV] = opacity;
    this.opacityAttribute.needsUpdate = true;
  }

  /**
   * Get the base opacity of the specified Sprite.
   */
  getBaseOpacity(spriteIndex: number) {
    const vertexOffsetIndex = spriteIndex * VERTICES_PER_SPRITE;
    return this.baseOpacityData[vertexOffsetIndex + AV];
  }

  /**
   * Set the base opacity of the specified Sprite.
   */
  setBaseOpacity(spriteIndex: number, baseOpacity: number) {
    const vertexOffsetIndex = spriteIndex * VERTICES_PER_SPRITE;
    this.baseOpacityData[vertexOffsetIndex + AV] = baseOpacity;
    this.baseOpacityData[vertexOffsetIndex + BV] = baseOpacity;
    this.baseOpacityData[vertexOffsetIndex + CV] = baseOpacity;
    this.baseOpacityData[vertexOffsetIndex + DV] = baseOpacity;
    this.baseOpacityAttribute.needsUpdate = true;
  }

  /**
   * Get the Sprite's current timestamp.
   */
  getTimestamp(spriteIndex: number) {
    const vertexOffsetIndex = spriteIndex * VERTICES_PER_SPRITE;
    return this.timestampData[vertexOffsetIndex + AV] +
        this.constructionTimestamp;
  }

  /**
   * Set the Sprite's current timestamp.
   */
  setTimestamp(spriteIndex: number, timestamp: number) {
    const vertexOffsetIndex = spriteIndex * VERTICES_PER_SPRITE;
    const diffTimestamp = timestamp - this.constructionTimestamp;
    this.timestampData[vertexOffsetIndex + AV] = diffTimestamp;
    this.timestampData[vertexOffsetIndex + BV] = diffTimestamp;
    this.timestampData[vertexOffsetIndex + CV] = diffTimestamp;
    this.timestampData[vertexOffsetIndex + DV] = diffTimestamp;
    this.timestampAttribute.needsUpdate = true;
  }

  /**
   * Get the Sprite's base timestamp.
   */
  getBaseTimestamp(spriteIndex: number) {
    const vertexOffsetIndex = spriteIndex * VERTICES_PER_SPRITE;
    return this.baseTimestampData[vertexOffsetIndex + AV] +
        this.constructionTimestamp;
  }

  /**
   * Set the Sprite's base timestamp.
   */
  setBaseTimestamp(spriteIndex: number, baseTimestamp: number) {
    const vertexOffsetIndex = spriteIndex * VERTICES_PER_SPRITE;
    const diffTimestamp = baseTimestamp - this.constructionTimestamp;
    this.baseTimestampData[vertexOffsetIndex + AV] = diffTimestamp;
    this.baseTimestampData[vertexOffsetIndex + BV] = diffTimestamp;
    this.baseTimestampData[vertexOffsetIndex + CV] = diffTimestamp;
    this.baseTimestampData[vertexOffsetIndex + DV] = diffTimestamp;
    this.baseTimestampAttribute.needsUpdate = true;
  }

  /**
   * Get the textureIndex of the specified Sprite.
   */
  getTextureIndex(spriteIndex: number) {
    const vertexOffsetIndex = spriteIndex * VERTICES_PER_SPRITE;
    return this.textureIndexData[vertexOffsetIndex + AV];
  }

  /**
   * Set the textureIndex of the specified Sprite.
   */
  setTextureIndex(spriteIndex: number, textureIndex: number) {
    const vertexOffsetIndex = spriteIndex * VERTICES_PER_SPRITE;
    this.textureIndexData[vertexOffsetIndex + AV] = textureIndex;
    this.textureIndexData[vertexOffsetIndex + BV] = textureIndex;
    this.textureIndexData[vertexOffsetIndex + CV] = textureIndex;
    this.textureIndexData[vertexOffsetIndex + DV] = textureIndex;
    this.textureIndexAttribute.needsUpdate = true;
  }

  /**
   * Get the base textureIndex of the specified Sprite.
   */
  getBaseTextureIndex(spriteIndex: number) {
    const vertexOffsetIndex = spriteIndex * VERTICES_PER_SPRITE;
    return this.baseTextureIndexData[vertexOffsetIndex + AV];
  }

  /**
   * Set the base textureIndex of the specified Sprite.
   */
  setBaseTextureIndex(spriteIndex: number, baseTextureIndex: number) {
    const vertexOffsetIndex = spriteIndex * VERTICES_PER_SPRITE;
    this.baseTextureIndexData[vertexOffsetIndex + AV] = baseTextureIndex;
    this.baseTextureIndexData[vertexOffsetIndex + BV] = baseTextureIndex;
    this.baseTextureIndexData[vertexOffsetIndex + CV] = baseTextureIndex;
    this.baseTextureIndexData[vertexOffsetIndex + DV] = baseTextureIndex;
    this.baseTextureIndexAttribute.needsUpdate = true;
  }

  /**
   * Get the Sprite's current textureTimestamp.
   */
  getTextureTimestamp(spriteIndex: number) {
    const vertexOffsetIndex = spriteIndex * VERTICES_PER_SPRITE;
    return this.textureTimestampData[vertexOffsetIndex + AV] +
        this.constructionTimestamp;
  }

  /**
   * Set the Sprite's current textureTimestamp.
   */
  setTextureTimestamp(spriteIndex: number, textureTimestamp: number) {
    const vertexOffsetIndex = spriteIndex * VERTICES_PER_SPRITE;
    const diff = textureTimestamp - this.constructionTimestamp;
    this.textureTimestampData[vertexOffsetIndex + AV] = diff;
    this.textureTimestampData[vertexOffsetIndex + BV] = diff;
    this.textureTimestampData[vertexOffsetIndex + CV] = diff;
    this.textureTimestampData[vertexOffsetIndex + DV] = diff;
    this.textureTimestampAttribute.needsUpdate = true;
  }

  /**
   * Get the Sprite's base textureTimestamp.
   */
  getBaseTextureTimestamp(spriteIndex: number) {
    const vertexOffsetIndex = spriteIndex * VERTICES_PER_SPRITE;
    return this.baseTextureTimestampData[vertexOffsetIndex + AV] +
        this.constructionTimestamp;
  }

  /**
   * Set the Sprite's base textureTimestamp.
   */
  setBaseTextureTimestamp(spriteIndex: number, baseTextureTimestamp: number) {
    const vertexOffsetIndex = spriteIndex * VERTICES_PER_SPRITE;
    const diff = baseTextureTimestamp - this.constructionTimestamp;
    this.baseTextureTimestampData[vertexOffsetIndex + AV] = diff;
    this.baseTextureTimestampData[vertexOffsetIndex + BV] = diff;
    this.baseTextureTimestampData[vertexOffsetIndex + CV] = diff;
    this.baseTextureTimestampData[vertexOffsetIndex + DV] = diff;
    this.baseTextureTimestampAttribute.needsUpdate = true;
  }

  /**
   * Rebase the current position, color, and opacity of the specified Sprite
   * into the base position and opacity at the timestamp specified. If no
   * timestamp is specified, then the SpriteMesh's current time is used.
   *
   * At a high level, the purpose of this function is to prepare the sprite for
   * the next animation. Suppose we've finished animating, and now the sprite
   * is about to have new positions set.
   *
   * Calling this method will interpolate values according to the material's
   * easing method so that the next animation will smoothly pick up where this
   * one finished.
   */
  rebase(spriteIndex: number, timestamp?: number) {
    timestamp = timestamp === undefined ? this.time : timestamp;

    // To determine the new base timestamp, we have to apply the same easing
    // logic used by the shader. So the new base will not be a simple linear
    // interpolation, but rather the effective time the shader would use at
    // this frame.
    const oldBaseTimestamp = this.getBaseTimestamp(spriteIndex);
    const currentTimestamp = this.getTimestamp(spriteIndex);

    // Proportion of current values to apply to base. 0 means use entirely base,
    // 1 means entirely current values.
    const blend = timestamp >= currentTimestamp ?
        1 :
        timestamp <= oldBaseTimestamp ?
        0 :
        this.material.applyEasing(
            (timestamp - oldBaseTimestamp) /
            (currentTimestamp - oldBaseTimestamp));

    // Convenience method for linear interpolation.
    const lerp = (v0: number, v1: number) => {
      return v0 * blend + v1 * (1 - blend);
    };

    // Apply blending to update base position, color, and opacity.
    this.setBaseX(
        spriteIndex, lerp(this.getX(spriteIndex), this.getBaseX(spriteIndex)));
    this.setBaseY(
        spriteIndex, lerp(this.getY(spriteIndex), this.getBaseY(spriteIndex)));
    this.setBaseZ(
        spriteIndex, lerp(this.getZ(spriteIndex), this.getBaseZ(spriteIndex)));
    this.setBaseR(
        spriteIndex, lerp(this.getR(spriteIndex), this.getBaseR(spriteIndex)));
    this.setBaseG(
        spriteIndex, lerp(this.getG(spriteIndex), this.getBaseG(spriteIndex)));
    this.setBaseB(
        spriteIndex, lerp(this.getB(spriteIndex), this.getBaseB(spriteIndex)));
    this.setBaseA(
        spriteIndex, lerp(this.getA(spriteIndex), this.getBaseA(spriteIndex)));
    this.setBaseOpacity(
        spriteIndex,
        lerp(this.getOpacity(spriteIndex), this.getBaseOpacity(spriteIndex)));

    // When setting the new base timestamp, we should apply the same blending
    // alogrithm except if the rebase timestamp is later than the sprite's
    // current timestamp. In that case we should use the passed in value.
    const newBaseTimestamp = timestamp >= currentTimestamp ?
        timestamp :
        lerp(currentTimestamp, oldBaseTimestamp);
    this.setBaseTimestamp(spriteIndex, newBaseTimestamp);
  }

  /**
   * Set image data for the selected sprite, invoke callback when finished.
   */
  setSpriteImageData(
      spriteIndex: number, imageData: SpriteImageData,
      callback?: (spriteIndex: number) => any) {
    this.spriteAtlas.setSpriteImageData(spriteIndex, imageData, callback);
  }

  /**
   * Switch between the default and sprite texture over the duration specified.
   */
  switchTextures(
      spriteIndex: number, startTimestamp: number, endTimestamp: number) {
    const oldTextureIndex = this.getTextureIndex(spriteIndex);
    this.setBaseTextureIndex(spriteIndex, oldTextureIndex);
    this.setTextureIndex(
        spriteIndex,
        oldTextureIndex === DEFAULT_TEXTURE_INDEX ? SPRITE_TEXTURE_INDEX :
                                                    DEFAULT_TEXTURE_INDEX);
    this.setBaseTextureTimestamp(spriteIndex, startTimestamp);
    this.setTextureTimestamp(spriteIndex, endTimestamp);
  }

  /**
   * Given X and Y in world coordinates, determine which sprites (if any) span
   * the line through this point perpendicular to the XY plane. This substitutes
   * for full raycasting support, and presumes that the camera is looking down
   * on the sprites in the XY plane from the Z axis.
   *
   * If no sprites intersect the point, then an empty array is returned.
   */
  findSprites(x: number, y: number): number[] {
    // This naive implementation is significantly slower than what could be
    // achieved by maintaining a quadtree or octree.
    const spriteIndexes: number[] = [];
    for (let spriteIndex = 0; spriteIndex < this.capacity; spriteIndex++) {
      const positionOffsetIndex = spriteIndex * POSITIONS_PER_SPRITE;
      if (x >= this.positionData[positionOffsetIndex + AX] &&
          x <= this.positionData[positionOffsetIndex + CX] &&
          y >= this.positionData[positionOffsetIndex + AY] &&
          y <= this.positionData[positionOffsetIndex + CY]) {
        spriteIndexes.push(spriteIndex);
      }
    }
    return spriteIndexes;
  }
}

export const DOT_SVG = `
<svg version="1.1"
     baseProfile="full"
     width="128" height="128"
     xmlns="http://www.w3.org/2000/svg"
     xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="linearGradient3774">
      <stop
         style="stop-color:#808080;stop-opacity:1;"
         offset="0" />
      <stop
         style="stop-color:#555555;stop-opacity:1;"
         offset="1" />
    </linearGradient>
    <radialGradient
       xlink:href="#linearGradient3774"
       id="radialGradient3780"
       cx="80"
       cy="40"
       fx="80"
       fy="40"
       r="80"
       gradientUnits="userSpaceOnUse"
       spreadMethod="pad" />
  </defs>
  <circle cx="50%" cy="50%" r="50%" fill="url(#radialGradient3780)" />
</svg>
`;
