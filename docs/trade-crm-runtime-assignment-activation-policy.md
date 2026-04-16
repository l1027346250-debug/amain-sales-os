# Trade CRM Runtime Assignment Activation Policy (Phase 1)

## 1. Purpose

Define when `trade-crm-post-launch-runtime-assignment-config.draft.json` may be
promoted as a live runtime assignment configuration.

This policy keeps activation manual, auditable, and reversible.

## 2. Scope

Applies to post-launch routing activation for phase-1 lead assignment only.

## 3. Activation Preconditions

All conditions below must be met:

1. Category strategy readiness is complete:
   - `review:trade-crm-lead-assignment-product-category-confirmation`
   reports no blockers.
2. Staffing and level readiness is complete:
   - `review:trade-crm-post-launch-assignment-stack`
   reaches `stack_ready_for_runtime_wiring`.
3. Manual approval record exists and is complete:
   - `trade-crm-post-launch-runtime-assignment-activation.approval.json`
   must contain:
   - `approved=true`
   - non-empty `approvedBy`
   - valid ISO datetime in `approvedAt`
   - non-empty `changeTicket`.

## 4. Manual-Only Rule

- Runtime draft promotion must be manual.
- No automation may auto-promote draft to live.
- Activation must be linked to a change ticket and rollback plan.

## 5. Review Command

Use the activation readiness command:

```bash
npm --workspace packages/twenty-server run review:trade-crm-post-launch-runtime-assignment-activation-readiness
```

Expected status values:

- `waiting_for_staffing_or_levels`
- `waiting_for_manual_approval_record`
- `ready_for_manual_activation`

## 6. Approval Record Template

Start from:

- `trade-crm-post-launch-runtime-assignment-activation.approval.template.json`

Copy it to:

- `trade-crm-post-launch-runtime-assignment-activation.approval.json`

Fill required fields before promotion.

## 7. Current Phase-1 Intent

In current phase-1 status:

- categories and pool strategy are confirmed
- staffing members and level rows are intentionally maintained after go-live
- activation remains blocked until operational staffing/levels and approval
  record are complete.

## 8. Execution Record (2026-04-15)

Manual approval record has been populated in:

- `trade-crm-post-launch-runtime-assignment-activation.approval.json`

Recorded values:

- `approved=true`
- `approvedBy=trade-crm-implementation-owner`
- `approvedAt=2026-04-15T11:40:00+08:00`
- `changeTicket=TRDCRM-2026-0415-RUNTIME-ACTIVATION`

Expected activation readiness review status after this record:

- `ready_for_manual_activation`

Manual activation execution commands:

1. Dry-run candidate generation:
   - `npm --workspace packages/twenty-server run prepare:trade-crm-post-launch-runtime-assignment-activation-candidate`
2. Apply activation:
   - `npm --workspace packages/twenty-server run activate:trade-crm-post-launch-runtime-assignment-config`

Execution artifacts:

- `tmp/trade-crm-post-launch-runtime-assignment-activation-execution/post-launch-runtime-assignment-activation-execution.json`
- `tmp/trade-crm-post-launch-runtime-assignment-activation-execution/post-launch-runtime-assignment-activation-execution.md`
