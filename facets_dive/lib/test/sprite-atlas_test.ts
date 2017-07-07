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
import {SpriteAtlas} from '../sprite-atlas';

const {expect} = chai;

describe('SpriteAtlas', () => {

  describe('constructor', () => {

    it('should initialize internal properties from arguments', () => {
      // Create an atlas holding 400 sprites of size 10px by 10px.
      const spriteAtlas = new SpriteAtlas(400, 10, 10);

      // Properties set directly from arguments.
      expect(spriteAtlas.capacity).to.equal(400);
      expect(spriteAtlas.imageWidth).to.equal(10);
      expect(spriteAtlas.imageHeight).to.equal(10);

      // Properties computed from arguments.
      expect(spriteAtlas.spriteColumns).to.equal(20);
      expect(spriteAtlas.spriteRows).to.equal(20);
      expect(spriteAtlas.canvas.width).to.equal(200);
      expect(spriteAtlas.canvas.height).to.equal(200);
    });

  });

  describe('updatePropertiesToMatchImageDimensions', () => {

    it('should do nothing if dimensions exactly match', () => {
      // Create an atlas holding 400 sprites of size 10px by 10px.
      const spriteAtlas = new SpriteAtlas(400, 10, 10);

      // Properties computed from arguments.
      expect(spriteAtlas.spriteColumns).to.equal(20);
      expect(spriteAtlas.spriteRows).to.equal(20);
      expect(spriteAtlas.canvas.width).to.equal(200);
      expect(spriteAtlas.canvas.height).to.equal(200);

      spriteAtlas.updatePropertiesToMatchImageDimensions(200, 200);

      // Confirm that computed properties remain unchanged.
      expect(spriteAtlas.spriteColumns).to.equal(20);
      expect(spriteAtlas.spriteRows).to.equal(20);
      expect(spriteAtlas.canvas.width).to.equal(200);
      expect(spriteAtlas.canvas.height).to.equal(200);
    });

    it('should update settings if dimensions fit', () => {
      // Create an atlas holding 400 sprites of size 10px by 10px.
      const spriteAtlas = new SpriteAtlas(400, 10, 10);

      // Properties computed from arguments.
      expect(spriteAtlas.spriteColumns).to.equal(20);
      expect(spriteAtlas.spriteRows).to.equal(20);
      expect(spriteAtlas.canvas.width).to.equal(200);
      expect(spriteAtlas.canvas.height).to.equal(200);

      spriteAtlas.updatePropertiesToMatchImageDimensions(400, 100);

      // Confirm that computed properties have been updated.
      expect(spriteAtlas.spriteColumns).to.equal(40);
      expect(spriteAtlas.spriteRows).to.equal(10);
      expect(spriteAtlas.canvas.width).to.equal(400);
      expect(spriteAtlas.canvas.height).to.equal(100);
    });

    it('should throw an error if capacity is insufficient', () => {
      // Create an atlas holding 400 sprites of size 10px by 10px.
      const spriteAtlas = new SpriteAtlas(400, 10, 10);

      expect(() => spriteAtlas.updatePropertiesToMatchImageDimensions(10, 10))
          .to.throw(/capacity/);
    });

    it('should throw an error if atlas geometry does not match images', () => {
      // Create an atlas holding 400 sprites of size 10px by 10px.
      const spriteAtlas = new SpriteAtlas(400, 10, 10);

      expect(() => spriteAtlas.updatePropertiesToMatchImageDimensions(201, 201))
          .to.throw(/dimensions/);
    });

  });

});
