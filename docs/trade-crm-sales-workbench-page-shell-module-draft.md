# Trade CRM Sales Workbench Page-Shell and Frontend Module Ownership Draft

Last updated: 2026-04-08

## 1. Purpose

This document translates the current sales workbench planning stack into a
frontend-facing draft that matches the existing `twenty-front` codebase shape.

It is based on the current repository structure under:

- `packages/twenty-front/src/pages`
- `packages/twenty-front/src/modules`

The goal is to reduce ambiguity before the first real frontend implementation
slice starts.

## 2. Current Frontend Structure Observed

The current frontend already separates:

- page entry points under `packages/twenty-front/src/pages`
- reusable feature and UI modules under `packages/twenty-front/src/modules`

Relevant observed page patterns:

- `pages/object-record/*`
- `pages/settings/*`
- `pages/auth/*`
- `pages/onboarding/*`

Relevant observed module areas that match the future workbench needs:

- `modules/navigation`
- `modules/page-layout`
- `modules/views`
- `modules/object-record`
- `modules/activities`
- `modules/tasks` is not a standalone top-level folder yet, so task-facing
  ownership likely needs to stay near existing object/view patterns
- `modules/dashboards`
- `modules/workspace`
- `modules/companies`
- `modules/people`
- `modules/activities`

This suggests the first workbench slice should follow the existing pattern:

- page entry in `src/pages`
- workbench-specific composition and adapters in `src/modules`

## 3. Recommended Placement

### 3.1 Page-shell location

Suggested new page entry area:

- `packages/twenty-front/src/pages/workbench/`

Suggested first page file:

- `packages/twenty-front/src/pages/workbench/SalesWorkbenchPage.tsx`

Reason:

- this matches the existing page-entry pattern
- it keeps the page shell separate from reusable module code
- it avoids mixing the workbench shell into generic object-record pages

### 3.2 Module ownership location

Suggested new module area:

- `packages/twenty-front/src/modules/workbench/`

Suggested sub-areas:

- `components/`
- `hooks/`
- `adapters/`
- `constants/`
- `types/`

Reason:

- this matches current feature-module patterns
- it keeps block composition local to the workbench
- it avoids pushing workbench-specific logic into generic UI modules too early

## 4. Suggested Ownership Split

## 4.1 Page entry ownership

Suggested owner:

- `src/pages/workbench/SalesWorkbenchPage.tsx`

Owns:

- route-level page shell
- top-level loading / error layout
- section ordering

Should not own:

- detailed query transformation
- deep block rendering logic

## 4.2 Feature module ownership

Suggested owner:

- `src/modules/workbench/*`

Owns:

- block composition
- block adapters
- workbench-specific hooks
- shared workbench block UI

Should not own:

- global navigation registration logic
- unrelated generic app-shell behavior

## 4.3 Generic shared module ownership

Suggested existing shared areas to reuse first:

- `src/modules/page-layout`
- `src/modules/navigation`
- `src/modules/views`
- `src/modules/ui`

Recommended rule:

- reuse from these modules where practical
- do not move workbench-specific business logic into them

## 5. Proposed First Directory Draft

```text
packages/twenty-front/src/
├── pages/
│   └── workbench/
│       └── SalesWorkbenchPage.tsx
└── modules/
    └── workbench/
        ├── components/
        │   ├── SalesWorkbenchPageShell.tsx
        │   ├── PriorityQueueSection.tsx
        │   ├── WorkbenchBlockCard.tsx
        │   ├── WorkbenchBlockHeader.tsx
        │   ├── WorkbenchQueueList.tsx
        │   ├── WorkbenchFooterLink.tsx
        │   └── WorkbenchEmptyState.tsx
        ├── blocks/
        │   ├── TodayNewLeadsBlock.tsx
        │   ├── LeadFirstResponseRiskBlock.tsx
        │   ├── TasksDueTodayBlock.tsx
        │   └── MyPipelineNeedingNextActionBlock.tsx
        ├── hooks/
        │   ├── useTodayNewLeadsBlock.ts
        │   ├── useLeadFirstResponseRiskBlock.ts
        │   ├── useTasksDueTodayBlock.ts
        │   └── useMyPipelineNeedingNextActionBlock.ts
        ├── adapters/
        │   ├── mapLeadRecordToWorkbenchItem.ts
        │   ├── mapTaskRecordToWorkbenchItem.ts
        │   ├── mapOpportunityRecordToWorkbenchItem.ts
        │   └── mapLeadFirstResponseRiskToWorkbenchItem.ts
        ├── types/
        │   └── WorkbenchBlockItem.ts
        └── constants/
            └── workbenchBlockLimits.ts
```

