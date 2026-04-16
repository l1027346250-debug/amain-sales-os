'use strict';

const http = require('node:http');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn, spawnSync } = require('node:child_process');

const HUB_PORT = 3032;
const MOCK_TWENTY_PORT = 3312;
const HUB_BASE_URL = `http://127.0.0.1:${HUB_PORT}`;
const MOCK_TWENTY_BASE_URL = `http://127.0.0.1:${MOCK_TWENTY_PORT}`;
const FETCH_TIMEOUT_MS = 3000;

const recordedTasks = [];

function createMockTwentyServer() {
  const opportunities = [
    {
      id: 'opp-quotation-overdue-1',
      name: 'Ultrasound Quote Follow-up',
      stage: 'Quotation Sent',
      assignedToId: 'member-101',
      companyName: 'Acme Medical',
      updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  return http.createServer((req, res) => {
    if (!req.url) {
      res.statusCode = 404;
      res.end();
      return;
    }

    if (req.method === 'GET' && req.url.startsWith('/rest/opportunities')) {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ data: { opportunities } }));
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
                id: `task-${recordedTasks.length}`,
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

async function fetchWithTimeout(url, options) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

function buildChildEnv(overrides) {
  const merged = {
    ...process.env,
    ...overrides,
  };

  if (process.platform !== 'win32') {
    return merged;
  }

  const normalizedEntries = new Map();

  for (const [key, value] of Object.entries(merged)) {
    const normalizedKey = key.toLowerCase() === 'path' ? 'Path' : key;

    for (const existingKey of normalizedEntries.keys()) {
      if (existingKey.toLowerCase() === normalizedKey.toLowerCase()) {
        normalizedEntries.delete(existingKey);
        break;
      }
    }

    normalizedEntries.set(normalizedKey, value);
  }

  return Object.fromEntries(normalizedEntries);
}

async function waitForServer(url, timeoutMs) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    try {
      const response = await fetchWithTimeout(url);

      if (response.ok) {
        return;
      }
    } catch {}

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Timed out waiting for ${url}`);
}

async function requestJson(url, options) {
  const response = await fetchWithTimeout(url, options);
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(
      `Request failed: ${response.status} ${response.statusText} ${text}`,
    );
  }

  return body;
}

async function waitForChildExit(child, timeoutMs) {
  if (!child || child.exitCode !== null) {
    return;
  }

  await new Promise((resolve) => {
    const timer = setTimeout(resolve, timeoutMs);

    child.once('exit', () => {
      clearTimeout(timer);
      resolve();
    });
  });
}

function terminateProcessTree(child) {
  if (!child || child.exitCode !== null || !child.pid) {
    return;
  }

  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/pid', String(child.pid), '/t', '/f'], {
      stdio: 'ignore',
    });
    return;
  }

  child.kill('SIGTERM');
}

async function closeServer(server, timeoutMs) {
  if (!server?.listening) {
    return;
  }

  await new Promise((resolve) => {
    const timer = setTimeout(() => {
      server.closeAllConnections?.();
      resolve();
    }, timeoutMs);

    server.close(() => {
      clearTimeout(timer);
      resolve();
    });
  });
}

async function main() {
  const integrationHubRoot = path.resolve(__dirname, '..');
  const stateDir = fs.mkdtempSync(
    path.join(os.tmpdir(), 'trade-crm-quotation-followup-'),
  );
  const mainEntry = path.join(
    integrationHubRoot,
    'dist',
    'integration-hub',
    'src',
    'main.js',
  );
  const mockServer = createMockTwentyServer();

  await new Promise((resolve, reject) => {
    mockServer.once('error', reject);
    mockServer.listen(MOCK_TWENTY_PORT, '127.0.0.1', resolve);
  });

  const hubProcess = spawn(process.execPath, [mainEntry], {
    cwd: integrationHubRoot,
    env: buildChildEnv({
      ...process.env,
      PORT: String(HUB_PORT),
      TWENTY_BASE_URL: MOCK_TWENTY_BASE_URL,
      TWENTY_API_KEY: 'test-token',
      TWENTY_WEBHOOK_SECRET: 'replace-me',
      ALIBABA_SHARED_SECRET: 'replace-me',
      INTEGRATION_HUB_STATE_DIR: stateDir,
      OPPORTUNITY_QUOTE_FOLLOWUP_AFTER_DAYS: '3',
      OPPORTUNITY_QUOTE_FOLLOWUP_TASK_AUTO_APPLY: 'true',
      OPPORTUNITY_QUOTE_FOLLOWUP_TASK_DUE_HOURS: '0',
    }),
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let stdout = '';
  let stderr = '';

  hubProcess.stdout.on('data', (chunk) => {
    stdout += chunk.toString();
  });

  hubProcess.stderr.on('data', (chunk) => {
    stderr += chunk.toString();
  });

  try {
    await waitForServer(`${HUB_BASE_URL}/api/health`, 15000);

    const overview = await requestJson(
      `${HUB_BASE_URL}/api/opportunity-monitoring/quote-follow-up?refresh=true`,
    );

    if (overview.summary.overdueCount !== 1) {
      throw new Error(
        `Expected 1 overdue quotation opportunity, received ${overview.summary.overdueCount}`,
      );
    }

    if (recordedTasks.length !== 1) {
      throw new Error(
        `Expected 1 quotation follow-up task to be auto-created, received ${recordedTasks.length}`,
      );
    }

    const opportunityStatus = await requestJson(
      `${HUB_BASE_URL}/api/opportunity-monitoring/quote-follow-up/opportunities/opp-quotation-overdue-1`,
    );

    if (opportunityStatus.status.taskApplied !== true) {
      throw new Error(
        'Expected overdue quotation opportunity to report taskApplied=true',
      );
    }

    const applied = await requestJson(
      `${HUB_BASE_URL}/api/opportunity-monitoring/quote-follow-up/tasks/applied`,
    );

    if (applied.appliedTaskRecords.length !== 1) {
      throw new Error(
        `Expected 1 applied quotation follow-up task record, received ${applied.appliedTaskRecords.length}`,
      );
    }

    console.log(
      JSON.stringify(
        {
          status: 'ok',
          overdueCount: overview.summary.overdueCount,
          appliedTaskCount: applied.appliedTaskRecords.length,
          createdTaskTitle: recordedTasks[0].title,
          createdTaskAssigneeId: recordedTasks[0].assigneeId,
        },
        null,
        2,
      ),
    );
  } finally {
    terminateProcessTree(hubProcess);
    await waitForChildExit(hubProcess, 5000);
    await closeServer(mockServer, 5000);
    fs.rmSync(stateDir, { recursive: true, force: true });

    if (stdout.trim()) {
      process.stdout.write(stdout);
    }

    if (stderr.trim()) {
      process.stderr.write(stderr);
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
