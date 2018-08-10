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
import DatasetFeatureStatisticsList from 'goog:proto.featureStatistics.DatasetFeatureStatisticsList';
import DatasetFeatureStatistics from 'goog:proto.featureStatistics.DatasetFeatureStatistics';
import BytesStatistics from 'goog:proto.featureStatistics.BytesStatistics';
import CommonStatistics from 'goog:proto.featureStatistics.CommonStatistics';
import CustomStatistic from 'goog:proto.featureStatistics.CustomStatistic';
import NumericStatistics from 'goog:proto.featureStatistics.NumericStatistics';
import StringStatistics from 'goog:proto.featureStatistics.StringStatistics';
import StructStatistics from 'goog:proto.featureStatistics.StructStatistics';
import FeatureNameStatistics from 'goog:proto.featureStatistics.FeatureNameStatistics';
import Histogram from 'goog:proto.featureStatistics.Histogram';
import RankHistogram from 'goog:proto.featureStatistics.RankHistogram';
import WeightedNumericStatistics from 'goog:proto.featureStatistics.WeightedNumericStatistics';
import WeightedStringStatistics from 'goog:proto.featureStatistics.WeightedStringStatistics';
import * as utils from '../utils';
import { OverviewDataModel } from '../overview_data_model';

const {expect} = chai;

describe('constructor', () => {
  it('keeps the data given to it', () => {
    const d = new DatasetFeatureStatisticsList();
    const dm = new OverviewDataModel(d);
    expect(dm.getDatasetFeatureStatistics()).to.equal(d);
  });

  it('creates a color scale', () => {
    const dm = new OverviewDataModel(new DatasetFeatureStatisticsList());
    expect(dm.getColorScale()).to.not.equal(undefined);
  });

  it('creates a color scale from the provided data', () => {
    const d = new DatasetFeatureStatisticsList();
    d.setDatasetsList([]);
    {
      const entry = new DatasetFeatureStatistics();
      entry.setName('dataset-name');
      d.getDatasetsList().push(entry);
    }
    const dm = new OverviewDataModel(d);
    const scale: Plottable.Scales.Color = dm.getColorScale();
    expect(scale.domain().length).to.equal(1);
    expect(scale.domain()[0]).to.equal('dataset-name');
  });

  it('throws an error when given unclean data', () => {
    const dl = new DatasetFeatureStatisticsList();
    const d = new DatasetFeatureStatistics();
    dl.setDatasetsList([d]);
    d.setFeaturesList([new FeatureNameStatistics()]);
    d.getFeaturesList()![0].setName('f');
    const stats = new StringStatistics();
    d.getFeaturesList()![0].setStringStats(stats);
    const f = new StringStatistics.FreqAndValue();
    f.setDeprecatedFreq(10);
    stats.setTopValuesList([f]);

    expect(() => new OverviewDataModel(dl)).to.throw();
  });
});

describe('getDatasetNames', () => {
  it('returns empty array if no data', () => {
    expect((new OverviewDataModel(new DatasetFeatureStatisticsList()))
      .getDatasetNames()).to.deep.equal([]);
  });

  it('returns array of dataset names', () => {
    const d = new DatasetFeatureStatisticsList();
    d.setDatasetsList([]);
    {
      const entry = new DatasetFeatureStatistics();
      entry.setName('hello');
      d.getDatasetsList().push(entry);
    }
    {
      const entry = new DatasetFeatureStatistics();
      entry.setName('world');
      d.getDatasetsList().push(entry);
    }
    const dm = new OverviewDataModel(d);
    expect(dm.getDatasetNames()).to.deep.equal(['hello', 'world']);
  });
});

describe('getDataset', () => {
  let dm: OverviewDataModel;
  let dl: DatasetFeatureStatisticsList;

  beforeEach(() => {
    dl = new DatasetFeatureStatisticsList();
    dl.setDatasetsList([]);
  });

  const addDataset = (name: string | null): DatasetFeatureStatistics => {
    const d = new DatasetFeatureStatistics();
    if (name != null) {
      d.setName(name);
    }
    dl.getDatasetsList().push(d);
    return d;
  };

  it('returns null when dataset name is empty and doesnt match dataset', () => {
    dm = new OverviewDataModel(new DatasetFeatureStatisticsList());
    expect(dm.getDataset('')).to.equal(null);
  });

  it('returns null when no datasets exist', () => {
    dm = new OverviewDataModel(new DatasetFeatureStatisticsList());
    expect(dm.getDataset('does-not-exist')).to.equal(null);
  });

  it('returns null when no dataset with name exists', () => {
    addDataset('dataset');
    dm = new OverviewDataModel(dl);
    expect(dm.getDataset('bad-dataset-name')).to.equal(null);
  });

  it('returns something if named dataset exists', () => {
    addDataset('test');
    dm = new OverviewDataModel(dl);
    expect(dm.getDataset('test')).not.to.equal(null);
  });

  it('returns something if named dataset exists with empty name', () => {
    addDataset(null);
    dm = new OverviewDataModel(dl);
    expect(dm.getDataset('')).not.to.equal(null);
  });

  it('returns only dataset by name', () => {
    const d = addDataset('test');
    dm = new OverviewDataModel(dl);
    expect(dm.getDataset(d.getName())!.getName()).to.equal(d.getName());
  });

  it('returns first dataset with requested name', () => {
    addDataset('test1');
    addDataset('test2');
    addDataset('test3');
    dm = new OverviewDataModel(dl);
    expect(dm.getDataset('test3')!.getName()).to.equal('test3');
  });
});

