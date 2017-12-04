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

import {OverviewDataModel} from '../../common/overview_data_model';
import * as utils from '../../common/utils';

Polymer({
  is: 'facets-overview-row-stats',

  properties: {
    stats: Object,
    showWeighted: Boolean,
    hasCustom: Boolean,
    dataModel: Object,
    datasetIndex: Number,
    compareMode: Boolean,
    _entries: {
      type: Array,
      computed: '_getEntries(stats, showWeighted, hasCustom)'
    },
  },
  observers: ['_colorLegendBox(dataModel, datasetIndex, compareMode)'],
  _getEntries: function(
      stats: FeatureNameStatistics,
      showWeighted: boolean, hasCustom: boolean) {
    return utils.getStatsEntries(stats, showWeighted, hasCustom);
  },
  _colorLegendBox: function(
      this: any, dataModel: OverviewDataModel, datasetIndex: number,
      compareMode: boolean) {
    const boxSelection: d3.Selection<HTMLElement, {}, null, undefined> =
        d3.select(this.$$('#legend-box'));
    // Do not display the color box for the dataset if there is only a single
    // dataset or not in compare mode.
    if (dataModel.getDatasetNames().length < 2 && !compareMode) {
      boxSelection.style('visibility', 'hidden');
    } else {
      boxSelection.style('visibility', null);
      boxSelection.style(
          'background-color', dataModel.getChartColorString(datasetIndex));
    }
  },
});
