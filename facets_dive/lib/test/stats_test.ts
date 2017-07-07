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
import {FieldStats, getAllKeys, getStats, isInteger} from '../stats';

const {expect} = chai;

describe('getAllKeys', () => {

  it('should return an empty array for null input', () => {
    const ret = getAllKeys(null);
    expect(ret).to.deep.equal([]);
  });

  it('should return an empty array for an empty array input', () => {
    const ret = getAllKeys([]);
    expect(ret).to.deep.equal([]);
  });

  it('should return all keys from a single object', () => {
    const ret = getAllKeys([{red: 255, blue: 0, green: 0}]);
    expect(ret).to.deep.equal(['red', 'blue', 'green']);
  });

  it('should return all keys from multiple objects', () => {
    const ret = getAllKeys([{red: 255, blue: 0}, {blue: 255, green: 0}]);
    expect(ret).to.deep.equal(['red', 'blue', 'green']);
  });

  it('should ignore null objects in the list', () => {
    const ret = getAllKeys([{red: 255}, null, {blue: 0}, null, {green: 0}]);
    expect(ret).to.deep.equal(['red', 'blue', 'green']);
  });

});


describe('isInteger', () => {

  it('should detect integer values as integers', () => {
    expect(isInteger(-10000)).to.equal(true);
    expect(isInteger(-1)).to.equal(true);
    expect(isInteger(0)).to.equal(true);
    expect(isInteger(1)).to.equal(true);
    expect(isInteger(10000)).to.equal(true);
  });

  it('should detect fractional number values as non-integers', () => {
    expect(isInteger(0.01)).to.equal(false);
    expect(isInteger(-2.5)).to.equal(false);
    expect(isInteger(Math.PI)).to.equal(false);
  });

  it('should detect NaN values as non-integers', () => {
    expect(isInteger(NaN)).to.equal(false);
  });

  it('should detect infinite values as non-integers', () => {
    expect(isInteger(Infinity)).to.equal(false);
    expect(isInteger(-Infinity)).to.equal(false);
  });

  it('should detect NaN values as non-integers', () => {
    expect(isInteger(null)).to.equal(false);
    expect(isInteger(undefined)).to.equal(false);
  });

  it('should detect string values as non-integers', () => {
    expect(isInteger('' as any)).to.equal(false);
    expect(isInteger('foo' as any)).to.equal(false);
    expect(isInteger('200000' as any)).to.equal(false);
    expect(isInteger('-300000' as any)).to.equal(false);
  });

  it('should detect array and object values as non-integers', () => {
    expect(isInteger([-1] as any)).to.equal(false);
    expect(isInteger(new Number(42) as any)).to.equal(false);
    expect(isInteger({valueOf: () => 2} as any)).to.equal(false);
  });

});

describe('FieldStats', () => {

  describe('numberMin', () => {
    it('should contain null to start', () => {
      const stats = new FieldStats();
      expect(stats.numberMin).to.equal(null);
    });
  });

  describe('numberMax', () => {
    it('should contain null to start', () => {
      const stats = new FieldStats();
      expect(stats.numberMax).to.equal(null);
    });
  });

  describe('isNumeric', () => {

    it('should identify numeric fields', () => {
      const stats = new FieldStats();
      stats.totalCount = 2;
      stats.numberCount = 2;
      stats.stringCount = 0;
      stats.otherCount = 0;
      stats.numberMin = -100;
      stats.numberMax = 100;
      expect(stats.isNumeric()).to.equal(true);
    });

    it('should identify non-numeric fields', () => {
      const stats = new FieldStats();
      stats.totalCount = 2;
      stats.numberCount = 0;
      stats.stringCount = 2;
      stats.otherCount = 0;
      stats.numberMin = null;
      stats.numberMax = null;
      expect(stats.isNumeric()).to.equal(false);
    });

  });

  describe('isInteger', () => {

    it('should return true for integer-only fields', () => {
      const stats = new FieldStats();
      stats.totalCount = 2;
      stats.numberCount = 2;
      stats.integerCount = 2;
      stats.stringCount = 0;
      stats.otherCount = 0;
      stats.numberMin = -100;
      stats.numberMax = 100;
      expect(stats.isInteger()).to.equal(true);
    });

    it('should return true for integer + non-numeric fields', () => {
      const stats = new FieldStats();
      stats.totalCount = 4;
      stats.numberCount = 2;
      stats.integerCount = 2;
      stats.stringCount = 2;
      stats.otherCount = 0;
      stats.numberMin = -100;
      stats.numberMax = 100;
      expect(stats.isInteger()).to.equal(true);
    });

    it('should return false for non-integer numeric fields', () => {
      const stats = new FieldStats();
      stats.totalCount = 2;
      stats.numberCount = 2;
      stats.integerCount = 0;
      stats.otherCount = 0;
      stats.numberMin = 0.1;
      stats.numberMax = 0.9;
      expect(stats.isInteger()).to.equal(false);
    });

    it('should return false for non-integer non-numeric fields', () => {
      const stats = new FieldStats();
      stats.totalCount = 2;
      stats.numberCount = 0;
      stats.integerCount = 0;
      stats.otherCount = 0;
      stats.numberMin = null;
      stats.numberMax = null;
      expect(stats.isInteger()).to.equal(false);
    });

  });

});


