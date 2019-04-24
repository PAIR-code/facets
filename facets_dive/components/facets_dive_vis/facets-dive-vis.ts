/**
 * @license
 * Copyright 2018 Google Inc.
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
import {Axis} from '../../lib/axis';
import {BoundedObject, Side} from '../../lib/bounded-object';
import {DataExample} from '../../lib/data-example';
import * as gridlib from '../../lib/grid';
import {LabelContent, LabelingFunction} from '../../lib/label';
import {Layout} from '../../lib/layout';
import * as sorting from '../../lib/sorting';
import {Sprite, SpriteImageData, SpriteMesh} from '../../lib/sprite-mesh';
import {FieldStats, getAllKeys, getStats} from '../../lib/stats';
import * as sf from '../../lib/string-format';
import * as wordtree from '../../lib/wordtree';

declare var THREE: any;

export type Cell = gridlib.Cell;
export type Grid = gridlib.Grid;
export type ItemPosition = gridlib.ItemPosition;
export type Key = sorting.Key;

const BAG_OF_WORDS_SEPARATOR = '\u2022';  // Unicode bullet character.
const BAG_OF_WORDS_SUFFIX = '\u2026';     // Unicode ellipsis character.

// Default values of element properties.
export const DEFAULT_SCENE_PADDING = 8;
export const DEFAULT_TWEEN_DURATION = 600;
export const DEFAULT_FADE_DURATION = 200;
export const DEFAULT_SPRITE_IMAGE_WIDTH = 64;
export const DEFAULT_SPRITE_IMAGE_HEIGHT = 64;
export const DEFAULT_VERTICAL_BUCKETS = 10;
export const DEFAULT_HORIZONTAL_BUCKETS = 10;
export const DEFAULT_POSITION_MODE = 'stacked';

/**
 * Colors to use for Grid Faceting and Item Positioning headers.
 */
export const GRID_FACETING_VERTICAL_LABEL_COLOR = '#666666';
export const GRID_FACETING_HORIZONTAL_LABEL_COLOR = '#dd6622';
export const ITEM_POSITIONING_VERTICAL_LABEL_COLOR = '#2255aa';
export const ITEM_POSITIONING_HORIZONTAL_LABEL_COLOR = '#118844';

/**
 * Space in world coordinates to leave between Grid Cells.
 */
export const GRID_CELL_MARGIN = 1;

/**
 * Colors for cell background properties.
 */
export const CELL_BACKGROUND_FILL_COLOR = '#f8f8f9';

/**
 * Color for selected item borders.
 */
const SELECTED_ITEM_COLOR = '#fad411';

/**
 * Color for stroke around selected item borders.
 */
const SELECTED_ITEM_COLOR_STROKE = '#483d06';

/**
 * Stroke width for the selected item borders.
 */
const SELECTED_ITEM_STROKE_WIDTH = 0.15;

/**
 * Scale of selected highlight box initially before fade-in.
 */
const SELECTED_ITEM_INITIAL_SCALE = 3;

/**
 * Final scale of selected highlight box after fade-in.
 */
const SELECTED_ITEM_FINAL_SCALE = 0.8;

/**
 * Color for compared item borders.
 */
const COMPARED_ITEM_COLOR = '#1d6b1d';

/**
 * Color for stroke around compared item borders.
 */
const COMPARED_ITEM_COLOR_STROKE = '#44ff44';

/**
 * Stroke width for the compared item borders.
 */
const COMPARED_ITEM_STROKE_WIDTH = 0.15;

/**
 * Scale of compared highlight box initially before fade-in.
 */
const COMPARED_ITEM_INITIAL_SCALE = 3;

/**
 * Final scale of compared highlight box after fade-in.
 */
const COMPARED_ITEM_FINAL_SCALE = 0.8;

/**
 * Precision to use for numeric labels in digits.
 */
export const DEFAULT_NUMERIC_LABEL_PRECISION = 3;

/**
 * Maximum and minimum allowed cell aspect ratio for item positioning mode.
 * Does not affect stacking, but prevents extremely wide or extremely tall
 * cells which become unreadable.
 */
export const ITEM_POSITIONING_MIN_CELL_ASPECT_RATIO = 1;
export const ITEM_POSITIONING_MAX_CELL_ASPECT_RATIO = 2;

/**
 * Cell padding to apply when using item positioning to allow for axes.
 * These values are measured in item widths (multiples of item aspect ratio).
 */
export const ITEM_POSITIONING_CELL_PADDING = {
  top: 0,
  left: 8,
  right: 0,
  bottom: 8,
};

/**
 * How much space in screen pixels to leave around the item position label.
 * These values create minimums which will cause the labels to be hidden if
 * they would collide.
 */
export const ITEM_POSITIONING_LABEL_MARGIN = {
  bottom: 6,
  left: 6,
  right: 6,
  top: 6,
};

/**
 * How much space in screen pixels to leave around the grid faceting labels.
 * These values create minimums which will cause the labels to be hidden if
 * they would collide.
 */
export const GRID_FACETING_LABEL_MARGIN = {
  bottom: 8,
  left: 8,
  right: 8,
  top: 8,
};

/**
 * How much length to add to scatter plot label strings when computing the
 * bounding box for them.
 */
const LABEL_LENGTH_PAD = 3;

/**
 * String to use to capture "OTHER" values when the field has too many unique
 * values for faceting.
 *
 * The Unicode character U+FFFC is the Object Replacement Character, and is
 * used here to create a string that since is unlikely to conflict with data.
 *
 * See https://en.wikipedia.org/wiki/Specials_(Unicode_block)
 */
const FACETING_OTHER_PLACEHOLDER: Key = '\ufffcOTHER\ufffc';

/**
 * String to show on the label in place of the FACETING_OTHER_PLACEHOLDER.
 */
const FACETING_OTHER_LABEL = 'other';

/**
 * String to use to capture non-string values (which have no words) when
 * faceting on a string field with bag-of-words enabled.
 */
const FACETING_NO_WORDS_PLACEHOLDER = '\ufffcNO_WORDS\ufffc';

/**
 * String to show on the label in place of FACETING_NO_WORDS_PLACEHOLDER.
 */
const FACETING_NO_WORDS_LABEL = 'non-words';

/**
 * String to use at the root when faceting with bag-of-words.
 */
const FACETING_ALL_WORDS_PLACEHOLDER = '\ufffcALL_WORDS\ufffc';

/**
 * String to show on the label in place of FACETING_ALL_WORDS_PLACEHOLDER.
 */
const FACETING_ALL_WORDS_LABEL = 'other';

/**
 * Mapping between a placeholder string and the value that should replace it.
 */
const FACETING_PLACEHOLDERS: {[placeholder: string]: string} = {};
FACETING_PLACEHOLDERS[FACETING_OTHER_PLACEHOLDER] = FACETING_OTHER_LABEL;
FACETING_PLACEHOLDERS[FACETING_NO_WORDS_PLACEHOLDER] = FACETING_NO_WORDS_LABEL;
FACETING_PLACEHOLDERS[FACETING_ALL_WORDS_PLACEHOLDER] =
    FACETING_ALL_WORDS_LABEL;

/**
 * Minimum allowed width in pixels left for the grid after applying padding. If
 * the padding would cause less than this number of pixels to be available for
 * the grid, then padding is traded off to preserve this.
 */
const MIN_GRID_SCREEN_WIDTH_PX = 200;

/**
 * Minimum allowed height in pixels left for the grid after applying padding. If
 * the padding would cause less than this number of pixels to be available for
 * the grid, then padding is traded off to preserve this.
 */
const MIN_GRID_SCREEN_HEIGHT_PX = 200;

/**
 * The default labeling function replaces placeholders, treats numbers and
 * strings as such and calls all other values special.
 */
const DEFAULT_LABELING_FUNCTION: LabelingFunction = (key: Key) => {
  if (key !== null && key in FACETING_PLACEHOLDERS) {
    return {
      label: FACETING_PLACEHOLDERS[key],
      special: true,
    };
  }
  if (typeof key !== 'number' && typeof key !== 'string') {
    return {
      label: '' + key,
      special: true,
    };
  }
  return {
    label: sf.truncateLongString('' + key),
    special: false,
  };
};

/**
 * Quantum charting standard palette.
 */
const PALETTE_STANDARD: string[] = [
  '#4285F4',
  '#DB4437',
  '#F4B400',
  '#0F9D58',
  '#AB47BC',
  '#00ACC1',
  '#FF7043',
  '#9E9D24',
  '#5C6BC0',
  '#F06292',
  '#00796B',
  '#C2185B',
];

/**
 * Quantum charting cool palette.
 */
const PALETTE_COOL: string[] = [
  '#4285F4',
  '#0F9D58',
  '#00ACC1',
  '#9E9D24',
  '#5C6BC0',
  '#00796B',
  '#607D8B',
];

/**
 * Quantum charting warm palette.
 */
const PALETTE_WARM: string[] = [
  '#DB4437',
  '#F4B400',
  '#AB47BC',
  '#F06292',
  '#AB47BC',
  '#795548',
  '#FF7043',
  '#C2185B',
];

/**
 * Quartum charting color-blind assist palette.
 */
const PALETTE_ASSIST: string[] = [
  '#4285F4',
  '#C53929',
  '#F7CB4D',
  '#0B8043',
  '#5E35B1',
  '#80DEEA',
  '#FF7043',
  '#C0CA33',
];

/**
 * Quantum charting numeric color palette.
 */
const PALETTE_NUMERIC = {
  start: 'white',
  end: '#1C3AA9',      // Google Blue 900
  missing: '#A52714',  // Google Red 900
};

/**
 * Quantum charting palette's recommended 'other' color.
 */
const PALETTE_OTHER_COLOR = '#F0F0F0';

/**
 * Amount to mix the color with the underlying image (0-255).
 */
const COLOR_BY_MIX = 180;

/**
 * Amount to zoom in or out when doing so by increments.
 * @see zoomIn() and zoomOut() methods.
 */
const ZOOM_INCREMENT = 1.1;

/**
 * Certain changes, such as updating the atlasUrl, are expensive enough to
 * require debouncing. This is the number of milliseconds of time to require
 * before locking in such a change.
 */
const UPDATE_DEBOUNCE_DELAY_MS = 100;

/**
 * A grid item is the marriage of a sprite and its backing data example object.
 */
interface GridItem {
  sprite: Sprite;
  data: DataExample;
}

export interface LabelAttributes {
  'alignment-baseline': string;
  'fill': string;
  'font-size': number;
  'text-anchor': string;
  'x': number;
  'y': number;

  /**
   * Any additional attributes.
   */
  [name: string]: number|string;
}

// Default values for label properties.
export const DEFAULT_LABEL_ROTATE = 0;  // Degrees clockwise.
export const DEFAULT_LABEL_ATTRIBUTES: LabelAttributes = {
  'alignment-baseline': 'middle',
  'fill': '#444444',
  'font-size': 18,  // px
  'font-style': 'normal',
  'text-anchor': 'middle',
  'x': 0,  // px
  'y': 0,  // px
};

export const ITEM_POSITIONING_LABEL_FONT_SIZE_PX = 16;

/**
 * A label object contains information about a label to display.
 */
export class Label extends BoundedObject {
  /**
   * The text content of the label.
   */
  text: string;

  /**
   * X position in world coordinates to place this label.
   */
  x: number;

  /**
   * Y coordinate in world coordinates to place this label.
   */
  y: number;

  /**
   * On which side of the visualization to show this label.
   */
  side: Side;

  /**
   * The ID of the label for D3 binding purposes. If not present, a combination
   * of other fields will be used.
   */
  id?: string;

  /**
   * The Grid Cell to which this label is attached.
   */
  cell?: Cell;

  /**
   * Degrees to rotate this label clockwise.
   */
  rotate?: number;

  /**
   * Offset position.
   */
  offsetPosition?: {x?: number, y?: number};

  /**
   * Additional attributes to set for this label. Examples include font-size,
   * text-anchor, x and y (local user-space coordinates).
   */
  attributes?: {[name: string]: number|string};
}

/**
 * Palette object maps a label string onto a color that should be used in
 * any items that match that label.
 */
export type Palette = Array<{
  /**
   * Key value which maps to this color.
   */
  key: Key;

  /**
   * Color value (like a hex string).
   */
  color: string;

  /**
   * Label string and special status to show for this color.
   */
  content: LabelContent;
}>;

type FacetingFunction = (item: GridItem) => (Key|null);

/**
 * A faceting info object contains information necessary to facet grid items,
 * sort facet keys, and create label strings from the facet keys.
 */
interface FacetingInfo {
  /**
   * Given a GridItem, produce a Key.
   */
  facetingFunction: FacetingFunction;

  /**
   * Given two keys, how should they be ordered? This is the kind of function
   * passed into Array.sort().
   */
  keyCompareFunction: (a: Key, b: Key) => number;

