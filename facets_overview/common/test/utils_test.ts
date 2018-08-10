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
import BytesStatistics from 'goog:proto.featureStatistics.BytesStatistics';
import CommonStatistics from 'goog:proto.featureStatistics.CommonStatistics';
import CustomStatistic from 'goog:proto.featureStatistics.CustomStatistic';
import DatasetFeatureStatistics from 'goog:proto.featureStatistics.DatasetFeatureStatistics';
import DatasetFeatureStatisticsList from 'goog:proto.featureStatistics.DatasetFeatureStatisticsList';
import NumericStatistics from 'goog:proto.featureStatistics.NumericStatistics';
import StringStatistics from 'goog:proto.featureStatistics.StringStatistics';
import StructStatistics from 'goog:proto.featureStatistics.StructStatistics';
import FeatureNameStatistics from 'goog:proto.featureStatistics.FeatureNameStatistics';
import Histogram from 'goog:proto.featureStatistics.Histogram';
import RankHistogram from 'goog:proto.featureStatistics.RankHistogram';
import WeightedNumericStatistics from 'goog:proto.featureStatistics.WeightedNumericStatistics';
import WeightedStringStatistics from 'goog:proto.featureStatistics.WeightedStringStatistics';
import * as utils from '../utils';

const {expect} = chai;

describe('getNormalizedEntropy', () => {
  it('returns 0 for no buckets', () => {
    const buckets = Array<Histogram.Bucket>();
    const ret = utils.getNormalizedEntropy(buckets);
    expect(ret).to.equal(0);
  });

  it('returns 0 for bucket count of 0', () => {
    const bucket = new Histogram.Bucket();
    bucket.setLowValue(0);
    bucket.setHighValue(10);
    bucket.setSampleCount(0);
    const ret = utils.getNormalizedEntropy([bucket]);
    expect(ret).to.equal(0);
  });

  it('returns 0 for a single bucket', () => {
    const bucket = new RankHistogram.Bucket();
    bucket.setLowRank(0);
    bucket.setHighRank(10);
    bucket.setSampleCount(5);
    const ret = utils.getNormalizedEntropy([bucket]);
    expect(ret).to.equal(0);
  });

  it('returns 1 for equal distributions', () => {
    const buckets = Array<Histogram.Bucket>();
    let bucket = new Histogram.Bucket();
    bucket.setLowValue(0);
    bucket.setHighValue(10);
    bucket.setSampleCount(5);
    buckets.push(bucket);
    bucket = new Histogram.Bucket();
    bucket.setLowValue(10);
    bucket.setHighValue(20);
    bucket.setSampleCount(5);
    buckets.push(bucket);
    const ret = utils.getNormalizedEntropy(buckets);
    expect(ret).to.equal(1);
  });

  it('returns the correct value for entropy', () => {
    const buckets = Array<Histogram.Bucket>();
    let bucket = new Histogram.Bucket();
    bucket.setLowValue(0);
    bucket.setHighValue(10);
    bucket.setSampleCount(5);
    buckets.push(bucket);
    bucket = new Histogram.Bucket();
    bucket.setLowValue(10);
    bucket.setHighValue(20);
    bucket.setSampleCount(10);
    buckets.push(bucket);
    const ret = utils.getNormalizedEntropy(buckets);
    expect(ret).to.be.closeTo(0.91829, 4);
  });

  it('works for RankHistogram buckets', () => {
    const bucket = new RankHistogram.Bucket();
    bucket.setLowRank(0);
    bucket.setHighRank(10);
    bucket.setSampleCount(1);
    const ret = utils.getNormalizedEntropy([bucket]);
    expect(ret).to.equal(0);
  });
});

describe('roundToPlaces', () => {
  it('returns same value when rounding not needed', () => {
    expect(utils.roundToPlaces(3, 1)).to.equal(3);
    expect(utils.roundToPlaces(3.1, 1)).to.equal(3.1);
    expect(utils.roundToPlaces(3.1, 2)).to.equal(3.1);
  });

  it('rounds correctly', () => {
    expect(utils.roundToPlaces(3.59, 1)).to.equal(3.6);
    expect(utils.roundToPlaces(3.581, 2)).to.equal(3.58);
  });

  it('can handle zeros', () => {
    expect(utils.roundToPlaces(3, 0)).to.equal(3);
    expect(utils.roundToPlaces(3.1, 0)).to.equal(3);
  });
  it('can handle non finite values', () => {
    expect(utils.roundToPlaces(Infinity, 2)).to.equal(Infinity);
    expect(utils.roundToPlaces(-Infinity, 2)).to.equal(-Infinity);
    expect(utils.roundToPlaces(NaN, 2)).to.be.NaN;
  });
  it('does not round scientific notation', () => {
    expect(utils.roundToPlaces(1.551e-8, 2)).to.equal(1.551e-8);
  });
});

describe('getBuckets', () => {
  it('returns empty array for no histogram', () => {
    const h = new utils.HistogramForDataset('test');
    expect(utils.getBuckets(h, false).length).to.equal(0);
  });

  it('returns the correct buckets', () => {
    const hist = new Histogram();
    const buckets = hist.getBucketsList();
    let b = new Histogram.Bucket();
    b.setLowValue(0);
    b.setHighValue(1);
    b.setSampleCount(10);
    buckets.push(b);
    b = new Histogram.Bucket();
    b.setLowValue(1);
    b.setHighValue(2);
    b.setSampleCount(20);
    buckets.push(b);
    const h = new utils.HistogramForDataset('test', hist);

    expect(utils.getBuckets(h, false).length).to.equal(2);
    expect(utils.getBuckets(h, false)[0].getSampleCount()).to.equal(10);
    expect(utils.getBuckets(h, false)[1].getSampleCount()).to.equal(20);
    expect(utils.getBuckets(h, true).length).to.equal(0);
  });

  it('returns the correct buckets for weighted histograms', () => {
    const hist = new Histogram();
    const buckets = hist.getBucketsList();
    let b = new Histogram.Bucket();
    b.setLowValue(0);
    b.setHighValue(1);
    b.setSampleCount(10);
    buckets.push(b);
    b = new Histogram.Bucket();
    b.setLowValue(1);
    b.setHighValue(2);
    b.setSampleCount(20);
    buckets.push(b);
    const h = new utils.HistogramForDataset('test', null, hist);

    expect(utils.getBuckets(h, true).length).to.equal(2);
    expect(utils.getBuckets(h, true)[0].getSampleCount()).to.equal(10);
    expect(utils.getBuckets(h, true)[1].getSampleCount()).to.equal(20);
    expect(utils.getBuckets(h, false).length).to.equal(0);
  });

  it('returns the correct buckets for quantiles', () => {
    const hist = new Histogram();
    hist.setType(Histogram.HistogramType.QUANTILES);
    const buckets = hist.getBucketsList();
    let b = new Histogram.Bucket();
    b.setLowValue(0);
    b.setHighValue(1);
    b.setSampleCount(10);
    buckets.push(b);
    b = new Histogram.Bucket();
    b.setLowValue(1);
    b.setHighValue(2);
    b.setSampleCount(20);
    buckets.push(b);
    const h = new utils.HistogramForDataset('test', null, null, hist);

    expect(utils.getBuckets(h, false, utils.CHART_SELECTION_QUANTILES).length)
        .to.equal(2);
    expect(utils.getBuckets(h, false, utils.CHART_SELECTION_QUANTILES)[0]
               .getSampleCount())
        .to.equal(10);
    expect(utils.getBuckets(h, false, utils.CHART_SELECTION_QUANTILES)[1]
               .getSampleCount())
        .to.equal(20);
    expect(utils.getBuckets(h, true).length).to.equal(0);
  });

  it('returns the correct buckets for weighted quantiles', () => {
    const hist = new Histogram();
    hist.setType(Histogram.HistogramType.QUANTILES);
    const buckets = hist.getBucketsList();
    let b = new Histogram.Bucket();
    b.setLowValue(0);
    b.setHighValue(1);
    b.setSampleCount(10);
    buckets.push(b);
    b = new Histogram.Bucket();
    b.setLowValue(1);
    b.setHighValue(2);
    b.setSampleCount(20);
    buckets.push(b);
    const h = new utils.HistogramForDataset('test', null, null, null, hist);

    expect(utils.getBuckets(h, true, utils.CHART_SELECTION_QUANTILES).length)
        .to.equal(2);
    expect(utils.getBuckets(h, true, utils.CHART_SELECTION_QUANTILES)[0]
               .getSampleCount())
        .to.equal(10);
    expect(utils.getBuckets(h, true, utils.CHART_SELECTION_QUANTILES)[1]
               .getSampleCount())
        .to.equal(20);
    expect(utils.getBuckets(h, true).length).to.equal(0);
    expect(utils.getBuckets(h, false, utils.CHART_SELECTION_QUANTILES).length)
        .to.equal(0);
  });

  it('returns the correct buckets for list quantiles', () => {
    const hist = new Histogram();
    hist.setType(Histogram.HistogramType.QUANTILES);
    const buckets = hist.getBucketsList();
    let b = new Histogram.Bucket();
    b.setLowValue(0);
    b.setHighValue(1);
    b.setSampleCount(10);
    buckets.push(b);
    b = new Histogram.Bucket();
    b.setLowValue(1);
    b.setHighValue(2);
    b.setSampleCount(20);
    buckets.push(b);
    const h =
        new utils.HistogramForDataset('test', null, null, null, null, hist);

    expect(
        utils.getBuckets(h, false, utils.CHART_SELECTION_LIST_QUANTILES).length)
        .to.equal(2);
    expect(utils.getBuckets(h, false, utils.CHART_SELECTION_LIST_QUANTILES)[0]
               .getSampleCount())
        .to.equal(10);
    expect(utils.getBuckets(h, false, utils.CHART_SELECTION_LIST_QUANTILES)[1]
               .getSampleCount())
        .to.equal(20);
  });

  it('returns the correct buckets for feature list length quantiles', () => {
    const hist = new Histogram();
    hist.setType(Histogram.HistogramType.QUANTILES);
    const buckets = hist.getBucketsList();
    let b = new Histogram.Bucket();
    b.setLowValue(0);
    b.setHighValue(1);
    b.setSampleCount(10);
    buckets.push(b);
    b = new Histogram.Bucket();
    b.setLowValue(1);
    b.setHighValue(2);
    b.setSampleCount(20);
    buckets.push(b);
    const h = new utils.HistogramForDataset(
        'test', null, null, null, null, null, hist);

    expect(
        utils
            .getBuckets(
                h, false, utils.CHART_SELECTION_FEATURE_LIST_LENGTH_QUANTILES)
            .length)
        .to.equal(2);
    expect(utils
               .getBuckets(
                   h, false,
                   utils.CHART_SELECTION_FEATURE_LIST_LENGTH_QUANTILES)[0]
               .getSampleCount())
        .to.equal(10);
    expect(utils
               .getBuckets(
                   h, false,
                   utils.CHART_SELECTION_FEATURE_LIST_LENGTH_QUANTILES)[1]
               .getSampleCount())
        .to.equal(20);
  });

  it('returns the correct buckets for a custom histogram', () => {
    const hist = new Histogram();
    hist.setType(Histogram.HistogramType.QUANTILES);
    const buckets = hist.getBucketsList();
    let b = new Histogram.Bucket();
    b.setLowValue(0);
    b.setHighValue(1);
    b.setSampleCount(10);
    buckets.push(b);
    b = new Histogram.Bucket();
    b.setLowValue(1);
    b.setHighValue(2);
    b.setSampleCount(20);
    buckets.push(b);
    const h = new utils.HistogramForDataset(
        'test', null, null, null, null, null, null, {'data-custom': hist});

    expect(utils.getBuckets(h, false, 'data-custom').length).to.equal(2);
    expect(utils.getBuckets(h, false, 'data-custom')[0].getSampleCount()).to.equal(10);
    expect(utils.getBuckets(h, false, 'data-custom')[1].getSampleCount()).to.equal(20);
  });
});