describe('getFeature', () => {
  let dm: OverviewDataModel;
  let dl: DatasetFeatureStatisticsList;

  const addFeature = (name: string): FeatureNameStatistics => {
    const f = new FeatureNameStatistics();
    f.setName(name);
    dl.getDatasetsList()[0].getFeaturesList().push(f);
    return f;
  };

  beforeEach(() => {
    dl = new DatasetFeatureStatisticsList();
    dl.setDatasetsList([]);
    const d = new DatasetFeatureStatistics();
    d.setName('dataset');
    d.setFeaturesList([]);
    dl.getDatasetsList().push(d);
  });

  it('returns null if dataset name is empty', () => {
    dm = new OverviewDataModel(dl);
    expect(dm.getFeature('feature', '')).to.equal(null);
  });

  it('returns null if feature name is null', () => {
    dm = new OverviewDataModel(dl);
    expect(dm.getFeature(null, 'dataset')).to.equal(null);
  });

  it('returns null if dataset doesnt exist', () => {
    dm = new OverviewDataModel(dl);
    expect(dm.getFeature('feature', 'bad-dataset-name')).to.equal(null);
  });

  it('returns null if no features exist', () => {
    dm = new OverviewDataModel(dl);
    expect(dm.getFeature('feature', 'dataset')).to.equal(null);
  });

  it('returns null if no feature with name exists', () => {
    addFeature('feature');
    dm = new OverviewDataModel(dl);
    expect(dm.getFeature('bad-feature-name', 'dataset')).to.equal(null);
  });

  it('returns feature with requested name', () => {
    addFeature('feature');
    dm = new OverviewDataModel(dl);
    expect(dm.getFeature('feature', 'dataset')!.getName()).to.equal('feature');
  });

  it('returns feature with requested name from empty named dataset', () => {
    const f = new FeatureNameStatistics();
    f.setName('feature');
    const d = new DatasetFeatureStatistics();
    d.setFeaturesList([f]);
    const testDl = new DatasetFeatureStatisticsList();
    testDl.setDatasetsList([d]);
    dm = new OverviewDataModel(testDl);
    expect(dm.getFeature('feature', '')!.getName()).to.equal('feature');
  });

  it('returns first feature with requested name', () => {
    addFeature('feature1');
    addFeature('feature2');
    addFeature('feature3');
    dm = new OverviewDataModel(dl);
    expect(dm.getFeature('feature3', 'dataset')!.getName()).to.equal('feature3');
  });
});

describe('getFeatureCommonStats', () => {
  let dm: OverviewDataModel;
  let dl: DatasetFeatureStatisticsList;

  const addFeature = (name: string): FeatureNameStatistics => {
    const f = new FeatureNameStatistics();
    f.setName(name);
    dl.getDatasetsList()[0].getFeaturesList().push(f);
    return f;
  };

  beforeEach(() => {
    dl = new DatasetFeatureStatisticsList();
    dl.setDatasetsList([]);
    const d = new DatasetFeatureStatistics();
    d.setName('dataset');
    d.setFeaturesList([]);
    dl.getDatasetsList().push(d);
  });

  it('returns null if no feature exists', () => {
    dm = new OverviewDataModel(dl);
    expect(dm.getFeatureCommonStats('feature', 'dataset')).to.equal(null);
  });

  it('returns null if no stats for feature', () => {
    dm = new OverviewDataModel(dl);
    addFeature('feature');
    expect(dm.getFeatureCommonStats('feature', 'dataset')).to.equal(null);
  });

  it('returns stats from numeric feature', () => {
    dm = new OverviewDataModel(dl);
    const f = addFeature('feature');
    const stats = new NumericStatistics();
    const common = new CommonStatistics();
    common.setNumNonMissing(10);
    stats.setCommonStats(common);
    f.setNumStats(stats);
    expect(dm.getFeatureCommonStats('feature', 'dataset')).to.equal(common);
  });

  it('returns stats from string feature', () => {
    dm = new OverviewDataModel(dl);
    const f = addFeature('feature');
    const stats = new StringStatistics();
    const common = new CommonStatistics();
    common.setNumNonMissing(10);
    stats.setCommonStats(common);
    f.setStringStats(stats);
    expect(dm.getFeatureCommonStats('feature', 'dataset')).to.equal(common);
  });

  it('returns stats from bytes feature', () => {
    dm = new OverviewDataModel(dl);
    const f = addFeature('feature');
    const stats = new BytesStatistics();
    const common = new CommonStatistics();
    common.setNumNonMissing(10);
    stats.setCommonStats(common);
    f.setBytesStats(stats);
    expect(dm.getFeatureCommonStats('feature', 'dataset')).to.equal(common);
  });

  it('returns stats from struct feature', () => {
    dm = new OverviewDataModel(dl);
    const f = addFeature('feature');
    const stats = new StructStatistics();
    const common = new CommonStatistics();
    common.setNumNonMissing(10);
    stats.setCommonStats(common);
    f.setStructStats(stats);
    expect(dm.getFeatureCommonStats('feature', 'dataset')).to.equal(common);
  });
});

describe('getFeatureNames', () => {
  let dm: OverviewDataModel;
  let dl: DatasetFeatureStatisticsList;

  const addDataset = (name: string): DatasetFeatureStatistics => {
    const d = new DatasetFeatureStatistics();
    d.setName(name);
    d.setFeaturesList([]);
    dl.getDatasetsList().push(d);
    return d;
  };

  beforeEach(() => {
    dl = new DatasetFeatureStatisticsList();
    dl.setDatasetsList([]);
  });

  it('returns null if string is null', () => {
    dm = new OverviewDataModel(dl);
    expect(dm.getFeatureNames(null)).to.equal(null);
  });

  it('returns an empty array if no datasets', () => {
    addDataset('d');
    dm = new OverviewDataModel(dl);
    expect(dm.getFeatureNames('bad-dataset-name')).to.deep.equal([]);
  });

  it('returns an empty array if dataset has no features', () => {
    addDataset('d');
    dm = new OverviewDataModel(dl);
    expect(dm.getFeatureNames('d')).to.deep.equal([]);
  });

  it('returns single feature name from dataset', () => {
    const d = addDataset('d');
    const f = new FeatureNameStatistics();
    f.setName('f');
    d.setFeaturesList([f]);
    dm = new OverviewDataModel(dl);
    expect(dm.getFeatureNames('d')).to.deep.equal(['f']);
  });

  it('returns multiple feature names from dataset', () => {
    const d = addDataset('d');
    const f = new FeatureNameStatistics();
    f.setName('f');
    const g = new FeatureNameStatistics();
    g.setName('g');
    d.setFeaturesList([f, g]);
    dm = new OverviewDataModel(dl);
    expect(dm.getFeatureNames('d')).to.deep.equal(['f', 'g']);
  });
});

