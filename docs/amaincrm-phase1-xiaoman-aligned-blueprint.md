# AMAIN CRM Phase 1 Xiaoman-Aligned Blueprint

Last updated: 2026-04-28

## 1. Purpose

This document defines the Phase 1 rebuild blueprint for AMAIN CRM.

It is stricter than the general rebuild plan. Its purpose is to prevent future
development from drifting back toward Twenty's default CRM structure.

From this point on:

- Xiaoman CRM / OKKI is the product benchmark
- Twenty is only the implementation base
- AMAIN CRM is allowed to replace or bypass Twenty defaults when those defaults
  weaken foreign-trade CRM usability

This document is the phase execution contract.

## 2. Direct Assessment

The current codebase has not failed, but it has drifted.

The drift is real in three ways:

1. too much development effort was spent restoring Twenty runtime baseline
2. module naming moved faster than business operating depth
3. several pages still behave like "modules attached to Twenty" rather than
   Xiaoman-style operating surfaces

The current state is:

- infrastructure recovery: largely complete for core pages
- product realignment: in progress
- Xiaoman-grade business depth: not reached yet

This means the project is recoverable, but only if Phase 1 is executed as a
product rebuild, not as incremental page repair.

## 3. Phase 1 Product Goal

Phase 1 is not "finish all CRM functions".

Phase 1 goal:

- deliver a usable foreign-trade CRM for daily seller operation
- support a small team trial run
- align the product surface with Xiaoman's operating structure
- keep Twenty hidden as the platform layer instead of visible as the product

Phase 1 success means a seller can complete the daily operating chain inside
AMAIN CRM without leaving the system:

1. receive or inspect leads
2. triage and follow up
3. convert qualified leads into customers
4. create and progress opportunities
5. use email in customer and opportunity context
6. let managers inspect risk, delay, and team execution

## 4. Non-Negotiable Product Rules

### 4.1 Do not preserve Twenty menus for their own sake

If a menu, route grouping, or page hierarchy exists because Twenty had it first,
that is not a valid reason to keep it.

The menu structure must be business-led.

### 4.2 Do not build record shells without operating meaning

Every major page must answer:

- what needs action now
- what is overdue
- what is risky
- what is blocked
- what should happen next

If a page cannot answer those questions, it is not finished.

### 4.3 Do not hide governance

Public-pool rules, lead routing, source conversion, field exposure, exports,
playbooks, and permissions must remain visible operational capabilities.

### 4.4 Do not let Twenty core dictate business semantics

Lead, customer, opportunity, and public-pool semantics are owned by AMAIN CRM.

If Twenty core assumptions conflict with foreign-trade CRM semantics, core
should be changed.

## 5. Phase 1 Target Frontend Information Architecture

Phase 1 should use the following product structure.

### 5.1 Level-1 navigation

1. Sales Desk
2. Leads
3. Customers
4. Opportunities
5. Mail
6. Team
7. Automation
8. Settings
9. Admin

This is intentionally not the same as Twenty's native object-oriented structure.

### 5.2 Level-1 ownership

#### 5.2.1 Sales Desk

Purpose:

- the seller's daily start page
- the manager's daily review page

Required subpages:

- My Queue
- First Response Risk
- Follow-up Due
- Overdue
- Quote Follow-up
- Stalled Deals
- Manager Review

#### 5.2.2 Leads

Purpose:

- acquisition intake and pre-customer operation

Required subpages:

- Lead Pool
- Channel Leads
- Untouched Leads
- Due Follow-up
- Source View
- Category View
- Routing Review
- Communication Feed

#### 5.2.3 Customers

Purpose:

- customer operating center

Required subpages:

- Active Customers
- Public Pool
- Key Accounts
- Dedup Center
- Import Center
- Customer Settings

#### 5.2.4 Opportunities

Purpose:

- commercial progression and quotation management

Required subpages:

- Pipeline
- My Opportunities
- Quote Follow-up
- Stalled
- Lost Analysis
- Next Actions

#### 5.2.5 Mail

Purpose:

- communication execution in business context

Required subpages:

