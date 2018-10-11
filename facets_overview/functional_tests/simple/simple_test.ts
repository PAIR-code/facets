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
import Path from 'goog:proto.featureStatistics.Path';
import RankHistogram from 'goog:proto.featureStatistics.RankHistogram';
import { DataPoint, generateStats } from '../../common/feature_statistics_generator';
import { FeatureSelection } from '../../common/utils';
import * as th from '../test_helpers/test_helpers';

Polymer({
  is: 'simple-test',

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
    dataPoints.push({'val': d3.randomNormal(10)(),
                     'val2': d3.randomUniform(0, 5)(),
                     'str1': i < 10 ? 'a' : 'b',
                     'str2': i < 180 ? 'popular-value-with-long-name'
                                     : 'train-' + i
                   });
  }
  let stats = generateStats(dataPoints);
  let featureStats = stats.getFeaturesList()[1];
  const path = new Path();
  path.setStepList(['root', 'dir', 'val2']);
  featureStats.setPath(path);
  stats.setName('training-data-with-long-name');
  data.getDatasetsList().push(stats);

  dataPoints = [];
  for (let i = 0; i < 40; i++) {
    if (i < 31) {
      dataPoints.push({'val': d3.randomUniform(5, 20)(),
                       'str1': i < 10 ? 'b' : 'c',
                       'str2': i < 20 ? 'popular' : 'eval-' + i,
                       'str3': 'hello'
                     });
    } else {
      dataPoints.push({'str1': i < 10 ? 'b' : 'c',
                       'str2': i < 20 ? 'popular' : 'eval-' + i,
                       'str3': 'hello'
                     });
    }
  }

  stats = generateStats(dataPoints);
  const customHist = th.makeHistogram([
    [0, 1, 1], [1, 2, 2], [2, 3, 3], [3, 4, 4], [4, 5, 5], [5, 6, 6], [6, 7, 7],
    [7, 8, 8], [8, 9, 9], [9, 10, 10]
  ]);
  const customRankHist = th.makeRankHistogram([
    th.makeRankBucket('label1', 0, 0, 10), th.makeRankBucket('label2', 1, 1, 6)
  ]);
  featureStats = stats.getFeaturesList()[0];
  const customStats = [th.makeCustomStatistic('customHist', customHist),
                       th.makeCustomStatistic('customNum', 13.1),
                       th.makeCustomStatistic('customRankHist', customRankHist),
                       th.makeCustomStatistic('customStr', 'cust')];
  featureStats.setCustomStatsList(customStats);
  stats.setName('eval');
  data.getDatasetsList().push(stats);

  return data;
}
