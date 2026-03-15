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
  sender: 'davdlaurence.a.cig@gmail.com',
  senderName: 'David Laurence',
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

  // Template
  subject: '(Company/Vendor Name) - Are Your Imports Fully FSVP-Compliant? ...',
  bodyHtml: '<p>Hi [First Name/Company Name],</p>...',

  // Greeting strategy
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

**Key design decisions:**
- `var` instead of `const` to avoid GAS hoisting issues across multiple `.gs` files.
- `columns` is explicit so campaigns can use spreadsheets with different column layouts.
- `banners` is an array so the engine handles any count dynamically.
- `typoDomains` lives in config so each campaign can extend the typo list independently.

## Engine Architecture

### Helpers

| Function | Responsibility |
|----------|---------------|
| `properCase(name)` | Title-cases names, preserving acronyms from `CAMPAIGN_CONFIG.acronyms` |
| `isValidEmail(email)` | Validates email format + detects structural issues |
| `detectTypoDomain(email)` | Checks domain against `CAMPAIGN_CONFIG.typoDomains` |
| `buildEmail(lead)` | Applies template substitutions using config's subject/body + greeting strategy |
| `_getInlineImages()` | Iterates `CAMPAIGN_CONFIG.banners`, fetches blobs from Drive |

### Core

| Function | Responsibility |
|----------|---------------|
| `_doSend(isTest)` | Scans sheet for first valid Pending lead, builds email, sends, logs result. Marks invalid/typo rows. |

### Public API

| Function | What it does |
|----------|-------------|
| `setup()` | Creates log sheet if missing, installs trigger. Run once after CSV import. |
| `sendOneEmail()` | Trigger handler — sends one email per invocation, called every 5 min. |
| `sendTest()` | Sends to `testAddr` without marking lead as Sent. For manual testing. |
| `installTrigger()` | Installs (or reinstalls) the 5-minute time trigger. |
| `_deleteTrigger()` | Internal — removes existing trigger using `CAMPAIGN_CONFIG.name` for identification. |

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

### Status flow
```
Pending → Sent        (success)
Pending → Invalid     (structurally broken — no fix possible)
Pending → Typo        (likely fixable — operator should review)
Pending → send-error  (sending failed at Gmail API level)
```

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
7. Trigger auto-removes when all leads are sent
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

### docs/email-validation-rules.md
- Each validation check with examples
- Full typo domain map with suggested corrections
- How to add new typo patterns
- Status flow diagram