describe('getStats', () => {

  it('should return an empty object for null or empty input', () => {
    expect(getStats(null)).to.deep.equal({});
    expect(getStats([])).to.deep.equal({});
  });

  it('should return an empty object for array of empty objects', () => {
    expect(getStats([null, null])).to.deep.equal({});
    expect(getStats([{}, {}])).to.deep.equal({});
  });

  it('should describe objects with numeric values', () => {
    let stats: {[field: string]: FieldStats};

    stats = getStats([{red: 255}]);
    expect(stats['red'].totalCount).to.equal(1);
    expect(stats['red'].uniqueCount).to.equal(1);
    expect(stats['red'].numberCount).to.equal(1);
    expect(stats['red'].stringCount).to.equal(0);
    expect(stats['red'].otherCount).to.equal(0);
    expect(stats['red'].numberMin).to.equal(255);
    expect(stats['red'].numberMax).to.equal(255);

    stats = getStats([{red: NaN}]);
    expect(stats['red'].totalCount).to.equal(1);
    expect(stats['red'].uniqueCount).to.equal(1);
    expect(stats['red'].numberCount).to.equal(1);
    expect(stats['red'].stringCount).to.equal(0);
    expect(stats['red'].otherCount).to.equal(0);
    expect(stats['red'].numberMin).to.equal(null);
    expect(stats['red'].numberMax).to.equal(null);

    stats = getStats([{red: 255, green: 255, blue: 0}]);
    expect(stats['red'].totalCount).to.equal(1);
    expect(stats['red'].uniqueCount).to.equal(1);
    expect(stats['red'].numberCount).to.equal(1);
    expect(stats['red'].stringCount).to.equal(0);
    expect(stats['red'].otherCount).to.equal(0);
    expect(stats['red'].numberMin).to.equal(255);
    expect(stats['red'].numberMax).to.equal(255);
    expect(stats['green'].totalCount).to.equal(1);
    expect(stats['green'].uniqueCount).to.equal(1);
    expect(stats['green'].numberCount).to.equal(1);
    expect(stats['green'].stringCount).to.equal(0);
    expect(stats['green'].otherCount).to.equal(0);
    expect(stats['green'].numberMin).to.equal(255);
    expect(stats['green'].numberMax).to.equal(255);
    expect(stats['blue'].totalCount).to.equal(1);
    expect(stats['blue'].uniqueCount).to.equal(1);
    expect(stats['blue'].numberCount).to.equal(1);
    expect(stats['blue'].stringCount).to.equal(0);
    expect(stats['blue'].otherCount).to.equal(0);
    expect(stats['blue'].numberMin).to.equal(0);
    expect(stats['blue'].numberMax).to.equal(0);

    stats = getStats([{red: 255}, {green: 255}, {blue: 0}]);
    expect(stats['red'].totalCount).to.equal(1);
    expect(stats['red'].uniqueCount).to.equal(1);
    expect(stats['red'].numberCount).to.equal(1);
    expect(stats['red'].stringCount).to.equal(0);
    expect(stats['red'].otherCount).to.equal(0);
    expect(stats['red'].numberMin).to.equal(255);
    expect(stats['red'].numberMax).to.equal(255);
    expect(stats['green'].totalCount).to.equal(1);
    expect(stats['green'].uniqueCount).to.equal(1);
    expect(stats['green'].numberCount).to.equal(1);
    expect(stats['green'].stringCount).to.equal(0);
    expect(stats['green'].otherCount).to.equal(0);
    expect(stats['green'].numberMin).to.equal(255);
    expect(stats['green'].numberMax).to.equal(255);
    expect(stats['blue'].totalCount).to.equal(1);
    expect(stats['blue'].uniqueCount).to.equal(1);
    expect(stats['blue'].numberCount).to.equal(1);
    expect(stats['blue'].stringCount).to.equal(0);
    expect(stats['blue'].otherCount).to.equal(0);
    expect(stats['blue'].numberMin).to.equal(0);
    expect(stats['blue'].numberMax).to.equal(0);

    stats = getStats([{red: 0}, {green: 255}, {red: 255}]);
    expect(stats['red'].totalCount).to.equal(2);
    expect(stats['red'].uniqueCount).to.equal(2);
    expect(stats['red'].numberCount).to.equal(2);
    expect(stats['red'].stringCount).to.equal(0);
    expect(stats['red'].otherCount).to.equal(0);
    expect(stats['red'].numberMin).to.equal(0);
    expect(stats['red'].numberMax).to.equal(255);
    expect(stats['green'].totalCount).to.equal(1);
    expect(stats['green'].uniqueCount).to.equal(1);
    expect(stats['green'].numberCount).to.equal(1);
    expect(stats['green'].stringCount).to.equal(0);
    expect(stats['green'].otherCount).to.equal(0);
    expect(stats['green'].numberMin).to.equal(255);
    expect(stats['green'].numberMax).to.equal(255);
  });

  it('should count unique values', () => {
    const stats =
        getStats([{fruit: 'apple'}, {fruit: 'apple'}, {fruit: 'banana'}]);
    expect(stats['fruit'].totalCount).to.equal(3);
    expect(stats['fruit'].uniqueCount).to.equal(2);
    expect(stats['fruit'].numberCount).to.equal(0);
    expect(stats['fruit'].stringCount).to.equal(3);
    expect(stats['fruit'].otherCount).to.equal(0);
  });

  it('should describe objects with string values', () => {
    let stats: {[field: string]: FieldStats};

    stats = getStats([{fruit: 'banana'}]);
    expect(stats['fruit'].totalCount).to.equal(1);
    expect(stats['fruit'].uniqueCount).to.equal(1);
    expect(stats['fruit'].numberCount).to.equal(0);
    expect(stats['fruit'].stringCount).to.equal(1);
    expect(stats['fruit'].otherCount).to.equal(0);
    expect(stats['fruit'].stringMinLength).to.equal(6);
    expect(stats['fruit'].stringMaxLength).to.equal(6);
    expect(stats['fruit'].stringMeanLength).to.equal(6);
    expect(stats['fruit'].stringLengthsCount).to.equal(1);
    expect(stats['fruit'].stringLengthsHash).to.deep.equal({6: 1});

    stats = getStats([{fruit: 'apple'}, {fruit: 'banana'}]);
    expect(stats['fruit'].totalCount).to.equal(2);
    expect(stats['fruit'].uniqueCount).to.equal(2);
    expect(stats['fruit'].numberCount).to.equal(0);
    expect(stats['fruit'].stringCount).to.equal(2);
    expect(stats['fruit'].otherCount).to.equal(0);
    expect(stats['fruit'].stringMinLength).to.equal(5);
    expect(stats['fruit'].stringMaxLength).to.equal(6);
    expect(stats['fruit'].stringMeanLength).to.equal(5.5);
    expect(stats['fruit'].stringLengthsCount).to.equal(2);
    expect(stats['fruit'].stringLengthsHash).to.deep.equal({5: 1, 6: 1});
  });

  it('should describe objects with other values', () => {
    const stats = getStats([{obj: {}, array: [], missing: null}]);
    expect(stats['obj'].totalCount).to.equal(1);
    expect(stats['obj'].uniqueCount).to.equal(1);
    expect(stats['obj'].numberCount).to.equal(0);
    expect(stats['obj'].stringCount).to.equal(0);
    expect(stats['obj'].otherCount).to.equal(1);
    expect(stats['obj'].stringMinLength).to.equal(null);
    expect(stats['obj'].stringMaxLength).to.equal(null);
    expect(stats['obj'].stringMeanLength).to.equal(null);
    expect(stats['array'].totalCount).to.equal(1);
    expect(stats['array'].uniqueCount).to.equal(1);
    expect(stats['array'].numberCount).to.equal(0);
    expect(stats['array'].stringCount).to.equal(0);
    expect(stats['array'].otherCount).to.equal(1);
    expect(stats['array'].stringMinLength).to.equal(null);
    expect(stats['array'].stringMaxLength).to.equal(null);
    expect(stats['array'].stringMeanLength).to.equal(null);
    expect(stats['missing'].totalCount).to.equal(1);
    expect(stats['missing'].uniqueCount).to.equal(1);
    expect(stats['missing'].numberCount).to.equal(0);
    expect(stats['missing'].stringCount).to.equal(0);
    expect(stats['missing'].otherCount).to.equal(1);
    expect(stats['missing'].stringMinLength).to.equal(null);
    expect(stats['missing'].stringMaxLength).to.equal(null);
    expect(stats['missing'].stringMeanLength).to.equal(null);
  });

  it('should describe objects with mixed values', () => {
    const stats = getStats([{mixed: 200}, {mixed: 'apple'}, {mixed: null}]);
    expect(stats['mixed'].totalCount).to.equal(3);
    expect(stats['mixed'].uniqueCount).to.equal(3);
    expect(stats['mixed'].numberCount).to.equal(1);
    expect(stats['mixed'].stringCount).to.equal(1);
    expect(stats['mixed'].otherCount).to.equal(1);
    expect(stats['mixed'].numberMin).to.equal(200);
    expect(stats['mixed'].numberMax).to.equal(200);
    expect(stats['mixed'].stringMinLength).to.equal(5);
    expect(stats['mixed'].stringMaxLength).to.equal(5);
    expect(stats['mixed'].stringMeanLength).to.equal(5);
  });

});
