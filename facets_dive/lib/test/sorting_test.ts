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
import {horizontalStringCompare, numberCompare, verticalStringCompare} from '../sorting';

const {expect} = chai;

describe('horizontalStringCompare', () => {

  it('should correctly compare undefined and null', () => {
    expect(horizontalStringCompare(null!, null!)).to.equal(0);
    expect(horizontalStringCompare(null!, undefined!)).to.equal(1);
    expect(horizontalStringCompare(undefined!, null!)).to.equal(-1);
    expect(horizontalStringCompare(undefined!, undefined!)).to.equal(0);
  });

  it('should put null or undefined before other values', () => {
    expect(horizontalStringCompare(null!, 0)).to.equal(-1);
    expect(horizontalStringCompare(null!, 'banana')).to.equal(-1);
    expect(horizontalStringCompare(undefined!, 0)).to.equal(-1);
    expect(horizontalStringCompare(undefined!, 'banana')).to.equal(-1);
    expect(horizontalStringCompare(0, null!)).to.equal(1);
    expect(horizontalStringCompare('banana', null!)).to.equal(1);
    expect(horizontalStringCompare(0, undefined!)).to.equal(1);
    expect(horizontalStringCompare('banana', undefined!)).to.equal(1);
  });

  it('should put numbers before strings', () => {
    expect(horizontalStringCompare(10, 'banana')).to.equal(-1);
    expect(horizontalStringCompare(10, '10')).to.equal(-1);
    expect(horizontalStringCompare('banana', 10)).to.equal(1);
    expect(horizontalStringCompare('10', 10)).to.equal(1);
  });

  it('should put NaN before any other number', () => {
    expect(horizontalStringCompare(NaN, 0)).to.equal(-1);
    expect(horizontalStringCompare(NaN, 1)).to.equal(-1);
    expect(horizontalStringCompare(NaN, -1)).to.equal(-1);
    expect(horizontalStringCompare(NaN, Infinity)).to.equal(-1);
    expect(horizontalStringCompare(NaN, -Infinity)).to.equal(-1);
    expect(horizontalStringCompare(0, NaN)).to.equal(1);
    expect(horizontalStringCompare(1, NaN)).to.equal(1);
    expect(horizontalStringCompare(-1, NaN)).to.equal(1);
    expect(horizontalStringCompare(Infinity, NaN)).to.equal(1);
    expect(horizontalStringCompare(-Infinity, NaN)).to.equal(1);
  });

  it('should compare numbers correctly', () => {
    expect(horizontalStringCompare(0, 1)).to.be.below(0);
    expect(horizontalStringCompare(1, 0)).to.be.above(0);
    expect(horizontalStringCompare(-1, 0)).to.be.below(0);
    expect(horizontalStringCompare(1, -1)).to.be.above(0);
    expect(horizontalStringCompare(10, 10)).to.equal(0);
    expect(horizontalStringCompare(0, 0)).to.equal(0);
  });

  it('should compare strings correctly', () => {
    expect(horizontalStringCompare('', 'apple')).to.equal(-1);
    expect(horizontalStringCompare('apple', '')).to.equal(1);
    expect(horizontalStringCompare('apple', 'banana')).to.equal(-1);
    expect(horizontalStringCompare('banana', 'apple')).to.equal(1);
    expect(horizontalStringCompare('apple', 'apple')).to.equal(0);
    expect(horizontalStringCompare('APPLE', 'apple')).to.equal(1);
  });

});

