
Facets Dive is a data visualization for interactively exploring large numbers of records at once—many thousands at a time.
Each record should be an object with key/value pairs representing the features of that record, and the values should be strings or numbers.

## Getting Started

In this section, you'll learn how to use Dive embedded in your on page or app.
The two things you need are your own data, and the Dive Polymer element.

### Providing Data to Dive

The `<facets-dive>` element has many attributes you can set to customize its behavior, but the only one you absolutely must set is `data`.
This should be an array of JavaScript objects, where each object represents a single record.

For example, say your data is a list of food items.
Each food has a unique name, belongs to a category, and provides calories.
As JSON, your data would look something like this:

```js
[{
  "name": "apple",
  "category": "fruit",
  "calories": 95
},{
  "name": "broccoli",
  "category": "vegetable",
  "calories": 50
},{
 ...Many more foods...
}]
```

The objects don't all need to have exactly the same set of keys.
If an object is missing keys that are present in another object, that record will still be shown in Dive.

At this time, Dive only handles numeric and string values.
If the values on your objects are complex (like arrays, or nested objects), these will be cast as strings prior to being visualized.

### Providing Sprites For Dive to Render

By default, Dive will render text onto a circle to represent each data point.
However, you can supply a sprite atlas that it can use instead.

We have provided a utility called *facets atlasmaker* that can be used for creating your own sprite atlas, given a list of image locations. Please see its [documentation](../facets_atlasmaker/) for more details.

A sprite atlas is one big image containing many tiny images at predictable coordinates.
Starting from the top-left hand corner of the image, sprites proceed across and down, from left-to-right and from top-to-bottom.

For example, consider a data set with 10,000 data points.
Indexed from zero, they'd be arranged in a sprite atlas like so:

```
+---------+---------+---------+- - - - -+---------+
|         |         |         |         |         |
|    0    |    1    |    2    |   ...   |    99   |
|         |         |         |         |         |
+---------+---------+---------+- - - - -+---------+
|         |         |         |         |         |
|   100   |   101   |   102   |   ...   |   199   |
|         |         |         |         |         |
+---------+---------+---------+- - - - -+---------+
|         |         |         |         |         |
|   200   |   201   |   202   |   ...   |   299   |
|         |         |         |         |         |
+---------+---------+---------+- - - - -+---------+
|         |         |         |         |         |
     .         .         .        .          .
|    .    |    .    |    .    |    .    |    .    |
     .         .         .          .        .
|         |         |         |         |         |
+---------+---------+---------+- - - - -+---------+
|         |         |         |         |         |
|  9900   |  9901   |  9902   |   ...   |  9999   |
|         |         |         |         |         |
+---------+---------+---------+- - - - -+---------+
```

