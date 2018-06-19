"""Unit tests for IO utilities."""
import os
from absl.testing import absltest
import atlasmaker_io

TESTDATA_DIR = 'testdata'


class AtlasmakerIOTests(absltest.TestCase):

  def setUp(self):
    self.testdata_dir = os.path.join(os.getcwd(), TESTDATA_DIR)

  def testReadSrcListCsvfile(self):
    expected = ['https://www.wikipedia/image1.png',
                'http://www.wordpress/testimage1.png',
                'http://www.npr.org/myimageA.jpg']
    testfile = os.path.join(self.testdata_dir, 'testfiles_smalllist.csv')

    self.assertSameElements(atlasmaker_io.read_src_list_csvfile(testfile),
                            expected)

  def testGetImageFromLocalFile(self):
    testfile = os.path.join(self.testdata_dir, 'Googleplex-Patio-Aug-2014.JPG')
    image = atlasmaker_io.get_image(testfile)
    self.assertEqual(image.size, (3264, 2448))

  def testGetImageFromUrl(self):
    # TODO: Add test.
    pass


if __name__ == '__main__':
  absltest.main()
