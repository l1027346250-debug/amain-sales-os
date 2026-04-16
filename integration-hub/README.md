# Trade CRM Integration Hub

`integration-hub` is the external orchestration layer for the Trade CRM project.

It is intentionally separated from `Twenty` core responsibilities:

- `Twenty`: CRM object model, views, workflows, internal sales operations
- `integration-hub`: external ingestion, deduplication, webhook consumption, retry, scheduler
- Phase-1 module boundary now explicitly includes:
  - `classification`: normalize source, country, and product-category intake values
  - `routing`: resolve phase-1 owner assignment from product-category, country, and default rules
  - `audit-log`: emit intake-side audit records for reconciliation and retry review
- `inbound/alibaba mapper`: translate Alibaba inquiry payloads into the standard `LeadIntakeDto` before they enter lead-intake
- `webhooks/twenty router`: route accepted Twenty webhook events into explicit phase-1 handlers before outbox persistence
- `ops runtime overview`: aggregate scheduler, retry queue, outbox, and webhook exception signals into one phase-1 operations endpoint
- `lead-created automation records`: expose assignment and initial first-response task outcomes for newly created leads so phase-1 automation can be verified without inspecting raw logs
- `lead first-response reminder queue`: expose overdue owner-reminder, manager-escalation, and unassigned-overdue lanes through a dedicated monitoring endpoint
- `quotation follow-up reminder queue`: expose overdue quotation follow-up lanes through a dedicated monitoring endpoint
- `stalled opportunity reminder queue`: expose stalled re-engagement lanes through a dedicated monitoring endpoint
- `AI`: recommendation and summarization only

## Phase 1 scope

- Alibaba lead ingestion endpoint
- Twenty webhook receiver endpoint
- lead deduplication strategy service
- Twenty API client wrapper
- scheduler/retry module skeleton
- webhook event routing and file-backed processing log
- lead first-response SLA monitoring and prepared reminder task preview
- opportunity quote-follow-up and stalled-opportunity monitoring
- persisted first-response applied task records for restart-safe duplicate protection
- file-backed persistence for retry jobs and webhook event logs
- optional PostgreSQL-backed persistence for retry jobs, webhook logs, and lead monitoring apply state
- AI assistant service layer for cross-object suggestion/summary/draft/scoring output (read-only guidance)

## Local commands

```bash
cd integration-hub
node ../node_modules/@nestjs/cli/bin/nest.js build
node dist/main.js
```

```bash
cd integration-hub
npm run build
npm run export:ops-report
npm run export:outbox-batch
npm run export:outbox-processed-batch
npm run verify:alibaba-lead-sync
npm run verify:first-response-flow
npm run verify:stalled-opportunity-flow
npm run verify:twenty-webhook-flow
npm run verify:state-persistence-flow
npm run verify:state-persistence-pg-flow
```

## Environment variables

- `PORT`
- `INTEGRATION_HUB_API_PREFIX`
- `TWENTY_BASE_URL`
- `TWENTY_API_KEY`
- `TWENTY_WORKSPACE_ID`
- `TWENTY_WEBHOOK_SECRET`
- `ALIBABA_SHARED_SECRET`
- `REDIS_URL`
- `LEAD_ASSIGNMENT_RULES_JSON`
- `LEAD_ASSIGNMENT_DEFAULT_ASSIGNEE_ID`
- `LEAD_FIRST_RESPONSE_TASK_AUTO_APPLY`
- `LEAD_FIRST_RESPONSE_TASK_DUE_HOURS`
- `LEAD_FIRST_RESPONSE_SLA_HOURS`
- `LEAD_FIRST_RESPONSE_MANAGER_ESCALATION_HOURS`
- `OPPORTUNITY_QUOTE_FOLLOWUP_AFTER_DAYS`
- `OPPORTUNITY_QUOTE_FOLLOWUP_TASK_AUTO_APPLY`
- `OPPORTUNITY_QUOTE_FOLLOWUP_TASK_DUE_HOURS`
- `OPPORTUNITY_STALLED_AFTER_DAYS`
- `OPPORTUNITY_STALLED_TASK_AUTO_APPLY`
- `OPPORTUNITY_STALLED_TASK_DUE_HOURS`
- `INTEGRATION_HUB_STATE_DIR`
- `INTEGRATION_HUB_STATE_BACKEND`
- `INTEGRATION_HUB_STATE_PG_URL`

## Monitoring endpoints

