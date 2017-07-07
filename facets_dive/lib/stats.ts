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
 * @fileoverview Tools for computing stats about underlying data.
 */
import * as wordtree from './wordtree';

/**
 * Collect all of the keys from an array of items where each item is a map.
 *
 * @param items The array of items to inspect.
 * @return An array of all keys that appear in any item (may be empty).
 */
export function getAllKeys(items: any[]|null): string[] {
  if (!items || !items.length) {
    return [];
  }
  const map: {[key: string]: boolean} = {};
  for (let i = 0; i < items.length; i++) {
    if (items[i]) {
      const keys = Object.keys(items[i]);
      for (let j = 0; j < keys.length; j++) {
        map[keys[j]] = true;
      }
    }
  }
  return Object.keys(map);
}

/**
 * Utility function for testing whether a number is an integer. This is a very
 * strict check. String values and other things that could be coerced to the
 * primitive number type won't count.
 */
export const isInteger = (n: number) => typeof n === 'number' && (n >> 0) === n;

/**
 * Statistics about a field present in one or more items.
 */
export class FieldStats {
  // TYPE STATS.

  /**
   * The total number of items for which this field is present.
   */
  totalCount = 0;

  /**
   * The number of unique values present for this field.
   */
  uniqueCount = 0;

  /**
   * Hash of objects that maps a given typed input value to its value, count of
   * items that have that value, and a hash showing word counts (if string).
   *
   * TODO(jimbo): Add tests for this.
   */
  valueHash: wordtree.ValueHash = {};

  /**
   * The number of items having this field for which the value is a number.
   */
  numberCount = 0;

  /**
   * The number of items having this field for which the value is an integer.
   */
  integerCount = 0;

  /**
   * The number of items having this field for which the value is a string.
   */
  stringCount = 0;

  /**
   * The number of items with this field, but the value is none of the above.
   */
  otherCount = 0;

  // NUMERIC STATS.

  /**
   * Minimum value among items which have a numeric value for this field.
   * If none of the items have numeric values, this will be null.
   */
  numberMin: number|null = null;

  /**
   * Maximum value among items which have a numeric value for this field.
   * If none of the items have numeric values, this will be null.
   */
  numberMax: number|null = null;

  // STRING STATS.

  /**
   * Length of shortest string.
   * If none of the items have string values, this will be null.
   */
  stringMinLength: number|null = null;

  /**
   * Length of longest string.
   * If none of the items have string values, this will be null.
   */
  stringMaxLength: number|null = null;

  /**
   * Mean string length.
   * If none of the items have string values, this will be null.
   */
  stringMeanLength: number|null = null;

  /**
   * How many different lengths of string were encountered.
   * If none of the items have string values, this will be null.
   */
  stringLengthsCount: number|null = null;

  /**
   * For each length of string that appears in any value, record how many times
   * a string of that length has appeared.
   */
  stringLengthsHash: {[length: number]: number} = {};

  /**
   * The total number of string values that contain more than one word.
   */
  multiwordCount = 0;

  /**
   * The total number of words in all multiword values.
   */
  totalWordCount = 0;

  /**
   * For each word that appears in any string, note how many values contain
   * that word.
   */
  wordCounts: wordtree.WordFrequencyCounts = {};

  /**
   * Number of unique words that appear in any value. This is the count of keys
   * in wordCounts.
   */
  uniqueWordCount = 0;

  /**
   * WordTree that results from treating string values in this field as a bag
   * of words. When faceting, crawl up the chain of parents to find the
   * nearest ancestor whose level is less than or equal to the desired bucket
   * granularity.
   *
   * TODO(jimbo): Add tests.
   */
  wordTree: wordtree.WordTree|null = null;

  /**
   * Utility method for determining whether a field can be treated as numeric
   * for faceting purposes.
   */
  isNumeric(): boolean {
    return (this.numberCount > 0) && (this.numberMin !== null) &&
        (this.numberMax !== null) && (this.numberMax > this.numberMin);
  }

