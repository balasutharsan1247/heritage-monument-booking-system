# Data Dictionary: Monument Visitor Footfall Forecasting

This document defines the schema, data types, valid ranges, missing value handling, and feature classification for the dataset used to train the visitor footfall prediction models.

## Column Definitions

| Field Name | Description | Data Type | Role | Allowed / Typical Values | Missing-Value Policy | Leakage Safe? |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `record_id` | Unique identifier for row | String | ID / Metadata | `REC_000001` - `REC_999999` | Disallowed; must exist | N/A (Excluded) |
| `monument_id` | Unique monument code | String | Entity Identifier | `M001`, `M002`, `M003`, `M004`, `M005` | Disallowed; must exist | Yes |
| `monument_name` | Full monument name | String | Metadata | e.g. "Taj Mahal", "Red Fort" | Excluded from features (use `monument_id`) | N/A (Excluded) |
| `state` | State where monument is located | String | Categorical Feature | e.g. "Uttar Pradesh", "Delhi", "Maharashtra", "Tamil Nadu" | Impute with 'missing' | Yes |
| `city` | City where monument is located | String | Categorical Feature | e.g. "Agra", "New Delhi", "Mumbai", "Madurai" | Impute with 'missing' | Yes |
| `monument_type` | Architectural category | String | Categorical Feature | "Mausoleum", "Fort", "Monument", "Minaret", "Temple" | Impute with 'missing' | Yes |
| `date` | Observation calendar date | Date (YYYY-MM-DD) | Temporal Index | `2024-01-01` to `2024-12-31` | Disallowed; parsed to datetime | Parsed for calendar features, raw string excluded |
| `year` | Calendar year | Integer | Numeric Feature | 2024 | Disallowed | Yes |
| `month` | Calendar month | Integer | Numeric Feature | 1 - 12 | Disallowed | Yes |
| `day_of_week` | Day of week index | Integer | Numeric Feature | 0 (Monday) - 6 (Sunday) | Disallowed | Yes |
| `is_weekend` | Weekend indicator | Binary (0/1) | Numeric Feature | 0 = Weekday, 1 = Weekend | Disallowed | Yes |
| `is_public_holiday` | Official gazetted holiday flag | Binary (0/1) | Numeric Feature | 0 = Regular day, 1 = Holiday | Disallowed | Yes |
| `holiday_name` | Name of holiday if applicable | String | Metadata | "Republic Day", "Diwali", etc. or null | Impute with 'None' | Excluded / Low-coverage metadata |
| `festival_name` | Cultural festival name | String | Metadata | "Holi", "Eid", etc. or null | Impute with 'None' | Excluded / Low-coverage metadata |
| `festival_importance` | Operational footfall impact tier | String | Categorical Feature | "High", "Medium", "Low", "None" | Impute with 'None' | Yes |
| `school_holiday` | Regional school vacation flag | Binary (0/1) | Numeric Feature | 0 = Regular school, 1 = Break | Disallowed | Yes |
| `daily_capacity` | Maximum designed ticket capacity | Integer | Numeric Feature | 1000 - 10000 | Disallowed | Yes |
| `is_open` | Operating status flag | Binary (0/1) | Numeric Feature | 0 = Closed/Maintenance, 1 = Open | Disallowed | Yes |
| `maintenance_or_closure` | Closure reason indicator | Binary (0/1) | Numeric Feature | 0 = Operating, 1 = Closed/Maintenance | Disallowed | Yes |
| `temperature_avg_c` | 24-hr average temperature in °C | Float | Numeric Feature | 5.0 to 50.0 | Impute with training median | Yes (Day forecast/historical) |
| `rainfall_mm` | Daily precipitation in mm | Float | Numeric Feature | 0.0 to 300.0 | Impute with training median | Yes (Day forecast/historical) |
| `weather_condition` | Dominant meteorological condition | String | Categorical Feature | "Clear", "Rainy", "Cloudy", "Haze", "Foggy" | Impute with 'Clear' | Yes |
| `visitors_previous_day` | Visitor count on prior day ($T-1$) | Float | Lag Feature | $\ge 0$ | NaN in warm-up (dropped) | Yes (strictly shifted $T-1$) |
| `rolling_7_day_average` | 7-day average ($T-7$ to $T-1$) | Float | Rolling Feature | $\ge 0$ | NaN in warm-up (dropped) | Yes (strictly shifted $T-1$) |
| `total_visitors` | Total tickets/footfall on date ($T$) | Integer | **TARGET VARIABLE** | $0$ to `daily_capacity` | Target column | Target to predict |
| `data_status` | Quality verification status | String | Metadata | "validated" | Disallowed | N/A (Excluded) |

## Leakage Prevention Protocol
1. **Target-Derived Features:** Features `visitors_previous_day` and `rolling_7_day_average` are constructed exclusively from historical records ($t \le T-1$). Current observation $T$ is never used.
2. **Rolling Windows:** Centered windows are strictly forbidden. Only backward-looking rolling windows with shift(1) are valid.
3. **Imputation & Scaling:** All scaling parameters and imputation medians are computed exclusively on the training split and applied transitively to the test split.
