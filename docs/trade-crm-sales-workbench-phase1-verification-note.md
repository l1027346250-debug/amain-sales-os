# Sales Workbench Phase 1 Verification Note

## 1. Scope

This note documents the current phase-1 Sales Workbench slice implemented in
`packages/twenty-front/src/pages/workbench/SalesWorkbenchPage.tsx`.

The current page is intentionally limited to a lightweight workspace shell plus
two action sections:

- `Daily operating view` hero and queue snapshot
- `Immediate Action`
- `Pipeline Follow-Through`

The current first-slice blocks are:

- `Lead First Response Risk`
- `Tasks Due Today`
- `Today New Leads`
- `My Pipeline Needing Next Action`

This note describes:

- what each block reads from
- how preview rows and count badges behave
- where footer links and row clicks go
- what has been verified locally
- what remains limited by the current environment

## 2. Current Page Layout

Current page file:

- `packages/twenty-front/src/pages/workbench/SalesWorkbenchPage.tsx`

Current section order:

1. `Daily operating view`
   - seller greeting
   - local date and time
   - queue snapshot
   - today's focus checklist
2. `Immediate Action`
   - `Lead First Response Risk`
   - `Tasks Due Today`
   - `Today New Leads`
3. `Pipeline Follow-Through`
   - `My Pipeline Needing Next Action`

This order is intentionally action-first and now also more visually legible as
a homepage:

- urgent SLA and task work first
- same-day lead qualification next
- pipeline hygiene after immediate queue work
- right-rail context explains why the seller should process work in that order

The refreshed page shell was added to move the workbench closer to the
Xiaoman / OKKI benchmark direction without introducing phase-2 breadth:

- left side remains queue-driven and actionable
- right side summarizes the day and reinforces the operating rhythm
- no new source-of-truth or workflow boundary was introduced

## 3. Block Verification Matrix

### 3.1 Lead First Response Risk

Component:

- `packages/twenty-front/src/modules/workbench/components/LeadFirstResponseRiskBlock.tsx`

Hook:

- `packages/twenty-front/src/modules/workbench/hooks/useLeadFirstResponseRisk.ts`

Primary data source:

- `integration-hub` endpoint
- `GET /api/lead-monitoring/first-response`

Current filtering behavior:

- if the current workspace member is known, reminders are filtered to
  `assignedToId === currentWorkspaceMember.id`
- otherwise the block falls back to the API summary count

Preview rule:

- shows at most 5 reminders

Count badge rule:

- shows the real seller-facing risk total, not just the preview length

Footer drill-down:

- prefers `Leads (Trade CRM)` through the existing workspace view link helper
- falls back to the generic lead list if that seeded view is missing

Row click:

- opens the native lead detail route

Current state handling:

- missing base URL
- loading
- integration error
- no-risk queue
- non-empty reminder list

Known boundary:

- this is a hybrid queue and intentionally stays outside CRM-native seeded view logic

### 3.2 Tasks Due Today

Component:

- `packages/twenty-front/src/modules/workbench/components/TasksDueTodayBlock.tsx`

Hook:

- `packages/twenty-front/src/modules/workbench/hooks/useTasksDueToday.ts`

Primary data source:

- `Task` records through `useFindManyRecords`

Current filtering behavior:

- current workspace member only
- `dueAt` is today
- excludes `DONE`

Preview rule:

- shows at most 5 task rows

Count badge rule:

- shows the full queue total for the current seller

Footer drill-down:

- prefers `Tasks Due Today`

Row interaction:

- reuses existing `TaskRow`
- inline completion remains available
- row click continues to open the task detail side panel

Known boundary:

- intentionally reuses the existing activity/task surface instead of inventing a separate task UI

### 3.3 Today New Leads

Component:

- `packages/twenty-front/src/modules/workbench/components/TodayNewLeadsBlock.tsx`

Hook:

- `packages/twenty-front/src/modules/workbench/hooks/useTodayNewLeads.ts`

Primary data source:

- `lead` records through `useFindManyRecords`

Current filtering behavior:

- `createdAt` is today
- newest-first ordering

Preview rule:

- shows at most 5 leads

Count badge rule:

- shows the real today-created lead total, not just the preview length

Footer drill-down:

- prefers `Today New Leads`

Row click:

- opens the native lead detail route

Known boundary:

- this remains a CRM-native same-day queue and does not depend on `integration-hub`

### 3.4 My Pipeline Needing Next Action

Component:

- `packages/twenty-front/src/modules/workbench/components/MyPipelineNeedingNextActionBlock.tsx`

Hook:

- `packages/twenty-front/src/modules/workbench/hooks/useMyPipelineNeedingNextAction.ts`

Primary data source:

- `Opportunity` records through `useFindManyRecords`

Current filtering behavior:

