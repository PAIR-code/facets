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
 * @fileoverview Utility methods for sorting and working with sorted arrays.
 */

/**
 * A Key is used to bucket facets. Typically this will be a number or string,
 * but it's possible that the value is null. However, the type signature does
 * not include null here because that complicates all kinds of code where
 * we can assume that it's non null, or if it is the automatic coercion to
 * a string or number is what we want.
 */
export type Key = number | string;  // | null

/**
 * Comparison method for string values laid out horizontally. The use-case is
 * for a set of keys which are primarily strings, but may contain other values.
 * This functions assumes a left-to-right language, putting alphabetically
 * earlier strings to the left using localeCompare().
 *
 * null/undefined keys precede all others, and numbers will be between the
 * null/undefined keys and the string keys.
 *
 * This way, from left-to-right, you get the null/undefined buckets (missing),
 * then the numbers buckets (if any), and then the string buckets in order.
 *
 * Both arguments must be numbers, strings, undefined or null. The behavior of
 * any other value type is undefined.
 */
export function horizontalStringCompare(a: Key, b: Key): number {
  // Between null and undefined, undefined comes first (left-most).
  if ((a === null || a === undefined) && (b === null || b === undefined)) {
    return a === b ? 0 : a === undefined ? -1 : 1;
  }

  // null and undefined come before anything else (to the left).
  if (a === null || a === undefined) {
    return -1;
  }
  if (b === null || b === undefined) {
    return 1;
  }

  // Compare numbers normally, treating NaN's specially (lower to the left).
  if (typeof a === 'number' && typeof b === 'number') {
    if (isNaN(a) && isNaN(b)) {
      return 0;
    }
    if (isNaN(a)) {
      return -1;
    }
    if (isNaN(b)) {
      return 1;
    }
    return a - b;
  }

  // Non-strings come before strings.
  if (typeof a !== 'string') {
    return -1;
  }
  if (typeof b !== 'string') {
    return 1;
  }

  // Compare strings using localeCompare().
  return (<string>a).localeCompare(<string>b);
}

/**
 * Comparison method for primarily string values laid out vertically. The
 * use-case is for a set of keys which are primarily strings, but may contain
 * numeric values. This function assumes the language is read top-to-bottom, and
 * that the array's indexes will proceed upwards, like the Y axis of a typical
 * Cartesian coordinate system.
 *
 * For example, if you compare 'apple' to 'banana', you'll get 1, so that
 * 'apple' appears later in the array and thus higher on the Y axis. The string
 * comparison is done using localeCompare(). This is, in a sense "backwards".
 *
 * null/undefined keys precede all others (bottom most), and anything else will
 * be between the null/undefined keys and the string keys. Sorting here will be
 * "backwards" as well (lower numbers appear higher on the Y axis, later in the
 * array).
 *
 * This way, from top-to-bottom, you get the string buckets in locale order,
 * then the numbered buckets (if any) and lastly you get the null/undefined
 * buckets (missing values).
 *
 * Both arguments must be numbers, strings, undefined or null. The behavior of
 * any other value type is undefined.
 */
export function verticalStringCompare(a: Key, b: Key): number {
  // Between null and undefined, undefined comes first (bottom).
  if ((a === null || a === undefined) && (b === null || b === undefined)) {
    return a === b ? 0 : a === undefined ? -1 : 1;
  }

  // null and undefined come before anything else (bottom).
  if (a === null || a === undefined) {
    return -1;
  }
  if (b === null || b === undefined) {
    return 1;
  }

  // Compare numbers in reversed order (higher to the bottom), with NaNs coming
  // in strictly lower (bottom).
  if (typeof a === 'number' && typeof b === 'number') {
    if (isNaN(a) && isNaN(b)) {
      return 0;
    }
    if (isNaN(a)) {
      return -1;
    }
    if (isNaN(b)) {
      return 1;
    }
    return b - a;
  }

  // Non-strings come before strings (lower).
  if (typeof a !== 'string') {
    return -1;
  }
  if (typeof b !== 'string') {
    return 1;
  }

  // Compare strings using localeCompare(), but reversed (a-z, top to bottom).
  return -(<string>a).localeCompare(<string>b);
}

/**
 * Comparison method for primarily numeric keys laid out either horizontally or
 * vertically. null/undefined keys precede all others, followed by any
 * non-numbers (strings), and then actual numbers.
 *
 * This way, from left-to-right or bottom-to-top, you get the null/undefined
 * buckets (missing), then the string buckets (if any), then the numbers in
 * order, with NaN's preceding all other numbers.
 *
 * Both arguments must be numbers, strings, undefined or null. The behavior of
 * any other value type is undefined.
 */
export function numberCompare(a: Key, b: Key): number {
  // Between null and undefined, undefined comes first (left-most).
  if ((a === null || a === undefined) && (b === null || b === undefined)) {
    return a === b ? 0 : a === undefined ? -1 : 1;
  }

  // null and undefined come before anything else (to the left).
  if (a === null || a === undefined) {
    return -1;
  }
  if (b === null || b === undefined) {
    return 1;
  }

  // Compare strings using localeComapre().
  if (typeof a === 'string' && typeof b === 'string') {
    return a.localeCompare(b);
  }

  // Non-numbers come before numbers.
  if (typeof a !== 'number') {
    return -1;
  }
  if (typeof b !== 'number') {
    return 1;
  }

  // Compare numbers normally, treating NaN's specially (lower to the left).
  const na = <number>a;
  const nb = <number>b;
  if (isNaN(na) && isNaN(nb)) {
    return 0;
  }
  if (isNaN(na)) {
    return -1;
  }
  if (isNaN(nb)) {
    return 1;
  }
  return na - nb;
}
