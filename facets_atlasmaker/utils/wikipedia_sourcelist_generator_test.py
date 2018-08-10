"""Unit tests for Wikipedia Sourcelist Generator."""
from absl import flags
from absl.testing import absltest
from absl.testing import flagsaver
import wikipedia_sourcelist_generator as scraper


FLAGS = flags.FLAGS

class WikipediaSourcelistGeneratorTests(absltest.TestCase):
  def testChunkPageIds(self):
    results = scraper._chunk_page_ids([1, 2, 3, 4, 5, 6, 7], chunk_size=3)
    self.assertSameElements(results,
                              [[1, 2, 3], [4, 5, 6], [7]])

  def testChunkPageIdsEmptyList(self):
    results = scraper._chunk_page_ids([], chunk_size=3)
    self.assertEqual(results, [])


if __name__ == '__main__':
  # Pass flags to pass initial required flags check.
  FLAGS.num_images = 10
  FLAGS.outputdir = 'somedir'
  absltest.main()
