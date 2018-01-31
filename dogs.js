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

var fd = document.querySelector('facets-dive');

var url = './random-dogs'
d3.json(`${url}.json`, function(data) {
  fd.data = data;
  fd.atlasUrl = `${url}.png`;
});

var PRESET_VIEWS = [
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
    description: 'Strokes vs. Liklihood of Correctness',
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

var presets = document.querySelector('.presets');
d3.select(presets)
    .selectAll('option')
    .data(PRESET_VIEWS)
    .enter()
    .append('option')
    .attr('value', function(view, index) { return index; })
    .text(function(view) {return view.description;});

var loadSettings = function(index) {
  var {settings} = PRESET_VIEWS[index];
  for (var attr in settings) {
    fd[attr] = settings[attr];
  }
};
presets.onchange = function() {
  loadSettings(+presets.value);
};
loadSettings(0);
