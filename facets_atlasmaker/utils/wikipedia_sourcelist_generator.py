"""Script that grabs URLs of the desired N featured images from wikipedia.

This list can then be used as a test input to Atlasmaker.

Alternately, you can also specify images from a different category.
"""
import csv
import os
from absl import app
from absl import flags
from absl import logging
import requests


BASE_API_URL = 'https://commons.wikimedia.org/w/api.php'

FLAGS = flags.FLAGS
flags.DEFINE_integer('num_images', None,
                     'Number of image URLs you want to retrieve from '
                     'Wikipedia\'s featured images category.')
flags.DEFINE_string('outputdir', None,
                    'Output directory where CSV will be written.')
flags.DEFINE_string('category', 'Featured pictures on Wikimedia Commons',
                    'Wikipedia category name.')
flags.DEFINE_string('filename', 'wikipedia_images_list.csv',
                    'Name of output csv file')

flags.mark_flag_as_required('num_images')
flags.mark_flag_as_required('outputdir')


def _get_pageids_for_category(category, limit=500, cmcontinue=None):
  """Returns a list of pageids for a specified category.

  See API docs: https://www.mediawiki.org/wiki/API:Categorymembers

  Args:
    category: Is the wikipedia category name as a string.
    limit: max number of pageids returned in response. Wikipedia by default
           limits us to 500.
    cmcontinue: continue hash used to request the next set of pages.

  Returns:
    List of pageids.
  """
  # Replace any whitespaces with underscores per wikipedia's URL patterns.
  category_url_param = 'Category:%s' % str(category).replace(' ', '_')

  # Set query params.
  payload = {'action': 'query', 'list': 'categorymembers', 'cmprop': 'ids',
             'cmlimit': limit, 'cmtype': 'file', 'cmtitle': category_url_param,
             'format': 'json'}
  if cmcontinue is not None:
    payload['cmcontinue'] = cmcontinue

  r = requests.get(BASE_API_URL, params=payload)
  logging.debug('Connecting to url: %s' % r.url)
  response_data = r.json()

  try:
    cmcontinue = response_data['continue']['cmcontinue']
  except KeyError:
    # Reached the end!
    cmcontinue = None


  pages_list = response_data['query']['categorymembers']
  pageids = []
  for element in pages_list:
    pageids.append(element['pageid'])
  return pageids, cmcontinue


def _get_image_urls_for_pageids(page_ids):
  """Return a list of image urls associated with the given page ids.

  Note that the limit per request by default via the API is 50.

  Args:
    pageids: List of wikipedia page ids.
  """
  # Concat page ids into a single string
  page_ids_concat = '|'.join([str(x) for x in page_ids])

  image_urls = []

  # Query params.
  payload = {'action': 'query', 'iiprop': 'url',
             'prop': 'imageinfo', 'format': 'json', 'pageids': page_ids_concat}
  r = requests.get(BASE_API_URL, params=payload)
  logging.debug('Connecting to url: %s' % r.url)
  response_data = r.json()

  try:
    pages_dict = response_data['query']['pages']
  except KeyError:
    raise KeyError('Unable to find the required elements when retrieving '
                   'image URLs from response. See message: %s'
                   % response_data)
  for pageid_key in pages_dict:
    images = pages_dict[pageid_key]['imageinfo']
    for imageinfo_obj in images:
      image_urls.append(imageinfo_obj['url'])

  return image_urls


def _chunk_page_ids(page_ids, chunk_size=50):
  """
  Returns a list of lists to limit page ids being queried to specified size.

  :param chunk_size:
  :param page_ids: List of pageids
  :return:
  """
  if not page_ids:
    return []

  page_id_chunks = []
  while len(page_ids) > chunk_size:
    page_id_chunks.append(page_ids[0:chunk_size])
    page_ids = page_ids[chunk_size:]
  page_id_chunks.append(page_ids)
  return page_id_chunks


def get_images_list(category, num_images_desired=100,
                    categories_pageids_request_limit=100,
                    images_pageids_request_limit=50):
  """

  :param category:
  :param num_images_desired: Max number of images desired for return.
  :param categories_pageids_request_limit:
  :param images_pageids_request_limit:
  :return:
  """
  pages_searched = 0
  image_urls = []

  pageids, cmcontinue = _get_pageids_for_category(
      category, categories_pageids_request_limit)
  logging.debug('Retrieved %d pageids from initial request.' % len(pageids))

  for chunk in _chunk_page_ids(pageids,
                               chunk_size=images_pageids_request_limit):
    pages_searched += len(chunk)
    image_urls.extend(_get_image_urls_for_pageids(chunk))
    logging.debug('Found a total of %d image urls.' % len(image_urls))

  if len(image_urls) > num_images_desired:
    logging.info('Traversed %d pages and returned the desired count of '
                 '%d image urls.' % (pages_searched, len(image_urls)))
    return image_urls[0:num_images_desired]

  while cmcontinue and len(image_urls) < num_images_desired:
    pageids, cmcontinue = _get_pageids_for_category(
        category, categories_pageids_request_limit, cmcontinue)
    for chunk in _chunk_page_ids(pageids,
                                 chunk_size=images_pageids_request_limit):
      pages_searched += len(chunk)
      image_urls.extend(_get_image_urls_for_pageids(chunk))
      if len(image_urls) >= num_images_desired:
        logging.info('Traversed %d pages and returned the desired count of '
                     '%d image urls.' % (pages_searched, len(image_urls)))
        return image_urls[0:num_images_desired]

  if len(image_urls) < num_images_desired:
    logging.info('Unable to get the desired number of urls. Traversed %d page '
                 'ids but only able to return %d URLs' %
                 (pages_searched, len(image_urls)))

  return image_urls


def write_to_csv(urls, outputfile):
  """

  :param urls: List of image urls
  :param outputfile: path to outputfile.
  :return:
  """
  with open(outputfile, 'w') as csvfile:
    csvwriter = csv.writer(csvfile)
    for url in urls:
      csvwriter.writerow([url])


def main(argv):
  del argv  # Unused.

  image_urls = get_images_list(FLAGS.category, FLAGS.num_images)
  write_to_csv(image_urls, os.path.join(FLAGS.outputdir, FLAGS.filename))


if __name__ == '__main__':
  app.run(main)
