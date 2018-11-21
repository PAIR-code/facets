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
"""Base class for generating the feature_statistics proto from TensorFlow data.

The proto is used as input for the Overview visualization.
"""

from functools import partial
from base_generic_feature_statistics_generator import BaseGenericFeatureStatisticsGenerator
import tensorflow as tf


# The feature name used to track sequence length when analyzing
# tf.SequenceExamples.
SEQUENCE_LENGTH_FEATURE_NAME = 'sequence length (derived feature)'


class BaseFeatureStatisticsGenerator(BaseGenericFeatureStatisticsGenerator):
  """Base class for generator of stats proto from TF data."""

  def __init__(self, fs_proto, datasets_proto, histogram_proto):
    BaseGenericFeatureStatisticsGenerator.__init__(
        self, fs_proto, datasets_proto, histogram_proto)

  def ProtoFromTfRecordFiles(self,
                             files,
                             max_entries=10000,
                             features=None,
                             is_sequence=False,
                             iterator_options=None,
                             histogram_categorical_levels_count=None):
    """Creates a feature statistics proto from a set of TFRecord files.

    Args:
      files: A list of dicts describing files for each dataset for the proto.
        Each
          entry contains a 'path' field with the path to the TFRecord file on
            disk
          and a 'name' field to identify the dataset in the proto.
      max_entries: The maximum number of examples to load from each dataset
          in order to create the proto. Defaults to 10000.
      features: A list of strings that is a whitelist of feature names to create
          feature statistics for. If set to None then all features in the
            dataset
          are analyzed. Defaults to None.
      is_sequence: True if the input data from 'tables' are tf.SequenceExamples,
          False if tf.Examples. Defaults to false.
      iterator_options: Options to pass to the iterator that reads the examples.
          Defaults to None.
      histogram_categorical_levels_count: int, controls the maximum number of
          levels to display in histograms for categorical features.
          Useful to prevent codes/IDs features from bloating the stats object.
          Defaults to None.

    Returns:
      The feature statistics proto for the provided files.
    """
    datasets = []
    for entry in files:
      entries, size = self._GetTfRecordEntries(entry['path'], max_entries,
                                               is_sequence, iterator_options)
      datasets.append({'entries': entries, 'size': size, 'name': entry['name']})
    return self.GetDatasetsProto(
      datasets,
      features,
      histogram_categorical_levels_count)

  def _ParseExample(self, example_features, example_feature_lists, entries,
                    index):
    """Parses data from an example, populating a dictionary of feature values.

    Args:
      example_features: A map of strings to tf.Features from the example.
      example_feature_lists: A map of strings to tf.FeatureLists from the
        example.
      entries: A dictionary of all features parsed thus far and arrays of their
          values. This is mutated by the function.
      index: The index of the example to parse from a list of examples.
    Raises:
      TypeError: Raises an exception when a feature has inconsistent types
      across
          examples.
    """
    features_seen = set()

    for feature_list, is_feature in zip(
        [example_features, example_feature_lists], [True, False]):
      sequence_length = None
      for feature_name in feature_list:
        # If this feature has not been seen in previous examples, then
        # initialize its entry into the entries dictionary.
        if feature_name not in entries:
          entries[feature_name] = {
              'vals': [],
              'counts': [],
              'feat_lens': [],
              'missing': index
          }

        feature_entry = entries[feature_name]
        feature = feature_list[feature_name]

        value_type = None
        value_list = []
        if is_feature:
          # If parsing a tf.Feature, extract the type and values simply.
          if feature.HasField('float_list'):
            value_list = feature.float_list.value
            value_type = self.fs_proto.FLOAT
          elif feature.HasField('bytes_list'):
            value_list = feature.bytes_list.value
            value_type = self.fs_proto.STRING
          elif feature.HasField('int64_list'):
            value_list = feature.int64_list.value
            value_type = self.fs_proto.INT
        else:
          # If parsing a tf.FeatureList, get the type and values by iterating
          # over all Features in the FeatureList.
          sequence_length = len(feature.feature)
          if sequence_length != 0 and feature.feature[0].HasField('float_list'):
            for feat in feature.feature:
              for value in feat.float_list.value:
                value_list.append(value)
            value_type = self.fs_proto.FLOAT
          elif sequence_length != 0 and feature.feature[0].HasField(
              'bytes_list'):
            for feat in feature.feature:
              for value in feat.bytes_list.value:
                value_list.append(value)
            value_type = self.fs_proto.STRING
          elif sequence_length != 0 and feature.feature[0].HasField(
              'int64_list'):
            for feat in feature.feature:
              for value in feat.int64_list.value:
                value_list.append(value)
            value_type = self.fs_proto.INT
        if value_type is not None:
          if 'type' not in feature_entry:
            feature_entry['type'] = value_type
          elif feature_entry['type'] != value_type:
            raise TypeError('type mismatch for feature ' + feature_name)
        feature_entry['counts'].append(len(value_list))
        feature_entry['vals'].extend(value_list)
        if sequence_length is not None:
          feature_entry['feat_lens'].append(sequence_length)
        if value_list:
          features_seen.add(feature_name)

    # For all previously-seen features not found in this example, update the
    # feature's missing value.
    for f in entries:
      fv = entries[f]
      if f not in features_seen:
        fv['missing'] += 1

  def _GetEntries(self,
                  paths,
                  max_entries,
                  iterator_from_file,
                  is_sequence=False):
    """Extracts examples into a dictionary of feature values.

    Args:
      paths: A list of the paths to the files to parse.
      max_entries: The maximum number of examples to load.
      iterator_from_file: A method that takes a file path string and returns an
          iterator to the examples in that file.
      is_sequence: True if the input data from 'iterator_from_file' are
           tf.SequenceExamples, False if tf.Examples. Defaults to false.

    Returns:
      A tuple with two elements:
          - A dictionary of all features parsed thus far and arrays of their
            values.
          - The number of examples parsed.
    """
    entries = {}
    index = 0
    for filepath in paths:
      reader = iterator_from_file(filepath)
      for record in reader:
        if is_sequence:
          sequence_example = tf.train.SequenceExample.FromString(record)
          self._ParseExample(sequence_example.context.feature,
                             sequence_example.feature_lists.feature_list,
                             entries, index)
        else:
          self._ParseExample(
              tf.train.Example.FromString(record).features.feature, [], entries,
              index)
        index += 1
        if index == max_entries:
          return entries, index
    return entries, index

  def _GetTfRecordEntries(self, path, max_entries, is_sequence,
                          iterator_options):
    """Extracts TFRecord examples into a dictionary of feature values.

    Args:
      path: The path to the TFRecord file(s).
      max_entries: The maximum number of examples to load.
      is_sequence: True if the input data from 'path' are tf.SequenceExamples,
           False if tf.Examples. Defaults to false.
      iterator_options: Options to pass to the iterator that reads the examples.
          Defaults to None.

    Returns:
      A tuple with two elements:
          - A dictionary of all features parsed thus far and arrays of their
            values.
          - The number of examples parsed.
    """
    return self._GetEntries([path], max_entries,
                            partial(
                                tf.compat.v1.io.tf_record_iterator,
                                options=iterator_options), is_sequence)
