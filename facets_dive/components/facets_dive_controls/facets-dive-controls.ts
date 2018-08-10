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
import {FieldStats} from '../../lib/stats';
import * as sf from '../../lib/string-format';
import * as vis from '../facets-dive-vis/facets-dive-vis';

export interface FacetsDiveControls extends Element {
  // DATA PROPERTIES.

  /**
   * URL to an atlas image to back sprites.
   */
  atlasUrl: string;

  /**
   * Array of keys which appear in the underlying data. Input only.
   */
  keys: string[];

  /**
   * Hash of statistics describing fields of the underlying data.
   */
  stats: {[field: string]: FieldStats};

  // USER-INTERACTION PROPERTIES.

  /**
   * Selected field to facet vertically.
   */
  verticalFacet: string;

  /**
   * Number of buckets when faceting vertically.
   */
  verticalBuckets: number;

  /**
   * Whether to treat the vertical facet as a bag of words. Only matters when
   * the field's FieldStats has a WordTree with more than one level.
   */
  verticalBagOfWords: number;

  /**
   * Selected field to facet horizontally.
   */
  horizontalFacet: string;

  /**
   * Number of buckets when faceting horizontally.
   */
  horizontalBuckets: number;

  /**
   * Whether to treat the horizontal facet as a bag of words. Only matters when
   * the field's FieldStats has a WordTree with more than one level.
   */
  horizontalBagOfWords: number;

  /**
   * Mode used for positioning items within grid cells. Choices are 'stacked'
   * and 'scatter'. Stacked is the default.
   */
  positionMode: string;

  /**
   * Field used to position items along the vertical axis when in scatter mode.
   */
  verticalPosition: string;

  /**
   * Field used to position items along the horizontal axis.
   */
  horizontalPosition: string;

  /**
   * Field used to color items.
   */
  colorBy: string;

  /**
   * Field used to render text onto each sprite's backing image.
   */
  imageFieldName: string;

  /**
   * Palette used for coloring items.
   */
  palette: vis.Palette;

  /**
   * Which source of colors (standard, warm, cool, or assist) should be used to
   * generate a palette.
   */
  paletteChoice: string;

  // STYLE PROPERTIES.

  /**
   * Label colors for grid faceting and item positioning.
   */
  gridFacetingVerticalLabelColor: string;
  gridFacetingHorizontalLabelColor: string;
  itemPositioningVerticalLabelColor: string;
  itemPositioningHorizontalLabelColor: string;
}

/**
 * Polymer shim. Custom callbacks and private properties begin with underscores.
 */