- `POST /api/ingest/leads`
- `GET /api/scheduler/status`
- `POST /api/scheduler/retry-sweep`
- `POST /api/scheduler/health-check`
- `GET /api/health`
- `GET /api/health/integration`
- `GET /api/ops/state`
- `GET /api/ops/exceptions`
- `GET /api/outbox/consume`
- `POST /api/outbox/ack`
- `GET /api/outbox/events`
- `GET /api/outbox/events/:id`
- `POST /api/outbox/events/:id/ack`
- `GET /api/sync-jobs`
- `GET /api/sync-jobs/:id`
- `GET /api/webhooks/twenty/events`
- `GET /api/webhooks/twenty/events/:id`
- `GET /api/lead-monitoring/first-response`
- `GET /api/lead-monitoring/first-response?refresh=true`
- `GET /api/lead-monitoring/first-response/tasks/prepared`
- `GET /api/lead-monitoring/first-response/tasks/applied`
- `GET /api/lead-monitoring/first-response/tasks/applied/:id`
- `GET /api/lead-monitoring/first-response/leads/:leadId`
- `POST /api/lead-monitoring/first-response/tasks/:leadId/apply`
- `POST /api/lead-monitoring/first-response/tasks/:leadId/apply?apply=true`
- `GET /api/opportunity-monitoring/quote-follow-up`
- `GET /api/opportunity-monitoring/quote-follow-up?refresh=true`
- `GET /api/opportunity-monitoring/quote-follow-up/reminders`
- `GET /api/opportunity-monitoring/quote-follow-up/tasks/prepared`
- `GET /api/opportunity-monitoring/quote-follow-up/tasks/applied`
- `GET /api/opportunity-monitoring/quote-follow-up/tasks/applied/:id`
- `GET /api/opportunity-monitoring/quote-follow-up/opportunities/:opportunityId`
- `POST /api/opportunity-monitoring/quote-follow-up/tasks/:opportunityId/apply`
- `POST /api/opportunity-monitoring/quote-follow-up/tasks/:opportunityId/apply?apply=true`
- `GET /api/opportunity-monitoring/stalled`
- `GET /api/opportunity-monitoring/stalled?refresh=true`
- `GET /api/opportunity-monitoring/stalled/reminders`
- `GET /api/opportunity-monitoring/stalled/tasks/prepared`
- `GET /api/opportunity-monitoring/stalled/tasks/applied`
- `GET /api/opportunity-monitoring/stalled/tasks/applied/:id`
- `GET /api/opportunity-monitoring/stalled/opportunities/:opportunityId`
- `POST /api/opportunity-monitoring/stalled/tasks/:opportunityId/apply`
- `POST /api/opportunity-monitoring/stalled/tasks/:opportunityId/apply?apply=true`
- `GET /api/ai-assistant/capabilities`
- `POST /api/ai-assistant/suggestions`
- `POST /api/ai-assistant/generate`

`POST /api/ingest/leads` is the normalized phase-1 lead intake endpoint for
non-Alibaba sources. It accepts a validated JSON payload with:

- `source`
- `leadName`
- optional `externalId`
- optional `contactName`
- optional `companyName`
- optional `email`
- optional `phone`
- optional `whatsapp`
- optional `country`
- optional `productCategory`
- optional `interestedProduct`
- optional `message`
- optional `notes`

The endpoint returns the deduplication decision plus the downstream Twenty
write result, and it uses the same retry queue fallback as the Alibaba intake
path when Twenty returns a retryable failure.

Phase-1 intake now also returns:

- `assignment`: routing result based on `productCategory -> country -> default`
- `firstResponseTask`: initial first-response task creation or preparation result

Lead assignment is configuration-driven so the system can go live before real
sales ownership data is finalized. Use `LEAD_ASSIGNMENT_RULES_JSON` with a JSON
array such as:

```json
[
  {
    "id": "ultrasound-rule",
    "matchField": "productCategory",
    "matchValue": "Ultrasound",
    "assigneeId": "member-001"
  },
  {
    "id": "uae-rule",
    "matchField": "country",
    "matchValue": "United Arab Emirates",
    "assigneeId": "member-002"
  }
]
```

If no rule matches, `LEAD_ASSIGNMENT_DEFAULT_ASSIGNEE_ID` is used when present.
Otherwise the lead stays unassigned and the response explains why.

Phase-1 deduplication currently uses a small deterministic rule set:

