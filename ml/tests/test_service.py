"""
Test Suite for FastAPI Footfall Inference Service.
Verifies endpoints: /health, /metadata, /predict, and /predict/batch.
"""

import unittest
from fastapi.testclient import TestClient
from ml.src.service import app

class TestInferenceService(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_01_health_endpoint(self):
        res = self.client.get("/health")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "ok")
        self.assertTrue(data["model_loaded"])
        self.assertIn("model_version", data)

    def test_02_metadata_endpoint(self):
        res = self.client.get("/metadata")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("metadata", data)
        self.assertIn("metrics", data)
        self.assertIn("feature_columns", data["metadata"])

    def test_03_predict_endpoint_valid_day(self):
        payload = {
            "monument_id": "M001",
            "target_date": "2025-01-15",
            "temperature_avg_c": 18.0,
            "weather_condition": "Clear",
            "visitors_previous_day": 3000.0,
            "rolling_7_day_average": 2950.0
        }
        res = self.client.post("/predict", json=payload)
        self.assertEqual(res.status_code, 200)
        body = res.json()
        self.assertTrue(body["success"])
        pred_data = body["data"]
        self.assertEqual(pred_data["monumentId"], "M001")
        self.assertGreater(pred_data["predictedVisitorCount"], 0)
        self.assertIn("evaluationMetrics", pred_data)
        self.assertEqual(pred_data["evaluationMetrics"]["mae"], 185.32)

    def test_04_predict_endpoint_scheduled_closure(self):
        # 2025-01-17 is a Friday; Taj Mahal (M001) is scheduled closed on Fridays
        payload = {
            "monument_id": "M001",
            "target_date": "2025-01-17"
        }
        res = self.client.post("/predict", json=payload)
        self.assertEqual(res.status_code, 200)
        body = res.json()
        self.assertEqual(body["data"]["predictedVisitorCount"], 0)

    def test_05_predict_endpoint_invalid_date(self):
        payload = {
            "monument_id": "M001",
            "target_date": "invalid-date-format"
        }
        res = self.client.post("/predict", json=payload)
        self.assertEqual(res.status_code, 400)
        self.assertIn("Invalid date format", res.json()["detail"])

    def test_06_batch_prediction_endpoint(self):
        payload = {
            "requests": [
                {"monument_id": "M001", "target_date": "2025-01-15"},
                {"monument_id": "M002", "target_date": "2025-01-15"},
                {"monument_id": "M003", "target_date": "2025-01-15"}
            ]
        }
        res = self.client.post("/predict/batch", json=payload)
        self.assertEqual(res.status_code, 200)
        body = res.json()
        self.assertTrue(body["success"])
        self.assertEqual(len(body["data"]), 3)

if __name__ == "__main__":
    unittest.main()
