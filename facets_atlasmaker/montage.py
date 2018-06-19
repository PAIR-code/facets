"""Utilities to combine converted images into atlas and to create manifest."""
import math
import os
from PIL import Image


# Manifest Key names
MANIFEST_IMAGE_NAME_KEY = 'image_name'
MANIFEST_SOURCE_IMAGE_KEY = 'source image'
MANIFEST_OFFSET_X_KEY = 'offset_x'
MANIFEST_OFFSET_Y_KEY = 'offset_y'


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

  def __init__(self, images, img_src_paths, atlas_settings):
    """Initialize Atlas generator.

    Args:
      images: List of converted image objects that will be combined into atlas.
      img_src_paths: List of image source paths (strings).
      settings: SpritesheetSettings instance.
    """
    self._images = images
    self._img_src_paths = img_src_paths
    self._atlas_settings = atlas_settings

    self._atlas_manifests = []  # List of atlas manifests.

    # Store tuple representing individual image (width, height) in pixels.
    self._img_width_height_px = self._images[0].size
    self._num_input_images = len(self._images)

    self._validate_inputs()

  def _validate_inputs(self):
    if len(self._img_src_paths) != self._num_input_images:
      raise ValueError('Number of elements in image list is different from '
                       'number of elements in src paths list.')
    for img in self._images:
      if img.size != self._img_width_height_px:
        raise ValueError('Input images are not all the same size.')

  def create_atlas(self):
    """Returns tuple of (list of sprite atlas images, list of manifests).

    If atlas size is not specified, it creates a single square
    atlas. Otherwise, it creates how ever many atlases are required
    to contain the images at the specific atlas size.

    Atlases are populated with images from left to right, top to bottom.

    Args:
      images: List of image objects.
      settings: SpritesheetSettings instance.

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

    # We create a background image of the atlas size that we will paste the
    # sprite images onto.
    montage = Image.new('RGBA', atlas_size_pixels, (255, 255, 255, 255))
    # Generate row by row.
    image_idx = 0
    for row_idx in range(0, atlas_width):
      offset_height = row_idx * self._img_width_height_px[1]
      for col_idx in range(0, atlas_height):
        if image_idx >= self._num_input_images:
          # Finished montaging all images.
          break
        offset_width = col_idx * self._img_width_height_px[0]
        manifest.append(
            {MANIFEST_IMAGE_NAME_KEY: os.path.basename(self._img_src_paths[image_idx]),
             MANIFEST_SOURCE_IMAGE_KEY: self._img_src_paths[image_idx],
             MANIFEST_OFFSET_X_KEY: offset_width,
             MANIFEST_OFFSET_Y_KEY: offset_height})
        montage.paste(self._images[image_idx], (offset_width, offset_height))
        image_idx += 1
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
