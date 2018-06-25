"""Tests for parallize."""
import os
from absl.testing import absltest
import parallelize
import convert

TESTDATA_DIR = 'testdata'


class ParallelizeTests(absltest.TestCase):

  def setUp(self):
    self.testdata_dir = os.path.join(os.getcwd(), TESTDATA_DIR)

  def testGetAndConvertOneImageFromLocalFile(self):
    # Test parallelization of a single image succeeds.
    testfile_path = os.path.join(self.testdata_dir,
                                 'Googleplex-Patio-Aug-2014.JPG')
    expected_output_image_size = (100, 100)
    image_convert_settings = convert.ImageConvertSettings(
        img_format='png', width=100, height=100)

    output_image = parallelize.get_and_convert_image(
        testfile_path, image_convert_settings)

    self.assertSameElements(output_image.size, expected_output_image_size)

  def testGetAndConvertOneImageMissingFile(self):
    # Returns None if can't open file.
    testfile_path = os.path.join(self.testdata_dir,
                                 'file_doesnt_exist.png')
    image_convert_settings = convert.ImageConvertSettings(
        img_format='png', width=100, height=100)

    output_image = parallelize.get_and_convert_image(
        testfile_path, image_convert_settings)

    self.assertEqual(output_image, None)

  def testGetAndConvertOneImageNotImageFile(self):
    # Returns None if can't open file.
    testfile_path = os.path.join(self.testdata_dir,
                                 'attributions.txt')
    image_convert_settings = convert.ImageConvertSettings(
        img_format='png', width=100, height=100)

    output_image = parallelize.get_and_convert_image(
        testfile_path, image_convert_settings)

    self.assertEqual(output_image, None)

  def testGetAndConvertOneImageBadUrl(self):
    # Returns None if can't open file.
    testfile_path = 'http://www.google.com'
    image_convert_settings = convert.ImageConvertSettings(
        img_format='png', width=100, height=100)

    output_image = parallelize.get_and_convert_image(
        testfile_path, image_convert_settings)

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

    output_images = parallelize.get_and_convert_images_parallel(
        testfile_locations, image_convert_settings, verbose=1)

    resulting_image_sizes = []
    for image in output_images:
      resulting_image_sizes.append(image.size)

    self.assertSameElements(resulting_image_sizes, expected_output_image_sizes)

  def testParallelizeConvertWithFailures(self):
    # 4 images are attempted, with one failure.
    testfile_path = os.path.join(self.testdata_dir,
                                 'Googleplex-Patio-Aug-2014.JPG')
    bad_testfile_path = os.path.join(self.testdata_dir,
                                     'attributions.txt')
    testfile_locations = [testfile_path, testfile_path, bad_testfile_path]
    expected_output_image_size = (100, 100)

    image_convert_settings = convert.ImageConvertSettings(
        img_format='png', width=100, height=100)

    output_images = parallelize.get_and_convert_images_parallel(
        testfile_locations, image_convert_settings, verbose=1)

    self.assertSameElements(output_images[0].size, expected_output_image_size)
    self.assertSameElements(output_images[1].size, expected_output_image_size)
    self.assertEqual(output_images[2], None)


if __name__ == '__main__':
  absltest.main()
