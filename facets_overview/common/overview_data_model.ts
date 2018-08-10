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
import * as utils from './utils';

/***
 * OverviewDataModel holds the current dataset that Overview uses to render.
 * Its responsibilities are to broker access to the underlying deserialized
 * protocol buffers through a strongly-typed API, and to maintain any extra
 * state (including the common color scale, sortings, helper mappings, etc)
 * required for Overview to render and process input.
 */
export class OverviewDataModel {
  constructor(private data: DatasetFeatureStatisticsList) {
    this.colorScale = new Plottable.Scales.Color();
    this.colorScale.domain(data.getDatasetsList().map(d => d.getName()));
    // Categorical colors from the material design spec.
    this.colorScale.range(['#4285F4', '#F09300', '#0F9D58', '#9C27B0',
                           '#607D8B', '#0B8043', '#757575']);

    // Check if data is using deprecated fields and hasn't been cleaned.
    if (!utils.isProtoClean(data)) {
      throw new Error("input proto has not been cleaned");
    }

    this.featuresBySpec = this.makeFeatureBySpecList();
  }

  /**
   * Creates for each FeatureSpec an array of the feature names that fall
   * under that FeatureSpec.
   */
  private makeFeatureBySpecList(): string[][] {
    const map: string[][] = [];
    for (let spec = 0; spec < utils.FS_NUM_VALUES; spec++) {
     map[spec] = [];
    }
    const features = this.getUniqueFeatures();
    features.forEach(feature => {
      const spec = this.getFeatureSpecForFeature(feature.getName());
      map[spec].push(feature.getName());
    });
    return map;
  }

  /**
   * Returns an array of all FeatureSpecs represented by the data, along with
   * the features that match that spec.
   */
  getNonEmptyFeatureSpecLists(): utils.FeatureSpecAndList[] {
    const ret: utils.FeatureSpecAndList[] = [];
    for (let i = 0; i < utils.FS_NUM_VALUES; i++) {
      if (this.featuresBySpec[i].length !== 0) {
        const featureSpecList = new utils.FeatureSpecAndList();
        featureSpecList.features = this.featuresBySpec[i];
        featureSpecList.spec = i;
        ret.push(featureSpecList);
      }
    }
    return ret;
  }

  /**
   * Returns the FeatureSpec for a provided feature.
   */
  getFeatureSpecForFeature(feature: string): utils.FeatureSpec {
    const datasetNames = this.getDatasetNames();
    let spec: utils.FeatureSpec = utils.FS_UNKNOWN;

    // For each dataset, get the spec of the feature for that dataset then
    // update the overall spec based on the results from previous datasets.
    //
    // For example, dataset 1 could have feature "a" as a SCALAR_INT and dataset
    // 2 could have feature "a" as a FIXED_LENGTH_INT. In this case, the feature
    // should be considered a FIXED_LENGTH_INT as that is more permissive than
    // SCALAR_INT.
    for (let datasetIdx = 0; datasetIdx < datasetNames.length; datasetIdx++) {
      const stats = this.getFeature(feature, datasetNames[datasetIdx])!;
      const newSpec = stats == null ?
          utils.FS_UNKNOWN :
          utils.getSpecFromFeatureStats(
              stats.getType()!,
              this.getFeatureCommonStats(feature, datasetNames[datasetIdx])!);

      // Update the overall FeatureSpec based on previous datasets and the
      // current dataset.
      spec = utils.updateSpec(spec, newSpec);
    }
    // If the spec is invalid, then set it to unknown. The sentinal value is
    // used during processing to represent invalid data, but should not be
    // returned.
    if (spec === utils.FS_NUM_VALUES) {
      spec = utils.FS_UNKNOWN;
    }
    return spec;
  }

  /***
   * Return the top-level deserialized protocol buffer.
   * This will be deleted when all logic is moved into OverviewDataModel.
   */
  getDatasetFeatureStatistics(): DatasetFeatureStatisticsList {
    return this.data;
  }

