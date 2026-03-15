# New Campaign Guide

How to create a new email campaign from scratch using the shared engine.

---

## Step 1: Create a New Google Sheet

1. Go to [Google Sheets](https://sheets.google.com) and create a new spreadsheet.
2. Name it clearly (e.g., `ISO Compliance Campaign`).
3. Rename the first sheet tab to match the `sheetName` you'll use in config (e.g., `ISO Leads`).

---

## Step 2: Open the Apps Script Editor

1. In the Google Sheet, go to **Extensions → Apps Script**.
2. You'll see a default `Code.gs` file. Delete its contents.

---

## Step 3: Copy `campaign_engine.gs`

1. In the Apps Script editor, click **+** next to "Files" to add a new script file.
2. Name it `campaign_engine`.
3. Copy the entire contents of `campaign_engine.gs` from this repository into it.

---

## Step 4: Create Your Config File

1. Click **+** again and name the new file `campaign_config`.
2. Use the template below, filling in your campaign-specific values.

```javascript
var CAMPAIGN_CONFIG = {
  name: 'ISO',                            // Short name — used in log messages
  senderName: 'David Laurence',           // Display name for sent emails
  cc: 'virginia@consultareinc.com',       // CC address (omit or leave blank to disable)
  testAddr: 'davidaviado.dla@gmail.com',  // Where sendTest() sends to

  sheetName: 'ISO Leads',                 // Name of the leads sheet tab
  logSheet: 'ISO Send Log',               // Name of the log sheet tab (created by setup())

  // 0-based column indices — must match your CSV column order
  columns: { row: 0, firmName: 1, state: 2, email: 3, phone: 4, contactPerson: 5, status: 6 },

  // Banner images — upload to Google Drive, then paste the file ID from the sharing URL
  banners: [
    { cid: 'banner1', driveId: 'YOUR_DRIVE_FILE_ID_HERE' },
    { cid: 'banner2', driveId: 'YOUR_DRIVE_FILE_ID_HERE' },
  ],

  // Acronyms to preserve in proper-casing (always uppercase)
  acronyms: ['LLC','INC','CORP','USA','FDA','CBP','USDA','EPA',
             'ISO','IOR','CO','LTD','PBC','DBA','LP','NA'],

  // Email subject — use placeholder tokens (see below)
  subject: '(Company/Vendor Name) - Your Subject Line Here - (Date YYYYMMDD - e.g. 20260311)',

  // Email body HTML — use placeholder tokens (see below)
  bodyHtml: `<p>Hi [First Name/Company Name],</p><p>Your email body here...</p>`,

  // true = use contact person's first name for greeting (if available), else company name
  // false = always use company name
  useContactPerson: false,

  // Domain typo detection map — extend as needed
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

### Template Placeholder Tokens

Use these tokens in your `subject` and `bodyHtml` — the engine replaces them at send time:

| Token | Replaced with |
|-------|---------------|
| `(Company/Vendor Name)` | Proper-cased company name |
| `[First Name/Company Name]` | Greeting (first name or company, per `useContactPerson`) |
| `(Date YYYYMMDD...)` | Today's date as `yyyyMMdd` (e.g., `20260315`) |

---

## Step 5: Get Banner Image Drive File IDs

1. Upload your banner images to Google Drive.
2. Right-click each file → **Share** → **Copy link**.
3. The link looks like: `https://drive.google.com/file/d/1abc...XYZ/view?usp=sharing`
4. The file ID is the string between `/d/` and `/view` — copy it into `driveId`.
5. Set sharing to **Anyone with the link** → **Viewer**.

---

## Step 6: Run `setup()`

1. In the Apps Script editor, select `setup` from the function dropdown.
2. Click **Run** and authorize when prompted.
3. Check the Execution Log — you should see: `Setup complete. Run sendTest() to verify...`

---

## Step 7: Import Leads CSV and Run `sendTest()`

1. Import your CSV into the leads sheet tab (see [workflow.md](workflow.md) Step 1-2).
2. Select `sendTest` and click **Run**.
3. Check your test inbox — verify name casing, date, images, links.

---

## Step 8: Run `installTrigger()` to Begin Sending

Once satisfied with the test:

1. Select `installTrigger` and click **Run**.
2. The campaign will send one email every 5 minutes automatically.

---

## CAMPAIGN_CONFIG Field Reference

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Short campaign identifier. Used in log messages and execution logs. |
| `senderName` | string | Yes | Display name shown in the recipient's email client. GAS always sends from the authenticated account's address. |
| `cc` | string | No | CC address for all sent emails. Pass empty string `''` to disable. |
| `testAddr` | string | Yes | Email address used by `sendTest()`. Should be your own address. |
| `sheetName` | string | Yes | Exact name of the Google Sheet tab containing your leads. |
| `logSheet` | string | Yes | Exact name of the Send Log sheet tab. Created by `setup()` if missing. |
| `columns` | object | Yes | 0-based column indices. Must match your spreadsheet's column order. |
| `banners` | array | Yes | List of `{cid, driveId}` objects. `cid` is referenced in email HTML as `src="cid:banner1"`. |
| `acronyms` | array | Yes | Words that should always be ALL CAPS in proper-casing (e.g., LLC, FDA). |
| `subject` | string | Yes | Email subject line with placeholder tokens. |
| `bodyHtml` | string | Yes | Full HTML email body with placeholder tokens. |
| `useContactPerson` | boolean | Yes | `true` = use first name from Contact Person column for greeting; `false` = always use company name. |
| `typoDomains` | object | Yes | Map of misspelled domain → correct domain. Add entries for common typos in your lead sources. |
