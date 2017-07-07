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
import * as sf from './string-format';

describe('breakAfterNonWords', () => {

  it('should insert non-visible whitespace after non-word characters', () => {
    const result = sf.breakAfterNonWords('hello world');
    expect(result).toBe('hello \u200Bworld');
  });

});

describe('truncateLongStrings', () => {

  it('should not truncate short strings', () => {
    const input = 'hello world';
    const result = sf.truncateLongString(input);
    expect(result).toBe(input);
  });

  it('should truncate long strings', () => {
    const input = `
      This is an arbitrary, long string, whose internal content should be
      replaced by three dots to indicate that the long string has been
      truncated to a more manageable size for displaying as a label.
    `;
    const result = sf.truncateLongString(input, '...');
    expect(result.length).toBeLessThan(input.length);

    const [prefix, suffix] = result.split('...');
    expect(prefix).toBe(input.substr(0, prefix.length));
    expect(suffix).toBe(input.substr(-suffix.length));
  });

});
