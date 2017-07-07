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
import {Sprite, SpriteMesh} from '../sprite-mesh';

const {expect} = chai;

describe('SpriteMesh', () => {

  describe('constructor', () => {

    it('should create empty state when constructed', () => {
      const spriteMesh = new SpriteMesh(1);
      expect(spriteMesh.spriteWidth).to.equal(1);
      expect(spriteMesh.spriteHeight).to.equal(1);
      expect(spriteMesh.positionData.length).to.equal(12);
      expect(spriteMesh.colorData.length).to.equal(16);
      expect(spriteMesh.faceIndexData).to.deep.equal(Uint32Array.from([
        0, 1, 2, 0, 2, 3
      ]));
      expect(spriteMesh.vertexIndexData).to.deep.equal(Float32Array.from([
        0, 1, 2, 3
      ]));
      expect(spriteMesh.opacityData).to.deep.equal(Float32Array.from([
        0, 0, 0, 0
      ]));
    });

  });

  describe('createSprite', () => {

    it('should produce new Sprites on request', () => {
      const spriteMesh = new SpriteMesh(2);
      const firstSprite = spriteMesh.createSprite();
      expect(firstSprite.spriteMesh).to.equal(spriteMesh);
      expect(firstSprite.spriteIndex).to.equal(0);
      const secondSprite = spriteMesh.createSprite();
      expect(secondSprite.spriteMesh).to.equal(spriteMesh);
      expect(secondSprite.spriteIndex).to.equal(1);
    });

  });

  describe('direct attribute setters', () => {

    it('should reflect setting positions in buffer data', () => {
      const spriteMesh = new SpriteMesh(2);

      spriteMesh.setX(0, 4);
      spriteMesh.setY(0, 6);
      spriteMesh.setZ(0, 8);

      spriteMesh.setX(1, 10);
      spriteMesh.setY(1, 12);
      spriteMesh.setZ(1, 14);

      expect(spriteMesh.positionData).to.deep.equal(Float32Array.from([

        // First Sprite.
        4, 6, 8,  // A
        5, 6, 8,  // B
        5, 7, 8,  // C
        4, 7, 8,  // D

        // Second Sprite.
        10, 12, 14,  // A
        11, 12, 14,  // B
        11, 13, 14,  // C
        10, 13, 14,  // D

      ]));

    });

    it('should reflect setting colors in buffer data', () => {
      const spriteMesh = new SpriteMesh(2);

      spriteMesh.setR(0, 100);
      spriteMesh.setG(0, 110);
      spriteMesh.setB(0, 120);
      spriteMesh.setA(0, 130);

      spriteMesh.setR(1, 200);
      spriteMesh.setG(1, 210);
      spriteMesh.setB(1, 220);
      spriteMesh.setA(1, 230);

      expect(spriteMesh.colorData).to.deep.equal(Uint8Array.from([

        // First Sprite.
        100, 110, 120, 130,  // A
        100, 110, 120, 130,  // B
        100, 110, 120, 130,  // C
        100, 110, 120, 130,  // D

        // Second Sprite.
        200, 210, 220, 230,  // A
        200, 210, 220, 230,  // B
        200, 210, 220, 230,  // C
        200, 210, 220, 230,  // D

      ]));

    });

    it('should reflect setting opacity in buffer data', () => {
      const spriteMesh = new SpriteMesh(2);

      spriteMesh.setOpacity(0, 0.25);
      spriteMesh.setOpacity(1, 0.75);

      expect(spriteMesh.opacityData).to.deep.equal(Float32Array.from([

        // First Sprite.
        0.25, 0.25, 0.25, 0.25,  // ABCD

        // Second Sprite.
        0.75, 0.75, 0.75, 0.75,  // ABCD

      ]));

    });

    it('should reflect setting timestamp in buffer data', () => {
      const spriteMesh = new SpriteMesh(2);

      // Vertex timestamps are relative to the mesh's construction timestamp.
      spriteMesh.setTimestamp(0, 10 + spriteMesh.constructionTimestamp);
      spriteMesh.setTimestamp(1, 20 + spriteMesh.constructionTimestamp);

      expect(spriteMesh.timestampData).to.deep.equal(Float32Array.from([

        // First Sprite.
        10, 10, 10, 10,  // ABCD

        // Second Sprite.
        20, 20, 20, 20,  // ABCD

      ]));

    });

  });

  describe('sprite attribute setters', () => {

    it('should reflect setting positions in buffer data', () => {
      const spriteMesh = new SpriteMesh(2);

      const firstSprite = spriteMesh.createSprite();
      const secondSprite = spriteMesh.createSprite();

      firstSprite.x = 4;
      firstSprite.y = 6;
      firstSprite.z = 8;

      secondSprite.x = 10;
      secondSprite.y = 12;
      secondSprite.z = 14;

      expect(spriteMesh.positionData).to.deep.equal(Float32Array.from([

        // First Sprite.
        4, 6, 8,  // A
        5, 6, 8,  // B
        5, 7, 8,  // C
        4, 7, 8,  // D

        // Second Sprite.
        10, 12, 14,  // A
        11, 12, 14,  // B
        11, 13, 14,  // C
        10, 13, 14,  // D

      ]));

    });

    it('should reflect setting colors in buffer data', () => {
      const spriteMesh = new SpriteMesh(2);

      const firstSprite = spriteMesh.createSprite();
      const secondSprite = spriteMesh.createSprite();

      firstSprite.r = 100;
      firstSprite.g = 110;
      firstSprite.b = 120;
      firstSprite.a = 130;

      secondSprite.r = 200;
      secondSprite.g = 210;
      secondSprite.b = 220;
      secondSprite.a = 230;

      expect(spriteMesh.colorData).to.deep.equal(Uint8Array.from([

        // First Sprite.
        100, 110, 120, 130,  // A
        100, 110, 120, 130,  // B
        100, 110, 120, 130,  // C
        100, 110, 120, 130,  // D

        // Second Sprite.
        200, 210, 220, 230,  // A
        200, 210, 220, 230,  // B
        200, 210, 220, 230,  // C
        200, 210, 220, 230,  // D

      ]));

    });

    it('should reflect setting opacity in buffer data', () => {
      const spriteMesh = new SpriteMesh(2);

      const firstSprite = spriteMesh.createSprite();
      const secondSprite = spriteMesh.createSprite();

      firstSprite.opacity = 0.25;

      secondSprite.opacity = 0.75;

      expect(spriteMesh.opacityData).to.deep.equal(Float32Array.from([

        // First Sprite.
        0.25, 0.25, 0.25, 0.25,  // ABCD

        // Second Sprite.
        0.75, 0.75, 0.75, 0.75,  // ABCD

      ]));

    });

    it('should reflect setting timestamp in buffer data', () => {
      const spriteMesh = new SpriteMesh(2);

      const firstSprite = spriteMesh.createSprite();
      const secondSprite = spriteMesh.createSprite();

      firstSprite.timestamp = 10 + spriteMesh.constructionTimestamp;

      secondSprite.timestamp = 20 + spriteMesh.constructionTimestamp;

      expect(spriteMesh.timestampData).to.deep.equal(Float32Array.from([

        // First Sprite.
        10, 10, 10, 10,  // ABCD

        // Second Sprite.
        20, 20, 20, 20,  // ABCD

      ]));

    });

  });

  describe('rebase', () => {

    it('should reflect rebased values in base attributes', () => {
      const spriteMesh = new SpriteMesh(1);
      const sprite = spriteMesh.createSprite();

      sprite.x = 10;
      sprite.y = 10;
      sprite.z = 10;
      sprite.r = 100;
      sprite.g = 100;
      sprite.b = 100;
      sprite.a = 100;
      sprite.opacity = 1;
      sprite.timestamp = 1000 + spriteMesh.constructionTimestamp;

      expect(spriteMesh.getBaseX(0)).to.equal(0);
      expect(spriteMesh.getBaseY(0)).to.equal(0);
      expect(spriteMesh.getBaseZ(0)).to.equal(0);
      expect(spriteMesh.getBaseR(0)).to.equal(0);
      expect(spriteMesh.getBaseG(0)).to.equal(0);
      expect(spriteMesh.getBaseB(0)).to.equal(0);
      expect(spriteMesh.getBaseA(0)).to.equal(0);
      expect(spriteMesh.getBaseOpacity(0)).to.equal(0);
      expect(spriteMesh.getBaseTimestamp(0))
          .to.equal(spriteMesh.constructionTimestamp);

      sprite.rebase(500 + spriteMesh.constructionTimestamp);

      expect(spriteMesh.getBaseX(0)).to.equal(5);
      expect(spriteMesh.getBaseY(0)).to.equal(5);
      expect(spriteMesh.getBaseZ(0)).to.equal(5);
      expect(spriteMesh.getBaseR(0)).to.equal(50);
      expect(spriteMesh.getBaseG(0)).to.equal(50);
      expect(spriteMesh.getBaseB(0)).to.equal(50);
      expect(spriteMesh.getBaseA(0)).to.equal(50);
      expect(spriteMesh.getBaseOpacity(0)).to.equal(0.5);
      expect(spriteMesh.getBaseTimestamp(0))
          .to.equal(500 + spriteMesh.constructionTimestamp);

      sprite.rebase(1000 + spriteMesh.constructionTimestamp);

      expect(spriteMesh.getBaseX(0)).to.equal(10);
      expect(spriteMesh.getBaseY(0)).to.equal(10);
      expect(spriteMesh.getBaseZ(0)).to.equal(10);
      expect(spriteMesh.getBaseR(0)).to.equal(100);
      expect(spriteMesh.getBaseG(0)).to.equal(100);
      expect(spriteMesh.getBaseB(0)).to.equal(100);
      expect(spriteMesh.getBaseA(0)).to.equal(100);
      expect(spriteMesh.getBaseOpacity(0)).to.equal(1);
      expect(spriteMesh.getBaseTimestamp(0))
          .to.equal(1000 + spriteMesh.constructionTimestamp);

      sprite.rebase(2000 + spriteMesh.constructionTimestamp);

      expect(spriteMesh.getBaseTimestamp(0))
          .to.equal(2000 + spriteMesh.constructionTimestamp);
    });

  });

  describe('findSprites', () => {

    const spriteMesh = new SpriteMesh(4);

    spriteMesh.setX(0, 4);
    spriteMesh.setY(0, 6);
    spriteMesh.setZ(0, 8);

    spriteMesh.setX(1, -14);
    spriteMesh.setY(1, -12);
    spriteMesh.setZ(1, -10);

    spriteMesh.setX(2, 40);
    spriteMesh.setY(2, 40);
    spriteMesh.setZ(2, 0);

    spriteMesh.setX(3, 40);
    spriteMesh.setY(3, 40);
    spriteMesh.setZ(3, 0);

    it('should find matching sprites', () => {
      expect(spriteMesh.findSprites(4, 6)).to.deep.equal([0]);
      expect(spriteMesh.findSprites(4, 6.5)).to.deep.equal([0]);
      expect(spriteMesh.findSprites(4, 7)).to.deep.equal([0]);
      expect(spriteMesh.findSprites(4.5, 6)).to.deep.equal([0]);
      expect(spriteMesh.findSprites(4.5, 6.5)).to.deep.equal([0]);
      expect(spriteMesh.findSprites(4.5, 7)).to.deep.equal([0]);
      expect(spriteMesh.findSprites(5, 6)).to.deep.equal([0]);
      expect(spriteMesh.findSprites(5, 6.5)).to.deep.equal([0]);
      expect(spriteMesh.findSprites(5, 7)).to.deep.equal([0]);
      expect(spriteMesh.findSprites(-14, -12)).to.deep.equal([1]);
      expect(spriteMesh.findSprites(-14, -11.5)).to.deep.equal([1]);
      expect(spriteMesh.findSprites(-14, -11)).to.deep.equal([1]);
      expect(spriteMesh.findSprites(-13.5, -12)).to.deep.equal([1]);
      expect(spriteMesh.findSprites(-13.5, -11.5)).to.deep.equal([1]);
      expect(spriteMesh.findSprites(-13.5, -11)).to.deep.equal([1]);
      expect(spriteMesh.findSprites(-13, -12)).to.deep.equal([1]);
      expect(spriteMesh.findSprites(-13, -11.5)).to.deep.equal([1]);
      expect(spriteMesh.findSprites(-13, -11)).to.deep.equal([1]);
    });

    it('should find overlapping sprites', () => {
      expect(spriteMesh.findSprites(40, 40)).to.deep.equal([2, 3]);
      expect(spriteMesh.findSprites(40, 40.5)).to.deep.equal([2, 3]);
      expect(spriteMesh.findSprites(40, 41)).to.deep.equal([2, 3]);
      expect(spriteMesh.findSprites(40.5, 40)).to.deep.equal([2, 3]);
      expect(spriteMesh.findSprites(40.5, 40.5)).to.deep.equal([2, 3]);
      expect(spriteMesh.findSprites(40.5, 41)).to.deep.equal([2, 3]);
      expect(spriteMesh.findSprites(41, 40)).to.deep.equal([2, 3]);
      expect(spriteMesh.findSprites(41, 40.5)).to.deep.equal([2, 3]);
      expect(spriteMesh.findSprites(41, 41)).to.deep.equal([2, 3]);
    });

    it('should not find non-matching sprites', () => {
      expect(spriteMesh.findSprites(0, 0)).to.deep.equal([]);
      expect(spriteMesh.findSprites(3.5, 6.5)).to.deep.equal([]);
      expect(spriteMesh.findSprites(5.5, 6.5)).to.deep.equal([]);
      expect(spriteMesh.findSprites(4.5, 7.5)).to.deep.equal([]);
      expect(spriteMesh.findSprites(4.5, 5.5)).to.deep.equal([]);
      expect(spriteMesh.findSprites(-14.5, -11.5)).to.deep.equal([]);
      expect(spriteMesh.findSprites(-12.5, -11.5)).to.deep.equal([]);
      expect(spriteMesh.findSprites(-13.5, -12.5)).to.deep.equal([]);
      expect(spriteMesh.findSprites(-13.5, -10.5)).to.deep.equal([]);
    });

  });

});