  /**
   * Utility method for determining whether a field that contains any numbers
   * has only integers. If the field has no numeric values, then this method
   * returns false.
   */
  isInteger(): boolean {
    return this.numberCount > 0 && this.integerCount === this.numberCount;
  }

  /**
   * Add a value.
   */
  addValue(value: number|string) {
    this.totalCount++;

    const hashKey = wordtree.getHashKey(value);

    if (!(hashKey in this.valueHash)) {
      this.valueHash[hashKey] = {value, count: 0};
      this.uniqueCount++;
    }
    this.valueHash[hashKey].count++;

    switch (typeof value) {
      case 'number':
        this.incorporateNumberValue(value as number);
        break;
      case 'string':
        this.incorporateStringValue(hashKey, value as string);
        break;
      default:
        this.otherCount++;
    }
  }

  /**
   * Update stats to include this numeric value.
   */
  private incorporateNumberValue(value: number) {
    this.numberCount++;
    if (isInteger(value)) {
      this.integerCount++;
    }
    if (!isNaN(value)) {
      this.numberMin =
          this.numberMin === null ? value : Math.min(this.numberMin, value);
      this.numberMax =
          this.numberMax === null ? value : Math.max(this.numberMax, value);
    }
  }

  /**
   * Update stats to include this string value.
   */
  private incorporateStringValue(hashKey: string, value: string) {
    this.stringCount++;

    // Increment string length counts.
    const stringLength = value.length;
    if (!(stringLength in this.stringLengthsHash)) {
      this.stringLengthsCount = (this.stringLengthsCount || 0) + 1;
    }
    this.stringLengthsHash[stringLength] =
        (this.stringLengthsHash[stringLength] || 0) + 1;
    this.stringMinLength = this.stringMinLength === null ?
        stringLength :
        Math.min(this.stringMinLength, stringLength);
    this.stringMaxLength = this.stringMaxLength === null ?
        stringLength :
        Math.max(this.stringMaxLength, stringLength);
    this.stringMeanLength = (this.stringMeanLength || 0) *
            (this.stringCount - 1) / this.stringCount +
        stringLength / this.stringCount;

    // Fill in word counts on value hash if not previously seen.
    if (!this.valueHash[hashKey].words) {
      const wordList = wordtree.splitIntoWords(value.toLowerCase());
      if (wordList.length > 1) {
        this.multiwordCount++;
        this.totalWordCount += wordList.length;
      }
      const words: wordtree.WordFrequencyCounts =
          this.valueHash[hashKey].words = {};
      for (let i = 0; i < wordList.length; i++) {
        const word = wordList[i];
        words[word] = (words[word] || 0) + 1;
        if (!(word in this.wordCounts)) {
          this.wordCounts[word] = 0;
          this.uniqueWordCount++;
        }
      }
    }

    // Increment all words.
    const words = this.valueHash[hashKey].words;
    for (const word in words!) {
      this.wordCounts[word] = (this.wordCounts[word] || 0) + 1;
    }
  }
}

/**
 * Compute statistics for all fields.
 */
export function getStats(items: any[]|null): {[field: string]: FieldStats} {
  if (!items || !items.length) {
    return {};
  }
  const stats: {[field: string]: FieldStats} = {};
  for (let i = 0; i < items.length; i++) {
    const item: {[key: string]: any} = items[i];
    if (item == null) {
      continue;
    }
    const keys = Object.keys(item);
    for (let j = 0; j < keys.length; j++) {
      const key = keys[j];
      const value = item[key];
      if (!(key in stats)) {
        stats[key] = new FieldStats();
      }
      stats[key].addValue(value);
    }
  }
  for (const field in stats) {
    const fieldStats = stats[field];
    if (fieldStats.multiwordCount) {
      fieldStats.wordTree = wordtree.generateWordTree(fieldStats.valueHash);
    }
  }
  return stats;
}
