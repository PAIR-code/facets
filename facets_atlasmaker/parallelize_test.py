"""Tests for parallize."""
import os
from absl import logging
from absl.testing import absltest
from PIL import Image
from PIL import ImageFile
import parallelize
import convert

TESTDATA_DIR = 'testdata'


class ParallelizeTests(absltest.TestCase):

  def setUp(self):
    self.testdata_dir = os.path.join(os.getcwd(), TESTDATA_DIR)

    # Ensure setting is set to default for each test.
    try:
      ImageFile.LOAD_TRUNCATED_IMAGES = False
    except AttributeError as e:
      logging.warning('Are you using PILLOW and not a very old version of PIL? '
                      'Unable to force load of truncated image files: %s', e)

  def testGetAndConvertOneImageFromLocalFile(self):
    # Test parallelization of a single image succeeds.
    testfile_path = os.path.join(self.testdata_dir,
                                 'Googleplex-Patio-Aug-2014.JPG')
    expected_output_image_size = (100, 100)
    image_convert_settings = convert.ImageConvertSettings(
        img_format='png', width=100, height=100)

    output_image, status = parallelize.get_and_convert_image(
        testfile_path, image_convert_settings)
    del status  # linter

    self.assertSameElements(output_image.size, expected_output_image_size)

  def testGetAndConvertOneImageMissingFile(self):
    # Returns None if can't open file.
    testfile_path = os.path.join(self.testdata_dir,
                                 'file_doesnt_exist.png')
    image_convert_settings = convert.ImageConvertSettings(
        img_format='png', width=100, height=100)

    output_image, status = parallelize.get_and_convert_image(
        testfile_path, image_convert_settings)
    del status  # linter

    self.assertEqual(output_image, None)

  def testGetAndConvertOneImageNotImageFile(self):
    # Returns None if can't open file.
    testfile_path = os.path.join(self.testdata_dir,
                                 'attributions.txt')
    image_convert_settings = convert.ImageConvertSettings(
        img_format='png', width=100, height=100)

    output_image, status = parallelize.get_and_convert_image(
        testfile_path, image_convert_settings)
    del status  # linter

    self.assertEqual(output_image, None)

  def testGetAndConvertTruncatedImageFail(self):
    # Should note fail but return None when PIL fails on truncated image.
    # To test image truncation, we actually need to write a file to disk.
    img_filepath = os.path.join(self.testdata_dir, 'test_img.png')

    try:
      orig_img = Image.new('RGBA', (500, 500))
      orig_img.save(img_filepath)
      filesize = os.path.getsize(img_filepath)

      with open(img_filepath, 'r+') as img_on_disk:
        img_on_disk.truncate(filesize - 100)

      image_convert_settings = convert.ImageConvertSettings(
          img_format='png', width=100, height=100)

      output_image_with_status = parallelize.get_and_convert_image(
          img_filepath, image_convert_settings)

      self.assertIsNone(output_image_with_status[0])
      self.assertTrue(output_image_with_status[1])  # Has error message.
    except:
      raise
    finally:
      # Cleanup.
      if os.path.isfile(img_filepath):
        os.remove(img_filepath)

  def testGetAndConvertAllowTruncatedImage(self):
    # Should return a converted image if we tolerate truncated images.
    # To test image truncation, we actually need to write a file to disk.
    img_filepath = os.path.join(self.testdata_dir, 'test_img.png')

    try:
      orig_img = Image.new('RGBA', (500, 500))
      orig_img.save(img_filepath)
      filesize = os.path.getsize(img_filepath)

      with open(img_filepath, 'r+') as img_on_disk:
        img_on_disk.truncate(filesize - 100)

      image_convert_settings = convert.ImageConvertSettings(
          img_format='png', width=100, height=100)

      output_image_with_status = parallelize.get_and_convert_image(
          img_filepath, image_convert_settings, allow_truncated_images=True)

      self.assertEqual(output_image_with_status[0].size, (100, 100))
    except:
      raise
    finally:
      # Cleanup.
      if os.path.isfile(img_filepath):
        os.remove(img_filepath)

  def testGetAndConvertOneImageBadUrl(self):
    # Returns None if can't open file.
    testfile_path = 'http://www.google.com'
    image_convert_settings = convert.ImageConvertSettings(
        img_format='png', width=100, height=100)

    output_image, status = parallelize.get_and_convert_image(
        testfile_path, image_convert_settings)
    del status  # linter

    self.assertEqual(output_image, None)

  def testParallelizeConvertImagesFromLocalfile(self):
    # Test parallelization with multiple reads of the same image file produces
    # expected output images with correct sizes.
    testfile_path = os.path.join(self.testdata_dir,
                                 'Googleplex-Patio-Aug-2014.JPG')
    testfile_locations = [testfile_path] * 3
    expected_output_image_sizes = [(100, 100)] * 3
    image_convert_settings = convert.ImageConvertSettings(
        img_format='png', width=100, height=100)

    output_imgs_with_status = parallelize.get_and_convert_images_parallel(
        testfile_locations, image_convert_settings, verbose=1)

    resulting_image_sizes = []
    for (image, status) in output_imgs_with_status:
      del status  # linter
      resulting_image_sizes.append(image.size)

    self.assertSameElements(resulting_image_sizes, expected_output_image_sizes)

  def testParallelizeConvertWithFailures(self):
    # 3 images are attempted, the last one should fail.
    testfile_path = os.path.join(self.testdata_dir,
                                 'Googleplex-Patio-Aug-2014.JPG')
    bad_testfile_path = os.path.join(self.testdata_dir,
                                     'attributions.txt')
    testfile_locations = [testfile_path, testfile_path, bad_testfile_path]
    expected_image_size = (100, 100)

    image_convert_settings = convert.ImageConvertSettings(
        img_format='png', width=100, height=100)

    output_images = parallelize.get_and_convert_images_parallel(
        testfile_locations, image_convert_settings, verbose=1)

    first_converted_img = output_images[0][0]
    second_converted_img = output_images[1][0]
    third_converted_img = output_images[2][0]
    self.assertSameElements(first_converted_img.size, expected_image_size)
    self.assertSameElements(second_converted_img.size, expected_image_size)
    self.assertEqual(third_converted_img, None)  # Failed conversion.

  def testConvertDefaultImageSucceeds(self):
    testfile_path = os.path.join(self.testdata_dir,
                                 'Googleplex-Patio-Aug-2014.JPG')
    image_convert_settings = convert.ImageConvertSettings(
        img_format='png', width=100, height=100)

    img = parallelize.convert_default_image(testfile_path,
                                            image_convert_settings)

    self.assertEqual(img.size, (100, 100))

  def testConvertDefaultImageFails(self):
    testfile_path = os.path.join(self.testdata_dir, 'attributions.txt')
    image_convert_settings = convert.ImageConvertSettings(
        img_format='png', width=100, height=100)

    with self.assertRaises(IOError):
      parallelize.convert_default_image(testfile_path, image_convert_settings)


if __name__ == '__main__':
  absltest.main()
