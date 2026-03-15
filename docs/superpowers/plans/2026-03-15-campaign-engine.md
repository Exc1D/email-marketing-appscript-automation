# Campaign Engine Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor two duplicated GAS email scripts into a shared config-driven engine with improved email validation and full documentation.

**Architecture:** Each GAS project gets two files: `campaign_engine.gs` (shared logic, identical across projects) + `campaign_config.gs` (campaign-specific settings and template). The engine reads from a global `CAMPAIGN_CONFIG` object defined in the config file.

**Tech Stack:** Google Apps Script (V8 runtime), Google Sheets API, Gmail API, Google Drive API

**Spec:** `docs/superpowers/specs/2026-03-15-campaign-engine-design.md`

**Testing note:** GAS has no standard test framework. Pure helper functions (`properCase`, `isValidEmail`, `detectTypoDomain`, `_colLetter`) are tested via a `runTests()` function that uses assertion helpers. `buildEmail` depends on GAS APIs (`Utilities.formatDate`, `Session.getScriptTimeZone`) and cannot be unit-tested in pure form — it is verified via `sendTest()` which exercises the full send path including template substitution. Integration testing is done via `sendTest()` which sends to a test address.

---

## Chunk 1: Engine Helpers + Config Files

### Task 1: Create FSVP campaign config

**Files:**
- Create: `campaigns/fsvp_config.gs`
- Reference: `send_emails_gas.js` (existing, source of truth for template + values)

- [ ] **Step 1: Create `campaigns/fsvp_config.gs`**

Extract all campaign-specific values from `send_emails_gas.js` into the config shape defined in the spec. The full FSVP email template (`TEMPLATE_SUBJECT` and `TEMPLATE_BODY` from the existing file) goes into `subject` and `bodyHtml`.