describe('getFeatureIndex', () => {
  let dm: OverviewDataModel;
  let dl: DatasetFeatureStatisticsList;

  const addDataset = (name: string): DatasetFeatureStatistics => {
    const d = new DatasetFeatureStatistics();
    d.setName(name);
    d.setFeaturesList([]);
    dl.getDatasetsList().push(d);
    return d;
  };

  beforeEach(() => {
    dl = new DatasetFeatureStatisticsList();
    dl.setDatasetsList([]);
  });

  it('returns null if data model has no data', () => {
    dm = new OverviewDataModel(dl);
    expect(dm.getFeatureIndex('d', 'f')).to.equal(null);
  });

  it('returns null if model has no dataset', () => {
    dm = new OverviewDataModel(dl);
    expect(dm.getFeatureIndex('d', 'f')).to.equal(null);
  });

  it('returns null if dataset has no feature', () => {
    addDataset('d');
    dm = new OverviewDataModel(dl);
    expect(dm.getFeatureIndex('d', 'f')).to.equal(null);
  });

  it('returns 0 if dataset has only the named feature', () => {
    const d = addDataset('d');
    const f = new FeatureNameStatistics();
    f.setName('f');
    d.setFeaturesList([f]);
    dm = new OverviewDataModel(dl);
    expect(dm.getFeatureIndex('d', 'f')).to.equal(0);
  });

  it('returns index of named feature in dataset', () => {
    const d = addDataset('d');
    const f = new FeatureNameStatistics();
    f.setName('f');
    const x = new FeatureNameStatistics();
    x.setName('x');
    d.setFeaturesList([x, x, x, f, x]);
    dm = new OverviewDataModel(dl);
    expect(dm.getFeatureIndex('d', 'f')).to.equal(3);
  });
});

describe('featureHasSingleValue', () => {
  let dm: OverviewDataModel;
  let dl: DatasetFeatureStatisticsList;
  let f: FeatureNameStatistics;

  beforeEach(() => {
    dl = new DatasetFeatureStatisticsList();
    dl.setDatasetsList([]);
    f = new FeatureNameStatistics();
    f.setName('feature');
  });

  it('returns false if feature is null', () => {
    dm = new OverviewDataModel(dl);
    expect(dm.featureHasSingleValue(f)).to.equal(false);
  });

  it('returns false if dataset is null', () => {
    dm = new OverviewDataModel(dl);
    expect(dm.featureHasSingleValue(f)).to.equal(false);
  });

  it('returns true if feature is unique string', () => {
    const stats = new StringStatistics();
    f.setStringStats(stats);
    stats.setUnique(1);
    dm = new OverviewDataModel(dl);
    expect(dm.featureHasSingleValue(f)).to.equal(true);
  });

  it('returns false if string is not unique', () => {
    const stats = new StringStatistics();
    f.setStringStats(stats);
    stats.setUnique(2);
    dm = new OverviewDataModel(dl);
    expect(dm.featureHasSingleValue(f)).to.equal(false);
  });

  it('returns true if number and min == max', () => {
    const stats = new NumericStatistics();
    f.setNumStats(stats);
    stats.setMin(123);
    stats.setMax(123);
    dm = new OverviewDataModel(dl);
    expect(dm.featureHasSingleValue(f)).to.equal(true);
  });

  it('returns false if number and min != max', () => {
    const stats = new NumericStatistics();
    f.setNumStats(stats);
    stats.setMin(123);
    stats.setMax(314);
    dm = new OverviewDataModel(dl);
    expect(dm.featureHasSingleValue(f)).to.equal(false);
  });

  it('returns false if number and max is unuset', () => {
    const stats = new NumericStatistics();
    f.setNumStats(stats);
    stats.setMin(123);
    dm = new OverviewDataModel(dl);
    expect(dm.featureHasSingleValue(f)).to.equal(false);
  });

  it('returns false if number and min is unset', () => {
    const stats = new NumericStatistics();
    f.setNumStats(stats);
    stats.setMax(123);
    dm = new OverviewDataModel(dl);
    expect(dm.featureHasSingleValue(f)).to.equal(false);
  });

  it('returns true if binary and unique', () => {
    const stats = new BytesStatistics();
    f.setBytesStats(stats);
    stats.setUnique(1);
    dm = new OverviewDataModel(dl);
    expect(dm.featureHasSingleValue(f)).to.equal(true);
  });

  it('returns false if binary and not unique', () => {
    const stats = new BytesStatistics();
    f.setBytesStats(stats);
    stats.setUnique(2);
    dm = new OverviewDataModel(dl);
    expect(dm.featureHasSingleValue(f)).to.equal(false);
  });
});

describe('getFeatureSingleValue', () => {
  let dm: OverviewDataModel;
  let dl: DatasetFeatureStatisticsList;
  let f: FeatureNameStatistics;

  beforeEach(() => {
    dl = new DatasetFeatureStatisticsList();
    dl.setDatasetsList([]);
    f = new FeatureNameStatistics();
  });

  it('returns a string containing null if the feature is null', () => {
    dm = new OverviewDataModel(dl);
    expect(dm.getFeatureSingleValue(null)).to.equal('<null>');
  });

  it('returns unknown if stats arent set', () => {
    dm = new OverviewDataModel(dl);
    expect(dm.getFeatureSingleValue(new FeatureNameStatistics())).
      to.equal('<unknown type>');
  });

  it('returns <null> if the top strings list is null', () => {
    f.setStringStats(new StringStatistics());
    dm = new OverviewDataModel(dl);
    expect(dm.getFeatureSingleValue(f)).to.equal('<null>');
  });

  it('returns <null> if the top strings list is empty', () => {
    f.setStringStats(new StringStatistics());
    f.getStringStats()!.setTopValuesList([]);
    dm = new OverviewDataModel(dl);
    expect(dm.getFeatureSingleValue(f)).to.equal('<null>');
  });

  it('returns only entry in string frequency list', () => {
    f.setStringStats(new StringStatistics());
    const fv = new StringStatistics.FreqAndValue();
    fv.setValue('hello');
    fv.setFrequency(1);
    f.getStringStats()!.setTopValuesList([fv]);
    dm = new OverviewDataModel(dl);
    expect(dm.getFeatureSingleValue(f)).to.equal('hello');
  });

  it('returns first entry in string frequency list', () => {
    f.setStringStats(new StringStatistics());
    f.getStringStats()!.setTopValuesList([]);
    {
      const fv = new StringStatistics.FreqAndValue();
      fv.setValue('first');
      fv.setFrequency(1);
      f.getStringStats()!.getTopValuesList()!.push(fv);
    }
    {
      const fv = new StringStatistics.FreqAndValue();
      fv.setValue('second');
      fv.setFrequency(1);
      f.getStringStats()!.getTopValuesList()!.push(fv);
    }
    {
      const fv = new StringStatistics.FreqAndValue();
      fv.setValue('third');
      fv.setFrequency(1);
      f.getStringStats()!.getTopValuesList()!.push(fv);
    }
    dm = new OverviewDataModel(dl);
    expect(dm.getFeatureSingleValue(f)).to.equal('first');
  });

  it('returns <null> if unique bytes count is zero', () => {
    f.setBytesStats(new BytesStatistics());
    f.getBytesStats()!.setUnique(0);
    dm = new OverviewDataModel(dl);
    expect(dm.getFeatureSingleValue(f)).to.equal('<null>');
  });

  it('returns <binary data> for bytes', () => {
    f.setBytesStats(new BytesStatistics());
    f.getBytesStats()!.setUnique(1);
    dm = new OverviewDataModel(dl);
    expect(dm.getFeatureSingleValue(f)).to.equal('<binary data>');
  });

  it('returns min field from number if set', () => {
    f.setNumStats(new NumericStatistics());
    f.getNumStats()!.setMin(555);
    dm = new OverviewDataModel(dl);
    expect(dm.getFeatureSingleValue(f)).to.equal('555');
  });

  it('returns max field from number if min is not set', () => {
    f.setNumStats(new NumericStatistics());
    f.getNumStats()!.setMax(777);
    dm = new OverviewDataModel(dl);
    expect(dm.getFeatureSingleValue(f)).to.equal('777');
  });
});