  /***
   * Return the Plottable color scale, used to map dataset names to
   * HTML # color strings.
   */
  getColorScale(): Plottable.Scales.Color {
    return this.colorScale;
  }

  /***
   * Return an array containing the names of all datasets.
   */
  getDatasetNames(): string[] {
    if (!this.data) {
      return [];
    }
    const datasets = this.data.getDatasetsList()!;
    return datasets.map(dataset => dataset.getName());
  }

  /***
   * Retrieve a dataset by its name, or null if not found.
   */
  getDataset(name: string): DatasetFeatureStatistics|null {
    if (!this.data) {
      return null;
    }
    for (const dataset of this.data.getDatasetsList()) {
      if (dataset.getName() === name) {
        return dataset;
      }
    }
    return null;
  }

  /**
   * Retrieve a feature from a dataset by its name, or null if not found.
   */
  getFeature(featureName: string|null,
             datasetName: string): FeatureNameStatistics|null {
    if (!featureName) {
      return null;
    }
    if (!this.data) {
      return null;
    }
    const d = this.getDataset(datasetName);
    if (!d) {
      return null;
    }
    for (const feature of d.getFeaturesList()) {
      if (feature.getName() === featureName) {
        return feature;
      }
    }
    return null;
  }

  /**
   * Retrieves the names of all non-standard histograms in the datasets for
   * all provided features. Used to populate a dropdown list of histograms
   * to view.
   */
  getExtraHistogramNames(features: FeatureNameStatistics[]): string[] {
    if (!this.data) {
      return [];
    }
    const featureNames = features.map(feat => feat.getName());
    const namesSet: {[name: string]: true} = {};
    for (const dataset of this.data.getDatasetsList()!) {
      for (const feature of dataset.getFeaturesList()!) {
        // Only look at histograms in features that were in the provided list.
        if (featureNames.indexOf(feature.getName()!) === -1) {
          continue;
        }
        if (feature.getCustomStatsList()) {
          const customStats = feature.getCustomStatsList()!;
          customStats.forEach(customStat => {
            // Add all custom histograms from the custom stats for the feature.
            if (customStat.getHistogram() || customStat.getRankHistogram()) {
              namesSet[customStat.getName()] = true;
            }
          });
        }
        if (feature.getNumStats()) {
          const hists = feature.getNumStats()!.getHistogramsList();
          if (hists) {
            // Add all histograms in the numeric stats histogram list that
            // have a custom name. Those that don't have custom names are the
            // standard numeric histogram and quantile histograms for all
            // numeric features.
            for (let i = 0; i < hists.length; i++) {
              const currentHist = hists[i];
              if (currentHist.getName()) {
                namesSet[currentHist.getName()] = true;
              }
            }
          }
        }
      }
    }
    return Object.keys(namesSet);
  }

  /**
   * Retrieves the CommonStatistics for a feature from a dataset, or null if
   * not found.
   */
  getFeatureCommonStats(featureName: string|null,
             datasetName: string): CommonStatistics|null {
    const featureStats = this.getFeature(featureName, datasetName);
    if (featureStats == null) {
      return null;
    }
    return utils.getCommonStats(featureStats);
  }

  /**
   * Returns an array containing all of the feature names in the given dataset.
   */
  getFeatureNames(datasetName: string|null): string[]|null {
    if (!datasetName) {
      return null;
    }
    if (!this.data) {
      return null;
    }
    const d = this.getDataset(datasetName);
    if (!d) {
      return [];
    }
    return d.getFeaturesList()!.map(feature => feature.getName());
  }

  /**
   * Returns the index of the feature in the specified dataset.
   */
  getFeatureIndex(datasetName: string, featureName: string): number|null {
    if (!this.data) {
      return null;
    }
    const d = this.getDataset(datasetName);
    if (!d) {
      return null;
    }
    let i = 0;
    for (const f of d.getFeaturesList()) {
      if (f.getName() === featureName) {
        return i;
      }
      ++i;
    }
    return null;
  }

