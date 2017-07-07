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
 * @fileoverview The WordTree data structure and related logic is used to
 * support Dive's bag-of-words feature.
 *
 * Consider an array of multi-word string values (like "the end" and
 * "hello world"). The goal of the WordTree is to treat each word of each string
 * individually, and split the strings according to their common words.
 *
 * For example, say half the strings contain the word "the", and no word
 * appeared more frequently than that. Then the word "the" would be the top word
 * for the whole set of words, and would be used to split out all of those words
 * into a separate node.
 *
 *                         +---+
 *                         | * |--- others
 *                         +---+
 *                         /
 *                       +---+
 *                       |the|
 *                       +---+
 *
 * The number of strings that a node has is its mass. The goal of the algorithm
 * is to break up that mass into a tree structure. Currently it dose this by
 * finding the most common word in a given node and splitting those out to a
 * child node.
 *
 * A better approach would be to choose the word which appears in just about
 * half of the strings in the node.
 *
 * TODO(jimbo): Split nodes by the median word, rather than the top word.
 */

/**
 * Maximum level to achieve when building out the word tree.
 */
const MAX_WORD_TREE_LEVEL = 100;

/**
 * When splitting a string into words, this regex is used. It finds sequences of
 * word characters, dashes and apostrophes surrounded by word boundaries.
 *
 * Currently this regex fails to work for non-latin characters, like the 'é' in
 * Pokémon.
 *
 * TODO(jimbo): Improve word-splitting algorithm to account for non-latin chars.
 */
