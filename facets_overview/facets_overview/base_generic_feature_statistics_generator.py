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
"""Base class for generating the feature_statistics proto from generic data.

The proto is used as input for the Overview visualization.
"""

import numpy as np
import pandas as pd
import sys


class BaseGenericFeatureStatisticsGenerator(object):
  """Base class for generator of stats proto from generic data."""

  def __init__(self, fs_proto, datasets_proto, histogram_proto):
    self.fs_proto = fs_proto
    self.datasets_proto = datasets_proto
    self.histogram_proto = histogram_proto

  def ProtoFromDataFrames(self, dataframes,
                          histogram_categorical_levels_count=None):
    """Creates a feature statistics proto from a set of pandas dataframes.

    Args:
      dataframes: A list of dicts describing tables for each dataset for the
          proto. Each entry contains a 'table' field of the dataframe of the
            data
          and a 'name' field to identify the dataset in the proto.
      histogram_categorical_levels_count: int, controls the maximum number of
          levels to display in histograms for categorical features.
          Useful to prevent codes/IDs features from bloating the stats object.
          Defaults to None.
    Returns:
      The feature statistics proto for the provided tables.
    """
    datasets = []
    for dataframe in dataframes:
      table = dataframe['table']
      table_entries = {}
      for col in table:
        table_entries[col] = self.NdarrayToEntry(table[col])
      datasets.append({
          'entries': table_entries,
          'size': len(table),
          'name': dataframe['name']
      })
    return self.GetDatasetsProto(
      datasets,
      histogram_categorical_levels_count=histogram_categorical_levels_count)

  def DtypeToType(self, dtype):
    """Converts a Numpy dtype to the FeatureNameStatistics.Type proto enum."""
    if dtype.char in np.typecodes['AllFloat']:
      return self.fs_proto.FLOAT
    elif (dtype.char in np.typecodes['AllInteger'] or dtype == np.bool or
          np.issubdtype(dtype, np.datetime64) or
          np.issubdtype(dtype, np.timedelta64)):
      return self.fs_proto.INT
    else:
      return self.fs_proto.STRING

  def DtypeToNumberConverter(self, dtype):
    """Converts a Numpy dtype to a converter method if applicable.

      The converter method takes in a numpy array of objects of the provided
      dtype
      and returns a numpy array of the numbers backing that object for
      statistical
      analysis. Returns None if no converter is necessary.

    Args:
      dtype: The numpy dtype to make a converter for.

    Returns:
      The converter method or None.
    """
    if np.issubdtype(dtype, np.datetime64):

      def DatetimesToNumbers(dt_list):
        return np.array([pd.Timestamp(dt).value for dt in dt_list])

      return DatetimesToNumbers
    elif np.issubdtype(dtype, np.timedelta64):

      def TimedetlasToNumbers(td_list):
        return np.array([pd.Timedelta(td).value for td in td_list])

      return TimedetlasToNumbers
    else:
      return None

  def NdarrayToEntry(self, x):
    """Converts an ndarray to the Entry format."""
    row_counts = []
    for row in x:
      try:
        rc = np.count_nonzero(~np.isnan(row))
        if rc != 0:
          row_counts.append(rc)
      except TypeError:
        try:
          row_counts.append(row.size)
        except AttributeError:
          row_counts.append(1)

    data_type = self.DtypeToType(x.dtype)
    converter = self.DtypeToNumberConverter(x.dtype)
    flattened = x.ravel()
    orig_size = len(flattened)

    # Remove all None and nan values and count how many were removed.
    flattened = flattened[flattened != np.array(None)]
    if converter:
      flattened = converter(flattened)
    if data_type == self.fs_proto.STRING:
      flattened_temp = []
      for x in flattened:
        try:
          if str(x) != 'nan':
            flattened_temp.append(x)
        except UnicodeEncodeError:
          if x.encode('utf-8') != 'nan':
            flattened_temp.append(x)
      flattened = flattened_temp
    else:
      flattened = flattened[~np.isnan(flattened)].tolist()
    missing = orig_size - len(flattened)
    return {
        'vals': flattened,
        'counts': row_counts,
        'missing': missing,
        'type': data_type
    }

  def GetDatasetsProto(self, datasets, features=None,
                       histogram_categorical_levels_count=None):
    """Generates the feature stats proto from dictionaries of feature values.

    Args:
      datasets: An array of dictionaries, one per dataset, each one containing:
          - 'entries': The dictionary of features in the dataset from the parsed
            examples.
          - 'size': The number of examples parsed for the dataset.
          - 'name': The name of the dataset.
      features: A list of strings that is a whitelist of feature names to create
          feature statistics for. If set to None then all features in the
            dataset
          are analyzed. Defaults to None.
      histogram_categorical_levels_count: int, controls the maximum number of
          levels to display in histograms for categorical features.
          Useful to prevent codes/IDs features from bloating the stats object.
          Defaults to None.

    Returns:
      The feature statistics proto for the provided datasets.
    """
    features_seen = set()
    whitelist_features = set(features) if features else None
    all_datasets = self.datasets_proto()

    # TODO(jwexler): Add ability to generate weighted feature stats
    # if there is a specified weight feature in the dataset.

    # Initialize each dataset
    for dataset in datasets:
      all_datasets.datasets.add(
          name=dataset['name'], num_examples=dataset['size'])
    # This outer loop ensures that for each feature seen in any of the provided
    # datasets, we check the feature once against all datasets.
    for outer_dataset in datasets:
      for key, value in outer_dataset['entries'].items():
        # If we have a feature whitelist and this feature is not in the
        # whitelist then do not process it.
        # If we have processed this feature already, no need to do it again.
        if ((whitelist_features and key not in whitelist_features) or
            key in features_seen):
          continue
        features_seen.add(key)
        # Default to type int if no type is found, so that the fact that all
        # values are missing from this feature can be displayed.
        feature_type = value['type'] if 'type' in value else self.fs_proto.INT
        # Process the found feature for each dataset.
        for j, dataset in enumerate(datasets):
          feat = all_datasets.datasets[j].features.add(
              type=feature_type, name=key.encode('utf-8'))
          value = dataset['entries'].get(key)
          has_data = value is not None and (value['vals'].size != 0
                                            if isinstance(
                                                value['vals'], np.ndarray) else
                                            value['vals'])
          commonstats = None
          # For numeric features, calculate numeric statistics.
          if feat.type in (self.fs_proto.INT, self.fs_proto.FLOAT):
            featstats = feat.num_stats
            commonstats = featstats.common_stats
            if has_data:
              nums = value['vals']
              featstats.std_dev = np.std(nums).item()
              featstats.mean = np.mean(nums).item()
              featstats.min = np.min(nums).item()
              featstats.max = np.max(nums).item()
              featstats.median = np.median(nums).item()
              featstats.num_zeros = len(nums) - np.count_nonzero(nums)

              nums = np.array(nums)
              num_nan = len(nums[np.isnan(nums)])
              num_posinf = len(nums[np.isposinf(nums)])
              num_neginf = len(nums[np.isneginf(nums)])

              # Remove all non-finite (including NaN) values from the numeric
              # values in order to calculate histogram buckets/counts. The
              # inf values will be added back to the first and last buckets.
              nums = nums[np.isfinite(nums)]
              counts, buckets = np.histogram(nums)
              hist = featstats.histograms.add()
              hist.type = self.histogram_proto.STANDARD
              hist.num_nan = num_nan
              for bucket_count in range(len(counts)):
                bucket = hist.buckets.add(
                    low_value=buckets[bucket_count],
                    high_value=buckets[bucket_count + 1],
                    sample_count=counts[bucket_count].item())
                # Add any negative or positive infinities to the first and last
                # buckets in the histogram.
                if bucket_count == 0 and num_neginf > 0:
                  bucket.low_value = float('-inf')
                  bucket.sample_count += num_neginf
                elif bucket_count == len(counts) - 1 and num_posinf > 0:
                  bucket.high_value = float('inf')
                  bucket.sample_count += num_posinf
              if not hist.buckets:
                if num_neginf:
                  hist.buckets.add(
                      low_value=float('-inf'),
                      high_value=float('-inf'),
                      sample_count=num_neginf)
                if num_posinf:
                  hist.buckets.add(
                      low_value=float('inf'),
                      high_value=float('inf'),
                      sample_count=num_posinf)
              self._PopulateQuantilesHistogram(featstats.histograms.add(),
                                               nums.tolist())
          elif feat.type == self.fs_proto.STRING:
            featstats = feat.string_stats
            commonstats = featstats.common_stats
            if has_data:
              strs = []
              for item in value['vals']:
                strs.append(item if hasattr(item, '__len__') else
                  item.encode('utf-8') if hasattr(item, 'encode') else str(
                      item))

              featstats.avg_length = np.mean(np.vectorize(len)(strs))
              vals, counts = np.unique(strs, return_counts=True)
              featstats.unique = len(vals)
              sorted_vals = sorted(zip(counts, vals), reverse=True)
              sorted_vals = sorted_vals[:histogram_categorical_levels_count]
              for val_index, val in enumerate(sorted_vals):
                try:
                  if (sys.version_info.major < 3 or
                      isinstance(val[1], (bytes, bytearray))):
                    printable_val = val[1].decode('UTF-8', 'strict')
                  else:
                    printable_val = val[1]
                except (UnicodeDecodeError, UnicodeEncodeError):
                  printable_val = '__BYTES_VALUE__'
                bucket = featstats.rank_histogram.buckets.add(
                    low_rank=val_index,
                    high_rank=val_index,
                    sample_count=val[0].item(),
                    label=printable_val)
                if val_index < 2:
                  featstats.top_values.add(
                      value=bucket.label, frequency=bucket.sample_count)
          # Add the common stats regardless of the feature type.
          if has_data:
            commonstats.num_missing = value['missing']
            commonstats.num_non_missing = (all_datasets.datasets[j].num_examples
                                           - featstats.common_stats.num_missing)
            commonstats.min_num_values = int(np.min(value['counts']).astype(int))
            commonstats.max_num_values = int(np.max(value['counts']).astype(int))
            commonstats.avg_num_values = np.mean(value['counts'])
            if 'feat_lens' in value and value['feat_lens']:
              self._PopulateQuantilesHistogram(
                  commonstats.feature_list_length_histogram, value['feat_lens'])
            self._PopulateQuantilesHistogram(commonstats.num_values_histogram,
                                             value['counts'])
          else:
            commonstats.num_non_missing = 0
            commonstats.num_missing = all_datasets.datasets[j].num_examples

    return all_datasets

  def _PopulateQuantilesHistogram(self, hist, nums):
    """Fills in the histogram with quantile information from the provided array.

    Args:
      hist: A Histogram proto message to fill in.
      nums: A list of numbers to create a quantiles histogram from.
    """
    if not nums:
      return
    num_quantile_buckets = 10
    quantiles_to_get = [
        x * 100 / num_quantile_buckets for x in range(num_quantile_buckets + 1)
    ]
    quantiles = np.percentile(nums, quantiles_to_get)
    hist.type = self.histogram_proto.QUANTILES
    quantiles_sample_count = float(len(nums)) / num_quantile_buckets
    for low, high in zip(quantiles, quantiles[1:]):
      hist.buckets.add(
          low_value=low, high_value=high, sample_count=quantiles_sample_count)
