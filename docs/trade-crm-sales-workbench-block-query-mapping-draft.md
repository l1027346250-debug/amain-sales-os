# Trade CRM Sales Workbench Block-to-Query Mapping Draft

Last updated: 2026-04-08

## 1. Purpose

This document turns the sales workbench IA draft into a practical query-mapping
baseline for the next implementation round.

It answers:

- which object each workbench block should read from
- which fields must be available
- which filters define the block
- how the default list should be sorted
- which action the block should link to

It does not define UI styling or final component composition.

## 2. Scope Boundary

This draft stays inside the current repository and system boundary:

- `Twenty` remains the read/write surface for CRM records
- `integration-hub` remains the source for first-response monitoring, retry,
  outbox, and external orchestration state
- no new source of truth is introduced

## 3. Mapping Rules

The following principles should apply to every block:

1. Prefer existing CRM fields over newly invented derived fields.
2. Prefer existing list views where possible.
3. Use `integration-hub` summaries only where the core CRM does not yet expose
   the needed operational signal.
4. Every block should open into a filtered working list, not a dead-end metric.

## 4. Block Mapping

## 4.1 Today New Leads

- Source object:
  - `Lead`
- Data source:
  - `Twenty CRM Core`
- Required fields:
  - `leadName`
  - `companyNameRaw`
  - `source`
  - `productCategory`
  - `createdAt`
  - `leadStatus`
  - `assignedSales` or later pool-assigned state
- Suggested default filters:
  - `createdAt = today`
  - exclude terminal lead states if they exist
- Suggested sort:
  - `createdAt desc`
- Primary action target:
  - lead detail or `Today New Leads` filtered list
- Notes:
  - this should remain a direct sales execution queue, not a summary-only card

## 4.2 Lead First Response Risk

- Source object:
  - `Lead`
- Supporting signal:
  - `integration-hub lead-monitoring`
- Data source:
  - `integration-hub /api/lead-monitoring/first-response`
  - or later mirrored CRM view if equivalent SLA fields are introduced
- Required fields:
  - `relatedLeadId`
  - `companyNameRaw`
  - `source`
  - `productCategory`
  - `createdAt`
  - `hoursSinceCreation` or equivalent derived age
  - prepared/applied reminder state when relevant
- Suggested default filters:
  - `firstResponseTime is null`
  - `createdAt older than SLA threshold window`
- Suggested sort:
  - `createdAt asc`
- Primary action target:
  - lead detail
  - prepared reminder review
- Notes:
  - this is one of the few blocks that should rely on `integration-hub` first,
    because the SLA state is already maintained there

## 4.3 Tasks Due Today

- Source object:
  - `Task`
- Data source:
  - `Twenty CRM Core`
- Required fields:
  - `title`
  - `dueDate`
  - `status`
  - `priority`
  - `result`
  - related record reference
- Suggested default filters:
  - `dueDate = today`
  - `status != done/completed`
- Suggested sort:
  - `priority desc`
  - then `dueDate asc`
- Primary action target:
  - task detail
  - related record

## 4.4 Overdue Tasks

- Source object:
  - `Task`
- Data source:
  - `Twenty CRM Core`
- Required fields:
  - `title`
  - `dueDate`
  - `status`
  - `priority`
  - related record reference
- Suggested default filters:
  - `dueDate < today`
  - `status != done/completed`
- Suggested sort:
  - `dueDate asc`
- Primary action target:
  - task detail
  - reschedule flow

## 4.5 My Pipeline Needing Next Action

- Source object:
  - `Opportunity`
- Data source:
  - `Twenty CRM Core`
- Required fields:
  - `name`
  - `company`
  - `stage`
  - `estimatedDealValue`
  - `nextAction`
  - `nextActionDate`
  - `salesOwner`
- Suggested default filters:
  - active pipeline only
  - `nextAction is empty` OR `nextActionDate is empty`
- Suggested sort:
  - `updatedAt asc`
  - then `estimatedDealValue desc`
- Primary action target:
  - opportunity detail
  - pipeline filtered view

## 4.6 Quotation Sent > 3 Days Without Update

- Source object:
  - `Opportunity`
- Data source:
  - `Twenty CRM Core`