  /**
   * Given a key, return the label for that facet.
   */
  labelingFunction: LabelingFunction;
}

/**
 * External interface for the <facets-dive-vis> Polymer element.
 */
export interface FacetsDiveVis extends HTMLElement {
  // DATA PROPERTIES.

  /**
   * Array of input example data objects to visualize.
   */
  data: DataExample[];

  /**
   * An array of indices into the example data objects array (optional). If this
   * is non-null then only the entries in the data array with these indices
   * are to be visualized.
   */
  filteredDataIndices?: number[];

  /**
   * URL to an atlas image to use for sprite texture.
   */
  atlasUrl: string;

  /**
   * URL to a sprite image to draw onto the mesh's default sprite texture.
   */
  spriteUrl: string;

  /**
   * Optional crossOrigin property to use on Image elements.
   * https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_settings_attributes
   */
  crossOrigin?: string;

  /**
   * Array of all keys that appear in at least one object. If the data array
   * is empty or null, then this will be an empty array. This value is derived
   * and should not be set explicitly.
   */
  keys: string[];

  /**
   * Hash describing each field's statistics. Read only.
   */
  stats: {[field: string]: FieldStats};

  // STYLE PROPERTIES.

  /**
   * Space in pixels to preserve between the scene boundaries and the viewport.
   * Note that this only applies during initialization or recentering, and will
   * not be enforced when the user zooms and pans.
   */
  scenePadding: number;

  /**
   * Duration of tween animations in ms.
   */
  tweenDuration: number;

  /**
   * Duration of image fade in ms. Used when loading image data.
   */
  fadeDuration: number;

  /**
   * Width of sprite backing images in pixels.
   */
  spriteImageWidth: number;

  /**
   * Height of sprite backing images in pixels.
   */
  spriteImageHeight: number;

  /**
   * Label colors for grid faceting and item positioning.
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

  // USER-INTERACTION PROPERTIES.

  /**
   * Field of the data to facet by vertically.
   */
  verticalFacet: string;

  /**
   * Number of buckets to use when faceting vertically.
   */
  verticalBuckets: number;

  /**
   * Whether to treat the vertical facet as a bag of words.
   */
  verticalBagOfWords: boolean;

  /**
   * Field of the data to facet by horizontally.
   */
  horizontalFacet: string;

  /**
   * Number of buckets to use when faceting horizontally.
   */
  horizontalBuckets: number;

  /**
   * Whether to treat the horizontal facet as a bag of words.
   */
  horizontalBagOfWords: boolean;

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
   * Field used to draw backing images onto sprites.
   */
  imageFieldName: string;

  /**
   * Palette used for coloring items.
   */
  palette: Palette;

  /**
   * Choice of source colors to use when generating a palette.
   */
  paletteChoice: string;

  /**
   * Currently selected objects. Should all be elements of the data array.
   */
  selectedData: Array<{}>;

  /**
   * Indices of currently selected objects from the data array.
   */
  selectedIndices: number[];

  /**
   * Currently compared objects. Should all be elements of the data array.
   */
  comparedData: Array<{}>;

  /**
   * Indices of currently compared objects from the data array.
   */
  comparedIndices: number[];

  /**
   * If true then color legend is stable, meaning the color assignments are not
   * based on the counts of individual values, but on the alphabetical order of
   * the values.
   */
  stableColors: boolean;

  /**
   * Polymer setter for attribute values.
   */
  // tslint:disable-next-line:no-any TODO(jimbo): Upgrade to typed Polymer.
  set: (path: string, value: any) => void;

  // PUBLIC METHODS.

  /**
   * Fit to screen.
   */
  fitToViewport: () => void;

  /**
   * Zoom in.
   */
  zoomIn: () => void;

  /**
   * Zoom out.
   */
  zoomOut: () => void;
}

/**
 * Internal backing class implementing support logic for the element.
 */
class FacetsDiveVizInternal {
  /**
   * Hash describing each field's statistics. Read only.
   */
  stats: {[field: string]: FieldStats};

  /**
   * D3 selection wrapping the SVG element containing cell background elements.
   */
  cellBackgroundSVG: d3.Selection<SVGSVGElement, {}, null, undefined>;

  /**
   * D3 selection wrapping the root of the cell background SVG.
   */
  cellBackgroundSVGRoot: d3.Selection<SVGGElement, {}, null, undefined>;

  /**
   * D3 selection wrapping the <g> element for containing cell background rects.
   */
  cellBackgroundLayer: d3.Selection<SVGGElement, {}, null, undefined>;

  /**
   * D3 selection wrapping the SVG element containing labels and axes.
   */
  labelsAndAxesSVG: d3.Selection<SVGSVGElement, {}, null, undefined>;

  /**
   * D3 selection wrapping the labels and axes SVG root group element.
   */
  labelsAndAxesSVGRoot: d3.Selection<SVGGElement, {}, null, undefined>;

  /**
   * D3 selection wrapping the <g> element for axes within grid cells.
   */
  axesLayer: d3.Selection<SVGGElement, {}, null, undefined>;

  /**
   * D3 selection wrapping the <g> element for label text elements.
   */
  labelsLayer: d3.Selection<SVGGElement, {}, null, undefined>;

  /**
   * D3 selection wrapping the <g> element for selected item borders.
   */
  selectedLayer: d3.Selection<SVGGElement, {}, null, undefined>;

  /**
   * D3 selection wrapping the <g> element for compared item borders.
   */
  comparedLayer: d3.Selection<SVGGElement, {}, null, undefined>;

  /**
   * Layout object handling fit-to-screen logic.
   */
  layout: Layout;

  /**
   * THREE.js Sceen for placing sprites.
   */
  scene: THREE.Scene;

  /**
   * THREE.js Camera for observing scene.
   */
  camera: THREE.OrthographicCamera;

  /**
   * THREE.js Renderer for rendering scene to canvas.
   */
  renderer: THREE.WebGLRenderer;

  /**
   * Magnification factor between sprite world coordinates and screen pixels.
   */
  scale: number;

  /**
   * SpriteMesh housing Sprites for the incoming data.
   */
  spriteMesh: SpriteMesh;

  /**
   * Collection of GridItems that map to the underlying data. A subset of these
   * are positioned by the grid, specifically those which appear in the
   * filteredDataIndices array.
   */
  items: GridItem[];

  /**
   * Grid used for laying out sprites.
   */
  grid: gridlib.Grid;

  /**
   * When renderScene() is called, if this time has not been passed, another
   * call to renderScene() will be queued for the next animation frame.
   */
  endTimestamp: number;

  /**
   * Whether a call to renderScene() has already been queued for the next frame.
   */
  renderQueued: boolean;

  /**
   * D3 zoom behavior instance attached to the element for user interaction.
   */
  zoom: d3.ZoomBehavior<Element, {}>;

  /**
   * List of label objects to show in the visualization. Determined by the
   * determineLabels() method.
   */
  labels: Label[];

  /**
   * Whether a colorBy field has been automatically specified. If so, then
   * when an atlas image gets loaded we'll want to clear it back out.
   */
  autoColorBy: boolean;

  /**
   * Vertical faceting callbacks.
   */
  verticalFacetInfo: FacetingInfo|null;

  /**
   * Horizontal faceting callbacks.
   */
  horizontalFacetInfo: FacetingInfo|null;

  /**
   * Timer handle returned by setTimeout() for debouncing atlasUrl changes.
   */
  atlasUrlChangeTimer: number;

  /**
   * The last atlas URL that was used.
   */
  lastAtlasUrl: string;

  /**
   * Flag to signal that a change is already being processed, and other
   * handlers should ignore it.
   */
  ignoreChange: boolean;

  /**
   * Capture Polymer element instance and prep internal state.
   */
  constructor(public elem: FacetsDiveVis) {
    this.endTimestamp = 0;
    this.renderQueued = false;
    this.labels = [];
    this.autoColorBy = false;
    this.verticalFacetInfo = null;
    this.horizontalFacetInfo = null;
  }

  /**
   * Perform setup that must wait for element's DOM to be present.
   */
  ready() {
    // Layout object will be used for computing camera position and frustum to
    // to fit within the viewport.
    this.layout = new Layout();

    // Insert background SVG used for cell backgrounds.
    this.cellBackgroundSVG = d3.select(this.elem)
                                 .append<SVGSVGElement>('svg')
                                 .style('left', 0)
                                 .style('position', 'absolute')
                                 .style('top', 0);
    this.cellBackgroundSVGRoot =
        this.cellBackgroundSVG.append<SVGGElement>('g').attr('class', 'root');

    // Layer for cell backround rects.
    this.cellBackgroundLayer =
        this.cellBackgroundSVGRoot.append<SVGGElement>('g').attr(
            'class', 'labels');

    // Create the THREE.js Scene, Camera and Renderer for content. The camera's
    // left, right, top and bottom frustum values will be overridden as soon as
    // viewport size information becomes available.
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(0, 100, 0, 100, 0.1, 1000);
    try {
      this.renderer = new THREE.WebGLRenderer({alpha: true});
      this.renderer.setPixelRatio(window.devicePixelRatio);
      d3.select(this.renderer.domElement)
          .style('left', 0)
          .style('pointer-events', 'none')
          .style('position', 'absolute')
          .style('top', 0);
      this.elem.appendChild(this.renderer.domElement);
    } catch (err) {
      // An error will be displayed below.
    }

    // Create and attach zoom behavior to element.
    this.zoom =
        d3.zoom().scaleExtent([1, 500]).on('zoom', this.zoomed.bind(this));
    d3.select(this.elem).call(this.zoom);

    // Insert background SVG used for labels and axes.
    this.labelsAndAxesSVG = d3.select(this.elem)
                                .append<SVGSVGElement>('svg')
                                .style('left', 0)
                                .style('position', 'absolute')
                                .style('top', 0);
    this.labelsAndAxesSVGRoot =
        this.labelsAndAxesSVG.append<SVGGElement>('g').attr('class', 'root');

    // Layers for labels, axes and selected item borders.
    this.labelsLayer = this.labelsAndAxesSVGRoot.append<SVGGElement>('g').attr(
        'class', 'labels');
    this.axesLayer = this.labelsAndAxesSVGRoot.append<SVGGElement>('g').attr(
        'class', 'axes');
    this.comparedLayer =
        this.labelsAndAxesSVGRoot.append<SVGGElement>('g').attr(
            'class', 'comparedboxes');
    this.selectedLayer =
        this.labelsAndAxesSVGRoot.append<SVGGElement>('g').attr(
            'class', 'selectedboxes');

    // Set up click handler for labels and axes SVG.
    this.labelsAndAxesSVG.on('click', this.clicked.bind(this));

    // Hide layers if WebGL isn't available.
    if (!this.renderer) {
      this.labelsAndAxesSVG.style('display', 'none');
      this.cellBackgroundSVG.style('display', 'none');
      d3.select(this.elem)
          .append('p')
          .attr('class', 'error')
          .style('color', 'darkred')
          .html(`
            <strong>ERROR</strong>: Facets Dive requires WebGL, and it is not
            enabled in your browser. See
            <a rel="noreferrer" href="http://webglreport.com/">
            WebGL Report</a> for details.
          `);
    }
  }

  /**
   * Handler for d3 zoom behavior events.
   */
  zoomed() {
    const {x, y, k: scale} = d3.event.transform;
    const factor = this.scale / scale;

    this.camera.top *= factor;
    this.camera.left *= factor;
    this.camera.right *= factor;
    this.camera.bottom *= factor;
    this.camera.position.set(-x / scale, y / scale, this.camera.position.z);
    this.camera.updateProjectionMatrix();

    this.scale = scale;

    // Transform SVG to match.
    this.transformSVG();

    // Show/hide objects based on visible space.
    this.updateObjectVisibility();

    this.queueRenderScene();
  }

  /**
   * Handler for click events on the backing SVG. First we determine the XY
   * coordinates in world space, then use this to determine which items were
   * selected.
   */
  clicked() {
    const rect = this.elem.getBoundingClientRect();
    const event = d3.event as MouseEvent;
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    const x = this.camera.position.x + mouseX / this.scale;
    const y = this.camera.position.y - mouseY / this.scale;
    const spriteIndexes = this.spriteMesh.findSprites(x, y);
    const selectedIndicesSet: {[index: number]: boolean} = {};
    if (event.ctrlKey) {
      for (let i = 0; i < this.elem.selectedIndices.length; i++) {
        selectedIndicesSet[this.elem.selectedIndices[i]] = true;
      }
    }
    for (let i = 0; i < spriteIndexes.length; i++) {
      selectedIndicesSet[spriteIndexes[i]] = true;
    }
    this.elem.set(
        'selectedIndices',
        Array.from(Object.keys(selectedIndicesSet).map(key => +key)));
    const selectedData = [];
    for (let i = 0; i < this.elem.selectedIndices.length; i++) {
      selectedData.push(this.elem.data[this.elem.selectedIndices[i]]);
    }
    this.elem.set('selectedData', selectedData);
  }

