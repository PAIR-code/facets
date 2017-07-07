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
import RankHistogram from 'goog:proto.featureStatistics.RankHistogram';
import { DataPoint, generateStats } from '../../common/feature_statistics_generator';
import { FeatureSelection } from '../../common/utils';
import * as th from '../test_helpers/test_helpers';

Polymer({
  is: 'weighted-test',

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

  let dataPoints: DataPoint[] = [];
  for (let i = 0; i < 200; i++) {
    dataPoints.push({'num': d3.randomNormal(10)(),
                     'str': i < 80 ? 'a' : 'b',
                     'weight': d3.randomUniform()()
                   });
  }
  let stats = generateStats(dataPoints);
  stats.setName('train');
  data.getDatasetsList().push(stats);

  const numFeature = stats.getFeaturesList()[0];
  th.addWeightedStatsToNumFeature(
    numFeature, 4.8, 0.88, 5.2,
    [th.makeHistogram([[0, 1, 4.8],
                       [1, 2, 14.8],
                       [2, 3, 16],
                       [3, 4, 17.5],
                       [4, 5, 18],
                       [5, 6, 12],
                       [6, 7, 11.3],
                       [7, 8, 4.8],
                       [8, 9, 4],
                       [9, 10, 1.1]]),
    th.makeHistogram([[0, 1, 10],
                      [1, 1.5, 10],
                      [1.5, 2.5, 10],
                      [2.5, 4, 10],
                      [4, 4.7, 10],
                      [4.7, 6, 10],
                      [6, 7, 10],
                      [7, 8.8, 10],
                      [8.8, 9.8, 10],
                      [9.8, 9.8, 10]],
                     Histogram.HistogramType.QUANTILES)]);
  const strFeature = stats.getFeaturesList()[1];
  th.addWeightedStatsToStringFeature(strFeature,
      [th.makeFreqValuePair('b', 133)],
      th.makeRankHistogram([th.makeRankBucket('b', 0, 0, 133),
                            th.makeRankBucket('a', 1, 1, 66)]));
  return data;
}
