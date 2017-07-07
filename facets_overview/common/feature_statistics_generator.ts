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
import CommonStatistics from 'goog:proto.featureStatistics.CommonStatistics';
import DatasetFeatureStatistics from 'goog:proto.featureStatistics.DatasetFeatureStatistics';
import DatasetFeatureStatisticsList from 'goog:proto.featureStatistics.DatasetFeatureStatisticsList';
import FeatureNameStatistics from 'goog:proto.featureStatistics.FeatureNameStatistics';
import Histogram from 'goog:proto.featureStatistics.Histogram';
import NumericStatistics from 'goog:proto.featureStatistics.NumericStatistics';
import RankHistogram from 'goog:proto.featureStatistics.RankHistogram';
import StringStatistics from 'goog:proto.featureStatistics.StringStatistics';

/**
 * Each data point is a map of feature names to feature values, where each
 * feature value is a number, string, or array of numbers or strings.
 */
export type DataValue = number|string;
export type DataPoint = {[feature: string]: DataValue|DataValue[]};

class FeatureCollector {
  vals: DataValue[] = [];
  counts: number[] = [];
  missing: number;
  type: FeatureNameStatistics.Type;
}

/**
 * Datapoints and name for a dataset, used for generating a
 * complete DatasetFeatureStatisticsList proto from a number
 * of datasets.
 */
export interface DataForStatsProto {
  data: DataPoint[];
  name: string
}

/**
 * Creates DatasetFeatureStatisticsList from an array of datasets.
 * @param datasets An array of DataForStatsProto, one for each
 *     dataset.
 * @returns The resulting DatasetFeatureStatisticsList proto.
 */
export function getStatsProto(datasets: DataForStatsProto[]):
    DatasetFeatureStatisticsList {
  const list = new DatasetFeatureStatisticsList();
  datasets.forEach(dataset => {
    const stats = generateStats(dataset.data);
    stats.setName(dataset.name);
    list.getDatasetsList().push(stats);
  });
  return list;
}

/**
 * Creates DatasetFeatureStatistics proto from a dataset.
 * @param items An array of DataPoints, each array entry describing an example
 *     from the dataset. The DataPoint for an example contains numeric or
 *     string values for each feature in the map.
 * @returns The resulting DatasetFeatureStatistics proto.
 */
export function generateStats(items?: DataPoint[]):
    DatasetFeatureStatistics {
  // TODO(jwexler): Add ability to generate weighted feature stats
  // if there is a specified weight feature in the dataset.
  const features: {[f: string]: FeatureCollector} = {};

  if (items == null) {
    return new DatasetFeatureStatistics();
  }

  items.forEach((item: DataPoint, i: number) => {
    if (item == null) {
      return;
    }
    const keys = Object.keys(item);
    const featuresSeen: {[f: string]: boolean} = {};
    for (let j = 0; j < keys.length; j++) {
      const key = keys[j];
      const value = item[key];
      featuresSeen[key] = true;
      if (!(key in features)) {
        // For new features not seen in previous examples, add the feature
        // collector and update the missing count to include the previous
        // examples that didn't include the feature.
        features[key] = new FeatureCollector();
        features[key].missing = i;
        features[key].counts = [];
      }
      if (typeof value === 'number' || typeof value === 'string') {
        features[key].vals.push(value);
        features[key].counts.push(1);
      } else if (value instanceof Array) {
        features[key].counts.push(value.length);
        features[key].vals.push(...value);
      }
    }
    const allFeatures = Object.keys(features);
    allFeatures.forEach(f => {
      if (!(f in featuresSeen)) {
        features[f].missing += 1;
      }
    });
  });

  const feats = Object.keys(features);
  feats.forEach(feat => {
    let numString = 0;
    let numNum = 0;
    let hasFloats = false;
    features[feat].vals.forEach(val => {
      if (typeof val === 'string') {
        numString += 1;
      } else {
        numNum += 1;
        hasFloats = hasFloats || !isInteger(val);
      }
    });
    if (numNum > numString) {
      features[feat].type = hasFloats ? FeatureNameStatistics.Type.FLOAT :
                                        FeatureNameStatistics.Type.INT;
    } else {
      features[feat].type = FeatureNameStatistics.Type.STRING;
    }
  });

  return statsFromFeatures(features, items.length);
}

function isInteger(n: number) {
  return n === +n && n === (n | 0);
}

function statsFromFeatures(
    features: {[f: string]: FeatureCollector},
    numExamples: number): DatasetFeatureStatistics {
  const stats = new DatasetFeatureStatistics();
  stats.setNumExamples(numExamples);

  for (const feat in features) {
    if (!features.hasOwnProperty(feat)) {
      continue;
    }
    const feature = new FeatureNameStatistics();
    stats.getFeaturesList().push(feature);

    const collection = features[feat];
    feature.setName(feat);
    feature.setType(collection.type);

    if (collection.type === FeatureNameStatistics.Type.FLOAT ||
        collection.type === FeatureNameStatistics.Type.INT) {
      feature.setNumStats(createNumStats(collection.vals, collection.counts,
                                         numExamples, collection.missing));
    } else if (collection.type === FeatureNameStatistics.Type.STRING) {
      feature.setStringStats(
          createStringStats(collection.vals, collection.counts,
                            numExamples, collection.missing));
    }
  }
  return stats;
}

