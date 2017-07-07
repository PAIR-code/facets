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
import {Layout} from '../layout';

const {expect} = chai;

describe('Layout', () => {

  describe('computeScale', () => {

    let layout: Layout;

    beforeEach(() => {
      layout = new Layout();
    });

    it('should return NaN when uninitialized', () => {
      expect(layout.computeScale()).to.be.NaN;
    });

    it('should return 1 for matching grid to viewport', () => {
      layout.grid = {bottom: 0, left: 0, right: 100, top: 100};
      layout.viewport = {height: 100, width: 100};
      expect(layout.computeScale()).to.equal(1.0);
    });

    it('should compute correct scale for matching aspect ratio', () => {
      layout.grid = {bottom: 0, left: 0, right: 100, top: 100};
      layout.viewport = {height: 1000, width: 1000};
      expect(layout.computeScale()).to.equal(10.0);
    });

    it('should compute correct scale for vertical viewport', () => {
      layout.grid = {bottom: 0, left: 0, right: 100, top: 100};
      layout.viewport = {height: 1000, width: 200};
      expect(layout.computeScale()).to.equal(2.0);
    });

    it('should compute correct scale for horizontal viewport', () => {
      layout.grid = {bottom: 0, left: 0, right: 100, top: 100};
      layout.viewport = {height: 200, width: 1000};
      expect(layout.computeScale()).to.equal(2.0);
    });

    it('should compute correct scale with padding', () => {
      layout.grid = {bottom: 0, left: 0, right: 100, top: 100};
      layout.viewport = {height: 1040, width: 1040};
      layout.padding = {bottom: 20, left: 20, right: 20, top: 20};
      expect(layout.computeScale()).to.equal(10.0);
    });

  });

  describe('computeCamera', () => {

    let layout: Layout;

    beforeEach(() => {
      layout = new Layout();
    });

    it('should return NaNs when uninitialized', () => {
      expect(layout.computeCamera()).to.deep.equal({
        position: {x: NaN, y: NaN},
        frustum: {bottom: NaN, left: NaN, right: NaN, top: NaN}
      });
    });

    it('should return correct camera for matching grid and viewport', () => {
      layout.grid = {bottom: 0, left: 0, right: 100, top: 100};
      layout.viewport = {height: 100, width: 100};
      expect(layout.computeCamera()).to.deep.equal({
        position: {x: 0, y: 100},
        frustum: {bottom: -100, left: 0, right: 100, top: 0}
      });
    });

    it('should return correct camera for matching aspect ratio', () => {
      layout.grid = {bottom: 0, left: 0, right: 100, top: 100};
      layout.viewport = {height: 1000, width: 1000};
      expect(layout.computeCamera()).to.deep.equal({
        position: {x: 0, y: 100},
        frustum: {bottom: -100, left: 0, right: 100, top: 0}
      });
    });

    it('should return correct camera for vertical viewport', () => {
      layout.grid = {bottom: 0, left: 0, right: 100, top: 100};
      layout.viewport = {height: 1000, width: 200};
      expect(layout.computeCamera()).to.deep.equal({
        position: {x: 0, y: 300},
        frustum: {bottom: -500, left: 0, right: 100, top: 0}
      });
    });

    it('should return correct camera for horizontal viewport', () => {
      layout.grid = {bottom: 0, left: 0, right: 100, top: 100};
      layout.viewport = {height: 200, width: 1000};
      expect(layout.computeCamera()).to.deep.equal({
        position: {x: -200, y: 100},
        frustum: {bottom: -100, left: 0, right: 500, top: 0}
      });
    });

    it('should return correct camera with padding', () => {
      layout.grid = {bottom: 0, left: 0, right: 100, top: 100};
      layout.viewport = {height: 1040, width: 1040};
      layout.padding = {bottom: 20, left: 20, right: 20, top: 20};
      expect(layout.computeCamera()).to.deep.equal({
        position: {x: -2, y: 102},
        frustum: {bottom: -104, left: 0, right: 104, top: 0}
      });
    });


  });

  describe('reducePaddingToFitWidth', () => {

    let layout: Layout;

    beforeEach(() => {
      layout = new Layout();
      layout.padding.left = 50;
      layout.padding.right = 150;
    });

    it('should leave padding alone if space is sufficient', () => {
      layout.reducePaddingToFitWidth(1000, 200);
      expect(layout.padding.left).to.equal(50);
      expect(layout.padding.right).to.equal(150);
    });

    it('should remove all padding if rect has less than minimum space', () => {
      layout.reducePaddingToFitWidth(200, 1000);
      expect(layout.padding.left).to.equal(0);
      expect(layout.padding.right).to.equal(0);
    });

    it('should trade off padding to fit rect in space', () => {
      layout.reducePaddingToFitWidth(300, 200);
      expect(layout.padding.left).to.equal(25);
      expect(layout.padding.right).to.equal(75);
    });

    it('should not produce a divizion by zero error for zero padding', () => {
      layout.padding.left = 0;
      layout.padding.right = 0;
      layout.reducePaddingToFitWidth(300, 200);
      expect(layout.padding.left).to.equal(0);
      expect(layout.padding.right).to.equal(0);
    });

  });

  describe('reducePaddingToFitHeight', () => {

    let layout: Layout;

    beforeEach(() => {
      layout = new Layout();
      layout.padding.top = 50;
      layout.padding.bottom = 150;
    });

    it('should leave padding alone if space is sufficient', () => {
      layout.reducePaddingToFitHeight(1000, 200);
      expect(layout.padding.top).to.equal(50);
      expect(layout.padding.bottom).to.equal(150);
    });

    it('should remove all padding if rect has less than minimum space', () => {
      layout.reducePaddingToFitHeight(200, 1000);
      expect(layout.padding.top).to.equal(0);
      expect(layout.padding.bottom).to.equal(0);
    });

    it('should trade off padding to fit rect in space', () => {
      layout.reducePaddingToFitHeight(300, 200);
      expect(layout.padding.top).to.equal(25);
      expect(layout.padding.bottom).to.equal(75);
    });

    it('should not produce a divizion by zero error for zero padding', () => {
      layout.padding.top = 0;
      layout.padding.bottom = 0;
      layout.reducePaddingToFitHeight(300, 200);
      expect(layout.padding.top).to.equal(0);
      expect(layout.padding.bottom).to.equal(0);
    });

  });

});