  /**
   * Update visuals of selected items.
   */
  selectedIndicesUpdated() {
    // Do not update if the mesh hasn't been created. In that case, the visuals
    // will be updated by the mesh creation itself.
    if (this.spriteMesh) {
      this.updateSelectedBoxes();
    }
  }

  /**
   * Update visuals of compared items.
   */
  comparedIndicesUpdated() {
    // Do not update if the mesh hasn't been created. In that case, the visuals
    // will be updated by the mesh creation itself.
    if (!this.spriteMesh) {
      return;
    }
    const comparedData = [];
    for (let i = 0; i < this.elem.comparedIndices.length; i++) {
      comparedData.push(this.elem.data[this.elem.comparedIndices[i]]);
    }
    this.elem.set('comparedData', comparedData);
    this.updateComparedBoxes();
  }

  /**
   * Update visual appearance of selected items. This code relies heavily on the
   * D3 join/update/enter/exit pattern.
   */
  updateSelectedBoxes() {
    const selectedBoxes: ItemPosition[] =
        this.elem.selectedIndices.map(index => {
          return {
            x: this.spriteMesh.getX(index),
            y: this.spriteMesh.getY(index)
          };
        });

    // JOIN.
    const selectedElements =
        this.selectedLayer.selectAll<SVGGElement, ItemPosition>('.selected')
            .data(selectedBoxes);

    // ENTER.
    const enterElements = selectedElements.enter()
                              .append('g')
                              .classed('selected', true)
                              .attr(
                                  'transform',
                                  (pos: ItemPosition) => {
                                    const x = 0.5 + (pos.x || 0);
                                    const y = 0.5 + (pos.y || 0);
                                    return `translate(${x},${y}) scale(${
                                        SELECTED_ITEM_INITIAL_SCALE})`;
                                  })
                              .style('opacity', 0);

    enterElements.append('rect')
        .attr('x', -0.5)
        .attr('y', -0.5)
        .attr('width', 1)
        .attr('height', 1)
        .attr('stroke', SELECTED_ITEM_COLOR_STROKE)
        .attr('stroke-linecap', 'round')
        .attr('stroke-linejoin', 'round')
        .attr('stroke-opacity', 0)
        .attr('stroke-width', SELECTED_ITEM_STROKE_WIDTH * 2)
        .attr('fill-opacity', 0);
    enterElements.append('rect')
        .attr('x', -0.5)
        .attr('y', -0.5)
        .attr('width', 1)
        .attr('height', 1)
        .attr('stroke', SELECTED_ITEM_COLOR)
        .attr('stroke-linecap', 'round')
        .attr('stroke-linejoin', 'round')
        .attr('stroke-opacity', 0)
        .attr('stroke-width', SELECTED_ITEM_STROKE_WIDTH)
        .attr('fill-opacity', 0);

    // ENTER + UPDATE.
    const mergedElements = enterElements.merge(selectedElements);
    mergedElements.transition()
        .attr(
            'transform',
            (pos: ItemPosition) => {
              const x = 0.5 + (pos.x || 0);
              const y = 0.5 + (pos.y || 0);
              return `translate(${x},${y}) scale(${SELECTED_ITEM_FINAL_SCALE})`;
            })
        .style('opacity', 1);
    mergedElements.selectAll('rect')
        .classed('rotate', true)
        .attr('stroke-opacity', 1);

    // EXIT.
    selectedElements.exit().transition().style('opacity', 0).remove();
  }

  /**
   * Update visual appearance of compared items. This code relies heavily on the
   * D3 join/update/enter/exit pattern.
   */
  updateComparedBoxes() {
    const comparedBoxes: ItemPosition[] =
        this.elem.comparedIndices.map(index => {
          return {
            x: this.spriteMesh.getX(index),
            y: this.spriteMesh.getY(index)
          };
        });

    // JOIN.
    const comparedElements =
        this.comparedLayer.selectAll<SVGGElement, ItemPosition>('.compared')
            .data(comparedBoxes);

    // ENTER.
    const enterElements = comparedElements.enter()
                              .append('g')
                              .classed('compared', true)
                              .attr(
                                  'transform',
                                  (pos: ItemPosition) => {
                                    const x = 0.5 + (pos.x || 0);
                                    const y = 0.5 + (pos.y || 0);
                                    return `translate(${x},${y}) scale(${
                                        COMPARED_ITEM_INITIAL_SCALE})`;
                                  })
                              .style('opacity', 0);

    enterElements.append('rect')
        .attr('x', -0.5)
        .attr('y', -0.5)
        .attr('width', 1)
        .attr('height', 1)
        .attr('stroke', COMPARED_ITEM_COLOR_STROKE)
        .attr('stroke-linecap', 'round')
        .attr('stroke-linejoin', 'round')
        .attr('stroke-opacity', 0)
        .attr('stroke-width', COMPARED_ITEM_STROKE_WIDTH * 2)
        .attr('fill-opacity', 0);
    enterElements.append('rect')
        .attr('x', -0.5)
        .attr('y', -0.5)
        .attr('width', 1)
        .attr('height', 1)
        .attr('stroke', COMPARED_ITEM_COLOR)
        .attr('stroke-linecap', 'round')
        .attr('stroke-linejoin', 'round')
        .attr('stroke-opacity', 0)
        .attr('stroke-width', COMPARED_ITEM_STROKE_WIDTH)
        .attr('fill-opacity', 0);

    // ENTER + UPDATE.
    const mergedElements = enterElements.merge(comparedElements);
    mergedElements.transition()
        .attr(
            'transform',
            (pos: ItemPosition) => {
              const x = 0.5 + (pos.x || 0);
              const y = 0.5 + (pos.y || 0);
              return `translate(${x},${y}) scale(${COMPARED_ITEM_FINAL_SCALE})`;
            })
        .style('opacity', 1);
    mergedElements.selectAll('rect')
        .classed('rotate', true)
        .attr('stroke-opacity', 1);

    // EXIT.
    comparedElements.exit().transition().style('opacity', 0).remove();
  }

  /**
   * Use the Layout to fit the THREE.js Camera to the scene.
   */
  fitToViewport() {
    // Setup the layout object.
    const rect = this.elem.getBoundingClientRect();

    if (!rect.width || !rect.height) {
      // TODO(jimbo): Better way to delay fitToViewport() until screen is
      // visible.
      setTimeout(() => this.fitToViewport(), 100);
      return;
    }

    this.layout.viewport.width = rect.width;
    this.layout.viewport.height = rect.height;

    this.layout.padding.bottom = this.elem.scenePadding;
    this.layout.padding.left = this.elem.scenePadding;
    this.layout.padding.right = this.elem.scenePadding;
    this.layout.padding.top = this.elem.scenePadding;

    this.layout.grid =
        {bottom: 0, left: 0, right: this.grid.width, top: this.grid.height};

    // Account for labels in grid padding.
    if (this.labels.length) {
      // Compute the maximum label size for each label on each side.
      const maxSize = {
        bottom: 0,
        left: 0,
        right: 0,
        top: 0,
      };

      this.labelsLayer.selectAll('.label').each(function(label: Label) {
        const g = d3.select(this);
        const current = g.select('.current');
        const rect = (current.node() as SVGTextElement).getBoundingClientRect();
        const em = label.elementMargin || {
          bottom: 0,
          left: 0,
          right: 0,
          top: 0,
        };
        const height = rect.height + em.top + em.bottom;
        const width = rect.width + em.left + em.right;
        switch (label.side) {
          case Side.Bottom:
            maxSize.bottom = Math.max(maxSize.bottom, height);
            break;
          case Side.Top:
            maxSize.top = Math.max(maxSize.top, height);
            break;
          case Side.Left:
            maxSize.left = Math.max(maxSize.left, width);
            break;
          case Side.Right:
            maxSize.right = Math.max(maxSize.right, width);
            break;
          default:
            throw Error('Unrecognized Side.');
        }
      });

      // Use the max size to compute desired padding.
      this.layout.padding.bottom += maxSize.bottom;
      this.layout.padding.left += maxSize.left;
      this.layout.padding.right += maxSize.right;
      this.layout.padding.top += maxSize.top;
    }

    this.layout.reducePaddingToFitWidth(rect.width, MIN_GRID_SCREEN_WIDTH_PX);
    this.layout.reducePaddingToFitHeight(
        rect.height, MIN_GRID_SCREEN_HEIGHT_PX);

    // Compute properties and set them.
    this.scale = this.layout.computeScale();

    const {position, frustum} = this.layout.computeCamera();

    // TODO(jimbo): Instead of setting these values directly, tween to them.
    this.camera.left = frustum.left;
    this.camera.right = frustum.right;
    this.camera.top = frustum.top;
    this.camera.bottom = frustum.bottom;
    this.camera.position.set(position.x, position.y, 100);
    this.camera.updateProjectionMatrix();

    // Update zoom properties.
    d3.select(this.elem).call(
        this.zoom.transform,
        d3.zoomIdentity.scale(this.scale)
            .translate(-this.camera.position.x, this.camera.position.y));

    // Transform SVG root group.
    this.transformSVG();

    // Show/hide objects based on visible space.
    this.updateObjectVisibility();

    this.queueRenderScene();
  }

  /**
   * Increase scale (zoom in) slightly.
   */
  zoomIn() {
    this.zoom.scaleBy(d3.select(this.elem), ZOOM_INCREMENT);
  }

  /**
   * Decrease scale (zoom out) slightly.
   */
  zoomOut() {
    this.zoom.scaleBy(d3.select(this.elem), 1 / ZOOM_INCREMENT);
  }

  /**
   * Whenever the camera's position or scene scale changes, we need to update
   * the SVG translation and scale to match.
   */
  transformSVG() {
    const x = -this.camera.position.x * this.scale;
    const y = this.camera.position.y * this.scale;

    // Transform SVG root groups.
    this.cellBackgroundSVGRoot.attr(
        'transform',
        `translate(${x},${y}) scale(${this.scale},${- this.scale})`);
    this.labelsAndAxesSVGRoot.attr(
        'transform',
        `translate(${x},${y}) scale(${this.scale},${- this.scale})`);

    // Reverse scale of 'unscale' elements.
    this.labelsAndAxesSVGRoot.selectAll('.unscale')
        .attr('transform', `scale(${1 / this.scale})`);

    // Update axis widths and paths.
    this.axesLayer.selectAll('.axis')
        .select('path')
        .attr('d', (axis: Axis) => axis.path(this.scale))
        .attr('stroke-width', (axis: Axis) => axis.strokeWidth(this.scale));
  }

  /**
   * Given a bounded object, like a label or axis, should it be visible given
   * the current scale and frustum?
   */
  isVisible(boundedObject: BoundedObject, elem: Element): boolean {
    return boundedObject.shouldBeVisible(
        elem, this.scale, this.camera.position, this.camera);
  }

  /**
   * For labels, axes, or other objects that have visual constraints, show
   * those which should be visible and hide the rest.
   */
  updateObjectVisibility() {
    const self = this;

    // First, identify label elements that are becoming visible or invisible.
    const labelElements = this.labelsLayer.selectAll<Element, Label>('.label');
    const labelsToShow =
        labelElements
            .filter(function(label: Label) {
              return (label.visible === undefined || !label.visible) &&
                  self.isVisible(label, this);
            })
            .each((label: Label) => label.visible = true);
    const labelsToHide =
        labelElements
            .filter(function(label: Label) {
              return (label.visible === undefined || label.visible) &&
                  !self.isVisible(label, this);
            })
            .each((label: Label) => label.visible = false);

    // Show labels that should now be visible (but weren't previously).
    labelsToShow.selectAll('.opacity')
        .transition()
        .duration(this.elem.tweenDuration)
        .attr('opacity', 1);


    labelsToHide.selectAll('.opacity')
        .transition()
        .duration(this.elem.tweenDuration)
        .attr('opacity', 0);

    // Scale labels that ought to be scaled.
    labelElements.filter((label: Label) => !!label.scaleDown)
        .selectAll('.scale')
        .attr('transform', (label: Label) => {
          const transformScaleValue =
              this.scale < label.minScale!? this.scale / label.minScale! : 1;
          return `scale(${transformScaleValue})`;
        });

    // Mark axes based on their visibility.
    const axes =
        this.axesLayer.selectAll<Element, Axis>('.axis').each(function(axis) {
          axis.visible = self.isVisible(axis, this);
        });

    // Transition axes in/out based on visibility.
    axes.filter((axis: Axis) => !!axis.visible)
        .select('path')
        .transition()
        .duration(this.elem.tweenDuration)
        .attr('stroke-opacity', 1);
    axes.filter((axis: Axis) => !axis.visible)
        .select('path')
        .transition()
        .duration(this.elem.tweenDuration)
        .attr('stroke-opacity', 0);
  }

