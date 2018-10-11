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
import DatasetFeatureStatisticsList from 'goog:proto.featureStatistics.DatasetFeatureStatisticsList';
import FeatureNameStatistics from 'goog:proto.featureStatistics.FeatureNameStatistics';
import Histogram from 'goog:proto.featureStatistics.Histogram';
import NumericStatistics from 'goog:proto.featureStatistics.NumericStatistics';
import RankHistogram from 'goog:proto.featureStatistics.RankHistogram';
import StringStatistics from 'goog:proto.featureStatistics.StringStatistics';

export type GenericHistogram = Histogram|RankHistogram;
export type GenericHistogramBucket = Histogram.Bucket|RankHistogram.Bucket;

/**
 * Used for storing data that backs quantile charts.
 */
export class QuantileInfo {
  bucket: Histogram.Bucket;
  quantile: number;
  datasetIndex: number;
}

/**
 * Used for provided histogram data per dataset to facets-overview-chart.
 */
export class HistogramForDataset {
  name: string;
  histMap: {[htype: string]: GenericHistogram};

  constructor(
      name: string, hist?: GenericHistogram|null,
      weightedHist?: GenericHistogram|null, quantiles?: GenericHistogram|null,
      weightedQuantiles?: GenericHistogram|null,
      listQuantiles?: GenericHistogram|null,
      featureListLengthQuantiles?: GenericHistogram|null,
      namedHists?: {[name: string]: GenericHistogram}) {
    this.histMap = {};
    this.name = name;
    if (hist) {
      this.histMap[getHistKey(false, CHART_SELECTION_STANDARD)] = hist;
    }
    if (weightedHist) {
      this.histMap[getHistKey(true, CHART_SELECTION_STANDARD)] = weightedHist;
    }
    if (quantiles) {
      this.histMap[getHistKey(false, CHART_SELECTION_QUANTILES)] = quantiles;
    }
    if (weightedQuantiles) {
      this.histMap[getHistKey(true, CHART_SELECTION_QUANTILES)] =
          weightedQuantiles;
    }
    if (listQuantiles) {
      this.histMap[getHistKey(false, CHART_SELECTION_LIST_QUANTILES)] =
          listQuantiles;
    }
    if (featureListLengthQuantiles) {
      this.histMap[getHistKey(
          false, CHART_SELECTION_FEATURE_LIST_LENGTH_QUANTILES)] =
          featureListLengthQuantiles;
    }
    if (namedHists) {
      Object.keys(namedHists)
          .forEach(name => this.histMap[name] = namedHists[name]);
    }
  }
}

/**
 * Represents a selection of a subset of a feature's values. If the feature is
 * string-based then the selection is determined by matching the stringValue.
 * If the feature is numeric then the selection is determined by being contained
 * in the bounds determined by the high and low values.
 */
export class FeatureSelection {
  constructor(
      public name?: string, public stringValue?: string,
      public lowNumValue?: number, public highNumValue?: number) {}

  /** Clears a selection. */
  clear() {
    this.name = undefined;
    this.stringValue = undefined;
    this.lowNumValue = undefined;
    this.highNumValue = undefined;
  }

  equals(rhs: FeatureSelection): boolean {
    if (!rhs) {
      return false;
    }
    return this.name === rhs.name && this.stringValue === rhs.stringValue &&
        this.lowNumValue === rhs.lowNumValue &&
        this.highNumValue === rhs.highNumValue;
  }
}

export class FeatureSelectionArrayEntry {
  name: string;
  value: FeatureSelection;
}

export type FeatureSelectionMap = {
  [name: string]: FeatureSelection
};

/**
 * Returns normalized entropy of a set of histogram buckets and their counts.
 */
export function getNormalizedEntropy(buckets: GenericHistogramBucket[]):
    number {
  const sum = getTotalCount(buckets);
  if (sum === 0) {
    return 0;
  }
  const entropy = buckets.reduce((p: number, c: GenericHistogramBucket) => {
    const count = +c.getSampleCount() || 0;
    if (count === 0) {
      return p;
    }
    const weightedCount = count / sum;
    return p - (weightedCount * Math.log(weightedCount));
  }, 0);
  if (entropy === 0) {
    return 0;
  }
  return entropy / Math.log(buckets.length);
}

/**
 * Returns the provided number rounded to the provided number of decimal places.
 */
export function roundToPlaces(num: number, numPlaces: number): number {
  // Do not round infinite numbers or numbers already in scientific notation.
  if (!isFinite(num) || (num.toString().indexOf('e') !== -1)) {
    return num;
  }
  return +(Math.round(Number(num + 'e+' + numPlaces)) + 'e-' + numPlaces);
}

/**
 * Returns the histogram buckets from a provided histogram object, or an empty
 * array if there are none.
 */
export function getBuckets(
    data: HistogramForDataset, weighted?: boolean,
    chartType?: string): GenericHistogramBucket[] {
  const key = getHistKey(weighted, chartType);
  const hist = data.histMap[key];
  return hist ? hist.getBucketsList() : [];
}

/**
 * Returns a histogram chart selection key for a given chart type based on if
 * the weighted or non-weighted version is desired.
 *
 * If the chartType is unspecified, it defaults to the standard chart.
 */
function getHistKey(weighted?: boolean, chartType?: string): string {
  let key = chartType == null ? CHART_SELECTION_STANDARD : chartType;
  if (weighted) {
    key = 'weighted' + key;
  }
  return key;
}

/**
 * Returns the total count across all buckets.
 */
function getTotalCount(buckets: GenericHistogramBucket[]): number {
  return buckets
      .map((bucket: GenericHistogramBucket) => bucket.getSampleCount()!)
      .reduce((p: number, c: number) => (+c || 0) + p, 0);
}

/**
 * Returns an array of the total number of objects in each provided histogram.
 */
export function getTotalCounts(
    histograms: HistogramForDataset[], weighted: boolean): number[] {
  return histograms.map((d: HistogramForDataset) => {
    return getTotalCount(getBuckets(d, weighted));
  });
}

/**
 * Returns all labels across all provided histograms.
 */
export function getAllLabels(datasetBuckets: GenericHistogramBucket[][]):
    string[] {
  const allLabels: string[] = [];
  datasetBuckets.forEach(buckets => {
    buckets.forEach((e: GenericHistogramBucket) => {
      const rankBucket = e as RankHistogram.Bucket;
      const label = getPrintableLabel(rankBucket.getLabel());
      if (allLabels.indexOf(label) === -1) {
        allLabels.push(label);
      }
    });
  });
  return allLabels;
}

