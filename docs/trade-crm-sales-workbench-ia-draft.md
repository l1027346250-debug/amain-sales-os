# Trade CRM Sales Workbench IA Draft

Last updated: 2026-04-08

## 1. Purpose

This document defines the next-phase information architecture draft for the
sales workbench in the current Trade CRM project.

It is based on:

- `docs/trade-crm-xiaoman-benchmark-notes.md`
- `docs/trade-crm-action-first-workspace-draft.md`
- `G:\codex\twentyCRM\销售每日使用动作清单（系统操作版）.md`
- `G:\codex\twentyCRM\主管每日检查版SOP与周复盘模板.md`

The goal is not to design a decorative dashboard. The goal is to define the
first working screen a salesperson should use every day.

## 2. Scope Boundary

This draft stays inside the current project boundary:

- `Twenty` renders the CRM workbench and working views
- `integration-hub` provides external ingestion, retry, monitoring, and outbox
- AI remains assistive only

This draft does not require:

- new phase-2 business objects
- ERP screens
- AI-owned business state changes
- a broad visual redesign of the whole system

## 3. Primary User

Primary user:

- frontline salesperson

Secondary user:

- sales manager reviewing the same action surfaces from a team angle

The sales workbench should answer one question first:

> What do I need to act on today?

## 4. Workbench Design Principles

### 4.1 Action-first

Every block should point to a real list that can be worked immediately.

Counts alone are not enough.

### 4.2 Queue-first

The page should behave like a set of prioritized queues:

- new leads
- follow-up queues
- task queues
- pipeline risk queues

### 4.3 Minimal interpretation cost

The user should not need to build their own mental model from scattered charts.
The page should already sort work by urgency and business impact.

### 4.4 Status-driven

The workbench should reflect real operating states already present in the
project:

- `lead_status`
- `stage`
- `next_action`
- `next_action_date`
- `last_contact_at`
- `last_activity_date`

## 5. Recommended Page Structure

The workbench should be structured in three vertical layers.

### 5.1 Layer A: Immediate action

This top layer should answer:

> What must I do first before I do anything else?

Recommended blocks:

1. `Today New Leads`
2. `Lead First Response Risk`
3. `Tasks Due Today`
4. `Overdue Tasks`

These blocks should appear above any summary metrics.

### 5.2 Layer B: Pipeline movement

This layer should answer:

> Which active opportunities are at risk of slowing down or being forgotten?

Recommended blocks:

1. `My Pipeline Needing Next Action`
2. `Quotation Sent > 3 Days Without Update`
3. `Stalled Opportunities`

### 5.3 Layer C: Context and operating readiness

This layer should answer:

> What background information do I need to understand my current workload?

Recommended blocks:

1. `My Leads by Product Category`
2. `My Leads by Source`
3. `My Active Opportunities by Stage`
4. `Assignment / Pool Readiness Notice` for the current category-first rollout

This layer is useful, but should appear below the action queues.

## 6. Recommended Blocks

### 6.1 Today New Leads

Purpose:

- ensure every new inbound lead gets a quick response

Recommended fields:

- lead name
- company name
- source
- product category
- created time
- assigned state

Recommended actions:

- open lead
- log first response
- create / review next follow-up

### 6.2 Lead First Response Risk

Purpose:

- surface leads close to or beyond the first-response SLA

Recommended fields:

- company
- source
- product category
- created time
- hours since creation
- current assigned state

Recommended actions:

- contact now
- assign / move to pool
- create immediate task

### 6.3 Tasks Due Today

Purpose:

- clear same-day execution work

Recommended fields:

- task title
- related lead/company/opportunity
- due time
- priority
- result state

Recommended actions:

- mark done
- reschedule
- open related record

### 6.4 Overdue Tasks

Purpose:

- prevent lost follow-up momentum

Recommended fields:

- task title
- overdue duration
- owner
- related record

Recommended actions:

- complete now
- reschedule with reason
- escalate if repeatedly overdue

### 6.5 My Pipeline Needing Next Action

Purpose:

- surface active opportunities missing an execution plan

Recommended fields:

- opportunity name
- company
- stage
- estimated value
- next action
- next action date

Recommended rule:

- opportunities with empty `next_action` or empty `next_action_date` should
  appear here by default

### 6.6 Quotation Sent > 3 Days Without Update

Purpose:

- focus on the highest-risk commercial follow-up window

Recommended fields:

- opportunity
- company
- quotation date or last activity date
- days since last update
- owner

Recommended actions:

- follow up now
- set next action
- record client feedback

### 6.7 Stalled Opportunities

Purpose:

- detect pipeline that has drifted into inactivity

Recommended fields:

- opportunity
- stage
- last activity date
- next action
- owner

Recommended actions:

- wake-up attempt
- revise plan
- move toward lost if genuinely inactive

### 6.8 Leads by Product Category

Purpose:

- align the workbench with the current category-first operating model

Recommended output:

- category counts
- clickable drill-down into filtered lead views

This block is especially useful while real staff-level and member allocation are
still post-launch configurable.

## 7. Suggested Interaction Model

Each block should support:

- view all
- open filtered list
- row click into record

Prefer "work from filtered list" rather than forcing the entire workflow
through a single dashboard card.

## 8. Suggested Delivery Order

If the next implementation round starts from this draft, the recommended build
sequence is:

1. `Today New Leads`
2. `Lead First Response Risk`
3. `Tasks Due Today`
4. `My Pipeline Needing Next Action`
5. `Quotation Sent > 3 Days Without Update`
6. `Stalled Opportunities`
7. Category/source/stage context blocks

This order maximizes execution value before summary polish.

## 9. Data Dependencies

The draft assumes the current project continues to rely on these existing
signals:

- phase-1 CRM fields
- phase-1 automations
- integration-hub first-response monitoring
- opportunity stage monitoring
- category-first post-launch assignment artifacts

No new source of truth should be introduced for this workbench.

## 10. What Must Stay Out Of Scope

The sales workbench round should still avoid:

- deep ERP operational views
- full quote/sample/order execution pages
- replacing list views with custom heavy dashboards everywhere
- large unrelated frontend redesign

## 11. Recommended Next Deliverables

The next implementation/planning round should ideally produce:

1. workbench route and page structure draft
2. block-to-query mapping
3. lead working-view matrix
4. manager variant notes for the same workbench

This document should be treated as the functional baseline for that round.