const WORD_MATCH_REGEX = /\b[-'\w]+\b/g;

/**
 * A word frequency map keeps track of how many times a string has ocurred.
 */
export interface WordFrequencyCounts { [word: string]: number; }

/**
 * A ValueHash maps string hash values to the true value and other info about
 * that value, such as the number of times it occurred (count) and the words
 * contained within the value.
 */
export interface ValueHash {
  /**
   * The typeAndValue string is a concatenation of the typeof the value and its
   * string value (see getHashKey). This should be sufficient to uniquely
   * identify it, as long as the value is primitive, like a string, number, or
   * something falsey (undefined/null).
   */
  [typeAndValue: string]: {
    /**
     * The actual value. Usually this will be a string or number, may also be
     * undefined or null.
     */
    value: any;

    /**
     * The number of times this value occurs. That is, the number of items that
     * have this value for this field.
     */
    count: number;

    /**
     * Hash mapping each word and the number of times it occurs in the value.
     */
    words?: WordFrequencyCounts;
  };
}

/**
 * Given a value, return the key it can be found by in a ValueHash.
 */
export function getHashKey(value: any): string {
  return `${typeof value}\u001F${value}`;
}

/**
 * A WordTreeNode contains values specific to this node and links to the parent
 * and children nodes (if any).
 */
export interface WordTreeNode {
  /**
   * The parent node to this WordTreeNode. For the root, this will be null.
   */
  parent: WordTreeNode|null;

  /**
   * List of words common to all children and values. May be empty.
   */
  commonWords: string[];

  /**
   * Lowest value for which this node should be treated as its own bucket
   * when faceting.
   */
  level: number;

  /**
   * Ordering value for sorting nodes when faceting.
   */
  order: number;

  /**
   * The total number of items with values that roll up under this node.
   */
  totalCount: number;

  /**
   * ValueHash for string values that belong to this node specifically, and
   * can't be further divided into its child nodes.
   */
  valueHash: ValueHash;

  /**
   * The number of items represented in the valueHash, not recursively
   * under the children. This is the sum of all counts in the valueHash.
   */
  valueCount: number;

  /**
   * The number of items represented by this node, but which do not appear in
   * the valueHash. For the root node, this value will cover non-strings.
   */
  nonValueCount: number;

  /**
   * Child nodes which each contain their own value hashes.
   */
  children: WordTreeNode[];
}

/**
 * A tree of WordTreeNodes.
 */
export interface WordTree {
  /**
   * The root of the WordTree.
   */
  root: WordTreeNode;

  /**
   * Mapping between the typeAndValue hash and the WordTreeNode which
   * contains it.
   */
  nodeHash: {[typeAndValue: string]: WordTreeNode};

  /**
   * The highest level of any node in this tree.
   */
  highestLevel: number;

  /**
   * Mapping between the level number and the node with that exact level.
   */
  levelHash: {[level: number]: WordTreeNode};
}

/**
 * Given a string, split it into words.
 */
export function splitIntoWords(str: string): string[] {
  return str.toLowerCase().match(WORD_MATCH_REGEX) || [];
}

/**
 * Given a node, pull out any previously unrecognized common words, then
 * return the top word for division.
 *
 * If the node cannot be meaningfully split, the method returns null.
 */
export function getTopWord(node: WordTreeNode): string|null {
  // Short-circuit if this node has one or fewer undivided values.
  if (node.valueCount < 2) {
    return null;
  }

  // Convenience method for adding a list of words to a set (map).
  const addWordsToMap =
      (wordList: string[], wordMap: {[word: string]: boolean}) => {
        for (let i = 0; i < wordList.length; i++) {
          wordMap[wordList[i]] = true;
        }
      };

  // We're going to be looking for a brand new word to split on, so first
  // we collect a map of ineligible words since we don't want to waste time
  // considering them. These are the union of all words accounted for at
  // this node, up through its ancestors, and its first-order children.
  const ineligibleWords: {[word: string]: boolean} = {};
  let ancestor: WordTreeNode|null = node;
  while (ancestor) {
    addWordsToMap(ancestor.commonWords, ineligibleWords);
    ancestor = ancestor.parent;
  }
  for (let i = 0; i < node.children.length; i++) {
    addWordsToMap(node.children[i].commonWords, ineligibleWords);
  }

  // Count all words that appear in this node's values, ignoring those that
  // are already ineligible, and learning common words as they come up.
  const wordCounts: WordFrequencyCounts = {};
  for (const hashKey in node.valueHash) {
    const {value, count, words} = node.valueHash[hashKey];
    for (const word in words!) {
      if (word in ineligibleWords) {
        continue;
      }
      wordCounts[word] = (wordCounts[word] || 0) + count;
      if (wordCounts[word] === node.totalCount) {
        node.commonWords.push(word);
        ineligibleWords[word] = true;
        delete wordCounts[word];
      }
    }
  }

  // Determine the top word.
  let topWord: string|null = null;
  let topWordCount = 0;
  for (const word in wordCounts) {
    if (wordCounts[word] > topWordCount) {
      topWord = word;
      topWordCount = wordCounts[word];
    }
  }
  return topWord;
}

/**
 * Given a value hash, generate a word tree.
 */
export function generateWordTree(valueHash: ValueHash) {
  const root: WordTreeNode = {
    parent: null,
    commonWords: [],
    level: 1,
    order: 0,
    totalCount: 0,
    valueHash: {},
    valueCount: 0,
    nonValueCount: 0,
    children: [],
  };

  const tree: WordTree = {
    root,
    nodeHash: {},
    highestLevel: 1,
    levelHash: {
      1: root,
    }
  };

  // Seed root node from value hash.
  for (const hashKey in valueHash) {
    if (!valueHash.hasOwnProperty(hashKey)) {
      continue;
    }
    const {value, count, words} = valueHash[hashKey];
    if (typeof value === 'string') {
      root.valueHash[hashKey] = {value, count, words};
      root.valueCount += count;
    } else {
      root.nonValueCount += count;
    }
    root.totalCount += count;
    tree.nodeHash[hashKey] = root;
  }

  let highestLevel = root.level;

  // If there are any non-string values, then we'll create a special node
  // to house them.
  if (root.nonValueCount) {
    highestLevel++;
    const child: WordTreeNode = {
      parent: root,
      commonWords: [],
      level: highestLevel,
      order: 0,
      totalCount: root.nonValueCount,
      valueHash: {},
      valueCount: 0,
      nonValueCount: root.nonValueCount,
      children: [],
    };
    root.nonValueCount = 0;
    root.children.push(child);
    tree.highestLevel = highestLevel;
    tree.levelHash[highestLevel] = child;
    for (const hashKey in tree.nodeHash) {
      if (hashKey in root.valueHash) {
        continue;
      }
      tree.nodeHash[hashKey] = child;
    }
  }

  const divisionCandidates: WordTreeNode[] = [root];

  // Convenience method for determining the visible mass of a given candidate.
  // That is, at the current level, which candidate has the most mass.
  const undividedMass = (node: WordTreeNode): number => {
    return node.valueCount + node.nonValueCount;
  };

  while (highestLevel < MAX_WORD_TREE_LEVEL && divisionCandidates.length) {
    // Pick the division candidate with the most undivided values.
    let candidateIndex = 0;
    let maxMass = undividedMass(divisionCandidates[candidateIndex]);
    for (let i = 1; i < divisionCandidates.length; i++) {
      const currentMass = undividedMass(divisionCandidates[i]);
      if (currentMass > maxMass) {
        candidateIndex = i;
        maxMass = currentMass;
      }
    }
    const candidate = divisionCandidates[candidateIndex];

    // Get the top word for this candidate, while taking note of any common
    // words. If no top word was found, then this candidate cannot be
    // meaningfully further subdivided. Remove it and look for another.
    const topWord = getTopWord(candidate);
    if (!topWord) {
      divisionCandidates.splice(candidateIndex, 1);
      continue;
    }

    // Now create a new child node out of the top word.
    highestLevel++;
    const child: WordTreeNode = {
      parent: candidate,
      commonWords: [topWord],
      level: highestLevel,
      order: 0,
      totalCount: 0,
      valueHash: {},
      valueCount: 0,
      nonValueCount: 0,
      children: [],
    };
    candidate.children.push(child);
    divisionCandidates.push(child);
    for (const hashKey in candidate.valueHash) {
      if (!candidate.valueHash.hasOwnProperty(hashKey)) {
        continue;
      }
      const {value, count, words} = candidate.valueHash[hashKey];
      if (!words || !(topWord in words)) {
        continue;
      }
      child.valueHash[hashKey] = {value, count, words};
      child.valueCount += count;
      child.totalCount += count;
      delete candidate.valueHash[hashKey];
      candidate.valueCount -= count;
      tree.nodeHash[hashKey] = child;
      tree.highestLevel = highestLevel;
      tree.levelHash[highestLevel] = child;
    }
  }

  // Set all the nodes' order values via depth first search.
  let order = 0;
  const updateNodeOrder = (node: WordTreeNode) => {
    node.order = ++order;
    for (let i = 0; i < node.children.length; i++) {
      updateNodeOrder(node.children[i]);
    }
  };
  updateNodeOrder(tree.root);

  return tree;
}
