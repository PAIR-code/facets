"""Utilities and wrappers for file and source catalog I/O."""

import io
import json
import os
import time
from urlparse import urlparse
from absl import logging
from PIL import Image
import requests
from requests.exceptions import Timeout


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


def _check_src_list_dups(locations, handle_dups='ignore'):
  """Check source list for duplicate source image locations.

  If dups are found, either ignore with warning, don't use duplicates (take the
  first one encountered), or fail.

  Args:
    locations: List of source image locations.
    handle_dups: One of the following strings: ignore, fail, unique.

  Returns:
    List of file locations.
  """
  ingore = 'ignore'
  fail = 'fail'
  unique = 'unique'

  logging.info('Number of images listed in source list: %d' % len(locations))

  if handle_dups not in [ingore, fail, unique]:
    raise ValueError('Unknown action for handling dups in source list.')

  if len(locations) == len(set(locations)):
    logging.debug('No duplicates in source list.')
    return locations

  uniques = []
  dups = set()
  seen = set()

  for location in locations:
    if location not in seen:
      uniques.append(location)
      seen.add(location)
    else:
      dups.add(location)

  if handle_dups == fail:
    raise ValueError('Found duplicates in source list: %s' % ', '.join(dups))
  logging.warn('Found the following duplicates in source list: %s' % ', '.join(dups))
  if handle_dups == unique:
    logging.info('Found duplicates but only using %d unique entries in image '
                 'source list' % len(uniques))
    return uniques
  return locations


def read_src_list_csvfile(filepath, handle_dups='ignore'):
  """Read source list from csv file.

  Each line should contain the location of a source image file.

  Returns:
    List of file locations.
  """
  logging.debug('Reading images list from %s.' % filepath)
  try:
    with tf.gfile.GFile(filepath) as input_file:
      return _check_src_list_dups(input_file.read().splitlines(), handle_dups)
  except NameError:
    with open(filepath) as input_file:
      return _check_src_list_dups(input_file.read().splitlines(), handle_dups)


def get_image(location, request_timeout=60, http_max_retries=2,
              http_retry_interval=3):
  """Wrapper function that routes to appropriate utility to get image data.

  Args:
    location: location of source image data. This can be a URL,
              local file location, or possibly other location types which may be
              supported in the future. If localfile, it should be the full path
              to the file.
    request_timeout: Timeout in seconds for file download.
    http_max_retries: Max number of attempts we will try to retrive http images
                      due to timeout errors.
    http_retry_interval: Seconds to wait between retries.

  Returns:
    PIL Image object.
  """
  if http_max_retries < 1:
    raise ValueError('Max retries must be 1 or greater.')
  if http_retry_interval < 0:
    raise ValueError('Retry interval must be 0 or more seconds.')
  if urlparse(location).scheme in ('http', 'https'):
    # File should be downloaded from URL.

    # Retry if we run into timeout errors, give up otherwise.
    attempts = 0
    while attempts < http_max_retries - 1:
      try:
        req = requests.get(location, stream=True, timeout=request_timeout)
        image_data = io.BytesIO(req.raw.read())
        return Image.open(image_data)
      except Timeout:
        logging.debug('Timeout error while retrieving image from URL. Waiting '
                      '%d seconds before retrying' % http_retry_interval)
        time.sleep(http_retry_interval)
      except Exception:
        raise
      attempts += 1
    # Final attempt
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
  """Write atlases and manifests to local file. Handles multiple items.

  Args:
    outdir: full path to output directory
    atlases: List of sprite atlas PIL Image objects.
    manifests: List of manifests (list of dicts)
    sprite_atlas_settings: SpriteAtlasSettings object.
  """
  if len(atlases) == 1:
    save_image(atlases[0],
               os.path.join(
                   outdir,
                   # Filename with correct image format extension
                   '{}.{}'.format(
                       sprite_atlas_settings.filename,
                       str(sprite_atlas_settings.img_format).lower())))
    _output_manifest(
        os.path.join(
            outdir, sprite_atlas_settings.manifest_filename + '.json'),
        manifests[0])
  else:
    for idx, atlas in enumerate(atlases):
      save_image(atlas,
                 os.path.join(
                     outdir,
                     # Filename with correct image format extension
                     '{}{}.{}'.format(
                         sprite_atlas_settings.filename, str(idx),
                         str(sprite_atlas_settings.img_format).lower())))
      _output_manifest(
          os.path.join(
              outdir,
              sprite_atlas_settings.manifest_filename + str(idx) + '.json'),
          manifests[idx])


def save_image(img, outpath, delete_after_write=False):
  """Save an image to file.

   We are using RGBA by default, but not all types can use RGBA, such as JPEG,
   so this handles conversions if needed.

   For output format validation purposes, saving a test image to disk verifies
   that the specified output format is supported by PIL, as there's no API to
   verify that the image format string is allowed other than by attempting to
   save the image.

   Args:
     img: PIL Image object.
     outpath: Full output path for image along with image format extension.
              E.g., /path/to/myimage.jpg
     delete_after_write: If True, will delete the image after writing it. This
                         should be used when writing a test image to disk to
                         verify that PIL can actually output the specified image
                         format.
  """
  try:
    img.save(outpath)
  except IOError:
    logging.warn('Unable to save image as RGBA to desired output format. '
                 'Converting to RGB and retrying.')
    img.convert('RGB').save(outpath)
    logging.info('Successfully saved image in RGB color space.')

  if delete_after_write:
    os.remove(outpath)


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
