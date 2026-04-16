'use strict';

const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const { Client } = require('pg');

const HUB_PORT = 3021;
const MOCK_TWENTY_PORT = 3301;
const HUB_BASE_URL = `http://127.0.0.1:${HUB_PORT}`;
const MOCK_TWENTY_BASE_URL = `http://127.0.0.1:${MOCK_TWENTY_PORT}`;
const stateBackend = process.env.INTEGRATION_HUB_STATE_BACKEND || 'file';
const statePgUrl =
  process.env.INTEGRATION_HUB_STATE_PG_URL ||
  process.env.PG_DATABASE_URL ||
  'postgres://postgres:postgres@127.0.0.1:5432/default';

const recordedTasks = [];

function startHubProcess(integrationHubRoot, stateDir) {
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
      TWENTY_WEBHOOK_SECRET: 'replace-me',
      ALIBABA_SHARED_SECRET: 'replace-me',
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

  return {
    process: hubProcess,
    readStderr: () => stderr,
  };
}

function createMockTwentyServer() {
  const overdueLead = {
    id: 'lead-overdue-1',
    leadName: 'Acme Medical Inquiry',
    email: 'buyer@acme.example',
    assignedToId: 'member-001',
    createdAt: new Date(Date.now() - 13 * 60 * 60 * 1000).toISOString(),
  };

  return http.createServer((req, res) => {
    if (!req.url) {
      res.statusCode = 404;
      res.end();
      return;
    }

    if (req.method === 'GET' && req.url.startsWith('/rest/leads')) {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ data: { leads: [overdueLead] } }));
      return;
    }

    if (req.method === 'POST' && req.url === '/rest/tasks') {
      let body = '';

      req.on('data', (chunk) => {
        body += chunk.toString();
      });

      req.on('end', () => {
        const payload = JSON.parse(body || '{}');
        recordedTasks.push(payload);
        res.setHeader('Content-Type', 'application/json');
        res.end(
          JSON.stringify({
            data: {
              createTask: {
                id: 'task-001',
                ...payload,
              },
            },
          }),
        );
      });

      return;
    }

    res.statusCode = 404;
    res.end(JSON.stringify({ message: 'Not found' }));
  });
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

  if (!response.ok) {
    throw new Error(
      `Request failed: ${response.status} ${response.statusText} ${text}`,
    );
  }

  return body;
}

async function truncateLeadMonitoringStateIfNeeded() {
  if (stateBackend !== 'postgres') {
    return;
  }

  const client = new Client({ connectionString: statePgUrl });

  await client.connect();

  try {
    await client.query('TRUNCATE TABLE integration_hub_lead_monitoring_state');
  } catch (error) {
    if (!String(error.message).includes('does not exist')) {
      throw error;
    }
  } finally {
    await client.end();
  }
}

