# Copyright 2017 Google Inc. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
# ==============================================================================
from facets_overview.generic_feature_statistics_generator import GenericFeatureStatisticsGenerator
import numpy as np
import pandas as pd
from tensorflow.python.platform import googletest


class GenericFeatureStatisticsGeneratorTest(googletest.TestCase):

  def setUp(self):
    self.gfsg = GenericFeatureStatisticsGenerator()

  def testProtoFromDataFrames(self):
    data = [[1, 'hi'], [2, 'hello'], [3, 'hi']]
    df = pd.DataFrame(data, columns=['testFeatureInt', 'testFeatureString'])
    dataframes = [{'table': df, 'name': 'testDataset'}]
    p = self.gfsg.ProtoFromDataFrames(dataframes)

    self.assertEqual(1, len(p.datasets))
    test_data = p.datasets[0]
    self.assertEqual('testDataset', test_data.name)
    self.assertEqual(3, test_data.num_examples)
    self.assertEqual(2, len(test_data.features))

    if test_data.features[0].name == 'testFeatureInt':
      numfeat = test_data.features[0]
      stringfeat = test_data.features[1]
    else:
      numfeat = test_data.features[1]
      stringfeat = test_data.features[0]

    self.assertEqual('testFeatureInt', numfeat.name)
    self.assertEqual(self.gfsg.fs_proto.INT, numfeat.type)
    self.assertEqual(1, numfeat.num_stats.min)
    self.assertEqual(3, numfeat.num_stats.max)
    self.assertEqual('testFeatureString', stringfeat.name)
    self.assertEqual(self.gfsg.fs_proto.STRING, stringfeat.type)
    self.assertEqual(2, stringfeat.string_stats.unique)

  def testNdarrayToEntry(self):
    arr = np.array([1.0, 2.0, None, float('nan'), 3.0], dtype=float)

    entry = self.gfsg.NdarrayToEntry(arr)
    self.assertEqual(2, entry['missing'])

    arr = np.array(['a', 'b', float('nan'), 'c'], dtype=str)
    entry = self.gfsg.NdarrayToEntry(arr)
    self.assertEqual(1, entry['missing'])

  def testNdarrayToEntryTimeTypes(self):
    arr = np.array(
        [np.datetime64('2005-02-25'),
         np.datetime64('2006-02-25')],
        dtype=np.datetime64)
    entry = self.gfsg.NdarrayToEntry(arr)
    self.assertEqual([1109289600000000000, 1140825600000000000], entry['vals'])

    arr = np.array(
        [np.datetime64('2009-01-01') - np.datetime64('2008-01-01')],
        dtype=np.timedelta64)
    entry = self.gfsg.NdarrayToEntry(arr)
    self.assertEqual([31622400000000000], entry['vals'])

  def testDTypeToType(self):
    self.assertEqual(self.gfsg.fs_proto.INT,
                     self.gfsg.DtypeToType(np.dtype(np.int32)))
    # Boolean and time types treated as int
    self.assertEqual(self.gfsg.fs_proto.INT,
                     self.gfsg.DtypeToType(np.dtype(np.bool)))
    self.assertEqual(self.gfsg.fs_proto.INT,
                     self.gfsg.DtypeToType(np.dtype(np.datetime64)))
    self.assertEqual(self.gfsg.fs_proto.INT,
                     self.gfsg.DtypeToType(np.dtype(np.timedelta64)))
    self.assertEqual(self.gfsg.fs_proto.FLOAT,
                     self.gfsg.DtypeToType(np.dtype(np.float32)))
    self.assertEqual(self.gfsg.fs_proto.STRING,
                     self.gfsg.DtypeToType(np.dtype(np.str)))
    # Unsupported types treated as string for now
    self.assertEqual(self.gfsg.fs_proto.STRING,
                     self.gfsg.DtypeToType(np.dtype(np.void)))

  def testGetDatasetsProtoFromEntriesLists(self):
    entries = {}
    entries['testFeature'] = {
        'vals': [1, 2, 3],
        'counts': [1, 1, 1],
        'missing': 0,
        'type': self.gfsg.fs_proto.INT
    }
    datasets = [{'entries': entries, 'size': 3, 'name': 'testDataset'}]
    p = self.gfsg.GetDatasetsProto(datasets)

    self.assertEqual(1, len(p.datasets))
    test_data = p.datasets[0]
    self.assertEqual('testDataset', test_data.name)
    self.assertEqual(3, test_data.num_examples)
    self.assertEqual(1, len(test_data.features))
    numfeat = test_data.features[0]
    self.assertEqual('testFeature', numfeat.name)
    self.assertEqual(self.gfsg.fs_proto.INT, numfeat.type)
    self.assertEqual(1, numfeat.num_stats.min)
    self.assertEqual(3, numfeat.num_stats.max)
    hist = numfeat.num_stats.common_stats.num_values_histogram
    buckets = hist.buckets
    self.assertEqual(self.gfsg.histogram_proto.QUANTILES, hist.type)
    self.assertEqual(10, len(buckets))
    self.assertEqual(1, buckets[0].low_value)
    self.assertEqual(1, buckets[0].high_value)
    self.assertEqual(.3, buckets[0].sample_count)
    self.assertEqual(1, buckets[9].low_value)
    self.assertEqual(1, buckets[9].high_value)
    self.assertEqual(.3, buckets[9].sample_count)

  def testGetDatasetsProtoSequenceExampleHistogram(self):
    entries = {}
    entries['testFeature'] = {
        'vals': [1, 2, 2, 3],
        'counts': [1, 2, 1],
        'feat_lens': [1, 2, 1],
        'missing': 0,
        'type': self.gfsg.fs_proto.INT
    }
    datasets = [{'entries': entries, 'size': 3, 'name': 'testDataset'}]
    p = self.gfsg.GetDatasetsProto(datasets)
    hist = p.datasets[0].features[
        0].num_stats.common_stats.feature_list_length_histogram
    buckets = hist.buckets
    self.assertEqual(self.gfsg.histogram_proto.QUANTILES, hist.type)
    self.assertEqual(10, len(buckets))
    self.assertEqual(1, buckets[0].low_value)
    self.assertEqual(1, buckets[0].high_value)
    self.assertEqual(.3, buckets[0].sample_count)
    self.assertEqual(1.8, buckets[9].low_value)
    self.assertEqual(2, buckets[9].high_value)
    self.assertEqual(.3, buckets[9].sample_count)

  def testGetDatasetsProtoWithWhitelist(self):
    entries = {}
    entries['testFeature'] = {
        'vals': [1, 2, 3],
        'counts': [1, 1, 1],
        'missing': 0,
        'type': self.gfsg.fs_proto.INT
    }
    entries['ignoreFeature'] = {
        'vals': [5, 6],
        'counts': [1, 1],
        'missing': 1,
        'type': self.gfsg.fs_proto.INT
    }
    datasets = [{'entries': entries, 'size': 3, 'name': 'testDataset'}]
    p = self.gfsg.GetDatasetsProto(datasets, features=['testFeature'])

    self.assertEqual(1, len(p.datasets))
    test_data = p.datasets[0]
    self.assertEqual('testDataset', test_data.name)
    self.assertEqual(3, test_data.num_examples)
    self.assertEqual(1, len(test_data.features))
    numfeat = test_data.features[0]
    self.assertEqual('testFeature', numfeat.name)
    self.assertEqual(1, numfeat.num_stats.min)

  def testGetDatasetsProtoWithMaxHistigramLevelsCount(self):
    # Selected entries' lengths make it easy to compute average length
    data = [['hi'], ['good'], ['hi'], ['hi'], ['a'], ['a']]
    df = pd.DataFrame(data, columns=['testFeatureString'])
    dataframes = [{'table': df, 'name': 'testDataset'}]
    # Getting proto from ProtoFromDataFrames instead of GetDatasetsProto
    # directly to avoid any hand written values ex: size of dataset.
    p = self.gfsg.ProtoFromDataFrames(dataframes,
                                      histogram_categorical_levels_count=2)

    self.assertEqual(1, len(p.datasets))
    test_data = p.datasets[0]
    self.assertEqual('testDataset', test_data.name)
    self.assertEqual(6, test_data.num_examples)
    self.assertEqual(1, len(test_data.features))
    numfeat = test_data.features[0]
    self.assertEqual('testFeatureString', numfeat.name)

    top_values = numfeat.string_stats.top_values
    self.assertEqual(3, top_values[0].frequency)
    self.assertEqual('hi', top_values[0].value)

    self.assertEqual(3, numfeat.string_stats.unique)
    self.assertEqual(2, numfeat.string_stats.avg_length)

    rank_hist = numfeat.string_stats.rank_histogram
    buckets = rank_hist.buckets
    self.assertEqual(2, len(buckets))
    self.assertEqual('hi', buckets[0].label)
    self.assertEqual(3, buckets[0].sample_count)
    self.assertEqual('a', buckets[1].label)
    self.assertEqual(2, buckets[1].sample_count)

if __name__ == '__main__':
  googletest.main()
