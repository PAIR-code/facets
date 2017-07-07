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
 * @fileoverview Utility functions for formatting strings.
 */

const DEFAULT_TRUNCATE_REPLACEMENT_STRING = '...';

/**
 * When truncating long string values, these constants determine how many
 * characters we require before truncating.
 */
const MIN_TRUNCATE_PREFIX_LENGTH = 30;
const MIN_TRUNCATE_SUFFIX_LENGTH = 30;
const MIN_TRUNCATE_CONTENT_LENGTH = 5;
const MIN_TRUNCATE_TOTAL_LENGTH = MIN_TRUNCATE_PREFIX_LENGTH +
    MIN_TRUNCATE_CONTENT_LENGTH + MIN_TRUNCATE_SUFFIX_LENGTH;

/**
 * Insert a non-printing whitespace after non-word characters to cause the
 * browser to wrap at these points.
 */
export function breakAfterNonWords(text: string): string {
  return text.replace(/([\W_])/g, '$1\u200B');
};

/**
 * Replace the middle of long strings with '...'.
 */
export function truncateLongString(text: string, replacement?: string): string {
  if (text.length < MIN_TRUNCATE_TOTAL_LENGTH) {
    return text;
  }
  if (replacement === undefined) {
    replacement = DEFAULT_TRUNCATE_REPLACEMENT_STRING;
  }
  return text.substr(0, MIN_TRUNCATE_PREFIX_LENGTH) + '...' +
      text.substr(-MIN_TRUNCATE_SUFFIX_LENGTH);
};