  /**
   * Add labels to list for vertical facets.
   */
  addVerticalFacetLabels(labels: Label[]): void {
    // Short circuit if there is no vertical facet selected.
    if (!(this.elem.verticalFacet in this.stats)) {
      return;
    }

    // Add labels hanging off the right-hand side of the last column.
    const rightmostKey =
        this.grid.horizontalKeys[this.grid.horizontalKeys.length - 1];

    this.grid.getColumn(rightmostKey).forEach((cell: Cell) => {
      const labelInfo =
          this.verticalFacetInfo!.labelingFunction(cell.verticalKey);
      const label = new Label();
      label.text = labelInfo.label;
      label.x = cell.x! + cell.width!;
      label.y = cell.contentY! + cell.innerHeight! / 2;
      label.side = Side.Right;
      label.cell = cell;
      label.attributes = {
        'alignment-baseline': 'middle',
        'fill': GRID_FACETING_VERTICAL_LABEL_COLOR,
        'font-size': DEFAULT_LABEL_ATTRIBUTES['font-size'],
        'text-anchor': 'start',
        'font-style': labelInfo.special ? 'italic' : 'normal',
      };
      label.offsetPosition = {
        x: GRID_FACETING_LABEL_MARGIN.right,
      };
      label.minScale = DEFAULT_LABEL_ATTRIBUTES['font-size'] /
          (cell.height! + this.grid.cellMargin);
      label.scaleDown = true;
      labels.push(label);
    });
  }

  /**
   * Add labels to list for horizontal facets.
   */
  addHorizontalFacetLabels(labels: Label[]): void {
    // Short circuit if there is no horizontal facet selected.
    if (!(this.elem.horizontalFacet in this.stats)) {
      return;
    }

    // Add labels angled off the top row.
    const topmostKey =
        this.grid.verticalKeys[this.grid.verticalKeys.length - 1];
    this.grid.getRow(topmostKey).forEach((cell: Cell) => {
      const labelInfo =
          this.horizontalFacetInfo!.labelingFunction(cell.horizontalKey);
      const label = new Label();
      label.text = labelInfo.label;
      label.x = cell.contentX! + cell.innerWidth! / 2;
      label.y = cell.y! + cell.height!;
      label.side = Side.Top;
      label.cell = cell;
      label.rotate = -45;
      label.attributes = {
        'alignment-baseline': 'ideographic',
        'fill': GRID_FACETING_HORIZONTAL_LABEL_COLOR,
        'font-size': DEFAULT_LABEL_ATTRIBUTES['font-size'],
        'text-anchor': 'start',
        // TODO(jimbo): These calculations should be computed by angle.
        'font-style': labelInfo.special ? 'italic' : 'normal',
      };
      label.offsetPosition = {
        // TODO(jimbo): These calculations should be computed by angle.
        x: GRID_FACETING_LABEL_MARGIN.top,
        y: -GRID_FACETING_LABEL_MARGIN.top,
      };
      label.minScale = DEFAULT_LABEL_ATTRIBUTES['font-size'] /
          (cell.width! + this.grid.cellMargin / 2);
      label.scaleDown = true;
      labels.push(label);
    });
  }

  /**
   * Add labels to list for vertical positioning axes.
   */
  addVerticalPositioningLabels(labels: Label[]): void {
    // Short circuit if scatter plot positioning is not being used or if the
    // selected vertical positioning field is not present.
    if (this.elem.positionMode !== 'scatter' ||
        !(this.elem.verticalPosition in this.stats)) {
      return;
    }

    // Format the start and end of range strings.
    const fieldStats = this.stats[this.elem.verticalPosition];

    const [numberMin, numberMax] =
        d3.scaleLinear()
            .domain([fieldStats.numberMin, fieldStats.numberMax])
            .nice()
            .domain();
    const startRange = this.formatNumber(numberMin);
    const endRange = this.formatNumber(numberMax);

    // Compute an approximate midpoint to cap the start and end labels.
    const midPoint = (startRange.length + LABEL_LENGTH_PAD) /
        (startRange.length + endRange.length + 2 * LABEL_LENGTH_PAD);

    this.grid.eachCell((cell: Cell) => {
      // Skip empty cells.
      if (!cell.items.length) {
        return;
      }

      // When determining the bounding box for these labels, picking out
      // the top, bottom and right are based only on this cell, but the
      // left-hand boundary depends on the siblings to the left and above.
      //
      // If there are no siblings to the left or above, then we have as
      // much room as we want to draw the labels. Otherwise we want to
      // cap the box to the nearest sibling's content area.
      let sib = cell.siblings.left;
      while (sib && !sib.items.length &&
             (!sib.siblings.above || !sib.siblings.above.items.length)) {
        sib = sib.siblings.left;
      }
      const left = sib ? sib.contentX! + sib.innerWidth! : -Infinity;

      const right = cell.x! + ITEM_POSITIONING_CELL_PADDING.left;
      const bottom = cell.contentY!;
      const top = cell.contentY! + cell.innerHeight!;

      // Bottom of range, extends to middle of cell.
      const leftStartLabel = new Label();
      leftStartLabel.id = `${cell.compoundKey}-left-start`;
      leftStartLabel.text = startRange;
      leftStartLabel.x = cell.x! + ITEM_POSITIONING_CELL_PADDING.left;
      leftStartLabel.y = cell.y! +
          (this.elem.horizontalPosition ? ITEM_POSITIONING_CELL_PADDING.bottom :
                                          0);
      leftStartLabel.side = Side.Left;
      leftStartLabel.cell = cell;
      leftStartLabel.rotate = -90;
      leftStartLabel.attributes = {
        'alignment-baseline': 'ideographic',
        'fill': ITEM_POSITIONING_VERTICAL_LABEL_COLOR,
        'font-size': ITEM_POSITIONING_LABEL_FONT_SIZE_PX,
        'text-anchor': 'start',
      };
      leftStartLabel.offsetPosition = {
        x: ITEM_POSITIONING_LABEL_MARGIN.bottom,
        y: -ITEM_POSITIONING_LABEL_MARGIN.right,
      };
      leftStartLabel.boundingBox = {
        bottom,
        left,
        right,
        top: bottom + cell.innerHeight! * (Math.max(midPoint, 0.1) - 0.05),
      };
      leftStartLabel.elementMargin = ITEM_POSITIONING_LABEL_MARGIN;
      labels.push(leftStartLabel);

      // Top of range, extends beyond the middle of the cell.
      const leftEndLabel = new Label();
      leftEndLabel.id = `${cell.compoundKey}-left-end`;
      leftEndLabel.text = endRange;
      leftEndLabel.x = cell.x! + ITEM_POSITIONING_CELL_PADDING.left;
      leftEndLabel.y = cell.y! + cell.height!;
      leftEndLabel.side = Side.Left;
      leftEndLabel.cell = cell;
      leftEndLabel.rotate = -90;
      leftEndLabel.attributes = {
        'alignment-baseline': 'ideographic',
        'fill': ITEM_POSITIONING_VERTICAL_LABEL_COLOR,
        'font-size': ITEM_POSITIONING_LABEL_FONT_SIZE_PX,
        'text-anchor': 'end',
      };
      leftEndLabel.offsetPosition = {
        x: -ITEM_POSITIONING_LABEL_MARGIN.top,
        y: -ITEM_POSITIONING_LABEL_MARGIN.right,
      };
      leftEndLabel.boundingBox = {
        bottom: bottom + cell.innerHeight! * (Math.min(midPoint, 0.9) + 0.05),
        left,
        right,
        top,
      };
      leftEndLabel.elementMargin = ITEM_POSITIONING_LABEL_MARGIN;
      labels.push(leftEndLabel);
    });
  }

  /**
   * Add labels to list for horizontal positioning axes.
   */
  addHorizontalPositioningLabels(labels: Label[]): void {
    // Short circuit if scatter plot positioning is not being used, or if the
    // selected horizontal positioning field is not present.
    if (this.elem.positionMode !== 'scatter' ||
        !(this.elem.horizontalPosition in this.stats)) {
      return;
    }

    // Format the start and end of range strings.
    const fieldStats = this.stats[this.elem.horizontalPosition];
    const [numberMin, numberMax] =
        d3.scaleLinear()
            .domain([fieldStats.numberMin, fieldStats.numberMax])
            .nice()
            .domain();
    const startRange = this.formatNumber(numberMin);
    const endRange = this.formatNumber(numberMax);

    // Compute an approximate midpoint to cap the start and end labels.
    const midPoint = (startRange.length + LABEL_LENGTH_PAD) /
        (startRange.length + endRange.length + 2 * LABEL_LENGTH_PAD);

    this.grid.eachCell((cell: Cell) => {
      // Skip empty cells.
      if (!cell.items.length) {
        return;
      }

      // When determining the bounding box for these labels, picking out
      // the top, left and right are based only on this cell, but the
      // bottom boundary depends on the siblings below and to the right.
      //
      // If there are no siblings below or to the right, then we have as
      // much room as we want to draw the labels. Otherwise we want to
      // cap the box to the nearest sibling's content area.
      let sib = cell.siblings.below;
      while (sib && !sib.items.length &&
             (!sib.siblings.right || !sib.siblings.right.items.length)) {
        sib = sib.siblings.below;
      }
      const bottom = sib ? sib.contentY! + sib.innerHeight! : -Infinity;

      const top = cell.contentY!;
      const left = cell.contentX!;
      const right = left + cell.innerWidth!;

      // Left side of range, extends up to the middle of the cell.
      const bottomStartLabel = new Label();
      bottomStartLabel.id = `${cell.compoundKey}-bottom-start`;
      bottomStartLabel.text = startRange;
      bottomStartLabel.x = cell.x! +
          (this.elem.verticalPosition ? ITEM_POSITIONING_CELL_PADDING.left : 0);
      bottomStartLabel.y = cell.y! + ITEM_POSITIONING_CELL_PADDING.bottom;
      bottomStartLabel.side = Side.Bottom;
      bottomStartLabel.cell = cell;
      bottomStartLabel.attributes = {
        'alignment-baseline': 'hanging',
        'fill': ITEM_POSITIONING_HORIZONTAL_LABEL_COLOR,
        'font-size': ITEM_POSITIONING_LABEL_FONT_SIZE_PX,
        'text-anchor': 'start',
      };
      bottomStartLabel.offsetPosition = {
        x: ITEM_POSITIONING_LABEL_MARGIN.left,
        y: ITEM_POSITIONING_LABEL_MARGIN.top,
      };
      bottomStartLabel.boundingBox = {
        bottom,
        left,
        right: left + cell.innerWidth! * (Math.max(midPoint, 0.1) - 0.05),
        top,
      };
      bottomStartLabel.elementMargin = ITEM_POSITIONING_LABEL_MARGIN;
      labels.push(bottomStartLabel);

      // Right side of range, extends from the middle to the right of cell.
      const bottomEndLabel = new Label();
      bottomEndLabel.id = `${cell.compoundKey}-bottom-end`;
      bottomEndLabel.text = endRange;
      bottomEndLabel.x = cell.x! + cell.width!;
      bottomEndLabel.y = cell.y! + ITEM_POSITIONING_CELL_PADDING.bottom;
      bottomEndLabel.side = Side.Bottom;
      bottomEndLabel.cell = cell;
      bottomEndLabel.attributes = {
        'alignment-baseline': 'hanging',
        'fill': ITEM_POSITIONING_HORIZONTAL_LABEL_COLOR,
        'font-size': ITEM_POSITIONING_LABEL_FONT_SIZE_PX,
        'text-anchor': 'end',
      };
      bottomEndLabel.offsetPosition = {
        x: -ITEM_POSITIONING_LABEL_MARGIN.right,
        y: ITEM_POSITIONING_LABEL_MARGIN.top,
      };
      bottomEndLabel.boundingBox = {
        bottom,
        left: left + cell.innerWidth! * (Math.min(midPoint, 0.9) + 0.05),
        right,
        top,
      };
      bottomEndLabel.elementMargin = ITEM_POSITIONING_LABEL_MARGIN;
      labels.push(bottomEndLabel);
    });
  }

  /**
   * Given the current visualization state, determine the set of labels that
   * ought to be visible.
   */
  determineLabels(): Label[] {
    const labels: Label[] = [];
    this.addVerticalFacetLabels(labels);
    this.addHorizontalFacetLabels(labels);
    this.addVerticalPositioningLabels(labels);
    this.addHorizontalPositioningLabels(labels);
    return labels;
  }

