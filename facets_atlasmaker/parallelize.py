"""Parallelize file fetch and conversion utilities and wrappers."""

from absl import logging
from joblib import Parallel, delayed
from PIL.Image import DecompressionBombError
import atlasmaker_io
import convert


def get_and_convert_image(image_location, image_convert_settings,
                          disk_cache=False):
  """Wrapper method that retrieves and converts one image.

  If run all in-memory (i.e., no disk spill), then returns PIL Image object.
  Otherwise returns path of disk-cached image.

  Args:
    image_location: Image path from the input list of locations.
    image_convert_settings: ImageConvertSettings object.

  Returns:
    Image object or None if fails.

  Raises:
    IOError: error retrieving image file.
    DecompressionBombError: Image is too large (>0.5G). See PIL documentation
                            for instructions on setting a higher threshold.
  """
  try:
    src_image = atlasmaker_io.get_image(image_location)
  except (IOError, DecompressionBombError) as e:
    logging.error('Retrieval of file %s failed with error: %s',
                  image_location, e)
    return None

  if disk_cache:
    raise NotImplementedError()

  image_converter = convert.ImageConverter(src_image, image_convert_settings)
  logging.debug('Successfully converted image: %s' % image_location)
  return image_converter.convert()


def get_and_convert_images_parallel(image_src_locations, image_convert_settings,
                                    n_jobs=-1, disk_cache=False, threads=False,
                                    verbose=10):
  """Parallelize retrieving and converting image tasks.

  Args:
    images: List of source image paths (filepaths, URLs, etc).
    image_convert_settings: ImageConvertSettings object.
    disk_cache:: If True, will cache converted images to disk.
    threads: If true, use threads instead of processes.
    verbose: verbosity level for parallel. See joblib.Parallel documentation.

  Returns:
    List of converted Image objects.
  """
  logging.info('Parallelizing with setting %d jobs' % n_jobs)

  backend = None
  if threads:
    logging.debug('Parallelizing using threads.')
    backend = 'threading'

  # TODO: Should have some flag to signify if image retrieval failed.
  outputs = Parallel(n_jobs=n_jobs, backend=backend, verbose=verbose)(
      delayed(get_and_convert_image)(
          location, image_convert_settings, disk_cache)
      for location in image_src_locations)

  return outputs


def convert_default_image(image_location, image_convert_settings):
  """Return converted default image used for failures

  Args:
    image_location: Path or URL of image.
    image_convert_settings: ImageConvertSettings object.
  """
  default_img = get_and_convert_image(
      image_location, image_convert_settings=image_convert_settings)
  if default_img is None:
    raise IOError('Unable to retrive and convert default image.')
  return default_img
