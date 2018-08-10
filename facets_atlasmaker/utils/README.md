# Atlasmaker Utilities

This directory contains utilities that can be useful for testing or  experimenting with Atlasmaker.

## Wikipedia Sourcelist Generator

The script connects to the Wikipedia API to get a list of URLs of Featured Images that 
you can use as input to Atlasmaker.

Example usage for getting a list of 1000 images with debug messages printed to stdout:

```sh
bazel run :wikipedia_sourcelist_generator -- --num_images=1000 --outputdir=$PWD --verbosity=1
``` 