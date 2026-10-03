"""
Feature Engineering and Preprocessing Pipeline for Monument Footfall Prediction.
Enforces strictly causal, non-centered, leakage-safe lag and rolling calculations.
"""

from typing import List, Tuple, Optional
import pandas as pd
import numpy as np
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.impute import SimpleImputer

def prepare_features(
    df: pd.DataFrame,
    target_column: str = "total_visitors",
    date_column: str = "date",
    monument_id_column: str = "monument_id",
    drop_warmup: bool = True
) -> Tuple[pd.DataFrame, int]:
    """
    Parses dates, sorts chronologically per monument, constructs/verifies causal lags,
    and handles warm-up periods.

    Returns:
        processed_df: Cleaned dataframe sorted chronologically.
        warmup_dropped_count: Number of initial warm-up rows removed.
    """
    data = df.copy()

    # 1. Safe Date Parsing
    data[date_column] = pd.to_datetime(data[date_column], errors="raise")

    # 2. Strict chronological sorting per monument
    data = data.sort_values(by=[monument_id_column, date_column]).reset_index(drop=True)

    # 3. Derive calendar features
    data["year"] = data[date_column].dt.year
    data["month"] = data[date_column].dt.month
    data["day_of_week"] = data[date_column].dt.dayofweek
    data["is_weekend"] = data["day_of_week"].isin([5, 6]).astype(int)

    # 4. Leakage-safe lag generation
    # Previous day visitor count for the SAME monument: shift(1) guarantees current day is never seen
    if target_column in data.columns:
        computed_prev_day = data.groupby(monument_id_column)[target_column].shift(1)
        # Shifted 7-day rolling average: explicitly non-centered, rolling over strictly prior observations
        computed_rolling_7 = (
            data.groupby(monument_id_column)[target_column]
            .shift(1)
            .rolling(window=7, min_periods=1, center=False)
            .mean()
        )
        data["visitors_previous_day"] = computed_prev_day
        data["rolling_7_day_average"] = computed_rolling_7

    # 5. Handle warm-up rows where previous day lag is unavailable
    warmup_dropped_count = 0
    if drop_warmup and "visitors_previous_day" in data.columns:
        initial_len = len(data)
        data = data.dropna(subset=["visitors_previous_day"]).reset_index(drop=True)
        warmup_dropped_count = initial_len - len(data)

    return data, warmup_dropped_count

def build_preprocessing_pipeline(
    categorical_columns: List[str],
    numerical_columns: List[str]
) -> ColumnTransformer:
    """
    Builds a reproducible Scikit-Learn ColumnTransformer pipeline.
    Numerical: Median Imputation + StandardScaler
    Categorical: Constant Imputation + OneHotEncoder (ignoring unseen classes)
    """
    num_pipeline = Pipeline(steps=[
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler())
    ])

    cat_pipeline = Pipeline(steps=[
        ("imputer", SimpleImputer(strategy="constant", fill_value="missing")),
        ("onehot", OneHotEncoder(handle_unknown="ignore", sparse_output=False))
    ])

    preprocessor = ColumnTransformer(
        transformers=[
            ("num", num_pipeline, numerical_columns),
            ("cat", cat_pipeline, categorical_columns)
        ],
        remainder="drop"
    )

    return preprocessor

def split_chronologically(
    df: pd.DataFrame,
    date_column: str = "date",
    split_date: Optional[str] = "2024-10-01",
    split_ratio: Optional[float] = 0.8
) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """
    Splits data chronologically with zero shuffling and no date overlap.
    Uses split_date if provided, otherwise splits by unique date ratio.
    """
    sorted_df = df.sort_values(by=[date_column]).copy()

    if split_date:
        split_dt = pd.to_datetime(split_date)
        train_df = sorted_df[sorted_df[date_column] < split_dt].copy()
        test_df = sorted_df[sorted_df[date_column] >= split_dt].copy()
    else:
        unique_dates = sorted(sorted_df[date_column].unique())
        split_idx = int(len(unique_dates) * split_ratio)
        cutoff_date = unique_dates[split_idx]
        train_df = sorted_df[sorted_df[date_column] < cutoff_date].copy()
        test_df = sorted_df[sorted_df[date_column] >= cutoff_date].copy()

    return train_df, test_df