describe('verticalStringCompare', () => {

  it('should correctly compare undefined and null', () => {
    expect(verticalStringCompare(null!, null!)).to.equal(0);
    expect(verticalStringCompare(null!, undefined!)).to.equal(1);
    expect(verticalStringCompare(undefined!, null!)).to.equal(-1);
    expect(verticalStringCompare(undefined!, undefined!)).to.equal(0);
  });

  it('should put null or undefined before other values', () => {
    expect(verticalStringCompare(null!, 0)).to.equal(-1);
    expect(verticalStringCompare(null!, 'banana')).to.equal(-1);
    expect(verticalStringCompare(undefined!, 0)).to.equal(-1);
    expect(verticalStringCompare(undefined!, 'banana')).to.equal(-1);
    expect(verticalStringCompare(0, null!)).to.equal(1);
    expect(verticalStringCompare('banana', null!)).to.equal(1);
    expect(verticalStringCompare(0, undefined!)).to.equal(1);
    expect(verticalStringCompare('banana', undefined!)).to.equal(1);
  });

  it('should put numbers before strings', () => {
    expect(verticalStringCompare(10, 'banana')).to.equal(-1);
    expect(verticalStringCompare(10, '10')).to.equal(-1);
    expect(verticalStringCompare('banana', 10)).to.equal(1);
    expect(verticalStringCompare('10', 10)).to.equal(1);
  });

  it('should put NaN before any other number', () => {
    expect(verticalStringCompare(NaN, 0)).to.equal(-1);
    expect(verticalStringCompare(NaN, 1)).to.equal(-1);
    expect(verticalStringCompare(NaN, -1)).to.equal(-1);
    expect(verticalStringCompare(NaN, Infinity)).to.equal(-1);
    expect(verticalStringCompare(NaN, -Infinity)).to.equal(-1);
    expect(verticalStringCompare(0, NaN)).to.equal(1);
    expect(verticalStringCompare(1, NaN)).to.equal(1);
    expect(verticalStringCompare(-1, NaN)).to.equal(1);
    expect(verticalStringCompare(Infinity, NaN)).to.equal(1);
    expect(verticalStringCompare(-Infinity, NaN)).to.equal(1);
  });

  it('should compare numbers correctly (in reverse)', () => {
    expect(verticalStringCompare(0, 1)).to.be.above(0);
    expect(verticalStringCompare(1, 0)).to.be.below(0);
    expect(verticalStringCompare(-1, 0)).to.be.above(0);
    expect(verticalStringCompare(1, -1)).to.be.below(0);
    expect(verticalStringCompare(10, 10)).to.equal(0);
    expect(verticalStringCompare(0, 0)).to.equal(0);
  });

  it('should compare strings correctly (in reverse)', () => {
    expect(verticalStringCompare('', 'apple')).to.equal(1);
    expect(verticalStringCompare('apple', '')).to.equal(-1);
    expect(verticalStringCompare('apple', 'banana')).to.equal(1);
    expect(verticalStringCompare('banana', 'apple')).to.equal(-1);
    expect(verticalStringCompare('apple', 'apple')).to.equal(0);
    expect(verticalStringCompare('APPLE', 'apple')).to.equal(-1);
  });

});

describe('numberCompare', () => {

  it('should correctly compare undefined and null', () => {
    expect(numberCompare(null!, null!)).to.equal(0);
    expect(numberCompare(null!, undefined!)).to.equal(1);
    expect(numberCompare(undefined!, null!)).to.equal(-1);
    expect(numberCompare(undefined!, undefined!)).to.equal(0);
  });

  it('should put null or undefined before other values', () => {
    expect(numberCompare(null!, 0)).to.equal(-1);
    expect(numberCompare(null!, 'banana')).to.equal(-1);
    expect(numberCompare(undefined!, 0)).to.equal(-1);
    expect(numberCompare(undefined!, 'banana')).to.equal(-1);
    expect(numberCompare(0, null!)).to.equal(1);
    expect(numberCompare('banana', null!)).to.equal(1);
    expect(numberCompare(0, undefined!)).to.equal(1);
    expect(numberCompare('banana', undefined!)).to.equal(1);
  });

  it('should put strings before numbers', () => {
    expect(numberCompare('banana', 10)).to.equal(-1);
    expect(numberCompare('10', 10)).to.equal(-1);
    expect(numberCompare(10, 'banana')).to.equal(1);
    expect(numberCompare(10, '10')).to.equal(1);
  });

  it('should put NaN before any other number', () => {
    expect(numberCompare(NaN, 0)).to.equal(-1);
    expect(numberCompare(NaN, 1)).to.equal(-1);
    expect(numberCompare(NaN, -1)).to.equal(-1);
    expect(numberCompare(NaN, Infinity)).to.equal(-1);
    expect(numberCompare(NaN, -Infinity)).to.equal(-1);
    expect(numberCompare(0, NaN)).to.equal(1);
    expect(numberCompare(1, NaN)).to.equal(1);
    expect(numberCompare(-1, NaN)).to.equal(1);
    expect(numberCompare(Infinity, NaN)).to.equal(1);
    expect(numberCompare(-Infinity, NaN)).to.equal(1);
  });

  it('should compare numbers correctly', () => {
    expect(numberCompare(0, 1)).to.be.below(0);
    expect(numberCompare(1, 0)).to.be.above(0);
    expect(numberCompare(-1, 0)).to.be.below(0);
    expect(numberCompare(1, -1)).to.be.above(0);
    expect(numberCompare(10, 10)).to.equal(0);
    expect(numberCompare(0, 0)).to.equal(0);
  });

  it('should compare strings correctly', () => {
    expect(numberCompare('', 'apple')).to.equal(-1);
    expect(numberCompare('apple', '')).to.equal(1);
    expect(numberCompare('apple', 'banana')).to.equal(-1);
    expect(numberCompare('banana', 'apple')).to.equal(1);
    expect(numberCompare('apple', 'apple')).to.equal(0);
    expect(numberCompare('APPLE', 'apple')).to.equal(1);
  });

});