describe('getUniqueFeatures', () => {
  let dl: DatasetFeatureStatisticsList;
  let dm: OverviewDataModel;

  beforeEach(() => {
    dl = new DatasetFeatureStatisticsList();
    dl.setDatasetsList([]);
  });

  const addDataset = (name: string): DatasetFeatureStatistics => {
    const d = new DatasetFeatureStatistics();
    d.setName(name);
    d.setFeaturesList([]);
    dl.getDatasetsList().push(d);
    return d;
  };

  it('computes an empty set if there are no datasets', () => {
    dm = new OverviewDataModel(dl);
    expect(dm.getUniqueFeatures()).to.deep.equal([]);
  });

  it('collects a single feature from a single dataset', () => {
    const d = addDataset('test');
    const f = new FeatureNameStatistics();
    f.setName('f');
    d.setFeaturesList([f]);
    dm = new OverviewDataModel(dl);
    expect(dm.getUniqueFeatures().length).to.equal(1);
    expect(dm.getUniqueFeatures()[0]).to.equal(f);
  });

  it('collects multiple features from a single dataset', () => {
    const d = addDataset('test');
    const x = new FeatureNameStatistics();
    x.setName('x');
    d.getFeaturesList().push(x);
    const f = new FeatureNameStatistics();
    f.setName('f');
    d.getFeaturesList().push(f);
    dm = new OverviewDataModel(dl);
    expect(dm.getUniqueFeatures().length).to.equal(2);
    expect(dm.getUniqueFeatures()[0]).to.equal(x);
    expect(dm.getUniqueFeatures()[1]).to.equal(f);
  });

  it('skips empty dataset and collects feature from second dataset', () => {
    addDataset('empty');
    const d = addDataset('test');
    const f = new FeatureNameStatistics();
    f.setName('f');
    d.setFeaturesList([f]);
    dm = new OverviewDataModel(dl);
    expect(dm.getUniqueFeatures().length).to.equal(1);
    expect(dm.getUniqueFeatures()[0]).to.equal(f);
  });

  it('collects a single feature from each dataset', () => {
    const ds1 = addDataset('ds1');
    const x = new FeatureNameStatistics();
    x.setName('x');
    ds1.setFeaturesList([x]);
    const ds2 = addDataset('ds2');
    const y = new FeatureNameStatistics();
    y.setName('y');
    ds2.setFeaturesList([y]);
    dm = new OverviewDataModel(dl);
    expect(dm.getUniqueFeatures().length).to.equal(2);
    expect(dm.getUniqueFeatures()[0]).to.equal(x);
    expect(dm.getUniqueFeatures()[1]).to.equal(y);
  });
});

describe('getNumUniqueFeaturesByType', () => {
  let dl: DatasetFeatureStatisticsList;

  beforeEach(() => {
    dl = new DatasetFeatureStatisticsList();
    dl.setDatasetsList([]);
  });

  const addDataset = (name: string): DatasetFeatureStatistics => {
    const d = new DatasetFeatureStatistics();
    d.setName(name);
    d.setFeaturesList([]);
    dl.getDatasetsList().push(d);
    return d;
  };

  it('returns 0 when there are no datasets', () => {
    const dm = new OverviewDataModel(dl);
    expect(dm.getNumUniqueFeaturesByType(true)).to.equal(0);
    expect(dm.getNumUniqueFeaturesByType(false)).to.equal(0);
  });

  it('returns 0 when there are no features of that type', () => {
    const d = addDataset('test');
    const f = new FeatureNameStatistics();
    f.setName('f');
    f.setType(FeatureNameStatistics.Type.INT);
    f.setNumStats(new NumericStatistics());
    d.setFeaturesList([f]);
    const dm = new OverviewDataModel(dl);
    expect(dm.getNumUniqueFeaturesByType(false)).to.equal(0);
  });

  it('returns the correct number of features by type', () => {
    const d = addDataset('test');
    const f = new FeatureNameStatistics();
    f.setName('f');
    f.setType(FeatureNameStatistics.Type.INT);
    f.setNumStats(new NumericStatistics());
    const f2 = new FeatureNameStatistics();
    f2.setName('f2');
    f2.setType(FeatureNameStatistics.Type.FLOAT);
    f2.setNumStats(new NumericStatistics());
    const f3 = new FeatureNameStatistics();
    f3.setName('f3');
    f3.setType(FeatureNameStatistics.Type.STRING);
    f3.setStringStats(new StringStatistics());
    d.setFeaturesList([f, f2, f3]);
    const dm = new OverviewDataModel(dl);
    expect(dm.getNumUniqueFeaturesByType(true)).to.equal(2);
    expect(dm.getNumUniqueFeaturesByType(false)).to.equal(1);
  });
});

