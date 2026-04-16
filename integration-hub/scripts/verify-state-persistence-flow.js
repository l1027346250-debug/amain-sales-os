'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { Client } = require('pg');

const HUB_PORT = Number(process.env.INTEGRATION_HUB_VERIFY_STATE_HUB_PORT || 3024);
const MOCK_TWENTY_PORT = Number(
  process.env.INTEGRATION_HUB_VERIFY_STATE_MOCK_TWENTY_PORT || 3304,
);
const HUB_BASE_URL = `http://127.0.0.1:${HUB_PORT}`;
const MOCK_TWENTY_BASE_URL = `http://127.0.0.1:${MOCK_TWENTY_PORT}`;
const ALIBABA_SHARED_SECRET = 'alibaba-persistence-secret';
const TWENTY_WEBHOOK_SECRET = 'twenty-persistence-secret';
const stateBackend = process.env.INTEGRATION_HUB_STATE_BACKEND || 'file';
const statePgUrl =
  process.env.INTEGRATION_HUB_STATE_PG_URL ||
  process.env.PG_DATABASE_URL ||
  'postgres://postgres:postgres@127.0.0.1:5432/default';

function createMockTwentyServer() {
  return http.createServer((req, res) => {
    if (!req.url) {
      res.statusCode = 404;
      res.end();
      return;
    }

    const requestUrl = new URL(req.url, MOCK_TWENTY_BASE_URL);

    if (req.method === 'GET' && requestUrl.pathname === '/rest/leads') {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ message: 'temporary upstream failure' }));
      return;
    }

    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ message: 'Not found' }));
  });
}

function buildHmacSignature(secret, payload) {
  return crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
}

