'use strict';

const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');

const HUB_PORT = 3028;
const MOCK_TWENTY_PORT = 3308;
const HUB_BASE_URL = `http://127.0.0.1:${HUB_PORT}`;
const MOCK_TWENTY_BASE_URL = `http://127.0.0.1:${MOCK_TWENTY_PORT}`;

const createdLeads = [];
const createdTasks = [];

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
      createdLeads.push(payload);

      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          data: {
            createLead: {
              id: `lead-${createdLeads.length}`,
              ...payload,
            },
          },
        }),
      );

      return;
    }

    if (req.method === 'POST' && requestUrl.pathname === '/rest/tasks') {
      const payload = await readJsonBody(req);
      createdTasks.push(payload);

      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          data: {
            createTask: {
              id: `task-${createdTasks.length}`,
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
    path.join(os.tmpdir(), 'trade-crm-lead-assignment-'),
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
      LEAD_ASSIGNMENT_RULES_JSON: JSON.stringify([
        {
          id: 'ultrasound-rule',
          matchField: 'productCategory',
          matchValue: 'Ultrasound',
          assigneeId: 'member-001',
        },
      ]),
      LEAD_FIRST_RESPONSE_TASK_AUTO_APPLY: 'true',
      LEAD_FIRST_RESPONSE_TASK_DUE_HOURS: '2',
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
        externalId: 'assign-001',
        leadName: 'Assigned Ultrasound Lead',
        companyName: 'Ultrasound Buyer LLC',
        contactName: 'Nina',
        email: 'nina@ultrasound.example',
        country: 'United Arab Emirates',
        productCategory: 'Ultrasound',
      }),
    });

    if (!intakeResponse.ok) {
      throw new Error(`Lead intake failed: ${JSON.stringify(intakeResponse.body)}`);
    }

    if (intakeResponse.body?.assignment?.status !== 'assigned') {
      throw new Error(
        `Expected assignment status assigned, received ${JSON.stringify(intakeResponse.body?.assignment)}`,
      );
    }

    if (intakeResponse.body?.assignment?.strategy !== 'product_category') {
      throw new Error(
        `Expected product_category routing, received ${intakeResponse.body?.assignment?.strategy}`,
      );
    }

    if (createdLeads.length !== 1) {
      throw new Error(`Expected 1 created lead, received ${createdLeads.length}`);
    }

    if (createdLeads[0].assignedToId !== 'member-001') {
      throw new Error(
        `Expected created lead assignedToId=member-001, received ${createdLeads[0].assignedToId}`,
      );
    }

    if (createdTasks.length !== 1) {
      throw new Error(`Expected 1 created first response task, received ${createdTasks.length}`);
    }

    if (createdTasks[0].assigneeId !== 'member-001') {
      throw new Error(
        `Expected created task assigneeId=member-001, received ${createdTasks[0].assigneeId}`,
      );
    }

    if (!String(createdTasks[0].title).startsWith('First response:')) {
      throw new Error(`Unexpected task title: ${createdTasks[0].title}`);
    }

    if (intakeResponse.body?.firstResponseTask?.status !== 'created') {
      throw new Error(
        `Expected first response task status created, received ${JSON.stringify(intakeResponse.body?.firstResponseTask)}`,
      );
    }

    console.log(
      JSON.stringify(
        {
          status: 'ok',
          assignment: intakeResponse.body?.assignment ?? null,
          firstResponseTaskStatus: intakeResponse.body?.firstResponseTask?.status ?? null,
          createdLeadAssignedToId: createdLeads[0].assignedToId ?? null,
          createdTaskAssigneeId: createdTasks[0].assigneeId ?? null,
          createdTaskTitle: createdTasks[0].title ?? null,
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
