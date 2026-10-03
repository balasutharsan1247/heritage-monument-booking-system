"""
Visualization Module for Model Evaluation and Comparison.
Generates evaluation charts (baseline_vs_model_chart.png and predictions_vs_actual_chart.png).
"""

import os
from typing import Dict, Any
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")  # Non-interactive backend
import matplotlib.pyplot as plt

def plot_baseline_vs_model(
    baseline_metrics: Dict[str, Any],
    model_metrics: Dict[str, Any],
    output_path: str
) -> None:
    """
    Plots a bar comparison of MAE and RMSE between Baseline and Proposed Model.
    """
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    metrics = ["MAE", "RMSE"]
    baseline_vals = [baseline_metrics.get(m, 0.0) for m in metrics]
    model_vals = [model_metrics.get(m, 0.0) for m in metrics]

    x = np.arange(len(metrics))
    width = 0.35

    fig, ax = plt.subplots(figsize=(8, 5))
    rects1 = ax.bar(x - width/2, baseline_vals, width, label="Baseline Model", color="#94a3b8")
    rects2 = ax.bar(x + width/2, model_vals, width, label="Proposed Model", color="#2563eb")

    ax.set_ylabel("Error (Visitors)", fontsize=11)
    ax.set_title("Forecast Error Comparison: Baseline vs Proposed Model", fontsize=13, fontweight="bold")
    ax.set_xticks(x)
    ax.set_xticklabels(metrics, fontsize=11)
    ax.legend(frameon=True)
    ax.grid(axis="y", linestyle="--", alpha=0.5)

    # Attach value labels
    for rect in rects1 + rects2:
        height = rect.get_height()
        ax.annotate(f"{height:.1f}",
                    xy=(rect.get_x() + rect.get_width() / 2, height),
                    xytext=(0, 3),
                    textcoords="offset points",
                    ha="center", va="bottom", fontsize=10)

    fig.tight_layout()
    plt.savefig(output_path, dpi=200)
    plt.close(fig)

def plot_predictions_vs_actual(
    predictions_df: pd.DataFrame,
    output_path: str
) -> None:
    """
    Generates Actual vs Predicted scatter and time series plots.
    """
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 6))

    # 1. Scatter Plot (Actual vs Predicted)
    actual = predictions_df["actual"]
    pred = predictions_df["proposed_model_pred"]

    ax1.scatter(actual, pred, alpha=0.5, color="#2563eb", edgecolors="none", s=25, label="Observations")
    max_val = max(actual.max(), pred.max())
    ax1.plot([0, max_val], [0, max_val], "r--", linewidth=1.5, label="Ideal 1:1 Line")
    ax1.set_xlabel("Actual Footfall", fontsize=11)
    ax1.set_ylabel("Predicted Footfall", fontsize=11)
    ax1.set_title("Actual vs Predicted Footfall (Test Set)", fontsize=12, fontweight="bold")
    ax1.legend()
    ax1.grid(True, linestyle="--", alpha=0.4)

    # 2. Time-series segment for a representative monument
    m_id = predictions_df["monument_id"].iloc[0] if "monument_id" in predictions_df.columns else None
    if m_id:
        sub_df = predictions_df[predictions_df["monument_id"] == m_id].sort_values("date")
        ax2.plot(pd.to_datetime(sub_df["date"]), sub_df["actual"], label="Actual", color="#0f172a", linewidth=1.5)
        ax2.plot(pd.to_datetime(sub_df["date"]), sub_df["proposed_model_pred"], label="Proposed Model", color="#2563eb", linestyle="-", alpha=0.85)
        if "baseline_pred" in sub_df.columns:
            ax2.plot(pd.to_datetime(sub_df["date"]), sub_df["baseline_pred"], label="Baseline", color="#94a3b8", linestyle=":", alpha=0.7)
        ax2.set_xlabel("Date", fontsize=11)
        ax2.set_ylabel("Visitor Count", fontsize=11)
        ax2.set_title(f"Test Trajectory for Monument {m_id}", fontsize=12, fontweight="bold")
        ax2.tick_params(axis="x", rotation=30)
        ax2.legend()
        ax2.grid(True, linestyle="--", alpha=0.4)

    fig.tight_layout()
    plt.savefig(output_path, dpi=200)
    plt.close(fig)