  /**
   * Update visual appearance background cell rectangles. This code relies
   * heavily on the D3 join/update/enter/exit pattern.
   */
  updateCellBackgrounds() {
    const cells =
        this.grid.getCells().filter((cell: Cell) => cell.items.length);

    // JOIN.
    const cellElements =
        this.cellBackgroundLayer.selectAll<SVGRectElement, Cell>('.cell').data(
            cells, (cell: Cell) => cell.compoundKey);

    cellElements
        // ENTER.
        .enter()
        .append('rect')
        .attr('class', 'cell')
        .attr('x', (cell: Cell) => cell.contentX || 0)
        .attr('y', (cell: Cell) => cell.contentY || 0)
        .attr('width', (cell: Cell) => cell.innerWidth || 0)
        .attr('height', (cell: Cell) => cell.innerHeight || 0)
        .attr('fill', CELL_BACKGROUND_FILL_COLOR)
        .attr('fill-opacity', 0)
        // ENTER + UPDATE.
        .merge(cellElements)
        .transition()
        .duration(this.elem.tweenDuration)
        .attr('x', (cell: Cell) => cell.contentX || 0)
        .attr('y', (cell: Cell) => cell.contentY || 0)
        .attr('width', (cell: Cell) => cell.innerWidth || 0)
        .attr('height', (cell: Cell) => cell.innerHeight || 0)
        .attr('fill-opacity', 1);

    // EXIT.
    cellElements.exit()
        .transition()
        .duration(this.elem.tweenDuration)
        .remove()
        .attr('fill-opacity', 0);
  }

  /**
   * Update axes for item positioning. This code relies heavily on the D3
   * join/update/enter/exit pattern.
   */
  updateAxes() {
    const axes: Axis[] = [];

    // Compute which axes to represent visually.
    if (this.elem.positionMode !== 'stacked') {
      this.grid.eachCell((cell: Cell) => {
        if (!cell.items.length) {
          return;
        }
        if (this.elem.verticalPosition) {
          const axis = new Axis(Side.Left, cell);
          axes.push(axis);
        }
        if (this.elem.horizontalPosition) {
          const axis = new Axis(Side.Bottom, cell);
          axes.push(axis);
        }
      });
    }

    // JOIN.
    const axisElements =
        this.axesLayer.selectAll<SVGGElement, Axis>('.axis').data(
            axes, (axis: Axis) => axis.key());

    // ENTER.
    const axisElementsEnter = axisElements.enter()
                                  .append('g')
                                  .attr('class', 'axis')
                                  .attr('opacity', 0);
    axisElementsEnter.append('path')
        .attr('d', (axis: Axis) => axis.path(this.scale))
        .attr(
            'stroke',
            (axis: Axis) => axis.side === Side.Left ?
                ITEM_POSITIONING_VERTICAL_LABEL_COLOR :
                ITEM_POSITIONING_HORIZONTAL_LABEL_COLOR)
        .attr('stroke-width', (axis: Axis) => axis.strokeWidth(this.scale))
        .attr('stroke-opacity', 0)
        .attr('fill', 'none');

    // ENTER + UPDATE.
    axisElementsEnter.merge(axisElements)
        .transition()
        .duration(this.elem.tweenDuration)
        .attr('opacity', 1);
    axisElementsEnter.merge(axisElements)
        .select('path')
        .transition()
        .duration(this.elem.tweenDuration)
        .attr('d', (axis: Axis) => axis.path(this.scale));

    // EXIT.
    axisElements.exit()
        .transition()
        .duration(this.elem.tweenDuration)
        .remove()
        .attr('opacity', 0);
  }

  /**
   * Update visual appearance of labels. This code relies heavily on the D3
   * join/update/enter/exit pattern.
   */
  updateLabels() {
    // Short-circuit of there is no scale information available since the labels
    // cannot be rendered without knowing the screen to vis scale (ratio).
    if (!this.scale) {
      return;
    }

    // First, determine what the labels are going to be.
    this.labels = this.determineLabels();

    // JOIN.
    const labelElements = this.labelsLayer.selectAll('.label').data(
        this.labels,
        (label: Label) => label.id || `${label.side}-${label.text}`);

    // UPDATE.
    // For existing labels that need new text, swap previous text into the .old
    // text element so we can transition smoothly between.
    labelElements
        .each(function(label: Label) {
          const g = d3.select(this);
          const current = g.select('.current');
          if (label.text !== current.text()) {
            current.attr('fill-opacity', 0);
            g.select('.old').attr('fill-opacity', 1).text(current.text());
          }
        })
        .select('.current')
        .text((label: Label) => label.text);

    // Given the name of an attribute, this helper generates a function which
    // will return that attribute for a given label, or the default value.
    const labelAttrOrDefault = (attributeName: string) => {
      return (label: Label) => {
        if (label.attributes === undefined ||
            label.attributes[attributeName] === undefined) {
          return DEFAULT_LABEL_ATTRIBUTES[attributeName];
        }
        return label.attributes[attributeName];
      };
    };

    // ENTER.
    // These labels consist of many nested groups so we can animate portions of
    // them independently. If there were only one group, then any transition
    // applied would override other transitions. However, we pay a performance
    // pentalty for this flexibility-the CPU has to apply the nested transforms.
    const labelElementsEnter =
        labelElements.enter()
            .append('g')
            .attr('class', 'label')
            .attr(
                'transform',
                (label: Label) => `translate(${label.x},${label.y})`);
    const entering =
        labelElementsEnter.append('g')
            .attr('class', 'flip')
            .attr('transform', 'scale(1,-1)')
            .append('g')
            .attr('class', 'rotate')
            .attr(
                'transform',
                (label: Label) => 'rotate(' +
                    ('rotate' in label ? label.rotate : DEFAULT_LABEL_ROTATE) +
                    ')')
            .append('g')
            .attr('class', 'unscale')
            .attr('transform', `scale(${1 / this.scale})`)
            .append('g')
            .attr('class', 'position')
            .append('g')
            .attr('class', 'opacity scale');
    const enteringOld =
        entering.append('text').attr('class', 'old').attr('fill-opacity', 0);
    const enteringCurrent = entering.append('text')
                                .attr('class', 'current')
                                .attr('fill-opacity', 0)
                                .text((label: Label) => label.text);
    for (const attributeName in DEFAULT_LABEL_ATTRIBUTES) {
      if (DEFAULT_LABEL_ATTRIBUTES.hasOwnProperty(attributeName)) {
        enteringOld.attr(attributeName, labelAttrOrDefault(attributeName));
        enteringCurrent.attr(attributeName, labelAttrOrDefault(attributeName));
      }
    }

    // ENTER + UPDATE.
    const updating =
        labelElementsEnter.merge(labelElements)
            .transition()
            .duration(this.elem.tweenDuration)
            .attr(
                'transform',
                (label: Label) => `translate(${label.x},${label.y})`);
    updating.select('.rotate').attr(
        'transform',
        (label: Label) => 'rotate(' +
            ('rotate' in label ? label.rotate : DEFAULT_LABEL_ROTATE) + ')');
    updating.filter((label: Label) => !!label.offsetPosition)
        .select('.position')
        .attr('transform', (label: Label) => {
          const x = label.offsetPosition!.x || 0;
          const y = label.offsetPosition!.y || 0;
          return `translate(${x},${y})`;
        });
    const updatingOld = updating.select('.old').attr('fill-opacity', 0);
    const updatingCurrent = updating.select('.current').attr('fill-opacity', 1);
    for (const attributeName in DEFAULT_LABEL_ATTRIBUTES) {
      if (DEFAULT_LABEL_ATTRIBUTES.hasOwnProperty(attributeName)) {
        updatingOld.attr(attributeName, labelAttrOrDefault(attributeName));
        updatingCurrent.attr(attributeName, labelAttrOrDefault(attributeName));
      }
    }

    // EXIT.
    labelElements.exit()
        .transition()
        .duration(this.elem.tweenDuration)
        .remove()
        .select('.current')
        .attr('fill-opacity', 0);
  }

  /**
   * Handle changes to data array.
   */
  dataChange() {
    const data = this.elem.data;

    if (!data || !data.length) {
      return;
    }

    // Make sure the element's size computations reflect the element boundaries.
    this.resizeHandler();

    // Produce stats for data.
    this.stats = getStats(data);

    if (!this.items) {
      // Since this is the very first time that data is available, select nice
      // looking fields to color by and render text labels.
      this.initializeSpriteMesh();
      this.pickColorByField();
      this.pickTextDrawingField();
    } else if (this.items.length !== data.length) {
      // This is an update in which the number of data points has changed, so
      // reinitialize the spriteMesh and redraw the image content if any.
      this.initializeSpriteMesh();
      this.updateImageFieldName();
    } else {
      // Number of data items is unchanged, just update each item's data.
      for (let i = 0; i < data.length; i++) {
        this.items[i].data = data[i];
      }
    }

    this.updateGridFaceting();
    this.updateGridItemPositions();
    this.updateColors();
  }

  /**
   * Set up the spriteMesh to accomodate data. This will destroy the existing
   * spriteMesh if present.
   */
  initializeSpriteMesh() {
    if (this.spriteMesh) {
      this.scene.remove(this.spriteMesh as any);
      this.spriteMesh.spriteAtlas.clearQueues();  // Abort outstanding draws.
      delete this.spriteMesh;
    }

    const data = this.elem.data;
    const itemCount = data.length;
    const spriteImageWidth = this.elem.spriteImageWidth;
    const spriteImageHeight = this.elem.spriteImageHeight;
    const spriteAspectRatio = spriteImageWidth / spriteImageHeight;

    this.spriteMesh =
        new SpriteMesh(itemCount, spriteImageWidth, spriteImageHeight);
    this.scene.add(this.spriteMesh as any);
    this.spriteMesh.spriteAtlas.onDrawFinished = () => this.queueRenderScene();

    // Create items which pair sprites and data, and initialize sprites.
    this.items = [];
    const width = Math.ceil(Math.sqrt(itemCount));
    const height = Math.ceil(itemCount / width);
    for (let i = 0; i < itemCount; i++) {
      const sprite = this.spriteMesh.createSprite();
      sprite.x = width / 2;
      sprite.y = height / 2;
      sprite.opacity = 0;
      sprite.timestamp = Date.now();
      sprite.rebase(sprite.timestamp);
      this.items.push({sprite, data: data[i]});
    }

    // Create a Grid, and use it to arrange the item sprites.
    this.grid = new gridlib.Grid(this.items);
    this.grid.cellMargin = GRID_CELL_MARGIN;
    this.grid.itemAspectRatio = spriteAspectRatio;
    this.grid.itemPositionSetter = (item: GridItem, x: number, y: number) => {
      const now = Date.now();
      item.sprite.rebase(now);
      item.sprite.x = x;
      item.sprite.y = y;
      item.sprite.opacity = 1;
      item.sprite.timestamp = now + this.elem.tweenDuration;
      this.renderUntil(item.sprite.timestamp);
    };
  }

  /**
   * Handle changes to the filtered data indices.
   */
  filteredDataIndicesChange() {
    const filteredIndices = this.elem.filteredDataIndices;

    const itemVisibility: boolean[] = [];
    if (filteredIndices) {
      for (let i = 0; i < filteredIndices.length; i++) {
        const index = filteredIndices[i];
        if (index < this.items.length) {
          itemVisibility[index] = true;
        }
      }
    }

    // Subset of data that is filtered to be visible.
    const filteredData: DataExample[] = [];

    // Subset of items filtered to be visible for grid.
    const filteredItems: GridItem[] = [];

    const now = Date.now();
    const future = now + this.elem.tweenDuration;
    for (let i = 0; i < this.items.length; i++) {
      const item = this.items[i];
      const visible = !filteredIndices || !!itemVisibility[i];
      if (visible) {
        filteredData.push(item.data);
        filteredItems.push(item);
        if (!item.sprite.opacity) {
          item.sprite.rebase(now);
          item.sprite.timestamp = future;
          item.sprite.opacity = 1;
        }
      } else if (item.sprite.opacity > 0) {
        item.sprite.rebase(now);
        item.sprite.timestamp = future;
        item.sprite.opacity = 0;
      }
    }
    this.renderUntil(future);

    // TODO(jimbo): Computing stats is quite expensive, do less or incremental.
    this.stats = getStats(filteredData);
    this.grid.items = filteredItems;

    this.updateGridFaceting();
    this.updateGridItemPositions();
  }


  /**
   * Analyze the fields of the data and pick a good one to use as the default
   * colorBy field.
   */
  pickColorByField() {
    let bestFieldName: string = null!;
    let bestFieldScore: number = Infinity;

    for (const fieldName in this.stats) {
      if (this.stats.hasOwnProperty(fieldName)) {
        const fieldStats = this.stats[fieldName];
        // Simple heuristic: find the field with unique values nearest palette.
        const score =
            Math.abs(fieldStats.uniqueCount - PALETTE_STANDARD.length);
        if (fieldStats.uniqueCount > 1 && score < bestFieldScore) {
          bestFieldName = fieldName;
          bestFieldScore = score;
        }
      }
    }

    if (isFinite(bestFieldScore) && bestFieldName in this.stats) {
      this.autoColorBy = true;
      this.elem.set('colorBy', bestFieldName);
    }
  }

