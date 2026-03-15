# Troubleshooting Guide

---

## Common Issues

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| "No pending leads" but rows exist | Status column values are not exactly `Pending` | Check for trailing spaces, wrong casing, or blank cells. Values must be exactly `Pending`. |
| Emails not sending after `installTrigger()` | Trigger installed but quota exceeded | Check Gmail quota (see below). Also verify trigger exists: Apps Script → Triggers (clock icon). |
| "Sheet not found" error on `setup()` or send | `sheetName` or `logSheet` in config doesn't match the actual tab name | Open the spreadsheet, check the exact tab name (case-sensitive), and update config to match. |
| Banner images broken in received email | Wrong Drive file ID or insufficient sharing permissions | Verify each `driveId` in config. Open Drive, right-click the file → Share → set to "Anyone with the link" → Viewer. |
| All rows marked `Invalid` after first trigger fire | `columns.email` index is wrong — engine is reading the wrong column | Check your spreadsheet's column order. `columns` uses 0-based indices (A=0, B=1, C=2...). |
| Rows marked `Typo` | Engine detected a likely domain misspelling | Check the Send Log for the suggested correction. Fix the email in the sheet, reset Status to `Pending`. |
| Rows marked `Invalid` that look valid | New placeholder text pattern not in the rejection list | Add the pattern to `isValidEmail`'s `invalid` array in `campaign_engine.gs`. |
| Trigger keeps firing after all leads processed | All remaining Pending rows became Invalid/Typo — no valid leads left | Engine auto-removes when `validPendingCount` reaches 0. If stuck, run `_deleteTrigger()` manually from the Apps Script editor. |
| `send-error` rows not being retried | Correct behavior — engine writes `send-error` to prevent infinite retry | Investigate the error in Send Log. Fix the root cause, then reset Status to `Pending` to retry. |
| Emails received but subject/name looks wrong | Template placeholder tokens misspelled in config | Check `subject` and `bodyHtml` for exact token spelling. See [email-validation-rules.md](email-validation-rules.md). |
| `setup()` doesn't create the log sheet | `sheetName` sheet doesn't exist yet — `setup()` creates it on first run | Run `setup()` once to create the leads sheet, import CSV, then run `setup()` again to create the log sheet. |

---

## Gmail Sending Quota

Google limits the number of emails you can send per day through Apps Script:

| Account type | Daily limit |
|-------------|-------------|
| **Consumer Gmail** (`@gmail.com`) | ~100 emails/day |
| **Google Workspace** | ~1,500 emails/day |

At 5-minute intervals, the trigger can fire up to **288 times/day** — this exceeds consumer Gmail quota. If you hit the limit:

- Gmail silently stops sending (no error thrown in older GAS runtimes, but `send-error` status will appear in the log for newer ones).
- The trigger continues firing but all sends fail until midnight (UTC) when quota resets.
- **Recommendation:** Use a Google Workspace account for campaigns larger than 100 leads, or increase the trigger interval to `everyMinutes(15)` or `everyHours(1)`.

To change the trigger interval, edit `installTrigger()` in `campaign_engine.gs`:

```javascript
// Example: send every 15 minutes instead of 5
ScriptApp.newTrigger('sendOneEmail').timeBased().everyMinutes(15).create();
```

If multiple campaigns share the same Google account, they share the same quota pool.

---

## Manually Managing Triggers

To remove a stuck or duplicate trigger:

1. Open Apps Script editor.
2. Click the **clock icon** (Triggers) in the left sidebar.
3. Find the `sendOneEmail` trigger and delete it.

Or run `_deleteTrigger()` directly from the editor function dropdown.

To reinstall: run `installTrigger()`.

---

## Retrying Failed Rows

For rows marked `send-error` or `Typo`:

1. Fix the underlying issue (quota, network, wrong email domain).
2. In the Google Sheet, change the Status cell back to `Pending`.
3. Run `installTrigger()` if the trigger was auto-removed.

For rows marked `Invalid`: the email address itself is broken. Get a corrected address from your source data, update the cell, reset Status to `Pending`.

---

## Verifying the Engine is Working

Run these checks in order:

1. **`runTests()`** — opens the Execution Log and shows pass/fail for all helper functions. All should pass.
2. **`sendTest()`** — sends a test email to `testAddr` using the first valid Pending lead's data. Check your inbox.
3. **Send Log sheet** — after sending, verify entries appear with correct firm name, email, and `sent` status.
