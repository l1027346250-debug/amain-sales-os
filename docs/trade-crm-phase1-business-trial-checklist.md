# Trade CRM Phase 1 Business Trial Checklist

## Scope

This checklist is the business-facing follow-up to the code-side trial-run
playbook.

It is for the first real trial round after the local runtime has already been
verified.

It covers:

- seller daily-use readiness
- manager daily-check readiness
- real owner routing readiness
- post-launch staff level maintenance readiness
- real data input readiness

It does not cover:

- ERP full-process validation
- full production launch sign-off
- second-phase modules

## Required baseline before business trial

Run:

```bash
npm run verify:trade-crm-phase1-business-trial-readiness
```

Expected result:

- writes `tmp/trade-crm-trial/phase1-business-trial-readiness.json`
- writes `tmp/trade-crm-trial/phase1-business-trial-readiness.md`
- returns `status = passed`

## Business trial checklist

### 9.4.1 Seller usage baseline

- sales team confirms `销售每日使用动作清单（系统操作版）.md`
- sales team confirms `一期上线后的销售使用规范与管理规则.md`
- seller can complete the core path:
  - workbench
  - lead follow-up
  - customer follow-up
  - opportunity next action

### 9.4.2 Manager baseline

- manager confirms `主管每日检查版SOP与周复盘模板.md`
- manager can review:
  - new leads
  - overdue first response
  - stalled opportunities
  - team execution status

### 9.4.3 Owner routing baseline

- product-category confirmation sheet is reviewed:
  - `trade-crm-lead-assignment-rules.phase1-product-category-confirmation.csv`
- business approval draft is reviewed:
  - `trade-crm-lead-assignment-rules.phase1-approval-draft.md`
- real owner names are not required before system startup
- real owner mapping must be filled before real inbound lead trial allocation

### 9.4.4 Employee grading baseline

- staff-level template is available:
  - `trade-crm-lead-assignment.phase1-pool-staff-level-template.csv`
- business confirms employee grading will be maintained after runtime launch
- adding or removing staff must not require code changes

### 9.4.5 Real data input baseline

- field sheet is reviewed:
  - `一期字段配置表（后台版_导入模板版_示例数据版）.md`
- dictionary sheet is reviewed:
  - `一期标准字典清单.md`
- real lead/customer/opportunity import should start only after:
  - owner routing is confirmed
  - employee grading is confirmed
  - seller and manager SOP are accepted

## Decision rule

Business trial can start when all of the following are true:

- local runtime walkthrough is clean
- business trial readiness audit passes
- seller SOP is confirmed
- manager SOP is confirmed
- product-category routing review is complete
- post-launch staff maintenance templates are ready

If any of those are missing, continue with preparation work instead of entering
real-data trial operation.
