"""Main function for sprite atlas maker command line utility."""

from __future__ import absolute_import
from __future__ import division
from __future__ import print_function

import os
from absl import app
from absl import flags
from absl import logging
from PIL import ImageColor
import atlasmaker_io
import convert
import montage
import parallelize


# DEFAULT settings
_DEFAULT_COLOR_RGB = [255, 255, 255]

FLAGS = flags.FLAGS
flags.DEFINE_integer('max_failures', None,
                     'Max number of images that can fail retrieval and '
                     'conversion before atlasmaker aborts.')
flags.DEFINE_string('sourcelist', None,
                    'Full path to csv file that lists source images. Each line '
                    'should contain the path to an image.')
flags.DEFINE_enum('sourcelist_dups_handling', 'ignore',
                  ['ignore', 'fail', 'unique'],
                  'What action to take if duplicate image locations are found '
                  'in the source list.')
flags.DEFINE_string('default_error_image',
                    None,
                    'Path to image that should be used if desired image fails '
                    'retrieval or conversion. If specified, we require '
                    'successfully processing of this default image before '
                    'any other operations can proceed.')
flags.DEFINE_string('output_dir', None,
                    'Output location where final sprite atlas and manifest '
                    'will be written. If not specified, it will write to the '
                    'existing directory. If directory doesn\'t exist, will '
                    'attempt to create it.')
flags.DEFINE_integer('http_request_timeout', 60,
                     'Timeout in seconds that we will wait to fetch http '
                     'image requests. See the requests library documentation '
                     'for more details.')
flags.DEFINE_integer('http_max_retries', 2,
                     'Max number of times we will retry to fetch an image for '
                     'timeout errors, and only timeout errors.')


# Atlas settings
flags.DEFINE_integer('atlas_width', None,
                     'Desired width for each atlas (number of images).')
flags.DEFINE_integer('atlas_height', None,
                     'Desired height for each atlas (number of images).')

# Default image
flags.DEFINE_string('default_image_path', None,
                    'Default image to use if unable to retrieve image. '
                    'If not specified, we\'ll use the specified background '
                    'color and opacity')

# Image settings
flags.DEFINE_string('image_format', 'png',
                    'Desired image output format. For a list of fully '
                    'supported formats, see '
                    'http://pillow.readthedocs.io/en/latest/handbook/'
                    'image-file-formats.html#fully-supported-formats')
flags.DEFINE_bool('keep_aspect_ratio', True, 'Whether to retain aspect ratio '
                                             'of original image')
flags.DEFINE_integer('image_width', None,
                     'Desired output width for each image (in pixels).')
flags.DEFINE_integer('image_height', None,
                     'Desired output height for each image (in pixels).')
flags.DEFINE_integer('image_opacity', 0,
                     'Desired opacity to use for background (0 to 255).')
flags.DEFINE_bool('resize_if_larger', False,
                  'Resize image larger if desired size is larger than source '
                  'image')
flags.DEFINE_bool('use_truncated_images', False,
                  'If true, PIL will attempt to load and process truncated '
                  'images')

flags.mark_flag_as_required('output_dir')
flags.mark_flag_as_required('image_width')
flags.mark_flag_as_required('image_height')

# Background and default image color settings
flags.DEFINE_list('bg_color_rgb', _DEFAULT_COLOR_RGB,
                  'This is one of two ways to specify the desired background '
                  'color that will be used to fill in empty space after image '
                  'resizing (as well as the default image upon failure to get '
                  'or convert an image if no an default image is explicitly '
                  'specified. Default color is transparent (RGB (0,0,0).')
flags.DEFINE_string('bg_color_name', None,
                    'If specified, will attempt to set the color RGB values '
                    'based on this name instead of using RGB values. See the '
                    'PIL ColorModule documentation for more details. '
                    'This is one of two ways to specify the desired background '
                    'color that will be used to fill in empty space after image '
                    'resizing (as well as the default image upon failure to get '
                    'or convert an image if no an default image is explicitly '
                    'specified. Default color is transparent (RGB (0,0,0).')

# Parallelization settings
flags.DEFINE_integer('num_parallel_jobs', -1,
                     'Number of threads to parallelize with. If -1, will '
                     'autoset to number of CPUs.')
flags.DEFINE_integer('parallelization_verbosity', 10,
                     'Verbosity level for parallel. See joblib.Parallel '
                     'documentation.')


