# Campaign Engine Design Spec

**Date:** 2026-03-15
**Status:** Approved
**Approach:** Config-Driven Engine (Approach A)

## Problem

Two Google Apps Script files (`send_emails_gas.js` for FSVP, `send_emails_sqf_gas.js` for SQF) share ~80% identical code. Each lives in a separate GAS project bound to its own spreadsheet. More campaign types are planned. The current duplication makes maintenance error-prone and scaling tedious.

## Solution

Split each GAS project into two files:
- **`campaign_engine.gs`** — all shared logic, identical across projects.
- **`campaign_config.gs`** — campaign-specific configuration and email template.

This git repository holds the master copies. Each GAS project gets the engine copied in plus its own config.

## Repository Layout

```
email-marketing-appscript-automation/
├── campaign_engine.gs              # Shared logic — copy into each GAS project
├── campaigns/
│   ├── fsvp_config.gs              # FSVP campaign config + template
│   └── sqf_config.gs               # SQF campaign config + template
├── docs/
│   ├── workflow.md                  # Step-by-step operational workflow
│   ├── new-campaign-guide.md        # How to create a new campaign from scratch
│   ├── troubleshooting.md           # Common issues & fixes
│   └── email-validation-rules.md    # What gets flagged as invalid and why
└── README.md                        # Project overview + quickstart
```

## Campaign Config Shape

Every campaign config file defines one global `CAMPAIGN_CONFIG` object:

```javascript
var CAMPAIGN_CONFIG = {
  // Identity
  name: 'FSVP',
  senderName: 'David Laurence',   // Used as the display name in GmailApp.sendEmail's `name` option
                                   // Note: GAS always sends from the authenticated account's address.
                                   // To send from an alias, configure it in Gmail Settings > Accounts first.
  cc: 'virginia@consultareinc.com',
  testAddr: 'davidaviado.dla@gmail.com',

  // Sheets
  sheetName: 'Leads',
  logSheet: 'Send Log',

  // Columns (0-indexed)
  columns: { row: 0, firmName: 1, state: 2, email: 3, phone: 4, contactPerson: 5, status: 6 },

  // Banner images (Drive file IDs) — variable length
  banners: [
    { cid: 'banner1', driveId: '13iVinLZ2hwDbMn8zdik7bDD59qqDEtqB' },
    { cid: 'banner2', driveId: '1VSqPYsiTomE855fO9LQ4C0G25W2hAmT8' },
    { cid: 'banner3', driveId: '192Ezh2Oz_CiLjDL74p67xe0DWnftql2P' },
  ],

  // Acronyms to preserve in proper-casing
  acronyms: ['LLC','INC','CORP','USA','FDA','CBP','USDA','EPA',
             'IOR','FSVP','CO','LTD','PBC','DBA','LP','NA'],

  // Template (see "Template Placeholder Tokens" section below for required tokens)
  subject: '(Company/Vendor Name) - Are Your Imports Fully FSVP-Compliant? ... - (Date YYYYMMDD - e.g. 20260311)',
  bodyHtml: '<p>Hi [First Name/Company Name],</p>...',

  // Greeting strategy:
  // If true and contactPerson is non-empty, use the first word of contactPerson
  // (proper-cased) as the greeting. Otherwise, fall back to company name.
  useContactPerson: true,

  // Typo domain detection map
  typoDomains: {
    'gmial.com': 'gmail.com',
    'gmil.com': 'gmail.com',
    'gmal.com': 'gmail.com',
    'gamil.com': 'gmail.com',
    'yaho.com': 'yahoo.com',
    'yahooo.com': 'yahoo.com',
    'outlok.com': 'outlook.com',
    'hotmal.com': 'hotmail.com',
    'hotmial.com': 'hotmail.com',
  },
};
```

**SQF config differences from FSVP:** The SQF campaign uses `name: 'SQF'`, `sheetName: 'SQF Leads'`, `logSheet: 'SQF Send Log'`, `useContactPerson: false` (always uses company name for greeting), 2 banners instead of 3, and additional acronyms (`'SQF','GFSI','ISO'`). Both campaigns currently share the same `senderName`, `cc`, and `testAddr`.

**Key design decisions:**
- `var` instead of `const` to avoid GAS hoisting issues across multiple `.gs` files.
- `columns` is explicit so campaigns can use spreadsheets with different column layouts. The engine reads column values via `data[i][CAMPAIGN_CONFIG.columns.email]` etc., replacing the current positional array destructuring.
- `banners` is an array so the engine handles any count dynamically.
- `acronyms` is stored as an array in config; the engine converts it to a `Set` internally at the top of `properCase()` for O(1) lookup: `var _acronymSet = new Set(CAMPAIGN_CONFIG.acronyms)`.
- `typoDomains` lives in config so each campaign can extend the typo list independently.
- `sender` is intentionally omitted — GAS always sends from the authenticated Google account. To send from a different address, configure a Gmail alias.

## Engine Architecture

### Helpers