describe('getTotalCounts', () => {
  it('can handle multiple datasets', () => {
    let hist = new Histogram();
    let buckets = hist.getBucketsList();
    let b = new Histogram.Bucket();
    b.setLowValue(0);
    b.setHighValue(1);
    b.setSampleCount(10);
    buckets.push(b);
    b = new Histogram.Bucket();
    b.setLowValue(1);
    b.setHighValue(2);
    b.setSampleCount(20);
    buckets.push(b);
    const h1 = new utils.HistogramForDataset('test', hist);
    hist = new Histogram();
    buckets = hist.getBucketsList();
    b = new Histogram.Bucket();
    b.setLowValue(0);
    b.setHighValue(1);
    b.setSampleCount(1);
    buckets.push(b);
    b = new Histogram.Bucket();
    b.setLowValue(1);
    b.setHighValue(2);
    b.setSampleCount(2);
    buckets.push(b);
    const h2 = new utils.HistogramForDataset('test2', hist);

    const totals = utils.getTotalCounts([h1, h2], false);
    expect(totals.length).to.equal(2);
    expect(totals[0]).to.equal(30);
    expect(totals[1]).to.equal(3);
    const totalsWeighted = utils.getTotalCounts([h1, h2], true);
    expect(totalsWeighted.length).to.equal(2);
    expect(totalsWeighted[0]).to.equal(0);
    expect(totalsWeighted[1]).to.equal(0);
  });

  it('can handle missing counts', () => {
    const hist = new Histogram();
    const buckets = hist.getBucketsList();
    let b = new Histogram.Bucket();
    b.setLowValue(0);
    b.setHighValue(1);
    b.setSampleCount(10);
    buckets.push(b);
    b = new Histogram.Bucket();
    b.setLowValue(1);
    b.setHighValue(2);
    buckets.push(b);
    b = new Histogram.Bucket();
    b.setLowValue(2);
    b.setHighValue(3);
    b.setSampleCount(1);
    buckets.push(b);
    const h1 = new utils.HistogramForDataset('test', hist);

    const totals = utils.getTotalCounts([h1], false);
    expect(totals.length).to.equal(1);
    expect(totals[0]).to.equal(11);
  });

  it('can handle an empty list', () => {
    const totals = utils.getTotalCounts([], false);
    expect(totals.length).to.equal(0);
  });
});

describe('getAllLabels', () => {
  it('can handle multiple datasets and duplicate entries', () => {
    let hist = new RankHistogram();
    let buckets = hist.getBucketsList();
    let b = new RankHistogram.Bucket();
    b.setLabel("a");
    b.setSampleCount(10);
    buckets.push(b);
    b = new RankHistogram.Bucket();
    b.setLabel("b");
    b.setSampleCount(20);
    buckets.push(b);
    const h1 = new utils.HistogramForDataset('test', hist);
    hist = new RankHistogram();
    buckets = hist.getBucketsList();
    b = new RankHistogram.Bucket();
    b.setLabel("a");
    b.setSampleCount(1);
    buckets.push(b);
    b = new RankHistogram.Bucket();
    b.setLabel("c");
    b.setSampleCount(2);
    buckets.push(b);
    const h2 = new utils.HistogramForDataset('test2', hist);

    const histBuckets = [h1, h2].map(d => utils.getBuckets(d));
    const labels = utils.getAllLabels(histBuckets);
    expect(labels.length).to.equal(3);
    expect(labels).to.include("a");
    expect(labels).to.include("b");
    expect(labels).to.include("c");
  });

  it('can handle an empty list', () => {
    const labels = utils.getAllLabels([]);
    expect(labels.length).to.equal(0);
  });
});

describe('getPrintableLabels', () => {
  it('can handle undefined', () => {
    expect(utils.getPrintableLabel(undefined)).to.equal("\u00a0");
  });

  it('returns valid strings', () => {
    expect(utils.getPrintableLabel("test")).to.equal("test");
  });
});

describe('getNumberFromField', () => {
  it('can handle undefined', () => {
    expect(utils.getNumberFromField(undefined)).to.equal(0);
  });

  it('can handle "inf"', () => {
    expect(utils.getNumberFromField('inf')).to.equal(Infinity);
  });

  it('can handle "-inf"', () => {
    expect(utils.getNumberFromField('-inf')).to.equal(-Infinity);
  });

  it('returns valid numbers', () => {
    expect(utils.getNumberFromField(10.4)).to.equal(10.4);
  });

  it('can handle strings', () => {
    expect(utils.getNumberFromField("10.4")).to.equal(10.4);
  });
});