- current workspace member only
- excludes `WON`
- excludes `LOST`
- keeps opportunities where:
  - `nextAction` is missing
  - or `nextActionDate` is missing

Preview rule:

- shows at most 5 opportunities

Count badge rule:

- shows the full seller-facing hygiene queue total

Footer drill-down:

- prefers `Pipeline Needs Next Action`

Row click:

- opens the native opportunity detail route

Known boundary:

- this remains a CRM-native hygiene queue and does not require `integration-hub`

## 4. Current Shared Presentation Layer

Shared presentation helper:

- `packages/twenty-front/src/modules/workbench/components/WorkbenchBlockText.tsx`

Current shared items:

- `WorkbenchBlockHint`
- `WorkbenchBlockEmptyState`

Purpose:

- keep first-slice hint and empty-state presentation consistent
- reduce repeated presentation code without changing queue behavior

## 5. Local Validation Steps

Recommended local validation flow:

1. Open the Sales Workbench route:
   - `/sales-workbench`
2. Confirm section order:
   - `Immediate Action`
   - `Pipeline Follow-Through`
3. Confirm the four current blocks are visible
4. For each block, verify:
   - count badge is present
   - preview list is capped to 5 rows when data exists
   - footer label is queue-oriented
   - row click still opens the native record surface
5. For `Lead First Response Risk`, also validate:
   - missing-config state
   - loading state
   - unavailable/error state
   - empty risk queue state
6. For `Tasks Due Today`, validate:
   - inline completion is still available
7. For CRM-native blocks, validate footer drill-down targets:
   - `Today New Leads`
   - `Tasks Due Today`
   - `Pipeline Needs Next Action`

## 6. Expected Results

Expected current behavior:

- all four cards render inside the current page shell
- preview lists remain small and scannable
- count badges reflect the real queue totals
- footer links open seller-facing queue views when seeded views exist
- row clicks continue to land on native detail surfaces
- hybrid lead-risk data stays outside CRM-core seeded view logic

## 7. Known Validation Limits

Current known limits:

- `Lead First Response Risk` depends on
  `REACT_APP_INTEGRATION_HUB_API_BASE_URL` in non-localhost environments
- this note does not claim that manager-facing workbench surfaces are implemented
- this note does not claim that second-slice workbench blocks are implemented

## 8. Verified vs Unverified

Verified in the current local round history:

- file-level review of the page shell
- file-level review of all four current block components
- file-level review of the current queue hooks
- queue preview vs total-count semantics
- current footer drill-down targets
- seeded view alignment for CRM-native queues
- hybrid boundary preservation for lead-risk monitoring
- clean frontend production build via `npx vite build`
- headless browser/runtime check of /sales-workbench against the built frontend shell
- backend-connected auth verification through /metadata`r
- authenticated /graphql verification showing the full CRM core schema

Not fully verified in the current environment:

- end-to-end browser validation with a reachable backend, metadata endpoint, and authenticated workspace session
- remote environment validation for `integration-hub`-backed risk data

Current runtime observation from the standalone local browser check:

- the built frontend shell loads
- the route resolves and returns `200`
- the page title resolves to `鐧诲綍鎴栧垱寤鸿处鎴穈
- the visible page state is `鏃犳硶璁块棶鍚庣 / 璇峰埛鏂伴〉闈?/ 閲嶆柊鍔犺浇`
- the current runtime blocker is missing backend reachability for:
  - `/client-config`
  - `/metadata`
  - `/graphql`

### Runtime Correction (Round 93)

The earlier standalone-shell note is now superseded by a backend-connected
runtime check.

Updated runtime facts:

- /client-config, /metadata, and /graphql are now reachable
- /metadata password auth returns a loginToken and then a workspace-scoped
  access token for the local Apple seed user
- authenticated /graphql restores the full CRM core schema, including
  companies, opportunities, 	asks, and leads
- the browser session can now load an authenticated workspace shell with live
  company data in the background
- the remaining runtime blocker is no longer backend reachability
- the remaining runtime blocker is the post-login /welcome gate before the
  actual four-card workbench page is shown

### Runtime Correction (Round 94)

The /welcome gate has now been checked more directly in the local browser flow.

Updated runtime facts:

- the current frontend stores auth through the `tokenPair` cookie rather than
  localStorage
- injecting a fresh workspace-scoped `tokenPair` and then opening
  `/sales-workbench` still redirects back to `/welcome`
- `/welcome` is therefore no longer just a generic sign-in surface in local
  runtime verification; it is the remaining welcome/onboarding gate for this
  seed user and workspace state
- clicking the visible `继续` button currently turns the page into the sign-in
  form on the same `/welcome` route instead of reaching the four-card
  SalesWorkbench page
- the remaining local runtime gap is now best described as an onboarding/welcome
  gate walkthrough issue, not a backend reachability issue and not a missing
  token-storage issue