async function main() {
  const integrationHubRoot = path.resolve(__dirname, '..');
  const stateDir = fs.mkdtempSync(
    path.join(os.tmpdir(), 'trade-crm-first-response-'),
  );
  const mockServer = createMockTwentyServer();
  let hubRuntime = null;

  await new Promise((resolve, reject) => {
    mockServer.once('error', reject);
    mockServer.listen(MOCK_TWENTY_PORT, '127.0.0.1', resolve);
  });

  try {
    await truncateLeadMonitoringStateIfNeeded();

    hubRuntime = startHubProcess(integrationHubRoot, stateDir);

    await waitForServer(`${HUB_BASE_URL}/api/health`, 15000);

    const overview = await requestJson(
      `${HUB_BASE_URL}/api/lead-monitoring/first-response?refresh=true`,
    );

    if (overview.summary.overdueCount !== 1) {
      throw new Error(
        `Expected 1 overdue lead, received ${overview.summary.overdueCount}`,
      );
    }

    const prepared = await requestJson(
      `${HUB_BASE_URL}/api/lead-monitoring/first-response/tasks/prepared`,
    );

    if (prepared.preparedTaskRequests.length !== 1) {
      throw new Error(
        `Expected 1 prepared task request, received ${prepared.preparedTaskRequests.length}`,
      );
    }

    const applied = await requestJson(
      `${HUB_BASE_URL}/api/lead-monitoring/first-response/tasks/lead-overdue-1/apply?apply=true`,
      { method: 'POST' },
    );

    if (applied.mode !== 'remote') {
      throw new Error(`Expected remote apply mode, received ${applied.mode}`);
    }

    if (recordedTasks.length !== 1) {
      throw new Error(
        `Expected mock Twenty to receive 1 task create request, received ${recordedTasks.length}`,
      );
    }

    const duplicateApply = await requestJson(
      `${HUB_BASE_URL}/api/lead-monitoring/first-response/tasks/lead-overdue-1/apply?apply=true`,
      { method: 'POST' },
    );

    if (duplicateApply.duplicate !== true) {
      throw new Error('Expected second apply to be treated as a duplicate');
    }

    if (recordedTasks.length !== 1) {
      throw new Error(
        `Expected duplicate apply not to create a second task, received ${recordedTasks.length} task requests`,
      );
    }

    if (recordedTasks[0].title !== 'First response overdue: Acme Medical Inquiry') {
      throw new Error(`Unexpected task title: ${recordedTasks[0].title}`);
    }

    const appliedList = await requestJson(
      `${HUB_BASE_URL}/api/lead-monitoring/first-response/tasks/applied`,
    );

    if (appliedList.appliedTaskRecords.length !== 1) {
      throw new Error(
        `Expected 1 applied task record, received ${appliedList.appliedTaskRecords.length}`,
      );
    }

    const appliedRecordId = appliedList.appliedTaskRecords[0].id;

    const appliedRecord = await requestJson(
      `${HUB_BASE_URL}/api/lead-monitoring/first-response/tasks/applied/${appliedRecordId}`,
    );

    if (appliedRecord.recordId !== 'task-001') {
      throw new Error(
        `Expected applied task detail to expose task-001, received ${appliedRecord.recordId}`,
      );
    }

    const leadStatus = await requestJson(
      `${HUB_BASE_URL}/api/lead-monitoring/first-response/leads/lead-overdue-1`,
    );

    if (leadStatus.status.taskApplied !== true) {
      throw new Error('Expected lead status to report taskApplied=true');
    }

    if (!hubRuntime.process.killed) {
      hubRuntime.process.kill('SIGTERM');
    }

    await new Promise((resolve) => {
      hubRuntime.process.once('exit', resolve);
      setTimeout(resolve, 3000);
    });

    hubRuntime = startHubProcess(integrationHubRoot, stateDir);

    await waitForServer(`${HUB_BASE_URL}/api/health`, 15000);

    const restoredAppliedList = await requestJson(
      `${HUB_BASE_URL}/api/lead-monitoring/first-response/tasks/applied`,
    );

    if (restoredAppliedList.appliedTaskRecords.length !== 1) {
      throw new Error(
        `Expected 1 restored applied task record, received ${restoredAppliedList.appliedTaskRecords.length}`,
      );
    }

    const restoredAppliedRecord = await requestJson(
      `${HUB_BASE_URL}/api/lead-monitoring/first-response/tasks/applied/${appliedRecordId}`,
    );

    if (restoredAppliedRecord.recordId !== 'task-001') {
      throw new Error(
        `Expected restored applied task detail to expose task-001, received ${restoredAppliedRecord.recordId}`,
      );
    }

    const restoredLeadStatus = await requestJson(
      `${HUB_BASE_URL}/api/lead-monitoring/first-response/leads/lead-overdue-1`,
    );

    if (restoredLeadStatus.status.taskApplied !== true) {
      throw new Error(
        'Expected restored lead status to report taskApplied=true',
      );
    }

    console.log(
      JSON.stringify(
        {
          status: 'ok',
          stateBackend,
          overdueCount: overview.summary.overdueCount,
          preparedTaskRequestCount: prepared.preparedTaskRequests.length,
          appliedTaskId: applied.recordId,
          appliedTaskCount: appliedList.appliedTaskRecords.length,
          appliedTaskRecordLookupId: appliedRecordId,
          restoredAppliedTaskCount:
            restoredAppliedList.appliedTaskRecords.length,
          duplicateApplyBlocked: duplicateApply.duplicate,
          createdTaskTitle: recordedTasks[0].title,
        },
        null,
        2,
      ),
    );
  } finally {
    if (hubRuntime && !hubRuntime.process.killed) {
      hubRuntime.process.kill('SIGTERM');
    }

    await new Promise((resolve) => {
      if (!hubRuntime) {
        resolve();
        return;
      }

      hubRuntime.process.once('exit', resolve);
      setTimeout(resolve, 3000);
    });

    await new Promise((resolve) => mockServer.close(resolve));
    fs.rmSync(stateDir, { recursive: true, force: true });

    if (hubRuntime?.readStderr().trim()) {
      process.stderr.write(hubRuntime.readStderr());
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
