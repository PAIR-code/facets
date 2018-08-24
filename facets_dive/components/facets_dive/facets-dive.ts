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
import * as vis from '../../components/facets-dive-vis/facets-dive-vis';
import {FieldStats} from '../../lib/stats';

/**
 * TypeScript interface for the facets-dive element. Properties of this
 * interface directly map to the properties of the Polymer element below.
 */
export interface FacetsDive extends Element {
  // DATA PROPERTIES.

  /**
   * An array of data objects to visualize. Optional, but necessary to do
   * anything useful. Provided by upstream client.
   */
  data?: Array<{}>;

  /**
   * An array of indices into the data objects array (optional). If this is
   * non-null then only the entries in the data array with these indices
   * are to be visualized. Provided by upstream client.
   */
  filteredDataIndices?: number[];

  /**
   * An array of keys which appear in the bound data objects. These are
   * computed and should be treated as read-only.
   */
  _keys: string[];

  /**
   * Hash containing statistics about each field in the underlying data. These
   * are computed and should be treated as read-only.
   */
  stats: {[field: string]: FieldStats};

  // VISUALIZATION PROPERTIES.

  /**
   * URL of an atlas image to use for backing sprites. Each sprite is mapped
   * by its index to a rectangle of the atlas image. Optional. Provided by
   * upstream client.
   */
  atlasUrl?: string;

  /**
   * URL of a single, default sprite image to use for backing sprites. Each
   * sprite has this same image. Optional. Provided by upstream client. If not
   * provided, a generic looking dot will be used.
   */
  spriteUrl?: string;

  /**
   * Optional crossOrigin property to use on Image elements.
   * https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_settings_attributes
   */
  crossOrigin?: string;

  /**
   * Width of sprite backing images in pixels. Can be provided by upstream
   * client. If not provided, a reasonable default will be set.
   */
  spriteImageWidth: number;

  /**
   * Height of sprite backing images in pixels. Can be provided by upstream
   * client. If not provided, a reasonable default will be set.
   */
  spriteImageHeight: number;

  /**
   * Label colors for grid faceting and item positioning. Can be provided by
   * upstream client. If not provided, a reasonabl default will be set.
   */
  gridFacetingVerticalLabelColor: string;
  gridFacetingHorizontalLabelColor: string;
  itemPositioningVerticalLabelColor: string;
  itemPositioningHorizontalLabelColor: string;

  /**
   * Whether to attempt to fill available visualization area when arranging
   * items into the grid. If missing/false, then the default aspect ratio of 1
   * (square) will be used.
   */
  fitGridAspectRatioToViewport: boolean;

  // INTER-COMPONENT WIRING PROPERTIES.

  /**
   * Name of the field of the data to facet by vertically. Can be changed by
   * the user through the facets-dive-controls element.
   */
  verticalFacet: string;

  /**
   * Number of buckets to use when faceting vertically.
   */
  verticalBuckets: number;

  /**
   * For string-based, multi-word fields, the visualization can treat the values
   * as a bag-of-words, rather than as full strings. For example, say a field
   * had values like "toy store" and "pet store". The bag-of-words capability
   * would bucket all the "store" values together, or split them into "toy
   * store" and "pet store" depending on the number of buckets.
   *
   * This property determines whether the vertical facet should be treated as a
   * bag-of-words.
   */
  verticalBagOfWords: boolean;

  /**
   * Name of the field of the data to facet by horizontally. Can be changed by
   * the user through the facets-dive-controls element.
   */
  horizontalFacet: string;

  /**
   * Number of buckets to use when faceting horizontally.
   */
  horizontalBuckets: number;

  /**
   * Whether to treat the horizontal facet field as a bag of words.
   */
  horizontalBagOfWords: boolean;

  /**
   * Mode used for positioning items within grid cells. Choices are 'stacked'
   * and 'scatter'. Stacked is the default. Can be changed by the user through
   * the control element.
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
   * In the event that a per-sprite image is not available (no atlas), this
   * holds the name of the field used to draw text onto the backing canvas
   * behind the sprites.
   *
   * Say your data was a collection of books, each with a "title" attribute. If
   * imageFieldName was set to "title", then the title of each book would be
   * drawn onto a circle to represent that data point.
   */
  imageFieldName: string;

  /**
   * Palette used to color items. Internal.
   */
  _palette: vis.Palette[];

  /**
   * Which source color palette should be used for generating a data-specific
   * color palette. Can be changed by the user through the controls.
   */
  paletteChoice: string;

