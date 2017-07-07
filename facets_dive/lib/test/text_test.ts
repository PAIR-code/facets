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
import {Segment, TextFitter, TextSpecs} from '../text';

const {expect} = chai;

describe('TextFitter', () => {

  describe('split', () => {

    it('should split strings', () => {

      const fitter = new TextFitter(
          {x: 0, y: 0, width: 100, height: 100, glyphAspectRatio: 1});

      let segments: Segment[] = null!;

      segments = fitter.split('A').segments;
      expect(segments.length).to.equal(1);
      expect(segments[0].text).to.equal('A');
      expect(segments[0].whitespace).to.equal(false);

      segments = fitter.split('apple    banana').segments;
      expect(segments.length).to.equal(3);
      expect(segments[0].text).to.equal('apple');
      expect(segments[0].whitespace).to.equal(false);
      expect(segments[1].text).to.equal('    ');
      expect(segments[1].whitespace).to.equal(true);
      expect(segments[2].text).to.equal('banana');
      expect(segments[2].whitespace).to.equal(false);

    });

  });

  describe('computeTextRect', () => {

    it('should compute text rects', () => {

      const fitter = new TextFitter({
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        glyphAspectRatio: 1,  // Unrealistic "square" glyphs.
        lineHeight: 2,        // Keep one whole line between letters.
      });

      let rect: {width: number; height: number;} = null!;

      rect = fitter.computeTextRect(fitter.split('A').segments, 2);
      expect(rect.width).to.equal(1);
      expect(rect.height).to.equal(1);

      rect = fitter.computeTextRect(fitter.split('A B').segments, 2);
      expect(rect.width).to.equal(1);
      expect(rect.height)
          .to.equal(3);  // A and B on separate lines with 1 between.

      rect = fitter.computeTextRect(fitter.split('A B   C').segments, 4);
      expect(rect.width).to.equal(3);
      expect(rect.height).to.equal(3);  // Lines: "A B" and "C".

      const text = 'the quick brown fox jumped over the lazy dog.';
      rect = fitter.computeTextRect(fitter.split(text).segments, 4);
      expect(rect.width).to.equal(6);
      expect(rect.height)
          .to.equal(17);  // One word per line, with a line between.

    });

  });

  describe('computeCutoff', () => {

    it('should find best cutoff for square glyphs and double spacing', () => {

      const fitter = new TextFitter({
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        glyphAspectRatio: 1,  // Unrealistic "square" glyphs.
        lineHeight: 2,        // Keep one whole line between letters.
      });

      // Helper for performing search.
      const computeCutoff = (text: string) => {
        text = text.trim();
        const {max, segments} = fitter.split(text);
        return fitter.computeCutoff(segments, text.length, max);
      };

      let ret: {cutoff: number; width: number; height: number;} = null!;

      ret = computeCutoff('A');
      expect(ret.cutoff).to.be.closeTo(1, 1e-1);
      expect(ret.width).to.equal(1);
      expect(ret.height).to.equal(1);

      ret = computeCutoff('A B C');
      expect(ret.cutoff).to.be.closeTo(3, 1e-1);
      expect(ret.width).to.equal(3);
      expect(ret.height).to.equal(3);

      ret = computeCutoff('The quick brown fox jumped over the lazy dog.');
      expect(ret.cutoff).to.be.closeTo(10.9, 1e-1);
      expect(ret.width).to.equal(9);
      expect(ret.height).to.equal(9);

    });

    it('should find best cutoff for tall glyphs and single spacing', () => {

      const fitter = new TextFitter({
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        glyphAspectRatio: 1 / 2,  // Tall glyphs.
        lineHeight: 1,            // No space between lines.
      });

      // Helper for performing search.
      const computeCutoff = (text: string) => {
        text = text.trim();
        const {max, segments} = fitter.split(text);
        return fitter.computeCutoff(segments, text.length, max);
      };

      let ret: {cutoff: number; width: number; height: number;} = null!;

      ret = computeCutoff('A');
      expect(ret.cutoff).to.be.closeTo(1, 1e-1);
      expect(ret.width).to.equal(1);
      expect(ret.height).to.equal(1);

      ret = computeCutoff('A B C');
      expect(ret.cutoff).to.be.closeTo(3, 1e-1);
      expect(ret.width).to.equal(3);
      expect(ret.height).to.equal(2);

      ret = computeCutoff('The quick brown fox jumped over the lazy dog.');
      expect(ret.cutoff).to.be.closeTo(10.9, 1e-1);
      expect(ret.width).to.equal(9);
      expect(ret.height).to.equal(5);

    });
  });

  describe('wrapLines', () => {

    it('should wrap segments into lines', () => {

      const fitter = new TextFitter({
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        glyphAspectRatio: 1 / 2,  // Tall glyphs.
        lineHeight: 1,            // No space between lines.
      });

      let lines: {startPos: number, endPos: number, textLength: number}[] =
          null!;

      lines = fitter.wrapLines(fitter.split('A').segments, 1);
      expect(lines.length).to.equal(1);
      expect(lines[0].startPos).to.equal(0);
      expect(lines[0].endPos).to.equal(1);
      expect(lines[0].textLength).to.equal(1);

      lines = fitter.wrapLines(fitter.split('apple   banana').segments, 3);
      expect(lines.length).to.equal(2);
      expect(lines[0].startPos).to.equal(0);
      expect(lines[0].endPos).to.equal(1);
      expect(lines[0].textLength).to.equal(5);  // 'apple'.
      expect(lines[1].startPos).to.equal(2);
      expect(lines[1].endPos).to.equal(3);
      expect(lines[1].textLength).to.equal(6);  // 'banana'.

      const text = `
          the quick brown fox
          jumped over the
          lazy dog.
      `;
      lines = fitter.wrapLines(fitter.split(text).segments, 10);
      expect(lines.length).to.equal(5);
      expect(lines[0].startPos).to.equal(1);
      expect(lines[0].endPos).to.equal(4);
      expect(lines[0].textLength).to.equal(9);  // 'the quick'.
      expect(lines[1].startPos).to.equal(5);
      expect(lines[1].endPos).to.equal(8);
      expect(lines[1].textLength).to.equal(9);  // 'brown fox'.
      expect(lines[2].startPos).to.equal(9);
      expect(lines[2].endPos).to.equal(10);
      expect(lines[2].textLength).to.equal(6);  // 'jumped'.
      expect(lines[3].startPos).to.equal(11);
      expect(lines[3].endPos).to.equal(14);
      expect(lines[3].textLength).to.equal(8);  // 'over the'.
      expect(lines[4].startPos).to.equal(15);
      expect(lines[4].endPos).to.equal(18);
      expect(lines[4].textLength).to.equal(9);  // 'lazy dog.'.
    });

  });

  describe('fit', () => {

    it('should fit text', () => {

      const fitter = new TextFitter({width: 100, height: 100});

      let res: TextSpecs = null!;

      res = fitter.fit('A');
      expect(res.fontSize).to.be.closeTo(100, 1e-1);
      expect(res.lines.length).to.equal(1);
      expect(res.lines[0].x).to.be.closeTo(20, 1e-1);
      expect(res.lines[0].y).to.be.closeTo(0, 1e-1);
      expect(res.lines[0].text).to.equal('A');

      res = fitter.fit('hello');
      expect(res.fontSize).to.be.closeTo(33.3, 1e-1);
      expect(res.lines.length).to.equal(1);
      expect(res.lines[0].x).to.be.closeTo(0, 1e-1);
      expect(res.lines[0].y).to.be.closeTo(33.3, 1e-1);
      expect(res.lines[0].text).to.equal('hello');

      res = fitter.fit('the quick brown fox jumped over the lazy dog.');
      expect(res.fontSize).to.be.closeTo(18.5, 1e-1);
      expect(res.lines.length).to.equal(5);
      expect(res.lines[0].x).to.be.closeTo(0, 1e-1);
      expect(res.lines[0].y).to.be.closeTo(0, 1e-1);
      expect(res.lines[0].text).to.equal('the quick');
      expect(res.lines[1].x).to.be.closeTo(0, 1e-1);
      expect(res.lines[1].y).to.be.closeTo(20.4, 1e-1);
      expect(res.lines[1].text).to.equal('brown fox');
      expect(res.lines[2].x).to.be.closeTo(16.7, 1e-1);
      expect(res.lines[2].y).to.be.closeTo(40.7, 1e-1);
      expect(res.lines[2].text).to.equal('jumped');
      expect(res.lines[3].x).to.be.closeTo(5.6, 1e-1);
      expect(res.lines[3].y).to.be.closeTo(61.1, 1e-1);
      expect(res.lines[3].text).to.equal('over the');
      expect(res.lines[4].x).to.be.closeTo(0, 1e-1);
      expect(res.lines[4].y).to.be.closeTo(81.5, 1e-1);
      expect(res.lines[4].text).to.equal('lazy dog.');

    });

  });

});