  /**
   * Analyze the fields of the data and pick a good one to use to render as text
   * on the sprites.
   */
  pickTextDrawingField() {
    let bestFieldName = '';
    let bestFieldScore = -Infinity;

    for (const fieldName in this.stats) {
      if (this.stats.hasOwnProperty(fieldName)) {
        const fieldStats = this.stats[fieldName];
        // Heuristic: find the field with the most unique strings, including the
        // diversity of string lengths in the score.
        const score = fieldStats.stringCount + fieldStats.stringLengthsCount! -
            fieldStats.totalCount;
        if (score > bestFieldScore) {
          bestFieldName = fieldName;
          bestFieldScore = score;
        }
      }
    }

    if (isFinite(bestFieldScore) && bestFieldName in this.stats) {
      this.elem.set('imageFieldName', bestFieldName);
    }
  }

  /**
   * Queue a change to the atlas URL for debouncing.
   */
  queueAtlasUrlChange() {
    if (this.atlasUrlChangeTimer) {
      clearTimeout(this.atlasUrlChangeTimer);
    }
    this.atlasUrlChangeTimer = setTimeout(() => {
      if (this.atlasUrlChangeTimer) {
        this.atlasUrlChange();
      }
    }, UPDATE_DEBOUNCE_DELAY_MS);
  }

  /**
   * Handle changes to sprite texture atlas image URL.
   */
  atlasUrlChange() {
    clearTimeout(this.atlasUrlChangeTimer);
    delete this.atlasUrlChangeTimer;

    // TODO(jimbo): Less hacky way of dealing with out-of-order calls.
    if (!this.spriteMesh) {
      requestAnimationFrame(this.atlasUrlChange.bind(this));
      return;
    }

    const atlasUrl = this.elem.atlasUrl;
    if (!atlasUrl || !atlasUrl.length || atlasUrl === this.lastAtlasUrl) {
      // Nothing to do.
      return;
    }
    this.lastAtlasUrl = atlasUrl;

    this.resetSpritesToDefaultTexture();

    this.spriteMesh.spriteAtlas.setAtlasUrl(
        atlasUrl, this.elem.crossOrigin, () => {
          const data = this.elem.data;
          const now = Date.now();
          const future = now + this.elem.fadeDuration;
          for (let i = 0; data && i < data.length; i++) {
            this.spriteMesh.switchTextures(i, now, future);
          }
          this.renderUntil(future);

          this.ignoreChange = true;
          this.elem.set('imageFieldName', '');
          delete this.ignoreChange;

          if (this.autoColorBy) {
            this.autoColorBy = false;
            this.elem.set('colorBy', '');
          }
        });
  }

  /**
   * Handle changes to the sprite image URL.
   */
  spriteUrlChange() {
    const spriteUrl = this.elem.spriteUrl;
    if (!spriteUrl) {
      return;
    }
    // TODO(jimbo): Less hacky way of dealing with out-of-order calls.
    if (this.spriteMesh) {
      // TODO(jimbo): Should this code live in the SpriteMesh?
      const image = new Image();
      if (this.elem.crossOrigin !== undefined) {
        image.crossOrigin = this.elem.crossOrigin;
      }
      image.onload = () => {
        const canvas = this.spriteMesh.defaultTextureCanvas;
        const context = canvas.getContext('2d')!;
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        this.spriteMesh.defaultTexture.needsUpdate = true;
        this.queueRenderScene();
      };
      image.src = spriteUrl;
    } else {
      requestAnimationFrame(this.spriteUrlChange.bind(this));
    }
  }

  /**
   * Set the grid's item position to stack based on current settings.
   */
  updateGridStacking() {
    if (this.elem.positionMode === 'stacked') {
      this.grid.computeItemPosition = gridlib.stackItems(
          this.elem.verticalFacet ? 'middle' : 'bottom',
          this.elem.horizontalFacet ? 'middle' : 'right');
    }
  }

  /**
   * Update grid faceting.
   */
  updateGridFaceting() {
    if (!this.grid) {
      return;
    }

    this.updateGridStacking();

    const verticalFacet = this.elem.verticalFacet;
    const verticalFacetInfo = this.verticalFacetInfo =
        this.generateFacetingInfo(
            verticalFacet, this.elem.verticalBuckets,
            this.elem.verticalBagOfWords, true);
    this.grid.verticalFacet = verticalFacetInfo.facetingFunction;
    this.grid.verticalKeyCompare = verticalFacetInfo.keyCompareFunction;

    const horizontalFacet = this.elem.horizontalFacet;
    const horizontalFacetInfo = this.horizontalFacetInfo =
        this.generateFacetingInfo(
            horizontalFacet, this.elem.horizontalBuckets,
            this.elem.horizontalBagOfWords, false);
    this.grid.horizontalFacet = horizontalFacetInfo.facetingFunction;
    this.grid.horizontalKeyCompare = horizontalFacetInfo.keyCompareFunction;

    if (this.elem.fitGridAspectRatioToViewport) {
      const rect = this.elem.getBoundingClientRect();
      this.grid.targetGridAspectRatio =
          rect && rect.width && rect.height ? rect.width / rect.height || 1 : 1;
    } else {
      this.grid.targetGridAspectRatio = 1;
    }

    this.grid.arrange();

    this.updateCellBackgrounds();

    this.updateAxes();

    this.updateLabels();

    this.updateSelectedBoxes();
    this.updateComparedBoxes();

    this.fitToViewport();
  }

  /**
   * Generate a computeItemPosition method for the grid based on the current
   * positionMode, verticalPosition and horizontalPosition. Then position grid
   * items and fit to screen.
   */
  updateGridItemPositions() {
    if (!this.grid) {
      return;
    }

    this.updateGridStacking();

    const padding = this.grid.cellPadding;
    const Tight = gridlib.GridAlignment.Tight;
    const Uniform = gridlib.GridAlignment.Uniform;

    // Keep track of whether we need a full arrange(), or just positionItems().
    let needsArrange = false;

    if (this.elem.positionMode === 'stacked') {
      needsArrange = (this.grid.verticalGridAlignment !== Tight) ||
          (this.grid.horizontalGridAlignment !== Tight);
      this.grid.verticalGridAlignment = Tight;
      this.grid.horizontalGridAlignment = Tight;

      this.grid.cellPadding.top = 0;
      this.grid.cellPadding.left = 0;
      this.grid.cellPadding.right = 0;
      this.grid.cellPadding.bottom = 0;

      this.grid.minCellAspectRatio = 0;
      this.grid.maxCellAspectRatio = Infinity;
    } else {
      // Vertical grid alignment will be Uniform if we're using any kind of
      // vertical positioning. This allows an apples-to-apples comparison
      // between cells. Changing between Uniform and Tight requires a call
      // to grid.arrange() because the cell sizes may change.
      if (this.elem.verticalPosition) {
        needsArrange = this.grid.verticalGridAlignment !== Uniform;
        this.grid.verticalGridAlignment = Uniform;
      } else {
        needsArrange = this.grid.verticalGridAlignment !== Tight;
        this.grid.verticalGridAlignment = Tight;
      }

      // Same for horizontal grid alignment.
      if (this.elem.horizontalPosition) {
        needsArrange =
            needsArrange || this.grid.horizontalGridAlignment !== Uniform;
        this.grid.horizontalGridAlignment = Uniform;
      } else {
        needsArrange =
            needsArrange || this.grid.horizontalGridAlignment !== Tight;
        this.grid.horizontalGridAlignment = Tight;
      }

      const x = this.generatePositionFunction(this.elem.horizontalPosition) ||
          gridlib.X_SCATTER_POSITION_FROM_INDEX;

      const y = this.generatePositionFunction(this.elem.verticalPosition) ||
          gridlib.Y_SCATTER_POSITION_FROM_INDEX;

      this.grid.computeItemPosition =
          (item: GridItem, index: number, cell: Cell, grid: Grid) => {
            return {
              x: x(item, index, cell, grid),
              y: y(item, index, cell, grid)
            };
          };

      const top = ITEM_POSITIONING_CELL_PADDING.top;
      const right = ITEM_POSITIONING_CELL_PADDING.right;

      // Leave space for axes only if we're positioning in that dimension.
      const left =
          this.elem.verticalPosition ? ITEM_POSITIONING_CELL_PADDING.left : 0;
      const bottom = this.elem.horizontalPosition ?
          ITEM_POSITIONING_CELL_PADDING.bottom :
          0;

      needsArrange = needsArrange || top !== padding.top ||
          left !== padding.left || right !== padding.right ||
          bottom !== padding.bottom;

      this.grid.cellPadding.top = top;
      this.grid.cellPadding.right = right;
      this.grid.cellPadding.left = left;
      this.grid.cellPadding.bottom = bottom;

      this.grid.minCellAspectRatio = ITEM_POSITIONING_MIN_CELL_ASPECT_RATIO;
      this.grid.maxCellAspectRatio = ITEM_POSITIONING_MAX_CELL_ASPECT_RATIO;
    }

    // Perform full grid arrange() if needed, otherwise just reposition the
    // items within their cells.
    // TODO(jimbo): Keeping track of the dirty state should be the Grid's job.
    if (needsArrange) {
      this.grid.arrange();
      this.updateCellBackgrounds();
    } else {
      this.grid.positionItems();
    }

    this.updateAxes();
    this.updateLabels();
    this.updateSelectedBoxes();
    this.updateComparedBoxes();

    this.fitToViewport();
  }

  /**
   * Get the Palette source to use based on the current palette choice.
   */
  getPaletteSource(): string[] {
    switch (this.elem.paletteChoice) {
      case 'warm':
        return PALETTE_WARM;
      case 'cool':
        return PALETTE_COOL;
      case 'assist':
        return PALETTE_ASSIST;
      default:
        return PALETTE_STANDARD;
    }
  }

  /**
   * Set up a scalar palette based on the numeric values of the chosen field.
   * The return value is an array of d3 RGB objects that can be used to color
   * the sprites.
   */
  updateScalarPalette(): d3.RGBColor[] {
    const colorBy = this.elem.colorBy;
    const fieldStats = this.stats[colorBy];
    const items = this.grid.items as GridItem[];

    const nanColor = d3.rgb(PALETTE_NUMERIC.missing);
    const scale = d3.scaleLinear<string>();
    scale.domain([fieldStats.numberMin!, fieldStats.numberMax!])
        .range([PALETTE_NUMERIC.start, PALETTE_NUMERIC.end])
        .nice();

    // Determine colors for items to be returned.
    const colors: d3.RGBColor[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const val: Key = colorBy in item.data ? item.data[colorBy] : NaN;
      const color =
          typeof val !== 'number' || isNaN(val) ? nanColor : d3.rgb(scale(val));
      colors.push(color);
    }

    // Set up scalar palette.
    const labelingFunction =
        this.generateFacetingInfo(colorBy, 5, false, false).labelingFunction;
    const labelScale = d3.scaleLinear<string>();
    labelScale.domain([0, 4]).range(
        [PALETTE_NUMERIC.start, PALETTE_NUMERIC.end]);
    const palette: Palette = [];
    for (let i = 4; i >= 0; i--) {
      const labelingInfo = labelingFunction(i);
      palette.push({
        key: i,
        color: labelScale(i),
        content: labelingInfo,
      });
    }

    if (fieldStats.otherCount || fieldStats.stringCount ||
        fieldStats.totalCount < this.grid.items.length) {
      palette.push({
        key: NaN,
        color: PALETTE_NUMERIC.missing,
        content: {
          label: 'missing',
          special: true,
        },
      });
    }
    this.elem.set('palette', palette);

    // Sort by color.
    this.grid.cellItemComparator = (a: GridItem, b: GridItem) => {
      // First, deal with missing fields.
      if (!(colorBy in a.data) && !(colorBy in b.data)) {
        return 0;
      }
      if (!(colorBy in a.data)) {
        return -1;
      }
      if (!(colorBy in b.data)) {
        return 1;
      }

      const valueA = a.data[colorBy];
      const valueB = b.data[colorBy];
      if (valueA === valueB) {
        return 0;
      }

      // Deal with non-numbers.
      const nanA = typeof valueA !== 'number' || isNaN(valueA);
      const nanB = typeof valueB !== 'number' || isNaN(valueB);
      if (nanA && nanB) {
        return 0;
      }
      if (nanA) {
        return -1;
      }
      if (nanB) {
        return 1;
      }

      // Finally, compare actual numeric values.
      return (valueA as number) - (valueB as number);
    };

    // Return the colors to apply.
    return colors;
  }