describe('getDatasetHistogramsForFeature', () => {
  let dm: OverviewDataModel;
  let dl: DatasetFeatureStatisticsList;

  const addDataset = (name: string): DatasetFeatureStatistics => {
    const d = new DatasetFeatureStatistics();
    d.setName(name);
    dl.getDatasetsList().push(d);
    return d;
  };

  beforeEach(() => {
    dl = new DatasetFeatureStatisticsList();
    dl.setDatasetsList([]);
  });

  it('returns an empty array if the model has no datasets', () => {
    dm = new OverviewDataModel(dl);
    expect(dm.getDatasetHistogramsForFeature('f')).to.deep.equal([]);
  });

  it('returns an null histo if the only dataset has no feature', () => {
    addDataset('d');
    dm = new OverviewDataModel(dl);
    expect(dm.getDatasetHistogramsForFeature('f'))
      .to.deep.equal([new utils.HistogramForDataset('d', null, null, null, null,
                                              null)]);
  });

  it('returns a null histo for every dataset without feature', () => {
    addDataset('d1');
    addDataset('d2');
    addDataset('d3');
    dm = new OverviewDataModel(dl);
    expect(dm.getDatasetHistogramsForFeature('f'))
      .to.deep.equal([new utils.HistogramForDataset('d1', null, null, null, null,
                                              null),
                new utils.HistogramForDataset('d2', null, null, null, null,
                                              null),
                new utils.HistogramForDataset('d3', null, null, null, null,
                                              null)]);
  });

  it('returns Histogram from a numeric feature', () => {
    const d = addDataset('d');
    d.setFeaturesList([new FeatureNameStatistics()]);
    d.getFeaturesList()![0].setName('f');
    d.getFeaturesList()![0].setNumStats(new NumericStatistics());
    const h = new Histogram();
    d.getFeaturesList()![0].getNumStats()!.setHistogramsList([h]);
    dm = new OverviewDataModel(dl);
    expect(dm.getDatasetHistogramsForFeature('f'))
      .to.deep.equal([new utils.HistogramForDataset('d', h, null, null, null, null)]);
  });

  it('returns histos from datasets that have the feature', () => {
    const d1 = addDataset('d1');
    d1.setFeaturesList([new FeatureNameStatistics()]);
    d1.getFeaturesList()![0].setName('f');
    d1.getFeaturesList()![0].setNumStats(new NumericStatistics());
    const h1 = new Histogram();
    d1.getFeaturesList()![0].getNumStats()!.setHistogramsList([h1]);
    const d2 = addDataset('d2');
    d2.setFeaturesList([new FeatureNameStatistics()]);
    d2.getFeaturesList()![0].setName('f');
    d2.getFeaturesList()![0].setNumStats(new NumericStatistics());
    const h2 = new Histogram();
    d2.getFeaturesList()![0].getNumStats()!.setHistogramsList([h2]);
    dm = new OverviewDataModel(dl);
    expect(dm.getDatasetHistogramsForFeature('f'))
      .to.deep.equal([new utils.HistogramForDataset('d1', h1, null, null, null, null),
                new utils.HistogramForDataset('d2', h2, null, null, null,
                                              null)]);
  });

  it('returns RankHistograms from string features', () => {
    const d = addDataset('d');
    d.setFeaturesList([new FeatureNameStatistics()]);
    d.getFeaturesList()![0].setName('f');
    d.getFeaturesList()![0].setStringStats(new StringStatistics());
    const h = new RankHistogram();
    d.getFeaturesList()![0].getStringStats()!.setRankHistogram(h);
    dm = new OverviewDataModel(dl);
    expect(dm.getDatasetHistogramsForFeature('f'))
      .to.deep.equal([new utils.HistogramForDataset('d', h, null, null, null, null)]);
  });

  it('returns weighted RankHistograms from string features', () => {
    const d = addDataset('d');
    d.setFeaturesList([new FeatureNameStatistics()]);
    d.getFeaturesList()![0].setName('f');
    d.getFeaturesList()![0].setStringStats(new StringStatistics());
    const h = new RankHistogram();
    d.getFeaturesList()![0].getStringStats()!.setRankHistogram(h);
    const weightedH = new RankHistogram();
    d.getFeaturesList()![0].getStringStats()!.setWeightedStringStats(
      new WeightedStringStatistics());
    d.getFeaturesList()![0].getStringStats()!.getWeightedStringStats()!.
      setRankHistogram(weightedH);
    dm = new OverviewDataModel(dl);
    expect(dm.getDatasetHistogramsForFeature('f'))
      .to.deep.equal([new utils.HistogramForDataset('d', h, weightedH, null, null,
                                              null)]);
  });

  it('returns weighted Histograms from numeric features', () => {
    const d = addDataset('d');
    d.setFeaturesList([new FeatureNameStatistics()]);
    d.getFeaturesList()![0].setName('f');
    d.getFeaturesList()![0].setNumStats(new NumericStatistics());
    const h = new Histogram();
    d.getFeaturesList()![0].getNumStats()!.setHistogramsList([h]);
    const weightedH = new Histogram();
    d.getFeaturesList()![0].getNumStats()!.setWeightedNumericStats(
      new WeightedNumericStatistics());
    d.getFeaturesList()![0].getNumStats()!.getWeightedNumericStats()!.
      setHistogramsList([weightedH]);
    dm = new OverviewDataModel(dl);
    expect(dm.getDatasetHistogramsForFeature('f'))
      .to.deep.equal([new utils.HistogramForDataset('d', h, weightedH, null, null,
                                              null)]);
  });

  it('returns quantiles from numeric features', () => {
    const d = addDataset('d');
    d.setFeaturesList([new FeatureNameStatistics()]);
    d.getFeaturesList()![0].setName('f');
    d.getFeaturesList()![0].setNumStats(new NumericStatistics());
    const h = new Histogram();
    const q = new Histogram();
    q.setType(Histogram.HistogramType.QUANTILES);
    d.getFeaturesList()![0].getNumStats()!.setHistogramsList([h, q]);
    const weightedH = new Histogram();
    const weightedQ = new Histogram();
    weightedQ.setType(Histogram.HistogramType.QUANTILES);
    d.getFeaturesList()![0].getNumStats()!.setWeightedNumericStats(
      new WeightedNumericStatistics());
    d.getFeaturesList()![0].getNumStats()!.getWeightedNumericStats()!.
      setHistogramsList([weightedH, weightedQ]);
    dm = new OverviewDataModel(dl);
    expect(dm.getDatasetHistogramsForFeature('f'))
      .to.deep.equal([new utils.HistogramForDataset(
        'd', h, weightedH, q, weightedQ, null)]);
  });

  it('returns value list quantiles from numeric features', () => {
    const d = addDataset('d');
    d.setFeaturesList([new FeatureNameStatistics()]);
    d.getFeaturesList()![0].setName('f');
    d.getFeaturesList()![0].setNumStats(new NumericStatistics());
    const common = new CommonStatistics();
    const listQ = new Histogram();
    listQ.setType(Histogram.HistogramType.QUANTILES);
    common.setNumValuesHistogram(listQ);
    d.getFeaturesList()![0].getNumStats()!.setCommonStats(common);
    dm = new OverviewDataModel(dl);
    expect(dm.getDatasetHistogramsForFeature('f'))
      .to.deep.equal([new utils.HistogramForDataset(
        'd', null, null, null, null, listQ)]);
  });

  it('returns value list quantiles from string features', () => {
    const d = addDataset('d');
    d.setFeaturesList([new FeatureNameStatistics()]);
    d.getFeaturesList()![0].setName('f');
    d.getFeaturesList()![0].setStringStats(new StringStatistics());
    const h = new RankHistogram();
    d.getFeaturesList()![0].getStringStats()!.setRankHistogram(h);
    const common = new CommonStatistics();
    const listQ = new Histogram();
    listQ.setType(Histogram.HistogramType.QUANTILES);
    common.setNumValuesHistogram(listQ);
    d.getFeaturesList()![0].getStringStats()!.setCommonStats(common);
    dm = new OverviewDataModel(dl);
    expect(dm.getDatasetHistogramsForFeature('f'))
      .to.deep.equal([new utils.HistogramForDataset(
        'd', h, null, null, null, listQ)]);
  });

  it('returns custom histograms', () => {
    const d = addDataset('d');
    d.setFeaturesList([new FeatureNameStatistics()]);
    d.getFeaturesList()![0].setName('f');
    const stat = new CustomStatistic();
    stat.setName('custom hist');
    const h = new Histogram();
    stat.setHistogram(h);
    d.getFeaturesList()![0].setCustomStatsList([stat]);
    dm = new OverviewDataModel(dl);
    expect(dm.getDatasetHistogramsForFeature('f')).to.deep.equal([
      new utils.HistogramForDataset(
          'd', null, null, null, null, null, null, {'custom hist': h})
    ]);
  });

  it('returns feature list length histogram', () => {
    const d = addDataset('d');
    d.setFeaturesList([new FeatureNameStatistics()]);
    d.getFeaturesList()![0].setName('f');
    d.getFeaturesList()![0].setNumStats(new NumericStatistics());
    d.getFeaturesList()![0].getNumStats()!.setCommonStats(
        new CommonStatistics());
    const h = new Histogram();
    d.getFeaturesList()![0]
        .getNumStats()!.getCommonStats()!.setFeatureListLengthHistogram(h);
    dm = new OverviewDataModel(dl);
    expect(dm.getDatasetHistogramsForFeature('f')).to.deep.equal([
      new utils.HistogramForDataset('d', null, null, null, null, null, h)
    ]);
  });

  it('returns non-standard histograms from the numeric histograms list', () => {
    const d = addDataset('d');
    d.setFeaturesList([new FeatureNameStatistics()]);
    d.getFeaturesList()![0].setName('f');
    d.getFeaturesList()![0].setNumStats(new NumericStatistics());
    const h = new Histogram();
    h.setName('other hist');
    d.getFeaturesList()![0].getNumStats()!.setHistogramsList([h]);
    dm = new OverviewDataModel(dl);
    expect(dm.getDatasetHistogramsForFeature('f')).to.deep.equal([
      new utils.HistogramForDataset(
          'd', null, null, null, null, null, null, {'other hist': h})
    ]);
  });
});

