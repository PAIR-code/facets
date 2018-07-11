"""Parallelize file fetch and conversion utilities and wrappers."""

from absl import logging
from joblib import Parallel, delayed
from PIL import ImageFile
import atlasmaker_io
import convert


def get_and_convert_image(image_location, image_convert_settings,
                          allow_truncated_images=False, disk_cache=False,
                          request_timeout=60, http_max_retries=2):
  """Wrapper method that retrieves and converts one image.

  If run all in-memory (i.e., no disk spill), then returns PIL Image object.
  Otherwise returns path of disk-cached image.

  Args:
    image_location: Image path from the input list of locations.
    image_convert_settings: ImageConvertSettings object.
    allow_truncated_images: If True, PIL will be tolerant of truncated image
                            files and load/process them. Note that this isn't
                            supported on old versions on PIL, just pillow.
    disk_cache: Store intermediary image objects to disk. Not supported yet.
    request_timeout: Max secs for http requests before timeout.
    http_max_retries: Max number of attempts we will try to retrive http images
                      due to timeout errors.

  Returns:
    A tuple (Image object or None if fails, status message string). Status
    message string will be empty if success, or error message if failure.

  Exceptions handled:
    All exceptions for image retrieval are handled. Some notable ones are:
      - DecompressionBombError: Image is too large (>0.5G). See PIL
                                documentation for instructions on setting a
                                higher threshold.
    For image conversion, the following errors are handled:
      - IOError: error retrieving image file, or truncated image file.

  """
  if disk_cache:
    raise NotImplementedError()

  if allow_truncated_images:
    try:
      ImageFile.LOAD_TRUNCATED_IMAGES = True
    except AttributeError as e:
      logging.warning('Are you using PILLOW and not a very old version of PIL? '
                      'Unable to force load of truncated image files: %s', e)

  try:
    src_image = atlasmaker_io.get_image(image_location, request_timeout,
                                        http_max_retries=http_max_retries)
  except Exception as e:
    logging.error('Retrieval of file %s failed with error: %s',
                  image_location, e)
    return None, str(e)

  try:
    image_converter = convert.ImageConverter(src_image, image_convert_settings)
    logging.debug('Successfully converted image: %s' % image_location)
    return image_converter.convert(), ''
  except IOError as e:
    logging.error('Conversion of file %s failed with error: %s',
                  image_location, e)
    return None, str(e)


def get_and_convert_images_parallel(image_src_locations, image_convert_settings,
                                    n_jobs=-1, disk_cache=False, threads=False,
                                    verbose=10, allow_truncated_images=False,
                                    request_timeout=60, http_max_retries=2):
  """Parallelize retrieving and converting image tasks.

  Args:
    images: List of source image paths (filepaths, URLs, etc).
    image_convert_settings: ImageConvertSettings object.
    disk_cache:: If True, will cache converted images to disk.
    threads: If true, use threads instead of processes.
    verbose: verbosity level for parallel. See joblib.Parallel documentation.
    allow_truncated_images: If True, PIL will be tolerant of truncated image
                            files and load/process them. Note that this isn't
                            supported on old versions on PIL, just pillow.
    request_timeout: Max secs for http requests before timeout.
    http_max_retries: Max number of attempts we will try to retrive http images
                      due to timeout errors.

  Returns:
    List of tuples, where each tuple contains
    (converted Image object or None, status/error message string).
  """
  logging.info('Parallelizing with setting %d jobs' % n_jobs)

  backend = None
  if threads:
    logging.debug('Parallelizing using threads.')
    backend = 'threading'

  outputs = Parallel(n_jobs=n_jobs, backend=backend, verbose=verbose)(
      delayed(get_and_convert_image)(
          location, image_convert_settings,
          allow_truncated_images=allow_truncated_images,
          disk_cache=disk_cache, request_timeout=request_timeout,
          http_max_retries=http_max_retries)
      for location in image_src_locations)

  return outputs


def convert_default_image(image_location, image_convert_settings):
  """Return converted default image used for failures

  Args:
    image_location: Path or URL of image.
    image_convert_settings: ImageConvertSettings object.
  """
  default_img, status = get_and_convert_image(
      image_location, image_convert_settings=image_convert_settings)
  del status  # linter.
  if default_img is None:
    raise IOError('Unable to retrive and convert default image.')
  return default_img
