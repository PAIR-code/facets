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
import {FacetsDive} from '../components/facets-dive/facets-dive';

const ss = document.querySelector('facets-dive') as FacetsDive;

const loadDataset = (url: string) => {
  (d3.json(`${url}.json`) as any).then((data: Array<{}>) => {
    ss.data = data;
    ss.atlasUrl = `${url}.png`;
  });
};

const datasets = document.querySelector('.datasets') as HTMLSelectElement;
datasets.onchange = () => loadDataset(datasets.value);
loadDataset(datasets.querySelector('option').value);

const PRESET_VIEWS = [
  {
    description: '-- select --',
    settings: {
      'verticalFacet': '',
      'verticalBuckets': 10,
      'horizontalFacet': '',
      'horizontalBuckets': 10,
      'positionMode': 'stacked',
      'verticalPosition': '',
      'horizontalPosition': '',
      'colorBy': ''
    },
  },
  {
    description: 'Correctness vs. Number of Points',
    settings: {
      'verticalFacet': 'recognized',
      'verticalBuckets': 3,
      'horizontalFacet': 'numpoints',
      'horizontalBuckets': 25,
      'positionMode': 'stacked',
      'verticalPosition': 'numpoints',
      'horizontalPosition': 'numstrokes',
      'colorBy': ''
    }
  },
  {
    description: 'US vs. GB Recognition',
    settings: {
      'verticalFacet': 'country',
      'verticalBuckets': 2,
      'horizontalFacet': 'recognized',
      'horizontalBuckets': 3,
      'positionMode': 'stacked',
      'verticalPosition': '',
      'horizontalPosition': '',
      'colorBy': ''
    }
  },
  {
    description: 'Strokes vs. Likelihood of Correctness',
    settings: {
      'verticalFacet': 'recognized',
      'verticalBuckets': 3,
      'horizontalFacet': '',
      'horizontalBuckets': 10,
      'positionMode': 'stacked',
      'verticalPosition': '',
      'horizontalPosition': '',
      'colorBy': 'numstrokes'
    }
  },
  {
    description: 'Strokes vs. Points Scatterplot',
    settings: {
      'verticalFacet': '',
      'verticalBuckets': 2,
      'horizontalFacet': '',
      'horizontalBuckets': 10,
      'positionMode': 'scatter',
      'verticalPosition': 'numpoints',
      'horizontalPosition': 'numstrokes',
      'colorBy': 'recognized'
    },
  },
  {
    description: 'Recognition Varies with Timestamp',
    settings: {
      'verticalFacet': '',
      'verticalBuckets': 10,
      'horizontalFacet': 'timestamp',
      'horizontalBuckets': 100,
      'positionMode': 'stacked',
      'verticalPosition': '',
      'horizontalPosition': '',
      'colorBy': 'recognized'
    },
  },
  {
    description: 'Small Scatterplots by Country/Timestamp',
    settings: {
      'verticalFacet': 'timestamp',
      'verticalBuckets': 24,
      'horizontalFacet': 'country',
      'horizontalBuckets': 6,
      'positionMode': 'scatter',
      'verticalPosition': 'numpoints',
      'horizontalPosition': 'numstrokes',
      'colorBy': 'recognized'
    },
  },
];

const presets = document.querySelector('.presets') as HTMLSelectElement;
d3.select(presets)
    .selectAll('option')
    .data(PRESET_VIEWS)
    .enter()
    .append('option')
    .attr('value', (view, index) => index)
    .text(view => view.description);

const loadSettings = (index: number) => {
  const {settings} = PRESET_VIEWS[index];
  for (const attr in settings) {
    ss[attr] = settings[attr];
  }
};
presets.onchange = () => loadSettings(+presets.value);
loadSettings(0);
