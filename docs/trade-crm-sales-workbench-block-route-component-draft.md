# Trade CRM Sales Workbench Block-to-Route and Component Draft

Last updated: 2026-04-08

## 1. Purpose

This document turns the sales workbench IA and block-query mapping into a
practical implementation-planning draft for the first workbench slice.

It focuses on the top-priority blocks:

1. `Today New Leads`
2. `Lead First Response Risk`
3. `Tasks Due Today`
4. `My Pipeline Needing Next Action`

For each block, this draft defines:

- suggested route behavior
- suggested parent page placement
- suggested component boundaries
- suggested fallback implementation if a native block is too expensive

It does not prescribe the final visual design.

## 2. Scope Boundary

This draft stays inside the current system boundary:

- `Twenty` remains the primary page and list-view surface
- `integration-hub` remains the source for first-response monitoring state
- no new phase-2 object or integration surface is introduced

## 3. Shared Workbench Page Assumption

The first implementation slice assumes one sales workbench page in Twenty,
which contains:

- a top priority queue region
- a lower context region

The first slice should only implement the top priority queue region.

Suggested page-level structure:

- `SalesWorkbenchPage`
  - `PriorityQueueSection`
    - `TodayNewLeadsBlock`
    - `LeadFirstResponseRiskBlock`
    - `TasksDueTodayBlock`
    - `MyPipelineNeedingNextActionBlock`
  - `SecondaryContextSection`
    - defer to later rounds

## 4. Block Drafts

## 4.1 Today New Leads

### Route model

- Workbench card location:
  - `SalesWorkbenchPage`
- Primary drill-down route:
  - existing or planned filtered Leads list view such as
    `Leads -> Today New`
- Row click target:
  - lead record detail

### Suggested component structure

- `TodayNewLeadsBlock`
  - `BlockHeader`
  - `LeadQueueCount`
  - `LeadQueueTable` or `LeadQueueList`
  - `BlockFooterLink`

### Suggested props / data contract

- `count`
- `items[]`
  - `leadId`
  - `leadName`
  - `companyNameRaw`
  - `source`
  - `productCategory`
  - `createdAt`
  - `assignedState`

### Implementation notes

- Prefer native Twenty list-view reuse for the drill-down destination.
- The block itself can start as a compact list of 5 to 10 rows.
- If full custom composition is too heavy in the first slice, a minimal version
  can be:
  - count
  - top 5 rows
  - link to the filtered Lead view

## 4.2 Lead First Response Risk

### Route model

- Workbench card location:
  - `SalesWorkbenchPage`
- Primary drill-down route:
  - a filtered Lead SLA risk page or a hybrid view that jumps to lead detail
- Row click target:
  - lead record detail
- Secondary action target:
  - prepared reminder review or direct follow-up action

### Suggested component structure

- `LeadFirstResponseRiskBlock`
  - `BlockHeader`
  - `RiskCountBadge`
  - `LeadSlaRiskList`
  - `BlockFooterLink`

### Suggested props / data contract

- `count`
- `items[]`
  - `leadId`
  - `companyNameRaw`
  - `source`
  - `productCategory`
  - `createdAt`
  - `hoursSinceCreation`
  - `preparedTaskState`

### Implementation notes

- This is the first block that likely needs an `integration-hub` read path.
- Recommended first implementation:
  - fetch from `integration-hub` summary/state
  - render compact risk rows
  - deep-link into lead detail
- Do not re-implement SLA logic inside Twenty in the first slice.

## 4.3 Tasks Due Today

### Route model

- Workbench card location:
  - `SalesWorkbenchPage`
- Primary drill-down route:
  - existing or planned filtered Tasks list view such as
    `Tasks -> Due Today`
- Row click target:
  - task detail
- Secondary target:
  - related Lead / Company / Opportunity detail

### Suggested component structure

- `TasksDueTodayBlock`
  - `BlockHeader`
  - `TaskCount`
  - `TaskQueueList`
  - `BlockFooterLink`

### Suggested props / data contract

- `count`
- `items[]`
  - `taskId`
  - `title`
  - `dueDate`
  - `priority`
  - `relatedRecordLabel`
  - `relatedRecordType`
  - `relatedRecordId`

### Implementation notes

- This block should rely on standard Twenty task data first.
- Keep the first version list-based, not calendar-based.
- The related record link is more important than visual polish in the first cut.

## 4.4 My Pipeline Needing Next Action

### Route model

- Workbench card location:
  - `SalesWorkbenchPage`
- Primary drill-down route:
  - filtered Opportunity view such as
    `Opportunities -> No Next Action`
- Row click target:
  - opportunity detail

### Suggested component structure

- `MyPipelineNeedingNextActionBlock`
  - `BlockHeader`
  - `OpportunityRiskCount`
  - `OpportunityQueueList`
  - `BlockFooterLink`

### Suggested props / data contract

- `count`
- `items[]`
  - `opportunityId`
  - `name`
  - `companyName`
  - `stage`
  - `estimatedDealValue`
  - `nextAction`
  - `nextActionDate`

### Implementation notes

- This block should be driven from Opportunities, not a separate analytics layer.
- A first version may only show rows with missing `nextAction` or
  `nextActionDate`.
- This should be treated as a pipeline hygiene queue, not a forecasting widget.

## 5. Cross-Block Shared Components

The first workbench slice should try to reuse a small shared component set:

- `WorkbenchBlockCard`
- `WorkbenchBlockHeader`
- `WorkbenchQueueList`
- `WorkbenchEmptyState`
- `WorkbenchFooterLink`

This keeps the first implementation small and avoids over-designing the UI too
early.

## 6. Suggested Delivery Strategy

Recommended implementation order:

1. `Today New Leads`
2. `Tasks Due Today`
3. `My Pipeline Needing Next Action`
4. `Lead First Response Risk`

Reason:

- the first three are easier to drive mostly from current CRM-native data
- `Lead First Response Risk` introduces the first `integration-hub` backed block
  and should come after the page shell and shared block pattern are already
  stable

## 7. Fallback Delivery Options

If a full workbench page cannot be implemented immediately, use this fallback:

1. create the filtered native views first
2. create a small summary page that links to those views
3. add inline top-row previews only after the navigation path works

This preserves delivery momentum without blocking on the perfect composed page.

## 8. Open Questions For The Next Implementation Round

The next round still needs to decide:

1. whether the workbench lives as one custom page or as a lightweight launcher
   over existing native views
2. how `integration-hub` first-response-risk data should be fetched into the
   page shell
3. whether manager and salesperson should share the same page shell with
   different filters, or use separate workbench variants

This document should narrow those decisions, not replace them.
