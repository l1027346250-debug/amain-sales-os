# Trade CRM Sales Workbench App-Level Route and Ownership Draft

Last updated: 2026-04-08

## 1. Purpose

This document converts the current sales workbench planning stack into
app-level decisions for the first implementation slice.

It focuses on the first four priority blocks:

1. `Today New Leads`
2. `Lead First Response Risk`
3. `Tasks Due Today`
4. `My Pipeline Needing Next Action`

The main goal is to make the next frontend round answer these questions before
coding starts:

- where should the page live
- which routes should be reused versus added
- which layer owns data fetching
- which layer owns block composition

## 2. Design Constraints

This draft stays inside the current project constraints:

- `Twenty` owns CRM page structure and record/list experiences
- `integration-hub` owns first-response monitoring and external orchestration
- no new source of truth is introduced
- no phase-2 object expansion is introduced

## 3. Recommended Workbench Placement

### 3.1 Suggested page concept

Recommended first page concept:

- `SalesWorkbenchPage`

This should be treated as a focused action page, not a replacement for all
native object views.

### 3.2 Suggested route concept

Recommended app-level route placeholder:

- `/sales-workbench`

This route is only a planning recommendation at this stage.

It should not replace:

- Lead list views
- Task list views
- Opportunity list/pipeline views

Instead, it should aggregate and launch into them.

## 4. Ownership Model

The first implementation slice should separate ownership into four layers.

### 4.1 Route ownership

Owns:

- route registration
- page shell placement
- page-level loading and error boundary

Suggested owner:

- CRM frontend app shell / routing layer

### 4.2 Workbench composition ownership

Owns:

- block ordering
- section layout
- empty state behavior
- page-level composition

Suggested owner:

- sales workbench page module

### 4.3 Block UI ownership

Owns:

- block card rendering
- row preview rendering
- footer action rendering

Suggested owner:

- reusable workbench block components

### 4.4 Data adapter ownership

Owns:

- transforming CRM or `integration-hub` data into block props
- hiding query-source differences from the UI block

Suggested owner:

- block-level adapters or hooks near the workbench page, not deep inside
  generic UI primitives

## 5. Per-Block Route and Ownership Decisions

## 5.1 Today New Leads

### Suggested route behavior

- Appears on:
  - `/sales-workbench`
- Drill-down destination:
  - Lead filtered view for `Today New`
- Record click:
  - lead detail page

### Suggested ownership

- Data ownership:
  - CRM Lead query adapter
- UI ownership:
  - `TodayNewLeadsBlock`
- Drill-down ownership:
  - native Lead list view configuration

### Recommended implementation posture

- Use existing Lead records and existing/native filtered view behavior wherever
  possible.
- Avoid building a second standalone "lead inbox" page in the first slice.

## 5.2 Lead First Response Risk

### Suggested route behavior

- Appears on:
  - `/sales-workbench`
- Drill-down destination:
  - lead detail, or a later dedicated SLA risk view if needed
- Record click:
  - lead detail page

### Suggested ownership

- Data ownership:
  - `integration-hub` adapter layer
- UI ownership:
  - `LeadFirstResponseRiskBlock`
- Drill-down ownership:
  - lead detail route

### Recommended implementation posture

- This block should be treated as a hybrid block:
  - page lives in Twenty
  - operational data comes from `integration-hub`
- Keep the SLA logic outside the frontend and outside Twenty schema for the
  first slice.

## 5.3 Tasks Due Today

### Suggested route behavior

- Appears on:
  - `/sales-workbench`
- Drill-down destination:
  - Task filtered view for `Due Today`
- Record click:
  - task detail
- Secondary click:
  - related record detail

### Suggested ownership

- Data ownership:
  - CRM Task query adapter
- UI ownership:
  - `TasksDueTodayBlock`
- Drill-down ownership:
  - native Task list/detail views

### Recommended implementation posture

- Keep this block fully CRM-native in the first slice.
- Reuse standard task semantics and avoid custom scheduling logic.

## 5.4 My Pipeline Needing Next Action

### Suggested route behavior

- Appears on:
  - `/sales-workbench`
- Drill-down destination:
  - Opportunity filtered view for missing `nextAction` or `nextActionDate`
- Record click:
  - opportunity detail page

### Suggested ownership

- Data ownership:
  - CRM Opportunity query adapter
- UI ownership:
  - `MyPipelineNeedingNextActionBlock`
- Drill-down ownership:
  - native Opportunity list/pipeline/detail views

### Recommended implementation posture

- Keep the first version list-driven.
- Do not merge this block into forecasting or manager analytics surfaces yet.

## 6. Shared Component Ownership

These shared parts should be owned once and reused:

- `SalesWorkbenchPageShell`
- `PriorityQueueSection`
- `WorkbenchBlockCard`
- `WorkbenchBlockHeader`
- `WorkbenchQueueList`
- `WorkbenchFooterLink`
- `WorkbenchEmptyState`

Recommended rule:

- shared components own presentation only
- block adapters own query mapping and transformation

## 7. Suggested Data-Access Pattern

### 7.1 CRM-native blocks

For:

- `Today New Leads`
- `Tasks Due Today`
- `My Pipeline Needing Next Action`

Suggested pattern:

- page-level or block-level CRM query adapter
- convert result into compact workbench block props
- hand off to shared block UI

### 7.2 Hybrid operational block

For:

- `Lead First Response Risk`

Suggested pattern:

- page-level `integration-hub` adapter
- transform response into workbench props
- keep the UI block unaware of raw API shape

## 8. Recommended First Slice Decision

The lowest-risk first slice is:

1. create one new page shell for `/sales-workbench`
2. implement 3 CRM-native blocks first
3. add `Lead First Response Risk` after the page shell and shared block system
   settle

Recommended sequence:

1. `Today New Leads`
2. `Tasks Due Today`
3. `My Pipeline Needing Next Action`
4. `Lead First Response Risk`

## 9. Fallback Option

If a dedicated page route is too expensive in the first code slice, fallback to:

- one lightweight launcher page
- each block shown as count + top rows + deep link
- no complex inline actions beyond navigation

This still preserves the action-first direction without overcommitting to a
large page build.

## 10. Open Decisions For The Next Real Implementation Round

The next implementation round still needs explicit decisions on:

1. exact route path and navigation entry point
2. which frontend module owns the workbench page shell
3. whether `Lead First Response Risk` reads directly from `integration-hub` or
   through an internal proxy layer
4. whether manager users reuse the same page shell with different filters or
   receive a later dedicated manager workbench

This draft should be treated as the planning baseline for those decisions.