describe('getHistogramDistance', () => {
  it('returns 0 when given only one histogram', () => {
    const hist = new RankHistogram();
    const buckets = hist.getBucketsList();
    let b = new RankHistogram.Bucket();
    b.setLabel("a");
    b.setSampleCount(10);
    buckets.push(b);
    b = new RankHistogram.Bucket();
    b.setLabel("b");
    b.setSampleCount(20);
    buckets.push(b);
    const h1 = new utils.HistogramForDataset('test', hist);

    expect(utils.getHistogramDistance([h1])).to.equal(0);
  });

  it('returns 0 when given no buckets', () => {
    let hist = new RankHistogram();
    const h1 = new utils.HistogramForDataset('test', hist);
    hist = new RankHistogram();
    const h2 = new utils.HistogramForDataset('test', hist);

    expect(utils.getHistogramDistance([h1, h2])).to.equal(0);
  });

  it('returns 0 when given no histograms', () => {
    expect(utils.getHistogramDistance([])).to.equal(0);
  });

  it('returns 0 when given two identical numeric histograms', () => {
    let hist = new Histogram();
    let buckets = hist.getBucketsList();
    let b = new Histogram.Bucket();
    b.setLowValue(0);
    b.setHighValue(1);
    b.setSampleCount(10);
    buckets.push(b);
    b = new Histogram.Bucket();
    b.setLowValue(1);
    b.setHighValue(2);
    b.setSampleCount(20);
    buckets.push(b);
    const h1 = new utils.HistogramForDataset('test', hist);
    hist = new Histogram();
    buckets = hist.getBucketsList();
    b = new Histogram.Bucket();
    b.setLowValue(0);
    b.setHighValue(1);
    b.setSampleCount(10);
    buckets.push(b);
    b = new Histogram.Bucket();
    b.setLowValue(1);
    b.setHighValue(2);
    b.setSampleCount(20);
    buckets.push(b);
    const h2 = new utils.HistogramForDataset('test2', hist);

    expect(utils.getHistogramDistance([h1, h2])).to.equal(0);
  });

  it('returns 0 when given two identical rank histograms in different orders',
     () => {
    let hist = new RankHistogram();
    let buckets = hist.getBucketsList();
    let b = new RankHistogram.Bucket();
    b.setLabel("a");
    b.setSampleCount(10);
    buckets.push(b);
    b = new RankHistogram.Bucket();
    b.setLabel("b");
    b.setSampleCount(20);
    buckets.push(b);
    const h1 = new utils.HistogramForDataset('test', hist);
    hist = new RankHistogram();
    buckets = hist.getBucketsList();
    b = new RankHistogram.Bucket();
    b.setLabel("b");
    b.setSampleCount(20);
    buckets.push(b);
    b = new RankHistogram.Bucket();
    b.setLabel("a");
    b.setSampleCount(10);
    buckets.push(b);
    const h2 = new utils.HistogramForDataset('test2', hist);

    expect(utils.getHistogramDistance([h1, h2])).to.equal(0);
  });

  it('returns infinity when given one of the histograms is empty', () => {
    let hist = new Histogram();
    const buckets = hist.getBucketsList();
    let b = new Histogram.Bucket();
    b.setLowValue(0);
    b.setHighValue(1);
    b.setSampleCount(10);
    buckets.push(b);
    b = new Histogram.Bucket();
    b.setLowValue(1);
    b.setHighValue(2);
    b.setSampleCount(20);
    buckets.push(b);
    const h1 = new utils.HistogramForDataset('test', hist);
    hist = new Histogram();
    const h2 = new utils.HistogramForDataset('test2', hist);

    expect(utils.getHistogramDistance([h1, h2])).to.equal(Infinity);
  });

  it('can handle rank histograms with non-identical label sets', () => {
    let hist = new RankHistogram();
    let buckets = hist.getBucketsList();
    let b = new RankHistogram.Bucket();
    b.setLabel("a");
    b.setSampleCount(10);
    buckets.push(b);
    b = new RankHistogram.Bucket();
    b.setLabel("b");
    b.setSampleCount(20);
    buckets.push(b);
    const h1 = new utils.HistogramForDataset('test', hist);
    hist = new RankHistogram();
    buckets = hist.getBucketsList();
    b = new RankHistogram.Bucket();
    b.setLabel("a");
    b.setSampleCount(10);
    buckets.push(b);
    b = new RankHistogram.Bucket();
    b.setLabel("c");
    b.setSampleCount(10);
    buckets.push(b);
    const h2 = new utils.HistogramForDataset('test2', hist);

    expect(utils.getHistogramDistance([h1, h2])).to.be.closeTo(30.76923, 4);
  });

  it('returns the maximum distance when given more than two histograms', () => {
    // First two histograms are identical but third is very different.
    let hist = new Histogram();
    let buckets = hist.getBucketsList();
    let b = new Histogram.Bucket();
    b.setLowValue(0);
    b.setHighValue(1);
    b.setSampleCount(10);
    buckets.push(b);
    b = new Histogram.Bucket();
    b.setLowValue(1);
    b.setHighValue(2);
    b.setSampleCount(20);
    buckets.push(b);
    const h1 = new utils.HistogramForDataset('test', hist);
    hist = new Histogram();
    buckets = hist.getBucketsList();
    b = new Histogram.Bucket();
    b.setLowValue(0);
    b.setHighValue(1);
    b.setSampleCount(10);
    buckets.push(b);
    b = new Histogram.Bucket();
    b.setLowValue(1);
    b.setHighValue(2);
    b.setSampleCount(20);
    buckets.push(b);
    const h2 = new utils.HistogramForDataset('test2', hist);
    hist = new Histogram();
    buckets = hist.getBucketsList();
    b = new Histogram.Bucket();
    b.setLowValue(0);
    b.setHighValue(1);
    b.setSampleCount(0);
    buckets.push(b);
    b = new Histogram.Bucket();
    b.setLowValue(1);
    b.setHighValue(2);
    b.setSampleCount(10);
    buckets.push(b);
    const h3 = new utils.HistogramForDataset('test2', hist);

    expect(utils.getHistogramDistance([h1, h2, h3])).to.be.closeTo(10.90909, 4);
  });

  it('can handle missing counts', () => {
    let hist = new Histogram();
    let buckets = hist.getBucketsList();
    let b = new Histogram.Bucket();
    b.setLowValue(0);
    b.setHighValue(1);
    b.setSampleCount(10);
    buckets.push(b);
    b = new Histogram.Bucket();
    b.setLowValue(1);
    b.setHighValue(2);
    b.setSampleCount(0);
    buckets.push(b);
    const h1 = new utils.HistogramForDataset('test', hist);
    hist = new Histogram();
    buckets = hist.getBucketsList();
    b = new Histogram.Bucket();
    b.setLowValue(0);
    b.setHighValue(1);
    b.setSampleCount(10);
    buckets.push(b);
    b = new Histogram.Bucket();
    b.setLowValue(1);
    b.setHighValue(2);
    // Missing count for this bucket, should act as 0.
    buckets.push(b);
    const h2 = new utils.HistogramForDataset('test2', hist);

    expect(utils.getHistogramDistance([h1, h2])).to.equal(0);
  });
});

describe('getRatioMissingAndZero', () => {
  it('returns 1 when no stats', () => {
    expect(utils.getRatioMissingAndZero(null)).to.equal(1);

    const feature = new FeatureNameStatistics();
    const stats = new BytesStatistics();
    feature.setBytesStats(stats);
    expect(utils.getRatioMissingAndZero(feature)).to.equal(1);
  });

  it('can handle byte stats', () => {
    const feature = new FeatureNameStatistics();
    const stats = new BytesStatistics();
    feature.setBytesStats(stats);
    const commonStats = new CommonStatistics();
    stats.setCommonStats(commonStats);
    commonStats.setNumMissing(10);
    commonStats.setNumNonMissing(90);

    expect(utils.getRatioMissingAndZero(feature)).to.equal(.1);
  });

  it('can handle struct stats', () => {
    const feature = new FeatureNameStatistics();
    const stats = new StructStatistics();
    feature.setStructStats(stats);
    const commonStats = new CommonStatistics();
    stats.setCommonStats(commonStats);
    commonStats.setNumMissing(10);
    commonStats.setNumNonMissing(90);

    expect(utils.getRatioMissingAndZero(feature)).to.equal(.1);
  });

  it('can handle string stats', () => {
    const feature = new FeatureNameStatistics();
    const stats = new StringStatistics();
    feature.setStringStats(stats);
    const commonStats = new CommonStatistics();
    stats.setCommonStats(commonStats);
    commonStats.setNumMissing(20);
    commonStats.setNumNonMissing(80);

    expect(utils.getRatioMissingAndZero(feature)).to.equal(.2);
  });

  it('can handle numeric stats including zeros', () => {
    const feature = new FeatureNameStatistics();
    const stats = new NumericStatistics();
    feature.setNumStats(stats);
    const commonStats = new CommonStatistics();
    stats.setCommonStats(commonStats);
    stats.setNumZeros(10);
    commonStats.setNumMissing(20);
    commonStats.setNumNonMissing(80);

    expect(utils.getRatioMissingAndZero(feature)).to.equal(.3);
  });
});

describe('filteredElementCountString', () => {
  it('returns the total as a string if the numbers are equal', () => {
    expect(utils.filteredElementCountString(123, 123)).to.equal("123");
  });

  it('returns a fraction string if the numbers are different', () => {
    expect(utils.filteredElementCountString(123, 456)).to.equal("123/456");
  });
});

describe('stringFromFeatureType', () => {
  it('returns int if given INT', () => {
    expect(utils.stringFromFeatureType(FeatureNameStatistics.Type.INT))
      .to.equal('int');
  });

  it('returns string if given STRING', () => {
    expect(utils.stringFromFeatureType(FeatureNameStatistics.Type.STRING))
      .to.equal('string');
  });

  it('returns float if given FLOAT', () => {
    expect(utils.stringFromFeatureType(FeatureNameStatistics.Type.FLOAT))
      .to.equal('float');
  });

  it('returns binary if given BYTES', () => {
    expect(utils.stringFromFeatureType(FeatureNameStatistics.Type.BYTES))
      .to.equal('binary');
  });

  it('returns struct if given STRUCT', () => {
    expect(utils.stringFromFeatureType(FeatureNameStatistics.Type.STRUCT))
      .to.equal('struct');
  });

  it('returns unknown if given other value', () => {
    expect(utils.stringFromFeatureType(123))
      .to.equal('unknown');
  });
});