/**
 * Returns the printable version of a label. If undefined, then returns a
 * non-breakable space in order to preserve correct layout.
 */
export function getPrintableLabel(label: string|null|undefined): string {
  if (label == null || label === '') {
    return '\u00a0';
  }
  return label;
}

/**
 * Returns a new string with quotes around the provided string if it contains
 * only a number.
 */
export function quoteIfNumber(label: string): string {
  return label.length === 0 || isNaN(+label) ? label : '"' + label + '"';
}

/**
 * Returns a useable version of a number extracted from a proto field. If the
 * field is undefined, the returned number is 0. If the field is a string that
 * means infinity, the returned number is Infinity.
 */
export function getNumberFromField(value: number|string|null|
                                   undefined): number {
  if (value == null) {
    return 0;
  } else if (value === 'inf') {
    return Infinity;
  } else if (value === '-inf') {
    return -Infinity;
  }
  return +value;
}

/**
 * Returns the ratio of values that are missing or zero from a feature.
 */
export function getRatioMissingAndZero(stats: FeatureNameStatistics|
                                       null): number {
  let num = 0;
  let total = 0;
  const commonstats = getCommonStats(stats);
  if (stats && stats.getNumStats()) {
    const numstats = stats.getNumStats()!;
    num += getNumberFromField(numstats.getNumZeros());
  }

  // Get all common stats, which appear first in the stats list.
  if (commonstats) {
    const numMissing = getNumberFromField(commonstats.getNumMissing());
    num += numMissing;
    total = getNumberFromField(commonstats.getNumNonMissing()) + numMissing;
  }
  if (total === 0) {
    return 1;
  }
  return num / total;
}

/**
 * Returns a distance metric for the provided histograms. The more difference
 * in the distribution between the first histogram and any other histogram, the
 * larger the number that is returned. This is used to provide a sort order by
 * which features have the largest skew between their distributions across the
 * multiple datasets.
 *
 * The metric used is the chi-squared test for shape. See
 * http://www.hep.caltech.edu/~fcp/statistics/hypothesisTest/PoissonConsistency/PoissonConsistency.pdf
 * section 3.3.1 for the equation that this function calculates.
 *
 * Imagine the following histograms:
 *   - Histogram 1, with 30 total values:
 *     - For range of values 0-5, the count is 10 (ratio to total: 1/3)
 *     - For the range of values 5-10, the count is 20 (ratio to total: 2/3)
 *   - Histogram 2, with 300 total values:
 *     - For range of values 0-5, the count is 90 (ratio to total: 3/10)
 *     - For the range of values 5-10, the count is 210 (ratio to total: 7/10)
 * This algorithm will calculate a distance metric between the shapes of the
 * two histograms. To compare the shapes as opposed to the raw counts, for each
 * bucket the ratio of the count to the total is what the calculation is based
 * on. The algorithm calculates a difference metric bucket by bucket and sums
 * them up for a total distance metric.
 *
 * The algorithm works the same for rank histograms (where each count is
 * associated with a label instead of a range of values). But in this case, the
 * corresponding bucket in one dataset to a bucket in another dataset may not
 * be in the same position in its bucket list, so the bucket with the same label
 * must be searched for.
 */
export function getHistogramDistance(histograms: HistogramForDataset[]):
    number {
  const chartBuckets = histograms.map(d => getBuckets(d, false));
  let bucket: GenericHistogramBucket|null = null;
  for (let i = 0; i < chartBuckets.length; i++) {
    if (chartBuckets[i].length > 0) {
      bucket = chartBuckets[i][0]!;
      break;
    }
  }
  // If for some reason all histograms are empty, then return a distance of 0.
  if (!bucket) {
    return 0;
  }

  // If at least one of the histograms is empty (but not all of them, that was
  // checked above), return the maximum distance. This happens when a dataset
  // is completely missing a feature contained in other datasets it is being
  // compared to.
  const totals = getTotalCounts(histograms, false);
  for (let i = 0; i < totals.length; i++) {
    if (totals[i] === 0) {
      return Infinity;
    }
  }

  let maxDistance = 0;
  // If the histogram describes a discrete feature (it is a rank histogram),
  // then compare each bucket in a histogram against the buckets in the other
  // histograms with the same label.
  if (bucket instanceof RankHistogram.Bucket) {
    const allLabels = getAllLabels(chartBuckets);
    for (let i = 1; i < histograms.length; i++) {
      const buckets1 = chartBuckets[0];
      const buckets2 = chartBuckets[i];
      let distance = 0;
      // Loop over all labels, summing up the chi-squared distance.
      for (let j = 0; j < allLabels.length; j++) {
        const label = allLabels[j];
        let count1 = 0;
        let count2 = 0;
        // Find the bucket in the rank histogram for the current label in order
        // to get the count in that label's bucket, or consider the count 0 if
        // there is no bucket for that label in the histogram.
        for (let k = 0; k < buckets1.length; k++) {
          if ((buckets1[k] as RankHistogram.Bucket).getLabel() === label) {
            count1 = buckets1[k].getSampleCount() ?
                buckets1[k].getSampleCount()! :
                0;
            break;
          }
        }
        for (let k = 0; k < buckets2.length; k++) {
          if ((buckets2[k] as RankHistogram.Bucket).getLabel() === label) {
            count2 = buckets2[k].getSampleCount() ?
                buckets2[k].getSampleCount()! :
                0;
            break;
          }
        }
        distance = stepOfChiSquaredForShape(
            distance, count1, totals[0], count2, totals[i]);
      }
      maxDistance = Math.max(maxDistance, distance);
    }
    // If the histogram describes a continuous feature, then compare each bucket
    // in a histogram against the same-indexed bucket in the other histograms.
  } else {
    for (let i = 1; i < histograms.length; i++) {
      const buckets1 = chartBuckets[0];
      const buckets2 = chartBuckets[i];
      let distance = 0;
      // Loop over all buckets, summing up the chi-squared distance.
      const maxBucketLength = Math.max(buckets1.length, buckets2.length);
      for (let j = 0; j < maxBucketLength; j++) {
        const count1 = j < buckets1.length && buckets1[j].getSampleCount() ?
            buckets1[j].getSampleCount()! :
            0;
        const count2 = j < buckets2.length && buckets2[j].getSampleCount() ?
            buckets2[j].getSampleCount()! :
            0;
        distance = stepOfChiSquaredForShape(
            distance, count1, totals[0], count2, totals[i]);
      }
      maxDistance = Math.max(maxDistance, distance);
    }
  }
  // Return the maximum distance between the first dataset's histogram and any
  // other dataset's histogram.
  return maxDistance;
}

