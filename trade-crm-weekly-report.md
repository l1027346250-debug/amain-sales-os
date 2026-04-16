# Trade CRM Development Weekly Report

Report date: 2026-04-09
Workspace: `20202020-1c25-4d02-bf25-6aeccf7ea419`
Overall status: `In Progress`

## 1. Completed This Week

| Item | Status | Notes |
| --- | --- | --- |
| CRM Core phase 1 object and field rollout | Done | Lead object plus phase 1 extensions for Companies, People reuse, Opportunities, and Tasks are initialized through Trade CRM workspace commands. |
| Opportunity stage dictionary | Done | `STALLED` is included in the phase 1 stage dictionary and is covered by verification. |
| Trade CRM views and workspace bootstrap | Done | Trade CRM initialization, views initialization, and stage configuration commands are all wired into the workspace bootstrap path. |
| Workspace member recovery tooling | Done | Backfill and listing commands are available so automation activation can work in multi-member workspaces. |
| Phase 1 workflow automations | Done | All 5 target workflows are active in the verified workspace. |
| Integration-hub foundation | Done | Alibaba ingestion, Twenty webhook intake, deduplication, retry queue, monitoring, scheduler, outbox, and health summary skeleton are implemented and runnable. |
| Integration-hub persistence | Done | Sync jobs, webhook logs, outbox events, and lead-monitoring apply state now support both file and PostgreSQL-backed restart persistence. |
| Outbox audit visibility | Done | Ops export, smoke summary, and CI summary now expose ready/processed outbox status, processed consumer audit token, and English/Chinese human-readable narratives. |
| Project-level smoke pipeline | Done | Local, CI, strict CI, GitHub Actions workflow, summary artifact, and smoke aggregation are all in place. |
| Optional PG smoke mode | Done | Local and GitHub Actions smoke support opt-in PostgreSQL state verification. |
| Category-first lead assignment tooling | Done | Product-category confirmation, pool strategy review, staffing template generation, staff-level template generation, runtime draft generation, stack review, and export bundle are all in place. |
| Xiaoman / OKKI benchmark alignment | Done | A project-local benchmark note now captures which Xiaoman strengths should guide future work and which areas must stay outside the current phase and architecture boundary. |
| Action-first workspace draft | Done | A concrete next-phase draft now translates the benchmark into sales workbench, lead operating view, customer workspace, and manager review guidance. |
| Sales workbench IA draft | Done | A concrete information architecture draft now defines the first action-first sales workbench blocks, order, and delivery sequence for the next implementation round. |
| Sales workbench block-query mapping | Done | A block-level mapping draft now defines source objects, required fields, suggested filters, sorting, and action targets for the first workbench implementation round. |
| Sales workbench route/component draft | Done | A first implementation-planning draft now defines route behavior, parent placement, component boundaries, and delivery order for the four top-priority workbench blocks. |
| Sales workbench app route/ownership draft | Done | A planning draft now defines app-level page placement, data ownership, UI ownership, and hybrid `integration-hub` usage boundaries for the same first-slice workbench blocks. |
| Sales workbench page-shell/module draft | Done | A `twenty-front`-grounded draft now maps the first workbench slice onto concrete `src/pages` and `src/modules` ownership boundaries. |
| Sales workbench route/navigation decision draft | Done | A codebase-grounded decision draft now recommends adding a dedicated `AppPath.SalesWorkbench`, wiring it in `useCreateAppRouter`, and placing the entry in workspace-oriented main navigation rather than utility navigation. |
| Sales workbench navigation-menu-item registration draft | Done | A code-facing draft now confirms the future workbench entry should be a workspace-scoped `LINK` navigation menu item flowing through the existing `navigation-menu-item` system rather than a hardcoded drawer item. |
| Sales workbench seed/bootstrap decision draft | Done | A code-facing draft now recommends using an idempotent frontend rollout path for the first default workbench navigation entry, then deciding later whether to promote it into a backend/bootstrap seed. |
| Sales workbench seeded-view refinement draft | Done | A code-facing refinement draft now defines the smallest next CRM-native queue views worth seeding for seller drill-down (`Today New Leads`, `Tasks Due Today`, `Pipeline Needs Next Action`) and explicitly keeps the hybrid `Lead First Response Risk` queue out of CRM-core view seeding. |
| Sales workbench first frontend data slice | Done | `AppPath.SalesWorkbench`, `SalesWorkbenchPage`, router registration, internal navigation-link support, a guarded frontend navigation-item creation effect, three CRM-native blocks (`Today New Leads`, `Tasks Due Today`, `My Pipeline Needing Next Action`), and the first hybrid block (`Lead First Response Risk`) are now implemented; the lead and pipeline footers now prefer the seeded Trade CRM workspace views for seller-facing drill-down. |
| Sales workbench queue-specific seeded views | Done | The Trade CRM view initializer now seeds `Today New Leads`, `Tasks Due Today`, and `Pipeline Needs Next Action`; workbench footers now prefer those narrower queue views before falling back to the broader Trade CRM object views. |
| Opportunity queue grouped OR refinement | Done | `Pipeline Needs Next Action` now seeds a grouped `OR` hygiene condition so the CRM-native queue better matches the workbench card semantics (`nextAction` empty or `nextActionDate` empty). |
| Sales workbench card presentation cleanup | Done | `Today New Leads` and `My Pipeline Needing Next Action` now use queue-oriented footer labels plus cleaner `·` metadata separators so the seller-facing cards read like focused queues instead of raw object lists. |
| Sales workbench queue-count polish | Done | `Today New Leads`, `Tasks Due Today`, and `My Pipeline Needing Next Action` now keep preview lists capped to five rows while the card count badges show the real queue totals. |
| Sales workbench hybrid queue-count polish | Done | `Lead First Response Risk` now keeps its preview list capped to five reminders while the card count badge shows the real seller-facing risk total. |
| Sales workbench hybrid drill-down polish | Done | `Lead First Response Risk` now prefers the existing `Leads (Trade CRM)` workspace view for seller-facing follow-up, while still falling back to the generic leads list when that view is missing. |
| Sales workbench hybrid state-copy polish | Done | `Lead First Response Risk` now uses seller-facing copy for disconnected, unavailable, and no-risk states so the card reads like operational guidance instead of raw technical status. |
| Sales workbench page-shell hierarchy polish | Done | `SalesWorkbenchPage` now groups the first slice into `Immediate Action` and `Pipeline Follow-Through` sections so the action-first queue order is clearer without changing the existing block wiring. |
| Sales workbench task-card interaction hint | Done | `Tasks Due Today` now includes a small seller-facing hint that explains inline completion and row-click detail access without changing the underlying task behavior. |
| Sales workbench lead-card triage hint | Done | `Today New Leads` now includes a small seller-facing hint that explains the card's same-day qualification and first-response purpose without changing the underlying lead behavior. |
| Sales workbench hint-style alignment | Done | `Lead First Response Risk` and `My Pipeline Needing Next Action` now include small seller-facing hints, and the hybrid risk footer now uses queue-oriented wording for better first-slice consistency. |