  /**
   * Update the palette in use based on current visualization settings and a
   * source of colors to use (array of CSS color strings). The return value is
   * an array of colors to apply to each sprite.
   */
  updateCategoricalPalette(paletteSource: string[]): d3.RGBColor[] {
    const colorBy = this.elem.colorBy;
    const fieldStats = this.stats[colorBy];
    const items = this.grid.items as GridItem[];

    // Sort the unique values of this field, higest count first.
    const hashKeys = Object.keys(fieldStats.valueHash);
    if (this.elem.stableColors) {
      hashKeys.sort();
    } else {
      hashKeys.sort(
          (a: string, b: string): number =>
              fieldStats.valueHash[b].count - fieldStats.valueHash[a].count);
    }

    const buckets = Math.min(paletteSource.length, hashKeys.length);

    // Select the most populous few unique values to be labeled by their value.
    // Everything else will be grouped into 'other'.
    const hashKeyToIndexMap =
        hashKeys.slice(0, buckets).reduce((map, hashKey, index) => {
          map[hashKey] = index;
          return map;
        }, {} as {[hashKey: string]: number});

    // Color all items by their ordinal within the palette.
    const otherColor = d3.rgb(PALETTE_OTHER_COLOR);
    const paletteColors = paletteSource.map(color => d3.rgb(color));
    let anyOthers = false;

    // Determine colors to apply to each item.
    const colors: d3.RGBColor[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const value = item.data[colorBy];
      const hashKey = wordtree.getHashKey(value);
      anyOthers = anyOthers || !(hashKey in hashKeyToIndexMap);
      const color = paletteColors[hashKeyToIndexMap[hashKey]] || otherColor;
      colors.push(color);
    }

    // Develope a Palette to show in the legend for these colors.
    const palette: Palette =
        paletteSource.slice(0, buckets).map((color: string, index: number) => {
          const key = fieldStats.valueHash[hashKeys[index]].value;
          return {
            key,
            color,
            content: {
              label: key + '',
              special: (typeof key !== 'number' && typeof key !== 'string') ||
                  key in FACETING_PLACEHOLDERS,
            },
          };
        });
    if (anyOthers) {
      palette.push({
        key: null!,
        color: PALETTE_OTHER_COLOR,
        content: {
          label: FACETING_OTHER_LABEL,
          special: true,
        },
      });
    }
    this.elem.set('palette', palette);

    // Sort items by color.
    this.grid.cellItemComparator = (a: GridItem, b: GridItem) => {
      // First, deal with missing fields.
      if (!(colorBy in a.data) && !(colorBy in b.data)) {
        return 0;
      }
      if (!(colorBy in a.data)) {
        return 1;
      }
      if (!(colorBy in b.data)) {
        return -1;
      }

      const valueA = a.data[colorBy];
      const valueB = b.data[colorBy];
      if (valueA === valueB) {
        return 0;
      }

      const hashKeyA = wordtree.getHashKey(valueA);
      const hashKeyB = wordtree.getHashKey(valueB);

      // Deal with 'other'.
      if (!(hashKeyA in hashKeyToIndexMap) &&
          !(hashKeyB in hashKeyToIndexMap)) {
        return 0;
      }
      if (!(hashKeyA in hashKeyToIndexMap)) {
        return 1;
      }
      if (!(hashKeyB in hashKeyToIndexMap)) {
        return -1;
      }

      const indexA = hashKeyToIndexMap[hashKeyA];
      const indexB = hashKeyToIndexMap[hashKeyB];
      return indexA - indexB;
    };

    // Return the colors to apply.
    return colors;
  }

  /**
   * Update the colors of sprites based on the selected field.
   */
  updateColors() {
    if (!this.grid) {
      return;
    }

    const colorBy = this.elem.colorBy;
    if (!(colorBy in this.stats)) {
      this.clearColors();
      return;
    }

    const fieldStats = this.stats[colorBy];

    // Select palette source based on palette choice.
    const paletteSource = this.getPaletteSource();

    // Set up a scalar palette if the field is numeric and there are too many
    // unique values to ascribe each its own color, otherwise use the
    // categorical coloring scheme. In both cases, grab the array of colors to
    // apply to the sprites.
    const colors = (fieldStats.uniqueCount > paletteSource.length &&
                    fieldStats.isNumeric()) ?
        this.updateScalarPalette() :
        this.updateCategoricalPalette(paletteSource);

    // Update all item sprite colors.
    const items = this.grid.items as GridItem[];
    const now = Date.now();
    const then = now + this.elem.tweenDuration;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const color = colors[i];
      item.sprite.rebase(now);
      item.sprite.r = color.r;
      item.sprite.g = color.g;
      item.sprite.b = color.b;
      item.sprite.a = COLOR_BY_MIX;
      item.sprite.timestamp = then;
    }
    this.renderUntil(then);

    this.updateGridItemPositionsAfterColorChange();
  }

  /**
   * When users choose a field to color by, the positions of the sprites may
   * need to be updated since we sort by color. This occurs when sprite position
   * is not completely determined within the cell by horizontal and vertical
   * positioning fields.
   */
  updateGridItemPositionsAfterColorChange() {
    if (this.elem.positionMode === 'stacked' || !this.elem.verticalPosition ||
        !this.elem.horizontalPosition) {
      this.updateGridItemPositions();
    }
  }

  /**
   * Clear out all items' color data.
   */
  clearColors() {
    const items = this.grid.items as GridItem[];
    const now = Date.now();
    const then = now + this.elem.tweenDuration;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      item.sprite.rebase(now);
      item.sprite.r = 0;
      item.sprite.g = 0;
      item.sprite.b = 0;
      item.sprite.a = 0;
      item.sprite.timestamp = then;
    }
    this.renderUntil(then);
    this.elem.set('palette', []);

    if (this.grid.cellItemComparator) {
      this.grid.cellItemComparator = null;
      this.updateGridItemPositionsAfterColorChange();
    }
  }

  /**
   * Cancel any outstanding queued atlas draw jobs and transition sprites back
   * to the default texture.
   */
  resetSpritesToDefaultTexture() {
    const items = this.grid.items as GridItem[];

    // Cancel any outstanding queued draw jobs.
    this.spriteMesh.spriteAtlas.clearQueues();

    // First, roll through sprites and transition them back to the default.
    const now = Date.now();
    const future = now + this.elem.fadeDuration;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.sprite.textureIndex > 0) {
        item.sprite.switchTextures(now, future);
      }
    }
    this.renderUntil(future);
  }

  /**
   * When the selected field for rendering text has changed, start jobs to
   * render the text.
   */
  updateImageFieldName() {
    if (this.ignoreChange || !this.grid) {
      return;
    }

    this.resetSpritesToDefaultTexture();

    // Short-circuit and default to atlas image if a field hasn't been selected.
    const imageFieldName = this.elem.imageFieldName;
    if (!(imageFieldName in this.stats)) {
      // Forget any previously set atlas URL since it would need to be redrawn.
      delete this.lastAtlasUrl;

      // Treat default image field as an atlas URL change.
      this.queueAtlasUrlChange();

      return;
    }

    // Queue a draw job for each sprite.
    const items = this.grid.items as GridItem[];
    for (let i = 0; i < items.length; i++) {
      const {sprite, data} = items[i];

      const label = DEFAULT_LABELING_FUNCTION(data[imageFieldName]);

      const imageData: SpriteImageData = {
        type: 'text',
        data: label.label,
      };

      sprite.setSpriteImageData(imageData, () => {
        const now = Date.now();
        sprite.baseTextureTimestamp = now;
        sprite.baseTextureIndex = 0;
        sprite.textureTimestamp = now + this.elem.tweenDuration;
        sprite.textureIndex = 1;
        this.renderUntil(sprite.textureTimestamp);
      });
    }
  }

  /**
   * Given a FieldStats object, generate a position function that returns a
   * value between 0 and 1.
   */
  generatePositionFunction(fieldName: string):
      ((item: GridItem, index: number, cell: Cell, grid: Grid) => number)|null {
    const fieldStats = this.stats[fieldName];
    if (!fieldStats || !fieldStats.isNumeric()) {
      return null;
    }
    // Use D3's nice() method to round the min and max to pleasing values.
    const scale = d3.scaleLinear()
                      .domain([fieldStats.numberMin, fieldStats.numberMax])
                      .nice();

    return (item: GridItem, index: number, cell: Cell, grid: Grid) =>
               scale(item.data[fieldName] as number);
  }

  /**
   * Utility method for generating necessary info on how this field should be
   * faceted given the number of buckets and whether it should be treated
   * as a bag-of-words.
   */
  generateFacetingInfo(
      fieldName: string, buckets: number, bagOfWords: boolean,
      vertical: boolean): FacetingInfo {
    // For unknown fields (including empty string), or if the number of buckets
    // doesn't make sense, just lump everything together into a nameless bucket.
    if (!(fieldName in this.stats) || isNaN(+buckets) || +buckets < 1) {
      return {
        facetingFunction: item => '',
        keyCompareFunction: (a: Key, b: Key) => 0,
        labelingFunction: DEFAULT_LABELING_FUNCTION,
      };
    }

    const fieldStats = this.stats[fieldName];

    // Handle bag-of-words case.
    if (fieldStats.wordTree && fieldStats.wordTree.highestLevel > 1 &&
        bagOfWords) {
      return this.generateBagOfWordsFacetingInfo(fieldName, buckets, vertical);
    }

    // If the number of unique values is no greater than the requested number
    // of buckets, we can just use the value.
    if (fieldStats.uniqueCount <= buckets) {
      return {
        facetingFunction: item =>
            fieldName in item.data ? item.data[fieldName] : null,
        keyCompareFunction: fieldStats.isNumeric() ?
            sorting.numberCompare :
            vertical ? sorting.verticalStringCompare :
                       sorting.horizontalStringCompare,
        labelingFunction: DEFAULT_LABELING_FUNCTION,
      };
    }

    // Handle the numeric case.
    if (fieldStats.isNumeric() &&
        fieldStats.numberMax !== fieldStats.numberMin) {
      return this.generateNumericFacetingInfo(fieldName, buckets);
    }

    // If there are more unique values than the desired number of buckets,
    // we'll have to combine some into "other".
    // Sort the unique values of this field, higest count first.
    const hashKeys = Object.keys(fieldStats.valueHash);
    hashKeys.sort(
        (a: string, b: string): number =>
            fieldStats.valueHash[b].count - fieldStats.valueHash[a].count);

    // Select the most populous few to be named. Everything else will be
    // labeled 'other'.
    const hashKeySet = hashKeys.slice(0, buckets).reduce((map, hashKey) => {
      map[hashKey] = true;
      return map;
    }, {} as {[hashKey: string]: boolean});

    return {
      facetingFunction: item => {
        if (!(fieldName in item.data)) {
          return null;
        }
        const value = item.data[fieldName];
        const hashKey = wordtree.getHashKey(value);
        return hashKey in hashKeySet ? value : FACETING_OTHER_PLACEHOLDER;
      },
      keyCompareFunction: vertical ? sorting.verticalStringCompare :
                                     sorting.horizontalStringCompare,
      labelingFunction: DEFAULT_LABELING_FUNCTION,
    };
  }

  /**
   * Utility method for generating a bag-of-words FacetingInfo.
   */
  generateBagOfWordsFacetingInfo(
      fieldName: string, buckets: number, vertical: boolean): FacetingInfo {
    const fieldStats = this.stats[fieldName];
    const wordTree = fieldStats.wordTree!;
    const levelHash = wordTree.levelHash;
    return {
      /**
       * Bag-of-words faceting works by returning the nearest visible ancestor
       * node from the word tree whose level is less than the desired number
       * of buckets.
       */
      facetingFunction: item => {
        if (!(fieldName in item.data)) {
          return null!;
        }
        const value = item.data[fieldName];
        const hashKey = wordtree.getHashKey(value);
        let node = wordTree.nodeHash[hashKey];
        while (node.parent && node.level > buckets) {
          node = node.parent;
        }
        return node.level;
      },

      /**
       * To compare keys for a bag of words, we want to use their depth-first
       * order, except for special buckets, like the non-words bucket.
       */
      keyCompareFunction: (a: Key, b: Key) => {
        const nodeA = levelHash[a as number];
        const nodeB = levelHash[b as number];

        if (nodeA === undefined && nodeB === undefined) {
          return 0;
        }
        if (nodeA === undefined) {
          return -1;
        }
        if (nodeB === undefined) {
          return 1;
        }

        // Put special non-words key to the left/bottom of all others.
        if (nodeA.nonValueCount && nodeB.nonValueCount) {
          return 0;
        }
        if (nodeA.nonValueCount) {
          return -1;
        }
        if (nodeB.nonValueCount) {
          return 1;
        }

        const diff = nodeB.order - nodeA.order;
        return vertical ? diff : -diff;
      },

      /**
       * The label for a bag-of-words facet is built up from the ancestors'
       * common words. A trailing ellipse signals that there are unexpanded
       * child nodes. The root node and the non-word node are special.
       */
      labelingFunction: (key: Key) => {
        let node = levelHash[+key];
        if (!node.parent && !node.commonWords.length) {
          return {
            label: FACETING_ALL_WORDS_LABEL,
            special: true,
          };
        }
        if (node.nonValueCount) {
          return {
            label: FACETING_NO_WORDS_LABEL,
            special: true,
          };
        }
        let label = ` ${BAG_OF_WORDS_SEPARATOR} ${node.commonWords.join(' ')}`;
        // If there are any unexpanded children, then this facet should show
        // an ellipsis.
        for (let i = 0; i < node.children.length; i++) {
          if (node.children[i].level > buckets) {
            label += ` ${BAG_OF_WORDS_SUFFIX}`;
            break;
          }
        }
        while (node.parent) {
          node = node.parent;
          if (node.commonWords.length) {
            label =
                ` ${BAG_OF_WORDS_SEPARATOR} ${node.commonWords.join(' ')} ` +
                label;
          }
        }
        return {label};
      },
    };
  }

  /**
   * Utility method for generating a numeric faceting function.
   */
  generateNumericFacetingInfo(fieldName: string, buckets: number):
      FacetingInfo {
    const fieldStats = this.stats[fieldName];

    // Use D3's nice() method to round the min and max to pleasing values.
    const [numberMin, numberMax] =
        d3.scaleLinear()
            .domain([fieldStats.numberMin, fieldStats.numberMax])
            .nice()
            .domain();

    const range = numberMax - numberMin;

    let precision = 1;
    for (let key = 0; key < buckets; key++) {
      const lowIndex = key as number;
      const highIndex = 1 + lowIndex;
      const lowValue = lowIndex / buckets * range + numberMin;
      const highValue = highIndex / buckets * range + numberMin;
      if (lowValue !== highValue) {
        precision = Math.max(
            precision,
            this.computeMinimumPrecision(lowValue, highValue, precision));
      }
    }

    return {
      /**
       * Numeric faceting consists of dividing the available range into the
       * desired number of buckets and then returning the index of the matching
       * bucket.
       */
      facetingFunction: (item: GridItem) => {
        if (!(fieldName in item.data)) {
          return null;
        }
        const val = item.data[fieldName];
        if (typeof val !== 'number') {
          return val;
        }
        const x = val as number;
        if (isNaN(x)) {
          return x;
        }
        const diff = x - numberMin;
        return Math.min(Math.floor(buckets * diff / range), buckets - 1);
      },

      keyCompareFunction: sorting.numberCompare,

      /**
       * To label numeric facets, we describe the range of values, or fall
       * back to the default labeling function for non-numeric values.
       */
      labelingFunction: (key: Key) => {
        if (typeof key !== 'number' || isNaN(+key)) {
          return DEFAULT_LABELING_FUNCTION(key);
        }
        const lowIndex = key as number;
        const highIndex = 1 + lowIndex;
        const lowValue = lowIndex / buckets * range + numberMin;
        const highValue = highIndex / buckets * range + numberMin;

        // Bucket range labels should round to the nearest whole number if all
        // numeric values are integers.
        if (fieldStats.isInteger()) {
          return {
            label: this.formatRange(
                Math.ceil(lowValue), Math.floor(highValue), precision)
          };
        }
        return {label: this.formatRange(lowValue, highValue, precision)};
      },
    };
  }

  /**
   * Given a number used in a label, format it to a string.
   */
  formatNumber(num: number|null, precision = DEFAULT_NUMERIC_LABEL_PRECISION):
      string {
    if (num === null) {
      return 'null';
    }
    num = parseFloat(num.toPrecision(precision));
    return Math.abs(num) >= 1000 ? d3.format(`.${precision}s`)(num) : `${num}`;
  }

  /**
   * Given two numbers, compute the minimum precision necessary to distinguish
   * them, greater than or equal to the starting precision value.
   */
  computeMinimumPrecision(low: number, high: number, start = 1) {
    let precision = start;
    // 100 is the maximum precision value allowed by browsers.
    while (precision <= 100 &&
           low.toPrecision(precision) === high.toPrecision(precision)) {
      precision++;
    }
    return precision;
  }

  /**
   * Given a pair of low and high bounds, create a label string to describe
   * the range.
   */
  formatRange(
      low: number, high: number, precision = DEFAULT_NUMERIC_LABEL_PRECISION) {
    if (low === high) {
      return this.formatNumber(low, precision);
    }
    precision = this.computeMinimumPrecision(low, high, precision);
    // U+2014 is the unicode symbol for an emdash.
    return `${this.formatNumber(low, precision)} \u2014 ${
        this.formatNumber(high, precision)}`;
  }

  /**
   * Get keys for underlying data.
   */
  getKeys(): string[] {
    return getAllKeys(this.elem.data).sort();
  }

  /**
   * Keep rendering the visualization until at least the specified timestamp.
   */
  renderUntil(endTimestamp: number) {
    this.endTimestamp = Math.max(this.endTimestamp, endTimestamp);
    this.queueRenderScene();
  }

  /**
   * Handle resizes to the containing element.
   */
  resizeHandler() {
    const rect = this.elem.getBoundingClientRect();

    // Schedule future resize if this rect has no area.
    if (!rect.width || !rect.height) {
      requestAnimationFrame(() => this.resizeHandler());
      return;
    }

    // Resize SVG elements.
    this.labelsAndAxesSVG.attr('width', rect.width).attr('height', rect.height);
    this.cellBackgroundSVG.attr('width', rect.width)
        .attr('height', rect.height);

    if (this.renderer) {
      this.renderer.setSize(rect.width, rect.height);
    }
    this.camera.right = rect.width / this.scale;
    this.camera.bottom = -rect.height / this.scale;
    this.camera.updateProjectionMatrix();

    this.queueRenderScene();
  }

  /**
   * Queue up a request to render the scene.
   */
  queueRenderScene() {
    if (this.renderQueued) {
      return;
    }
    this.renderQueued = true;
    requestAnimationFrame(() => {
      if (this.renderQueued) {
        this.renderScene();
      }
    });
  }

  /**
   * Render the scene.
   */
  renderScene() {
    this.renderQueued = false;
    const now = Date.now();
    if (this.endTimestamp > now) {
      this.queueRenderScene();
    }
    if (this.spriteMesh) {
      this.spriteMesh.time = now;
      // TODO(jimbo): After upgrading past r81, remove this whole conditional.
      if (+THREE.REVISION < 81 && this.spriteMesh.onBeforeRender) {
        this.spriteMesh.onBeforeRender();
      }
    }
    if (this.renderer) {
      this.renderer.render(this.scene, this.camera);
    }
    if (this.spriteMesh && this.spriteMesh.spriteAtlas) {
      this.spriteMesh.spriteAtlas.postRender();
    }
  }
}


