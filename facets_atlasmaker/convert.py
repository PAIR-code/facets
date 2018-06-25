"""Image conversion classes and methods.

Methods for converting images as well as for creating a default image for use
upon image retrieval/conversion failures.
"""
from __future__ import absolute_import
from __future__ import division
from __future__ import print_function

from absl import logging
from PIL import Image
from PIL import ImageOps


DEFAULT_OPACITY = 0  # Between (0, 255)

# Conversion settings
_REQUIRED_MIN_DIMENSION = 10  # required minimum size of converted image


class ImageConvertSettings(object):
  """Image conversion settings."""

  def __init__(self, img_format, width, height, position=(0.5, 0.5),
               bg_color_rgb=(0, 0, 0),
               opacity=DEFAULT_OPACITY,
               resize_if_larger=False,
               preserve_aspect_ratio=True):
    """Initialize settings object.

    Args:
      img_format: image output format, e.g., 'png', 'jpeg', etc. See supported
                  PIL image types.
      width: desired output width in pixels.
      height: desired output height in pixels.
      position: position of resized image within new size frame. This should
                be specified as a tuple with each value between [0, 1].
                Default is (0.5, 0.5) for center.
      bg_color_rgb: Background color in RGB values. E.g., (255, 255, 255).
      opacity: Opacity or alpha value, from 0 to 255.
      resize_if_larger: If True, will resize the image to fit the larger size
                        if the desired output size is larger than the original
                        image size.
      preserve_aspect_ratio: If True, will attempt to preserve the original
                             image's aspect ration when resizing. Otherwise
                             will attempt a best effort. See PIL ImageOps.fit
                             documentation.
    """
    self._format = img_format
    self._width = width
    self._height = height
    self._transparency = opacity
    self._opacity = opacity
    # Background color is specified as RGBA
    self._bg_mode = 'RGBA'
    self._bg_color = (bg_color_rgb[0], bg_color_rgb[1], bg_color_rgb[2],
                      opacity)
    self._position = position
    self._preserve_aspect_ratio = preserve_aspect_ratio
    # Whether image should be upsized if desired size is larger than orig size.
    self._resize_if_larger = resize_if_larger

    self._validate_settings()

  def _validate_settings(self):
    error_messages = []
    for val in self._position:
      if val < 0 or val > 1:
        error_messages.append('Position must be a percent of width/height with '
                              'values ranging from 0 to 1.\n')
    for val in self._bg_color:
      if val < 0 or val > 255:
        error_messages.append('RGB and opacity values must be between (0, 255)'
                              '.\n')
    if self.width < _REQUIRED_MIN_DIMENSION:
      error_messages.append('Desired width must be greater than %d pixels.\n' %
                            _REQUIRED_MIN_DIMENSION)
    if self.height < _REQUIRED_MIN_DIMENSION:
      error_messages.append('Desired width must be greater than %d pixels.\n' %
                            _REQUIRED_MIN_DIMENSION)
    if error_messages:
      raise ValueError('The following invalid conversion settings were found: '
                       '%s' % str(error_messages))

  @property
  def bg_color(self):
    return self._bg_color

  @property
  def bg_mode(self):
    return self._bg_mode

  @property
  def format(self):
    return self._format

  @property
  def height(self):
    return self._height

  @property
  def width(self):
    return self._width

  @property
  def position(self):
    return self._position

  @property
  def resize_if_larger(self):
    return self._resize_if_larger

  @property
  def preserve_aspect_ratio(self):
    return self._preserve_aspect_ratio