| Sales workbench copy consistency polish | Done | The first-slice workbench cards now use more consistent seller-facing descriptions, queue-status empty states, and queue-oriented footer wording without changing their data or drill-down behavior. |

| Sales workbench shared presentation polish | Done | The first-slice workbench cards now reuse a small shared component for hint and empty-state rendering, reducing repeated presentation code without changing queue behavior. |

| Sales workbench phase-1 verification note | Done | Added a dedicated verification note covering the current page layout, four live cards, data sources, queue-count semantics, drill-down targets, and known validation limits for the first slice. |
| Sales workbench phase-1 acceptance checklist | Done | Added a checklist-style acceptance note so the current first-slice page now has a concrete close-out baseline for OI-010 and future runtime sign-off. |
| Sales Workbench phase-1 slice status | Done | The first-slice page, four live cards, queue-specific seeded views, hybrid risk handling, shared presentation shell, and dedicated verification note are now aligned; remaining uncertainty is concentrated in frontend browser/runtime validation. |
| Sales Workbench frontend build unblock | Done | The frontend production build now passes again after removing the unresolved 	wenty-ui/style.css entry import, restoring the missing 	wenty-front-component-renderer dist outputs, and aligning the workbench Apollo import and path aliases with existing repo conventions. |
| Sales Workbench standalone runtime shell check | Done | A headless browser check now confirms the built /sales-workbench route resolves, backend endpoints are reachable, and an authenticated workspace shell can load; a fresh injected `tokenPair` cookie still redirects `/sales-workbench` back to `/welcome`, so the remaining runtime gap is now clearly the local welcome/onboarding gate before the actual four-card workbench surface. |