describe('containsNumericStats', () => {
  it('returns true for numeric features', () => {
    const f = new FeatureNameStatistics();
    f.setNumStats(new NumericStatistics());
    expect(utils.containsNumericStats(f)).to.be.true;
  });

  it('returns false for non-numeric features', () => {
    const f = new FeatureNameStatistics();
    f.setStringStats(new StringStatistics());
    expect(utils.containsNumericStats(f)).to.be.false;
  });
});

describe('isFeatureTypeNumeric', () => {
  it('returns true for numeric features', () => {
    expect(utils.isFeatureTypeNumeric(FeatureNameStatistics.Type.INT))
      .to.be.true;
    expect(utils.isFeatureTypeNumeric(FeatureNameStatistics.Type.FLOAT))
      .to.be.true;
  });

  it('returns false for non-numeric features', () => {
    expect(utils.isFeatureTypeNumeric(FeatureNameStatistics.Type.STRING))
      .to.be.false;
    expect(utils.isFeatureTypeNumeric(FeatureNameStatistics.Type.BYTES))
      .to.be.false;
    expect(utils.isFeatureTypeNumeric(FeatureNameStatistics.Type.STRUCT))
      .to.be.false;
  });
});

const buildDeprecatedRankHistogramData = (num: number) => {
  const dl = new DatasetFeatureStatisticsList();
  const d = new DatasetFeatureStatistics();
  dl.setDatasetsList([d]);
  d.setFeaturesList([new FeatureNameStatistics()]);
  d.getFeaturesList()![0].setName('f');
  d.getFeaturesList()![0].setStringStats(new StringStatistics());
  const h = new RankHistogram();
  const bucket = new RankHistogram.Bucket();
  bucket.setDeprecatedCount(num);
  h.setBucketsList([bucket]);
  d.getFeaturesList()![0].getStringStats()!.setRankHistogram(h);
  return dl;
};

const buildDeprecatedHistogramData = (num: number) => {
  const dl = new DatasetFeatureStatisticsList();
  const d = new DatasetFeatureStatistics();
  dl.setDatasetsList([d]);
  d.setFeaturesList([new FeatureNameStatistics()]);
  d.getFeaturesList()![0].setName('f');
  d.getFeaturesList()![0].setNumStats(new NumericStatistics());
  const h = new Histogram();
  const bucket = new Histogram.Bucket();
  bucket.setDeprecatedCount(num);
  h.setBucketsList([bucket]);
  d.getFeaturesList()![0].getNumStats()!.setHistogramsList([h]);
  return dl;
};

const buildDeprecatedFreqData = (num: number) => {
  const dl = new DatasetFeatureStatisticsList();
  const d = new DatasetFeatureStatistics();
  dl.setDatasetsList([d]);
  d.setFeaturesList([new FeatureNameStatistics()]);
  d.getFeaturesList()![0].setName('f');
  const stats = new StringStatistics();
  d.getFeaturesList()![0].setStringStats(stats);
  const f = new StringStatistics.FreqAndValue();
  f.setDeprecatedFreq(num);
  stats.setTopValuesList([f]);
  return dl;
};

describe('cleanProto', () => {
  it('updates FreqAndValue frequency from the deprecated field', () => {
    const dl = buildDeprecatedFreqData(10);
    utils.cleanProto(dl);
    expect(dl.getDatasetsList()![0].getFeaturesList()![0].getStringStats()!.
           getTopValuesList()![0].getFrequency()).to.equal(10);
  });

  it('updates Histogram bucket counts from the deprecated field', () => {
    const dl = buildDeprecatedHistogramData(10);
    utils.cleanProto(dl);
    expect(dl.getDatasetsList()![0].getFeaturesList()![0].getNumStats()!.
           getHistogramsList()![0].getBucketsList()![0].getSampleCount()).
           to.equal(10);
  });

  it('updates RankHistogram bucket counts from the deprecated field', () => {
    const dl = buildDeprecatedRankHistogramData(10);
    utils.cleanProto(dl);
    expect(dl.getDatasetsList()![0].getFeaturesList()![0].getStringStats()!.
           getRankHistogram()!.getBucketsList()![0].getSampleCount()).to.equal(10);
  });
});

describe('isProtoClean', () => {
  it('fails with deprecated frequency data',
     () => {
    expect(utils.isProtoClean(buildDeprecatedFreqData(10))).to.be.false;
  });

  it('fails with deprecated histogram data',
     () => {
    expect(utils.isProtoClean(buildDeprecatedHistogramData(10))).to.be.false;
  });

  it('fails with deprecated rank histogram data',
     () => {
    expect(utils.isProtoClean(buildDeprecatedRankHistogramData(10))).
        to.be.false;
  });

  it('succeeds with empty data',
     () => {
    expect(utils.isProtoClean(new DatasetFeatureStatisticsList())).to.be.true;
  });

  it('succeeds with clean data', () => {
    const dl = new DatasetFeatureStatisticsList();
    const d = new DatasetFeatureStatistics();
    dl.setDatasetsList([d]);

    const f1 = new FeatureNameStatistics();
    f1.setStringStats(new StringStatistics());
    const h1 = new RankHistogram();
    const bucket1 = new RankHistogram.Bucket();
    bucket1.setSampleCount(1);
    h1.setBucketsList([bucket1]);
    f1.getStringStats()!.setRankHistogram(h1);
    const freq = new StringStatistics.FreqAndValue();
    freq.setFrequency(1);
    f1.getStringStats()!.setTopValuesList([freq]);

    const f2 = new FeatureNameStatistics();
    f2.setNumStats(new NumericStatistics());
    const h2 = new Histogram();
    const bucket2 = new Histogram.Bucket();
    bucket2.setSampleCount(1);
    h2.setBucketsList([bucket2]);
    f2.getNumStats()!.setHistogramsList([h2]);

    d.setFeaturesList([f1, f2]);

    expect(utils.isProtoClean(dl)).to.be.true;
  });
});

describe('getNumStatsEntries', () => {
  let n: NumericStatistics;
  let c: CommonStatistics;

  beforeEach(() => {
    n = new NumericStatistics();
    n.setMin(0);
    n.setMax(10);
    n.setStdDev(1);
    n.setMean(5);
    n.setMedian(5);
    n.setNumZeros(1);
    const w = new WeightedNumericStatistics();
    w.setMean(4);
    w.setStdDev(0.8);
    w.setMedian(6);
    n.setWeightedNumericStats(w);
    c = new CommonStatistics();
    n.setCommonStats(c);
    c.setNumMissing(3);
    c.setNumNonMissing(17);
    c.setAvgNumValues(1);
  });

  it('handles standard case', () => {
    const stats = utils.getNumStatsEntries(n, c, false);
    expect(stats[0].str).to.equal('5');
    expect(stats[1].str).to.equal('1');
    expect(stats[2].str).to.equal('5.88%');
    expect(stats[3].str).to.equal('0');
    expect(stats[4].str).to.equal('5');
    expect(stats[5].str).to.equal('10');
  });

  it('handles nans', () => {
    const h = new Histogram();
    h.setNumNan(1);
    n.setHistogramsList([h]);

    const stats = utils.getNumStatsEntries(n, c, false);
    expect(stats[0].str).to.equal('5');
    expect(stats[1].str).to.equal('1');
    expect(stats[2].str).to.equal('5.88%');
    expect(stats[3].str).to.equal('NaN');
    expect(stats[4].str).to.equal('5');
    expect(stats[5].str).to.equal('NaN');
  });

  it('handles weighted stats', () => {
    const stats = utils.getNumStatsEntries(n, c, true);
    expect(stats[0].str).to.equal('4');
    expect(stats[1].str).to.equal('0.8');
    expect(stats[2].str).to.equal('5.88%');
    expect(stats[3].str).to.equal('0');
    expect(stats[4].str).to.equal('6');
    expect(stats[5].str).to.equal('10');
  });

  it('handles no numeric stats', () => {
    const stats = utils.getNumStatsEntries(null, c, false);
    expect(stats[0].str).to.equal('-');
    expect(stats[1].str).to.equal('-');
    expect(stats[2].str).to.equal('-');
    expect(stats[3].str).to.equal('-');
    expect(stats[4].str).to.equal('-');
    expect(stats[5].str).to.equal('-');
  });
});

