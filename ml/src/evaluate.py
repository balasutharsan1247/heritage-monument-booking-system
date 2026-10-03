"""
Evaluation and Metrics Calculation Module.
Implements MAE, RMSE, and Zero-Safe MAPE.
"""

from typing import Dict, Any
import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, root_mean_squared_error

def safe_mape(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    """
    Computes Mean Absolute Percentage Error (MAPE) strictly excluding zero actual values.
    Returns percentage (0.0 to 100.0+).
    """
    y_true = np.asarray(y_true)
    y_pred = np.asarray(y_pred)
    nonzero_mask = (y_true != 0) & (~np.isnan(y_true))

    if not np.any(nonzero_mask):
        return 0.0

    pct_errors = np.abs((y_true[nonzero_mask] - y_pred[nonzero_mask]) / y_true[nonzero_mask])
    return float(np.mean(pct_errors) * 100.0)

def calculate_metrics(y_true: np.ndarray, y_pred: np.ndarray) -> Dict[str, Any]:
    """
    Computes MAE, RMSE, safe MAPE, and sample count.
    """
    y_true = np.asarray(y_true)
    y_pred = np.asarray(y_pred)

    mae = float(mean_absolute_error(y_true, y_pred))
    rmse = float(root_mean_squared_error(y_true, y_pred))
    mape = float(safe_mape(y_true, y_pred))
    n_obs = int(len(y_true))

    return {
        "MAE": round(mae, 2),
        "RMSE": round(rmse, 2),
        "MAPE": round(mape, 2),
        "evaluated_observations": n_obs
    }

def generate_comparison_df(
    baseline_metrics: Dict[str, Any],
    model_metrics: Dict[str, Any]
) -> pd.DataFrame:
    """
    Generates tabular comparison between Baseline and Proposed Model.
    """
    rows = []
    for metric in ["MAE", "RMSE", "MAPE"]:
        b_val = baseline_metrics.get(metric, 0.0)
        m_val = model_metrics.get(metric, 0.0)
        diff = m_val - b_val
        pct_improvement = ((b_val - m_val) / b_val * 100.0) if b_val != 0 else 0.0
        rows.append({
            "Metric": metric,
            "Baseline": b_val,
            "Proposed_Model": m_val,
            "Absolute_Difference": round(diff, 2),
            "Relative_Improvement_Pct": round(pct_improvement, 2),
            "Better_Model": "Proposed" if diff < 0 else "Baseline"
        })

    rows.append({
        "Metric": "Evaluated_Observations",
        "Baseline": baseline_metrics.get("evaluated_observations", 0),
        "Proposed_Model": model_metrics.get("evaluated_observations", 0),
        "Absolute_Difference": 0,
        "Relative_Improvement_Pct": 0.0,
        "Better_Model": "N/A"
    })

    return pd.DataFrame(rows)
