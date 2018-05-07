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
import FeatureNameStatistics from 'goog:proto.featureStatistics.FeatureNameStatistics';
import NumericStatistics from 'goog:proto.featureStatistics.NumericStatistics';
import StringStatistics from 'goog:proto.featureStatistics.StringStatistics';
import CustomStatistic from 'goog:proto.featureStatistics.CustomStatistic';
import Histogram from 'goog:proto.featureStatistics.Histogram';
import RankHistogram from 'goog:proto.featureStatistics.RankHistogram';
import WeightedNumericStatistics from 'goog:proto.featureStatistics.WeightedNumericStatistics';
import WeightedStringStatistics from 'goog:proto.featureStatistics.WeightedStringStatistics';

export function makeHistogram(vals: number[][],
                              type?: Histogram.HistogramType|null): Histogram {
  const hist = new Histogram();
  const buckets = hist.getBucketsList();
  vals.forEach(bucketVals => {
    const b = new Histogram.Bucket();
    b.setLowValue(bucketVals[0]);
    b.setHighValue(bucketVals[1]);
    b.setSampleCount(bucketVals[2]);
    buckets.push(b);
  });
  hist.setType(type ? type : Histogram.HistogramType.STANDARD);
  return hist;
}

export function makeCustomStatistic(name: string, value: {}): CustomStatistic {
  const s = new CustomStatistic();
  s.setName(name);
  if (typeof value === 'string') {
    s.setStr(value as string);
  } else if (typeof value === 'number') {
    s.setNum(value as number);
  } else if (value instanceof Histogram) {
    s.setHistogram(value as Histogram);
  } else {
    s.setRankHistogram(value as RankHistogram);
  }
  return s;
}

export function makeRankBucket(label: string,
                        lowRank: number,
                        highRank: number,
                        count: number): RankHistogram.Bucket {
  const b = new RankHistogram.Bucket();
  b.setLabel(label);
  b.setLowRank(lowRank);
  b.setHighRank(highRank);
  b.setSampleCount(count);
  return b;
}

export function makeRankHistogram(buckets: RankHistogram.Bucket[]):
                                  RankHistogram {
  const h = new RankHistogram();
  h.setBucketsList(buckets);
  return h;
}

export function makeFreqValuePair(value: string,
                           freq: number): StringStatistics.FreqAndValue {
  const fv = new StringStatistics.FreqAndValue();
  fv.setValue(value);
  fv.setFrequency(freq);
  return fv;
}

export function addWeightedStatsToNumFeature(
    feature: FeatureNameStatistics,
    mean: number,
    stdDev: number,
    median: number,
    histograms: Histogram[]) : FeatureNameStatistics {
  const numStats = feature.getNumStats();
  if (!numStats) {
    throw new Error('feature must be numeric');
  }
  const ns = new WeightedNumericStatistics();
  ns.setMean(mean);
  ns.setStdDev(stdDev);
  ns.setMedian(median);
  ns.setHistogramsList(histograms);
  numStats.setWeightedNumericStats(ns);
  return feature;
}

export function addWeightedStatsToStringFeature(
    feature: FeatureNameStatistics,
    topStrings: StringStatistics.FreqAndValue[],
    rankHistogram: RankHistogram) : FeatureNameStatistics {
  const stringStats = feature.getStringStats();
  if (!stringStats) {
    throw new Error('feature must be string type');
  }
  const ss = new WeightedStringStatistics();
  ss.setTopValuesList(topStrings);
  ss.setRankHistogram(rankHistogram);
  stringStats.setWeightedStringStats(ss);
  return feature;
}