- Inbox
- Pending Replies
- Customer Conversations
- Opportunity Conversations
- Development Mail
- Tracking

#### 5.2.6 Team

Purpose:

- execution collaboration and manager visibility

Required subpages:

- Tasks
- Calendar
- Team Review
- Performance Snapshot

#### 5.2.7 Automation

Purpose:

- business rule execution and monitoring

Required subpages:

- Lead Routing Rules
- Follow-up Rules
- Public Pool Rules
- Quote Reminder Rules
- Stalled Opportunity Rules
- Automation Logs

#### 5.2.8 Settings

Purpose:

- business-facing configuration

Required subpages:

- Lead Dictionaries
- Customer Dictionaries
- Opportunity Stages
- Email Templates
- Tags and Groups
- Assignment Settings

#### 5.2.9 Admin

Purpose:

- enterprise governance and structural control

Required subpages:

- Custom Fields
- Field Layout
- Export Center
- Recycle Bin
- Report Templates
- Source Convert
- Independent Station
- Sales Playbook
- Permissions

## 6. Mapping From Current Structure To Target Structure

### 6.1 Keep and rename

Current modules that should survive, but under new meaning:

- `Workbench` -> `Sales Desk`
- `Prospecting` -> `Leads`
- `Collaboration` + `Analytics` -> mostly absorbed into `Team`
- `Enterprise` -> `Admin`

### 6.2 Keep and deepen

Current modules that are directionally correct but too shallow:

- Customers
- Opportunities
- Mail

### 6.3 Remove from the product surface

These should remain implementation concepts, not user-facing product structure:

- Twenty-native object taxonomy as primary navigation
- generic record-first entry points as the main daily route
- core-only technical naming that users do not care about

## 7. Phase 1 Core Business Flows

Phase 1 must be judged by business flow, not by page count.

### 7.1 Lead operation flow

1. lead arrives from channel or manual import
2. lead appears in Lead Pool with source, category, owner, and aging
3. seller can mark first touch, schedule next follow-up, or convert
4. manager can inspect untouched and overdue leads

### 7.2 Lead to customer conversion flow

1. seller converts lead
2. system creates or reuses contact
3. system creates or reuses customer
4. conversion writes timeline and operation history
5. customer enters customer workspace with ownership preserved

### 7.3 Customer to opportunity flow

1. seller creates opportunity from customer context
2. owner, contact, next action, and next action date are set
3. opportunity appears in pipeline and relevant queues
4. customer detail shows current opportunities and next execution cues

### 7.4 Opportunity follow-up flow

1. quote sent or stage updated
2. reminder rules evaluate inactivity
3. quote follow-up and stalled views surface the record
4. manager and seller can act from queue pages

### 7.5 Communication flow

1. inbound or outbound email is attached to customer and opportunity context
2. pending replies become actionable
3. communication writes back to timeline
4. seller can work from the business page, not from isolated mail storage

### 7.6 Public pool flow

1. inactive or unowned customer moves to public pool by explicit rule
2. reason, timestamp, prior owner, and claim audit are visible
3. claim and transfer actions are tracked

## 8. What Must Be Rewritten Or Taken Over From Twenty

### 8.1 Navigation shell

Must be owned by AMAIN CRM:

- level-1 nav
- level-2 nav
- default home
- role-aware default landing behavior

### 8.2 Daily operating pages

Must be AMAIN CRM-first:

- Sales Desk
- Leads
- Customers
- Opportunities
- Mail

These pages may consume Twenty objects, but their layout and operating logic
must not be constrained by generic record-list assumptions.

### 8.3 Object action layer

Must be extended deeply:

- record row actions
- command menu actions
- detail-page actions
- timeline writeback
- conversion idempotency

### 8.4 Metadata and workspace initialization

Must be controlled by AMAIN CRM requirements:

- lead metadata
- customer segmentation fields
- public-pool fields
- opportunity operational fields
- routing dictionaries
- source/category dictionaries

### 8.5 Admin and governance

Must remain explicit:

- field governance
- route/rule governance
- playbook governance
- export governance
- permission governance

## 9. Phase 1 Scope Boundary

