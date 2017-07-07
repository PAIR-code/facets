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

import {FacetsDiveVis} from './facets-dive-vis';

const {expect} = chai;

describe('FacetsDiveVis', () => {

  it('should appear in the test page', () => {
    const elem = document.querySelector('facets-dive-vis');
    expect(elem instanceof Element).to.be.true;
  });

  it('should update stats when data is set', () => {
    const vis = document.querySelector('facets-dive-vis') as FacetsDiveVis;

    vis.data = [{
      'name': 'apple',
      'answer': 42,
    }];

    expect(vis.stats).to.have.all.keys('name', 'answer');
    expect(vis.stats.name.totalCount).to.equal(1);
    expect(vis.stats.name.numberCount).to.equal(0);
    expect(vis.stats.name.stringCount).to.equal(1);
    expect(vis.stats.answer.totalCount).to.equal(1);
    expect(vis.stats.answer.numberCount).to.equal(1);
    expect(vis.stats.answer.stringCount).to.equal(0);
  });

});
