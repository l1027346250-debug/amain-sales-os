# Trade CRM Xiaoman Benchmark Notes

Last updated: 2026-04-08

## 1. Purpose

This note records what the current Trade CRM implementation should learn from
the Xiaoman / OKKI design materials under `G:\codex\xiaomanCRM`, while staying
inside this project's existing architecture boundary:

- `Twenty = CRM Core`
- `integration-hub = integration and orchestration layer`
- `AI = assistive layer`

This document is a benchmark note, not a UI copy spec.

## 2. Source Materials Reviewed

The following Xiaoman / OKKI materials were reviewed in this round:

- `G:\codex\xiaomanCRM\docs\okki-crm-rebuild-spec.md`
- `G:\codex\xiaomanCRM\docs\okki-crm-main-menu-report.md`
- `G:\codex\xiaomanCRM\docs\menu-05-leads-breakdown.md`
- `G:\codex\xiaomanCRM\docs\menu-06-customers-breakdown.md`
- `G:\codex\xiaomanCRM\docs\menu-07-opportunities-breakdown.md`

The following project-level design documents were re-read as the governing
constraints for how those findings may be used:

- `G:\codex\twentyCRM\外贸CRM全局详细设计方案（全栈架构_模块关系_落地步骤）.md`
- `G:\codex\twentyCRM\Twenty实施版对象创建与配置顺序.md`
- `G:\codex\twentyCRM\一期字段配置表（后台版_导入模板版_示例数据版）.md`
- `G:\codex\twentyCRM\销售每日使用动作清单（系统操作版）.md`
- `G:\codex\twentyCRM\主管每日检查版SOP与周复盘模板.md`

## 3. What Xiaoman Does Well

### 3.1 Four-layer information architecture is very clear

OKKI's main navigation is not random. It is split into a stable four-layer
structure:

- acquisition layer
- customer and opportunity operation layer
- execution and collaboration layer
- management and configuration layer

This is strong because users understand where work starts, where it advances,
and where configuration belongs.

### 3.2 The system is action-driven, not record-driven

The best pages are not just data tables. They consistently emphasize:

- what needs follow-up
- what is overdue
- what is risky
- what to do next

This matches the project's existing daily-sales and manager SOP documents very
well.

### 3.3 Lead pages use operating dimensions, not only static fields

The lead module is effective because it combines:

- lead status tree
- source tree
- unread / pending / touched states
- aging signals like "days without contact"

That makes the lead list an operating queue, not a passive archive.

### 3.4 Customer pages are treated as an operating center

The customer module is not modeled as a flat master-data table. It combines:

- stage
- segment
- group
- score
- region
- ownership

This makes the customer page useful for prioritization, not only lookup.

### 3.5 Opportunity pages are stage-first and business-specific

The opportunity pipeline is more useful because stage names describe real
foreign-trade movement, not only generic CRM abstractions.

That is closer to how the sales team actually thinks.

### 3.6 Configuration is first-class, not hidden

The management layer clearly exposes:

- field configuration
- source settings
- dedupe rules
- customer settings
- opportunity settings
- automation-related controls

This reduces "tribal knowledge" and makes the operating model easier to evolve.

### 3.7 Acquisition capability is separated from CRM core

`OKKI Leads` is handled like a distinct acquisition system, not forced into the
same mental model as the customer and opportunity core.

This is very important for our project because it reinforces the current
boundary:

- external lead collection and orchestration belong in `integration-hub`
- core record management belongs in `Twenty`

## 4. How These Findings Improve This Project

### 4.1 Keep the existing architecture split

The benchmark strengthens, not weakens, the current project direction:

- `Twenty` should remain the CRM core for Leads, Companies, People,
  Opportunities, Tasks, views, and minimal workflows
- `integration-hub` should remain the acquisition, webhook, retry, scheduler,
  outbox, and synchronization middle layer
- AI should remain advisory only

This means we should learn structure from Xiaoman without collapsing external
integration logic into `Twenty`.

### 4.2 Future workbench design should be action-first

The next phase should favor a workspace that surfaces:

- today new leads
- overdue tasks
- quotation follow-up risk
- stalled opportunities
- next actions

This is more aligned with the project SOP documents than a generic dashboard.

### 4.3 Lead views should keep status and source as first-class filters

The current phase-1 lead modeling already standardizes:

- `lead_status`
- `source`
- `product_category`
- follow-up dates

The benchmark says the next UX/reporting layer should keep those dimensions
visible as operating filters, not hide them in advanced search only.

### 4.4 Product-category-first routing is the right direction

Xiaoman's structure validates a separation between:

- acquisition classification
- operating pool
- later ownership

That matches the current category-first rollout:

- phase 1 confirms `productCategory`
- pools are defined before real staff data is finalized
- staffing and staff levels are filled later

### 4.5 Customer detail should evolve into an operating workspace

The next meaningful UX/documentation target after phase 1 is not "more fields".
It is to make the customer detail experience support:

- recent activity
- current opportunities
- next action
- risk signal
- stage / grouping / score context

### 4.6 Stage design should stay business-specific

The benchmark supports the current decision to avoid over-generic stage naming.
For this project, the most valuable stage and status fields are still:

- `lead_status`
- `stage`
- `lost_reason`
- `next_action`
- `next_action_date`

### 4.7 Management and configuration should remain explicit

The current project should continue to expose, document, and verify:

- product-category confirmation
- pool strategy
- staffing template
- staff-level template
- runtime assignment draft
- state backend choice
- smoke and export artifacts

This is the equivalent of making operations governance first-class.

## 5. What We Should Not Copy

The benchmark is useful, but several things should not be copied directly into
the current phase:

### 5.1 Do not copy UI one-to-one

We should learn page structure and operating logic, not reproduce Xiaoman's
screen layout pixel-by-pixel.

### 5.2 Do not collapse acquisition into CRM core

External channel logic, dedupe, retry, and synchronization should still live in
`integration-hub`, not inside Twenty core modules.

### 5.3 Do not pull second-phase transaction breadth into phase 1

Even though Xiaoman shows deeper transaction modules, this project still should
not force full Quotes / Samples / Orders implementation into the current phase 1.

### 5.4 Do not let AI write core state automatically

The benchmark reinforces AI assistance, but our project rule still stands:

- AI can score, summarize, and recommend
- AI must not directly decide win/loss or critical business state transitions

## 6. Immediate Development Guidance

The most useful benchmark-driven priorities for the next development stage are:

1. Keep the current category-first assignment path and finish it as a
   configuration workflow, not as a hard-coded owner assignment feature.
2. Make future lead and opportunity working views action-first, with visible
   status/source/risk dimensions.
3. Treat customer detail and manager daily review as operating surfaces, not
   only reporting surfaces.
4. Continue strengthening explicit governance artifacts for routing, staffing,
   automation, and runtime backend choice.
5. Use Xiaoman as a benchmark for product logic and operating structure, not as
   a reason to break the current phase boundary.

## 7. Recommended Next Use Inside This Repository

This benchmark should be used in three ways:

### 7.1 Design reference

Use this file when deciding future workspace/dashboard/detail-page priorities.

### 7.2 Scope guard

Use this file to avoid two common mistakes:

- trying to copy Xiaoman's entire breadth into phase 1
- weakening the `Twenty` / `integration-hub` boundary

### 7.3 Review checklist

When a future change claims to be "more like Xiaoman", verify that it improves
at least one of these:

- action orientation
- status-based operation
- customer-as-workspace
- business-specific pipeline
- explicit operations governance

If it does not, it is probably noise rather than real benchmark learning.
