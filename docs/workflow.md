# Day-to-Day Workflow

This guide covers the full lifecycle of sending an email campaign batch, from CSV import to completion.

---

## Step 1: Prepare Your CSV

Your CSV must have these columns **in this exact order**:

| Column | Header (suggested) | Description |
|--------|-------------------|-------------|
| A | Row # | Unique row identifier (number) |
| B | Firm Name | Company or organization name |
| C | State | State/province |
| D | Email | Recipient email address |
| E | Phone | Phone number |
| F | Contact Person | Contact name (optional) |
| G | Status | **Must be `Pending` for all new leads** |

**Important:** Every new lead must have `Pending` in the Status column before import. Rows with any other value (blank, Sent, etc.) will be skipped.

---

## Step 2: Import CSV into the Google Sheet

1. Open the campaign's Google Sheet.
2. Click the sheet tab for your leads (e.g., `Leads` or `SQF Leads`).
3. Go to **File → Import → Upload** and select your CSV.
4. Choose **Replace current sheet** (if re-importing) or **Insert new sheet(s)**.
5. Confirm the column order matches the table above.

---

## Step 3: Run `setup()`

1. Open **Extensions → Apps Script** from the Google Sheet.
2. In the editor, select `setup` from the function dropdown.
3. Click **Run**.
4. Check the **Execution Log** — you should see: `Setup complete. Run sendTest() to verify...`

`setup()` creates the Send Log sheet if it doesn't exist. It does **not** start sending.

---

## Step 4: Run `sendTest()` to Verify

1. Select `sendTest` from the function dropdown.
2. Click **Run**.
3. Check your test inbox (`testAddr` in config) — you should receive a fully rendered email.
4. Verify: company name is properly cased, date is correct, banner images display, links work.

If the test email looks wrong, fix the config or template before proceeding.

---

## Step 5: Install the Trigger to Begin Sending

Once you're satisfied with the test email:

1. Select `installTrigger` from the function dropdown.
2. Click **Run**.
3. Check the Execution Log: `Trigger installed: sendOneEmail every 5 minutes.`

The trigger fires `sendOneEmail()` every 5 minutes, sending one email per invocation.

---

## Step 6: Monitor the Send Log

Open the **Send Log** sheet tab (e.g., `Send Log` or `SQF Send Log`). Each row shows:

| Timestamp | Row | Firm | To | Status |
|-----------|-----|------|----|--------|
| 2026-03-15T10:00:00Z | 1 | Acme LLC | buyer@acme.com | sent |
| 2026-03-15T10:05:00Z | 3 | Beta Corp | mgr@beta.com | typo: suggested gmail.com |

Also watch the **Status column** in your Leads sheet — rows will change from `Pending` to `Sent`, `Invalid`, `Typo`, or `send-error`.

---

## Step 7: Trigger Auto-Removes When Done

When all valid Pending leads have been sent (or all remaining rows are `Invalid`/`Typo`), the trigger removes itself automatically. You'll see in the Execution Log: `All leads sent. Removing trigger.`

---

## Step 8: Review Typo and Invalid Rows

After sending completes, review any rows marked `Typo` or `Invalid`:

**Typo rows:** The email domain looks like a misspelling (e.g., `@gmial.com`). Check the Send Log for the suggested correction. Fix the email in the sheet, then reset Status to `Pending` and run `installTrigger()` again to process remaining rows.

**Invalid rows:** The email is structurally broken (no `@`, placeholder text, etc.). These require a new email address from the source data.

**send-error rows:** The email was valid but Gmail rejected the send. Check the Send Log for the error message. Common causes: quota exceeded, authentication issue. Reset Status to `Pending` once resolved.

See [email-validation-rules.md](email-validation-rules.md) for the full list of validation checks.
