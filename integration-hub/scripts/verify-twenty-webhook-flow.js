'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');

const HUB_PORT = 3023;
const HUB_BASE_URL = `http://127.0.0.1:${HUB_PORT}`;
const TWENTY_WEBHOOK_SECRET = 'twenty-webhook-test-secret';
const OUTBOX_CONSUMER_NAME = 'erp-sync';
const OUTBOX_ACKED_BY = 'verify-twenty-webhook-flow';

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

function buildSignature(payload) {
  return crypto
    .createHmac('sha256', TWENTY_WEBHOOK_SECRET)
    .update(JSON.stringify(payload))
    .digest('hex');
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

async function main() {
  const integrationHubRoot = path.resolve(__dirname, '..');
  const stateDir = fs.mkdtempSync(
    path.join(os.tmpdir(), 'trade-crm-twenty-webhook-'),
  );
  const exportDir = path.join(stateDir, 'outbox-export');
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
      TWENTY_BASE_URL: 'http://127.0.0.1:3999',
      TWENTY_API_KEY: 'replace-me',
      TWENTY_WEBHOOK_SECRET,
      ALIBABA_SHARED_SECRET: 'replace-me',
      INTEGRATION_HUB_STATE_DIR: stateDir,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let stderr = '';

  hubProcess.stderr.on('data', (chunk) => {
    stderr += chunk.toString();
  });

  try {
    await waitForServer(`${HUB_BASE_URL}/api/health`, 15000);

    const processedPayload = {
      event: 'lead.created',
      objectName: 'lead',
      data: {
        id: 'lead-webhook-001',
        leadName: 'Webhook Lead',
      },
    };
    const ignoredPayload = {
      event: 'company.created',
      objectName: 'company',
      data: {
        id: 'company-webhook-001',
        name: 'Webhook Company',
      },
    };
    const secondProcessedPayload = {
      event: 'lead.updated',
      objectName: 'lead',
      data: {
        id: 'lead-webhook-002',
        leadName: 'Webhook Lead Updated',
      },
    };
    const failedPayload = {
      event: 'lead.created',
      objectName: 'lead',
      data: {
        leadName: 'Missing Id Payload',
      },
    };

    const processedResponse = await requestJson(
      `${HUB_BASE_URL}/api/webhooks/twenty`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-twenty-signature': buildSignature(processedPayload),
        },
        body: JSON.stringify(processedPayload),
      },
    );

    if (!processedResponse.ok) {
      throw new Error(
        `Processed webhook request failed: ${JSON.stringify(processedResponse.body)}`,
      );
    }

    if (processedResponse.body?.routing?.status !== 'processed') {
      throw new Error(
        `Expected lead.created to be processed, received ${processedResponse.body?.routing?.status}`,
      );
    }

    const secondProcessedResponse = await requestJson(
      `${HUB_BASE_URL}/api/webhooks/twenty`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-twenty-signature': buildSignature(secondProcessedPayload),
        },
        body: JSON.stringify(secondProcessedPayload),
      },
    );

    if (!secondProcessedResponse.ok) {
      throw new Error(
        `Second processed webhook request failed: ${JSON.stringify(secondProcessedResponse.body)}`,
      );
    }

    if (secondProcessedResponse.body?.routing?.status !== 'processed') {
      throw new Error(
        `Expected lead.updated to be processed, received ${secondProcessedResponse.body?.routing?.status}`,
      );
    }

    const ignoredResponse = await requestJson(
      `${HUB_BASE_URL}/api/webhooks/twenty`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-twenty-signature': buildSignature(ignoredPayload),
        },
        body: JSON.stringify(ignoredPayload),
      },
    );

    if (!ignoredResponse.ok) {
      throw new Error(
        `Ignored webhook request failed: ${JSON.stringify(ignoredResponse.body)}`,
      );
    }

    if (ignoredResponse.body?.routing?.status !== 'ignored') {
      throw new Error(
        `Expected company.created to be ignored, received ${ignoredResponse.body?.routing?.status}`,
      );
    }

    const failedResponse = await requestJson(
      `${HUB_BASE_URL}/api/webhooks/twenty`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-twenty-signature': buildSignature(failedPayload),
        },
        body: JSON.stringify(failedPayload),
      },
    );

    if (failedResponse.status !== 422) {
      throw new Error(
        `Expected invalid handled webhook payload to return 422, received ${failedResponse.status}`,
      );
    }

    const invalidSignatureResponse = await requestJson(
      `${HUB_BASE_URL}/api/webhooks/twenty`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-twenty-signature': 'invalid-signature',
        },
        body: JSON.stringify({
          event: 'lead.updated',
          objectName: 'lead',
          data: { id: 'lead-webhook-invalid' },
        }),
      },
    );

    if (invalidSignatureResponse.status !== 401) {
      throw new Error(
        `Expected invalid webhook signature to return 401, received ${invalidSignatureResponse.status}`,
      );
    }

    const healthResponse = await requestJson(
      `${HUB_BASE_URL}/api/health/integration`,
    );
    const outboxResponse = await requestJson(
      `${HUB_BASE_URL}/api/outbox/events?limit=5`,
    );
    const outboxConsumeResponse = await requestJson(
      `${HUB_BASE_URL}/api/outbox/consume?limit=5&aggregateType=lead`,
    );
    const firstLeadCreatedEvent = (outboxResponse.body?.events ?? []).find(
      (event) => event?.eventType === 'lead.created',
    );

    if (!firstLeadCreatedEvent?.createdAt) {
      throw new Error('Expected lead.created outbox event to expose createdAt for since filtering');
    }

    const outboxConsumeSinceResponse = await requestJson(
      `${HUB_BASE_URL}/api/outbox/consume?limit=5&aggregateType=lead&since=${encodeURIComponent(firstLeadCreatedEvent.createdAt)}`,
    );
    const outboxEventIds = (outboxResponse.body?.events ?? []).map((event) => event?.id);

    if (outboxEventIds.length !== 2 || outboxEventIds.some((id) => typeof id !== 'string')) {
      throw new Error('Expected 2 outbox event ids to be available for batch ack verification');
    }

    const outboxAckResponse = await requestJson(
      `${HUB_BASE_URL}/api/outbox/ack`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ids: outboxEventIds,
          consumerName: OUTBOX_CONSUMER_NAME,
          ackedBy: OUTBOX_ACKED_BY,
        }),
      },
    );
    const outboxProcessedResponse = await requestJson(
      `${HUB_BASE_URL}/api/outbox/events?limit=5&status=processed`,
    );
    const outboxProcessedByConsumerResponse = await requestJson(
      `${HUB_BASE_URL}/api/outbox/events?limit=5&status=processed&consumerName=${OUTBOX_CONSUMER_NAME}`,
    );
    const outboxReadyResponse = await requestJson(
      `${HUB_BASE_URL}/api/outbox/events?limit=5&status=ready`,
    );
    const outboxReadyByConsumerResponse = await requestJson(
      `${HUB_BASE_URL}/api/outbox/consume?limit=5&consumerName=${OUTBOX_CONSUMER_NAME}`,
    );
    const opsStateResponse = await requestJson(
      `${HUB_BASE_URL}/api/ops/state?recent=5`,
    );
    const opsExceptionsResponse = await requestJson(
      `${HUB_BASE_URL}/api/ops/exceptions?recent=5`,
    );

    const webhookSummary = healthResponse.body?.webhookEvents;
    const outboxSummary = healthResponse.body?.outbox;
    const outboxEvents = outboxResponse.body?.events ?? [];
    const outboxConsumeBatch = outboxConsumeResponse.body;
    const outboxConsumeSinceBatch = outboxConsumeSinceResponse.body;
    const processedOutboxEvents = outboxProcessedResponse.body?.events ?? [];
    const processedOutboxEventsByConsumer =
      outboxProcessedByConsumerResponse.body?.events ?? [];
    const readyOutboxEvents = outboxReadyResponse.body?.events ?? [];
    const readyOutboxEventsByConsumer =
      outboxReadyByConsumerResponse.body?.events ?? [];
    const opsOutbox = opsStateResponse.body?.outbox;
    const opsExceptionOutbox = opsExceptionsResponse.body?.outbox;

    const exportOutboxBatchScriptPath = path.join(
      integrationHubRoot,
      'scripts',
      'export-outbox-batch.js',
    );
    const exportOutboxBatchResult = await runNodeScript(
      exportOutboxBatchScriptPath,
      [
        `--base-url=${HUB_BASE_URL}`,
        '--limit=5',
        '--aggregate-type=lead',
        `--consumer-name=${OUTBOX_CONSUMER_NAME}`,
        `--since=${firstLeadCreatedEvent.createdAt}`,
        `--out-file=${path.join(exportDir, 'outbox-batch.json')}`,
      ],
      {
        cwd: integrationHubRoot,
      },
    );
    const exportOutboxBatchSummary = JSON.parse(exportOutboxBatchResult.stdout);
    const exportedOutboxBatch = JSON.parse(
      fs.readFileSync(exportOutboxBatchSummary.outFile, 'utf8'),
    );
    const exportProcessedOutboxBatchResult = await runNodeScript(
      exportOutboxBatchScriptPath,
      [
        `--base-url=${HUB_BASE_URL}`,
        '--status=processed',
        '--limit=5',
        '--aggregate-type=lead',
        `--consumer-name=${OUTBOX_CONSUMER_NAME}`,
        `--since=${firstLeadCreatedEvent.createdAt}`,
        `--out-file=${path.join(exportDir, 'outbox-processed-batch.json')}`,
      ],
      {
        cwd: integrationHubRoot,
      },
    );
    const exportProcessedOutboxBatchSummary = JSON.parse(
      exportProcessedOutboxBatchResult.stdout,
    );
    const exportedProcessedOutboxBatch = JSON.parse(
      fs.readFileSync(exportProcessedOutboxBatchSummary.outFile, 'utf8'),
    );

    if (
      webhookSummary?.processed !== 2 ||
      webhookSummary?.ignored !== 1 ||
      webhookSummary?.failed !== 1
    ) {
      throw new Error(
        `Unexpected webhook summary: ${JSON.stringify(webhookSummary)}`,
      );
    }

    if (outboxSummary?.ready !== 2) {
      throw new Error(
        `Expected outbox ready count to be 2, received ${JSON.stringify(outboxSummary)}`,
      );
    }

    if (
      outboxEvents.length !== 2 ||
      !outboxEvents.some((event) => event?.eventType === 'lead.created') ||
      !outboxEvents.some((event) => event?.eventType === 'lead.updated')
    ) {
      throw new Error(
        `Expected lead.created and lead.updated outbox events, received ${JSON.stringify(outboxEvents)}`,
      );
    }

    if (
      outboxConsumeBatch?.eventCount !== 2 ||
      outboxConsumeBatch?.aggregateType !== 'lead' ||
      !outboxConsumeBatch?.events?.some((event) => event?.eventType === 'lead.created') ||
      !outboxConsumeBatch?.events?.some((event) => event?.eventType === 'lead.updated')
    ) {
      throw new Error(
        `Expected outbox consume batch to expose 2 lead events, received ${JSON.stringify(outboxConsumeBatch)}`,
      );
    }

    if (
      outboxConsumeSinceBatch?.eventCount !== 1 ||
      outboxConsumeSinceBatch?.since !== firstLeadCreatedEvent.createdAt ||
      outboxConsumeSinceBatch?.events?.[0]?.eventType !== 'lead.updated'
    ) {
      throw new Error(
        `Expected outbox since consume batch to expose only the later lead.updated event, received ${JSON.stringify(outboxConsumeSinceBatch)}`,
      );
    }

    if (
      !outboxAckResponse.ok ||
      outboxAckResponse.body?.requestedCount !== 2 ||
      outboxAckResponse.body?.processedCount !== 2
    ) {
      throw new Error(
        `Expected outbox batch ack to mark 2 events as processed, received ${JSON.stringify(outboxAckResponse.body)}`,
      );
    }

    if (
      !outboxAckResponse.body?.events?.every(
        (event) =>
          event?.consumerName === OUTBOX_CONSUMER_NAME &&
          event?.ackedBy === OUTBOX_ACKED_BY &&
          event?.status === 'processed',
      )
    ) {
      throw new Error(
        `Expected batch ack to persist consumer metadata, received ${JSON.stringify(outboxAckResponse.body)}`,
      );
    }

    if (
      processedOutboxEvents.length !== 2 ||
      !outboxEventIds.every((id) =>
        processedOutboxEvents.some((event) => event?.id === id),
      )
    ) {
      throw new Error(
        `Expected processed outbox listing to expose both acked events, received ${JSON.stringify(processedOutboxEvents)}`,
      );
    }

    if (
      !processedOutboxEvents.every(
        (event) =>
          event?.consumerName === OUTBOX_CONSUMER_NAME &&
          event?.ackedBy === OUTBOX_ACKED_BY &&
          typeof event?.processedAt === 'string',
      )
    ) {
      throw new Error(
        `Expected processed outbox events to expose consumer audit metadata, received ${JSON.stringify(processedOutboxEvents)}`,
      );
    }

    if (
      processedOutboxEventsByConsumer.length !== 2 ||
      !processedOutboxEventsByConsumer.every(
        (event) => event?.consumerName === OUTBOX_CONSUMER_NAME,
      )
    ) {
      throw new Error(
        `Expected processed outbox consumer filter to return 2 erp-sync events, received ${JSON.stringify(processedOutboxEventsByConsumer)}`,
      );
    }

    if (readyOutboxEvents.length !== 0) {
      throw new Error(
        `Expected ready outbox listing to be empty after ack, received ${JSON.stringify(readyOutboxEvents)}`,
      );
    }

    if (readyOutboxEventsByConsumer.length !== 0) {
      throw new Error(
        `Expected ready outbox consumer filter to stay empty after ack, received ${JSON.stringify(readyOutboxEventsByConsumer)}`,
      );
    }

    if (
      opsOutbox?.summary?.ready !== 0 ||
      opsOutbox?.summary?.processed !== 2 ||
      opsOutbox?.recentEvents?.length !== 2
    ) {
      throw new Error(
        `Expected ops state outbox summary to expose 2 processed and 0 ready events, received ${JSON.stringify(opsOutbox)}`,
      );
    }

    if (
      opsExceptionOutbox?.readyCount !== 0 ||
      opsExceptionOutbox?.processedCount !== 2 ||
      opsExceptionOutbox?.recentReadyEvents?.length !== 0
    ) {
      throw new Error(
        `Expected ops exceptions outbox summary to expose 0 ready and 2 processed events, received ${JSON.stringify(opsExceptionOutbox)}`,
      );
    }

    if (
      exportOutboxBatchSummary.eventCount !== 0 ||
      exportOutboxBatchSummary.consumerName !== OUTBOX_CONSUMER_NAME ||
      exportOutboxBatchSummary.aggregateType !== 'lead'
    ) {
      throw new Error(
        `Expected outbox export summary to match filtered processed consumer context, received ${JSON.stringify(exportOutboxBatchSummary)}`,
      );
    }

    if (
      exportedOutboxBatch.eventCount !== 0 ||
      exportedOutboxBatch.aggregateType !== 'lead' ||
      exportedOutboxBatch.since !== firstLeadCreatedEvent.createdAt
    ) {
      throw new Error(
        `Expected exported outbox batch file to reflect since-filtered ready queue, received ${JSON.stringify(exportedOutboxBatch)}`,
      );
    }

    if (
      exportProcessedOutboxBatchSummary.statusFilter !== 'processed' ||
      exportProcessedOutboxBatchSummary.eventCount !== 1 ||
      exportProcessedOutboxBatchSummary.consumerName !== OUTBOX_CONSUMER_NAME
    ) {
      throw new Error(
        `Expected processed outbox export summary to expose one filtered event, received ${JSON.stringify(exportProcessedOutboxBatchSummary)}`,
      );
    }

    if (
      exportedProcessedOutboxBatch.status !== 'processed' ||
      exportedProcessedOutboxBatch.eventCount !== 1 ||
      exportedProcessedOutboxBatch.events?.[0]?.eventType !== 'lead.updated' ||
      exportedProcessedOutboxBatch.events?.[0]?.consumerName !==
        OUTBOX_CONSUMER_NAME
    ) {
      throw new Error(
        `Expected processed outbox batch file to expose one filtered processed event, received ${JSON.stringify(exportedProcessedOutboxBatch)}`,
      );
    }

    console.log(
      JSON.stringify(
        {
          status: 'ok',
          processedEvent: processedResponse.body?.routing?.handler ?? null,
          ignoredEvent: ignoredResponse.body?.routing?.handler ?? null,
          failedEventRejected: true,
          invalidSignatureRejected: true,
          webhookSummary,
          outboxSummary,
          outboxConsumeEventCount: outboxConsumeBatch?.eventCount ?? null,
          outboxSinceConsumeEventCount: outboxConsumeSinceBatch?.eventCount ?? null,
          outboxExportedBatchEventCount: exportOutboxBatchSummary.eventCount ?? null,
          outboxExportedProcessedBatchEventCount:
            exportProcessedOutboxBatchSummary.eventCount ?? null,
          ackedOutboxEventCount: outboxAckResponse.body?.processedCount ?? null,
          outboxAckConsumerName: OUTBOX_CONSUMER_NAME,
          outboxAckedBy: OUTBOX_ACKED_BY,
          outboxEventTypes: outboxEvents.map((event) => event?.eventType),
        },
        null,
        2,
      ),
    );
  } finally {
    if (!hubProcess.killed) {
      hubProcess.kill('SIGTERM');
    }

    await new Promise((resolve) => {
      hubProcess.once('exit', resolve);
      setTimeout(resolve, 3000);
    });
    fs.rmSync(stateDir, { recursive: true, force: true });

    if (stderr.trim()) {
      process.stderr.write(stderr);
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