async function waitForServer(url, timeoutMs) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);

      if (response.ok) {
        return;
      }
    } catch {}

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Timed out waiting for ${url}`);
}

async function requestJson(url, options) {
  const response = await fetch(url, options);
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;

  return {
    status: response.status,
    ok: response.ok,
    body,
  };
}

function startHub({ integrationHubRoot, stateDir }) {
  const mainEntry = path.join(
    integrationHubRoot,
    'dist',
    'integration-hub',
    'src',
    'main.js',
  );
  const hubProcess = spawn(process.execPath, [mainEntry], {
    cwd: integrationHubRoot,
    env: {
      ...process.env,
      PORT: String(HUB_PORT),
      TWENTY_BASE_URL: MOCK_TWENTY_BASE_URL,
      TWENTY_API_KEY: 'test-token',
      TWENTY_WEBHOOK_SECRET,
      ALIBABA_SHARED_SECRET,
      INTEGRATION_HUB_STATE_DIR: stateDir,
      INTEGRATION_HUB_STATE_BACKEND: stateBackend,
      INTEGRATION_HUB_STATE_PG_URL: statePgUrl,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let stderr = '';

  hubProcess.stderr.on('data', (chunk) => {
    stderr += chunk.toString();
  });

  return { hubProcess, getStderr: () => stderr };
}

function runNodeScript(scriptPath, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [scriptPath, ...args], {
      stdio: ['ignore', 'pipe', 'pipe'],
      ...options,
    });
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.once('error', reject);
    child.once('exit', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }

      reject(
        new Error(
          `Script failed with code ${code}: ${stderr || stdout || 'unknown error'}`,
        ),
      );
    });
  });
}

function copyDirectory(sourceDir, targetDir) {
  fs.mkdirSync(targetDir, { recursive: true });

  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(sourcePath, targetPath);
      continue;
    }

    fs.copyFileSync(sourcePath, targetPath);
  }
}

async function stopHub(hubProcess) {
  if (!hubProcess.killed) {
    hubProcess.kill('SIGTERM');
  }

  await new Promise((resolve) => {
    hubProcess.once('exit', resolve);
    setTimeout(resolve, 3000);
  });
}

async function truncateStateTables() {
  if (stateBackend !== 'postgres') {
    return;
  }

  const client = new Client({ connectionString: statePgUrl });

  await client.connect();

  try {
    await client.query('TRUNCATE TABLE integration_hub_sync_jobs');
    await client.query('TRUNCATE TABLE integration_hub_twenty_webhook_events');
    await client.query('TRUNCATE TABLE integration_hub_outbox_events');
  } catch (error) {
    if (!String(error.message).includes('does not exist')) {
      throw error;
    }
  } finally {
    await client.end();
  }
}

async function loadPersistedCountsFromPostgres() {
  const client = new Client({ connectionString: statePgUrl });

  await client.connect();

  try {
    const jobsResult = await client.query(
      'SELECT COUNT(*)::int AS count FROM integration_hub_sync_jobs',
    );
    const eventsResult = await client.query(
      'SELECT COUNT(*)::int AS count FROM integration_hub_twenty_webhook_events',
    );
    const outboxResult = await client.query(
      'SELECT COUNT(*)::int AS count FROM integration_hub_outbox_events',
    );

    return {
      jobs: jobsResult.rows[0]?.count ?? 0,
      webhookEvents: eventsResult.rows[0]?.count ?? 0,
      outboxEvents: outboxResult.rows[0]?.count ?? 0,
    };
  } finally {
    await client.end();
  }
}

async function main() {
  const integrationHubRoot = path.resolve(__dirname, '..');
  const stateDir = fs.mkdtempSync(
    path.join(os.tmpdir(), 'trade-crm-persistence-'),
  );
  const exportDir = path.join(stateDir, 'ops-export');
  const mockServer = createMockTwentyServer();

  await new Promise((resolve, reject) => {
    mockServer.once('error', reject);
    mockServer.listen(MOCK_TWENTY_PORT, '127.0.0.1', resolve);
  });

  const alibabaPayload = {
    inquiryId: 'alibaba-persistence-001',
    leadName: 'Persistent Retry Lead',
    contactName: 'Pat',
    email: 'pat@example.com',
    phone: '+1-555-0201',
    country: 'US',
    productCategory: 'MEDICAL_DEVICES',
    message: 'Please keep this retry job after restart.',
  };
  const webhookPayload = {
    event: 'lead.created',
    objectName: 'lead',
    data: {
      id: 'lead-persistence-001',
      leadName: 'Persistent Webhook Lead',
    },
  };
  const secondWebhookPayload = {
    event: 'lead.updated',
    objectName: 'lead',
    data: {
      id: 'lead-persistence-002',
      leadName: 'Persistent Follow-up Lead',
    },
  };

  await truncateStateTables();

  let firstHub = startHub({ integrationHubRoot, stateDir });

  try {
    await waitForServer(`${HUB_BASE_URL}/api/health`, 15000);

    const leadResponse = await requestJson(
      `${HUB_BASE_URL}/api/ingest/alibaba/leads`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-alibaba-signature': buildHmacSignature(
            ALIBABA_SHARED_SECRET,
            alibabaPayload,
          ),
        },
        body: JSON.stringify(alibabaPayload),
      },
    );

    if (leadResponse.body?.twentyRequest?.mode !== 'queued_for_retry') {
      throw new Error(
        `Expected queued_for_retry mode, received ${leadResponse.body?.twentyRequest?.mode}`,
      );
    }

    const webhookResponse = await requestJson(
      `${HUB_BASE_URL}/api/webhooks/twenty`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-twenty-signature': buildHmacSignature(
            TWENTY_WEBHOOK_SECRET,
            webhookPayload,
          ),
        },
        body: JSON.stringify(webhookPayload),
      },
    );

    if (webhookResponse.body?.routing?.status !== 'processed') {
      throw new Error(
        `Expected processed webhook, received ${webhookResponse.body?.routing?.status}`,
      );
    }

    await stopHub(firstHub.hubProcess);

    if (stateBackend === 'file') {
      const syncJobsPath = path.join(stateDir, 'sync-jobs.json');
      const webhookEventsPath = path.join(stateDir, 'twenty-webhook-events.json');
      const outboxEventsPath = path.join(stateDir, 'outbox-events.json');

      if (
        !fs.existsSync(syncJobsPath) ||
        !fs.existsSync(webhookEventsPath) ||
        !fs.existsSync(outboxEventsPath)
      ) {
        throw new Error('Expected persistence files to be created before restart');
      }

      const persistedJobs = JSON.parse(fs.readFileSync(syncJobsPath, 'utf8'));
      const persistedWebhookEvents = JSON.parse(
        fs.readFileSync(webhookEventsPath, 'utf8'),
      );
      const persistedOutboxEvents = JSON.parse(
        fs.readFileSync(outboxEventsPath, 'utf8'),
      );

      if (
        persistedJobs.length !== 1 ||
        persistedWebhookEvents.length !== 1 ||
        persistedOutboxEvents.length !== 1
      ) {
        throw new Error(
          `Unexpected persisted state counts jobs=${persistedJobs.length} webhookEvents=${persistedWebhookEvents.length} outboxEvents=${persistedOutboxEvents.length}`,
        );
      }
    } else {
      const persistedCounts = await loadPersistedCountsFromPostgres();

      if (
        persistedCounts.jobs !== 1 ||
        persistedCounts.webhookEvents !== 1 ||
        persistedCounts.outboxEvents !== 1
      ) {
        throw new Error(
          `Unexpected persisted postgres state counts jobs=${persistedCounts.jobs} webhookEvents=${persistedCounts.webhookEvents} outboxEvents=${persistedCounts.outboxEvents}`,
        );
      }
    }

    const secondHub = startHub({ integrationHubRoot, stateDir });

    try {
      await waitForServer(`${HUB_BASE_URL}/api/health`, 15000);

      const initialOutboxResponse = await requestJson(
        `${HUB_BASE_URL}/api/outbox/events?limit=5`,
      );
      const initialPersistedOutboxEvent =
        initialOutboxResponse.body?.events?.[0] ?? null;

      if (!initialPersistedOutboxEvent?.id) {
        throw new Error(
          'Expected a persisted outbox event to be available before consumer ack',
        );
      }

      const ackResponse = await requestJson(`${HUB_BASE_URL}/api/outbox/ack`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ids: [initialPersistedOutboxEvent.id],
          consumerName: 'erp-sync',
          ackedBy: 'verify-state-persistence-flow',
        }),
      });

      if (ackResponse.body?.processedCount !== 1) {
        throw new Error(
          `Expected outbox ack to process 1 event, received ${JSON.stringify(ackResponse.body)}`,
        );
      }

      const secondWebhookResponse = await requestJson(
        `${HUB_BASE_URL}/api/webhooks/twenty`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-twenty-signature': buildHmacSignature(
              TWENTY_WEBHOOK_SECRET,
              secondWebhookPayload,
            ),
          },
          body: JSON.stringify(secondWebhookPayload),
        },
      );

      if (secondWebhookResponse.body?.routing?.status !== 'processed') {
        throw new Error(
          `Expected second processed webhook, received ${secondWebhookResponse.body?.routing?.status}`,
        );
      }

      const healthResponse = await requestJson(
        `${HUB_BASE_URL}/api/health/integration`,
      );
      const jobsResponse = await requestJson(
        `${HUB_BASE_URL}/api/sync-jobs?limit=5`,
      );
      const eventsResponse = await requestJson(
        `${HUB_BASE_URL}/api/webhooks/twenty/events?limit=5`,
      );
      const outboxResponse = await requestJson(
        `${HUB_BASE_URL}/api/outbox/events?limit=5`,
      );
      const opsStateResponse = await requestJson(
        `${HUB_BASE_URL}/api/ops/state?recent=1`,
      );
      const opsExceptionsResponse = await requestJson(
        `${HUB_BASE_URL}/api/ops/exceptions?recent=1`,
      );
      const syncJobsSummary = healthResponse.body?.syncJobs;
      const webhookSummary = healthResponse.body?.webhookEvents;
      const outboxSummary = healthResponse.body?.outbox;
      const persistedJob = jobsResponse.body?.jobs?.[0] ?? null;
      const persistedEvent = eventsResponse.body?.events?.[0] ?? null;
      const persistedOutboxEvent = outboxResponse.body?.events?.[0] ?? null;
      const opsState = opsStateResponse.body;
      const opsExceptions = opsExceptionsResponse.body;

      if (syncJobsSummary?.pending !== 1) {
        throw new Error(
          `Expected pending sync jobs to persist after restart, received ${JSON.stringify(syncJobsSummary)}`,
        );
      }

      if (webhookSummary?.processed !== 2) {
        throw new Error(
          `Expected processed webhook events to persist after restart and include the second webhook, received ${JSON.stringify(webhookSummary)}`,
        );
      }

      if (outboxSummary?.ready !== 1 || outboxSummary?.processed !== 1) {
        throw new Error(
          `Expected 1 ready and 1 processed outbox event after restart, received ${JSON.stringify(outboxSummary)}`,
        );
      }

      if (!persistedJob?.id || !persistedEvent?.id || !persistedOutboxEvent?.id) {
        throw new Error(
          'Expected persisted sync job, webhook event, and outbox event to be queryable after restart',
        );
      }

      if (opsState?.syncJobs?.summary?.pending !== 1) {
        throw new Error(
          `Expected ops state to report 1 pending sync job, received ${JSON.stringify(opsState?.syncJobs?.summary)}`,
        );
      }

      if (opsState?.webhookEvents?.summary?.processed !== 2) {
        throw new Error(
          `Expected ops state to report 2 processed webhook events, received ${JSON.stringify(opsState?.webhookEvents?.summary)}`,
        );
      }

      if (
        opsState?.outbox?.summary?.ready !== 1 ||
        opsState?.outbox?.summary?.processed !== 1
      ) {
        throw new Error(
          `Expected ops state to report 1 ready and 1 processed outbox event, received ${JSON.stringify(opsState?.outbox?.summary)}`,
        );
      }

      if (opsState?.outbox?.summary?.processedByConsumer?.['erp-sync'] !== 1) {
        throw new Error(
          `Expected ops state to report 1 processed outbox event for erp-sync, received ${JSON.stringify(opsState?.outbox?.summary?.processedByConsumer)}`,
        );
      }

      if (opsState?.syncJobs?.recentJobs?.length !== 1) {
        throw new Error(
          `Expected ops state to include 1 recent sync job, received ${opsState?.syncJobs?.recentJobs?.length}`,
        );
      }

      if (opsState?.webhookEvents?.recentEvents?.length !== 1) {
        throw new Error(
          `Expected ops state to include 1 recent webhook event, received ${opsState?.webhookEvents?.recentEvents?.length}`,
        );
      }

      if (opsState?.outbox?.recentEvents?.length !== 1) {
        throw new Error(
          `Expected ops state to include 1 recent outbox event, received ${opsState?.outbox?.recentEvents?.length}`,
        );
      }

      if (opsExceptions?.syncJobs?.pendingCount !== 1) {
        throw new Error(
          `Expected ops exceptions to report 1 pending sync job, received ${opsExceptions?.syncJobs?.pendingCount}`,
        );
      }

      if (opsExceptions?.syncJobs?.recentSyncErrors?.length !== 1) {
        throw new Error(
          `Expected ops exceptions to include 1 recent sync error, received ${opsExceptions?.syncJobs?.recentSyncErrors?.length}`,
        );
      }

      if (opsExceptions?.webhookEvents?.failedCount !== 0) {
        throw new Error(
          `Expected ops exceptions to report 0 failed webhook events, received ${opsExceptions?.webhookEvents?.failedCount}`,
        );
      }

      if (
        opsExceptions?.outbox?.readyCount !== 1 ||
        opsExceptions?.outbox?.processedCount !== 1
      ) {
        throw new Error(
          `Expected ops exceptions to report 1 ready and 1 processed outbox event, received ${JSON.stringify(opsExceptions?.outbox)}`,
        );
      }

      const exportScriptPath = path.join(
        integrationHubRoot,
        'scripts',
        'export-ops-report.js',
      );
      const exportResult = await runNodeScript(
        exportScriptPath,
        [
          `--base-url=${HUB_BASE_URL}`,
          '--recent=1',
          `--out-dir=${exportDir}`,
        ],
        {
          cwd: integrationHubRoot,
        },
      );
      const exportSummary = JSON.parse(exportResult.stdout);
      const exportedState = JSON.parse(
        fs.readFileSync(exportSummary.files.state, 'utf8'),
      );
      const exportedExceptions = JSON.parse(
        fs.readFileSync(exportSummary.files.exceptions, 'utf8'),
      );
      const exportedMarkdown = fs.readFileSync(
        exportSummary.files.markdown,
        'utf8',
      );
      const exportedWeeklySummary = fs.readFileSync(
        exportSummary.files.weeklySummary,
        'utf8',
      );

      if (exportedState.syncJobs?.summary?.pending !== 1) {
        throw new Error(
          `Expected exported state JSON to report 1 pending sync job, received ${exportedState.syncJobs?.summary?.pending}`,
        );
      }

      if (
        exportedState.outbox?.summary?.ready !== 1 ||
        exportedState.outbox?.summary?.processed !== 1
      ) {
        throw new Error(
          `Expected exported state JSON to report 1 ready and 1 processed outbox event, received ${JSON.stringify(exportedState.outbox?.summary)}`,
        );
      }

      if (exportedState.outbox?.summary?.processedByConsumer?.['erp-sync'] !== 1) {
        throw new Error(
          `Expected exported state JSON to report erp-sync processed outbox count, received ${JSON.stringify(exportedState.outbox?.summary?.processedByConsumer)}`,
        );
      }

      if (exportedExceptions.syncJobs?.pendingCount !== 1) {
        throw new Error(
          `Expected exported exceptions JSON to report 1 pending sync job, received ${exportedExceptions.syncJobs?.pendingCount}`,
        );
      }

      if (
        exportedExceptions.outbox?.readyCount !== 1 ||
        exportedExceptions.outbox?.processedCount !== 1
      ) {
        throw new Error(
          `Expected exported exceptions JSON to report 1 ready and 1 processed outbox event, received ${JSON.stringify(exportedExceptions.outbox)}`,
        );
      }

      if (
        !exportedMarkdown.includes('## Exceptions') ||
        !exportedMarkdown.includes('Pending Jobs: 1') ||
        !exportedMarkdown.includes('Ready Outbox Events: 1') ||
        !exportedMarkdown.includes('## Outbox Audit Snapshot') ||
        !exportedMarkdown.includes('Processed Outbox Events: 1') ||
        !exportedMarkdown.includes('Processed Consumers: erp-sync=1') ||
        !exportedMarkdown.includes(`State Backend: ${stateBackend}`)
      ) {
        throw new Error(
          'Expected exported markdown report to include exception summary and state backend',
        );
      }

      if (
        !exportedWeeklySummary.includes('## Risks') ||
        !exportedWeeklySummary.includes('## Follow-up') ||
        !exportedWeeklySummary.includes(
          'Audit Status: mixed (processed history exists while some outbox events are still waiting)',
        ) ||
        !exportedWeeklySummary.includes('Ready Outbox Events: 1') ||
        !exportedWeeklySummary.includes('Processed Outbox Events: 1') ||
        !exportedWeeklySummary.includes('Processed Consumers: erp-sync=1') ||
        !exportedWeeklySummary.includes(
          'Processed Consumer Audit Summary: 1 downstream consumer acknowledged processed outbox events: erp-sync (1).',
        ) ||
        !exportedWeeklySummary.includes(
          'Processed Consumer Audit Summary (ZH): 当前有 1 个下游消费方已确认 processed outbox 事件：erp-sync（1）。',
        ) ||
        !exportedWeeklySummary.includes(`State Backend: ${stateBackend}`)
      ) {
        throw new Error(
          'Expected exported weekly summary markdown to include risk/follow-up sections and state backend',
        );
      }

      const jobDetailResponse = await requestJson(
        `${HUB_BASE_URL}/api/sync-jobs/${persistedJob.id}`,
      );
      const eventDetailResponse = await requestJson(
        `${HUB_BASE_URL}/api/webhooks/twenty/events/${persistedEvent.id}`,
      );
      const outboxDetailResponse = await requestJson(
        `${HUB_BASE_URL}/api/outbox/events/${persistedOutboxEvent.id}`,
      );

      if (jobDetailResponse.body?.id !== persistedJob.id) {
        throw new Error('Persisted sync job detail lookup returned unexpected payload');
      }

      if (eventDetailResponse.body?.id !== persistedEvent.id) {
        throw new Error('Persisted webhook event detail lookup returned unexpected payload');
      }

      if (outboxDetailResponse.body?.id !== persistedOutboxEvent.id) {
        throw new Error('Persisted outbox event detail lookup returned unexpected payload');
      }

      const smokeArtifactsDir = process.env.TRADE_CRM_SMOKE_ARTIFACTS_DIR;

      if (smokeArtifactsDir) {
        copyDirectory(exportSummary.outDir, smokeArtifactsDir);
      }

      console.log(
        JSON.stringify(
          {
            status: 'ok',
            stateBackend,
            persistedSyncJobs: syncJobsSummary?.pending ?? 0,
            persistedWebhookEvents: webhookSummary?.processed ?? 0,
            persistedOutboxEvents: outboxSummary?.total ?? 0,
            processedOutboxConsumers:
              opsState?.outbox?.summary?.processedByConsumer ?? {},
            persistedSyncJobId: persistedJob.id,
            persistedWebhookEventId: persistedEvent.id,
            persistedOutboxEventId: initialPersistedOutboxEvent.id,
            opsStateDir: opsState?.stateDir ?? null,
            opsExceptionPendingCount:
              opsExceptions?.syncJobs?.pendingCount ?? null,
            exportedReportDir: exportSummary.outDir,
            smokeArtifactsDir: smokeArtifactsDir ?? null,
            stateDir,
          },
          null,
          2,
        ),
      );
    } finally {
      await stopHub(secondHub.hubProcess);

      if (secondHub.getStderr().trim()) {
        process.stderr.write(secondHub.getStderr());
      }
    }
  } finally {
    await new Promise((resolve) => mockServer.close(resolve));
    fs.rmSync(stateDir, { recursive: true, force: true });

    if (firstHub?.getStderr()?.trim()) {
      process.stderr.write(firstHub.getStderr());
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