- normalized `email` -> `high` confidence, recommended action `merge_or_update`
- normalized `phone` -> `medium` confidence, recommended action `review_before_merge`
- normalized `companyName + contactName` -> `low` confidence, recommended action `review_before_merge`
- no stable key -> recommended action `create_new`

The intake response now includes a structured `deduplication` block with
  `strategy`, `score`, `confidence`, `recommendedAction`, `inputProfile`,
  `matchedOn`, `reason`, and `reviewSummary`.

The `apply` endpoint stays in preview mode by default. It only attempts a real
`/rest/tasks` write when `apply=true` is passed and `TWENTY_API_KEY` is
configured.

`GET /api/sync-jobs` and `GET /api/webhooks/twenty/events` both support
lightweight query filters for local operations and debugging:

- `limit`
- `status`
- `target` for sync jobs
- `event` for Twenty webhook logs

`GET /api/ops/state` provides a single operations snapshot for the current
state directory, lead monitoring summary, recent applied task records, recent
sync jobs, recent Twenty webhook events, and recent outbox events. It also
shows the active state backend (`file` or `postgres`) plus `twentyClient`
configuration status, including whether the hub is still in prepared mode due
to a missing `TWENTY_API_KEY`. Use `recent` to control how many recent records
are returned for each section.

`GET /api/ops/exceptions` provides an exception-first view with pending and
failed sync jobs, duplicate first-response apply counts, recent sync error
summaries, the active state backend, and the current `twentyClient`
configuration snapshot. Use `recent` to control how many recent records are
returned.

`GET /api/health/integration` now includes the same `twentyClient`
configuration block so local verification can confirm whether Twenty writes are
actually configured for remote mode or still running in prepared mode.

`GET /api/scheduler/status` exposes the most recent retry sweep and sync health
check execution window plus their last summaries. `POST /api/scheduler/retry-sweep`
and `POST /api/scheduler/health-check` allow local operators to trigger the
phase-1 scheduler actions on demand instead of waiting for cron. Use
`POST /api/scheduler/retry-sweep?force=true` for local verification when a job
has just been queued and its `nextRetryAt` has not arrived yet.

`GET /api/outbox/events` exposes normalized downstream events produced by
phase-1 webhook handlers. This is the handoff surface for future ERP, message,
or async consumer modules.

`GET /api/outbox/consume` exposes the same normalized events as a lightweight
consumer batch with `exportedAt`, `eventCount`, and optional `aggregateType` /
`eventType` / `consumerName` / `since` filters. This is the preferred pull
endpoint for future ERP or message-side consumers that need batch polling
without extra ops metadata.

`GET /api/outbox/events` also supports an optional `status=ready|processed`
and `consumerName` / `since` filter for local ops checks, and
`POST /api/outbox/events/:id/ack` marks a single outbox event as `processed`
after a downstream consumer has handled it.
`POST /api/outbox/ack` does the same in batch form with
`{ "ids": [...], "consumerName": "...", "ackedBy": "..." }`. The optional
`consumerName` / `ackedBy` fields are persisted on processed outbox events for
basic downstream auditability.

`GET /api/opportunity-monitoring/quote-follow-up/reminders` exposes a direct
reminder queue for overdue quotation follow-up opportunities. It supports
`refresh=true`, `limit`, and `assigneeState=assigned|unassigned` so operations
can review owner queues separately from routing-gap opportunities.

`GET /api/opportunity-monitoring/stalled/reminders` exposes a direct reminder
queue for stalled opportunities. It supports `refresh=true`, `limit`, and
`assigneeState=assigned|unassigned` so operations can separate owner
re-engagement queues from routing-gap opportunities.

`npm run export:ops-report -- --base-url=http://127.0.0.1:3020 --recent=5
--out-dir=tmp/ops-report` fetches both `/api/ops/state` and
`/api/ops/exceptions`, then writes:

- `ops-state.json`
- `ops-exceptions.json`
- `ops-report.md`
- `ops-weekly-summary.md`

`npm run export:outbox-batch -- --base-url=http://127.0.0.1:3020 --limit=20
--aggregate-type=lead --consumer-name=erp-sync --since=2026-04-08T10:00:00.000Z
--out-file=tmp/outbox-batch.json` fetches `/api/outbox/consume` with the given
filters and writes the resulting batch to a JSON file for downstream local
integration testing.

