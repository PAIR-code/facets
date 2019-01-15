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
 * @fileoverview Custom mateiral for use by the SpriteMesh.
 */
import {SpriteAtlas} from './sprite-atlas';

declare var THREE: any;

export class SpriteMaterial extends THREE.RawShaderMaterial {
  constructor(defaultTexture: THREE.Texture, spriteAtlas: SpriteAtlas) {
    super({

      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,

      /**
       * Uniforms are GLSL variables which have a uniform value across all of
       * the vertices (and, subsequently, fragments) being rendered.
       */
      uniforms: {

        /**
         * Time in ms. Used to animate sprite positions and opacity between base
         * and current values.
         * @see SpriteMesh:time
         */
        time: {
          type: 'f',
          value: 0,
        },

        /**
         * Default texture to draw on a sprite until its individual image data
         * has been specified. MUST be set prior to rendering.
         */
        defaultTexture: {
          type: 't',
          value: defaultTexture,
        },

        /**
         * Sprite texture atlas in which to find individual sprite image data
         * once loaded.
         */
        spriteAtlas: {
          type: 't',
          value: spriteAtlas,
        },

        /**
         * Number of columns of sprites in the texture, needed for UVs.
         */
        spriteColumns: {
          type: 'f',
          value: spriteAtlas ? spriteAtlas.spriteColumns : 1,
        },

        /**
         * Number of rows of sprites in the texture, needed for computing UVs.
         */
        spriteRows: {
          type: 'f',
          value: spriteAtlas ? spriteAtlas.spriteRows : 1,
        },

      },

      // Needed to enable alhpa blending.
      transparent: true,

    });
  }

  public get time(): number {
    return this.uniforms.time.value;
  }

  public set time(time: number) {
    this.uniforms.time.value = time;
  }

  public get defaultTexture(): THREE.Texture {
    return this.uniforms.defaultTexture.value;
  }

  public set defaultTexture(defaultTexture: THREE.Texture) {
    this.uniforms.defaultTexture.value = defaultTexture;
  }

  public get spriteAtlas(): SpriteAtlas {
    return this.uniforms.spriteAtlas.value;
  }

  public set spriteAtlas(spriteAtlas: SpriteAtlas) {
    this.uniforms.spriteAtlas.value = spriteAtlas;
  }

  /**
   * Update the sprite columns and rows uniforms from the atlas.
   */
  public updateAtlasUniforms() {
    this.uniforms.spriteColumns.value = this.spriteAtlas.spriteColumns;
    this.uniforms.spriteRows.value = this.spriteAtlas.spriteRows;
  }

  /**
   * Implements cubic in/out easing, producing the same result as the shader's
   * easing for animations. This allows callers in JavaScript to get the same
   * result as the GLSL code, whose results can only be used in the render
   * pipeline.
   */
  applyEasing(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 4 * (t - 1) * (t - 1) * (t - 1) + 1;
  }
}

/**
 * The vertex shader operates on each vertex of each sprite, producing the
 * final screen position (gl_Position) for that vertex by appling the projection
 * and modelView matricies. By applying the time uniform, this final position
 * will be an interpolation between the base and current sprite positions.
 *
 * Using the vertexIndex attribute, the shader also computes the UV coordinates
 * for indexing into the various textures. That is, it answers the question
 * "where in the backing image can we find this vertex's pixel value?"
 *
 * For example, consider finding the UVs for the default texture. Every
 * sprite's A vertex should map to the bottom-left pixel of the texture, at
 * UV coordinates (0,0). Every sprite's C vertex should map to the top-right
 * pixel at UV coordinates (1,1) and so on.
 *
 *    D             C
 *     +-----------+
 *     |         / |     Vertex     Index     UV Coordinates
 *     |       /   |       A          0           (0,0)
 *     |     /     |       B          1           (1,0)
 *     |   /       |       C          2           (1,1)
 *     | /         |       D          3           (0,1)
 *     +-----------+
 *    A             B
 *
 * For the sprite texture atlas, each sprite will have its own area of the
 * texture into which to place image data. Here the shader can still compute the
 * UV coordinates given the vertex index and the capacity of the atlas.
 * Consider finding the UVs for the first sprite (index 0) in a mesh with
 * capacity 25.
 *
 *    1 +---+---------------+
 *      | / |               |
 *      +---+ - - - - - - - +     Vertex     UV Coordinates
 *      |   .               |       A         (0.0, 0.8)
 *      |   .               |       B         (0.2, 0.8)
 *      |   .               |       C         (0.2, 1.0)
 *      |   .               |       D         (0.0, 1.0)
 *      |   .               |
 *      |   .               |
 *      |   .               |
 *    0 +---+---------------+
 *      0                   1
 *
 * All of these UV coordinates are static, and could be pre-computed once and
 * used verbatim by the shader. When we implement instancing, these can be baked
 * into the repeated geometry.
 */
