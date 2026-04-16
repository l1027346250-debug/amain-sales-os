'use strict';

const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');

const HUB_PORT = 3026;
const HUB_BASE_URL = `http://127.0.0.1:${HUB_PORT}`;

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

async function main() {
  const integrationHubRoot = path.resolve(__dirname, '..');
  const stateDir = fs.mkdtempSync(
    path.join(os.tmpdir(), 'trade-crm-lead-intake-'),
  );
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

    const validPayload = {
      source: 'MANUAL_IMPORT',
      externalId: 'manual-verify-001',
      leadName: 'Nordic Medical Buyer',
      contactName: 'Emma Li',
      companyName: 'Nordic Med AB',
      email: 'Emma@NordicMed.Example',
      phone: '+46 70 123 4567',
      country: 'Sweden',
      productCategory: 'ULTRASOUND',
      interestedProduct: 'Portable Ultrasound',
      message: 'Need price and lead time',
      notes: 'Imported during intake verification',
    };

    const validResponse = await requestJson(
      `${HUB_BASE_URL}/api/ingest/leads`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validPayload),
      },
    );

    if (!validResponse.ok) {
      throw new Error(`Lead intake request failed: ${JSON.stringify(validResponse.body)}`);
    }

    if (validResponse.body?.deduplication?.strategy !== 'email') {
      throw new Error(
        `Expected email deduplication strategy, received ${validResponse.body?.deduplication?.strategy}`,
      );
    }

    if (validResponse.body?.deduplication?.confidence !== 'high') {
      throw new Error(
        `Expected high deduplication confidence, received ${validResponse.body?.deduplication?.confidence}`,
      );
    }

    if (validResponse.body?.deduplication?.recommendedAction !== 'merge_or_update') {
      throw new Error(
        `Expected merge_or_update recommended action, received ${validResponse.body?.deduplication?.recommendedAction}`,
      );
    }

    if (validResponse.body?.twentyRequest?.mode !== 'prepared') {
      throw new Error(
        `Expected prepared mode without a configured Twenty API key, received ${validResponse.body?.twentyRequest?.mode}`,
      );
    }

    const invalidResponse = await requestJson(
      `${HUB_BASE_URL}/api/ingest/leads`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source: 'MANUAL_IMPORT',
          leadName: 'Bad Payload',
          email: 'not-an-email',
        }),
      },
    );

    if (invalidResponse.status !== 400) {
      throw new Error(
        `Expected invalid payload to be rejected with 400, received ${invalidResponse.status}`,
      );
    }

    console.log(
      JSON.stringify(
        {
          status: 'ok',
          deduplicationStrategy: validResponse.body?.deduplication?.strategy ?? null,
          deduplicationConfidence: validResponse.body?.deduplication?.confidence ?? null,
          recommendedAction:
            validResponse.body?.deduplication?.recommendedAction ?? null,
          normalizedMatch:
            validResponse.body?.deduplication?.matchedOn?.[0]?.normalizedValue ?? null,
          invalidPayloadRejected: true,
          preparedMode: validResponse.body?.twentyRequest?.mode === 'prepared',
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
