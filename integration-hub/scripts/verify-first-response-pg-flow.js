'use strict';

const path = require('node:path');
const { spawnSync } = require('node:child_process');

const scriptPath = path.resolve(__dirname, 'verify-first-response-flow.js');
const result = spawnSync(process.execPath, [scriptPath], {
  cwd: path.resolve(__dirname, '..'),
  env: {
    ...process.env,
    INTEGRATION_HUB_STATE_BACKEND: 'postgres',
    INTEGRATION_HUB_STATE_PG_URL:
      process.env.INTEGRATION_HUB_STATE_PG_URL ||
      process.env.PG_DATABASE_URL ||
      'postgres://postgres:postgres@127.0.0.1:5432/default',
  },
  stdio: 'inherit',
});

process.exit(result.status ?? 1);
