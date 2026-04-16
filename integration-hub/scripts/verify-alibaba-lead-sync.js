'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');

const HUB_PORT = 3022;
const MOCK_TWENTY_PORT = 3302;
const HUB_BASE_URL = `http://127.0.0.1:${HUB_PORT}`;
const MOCK_TWENTY_BASE_URL = `http://127.0.0.1:${MOCK_TWENTY_PORT}`;
const ALIBABA_SHARED_SECRET = 'alibaba-test-secret';

const leadStore = new Map();
const createRequests = [];
const updateRequests = [];

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

const parseFilterValue = (filter, fieldName) => {
  const match = filter.match(new RegExp(`${fieldName}\\[eq\\]:\\\\?"([^"]+)`));

  return match ? match[1].replace(/\\"/g, '"') : null;
};

function createMockTwentyServer() {
  return http.createServer(async (req, res) => {
    if (!req.url) {
      res.statusCode = 404;
      res.end();
      return;
    }

    const requestUrl = new URL(req.url, MOCK_TWENTY_BASE_URL);

    if (req.method === 'GET' && requestUrl.pathname === '/rest/leads') {
      const filter = requestUrl.searchParams.get('filter') || '';
      const email = parseFilterValue(filter, 'email');
      const phone = parseFilterValue(filter, 'phone');
      const matchedLead = Array.from(leadStore.values()).find((lead) => {
        if (email && lead.email === email) {
          return true;
        }

        if (phone && lead.phone === phone) {
          return true;
        }

        return false;
      });

      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          data: {
            leads: matchedLead ? [matchedLead] : [],
          },
        }),
      );

      return;
    }

    if (req.method === 'POST' && requestUrl.pathname === '/rest/leads') {
      const payload = await readJsonBody(req);
      const record = {
        id: `lead-${createRequests.length + 1}`,
        ...payload,
      };

      createRequests.push(payload);
      leadStore.set(record.id, record);

      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          data: {
            createLead: record,
          },
        }),
      );

      return;
    }

    if (
      req.method === 'PATCH' &&
      requestUrl.pathname.startsWith('/rest/leads/')
    ) {
      const leadId = requestUrl.pathname.split('/').pop();
      const payload = await readJsonBody(req);
      const existingLead = leadId ? leadStore.get(leadId) : null;

      if (!existingLead) {
        res.statusCode = 404;
        res.end(JSON.stringify({ message: 'Lead not found' }));
        return;
      }

      const updatedLead = {
        ...existingLead,
        ...payload,
      };

      updateRequests.push({
        leadId,
        payload,
      });
      leadStore.set(leadId, updatedLead);

      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          data: {
            updateLead: updatedLead,
          },
        }),
      );

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

  return {
    status: response.status,
    ok: response.ok,
    body,
  };
}

function buildSignature(payload) {
  return crypto
    .createHmac('sha256', ALIBABA_SHARED_SECRET)
    .update(JSON.stringify(payload))
    .digest('hex');
}

async function main() {
  const integrationHubRoot = path.resolve(__dirname, '..');
  const stateDir = fs.mkdtempSync(
    path.join(os.tmpdir(), 'trade-crm-alibaba-sync-'),
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
      ALIBABA_SHARED_SECRET,
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

    const initialPayload = {
      inquiryId: 'alibaba-inquiry-001',
      leadName: 'Acme Medical Buyer',
      contactName: 'Alice',
      email: 'buyer@acme.example',
      phone: '+1-555-0101',
      country: 'US',
      productCategory: 'MEDICAL_DEVICES',
      message: 'Need a quotation for 500 units.',
    };
    const updatePayload = {
      ...initialPayload,
      inquiryId: 'alibaba-inquiry-002',
      phone: '+1-555-0102',
      message: 'Updated quantity to 700 units.',
    };

    const createResponse = await requestJson(
      `${HUB_BASE_URL}/api/ingest/alibaba/leads`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-alibaba-signature': buildSignature(initialPayload),
        },
        body: JSON.stringify(initialPayload),
      },
    );

    if (!createResponse.ok) {
      throw new Error(`Lead create request failed: ${JSON.stringify(createResponse.body)}`);
    }

    if (createResponse.body?.twentyRequest?.operation !== 'created') {
      throw new Error(
        `Expected first lead sync to create a lead, received ${createResponse.body?.twentyRequest?.operation}`,
      );
    }

    if (createRequests.length !== 1) {
      throw new Error(
        `Expected 1 lead create request against mock Twenty, received ${createRequests.length}`,
      );
    }

    const updateResponse = await requestJson(
      `${HUB_BASE_URL}/api/ingest/alibaba/leads`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-alibaba-signature': buildSignature(updatePayload),
        },
        body: JSON.stringify(updatePayload),
      },
    );

    if (!updateResponse.ok) {
      throw new Error(`Lead update request failed: ${JSON.stringify(updateResponse.body)}`);
    }

    if (updateResponse.body?.twentyRequest?.operation !== 'updated') {
      throw new Error(
        `Expected second lead sync to update a lead, received ${updateResponse.body?.twentyRequest?.operation}`,
      );
    }

    if (updateRequests.length !== 1) {
      throw new Error(
        `Expected 1 lead update request against mock Twenty, received ${updateRequests.length}`,
      );
    }

    const invalidSignatureResponse = await requestJson(
      `${HUB_BASE_URL}/api/ingest/alibaba/leads`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-alibaba-signature': 'invalid-signature',
        },
        body: JSON.stringify({
          ...initialPayload,
          inquiryId: 'alibaba-inquiry-invalid',
        }),
      },
    );

    if (invalidSignatureResponse.status !== 401) {
      throw new Error(
        `Expected invalid signature to be rejected with 401, received ${invalidSignatureResponse.status}`,
      );
    }

    console.log(
      JSON.stringify(
        {
          status: 'ok',
          createdLeadRequestCount: createRequests.length,
          updatedLeadRequestCount: updateRequests.length,
          createdLeadId: createResponse.body?.twentyRequest?.recordId ?? null,
          updatedLeadId: updateResponse.body?.twentyRequest?.recordId ?? null,
          updatedPhone: updateRequests[0]?.payload?.phone ?? null,
          invalidSignatureRejected: true,
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
