# Trade CRM Sales Workbench Seeded View Refinement Draft

## 1. Goal

This note defines the smallest additional seeded Trade CRM views that make the
first Sales Workbench drill-down paths more action-specific without breaking
the current phase-1 boundary.

The purpose is not to create a second navigation system or a large library of
object views. The purpose is to keep a very small queue-specific set in the
existing Trade CRM view initializer so the current workbench blocks can land on
more precise seller queues.

## 2. Current Seeded Baseline

The current Trade CRM seeded views come from
`packages/twenty-server/src/engine/workspace-manager/trade-crm-init/services/trade-crm-views-initializer.service.ts`
and are intentionally minimal:

- `Leads (Trade CRM)`
- `Pipeline (Trade CRM)`
- `Tasks (Trade CRM)`

These are good object-level landing views, but they are broader than the exact
queues exposed in the first Sales Workbench implementation.

## 3. Workbench Blocks That Need Better Drill-Down

The current first-slice workbench blocks are:

- `Today New Leads`
- `Lead First Response Risk`
- `Tasks Due Today`
- `My Pipeline Needing Next Action`

Only three of those should be considered for CRM-native seeded view refinement:

- `Today New Leads`
- `Tasks Due Today`
- `My Pipeline Needing Next Action`

`Lead First Response Risk` should stay outside this seeded-view effort because
it is currently a hybrid queue fed by `integration-hub`, not a pure CRM-core
view.

## 4. Implemented Minimal Additions

### 4.1 Lead

Keep:

- `Leads (Trade CRM)`

Added:

- `Today New Leads`

Recommended intent:

- seller-facing queue for leads created today
- table view
- sorted by newest first

Implemented filter / sort direction:

- `createdAt IS_TODAY`
- sort by `createdAt DESC`

Why this belongs in phase 1:

- it matches an existing workbench block
- it remains CRM-native
- it creates a better drill-down without inventing a new workflow surface

### 4.2 Task

Keep:

- `Tasks (Trade CRM)`

Added:

- `Tasks Due Today`

Recommended intent:

- seller-facing queue for due-today work
- table view
- sorted by due date ascending

Implemented filter / sort direction:

- assignee is current workspace member
- due date is today
- status is not `DONE`
- sort by `dueAt ASC`

Why this belongs in phase 1:

- it matches an existing workbench block
- it stays inside the Task object already used in phase 1
- it avoids forcing sellers to re-filter the generic tasks table

### 4.3 Opportunity

Keep:

- `Pipeline (Trade CRM)`

Added:

- `Pipeline Needs Next Action`

Recommended intent:

- seller-facing hygiene queue for open opportunities that are missing
  `nextAction` or `nextActionDate`
- table view, not kanban
- sorted by oldest `updatedAt` first or earliest `nextActionDate`

Implemented filter / sort direction:

- owner is current workspace member
- stage is not `WON`
- stage is not `LOST`
- `nextActionDate IS_EMPTY`
- sort by `updatedAt ASC`

Why this belongs in phase 1:

- it matches an existing workbench block
- it uses phase-1 opportunity fields already defined in the Trade CRM model
- it supports seller hygiene without expanding into manager analytics

Current implementation detail:

- the seeded opportunity queue now uses a grouped `OR` condition so the
  view matches the current workbench card more closely:
  `nextAction IS_EMPTY OR nextActionDate IS_EMPTY`
- owner and open-stage hygiene filters remain outside that `OR` group
- sort remains `updatedAt ASC`

## 5. Explicit Non-Goals

The following should not be added through this seeded-view refinement round:

- `Lead First Response Risk`
  - reason: hybrid queue owned by `integration-hub`
- manager review queues
  - reason: outside the current seller-first refinement step
- deep analytics or chart views
  - reason: not needed for the current workbench drill-down closure
- a large library of country/source/category-specific views
  - reason: this would exceed phase-1 scope

## 6. Delivery Order Used

The implemented order stayed aligned with the current workbench priority:

1. `Today New Leads`
2. `Tasks Due Today`
3. `Pipeline Needs Next Action`

## 7. Backend Ownership

These views are seeded through the existing Trade CRM view initializer:

- `packages/twenty-server/src/engine/workspace-manager/trade-crm-init/services/trade-crm-views-initializer.service.ts`

Do not create these as frontend-only ad hoc filters if the intent is to make
them a stable part of the Trade CRM rollout path.

## 8. Frontend Impact

The current workbench helper `useTradeCrmObjectViewLink` now prefers:

- `Today New Leads` for the lead block
- `Tasks Due Today` for the task block
- `Pipeline Needs Next Action` for the opportunity block

Fallback behavior still remains acceptable if a workspace was not initialized
with the newer queue-specific views:

- `Today New Leads` -> `Leads (Trade CRM)` or generic leads list
- `Tasks Due Today` -> `Tasks (Trade CRM)` or generic tasks list
- `My Pipeline Needing Next Action` -> `Pipeline (Trade CRM)` or generic opportunity list

## 9. Decision Summary

Implemented phase-1 queue-specific seeded views:

- `Today New Leads`
- `Tasks Due Today`
- `Pipeline Needs Next Action`

Recommended to keep out of seeded CRM views for now:

- `Lead First Response Risk`
- manager-facing review queues
- analytics-heavy queue variants