describe('containsWeightedStats', () => {
  it('returns false for empty data', () => {
    expect(utils.containsWeightedStats(
      new DatasetFeatureStatisticsList())).to.be.false;
  });

  it('returns false for non-weighted data', () => {
    const dl = new DatasetFeatureStatisticsList();
    const d = new DatasetFeatureStatistics();
    dl.setDatasetsList([d]);
    d.setFeaturesList(
        [new FeatureNameStatistics(), new FeatureNameStatistics()]);
    d.getFeaturesList()![0].setStringStats(new StringStatistics());
    d.getFeaturesList()![1].setNumStats(new NumericStatistics());
    expect(utils.containsWeightedStats(dl)).to.be.false;
  });

  it('returns true with weighted numeric stats', () => {
    const dl = new DatasetFeatureStatisticsList();
    const d = new DatasetFeatureStatistics();
    dl.setDatasetsList([d]);
    d.setFeaturesList([new FeatureNameStatistics()]);
    d.getFeaturesList()![0].setNumStats(new NumericStatistics());
    d.getFeaturesList()![0].getNumStats()!.setWeightedNumericStats(
      new WeightedNumericStatistics());
    expect(utils.containsWeightedStats(dl)).to.be.true;
  });

  it('returns true with weighted string stats', () => {
    const dl = new DatasetFeatureStatisticsList();
    const d = new DatasetFeatureStatistics();
    dl.setDatasetsList([d]);
    d.setFeaturesList([new FeatureNameStatistics()]);
    d.getFeaturesList()![0].setStringStats(new StringStatistics());
    d.getFeaturesList()![0].getStringStats()!.setWeightedStringStats(
      new WeightedStringStatistics());
    expect(utils.containsWeightedStats(dl)).to.be.true;
  });
});

describe('containsCustomStats', () => {
  it('returns false for empty data', () => {
    expect(utils.containsCustomStats(
      new DatasetFeatureStatisticsList())).to.be.false;
  });

  it('returns false for non-custom data', () => {
    const dl = new DatasetFeatureStatisticsList();
    const d = new DatasetFeatureStatistics();
    dl.setDatasetsList([d]);
    d.setFeaturesList([new FeatureNameStatistics(), new FeatureNameStatistics()]);
    d.getFeaturesList()![0].setStringStats(new StringStatistics());
    d.getFeaturesList()![1].setNumStats(new NumericStatistics());
    expect(utils.containsCustomStats(dl)).to.be.false;
  });

  it('returns true with custom stats', () => {
    const dl = new DatasetFeatureStatisticsList();
    const d = new DatasetFeatureStatistics();
    dl.setDatasetsList([d]);
    d.setFeaturesList([new FeatureNameStatistics()]);
    d.getFeaturesList()![0].setCustomStatsList([new CustomStatistic()]);
    expect(utils.containsCustomStats(dl)).to.be.true;
  });
});

describe('containsFeatureListLengthData', () => {
  it('returns false for empty data', () => {
    expect(
        utils.containsFeatureListLengthData(new DatasetFeatureStatisticsList()))
        .to.be.false;
  });

  it('returns false for no feature list length data', () => {
    const dl = new DatasetFeatureStatisticsList();
    const d = new DatasetFeatureStatistics();
    dl.setDatasetsList([d]);
    d.setFeaturesList(
        [new FeatureNameStatistics(), new FeatureNameStatistics()]);
    d.getFeaturesList()![0].setStringStats(new StringStatistics());
    d.getFeaturesList()![0].getStringStats()!.setCommonStats(
        new CommonStatistics());
    expect(utils.containsFeatureListLengthData(dl)).to.be.false;
  });

  it('returns true with feature list length data', () => {
    const dl = new DatasetFeatureStatisticsList();
    const d = new DatasetFeatureStatistics();
    dl.setDatasetsList([d]);
    d.setFeaturesList(
        [new FeatureNameStatistics(), new FeatureNameStatistics()]);
    d.getFeaturesList()![0].setStringStats(new StringStatistics());
    d.getFeaturesList()![0].getStringStats()!.setCommonStats(
        new CommonStatistics());
    d.getFeaturesList()![0]
        .getStringStats()!.getCommonStats()!.setFeatureListLengthHistogram(
            new Histogram());
    expect(utils.containsFeatureListLengthData(dl)).to.be.true;
  });
});

describe('hasWeightedHistogram', () => {
  it('returns false for no histograms', () => {
    const h = new utils.HistogramForDataset('test');
    expect(utils.hasWeightedHistogram([h])).to.be.false;
  });

  it('returns false for no weighted histograms', () => {
    const hists = [
      new utils.HistogramForDataset('test', new Histogram(), null),
      new utils.HistogramForDataset('test', new Histogram(), null)
    ];
    expect(utils.hasWeightedHistogram(hists)).to.be.false;
  });

  it('returns true for a weighted histogram', () => {
    const hists = [
      new utils.HistogramForDataset('test', new Histogram(), null),
      new utils.HistogramForDataset('test', new Histogram(), new Histogram())
    ];
    expect(utils.hasWeightedHistogram(hists)).to.be.true;
  });
});

describe('hasQuantiles', () => {
  it('returns false for no quantiles', () => {
    const h = new utils.HistogramForDataset('test');
    expect(utils.hasQuantiles([h])).to.be.false;
  });

  it('returns false for no quantiles', () => {
    const hists = [
      new utils.HistogramForDataset('test', new Histogram(), null, null),
      new utils.HistogramForDataset('test2', new Histogram(), null, null)
    ];
    expect(utils.hasQuantiles(hists)).to.be.false;
  });

  it('returns true for a weighted histogram', () => {
    const quantile = new Histogram();
    quantile.setType(Histogram.HistogramType.QUANTILES);
    const hists = [
      new utils.HistogramForDataset('test', new Histogram(), null, null),
      new utils.HistogramForDataset('test2', new Histogram(), null, quantile)
    ];
    expect(utils.hasQuantiles(hists)).to.be.true;
  });
});

describe('hasListQuantiles', () => {
  it('returns false for no list quantiles', () => {
    const h = new utils.HistogramForDataset('test');
    expect(utils.hasListQuantiles([h])).to.be.false;
  });

  it('returns true for list quantiles histogram', () => {
    const quantile = new Histogram();
    quantile.setType(Histogram.HistogramType.QUANTILES);
    const hists = [
      new utils.HistogramForDataset('test', null, null, null),
      new utils.HistogramForDataset('test2', null, null, null, null, quantile)
    ];
    expect(utils.hasListQuantiles(hists)).to.be.true;
  });
});

describe('getTotalNumberOfValues', () => {
  it('returns 0 for null input', () => {
    expect(utils.getTotalNumberOfValues(null)).to.equal(0);
  });

  it('returns 0 with no-dimensional data', () => {
    const commonStats = new CommonStatistics();
    commonStats.setAvgNumValues(0);
    commonStats.setNumNonMissing(6);
    expect(utils.getTotalNumberOfValues(commonStats)).to.equal(0);
  });

  it('returns 0 with all missing data', () => {
    const commonStats = new CommonStatistics();
    commonStats.setAvgNumValues(1);
    commonStats.setNumNonMissing(0);
    expect(utils.getTotalNumberOfValues(commonStats)).to.equal(0);
  });

  it('returns correct value with single-dimensional data', () => {
    const commonStats = new CommonStatistics();
    commonStats.setAvgNumValues(1);
    commonStats.setNumNonMissing(6);
    expect(utils.getTotalNumberOfValues(commonStats)).to.equal(6);
  });

  it('returns correct value with multi-dimensional data', () => {
    const commonStats = new CommonStatistics();
    commonStats.setAvgNumValues(2.5);
    commonStats.setNumNonMissing(6);
    expect(utils.getTotalNumberOfValues(commonStats)).to.equal(15);
  });
});

describe('quoteIfNumber', () => {
  it('returns empty string for empty string', () => {
    expect(utils.quoteIfNumber("")).to.equal("");
  });

  it('returns same string for characters', () => {
    expect(utils.quoteIfNumber("test")).to.equal("test");
  });

  it('returns same string for nums and characters', () => {
    expect(utils.quoteIfNumber("12px")).to.equal("12px");
  });

  it('returns quoted string for nums', () => {
    expect(utils.quoteIfNumber("12")).to.equal("\"12\"");
  });
});

describe('getSpecFromFeatureStats', () => {
  it('returns unknown when no stats', () => {
    const common = new CommonStatistics();
    common.setNumNonMissing(0);
    expect(utils.getSpecFromFeatureStats(
      FeatureNameStatistics.Type.INT, common)).to.equal(utils.FS_UNKNOWN);
  });

  it('returns scalar int', () => {
    const common = new CommonStatistics();
    common.setNumNonMissing(10);
    common.setMinNumValues(1);
    common.setMaxNumValues(1);
    expect(utils.getSpecFromFeatureStats(
      FeatureNameStatistics.Type.INT, common)).to.equal(utils.FS_SCALAR_INT);
  });

  it('returns fixed-length floats', () => {
    const common = new CommonStatistics();
    common.setNumNonMissing(10);
    common.setMinNumValues(2);
    common.setMaxNumValues(2);
    expect(utils.getSpecFromFeatureStats(
      FeatureNameStatistics.Type.FLOAT, common)).to.equal(utils.FS_FIXED_LEN_FLOATS);
  });

  it('returns var length strings', () => {
    const common = new CommonStatistics();
    common.setNumNonMissing(10);
    common.setMinNumValues(1);
    common.setMaxNumValues(2);
    expect(utils.getSpecFromFeatureStats(
      FeatureNameStatistics.Type.STRING, common)).to.equal(utils.FS_VAR_LEN_STRS);
  });

  it('returns scalar bytes', () => {
    const common = new CommonStatistics();
    common.setNumNonMissing(10);
    common.setMinNumValues(1);
    common.setMaxNumValues(1);
    expect(utils.getSpecFromFeatureStats(
      FeatureNameStatistics.Type.BYTES, common)).to.equal(utils.FS_SCALAR_BYTES);
  });

  it('returns fixed length struct', () => {
    const common = new CommonStatistics();
    common.setNumNonMissing(10);
    common.setMinNumValues(2);
    common.setMaxNumValues(2);
    expect(utils.getSpecFromFeatureStats(
      FeatureNameStatistics.Type.STRUCT, common)).to.equal(
        utils.FS_FIXED_LEN_STRUCT);
  });
});

