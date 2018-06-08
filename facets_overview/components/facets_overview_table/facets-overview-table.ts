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
import CustomStatistic from 'goog:proto.featureStatistics.CustomStatistic';
import DatasetFeatureStatistics from 'goog:proto.featureStatistics.DatasetFeatureStatistics';
import FeatureNameStatistics from 'goog:proto.featureStatistics.FeatureNameStatistics';

import {OverviewDataModel} from '../../common/overview_data_model';
import * as utils from '../../common/utils';

Polymer({
  is: 'facets-overview-table',

  properties: {
    dataModel: {type: Object, observer: '_handleResize'},
    features: Array,
    featureSliceSelection: {type: Object, notify: true},
    numeric: {type: Boolean, value: false},
    compareMode: {type: Boolean, value: false},
    _logScale: {type: Boolean, value: false},
    _expandCharts: {type: Boolean, value: false, observer: '_handleResize'},
    _showWeighted: {type: Boolean, value: false},
    _showPercentage: {type: Boolean, value: false},
    _chartSelection: {type: String, value: utils.CHART_SELECTION_STANDARD},
    _enableLogScale: {type: Boolean, value: true},
    _chartSelectionTypes: {
      type: Array,
      computed: '_computeChartSelectionTypes(numeric, dataModel, features)'
    },
    _maxHeight: {type: Number, value: 800, readOnly: true},
    _expandedRowHeight: {type: Number, value: 330, readOnly: true},
    _rowHeight: {type: Number, value: 100, readOnly: true},
  },
  // tslint:disable-next-line:no-any typescript/polymer temporary issue
  _handleResize(this: any) {
    // Iron-lists must be explicitly sized to operate correctly and effiencly,
    // per the documentation. But we want an iron-list that is max height 800px
    // but can shrink to accomodate feature tables with a small number of
    // features. Therefore we set the height here based on the number of
    // features to display and if the features are displayed expanded or not.
    const ironList = this.$$('iron-list');
    if (!ironList || !this._expandedRowHeight || !this._rowHeight ||
        !this._maxHeight || !this.features) {
      return;
    }
    const heightPerElem = this._expandCharts ? this._expandedRowHeight
        : this._rowHeight;
    const length = this.features ? this.features.length : 0;
    const newHeight = Math.min(length * heightPerElem, this._maxHeight);
    ironList.style.height = newHeight + 'px';
    ironList.fire('iron-resize');
  },
  // tslint:disable-next-line:no-any typescript/polymer temporary issue
  _computeChartSelectionTypes(
      this: any, isNumeric: boolean, dataModel: OverviewDataModel,
      features: FeatureNameStatistics[]) {
    const types = [utils.CHART_SELECTION_STANDARD];
    if (isNumeric) {
      types.push(utils.CHART_SELECTION_QUANTILES);
    }
    if (features.length !== 0 &&
        utils.hasListQuantiles(this._getChartData(dataModel, features[0]))) {
      types.push(utils.CHART_SELECTION_LIST_QUANTILES);
    }
    if (dataModel.doesContainFeatureListLengthData()) {
      types.push(utils.CHART_SELECTION_FEATURE_LIST_LENGTH_QUANTILES);
    }
    return types.concat(dataModel.getExtraHistogramNames(features));
  },
  // tslint:disable-next-line:no-any typescript/polymer temporary issue
  attached(this: any) {
    // Ensure all visible elements in the iron-list are displayed by firing
    // a resize event after the element has rendered.
    const DELAY_FOR_RESIZE_MS = 1000;
    setTimeout(() => {
      this._handleResize();
    }, DELAY_FOR_RESIZE_MS);
  },
  _chartSelectionHasQuantiles(chartType: string) {
    return utils.chartSelectionHasQuantiles(chartType);
  },
  _getTitle(numeric: boolean) {
    return numeric ? 'Numeric' : 'Categorical';
  },
  _getFeatureName(feature: FeatureNameStatistics) {
    return feature.getName();
  },
  _hasCustomStats(dataModel: OverviewDataModel) {
    if (dataModel == null) {
      return false;
    }
    return dataModel.doesContainCustomStats();
  },
  _hasMultipleDatasets(dataModel: OverviewDataModel) {
    if (dataModel == null) {
      return false;
    }
    return dataModel.getDatasetNames().length > 1;
  },
  _getAllCustomStats(
      dataModel: OverviewDataModel,
      feature: FeatureNameStatistics): CustomStatistic[] {
    const stats: CustomStatistic[] = [];
    const names: {[name: string]: boolean} = {};
    const datasets = dataModel.getDatasetFeatureStatistics().getDatasetsList();

    // Create and return a list of all custom statistics for a given feature
    // across all of the datasets. This is used to determine the custom stats
    // to print out for each feature. The names of the custom features are what
    // is important in this list, but we return a list of CustomStatistic
    // objects as then we do not need to copy the strings out of them.
    datasets.forEach((dataset: DatasetFeatureStatistics) => {
      const featureIndex =
          dataModel.getFeatureIndex(dataset.getName()!, feature.getName()!);
      if (featureIndex == null) {
        return;
      }
      const featureStats = dataset.getFeaturesList()[featureIndex];
      const customStats: CustomStatistic[] = featureStats.getCustomStatsList();
      if (customStats) {
        customStats.forEach(s => {
          if (!names[s.getName()]) {
            names[s.getName()] = true;
            stats.push(s);
          }
        });
      }
    });
    return stats;
  },
  _getDatasets(dataModel: OverviewDataModel) {
    if (!dataModel) {
      return null;
    }
    return dataModel.getDatasetFeatureStatistics().getDatasetsList();
  },
  _getStats(
      dataModel: OverviewDataModel, dataset: DatasetFeatureStatistics,
      feature: FeatureNameStatistics) {
    if (!dataModel || !dataset || !feature) {
      return null;
    }
    return dataModel.getFeature(feature.getName()!, dataset.getName()!);
  },
  _getChartData(dataModel: OverviewDataModel, feature: FeatureNameStatistics):
      utils.HistogramForDataset[] {
        if (!dataModel || !feature) {
          return [];
        }
        return dataModel.getDatasetHistogramsForFeature(feature.getName()!);
      },
  _getFeatureCountText(
      dataModel: OverviewDataModel, numeric: boolean,
      features: FeatureNameStatistics[]) {
    const numFeatures =
        dataModel ? dataModel.getNumUniqueFeaturesByType(numeric) : 0;
    return utils.filteredElementCountString(features.length, numFeatures);
  },
  // tslint:disable-next-line:no-any typescript/polymer temporary issue
  _hasWeightedHistogram(this: any, features: FeatureNameStatistics[]) {
    if (features.length === 0) {
      return false;
    }
    return utils.hasWeightedHistogram(
        this._getChartData(this.dataModel, features[0]));
  },
  _getChartClass(expandCharts: boolean) {
    let classes = 'chart-column ';
    if (!expandCharts) {
      classes += 'table-cell ';
    }
    return classes;
  },
  _getTableWrapperClass(features: FeatureNameStatistics[]) {
    return !features || features.length === 0 ? 'hidden' : '';
  },
  _getTableRowClass(numeric: boolean) {
    return numeric ? 'numeric-row' : 'categorical-row';
  }
});
