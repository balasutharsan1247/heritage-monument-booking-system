# Data Quality Analysis Report (Template)

**Generated at:** [Timestamp]

## Summary
- **Total Records:** [count]
- **Valid Records (Observed):** [count]
- **Excluded Records:** [count]
- **Corrected Records:** [count]

## Monument: [Monument_ID]
- **Data Coverage:** [Start Date] to [End Date]
- **Valid Observations (Days):** [count]
- **Missing/Closure Days:** [count]
- **Min Daily Visitors:** [value]
- **Max Daily Visitors:** [value]
- **Mean Daily Visitors:** [value]
- **Median Daily Visitors:** [value]
- **Std Dev Daily Visitors:** [value]
- **Weekday Distribution:** [Mon: ..., Tue: ...]
- **Holiday Distribution:** [Holiday: ..., Regular: ...]

### Data Flags
- [ ] **FLAG**: Insufficient history for robust forecasting (< 30 days).
- [ ] **FLAG**: Irregular intervals detected.
- [ ] **FLAG**: Severe missingness detected (> 10% missing days).
- [ ] **FLAG**: Outliers detected (Z-score > 3 or < -3).
- [ ] **FLAG**: Possible reporting changes detected.
- [ ] **FLAG**: Closure or missing-data periods detected.

## Data Adequacy Assessment
*This section evaluates whether the dataset is suitable for training forecasting models.*

**Adequacy for Daily Forecasting:** 
[Adequate / Not Adequate]. (Explain why based on flags, missingness, and history. E.g., "Not adequate due to severe missingness and less than 30 days of data.")

**Adequacy for Hourly Forecasting:**
[Adequate / Not Adequate]. (Explain why based on hourly data availability, missing hours, etc.)

**Important Context:**
The data provided is NOT claimed to be representative without further context. Severe missingness or irregular intervals must be addressed (e.g., through proper imputation or data collection process fixes) before modeling can occur. We strictly separate observed data from corrected or excluded records to maintain data integrity.