function createNumStats(
    vals: DataValue[], counts: number[], numExamples: number,
    numMissing: number): NumericStatistics {
  const stats = new NumericStatistics();
  stats.setCommonStats(createCommonStats(counts, numExamples, numMissing));

  let sum = 0, sumSquares = 0, numZeros = 0;
  const numVals: number[] =
      vals.filter(rawVal => typeof rawVal === 'number' && !isNaN(rawVal))
          .map(rawVal => +rawVal)
          .sort((a, b) => a - b);
  if (numVals.length > 0) {
    stats.setMin(numVals[0]);
    stats.setMax(numVals[numVals.length - 1]);
    const midPoint = Math.floor(numVals.length / 2);
    stats.setMedian(
      numVals.length % 2 !== 0 ?
        numVals[midPoint] :
        (numVals[midPoint] + numVals[midPoint - 1]) / 2);
  }
  numVals.forEach(val => {
    if (val === 0) {
      numZeros += 1;
    }
    sum += val;
    sumSquares += val * val;
  });
  if (numVals.length > 1) {
    const diff = sumSquares - (sum * sum / numVals.length);
    const variance = diff / (numVals.length - 1);
    stats.setStdDev(Math.sqrt(variance));
  }
  stats.setMean(sum / vals.length);
  stats.setNumZeros(numZeros);

  const numValsNoInf: number[] =
      numVals.filter(val => val !== Infinity && val !== -Infinity);
  const numInf = numVals.filter(val => val === Infinity).length;
  const numNegInf = numVals.filter(val => val === -Infinity).length;
  const min = numValsNoInf[0];
  const max = numValsNoInf[numValsNoInf.length - 1];
  const binCount = 10;
  const thresholds = d3.range(min, max, (max - min) / binCount);
  const histGenerator = d3.histogram().thresholds(thresholds);
  const bins = histGenerator(numValsNoInf);
  let h = stats.addHistograms();
  h.setType(Histogram.HistogramType.STANDARD);
  bins.forEach((bin: {length: number, x0: number, x1: number}) => {
    const b = h.addBuckets();
    b.setSampleCount(bin.length);
    b.setLowValue(bin.x0);
    b.setHighValue(bin.x1);
  });
  const buckets = h.getBucketsList();
  if (numVals.length && numVals[0] === -Infinity) {
    buckets[0].setLowValue(-Infinity);
    buckets[0].setSampleCount(buckets[0].getSampleCount() + numNegInf);
  }
  if (numVals.length && numVals[numVals.length - 1] === Infinity) {
    buckets[buckets.length - 1].setHighValue(Infinity);
    buckets[buckets.length - 1].setSampleCount(
      buckets[buckets.length - 1].getSampleCount() + numInf);
  }

  h = stats.addHistograms();
  getQuantileHistogram(h, numValsNoInf);
  return stats;
}

function getQuantileHistogram(hist: Histogram, numVals: number[]) {
  const quantilesToGet: number[] = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
  const numQuantileBuckets = quantilesToGet.length - 1;
  const quantiles: number[] =
      quantilesToGet.map((percentile: number) => quantile(numVals, percentile));
  hist.setType(Histogram.HistogramType.QUANTILES);
  const bucketsSampleCount = numVals.length / numQuantileBuckets;
  for (let qBucketIndex = 0; qBucketIndex < numQuantileBuckets;
       qBucketIndex++) {
    const b = hist.addBuckets();
    b.setSampleCount(bucketsSampleCount);
    b.setLowValue(quantiles[qBucketIndex]);
    b.setHighValue(quantiles[qBucketIndex + 1]);
  }
}

function quantile(nums: number[], percentile:  number): number {
  if (nums.length === 0) {
     return NaN;
  }
  const index = percentile / 100. * (nums.length - 1);
  const i = Math.floor(index);
  if (i === index) {
    return nums[index];
  } else {
    const fraction = index - i;
    return nums[i] + (nums[i+1] - nums[i]) * fraction;
  }
}

function createStringStats(
    vals: DataValue[], counts: number[], numExamples: number,
    numMissing: number): StringStatistics {
  const stats = new StringStatistics();
  stats.setCommonStats(createCommonStats(counts, numExamples, numMissing));

  let sumLength = 0;
  const strCounts: {[val: string]: number} = {};
  vals.forEach(rawVal => {
    const val: string = String(rawVal);
    strCounts[val] = (strCounts[val] || 0) + 1;
    sumLength += val.length;
  });
  if (vals.length > 0) {
    stats.setAvgLength(sumLength / vals.length);
  }

  let strArray: Array<{str: string, count: number}> = [];
  for (const str in strCounts) {
    if (strCounts.hasOwnProperty(str)) {
      strArray.push({str, count: strCounts[str]});
    }
  }
  stats.setUnique(strArray.length);
  strArray = strArray.sort((a, b) => b.count - a.count);

  const hist = new RankHistogram();
  stats.setRankHistogram(hist);
  if (strArray.length) {
    const f = stats.addTopValues();
    f.setValue(strArray[0].str);
    f.setFrequency(strArray[0].count);
  }
  strArray.forEach((entry, i) => {
    const bucket = hist.addBuckets();
    bucket.setSampleCount(entry.count);
    bucket.setLowRank(i);
    bucket.setHighRank(i);
    bucket.setLabel(entry.str);
  });
  return stats;
}

function createCommonStats(counts: number[], numExamples: number,
                           numMissing: number): CommonStatistics {
  const common = new CommonStatistics();
  let min = Infinity, max = 0, total = 0;
  counts.forEach(count => {
    if (count < min) {
      min = count;
    }
    if (count > max) {
      max = count;
    }
    total += count;
  });
  common.setNumNonMissing(numExamples - numMissing);
  common.setNumMissing(numMissing);
  common.setMinNumValues(min);
  common.setMaxNumValues(max);
  if (counts.length > 0) {
    common.setAvgNumValues(total / counts.length);
  }
  const hist = new Histogram();
  common.setNumValuesHistogram(hist);
  getQuantileHistogram(hist, counts);
  return common;
}