`npm run export:outbox-processed-batch -- --base-url=http://127.0.0.1:3020
--limit=20 --aggregate-type=lead --consumer-name=erp-sync
--since=2026-04-08T10:00:00.000Z --out-file=tmp/outbox-processed-batch.json`
fetches processed outbox events through `/api/outbox/events` and writes a
filtered audit batch for downstream reconciliation.

`verify:first-response-flow` starts a mock Twenty API, boots `integration-hub`
on a temporary port, refreshes overdue first-response leads, previews prepared
task requests, verifies that `apply=true` creates a real `/rest/tasks`
request against the mock service, then restarts the hub to confirm applied
task records are restored from disk.

`verify:first-response-escalation-flow` verifies the phase-1 reminder policy:
owner reminder after the first-response SLA is missed, manager escalation after
the escalation threshold, and a separate unassigned-overdue path when a lead
still has no owner.

`verify:quotation-followup-flow` verifies the phase-1 quotation follow-up rule:
an opportunity in `Quotation Sent` with no update for more than the configured
threshold results in a quotation follow-up task for the current owner.

`verify:stalled-opportunity-flow` verifies the phase-1 stalled opportunity
rule: an opportunity with no update for more than the configured threshold
results in a re-engagement task for the current owner.

`verify:first-response-pg-flow` runs the same first-response restart
verification against the PostgreSQL backend.

`verify:alibaba-lead-sync` starts a mock Twenty API, boots `integration-hub`
on a temporary port, posts a signed Alibaba lead twice to verify create then
update behavior, and confirms invalid signatures are rejected with `401`.

All ingestion endpoints now run through Nest validation, so malformed payloads
return `400` before downstream mapping or retry logic runs.

`verify:twenty-webhook-flow` boots `integration-hub` on a temporary port,
posts signed Twenty webhook payloads to verify processed and ignored routing,
rejects an invalid signature with `401`, records semantically invalid handled
events as `failed`, and confirms webhook health summary counts plus outbox
event creation and batch consumption through
`/api/health/integration`, `/api/outbox/events`, `/api/outbox/consume`,
`/api/outbox/ack`, `/api/outbox/events/:id/ack`, `/api/ops/state`, and
`/api/ops/exceptions`.

`verify:state-persistence-flow` boots `integration-hub` twice against the same
temporary state directory, verifies that a retry job and a processed webhook
event are written to disk, then confirms one persisted outbox event can be
acknowledged by a named downstream consumer while a second outbox event remains
ready after restart.

`verify:state-persistence-pg-flow` runs the same restart verification against
the PostgreSQL backend. Use `INTEGRATION_HUB_STATE_BACKEND=postgres` and
`INTEGRATION_HUB_STATE_PG_URL` in runtime environments when retry jobs and
webhook logs should survive restarts without relying on local JSON files.

`verify:retry-sweep-flow` boots a mock Twenty API and `integration-hub`,
forces the first lead write to fail with a retryable `500`, confirms the job is
queued in `/api/sync-jobs`, then triggers `POST /api/scheduler/retry-sweep` and
verifies that the queued job is retried successfully and marked as `succeeded`.

`verify:lead-assignment-flow` boots a mock Twenty API and verifies the
phase-1 `productCategory -> country -> default` assignment logic. It confirms
that a newly created lead receives the configured `assignedToId` and that the
initial first response task is created for the assigned owner.

`POST /api/ai-assistant/suggestions` and `POST /api/ai-assistant/generate`
now accept an optional `workspaceContext` object with `workspace`,
`entityType`, `entityId`, `ownerId`, `channel`, `stage`, `pathname`, and
`summaryText`.
Phase-1 AI output stays suggestion-only: summary, next action, draft, and lead
score are allowed, while CRM status mutation remains forbidden. Mail context is
also supported in phase 1 so the frontend dock can generate reply summaries,
follow-up order suggestions, and email drafts without acting as an auto-send
system.

The exported `ops-weekly-summary.md` now calls out the active `State Backend`
inside the `Highlights` section as well as the report header. It also surfaces
`Processed Consumers` when processed outbox events have been acknowledged by
named downstream consumers.

`verify:state-persistence-flow` uses local TCP ports for the hub and mock
Twenty API. If the default mock port is unavailable on Windows, override the
ports with:

```bash
INTEGRATION_HUB_VERIFY_STATE_HUB_PORT=13024
INTEGRATION_HUB_VERIFY_STATE_MOCK_TWENTY_PORT=13304
npm run verify:state-persistence-flow
```