- Required fields:
  - `name`
  - `company`
  - `stage`
  - `lastActivityDate`
  - `nextAction`
  - `nextActionDate`
  - `salesOwner`
- Suggested default filters:
  - `stage = QUOTATION_SENT`
  - `lastActivityDate <= today - 3 days`
- Suggested sort:
  - `lastActivityDate asc`
- Primary action target:
  - opportunity detail
  - quotation follow-up list
- Notes:
  - this should align with the current phase-1 quotation follow-up automation

## 4.7 Stalled Opportunities

- Source object:
  - `Opportunity`
- Data source:
  - `Twenty CRM Core`
- Required fields:
  - `name`
  - `company`
  - `stage`
  - `lastActivityDate`
  - `nextAction`
  - `salesOwner`
- Suggested default filters:
  - `stage = STALLED`
  - or `lastActivityDate <= today - 7 days` depending on the final view intent
- Suggested sort:
  - `lastActivityDate asc`
- Primary action target:
  - opportunity detail
  - stalled working view

## 4.8 My Leads by Product Category

- Source object:
  - `Lead`
- Data source:
  - `Twenty CRM Core`
- Required fields:
  - `productCategory`
  - `leadStatus`
  - `assignedSales` or pool state
- Suggested default filters:
  - non-terminal lead states
  - current owner / current operating scope
- Suggested grouping:
  - `productCategory`
- Primary action target:
  - grouped lead list filtered by chosen category
- Notes:
  - this block should reinforce the current category-first operating model

## 4.9 My Leads by Source

- Source object:
  - `Lead`
- Data source:
  - `Twenty CRM Core`
- Required fields:
  - `source`
  - `leadStatus`
  - `assignedSales`
- Suggested default filters:
  - non-terminal lead states
  - current owner / current operating scope
- Suggested grouping:
  - `source`
- Primary action target:
  - grouped lead list filtered by chosen source

## 4.10 My Active Opportunities by Stage

- Source object:
  - `Opportunity`
- Data source:
  - `Twenty CRM Core`
- Required fields:
  - `stage`
  - `estimatedDealValue`
  - `salesOwner`
- Suggested default filters:
  - active pipeline stages only
  - current owner / current operating scope
- Suggested grouping:
  - `stage`
- Primary action target:
  - pipeline or stage-filtered list

## 4.11 Assignment / Pool Readiness Notice

- Source object:
  - category-first assignment artifacts
- Data source:
  - generated assignment stack reports and templates
- Required inputs:
  - `trade-crm-lead-assignment-rules.phase1-product-category-confirmation.csv`
  - `trade-crm-lead-assignment.phase1-pool-staffing-template.csv`
  - `trade-crm-lead-assignment.phase1-pool-staff-level-template.csv`
  - `trade-crm-post-launch-runtime-assignment-config.draft.json`
- Suggested signal:
  - top-level status from `review:trade-crm-post-launch-assignment-stack`
- Primary action target:
  - assignment stack report bundle
- Notes:
  - this is operational context, not a frontline sales action queue
  - it should sit lower on the page or only appear for admin/manager contexts

## 5. Recommended Implementation Order

If implementation starts from this mapping, the preferred order is:

1. `Today New Leads`
2. `Lead First Response Risk`
3. `Tasks Due Today`
4. `Overdue Tasks`
5. `My Pipeline Needing Next Action`
6. `Quotation Sent > 3 Days Without Update`
7. `Stalled Opportunities`
8. category/source/stage grouping blocks
9. assignment/pool readiness notice

## 6. Query Reuse Guidance

To reduce scope risk:

- reuse existing Lead list views for source and category drilling when possible
- reuse existing Opportunity risk automation semantics for quotation/stalled
  blocks
- reuse integration-hub first-response summary instead of re-implementing SLA
  logic inside Twenty

## 7. Open Questions For The Implementation Round

The next implementation round will still need to decide:

1. which blocks are native Twenty views versus custom composed workbench blocks
2. whether first-response-risk is displayed via direct API read or mirrored
   record state
3. whether assignment/pool readiness belongs on the sales workbench, manager
   workbench, or admin-only surface

This draft should reduce ambiguity, but not pretend those choices are already
final.