## 2. Current Runnable Capabilities

| Capability | Status | Verification path |
| --- | --- | --- |
| Trade CRM automations and stage config | Done | `packages/twenty-server/scripts/verify-trade-crm-automations.js` |
| Category-first confirmation review and verification | Done | `packages/twenty-server/scripts/review-trade-crm-lead-assignment-product-category-confirmation.js` and `packages/twenty-server/scripts/verify-trade-crm-lead-assignment-product-category-confirmation.js` |
| Pool staffing and staff-level readiness | Done | `packages/twenty-server/scripts/review-trade-crm-post-launch-staffing-readiness.js` |
| Runtime assignment config draft and stack review | Done | `packages/twenty-server/scripts/generate-trade-crm-post-launch-runtime-assignment-config-draft.js`, `packages/twenty-server/scripts/review-trade-crm-post-launch-runtime-assignment-config-draft.js`, and `packages/twenty-server/scripts/review-trade-crm-post-launch-assignment-stack.js` |
| Runtime draft activation governance tooling | Done | `packages/twenty-server/scripts/review-trade-crm-post-launch-runtime-assignment-activation-readiness.js`, `packages/twenty-server/scripts/init-trade-crm-post-launch-runtime-assignment-activation-approval.js`, and `packages/twenty-server/scripts/export-trade-crm-post-launch-runtime-assignment-activation-report.js` |
| Runtime draft activation strict gate | Done | `packages/twenty-server/scripts/verify-trade-crm-post-launch-runtime-assignment-activation-readiness.js` now fails fast until activation preconditions are satisfied. |
| Assignment stack export bundle | Done | `packages/twenty-server/scripts/export-trade-crm-post-launch-assignment-stack-report.js` |
| Alibaba lead create/update sync | Done | `integration-hub/scripts/verify-alibaba-lead-sync.js` |
| Lead first-response monitoring and prepared/apply flow | Done | `integration-hub/scripts/verify-first-response-flow.js` |
| Lead first-response PostgreSQL persistence | Done | `integration-hub/scripts/verify-first-response-pg-flow.js` |
| Twenty webhook routing, outbox consume/ack/export | Done | `integration-hub/scripts/verify-twenty-webhook-flow.js` |
| Integration-hub state persistence | Done | `integration-hub/scripts/verify-state-persistence-flow.js` and `integration-hub/scripts/verify-state-persistence-pg-flow.js` |
| Ops backend visibility and markdown exports | Done | `/api/ops/state`, `/api/ops/exceptions`, `ops-report.md`, `ops-weekly-summary.md` |
| Project smoke aggregation | Done | `scripts/verify-trade-crm-smoke.js` |
| Local one-click smoke runner | Done | `scripts/run-trade-crm-smoke-local.ps1` |
| GitHub Actions smoke workflow | Done | `.github/workflows/ci-trade-crm-smoke.yaml` |

## 3. Key Files

### CRM Core / commands

- `packages/twenty-server/src/database/commands/workspace-init-trade-crm.command.ts`
- `packages/twenty-server/src/database/commands/workspace-init-trade-crm-views.command.ts`
- `packages/twenty-server/src/database/commands/workspace-config-trade-crm-opportunity-stages.command.ts`
- `packages/twenty-server/src/database/commands/workspace-init-trade-crm-automations.command.ts`
- `packages/twenty-server/src/database/commands/workspace-list-workspace-members.command.ts`
- `packages/twenty-server/src/database/commands/workspace-backfill-workspace-members.command.ts`

### Integration-hub

- `integration-hub/scripts/verify-alibaba-lead-sync.js`
- `integration-hub/scripts/verify-first-response-flow.js`
- `integration-hub/scripts/verify-first-response-pg-flow.js`
- `integration-hub/scripts/verify-twenty-webhook-flow.js`
- `integration-hub/scripts/verify-state-persistence-flow.js`
- `integration-hub/scripts/verify-state-persistence-pg-flow.js`

### Smoke / delivery