Polymer({
  is: 'facets-dive-controls',

  properties: {
    atlasUrl: {
      type: String,
      value: '',
    },
    keys: {
      type: Array,
      value: [],
    },
    stats: {
      type: Object,
      value: {},
    },
    verticalFacet: {
      type: String,
      value: '',
      notify: true,
    },
    verticalBuckets: {
      type: Number,
      value: vis.DEFAULT_VERTICAL_BUCKETS,
      notify: true,
    },
    verticalBagOfWords: {
      type: Boolean,
      value: false,
      notify: true,
    },
    horizontalFacet: {
      type: String,
      value: '',
      notify: true,
    },
    horizontalBuckets: {
      type: Number,
      value: vis.DEFAULT_HORIZONTAL_BUCKETS,
      notify: true,
    },
    horizontalBagOfWords: {
      type: Boolean,
      value: false,
      notify: true,
    },
    positionMode: {
      type: String,
      computed: '_getPositionMode(verticalPosition, horizontalPosition)',
      notify: true,
    },
    verticalPosition: {
      type: String,
      value: '',
      notify: true,
    },
    horizontalPosition: {
      type: String,
      value: '',
      notify: true,
    },
    colorBy: {
      type: String,
      value: '',
      notify: true,
    },
    imageFieldName: {
      type: String,
      value: '',
      notify: true,
    },
    palette: {
      type: Array,
      value: [],
    },
    paletteChoice: {
      type: String,
      value: 'standard',
      notify: true,
    },
    gridFacetingVerticalLabelColor: {
      type: String,
      value: vis.GRID_FACETING_VERTICAL_LABEL_COLOR,
      observer: '_updateCSSVars',
    },
    gridFacetingHorizontalLabelColor: {
      type: String,
      value: vis.GRID_FACETING_HORIZONTAL_LABEL_COLOR,
      observer: '_updateCSSVars',
    },
    itemPositioningVerticalLabelColor: {
      type: String,
      value: vis.ITEM_POSITIONING_VERTICAL_LABEL_COLOR,
      observer: '_updateCSSVars',
    },
    itemPositioningHorizontalLabelColor: {
      type: String,
      value: vis.ITEM_POSITIONING_HORIZONTAL_LABEL_COLOR,
      observer: '_updateCSSVars',
    },
  },

  _getImageFieldNameDefaultLabel(atlasUrl: string): string {
    return atlasUrl ? '(image)' : '(default)';
  },

  _isModeScatter(positionMode: string): boolean {
    return positionMode === 'scatter';
  },

  _isKeyNumeric(this: any, key: string): boolean {
    return this.stats && (key in this.stats) && this.stats[key].isNumeric();
  },

  _isKeyCategorical(this: any, key: string): boolean {
    return this.stats && (key in this.stats) && !this.stats[key].isNumeric();
  },

  _updateCSSVars(this: any) {
    this.customStyle['--grid-faceting-vertical-label-color'] =
        this.gridFacetingVerticalLabelColor;
    this.customStyle['--grid-faceting-horizontal-label-color'] =
        this.gridFacetingHorizontalLabelColor;
    this.customStyle['--item-positioning-vertical-label-color'] =
        this.itemPositioningVerticalLabelColor;
    this.customStyle['--item-positioning-horizontal-label-color'] =
        this.itemPositioningHorizontalLabelColor;
    this.updateStyles();
  },

  /**
   * Break up long strings and also truncate if too long.
   */
  _breakUpAndTruncate(longString: string): string {
    return sf.breakAfterNonWords(sf.truncateLongString('' + longString));
  },

  /**
   * Return the maximum number of buckets to allow for this facet.
   */
  _maxBuckets(this: any, fieldName: string, bagOfWords: boolean): number {
    const defaultMax = 100;
    const fieldStats: FieldStats = this.stats[fieldName];
    if (!fieldStats) {
      return defaultMax;
    }
    if (bagOfWords && this._hasWordTree(fieldName)) {
      return Math.min(defaultMax, fieldStats.wordTree!.highestLevel);
    }
    return Math.min(defaultMax, fieldStats.uniqueCount + 1);
  },

  /**
   * Return whether the chosen field has a usable word tree.
   */
  _hasWordTree(this: any, fieldName: string): boolean {
    const fieldStats: FieldStats = this.stats[fieldName];
    return !!fieldStats && !!fieldStats.wordTree &&
        fieldStats.wordTree.highestLevel > 1;
  },

  /**
   * Returns the positioning mode of the visualization.
   */
  _getPositionMode(
      this: any, verticalPosition: string, horizontalPosition: string) {
    return verticalPosition == '' && horizontalPosition == '' ?
        vis.DEFAULT_POSITION_MODE :
        'scatter';
  },

  /**
   * Opens the overflow menu.
   */
  _openOverflow(this: any) {
    this.$.overflowmenu.positionElement = this.$.overflowbtn;
    this.$.overflowmenu.open();
  },

  /**
   * Returns if the overflow menu button should be shown.
   */
  _shouldShowOverflowMenu(
      this: any, colorBy: string, verticalFacet: string,
      horizontalFacet: string) {
    return this._isKeyCategorical(colorBy) ||
        this._hasWordTree(verticalFacet) || this._hasWordTree(horizontalFacet);
  },
});