/**
 * Run one step of the chi-squared test for shape, returning the updated
 * distance.
 */
function stepOfChiSquaredForShape(
    calculatedDistance: number, currentU: number, totalU: number,
    currentV: number, totalV: number): number {
  const countRatioDiff = currentU / totalU - currentV / totalV;
  const denom = currentU / (totalU * totalU) + currentV / (totalV * totalV);
  const newDistanceTerm =
      !denom ? 0 : (countRatioDiff * countRatioDiff) / denom;
  return calculatedDistance + newDistanceTerm;
}

/**
 * Return the total number of visible and filtered elements.
 * If the values are the same, display only one.
 * e.g. (3, 4) => "3/4", but (3, 3) => "3"
 */
export function filteredElementCountString(
    filtered: number, total: number): string {
  if (total === filtered) {
    return total.toLocaleString();
  }
  return filtered.toLocaleString() + '/' + total.toLocaleString();
}

/**
 * Returns a string describing the Type enum of the FeatureNameStatistics
 * proto
 */
export function stringFromFeatureType(type: FeatureNameStatistics.Type):
    string {
  switch (type) {
    case FeatureNameStatistics.Type.INT:
      return 'int';
    case FeatureNameStatistics.Type.STRING:
      return 'string';
    case FeatureNameStatistics.Type.FLOAT:
      return 'float';
    case FeatureNameStatistics.Type.BYTES:
      return 'binary';
    case FeatureNameStatistics.Type.STRUCT:
      return 'struct';
    default:
      return 'unknown';
  }
}

/** Returns if a feature contains numeric statistics. */
export function containsNumericStats(feature: FeatureNameStatistics) {
  return feature.getNumStats() != null;
}

/** Returns if a feature type is numeric. */
export function isFeatureTypeNumeric(type: FeatureNameStatistics.Type) {
  return type === FeatureNameStatistics.Type.INT ||
      type === FeatureNameStatistics.Type.FLOAT;
}

/**
 * Cleans the provided DatasetFeatureStatisticsList proto by copying all
 * deprecated fields to their non-deprecated version if the deprecated field
 * is set and the non-deprecated field is not set and performing other clean-up
 * operations. This method alters the proto in place and also returns it as a
 * convinience.
 */
export function cleanProto(datasets: DatasetFeatureStatisticsList):
    DatasetFeatureStatisticsList {
  // For all deprecated fields in the feature statistics proto, if that
  // field is set and its non-deprecated version is not set, then copy the
  // deprecated field into the non-deprecated field.
  datasets.getDatasetsList().forEach(dataset => {
    dataset.getFeaturesList().forEach(feature => {
      // If the feature's path step list is set, then use this path to create
      // the feature's name, separated by forward slashes.
      const path = feature.getPath();
      if (path != null) {
        const steps = path.getStepList();
        if (steps != null) {
          feature.setName(steps.join('/'));
        }
      }

      let hists: GenericHistogram[] = [];
      if (feature.getStringStats()) {
        const h = feature.getStringStats()!.getRankHistogram();
        if (h) {
          hists.push(h);
        }
        const topValuesList = feature.getStringStats()!.getTopValuesList();
        if (topValuesList) {
          topValuesList.forEach(topVal => {
            const deprecatedFreq = topVal.getDeprecatedFreq();
            if (deprecatedFreq && !topVal.getFrequency()) {
              topVal.setFrequency(deprecatedFreq);
            }
          });
        }
      } else if (feature.getNumStats()) {
        const newHists = feature.getNumStats()!.getHistogramsList();
        if (newHists) {
          hists = hists.concat(newHists);
        }
      }
      hists.forEach(h => {
        const buckets: Histogram.Bucket[] =
            h.getBucketsList()! as Histogram.Bucket[];
        if (buckets) {
          buckets.forEach((b: GenericHistogramBucket) => {
            const deprecatedCount = b.getDeprecatedCount();
            if (deprecatedCount && !b.getSampleCount()) {
              b.setSampleCount(deprecatedCount);
            }
          });
        }
      });
    });
  });
  return datasets;
}

/**
 * Returns if the provided DatasetFeatureStatisticsList is clean, meaning that
 * there is no deprecated field that has data in it while the corresponding
 * non-deprecated field does not have data in it.
 */
export function isProtoClean(datasets: DatasetFeatureStatisticsList): boolean {
  // For all deprecated fields in the feature statistics proto, if that
  // field is set and its non-deprecated version is not set, then return false.
  let ret = true;
  datasets.getDatasetsList().forEach(dataset => {
    dataset.getFeaturesList().forEach(feature => {
      let hists: GenericHistogram[] = [];
      if (feature.getStringStats()) {
        const h = feature.getStringStats()!.getRankHistogram();
        if (h) {
          hists.push(h);
        }
        const topValuesList = feature.getStringStats()!.getTopValuesList();
        if (topValuesList) {
          topValuesList.forEach(topVal => {
            if (topVal.getDeprecatedFreq() && !topVal.getFrequency()) {
              ret = false;
            }
          });
        }
      } else if (feature.getNumStats()) {
        const newHists = feature.getNumStats()!.getHistogramsList();
        if (newHists) {
          hists = hists.concat(newHists);
        }
      }
      hists.forEach(h => {
        const buckets: Histogram.Bucket[] =
            h.getBucketsList()! as Histogram.Bucket[];
        if (buckets) {
          buckets.forEach((b: GenericHistogramBucket) => {
            if (b.getDeprecatedCount() && !b.getSampleCount()) {
              ret = false;
            }
          });
        }
      });
    });
  });
  return ret;
}

/**
 * Returns if the provided DatasetFeatureStatisticsList contains weighted
 * statistics in addition to the standard statistics.
 */
