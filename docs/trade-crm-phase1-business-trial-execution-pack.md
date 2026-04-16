# Trade CRM Phase 1 Business Trial Execution Pack

## Scope

This document closes the `9.5.x` execution layer for the first business-facing
trial round.

It is intentionally limited to:

- preparing seller and manager sign-off working files
- preparing the real-data import register
- linking the existing owner-routing and staff-maintenance templates
- keeping all real business data input as a post-startup action

It does not replace:

- real data import approval
- live owner assignment confirmation
- production go-live sign-off

## 9.5.1 Prepare the business trial pack

Run:

```bash
npm run prepare:trade-crm-phase1-business-trial-pack
```

Expected result:

- creates `tmp/trade-crm-trial/business-trial-pack`
- creates missing seller sign-off working file
- creates missing manager sign-off working file
- creates missing import register working file
- preserves existing working files instead of overwriting them
- refreshes blank template copies for seller / manager / import register
- writes `phase1-business-trial-pack-manifest.json`
- writes `phase1-business-trial-pack-manifest.md`
- writes `phase1-import-rehearsal-checklist.md`

## 9.5.2 Seller sign-off execution

Working file:

- `tmp/trade-crm-trial/business-trial-pack/seller-signoff.csv`

Check items:

- workbench path is usable
- lead follow-up path is usable
- customer follow-up path is usable
- opportunity next action path is usable
- AI suggestion panel can be opened where expected

Exit rule:

- keep `signoff_status = pending` until a seller completes the round
- mark `signoff_status = accepted` only after the seller confirms the whole path

## 9.5.3 Manager sign-off execution

Working file:

- `tmp/trade-crm-trial/business-trial-pack/manager-signoff.csv`

Check items:

- new leads are visible
- overdue first response can be checked
- stalled opportunities can be checked
- team execution status can be checked

Exit rule:

- keep `signoff_status = pending` until the manager completes the round
- mark `signoff_status = accepted` only after the manager confirms the checklist

## 9.5.4 Real-data import register

Working file:

- `tmp/trade-crm-trial/business-trial-pack/import-register.csv`

Use rule:

- do not input real data until owner mapping is confirmed
- do not input real data until staff-level maintenance is confirmed
- each trial import batch must be logged before and after execution

## 9.5.4.1 Sample import files for trial rehearsal

Example files prepared from the phase-1 field configuration baseline:

- `tmp/trade-crm-trial/business-trial-pack/companies-import.sample.csv`
- `tmp/trade-crm-trial/business-trial-pack/people-import.sample.csv`
- `tmp/trade-crm-trial/business-trial-pack/leads-import.sample.csv`
- `tmp/trade-crm-trial/business-trial-pack/opportunities-import.sample.csv`

Recommended rehearsal order:

1. `Companies`
2. `People`
3. `Leads`
4. `Opportunities`

These files are for trial and training only. They are not real business data.

## 9.5.5 Linked business references

Owner-routing and staff-maintenance references stay outside the pack and must be
reviewed before the first real inbound allocation:

- `trade-crm-lead-assignment-rules.phase1-product-category-confirmation.csv`
- `trade-crm-lead-assignment-rules.phase1-approval-draft.md`
- `trade-crm-lead-assignment.phase1-pool-staffing-template.csv`
- `trade-crm-lead-assignment.phase1-pool-staff-level-template.csv`
- `trade-crm-post-launch-runtime-assignment-activation.approval.template.json`

## 9.5.6 Gate before real business trial

Business trial can start only when all of the following are true:

- `verify:trade-crm-phase1-business-trial-readiness` passes
- `prepare:trade-crm-phase1-business-trial-pack` finishes successfully
- seller sign-off working file is ready
- manager sign-off working file is ready
- import register working file is ready
- real owner mapping is confirmed by the business side

## 9.5.7 Review the filled business trial pack

Run:

```bash
npm run review:trade-crm-phase1-business-trial-pack
```

Expected result:

- writes `phase1-business-trial-pack-review.json`
- writes `phase1-business-trial-pack-review.md`
- returns one of:
  - `waiting_for_business_input`
  - `ready_for_real_data_trial`
- `blocked`
- includes row-level blocking reasons
- includes suggested next actions for the business side

Decision rule:

- `waiting_for_business_input`: templates exist but seller/manager sign-off is not complete yet
- `ready_for_real_data_trial`: seller and manager sign-off are accepted, accepted rows have all checklist fields confirmed, and no approved import row is missing owner/staff confirmation or `import_date`
- `blocked`: there is at least one rejected sign-off row, an accepted row with incomplete checklist fields, an accepted row missing `signoff_date`, or an approved import row without owner/staff confirmation or `import_date`

## 9.5.8 Verify business-owned input replaces sample baseline

Run:

```bash
npm run verify:trade-crm-phase1-business-trial-live-input
```

Use this step after the business side starts replacing the sample pack with
actual trial-owned rows.
