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
import * as wordtree from '../wordtree';

const {expect} = chai;

// Convenience method for generating a ValueHash from an array of values.
function generateValueHash(values: any[]) {
  const valueHash: wordtree.ValueHash = {};
  for (let i = 0; i < values.length; i++) {
    const value = values[i];
    const hashKey = wordtree.getHashKey(value);
    if (!(hashKey in valueHash)) {
      valueHash[hashKey] = {value, count: 0};
      if (typeof value === 'string') {
        const wordFrequencyCounts: wordtree.WordFrequencyCounts =
            valueHash[hashKey].words = {};
        const wordList = wordtree.splitIntoWords(value);
        for (let j = 0; j < wordList.length; j++) {
          const word = wordList[j];
          wordFrequencyCounts[word] = (wordFrequencyCounts[word] || 0) + 1;
        }
      }
    }
    valueHash[hashKey].count += 1;
  }
  return valueHash;
}

describe('generateValueHash', () => {

  // Testing the test fixture.
  it('should generate a single value hash', () => {

    const valueHash = generateValueHash(['hello world']);

    expect(Object.keys(valueHash).length).to.equal(1);

    const {value, count, words} = valueHash[Object.keys(valueHash)[0]];

    expect(value).to.equal('hello world');
    expect(count).to.equal(1);

    expect(Object.keys(words!).length).to.equal(2);
    expect(words!['hello']).to.equal(1);
    expect(words!['world']).to.equal(1);

  });

});

describe('generateWordTree', () => {

  it('should generate a WordTree', () => {

    const valueHash = generateValueHash([
      'all',
      'all',
      'all',
      'all',
      'all',
      'all',
      'all half',
      'all half',
      'all half',
      'all half quarter',
      'all half quarter sixth',
      'all half quarter sixth twelfth',
    ]);

    const {root, nodeHash, highestLevel, levelHash} =
        wordtree.generateWordTree(valueHash);

    expect(Object.keys(nodeHash).length).to.equal(5);

    expect(highestLevel).to.equal(5);

    expect(levelHash[1]).to.equal(root);

    expect(levelHash[1].commonWords).to.deep.equal(['all']);
    expect(levelHash[2].commonWords).to.deep.equal(['half']);
    expect(levelHash[3].commonWords).to.deep.equal(['quarter']);
    expect(levelHash[4].commonWords).to.deep.equal(['sixth']);
    expect(levelHash[5].commonWords).to.deep.equal(['twelfth']);

  });

});