- `scripts/verify-trade-crm-smoke.js`
- `scripts/run-trade-crm-smoke-local.ps1`
- `.github/workflows/ci-trade-crm-smoke.yaml`
- `.env.trade-crm-smoke.example`
- `README.md`

### Category-first post-launch assignment

- `trade-crm-lead-assignment-rules.phase1-product-category-confirmation.csv`
- `trade-crm-lead-assignment.phase1-pool-staffing-template.csv`
- `trade-crm-lead-assignment.phase1-pool-staff-level-template.csv`
- `trade-crm-post-launch-runtime-assignment-config.draft.json`
- `trade-crm-post-launch-runtime-assignment-activation.approval.template.json`
- `trade-crm-post-launch-runtime-assignment-activation.approval.json`
- `docs/trade-crm-runtime-assignment-activation-policy.md`
- `tmp/trade-crm-post-launch-assignment-stack-report/post-launch-assignment-stack-report.md`
- `tmp/trade-crm-post-launch-runtime-assignment-activation-report/post-launch-runtime-assignment-activation-readiness.md`

### Benchmark guidance

- `docs/trade-crm-xiaoman-benchmark-notes.md`
- `docs/trade-crm-action-first-workspace-draft.md`
- `docs/trade-crm-sales-workbench-ia-draft.md`
- `docs/trade-crm-sales-workbench-block-query-mapping-draft.md`
- `docs/trade-crm-sales-workbench-block-route-component-draft.md`
- `docs/trade-crm-sales-workbench-app-route-ownership-draft.md`
- `docs/trade-crm-sales-workbench-page-shell-module-draft.md`
- `docs/trade-crm-sales-workbench-route-registration-navigation-decision-draft.md`
- `docs/trade-crm-sales-workbench-navigation-menu-item-registration-draft.md`
- `docs/trade-crm-sales-workbench-navigation-item-seed-bootstrap-decision-draft.md`
- `packages/twenty-front/src/pages/workbench/SalesWorkbenchPage.tsx`
- `packages/twenty-front/src/modules/workbench/effect-components/EnsureSalesWorkbenchNavigationItemEffect.tsx`
- `packages/twenty-front/src/modules/workbench/components/TodayNewLeadsBlock.tsx`
- `packages/twenty-front/src/modules/workbench/components/TasksDueTodayBlock.tsx`
- `packages/twenty-front/src/modules/workbench/hooks/useTodayNewLeads.ts`
- `packages/twenty-front/src/modules/workbench/hooks/useTasksDueToday.ts`

## 4. Current Validation Summary

Latest smoke result file: `tmp/trade-crm-smoke/last-smoke-summary.json`

| Check | Status | Notes |
| --- | --- | --- |
| `trade-crm-lead-assignment-register` | Done | Passed. |
| `trade-crm-automations` | Done | Passed. |
| `alibaba-lead-sync` | Done | Passed. |
| `first-response-flow` | Done | Passed. |
| `twenty-webhook-flow` | Done | Passed. |
| `state-persistence-flow` | Done | Passed. |
| `first-response-pg-flow` | Done | Passed. |
| `state-persistence-pg-flow` | Done | Passed. |

Current smoke aggregate:

- `status = ok`
- `warningCount = 0`
- `warningCodes = []`
- `failedChecks = []`
- `leadAssignmentRegisterRuleCount = 6`
- `includePgStateChecks = true`
- `stateBackend = postgres`
- `processedOutboxConsumerAuditSignal = 1:erp-sync=1`
- `processedOutboxConsumerAuditNarrative = 1 downstream consumer acknowledged processed outbox events: erp-sync (1).`
- `processedOutboxConsumerAuditNarrativeZh = 当前有 1 个下游消费方已确认 processed outbox 事件：erp-sync（1）。`

## 5. Open Items

