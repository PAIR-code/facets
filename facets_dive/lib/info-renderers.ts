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
/**
 * @fileoverview Example implementation of a custom renderer for the
 * <facets-dive-info-card> component.
 */

/**
 * Given an object and a container element to fill, render the data object's
 * important information to the element.
 */
export const defaultInfoRenderer = (selectedObject: any, elem: Element) => {
  const dl = document.createElement('dl');
  for (const field in selectedObject) {
    if (!selectedObject.hasOwnProperty(field)) {
      continue;
    }
    const dt = document.createElement('dt');
    dt.textContent = field;
    dl.appendChild(dt);
    const dd = document.createElement('dd');
    dd.textContent = selectedObject[field];
    dl.appendChild(dd);
  }
  elem.appendChild(dl);
};
