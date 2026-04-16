'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const repoRoot = path.resolve(__dirname, '..');
const artifactsDir = path.join(repoRoot, 'tmp', 'trade-crm-readiness');
const summaryPath = path.join(artifactsDir, 'phase1-readiness-summary.json');
const markdownPath = path.join(artifactsDir, 'phase1-readiness-summary.md');
const quiet = process.argv.includes('--quiet');
const skipSmoke = process.argv.includes('--skip-smoke');

const commands = [
  {
    id: 'frontend-typecheck',
    cwd: path.join(repoRoot, 'packages', 'twenty-front'),
    command: 'node',
    args: ['..\\..\\node_modules\\typescript\\bin\\tsc', '-p', 'tsconfig.json', '--noEmit'],
    description: 'Front-end full TypeScript check',
  },
  {
    id: 'integration-hub-typecheck',
    cwd: path.join(repoRoot, 'integration-hub'),
    command: 'node',
    args: ['..\\node_modules\\typescript\\bin\\tsc', '-p', 'tsconfig.json', '--noEmit'],
    description: 'Integration hub TypeScript check',
  },
  ...(
    skipSmoke
      ? []
      : [
          {
            id: 'trade-crm-smoke',
            cwd: repoRoot,
            command: 'node',
            args: ['scripts/verify-trade-crm-smoke.js', '--quiet'],
            description: 'Trade CRM smoke verification',
          },
        ]
  ),
];

const resolveSpawnSpec = (command, args) => {
  if (process.platform !== 'win32') {
    return { command, args };
  }

  if (command === 'node') {
    return { command: process.execPath, args };
  }

  if (command === 'npm') {
    return {
      command: process.env.ComSpec || 'cmd.exe',
      args: ['/d', '/s', '/c', 'npm.cmd', ...args],
    };
  }

  return { command, args };
};

const runStep = (step) => {
  const { command, args } = resolveSpawnSpec(step.command, step.args);
  const startedAt = new Date().toISOString();
  const result = spawnSync(command, args, {
    cwd: step.cwd,
    env: process.env,
    encoding: 'utf8',
  });
  const finishedAt = new Date().toISOString();
  const output = `${result.stdout ?? ''}\n${result.stderr ?? ''}`.trim();

  const status = result.status === 0 && !result.error ? 'passed' : 'failed';
  const errorMessage = result.error
    ? `${result.error.name}: ${result.error.message}`
    : null;

  if (!quiet) {
    console.log(
      JSON.stringify(
        {
          id: step.id,
          status,
          command: [command, ...args].join(' '),
          cwd: step.cwd,
        },
        null,
        2,
      ),
    );
    if (output) {
      console.log(output);
    }
    if (errorMessage) {
      console.log(errorMessage);
    }
  }

  return {
    id: step.id,
    description: step.description,
    command: [command, ...args].join(' '),
    cwd: step.cwd,
    status,
    startedAt,
    finishedAt,
    exitCode: result.status ?? 1,
    outputSnippet: output.split('\n').slice(-20).join('\n'),
    errorMessage,
  };
};

const main = () => {
  fs.mkdirSync(artifactsDir, { recursive: true });

  const results = commands.map(runStep);
  const failed = results.filter((result) => result.status === 'failed');
  const status = failed.length === 0 ? 'passed' : 'failed';

  const summary = {
    status,
    startedAt: results[0]?.startedAt ?? new Date().toISOString(),
    finishedAt: new Date().toISOString(),
    skipSmoke,
    checks: results,
    failedCheckIds: failed.map((item) => item.id),
    artifacts: {
      summaryPath,
      markdownPath,
    },
  };

  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

  const markdown = [
    '# Trade CRM Phase 1 Readiness Summary',
    '',
    `Status: ${status.toUpperCase()}`,
    `Skip smoke: ${skipSmoke ? 'yes' : 'no'}`,
    '',
    '## Checks',
    ...results.map(
      (result) =>
        `- ${result.id}: ${result.status.toUpperCase()} (${result.description})`,
    ),
    '',
    '## Failed Checks',
    ...(failed.length > 0
      ? failed.map((result) => `- ${result.id} (exit code ${result.exitCode})`)
      : ['- none']),
  ].join('\n');

  fs.writeFileSync(markdownPath, `${markdown}\n`);

  console.log(
    JSON.stringify(
      {
        status,
        summaryPath,
        markdownPath,
        failedCheckIds: summary.failedCheckIds,
      },
      null,
      2,
    ),
  );

  if (status !== 'passed') {
    process.exit(1);
  }
};

main();
