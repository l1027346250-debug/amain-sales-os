# Trade CRM Action-First Workspace Draft

Last updated: 2026-04-08

## 1. Purpose

This document turns the Xiaoman / OKKI benchmark findings into concrete
next-phase guidance for this repository.

It is intentionally limited to:

- workbench and working-view direction
- lead operating view direction
- customer workspace direction
- manager daily review direction

It does not introduce new phase-2 objects or change the current system
boundary.

## 2. Design Constraints

This draft must stay inside the current project rules:

- `Twenty = CRM Core`
- `integration-hub = ingestion, orchestration, retry, webhook, outbox`
- `AI = summary / score / recommendation only`

This means the draft may improve working surfaces, but must not:

- move acquisition logic into Twenty core
- force phase-2 transaction breadth into phase 1
- let AI directly mutate key business state

## 3. Target Outcome

The next meaningful improvement after the current phase-1 stack is not "more
fields". It is to make the system easier to work from every day.

The target is:

1. Sales opens the system and sees what to do first.
2. Managers open the system and see what is stuck or risky.
3. Lead, customer, and opportunity pages behave like operating surfaces, not
   passive record pages.

## 4. Recommended Next-Phase Surfaces

### 4.1 Sales workbench

The first workspace should be action-first, not report-first.

Recommended blocks:

- `Today New Leads`
- `Lead First Response Risk`
- `Tasks Due Today`
- `Overdue Tasks`
- `My Pipeline Needing Next Action`
- `Quotation Sent > 3 Days Without Update`
- `Stalled Opportunities`

Recommended behavior:

- every block should lead to a filtered working view
- counts alone are not enough; each block should expose the actionable list
- "next action" and "next action date" should be visible without opening each
  record one by one

### 4.2 Lead operating view

The lead list should remain a working queue.

Recommended persistent dimensions:

- `lead_status`
- `source`
- `product_category`
- `assigned_sales` or later pool ownership state
- `last_contact_at`
- `next_followup_date`
- `days_without_contact`

Recommended default lead views:

- `Today New`
- `Uncontacted`
- `Need Follow-up Today`
- `12h First Response Risk`
- `By Product Category`
- `By Source`

This matches both the current project SOP and the Xiaoman benchmark direction.

### 4.3 Customer workspace

Customer detail should evolve from a static record to an operating workspace.

Recommended first sections:

- basic company and key-contact summary
- recent interactions
- current opportunities
- current tasks
- stage / grouping / segment / score context
- risk or inactivity signals

Recommended outcome:

- a salesperson should be able to understand "what is happening with this
  customer right now" from one page
- a manager should be able to judge whether the account is active, stuck, or
  neglected

### 4.4 Opportunity operating view

Opportunity pages should stay stage-first and action-first.

Recommended visible dimensions:

- `stage`
- `sales_owner`
- `estimated_deal_value`
- `next_action`
- `next_action_date`
- `last_activity_date`
- `lost_reason`

Recommended working views:

- `My Pipeline`
- `No Next Action`
- `Quotation Sent Risk`
- `Stalled > 7 Days`
- `Won This Period`
- `Lost Review`

### 4.5 Manager review surface

The manager surface should not be a generic BI homepage.

It should help answer:

- which leads still have no first response
- which salespeople still have overdue tasks
- which opportunities have no next action
- which quotations are not being followed up
- which opportunities have stalled

Recommended manager blocks:

- `Uncontacted Leads`
- `Tasks Overdue by Owner`
- `Opportunities Missing Next Action`
- `Quotation Follow-up Risk`
- `Stalled Pipeline`
- `Pool Readiness / Staffing Readiness` for the later category-first routing
  model

## 5. How This Connects To Current Project Assets

This draft does not replace the current implementation artifacts. It sits on
top of them.

### 5.1 Current assets that already support this direction

- phase-1 object and field rollout
- phase-1 automations
- category-first assignment stack
- post-launch staffing and staff-level templates
- integration-hub first-response monitoring
- outbox and ops exception surfaces
- root smoke and artifact export

### 5.2 Current views and reports that should influence the next UX round

- `销售每日使用动作清单（系统操作版）.md`
- `主管每日检查版SOP与周复盘模板.md`
- `docs/trade-crm-xiaoman-benchmark-notes.md`

These three together should define what appears first on the workbench.

## 6. What Should Be Prioritized Next

If the next development round enters UX or workspace work, the recommended
priority order is:

1. sales workbench draft
2. lead operating views
3. manager daily review surface
4. customer workspace draft
5. opportunity risk/stall working views

This order is recommended because it improves daily execution before adding more
detail-page complexity.

## 7. What Should Stay Out Of Scope For That Round

Even in the next UX/workspace round, these should still stay out of scope:

- full Quotes / Samples / Orders UI
- ERP deep workflows
- AI autonomous state transitions
- broad permission redesign
- unrelated visual overhaul across the whole app

## 8. Suggested Deliverables For The Next UX Round

When the team starts the next workspace/UI planning round, the preferred
deliverables are:

1. a sales workbench information architecture draft
2. a lead list view matrix
3. a manager review dashboard draft
4. a customer-detail operating workspace outline

Those deliverables should use this document as the functional baseline, not as
an optional reference.