const VERTEX_SHADER = `

  precision highp float;
  precision highp int;

  #define SHADER_NAME SpriteMaterial

  // Standard uniforms provided by THREE.js for projecting through the camera.
  uniform mat4 modelViewMatrix;
  uniform mat4 projectionMatrix;

  uniform float time;

  uniform float spriteColumns;
  uniform float spriteRows;

  attribute vec3 position;
  attribute vec3 basePosition;

  attribute vec4 color;
  attribute vec4 baseColor;

  attribute float opacity;
  attribute float baseOpacity;

  attribute float timestamp;
  attribute float baseTimestamp;

  attribute float vertexIndex;

  attribute float textureIndex;
  attribute float baseTextureIndex;

  attribute float textureTimestamp;
  attribute float baseTextureTimestamp;

  // Computed UV coordinates into the defaultTexture based on the vertexIndex.
  varying vec2 vDefaultUv;

  // Computed UV coordinates into the sprite texture atlas.
  varying vec2 vSpriteUv;

  // Interpolated color used by the fragment shader.
  varying vec4 vColor;

  // Interpolated opacity used by the fragment shader.
  varying float vOpacity;

  // Degree of mixing between base and current texture.
  varying float vTextureMix;

  float applyEasing(float t) {
    return t < 0.5 ? 4.0 * t * t * t :
      4.0 * (t - 1.0) * (t - 1.0) * (t - 1.0) + 1.0;
  }

  void main() {

    // Compute default UVs. A => (0,0), B => (1,0), etc.
    vDefaultUv.x = mod(floor((vertexIndex + 1.0) / 2.0), 2.0);
    vDefaultUv.y = mod(floor(vertexIndex / 2.0), 2.0);

    // Determine the row and column indices for this sprite.
    float spriteIndex = floor(vertexIndex / 4.0) + 0.5;
    float columnIndex = floor(mod(spriteIndex, spriteColumns));
    float rowIndex = spriteRows - 1.0 - floor(spriteIndex / spriteColumns);

    // Compute sprite UVs from row and column indices.
    vSpriteUv.x = (columnIndex + vDefaultUv.x) / spriteColumns;
    vSpriteUv.y = (rowIndex + vDefaultUv.y) / spriteRows;

    float blend = applyEasing(smoothstep(baseTimestamp, timestamp, time));

    vTextureMix = mix(baseTextureIndex, textureIndex,
        smoothstep(baseTextureTimestamp, textureTimestamp, time));

    vColor = mix(baseColor, color, blend);

    vOpacity = mix(baseOpacity, opacity, blend);

    gl_Position = projectionMatrix * modelViewMatrix *
        vec4(mix(basePosition, position, vec3(blend)), 1.0);

  }

`;

/**
 * The fragment shader uses the UV coordinates to determine the final RGBA
 * values (gl_FragColor) to show for each pixel of the rendered output. It
 * uses the time uniform to interpolate between the starting and ending texture.
 */
const FRAGMENT_SHADER = `

  precision highp float;
  precision highp int;

  #define SHADER_NAME SpriteMaterial

  // Lightness that should ideally exactly match the vColor.
  #define TARGET_LIGHTNESS 0.6

  uniform float time;

  uniform sampler2D defaultTexture;
  uniform sampler2D spriteAtlas;

  varying vec2 vDefaultUv;
  varying vec2 vSpriteUv;
  varying vec4 vColor;
  varying float vOpacity;
  varying float vTextureMix;

  // Compute relative luminance from RGB.
  float rgbToL(vec3 rgb) {
    return dot(rgb, vec3(0.3, 0.59, 0.11));
  }

  // Apply luminance easing.
  float easeL(float l) {
    return 1.0 - (1.0 - l) * (1.0 - l) * (1.0 - l);
  }

  void main() {
    if (vOpacity <= 0.05) {
      discard;
    }

    // Interpolate between default texture and sprite texture.
    vec4 defaultColor =
      vTextureMix < 1.0 ? texture2D(defaultTexture, vDefaultUv) : vec4(0.0);
    vec4 spriteColor =
      vTextureMix > 0.0 ? texture2D(spriteAtlas, vSpriteUv) : vec4(0.0);
    vec4 mixedColor = mix(defaultColor, spriteColor, vTextureMix);

    // Lightness of the mixed pixel.
    float mixedL = rgbToL(mixedColor.rgb);

    // Using the mixed and target lightness, determine the color that's between
    // black, vColor and white.
    vec3 color = mixedL < TARGET_LIGHTNESS ?
        mix(vec3(0.0), vColor.rgb, easeL(mixedL / TARGET_LIGHTNESS)) :
        mix(vec3(1.0), vColor.rgb,
            easeL((1.0 - mixedL) / (1.0 - TARGET_LIGHTNESS)));

    vec3 finalColor = mix(mixedColor.rgb, color, vColor.a);

    // Apply opacity.
    gl_FragColor = vec4(finalColor, mixedColor.a * vOpacity);
  }
`;