describe('getExtraHistogramNames', () => {
  let dm: OverviewDataModel;
  let dl: DatasetFeatureStatisticsList;

  const addDataset = (name: string): DatasetFeatureStatistics => {
    const d = new DatasetFeatureStatistics();
    d.setName(name);
    dl.getDatasetsList().push(d);
    return d;
  };

  beforeEach(() => {
    dl = new DatasetFeatureStatisticsList();
    dl.setDatasetsList([]);
  });

  it('returns an empty array if the model has no datasets', () => {
    dm = new OverviewDataModel(dl);
    const f = new FeatureNameStatistics();
    f.setName('f');
    expect(dm.getExtraHistogramNames([f])).to.deep.equal([]);
  });

  it('returns an empty array if no features match the provided features',
     () => {
       dm = new OverviewDataModel(dl);
       const d = addDataset('d');
       d.setFeaturesList([new FeatureNameStatistics()]);
       d.getFeaturesList()![0].setName('f');
       const stat = new CustomStatistic();
       stat.setName('custom');
       const h = new Histogram();
       stat.setHistogram(h);
       d.getFeaturesList()![0].setCustomStatsList([stat]);

       const f = new FeatureNameStatistics();
       f.setName('f2');
       expect(dm.getExtraHistogramNames([f])).to.deep.equal([]);
     });

  it('returns custom histogram names', () => {
    dm = new OverviewDataModel(dl);
    const d = addDataset('d');
    d.setFeaturesList([new FeatureNameStatistics()]);
    d.getFeaturesList()![0].setName('f');
    const stat = new CustomStatistic();
    stat.setName('custom');
    const h = new Histogram();
    stat.setHistogram(h);
    d.getFeaturesList()![0].setCustomStatsList([stat]);

    const f = new FeatureNameStatistics();
    f.setName('f');
    expect(dm.getExtraHistogramNames([f])).to.deep.equal(['custom']);
  });

  it('returns extra numeric histogram names', () => {
    dm = new OverviewDataModel(dl);
    const d = addDataset('d');
    d.setFeaturesList([new FeatureNameStatistics()]);
    d.getFeaturesList()![0].setName('f');
    d.getFeaturesList()![0].setNumStats(new NumericStatistics());
    const h = new Histogram();
    h.setName('extra');
    d.getFeaturesList()![0].getNumStats()!.setHistogramsList([h]);

    const f = new FeatureNameStatistics();
    f.setName('f');
    expect(dm.getExtraHistogramNames([f])).to.deep.equal(['extra']);
  });
});

describe('doesContainWeightedStats', () => {
  let dl: DatasetFeatureStatisticsList;
  let f: FeatureNameStatistics;

  beforeEach(() => {
    dl = new DatasetFeatureStatisticsList();
    const d = new DatasetFeatureStatistics();
    f = new FeatureNameStatistics();
    d.setFeaturesList([f]);
    dl.setDatasetsList([d]);
    f.setName('feature');
  });

  it('returns true when weighted stats exist', () => {
    const stats = new StringStatistics();
    stats.setWeightedStringStats(new WeightedStringStatistics());
    f.setStringStats(stats);
    const dm = new OverviewDataModel(dl);
    expect(dm.doesContainWeightedStats()).to.be.true;
  });

  it('returns false when weighted stats dont exist', () => {
    const stats = new StringStatistics();
    f.setStringStats(stats);
    const dm = new OverviewDataModel(dl);
    expect(dm.doesContainWeightedStats()).to.be.false;
  });
});

describe('doesContainCustomStats', () => {
  let dl: DatasetFeatureStatisticsList;
  let f: FeatureNameStatistics;

  beforeEach(() => {
    dl = new DatasetFeatureStatisticsList();
    const d = new DatasetFeatureStatistics();
    f = new FeatureNameStatistics();
    d.setFeaturesList([f]);
    dl.setDatasetsList([d]);
    f.setName('feature');
  });

  it('returns true when custom stats exist', () => {
    f.setCustomStatsList([new CustomStatistic()]);
    const dm = new OverviewDataModel(dl);
    expect(dm.doesContainCustomStats()).to.be.true;
  });

  it('returns false when custom stats dont exist', () => {
    const dm = new OverviewDataModel(dl);
    expect(dm.doesContainCustomStats()).to.be.false;
  });
});

