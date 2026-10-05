# CourtMind ML Data Directory

This directory stores datasets used for training and evaluating the XGBoost delay risk classification model.

## Subdirectories

- `raw/`: Untouched source datasets (e.g., e-Courts raw dump, legal metadata extracts). **Never modify files here directly.**
- `processed/`: Cleaned, transformed, and feature-engineered datasets ready for model training.

## Expected Case Schema (Planned)

The tabular delay prediction model is planned to consume the following structured attributes:
- `case_id`: Unique identifier
- `court_id` / `court_type`: High Court / District Court / Subordinate Court
- `case_type`: Civil, Criminal, Writ, Commercial, etc.
- `filing_date`: Timestamp of case initiation
- `first_hearing_date`: Timestamp of initial hearing
- `number_of_hearings`: Historical hearing count
- `number_of_adjournments`: Frequency of adjournments requested/granted
- `judge_transfer_count`: Bench reassignment count
- `acts_sections`: List of legal acts cited
- `target_delay_risk`: Categorical target (`Low`, `Medium`, `High`) based on actual duration vs. statutory benchmarks.

> **Note:** Raw datasets and proprietary court records should be kept out of version control. The `.gitignore` is configured to ignore CSV, Parquet, and Excel dumps.
