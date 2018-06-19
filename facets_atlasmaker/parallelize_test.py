"""Tests for parallize."""
import os
from absl.testing import absltest
import parallelize
import convert

TESTDATA_DIR = 'testdata'


class ParallelizeTests(absltest.TestCase):

  def setUp(self):
    self.testdata_dir = os.path.join(os.getcwd(), TESTDATA_DIR)

  def testParallelizeConvertImagesFromLocalfile(self):
    # Test parallelization with multiple reads of the same image file produces
    # expected output images with correct sizes.
    testfile_path = os.path.join(self.testdata_dir,
                                 'Googleplex-Patio-Aug-2014.JPG')
    testfile_locations = [testfile_path] * 8
    expected_output_image_sizes = [(100, 100)] * 8
    image_convert_settings = convert.ImageConvertSettings(
        img_format='png', width=100, height=100)

    output_images = parallelize.get_and_convert_images_parallel(
        testfile_locations, image_convert_settings)

    resulting_image_sizes = []
    for image in output_images:
      resulting_image_sizes.append(image.size)

    self.assertSameElements(resulting_image_sizes, expected_output_image_sizes)


if __name__ == '__main__':
  absltest.main()
