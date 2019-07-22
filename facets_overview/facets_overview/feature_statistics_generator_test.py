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
from facets_overview.feature_statistics_generator import FeatureStatisticsGenerator
import numpy as np
import tensorflow as tf
from tensorflow.python.platform import googletest


class FeatureStatisticsGeneratorTest(googletest.TestCase):

  def setUp(self):
    self.fs = FeatureStatisticsGenerator()

  def testParseExampleInt(self):
    # Tests parsing examples of integers
    examples = []
    for i in range(50):
      example = tf.train.Example()
      example.features.feature['num'].int64_list.value.append(i)
      examples.append(example)

    entries = {}
    for i, example in enumerate(examples):
      self.fs._ParseExample(example.features.feature, [], entries, i)

    self.assertEqual(1, len(entries))
    self.assertIn('num', entries)
    info = entries['num']
    self.assertEqual(0, info['missing'])
    self.assertEqual(self.fs.fs_proto.INT, info['type'])
    for i in range(len(examples)):
      self.assertEqual(1, info['counts'][i])
      self.assertEqual(i, info['vals'][i])

  def testParseExampleMissingValueList(self):
    # Tests parsing examples of integers
    examples = []
    example = tf.train.Example()
    # pylint: disable=pointless-statement
    example.features.feature['str']
    # pylint: enable=pointless-statement
    examples.append(example)
    example = tf.train.Example()
    example.features.feature['str'].bytes_list.value.append(b'test')
    examples.append(example)

    entries = {}
    for i, example in enumerate(examples):
      self.fs._ParseExample(example.features.feature, [], entries, i)

    self.assertEqual(1, len(entries))
    self.assertIn('str', entries)
    info = entries['str']
    self.assertEqual(1, info['missing'])
    self.assertEqual(self.fs.fs_proto.STRING, info['type'])
    self.assertEqual(0, info['counts'][0])
    self.assertEqual(1, info['counts'][1])

  def _check_sequence_example_entries(self,
                                      entries,
                                      n_examples,
                                      n_features,
                                      feat_len=None):
    self.assertIn('num', entries)
    info = entries['num']
    self.assertEqual(0, info['missing'])
    self.assertEqual(self.fs.fs_proto.INT, info['type'])
    for i in range(n_examples):
      self.assertEqual(n_features, info['counts'][i])
      if feat_len is not None:
        self.assertEqual(feat_len, info['feat_lens'][i])
    for i in range(n_examples * n_features):
      self.assertEqual(i, info['vals'][i])
    if feat_len is None:
      self.assertEqual(0, len(info['feat_lens']))

  def testParseExampleSequenceContext(self):
    # Tests parsing examples of integers in context field
    examples = []
    for i in range(50):
      example = tf.train.SequenceExample()
      example.context.feature['num'].int64_list.value.append(i)
      examples.append(example)

    entries = {}
    for i, example in enumerate(examples):
      self.fs._ParseExample(example.context.feature,
                            example.feature_lists.feature_list, entries, i)
    self._check_sequence_example_entries(entries, 50, 1)
    self.assertEqual(1, len(entries))

  def testParseExampleSequenceFeatureList(self):
    examples = []
    for i in range(50):
      example = tf.train.SequenceExample()
      feat = example.feature_lists.feature_list['num'].feature.add()
      feat.int64_list.value.append(i)
      examples.append(example)

    entries = {}
    for i, example in enumerate(examples):
      self.fs._ParseExample(example.context.feature,
                            example.feature_lists.feature_list, entries, i)
    self._check_sequence_example_entries(entries, 50, 1, 1)

  def testParseExampleSequenceFeatureListMultipleEntriesInner(self):
    examples = []
    for i in range(2):
      example = tf.train.SequenceExample()
      feat = example.feature_lists.feature_list['num'].feature.add()
      for j in range(25):
        feat.int64_list.value.append(i * 25 + j)
      examples.append(example)

    entries = {}
    for i, example in enumerate(examples):
      self.fs._ParseExample(example.context.feature,
                            example.feature_lists.feature_list, entries, i)

    self._check_sequence_example_entries(entries, 2, 25, 1)

  def testParseExampleSequenceFeatureListMultipleEntriesOuter(self):
    # Tests parsing examples of integers in context field
    examples = []
    for i in range(2):
      example = tf.train.SequenceExample()
      for j in range(25):
        feat = example.feature_lists.feature_list['num'].feature.add()
        feat.int64_list.value.append(i * 25 + j)
      examples.append(example)

    entries = {}
    for i, example in enumerate(examples):
      self.fs._ParseExample(example.context.feature,
                            example.feature_lists.feature_list, entries, i)
    self._check_sequence_example_entries(entries, 2, 25, 25)

  def testVaryingCountsAndMissing(self):
    # Tests parsing examples of when some examples have missing features
    examples = []
    for i in range(5):
      example = tf.train.Example()
      example.features.feature['other'].int64_list.value.append(0)
      for _ in range(i):
        example.features.feature['num'].int64_list.value.append(i)
      examples.append(example)
    example = tf.train.Example()
    example.features.feature['other'].int64_list.value.append(0)
    examples.append(example)

    entries = {}
    for i, example in enumerate(examples):
      self.fs._ParseExample(example.features.feature, [], entries, i)

    info = entries['num']
    self.assertEqual(2, info['missing'])
    self.assertEqual(4, len(info['counts']))
    for i in range(4):
      self.assertEqual(i + 1, info['counts'][i])
    self.assertEqual(10, len(info['vals']))

  def testParseExampleStringsAndFloats(self):
    # Tests parsing examples of string and float features
    examples = []
    for i in range(50):
      example = tf.train.Example()
      example.features.feature['str'].bytes_list.value.append(b'hi')
      example.features.feature['float'].float_list.value.append(i)
      examples.append(example)

    entries = {}
    for i, example in enumerate(examples):
      self.fs._ParseExample(example.features.feature, [], entries, i)

    self.assertEqual(2, len(entries))
    self.assertEqual(self.fs.fs_proto.FLOAT, entries['float']['type'])
    self.assertEqual(self.fs.fs_proto.STRING, entries['str']['type'])
    for i in range(len(examples)):
      self.assertEqual(1, entries['str']['counts'][i])
      self.assertEqual(1, entries['float']['counts'][i])
      self.assertEqual(i, entries['float']['vals'][i])
      self.assertEqual('hi', entries['str']['vals'][i].decode(
          'UTF-8', 'strict'))

  def testParseExamplesTypeMismatch(self):
    examples = []
    example = tf.train.Example()
    example.features.feature['feat'].int64_list.value.append(0)
    examples.append(example)
    example = tf.train.Example()
    example.features.feature['feat'].bytes_list.value.append(b'str')
    examples.append(example)

    entries = {}
    self.fs._ParseExample(examples[0].features.feature, [], entries, 0)

    with self.assertRaises(TypeError):
      self.fs._ParseExample(examples[1].features.feature, [], entries, 1)

  def testGetDatasetsProtoFromEntriesLists(self):
    entries = {}
    entries['testFeature'] = {
        'vals': [1, 2, 3],
        'counts': [1, 1, 1],
        'missing': 0,
        'type': self.fs.fs_proto.INT
    }
    datasets = [{'entries': entries, 'size': 3, 'name': 'testDataset'}]
    p = self.fs.GetDatasetsProto(datasets)

    self.assertEqual(1, len(p.datasets))
    test_data = p.datasets[0]
    self.assertEqual('testDataset', test_data.name)
    self.assertEqual(3, test_data.num_examples)
    self.assertEqual(1, len(test_data.features))
    numfeat = test_data.features[0]
    self.assertEqual('testFeature', numfeat.name)
    self.assertEqual(self.fs.fs_proto.INT, numfeat.type)
    self.assertEqual(1, numfeat.num_stats.min)
    self.assertEqual(3, numfeat.num_stats.max)

  def testGetProtoNums(self):
    # Tests converting int examples into the feature stats proto
    examples = []
    for i in range(50):
      example = tf.train.Example()
      example.features.feature['num'].int64_list.value.append(i)
      examples.append(example)
    example = tf.train.Example()
    example.features.feature['other'].int64_list.value.append(0)
    examples.append(example)

    entries = {}
    for i, example in enumerate(examples):
      self.fs._ParseExample(example.features.feature, [], entries, i)

    datasets = [{'entries': entries, 'size': len(examples), 'name': 'test'}]
    p = self.fs.GetDatasetsProto(datasets)

    self.assertEqual(1, len(p.datasets))
    test_data = p.datasets[0]
    self.assertEqual('test', test_data.name)
    self.assertEqual(51, test_data.num_examples)

    numfeat = test_data.features[0] if (
        test_data.features[0].name == 'num') else test_data.features[1]
    self.assertEqual('num', numfeat.name)
    self.assertEqual(self.fs.fs_proto.INT, numfeat.type)
    self.assertEqual(0, numfeat.num_stats.min)
    self.assertEqual(49, numfeat.num_stats.max)
    self.assertEqual(24.5, numfeat.num_stats.mean)
    self.assertEqual(24.5, numfeat.num_stats.median)
    self.assertEqual(1, numfeat.num_stats.num_zeros)
    self.assertAlmostEqual(14.430869689, numfeat.num_stats.std_dev, 4)
    self.assertEqual(1, numfeat.num_stats.common_stats.num_missing)
    self.assertEqual(50, numfeat.num_stats.common_stats.num_non_missing)
    self.assertEqual(1, numfeat.num_stats.common_stats.min_num_values)
    self.assertEqual(1, numfeat.num_stats.common_stats.max_num_values)
    self.assertAlmostEqual(1, numfeat.num_stats.common_stats.avg_num_values, 4)
    hist = numfeat.num_stats.common_stats.num_values_histogram
    buckets = hist.buckets
    self.assertEqual(self.fs.histogram_proto.QUANTILES, hist.type)
    self.assertEqual(10, len(buckets))
    self.assertEqual(1, buckets[0].low_value)
    self.assertEqual(1, buckets[0].high_value)
    self.assertEqual(5, buckets[0].sample_count)
    self.assertEqual(1, buckets[9].low_value)
    self.assertEqual(1, buckets[9].high_value)
    self.assertEqual(5, buckets[9].sample_count)

    self.assertEqual(2, len(numfeat.num_stats.histograms))
    buckets = numfeat.num_stats.histograms[0].buckets
    self.assertEqual(self.fs.histogram_proto.STANDARD,
                     numfeat.num_stats.histograms[0].type)
    self.assertEqual(10, len(buckets))
    self.assertEqual(0, buckets[0].low_value)
    self.assertEqual(4.9, buckets[0].high_value)
    self.assertEqual(5, buckets[0].sample_count)
    self.assertAlmostEqual(44.1, buckets[9].low_value)
    self.assertEqual(49, buckets[9].high_value)
    self.assertEqual(5, buckets[9].sample_count)

    buckets = numfeat.num_stats.histograms[1].buckets
    self.assertEqual(self.fs.histogram_proto.QUANTILES,
                     numfeat.num_stats.histograms[1].type)
    self.assertEqual(10, len(buckets))
    self.assertEqual(0, buckets[0].low_value)
    self.assertEqual(4.9, buckets[0].high_value)
    self.assertEqual(5, buckets[0].sample_count)
    self.assertAlmostEqual(44.1, buckets[9].low_value)
    self.assertEqual(49, buckets[9].high_value)
    self.assertEqual(5, buckets[9].sample_count)

  def testQuantiles(self):
    examples = []
    for i in range(50):
      example = tf.train.Example()
      example.features.feature['num'].int64_list.value.append(i)
      examples.append(example)
    for i in range(50):
      example = tf.train.Example()
      example.features.feature['num'].int64_list.value.append(100)
      examples.append(example)

    entries = {}
    for i, example in enumerate(examples):
      self.fs._ParseExample(example.features.feature, [], entries, i)

    datasets = [{'entries': entries, 'size': len(examples), 'name': 'test'}]
    p = self.fs.GetDatasetsProto(datasets)

    numfeat = p.datasets[0].features[0]
    self.assertEqual(2, len(numfeat.num_stats.histograms))
    self.assertEqual(self.fs.histogram_proto.QUANTILES,
                     numfeat.num_stats.histograms[1].type)
    buckets = numfeat.num_stats.histograms[1].buckets
    self.assertEqual(10, len(buckets))
    self.assertEqual(0, buckets[0].low_value)
    self.assertEqual(9.9, buckets[0].high_value)
    self.assertEqual(10, buckets[0].sample_count)
    self.assertEqual(100, buckets[9].low_value)
    self.assertEqual(100, buckets[9].high_value)
    self.assertEqual(10, buckets[9].sample_count)

  def testInfinityAndNan(self):
    examples = []
    for i in range(50):
      example = tf.train.Example()
      example.features.feature['num'].float_list.value.append(i)
      examples.append(example)
    example = tf.train.Example()
    example.features.feature['num'].float_list.value.append(float('inf'))
    examples.append(example)
    example = tf.train.Example()
    example.features.feature['num'].float_list.value.append(float('-inf'))
    examples.append(example)
    example = tf.train.Example()
    example.features.feature['num'].float_list.value.append(float('nan'))
    examples.append(example)

    entries = {}
    for i, example in enumerate(examples):
      self.fs._ParseExample(example.features.feature, [], entries, i)

    datasets = [{'entries': entries, 'size': len(examples), 'name': 'test'}]
    p = self.fs.GetDatasetsProto(datasets)

    numfeat = p.datasets[0].features[0]

    self.assertEqual('num', numfeat.name)
    self.assertEqual(self.fs.fs_proto.FLOAT, numfeat.type)
    self.assertTrue(np.isnan(numfeat.num_stats.min))
    self.assertTrue(np.isnan(numfeat.num_stats.max))
    self.assertTrue(np.isnan(numfeat.num_stats.mean))
    self.assertTrue(np.isnan(numfeat.num_stats.median))
    self.assertEqual(1, numfeat.num_stats.num_zeros)
    self.assertTrue(np.isnan(numfeat.num_stats.std_dev))
    self.assertEqual(53, numfeat.num_stats.common_stats.num_non_missing)
    hist = buckets = numfeat.num_stats.histograms[0]
    buckets = hist.buckets
    self.assertEqual(self.fs.histogram_proto.STANDARD, hist.type)
    self.assertEqual(1, hist.num_nan)
    self.assertEqual(10, len(buckets))
    self.assertEqual(float('-inf'), buckets[0].low_value)
    self.assertEqual(4.9, buckets[0].high_value)
    self.assertEqual(6, buckets[0].sample_count)
    self.assertEqual(44.1, buckets[9].low_value)
    self.assertEqual(float('inf'), buckets[9].high_value)
    self.assertEqual(6, buckets[9].sample_count)

  def testInfinitysOnly(self):
    examples = []
    example = tf.train.Example()
    example.features.feature['num'].float_list.value.append(float('inf'))
    examples.append(example)
    example = tf.train.Example()
    example.features.feature['num'].float_list.value.append(float('-inf'))
    examples.append(example)

    entries = {}
    for i, example in enumerate(examples):
      self.fs._ParseExample(example.features.feature, [], entries, i)

    datasets = [{'entries': entries, 'size': len(examples), 'name': 'test'}]
    p = self.fs.GetDatasetsProto(datasets)

    numfeat = p.datasets[0].features[0]
    hist = buckets = numfeat.num_stats.histograms[0]
    buckets = hist.buckets
    self.assertEqual(self.fs.histogram_proto.STANDARD, hist.type)
    self.assertEqual(10, len(buckets))
    self.assertEqual(float('-inf'), buckets[0].low_value)
    self.assertEqual(0.1, buckets[0].high_value)
    self.assertEqual(1, buckets[0].sample_count)
    self.assertEqual(0.9, buckets[9].low_value)
    self.assertEqual(float('inf'), buckets[9].high_value)
    self.assertEqual(1, buckets[9].sample_count)

  def testGetProtoStrings(self):
    # Tests converting string examples into the feature stats proto
    examples = []
    for i in range(2):
      example = tf.train.Example()
      example.features.feature['str'].bytes_list.value.append(b'hello')
      examples.append(example)
    for i in range(3):
      example = tf.train.Example()
      example.features.feature['str'].bytes_list.value.append(b'hi')
      examples.append(example)
    example = tf.train.Example()
    example.features.feature['str'].bytes_list.value.append(b'hey')
    examples.append(example)

    entries = {}
    for i, example in enumerate(examples):
      self.fs._ParseExample(example.features.feature, [], entries, i)

    datasets = [{'entries': entries, 'size': len(examples), 'name': 'test'}]
    p = self.fs.GetDatasetsProto(datasets)

    self.assertEqual(1, len(p.datasets))
    test_data = p.datasets[0]
    self.assertEqual('test', test_data.name)
    self.assertEqual(6, test_data.num_examples)

    strfeat = test_data.features[0]
    self.assertEqual('str', strfeat.name)
    self.assertEqual(self.fs.fs_proto.STRING, strfeat.type)
    self.assertEqual(3, strfeat.string_stats.unique)
    self.assertAlmostEqual(19 / 6.0, strfeat.string_stats.avg_length, 4)
    self.assertEqual(0, strfeat.string_stats.common_stats.num_missing)
    self.assertEqual(6, strfeat.string_stats.common_stats.num_non_missing)
    self.assertEqual(1, strfeat.string_stats.common_stats.min_num_values)
    self.assertEqual(1, strfeat.string_stats.common_stats.max_num_values)
    self.assertEqual(1, strfeat.string_stats.common_stats.avg_num_values)
    hist = strfeat.string_stats.common_stats.num_values_histogram
    buckets = hist.buckets
    self.assertEqual(self.fs.histogram_proto.QUANTILES, hist.type)
    self.assertEqual(10, len(buckets))
    self.assertEqual(1, buckets[0].low_value)
    self.assertEqual(1, buckets[0].high_value)
    self.assertEqual(.6, buckets[0].sample_count)
    self.assertEqual(1, buckets[9].low_value)
    self.assertEqual(1, buckets[9].high_value)
    self.assertEqual(.6, buckets[9].sample_count)

    self.assertEqual(2, len(strfeat.string_stats.top_values))
    self.assertEqual(3, strfeat.string_stats.top_values[0].frequency)
    self.assertEqual('hi', strfeat.string_stats.top_values[0].value)
    self.assertEqual(2, strfeat.string_stats.top_values[1].frequency)
    self.assertEqual('hello', strfeat.string_stats.top_values[1].value)

    buckets = strfeat.string_stats.rank_histogram.buckets
    self.assertEqual(3, len(buckets))
    self.assertEqual(0, buckets[0].low_rank)
    self.assertEqual(0, buckets[0].high_rank)
    self.assertEqual(3, buckets[0].sample_count)
    self.assertEqual('hi', buckets[0].label)
    self.assertEqual(2, buckets[2].low_rank)
    self.assertEqual(2, buckets[2].high_rank)
    self.assertEqual(1, buckets[2].sample_count)
    self.assertEqual('hey', buckets[2].label)

  def testGetProtoMultipleDatasets(self):
    # Tests converting multiple datsets into the feature stats proto
    # including ensuring feature order is consistent in the protos.
    examples1 = []
    for i in range(2):
      example = tf.train.Example()
      example.features.feature['str'].bytes_list.value.append(b'one')
      example.features.feature['num'].int64_list.value.append(0)
      examples1.append(example)
    examples2 = []
    example = tf.train.Example()
    example.features.feature['num'].int64_list.value.append(1)
    example.features.feature['str'].bytes_list.value.append(b'two')
    examples2.append(example)

    entries1 = {}
    for i, example1 in enumerate(examples1):
      self.fs._ParseExample(example1.features.feature, [], entries1, i)
    entries2 = {}
    for i, example2 in enumerate(examples2):
      self.fs._ParseExample(example2.features.feature, [], entries2, i)

    datasets = [{
        'entries': entries1,
        'size': len(examples1),
        'name': 'test1'
    }, {
        'entries': entries2,
        'size': len(examples2),
        'name': 'test2'
    }]
    p = self.fs.GetDatasetsProto(datasets)

    self.assertEqual(2, len(p.datasets))
    test_data_1 = p.datasets[0]
    self.assertEqual('test1', test_data_1.name)
    self.assertEqual(2, test_data_1.num_examples)
    num_feat_index = 0 if test_data_1.features[0].name == 'num' else 1
    self.assertEqual(0, test_data_1.features[num_feat_index].num_stats.max)
    test_data_2 = p.datasets[1]
    self.assertEqual('test2', test_data_2.name)
    self.assertEqual(1, test_data_2.num_examples)
    self.assertEqual(1, test_data_2.features[num_feat_index].num_stats.max)

  def testGetEntriesNoFiles(self):
    features, num_examples = self.fs._GetEntries(['test'], 10,
                                                 lambda unused_path: [])
    self.assertEqual(0, num_examples)
    self.assertEqual({}, features)

  @staticmethod
  def get_example_iter():

    def ex_iter(unused_filename):
      examples = []
      for i in range(50):
        example = tf.train.Example()
        example.features.feature['num'].int64_list.value.append(i)
        examples.append(example.SerializeToString())
      return examples

    return ex_iter

  def testGetEntries_one(self):
    features, num_examples = self.fs._GetEntries(['test'], 1,
                                                 self.get_example_iter())
    self.assertEqual(1, num_examples)
    self.assertTrue('num' in features)

  def testGetEntries_oneFile(self):
    unused_features, num_examples = self.fs._GetEntries(['test'], 1000,
                                                        self.get_example_iter())
    self.assertEqual(50, num_examples)

  def testGetEntries_twoFiles(self):
    unused_features, num_examples = self.fs._GetEntries(['test0', 'test1'],
                                                        1000,
                                                        self.get_example_iter())
    self.assertEqual(100, num_examples)

  def testGetEntries_stopInSecondFile(self):
    unused_features, num_examples = self.fs._GetEntries([
        'test@0', 'test@1', 'test@2', 'test@3', 'test@4', 'test@5', 'test@6',
        'test@7', 'test@8', 'test@9'
    ], 75, self.get_example_iter())
    self.assertEqual(75, num_examples)


if __name__ == '__main__':
  googletest.main()