```javascript
var CAMPAIGN_CONFIG = {
  name: 'FSVP',
  senderName: 'David Laurence',
  cc: 'virginia@consultareinc.com',
  testAddr: 'davidaviado.dla@gmail.com',

  sheetName: 'Leads',
  logSheet: 'Send Log',

  columns: { row: 0, firmName: 1, state: 2, email: 3, phone: 4, contactPerson: 5, status: 6 },

  banners: [
    { cid: 'banner1', driveId: '13iVinLZ2hwDbMn8zdik7bDD59qqDEtqB' },
    { cid: 'banner2', driveId: '1VSqPYsiTomE855fO9LQ4C0G25W2hAmT8' },
    { cid: 'banner3', driveId: '192Ezh2Oz_CiLjDL74p67xe0DWnftql2P' },
  ],

  acronyms: ['LLC','INC','CORP','USA','FDA','CBP','USDA','EPA',
             'IOR','FSVP','CO','LTD','PBC','DBA','LP','NA'],

  subject: '(Company/Vendor Name) - Are Your Imports Fully FSVP-Compliant? End-to-End Support Available - (Date YYYYMMDD - e.g. 20260311)',

  bodyHtml: 'TODO_COPY_FULL_TEMPLATE_BODY_FROM_send_emails_gas_js_LINE_24',
  // ^^^ IMPORTANT: Replace this placeholder with the full TEMPLATE_BODY string
  // from send_emails_gas.js line 24. It is a long HTML string starting with
  // `<p>Hi [First Name/Company Name],</p>` and ending with the unsubscribe notice.
  // Copy the entire backtick-delimited template literal content, wrapped in backticks.

  useContactPerson: true,

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

Note: Copy the **full** `TEMPLATE_BODY` string from `send_emails_gas.js` line 24 into `bodyHtml`. Do not truncate.

- [ ] **Step 2: Commit**

```bash
git add campaigns/fsvp_config.gs
git commit -m "feat: extract FSVP campaign config from monolithic script"
```

---

### Task 2: Create SQF campaign config

**Files:**
- Create: `campaigns/sqf_config.gs`
- Reference: `send_emails_sqf_gas.js` (existing, source of truth for template + values)

- [ ] **Step 1: Create `campaigns/sqf_config.gs`**

Same structure as FSVP but with SQF-specific values:

```javascript
var CAMPAIGN_CONFIG = {
  name: 'SQF',
  senderName: 'David Laurence',
  cc: 'virginia@consultareinc.com',
  testAddr: 'davidaviado.dla@gmail.com',

  sheetName: 'SQF Leads',
  logSheet: 'SQF Send Log',

  columns: { row: 0, firmName: 1, state: 2, email: 3, phone: 4, contactPerson: 5, status: 6 },

  banners: [
    { cid: 'banner1', driveId: '1akcWIReTlaA7fL3C6VuUoe4jDLHWcyvH' },
    { cid: 'banner2', driveId: '1SwKK3jZ0pYpbdjDkrsMikwRG_NgXYhZx' },
  ],

  acronyms: ['LLC','INC','CORP','USA','FDA','CBP','USDA','EPA',
             'IOR','FSVP','SQF','GFSI','ISO','CO','LTD','PBC','DBA','LP','NA'],

  subject: 'TODO_COPY_FULL_TEMPLATE_SUBJECT_FROM_send_emails_sqf_gas_js_LINE_21',
  // ^^^ IMPORTANT: Replace with full TEMPLATE_SUBJECT from send_emails_sqf_gas.js line 21.

  bodyHtml: 'TODO_COPY_FULL_TEMPLATE_BODY_FROM_send_emails_sqf_gas_js_LINE_23',
  // ^^^ IMPORTANT: Replace with full TEMPLATE_BODY from send_emails_sqf_gas.js line 23.
  // Copy the entire backtick-delimited template literal content, wrapped in backticks.

  useContactPerson: false,

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

Note: Copy the **full** `TEMPLATE_SUBJECT` and `TEMPLATE_BODY` strings from `send_emails_sqf_gas.js` lines 21 and 23. Do not truncate.

- [ ] **Step 2: Commit**

```bash
git add campaigns/sqf_config.gs
git commit -m "feat: extract SQF campaign config from monolithic script"
```

---

### Task 3: Create campaign engine — helper functions

**Files:**
- Create: `campaign_engine.gs`

- [ ] **Step 1: Write `properCase(name)`**

```javascript
// ── Helpers ───────────────────────────────────────────────────────────────────

var _acronymSet = new Set(CAMPAIGN_CONFIG.acronyms);

function properCase(name) {
  if (!name) return '';
  return name.split(/(\s+|,)/).map(function(word) {
    var clean = word.replace(/[^A-Za-z]/g, '').toUpperCase();
    if (_acronymSet.has(clean)) return word.toUpperCase();
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }).join('');
}
```

- [ ] **Step 2: Write `isValidEmail(email)`**

New structural checks per spec: leading/trailing dots, consecutive dots, single-char TLD — in addition to existing checks.

```javascript
function isValidEmail(email) {
  if (!email) return false;
  var trimmed = String(email).trim();
  var invalid = ['', 'not found', 'unclear', 'not available'];
  if (invalid.indexOf(trimmed.toLowerCase()) !== -1) return false;
  // Basic format
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return false;
  var parts = trimmed.split('@');
  var local = parts[0];
  var domain = parts[1];
  // Leading/trailing dots in local part
  if (local.charAt(0) === '.' || local.charAt(local.length - 1) === '.') return false;
  // Leading dot in domain
  if (domain.charAt(0) === '.') return false;
  // Trailing dot in domain
  if (domain.charAt(domain.length - 1) === '.') return false;
  // Consecutive dots anywhere
  if (trimmed.indexOf('..') !== -1) return false;
  // Single-char TLD
  var tld = domain.split('.').pop();
  if (tld.length < 2) return false;
  return true;
}
```

- [ ] **Step 3: Write `detectTypoDomain(email)`**

Precondition: `isValidEmail(email)` must have already returned `true`. This function does not defensively check for `@` — calling it with a structurally invalid email will throw.

```javascript
// Precondition: isValidEmail(email) === true (email contains exactly one @)
function detectTypoDomain(email) {
  var domain = String(email).trim().split('@')[1].toLowerCase();
  var suggestion = CAMPAIGN_CONFIG.typoDomains[domain];
  if (suggestion) {
    return { isTypo: true, suggestion: suggestion };
  }
  return { isTypo: false };
}
```

- [ ] **Step 4: Write `_colLetter(colIndex)` utility**

Converts 0-based column index to A1-notation letter (e.g., 6 → 'G'). Needed for batch `getRangeList` calls. **Limitation:** Only supports columns A-Z (indices 0-25). Current configs use index 6 max. If a future campaign needs column AA+, extend this function.

```javascript
// Supports columns A-Z (0-25). Extend for AA+ if needed.
function _colLetter(colIndex) {
  return String.fromCharCode(65 + colIndex);
}
```

- [ ] **Step 5: Write `runTests()` — assertion-based test function**

This function tests all pure helpers. Run manually in the GAS editor to verify.

```javascript
function runTests() {
  var pass = 0;
  var fail = 0;

  function assert(label, actual, expected) {
    if (actual === expected) {
      pass++;
    } else {
      fail++;
      Logger.log('FAIL: ' + label + ' — expected ' + JSON.stringify(expected) + ', got ' + JSON.stringify(actual));
    }
  }

  function assertObj(label, actual, expected) {
    if (JSON.stringify(actual) === JSON.stringify(expected)) {
      pass++;
    } else {
      fail++;
      Logger.log('FAIL: ' + label + ' — expected ' + JSON.stringify(expected) + ', got ' + JSON.stringify(actual));
    }
  }

  // properCase
  assert('properCase: normal name', properCase('john doe'), 'John Doe');
  assert('properCase: acronym', properCase('acme llc'), 'Acme LLC');
  assert('properCase: empty', properCase(''), '');
  assert('properCase: null', properCase(null), '');
  assert('properCase: all caps', properCase('ACME CORP'), 'Acme CORP');
  assert('properCase: with comma', properCase('smith, john'), 'Smith, John');

  // isValidEmail — valid
  assert('email: valid', isValidEmail('user@example.com'), true);
  assert('email: valid with dots', isValidEmail('user.name@example.com'), true);
  assert('email: valid subdomain', isValidEmail('user@mail.example.com'), true);

  // isValidEmail — invalid structural
  assert('email: empty string', isValidEmail(''), false);
  assert('email: null', isValidEmail(null), false);
  assert('email: not found', isValidEmail('not found'), false);
  assert('email: unclear', isValidEmail('Unclear'), false);
  assert('email: no @', isValidEmail('userexample.com'), false);
  assert('email: no domain', isValidEmail('user@'), false);
  assert('email: no TLD', isValidEmail('user@domain'), false);
  assert('email: trailing dot', isValidEmail('user@domain.'), false);
  assert('email: leading dot local', isValidEmail('.user@domain.com'), false);
  assert('email: trailing dot local', isValidEmail('user.@domain.com'), false);
  assert('email: leading dot domain', isValidEmail('user@.domain.com'), false);
  assert('email: consecutive dots local', isValidEmail('user..name@domain.com'), false);
  assert('email: consecutive dots domain', isValidEmail('user@domain..com'), false);
  assert('email: single char TLD', isValidEmail('user@domain.c'), false);
  assert('email: spaces', isValidEmail('user @domain.com'), false);
  assert('email: not available', isValidEmail('not available'), false);

  // detectTypoDomain
  assertObj('typo: gmail misspell', detectTypoDomain('user@gmial.com'), { isTypo: true, suggestion: 'gmail.com' });
  assertObj('typo: yahoo misspell', detectTypoDomain('user@yaho.com'), { isTypo: true, suggestion: 'yahoo.com' });
  assertObj('typo: valid domain', detectTypoDomain('user@gmail.com'), { isTypo: false });
  assertObj('typo: outlook misspell', detectTypoDomain('user@outlok.com'), { isTypo: true, suggestion: 'outlook.com' });

  // _colLetter
  assert('colLetter: 0 = A', _colLetter(0), 'A');
  assert('colLetter: 6 = G', _colLetter(6), 'G');
  assert('colLetter: 25 = Z', _colLetter(25), 'Z');

  Logger.log('Tests complete: ' + pass + ' passed, ' + fail + ' failed.');
}
```

- [ ] **Step 6: Commit**

```bash
git add campaign_engine.gs
git commit -m "feat: add campaign engine helpers with tests (properCase, isValidEmail, detectTypoDomain)"
```

---

## Chunk 2: Engine Core + Public API

### Task 4: Add buildEmail and _getInlineImages to engine

**Files:**
- Modify: `campaign_engine.gs`

- [ ] **Step 1: Write `buildEmail(lead)`**

Add after the helpers section. Implements template token replacement per spec.

```javascript
// ── Email builder ─────────────────────────────────────────────────────────────

function buildEmail(lead) {
  var company = properCase(lead.firmName);
  var contactRaw = (lead.contactPerson || '').trim();
  var greeting;
  if (CAMPAIGN_CONFIG.useContactPerson && contactRaw) {
    greeting = properCase(contactRaw.split(' ')[0]);
  } else {
    greeting = company;
  }
  var today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd');

  var subject = CAMPAIGN_CONFIG.subject;
  var bodyHtml = CAMPAIGN_CONFIG.bodyHtml;

  // Subject replacements
  subject = subject.replace('(Company/Vendor Name)', company);
  subject = subject.replace(/\(Date YYYYMMDD[^)]*\)/g, today);
  subject = subject.replace(/\u00a0/g, ' ').trim();

  // Body replacements
  bodyHtml = bodyHtml.replace(/\[First Name\/Company Name\]/g, greeting);
  bodyHtml = bodyHtml.replace(/\(Company\/Vendor Name\)/g, company);
  bodyHtml = bodyHtml.replace(/\(Date YYYYMMDD[^)]*\)/g, today);

  return { subject: subject, bodyHtml: bodyHtml };
}
```

- [ ] **Step 2: Write `_getInlineImages()`**

```javascript
function _getInlineImages() {
  var images = {};
  CAMPAIGN_CONFIG.banners.forEach(function(b) {
    images[b.cid] = DriveApp.getFileById(b.driveId).getBlob();
  });
  return images;
}
```

- [ ] **Step 3: Commit**

```bash
git add campaign_engine.gs
git commit -m "feat: add buildEmail and _getInlineImages to campaign engine"
```

---

### Task 5: Add _doSend core logic to engine

**Files:**
- Modify: `campaign_engine.gs`

- [ ] **Step 1: Write `_doSend(isTest)`**

The core send function. Implements the full scan-loop from the spec: full-pass validation, batch writes, send, trigger management.

```javascript
// ── Core send ─────────────────────────────────────────────────────────────────

function _doSend(isTest) {
  var cfg = CAMPAIGN_CONFIG;
  var cols = cfg.columns;
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(cfg.sheetName);
  var logSheet = ss.getSheetByName(cfg.logSheet);

  if (!sheet) throw new Error('Sheet "' + cfg.sheetName + '" not found. Run setup() first.');
  if (!logSheet) throw new Error('Sheet "' + cfg.logSheet + '" not found. Run setup() first.');

  var data = sheet.getDataRange().getValues();
  var statusColLetter = _colLetter(cols.status);
  var lead = null;
  var targetRowIdx = -1;
  var validPendingCount = 0;
  var invalidRanges = [];
  var typoRanges = [];
  var typoLogEntries = [];
  var timestamp = new Date().toISOString();

  // Scan all Pending rows
  for (var i = 1; i < data.length; i++) {
    var rowData = data[i];
    var status = rowData[cols.status];
    if (status !== 'Pending') continue;

    var email = String(rowData[cols.email]);
    var firmName = rowData[cols.firmName];
    var sheetRow = i + 1; // 1-based

    // (1) Structural validation
    if (!isValidEmail(email)) {
      invalidRanges.push(statusColLetter + sheetRow);
      continue;
    }

    // (2) Typo detection
    var typoResult = detectTypoDomain(email);
    if (typoResult.isTypo) {
      typoRanges.push(statusColLetter + sheetRow);
      typoLogEntries.push([timestamp, rowData[cols.row], firmName, email, 'typo: suggested ' + typoResult.suggestion]);
      continue;
    }

    // (3) Eligible for sending — count ALL valid rows including the send target
    validPendingCount++;
    if (lead === null) {
      targetRowIdx = sheetRow;
      lead = {
        row: rowData[cols.row],
        firmName: firmName,
        state: rowData[cols.state],
        email: email,
        phone: rowData[cols.phone],
        contactPerson: rowData[cols.contactPerson],
      };
    }
  }

  // Batch-write statuses + log typos
  try {
    if (invalidRanges.length > 0) {
      sheet.getRangeList(invalidRanges).setValue('Invalid');
    }
    if (typoRanges.length > 0) {
      sheet.getRangeList(typoRanges).setValue('Typo');
    }
    typoLogEntries.forEach(function(entry) {
      logSheet.appendRow(entry);
    });
  } catch (e) {
    Logger.log('[' + cfg.name + '] Batch-write error: ' + e.message);
    return;
  }

  // No valid target found
  if (lead === null) {
    Logger.log('[' + cfg.name + '] No pending leads.' + (isTest ? '' : ' Removing trigger.'));
    if (!isTest) _deleteTrigger();
    return;
  }

  // Build and send
  var email_ = buildEmail(lead);
  var toAddr = isTest ? cfg.testAddr : String(lead.email).trim();
  var inlineImages = _getInlineImages();

  try {
    GmailApp.sendEmail(toAddr, email_.subject, '', {
      htmlBody: email_.bodyHtml,
      cc: isTest ? '' : cfg.cc,
      name: cfg.senderName,
      inlineImages: inlineImages,
    });
  } catch (e) {
    sheet.getRange(targetRowIdx, cols.status + 1).setValue('send-error');
    logSheet.appendRow([timestamp, lead.row, lead.firmName, toAddr, 'send-error: ' + e.message]);
    Logger.log('[' + cfg.name + '] Send error: ' + e.message);
    return;
  }

  // Mark sent (not in test mode)
  if (!isTest) {
    sheet.getRange(targetRowIdx, cols.status + 1).setValue('Sent');
  }

  logSheet.appendRow([timestamp, lead.row, lead.firmName, toAddr, isTest ? 'test-sent' : 'sent']);
  Logger.log('[' + cfg.name + '] ' + (isTest ? '[TEST] ' : '') + 'Sent to ' + toAddr + ' (' + lead.firmName + ')');

  // Auto-remove trigger when no pending leads remain
  if (!isTest) {
    var remaining = validPendingCount - 1;
    if (remaining === 0) {
      Logger.log('[' + cfg.name + '] All leads sent. Removing trigger.');
      _deleteTrigger();
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add campaign_engine.gs
git commit -m "feat: add _doSend core logic with batch writes and typo detection"
```

---

### Task 6: Add public API and trigger management to engine

**Files:**
- Modify: `campaign_engine.gs`

- [ ] **Step 1: Write public API functions**

```javascript
// ── Public API ────────────────────────────────────────────────────────────────

/** Called by time trigger every 5 min. */
function sendOneEmail() { _doSend(false); }

/** Run manually to test. Sends to testAddr, does NOT mark lead Sent. */
function sendTest() { _doSend(true); }

/** Install (or re-install) the 5-minute trigger. */
function installTrigger() {
  _deleteTrigger();
  ScriptApp.newTrigger('sendOneEmail').timeBased().everyMinutes(5).create();
  Logger.log('[' + CAMPAIGN_CONFIG.name + '] Trigger installed: sendOneEmail every 5 minutes.');
}

/** One-time setup: creates Send Log sheet. Run after importing CSV. */
function setup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var cfg = CAMPAIGN_CONFIG;

  if (!ss.getSheetByName(cfg.sheetName)) {
    ss.insertSheet(cfg.sheetName);
    Logger.log('[' + cfg.name + '] Created "' + cfg.sheetName + '" sheet. Import the CSV now, then run setup() again.');
    return;
  }

  if (!ss.getSheetByName(cfg.logSheet)) {
    var log = ss.insertSheet(cfg.logSheet);
    log.getRange(1, 1, 1, 5).setValues([['Timestamp', 'Row', 'Firm', 'To', 'Status']]);
  }

  Logger.log('[' + cfg.name + '] Setup complete. Run sendTest() to verify, then installTrigger() to begin sending.');
}

// ── Internal ──────────────────────────────────────────────────────────────────

function _deleteTrigger() {
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === 'sendOneEmail') ScriptApp.deleteTrigger(t);
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add campaign_engine.gs
git commit -m "feat: add public API (setup, sendTest, installTrigger) — setup no longer auto-installs trigger"
```

---

## Chunk 3: Documentation

### Task 7: Write README.md

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Rewrite README.md**

Replace existing README with project overview, file layout, quickstart, and links to docs.

Content should cover:
- What: Config-driven email campaign engine for Google Apps Script
- Who: Consultare Inc. Group compliance email campaigns
- Layout: File tree matching spec's Repository Layout section
- Quickstart: Link to `docs/workflow.md`
- New campaign: Link to `docs/new-campaign-guide.md`

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: rewrite README with project overview and quickstart links"
```

---

### Task 8: Write workflow.md

**Files:**
- Create: `docs/workflow.md`

- [ ] **Step 1: Write `docs/workflow.md`**

Step-by-step operational guide matching the spec's workflow section (8 steps). Include:
- CSV preparation (required columns: Row#, Firm Name, State, Email, Phone, Contact Person, Status)
- All Status column values must be `Pending` for new leads
- How to run `setup()`, `sendTest()`, `installTrigger()` from GAS editor
- How to monitor Send Log
- How to handle Typo and Invalid rows

- [ ] **Step 2: Commit**

```bash
git add docs/workflow.md
git commit -m "docs: add day-to-day operational workflow guide"
```

---

### Task 9: Write new-campaign-guide.md

**Files:**
- Create: `docs/new-campaign-guide.md`

- [ ] **Step 1: Write `docs/new-campaign-guide.md`**

Step-by-step guide for developers creating a new campaign. Include:
- Creating a new Google Sheet
- Opening the Apps Script editor
- Copying `campaign_engine.gs`
- Creating config file with all fields documented
- Getting Drive file IDs for banner images
- Running `setup()` and `sendTest()`
- Full `CAMPAIGN_CONFIG` reference table with field descriptions and types

- [ ] **Step 2: Commit**

```bash
git add docs/new-campaign-guide.md
git commit -m "docs: add new campaign creation guide with full config reference"
```

---

### Task 10: Write troubleshooting.md

**Files:**
- Create: `docs/troubleshooting.md`

- [ ] **Step 1: Write `docs/troubleshooting.md`**

Symptom → Cause → Fix table from spec, plus:
- Gmail quota section (100/day consumer, 1500/day Workspace, 288 max at 5-min intervals)
- How to manually remove a stuck trigger
- How to retry send-error rows

- [ ] **Step 2: Commit**

```bash
git add docs/troubleshooting.md
git commit -m "docs: add troubleshooting guide with quota info and common issues"
```

---

### Task 11: Write email-validation-rules.md

**Files:**
- Create: `docs/email-validation-rules.md`

- [ ] **Step 1: Write `docs/email-validation-rules.md`**

Content:
- Each structural validation check with pass/fail examples
- The full typo domain map with suggested corrections
- How to add new typo patterns to a campaign config
- Status flow diagram (Pending → Sent / Invalid / Typo / send-error)

- [ ] **Step 2: Commit**

```bash
git add docs/email-validation-rules.md
git commit -m "docs: add email validation rules and status flow documentation"
```

---

## Chunk 4: Migration + Cleanup

### Task 12: Remove old monolithic script files

**Files:**
- Delete: `send_emails_gas.js`
- Delete: `send_emails_sqf_gas.js`

**Prerequisite:** Tasks 1-6 complete (engine + configs verified).

- [ ] **Step 1: Verify new files exist and contain complete code**

```bash
ls -la campaign_engine.gs campaigns/fsvp_config.gs campaigns/sqf_config.gs
```

Expected: All three files present.

- [ ] **Step 2: Delete old files**

```bash
git rm send_emails_gas.js send_emails_sqf_gas.js
```

- [ ] **Step 3: Commit**

```bash
git commit -m "chore: remove old monolithic scripts — replaced by campaign_engine.gs + config pattern"
```
