"""Utilities and wrappers for file and source catalog I/O."""

import io
import json
import os
from urlparse import urlparse
from absl import logging
from PIL import Image
import requests


# Use TF gfile interface if available (for supporting more file types).
try:
  import tensorflow as tf
except ImportError:
  pass


# Location Type names
LOCATION_URL = 'url'
LOCATION_GFILE = 'gfile'


def create_output_dir_if_not_exist(dirpath, testfile_name='testfile'):
  """Ensure output dir exists and can be written to.

  If dir doesn't exist, attempts to create it. Writes and deletes a test file to
  confirm we have write permissions.

  Args:
    dirpath: local directory path.

  Raises:
    OSError: Directory can't be created.
    IOError: Test file can't be written.
  """
  if not os.path.isdir(dirpath):
    logging.info('Output dir %s doesn\'t exist, so attempting to create it.'
                 % dirpath)
    os.makedirs(dirpath)

  with open(os.path.join(dirpath, testfile_name), 'w') as testfile:
    testfile.write('')
    logging.debug('Successfully wrote test file to output dir.')
  os.remove(os.path.join(dirpath, testfile_name))
  logging.info('Confirmed we have permissions to write to output dir.')


def read_src_list_csvfile(filepath):
  """Read source list from csv file.

  Each line should contain the location of a source image file.

  Returns:
    List of file locations.
  """
  logging.debug('Reading images list from %s.' % filepath)
  try:
    with tf.gfile.GFile(filepath) as input_file:
      return input_file.read().splitlines()
  except NameError:
    with open(filepath) as input_file:
      return input_file.read().splitlines()


def get_image(location, request_timeout=60):
  """Wrapper function that routes to appropriate utility to get image data.

  Args:
    location: location of source image data. This can be a URL,
              local file location, or possibly other location types which may be
              supported in the future. If localfile, it should be the full path
              to the file.
    request_timeout: Timeout in seconds for file download.

  Returns:
    PIL Image object.
  """
  # TODO: May need to explicitly close Images for performance reasons.
  if urlparse(location).scheme in ('http', 'https'):
    # File should be downloaded from URL.
    # TODO: Handle retries if file download fails.
    req = requests.get(location, stream=True, timeout=request_timeout)
    image_data = io.BytesIO(req.raw.read())
    return Image.open(image_data)
  else:
    try:
      with tf.gfile.GFile(location) as input_file:
        return Image.open(input_file)
    except NameError:
      return Image.open(location)


def save_atlas_and_manifests(outdir, atlases, manifests, sprite_atlas_settings):
  """Write atlases and manifests to local file.

  Args:
    outdir: full path to output directory
    atlases: List of sprite atlas PIL Image objects.
    manifests: List of manifests (list of dicts)
    sprite_atlas_settings: SpriteAtlasSettings object.
  """
  if len(atlases) == 1:
    atlases[0].save(os.path.join(
        outdir,
        sprite_atlas_settings.filename + '.' + str(
            sprite_atlas_settings.img_format).lower()))
    _output_manifest(
        os.path.join(
            outdir, sprite_atlas_settings.manifest_filename + '.json'),
        manifests[0])
  else:
    for idx, atlas in enumerate(atlases):
      atlas.save(os.path.join(
          outdir,
          sprite_atlas_settings.filename + str(idx) + '.' + str(
              sprite_atlas_settings.img_format).lower()))
      _output_manifest(
          os.path.join(
              outdir,
              sprite_atlas_settings.manifest_filename + str(idx) + '.json'),
          manifests[idx])


def _output_manifest(filepath, manifest):
  """Writes sprite atlas manifest to localfile.

  Each image manifest is a json object listed on a separate line.

  Args:
    filepath: full filepath to output manifest.
    manifest: list of dicts.

  Returns:
    Nothing.
  """
  with open(filepath, 'a') as fp:
    fp.seek(0, 0)
    fp.truncate()
    for item in manifest:
      json.dump(item, fp)
      fp.write('\n')