| Function | Responsibility |
|----------|---------------|
| `properCase(name)` | Title-cases names. Converts `CAMPAIGN_CONFIG.acronyms` array to a `Set` internally for O(1) lookup. |
| `isValidEmail(email)` | **New structural checks** (not in current code): leading/trailing dots in local part, leading dot in domain, consecutive dots, single-char TLD. These are additions to the existing regex + placeholder checks. Returns `false` for structurally broken emails. |
| `detectTypoDomain(email)` | Extracts domain after `@`, checks against `CAMPAIGN_CONFIG.typoDomains` map. Returns `{ isTypo: true, suggestion: 'gmail.com' }` or `{ isTypo: false }`. Assumes `isValidEmail` has already passed (email contains exactly one `@`), so no defensive `@` check needed. |
| `buildEmail(lead)` | Applies template substitutions. Uses `CAMPAIGN_CONFIG.senderName` for the `name` option in `GmailApp.sendEmail`. Greeting logic: if `CAMPAIGN_CONFIG.useContactPerson` is `true` and `lead.contactPerson` is non-empty, uses first word of contactPerson (proper-cased); otherwise uses company name. |
| `_getInlineImages()` | Iterates `CAMPAIGN_CONFIG.banners` array, calls `DriveApp.getFileById(b.driveId).getBlob()` for each, returns `{ banner1: blob, banner2: blob, ... }`. |

### Core

| Function | Responsibility |
|----------|---------------|
| `_doSend(isTest)` | Scans **all** Pending rows in a single pass — this is an intentional behavior change from the current code, which stops validating rows after finding the first valid lead. The engine validates every Pending row so that one trigger invocation surfaces all Invalid/Typo rows, not just those before the first valid lead. The operator may see many status changes after a single trigger fire; this is expected and documented in the workflow. **Scan loop:** For each Pending row — (1) run `isValidEmail`, if invalid collect `{ rowIdx, status: 'Invalid' }`; (2) else run `detectTypoDomain`, if typo collect `{ rowIdx, status: 'Typo', email, firmName, suggestion }`; (3) else if no send target yet, assign as send target; else track as `validPendingCount++`. **After the loop:** (a) Batch-write Invalid statuses: build A1-notation array (e.g., `['G5','G12','G47']`) and call `sheet.getRangeList(invalidRanges).setValue('Invalid')`. Separately batch-write Typo statuses: `sheet.getRangeList(typoRanges).setValue('Typo')`. Two calls, one per status value. (b) Write log entries for all typo rows: `logSheet.appendRow([timestamp, row, firmName, email, 'typo: suggested ' + suggestion])` for each. (c) Wrap batch-write + log steps in try/catch — on failure, log the batch-write error and return early (no send attempt). (d) If `lead === null` (no valid target found), log "No pending leads", remove trigger if `!isTest`, and return. (e) Build email via `buildEmail(lead)`, fetch images via `_getInlineImages()`, send via `GmailApp.sendEmail`. On send failure, write `send-error` to status column and log. (f) **Remaining-pending check:** use `validPendingCount - 1` (the target was one of the valid rows) instead of a separate `getValues().filter()` API call. If zero remaining, remove trigger. |

### Public API

| Function | What it does |
|----------|-------------|
| `setup()` | Creates log sheet if missing. Does **not** auto-install the trigger (behavior change from current code). The operator runs `sendTest()` first, then calls `installTrigger()` manually. |
| `sendOneEmail()` | Trigger handler — sends one email per invocation, called every 5 min. |
| `sendTest()` | Sends to `testAddr` without marking lead as Sent. For manual testing. |
| `installTrigger()` | Installs (or reinstalls) the 5-minute time trigger. |
| `_deleteTrigger()` | Internal — removes existing trigger by matching handler function name `'sendOneEmail'` via `ScriptApp.getProjectTriggers()`. `CAMPAIGN_CONFIG.name` is used only in log messages, not for trigger identification. |

## Template Placeholder Tokens

The engine's `buildEmail` function performs these search-and-replace operations on `subject` and `bodyHtml`. Config authors **must** use these exact tokens in their templates:

| Token | Replaced with | Used in |
|-------|---------------|---------|
| `(Company/Vendor Name)` | Proper-cased company name | Subject and body |
| `[First Name/Company Name]` | Greeting (contact first name or company, per `useContactPerson`) | Body only |
| `(Date YYYYMMDD...)` | Today's date as `yyyyMMdd` (regex matches any text between parens starting with `Date YYYYMMDD`) | Subject and body |

Non-breaking spaces (`\u00a0`) in the subject are normalized to regular spaces after replacements.

## Performance

### Batch status writes
The current code calls `sheet.getRange(row, col).setValue()` per invalid row inside the scan loop. Each call is a separate Sheets API round-trip (~200-500ms). For large lead lists (500+ rows), this risks hitting the 6-minute GAS execution limit.

The engine collects all status updates during the scan loop, grouped by status value. After the loop, it makes two batch-write calls:

