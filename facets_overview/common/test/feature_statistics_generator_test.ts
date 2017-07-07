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
import Histogram from 'goog:proto.featureStatistics.Histogram';

import * as fsg from '../feature_statistics_generator';

const {expect} = chai;

describe('generateStats', () => {
  it('handles null data', () => {
    const stats = fsg.generateStats();
    expect(stats.getNumExamples()).to.equal(0);
  });

  it('picks dominant data type', () => {
    const items: fsg.DataPoint[] = [];
    const numItem: fsg.DataPoint = {};
    numItem['f1'] = 1;
    items.push(numItem);
    for (let i = 0; i < 5; ++i) {
      const item: fsg.DataPoint = {};
      item['f1'] = 'string';
      items.push(item);
    }

    const stats = fsg.generateStats(items);
    const feature = stats.getFeaturesList()![0];
    expect(feature.getType()).to.equal(FeatureNameStatistics.Type.STRING);
    expect(feature.getNumStats()).to.not.be.null;
  });

  it('detects integers', () => {
    const items: fsg.DataPoint[] = [];
    for (let i = 0; i < 5; ++i) {
      const item: fsg.DataPoint = {};
      item['f1'] = i;
      items.push(item);
    }

    const stats = fsg.generateStats(items);
    const feature = stats.getFeaturesList()![0];
    expect(feature.getType()).to.equal(FeatureNameStatistics.Type.INT);
  });

  it('detects floats', () => {
    const items: fsg.DataPoint[] = [];
    for (let i = 0; i < 5; ++i) {
      const item: fsg.DataPoint = {};
      item['f1'] = i;
      items.push(item);
    }
    const floatItem: fsg.DataPoint = {};
    floatItem['f1'] = 1.1;
    items.push(floatItem);
    const stats = fsg.generateStats(items);
    const feature = stats.getFeaturesList()![0];
    expect(feature.getType()).to.equal(FeatureNameStatistics.Type.FLOAT);
  });

  it('handles data', () => {
    const items: fsg.DataPoint[] = [];
    const item: fsg.DataPoint = {};
    item['f1'] = 1;
    item['f2'] = 'hello';
    items.push(item);
    const stats = fsg.generateStats(items);
    expect(stats.getNumExamples()).to.equal(1);
  });

  it('handles data with missing entries', () => {
    const items: fsg.DataPoint[] = [];
    const item: fsg.DataPoint = {};
    item['f1'] = 1;
    items.push(item);
    const item2: fsg.DataPoint = {};
    item2['f2'] = 'hello';
    items.push(item2);
    const stats = fsg.generateStats(items);
    expect(stats.getNumExamples()).to.equal(2);
  });

  it('handles numeric data', () => {
    const items: fsg.DataPoint[] = [];
    for (let i = 0; i < 500; ++i) {
      const item: fsg.DataPoint = {};
      item['f1'] = i;
      items.push(item);
    }
    const item: fsg.DataPoint = {};
    item['f1'] = 0;
    items.push(item);
    const stats = fsg.generateStats(items);
    expect(stats.getNumExamples()).to.equal(501);

    const numStats = stats.getFeaturesList()![0].getNumStats()!;
    expect(numStats.getMin()).to.equal(0);
    expect(numStats.getMax()).to.equal(499);
    expect(numStats.getMean()).to.be.within(249.001, 249.003);
    expect(numStats.getStdDev()).to.be.within(144.766, 144.768);
    expect(numStats.getMedian()).to.be.within(248.99, 249.01);
    expect(numStats.getNumZeros()).to.equal(2);

    expect(numStats.getHistogramsList().length).to.equal(2);
    expect(numStats.getHistogramsList()![0].getType())
      .to.equal(Histogram.HistogramType.STANDARD);
    let hist = numStats.getHistogramsList()![0].getBucketsList()!;
    expect(hist.length).to.equal(10);
    expect(hist[0].getSampleCount()).to.equal(51);
    expect(hist[0].getLowValue()).to.equal(0);
    expect(hist[0].getHighValue()).to.equal(49.9);
    expect(hist[9].getSampleCount()).to.equal(50);
    expect(hist[9].getLowValue()).to.be.within(449.099, 449.101);
    expect(hist[9].getHighValue()).to.equal(499);

    expect(numStats.getHistogramsList()![1].getType())
      .to.equal(Histogram.HistogramType.QUANTILES);
    hist = numStats.getHistogramsList()![1].getBucketsList()!;
    expect(hist.length).to.equal(10);
    expect(hist[0].getSampleCount()).to.equal(50.1);
    expect(hist[0].getLowValue()).to.equal(0);
    expect(hist[0].getHighValue()).to.equal(49);
    expect(hist[9].getSampleCount()).to.equal(50.1);
    expect(hist[9].getLowValue()).to.equal(449);
    expect(hist[9].getHighValue()).to.equal(499);
  });

  it('handles inf values', () => {
    const items: fsg.DataPoint[] = [];
    for (let i = 0; i < 500; ++i) {
      const item: fsg.DataPoint = {};
      item['f1'] = i;
      items.push(item);
    }
    const item: fsg.DataPoint = {};
    item['f1'] = Infinity;
    items.push(item);
    const item2: fsg.DataPoint = {};
    item2['f1'] = -Infinity;
    items.push(item2);
    const stats = fsg.generateStats(items);
    expect(stats.getNumExamples()).to.equal(502);

    const numStats = stats.getFeaturesList()![0].getNumStats()!;
    expect(numStats.getMin()).to.equal(-Infinity);
    expect(numStats.getMax()).to.equal(Infinity);
    expect(numStats.getMean()).to.be.NaN;
    expect(numStats.getStdDev()).to.be.NaN;

    expect(numStats.getHistogramsList().length).to.equal(2);
    expect(numStats.getHistogramsList()![0].getType())
      .to.equal(Histogram.HistogramType.STANDARD);
    const hist = numStats.getHistogramsList()![0].getBucketsList()!;
    expect(hist.length).to.equal(10);
    expect(hist[0].getLowValue()).to.equal(-Infinity);
    expect(hist[0].getSampleCount()).to.equal(51);
    expect(hist[9].getHighValue()).to.equal(Infinity);
    expect(hist[9].getSampleCount()).to.equal(51);
  });

  it('calculates correct quantiles', () => {
    const items: fsg.DataPoint[] = [];
    for (let i = 0; i < 50; ++i) {
      const item: fsg.DataPoint = {};
      item['f1'] = i;
      items.push(item);
      const itemConst: fsg.DataPoint = {};
      itemConst['f1'] = 100;
      items.push(itemConst);
    }
    const stats = fsg.generateStats(items);
    expect(stats.getNumExamples()).to.equal(100);
    const numStats = stats.getFeaturesList()![0].getNumStats()!;

    expect(numStats.getHistogramsList()![1].getType())
      .to.equal(Histogram.HistogramType.QUANTILES);
    const hist = numStats.getHistogramsList()![1].getBucketsList()!;
    expect(hist.length).to.equal(10);
    expect(hist[0].getSampleCount()).to.equal(10);
    expect(hist[0].getLowValue()).to.equal(0);
    expect(hist[0].getHighValue()).to.equal(9.9);
    expect(hist[9].getSampleCount()).to.equal(10);
    expect(hist[9].getLowValue()).to.equal(100);
    expect(hist[9].getHighValue()).to.equal(100);
  });

  it('handles string data', () => {
    const items: fsg.DataPoint[] = [];
    for (let i = 0; i < 500; ++i) {
      const item: fsg.DataPoint = {};
      item['f1'] = i % 2 === 0 ? 'popular' : i < 150 ? 'third' : 'second';
      items.push(item);
    }
    const stats = fsg.generateStats(items);
    expect(stats.getNumExamples()).to.equal(500);

    const stringStats = stats.getFeaturesList()![0].getStringStats()!;
    expect(stringStats.getUnique()).to.equal(3);
    expect(stringStats.getAvgLength()).to.equal(6.35);
    const topVals = stringStats.getTopValuesList()!;
    expect(topVals.length).to.equal(1);
    expect(topVals[0].getValue()).to.equal('popular');
    expect(topVals[0].getFrequency()).to.equal(250);

    const hist = stringStats.getRankHistogram()!.getBucketsList()!;
    expect(hist.length).to.equal(3);
    expect(hist[0].getSampleCount()).to.equal(250);
    expect(hist[0].getLabel()).to.equal('popular');
    expect(hist[0].getLowRank()).to.equal(0);
    expect(hist[0].getHighRank()).to.equal(0);
    expect(hist[2].getSampleCount()).to.equal(75);
    expect(hist[2].getLowRank()).to.equal(2);
    expect(hist[2].getHighRank()).to.equal(2);
  });

  it('generates correct common stats for strings', () => {
    const items: fsg.DataPoint[] = [];
    for (let i = 0; i < 10; ++i) {
      const item: fsg.DataPoint = {};
      item['f1'] = 'test';
      items.push(item);
    }
    const missingItem: fsg.DataPoint = {};
    missingItem['f2'] = 'f1 is missing';
    items.push(missingItem);

    const stats = fsg.generateStats(items);
    let common = stats.getFeaturesList()![0].getStringStats()!.getCommonStats()!;
    expect(common.getMinNumValues()).to.equal(1);
    expect(common.getMaxNumValues()).to.equal(1);
    expect(common.getAvgNumValues()).to.equal(1);
    expect(common.getNumMissing()).to.equal(1);
    expect(common.getNumNonMissing()).to.equal(10);
    expect(common.getNumValuesHistogram()!.getType())
      .to.equal(Histogram.HistogramType.QUANTILES);
    const hist = common.getNumValuesHistogram()!.getBucketsList()!;
    expect(hist.length).to.equal(10);
    expect(hist[0].getSampleCount()).to.equal(1);
    expect(hist[0].getLowValue()).to.equal(1);
    expect(hist[0].getHighValue()).to.equal(1);
    expect(hist[9].getSampleCount()).to.equal(1);
    expect(hist[9].getLowValue()).to.equal(1);
    expect(hist[9].getHighValue()).to.equal(1);

    common = stats.getFeaturesList()![1].getStringStats()!.getCommonStats()!;
    expect(common.getNumMissing()).to.equal(10);
    expect(common.getNumNonMissing()).to.equal(1);
  });

  it('generates correct common stats for nums', () => {
    const items: fsg.DataPoint[] = [];
    for (let i = 0; i < 10; ++i) {
      const item: fsg.DataPoint = {};
      item['f1'] = 1;
      items.push(item);
    }
    const missingItem: fsg.DataPoint = {};
    missingItem['f2'] = 2;
    items.push(missingItem);

    const stats = fsg.generateStats(items);
    let common = stats.getFeaturesList()![0].getNumStats()!.getCommonStats()!;
    expect(common.getMinNumValues()).to.equal(1);
    expect(common.getMaxNumValues()).to.equal(1);
    expect(common.getAvgNumValues()).to.equal(1);
    expect(common.getNumMissing()).to.equal(1);
    expect(common.getNumNonMissing()).to.equal(10);
    expect(common.getNumValuesHistogram()!.getType())
      .to.equal(Histogram.HistogramType.QUANTILES);
    const hist = common.getNumValuesHistogram()!.getBucketsList()!;
    expect(hist.length).to.equal(10);
    expect(hist[0].getSampleCount()).to.equal(1);
    expect(hist[0].getLowValue()).to.equal(1);
    expect(hist[0].getHighValue()).to.equal(1);
    expect(hist[9].getSampleCount()).to.equal(1);
    expect(hist[9].getLowValue()).to.equal(1);
    expect(hist[9].getHighValue()).to.equal(1);

    common = stats.getFeaturesList()![1].getNumStats()!.getCommonStats()!;
    expect(common.getNumMissing()).to.equal(10);
    expect(common.getNumNonMissing()).to.equal(1);
  });
});

describe('getStatsProto', () => {
  it('handles empty array', () => {
    const stats = fsg.getStatsProto([]);
    expect(stats.getDatasetsList().length).to.equal(0);
  });

  it('handles multiple datasets', () => {
    const items1: fsg.DataPoint[] = [];
    const item1: fsg.DataPoint = {};
    item1['f1'] = 1;
    items1.push(item1);
    const items2: fsg.DataPoint[] = [];
    const item2: fsg.DataPoint = {};
    item2['f1'] = 1;
    items2.push(item2);
    const stats = fsg.getStatsProto([
      {data: items1, name: 'train'},
      {data: items2, name: 'test'}]);
    const list = stats.getDatasetsList();
    expect(list.length).to.equal(2);
    expect(list[0].getName()).to.equal('train');
    expect(list[1].getName()).to.equal('test');
  });
});