"""
Test Suite for Heritage Monument Footfall ML Training Module.
Verifies all 10 mandated requirements:
1. Chronological splitting
2. Absence of train/test date overlap
3. Leakage-safe lag feature generation
4. Leakage-safe rolling feature generation
5. Preprocessing fit only on training data
6. Model training
7. Prediction output length
8. Metric calculation (including zero-safe MAPE)
9. Model saving and loading
10. Future-format inference input
"""

import os
import tempfile
import unittest
import numpy as np
import pandas as pd
import joblib

from ml.src.config import load_config
from ml.src.validation import (
    validate_raw_dataset,
    validate_future_features,
    validate_splits,
    validate_inference_features,
    validate_saved_model,
    DataValidationError
)
from ml.src.features import (
    prepare_features,
    build_preprocessing_pipeline,
    split_chronologically
)
from ml.src.models import BaselineModel, create_proposed_model
from ml.src.evaluate import safe_mape, calculate_metrics
from sklearn.pipeline import Pipeline

class TestTrainingPipeline(unittest.TestCase):

    def setUp(self):
        # Create a deterministic synthetic fixture
        dates = pd.date_range("2024-01-01", periods=30, freq="D")
        rows = []
        for m_id in ["M001", "M002"]:
            for d in dates:
                dow = d.dayofweek
                is_open = 0 if (m_id == "M001" and dow == 4) else 1
                visitors = 0 if is_open == 0 else int(1000 + 50 * d.day + (200 if dow in (5, 6) else 0))
                rows.append({
                    "record_id": f"REC_{m_id}_{d.strftime('%Y%m%d')}",
                    "monument_id": m_id,
                    "monument_name": "Monument " + m_id,
                    "state": "StateA",
                    "city": "CityA",
                    "monument_type": "Fort",
                    "date": d.strftime("%Y-%m-%d"),
                    "year": d.year,
                    "month": d.month,
                    "day_of_week": dow,
                    "is_weekend": 1 if dow in (5, 6) else 0,
                    "is_public_holiday": 0,
                    "holiday_name": "None",
                    "festival_name": "None",
                    "festival_importance": "None",
                    "school_holiday": 0,
                    "daily_capacity": 3000,
                    "is_open": is_open,
                    "maintenance_or_closure": 0 if is_open == 1 else 1,
                    "temperature_avg_c": 25.0,
                    "rainfall_mm": 0.0,
                    "weather_condition": "Clear",
                    "total_visitors": visitors,
                    "data_status": "validated"
                })
        self.sample_df = pd.DataFrame(rows)

        self.cat_cols = ["monument_id", "state", "city", "monument_type", "festival_importance", "weather_condition"]
        self.num_cols = [
            "year", "month", "day_of_week", "is_weekend", "is_public_holiday",
            "school_holiday", "daily_capacity", "is_open", "maintenance_or_closure",
            "temperature_avg_c", "rainfall_mm", "visitors_previous_day", "rolling_7_day_average"
        ]
        self.feature_cols = self.cat_cols + self.num_cols

    # 1. Chronological splitting test
    def test_01_chronological_splitting(self):
        processed, _ = prepare_features(self.sample_df, drop_warmup=True)
        split_cutoff = "2024-01-20"
        train_df, test_df = split_chronologically(processed, date_column="date", split_date=split_cutoff)

        self.assertGreater(len(train_df), 0, "Train split should not be empty")
        self.assertGreater(len(test_df), 0, "Test split should not be empty")
        self.assertTrue((train_df["date"] < pd.to_datetime(split_cutoff)).all())
        self.assertTrue((test_df["date"] >= pd.to_datetime(split_cutoff)).all())

    # 2. Absence of train/test date overlap test
    def test_02_absence_of_train_test_date_overlap(self):
        processed, _ = prepare_features(self.sample_df, drop_warmup=True)
        train_df, test_df = split_chronologically(processed, split_date="2024-01-20")

        # Must pass validation without raising
        validate_splits(train_df, test_df, date_column="date")
        self.assertLess(train_df["date"].max(), test_df["date"].min())

        # Must fail when deliberate overlap is introduced
        overlapping_test = pd.concat([test_df, train_df.tail(2)])
        with self.assertRaises(DataValidationError):
            validate_splits(train_df, overlapping_test, date_column="date")

    # 3. Leakage-safe lag feature generation test
    def test_03_leakage_safe_lag_feature_generation(self):
        processed, _ = prepare_features(self.sample_df, drop_warmup=False)
        m1 = processed[processed["monument_id"] == "M001"].sort_values("date").reset_index(drop=True)

        # Day 0 should have NaN lag
        self.assertTrue(pd.isna(m1.loc[0, "visitors_previous_day"]))

        # For every subsequent day t, visitors_previous_day MUST strictly equal actual visitors at t-1
        for t in range(1, len(m1)):
            expected_lag = m1.loc[t - 1, "total_visitors"]
            actual_lag = m1.loc[t, "visitors_previous_day"]
            self.assertEqual(expected_lag, actual_lag)

        # Verify that changing total_visitors at day t does NOT alter lag at day t
        original_lag = m1.loc[5, "visitors_previous_day"]
        modified_df = m1.copy()
        modified_df.loc[5, "total_visitors"] = 999999
        reprocessed, _ = prepare_features(modified_df, drop_warmup=False)
        self.assertEqual(reprocessed.loc[5, "visitors_previous_day"], original_lag)

    # 4. Leakage-safe rolling feature generation test
    def test_04_leakage_safe_rolling_feature_generation(self):
        processed, _ = prepare_features(self.sample_df, drop_warmup=False)
        m1 = processed[processed["monument_id"] == "M001"].sort_values("date").reset_index(drop=True)

        # For day index 7, rolling_7_day_average must be the average of days 0 through 6
        expected_rolling = m1.loc[0:6, "total_visitors"].mean()
        actual_rolling = m1.loc[7, "rolling_7_day_average"]
        self.assertAlmostEqual(expected_rolling, actual_rolling, places=4)

        # Ensure current day target is strictly excluded from rolling average
        current_target = m1.loc[7, "total_visitors"]
        # If current target were included, average would differ
        rolling_with_current = m1.loc[1:7, "total_visitors"].mean()
        if current_target != m1.loc[0, "total_visitors"]:
            self.assertNotAlmostEqual(actual_rolling, rolling_with_current, places=2)

    # 5. Preprocessing fit only on training data test
    def test_05_preprocessing_fit_only_on_training_data(self):
        processed, _ = prepare_features(self.sample_df, drop_warmup=True)
        train_df, test_df = split_chronologically(processed, split_date="2024-01-20")

        X_train = train_df[self.feature_cols]
        X_test = test_df[self.feature_cols]

        preprocessor = build_preprocessing_pipeline(self.cat_cols, self.num_cols)
        preprocessor.fit(X_train)

        # Extract numerical scaler parameters fitted on training data
        scaler = preprocessor.named_transformers_["num"].named_steps["scaler"]
        train_mean = scaler.mean_.copy()

        # Transform test data without updating scaler
        _ = preprocessor.transform(X_test)
        self.assertTrue(np.array_equal(scaler.mean_, train_mean), "Scaler mean must remain identical after test transform")

    # 6. Model training test
    def test_06_model_training(self):
        processed, _ = prepare_features(self.sample_df, drop_warmup=True)
        train_df, _ = split_chronologically(processed, split_date="2024-01-20")

        X_train = train_df[self.feature_cols]
        y_train = train_df["total_visitors"]

        preprocessor = build_preprocessing_pipeline(self.cat_cols, self.num_cols)
        regressor = create_proposed_model("HistGradientBoostingRegressor", {"max_iter": 10}, random_state=42)

        pipeline = Pipeline([("prep", preprocessor), ("model", regressor)])
        pipeline.fit(X_train, y_train)

        self.assertTrue(hasattr(pipeline.named_steps["model"], "is_fitted_") or hasattr(pipeline.named_steps["model"], "_is_fitted"))

    # 7. Prediction output length test
    def test_07_prediction_output_length(self):
        processed, _ = prepare_features(self.sample_df, drop_warmup=True)
        train_df, test_df = split_chronologically(processed, split_date="2024-01-20")

        X_train = train_df[self.feature_cols]
        y_train = train_df["total_visitors"]
        X_test = test_df[self.feature_cols]

        preprocessor = build_preprocessing_pipeline(self.cat_cols, self.num_cols)
        regressor = create_proposed_model("HistGradientBoostingRegressor", {"max_iter": 10}, random_state=42)
        pipeline = Pipeline([("prep", preprocessor), ("model", regressor)])
        pipeline.fit(X_train, y_train)

        preds = pipeline.predict(X_test)
        self.assertEqual(len(preds), len(X_test))

        baseline = BaselineModel(model_type="previous_day")
        baseline.fit(X_train, y_train)
        b_preds = baseline.predict(X_test)
        self.assertEqual(len(b_preds), len(X_test))

    # 8. Metric calculation test (including safe MAPE)
    def test_08_metric_calculation(self):
        y_true = np.array([100.0, 200.0, 0.0, 400.0])
        y_pred = np.array([110.0, 190.0, 10.0, 400.0])

        metrics = calculate_metrics(y_true, y_pred)
        self.assertIn("MAE", metrics)
        self.assertIn("RMSE", metrics)
        self.assertIn("MAPE", metrics)
        self.assertIn("evaluated_observations", metrics)
        self.assertEqual(metrics["evaluated_observations"], 4)

        # Ensure safe MAPE handles zero denominator without crashing or returning inf
        mape_val = safe_mape(y_true, y_pred)
        self.assertFalse(np.isinf(mape_val))
        self.assertFalse(np.isnan(mape_val))
        # Nonzero elements are 100, 200, 400 with errors 10, 10, 0 -> pcts: 10%, 5%, 0% -> mean = 5.0%
        self.assertAlmostEqual(mape_val, 5.0, places=1)

    # 9. Model saving and loading test
    def test_09_model_saving_and_loading(self):
        processed, _ = prepare_features(self.sample_df, drop_warmup=True)
        train_df, test_df = split_chronologically(processed, split_date="2024-01-20")

        X_train = train_df[self.feature_cols]
        y_train = train_df["total_visitors"]
        X_test = test_df[self.feature_cols]

        preprocessor = build_preprocessing_pipeline(self.cat_cols, self.num_cols)
        regressor = create_proposed_model("HistGradientBoostingRegressor", {"max_iter": 10}, random_state=42)
        pipeline = Pipeline([("prep", preprocessor), ("model", regressor)])
        pipeline.fit(X_train, y_train)

        preds_before = pipeline.predict(X_test)

        with tempfile.TemporaryDirectory() as tmp_dir:
            model_file = os.path.join(tmp_dir, "test_model.joblib")
            joblib.dump(pipeline, model_file)

            validate_saved_model(model_file)
            loaded_pipeline = joblib.load(model_file)
            preds_after = loaded_pipeline.predict(X_test)

            np.testing.assert_allclose(preds_before, preds_after, rtol=1e-5)

    # 10. Future-format inference input test
    def test_10_future_format_inference_input(self):
        processed, _ = prepare_features(self.sample_df, drop_warmup=True)
        train_df, _ = split_chronologically(processed, split_date="2024-01-20")

        X_train = train_df[self.feature_cols]
        y_train = train_df["total_visitors"]

        preprocessor = build_preprocessing_pipeline(self.cat_cols, self.num_cols)
        regressor = create_proposed_model("HistGradientBoostingRegressor", {"max_iter": 10}, random_state=42)
        pipeline = Pipeline([("prep", preprocessor), ("model", regressor)])
        pipeline.fit(X_train, y_train)

        # Simulate tomorrow's inference payload
        tomorrow_row = pd.DataFrame([{
            "monument_id": "M001",
            "state": "StateA",
            "city": "CityA",
            "monument_type": "Fort",
            "festival_importance": "None",
            "weather_condition": "Clear",
            "year": 2024,
            "month": 2,
            "day_of_week": 2,
            "is_weekend": 0,
            "is_public_holiday": 0,
            "school_holiday": 0,
            "daily_capacity": 3000,
            "is_open": 1,
            "maintenance_or_closure": 0,
            "temperature_avg_c": 24.5,
            "rainfall_mm": 0.0,
            "visitors_previous_day": 1250.0,
            "rolling_7_day_average": 1180.0
        }])

        # Valid feature check
        validate_inference_features(tomorrow_row, self.feature_cols)

        pred = pipeline.predict(tomorrow_row[self.feature_cols])
        self.assertEqual(len(pred), 1)
        self.assertGreaterEqual(pred[0], 0.0)

        # Missing feature check must fail
        incomplete_row = tomorrow_row.drop(columns=["visitors_previous_day"])
        with self.assertRaises(DataValidationError):
            validate_inference_features(incomplete_row, self.feature_cols)

if __name__ == "__main__":
    unittest.main()
