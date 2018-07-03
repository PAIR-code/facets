"""Unit tests for image conversion."""
from __future__ import absolute_import
from __future__ import division
from __future__ import print_function

import os
from absl.testing import absltest
from PIL import Image
from PIL import ImageColor
import convert

TESTDATA_DIR = 'testdata'


class ImageConvertSettingsTests(absltest.TestCase):
  """Test settings class"""

  def test_initializeWithDefaultSettings(self):
    # Simply verifies we can create an instance and return some properties.
    settings = convert.ImageConvertSettings('png', 100, 100)
    self.assertEqual(settings.format, 'png')
    self.assertEqual(settings.height, 100)
    self.assertEqual(settings.width, 100)

  def test_initializeWithAllSettings(self):
    # Simply verifies we can create an instance and return some properties.
    settings = convert.ImageConvertSettings(
        'png', 100, 100, position=(0.1, 0.1), bg_color_rgb=(100, 100, 100),
        opacity=100, resize_if_larger=True, preserve_aspect_ratio=True)

    self.assertEqual(settings.format, 'png')
    self.assertEqual(settings.height, 100)
    self.assertEqual(settings.width, 100)

  def test_invalidWidth(self):
    with self.assertRaises(ValueError):
      convert.ImageConvertSettings('png', 0, 10)

  def test_invalidHeight(self):
    with self.assertRaises(ValueError):
      convert.ImageConvertSettings('png', 10, 0)

  def test_invalidPosition(self):
    with self.assertRaises(ValueError):
      convert.ImageConvertSettings('png', 10, 10, position=(-1, 0))

  def test_invalidBGColorRGB(self):
    with self.assertRaises(ValueError):
      convert.ImageConvertSettings('png', 10, 10, bg_color_rgb=(-1, 500, 255))

  def test_invalidOpacity(self):
    with self.assertRaises(ValueError):
      convert.ImageConvertSettings('png', 10, 10, opacity=300)


