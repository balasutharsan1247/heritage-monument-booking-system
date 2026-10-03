"""
Experiment and Model Configuration Loader.
Loads parameters from ml_experiment_config.json with safe fallbacks.
"""

import json
import os
from typing import Dict, Any, List

DEFAULT_CONFIG_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "ml_experiment_config.json")

class ExperimentConfig:
    def __init__(self, config_dict: Dict[str, Any]):
        self.raw = config_dict
        self.experiment_name = config_dict.get("experiment_name", "Visitor Footfall Forecasting")
        self.model_name = config_dict.get("model_name", "HeritageFootfallRegressor")
        self.model_version = config_dict.get("model_version", "v1.0.0")
        self.target_column = config_dict.get("target_column", "total_visitors")
        self.dataset_path = config_dict.get("dataset_path", "ml/data/daily_monument_footfall.csv")
        self.output_dir = config_dict.get("output_dir", "ml/outputs/v1")
        self.random_seed = int(config_dict.get("random_seed", 42))
        self.monument_selection = config_dict.get("monument_selection", ["M001", "M002", "M003", "M004", "M005"])

        # Split Configuration
        self.split_config = config_dict.get("split_config", {
            "strategy": "date",
            "split_date": "2024-10-01",
            "split_ratio": 0.8,
            "chronological": True
        })

        # Baseline & Model Configurations
        self.baseline_config = config_dict.get("baseline_config", {
            "model_type": "previous_day",
            "fallback_strategy": "monument_mean"
        })
        self.proposed_model_config = config_dict.get("proposed_model_config", {
            "model_type": "HistGradientBoostingRegressor",
            "fallback_model_type": "RandomForestRegressor",
            "hyperparameters": {
                "max_iter": 100,
                "max_depth": 6,
                "min_samples_leaf": 10,
                "learning_rate": 0.1,
                "random_state": 42
            }
        })

        # Feature Configuration
        feature_cfg = config_dict.get("feature_config", {})
        self.categorical_columns: List[str] = feature_cfg.get("categorical_columns", [
            "monument_id", "state", "city", "monument_type", "festival_importance", "weather_condition"
        ])
        self.numerical_columns: List[str] = feature_cfg.get("numerical_columns", [
            "year", "month", "day_of_week", "is_weekend", "is_public_holiday",
            "school_holiday", "daily_capacity", "is_open", "maintenance_or_closure",
            "temperature_avg_c", "rainfall_mm", "visitors_previous_day", "rolling_7_day_average"
        ])
        self.excluded_columns: List[str] = feature_cfg.get("excluded_columns", [
            "record_id", "total_visitors", "date", "monument_name", "holiday_name", "festival_name", "data_status"
        ])
        self.warmup_handling: str = feature_cfg.get("warmup_handling", "drop_incomplete_lags")
        self.evaluation_metrics: List[str] = config_dict.get("evaluation_metrics", ["MAE", "RMSE", "MAPE"])

    @property
    def feature_columns(self) -> List[str]:
        return self.categorical_columns + self.numerical_columns

def load_config(config_path: str = None) -> ExperimentConfig:
    if config_path is None:
        config_path = DEFAULT_CONFIG_PATH
    if not os.path.exists(config_path):
        raise FileNotFoundError(f"Configuration file not found at: {config_path}")
    with open(config_path, "r", encoding="utf-8") as f:
        config_dict = json.load(f)
    return ExperimentConfig(config_dict)