export function containsWeightedStats(datasets: DatasetFeatureStatisticsList):
    boolean {
  for (let i = 0; i < datasets.getDatasetsList().length; i++) {
    const dataset = datasets.getDatasetsList()[i];
    for (let j = 0; j < dataset.getFeaturesList().length; j++) {
      const feature = dataset.getFeaturesList()[j];
      if (feature.getStringStats()) {
        if (feature.getStringStats()!.getWeightedStringStats()) {
          return true;
        }
      } else if (feature.getNumStats()) {
        if (feature.getNumStats()!.getWeightedNumericStats()) {
          return true;
        }
      }
    }
  }
  return false;
}

/**
 * Returns if the provided DatasetFeatureStatisticsList contains custom
 * statistics in addition to the standard statistics.
 */
export function containsCustomStats(datasets: DatasetFeatureStatisticsList):
    boolean {
  for (let i = 0; i < datasets.getDatasetsList().length; i++) {
    const dataset = datasets.getDatasetsList()[i];
    for (let j = 0; j < dataset.getFeaturesList().length; j++) {
      const feature = dataset.getFeaturesList()[j];
      const customStats = feature.getCustomStatsList()!;
      if (customStats != null && customStats.length > 0) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Returns if the provided DatasetFeatureStatisticsList contains feature list
 * length information.
 */
export function containsFeatureListLengthData(
    datasets: DatasetFeatureStatisticsList): boolean {
  for (let i = 0; i < datasets.getDatasetsList().length; i++) {
    const dataset = datasets.getDatasetsList()[i];
    for (let j = 0; j < dataset.getFeaturesList().length; j++) {
      const feature = dataset.getFeaturesList()[j];
      const commonStats = getCommonStats(feature);
      if (commonStats && commonStats.getFeatureListLengthHistogram()) {
        return true;
      }
    }
  }
  return false;
}

/** Returns whether there are any weighted histograms in the provided data. */
export function hasWeightedHistogram(hists: HistogramForDataset[]): boolean {
  if (!hists) {
    return false;
  }
  for (let i = 0; i < hists.length; i++) {
    if (hists[i].histMap[getHistKey(true, CHART_SELECTION_STANDARD)]) {
      return true;
    }
  }
  return false;
}

/** Returns whether there are any quantiles in the provided data. */
export function hasQuantiles(hists: HistogramForDataset[]): boolean {
  if (!hists) {
    return false;
  }
  for (let i = 0; i < hists.length; i++) {
    if (hists[i].histMap[CHART_SELECTION_QUANTILES]) {
      return true;
    }
  }
  return false;
}

/** Returns whether there are any list quantiles in the provided data. */
export function hasListQuantiles(hists: HistogramForDataset[]): boolean {
  if (!hists) {
    return false;
  }
  for (let i = 0; i < hists.length; i++) {
    if (hists[i].histMap[CHART_SELECTION_LIST_QUANTILES]) {
      return true;
    }
  }
  return false;
}

/**
 * Returns the total number of values of the feature represented by the
 * provided statistics.
 */
export function getTotalNumberOfValues(stats: CommonStatistics|null): number {
  if (!stats) {
    return 0;
  }
  return stats.getNumNonMissing() * stats.getAvgNumValues();
}

/**
 * Represents the specification of a feature in a data model. Scalar specs
 * represent features with at-most one value per example. Fixed-length specs
 * represent non-scalar features with a fixed number of values per example,
 * when not missing from the example. Variable-length specs represent features
 * that are not scalar or fixed-length. Unknown represents features that have
 * no values in provided examples or have data-type mismatches between datasets.
 * The final sentinal value is used to simplify looping over all specs.
 *
 * The specs are ordered so that within each feature type, more-permissive specs
 * have higher numbers. This simplifies determining/updating specs across
 * multiple datasets.
 */
export type FeatureSpec = number;
export const FS_SCALAR_INT = 0;
export const FS_FIXED_LEN_INTS = 1;
export const FS_VAR_LEN_INTS = 2;
export const FS_SCALAR_FLOAT = 3;
export const FS_FIXED_LEN_FLOATS = 4;
export const FS_VAR_LEN_FLOATS = 5;
export const FS_SCALAR_STR = 6;
export const FS_FIXED_LEN_STRS = 7;
export const FS_VAR_LEN_STRS = 8;
export const FS_SCALAR_BYTES = 9;
export const FS_FIXED_LEN_BYTES = 10;
export const FS_VAR_LEN_BYTES = 11;
export const FS_SCALAR_STRUCT = 12;
export const FS_FIXED_LEN_STRUCT = 13;
export const FS_VAR_LEN_STRUCT = 14;
export const FS_UNKNOWN = 15;
export const FS_NUM_VALUES = 16;

/**
 * Converts a feature spec to a string, for display.
 */
export function featureSpecToString(spec: number) {
  switch (spec) {
    case FS_SCALAR_INT:
      return 'int';
    case FS_FIXED_LEN_INTS:
      return 'fixed-length ints';
    case FS_VAR_LEN_INTS:
      return 'variable-length ints';
    case FS_SCALAR_FLOAT:
      return 'float';
    case FS_FIXED_LEN_FLOATS:
      return 'fixed-length floats';
    case FS_VAR_LEN_FLOATS:
      return 'variable-length floats';
    case FS_SCALAR_STR:
      return 'string';
    case FS_FIXED_LEN_STRS:
      return 'fixed-length strings';
    case FS_VAR_LEN_STRS:
      return 'variable-length strings';
    case FS_SCALAR_BYTES:
      return 'bytes';
    case FS_FIXED_LEN_BYTES:
      return 'fixed-length bytes';
    case FS_VAR_LEN_BYTES:
      return 'variable-length bytes';
    case FS_SCALAR_STRUCT:
      return 'struct';
    case FS_FIXED_LEN_STRUCT:
      return 'fixed-length struct';
    case FS_VAR_LEN_STRUCT:
      return 'variable-length struct';
    default:
      return 'unknown';
  }
}

/**
 * Updates a spec of a feature from a new spec for that feature from a different
 * dataset.
 */
export function updateSpec(spec: FeatureSpec, newSpec: FeatureSpec) {
  // If the spec is previously-unknown, then the spec is the newly-seen
  // spec.
  if (spec === FS_UNKNOWN) {
    return newSpec;
  }
  // If the spec is invalid, or the new spec is unknown, then the spec is
  // not updated for the new spec.
  if (spec >= FS_NUM_VALUES || newSpec === FS_UNKNOWN) {
    return spec;
  }
  // If the new spec matches the type of the previous spec, then update the
  // spec to be the maximum of the two (as higher-numbered specs are more
  // general than lower-numbered specs, within the same type).
  if ((spec >= FS_SCALAR_FLOAT && spec <= FS_VAR_LEN_FLOATS &&
       newSpec >= FS_SCALAR_FLOAT && newSpec <= FS_VAR_LEN_FLOATS) ||
      (spec >= FS_SCALAR_INT && spec <= FS_VAR_LEN_INTS &&
       newSpec >= FS_SCALAR_INT && newSpec <= FS_VAR_LEN_INTS) ||
      (spec >= FS_SCALAR_STR && spec <= FS_VAR_LEN_STRS &&
       newSpec >= FS_SCALAR_STR && newSpec <= FS_VAR_LEN_STRS) ||
      (spec >= FS_SCALAR_BYTES && spec <= FS_VAR_LEN_BYTES &&
       newSpec >= FS_SCALAR_BYTES && newSpec <= FS_VAR_LEN_BYTES) ||
       (spec >= FS_SCALAR_STRUCT && spec <= FS_VAR_LEN_STRUCT &&
        newSpec >= FS_SCALAR_STRUCT && newSpec <= FS_VAR_LEN_STRUCT)) {
    return Math.max(spec, newSpec);
  }
  // If the spec and the new spec have a type mismatch, use the sentinal
  // value to represent an invalid spec.
  return FS_NUM_VALUES;
}

/**
 * Gets the featre spec given a feature's statistics.
 */
export function getSpecFromFeatureStats(
    type: FeatureNameStatistics.Type, commonStats: CommonStatistics) {
  let spec: FeatureSpec = FS_UNKNOWN;
  if (commonStats != null && commonStats.getNumNonMissing() !== 0) {
    // Determine if the feature for this dataset is scalar (always contains
    // only up to 1 value), or fixed-length (always contains the same
    // number of values not equal to 1, if not missing). Otherwise the
    // feature is variable-length.
    let scalar = false;
    let fixedLength = false;
    if (commonStats.getMinNumValues()! === commonStats.getMaxNumValues()!) {
      commonStats.getMinNumValues()! === 1 ? scalar = true : fixedLength = true;
    }

    // Set the FeatureSpec based on the feature type and the number of
    // values it contains.
    if (type === FeatureNameStatistics.Type.FLOAT) {
      spec = scalar ? FS_SCALAR_FLOAT :
                      fixedLength ? FS_FIXED_LEN_FLOATS : FS_VAR_LEN_FLOATS;
    } else if (type === FeatureNameStatistics.Type.INT) {
      spec = scalar ? FS_SCALAR_INT :
                      fixedLength ? FS_FIXED_LEN_INTS : FS_VAR_LEN_INTS;
    } else if (type === FeatureNameStatistics.Type.STRING) {
      spec = scalar ? FS_SCALAR_STR :
                      fixedLength ? FS_FIXED_LEN_STRS : FS_VAR_LEN_STRS;
    } else if (type === FeatureNameStatistics.Type.BYTES) {
      spec = scalar ? FS_SCALAR_BYTES :
                      fixedLength ? FS_FIXED_LEN_BYTES : FS_VAR_LEN_BYTES;
    } else {
      spec = scalar ? FS_SCALAR_STRUCT :
                      fixedLength ? FS_FIXED_LEN_STRUCT : FS_VAR_LEN_STRUCT;
    }
  }
  return spec;
}

/**
 * Holds a feature spec and a list of features belonging to that FeatureSpec.
 */
export class FeatureSpecAndList {
  spec: FeatureSpec;
  features: string[];
}

/**
 * Used to store data behind backing CDF chart and raw data table per dataset
 * for use in facets-overview-chart.
 */
export class BucketsForDataset {
  name: string;
  rawBuckets: RankHistogram.Bucket[];
  percBuckets: RankHistogram.Bucket[];
}

/**
 * Tracks a value for a feature and its counts per dataset. Used for the raw
 * data table in facets-overview-chart.
 */
export class ValueAndCounts {
  value: string;
  counts: number[];
}

/**
 * Converts chart data into an array of ValueAndCounts for use in the raw
 * data table display.
 *
 * Each entry in the chart data array is chart data for a single dataset.
 * All entries must have their buckets by label in the same order (but any
 * dataset can have extra buckets at the end that don't exist in the other
 * datasets).
 *
 * The returned array has an entry per unique label. In this respect, this
 * function does something similar to a transpose of the data.
 */
export function getValueAndCountsArray(chartData: BucketsForDataset[]):
    ValueAndCounts[] {
  // Determine the maximum number of buckets in a dataset.
  let maxBuckets = 0;
  let maxBucketsIndex = 0;
  for (let datasetIndex = 0; datasetIndex < chartData.length; datasetIndex++) {
    if (chartData[datasetIndex].rawBuckets.length > maxBuckets) {
      maxBuckets = chartData[datasetIndex].rawBuckets.length;
      maxBucketsIndex = datasetIndex;
    }
  }
  const ret: ValueAndCounts[] = [];
  // Loop through the unique values in the buckets in all datasets.
  for (let i = 0; i < maxBuckets; i++) {
    const newEntry = new ValueAndCounts();
    newEntry.value = chartData[maxBucketsIndex].rawBuckets[i].getLabel();
    newEntry.counts = [];
    // For each value, loop through the datasets to get a count of that value
    // for each dataset for the counts array.
    for (let j = 0; j < chartData.length; j++) {
      // If this dataset doesn't have a bucket for the current value, then
      // set its count to 0. Otherwise get its count from the bucket.
      if (chartData[j].rawBuckets.length <= i) {
        newEntry.counts.push(0);
      } else {
        newEntry.counts.push(chartData[j].rawBuckets[i].getSampleCount());
      }
    }
    ret.push(newEntry);
  }
  return ret;
}

/**
 * Converts chart data into an array of ValueAndCounts for use in the raw
 * data table display.
 *
 * Each entry in the chart data array is chart data for a single dataset.
 * The labels array contains all values which will have entries in the
 * returned array.
 *
 * This function does not have the same bucket-ordering restrictions as the
 * getValueAndCountsArray function above.
 *
 * The returned array has an entry per label. In this respect, this
 * function does something similar to a transpose of the data.
 */
export function getValueAndCountsArrayWithLabels(
    chartData: BucketsForDataset[], labels: string[]): ValueAndCounts[] {
  const ret: ValueAndCounts[] = [];
  // Loop through the unique values in the buckets in all datasets.
  for (let i = 0; i < labels.length; i++) {
    const newEntry = new ValueAndCounts();
    const label = labels[i];
    newEntry.value = label;
    newEntry.counts = [];
    // For each value, loop through the datasets to get a count of that value
    // for each dataset for the counts array.
    for (let j = 0; j < chartData.length; j++) {
      // If this dataset doesn't have a bucket for the current value, then
      // set its count to 0. Otherwise get its count from the bucket.
      const buckets: RankHistogram.Bucket[] = chartData[j].rawBuckets;
      let bucketForLabel = -1;
      // Perform a linear search for the current label on the current dataset.
      // The alternative to create a map of label to count for each label
      // for each dataset isn't better as there are a small number of
      // unique labels in this use case.
      for (let k = 0; k < buckets.length; k++) {
        if (buckets[k].getLabel() === label) {
          bucketForLabel = k;
          break;
        }
      }
      if (bucketForLabel === -1) {
        newEntry.counts.push(0);
      } else {
        newEntry.counts.push(buckets[bucketForLabel].getSampleCount());
      }
    }
    ret.push(newEntry);
  }
  return ret;
}

/**
 * The possible chart types for charting a single feature's value distribution.
 */
export enum ChartType {
  HISTOGRAM,
  BAR_CHART,
  CUMDIST_CHART  // Cumulative-distribution chart
}


// The pre-defined chart selections for users switching between chart views.
//
// Standard chart (histogram for numeric, bar or CDF otherwise)
export const CHART_SELECTION_STANDARD = 'Standard';
// Quantile chart for numeric data.
export const CHART_SELECTION_QUANTILES = 'Quantiles';
// A quantile chart of the disbribution of value list lenghts across all
// examples for a single feature.
export const CHART_SELECTION_LIST_QUANTILES = 'Value list length';
// A quantile chart of the distribution of feature list lengths across all
// examples for a single feature. This chart is only valid for sequential
// features in a tf.SequenceExample.
export const CHART_SELECTION_FEATURE_LIST_LENGTH_QUANTILES =
    'Feature list length';

/**
 * Returns whether the chart selection represents a quantiles chart.
 *
 * This checks specifically for the three known quantile chart selections
 * as custom chart selections are possible but they are not quantiles.
 */
export function chartSelectionHasQuantiles(chartSelection: string) {
  return chartSelection === CHART_SELECTION_QUANTILES ||
      chartSelection === CHART_SELECTION_LIST_QUANTILES ||
      chartSelection === CHART_SELECTION_FEATURE_LIST_LENGTH_QUANTILES;
}

/**
 * Returns the appropriate chart type to use for data for a single feature.
 */
export function determineChartTypeForData(
    chartData: HistogramForDataset[], chartSelection: string,
    maxBucketsForBarChart: number): ChartType {
  // Determine if the provided data is numerical.
  let nums = true;
  let maxBuckets = 0;
  chartData.forEach(d => {
    if (!d.histMap[chartSelection]) {
      return;
    }
    const buckets: GenericHistogramBucket[] =
        d.histMap[chartSelection].getBucketsList();
    maxBuckets = Math.max(maxBuckets, buckets.length);
    buckets.forEach((b: Histogram.Bucket) => {
      if (!b.getLowValue) {
        nums = false;
      }
    });
  });

  // Return the appopriate chart type for the provided data.
  return nums ? ChartType.HISTOGRAM :
                maxBuckets > maxBucketsForBarChart ? ChartType.CUMDIST_CHART :
                                                     ChartType.BAR_CHART;
}

// All CSS class variables have trailing whitespace so that concatenation is
// simple.
const ERROR_CLASS = 'data-error ';
const WEIGHTED_CLASS = 'data-weighted ';
const CUSTOM_CLASS = 'data-custom ';
const EMPTY_CLASS = '';

/** Contains text information for entries in the Overview table. Includes
 * a string to display, a string of CSS classes to give to the div displaying
 * the string and also a full string for displaying as a tooltip.
 */
export class CssFormattedString {
  constructor(
      public str: string, public cssClass: string, public fullStr?: string) {
    if (!this.fullStr) {
      this.fullStr = str;
    }
  }

  /**
   * Concatenates the information from one instance of this class into this
   * instance optionally with a connector string placed in between the two
   * values.
   */
  append(moreInfo: CssFormattedString, connector?: string) {
    if (connector) {
      this.str += connector;
      // TODO(jwexler): Investigate replacing the non-null assertion (!) with
      // a runtime check.
      // If you are certain the expression is always non-null/undefined, remove
      // this comment.
      this.fullStr = this.fullStr! + connector;
    }
    this.str += moreInfo.str;
    // TODO(jwexler): Investigate replacing the non-null assertion (!) with a
    // runtime check.
    // If you are certain the expression is always non-null/undefined, remove
    // this comment.
    this.fullStr = this.fullStr! + moreInfo.fullStr!;
    this.cssClass += moreInfo.cssClass;
  }
}

/**
 * Formats a number for display in the table. Very large or very small values
 * use SI-unit abbreviation.
 */
function formatNumberWithSi(num: number): string {
  const absNum = Math.abs(num);
  if (((absNum < 0.01 && absNum > 0) || absNum > 10000) && isFinite(num)) {
    // Replace SI-unit-provided 'G' with 'B' for values in the billions.
    return d3.format('.3s')(num).replace(/G$/, 'B');
  } else {
    return num.toLocaleString();
  }
}

/**
 * Creates a CssFormattedString instance for the provided floating point number
 * with class designations based on if the value is weighted and if the value is
 * an error value based on a provided isError function.
 */
export function formatFloatWithClass(
    num: number, weighted?: boolean,
    isError?: ((num: number) => boolean)): CssFormattedString {
  const numPlaces = Math.abs(num) > 1000000 ? 0 : 2;
  const formattedNum = roundToPlaces(getNumberFromField(num), numPlaces);
  const str = formatNumberWithSi(formattedNum);
  const cssClass = getClassForCssFormattedString(num, weighted, isError);
  return new CssFormattedString(
      str, cssClass, num.toLocaleString([], {maximumFractionDigits: 9}));
}

/**
 * Creates a CssFormattedString instance for the provided percentage with
 * class designations based on if the value is weighted and if the value is
 * an error value based on a provided isError function.
 */
export function formatPercentageWithClass(
    num: number, total: number, weighted?: boolean,
    isError?: ((num: number) => boolean)): CssFormattedString {
  num = getNumberFromField(num);
  const ratio = num == null || !total ? 0 : num / total;
  const str = ratio > 0.999999 && ratio < 1 ?
      '~100%' :
      ratio < 0.000001 && ratio > 0 ? '~0%' :
                                      roundToPlaces(ratio * 100, 2) + '%';
  const cssClass = getClassForCssFormattedString(ratio, weighted, isError);
  return new CssFormattedString(str, cssClass, ratio * 100 + '%');
}

/**
 * Creates a CssFormattedString instance for the provided integer with
 * class designations based on if the value is weighted and if the value is
 * an error value based on a provided isError function.
 */
export function formatIntWithClass(
    num: number, weighted?: boolean,
    isError?: ((num: number) => boolean)): CssFormattedString {
  const str = formatNumberWithSi(num);
  const cssClass = getClassForCssFormattedString(num, weighted, isError);
  return new CssFormattedString(str, cssClass, num.toLocaleString());
}

/**
 * Creates a CssFormattedString instance for the provided string with
 * class designations based on if the value is weighted and if the value is
 * an error value based on a provided isError function.
 */
export function formatStringWithClass(
    str: string, weighted?: boolean,
    isError?: ((str: string) => boolean)): CssFormattedString {
  str = quoteIfNumber(getPrintableLabel(str));
  const cssClass = getClassForCssFormattedString(str, weighted, isError);
  return new CssFormattedString(str, cssClass);
}

/** Helper function for the format functions. */
function getClassForCssFormattedString(
    val: number|string, weighted?: boolean,
    isError?: ((input: number | string) => boolean)): string {
  let cssClass = weighted ? WEIGHTED_CLASS : EMPTY_CLASS;
  if ((isError && isError(val)) ||
      (typeof val === 'number' && !isFinite(val))) {
    cssClass += ERROR_CLASS;
  }
  return cssClass;
}

export function getLegendEntries(
    numeric: boolean, showWeighted: boolean,
    hasCustom: boolean): CssFormattedString[] {
  const entries: CssFormattedString[] = [];
  entries.push(formatStringWithClass('count'));
  entries.push(formatStringWithClass('missing'));
  if (numeric) {
    entries.push(formatStringWithClass('mean', showWeighted));
    entries.push(formatStringWithClass('std dev', showWeighted));
    entries.push(formatStringWithClass('zeros'));
    entries.push(formatStringWithClass('min'));
    entries.push(formatStringWithClass('median', showWeighted));
    entries.push(formatStringWithClass('max'));
  } else {
    entries.push(formatStringWithClass('unique'));
    entries.push(formatStringWithClass('top', showWeighted));
    entries.push(formatStringWithClass('freq top', showWeighted));
    entries.push(formatStringWithClass('avg str len'));
  }
  if (hasCustom) {
    const entry = new CssFormattedString('custom', CUSTOM_CLASS);
    entries.push(entry);
  }
  return entries;
}

// Error thresholds used in the below functions for stats entries generation.
const ZEROS_PERC_ERROR_THRESHOLD = 0.1;
const NUM_NON_MISSING_ERROR_THRESHOLD = 0;
const MISSING_PERC_ERROR_THRESHOLD = 0.02;

/**
 * Retrieves the CommonStatistics for a feature or null if not found.
 */
export function getCommonStats(featureStats?: FeatureNameStatistics):
    CommonStatistics|null {
  if (!featureStats) {
    return null;
  }
  if (featureStats.getNumStats()) {
    return featureStats.getNumStats()!.getCommonStats();
  } else if (featureStats.getStringStats()) {
    return featureStats.getStringStats()!.getCommonStats();
  } else if (featureStats.getBytesStats()) {
    return featureStats.getBytesStats()!.getCommonStats();
  } else if (featureStats.getStructStats()) {
    return featureStats.getStructStats()!.getCommonStats();
  }
  return null;
}

/**
 * Gets the CssFormattedStrings for a feature's common stats for display in the
 * table.
 */
function getCommonStatsEntries(commonstats: CommonStatistics|null) {
  const entries: CssFormattedString[] = [];
  if (commonstats) {
    entries.push(formatIntWithClass(
        commonstats.getNumNonMissing(), false,
        (num: number) => num <= NUM_NON_MISSING_ERROR_THRESHOLD));
    entries.push(formatPercentageWithClass(
        commonstats.getNumMissing(),
        getNumberFromField(commonstats.getNumNonMissing()) +
            getNumberFromField(commonstats.getNumMissing()),
        false, (num: number) => num > MISSING_PERC_ERROR_THRESHOLD));
  } else {
    entries.push(formatIntWithClass(
        0, false, (num: number) => num <= NUM_NON_MISSING_ERROR_THRESHOLD));
    entries.push(formatPercentageWithClass(
        1, 1, false, (num: number) => num > MISSING_PERC_ERROR_THRESHOLD));
  }
  return entries;
}

/**
 * Gets the CssFormattedStrings for a numeric feature's stats for display in the
 * table.
 */
export function getNumStatsEntries(
    numstats: NumericStatistics|null, commonstats: CommonStatistics|null,
    showWeighted: boolean) {
  const entries: CssFormattedString[] = [];
  if (numstats) {
    const weighted = showWeighted ? numstats.getWeightedNumericStats() : null;
    if (weighted) {
      entries.push(formatFloatWithClass(weighted.getMean(), true));
      entries.push(formatFloatWithClass(weighted.getStdDev(), true));
    } else {
      entries.push(formatFloatWithClass(numstats.getMean()));
      entries.push(formatFloatWithClass(numstats.getStdDev()));
    }
    entries.push(formatPercentageWithClass(
        numstats.getNumZeros(), getTotalNumberOfValues(commonstats), false,
        (num: number) => num > ZEROS_PERC_ERROR_THRESHOLD));
    const statsHasNans = hasNans(numstats);
    entries.push(formatFloatWithClass(statsHasNans ? NaN : numstats.getMin()));
    if (weighted) {
      entries.push(formatFloatWithClass(weighted.getMedian(), true));
    } else {
      entries.push(formatFloatWithClass(numstats.getMedian()));
    }
    entries.push(formatFloatWithClass(statsHasNans ? NaN : numstats.getMax()));
  } else {
    for (let i = 0; i < 6; i++) {
      entries.push(formatStringWithClass('-'));
    }
  }
  return entries;
}

/** Returns if the feature's includes a NaN value */
function hasNans(numstats: NumericStatistics|null): boolean {
  if (!numstats) {
    return false;
  }
  const hists = numstats.getHistogramsList();
  for (let i = 0; i < hists.length; i++) {
    if (hists[i].getNumNan() > 0) {
      return true;
    }
  }
  return false;
}

/**
 * Gets the CssFormattedStrings for a string feature's stats for display in the
 * table.
 */
function getStringStatsEntries(
    stringstats: StringStatistics|null, showWeighted: boolean) {
  const entries: CssFormattedString[] = [];
  if (stringstats) {
    const weighted =
        showWeighted ? stringstats.getWeightedStringStats()! : null;
    entries.push(formatIntWithClass(stringstats.getUnique()));
    const topValuesList =
        weighted ? weighted.getTopValuesList() : stringstats.getTopValuesList();
    if (topValuesList && topValuesList.length > 0) {
      entries.push(
          formatStringWithClass(topValuesList[0].getValue(), !!weighted));
      entries.push(
          formatFloatWithClass(topValuesList[0].getFrequency(), !!weighted));
    } else {
      entries.push(formatStringWithClass('-'));
      entries.push(formatStringWithClass('-'));
    }
    entries.push(formatFloatWithClass(stringstats.getAvgLength()));
  } else {
    for (let i = 0; i < 4; i++) {
      entries.push(formatStringWithClass('-'));
    }
  }
  return entries;
}

/**
 * Gets the CssFormattedStrings for a bytes feature's stats for display in the
 * table.
 */
function getBytesStatsEntries(bytesstats: BytesStatistics|null) {
  const entries: CssFormattedString[] = [];
  if (bytesstats) {
    entries.push(formatIntWithClass(bytesstats.getUnique()));
    entries.push(formatStringWithClass('-'));
    entries.push(formatStringWithClass('-'));
    entries.push(formatFloatWithClass(bytesstats.getAvgNumBytes()));
  } else {
    for (let i = 0; i < 4; i++) {
      entries.push(formatStringWithClass('-'));
    }
  }
  return entries;
}

/**
 * Gets the CssFormattedStrings for a feature's custom stats for display in the
 * table.
 */
function getCustomStatsEntries(stats: CustomStatistic[]|null) {
  const entries: CssFormattedString[] = [];
  if (stats && stats.length > 0) {
    // Loop over all custom stats for this feature, concatenating them
    // into a single entry with newlines between each stat/value pair.
    const ret = new CssFormattedString('', CUSTOM_CLASS);
    stats.forEach(stat => {
      if (stat.getHistogram() || stat.getRankHistogram()) {
        // Continue onto the next custom stat.
        return;
      }
      let statName = stat.getName();
      // Add a newline to the entry if this is not the first custom stat.
      if (ret.str !== '') {
        statName = '\n' + statName;
      }
      // For each stat, the text in the entry with be the stat name,
      // followed by a colon and then the stat value.
      ret.append(formatStringWithClass(statName));
      if (stat.getStr()) {
        ret.append(formatStringWithClass(stat.getStr()), ': ');
      } else {
        ret.append(formatFloatWithClass(stat.getNum()), ': ');
      }
    });
    entries.push(ret);
  } else {
    // If this feature has no custom stats, then fill with '-' entry.
    const entry = new CssFormattedString('-', CUSTOM_CLASS);
    entries.push(entry);
  }
  return entries;
}

/**
 * Gets the CssFormattedStrings for a feature's stats for display in the table.
 */
export function getStatsEntries(
    stats: FeatureNameStatistics,
    showWeighted: boolean, hasCustom: boolean): CssFormattedString[] {
  if (!stats) {
    return [];
  }
  const commonStats = getCommonStats(stats);
  let entries: CssFormattedString[] = getCommonStatsEntries(commonStats);
  if (stats.getNumStats()) {
    entries = entries.concat(
        getNumStatsEntries(stats.getNumStats(), commonStats, showWeighted));
  } else if (stats.getStringStats()) {
    entries = entries.concat(
        getStringStatsEntries(stats.getStringStats(), showWeighted));
  } else {
    entries = entries.concat(
        getBytesStatsEntries(stats.getBytesStats()));
  }

  // Add the entry for the custom stats if the dataset has custom stats.
  if (hasCustom) {
    entries = entries.concat(getCustomStatsEntries(stats.getCustomStatsList()));
  }
  return entries;
}

/**
 * Converts histogram bucket sample counts from absolute values to ratios
 * of the total number of samples per dataset.
 */
export function convertToPercentage(chartData: GenericHistogramBucket[][]) {
  const totalCounts: number[] = chartData.map(buckets => 0);
  chartData.forEach((buckets, i) => {
    buckets.forEach((b: Histogram.Bucket) => {
      totalCounts[i] += getNumberFromField(b.getSampleCount());
    });
  });
  return chartData.map((buckets, i) => {
    return buckets.map((b: Histogram.Bucket | RankHistogram.Bucket) => {
      // For each bucket in a histogram, create a new bucket where the count
      // is replaced by the ratio of the count to the total count of all
      // buckets in the histogram.
      if (b instanceof Histogram.Bucket) {
        const histB = b as Histogram.Bucket;
        const percBucket = new Histogram.Bucket();
        percBucket.setSampleCount(histB.getSampleCount() / totalCounts[i]);
        percBucket.setLowValue(histB.getLowValue());
        percBucket.setHighValue(histB.getHighValue());
        return percBucket;
      } else {
        const rankHistB = b as RankHistogram.Bucket;
        const percBucket = new RankHistogram.Bucket();
        percBucket.setSampleCount(rankHistB.getSampleCount() / totalCounts[i]);
        percBucket.setLowRank(rankHistB.getLowRank());
        percBucket.setHighRank(rankHistB.getHighRank());
        percBucket.setLabel(rankHistB.getLabel());
        return percBucket;
      }
    });
  });
}