## 9. Recommended Next Step After This Note

Recommended next move:

- keep further workbench effort focused on small seller-facing workflow refinement
- avoid adding more top-level blocks until the current first slice is either
  browser-verified or explicitly accepted as the phase-1 baseline

### Runtime Correction (Round 95)

The runtime walkthrough now reaches `/sales-workbench` and no longer falls into
the global app-error page.

Updated runtime facts:

- frontend production build passes after the recent workbench guard fixes
- `scripts/verify-sales-workbench-runtime-walkthrough.js` now reports:
  - `reachedWorkbench: true`
  - `finalUrl: http://127.0.0.1:4175/sales-workbench`
- workbench route rendering is now available for local browser/runtime review
- remaining runtime issues are downgraded from page-level crash to data/query
  warnings in the current local stack:
  - `CombinedGraphQLErrors: Invalid auth context`
  - company query field mismatch warnings (for local schema/data state)
- current phase-1 gap is no longer route-level failure; it is cleanup of the
  remaining local query/auth warnings and final acceptance walkthrough evidence

### Runtime Correction (Round 96)

The onboarding/welcome path has now been explicitly re-checked via metadata
status and step-skip mutations.

Updated runtime facts:

- `currentUser.onboardingStatus` is already `COMPLETED` before and after the
  scripted skip-step attempt
- onboarding skip mutations return success and do not change status away from
  `COMPLETED`
- the remaining blocker is therefore not onboarding state
- current blocker scope is now strictly local runtime query/auth mismatch:
  - `CombinedGraphQLErrors: Invalid auth context`
  - `companies` query field mismatch (`introVideo/tagline/visaSponsorship/workPolicy`)

### Runtime Correction (Round 97)

The runtime walkthrough now includes structure-level card detection using stable
`data-testid` markers on all four phase-1 workbench blocks.

Updated runtime facts:

- `workbenchSurface.cardTestIdCount = 4` in the latest walkthrough evidence
- all expected block ids are present:
  - `sales-workbench-block-lead-first-response-risk`
  - `sales-workbench-block-tasks-due-today`
  - `sales-workbench-block-today-new-leads`
  - `sales-workbench-block-my-pipeline-needing-next-action`
- `errorFallbackVisible = false` in the same run
- this confirms the four-card workbench surface is rendered in local runtime
  (not only route-reachable)
- remaining warnings are still present and should be treated as follow-up
  quality cleanup:
  - `Invalid auth context`
  - local `companies` field mismatch warnings

### Runtime Correction (Round 98)

Walkthrough bootstrap now directly uses `returnToPath=/sales-workbench`, which
removes unrelated `/objects/companies` detour noise from this acceptance path.

Updated runtime facts:

- route reaches `/sales-workbench` in the first handled step
- page-level errors are now empty in the latest run (`pageErrors = []`)
- structure-level rendering remains confirmed:
  - `workbenchSurface.cardTestIdCount = 4`
  - `workbenchSurface.errorFallbackVisible = false`
- remaining runtime warning is narrowed to a single failed request:
  - `400 http://127.0.0.1:3000/graphql`

### Runtime Correction (Round 99)

The single remaining `/graphql` warning has now been operation-level traced.

Updated runtime facts:

- failed GraphQL operation name is `AggregateCompanies`
- query snippet:
  - `query AggregateCompanies($filter: CompanyFilterInput) { companies(filter: $filter) { totalCount __typename } }`
- this warning is now classified as a separate global query compatibility issue
  and not part of the four-card Sales Workbench core rendering acceptance

### Runtime Correction (Round 100)

The remaining `AggregateCompanies` warning has now been route-scoped.

Updated runtime facts:

- walkthrough evidence now records `routeAtCapture` for each failed request
- latest run still reports one warning-level GraphQL 400 for:
  - `operationName: AggregateCompanies`
- that request is captured at:
  - `routeAtCapture: /welcome`
- no failed requests are captured on the workbench route in the same run:
  - `failedRequestsOnWorkbenchRoute = []`
  - `failedGraphqlOperationsOnWorkbenchRoute = []`
- this confirms the warning is not emitted from the `/sales-workbench`
  four-card runtime surface

### Runtime Correction (Round 101)

The remaining warning-level `AggregateCompanies` request has now been removed.

Updated runtime facts:

- `ViewPickerDropdown` total-count query is now skipped outside object-index
  routes (`/objects/*`)
- post-build walkthrough shows:
  - `failedRequests = []`
  - `failedGraphqlOperations = []`
  - `consoleErrors = []`
- four-card workbench runtime evidence remains stable in the same run:
  - `reachedWorkbench = true`
  - `workbenchSurface.cardTestIdCount = 4`
  - `workbenchSurface.errorFallbackVisible = false`