## 6. Per-Block Module Ownership

## 6.1 Today New Leads

Suggested files:

- page composition:
  - `pages/workbench/SalesWorkbenchPage.tsx`
- block UI:
  - `modules/workbench/blocks/TodayNewLeadsBlock.tsx`
- block data hook:
  - `modules/workbench/hooks/useTodayNewLeadsBlock.ts`
- adapter:
  - `modules/workbench/adapters/mapLeadRecordToWorkbenchItem.ts`

Suggested dependency direction:

- hook reads Lead data
- adapter normalizes it
- block renders it

## 6.2 Lead First Response Risk

Suggested files:

- block UI:
  - `modules/workbench/blocks/LeadFirstResponseRiskBlock.tsx`
- block data hook:
  - `modules/workbench/hooks/useLeadFirstResponseRiskBlock.ts`
- adapter:
  - `modules/workbench/adapters/mapLeadFirstResponseRiskToWorkbenchItem.ts`

Important ownership note:

- this hook should be the boundary where `integration-hub` data enters the
  frontend workbench layer
- do not leak raw `integration-hub` API shape into generic UI components

## 6.3 Tasks Due Today

Suggested files:

- block UI:
  - `modules/workbench/blocks/TasksDueTodayBlock.tsx`
- block data hook:
  - `modules/workbench/hooks/useTasksDueTodayBlock.ts`
- adapter:
  - `modules/workbench/adapters/mapTaskRecordToWorkbenchItem.ts`

## 6.4 My Pipeline Needing Next Action

Suggested files:

- block UI:
  - `modules/workbench/blocks/MyPipelineNeedingNextActionBlock.tsx`
- block data hook:
  - `modules/workbench/hooks/useMyPipelineNeedingNextActionBlock.ts`
- adapter:
  - `modules/workbench/adapters/mapOpportunityRecordToWorkbenchItem.ts`

## 7. Suggested Integration With Existing Frontend Areas

The first slice should reuse existing frontend areas instead of replacing them:

- record detail stays under current object-record page flow
- filtered list drill-down should reuse current object/view system
- navigation registration should stay with the current navigation/app-shell flow

The workbench should therefore act as:

- one new page shell
- one new feature module
- several links into existing list/detail experiences

## 8. Suggested First Slice Delivery Order

Recommended code delivery order:

1. `pages/workbench/SalesWorkbenchPage.tsx`
2. `modules/workbench/components/*` shared shell pieces
3. `TodayNewLeadsBlock`
4. `TasksDueTodayBlock`
5. `MyPipelineNeedingNextActionBlock`
6. `LeadFirstResponseRiskBlock`

Reason:

- the first three are easier to build on existing CRM-native data
- the `integration-hub` hybrid block should be added after the shell pattern is
  stable

## 9. What Should Stay Out Of Scope In The First Code Slice

Still avoid:

- manager-specific page split
- broad dashboard analytics
- custom chart library work
- full customer workspace
- full opportunity workspace
- large route refactor across the app

## 10. Open Decisions For The Next Implementation Round

The next code-facing round still needs to decide:

1. the exact route registration location in the current frontend app shell
2. whether the workbench page belongs under an existing workspace/navigation
   feature or introduces a new navigation entry
3. the exact HTTP/data-access strategy for the `Lead First Response Risk` hook
4. whether task data should be queried through an existing generic object/view
   layer or a dedicated workbench hook wrapper

This document should be treated as the current baseline for those decisions.
