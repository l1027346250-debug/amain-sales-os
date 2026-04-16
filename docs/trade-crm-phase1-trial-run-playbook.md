# Trade CRM Phase 1 Trial Run Playbook

## Scope

This playbook closes the `9.x.x` phase-1 trial-run preparation work for the
current Trade CRM repository baseline.

It is intentionally limited to:

- local readiness verification
- local delivery audit verification
- local backend startup
- local frontend static preview startup
- runtime walkthrough execution entry point

It does not replace:

- business UAT with real sales data
- external channel integration checks
- post-launch staffing confirmation

## Current baseline

As of `2026-04-13`, the repository-level validation baseline is:

- `verify:trade-crm-phase1-delivery-audit`: passed
- `verify:trade-crm-phase1-readiness:full:bootstrap`: passed
- backend local `/healthz`: reachable on `http://127.0.0.1:3000`
- frontend local preview route: served by the built-in static preview server on
  `http://127.0.0.1:4175`

## Trial-run command order

### 9.1.1 Delivery baseline

Run:

```bash
npm run verify:trade-crm-phase1-delivery-audit
```

Expected result:

- writes `tmp/trade-crm-delivery/phase1-delivery-audit.json`
- writes `tmp/trade-crm-delivery/phase1-delivery-audit.md`
- exits with `status = passed`

### 9.2.1 Readiness baseline

Run:

```bash
npm run verify:trade-crm-phase1-readiness:full:bootstrap
```

Expected result:

- writes `tmp/trade-crm-readiness/phase1-readiness-summary.json`
- writes `tmp/trade-crm-readiness/phase1-readiness-summary.md`
- finishes with all checks passed

### 9.2.2 Backend runtime

Start the backend from the compiled server output:

```bash
Set-Location packages/twenty-server
$env:PG_DATABASE_URL='postgres://postgres:postgres@127.0.0.1:5432/postgres'
$env:REDIS_URL='redis://127.0.0.1:6379'
$env:APP_SECRET='trade-crm-dev-secret'
$env:TRADE_CRM_WORKSPACE_ID='20202020-1c25-4d02-bf25-6aeccf7ea419'
node dist/main.js
```

Expected result:

- `http://127.0.0.1:3000/healthz` returns `200`

### 9.2.3 Frontend runtime

Start the static Trade CRM SPA preview:

```bash
npm run serve:trade-crm-front:static
```

Expected result:

- `http://127.0.0.1:4175/` returns `200`
- direct route access such as `http://127.0.0.1:4175/sales-workbench` falls
  back to `index.html`

### 9.2.4 Runtime walkthrough

With both runtime endpoints available, run:

```bash
node scripts/verify-sales-workbench-runtime-walkthrough.js
```

Expected result:

- writes `tmp/sales-workbench-runtime-walkthrough-v2.json`
- writes `tmp/sales-workbench-runtime-walkthrough-v2.png`
- confirms the current Sales Workbench route can load from the local runtime

## Failure triage

If `3000/healthz` is down:

- re-run `npm run verify:trade-crm-phase1-readiness:full:bootstrap`
- verify local PostgreSQL and Redis are reachable
- check `packages/twenty-server/dist` exists and is current

If `4175` is down:

- verify `packages/twenty-front/build/index.html` exists
- re-run the front-end production build
- restart `npm run serve:trade-crm-front:static`

If walkthrough still fails after both endpoints are up:

- inspect `tmp/sales-workbench-runtime-walkthrough-v2.json`
- inspect `docs/trade-crm-runtime-verification-notes.md`
- determine whether the blocker is welcome/onboarding, auth bootstrap, or a
  route-level request failure

## Current boundary

This playbook finishes the code-side trial-run preparation for phase 1.

The next trial-run layer should be business-facing:

- fill real owner mappings after go-live
- input real employee grading after go-live
- load real lead/customer/opportunity data
- run seller and manager acceptance using the live action chain

Before entering that business-facing round, run:

```bash
npm run verify:trade-crm-phase1-business-trial-readiness
npm run prepare:trade-crm-phase1-business-trial-pack
```

Then review:

- `docs/trade-crm-phase1-business-trial-checklist.md`
- `docs/trade-crm-phase1-business-trial-execution-pack.md`

After seller and manager sign-off are filled, run:

```bash
npm run review:trade-crm-phase1-business-trial-pack
```

Use the review result as the final gate before real-data-assisted trial
execution.
An `accepted` seller or manager row is not considered valid unless its
checklist fields are confirmed and the sign-off date is filled.

## 9.6.1 Enter controlled trial run

After closeout, UAT, handoff, trial-pack review, and runtime assignment
activation readiness are green, run:

```bash
npm run enter:trade-crm-phase1-trial-run:local
```

Expected result:

- refreshes the closeout artifacts
- writes `tmp/trade-crm-trial-run/phase1-trial-run-state.json`
- writes `tmp/trade-crm-trial-run/phase1-trial-run-state.md`
- writes `tmp/trade-crm-trial-run/phase1-trial-run-operating-pack.json`
- writes `tmp/trade-crm-trial-run/phase1-trial-run-operating-pack.md`
- writes `tmp/trade-crm-trial-run/phase1-trial-run-daily-report.json`
- writes `tmp/trade-crm-trial-run/phase1-trial-run-daily-report.md`
- appends `tmp/trade-crm-trial-run/phase1-trial-run-daily-history.jsonl`
- archives timestamped daily JSON/MD files under
  `tmp/trade-crm-trial-run/daily-archive/`
- exits with `status = trial_run_active` and operating-pack
  `status = ready_for_day1_execution`; the daily report exits with
  `status = trial_day_green`

## 9.6.2 Operate day-1 trial

Use `phase1-trial-run-operating-pack.md` as the day-1 control sheet.

Execution order:

1. Operator confirms trial-run state and operating-pack status.
2. Seller executes workbench, lead, customer, opportunity, and AI suggestion
   checks.
3. Manager checks new leads, first-response overdue items, stalled
   opportunities, and team execution.
4. Operator records every approved real-data batch in the import register.
5. Operator reruns `npm run verify:trade-crm-phase1-closeout:local`.

Stop the trial session if any gate fails, any sign-off row is rejected, any
approved import row is missing owner/staff/date confirmation, or the requested
change expands beyond the phase-1 boundary.

## 9.6.3 Daily trial closeout

After each trial day or controlled data batch, run:

```bash
npm run verify:trade-crm-phase1-closeout:local
npm run export:trade-crm-phase1-trial-run-operating-pack
npm run export:trade-crm-phase1-trial-run-daily-report
```

Expected result:

- daily report `status = trial_day_green`
- `Blockers = none`
- only non-blocking known risks remain listed under `New Issues`
- one new JSONL history row is appended for the trial day
- one timestamped JSON/MD archive pair is written for audit

If the daily report is not `trial_day_green`, stop trial operation and resolve
the blocker before adding another data batch.