describe('doesContainFeatureListLengthData', () => {
  let dl: DatasetFeatureStatisticsList;
  let f: FeatureNameStatistics;

  beforeEach(() => {
    dl = new DatasetFeatureStatisticsList();
    const d = new DatasetFeatureStatistics();
    f = new FeatureNameStatistics();
    d.setFeaturesList([f]);
    dl.setDatasetsList([d]);
    f.setName('feature');
  });

  it('returns true when feature list length data exists', () => {
    f.setNumStats(new NumericStatistics());
    f.getNumStats()!.setCommonStats(new CommonStatistics());
    const h = new Histogram();
    f.getNumStats()!.getCommonStats()!.setFeatureListLengthHistogram(h);
    const dm = new OverviewDataModel(dl);
    expect(dm.doesContainFeatureListLengthData()).to.be.true;
  });

  it('returns false when feature list length  doesnt exist', () => {
    const dm = new OverviewDataModel(dl);
    expect(dm.doesContainFeatureListLengthData()).to.be.false;
  });
});

describe('getNonEmptyFeatureSpecLists', () => {
  let dm: OverviewDataModel;

  beforeEach(() => {
    const dl = new DatasetFeatureStatisticsList();
    const d = new DatasetFeatureStatistics();
    const f = new FeatureNameStatistics();
    f.setName('int');
    f.setType(FeatureNameStatistics.Type.INT);
    const stats = new NumericStatistics();
    const common = new CommonStatistics();
    common.setNumNonMissing(10);
    common.setMinNumValues(1);
    common.setMaxNumValues(1);
    stats.setCommonStats(common);
    f.setNumStats(stats);
    d.setFeaturesList([f]);
    dl.setDatasetsList([d]);
    dm = new OverviewDataModel(dl);
  });

  it('returns only non-empty feature spec lists', () => {
    const list: utils.FeatureSpecAndList[] = dm.getNonEmptyFeatureSpecLists();
    expect(list.length).to.equal(1);
    expect(list[0].spec).to.equal(utils.FS_SCALAR_INT);
    expect(list[0].features.length).to.equal(1);
    expect(list[0].features[0]).to.equal('int');
  });
});

