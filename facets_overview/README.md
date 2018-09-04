The example code shown in the below explanation can also be found in [this example Jupyter notebook](./Overview_demo.ipynb).

# Feature Statistics Protocol Buffer

The Overview visualization is powered by the feature statistics protocol buffer.
The feature statistics protocol buffer messages store summary statistics for individual feature columns of a set of input data for an ML system (although it will be general enough to be used for summary statistics of any set of data).

The top-level proto is DatasetFeatureStatisticsList, which is a list of DatasetFeatureStatistics.
Each DatasetFeatureStatistics represents the feature statistics for a single dataset.
Each DatasetFeatureStatistics contains a list of FeatureNameStatistics, which contain the statistics for a single feature in a single dataset.

The feature statistics are different depending on the feature data type (numeric, string, or raw bytes).
For numeric features, the statistics include metrics such as min, mean, median, max and standard deviation.
For string feature, the statistics include metrics such as average length, number of unique values and mode.

Feature statistics includes an optional field for weighted statistics.
If the dataset has an example weight feature, it can be used to calculate weighted statistics for every feature in addition to standard statistics.
If a proto contains weighted fields, then the visualization will show the weighted statistics and the user will be able to toggle between unweighted and weighted versions of the charts per feature.

Feature statistics includes an optional field for custom statistics.
If there are additional statistics for features in a dataset that a team wants to track and visualize they can be added to the custom stats field, which is a map of custom stat names to custom stat values (either numbers or strings).
These custom stats will be displayed alongside the standard statistics.

# Feature Statistics Generation

The feature statistics protocol buffer can be created for datasets by the python code provided in the facets_overview/python directory.
Datasets can be analyzed either from a TfRecord files of tensorflow Example protocol buffers, or from pandas DataFrames.

To create the proto from a pandas DataFrame, use the `ProtoFromDataFrames` method of the [GenericFeatureStatisticsGenerator class](./python/generic_feature_statistics_generator.py).
To create the proto from a TfRecord file, use the `ProtoFromTfRecordFiles` method of the [FeatureStatisticsGenerator class](./python/feature_statistics_generator.py).
These generators have dependencies on the numpy and pandas python libraries.
Use of the FeatureStatisticsGenerator class also requires having tensorflow installed.
See those files for further documentation.

Example code:
```python
from generic_feature_statistics_generator import GenericFeatureStatisticsGenerator
import pandas as pd
df =  pd.DataFrame({'num' : [1, 2, 3, 4], 'str' : ['a', 'a', 'b', None]})
proto = GenericFeatureStatisticsGenerator().ProtoFromDataFrames([{'name': 'test', 'table': df}])
```

## Large Datasets

The python code in this repository for generating feature stats only works on datasets that are small enough to fit into memory on your local machine. For distributed generation of feature stats for large datasets, check out the independently-developed [Facets Overview Spark project](https://github.com/gopro/facets-overview-spark).

# Visualization

A proto can easily be visualized in a Jupyter notebook using the installed nbextension.
The proto is stingified and then provided as input to a facets-overview Polymer web component, via the `protoInput` property on the element.
The web component is then displayed in output cell of the notebook.

Example code (continued from above example):
```python
from IPython.core.display import display, HTML
import base64
protostr = base64.b64encode(proto.SerializeToString()).decode("utf-8")
HTML_TEMPLATE = """<link rel="import" href="/nbextensions/facets-dist/facets-jupyter.html" >
        <facets-overview id="elem"></facets-overview>
        <script>
          document.querySelector("#elem").protoInput = "{protostr}";
        </script>"""
html = HTML_TEMPLATE.format(protostr=protostr)
display(HTML(html))
```

The `protoInput` property accepts any of the following three forms of the DatasetFeatureStatisticsList protocol buffer:
* An instance of the DatasetFeatureStatisticsList javascript class, which is the class created by the protocol buffer compiler buffer.
* A UInt8Array containing the serialized binary of a protocol buffer.
* A string containing the base-64 encoded serialized protocol buffer, as shown in the code example above.

### Understanding the Visualization

The visualization contains two tables: one for numeric features and one for categorical (string) features.
Each table contains a row for each feature of that type.
The rows contains calculated statistics and charts showing the distribution of values for that feature across the dataset(s).

Potentially problematic statistics, such as a feature is missing (has no value) for a large number of the examples in a dataset, are shown in red and bolded.

### Global Controls

At the top of the visualization are controls that affect the individual tables.

The sort-by dropdown changes the sort order for the features in each table. The options are:
* Feature order: Ordered by their natural order in the feature statistics proto
* Non-uniformity: Ordered by how non-uniform the distribution of values is (using entropy)
* Alphabetical
* Amount missing/zero: Ordered by how many values of the feature are missing or contain the number 0, with the largest amount being first.
* Distribution distance (only available when comparing multiple datasets): Ordered by the largest difference between distribution shapes for each feature (using chi-square test for shape).

The name filter input box allows filtering the tables by feature names that match the text provided.
The currently-set filter is exposed as the property `searchString`.

The feature checkboxes allow filtering by the type of value for each feature, such as float, int or string.

### Charts

Which chart is displayed for the features in a table is controlled by a dropdown above the charts.
The options for numeric features are:
* A histogram of all values, with 10 equal-width buckets
* A visualization of the deciles of all values
* A visualization of the deciles of the number of values per example
* For datasets that are pandas DataFrames, each example has one value per example, so the visualization is trivial, showing all deciles having the value 1.
  But for tf.Examples, for a given example, a feature can have any number of values.
  One example would be an address feature that lists all known addresses for a person (each Example represents one person).

The options for string features are:
* A column chart of the count of each value in the dataset (this is used if a feature has 20 or fewer unique values).
  A toggle exists to instead show a table of the counts.
* A cumulative distribution function graph of the percentage of all values in the entire dataset that each feature value represents (this is used if a feature has more than 20 unique values).
  A toggle exists to instead show a table of the counts.
* A visualization of the deciles of the number of values per example.

Additionally, the feature statistics proto allows for custom charts to be stored for any feature.
If the input proto to the visualization contains any custom charts, they will be listed in the dropdown as well.

Checkboxes next to the dropdown control some other features of the charts:
* The log checkbox changes the y-axis to log from linear.
* The expand checkbox shows a larger version of the charts.
* The weighted checkbox (only shown when a dataset contains weighted statistics in addition to normal statistics) shows weighted versions of the charts, along with weighted versions of the statistics.
* The percentages checkbox (only shown when the visualization is comparing more than one dataset) changes the y-axis to be percentages of each entire dataset as opposed to raw counts.
  This allows easy comparison of distributions between datasets that have significantly different total numbers of examples (such as a test and train dataset).

# Running Demos (Functional Tests)

There are multiple demos of Overview that can be used as functional tests to ensure new builds are working correctly.
These demos are all found under facets_overview/functional_tests.
To run one, for example the “simple” test, run ```bazel run facets_overview/functional_tests/simple:devserver``` and then navigate your browser to "localhost:6006/facets-overview/functional-tests/simple/index.html” to see the resulting visualization.
 
# Running Unit Tests

Run ```bazel run facets_overview/common/test:devserver``` and then navigate your browser to “localhost:6006/facets-overview/facets-overview/common/test/runner.html”.
The output from the tests can be seen in the developer console.