To specify the URL to an atlas to use, set the `atlasUrl` property of the Dive Polymer Element in JavaScript (or the `atlas-url` attribute in HTML).
If the atlas image is served from a different domain than the visualization, it will have to use [CORS headers](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Using_textures_in_WebGL#Cross-domain_textures) to be useful.
In that case, you'll also have to set the `crossOrigin` property (or `cross-origin` HTML attribute) to be either `anonymous` or `use-credentials` just like you would for an `<img>` or `<video>` tag as described on Mozilla's [CORS settings attributes page.](https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_settings_attributes)

To correctly slice up the sprite atlas, Dive needs to know the width and height in pixels of each sprite.
You can set these with the `spriteImageWidth` and `spriteImageHeight` properties (`sprite-image-width` and `sprite-image-height` when setting them in HTML), respectively.

### Embedding Dive in Your Page

The project is built with [Bazel](https://www.bazel.build/). 
Make sure you have installed Bazel and run the Bazel BUILD files prior to proceeding. 
Provided you've loaded the `<facets-dive>` Polymer element, you can insert an instance into your page like so.

```html
<facets-dive></facets-dive>
```

To set the data, you'll need to add a little JavaScript.
In your code, first get a reference to this DOM element, then assign your array of objects to the `data` attribute.

```js
const vis = document.querySelector('facets-dive');
vis.data = [ ... your data ... ];
```

The `test.html` and `test.ts` files under `components/facets_dive` include a simple example.

### Navigating the Dive Controls

Dive is divided into three panels.
From left-to-right they are the control panel, the main visualization, and the info panel.

Once data has been loaded into the visualization, users drive exploration by manipulating the controls in the control panel.
There are four sections, each of which expand when clicked.
They are Faceting, Positioning, Color, and Display.

#### Faceting Controls

Dive's main function is to lay records out in a grid formation.
This is called faceting, and there are two directions that can be independently controlled: the vertical (row-based) and horizontal (column-based) directions.

When you select a feature to facet by in either direction, Dive will bucket the items by that feature.
For numeric values, Dive divides up the range of values into equally sized numeric segments.
For string values, Dive puts items together which share the same string value, and if there are too many, puts those in a bucket labeled _other_.

In addition, string values that contain spaces can be treated as an undifferentiated bag of words.
When the user checks the Bag of Words box, Dive arranges the items by putting them together in terms of their most common word.
This feature will likely be drastically changed or removed in the future.

#### Positioning Controls

By default, Dive will arrange items within each cell of the grid by stacking them.
Alternatively, the items can be placed in a scatter plot.
This is most useful when Faceting is set to `(none)`.

Features with numeric values can be used for scatter plot positioning.
Any items whose value is not a number will still be shown, but the value will be coerced to zero.

#### Color Controls

The Color Controls let you specify a field to use to color the individual items.

If a sprite atlas has not been specified, Dive will pick a feature to color by.
The picking algorithim prioritizes features which have a small number of unique values, such as categorical features.

#### Display Controls

The Display Controls let you specify what Dive will render onto each point.
If a sprite atlas has been specified, then Dive will default to showing the sprite for each point.
If not, then Dive will select the feature whose values are most unique, then render those strings as text on top of a circle background.

Whether you're using a sprite atlas or not, you can interactively control which feature is rendered to the points using the Display dropdown.

## Running Unit Tests and Demos

To play around with Dive locally, you can run the demos with Bazel.
These act as functional tests we use to perform manual tests.

### Running the Quick Draw Demo

Thanks to a collaboration with [Quick Draw](https://quickdraw.withgoogle.com/), one great way to try out Dive is to explore Quick Draw data.

To run the Quick Draw demo, open a terminal to your facets project directory, and run the following bazel command:

```sh
$ bazel run //facets_dive/demo
```

Once the server starts up, you can see the demo here:
http://localhost:6006/facets-dive/demo/quickdraw.html

### Running a Dive Integration Test

To test Dive using a simple, synthetic dataset, open a terminal to the facets project, then run the following command:

```sh
$ bazel run //facets_dive/components/facets_dive:devserver
```

Once this starts up, navigate to http://localhost:6006/facets-dive/components/facets-dive/runner.html.

### Running Dive Unit Tests

Dive's `lib` directory contains libraries that do most of the visualization grunt work.
To run the unit test suite for these libraries, open a terminal to the facets project, then run this command:

```sh
$ bazel run //facets_dive/lib/test:devserver
```

Once the server starts up, open a browser and navigate to http://localhost:6006/facets-dive/lib/test/runner.html.
Then, open your browser's web developer console.
You should see a report of all of the tests that were run, including a summary of how they did.

The Dive Polymer element is composed of several constituent sub-components.
Each of them (`<facets-dive-info-card>`, `<facets-dive-controls>`, and `<facets-dive-vis>`) have integration tests of the same form, which we use to confirm that code additions build and load correctly.

## Dive Polymer Element API

Dive's properties can be accessed both as attributes on the `<facets-dive>` element in HTML, and as properties on the `FacetsDive` Polymer element in JavaScript.

IMPORTANT: When setting any of these properties on the `<facets-dive>` element in HTML, use dashed-names-like-this, not camelCaseNamesLikeThis.

### Data Properties

These properties relate to the data that Dive visualizes.

* `data` - `Array<{}>` -
  An array of data objects to visualize.
* `filteredDataIndices` - `number[]` -
  An array of indices into the data objects array (optional).
  If this is non-null then only the entries in the data array with these indices are to be visualized.

### Sprite Properties

Properties that influence how the sprites in the visualization are rendered.

* `spriteImageWidth` - `number` -
  Width of sprite backing images in pixels.
  If not provided, a reasonable default will be set.
  (Use `sprite-image-width` in HTML).
* `spriteImageHeight` - `number` -
  Height of sprite backing images in pixels.
  If not provided, a reasonable default will be set.
  (Use `sprite-image-height` in HTML).
* `atlasUrl` - `string` -
  URL of an atlas image to use for backing sprites.
  Each sprite is mapped by its index within the `data` array to a rectangle of the atlas image.
  (Use `atlas-url` in HTML).
* `spriteUrl` - `string` -
  URL of a single, default sprite image to use for backing sprites.
  Each sprite has this same image.
  If not provided, a generic looking dot will be used.
  (Use `sprite-url` in HTML).
* `crossOrigin` - `string` -
  Optional `crossOrigin` property to use on `Image` elements.
  Described on MDN's [CORS settings attributes page](https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_settings_attributes).
  If set, this should either be `anonymous`, or `use-credentials`.
  This is necessary for using atlas or sprite images from any domain other than the one hosting the page.
  (Use `cross-origin` in HTML).

### Stylistic Properties

These optional properties control various stylistic aspects of Dive.

* `height` - `number` -
  Height of the element in pixels.
  If left unspecified, the element will grow to fill its parent element.
* `gridFacetingVerticalLabelColor` - `string` -
  Label color for grid faceting in the vertical direction.
  If not provided, a reasonable default will be set.
  (Use `grid-faceting-vertical-label-color` in HTML).
* `gridFacetingHorizontalLabelColor` - `string` -
  Label color for grid faceting in the horizontal direction.
  If not provided, a reasonable default will be set.
  (Use `grid-faceting-horizontal-label-color` in HTML).
* `itemPositioningVerticalLabelColor` - `string` -
  Label color for item positioning in the vertical direction.
  If not provided, a reasonable default will be set.
  (Use `item-positioning-vertical-label-color` in HTML).
* `itemPositioningHorizontalLabelColor` - `string` -
  Label color for item positioning in the horizontal direction.
  If not provided, a reasonable default will be set.
  (Use `item-positioning-horizontal-label-color` in HTML).
* `fitGridAspectRatioToViewport` - `boolean` -
  When laying out items in a grid, if this property is set, then the
  visualization will attempt to match the aspect ratio of the available
  on-screen space. For example, on a very wide screen, you would expect the grid
  to also be wide. When this property is not set, then the visualization will
  lay the grid items out using the default aspect ratio, a square.
  (Use `fit-grid-aspect-ratio-to-viewport` in HTML).

### Interactive Properties

Properties that drive the interactivity of Dive.
These are typically controlled by the user, but can also be set programatically after data has loaded.

* `verticalFacet` - `string` -
  Name of the field (feature) of the data to facet by vertically (row-based).
* `verticalBuckets` - `number` -
  Number of buckets to use when faceting vertically (row-based).
* `verticalBagOfWords` - `boolean` -
  For string-based, multi-word fields, the visualization can treat the values as a bag-of-words, rather than as full strings.
  For example, say a field had values like "toy store" and "pet store".
  The bag-of-words capability would bucket all the "store" values together, or split them into "toy store" and "pet store" depending on the number of buckets.
  This property determines whether the vertical facet should be treated as a bag-of-words.
* `horizontalFacet` - `string` -
  Name of the field of the data to facet by horizontally.
* `horizontalBuckets` - `number` -
  Number of buckets to use when faceting horizontally.
* `horizontalBagOfWords` - `boolean` -
  Whether to treat the horizontal facet field as a bag of words.
* `positionMode` - `string` -
  Mode used for positioning items within grid cells.
  Choices are `stacked` (the default) and `scatter`.
* `verticalPosition` - `string` -
  Field used to position items along the vertical axis when in scatter mode.
* `horizontalPosition` - `string` -
  Field used to position items along the horizontal axis.
* `colorBy` - `string` -
  Field used to color items.
* `imageFieldName` - `string` -
  In the event that a per-sprite image is not available (no atlas), this holds the name of the field used to draw text onto the backing canvas behind the sprites.
  Say your data was a collection of books, each with a "title" attribute.
  If `imageFieldName` was set to `"title"`, then the title of each book would be drawn onto a circle to represent that data point.
* `paletteChoice` - `string` -
  Which source color palette should be used for generating a data-specific color palette.
  The four recognized values are `standard`, `warm`, `cool`, and `assist`.
  Each palette uses colors from the [Material Design style guide.](https://material.io/guidelines/style/color.html#)
* `selectedData` - `Array<{}>` -
  READ ONLY.
  The currently selected data objects.
  They will all be elements of the data array.
  Changed through user interaction (clicking sprites).

### Advanced Customization Properties

* `infoRenderer?` - `(dataObject: {}, containerElem: Element) => void` -
  Callback function to use to render the content of a data object for the info pane.
  If not specified, the `FacetsDiveInfoCard.defaultInfoRenderer` will be used.
* `comparedIndices` - `Array<number>` -
  Property listing indices of data objects to compare to the selected ones.
  Set this programatically, will automatically update `comparedData` to match.
* `comparedData` - `Array<{}>` -
  READ ONLY.
  Data objects to be compared to the selected objects.
  They will all be elements of the data array.
  Changed automatically in response to changes to `comparedIndices`.
