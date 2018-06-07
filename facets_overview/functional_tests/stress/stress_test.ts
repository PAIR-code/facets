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
import StringStatistics from 'goog:proto.featureStatistics.StringStatistics';
import Histogram from 'goog:proto.featureStatistics.Histogram';
import RankHistogram from 'goog:proto.featureStatistics.RankHistogram';
import { DataPoint, generateStats } from '../../common/feature_statistics_generator';
import { FeatureSelection } from '../../common/utils';
import * as th from '../test_helpers/test_helpers';

Polymer({
  is: 'stress-test',

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

function create(): DatasetFeatureStatisticsList {
  const data = new DatasetFeatureStatisticsList();

  let dataPoints1: DataPoint[] = [];
  let dataPoints2: DataPoint[] = [];
  for (let i = 0; i < 50; i++) {
    const dataPoint1 = {};
    const dataPoint2 = {};
    for (let j = 0; j < 500; j++) {
      dataPoint1['num' + j] = d3.randomNormal(10)();
      dataPoint1['str' + j] = i < 20 ? 'a' : 'b';
      dataPoint2['num' + j] = d3.randomNormal(14)();
      dataPoint2['str' + j] = d3.randomUniform()() < .5 ? 'c' : 'b';
    }
    dataPoints1.push(dataPoint1);
    dataPoints2.push(dataPoint2);
  }
  let stats = generateStats(dataPoints1);
  stats.setName('data1');
  data.getDatasetsList().push(stats);
  stats = generateStats(dataPoints2);
  stats.setName('data2');
  data.getDatasetsList().push(stats);

  return data;
}
