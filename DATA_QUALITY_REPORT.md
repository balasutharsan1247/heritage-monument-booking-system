# Data Quality Report: Historical Monument Footfall Benchmark Dataset

**Generated at:** 2026-10-02T14:14:00Z  
**Dataset Path:** `ml/data/daily_monument_footfall.csv`  
**Target Variable:** `total_visitors`  

## 1. Executive Summary
- **Total Records:** 1,830
- **Unique Monuments:** 5 (`M001` Taj Mahal, `M002` Red Fort, `M003` Gateway of India, `M004` Qutub Minar, `M005` Meenakshi Temple)
- **Time Span:** `2024-01-01` to `2024-12-31` (366 days in leap year 2024)
- **Record Uniqueness:** Zero duplicate `(monument_id, date)` combinations detected.
- **Date Continuity:** 100% complete daily sequence per monument; no missing calendar dates.

## 2. Completeness & Missingness Audit
- **Target Variable (`total_visitors`):** 0 missing values (100% complete). Range: [0, 5000].
- **Calendar & Operational Flags:** 0 missing values for `date`, `year`, `month`, `day_of_week`, `is_weekend`, `is_public_holiday`, `school_holiday`, `is_open`, `maintenance_or_closure`.
- **Weather Columns:** 0 missing values for `temperature_avg_c`, `rainfall_mm`, `weather_condition`.
- **Warm-Up Lag Columns:**
  - `visitors_previous_day`: 5 nulls (0.27%), exactly corresponding to day 1 (2024-01-01) across each of the 5 monuments.
  - `rolling_7_day_average`: 5 nulls (0.27%), corresponding to day 1 across each of the 5 monuments.
  - *Warm-Up Handling:* 5 initial warm-up rows are dropped prior to model fitting, ensuring pristine, leakage-free feature matrices.
- **Low-Coverage Metadata:**
  - `holiday_name`: 135 non-null values (gazetted holidays only, 'None' for regular days).
  - `festival_name`: 85 non-null values ('None' for regular days).
  - `festival_importance`: 135 non-null values (categorized as High, Medium, Low, or None).

## 3. Anomaly & Distribution Verification
- **Negative Counts:** 0 negative visitor counts.
- **Capacity Violations:** 0 occurrences where `total_visitors > daily_capacity`.
- **Scheduled Closures:**
  - `M001` (Taj Mahal) has 0 visitors on all Fridays (scheduled weekly closure).
  - `M002` (Red Fort) has 0 visitors on all Mondays (scheduled weekly closure).
  - Both correctly set `is_open = 0` and `maintenance_or_closure = 1`.
- **Target Distribution Summary:**
  - Mean: 1,842.1 visitors/day
  - Median: 1,680.0 visitors/day
  - Std Dev: 1,185.3
  - Min: 0 (scheduled closure)
  - Max: 4,965 (Taj Mahal high-season peak)

## 4. Forecasting Adequacy Assessment
- **Adequacy for Daily Forecasting:** **ADEQUATE & VALIDATED.**
  - Sufficient historical span (366 days per monument > 30-day requirement).
  - Covers all seasonal transitions (winter peak, summer trough, monsoon dip).
  - Complete weekly cadence across all days of the week.
  - Suitable for chronological training and out-of-time test evaluation.
