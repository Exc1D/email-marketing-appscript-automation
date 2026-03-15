# Email Validation Rules

The engine validates every email in the leads sheet before attempting to send. This document explains what gets flagged and why.

---

## Status Flow

```
Pending
  │
  ├─► Invalid     — Structurally broken. Cannot be fixed without a new address.
  │
  ├─► Typo        — Domain looks misspelled. Likely fixable by the operator.
  │
  ├─► Sent        — Successfully delivered.
  │
  └─► send-error  — Valid email, but Gmail API rejected the send.
                    Reset to Pending after investigating.
```

All validation runs in a single pass at the start of each trigger invocation. Every Pending row is checked — not just rows before the first valid one.

---

## Structural Checks (marks row `Invalid`)

These checks run in order. The first failure marks the row Invalid.

| Check | Catches | Example failing value |
|-------|---------|----------------------|
| Empty/null | Blank cells | *(empty)* |
| Placeholder text | AI-generated or unfilled values | `not found`, `unclear`, `not available` |
| Basic format | No `@`, no domain, no TLD | `userexample.com`, `user@`, `user@domain` |
| Spaces | Whitespace in address | `user @domain.com` |
| Leading dot in local | Dot before the `@` | `.user@domain.com` |
| Trailing dot in local | Dot just before the `@` | `user.@domain.com` |
| Leading dot in domain | Dot after the `@` | `user@.domain.com` |
| Trailing dot in domain | Same as trailing dot check | `user@domain.` |
| Consecutive dots | Double dot anywhere | `user..name@domain.com`, `user@domain..com` |
| Single-character TLD | TLD shorter than 2 chars | `user@domain.c` |

**Valid examples** that pass all checks:
- `buyer@acme.com`
- `john.smith@mail.company.org`
- `info@consultareinc.com`

---

## Typo Detection (marks row `Typo`)

After structural checks pass, the engine checks the email domain against a known misspelling map. If the domain matches, the row is marked `Typo` and the Send Log records the suggested correction.

### Default Typo Map

| Detected domain | Suggested correction |
|----------------|---------------------|
| `gmial.com` | `gmail.com` |
| `gmil.com` | `gmail.com` |
| `gmal.com` | `gmail.com` |
| `gamil.com` | `gmail.com` |
| `yaho.com` | `yahoo.com` |
| `yahooo.com` | `yahoo.com` |
| `outlok.com` | `outlook.com` |
| `hotmal.com` | `hotmail.com` |
| `hotmial.com` | `hotmail.com` |

### How to Fix a Typo Row

1. Check the Send Log — the entry will show `typo: suggested gmail.com` (or the relevant suggestion).
2. Update the email address in the leads sheet.
3. Change Status back to `Pending`.
4. If the trigger was auto-removed, run `installTrigger()` again.

---

## Adding New Typo Patterns

Edit the `typoDomains` object in your campaign config file (`campaigns/fsvp_config.gs`, `campaigns/sqf_config.gs`, etc.):

```javascript
typoDomains: {
  'gmial.com': 'gmail.com',
  'gmil.com': 'gmail.com',
  // Add new entries here:
  'copmany.com': 'company.com',
  'icloud.ocm': 'icloud.com',
},
```

Each key is the misspelled domain (lowercase), and the value is the likely correct domain.

---

## Adding New Placeholder Text Patterns

If your lead data contains other placeholder strings (e.g., `"N/A"`, `"unknown"`, `"TBD"`), add them to the `invalid` array in `isValidEmail()` in `campaign_engine.gs`:

```javascript
var invalid = ['', 'not found', 'unclear', 'not available', 'n/a', 'unknown', 'tbd'];
```

---

## Validation Order (Technical Reference)

The engine processes each Pending row in this order:

1. `isValidEmail(email)` — structural checks → `Invalid` if fails
2. `detectTypoDomain(email)` — typo map lookup → `Typo` if matches
3. If both pass → eligible as send target

`detectTypoDomain` only runs after `isValidEmail` returns `true`, so it can safely assume the email contains exactly one `@`.
