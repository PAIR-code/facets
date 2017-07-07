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

import {FacetsDive} from './facets-dive';

const {expect} = chai;

describe('FacetsDive', () => {

  it('should display data when set', () => {
    const ss = document.querySelector('facets-dive') as FacetsDive;
    expect(ss instanceof Element).to.be.true;

    ss.data = [
      {'index': 1, 'name': 'apple', 'category': 'fruit', 'count': 5},
      {'index': 2, 'name': 'banana', 'category': 'fruit', 'count': 7},
      {'index': 3, 'name': 'cucumber', 'category': 'veggie', 'count': 1},
      {'index': 4, 'name': 'danish', 'category': 'breakfast', 'count': 2},
      {'index': 5, 'name': 'eggs', 'category': 'breakfast', 'count': 12},
      {'index': 6, 'name': 'fries', 'category': 'side', 'count': 30},
      {'index': 7, 'name': 'gyro', 'category': 'sandwich', 'count': 8},
      {'index': 8, 'name': 'hamburger', 'category': 'sandwich', 'count': 9},
    ];

    // Visually inpect the test page to see everything is working.
  });

});
