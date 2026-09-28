# ML Experiment Plan: Visitor Footfall Forecasting

This document outlines the machine learning experiment design for forecasting visitor footfall at heritage monuments, based on the approved data-quality report.

## 1. Feasibility Assessment
Based on the current data quality analysis report (which identified only **1 valid observation day** for Monument M001):
*   **Daily Forecasting Feasibility:** **NOT FEASIBLE.** At least 30+ days of historical data are required to capture basic weekly trends.
*   **Hourly Forecasting Feasibility:** **NOT FEASIBLE.** The current dataset only contains 2 hours of observed data.

*Note: The experiment plan below establishes the framework that will be executed once a sufficient data volume is collected.*

## 2. Baseline Definition
Given the current lack of historical data, the most appropriate baseline model is the **Previous-Period Value** (Naive Forecast):
*   **Daily Baseline:** The forecast for day $T$ is the actual visitor count from day $T-1$.
*   *Alternative (when data permits):* Same-weekday historical average (e.g., forecasting next Tuesday based on the average of the last 4 Tuesdays).

## 3. Candidate Model Options (Based on Data Volume)
Every model choice must be justified by the available dataset. 
1.  **Baseline (Previous-Period Value):**
    *   *Justification:* The only viable option for the current data volume (1 day).
2.  **Linear Regression with Calendar Features:**
    *   *Justification:* **NOT JUSTIFIED YET.** Will be considered only after acquiring at least 30-60 days of data to fit basic calendar features (e.g., day of week, holiday flags).
3.  **Random Forest Regression:**
    *   *Justification:* **NOT JUSTIFIED YET.** Requires a much larger dataset (months of data) with non-linear relationships (e.g., weather combined with holidays) to avoid severe overfitting.
4.  **Prophet / Advanced Time-Series:**
    *   *Justification:* **NOT JUSTIFIED.** Requires multiple seasons (ideally 1-2 years of data) to decompose yearly seasonality, weekly seasonality, and trend.

## 4. Chronological Split Strategy
To mimic real-world forecasting, data will strictly be split chronologically (no random shuffles):
*   **Training Set:** Past observations (e.g., first 80% of the timeline).
*   **Test Set:** Future observations (e.g., final 20% of the timeline).
*   *Current Status:* A split is impossible with only 1 day of data. We must await further data collection.

## 5. Leakage-Prevention Rules
Data leakage would invalidate the experiment. The following rules are strictly enforced:
*   **No Future Features:** Features like weather must use *forecasts* available at time $T$, not the *actual* observed weather at $T+1$.
*   **Strict Chronology:** `train_test_split(shuffle=True)` is strictly prohibited.
*   **Imputation Boundaries:** Any statistics used for missing value imputation (e.g., mean visitors) must be calculated **exclusively from the training set**, never the test set.

## 6. Evaluation Metrics
*   **MAE (Mean Absolute Error):** Primary metric. Represents the average number of visitors the forecast was off by. Highly interpretable for operations.
*   **RMSE (Root Mean Squared Error):** Penalizes larger forecasting errors more heavily. Useful for identifying days where the model fails severely.
*   **MAPE (Mean Absolute Percentage Error):** Valid and calculated **ONLY** for periods where actual visitors > 0 (to avoid division by zero).

## 7. Reproducibility Requirements
Every ML experiment run must log the following metadata to ensure reproducibility:
*   **Dataset Version:** (e.g., `v1-20250101-export`)
*   **Code Version:** (Git commit hash of the forecasting script)
*   **Feature List:** (Exact list of input features used, e.g., `['DayOfWeek', 'IsHoliday']`)
*   **Random Seed:** (e.g., `42` — fixed for any stochastic algorithms like Random Forest, although the split remains chronological)
*   **Training Date:** (Exact timestamp of model execution)

## 8. Prohibited Claims
Until a full evaluation on an unseen test set yields statistically significant results, the following claims are **strictly prohibited**:
*   "The model accurately predicts visitor footfall."
*   "We have a robust AI forecasting system."
*   "The model can anticipate peak visitor hours."
*   "This ML experiment improves operational efficiency."
*   *Any fabricated accuracy results or performance generalizations.*

---
**Status:** Awaiting user approval to finalize the experiment design. No training will commence until sufficient data is gathered and approval is explicitly granted.