1. `sheet.getRangeList(['G5','G12','G47']).setValue('Invalid')` — all Invalid rows in one call.
2. `sheet.getRangeList(['G8','G23']).setValue('Typo')` — all Typo rows in one call.

`getRangeList()` accepts an array of **A1-notation strings**. The engine constructs these from the status column letter (derived from `CAMPAIGN_CONFIG.columns.status`) and the 1-based row index. `RangeList.setValue()` sets the **same value** across all ranges in the list, which is exactly what we need since all Invalid rows get the same string.

This reduces API calls from O(n) to O(1) per status type (2 calls total).

## Email Validation

### Structural checks (mark as `Invalid`)
- Empty/null values
- Placeholder strings: `"not found"`, `"unclear"`, `"not available"`
- Trailing dots: `user@domain.`
- Leading/trailing dots in local part: `.user@domain.com`, `user.@domain.com`
- Leading dot in domain: `user@.domain.com`
- Consecutive dots: `user..name@domain.com`, `user@domain..com`
- Single-character TLD: `user@domain.c`
- Basic format regex: `^[^\s@]+@[^\s@]+\.[^\s@]+$`

### Typo detection (mark as `Typo`)
- Domain matched against `CAMPAIGN_CONFIG.typoDomains` map
- Log entry includes the suggested correction

### Validation precedence in `_doSend`
1. **Structural validation first** (`isValidEmail`) — if it fails, mark `Invalid`. Stop.
2. **Typo detection second** (`detectTypoDomain`) — if typo found, mark `Typo` and log suggested correction. Stop.
3. If both pass, the row is eligible for sending.

### Status flow
```
Pending → Sent        (success)
Pending → Invalid     (structurally broken — no fix possible)
Pending → Typo        (likely fixable — operator should review and correct)
Pending → send-error  (Gmail API failure — written to status column to prevent infinite retry)
```

**`send-error` behavior change:** The current code only logs send errors without updating the status column, causing failed rows to be retried indefinitely. The engine will now write `send-error` to the status column. To retry, the operator resets status to `Pending` after investigating.

## Migration Plan

The existing files (`send_emails_gas.js`, `send_emails_sqf_gas.js`) will be **removed** from the repository after the new engine + config files are verified working. Migration steps:

1. Create `campaign_engine.gs` and both config files in the repo.
2. For each GAS project: replace the existing single `.js` file with the engine + config pair.
3. Run `sendTest()` in each project to verify.
4. Once confirmed, delete the old `.js` files from the repo in a separate commit.

## Operational Notes

### Gmail sending quota
- **Consumer Gmail:** 100 emails/day
- **Google Workspace:** 1,500 emails/day
- At 5-minute intervals, the trigger can send up to 288 emails/day — this exceeds consumer quota.
- If campaigns share a Gmail account, they share the quota.
- The troubleshooting doc will include quota guidance and symptoms of hitting the limit.

## Documentation

### README.md
- Project overview (one paragraph)
- Repository file layout
- Quickstart link to workflow.md
- New campaign link to new-campaign-guide.md

### docs/workflow.md — Day-to-day operations
1. Prepare CSV (required columns, formatting tips)
2. Import CSV into campaign's Google Sheet
3. Run `setup()` from Apps Script editor
4. Run `sendTest()` to verify with test email
5. Confirm test → run `installTrigger()`
6. Monitor Send Log sheet for progress
7. Trigger auto-removes when all leads are sent (or all remaining are Invalid/Typo)
8. Review Typo and Invalid rows, fix and re-mark as Pending if needed

### docs/new-campaign-guide.md — Creating a new campaign
1. Create a new Google Sheet
2. Open Apps Script editor (Extensions > Apps Script)
3. Copy `campaign_engine.gs` from this repo
4. Create a new file for config
5. Fill in `CAMPAIGN_CONFIG` (all fields documented)
6. Upload banner images to Drive, grab file IDs
7. Run `setup()`, then `sendTest()`
8. Full config reference table

### docs/troubleshooting.md

| Symptom | Cause | Fix |
|---------|-------|-----|
| "No pending leads" but rows exist | Status column not "Pending" | Check column values |
| Emails not sending | Trigger not installed or quota exceeded | Run `installTrigger()`, check Gmail quota |
| "Sheet not found" error | Sheet name mismatch | Fix `sheetName`/`logSheet` in config |
| Banner images broken | Wrong Drive ID or permissions | Verify IDs, set "Anyone with link" |
| All rows marked Invalid | Email column index wrong | Check `columns.email` |
| Rows marked Typo | Domain typo detected | Correct email, reset to Pending |
| Trigger keeps firing after all leads processed | All remaining rows are Invalid/Typo, no valid Pending leads | Trigger auto-removes when `validPendingCount` reaches 0. If stuck, run `_deleteTrigger()` manually. |

### docs/email-validation-rules.md
- Each validation check with examples
- Full typo domain map with suggested corrections
- How to add new typo patterns
- Status flow diagram
