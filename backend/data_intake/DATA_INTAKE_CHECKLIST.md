# Government Data Intake Checklist

Before accepting and ingesting any government visitor data, verify the following:

- [ ] **Written permission or authorization**: Do we have documented approval to use this data?
- [ ] **Permitted use**: Does the permission allow us to use this data for training ML prediction models?
- [ ] **Data ownership**: Who retains ownership of the data after we process it?
- [ ] **Anonymization**: Has the data been properly anonymized?
- [ ] **Personally identifiable information**: Ensure absolutely no PII (e.g., names, emails, phone numbers, IDs) is included in the provided data.
- [ ] **Date range**: Does the data cover the expected historical date range without arbitrary gaps?
- [ ] **Monument identifiers**: Do the monument IDs in the data map correctly to our system's `Monument_ID`?
- [ ] **Visitor-count definition**: Does "visitor count" mean tickets sold, actual physical entries, or something else?
- [ ] **Time zone**: What time zone are the dates and hours recorded in?
- [ ] **Missing values**: How are missing values represented (e.g., NULL, empty, -1)?
- [ ] **Duplicate records**: Have duplicate records been identified or removed by the source?
- [ ] **Holiday and closure records**: Are days the monument was closed explicitly marked (e.g., 0 visitors) or omitted?
- [ ] **Data retention and deletion**: What is the policy for deleting this data once the ML model is trained, or if permission is revoked?