describe('getFeatureSpecForFeature', () => {
  it('return unknown for an empty feature', () => {
    const dl = new DatasetFeatureStatisticsList();
    const d = new DatasetFeatureStatistics();
    const f = new FeatureNameStatistics();
    f.setName('empty');
    f.setType(FeatureNameStatistics.Type.INT);
    const stats = new NumericStatistics();
    const common = new CommonStatistics();
    common.setNumNonMissing(0);
    stats.setCommonStats(common);
    f.setNumStats(stats);
    d.setFeaturesList([f]);
    dl.setDatasetsList([d]);
    const dm = new OverviewDataModel(dl);

    expect(dm.getFeatureSpecForFeature('empty')).to.equal(utils.FS_UNKNOWN);
  });

  it('returns scalar int correctly', () => {
    const dl = new DatasetFeatureStatisticsList();
    const d = new DatasetFeatureStatistics();
    const f = new FeatureNameStatistics();
    f.setName('int');
    f.setType(FeatureNameStatistics.Type.INT);
    const stats = new NumericStatistics();
    const common = new CommonStatistics();
    common.setNumNonMissing(1);
    common.setMinNumValues(1);
    common.setMaxNumValues(1);
    stats.setCommonStats(common);
    f.setNumStats(stats);
    d.setFeaturesList([f]);
    dl.setDatasetsList([d]);
    const dm = new OverviewDataModel(dl);

    expect(dm.getFeatureSpecForFeature('int')).to.equal(utils.FS_SCALAR_INT);
  });

  it('returns fixed-length string correctly', () => {
    const dl = new DatasetFeatureStatisticsList();
    const d = new DatasetFeatureStatistics();
    const f = new FeatureNameStatistics();
    f.setName('strings');
    f.setType(FeatureNameStatistics.Type.STRING);
    const stats = new StringStatistics();
    const common = new CommonStatistics();
    common.setNumNonMissing(1);
    common.setMinNumValues(2);
    common.setMaxNumValues(2);
    stats.setCommonStats(common);
    f.setStringStats(stats);
    d.setFeaturesList([f]);
    dl.setDatasetsList([d]);
    const dm = new OverviewDataModel(dl);

    expect(dm.getFeatureSpecForFeature('strings')).to.equal(utils.FS_FIXED_LEN_STRS);
  });

  it('returns var-length floats correctly', () => {
    const dl = new DatasetFeatureStatisticsList();
    const d = new DatasetFeatureStatistics();
    const f = new FeatureNameStatistics();
    f.setName('floats');
    f.setType(FeatureNameStatistics.Type.FLOAT);
    const stats = new NumericStatistics();
    const common = new CommonStatistics();
    common.setNumNonMissing(1);
    common.setMinNumValues(1);
    common.setMaxNumValues(3);
    stats.setCommonStats(common);
    f.setNumStats(stats);
    d.setFeaturesList([f]);
    dl.setDatasetsList([d]);
    const dm = new OverviewDataModel(dl);

    expect(dm.getFeatureSpecForFeature('floats')).to.equal(utils.FS_VAR_LEN_FLOATS);
  });

  it('returns scalar bytes correctly', () => {
    const dl = new DatasetFeatureStatisticsList();
    const d = new DatasetFeatureStatistics();
    const f = new FeatureNameStatistics();
    f.setName('bytes');
    f.setType(FeatureNameStatistics.Type.BYTES);
    const stats = new BytesStatistics();
    const common = new CommonStatistics();
    common.setNumNonMissing(1);
    common.setMinNumValues(1);
    common.setMaxNumValues(1);
    stats.setCommonStats(common);
    f.setBytesStats(stats);
    d.setFeaturesList([f]);
    dl.setDatasetsList([d]);
    const dm = new OverviewDataModel(dl);

    expect(dm.getFeatureSpecForFeature('bytes')).to.equal(utils.FS_SCALAR_BYTES);
  });

  it('returns scalar struct correctly', () => {
    const dl = new DatasetFeatureStatisticsList();
    const d = new DatasetFeatureStatistics();
    const f = new FeatureNameStatistics();
    f.setName('struct');
    f.setType(FeatureNameStatistics.Type.STRUCT);
    const stats = new StructStatistics();
    const common = new CommonStatistics();
    common.setNumNonMissing(1);
    common.setMinNumValues(1);
    common.setMaxNumValues(1);
    stats.setCommonStats(common);
    f.setStructStats(stats);
    d.setFeaturesList([f]);
    dl.setDatasetsList([d]);
    const dm = new OverviewDataModel(dl);

    expect(dm.getFeatureSpecForFeature('struct')).to.equal(
      utils.FS_SCALAR_STRUCT);
  });

  it('returns unknown for a mismatch across datasets', () => {
    const dl = new DatasetFeatureStatisticsList();
    const d = new DatasetFeatureStatistics();
    d.setName("d1");
    const f = new FeatureNameStatistics();
    f.setName('mismatch');
    f.setType(FeatureNameStatistics.Type.INT);
    const stats = new NumericStatistics();
    const common = new CommonStatistics();
    common.setNumNonMissing(1);
    common.setMinNumValues(1);
    common.setMaxNumValues(1);
    stats.setCommonStats(common);
    f.setNumStats(stats);
    d.setFeaturesList([f]);
    const d2 = new DatasetFeatureStatistics();
    d2.setName("d2");
    const f2 = new FeatureNameStatistics();
    f2.setName('mismatch');
    f2.setType(FeatureNameStatistics.Type.STRING);
    const stats2 = new StringStatistics();
    const common2 = new CommonStatistics();
    common2.setNumNonMissing(1);
    common2.setMinNumValues(1);
    common2.setMaxNumValues(1);
    stats2.setCommonStats(common2);
    f2.setStringStats(stats2);
    d2.setFeaturesList([f2]);
    dl.setDatasetsList([d, d2]);
    const dm = new OverviewDataModel(dl);

    expect(dm.getFeatureSpecForFeature('mismatch')).to.equal(utils.FS_UNKNOWN);
  });

  it('returns correct spec when one dataset is empty', () => {
    const dl = new DatasetFeatureStatisticsList();
    const d = new DatasetFeatureStatistics();
    d.setName("d1");
    const f = new FeatureNameStatistics();
    f.setName('int');
    f.setType(FeatureNameStatistics.Type.INT);
    const stats = new NumericStatistics();
    const common = new CommonStatistics();
    common.setNumNonMissing(0);
    stats.setCommonStats(common);
    f.setNumStats(stats);
    d.setFeaturesList([f]);
    const d2 = new DatasetFeatureStatistics();
    d2.setName("d2");
    const f2 = new FeatureNameStatistics();
    f2.setName('int');
    f2.setType(FeatureNameStatistics.Type.INT);
    const stats2 = new StringStatistics();
    const common2 = new CommonStatistics();
    common2.setNumNonMissing(1);
    common2.setMinNumValues(1);
    common2.setMaxNumValues(1);
    stats2.setCommonStats(common2);
    f2.setStringStats(stats2);
    d2.setFeaturesList([f2]);
    dl.setDatasetsList([d, d2]);
    const dm = new OverviewDataModel(dl);

    expect(dm.getFeatureSpecForFeature('int')).to.equal(utils.FS_SCALAR_INT);
  });

  it('returns correct spec datasets are of same type but differ', () => {
    const dl = new DatasetFeatureStatisticsList();
    const d = new DatasetFeatureStatistics();
    d.setName("d1");
    const f = new FeatureNameStatistics();
    f.setName('int');
    f.setType(FeatureNameStatistics.Type.INT);
    const stats = new NumericStatistics();
    const common = new CommonStatistics();
    common.setNumNonMissing(1);
    common.setMinNumValues(2);
    common.setMaxNumValues(2);
    stats.setCommonStats(common);
    f.setNumStats(stats);
    d.setFeaturesList([f]);
    const d2 = new DatasetFeatureStatistics();
    d2.setName("d2");
    const f2 = new FeatureNameStatistics();
    f2.setName('int');
    f2.setType(FeatureNameStatistics.Type.INT);
    const stats2 = new StringStatistics();
    const common2 = new CommonStatistics();
    common2.setNumNonMissing(1);
    common2.setMinNumValues(1);
    common2.setMaxNumValues(5);
    stats2.setCommonStats(common2);
    f2.setStringStats(stats2);
    d2.setFeaturesList([f2]);
    dl.setDatasetsList([d, d2]);
    const dm = new OverviewDataModel(dl);

    expect(dm.getFeatureSpecForFeature('int')).to.equal(utils.FS_VAR_LEN_INTS);
  });
});

describe('getChartAlpha', () => {
  let dm: OverviewDataModel;
  let dl: DatasetFeatureStatisticsList;

  beforeEach(() => {
    dl = new DatasetFeatureStatisticsList();
    dl.setDatasetsList([]);
  });

  const addDataset = (name: string | null): DatasetFeatureStatistics => {
    const d = new DatasetFeatureStatistics();
    if (name != null) {
      d.setName(name);
    }
    dl.getDatasetsList().push(d);
    return d;
  };

  it('returns 1 with 0 or 1 datasets', () => {
    dm = new OverviewDataModel(dl);
    expect(dm.getChartAlpha()).to.equal(1);
    addDataset('dataset');
    dm = new OverviewDataModel(dl);
    expect(dm.getChartAlpha()).to.equal(1);
  });

  it('returns .4 with 2 datasets', () => {
    addDataset('dataset');
    addDataset('dataset2');
    dm = new OverviewDataModel(dl);
    expect(dm.getChartAlpha()).to.equal(0.4);
  });
});

describe('getChartColorString', () => {
  let dm: OverviewDataModel;
  let dl: DatasetFeatureStatisticsList;

  beforeEach(() => {
    dl = new DatasetFeatureStatisticsList();
    dl.setDatasetsList([]);
  });

  const addDataset = (name: string | null): DatasetFeatureStatistics => {
    const d = new DatasetFeatureStatistics();
    if (name != null) {
      d.setName(name);
    }
    dl.getDatasetsList().push(d);
    return d;
  };

  it('returns 1 with 0 or 1 datasets', () => {
    addDataset('dataset');
    dm = new OverviewDataModel(dl);
    expect(dm.getChartColorString(0)).to.equal('rgba(66, 133, 244, 1)');
  });

  it('returns .4 with 2 datasets', () => {
    addDataset('dataset');
    addDataset('dataset2');
    dm = new OverviewDataModel(dl);
    expect(dm.getChartColorString(0)).to.equal('rgba(66, 133, 244, 0.4)');
  });
});