describe('updateSpec', () => {
  it('returns new spec for previously-unknown', () => {
    expect(utils.updateSpec(utils.FS_UNKNOWN, utils.FS_SCALAR_INT)).to.equal(
      utils.FS_SCALAR_INT);
  });

  it('returns invalid for previously-invalid spec', () => {
    expect(utils.updateSpec(utils.FS_NUM_VALUES, utils.FS_SCALAR_INT)).to.equal(
      utils.FS_NUM_VALUES);
  });

  it('returns previous spec when given unknown', () => {
    expect(utils.updateSpec(utils.FS_SCALAR_INT, utils.FS_UNKNOWN)).to.equal(
      utils.FS_SCALAR_INT);
  });

  it('returns unknown for type mismatch', () => {
    expect(utils.updateSpec(utils.FS_SCALAR_FLOAT, utils.FS_SCALAR_INT)).to.equal(
      utils.FS_NUM_VALUES);
  });

  it('returns greater of two type-matching specs', () => {
    expect(utils.updateSpec(utils.FS_SCALAR_INT, utils.FS_FIXED_LEN_INTS)).to.equal(
      utils.FS_FIXED_LEN_INTS);
  });
});

describe('determineChartTypeForData', () => {
  let rankBuckets: RankHistogram.Bucket[];

  beforeEach(() => {
    rankBuckets = [];
    let b = new RankHistogram.Bucket();
    b.setLowRank(0);
    b.setHighRank(0);
    b.setLabel('a');
    b.setSampleCount(10);
    rankBuckets.push(b);
    b = new RankHistogram.Bucket();
    b.setLowRank(1);
    b.setHighRank(1);
    b.setLabel('b');
    b.setSampleCount(20);
    rankBuckets.push(b);
  });

  it('returns histogram for no data', () => {
    const h = new utils.HistogramForDataset('test', null);
    expect(utils.determineChartTypeForData([h], utils.CHART_SELECTION_STANDARD,
        2)).to.equal(utils.ChartType.HISTOGRAM);
  });

  it('returns histogram for numbers', () => {
    const hist = new Histogram();
    const buckets = hist.getBucketsList();
    let b = new Histogram.Bucket();
    b.setLowValue(0);
    b.setHighValue(1);
    b.setSampleCount(10);
    buckets.push(b);
    b = new Histogram.Bucket();
    b.setLowValue(1);
    b.setHighValue(2);
    b.setSampleCount(20);
    buckets.push(b);
    const h = new utils.HistogramForDataset('test', hist);
    expect(utils.determineChartTypeForData([h], utils.CHART_SELECTION_STANDARD,
        2)).to.equal(utils.ChartType.HISTOGRAM);
  });

  it('returns bar chart for small amount of strings', () => {
    const hist = new RankHistogram();
    const buckets = hist.getBucketsList();
    buckets.push.apply(buckets, rankBuckets);
    const h = new utils.HistogramForDataset('test', hist);
    expect(utils.determineChartTypeForData([h], utils.CHART_SELECTION_STANDARD,
        2)).to.equal(utils.ChartType.BAR_CHART);
  });

  it('returns CDF for large amount of strings', () => {
    const hist = new RankHistogram();
    const buckets = hist.getBucketsList();
    buckets.push.apply(buckets, rankBuckets);
    const h = new utils.HistogramForDataset('test', hist);
    expect(utils.determineChartTypeForData([h], utils.CHART_SELECTION_STANDARD,
        1)).to.equal(utils.ChartType.CUMDIST_CHART);
  });
});

describe('getValueAndCountsArray', () => {
  let rankBuckets: RankHistogram.Bucket[];

  beforeEach(() => {
    rankBuckets = [];
    let b = new RankHistogram.Bucket();
    b.setLowRank(0);
    b.setHighRank(0);
    b.setLabel('a');
    b.setSampleCount(10);
    rankBuckets.push(b);
    b = new RankHistogram.Bucket();
    b.setLowRank(1);
    b.setHighRank(1);
    b.setLabel('b');
    b.setSampleCount(20);
    rankBuckets.push(b);
  });

  it('returns correct data for single dataset', () => {
    const b = new utils.BucketsForDataset();
    b.name = 'test';
    b.rawBuckets = rankBuckets;

    const result: utils.ValueAndCounts[] = utils.getValueAndCountsArray([b]);
    expect(result.length).to.equal(2);
    expect(result[0].value).to.equal('a');
    expect(result[0].counts.length).to.equal(1);
    expect(result[0].counts[0]).to.equal(10);
    expect(result[1].value).to.equal('b');
    expect(result[1].counts.length).to.equal(1);
    expect(result[1].counts[0]).to.equal(20);
  });

  it('returns correct data for multiple datasets with missing features', () => {
    const buckets: utils.BucketsForDataset[] = [];
    const b = new utils.BucketsForDataset();
    b.name = 'test';
    b.rawBuckets = rankBuckets;
    buckets.push(b);
    const b2 = new utils.BucketsForDataset();
    b2.name = 'test2';
    b2.rawBuckets = rankBuckets.slice(0);
    const extraBucket = new RankHistogram.Bucket();
    extraBucket.setLowRank(3);
    extraBucket.setHighRank(3);
    extraBucket.setLabel('c');
    extraBucket.setSampleCount(1);
    b2.rawBuckets.push(extraBucket);
    buckets.push(b2);

    const result: utils.ValueAndCounts[] =
        utils.getValueAndCountsArray(buckets);
    expect(result.length).to.equal(3);
    expect(result[0].value).to.equal('a');
    expect(result[0].counts.length).to.equal(2);
    expect(result[0].counts[0]).to.equal(10);
    expect(result[0].counts[1]).to.equal(10);
    expect(result[1].value).to.equal('b');
    expect(result[1].counts.length).to.equal(2);
    expect(result[1].counts[0]).to.equal(20);
    expect(result[1].counts[1]).to.equal(20);
    expect(result[2].value).to.equal('c');
    expect(result[2].counts.length).to.equal(2);
    expect(result[2].counts[0]).to.equal(0);
    expect(result[2].counts[1]).to.equal(1);
  });
});

describe('getValueAndCountsArrayWithLabels', () => {
  let rankBuckets: RankHistogram.Bucket[];

  beforeEach(() => {
    rankBuckets = [];
    let b = new RankHistogram.Bucket();
    b.setLowRank(0);
    b.setHighRank(0);
    b.setLabel('a');
    b.setSampleCount(10);
    rankBuckets.push(b);
    b = new RankHistogram.Bucket();
    b.setLowRank(1);
    b.setHighRank(1);
    b.setLabel('b');
    b.setSampleCount(20);
    rankBuckets.push(b);
  });

  it('returns correct data for single dataset', () => {
    const b = new utils.BucketsForDataset();
    b.name = 'test';
    b.rawBuckets = rankBuckets;

    const result: utils.ValueAndCounts[] =
        utils.getValueAndCountsArrayWithLabels([b], ['a', 'b']);
    expect(result.length).to.equal(2);
    expect(result[0].value).to.equal('a');
    expect(result[0].counts.length).to.equal(1);
    expect(result[0].counts[0]).to.equal(10);
    expect(result[1].value).to.equal('b');
    expect(result[1].counts.length).to.equal(1);
    expect(result[1].counts[0]).to.equal(20);
  });

  it('returns correct data for all missing labels', () => {
    const b = new utils.BucketsForDataset();
    b.name = 'test';
    b.rawBuckets = rankBuckets;

    const result: utils.ValueAndCounts[] =
        utils.getValueAndCountsArrayWithLabels([b], ['c', 'd']);
    expect(result.length).to.equal(2);
    expect(result[0].value).to.equal('c');
    expect(result[0].counts.length).to.equal(1);
    expect(result[0].counts[0]).to.equal(0);
    expect(result[1].value).to.equal('d');
    expect(result[1].counts.length).to.equal(1);
    expect(result[1].counts[0]).to.equal(0);
  });

  it('returns correct data for multiple datasets with missing labels', () => {
    const buckets: utils.BucketsForDataset[] = [];
    const b = new utils.BucketsForDataset();
    b.name = 'test';
    b.rawBuckets = rankBuckets;
    buckets.push(b);
    const b2 = new utils.BucketsForDataset();
    b2.name = 'test2';
    const extraBucket = new RankHistogram.Bucket();
    extraBucket.setLowRank(3);
    extraBucket.setHighRank(3);
    extraBucket.setLabel('c');
    extraBucket.setSampleCount(1);
    b2.rawBuckets = [extraBucket];
    buckets.push(b2);

    const result: utils.ValueAndCounts[] =
        utils.getValueAndCountsArrayWithLabels(buckets, ['a', 'b', 'c']);
    expect(result.length).to.equal(3);
    expect(result[0].value).to.equal('a');
    expect(result[0].counts.length).to.equal(2);
    expect(result[0].counts[0]).to.equal(10);
    expect(result[0].counts[1]).to.equal(0);
    expect(result[1].value).to.equal('b');
    expect(result[1].counts.length).to.equal(2);
    expect(result[1].counts[0]).to.equal(20);
    expect(result[1].counts[1]).to.equal(0);
    expect(result[2].value).to.equal('c');
    expect(result[2].counts.length).to.equal(2);
    expect(result[2].counts[0]).to.equal(0);
    expect(result[2].counts[1]).to.equal(1);
  });
});