  /**
   * Accumulates all unique features across all datasets.
   */
  getUniqueFeatures(): FeatureNameStatistics[] {
    if (!this.data) {
      return [];
    }
    const featureMap: {[name: string]: FeatureNameStatistics} = {};
    for (const dataset of this.data.getDatasetsList()!) {
      for (const feature of dataset.getFeaturesList()!) {
        featureMap[feature.getName()!] = feature;
      }
    }
    return Object.keys(featureMap).map(name => featureMap[name]);
  }

  /**
   * Returns the number of numeric or non-numeric features.
   */
  getNumUniqueFeaturesByType(numeric: boolean): number {
    return this.getUniqueFeatures().filter(
      feature => utils.containsNumericStats(feature) === numeric).length;
  }

  /**
   * Returns whether or not all of the data points associated with a single
   * feature are identical (i.e. the feature has N instances of the same value)
   */
  featureHasSingleValue(feature: FeatureNameStatistics|null): boolean {
    if (!feature) {
      return false;
    }
    if (feature.getStringStats()) {
      const unique = feature.getStringStats()!.getUnique();
      return utils.getNumberFromField(unique) === 1;
    } else if (feature.getBytesStats()) {
      const unique = feature.getBytesStats()!.getUnique();
      return utils.getNumberFromField(unique) === 1;
    } else if (feature.getNumStats()) {
      const min = feature.getNumStats()!.getMin();
      const max = feature.getNumStats()!.getMax();
      if ((min == null) && (max == null)) {
        return false;
      }
      return utils.getNumberFromField(min) === utils.getNumberFromField(max);
    }
    return false;
  }

  /**
   * Determine if a feature is comprised entirely of a single value.
   * Used to select a visualizer (chart vs single-value text)
   */
  featureAcrossAllDatasetsHasSingleValue(featureName: string|null): boolean {
    if (!featureName) {
      return false;
    }
    if (!this.data) {
      return false;
    }
    for (const dataset of this.data.getDatasetsList()) {
      for (const feature of dataset.getFeaturesList()) {
        if (featureName === feature.getName()) {
          if (!this.featureHasSingleValue(feature)) {
            return false;
          }
        }
      }
    }
    return true;
  }

  /**
   * Gets the singular value of all data points in a feature.
   */
  getFeatureSingleValue(stats: FeatureNameStatistics|null): string {
    if (stats == null) {
      return '<null>';
    }
    if (stats.getStringStats()) {
      const topValues = stats.getStringStats()!.getTopValuesList();
      if ((topValues == null) || (topValues.length === 0)) {
        return '<null>';
      }
      return topValues[0].getValue();
    } else if (stats.getBytesStats()) {
      if (stats.getBytesStats()!.getUnique() === 0) {
        return '<null>';
      }
      return '<binary data>';
    } else if (stats.getNumStats()) {
      const min = stats.getNumStats()!.getMin();
      if (min) {
        return utils.getNumberFromField(min).toString();
      }
      const max = stats.getNumStats()!.getMax();
      if (max) {
        return utils.getNumberFromField(max).toString();
      }
    }
    return '<unknown type>';
  }

