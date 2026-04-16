# Sales Workbench Phase 1 Acceptance Checklist

## 1. Purpose

This checklist defines the current acceptance baseline for the phase-1 Sales
Workbench first slice.

It is intended to turn the existing verification note into a concrete close-out
decision aid for:

- local implementation review
- demo readiness review
- `OI-010` follow-up

Related note:

- `docs/trade-crm-sales-workbench-phase1-verification-note.md`

## 2. Current Acceptance Scope

Current phase-1 workbench scope includes only:

- `Immediate Action`
  - `Lead First Response Risk`
  - `Tasks Due Today`
  - `Today New Leads`
- `Pipeline Follow-Through`
  - `My Pipeline Needing Next Action`

Anything outside that surface is out of scope for this checklist.

## 3. Page-Level Acceptance

Mark accepted when all items below are true:

- [ ] `/sales-workbench` is routed and reachable
- [ ] the page title reads `Sales Workbench`
- [ ] the page shows exactly the current two sections:
  - [ ] `Immediate Action`
  - [ ] `Pipeline Follow-Through`
- [ ] the first slice still contains exactly the current four blocks

## 4. Block-Level Acceptance

### 4.1 Lead First Response Risk

- [ ] data still comes from `integration-hub`
- [ ] preview remains capped to 5 reminders
- [ ] count badge reflects the real seller-facing risk total
- [ ] footer still prefers `Leads (Trade CRM)`
- [ ] row click still opens native lead detail
- [ ] missing-config, loading, unavailable, and empty states all render

### 4.2 Tasks Due Today

- [ ] data still comes from native `Task` records
- [ ] preview remains capped to 5 rows
- [ ] count badge reflects the full seller queue total
- [ ] footer still prefers `Tasks Due Today`
- [ ] inline completion still works
- [ ] row click still opens the existing task detail side panel

### 4.3 Today New Leads

- [ ] data still comes from native `lead` records
- [ ] preview remains capped to 5 rows
- [ ] count badge reflects the full today-created lead total
- [ ] footer still prefers `Today New Leads`
- [ ] row click still opens native lead detail

### 4.4 My Pipeline Needing Next Action

- [ ] data still comes from native `Opportunity` records
- [ ] preview remains capped to 5 rows
- [ ] count badge reflects the full seller-facing hygiene queue total
- [ ] footer still prefers `Pipeline Needs Next Action`
- [ ] row click still opens native opportunity detail

## 5. Presentation Acceptance

- [ ] all four cards use the current seller-facing description style
- [ ] all four cards use queue-oriented footer wording
- [ ] all four cards use consistent queue-style empty states
- [ ] shared hint / empty-state presentation still flows through:
  - `packages/twenty-front/src/modules/workbench/components/WorkbenchBlockText.tsx`

## 6. Architecture Boundary Acceptance

- [ ] `Lead First Response Risk` remains a hybrid queue and is not moved into CRM-native seeded views
- [ ] `Today New Leads`, `Tasks Due Today`, and `Pipeline Needs Next Action` remain CRM-native queues
- [ ] no new top-level workbench blocks are added as part of phase-1 acceptance
- [ ] no manager-facing workbench surface is implied by phase-1 acceptance

## 7. Validation Evidence

Acceptance should be supported by at least:

- [ ] file-level review of the current page shell
- [ ] file-level review of the four current block components
- [ ] file-level review of the current queue hooks
- [ ] verification note review:
  - `docs/trade-crm-sales-workbench-phase1-verification-note.md`

If a clean frontend runtime is available, also capture:

- [ ] browser check of the four-card page
- [ ] browser check of footer drill-down targets
- [ ] browser check of row-click behavior

## 8. Current Acceptance Gap

Current remaining gap before a stronger runtime sign-off:

- [ ] complete a browser/runtime pass for the current first-slice page with a reachable backend and authenticated workspace session

The phase-1 workbench can now be considered:

- file-verified
- documented
- structurally aligned
- frontend-build verified

But it is not yet fully browser/runtime-verified.

Current local runtime evidence now shows:

- the built frontend shell can load in a headless browser
- /client-config, /metadata, and /graphql are now reachable
- an authenticated workspace shell can now load
- even a fresh injected `tokenPair` cookie plus a direct `/sales-workbench`
  visit still resolves to `/welcome`
- the remaining local blocker is therefore the welcome/onboarding gate itself,
  not backend reachability and not missing browser auth storage
- the actual four-card SalesWorkbenchPage surface is still not the final visible
  page in the local walkthrough

### Runtime Update (Round 95)

Latest local walkthrough evidence now shows:

- `/sales-workbench` is reachable and rendered in runtime (`reachedWorkbench: true`)
- the page no longer drops into the global app-error fallback during the same flow
- remaining warnings are now query/auth-level runtime warnings rather than a full
  route-level failure

Because of this, the current acceptance gap is narrowed to:

- clear or intentionally accept the remaining local query/auth warnings
- complete one final browser walkthrough capture showing stable four-card usage

### Runtime Update (Round 97)

Latest structural walkthrough evidence now confirms four-card rendering via
stable test-id detection:

- [x] route reaches `/sales-workbench`
- [x] all four phase-1 workbench cards are mounted in the page DOM
- [x] global app-root error fallback is not visible in the same runtime pass

Current remaining gap:

- [ ] decide whether the remaining warning-level runtime errors are acceptable
  for OI-010 phase-1 close-out or require one more cleanup round

### Runtime Update (Round 98)

Latest direct-bootstrap runtime evidence now confirms:

- [x] no page-level runtime error (`pageErrors = []`)
- [x] four-card structure rendering remains stable (`cardTestIdCount = 4`)
- [ ] one warning-level `/graphql` 400 request remains in the run log

### Runtime Update (Round 99)

The warning-level `/graphql` 400 has been traced to
`operationName = AggregateCompanies` and moved into separate follow-up tracking
(`OI-011`).

For Sales Workbench phase-1 acceptance scope:

- [x] four-card render path is structurally verified in runtime
- [x] no page-level error fallback in latest pass
- [x] remaining warning is classified outside the workbench-core acceptance path

### Runtime Update (Round 100)

Latest route-scoped runtime evidence confirms:

- the remaining `AggregateCompanies` 400 is captured on `/welcome`
- no failed requests are captured on `/sales-workbench` in the same run
- four-card workbench rendering remains stable with no page-level fallback

Current acceptance decision:

- [x] OI-010 workbench-core runtime acceptance is satisfied
- [ ] OI-011 remains as separate non-blocking warning-noise follow-up

### Runtime Update (Round 101)

Latest post-build runtime evidence confirms:

- [x] no failed request remains (`failedRequests = []`)
- [x] no failed GraphQL operation remains (`failedGraphqlOperations = []`)
- [x] no console error remains in the walkthrough log
- [x] four-card workbench structure still renders stably

Current acceptance decision:

- [x] OI-010 closed
- [x] OI-011 warning cleanup completed

## 9. Close-Out Rule For OI-010

`OI-010` can reasonably move from `In Progress` once:

- this checklist is satisfied at the file/document level
- and either:
  - a browser/runtime pass succeeds
  - or the project explicitly accepts file-level verification as the phase-1 baseline

Current status: runtime pass succeeds for workbench-core scope; OI-010 can be
treated as closed for phase-1 acceptance tracking.