class TestImageConverterTests(absltest.TestCase):
  """Test image conversion outputs."""

  def setUp(self):
    self.testdata_dir = os.path.join(os.getcwd(), TESTDATA_DIR)

    self.desired_width = 100
    self.desired_height = 100
    self.conversion_settings = convert.ImageConvertSettings(
        'png', self.desired_width, self.desired_height)

    # Color settings used to verifying image output is correct
    self.red_rgb = ImageColor.getrgb('red')
    self.blue_rgb = ImageColor.getrgb('blue')
    self.orange_rgb = ImageColor.getrgb('orange')
    self.green_rgb = ImageColor.getrgb('green')
    self.yellow_rgb = ImageColor.getrgb('yellow')

  def testConvertSmallerKeepRatioHasCorrectSize(self):
    # Larger image is resized smaller, keeping aspect ratio.
    # This test simply verifies the size
    # TODO: delete and merge with following tests.
    conversion_settings = convert.ImageConvertSettings(
        'png', self.desired_width, self.desired_height,
        preserve_aspect_ratio=True)
    orig_img = Image.new('RGBA', (1000, 500))

    image_converter = convert.ImageConverter(orig_img, conversion_settings)
    converted_img = image_converter.convert()

    self.assertEqual(converted_img.size,
                     (self.desired_width, self.desired_height))

  def testConvertResizedSmallKeepRatio(self):
    # Verify that for an original red rectangular (vertically long image),
    # after conversion to a square size with blue background the output image
    # looks correct based on sampling color at several locations.
    orig_img = Image.new('RGBA', (50, 500), self.red_rgb)
    conversion_settings = convert.ImageConvertSettings(
        'png', 100, 100, bg_color_rgb=self.blue_rgb)

    # Final image should be a 10px wide by 100px tall rectangle centered
    # within the square, i.e., with center at pixel (49, 49) and borders of
    # 45 pixels on each side.
    image_converter = convert.ImageConverter(orig_img, conversion_settings)
    converted_img = image_converter.convert()

    # Just compare the RGB values, not opacity
    # Center should be red
    self.assertEqual(converted_img.getpixel((45, 45))[0:3], self.red_rgb)
    # Top Center should be red
    self.assertEqual(converted_img.getpixel((45, 0))[0:3], self.red_rgb)
    # Bottom Center should be red
    self.assertEqual(converted_img.getpixel((45, 99))[0:3], self.red_rgb)
    # Top left edge border should be blue background, then red rect.
    self.assertEqual(converted_img.getpixel((44, 0))[0:3], self.blue_rgb)
    self.assertEqual(converted_img.getpixel((45, 0))[0:3], self.red_rgb)
    # Bottom right edge border should be red, then blue background.
    self.assertEqual(converted_img.getpixel((54, 99))[0:3], self.red_rgb)
    self.assertEqual(converted_img.getpixel((55, 99))[0:3], self.blue_rgb)

  def testConvertResizedSmallTopLeftKeepRatio(self):
    # Same as above but we specify that the position remains in the top left.
    # Verify that for an original red rectangular (vertically long image),
    # after conversion to a square size with blue background the output image
    # looks correct based on sampling color at several locations.
    orig_img = Image.new('RGBA', (50, 500), self.red_rgb)
    conversion_settings = convert.ImageConvertSettings(
        'png', 100, 100, position=(0, 0), bg_color_rgb=self.blue_rgb)

    # Final image should be a 10px wide by 100px tall rectangle flush with
    # the left edge of the output size. I.e., rectangle with center at pixel
    # (4, 49) and the blue background staring at x position 9.
    image_converter = convert.ImageConverter(orig_img, conversion_settings)
    converted_img = image_converter.convert()

    # Just compare the RGB values, not opacity
    # Center of image should be blue
    self.assertEqual(converted_img.getpixel((45, 45))[0:3], self.blue_rgb)
    # Top left corner should be red
    self.assertEqual(converted_img.getpixel((0, 0))[0:3], self.red_rgb)
    # Bottom right corner of rectangle along with adjacent blue background
    self.assertEqual(converted_img.getpixel((9, 99))[0:3], self.red_rgb)
    self.assertEqual(converted_img.getpixel((10, 99))[0:3], self.blue_rgb)
    # Right edge of image should be background color
    self.assertEqual(converted_img.getpixel((45, 99))[0:3], self.blue_rgb)

  def testConvertSmallerRightPosKeepRatio(self):
    # Same as above but we specify that the position remains in the right.
    # Verify that for an original red rectangular (vertically long image),
    # after conversion to a square size with blue background the output image
    # looks correct based on sampling color at several locations.
    orig_img = Image.new('RGBA', (50, 500), self.red_rgb)
    conversion_settings = convert.ImageConvertSettings(
        'png', 100, 100, position=(1, 0.5), bg_color_rgb=self.blue_rgb)

    # Final image should be a 10px wide by 100px tall rectangle flush with
    # the right edge of the output size. I.e., rectangle with center at pixel
    # (94, 49) and the blue background staring at x position 9.
    image_converter = convert.ImageConverter(orig_img, conversion_settings)
    converted_img = image_converter.convert()

    # Just compare the RGB values, not opacity
    # Center of image should be blue
    self.assertEqual(converted_img.getpixel((45, 45))[0:3], self.blue_rgb)
    # Top left corner should be blue background.
    self.assertEqual(converted_img.getpixel((0, 0))[0:3], self.blue_rgb)
    # Center of rectangle should be red
    self.assertEqual(converted_img.getpixel((94, 49))[0:3], self.red_rgb)
    # Bottom left edge of rectangle and adjacent background
    self.assertEqual(converted_img.getpixel((90, 99))[0:3], self.red_rgb)
    self.assertEqual(converted_img.getpixel((89, 99))[0:3], self.blue_rgb)
    # Top left edge of rectangle and adjacent background
    self.assertEqual(converted_img.getpixel((90, 0))[0:3], self.red_rgb)
    self.assertEqual(converted_img.getpixel((89, 0))[0:3], self.blue_rgb)

  def testConvertSmallerIgnoreRatio(self):
    # Test resize image to smaller sprite without retaining aspect ratio.
    # Simply verifies correct size output.
    conversion_settings = convert.ImageConvertSettings(
        'png', self.desired_width, self.desired_height,
        preserve_aspect_ratio=False)
    orig_img = Image.new('RGBA', (1000, 500))

    image_converter = convert.ImageConverter(orig_img, conversion_settings)
    converted_img = image_converter.convert()

    self.assertEqual(converted_img.size,
                     (self.desired_width, self.desired_height))

  def testConvertResizedSmallDontKeepRatioCenterCrop(self):
    # Verify that we get the desired output image when cropping from center.

    # Orig image is a 4 quadrant (200, 200) pixel image, with colors
    # (orange, red, green, yellow) starting from top left and going clockwise.
    orig_img = Image.new('RGBA', (200, 200), self.yellow_rgb)
    orig_img.paste(Image.new('RGBA', (100, 100), self.orange_rgb), (0, 0))
    orig_img.paste(Image.new('RGBA', (100, 100), self.red_rgb), (100, 0))
    orig_img.paste(Image.new('RGBA', (100, 100), self.green_rgb), (100, 100))

    conversion_settings = convert.ImageConvertSettings(
        'png', self.desired_width, self.desired_height,
        preserve_aspect_ratio=False)

    # Output image should be 100x100 cropped from the center.
    image_converter = convert.ImageConverter(orig_img, conversion_settings)
    converted_img = image_converter.convert()

    # Top left of output image should be orange.
    self.assertEqual(converted_img.getpixel((0, 0))[0:3], self.orange_rgb)
    # Top right should be red
    self.assertEqual(converted_img.getpixel((99, 0))[0:3], self.red_rgb)
    # Bottom right should be green
    self.assertEqual(converted_img.getpixel((99, 99))[0:3], self.green_rgb)
    # Bottom left should be yellow
    self.assertEqual(converted_img.getpixel((0, 99))[0:3], self.yellow_rgb)
    # Center section should comprise the same set of colors clockwise.
    self.assertEqual(converted_img.getpixel((49, 49))[0:3], self.orange_rgb)
    self.assertEqual(converted_img.getpixel((50, 49))[0:3], self.red_rgb)
    self.assertEqual(converted_img.getpixel((50, 50))[0:3], self.green_rgb)
    self.assertEqual(converted_img.getpixel((49, 50))[0:3], self.yellow_rgb)

  def testConvertSmallerIgnoreRatioCropTopLeftSameAspectRatio(self):
    # Verify that we get the desired output image when cropping from left.
    # In this case, since the output image's aspect ratio is same as the input
    # image's aspect ratio, we're able to crop it correctly and keep the same
    # pattern.

    # Orig image is a 4 quadrant (200, 200) pixel image, with colors
    # (orange, red, green, yellow) starting from top left and going clockwise.
    orig_img = Image.new('RGBA', (200, 200), self.yellow_rgb)
    orig_img.paste(Image.new('RGBA', (100, 100), self.orange_rgb), (0, 0))
    orig_img.paste(Image.new('RGBA', (100, 100), self.red_rgb), (100, 0))
    orig_img.paste(Image.new('RGBA', (100, 100), self.green_rgb), (100, 100))

    conversion_settings = convert.ImageConvertSettings(
        'png', self.desired_width, self.desired_height, position=(0, 0),
        preserve_aspect_ratio=False)

    # Output image should be 100x100 cropped from the center.
    image_converter = convert.ImageConverter(orig_img, conversion_settings)
    converted_img = image_converter.convert()

    # Top left of output image should be orange.
    self.assertEqual(converted_img.getpixel((0, 0))[0:3], self.orange_rgb)
    # Top right should be red
    self.assertEqual(converted_img.getpixel((99, 0))[0:3], self.red_rgb)
    # Bottom right should be green
    self.assertEqual(converted_img.getpixel((99, 99))[0:3], self.green_rgb)
    # Bottom left should be yellow
    self.assertEqual(converted_img.getpixel((0, 99))[0:3], self.yellow_rgb)
    # Center section should comprise the same set of colors clockwise.
    self.assertEqual(converted_img.getpixel((49, 49))[0:3], self.orange_rgb)
    self.assertEqual(converted_img.getpixel((50, 49))[0:3], self.red_rgb)
    self.assertEqual(converted_img.getpixel((50, 50))[0:3], self.green_rgb)
    self.assertEqual(converted_img.getpixel((49, 50))[0:3], self.yellow_rgb)

  def testConvertSmallerIgnoreRatioCropTopLeftNoAspectRatio(self):
    # Verify that we get the desired output image when cropping from top left.
    # In this case, the aspect ratio of the output image is different than
    # that of the orig image so cropping occurs.

    # Orig image is a 4 quadrant (200, 200) pixel image, with colors
    # (orange, red, green, yellow) starting from top left and going clockwise.
    orig_img = Image.new('RGBA', (200, 200), self.yellow_rgb)
    orig_img.paste(Image.new('RGBA', (100, 100), self.orange_rgb), (0, 0))
    orig_img.paste(Image.new('RGBA', (100, 100), self.red_rgb), (100, 0))
    orig_img.paste(Image.new('RGBA', (100, 100), self.green_rgb), (100, 100))

    # Note that in this case, the aspect ratio has changed.
    conversion_settings = convert.ImageConvertSettings(
        'png', width=20, height=200, position=(0, 0),
        preserve_aspect_ratio=False)
    # Output image should be 20x200 that only contains the orange and yellow
    # sections since we crop from the left.
    image_converter = convert.ImageConverter(orig_img, conversion_settings)
    converted_img = image_converter.convert()

    # Top left of output image should be orange.
    self.assertEqual(converted_img.getpixel((0, 0))[0:3], self.orange_rgb)
    # Top right should be orange
    self.assertEqual(converted_img.getpixel((19, 0))[0:3], self.orange_rgb)
    # Bottom right should be yellow
    self.assertEqual(converted_img.getpixel((19, 199))[0:3], self.yellow_rgb)
    # Bottom left should be yellow
    self.assertEqual(converted_img.getpixel((0, 199))[0:3], self.yellow_rgb)

  def testConvertResizedLargerKeepAspectRatio(
      self):
    conversion_settings = convert.ImageConvertSettings(
        'png', self.desired_width, self.desired_height, resize_if_larger=True,
        preserve_aspect_ratio=False)

    orig_img = Image.new('RGBA', (10, 10))

    image_converter = convert.ImageConverter(orig_img, conversion_settings)
    converted_img = image_converter.convert()

    self.assertEqual(converted_img.size,
                     (self.desired_width, self.desired_height))

  def testConvertImageResizedLargerIgnoreRatio(self):
    # Verifies that output size and image (based on pixel samples) are correct.
    conversion_settings = convert.ImageConvertSettings(
        'png', self.desired_width, self.desired_height,
        bg_color_rgb=self.blue_rgb, resize_if_larger=True,
        preserve_aspect_ratio=False)
    orig_img = Image.new('RGBA', (20, 10), self.red_rgb)

    image_converter = convert.ImageConverter(orig_img, conversion_settings)
    converted_img = image_converter.convert()

    # Verify size.
    self.assertEqual(converted_img.size,
                     (self.desired_width, self.desired_height))
    # Image should be stretched to fit desired output size, so entire output
    # should be red. Verify center, and top left / bottom right edges.
    self.assertEqual(converted_img.getpixel((45, 45))[0:3], self.red_rgb)
    self.assertEqual(converted_img.getpixel((0, 0))[0:3], self.red_rgb)
    self.assertEqual(converted_img.getpixel((99, 99))[0:3], self.red_rgb)

  def testConvertImagePaddedLargerCorrectSize(self):
    # Input image is smaller than desired, but we just pad it to fit new size.
    conversion_settings = convert.ImageConvertSettings(
        'png', self.desired_width, self.desired_height, resize_if_larger=True)
    orig_img = Image.new('RGBA', (10, 10))

    image_converter = convert.ImageConverter(orig_img, conversion_settings)
    converted_img = image_converter.convert()

    self.assertEqual(converted_img.size,
                     (self.desired_width, self.desired_height))

  def testConvertInputSizeSameAsOutput(self):
    # Verify that if input and output size are the same, things still work.
    orig_img = Image.new('RGBA', (100, 100))

    image_converter = convert.ImageConverter(orig_img, self.conversion_settings)
    converted_img = image_converter.convert()

    self.assertEqual(converted_img.size,
                     (self.desired_width, self.desired_height))

  def testConvertTruncatedImage(self):
    # Should fail with a message that image is truncated.
    # To test image truncation, we actually need to write a file to disk.
    img_filepath = os.path.join(self.testdata_dir, 'test_img.png')

    try:
      orig_img = Image.new('RGBA', (500, 500), self.orange_rgb)
      orig_img.save(img_filepath)
      filesize = os.path.getsize(img_filepath)

      with open(img_filepath, 'r+') as img_on_disk:
        img_on_disk.truncate(filesize - 100)
      img_truncated = Image.open(img_filepath)

      image_converter = convert.ImageConverter(img_truncated,
                                               self.conversion_settings)
      with self.assertRaises(IOError) as e:
        image_converter.convert()
      self.assertTrue('truncated' in str(e.exception).lower())
    except:
      raise
    finally:
      # Cleanup.
      if os.path.isfile(img_filepath):
        os.remove(img_filepath)


class TestImageConverterHelpersTests(absltest.TestCase):
  """Test misc helper functions."""

  def testCreateDefaultImage(self):
    conversion_settings = convert.ImageConvertSettings(
        'png', 20, 20, resize_if_larger=True)
    output_img = convert.create_default_image(conversion_settings)

    self.assertEqual(output_img.size, (20, 20))


if __name__ == '__main__':
  absltest.main()