  getDatasetHistogramsForFeature(featureName: string):
                                utils.HistogramForDataset[] {
    const histograms: utils.HistogramForDataset[] = [];
    if (this.data) {
      for (const dataset of this.data.getDatasetsList()) {
        const datasetName = dataset.getName()!;
        let h: utils.GenericHistogram|null = null;
        let weightedH: utils.GenericHistogram|null = null;
        let q: utils.GenericHistogram|null = null;
        let weightedQ: utils.GenericHistogram|null = null;
        let listQ: utils.GenericHistogram|null = null;
        let featureListLengthQ: utils.GenericHistogram|null = null;
        const namedHists: {[name: string]: utils.GenericHistogram} = {};
        for (const feature of dataset.getFeaturesList()) {
          if (feature.getName() === featureName) {
            const commonStats =
                this.getFeatureCommonStats(featureName, datasetName);
            if (commonStats) {
              listQ = commonStats.getNumValuesHistogram();
              featureListLengthQ = commonStats.getFeatureListLengthHistogram();
            }
            if (feature.getCustomStatsList()) {
              const customStats = feature.getCustomStatsList()!;
              customStats.forEach(customStat => {
                if (customStat.getHistogram()) {
                  namedHists[customStat.getName()] = customStat.getHistogram()!;
                }
                else if (customStat.getRankHistogram()) {
                  namedHists[customStat.getName()] =
                      customStat.getRankHistogram()!;
                }
              });
            }
            if (feature.getNumStats()) {
              const hists = feature.getNumStats()!.getHistogramsList();
              if (hists) {
                for (let i = 0; i < hists.length; i++) {
                  const currentHist = hists[i];
                  if (!currentHist.getName()) {
                    if (currentHist.getType() ===
                        Histogram.HistogramType.STANDARD) {
                      h = currentHist;
                    } else {
                      q = currentHist;
                    }
                  } else {
                    namedHists[currentHist.getName()] = currentHist;
                  }
                }
              }
              if (feature.getNumStats()!.getWeightedNumericStats()) {
                const weightedHists =
                    feature.getNumStats()!.getWeightedNumericStats()!
                        .getHistogramsList();
                if (weightedHists) {
                  for (let i = 0; i < weightedHists.length; i++) {
                    const currentHist = weightedHists[i];
                    if (currentHist.getType() ===
                        Histogram.HistogramType.STANDARD) {
                      weightedH = currentHist;
                    } else {
                      weightedQ = currentHist;
                    }
                  }
                }
              }
            } else if (feature.getStringStats()) {
              h = feature.getStringStats()!.getRankHistogram();
              if (feature.getStringStats()!.getWeightedStringStats()) {
                weightedH = feature.getStringStats()!.getWeightedStringStats()!.
                    getRankHistogram();
              }
            }
            break;
          }
        }
        histograms.push(new utils.HistogramForDataset(
            datasetName, h, weightedH, q, weightedQ, listQ, featureListLengthQ,
            namedHists));
      }
    }
    return histograms;
  }

  doesContainWeightedStats(): boolean {
    if (this.containsWeightedStats == null) {
      this.containsWeightedStats = utils.containsWeightedStats(this.data);
    }
    return this.containsWeightedStats;
  }

  doesContainCustomStats(): boolean {
    if (this.containsCustomStats == null) {
      this.containsCustomStats = utils.containsCustomStats(this.data);
    }
    return this.containsCustomStats;
  }

  doesContainFeatureListLengthData(): boolean {
    if (this.containsFeatureListLengthData == null) {
      this.containsFeatureListLengthData =
          utils.containsFeatureListLengthData(this.data);
    }
    return this.containsFeatureListLengthData;
  }

  getChartAlpha() {
    // Make charts non-opaque when there is more than one dataset to chart.
    return this.getDatasetNames().length >= 2 ? 0.4 : 1;
  }

  getChartColorString(datasetIndex: number) {
    // Get the color from the plottable color scale and add appropriate alpha.
    const color =
        this.getColorScale().scale(this.getDatasetNames()[datasetIndex]);
    const alpha = this.getChartAlpha();
    return color.replace('rgb', 'rgba').replace(')', ', ' + alpha + ')');
  }

  private featuresBySpec: string[][];
  private colorScale: Plottable.Scales.Color;
  private containsWeightedStats: boolean;
  private containsCustomStats: boolean;
  private containsFeatureListLengthData: boolean;
};
