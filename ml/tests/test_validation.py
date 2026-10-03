"""
Test Suite for Validation Constraints and Fail-Fast Invariants.
Verifies all 9 failure conditions:
1. Fail if target column is missing.
2. Fail if all target values are missing.
3. Fail if dates cannot be parsed.
4. Fail if dataset contains duplicate monument-date records.
5. Fail if training split is empty.
6. Fail if test split is empty.
7. Fail if a future feature is detected.
8. Fail if feature columns differ between training and inference.
9. Fail if saved model cannot be loaded.
"""

import os
import unittest
import pandas as pd
import tempfile
import joblib

from ml.src.validation import (
    validate_raw_dataset,
    validate_future_features,
    validate_splits,
    validate_inference_features,
    validate_saved_model,
    DataValidationError
)

class TestValidationConstraints(unittest.TestCase):

    def setUp(self):
        self.valid_df = pd.DataFrame([
            {"monument_id": "M001", "date": "2024-01-01", "total_visitors": 100},
            {"monument_id": "M001", "date": "2024-01-02", "total_visitors": 150},
            {"monument_id": "M002", "date": "2024-01-01", "total_visitors": 200},
            {"monument_id": "M002", "date": "2024-01-02", "total_visitors": 250},
        ])

    def test_01_fail_if_target_column_missing(self):
        bad_df = self.valid_df.drop(columns=["total_visitors"])
        with self.assertRaises(DataValidationError) as ctx:
            validate_raw_dataset(bad_df, target_column="total_visitors")
        self.assertIn("missing", str(ctx.exception).lower())

    def test_02_fail_if_all_target_values_missing(self):
        bad_df = self.valid_df.copy()
        bad_df["total_visitors"] = None
        with self.assertRaises(DataValidationError) as ctx:
            validate_raw_dataset(bad_df, target_column="total_visitors")
        self.assertIn("all target values are missing", str(ctx.exception).lower())

    def test_03_fail_if_dates_cannot_be_parsed(self):
        bad_df = self.valid_df.copy()
        bad_df.loc[0, "date"] = "invalid_not_a_date"
        with self.assertRaises(DataValidationError) as ctx:
            validate_raw_dataset(bad_df, date_column="date")
        self.assertIn("dates cannot be parsed", str(ctx.exception).lower())

    def test_04_fail_if_duplicate_monument_date_records(self):
        bad_df = pd.concat([self.valid_df, self.valid_df.iloc[[0]]], ignore_index=True)
        with self.assertRaises(DataValidationError) as ctx:
            validate_raw_dataset(bad_df)
        self.assertIn("duplicate", str(ctx.exception).lower())

    def test_05_fail_if_training_split_is_empty(self):
        empty_train = pd.DataFrame()
        test_df = self.valid_df.copy()
        with self.assertRaises(DataValidationError) as ctx:
            validate_splits(empty_train, test_df)
        self.assertIn("training split is empty", str(ctx.exception).lower())

    def test_06_fail_if_test_split_is_empty(self):
        train_df = self.valid_df.copy()
        empty_test = pd.DataFrame()
        with self.assertRaises(DataValidationError) as ctx:
            validate_splits(train_df, empty_test)
        self.assertIn("test split is empty", str(ctx.exception).lower())

    def test_07_fail_if_future_feature_detected(self):
        # Disallowed keyword
        features_with_future = ["monument_id", "future_weather", "is_weekend"]
        with self.assertRaises(DataValidationError) as ctx:
            validate_future_features(features_with_future)
        self.assertIn("future", str(ctx.exception).lower())

        # Disallowed target leakage
        features_with_target = ["monument_id", "total_visitors"]
        with self.assertRaises(DataValidationError) as ctx:
            validate_future_features(features_with_target)
        self.assertIn("target", str(ctx.exception).lower())

        # Excluded column leakage
        with self.assertRaises(DataValidationError) as ctx:
            validate_future_features(["monument_id", "record_id"], excluded_columns=["record_id"])
        self.assertIn("excluded", str(ctx.exception).lower())

    def test_08_fail_if_feature_columns_differ_between_training_and_inference(self):
        expected_cols = ["feat_a", "feat_b", "feat_c"]
        inference_df = pd.DataFrame([{"feat_a": 1, "feat_b": 2}])  # missing feat_c
        with self.assertRaises(DataValidationError) as ctx:
            validate_inference_features(inference_df, expected_cols)
        self.assertIn("differ", str(ctx.exception).lower())

    def test_09_fail_if_saved_model_cannot_be_loaded(self):
        with tempfile.TemporaryDirectory() as tmp_dir:
            # File doesn't exist
            non_existent = os.path.join(tmp_dir, "non_existent.joblib")
            with self.assertRaises(DataValidationError):
                validate_saved_model(non_existent)

            # Corrupt file
            corrupt_file = os.path.join(tmp_dir, "corrupt.joblib")
            with open(corrupt_file, "w") as f:
                f.write("corrupted non joblib data")
            with self.assertRaises(DataValidationError):
                validate_saved_model(corrupt_file)

            # Valid object without predict method
            invalid_obj_file = os.path.join(tmp_dir, "invalid_obj.joblib")
            joblib.dump({"just": "a dictionary"}, invalid_obj_file)
            with self.assertRaises(DataValidationError):
                validate_saved_model(invalid_obj_file)

if __name__ == "__main__":
    unittest.main()
