"""
Validation Module for Monument Footfall Prediction ML Pipeline.
Enforces strict fail-fast constraints, temporal leakage checks, and data contracts.
"""

import os
from typing import List, Optional
import pandas as pd
import joblib

class DataValidationError(ValueError):
    """Raised when data or pipeline validation checks fail."""
    pass

FORBIDDEN_FEATURE_KEYWORDS = [
    "future", "next", "lead", "tomorrow", "target", "total_visitors",
    "record_id", "data_status"
]

def validate_raw_dataset(
    df: pd.DataFrame,
    target_column: str = "total_visitors",
    date_column: str = "date",
    monument_id_column: str = "monument_id"
) -> None:
    """
    Validates raw dataframe integrity before preprocessing.
    Fails fast on missing targets, unparseable dates, or duplicate records.
    """
    if df is None or not isinstance(df, pd.DataFrame):
        raise DataValidationError("Input dataset is empty or not a valid DataFrame.")

    # 1. Target column existence
    if target_column not in df.columns:
        raise DataValidationError(f"Target column '{target_column}' is missing from dataset.")

    # 2. Target values non-empty
    if df[target_column].dropna().empty:
        raise DataValidationError(f"All target values are missing in column '{target_column}'.")

    # 3. Date column existence and parsing
    if date_column not in df.columns:
        raise DataValidationError(f"Date column '{date_column}' is missing from dataset.")

    parsed_dates = pd.to_datetime(df[date_column], errors="coerce")
    if parsed_dates.isna().any():
        invalid_count = parsed_dates.isna().sum()
        raise DataValidationError(f"Dates cannot be parsed: {invalid_count} unparseable date values detected in '{date_column}'.")

    # 4. Monument ID column existence
    if monument_id_column not in df.columns:
        raise DataValidationError(f"Monument identifier column '{monument_id_column}' is missing.")

    # 5. Duplicate monument-date records
    date_strings = parsed_dates.dt.strftime("%Y-%m-%d")
    duplicate_mask = df.duplicated(subset=[monument_id_column, date_column], keep=False)
    if duplicate_mask.any():
        dup_count = duplicate_mask.sum()
        raise DataValidationError(f"Dataset contains {dup_count} duplicate monument-date records for ({monument_id_column}, {date_column}).")

def validate_future_features(
    feature_columns: List[str],
    excluded_columns: Optional[List[str]] = None
) -> None:
    """
    Validates that no future information or forbidden metadata leaks into the feature set.
    """
    if excluded_columns:
        for col in excluded_columns:
            if col in feature_columns:
                raise DataValidationError(f"Excluded column '{col}' detected in model features.")

    for col in feature_columns:
        col_lower = col.lower()
        for kw in FORBIDDEN_FEATURE_KEYWORDS:
            if kw in col_lower and kw != "total_visitors": # total_visitors caught by exclusion
                raise DataValidationError(f"Potential future or leakage feature detected: '{col}' contains forbidden keyword '{kw}'.")
            if col_lower == "total_visitors":
                raise DataValidationError(f"Target column 'total_visitors' detected in feature set.")

def validate_splits(
    train_df: pd.DataFrame,
    test_df: pd.DataFrame,
    date_column: str = "date"
) -> None:
    """
    Validates chronological splits: non-empty, and strictly non-overlapping.
    """
    if train_df is None or len(train_df) == 0:
        raise DataValidationError("Training split is empty.")

    if test_df is None or len(test_df) == 0:
        raise DataValidationError("Test split is empty.")

    train_dates = pd.to_datetime(train_df[date_column])
    test_dates = pd.to_datetime(test_df[date_column])

    train_max = train_dates.max()
    test_min = test_dates.min()

    if train_max >= test_min:
        raise DataValidationError(
            f"Accidental chronological overlap detected between training (end: {train_max.date()}) "
            f"and testing (start: {test_min.date()})."
        )

def validate_inference_features(
    inference_df: pd.DataFrame,
    expected_feature_columns: List[str]
) -> None:
    """
    Ensures feature columns at inference time exactly match the model's training contract.
    """
    missing_cols = [c for c in expected_feature_columns if c not in inference_df.columns]
    if missing_cols:
        raise DataValidationError(f"Feature columns differ between training and inference. Missing required features: {missing_cols}")

def validate_saved_model(model_path: str) -> None:
    """
    Validates that a serialized model file exists and can be successfully loaded.
    """
    if not os.path.exists(model_path):
        raise DataValidationError(f"Saved model file does not exist at {model_path}.")
    try:
        loaded = joblib.load(model_path)
        if not hasattr(loaded, "predict"):
            raise DataValidationError(f"Loaded object from {model_path} does not implement 'predict'.")
    except Exception as e:
        raise DataValidationError(f"Saved model cannot be loaded from {model_path}: {str(e)}")
