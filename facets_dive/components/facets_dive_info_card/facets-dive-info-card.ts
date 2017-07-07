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

import {defaultInfoRenderer} from '../../lib/info-renderers';

export interface FacetsDiveInfoCard extends Element {
  /**
   * Currently selected data objects.
   */
  selectedData: Object[];

  /**
   * Method to update the selected data objects.
   */
  _updateSelected: (selectedData: Object[]) => void;
}

Polymer({
  is: 'facets-dive-info-card',
  properties: {
    infoRenderer: {
      type: Object,  // Function.
    },
    selectedData: {
      type: Array,
      value: [],
      observer: '_updateSelected',
    },
  },
  _updateSelected(this: any, selectedData: Object[]) {
    const root = Polymer.dom(this.root);
    root.innerHTML = '';

    if (!selectedData) {
      return;
    }

    const infoRenderer = this.infoRenderer || defaultInfoRenderer;

    for (let i = 0; i < selectedData.length; i++) {
      const selectedObject = selectedData[i] as any;

      const div = document.createElement('div');
      div.style.width = '100%';
      root.appendChild(div);

      infoRenderer(selectedObject, div);
    }
  },
});
