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
import * as sf from '../../lib/string-format';
import * as vis from '../facets-dive-vis/facets-dive-vis';

export interface FacetsDiveLegend extends Element {
  // DATA PROPERTIES.

  /**
   * Field used to color items.
   */
  colorBy: string;

  /**
   * Palette used for coloring items.
   */
  palette: vis.Palette;
}

/**
 * Polymer shim. Custom callbacks and private properties begin with underscores.
 */
Polymer({
  is: 'facets-dive-legend',

  properties: {
    colorBy: {
      type: String,
      value: '',
      observer: '_open',
    },
    palette: {
      type: Array,
      value: [],
    },
    _opened: {
      type: Boolean,
      value: false,
    },
  },

  /**
   * Break up long strings and also truncate if too long.
   */
  _breakUpAndTruncate(longString: string): string {
    return sf.breakAfterNonWords(sf.truncateLongString('' + longString));
  },

  /**
   * Returns true if any coloring settings are in effect.
   */
  _anyColor(this: any, colorBy: string, palette?: vis.Palette) {
    return !!(this.colorBy && this.palette && this.palette.length);
  },

  /**
   * If this is a 'special' label, return the 'special' class for styling.
   */
  _specialClass(special: boolean): string {
    return special ? 'special' : '';
  },

  /**
   * Opens the legend panel if it's not open already.
   */
  _open(this: any) {
    this._opened = true;
  },

  /**
   * Toggles if the legend panel is opened.
   */
  _toggleOpened(this: any) {
    this._opened = !this._opened;
  },

  /**
   * Gets the icon for opening/closing the legend panel.
   */
  _getIcon(opened: boolean) {
    return opened ? "expand-less" : "expand-more";
  }
});
