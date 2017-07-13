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
"""Code for generating the feature_statistics proto from generic data.

The proto is used as input for the Overview visualization.
"""

import warnings
from base_generic_feature_statistics_generator import BaseGenericFeatureStatisticsGenerator
import feature_statistics_pb2 as fs


class GenericFeatureStatisticsGenerator(BaseGenericFeatureStatisticsGenerator):
  """Generator of stats proto from generic data."""

  def __init__(self):
    BaseGenericFeatureStatisticsGenerator.__init__(
        self, fs.FeatureNameStatistics, fs.DatasetFeatureStatisticsList,
        fs.Histogram)


def ProtoFromDataFrames(dataframes):
  """Creates a feature statistics proto from a set of pandas dataframes.

  Args:
    dataframes: A list of dicts describing tables for each dataset for the
        proto. Each entry contains a 'table' field of the dataframe of the
          data
        and a 'name' field to identify the dataset in the proto.

  Returns:
    The feature statistics proto for the provided tables.
  """
  warnings.warn(
      'Use GenericFeatureStatisticsGenerator class method instead.',
      DeprecationWarning)
  return GenericFeatureStatisticsGenerator().ProtoFromDataFrames(dataframes)
