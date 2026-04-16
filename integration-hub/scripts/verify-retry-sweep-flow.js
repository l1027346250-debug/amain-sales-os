'use strict';

const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');

const HUB_PORT = 3027;
const MOCK_TWENTY_PORT = 3307;
const HUB_BASE_URL = `http://127.0.0.1:${HUB_PORT}`;
const MOCK_TWENTY_BASE_URL = `http://127.0.0.1:${MOCK_TWENTY_PORT}`;

let failFirstLeadWrite = true;
let createdLeadCount = 0;

const readJsonBody = (req) =>
  new Promise((resolve, reject) => {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });

    req.on('error', reject);
  });

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

function createMockTwentyServer() {
  return http.createServer(async (req, res) => {
    if (!req.url) {
      res.statusCode = 404;
      res.end();
      return;
    }

    const requestUrl = new URL(req.url, MOCK_TWENTY_BASE_URL);

    if (req.method === 'GET' && requestUrl.pathname === '/rest/leads') {
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          data: {
            leads: [],
          },
        }),
      );

      return;
    }

    if (req.method === 'POST' && requestUrl.pathname === '/rest/leads') {
      const payload = await readJsonBody(req);

      if (failFirstLeadWrite) {
        failFirstLeadWrite = false;
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(
          JSON.stringify({
            message: 'temporary upstream failure',
          }),
        );

        return;
      }

      createdLeadCount += 1;
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          data: {
            createLead: {
              id: `lead-${createdLeadCount}`,
              ...payload,
            },
          },
        }),
      );

      return;
    }

    res.statusCode = 404;
    res.end(JSON.stringify({ message: 'Not found' }));
  });
}

async function main() {
  const integrationHubRoot = path.resolve(__dirname, '..');
  const stateDir = fs.mkdtempSync(
    path.join(os.tmpdir(), 'trade-crm-retry-sweep-'),
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
    env: {
      ...process.env,
      PORT: String(HUB_PORT),
      TWENTY_BASE_URL: MOCK_TWENTY_BASE_URL,
      TWENTY_API_KEY: 'test-token',
      TWENTY_WEBHOOK_SECRET: 'replace-me',
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

    const intakeResponse = await requestJson(`${HUB_BASE_URL}/api/ingest/leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source: 'MANUAL_IMPORT',
        leadName: 'Retry Sweep Lead',
        companyName: 'Retry Medical',
        email: 'retry@medical.example',
      }),
    });

    if (!intakeResponse.ok) {
      throw new Error(`Lead intake failed: ${JSON.stringify(intakeResponse.body)}`);
    }

    if (intakeResponse.body?.twentyRequest?.mode !== 'queued_for_retry') {
      throw new Error(
        `Expected first intake attempt to queue for retry, received ${JSON.stringify(intakeResponse.body?.twentyRequest)}`,
      );
    }

    const pendingJobsResponse = await requestJson(
      `${HUB_BASE_URL}/api/sync-jobs?status=pending&target=twenty.leads`,
    );

    if (pendingJobsResponse.body?.total !== 1) {
      throw new Error(
        `Expected one pending sync job before retry sweep, received ${JSON.stringify(pendingJobsResponse.body)}`,
      );
    }

    const retrySweepResponse = await requestJson(
      `${HUB_BASE_URL}/api/scheduler/retry-sweep?force=true`,
      {
        method: 'POST',
      },
    );

    if (!retrySweepResponse.ok) {
      throw new Error(
        `Manual retry sweep failed: ${JSON.stringify(retrySweepResponse.body)}`,
      );
    }

    if (
      retrySweepResponse.body?.scannedJobs !== 1 ||
      retrySweepResponse.body?.succeededJobs !== 1
    ) {
      throw new Error(
        `Expected retry sweep to succeed one job, received ${JSON.stringify(retrySweepResponse.body)}`,
      );
    }

    const succeededJobsResponse = await requestJson(
      `${HUB_BASE_URL}/api/sync-jobs?status=succeeded&target=twenty.leads`,
    );
    const schedulerStatusResponse = await requestJson(
      `${HUB_BASE_URL}/api/scheduler/status`,
    );

    if (succeededJobsResponse.body?.total !== 1) {
      throw new Error(
        `Expected one succeeded sync job after retry sweep, received ${JSON.stringify(succeededJobsResponse.body)}`,
      );
    }

    if (
      schedulerStatusResponse.body?.retrySweep?.lastSummary?.succeededJobs !== 1
    ) {
      throw new Error(
        `Expected scheduler status to expose the latest retry sweep summary, received ${JSON.stringify(schedulerStatusResponse.body)}`,
      );
    }

    console.log(
      JSON.stringify(
        {
          status: 'ok',
          queuedRetryJobId: intakeResponse.body?.twentyRequest?.retryJobId ?? null,
          pendingJobCount: pendingJobsResponse.body?.total ?? null,
          succeededJobCount: succeededJobsResponse.body?.total ?? null,
          retrySweepSummary: retrySweepResponse.body ?? null,
          schedulerStatus: schedulerStatusResponse.body?.retrySweep ?? null,
          createdLeadCount,
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

    await new Promise((resolve) => mockServer.close(resolve));
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
