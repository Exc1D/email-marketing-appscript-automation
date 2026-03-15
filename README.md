# Email Marketing AppScript Automation

A config-driven email campaign engine for Google Apps Script. Each campaign lives in its own Google Apps Script project (bound to its own Google Sheet), sharing a common engine file with campaign-specific config.

## Repository Layout

```
email-marketing-appscript-automation/
├── campaign_engine.gs          # Shared logic — copy into each GAS project
├── campaigns/
│   ├── fsvp_config.gs          # FSVP campaign config + email template
│   └── sqf_config.gs           # SQF campaign config + email template
├── docs/
│   ├── workflow.md             # Day-to-day operations guide
│   ├── new-campaign-guide.md   # How to create a new campaign from scratch
│   ├── troubleshooting.md      # Common issues and fixes
│   └── email-validation-rules.md  # Email validation logic and status flow
└── README.md
```

## Quickstart (existing campaign)

See **[docs/workflow.md](docs/workflow.md)** for step-by-step instructions on importing leads, running setup, sending a test email, and monitoring progress.

## Adding a New Campaign

See **[docs/new-campaign-guide.md](docs/new-campaign-guide.md)** for a step-by-step guide to creating a new campaign from scratch, including a full `CAMPAIGN_CONFIG` field reference.

## How It Works

Each GAS project contains two files:

1. **`campaign_engine.gs`** — Shared logic identical across all campaigns: email validation, typo detection, template substitution, batch status writes, trigger management.
2. **`campaign_config.gs`** — Campaign-specific settings: sheet names, banner image IDs, acronyms, email template, and typo domain map.

The engine reads from a global `CAMPAIGN_CONFIG` object defined in the config file. To create a new campaign, copy the engine and write a ~40-line config file.
