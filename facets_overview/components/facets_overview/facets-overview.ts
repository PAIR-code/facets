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
import DatasetFeatureStatistics from 'goog:proto.featureStatistics.DatasetFeatureStatistics';
import DatasetFeatureStatisticsList from 'goog:proto.featureStatistics.DatasetFeatureStatisticsList';
import FeatureNameStatistics from 'goog:proto.featureStatistics.FeatureNameStatistics';
import * as utils from '../../common/utils';
import * as fsg from '../../common/feature_statistics_generator';
import { OverviewDataModel } from '../../common/overview_data_model';

Polymer({
  is: 'facets-overview',

  properties: {
    // The feature name search string inputted by the user.
    searchString: {type: String, notify: true},
    // For each sorting type, a map of feature names to the order they should
    // appear in the table.
    _sortOptions: Array,
    // Boolean indicating if the sorted features should be reversed for display.
    _reverseOrder: Boolean,
    // The user-selected sort option.
    _sortOrder: {type: Number, value: 0},
    // The input DatasetFeatureStatisticsList proto.
    protoInput: {type: Object, observer: '_update'},
    // Clicking on a slice/point on a chart causes that piece of that feature to
    // be "selected". The selection is outlined and also is provided a property
    // to the client. In this way, the selection can be used to drive other
    // logic/visualization. This object is a FeatureSelection object.
    featureSliceSelection: {type: Object, notify: true},
    // If true then the visualization is to be used for comparisons of datasets,
    // so always show a legend even if there is currently only one dataset being
    // displayed.
    compareMode: {type: Boolean, value: false},
    _dataModel: {type: Object, value: null},
    _featureSpecArray:
        {type: Array, computed: '_getFeatureSpecArray(_dataModel)'},
    _featureSpecCheckboxes: Array,
  },
  // tslint:disable-next-line:no-any typescript/polymer temporary issue
  _getFeatureSpecArray(this: any, dataModel: OverviewDataModel):
      utils.FeatureSpecAndList[] {
        if (!dataModel) {
          return [];
        }
        // With a new feature spec list (from new data),
        // initialize the feature spec checkboxes to all
        // be true initially.
        const checkboxes: boolean[] = [];
        for (let i = 0; i < utils.FS_NUM_VALUES; i++) {
          checkboxes.push(true);
        }
        this._featureSpecCheckboxes = checkboxes;
        return dataModel.getNonEmptyFeatureSpecLists();
      },
  _getSpecCheckboxText(specAndList: utils.FeatureSpecAndList): string {
    return utils.featureSpecToString(specAndList.spec) + "(" +
      specAndList.features.length + ")";
  },
  _getSpecCheckboxId(specAndList: utils.FeatureSpecAndList): string {
    return String(specAndList.spec);
  },
  // tslint:disable-next-line:no-any typescript/polymer temporary issue
  _featureSpecCheck(this: any, event: any) {
    if (event) {
      // Feature spec checkboxes have IDs that match the feature spec they
      // represent in order to easily keep track of what checkbox has changed
      // on the click-callback.
      const newFeatureSpecCheckboxes: boolean[] = [];
      const updatedIndex = +event.target.id;
      for (let i = 0; i < utils.FS_NUM_VALUES; i++) {
        if (updatedIndex === i) {
          newFeatureSpecCheckboxes.push(event.target.checked);
        } else {
          newFeatureSpecCheckboxes.push(this._featureSpecCheckboxes[i]);
        }
      }
      this._featureSpecCheckboxes = newFeatureSpecCheckboxes;
    }
  },
  _convertInputToProto(
      inValue: DatasetFeatureStatisticsList | Uint8Array | string | null):
          DatasetFeatureStatisticsList |
      null {
        // When using a polymer element within Angular, before a property is
        // bound to a value, it may be bound to an empty Object. Treat this
        // as null.
        if (!inValue ||
            (inValue.constructor === Object &&
             Object.keys(inValue).length === 0)) {
          return null;
        }

        // If the input proto is an array then treat it is binary and convert it
        // to the proto object.
        if (inValue instanceof Uint8Array) {
          return DatasetFeatureStatisticsList.deserializeBinary(inValue);
        }

        // If it is a string, then deserialize it to the proto object.
        if (typeof inValue === 'string' || inValue instanceof String) {
          const chars = atob(inValue as string);
          const bytes = new Uint8Array(chars.length);
          for (let i = 0; i < chars.length; i++) {
            bytes[i] = chars.charCodeAt(i);
          }
          return DatasetFeatureStatisticsList.deserializeBinary(bytes);
        }

        // If provided with a plain object and the proto class has a fromObject
        // method then convert the object into the proto.
        if (inValue.constructor === Object &&
            typeof (DatasetFeatureStatisticsList as any).fromObject ===
            'function') {
          return (DatasetFeatureStatisticsList as any).fromObject(inValue);
        }

        // In this case, a proto object has already been provided as input so
        // no conversion is necessary.
        return inValue;
      },
  // tslint:disable-next-line:no-any typescript/polymer temporary issue
  _update(this: any) {
    this.featureSliceSelection = null;
    let dataModel: OverviewDataModel;
    {
      const data = this._convertInputToProto(this.protoInput);
      if (!data) {
        this._dataModel = null;
        return;
      }
      dataModel = new OverviewDataModel(utils.cleanProto(data));
    }

    this.set('_sortOptions',[{name: 'Feature order', map: {}},
                             {name: 'Non-uniformity', map: {}},
                             {name: 'Alphabetical', map: {}},
                             {name: 'Amount missing/zero', map: {}}]);
    const datasets = dataModel.getDatasetFeatureStatistics().getDatasetsList();

    // Only allow sorting by distribution differences if there are multiple
    // datasets to compare distributions between.
    const allowSortByDistributionDifferences = datasets.length > 1;
    if (allowSortByDistributionDifferences) {
      this.push('_sortOptions', {name: 'Distribution distance', map: {}});
    }

    // Set up the sort order maps, of which there is one per sort order
    // option. The map is of feature names to a numeric value for sorting
    // comparisons.
    const uniqueFeatures = dataModel.getUniqueFeatures()!;
    uniqueFeatures.forEach((d: FeatureNameStatistics, i: number) => {
      // The first sort order is dependent on the order in the input proto.
      this._sortOptions[0].map[d.getName()!] = i;

      // The second sort order is depending on minimum entropy for a feature
      // across all provided datasets.
      const featureHistData =
          dataModel.getDatasetHistogramsForFeature(d.getName()!);
      this._sortOptions[1].map[d.getName()!
      ] = featureHistData.reduce((p: number, d: utils.HistogramForDataset) => {
        const entropy = d.histMap[utils.CHART_SELECTION_STANDARD] ?
            utils.getNormalizedEntropy(
                d.histMap[utils.CHART_SELECTION_STANDARD].getBucketsList()) :
            1;
        return Math.min(p, entropy);
      }, 1);

      // The third sort order is dependent on the name of the feature.
      this._sortOptions[2].map[d.getName()!] = d.getName();

      // The next sort order id dependent on missing/zero values of a feature.
      this._sortOptions[3].map[d.getName()!] =
          datasets.reduce((p: number, dataset: DatasetFeatureStatistics) => {
            const stats = this._getStats(dataModel, dataset, d);
            const percMissingZero = -1 * utils.getRatioMissingAndZero(stats);
            return Math.min(p, percMissingZero);
          }, 0);

      // The last sort order compares distributions between multiple datasets.
      if (allowSortByDistributionDifferences) {
        this._sortOptions[4].map[d.getName()!] =
            -1 * utils.getHistogramDistance(featureHistData);
      }
    }, this);
    this._dataModel = dataModel;
  },
  _getStats(
      dataModel: OverviewDataModel, dataset: DatasetFeatureStatistics,
      feature: FeatureNameStatistics) {
    if (!dataModel || !dataset || !feature) {
      return null;
    }
    return dataModel.getFeature(feature.getName()!, dataset.getName()!);
  },
  // tslint:disable-next-line:no-any typescript/polymer temporary issue
  _getSortFunction(this: any, val: number, reverse: boolean) {
    // Returns the sort function for the provided sort order option index.
    const sortOrderMap = this._sortOptions[val].map;
    const multiplier = reverse ? -1 : 1;
    return (a: FeatureNameStatistics, b: FeatureNameStatistics) => {
      const aVal = sortOrderMap[a.getName()];
      const bVal = sortOrderMap[b.getName()];
      if (typeof aVal == 'undefined' || typeof bVal == 'undefined') {
        return 0;
      }
      return multiplier * (aVal < bVal ? -1 : 1);
    };
  },
  _getFilter(str: string) {
    // Returns a filtering function created for the provided regular expression.
    if (!str) {
      return null;
    } else {
      try {
        const re = new RegExp(str, 'i');
        return (feature: FeatureNameStatistics) => re.test(feature.getName());
      } catch (e) {
        return null;
      }
    }
  },
  // tslint:disable-next-line:no-any typescript/polymer temporary issue
  _getNumericFeatureListItems(
      this: any, dataModel: OverviewDataModel,
      searchString: string, sortOrder: number, reverseOrder: boolean,
      featureSpecCheckboxes: boolean[]) {
    return this._getFeatureListItems(dataModel, searchString, sortOrder, reverseOrder, featureSpecCheckboxes, true);
  },
  // tslint:disable-next-line:no-any typescript/polymer temporary issue
  _getNonNumericFeatureListItems(
      this: any, dataModel: OverviewDataModel,
      searchString: string, sortOrder: number, reverseOrder: boolean,
      featureSpecCheckboxes: boolean[]) {
    return this._getFeatureListItems(dataModel, searchString, sortOrder, reverseOrder, featureSpecCheckboxes, false);
  },
  // tslint:disable-next-line:no-any typescript/polymer temporary issue
  _getFeatureListItems(
      this: any, dataModel: OverviewDataModel,
      searchString: string, sortOrder: number, reverseOrder: boolean,
      featureSpecCheckboxes: boolean[], showNumeric: boolean) {
    if (!dataModel) {
      return [];
    }
    const searchFilter = this._getFilter(searchString);
    const uniqueFeatures = dataModel.getUniqueFeatures()!;
    let filteredFeatures =
      searchFilter ?
        uniqueFeatures.filter(
          f => searchFilter(f) &&
            featureSpecCheckboxes[dataModel.getFeatureSpecForFeature(
              f.getName())]):
        uniqueFeatures.filter(f =>
            featureSpecCheckboxes[dataModel.getFeatureSpecForFeature(
              f.getName())]);
    filteredFeatures = filteredFeatures.filter(
      f => showNumeric ? utils.containsNumericStats(f)
                       : !utils.containsNumericStats(f));
    const returnedFeatureList = filteredFeatures.slice().sort(
        this._getSortFunction(sortOrder, reverseOrder));
    return returnedFeatureList;
  },
  _getControlsWrapperClass(dataModel: OverviewDataModel) {
    return !dataModel || dataModel.getUniqueFeatures().length <= 1 ? 'hidden' :
                                                                     '';
  },
  _getDatasetName(dataModel: OverviewDataModel, index: number) {
    return dataModel.getDatasetNames()[index];
  },
  _getLegendBoxStyle(dataModel: OverviewDataModel, index: number) {
    return 'background-color:' + dataModel.getChartColorString(index);
  },
  _getDatasets(dataModel: OverviewDataModel) {
    if (!dataModel) {
      return null;
    }
    return dataModel.getDatasetFeatureStatistics().getDatasetsList();
  },
  _hasMultipleDatasets(dataModel: OverviewDataModel) {
    if (dataModel == null) {
      return false;
    }
    return dataModel.getDatasetNames().length > 1;
  },
  getStatsProto(datasets: fsg.DataForStatsProto[]): DatasetFeatureStatisticsList {
    return fsg.getStatsProto(datasets);
  },
});
