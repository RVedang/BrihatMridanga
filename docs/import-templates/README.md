# Historical distribution import template

Use [historical-distributions.csv](historical-distributions.csv) in Excel, Google Sheets, or LibreOffice. It prepares past distribution data for a future reviewed import; it does not load data into the website by itself.

## One row means

Each row represents either one book line within a distribution event or one total-only distribution event.

For a detailed event containing several book titles, repeat the same `source_record_id`, date, attribution, and campaign on each book row. Give each row its own `book_id` and `quantity`.

For a total-only event, enter one row with `mode` set to `total`, leave `book_id`, `source_book_name`, and `quantity` empty, and enter the positive whole-number count in `total_books`.

## Columns

| Column | Required | Format and rule |
| --- | --- | --- |
| `source_record_id` | Yes | A stable, unique identifier for one historical distribution event. Repeat it only for the book lines belonging to that same event. |
| `distribution_date` | Yes | `YYYY-MM-DD`. Use the actual distribution date, never the date the spreadsheet was prepared. |
| `temple_name` | Yes | Existing temple name, written consistently across every row. |
| `centre_name` | No | Existing centre name under that temple. Leave blank if unavailable. |
| `individual_name` | No | Distributor name, if the historical record identifies one person. |
| `team_name` | No | Team name, if the historical record identifies a team. |
| `campaign_name` | No | Eligible special campaign. Leave blank for the calendar-year Whole-Year Marathon. |
| `mode` | Yes | `detailed` or `total`. |
| `book_id` | Detailed only | Exact Book ID from the Brihat Mridanga catalog. Do not use a title in this field. |
| `source_book_name` | No | The book name exactly as written in the original source; retained to help review and map old names to catalog IDs. |
| `quantity` | Detailed only | Positive whole number of copies or sets for that Book ID. |
| `total_books` | Total only | Positive whole number. Leave blank for detailed rows. |
| `source_reference` | No | Original sheet, register, report number, or row reference for audit and duplicate checks. |
| `notes` | No | Brief import-review note only. |

## Before sending the completed file for import

1. Keep the header row unchanged.
2. Do not enter points, set counts, calculated totals, database IDs, or user IDs. The importer must calculate those from the approved book catalog.
3. Do not split one distribution event into separate records for its individual, team, centre, and temple. It is one event with optional attribution.
4. Check that no `source_record_id` represents both a detailed event and a total-only event.
5. Keep all dates as actual spreadsheet dates formatted as `YYYY-MM-DD`.
6. Save as UTF-8 CSV before submission.

Historical import tooling is not yet available in the portal. Each completed file should first receive validation, duplicate review, attribution matching, a total/points preview, and approval before any data is written.
