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

from facets_overview.base_feature_statistics_generator import BaseFeatureStatisticsGenerator
import facets_overview.feature_statistics_pb2 as fs


class FeatureStatisticsGenerator(BaseFeatureStatisticsGenerator):
  """Generator of stats proto from TF data."""

  def __init__(self):
    BaseFeatureStatisticsGenerator.__init__(self, fs.FeatureNameStatistics,
                                            fs.DatasetFeatureStatisticsList,
                                            fs.Histogram)
