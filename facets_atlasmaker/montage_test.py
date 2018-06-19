"""Unit tests for montaging images to create sprite atlases."""
from absl.testing import absltest
from PIL import Image
from PIL import ImageColor
import montage


class SpriteAtlasGeneratorTests(absltest.TestCase):

  def setUp(self):
    # Color settings used to verifying image output is correct
    self.red_rgb = ImageColor.getrgb('red')
    self.blue_rgb = ImageColor.getrgb('blue')
    self.orange_rgb = ImageColor.getrgb('orange')
    self.green_rgb = ImageColor.getrgb('green')
    self.yellow_rgb = ImageColor.getrgb('yellow')

  def testAtlasGeneratorDifferentInputSizes(self):
    # Should raise error if image count does not match source path count.
    atlas_settings = montage.SpriteAtlasSettings(img_format='png')
    source_images = [Image.new('RGBA', (50, 30))] * 5
    source_paths = ['/some/path/file' + str(i) + '.jpg' for i in range(0, 4)]

    with self.assertRaises(ValueError):
      montage.SpriteAtlasGenerator(
          images=source_images, img_src_paths=source_paths,
          atlas_settings=atlas_settings)

  def testAtlasGeneratorDifferentImageSizes(self):
    # Should raise error if converted images are different sizes.
    atlas_settings = montage.SpriteAtlasSettings(img_format='png')
    source_images = [Image.new('RGBA', (50, 30)), Image.new('RGBA', (50, 30)),
                     Image.new('RGBA', (50, 30)), Image.new('RGBA', (50, 10))]
    source_paths = ['/some/path/file' + str(i) + '.jpg' for i in range(0, 4)]

    with self.assertRaises(ValueError):
      montage.SpriteAtlasGenerator(
          images=source_images, img_src_paths=source_paths,
          atlas_settings=atlas_settings)

  def testCreateAtlasIfNoSizeSpecified(self):
    # Verify that manifests and atlases contains single items.
    # and verify atlas size is correct.
    atlas_settings = montage.SpriteAtlasSettings(img_format='png')
    source_images = [Image.new('RGBA', (50, 30))] * 20
    source_paths = ['/some/path/file' + str(i) + '.jpg' for i in range(0, 20)]

    atlas_generator = montage.SpriteAtlasGenerator(
        images=source_images, img_src_paths=source_paths,
        atlas_settings=atlas_settings)
    atlases, manifests = atlas_generator.create_atlas()

    self.assertEqual(len(atlases), 1)
    self.assertEqual(atlases[0].size, (250, 150))
    self.assertEqual(len(manifests), 1)
    self.assertEqual(len(manifests[0]), 20)

  def testCreateAtlas(self):
    # Verify that atlas is correct based on sampling pixels and output size.
    atlas_settings = montage.SpriteAtlasSettings(img_format='png')
    source_paths = ['/some/path/file' + str(i) + '.jpg' for i in range(0, 4)]
    images = [
        Image.new('RGBA', (50, 50), self.orange_rgb),
        Image.new('RGBA', (50, 50), self.red_rgb),
        Image.new('RGBA', (50, 50), self.green_rgb),
        Image.new('RGBA', (50, 50), self.yellow_rgb)
    ]

    atlas_generator = montage.SpriteAtlasGenerator(
        images=images, img_src_paths=source_paths,
        atlas_settings=atlas_settings)
    atlases, manifests = atlas_generator.create_atlas()
    atlas = atlases[0]  # Only care about a single atlas
    del manifests

    self.assertEqual(atlas.size, (100, 100))
    # Verify pixels in corners of atlas.
    self.assertEqual(atlas.getpixel((0, 0))[0:3], self.orange_rgb)
    self.assertEqual(atlas.getpixel((99, 0))[0:3], self.red_rgb)
    self.assertEqual(atlas.getpixel((0, 99))[0:3], self.green_rgb)
    self.assertEqual(atlas.getpixel((99, 99))[0:3], self.yellow_rgb)
    # Verify pixels in center of atlas
    self.assertEqual(atlas.getpixel((49, 49))[0:3], self.orange_rgb)
    self.assertEqual(atlas.getpixel((50, 49))[0:3], self.red_rgb)
    self.assertEqual(atlas.getpixel((49, 50))[0:3], self.green_rgb)
    self.assertEqual(atlas.getpixel((50, 50))[0:3], self.yellow_rgb)

  def testCreateAtlasReturnsCorrectManifest(self):
    # Verify manifest contains correct data.
    atlas_settings = montage.SpriteAtlasSettings(img_format='png')
    source_images = [Image.new('RGBA', (50, 30))] * 4
    source_paths = ['/some/path/file' + str(i) + '.jpg' for i in range(0, 4)]
    expected_manifest = [
        {'source image': '/some/path/file0.jpg', 'offset_x': 0,
         'image_name': 'file0.jpg', 'offset_y': 0},
        {'source image': '/some/path/file1.jpg', 'offset_x': 50,
         'image_name': 'file1.jpg', 'offset_y': 0},
        {'source image': '/some/path/file2.jpg', 'offset_x': 0,
         'image_name': 'file2.jpg', 'offset_y': 30},
        {'source image': '/some/path/file3.jpg', 'offset_x': 50,
         'image_name': 'file3.jpg', 'offset_y': 30}]

    atlas_generator = montage.SpriteAtlasGenerator(
        images=source_images, img_src_paths=source_paths,
        atlas_settings=atlas_settings)
    atlases, manifests = atlas_generator.create_atlas()
    del atlases  # linter

    self.assertEqual(manifests[0], expected_manifest)


if __name__ == '__main__':
  absltest.main()