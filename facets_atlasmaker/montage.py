"""Utilities to combine converted images into atlas and to create manifest."""
import math
import os
from absl import logging
from PIL import Image


# Manifest Key names
MANIFEST_IMAGE_NAME_KEY = 'image_name'
MANIFEST_SOURCE_IMAGE_KEY = 'source_image'
MANIFEST_OFFSET_X_KEY = 'offset_x'
MANIFEST_OFFSET_Y_KEY = 'offset_y'
MANIFEST_IMAGE_FAIL_KEY = 'errors'


class SpriteAtlasSettings(object):
  """Sprite atlas settings."""

  def __init__(self, img_format, height=None, width=None,
               filename='spriteatlas', manifest_filename='manifest'):
    """

    Width and height are in units of number of images

    Args:
      img_format: output format (JPG, PNG, etc).
      height: Height of atlas in number of images.
      width: Width in number of images.
      filename: Desired filename of atlas (without file extension).
      manifest_filename: Desired filename of atlas manifest (without file
                         extension).
    """
    self._img_format = img_format
    self._width = width
    self._height = height
    self._filename = filename
    self._manifest_filename = manifest_filename

  @property
  def filename(self):
    return self._filename

  @property
  def img_format(self):
    return self._img_format

  @property
  def height(self):
    return self._height

  @property
  def width(self):
    return self._width

  @property
  def manifest_filename(self):
    return self._manifest_filename


class SpriteAtlasGenerator(object):
  """Class that generates one or more sprite atlases."""

  def __init__(self, images_with_statuses, img_src_paths, atlas_settings,
               default_img):
    """Initialize Atlas generator.

    Args:
      images_with_statuses: List of tuples, where each tuple contains
                          (converted Image object or None, status/error message
                          string). These will be montaged into the Atlas.
      img_src_paths: List of image source paths (strings).
      settings: SpritesheetSettings instance.
      default_img: PIL Image object representing the default image to be used
                   when a desired image failed retrieval/conversion.
    """
    self._images_with_statuses = images_with_statuses
    self._img_src_paths = img_src_paths
    self._atlas_settings = atlas_settings
    self._default_image = default_img

    self._atlas_manifests = []  # List of atlas manifests.

    # Store tuple representing individual image (width, height) in pixels.
    self._img_width_height_px = self._identify_image_size()
    self._num_input_images = len(self._images_with_statuses)

    self._validate_inputs()

  def _identify_image_size(self):
    """Returns size of the first no failed image.

    Helper method to identify image size for validation.

    Raises:
      ValueError if all images had failed retrieval and/or conversion.
    """
    for img_with_status in self._images_with_statuses:
      img = img_with_status[0]
      if img is not None:
        return img.size
    raise ValueError('No images were successfully retrieved and converted.')

  def _validate_inputs(self):
    if len(self._img_src_paths) != self._num_input_images:
      raise ValueError('Number of elements in image list is different from '
                       'number of elements in src paths list.')
    for img_with_status in self._images_with_statuses:
      img = img_with_status[0]
      if img is not None and img.size != self._img_width_height_px:
        raise ValueError('Input images are not all the same size.')

  def create_atlas(self):
    """Returns tuple of (list of sprite atlas images, list of manifests).

    If atlas size is not specified, it creates a single square
    atlas. Otherwise, it creates how ever many atlases are required
    to contain the images at the specific atlas size.

    Atlases are populated with images from left to right, top to bottom.

    Returns:
      List of Sprite Atlases.
    """
    # If no atlas size specified or if a single atlas can fit all images,
    # create a single atlas.
    atlas_size_is_specified = (self._atlas_settings.height is not None and
                               self._atlas_settings.width is not None)

    if not atlas_size_is_specified:
      spriteatlas1, manifest1 = self._create_single_atlas()
      return ([spriteatlas1], [manifest1])
    else:
      # TODO: Support creating multiple sprite atlases.
      raise NotImplementedError()

  def _create_single_atlas(self):
    """Returns a single sprite atlas"""
    (atlas_width, atlas_height) = self._generate_default_atlas_size()

    # Initialize manifest
    manifest = []

    # Ensure they're ints
    atlas_width = int(atlas_width)
    atlas_height = int(atlas_height)

    # Atlas size in pixels (width, height)
    atlas_size_pixels = (atlas_width * self._img_width_height_px[0],
                         atlas_height * self._img_width_height_px[1])
    logging.debug('generating atlas of size %d, %d' % (atlas_size_pixels[0],
                                                       atlas_size_pixels[1]))

    # We create a background image of the atlas size that we will paste the
    # sprite images onto.
    montage = Image.new('RGBA', atlas_size_pixels, (255, 255, 255, 255))
    # Generate row by row, from left to right, top to bottom.
    image_idx = 0
    failed_images_count = 0
    for row_idx in range(0, atlas_width):
      offset_height = row_idx * self._img_width_height_px[1]
      for col_idx in range(0, atlas_height):
        if image_idx >= self._num_input_images:
          # Finished montaging all images.
          break
        offset_width = col_idx * self._img_width_height_px[0]

        # Manifest entry for that image.
        img_manifest = {
            MANIFEST_IMAGE_NAME_KEY:
                os.path.basename(self._img_src_paths[image_idx]),
            MANIFEST_SOURCE_IMAGE_KEY: self._img_src_paths[image_idx],
            MANIFEST_OFFSET_X_KEY: offset_width,
            MANIFEST_OFFSET_Y_KEY: offset_height
        }

        img = self._images_with_statuses[image_idx][0]
        status = self._images_with_statuses[image_idx][1]
        if img is not None:
          montage.paste(img, (offset_width, offset_height))
        else:
          montage.paste(self._default_image, (offset_width, offset_height))
          failed_images_count += 1
          # Add error message to manifest.
          img_manifest[MANIFEST_IMAGE_FAIL_KEY] = status
        manifest.append(img_manifest)
        image_idx += 1

    logging.info('Montaged %d images onto sprite atlas of size %s '
                 'pixels.' % (image_idx, str(atlas_size_pixels)))
    if failed_images_count > 0:
      logging.warning('%d images had failures and were replaced by the default '
                      'image' % failed_images_count)
    return montage, manifest

  def _generate_default_atlas_size(self):
    """Generate a default square size for the atlas if input size is not
    specified. Note that square means that it attempts to have the same number
    of images in the height and the width, which is NOT the same as having a
    square size in terms of number of pixels.

    Returns:
      A tuple representing the number of images per side.
    """
    side = math.ceil(math.sqrt(self._num_input_images))
    return side, side
