"""
Training and Evaluation Orchestration Module for Heritage Monument Footfall Prediction.
Executes end-to-end data validation, chronological splitting, pipeline fitting,
baseline comparison, metric calculation, artifact serialization, and chart generation.
"""

import os
import json
from datetime import datetime, timezone
from typing import Dict, Any, Optional
import numpy as np
import pandas as pd
import joblib

from ml.src.config import load_config, ExperimentConfig
from ml.src.validation import (
    validate_raw_dataset,
    validate_future_features,
    validate_splits,
    validate_saved_model,
    DataValidationError
)
from ml.src.features import (
    prepare_features,
    build_preprocessing_pipeline,
    split_chronologically
)
from ml.src.models import BaselineModel, create_proposed_model
from ml.src.evaluate import calculate_metrics, generate_comparison_df
from ml.src.visualize import plot_baseline_vs_model, plot_predictions_vs_actual
from sklearn.pipeline import Pipeline

def run_training_pipeline(config_path: Optional[str] = None) -> Dict[str, Any]:
    """
    Executes the complete training workflow according to experiment specifications.
    """
    config: ExperimentConfig = load_config(config_path)
    output_dir = config.output_dir
    os.makedirs(output_dir, exist_ok=True)

    print("=" * 70)
    print("STARTING MODEL TRAINING PIPELINE")
    print(f"Experiment: {config.experiment_name} | Model: {config.model_name} ({config.model_version})")
    print("=" * 70)

    # 1. Load Dataset
    dataset_path = config.dataset_path
    if not os.path.exists(dataset_path):
        raise FileNotFoundError(f"Dataset file not found at: {dataset_path}")

    raw_df = pd.read_csv(dataset_path)
    print(f"Loaded raw dataset from: {dataset_path} ({len(raw_df)} records)")

    # 2. Raw Dataset Validation (Fail-Fast)
    validate_raw_dataset(
        raw_df,
        target_column=config.target_column,
        date_column="date",
        monument_id_column="monument_id"
    )
    print("Raw dataset validation passed successfully.")

    # 3. Future Feature & Leakage Validation
    validate_future_features(
        feature_columns=config.feature_columns,
        excluded_columns=config.excluded_columns
    )
    print("Leakage and future feature check passed successfully.")

    # 4. Feature Preparation & Warm-up Handling
    processed_df, warmup_dropped = prepare_features(
        raw_df,
        target_column=config.target_column,
        date_column="date",
        monument_id_column="monument_id",
        drop_warmup=True
    )
    print(f"Feature preparation complete. Warm-up rows dropped: {warmup_dropped}. Cleaned rows: {len(processed_df)}.")

    # 5. Chronological Train/Test Split
    split_cfg = config.split_config
    train_df, test_df = split_chronologically(
        processed_df,
        date_column="date",
        split_date=split_cfg.get("split_date"),
        split_ratio=split_cfg.get("split_ratio", 0.8)
    )

    # 6. Validate Splits (Non-empty, No temporal overlap)
    validate_splits(train_df, test_df, date_column="date")

    train_dates = pd.to_datetime(train_df["date"])
    test_dates = pd.to_datetime(test_df["date"])
    train_monuments = train_df["monument_id"].nunique()
    test_monuments = test_df["monument_id"].nunique()

    print("\n--- Chronological Split Summary ---")
    print(f"Training row count: {len(train_df)}")
    print(f"Testing row count:  {len(test_df)}")
    print(f"Training date range: {train_dates.min().strftime('%Y-%m-%d')} to {train_dates.max().strftime('%Y-%m-%d')}")
    print(f"Testing date range:  {test_dates.min().strftime('%Y-%m-%d')} to {test_dates.max().strftime('%Y-%m-%d')}")
    print(f"Number of monuments in training split: {train_monuments}")
    print(f"Number of monuments in testing split:  {test_monuments}")
    print("Accidental overlap check: PASSED (Train max date < Test min date)\n")

    # 7. Extract Feature Matrices
    X_train = train_df[config.feature_columns].copy()
    y_train = train_df[config.target_column].copy()
    X_test = test_df[config.feature_columns].copy()
    y_test = test_df[config.target_column].copy()

    # 8. Build & Fit Preprocessing Pipeline ONLY on Training Data
    preprocessor = build_preprocessing_pipeline(
        categorical_columns=config.categorical_columns,
        numerical_columns=config.numerical_columns
    )
    print("Fitting preprocessing pipeline exclusively on training split...")
    X_train_proc = preprocessor.fit_transform(X_train)
    X_test_proc = preprocessor.transform(X_test)

    # 9. Train Baseline Model
    baseline_type = config.baseline_config.get("model_type", "previous_day")
    print(f"Fitting Baseline Model ({baseline_type})...")
    baseline_model = BaselineModel(model_type=baseline_type)
    baseline_model.fit(X_train, y_train)
    baseline_preds = baseline_model.predict(X_test)

    # 10. Train Proposed Model
    proposed_cfg = config.proposed_model_config
    model_type = proposed_cfg.get("model_type", "HistGradientBoostingRegressor")
    hyperparams = proposed_cfg.get("hyperparameters", {})
    print(f"Fitting Proposed Model ({model_type})...")

    regressor = create_proposed_model(
        model_type=model_type,
        hyperparameters=hyperparams,
        random_state=config.random_seed
    )
    regressor.fit(X_train_proc, y_train)
    proposed_preds = regressor.predict(X_test_proc)
    proposed_preds = np.maximum(0.0, proposed_preds)  # Footfall cannot be negative

    # Construct End-to-End Pipeline for Production/Inference Portability
    full_pipeline = Pipeline(steps=[
        ("preprocessor", preprocessor),
        ("regressor", regressor)
    ])

    # 11. Compute Metrics
    baseline_metrics = calculate_metrics(y_test.values, baseline_preds)
    model_metrics = calculate_metrics(y_test.values, proposed_preds)

    mae_improv = ((baseline_metrics["MAE"] - model_metrics["MAE"]) / baseline_metrics["MAE"] * 100.0) if baseline_metrics["MAE"] > 0 else 0.0
    rmse_improv = ((baseline_metrics["RMSE"] - model_metrics["RMSE"]) / baseline_metrics["RMSE"] * 100.0) if baseline_metrics["RMSE"] > 0 else 0.0

    print("\n--- Evaluation Results ---")
    print(f"Baseline ({baseline_type}):")
    print(f"  MAE:  {baseline_metrics['MAE']}")
    print(f"  RMSE: {baseline_metrics['RMSE']}")
    print(f"  MAPE: {baseline_metrics['MAPE']}%")
    print(f"  Evaluated observations: {baseline_metrics['evaluated_observations']}")
    print(f"Proposed Model ({model_type}):")
    print(f"  MAE:  {model_metrics['MAE']}")
    print(f"  RMSE: {model_metrics['RMSE']}")
    print(f"  MAPE: {model_metrics['MAPE']}%")
    print(f"  Evaluated observations: {model_metrics['evaluated_observations']}")
    print(f"Relative Improvement: MAE: {mae_improv:.2f}% | RMSE: {rmse_improv:.2f}%\n")

    # 12. Save Predictions & Outputs
    # A. Baseline Predictions CSV
    baseline_pred_df = pd.DataFrame({
        "date": test_df["date"].dt.strftime("%Y-%m-%d"),
        "monument_id": test_df["monument_id"],
        "actual": y_test.values,
        "baseline_pred": np.round(baseline_preds, 1)
    })
    baseline_pred_path = os.path.join(output_dir, "baseline_predictions.csv")
    baseline_pred_df.to_csv(baseline_pred_path, index=False)

    # B. Model Predictions CSV
    model_pred_df = pd.DataFrame({
        "date": test_df["date"].dt.strftime("%Y-%m-%d"),
        "monument_id": test_df["monument_id"],
        "actual": y_test.values,
        "proposed_model_pred": np.round(proposed_preds, 1)
    })
    model_pred_path = os.path.join(output_dir, "model_predictions.csv")
    model_pred_df.to_csv(model_pred_path, index=False)

    # C. Predictions vs Actual Combined CSV
    combined_pred_df = pd.DataFrame({
        "date": test_df["date"].dt.strftime("%Y-%m-%d"),
        "monument_id": test_df["monument_id"],
        "actual": y_test.values,
        "baseline_pred": np.round(baseline_preds, 1),
        "proposed_model_pred": np.round(proposed_preds, 1),
        "baseline_abs_error": np.round(np.abs(y_test.values - baseline_preds), 1),
        "model_abs_error": np.round(np.abs(y_test.values - proposed_preds), 1)
    })
    combined_pred_path = os.path.join(output_dir, "predictions_vs_actual.csv")
    combined_pred_df.to_csv(combined_pred_path, index=False)

    # D. Comparison Report CSV
    comp_df = generate_comparison_df(baseline_metrics, model_metrics)
    comp_report_path = os.path.join(output_dir, "comparison_report.csv")
    comp_df.to_csv(comp_report_path, index=False)

    # E. Evaluation Metrics JSON
    metrics_payload = {
        "baseline": baseline_metrics,
        "proposed_model": model_metrics,
        "mae_improvement_percent": round(mae_improv, 2),
        "rmse_improvement_percent": round(rmse_improv, 2),
        "evaluation_timestamp": datetime.now(timezone.utc).isoformat()
    }
    metrics_path = os.path.join(output_dir, "evaluation_metrics.json")
    with open(metrics_path, "w", encoding="utf-8") as f:
        json.dump(metrics_payload, f, indent=2)

    # F. Model Artifacts
    model_path = os.path.join(output_dir, "trained_model.joblib")
    prep_path = os.path.join(output_dir, "preprocessing_pipeline.joblib")
    joblib.dump(full_pipeline, model_path)
    joblib.dump(preprocessor, prep_path)
    print(f"Serialized model saved to: {model_path}")
    print(f"Serialized preprocessor saved to: {prep_path}")

    # G. Visualizations
    chart1_path = os.path.join(output_dir, "baseline_vs_model_chart.png")
    chart2_path = os.path.join(output_dir, "predictions_vs_actual_chart.png")
    plot_baseline_vs_model(baseline_metrics, model_metrics, chart1_path)
    plot_predictions_vs_actual(combined_pred_df, chart2_path)
    print(f"Saved evaluation charts to: {chart1_path} and {chart2_path}")

    # H. Model Metadata JSON
    metadata = {
        "model_name": config.model_name,
        "model_version": config.model_version,
        "target_column": config.target_column,
        "feature_columns": config.feature_columns,
        "categorical_columns": config.categorical_columns,
        "numerical_columns": config.numerical_columns,
        "excluded_columns": config.excluded_columns,
        "training_start_date": train_dates.min().strftime("%Y-%m-%d"),
        "training_end_date": train_dates.max().strftime("%Y-%m-%d"),
        "testing_start_date": test_dates.min().strftime("%Y-%m-%d"),
        "testing_end_date": test_dates.max().strftime("%Y-%m-%d"),
        "training_row_count": len(train_df),
        "testing_row_count": len(test_df),
        "monument_count": train_monuments,
        "random_seed": config.random_seed,
        "dataset_path": config.dataset_path,
        "preprocessing_description": (
            "ColumnTransformer: SimpleImputer(median) + StandardScaler on numerical features; "
            "SimpleImputer(constant, 'missing') + OneHotEncoder(ignore) on categorical features. "
            "Fit strictly on training set."
        ),
        "model_parameters": {
            "model_type": model_type,
            **hyperparams
        },
        "data-quality status": "Validated benchmark dataset; zero missingness in targets; no chronological overlaps.",
        "limitations": [
            "Trained on historical single-year benchmark data.",
            "Weather conditions are assumed to be day-ahead forecasts.",
            "Extreme black swan events or unannounced emergency closures are not anticipated.",
            "Not certified as production-ready without ongoing real-world drift monitoring."
        ],
        "training_timestamp": datetime.now(timezone.utc).isoformat()
    }
    meta_path = os.path.join(output_dir, "model_metadata.json")
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)
    print(f"Saved metadata to: {meta_path}")

    # 13. Validate Model Persistence Loadability
    validate_saved_model(model_path)
    print("Model loadability verification PASSED.")

    print("\nTraining and evaluation pipeline finished successfully!")
    return {
        "baseline_metrics": baseline_metrics,
        "model_metrics": model_metrics,
        "metadata": metadata,
        "output_dir": output_dir
    }

if __name__ == "__main__":
    run_training_pipeline()
