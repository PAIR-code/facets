"""Parallelize file fetch and conversion utilities and wrappers."""
import multiprocessing
from joblib import Parallel, delayed
import atlasmaker_io
import convert

# Default num jobs for parallelization.
_NUM_CPUS = multiprocessing.cpu_count()


def _get_and_convert_image(image_location, image_convert_settings,
                           disk_cache=False):
  """

  If run all in-memory (i.e., no disk spill), then returns PIL Image object.
  Otherwise returns path of disk-cached image.

  Args:
    image_location: Image path from the input list of locations.
    image_convert_settings: ImageConvertSettings object.

  Returns:
    Image object.
  """
  # TODO: Handle case when image cannot be retrieved.
  src_image = atlasmaker_io.get_image(image_location)
  # TODO: Add conversion step

  if disk_cache:
    raise NotImplementedError()

  image_converter = convert.ImageConverter(src_image, image_convert_settings)
  return image_converter.convert()


def get_and_convert_images_parallel(
    image_src_locations, image_convert_settings, n_jobs=0, disk_cache=False,
    threads=False):
  """Parallelize retrieving and converting images.

  Args:
    images: List of source image paths (filepaths, URLs, etc).
    image_convert_settings: ImageConvertSettings object.
    disk_cache:: If True, will cache converted images to disk.
    threads: If true, use threads instead of processes.

  Returns:
    List of converted Image objects.
  """
  if n_jobs == 0:
    n_jobs = _NUM_CPUS

  backend = None
  if threads:
    backend = 'threading'

  # TODO: Should have some flag to signify if image retrieval failed.
  outputs = Parallel(n_jobs=n_jobs, backend=backend)(
      delayed(_get_and_convert_image)(
          location, image_convert_settings, disk_cache)
      for location in image_src_locations)

  return outputs