describe('CssFormattedString constructor', () => {
  it('handles missing full string', () => {
    const s = new utils.CssFormattedString('string', 'class');
    expect(s.str).to.equal('string');
    expect(s.cssClass).to.equal('class');
    expect(s.fullStr).to.equal('string');
  });

  it('handles provided full string', () => {
    const s = new utils.CssFormattedString('string', 'class', 'full string');
    expect(s.str).to.equal('string');
    expect(s.cssClass).to.equal('class');
    expect(s.fullStr).to.equal('full string');
  });
});

describe('CssFormattedString append', () => {
  it('appends correctly', () => {
    const s = new utils.CssFormattedString('string', 'class ');
    s.append(new utils.CssFormattedString('s2', 'c2 ', 'fs2'));
    expect(s.str).to.equal('strings2');
    expect(s.cssClass).to.equal('class c2 ');
    expect(s.fullStr).to.equal('stringfs2');
  });

  it('uses connectors', () => {
    const s = new utils.CssFormattedString('string', 'class ', 'full string');
    s.append(new utils.CssFormattedString('s2', 'c2 ', 'fs2'), ': ');
    expect(s.str).to.equal('string: s2');
    expect(s.cssClass).to.equal('class c2 ');
    expect(s.fullStr).to.equal('full string: fs2');
  });
});

describe('formatFloatWithClass', () => {
  it('rounds small numbers', () => {
    const s = utils.formatFloatWithClass(14.22222);
    expect(s.str).to.equal('14.22');
    expect(s.fullStr).to.equal('14.22222');
    expect(s.cssClass).to.equal('');
  });

  it('uses SI units for large numbers', () => {
    const s = utils.formatFloatWithClass(14000000.22222);
    expect(s.str).to.equal('14.0M');
    expect(s.fullStr).to.equal('14,000,000.22222');
    expect(s.cssClass).to.equal('');
  });

  it('uses B for billions', () => {
    const s = utils.formatFloatWithClass(14000000000.22222);
    expect(s.str).to.equal('14.0B');
    expect(s.fullStr).to.equal('14,000,000,000.22222');
    expect(s.cssClass).to.equal('');
  });

  it('uses the right class for weighted numbers', () => {
    const s = utils.formatFloatWithClass(14.22222, true);
    expect(s.str).to.equal('14.22');
    expect(s.fullStr).to.equal('14.22222');
    expect(s.cssClass).to.equal('data-weighted ');
  });

  it('uses the right class in error cases', () => {
    const s = utils.formatFloatWithClass(14.22222, false, (num) => true);
    expect(s.str).to.equal('14.22');
    expect(s.fullStr).to.equal('14.22222');
    expect(s.cssClass).to.equal('data-error ');
  });

  it('uses the right class in non-error cases', () => {
    const s = utils.formatFloatWithClass(14.22222, false, (num) => false);
    expect(s.str).to.equal('14.22');
    expect(s.fullStr).to.equal('14.22222');
    expect(s.cssClass).to.equal('');
  });

  it('uses the right classes in weighted error cases', () => {
    const s = utils.formatFloatWithClass(14.22222, true, (num) => true);
    expect(s.str).to.equal('14.22');
    expect(s.fullStr).to.equal('14.22222');
    expect(s.cssClass).to.equal('data-weighted data-error ');
  });

  it('uses the right classes in non-finite case', () => {
    const s = utils.formatFloatWithClass(Infinity);
    expect(s.str).to.equal('\u221e');
    expect(s.fullStr).to.equal('\u221e');
    expect(s.cssClass).to.equal('data-error ');
  });
});

describe('formatIntWithClass', () => {
  it('handles small numbers', () => {
    const s = utils.formatIntWithClass(9500);
    expect(s.str).to.equal('9,500');
    expect(s.fullStr).to.equal('9,500');
    expect(s.cssClass).to.equal('');
  });

  it('handles negative numbers', () => {
    const s = utils.formatIntWithClass(-9500);
    expect(s.str).to.equal('-9,500');
    expect(s.fullStr).to.equal('-9,500');
    expect(s.cssClass).to.equal('');
  });

  it('uses SI units for large numbers', () => {
    const s = utils.formatIntWithClass(14000000);
    expect(s.str).to.equal('14.0M');
    expect(s.fullStr).to.equal('14,000,000');
    expect(s.cssClass).to.equal('');
  });
});

describe('formatStringWithClass', () => {
  it('handles strings', () => {
    const s = utils.formatStringWithClass('hi');
    expect(s.str).to.equal('hi');
    expect(s.fullStr).to.equal('hi');
    expect(s.cssClass).to.equal('');
  });

  it('quotes numbers', () => {
    const s = utils.formatStringWithClass('-9500');
    expect(s.str).to.equal('"-9500"');
    expect(s.fullStr).to.equal('"-9500"');
    expect(s.cssClass).to.equal('');
  });
});

describe('formatPercentageWithClass', () => {
  it('handles nearly 0%', () => {
    const s = utils.formatPercentageWithClass(1, 10000000);
    expect(s.str).to.equal('~0%');
    expect(s.fullStr.substr(0, 4)).to.equal('0.00');
    expect(s.cssClass).to.equal('');
  });

  it('handles nearly 100%', () => {
    const s = utils.formatPercentageWithClass(99999999, 100000000);
    expect(s.str).to.equal('~100%');
    expect(s.fullStr.substr(0, 4)).to.equal('99.9');
    expect(s.cssClass).to.equal('');
  });

  it('handles exact percentages', () => {
    const s = utils.formatPercentageWithClass(20, 40);
    expect(s.str).to.equal('50%');
    expect(s.fullStr).to.equal('50%');
    expect(s.cssClass).to.equal('');
  });

  it('rounds percentages', () => {
    const s = utils.formatPercentageWithClass(7, 41);
    expect(s.str).to.equal('17.07%');
    expect(s.fullStr.substr(0, 6)).to.equal('17.073');
    expect(s.cssClass).to.equal('');
  });
});

describe('getLegendEntries', () => {
  it('handles numeric features', () => {
    const entries = utils.getLegendEntries(true, false, false);
    expect(entries.length).to.equal(8);
    expect(entries[0].cssClass).to.equal('');
    expect(entries[3].cssClass).to.equal('');
  });

  it('handles string features', () => {
    const entries = utils.getLegendEntries(false, false, false);
    expect(entries.length).to.equal(6);
    expect(entries[0].cssClass).to.equal('');
    expect(entries[3].cssClass).to.equal('');
  });

  it('handles custom stats', () => {
    const entries = utils.getLegendEntries(true, false, true);
    expect(entries.length).to.equal(9);
    expect(entries[0].cssClass).to.equal('');
    expect(entries[8].cssClass).to.equal('data-custom ');
  });

  it('handles weighted stats', () => {
    const entries = utils.getLegendEntries(true, true, false);
    expect(entries.length).to.equal(8);
    expect(entries[0].cssClass).to.equal('');
    expect(entries[3].cssClass).to.equal('data-weighted ');
  });
});

