import unittest
from ingestion import parser

class TestParser(unittest.TestCase):
    def test_geojson(self):
        # TODO: Add a sample GeoJSON file and test parsing for all features (zones, roads, services, buildings, architectures, parks, water bodies, other features)
        pass
    def test_dxf(self):
        # TODO: Add a sample DXF file and test parsing for all features
        pass
    def test_json(self):
        # TODO: Add a sample JSON file and test parsing for all features
        pass
    def test_zip(self):
        # TODO: Add a sample ZIP file and test parsing for all features
        pass
    def test_image(self):
        # Test parsing the generated sample blueprint image
        result = parser.parse_file('tests/sample_blueprint.png')
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
        result = parser.parse_file('tests/sample_gis.geojson')
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
        result = parser.parse_file('tests/ghy.geojson')
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