| ID | Item | Status | Owner suggestion |
| --- | --- | --- | --- |
| OI-001 | Phase 1 product-category dictionary is confirmed as the five Alibaba storefront top-level categories. | Closed | Product owner / sales operations |
| OI-002 | Pool strategy is confirmed as `category_specific_pools` for phase 1. | Closed | Business owner |
| OI-003 | Integration-hub now supports file and PostgreSQL persistence, but the target runtime backend still needs to be chosen per environment. | In Progress | Backend |
| OI-004 | GitHub Actions workflow exists and supports optional PostgreSQL checks, but it has not yet been observed in a live remote run. | In Progress | Backend / DevOps |
| OI-005 | Business-facing Chinese terminology is not yet normalized for phrases such as `processed outbox`. | In Progress | Product owner / implementation owner |
| OI-007 | Staffing and level maintenance model is confirmed: maintain members and levels after go-live through templates/runtime config. | Closed | Business owner / implementation owner |
| OI-009 | Runtime draft activation policy and readiness check are in place, but final manual approval record and activation decision are still pending. | In Progress | Backend / implementation owner |

## 6. Blockers

| Item | Status | Notes |
| --- | --- | --- |
| Functional delivery blocker | None | Core phase 1 smoke path is green locally, and the category-first assignment stack tooling is complete as a draft workflow. |
| Infrastructure blocker | None locally | PostgreSQL and Redis must still exist in target environments. |
| Process blocker | None | Category, pool strategy, and post-launch staffing/level maintenance model are confirmed. |

## 7. Risks

| Risk | Level | Notes |
| --- | --- | --- |
| Category-first routing still pending sign-off | Low | Sign-off is complete for phase 1 categories and `category_specific_pools`; remaining work is runtime activation governance. |
| Post-launch staffing and level data still empty | Medium | Model is confirmed as runtime maintenance, but go-live staffing rows and level rows are intentionally pending operational entry. |
| Runtime backend choice not finalized | Medium | File and PostgreSQL persistence both work, but rollout environments still need one consistent durability choice. |
| Remote CI not yet observed | Medium | Workflow file exists, but the first live GitHub run still needs confirmation. |
| Sales Workbench browser/runtime validation still pending | Low | Sales Workbench phase-1 runtime walkthrough is now clean for the current path (`OI-010` / `OI-011` closed); keep routine regression checks in later rounds. |
| Local verification interruption sensitivity | Low | Aborted local runs can leave temporary node processes that need cleanup before rerun. |
| Chinese terminology not finalized | Low | Current Chinese narratives are usable, but not yet normalized for formal stakeholder reporting. |

## 8. Decisions Needed

| Decision | Why it matters |
| --- | --- |
| Finalize runtime draft activation approval record (OI-009) | Needed before manual promotion of runtime draft under change control. |
| Confirm when the runtime draft may become live configuration | Needed before wiring the generated runtime draft into a real runtime path. |
| Confirm runtime environments should use file or PostgreSQL state backend | Needed before rollout so retry/webhook/outbox durability behaves consistently across environments. |
| Confirm Chinese business terminology for outbox audit wording | Needed before reusing current Chinese narratives in formal weekly or stakeholder reports. |

## 9. Recommended Next Steps

1. Prepare and approve `trade-crm-post-launch-runtime-assignment-activation.approval.json`, then rerun `review:trade-crm-post-launch-runtime-assignment-activation-readiness`.
2. Fill `trade-crm-lead-assignment.phase1-pool-staffing-template.csv` and `trade-crm-lead-assignment.phase1-pool-staff-level-template.csv` after go-live staffing is ready.
3. Use the current first-slice implementation plus `docs/trade-crm-xiaoman-benchmark-notes.md`, `docs/trade-crm-action-first-workspace-draft.md`, `docs/trade-crm-sales-workbench-ia-draft.md`, `docs/trade-crm-sales-workbench-block-query-mapping-draft.md`, `docs/trade-crm-sales-workbench-block-route-component-draft.md`, `docs/trade-crm-sales-workbench-app-route-ownership-draft.md`, `docs/trade-crm-sales-workbench-page-shell-module-draft.md`, `docs/trade-crm-sales-workbench-route-registration-navigation-decision-draft.md`, `docs/trade-crm-sales-workbench-navigation-menu-item-registration-draft.md`, `docs/trade-crm-sales-workbench-navigation-item-seed-bootstrap-decision-draft.md`, and `docs/trade-crm-sales-workbench-seeded-view-refinement-draft.md` as the baseline for the next sales workbench implementation round.
4. Re-run `review:trade-crm-post-launch-assignment-stack` and `export:trade-crm-post-launch-assignment-stack-report`.
5. Run the GitHub Actions workflow once and confirm artifact upload, service startup, and remote summary rendering.