describe('getStatsEntries', () => {
  it('handles numeric features', () => {
    const f = new FeatureNameStatistics();
    const n = new NumericStatistics();
    f.setType(FeatureNameStatistics.Type.INT);
    f.setNumStats(n);
    n.setMin(0);
    n.setMax(10);
    n.setStdDev(1);
    n.setMean(5);
    n.setMedian(5);
    n.setNumZeros(1);
    const c = new CommonStatistics();
    n.setCommonStats(c);
    c.setNumMissing(3);
    c.setNumNonMissing(17);
    c.setAvgNumValues(1);
    const entries = utils.getStatsEntries(f, false, false);
    expect(entries.length).to.equal(8);
    expect(entries[0].str).to.equal('17');
    expect(entries[1].str).to.equal('15%');
    expect(entries[2].str).to.equal('5');
  });

  it('handles string features', () => {
    const f = new FeatureNameStatistics();
    const s = new StringStatistics();
    f.setType(FeatureNameStatistics.Type.STRING);
    f.setStringStats(s);
    s.setUnique(5);
    s.setAvgLength(10.1);
    const fv = new StringStatistics.FreqAndValue();
    fv.setFrequency(2);
    fv.setValue('hi');
    s.setTopValuesList([fv]);
    const c = new CommonStatistics();
    s.setCommonStats(c);
    c.setNumMissing(3);
    c.setNumNonMissing(17);
    c.setAvgNumValues(1);
    const entries = utils.getStatsEntries(f, false, false);
    expect(entries.length).to.equal(6);
    expect(entries[0].str).to.equal('17');
    expect(entries[1].str).to.equal('15%');
    expect(entries[2].str).to.equal('5');
    expect(entries[3].str).to.equal('hi');
    expect(entries[4].str).to.equal('2');
  });

  it('handles string features with no top values', () => {
    const f = new FeatureNameStatistics();
    const s = new StringStatistics();
    f.setType(FeatureNameStatistics.Type.STRING);
    f.setStringStats(s);
    s.setUnique(5);
    s.setAvgLength(10.1);
    const c = new CommonStatistics();
    s.setCommonStats(c);
    c.setNumMissing(3);
    c.setNumNonMissing(17);
    c.setAvgNumValues(1);
    const entries = utils.getStatsEntries(f, false, false);
    expect(entries.length).to.equal(6);
    expect(entries[3].str).to.equal('-');
    expect(entries[4].str).to.equal('-');
  });

  it('handles custom stats', () => {
    const f = new FeatureNameStatistics();
    f.setType(FeatureNameStatistics.Type.INT);
    f.setNumStats(new NumericStatistics());
    const custom = new CustomStatistic();
    custom.setName('cust');
    custom.setStr('hi');
    f.setCustomStatsList([custom]);
    const entries = utils.getStatsEntries(f, false, true);
    expect(entries.length).to.equal(9);
    expect(entries[8].str).to.equal('cust: hi');
    expect(entries[8].cssClass).to.equal('data-custom ');
  });

  it('handles missing custom stats', () => {
    const f = new FeatureNameStatistics();
    f.setType(FeatureNameStatistics.Type.INT);
    f.setNumStats(new NumericStatistics());
    const entries = utils.getStatsEntries(f, false, true);
    expect(entries.length).to.equal(9);
    expect(entries[8].str).to.equal('-');
    expect(entries[8].cssClass).to.equal('data-custom ');
  });

  it('handles custom stats with no value set', () => {
    const f = new FeatureNameStatistics();
    f.setType(FeatureNameStatistics.Type.INT);
    f.setNumStats(new NumericStatistics());
    const custom = new CustomStatistic();
    custom.setName('cust');
    f.setCustomStatsList([custom]);
    const entries = utils.getStatsEntries(f, false, true);
    expect(entries.length).to.equal(9);
    expect(entries[8].str).to.equal('cust: 0');
    expect(entries[8].cssClass).to.equal('data-custom ');
  });

  it('handles weighted stats', () => {
    const f = new FeatureNameStatistics();
    const n = new NumericStatistics();
    f.setType(FeatureNameStatistics.Type.INT);
    f.setNumStats(n);
    n.setMin(0);
    n.setMax(10);
    n.setStdDev(1);
    n.setMean(5);
    n.setMedian(5);
    n.setNumZeros(1);
    const wn = new WeightedNumericStatistics();
    wn.setMean(0.1);
    n.setWeightedNumericStats(wn);
    const c = new CommonStatistics();
    n.setCommonStats(c);
    c.setNumMissing(3);
    c.setNumNonMissing(10);
    const entries = utils.getStatsEntries(f, true, false);
    expect(entries.length).to.equal(8);
    expect(entries[0].cssClass).to.equal('');
    expect(entries[3].cssClass).to.equal('data-weighted ');
  });

  it('handles missing stats', () => {
    const f = new FeatureNameStatistics();
    f.setType(FeatureNameStatistics.Type.STRING);
    const entries = utils.getStatsEntries(f, false, false);
    expect(entries.length).to.equal(6);
    expect(entries[0].str).to.equal('0');
    expect(entries[1].str).to.equal('100%');
    for (let i = 2; i < 6; i++) {
      expect(entries[i].str).to.equal('-');
    }
  });
});

describe('convertToPercentage', () => {
  it('correctly converts histogram buckets', () => {
    const buckets1: Histogram.Bucket[] = [];
    let bucket = new Histogram.Bucket();
    bucket.setLowValue(0);
    bucket.setHighValue(10);
    bucket.setSampleCount(5);
    buckets1.push(bucket);
    bucket = new Histogram.Bucket();
    bucket.setLowValue(10);
    bucket.setHighValue(20);
    bucket.setSampleCount(15);
    buckets1.push(bucket);

    const buckets2: Histogram.Bucket[] = [];
    bucket = new Histogram.Bucket();
    bucket.setLowValue(0);
    bucket.setHighValue(1);
    bucket.setSampleCount(9);
    buckets2.push(bucket);
    bucket = new Histogram.Bucket();
    bucket.setLowValue(1);
    bucket.setHighValue(2);
    bucket.setSampleCount(1);
    buckets2.push(bucket);
    bucket = new Histogram.Bucket();
    bucket.setLowValue(2);
    bucket.setHighValue(3);
    bucket.setSampleCount(0);
    buckets2.push(bucket);

    const results = utils.convertToPercentage([buckets1, buckets2]);
    expect(results.length).to.equal(2);
    expect(results[0].length).to.equal(2);
    expect(results[1].length).to.equal(3);
    expect((results[0][0] as Histogram.Bucket).getLowValue()).to.equal(0);
    expect((results[0][0] as Histogram.Bucket).getHighValue()).to.equal(10);
    expect((results[0][0] as Histogram.Bucket).getSampleCount()).to.equal(.25);
    expect((results[0][1] as Histogram.Bucket).getLowValue()).to.equal(10);
    expect((results[0][1] as Histogram.Bucket).getHighValue()).to.equal(20);
    expect((results[0][1] as Histogram.Bucket).getSampleCount()).to.equal(.75);
    expect((results[1][0] as Histogram.Bucket).getLowValue()).to.equal(0);
    expect((results[1][0] as Histogram.Bucket).getSampleCount()).to.equal(.9);
    expect((results[1][1] as Histogram.Bucket).getLowValue()).to.equal(1);
    expect((results[1][1] as Histogram.Bucket).getSampleCount()).to.equal(.1);
    expect((results[1][2] as Histogram.Bucket).getLowValue()).to.equal(2);
    expect((results[1][2] as Histogram.Bucket).getSampleCount()).to.equal(0);
  });

  it('correctly converts rank histogram buckets', () => {
    const buckets: RankHistogram.Bucket[] = [];
    let bucket = new RankHistogram.Bucket();
    bucket.setLowRank(0);
    bucket.setHighRank(1);
    bucket.setSampleCount(5);
    bucket.setLabel('a');
    buckets.push(bucket);
    bucket = new RankHistogram.Bucket();
    bucket.setLowRank(1);
    bucket.setHighRank(2);
    bucket.setLabel('b');
    bucket.setSampleCount(15);
    buckets.push(bucket);

    const results = utils.convertToPercentage([buckets]);
    expect(results.length).to.equal(1);
    expect(results[0].length).to.equal(2);
    expect((results[0][0] as RankHistogram.Bucket).getLowRank()).to.equal(0);
    expect((results[0][0] as RankHistogram.Bucket).getHighRank()).to.equal(1);
    expect((results[0][0] as RankHistogram.Bucket).getSampleCount()).to.equal(.25);
    expect((results[0][0] as RankHistogram.Bucket).getLabel()).to.equal('a');
    expect((results[0][1] as RankHistogram.Bucket).getLowRank()).to.equal(1);
    expect((results[0][1] as RankHistogram.Bucket).getHighRank()).to.equal(2);
    expect((results[0][1] as RankHistogram.Bucket).getSampleCount()).to.equal(.75);
    expect((results[0][1] as RankHistogram.Bucket).getLabel()).to.equal('b');
  });
});

describe('chartSelectionHasQuantiles', () => {
  it('correctly calculates answer', () => {
    expect(utils.chartSelectionHasQuantiles('data-custom')).to.be.false;
    expect(utils.chartSelectionHasQuantiles('')).to.be.false;
    expect(utils.chartSelectionHasQuantiles(utils.CHART_SELECTION_STANDARD))
        .to.be.false;
    expect(utils.chartSelectionHasQuantiles(utils.CHART_SELECTION_QUANTILES))
        .to.be.true;
    expect(
        utils.chartSelectionHasQuantiles(utils.CHART_SELECTION_LIST_QUANTILES))
        .to.be.true;
    expect(utils.chartSelectionHasQuantiles(
               utils.CHART_SELECTION_FEATURE_LIST_LENGTH_QUANTILES))
        .to.be.true;
  });
});
