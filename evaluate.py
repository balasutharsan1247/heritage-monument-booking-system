"""
CLI Entrypoint for Model Evaluation.
Evaluates the serialized trained model and baseline on the chronological test split.
"""

import sys
import os
import json
import numpy as np
import pandas as pd
import joblib

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from ml.src.config import load_config
from ml.src.validation import validate_raw_dataset, validate_splits, validate_saved_model
from ml.src.features import prepare_features, split_chronologically
from ml.src.models import BaselineModel
from ml.src.evaluate import calculate_metrics, generate_comparison_df

def run_evaluation(config_path=None):
    config = load_config(config_path)
    output_dir = config.output_dir
    model_path = os.path.join(output_dir, "trained_model.joblib")

    print("=" * 70)
    print("STARTING MODEL EVALUATION")
    print(f"Model Path: {model_path}")
    print("=" * 70)

    # 1. Validate Saved Model
    validate_saved_model(model_path)
    pipeline = joblib.load(model_path)
    print("Trained model successfully loaded.")

    # 2. Load & Prepare Test Split
    raw_df = pd.read_csv(config.dataset_path)
    validate_raw_dataset(raw_df, target_column=config.target_column)

    processed_df, _ = prepare_features(raw_df, target_column=config.target_column, drop_warmup=True)
    train_df, test_df = split_chronologically(
        processed_df,
        date_column="date",
        split_date=config.split_config.get("split_date"),
        split_ratio=config.split_config.get("split_ratio", 0.8)
    )
    validate_splits(train_df, test_df)

    X_train = train_df[config.feature_columns]
    y_train = train_df[config.target_column]
    X_test = test_df[config.feature_columns]
    y_test = test_df[config.target_column]

    # 3. Fit Baseline on Train Split
    baseline_type = config.baseline_config.get("model_type", "previous_day")
    baseline = BaselineModel(model_type=baseline_type)
    baseline.fit(X_train, y_train)
    baseline_preds = baseline.predict(X_test)

    # 4. Predict using Trained Pipeline
    model_preds = pipeline.predict(X_test)
    model_preds = np.maximum(0.0, model_preds)

    # 5. Calculate Metrics
    b_metrics = calculate_metrics(y_test.values, baseline_preds)
    m_metrics = calculate_metrics(y_test.values, model_preds)

    comp_df = generate_comparison_df(b_metrics, m_metrics)

    print("\n--- Model Evaluation Summary ---")
    print(comp_df.to_string(index=False))

    mae_diff = b_metrics["MAE"] - m_metrics["MAE"]
    rmse_diff = b_metrics["RMSE"] - m_metrics["RMSE"]
    print("\n" + "=" * 70)
    if mae_diff > 0 and rmse_diff > 0:
        print(f"RESULT: Proposed model OUTPERFORMS baseline by {mae_diff:.2f} MAE and {rmse_diff:.2f} RMSE.")
    else:
        print(f"RESULT: Baseline performance was not exceeded by proposed model.")
    print("=" * 70 + "\n")

    return comp_df

if __name__ == "__main__":
    config_file = sys.argv[1] if len(sys.argv) > 1 else None
    run_evaluation(config_file)