def _determine_bg_rgb():
  """Helper method that returns background color RGB."""
  if FLAGS.bg_color_name is not None:
    return ImageColor.getrgb(FLAGS.bg_color_name)
  return tuple(FLAGS.bg_color_rgb)


def main(argv):
  del argv  # Unused.
  # TODO: Add more flag validations.
  if FLAGS.max_failures is not None and FLAGS.max_failures > 0:
    raise NotImplementedError(
        'Does not yet handle image retrieval/conversion '
        'failures')

  if FLAGS.atlas_width is not None or FLAGS.atlas_height is not None:
    raise NotImplementedError(
        'Does not yet support specifying an atlas size.')

  if FLAGS.sourcelist is None:
    raise flags.ValidationError('You must specify a list of image sources.')

  bg_color_rgb = _determine_bg_rgb()

  outputdir = FLAGS.output_dir
  if outputdir is None:
    outputdir = os.path.join(os.getcwd())

  image_source_list = atlasmaker_io.read_src_list_csvfile(
      FLAGS.sourcelist, FLAGS.sourcelist_dups_handling)

  # Provide some useful confirmation info about settings to user.
  logging.info('Desired output size in pixels width, height for each image is: '
               '(%d, %d)' % (FLAGS.image_width, FLAGS.image_height))
  logging.info('Image format for Atlas is: %s' % FLAGS.image_format)
  logging.info('Background RGB is set to %s' % str(bg_color_rgb))
  logging.info('Background opacity is set to %d' % FLAGS.image_opacity)
  logging.info('Should we preserve image aspect ratio during conversion? %s'
               % FLAGS.keep_aspect_ratio)

  image_convert_settings = convert.ImageConvertSettings(
      img_format=FLAGS.image_format, width=FLAGS.image_width,
      height=FLAGS.image_height, bg_color_rgb=bg_color_rgb,
      opacity=FLAGS.image_opacity,
      preserve_aspect_ratio=FLAGS.keep_aspect_ratio,
      resize_if_larger=FLAGS.resize_if_larger)

  # Ensure we can write to the output dir or fail fast.
  atlasmaker_io.create_output_dir_if_not_exist(FLAGS.output_dir)

  # Create default image to be used for images that we can't get or convert.
  if FLAGS.default_image_path is not None:
    logging.info('Using image %s as default image when a specified image '
                 'can\'t be fetched or converted' % FLAGS.default_image_path)
    default_img = parallelize.convert_default_image(
        FLAGS.default_image_path, image_convert_settings)
  else:
    logging.info('No default image for failures specified by user, so just '
                 'using the background as the default image.')
    default_img = convert.create_default_image(image_convert_settings)

  # Verify we can write the specified output format, or fail fast.
  try:
    testimage_file_name = '{}.{}'.format('testimage',
                                         str(FLAGS.image_format).lower())
    atlasmaker_io.save_image(
        default_img, os.path.join(FLAGS.output_dir, testimage_file_name),
        delete_after_write=True)
    logging.info('Confirmed we can output images in %s format' %
                 FLAGS.image_format)
  except:
    logging.error('Unable to write test image in desired output format. '
                  'Please confirm that \'%s\' is a supported PIL output '
                  'format.' % FLAGS.image_format)
    raise

  # Convert images in parallel.
  logging.info('Scheduling %d tasks.' % len(image_source_list))
  converted_images_with_statuses = parallelize.get_and_convert_images_parallel(
      image_source_list, image_convert_settings,
      n_jobs=FLAGS.num_parallel_jobs, verbose=FLAGS.parallelization_verbosity,
      allow_truncated_images=FLAGS.use_truncated_images,
      request_timeout=FLAGS.http_request_timeout,
      http_max_retries=FLAGS.http_max_retries)

  sprite_atlas_settings = montage.SpriteAtlasSettings(
      img_format=FLAGS.image_format, height=FLAGS.atlas_height,
      width=FLAGS.atlas_width)

  # Generate the atlas from converted images.
  sprite_atlas_generator = montage.SpriteAtlasGenerator(
      images_with_statuses=converted_images_with_statuses,
      img_src_paths=image_source_list,
      atlas_settings=sprite_atlas_settings, default_img=default_img)

  atlases, manifests = sprite_atlas_generator.create_atlas()

  atlasmaker_io.save_atlas_and_manifests(
      outdir=outputdir, atlases=atlases, manifests=manifests,
      sprite_atlas_settings=sprite_atlas_settings)


if __name__ == '__main__':
  app.run(main)
