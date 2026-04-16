# Trade CRM Open Items Register

Last updated: 2026-04-09
Workspace: `20202020-1c25-4d02-bf25-6aeccf7ea419`

| ID | Topic | Description | Impact | Current status | Suggested owner | Suggested due date | Blocks go-live |
| --- | --- | --- | --- | --- | --- | --- | --- |
| OI-001 | Product category sign-off | Business decision confirmed: phase 1 uses the five Alibaba storefront top-level categories as the standard `productCategory` dictionary. | Lead intake classification, downstream routing consistency | Closed | Product owner / sales operations | 2026-04-09 | No |
| OI-002 | Pool strategy confirmation | Business decision confirmed: phase 1 keeps `category_specific_pools` (one dedicated pool per product category) instead of a shared pool. | Lead triage flow, assignment model, reminder design | Closed | Product owner / sales operations | 2026-04-09 | No |
| OI-003 | Runtime state backend decision | Integration-hub retry jobs, webhook logs, outbox events, and lead-monitoring apply state now support both file and PostgreSQL persistence, but runtime environments still need one approved backend choice. | External sync durability, restart behavior, operations consistency | In Progress | Backend / DevOps | 2026-04-15 | No |
| OI-004 | Remote CI verification | `.github/workflows/ci-trade-crm-smoke.yaml` is implemented and supports optional PostgreSQL checks, but it has not yet been observed in a live GitHub run. | Release confidence, artifact verification, remote summary validation | In Progress | DevOps / Backend | 2026-04-10 | No |
| OI-005 | Chinese terminology normalization | Chinese audit narratives are now present in smoke summary, workflow summary, and weekly markdown, but wording such as `processed outbox` still needs product-level normalization. | Stakeholder readability, reporting consistency | Review Needed | Product owner / implementation owner | 2026-04-12 | No |
| OI-006 | Local config rollout | `.env.trade-crm-smoke.example` exists, but each environment still needs a real `.env.trade-crm-smoke` or equivalent env injection strategy. | Repeatable local verification, onboarding | Review Needed | Backend / implementation owner | 2026-04-10 | No |
| OI-007 | Post-launch staffing and level model | Maintenance model confirmed: assign members after go-live, and add/remove/adjust staff levels at runtime without code-path changes. | Post-launch routing flexibility, operating model | Closed | Business owner / implementation owner | 2026-04-09 | No |
| OI-009 | Runtime draft activation path | Activation policy, readiness review command, approval-file initializer, activation-readiness export bundle, and strict verification gate are now in place; final approval values and go-live activation decision are still pending. | Launch governance, change control, assignment safety | In Progress | Backend / implementation owner | 2026-04-16 | No |
| OI-008 | Local verification cleanup robustness | Aborted local smoke runs can leave temporary node processes behind, requiring manual cleanup before rerun. | Developer workflow stability | In Progress | Backend | 2026-04-15 | No |
| OI-010 | Sales Workbench phase-1 browser/runtime verification | Latest route-scoped walkthrough confirms `/sales-workbench` four-card rendering with no page-level fallback and no failed requests captured on the workbench route. | Workbench acceptance confidence, demo readiness | Closed | Frontend / implementation owner | 2026-04-09 | No |
| OI-011 | AggregateCompanies warning-level GraphQL 400 | Route-aware fix is now applied in frontend view-picker total-count behavior; latest runtime walkthrough reports no failed requests and no failed GraphQL operations. | Runtime noise, schema compatibility | Closed | Frontend / Backend | 2026-04-09 | No |


## Recommended Handling Order

1. OI-009
2. OI-004
3. OI-003
4. OI-005
5. OI-006
6. OI-008
7. OI-001
8. OI-002
9. OI-007
10. OI-010
11. OI-011


