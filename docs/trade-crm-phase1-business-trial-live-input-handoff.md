# Trade CRM Phase 1 Business Trial Live Input Handoff

## Scope

This document defines the last handoff step between the sample business-trial
pack and the first business-owned trial round.

It is intentionally limited to:

- replacing sample/mock/example values in working files
- keeping the field headers unchanged
- confirming the business-owned working files are ready before the first real trial

It does not replace:

- owner mapping confirmation
- staff-level confirmation
- import execution itself

## Files to replace with business-owned content

- `tmp/trade-crm-trial/business-trial-pack/seller-signoff.csv`
- `tmp/trade-crm-trial/business-trial-pack/manager-signoff.csv`
- `tmp/trade-crm-trial/business-trial-pack/import-register.csv`

Keep these as reference-only baselines:

- `seller-signoff.blank.csv`
- `manager-signoff.blank.csv`
- `import-register.blank.csv`
- `*.sample.csv`

## Replacement rules

1. Replace seller and manager example names with the actual business owners.
2. Replace remarks that still contain `mock`, `sample`, or `example`.
3. Replace import batch names with business-owned batch identifiers.
4. Keep CSV headers unchanged.
5. Keep the import order as `Companies -> People -> Leads -> Opportunities`.

## Verification command

Run:

```bash
npm run verify:trade-crm-phase1-business-trial-live-input
```

Expected result:

- writes `phase1-business-trial-live-input-check.json`
- writes `phase1-business-trial-live-input-check.md`
- returns:
  - `sample_baseline_only` when sample/mock/example markers are still present
  - `ready_for_business_owned_input` when working files no longer contain those markers

## Decision rule

- `sample_baseline_only`: do not treat the working files as business-owned trial input
- `ready_for_business_owned_input`: working files are ready for the first business-owned trial round, subject to owner/staff confirmation
