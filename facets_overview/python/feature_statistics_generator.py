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
"""Class for generating the feature_statistics proto.

The proto is used as input for the Overview visualization.
"""

import warnings
from base_feature_statistics_generator import BaseFeatureStatisticsGenerator
import feature_statistics_pb2 as fs


class FeatureStatisticsGenerator(BaseFeatureStatisticsGenerator):
  """Generator of stats proto from TF data."""

  def __init__(self):
    BaseFeatureStatisticsGenerator.__init__(self, fs.FeatureNameStatistics,
                                            fs.DatasetFeatureStatisticsList,
                                            fs.Histogram)


def ProtoFromTfRecordFiles(files,
                           max_entries=10000,
                           features=None,
                           is_sequence=False,
                           iterator_options=None):
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

  Returns:
    The feature statistics proto for the provided files.
  """
  warnings.warn(
      'Use GenericFeatureStatisticsGenerator class method instead.',
      DeprecationWarning)
  return FeatureStatisticsGenerator().ProtoFromTfRecordFiles(
      files, max_entries, features, is_sequence, iterator_options)
