# Facets Atlasmaker

Atlasmaker is a command line utility and library for creating sprite atlases. These atlases can be 
used in Facets Dive and other applications.

## Setup and Dependencies

Although optional, we recommend that you install packages within a 
[virtualenv](https://virtualenv.pypa.io/en/stable/) for dependency isolation. 

The easiest way to get the required and optional dependencies is to install them from the 
requirements.txt file via pip:

```sh
pip install -r requirements.txt
```

However, you can also choose to install requirements manually. If so, you'll need these general 
python packages:

```
pip install absl-py
pip install mock
```

As well as these specific packages for Atlasmaker:

```
pip install pillow
pip install joblib
pip install requests
```

Additionally, you can install these optional dependencies:

* Tensorflow: [install Tensorflow and its dependencies](https://www.tensorflow.org/install/install_sources#install_tensorflow_python_dependencies) 
(if you haven't done so already from previous Facets setup steps). This provides an interface (gfile) for interfacing with other google file sources.
* [Nose](http://nose.readthedocs.io/en/latest/): for running unit tests.
* pylint: For linting code against the provided Google style pylintrc config.

## Functionality

Atlasmaker currently supports the following functionality:

* Reading input images from localfile and URLs (http/https).
* Various image resizing and conversion options.
* Parallelization of image fetch/conversion.

Future features (in rough order of priority) that it may support include:

* Conversion of a single image.
* Using a default image in the atlas if an image was not successfully retrieved or converted.
* Caching images onto disk instead of doing everything in memory (useful when converting many large 
image files).
* Reading from other storage types, such as Google Cloud Storage.
* Reading the source images list from a [protocol buffer](https://developers.google.com/protocol-buffers/docs/overview) 
text format file to allow different conversion settings by image if desired.
* Creating sprite atlases comprised of different sized images.
* Creating multiple sprite atlases based on desired atlas sizes.

## Getting Started: Generate Your First Sprite Atlas

To run Atlasmaker, you point it to a file listing desired source images as well as conversion options via
command-line flags. To list the full set of flags, call the ```--help``` flag. E.g.,

```sh
bazel run :atlasmaker -- --help
```

To run Atlasmaker, you can either (1) run ```bazel build``` and then execute the resulting binary, 
or (2) use the ```bazel run``` command, which will build and execute the program in a single step. 
You can run Atlasmaker using the example list of wikipedia images provided in the ```testdata``` 
directory as input.

To build and then execute the binary, run the following from this directory:

```sh
bazel build :atlasmaker

# Create temp dir to hold outputs if it doesn't exist (optional)
mkdir $PWD/outputs/

# The binary will be within the bazel-bin directory in the root Facets directory. Now run 
../bazel-bin/facets_atlasmaker/atlasmaker --sourcelist=$PWD/testdata/wikipedia_images_16.csv --output_dir=$PWD/outputs/
```
 
Alternatively, you can run the bazel run command to build and run in a single step:

```
# Create temp dir to hold outputs if it doesn't exist (optional)
mkdir $PWD/outputs/

# Run atlasmaker
bazel run :atlasmaker -- --sourcelist=$PWD/testdata/wikipedia_images_16.csv --output_dir=$PWD/outputs/
```

Some of the most useful image settings flags you can set include:

* ```--image_format```: Output image format, such as png, jpeg, etc.
* ```--image_width```: width of each final desired output image in pixels.
* ```--image_height```: height of each final desired output image in pixels.
* ```--keep_aspect_ratio```: Whether to retain the image aspect ratio, or make a best effort to fit
resize original image, cropping as necessary.
* ```---bg_color_name or --bg_color_rgb```: You can specify the background used (e.g., for images 
that were resized and now don't fill the entire output sprite as well as for locations on the atlas 
with no images) via a color name or RGB value, such as '255,255,0'.

## For Developers

### pylint

This code should follow the [Google Python Style Guide](https://github.com/google/styleguide/blob/gh-pages/pyguide.md).
Running pylint using the provided pylintrc file allow you to lint according to Google style. 

However, note that we deviate from the style guide (and PEP8) for indents by using 2 spaces, not 4 
(to match the internal Google Python Style guide). Sorry!

### Unit Tests

Note that for Google compatibility we use [abseil](https://abseil.io/)'s unit testing framework 
instead of unittest/pyunit, but using this framework should feel almost identical to unittest.

We recommend you run all the unit tests with ```nose``` (i.e., as standard unittests, not Bazel 
tests). There are no Bazel test rules for running the tests because Bazel doesn't yet fully support 
testing using dependencies from a virtualenv.

Once you have nose installed, you can simply run all tests within the facets atlasmaker directory 
with command: `nosetests`.
