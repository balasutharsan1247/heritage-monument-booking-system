"""
Model Definitions: Baseline and Proposed Footfall Regressors.
Provides scikit-learn compatible interfaces and explainable configurations.
"""

from typing import Dict, Any, Optional
import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator, RegressorMixin
from sklearn.ensemble import HistGradientBoostingRegressor, RandomForestRegressor

class BaselineModel(BaseEstimator, RegressorMixin):
    """
    Baseline Forecaster:
    - 'previous_day': Predicts previous day's visitor count (Naive lag-1).
    - 'same_weekday_mean': Predicts historical average for the same monument and weekday.
    """
    def __init__(self, model_type: str = "previous_day"):
        self.model_type = model_type
        self.monument_means_: Dict[str, float] = {}
        self.weekday_means_: Dict[tuple, float] = {}
        self.global_mean_: float = 0.0

    def fit(self, X: pd.DataFrame, y: pd.Series):
        df = X.copy()
        df["_target"] = y.values

        self.global_mean_ = float(y.mean()) if len(y) > 0 else 0.0

        if "monument_id" in df.columns:
            self.monument_means_ = df.groupby("monument_id")["_target"].mean().to_dict()

        if "monument_id" in df.columns and "day_of_week" in df.columns:
            self.weekday_means_ = df.groupby(["monument_id", "day_of_week"])["_target"].mean().to_dict()

        return self

    def predict(self, X: pd.DataFrame) -> np.ndarray:
        predictions = []

        for _, row in X.iterrows():
            # If monument is closed on that day, predicted footfall is 0
            if "is_open" in row and row["is_open"] == 0:
                predictions.append(0.0)
                continue

            m_id = row.get("monument_id", None)
            dow = row.get("day_of_week", None)

            fallback = self.monument_means_.get(m_id, self.global_mean_)

            if self.model_type == "previous_day":
                val = row.get("visitors_previous_day", np.nan)
                if pd.isna(val) or val is None:
                    predictions.append(fallback)
                else:
                    predictions.append(float(val))
            elif self.model_type == "same_weekday_mean":
                val = self.weekday_means_.get((m_id, dow), fallback)
                predictions.append(float(val))
            else:
                predictions.append(fallback)

        return np.maximum(0.0, np.array(predictions))

def create_proposed_model(
    model_type: str = "HistGradientBoostingRegressor",
    hyperparameters: Optional[Dict[str, Any]] = None,
    random_state: int = 42
) -> BaseEstimator:
    """
    Instantiates the proposed tree-based regressor with explainable defaults.
    Prefers HistGradientBoostingRegressor, falls back to RandomForestRegressor.
    """
    params = hyperparameters.copy() if hyperparameters else {}
    params.setdefault("random_state", random_state)

    if model_type == "HistGradientBoostingRegressor":
        # Explainable parameters
        params.setdefault("max_iter", 100)
        params.setdefault("max_depth", 6)
        params.setdefault("min_samples_leaf", 10)
        params.setdefault("learning_rate", 0.1)
        return HistGradientBoostingRegressor(**params)
    elif model_type == "RandomForestRegressor":
        params.setdefault("n_estimators", 100)
        params.setdefault("max_depth", 10)
        params.setdefault("min_samples_leaf", 5)
        return RandomForestRegressor(**params)
    else:
        raise ValueError(f"Unsupported proposed model type: {model_type}")
