'use strict';

const http = require('node:http');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');

const HUB_PORT = 3031;
const MOCK_TWENTY_PORT = 3311;
const HUB_BASE_URL = `http://127.0.0.1:${HUB_PORT}`;
const MOCK_TWENTY_BASE_URL = `http://127.0.0.1:${MOCK_TWENTY_PORT}`;

function createMockTwentyServer() {
  const now = Date.now();
  const overdueLeads = [
    {
      id: 'lead-owner-reminder',
      leadName: 'Owner Reminder Lead',
      email: 'owner@example.com',
      assignedToId: 'member-001',
      createdAt: new Date(now - 13 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'lead-manager-escalation',
      leadName: 'Manager Escalation Lead',
      email: 'manager@example.com',
      assignedToId: 'member-002',
      createdAt: new Date(now - 26 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'lead-unassigned-overdue',
      leadName: 'Unassigned Overdue Lead',
      email: 'unassigned@example.com',
      assignedToId: null,
      createdAt: new Date(now - 27 * 60 * 60 * 1000).toISOString(),
    },
  ];

  return http.createServer((req, res) => {
    if (!req.url) {
      res.statusCode = 404;
      res.end();
      return;
    }

    if (req.method === 'GET' && req.url.startsWith('/rest/leads')) {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ data: { leads: overdueLeads } }));
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

async function main() {
  const integrationHubRoot = path.resolve(__dirname, '..');
  const stateDir = fs.mkdtempSync(
    path.join(os.tmpdir(), 'trade-crm-first-response-escalation-'),
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
      LEAD_FIRST_RESPONSE_SLA_HOURS: '12',
      LEAD_FIRST_RESPONSE_MANAGER_ESCALATION_HOURS: '24',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let stderr = '';

  hubProcess.stderr.on('data', (chunk) => {
    stderr += chunk.toString();
  });

  try {
    await waitForServer(`${HUB_BASE_URL}/api/health`, 15000);

    const overview = await requestJson(
      `${HUB_BASE_URL}/api/lead-monitoring/first-response?refresh=true`,
    );
    const managerLead = await requestJson(
      `${HUB_BASE_URL}/api/lead-monitoring/first-response/leads/lead-manager-escalation`,
    );
    const unassignedLead = await requestJson(
      `${HUB_BASE_URL}/api/lead-monitoring/first-response/leads/lead-unassigned-overdue`,
    );

    if (overview.summary.overdueCount !== 3) {
      throw new Error(
        `Expected 3 overdue leads, received ${overview.summary.overdueCount}`,
      );
    }

    if (overview.summary.ownerReminderCount !== 1) {
      throw new Error(
        `Expected 1 owner reminder lead, received ${overview.summary.ownerReminderCount}`,
      );
    }

    if (overview.summary.managerEscalationCount !== 1) {
      throw new Error(
        `Expected 1 manager escalation lead, received ${overview.summary.managerEscalationCount}`,
      );
    }

    if (overview.summary.unassignedOverdueCount !== 1) {
      throw new Error(
        `Expected 1 unassigned overdue lead, received ${overview.summary.unassignedOverdueCount}`,
      );
    }

    if (managerLead.reminderLevel !== 'manager_escalation') {
      throw new Error(
        `Expected manager escalation level, received ${managerLead.reminderLevel}`,
      );
    }

    if (unassignedLead.reminderLevel !== 'unassigned_overdue') {
      throw new Error(
        `Expected unassigned overdue level, received ${unassignedLead.reminderLevel}`,
      );
    }

    console.log(
      JSON.stringify(
        {
          status: 'ok',
          summary: overview.summary,
          managerLeadReminderLevel: managerLead.reminderLevel,
          unassignedLeadReminderLevel: unassignedLead.reminderLevel,
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