/**
 * Polymer shim. Custom callbacks and private properties begin with underscores.
 */
Polymer({
  is: 'facets-dive-vis',

  behaviors: [Polymer.IronResizableBehavior],

  properties: {
    data: {
      type: Array,
      value: null,
      observer: '_dataChange',
    },
    filteredDataIndices: {
      type: Array,
      value: null,
      observer: '_filteredDataIndicesChange',
    },
    atlasUrl: {
      type: String,
      value: null,
      observer: '_queueAtlasUrlChange',
    },
    spriteUrl: {
      type: String,
      value: null,
      observer: '_spriteUrlChange',
    },
    crossOrigin: {
      type: String,
      value: null,
    },
    keys: {
      type: Array,
      value: [],
      notify: true,
      readOnly: true,
    },
    stats: {
      type: Object,
      value: {},
      notify: true,
      readOnly: true,
    },
    scenePadding: {
      type: Number,
      value: DEFAULT_SCENE_PADDING,
    },
    tweenDuration: {
      type: Number,
      value: DEFAULT_TWEEN_DURATION,
    },
    fadeDuration: {
      type: Number,
      value: DEFAULT_FADE_DURATION,
    },
    spriteImageWidth: {
      type: Number,
      value: DEFAULT_SPRITE_IMAGE_WIDTH,
    },
    spriteImageHeight: {
      type: Number,
      value: DEFAULT_SPRITE_IMAGE_HEIGHT,
    },
    gridFacetingVerticalLabelColor: {
      type: String,
      value: GRID_FACETING_VERTICAL_LABEL_COLOR,
    },
    gridFacetingHorizontalLabelColor: {
      type: String,
      value: GRID_FACETING_HORIZONTAL_LABEL_COLOR,
    },
    itemPositioningVerticalLabelColor: {
      type: String,
      value: ITEM_POSITIONING_VERTICAL_LABEL_COLOR,
    },
    itemPositioningHorizontalLabelColor: {
      type: String,
      value: ITEM_POSITIONING_HORIZONTAL_LABEL_COLOR,
    },
    fitGridAspectRatioToViewport: {
      type: Boolean,
      value: false,
    },
    verticalFacet: {
      type: String,
      value: '',
      observer: '_updateGridFaceting',
    },
    verticalBuckets: {
      type: Number,
      value: DEFAULT_VERTICAL_BUCKETS,
      observer: '_updateGridFaceting',
    },
    verticalBagOfWords: {
      type: Boolean,
      value: false,
      observer: '_updateGridFaceting',
    },
    horizontalFacet: {
      type: String,
      value: '',
      observer: '_updateGridFaceting',
    },
    horizontalBuckets: {
      type: Number,
      value: DEFAULT_HORIZONTAL_BUCKETS,
      observer: '_updateGridFaceting',
    },
    horizontalBagOfWords: {
      type: Boolean,
      value: false,
      observer: '_updateGridFaceting',
    },
    positionMode: {
      type: String,
      value: '',
      observer: '_updateGridItemPositions',
    },
    verticalPosition: {
      type: String,
      value: '',
      observer: '_updateGridItemPositions',
    },
    horizontalPosition: {
      type: String,
      value: '',
      observer: '_updateGridItemPositions',
    },
    colorBy: {
      type: String,
      value: '',
      observer: '_updateColors',
      notify: true,
    },
    imageFieldName: {
      type: String,
      value: '',
      observer: '_updateImageFieldName',
      notify: true,
    },
    palette: {
      type: Array,
      value: [],
      notify: true,
    },
    paletteChoice: {
      type: String,
      value: 'standard',
      observer: '_updateColors',
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
      observer: '_selectedIndicesUpdated',
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
      observer: '_comparedIndicesUpdated',
    },
    stableColors: {
      type: Boolean,
      value: false,
      observer: '_updateColors',
    },
  },

  listeners: {'iron-resize': '_onIronResize'},

  created(this: any) {
    this._backing = new FacetsDiveVizInternal(this);
  },

  ready(this: any) {
    this._backing.ready();
  },

  _dataChange(this: any, data: DataExample[]) {
    // TODO(jimbo): Less hacky way of deferring change handlers for ready?
    if (!this._backing.scene) {
      requestAnimationFrame(this._dataChange.bind(this, data));
      return;
    }
    this._backing.dataChange();
    this._setKeys(this._backing.getKeys());
    this._setStats(this._backing.stats);
  },

  _filteredDataIndicesChange(this: any, filteredDataIndices: number[]) {
    // TODO(jimbo): Less hacky way of deferring change handlers for ready?
    if (!this._backing.scene || !this._backing.items) {
      requestAnimationFrame(
          this._filteredDataIndicesChange.bind(this, filteredDataIndices));
      return;
    }
    this._backing.filteredDataIndicesChange();
    this._setKeys(this._backing.getKeys());
    this._setStats(this._backing.stats);
  },

  _queueAtlasUrlChange(this: any, atlasUrl: string) {
    this._backing.queueAtlasUrlChange();
  },

  _spriteUrlChange(this: any, spriteUrl: string) {
    this._backing.spriteUrlChange();
  },

  _updateGridFaceting(this: any) {
    this._backing.updateGridFaceting();
  },

  _updateGridItemPositions(this: any) {
    this._backing.updateGridItemPositions();
  },

  _updateColors(this: any) {
    this._backing.updateColors();
  },

  _updateImageFieldName(this: any) {
    this._backing.updateImageFieldName();
  },

  _onIronResize(this: any) {
    this._backing.resizeHandler();
  },

  _selectedIndicesUpdated(this: any) {
    this._backing.selectedIndicesUpdated();
  },

  _comparedIndicesUpdated(this: any) {
    this._backing.comparedIndicesUpdated();
  },

  // Public non-Polymer methods.
  fitToViewport(this: any) {
    this._backing.fitToViewport();
  },

  zoomIn(this: any) {
    this._backing.zoomIn();
  },

  zoomOut(this: any) {
    this._backing.zoomOut();
  },
});