### 9.1 In scope

- seller daily-use core flows
- manager daily inspection core flows
- lead/customer/opportunity/mail chain
- public-pool basic operations
- field/layout/export/permission governance baseline
- routing and reminder rules baseline

### 9.2 Not in scope

- ERP-level order flow
- finance settlement
- full sample/order production chain
- deep AI autonomous execution
- every Xiaoman module in phase 1

This scope boundary is necessary. Without it, the project will overbuild and
delay trial usage.

## 10. Phase 1 Delivery Waves

### Wave 1: Product shell reset

Target duration:

- 3 to 5 days

Deliverables:

- new AMAIN CRM IA applied to navigation shell
- Sales Desk / Leads / Customers / Opportunities / Mail / Team / Automation /
  Settings / Admin grouping visible
- Twenty-native CRM entry no longer dominates daily navigation

Acceptance:

- a user entering the product sees AMAIN CRM, not Twenty with renamed tabs

### Wave 2: Core operating chain stabilization

Target duration:

- 7 to 10 days

Deliverables:

- lead queue pages operate correctly
- lead conversion is idempotent
- customer detail acts as workspace
- opportunity creation and queue writeback are stable
- mail context is attached to customer and opportunity

Acceptance:

- a seller can complete a day-one operating path without dead ends

### Wave 3: Manager and governance baseline

Target duration:

- 7 to 10 days

Deliverables:

- manager review page
- first-response and stalled risk visibility
- public-pool rules and audit
- admin governance baseline usable
- settings and automation visible to operations staff

Acceptance:

- a manager can inspect team execution and adjust operating rules

### Wave 4: Trial-run hardening

Target duration:

- 7 to 14 days

Deliverables:

- remove remaining placeholder behaviors
- improve loading, error, and empty states
- complete timeline and operation-history writeback
- run a small-team trial package

Acceptance:

- 3 to 5 users can trial the system continuously

## 11. Realistic Timeline

Assuming development stays focused on this blueprint:

### 11.1 Minimum trial-usable version

- 2 to 3 weeks

This supports:

- core daily seller use
- basic manager check
- small internal trial

### 11.2 Small-team usable version

- 4 to 6 weeks

This supports:

- 3 to 5 people using the system daily
- stable core flows
- governance baseline

### 11.3 Strong Phase 1 version

- 8 to 12 weeks

This supports:

- much closer Xiaoman-style operating depth
- manager reviews
- stronger automation and team visibility
- more trustworthy production-style usage

## 12. Immediate Execution Order

The next development work should happen in this order.

### 12.1 Reset the frontend product shell

Tasks:

1. replace current top-level naming with the target IA
2. merge or re-home Collaboration and Analytics into Team / Automation /
   Settings where appropriate
3. hide Twenty-first entry points from normal daily navigation

### 12.2 Fix lead conversion idempotency in core

Tasks:

1. reuse existing person by email when converting
2. avoid duplicate customer creation when existing customer matches
3. return structured success/skip status for bulk conversion

### 12.3 Promote customer detail into a true operating workspace

Tasks:

1. next actions
2. live opportunities
3. recent mail
4. public-pool status
5. operation history

### 12.4 Turn lead queues into real queues

Tasks:

1. untouched
2. first response risk
3. due follow-up
4. by source
5. by category

### 12.5 Make manager review unavoidable

Tasks:

1. manager review page
2. team risk summary
3. stalled and overdue ownership view
4. actionable links into queue pages

## 13. Delivery Discipline

From this point on, every development task must answer four questions:

1. which Xiaoman-aligned business capability does this advance
2. which Phase 1 wave does it belong to
3. does it strengthen product structure or only patch a technical surface
4. does it reduce or increase dependence on Twenty's default CRM behavior

If a task cannot answer those questions clearly, it should not take priority.

## 14. Bottom-Line Decision

The project is not too late.

But it is too late to keep developing by local page repair alone.

The only viable path now is:

- reset the product shell
- force every module into Xiaoman-style operating ownership
- keep Twenty as platform infrastructure
- judge progress by usable business flow, not by page count

This document is the working baseline for that shift.
