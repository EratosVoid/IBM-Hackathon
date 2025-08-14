import unittest
from parser.ingestion import parser

class TestParser(unittest.TestCase):
    def test_geojson(self):
        result = parser.parse_file('parser/tests/dummy.geojson')
        self.assertIsInstance(result, dict)
        for key in [
            'zones', 'roads', 'services', 'buildings', 'architectures', 'parks', 'water_bodies', 'other_features']:
            self.assertIn(key, result)

    def test_dxf(self):
        result = parser.parse_file('parser/tests/dummy.dxf')
        self.assertIsInstance(result, dict)
        for key in [
            'zones', 'roads', 'services', 'buildings', 'architectures', 'parks', 'water_bodies', 'other_features']:
            self.assertIn(key, result)

    def test_json(self):
        result = parser.parse_file('parser/tests/dummy.json')
        self.assertIsInstance(result, dict)
        for key in [
            'zones', 'roads', 'services', 'buildings', 'architectures', 'parks', 'water_bodies', 'other_features']:
            self.assertIn(key, result)

    def test_zip(self):
        result = parser.parse_file('parser/tests/dummy.zip')
        self.assertIsInstance(result, dict)
        for key in [
            'zones', 'roads', 'services', 'buildings', 'architectures', 'parks', 'water_bodies', 'other_features']:
            self.assertIn(key, result)

    def test_def(self):
        result = parser.parse_file('parser/tests/dummy.def')
        self.assertIsInstance(result, dict)
        for key in [
            'zones', 'roads', 'services', 'buildings', 'architectures', 'parks', 'water_bodies', 'other_features']:
            self.assertIn(key, result)

    def test_png(self):
        result = parser.parse_file('parser/tests/dummy.png')
        self.assertIsInstance(result, dict)
        for key in [
            'zones', 'roads', 'services', 'buildings', 'architectures', 'parks', 'water_bodies', 'other_features']:
            self.assertIn(key, result)

    def test_jpg(self):
        result = parser.parse_file('parser/tests/dummy.jpg')
        self.assertIsInstance(result, dict)
        for key in [
            'zones', 'roads', 'services', 'buildings', 'architectures', 'parks', 'water_bodies', 'other_features']:
            self.assertIn(key, result)

    def test_jpeg(self):
        result = parser.parse_file('parser/tests/dummy.jpeg')
        self.assertIsInstance(result, dict)
        for key in [
            'zones', 'roads', 'services', 'buildings', 'architectures', 'parks', 'water_bodies', 'other_features']:
            self.assertIn(key, result)

    def test_bmp(self):
        result = parser.parse_file('parser/tests/dummy.bmp')
        self.assertIsInstance(result, dict)
        for key in [
            'zones', 'roads', 'services', 'buildings', 'architectures', 'parks', 'water_bodies', 'other_features']:
            self.assertIn(key, result)

    def test_tiff(self):
        result = parser.parse_file('parser/tests/dummy.tiff')
        self.assertIsInstance(result, dict)
        for key in [
            'zones', 'roads', 'services', 'buildings', 'architectures', 'parks', 'water_bodies', 'other_features']:
            self.assertIn(key, result)

    def test_pdf(self):
        result = parser.parse_file('parser/tests/dummy.pdf')
        self.assertIsInstance(result, dict)
        for key in [
            'zones', 'roads', 'services', 'buildings', 'architectures', 'parks', 'water_bodies', 'other_features']:
            self.assertIn(key, result)
    def test_image(self):
        # Test parsing the generated sample blueprint image
        result = parser.parse_file('parser/tests/sample_blueprint.png')
        self.assertIsInstance(result, dict)
        self.assertIn('buildings', result)
        self.assertIn('roads', result)
        self.assertIn('parks', result)
        # Since detection is a placeholder, expect empty lists
        self.assertEqual(result['buildings'], [])
        self.assertEqual(result['roads'], [])
        self.assertEqual(result['parks'], [])

    def test_gis_geojson(self):
        # Test parsing the provided sample_gis.geojson file
        result = parser.parse_file('parser/tests/sample_gis.geojson')
        self.assertIsInstance(result, dict)
        self.assertIn('zones', result)
        self.assertIn('roads', result)
        self.assertIn('parks', result)
        self.assertIn('water_bodies', result)
        # Optionally check that at least one feature is present in each
        # (This will depend on your normalization logic)
        # Example:
        # self.assertGreaterEqual(len(result['zones']), 1)
        # self.assertGreaterEqual(len(result['roads']), 1)
        # self.assertGreaterEqual(len(result['parks']), 1)
        # self.assertGreaterEqual(len(result['water_bodies']), 1)

    def test_ghy_geojson(self):
        # Test parsing the ghy.geojson file
        result = parser.parse_file('parser/tests/ghy.geojson')
        self.assertIsInstance(result, dict)
        # Check for common keys
        self.assertIn('zones', result)
        self.assertIn('roads', result)
        self.assertIn('parks', result)
        self.assertIn('water_bodies', result)
        # Optionally print or check feature counts
        # print(result)

if __name__ == "__main__":
    unittest.main()
