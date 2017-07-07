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
import DatasetFeatureStatisticsList from 'goog:proto.featureStatistics.DatasetFeatureStatisticsList';
import FeatureNameStatistics from 'goog:proto.featureStatistics.FeatureNameStatistics';
import Histogram from 'goog:proto.featureStatistics.Histogram';
import { FeatureSelection } from '../../common/utils';
import { DataPoint, generateStats } from '../../common/feature_statistics_generator';
import * as th from '../test_helpers/test_helpers';

Polymer({
  is: 'single-feature-test',

  properties: {
    protoInput: Array,
    selection: Object,
    _selectionStr: {
      type: String,
      computed: '_setSelectionString(selection)',
    },
  },

  ready: function(this: any) {
    this.protoInput = create();
  },
  _setSelectionString: function(selection: FeatureSelection) {
    return JSON.stringify(selection);
  },
});

function create(): any {
  const data = new DatasetFeatureStatisticsList();
  const dataPoints: DataPoint[] = [];
  for (let i = 0; i < 200; i++) {
    dataPoints.push({'val': d3.randomNormal(10)()});
  }
  dataPoints.push({});
  const stats = generateStats(dataPoints);
  stats.setName('train');
  data.getDatasetsList().push(stats);
  return data;
}
