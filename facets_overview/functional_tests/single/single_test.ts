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
import DatasetFeatureStatisticsList from 'goog:proto.featureStatistics.DatasetFeatureStatisticsList';
import FeatureNameStatistics from 'goog:proto.featureStatistics.FeatureNameStatistics';
import Histogram from 'goog:proto.featureStatistics.Histogram';
import StructStatistics from 'goog:proto.featureStatistics.StructStatistics';
import { DataPoint, generateStats } from '../../common/feature_statistics_generator';
import { FeatureSelection } from '../../common/utils';
import * as th from '../test_helpers/test_helpers';

Polymer({
  is: 'single-test',

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
  const dataPoints: DataPoint[] = [];
  const longName = 'single-value-str_reallylong_name_' +
                   'name_reallylong_name_name_reallylong_name_' +
                   'name_reallylong_name_name_reallylong_name_';
  dataPoints.push({'single-value-int': 5,
                   'has-inf': Infinity,
                   'both-infs': [Infinity, -Infinity],
                    [longName]: 'test'});

  for (let i = 0; i < 20; i++) {
    dataPoints.push({'val': d3.randomNormal(10)(),
                     'has-inf': d3.randomNormal(5)(),
                     'both-infs': d3.randomNormal(5)()});
  }
  const stats = generateStats(dataPoints);

  // Add a BYTES feature.
  const bs = new BytesStatistics();
  let cs = new CommonStatistics();
  cs.setNumMissing(0);
  cs.setNumNonMissing(20);
  cs.setMinNumValues(1);
  cs.setMaxNumValues(1);
  cs.setAvgNumValues(1);
  bs.setCommonStats(cs);
  bs.setUnique(19);
  bs.setAvgNumBytes(500)
  bs.setMinNumBytes(250);
  bs.setMaxNumBytes(1000);
  let f = new FeatureNameStatistics();
  f.setName('encodedImageBytes');
  f.setType(FeatureNameStatistics.Type.BYTES);
  f.setBytesStats(bs);
  stats.getFeaturesList().push(f);

  // Add a STRUCT feature.
  const ss = new StructStatistics();
  cs = new CommonStatistics();
  cs.setNumMissing(1);
  cs.setNumNonMissing(19);
  cs.setMinNumValues(1);
  cs.setMaxNumValues(2);
  cs.setAvgNumValues(1.05);
  ss.setCommonStats(cs);
  f = new FeatureNameStatistics();
  f.setName('structFeature');
  f.setType(FeatureNameStatistics.Type.STRUCT);
  f.setStructStats(ss);
  stats.getFeaturesList().push(f);

  stats.setName('train');
  data.getDatasetsList().push(stats);
  return data;
}
