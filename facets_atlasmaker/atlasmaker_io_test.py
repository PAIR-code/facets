"""Unit tests for IO utilities."""
import io
import os
import shutil
import mock
from absl.testing import absltest
from PIL import Image
import atlasmaker_io

TESTDATA_DIR = 'testdata'


class AtlasmakerIOTests(absltest.TestCase):

  def setUp(self):
    self.testdata_dir = os.path.join(os.getcwd(), TESTDATA_DIR)

  def testCreateOutputDir(self):
    # Verify we create a output dir when it doesn't exist.
    test_subdir = 'temptest'
    full_testdir_path = os.path.join(self.testdata_dir, test_subdir)

    try:
      # Ensure we are starting with a nonexistent dir.
      if os.path.isdir(full_testdir_path):
        shutil.rmtree(full_testdir_path)

      atlasmaker_io.create_output_dir_if_not_exist(full_testdir_path)

      self.assertEqual(os.path.isdir(full_testdir_path), True)
    except:
      raise
    finally:
      shutil.rmtree(os.path.join(self.testdata_dir, test_subdir),
                    ignore_errors=True)

  @mock.patch.object(atlasmaker_io, 'os')
  def testCreateOutputDirUnableToCreateDir(self, mock_os):
    # Should raise error when unable to create dir.
    test_subdir = 'temptest'
    full_testdir_path = os.path.join(self.testdata_dir, test_subdir)
    mock_os.path.isdir.return_value = False

    with mock.patch.object(mock_os, 'makedirs') as makedirs_mock:
      makedirs_mock.side_effect = OSError()
      with self.assertRaises(OSError):
        atlasmaker_io.create_output_dir_if_not_exist(full_testdir_path)

  @mock.patch.object(atlasmaker_io, 'os')
  def testCreateOutputDirFailsWrite(self, mock_os):
    # Should fail if testfile can't be written.
    test_subdir = 'temptest'
    full_testdir_path = os.path.join(self.testdata_dir, test_subdir)
    mock_os.path.isdir.return_value = True

    with mock.patch('__builtin__.open', mock.mock_open(read_data='data')):
      with open(full_testdir_path, 'w') as mockfile:
        mockfile.write.side_effect = IOError()
        with self.assertRaises(IOError):
          atlasmaker_io.create_output_dir_if_not_exist(full_testdir_path)

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

  @mock.patch.object(atlasmaker_io, 'requests')
  @mock.patch.object(atlasmaker_io, 'io')
  def testGetImageFromUrlHTTP(self, mock_io, mock_requests):
    # Simply verify we initiate a requests GET.
    image_url = 'http://some.url.com/image.jpg'
    orig_img = Image.new('RGBA', (200, 200))
    img_bytes = io.BytesIO()
    orig_img.save(img_bytes, format='png')

    mock_io.BytesIO.return_value = img_bytes

    output_img = atlasmaker_io.get_image(image_url, request_timeout=30)

    mock_requests.get.assert_called_with(image_url,
                                         stream=True, timeout=30)
    self.assertEqual(output_img.size, (200, 200))

  @mock.patch.object(atlasmaker_io, 'requests')
  @mock.patch.object(atlasmaker_io, 'io')
  def testGetImageFromUrlHTTPS(self, mock_io, mock_requests):
    # Simply verify we initiate a requests GET.
    image_url = 'https://some.url.com/image.jpg'
    orig_img = Image.new('RGBA', (200, 200))
    img_bytes = io.BytesIO()
    orig_img.save(img_bytes, format='png')

    mock_io.BytesIO.return_value = img_bytes

    output_img = atlasmaker_io.get_image(image_url, request_timeout=30)

    mock_requests.get.assert_called_with(image_url,
                                         stream=True, timeout=30)
    self.assertEqual(output_img.size, (200, 200))


if __name__ == '__main__':
  absltest.main()