  /**
   * The currently selected data objects. They should all be elements of the
   * data array. Changed through user interaction (clicking sprites).
   */
  selectedData: Array<{}>;

  /**
   * Indices of data objects to compare against those that are selected. Set
   * programmatically, influences comparedData.
   */
  comparedIndices: number[];

  /**
   * The currently compared data objects. They should all be elements of the
   * data array. Changed in response to updates to the comparedIndices.
   */
  comparedData: Array<{}>;

  /**
   * If true then color legend is stable, meaning the color assignments are not
   * based on the counts of individual values, but on the alphabetical order of
   * the values.
   */
  stableColors: boolean;

  // STYLE PROPERTIES.

  /**
   * Height of the element in pixels. Optional. Provided by upstream client. If
   * left unspecified, the element will grow to fill its parent element.
   */
  height?: number;

  // ADVANCED CUSTOMIZATION.

  /**
   * Callback function to use to render the content of a data object for the
   * info pane. If not specified, the FacetsDiveInfoCard:defaultInfoRenderer
   * will be used.
   */
  infoRenderer?: (dataObject: {}, containerElem: Element) => void;

  /** Hides the info card if this is set to true. */
  hideInfoCard?: boolean;
}

Polymer({
  is: 'facets-dive',
  properties: {
    data: {
      type: Array,
      value: null,
      notify: true,
    },
    filteredDataIndices: {
      type: Array,
      value: null,
    },
    _keys: {
      type: Array,
      value: [],
    },
    stats: {
      type: Object,
      value: {},
      notify: true,
    },
    atlasUrl: {
      type: String,
      value: null,
      notify: true,
    },
    spriteUrl: {
      type: String,
      value: null,
      notify: true,
    },
    crossOrigin: {
      type: String,
      value: null,
      notify: true,
    },
    spriteImageWidth: {
      type: Number,
      value: vis.DEFAULT_SPRITE_IMAGE_WIDTH,
    },
    spriteImageHeight: {
      type: Number,
      value: vis.DEFAULT_SPRITE_IMAGE_HEIGHT,
    },
    gridFacetingVerticalLabelColor: {
      type: String,
      value: vis.GRID_FACETING_VERTICAL_LABEL_COLOR,
    },
    gridFacetingHorizontalLabelColor: {
      type: String,
      value: vis.GRID_FACETING_HORIZONTAL_LABEL_COLOR,
    },
    itemPositioningVerticalLabelColor: {
      type: String,
      value: vis.ITEM_POSITIONING_VERTICAL_LABEL_COLOR,
    },
    itemPositioningHorizontalLabelColor: {
      type: String,
      value: vis.ITEM_POSITIONING_HORIZONTAL_LABEL_COLOR,
    },
    fitGridAspectRatioToViewport: {
      type: Boolean,
      value: false,
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
      value: vis.DEFAULT_POSITION_MODE,
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
    _palette: {
      type: Array,
      value: [],
    },
    paletteChoice: {
      type: String,
      value: 'standard',
      notify: true,
    },
    selectedData: {
      type: Array,
      value: [],
      notify: true,
    },
    selectedIndices: {
      type: Array,
      value: [],
      notify: true,
    },
    comparedData: {
      type: Array,
      value: [],
      notify: true,
    },
    comparedIndices: {
      type: Array,
      value: [],
      notify: true,
    },
    height: {
      type: Number,
      value: null,
      observer: '_updateHeight',
    },
    infoRenderer: {
      type: Object,  // Function.
    },
    hideInfoCard: {
      type: Boolean,
      value: false,
    },
    stableColors: {
      type: Boolean,
      value: false,
    },
  },

  ready(this: any) {
    const $: {
      vis: vis.FacetsDiveVis; fitButton: HTMLElement; zoomInButton: HTMLElement;
      zoomOutButton: HTMLElement;
    } = this.$;

    $.fitButton.onclick = event => $.vis.fitToViewport();
    $.zoomInButton.onclick = event => $.vis.zoomIn();
    $.zoomOutButton.onclick = event => $.vis.zoomOut();

    if (this.hideInfoCard) {
      $.vis.style.right = '0';
    }
    this._updateHeight();
  },

  _updateHeight(this: any, height: number) {
    if (this.height !== null) {
      this.style.height =
          typeof this.height === 'number' ? this.height + 'px' : this.height;
    }
  },
});