class ImageConverter(object):
  """Converter for images"""

  def __init__(self, image, image_convert_settings):
    """Initialize converter.

    Args:
      image: input image.
      image_convert_settings: ImageConvertSettings object.
    """
    self._orig_img = image
    self._settings = image_convert_settings

    self._desired_size = (image_convert_settings.width,
                          image_convert_settings.height)
    self._desired_format = str(image_convert_settings.format).lower()
    self._preserve_aspect_ratio = image_convert_settings.preserve_aspect_ratio
    self._resize_if_larger = image_convert_settings.resize_if_larger
    self._position = image_convert_settings.position  # Tuple (x, y) as decimal.

    # Background settings
    self._bg_mode = image_convert_settings.bg_mode
    self._bg_color = image_convert_settings.bg_color

  def convert(self):
    """Returns a converted image as a PIL Image object."""
    # TODO: Do we need an option to allow pre-cropping?
    if (self._orig_img.size == self._desired_size and
        self._orig_img.format == self._desired_format.upper()):
      logging.debug('Desired image is same format and size as original image'
                    'so no conversion needed.')
      return self._orig_img

    # Desired image is larger than original image.
    if (self._desired_size[0] > self._orig_img.size[0] and
        self._desired_size[1] > self._orig_img.size[1]):
      if self._preserve_aspect_ratio and self._resize_if_larger:
        return self._resize_larger_keep_aspect_ratio()
      elif self._resize_if_larger:
        return self._resize_larger_dont_keep_aspect_ratio()
      return self._pad_to_larger_size()

    if self._preserve_aspect_ratio:
      return self._resize_thumbnail_keep_aspect_ratio()
    return self._resize_thumbnail_and_crop()


  def _resize_thumbnail_keep_aspect_ratio(self):
    """Resize image to fit the new smaller size, retaining aspect ratio.

    We use the PIL thumbnail function, which guarantees the aspect ratio is
    maintained but does not ensure the output size matches your desired size
    (only that it will not exceed it). We then paste it onto a background image
    that matches the desired output size.

    If the new size is smaller than the original image size (in either
    dimension), the image is reduced so it's just large enough to fit the
    desired size, and padded with a background to ensure it's exactly the
    desired size.

    If the new size is larger than the original image size, the original size
    is retained and the image is padded with a background to make it exactly
    the desired size.

    Args:
      orig_img: PIL Image object.

    Returns:
      Void.
    """

    # We use Image.ANTIALIAS for better quality. This is the recommended PIL
    # setting.
    self._orig_img.thumbnail(self._desired_size, Image.ANTIALIAS)

    offset = (
        int(
            round(
                (self._desired_size[0] - self._orig_img.size[0])
                * self._position[0])),
        int(
            round(
                (self._desired_size[1] - self._orig_img.size[1])
                * self._position[1])))

    bkgd_img = Image.new(self._bg_mode, self._desired_size, self._bg_color)
    bkgd_img.paste(self._orig_img, offset)
    return bkgd_img

  def _resize_thumbnail_and_crop(self):
    """Resize image smaller, not retaining aspect ratio.

    For image reduction, reduce size to fit smallest of the dimensions and
    crop the larger dimension as necessary. Crop centering is based on
    center of image."""

    logging.debug('Reducing image size and cropping as necessary.')
    return ImageOps.fit(image=self._orig_img, size=self._desired_size,
                        centering=self._position)

  def _pad_to_larger_size(self):
    """Just pad orig image to larger size if desired size is larger."""
    offset = (int(round((self._desired_size[0]) / 2)),
              int(round((self._desired_size[1]) / 2)))
    bkgd_img = Image.new(self._bg_mode, self._desired_size, self._bg_color)
    bkgd_img.paste(self._orig_img, offset)
    return bkgd_img

  def _resize_larger_dont_keep_aspect_ratio(self):
    """Stretch image to fit new size, NOT retaining the aspect ratio."""
    logging.info('Desired size is larger than source image size.')
    return ImageOps.fit(image=self._orig_img, size=self._desired_size)

  def _resize_larger_keep_aspect_ratio(self):
    """Stretch image to fit new size, keeping the aspect ratio."""
    orig_w, orig_h = self._orig_img.size

    # Find min stretch ratio, create a scaled up image.
    resize_ratio = min(self._desired_size[0] / orig_w,
                       self._desired_size[1] / orig_h)
    (new_width, new_height) = (int(round(orig_h * resize_ratio)),
                               int(round(orig_w * resize_ratio)))
    new_img = ImageOps.fit(image=self._orig_img,
                           size=(new_width, new_height))

    # If after stretching, it's the desired size already, then return image.
    if self._desired_size == (new_width, new_height):
      return new_img

    # Otherwise we need to pad it to the correct size.
    offset = (int(round((self._desired_size[0] - new_width) / 2)),
              int(round((self._desired_size[1] - new_height) / 2)))
    bkgd_img = Image.new(self._bg_mode, self._desired_size, self._bg_color)
    bkgd_img.paste(new_img, offset)
    return bkgd_img


def create_default_image(image_convert_settings):
  """Returns a default PIL image for use on image retrieval/conversion failures.

  Helper method for creating a default image (of the background) to be used in
  Atlas for images that fail retrieval/conversion.

  Returns:
      PIL Image.
  """
  return Image.new(
      image_convert_settings.bg_mode,
      (image_convert_settings.width, image_convert_settings.height),
      image_convert_settings.bg_color)
